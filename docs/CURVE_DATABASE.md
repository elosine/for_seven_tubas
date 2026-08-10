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
- **Notes:** *(composer verdict pending)*
