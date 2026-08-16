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
