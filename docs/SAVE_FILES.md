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
4563 objects, 10 tracks — the 0–111 s arc AND the trance section (~500 s+).

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
| `piece-s25-finished01` | **frozen canon** | CLOUD02-D done (day 33) | **`db1`** (0–55.94 s) |
| `piece-s26` | **frozen canon** | INT2 blasts done (day 35) | **`int2b1`** (81–111 s) |
| `piece-s27` | **CURRENT — compose here** | (open) | **`db2`** (55.9–81 s) |

**`-work` files** (`piece-s25-finished01-work` etc.): the composer app's own
autosave working copies. **Never a source for anything** (D75 — one is stale
on disk and stays; harmless). The app makes `piece-s27-work` by itself when
you first edit s27.

**`7tubas.json`**: a 1 KB stub from day 1. The lineage never used it —
ignore it. (CLAUDE.md's pointer to it is corrected to point here.)

---

## THE NOTATION PAGES (what the picker's names mean)

| picker label | id | window | source save | what's on it |
|---|---|---|---|---|
| DENSITY BUILD 1 + CLOUD02-I + CLOUD02-D — all parts figured (day 33) | `db1` | 0–55.94 s | piece-s25-finished01 | the APPROVED opening: density build 1, both clouds, **the 48 s long tone** (ten B♭ octaves, 4.41 s bars) |
| DENSITY BUILD (GESTURE-2 x0.75) — 56-81 s | `db2` | 55.9–81 s | piece-s27 | the current fix-pass page (12 clusters, 91 one-shots) |
| INT2 BLASTS — 81-111 s | `int2b1` | 81–111 s | piece-s26 | **the blasts + THE LONG TONES section** — 11 struck columns with their ring bars, incl. the shortened T1 breath |
| *(everything above db1 in the picker)* | — | — | — | older era/experiment pages: trance, section-1 trials, morphs, the day-1 opening |
| db1 ALL PARTS x01 … *(under "experiments")* | `db1-all-x01` | — | — | stale day-23 fork, bricks only — ignore |

**There is NO single all-piece notation page yet.** The piece so far =
`db1` + `db2` + `int2b1`, tiling 0–111 s continuously. One combined page is a
FOLD (proven twice, D70) or an export (PLAN 8) — it happens when you ask.

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
- **"I want to see a section's notation"** → notation app picker →
  `db1` (0–56) · `db2` (56–81) · `int2b1` (81–111), by the labels above.
- **"Where are the long tones?"** → the 48 s one is on `db1`;
  the 81–111 s section of them is on `int2b1` ("INT2 BLASTS").
- **"Which save is safe to touch?"** → only `piece-s27`. Everything
  else in the chain is frozen canon; `-work` files are the app's own.
