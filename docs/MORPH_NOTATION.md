# THE MORPH NOTATION — the settled vocabulary and how to generate it

> Built piece by piece in the running app on day 35, at the composer's direction,
> on the experimental page `morph-x01`. **T1 of BLOOM is the reference.**
> The tool is **`tools/notate_morph.js`**; this file is why it does what it does.

---

## THE TOOL

```
node tools/notate_morph.js --group <groupId> --part <0-9> --id <ir-id> [--label "..."] [--apply]
```

Without `--apply` it prints what it would write and touches nothing. It **refuses**
rather than producing a page it cannot honestly draw — see *Where the template stops*.

Groups: `grp-act-bloom-01-01` · `grp-act-converge-01-01` · `grp-act-balance-01-01`.
Parts are ZERO-indexed — **T1 = `--part 0`.**

---

## WHAT IT DRAWS

The **normal staff and the normal bass clef** — no special furniture. Then:

### The header

At the section entry, placed in ss offsets from the go line so it never stretches
with the time zoom.

- two **small black noteheads** (`notehead.filled` at the house `nhHeadScale` 0.844)
  — the section's two written pitches
- a **gliss line** between them, `notehead.open.wSs × 2 = 2.2144 ss` — literally two
  half-note diameters (the composer's measure). **0.45** standard spacer
  head-to-line both sides; house `accGap` 0.25 before the accidental
- beneath, on the **house `dynY` row** ("just like all the other dynamics"):
  **niente circle · arrow · end mark**, ending one standard spacer before the go
  line. Right-to-left: `mark · 0.45 · arrow(2.0) · 0.45 · circle · … · GO LINE`

**THE NIENTE CIRCLE IS DRAWN, NOT A GLYPH.** No niente exists in our `glyphs.json`,
and **LilyPond has none either** — its `circled-tip` is drawn. Diameter = the
measured height of the **`m` in `mf`, 0.4695 ss** (isolated from the glyph subpaths;
`mp` and `mf` agree to the digit), stroked at the arrow's thickness, **centred on the
arrow's axis**.

### One go line at every breath onset — and no onset noteheads

Onset heads were built and removed the same day. T1's whole glissando is 20.4 cents,
so every head showed the *same* written pitch while the orange curve already says
continuously where the pitch has got to — **the heads repeated the curve at lower
resolution**. The go line alone carries what the head was for: *breathe and re-attack
here.* (`onsetHead` / `onsetAcc` remain built as device flags, unused.)

### Two curves, one per half, filled with NO BORDER

The composer's day-22 verdict on the env curve, applied again here.

| | colour | half |
|---|---|---|
| **glissando** | `#F04B00` brightOrange — piece #1's gliss colour | **TOP** |
| **crescendo** | `#99FF00` limeGreen — piece #1's crescendo colour | **BOTTOM** |

Each is **normalised to its own peak** so it fills its half completely —
*"regardless of how much change, it will go the full track height."* The amount lives
in the dynamics, not the curve height.

### Two meters and no dots

`glissMeter` and `crescMeter` are `curveMeter`'s mechanism and **every one of its
numbers** (wPx 8 · gapPx 3 · fillOpacity 0.3 · outlineWPx 1.5 · outlineOpacity 0.8),
each confined to its own half. Dot followers are switched off per-IR:
`ir.animated = { curveFollower: false, envFollower: false, lineWedge: false }`.
*Composer: "I want the meters. I don't want the dots."*

---

## THE CURVES ARE INTERPOLATED, AND THE ANCHOR COUNT IS MEASURED

Both curves are Catmull-Rom through anchors taken off the sounding data — **not** a
parametric fit. A power curve fits BLOOM's gliss to 0.59 c over the first 37 s, but
over the whole 108 s **neither curve is monotonic**, and the same treatment on the
level gives max deviation 0.428 — useless.

The tool tries **9 · 13 · 17 · 21 · 25** anchors and takes the **knee**: the smallest
count whose rms is within 25 % of the best. On T1/BLOOM that lands on **21 for the
bend and 13 for the level** — the counts the composer approved.

**Fewer anchors is not merely cheaper.** On T1, 21 anchors give a *worse* rms than 25
(0.196 vs 0.163 c) but a *better* worst case (0.767 vs 0.953 c) — and the worst case
is what a reader sees. **The ladder is capped at 25**: past that the curve stops
interpolating the gesture and starts tracing the data, wobble included, which is the
one thing the composer asked to remove.

**The large point deviations on the level curve (~0.25) ARE the per-breath resets
being smoothed away** — a tone ending at 0.87 while the next starts at 0.64. That is
the purpose, not fitting error.

---

## THE WRITTEN PITCHES — a compositional choice, recorded as one

The header shows the section's two pitches **to the closest quarter tone**. But
BLOOM's whole glissando is 20.4 cents and a quarter tone is 50, so strict rounding
gives **one** pitch and says nothing.

**Rule adopted: a non-zero glissando is written as AT LEAST one quarter tone**, in
the direction it travels — `quarterSharp` rising, `quarterFlat` falling. On BLOOM T1
that writes **F2 → F¼♯**.

**This is a decision to show the gesture, not a measurement.** The tool flags it in
its own output so it is never mistaken for arithmetic.

---

## THE GOVERNING PRINCIPLE (composer, day 35 — verbatim in PAPER_NOTES)

> *"The principle of both curves is to trace the total amount of pitch displacement
> and dynamic level displacement… performing a glissando over a very small pitch range
> over a very long time… they still are essentially the same as a more common
> glissando or crescendo. They share the same principle… in line with the Kobayashi
> approach. Just to give the performer the tools they need to execute these still
> standard in principle articulations."*

**The curve is a DISPLACEMENT MAP, not a pitch trace.** Its bottom is the lowest pitch
reached in the section, its top the highest — whatever the interval between them. Both
curves are therefore normalised to their own extremes and always fill their half. The
*amount* lives in the written pitches and the dynamics; the *curve* carries the shape.
Execution is a rehearsal problem, as with any glissando. **Scale is not category.**

This settles what the AI had been treating as a defect — that BLOOM's 20-cent gliss is
"too small to notate". It is not a smaller kind of thing; it is the same thing, slower.

---

## ALL THREE SECTIONS WORK — measured after two AI bugs were fixed

| morph | total displacement | fit (21 anchors) | template |
|---|---|---|---|
| **BLOOM** | 20.4 c (T1) · 20.5 c (T2) | max **0.77 c** | **yes** |
| **CONVERGE** | **99 c** = 2 quarter tones | max **9.4 c** | **yes** |
| **BALANCE** | **0 c — no glissando** | — | **crescendo only** |

> **TWO BUGS, BOTH THE AI'S, BOTH FOUND BY MEASURING RATHER THAN BY EYE.**
>
> **1. The target array.** Adding the fifth pair grew `source.midi` to 10 but left
> CONVERGE's `target.midi` at 8, so every voice was pulled to the wrong destination.
> 365 c range / 38 reversals shipped; 129 c / 5 after the fix, matching the original.
> CONVERGE was the only morph that could break this way — the others have no
> fixed-length target.
>
> **2. Fitting the bend instead of the pitch.** `morphBend` is kept inside its ±199 c
> range by RE-SPELLING: when a voice travels far the note number shifts a semitone and
> the bend re-centres ~97 c the other way. **The sounding pitch stays continuous (±3 c)
> while the bend series jumps.** BLOOM never changes note, so fitting the bend worked
> there by luck; CONVERGE re-spells four times, and fitting the bend gave a **90-cent
> error that no number of anchors could fix** — the tool was chasing a discontinuity
> that does not exist in the sound. **Now it fits `sonifyNote * 100 + bend`.**
> CONVERGE's error fell from 89.5 c to **9.4 c**.
>
> **Everything this repo said about CONVERGE before these fixes is void** — including
> "an oscillation, not a glissando" and the refusal built into this tool. **CONVERGE is
> a glissando: each whole-tone pair closes to a near-unison and re-opens, twice.**

**The accidental follows the direction of travel.** The header shows the lowest pitch
left, the highest right; the altered head is whichever is NOT the starting note —
`quarterSharp` on the right when the part rises, `quarterFlat` on the left when it
falls. Verified: BLOOM T1 rising → quarterSharp; T2 falling → quarterFlat.

**BALANCE has no glissando at all** (`target: null`, 0 c on every part). Ten static
pitches — a B♭ major 9th over three octaves — each swelling, with `dyn.shape:"rotate"`
moving the peak through the ensemble over ~68 s, arriving at the bass last. **No
beating either**: its pairs are thirds, not detuned unisons. It is the consonant
arrival. Its top half is empty, and by then that absence reads as information.

## THE ORDER TO BUILD IN

1. **BLOOM T2** — the mirror; its gliss descends, so it proves the direction handling
   (`quarterFlat`). Dry run verified: 21 anchors, max 0.728 c.
2. **BLOOM T3–T10** — mechanical once T2 is approved.
3. **CONVERGE** — blocked on a composer decision about the oscillation.
4. **BALANCE** — blocked on a composer decision about the empty top half.

---

## MECHANISMS ADDED (all opt-in; absent = every existing page unchanged)

| kind | where | what |
|---|---|---|
| `header` overlay | layout → items | the two figures at the section entry |
| `gliss` overlay | → `glisscurve` item | top-half curve, `engraving.render.glissCurve` |
| `cresc` overlay | → `cresccurve` item | bottom-half curve, `engraving.render.crescCurve` |
| `niente` item | render | the drawn circle |
| `glissline` item | render | the header's gliss line |
| `device.brick:false` | layout | suppress the parachute brick for one event |
| `device.onsetHead` / `onsetAcc` | layout | built, currently unused |
| `ir.animated{}` | animobj `collect` | switch animated kinds off per page |
| `glissMeter` / `crescMeter` | animobj | the two meters |

**Proven at every step:** MAIN DRAFT rendered under old vs new `layout.js` —
**0 added, 0 removed, 0 changed.**

---

## OPEN, NOT BLOCKING

- **The header lives in TIMED space**, which is why the window starts ~3.9 s before
  the entry (`--pad`). Its real home is the untimed prefatory gutter —
  `prefatory.gutterPx = 48` already exists and is almost exactly the block's width —
  **but the live view does not pass `gutterPx` to the renderer** (the same line-386
  gap as the `engraving` bug; see NITS). Fix before ten parts inherit it.
- **All three morphs peak in the ladder's top band** (0.900 / 0.920 / 0.950), so every
  section reads `niente ——▶ ffff`. If they should look different, the ladder needs
  finer resolution at the top or the ceilings need separating in the data.
- **A beating-frequency indicator for the PARTS** — the composer's idea; see PLANNER.
