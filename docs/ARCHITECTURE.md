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

**Status (day 45, 2026-10-19): PHASE 1 GATHER CLOSED → D96 — every scenario and
cross-cutting conversation settled (D82–D96); next = PHASE 2 HARDEN (organizer
chunk 9). The line below is the day-41 status, kept for the trail.**

**Status: PHASE 1 GATHER — 0a/0b done; ENS CLOSED (day 39, D82) · SEC
CLOSED (day 41, D85) · IND CLOSED (day 41, D86) · PERF CLOSED (day 41,
D87). Next: the ENGINE brief (approved charter — animation engine ·
network robustness · codebases · the composer-runnable test kit) ·
PORTAL scenario · CONTROLS · ANNOTATION-UX · mental models · 1c —
position and chunking in `docs/PERFORMANCE_SCORE_ORDER.md` (D84; ► next
= ENGINE vs PORTAL, composer's call). "Closed" = requirements settled, plan NOT drawn
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

#### PERF — iteration 1 (day 41 sitting 2): the engineering redirect (composer verbatim in COMPOSER_LOG)

**What the composer ruled / asked:**

- **The art-genre precedents are not the ask** — the animation is worked
  out. The ask: **proven, commercial-grade engineering models** — robust
  sync, smooth animation, redundancy — "video games, massive multiplayer
  games." **Engine/codebase selection delegated to AI expertise.**
- **Redundancy nod (preliminary):** the spare-machine idea "sounds good
  on top of the individual… machine clocks" — stand dead-reckoning +
  hot-spare machine.
- **THE CEREMONY REVERSAL:** piece #1's performance mode was "too
  onerous and fragile" — too many steps to start/enter the room, it got
  stuck, notification fiddling. **The performance score "ideally could
  just be started on the fly and not need a lot of locking or
  preparation."** This kills the survey takeaway "keep the one-GO
  ceremony": readiness roster · countdown · mode-lock are OUT. What
  survives for free: follow-only stands (ENS already gives stands no
  transport).

**AI reframe (proposed):** **PERFORMANCE = THE ENS ROOM, HARDENED.** Same
flow as rehearsal — con hits play, everyone follows — zero added
ceremony; the difference is entirely under the hood (redundancy,
robustness posture).

**AI star insight (proposed, to vet):** **after GO, the network is
optional.** The piece is a FIXED TIMELINE (~12.5 min): one GO
distributes a shared start anchor, and every stand can finish the entire
piece on its LOCAL clock. Typical device-clock drift ~20 ppm ≈ **15 ms
over the whole 750 s** *(estimate — empirical gate to measure real
devices, phase 2b)*, far under ensemble threshold. Network corrections
after GO are a luxury, not a dependency — **the show cannot be stopped
by the network once it has begun.** Redundancy reframes around this.

**Scope ruling proposed (the composer's "what needs discussed here"):**
PERF (this scenario) stays EXPERIENCE-level and is nearly done — the
concert flow is now: walk in → the ENS room → con plays → stands follow
→ piece ends. The engineering — **animation engine · network
syncing/robustness · redundancy machinery · codebase picks** — 
consolidates into one proposed **ENGINE chunk** whose deliverable is an
AI-prepared technology brief (game-engine patterns: authoritative clock,
interpolation, dead-reckoning; candidates incl. Colyseus vs hardening
piece #1's own protocol; rAF time-based rendering — drawAtTime already
is; wake lock; PWA/offline caching; WebSocket vs WebRTC-LAN), presented
for composer verdicts.

#### PERF — iteration 2 (day 41): a/b ruled — **PERF CLOSED** · the ENGINE charter

**Composer: "A Yes. As ruling. b yes to all three" (verbatim in COMPOSER_LOG):**

- **a — RULED: PERFORMANCE = THE ENS ROOM, HARDENED.** Started on the
  fly; NO ceremony — no readiness roster, no countdown, no mode lock
  (piece #1's performance mode: "too onerous and fragile"). Stands
  follow-only (already free from ENS). The concert flow IS the rehearsal
  flow; every difference lives under the hood.
- **b — RULED: all three redundancy rungs.** (1) **Self-sufficient
  stands** — after GO the show finishes on local clocks (fixed-timeline
  star; drift ≈15 ms over 750 s, ESTIMATE — empirical gate owed);
  (2) **hot-spare machine** in the room, stands re-home; (3) **one quiet
  podium gesture: resync-everyone.** None of it adds a step to starting.

**PERF is closed (requirements settled, plan not drawn). → D87.**

**THE ENGINE CHARTER (composer's words constitute approval of the chunk):**

- **The animation admission:** fine for composing, **"subpar for
  performance — jittery"**; piece #1's iron-out attempts didn't fix it;
  the bar = *"simple online video games… much smoother."* **License
  granted: the performance stand's renderer may be a DIFFERENT engine**
  than the composer/presentation scores use.
- **Delegation:** *"I lean on you for network robustness and engine"* —
  codebase/engine recommendation is the AI's to draft, the composer's to
  verdict.
- **The testing mandate:** empirical tests the composer can personally
  run with limited resources (possibly a few acquired machines),
  yielding **hard data** — becomes the ENGINE brief's third deliverable
  (a browser test kit: rAF inter-frame jitter histograms / dropped
  frames · long-task stalls · cross-device clock drift · renderer A/B on
  identical hardware) + cheap-device guidance.
- Renderer candidates to be argued in the brief (listed, NOT decided):
  compositor-transform-only SVG · canvas/WebGL (PixiJS-class) · **the
  repo's own ace: pre-rendered per-part VIDEOS via the proven frame-exact
  exporter** — smoothness by construction; sync reduces to seeking video
  by the room clock (a solved commercial problem).

### ENGINE — the technology brief (chunk 3.5, day 42, 2026-09-23)

Delivered for verdicts → **`docs/ENGINE_BRIEF.md`** (the full brief; this
is the pointer). Contents: the jitter diagnosis WITH AN ADDRESS (the
animation overlay is rebuilt from an SVG string via `innerHTML` every
frame; the engine around it — static sheet drawn once, pure time
functions, page-mode turns — is already retained-mode-ready) · renderer
candidates with a per-module recommendation (A fix-in-place for
IND/SEC/ENS · C pre-rendered per-part video for the PERF stand · B
PixiJS-class benched as measured fallback) · the sync model (state-tuple
dead-reckoning · NTP-style offsets · slew-never-jump · after-GO offline)
· codebase (own small Socket.IO server hardening piece #1's protocol;
Colyseus and WebRTC both REJECTED, reasons in the brief) · hosting
posture (D88: one always-on deployment serves all pieces) · the
composer-runnable TEST KIT spec (T1–T5). Verdicts V1–V4 close the chunk;
measured results become AR-N requirements in HARDEN.

#### PORTAL — login / join, iteration 1 (day 45, 2026-10-18 late; composer verbatim in COMPOSER_LOG)

**The double-check (composer: "I thought we did talk about this… a list of all the
players… assigning the parts… the players just get their own… hard to have a list") —
what the record holds, all three already ruled:**

- **ENS iteration 3 (day 38, adopted "a y"):** STANDING ROOMS — the ensemble's room is
  durable; **login → your part; codes never appear in the weekly flow.**
- **ENS iteration 4 (day 38):** pre-registration, no drop-ins; **con assigns players
  parts "like handing out paper parts"**; "at rehearsal, just login, no midflight
  changes". → a player↔part REGISTRY exists as a consequence.
- **SEC iteration 3 (day 41):** "I don't necessarily want the room Creator to have to
  scroll through a long list of players and the roster might change. and then how do
  we build the roster?" → LIVE ROOMS: sectionals read the registry, never build it;
  joiners self-select. *This is the "hard to have a list" memory.*

**What those leave open = this chunk:** the DOOR itself — how a player is registered
and how "login" happens with zero typing; con's entry; the composer's view; the
no-internet night; the leaked link.

**The scenario as given (composer):** the stand today = an iPad with a commercial PDF
reader (three pieces loaded, maybe a foot pedal, breaks between pieces to switch).
The analogy = PAPER PARTS: handed out (or collected) at the first rehearsal, taken
home to practice, brought to the venue to perform. "So we might have a different sort
of performance score" — *AI: no separate door; PERF = the ENS room hardened (D87).*

**Options put (AI), the door only — lettered, verdict pending:**
- **A — the link IS the part** (paper parts, digital): con sends each player a personal
  link/QR = that part in that ensemble; one tap, saved to the home screen; thereafter
  it is simply there, like a PDF in the reader. Registration = being handed the link.
- **B — one ensemble door, pick your name:** one link/QR for the whole ensemble; first
  tap shows the registered names; tap yours → your part; remembered on the device.
- **C — an account per player** (piece #1 made lighter): sign up once, join by code.
  Most identity, most steps; not recommended against "too clunky".
*AI recommendation: A, B as the large-ensemble fallback. Foot pedal → CONTROLS chunk.*

**Composer: "the lean is toward A" — then asked for the whole scenario from the
beginning, as the INSTRUCTIONS an ensemble would receive. THE FLOW AS PROPOSED (AI,
verdict pending):**

0. **The composer opens the ensemble** (admin = the composer only; no public sign-up,
   which also ends piece #1's spam bots): ensemble name + piece (+ the tailored
   version). The system makes the ensemble page and ONE conductor link. The composer
   emails the conductor that link. Nothing to download — a web page that installs
   itself as an icon ("Add to Home Screen").
1. **The conductor assigns:** the ensemble page lists the parts; con types a name
   beside each (optional — the only typing in the system). Each part has its own
   link + QR. Con hands them out by any channel — email in advance (how PDF parts
   go today), QR shown at the podium, or one printed sheet of QRs. Same links.
2. **The player (A):** tap the link or scan the QR → their part opens; one-time
   "Add to Home Screen" → an icon beside the PDF reader. From then on: the icon →
   their part. At home = practice, offline (IND). At rehearsal = already in the
   ensemble room; when con starts, it follows. Late = tap the icon, land in sync.
3. **Changes** = the same gesture: con edits the page, a new link goes out
   ("collecting their paper part and issuing a new part"). Two players on one part
   = the same link on two devices; each device is its own stand, annotations
   private per device.
4. **Con's own entry = the conductor link** (the ensemble page doubles as the
   podium: display + control roles). **The composer's view** = the list of
   ensembles × pieces. **No-internet night** = the hot-spare laptop on a hotspot;
   stands are already cached; the podium QR repoints them (HARDEN detail).

*The one decision put: the composer as the only admin (0), vs conductor self-serve.*

**RULED (composer): "A, me only."** The composer is the sole admin: opens every
ensemble, sends every conductor link. No public sign-up anywhere.

#### PORTAL — iteration 2 (day 45): the vet round, a–d (AI; verdicts pending)

Door A is taken as adopted ("the lean is toward A", then the whole flow walked on
it) — say so if not. What the flow leaves open:

- **a — one link per PLAYER, not per part (refinement).** Identity = the link. Two
  players doubling Tuba 3 = two rows on con's page ("Tuba 3 — Ann", "Tuba 3 — Bo"),
  two links. Then private annotations follow the LINK, so a new iPad (tap the email
  again) recovers them, and doubling never merges two players' marks. Cost: con
  taps "+ another player" for a doubled part.
  **Composer: "ostensibly option two, but then what's the mechanism?"** — the
  conductor's page lists the parts exactly as the piece defines them (Tempus: seven
  rows, nothing to add). Beside each part, one small button: **"add another player"**
  → a second row for that part with its own link. The composer never needs to know
  about doubling in advance; the conductor does it on the page, like handing out a
  second copy of a part. Fixed ensembles never tap it — one system, both cases.
  Re-tailoring to N parts (ENS iteration 4) remains the first answer for a large
  ensemble; the button is the fallback when the piece is not re-tailored.
  **RULED (composer): "good" — one link per player; "add another player" beside each part.**
- **b — the leaked link.** A forwarded link = someone else on that stand. Proposal:
  links are open (no passwords — a rehearsal, not a bank); con can REISSUE any
  player's link in one tap (the old one dies), the same gesture as a part change.
  Rate limiting server-side from day one (engine brief risk 6).
  **RULED (composer): "yes, option 2."** Open links · one-tap reissue (the old link
  dies) · rate limiting. **New deliverable named, parked to deployment:** the
  OPERATING INSTRUCTIONS must describe these scenarios, and a HELP PROTOCOL /
  FAQ must exist before the first ensembles ("I'll probably tell them to contact
  me as soon as possible with any issues… some sort of help protocol or
  mitigation setup beforehand… like an FAQ"). "We'll deal with that later."
- **c — the conductor link on two devices** = the ENS roles: big monitor shows the
  score, tablet controls (DISPLAY/CONTROL are roles, not devices — ENS it. 2). No
  new door for the podium. **CONFIRMED (composer): "y".**
- **d — versions follow the ensemble.** If the composer re-tailors the piece, the
  ensemble page points at the new version and every icon updates on next open
  (a web page, not a file). Players never re-install. *Property of A, stated.*
  **CONFIRMED (composer): "y".**

Banked onward: the no-internet night (hot-spare + podium QR repoint) → HARDEN ·
the composer's admin page (ensembles × pieces) → ARCHITECTURE/PLAN · the sectional
choice behind the icon = SEC as closed.

**PORTAL CLOSED (day 45, one sitting) → D90.** Requirements settled, plan not drawn:
the composer is the sole admin (opens ensembles, sends one conductor link; no public
sign-up) · the conductor's page lists the parts as the piece defines them, optional
names beside them, "add another player" for doubling · ONE LINK PER PLAYER, handed out
by any channel · the player taps once, adds to the home screen, and the icon IS the
part everywhere (home offline · rehearsal in the room · late in sync) · identity = the
link; private marks follow it · links open, one-tap reissue, rate limiting · the
conductor's link on two devices = display + control · versions follow the ensemble
page. Named for deploy step 14: operating instructions + help protocol / FAQ.

#### PARTS — the stand's part view, iteration 1 (day 45, 2026-10-18 later; composer verbatim in COMPOSER_LOG)

**Bound from upstream:** own part only, everywhere (D85) · a live VIEW of the score
data, no PDFs (D81) · the full-size iPad is the stand (day 43) · zoom one-part-at-a-time
is the conductor's display, not the stand (D82) · live engine in rehearsal, per-part
video in concert (D89) · the beating-frequency indicator idea parked here (day 35).

**Question 1 — what is on the screen besides the player's own notes? RULED "1":**
just the player's notes, plus the rehearsal number and the time in a corner. No cue
strip of other players (option 2, as paper parts carry cues — deferred: the score
animates, so position is never lost; cues return only if a rehearsal shows they are
missed).

**Question 2 — the beating-frequency indicator: RULED "1" — stays parked.** The first
version of the parts ships without it; the idea and its measured data (PLANNER, day
35) wait for a later version, after players have used the system.

**Question 3 — how much music per screen: RULED "good" — NOT decided on paper.** Set by
eye on the real iPad during the build (the full score shows ~12 s; a single part may
show more time, bigger notes, or both; the composer looks at a few sizes and picks).

**PARTS CLOSED (day 45, same sitting as PORTAL) → D91.** Requirements settled, plan not
drawn: the stand shows the player's own notes + the rehearsal number and the time in a
corner · no cue strip (deferred) · the beating indicator parked · the screen's time
span set by eye in the build · drawn live from the score data in rehearsal, the same
picture as video in concert. **Banked:** rehearsal numbers must still be AUTHORED into
the score (composer-module task, before the first ensemble — ENS iteration 3).

#### CONTROLS — the gesture vocabulary, iteration 1 (day 45, 2026-10-19; composer verbatim in COMPOSER_LOG)

**Bound from upstream:** IND's pinned default (D86 c) — swipe left/right = next/previous
page · one-finger tap = place cursor · two-finger tap = play/stop · three fingers or
long press = menu (annotate · jump · speed) · ENS stands: no room transport, local play
while the room is stopped (D82) · SEC stands: room transport, last command wins (D85) ·
tablet = fingers, laptop = mouse + keys · no stylus assumed.

**Question 1 — one vocabulary in every module? RULED "yes".** The gesture is the same
everywhere; what it DOES follows the module's rules already decided (two-finger tap =
local play in a full rehearsal while the room is stopped; = the room's play/stop in a
sectional; = play/stop when alone). A player never learns a second set.

**Question 2 — the foot pedal: RULED "no pedal functionality".** Nothing designed,
documented or tested for pedals. (Bluetooth page-turner pedals send keyboard keys; if
the laptop mapping below answers those keys, a pedal may work incidentally — not a
feature, not promised.)

**Question 3 — the laptop: RULED "yes".** Click = place cursor · space bar = play/stop ·
left / right arrow = previous / next page · a small on-screen menu button in a corner
(no three-finger press with a mouse). Nothing else; no shortcuts to learn.

**Question 4 — the conductor's remote: RULED "yes" — exactly the ENS set, nothing
added.** Start/stop · jump (tap a rehearsal number, or type a time) · "again" · speed
50/70/85/100 · the part buttons (tap = zoom that part on the display, tap again = back)
· the live position (rehearsal number + time, large). Anything missing surfaces in the
first rehearsal and is added then.

**Question 5 — pinch-zoom: RULED "no pinch zoom".** The part's size is chosen by eye in
the build; pinching would break one-screen-per-swipe and the page layout.

**CONTROLS CLOSED (day 45, same sitting) → D92.** The vocabulary, whole: TABLET — swipe
left/right = next/previous page · one-finger tap = place cursor · two-finger tap =
play/stop · three fingers or long press = menu (annotate · jump · speed); the same in
every module, the effect following the module's rules. LAPTOP — click = cursor · space
= play/stop · arrows = pages · a menu button in a corner. CONDUCTOR'S REMOTE — the ENS
set exactly. NOT: pedals · pinch-zoom · shortcuts.

#### ANNOTATION — the scribble, iteration 1 (day 45, 2026-10-19; composer verbatim in COMPOSER_LOG)

**Bound from upstream:** all marks private, no scopes (ENS iteration 2) · "mimic the
paper score", finger-first, few tools · anchored to (part, score-time), server-kept,
following the player everywhere, quiet sync (ENS iteration 3, IND) · no stylus assumed.

**Question 1 — the tools: RULED "yes, three tools only".** A pen (one colour, one
thickness, drawn with a finger) · an eraser (touch a mark, it goes) · undo (one tap
takes back the last stroke). No colours, no typed text, no shapes, no highlighter.

**Question 2 — entering and leaving drawing: RULED "good".** Menu → annotate → the
finger draws; swipes and taps do nothing else meanwhile; a small bar shows the three
tools + DONE; done returns the finger to normal; the room starting playback ends
drawing by itself and the part follows. (Modeless two-finger drawing rejected: too
easy to trigger on a stand.)
**REQUIREMENT ADDED (composer): "for this and actually everything, let's make sure we
test and calibrate it well… confirm that these gestures, in particular, more rare ones
like the three fingers, are universal across the platforms like Android and
potentially Amazon."** → an EMPIRICAL GATE for HARDEN: a gesture test (every gesture in
the vocabulary, on the iPad · the Fire · an Android device if one can be borrowed) run
by the composer, kit-style, BEFORE the build commits to the mapping. Known risk, NOT
verified here: iPadOS claims some three-finger gestures for the system (undo / copy /
paste swipes); long press — already the ruled alternative — is the safer path; long
press and two-finger touches need the browser's own callout / zoom behaviour
suppressed, which the no-pinch-zoom ruling already implies.

**Question 3 — the conductor's marks: RULED "yes" — no special conductor path.** Paper
conductor = pencil; a big monitor cannot be drawn on and the remote is not a score; a
conductor who wants digital marks uses a touch tablet in the display role and gets the
same three tools. Nothing else is built. (Closes the day-38 "via touch screen can
annotate main score somehow, lets discuss this more".)

**Question 4 — marks in the concert: RULED "yes but they should be able to toggle
them".** Marks are a layer over the per-part video (a build implication for renderer
C: the stand composites an annotation layer on the video, anchored to score-time).
A SHOW / HIDE MARKS toggle, per device, remembered. Possible: yes — the layer is
separate by construction. Where it lives: proposed as a fourth menu item ("marks
on/off"; amends D86 e "three items only" to four), two taps from anywhere.
**RESOLVED (composer):** the fourth menu item stands for every mode that HAS the menu.
**"I definitely don't want any menu available during the performance"** — while the
room plays, a stand responds to nothing (the ENS rule, now stated for the concert).
**OPEN, banked to a new conversation — THE PERFORMANCE PROTOCOL:** whether the stand
is *completely passive* at concert time, before and after the piece too ("maybe it's
simpler just… to be a completely passive stand for performance time"); if so, where
and when a player sets marks on/off for the night. Not decided here.

**ANNOTATION CLOSED (day 45, same sitting) → D93.** Three tools (pen · eraser · undo) ·
a clear in-and-out via the menu, the room starting ends drawing · no conductor path ·
marks show in the concert as a layer over the video, with a show/hide switch (fourth
menu item) · every gesture tested on every platform before the build commits (HARDEN
carry-in) · the concert-time stand's passivity → the PERFORMANCE PROTOCOL conversation.

#### PORTAL — iteration 3 (day 45, 2026-10-19): the handout made concrete (composer: "let's talk through those actual details")

**Proposed (AI), verdict pending — the three screens, in order:**

1. **The composer's admin page:** "New ensemble" → name + piece (+ version) → the
   system makes the ensemble page and ONE gatekeeper link. The composer writes an
   ordinary email to the gatekeeper with that one link in it. (The email does NOT
   carry the part links — the gatekeeper decides names and doubling, and the same
   page is later their rehearsal page.)
2. **The gatekeeper opens the link — the ENSEMBLE PAGE:** the ensemble's name, the
   piece, and a row per part (Flute · Clarinet · … / Tuba 1 … Tuba 10). Each row: an
   optional name box · that part's link · COPY · SHARE (the device's own share sheet:
   mail, message) · "add another player" · "new link" (reissue). Plus "print the QR
   sheet" (one page, every part's QR, labelled). Plus "Rehearsal" — the same page
   opens as the remote / display when rehearsal starts. **NO automatic email from
   the server:** it would need an email service, spam deliverability, and the
   gatekeeper typing every address — the gatekeeper sends the links themselves,
   however they like (one group email listing each part's link; one message per
   player; the QR sheet at the first rehearsal). Two taps per player with SHARE.
3. **The player taps the link in the email or message:** the part opens in the
   browser; a one-time hint says "Add to Home Screen"; from then on the icon. Lost
   the icon or new iPad = tap the same link again (nothing expires unless the
   gatekeeper reissues it). No account, no password, nothing to type.

**Rehearsal night, proposed (composer: "let's dig in on this"):**
- **The gatekeeper's link is an icon too** (the same "Add to Home Screen" hint). On
  the night they tap it; no email hunting. It opens ON THE REMOTE — start/stop, the
  letters, the speeds, the live position — filling the screen; a "Players" button in
  a corner opens the list (names, links, add another, new link) when needed. The
  very first open, before anything is handed out, lands on the list instead.
- **The player taps their icon → their part. Nothing else. Zero clicks.** The part
  opens where they last left it; the rehearsal number and time sit in a corner; a
  small dot says "in the room". The room's first jump or play snaps everyone
  anyway. The only thing that can appear on top: a thin banner when a small group
  is live ("Sectional — Flute Clarinet · join") — otherwise nothing. (Where "start
  a sectional" lives — a fifth menu item? — goes to the cross-check, 1c.)
- **The gatekeeper in a chamber ensemble is also a player:** two icons — their part,
  and the ensemble page. In chamber mode the remote matters little; any stand
  controls.

#### 1b — the composer's mental model, iteration 1 (day 45, 2026-10-19; verbatim in COMPOSER_LOG: the Tuesday rehearsal walk-through)

**The picture as given (the composer's sequence):** parts handed out BEFORE rehearsal
through ONE GATEKEEPER (the composer emails one person — leader, first violin — who
registers the rest and sends them off; "same as the tuba… probably better to have just
one gatekeeper anyways") · each performer has a bookmark, opens it at the stand ·
"let's try a playthrough" — one play button, or anyone? · rehearsal letters (E, F): one
person picks, or each flips? how to start on E · "a little slower" · "let me just hear
the flute and clarinet" — "probably the best way, just everyone plays" · scribbled
notes, do they save? · the pianist flips back while the leader talks · "piano, 4:10,
show me" — does the leader have to find and start it, or can she start herself? ("it
might be a little bit awkward for the leader to have to find the place and start it
every time, especially in these professional ensembles where there might not be just a
central leader. But I still want to keep the control simple") · F, repeats, slower,
from mid-F · the break: play and annotate independently "without having to open a
different type of score" · from the top · next day the violist opens the score and it
is "precisely as it did the night before", same interface, same entry, "no portal,
they just open up that page. Maybe there's a login".

**Mapped against the decisions (AI, same turn — the composer asked to "talk me
through"):** every step is covered by a ruling EXCEPT ONE. Covered: one gatekeeper =
D90's admin → conductor-link flow (the "conductor" is whoever leads) · the bookmark IS
the login, the page joins the ensemble's standing room on open (D90, ENS it. 3) ·
rehearsal letters exist as shared score data with one-tap jump + ~5 s pre-roll; one
person taps, every stand snaps (ENS; letters still to be AUTHORED — banked) · speed =
one tap, room-level (ENS) · "hear the flute and clarinet" = the room plays, the others
rest — nothing to build (composer's own preference) · scribbles save themselves,
private, no save button; drawing happens while the room is stopped (D93, D86) · free
browse while stopped, snap when the room moves (ENS) · the pianist starts HERSELF:
local play while the room is stopped (D82) — the leader need only say "4:10" ·
mid-F = tap a letter or a time, or click the display directly (D82) · the break = the
same page, local play + marks (D82, D86) · next day = the icon, the marks, the same
interface, no login (D90, D86).

**THE ONE GAP — who holds play/stop/jump in a chamber ensemble with no conductor.**
ENS ruled: stands have no room transport; the conductor's remote has it (D82). SEC
ruled: every stand has it, last command wins (D85). A professional septet rehearsing
without a conductor fits neither as written. PROPOSED (verdict pending): the ensemble
room carries ONE SETTING, chosen by the gatekeeper when the ensemble is set up —
**CONDUCTED** (one remote controls; stands follow; the tubas) or **CHAMBER** (every
stand can play, stop, jump a letter, change speed; last command wins — the sectional
machinery; Tempus). Nothing else differs. Alternatives: always headless (14 tubas'
taps fighting) · always conducted (a chamber group must nominate a device — the
composer's "awkward").

**The analysis as put to the composer (same sitting) — what CHAMBER means on the stand,
and the consequence the composer themselves flagged:** in chamber mode a player's
two-finger tap plays THE ROOM (every stand follows, last tap wins — D92's sectional
reading); so "piano, show me 4:10" = her tap moves everyone's stand, which the
composer already preferred ("just everyone plays"). But the BREAK then needs a way to
practise ALONE without moving the others: proposed, the "in the room" dot on the
stand is a one-tap switch — tap = alone (local everything), tap again = back in the
room (snap). The same dot is where a live sectional is joined. This fills a gap no
scenario had closed: HOW a stand moves between the ensemble room · a sectional ·
alone (SEC "one room at a time" + IND "no room" assumed it without a control). In
CONDUCTED mode the two-finger tap is local play while the room is stopped (D82) and
the remote plays the room; the dot works the same way.

#### 1b — iteration 2 (day 45): the conductorless analysis, two issues, and THE TRACKING LIST

**The AI's analysis of conductorless rehearsal (general knowledge, flagged unverified):**
quartets and chamber groups play from their OWN PART, the full score studied at home;
the Orpheus-type leader plays and leads from the first chair, part on the stand, score
studied; where to start is SAID ("from E"), the start is a PHYSICAL CUE, nobody
operates anyone else's part. → the controls in such groups are words and gestures, the
giver changing moment to moment.

**The composer's two issues (verbatim in COMPOSER_LOG) and the ETHOS: "recreate or get
close to the paper score situation."**

**ISSUE 1 — THE STUDY SCORE (new):** any member may want the FULL SCORE to sit and
study without the instrument, and annotate it; also their part; marks perhaps copied
across. "Make sure that our decisions from before, just annotations, are compatible."
*Tracked; its own short conversation after issue 2.*

**ISSUE 2 — start/stop and independence, the composer's picture:** ONE CENTRAL CONTROL
("I don't necessarily want everyone to have control… maybe it's cleaner"), the leader
(e.g. the violinist) has her part and can bring up the full score to refresh her
memory; the rest flip pages and annotate freely, like paper; "let's take E" → they
flip there themselves; when the leader hits go, every screen jumps to E and starts,
"with some sort of lead in or whatever… or probably not, maybe"; "a play mode where
the scores are synced, and then as soon as that play mode stops, the scores aren't
necessarily synced anymore."
*AI read-back: this IS the full-rehearsal rule already ruled (D82 — stands free while
the room is stopped, snap and follow when it plays; one remote; the jump lands ~5 s
early, ENS iteration 3). Applied to chamber groups too → NO per-ensemble switch; the
CONDUCTED/CHAMBER proposal and "the dot" for alone-practice are SUPERSEDED (local play
while stopped already covers the break).* **New question it leaves:** how a PLAYING
leader holds the control. Proposed: the gatekeeper ticks "leader" on one player's row;
that stand alone carries a thin control strip (play/stop · the letters · speeds); the
conductor's remote is the same thing on a device with no part. Alternative: the
leader's phone as the remote beside the iPad.

**THE LEADER'S STRIP, as proposed (composer: "talk through precisely what that strip
would look like… does it collapse or slide away?"):**
- **Where:** a thin band ABOVE the music, the full width of the screen; the part draws
  below it in the remaining height. Nothing is ever covered.
- **Left to right:** PLAY/STOP (one button, large enough to hit) · AGAIN · the
  rehearsal letters as small buttons (A B C D E F …) · the four speeds · a small
  TIME box (tap, type 4:10, go) · the live position (letter + time).
- **A letter tap snaps every stand to that letter** (the room is stopped); then PLAY.
- **On go: the strip STAYS, same height, nothing on the screen moves.** Everything
  but STOP and the position greys out — while the room plays, nothing else applies.
  (Sliding away was rejected: stopping would then cost a tap to reveal it first.)
- **On stop:** the buttons come back. Below it the leader's part works exactly as any
  player's (swipes, taps, the menu).
- **BOTH forms exist, same controls:** the strip on the leader's stand (the default:
  one icon, one explanation) and the same set full-screen on a phone or tablet with
  no part — the conductor's remote, or a leader who prefers a second device. The
  gatekeeper ticks "leader" on a row to give a stand the strip; the ensemble icon's
  "Rehearsal" is the stand-alone remote. **Decide by use:** the composer asks the
  first ensembles which they prefer and watches what problems arise.
- **"No remote at all" for a chamber ensemble** = no leader ticked: every stand is
  free, nothing snaps, playing together is by nod only, the scores run independently.
  Kept as a possibility the composer is "open to considering"; not the default.
- **RULED (composer): "good" — in principle.** Its DESIGN (transparency, real estate,
  height) is done BY EYE together with the part scores in the build — the same
  sitting that sets the part's size (D91). "Let's make sure we pay attention to its
  design."

**THE TRACKING LIST (composer: "keep track… organize and resurface"):**
1. ✓ The study score — closed (three questions).
2. ✓ How the playing leader holds the control — the strip (and the remote as
   the second form); design by eye in the build.
3. ✓ The lead-in on a jump: ~5 s RE-CONFIRMED ("That's fine… the same with any
   time… 4:15, it'll start at 4:10"). Letters and typed times alike.
4. ✓ How the leader names the spot: both on the strip (letters + the time box).
5. How a player joins a live sectional from the stand (the dot's surviving job) —
   to the cross-check (1c), with "start a sectional" placement.
6. ✓ The Tuesday list: all thirteen checked. The pianist (step 10) never gets the
   strip — her two-finger tap plays her own stand only (D82). **Confirmed: a letter
   tap on the strip jumps every stand AT ONCE, before play** ("the immediate jump is
   fine"); players may still flip there themselves when the leader only says it.

**1b CLOSED (day 45, one long sitting) → D94.** The composer's picture, in one line:
*"recreate or get close to the paper score situation"* — and it turned out to equal
the full-rehearsal rule already ruled, applied to every ensemble. Item 5 (joining a
sectional from the stand; where "start a sectional" lives) → the cross-check 1c.

#### THE STUDY SCORE (day 45, from 1b issue 1; composer: "make sure that our decisions from before, just annotations, are compatible")

**The AI's analysis — it fits, little to add:**
- The full score already exists as an animated page (the composer / presentation
  score; the conductor's display). A player's part is a VIEW of the same data (D81);
  the full score is simply the other view. Nothing new to draw.
- Private marks (D93) are stored as (player · which view · score-time · the stroke).
  Marks made on the full score live on the full score; marks on the part live on the
  part. NO automatic copying between them (the composer: "maybe they copy over" — by
  hand, if they want). Compatible as ruled.
- Studying without the instrument = the part or the full score, alone, offline, with
  the three tools — exactly IND (D86) with a second view.

**Three questions put, one per turn:** (1) how a player opens the full score — a menu
item "full score / my part" (the menu's fifth item) vs a second icon from the
ensemble page; (2) pinch-zoom on the STUDY score only (ten lanes on an iPad are small;
the study score is never a synced stand, so the no-zoom reason does not apply);
(3) when the room starts playing while a player is on the full score — the stand
returns to their part (stands follow; "she wouldn't be playing from it").

**Question 1 — RULED "1": the menu.** "Full score" / "my part" is the menu's FIFTH item
(the menu is now: annotate · jump · speed · marks on/off · full score). One tap from
anywhere, for the leader's "let me just check" moment.

**Question 2 — zoom on the study score. The composer put a third candidate beside
pinch-zoom and no-zoom: the notation workshop's FIXED ZOOM** (verbatim in
COMPOSER_LOG) — tap ZOOM → about double, the score REPAGINATES (each page now half
the time), the same left/right swipes turn pages, up/down swipes reach the parts that
do not fit, tap again → out. **Side by side (AI):** NO ZOOM — simplest rule; seven to
ten lines on a ten-inch screen too small to study. PINCH — familiar; but adjusted
every time, horizontal + vertical panning, the page dissolves, swipes collide with
pans. FIXED ZOOM — pages stay pages, the same swipe vocabulary, no fiddling, ONE new
gesture (up/down, only here); ALREADY BUILT in the notation app and the SAME
mechanism as the conductor's display zoom (D82) — one thing to build, not two. The
"one or two parts at a time" variation is left aside: "my part" already is the
one-part view. *AI recommendation: the fixed zoom.*
**RULED (composer): "yes, fixed zoom."** A ZOOM button on the study score: about
double, repaginated, left/right swipes turn pages, up/down swipes reach the rest of
the lines, tap again to return. Pinch stays off everywhere.

**Question 3 — RULED "yes, back to the part."** When the room plays, a stand on the
full score returns to the player's part and follows; the full score is for stopped
moments. (The full score following along is the conductor's DISPLAY role, not a
player's stand.)

**THE STUDY SCORE CLOSED (day 45):** the full score as the menu's fifth item · marks
per view, no copying · the fixed zoom (double, repaginated, same swipes, up/down) ·
back to the part when the room plays. Folds into D94 with 1b.

#### PERFORMANCE PROTOCOL (chunk 6.5, day 45, ~2 a.m.; composer: "fill me in on what you understand the version to be, and then I'll give my comments")

**The performance as the record has it (AI's read-back, from D87 · D89 · D90 · D93 · D94):**
- BEFORE: players arrive, tap their icon → their part, in the ensemble's room (D90).
  The part's VIDEO is already on the device (cached — the offline floor); the clock
  calibrates silently at warm-up (HARDEN carry-in). Marks on/off set from the menu
  while stopped (D93). The leader has the strip, or the conductor the remote (D94).
- THE START: on the fly, no ceremony — no readiness roster, no countdown, no mode
  lock (D87). The leader taps PLAY; every stand's video starts together.
- DURING: stands follow only; nothing on a stand responds (D93 "no menu during the
  performance"); the per-part VIDEO (renderer C, D89) with the player's marks
  overlaid; after GO the network is optional — the show finishes on local clocks
  (D87 rung 1); the hot-spare laptop on a hotspot if the server dies (rung 2); ONE
  quiet podium gesture, resync-everyone (rung 3).
- THE END: the video ends; the stand rests on the last page.
- IF IT FALLS APART: the leader taps STOP, a letter, PLAY — a restart from a letter
  with the usual 5 s lead-in; no recovery UI on stage (D87).

**Gaps the read-back exposed (AI), put to the composer as the open points:**
1. **How does the stand know it is concert night?** D89 says video (C) for the concert
   stand, live drawing (A) for rehearsal; nothing yet selects C. Proposed: ONE SWITCH,
   "concert", on the leader's strip / the ensemble page — flipped for the night,
   flipped back after. The same switch can make the stands PASSIVE before and after
   the piece (the composer's open question): no menu, no local play, marks as set.
   One switch, not a ceremony (D87 rejected the ceremony, not a switch).
2. **The very first note:** from 0:00 there is nothing before the first note. A short
   lead-in at the top (the cursor starts a few seconds before 0:00) or none (the
   leader's nod is the cue; PLAY = the downbeat).
3. **Restart from a letter on stage** — allowed via the strip (STOP · letter · PLAY)?
4. **Speeds in concert:** 100 only; the strip's speed buttons do nothing under
   "concert".

**Composer: "When does this happen?" (the video on the iPad; the clock calibrating) —
answered, and it becomes PROTOCOL:**
- **The video** downloads the FIRST time the player opens their link (at home, the
  day the link arrives) and stays on the device; on the night nothing downloads.
  If the iPad has thrown it away (tight storage; long unused — Safari's eviction
  of unused site data is a known, unverified risk for pages NOT on the home screen),
  the stand fetches it again when opened, with a progress bar, over the room's
  Wi-Fi or the player's data.
- **The clock** measures itself against the server the whole time the stand is open
  in the room; FULL calibration needs ~10 minutes of that (the kit: an 8-minute
  baseline, ≥ 30 trusted samples, σ ≤ 5 ppm; the rate must be measured EVERY
  session — it moved 6 ppm in 2 h). A stand opened at the last second still runs
  in time while the network is up; it only loses margin (up to ~20–30 ms by the
  end of the piece, measured) if the network then dies mid-piece.
- → **The protocol line: "open your part when you sit down to warm up, not at the
  downbeat."** Both happen by themselves from there.
- **A ready sign, not a gate:** the stand's dot turns green when the video is on the
  device and the clock is calibrated; the leader's strip shows "6 of 7 ready". An
  indicator only — nothing stops PLAY (D87: no readiness ceremony).

**CONCERT NIGHT, walked through (composer's ask; AI's read-back, "concert" switch
assumed as proposed):**
- **Sound check.** The other pieces live in the PDF app. For this piece each player
  taps the icon once: the part opens, the stand checks the video is on the device
  (fetches it if not), joins the room, starts measuring the clock; the dot goes
  green within ~10 minutes. The leader opens the strip, sees "6 of 7 ready", flips
  "concert" (proposed), runs one pass — a letter, play, stop — every stand follows;
  that pass is the sync test. Then everyone switches back to the PDF app.
- **During the other pieces.** The page is SUSPENDED behind the PDF app: the
  connection drops, the clock calibration is KEPT (stored). → HARDEN requirement:
  keep the calibration across a suspend and re-verify it on return. A sound-check
  calibration reused three hours later carries the measured ~6 ppm/2 h drift ≈ a few
  ms over the piece — covered by the network corrections while the network is up.
- **This piece is next.** Players tap the icon: the page reconnects in a second or
  two, the dot is green, the stand sits passive at the top of the part. The leader
  sees "7 of 7 ready". Nod. PLAY.
- **At PLAY — what the server does.** ONE message to every stand: "start at server
  time T", T a second or two ahead so every stand has it before T. Each stand turns
  T into its own calibrated clock, pre-rolls the video, starts it exactly at T. From
  then on each stand runs on its own clock; the server keeps answering the small
  clock checks; corrections are early-and-tiny (the floor rule); if the network
  vanishes nothing changes on stage.
- **The end.** The video ends; stands rest on the last page; players switch to the
  PDF app for the next piece. After the concert the leader flips "concert" off.
- **The server through all of it:** before — holds the room, answers clock pings
  (dozens a minute per stand), serves the video if a stand lacks it, counts ready
  stands; at play — one message; during — pings only, nothing the show depends on;
  the hot-spare laptop at the venue can run the same server on a hotspot, stands
  re-home by the QR.

**TRACKING LIST (performance protocol):**
A. ✓ **THE "CONCERT" SWITCH — RULED "yes".** One switch on the leader's strip (and the
   remote), on at sound check, off after. On: every stand shows the per-part VIDEO
   (renderer C) · every stand is PASSIVE (no menu, no local play, no swipes; sits at
   the start, waits for PLAY) · speeds locked at 100 (item E folded in) · marks as
   each player last set them (set BEFORE the switch). Still live: play/stop, the
   letters, the ready count. Rejected: no switch (video + passivity tied to "room
   playing" — a stray touch before the piece; rehearsal jumps on video seeks).
B. Suspend behind another app → HARDEN, sharpened by the composer's question ("does the
   app have to be on focus for the 10 minutes?"): the clock is measured ONLY while the
   part is in front (a background page on iPad is asleep; timers stop, the connection
   drops). The ten minutes need NOT be continuous: the stand must KEEP its samples
   (persistently — iOS may discard a suspended page outright) and ADD to them on
   every return; the device clock keeps running through a suspend, so samples from
   5:00 and 5:20 fit one line — the wider span even sharpens the rate. The kit
   calibrated from continuous samples only; accumulating across visits is NOT built
   and NOT tested → a build item with a kit test. Protocol line: "open it early and
   leave it in front for a few minutes when you can; every return adds." Uncalibrated
   with the network up is still in sync; calibration is the margin for a network
   failure.
C. ✓ The first note — RULED "2": the same ~5 s lead-in at the top as everywhere else;
   PLAY runs the cursor through empty space to the first note; one rule, no
   exception. (Build note: the per-part video must carry those seconds before 0:00.)
D. ✓ Restart from a letter on stage — RULED "1": the letters stay live on the strip
   under "concert"; STOP · letter · PLAY restarts everyone with the lead-in; no
   emergency screen; the strip responds only while stopped, so nothing is hit by
   accident.
E. ✓ Speeds locked at 100 under "concert" — folded into A.
F. Device lines for the instructions: Auto-Lock never · Low Power off · plugged in ·
   "open your part early; leave it on screen when you can; every return adds"
   (composer: "we'll have to have that in the instructions").
   **Answered (composer's two cases):** (i) the iPad left on the stand for an hour
   with the part in front = the best case — the wake lock keeps the screen on, the
   measurement runs the whole hour, fully calibrated by the downbeat; if the screen
   does go dark, the page sleeps and resumes on wake. (ii) The 10 minutes never
   completed = THE PERFORMANCE IS STILL POSSIBLE; the system never refuses to play.
   With the network up during the piece there is no visible difference (live
   corrections). Only if the network ALSO dies mid-piece does an uncalibrated stand
   free-run: measured iPad drift +28 ppm ≈ 21 ms over the 12.5-minute piece; two
   uncalibrated devices 43 ppm apart ≈ 32 ms by the end — the worst case, two
   failures at once, and still under the ~30 ms a reader's eye tolerates (the
   one-notehead threshold). A partial calibration is never WRONG: the quality bar
   (≥ 30 samples, σ ≤ 5 ppm) passes it or the stand stays uncalibrated. "6 of 7
   ready" means one stand is uncalibrated, not broken; the leader plays anyway.
G. ✓ The hot spare — RULED "1": OPTIONAL, at the composer's discretion; described in
   the instructions; the composer brings it to the first concerts; never a burden
   on every ensemble (the case it covers — the server dying between sound check and
   the downbeat with no way to restart it — is narrow).
H. **MIXED DEVICES (composer: "some people are using Androids, some people are
   using PCs").** By design fine: the stand is a web page; every device syncs ITSELF
   to the server, so a room of iPads, Android tablets, Windows laptops and a Fire is
   the normal case, not a special one. Evidence in hand: the kit ran on four kinds
   (desktop Chrome · Windows laptop Chrome · iPad Safari · Fire Chromium) — every
   test, none errored; the beacon filmed an iPad and a laptop 7.7 ms apart = the
   mixed-device proof already. Not yet in hand: a true Android tablet (the Fire is
   Android-based Chromium, close but not identical) → borrow one for the gesture
   test (HARDEN carry-in). Per-device differences the build must absorb: screen
   size (the part's size is set by eye on the iPad; a laptop scales up; phones are
   not stands) · one video file serves all (scaled) · Safari vs Chromium video
   paths (both measured, both repaired in 3.8).

**PERFORMANCE PROTOCOL CLOSED (day 45) → D95.** The night: open early (the video is
already there; the clock measures while in front, accumulating across returns —
build item B) · the leader flips CONCERT at sound check (video · passive stands ·
speeds locked · marks as set) · one pass as the sync test · back to the PDF app ·
this piece: tap the icon, "7 of 7 ready", nod, PLAY · ~5 s lead-in at the top · the
server sends one "start at T"; after that the network is optional · a restart =
stop · letter · play · the end rests on the last page · the spare laptop optional.
A stand that never calibrated still plays (worst measured case ~32 ms by the end,
only if the network also dies). Mixed devices are the normal case.

### 1c + 1d · THE CROSS-CHECK (day 45, ~3 a.m.) — every ruling against every other

**Pass 1 (AI; ENS · SEC · IND · PERF · ENGINE · PORTAL · PARTS · CONTROLS · ANNOTATION ·
1b · STUDY SCORE · PERFORMANCE PROTOCOL re-read). Clean: ~30 pairs checked agree
(the link = the login = IND's "log in once" · own part everywhere · marks private
and per view · the strip = ENS's controller with live position · the remote form
keeps the ten part-zoom buttons for the display, the strip form does not · the
spare optional vs the mechanism required · passivity under CONCERT vs the clock
still measuring · a player's menu "jump" is local in the ensemble room, the
strip's letter is the room's). FINDINGS, heaviest first:**

1. **HOME PRACTICE vs THE STANDING ROOM (conflict).** D94: the icon opens the part
   "in the ensemble's room", zero clicks; the leader's strip PLAY is the room's.
   So the leader practising at home with the strip would move every other stand
   that happens to be open at home. IND wants "no room at all" alone. PROPOSED: the
   leader's switch becomes THREE-WAY — ALONE (default: every stand is its own; the
   strip's play is local) · REHEARSAL (stands join and follow the strip) · CONCERT
   (video, passive). The leader flips it at the start and end of a rehearsal;
   players still click nothing. Sectionals form under REHEARSAL (break-off) or
   under ALONE (an independent meet-up). **RULED "Y" — the three-way switch.**
2. **THE ROOM CHOICE (gap).** SEC: "the room choice shows the ensemble room + any
   sectional live now"; D94 gave the icon zero clicks and proposed a banner for a
   live sectional; "start a sectional" has no home. PROPOSED: the stand's DOT is
   the room choice — tap it: Ensemble ✓ · Sectional (Flute Clarinet) · Start a
   sectional · Leave. Not a menu item. Passive under CONCERT. **RULED "Y".**
3. **RESYNC DURING THE PIECE (conflict).** PERF rung 3 = "one quiet podium gesture:
   resync-everyone", mid-piece; D94: the strip greys to STOP + position on go.
   PROPOSED: RESYNC is the one other button live during play, on the strip only
   (leader's hands). Alternative: drop rung 3; the restart (stop · letter · play,
   D95) is the only recovery. **RULED "1" — STOP and RESYNC live during play.**
4. **NO SOLO PLAY INSIDE A SECTIONAL (consequence to confirm).** D85 headless + D92
   "two-finger tap = the room's play in a sectional" ⇒ your tap moves the group;
   SEC it. 2's "local play while stopped carries" cannot also hold. Practising
   alone = leave the sectional (the dot). Confirm, or give the sectional's creator
   the strip instead (one control, as D94) — which D85 rejected ("no leader").
   **RULED "1" — accepted: inside a sectional your tap moves the group; practise
   alone = leave via the dot.**
5. **THE MENU IS FIVE ITEMS** (annotate · jump · speed · marks on/off · full score)
   against D86 e "three only". **RULED "1" — five, and its DESIGN gets a sitting
   by eye in the build, like the strip** ("let's take some time to design, like
   strip").
6. **THE DISPLAY DEVICE (small gap).** D94: the conductor's icon opens the remote;
   nothing makes a big monitor "the display". PROPOSED: a "show the score here"
   button on the remote turns that device into the display (ENS roles). **RULED "Y".**
7. **MARKS ON/OFF BEFORE THE CONCERT SWITCH** — an instruction line (players set it
   at sound check; or the leader flips CONCERT last).
8. **REHEARSAL LETTERS MUST BE AUTHORED** into each piece before its first rehearsal
   (composer-module task) — a PLANNER to-do for Tempus; nothing in the system
   invents them. *(7 → the instructions; 8 → PLANNER, before Tempus's first rehearsal.)*

**Pass 2 (AI; the pass-1 rulings against everything):** clean. One refinement recorded,
no decision needed — the dot's LEAVE appears only inside a sectional (back to the
ensemble room); in the ensemble room under REHEARSAL a stand cannot leave (it would
stop following the leader and confuse its player); under ALONE there is nothing to
leave. Under ALONE a stand keeps a light connection when online — for quiet mark
sync and to join by itself the moment the leader flips REHEARSAL. Nothing new
surfaced. **GATHER CLOSED (day 45) → D96.**

## 1.5 · HARDEN — the frozen requirements live in `docs/REQUIREMENTS.md`

Phase 2 (2a classify · 2b empirical gates · 2c adversarial pass · 2d freeze) is
written as ONE register: **`docs/REQUIREMENTS.md`** — AR-1…AR-71, each with class ·
state · source decision · why; §K the seven empirical gates (E-1…E-7); §L the
adversarial pass; §M the out-and-rejected list. Drafted and **FROZEN day 45
(2026-10-20; composer: "Freeze") → D97.** Phase 3 designs against the AR-IDs.

## 2 · DESIGN — lives in `docs/DESIGN.md`

Phase 3 (3a draft with alternatives rejected · 3b scenario replay · 3c composer
review · 3d risk spikes) is written as **`docs/DESIGN.md`**: the parts of the
system · the data model · the protocol (eleven messages) · the floor clock reused
with persistence across sleeps · the one-tuple transport read by the live engine
(through transport.js's injectable timebase) and by the video servo · THE STAND'S
STATE MACHINE (ALONE · REHEARSAL stopped/playing · SECTIONAL · CONCERT
stopped/playing × every input) · the renderers (A2 live, C video + the marks
layer) · the door concretely · hosting and the spare · the offline floor · the
build surfaces · twelve rejected alternatives · the replay of every scenario · seven
risk spikes. Drafted day 45 (2026-10-20); **composer review pending** → D98.

*(not started)*

## 3 · PLAN

*(not started)*
