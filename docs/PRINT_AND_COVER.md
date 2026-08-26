# PRINT FORMAT AND COVER — decided day 36 (2026-08-26)

Parked deliberately: **the print score is not being generated yet.** This file
holds everything measured and decided so it does not have to be rediscovered.
The font itself is a separate doc — `docs/FONTS.md`.

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

- The block sits **high** with empty space below — faithful to the reference,
  but the Litany cover had a diagram filling its lower half and ours does not.
  Dropping it to optical centre is one constant (`$FirstFrac`).
- **"for Tuba Ensemble" at 0.65** is nearly as wide as "Convergence" and can
  read as a fourth title line; 0.5–0.55 subordinates it more.
