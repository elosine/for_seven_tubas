# SAVE FILES — the map (started day 35, at the composer's ask)

> Composer, day 35: *"Part of the problem is that you call it in the chat one
> thing, or maybe it's just an abbreviation. In any case, I can't figure out
> which save file is which. AI can name them — I just need to know what they're
> called and how to find them."*
>
> **This file is the answer, kept current.** The AI updates it at every bump
> and every new notation page, without being asked. Chat rule: the AI names a
> file by its EXACT filename or picker label on first mention, every session.

---

## THE ONE FILE YOU COMPOSE IN, RIGHT NOW

**`piece-s27`** — open it in the **composer app** (:5200/composer.html).
Everything new goes here. It contains the WHOLE piece so far as data:
4563 objects, 10 tracks — the 0–136 s arc AND the trance section (~500 s+).

---

## TWO KINDS OF FILES — don't mix them up

| kind | where you see it | what it is |
|---|---|---|
| **Score save** (`scores/piece-sNN.json`) | composer app's file list | the actual piece DATA. One is current; older ones are frozen |
| **Notation page** (`notation/ir/*.ir.json`) | notation app's PICKER (the dropdown) | a DRAWING of one time-window of one frozen save. Not a score |

The `scores/` folder holds ~270 files. Almost all are sandbox experiments,
auditions, and section takes. **The piece is only the `piece-sNN` chain.**

---

## THE CHAIN (newest last — the piece proper)

| file | status | era it froze | which notation page reads it |
|---|---|---|---|
| `piece-s01` … `piece-s25` | frozen | the assembly era (days 13–20) | — |
| `piece-s25-finished01` | **frozen canon** | CLOUD02-D done (day 33) | — (its material lives on in MAIN DRAFT via s27's identical tile) |
| `piece-s26` | **frozen canon** | INT2 blasts done (day 35) | — (same) |
| `piece-s27` | **CURRENT — compose here** | (open) | **MAIN DRAFT** (0–496 s) |

**`-work` files** (`piece-s25-finished01-work` etc.): the composer app's own
autosave working copies. **Never a source for anything** (D75 — one is stale
on disk and stays; harmless). The app makes `piece-s27-work` by itself when
you first edit s27.

**`7tubas.json`**: a 1 KB stub from day 1. The lineage never used it —
ignore it. (CLAUDE.md's pointer to it is corrected to point here.)

---

## THE NOTATION PAGES — ONE page (day 35, the composer's mandate)

> *"Just keep one in the main section… that has all the notation we've built
> so far and just keeps accumulating it. The sort of main draft, if you will."*

**The main section of the picker holds exactly ONE entry:**

# → **MAIN DRAFT — all notation so far (0-496 s)**

That page (internal id `db1`, source `piece-s27`) carries EVERYTHING notated:
the opening density build + both clouds + the 48 s long tone (0–56), the
gesture-2 density build parked for the polish (56–81), the INT2 blasts +
long tones (81–111), **the final density build DB3 (113–136, day 35
sixteenth sitting)**, and **the three morph beds as BRICKS (141–496, day 35
seventeenth sitting — now TEN parts each; the glissando has no notation yet, so
bricks are the honest representation, not a placeholder)**. To see a section, pick MAIN DRAFT and set the window
seconds. **New sections are appended to this same page; the label's window
number updates as it grows.** The merge was proven tile-by-tile: every drawn
item identical to the three pages it replaced.

**Everything else sits under the "experiments" heading** — old era pages
(trance, section-1 trials, morphs, day-1 opening) and whatever working pages
the AI is currently building. Working pages are named in chat by their full
label. `db2` and `int2b1` no longer exist as separate pages (their content is
inside MAIN DRAFT; git history keeps the files).

---

## WHAT A BUMP IS (done twice: day 33, day 35 — same pattern every time)

At a section wrap, when you say "bump":

1. AI copies the current save **byte-faithfully** to the next number
   (`piece-s27` → `piece-s28`), fresh created/modified stamp only, and
   verifies object-by-object in the live app list.
2. The old file **freezes** as that era's canon. It never changes again.
3. **Notation pages are NOT bumped** — each page permanently names the frozen
   save it was drawn from. That is why db1/db2/int2b1 name three different
   saves: each names the save that was current when its section was built.
4. You compose the next section in the new file.
5. AI updates THIS map.

---

## HOW TO FIND THINGS

- **"I want to edit / hear the piece"** → composer app → `piece-s27`
  (in the app list the piece files sort near the top — newest first).
- **"I want to see ANY notation"** → notation app picker →
  **MAIN DRAFT — all notation so far** (the only main entry), then set the
  window: 0–56 opening · 56–81 density build 2 · 81–111 blasts + long tones.
- **"Which save is safe to touch?"** → only `piece-s27`. Everything
  else in the chain is frozen canon; `-work` files are the app's own.

---

## THE EXPERIMENT PAGE (day 35)

**`MORPH x01 — BLOOM T1 (the reference)`** — internal id `morph-x01`, source
`piece-s27`. **Its own file; MAIN DRAFT is never touched by it** (proven at every
step: 0 added, 0 removed, 0 changed). It is the reference for the morph-section
notation vocabulary — see `docs/MORPH_NOTATION.md`, and regenerate it with
`tools/notate_morph.js`. Safe to overwrite.

---

## THE MORPH PAGES (day 35) — one page per section, all ten parts

| picker label | id | span |
|---|---|---|
| **MORPH 1 — BLOOM (all ten)** | `morph-bloom` | 137.5–260.0 s |
| **MORPH 2 — CONVERGENCE (all ten)** | `morph-converge` | 255.7–383.9 s |
| **MORPH 3 — BALANCE (all ten)** | `morph-balance` | 382.8–497.3 s |

One page per section rather than thirty per-part pages — the whole ensemble is the
point in these sections. Regenerate any of them with `tools/notate_morph.js`; the
command is in each page's `provenance.build`. See `docs/MORPH_NOTATION.md`.

**`morph-x01` remains as BLOOM T1 alone** — the reference the vocabulary was designed
against. Safe to overwrite.
