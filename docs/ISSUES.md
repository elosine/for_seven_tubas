# Issues ledger — recurring problems, tracked

*Sticky problems get an entry: symptoms → root cause → cures installed → status.
Status: `open` / `monitoring` / `closed`. Check here BEFORE re-diagnosing.*

## I1 — CC7 residue: tracks stuck quiet — `monitoring` (cure installed 2026-08-13)

- **Symptoms:** tuba tracks very quiet; persists across patch changes; gain
  staging checks clean. Recurring since the piece began ("sticky problem in the
  past").
- **Root cause:** swell grains end at zero → last CC7 on a channel ≈ 0; old
  stop-flush restored only ACTIVE grains' channels; UVI stores channel volume
  per channel independent of patch → residue mutes everything played between
  renders (sandbox, keyboard, auditions). Cloud renders themselves were mostly
  protected by the 150 ms pre-arm.
- **Cures installed (2026-08-13):**
  1. Stop-flush sweeps **all-notes-off + CC7=127 + technique CC0 defaults**
     across the ENTIRE technique map on every playback stop.
  2. **CC7 Reset button** (composer top bar) — same full sweep on demand.
  3. **Sandbox per-note immunity** — CC7=127 sent before every sandbox note.
- **If it recurs anyway:** (a) click CC7 Reset — if that cures it, a path exists
  that bypasses the stop-flush (find it); (b) if the button does NOT cure it,
  the quiet is NOT CC7 — check CC11/expression, UVI part volume knobs, or the
  Reaper fader/monitoring chain; (c) log the recurrence here with what fixed it.
- **Test stimulus:** `cc7test-1track` (20 back-to-back short surges, Tuba 1) —
  equal loudness first-to-last = healthy lifecycle.

## I2 — Sticky sub-patch state (CC0 menu techniques) — `monitoring`

- Same anatomy as I1: techniques that select sub-patches via CC0 (menu slots,
  piece #3 quirk lineage) leave that selection as channel state. The reset sweep
  now re-asserts each technique's cc0 default. If a menu technique sounds WRONG
  (not quiet — wrong sound), suspect stale CC0 → CC7 Reset button re-asserts.
