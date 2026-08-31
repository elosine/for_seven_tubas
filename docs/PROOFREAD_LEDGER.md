# PROOFREAD LEDGER — print score corrections (day 39 →)

> The tracking database for running-order step 3 (PROOFREAD LOOP).
> The composer sweeps the score **part by part in the zoom view**, dictating
> corrections piecemeal, possibly interrupted at any point. **Every dictated
> item lands here the moment it is said — the chat is never the record.**
> This file always answers: *what's been done, and where to pick up.*

---

## POSITION — read this first on any pickup

- **Sweep:** T1 proofed **0 → 140 s**; composer ENDED the proofreading
  sitting there (day 39, mid-session checkpoint). Parts T2–T10 unswept, and
  T1 past 140 s unswept — **the sweep is PARTIAL, not finished.**
- **Parts done:** none of 10 complete (T1 partial to 140 s)
- **Batch state (day 40):** #1 KEEP · **#2 GOOD ✓ · #3 GOOD ✓** ·
  #4 went RETRY (opacity was the wrong diagnosis) and is **re-APPLIED as
  batch 2**: standdown at the final cresc + frames hug fills, verified
  numerically in node AND the live page; eleven batteries green.
- **PICK UP HERE → #4 needs the composer's LOOK** (~76 s · ~700 · ~730;
  morph ~302 must look unchanged; hard-reload first — animobj.js is code).
  After that verdict the sweep resumes (composer decides: T1 past 140 s,
  or T2).

*(AI updates this block at every interaction — it is the cold-resume anchor.)*

---

## THE LOOP (composer's spec, day 39)

1. **COLLECT** — composer dictates corrections ("move the cuivré text up at
   3.29 s"…); AI logs each as an ITEM, status `LOGGED`. No clarifying
   questions mid-flow — ambiguities get a `?` in *read as* and are resolved
   at apply time.
2. **APPLY** — on *"go ahead and make those changes"*: batch-apply all
   `LOGGED` items, re-render, mark each `APPLIED` with a *done:* line
   (what changed, where, before → after).
3. **REVIEW** — on request, AI lists the applied items (timecode + what
   changed); composer verdicts each: **GOOD ✓** or **RETRY ↻** (with words).
   Verdicts are recorded per item immediately — a review interrupted after
   2 of 12 loses nothing.
4. Repeat. `RETRY` items rejoin the next apply round.

**Statuses:** `LOGGED` → `APPLIED (batch N)` → `GOOD ✓` / `RETRY ↻` → re-`APPLIED` → …
`DROPPED` = composer rescinded it.

**Apply rules:**
- Fixes land at the **durable layer** (registry / tools / save / build args)
  so `bash print/score/build.sh --rebuild-ir` reproduces them — never
  hand-edit IR content that a rebuild would overwrite.
- Re-render after every batch; composer reviews the fresh PDF.

---

## SWEEP CHECKLIST

| part | state |
|---|---|
| T1 | ► proofed 0 → 140 s (#1 keep · #2 #3 logged) |
| T2 | — |
| T3 | — |
| T4 | — |
| T5 | — |
| T6 | — |
| T7 | — |
| T8 | — |
| T9 | — |
| T10 | — |

*(► = composer currently in this part · ✓ = swept, corrections collected ·
a part is only ✓ when the composer says they're done with it.)*

---

## ITEMS

### #1 · T1 @ ~38.48 (cl-22, group 5, notes 11–14) · GOOD ✓ — KEEP (composer, day 39)
- said: "two one at 38.48 — do we have any record of why I made that beaming
  decision? why beam the one normal 16th with the 7:4 rather than the 16th
  with the previous 16th rest and the 7:4 in its own beaming"
- read as: T1 ("tuba one"), the figure whose 16th rest sits at ≈38.47 —
  beam group cl-22e = plain 16th @38.614 + 7:4 triple @38.775–39.090
- answer (from the record): the grouping is the composer's own — day 28 T1
  verdict, golden cuts after notes 2,5,7,10,14 → [11–14] one group; no legal
  seam after note 11 (gap into the 7:4 = 161 ms ≈ the tuplet's own 158/157 —
  same pace, and D67 cuts only land where the pace changes); bracket covers
  only the off-grid beat (composer ruling "Aa" day 28: bracket scope per
  beat — note 11 sits exactly ON the one-grid lattice, pos 19). Principle =
  D69, composer verbatim: *"there should be some communication to the
  performer if there is a speed change… the seven-four bracket is
  appropriate."* D-log 6.1 (day 29) kept the brackets with "composer to
  flag if they should go" — so changing it is open.
- if changed: the alternative ([rest+16th] as a two-unit, 7:4 alone) is
  buildable — beamBreak after 11 + beamOverLeft (the D-log 1.6 "group of
  two" device); a plain --cuts 11 would refuse (one-note figure).
- **measured (composer asked, day 39):** written-vs-played, grid anchored at
  the gesture's first note (36.218, unit 125 ms):
  n11 +21 · n12 −14 · n13 +1 · n14 +15 · n15 +12 · n16 +17 ms — worst 21,
  all inside the 30 ms one-notehead threshold. The 7:4 = septuplet slots
  1·3·5 of the 500 ms beat at pos 20 (leading + interleaved septuplet
  rests; three double-beamed 16ths under the bracket). Written step 143 ms
  vs played 158–161 (~10 % quick, drift ≤15 ms over three notes). Least
  accurate spot = the n11→n12 junction: written 196 vs played 161 ms
  (n11 late, n12 early). **The @39.36 gap is REAL**: the day-28 seam after
  n14 — written 268 vs played 265 ms (3 ms true); drawn as the beat
  window's trailing septuplet rest + a plain 16th rest, then group 6
  ([n15 n16] = 16th · 16th-rest · 16th). It reads big because it is:
  1.7× the played tuplet step, rendered at 1.9× (the tight-written
  septuplet exaggerates the contrast slightly).
- follow-up (day 39): composer asked the rule for the plain pair @39.36
  ("note rest note — new tempo?"). Answered from the record: one grid per
  gesture (Ba) · new grid only at a breath ≥500 ms · bracket only where
  notes miss the grid (Aa). The pair is ON-grid (+12/+17 ms) → left plain,
  no retempo — matches the composer's own recollection. No change asked.
- verdict: **KEEP the beaming** — composer, day 39: "keep the beaming."
  No change made; the record (D69 grouping + Aa bracket scope) stands.

### #2 · ALL parts, every cuivré text · GOOD ✓ (composer, day 40)
- said: "move, or make all the cuivrés — the text — have the medium gap
  instead of the smallest gap, between them and the next thing, which is
  probably the notehead"
- read as: raise every **cuivré text mark** from the tight gap to a MEDIUM
  gap above the notehead — **global**, all parts, whole score.
- this ACTIVATES the deferred day-30 NITS item (journal §2 "Open, not
  blocking"): *"a midway constant between tight 0.15 and the standard,
  then raise the marks; T8's fallback survives."* At apply time: pull the
  exact spec from NITS.md day 30, set the midway constant, re-render,
  spot-check a cuivré in each affected part (incl. T8's fallback case).
- **APPLY SPEC (gathered day 39 — cold-executable):** the constant already
  EXISTS. In `notation/lib/layout.js`, the **techText block** (inside the
  nh-unit) takes the baseline gap from `tightGapSs` (0.15) — change it to
  `gapMediumSs` (0.3, already in `notation/registry/container.json:233`).
  **One line.** NITS day 31: *"when they say go, it is one line: the techText
  baseline gap 0.15 → gapMediumSs."* The composer has now said go.
  Keep the lane-line clearance test so **T8 stays on its tag-row fallback**.
  After: re-render + spot-check a cuivré in each affected part.
- **done (2026-08-31):** `notation/lib/layout.js`, the techText block inside
  the nh-unit — the local constant went `tightGapSs` 0.15 → `gapMediumSs` 0.3
  (variable renamed `tight` → `gapM`, matching the repo's other medium-gap
  sites). BOTH the baseline gap above the head and the lane-line clearance
  test now use the medium gap, which is what the code comment always claimed
  (*"clears the lane line by the same gap"*) — and it is the safe direction,
  since a stricter test can only send a mark DOWN to the tag row, never into
  a collision.
- **measured (before vs after, by running `layoutSection` under both versions
  of the file):** **22 cuivré marks in the whole score · 20 raised by exactly
  +0.15 ss · 2 unchanged on the tag-row fallback (T8 @40.934 — the known case
  — and T1 @86.58, already there before) · ZERO flipped to the fallback.**
  That last number was the real risk of moving both gaps at once; it did not
  happen. Eleven batteries green.
- **review (day 40):** composer hard-refreshed and saw no change — five times.
  Diagnosed: the server WAS serving the new code (verified by curl); the raise
  is 0.15 ss ≈ **1.2 px at main-view scale** (2.4 px in zoom ×2) — a real but
  near-invisible move. The three-tier system confirmed against the registry's
  own day-31 note: 0.15 dot · **0.30 cuivré (now)** · 0.45 dynamics. Composer
  accepted on that confirmation, per their stated condition ("can you just
  look and confirm that it is using the middle gap, and I'll just accept
  that").
- verdict: **GOOD ✓** — "those two are good" (day 40).

### #3 · T1 @ 78.49 (cluster 78.332–80.094@0) · GOOD ✓ (composer, day 40)
- said: "change the dynamics: f at start, mark the last partial mf, no
  accents. We're bumping the dynamic rule because most of them are louder —
  take the louder version as the base, use a quieter marking for the one
  that's softer. Plus it's the last one, so we don't have to restate the f"
- read as: the T1 figure at 78.332–80.094 (currently `--dyn 1:mf
  --accents 1,2,3,4`) becomes: **f on note 1 · mf on the LAST note · zero
  accents** (`--dyn 1:f,5:mf`, drop `--accents`).
- **APPLY SPEC (measured day 39 — cold-executable):** the cluster is
  **cl-50, T1, FIVE notes** — 78.482 · 78.819 · 79.227 · 79.639 · 79.944.
  Current build args: `--cluster 78.332-80.094@0 --figures --dyn 1:mf
  --accents 1,2,3,4` → **`--cluster 78.332-80.094@0 --figures --dyn
  1:f,5:mf`** (accents dropped). The mapping is exact: notes 1–4 were the
  accented (loud) ones, note 5 the unaccented soft last one — which is why
  f-base + mf-on-5 says the same thing with two marks instead of five.
  **Edit `provenance.build` INSIDE `notation/ir/db1.ir.json`**, then
  `bash print/score/build.sh --rebuild-ir` (the rebuild re-runs that string).
- **done (2026-08-31):** build args rewritten exactly as specced; rebuilt.
  **Proven by an overlay diff of the IR before vs after: 4358 overlays both
  times, exactly 5 replaced, every one of them `cl-50`** — nothing else on
  the page moved. Note 1 (`ev-wc-1726`, 78.482) `dynMark` mf → **f**, accent
  dropped · notes 2–4 (78.819 · 79.227 · 79.639) accents dropped · note 5
  (`ev-wc-1750`, 79.944) gains `dynMark` **mf**. The stray
  `beamHasArtic: accent` on the beam group is gone too, so the figure now
  carries zero accent ink. Two marks where there were five.
- verdict: **GOOD ✓** — "those two are good" (day 40; composer reviewed at
  T1 78.48, the timecode handed over on request).
- rule stated by the composer (capture, don't generalize yet): **the
  ambient dynamic should be the MAJORITY loudness** — when most notes are
  loud, base = the louder dynamic, mark the softer exception; and a softer
  LAST note needs no f restated after it. Candidate refinement of the
  day-24 ambient-mf + accents encoding — flagged for the rule ledger if it
  recurs.


### #4 · GLOBAL (all curve followers outside the morph sections) · re-APPLIED (batch 2, day 40)
- said: "the curve followers at the end starting around 685 — none of these
  were fixed from the morph section. There's the additional shadow behind
  the actual curve follower. We got rid of those in the morph section but
  not here. All of these, and the long crescendo at the end, and the few in
  the beginning… the image comes from ~76 s, and in the density build
  sections there's a number of curve followers in the different parts, and
  those all still have the shadow. So it looks like we fixed it in the
  morph, but nowhere else."
- read as: raise `curveMeter.fillOpacity` **0.3 → 0.6** in
  `notation/registry/container.json` — the general curve follower used
  everywhere OUTSIDE the morph sections.
- **DIAGNOSED, and the composer is exactly right — it is one number.** Day 36
  W1 fixed the shadow in two steps: (1) the exporter's premultiplied-alpha
  compositor bug (whole piece, fixed in `tools/export_video.js`), and (2) the
  residual shadow = **staff lines reading through a 30 % fill**, cured by
  `fillOpacity` 0.3 → 0.60 — but variant A1 was only ever built for the two
  MORPH meters. WISHLIST W1 says so in as many words: *"`curveMeter`
  deliberately stays at 0.3 — it was not one of the variants."* Registry
  today: `glissMeter` 0.6 · `cresMeter` 0.6 · **`curveMeter` 0.3**. Same
  limeGreen #99FF00, same mechanism, same 8 px bar.
- scope of the change: every non-morph curve follower — the density builds,
  the long crescendo at the end (~685+), the few at the beginning. Emitted
  in `notation/lib/animobj.js:297` for every event carrying a drawn level;
  morph lanes already stand down via the W1b `laneOwned` exception, so
  raising this cannot touch the morph sections.
- **ANIMATED LAYER, not print** — this changes the app view and the video,
  not the PDF. Costs nothing extra: running-order step 6 re-renders the
  video anyway (~21 min).
- **APPLY SPEC (cold-executable):** `notation/registry/container.json`
  → `curveMeter.fillOpacity` **0.3 → 0.6** (line ~391). Add a `_note`
  recording day 39 + the reason (parity with glissMeter/cresMeter variant
  A1). **Also amend `docs/WISHLIST.md` W1**, which currently reads
  *"curveMeter deliberately stays at 0.3"* — that line is now superseded and
  would otherwise contradict the registry.
- **done (2026-08-31):** `notation/registry/container.json` →
  `animated.curveMeter.fillOpacity` **0.3 → 0.6**, with a dated `_noteDay39`
  recording the reason. Verified in the parsed registry: `curveMeter` 0.6 ·
  `glissMeter` 0.6 · `crescMeter` 0.6 — the three now agree, which was the
  whole point. **`docs/WISHLIST.md` W1 amended**: its *"curveMeter
  deliberately stays at 0.3"* sentence struck through and marked SUPERSEDED
  day 39, with the reason, so the doc cannot contradict the registry.
  *(Registry key is `crescMeter`, not `cresMeter` as this ledger wrote it on
  day 39 — cosmetic, noted so a later read does not go hunting.)*
- **NOT VISIBLE IN THE PRINT PDF** — animated layer only. It lands in the app
  view now and in the video at running-order step 6.
- **verdict: RETRY ↻** — composer, day 40: *"the meters are still not
  correct, overshoots."* Correct — **the day-39 diagnosis was wrong; opacity
  was never the mechanism.** The 0.6 change stays (parity with the morph
  meters), but it could not fix what the composer sees.
- **REAL CAUSE (probed in the live app, day 40, before proposing anything):**
  two geometry issues, one per region —
  1. **The outline FRAME always spans the full lane** (`animobj.js`, all
     three meter renderers draw `rect y=laneTop height=laneH` regardless of
     level). Above the bright fill there is an empty outlined box running to
     the lane top — the "shadow" in the density builds (~76 s: one meter,
     fill 0.74, frame to the top) and the 685–709 swells.
  2. **At the final crescendo (709.4–751.4, the fullHeight cresc) TWO meters
     ride the same cursor x** — each note's own per-event curveMeter (its
     surge envelope) PLUS the section crescMeter (the big wedge). Probed
     t=730: 9 of 10 parts doubled, per-event lvl 0.62–0.63 vs section
     0.55–0.56 — the taller per-event fill pokes above the wedge = the pale
     tip. The W1b standdown (day 37) DELIBERATELY excluded fullHeight cresc
     (code comment: "the trance's fullHeight crescendo is NOT in this map,
     so its per-event meters are untouched") — right call for the midline-
     bleed problem it was solving, wrong for this one.
- **PROPOSED FIX (awaiting composer go):** (a) extend the W1b standdown to
  fullHeight cresc spans — one follower at the end, the section one, matching
  the wedge exactly; (b) the frame hugs the fill (outline y/height = fill
  y/height) on the per-event curveMeter and the FULL crescMeter — nothing
  ever drawn above the current level. **Morph half-lane meters untouched**
  (approved look). Blast radius measured: exactly 10 fullHeight overlays in
  db1, all the final crescendo; test_animobj carries no assertions on these
  meters.
- **done (day 40, composer's go: "good thank you"):** `notation/lib/animobj.js`,
  three edits — (a) the W1b ownership map (`halfLane` → `owned`) now includes
  ALL cresc overlays, fullHeight included; (b) curveMeter's outline frame =
  the fill's y/height; (c) crescMeter's frame likewise, **FULL variant only**
  (`inst.full ? …`) — the half-lane morph frame kept.
- **verified (node probe + the LIVE page after reload, both):**
  t=730 & t=745 → **exactly 1 meter per part** (crescMeter FULL), frame==fill
  on every emitted rect · t=76.2 → 1 curveMeter, hugged · t=700 swells →
  per-event meters, hugged · **t=302 morph → glissMeter+crescMeter pair
  unchanged, half-lane frames still 50.0 px on the fake lane** · leveled
  events straddling the 709.4 boundary: **0** (the standdown cuts nothing
  mid-note). Eleven batteries green.
- **where it shows:** the app now (hard-reload the tab — animobj.js is code);
  the video at running-order step 6. Never the PDF.
- verdict: *(pending — composer look: ~76 s density build · ~700 swells ·
  ~730 final crescendo · ~302 morph must look UNCHANGED)*

<!-- ITEM FORMAT — one chunk per item, statuses in the heading line:

### #1 · T3 @ 3.29 · LOGGED
- said: "move the cuivré text up at three seconds point two nine"
- read as: raise the `cuivré` text label at t = 3.29 s, T3

…after apply:

### #1 · T3 @ 3.29 · APPLIED (batch 1)
- said / read as: (unchanged above)
- done: figure yOffset 24 → 30 in container.json engraving.layout; rebuilt, verified on p.2

…after verdict:

### #1 · T3 @ 3.29 · GOOD ✓
or
### #1 · T3 @ 3.29 · RETRY ↻ — "still too low, another notch"
-->
