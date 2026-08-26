# TRANCE A4 REVISION — plan (day 36, planned on Fable)

> Composer's ask, day 36: bring TRANCE A4 back toward `trance-section-01`'s
> look — single bouncing ball at beats, no per-note GCs or go lines — plus
> bar/tempo fixes, 40.92-style long-tone columns, swell-curve fix, and the
> final-crescendo apparatus. "So last time the agent tried this, they missed
> a lot of things" — hence this plan. Implement ONLY from this file.
> OPEN QUESTIONS at the bottom must be answered before the matching step runs.

## The page

- id `trance-a4`, label `TRANCE A4 — 500-751 s`, source `piece-s28`,
  window [499, 753], `hideMarkers: true` — ALL KEPT.
- Current build (provenance.build):
  `node tools/notate_section.js --score piece-s28 --w0 499 --w1 753 --parts 0-9
   --profile section1 --id trance-a4 --bricks --trance grp-tranceA4-01 --label "TRANCE A4 — 500-751 s"`
- The revision is a REBUILD via the same command; all changes land in
  `notation/lib/trance_overlays.js` (+ small touches listed in § Code).
- NOT folded into MAIN DRAFT. MAIN DRAFT untouched (prove: 0 added / 0 removed / 0 changed).

## Measured facts (verified against piece-s28 data, day 36 — do not re-derive by guess)

### Tempo stretches (current 8 `tempo` overlays; times stay, first value changes)

| t | current mark | data: per-part pulse | data: composite |
|---|---|---|---|
| 499.83 | 75 | 0.8 s (75) each, two teams of 5 alternating | **0.4 s grid = 150 bpm ← THE HEARD PULSE, mark 150** |
| 548.63 | 80 | 0.75 s all 10 parts, phase-spread | no composite grid (smear) |
| 566.63 | 87 | 0.69 s all 10 | smear |
| 582.23 | 93.8 | 0.64 s (9 of 10) | smear |
| 604.63 | 100 | 0.60 s all 10 | smear |
| 620.63 | 107.1 | 0.56 s all 10 | smear |
| 664.63 | 113.2 | 0.53 s all 10 | smear |
| 709.43 | 120 | 0.50 s all 10 (n=83/83 every part) | smear (phase-spread) |

- Only the FIRST mark is wrong (composer): **150, not 75**. The opening is the
  one stretch where two teams interleave into a real composite grid.
- Marks 2–8 match what every part actually plays. **OPEN Q-A** confirms they stay.

### The long-tone columns, 517–528 (all onsets sit ON the 0.4 s grid)

| onset | parts | techniques | data durations (s) | shortest |
|---|---|---|---|---|
| 517.83 | 10 | ord + cuivre | all 0.20 (colEdit stubs) | 0.20 ← **OPEN Q-B** |
| 519.43 | 6 | ord + cuivre | all 0.20 (stubs) | 0.20 ← **OPEN Q-B** |
| 521.03 | 10 | fortepiano | 0.67–0.71 | 0.67 |
| 522.63 | 10 | fortepiano | 0.64–0.66 | 0.64 |
| 525.43 | 10 | fortepiano | all 0.65 | 0.65 |
| 526.23 | 7 | ord | all 1.04 | 1.04 |
| 527.43 | 6 | ord + cuivre | all 1.32 | 1.32 |

### The CB block (long-tone columns near 647, all ord)

| onset | parts | data durations | shortest |
|---|---|---|---|
| 647.43 (CB1) | 5 | all 2.40 | 2.40 |
| 650.23 (CB2) | 5 | all 1.20 | 1.20 |
| 651.83 (CB3) | 5 | all 2.80 | 2.80 |
| 655.03 (CB4) | 5 | all 0.80 | 0.80 |
| 656.23 (CB5) | 7 | all 8.00 | 8.00 |

Composer named 647.41 only — **OPEN Q-D**: CB1 only, or all five.

### Swells (SW1–SW5, already surge devices; keep, fix curve start only)

685.03 (2p) · 689.43 (4p) · 692.23 (6p) · 697.43 (8p) · 701.03 (10p).
Level data starts at y=2/10 (SW5 nodes [0,2]→[1,9]) — drawn curve starts
~10–20 % up. Fix in § Steps 6.

### PH6 — the final section (709.43 → 751.42)

- All 10 parts at 0.50 s pulse (120), phase-spread. 838 notes.
- recVel FLAT (100) — the crescendo is NOT velocity; it is the per-note drawn
  level: node y rises 2.2 → 9.5 across the stretch.
- Markers: `PS6 BASE` 709.43 · `PS6 hold ff` 746.29 · `asm end` 751.42.
  Curve shape: ramp 709.43→746.29, hold to 751.42 (verify the knee from the
  per-note y-vs-time series at build time).

### The 40.92 model column (MAIN DRAFT — what "like the column at 40.92" means)

- 10 parts at 40.934, fp + cuivre.
- Each note: its technique's one-shot device (fp = go line · GC · open stemless
  nh-unit · ring bar · sfzp; cuivre = same + `cuivré` text) PLUS overlay
  `{device:{ringSeconds:<uniform>, ringBar:true}}` — one written length for all.
- In A4 the columns include ord notes: the plain-ord device has NO GC and NO
  ring bar by default — the overlay must ADD `gc:true, ringBar:true,
  ringSeconds:<col>` and suppress the band dynamic (`dynMark:false`).

## Steps

**0 · Baseline.** Copy current `notation/ir/trance-a4.ir.json` aside (scratchpad)
for before/after diffing. MAIN DRAFT hash noted.

**1 · Pulse notes (every quarter-note event on the page — all families:
PULSE, BASE, G/D/F, PH1–PH6, MTB, P9/P10/P12, UNISON).**
Overlay device per note:
- `nhStem:'plain'` (as now), `brick:false` (as now)
- **`nhAnchor:'leftEdge'`** — head LEFT EDGE on its go time (composer; cluster rule)
- **`gc:false`** — no disc, no arc, no per-note ball
- **`goLine:false`** — no go lines
- staccato dot STAYS (articulation)
- no band dynamics anywhere (`dynMark:false` where a device would print one)
Long-tone events NOT in §2/§3 keep current treatment (the two UNISON notes
etc. — inventory at build time, list them in the build log).

**2 · The columns.** The 7 columns (517.83–527.43) + CB per Q-D:
each member note gets its technique's one-shot device plus overlay:
- `gc:true` · `goLine:true` · open stemless head (fp/ord/cuivre defaults)
- `ringBar:true` · `ringSeconds:` = that column's shortest data duration
  (per Q-B/Q-C), same value for every member of the column
- articulations only as the technique actually carries: **sfzp on fp** ·
  cuivré text per **Q-G** · ord = nothing
- `dynMark:false` (no band dynamics — composer: "just one set of dynamics
  at the beginning f. no other dynamics until end")
- ring bars may run past the breath rule → drawn as asked, warning ok
  (day-30 `ringSeconds` behavior; sound never changes, D49/D51)

**3 · Dynamics.** One **f** at 499.83 (placement per **Q-E**), then NO dynamic
marks until the swells' own pairs (685+) and PH6's pair (§5). Strip any other
mark the build would emit.

**4 · Bar lines + tempo marks.**
- Bar line + ♩=N mark at all 8 change points (times above). First = **150**;
  2–8 unchanged pending **Q-A**.
- Gap: bar sits **one STANDARD gap (0.45 ss, the stackGapSs house standard —
  "the largest, between dynamics and accents") left of the GO TIME** —
  clear space measured from the bar's right edge to the go-time x.
  (Current: gapMediumSs 0.3. Change the layout emit at layout.js:300 and pass
  the token; keep it a registry number, not a literal.)
- Tempo values become authored data in `trance_overlays.js` (the measured
  table above) with the modal-IOI derivation kept as a CHECK that prints a
  warning on mismatch — the derivation already mislabeled the opening once.

**5 · The ball.** "Single bouncing ball at beats like trance-section-01":
- Emit chunk-level `{kind:'gc', at:<beat>}` devices on the beat grid of each
  tempo stretch (anchor = the stretch's bar time, period = the marked beat:
  0.4 s in stretch 1 per the 150 mark, then 0.75/0.69/0.64/0.60/0.56/0.53/0.50),
  with **preset `{duration:<beat>}` so consecutive bounces tile** — ball lands
  exactly on every beat, one ball visible at any moment.
- `animobj.js` collect(): pass the chunk device's `preset` through (today it
  drops it — one line).
- Lane(s) per **Q-F**; whether the ball runs through the column/swell/PH6
  stretches also per **Q-F**.
- Chunk gc devices also draw the small tick at tickY (existing behavior,
  matches trance-section-01) — keep.

**6 · Swells.** Keep everything; ONLY re-map each swell's drawn curve so it
starts at 0: samples remapped `v → (v−min)·max/(max−min)` (start 0, peak keeps
its height). Drawing only — data untouched. Implement as a device flag (e.g.
`curveZero:true`) handled where layout builds the envcurve item, so the morph
pages and MAIN DRAFT surges are untouched.

**7 · PH6 apparatus.** On top of §1 treatment:
- A long crescendo curve per part (or once, per **Q-E**) spanning
  709.43 → 746.29, then flat to 751.42 — samples from the per-note level ramp
  (2.2→9.5 on the 0–10 scale, normalized 0→1 over the span; same remap rule as §6
  if the floor should read 0 — it starts at 2.2/10 ≈ 22 %, so YES: remap to
  start 0). Reuse the morph machinery: overlay kind `cresc`
  {target:{part,span}, value:{samples}} → limeGreen crescCurve fill (bottom
  half) + crescMeter follower rides it in live view. Verify against
  MORPH_NOTATION.md at build time.
- **ppp → arrow → fff** at 709.43, the surge-pair style, placement per Q-E.

**8 · Rebuild + verify** (all measured in the RUNNING app, not asserted):
- Re-run the build command. Confirm: 0 per-note `gc:true`/`goLine:true` on
  quarter-note events (grep IR); column overlays exactly as §2 (count = notes
  in named columns); tempo overlays = agreed values; swell curves' first
  drawn sample = 0; cresc overlay spans/samples as §7.
- Open :5200/notation/app/notation.html → TRANCE A4. Screenshot at:
  opening (bar+150+f+ball), 517–528 (columns), 647–657 (CB), 685 (swell
  start-at-0), 709.43 (pair + curve start), 746–751 (hold).
- Watch the live ball a few beats each at 499.83 / 604.63 / 709.43 — tiling,
  no double ball, lands on beats.
- MAIN DRAFT + morph pages: prove untouched (byte or tile diff).
- SAVE_FILES.md: update the TRANCE A4 paragraph. RUNNING_LOG entry.

## Code touchpoints (expected)

| file | change |
|---|---|
| `notation/lib/trance_overlays.js` | rewrite build(): §1 devices, §2 columns, §3 dynamics, §4 authored tempi, §5 beat-gc devices, §7 cresc overlay + pair |
| `notation/lib/animobj.js` | chunk-device preset passthrough (§5) |
| `notation/lib/layout.js` | barline gap token 0.45-from-go-time (line ~300); `curveZero` remap on envcurve item (§6); nothing else |
| `notation/registry/container.json` | only if a new style token is needed (prefer existing stackGapSs) |
| `tools/notate_section.js` | only if trance_overlays' new outputs need plumbing (chunk devices / cresc overlays / f + pair emits) |

Guardrails: byTechnique defaults, GC physics, morph overlays, MAIN DRAFT
command paths — DO NOT TOUCH. Tests: run `tools/test_layout.js`,
`test_animobj.js`, `test_notate_block.js` after; add a check that chunk-device
presets survive collect() if animobj changes.

## OPEN QUESTIONS (answered by the composer before the matching step)

- **Q-A (§4)** — tempo marks 2–8 stay 80 / 87 / 93.8 / 100 / 107.1 / 113.2 / 120
  (what each part actually plays)? The 150 start then reads as a drop to 80 at
  548.63 — data-true (the two-team interleave ends there), but confirm.
- **Q-B (§2)** — columns 517.83 & 519.43: every data note is a 0.20 s stub.
  Shortest-note rule would give a 0.20 s bar. What written length?
- **Q-C (§2)** — duration per column = that column's own shortest (values
  differ: 0.67/0.64/0.65/1.04/1.32…)? Or one shared length for all columns?
- **Q-D (§2)** — the CB block: all five columns (647.43/650.23/651.83/655.03/
  656.23) in the 40.92 style, or only 647.43?
- **Q-E (§3, §7)** — the opening **f**, and PH6's **ppp→fff**: once per part
  (all ten lanes — survives part extraction) or once on the page?
- **Q-F (§5)** — the ball: one per part lane (ten bouncing in sync) or ONE
  ball on a single lane (which)? And does it keep bouncing through the
  column/swell/PH6 stretches or only during plain pulse?
- **Q-G (§2)** — cuivre column notes: keep the day-30 `cuivré` text, or does
  this page's no-text rule strip it?
