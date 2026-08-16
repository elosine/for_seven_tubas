#!/usr/bin/env python3
"""Bend-probe analyzer — PLAN 2v Phase 0.

Pairs a probe recording with probes/last_bend_schedule.json and reports, per
slot, the pitch that actually sounded in CENTS relative to the written MIDI note.
That single measurement answers every question in the suite:

  probe 0  does bend state survive a note-off (residue), how much lead does a
           pre-arm need, how soon after note-off can it be reset, does the stop
           sequence leave the rig clean            -> BEND_PREARM_S, RESET_GAP_S
  probe 1  cents achieved per fraction of full bend -> BEND_RANGE_ST, RPN honoured
  probe 2  quartertones patch offset vs ord at the same key
  probe 3  did the ramp track, and how smoothly

METHOD.  f0 by autocorrelation with parabolic peak interpolation, searched ONLY
within +/-6 semitones of the pitch the schedule says was written. That constraint
is what makes the numbers trustworthy: blind pitch detection on a brass tone
octave-errors, and an octave error would read as -1200 cents and look like a
catastrophic bend rather than a detector fault. A peak pinned to the edge of the
search band is reported as SUSPECT rather than believed.

Usage:  python probes/analyze_bend_probe.py <recording.wav> [schedule.json]
Writes: docs/MORPH_FINDINGS.md  +  probes/last_bend_analysis.json
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

WIN_MS = 20             # RMS envelope window
HOP_MS = 10
FLOOR_MARGIN_DB = 12    # "sounding" threshold above the measured noise floor
ONSET_TOL_S = 1.0       # allowed drift between scheduled and detected onset
SEARCH_ST = 6.0         # f0 search half-width, semitones around nominal
F0_HOP_MS = 10
MIN_PERIODS = 4         # analysis window = this many periods of the nominal f0
CONF_MIN = 0.30         # normalised autocorrelation peak below this = unvoiced

NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def note_name(m):
    return NAMES[int(m) % 12] + str(int(m) // 12 - 1)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def cents(f, f_ref):
    if f is None or f <= 0 or f_ref <= 0:
        return None
    return 1200.0 * np.log2(f / f_ref)


def envelope(x, sr):
    win = max(1, int(sr * WIN_MS / 1000))
    hop = max(1, int(sr * HOP_MS / 1000))
    n = 1 + max(0, (len(x) - win) // hop)
    rms = np.empty(n)
    for i in range(n):
        seg = x[i * hop: i * hop + win]
        rms[i] = np.sqrt(np.mean(seg * seg) + 1e-12)
    t = (np.arange(n) * hop + win / 2) / sr
    return t, 20 * np.log10(rms + 1e-12)


def f0_at(x, sr, start_s, dur_s, nominal_hz):
    """One f0 estimate over [start_s, start_s+dur_s). Returns (hz, confidence)."""
    i0 = int(start_s * sr)
    n = int(dur_s * sr)
    if i0 < 0 or i0 + n > len(x) or n < 64:
        return None, 0.0
    seg = x[i0: i0 + n].astype(np.float64)
    seg = seg - seg.mean()
    if np.sqrt(np.mean(seg * seg)) < 1e-6:
        return None, 0.0

    # Raw autocorrelation via FFT, then ENERGY-NORMALISED per lag.
    # Do NOT window the segment and do not use the raw r[L]: both taper the
    # correlation as the lag grows, which drags the peak toward shorter lags and
    # reads every note SHARP. Measured on the self-test that bias was +10.9 cents
    # at MIDI 46 — a fifth of the 50-cent effect this probe exists to detect, and
    # it inflated the derived bend range from 2.00 to 2.14 semitones.
    # Normalising by sqrt(E_head * E_tail) is the standard fix (the same term YIN
    # uses) and makes the estimator unbiased with lag.
    N = len(seg)
    nfft = 1 << (2 * N - 1).bit_length()
    spec = np.fft.rfft(seg, nfft)
    ac = np.fft.irfft(spec * np.conj(spec), nfft)[:N]
    if ac[0] <= 0:
        return None, 0.0

    lo_hz = nominal_hz * 2.0 ** (-SEARCH_ST / 12.0)
    hi_hz = nominal_hz * 2.0 ** (SEARCH_ST / 12.0)
    lag_min = max(2, int(sr / hi_hz))
    lag_max = min(N - 3, int(sr / lo_hz))
    if lag_max <= lag_min + 1:
        return None, 0.0

    sq = seg * seg
    csum = np.concatenate(([0.0], np.cumsum(sq)))
    lags = np.arange(0, lag_max + 2)
    e_head = csum[N - lags] - csum[0]           # energy of x[0 : N-L]
    e_tail = csum[N] - csum[lags]               # energy of x[L : N]
    norm = np.sqrt(np.maximum(e_head * e_tail, 1e-30))
    acn = ac[: lag_max + 2] / norm

    band = acn[lag_min: lag_max + 1]
    k = int(np.argmax(band)) + lag_min
    conf = float(np.clip(acn[k], 0.0, 1.0))

    # parabolic interpolation on the peak — this is what buys sub-cent resolution
    y0, y1, y2 = acn[k - 1], acn[k], acn[k + 1]
    denom = y0 - 2 * y1 + y2
    delta = 0.0 if denom == 0 else 0.5 * (y0 - y2) / denom
    lag = k + float(np.clip(delta, -1.0, 1.0))
    edge = (k <= lag_min + 1) or (k >= lag_max - 1)
    return (sr / lag if lag > 0 else None), (0.0 if edge else conf)


def f0_track(x, sr, t_start, t_end, nominal_hz):
    """f0 every F0_HOP_MS across a span. Returns (times, hz, conf) arrays."""
    win_s = max(MIN_PERIODS / nominal_hz, 0.020)
    hop_s = F0_HOP_MS / 1000.0
    ts, hz, cf = [], [], []
    t = t_start
    while t + win_s <= t_end:
        f, c = f0_at(x, sr, t, win_s, nominal_hz)
        ts.append(t + win_s / 2)
        hz.append(f if f else np.nan)
        cf.append(c)
        t += hop_s
    return np.array(ts), np.array(hz, dtype=float), np.array(cf)


def stable_cents(ts, hz, conf, nominal_hz, t_lo, t_hi):
    """Median cents over a window, ignoring low-confidence frames."""
    m = (ts >= t_lo) & (ts < t_hi) & (conf >= CONF_MIN) & np.isfinite(hz)
    if not m.any():
        return None, 0
    c = 1200.0 * np.log2(hz[m] / nominal_hz)
    return float(np.median(c)), int(m.sum())


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: analyze_bend_probe.py <recording.wav> [schedule.json]")
    wav_path = sys.argv[1]
    sched_path = (sys.argv[2] if len(sys.argv) > 2
                  else os.path.join(REPO, "probes", "last_bend_schedule.json"))

    sched = json.load(open(sched_path, encoding="utf-8-sig"))
    slots = sched["slots"]
    if isinstance(slots, dict):
        slots = [slots]
    slots = sorted(slots, key=lambda s: s["onMs"])

    x, sr = sf.read(wav_path, always_2d=True)
    x = x.mean(axis=1)
    t_env, env_db = envelope(x, sr)

    floor_db = np.percentile(env_db, 10)
    thresh = floor_db + FLOOR_MARGIN_DB
    above = env_db > thresh
    if not above.any():
        sys.exit("No audio above threshold — wrong file, or the take is silent?")
    first_idx = int(np.argmax(above))
    t0 = t_env[first_idx] - slots[0]["onMs"] / 1000.0
    print(f"file: {os.path.basename(wav_path)}  sr={sr}  len={len(x)/sr:.1f}s")
    print(f"noise floor {floor_db:.1f} dB, threshold {thresh:.1f} dB, "
          f"first onset {t_env[first_idx]:.2f}s -> schedule t=0 at {t0:.2f}s")

    results = []
    drifts = []
    for s in slots:
        on_s = t0 + s["onMs"] / 1000.0
        off_s = t0 + s["offMs"] / 1000.0
        nominal = midi_hz(s["pitch"]) if s.get("pitch") else None

        i_lo = np.searchsorted(t_env, on_s - ONSET_TOL_S)
        i_hi = np.searchsorted(t_env, on_s + ONSET_TOL_S)
        seg = above[i_lo:i_hi]
        r = {k: s[k] for k in ("idx", "probe", "step", "label", "port", "channel",
                               "pitch", "onMs", "offMs", "expect")
             if k in s}
        r["expectCents"] = s.get("expectCents")
        r["bendFraction"] = s.get("bendFraction")

        if not seg.any():
            r["verdict"] = "SILENT"
            results.append(r)
            continue
        onset_t = float(t_env[i_lo + int(np.argmax(seg))])
        r["onsetDriftSec"] = round(onset_t - on_s, 3)
        drifts.append(abs(onset_t - on_s))

        # --- silence latency (the panic slot cares about this) ---
        i_off = np.searchsorted(t_env, off_s)
        tail = above[i_off: np.searchsorted(t_env, off_s + 4.0)]
        if len(tail) and (~tail).any():
            r["silenceAfterOffSec"] = round(float(t_env[i_off + int(np.argmax(~tail))] - off_s), 3)
        else:
            r["silenceAfterOffSec"] = None

        if not nominal:
            r["verdict"] = "TIMING-ONLY"
            results.append(r)
            continue

        ts, hz, cf = f0_track(x, sr, onset_t, min(off_s + 1.5, len(x) / sr), nominal)
        r["framesVoiced"] = int(((cf >= CONF_MIN) & np.isfinite(hz)).sum())

        # ONSET cents = the first 80 ms. SETTLED = the stable middle of the note.
        # The pre-arm ladder lives entirely in the difference between these two.
        c_on, n_on = stable_cents(ts, hz, cf, nominal, onset_t, onset_t + 0.08)
        mid_lo = onset_t + 0.30
        mid_hi = max(mid_lo + 0.10, off_s - 0.15)
        c_mid, n_mid = stable_cents(ts, hz, cf, nominal, mid_lo, mid_hi)
        # TAIL = after note-off; the leak ladder lives here.
        c_tail, n_tail = stable_cents(ts, hz, cf, nominal, off_s + 0.02, off_s + 0.60)

        r["onsetCents"] = None if c_on is None else round(c_on, 1)
        r["settledCents"] = None if c_mid is None else round(c_mid, 1)
        r["tailCents"] = None if c_tail is None else round(c_tail, 1)
        r["scoopCents"] = (None if (c_on is None or c_mid is None)
                           else round(c_mid - c_on, 1))
        if c_mid is not None and c_tail is not None:
            r["tailShiftCents"] = round(c_tail - c_mid, 1)

        # derived bend range: measured cents per fraction of full bend
        bf = s.get("bendFraction")
        if bf is not None and isinstance(bf, (int, float)) and abs(bf) > 1e-6 \
                and c_mid is not None and np.isfinite(bf):
            r["derivedRangeSt"] = round(abs(c_mid / (bf * 100.0)), 3)

        if s.get("expect") == "ramp":
            span_lo = onset_t + s.get("rampStartMs", 800) / 1000.0
            span_hi = span_lo + s.get("rampLenMs", 2000) / 1000.0
            c_pre, _ = stable_cents(ts, hz, cf, nominal, onset_t + 0.15, span_lo)
            c_post, _ = stable_cents(ts, hz, cf, nominal, span_hi + 0.10, span_hi + 0.80)
            r["rampFromCents"] = None if c_pre is None else round(c_pre, 1)
            r["rampToCents"] = None if c_post is None else round(c_post, 1)
            m = (ts >= span_lo) & (ts <= span_hi) & (cf >= CONF_MIN) & np.isfinite(hz)
            if m.sum() >= 4:
                cc = 1200.0 * np.log2(hz[m] / nominal)
                # residual from a straight line = how smoothly it tracked
                fit = np.polyfit(ts[m], cc, 1)
                r["rampRmsDevCents"] = round(float(np.sqrt(np.mean((cc - np.polyval(fit, ts[m])) ** 2))), 1)

        r["verdict"] = "OK" if r["framesVoiced"] >= 3 else "WEAK"
        results.append(r)

    max_drift = max(drifts) if drifts else 0.0
    n_sil = sum(1 for r in results if r["verdict"] == "SILENT")
    print(f"{len(results)} slots: {len(results)-n_sil} sounded, {n_sil} silent. "
          f"max onset drift {max_drift:.2f}s")
    if max_drift > 0.6:
        print("WARNING: large onset drift — alignment suspect. Check the sender log "
              "before believing any label below.")

    by = lambda p: [r for r in results if r.get("probe") == p]
    lines = ["# MORPH FINDINGS — PLAN 2v", "",
             f"Probe recording `{os.path.basename(wav_path)}` analysed "
             f"{sched.get('created','')[:19]}. Test pitch "
             f"{note_name(sched.get('pitch',46))} (MIDI {sched.get('pitch',46)}).", "",
             "> Generated by `probes/analyze_bend_probe.py`. Cents are measured "
             "against the written MIDI note, f0 by autocorrelation constrained to "
             f"+/-{SEARCH_ST:.0f} semitones.", ""]

    def table(rows, cols, hdr):
        lines.append("| " + " | ".join(hdr) + " |")
        lines.append("|" + "---|" * len(hdr))
        for r in rows:
            lines.append("| " + " | ".join(
                ("—" if r.get(c) is None else str(r.get(c, "—"))) for c in cols) + " |")
        lines.append("")

    consts = {}
    if by("0"):
        lines += ["## Probe 0 — bend hygiene", ""]
        table(by("0"), ["step", "label", "verdict", "onsetCents", "settledCents",
                        "scoopCents", "tailShiftCents", "silenceAfterOffSec"],
              ["step", "what", "verdict", "onset ¢", "settled ¢", "scoop ¢",
               "tail shift ¢", "silence after off (s)"])
        res = next((r for r in by("0") if r["step"] == "0.2b"), None)
        if res and res.get("settledCents") is not None:
            real = abs(res["settledCents"]) > 20
            lines.append(f"**Residue: {'CONFIRMED' if real else 'not reproduced'}** — the "
                         f"note after an unreset bend measured {res['settledCents']:+.1f} ¢. ")
            lines.append("" if real else "If the trap does not reproduce, the protocol is still "
                                         "correct but its cost is lower than assumed.\n")
            consts["residueConfirmed"] = bool(real)
        rungs = [(int(r["step"].split("-")[1]), r) for r in by("0")
                 if r["step"].startswith("0.3-")]
        good = [ms for ms, r in sorted(rungs)
                if r.get("scoopCents") is not None and abs(r["scoopCents"]) <= 5]
        if good:
            consts["BEND_PREARM_S"] = round(min(good) / 1000.0, 3)
            lines.append(f"**BEND_PREARM_S = {consts['BEND_PREARM_S']}** "
                         f"(smallest lead whose onset was within 5 ¢ of settled).\n")
        gaps = [(int(r["step"].split("-")[1]), r) for r in by("0")
                if r["step"].startswith("0.4b-")]
        clean = [ms for ms, r in sorted(gaps)
                 if r.get("tailShiftCents") is not None and abs(r["tailShiftCents"]) <= 10]
        if clean:
            consts["RESET_GAP_S"] = round(min(clean) / 1000.0, 3)
            lines.append(f"**RESET_GAP_S = {consts['RESET_GAP_S']}** "
                         f"(shortest post-note-off gap with no audible pitch step in the tail).\n")
        panic = next((r for r in by("0") if r["step"] == "0.5"), None)
        if panic:
            lines.append(f"**Stop sequence:** silence {panic.get('silenceAfterOffSec')} s "
                         f"after the explicit note-offs.\n")

    if by("1"):
        lines += ["## Probe 1 — bend response & range", ""]
        table(by("1"), ["step", "label", "verdict", "settledCents", "bendFraction", "derivedRangeSt"],
              ["step", "what", "verdict", "measured ¢", "fraction of full bend", "implied range (st)"])
        rng = [r["derivedRangeSt"] for r in by("1")
               if r.get("derivedRangeSt") and not r["step"].startswith("1-rpn")]
        if rng:
            consts["BEND_RANGE_ST"] = round(float(np.median(rng)), 2)
            spread = max(rng) - min(rng)
            lines.append(f"**BEND_RANGE_ST = {consts['BEND_RANGE_ST']}** "
                         f"(median of {len(rng)} measurements, spread {spread:.2f}). ")
            lines.append("A large spread means the response is not linear — say so rather "
                         "than averaging it away.\n" if spread > 0.4 else "\n")
        elif by("1"):
            lines.append("**Bend appears DEAD** — no measurable cents change at any fraction. "
                         "M1/M2 route through the quartertones patch, M3 becomes stepped-only "
                         "(both fallbacks are full renders, §8 of the plan).\n")
            consts["bendDead"] = True
        rpn = next((r for r in by("1") if r["step"] == "1-rpn12"), None)
        full = next((r for r in by("1") if r["step"] == "1-1"), None)
        if rpn and rpn.get("settledCents") is not None and full and full.get("settledCents"):
            honoured = abs(rpn["settledCents"]) > abs(full["settledCents"]) * 1.5
            consts["rpnHonoured"] = bool(honoured)
            lines.append(f"**RPN 0 (bend sensitivity): {'HONOURED' if honoured else 'IGNORED'}** — "
                         f"full bend read {full['settledCents']:+.0f} ¢ before and "
                         f"{rpn['settledCents']:+.0f} ¢ after asking for 12 semitones.\n")

    if by("2"):
        lines += ["## Probe 2 — quartertones patch mapping", ""]
        pairs = []
        for r in by("2"):
            if not r["step"].startswith("2-qt-"):
                continue
            p = r["step"].split("-")[-1]
            ref = next((q for q in by("2") if q["step"] == f"2-ord-{p}"), None)
            if ref and r.get("settledCents") is not None and ref.get("settledCents") is not None:
                pairs.append({"pitch": int(p), "note": note_name(int(p)),
                              "ordCents": ref["settledCents"], "qtCents": r["settledCents"],
                              "offsetCents": round(r["settledCents"] - ref["settledCents"], 1)})
        table(pairs, ["note", "pitch", "ordCents", "qtCents", "offsetCents"],
              ["key", "MIDI", "ord ¢", "quartertones ¢", "offset ¢"])
        if pairs:
            offs = [p["offsetCents"] for p in pairs]
            med = float(np.median(offs))
            consts["QT_OFFSET_CENTS"] = round(med, 1)
            shifted = 25 <= abs(med) <= 75 and (max(offs) - min(offs)) < 40
            lines.append(f"**Median offset {med:+.1f} ¢**, spread {max(offs)-min(offs):.1f} ¢. ")
            lines.append("Consistent with the **shifted-duplicate** reading — ord + quartertones "
                         "together give full 24-TET.\n" if shifted else
                         "**NOT a clean 50-cent duplicate** — the offset varies by key, so the patch "
                         "is a remapped keyboard. Voice any quarter-tone chord against this table, "
                         "not against an assumed +50 ¢.\n")

    if by("3"):
        lines += ["## Probe 3 — bent-sample quality", ""]
        table(by("3"), ["step", "label", "verdict", "rampFromCents", "rampToCents",
                        "expectCents", "rampRmsDevCents"],
              ["step", "what", "verdict", "from ¢", "to ¢", "nominal target ¢",
               "deviation from linear (RMS ¢)"])
        lines.append("`deviation from linear` is how raggedly the ramp tracked. The **audible** "
                     "verdict (resampling artifacts) is the composer's, not the analyzer's — "
                     "record it here.\n")
        lines.append("| ramp | audible verdict (composer) |", )
        lines.append("|---|---|")
        for r in by("3"):
            lines.append(f"| {r['label']} | |")
        lines.append("")

    lines += ["## Constants derived", "", "```json",
              json.dumps(consts, indent=2), "```", "",
              "These go into the emit layer as named constants "
              "(`score/public/morph.js` / the emit layer in `composer.html`). "
              "If a value here is missing, the corresponding rung never produced a "
              "usable measurement — re-run that probe rather than guessing.", ""]

    md_path = os.path.join(REPO, "docs", "MORPH_FINDINGS.md")
    open(md_path, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    json.dump({"schedule": sched_path, "wav": wav_path,
               "constants": consts, "results": results},
              open(os.path.join(REPO, "probes", "last_bend_analysis.json"), "w",
                   encoding="utf-8"), indent=1)
    print(f"\nWrote {md_path}")
    print(json.dumps(consts, indent=2))


if __name__ == "__main__":
    main()
