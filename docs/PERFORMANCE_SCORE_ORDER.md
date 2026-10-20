# PERFORMANCE SCORE — RUNNING ORDER & BRIEF

> **What this is (composer's ask, day 41, 2026-09-01):** the standing organizer
> for the performance-versions arc. The composer works in **fits and spurts** —
> short sittings, possibly weeks apart. This file is the position and the brief.
> *Composer:* "I'll be doing it in fits and spurts… relatively small digestible
> chunks… if I do a little bit and then stop for a couple weeks, I can ask for
> the brief and know exactly… what I was doing and what needs to be done next."
> *(Full words: RUNNING_LOG day 41, entry 40.)*
> Detail lives in `docs/ARCHITECTURE.md` (the workflow + everything gathered so
> far) and `docs/PLANNER.md` (the paper to-dos). This file POINTS; it does not
> duplicate.

## HOW TO RESUME (the contract)

- Composer says **"brief me"** (or "where are we on the performance score", or
  just `/session-start` — journal §2 points here).
- AI reads THIS FILE and answers with exactly three things: **last sitting**
  (one line) · **the active chunk ►** (what it is, what "done" looks like) ·
  **what comes after** (one line). Nothing else. Then work.
- **► marks the active chunk · ☑ marks done** — updated the moment a chunk
  wraps, not later. At every wrap the AI states: what finished · what's next ·
  where we are in the order.
- **Reorganizations land only on composer approval** — the order in this file
  is always the approved one. Survives every clear.
- A sitting = ONE chunk (two if they're small). Stopping mid-chunk is fine —
  the POSITION LOG line says exactly where the needle stopped.

## WHERE THIS STANDS — what already exists (the summary)

**The piece is finished and submitted** (Penn State composition form,
2026-09-01). What exists for PERFORMING it:

- **The animated score itself** — the app renders the whole piece (`db1`,
  0–751 s), and the notation engine is **external-clock-ready**: pages draw by
  pure time functions (the video exporter proved frame-exactness). Driving it
  from a shared room clock is a clock-source swap, not a rewrite.
- **Print score 69 pp** (cover · Performance Instructions as p. 2 · 67 music
  pages; rebuilds in 3 s) · **video** (V-CUT archived, on YouTube) · **five
  demo videos** linked from the instructions page.
- **ENS (full-ensemble rehearsal) requirements CLOSED** (day 39, D82): zoom
  view = click a part → zoom, click again → off (phone: 10 toggle buttons) ·
  **local play on a stand while the room is stopped** · looping RESCINDED
  globally · podium = DISPLAY-client vs CONTROL-client split.
- **Prior-art inventory DONE** (day 38, in ARCHITECTURE.md): piece #1 is LIVE
  at justinwenloyang.com (Socket.IO rooms, server clock, leader-gated
  transport, the full performance ceremony) with six named pain points;
  piece #2 contributed the three-scores separation + pre-baked O(1) lookups.
  **This repo has ZERO network code — greenfield, #1 is the reference.**
- **The governing philosophy (composer, verbatim — binds every module):**
  *"lean simple to use not feature rich but robust and can do all the main
  functions really well."* The robustness bar SPLITS: rehearsal recovers in
  seconds; performance is the hard case.
- **The workflow** (ARCHITECTURE.md): GATHER → HARDEN → ARCHITECTURE → PLAN →
  build. **We are mid-GATHER**: ENS done, the rest is the order below.
- Paper side: **Rehearsal Score Build and Performance Score Build are named
  to-dos** (PLANNER, day 37); what distinguishes them is deliberately
  UNDECIDED — the composer's question, never assumed.

## DEPLOYMENT — RULED (2026-09-23, day 42 → D88)

- **All pieces read the SAME modules.** The system is piece-independent
  infrastructure; each piece is content.
- **Deployment #1 = TEMPUS (`septet_2026`)** — first in ORDER because
  it comes due first. Its dates, held for AWARENESS only: selection
  ~Oct 29 = score + parts due (4 weeks before the Nov 26–28 Leipzig
  concerts). **Amended same sitting: modules get built for ALL pieces
  regardless of acceptance — an acceptance = a user-testing
  opportunity. The AI does not manage deadlines; dates inform the
  order, nothing more.**
- **Parts delivery = the rehearsal/performance modules themselves;
  paper parts PRO FORMA** (festival formality — Tempus repo 2c).
- **This piece (undated) becomes a port target like the others**;
  features/updates continue during Tempus rehearsals.
- Consequences for the order: **ENGINE stays ► (written against Tempus
  devices first) · PORTAL returns to the critical path · a HOSTED
  posture joins the ENGINE brief · CONTROLS / ANNOTATION-UX /
  mental-models / vet fall after the Tempus deployment.** The re-cut
  of the order is proposed after the ENGINE verdicts — lands on
  composer approval, as always.
- **RE-CUT REFUSED (composer, day 45, 2026-10-18): THE WHOLE SYSTEM FIRST.**
  *"I think we will have the time to… finish the entire plan, to roll out the
  whole system. That may be… better than to ship something, one part of it,
  and then… ship an amended part… let's aim to build the entire plan and the
  entire build."* The order below stands unchanged. **Dates as the composer
  said them (awareness only):** Tempus notification "early November"; parts
  "November 1st or first week of November is realistic". **A composer-run
  TEST STAGE after the build is owed** (composer: "do we have a testing stage
  for when things are built that I can test myself here?") — the PLAN step
  writes it in explicitly: built chunks tested by the composer at home on
  the iPad · laptop · Fire before any ensemble sees them.

## THE WHOLE ARC — TOP LINE (day 42; the composer's ask. The chunk
order beneath is unchanged — this is the same arc in one glance.)

**DECIDE — what the system must be**
1. ☑ Scenarios gathered: ENS · SEC · IND · PERF (D82, D85–D87)
2. ☑ ENGINE verdicts: renderers per module · own server + floor rule ·
   Hetzner · kit approved (D89)
3. ☑ KIT BUILT + VERIFIED (day 42, Opus) — `testkit/`, see 3.6
4. ☑ KIT RUNS on real machines (2026-10-18: desktop · iPad · laptop · Fire · beacon) — every ESTIMATE becomes a number
   (the composer's step: testkit/README.md is the run protocol)
5. ☑ PORTAL gather (CLOSED day 45, 2026-10-18 late → D90; one sitting)
6. ☑ PARTS gather (day 45 → D91) · ☑ CONTROLS (day 45 → D92) · ☑ ANNOTATION-UX (day 45 → D93) · ☑ mental models + the study score (day 45 → D94) · ☑ PERFORMANCE PROTOCOL (day 45 → D95) · ►
   final vet (compressible per D88)
7. HARDEN — requirements frozen with the measured numbers (AR-IDs)
8. ARCHITECTURE — the design, composer-reviewed
9. PLAN — build chunks enumerated, per-phase verification, model map

**BUILD — Opus, chunk by chunk (order finalized at 9; expected shape)**
10. The engine fix (A) in the stand renderer
11. The server — rooms + clock + floor rule — live on Hetzner
12. The stand app: IND solo → ENS/SEC rooms → PERF hardening + the
    video concert stand (C)
13. PORTAL build (join links / QR)

**DEPLOY — Tempus first (D88)**
14. Tempus content in: per-part videos rendered · deployed · delivered
    rehearsal-ready (+ pro forma paper parts) **+ the OPERATING
    INSTRUCTIONS and a HELP PROTOCOL / FAQ (composer, day 45: the stray-link
    and reissue scenarios described; "contact me as soon as possible with
    any issues" for the first ensembles; set up BEFORE the first ensemble)**
15. Tempus rehearsals = live burn-in; features/updates continue for
    the later pieces
16. Ports: the tubas and each next piece as they come due

*(The paper thread P1–P4 runs beside all of it, independent.)*

## THE ORDER

*(one chunk ≈ one short sitting · GATHER chunks are conversation: composer
dictates, AI logs verbatim + vets, iterations until closed — the same loop
that closed ENS in four iterations)*

1. ☑ **SEC — sectional / small-group scenario** (CLOSED day 41 → **D85**;
   four iterations, one sitting). Two contexts one module · on-the-fly
   groups · **LIVE ROOMS ONLY** (the room is who's in it; nothing stored) ·
   headless control, last command wins · own part only · ensemble features
   carry · human tie-back · one room at a time · demos zero-integration ·
   roster = read-only registry. Full record: ARCHITECTURE.md § SEC.
2. ☑ **IND — individual practice scenario** (CLOSED day 41 sitting 2 →
   **D86**; two iterations). Serverless solo (the offline floor IS the
   module; quiet annotation sync) · swipes = pages · pinned taps (cursor /
   play-stop / menu) · menu = annotate + jump + speed, nothing else ·
   **the looping door SHUT — loops dead everywhere**. Full record:
   ARCHITECTURE.md § IND.
3. ☑ **PERF — the performance-module scenario** (CLOSED day 41 sitting 2
   → **D87**; precedent survey + two iterations). **Performance = the
   ENS room, HARDENED** — on-the-fly start, NO ceremony (piece #1's
   ruled "too onerous and fragile") · all three redundancy rungs
   (self-sufficient stands · hot-spare machine · one podium resync
   gesture) · **after GO the network is optional** (fixed-timeline
   star). Survey + full record: ARCHITECTURE.md § PERF.
3.5 ☑ **ENGINE — CLOSED day 42 → D89** (brief delivered AND all four
   verdicts landed the same sitting: V1 renderer per module — A
   fix-in-place for IND/SEC/ENS · C per-part video for the concert
   stand · B benched on kit data · V2 own small Socket.IO server, #1's
   protocol hardened, THE FLOOR RULE in, no Colyseus/WebRTC · V3
   Hetzner, one VPS, all pieces, one deploy script · V4 kit spec
   approved). Full record: **`docs/ENGINE_BRIEF.md`** (diagnosis ·
   candidates · sync backstops · piece-#1 autopsy · risk register ·
   floor rule · kit spec §5 + build plan §5b).
3.6 ☑ **KIT BUILT + VERIFIED (day 42, 2026-09-29, Opus — composer:
   "Go build the kit as much as possible independently no clear").**
   `testkit/` — the page (T5 · T1 · T2 five renderer lanes · T4 video
   stand + frame servo · T3 clock + floor-rule sabotage · beacon), the
   dependency-free server, the asset builder (the busiest 60 s of the
   piece, drawn by the real engine), two simulation batteries (floor
   rule 15/15, servo 10/10), a headless self-verification harness, and
   README.md (the composer's run protocol). Record: RUNNING_LOG 67–70 ·
   ENGINE_BRIEF §8 (first numbers + the two corrections to §2 C).
3.7 ☑ **TESTED — four devices + the beacon (2026-10-18; filed: RUNNING_LOG 75,
   ENGINE_BRIEF §8 "The stands").** V1 holds, refined: A = A2 (GPU layers).
   Open: the iPad's video (one slow-motion check) · three clock faults and
   Safari's start/seek handling, found by real Wi-Fi.
3.8 ☑ **CLOSED 2026-10-18 — FIX + RE-TEST** (Opus; approved: "yes, approve 3.8 — go ahead with the fix and retest and do the optional slo mo filming").
   The three floor-rule faults in `js/syncclock.js` (noise from measured
   scatter, a calibration quality bar, a percentile spike filter) · Safari
   pre-roll + predictive seeks in the servo path · the kit's T3 yardstick
   · a realistic-Wi-Fi simulation from the measured round trips · then a
   15-minute iPad re-run (+ Fire). **Done =** the floor clock within ~2 ms
   in honest stretches on the iPad. Then HARDEN (9).
   **Progress:** ☑ the code (v3 floor clock 19/19 on the measured
   networks · fast-sample yardstick · pre-roll + steady anchor + aimed
   seeks · the film check, proven on synthetic films · dev-PC headless
   run clean) — RUNNING_LOG 76–77, ENGINE_BRIEF §8 "3.8 — the repairs".
   ☑ **the iPad re-test + the film (RUNNING_LOG 78, brief §8 "The re-test"):**
   floor clock 0.0–2.4 ms honest (was 8–14), every lie held → Done MET ·
   no start stall · servo 5–7 ms between seeks, ~150 ms at a seek (was
   ~210) · the film: every frame shown (Safari's callbacks undercount).
   Into HARDEN (9): calibrate every session (the rate moved 6 ppm in 2 h) ·
   Safari rehearsal jumps = pause → seek → ready → start on a clock moment
   (proposed; the 150 ms not diagnosed) · Safari frames by decoder/film.
3.7 (as planned) **KIT RUNS on the composer's devices** (= top-line step 4). The
   composer's step, no AI needed at the devices: `node testkit/server.js`
   on the PC, open the printed address on each device, name it, "Run all
   tests", "Save to server". Then an AI reads `testkit/results/` and files
   the numbers (brief §8 table) — that closes the ESTIMATEs for HARDEN.
   PORTAL (4, Fable) can run before, after or between.
4. ☑ **PORTAL — login / join scenario** (CLOSED day 45 → **D90**; one sitting, four
   questions one per turn). THE LINK IS THE PART: the composer (sole admin) opens
   the ensemble → one conductor link → the conductor's page lists the parts, one
   link + QR per PLAYER ("add another player" for doubling) → the player taps once,
   adds to the home screen, the icon IS the part everywhere · links open, one-tap
   reissue · the conductor's link = the podium (display + control) · versions
   follow the ensemble page. Parked to deploy step 14: operating instructions +
   help protocol / FAQ. Record: ARCHITECTURE § PORTAL. *(As planned:)* The "too clunky" fix: show up →
   log in → in. Link/QR join with zero typing; late joiner lands in sync.
   **Done =** PORTAL closed.
4.5 ☑ **PARTS — CLOSED day 45 → D91** (same sitting as PORTAL; three questions):
   own notes + rehearsal number + time in a corner, no cue strip · the beating
   indicator stays parked · the screen's time span set by eye on the iPad in the
   build · banked: rehearsal numbers still to be authored into the score. Record:
   ARCHITECTURE § PARTS. *(As approved:)* **PARTS — the stand's part view + part formatting** (APPROVED into the
   order, day 41 wrap). What a part shows, which lanes, adaptations like the
   day-35 beating-frequency indicator idea, the make-process. Seed: ENS
   iteration 4's "a part = a live VIEW of the IR"; first input banked from
   SEC d (own part, everywhere). Placed after the scenario chunks so every
   consumer is known before it is specced. **Done =** part-view
   requirements closed.

5. ☑ **CONTROLS session — CLOSED day 45 → D92** (five questions: one vocabulary
   everywhere · no pedal · laptop = click / space / arrows / menu button · the
   remote = the ENS set exactly · no pinch zoom). Record: ARCHITECTURE § CONTROLS.
   *(As planned:)* **CONTROLS session** (Fable; the composer named this a dedicated session,
   day 38). The swipe/tap vocabularies, per device (tablet = fingers,
   laptop = mouse + keys). **Done =** vocabulary agreed and filed.
6. ☑ **ANNOTATION-UX session — CLOSED day 45 → D93** (pen · eraser · undo · a
   clear in-and-out · no conductor path · marks in the concert over the video
   with a show/hide switch as a fourth menu item · every gesture tested on every
   platform before the build). Record: ARCHITECTURE § ANNOTATION.
   *(As planned:)* **ANNOTATION-UX session** (Fable; dedicated, day 38). "Simple universal
   functions": scopes (private / to-one-player / to-everyone), the conductor's
   paper→digital transfer path, one-gesture undo.
   **Done =** annotation requirements closed.
6.5 ☑ **PERFORMANCE PROTOCOL — CLOSED day 45 → D95** (the night walked through;
   the CONCERT switch · calibration across sleeps → build item · 5 s lead-in at
   the top · restart from a letter · the spare optional · mixed devices normal).
   Record: ARCHITECTURE § PERFORMANCE PROTOCOL. *(As proposed:)* The concert-time stand: "maybe it's simpler just… to
   be a completely passive stand for performance time before and after the
   performance"; the night's sequence; when a player sets marks on/off. **Done =**
   the concert protocol stated. (No menu DURING the performance is already ruled.)
7. ☑ **1b — the composer's mental models — CLOSED day 45 → D94** (the Tuesday
   walk-through, thirteen moments all checked · one central control for every
   ensemble, the leader's strip · the handout and rehearsal night concrete · the
   lead-in re-confirmed · THE STUDY SCORE closed inside it). Record: ARCHITECTURE
   § 1b iterations 1–2, § THE STUDY SCORE, § PORTAL iteration 3. *(As planned:)*
   **1b — the composer's mental models** (Fable). How the composer pictures
   rooms, roles, the flow — logged before the AI evaluation reframes anything.
   **Done =** logged to ARCHITECTURE.md + COMPOSER_LOG.
8. ► **1c + 1d — AI evaluation + vet loop** (Fable). Gaps, conflicts, what was
   left out — across ALL closed scenarios; iterate until nothing new surfaces.
   **Done =** GATHER phase closed.
9. **2a–2d — HARDEN** (Fable; likely two sittings). **Carry-in (day 45,
   composer): a GESTURE TEST on every platform — iPad · Fire · Android if
   borrowable — before the build commits to the mapping; three-finger and
   long-press especially ("test and calibrate it well… universal across the
   platforms").** Classify
   must/should/could × decided/open/empirical · empirical gates (probes before
   commitments) · adversarial pass (ENS gets re-tested against everything
   else) · **freeze stable AR-N IDs**. **Done =** requirements frozen.
10. **3a–3d — ARCHITECTURE** (Fable drafts, composer reviews; two sittings).
    Draft with alternatives-considered-and-rejected · scenario replay through
    the design · risk spikes. **Done =** design approved.
11. **4a–4b — PLAN** (Fable). Phased into PLAN.md with per-phase verification
    in the running app + a model/clear map. **The build chunks get enumerated
    here and appended to this order.**

**THE PAPER THREAD — independent of the screen chunks; any of these fits a
short sitting whenever the mood is paper:**

- **P1 — the rehearsal-vs-performance question** (composer's answer only;
  day 37, still standing: *"what makes a rehearsal score different from a
  performance score. I have not assumed anything."*). Then AI specs both
  builds. **Done =** distinction stated, specs written.
- **P2 — Rehearsal Score Build** (Opus once P1 decides; the 3 s generator
  already exists). **Done =** PDF approved.
- **P3 — Performance Score Build** (Opus, same). **Done =** PDF approved.
- **P4 — polish proof of score** — the tier-3 paper pass (collisions, ledger
  creep, page turns; density 11.41 s/page stands by default; colour per D80).
  (Fable eye · Opus fixes.) **Done =** composer signs the proof.

**PARKED beyond this arc** (listed so nothing is lost): PARTS — ten
single-player extracts · the beating-frequency indicator idea for the parts
(composer, day 35; data measured, form open) · synced demo-audio playback in
rehearsal · rehearsal logging · the network build itself (comes out of
chunk 11's plan).

## THE ENGINE CHUNK — APPROVED (day 41 sitting 2; charter in ARCHITECTURE § PERF iteration 2)

The three noted topics (animation engine · network syncing/robustness ·
performance redundancy) consolidated and **approved by the composer's
PERF-iteration-2 words** ("take a hard look at the animation engine…
even if we have to adapt something different… I lean on you for network
robustness and engine… devise some testing… hard data"). **PLACEMENT
RULED (composer, day 41 wrap): ENGINE IS NEXT** — the ► after PERF,
ahead of PORTAL.

- **ENGINE — the AI-prepared technology brief, one verdict sitting:**
  1. **Animation-engine hard look.** The jitter admission is on record
     (fine for composing, subpar for performance; piece #1's fixes
     didn't take); bar = online-game smoothness; **license granted: the
     performance stand's renderer may DIFFER from the composer /
     presentation scores.** Candidates argued, not pre-decided:
     compositor-transform-only SVG · canvas/WebGL (PixiJS-class) · **the
     repo's ace — pre-rendered per-part videos from the proven
     frame-exact exporter** (smoothness by construction; sync =
     seek-by-clock, a solved commercial problem).
  2. **Network robustness + codebase picks.** Game-engine patterns
     (authoritative clock · interpolation · dead-reckoning) · harden
     piece #1's proven protocol vs a Colyseus-class framework · wake
     lock · PWA/offline · WebSocket vs WebRTC-LAN.
  3. **THE TEST KIT — composer-runnable, hard data.** A browser test
     page: rAF inter-frame jitter histogram + dropped frames · long-task
     stalls · cross-device clock drift · renderer A/B on the same
     hardware. Plus cheap-device guidance (refurb Chromebooks / base
     iPads = the realistic zoo).
  **Done =** models chosen by verdict; engineering requirements frozen
  for HARDEN.

## POSITION LOG (newest first — one line per sitting)

- **2026-10-19 (day 45, ~3 a.m. — PERFORMANCE PROTOCOL CLOSED ☑ → D95; ► 8 the
  cross-check, 1c + 1d):** the performance read back, concert night walked
  through with the server's part; eight items tracked and closed one per turn.
  SIX chunks + the study score in one sitting (D90–D95). Carry-ins for the
  cross-check: joining a sectional from the stand · where "start a sectional"
  lives · the menu is now five items. RUNNING_LOG 79–85.

- **2026-10-19 (day 45, ~2 a.m. — 1b CLOSED ☑ → D94; ► 6.5 PERFORMANCE
  PROTOCOL, then 1c + 1d the cross-check):** the composer narrated a Tuesday
  rehearsal; all thirteen moments checked against the rulings; the
  conducted/chamber switch and the dot DROPPED (the composer's picture = D82
  for every ensemble); the leader's strip (design by eye in the build); the
  handout + rehearsal night made concrete; the 5 s lead-in and the immediate
  jump confirmed; the study score closed (menu item · marks per view · fixed
  zoom · back to the part). FIVE chunks + the study score in one sitting
  (D90–D94). RUNNING_LOG 79–84.

- **2026-10-19 (day 45, after midnight — ► 1b MENTAL MODELS OPENED, order
  chunk 7):** composer: "go". This chunk is the composer dictating their own
  picture (rooms · roles · the flow of a rehearsal) in their words; the AI asks
  open questions one at a time, offers no options, logs verbatim, reframes
  nothing until the vet (1c). RUNNING_LOG 84.

- **2026-10-19 (day 45, after midnight — ANNOTATION CLOSED ☑ → D93; ► 1b
  mental models, order chunk 7; 6.5 PERFORMANCE PROTOCOL proposed):** four
  questions one per turn: three tools · a clear in-and-out (+ the composer's
  requirement: test every gesture on every platform → HARDEN carry-in) · no
  conductor path · marks in the concert with a switch; no menu during the
  performance confirmed; the concert-time stand's passivity banked to the new
  conversation. FOUR chunks closed this sitting (D90–D93). RUNNING_LOG 83.

- **2026-10-19 (day 45, after midnight — ► ANNOTATION-UX session OPENED, order
  chunk 6):** composer: "go". Banked inputs in hand: ALL MARKS PRIVATE, no
  scopes (ENS iteration 2 — the chunk's "scopes" item is already answered) ·
  "mimic the paper score", finger-first, few tools, piece #1's toolbar "too
  clunky" · marks anchor to score-time, kept on the server, follow the player
  everywhere, sync quietly (ENS iteration 3, IND) · "don't assume everyone
  has stylus" · the conductor's marks = notes to self, path open ("lets
  discuss this more"). RUNNING_LOG 83.

- **2026-10-19 (day 45, after midnight — CONTROLS CLOSED ☑ → D92; ►
  ANNOTATION-UX session, order chunk 6):** five questions, one per turn:
  one vocabulary everywhere ("yes") · "no pedal functionality" · the laptop
  mapping ("yes") · the remote = the ENS set ("yes") · "no pinch zoom".
  Three chunks closed this sitting (PORTAL D90 · PARTS D91 · CONTROLS D92).
  RUNNING_LOG 82.

- **2026-10-19 (day 45, after midnight — ► CONTROLS session OPENED, order
  chunk 5):** composer: "go for next". Banked inputs in hand: the IND gesture
  default pinned (swipe = pages · one-finger tap = cursor · two-finger tap =
  play/stop · three-finger or long press = menu; menu = annotate · jump ·
  speed) · ENS stands have no room transport, local play while stopped ·
  SEC every stand carries transport · the conductor's remote = start/stop/
  jump/again/speeds + part-zoom buttons for the display · tablet = fingers,
  laptop = mouse + keys · no stylus assumed · the foot pedal (day 45).
  RUNNING_LOG 82.

- **2026-10-18 (day 45, later — PARTS CLOSED ☑ → D91; ► CONTROLS session,
  order chunk 5):** three questions, one per turn: own notes + rehearsal
  number + time, no cues ("1") · beating indicator parked ("1") · time span
  by eye on the iPad in the build ("good"). Two chunks closed this sitting
  (PORTAL D90, PARTS D91); the Tempus re-cut refused — order unchanged.
  RUNNING_LOG 81.

- **2026-10-18 (day 45, later — ► PARTS gather OPENED, order chunk 4.5 /
  top-line 6; same sitting as PORTAL):** composer: "good move on". Banked
  inputs in hand: own part everywhere (SEC) · a part = a live view of the
  score data, not a PDF (ENS iteration 4) · the full-size iPad is the
  presumed stand (day 43) · zoom one part at a time is the conductor's
  display, not the stand (D82) · rehearsal stand = the live engine, concert
  stand = per-part video (D89) · the beating-frequency indicator idea parked
  since day 35 (PLANNER). RUNNING_LOG 81.

- **2026-10-18 (day 45, late — PORTAL CLOSED ☑ → D90; ► PARTS gather, order
  chunk 4.5 / top-line 6):** one sitting. The composer's double-check (three
  rulings already bound it, no portal walk-through existed) · the door = THE
  LINK IS THE PART · the flow walked as the instructions an ensemble receives ·
  the composer the sole admin ("A, me only") · four questions ruled one per
  turn after the composer asked for simpler language and full words (one link
  per player + "add another player" · open links + one-tap reissue · the
  conductor's link on two devices · versions follow the ensemble). New
  deliverable parked on deploy step 14: operating instructions + help protocol
  / FAQ. **Raise at the next move: D88's Tempus-first re-cut of the order.**
  RUNNING_LOG 79.

- **2026-10-18 (day 45, late — ► PORTAL gather OPENED; top-line 5 / order
  chunk 4):** new session on Fable after the day-44 wrap. The banked
  inputs assembled before the composer dictates: ENS iteration 4
  (pre-registration, no drop-ins · con assigns parts "like handing out
  paper parts" · login must work on the LAN with no internet) · SEC
  (room choice is two kinds only: the ensemble room + a live sectional) ·
  piece #1's pain points (room codes typed by hand · landing hand-built
  per piece · JWT rejoin) · the engine brief (HTTPS · one deployment for
  every piece · the leaked-URL abuse surface deferred HERE · the hot-spare
  LAN box reached by the same QR). Done = PORTAL closed. RUNNING_LOG 79.

- **2026-10-18 (day 44, night — 3.8 ☑ CLOSED):** the iPad re-test + the
  slow-mo film filed. Floor clock 0.0–2.4 ms honest on the real iPad (was
  8–14) — Done MET. Start stall gone; seeks better (150 vs 210 ms), not
  fixed — a rehearsal-jump requirement for HARDEN. The film: every frame
  shown; the film reader took six versions and two eye checks to be right.
  RUNNING_LOG 78. Next on the top line: 5. PORTAL gather (Fable).

- **2026-10-18 (day 44, later — 3.8 APPROVED; the code ☑, ► the iPad
  re-test):** the three clock faults fixed test-first (iPad honest
  0.0–2.1 ms in simulation, was 12.5), the T3 yardstick, the Safari
  start + aimed seeks, and a film check for the slow-mo phone. Dev PC
  clean. Waiting on the composer's iPad re-run + film. RUNNING_LOG 76–77.

- **2026-10-18 (day 44 — THE STANDS REPORTED ☑ 3.7; ◇ 3.8 proposed):**
  desktop, iPad (full run), laptop, Fire + the beacon (Pixel 8a slow-mo).
  The Fire reproduced the jitter (today's engine 57 % of frames on time)
  and the GPU-layer fix holds 99.4 %; the iPad has headroom to spare;
  every lie refused; but three clock faults (iPad 8–14 ms, Fire 17–25 ms
  in honest stretches) and Safari's video start/seek need a fix + re-test
  chunk — proposed, not yet approved. Beacon: two screens 7.7 ms apart.
  RUNNING_LOG 75 · ENGINE_BRIEF §8.

- **2026-09-29 (day 42 cont. — THE KIT BUILT + VERIFIED ☑ 3.6; ► 3.7 the
  kit runs on real devices):** Opus, "as much as possible independently,
  no clear". `testkit/` complete; control laws proven in simulation
  (15/15, 10/10); every test verified in headless Edge; renderers
  pixel-checked. First numbers (dev PC baseline): the fix cuts per-frame
  cost ~4–6× · floor rule 0.2–0.3 ms under 250-ms and 1000-ppm lies ·
  servo closes an 80-ms step in ~3.5–4.2 s without hunting · 1-s
  keyframes seek ~12× faster. Brief §2 C corrected twice. RUNNING_LOG
  67–70 · ENGINE_BRIEF §8.

- **2026-09-29 (day 42 cont. — status check + CHECKPOINT):** composer
  asked "is it done and ready to build?" — yes for the kit (3.6 ►,
  racked, unstarted); the full build waits on kit numbers + steps 5–9
  by design. Checkpoint taken on Opus; **the needle has not moved:
  3.6 ► KIT BUILD.** RUNNING_LOG 66.

- **2026-09-23 (day 42 WRAP — ENGINE CLOSED ☑ → D89; kit racked ►
  3.6):** all four verdicts landed in the same sitting the brief was
  delivered — V1 renderer per module (A / C / B-benched) after a
  plain-language walkthrough · V2 own server + floor rule after the
  sync-drift assessment, the piece-#1 autopsy, and the risk register ·
  V3 Hetzner one-box-all-pieces · V4 kit approved. **Kit build racked
  for Opus ("build the kit"; ENGINE_BRIEF §5b), not building now;
  PORTAL may run first.** RUNNING_LOG 56–64 · COMPOSER_LOG day 42.

- **2026-09-23 (day 42 cont. — ENGINE brief DELIVERED; verdicts
  pending):** the grounding read found the jitter's address (per-frame
  `innerHTML` overlay rebuild; the engine otherwise pre-built for
  retained mode). **`docs/ENGINE_BRIEF.md` delivered:** per-module
  renderer recommendation (A fix-in-place for IND/SEC/ENS · C per-part
  video for the PERF stand · B benched) · own small Socket.IO server
  hardening #1's protocol (no Colyseus, no WebRTC) · hosting posture ·
  the composer-runnable test-kit spec. **Chunk stays ► until V1–V4
  land; then the kit build = Opus.** RUNNING_LOG 56.

- **2026-09-23 (day 42 — THE TEMPUS COLLISION ruled → D88):** the
  composer's sequencing question ("finish the plan here vs build for
  the septet") answered: FALSE FORK — one module system, **Tempus
  deploys first** (parts delivery = the modules · paper parts pro
  forma · rehearsal-ready before ~Oct 29 · ports for later pieces ·
  development continues during Tempus rehearsals). ENGINE remains ►,
  now written against Leipzig as deployment #1; hosting joins its
  charter. RUNNING_LOG 53–54 · COMPOSER_LOG day 42.

- **2026-09-01 (day 41, sitting 2 WRAP — three scenarios closed; ENGINE
  is ►):** SEC (D85) · IND (D86) · PERF (D87) all closed this sitting;
  precedent survey filed; ENGINE approved and **RULED next** by the
  composer; **PARTS chunk RULED into the order** (4.5). Session wrapped
  here — **next session opens on the ENGINE brief** (AI prepares the
  technology brief + test kit as homework; composer verdicts). Everything
  committed + pushed.
- **2026-09-01 (day 41, sitting 2 cont. — PERF CLOSED ☑ → D87 · ENGINE
  APPROVED):** a = RULING (performance = the ENS room hardened; no
  ceremony; on-the-fly start) · b = all three redundancy rungs · the
  animation admission logged (jittery in performance; renderer may
  differ) · the testing mandate (composer-runnable, hard data).
- **2026-09-01 (day 41, sitting 2 cont. — PERF OPENED via precedent
  survey + the engineering redirect):** survey filed (ARCHITECTURE § PERF
  precedent survey; Polytempo Network = the sibling; paper lineage to
  PAPER_NOTES). Then the redirect (PERF iteration 1): **ceremony OUT**
  ("started on the fly… not a lot of locking"), redundancy nod
  (stand clocks + spare machine), engineering models = commercial/MMO
  grade, codebases delegated to AI. **Proposed and pending composer
  verdict:** PERFORMANCE = THE ENS ROOM, HARDENED · "after GO the
  network is optional" (fixed-timeline star, drift ≈ 15 ms/750 s
  ESTIMATE) · the ENGINE chunk (see above). PARTS-chunk yes/no still
  floats.
- **2026-09-01 (day 41, sitting 2 WRAP — IND CLOSED ☑ → D86):** two
  iterations; a–e ruled (serverless solo · NO LOOP, the last door shut ·
  gesture default pinned · paged swiping · three-item menu). Gestures
  banked to CONTROLS; serverless banked to NET. Mid-sitting the composer
  parked three topics (animation engine · network syncing/robustness ·
  performance redundancy) — filed under COMPOSER'S NOTED TOPICS above.
  **► moves to chunk 3 (PERF)** — the "vet hardest" one. PARTS-chunk
  yes/no still owed. Committed + pushed at the wrap.

- **2026-09-01 (day 41, sitting 1 WRAP — SEC CLOSED ☑ → D85):** live-rooms
  model adopted ("yes good") after four iterations in one sitting; findings
  banked to PARTS / PORTAL / NET. **► moves to chunk 2 (IND).** The
  PARTS-chunk insertion is still marked proposed — composer yes/no owed.
  Committed + pushed at the wrap.

- **2026-09-01 (day 41, sitting 1 — SEC UNDERWAY):** SEC iteration 1
  dictated and logged (ARCHITECTURE.md § SEC · COMPOSER_LOG day 41):
  break-off + independent meetups · on-the-fly group formation · durable
  recurring rooms · HEADLESS control, no leader (piece #1's leader-juggling
  named the pain) · "login. choose the room and start playing now." The
  PARTS question surfaced → PARTS chunk PROPOSED (see THE ORDER).
  **Iteration 2: a–d RULED** (human tie-back · named rooms + your-rooms
  list · last-command-wins · OWN PART ONLY — first PARTS input banked) and
  the ensemble features carry. **Open: AI additions round e–g** (first-join
  mechanics · one-room-at-a-time · the pair demos need nothing built).
- **2026-09-01 (day 41):** organizer created at the composer's ask; order
  proposed. ► = chunk 1 (SEC).
