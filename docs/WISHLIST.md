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

### The question they asked, answered first: NEITHER, and it will look the same in the app

The meters are drawn by **`notation/lib/animobj.js`**, which the live app and
`tools/export_video.js` both call — the exporter is not a second implementation.
Their *look* comes from `container.json → animated.glissMeter / .crescMeter`;
their *levels* come from `ov.value.samples` on the IR. **So this is the shared
animation layer, not the score data and not the video pipeline.** Whatever is
seen in the video is on screen in the notation app at the same `t`.

### The shadow — SEEN, and explained

Probed at **t = 200.0 s** (page 16, morph section) and cropped at 4× around the
cursor, both meters are visible per lane:

- **glissMeter** — `#F04B00` orange, the **top half** of the lane
- **crescMeter** — `#99FF00` limeGreen, the **bottom half**

Both are drawn as *outline box at full scale + fill rising from the bottom*, and
**both fills are `fillOpacity: 0.3`**. A 30 %-alpha fill takes its apparent colour
from whatever is behind it — and behind one meter the background **changes
mid-meter**: the pale pink glissando band, the pale green crescendo band, the
staff lines, and plain paper all pass behind the same 8 px column.

**That is the shadow: one translucent bar reading as two or three different
colours because the ground under it changes, not because anything is drawn
twice.** In the probe the green meter is bright limeGreen over paper and turns
grey-olive exactly where the pink gliss band sits behind it.

**Reproduce:**

```bash
node tools/export_video.js --ir db1 --view video --probe 200.0 --probeDir /tmp/m
```

**Candidate fixes, cheapest first** — all are registry numbers, no code:

1. raise `fillOpacity` toward 1.0 so the ground stops showing through
2. give the meter an opaque backing rect (paper white) under the fill
3. keep the meters out of the banded half of the lane

### The jump — NOT confirmed, but there is a measured prime suspect

No frame pair showing a jump has been captured, so this is a suspect list, not a
diagnosis.

**Measured, and the strongest candidate:** every meter carries **exactly 401
samples**, whatever its span — and the morph spans run **42 to 122.4 seconds**.

| | |
|---|---|
| samples per meter | **401**, fixed |
| span | 42.0 – 122.4 s |
| **samples per second** | **3.28 – 9.55** |
| **seconds per sample** | up to **0.31 s** |

At 30 fps that is **one authored value every ~9 frames**. `glissMeter`/`crescMeter`
do interpolate linearly between samples, so a smooth curve stays smooth — but any
corner in the underlying curve is quantised to a 0.31 s grid, and a meter that
changes level quickly would move in ~9-frame steps.

**The other candidate is not a defect:** the meters ride a fixed offset LEFT of
the cursor, so at every **system turn** they jump to the new page's cursor
position. There are 63 turns. That is the hard-cut design, not a bug — but it may
be what was seen.

**Next step if this is picked up:** capture a frame pair either side of a
suspected jump, which settles which of the two it is in one measurement.

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
