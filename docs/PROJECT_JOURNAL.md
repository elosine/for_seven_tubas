# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**Last session:** *2026-08-10 (session 1, Claude Code)* — **Repo seeded from piece #3.**
- Composer score adapted: 7 tracks labeled Tuba 1–7, canonical score `scores/7tubas.json`,
  port 5200. Sandbox on 4700. `sandbox/instruments.js`: 7 skeleton instruments
  (ports `tuba1`…`tuba7`, placeholder Ordinario ch1, provisional range MIDI 22–65).
- **Composer is building loopMIDI ports + Reaper rack now** (0b). Port names must match
  `instruments.js` exactly (case-sensitive). Monitoring ON per track — #3 Principle 1.
- **Open:** tuba sample library not yet named (0c) → survey (1) → techniques fill in.

**Blockers:** none.

## §3 Principles

*(Inherited from piece #3 — full text in its journal §3; they carry verbatim.)*

1. **Check Reaper input monitoring before blaming the instrument.**
2. **When a working reference exists, diff the files — don't iterate guesses.**

## §4 Decisions

- **D1** *(2026-08-10)* — **Inherit piece #3's stack and protocols unchanged.** Score
  app + sandbox copied; #3's **D8** (saving: canonical committed score, explicit-save
  versions capped 20 gitignored, 5 s autosave) and **D9** (motive blocks = linked
  references into `sandbox/motives/`; unlink = fork; fixed per-instrument pitch axis;
  direct on-score editing) apply as written. *Why:* the protocols were designed
  piece-agnostic (engine vs. palette); seven tracks is palette data. Divergences get
  their own D-entries here.

## §5 Done

- 2026-08-10 — 0a stack seed.

## §6 Human Notes

