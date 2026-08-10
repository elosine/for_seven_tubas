#!/usr/bin/env python3
"""Sample-length analyzer — pairs a probe recording with last_schedule.json.

For each scheduled event, measures how long audio actually sounded and classifies:
  SILENT     no audio at the expected slot (dead zone / unmapped pitch)
  FIXED      audio died clearly BEFORE note-off -> sample has its own length
  SUSTAINED  audio held until note-off (>= hold length; loops or long sample)
Cross-checks detected onsets against the schedule and reports mismatches loudly
instead of silently shifting labels (piece #3 RR-parade lesson).

Usage: python probes/analyze_sample_lengths.py <recording.wav> [schedule.json]
Writes docs/SI2_tuba_sample_lengths.md + probes/last_analysis.json
"""
import json
import sys
import os

import numpy as np
import soundfile as sf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WIN_MS = 20          # RMS window
HOP_MS = 10
ONSET_TOL_S = 1.0    # allowed drift between scheduled and detected onset
END_HOLD_S = 0.35    # envelope must stay under floor this long to count as "ended"
RING_ALLOW_S = 2.5   # tail allowance after note-off before it's suspicious
FLOOR_MARGIN_DB = 12 # sound threshold above measured noise floor


def envelope(x, sr):
    win = max(1, int(sr * WIN_MS / 1000))
    hop = max(1, int(sr * HOP_MS / 1000))
    n = 1 + max(0, (len(x) - win) // hop)
    rms = np.empty(n)
    for i in range(n):
        seg = x[i * hop : i * hop + win]
        rms[i] = np.sqrt(np.mean(seg * seg) + 1e-12)
    t = (np.arange(n) * hop + win / 2) / sr
    return t, 20 * np.log10(rms + 1e-12)


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: analyze_sample_lengths.py <recording.wav> [schedule.json]")
    wav_path = sys.argv[1]
    sched_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(REPO, "probes", "last_schedule.json")

    sched = json.load(open(sched_path, encoding="utf-8-sig"))
    events = sched["events"]
    hold_s = sched["holdMs"] / 1000.0

    x, sr = sf.read(wav_path, always_2d=True)
    x = x.mean(axis=1)
    t, env_db = envelope(x, sr)

    floor_db = np.percentile(env_db, 10)
    thresh = floor_db + FLOOR_MARGIN_DB
    above = env_db > thresh

    # Align schedule to audio: first threshold crossing = first scheduled onset (onMs=0)
    first_idx = np.argmax(above) if above.any() else None
    if first_idx is None:
        sys.exit("No audio above threshold found — wrong file, or floor too high?")
    t0 = t[first_idx]
    print(f"Noise floor {floor_db:.1f} dB, threshold {thresh:.1f} dB, first onset at {t0:.2f}s in file")

    end_hold = int(END_HOLD_S / (HOP_MS / 1000))
    results = []
    for ev in events:
        on_s = t0 + ev["onMs"] / 1000.0
        off_s = t0 + ev["offMs"] / 1000.0
        slot_end_s = off_s + RING_ALLOW_S
        i_on = np.searchsorted(t, on_s - ONSET_TOL_S)
        i_win = np.searchsorted(t, on_s + ONSET_TOL_S)
        i_end = np.searchsorted(t, slot_end_s)

        seg_above = above[i_on:i_end]
        if not seg_above[: max(1, i_win - i_on)].any():
            results.append({**ev, "verdict": "SILENT", "soundedSec": 0.0})
            continue
        onset_i = i_on + int(np.argmax(seg_above))
        onset_t = t[onset_i]
        drift = onset_t - on_s
        # find sustained silence after onset
        end_t = None
        run = 0
        for i in range(onset_i, min(i_end, len(above))):
            if not above[i]:
                run += 1
                if run >= end_hold:
                    end_t = t[i - run + 1]
                    break
            else:
                run = 0
        sounded = (end_t - onset_t) if end_t is not None else (t[min(i_end, len(t) - 1)] - onset_t)
        if end_t is None or end_t >= off_s - 0.25:
            verdict = "SUSTAINED"
        else:
            verdict = "FIXED"
        results.append({**ev, "verdict": verdict, "soundedSec": round(float(sounded), 2),
                        "onsetDriftSec": round(float(drift), 3)})

    # Cross-check: schedule count vs detections
    n_sil = sum(1 for r in results if r["verdict"] == "SILENT")
    drifts = [abs(r.get("onsetDriftSec", 0)) for r in results if r["verdict"] != "SILENT"]
    max_drift = max(drifts) if drifts else 0
    print(f"{len(results)} events: {len(results)-n_sil} sounded, {n_sil} silent. Max onset drift {max_drift:.2f}s")
    if max_drift > 0.6:
        print("WARNING: large onset drift — alignment suspect; verify labels against the printed sender log!")

    # Report
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    sci = lambda m: names[m % 12] + str(m // 12 - 1)
    lines = ["# SI2 Tuba — sample lengths (probe)", "",
             f"Probe: hold {hold_s:.0f}s · pitches {sched['pitches']} · vel {sched['velocity']}"
             f" · {sched['created'][:10]} · tuba1 pair (applies to all 7 tubas)", "",
             "SUSTAINED = held to note-off (>= hold; loops or long sample). FIXED = sample's own length.",
             "SILENT = nothing sounded at that pitch (dead zone).", "",
             "| Technique | Pitch | Verdict | Sounded (s) |", "|---|---|---|---|"]
    for r in results:
        lines.append(f"| {r['tech']} | {sci(r['pitch'])} ({r['pitch']}) | {r['verdict']} | {r['soundedSec']} |")
    md = "\n".join(lines) + "\n"
    md_path = os.path.join(REPO, "docs", "SI2_tuba_sample_lengths.md")
    open(md_path, "w", encoding="utf-8", newline="\n").write(md)
    json.dump({"schedule": sched_path, "wav": wav_path, "results": results},
              open(os.path.join(REPO, "probes", "last_analysis.json"), "w", encoding="utf-8"), indent=1)
    print(f"Wrote {md_path}")
    print(md)


if __name__ == "__main__":
    main()
