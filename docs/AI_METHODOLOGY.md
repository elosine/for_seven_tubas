# AI METHODOLOGY — how to work on this piece

> Composer's standing instruction, 2026-08-16. **Read this before proposing or
> building anything.** It governs how work is scoped, how decisions are put to the
> composer, and what a confidence claim has to be worth.
>
> This sits above convenience: piece #3's `HOW_WE_WORK.md` and `SESSION_PROTOCOL.md`
> still apply, but where they conflict with this file, this file wins.

---

## The situation

A piece is being written to a deadline. **The piece is the goal; the tooling is
in service of it.** Every hour spent on tooling that the piece did not need is an
hour taken from the piece.

The constraint is **not** how much code gets written. AI writes code quickly.
The constraint is **broken code**, and the composer's attention.

> *"if that takes a bunch of code, I think that's okay because AI is quite fast at
> developing the code. It's just when it doesn't work, that's the problem."*

---

## The five rules

### 1. Fix what blocks the work. Flag everything else.

Build what is preventing the composer from doing what they are trying to do, or
what will break something. Everything else goes to **`docs/NITS.md`** — recorded,
not fixed, not discussed.

> *"I'll just mostly focus on the bugs or features that are preventing me from
> actually doing what I want to do or that are critical blockages... the others, we
> can just record somewhere as things to eventually fix."*

### 2. Do not make the composer decide minutiae.

Bring a plan with the small decisions **already made and justified**. A menu of
options is a cost, not a courtesy.

Surface a decision **only** when both are true:
- it changes the musical result, **and**
- only the composer can answer it.

Everything else: choose the sensible default, say in one line what you chose and
why, and move on. Prefer a decision that is cheap to reverse over a discussion.

> *"there was just a lot of minutiae that I don't want to take the time to make
> decisions about."*

### 3. Prefer one large robust build over a small fragile one.

Code volume is the least limiting factor. Design for the case that will not need
troubleshooting:

- **One code path beats a branch.** Branches are where the bugs live.
- **Never silently refuse or silently discard.** Do the thing, mark what is wrong,
  make the correction an explicit act.
- **Separate the certain from the estimated**, and make sure a wrong estimate can
  only produce a cosmetic error — never a block, never a decision the composer has
  to make.
- Think about what defeats the fix later (a drag, a reload, a re-insert), not just
  what makes it pass once.

> *"competent plan, solid, robust. Confident decision tree."*

### 4. A confidence claim must be worth something.

This is the one that matters most.

If you say *"this will do X"*, or *"this will need at most this much
troubleshooting"*, **that assessment has to be reliable.** The composer plans
around it.

Therefore:
- **Verify in the running app, not by reading the code.** "It works" means it was
  executed and observed. Say what you ran and what came back.
- **Report failures plainly**, including ones you caused and fixed. If a test
  assertion was wrong rather than the code, say which.
- **Distinguish what you verified from what you inferred.** Never let an inference
  wear the clothes of a check.
- **State residual risk in one line** — where this is most likely to bite.
- **Do not give time estimates.** They have been consistently wrong in both
  directions. Give confidence and risk instead.
- If you are not confident, **say so before building**, not after.

> *"if AI is saying something will do something... and it risked to cause maximum
> this much troubleshooting, then that should be a reliable assessment."*

### 5. No clear evidence means no diagnosis.

If the cause of a problem is not established, say that. Do not present a plausible
story as a finding. Flag it in `docs/NITS.md` with the observations on both sides
and leave it until it recurs with better evidence.

> *"If there's no clear evidence for what's going on, then that's fine, we'll just
> leave it for now until it becomes a problem again."*

---

## Reading cost is a real cost

Understanding the analysis is itself work the composer has to do.

- **Lead with the answer.** TL;DR first, detail after, bullets over prose.
- A long analysis with the conclusion at the bottom is a tax. Invert it.
- Cite IDs with names, never bare (`D9 (ORD is the only real duration)`).
- If a finding does not change what the composer does next, it probably belongs in
  the journal rather than the chat.

---

## The deferral ledger — `docs/NITS.md`

The place for everything that is real but not now. **Nothing gets lost, and
nothing competes for attention.**

Goes in NITS:
- cosmetic bugs, inconsistencies, papercuts
- an open question with no clear evidence yet (rule 5)
- a known gap in a shipped feature
- anything the composer says "leave it" about

Each entry: what it is, what was observed (all sides, even contradictory), and why
it is deferred. Enough context to act on cold, months later. Delete when fixed.

**Never ask the composer to triage NITS.** File it and move on. It is reviewed when
something in it resurfaces, not on a schedule.

---

## Capture as you go — the paper is a deliverable, not an epilogue

*(Composer's standing instruction, 2026-08-17. Restates and widens the reason
`docs/RUNNING_LOG.md` exists.)*

**The chat window gets cleared often, and the paper is being written FROM this
process.** So notes are not a session-end chore — they are written **as the work
happens**, unprompted, and they are written for two readers at once: the next
cold session, and the paper.

> *"I am clearing the chat window often… but also, more specifically, for a
> paper. So collecting journal and experimental notes — so when we sit down to
> write the paper, we have the process documented."*

**What this changes in practice:** the AI writes the entry at the moment of the
verdict or the measurement, not when asked, and never waits for a wrap. If the
composer says something quotable about a sound, it is captured **verbatim**
before the next render is started. An unrecorded listening verdict is a lost
experiment — it cannot be re-run, because the ear that produced it has moved on.

### Where each kind of note goes — one destination each, no duplication

| Kind of note | File |
|---|---|
| **The experimental log** — what was tried, in order; what was heard; what was measured; why a number is what it is | `docs/RUNNING_LOG.md` (append, newest last) |
| **The composer's words, verbatim** — verdicts on sounds, framings, asides worth quoting | `docs/COMPOSER_LOG.md` |
| **One bespoke gesture shape, end to end** — asked-for → dialled → *what was wrong* → fix → generalisation candidate | `docs/SHAPE_LESSONS.md` |
| **The paper's argument and its evidence** — the method, the case studies, the claims a finding supports | `docs/PAPER_NOTES.md` |
| **Measured facts about morphs** (cents, rates, boundaries) | `docs/MORPH_FINDINGS.md` |
| **Decisions with force** (why + rejected alternatives) | `PROJECT_JOURNAL.md` §4, via §2 |
| **Real but not now** | `docs/NITS.md` |

**The rule that keeps them from becoming one blurred pile:** RUNNING_LOG is the
**raw trail** (chronological, cheap to write, safe to read cold); PAPER_NOTES is
the **distilled argument** (a finding only earns a place there once it supports
a claim). A thing may be summarised in both — it is never *drafted* in both.

**The paper-relevant half is the negative half.** What failed, what the
correction was, and which test was wrong rather than which code — those are the
entries that make the method reproducible instead of merely reported. A shape
that worked first time teaches almost nothing.

---

## Quick self-check before replying

1. Am I asking for a decision that I could have made myself?
2. Is my confidence claim backed by something I actually ran?
3. Did I flag the deferrable things instead of raising them?
4. Is the answer at the top?
5. **Did anything just happen that the paper will want — a verdict, a
   measurement, a correction? Then it is already written down, not queued.**
