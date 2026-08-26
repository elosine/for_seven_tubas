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

# → **`piece-final-draft-001`**

**FINAL DRAFT 001 (day 36, 2026-08-26).** The whole piece in one file:
Section 1 (2–135 s) · the three morph sections BLOOM / CONVERGENCE / BALANCE
(141–495 s) · the trance (500–751 s). **4481 notes in 24 groups, 2.00–751.42 s.**
Bumped from `piece-s28`, which is now frozen — verified object-for-object,
**4643 objects, 0 differing**, metadata the only change.

## TWO KINDS OF FILES — don't mix them up

| kind | where you see it | what it is |
|---|---|---|
| **Score save** (`scores/piece-sNN.json`) | composer app's file list | the actual piece DATA. One is current; older ones are frozen |
| **Notation page** (`notation/ir/*.ir.json`) | notation app's PICKER (the dropdown) | a DRAWING of one time-window of one frozen save. Not a score |

The `scores/` folder holds ~270 files. Almost all are sandbox experiments,
auditions, and section takes. **The piece is only the `piece-sNN` chain.**

---

## THE CHAIN (newest last — the piece proper)

> **`piece-final-draft-001` is the newest** (day 36). `piece-s28` froze as the
> era in which the trance section was notated — the per-part tempo apparatus —
> and folded into MAIN DRAFT, taking the page to 0–751 s.

| file | status | era it froze | which notation page reads it |
|---|---|---|---|
| `piece-s01` … `piece-s25` | frozen | the assembly era (days 13–20) | — |
| `piece-s25-finished01` | **frozen canon** | CLOUD02-D done (day 33) | — (its material lives on in MAIN DRAFT via s27's identical tile) |
| `piece-s26` | **frozen canon** | INT2 blasts done (day 35) | — (same) |
| `piece-s27` | **frozen canon** | the morphs went to TEN parts; CONVERGE target fixed; the morph notation designed and folded (day 35) | — |
| `piece-s28` | **CURRENT — compose here** | (open) | **MAIN DRAFT** (0–496 s) + the three morph pages |

**`-work` files** (`piece-s25-finished01-work` etc.): the composer app's own
autosave working copies. **Never a source for anything** (D75 — one is stale
on disk and stays; harmless). The app makes `piece-s28-work` by itself when
you first edit s28.

**`7tubas.json`**: a 1 KB stub from day 1. The lineage never used it —
ignore it. (CLAUDE.md's pointer to it is corrected to point here.)

---

## THE NOTATION PAGES — ONE page (day 35, the composer's mandate)

> *"Just keep one in the main section… that has all the notation we've built
> so far and just keeps accumulating it. The sort of main draft, if you will."*

**The main section of the picker holds exactly ONE entry:**

# → **MAIN DRAFT — all notation so far (0-751 s)**

That page (internal id `db1`, source `piece-s28`) carries EVERYTHING notated:
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

**Day 35 bump:** `piece-s28` is an object-for-object copy of `piece-s27` (4645
objects, verified identical), with fresh metadata. **s27 is frozen as the era in
which the three morph sections went to ten parts, CONVERGE's target array was fixed,
and the morph notation was designed and folded into MAIN DRAFT.** MAIN DRAFT and the
three morph pages now read **s28**; `morph-x01` still reads s27 and is left there —
it is the frozen T1 design reference, and the two files are identical anyway.
**Compose the trance work in `piece-s28`.**

---

## THE TRANCE PAGE (day 35; REVISED day 36; FOLDED day 36)

> **FOLDED INTO MAIN DRAFT, day 36.** `db1` now carries the trance as well —
> **4481 events, 906 chunks, 0–751 s**, which is every note in the piece. The
> standalone `trance-a4` page is kept as the section's own working view.
> Proven at the fold: **0 items added or removed before 496.5 s**, all 17 218
> additions at or after it, warnings 32 → 32; the only change in the old span
> was each part's staff line ending 496.5 → 753.


**`TRANCE A4 — 500-751 s`** — internal id `trance-a4`, source `piece-s28`.
Rebuild with the command in its own `provenance.build`
(`notate_section.js ... --trance grp-tranceA4-01`). **Not yet folded into MAIN
DRAFT** — that waits on the composer's eye.

**Day 36 (the composer's redirect, `docs/plans/TRANCE_A4_REVISION.md` v3):**
the page is now a **PER-PART tempo apparatus**.

- **3109 in-tempo notes** — black head, plain stem, staccato dot, left edge on
  the go time, no GC and no go line (the head is already on its moment)
- **10 long-tone columns / 70 members**, each column on ONE written ring
  (`ringSeconds` = the column's minimum next-attack gap less a 0.5 s breath):
  0.30 · 0.30 · 0.30 · 0.70 · 1.10 · 2.30 · 1.10 · 2.70 · 0.70 · 7.96 s
- **159 tempo marks, one lane at a time** — a bar line + ♩=N in a part's own
  lane wherever THAT part changes tempo (T5 takes 13, T2/T4/T8/T9 take 17)
- **3486 ball instances** — one per lane at that part's own step, tiled so the
  lane always holds exactly one ball; OFF over [521.03, 529.03),
  [647.43, 664.63) and [685.03, 709.43)
- **dynamics stripped to three things**: `f` on each part's first note, the 30
  swells' own ppp→fff pairs, and a pair at each part's PH6 entry
- **30 swells** keep the surge device and gain `curveZero` — the drawn curve
  starts at 0 instead of at the sounding floor (drawing only)
- **10 PH6 crescendo curves**, limeGreen, bottom half of the lane, flat from
  the `PS6 hold ff` knee
- `hideMarkers: true` stays; **cuivré text is KEPT** (7 notes)

**The map is AUTHORED** in `notation/lib/trance_overlays.js` and re-derived from
the score at every build; mismatches print and nothing is silently substituted.
**Four segments currently mismatch** — PS2 · PS3 · PS4 · PS5 — see the running
log, day 36.
