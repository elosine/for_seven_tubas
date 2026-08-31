# WISHLIST — wanted if there is time

> Opened 2026-08-26 (day 36) on the composer's ask, after the video was built:
> *"Let's put on a wish list if we have time… but the video looks fine if we run
> out of time to fix. Just make note of these things, and we'll try to come back
> and look at them."*
>
> **This is not `docs/NITS.md`.** NITS holds deferred *defects* and needs no
> decision to be recorded. This holds *wants* — changes the composer has asked
> for that are scheduled against time, not correctness. Nothing here blocks the
> piece, and the built video stands without any of it.
>
> Format: what · why it is wanted · what is already known · what it would cost.

---

## W1 · The morph meters have a shadow, and sometimes jump

**Composer, day 36:** *"the meters in the morph sections have some strange
shadow. Sometimes they jump. I'm not sure if it's part of the main original score
or part of the video rendering."*

> **ANSWERED day 36 (post-clear), and the first answer below was WRONG.** It said
> *"NEITHER, and it will look the same in the app."* **The shadow IS the video
> rendering** — a compositor defect in `tools/export_video.js`, now fixed. **The
> jump IS the system turns**, which is the design. Both measured. The only thing
> still open is a small look choice, and it is at the bottom.

---

### W1b (day 37) — the bleed the eye caught AFTER all of the above: FIXED

**Composer, day 37:** *"there is still bleed in the meters... green background in
the orange meter or the white area of the orange meter... then it just blinks off
[at 303.01]."*

It was a THIRD meter: `curveMeter`, piece #2's per-event follower — same green,
same x, but FULL-LANE, spawned by every event carrying a level curve (406 inside
the morph sections). Its fill crossed the midline into the glissando's half
whenever an event's level passed 0.5; the "blink" was T1's event ending at
302.91. Fixed in `animobj.collect` with an ownership rule: where a half-lane
section meter owns the lane, per-event full-lane meters stand down. The trance
(fullHeight crescendo) keeps its curveMeters — probe at t=730 is byte-identical.
Full account: RUNNING_LOG day 37. **The approved 2026-08-27 renders predate this
fix and are archived as the submission fallback in
`notation/video/approved/2026-08-27-submission/`.**

---

### THE JUMP — measured, and it is the system turns

`measure_meter_jump.js` computed every meter's drawn level at all **22 819**
frames (the renders' grid: `phase3.sh --t1 760.63` × 30 fps). **60 meters,
183 159 meter-frames:**

| | |
|---|---|
| frames where the fill edge moves ≥ 0.25 px | **0** — every frame is under a quarter-pixel |
| worst single frame in the piece | **0.242 px** (crescMeter part 2, t = 303.30 s) |
| sharpest corner at a 401-sample boundary | **0.0849 px/frame** |
| meters drawn twice (overlaps) | **0** |

**The 401-sample quantisation is real and harmless.** It is 3.15–9.18 frames per
authored value exactly as predicted — but the levels move so slowly that the
staircase lands under a tenth of a pixel. It cannot be seen.

**The jump is the x position.** The meters ride a fixed offset left of the cursor,
so at each system turn they teleport: **63 turns · 1866.8 px of 1920 · 33 of them
with a meter live on both sides.** That is the hard-cut design, not a defect.
**Nothing to fix unless the composer wants the turns softened** — which is W2's
question in a different place.

---

### THE SHADOW — a compositor bug, FIXED

**`@resvg/resvg-js` returns PREMULTIPLIED RGBA.** A bare
`<rect fill="#F04B00" opacity="0.3"/>` comes back as RGB (72, 23, 0), A 76 — the
colour already multiplied by its alpha. `export_video.js` `composite()` was
commented *"source-over, straight alpha"* and did `over·na + base·ia`, applying
the alpha **a second time**:

> `out = C·a·a + base·(1−a)`  instead of  `out = C·a + base·(1−a)`

So every **translucent** element of the ANIMATED layer contributed only `a` of its
own colour and composited as a grey smudge. Opaque elements took the `a === 255`
fast path and were always exact — which is why the magenta cursor looked right and
nothing else gave it away.

**Verified against the running app:**

| | app (browser) | video, before | video, after |
|---|---|---|---|
| gliss meter over its curve | (248, 173, 139) | (198, 157, 139) | **(248, 173, 139)** |
| cresc meter over its curve | (208, 255, 139) | (177, 201, 139) | **(209, 255, 139)** |

`notation/app/notation.html:771` does `ov.innerHTML = svg` — the app hands the
overlay to the browser and has no hand-rolled compositor, so the bug was
structurally impossible there. **The score was always right; the film was not.**

**Why PHASE 5's pixel proof missed it.** The exporter was proven "pixel-for-pixel"
with `--dumpPage`, which writes the **static page only**. The static page is one
resvg pass with an opaque background, so `composite()` never runs on it. *The
proof was sound; it covered a narrower claim than it was read as.*

**Reach of the fix** (`--probe`, before vs after): **10 782 px of 2 073 600 at
t = 200 s** (morph) and **2 624 px at t = 600 s** (trance), max channel delta 64.
It corrects the animated layer across the WHOLE piece, notation untouched.
Eleven batteries green.

**Cost: it invalidates all five renders** — one full re-render, ~31 min.

---

### DECIDED — A1, `fillOpacity` 0.60 (composer, day 36 post-clear)

> **"lets go with a1".** Both morph meters are now `fillOpacity` **0.60** in
> `notation/registry/container.json`, with the reason recorded in each `_note`.
> Verified by probe: the gliss bar reads `#f4834f` (244,131,79) against a
> predicted (245,131,80). ~~**`curveMeter` deliberately stays at 0.3** — it was not
> one of the variants, and at 0.3 it now matches the app.~~ **SUPERSEDED day 39**
> (PROOFREAD_LEDGER #4): the composer proofread the print score and saw the shadow
> still behind every NON-morph curve follower — the density builds, the ~685 s
> crescendo, the few at the beginning. Same mechanism, same cure: `curveMeter`
> `fillOpacity` **0.3 → 0.6**, parity with the two morph meters. Eleven batteries green.
> The six-way comparison is published as the Artifact **The Morph Meters**.

With the compositor right, the bars are flat, true colour, and one thing still
reads through them: **the staff lines and the lane midline.** (That, not "the pink
gliss band", is the grey-olive that was reported — it is the green meter crossing
the staff midline.) A meter's own curve fill sits behind it in the SAME colour, so
that part adds warmth rather than a smudge.

Five stills at t = 200 s, `scratchpad/shadow/SHADOW-COMPARE.png`, built by
`build_variants.js` (patch → probe → restore, sources verified clean after):

| | | |
|---|---|---|
| **A1** `fillOpacity` **0.60** | bar reads solid, lines just visible | registry only |
| **A2** `fillOpacity` **0.85** | bar reads as ink, lines gone | registry only |
| **B** opaque white under the FILL | fill is flat — but paler than the band around it | animobj |
| **C** opaque white under the whole BOX | column cleared to paper — white notch where empty | animobj |

**Why A1 was the recommendation, and the pick.** It removes the staff lines from inside the bar and
keeps the meter reading as an overlay. **B and C both make the bar paler than its
own band, which inverts figure and ground** — they cure the shadow by making the
instrument weaker than the thing it measures.

**WISHLIST option 3 as originally written — "keep the meters out of the banded
half" — is geometrically impossible and was replaced by B/C.** The glissando fill
runs from its curve down to the lane midline and the crescendo fill from the lane
floor up to its curve, so a meter's FILL always sits on its own band and its EMPTY
part always sits on white. There is no unbanded half to move to; the only move is
to take the band out from behind the meter, which is what B and C do.

---

## W2 - A short fade on the cuts into the close-ups

**Composer, day 36:** *"if we have time to re-render, let's build in some very
quick and subtle transitions when they cut to the zoomed part. Maybe a short
fade."*

> **BUILT day 36 (post-clear), and a CROSS-DISSOLVE TURNED OUT TO BE THE WRONG
> TECHNIQUE.** `--fade <frames>` and `--fadeMode dip|cross` on
> `tools/export_video.js`; `phase4.sh` now passes `--fade 8 --fadeMode dip`.
> **The open question in the original note - fade in only, or both ends? - is
> answered: both.** An asymmetric fade reads as a mistake.

### Why not a cross-dissolve - measured, on one boundary, before any full render

A cross-dissolve superimposes the two sources. Everywhere else that is the point;
here **the two sources are the same notation at two scales**, so the mid-dissolve
frame carries two complete sets of staff lines, doubled noteheads, and - worst -
**TWO CURSORS**, because the wide and zoomed playheads sit at different x.

Measured at the first boundary (f = 2740, t = 91.33 s), ink per pixel across the
window, where the 7th value is the cut frame:

| mode | ink across the 13 frames |
|---|---|
| **cross** | 39.1 39.1 38.9 37.9 37.3 36.6 **36.5** 35.5 34.0 33.6 32.9 32.8 32.8 |
| **dip** | 39.1 39.1 34.1 24.7 14.7 5.4 **4.2** 12.3 20.3 28.5 32.5 32.5 32.5 |

**The cross's flat line IS the double exposure** - total ink barely moves because
both pictures are on screen at once. It never reads as a transition; it reads as
one image sliding through another. The dip's clean V is one source at a time.

### What the dip does

Over the window the frame is pulled toward paper: the outgoing shot up to the cut,
the incoming shot from the cut on, **never both**. It never reaches blank paper -
at 8 frames the deepest frame sits at 0.875, so the ink thins to about an eighth
and comes back. No white flash, no doubling, no split cursor. It is also *cheaper*
than a cross, which has to render both sources for every blended frame.

**The trap was respected:** the window is CENTRED on the existing boundary,
`[f - n/2, f + n/2)`. **No frame is ever inserted or dropped**, so PHASE 5's
duration equality is untouched. Frame 0 and the extended final segment are not
cuts and get no transition - **18 interior boundaries** do.

### The knob, and what is left to the composer

`--fade 8` (0.27 s) is the default; `--fade 5` (0.17 s) is gentler; `--fade 0`
restores hard cuts. Four five-second clips of the same boundary are in
`notation/video/wishlist-w1/` - `boundary_fade0` (hard), `boundary_fade8`
(the cross, to show why not), `boundary_dip8`, `boundary_dip5`.

**Cost is now nil on its own** - the compositor fix and A1 already force a full
re-render, so the fade rides along in the same ~31 minutes.

