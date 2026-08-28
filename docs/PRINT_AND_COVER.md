# PRINT FORMAT AND COVER — decided day 36 (2026-08-26)

**BUILT day 37** — `tools/export_print.js`. The whole score is **68 tabloid pages
in 3 seconds**, vector, verified MediaBox [0 0 1224 792] with zero raster images.
This file holds the format decisions; the build trail is RUNNING_LOG day 37.
The font itself is a separate doc — `docs/FONTS.md`.

    node tools/export_print.js --cover on --out print/score/BCB-score-DRAFT.pdf

**Because it is 3 seconds, iterate by RE-RENDERING, never by patching a page.**
Flags: `--sec` (seconds per page = density), `--pages a-b`, `--at <second>`,
`--margin`, `--ruler/--marks/--cover on|off`, `--htmlOnly`.

**The engine needed no print code.** `Layout.layoutSection` is in staff-space
units and `Coords.makeView` maps it to any canvas, so print is the same model at
a different view. Deriving print geometry from the SAME `container.json` lane
proportions the video uses reproduces §1's table without either being typed in:
lane **26.6 mm** vs the 26.7 measured below, staff **8.18 mm** vs "~8 mm".

---

## 1 · THE PRINT FORMAT: **TABLOID LANDSCAPE, 17 × 11 in** (composer, day 36)

**Supersedes PP-4 in `docs/plans/PENN_STATE_DELIVERABLES_PREPLAN.md`**, which
adopted *Letter landscape* provisionally.

**16:9 is the VIDEO only.** PP-1 fixes the screen-following video at 1920×1080.
The PDF full score is a separate deliverable and is not 16:9 — tabloid landscape
is 1.55 : 1.

### The arithmetic behind the change

| | printable height | ÷ 10 parts | staff | system width |
|---|---|---|---|---|
| Letter landscape 11 × 8.5 | ~203 mm | 20.3 mm | ~6 mm (rastral 5) | 267 mm |
| **Tabloid landscape 17 × 11** | **~267 mm** | **26.7 mm** | **~8 mm (rastral 3)** | **419 mm** |

Tabloid buys **~31 % larger staves and 57 % more time per page at once** — so
roughly a third fewer pages *and* more legible ones. For a ten-part score with
ledger lines, dynamics and a bouncing ball in every lane, that is not marginal.
The cost is that it cannot be run off at home and reproduction is dearer.

Pagination is a view, so this stays reversible.

---

## 2 · THE COVER — the house style, MEASURED (not guessed)

Taken off **`scores/Litany.pdf` page 1** (Justin Yang, 2003; the same house
style as the Kotos cover), by decoding the PDF's own per-glyph text matrices:

| | |
|---|---|
| face | **EngraversGothic BT** — see `docs/FONTS.md` |
| title : composer-name size | **exactly 2 : 1** (72 pt / 36 pt on a Letter page) |
| title baseline | **27.1 %** down the page |
| name baseline | **53.9 %** down the page |
| horizontal | both lines **centred** (measured: text centre 305.8 pt vs page centre 306) |
| letterspacing | **ZERO added.** Every glyph position matches the font's own advance to within 0.04 pt — the wide look is the face's sidebearings, nothing else |
| colour | black |

**Do not type the title in caps.** Engravers Gothic holds SMALL CAPS in its
lowercase slots, so ordinary mixed case ("Bloom — Convergence — Balance")
produces the cover exactly.

### Added day 36 at the composer's ask

**"for Tuba Ensemble"**, between the title and the name, *"a little smaller than
title"* → **0.65 × title**, baseline 1.15 title-sizes below the title's.

### The fitting problem, and the answer

`Bloom — Convergence — Balance` is a long title. On Letter portrait it has to
shrink to **32 pt** to fit inside 0.75 in margins, which collapses the 2 : 1
hierarchy. Two ways out, both built:

- **stacked** — the three section names on three lines, keeping the full 72 pt.
  Recommended: the title *is* the three sections, so the stack says something.
- **tabloid, one line** — holds **71.5 pt**, essentially the house size, with no
  stacking needed. This is the one that matches the chosen paper.

## 3 · The files

| | |
|---|---|
| `print/cover/cover-*.svg` | vector, in points, at true page size — open in Illustrator/Inkscape, they pick up the installed font |
| `print/cover/contact-sheet.png` | the four options side by side |
| `print/cover/make_cover.ps1` | the generator; the house-style constants are at the top |

`make_cover.ps1` writes both a 300-dpi PNG and the SVG for each page size.
Re-run it after changing any constant.

**For final print, convert the SVG's text to outlines** in Illustrator or
Inkscape. That makes the cover independent of the font being installed and
sidesteps font embedding entirely.

## 4 · Still open

**Cover** *(unchanged from day 36)*

- The block sits **high** with empty space below — faithful to the reference,
  but the Litany cover had a diagram filling its lower half and ours does not.
  Dropping it to optical centre is one constant (`$FirstFrac`).
- **"for Tuba Ensemble" at 0.65** is nearly as wide as "Convergence" and can
  read as a fourth title line; 0.5–0.55 subordinates it more.

**Score — the composer's three calls (day 37, all measured, none decided)**

1. **DENSITY — the one genuinely open item, and it has a defensible default
   already in place.** This is the HORIZONTAL axis, and it exists as a separate
   question only because the notation is proportional: **x is time**, so how many
   seconds go across a page is a free parameter that the paper size does not
   determine. Staff size (vertical) is settled by the format; time-per-page is
   not the same axis.

   Default is 11.41 s/page = **67 pages**, chosen to hold the
   density the composer already approved on screen (the video lays down a fixed
   number of staff-spaces per second; print holds that constant, so a printed
   bar looks like the filmed bar, only larger). Measured alternatives:

   | s/page | pages | page-gaps duplicating music | total repeated |
   |---|---|---|---|
   | 9 | 86 | 16 of 85 | 15.8 s |
   | **11.41** *(default)* | **67** | 12 of 66 | 11.6 s |
   | 15 | 51 | 9 of 50 | 6.6 s |
   | 20 | 38 | 5 of 37 | 6.1 s |

   *The duplication is inherited from the film, not a defect:* a page's window is
   a fixed span from its `t0` while `planPages` breaks on musical rules, so an
   early break puts a little music on both pages — worst case 1.9 s, read twice
   at a page turn. Removing it means letting px/s vary page to page.

2. **COLOUR — DECIDED (composer, day 37): "color".** The score prints in
   colour; the overlay palette stays exactly as the composer approved on screen,
   and no print-only greyscale variant is built. *One practical consequence to
   know, not a reopening:* a black-and-white photocopy of the score loses the
   crescendo layer (it sits at grey 209–215 against paper 255) while everything
   else survives — so B/W duplicates are not a substitute for the colour score.

   *The measurement that informed it, kept for the record.* The page is not
   black-and-white. On a dense page the
   ink is **195 magenta elements** (`rgb(255,21,160)`) to 37 grey and 5 green.
   The magenta is the **GC object**, ported whole from piece #1 on the composer's
   instruction (*"the same colors, the same lines"*). On paper its arc and impact
   marker print but **the ball does not — it is animated** — so the page shows a
   trajectory without the thing that travels it. In greyscale the magenta and the
   grey ring bars land at similar values.

3. **STAFF SIZE — NOT A DECISION.** Measured day 37 across margins: 0.5 in →
   **7.04 mm**, 0.4 → 7.19, 0.35 → 7.26, 0.3 → 7.33, and with the ruler and marks
   strips removed entirely at 0.4 in → **7.43 mm**. The whole adjustable range is
   **0.4 mm**, so `--margin` is not the lever an earlier note called it. §1's
   8.18 mm is only reachable at essentially zero margin. **Ten parts on 11 inches
   fixes the staff at ~7 mm** — a normal full-score size (≈ rastral 4). A larger
   staff needs larger paper, or two systems of five per page and double the
   pages. It is a consequence of the settled format, not a knob.

## 5 · What print adds that the video has not got

| | |
|---|---|
| **time ruler** | the film has a moving cursor; paper does not, and this is proportional notation. Ticks every second, numbered every five, sharing the music view's x-mapping so a tick and the note under it cannot disagree |
| **section marks** | derived from the score's `ACT-` markers — BLOOM 141.39 · CONVERGENCE 259.56 · BALANCE 386.68 · TRANCE 499.83 — never the raw working marks, which is what `ir.hideMarkers` suppresses. The printed word is the TITLE's ("CONVERGENCE"), not the score's tag ("ACT-CONVERGE-01") |
| **folios** | page number and the page's time span |
| **cover** | `--cover on` prepends the approved `cover-D-tabloid-landscape-1line.svg` rather than inventing a second title page |

**Not built, and not needed for the submission: PARTS.** This is the full score.
Extracting ten single-player parts is a separate job (`frameParts` already
selects lanes, so the machinery exists).
