# ARCHITECTURE — the remaining modules (rehearsal · performance · network · portal)

> Opened day 38 (2026-08-28). One doc, three sections that harden in order:
> REQUIREMENTS → DESIGN → PLAN. Process and scope are in RUNNING_LOG day 38;
> the composer's words in COMPOSER_LOG day 38.

## The workflow (agreed day 38)

- **PHASE 0 — FRAME**: 0a scope (composer) · 0b prior-art inventory (AI, from the
  string quartet + 2p2p repos — composer: str qtr is the most complete).
- **PHASE 1 — GATHER**: 1a scenarios (composer) · 1b mental models (composer) ·
  1c AI evaluation — gaps, conflicts, what was left out · 1d vet loop until
  nothing new surfaces.
- **PHASE 2 — HARDEN**: 2a classify (must/should/could × decided/open/empirical) ·
  2b empirical gates (probes before commitments) · 2c adversarial pass (what
  breaks each scenario) · 2d freeze — stable IDs `AR-N`, each with its why.
- **PHASE 3 — ARCHITECTURE**: 3a draft (alternatives considered and rejected) ·
  3b scenario replay through the design · 3c composer review · 3d risk spikes.
- **PHASE 4 — PLAN**: 4a phased into PLAN.md with per-phase verification in the
  running app · 4b model/clear map.

**Status: PHASE 1 GATHER — 0a/0b done; ENS CLOSED (day 39, D82) · SEC
CLOSED (day 41, D85) · IND CLOSED (day 41, D86). Next: PERF + PORTAL
scenarios · CONTROLS · ANNOTATION-UX · the composer's mental models · 1c
evaluation · the composer's noted topics (animation engine · a NET
sitting) — position, chunking and the brief-on-resume contract live in
`docs/PERFORMANCE_SCORE_ORDER.md` (D84, ► PERF next). "Closed" = requirements settled, plan NOT drawn
(composer's definition, day 39): all scenarios gather first, then Phases
2–4; the 2c adversarial pass re-tests ENS with everything else.**

## 0a · Scope (composer, day 38)

Done and out of scope: **composer module** · **presentation score** (video, print).

The remaining architecture, six areas:

| # | area | gist as given |
|---|---|---|
| 1 | **Ensemble rehearsal module** | conductor-led, whole ensemble. Podium: tablet/laptop, maybe a large monitor, maybe paper score. Rehearsal numbers: conductor hits rh# or enters a time → all players' scores jump. Conductor start/stop etc. Players scroll freely but (maybe) no play controls |
| 2 | **Sectional / small-group rehearsal** | to be discussed — what does it need |
| 3 | **Individual rehearsal module** | — |
| 4 | **Network communication layer** | "reliable and robust… the right structure to support all my pieces past and future, think massive multi player game engine" |
| 5 | **Portal / share structure** | current landing page + room sign-up "too clunky"; login and get-to-your-score must be easy |
| 6 | **Performance module** | what the ensemble uses in performance; vet hardest, look for existing models |

**Cross-cutting:** interfaces minimal per scenario — "just the things that people
need" — and aligned to the device (tablet = finger swipes, laptop = mouse + keys).
This may reach back into pre-existing modules (clock, animation engine).

## 0b · Prior-art inventory (day 38 — read-only pass over pieces #1 and #2)

### The deployed system — piece #1, LIVE at justinwenloyang.com

- **Stack** (SERVER_AUDIT.md, Apr 2026): Node + Express + **Socket.IO** + PM2 +
  Nginx + Let's Encrypt on a **Hetzner CPX11** (5.161.233.35), Cloudflare DNS.
  Deploy script (`deploy.sh`: pull → npm install → build → restart → health
  check). `/health` endpoint. helmet, rate limits (10 session-creates/min,
  20 joins/min, 60 api/min), `trust proxy`, bound to 127.0.0.1 behind nginx.
- **Portal today**: hand-built homepage (works cards) → `/string-quartet-no1`
  landing → `/score` app. Also served: notation instructions, technical manual,
  print PDFs per part.
- **Landing flow (the "clunky" one)**: type name → pick instrument → pick
  pages-per-screen → *optionally* create/join a room by **typing a 6-char code**
  → Open Score. JWT (30 d) gives a welcome-back/rejoin path. Options travel as
  URL params (`?track=&pages=&room=&mode=`).
- **Sessions & identity**: sessions persisted as JSON files (`data/sessions/`),
  performers claim **hardcoded per-piece slots** (violin1…cello), get a JWT +
  performer profile/preferences (50 KB cap) under a random performerId.
  Anonymous fallback everywhere. Session-spam bots were observed in the wild.

### The network protocol (performance_server.js, 1319 lines — the seed vocabulary)

- **Server-authoritative room clock**: `scoreTimeMs = Date.now() − scoreTimeOffset`;
  clients follow. `clockSync` broadcast every 1 s · `heartbeat` every 500 ms
  (fast disconnect detection) · `scorePositionCheck` every 3 s during playback ·
  server-side loop check every 200 ms · RTT via `pingRequest/pongResponse`.
- **Leader model**: one leader per room (socket id), **leader-gated** transport
  (`scoreGo/scoreStop/scoreGoto`, loop set/toggle/clear, `recallAll`,
  `performanceStart/End`, `setLeader` transfer); `notLeader` rejection event;
  auto-transfer on disconnect; "first command claims leadership" when vacant.
  **BPM / beatsPerPage are NOT leader-gated** (anyone can change them).
- **Latency-compensated start**: `scheduledStartTime = now + 150 ms` on every GO.
- **Modes**: `rehearsal` | `performance` per room. Performance = readiness
  roster (`performerReady`, `allReady`) → goto 0 → 3 s countdown → scheduled GO
  → **auto-stop at reported score end** → mode reset.
- **Rooms**: created on demand, 5-min grace period when empty (position frozen),
  reset-to-zero on first join. State: isPlaying, time, tempoHistory, leaderId,
  loop A/B + count, mode, readiness, connectedPerformers.

### The client feature set (Technical Manual TOC = the prior generation's spec)

Full score & parts views · pages-per-screen · rehearsal mode · touch gestures
(swipe nav, pinch zoom) · controls overlay (fade-out) · **markers (per-client
localStorage only — NOT shared, NOT score data)** · A/B looping · **practice
speed control** · sync/independent/re-sync + **sync-quality indicator** +
**offline mode** · annotations (Apple Pencil, stamps, localStorage) · minimap ·
performance-mode ceremony (readiness → countdown → **locked playback** →
auto-stop) · **emergency menu (2-finger long-press)** · URL params reference.

### The build model

Performance app = **workshop substrate + ~30 patches + strips** (subtractive
build, `build_performance_app.js`): `performance_parts_patches` (1898 lines,
part views + GC continuation) · `performance_rehearsal_patches` (2986 — gestures,
overlay, markers, loop panel, minimap, speed) · `performance_annotation_patches`
(1463) · `performance_canvas_patches` (416).

### Piece #2's evolution (2p2p)

- **THREE_SCORES separation formalized**: workshop = substrate only · composer
  score = source of truth · performance score = the deliverable. (#3/#4 went
  further: the composer score is its own app; no workshop substrate at all.)
- **Performance score = "pure graphic + animation"** — no MIDI/audio, no editing,
  iPad target.
- **Pre-baked O(1) lookups**: curveData samples at 100 Hz baked by Node
  middleware; runtime does zero curve math. SVGs baked, not live-rendered.

### Pieces #3/#4 (this repo)

- Composer-side stack only. **#4 has ZERO network code** — no socket/ws
  anywhere; the only dependency is resvg. Everything below is greenfield here,
  with piece #1 as the reference implementation.
- The notation engine is **already external-clock-ready**: pages draw by
  `drawAtTime`-style pure time functions (`static_page.js`, the video exporter
  proved it frame-exact). An animation driven by a room clock instead of a local
  clock is a clock-source swap, not a rewrite.

### Pain points on record (carry into requirements)

1. **The Apr 2026 incident**: node_modules tracked in git → every pull corrupted
   deps → nginx cascade 502s; 16 PM2 restarts in 19 days before hardening.
   Uptime monitoring (item 5) **never completed**.
2. Landing/portal are **hand-built per piece**; slots hardcoded per piece;
   adding a piece = hand-edit server routes + HTML.
3. **No conductor role** — leader is any socket, transferable; podium needs are
   unmodelled.
4. **No rehearsal numbers** — markers are private localStorage per device;
   nothing shared, nothing authored into the score.
5. Room codes typed by hand on every device; no QR/link-first join.
6. Two servers, two repos (#1 and #2 each carry a performance_server.js);
   protocol is app-specific, not piece-agnostic.

### Map — six areas × what exists × the gap

| area | exists (piece #1) | the gap scenarios must address |
|---|---|---|
| 1 Ensemble rehearsal | leader-gated transport, goto, A/B loop, recallAll, tempo | conductor as first-class ROLE; rehearsal numbers as SHARED SCORE DATA with one-tap jump; podium UI; large-monitor display mode |
| 2 Sectional | rooms work for any subset | nothing subset-aware (which parts, which material) |
| 3 Individual | independent mode, offline mode, speed, loop, private markers/annotations | does solo need the server at all? practice-specific aids |
| 4 Network layer | authoritative rooms, clock sync, heartbeat, latency-compensated start, reconnect grace | piece-AGNOSTIC protocol; versioning; multi-piece one server; observability; the "game engine" robustness bar |
| 5 Portal | homepage cards, per-piece landing, JWT rejoin | accounts/ensembles as durable things; link/QR join with zero typing; composer admin view; multi-piece structure |
| 6 Performance | the full ceremony: readiness → countdown → locked → auto-stop → emergency menu | vet against real scenarios; conductor role; network-failure behavior on stage |

### Existing models to study (queued for Phase 1c)

**Ableton Link** (LAN tempo/beat sync, the strongest prior art) · game netcode
(authoritative server, client prediction, drift correction) · NTP-style clock
sync (what clockSync approximates) · show control (QLab networking, SMPTE/LTC)
· commercial digital stands (forScore cue, Newzik, nkoda) · WebRTC data
channels vs WebSocket (LAN peer sync when internet dies).

## 1 · REQUIREMENTS

### 1a · Scenarios

#### ENS — full-ensemble rehearsal (composer, day 38 — verbatim in COMPOSER_LOG)

**The walkthrough:**

1. Players arrive → load score independently → scroll, practice passages, swipe
   through **their part**, play with animation. No ceremony.
2. Conductor arrives: *"let's start at X"* — X = **rehearsal number or timecode**.
3. Con flips through score — **screen or PAPER** — and sees immediately where
   they are: clear rehearsal numbers + time markings, unobtrusive to the
   notation, **zero extra taps** ("what I'd like to avoid is conductor having
   extra steps").
4. Con hits rh# (or enters a time) → **every logged-in score snaps there**.
5. Login is trivial: show up → log in → in. **Late joiner while everyone is
   playing: log in → score appears mid-flight, in sync.**
6. Con points at T4 *"can I hear this passage"* → T4 swipes there, presses play,
   plays alone — **local playback on one stand while the room is stopped**.
7. Con hits a timecode → play → everyone's score plays (room-synced).
8. *"Too sharp, T7"* → T7 scribbles a downward arrow — **finger or stylus, no
   stylus assumption** → the arrow **follows T7 through every module**
   (sectional, individual practice).
9. Con annotation: con is on laptop/monitor or paper; annotates the main score
   via touch somehow. One idea floated: tap the notation area on the tablet → a
   text box appears on the large-monitor view → type. **Multiple sub-scenarios;
   to be discussed.**
10. Paper path: con pencils notes into the paper score → **an easy transfer
    process** into the digital score afterwards.

**Constraints stated:**
- No elaborate login/handshake/sync ceremony.
- Annotations: the piece-#1 system had **too many tools, too clunky** — "simple
  universal functions."
- Controls (swipe vocabularies etc.) get **their own dedicated session**.

**Principles emerging (composer, open to pushback):**
- **Per-scenario frontends** — each module ships only that scenario's
  functionality; cross-cutting data (annotations) flows through all; backend
  shared.
- **Transport rights are per-module POLICY** — sectional: everyone can
  start/stop; ensemble: conductor only.

**AI position (day 38): AGREE on per-scenario frontends**, one refinement — many
thin shells, **one shared core** (notation/animation renderer, clock-follower,
annotation layer, room/identity client as packages). The two failure modes it
avoids: piece #1's single app accreting every feature behind modes/URL params
(lived, named too complex), and its mirror — forking the ENGINE per module so
five copies drift.

**AI additions to vet (1c preview — proposed day 38, NOT yet accepted):**

- *The room's physics:* venue wifi may be absent/captive — LAN-first question
  (who hosts: a brought router/box? con's laptop?). Device zoo (iPad/Android/
  laptop; is a phone too small?). Battery across a 2.5 h rehearsal; screens must
  not sleep (wake-lock) but also not burn out.
- *Starting together:* what happens between con's PLAY and the sound — count-in
  / prep display (the GC ball is itself a predictive prep device; does
  play-from-rh# begin with a short pre-roll?). **Room-level practice speed**
  ("again, slower") — piece #1 had per-client speed only. A/B loop between rh#s
  at room level (piece #1 had this).
- *The podium:* how is CON identified technically (role claim at login? portal
  role?). Roster glance — who's connected, T1–T7 badges. An "all snapped"
  confidence indicator after a jump. **Display-client vs control-client split**
  — big monitor = display surface, tablet = controller (matches the composer's
  annotation idea; game-engine "spectator view" pattern).
- *Rehearsal numbers do not exist yet as data.* Authoring them is a
  composer-module task; print and screens must agree; the printed score may need
  a re-render once rh#s are authored. Time display format should match the
  printed second-ruler.
- *Annotation scopes:* who sees whose — private / to-one-player / to-everyone?
  Con's "too sharp T7" could even be con writing TO T7's screen. Undo must be
  one gesture.
- *Failure modes:* server host sleeps, wifi drops mid-play → clients keep
  animating on their own clock (they have the tempo map), quiet auto-reconnect,
  no modal errors on stands.
- *Parked (flagged, not proposed for v1):* synced demo-audio playback (con plays
  the mockup of a passage to the room — the demo recordings are "part of the
  apparatus"); rehearsal logging (which spans got rehearsed, where con stopped —
  cheap to record, useful for the composer).

#### ENS — iteration 2 (day 38, composer's answers; verbatim in COMPOSER_LOG)

**THE GOVERNING PHILOSOPHY (composer, verbatim — binds every module):** *"lean
simple to use not feature rich but robust and can do all the main functions
really well."* Corollary from the same exchange: piece #1's
interruption-proofing was *"probably overwrought, but that was for
performance"* — **the robustness bar SPLITS by scenario**: rehearsal recovers
in seconds; performance is the hard case.

**Settled this round:**
- **Network posture: internet assumed, LAN backup.** Dead-room rig (a machine +
  tethered phone serving wifi LAN) is set up ONCE; subsequent rehearsals proceed
  as normal. A possibility, not the center of the build.
- **Annotations: ALL MARKS PRIVATE.** Players mark their own score; con's marks
  are notes to self. No sharing layer, no visibility scopes. The
  tablet-dictation idea is dropped ("too bespoke"). The model is *"mimic the
  paper score"*: scribble in the margin or over notation, **finger-first**, few
  tools (piece #1's toolbar named too clunky).
- **Audio in rehearsal: leaning no** — con prepares at home; revisit only if
  trivially cheap.
- **Phones: too small as a score; acceptable as a conductor remote.**
- **rh numbers: architecture first, populate the data after.**
- Parked items stay parked until the main build proves out.

**The podium — three real setups (composer), AI recommendation accepted-pending-review:**

| setup | display | control |
|---|---|---|
| 1 · paper con | paper score | phone/tablet remote: start/stop/jump only |
| 2 · monitor con | large non-touch monitor, full score | tablet remote (or mouse/kb on the display machine as fallback) |
| 3 · budget con | one Chromebook | same Chromebook, mouse/kb |

→ **Recommendation: DISPLAY and CONTROL are ROLES, not devices.** Any device
joins the room in a role: **score-display** (full score, big rh#/timecode) ·
**controller** (transport UI) · **stand** (a player's part). The three setups
are configurations of two roles; the Chromebook takes both; a display client
can always unhide a control strip. Chromebook floor ⇒ browser-only, no
installs, modest CPU. *(Same split the composer reached independently for
setup 2: "large screen for display, remote control for all interaction.")*

#### ENS — iteration 3 (day 38): four adoptions + the coverage check

**Adopted by the composer ("a y; b y; c y; d y"):**
- **STANDING ROOMS** — the ensemble's room is durable; login → your part; codes
  never appear in the weekly flow.
- **"AGAIN" + PRE-ROLL** — core transport primitives: replay-from-last-start;
  jumps land N s (default ~5) before the target.
- **SPEED = PRESETS** — 50/70/85/100, one tap, visible on every stand when
  ≠100 %; room-level (transport right); local play defaults 100 %.
- **THE OFFLINE FLOOR** — a loaded stand is fully functional solo, offline:
  score cached, local play + annotations work with zero server.

**Coverage check (AI, at the composer's "is this well vetted?"):**

*The one big gap — the piece's own mandates M1/M2 (PLAN §3).* The scenario so
far assumed a fixed roster, but the piece is **10 parts for 12–20 players,
"whoever shows up"** (Penn State call): M1 = on-the-fly part multiplication,
M2 = any part readable by any tuba/euphonium family member. The rehearsal
module is exactly where these bite: **day-of part assignment (who assigns —
con? self-claim?), two players doubling one part (both get stands on it,
annotations still private per player), family transposition/octave adaptation
at the stand.** Standing-room login "→ your part" needs an assignment model
under it. **UNRESOLVED — needs its own discussion.**

*Structural additions (AI-proposed, low-controversy):*
- **Stands always follow the room.** When the room plays or jumps, every stand
  snaps — browsing positions are abandoned without ceremony. Free browse exists
  only while the room is stopped. (This IS the composer's "players can scroll
  but no play controls," stated as the rule.)
- **The controller shows live position** (rh# + timecode, big) — the
  paper-conductor's only sync reference.
- **Annotations anchor to (part, score-TIME), never page coordinates** — they
  survive density/layout re-renders; persisted server-side; exportable/backed
  up (they are rehearsal's only user-created data).
- **LAN mode includes auth** — login must work with no internet (the LAN box
  carries identity).

*Candidates, not yet ruled:* display role can switch full-score ↔ one part
(the "watch T4" move) · A/B loop between rh#s (proposed day 38, never
explicitly confirmed) · wake-lock/battery posture · dark/light display theme
(→ controls session).

**Verdict as given: ~90 % complete for the flow described.** Deliberately
deferred zones: the CONTROLS vocabulary and ANNOTATION UX (own sessions, by
design) · sectional/individual scenarios may back-feed requirements · the
Phase 2c adversarial pass re-tests everything. Close ENS after the M1/M2
discussion.

#### ENS — iteration 4 (day 38): M1/M2 resolved upstream; assignment like paper parts

**THE REFRAME (composer — supersedes PLAN §3 M1/M2 as *runtime* features;
verbatim in COMPOSER_LOG):**

- **Pre-registration, no drop-ins.** New players enroll through an
  off-rehearsal process, never mid-rehearsal.
- **Per-ensemble tailoring at COMPOSITION time.** Piece accepted → composer
  offers a custom-size version (e.g. 14 players, 3 euphoniums): regenerable
  sections rescramble to N parts, **transpositions baked in**, all mods done and
  all players registered **before first rehearsal**. Fallback if tailoring is
  expensive: stay at 10 parts, extra players double/transpose themselves.
- **No midflight changes**; an unavoidable one goes through the same
  off-rehearsal process.
- **Day-of assignment = (a):** con assigns players to parts from the
  controller, *"like handing out paper parts"* — at first rehearsal or an admin
  meeting. A mid-rehearsal change is the same gesture ("collecting their paper
  part and issuing a new part").
- **What remains in the runtime:** the assignment UI + per-player part binding.
  Nothing generates parts live; nothing transposes live.

**The composer's pipeline question — "does there need to be a pipeline master
score → parts?" — AI answer (day 38):** the intuition is right and is already
this repo's architecture: **everything draws from the IR** (save → IR → print /
video / stands — one source, proven byte-identical for print vs video). The
requirement to add is only that **the stand's part view is a live VIEW of the
IR** (the unbuilt PARTS deliverable becomes this — no pre-built per-part PDFs).
The real cost of tailoring is not plumbing but **re-notating rescrambled
sections** — the figure/beaming decisions were made by hand per part;
regenerated parts need that pass again. Transposed or doubled parts are
mechanical. So: tailor-by-regeneration is cheap where sections re-voice,
real work where they rescramble — per-section, known in advance, composer-side.

**Also ruled this round:**
- **Looping RESCINDED — globally.** *"Not too fussed about any looping…
  looping was problmatic in 1st verson."* The repeat move = "again" or con
  re-hitting the rh#. (If the individual-practice scenario ever resurrects it,
  it re-enters through that door explicitly.)
- **Wake lock adopted** — screens in a room don't sleep.
- The four structural additions of iteration 3 stand unopposed (stands always
  follow · controller shows live position · annotations anchor to score-time ·
  LAN auth).
- **The old "(maybe)" on stand play controls, resolved (AI proposal, pending
  nod):** stands have **no room transport**; stands have **local play whenever
  the room is stopped** (which is also what the "can I hear T4" moment and
  pre-rehearsal practice use). Room playing → stands only follow.

#### ENS — iteration 5 (day 39, 2026-08-29): the zoom ruling + local play — **ENS CLOSED**

**ZOOM ADOPTED (composer: "zoom -a")** — the day-38 proposal plus the role
refinement:

- Click a part → the composer-score zoom view; click again → full score.
- **One part at a time**: clicking another part switches directly; clicking
  the active part returns to full score. Multi-part side-by-side zoom
  REJECTED — more layout machinery and no rehearsal moment needs it.
- **Zoom is view state of the DISPLAY role, commanded from wherever control
  lives**: the remote (tablet or phone) carries 10 part buttons; a
  touch/mouse display clicks the part directly; the paper-con setup has no
  display, so no zoom surface exists there.
- **Display-local** — stands never see it. **Follows the room clock** —
  works stopped or playing (the "watch T4's passage" move).
- This retires the iteration-3 candidate "display flips full-score ↔ one
  part" — same feature, now settled.

**LOCAL PLAY ADOPTED (composer: "local play yes")** — stands have no room
transport; a stand plays locally whenever the room is stopped; the moment
the room plays, stands only follow.

**A/B-LOOP CANDIDATE DEAD** — looping was rescinded globally in iteration 4;
the never-confirmed room-level A/B loop dies with it, no decision owed.

**ENS CLOSED (day 39, → D82).** The composer's definition, recorded:
*"closed means we've worked out all the requirements, but have yet to draw
up the plan"* — and the project flow confirmed in the same breath:
**requirements for ALL scenarios first, then the plans** (the Phase 1→4
order as adopted). M1/M2 supersession promoted to journal §4 as **D81** at
this wrap; PLAN §3 annotated.

#### SEC — sectional / small-group rehearsal, iteration 1 (day 41, 2026-09-01; composer verbatim in COMPOSER_LOG day 41)

**The scenario as given:**

- **Two contexts, one module:** a small group **breaks off from the large
  group mid-rehearsal**, or meets **independently, away from rehearsal** —
  "a small group of players wants to get together and practice, they'll be
  able to."
- **On-the-fly group formation** — players form their own group themselves;
  no composer/conductor setup step.
- **Durable recurring rooms** — "they could reliably come back to the same
  room if that same group rehearses over and over again." Formed on the
  fly, persistent thereafter.
- **HEADLESS CONTROL** — "anybody could control the score." Explicitly NO
  leader model; piece #1's leader-passing named as the pain ("too much
  like this one's a leader. now this one's the leader").
- **The flow:** "very simple interface login. choose the room and start
  playing now."

**Consequences (AI reading, to confirm):**

- The ENS rule "stands have no room transport" is **ENS-scoped policy, not
  global** — in SEC every stand carries transport. (The per-module-policy
  principle doing exactly its job; the dictation confirms the sectional
  side of it.)
- No leader ⇒ no leader-transfer machinery, no "first command claims
  leadership." Candidate policy: **every member equal, last command wins,
  no locks.**
- The standing-rooms machinery generalizes: **a room per GROUP**,
  member-formed, listed at login.

**Surfaced, not resolved here:**

- **THE PARTS THREAD (composer):** "the players themselves are playing
  their own parts. so we haven't discussed that yet… how do we format
  those and make those" — promoted to a proposed chunk in
  `PERFORMANCE_SCORE_ORDER.md` (after the scenario chunks). ENS
  iteration 4 already holds the seed: **a stand's part view = a live VIEW
  of the IR** (no pre-built per-part PDFs); what a part SHOWS is the open
  question, and scenario findings bank into it.
- **Vet round pending (a–d):** break-off tie-back to the main room
  (recall gesture, or human coordination?) · room identity at "choose the
  room" (names? "your rooms" list?) · conflict policy under headless
  control (last-command-wins?) · does a sectional see the group's lanes or
  all ten (→ PARTS input).

#### SEC — iteration 2 (day 41): a–d ruled; the ensemble features carry

**Ruled by the composer ("a just human. B, yes. c yes… d…" — verbatim in
COMPOSER_LOG):**

- **a — break-off tie-back: HUMAN.** No recall machinery; "back in 10" is
  coordination, not code.
- **b — room identity: YES.** Named rooms, auto-created at first
  formation; login shows **your rooms**.
- **c — conflict policy: YES.** Every member equal, **last command wins**,
  no locks, no claims.
- **d — the view: OWN PART ONLY.** "They'll only be playing their parts…
  [Tuba] 1 through 4 is meeting, then each will see their individual
  parts, but those four parts will be coordinated." A stand shows YOUR
  part in every module; "coordinated" = the room clock. Free navigation
  stays ("skip around or move to a different rehearsal [number]").
  **→ First PARTS input banked: the stand's view is the player's own
  part, everywhere.**
- **The ensemble features CARRY** (composer: "we talked about some of the
  features of the ensemble, like different speeds, etcetera") — the
  inherited set, for the record: speed presets 50/70/85/100 (a transport
  right — in SEC, everyone's) · "again" · pre-roll on jumps · local play
  while the room is stopped · stands follow while it plays · annotations
  private · offline floor · wake lock.

#### SEC — iteration 3 (day 41): f/g ruled; e sharpened, solution proposed

**Ruled by the composer (verbatim in COMPOSER_LOG):**

- **f — one room at a time: YES.** No dual membership.
- **g — demos: ZERO integration.** "They can just pull up a browser and go
  to YouTube independently. it doesn't have to integrate with the score."
  Nothing reachable-from-the-stand is required either.

**e — constraints sharpened (composer: "let's think of a solution"):**
one person creates (anyone) · the room appears in the other players'
selection · the creator must NOT scroll/pick from a player list · roster
provenance is itself a question ("how do we build the roster?") and the
roster changes · the system must NOT accumulate managed rooms · players
must NOT have to remember to delete rooms · no long lists of
previously-created rooms.

**AI PROPOSAL — "LIVE ROOMS ONLY: the room is who's in it" (pending the
composer's verdict):**

- Any player taps **Start a sectional** → a live room opens with them in
  it. Every logged-in player's room choice shows exactly: **the ensemble
  room + any sectional live right now**, auto-labeled from its members
  ("Sectional — T1 T2 T3 T4"). One tap joins. The room **dies when empty**
  (short grace, as piece #1's rooms did). Nothing is stored, ever.
- Constraint map: creator picks nobody (joiners self-select — the piece's
  own "whoever shows up" philosophy) · nothing to delete and no stale
  lists (only live rooms exist; rarely more than one or two) · **"come
  back to the same room" REFRAMED:** nothing in a sectional needs memory —
  annotations are private and follow the player globally, position is one
  rh# tap — so "the same room" = the same people meeting again through the
  identical two-tap flow, zero stored objects. If some state ever earns
  persistence (last position?), it can key silently to the member set —
  NOT proposed now.
- Side effect: **iteration 2's b ("named rooms") resolves to AUTO-LABELS**
  — no one ever types a room name.

**The roster (answer to "how do we build the roster?"):** it already
exists as a consequence of ENS iteration 4 — pre-registration through the
off-rehearsal process + con assigning parts "like handing out paper
parts" = a player↔part registry. **SEC never builds or edits a roster; it
reads the current one**, so roster changes are enrollment events and the
sectional flow never breaks. Under live-rooms it is barely consulted at
all — joining is self-service; the label shows who is present.

#### SEC — iteration 4 (day 41): live-rooms ADOPTED — **SEC CLOSED**

**Composer: "yes good."** The live-rooms model is adopted as proposed in
iteration 3, with its side effects: b resolves to auto-labels ·
"come back to the same room" = the same people, zero stored objects ·
roster = a read-only view of the ENS-iteration-4 registration/assignment
registry. **SEC is closed at the composer's standing definition (as ENS,
D82): requirements settled, plan not drawn.** Promoted to journal §4 as
**D85**. Findings banked onward: **PARTS** ← the stand shows the player's
own part, everywhere · **PORTAL** ← the room selection is two kinds only
(the ensemble room + sectionals live right now) · **NET** ← sectional
rooms are ephemeral, die-when-empty; nothing in SEC needs room
persistence.

#### IND — individual practice, iteration 1 (day 41 sitting 2; composer verbatim in COMPOSER_LOG)

**The scenario as given — gestures first:**

- **Hand gestures VERY SIMPLE:** swipe left = next page · swipe right =
  previous page.
- **Three tap primitives** — single-finger, two-finger,
  three-finger-or-long-press — covering **three actions**: play/stop ·
  move the cursor · open a **small menu**. Exact finger↔action mapping
  left loose ("some version of") — **banked as the CONTROLS chunk's
  seed**.
- **The menu: MINIMAL.** Candidates named: annotate · maybe jump · maybe
  speeds. *"I'd like to try to make this menu minimal and easy to
  control."*

**Already in place for IND from prior rulings (compiled):**

- **The OFFLINE FLOOR is IND's foundation** (ENS iteration 3, adopted): a
  loaded stand is fully functional solo, offline — score cached, local
  play + annotations, zero server.
- View = **own part** (SEC d: "everywhere").
- Annotations private, follow the player → consequence: **quiet sync when
  next online**.
- Speed presets 50/70/85/100 · "again" · pre-roll all exist.
- **Looping rescinded globally with IND named as the only explicit
  re-entry door** — must be asked in this scenario.
- Phones too small as a score; stands only.

**Vet round pending (a–e):** serverless solo (no room at all?) · the
looping door · pin the gesture mapping now vs defer to CONTROLS · paged
browsing confirm (screenful per swipe; playing = score follows the
cursor) · menu v1 contents.

#### IND — iteration 2 (day 41): a–e ruled — **IND CLOSED**

**Composer: "a. yes, B. no loop, c working default, d Yes, e those three
only."**

- **a — SERVERLESS SOLO: YES.** No room at all; log in once (part +
  identity); the offline floor is the module; annotations sync quietly
  when next online.
- **b — NO LOOP.** The one explicit re-entry door (day-39 global
  rescission) closed by the composer — **looping is now dead everywhere
  in the system**. Repetition = tap the cursor back + play.
- **c — gesture default PINNED:** single tap = place cursor · two-finger
  tap = play/stop · three-finger or long press = menu. The CONTROLS
  chunk refines across modules.
- **d — paged swiping: YES.** One screenful per swipe while browsing;
  playing = the score follows the cursor.
- **e — menu v1 = THREE ITEMS ONLY:** annotate · jump (rh#/time) · speed
  presets. (No "again" in IND's surface — cursor + play covers it.)

**IND is closed (requirements settled, plan not drawn). → D86.** Banked
onward: the pinned gestures → CONTROLS · serverless-solo → NET (IND
needs zero room infrastructure).

#### PERF — precedent survey (day 41 sitting 2, composer's ask: "look around and surface… good models"; web-verified this day)

**A · The direct genre — networked animated scores:**

- **Decibel ScorePlayer** (Decibel ensemble, Perth — Cat Hope / Lindsay
  Vickery; iPad app, ~2013→): network-synced scrolling graphic scores
  over plain Wi-Fi; full-score or part view; rehearsal slider + scroll
  speed. **Teaches:** a decade of real concerts on ordinary Wi-Fi — the
  tech bar is modest; the practice aids that stuck (jump + speed) are
  exactly our IND menu.
- **SmartVox** (Jonathan Bell, TENOR 2018): browser-based audiovisual
  parts on the performers' OWN phones/tablets — type a URL, you're in;
  scrolling-cursor sync for non-pulsed music; in-room or remote.
  **Teaches:** browsers-as-stands is concert-proven; the zero-install
  URL flow matches our portal philosophy.
- **OscillaScore** (Rob Canning, TENOR 2025): browser SVG animated
  scores; animation, cue logic and annotation embedded in the SVG.
  **Teaches:** SVG-native score animation is current practice; ours
  (vector pages, drawAtTime) sits squarely in it.
- **Polytempo Network** (Philippe Kocher, ICST Zurich) — **the
  polytemporal sibling**: a networked app that conducts each player
  separately — animated bars mimicking conducting gesture (down = beat),
  or a click, PER-DEVICE TEMPO, built for music in several simultaneous
  tempos. **Teaches:** per-player visual conduction of independent tempos
  works on stage — direct validation of the trance's multitempo balls;
  his design conclusion (animate the CONDUCTOR'S GESTURE) is the GC
  ball's own logic. → PAPER material.

**B · A century of visual click:**

- **Film-scoring streamers & punches** (1930s→): lines sweep to a hit
  point, flashes mark it, click tracks under. **Teaches:** "moving object
  arrives at a line = now" is hundred-year-old professional grammar — the
  go-line + cursor + ball generalizes it; players trust it under
  pressure.
- **Theater/touring click practice** (in-ears, QLab/Ableton rigs):
  performance sync is ONE-WAY and dumb-robust — timecode flows, players
  follow, nothing talks back. **Teaches:** FOLLOW-ONLY is the stage
  posture (= piece #1's locked playback).

**C · Sync-technology models:**

- **Ableton Link**: leaderless peer-to-peer LAN sync (tempo/beat/phase);
  anyone joins/leaves without interrupting; states MERGE rather than
  being commanded; open source. **Teaches:** leaderless consensus is
  proven (philosophically = SEC's headless last-command-wins); BUT Link
  syncs a beat grid, not a timeline — its model fits our social layer
  more than PERF; its join/leave bar ("no interruption") is the right
  bar for our rooms.
- **Game netcode** (the composer's own frame): authoritative server
  clock · client-side prediction · drift correction · graceful
  degradation. **Teaches:** piece #1 already implements the core
  (authoritative scoreTime, clockSync, RTT, scheduled starts); the ideas
  worth adopting are clients SIMULATING through dropouts (our stands
  have the tempo map — dead-reckoning is free), quiet resync, and
  observability (server sees each client's drift).
- **SMPTE/LTC + show control (QLab)**: one-way timecode, cue-based GO,
  operator authority. **Teaches:** performance wants CUE-GRADE
  simplicity — one GO, the rest is machinery.

**D · Redundancy practice (the composer's named keyword):**

- **Redundant playback rigs** (touring/theater standard — e.g. Radial
  SW8, iConnectivity PlayAUDIO12): TWO identical machines run the same
  show in lockstep; every command goes to BOTH; failover is a SWITCH,
  not a scramble. **The grammar:** redundancy = a parallel twin ·
  failover = instant switch · twins hear everything always. **Mapped to
  us:** (i) cheapest and uniquely ours — every STAND is its own spare:
  on signal loss it keeps animating on its local clock (dead-reckoning)
  and resyncs quietly; (ii) optional hot-spare server in the room,
  stands re-home to it; (iii) piece #1's emergency menu = the manual
  override precedent.

**Requirement-shaping takeaways queued for the PERF walkthrough:**
follow-only stands in performance mode · the offline floor as redundancy
layer 1 (no modal errors on stage, ever) · the redundancy posture
question (stand-level only / + hot-spare server / + emergency menu) ·
keep the one-GO ceremony (piece #1's readiness → countdown → locked →
auto-stop already matches show-control practice).

## 2 · DESIGN

*(not started)*

## 3 · PLAN

*(not started)*
