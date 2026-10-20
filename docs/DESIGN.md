# DESIGN — the performance system (phase 3 ARCHITECTURE, day 45)

> **What this is.** How the system is built to meet `docs/REQUIREMENTS.md`
> (AR-1…AR-71, frozen D97). Every section names the AR lines it serves. §12 lists
> the alternatives considered and rejected; §13 replays every scenario through the
> design; §14 names the risk spikes to prototype first. Composer review = 3c.
>
> Status: **APPROVED — composer: "Approved" (day 45, 2026-10-20) → D98.** Phase 4
> PLAN enumerates the build chunks from §11 and §14.

---

## 0 · In one paragraph

One small Node server on one Hetzner box holds every piece's content, every
ensemble's registry, the rooms, and the clock. One web page is the whole stand: the
same page is a player's part, the leader's part with the strip, the conductor's
remote, the big display, and the study score, chosen by the link that opened it
and the mode the leader has set. The page keeps everything it needs on the device,
so alone it needs nothing; in a room it listens for one small state message and
keeps its own clock honest with the floor rule already measured in the kit. In
rehearsal the part is drawn live by the notation engine with its overlay fixed to
run on the GPU; in concert the stand plays a video of the part rendered by the
exporter, with the player's marks drawn over it. Everything the leader does is one
tap on a strip above their own part.

---

## 1 · The parts of the system

| part | what it is | serves |
|---|---|---|
| **THE SERVER** | one Node process (Socket.IO + static files): the registry · the rooms · the clock service · the state broadcast · the videos · rate limiting · the admin API | AR-1, 2, 5, 54, 55, 57 |
| **THE STAND** | one web page, installable (add to home screen): shell · room client + floor clock · transport · the live renderer (A2) · the video renderer (C) · the part view · the menu · the dot · the strip · annotations · the study score · the service worker | AR-3…AR-53 |
| **THE REMOTE / DISPLAY** | the same page opened by the gatekeeper's link; role = remote, or display via "show the score here" | AR-6, 31, 32 |
| **THE ADMIN PAGE** | the composer's page on the same server: new ensemble · pieces · versions · the gatekeeper link | AR-1, 7 |
| **THE CONTENT PIPELINE** | per piece, offline: the IR → part views · per-part videos via the exporter · rehearsal letters authored · the piece registered on the server | AR-8, 51, 69 |
| **THE TEST KIT** | kept as is; the seven gates run through it | §K |

The piece-independence rule (AR-60): the server and the stand know nothing about any
piece. A piece is a folder of content (IR, layout, videos, letters) and a room
namespace. Adding a piece = adding a folder and one registry entry.

---

## 2 · The data model (small, and most of it already exists)

- **Piece** — id · title · version · the IR + layout the stand draws from · the
  rehearsal letters (score-time → label) · per-part video files (keyframe every
  second, ~5 s of lead-in before 0:00 baked in) · part names.
- **Ensemble** — id · name · piece + version · the gatekeeper token · the mode
  (ALONE / REHEARSAL / CONCERT) · the part rows.
- **Part row** — part id · optional player name · **one player token per row**
  (doubling = two rows on the same part) · the leader tick (at most one row).
- **Token** — a long random string in the link (`/s/<token>`). A token is a player
  (identity, AR-4) or a gatekeeper. Reissue = a new token, the old one revoked
  (AR-5). Nothing else identifies anyone.
- **Room state** — one tuple per room: `(anchorServerTime, anchorScoreTime, rate,
  playing)` + the mode + the member list. Rooms: the ensemble's standing room (one
  per ensemble, durable) and sectionals (live only: a member set and a tuple; gone
  when empty).
- **Marks** — `(playerToken, view, scoreTime, stroke)`; view = `part` or `score`;
  a stroke = points in score-time × staff-relative y (AR-38). Stored on the server
  per token; mirrored in the device's local store; synced quietly.
- **Calibration record** — local only: the clock samples and the fitted rate for
  this device against this server, persisted (AR-43).
- **Readiness** — per stand, reported: video present · calibrated (AR-14, 63).

Persistence on the server: the registry and the marks as JSON files (as piece #1
did; a few kilobytes per ensemble). No database.

---

## 3 · The protocol (the whole vocabulary)

Every message is small; the network carries changes only, never frames (AR-45).

| from → to | message | who may send |
|---|---|---|
| stand → server | `hello(token)` → `welcome(role, ensemble, part, mode, roomState, letters)` | anyone with a token |
| stand ↔ server | `ping(t0)` → `pong(t0, ts)` — the clock samples | every stand, a few a second at first, then slower |
| leader → server → all | `state(tuple)` — play · stop · jump · speed · again, all as one new tuple | the leader token (ensemble room); any member (a sectional) |
| leader → server → all | `mode(ALONE / REHEARSAL / CONCERT)` | the leader or gatekeeper token |
| leader → server → all | `resync` — re-broadcast the tuple with a fresh anchor; stands slew to it | the leader token; live during play |
| stand → server → all | `sectional.start / join / leave` → `rooms(list)` | any player |
| stand → server | `ready(video, calibrated)` → the leader's count | every stand |
| stand ↔ server | `marks.put / marks.get` | the owning token |
| remote → server | `display.show(partIndex | null)` — the zoom for the display | the gatekeeper token |
| admin → server | `ensemble.create / parts.set / token.reissue / piece.register` | the admin key only |

Authority (AR-10, 13): in the ensemble room only the leader token's `state` is
accepted; in a sectional any member's is (last wins). A player's menu "jump" never
leaves the device in the ensemble room — it moves that stand alone while the room
is stopped (AR-11, 12).

---

## 4 · The clock — the kit's floor clock, unchanged, plus persistence

- `testkit/js/syncclock.js` (v3, 19/19 on the measured networks, 0.0–2.4 ms honest
  on the real iPad) becomes the stand's clock module **as is** (AR-41, 42).
- **New: persistence across sleeps (AR-43).** Samples and the fitted rate are
  written to the device's local store as they arrive; on return the module reloads
  them, re-verifies the level with a few fresh samples, and keeps accumulating.
  The device clock runs through a suspend, so old and new samples fit one line.
  **Gate E-2 proves it before the build relies on it.** A page reload is the same
  path.
- The server's clock is raw monotonic, never slewed (kit finding).
- Under ALONE (AR-16) the clock module idles; when the mode becomes REHEARSAL it
  starts sampling at once, and the stand is usable immediately — calibration is
  margin, not a precondition (AR-63).

---

## 5 · The transport — one tuple, two readers

- The room's tuple `(anchorServerTime, anchorScoreTime, rate, playing)` is the only
  transport state. Every command is a new tuple; stands compute
  `scoreTime = anchorScoreTime + (serverNow − anchorServerTime) × rate`.
- **The lead-in (AR-33):** a jump to letter E sets `anchorScoreTime = tE − 5`,
  stopped; PLAY sets `anchorServerTime = T` (1–2 s ahead) with `playing = true`
  (AR-44). The top of the piece is the same with `t0 − 5`.
- **The live reader:** `notation/lib/transport.js` already takes an injectable
  timebase (`opts.timebase.now()`); the room client supplies `serverNow` converted
  by the floor clock. Nothing in the notation engine changes to follow a room.
- **The video reader:** `testkit/js/servo.js` as is — feed-forward of the known
  rate, the lead steered to the frame band's centre; Safari's pre-roll + aimed
  seeks from 3.8 (AR-45, 48).
- Speeds (AR-34) are `rate`; the video uses `playbackRate` only under REHEARSAL if
  video is ever used there (it is not: AR-50) — in concert `rate` is 1.

---

## 6 · The stand's modes — the state machine (the heart of the user-facing design)

The stand is always in exactly one of these states. The leader's three-way switch
(AR-9) and the dot (AR-14) move it; the room's `playing` flag splits two of them.

| state | how a stand gets here | what it draws | two-finger tap | swipes · one-finger tap | menu · dot | the strip (leader only) |
|---|---|---|---|---|---|---|
| **ALONE** | the default; mode = ALONE, or not online | live (A2), own part | local play / stop | free | all five items · dot shows "alone" | play is local; the switch is live |
| **REHEARSAL · stopped** | mode = REHEARSAL, room stopped | live, own part | local play (own stand only) | free | all five · dot = room choice | play/stop · letters · speeds · time · again · switch · ready count |
| **REHEARSAL · playing** | the room's tuple says playing | live, following the room | nothing | nothing (snapped) | nothing | STOP · RESYNC · position |
| **SECTIONAL · stopped / playing** | joined via the dot | live, own part, following the sectional | the sectional's play/stop (last wins) | free while stopped | all five · dot = leave | n/a (headless) |
| **CONCERT · stopped** | mode = CONCERT | **video** at the start, marks as set | nothing | nothing | nothing (dot passive) | play · letters · switch · ready count |
| **CONCERT · playing** | the tuple says playing | video, following | nothing | nothing | nothing | STOP · RESYNC · position |

Rules carried by the machine: the room playing ends annotation mode and returns a
stand on the full score to its part (AR-37, 21) · a stand on the study score is
`stopped`-only · local play while stopped never touches the room (AR-12) · entering
CONCERT loads the video (AR-53) and freezes the marks setting (AR-39).

Design-time answers to REQUIREMENTS §L: **REHEARSAL falls back to ALONE when the
room has been empty for 30 minutes** (a leader who forgets costs nothing) · **two
leader devices** (the gatekeeper's remote and the ticked leader's strip) are both
authoritative, last command wins, both show the current mode · **a stand with no
video on the night** fetches it; if it cannot, it plays live (A2) and its dot stays
amber — never refused (AR-63).

---

## 7 · The renderers

**A2 — the live stand (AR-50).** The notation engine as it is, with the per-frame
overlay rebuild replaced: the overlay's DOM is built once per page; per frame only
the movers' transforms change; every mover is its own GPU layer
(`will-change: transform`). The exporter's string path (`frameSvg`) is untouched,
so print and video stay byte-identical to today. The part view is `renderSection`
with `frameParts = [part]`; the full score is the same call with all parts. The
Fire's 99.4 % frames-on-time is the bar.

**C — the concert stand (AR-51).** A `<video>` element per part, rendered by
`tools/export_video.js --parts N` with a keyframe every second and the 5-s lead-in
baked in; the servo keeps it on the room clock; **the marks layer** is an SVG over
the video positioned by the same score-time → page/x mapping the live renderer
uses (the layout is data the stand has), so a mark drawn in rehearsal lands on the
same note in concert. One file per part serves every device, scaled by the
browser.

**The study score and the fixed zoom (AR-21).** The full-score page through the
notation workshop's existing zoom (`zoomCfg`): double scale, repaginated, the same
swipe vocabulary, vertical swipes for the lines that do not fit.

---

## 8 · The door, concretely (AR-1…AR-8)

- **Links:** `https://<host>/s/<token>`. The server answers with the stand page and
  the role the token carries. Nothing else is in the URL.
- **The ensemble page** (gatekeeper token): rows from the piece's part list; name
  box; the row's link; COPY (clipboard); SHARE (the Web Share API → the device's
  share sheet; falls back to copy); "add another player" (a new row on the same
  part, a new token); "new link" (rotate the token); "print the QR sheet" (a print
  stylesheet: every row's QR + label on one page); the leader tick; the "Rehearsal"
  button (the remote).
- **Add to Home Screen:** a web manifest + a one-time hint on first open; on the
  home screen the page runs standalone, keeps its storage, and holds the wake lock.
- **The admin page** (admin key, the composer only): new ensemble (name · piece ·
  version) → the gatekeeper link; the list of ensembles × pieces; register a piece
  (point at its content folder).
- **Rate limiting:** per IP on `hello` and `sectional.start`; a revoked token is
  refused with a plain message ("ask your leader for a new link").

---

## 9 · Hosting and the spare (AR-55, 58, 59)

- As piece #1 ran: Node + PM2 behind nginx with Let's Encrypt on the Hetzner VPS;
  `node_modules` never in git (the April incident); one `deploy.sh` (pull → install
  → restart → health check); `/health`.
- **The spare** = the same repository run on a laptop (`node server.js --spare`):
  it serves the stand page and the piece content from disk, accepts the ensemble's
  tokens from a registry snapshot the leader downloads to the laptop at sound check
  (one button on the remote: "save a spare copy"), and runs the clock. Stands reach
  it by the QR the spare prints (its hotspot address) — the podium shows it. Nothing
  else differs; the stands do not know they switched.

---

## 10 · The offline floor and the video on the device (AR-53, 56)

- A service worker caches the stand page, the piece's IR and layout, the letters,
  and the fonts at first open; marks live in the local store and sync when online.
- The per-part video is fetched at first open with a progress bar, stored in the
  Cache API, and verified present on every open; absent → re-fetched with the bar
  (never a frozen stand). **Gate E-3 measures the size and the eviction behaviour
  (browser tab vs home-screen app).**

---

## 11 · The build surfaces, named (for the PLAN)

`server/` (new: registry · rooms · clock · state · admin) · `stand/` (new: shell ·
room client · modes · strip · dot · menu · annotations · study score · service
worker) reusing `notation/lib/*` (render · transport · animobj · layout) and
`testkit/js/{syncclock,servo}.js` as modules · `tools/export_video.js --parts`
(exists) · `content/<piece>/` (per piece) · the kit, kept.

---

## 12 · Alternatives considered and rejected

- **A framework room server (Colyseus-class) / WebRTC** — rejected at D89: the same
  distributed-timing problem with someone else's abstractions between us and the
  bug; WebRTC adds signalling and NAT for a benefit the fixed-timeline star already
  gives.
- **A database** — rejected: the registry is kilobytes; JSON files, as piece #1,
  with a daily copy in the deploy script.
- **Accounts / sessions / JWT** — rejected at D90: the token in the link is the
  identity; nothing to log into.
- **Rendering the part live in concert too** — rejected at D89 by measurement: the
  Fire loses 31 % of frames with today's engine; video is smooth by construction
  and network-optional by construction.
- **Video in rehearsal too** — rejected: jumps seek (71 ms iPad / 526 ms Fire, and
  Safari lands ~150 ms off), speeds need `playbackRate`, and annotation on a moving
  live page is the rehearsal case; A2 measured 99.4 % on the Fire.
- **A separate "performance mode" ceremony** — rejected at D87/D95: one switch.
- **Per-frame or periodic sync traffic** — rejected at D89: piece #1's self-jitter;
  the tuple is the state, corrections early and tiny.
- **A native app** — rejected throughout: browsers-as-stands are concert-proven
  (SmartVox); zero install; one codebase for every device (AR-23).
- **Stands syncing to each other (peer)** — rejected: no peer contagion (floor rule).
- **Marks stored by page coordinates** — rejected at ENS it. 3: they would not
  survive a re-render or the video.
- **A join tap for every player** — rejected at D96: ALONE is the default and the
  room exists only under REHEARSAL / CONCERT, so nobody taps anything.

---

## 13 · Scenario replay (3b) — every scenario through the design

- **Full-ensemble rehearsal (D82):** players tap icons → `hello` → ALONE, then the
  leader flips REHEARSAL → every stand joins the standing room (AR-9); the leader
  taps E → `state(tE − 5, stopped)` → every stand snaps (AR-11); PLAY → `state(T,
  playing)` → stands follow on the floor clock; a stand browsing while stopped plays
  locally via `transport.js` with the local timebase (AR-12); speeds = `rate`;
  the display shows the full score and zooms on `display.show` (AR-32). **Holds.**
- **Sectional (D85):** a player taps the dot → `sectional.start` → a live room with
  its own tuple; others see it in the dot's list and join; any member's tuple
  wins; the room dies when its member set empties; nothing stored (AR-13). **Holds.**
- **Alone (D86):** no server reachable → the service worker serves the page; the
  transport runs on the local timebase; marks go to the local store and sync later
  (AR-16, 56). **Holds.**
- **The performance (D87, D95):** CONCERT → the video loads, the stand goes
  passive; one pass at sound check; PLAY → one `state`; after that the stands run
  the servo on their calibrated clocks — the server may die (AR-44); RESYNC re-
  anchors live; STOP · letter · PLAY restarts (AR-64); the spare serves the same
  tokens from its snapshot (AR-58). **Holds.**
- **The door (D90):** admin → ensemble → gatekeeper link → the ensemble page →
  per-row tokens → share → the player's `hello` → the part (AR-1…8). **Holds.**
- **The Tuesday (D94), all thirteen:** each step is a row of §6 or a message of
  §3; the pianist's "show me 4:10" is local play while stopped; "next day" is
  ALONE with the marks already local. **Holds.**
- **Concert night (D95):** sound check = `hello` + clock sampling + the video check
  + CONCERT + one pass; the PDF app suspends the page — on return the clock
  reloads its samples (AR-43, gate E-2) and `hello` reconnects (gate E-7); "7 of
  7" from `ready`; nod; PLAY. **Holds, pending E-2 and E-7.**
- **Mixed devices (AR-23, 47):** every stand estimates against the server alone;
  the beacon's 7.7 ms is the bar; the Fire's A2 and Safari's video path are both
  measured. **Holds.**

---

## 14 · Risk spikes (3d) — prototype these first, each a day or less

1. **The A2 refactor on the real page** — retain the overlay, GPU-layer the movers,
   prove byte-identical output against the exporter and the kit's 99.4 % on the
   Fire. (The whole live stand rests on it.)
2. **Marks over the video** — draw a mark in rehearsal (live page), open the
   concert video, assert the mark sits on the same note at three places in the
   piece.
3. **Calibration across sleeps** — gate E-2 on the real iPad, including a page
   reload and a 30-minute suspend.
4. **The home-screen app on the iPad** — manifest + service worker + the Cache
   API holding a 100 MB video + the wake lock over HTTPS, all together (gates E-3,
   E-4, E-7).
5. **ALONE → REHEARSAL auto-join** — a stand idling under ALONE must join within
   a second of the leader's flip, including after a sleep.
6. **The share sheet and the QR sheet on the iPad** — the Web Share API from a
   home-screen page; the print stylesheet.
7. **The chaos test** — gate E-5 on the real server before any ensemble.
