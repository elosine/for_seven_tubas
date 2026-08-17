---
description: Pick up the same task after a mid-chunk clear — read the checkpoint, restate the next step, start
---

# Resume (postclear)

**Use after `/clear` when the task did not change** — you checkpointed, cleared,
and are carrying on with the same work. This is deliberately much cheaper than
`/session-start`: no last-session playback, no agenda, no "what would you like to
work on today?". You already know.

**If the subject DID change, run `/session-start` instead.**

1. **Read only these two things:**
   - `docs/PROJECT_JOURNAL.md` §2 — the most recent **checkpoint** entry
     (`(mid-session checkpoint)`) and nothing older
   - `docs/PLANNER.md`'s **`NOW ►`** line

   Do **not** read the codebase. Do not read `PLAN.md`, `HOW_WE_WORK.md` or older
   §2 entries unless the checkpoint entry names one. Orientation is the
   checkpoint's job — if it did not do it, that is a signal, see step 3.

2. **Play it back in ≤5 bullets:** the task · where it stands · the latest
   deliverable · the next concrete step · anything waiting on the composer.

3. **If the checkpoint does not name a next concrete step, say so and stop
   resuming — run `/session-start` instead.** A checkpoint you cannot resume from
   was a bad checkpoint; do not paper over it by re-deriving the plan, which is
   the expensive thing this whole cycle exists to avoid.

4. **Check the tree matches.** `git status --short` against the checkpoint's
   deliberately-uncommitted list. Say so if it drifted — the composer may have
   saved scores or actuals from the app in between, which is normal and is not
   yours to commit without asking.

5. **Start the next concrete step.** Narrate briefly so the composer can
   interrupt. Do not ask what to work on and do not propose an agenda.
