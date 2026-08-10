# Crescendo taxonomy — research base + working framework

*Research pass 2026-08-10. Companion to RISSET_RECIPES.md (which is the ensemble-
deployment layer; this doc is the single-crescendo layer under it). Experiments log
in CRESCENDO_EXPERIMENTS.md as they run.*

## 1 · What the research actually says (four pillars)

**P1 — Rising is special ("auditory looming bias").** Listeners systematically
overestimate rising-intensity sounds vs. equal falling ones — louder, longer, greater
change — with amygdala involvement and heightened attention/emotion. The bias grows
at higher end levels and is stronger for **tonal** sources than noise (good news:
tubas are tonal). A crescendo is not a decrescendo played backwards perceptually;
the drama asymmetry is free and physiological. *(Neuhoff 1998; Olsen & Stevens 2010;
PNAS 2017 looming work.)*

**P2 — The end dominates the memory ("end-level dominance").** Global loudness
judgment of a time-varying sound is driven by its **maximum level and how near the
end it sits** (Susini/Ponsot). Composition consequence: where the peak lands and what
happens right after it (§3, peak behavior) controls what the listener *remembers* the
crescendo as — more than its interior shape.

**P3 — Shape only exists relative to a space.** Hearing is ~logarithmic: a ramp
linear in *amplitude* reads as back-loaded (hold… hold… bloom at the end); a ramp
linear in *dB* (= exponential in amplitude) reads as steady; equal-power (sine) holds
fuller through the middle. **The same drawn curve is a different percept in a
different control space.** So every taxonomy entry below is defined in **dB space**,
and our CC#7 must be calibrated before any shape experiment means anything (E0).

**P4 — Performed crescendos are nonlinear and asymmetric.** Messa di voce studies
(classical singers, acoustic analysis): SPL traces are predominantly nonlinear, and
crescendo halves shape differently than decrescendo halves even when the pedagogical
ideal is linear-and-symmetric. Historical categories already in the vocabulary:
**terraced dynamics** (Baroque), the **Mannheim crescendo** (growth by orchestral
density), the **swell** (cresc + immediate decresc).

## 2 · The taxonomy

Five independent dimensions; a "crescendo" is a coordinate in this space.

### D1 — Trajectory family (shape in dB space)

> **Official vocabulary (composer, 2026-08-10):** the two sides of the growth-ratio
> are **BLOOM** (front-loaded) and **SURGE** (back-loaded); a full spec reads
> "8 seconds, surge 5×". Back-pocket alternates for the paper: head-heavy /
> tail-heavy. The ~10:1 ratio is the working boundary of each family (findings 7–8).
> The halfway-loudness moment = the **THRESHOLD** ("surge 5×, threshold at
> two-thirds"). *Note for writing/paper (composer): fuller form ≈ "event perceptual
> threshold" — the moment the event is perceived to properly begin; arithmetically
> the median of the growth distribution.*

| ID | Family | dB profile | Character / prediction | Score curve model |
|---|---|---|---|---|
| T1 | **Steady** | linear in dB | the ruler; neutral growth | power, slope 0 |
| T2 | **Blooming** | fast early, easing to peak | arrives early, settles into fullness | logarithmic |
| T3 | **Surging** | slow burn, late rush | maximum payoff (exploits P2 hardest) | exponential |
| T4 | **Eased (S)** | soft onset, central surge, eased arrival | the "performed" feel; closest to sung shapes (P4) | sigmoid |
| T5 | **Terraced** | discrete steps pp→p→mp… | architectural, Baroque; steps are audible events | stepped (n/a — note-level) |
| T6 | **Compound** | micro-swells under a macro rise | breathing, organic; = the Risset ratchet's part-shape | curve-over-curves |

### D2 — Time scale
**gesture** < 2 s · **breath** 2–12 s (single-tuba realistic swell) · **phrase**
12–60 s (needs compound shape or voice handoff) · **formal** > 1 min (ensemble-level
only: density/stagger machinery).

### D3 — Peak behavior (what P2 says matters most)
**cliff** (cut at max) · **tail** (release/decresc — our C#0 sample's built-in shape)
· **hold** (plateau at max) · **handoff** (another voice absorbs the peak — the
Risset wrap) · **overshoot** (peak then settle back — sfz-adjacent).

### D4 — Growth medium (what physically grows)
| ID | Medium | Rendering here |
|---|---|---|
| M1 | loudness only | CC#7 curves on Ordinario (timbre static) |
| M2 | loudness + timbre | the real Cresc samples (brightness grows; fixed 3.4–5.9 s) |
| M3 | density | voices entering (Mannheim/Boléro); 7 tubas ≈ +8.5 dB of pure stacking |
| M4 | rate | acceleration as intensification (bridge to RISSET_RECIPES) |
| M5 | register | rising pitch under the cresc |
Combinations are where textures live (e.g., M1+M3: CC swells under staggered entries).

### D5 — Ensemble deployment
**solo** · **unison** (all 7 same curve) · **staggered** (canon — the Risset patterns)
· **antiphonal/spatial** (groups trade growth).

## 3 · Research-derived design rules

1. Draw shapes in **dB space** after E0 calibration, or the families are fiction (P3).
2. The peak's **position and aftermath** outrank interior shape for what's remembered
   (P2) — decide D3 first, D1 second.
3. Rising bias (P1) means a cresc→cut→re-enter cycle keeps re-triggering the looming
   response — why Risset-style textures feel relentless; also why decrescendo-based
   mirrors of these patterns will feel weaker than symmetry suggests.
4. Long crescendos on one breath are fiction for tubas (D7 notation-first): >12 s
   requires T6 compound, M3 density, or D3 handoff.

## 4 · Experiment queue (each → CRESCENDO_EXPERIMENTS.md + audio)

- **E0 — CC#7 calibration** *(prerequisite)*: step CC#7 0→127 on held Ordinario,
  record, measure RMS per step → the CC→dB transfer map; build the inverse so curve
  tools emit true dB-space shapes. (Per patch: Ordinario + any others we adopt.)
- **E1 — Trajectory line-up**: one tuba, one pitch, L = 8 s, calibrated T1/T2/T3/T4
  back-to-back; blind-ish audition, composer verdicts verbatim.
- **E2 — T5 vs T1**: stepped (6 terraces) vs steady, same L and endpoints.
- **E3 — T6 compound**: micro-swells (3 × ~2.5 s) under one macro rise, vs one T4.
- **E4 — Peak behaviors**: best-of-E1 shape × {cliff, tail, hold, handoff}.
- **E5+ — Ensemble deployment**: promote winners into the RISSET_RECIPES patterns
  (A-smooth vs B-ratchet, stagger sweeps) — the original plan, now shape-informed.

Audio documentation: takes recorded via the REC chain (WAVs in `reaper/Media/`,
gitignored); keeper excerpts referenced by filename+timestamp in the experiments log.
(Open item: whether to commit trimmed excerpt files under `research/audio/`.)

## Sources

- Neuhoff, perceptual bias for rising tones: https://www.nature.com/articles/25862
- Olsen & Stevens, overestimation of rising intensity: https://pubmed.ncbi.nlm.nih.gov/20677706/
- Looming bias generality (PNAS): https://www.pnas.org/doi/10.1073/pnas.1703247114
- Rising/falling loudness asymmetry: https://link.springer.com/article/10.3758/s13414-014-0824-y
- Ponsot, global loudness of time-varying sounds (thesis): https://theses.hal.science/tel-01665485
- End-level bias on loudness of increasing sounds: https://www.researchgate.net/publication/47531149
- Temporal loudness weights (JASA): https://pubs.aip.org/asa/jasa/article/134/4/EL321/899502
- Fade-curve families and perception: https://manual.audacityteam.org/man/fade_and_crossfade.html
- Messa di voce SPL nonlinearity/asymmetry: https://pubmed.ncbi.nlm.nih.gov/25892091/ · https://www.researchgate.net/publication/12962388
