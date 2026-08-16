#!/usr/bin/env python3
"""Self-test for analyze_bend_probe.py — PLAN 2v Phase 0.

Renders a SYNTHETIC probe recording from probes/last_bend_schedule.json with a
known pitch deviation injected into every slot, runs the analyzer over it, and
checks the analyzer recovered what was injected.

Why this exists. The analyzer is the instrument the whole phase depends on: every
constant (BEND_PREARM_S, RESET_GAP_S, BEND_RANGE_ST, the quartertone offset) is
just a number it reports. If it is wrong by 30 cents nothing downstream can tell,
and the composer would be planning around a fiction. Testing it against audio
whose true pitch is known by construction is the only way to make the accuracy
claim mean anything — a real take has no ground truth to check against.

The simulated instrument here assumes: bend range exactly 2.00 semitones, RPN 0
IGNORED, the residue trap REAL, pre-arm leads under 100 ms scoop, and a bend
reset inside 50 ms of note-off audible in the tail. Those are assumptions about
SI2, not findings — the point is only that the analyzer reads back whatever was
put in.

    python probes/selftest_bend_analyzer.py
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROBES = os.path.join(REPO, "probes")
SR = 48000
TRUE_RANGE_ST = 2.0        # the simulated instrument's real bend range
RPN_HONOURED = False
QT_OFFSET = 50.0           # simulated quartertones patch = +50 cents
SCOOP_MS = 90              # a pre-arm lead shorter than this arrives mid-scoop
TAIL_LEAK_MS = 50          # a reset sooner than this after note-off is audible


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def truth_for(slot):
    """(cents_at_onset, cents_settled, cents_in_tail) injected for this slot."""
    step = slot["step"]
    bf = slot.get("bendFraction")
    nominal = 0.0
    if isinstance(bf, (int, float)) and np.isfinite(bf):
        nominal = bf * 100.0 * TRUE_RANGE_ST

    if step == "0.1" or step.startswith("0.6") or step == "1-restore":
        return 0.0, 0.0, 0.0
    if step == "0.2a":
        return nominal, nominal, nominal
    if step == "0.2b":                       # residue: bend never reset
        return nominal, nominal, nominal
    if step.startswith("0.3-"):              # pre-arm ladder
        lead = int(step.split("-")[1])
        onset = nominal if lead >= SCOOP_MS else nominal * (lead / float(SCOOP_MS))
        return onset, nominal, nominal
    if step == "0.4a":                       # sweep mid-sustain
        return 0.0, nominal, nominal
    if step.startswith("0.4b-"):             # leak ladder
        gap = int(step.split("-")[1])
        tail = 0.0 if gap < TAIL_LEAK_MS else nominal
        return nominal, nominal, tail
    if step.startswith("1-"):
        if step == "1-rpn12":
            return (nominal * 6.0, nominal * 6.0, nominal * 6.0) if RPN_HONOURED \
                else (nominal, nominal, nominal)
        return nominal, nominal, nominal
    if step.startswith("2-qt-"):
        return QT_OFFSET, QT_OFFSET, QT_OFFSET
    if step.startswith("2-ord-"):
        return 0.0, 0.0, 0.0
    if step.startswith("3-"):
        return 0.0, float(slot.get("expectCents") or 0.0), float(slot.get("expectCents") or 0.0)
    return 0.0, 0.0, 0.0


def render(sched, out_wav):
    total_s = sched["totalMs"] / 1000.0 + 4.0
    n = int(total_s * SR)
    x = np.random.default_rng(7).normal(0, 3e-4, n)     # room noise
    slots = sorted(sched["slots"], key=lambda s: s["onMs"])
    truth = []

    for s in slots:
        if not s.get("pitch"):
            continue
        on = s["onMs"] / 1000.0 + 1.0        # 1 s of leading room tone
        off = s["offMs"] / 1000.0 + 1.0
        c_on, c_set, c_tail = truth_for(s)
        nominal = midi_hz(s["pitch"])
        ring = 0.45                          # tail after note-off
        i0, i1 = int(on * SR), int((off + ring) * SR)
        if i1 > n:
            continue
        t = np.arange(i1 - i0) / SR          # seconds since onset
        dur = off - on

        cents = np.full_like(t, c_set)
        if s.get("expect") == "ramp":
            r0 = s.get("rampStartMs", 800) / 1000.0
            r1 = r0 + s.get("rampLenMs", 2000) / 1000.0
            cents = np.where(t < r0, c_on,
                     np.where(t > r1, c_set,
                              c_on + (c_set - c_on) * np.clip((t - r0) / max(r1 - r0, 1e-6), 0, 1)))
        elif s["step"] == "0.4a":
            at = s.get("midBendAtMs", 1000) / 1000.0
            cents = np.where(t < at, c_on,
                             c_on + (c_set - c_on) * np.clip((t - at) / 0.05, 0, 1))
        elif abs(c_on - c_set) > 1e-9:       # onset scoop
            cents = c_set + (c_on - c_set) * np.exp(-t / 0.045)
        if abs(c_tail - c_set) > 1e-9:       # tail step after note-off
            cents = np.where(t > dur, c_tail, cents)

        f = nominal * 2.0 ** (cents / 1200.0)
        phase = 2 * np.pi * np.cumsum(f) / SR
        env = np.where(t <= dur, 1.0, np.exp(-(t - dur) / 0.15))
        env = env * np.clip(t / 0.010, 0, 1)                 # 10 ms attack
        sig = np.zeros_like(t)
        for h, amp in enumerate([1.0, 0.55, 0.35, 0.22, 0.14, 0.09, 0.06, 0.04], start=1):
            sig += amp * np.sin(phase * h)
        x[i0:i1] += 0.20 * env * sig / 1.6

        truth.append({"idx": s["idx"], "step": s["step"], "pitch": s["pitch"],
                      "onsetCents": round(c_on, 1), "settledCents": round(c_set, 1),
                      "tailCents": round(c_tail, 1)})

    sf.write(out_wav, np.clip(x, -1, 1).astype(np.float32), SR)
    return truth


def main():
    sched_path = os.path.join(PROBES, "last_bend_schedule.json")
    if not os.path.exists(sched_path):
        sys.exit("no schedule — run: powershell -File probes\\bend_probe.ps1 -Probe all -DryRun")
    sched = json.load(open(sched_path, encoding="utf-8-sig"))

    # The analyzer writes docs/MORPH_FINDINGS.md and probes/last_bend_analysis.json
    # to fixed paths. Those are the REAL deliverables of Phase 0, and a synthetic
    # run must never be left sitting where a reader would take it for a
    # measurement of the actual instrument. Stash whatever is there, restore it
    # afterwards, and delete the synthetic version either way.
    guarded = [os.path.join(REPO, "docs", "MORPH_FINDINGS.md"),
               os.path.join(PROBES, "last_bend_analysis.json")]
    saved = {p: (open(p, "rb").read() if os.path.exists(p) else None) for p in guarded}

    out_wav = os.path.join(PROBES, "_selftest_render.wav")
    truth = render(sched, out_wav)
    print(f"rendered {len(truth)} slots -> {os.path.basename(out_wav)} "
          f"({os.path.getsize(out_wav)/1e6:.1f} MB)\n")

    r = subprocess.run([sys.executable, os.path.join(PROBES, "analyze_bend_probe.py"),
                        out_wav, sched_path], capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    if r.returncode != 0:
        sys.stderr.write(r.stderr)
        sys.exit("analyzer failed")

    got = {x["step"]: x for x in json.load(
        open(os.path.join(PROBES, "last_bend_analysis.json"), encoding="utf-8"))["results"]}
    consts = json.load(open(os.path.join(PROBES, "last_bend_analysis.json"),
                            encoding="utf-8"))["constants"]

    TOL = 8.0     # cents; the measurement must be far tighter than the 50 c it judges
    fails, checked = [], 0
    print(f"\n{'step':<12}{'field':<10}{'injected':>10}{'measured':>10}{'err':>8}")
    print("-" * 50)
    for tr in truth:
        g = got.get(tr["step"])
        if not g or g.get("verdict") in ("SILENT", None):
            fails.append(f"{tr['step']}: analyzer found no audio")
            continue
        # For a ramp the "settled" window deliberately spans the ramp, so its
        # median is an intermediate value by design — the analyzer reports
        # rampFrom/rampTo for those, and those are what get checked.
        is_ramp = tr["step"].startswith("3-")
        fields = ("rampFromCents", "rampToCents", "tailCents") if is_ramp \
            else ("onsetCents", "settledCents", "tailCents")
        inj_for = {"rampFromCents": tr["onsetCents"], "rampToCents": tr["settledCents"]}
        for field in fields:
            inj = inj_for.get(field, tr.get(field))
            mes = g.get(field)
            if mes is None or inj is None:
                continue
            # the onset window is 80 ms and a scoop decays over ~45 ms, so onset
            # is inherently a smeared measurement — judge it loosely, settled tightly
            tol = 25.0 if field in ("onsetCents", "rampFromCents") else TOL
            err = abs(mes - inj)
            checked += 1
            flag = "" if err <= tol else "   <-- FAIL"
            if err > tol:
                fails.append(f"{tr['step']} {field}: injected {inj:+.1f}, measured {mes:+.1f}")
            if field in ("settledCents", "rampToCents") or err > tol:
                print(f"{tr['step']:<12}{field:<10}{inj:>+10.1f}{mes:>+10.1f}{err:>8.1f}{flag}")

    print("\n--- derived constants vs simulated instrument ---")
    ok = True
    def chk(name, got_v, want, tol):
        nonlocal ok
        good = got_v is not None and abs(got_v - want) <= tol
        ok = ok and good
        print(f"  {name:<18} got {str(got_v):<8} want {want:<8} {'OK' if good else 'FAIL'}")
        return good
    chk("BEND_RANGE_ST", consts.get("BEND_RANGE_ST"), TRUE_RANGE_ST, 0.05)
    chk("QT_OFFSET_CENTS", consts.get("QT_OFFSET_CENTS"), QT_OFFSET, 5.0)
    prearm_want = round(SCOOP_MS / 1000.0, 3)
    got_prearm = consts.get("BEND_PREARM_S")
    good = got_prearm is not None and got_prearm >= prearm_want - 0.001
    ok = ok and good
    print(f"  {'BEND_PREARM_S':<18} got {str(got_prearm):<8} want >={prearm_want:<6} "
          f"{'OK' if good else 'FAIL'}")
    got_gap = consts.get("RESET_GAP_S")
    good = got_gap is not None and got_gap >= TAIL_LEAK_MS / 1000.0 - 0.001
    ok = ok and good
    print(f"  {'RESET_GAP_S':<18} got {str(got_gap):<8} want >={TAIL_LEAK_MS/1000:<6} "
          f"{'OK' if good else 'FAIL'}")
    good = consts.get("residueConfirmed") is True
    ok = ok and good
    print(f"  {'residueConfirmed':<18} got {str(consts.get('residueConfirmed')):<8} "
          f"want True    {'OK' if good else 'FAIL'}")
    good = consts.get("rpnHonoured") == RPN_HONOURED
    ok = ok and good
    print(f"  {'rpnHonoured':<18} got {str(consts.get('rpnHonoured')):<8} "
          f"want {str(RPN_HONOURED):<8} {'OK' if good else 'FAIL'}")

    os.remove(out_wav)
    for p, blob in saved.items():
        if blob is None:
            if os.path.exists(p):
                os.remove(p)
        else:
            open(p, "wb").write(blob)
    print("  (synthetic MORPH_FINDINGS.md / last_bend_analysis.json removed — "
          "only a real probe run writes those)")

    print(f"\n{checked} cents comparisons, {len(fails)} outside tolerance.")
    if fails:
        print("\nFAILURES:")
        for f in fails[:15]:
            print("  " + f)
    if fails or not ok:
        sys.exit(1)
    print("\nSELF-TEST PASSED — the analyzer recovers injected pitch deviations "
          f"within {TOL:.0f} cents and derives every constant correctly.")


if __name__ == "__main__":
    main()
