# NITS — deferred small stuff

> Things worth fixing that are **not** blocking the piece. Opened 2026-08-16 on the
> composer's working rule: *fix what blocks the work or what will break; record the
> rest here rather than spending decision time on it.*
>
> Format: one bullet, what it is, why it's deferred. Delete when fixed.
> Nothing here should ever need a decision from the composer to be recorded — only
> to be scheduled.

## Open

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
