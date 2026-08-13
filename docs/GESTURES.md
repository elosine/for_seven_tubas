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
| (GESTURE-2) | A2-hp-whole | — | **A1 treatment applied 2026-08-13** → `A2-fp_cres` (human take only: 50% fp before 22 s, fp→stac crossfade 22–27 s, all-stac tail, fp durations ×3, 10-track redistribution, 0 thinned; awaiting composer G-key surge conversions). Earlier note stands: different lengths + envelope types still to explore |
| **CLUST01-A…T** | cluster_samples_01, COMPOSER-corrected segmentation (20 windows, dictated boundaries; 20-31 = five sub-clusters; forced split at 129.5) | — | bank/ holds raw + cleaned per entity. De-chord: 55 ms chain-link, keep LOUDEST (tie: earliest). Audition: clust01-cleaned · 10-track + META shapes: clust01-10track (rotation-preference distribution — avoid immediately-previous part). **A superseded by A1/A2** (split at the 7.08 s pause, dictation 2026-08-13) |
| **CLUST01 carves: A1 A2 L2 S1 B2 I1 J2** | composer carve dictation 2026-08-13 (cleaned-score timestamps mapped back to take-time): L2 = L from 109.39→end, S1 = S start→176.3, B2 = B 18.69→end, I1 = I start→69.64, J2 = J 80.3→end | — | banked (parents left in place, except A which the A1/A2 split replaces). **SHORTLIST = [L2, M, S1, B2, I1, J2]** — the working set for harmonization |
| **sl01-harmonies** (sequence score, not an entity) | shortlist × 18 pitch treatments: VERT01 01/05/09/13/17/23/28 as pitch sets (uniform draw) · oct-displace (50/30/15/5) · fifths stacks rooted 30/33/37 · all 7 Messiaen modes anchored F# (pooled 30–65) | — | scores/sl01-harmonies.json, 2.3 min, every excerpt marker-labeled "cluster x concept", 10-part rotation distribution, 0 thinned. Superseded by sl02's COMPOSER chord shortlist |
| **sl02-harmonies** (sequence score) | COMPOSER CHORD SHORTLIST (dictation 2026-08-13): VERT01-03/04/06/07 by number + by take-time 48→11, 52.5→12, 74.8→16, 109.68→23, 140.38→28, 163→33 (last chord) · fifths stacks ×2 (roots 30, 37) · octave stacks ×2 (F# 30/42/54, Bb 34/46/58) · Messiaen picks (later dictation): **m7 + m4, anchored F#** | — | scores/sl02-harmonies.json, 1.8 min, 14 excerpts, same cluster rotation [L2, M, S1, B2, I1, J2], labels "cluster x concept", 0 thinned (VERT01-16's out-of-ord 67 filtered) |

## The harmony palette + pairing ledger (dictation 2026-08-13 evening)

**Harmonies** (21): VERT01 03/04/06/07/11/12/16/23/28/33 · 5ths roots 30, 37 ·
octaves F# (30/42/54), Bb (34/46/58) · **BbE-2oct cluster** (Bb–E chromatic in
1st + top octave: 34–40 + 58–64, 14 notes) · Messiaen **m7** + **m4** (F#,
spread-placed 10 notes) · four 7-note chromatic clusters: **low** 30–36,
**mid** 44–50, **high** 59–65, **spread** (bottom-7 pcs octave-displaced:
30,36,43,47,56,57,58).

**Pairing shortlist:** B2 × BbE-2oct (on the SHORTER list) · M × 5ths root 30
(keeper, as is) · **L2 × cluster spread** (PINNED, composer 2026-08-13 —
bottom-7 pcs octave-displaced: 30,36,43,47,56,57,58).

**Audition scores:**
- `harmony-blasts` — all 21 harmonies × three blasts each (staccato 0.4 s /
  fortepiano 3.5 s natural decay / short ord 0.8 s), 10 lanes low→bottom, even
  fill/sample when set ≠ 10, marker per harmony. 4.3 min.
- `pairs01` — the ledger as written: B2×BbE-2oct, M×5ths-30, L2× each of the
  four clusters. 0.8 min.

## In the piece

- **piece-s06**: + **octaves Bb ord blast** (34/46/58 over 10 lanes) at
  **43.46 s × 2.5 s** (`grp-octbb-ord-01`, flat-bar shape — ord sustains).
  Carries composer placements: H1 dragged to 39.95, blast shortened to 1.24 s.
- **piece-s05**: + **CLUST01-H1** (carved from clust01-10track 54.06–56.2,
  inside the H block: 17 notes / 2.05 s ≈ 8/s, 10-track lanes kept) parked at
  41.83 s — 1.5 s after the blast — movable/stretchable filled shape
  (`grp-h1-01`); composer will drag into place. Entity banked as
  bank/CLUST01-H1.json.
- **piece-s04**: THREE gestures, all with movable META shapes — (1) the opening
  big build finally drawn: **long crescendo wedge** over 2.0–34.65 s, bound to
  the whole opening (`grp-g1-opening`, draggable as one unit); (2) the scr2
  burst at 36.2 s (composer dragged it 36.54→36.2 — first in-the-wild group
  drag); (3) **VERT01-03 fp blast** parked at 40.0 s, note duration 1.98 s
  (composer heard the fp decay done at 5.88 in harmony-blasts; onset was 3.9),
  decay-wedge shape, composer will drag into place (`grp-vert03-fp-01`).
- **piece-s03**: the B2 × BbE-2oct excerpt REPLACED by **CLUST02-A scr2 ×
  BbE-2oct** (the denser scrambled burst, 31 notes ≈ 19/s) at the same spot,
  36.54 s, movable META group shape (`grp-scr2-bbe-01`).
- **piece-s02** (increments piece-s01, never overwrite the piece save):
  B2 × BbE-2oct inserted at **36.54 s** — the exact pairs01 notes — with a
  META-layer rate-contour shape bound via **`groupId`**. Dragging a META shape
  that has a groupId retimes every object sharing it (notes + marker move with
  the handle, micro-timing and lanes preserved; the shape itself stays on META).
  Mechanism: `tools/piece_s02.js`; drag logic in composer.html
  `startWCBodyDrag`. Any future gesture insertion can use the same pattern.
| **VERT01-01…33** | vertical_shapes_01 (33 played chords, 4–11 notes) | — | bank/ holds pitches+velocities per chord. Audition: vert01-versions (v1 as-played low→bottom-lane · v2 ten-note octave-displaced max-spread). FLAGS: 07 exceeds 10 (11 pitches, awaiting composer redaction/promotion); 8 chords contain notes above ord F4=65 (66–68) |
| **CLUST02-A** | GESTURE-1 (piece opening) carve **32.17–33.79** — the dense burst the B2 cluster lacked (31 staccato notes / 1.61 s ≈ 19/s) | — | banked; audition `clust02a-versions`: verbatim + 4 SCRAMBLES (gap-sequence + note-order shuffled, lanes redistributed — same density/feel, not a repeat) × pitch structures: G1 set (permuted) / BbE-2oct / cluster spread / cluster low |
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
