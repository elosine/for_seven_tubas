# PROOFREAD LEDGER — print score corrections (day 39 →)

> The tracking database for running-order step 3 (PROOFREAD LOOP).
> The composer sweeps the score **part by part in the zoom view**, dictating
> corrections piecemeal, possibly interrupted at any point. **Every dictated
> item lands here the moment it is said — the chat is never the record.**
> This file always answers: *what's been done, and where to pick up.*

---

## POSITION — read this first on any pickup

- **Sweep:** not started — waiting on the composer's first part
- **Parts done:** none of 10
- **Batch state:** collecting batch 1 (0 items) · nothing applied · nothing awaiting review
- **Pick up:** composer dictates corrections; AI logs them as ITEMS below

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
| T1 | — |
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

*(none yet — format below)*

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
