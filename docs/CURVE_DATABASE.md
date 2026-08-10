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
