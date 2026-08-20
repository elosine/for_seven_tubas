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

*(These belong to §7c — the third of the three scores. See §7 for the
composer → notation → performance architecture.)*

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

- **M5 — METRIC PRECISION IN THE DENSITY BUILDS (SECTION 1)** *(composer,
  2026-08-19 — THINKING, NOT DECIDED. **Scope corrected by the composer the same
  day: this is about the FIRST section, the density builds, where at the apex
  the parts are busy and NOT necessarily periodic** — not the trance section)*
  *(originally filed; recorded so the reasoning survives to
  notation time)*. The problem: make these sections **relatively rhythmically
  accurate without tuplet gymnastics**, landing on "the most performable version
  that is still rhythmically accurate."

  **The two poles, both rejected as-is:**
  - **Full metric notation** → tuplet gymnastics, to be avoided where possible.
  - **Pure spatial / near-graphic** — the composer was looking at a score with an
    **open bar**: real beamed and stemmed notes with flags (eighths, sixteenths)
    simply **laid out spatially**. Rejected because *"there is slippage there as
    well. If it is just the scroll bar and especially proportionate notation. I
    do not think that is good enough either."*

  **The proposal in between:**
  1. **Each player finds the groupings in their own notes and notates them
     traditionally** — beams, stems, flags.
  2. **A cluster is a bar, or a series of bars.**
  3. A **"gravitational conductor"** *(composer term, as dictated)* **marks where
     each bar begins.**
  4. The **scrolling bar remains**, and that notation stays **spatially
     proportionate**.
  5. **The uncertain part, and the one that might do the real work: a TEMPO PER
     BAR.** That is what could get metric precision into the cluster sections.

  **Why this is already half-built.** Day 19 `ASSIGN='fixed-tempo'` (PLAN 2af)
  was taken for exactly this reason — every player holds ONE steady pulse across
  a passage instead of jumping between tempi, verified to 0.094 ms against that
  player own grid, so **each part is already notatable as a single tempo with
  rests**. M5 is the next question up: how the bar, its tempo, and the player own
  beaming sit on top of that. Related: **M4** (rapid-staccato attacks as beamed
  vertical lines with a bouncing ball) is the same problem family — a device for
  reading precise attacks off a scrolling display.

  ### M5 amendment (composer, same day) — what the bar actually is

  The unit is **a grouping that behaves together**, not a fixed measure. Take a
  cluster of five or six notes whose rhythm is, say, *long short short long long
  long short* — **that group becomes its own bar**, written in ordinary notation
  (a quarter, two sixteenths, a tied eighth) which is **rhythmically accurate at
  some tempo**. Mark where that snippet begins with the **gravitational
  conductor / bouncing ball**, give a general tempo, keep the scrolling bar, and
  **from the player side it is simply a short phrase played at a tempo** — with
  the scroll and the ball helping them find that tempo.

  **This merges M4 and M5.** The bouncing ball of M4 is the same device as the
  gravitational conductor here: it marks where each grouped snippet begins.

  **The composer named the risk himself:** *"it still may not work out because
  those cluster notes may not break down into clear simple notation at any
  tempo."* **That risk is empirical and now partly measured.**

  **MEASURED 2026-08-19 — and the two sections turn out to be OPPOSITE cases.**

  *First measurement, on the wrong material.* `gen-aud-05` segment 35 (trance,
  `fixed-tempo`): every part is whole-number multiples of that player own beat,
  **max error 0.07 ms**, e.g. T3 reading `1 3 1 2 1 1 1 3 2 1 2` — the exact
  long-short-short-long shape, needing no tuplets. **But the trance material is
  periodic by construction, so this was never in doubt.** It says nothing about
  section 1.

  *Second measurement, on the material M5 is actually about.*
  `cloud02-10track` — the CLEANED, playable density realisation (1184 notes,
  peak 137 notes in 3 s) — apex window 48.9-54.9 s, beat constrained to a
  countable **0.30-1.00 s**, worst onset error over all ten parts:

      grid            best beat   worst error   verdict
      8ths                303 ms        69 ms   no
      triplet 8ths        300 ms        44 ms   no
      16ths               321 ms        33 ms   marginal
      sextuplet           359 ms        22 ms   marginal
      32nds               307 ms        16 ms   playable, but this is not "simple"

  **THE COMPOSER DOUBT IS CORRECT FOR SECTION 1.** There is no countable tempo at
  which the density apex falls into simple notation. You reach ~16 ms only at
  **32nds around 195 bpm**, which is precisely the gymnastics M5 exists to avoid;
  8ths leave 69 ms of slippage, which is audible.

  *(Method note: an unconstrained beat search "succeeds" at a 20 ms beat with
  8 ms error. That is a false positive — a 20 ms beat is not a tempo, it is a
  fine grid, and a 250 ms gap becomes 12 subdivisions. Any future search must
  constrain the beat to something a player can count.)*

  **What this implies, and it is the same lesson as the trance section.** The
  trance section is notatable because of a GENERATIVE decision — `fixed-tempo`
  assignment — not because of a notation trick. The equivalent move for section 1
  would be to **quantise the density material to a countable grid at composition
  time** rather than trying to notate un-gridded onsets afterwards. That is a
  compositional choice with an audible cost (the apex jitter is part of what the
  density builds sound like), so it is the composer call, not a technical one.
  The alternatives remain: accept 32nds, accept slippage, or use an M4-style
  device where rhythm is tracked visually rather than counted.

  **Caveat on the measurement:** one score, one 6 s window at one apex.
  Indicative, not exhaustive. The raw pre-cleaning scores (`clusterClouds02`,
  `densBld03-arc-v2`) are far denser still — a single player carrying 150+
  onsets in 6 s with 1-90 ms gaps — and are not playable as separate attacks at
  all, so they were not the fair test.

  ### M5 reframe (composer, same day) — the measurement is a CLASSIFIER, not a verdict

  **DO NOT RUN THIS YET.** The composer is collecting ideas; the experiments get
  designed and run when notation actually begins. Recorded now only so the design
  is waiting.

  **The reframe.** Do not look for one notation solution that covers the whole
  section. Look for **chunks** — *"if we can isolate patterns or chunks that at a
  proper tempo are relatively simple"* — and use the M5 simple-bar device on
  those. Whatever does not resolve gets something else. **Tuplets are not
  banned:** *"I am not saying we do not do any tuplets."* The goal is a MIXED
  strategy, chosen per chunk.

  **This invalidates the shape of my first measurement, not its numbers.** The
  table above reports the WORST error across all ten parts over one 6 s window,
  i.e. a single pass/fail for the whole apex. Under the reframe that number is
  the wrong statistic — **one bad onset condemns a window that may be mostly
  clean**, and the aggregate hides exactly the structure the composer wants
  found.

  **The experiment to design later** (sketch only, not built):
  1. Slide a window over a part and, for each candidate countable beat and grid,
     record per-ONSET error rather than the max.
  2. Segment into maximal contiguous runs whose onsets all fall within a chosen
     tolerance (~15-20 ms) at one beat and grid.
  3. Report **coverage**: what fraction of the section is claimed by simple
     chunks, at which tempi, and how long the chunks are. A chunk of 3 notes is
     useless; 6-12 notes is a bar worth notating.
  4. Report the residue separately — that is the material needing tuplets, an
     M4-style visual device, or a compositional re-think.
  5. Likely knobs: tolerance, minimum chunk length, whether a chunk may change
     tempo from its neighbour, and whether chunks must align across players or
     may be per-part.

  **Working-method note:** the composer explicitly wants notation approached this
  way — *"these are the types of experiments we can run... this is actually the
  type of thing I am going to want to be doing."* Notation here is an empirical
  question about the material, not a formatting stage applied to it.

  **Open:** whether the tempo is per part or the bar is a shared window · whether
  a per-part tempo is notated, conducted, or both · whether the "gravitational
  conductor" is a person, a cue in the scroll, or a click · whether bar lengths
  follow the generator realignment cycle `C` (attractive: `C` is exactly where
  all streams converge, which is arguably where a bar wants to begin).

  ### M5 second amendment (composer, same day, typed) — Mists baseline · first-level rationals · count vs react

  Typed while waiting on credit renewal (verbatim in COMPOSER_LOG day 19;
  assessment + experiment slate in RUNNING_LOG day 19). Still COLLECTING — the
  do-not-run-yet stance holds until the composer green-lights the slate.

  1. **The baseline is named: Xenakis, Mists** — proportionately spaced
     notation, **beams grouping notes that sound grouped** in each part. This
     sharpens the middle proposal: beaming = PERCEPTUAL grouping, not metric
     grouping, and exists whether or not any tempo fits. Consequence for the
     chunker: segmentation and rational fit are separate stages.
  2. **The chunker vocabulary widens to FIRST-LEVEL RATIONALS** — one-level
     tuplets against a countable beat (9:2, 7:3 yes; 21:19 no; nesting no).
     **This re-opens the apex question:** the day-19 measurement searched
     straight grids only (8ths→32nds, triplet, sextuplet), so its negative
     verdict does not cover this vocabulary — a p:q tuplet reaches a fine
     effective grid while the counted referent stays slow. Note also: the
     first-level restriction is what keeps the analysis meaningful — with an
     unrestricted vocabulary any onset list "fits" some 21:19, so the
     restriction is a complexity prior, not a taste preference.
  3. **The GC — gravitational conductor — moves to the center.** *"If you
     group a few notes into something that is beamed and proportionate you
     have a GC… a bouncing ball that lands like an object under gravity, to
     note precise begin time"* — plus the scrolling cursor → *"you can more
     or less play the notation pretty accurately."* Mechanism worth
     recording: the cursor is zero-order (reports where NOW is); a falling
     ball is PREDICTIVE — arrival is readable from the trajectory before it
     lands, and bounce height encodes the coming gap (flight time t → height
     ∝ t²), so the device shows the next duration BEFORE it sounds — which is
     what a conductor's preparatory beat does. That is the falsifiable reason
     the ball should beat the cursor for precise attacks.
  4. **The count/react doubt (possible reversal of point 5 above):** *"maybe
     the tuplet + tempo is misguided; players probably either count or react
     but not both — one doesn't necessarily help the other."* Candidate
     resolution, to test, not decided: where the chunker DOES find a
     first-level rational, put the periodicity in the ANIMATION, not the
     glyphs — the GC bounces the chunk's internal pulse while the notation
     stays proportional — so the counting is externalized and the player only
     ever reacts.
  5. **Method, stated as intent:** good data (high-res MIDI onsets) + AI
     analysis → run experiments, **eliminate strategies with recorded reasons
     for failure**, settle on performance strategies, *"learn or invent some
     new things along the way."*

  ### M5 status note (2026-08-19, later) — side project chartered; GC correction

  - **CORRECTION:** the "gravitational conductor" is not new coinage — it is
    **`GCMaker`**, the well-developed device in BOTH prior performance apps
    (piece #1 and #2, `scripts/performance_parts_patches.js` et al.). Port +
    extend, not build.
  - The experiments are now DESIGNED (not run) in
    **`docs/NOTATION_EXPERIMENTS.md`** — a **concurrent side project** to the
    §7 architecture build (composer's framing: *"main but separateish build…
    this is a concurrent side project that will eventually get folded in"*);
    fold-in contract in that doc. Slate: E1 chunker · E0 floor ladder
    (discovery class, composer-designed) · E2 tap harness (composer as n = 1
    subject, bias stated and pre-registered) · E3 GC port. Mists baseline is
    a candidate, not a commitment — composer *"open to paradigm shifts."*
    Per-experiment green-lights required; A1 remains next on the main track.
  - **Reframe (composer, same day, binds evaluation):** the goal is *"phrase
    performing strategies within a context of rhythmic complexity"* — timing
    accuracy is the context, phrasing is the goal. GC competence profile
    filed in NOTATION_EXPERIMENTS §4: strong on entries and
    ensemble-distributed rhythms, weak at phrase level, and **attack-coupled**
    (the landing connotes a percussive attack; smooth-ramp entries must
    resist it). Live hypothesis: ball carries time, page carries phrase.
  - **E1 RUN (2026-08-19, composer's "digestible chunk"):** results in the
    NOTATION_EXPERIMENTS run ledger and RUNNING_LOG day 19.
  - **Status update (2026-08-19, night):** E1 + E1b RUN (→ D43); the main
    track's Phase A (A1–A5) completed the same day — see §7 amendment. The
    "A1 remains next" line above is superseded; main track = Phase B gate.

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
- **2h — PIECE ASSEMBLY** — `doing 2026-08-15` — **piece-s14 (136.3 s)** — piece-s01…s07c: opening
  (GESTURE-1) + 5 inserted gestures, all with movable/stretchable META group
  shapes (groupId; drag=move, edge/box/panel=scale); GESTURE-2 ×0.75
  at 50 s, reharmonized m6 on F# (s07b) then F (s07c); s09–s13 = INT2 blasts +
  clusters. **s14 (2026-08-16) = DB3 placed** — source
  `scores/densBld03-take1-fp.json` (packed + fp arc, ORIGINAL tonality), group
  `grp-db3-01` at **114.101 → 136.327 s**, gap 3.48 s after INT2 (the INT1→DB2
  gap). **Source = the composer's hand-grained copy** (`densBld03-arc-v2b`
  section E: fp arc + 5 surge long tones), banked and placed with
  `tools/place_gesture.js` (DENSITY_PIPELINE §6).
  **s15 = composer removed that DB3. s16 = DB3 in MESSIAEN MODE 3 ON F at
  113.54 → 135.77 s** (`bank/DB3-m3F.json`, group `grp-db3-m3f-01`) — the
  composer's tonality pick from `densBld03-tonalities-surge`, 26 pitches G1–F4,
  HARD 0 / soft 0. Verified in the app each time: badge `⚠ 42 soft`, **identical
  to s13/s15** — DB3 contributes zero conflicts in either tonality.
  **Still open:** the apex decision.

- **2w — GESTURE BANK + RECALL (the second insertion path)** — `shipped
  2026-08-16` *(composer: "capture the 2b version somewhere as a gesture/object
  so it can be recalled… I want it as an insertion option, just done
  differently")*. The Insertion strip cannot carry orchestrated material (D23) —
  so `tools/bank_gesture.js` captures a finished gesture into `bank/<ENTITY>.json`
  (the format `bank/GESTURE-2.json` already used, made reproducible) and
  `tools/place_gesture.js` recalls it into any score by name, with `--list`,
  `--after <gap>` / `--at <time>`, `--dry`, auto-numbered `grp-<entity>-NN`,
  marker and density-contour META shape. Generalises the per-piece one-off
  scripts; **verified by reproducing `piece_s14.js`'s output exactly** on
  layer/time/pitch/technique/envShape/colour, after which that script was
  deleted (one code path). Banked so far: **DB3**, GESTURE-2. Also fixed the
  bug the composer caught — see Principle 4: labels written to the `markers`
  array never render; `tonality_variants.js`, `build_versions.js` and
  `pack_take.js` now write them into `objects`, and the five affected scores
  were repaired in place (`densBld03-arc-v2b` patched, never regenerated).

- **2n — ONE-SHOT SAMPLE LENGTHS** — `done 2026-08-15` — probe + analyzer over
  80 notes: **fortepiano, cuivre and staccato are all FIXED one-shots** (the
  sample ends itself), with the same multisample sawtooth the cresc patch showed.
  fp 1.35–2.22 s · cuivre 0.99–1.35 s · staccato 0.33–0.53 s. Tables:
  `bank/sample_lengths.json`; surveys in `docs/SI2_oneshot_lengths.md` +
  `docs/SI2_staccato_lengths.md`. **Consequence (wired into insert, playback and
  all three group-scaling paths): ORD is the only real duration** — fixed
  articulations take their true sample length and never stretch, they only
  translate. *Why it mattered:* inserted fp blasts were drawn at 3.0 s while the
  sound died at ~1.7 s — the block was lying by nearly 2×.

- **2o — CUIVRE IS VARIABLE-LENGTH** — `open 2026-08-15` — composer: *"you can
  play shorter cuivres."* The survey measured where the cuivre sample ENDS
  ITSELF (0.99–1.35 s) but never tested whether an early note-off truncates it,
  so that figure is a **ceiling, not a floor**. Cluster-sandbox cuivre is now
  variable-length (drawn duration, right-edge draggable, scales with stretch),
  defaulting to the measured length; fp and staccato stay true fixed one-shots.
  **Open question for a 60-second probe:** does note-off cut the cuivre sample
  short, or does it always ring to its full length? If it rings, the notation is
  right but the mock-up will over-ring short cuivres. Blast-path cuivre is
  unchanged (chord-level articulation at measured length) pending the composer's
  call on whether the two should agree.

- **2p — CLUSTER SANDBOX** — `shipped 2026-08-16` — `/clusterview.html`:
  42 imported played clusters + in-app recording with live thru; piano-roll
  editor (duration bars, per-note pitch/time/length/articulation/velocity);
  non-destructive transforms (log stretch 0.25–10×, tonality remap with pooled
  mode + no-repeat kick, reverse, octave-fold, thin, velocity); lists + items
  preset model; composer-score strip source menu (Blasts | Clusters).
  Data: `bank/cluster_bank.json`, API `/api/clusterbank`.
- **2q — VELOCITY vs CC7 (OPEN, blocking nothing yet)** — `open 2026-08-16` —
  the cluster sandbox drives dynamics with **note velocity** (D12); the composer
  score drives them with **CC7** (`PREARM_S = 0.15`). Both cannot be right for
  the same library. **Test:** one pitch, velocities 30 / 70 / 127, listen for a
  dynamic difference; then the same pitch at CC7 40 / 80 / 127. Whichever the
  instrument actually responds to becomes the single rule, and the other side
  gets converted. *Why it matters:* dynamics chosen in the sandbox must survive
  into the score and, later, into the notation.

- **2r — PLAYABILITY / COLLISION AVOIDANCE** — `shipped 2026-08-16` — inserting
  blasts over clusters (and the converse) used to double-book players silently.
  **The mock-up cannot reveal this**: technique = MIDI channel (staccato = a
  separate port), so two overlapping notes on one player hit two UVI channels and
  both sound cleanly. Built: one shared occupancy model over every waveCurve that
  occupies a player (drawn crescendo material included, solo state ignored) · a
  two-tier rule — **HARD** = intervals overlap (physics) vs **SOFT** = too tight to
  re-tongue or leap (estimates: 0.10 s staccato / 0.25 s after fp+cuivre / +0.012 s
  per semitone, from 2j's "never trill faster than you can slur") · conflict-aware
  placement in both inserters (`assignBlast` = distinct player each, keeps the
  pitch-ordered stage reading; `assignCluster` = legal lane, LRU tie-break) · a
  live red/amber wash on the lanes, recomputed on **every** mutation so dragging
  cannot defeat it · a resolver panel (per-conflict drop-either-side, **nudge**
  the last insert to the nearest clear time, **auto** = blast keeps its voicing and
  the cluster yields). **Insert never refuses and never silently drops** — one code
  path, everything lands, conflicts are marked, removal is an explicit click.
  Deferred small items in `docs/NITS.md`.
  **MOVE TO ANOTHER PLAYER added 2026-08-16 (composer's call — "that belongs in
  the resolution part"):** every conflict row offers `→ T7` naming the best free
  player before you click, for **soft rows as well as hard**. Moving is the right
  primitive — dropping is destructive, moving is not — and it is the *only* thing
  that fixes a RATE problem (nudging in time cannot help; the line is still as
  fast). `auto` now moves before it drops, and only drops when no player is free.
  On piece-s11, **32 of the 42 soft spots are fixable by moving to a fully free
  player**; the other 10 need a drop or acceptance.

- **2s — BACK-AUDIT of existing material** — `done 2026-08-16` — the composer's
  question: *"is it too late — are there traps in what I already made?"*
  **Answer: no.** `tools/audit_playability.js` over all 164 saved scores —
  **every `piece-s01…s11` and every `dens1…dens10`: ZERO hard conflicts.** The
  generators did respect one-note-per-player. Hard conflicts exist only in
  (a) the raw PLAYED takes (clusterClouds02 3097, cluster_samples_01 2442,
  vertical_shapes_01 671, clust01-cleaned 71) — one human at a keyboard, source
  material that gets distributed across players at insert, so expected and fine —
  and (b) the r1/r2 research renders, which are experiments, not orchestration.
  **The one real finding:** 42 soft spots in piece-s11, all in the pointillistic
  cloud material (CLOUD02-D ×18, CLOUD02-I ×13, STAC ×11) between 20–60 s, asking
  one player for **6.8–7.7 attacks/s** — fastest T1 @ 40.17 s. That is at the edge
  of tuba single-tonguing and is the only playability question the piece actually
  contains. *Nothing to redo; one thing to listen to.*

- **2t — DENSITY PIPELINE: played take → playable ten parts** — `shipped
  2026-08-16` — the reusable process for every density buildup from DB3 on;
  full playbook in **`docs/DENSITY_PIPELINE.md`**. Built because DB3's take
  (251 notes, apex **54.5 attacks/s**) demands far more than ten tubas holding a
  0.45 s staccato one-shot can give (**ceiling ≈ 22/s**), and the mock-up cannot
  reveal it (2r).
  - **PACK TO CEILING (`tools/pack_take.js`)** — the composer's model, and it
    replaced an earlier prune-then-space pair: one convergent pass, no
    iterate-and-check. Per note, in time order — free player? place it · no?
    nudge to the earliest opening within `--budget` · budget blown? accept a
    tight-but-legal spot · nothing fits? delete. **Deletion is the last resort by
    construction**, so density rides the ceiling and no thinning amount is ever
    guessed. Writes a ten-part score you can load and hear.
  - **The budget is small on purpose.** Nudging does NOT retain density — at
    saturation a shifted note walks into the next collision (composer predicted
    it; 60 ms → 400 ms buys 8 notes). What 60 ms buys is **cleanliness: 37 soft
    flags → 0**, for a mean 35 ms displacement.
  - **`--pick spread`** decides which note in a clump dies: top, bottom, then
    farthest-from-everything-kept. Extremes first keeps the band's registral
    WIDTH as its thickness drops; the max-min fill stops the middle hollowing
    out. `random` (seeded) and `arrival` built in, unused.
  - **LEAP-AWARE `assignCluster`** (the app, and the tools mirror it) — the lane
    tie-break was pitch-blind, handing one player 26-semitone jumps in 0.35 s
    while another sat in the same register. Leap term competes with LRU and can
    never outrank the tier. On DB3's take: **mean leap 7.9 → 3.1 st · octave-plus
    leaps 58 → 11 · part span 29 → 23 st · hard 154 → 135** (pitch-clustered
    lanes pack better). Also the only real fix for a soft RATE flag — the jump
    moves BETWEEN players rather than being asked of one.
  - **`tools/audit_playability.js --parts`** — per part: notes · tessitura ·
    mean/max leap with timestamps · tightest attack pair · rate · every flag with
    the interval it had and the interval it needed. The report that says WHO is
    overloaded, which is what you need before choosing move-vs-delete.
  - **DB3 result:** 160 of 251 kept · 51 nudged · 91 deleted (all 20.0–23.1 s) ·
    **HARD 0, soft 0** · everything before 18 s identical to what was played ·
    apex plateaus at the ceiling instead of spiking. The replaced two-pass
    approach kept only 127 and still left 1 hard + 1 soft.
  - **Verified in the running app**, not by inspection: the app's own
    `assignCluster` returned 135/10/3.13 st/11 against the tool's 135/10/3.1/11 —
    exact agreement — and the packed score loads with badge `⚠ 0`.
  - **Still the composer's call:** the apex treatment. Zero hard costs 91 notes,
    all at the apex. Alternatives are more players (M1) or converting the apex to
    sustained material so overlap becomes the point rather than a conflict.

- **2u — TONALITY SUB-MENU in the Insertion strip** — `spec'd 2026-08-16, not
  built` *(composer: "I don't wanna see an icon for every variant, but a sub-menu
  where I could audition it in different tonalities")*.
  - **Most of it already exists.** The cluster sandbox has the whole remap engine:
    **15 named tonality sets** (cl low/mid/high/spread · BbE 2oct · 5ths 30/37 ·
    oct F#/Bb · m7/m4/m6 (F#) · m3 (F) · Bhairav (F) · row placed) **+ all 33
    VERT01 chords**, a **pooled/literal** switch (pooled = the target's pitch
    classes over the whole range, so register and contour survive) and a
    **no-repeat kick** (distinct sources colliding on one target get bumped;
    genuine repeats stay repeats). This is a surfacing job, not a build.
  - **The UI:** one `tonality ▾` next to the list picker, default
    `— original —`; picking one re-pitches the SELECTED item live (mini redraws,
    `hear` auditions it, `insert @ cursor` inserts the re-pitched version). A
    `pooled/literal` chip beside it — it changes the result enough to be visible
    rather than buried. **Arrows already step items; shift+arrows step
    tonalities** — that is the hammered browse/audition loop that justifies UI
    here at all.
  - **The catch that must be built in from the start:** re-pitching changes
    playability. A fixed one-shot's length depends on its pitch (staccato
    0.33–0.53 s, fp 1.35–2.22 s) and the soft rule is leap-dependent, so a remap
    can create real conflicts. **Measured on DB3 (2026-08-16):** the narrower the
    pitch set, the worse it gets — Messiaen m3/F (26 pitches) came out clean,
    while m5/F# (17) produced 9 hard and the BbE 2-oct cluster (20) produced 12.
    So the audition must show the conflict count *while you are choosing* — a
    variant with hard conflicts sounds perfectly fine in the mock-up (2r) and you
    would never hear that it is unplayable.
  - **Interim, and it works:** `tools/tonality_variants.js` lays N harmonies of a
    gesture end to end with the conflict count in each marker label. Same loop,
    no UI. **Labels are `markers`, not objects** — the full name + pitch count +
    range + conflict count at each section start, the short name repeated every
    5 s so one is always on screen mid-section, and an `— end —` marker.
    **`scores/densBld03-tonalities-surge.json` is the DB3 run** (2026-08-16,
    built off the composer's hand-grained section E via
    `tools/extract_section.js`; the earlier `densBld03-tonalities.json` used the
    AI fp version and is superseded). Conflict counts are identical either way —
    the 5 surge conversions add none.

- **2v — MORPHING CHORDS** — **`done 2026-08-16`** — all five phases built, heard
  and measured. **`Morph` button in the composer score**: generate, audition,
  insert; it never edits. Six models over one state vector (cents / technique /
  level), a breath-and-striation carrier, and **dynamics as a layer on every
  model (D24)**. Engine `score/public/morph.js` is pure and carries **101 unit
  tests**; emit layer has registry-driven panic; morph notes are ordinary
  waveCurves + `morphBend` (D25); wide glissandi are re-keyed mid-note (D26).
  **Measured on the instrument:** bend ±1.99 st linear with no artifacts ·
  spectral targets land within **0.4 ¢** · fan waypoints within **1.0 ¢**
  including both re-key seams · composer hears **no seam**. Findings in
  `docs/MORPH_FINDINGS.md`, settings + dial boundaries in
  `bank/morph_recipes.json`, the full arc and a COLD-START section in
  `docs/RUNNING_LOG.md`. **Five of six models produced material the composer
  called interesting or better; three are keepers usable in the piece.**
  *Two surprises worth carrying:* the bend-residue trap is real (+49.4 ¢ on the
  next note), and the **quartertones patch is NOT a uniform quarter tone**
  (+23 ¢ at F2 → +57 ¢ at C4), which settles PLAN 2l's first question with a
  different answer than expected — bend is the vehicle, the patch is a colour.

- **2z — GESTURE SHAPING** — `BUILT 2026-08-16 (day 12) — gates G0–G5 all
  implemented and verified in the running app; the ONLY thing outstanding is
  G5's listening battery, which is the composer's (variants G–N in the Morph
  panel). docs/plans/GESTURE_SHAPING.md §15 records where the code corrected
  the plan. 2y is now unblocked.` *(was listed as 2x, colliding with the texture
  sandbox below — two concurrent day-10 sessions both appended 2x; the sandbox
  keeps 2x, this is now 2z)* *(composer:
  "the meta shape is really the sound itself")*. A morph — or any gesture —
  should have an envelope at the GESTURE level: a designed **attack** (possibly a
  different technique, e.g. cuivre), a **body**, and a designed **release**, with
  the tuba parts filled in to realise it. **This inverts the present order:**
  today the carrier derives entry and exit from breath logic and the shape is
  emergent; the proposal is shape first, parts second — the same relation the
  META layer already has to the density builds. Lineage: the granular-synthesis
  model. Recorded in `docs/RUNNING_LOG.md`; needs its own plan and build.

- **2y — MODEL ↔ ACTUAL: storage, recall, insert** — `MA0–MA3 BUILT 2026-08-16
  (day 12) — model store + validator + recipe engine + actualization + panel, all
  gates verified in the running app. ONLY MA4 outstanding: the composer names the
  models, blesses the recipe slates, and makes the first real actuals.
  docs/plans/MODEL_AND_ACTUAL_PLAN.md §13 records what was built and decided.` —
  concept: **`docs/plans/MODEL_AND_ACTUAL.md`**. The composer's
  virtual/actual distinction: a **MODEL** is *"a point plus the directions worth
  travelling from it, and how far"* — a sonority, its elements, a slate of
  recommended morphs with their **boundaries**, and **recipes** collapsing several
  parameters into one dial. An **ACTUAL** is one decided, concrete sound object.
  Two stores plus a process from virtual to actual. **The ACTUAL half largely
  exists** (2w gesture bank; `extract_section.js` already excerpts by time); the
  new work is recipes, boundaries and the one-dial collapse.
  `bank/morph_recipes.json` is the first instance — it already stores the dial
  boundaries learned by ear.

- **2v-orig — MORPHING CHORDS (original spec, superseded by the entry above)** —
  the INT2
  "morphing crescendo" branch, generalized: start a sonority, change it over
  time (pitch / technique / dynamics) via six named models (M1 detune bloom ·
  M2 spectral drift · M3 fan · M4 colour morph · M5 spacing migration · M6
  balance morph) over a breath/striation carrier, with conversational AI
  control (params file + panel poll), generation-time playability flags, and a
  bend-hygiene probe suite first (the stale-bend trap = the CC7-residue class).
  **Full implementation plan: `docs/plans/MORPHING_CHORDS.md`** — architecture,
  schemas, MIDI formulas, probes, phase gates, failure-mode ledger; written to
  be implemented cold by a separate session. Risk floor: even if every probe
  fails, M4+M5+M6+carrier+loop ship whole. Supersedes the gliss-patch idea in
  the PLANNER's morphing-crescendo drill-in (patch unusable — composer tested).

- **2x — TEXTURE / ATTACK-FIELD SANDBOX** — `ALL PHASES BUILT 2026-08-16 —
  docs/plans/TEXTURE_SANDBOX_PLAN.md (v3). Phases 0–4 done, every machine-checkable
  gate item passed. WHAT REMAINS IS LISTENING — see below.`
  **D29 CONFIRMED: attack fields only, no bend in this build.**
  - **THE LISTENING SLATE (the only thing left, and only the composer can do it):**
    SMEAR/RAIN/GALLOP distinct by ear · A/B with no residue · **humanize A/B on
    one SMEAR and one RAIN** (the fragile/robust prediction's first real data
    point) · which pitch set is the keeper, and whether pitch dissolves the accent
    artefacts (E5) · does `rain → stutter` still SNAP (phase06 heard it; the
    `dissolve` process is built to ask) · the **crossover battery** — where a
    groove stops being parseable and becomes texture (§5's open question, answer
    goes back as data). **All five models read UNHEARD in the store and cannot be
    banked as keepers until they have a verdict — that gate has no `--force`.**
  - **Phases 2–4 — `done 2026-08-16`.** **Pitch layer:** `tonality.js` extracted
    from clusterview (400/400 randomised equivalence, clusterview rewired in the
    same commit), policies unison/perVoice/draw/cycle, pooled/literal.
    **Morphs + pockets:** breakpoint curves on bpm/jitter/scatter/level/techMix,
    a category morph whose endpoints match the static models within 1%, and
    parametric + literal pockets. **Stores:** `texture_bank.js` (mutation-tested
    provenance integrity, mandatory robustness verdict) and `place_texture.js`
    (2w conventions, drag/scale verified). **317 assertions.**
  - **THE FINDING THAT REACHES PAST THE SANDBOX (Phase 2, MEASURED):** the 23/s
    density ceiling is **C3-specific**. All 13 phase-shifting experiments ran ten
    players on one C3, and C3 (0.42 s) is the **10th shortest** of the 36 measured
    staccato samples; the ring runs 0.33–0.53 s and is **not monotonic** in pitch.
    Give a texture any real pitch set and the ceiling falls to **18.9–20.8/s** —
    so a texture calibrated by ear at unison C3 is **~18% too dense** once it has
    pitches, and the mock-up plays the difference perfectly cleanly (2r). The
    engine now computes the ceiling per render instead of using a constant.
  - **Phase 1 — panel floor — `built 2026-08-16, listening gate open`.**
    **`Texture` button** in the composer score next to `Morph` →
    `score/public/texture_panel.js` (injects its own button and DOM, so
    `composer.html` is a two-line diff). Five category MODELS
    (**smear · ticks · rain · gallop · groove**) in `bank/texture_models.json`
    with their heard descriptions, measured directions and a `_vocabulary`
    block; the AI loop writes `bank/texture_params.json` and the panel picks it
    up in **888 ms measured**. Seed stepping · PIN/A-B · Humanize · live
    conflict badge · Insert at playhead as a draggable group with a META shape.
    **Badge verified equal to `tools/audit_playability.js`** (90 hard / 0 soft
    on both, checksum-identical render). **175 assertions**, Phase 0's
    byte-identity corpus intact. **Four defects found by running it**, incl.
    seed stepping being silently dead (R5) and the badge being structurally
    blind to sample-ring overlap — the latter now its own loud indicator, since
    the mock-up plays those cleanly (2r) and the ear cannot catch them.
    **Still needs the composer:** SMEAR/RAIN/GALLOP distinct by ear · A/B with
    no residue · humanize A/B on one SMEAR and one RAIN (the fragile/robust
    prediction's first real data point).
  - **Phase 0 — engine extraction — `done 2026-08-16`.** The generator moved out
    of `tools/phase_shift.js` into **`score/public/texture_engine.js`** (pure,
    browser + node, the `morph.js` dual-load pattern); the CLI keeps the presets,
    score writing, MIDI and the report. **Gate passed wider than specified:** all
    **nine** preset scores regenerate **byte-identically** (11,740 objects), and
    extracted-vs-pre-extraction output is identical across **11 renders on both
    onset models**. `tools/test_texture.js` = **129 assertions**, verified by
    mutation testing (8 deliberate breakages, all caught; one uncaught mutation
    exposed a real gap — velocity was only ever exercised at level 7.5 — now
    closed). Metric pair added: **sd** (evenness, reproduces the research table
    to within 0.15 ms) and **unevenness** (does the figure repeat — the
    scatter-vs-jitter discriminator the vocabulary needs).
  Composer's design rulings: qualitative/recipe interface (AI holds the dials,
  one-dial feel) · **Texture panel in the composer score**, no separate page,
  auditioning through 2v's `morph_emit.js` · no editor (regeneration only) ·
  both the quick panel loop AND long-render **pockets** (parametric first,
  clipping as fallback) · stores aligned with 2y's MODEL↔ACTUAL (the five
  categories ship as the first five MODELS) · seeds + PIN/A-B + humanize as
  first-class machinery, robustness verdict required before banking a keeper.
  **Build after 2z/2y are clear of `composer.html`, or pull-before-every-chunk.** The continuation of 2j's research arc as
  a working surface. **Requirements + evidence:
  `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`** (written to be read cold by a
  stronger model, every claim tagged HEARD / MEASURED / inferred). Plan v2:
  qualitative/recipe interface (AI holds the dials), Texture panel in the
  composer score (no separate page), morph_emit reuse, pockets from long
  renders, stores aligned with 2y's MODEL↔ACTUAL.
  - **Sound-first control surface:** the composer picks a named category
    (**smear · ticks · rain · gallop · groove**) and the numeric dials follow.
    Dials: **density · scatter · jitter · spread · voices · articulation**, with
    measured ranges. Engine already exists — `tools/phase_shift.js`.
  - **R1–R10** include static textures that hold (spread 0), category morphs
    along a curve, a pitch layer from day one, **seed auditioning** (at ten
    voices a setting is a random variable, not a texture), a one-click
    **robustness pass** (human-scale timing error), always-on playability, and
    export both as score objects (D23 placement) and as MIDI.
  - **BLOCKED ON THE COMPOSER'S CALL (D29):** the 2j/2v scope split. 2v already
    owns bend, pitch sets, sustained rendering and dynamics, and its M1 "detune
    bloom" IS 2j's pitch beating. Recommended: 2v keeps everything bend-based,
    2x owns attack fields only.
  - **Biggest known hole:** pitch was never introduced — the whole rain/gallop
    map was made with ten players on one C3.

- **2A — MORPH CYCLING + THE SPEC LEDGER** — `FR-3/FR-6 BUILT 2026-08-17
  (day 13); FR-1/FR-2 superseded; FR-4/FR-5 spec'd, not built.` The engine had
  **one time value** doing two jobs, so lengthening a morph necessarily slowed it.
  Split into `carrier.span` (one-way gliss = pace) and `carrier.duration` (body),
  with the trajectory folding out-and-back instead of arriving and stopping —
  cycling is on exactly when `duration > span`. **Loudness needed no code**: it
  already rides the same progress. `carrier.release` forces a run-down which,
  because loudness rides progress, **closes the bloom back to unison as it
  fades**. 354 assertions, fixtures never regenerated.
  - Requests ledger **`docs/FEATURE_REQUESTS.md`** (FR-1…FR-6, composer's words,
    research, gates) · build plan `docs/plans/MORPH_CYCLING_PLAN.md` · section
    form **`docs/plans/MORPH_SECTION.md`**.
  - **Three engine bugs found by the composer's EAR**, all of one kind — a
    mechanism correct for the body reused where its assumptions fail: a release
    switched the body into cycling · the dynamics arch is not monotonic in
    progress so a release walked back through its peak (9.20 of 10) · the
    re-entry sneak-in is a crescendo inside a fade.
  - **Two pre-existing panel bugs:** `readFields` threw on every call in MODELS
    mode, so **dial nudging there had silently done nothing since MA3**; and
    `Save as ACTUAL` dropped every hand-typed field.
  - **Open: the fade-in/release blip is NOT diagnosed** (NITS) and blocks
    auditioning the attack. **Penn State = 15 minutes max** (PENN_STATE_RESEARCH).

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

- **2j — TREMOLO NOTATION & PHASE SHIFTING** *(composer notes, 2026-08-14 —
  the missing ingredient for 2i)*:
  - **Interlocking tremolos among performers**, notated accurately enough to do
    real **phase shifting**. Proposed device: a **sine-wave figure whose peaks
    and troughs say which note you're on** (peak = one pitch, trough = the
    other). Phase-shift the players' sine waves against each other → literal
    phase shifting in the ensemble.
  - **Research:** find the **perceptual limit for rapid tremolo frequencies**
    (slow ones too, but rapid is the question), then devise an **alternating
    strategy for quick tremolos** — when one player can't articulate that fast,
    the tremolo interlocks across players (same hocket logic as the ostinato
    port).
  - **Irregular tremolos:** the sine figure may still carry them. Animation
    options to try: a **ball tracing the wave**, the **wave fill**, or both.
  - **Ostinato ↔ sine coupling:** the sine humps must **follow the human-sampled
    ostinato patterns** — irregular in **TIME only** for now (amplitude stays
    regular; amplitude irregularity held as a maybe for later).
  - **FIRST TESTS BUILT 2026-08-14** (`trem01-single`, `trem02-phase`, tool
    `tools/trem_tests.js`). **Speed ceiling — the governing rule from the tuba
    literature is "you must not trill faster than you can slur"**, so max
    tremolo rate = max clean legato slur for that interval/register; no
    published notes-per-second figure exists, so the tables are stepped to
    ESTIMATES pending the composer's ear: **half step 4.5 Hz (9 alternations/s),
    fifth 3.0 Hz (6/s)**; Hz = one up-and-down cycle. Also noted in the
    literature: trills/tremolos sound **muddy in the low range** — relevant at
    F2. Phase-test finding: with notes on every half-cycle, **180° = onsets
    ALIGNED but pitches opposite** (a sustained minor 2nd — the composer's
    sine-wave peak-vs-trough model exactly), while **90° is the interlocked
    hocket** state.
  - **PHASE SHIFTING AS A TEXTURE DEVICE — `research arc COMPLETE 2026-08-16`
    (D27–D29); continues as 2x.** Full research
    doc **`docs/PHASE_SHIFTING.md`**; running notes in `docs/RUNNING_LOG.md`;
    generator `tools/phase_shift.js` (named presets) + `tools/midi_out.js`.
    Vocabulary from the composer's ear: **smear · ticks · rain · gallop**. Four
    dials — **density · scatter · jitter · spread** (§5G). Two physical ceilings:
    ten tubas on staccato cap at **~23 attacks/s**, and **stage width alone
    imposes ~30 ms of scatter**, so dead-even smear is unreachable live. Standing
    performance rule (composer): **no texture may depend on a precise beating
    rate or precise cents** — graphic/approximate indications only, and every
    keeper must survive a human-error perturbation pass. Experiment plan +
    status: PHASE_SHIFTING.md §10.
- **2m — MACRO-FORM: long swells ⇄ choppy sections** *(composer, 2026-08-14)*:
  the meta-level alternation of the piece — **long swells interspersed with
  choppier sections**.
  - **NEXT SECTION = the choppy one** — the 2i material (blast, blast, the
    counterpoint).
  - **After that: a LONGER version of the first swell** — open question the
    composer flagged: *what does that stretching actually look like, and how do
    we achieve it?*
  - **The hazard, stated:** we have uniform time-scaling already
    (`gest2-compress`, ×0.75/×0.5) and it preserves rhythm ratios exactly — but
    stretching is not symmetric with compressing. Slowing everything drops the
    event rate, so a stretched swell **thins out** and can fall under the
    continuity/fusion thresholds we calibrated (finding 15). "Longer" probably
    does not mean "slower".
  - **Three candidate strategies to test:**
    (a) **uniform time scale** — the honest inverse; longer and sparser, feel changes;
    (b) **carrier stretch + density fill** — stretch the density *arc* but
        regenerate events so the local event rate holds → longer shape, same
        texture. Likely the right reading of "longer version, same feel"; the
        analyzer's carrier fit (`analyze_take.js`) already supplies the arc;
    (c) **accordion / perceptually-weighted stretch** — stretch the sparse
        regions more and the apex less (L4's saturation logic), so the climax
        keeps its density while the approach lengthens.
- **2l — QUARTER-TONES & SPECTRAL CHORDS** *(composer, 2026-08-14)*: use the
  **quarter-tones** available on every tuba (`quartertones` = "Quartertones
  Ordinario", `tubaNb` **ch 2**, range 30–64) and **find spectral chords** for
  the harmony palette.
  - **First thing to determine (a 2-minute A/B):** how the patch maps — is each
    key the quarter-tone neighbour of the SAME key on `ord` (a 50-cent-shifted
    duplicate set, so ord + quartertones together = full 24-TET), or a
    compressed 24-TET keyboard map? Its range (30–64 vs ord's 30–65) suggests
    the shifted-duplicate reading, but confirm by ear before any chord is voiced.
  - **Why the two items belong together:** the harmonic partials that make a
    spectral chord sound *spectral* are exactly the ones 12-TET can't spell —
    partial 7 (−31¢), **11 (+49¢, the classic half-sharp)**, 13 (−41¢), 14
    (−31¢). Quarter-tones land all of them within ~25¢ across 10 parts.
  - Candidate fundamentals: the piece's standing **F** (F2 = 41) and **Bb**
    anchors — voice partials 1–16 over the ten parts, plus compressed/stretched
    (Grisey-style distorted-spectrum) variants for the palette.
  - Feeds: the harmony ledger (2g) and **2i** — a long crescendo on a spectral
    chord is the Grisey-lineage version of that section's opening move. Also
    partly covers the shelved raga-intonation note without needing pitch-bend
    support in the engine.
- **2k — PERFORMANCE SCORE: group rehearsal mode + entry page** *(belongs to §7c
  — all performance thoughts gather there)* *(composer,
  2026-08-14)*: build a **group rehearsal mode** that is robust and **not
  fragile about which instance is the leader score and which are followers**;
  and **rework the splash/entry page** so it's far clearer and simpler what
  you're doing and how to do it. *State:* piece #4 has only the composer app +
  sandbox so far — the performer app is the piece-#2 `public/index.html`
  lineage, so this is a port-plus-rework, not an edit in place.

- **2aa — PULSE SEQUENCER STRIP (the trance section's sandbox)** — **`v1 BUILT
  2026-08-17 (day 16) — verified in the running app except the sound, which is
  the composer's audition. tools/test_pulse.js 103/103, mutation-tested.`**
  *(composer realignment, day 15 evening; supersedes the earlier
  matrix/console sketches for this section — those are DEFERRED passes, below)*.

  **The need, verbatim concept:** a steady pulse grid (the Ghost-Trance final
  section, `tranceSB01-2` is the live sketch); the composer clicks any COLUMN
  (impulse) and assigns it a SONORITY from a menu, then hears the whole grid in
  real time, looping, until the pattern of harmonic change is right. This is a
  hammered browse/audition loop → UI is justified (memory: sandbox-UI-vs-AI
  line). **v1 is audition-only. It writes NOTHING to the score.**

  **Build (all pieces named; a cold model implements from this):**
  1. **`bank/pulse_palette.json`** — the sonority menu, data not code:
     `{ _contract, entries: { <id>: { label, pitches:[midi…] } | { ref:'S008' } } }`.
     Seed it with: `FIFTHS` = [31,36,41,45,49,52,54,56,59,62] (the tranceSB01
     accretion chord) · `CLUST10` = 10 chromatic notes centred mid-range
     (bank range is MIDI 30–67 → 44–53, G#2–F3; centre adjustable) · one
     pitch-class entry per note = ALL octaves of that pc within 30–67 (e.g.
     `F` = [41,53,65]; the composer said "eleven notes" — **default to all 12,
     one open question**) · `ref` entries for the 16 staccato + staccato-cuivre
     bank sonorities: S001 S002 S008 S011 S014 S017 S020 S023 S026 S029 S032
     S035 S038 S041 S044 S047 (these are the staccato pair, positions +1/+4,
     of each 6-block in `blast_taxonomy.json` sonorities). `ref` resolves LIVE
     from the taxonomy at load so renames/edits propagate.
  2. **Server route** `GET /api/pulsepalette` in `score/server.js`, exactly the
     `/api/shapepresets` pattern (read file, no cache).
  3. **`score/public/pulse_seq_panel.js`** — floating panel on the
     morph_panel.js chassis (draggable, keys scoped to panel focus, SPACE
     play/stop). One row of numbered cells (default 32 columns, count+BPM+note-
     len editable; BPM default 130, note 0.25 s). Click cell → sonority picker
     (the palette list); the cell shows the sonority id and repaints. Every
     column holds a value; default fill = first palette entry; shift-click =
     fill from here to end (cheap paint gesture, optional if it drags).
  4. **Playback = `MorphEmit.play`, NO new scheduler.** Grid → notes:
     `tStart = i·60/BPM`, `dur = noteLen`, one note per pitch, `lane` = round-
     robin 0–9 (routing only — orchestration is explicitly NOT this pass),
     technique `staccato`, level ~9. Loop: on span end re-invoke while loop
     toggle is on (panic() already clears cleanly; the CC_LEAD_MS shift and
     cold-entry logic come free).
  5. **Wire into `composer.html`** with a script tag + a small toggle button
     (`Pulse` next to Morph/Texture).

  **Extensibility contract (the composer adds sonorities BY ASKING THE AI):**
  the AI edits `bank/pulse_palette.json` — append an entry, the panel refetches
  on open (or a ↻ button). Three source shapes, all trivial: *(a)* from the
  blast palette → add a `ref:'Sxxx'` · *(b)* from a keyboard take → read the
  TAKE waveCurves out of the current score, their `sonifyNote`s are the pitch
  set · *(c)* conceived ("all the A#s") → generate within 30–67. File it in
  TAXONOMY.md's spirit: no asking, just confirm what was added.

  **Done when:** the composer can load the score app, open the panel, assign a
  cluster to impulse 11 of a unison-F grid, press SPACE, and hear the change in
  the loop — verified in the running app per AI_METHODOLOGY (a pure
  grid→notes builder + a small node test is cheap and worth it; the panel glue
  is verified live).

  **Deferred, in order (do NOT build into v1):** write-to-score button (v2 —
  emits the waveCurve grid at the playhead like tools/pulse_build.js does) ·
  per-part shift matrix, eighth early/late/silent (v3) · orchestration/
  doubling/register pass — lane≠entry-order split, round-robin unison doubling
  (v4, touches FR-8) · sonority naming pass (composer, whenever).

  **Open questions for the composer:** 11 vs 12 pitch-class entries · cluster
  centre (default C3) · loop default (default ON).
  **→ ANSWERED by the composer 2026-08-17: all three defaults taken** (12 pitch
  classes, cluster centre C3 = 44–53, loop ON).

  ### v1 AS BUILT (2026-08-17, day 16)

  Files: `bank/pulse_palette.json` (29 entries) · `GET /api/pulsepalette` ·
  `score/public/pulse_seq.js` (PURE engine, node + browser) ·
  `score/public/pulse_seq_panel.js` (panel, injects its own `Pulse` button) ·
  `tools/test_pulse.js` (**103 assertions**, mutation-tested: three deliberate
  breakages — cuivre ignored, one-shot stretched, lane cursor reset — all caught).
  `composer.html` = a two-script-tag diff.

  **THE FINDING THAT CHANGED THE BUILD, and it is musical.** 2aa v1 said "one
  technique: staccato". But **five of the composer's seven staccato /
  staccato-cuivre pairs have IDENTICAL pitch sets** — S020/S023, S026/S029,
  S032/S035, S038/S041, S044/S047 — and differ ONLY in articulation. Forcing
  staccato would have made half the menu silent duplicates. So a `ref` resolves
  with its **per-note articulation**, by the same rule the blast inserter uses
  (`cuivreConverted ∪ cuivreAdded → cuivre`, else `artic`). **Measured in the app:**
  S044 emits six notes on ch 4 (`tubaNb`, staccato); S047, same six pitches,
  emits three on ch 4 and **C4/C#4/D4 on ch 5** (`tubaN`, cuivre).

  **The one deliberate departure from the spec, and why.** 2aa said *"playback =
  `MorphEmit.play`, NO new scheduler"*. The panel reuses every dangerous part of
  that layer — `ensureMidi`, `routeFor`, `noteOn/noteOff` and their registry, and
  `panic()` as the single stop path — but schedules its own timers, as
  `texture_panel.js` already does for this material class. `E.play` is built for
  morphs (a pre-armed bend and a per-frame CC7 envelope per note; these are plain
  velocity notes with CC7 pinned, D12) and, decisively, **it cannot loop
  seamlessly**: it shifts its whole schedule by `CC_LEAD_MS` and panics on entry,
  so re-invoking it per cycle puts a **250 ms hole — more than half a beat at 130
  BPM — at every loop boundary**. Cycles are now laid down 400 ms ahead against
  one absolute time base. **Measured over 4.5 cycles: attacks every 240–260 ms at
  a nominal 250 ms, with the seam gap indistinguishable from an ordinary one.**

  Also in v1, beyond the spec: **ORD IS THE ONLY REAL DURATION is honoured** (2n
  — a staccato takes its measured per-pitch length, 0.40–0.49 s, and the grid's
  note-length field cannot stretch it) · a **silent entry** (`—`) so a rhythm can
  have holes · **lane pressure** readout · **playhead** highlight · localStorage
  persistence · a **broken `ref` is kept and named**, never dropped.

  **Verified in the running app (5210, the `score-verify` instance, session
  forced to `untitled` so autosave could not touch a score):** the button injects
  after `Texture` · the palette loads through the real route, **29 entries, 0
  problems** · the Done-when scenario builds exactly — unison-F grid, CLUST10 at
  impulse 11, `4.6154 s = 10 × 0.4615`, 103 notes · the loop runs, prunes its
  fired timers, and **Stop leaves 0 timers, 0 sounding notes and 82 note-ons
  matched by 82 note-offs**. **NOT verified: the sound.** This browser blocks Web
  MIDI (day 15's finding, unchanged), so the MIDI was captured at a recording
  stub. The audition is the composer's.

- **2ab — PANEL SNAPSHOTS (the shared save mechanism)** — **`BUILT 2026-08-17
  (day 17) — verified in the running app; tools/test_snapshots.js 75/75,
  mutation-tested`** *(composer's ask,
  verbatim, in COMPOSER_LOG day 17: "a way to save the panel, at least the data
  in it so we can create a save file" and "to be able to save those settings…
  you can make that same recommendation for the pulse Panel". Build order for
  the day-17 trio: **2ab → 2ac → 2ad** — 2ab is the save/AI-dial channel the
  other two use.)*

  **What it is:** named snapshots of a panel's full state, saved to one
  git-tracked bank file through the score server. localStorage stays the live
  scratch (unchanged); Save gives the current state a name; Load lists and
  restores. Survives `/clear`, browser changes, machines. **The same file is the
  AI-dialing channel for 2ac/2ad:** the AI appends a named snapshot, the
  composer picks it from Load.

  **Design decisions, already made — do not reopen:**
  - **One file for all panels,** `bank/panel_snapshots.json` — NOT in `scores/`
    (sandbox state is not score objects; keeping it out protects the D8
    autosave protocol, which has clobbered a loaded score before).
  - **`state` is OPAQUE to the server.** It is whatever the panel's own `save()`
    writes to localStorage, verbatim. The server never validates it — one code
    path, and a future panel costs zero server work.
  - Snapshot names from the AI are **append-only in practice**: the AI never
    overwrites an existing take, it writes a new name. The composer may
    overwrite/delete freely.

  **Build (all pieces named; implement in this order):**
  1. **`bank/panel_snapshots.json`** — seed file:
     `{ "_version": 1, "_contract": "<one paragraph: what this is, state is
     opaque, AI appends new names only>", "panels": { "pulse": {},
     "multitempo": {}, "phase": {} } }`. A snapshot entry is
     `"<name>": { "saved": "<ISO date, server-stamped>", "comment": "<composer's
     words or ''>", "state": { … } }`.
  2. **`score/snapshots.js`** — a PURE module (plain `module.exports`, node
     only) so the merge logic is testable without starting the server:
     `merge(fileObj, req)` where req = `{ panel, name, comment, state }` saves
     (server stamps `saved`), req = `{ panel, name, delete: true }` removes.
     Rules: unknown panel key is CREATED, not rejected · a delete of a missing
     name returns `{ ok: true, existed: false }` — never throws · `state` is
     stored by deep copy, never mutated · `name` must be 1–64 chars of
     `[A-Za-z0-9._ -]` (reject otherwise with a message, loudly — never
     silently normalise).
  3. **Server routes** in `score/server.js` — **helpers confirmed present
     2026-08-17 (day 17): `readBody(req, cb)` at server.js:86, and
     `const R = wrapRes(res)` at server.js:336 giving `R.json(obj)` and
     `R.status(400).json(obj)`.** Mirror the `/api/actuals` block
     (server.js:556): `GET /api/snapshots` returns the whole file with
     `Cache-Control: no-store` (copy the `/api/pulsepalette` handler at
     server.js:537) · `POST /api/snapshots` uses the existing `readBody`
     helper, calls `merge`, writes the file with 2-space indent + trailing
     newline (the house file style), returns `{ success, panels: <count for
     that panel> }`.
  4. **Panel glue, pulse panel first** (`score/public/pulse_seq_panel.js`):
     a `Save` and a `Load` button in the header row. Save → `window.prompt`
     for name, `window.prompt` for optional comment → POST
     `{ panel: 'pulse', name, comment, state: { grid: this.grid, loopOn:
     this.loopOn, brush: this.brush } }` — **exactly the object `save()`
     already writes** (pulse_seq_panel.js:256). Load → fetch GET, populate a
     small dropdown (newest `saved` first, label = `name · date · comment`),
     on pick apply the state **through the existing `restore()` defaults
     path** — factor restore()'s body into `applyState(s)` and call it from
     both `restore()` and Load, then `save(); this.drawStrip();`. The dropdown
     refetches every time Load is opened, so an AI-written snapshot appears
     without a page reload.
  5. **`tools/test_snapshots.js`** — node test of the pure module, at minimum:
     save round-trips state deep-equal · `saved` gets stamped · same-name save
     replaces · delete removes · delete-of-missing is `{ok:true,existed:false}`
     · bad name rejected loudly · input `state` object mutated after merge does
     NOT change the stored copy (the deep-copy assertion) · one mutation test:
     break the deep copy (assign by reference) and confirm the test catches it.

  **Done when** (AI_METHODOLOGY rule 4 — in the RUNNING app, not by reading):
  the composer saves a named pulse-grid snapshot, **reloads the browser**,
  loads it back, and BPM / columns / noteLen / every cell / loop toggle come
  back exactly; delete removes it from the dropdown; the entry is visible in
  the file on disk. Use the `score-verify` instance on :5210 with session
  forced to `untitled` (the day-16 procedure) so autosave cannot touch a score.

  **Deferred:** export/import single snapshots · autosnap · snapshot diffing.

  ### v1 AS BUILT (2026-08-17, day 17)

  Files: `bank/panel_snapshots.json` (seed + contract) · `score/snapshots.js`
  (PURE merge module) · `GET/POST /api/snapshots` (server.js, beside
  `/api/pulsepalette`) · `Save`/`Load` on the pulse panel ·
  `tools/test_snapshots.js` (**75 assertions**, mutation-tested — a
  by-reference `brokenMerge` is run against the deep-copy assertions to prove
  they discriminate). `tools/test_pulse.js` re-run: still 103/103.

  **Built to spec, with two additions worth knowing.** (1) `restore()`'s body
  became **`applyState(s)`, shared by the localStorage path and the snapshot
  path** — the spec asked for this and it is the load-bearing part: two paths
  would let a snapshot arrive with defaults only one of them applies. (2)
  `cells` is **`.slice()`d on adopt**, so a snapshot object still held by an
  open Load list cannot be rewritten by later cell edits — the same reasoning
  as the server's deep copy, applied on the browser side.

  **Verified in the running app** (:5210, session forced to `untitled`; the
  autosave guard was READ first — `composer.html:3119` fires only when
  `sessionName !== 'untitled'`, and `boundName` still read `tranceSB01-2`,
  which is why the procedure exists): distinctive grid (12 cols · 177 BPM ·
  0.33 s · loop OFF · 12 mixed cells · brush S047) saved through the real
  button → **localStorage WIPED** → browser reloaded → panel came back at
  defaults → Load restored **every field exactly** (full JSON compare, the
  on-screen inputs, and 12 cells drawn). Delete removed it from list, server
  and disk without touching the loaded grid. Bad name → HTTP 400 naming the
  charset. **The AI-dial channel works:** a snapshot POSTed while the panel was
  open appeared on the next `Load`, no reload. A snapshot with no `grid` is
  refused by name, grid untouched. Test snapshots deleted afterwards — the
  committed file is the clean seed. Full trail: `RUNNING_LOG.md` day 17.

  **For 2ac/2ad, the wiring is three lines:** a `PANEL_ID` const, a `Save`/
  `Load` button pair, and `applyState()`. The server needs NO edit for a new
  panel — an unknown panel key is created on first save, by design.

- **2ac — MULTITEMPO AUDITION RIG** — **`BUILT 2026-08-17 (day 17) — verified
  in the running app except the sound; tools/test_multitempo.js 90/90,
  four mutation tests`** *(the composer's ask, verbatim, in COMPOSER_LOG
  day 17: "audition several tempos at the same time to hear how they sound
  together… a ratio metric setting, but simplified… and a BPM setting
  concurrently… then AI could dial those tempos in and audition for me."
  Depends on 2ab for the take/AI-dial loop — buildable without it, but build
  2ab first.)*

  **What it is:** N simultaneous pulse streams (N = the number of ratio terms,
  2–6), each at its own tempo derived from one BPM and a small-integer ratio
  set, all staccato one-shots, looping seamlessly. The composer listens for
  the composite pattern; refinement is conversational — composer comments, AI
  writes a new take (a 2ab snapshot), composer loads it.

  **The math, exactly (this is the whole engine):**
  - Ratio set `r1:r2:…:rN`, positive integers 1–64. **First reduce by the GCD
    of all terms** (2:4:6 → 1:2:3) and display the reduced form.
  - Stream 1's tempo is the BPM: base beat = `60/BPM` s. Stream i's tempo is
    `BPM · ri/r1`.
  - **Common cycle `C = r1 · 60/BPM` seconds.** Stream i attacks at
    `t = k · C/ri` for `k = 0 … ri−1` — so in one cycle stream i plays exactly
    `ri` attacks and all streams realign at `t = C`. Loop = repeat the cycle.
  - Round every onset with the same `r4()` rounding pulse_seq.js uses.
  - The vocabulary map (display-relevant, and how the AI translates comments):
    *closer beats* = terms near each other (7:8) · *longer loop / less
    patterning* = larger reduced terms (15:16) · *sparse→dense arc* = NOT a
    ratio property — deferred (staggered entries, v2).
  - Non-integer ratios are OUT OF SCOPE v1 (they never realign; drift belongs
    to the phase machinery, 2ad/FR-9).

  **Design decisions, already made — do not reopen:**
  - **NO texture_engine dependency.** *Rejected:* driving this through
    `texture_engine`'s rate integration (FR-9's sketch) — it is built for
    attack fields and its concurrent-exact-grid behaviour is unverified.
    *Chosen:* mirror 2aa exactly — a pure builder + the pulse panel's
    absolute-time-base lookahead scheduler, which day 16 MEASURED as seamless
    (240–260 ms attacks at 250 nominal over 4.5 cycles). The implementer
    copies working, measured code.
  - **Sonority source = the existing pulse palette** (`GET /api/pulsepalette`,
    resolved by `PulseSeq.resolvePalette`) so refs carry per-note articulation
    (the 2aa finding — five staccato/cuivre pairs differ ONLY in
    articulation). No new bank.
  - **Lane = stream index** (stream i → lane/voice i). Routing only;
    orchestration is explicitly NOT this pass (same caveat as 2aa v1).
  - **Defaults** (cosmetic, cheap to change): BPM 150 (the composer's day-17
    trance figure) · ratios 3:4:5 · noteLen 0.25 · mode UNISON on C3
    (MIDI 48) · loop ON.

  **The three modes (a 3-way select; this is the composer's own clarity
  scaffolding, verbatim in COMPOSER_LOG):**
  1. **UNISON** — every stream plays one pitch (number input, default 48).
     Maximum pattern clarity.
  2. **REGISTER** — one pitch class (select of 12); the pc's octaves within
     MIDI 30–67 sorted low→high; stream i takes the i-th, wrapping if there
     are more streams than octaves (pc F# = [30,42,54,66]; 5 streams → the
     5th gets 30 again).
  3. **HARMONY** — one palette entry (select over the palette order); its
     pitches sorted ascending and split into **contiguous chunks low→high**,
     stream 1 = lowest chunk; each attack of a stream sounds its WHOLE chunk.
     Chunk sizes near-equal, the extras going to the LOWEST streams
     (10 pitches / 4 streams → sizes [3,3,2,2]). *Why chunks and not
     round-robin dealing:* the composer asked to hear "each of the four tempos
     in some sort of distinct region."
  - Technique: UNISON/REGISTER = `staccato`; HARMONY = each note's own
    resolved technique (the 2aa per-note rule). In every mode the 2n law
    holds: a one-shot takes its measured `techLength`, noteLen cannot stretch
    it — reuse the exact duration logic in `pulse_seq.js buildGrid`
    (pulse_seq.js:150-166), do not re-derive it.

  **SYMBOLS AND TRAPS — verified by reading the source 2026-08-17 (day 17,
  Opus 5). Read this before writing a line; each item is a real stall or a
  silent defect:**
  - **`r4` and `clamp` are PRIVATE in pulse_seq.js — NOT exported.**
    `PulseSeq.r4(...)` does not exist and will throw. Redefine locally, exactly:
    `const r4 = x => +x.toFixed(4);`. What IS exported (pulse_seq.js:204-208):
    `LANES` · `DEFAULT_TECH` · `pitchName` · `techFor` · `resolvePalette` ·
    `buildGrid` · `lanePressure`. Nothing else.
  - **THE ONE THING YOU MUST NOT COPY FROM `buildGrid`: its lane assignment.**
    buildGrid round-robins `cursor` across lanes **per NOTE**
    (pulse_seq.js:155 and :164). **2ac's rule is lane = STREAM index** — set
    `voice` to the stream index and never advance a cursor. Copying buildGrid
    wholesale here produces a plausible-sounding but WRONG result that no test
    catches unless you assert it (the `voice = stream index` assertion in the
    test list exists for exactly this).
  - **The duration logic is INLINE, not a callable helper.** Copy these two
    lines verbatim (pulse_seq.js:153 and :158):
    `const measured = techLength ? techLength(technique, midi) : null;` and
    `dur: r4(measured != null ? measured : noteLen),`. `techLength` arrives via
    `opts` and is `Composer.techLength` — the panel preflight already asserts it
    exists (pulse_seq_panel.js:196). This IS the 2n law; do not re-derive it.
  - **Carry `entry.dyn` through.** buildGrid sets
    `vel: entry.dyn != null ? entry.dyn : velocity` (pulse_seq.js:160) — a
    palette entry may specify its own dynamic. Dropping it silently flattens
    those sonorities.
  - **Technique per note is `entry.tech[midi] || DEFAULT_TECH`**
    (pulse_seq.js:152); the exported `techFor(son, pitch)` is the same rule at
    the raw-sonority level. In HARMONY mode use the entry's resolved `tech`;
    in UNISON/REGISTER force `staccato`.

  **Build (all pieces named; implement in this order):**
  1. **`score/public/multitempo.js`** — PURE, same UMD wrapper as
     pulse_seq.js:30 (works in node and browser).
     `buildStreams(cfg, pal) → { notes, meta }` with
     cfg = `{ bpm, ratios, mode, unisonPitch, pc, entryId, noteLen }`;
     `notes` in EXACTLY pulse_seq's shape
     (`{ voice, midi, tStart, dur, technique, vel, level, col, entry }`,
     `col` = the attack index within the stream, `entry` = stream index as
     `'T1'…'TN'`) so the panel's play path is a straight copy;
     `meta = { reduced, cycleSec, perStream: [counts], totalNotes,
     problems: [] }`. A bad cfg (ratio out of range, unknown entryId, unknown
     pc) goes into `meta.problems` by name and the offending stream still
     renders silent — **never silently discard, never throw to the panel**
     (AI_METHODOLOGY rule 3).
  2. **`score/public/multitempo_panel.js`** — **start from a wholesale COPY of
     `pulse_seq_panel.js`** and change only the grid section. The preflight
     block (pulse_seq_panel.js:186-210), the lookahead scheduler, the MIDI
     glue (`MorphEmit.ensureMidi/routeFor/noteOn/noteOff/panic`), SPACE
     handling, status line and playhead logic are correct and MEASURED — do
     not rewrite them. `MT` button injected after `Pulse` (copy the injection
     pattern). UI rows: BPM · a ratio text input accepting `"3:4:5"` (parse,
     validate, show the reduced form) · a preset row of buttons that fill the
     ratio field: `2:3 · 3:4 · 4:5 · 7:8 · 3:4:5 · 15:16` · the mode select
     with its per-mode input (pitch / pc / palette entry) · noteLen · loop
     toggle · readout line: `reduced ratios · cycle N.NN s · attacks/cycle
     per stream · lane pressure` (reuse `PulseSeq.lanePressure`).
     localStorage key `multitempo.v1`, same save/restore pattern.
  3. **2ab wiring:** panel id `multitempo`, state =
     `{ bpm, ratios, mode, unisonPitch, pc, entryId, noteLen, loopOn }`.
  4. **`tools/test_multitempo.js`** — at minimum: reduction (2:4:6 → 1:2:3;
     15:16 unchanged) · cycle math (BPM 150, 3:4:5 → C = 1.2 s; onset lists
     exact per the formula, r4-rounded; per-stream counts 3/4/5) · REGISTER
     wrap (F#, 5 streams → [30,42,54,66,30]) · HARMONY chunks (10 pitches, 4
     streams → [3,3,2,2], lowest chunk to stream 1, exact pitch membership) ·
     HARMONY per-note articulation via a cuivre ref (S047: assert the cuivre
     notes appear with technique `cuivre`, same fixture idea as
     test_pulse.js) · UNISON all-48-staccato · voice = stream index ·
     one-shot duration honoured (noteLen 2.0 does not stretch a staccato) ·
     problems path (unknown entryId → named in meta.problems, stream silent,
     no throw) · **three mutation tests** (deliberately break, confirm caught,
     restore): skip reduction · reverse chunk order · compute onsets from
     UNreduced terms.
  5. **The take loop contract** (document in the panel header comment): the
     AI writes 2ab snapshots named `take-NN-<slug>` with `comment` = the
     composer's verbatim words; it NEVER overwrites an existing take; each
     listening verdict is filed to RUNNING_LOG at the moment it is spoken
     (AI_METHODOLOGY, capture-as-you-go).

  **Done when** (in the RUNNING app, :5210 score-verify procedure): `MT`
  opens · `3:4:5` at 150 UNISON plays and loops · measured onsets over ≥3
  cycles match the formula within timer jitter (state the numbers, as day 16
  did) · the seam is indistinguishable from an ordinary gap · REGISTER on C
  stratifies the streams · Stop leaves 0 timers, 0 sounding notes, note-ons
  matched by note-offs · a 2ab take round-trips. If the implementer's browser
  blocks Web MIDI (day 15/16 finding), verify at a recording stub exactly as
  day 16 did and SAY SO — **the sound is the composer's audition, always.**

  **Deferred (do NOT build unprompted):** sparse→dense arcs / staggered
  entries · per-stream cell patterns · irrational or drifting ratios ·
  write-to-score · orchestration/doubling · any AI-recommendation automation
  beyond the take loop.

  ### v1 AS BUILT (2026-08-17, day 17)

  Files: `score/public/multitempo.js` (PURE engine) ·
  `score/public/multitempo_panel.js` (`MT` button, anchored after `Pulse`) ·
  `tools/test_multitempo.js` (**90 assertions**, four mutation tests) ·
  `composer.html` = a two-script-tag diff. 2ab wiring is live (panel id
  `multitempo`), so Save/Load worked on day one.

  **THE TRAPS BLOCK ABOVE WAS LOAD-BEARING — two of its four would have
  shipped.** `lane = stream index` (buildGrid's per-note cursor would have
  scattered each stream across players, and it would have sounded fine) and
  `r4`/`clamp` are private (reaching for `PulseSeq.r4` throws on the first
  call). Both are now asserted, and the lane rule is mutation-tested.

  **Measured in the running app** (:5210, session forced to `untitled`; Web MIDI
  blocked, so timing was taken at a recording stub as day 16 did): **C = 1.2 s
  at BPM 150 / 3:4:5**, with T1/T2/T3 steps measured at 389-411 / 299-301 /
  239-241 ms against nominals of 400/300/240. **The realignment property holds
  live** — all three streams land together at 1199.4/1199.6/1199.6 ms, again at
  ~2399 and ~3598, i.e. exactly on C, 2C, 3C — and **the seam is not a seam**
  (T1's step across the boundary is 399.9 ms). Stop, measured with only the MIDI
  port stubbed so the real `panic()` ran: **29 note-ons matched by 29
  note-offs**, 0 timers, 0 pitch bends, CC7 once per lane at 127. REGISTER on C
  stratifies 36/48/60; HARMONY on CLUST10 chunks 44-47 / 48-50 / 51-53; S047
  keeps cuivre on 60/61/62 (the 2aa rule survives into this engine). A bad term
  is NAMED in red with the stream silent and the rest still playing. The 2ab
  round-trip survives a wiped localStorage plus a reload. Regression on the
  now-four-way `E.onStop` chain: both panels' buttons restore.

  **One defect found by RUNNING it, not by reading** (Principle 6 again): the
  stream view's dedup map was declared inside its own loop, so 39 HARMONY notes
  drew 12/12/15 stacked ticks where 3/4/5 onsets exist — invisible, because they
  land on the same pixel. Fixed; now 3/4/5 ticks with exactly 3 highlighted as
  shared. Full trail: `RUNNING_LOG.md` day 17.

  **NOT verified: the sound.** Whether several tempi together are worth keeping
  is the composer's audition and cannot be measured here.

- **2af — THE TRANCE GENERATOR** — `SPEC 2026-08-18 (day 18) · RUN BY HAND
  2026-08-19 (day 19) — five audition scores out, the section being assembled
  from them` — **`docs/plans/TRANCE_GENERATOR.md`**. A four-layer recipe machine
  for the final section: **UNIT** (an MT ratio model + a tempo, the atom of the
  rhythm layer) · **HARMONY** (its own grid at its own BPM, hold length drawn
  from an allowed beat-set, species chosen shuffled-bag from `more chords`,
  staccato only) · **CUIVRE** (a rate layer on top, a COUNT PER SEGMENT for this
  piece) · **PLAYER ASSIGNMENT** (a 0.45 s minimum-rest constraint, NOT a
  rotation period — rotation emerges from it). Actualised with a duration and a
  seed, entering the loop at a random index. **Deliberately not built:** the
  composer runs it as an AI-dictated workflow for this piece and wants it
  formalised into a UI later; the doc is what makes that repeatable. Measured
  facts it rests on are in the doc, including that putting the LARGEST ratio
  term first makes the dialled BPM the fastest part in the group.

- **2ae — COLUMN EDITING + THE UNISON BANK** — **`BUILT 2026-08-18 (day 18) —
  verified in the running app`** — the trance section's editing loop: hear the
  pulse cycle, replace a column, hear it again.
  **Why:** the composer settled the working method on day 18 — **AI prompts and
  pasted console scripts, NOT panels.** Panel-building was tried across 2aa-2ac
  and judged too labour-intensive for the return. What was still missing was a
  way to change one column without regenerating the whole score.
  **Four parts, all shipped:**
  1. **12 octave unisons in the blast bank** — `S049`-`S060`, custom list
     `unisons`, one per pitch class, each = every octave of that pc inside the
     staccato range MIDI 30-65 (3 notes each; F#4=66 is out). They appear in the
     existing Insertion strip with **zero code change** — `loadTaxB()` already
     refetches whenever the strip is opened. **Adding more sonorities is a JSON
     edit, no code, no reload** — this is the composer's repeatable request path.
  2. **`insert → column` button** (beside `insert @ cursor`) — writes PLAIN
     staccato hits onto the pulse column nearest the playhead, scattered at
     RANDOM across whichever players are free there. No groupId, no META shape,
     no label marker: trance material is a grid of single hits, not a gesture,
     and **the randomisation IS the orchestration**. The grid is inferred from
     the score's own modal onset gap (`pulseOf()`), so a tempo change needs no
     edit here. *Verified:* playhead parked 0.07 s off column 8 snapped to it,
     3 notes landed on 3 random free players, both occupied lanes avoided.
  2b. **`replace → column` and `delete column`** *(added same day, on the
     composer's "both if possible")* — the full replace loop in the strip.
     `delete column` removes every note in the column and **leaves a hole**:
     markers are untouched so the numbering keeps counting the grid, and nothing
     after it shifts. `replace → column` clears first, so the scatter has all
     ten players. Both report into `#blastInfo` and both undo in ONE step; no
     confirm dialog, because `#playhead` is a visible full-height line at
     `left:50%` so the target column is never ambiguous. *Verified:* delete 2→0
     with the marker surviving and the next column untouched · a second delete
     on the empty column reports rather than throws · replace swapped 2 notes
     for the 3-note F# unison across the full ensemble · plain insert still ADDS
     (no regression) · CTRL+Z restored each in one step.
  3. **`O` = whole selection → ORD** (`convertSelectedToOrd`). The long-tone
     path. A fixed one-shot plays its own sample length however the block is
     drawn, so turning a column into long tones means changing the TECHNIQUE
     first, then dragging. The property panel already did this but
     `applyPanelField` works on the PRIMARY selection only — one note at a time.
     *Verified:* 3 selected notes converted at once, unselected note untouched,
     ignored while typing in a field.
  5. **`A` / `SHIFT+A` = select the pulse column at the playhead** — and
     shift-extend accumulates columns, so scrolling and shift-A-ing builds a
     column RANGE with no new gesture to learn. The grid comes from
     `scorePulse()`, inferred from the score's own modal onset gap.
  6. **Multi-resize** — dragging one edge of a note that is part of a
     multi-selection applies the SAME delta to every other selected note
     (uniform, not proportional: the operation is "make this column longer",
     not "scale it"). This is the resize twin of `startGroupDrag`, which already
     did multi-MOVE; a META gesture shape keeps its own member-retime path and
     is excluded. The readout reports `x3 notes` while dragging.
     **The long-tone workflow is now three moves: `A` -> `O` -> drag one edge.**
     *Verified:* A selects 3, SHIFT+A extends to 6 across two columns, plain A
     replaces, empty column reports rather than throwing · a right-edge drag
     took all three 0.2s -> 1.2s with starts unchanged and unselected notes
     untouched · solo resize unaffected · ONE undo restored all three, redo
     re-applied. *(A marquee/rubber-band was assessed and deliberately NOT
     built: left-drag on empty lane space already pans the score, and the lanes
     are separate positioned divs so a box spanning them must be hit-tested per
     lane rather than in one coordinate space. Grid material wants "this
     column", not "everything in this rectangle".)*
  4. **Drag-length readout** — a cursor-following box while resizing, which also
     names the trap: on a fixed one-shot it reads
     `(staccato one-shot — sounds 0.45 s; press O for ORD)`. It deliberately
     does NOT write into `#floatingTime` — assigning that element's
     `textContent` destroys the spans `updateTimeDisplay()` caches and freezes
     the clock until reload (a documented three-day bug in that function).
  **Measured and deliberately NOT fixed:** staccato sounds 0.45 s against a
  0.4 s pulse. On `tranceA001b`, 55 same-player overlaps are on *different*
  pitches (harmless, polyphonic) and only 10 are the *same* pitch, where a
  ~50 ms decay tail is cut under a fresh attack. Nothing is dropped. Lengthening
  the blocks to 0.45 s would make every column overlap the next visually and
  start the conflict engine flagging same-player repeats — a real trade, not a
  free fix. Composer's call: leave it.
  **AS RUN (day 19).** `tools/trance_gen.py` · `_sets.py` · `_series.py` are the
  three hand-run variants; five audition scores came out (`gen-aud-01…05`, gitignored
  BECAUSE they are regenerable byte-for-byte from the tools at a fixed seed;
  every other score in this work IS committed). Layer 4 gained a second mode,
  `ASSIGN='fixed-tempo'` — six streams over ten players as four pairs plus two
  solos, partners 5 tubas apart, a pair splitting its stream so neither plays
  every beat and the orchestration moves into the PITCHES. Verified: 210
  player-parts each locked to one stream, worst deviation from that player's own
  grid 0.094 ms, so **every part is notatable as a single tempo**; the 0.45 s
  rest floor becomes structural because every stream period is >= 600 ms.
  **A range bug it exposed, still live elsewhere:** staccato sounds only MIDI
  30-65 and 7 of the 13 `more chords` species carry a 66 or 68 — 8.8% of notes
  rendered silently until the generator began octave-folding at use-time. The
  **Insertion strip does not fold**, and the blast sandbox banks out-of-range
  pitches without warning.
  **The assembly workflow this produced** (how the section is actually being
  written): composer plays an audition score, names a segment by index and a
  time; the AI answers with a console script that **cuts at that time and
  appends** — deliberately not the full-clear rule, because this is real work.
  Times named are usually off-grid; snap to the beat and say which.

  **Not built (deferred, not forgotten):** a menu of chords for the column
  insert beyond what the strip already offers; making the console keybindings
  (`D`/`I` column delete/insert) permanent rather than paste-per-session.

- **2ad — PHASE-SHIFT TEXTURE SELECTOR (a workflow, not a build)** —
  **`READY 2026-08-17 (day 17) — ZERO CODE NEEDED, verified; the sitting is
  set up and waits on the composer's ear`** *(composer, verbatim,
  COMPOSER_LOG day 17: "a way to audition a few different phase shifting
  patterns… AI prompt is the best way… maybe using some of the vocabulary we
  developed in that phase shifting project and then settle on a few textures."
  Explicitly NOT perfecting FR-9 — "I don't necessarily want to perfect that
  one right now.")*

  **What it is:** settle on a few phase-shifting textures for the trance
  section using machinery that ALREADY EXISTS. **The only code this plan may
  require is a ↻ refetch button.** Everything else is workflow.

  **The loop:**
  1. Composer opens the existing **Texture panel** and plays the variants in
     `bank/texture_params.json` (the panel fetches `/api/texturemodels` +
     `/api/textureparams` no-store — texture_panel.js:228).
  2. Composer comments in the established vocabulary — smear · ticks · rain ·
     gallop · groove, regular↔irregular, displacement in beats
     (`bank/texture_models.json` `_vocabulary`).
  3. AI edits the variants in `bank/texture_params.json` (bump `rev`; the
     active-on-rev-bump path was fixed day 12), composer re-plays.
  4. A keeper is banked with the EXISTING CLI, unchanged:
     `node tools/texture_bank.js --bank <NAME> --from <variant> --survives
     yes|no --note "<composer verbatim>"`. When a duration is known,
     `--actualize <NAME> --dur <s>` renders it to `bank/texture_actuals/`.
  5. The section's chosen set = the banked/actualized names, listed in
     PLANNER's trance container. **No new storage.** (2ab's `phase` panel slot
     stays empty until a dedicated panel exists, if ever.)

  **The synergy that makes sitting 1 do double duty:** the entire 2x listening
  slate is still UNHEARD (journal §6, day 12 — all five models read `UNHEARD`
  and refuse keeper status). Item 1 of that slate — SMEAR vs RAIN vs GALLOP
  distinctness — IS the vocabulary validation this workflow depends on. Run
  the slate's order; every verdict lands in the same `--bank` slots and in
  RUNNING_LOG at the moment it is spoken.

  **Code, only if missing — check in the running app first:** if the Texture
  panel cannot refetch `/api/textureparams` without a page reload, add a ↻
  button copying the pulse panel's pattern (pulse_seq_panel.js:103 and :136).
  Nothing else: **NO new scheduler · NO bpm-exact integration (FR-9 stays
  deferred with its gates) · NO new panel** unless the loop proves hammered
  (the standing sandbox-UI-vs-AI line).

  **Constraints binding this work — settled, do not relitigate:** D27
  (articulation decides whether phase is a device at all; sustained timing-
  phase does nothing — that search direction is CLOSED) · D29 (no bend
  anywhere in texture output; pitch beating belongs to 2v).

  **Done when:** one sitting has produced at least one banked keeper carrying
  the composer's verbatim note, and the SMEAR/RAIN/GALLOP distinctness verdict
  is recorded in both the bank slots and RUNNING_LOG.

  ### AS VERIFIED (2026-08-17, day 17) — nothing was written

  **The one conditional code item is not needed, and that was CHECKED.** 2ad
  allowed a ↻ button *"if the Texture panel cannot refetch without a page
  reload"*. It already does better: `texture_panel.js` **polls
  `/api/textureparams` every 1000 ms while open** and honours the file's
  `active` on a `rev` bump. **Proven live** (:5210, `untitled` session): with
  the panel open and untouched, the params file was rewritten from the shell to
  `rev: 2, active: "B"` and the panel moved to rev 2 / variant B **with no
  reload and no click**; `git checkout` restored the file and the panel returned
  to rev 1 / A by itself. **2ad's code scope is closed at zero lines.**

  **The slate is already loaded** — `bank/texture_params.json` holds exactly the
  three references the 2x listening slate asks for first, and all three render
  with distinct measured signatures: **A SMEAR** sd 0.1 ms / unev 0.00 ·
  **B RAIN** sd 30.7 ms / unev 0.14 · **C GALLOP** sd 32.3 ms / unev 0.68.

  **A prediction on record before it is heard:** B and C have nearly the SAME
  jitter magnitude (30.7 vs 32.3 ms) and very different unevenness. If rain and
  gallop are clearly distinct by ear, unevenness carries the distinction and the
  vocabulary holds; if not, they are one category with two labels and the models
  should be merged. Either answer is a result.

  **The last step was tested so it cannot fail mid-sitting:**
  `node tools/texture_bank.js --bank RAIN --from B --survives yes --note "…"`
  ran end to end and wrote the verdict; **the probe was then reverted** —
  `--validate` reads `0 of 5` verdicts again and `bank/` is git-clean. No
  fabricated verdict was left behind.

  **Operational gotcha, and it matters because the composer's verbatim words are
  the deliverable:** an em-dash passed to `--note` through Windows Git Bash
  arrives mojibake'd (shell argv, not the tool). **Keep `--note` plain ASCII**,
  and put the exact words in `COMPOSER_LOG.md`.

  ### THE SITTING — what the composer actually does

  1. `node score/server.js` → composer.html → **`Texture`**.
  2. Play **A**, then **B**, then **C**. The question is only: *are the three
     distinct by ear?* (2x slate item 1 — it validates the whole vocabulary the
     recipes are built on.)
  3. Say what you want more or less of, in your own words. The AI edits the
     variants and bumps `rev`; the panel lands on the new one within a second,
     no reload.
  4. Bank a keeper:
     `node tools/texture_bank.js --bank <NAME> --from <variant> --survives yes|no --note "<plain ASCII>"`
  5. Then slate item 2 — **`H` on SMEAR, then `H` on RAIN** — which is the
     fragile/robust prediction's first real data point.

  **Done when** is unchanged and only the composer can close it: one banked
  keeper carrying their verbatim note, and the SMEAR/RAIN/GALLOP verdict
  recorded in both the bank slot and `RUNNING_LOG.md`.

  **Deferred:** FR-9 tempo-exact insertion into the piece · cross-cutting the
  textures into the pulse stream (that is section assembly, PLANNER's tier) ·
  a dedicated phase panel.


## 7. THE THREE SCORES — architecture (composer, 2026-08-14)

*Three sequential artifacts, each feeding the next. This supersedes any
assumption that notation and performance live inside the composer app.*

**7a — COMPOSER SCORE** — `doing` (this app, :5200). **The composition itself**
— everything is contained here. Phase 1; the other two begin when it's done.

**7b — NOTATION SCORE** — `todo` (phase 2). The actual **worked-out,
performable notation**, and at the same time it **carries the composer score's
graphics — including the META layer**.
- **Plays like the composer score, but without the MIDI.**
- **Hover / click a tuba part → it expands into full notation** — a version of
  what you'd see in the final performance score.
- **The strip model (the key data decision):** each part's notated version is a
  **single long strip** — a continuous tape (Turing-machine-tape metaphor) that
  scrolls through time, or that you scroll through.
- **Therefore pagination is a VIEW, not a property of the notation.** You cut the
  strip any which way: different paper size = a different window on the strip;
  different screen size = likewise; any segment can be excerpted. One source of
  truth per part, many renderings.

**7c — PERFORMANCE SCORE** — `todo` (phase 3). Takes those strips and works them
out to **play on screen in performance**.
- **Parts generation for the laptop versions.**
- **All the animation machinery — robust and synced.**
- **Gathers every performance thought** (composer's instruction, 2026-08-14):
  - **§3 mandates M1–M4** — on-the-fly part multiplication · family adaptation ·
    env-release notation devices · rapid-staccato notation (vertical-line
    attacks + bouncing ball).
  - **2k** — group rehearsal mode that is robust about which instance is leader
    vs follower, and a much clearer/simpler entry page.
  - **2j** — the tremolo sine figure and its animation options (ball tracing the
    wave / wave fill), since those are performance-facing devices.

### §7 AMENDMENT (2026-08-19) — the four-strata model, CONFIRMED

*Supersedes the 7a/7b/7c phasing above where they conflict; 7a-c survive as
descriptions of the artifacts. Dictations in COMPOSER_LOG day 19; assessment
trail in RUNNING_LOG day 19. Predecessor evidence: piece #2's THREE_SCORES.md /
COORDINATE_SYSTEM_VISION.md, piece #1's NOTATION_FRAGMENT_WORKFLOW.md.*

**The model: one data spine, four strata, N manifestations.**
1. **Composition data** — the strips: all parts + meta, locked to one timecode
   in seconds. Exists (the composer app). *"One rich data source in time with
   different manifestations but same identity."*
2. **Derived data** — analysis products with provenance (beating structure,
   M5 chunker output, conflict data). Partial; results become first-class.
3. **Notation IR** — the notation layer AS DATA, render-late: spelled notes,
   chunks/bars, per-chunk tempo maps, device references, decisions-as-rules.
   New. **Forced semantic by M1/M2** (can't transpose an SVG).
4. **Renderers/runtimes** — the engine (compiler passes + a workshop for
   developing NEW notation) over data-linked **meta-structures** (proportional
   time grid, per-part tempo rulers, lanes, page frames; ONE coordinate
   module — piece #2's P3 lesson) assembling **stamps/sprites** (any sounding
   datum → glyph group; atomic under splicing).

**The four forms = view/runtime configurations, not four codebases:**
- **Study score** (decision a, 2026-08-19): TWO VIEWS — a "study-composers"
  full score (real notation, all parts, click-to-zoom) and a GRAPHIC SCORE
  view (bricks + meta-layer shape overlay, early-electronic-score style), plus
  rehearsal visualizations of continuous parameters (beating curves,
  approach/recede balls, breaths, swells) read from stratum 2.
- **Notation layer** = stratum 3 + an engraving renderer for proofing.
- **Performance score** = the runtime (7c above) applying M1/M2 at load time.

**ACCOMMODATION STRATEGIES (composer's term, 2026-08-19)** — the answer to
splicing the ticker tape: *"not infinite resolution but a bucket of solutions
that accommodate most splices."* A finite registry of splice behaviors keyed to
object CLASS: a long curve cuts like a Matisse cutout; the scrolling cursor
jumps to a new x,y and loop while keeping the continuous time delta; stamps
are atomic (never cut); bars prefer chunk boundaries (**the M5 chunk is the
atom of the strip**); page-edge behavior (clamp/move so nothing falls off) is
a decision tree stored as RULES, not baked positions (piece #2's P6).

**Locked decisions:** (a) study score = views over the shared strata ·
(b) render-late, with the engine + meta-structures named as what render-late
must not block · (c) unified robust data layer as the base.

**Working economics (composer, 2026-08-19, binds this phase):** solid plan →
AI codes a lot → controlled refining phase → **parachute**. No duration
estimates; phase gates with composer review. The parachute is structural:
every chunk class carries a graphic-fallback manifestation, so a score can
ship at any moment (decided chunks as notation, the rest proportional).

**Phasing (proposed, pending composer):** A contracts (capped architecture doc
+ IR schema v0 + three hand-worked IR chunks) → B vertical slice 1 = TRANCE
section end-to-end → C study score v0 → D slice 2 = SECTION 1 (M5 chunker runs
for real) → E performance runtime. Phase-2-after-composing is superseded:
notation starts interleaved with composing. ~~**Phase A agenda items owed by
the composer: the 0–10 → dynamic-mark convention and D3's performer-transform
decision.**~~ *(Both DISSOLVED 2026-08-19 by A1 amendments 1–2 — see the A1
record below; do not re-owe them.)*

**A1 DRAFTED 2026-08-19** — `docs/NOTATION_ARCHITECTURE.md` (capped to the six
contracts; adversarially verified against the day-19 record and the
predecessor docs, 16 findings fixed pre-commit — trail in RUNNING_LOG day 19
evening). Under composer review; amendments 1–2 (2026-08-19, dictated during
review): material-dependent realization + IR provenance kinds; D3 dissolved
into blunt shape families + an optional per-material transform slot.
Decisions 1 (dynamics ladder) and 7 (velocity-vs-CC7) dissolved/demoted.

**A2 DRAFTED 2026-08-19** — IR schema v0: `notation/` root (schema spec +
JSON Schema + registry seeds + `tools/ir_validate.js`). Deterministic derived
ids (`ev-<objectId>`, `ch-<part>-<firstEventObjectId>`) mechanize the
survival law; IR carries NO layout units (vertical-unit choice moved to the
slice-1 coordinate module); adversarial pass found 22 defects (7 lying
validator checks incl. a prototype-chain bypass) — all fixed; mutation
battery green (29 at A2, 31 after A4's two additions; runnable:
`tools/ir_validate_battery.js`). Trail in RUNNING_LOG day 19 night.
**A3 DONE 2026-08-19 night** — `notation/ir/trance-bar-01.ir.json` (two
tempo streams + the 0.136 s seam; VALID vs source; 0.0000 ms re-derivation;
two schema amendments: span = onset ownership, boundary = next chunk's first
onset). **A4 DONE 2026-08-19 night** — `morph-window-01.ir.json` (8-part bloom
entry, {parts,span} overlay, naive-spelling + authored-respell pattern;
validator gained the renames-never-repitches check). **A5 DONE 2026-08-19 night** — `density-apex-01.ir.json` (E1 fold;
fit-is-data vs strategy-is-judgment split; re-derivation matches the record
exactly). **PHASE A COMPLETE.** **PHASE B GO (composer, same night):** B0 plan
(`docs/plans/NOTATION_SLICE1_PLAN.md`, DB-1..DB-8) · **B1 DONE** — extractor
+ `--complete` + A3 golden GREEN; `trance-section-01.ir.json` = 749 events /
56 chunks, fully valid; accent-weave model (VERT hits join their stream's
grid). **B2 DONE** (coords module, SZ-7 lane-relative ss, snapshot+prove-red) ·
**B3 DONE** (glyphs ported from piece #2 with provenance; stamps = typed
boxes with anchors; parity + assembly proof green; rests deliberately
absent — the IR has no rest nodes). **B4 DONE** (layout passes: staff math, stems/dots/ledgers/accidentals,
sub-beat beaming, tempo labels + GC ticks, parachute bricks; A3-window
census + section smoke + snapshot green). **B5 DONE** (render.js + notation.html + /notation/ mount; verified live
on :5210, census-exact snapshots; clef-pinning + label-size defects found
by EYE on the seam proof; proofs sent + committed). **First-pixels gate OPEN.** **B6 DONE** — splice.js + page_rules.json
(P6 rules-as-data); three accommodation strategies running (boundary-
preferring cuts · stamp-atomic beat-snapping, proven end-to-end · (cont.)
tempo-label reshow); 6 pages over the section, verified live.
**SLICE 1 COMPLETE (B0-B6)** + the 30-finding review pass applied.
**PHASE C v0 DONE (composer "looks good phase c go"):** graphic.js (S1
read-through bricks + META overlay + D28 beating lane, bloom F2 pair
5.93 Hz hand-checked) · study-score page (view switcher, score picker,
click-a-part-to-zoom), verified live. Queued for later: animated
approach/recede balls (Phase E), breath/swell lanes (material time).
**PHASE D v0 DONE (composer "on to D"):** section1 extraction profile
(E1 frame in production; coverage corroborates D43 within ~3 pts: 24.0/53.0
vs 26.2/57.1) · mixed per-chunk strategy renders (44 vs 88 bars at
ε=20/30) · ε now a VISIBLE dial (IR picker + apex proofs at both) · M4
attack-line prototype. Composer decision now concrete: A1 §8 row 3 by eye.
Queued: tuplet-bar (fixed-beat frame), m>=3 numerals. ~~Next: Phase E performance runtime.~~ **PHASE E SEVERED 2026-08-20
(D45): the performance side becomes ITS OWN PROJECT** ("needs a rethink"
— composer; to be scoped in its own conversation). This workstream's next
notation act, when the piece calls for it: **the actual PARTS notation
first**, then its layout into the study score; requirements harvested
while building the real score.

## 8. PENN STATE DELIVERABLES BUILD — `planned 2026-08-20, runs post-piece`

- **8a — Deliverables container + exports** — `planned` — the three Penn State
  deliverables (MIDI recording · 1920×1080 screen-following video · PDF full
  score) and the fixed-format two-window container that ALL part-by-part
  notation work previews in (tier-1/2/3 decision taxonomy). Preplan + decision
  slate PP-1…PP-6: `docs/plans/PENN_STATE_DELIVERABLES_PREPLAN.md`. Build plan
  V0–V5 + POL with gates G0–G6: `docs/plans/DELIVERABLES_BUILD_PLAN.md`.
  **Architecture evaluated 2026-08-20 (preplan §8): NOT a new build** —
  coords/splice/layout/render are parameter-ready (PP-6's zoom invariant holds
  by construction); new components are transport+cursor (scoped, not Phase E),
  video export (ffmpeg 8.1.1 installed), PDF export; `notation.html` gains the
  two view modes. **Sequencing: runs AFTER the piece is finished, BEFORE
  part-by-part notation begins; V4/V5 may trail until submission.**

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
