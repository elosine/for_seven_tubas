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

- **Don't switch Reaper to ASIO** for remote sessions — WASAPI shared is what
  makes this work. (If an ASIO interface enters the studio later, add a
  "remote" WASAPI device preset in Reaper and toggle per session.)
- CRD audio is compressed (fine for texture auditioning; not for mastering
  judgments). For full-quality listening use the file pipeline (PLAN 5a
  option 2) when built.
- If sound dies mid-session: check Windows default output device didn't change
  (Realtek must stay default), then Reaper Preferences → Audio → Device →
  reapply.
