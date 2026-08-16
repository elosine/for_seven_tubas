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

- **2z — GESTURE SHAPING** — `plan drafted 2026-08-16 — docs/plans/GESTURE_SHAPING.md,
  awaiting composer review` *(was listed as 2x, colliding with the texture
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

- **2y — MODEL ↔ ACTUAL: storage, recall, insert** — `plan drafted 2026-08-16 —
  docs/plans/MODEL_AND_ACTUAL_PLAN.md, awaiting composer review` —
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

- **2x — TEXTURE / ATTACK-FIELD SANDBOX** — `pre-plan written 2026-08-16, plan
  not yet commissioned`. The continuation of 2j's research arc as a working
  surface. **Requirements + evidence:
  `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`** (written to be read cold by a
  stronger model, every claim tagged HEARD / MEASURED / inferred).
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
