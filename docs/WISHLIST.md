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

### WHAT IS STILL OPEN — one small look choice

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

**Recommendation: A1 (0.60).** It removes the staff lines from inside the bar and
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

## W2 · A short fade on the cuts into the close-ups

**Composer, day 36:** *"if we have time to re-render, let's build in some very
quick and subtle transitions when they cut to the zoomed part. Maybe a short
fade."*

**Where:** the 9 close-up entries in `notation/video/cut-list.json` — and
presumably their exits too, which is a question for whoever picks this up
(*fade in only, or both ends?*).

**Current behaviour is deliberate:** PHASE 4.3 of the video plan says *"hard cuts,
matching PP-3's hard-cut system turns. Crossfades only if asked."* **This is the
ask.** It does not overturn a decision; it adds one.

**How, and why it is cheap.** `export_video.js --cut` already composites each
frame from two full RGBA buffers, so a cross-dissolve is a lerp between the two
sources over N frames at each boundary — the wide frame and the cropped zoom
frame are both already in hand at the same `t`. Roughly:

- both caches are warm across a boundary (that is what the per-mode caches are
  for), so the only new cost is the blend
- ~8 frames (0.27 s) reads as "very quick and subtle"; 15 (0.5 s) is a soft
  dissolve
- **cost: one re-render of V-CUT only, ~7 minutes.** V-MAIN, the zoom master and
  the two crops are untouched — the fade lives in the cut alone.

**Watch out for:** PHASE 5's duration equality. A dissolve must not change the
frame count — blend *across* the existing boundary rather than inserting frames.
