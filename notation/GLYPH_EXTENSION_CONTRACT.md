# Glyph Extension Contract (V1 one-pager)

> How a NEW glyph kind enters the system. Four touchpoints, all small; no
> other file changes. The box+anchors+staff-space model is SMuFL-shaped, so
> a real engraving font (Bravura et al.) can later back the same stamps
> from its metadata — a `glyphs.json` regeneration, not a rebuild.

## The four touchpoints

1. **`notation/lib/glyphs.json`** — a metrics entry: outline `path` (drawn
   in an arbitrary unit box), `wSs`/`hSs` (its size in STAFF SPACES), and
   named `anchors` (points inside the box that positioning refers to —
   e.g. the notehead's `center` / `stemAttachUp`; the clef's `fLine`).
   Record `_provenance`.
2. **`notation/lib/stamps.js`** — a maker: wraps the metrics into a typed
   box (`S.myGlyph()`), so `Stamps.toSvg(box, {xPx, yPx, ssPx, align})`
   can place it by any of its anchors. Stamps are ATOMIC under splicing —
   never cut at a page edge (accommodation strategy).
3. **`notation/lib/layout.js`** — an emitter: pushes an item
   `{ k: 'glyph', g: 'my-glyph', t, dxSs, ySs, align }` (seconds + ss
   ONLY — layout is pixel-free, enforced by test).
4. **`notation/lib/render.js`** — one case in `boxFor()` mapping the item
   name to the stamp maker.

## Rules that keep it coherent

- **Sizes in ss, positions via anchors.** Never a pixel in the metrics or
  the layout item; pixels exist only through the coords view.
- **Engraving numbers are registry data** (`container.json → engraving`),
  not code constants. A new glyph's tweakables (gaps, insets, scale) go
  there, so tier-3 can adjust them as data.
- **Per-item fine offsets ride `dxSs`** (and the engraving-override
  overlay for authored nudges) — a new glyph inherits the polish channel
  for free.
- **Snapshot the change.** Adding a glyph must leave every existing
  test snapshot byte-stable; its own rendering gets a census assertion in
  `tools/test_render.js` (and see it go red once — Principle 6).

## Animated objects are the SIBLING contract

An animated device (GC ball, curve follower, wedge) is NOT a glyph: it is
a pure `state(t) → SVG primitives` function registered in the V2 animated-
object layer, reading strata data + the clock interface. Static PRINT
counterparts of animated devices (e.g. the GC arc) ARE glyphs and follow
this contract.
