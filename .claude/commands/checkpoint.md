---
description: Save-point before clearing mid-chunk — commit, capture state, keep the same task alive across the clear
---

# Checkpoint (preclear)

**Use when the work is NOT finished but the chat is.** Context running low, a
large context-burning operation coming, a Fable block about to start, or you
simply want to clear and keep going on the same thing. This is a **save-point,
not a closure** — skip every Session End wrap-up step (no lessons-learned pass,
no promotion to §4, no §6 review, no tag).

**If the chunk is actually done — the subject is about to change — run
`/session-end` instead.** That is the other boundary; see
`docs/SESSION_HYGIENE.md` § The two boundaries.

**The economics this serves (day 35): spend tokens on the DYING session, save
them on the FRESH one.** This session's context is already paid for; the next
session starts from zero and may be Fable. So the checkpoint does the
remembering, and `/postclear` only reads. **If the next block is Fable and you are
not already on Opus, run this wrap on Opus** (`/model` first) — it is
mechanical work at the long, expensive end of a session; then `/clear`, switch
to Fable, `/postclear`.

Do these in order, then say plainly that it is safe to `/clear`.

1. **Doc sweep + NOW ►.** Anything decided this session that still lives only
   in chat → `docs/PROJECT_JOURNAL.md` §2 (or §4 if it is a real decision),
   `docs/PLAN.md` statuses, `docs/RUNNING_LOG.md`. Then refresh
   `docs/PLANNER.md`'s **`NOW ►`** line — one line: where the piece actually
   stands and what is immediately next; `/postclear` reads it, and it went six
   days and two morphs stale once. If journaling happened as the work happened
   — the standing rule — this step is a check, not a writing session.

2. **Write the §2 checkpoint entry**, under **Open at session end**, marked
   `(mid-session checkpoint)`. Written for an AI that has never seen this
   conversation:
   - the current task and its state
   - the latest deliverable, by name/path
   - **the next concrete step, phrased as an instruction** — not "continue the
     morph work" but "render BALANCE at release 3 and compare the tail to 5"
   - **`Resume reads:` — the exact docs/sections the next session must read
     beyond journal §2** (e.g. `PLAN 8j spec`, `NOTATION_STANDARDS § brackets`,
     `RUNNING_LOG day-35 entry`). This slot is the fix for the day-35 finding
     that post-clear sessions came back missing context: the dying session is
     the only one that knows what else matters — name it. If §2 alone
     suffices, say so: `Resume reads: nothing beyond §2`.
   - decisions pending the composer
   - **the deliberately-uncommitted list:** run `git status --short` and name
     every untracked or modified path being left alone **and why**, one line
     each — composer scores mid-edit, saved actuals, loose files at a folder
     root. Without it the next session cannot tell deliberate work from junk,
     and it has guessed wrong before (`piece-s18-work`, day 14).

3. **Commit + push.** Stage **explicit paths only, never `git add -A`** (D30 —
   a second agent may be working in this tree). Message captures intent:
   `session N mid: [task] — [state]`. Push follows the commit automatically
   (D30). Never skip the commit: uncommitted work plus a dead context is
   unrecoverable.

4. **Say it plainly:** what was committed, what was left, that it is safe to
   `/clear` and then `/postclear` — and **which model to resume on**.
