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
