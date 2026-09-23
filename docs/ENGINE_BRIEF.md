# ENGINE BRIEF — renderer · network · hosting · the test kit

> **Status: DELIVERED for verdicts** (day 42, 2026-09-23). Chunk **3.5 ►** of
> `PERFORMANCE_SCORE_ORDER.md`; charter there (§ THE ENGINE CHUNK) and in
> ARCHITECTURE § PERF iteration 2. Serves ALL pieces (D88 — one module
> system; Tempus deploys first). **Done =** the verdict sheet (§6) answered →
> engineering requirements frozen for HARDEN.
> Numbers marked **ESTIMATE** are unmeasured; claims marked **KIT** are what
> the test kit exists to measure. Per AI_METHODOLOGY, nothing here is a
> confidence claim until measured.

---

## 0 · The shape, in one paragraph

The jitter has a specific, fixable address (§1) — the fix keeps the current
engine and is cheap. The recommendation (§2): **fix the live renderer in
place for every interactive module (IND · SEC · ENS)**, and give the
**performance stand pre-rendered per-part video** — smoothness and
network-independence by construction, using the exporter that already
proved frame-exactness. Canvas/WebGL (PixiJS) stays on the bench unless the
kit's measurements say the in-place fix isn't enough. Network (§3): one
small Socket.IO server of our own, hardening piece #1's proven protocol —
no game framework, no WebRTC. Hosting (§4): one always-on HTTPS host
serving every piece's rooms; one question only the composer can answer.
The test kit (§5) turns all of §1–§3's claims into hard data on cheap
devices before anything is frozen.

---

## 1 · Why the animation jitters today — a diagnosis with an address

Read from the code this sitting (`notation/app/notation.html`,
`drawOverlayFrame` / `animLoop`), not guessed:

- **What happens every frame (60×/s):** the animation overlay — cursor,
  GC balls, bouncing balls, the tube, every animated object — is built as
  an **SVG string** (`NotationAnimObj.frameSvg`, sometimes twice: solo
  group + dimmed group) and installed with **`ov.innerHTML = svg`**.
  That is: string assembly → HTML parse → teardown and recreation of the
  whole overlay DOM → style recalc → layout → paint, **on the main
  thread, every 16.7 ms** — plus a stream of discarded strings and nodes
  that forces garbage-collection pauses. Any GC pause, style recalc, or
  event work that overruns the frame budget = a visible stutter.
- **What is already RIGHT (and stays):** the static page sheet is drawn
  once and never touched per frame — only the overlay churns. All motion
  comes from **pure time functions** (`test_animobj` asserts no clock
  reads inside the animation source — drawing at time t is deterministic;
  the V4 exporter steps the same function). Pages are **page-mode with
  hard-cut turns**, not continuous scroll — so the moving set is a
  handful of small elements, not a scrolling canvas.
- **Severity on cheap devices: KIT** (T1/T2 below). On a strong desktop
  the churn mostly fits the budget — which is exactly "fine for
  composing, subpar for performance."

**Why this is good news:** the engine's architecture was accidentally
built for the fix. Pure time functions + a separated static sheet means
the overlay can go **retained-mode** with no redesign.

---

## 2 · Renderer candidates

**License on record (D87):** the performance stand's renderer may differ
from the composer/presentation scores. The choice is **per-module**.

### A — Fix in place: retained overlay + compositor transforms *(recommended for IND · SEC · ENS)*

- **A1 — retained overlay:** build the overlay's DOM nodes **once per
  page**; per frame, only update the attributes/transforms of the few
  elements that move (cursor x, ball cx/cy…). No string building, no
  parsing, no node churn, near-zero garbage. Same time functions;
  `frameSvg` stays as-is for the exporter (string mode) — the live path
  gets a retained twin.
- **A2 — compositor transforms:** movers become individual layers
  (`will-change: transform`), moved per frame via `style.transform` —
  style-only writes, no layout, composited on the GPU. A main-thread
  stall then shows as a brief cursor freeze, not whole-page jank.
- Effort: **small-to-medium refactor**, one codebase kept, every piece
  inherits it (D88). Interactivity (zoom taps, annotation, jumps) keeps
  working everywhere.
- Ceiling on a $200 Chromebook: high, but **KIT** (T2) says, not me.

### B — Canvas/WebGL, PixiJS-class *(the escalation — bench unless measured in)*

- The full game-engine answer: score rasterized to GPU textures, sprites
  for movers, optionally OffscreenCanvas in a worker (immune to
  main-thread stalls).
- Cost: a **second live renderer** — either re-implement engraving in
  draw calls, or rasterize the existing SVG pages to textures (the
  cheaper middle path). Ongoing divergence from the notation engine.
- Only worth it if A measures short of the bar on the device zoo. **KIT**
  (T2 carries an A/B lane so the comparison is data, not taste).

### C — Pre-rendered per-part video *(recommended for the PERF stand)*

- Render each part's stand view to a video file with the **already-proven
  frame-exact exporter** (V-CUT lineage; the stack renders any part
  subset — `frameParts`). The concert stand is a `<video>` element:
  **play on GO, seek/nudge by clock**.
- **Smoothness by construction** — hardware video decode is the one
  rendering path every cheap device does perfectly. **Network-optional by
  construction** — the file IS the fixed timeline (D87's star), the local
  clock drives it; drift correction = tiny `playbackRate` nudge or a
  seek, the solved commercial live-edge technique. Sync precision: **KIT**
  (T4).
- Fits PERF exactly because PERF stands are **follow-only** (D87 — no
  interaction during the show). Speed presets aren't needed in concert;
  hard-cut page turns reproduce exactly.
- Costs: content changes need a re-render batch (automatable; rendering
  is already scripted) · a ~12-min 1080p part ≈ **150–400 MB (ESTIMATE —
  the build measures; codec/bitrate tunable)**, preloaded and cached by
  the service worker before the show · live annotation on the moving
  score doesn't apply in concert (rehearsal uses A).

### The recommendation, as a sentence

**A for every interactive module · C for the concert stand · B held as
the measured fallback — and the kit's device data confirms or overturns
this before HARDEN freezes anything.**

---

## 3 · Network: sync model, transport, codebase

### The sync model (the heart — and it's small)

- **State-tuple dead-reckoning.** The room's whole transport state is one
  tuple: `(anchorServerTime, anchorScoreTime, rate)`. Every command —
  play, stop, speed, jump — is just a new tuple, broadcast once. Each
  stand renders `scoreTime = anchorScoreTime + (estimatedServerNow −
  anchorServerTime) × rate`. **No per-frame network traffic ever** — the
  network carries state *changes* only. (This is piece #1's model made
  explicit; it is also how games and Link-class systems think.)
- **Clock estimation, NTP-style:** each client pings (t0 → server ts →
  t1), offset = ts − (t0+t1)/2, error ≤ RTT/2; keep the best-of-N
  samples, refine quietly in the background forever.
- **Corrections SLEW, never jump:** cap visible correction rate (e.g.
  ~2 ms per second — ESTIMATE, tune by ear) so a resync is invisible. In
  PERF, corrections are **gated behind the one podium gesture** (D87).
- **After GO, offline by design:** stands finish the piece on local
  clocks. Device drift ~20 ppm ≈ **15 ms over 750 s (ESTIMATE — KIT T3
  measures the real zoo)**, far under ensemble threshold.
- **Offline floor & wake lock:** PWA service worker caches app + score
  (+ part video on PERF stands) — a loaded stand needs nothing further
  (IND is fully serverless, already ruled D86). Screen Wake Lock API +
  player guidance; support per device: **KIT** (T5).

### Transport: WebSocket, and nothing fancier

- **Socket.IO v4** over HTTPS/WSS: auto-reconnect with backoff, rooms,
  wide compatibility — and it is piece #1's own stack, so the protocol
  hardening carries familiar ground.
- **WebRTC-LAN: REJECTED.** Peer-to-peer buys independence from the
  internet mid-show — but the fixed-timeline star already bought that for
  free (after GO the network is optional). WebRTC adds signaling, NAT
  quirks, and a second transport to harden. Robustness here comes from
  needing *less* network, not more technology.
- **No-internet venue fallback (redundancy rung, not a transport):** the
  server is one small Node process — the hot-spare laptop can run it on a
  venue LAN / phone hotspot, and the portal QR just points there.
  Pre-GO joining works over anything; after GO nothing is needed.

### Codebase: our own small server, piece #1 hardened — Colyseus REJECTED

- Our real state is tiny: live rooms (who's in them) + one transport
  tuple + quiet annotation sync. The genuinely hard 10% — clock
  discipline, slew, drift observability — **no framework solves anyway**.
- Colyseus-class frameworks solve authoritative *state replication* for
  games (schemas, patches, interpolation buffers) — the parts we don't
  have. Cost: framework surface, lock-in, learning tax. The composer's
  bar is *"lean simple to use… robust… the main functions really well"* —
  that is a few hundred lines of our own Socket.IO server in this repo
  (greenfield here; #1 is the reference), not a framework.
- What "harden #1's protocol" concretely means: keep its room/clock
  model · delete the ceremony (D87) · add best-of-N clock sampling, slew
  correction, reconnect-resume, drift logging (so problems are visible in
  data, not vibes).

---

## 4 · Hosting *(new in the charter per D88 — remote ensembles self-serve)*

- **Requirement:** HTTPS (wake lock + PWA + camera-QR joining all want
  it) · WebSocket · always-on during rehearsal windows · tiny load (a
  room is ~10 clients exchanging a few messages a minute) · **one
  deployment serves EVERY piece** (the system is piece-independent;
  a piece is content + a room namespace, e.g. `/tempus`, `/tubas`).
- **Options:** (a) wherever piece #1 already lives — it runs Socket.IO
  at justinwenloyang.com today, so a Node-capable home may already
  exist; (b) a ~$5/mo VPS (Hetzner/DigitalOcean class) with Caddy +
  Let's Encrypt; (c) a PaaS (Render/Railway/Fly) on an always-on plan —
  avoid free tiers that sleep (a cold start exactly when an ensemble
  gathers is the one failure mode this must never have).
- **Recommendation:** (a) if piece #1's host can run this server
  alongside; otherwise (b). Either way: one process, all pieces.
- **The question only the composer can answer (V3):** what hosts piece
  #1 today — and is it comfortable being the shared home?

---

## 5 · THE TEST KIT — spec (composer-runnable; Opus builds it)

One page at one URL. Open it on a machine, tap **RUN**, get an on-screen
**device report card** + a copyable JSON blob. A tiny companion server
(one Node file) is needed only for T3. Every claim in §1–§3 that matters
lands here as a number.

- **T1 — rAF health:** N-second run → inter-frame-delta histogram ·
  dropped-frame % (delta > 1.5× budget) · long-task list
  (PerformanceObserver). Run idle and under synthetic load.
- **T2 — renderer shoot-out on a REAL page:** the same exported score
  page animated four ways — A0 current-style innerHTML redraw (the
  baseline that indicts §1) · A1/A2 retained + compositor · B canvas
  sprite scroll · C `<video>` of the same content — each instrumented by
  T1. The verdict data for §2.
- **T3 — cross-device clock drift:** each device runs the NTP-style
  estimator against the kit server and logs offset + drift-rate over
  10 min (the real ppm of the real zoo). **Plus the zero-rig visual
  check:** both screens flash a shared-clock beacon; film them side by
  side with a phone in slow-mo; count frames between flashes — hard
  data with no lab.
- **T4 — video sync behavior:** seek latency histogram · `currentTime`
  accuracy vs clock · `playbackRate` nudge response (matters only for C).
- **T5 — device report card:** wake-lock support · screen/DPR · codec
  support · OffscreenCanvas · storage quota (for cached video) — one
  glance per device.
- **The zoo (guidance, not purchases):** one 2018-class iPad (Safari) ·
  one cheap Chromebook · one mid Android tablet · one Windows laptop —
  plus any player-owned device at hand. Players bring their own stands
  (SmartVox model: the URL is the stand), so the kit doubles later as a
  device-acceptance check.

---

## 6 · THE VERDICT SHEET (what closes this chunk)

- **V1 — renderer strategy:** adopt **A (fix-in-place) for IND/SEC/ENS +
  C (per-part video) for the PERF stand, B benched as measured
  fallback** — with the kit's data as the confirm/overturn gate?
- **V2 — network:** adopt **our own small Socket.IO server hardening
  piece #1's protocol; state-tuple dead-reckoning; slew-only
  corrections; no Colyseus; no WebRTC**?
- **V3 — hosting:** what hosts piece #1 today, and does the shared
  always-on home live there (a) or on a small VPS (b)?
- **V4 — the kit:** approve the §5 spec for the **Opus build** as the
  next executable step?

## 7 · What freezes for HARDEN once verdicted

Renderer-per-module map (V1) · sync model + transport + codebase (V2) ·
hosting posture (V3) · the kit as the empirical gate for: device jitter
ceiling, real drift ppm, video sync precision, wake-lock coverage — each
becoming an AR-N requirement with a measured number attached instead of
an ESTIMATE.
