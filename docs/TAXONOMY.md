# TAXONOMY — the automatic filing contract (composer, 2026-08-14)

> **The deal:** the composer stays in flow — listens, asks for variants
> ("try this harmony this way, add a cuivre note, longer"), settles, chooses.
> **Choosing is the end of the composer's job.** AI then files every decision
> and every useful construction into the tiers below, automatically, at the
> moment it happens — never asking the composer to organize as they go.
> Registry data: `bank/blast_taxonomy.json`. Human view: this file + the
> palette menu. Blast strategy (composer): **same harmony · redistribute the
> notes · vary articulation type and length.**

## The tiers

1. **HARMONY FAMILY** — per chord (e.g. VERT01-03): every **revoicing** ever
   used for it (V1, V2, V3… — listenable via the score file + marker recorded
   with each), and every articulation treatment it has worn.
2. **VOICINGS** — filed twice: in their chord's family AND visible in the
   overall harmony collection. No inversion/analysis categories (composer
   explicitly skipped that) — just V-numbers with a one-line description.
3. **ARTICULATION SETS** — first-class reusable entities (AS01, AS02…): a
   recipe of articulation × register/lane mapping × length, **independent of
   harmony**, so a set built on one chord can be applied to any other.
4. **REALIZATIONS / SONORITIES** — chord × voicing × articulation set (+ per-note
   mods like cuivre swaps, length, dynamics) = a concrete blast. Where it lives
   (score + marker) is always recorded. Saved in `sonorities` (S001…), deduped
   on exact content; membership in named `customLists` is separate.
   **Duration is a stored DEFAULT, not a fixed property** *(composer note
   2026-08-14)*: an ord blast carries its `ordLen` from the sandbox, but once
   inserted into the composer score the composer must be able to **drag the
   duration**. No new machinery needed — an inserted blast is a `groupId` group
   with a META shape, and the existing group scaling (edge node / green box /
   panel Start-End) time-scales members affinely; since a blast's notes are
   simultaneous, that scaling *is* a duration drag. Same applies to fp/staccato
   holds if they ever need stretching.
5. **SECTION PALETTE** — the composer's KEEPERS for the section at hand
   (currently INT2), mirrored into the app's palette menu when asked.

## AI's standing obligations (every variant/choice session)

- When a variant is built on request: **file the voicing** (new V-number if the
  pitch distribution is new), **file the articulation recipe** (new AS-number
  if the combination is new), record the realization with its score location.
- When the composer says "keep it / use that one": flag the realization as a
  **keeper**, add it to the section palette list.
- Cross-file automatically: a new AS goes in the articulation-set tier even
  though it was born on one specific chord; a new voicing joins both its chord
  family and the overall collection.
- Never interrupt flow to ask taxonomy questions; if a filing is ambiguous,
  file it with a `?` note and move on.

## Current state (seeded 2026-08-14)

- **Harmony families:** VERT01-03 · 04 · 11 · 12 · 13 · 16 · 28 (the INT2
  working set, `int2-harmonies` score) — each with **V1** (as played) and
  **V2** (ten-note octave-displaced, max-spread).
- **Articulation sets:** AS01 uniform staccato (short) · AS02 uniform
  fortepiano (ring ~2s, natural decay) · AS03 uniform ordinario (sustained
  blast) — the three base colors from `harmony-blasts`. Composite sets (mixed
  registers, cuivre substitutions, length variants) get numbers as they are
  born.
- **INT2 keepers:** none yet — auditioning begins now.
