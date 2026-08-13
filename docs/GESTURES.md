# The gesture bank

*Entities: precise shapes (rhythm + duration + envelope mix) kept fixed, varied
by pitch distribution and light parameter changes. Taxonomy/nomenclature
deliberately deferred — collect first, systematize later.*

**The bank folder:** `bank/*.json` — one file per entity (raw notes + cleaned
variant + provenance), kept OUT of the Load dropdown; entities are inserted
into scores on request ("insert CLUST01-C at 45s on parts 3-5").

## The formal principle (composer, 2026-08-13)

Fixed gesture + changed pitch distribution = **repetition with change**: the
shape reads as "the same thing again" (phrase-like identity) while the pitch
field makes it new. This is a candidate backbone for the piece's form.
Extension: repeated gestures each varied slightly (shorter duration, different
grain-type mix) — the varied-repetition operator.

## The bank

| Entity | Source | Color | State |
|---|---|---|---|
| **GESTURE-1** | A1-5 take → A1-5-fp_cres-3 | `#AD5F2A` | banked; 9 pitch variants (gest1-pitches). **Pitch-set VERDICTS (2026-08-13): kept = #1 oct-displace, #2 fifths-one, #6 Messiaen mode 6 (F#)**; others remain available. **#1 = the piece's OPENING (piece-s01)** |
| (GESTURE-2) | A2-hp-whole | — | **needs redo: different lengths + envelope types** (composer note) |
| **CLUST01-A…J** | cluster_samples_01 (10 segments, silence-split) | — | banked in bank/ (raw + cleaned per entity); pointillistic clusters. De-chord rule: 55 ms chain-link groups, keep LOUDEST (tie: earliest). Audition: clust01-cleaned |
| … | more swell takes to record | — | composer note-to-self: capture a few more |

## THE GESTURE-1 WORKFLOW (the envelope-decision template — repeat for future gestures)

1. **Play it in** — staccato patch, one lane per pass, cumulative saves
   (A1-1…A1-5); the played onsets ARE the gesture's rhythm skeleton.
2. **Analyze** (`tools/analyze_take.js`) — carrier fit, clusters, level contour;
   fingerprint into `analysis/`.
3. **Make performable** (`tools/make_playable.js`) — redistribute over 10 parts
   under the re-artic law; thinning only where physics demands.
4. **Choose the base species by region** — here: fortepiano for the sparse/mid
   body, staccato for the dense tail; switch point by ear (~29.5 s).
5. **Duration inflation** — fp durations ×3 target (≥×2), proportions preserved,
   parts redistributed to absorb collisions (`tools/transform_fp.js`).
6. **Transition zone** — hard switch → probabilistic crossfade (25–30 s ramp).
7. **Reintroduce the point-species** — random half of the inflated notes
   reverted to original-duration staccato (scattered mix = two species
   interleaved).
8. **Selective bloom** — composer listens, selects notes, presses **G**: chosen
   notes become surge crescendos peaking at their played onsets (grain-suite
   editable afterward).
9. **Bank it** — name, identity color, keep out of the piece score until called.
Decision style throughout: one move per listen; physics (feasibility) does the
crossfades wherever possible; probability only where physics has no opinion.

## Planned gesture types (composer dictation 2026-08-13 — "about to do them")

- **Pointillistic mass** (like the dense END of the curves, staccato): composer
  will play several repetitions at several lengths. Expectations to test:
  a generalizable density-increase profile; characteristic apexes ("if it's
  held we can extend it").
- **Vertical/chord shapes** ("not exactly chords — I suppose they are"):
  a bunch of 10-part versions, built the way the pitch distributions were.
- **Overlapping-crescendo pulse**: each part progressively more overlap —
  reads as a *pulse of crescendos* inside a continuous texture ("a continuous
  crescendo of crescendos, not one continuous crescendo"). The Risset lineage.
- **Clips as gestures**: excerpt bits of longer gestures/textures to serve as
  standalone gestures (the keeper-excerpt practice becomes a derivation
  operator).
- **Varied repetition**: same gesture repeated, each instance nudged (duration,
  grain-type mix).
- **Tremolo / ostinato ensemble textures**: to develop (the piece-#2 ostinato
  lineage arrives in tuba land).
