# Remote audition — watch + listen from the laptop (Option 1: CRD)

*Set up 2026-08-12. Verified config: Chrome Remote Desktop host running on the
studio desktop; Reaper on **WASAPI shared → default Realtek out** (`mode=3`,
`wasapi_mode=0` in reaper.ini) — exactly what CRD's audio capture carries.
**No settings changes were needed.** No ASIO anywhere (ASIO would bypass CRD).*

## The checklist (from the remote laptop)

1. **Connect:** remotedesktop.google.com → the studio desktop.
2. **Studio apps up** (usually already running): Reaper with the tuba rack
   (input monitoring ON) · loopMIDI. If the score server is down, double-click
   **`start_score_server.bat`** in the repo root.
3. **Open the score:** browser on the desktop (inside CRD) →
   `http://localhost:5200/composer.html` → Load the score.
4. **Audio check:** CRD browser client's left side-panel — audio forwarding ON
   (default). Windows volume on the desktop must be UP (capture follows it;
   muting Windows mutes the stream). Physical speaker volume is independent —
   turn the speakers themselves down if blasting the empty studio matters.
5. **Play.** You see the score scroll and hear Reaper through the laptop.

## Gotchas

- **The audio-system toggle (CONFIRMED in practice 2026-08-12):** the studio
  config is ASIO; remote sessions need **Preferences → Audio → Device → Audio
  system: WASAPI** (Shared, Output = Default output device) — the stored WASAPI
  settings are already right, just flip the dropdown. Back in the studio, flip
  back to ASIO. First remote session hit exactly this: meters moving, no sound,
  "[audio device closed]".
- ⚠ **Reset all MIDI/audio devices also re-opens MIDI inputs** — with the
  Keystation enabled in Reaper it SEIZES the keyboard from the sandbox
  (ISSUES.md I3). Keep the Keystation input disabled in Reaper, always.
- **After reconnecting CRD**, if sound dies: Options → Reset all MIDI/audio
  devices (the WASAPI stream re-opens against the current default device — CRD
  swaps the default when sessions cycle).
- **Mute the studio while listening remotely:** WIN+R → mmsys.cpl → Playback →
  right-click Speakers (Realtek) → Properties → Levels → mute. Only the physical
  endpoint mutes; the CRD device (remote ears) is unaffected. Unmute when home.
- CRD audio is compressed (fine for texture auditioning; not for mastering
  judgments). For full-quality listening use the file pipeline (PLAN 5a
  option 2) when built.
- If sound dies mid-session: check Windows default output device didn't change
  (Realtek must stay default), then Reaper Preferences → Audio → Device →
  reapply.
