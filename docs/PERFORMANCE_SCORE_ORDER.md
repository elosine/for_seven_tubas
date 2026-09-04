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
2. ► **IND — individual practice scenario** (Fable). Does solo practice need the
   server at all? Which practice aids — and confirm the global looping
   rescission holds here too (or gets a solo-only exception).
   **Done =** IND closed.
3. **PERF — the performance-module scenario** (Fable; composer: "vet
   hardest"). The concert itself: ceremony, conductor role on stage,
   network-failure-on-stage behavior. May take two sittings.
   **Done =** PERF closed.
4. **PORTAL — login / join scenario** (Fable). The "too clunky" fix: show up →
   log in → in. Link/QR join with zero typing; late joiner lands in sync.
   **Done =** PORTAL closed.
— **PROPOSED day 41, awaiting composer approval: a PARTS chunk here** (the
   stand's part view + part formatting — what a part shows, which lanes,
   adaptations like the day-35 beating-frequency indicator idea, the
   make-process; seed: ENS iteration 4's "a part = a live VIEW of the IR").
   Surfaced by the composer in SEC iteration 1 ("the players themselves are
   playing their own parts. so we haven't discussed that yet"). Placed after
   the scenario chunks so every consumer is known before it is specced;
   scenario findings bank into it meanwhile.

5. **CONTROLS session** (Fable; the composer named this a dedicated session,
   day 38). The swipe/tap vocabularies, per device (tablet = fingers,
   laptop = mouse + keys). **Done =** vocabulary agreed and filed.
6. **ANNOTATION-UX session** (Fable; dedicated, day 38). "Simple universal
   functions": scopes (private / to-one-player / to-everyone), the conductor's
   paper→digital transfer path, one-gesture undo.
   **Done =** annotation requirements closed.
7. **1b — the composer's mental models** (Fable). How the composer pictures
   rooms, roles, the flow — logged before the AI evaluation reframes anything.
   **Done =** logged to ARCHITECTURE.md + COMPOSER_LOG.
8. **1c + 1d — AI evaluation + vet loop** (Fable). Gaps, conflicts, what was
   left out — across ALL closed scenarios; iterate until nothing new surfaces.
   **Done =** GATHER phase closed.
9. **2a–2d — HARDEN** (Fable; likely two sittings). Classify
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

## POSITION LOG (newest first — one line per sitting)

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
