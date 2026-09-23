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

### C's sync risk & backstops *(added day 42 — the composer's question: guesstimate of falling out of sync; backstops like periodic timecode, or strictly unnecessary?)*

**Where desync can come from (four sources, two that matter):**

1. **Start alignment at GO** — clock-offset error ≤ RTT/2 (±5–25 ms on
   venue wifi, ±1–5 ms LAN — ESTIMATE) plus decoder spin-up. One-time,
   and the servo (below) washes it out within seconds.
2. **Local clock drift during the piece** — THE real accumulator. Device
   crystals run ±20–50 ppm off true (ESTIMATE; T3 measures the zoo).
   Worst PAIR of stands, pure free-run, 12.5 min: **±30–75 ms apart by
   the final bars** — and the final movement is the phase-critical one
   (composed offsets are 80–120 ms steps; error must stay ≥5× under
   that grid, i.e. ≤ ~15–25 ms).
3. **The video's own motor** — a `<video>` element's playback clock is
   not the system clock; unsupervised it wanders. **Fully eliminated by
   backstop 1** (the servo watches the displayed frame, not the motor).
4. **Frame quantization** — ±8–17 ms at 60/30 fps. The same floor the
   live renderer has on a 60 Hz screen. Render parts at 60 fps.

**The backstops (three, all invisible — no periodic snap needed):**

- **B1 — the frame servo (always on, network or not):** per displayed
  frame (`requestVideoFrameCallback`, fallback: `currentTime` polling),
  compare shown media time against the piece clock; trim `playbackRate`
  by ≤1–2% until closed, then 1.0. Closes ~10–20 ms of error per second
  of nudging; on a moving score a 1% speed trim is imperceptible. This
  is the live-edge technique every commercial player uses. **Seeks are
  never used for correction** (a seek hitches); seeks are only for
  jumps (rehearsal navigation).
- **B2 — quiet continuous re-sync while any network exists:** the
  NTP-style estimator keeps pinging every few seconds; refined offsets
  feed the same servo. This is the composer's "timecode every 10–30 s"
  instinct — made **continuous and slewed instead of periodic and
  snapped**. Holds cross-stand error at ±5–15 ms (wifi) / ±1–5 ms (LAN)
  for the whole show (ESTIMATE; T3/T4 measure). If wifi dies mid-show,
  nothing stops — error is frozen at its held value and then grows only
  a few ms per minute.
- **B3 — offline hardening:** (i) **pre-show self-calibration** — during
  warm-up each stand measures its own clock's ppm against the server for
  ~10 min, then compensates that known bias during free-run → end-of-
  piece residual ~±5–15 ms with NO network after GO (ESTIMATE); (ii) the
  **podium's one resync gesture** (D87 rung 3) remains the human
  override if the con ever perceives smear.

**The reframe that matters for V1:** the live renderer (A) free-runs on
the SAME device clocks — source 2 is identical for both. Video adds only
source 3, which B1 removes entirely. **After the servo, C is no riskier
than A for sync — and strictly smoother in drawing.** The residual risk
for BOTH renderers is local clock quality: T3 measures it per device;
B3(i) compensates it.

**Bottom line: backstops yes — but as a continuous invisible servo, not
10-second timecode snaps.** Normal night (network up): ±5–15 ms all
show. Worst night (network gone at GO, no calibration): ±30–75 ms by the
end — audible in the phase material, which is why B1+B3 are in the spec
rather than optional.

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

### Why the servo can't reproduce piece #1's jitter — the autopsy *(added day 42; composer: "the syncing engine just had additional consequences… introduced its own jitter — will this continuous sync cause its own?")*

Read from piece #1's own code + IMPLEMENTATION_PROGRESS (grounded, not
recalled). What #1's sync ecosystem actually did:

- **Periodic traffic all show long, all on the client main thread:**
  `heartbeat` every **500 ms** · `scorePositionCheck` every **3 s** ·
  server loop-check every **200 ms** · client UI polls at **200 ms** ·
  client ping every 5 s — beside a **per-frame canvas redraw** through a
  subscriber AnimationEngine (the same per-frame-rebuild class of sin as
  our `innerHTML` finding, plus message handling contending with it).
- **Corrections were LATE AND BIG:** deadband **50 ms**, then the error
  absorbed over **30 frames (~0.5 s)** — arithmetic from its own
  numbers: ≈ a **10% speed change for half a second**, right at the
  visible edge. So corrections only fired once drift was already large,
  and then they were perceivable events.
- **Verified on localhost** — which hides all network noise; real-wifi
  behavior was never the tested case.

**The inversion this design makes — the control law: correct EARLY and
TINY, never late and big.**

- Deadband small (~5–10 ms), trims capped at **≤1–2%** — the error is
  never allowed to grow to visible size, so no correction is ever a
  visible event. (#1: 10% for 0.5 s; here: 1% for a few seconds.)
- **Nothing periodic rides the wire during the show.** The tuple changes
  only on commands; the client's few-second ping is ~100 bytes and its
  handler is a subtraction. No heartbeat spam (liveness is
  socket-level), no position pushes, and looping is dead by ruling —
  #1's 200 ms loop checker has no equivalent here.
- **The correction path writes one number** (a rate), decoupled from
  drawing — which for the video stand is a hardware decoder JS cannot
  stutter, and for renderer A is a retained overlay, not a per-frame
  rebuild.
- **Observability instead of trust:** every trim is logged; T4 measures
  the closed-loop residual on real wifi and real devices. Hunting (a
  mis-tuned servo oscillating on measurement noise — the one real way a
  servo makes its own jitter) shows up as data in the kit, not as a
  discovery on stage.
- **Residual risks, named:** servo mis-tune → hunting (caught by T4 +
  the trim log; the filter is min-RTT best-of-N with a sanity clamp) ·
  pathological networks (clamped; and gross error is never trim-fixed —
  rehearsal may snap, performance never) · and per D87 the concert can
  run **armed-but-silent** (auto-trims off entirely; only the podium
  gesture corrects) — the strictest posture, left as a HARDEN dial.

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
  accuracy vs clock · `playbackRate` nudge response · **frame-servo
  residual** (B1 closed-loop error over a 10-min run, with and without
  network) · `requestVideoFrameCallback` support (matters only for C).
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
