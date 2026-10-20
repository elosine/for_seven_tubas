# REQUIREMENTS — the performance system, FROZEN (HARDEN, day 45)

> **What this is.** Every requirement of the rehearsal / performance system in one
> list, each with a stable ID (`AR-N`), a class, a state, the decision it comes from,
> and its why. Nothing here is new: every line is a ruling from `ARCHITECTURE.md`
> (phase 1 GATHER, D82–D96) or a measurement from `ENGINE_BRIEF.md` / `testkit/`.
> **IDs never change or move; a superseded line is struck, never deleted.**
> The empirical gates (§K) are measurements owed before the build commits to the
> line they guard. The adversarial pass (§L) is what breaks each scenario when it
> meets the others, and the line that answers it.
>
> **Key.** Class: **MUST** (the system is wrong without it) · **SHOULD** (first
> version, droppable under pressure) · **COULD** (parked; not in the first build).
> State: **DECIDED** (ruled, fixed) · **OPEN** (ruled in principle, a detail still
> owed — says by whom) · **EMPIRICAL** (bound to a measured number; the number is
> attached, or the gate that will attach it is named).
>
> Status: **FROZEN — composer: "Freeze" (day 45, 2026-10-20) → D97.** Phase 3
> ARCHITECTURE designs against these IDs. A change from here is an amendment:
> the old line struck, a new ID appended, the why recorded.

---

## A · THE DOOR — identity and the handout

- **AR-1 · MUST · DECIDED (D90)** — The composer is the sole admin: opens every
  ensemble (name · piece · version); no public sign-up anywhere. *Why:* no accounts,
  no spam bots; the composer already knows every ensemble that plays the music.
- **AR-2 · MUST · DECIDED (D90, D94)** — One gatekeeper link per ensemble, sent in an
  ordinary email. The ENSEMBLE PAGE lists the parts as the piece defines them; an
  optional name box per row; **one link + QR per PLAYER**; per row: copy · share ·
  "add another player" (doubling) · "new link" (reissue); a printable QR sheet. **No
  automatic email from the server.** *Why:* "like handing out paper parts"; the
  gatekeeper's habits unchanged; an email service would add deliverability and typing.
- **AR-3 · MUST · DECIDED (D90)** — The player taps the link → the part opens → a
  one-time "Add to Home Screen" hint → the icon IS the part. The same link re-opens
  it on any device. Nothing typed, ever. *Why:* zero steps; the paper part lives on
  the stand.
- **AR-4 · MUST · DECIDED (D90, D96)** — Identity = the link. Private marks follow
  the link; a new iPad recovers them by tapping the old email. Two players on one
  part = two links. *Why:* no accounts; doubling never merges marks.
- **AR-5 · MUST · DECIDED (D90)** — Links are OPEN (no passwords). A stray link is
  fixed by a one-tap REISSUE (the old link dies). Server-side rate limiting from day
  one. *Why:* "a rehearsal, not a bank account"; the typing must not return.
- **AR-6 · MUST · DECIDED (D94)** — The gatekeeper's link is an icon too. It opens
  on the REMOTE (the Players list behind a button; the list itself on the very first
  open). The gatekeeper ticks "leader" on one player's row to give that stand the
  strip (AR-30). *Why:* no email hunting on the night; one icon, one explanation.
- **AR-7 · SHOULD · DECIDED (D90)** — Versions follow the ensemble page: a re-tailored
  piece updates every icon on next open; nothing re-installed. *Why:* a web page,
  not a file.
- **AR-8 · MUST · DECIDED (D81)** — Pre-registration, no drop-ins; per-ensemble
  tailoring at composition time (parts and transpositions baked in); the conductor
  assigns parts "like handing out paper parts"; a change = a new link. The runtime
  never generates or transposes parts. *Why:* M1/M2 resolved upstream.

## B · ROOMS AND MODES

- **AR-9 · MUST · DECIDED (D96)** — The leader's switch is THREE-WAY: **ALONE**
  (default — every stand is its own; the strip's play is local) · **REHEARSAL**
  (stands join the ensemble's standing room by themselves and follow the strip) ·
  **CONCERT** (§I). Players click nothing. *Why:* home practice with the strip must
  not move every open stand; the standing room must cost players no tap.
- **AR-10 · MUST · DECIDED (D82, D94)** — ONE CENTRAL CONTROL in the ensemble room,
  for every ensemble, conducted or not: the strip or the remote plays, stops, jumps,
  sets speed; stands follow. No per-ensemble switch; no "everyone controls" in the
  ensemble room. *Why:* the composer's paper picture ("let's take E" → go); cleaner.
- **AR-11 · MUST · DECIDED (D82, D94)** — Stands always follow the room: when the
  room plays or jumps, every stand snaps at once (a letter tap jumps everyone
  BEFORE play); free browsing only while the room is stopped. *Why:* players flip
  themselves or are brought along; never a stand left behind.
- **AR-12 · MUST · DECIDED (D82)** — LOCAL PLAY: a stand plays locally (its own
  part only) whenever the room is stopped; the moment the room plays, it follows.
  *Why:* "piano, show me 4:10" — she starts herself; the leader does nothing.
- **AR-13 · MUST · DECIDED (D85, D96)** — SECTIONALS: live rooms only — anyone
  starts one, joiners self-select, auto-labelled from members, die when empty,
  nothing stored; HEADLESS (every member equal, last command wins, no leader);
  inside a sectional your tap moves the group — practise alone = leave. *Why:* "the
  room is who's in it"; piece #1's leader-passing was the pain.
- **AR-14 · MUST · DECIDED (D96)** — THE DOT on every stand = the room choice: tap
  → Ensemble ✓ · any sectional live now · Start a sectional · Leave (only inside a
  sectional). Not a menu item. Passive under CONCERT. The dot's colour = readiness
  (green: video on the device AND clock calibrated). *Why:* the icon opens with zero
  clicks; the room choice needs one small home.
- **AR-15 · MUST · DECIDED (D85)** — One room at a time per stand.
- **AR-16 · MUST · DECIDED (D86, D96)** — ALONE is serverless: the offline floor IS
  the module. When online, a light connection only — quiet mark sync, and to join
  by itself the moment the leader flips REHEARSAL. *Why:* IND needs zero room
  infrastructure.
- **AR-17 · SHOULD · DECIDED (D85)** — The roster is a read-only view of the
  registry (the ensemble page); sectionals never build or edit it.

## C · THE STAND — what it shows

- **AR-18 · MUST · DECIDED (D85, D91)** — Own part only, everywhere; a live VIEW of
  the score data (no pre-built PDFs); the rehearsal number and the time in a
  corner; no cue strip (deferred — the animation keeps position). *Why:* practice
  as paper parts work; the first build stays small.
- **AR-19 · MUST · DECIDED (D86)** — Paged: one screenful per swipe while browsing;
  playing = the page follows the cursor.
- **AR-20 · MUST · OPEN (by eye, the composer, in the build — D91)** — The part's
  size / the screen's time span: chosen by eye on the real iPad; a design sitting
  with the strip (AR-30) and the menu (AR-27). *Why:* a paper decision would be a
  guess.
- **AR-21 · MUST · DECIDED (D94)** — THE STUDY SCORE: the full score is the menu's
  fifth item ("full score / my part"); marks per view, no copying; the FIXED ZOOM
  (tap → about double, repaginated, the same left/right swipes, up/down for the
  lines that do not fit, tap → out); the room playing returns the stand to the
  part. *Why:* pages stay pages; already built in the notation workshop; the same
  mechanism as the display's zoom.
- **AR-22 · MUST · DECIDED (D92, D94)** — No pinch-zoom anywhere.
- **AR-23 · MUST · DECIDED (day 43, D95)** — The design target is the full-size
  iPad; MIXED DEVICES are the normal case (iPad · Android tablet · Windows laptop ·
  Fire); a laptop scales up; phones are not stands (acceptable as a remote). *Why:*
  "most professional performers will use the full-size iPad"; every stand syncs
  itself.
- **AR-24 · COULD · PARKED (day 35, D91)** — The beating-frequency indicator: not in
  the first build; idea and measured data in PLANNER.
- **AR-25 · MUST · DECIDED (ENS it. 3/4)** — Wake lock: a stand in a room does not
  sleep (the instructions' "Auto-Lock never" as the backup). Gate E-4.

## D · CONTROLS

- **AR-26 · MUST · DECIDED (D86, D92)** — ONE gesture vocabulary in every module:
  swipe left / right = next / previous page · one-finger tap = place cursor ·
  two-finger tap = play / stop · three fingers or long press = menu. What a gesture
  DOES follows the module's rules (two-finger tap = local play in the ensemble room
  while stopped · the room's play/stop in a sectional · play/stop alone). *Why:* a
  player learns one set once. Gate E-1.
- **AR-27 · MUST · DECIDED (D86, D93, D94, D96)** — The menu, FIVE items: annotate ·
  jump (a letter or a time) · speed (50 / 70 / 85 / 100) · marks on/off · full score.
  Designed by eye in the build (AR-20).
- **AR-28 · MUST · DECIDED (D92)** — Laptop: click = cursor · space bar = play/stop
  · left / right arrow = pages · a small menu button in a corner. Nothing else.
- **AR-29 · MUST · DECIDED (D92)** — No pedal support of any kind; no keyboard
  shortcuts beyond AR-28. *Why:* "no pedal functionality"; nothing to explain.
- **AR-30 · MUST · DECIDED (D94, D95, D96)** — THE LEADER'S STRIP: a thin band ABOVE
  the leader's own part (nothing covered): play/stop · again · the rehearsal letters
  · speeds · a time box · the live position (large) · the ready count · the
  three-way switch (AR-9). On play it STAYS, same height, greyed except STOP +
  RESYNC + position. Its design (height, transparency, real estate) by eye in the
  build with the part. *Why:* a playing leader has no free hands; stopping must
  never cost a reveal tap.
- **AR-31 · MUST · DECIDED (D82, D94, D96)** — THE REMOTE: the same controls
  full-screen on a device with no part (the conductor; a leader who prefers a
  second device) + the ten part-zoom buttons for the display + "show the score
  here". Both forms always exist; which an ensemble uses is decided by use.
- **AR-32 · MUST · DECIDED (D82, D96)** — THE DISPLAY role: a device showing the
  full score, big letter + time, following the room, stopped or playing; zoom one
  part at a time (tap a part → zoom, again → back), commanded from the remote or by
  clicking the display; display-local; made by "show the score here".
- **AR-33 · MUST · DECIDED (ENS it. 3, D94, D95)** — "AGAIN" (replay from the last
  start) and the PRE-ROLL: every jump lands ~5 s before the target — letters and
  typed times alike — and the piece's top gets the same ~5 s. *Why:* the music
  arrives already moving; one rule, no exception.
- **AR-34 · MUST · DECIDED (ENS it. 3, D82)** — Speeds are room-level presets
  50 / 70 / 85 / 100, one tap, visible on every stand when ≠ 100; local play
  defaults to 100; locked at 100 under CONCERT.
- **AR-35 · MUST · DECIDED (D81, D82, D86)** — Looping is dead everywhere; repetition
  = "again", a letter, or cursor + play.

## E · ANNOTATIONS

- **AR-36 · MUST · DECIDED (D93)** — Three tools only: a pen (one colour, one
  thickness, finger-drawn) · an eraser (touch a mark, it goes) · undo (one tap).
  No colours, typed text, shapes or highlighter. *Why:* piece #1's toolbar "too
  clunky"; mimic the pencil.
- **AR-37 · MUST · DECIDED (D93)** — A clear in-and-out: menu → annotate → the finger
  draws, swipes and taps paused → a small bar (three tools + DONE) → done. The room
  starting playback ends drawing by itself. *Why:* a stand must not draw by
  accident.
- **AR-38 · MUST · DECIDED (ENS it. 2/3, D86, D94)** — ALL MARKS PRIVATE. Anchored
  to (player · view · score-time), never page coordinates — they survive
  re-renders; kept on the server; follow the player through every module; sync
  quietly when next online; exportable. Marks on the full score and on the part are
  separate (no copying).
- **AR-39 · MUST · DECIDED (D93, D95)** — Marks SHOW IN THE CONCERT as a layer over
  the video; a show/hide switch per device (the menu's fourth item), remembered;
  set BEFORE the CONCERT switch. *Why:* a paper part goes on stage with its pencil.
- **AR-40 · MUST · DECIDED (D93)** — No conductor annotation path: paper = pencil; a
  monitor is not drawn on; a touch tablet as the score gets the same three tools.

## F · CLOCK AND SYNC — with the measured numbers

- **AR-41 · MUST · EMPIRICAL — measured (D89; RUNNING_LOG 76–78)** — THE FLOOR RULE:
  the local clock is the floor; the network improves or abstains, never compounds
  (confidence gate · clamp · outlier rejection · no peer contagion · local
  calibration; noise from measured scatter; weighted fits; the typical-RTT spike
  filter; level-only after calibration). **The bar, met on the real iPad over real
  Wi-Fi: 0.0–2.4 ms in honest stretches (plain sync 1.9); every injected lie
  held ≤ 1.4 ms.** Desktop ≤ 0.6 · laptop ≤ 1.3 · the Fire holds every lie ≤ 7.8 ms
  uncalibrated.
- **AR-42 · MUST · EMPIRICAL — measured (3.8)** — Calibrate EVERY session: ≥ 30
  trusted samples, σ ≤ 5 ppm (fit σ or an 8-block jackknife, whichever is larger),
  an ~8-minute baseline; never a stored rate (**the iPad's rate moved 6 ppm in
  2 h**); a refused calibration leaves the stand UNCALIBRATED, never wrong. Measured
  rates: iPad +28.3 ± 0.4 ppm (later +22.3 ± 0.4); laptop −14.3 ± 4.4 (rough).
- **AR-43 · MUST · OPEN (a build item with a kit test — D95)** — The clock is
  measured ONLY while the part is in front (a background page on iPad is asleep).
  Samples must PERSIST and ACCUMULATE across sleeps and returns (the device clock
  runs through a suspend; a wider span sharpens the rate). **Not built, not
  tested.** Gate E-2. *Why:* players switch to the PDF app between pieces.
- **AR-44 · MUST · EMPIRICAL — measured (D87, D95)** — THE START: one message "start
  at server time T", T 1–2 s ahead so every stand has it before T; each stand
  converts T to its own calibrated clock and starts on it; **after GO the network
  is optional — the show finishes on local clocks.** Measured free-run: iPad
  +28 ppm ≈ 21 ms over the 751-s piece; two uncalibrated devices 43 ppm apart ≈
  32 ms by the end — the worst case (two failures at once), **under the ~30 ms a
  reader tolerates (the one-notehead threshold).** Never refused (AR-63).
- **AR-45 · MUST · EMPIRICAL — measured (D89, 3.8)** — Corrections are EARLY AND
  TINY; nothing periodic mid-show (piece #1's self-jitter was late-and-big + ambient
  traffic). The video servo holds **5–7 ms** between seeks; the video start has no
  stall (worst start gap 50 ms local / 33 ms room).
- **AR-46 · MUST · DECIDED (D87, D96)** — RESYNC: one quiet gesture on the strip,
  LIVE DURING PLAY, re-aligns every stand to the room clock without stopping.
- **AR-47 · MUST · EMPIRICAL — measured (3.7)** — The mixed-device bar: the beacon
  filmed an iPad and a laptop **7.7 ms apart on average (sd 3.1)** — the number the
  build must hold or beat on two different devices.
- **AR-48 · SHOULD · OPEN (3.8; binds only the VIDEO renderer)** — On Safari a jump
  with video = pause → seek → ready → start on a clock moment, never
  seek-while-playing (the aimed seek still lands ~150 ms off; not diagnosed).
  Rehearsal uses the live renderer (AR-50), so this binds nothing in rehearsal; the
  concert plays straight through; it matters only for an on-stage restart
  (AR-64), where ~150 ms before the lead-in is invisible.
- **AR-49 · MUST · DECIDED (3.8)** — On Safari, frames are judged by the decoder or
  a film, never the frame callbacks (they undercount: 56.2/s against 60.05 filmed).
- **AR-50 · MUST · EMPIRICAL — measured (D89, 3.7)** — Rehearsal / alone / sectional
  stands use renderer **A2** (retained overlay + GPU layers), today's engine fixed
  in place (the per-frame overlay rebuild was the jitter's address; all animated
  instances indexed by time). **The bar: frames on time on the Fire ≥ 99 %
  (measured 99.4 %; today's engine 57 %); desktop · laptop · iPad 100 %.** Cost
  p95 on the Fire 10.7 ms of a 16.7 ms frame.
- **AR-51 · MUST · DECIDED (D89, D95)** — The CONCERT stand uses renderer **C**: the
  pre-rendered per-part VIDEO from the frame-exact exporter; 1-s keyframes
  (measured the fastest seeks on every device: desktop 31 · laptop 14 · iPad 71 ·
  Fire 526 ms); the video carries the ~5 s lead-in before 0:00 (AR-33); marks
  composited over it (AR-39); one file serves every device, scaled.
- **AR-52 · SHOULD · DECIDED (D89)** — Renderer B (canvas) stays BENCHED as the
  measured fallback (the most headroom: 5.5 ms on the Fire against A2's 10.7).
- **AR-53 · MUST · OPEN (size to measure — gate E-3; D95)** — The video is
  downloaded at the FIRST open of the link and kept on the device; re-fetched with
  a progress bar if evicted (Safari's eviction of unused site data for pages not on
  the home screen = a known, unverified risk). Size: ≈ 100 MB for the whole-piece
  video (estimate); per part to be measured.

## H · NETWORK, SERVER, HOSTING

- **AR-54 · MUST · DECIDED (D89)** — Our own small Socket.IO server; piece #1's
  protocol hardened, GREENFIELD (concepts only, no pasted code); one broadcast
  state-tuple; dead-reckoning; WebSocket only — no Colyseus, no WebRTC. Six
  priorities in order: starts on the fly · after GO zero network · corrections
  invisible and never compounding · rooms self-service · rejoin in seconds · few
  moving parts.
- **AR-55 · MUST · DECIDED (D88, D89)** — Hetzner, one small VPS, ALL pieces on one
  deployment (a piece = content + a room namespace, e.g. `/tempus`, `/tubas`); one
  deploy script = disaster recovery = hot-spare stand-up; HTTPS (wake lock, PWA,
  camera-QR); always-on during rehearsal windows; tiny load (~10 clients a room).
- **AR-56 · MUST · DECIDED (D86, ENS it. 3)** — THE OFFLINE FLOOR: a loaded stand is
  fully functional alone, offline — score cached, local play, marks — with zero
  server.
- **AR-57 · MUST · DECIDED (ENGINE §3)** — Rejoin in seconds: a dropped stand comes
  back in sync without fuss; observability designed in; **the chaos test** (N
  fake stands, kill / rejoin, assert sync) is part of the server build's
  verification. Gate E-5.
- **AR-58 · SHOULD · DECIDED (D87, D95)** — THE HOT SPARE: the same server on a venue
  laptop over a phone hotspot; stands re-home by the podium QR or one tap; the
  mechanism is REQUIRED, bringing it is OPTIONAL (the composer's for the first
  concerts; described in the instructions).
- **AR-59 · MUST · DECIDED (ENS it. 3)** — LAN mode includes identity: everything
  works with no internet (the link is the identity; the spare carries the
  registry).
- **AR-60 · SHOULD · DECIDED (D88)** — Piece-independent: every piece reads the same
  modules; ports as pieces come due; development continues during Tempus
  rehearsals (live burn-in).

## I · THE PERFORMANCE

- **AR-61 · MUST · DECIDED (D87)** — Performance = the ensemble room, HARDENED: on
  the fly, NO ceremony — no readiness roster, no countdown, no mode lock beyond the
  one switch; stands follow-only; the concert flow IS the rehearsal flow.
- **AR-62 · MUST · DECIDED (D95)** — THE CONCERT SWITCH (AR-9's third position),
  on at sound check, off after: every stand shows the video (AR-51) · every stand is
  PASSIVE (no menu, no local play, no swipes, no dot) · speeds locked at 100 · marks
  as last set; play/stop, the letters, RESYNC and the ready count stay live. *Why:*
  "I definitely don't want any menu available during the performance"; one switch
  selects the renderer and the passivity.
- **AR-63 · MUST · DECIDED (D95)** — NEVER REFUSED: an uncalibrated stand plays; the
  ready count ("6 of 7") is information, never a gate; with the network up there
  is no visible difference; see AR-44 for the worst case.
- **AR-64 · MUST · DECIDED (D95)** — On-stage restart: STOP · a letter · PLAY, with
  the lead-in; the letters stay live under the switch; no recovery UI.
- **AR-65 · MUST · DECIDED (D95)** — The night, as protocol: open the part at
  warm-up (the video is already there; the clock measures while in front — AR-43) ·
  the leader flips CONCERT and runs one pass (a letter · play · stop) = the sync
  test · back to the PDF app between pieces · when this piece is next, tap the
  icon (reconnect in seconds — gate E-7) · "7 of 7" · nod · PLAY · the end rests on
  the last page · CONCERT off after.

## J · DELIVERY, INSTRUCTIONS, SUPPORT

- **AR-66 · MUST · DECIDED (D88)** — Parts delivery to an ensemble = the modules,
  delivered rehearsal-ready; paper parts pro forma only.
- **AR-67 · MUST · DECIDED (D90, D95)** — OPERATING INSTRUCTIONS covering: the
  handout and the stray-link reissue · the night ("open your part when you sit down
  to warm up; leave it on screen when you can; every return adds") · device lines
  (Auto-Lock never · Low Power off · plugged in) · marks on/off before CONCERT · the
  optional spare.
- **AR-68 · MUST · DECIDED (D90)** — A HELP PROTOCOL / FAQ before the first
  ensembles; "contact me as soon as possible with any issues" for the first
  ensembles.
- **AR-69 · MUST · OPEN (the composer, per piece)** — REHEARSAL LETTERS must be
  authored into each piece before its first rehearsal (a composer-module task;
  print and screens must agree); the system never invents them.
- **AR-70 · MUST · DECIDED (day 45)** — A COMPOSER-RUN TEST STAGE after the build:
  every built chunk comes with a short checklist the composer runs on the iPad ·
  laptop · Fire before any ensemble sees it (as the test kit was).
- **AR-71 · MUST · DECIDED (D93)** — Every gesture TESTED AND CALIBRATED on every
  platform before the build commits to the mapping. Gate E-1.

---

## K · THE EMPIRICAL GATES — measured before the line they guard is built on

| gate | guards | the test | pass |
|---|---|---|---|
| **E-1 · the gesture test** | AR-26 · 27 · 28 · 71 | every gesture of the vocabulary on the iPad · the Fire · a borrowed Android tablet; long press and three fingers especially (iPadOS claims some three-finger gestures — known, unverified) | every gesture lands reliably on every device, or the mapping changes before the build |
| **E-2 · calibration across sleeps** | AR-43 | kit-style: open · measure · sleep behind another app · return · repeat; also a forced page reload | the accumulated calibration meets AR-42's bar and agrees with a continuous one within σ |
| **E-3 · the video on the device** | AR-53 | per-part video size; first-open download time over real Wi-Fi and over phone data; eviction after N days unused, home-screen vs browser-tab | a number for the instructions ("the first open takes about N minutes on Wi-Fi") and a re-fetch that is visibly a progress bar, never a frozen stand |
| **E-4 · wake lock on the iPad over HTTPS** | AR-25 | the deployed page, Auto-Lock at its default, 15 minutes stopped and 15 playing | the screen never sleeps while the part is in front |
| **E-5 · the chaos test** | AR-57 · 44 · 45 | N headless fake stands; kill, rejoin, drop the server mid-piece; assert sync at the end | every surviving stand within the AR-44 / AR-47 numbers; a rejoin lands in sync within seconds |
| **E-6 · the design sitting** | AR-20 · 27 · 30 | the part at several sizes, the strip and the menu drawn over it, on the real iPad, the composer's eye | the composer picks; not a measurement, but a gate before the stand build is called done |
| **E-7 · suspend and return** | AR-16 · 65 | the part behind the PDF app for 30 minutes, then tapped | reconnected, green, following within a few seconds |

Carried in from the engine brief, already measured and attached above: device
jitter ceiling (AR-50) · real drift ppm (AR-42, 44) · video sync precision (AR-45,
47) · the floor clock on real Wi-Fi (AR-41) · seek costs (AR-51).

---

## L · THE ADVERSARIAL PASS — what breaks each scenario against the others

- **Full rehearsal vs alone:** the standing room would capture home practice (the
  leader's play moving every open stand) → **AR-9** (ALONE is the default; the room
  exists only under REHEARSAL / CONCERT).
- **Full rehearsal vs sectional:** one control vs headless → two different rooms,
  both kept (**AR-10 vs AR-13**); the dot moves a stand between them (**AR-14**);
  inside a sectional no solo play, by ruling.
- **Full rehearsal vs performance:** the ceremony → one switch (**AR-62**); the
  strip greys but keeps STOP + RESYNC (**AR-30, 46**); restart from a letter
  (**AR-64**).
- **The playing leader vs the remote:** no free hands → the strip on the stand
  (**AR-30**); the gatekeeper and the leader may be different people, both with
  the switch — last command wins (accepted).
- **Annotation vs the room:** drawing while the room plays → ends by itself
  (**AR-37**); marks on the full score vs the part → per view (**AR-21, 38**);
  marks in concert → the layer + the switch set beforehand (**AR-39**).
- **Controls vs modules:** the two-finger tap is local play in the ensemble room
  and the room's play in a sectional → stated once, accepted (**AR-26**).
- **Rehearsal vs the video renderer:** jumps on video seek slowly on Safari →
  rehearsal uses A2, not video (**AR-50**); the concert plays straight through;
  AR-48 binds only an on-stage restart, where it is invisible under the lead-in.
- **Performance vs the network:** after GO nothing is needed (**AR-44**); the
  spare optional (**AR-58**); an uncalibrated stand ≤ 32 ms (**AR-44, 63**).
- **The door vs abuse:** open links + one-tap reissue + rate limiting (**AR-5**); a
  leaked ensemble-room link yields a stand that can only follow (**AR-10**); the
  sectional room is the exposed one (headless) — accepted for rehearsals.
- **Doubling vs identity:** two links per doubled part (**AR-2, 4**).
- **The display vs the remote:** "show the score here" (**AR-31, 32**).
- **What nothing covers yet — for phase 3 ARCHITECTURE, not new requirements:**
  (a) a leader who forgets to flip ALONE after rehearsal leaves the room in
  REHEARSAL — propose at design time: REHEARSAL falls back to ALONE when the room
  has been empty for a while; (b) two leader devices both live — last command
  wins; (c) a stand whose video is missing on the night fetches it (**AR-53**) and
  plays live (A2) if it cannot — a design-time decision.

---

## M · OUT, REJECTED, PARKED — so nothing creeps back

Accounts per player · conductor self-serve · automatic email · protected links ·
a per-ensemble CONDUCTED / CHAMBER switch · a "step out of the room" dot (the
room choice replaced it) · pinch-zoom · pedals · cue strips (deferred) · the
beating indicator (parked, AR-24) · colours / highlighter / typed text · a
conductor annotation path · a sixth menu item · a leader in sectionals · the
readiness ceremony, countdown, mode lock · a required spare · looping and the
A/B loop · the tablet-dictation annotation idea · demo-audio integration · room
persistence for sectionals · a second icon for the study score · the full score
following along on a player's stand.
