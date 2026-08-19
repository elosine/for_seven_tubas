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
- **Automatic filing contract:** `docs/TAXONOMY.md` — when the composer builds
  variants and chooses keepers, AI files voicings/articulation-sets/
  realizations into `bank/blast_taxonomy.json` WITHOUT being asked
- **Living plan:** `docs/PLAN.md` — stable IDs; rules in its header
- **Session state, decisions:** `docs/PROJECT_JOURNAL.md` — §2 Resume Here first
- **Composer's verbatim thinking:** `docs/COMPOSER_LOG.md`
- **Session hygiene, cost, model strategy:** `docs/SESSION_HYGIENE.md` — clear
  between work chunks; the docs are the handoff, not the chat.
  **Two clear-boundaries, two cycles** (§ The two boundaries):
  subject changed → `/session-end` · `/clear` · `/session-start`;
  same task, long chat → `/checkpoint` · `/clear` · `/resume` (the cheap one)
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

**Why the bar is "would this be expensive to rediscover", not "is it important".**
The composer intends to write papers from this process — not only the one in
`docs/PAPER_NOTES.md`. What the paper needs is the *sequence*: what was tried,
what was discovered, how the discovery happened, what it replaced. A tidy summary
of conclusions is worth much less than the trail.

Also file to `docs/PAPER_NOTES.md` the moment something bears on the argument —
a framing, a reversal, a quotable phrase. Verbatim where the wording matters.

## Apps

- **Composer score:** `node score/server.js` → http://localhost:5200/composer.html
  (7 tracks, Tuba 1–7; saving protocol = piece #3's D8: canonical `scores/7tubas.json`,
  CTRL+S versions capped 20 gitignored, 5 s autosave)
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
