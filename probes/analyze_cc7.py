#!/usr/bin/env python3
"""E0 analyzer — CC#7 -> dB transfer map from a calibration recording.

Measures RMS dB of each retriggered note (schedule from cc7_calibration_probe.ps1),
writes probes/cc7_map.json: {"points": [{cc, db}...], "normalized": [{cc, x}...]}
where x = 0..1 position in the measured dB span. The composer's curve renderer uses
the inverse of this map so drawn shapes are true dB shapes.

Usage: python probes/analyze_cc7.py <recording.wav> [schedule.json]
"""
import json
import sys
import os

import numpy as np
import soundfile as sf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: analyze_cc7.py <recording.wav> [schedule.json]")
    wav_path = sys.argv[1]
    sched_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(REPO, "probes", "last_schedule.json")
    sched = json.load(open(sched_path, encoding="utf-8-sig"))
    assert sched.get("kind") == "cc7_calibration", "schedule is not a cc7 calibration run"
    events = sched["events"]

    x, sr = sf.read(wav_path, always_2d=True)
    x = x.mean(axis=1)

    # Align: first audible onset = first event with cc7 high enough to sound.
    # Robust approach: find the LOUDEST short window, assume it's the cc=127 note (last),
    # then anchor via the last event instead of the first (cc=0 notes may be silent).
    win = int(sr * 0.4)
    hop = int(sr * 0.05)
    n = 1 + (len(x) - win) // hop
    rms = np.array([np.sqrt(np.mean(x[i*hop:i*hop+win]**2) + 1e-12) for i in range(n)])
    t = (np.arange(n) * hop + win / 2) / sr
    loudest_t = t[int(np.argmax(rms))]
    last = events[-1]
    t0 = loudest_t - (last["onMs"] + sched["holdMs"] / 2) / 1000.0  # file time of schedule t=0

    floor_db = 20 * np.log10(np.percentile(rms, 5) + 1e-12)
    points = []
    for ev in events:
        a = int((t0 + ev["onMs"] / 1000.0 + 0.10) * sr)
        b = int((t0 + ev["offMs"] / 1000.0 - 0.05) * sr)
        if a < 0 or b > len(x) or b <= a:
            points.append({"cc": ev["cc7"], "db": None})
            continue
        seg = x[a:b]
        db = 20 * np.log10(np.sqrt(np.mean(seg * seg) + 1e-12))
        points.append({"cc": ev["cc7"], "db": round(float(db), 2)})

    audible = [p for p in points if p["db"] is not None and p["db"] > floor_db + 6]
    if len(audible) < 5:
        sys.exit(f"Only {len(audible)} audible steps — alignment or recording problem.")
    db_min = audible[0]["db"]
    db_max = max(p["db"] for p in audible)
    span = db_max - db_min
    normalized = [{"cc": p["cc"], "x": round((p["db"] - db_min) / span, 4)} for p in audible]

    out = {"created": sched["created"], "pitch": sched["pitches"][0], "velocity": sched["velocity"],
           "floorDb": round(float(floor_db), 2), "dbSpan": round(float(span), 2),
           "points": points, "normalized": normalized}
    out_path = os.path.join(REPO, "probes", "cc7_map.json")
    json.dump(out, open(out_path, "w", encoding="utf-8"), indent=1)

    print(f"Aligned via loudest note. Floor {floor_db:.1f} dB. Audible steps: {len(audible)}/{len(points)}")
    print(f"dB span across CC7: {span:.1f} dB (from {db_min:.1f} to {db_max:.1f})")
    print(f"Wrote {out_path}")
    print("\ncc -> dB (audible range):")
    for p in audible:
        bar = "#" * int((p["db"] - db_min) / span * 50)
        print(f"  {p['cc']:>3}  {p['db']:>7.1f}  {bar}")


if __name__ == "__main__":
    main()
