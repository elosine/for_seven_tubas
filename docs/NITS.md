# NITS — deferred small stuff

> Things worth fixing that are **not** blocking the piece. Opened 2026-08-16 on the
> composer's working rule: *fix what blocks the work or what will break; record the
> rest here rather than spending decision time on it.*
>
> Format: one bullet, what it is, why it's deferred. Delete when fixed.
> Nothing here should ever need a decision from the composer to be recorded — only
> to be scheduled.

## Open

- **META shape overhangs its parts on `grp-s018-1056` — CAUSE NOT ESTABLISHED.**
  In `piece-s12` / `piece-s12-work`: shape 105.63–113.43, parts 105.63–110.62
  (8 notes, ord 4.99 s + cuivre 1.25/1.12 s) — **2.81 s of shape with no sound
  under it.** The only mismatched group out of 19; `piece-s09/s10/s11` have none.
  - *Checked:* all three group-scaling paths (property panel `scaleGroupTo`,
    edge-node drag, box resize) map non-fixed members affinely and preserve fixed
    one-shot lengths. None of them can open a gap on their own.
  - *AI's guess (UNCONFIRMED, composer disagrees):* the ord notes were shortened
    individually afterwards, which does not shrink the shape.
  - *Composer's observation, which fits better:* they were only ever changing the
    META shape — and when they change it now, **the parts do follow, but the
    overhang is preserved.** That is what affine mapping does: an existing gap
    scales with everything else and never closes. So the question is not why the
    parts stopped following, it is **where the gap originally came from.**
  - *Deferred 2026-08-16 by the composer* — "leave it until it becomes a problem
    again." No auto-fit was added, deliberately: stretching an all-fixed gesture
    (staccato/fp/cuivre) is *supposed* to make the shape wider than the parts,
    because those samples only translate and never stretch (D9). An automatic
    "fit shape to parts" would silently undo that.
  - *If it recurs:* capture the gesture BEFORE and AFTER a single shape change and
    diff the member times — that pins the origin in one step.

- **Cuivre is fixed-length in the score but variable-length in the sandbox.**
  `Composer.FIXED_TECHS` lists cuivre at 1.17 s, so `isFixedLen()` makes it immune to
  group scaling; the cluster strip's `CG_VARIABLE` treats it as a drawn duration at
  insert. Net effect is coherent (the sandbox's length is preserved, then frozen),
  but the two halves disagree in principle. **Blocked on PLAN 2o** — the 60-second
  probe of whether note-off truncates a cuivre sample. Settle that first.

- **`durFor()` falls back to `son.ordLen || 1` for ord blasts.** S005 inserts at
  2.5 s per note. Fine, but it means a blast's ord length comes from the sonority
  record rather than anything measured, and long ord blasts collide with everything
  nearby by construction. Worth revisiting when ord blasts get used in anger.

- **Blast audition is still ideal-order, not placed-order.** `auditionSon()` plays
  the pitch-ordered mapping; the insert may route notes elsewhere to avoid
  conflicts. Inaudible today (every port carries the same instrument), so it only
  matters once parts are spatialized for real.

- **`piece-s08-work` 404 on page load.** The session bootstrap asks for a working
  copy that no longer exists; harmless, one console error per load.

- **The conflict badge does not recompute when you switch scores from a menu.**
  Observed 2026-08-16: with `piece-s16-work` open (badge `⚠ 42 soft`), loading
  `phase01-8th` from the Scores dropdown swapped the whole score — lanes 1–2
  drawn, 3–10 empty, markers rendered — but the badge still read `⚠ 42 soft`.
  A page reload on the same score showed the truth, `⚠ 0` (hidden). So the badge
  survives a load and reports the PREVIOUS score's count.
  - *Why it matters more than it looks:* it is wrong in both directions. A clean
    audition score inherits an alarming count, and — the dangerous one — a score
    with real conflicts loaded after a clean one reads `⚠ 0`. The wash on the
    lanes is the same computation, so it is presumably stale too.
  - *Why deferred:* it never lies once you touch anything (the check runs on every
    mutation, D16 corollary) or reload, and it did not block the phase-shift
    audition. The fix is to call the conflict recompute at the end of the
    score-load path in `composer.html`, next to `renderAll()`.
  - *Not touched* because a second agent was working in `composer.html` at the
    time.

## Fixed

- ~~Cluster insert didn't open the floating META window~~ (blast insert did) — fixed
  2026-08-16.
- ~~Cluster marker read `CG003 (cluster)`~~ — it looked up `provenance.cluster`,
  which these gestures don't carry; now reads `CG003 (REC-02)` via `cgOrigin()`.
  Fixed 2026-08-16.
- ~~Cluster audition and cluster insert disagreed about which player was which~~ —
  audition used port `tuba(k+1)` while the insert wrote `layer 9-k` (= Tuba 10-k),
  so what you heard was not the assignment you got. Both now go through
  `Composer.assignCluster` with `layer L = Tuba L+1`. Fixed 2026-08-16.

## HARD occupancy for fixed one-shots uses SAMPLE length, not articulation rate
*(opened 2026-08-16, DB3 / PLAN 2t)*

**What it is.** `Composer.CONFLICT`'s HARD tier = "the intervals overlap", where a
staccato note's interval is its full measured sample length (0.33–0.53 s). That
is what forced 154 hard conflicts on `densBld03-take1` and cost 91 notes at the
apex.

**Observation for changing it.** `docs/SI2_staccato_lengths.md` measures
**"Sounded (s)"** — how long the sample rang, decay and room included. A player
who has tongued a staccato has stopped blowing; the decay is horn and room, not
the player. **D17 already made this exact correction for SOFT** ("a fixed
one-shot's length includes decay the player is not articulating through") but
left HARD on sample occupancy.

**Observation against changing it.** On one instrument two notes cannot sound at
once, and the score/notation has to represent something. Sample occupancy is the
conservative reading and it is the only one the mock-up can render truthfully —
two overlapping notes on one player go out on two UVI channels and both sound
cleanly, which is the whole reason 2r exists.

**Why deferred.** It does not block: the conclusion is the same either way — DB3's
apex exceeds ten players even at a 0.11 s floor (44 hard). Only the *amount* of
thinning moves, from ~91 notes deleted to somewhere around 30–60. Settling it
needs a real player's articulation rate, which is the same evidence 2j and 2q are
waiting on. Until then the pipeline is conservative on purpose and
`docs/DENSITY_PIPELINE.md` says so.

**If it recurs:** the symptom will be the composer hearing the packed version as
thinner than intended at an apex. The one-line change is `pairTier`'s HARD test
for techniques in `FIXED_TECHS`; the tables to regenerate are in
`docs/DENSITY_PIPELINE.md`.

---

## `phase01-8th` / `phase02-*` cannot be regenerated by the current sweep CLI
*(found 2026-08-16 during PLAN 2x Phase 0; deferred)*

**What it is.** Four committed research scores — `phase01-8th`, `phase02-l120`,
`phase02-m60`, `phase02-s30` — no longer reproduce from `tools/phase_shift.js`.
Every note's `performanceNotes` reads `phase/unison`, `phase/shifting apart`
etc. (one tag per SWEEP STAGE), while the CLI now writes `phase/s0` — one tag
for the whole section. `phase01-8th` differs further: its marker labels use an
older format ("target 0.5 beat = 353 ms" vs today's "out 20s to 353 ms · DRIFT
…") and its note length is 0.42 s rather than the current 0.12 s default.

**What was observed, both sides.**
- The sweep CLI was clearly refactored at some point from one-section-per-stage
  to a single section carrying a `stages` array. Nothing recorded when.
- **Verified pre-existing, not caused by the 2x extraction:** checking out
  `tools/phase_shift.js` at HEAD (before the extraction) and running
  `--model sweep --name phase02-m60 --bpm 100 --out 60 --back 60` produces the
  *same* `phase/s0` divergence against the committed file.
- The extracted engine and the pre-extraction code agree **byte-for-byte** on
  this same command (and on `phase01-8th`'s defaults), so the extraction is
  faithful — it inherited the drift, it did not create it.
- The nine BEAT-model scores (`phase03`–`phase11`) all regenerate byte-identical
  and are the regression corpus.

**Why deferred.** It blocks nothing. `performanceNotes` is a provenance tag, not
sound — the audio, timings and pitches are unaffected, and the composer's
verdicts on phase01/phase02 were reached on the committed files, which are
untouched. The sweep model is also the *research* instrument (one slow pass to
find the categories), not the texture generator 2x is building on; the beat
model is what the sandbox uses.

**If it recurs:** the symptom would be wanting to re-render a phase01/phase02
variant and finding the stage boundaries no longer legible in the part tags. The
fix is to have the sweep path emit `sec.tag` per stage again — i.e. give
`buildScore` a stage-aware tag, or go back to one section per stage — and then
regenerate all four. Do not "repair" the committed scores in place; they are the
heard artefacts.

---

## The bend-envelope convention was written down in four places, one of them wrong

*(Found 2026-08-16 during 2z G4. FIXED — recorded here because the failure mode
is the interesting part, not the bug.)*

**What it was.** A morph note's `bend` array is relative to the **played key**
(`n.midi * 100`) — the render loop subtracts the key when it builds `subBend`.
But `toScoreObjects` and `morph_emit.js` both added the residual
(`cents - key*100`) a **second** time, so any note whose onset sits off its key
sounded sharp or flat by exactly its own residual. **Measured worst case on a
stock M2 spectral render: 40.2 cents.** Audition and insert were both affected.

**Why nobody caught it.** `tools/morph_probe.js` computed its *expected* pitch
with the same double-add, and so did the unit test. The day-10 measurement
("spectral targets within 0.4 ¢, fan waypoints within 1.0 ¢") was therefore a
true statement about the **MIDI-to-audio** chain that could say nothing about the
**engine-to-MIDI** step — it agreed with the error instead of testing it.

**The generalisation worth keeping.** A measurement is only evidence about the
step it actually crosses. If the expectation and the implementation are computed
from the same formula, the test is a mirror. Where a convention is expressed in
more than one place, assert the two ends against each other — which is what
`test_morph.js` now does: sounding cents `=== midi*100 + bend`, in the engine, in
the score object and in the emitted MIDI.

**Consequence still open:** 2v material with off-key onsets (M2 spectral, M1/M3
detunes, anything re-keyed) now plays differently from what the composer heard on
day 10 — correctly, but differently. The blessed verdicts on those variants were
formed on slightly wrong pitches.

---

## Two test helpers still measure absolute pitch loosely

*(2026-08-16, 2z G4. Cosmetic — the assertions pass and are about ratios.)*

`test_morph.js`'s `travel` and `arrive` helpers were corrected to
`midi*100 + bend` along with everything else, but they were written to compare
*relative* travel, so they would have passed either way. If a future change makes
either of them load-bearing, they should be re-derived rather than trusted.
