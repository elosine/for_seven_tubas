# Gain staging & loudness normalization protocol

*Cross-piece protocol (born piece #4, 2026-08-10, after the S1 clipping incident).
Repeat this when setting up ANY piece so demo/notation/monitoring levels are
consistent, clip-free, and comparable across sample libraries.*

## The principle: one job per stage

| Stage | Job | Setting |
|---|---|---|
| **MIDI** (velocity / CC7 / CC1) | *musical dynamics* — the full range is always available; never restricted to avoid clipping | free |
| **Sampler instance master** (UVI/Kontakt output) | **THE calibration knob** — set so the instrument's ceiling hits the reference level; measured, logged | per library, measured |
| **Sampler FX** | **library-shipped preset FX stay** (they're the instrument's designed sound — calibrate through them; verify via measurement that no limiter audibly squashes the top, as E0 did here). Only FX **we add** get bypassed for calibration | shipped = on, ours = off |
| **Reaper track fader** | *mix + realism offsets only* (see below) — NOT calibration | 0 dB + documented offset |
| **Reaper master** | headroom guardian — never boosted; **may be CUT for tutti monitoring** (float summing = bit-transparent upstream; recording taps pre-master) | 0 dB default, cut as needed |
| **REC track** | honest witness | 0 dB, record: output |

If a level is wrong, fix it at the stage whose job it is — never by nudging
whatever knob is nearest.

## The reference level

**An instrument's CEILING = −18 dBFS RMS on its own track.**

- *Ceiling stimulus* := sustained mid-register note, ~4 s, **velocity 127 + CC7 127**
  (+ CC1 127 on modwheel-dynamics patches) — the loudest normal playing state.
- Why −18: seven uncorrelated voices sum ≈ +8.5 dB → tutti ≈ −9.5 dBFS RMS with
  crest-factor headroom to spare. Also matches broadcast-ish practice (≈K-18).
  Works unchanged for any ensemble up to ~16 voices.
- Techniques within a library keep their **designed relative balance** — calibrate
  the instance master on the library's reference patch (Ordinario or equivalent),
  don't touch per-part faders.

## Inter-library / realism layer (track-fader offsets)

Calibration makes every library's ceiling identical (−18) — that's the *apples-to-
apples baseline*, not the musical truth. Real instruments differ: a tuba fff is not
a violin fff. That difference is applied as a **documented per-instrument dB offset
at the Reaper track fader**, from a single shared table:

| Instrument class | Offset vs. reference | Status |
|---|---|---|
| Loud brass (tuba, trombone) | **0 dB** (the reference class) | set |
| *(others: filled per piece from SPL data + ear when a mixed piece needs them)* | — | placeholder |

Same table reused across pieces → fff tuba vs fff bass clarinet has one documented
answer instead of per-session improvisation. (Piece #4 is all tubas → all offsets 0.)

## The procedure (per library / per piece setup)

1. Rack chain at protocol settings (faders 0, dynamics FX bypassed, REC armed).
2. Roll REC; run the **ceiling probe** (`probes/ceiling_probe.ps1`) — plays the
   ceiling stimulus.
3. Measure: `python probes/measure_rms.py <wav>` → RMS dBFS.
4. Adjust the **sampler instance master** by (−18 − measured) dB. Remeasure once to
   confirm ±0.5 dB.
5. Replicate the setting to sibling instances of the same library (e.g. all 14 tuba
   instances get tuba1's value).
6. Log it in the ledger below. Done — never touch it again during the piece.

Notes:
- A pure gain change does NOT invalidate CC/velocity **shape** calibrations (the E0
  CC7 map is normalized — it survives).
- Recording noticeably hot/quiet later = something drifted; consult the ledger, fix
  at the owning stage.

## Ledger

| Date | Library / instance | Reference patch | Instance master | Measured ceiling | By |
|---|---|---|---|---|---|
| 2026-08-10 | IRCAM SI2 Tuba · `Tuba1 SI2` | Ordinario (A1), pitch 45, vel 127 + CC7 127 | −7.3 dB from default (composer-set) | **−17.8 dBFS RMS**, peak −5.5 (`03-REC-260810_1204.wav`) | probe + measure_rms |
| — | `Tuba1b SI2` + tubas 2–7 pairs | same | **copy Tuba1's value** | (spot-check any one) | — |
