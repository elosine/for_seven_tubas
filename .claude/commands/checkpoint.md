---
description: Save-point before clearing mid-chunk — commit, capture state, keep the same task alive across the clear
---

# Checkpoint (preclear)

**Use when the work is NOT finished but the chat is.** Context running low, a
large context-burning operation coming, or you simply want to clear and keep
going on the same thing. This is a **save-point, not a closure** — skip every
Session End wrap-up step (no lessons-learned pass, no promotion to §4, no §6
review, no tag).

**If the chunk is actually done — the subject is about to change — run
`/session-end` instead.** That is the other boundary; see
`docs/SESSION_HYGIENE.md` § The two boundaries.

Do these in order, then say plainly that it is safe to `/clear`.

1. **Doc-currency sweep.** Anything decided this session that still lives only in
   chat → `docs/PROJECT_JOURNAL.md` §2 (or §4 if it is a real decision),
   `docs/PLAN.md` statuses, `docs/PLANNER.md`. Now, not later.

2. **Refresh `docs/PLANNER.md`'s `NOW ►` line.** One line: where the piece
   actually stands and what is immediately next. `/resume` reads it, so a stale
   NOW ► sends the next session to the wrong place. *(It went six days and two
   morphs stale once — that is why this step is here and not implied.)*

3. **Commit the working tree.** Stage **explicit paths only, never `git add -A`**
   (D30 — a second agent may be working in this tree). Message captures intent:
   `session N mid: [task] — [state]`. Never skip: uncommitted work plus a dead
   context is unrecoverable.

4. **Name what is deliberately NOT committed.** Run `git status --short` and list
   every untracked or modified path being left alone **and why**, one line each —
   composer scores mid-edit, saved actuals, loose files at a folder root. Put
   this in the §2 entry. Without it the next session cannot tell deliberate work
   from junk, and it has guessed wrong before (`piece-s18-work`, day 14).

5. **Write the §2 checkpoint entry**, under **Open at session end**, marked
   `(mid-session checkpoint)`. Written for an AI that has never seen this
   conversation:
   - the current task and its state
   - the latest deliverable, by name/path
   - **the next concrete step, phrased as an instruction** — not "continue the
     morph work" but "render BALANCE at release 3 and compare the tail to 5"
   - decisions pending the composer
   - the deliberately-uncommitted list from step 4

6. **Push** (D30 — automatic after a commit; the older "ask first" wording in
   piece #3's `SESSION_PROTOCOL.md` predates it).

7. **Say it plainly:** what was committed, what was left, and that it is safe to
   `/clear` and then `/resume`.
