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

## I3 — Keystation not reaching sandbox — `monitoring` (ROOT CAUSE REVISED 2026-08-13)

- **The historical solution (piece #3 SAMPLER_QUIRKS, 2026-08-03):** hardware
  MIDI inputs are single-client; **Reaper auto-enables new MIDI devices by
  default and silently owns them**, starving Chrome/Web MIDI. Fix then: keep
  hardware inputs DISABLED in Reaper (sandbox reaches Reaper via loopMIDI,
  which is multi-client and exempt) + **uncheck Reaper's auto-enable option**.
- **Why it recurred NOW (live-config evidence):** reaper.ini `midiins`
  bitmask has 20 of ~22 input devices ENABLED (only 4 ever disabled) — the
  auto-enable was never unchecked on this machine's current state, so the
  Keystation keys port is almost certainly among the enabled. AND the CRD
  remote-audio workflow made **"Options → Reset all MIDI/audio devices"**
  routine — every reset re-opens all enabled MIDI inputs, seizing the
  Keystation from Chrome deterministically. (Day-1 sandbox worked on
  launch-order luck.)
- **The fix (one visit):** Preferences → MIDI Devices → right-click
  "Keystation 88 MK3" input → **Disable input** · same page: **uncheck
  automatic enabling of new MIDI devices**. MIDIIN2 note: an MCU control
  surface is configured (csurf_0=MCU, input dev 9) — likely bound to the
  Keystation's DAW-control port; separate device, doesn't hold the keys port;
  left as-is.
- **Standing rule:** REMOTE_AUDITION's Reset-all-devices step is safe ONLY
  with the Keystation input disabled in Reaper.

- **REVISION (2026-08-13, after composer screenshots):** Reaper EXONERATED on the
  input list — midiins clear bits {0,1,3,15,31} decode EXACTLY to {UMC1820,
  Keystation, stale loopMIDI Port, MIDIIN2, keystation-mirror}: only the 20
  loopMIDI instrument ports are enabled; the Keystation was disabled all along
  (the composer maintained the historical fix; prior AI inference was wrong).
- **Actual root cause: MIRROR SHADOWING.** The dead `keystation-mirror` port
  (created for the never-built router) matches the sandbox bind regex
  /keystation/i — first-match-wins bound the silent mirror instead of the real
  keyboard, depending on enumeration order. Onset matches the day the mirror
  port was created.
- **Fix:** sandbox bind priority — hardware first, mirror only as fallback
  (future router mode); console log + banner now name the bound input and the
  candidate list (no more blind binding).
- **Secondary findings:** "Reaper doesn't see devices" history = ports created
  while Reaper runs show <not present> until Reset all MIDI devices (ledger
  quirk confirmed); UMC1820 present at ID 0 = the studio ASIO device — when
  it's off/disconnected the ASIO driver list is empty (explains the earlier
  "[audio device closed]" empty-driver state).

## I4 — UVI Single-mode patch-load overwrites the selected slot — `monitoring`

- Single vs Multi mode is DISPLAY-ONLY for playback (all parts receive on their
  channels regardless). But **loading a patch while in Single mode replaces the
  currently selected part** — the likely mechanism behind Staccato overwriting
  b-slot A1 (Play & Sing) during manual test-switching (restored 2026-08-13).
- **Rule:** audition in Single mode freely; switch to Multi Mode BEFORE loading
  any patch so the target slot is visible. After any manual patch work, a
  50-second `chsweep_probe.ps1` run re-verifies the whole instance.

## Solved

- **META overlay selection** *(composer ask 2026-08-14, shipped same day, build
  `b17-metastack`)* — gesture shapes share one META lane and cover each other.
  Now: **click again at the same spot cycles down the stack** (narrowest first,
  so a short shape buried under a long one is pick #1; status line shows
  "name — 2/3 stacked"); **ALT+click opens a picker** listing everything stacked
  there (color swatch · label · duration, click to select, ESC/click-away to
  dismiss); the **selected shape is raised to the front** so its edge/box
  handles are never buried. All three mutation paths (body drag, box handles,
  panel fields) then act on the cycled-to shape and time-scale ITS OWN group.
  Code: `metaStackAt` / `pickFromMetaStack` / `openMetaStackPicker` /
  `bringMetaToFront` in composer.html.

- **PALETTE menu** *(composer ask 2026-08-14, build `b18-palette`)* — a curated
  pull-down of material scores beside the Load menu. **Entries are REFERENCES to
  `scores/<file>.json`, never copies**, so a file edited once shows up updated in
  BOTH menus — the palette's change handler calls the same `loadSession()` the
  Load menu uses, so there is one source of truth and no sync step. Provenance is
  always visible: the option's tooltip and the status line both name the
  underlying save file. **+** adds the current score (prompts for a palette name;
  re-adding the same file renames in place rather than duplicating), **−**
  removes it from the palette (never deletes the score). A missing file is shown
  with ⚠ rather than hidden. Config: `score/palette.json`; API:
  `GET|POST /api/composer/palette`.
