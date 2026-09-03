# for seven tubas

Composition #4 in the custom-composition-system lineage
(#1 `string_quartet_no1-composer` → #2 `composition_for_two_pianos_and_two_percussion`
→ #3 `for_bass_clarinet_harp_and_accordion` → this).

Started as a detour from piece #3 (2026-08-10); #3 resumes later. This piece inherits
#3's score/sandbox stack wholesale (see docs/PROJECT_JOURNAL.md D1).

## READ FIRST — how to work here

**`docs/AI_METHODOLOGY.md`** is the composer's standing instruction on scoping,
decisions, and confidence. It governs everything below and outranks the inherited
working-preference docs where they conflict. In short: fix what blocks the piece
and flag the rest to `docs/NITS.md` · don't make the composer decide minutiae ·
prefer one robust build over a fragile one (code volume is not the constraint) ·
**a confidence claim must be verified in the running app, because the composer
plans around it** · no clear evidence means no diagnosis.

## Orient from docs, not from scanning

- **What now / what next (composer's working view):** `docs/PLANNER.md` —
  Section-1 containers, materials, open questions; raw notes append at bottom
- **Performance arc (fits-and-spurts) organizer:** `docs/PERFORMANCE_SCORE_ORDER.md`
  (D84) — when the composer says **"brief me"** (or resumes this arc), read it
  and brief EXACTLY: last sitting · active chunk ► · what's next. Update its
  marks + POSITION LOG at every wrap.
- **Which save file is which:** `docs/SAVE_FILES.md` — the `piece-sNN` chain,
  which frozen save each notation page reads, the bump protocol. **AI keeps it
  current at every bump and new page, and names files by exact filename /
  picker label in chat** (day 35, composer's ask)
- **Automatic filing contract:** `docs/TAXONOMY.md` — when the composer builds
  variants and chooses keepers, AI files voicings/articulation-sets/
  realizations into `bank/blast_taxonomy.json` WITHOUT being asked
- **Living plan:** `docs/PLAN.md` — stable IDs; rules in its header
- **Session state, decisions:** `docs/PROJECT_JOURNAL.md` — §2 Resume Here first.
  **Cold start = §2 + `docs/NOTATION_STANDARDS.md`, then go.** §2 carries the tool
  table and the next section's plan with commands; do not rediscover them.
- **Composer's verbatim thinking:** `docs/COMPOSER_LOG.md`
- **Session hygiene, cost, model strategy:** `docs/SESSION_HYGIENE.md` — clear
  between work chunks; the docs are the handoff, not the chat.
  **Two clear-boundaries, two cycles — and the model trigger** (§ The two
  boundaries): subject changed → `/session-end` · `/clear` · `/session-start`;
  same task, long chat → `/checkpoint` · `/clear` · `/postclear` (the cheap one);
  **Fable block ahead → wrap on Opus · `/clear` · resume on Fable**
- Working preferences & session routines: piece #3's `docs/HOW_WE_WORK.md` and
  `docs/SESSION_PROTOCOL.md` apply unchanged (registered as an additional working dir).

Do NOT scan or analyze the codebase unprompted. Name the question first, then read only
what answers it. High bar for subagents / background processes.

## Journal AS THE WORK HAPPENS, not at session end

**`docs/RUNNING_LOG.md` gets an entry while the work is happening.** The composer
clears chat regularly for cost hygiene, and the chat is not a record. Waiting for
`/session-end` means a clear can cost the process — which already happened once
on day 18, when a whole afternoon of decisions had no running-log entry until the
composer asked for one.

**Write an entry when any of these occur, without being asked:**
- a decision is made, *with the why and what was rejected*
- a number turns out to matter (a measurement, a threshold, a formula)
- something is verified — say what was checked and how
- something is deliberately NOT done, and why
- a wrong path is abandoned — **the dead ends are evidence, keep them**
- the composer says something that reframes the work; put it in their words
- **the AI itself reacts** — a framing, a citation ("that is Lerdahl & Jackendoff GPR 2b"),
  a measurement that answers the composer, a reversal of its own position — capture the
  AI's words VERBATIM too, next to the composer's, in PAPER_NOTES. *(Composer, day 28:
  "make sure we're capturing this conversation for the paper — your reactions too.")*
  The paper needs both sides of the exchange, not a summary of one.

**Why the bar is "would this be expensive to rediscover", not "is it important".**
The composer intends to write papers from this process — not only the one in
`docs/PAPER_NOTES.md`. What the paper needs is the *sequence*: what was tried,
what was discovered, how the discovery happened, what it replaced. A tidy summary
of conclusions is worth much less than the trail.

Also file to `docs/PAPER_NOTES.md` the moment something bears on the argument —
a framing, a reversal, a quotable phrase. Verbatim where the wording matters.

## THE RHYTHM — next steps · model · clear (standing, composer 2026-08-23)

At every juncture — a chunk wrap, a milestone, a mode change (execution ↔
conversation), or when asked "where are we" — the AI **states the next 2–4 logical
steps, each with a recommended model and whether to clear before it**, and **says
out loud when a good clear or switch point has arrived** ("this is a good time to
clear", "switch to Opus for this"). The rule for the recommendation is in
`docs/SESSION_HYGIENE.md` § Model strategy (Fable = judgment/verdicts/design;
Opus = executing a written plan; clear at milestones and mode changes; the
cold-execution test before any clear).

**The running thread lives in `docs/PROJECT_JOURNAL.md` §2 → "NEXT STEPS · MODEL ·
CLEAR".** Keep it current as steps complete — it is the first thing a model reads
after a clear, and it must say what is next, with what model, right now.

## Apps

- **Composer score:** `node score/server.js` → http://localhost:5200/composer.html
  (7 tracks, Tuba 1–7; D8 mechanics — CTRL+S versions capped 20 gitignored, 5 s
  autosave — but the canonical file is NOT `7tubas.json` (a day-1 stub): the piece
  lives in the `piece-sNN` chain, current one named in `docs/SAVE_FILES.md`)
- **Notation workshop:** same score server → http://localhost:5200/notation/app/notation.html
  (tier-2 experiment loop: `docs/NOTATION_WORKFLOW.md` — read it before notation work)
  **The settled figure rules: `docs/NOTATION_STANDARDS.md` — read before drawing
  any cluster or beam.** They are registry data (`container.json → engraving.layout.figures`).
- **Sandbox:** `node sandbox/serve.js` → http://localhost:4700
- Motive library shared between them: `sandbox/motives/` (linked blocks per #3's D9)
- Ports (loopMIDI, case-sensitive): `Tuba1` … `Tuba7`

## Reference repos (read-only context; additional working dirs)

- Piece #3: `C:\Users\jwloy\GitHub\for_bass_clarinet_harp_and_accordion` (richest docs;
  the D8/D9 protocols and sampler quirks ledger live there)

Consult only when a specific named question requires it. Never edit them.

## Git

- Commit at the natural wrap of an approved chunk; reference plan IDs in messages.
- **Push automatically after each commit** *(D30, 2026-08-16 — supersedes the
  earlier "never push without asking")*. Stage **explicit paths only, never
  `git add -A`** — a second agent may be working in this same tree, and `-A`
  would sweep their half-finished work into your commit. A push carries both
  agents' commits, which is harmless as long as every commit is complete.
