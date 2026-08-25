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

## WHERE THE TEMPLATE STOPS — measured across all three morphs

The template draws ONE smooth curve. **It only fits BLOOM.**

| morph | gliss range (all parts) | direction reversals | template? |
|---|---|---|---|
| **BLOOM** | **20 c** on every part | **0** | **YES — one clean arc** |
| **CONVERGE** | 182–366 c | 12–38 | **NO — refused** |
| **BALANCE** | **0 c on every part** | 0 | **no glissando at all** |

**CONVERGE is an OSCILLATION, not a glissando.** Up to 3½ semitones, reversing
direction up to 38 times in 118 s. Asked for one smooth curve, the best available has
a **237-cent** worst-case error. The tool **refuses** above 25 c — half a quarter
tone, past which the drawn line puts the player in the *wrong quarter tone*. CONVERGE
needs its own reading and the composer's eye on what that oscillation should look
like.

**BALANCE HAS NO PITCH BEND AT ALL — 0 cents on all ten parts.** Its top half would be
empty and its header would show one pitch, not two. The tool says so rather than
drawing an empty half. Ask what the top half carries there — it may simply be a
crescendo-only section.

> **A correction on the record:** an earlier running-log note said *"CONVERGE reaches
> ±67 cents and will show quarter-tone motion."* **That was a per-tone peak, not the
> section range.** The section range is ±180 c. This table is the number to trust.

---

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
