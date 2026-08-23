# Session hygiene & model strategy

> Written 2026-08-16 after measuring this project's actual token burn.
> Piece #3's `HOW_WE_WORK.md` / `SESSION_PROTOCOL.md` still apply; this is the
> cost-and-continuity layer on top of them.

## Why this exists — the measurement

One continuous session ran **2026-08-02 → 2026-08-16**: 4,854 turns,
7.4 M output tokens, and **2.42 BILLION tokens of context re-read**.

The decisive number: **~499,000 tokens of context re-read on every turn**,
because the whole session's history is resent each time. Output averaged only
1,530 tokens/turn — *output is not what costs; carried context is.*

**A session at 100 K context instead of 500 K costs roughly 5× less per turn.**
Long single sessions are the expensive pattern; the docs exist so they aren't
necessary.

## The two boundaries

There are two different reasons to clear, and they want different handling.
Treating them as one thing is what makes clearing feel expensive.

| | **Chunk boundary** | **Context boundary** |
|---|---|---|
| What changed | the **subject** — done with this, on to that | **nothing** — same task, the chat just got long |
| Before | `/session-end` | `/checkpoint` |
| After | `/session-start` | `/resume` |
| Costs | full closure + full orientation | a commit + a §2 entry; two short reads |

**Why they are not the same command.** `/session-start` is built for a new day:
it plays back *last session*, asks *"what would you like to work on today?"* and
proposes a 2–3 deliverable agenda. After a mid-task clear all three are wrong —
you were ten minutes ago, you know the task, and you would have to decline the
agenda to get back to it. Symmetrically, `/session-end` is **closure**: lessons
learned, promotion to §4, the §6 review, a tag. Paying that just to empty the
context is ceremony, and ceremony is what this document exists to remove.

**The rule that keeps the pair honest:** if `/resume` cannot tell you the next
concrete step from the checkpoint alone, the checkpoint was bad — and the
recovery is `/session-start`, not re-deriving the plan from the code. Re-deriving
is the expensive failure this whole cycle exists to prevent.

Procedures live in the commands themselves — `.claude/commands/checkpoint.md`
and `.claude/commands/resume.md`, which are canonical for their steps so there is
no second copy to drift.

*(Added 2026-08-17, day 15, composer's question: "can we have a preclear and a
postclear protocol, or is that essentially the same as session end and session
start?" Answer: the preclear half already existed as prose — piece #3's
`SESSION_PROTOCOL.md` § Pre-Compaction Checkpoint — but had no command and was
named for its trigger rather than its use. The postclear half did not exist.)*

## The routine

**Starting a work chunk (a sandbox, a section, a research question):**

1. `/clear` (or a new chat). Do not continue yesterday's session.
2. **Run `/session-start`.** It is not automatic: after a clear the session has
   only `CLAUDE.md` (which merely *points* at the docs). `/session-start` reads
   `PROJECT_JOURNAL.md` §2, the planner's **NOW ►** line and §6 Human Notes,
   plays back where things stand, and proposes an agenda.
3. The new session orients from **docs, not chat history** —
   `docs/PLANNER.md` → `PROJECT_JOURNAL.md` §2 → the specific doc for the task.
   That is what they are for.

**The full cycle:** `/session-end` → `/clear` → `/session-start` → work.

**And the cheap inner cycle, when the task has NOT changed:**
work → `/checkpoint` → `/clear` → `/resume` → work. Use it freely — it is the
one that makes a long task affordable, because it resets the carried context
without paying for closure and re-orientation.

*Skip `/session-start` for genuine one-offs* (a typo, a quick question) — the
orientation costs tokens and an exchange, and is worth it for a sandbox build or
a new container, not a two-minute errand.

**During the chunk:**

- One chunk = one session. When the subject genuinely changes, `/clear`.
- If a session turns into a long debugging grind, that is the most expensive
  thing we do. Stop, write down what is known, `/clear`, resume fresh.
- **Write decisions into docs as they are made**, not at the end — a `/clear`
  or a crash must never lose them.

**Finishing a chunk:**

- Run `/session-end`. It updates journal §2 (including **Open at session end**,
  written for an AI that has never seen the conversation), promotes decisions
  to §4, syncs PLAN/PLANNER, commits, and pushes.
- **That IS the handoff.** Nothing should live only in chat.

## Model strategy

Capability order: **Fable 5 > Opus 5 > Sonnet 5 > Haiku 4.5** — and cost tracks
capability, so match the model to the kind of thinking required.

| Use | Model |
|---|---|
| Architecture, "what should this be", unknown-cause debugging, musical/design conversation | **Fable 5** |
| Implementing an agreed, written plan; mechanical edits; probes; doc updates | **Opus 5** |
| Bulk mechanical work | **Sonnet 5** |

**Fable has its own weekly credit balance** *(composer, day 25)* — so the question is
not only "which model thinks best here" but "does this step need Fable at all". The
working rule: **Fable for the turns where a wrong reading costs a day; Opus for every
turn where the plan is already on paper.** Concretely:
- Switch TO Fable for: the design/"what should this be" conversation · a verdict on a
  musical result (the listen, the page) · a reframe or state-of-play check ("restate
  this for me") · unknown-cause debugging. Day 25's expensive mistake — a day of
  thinning built on reading "dense" as aesthetic — is the kind a Fable turn is for.
- Switch TO Opus the moment the step is a LIST: applying ledgered moves, re-extracting,
  running batteries, building to a written spec, doc updates. Opus executes a written
  plan well; the failure mode is not execution but *deciding* an open design point
  mid-build — so the plan entry must close the data shapes (the caveat below).
- **Mid-session switches are safe: the transcript carries over.** The risk is context
  LENGTH, not the switch — the early chat gets summarised and keeps conclusions, not the
  trail. RUNNING_LOG is the trail; write to it before switching, not after.
- **`/clear` between milestones** (the composer's practice) is the right boundary; it
  makes the docs the handoff. The test before clearing: could a cold model execute the
  next step from journal §2 alone? If not, the §2 block is not finished.

**THE RHYTHM (composer, day 25):** *"plan out the next logical few steps, have a
recommended model-switching rhythm, including a clear rhythm, and then AI can say
'this is a good time to clear' or 'this is a good time to switch models'."* Day 25
ran this way by accident and it worked: plan read back → approved → written to §2 →
Part 1 (Opus) → Part 2 (Opus) → "good juncture to clear?" → §2 made cold-correct →
clear → Part 3 (Fable). So it is now the standing practice (CLAUDE.md § THE RHYTHM):
- at every juncture the AI lists the next 2–4 steps with **model + clear** per step;
- the AI **announces** switch/clear points rather than waiting to be asked;
- the list is a **running thread in journal §2** ("NEXT STEPS · MODEL · CLEAR"),
  kept current as steps complete, so it survives clears and model changes;
- a clear is recommended at a **milestone** or a **mode change** (execution ↔
  conversation) — and only after the cold-execution test passes.

**The plan/implement split only works if the plan is written to a FILE.**
`/clear` discards the chat, so a plan that lives only in conversation cannot be
handed to the implementing session. Sequence:

1. Design with Fable → **have it written into `PLAN.md` (or a task doc)** with
   enough detail to implement from cold.
2. `/clear`.
3. Implement with Opus, pointed at that doc.

**Caveat learned the hard way (cluster sandbox, 2026-08-15):** the expensive
bugs were *design* mistakes made during implementation — velocity routed through
CC7, a transform silently disabling editing, indices used where references were
needed. If the plan leaves those open, the implementing session will decide them
ad hoc and the cost lands anyway. **Name the interaction model, the data model,
and the failure modes in the plan**, not just the feature list.

## Sandbox lessons (apply to every future sandbox)

Earned across the blast and cluster sandboxes:

1. **Adopt a standard interaction model on day one, don't invent one.** The
   audio-editor transport (click = cursor, drag = select, SPACE = play/stop,
   HOME = zero, one concept for cursor+selection) replaced a dozen ad-hoc rules.
2. **Never invent a modal rule that silently disables an interaction.** Two
   separate sessions were lost to "I can't select notes" — first a velocity
   change gating editing, then a live transform doing it. Prefer a preview layer
   over a locked one.
3. **MIDI thru must never listen to loopMIDI (`tuba*`) ports** — they are
   bidirectional and echo into a feedback storm.
4. **Schedule playback with a lead** (~150 ms) so the first note never races the
   all-notes-off that precedes it.
5. **Identify objects by reference, not array index**, wherever the array is
   re-sorted.
6. **One concept beats two.** Snippets + gestures as separate tiers was
   confusing; lists + items (load, edit, autosave, duplicate, delete) is the
   standard preset model and needed no explanation.
7. **Only delete IDs you created in the same breath.** Cleaning up "everything
   present" has destroyed composer data twice.
