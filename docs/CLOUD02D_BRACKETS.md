# CLOUD02-D — WHICH PART OWNS WHICH BRACKET

> Written day 32 to answer the composer directly: *"can you tell which part the
> brackets are assigned to?"* — updated day 33 when the composer's verdict made
> the leading hypothesis THE RULE. Generated from `db1-c2d-x01`'s laid-out
> geometry, not by eye. Regenerate after any rebuild with the snippet at the end.

## THE RULE (day 33, composer's verdict "b"): every bracket ABOVE its own staff, always

**A bracket belongs to the staff directly below it.** No inter-staff band ever
holds brackets from two parts, so ownership never depends on counting gaps or
reading hooks. Implemented as `ir.layoutPolicy.bracketSide = 'above'`
(`notate_section --bracketsAbove`), per-IR so approved files are untouched.
The bracket HUGS its own ink — beam (stem-up), head column incl. accidentals
(stem-down), the accent row when above — cleared by the bracket's padding;
distance is never a fixed row. A dictated `--bracketSide` still wins per
cluster. High-ledger gestures push their bracket higher and may overflow the
lane edge — allowed, measured by the protrusion detector (tier-3), and safe:
the band above always belongs to this part's brackets.

Hooks always turn toward the bracket's own notes (above ⇒ descending) and the
invariant is now a battery assertion in `test_layout` (day-32's inverted-flag
bug can't return silently).

## The table (after the day-33 rebuild — all 16 ABOVE, hooks descending)

| part | brackets (t, y ss above own staff) |
|---|---|
| T2 | 7:4 @44.27 +5.62 · 6:4 @44.94 +5.62 |
| T3 | 6:4 @43.98 +5.26 · 7:4 @45.12 +5.26 |
| T4 | 3:2 @44.95 +5.12 · 5:4 @45.47 +5.62 |
| T5 | 7:4 @45.10 +4.62 |
| T6 | 3:2 @44.47 +3.62 |
| T7 | 3:2 @43.59 +6.06 · 5:4 @44.65 +7.31 · 7:4 @45.18 +7.31 (accents per-mark below, day 33) |
| T8 | 3:2 @44.48 +5.62 · 6:4 @45.45 +5.12 · 5:4 @46.09 +5.26 (accents per-mark above, day 33) |
| T9 | 3:2 @44.89 +7.81 |
| T10 | 3:2 @45.95 +6.62 |

Retired with the rule: T6/T7's `--bracketSide` dictations (day 32 workarounds
for the mixed-side regime); both `--articSide above` verdicts stand.

## Cross-lane residuals — RESOLVED day 33

Both residuals dissolved by the day-33 accent dictations + THE PER-MARK
ACCENT LAW (head-side accents hug their own column, like day-31 dynamics).
Geometry guard: zero c2d findings; only the two pre-existing tier-3 items
(T9 @36.87, T10 @39.08) remain, in approved db1 material.

## Regenerate this table

```bash
node -e "
const fs=require('fs');
const L=require('./notation/lib/layout.js');
const G=JSON.parse(fs.readFileSync('./notation/lib/glyphs.json','utf8'));
const C=JSON.parse(fs.readFileSync('./notation/registry/container.json','utf8'));
const ir=JSON.parse(fs.readFileSync('./notation/ir/db1-c2d-x01.ir.json','utf8'));
for(const s of L.layoutSection(ir,G,(C.engraving&&C.engraving.layout)||{}).systems)
 for(const i of s.items) if(i.k==='tuplet'&&i.t0>=42.3&&i.t0<=48.1)
  console.log('T'+(s.part+1)+'  '+i.text+' @'+i.t0.toFixed(2)+'  y '+i.ySs.toFixed(2)
   +'  '+(i.ySs>0?'ABOVE':'BELOW')+'  dir '+i.dir);"
```

Note on `dir`: it names the bracket's SIDE, not the hook direction — `'up'` =
bracket above, hooks drawn descending (render.js). The day-32 version of this
snippet printed it as "hooks up/down", which misleads.
