# PLAN — for seven tubas

> **Rules:** IDs are stable — never renumber, only append. Status: `todo` / `doing` /
> `done` / `deferred`. Position = order. Same conventions as piece #3's PLAN.

## 0. Setup — `doing`

- **0a — Repo + stack seed** — `done 2026-08-10` — piece #3's score app (7 tracks,
  :5200) + sandbox (:4700) + instruments skeleton copied and adapted. Saving = #3's D8;
  motive blocks = #3's D9.
- **0b — loopMIDI + rack** — `doing` (composer) — 7 ports `tuba1`…`tuba7` (lowercase); Reaper rack,
  one track per port, **input monitoring ON per track** (piece #3 Principle 1 — the
  silent-killer).
- **0c — Tuba sample library chosen** — `done 2026-08-10` — **IRCAM Solo Instruments 2 (tuba)**, same library family as piece #3's harp/accordion: UVI channel-per-technique switching, all of #3's UVI quirks apply (SAMPLER_QUIRKS.md there).

## 1. Instrument survey — `doing`

- **1a — Technique roster** — `done 2026-08-10` — 21 SI2 tuba techniques transcribed
  from the composer's UVI build (slot order = ground truth); dual-port model = D2.
- **1b — Probe & characterize** — `skipped → per-need` *(composer 2026-08-10: "no need
  for probe")* — technique behaviors (KS internals, menu patches, quartertone mapping,
  true ranges) learned while composing; AI surfaces piece #3-style probes only when a
  musical question demands one.

## 2. Compose — `doing` (research-first)

- **2a — Crescendo / sound-mass research arc** — `doing` — taxonomy, laws L1–L3,
  Xenakis rules, the swell-cloud species (peak-cut = attack). SC4 dense hold
  approved 2026-08-10; four-pass plan in journal §2. All in docs/RESEARCH_INDEX.md
  + CURVE_DATABASE.md.
- **2b — Pass 2: onset-driven max density (10 parts)** — `done 2026-08-11` —
  full calibration arc OC→DH1–DH5 in one sitting: onset scattering validated ·
  LAW L4 carved (×2.75 category spacing; both-ends saturation; 4 duration
  categories) · anti-clump machinery (maxShortRun, conversion, run-breaking
  longs) · **RECIPE MAXDENSE-1 adopted (DB 035)** · finding 14 (apex-stack
  loudness) logged. Fine-tune deferred to in-piece texture work.
- **2c — Grain-type (envelope species) pass + pitch fields** — `deferred-usable
  2026-08-12` — kept {sine, expodec, surge}; quasi-gauss cut; DH6 blends
  illegible; DH8 morph pinned; DH9 KS-surge kept as OPTION (back to all CC7 —
  performer-achievable). **Standing mix {surge .7, sine .3}.** Thorough env
  research returns post-piece. DB 036–040.
- **2d — Density-delta calibration (continuous change)** — `captured 2026-08-12`
  — the dens1–dens10 arc, closed by composer to enter the piece. Full capture:
  **DB 044** (finding 15 count-regime law · apex-scramble fix/peak-anchored law ·
  accelerando scheduler + one-dial curve re-centered · level-carries-climax ·
  RECIPE BUILD-1 provisional). Refinement returns per-container.
- **2e — CONTAINERS: the piece paradigm** — `doing 2026-08-12` — shaped META
  curves = visual targets, filled by the engines, refined later (DB 045).
  v1 Density Build container shipped (stamp; dur edges + curvature diamond);
  cont-build-001 awaiting the composer's shaping; naming system NAMING.md.
- **2f — Play-in analysis pipeline (PoC LIVE 2026-08-13)** — `doing` — analyzer
  tools/analyze_take.js: trend fit (accel model recovered from playing) + noise
  sigma + durations + level contour + pitch field + feasibility -> meta-object in
  analysis/ · comparison score <take>-gen.json (ORIG + fitted META shapes + 2
  seeded siblings, 10-part feasible). First: A1-5 (fit curve 0.43 raw, 1.35->46/s,
  47 violations; siblings 143/134 notes). **PLACEHOLDERS for the return pass:**
  robustified windowed fit (cluster-resistant) · richer ops (stretch, density-
  scale, curve-warp, thin-to-N, excerpt) · sample-set enrichment (more takes +
  algorithmic siblings, audition-culled). **Sample-set decision 2026-08-13:
  LIBRARY model adopted (per-sample generation, ostinato-set precedent;
  library: A1-5, A2-hp-whole) — POOLING/consensus/morph ("the augmenting
  machine") = HELD, placeholder for later.**

Incremental MO carried over from piece #3: composing drives tool-building; the score is
the combining surface; sandbox available for exploration. Per-track recording in the
score is still unbuilt (was piece #3's next slice — build here when needed).

## 3. Performance score — MANDATES (composer, 2026-08-10; bind all future notation work)

- **M1 — On-the-fly part multiplication.** 10 base parts; additional independent
  parts generated as variations of a base part at rehearsal time (e.g., 19 parts
  from the 10 for whoever shows up).
- **M2 — Family adaptation.** Real-time transposition + octave/tessitura adaptation
  so ANY part is readable by ANY tuba/euphonium family member.
- **M3 — Env-release notation devices** (see P3): reliably variable release
  vocabulary; scrolling curves won't serve releases.
- **M4 — Rapid-staccato notation** *(composer 2026-08-13)*: attacks = vertical
  lines (beamed), straddling regular-notation pitches; a small BOUNCING BALL
  riding the line/pole, landing on each attack point; scrolling cursor as the
  alternative follow. Prototype at notation time.

## 4. Independent-work slate (composer post-wrap addendum 2026-08-10; AI executed 2026-08-11)

- **4a — Penn State research** — `done 2026-08-11` — docs/PENN_STATE_RESEARCH.md.
  **Deadline Sept 4, 2026.** Ensemble ballpark 12–20 (≥9 euphoniums documented);
  10 parts + M1 fits the call.
- **4b — 10-part expansion** — `done 2026-08-11` — 10 full-height lanes, TRACKS/
  engines/instruments → 10; old scores auto-migrate (layoutVersion 2).
  **Composer hardware TODO: loopMIDI ports `tuba8`/`tuba8b`…`tuba10`/`tuba10b`
  + 6 UVI instances + Reaper tracks (input monitoring ON).**
- **4c — Floating draw tool** — `done 2026-08-11` — META layer (now 10) is a
  floating window: timeline-locked (shared scroll transform), semi-transparent,
  vertical drag via label, ✕ hides, click-through when not in draw mode; opens
  on Draw / Stamp.
- **4d — Grain-editing suite** — `done 2026-08-11` — apex dots (all part-lane
  envelopes); grains: no node/diamond/splice tools, dotted start line + go-time
  box, horizontal-only whole-shape drag, top amplitude handle, left duration
  handle (as-if-generated: peak+release fixed), right release handle, `Grain env`
  panel toggle (Roads catalog swap, peak-anchored).
- **4e — Roads envelope catalog** — `done 2026-08-11` — `grainEnvelope()` ×8
  shapes (DB 027) + `env-catalog` audition score in the Load dropdown (~70 s,
  Tuba 1). **Composer:** listen + bless shapes; **name for our classic
  crescendo-cut: `surge` proposed** (matches BLOOM/SURGE vocabulary) — rename
  welcome.

## 5. Infrastructure

- **5a — Remote audition pipeline** — `doing 2026-08-12` — **Option 1 READY:
  CRD watch+listen (docs/REMOTE_AUDITION.md; desktop config verified — WASAPI
  shared, no changes needed; start_score_server.bat helper). Awaiting composer
  live test.** Option 2 (REC MIX + Hetzner/Drive file+video pipeline) = next
  build on go. Option 3 (live stream) deferred. Original phone-trigger plan:* — phone-triggered start-to-finish: load score → arm/
  record Reaper → play composer score → stop → upload to Google Drive
  (jusyangster@gmail). Architecture: phone control page on the score server ·
  WS control channel to the desktop composer page (playback lives in the
  browser) · Reaper built-in web-RC for record/stop · REC MIX folder-parent
  track records the output mix · rclone (or Drive Desktop folder) upload.
  Phases: (1) Reaper record round-trip · (2) WS + one-button local chain ·
  (3) upload + phone-on-LAN · (4, optional) Tailscale for away-from-home.
- **5b — Two-way page control (AI realtime control of the web pages)** — `todo
  (composer 2026-08-12: AI-generated scores beat manual sandbox; "develop some
  two-way infrastructure so you have realtime control of the web pages")* —
  WS/SSE channel in server.js + page handlers (load/play/stop/seek), driveable
  by AI via HTTP POST; also the backbone for 5a's phone control page. Sandbox
  engagement returns UNDER AI CONTROL when needed.

## 6. ROADMAP to Penn State deadline (composer, 2026-08-12; due Sept 4, 2026)

1. **Finish the grain** (2c: species verdicts; make it USEFUL, not exhaustive).
2. **Transition behavior + speed limits** — DH8-style morphs for ALL parameters,
   with density as the one dial; rate-of-change limits (P4's realistic-scales
   note becomes its own research step).
3. **Sound toolbox** — motives/gestures for the piece (recipes as named units).
4. **MAKE THE PIECE.**
5. **Paper FROM the piece** (process + research), then augment paper/engine with
   additional research if time allows.

- **2g — The GESTURE BANK** — `doing 2026-08-13` — docs/GESTURES.md: formal
  principle (fixed shape x pitch distribution = repetition-with-change) ·
  GESTURE-1 banked (#AD5F2A, 9 pitch variants) · **GESTURE-2 BANKED**
  (A2-fp_cresE, #4E7A9B, compression ×0.75 in the piece) · CLUST01/02 + VERT01
  entities + harmony palette/pairing ledger · **overlapping-crescendo pulse
  RESEARCHED** (cressand-01…17 → `cressand-family` reference: rise-nucleus law,
  26.5 dB margin calibration, margin-solved taper, min-gap 0.44 floor) ·
  **ostinato engine PORTED from piece #2** (timing tables in bank/, tools/
  ost_variety.js) — `ost01-variety` = the 8-formation listening exercise,
  FIRST THING NEXT SESSION. Remaining planned: pointillistic-mass takes,
  varied repetition as form.
- **2h — PIECE ASSEMBLY** — `doing 2026-08-13` — piece-s01…s07c: opening
  (GESTURE-1) + 5 inserted gestures, all with movable/stretchable META group
  shapes (groupId; drag=move, edge/box/panel=scale); latest: GESTURE-2 ×0.75
  at 50 s, reharmonized m6 on F# (s07b) then F (s07c).

- **2i — THE COUNTERPOINT SECTION** *(composer note, 2026-08-14 — to try)*:
  a section built from **long crescendos in the banked harmonies** (the
  VERT/cluster/mode palette) **combined with the crescendo-acceleration chains**
  (`cressand-family`), **blast interjections** (fp/ord verticals), and
  **potentially tremolo sections** — the four texture families running against
  each other as counterpoint rather than in sequence. *Why it's live now:* all
  four ingredients are built and calibrated (harmony palette · margin-solved
  cressand chains · blast entities · tremolo still to develop).
  **Sketch (composer, 2026-08-14):**
  - crescendo on a chord → **blast, blast** → long cressand accel chain with the
    chord **round-robin / interspersed with tremolos**
  - a **pointillistic section with ordinario blasts, spatialized 1 → 10**
    (the cloud/cluster material against blasts that travel the stage line)

## Parking lot

- **P3 — Release vocabulary & notation devices** *(composer, 2026-08-10)*: names +
  animated/notational devices for envelope releases (tongue-stop = the rexpodec cut,
  through slower releases); design WITH composer — queued for a working session.
- **P4 — The generative engine** *(composer, 2026-08-10 — supersedes recipes-only
  stance)*: statistical model/generator for the cloud gestures once research settles:
  right-bounded variability per element · peak plotting per density law · grain-dur
  and shape series generation · shape→sound translator · drawing tool constrained to
  realistic parameter scales (rate-of-change limits). Current research = learning
  what "correct" is; the engine codifies it. Methodology note: generate → tweak
  manually → reverse-analyze tweaks to refine the generator.
  **Methodology formalized 2026-08-11 → docs/ENGINE_FRAMEWORK.md** (span test for
  tweak-vs-new-model, Weber-law A/B step sizes, seeded renders, validated tweak
  analyzer `tools/analyze_tweaks.js`). Next builds queued there: ladder-battery
  generator, law linter.
- **P2 — Meta-track score object** *(composer, 2026-08-10)*: a meta track in the
  composer score where one drawn meta-curve (bell/crescendo, duration, dials) auto-
  generates the seven part-curves underneath via a chosen realization strategy
  (flow/convergent, repetition, noise). The generator scripts running in experiments
  ARE the prototype; promote to a score object when the strategies stabilize.
  (G5/palette lineage: a named, parameterized, reusable unit.)

- **P1 — Reaper scriptability / AI bridge** *(composer, 2026-08-10; eval done
  2026-08-11 → docs/AUTOMATION_EVAL.md)*. **Verdicts:** loopMIDI ports = manual
  (2 min, once) · Reaper tuba 8–10 setup = one-shot ReaScript
  `tools/setup_tuba8_10.lua` (clones full UVI state incl. −7.3 volume via
  TrackFX_CopyToTrack — **awaiting composer approval to run**) · UVI direct
  access NOT needed → defer until bites (ranked solves in the eval doc;
  utility-gain FX first). T1 daemon / T2 MCP still deferred until live-control
  pain recurs.
