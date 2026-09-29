# Stand Test Kit

One web page that measures, **on the device you are holding**, whether the
performance system will be smooth and in time. It turns the ENGINE brief's
estimates into hard numbers (`docs/ENGINE_BRIEF.md`, verdict V4).

---

## Running it — on the computer

Once, after the score changes (about 1½ minutes):

```bash
node testkit/build_assets.js
```

Every test session:

```bash
node testkit/server.js
```

It prints the address to open on the other devices, e.g.
`http://192.168.1.15:4760/`.

---

## Running it — on each device

1. Join the **same Wi-Fi** as the computer.
2. Open the address the server printed.
3. Type a **name for the device** (e.g. `iPad 2018`).
4. Tap **Run all tests**.
   - quick run ≈ 10 minutes · full run ≈ 40 minutes
   - keep the screen **on**; do not touch it while a test runs
5. Tap **Save to server**. The file lands on the computer in
   `testkit/results/`.

**Before you start:**

- plug the device in
- set its auto-lock to **never**
- close other apps
- keep the page in front — a hidden page gets no frames (the kit says so)

---

## Two devices at once — the beacon

For a real sync check with no lab equipment:

1. Open the kit on two devices; tap **Open the beacon** on both.
2. Put them side by side; film both with a phone in **slow motion**.
3. Each flashes white on every whole second of room time.
4. Count the video frames between the two flashes.
   At 240 fps slow motion, one frame = 4.2 ms.

---

## What each test measures

- **T5 · this device** — screen, refresh rate, graphics, whether it
  decodes 1080p60 video in hardware, keep-screen-on, storage.
- **T1 · frame health** — the device's own frame timing, idle and under
  a synthetic load. The floor every renderer stands on.
- **T2 · renderers** — the busiest minute of the piece drawn five ways:
  - A0 today's engine, exactly as the notation app runs it
  - A1 retained SVG (the fix: build once, change only what moved)
  - A2 GPU layers (the fix, with every moving element on its own layer)
  - B canvas (the game-engine way)
  - C pre-rendered video (the concert stand)
  The key column is **main-thread cost per frame**: the headroom a
  cheap device has.
- **T4 · video stand** — seek speed, the player on its own, 1 % speed
  changes, and the frame servo holding the video to the clock through
  a deliberate +80 ms wrong-clock step.
- **T3 · clock + floor rule** — this device's clock drift, then the
  server **lies** to it (a jump, noise, a fast drift, a slow drift).
  Scored against the server's honest time: a plain sync against the
  floor rule.

---

## Which devices

The realistic zoo (players bring their own stands):

- one 2018-class iPad (Safari)
- one cheap Chromebook
- one mid-range Android tablet
- one Windows laptop
- any player's own device that is to hand

---

## Keeping the results

Per device, the file in `testkit/results/` holds everything. The
headline numbers, for a comparison table:

| device | T1 idle on time | T2 cost/frame A0 · A1 · A2 · B | T2 video repeats+skips /min | T3 clock drift | T4 servo frame events /min | T4 seek (1-s keyframes) |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## For the AI / a developer

- `build_assets.js` — cuts ONE window of the piece (the busiest 60 s by
  default; `--t0 690` for the ball-heavy final crescendo) into page SVGs,
  `trace.json` (per-frame state of every moving element), the engine
  modules + their inputs (lane A0 verbatim), and two video encodes.
  Read-only on the rest of the repo.
- `server.js` — static + HTTP Range · `/api/time` (monotonic clock) ·
  `/api/sabotage` (lie to one stand) · `/api/results` · `/api/info`.
  Dependency-free. `PORT` env overrides 4760.
- `verify_headless.js` — runs the page in headless Edge/Chrome through
  the DevTools protocol (throwaway profile). The Claude preview pane
  delivers **no animation frames while hidden**, so this is how the kit
  verifies itself. `--shots` renders every lane at the same instant and
  screenshots it — the fidelity check.
- `test_syncclock.js`, `test_servo.js` — Node simulation batteries for
  the two control modules (`js/syncclock.js` = the floor rule,
  `js/servo.js` = the frame servo). Run both after any change to either.
- Page modules: `js/stats.js` (frame cadence, load, long tasks) ·
  `js/lanes.js` (T2 + the theater) · `js/t_clock.js` (T3 + beacon) ·
  `js/t_video.js` (T4) · `js/t_device.js` (T5, T1) · `js/kit.js` (UI).
- Plain http on a LAN address is not a "secure context": the wake lock
  and the offline cache read "needs HTTPS" there. Everything else is
  measured. The Hetzner host will be HTTPS.
