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
