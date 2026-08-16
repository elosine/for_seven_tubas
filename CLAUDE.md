# for seven tubas

Composition #4 in the custom-composition-system lineage
(#1 `string_quartet_no1-composer` → #2 `composition_for_two_pianos_and_two_percussion`
→ #3 `for_bass_clarinet_harp_and_accordion` → this).

Started as a detour from piece #3 (2026-08-10); #3 resumes later. This piece inherits
#3's score/sandbox stack wholesale (see docs/PROJECT_JOURNAL.md D1).

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
  between work chunks; the docs are the handoff, not the chat
- Working preferences & session routines: piece #3's `docs/HOW_WE_WORK.md` and
  `docs/SESSION_PROTOCOL.md` apply unchanged (registered as an additional working dir).

Do NOT scan or analyze the codebase unprompted. Name the question first, then read only
what answers it. High bar for subagents / background processes.

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
- **Never push without asking.**
