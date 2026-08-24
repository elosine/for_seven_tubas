# CLOUD02-D — WHICH PART OWNS WHICH BRACKET

> Written day 32 to answer the composer directly: *"can you tell which part the
> brackets are assigned to?… I've lost confidence that the brackets are being
> shown with the correct tuba part."* Generated from `db1-c2d-x01`'s laid-out
> geometry, not by eye. Regenerate after any rebuild with the snippet at the end.

## THE ANSWER: every bracket IS on its correct part

All 16 brackets in 42.3–48.1 s belong to the part whose notes they cover — the
assignment is correct in the data. **What is broken is that you cannot SEE it**,
for two reasons, one of which is now fixed.

## Reason 1 — hooks pointed the wrong way (FIXED day 32)

A tuplet bracket's hooks turn **toward its own notes**. Two brackets pointed
away, and both were ones placed by the new `--bracketSide` dictation: the flag
that sets hook direction was written inverted. **T6's 3:2** (above its staff,
hooks were ascending) and **T7's 5:4 + 7:4** (below its staff, hooks were
descending) were pointing at the neighbouring part instead of their own.
Fixed; **all 16 now verified hooking toward their own notes.**

That alone was making ownership unreadable: a bracket's hooks are the visual
cue for which staff it belongs to.

## Reason 2 — one gap can hold brackets from TWO parts (NOT fixed; the real problem)

A bracket drawn BELOW part N and a bracket drawn ABOVE part N+1 land in the
**same visual gap**, with nothing but the hooks to say which is which:

| gap | brackets in it | owners |
|---|---|---|
| T1/T2 | 7:4 @44.27 · 6:4 @44.94 | T2, T2 |
| T2/T3 | 6:4 @43.98 · 7:4 @45.12 | T3, T3 |
| T3/T4 | 5:4 @45.47 | T4 |
| T4/T5 | 3:2 @44.95 (T4's, below) · 7:4 @45.10 (T5's, above) | **T4 and T5** |
| T5/T6 | 3:2 @44.47 | T6 |
| **T7/T8** | 3:2 @43.59 · 5:4 @44.65 · 7:4 @45.18 (all T7's, below) · **6:4 @45.45 (T8's, above)** | **T7 and T8** |
| T8/T9 | 3:2 @44.48 · 5:4 @46.09 | T8, T8 |
| T9/T10 | 3:2 @44.89 | T9 |

**The T7/T8 gap is the one the composer could not read**: four brackets, three
of them T7's and one T8's, interleaved in one band. The 6:4 sits between T7's
5:4 and 7:4 in time, so it reads as part of the same row.

Current split: **8 of 16 brackets are drawn above their own staff, 8 below** —
because the day-31 side-switching machinery puts each bracket wherever there is
room. That machinery solved collisions and created this.

## THE LEADING HYPOTHESIS for the next pass (untested — the composer's eye decides)

**Put every bracket on the same side of its own staff, always** — most likely
the beam side, so a bracket is always adjacent to the beam it belongs to, which
is the strongest ownership cue available. Ownership then never depends on
counting gaps. The cost is that collisions come back where the lane is tight,
and those get solved by moving the OTHER furniture (dynamics/accents, which are
per-note and far more mobile) rather than the brackets.

This reverses the day-31 approach — that pass optimised for "no ink touches
anything", and traded away the thing that actually matters on the page.

## Regenerate this table

```bash
node -e "
const fs=require('fs'),path=require('path'),ROOT='.';
const L=require('./notation/lib/layout.js');
const G=JSON.parse(fs.readFileSync('./notation/lib/glyphs.json','utf8'));
const C=JSON.parse(fs.readFileSync('./notation/registry/container.json','utf8'));
const ir=JSON.parse(fs.readFileSync('./notation/ir/db1-c2d-x01.ir.json','utf8'));
for(const s of L.layoutSection(ir,G,(C.engraving&&C.engraving.layout)||{}).systems)
 for(const i of s.items) if(i.k==='tuplet'&&i.t0>=42.3&&i.t0<=48.1)
  console.log('T'+(s.part+1)+'  '+i.text+' @'+i.t0.toFixed(2)+'  y '+i.ySs.toFixed(2)
   +'  '+(i.ySs>0?'ABOVE':'BELOW')+'  hooks '+i.dir
   +'  -> appears in the T'+(i.ySs>0?s.part+'/T'+(s.part+1):(s.part+1)+'/T'+(s.part+2))+' gap');"
```
