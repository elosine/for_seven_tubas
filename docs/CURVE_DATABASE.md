# Curve database — crescendo styles & used patterns

*Tentative working taxonomy (composer, 2026-08-10) + the growing catalog of patterns
actually used. Entries are added as patterns get used ("document as we use").
Vocabulary: CRESCENDO_TAXONOMY.md · findings: RESEARCH_INDEX.md.*

## The three styles

| # | Style | Identity | Spectrum | Score curve model |
|---|---|---|---|---|
| **C1** | **BLOOM** | front-loaded; delivers early, rides fullness; threshold lands early (~1/3 at 5×) | ratio ladder ~2×–10:1, **narrower in practice than Surge's** (2×–5× sound alike; distinct quality near 11×) | `logarithmic`, slope < 0 |
| **C2** | **LINEAR** | even growth; "its own identity, without variability" — a point, not a family | none (ratio ≡ 1:1, threshold ≡ center) | `power`, slope 0 |
| **C3** | **SURGE** | back-loaded; anticipation then late delivery; the "expected crescendo" lives here | ratio ladder 1×–~10:1 usable; **standard = 5×**; >10:1 flips to shorter-crescendo percept | `exponential`, slope > 0 |

### Ratio ↔ slope ↔ threshold lookup

**Surge (C3)** — ratio = e^(4·slope) · threshold = position of half-loudness:

| ratio | slope | threshold |
|---|---|---|
| 2× | 0.17 | 0.59 |
| **5× (standard)** | **0.40** | **0.68** |
| 11× (boundary) | 0.60 | 0.75 |
| 25× (past — reads shorter) | 0.80 | 0.80 |

**Bloom (C1)** — ratio = cosh²(5·|slope|):

| ratio | slope | threshold |
|---|---|---|
| 2× | −0.18 | 0.42 |
| 5× | −0.29 | 0.33 |
| 11× (boundary quality) | −0.37 | 0.28 |
| 25× (past — short cresc + long tone) | −0.46 | ~0.24 |

## The ensemble dials (meta-level, composer 2026-08-10)

- **DENSITY** — voices in delivery at once (threshold-to-peak counting; apex = 7)
- **MOVEMENT** — at fixed density, the spectrum long-tones ↔ churn (rapid shortest
  swells). Identity: density = rate × delivery-time — density fixes the *product*,
  movement chooses the *split* (few-long vs many-short).
- **LEVEL** — per-swell peak scaling (how loud each swell gets)
Each dial can follow its own meta-curve (bloom/linear/surge/arch + noise).
*Metric note: threshold-to-peak counting undercounts busy short-swell textures
(preambles become audible at short L) — for churn states track SOUNDING count.*

## The realization model (Xenakis frame, composer 2026-08-10)

**Level 1 — the plot:** a drawn meta-curve over duration T describing the PERCEIVED
texture trajectory (density + movement + level). **Level 2 — the internals:** part
schedules constructed to make the ear report the plot. No linearity assumed between
internals and percept — calibrated by ear, experiment by experiment.

**Two alignment paradigms for the internals:**
- **FLOW (onset-chained):** independent swells entering in sequence; overlap emerges
  statistically from spacing × duration; peaks are scattered — no collective climax.
  (All builds through S3d.)
- **CONVERGENT (peak-aligned):** swells share one apex instant — staggered entries,
  co-terminating peaks, progressively shorter durations. The entry-time distribution
  is the meta-curve's inverse, EXACTLY: k voices sound when the plot says k. True
  collective arrival; the +8.5 dB tutti sum lands in one moment.
- **The repetition dial connects them:** 1 swell/part = pure convergent (deterministic);
  many short repeats with gaps = statistical convergent (the Xenakis middle); no shared
  apex at all = flow.
- **Contrapuntal strategy family (composer, 2026-08-10):** borrow models from fugue /
  stretto / mensuration & prolation canon (Ockeghem) — same swell-material at
  different rates, phase-locked to structural arrivals. To be tested alongside the
  statistical models; whichever works, works.

## THE LAWS (carved 2026-08-10 after the ISO regression — every future test obeys)

- **L1 — Scatter floors are mandatory.** Uniformity in ANY parameter reads as pattern
  (finding 10; re-confirmed by ISO rejections). Engine defaults enforce: duration
  spread σ ≥ 0.35, jittered onsets, ≥ 2 envelope species. Uniform stimuli require an
  explicit `lawOverride` and are marked law-breaking in their manifest.
- **L2 — Trends are quota-guaranteed, never statistical.** Small time-windows receive
  deterministic budgets from the trajectory (fractional accumulator, exact over time);
  ALL randomness lives inside windows. (Poisson small-N cannot draw a curve; grids
  kill the mass — stratified scheduling is the synthesis: chaos inside, quotas outside.)
- **L3 — The keeper passage is the calibrated plateau target** (w5-mass45 @ 14.68–17.5,
  measured): ~3.2 onsets/s · durations wide 0.58–2.61 s · sine-heavy + expodec accents,
  rexpodec rare · ~4.7 sounding.
- **L4 — The perceptual-scale law (BLUNTNESS; composer-confirmed 2026-08-11):**
  inside a dense mass, discrimination is far coarser than in isolation — variety
  within ~×1.5 of a value FUSES into one perceptual category. For a parameter's
  diversity to be HEARD, its values must jump in category-sized steps (~×2.5–3
  between tiers); within-tier jitter is texture (still required by L1), only
  between-tier jumps read as "different." Applies to ALL parameters — durations
  first (the tiered duration model), apex spacings expected next (composer:
  "the spaces between apexes have to be bigger than we expect"). Corollary of
  the DH1/DH2 homogeneity verdicts; anchors: Tuba 8 g6 = 1.08 s vs the 0.6–0.9
  crowd — inaudibly different in-texture.
  **Refinement (DH3 verdict):** the axis saturates at BOTH ends — below ~1 s all
  is "short", beyond ~5 s all is "long" ("once it's of a certain length,
  everything beyond still sounds long"). Usable duration categories ≈ 4: short
  0.6–1.0 · medium ~1.65–2.75 · go-to long ~4–5 · exceptional >6.5, rare, FOR
  EFFECT. **Spacing constant adopted: ×2.75** (DH3-L2, composer-confirmed).
- *Meta-law:* a stimulus violating the laws cannot calibrate anything — you hear the
  violation, not the parameter. (The ISO pair's lesson; entries 021 marked REJECTED.)

## The compiler (time-warp) — path to full fluidity (2026-08-10)

**The unifying mechanism.** Any drawn meta-curve m(t) compiles to a part schedule by
TIME-WARPING: integrate m into cumulative activity Λ(t); place swell-peaks evenly in
Λ-space; map back through Λ⁻¹ — peaks cluster exactly where the drawn curve is high.
One event-budget knob + the drawing = the whole schedule. Fine gradation is native:
a slightly-curvier drawing shifts every internal time continuously (the Gehry
property). **The fluidity/noise dial = the placement statistic in warped time**:
even (mechanical) · jittered σ (humanized) · Poisson (fully stochastic — Xenakis's
Achorripsis machinery: Poisson counts, exponential gaps, instrument×time matrix;
our upgrade = continuous drawn curves + calibrated playback instead of matrix cells).

**Compiler inputs (the full parameter set):**
1. meta shape m(t) — drawn, any complexity  2. event budget N (or peak density)
3. placement statistic: even / jitter(σ) / Poisson  4. duration law D(t) (+ breath caps)
5. per-swell envelope: attack family+ratio · release R · optional hold  6. level law
7. alignment: flow / convergent peak-locks (counterpoint hooks)  8. part assignment

**Path:** T1 releases (done — 010) · T2 build the compiler as a generator (test: "5 s,
acceleration build, quick release" compiled automatically) · T3 placement-statistic
ladder on one shape (even/jitter/Poisson — prices fluidity; absorbs the jitter test)
· T4 gradation discrimination (m vs slightly-curvier m — the Gehry resolution claim)
· T5 promote compiler → meta-track score object (P2).
**Tools:** numpy/scipy suffice (inhomogeneous-Poisson sampling via time-warp inverse);
no new software needed. Sources: Xenakis *Formalized Music*; Arsenault, *Achorripsis:
The Matrix Game*; Childs, *Achorripsis: A Sonification of Probability Distributions*.

## The recipe architecture (CATIA layer, composer 2026-08-10)

**Three layers, strict division of labor:**
1. **Composer layer** — draws/sculpts the meta shape(s). Nothing else.
2. **Recipe layer** *(what the W/Z tests exist to learn)* — a fixed mapping from local
   meta value m to distribution settings for every grain parameter. Once learned, ANY
   drawn shape compiles through it.
3. **Engine layer** — the time-warp compiler + grain-time scheduling (grain =
   threshold→peak, the audible crescendo; ≈ Roads' *rexpodec* envelope at ~1000×
   the microsound timescale — the metaphor imports the parameter space, NOT the
   perceptual conclusions, which must be re-derived at breath scale).

**Salience principle (the answer to "too many parameters"):** a parameter is salient
iff varying it alone produces a reliably nameable difference in the mass. Salient →
the recipe drives it from m. Non-salient → frozen at a fixed good value and REMOVED
from the search space. Dimensionality reduction by ear.

**Test program:** Stage 1 screening (max-contrast A/B per candidate on a static bed)
→ Stage 2 resolution ladders (only for parameters that pass) → Stage 3 recipe v1
assembled, one meta arch compiled through it, A/B'd against the naive arch →
Stage 4 the deferred precision/gradation test (T4) returns once the recipe is real.
First sitting: **W0** density fusion ladder (0.5/1/2/4 grains/s, all else frozen —
sets the bed) · **W1** the bed · **W2** size-scatter A/B (±0 vs ±50%) · **W3**
envelope-heterogeneity A/B (all surge-5× vs mixed ratios + 30% bloom).
Verdicts append to the consequences table below.

## Consequences table (dial → value → what it sounds like, verbatim)

- **Density 0.5→1.3/s (W0, 2026-08-10):** "much better"; at 1.3 "approaching the sound
  mass but only at the peaks — I hear five separate sound masses; pushed together it
  would be continuous. Maybe slightly denser from there." → target sits ABOVE the
  1.4/s rexpodec ceiling.
- **The two halves (W0):** "the second half sounds more like the grain itself — the
  overlap and randomness of just that second half is working. The first half is not
  without impact, but the onset feels mechanical. Durations are all quite similar —
  different durations and different curves might accomplish both beginning sound mass
  and end sound mass."
- **Size scatter ±50 % (W2):** SALIENT — "satisfying as a texture." Open: "durations a
  bit too long, or needs greater diversity — not sure yet."
- **Ratio scatter 3–8× (W3):** SALIENT — "several different waves, short waves; pushed
  together → approaching sound mass."
- **Type mix (W4):** SALIENT — "effective. All those envelope types work — nice profile
  and sound." Direction: shape-diversity gradients or per-recipe; "may be no systematic
  formula — in that case we develop individual recipes.

## Used-pattern entries

*Schema: id · date · style/ratio · length · threshold · peak behavior · deployment ·
material · archive ref · status (experiment / adopted / in-piece @ location) · notes.*

### 001 — Threshold-spaced relay
- **Date:** 2026-08-10 · **Status:** experiment (S2b)
- **Curve:** C3 Surge 5× · L = 8 s · threshold 0.68 (5.45 s) · peak: cut (note-off at top)
- **Deployment:** 7-voice relay, round-robin tuba 1→7; each voice enters at the
  previous voice's threshold → stagger 5.45 s; ~1–2 voices sounding; 4 min
- **Material:** unison pitch 45 (display A1), Ordinario
- **Archive:** score `s2b-overlap-threshold` (43 curves)
- **Notes:** composer: "simply repeated events... I'm looking for something more
  dramatic in terms of overlap — maybe the crescendo happens in the amount of overlap,
  the ensemble crescendo." Static stagger = repetition; direction → shifting overlap.

### 002 — Arch, smooth (S3a)
- **Date:** 2026-08-10 · **Status:** experiment
- **Note curve:** C3 Surge 5× · L = 8 s · unison pitch 45 · Ordinario · 7 voices round-robin
- **Meta-curve:** contour ARCH · nadir interval 8 s ↔ apex 1.2 s · rise 90 s / fall 90 s
  (symmetric) · ascent/descent LINEAR (in interval space) · **noise 0 (smooth)** · 51 entries
- **Archive:** score `s3a-arch-smooth`

### 003 — Arch, wander (S3b)
- **Date:** 2026-08-10 · **Status:** experiment
- Identical to 002 except **noise = wander** (mean-reverting walk, ±40 % of local
  interval, min-clamped at apex spacing) · 54 entries
- **Archive:** score `s3b-arch-wander`

### 004 — Delta ladder (S3c): isolated overlap-increase rate
- **Date:** 2026-08-10 · **Status:** experiment
- **Note curve:** C3 Surge 5× · L = 8 s · unison pitch 45 · Ordinario · 7 entries per
  group, one round of the tubas · smooth (noise 0)
- **Zero point (composer def.):** minimum overlap = peak(n) aligned with
  threshold(n+1) → base stagger = L − threshold-time = 2.55 s
- **The dial:** per-entry stagger tightening Δ. Three groups: **Δ = 0.15 s** (2.55→1.80)
  · **Δ = 0.30 s** (2.55→1.05) · **Δ = 0.40 s** (2.55→0.55)
- **Archive:** score `s3c-delta-ladder` (21 curves, groups at 0:02 / 0:31 / 0:58)

### 005 — Three-dial bell (S3d)
- **Date:** 2026-08-10 · **Status:** experiment
- **Meta:** symmetric ARCH, T = 80 s, all three dials riding it (geometric interpolation):
  swell length **8→2→8 s** · entry spacing **2.55→0.29→2.55 s** (zero-point edges →
  all-7 churn apex) · per-swell peak **70→100→70 %** of dB span
- **Note curve:** C3 Surge 5× throughout · unison pitch 45 · Ordinario · round-robin ·
  smooth (noise 0) · 113 entries
- **Design:** density + movement + level co-varying; apex = churn (movement), not holds
- **Archive:** score `s3d-bell-3dial`

### 006 — Convergent fan, 9 s (S4a)
- **Date:** 2026-08-10 · **Status:** experiment
- **Alignment:** CONVERGENT — all 7 peaks land together at 0:11; entries along the
  surge-5× inverse profile; durations 9 / 6.15 / 4.27 / 2.86 / 1.74 / 0.80 / 0.60 s
- **Note curve:** surge 5× each, full peak, unison 45, collective cut at apex
- **Archive:** `s4a-fan-9s` (7 curves)

### 007 — Statistical convergent, 28 s (S4b)
- **Date:** 2026-08-10 · **Status:** experiment
- **Alignment:** CONVERGENT-statistical — part 1 opens with a 14 s breath; parts cycle
  swells with gaps (duty 25 %→100 %, durations 14→3 s, per-part gap factors for
  desynchronization); every part's final swell peaks together at 0:30
- **Archive:** `s4b-statistical-28s` (21 curves)

### 008 — Subdivision stack, 9 s (S4c)
- **Date:** 2026-08-10 · **Status:** experiment
- **Structure:** 4 parts, mensuration-canon of swells — part 1: one 9 s swell ·
  part 2: two 4.5 s · part 3: three 3 s · part 4: four 2.25 s. All interior peaks
  on the subdivision grid; ALL final peaks together at 0:11. 0.15 s re-articulation
  gap shaved off the start of each subsequent swell (peaks stay exact).
- **Note curve:** surge 5× each, full peak, unison 45, Ordinario
- **Context:** S4a fan verdict "just sounds like one crescendo, as expected";
  S4b statistical "not correct" — this isolates the layered-subdivision mechanism.
- **Archive:** `s4c-subdivision-9s` (10 curves)

### 009 — Prolation/acceleration canon, 13 s (S4d)
- **Date:** 2026-08-10 · **Status:** experiment
- **Structure:** part 1 = one 13 s anchor swell; parts 2–4 = four swells each in
  geometric shrink (ratios 0.75 / 0.65 / 0.55) — first longest → last shortest, so
  peak-arrivals accelerate per part; ratios differ between parts so **no interior
  peaks coincide** (min spacing ≈ 0.45 s); **all final peaks converge at 0:15**.
- Interior peak times — p2: 4.75/8.32/10.99 · p3: 5.54/9.14/11.48 · p4: 6.44/9.98/11.93
- **Note curve:** surge 5× each, full peak, unison 45, Ordinario
- **Archive:** `s4d-prolation-13s` (13 curves)

### 010 — Prolation canon with releases (S4e)
- **Date:** 2026-08-10 · **Status:** experiment
- Same structure as 009 + **ADSR v0: 0.35 s drawn linear release after every peak**
  (3-node curves; peaks stay on the exact grid; same-track starts shifted past the
  previous release). Collective peak at 0:15 now releases together over 0.35 s.
- **Archive:** `s4e-release-13s` (13 curves)

### 011 — T2 acceptance: "5 s, acceleration build, quick release" (compiled)
- **Date:** 2026-08-10 · **Status:** experiment · **Compiler:** `score/public/compiler.js`
- Spec: T 5 s · surge 5× meta · 10 events · even · durations 2.5→0.8 s · release 0.25 · 4 parts
- Manifest: 10/10 placed · peak gaps 0.20–0.90 s (median 0.31) · attacks 0.63–2.12 s
- **Archive:** `t2-accept-5s`

### 012 — T3 fluidity ladder (one shape, four placement statistics)
- **Date:** 2026-08-10 · **Status:** experiment
- Shared spec: T 20 s · surge 5× · 18 events · durations 8→2 s · release 0.35 · 7 parts
- The dial, measured (min/median/max peak-gap):
  `t3-even` 0.43/0.68/2.83 · `t3-jitter-lo` (σ.15) 0.33/0.67/3.20 ·
  `t3-jitter-hi` (σ.35) 0.24/0.71/4.34 · `t3-poisson` **0.01**/0.33/2.70
- Poisson produces near-collisions (0.01 s) — true cloud behavior; jitter widens the
  extremes while holding the median: the mechanical→fluid axis is measurably real.

### 013 — T4 gradation pair (the Gehry resolution test)
- **Date:** 2026-08-10 · **Status:** experiment
- `t4-a-4x` vs `t4-b-6x`: identical spec (as 012, even placement), meta ratio 4× vs 6×.
- Summary statistics nearly identical (median gap 0.70 vs 0.67) — by design: the
  difference lives in the time-distribution, not the totals. Question: audible?

### 014 — W0 density fusion ladder
- **Date:** 2026-08-10 · **Status:** experiment · **Engine:** compileGrains (v2)
- Frozen: grain 1.5 s (threshold→peak) · rexpodec · ratio 5× · unison 45 · Poisson bed · T 25 s
- Requested 0.5/1/2/4 grains/s → **realized 0.48 / 0.88 / 1.12 / 1.28** (drops 1/3/22/68)
- **FINDING 11 (measured, pre-listening): the preamble occupancy ceiling.** A 1.5 s
  grain at 5× carries a 3.2 s preamble → ~5 s part-occupancy → 7 parts cap at ≈1.4
  grains/s. The ladder's top rungs compress against it. To reach true 2–4 grains/s:
  shorter grains, lower ratios, or preamble-free types (sine/expodec) — w4-types
  measured the highest density (1.32/s) *because* mixed types are cheaper. Type
  mixing buys density headroom, not just color.
- **Archive:** `w0-d05` `w0-d1` `w0-d2` `w0-d4`

### 015 — W2 size-scatter screening (A = w0-d2, B = w2-scatter)
- grain lognormal σ 0.4 (≈ ±50 %) vs frozen 1.5 s; density provisional 2/s. Salient?

### 016 — W3 ratio-scatter screening (A = w0-d2, B = w3-ratios)
- ratios drawn 3–8× vs all 5×. Salient?

### 017 — W4 envelope-type screening (A = w0-d2, B = w4-types)
- mix rexpodec .5 / sine .3 / expodec .2 vs all-rexpodec. Realized 33 grains,
  overlap 1.98 (highest of the set). Salient — and structurally density-cheaper?

### 018 — W5 the mass bid (diversity breaks the ceiling)
- **Date:** 2026-08-10 · **Status:** experiment
- Everything the verdicts asked for at once: grain 1.2 s ±45 % · types rex .45 /
  sine .35 / expodec .2 · ratios 2–6× (shorter, steeper preambles) · levels 85–100 %
  · Poisson · T 25 s
- `w5-mass3`: realized **2.12 grains/s**, audible overlap 2.45 (53 grains)
- `w5-mass45`: realized **2.68 grains/s**, audible overlap 3.22 (67 grains)
- Both far past the old 1.4/s rexpodec ceiling — diversity purchased the density,
  as finding 11 predicted. Question: is it ONE mass now — and which density?

### 019 — R1 "onset-mass" recipe candidate (mined from the keeper passage)
- **Date:** 2026-08-10 · **Status:** candidate awaiting verdict
- **Forensic seed** (w5-mass45 @ 14.68–17.5 s): 3.19 swell-onsets/s · ~4.7 sounding ·
  types sine 6 / expodec 2 / rexpodec 1 — the loved moment was a sine+accent cloud.
- **Recipe:** density 3.2/s · grain 1.8 s ±35 % (composer: "a little longer") · mix
  sine .6 / expodec .25 / rexpodec .15 · ratios 2–6× · levels 85–100 % · Poisson
- Realized: 2.40/s, 4.5 sounding, 60 grains. **Archive:** `r1-onsetmass`

### 020 — R2 shape-lends ladder (what each species provides)
- Same bed as R1; only the species mix varies:
  `r2-sine` all sine (2.64/s realized) · `r2-sine-rex` .7/.3 (1.96/s — rexpodec's
  density price, measured) · `r2-accents` .65/.15/.2 (2.08/s)
- Scheduler lessons en route (manifests caught both pre-listening): assignment must be
  in START order (preamble claims the lane, not the peak), and long-preamble species
  starve without it — an ensemble-resource phenomenon real orchestration also has.

### 021 — ISO pair: the interpolation contract + parameter isolation — **REJECTED (violates L1)**
- **Date:** 2026-08-10 · **Status:** experiment · **Engine:** compileCurveIso (deterministic)
- **The interpolation contract:** curve sampled at each grain's ONSET; onsets advance
  by rate integration (next = now + spacing(curve here)); zero statistical noise —
  noise returns later as a measured dial. (Lesson: Poisson at small N cannot represent
  a curve — determinism first, stochastics after calibration.)
- `iso-duration`: spacing FIXED 0.8 s; grain duration follows the slope 0.3→2.5 s
  (16 grains). Overlap grows purely by elongation; peaks-per-second CONSTANT.
- `iso-rate`: duration FIXED 0.5 s; spacing follows the slope geometrically 2.0→0.13 s
  (47 grains). Overlap grows purely by arrival rate; peaks-per-second RISES.
- Source shape: composer's redrawn 12.4 s slope (rise ~5 s → plateau → settle),
  copied from `shapesfilltest001` into each ISO score.

### 022 — Stratified trajectory 001 (the laws' first render)
- **Date:** 2026-08-10 · **Status:** the build-on candidate
- **Engine:** compileStratified (L1 floors enforced · L2 quota windows 0.5 s · L3 keeper
  anchor). Trajectory (spoken, no drawn curve): rise 0.5→3.2 onsets/s over 5 s ·
  plateau 3.2/s for 2.5 s · descend to 1.6/s over 4 s.
- Manifest: laws CLEAN · 20 grains placed (3 dropped) · types sine 13 / rexpodec 4 /
  expodec 3 · grain spread 0.77 / 1.82 / 3.10 s (min/med/max — keeper-wide) ·
  window budgets track the trajectory exactly (see entry JSON in git).
- **Success test:** the plateau should reproduce the keeper feel on demand.
- **Archive:** `strat-trajectory-001`
- **Verdict (composer):** "Overall it sounds better — maybe because of the
  heterogeneity. But there's not a real good sense of build or plateau or descent —
  the motion is not perceptible." **Texture ✓, trajectory ✗.** → Finding 13: with
  level held flat, a 6.4× density change over 5 s at breath-scale grains did NOT
  read as motion. Placement was exact (budgets verified) — so the gap is in CUE
  MAPPING, not scheduling. Contrast: every build that DID read as motion (S3d bell,
  meta-fills) had level and/or size riding along. Hypothesis: perceived motion is a
  composite cue — level is likely the strongest carrier, density alone is weak.

### 023 — SC1: ending-density arch (the swell-cloud, peak-cut scheduling)
- **Date:** 2026-08-10 · **Status:** the convergence build
- **The species insight:** the peak-cut IS the attack (reversed pizzicato) — Xenakis
  X3 attack-salience translated into the crescendo-cloud. ENDINGS are scheduled;
  onsets back-calculated (onset = peak − duration).
- **Engine:** compileSwellCloud — ending-rate quota windows (L2) · jittered peaks (L1)
  · durations lognormal σ0.35 with mean feasibility-coupled to local ending-rate
  (dense endings force shorter swells) · steep surge ratios 2–4× · cut release 0.08 s
  · level flat 0.9 (honest test: does ending-density alone carry motion?) ·
  single-species by composer instruction (SC3 restores variety).
- **Trajectory:** endings/s 0.3 →(12 s)→ 3.5 · apex 4 s · →(12 s)→ 0.3. 28 s total.
- Manifest: 40 swells (5 dropped) · durations 0.62/1.70/3.00 s · parts 6-6-6-5-6-6-5.
- **Program:** SC2 = duration/onset variety dials · SC3 = shape sweep.
- **Archive:** `sc1-ending-arch`

### 024 — SC2: star-cloud (Gaussian continuum, everything-heterogeneous)
- **Date:** 2026-08-10 · **Status:** experiment
- SC1 verdict: "approach correct" · uniform 0.08 s cuts read as pattern ("BEATS
  territory" — transcription corrected: the sharp cuts were metering the texture) → **releases now vary 0.15–0.45 s** (composer's key insight carried:
  "patterning takes over if ANYTHING is the same").
- **Changes:** true Gaussian rate bell (0.25→5.5→0.25 endings/s, σ 5.5, T 30 s) ·
  0.25 s windows · shorter/wider durations (base 1.4, σ 0.4 → realized 0.53–3.0 s)
- **Scatter verified by time-region** (endings count / median gap): edge 6 / 0.82 s ·
  approach 15 / 0.28 · apex 23 / 0.22 · release 15 / 0.36 · edge 7 / 0.77 —
  a continuous densification with micro-clumps (tightest pair 0.04 s). 66 endings.
- Dial noted: bell σ controls how sparse the edges get (σ 4 = starker contrast).
- **TODO (composer):** once by-ear approved, second pass to extract/codify the
  underlying algorithm.
- **Archive:** `sc2-star-cloud`

### 025 — SC3: the dense seven seconds (work-backwards pass)
- **Date:** 2026-08-10 · **Status:** current focus
- Composer's pass structure: get the DENSEST region right first, then the sparse
  regions, then the ramp. Ramp-up long and unfussy; **a clear middle 7 s at max
  density is the object of judgment.**
- **Releases recalibrated:** vary 0.05–0.18 s — floor ≈ a tongue-stop (performance
  reality as guideline, not full pass), ceiling "a fair bit shorter" than SC2's 0.45.
- **Durations longer** (base 2.0 s, σ 0.4) — feasibility coupling still compresses
  them where endings crowd (physics), so long swells live at the edges.
- Trajectory: 10 s rise (0.3→5.5 endings/s) · **7 s hold at 5.5/s** · 6 s fall.
- **Archive:** `sc3-dense-hold`

### 026 — SC4: max-dense push
- **Date:** 2026-08-10 · **Status:** current focus
- Composer: denser + noisier, attack from both ends. **Releases 0.02–0.08 s**
  (floor = true rexpodec, the backward-masked attack) · **durations 0.5–1.6 s**
  (500 ms floor per composer; sharper surge ratios 3–6×) · **placement max-random**
  (uniform within quota windows — Poisson-conditioned-on-count, the noisiest
  placement that still guarantees the trend).
- Trajectory: 8 s ramp → **7 s hold at 8.5 endings/s requested** → 5 s fall.
- Realized hold: **48 endings = 6.9/s**, median gap 0.13 s, tightest 0.000 s
  (simultaneous pair — true cluster), widest 0.38 s. 80 swells total, 13 dropped.
- **Archive:** `sc4-max-dense`
- **Verdict (composer, session wrap):** "That's pretty good... pretty good for now" —
  provisionally approved; revisit after the other parameters. **Tabled:** release
  shape/duration fine-tuning.

### 027 — The Roads envelope catalog (grainEnvelope + env-catalog audition score)
- **Date:** 2026-08-11 (AI independent batch) · **Status:** built, awaiting listen
- **What:** every classic grain envelope from Roads' *Microsound* ch. 3 as a
  peak-anchored waveCurve recipe — `grainEnvelope(shape, {dur, lv, ratio, release})`
  in compiler.js returns `{nodes, segments, pre, post}` so engines can schedule the
  salient peak and back-calculate the span (the swell-cloud scheduling model
  generalized to all shapes).
- **Shapes (8):** `sine` (Hanning bell) · `gaussian` (concentrated peak, quiet
  tails) · `quasi-gaussian` (Tukey flat-top: swell→held apex→fall) · `triangle`
  (linear bell) · `trapezoid` (linear ASR) · `expodec` (sharp attack, exp decay) ·
  **`surge`** (rexpodec: exponential swell→peak-cut — OUR classic crescendo; name
  proposed to composer, matches the BLOOM/SURGE vocabulary) · `sinc` (main lobe +
  faint echo lobe, playable approximation).
- **Audition:** `env-catalog` in the Load dropdown — 8 shapes × 3 durations
  (0.8/1.5/2.5 s) sequential on Tuba 1, labeled via performanceNotes, ~70 s.
- **Open (composer):** bless/rename `surge`; verdicts per shape → which enter the
  engine's envelopeMix.

### 028 — Pass 2: the onset-driven cloud (compileOnsetCloud) + the short-grain category
- **Date:** 2026-08-11 (AI, from composer dictation) · **Status:** battery built, awaiting listen
- **Generative flip (four-pass plan pass 2):** ONSETS are scheduled (L2 quota
  windows, uniform-in-window = max random; causal random part assignment = max
  scatter), durations FOLLOW. Physical law enforced: no overlap within a part +
  re-articulation gap (0.08 s dial).
- **The short-grain category (composer's model, AI's transcription — confirm):**
  on the short end, all durations inside one band are ONE perceptual category
  ("the short grain": band 0.6–0.9 s, min raised from SC4's 0.5); diversity can't
  come from variety inside it. The rest of each draw is ONE random selection,
  uniform across (0.9, maxDur] — uniform (not log) so it leans LONG. Dial:
  pShort 0.45.
- **The evaluation instrument (composer: "when does this become a factor"):** the
  manifest reports truncation (dense grains whose target duration got cut by the
  part's next onset) overall AND inside the apex window, target-vs-realized
  duration histograms, apex occupancy, onset-gap CV global + per-part.
- **Feasibility sweep (headless, 40 trials/cell, 10 parts, apex = 7 s hold):**
  - Onset-rate ceiling ≈ 11/s (drops begin at 12/s; 6–10/s place 100%).
  - Truncation is ALREADY a factor at any dense apex: 29% at 6/s even with
    maxDur 1.6; ~46–57% at 8/s; ~2/3 at 10/s.
  - **Surviving apex duration mix (the real tradeoff):**
    | apex | maxDur | short | 1–2 s | 2–3 s | 3 s+ |
    |---|---|---|---|---|---|
    | 6/s | 4.5 | 57% | 33% | 7% | 3% |
    | 8/s | 3.5 | 65% | 32% | 3% | 0% |
    | 10/s | 3.5 | 81% | 18% | 1% | 0% |
  - **Structural finding:** at 8+/s with random assignment, mean per-part gap
    (parts/rate ≈ 1.25 s) crushes the long tail regardless of the maxDur dial.
    The dial only matters below ~6/s. Density and duration-diversity cannot
    coexist in ONE stream at a dense apex.
- **The Xenakis answer — superposition (`longStream` option):** a sparse stream
  of long grains (0.7/s, 2.2–5 s) whose spans are RESERVED on rotating lanes,
  threaded through the dense mass. At apex 8/s this restores the 3 s+ band
  (0%→~6–8%, near-zero drops, occupancy 0.74) — and POLARIZES the mix (very
  short + very long, hollowed 1–2 s middle): points + lines, the two Xenakis
  species superposed. Predicted to be the best match for "wide diversity of note
  durs while maintaining a dense sound."

### 029 — The OC listening battery (pass 2, awaiting composer)
- **Scores in the Load dropdown** (all 10-part unless noted; apex = 7 s hold,
  8 s ramp in, 5 s fall; apexWindow 8–15 s score-time):
  - **oc1-apex8-md3p5** — pure hypothesis point: 8/s, maxDur 3.5. Realized apex:
    8.0 onsets/s, mix short 66%/1–2s 29%/2–3s 5%.
  - **oc2-apex6-md4p5** — density traded for diversity: 6/s, maxDur 4.5.
  - **oc3-apex8-superposed** — 8/s + longStream 0.7/s (14 longs placed, 3 s+
    band present at apex). The polarized/Xenakis candidate.
  - **oc4-apex10-md2p5** — max push: 10/s; diversity collapses (58 short vs
    12 mid at apex). The density-ceiling anchor.
  - **oc0-preview7** — 7-PART preview (5.6/s = equal per-part load to oc1),
    listenable BEFORE the tuba 8–10 hardware exists.
- **Listening questions:** (1) does oc1 already satisfy the density sound-image,
  or do the truncated durs read as "too short/uniform" (finding-10 risk)?
  (2) oc3 vs oc1: does the long-grain thread ADD depth or read as a separate
  layer? Is the hollowed middle audible/good? (3) oc4 vs oc1: what does +2/s
  actually buy at the cost of the mid band? (4) oc2: is 6/s still "max density"
  to the ear? → verdicts pick the model; dials then fine-tune.
- ⚠ 10-part scores sound on 7 parts only until loopMIDI/UVI hardware for
  tubas 8–10 exists (AUTOMATION_EVAL.md; setup script awaiting approval).

### 030 — DH1: the dense-hold ladder (grain dur at density; the span test, audible)
- **Date:** 2026-08-11 · **Status:** awaiting listen (composer at the desk)
- **Design:** 18 s dense-hold scores (2 s in → 14 s HOLD at 8/s → 2 s out),
  **10 parts** (composer: hardware up, "do 10 from now on"; first cut was
  7-part, superseded same day), ONE frozen seed (20260811) — every score is the
  same realization, only the dial differs.
- **maxDur ladder** `dh1-maxdur-L1..L4` = 1.6 / 2.5 / 3.5 / 5.0 s. The sheet
  already shows the dial is nearly INERT at this density in one stream: realized
  apex mix ~72 short / 37–40 1–2 s / ≤3 longer at every rung (only truncation
  rises, 46%→65%). **If L1 ≈ L4 by ear, the span test confirms: new mechanism
  needed.**
- **dh1-superposed** = same seed + longStream 0.7/s [2.2–5 s]: apex mix gains a
  real long band (6× 3 s+, 6× 2–3 s vs ≤3), occupancy 0.71→0.80, 12 longs. The
  A/B partner that tests the mechanism.
- **Listening order:** L1 → L4 (do they differ AT ALL in the dense image?) →
  dh1-superposed (does the long thread complete "the whole picture"?).

### 030v — DH1 VERDICT (composer, at the desk)
- "The long durations work well… it blends well" — **longStream superposition
  CONFIRMED, graduates to engine core** (not a separate layer to the ear).
- "Plenty dense… sort of a homogeneity… [dense grains] too close in similarity"
  — the truncation signature heard directly (realized 98 short / 9 mid at 8/s).
- **Direction:** "lean towards diversity of envelope lengths and sacrifice some
  apex density… a mix of really long and, within a certain range, a larger
  diversity." → DH2.

### 031 — DH2: the density↔diversity tradeoff ladder (awaiting listen)
- **Base = the diversity lean:** maxDur 4.5, pShort 0.35 (fewer short-category
  draws), longStream 0.7/s [2.2–5 s] kept, 10 parts, 18 s dense hold, seed
  20260812 frozen.
- **One dial: hold rate** — `dh2-rate-L1..L4` = 5 / 6 / 7 / 8 onsets/s. Realized
  apex mixes (short / 1–2 s / 2–3 s / 3 s+):
  - L1 5/s: 33 / 35 / 4 / 8 — near-balanced, maximum diversity expression
  - L2 6/s: 50 / 32 / 6 / 6 — predicted sweet spot
  - L3 7/s: 73 / 25 / 3 / 7
  - L4 8/s: 92 / 17 / 3 / 7 — the DH1 homogeneity, kept as anchor
- **Listening question:** walking L4 → L1, where does "plenty dense" stop being
  true? The highest rung that still reads diverse = the working apex.

### 032 — DH3: the tiered duration model + spacing ladder (LAW L4 applied)
- **Date:** 2026-08-11 · **Status:** awaiting listen
- **Engine change:** `durModel.tiers` in compileOnsetCloud — tier 0 = capped
  dense stream; every higher tier is RESERVED (span claimed at assignment, never
  truncated; rate = share × trajectory, so tiers thin with the arch). This
  generalizes longStream (kept as legacy) into the L4 mechanism: within-tier
  jitter = texture, between-tier spacing = the audible diversity.
- **DH2 verdicts folded in:** apex density fine → hold fixed at 7/s; longs blend
  → tier 3 is the long thread; homogeneity → tier spacing is THE dial now.
- **Ladder `dh3-spacing-L1..L3`** (18 s hold, 10 parts, seed 20260813; tier 1 =
  0.6–1.0 s, shares 0.786/0.143/0.071; tier 2 = ×s, tier 3 = ×s², capped 6.5 s
  for breath):
  - L1 ×2.0: tiers realize 0.77 / 1.56 / 3.05 s (77/14/7 at apex)
  - L2 ×2.75: 0.74 / 2.19 / 5.16 s (72/12/7) — the predicted "blunt enough"
  - L3 ×3.5: 0.74 / 2.67 / 5.13 s (71/13/6) — t3 hits the breath ceiling
- **Listening questions:** (1) walking L1→L3, when do you first hear THREE
  distinct grain-lengths (not two, not a blur)? That spacing calibrates L4's
  constant. (2) Does the tier-2 middle read as its own voice or as "long-ish
  short"? (3) Is 6.5 s a real tuba ceiling or should t3 cap lower/higher?

### 033 — DH4: four categories + the anti-run constraint (A/B, awaiting listen)
- **Date:** 2026-08-11 · **Status:** awaiting listen
- **DH3 verdicts folded in:** ×2.75 adopted · long-end saturation → tier 3
  becomes go-to long [4.0–5.0 s], NEW tier 4 exceptional [6.5–8.0 s] at share
  0.02 (~1–2 per hold, "for effect") · shorts clump → `maxShortRun: 2`.
- **The anti-run mechanism (engine):** a rest > 2 s resets a part's run; long
  grains TARGET the worst-run part; when every feasible part is run-saturated
  the short onset CONVERTS to a medium (density kept, run broken; counted in
  manifest as convertedShorts). Verified: worst perceptual run 9 → 2–3.
- **A/B, seed 20260814, 18 s hold at 7/s:**
  - `dh4a-caprun` — DH3 shares kept; conversions do the balancing (16 converted;
    apex mix 54/27/4/1; drops 10/4)
  - `dh4b-midshift` — shares shifted to mids 0.70/0.21/0.07/0.02 (8 converted;
    apex mix 46/24/6/1; drops 15/7; strict worst-run 2)
- **Listening questions:** (1) is the shorts-clump complaint gone in both?
  (2) A vs B: which shorts/mids balance is the texture — A (shortier, livelier)
  or B (mid-weighted, blendier)? (3) do the 1–2 exceptional longs read as
  "effect" or as accident?

### 034 — DH5: the multidimensional-duration synthesis + further mid-shift (A/B, awaiting listen)
- **Date:** 2026-08-11 · **Status:** awaiting listen
- **Composer's DH4 verdict:** midshift wins, go further. New hypothesis: duration
  diversity is MULTIDIMENSIONAL — the ear hears the value distribution AND the
  repetition (sequence); same-tier runs read as clumps; alternation smooths.
  Apex/onset placement, by contrast, is one-dimensional (a point process — scatter
  statistics capture it). *Held as hypothesis; law-carving deferred to listen.*
- **Engine finding (honest negative):** a global alternation swap-pass changed
  almost nothing — the L2 quota substreams ALREADY interleave tiers evenly
  (realized max global same-tier run ≈ 4–5 with or without it, 2–4 swaps/~130
  events). The global-sequence dimension is handled by existing machinery; the
  audible "clumping" levers are the SHARE BALANCE and per-part runs (shorts cap
  live since DH4). Mechanism kept (`durModel.alternate`, on, ~free) but it is
  NOT the A/B variable. If clumping persists at dh5b, next hypothesis = local-
  window dominance (a window-balance quota — new mechanism).
- **A/B `dh5a-mid26` vs `dh5b-mid30`** (seed 20260815, 7/s hold, maxShortRun 2,
  alternate on; end-fit guard added for reserved grains):
  - dh5a shares 0.62/0.26/0.09/0.03 → apex 42 short / 28 mid / 6 long (t4 fell
    outside the hold this seed) · drops 13/7
  - dh5b shares 0.54/0.30/0.12/0.04 → apex 28 / 25 / 7 / 2 — short/mid nearly
    BALANCED · drops 22/12 (the constraint price; realized apex rate dips)
- **Listening questions:** (1) is dh5a already "enough more" or is dh5b's
  near-balance the texture? (2) does clumping survive in either (→ window-balance
  mechanism next)? (3) dh5b's higher drop price: does the hold still feel 7/s-
  dense, or thinner?

### 034v — DH5 VERDICT: both pass; pass-2 parameters declared well-explored
- **Composer (2026-08-11):** "Both of those are good. A is good enough — clumping
  is reduced. And B works as well… apex onsets are dense enough to still give a
  dense feel." Fine-tuning deferred to when ALL parameters are in and a specific
  piece-texture is being sought. "We're getting a good handle on what the dials
  are and what their scale is."
- **New observation → finding 14 (RESEARCH_INDEX):** the APEX-STACK loudness —
  co-peaking swells read as a vertical chord-like loudness event (not an attack),
  even on unisons; adds to the density field. Parked as a capturable recipe
  (peak-coincidence control) if patterns emerge; no dialing-in now.
- **Practice adopted:** any excerpt that sounds particularly interesting gets
  KEPT — named excerpt = {score, seed, time-range, note}; the L3-keeper practice
  generalized to a running collection.

### 035 — RECIPE: MAXDENSE-1 (the calibrated max-density dial set — pass 2 output)
- **The first CATIA-layer recipe.** Engine compileOnsetCloud; all values
  composer-calibrated over DH1–DH5, 2026-08-11:
  - hold rate **7 onsets/s** (10 parts; ceiling ≈ 11/s; density feel confirmed)
  - duration tiers (**L4, ×2.75**): short 0.6–1.0 · mid 1.65–2.75 · long 4.0–5.0
    · exceptional 6.5–8.0 ("for effect")
  - shares: **0.62/0.26/0.09/0.03 (= dh5a, "good enough") … 0.54/0.30/0.12/0.04
    (= dh5b)** — the A–B span is the recipe's tolerance band
  - `maxShortRun: 2` (rest > 2 s resets; longs target worst-run part; saturated
    shorts convert to mids) · `alternate: true` · reArtic 0.08 · releases
    0.02–0.08 (rexpodec floor) · ratio 3–6 · envelope: surge · seed-reproducible
  - reference renders: dh5a-mid26 / dh5b-mid30 (seed 20260815)
- **Deferred fine-tune hooks:** level scatter (finding 13 A/B still tabled) ·
  envelope-species mix (old SC3 stage; sequence-alternation hypothesis applies) ·
  vertical/peak-coincidence control (finding 14).

### 036 — Grain-type audition (tier-aligned) + the first PITCH FIELDS (awaiting listen)
- **Date:** 2026-08-11 · **Status:** awaiting listen
- **Next parameter (composer): grain type.** `env-catalog` REGENERATED with
  tier-aligned durations 0.8 / 2.2 / 4.5 s (short/mid/long exemplars) — 8 Roads
  shapes × 3, sequential on Tuba 1, ~91 s. Composer intends elimination pass;
  note: tier calibration may be per-shape (composer hunch — shapes carry their
  own perceived-length character).
- **`dh5a-pitchfields`** — three MAXDENSE-1 renders down one timeline, SAME seed
  (20260815): identical rhythm/durations, only the pitch field changes.
  Engine additions: `spec.t0` (timeline offset) + `spec.notes` (per-part pitch
  array).
  - **2–22 s: unison 45** (DH5a verbatim)
  - **24–44 s: chromatic** — 10 of 12 pitches in one octave (41–52), scattered
    (non-sequential) assignment
  - **46–66 s: stacked 4ths/5ths** — pure-4th chain 29→64 + octave doublings 41/56
    (constraint: 10 distinct pitches all ≥P4 apart cannot fit the 29–64 range,
    so an 8-note quartal stack + 2 octave doublings)
- **Listening questions:** (1) which grain types survive the elimination?
  (2) pitch fields: does the mass keep its identity off unison? does chromatic
  read as thickened unison or as harmony? does the quartal stack turn the field
  chordal (finding 14 interaction — apex-stack loudness on real intervals)?

### 036v — Envelope elimination VERDICT (first remote verdict, via CRD 2026-08-12)
- **KEEP (4):** `sine` (#1) · `quasi-gaussian` (#3 — the flat-top; composer asked
  "tri-something?" — naming confirmation pending, sound chosen by ear) ·
  `expodec` (#6) · `surge` (#7).
- **CUT (4):** gaussian · triangle · trapezoid · sinc.
- **Engine consequence:** the grain species set for the cloud engines becomes
  {sine, quasi-gaussian, expodec, surge}; next = species-MIX pass in the dense
  hold (sequence-alternation hypothesis from DH4 applies to species) + per-shape
  tier calibration check (composer hunch: perceived length varies by shape).

### 037 — DH6: the species-mix pass (A/B, awaiting listen)
- **Date:** 2026-08-12 · **Status:** awaiting listen (remote via CRD works)
- **Engine:** `envMix` in compileOnsetCloud — per-grain species from weighted mix
  over the four KEPT shapes (036v: sine, quasi-gaussian, expodec, surge), with a
  per-part no-immediate-repeat redraw (alternation instinct applied to species).
  All shapes onset-anchored via grainEnvelope; surge keeps the peak-cut release,
  the others end at zero naturally. Species applies to ALL tiers (long reserved
  grains can now be messa-di-voce sines etc.).
- **A/B, seed 20260816, MAXDENSE-1 base — scheduling IDENTICAL between the two
  (same tier structure realized), only species labels differ:**
  - `dh6a-mix-even`: surge .3 / sine .3 / qg .2 / expodec .2 → apex 20/19/12/18
  - `dh6b-mix-surgelead`: surge .55 / sine .2 / qg .15 / expodec .1 → apex 36/13/11/9
- **Listening questions:** (1) does density SURVIVE the even mix — sine/qg peaks
  have no attack bite (X-rule attack salience; the apexes thin from ~50 cuts to
  ~20) — or does the field go soft? (2) surge-lead: do the color species read as
  accents inside a surge field (the L3-keeper logic at max density)? (3) per-shape
  tier calibration: do mid-tier sines/flat-tops FEEL longer than mid-tier surges
  (L4 per-shape offsets needed)? (4) which mix is the texture?

### 038 — DH7: staged species introduction (awaiting listen)
- **Date:** 2026-08-12 · **Status:** awaiting listen
- **DH6 verdict:** full blends illegible ("not what I expected, hard to provide
  analysis") — **quasi-gaussian DROPPED**; kept roster now {sine, expodec, surge}.
  Lesson for the framework: introduce species STAGED, not all at once.
- **`dh7-species-intro`** — three 18 s dense-hold segments, one timeline, same
  seed (20260817), MAXDENSE-1 base. Engine addition: `envMixRamp` ({from, to}
  weights interpolated across the render — "introduce a species over the length").
  - **2–20 s: pure surge** (88 grains — the reference sound)
  - **24–42 s: expodec ramps in** 0→35% (realized 70 surge / 18 expodec,
    9%→33% first/second half)
  - **46–64 s: full mix** surge .5 / expodec .25 / sine .25 (44/25/19)
- **Listening questions:** (1) in seg 2, WHEN do you start hearing the attack-
  first grains — and does the field's character shift or just color? (2) seg 3 vs
  seg 1: legible now that it arrives staged? (3) does sine's entry (seg 3 only)
  soften the density (attack-salience risk)?

### 039 — DH8: continuous surge→expodec morph (awaiting listen)
- **Date:** 2026-08-12 · **Status:** awaiting listen
- **`dh8-surge-to-expodec`** — ONE continuous 48 s render (no ramp in/out, no
  segment seams): flat 7/s, MAXDENSE-1 tiers. Engine addition: `envMixRamp.points`
  (piecewise-linear mix waypoints — holds + transitions in a single schedule).
  - 0–14 s: 100% surge · 14–34 s: linear morph (realized 31%→74% expodec through
    the transition) · 34–48 s: 100% expodec. No sine. 239 grains.
  - Realized ≈5 onsets/s under the anti-run/tier constraints (the known
    constraint price at sustained density — the DH5-approved feel).
- **The compositional device being auditioned:** the SPECIES TRAJECTORY — where
  the attack lives (end-of-grain → start-of-grain) migrating across a texture
  while density holds still. Composer's remote-mute workflow documented in
  REMOTE_AUDITION (mmsys.cpl → mute Realtek endpoint only).
- **Listening questions:** (1) does the morph read as ONE texture transforming
  (fluidity!) or as a crossfade of two textures? (2) where is the perceptual
  tipping point — before/at/after 50%? (3) full-expodec hold: does density
  survive when every attack is grain-INITIAL (forward-masked tails vs the
  surge's backward-masked builds)?

### 040 — DH9: surge→sine morph on the SAMPLED crescendo (awaiting listen)
- **Date:** 2026-08-12 · **Status:** awaiting listen · DH8 = PINNED (composer:
  "a sense of maybe how to use" — characterization deferred, device kept)
- **`dh9-surge-to-sine`** — same continuous 48 s design and SAME SEED as DH8
  (identical scheduling): 14 s pure surge → 20 s morph → 14 s pure sine.
- **THE SURGE CHANGED (composer):** surge grains now ride the REAL sampled
  crescendo — technique `cresc_decr_ks`, **KS C0 = cresc-cut-no-tail** — via the
  new `sonifyMode:'ks'` playback path (KS latch + static CC7 level in the
  pre-arm; NO CC7 stream — the sample is the crescendo; noteOff = the cut).
  **Sample-length guard** (per-note measured table now in compiler.js,
  3.39–5.86 s): grains that don't fit revert to CC7 per the composer's rule —
  realized 115 KS / 5 CC7 fallbacks (the exceptional-tier grains at note 45's
  4.98 s sample).
- **Physics note to listen FOR:** the sample's own arc sets loudness growth —
  short KS grains speak only its quiet opening, so the short tier gets quieter
  and the long tier carries more weight than under CC7 shaping. Real-crescendo
  physics, not a bug — but it rebalances the field.
- **Listening questions:** (1) the sampled surge vs CC7 surge: worth it (bite,
  body)? (2) short-grain quieting: acceptable/desirable? (3) the morph to sine:
  where does the mass lose its attack-carried density (X-rule risk)?

### 041 — dens1-builds: the density-delta battery (awaiting listen) + standing decisions
- **Date:** 2026-08-12 · **Status:** awaiting listen
- **Standing decisions (composer):** ALL CC7 again — the KS-sampled surge stays
  AVAILABLE (`surgeKS`) but performers can get closer to CC7-shaped swells ·
  grain-env diversity research DEFERRED to a future thorough pass ("not getting
  a concrete sense") · **standing mix adopted: {surge 0.7, sine 0.3}**, random ·
  focus shifts to MATERIALS (recipe paradigm) for the piece.
- **`dens1-builds`** — one timeline, four builds, each ramping 0.5→7 onsets/s
  (geometric) then holding max 12 s; MAXDENSE-1 tiers; standing mix; seed
  20260819. Min density = solo-part territory (composer: "min density might be
  just one part").
  - **LONG 2–59 s** (45 s ramp) · **MED 65–99 s** (22 s) · **SHORT 105–127 s**
    (10 s) · **REAL-SHORT 133–149 s** (4 s)
- **The question being calibrated: the perceptual delta of density under
  CONTINUOUS change** — (1) at which ramp length does the build read as motion
  (vs finding 12b's imperceptible drift on one end, vs a jump-cut on the other)?
  (2) where in each ramp does "getting denser" actually kick in (the density
  threshold moment)? (3) does the sparse opening (~1 part) read as the SAME
  texture rarefied, or a different thing that becomes the texture?

### 041b — dens1-builds REGENERATED (mix correction, awaiting listen)
- **Composer:** expodec was missing entirely (the earlier "rex/sin" mix had no
  expodec). **Standing mix corrected: surge .70 / expodec .21 / sine .09**
  (70/30 surge/other; other = 70/30 expodec/sine) · **alt species on short+mid
  tiers only — all longs surge** (new engine dial `altTiersMax`).
- Same four builds/seed as 041; realized e.g. MED: 69 surge / 28 expodec /
  11 sine, zero non-surge longs.

### 042 — dens2-long-ab: the sounding-count regime analysis + smoother-ramp A/B
- **Date:** 2026-08-12 · **Status:** awaiting listen
- **The mechanism behind the LONG build's three stages (candidate finding 15):**
  the ear doesn't hear onset-rate — it hears SOUNDING COUNT (≈ rate × mean grain
  dur ~1.15 s) and gaps. The geometric ramp 0.5→7/s over 45 s crosses two
  categorical boundaries: count ≈ 2 ("now it's polyphonic") at rate ~1.5/s =
  **t≈19** ✓ and count ≈ 4–5 (voices fuse into mass) at rate ~3.9/s = **t≈35** ✓
  — exactly the composer's heard steps. Below count 1 (t<13) there is no density
  percept at all, only events; and geometric interpolation spends ~40% of the
  ramp down there. Small-integer count crossings are CATEGORICAL (1→2 is a
  doubling + a qualitative change; 4→5 barely registers) — L4 extended to
  density; also X-rules' "terraced evolution" arriving uninvited.
- **Consequences:** a 0.5→7 build cannot be made fully smooth at the bottom —
  the polyphony crossing is intrinsically step-like. It CAN be shortened,
  shifted, or masked (cue-bundle: level/duration ramps — finding 12b).
- **A/B `dens2-long-ab`** (engine: `leg.mode 'linear'`; same seed 20260820,
  standing mix, 45 s ramp + 12 s hold each):
  - **A 2–59 s LINEAR** rate 0.5→7: mid-ramp absolute growth is much faster
    (t19 ≈ 3.2/s vs geometric 1.5) — the sparse regime shrinks to ~7 s.
  - **B 65–122 s REGIME-ENGINEERED**: 6 s sprint through sparse (0.5→1.6) ·
    26 s slow audible middle (1.6→4.2 linear) · 13 s controlled entry into mass
    (4.2→7) — ramp time spent where the ear can track change.
- **Listening:** which reads closer to ONE continuous build? Where do steps
  remain (they'll mark the truly categorical boundaries)? If a step at the
  bottom survives both: embrace terracing there (X8) or mask with level ramp.

### 043 — dens3-accel-ab: the ACCELERANDO scheduler (composer-designed, awaiting listen)
- **Date:** 2026-08-12 · **Status:** awaiting listen
- **dens2 verdict:** over-corrected — front-loaded ramps read as "dense by 20,
  flat after." Quota-window scheduling diagnosed as the wrong generator for
  BUILDS: window-scale randomness swamps the gap trend at sparse rates.
- **The composer's algorithm (built as `spec.accel`):** time-domain point
  placement — the gap chain shrinks along an acceleration curve
  gap(u) = gapStart·(gapEnd/gapStart)^(u^γ); **γ = the gradual/sudden dial**;
  each gap × lognormal jitter (noiseSigma — sound-mass randomness at per-gap
  timescale, zero-mean in log so the trend is untouched); after T, holds at
  gapEnd. Reserved tiers ride the equivalent rate curve. Duration T freely
  tweakable ("longer time span to make a smooth change happen").
- **Division of labor now explicit:** quota windows = STATIONARY textures;
  accelerando chain = TRANSITIONS. (The two generators coexist in
  compileOnsetCloud: trajectory vs accel.)
- **A/B `dens3-accel-ab`** (seed 20260821, standing mix, T=60 s, gaps 2.0→0.143 s,
  σ 0.15, 12 s hold): **A 2–74 s γ=1.0** (steady accelerando; verified gap trend
  1.29→0.65→0.30→0.19 s) · **B 80–152 s γ=1.75** (gradual-then-sudden).
- **Listening:** (1) does the accelerando read as ONE continuous build at last?
  (2) γ taste: steady vs late-sharpening? (3) is σ 0.15 the right noise — random
  enough for mass, tame enough to keep the trend? (4) T=60: right span, or
  longer?

### 043b — dens4-accel-pure: the naked accelerando (calibration stimulus)
- **Composer (dens3 verdict):** "better — detecting a sense of swell, but not
  calibrated. Try first NO noise, just the long — essentially a regular
  acceleration."
- **`dens4-accel-pure`** — single segment 2–74 s: γ=1, σ=0 (DETERMINISTIC gap
  chain — deliberate L1 override as an isolation stimulus: hear the naked
  acceleration mechanism before re-adding calibrated noise), T=60, gaps
  2.0→0.143 s, 12 s hold, standing mix/tiers unchanged, seed 20260822.
- Purpose: calibrate the acceleration percept itself; noise σ returns as its
  own ladder afterwards.

### 043c — THE APEX-SCRAMBLE BUG + peak-anchored scheduling (the dens4 fix)
- **Date:** 2026-08-12 · **Status:** fixed, verified; regenerated dens4 awaiting listen
- **The bug (composer's ear caught it across dens1–4):** since pass 2 the engine
  scheduled ONSETS, but the perceptual attack for surge (70%) is the APEX =
  onset + dur; random durations (0.6–5 s) scrambled every density trajectory in
  apex-space. Measured on the \"pure\" accel: onset gaps orderly (first: 2.00,
  1.83, 1.69, 1.15…) — apex gaps near-random (1.52, 2.48, 2.75, 0.29, 0.07,
  3.37…; CV 0.94). Reserved tiers also injected window-random onsets into the
  \"deterministic\" chain.
- **Engine principle (carved):** THE SCHEDULING ANCHOR MUST BE THE PERCEPTUAL
  ATTACK POINT. New `anchor: 'peak'` mode: generated points = PEAK times;
  species-aware pre/post from the envelope geometry (surge peak at end, sine
  center, expodec near start); onsets back-calculated; per-part interval
  reservation in peak order; back-span truncation when a part can't host the
  full swell (17% at the pure accel — silent early starts shrink, peaks stay).
  This is the SC swell-cloud insight (peak-cut scheduling) rejoining the OC
  machinery — full circle, now with tiers/species/accel.
- **Verified:** σ=0 chain → realized apex gaps EXACTLY 2.00/1.83/1.69/1.57/1.47…
  monotone to the hold, 0 drops. dens4-accel-pure regenerated peak-anchored
  (seed 20260822).
- **Standing:** accel builds default to anchor:'peak'. Stationary quota textures
  keep onset-anchor (their max-randomness hides the scramble — but revisit if
  apex-precision passages emerge).

### 043d — dens5-accel-noise: calibrated noise atop the fixed accelerando
- **Composer (dens4-peak verdict):** "better" · end-plateau identified as the
  DESIGNED 12 s hold (straight-line request disregarded per composer's rule);
  note: the ramp top also perceptually saturates ~5/s+ (count categories).
- **`dens5-accel-noise`** — dens4 exactly (peak-anchored, γ=1, T=60, seed
  20260822) + per-gap lognormal jitter σ=0.15 restored. A/B partner: pure
  (dens4) vs sound-mass (dens5) — calibrates whether σ 0.15 roughens without
  losing the swell.
