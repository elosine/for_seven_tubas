# Crescendo experiments — battery, protocol, results log

*Framework: CRESCENDO_TAXONOMY.md · ensemble layer: RISSET_RECIPES.md · composer's
source notes: COMPOSER_LOG 2026-08-10. Every run logs params + WAV reference +
composer verdict verbatim. Statuses: todo / doing / done / dropped.*

## Rendering principle (D3 — applies to every experiment)

The drawn curve is **notation**: an animated curve performers follow visually. The
experiment MIDI must therefore render the **inferred performance** of the curve, not
the curve itself (D7 lineage: identity = notation; MIDI = rendering).

**Performer model v0** (assumptions — tuned by ear as results come in):
- **Lag & smoothing**: ~200 ms tracking delay; low-pass the curve — detail finer than
  ~1.5 s is trend-followed, not traced.
- **Dynamic resolution**: ~7 reliably distinct levels niente→fff; continuous motion
  but limited precision (no 128-step fidelity).
- **Shape gravity**: players impose eased onsets/arrivals (messa di voce research —
  taxonomy P4); drawn T1 tends to sound as T4.
- **Anticipation**: peaks arrive slightly early under excitement (~2–4% of L).
- **Breath**: continuous swell cap ~10–12 s; longer = micro-dip breath seams.
- **Ensemble spread**: per-player onset/tracking jitter ±50–100 ms — seven tubas are
  never sample-locked.
- **Floor**: tuba "niente" has an audible onset threshold — entries bump in at ~pp-ε.
Each experiment can render **curve-literal vs performer-model** to A/B the model
itself (first done in S1b).

## The battery

### S0 — CC#7→dB calibration — `done 2026-08-10`
Step CC#7 0→127 on held Ordinario (per adopted patch), record, RMS per step → CC→dB
transfer + inverse. All later shapes drawn in true dB space through this map.

### S1 — Trajectory shapes, single voice — `doing`
- S1a `done 2026-08-10`: **D cut** (sigmoid — "doesn't distinguish itself enough").
  Survivors: **A = "a bloom"** · **B = its own category** (linear, "probably not your
  typical crescendo") · **C = "the expected crescendo."**
  **Notation finding: a traditional hairpin ≈ C (exponential), NOT B (linear).**
- S1c `done 2026-08-10`: **the usable shape-spectrum runs linear → ≈BC-3 (slope 0.6)**.
  Composer: the "standard/expected crescendo" sits **between BC-2 and BC-3** (slopes
  0.4–0.6) — LEFTward of the original C guess. BC-1 = "a long crescendo." **Beyond
  ≈BC-3, curvature stops reading as shape and reads as a SHORTER crescendo** (BC-4,
  BC-5: "shorter crescendos rather than the same crescendo in a different curve") —
  the quiet early portion falls below the perceptual onset floor, deferring the heard
  beginning. End behavior dominates the percept (P2 confirmed by ear). Precise flip
  point not needed — "somewhere around curve three." Vocabulary for the family: TBD
  (composer will clarify).
- S1d `doing`: **bloom spectrum** (logarithmic/tanh family), matched to the BC ladder
  by start:end growth ratio — AB-1 2× (slope −0.18) · AB-2 5× (−0.29) · AB-3 11×
  (−0.37) · AB-4 25× (−0.46) · AB-5 120× (−0.62), at 1:52–3:00. Note: original A
  (−0.8) ≈ **745×** — far out on its own family; it stays at 0:02 as the extreme
  reference. Mirrored question: does heavy front-loading flip to "a SHORT crescendo
  at the start, then a long held note"?
- Open meta-question (composer): does the VISUAL shape convey the sound? Needs "a more
  scientific approach" — the visual-perception→sound pipeline study, later.
- S1a: T1/T2/T3/T4 line-up — one tuba, one mid pitch, L = 8 s, calibrated CC7.
- S1b: winner rendered curve-literal vs performer-model — does the model matter?

### S2 — Overlap statics (7 voices, fixed L) — `todo`
Stagger swept across takes: 100% (unison) · ~86% (L/7 Risset spacing) · 75% · 50% ·
25% · 0% (sequential relay). Same shape, same pitch material.

### S3 — Overlap evolution within one pattern — `todo` *(composer note)*
- S3a: overlap **increases** across the pattern (sequential → piled).
- S3b: **unison start → no overlap** (block dissolves into a relay).
- S3c (mirror, cheap): no-overlap → unison.

### S4 — Length evolution — `todo` *(composer note)*
Overlap % held constant (and a zero-overlap variant); **L grows** across the series
(e.g. 3 s → 12 s) and the reverse (12 s → 3 s). Aggregate slows/quickens its breathing.

### S5 — Shape interpolation over repetitions — `todo` *(composer note)*
A series of repeated crescendos whose curve **morphs** across the series (e.g. T2 →
T3 over 8 swells; interpolate the curve-model parameters per repetition). Also try
morphing during staggered deployment (each voice slightly further along the morph).

### S6 — Pitch/chord material set — `todo` *(composer designs the set)*
Vocabulary to run winning patterns through: unison → dyads → … → 7-note chords;
low / mid / high register placements. Composer dictates the actual pitch sets;
placeholder slots: U (unison), C3 (triadic), C5, C7 (cluster/spread), each ×3 registers.

### S7 — Ensemble Risset deployment — `todo`
Winners promoted into RISSET_RECIPES patterns: A-smooth (one swell per cycle) vs
B-ratchet (stepped series per part), stagger = L/7 baseline, then informed by S2–S4.

## Results log

*(append entries: date · experiment · params · WAV file · verdict verbatim)*

- **2026-08-10 · S0 (E0) · CC7 calibration** — WAV `reaper/Media/03-REC-260810_1134.wav`
  · Ordinario, pitch 45, vel 100, 33 retriggered steps. **Law ≈ 40·log₁₀(cc/127)**
  (steep at bottom: cc 4→8 = 11.6 dB; shallow at top: cc 120→127 = 0.9 dB). Span
  **58.1 dB**; CC 0 = silence. Map: `probes/cc7_map.json`; inverse baked into the
  score's curve sonification (verified: drawn-linear → 13.7/15.3/14.9 dB per quarter).
  Clipping: only the cc-127 step touched 0 dBFS (0.12% of samples — negligible).
  **Note for ensemble takes: drop REC fader ~−10 dB** (one tuba at full already kisses
  0 dBFS; seven will sum ~+8 dB).

- **2026-08-10 · S1a · shape line-up** — A/B/C keep, D cut (verdicts above). Technical:
  **entry-bite diagnosed and fixed** — each curve ends at CC7=127, so the next note-on
  raced UVI's volume smoothing; fix = pre-arm (entry CC sent 150 ms before note-on).
  Gain staging calibrated same session (see GAIN_STAGING.md ledger).
