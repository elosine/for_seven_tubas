# ARCHIVE AMENDMENTS — when notation finds a "finished" object wrong

> Created day 22 (2026-08-21) at the composer's request, on the first case:
> *"let's also have some sort of documentation protocol when we're dealing
> with legacy archive objects that are, quote, unquote, finished."*
> Protocol first, ledger below. One line per amendment; never delete lines —
> change their STATUS.

## The protocol

1. **The archive is frozen.** The canonical piece score
   (`scores/piece-s25-finished01.json`) and its objects are never edited by
   the AI as a side effect of notation work. "Finished" means finished.
2. **Corrections live in the IR — the notation's truth.** When tier-2 work
   shows an archive object to be wrong or under-specified for sound or page,
   the corrected value goes into the version file (`notation/ir/*.ir.json`):
   - **systematic** → an extractor rule (e.g. the 2n law: fixed one-shots'
     `duration` = their measured sample length), so every sibling inherits it;
   - **singular** → a per-item override in the IR's overlays channel.
3. **The notation app's playback follows the IR**, not the archive
   (`midiplayer.withIrDurations`: a per-play clone of the score whose object
   ends follow the IR's event durations — the archive object is untouched).
   What you hear in the loop is the amended note.
4. **Every amendment gets a ledger line here** the moment it is made: object ·
   what the archive says · what the IR says · why · the evidence · status.
5. **A COMPOSITIONAL edit is not an amendment, and it goes in the SCORE**
   *(added day 24, first case: moving `wc-28` from T2 to T9 on the
   composer's instruction).* Rules 1-4 govern an archive value being WRONG.
   When the composer instead changes the music — who plays a note, when, on
   what pitch — the IR cannot carry it: a part move changes which MIDI port
   sounds the note, and the player compiles the ARCHIVE (with IR durations
   applied), so an IR-only move would draw the note on the new staff while
   it kept sounding on the old port. That divergence is the thing this
   document exists to prevent. So: the edit goes in the score, it is made by
   an explicit script (`tools/move_object.js`) rather than by hand, it gets a
   ledger line marked **SCORE EDIT**, and every IR built from that score is
   re-extracted in the same breath. `git checkout -- scores/<name>.json` is
   the undo.
6. **Folding back into the archive is a separate, explicit composer act**
   (a script run from this ledger), never automatic. Until then the
   composer app and any render made from the raw archive still play the
   archive's values — a known divergence, stated per line below.

## Known gaps (so the divergence is never a surprise)

- `tools/export_midi.js` compiles the RAW archive — a Reaper render made
  from it plays the un-amended notes (wc-23's fp cut at 0.70 s). Fix when a
  render is next made: `--ir <id>` applying `withIrDurations` (NITS).
- The composer app (`composer.html`) plays the archive as drawn.

## Ledger

| Date | Object | Archive says | IR says | Why | Evidence | Status |
|---|---|---|---|---|---|---|
| 2026-08-21 | `wc-23` (T1, G#1 fortepiano, `grp-g1-opening`) | drawn 14.544–15.243 (0.70 s); note-off at 15.243 | duration 1.49 s → sounds to 16.034 (2n: measured fp sample length at MIDI 32) | the note-off cut the sample roughly in half; composer heard it ("cuts out about halfway through the line") and chose the full sample ("that one was the whole bar more or less, let's use that one") | probe `db1-t1-x03` (archive copy with only wc-23 lengthened): headless compile off@15.243 vs off@16.034, same on/port/ch; composer's ear verdict on x03 | IR-only (systematic: every fp/staccato/cuivre inherits via the 2n rule in extraction) |
| 2026-08-22 | `wc-29` (T1, G1 staccato, `grp-g1-opening`) | drawn 17.749–18.035 (0.286 s); note-off at 18.035 | duration 0.46 s → sounds to 18.209 (2n: measured staccato sample length at MIDI 31) | same law as wc-23 (D49/D51): the drawn object is 0.17 s short of the sample; the tag `STAC-rev` = "reverted to staccato at original duration" (commit 2bd18e1) — provenance, not a length decision | extraction applied the 2n rule; `test_midiplayer` now asserts the amended list = every IR event whose duration differs from the drawn object | IR-only (systematic) |
| 2026-08-22 | `wc-28` (staccato G1/midi 31, 17.19 s, `grp-g1-opening`, `STAC-rev`) | part **T2** (`tuba2b` ch 3) | part **T9** (`tuba9b` ch 3) | composer instruction — a COMPOSITIONAL move, not a correction: *"in tuba two at seventeen nineteen there is a GC. Can we move that to another part, two by nine?"* T9 was the only part free there (empty until 21.07, the sparsest in the section, no surge) | `tools/move_object.js` dry run + one-line diff (`"layer": 1` → `8`); live page shows the 17.19 GC on T9's lane and none in T2 before 22.66; `techniqueFor` routes it to `tuba9b` where it was `tuba2b`; IR re-extracted and revalidated, 8 batteries green | **SCORE EDIT (archive)** — applied, not IR-only |
