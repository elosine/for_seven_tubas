# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**SESSION END (2026-08-16, day 11 — PLANNING session for 2x TEXTURE SANDBOX,
Claude Code / Fable 5 — a SECOND, concurrent session; the 2z+2y entry below ran
at the same time):**
- **PLAN 2x is DRAFTED, REVIEWED and APPROVED — `docs/plans/TEXTURE_SANDBOX_PLAN.md`
  (v3).** Built from day-10's `PHASE_SANDBOX_REQUIREMENTS.md`; one composer
  review round reshaped it, then a handoff-hardening pass. **Ready to
  implement; the kickoff prompt is embedded in the plan's §16.**
- **D29 IS CONFIRMED by the composer** (see §4): 2v owns everything bend-based
  including pitch beating; **2x owns ATTACK FIELDS only**. No bend anywhere in
  the 2x build. This was the one thing gating the plan.
- **The composer's four design rulings, all now in the plan:**
  1. **The interface is QUALITATIVE** — the composer speaks the vocabulary
     (*"more rain-like", "a different gallop", "quicker, more exponential
     build"*) and **the AI holds the recipes** that turn words into dial moves.
     One-dial feel, never a wall of knobs. Two-sided contract so it never goes
     opaque: every AI-written variant label names the dials it moved.
  2. **No separate page** — a **Texture panel in the composer score** (the
     Morph-panel pattern), plus ordinary `tex-` score files for long renders.
     Audition reuses **2v's `morph_emit.js`** (a texture note is its no-bend
     case); no new scheduler.
  3. **No editor** — AI manages all editing by regeneration (R10).
  4. **Both creation modes are first-class:** the quick panel loop AND the
     long-render-then-**POCKET** workflow (*"render a long phase shift, I
     listen, I give time clips"*) — pockets are **parametric first**
     (regenerate the window's dial state as a new MODEL, still tweakable),
     with literal clipping as the fallback.
- **Storage follows 2y's MODEL ↔ ACTUAL taxonomy** (the composer's Bergsonian
  virtual/actual): the five categories (**smear · ticks · rain · gallop ·
  groove**) ship as the first five MODELS in `bank/texture_models.json`;
  actuals go to `bank/actuals/` with provenance. Parallel files to 2y's —
  never shared writes.
- **The research method's two confounds became FEATURES:** seed stepping
  (draw variance — at ten voices a setting is a lottery, not a texture) and
  **PIN / A-B** back-to-back flipping (order effects), plus **H** = the
  humanize A/B (stage scatter + human jitter), with a **robustness verdict
  required before any keeper can be banked**.
- **Handoff-hardened for a weaker model** (the composer's standing
  instruction): §16 FOOTHOLDS carries the environment facts (no npm / no node
  MIDI binding), string anchors for every file touched, the `Composer`
  lexical-global trap, markers-in-`objects`, the lane-assignment rule, the
  curve schema, a **worked example with expected numbers**, and the
  literal-pocket determinism subtlety (regenerate the full render and slice —
  never re-seed a short one). No probe phase exists, so 2v's hardest area is
  absent by construction.
- **Phase 0's gate is the regression suite:** regenerate `phase07-scatter`
  through the extracted engine and get a **byte-identical `objects` array**.
  The 13 research scores are the safety net for the extraction.

**Next up (2x):** implement with the §16 kickoff prompt, phases 0 → 4.
**Coordination:** 2z implements first in the same tree — the 2x implementer
pulls before every chunk and anchors `composer.html` edits by ids/strings.

**Open at session end (day 11 — 2x):** nothing in-flight; the plan is
self-contained. `phase13-beatfield` is **DEFERRED by the composer** — not
blocking 2x; its verdicts feed 2v's beating boundaries whenever it is heard.

---

**SESSION END (2026-08-16, day 11 — PLANNING session for 2z + 2y, Claude Code):**
- **Both follow-on plans are DRAFTED, DISCUSSED (two design rounds with the
  composer) and APPROVED:** **2z GESTURE SHAPING**
  (`docs/plans/GESTURE_SHAPING.md`, v2) and **2y MODEL ↔ ACTUAL**
  (`docs/plans/MODEL_AND_ACTUAL_PLAN.md`). **Build order: 2z first, then 2y —
  NEVER as two concurrent agents** (shared files; the rule is in both plan
  headers). Both are handoff-hardened for a weaker implementing model
  (environment facts, worked examples, per-gate acceptance checklists,
  precision/determinism rules).
- **2z design outcomes** (composer's day-11 session, all in the plan): full
  ADSR (attack `peak` + `decay`) · multilayer attack — edge technique
  (body-rejected techniques welcome as noise sources), per-voice TRANSIENT
  (hit-then-tone; D9 physics stated), NOISE layer on spare players, MOTION
  (converge/gliss, zero-at-inner-edge by construction) · release = a SUBSET,
  not a mirror (dropout is cluster-safe so beating thins by whole pairs) ·
  striated entry demoted from default (`together` when a shape block exists;
  no-shape stays byte-identical = gate G0) · ADSR is NOT a seventh model
  (orthogonality morph ⊥ carrier ⊥ shape) · shape reuse = lightweight presets
  in 2y, no taxonomy · recipe vocabulary built from NARRATED sessions, seeds
  minimal.
- **PLAN-ID collision fixed:** two day-10 sessions both appended "2x".
  GESTURE SHAPING is now **2z**; the texture sandbox keeps **2x**.
- **Found in passing:** `lanes`/`voices` read by `normaliseParams` but missing
  from `KNOWN_KEYS` (spurious warning) — fix scheduled in 2z gate G0.
- A second agent was active in the repo this session (separate plan);
  explicit-path staging observed throughout.

**Next up:** **implement 2z** — the whole prompt is *"Implement
docs/plans/GESTURE_SHAPING.md (PLAN 2z)"*; the plan is self-contained
(gates G0–G5; G5 is the composer listening check-in, which also re-hears
variant B). Then 2y the same way (MA0–MA4; MA4 is the composer
naming/blessing session).

**Open at session end (day 11):** nothing new in-flight. The day-10 opens
below still stand — notably `phase13-beatfield` unheard and the D29 scope
call, **both gating only the texture sandbox (2x)**, not 2z/2y.
*(Both resolved later the same day in the concurrent 2x session — see the
entry above: **D29 confirmed**, `phase13` **deferred by the composer**.)*

**Blockers:** none.

---

**SESSION END (2026-08-16, day 10 — PLAN 2j PHASE SHIFTING, Claude Code — a
SECOND, concurrent session; the 2v entry below ran at the same time):**
- **The phase-shifting research arc is COMPLETE** — 13 experiments
  (`phase01`…`phase13`), all in the Scores menu or `midi/`. Full write-up
  `docs/PHASE_SHIFTING.md`; chronology + the composer's verbatim verdicts in
  `docs/RUNNING_LOG.md`; generators `tools/phase_shift.js` (named presets) and
  `tools/pitch_beat.js`; new `tools/midi_out.js` (SMF writer with pitch bend).
- **THE CENTRAL FINDING — two families, and they do not behave alike (D27).**
  Composer: *"it's really the staccato patch that lends the articulation —
  everything else is smeared or blurry."* In the **articulated** family phase
  reads as RHYTHM (smear → ticks → rain → gallop → groove). In the **smeared**
  family (ord/flz) **timing-phase does nothing at all** — *"everything sounds
  continuous, no swells"* — because onsets are masked by tones already sounding.
  That is a boundary, not a tuning problem.
- **PITCH BEATING WORKS and is predictive (D28)** — asked 1 beat/sec, heard
  *"beats ~1hz"*. `beat Hz = |f1−f2|`. Below ~1 Hz it reads as **flanger**
  (partial *n* beats at *n·Δf*), above as **beating**, and one bend ramp morphs
  between them — the working "waves" primitive the arc was looking for.
  **THE REGISTER LAW (measured):** a fixed cents detuning **doubles its beat rate
  per octave** (13.19 ¢ → 0.50 / 1.00 / 2.00 Hz at C2 / C3 / C4), so detuning a
  chord uniformly *stratifies* it. Feeds 2l directly.
- **Ceilings that bind the piece:** ten players ÷ the 0.42 s staccato ring =
  **~23 attacks/s**; and **stage width alone (~30 ms over 10 m) exceeds half a
  slot at 18 attacks/s**, so dead-even textures cannot exist in a hall and the
  mock-up is biased toward evenness and toward mass.
- **Standing performance rule adopted (composer):** no texture may depend on a
  precise beating rate or precise cents. Recorded as a constraint on the
  RESEARCH — every keeper must survive a human-error pass. **Pitch beating
  inverts the worry: beating is self-correcting by ear** ("beat about twice a
  second" is a real instruction).
- **Hand-off written: `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`** — evidence +
  requirements for a stronger model to plan the texture sandbox, every claim
  tagged HEARD / MEASURED / inferred.

**Open at session end (2026-08-16, day 10 — 2j):**
- **`phase13-beatfield` is UNHEARD** (~2 min): the upper boundary of beating
  (8 and 15 beats/sec), the ten-tuba beat field, and the register law by ear.
  MIDI only — `midi/phase13-beatfield.mid`, track N → `Tuba<N> SI2`, ord ch 1,
  each on its own UVI instance (bend is per-instance).
- **THE COMPOSER'S CALL, and it should be made before the sandbox is
  commissioned: the 2j/2v scope split (D29).** 2v already owns bend, pitch sets,
  sustained rendering and dynamics — and its **M1 "detune bloom" IS our pitch
  beating**, M3 "fan" is `phase13`. Recommended: 2v keeps everything bend-based;
  the new sandbox owns **attack fields** only. Otherwise it gets built twice.
- **The biggest hole: pitch was never introduced.** Every rhythmic experiment was
  ten players on a single C3, so the whole rain/gallop map is at unison. Does not
  block the build, but the sandbox needs a pitch layer from day one.
- Also untested, all deliberately deferred to the sandbox: counterpoint vs mass ·
  category morphs (rain → gallop) · the robustness/perturbation pass (never run
  once) · the repetition/density crossover · dynamics (untouched in this arc).
- **Two confounds in our own method, to design around:** order effects (the same
  setting drew opposite verdicts in different battery positions) and draw
  variance (at ten voices a scatter setting is a *random variable*, not a
  texture — the phantom "accents" came from single draws).
- `docs/NITS.md` gained one: the conflict badge does not recompute on score load.

**SESSION END (2026-08-16, day 10 — PLAN 2v MORPHING CHORDS, Claude Code):**
- **PLAN 2v IS COMPLETE.** All five phases built, heard and measured. The composer
  can now make a sonority, change it over time, audition it and insert it —
  `Morph` button in the composer score. **Five of six models produced material the
  composer called interesting or better; three are keepers usable in the piece.**
  Composer: *"as far as creating interesting musical materials, we are already
  there — it's more of a spoiled-by-riches situation now."*
- **The instrument question is settled: PITCH BEND WORKS.** ±1.99 st, linear, no
  artifacts to full range, and the composer hears **no seam** when the engine
  re-keys mid-glissando. So bend width is an implementation detail, not a musical
  constraint. Two surprises: the **residue trap is real** (a note after an unreset
  bend played +49.4 ¢ sharp), and the **quartertones patch is NOT a uniform
  quarter tone** (+23 ¢ at F2 → +57 ¢ at C4) — which answers PLAN 2l's blocking
  question with a different answer than expected and makes bend the vehicle.
- **The pitch chain is trustworthy end to end** — spectral targets land within
  **0.4 ¢**, fan waypoints within **1.0 ¢** including both re-key seams. That
  matters beyond morphing: any microtonal or spectral writing can rely on it.
- **Composer's call: dynamics is a LAYER on every model, not one model of six**
  (D24). M6 became the volume-ONLY model. Also D25 (morph notes are ordinary
  waveCurves + `morphBend`) and D26 (bend width is not a musical limit).
- **Findings that came from listening, not design:** a 30–60 s morph holds as ONE
  sonority · beating is the strongest material and is available *without* writing
  unisons · re-articulation carries the morph's **audibility**, so long segments
  are less informative rather than smoother · two concurrent morphs enrich one
  sonority rather than reading as two voices · voice reduction is lossy in
  **detail, not identity** ("8-bit vs 16-bit").
- **Full arc in `docs/RUNNING_LOG.md`**, including a **COLD START** section at the
  end written for a session that has never seen the conversation — it lists the
  six traps that cost time today. Read it before touching this code.

**Open at session end (2026-08-16, day 10 — 2v):**
- **Nothing in 2v is blocked or half-finished.** 101 unit tests green; Phase 4
  (insert / drag / group-scale / save-reload) verified in the running app.
- **Two follow-on builds are the composer's to scope, both with their own docs:**
  **GESTURE SHAPING** (*"the meta shape is really the sound itself"* — designed
  attack, body, release, with the tuba parts filled in to realise it; inverts the
  current parts-first order) and **MODEL ↔ ACTUAL**
  (`docs/plans/MODEL_AND_ACTUAL.md` — a model as "a point plus the directions
  worth travelling from it and how far"). *Note the ACTUAL half largely exists
  already (gesture bank); the new work is recipes, boundaries and the one-dial
  collapse. `bank/morph_recipes.json` is the first instance.*
- **B (technique migration) has not been re-heard since its fix.** It read as "a
  collection of different techniques"; technique changes now enter under a long
  deep dynamic ramp per the composer's instinct, but that change is unverified.
- **Unprobed, low stakes:** a very fast or very low re-key seam; whether the true
  bend pre-arm minimum is below 50 ms (all four rungs read identically).
- Carried from day 9, all still open and all still deferred by the composer: the
  **DB3 apex decision** · velocity-vs-CC7 (2q) · 42 soft flags in the piece ·
  META shape overhang (NITS) · `ost01-variety` unheard · cressand-family verdicts.

**Earlier days, one line each** (detail lives in the docs each names):

- **Day 9 (08-16):** DB3 orchestrated; **PLAN 2t DENSITY PIPELINE** shipped
  (D19–D23, `docs/DENSITY_PIPELINE.md`) — 251 → 160 notes at 0 hard / 0 soft,
  placed as **piece-s16** in Messiaen m3 on F; **2w** gesture bank + recall;
  labels-never-render bug fixed (Principle 4).
- **Day 8 (08-16):** collision avoidance end to end (**2r**) — occupancy model,
  HARD/SOFT tiers (D17), conflict-aware insert, resolver; back-audit of all 164
  scores clean (**2s**); **`AI_METHODOLOGY.md` adopted as governing (D18)**;
  `NITS.md` opened.
- **Day 7 (08-16):** the **CLUSTER SANDBOX** (`/clusterview.html`, **2p**) —
  42 takes + recording, piano-roll editor, non-destructive transforms, lists +
  items (D14), velocity-not-CC7 (D12), `SESSION_HYGIENE.md`.
- **Day 6 (08-15):** the blast pipeline — piece-s09, Blast Sandbox + three-tier
  taxonomy (D11), insertion strip, the **SAMPLE-LENGTH SURVEY → D9 (only ORD is
  a real duration)**, the save system (D10).
- **Days 4–5 (08-13/14):** piece assembly began (s01→s07c, movable META group
  shapes); harmony palette + pairing ledger; GESTURE-2 banked; cressand research;
  ostinato engine ported; `NAMING.md`.
- **Day 3 (08-12):** CRD remote listening; species {sine, expodec, surge};
  **the density arc → DB 044** (finding 15, accelerando scheduler, RECIPE
  BUILD-1); containers begun (DB 045).
- **Days 1–2 (08-10/11):** stack seeded from piece #3; SI2 roster + dual-port
  (D2); CC7 law and gain staging; laws L1–L3, Xenakis X1–X8, swell-cloud species;
  **Penn State research — deadline Sept 4 2026**; 10-part expansion, floating META
  window, grain suite, Roads catalog; **LAW L4 + RECIPE MAXDENSE-1** (DB 035).

**Orientation for a cold session:** `docs/AI_METHODOLOGY.md` (governing — read
before proposing anything) → `docs/PLANNER.md` (what now) → this §2 →
`docs/DENSITY_PIPELINE.md` if the work is a density build → RESEARCH_INDEX.md /
CURVE_DATABASE.md for the calibration lineage. Server: `node score/server.js`
(:5200). Sandboxes: `/clusterview.html`, `/chordview.html`.

**Blockers:** none.

## §3 Principles

*(Inherited from piece #3 — full text in its journal §3; they carry verbatim.)*

1. **Check Reaper input monitoring before blaming the instrument.**
2. **When a working reference exists, diff the files — don't iterate guesses.**
3. **Quiet tracks → suspect CC7 residue FIRST** (ISSUES.md I1): click CC7 Reset
   before touching gain staging. Wrong-sounding menu techniques → stale CC0 (I2),
   same button.

*(Added here, piece #4:)*

4. **Markers/labels belong in `objects`, never in the `markers` array.**
   `composer.html` loads `data.markers` into `Composer.markers` and saves it
   back, but `renderAll()` only iterates `this.objects` — so a label written to
   `markers` round-trips through save/load intact and is **never drawn**. The
   failure is silent in both directions: the file looks right, the tool report
   looks right, and only a human staring at the timeline notices. Five scores
   shipped this way (2026-08-16, all the DB3 arc + tonality files) and the
   composer found it, not a test. **Generalisation: any output whose only
   consumer is the composer's eye needs one check in the running app that the
   thing is actually on screen** — `AI_METHODOLOGY` rule 4 covers this, and this
   is what skipping it looks like.

## §4 Decisions

- **D1** *(2026-08-10)* — **Inherit piece #3's stack and protocols unchanged.** Score
  app + sandbox copied; #3's **D8** (saving: canonical committed score, explicit-save
  versions capped 20 gitignored, 5 s autosave) and **D9** (motive blocks = linked
  references into `sandbox/motives/`; unlink = fork; fixed per-instrument pitch axis;
  direct on-score editing) apply as written. *Why:* the protocols were designed
  piece-agnostic (engine vs. palette); seven tracks is palette data. Divergences get
  their own D-entries here.
- **D2** *(2026-08-10)* — **21 techniques > 16 channels → each tuba spans TWO UVI
  instances/ports** (`tubaN` = techniques 1–16 on A1–A16 · `tubaNb` = 17–21 on A1–A5;
  composer's build, session 1). Schema extension: a technique's optional `port`
  overrides the instrument port — senders resolve `tech.port || inst.port` (sandbox
  binding + score playback both patched). *Rejected:* UVI port-B via Reaper MIDI bus 2 —
  breaks the clean loopMIDI-port-per-instance wiring. *Slot order = composer's UVI
  screenshots 2026-08-10; keep it identical across all 7 tuba pairs.*
- **D3** *(2026-08-10)* — **Experiment MIDI renders the inferred PERFORMANCE of an
  animated curve, never the curve itself.** The curve is notation (D7 lineage);
  performers track it visually, so renders pass through a performer model (lag,
  smoothing, ~7-level dynamic resolution, eased onsets, anticipation, breath caps,
  per-player jitter — v0 parameters in CRESCENDO_EXPERIMENTS.md, tuned by ear).
  *Why:* curve-literal MIDI would optimize textures no ensemble can play; assessments
  must be of playable renderings. Curve-literal renders remain available as an A/B
  reference only. **Application timing (composer, 2026-08-10): the experiment phase
  runs STRAIGHT curve→sound (curve-literal) to build models first; the performer
  transform gets applied/tested at NOTATION time — "we'll see if the performance
  score curves need to be changed to produce the same sound effect." AI duty: resurface
  this before any performance-score notation is derived from experiment curves.**

- **D3** *(2026-08-10)* — **The mass-texture laws and species live in the research
  docs, with force of decision:** L1 scatter floors / L2 quota trends / L3 keeper
  anchor (CURVE_DATABASE.md) · Xenakis rules X1–X8 (XENAKIS_MASS_RULES.md) · the
  swell-cloud species with peak-cut-as-attack. Engines enforce L1/L2 by default;
  uniform stimuli require explicit override. *(Note: an earlier D3 re performer-model
  rendering also stands — see the experiments doc; renumber on next journal pass.)*

- **D4** *(2026-08-11)* — **Pass-2 outputs carry force of decision:** LAW L4
  (perceptual scale/bluntness, ×2.75 spacing) · RECIPE MAXDENSE-1 (DB 035) is THE
  starting point for max-density passages · keeper-excerpt practice ({score, seed,
  time-range, note}). Fine-tuning happens in-piece against a named target texture,
  not by reopening calibration. *Why:* five listen-cycles converged; the composer
  declared the two parameters well explored.

- **D5** *(2026-08-12)* — **Wrap-protocol divergence (piece #4 only):** at
  Session End, DO NOT ask "any lessons/gotchas to capture?" — the composer
  explicitly volunteers wrap additions; absence of them in the wrap directive
  means "no further input." (Supersedes SESSION_PROTOCOL.md step 2 for this
  piece; the protocol file itself lives read-only in piece #3.)

- **D6** *(2026-08-12, composer wrap addendum)* — **The reverse-engineering
  approach governs the piece phase:** do NOT pursue globally-well-behaved
  generators top-down. Construct the piece shape by shape, adapting the
  machinery PER SHAPE until each sounds as intended; the accumulated per-shape
  adaptations inform the machine ("more and more capable of reproducing a
  variety of sonic shapes"). AI duty: after each shape is approved, extract the
  GENERALIZABLE lesson (new dial? new mechanism? recipe variant?) into the
  docs — generalization is harvested from the shapes, not imposed on them.
  *(Extends P4's generate→tweak→reverse-analyze loop to the whole piece;
  the containers (2e) are the vehicle.)*

- **D9** *(2026-08-15)* — **ORD is the only real duration; the other articulations
  are fixed one-shots.** Measured probe over 80 notes: fortepiano (1.35–2.22 s),
  cuivre (0.99–1.35 s) and staccato (0.33–0.53 s) all end themselves, with the
  multisample sawtooth (length shrinks as transposition rises within a group, then
  jumps). Therefore an inserted note of those techniques takes its **true sample
  length** from `bank/sample_lengths.json`, and is **immune to group scaling** — it
  translates with the gesture but never stretches. *Why:* blocks were being drawn
  at 3.0 s while the sound died at ~1.7 s, so the notation was lying about the
  sound; and proportional scaling was shrinking cuivre for no acoustic reason.
  *Rejected:* one constant per articulation (the sawtooth is audible at the
  register extremes), and estimating instead of measuring (a 5-minute probe settled
  what an afternoon of guessing would not).
- **D10** *(2026-08-15)* — **The piece file is opened through a WORKING COPY.**
  Selecting a `piece-*` save diverts the session to `piece-sNN-work`; autosave
  writes there and the canonical file is never mutated. "Save as next" promotes to
  the next number; "Variant" saves lettered siblings. *Why:* the composer's actual
  workflow is "load the latest, work, save as new", but autosave was silently
  rewriting the file that was loaded — a mistake had no floor beneath it.
  *Rejected:* disabling autosave (loses work), and snapshot-on-load alone (safety
  would depend on remembering to act).
- **D11** *(2026-08-15)* — **The blast taxonomy's three tiers are fixed:** chord →
  **voicing** (pitch set ONLY) → **sonority** (voicing + per-note articulation +
  cuivre + length + dyn), with named custom lists as the section-level selection.
  **Cuivre is chord-level ARTICULATION** (brass colour), never a voicing change,
  and never records as a pitch-content edit. *Why:* the composer's model — "you
  hear the brassiness more than anything" — and it keeps voicings comparable
  across articulations. Manual thinning (to respect the 10-player limit) is stored
  as that voicing's cuivre *arrangement*, not as a new voicing.
- **D12** *(2026-08-16)* — **In the CLUSTER sandbox, loudness is carried by NOTE
  VELOCITY; CC7 is pinned full once per port and never touched.** *Why:* the
  composer's instrument — velocity is what the meter shows and what the keyboard
  sends, so the number being edited must be the number that sounds. *Rejected:*
  driving CC7 from velocity through the calibrated map (tried; it is what the
  composer score does, and it works there because the score pre-arms CC7 150 ms
  before the attack — but it made the sandbox's own dial an indirection the
  composer could not reason about). **CONTRADICTION LEFT OPEN:** the composer
  score still sonifies via CC7. If SI2 proves velocity-insensitive, sandbox
  dynamics will not carry into the score — settle with a one-pitch listening test
  (velocity 30 / 70 / 127) before relying on either.
- **D13** *(2026-08-16)* — **A transform never disables an interaction.**
  Transforms are a PREVIEW layer drawn over the stored notes, which stay grey,
  selectable and editable underneath. *Why:* two sessions were lost to "I can't
  select notes" — first a velocity change gating editing, then a live transform
  doing it; a modal rule that silently removes an affordance is worse than the
  confusion it was meant to prevent. *Rejected:* keeping the block but making the
  warning louder.
- **D14** *(2026-08-16)* — **One editable concept: LISTS + ITEMS.** An item is a
  stored gesture living in a list; load it, edit it (it autosaves back),
  duplicate for a variant, delete to remove — the standard preset model. *Why:*
  the composer's verdict on the snippet/gesture split was that it "just doesn't
  make sense"; two tiers with different persistence rules and a save-over /
  save-as-new pair needed explaining, and anything needing explaining is wrong
  here. *Rejected:* keeping snippets as a scratch tier (migrated into an
  `unsorted` list instead, losing nothing).

- **D15** *(2026-08-16)* — **A voicing is an IDENTITY; a cluster is a STATISTIC —
  so the cluster yields.** When an inserted blast and an existing cluster cannot
  both be played, the blast keeps its full pitch set (D11: the pitch set IS the
  sonority) and the cluster sheds notes (it is a cloud; losing 1 of 14 does not
  change what it is — the `thin` transform already does this on purpose). *Why:*
  the two materials are not symmetric, so a symmetric rule would damage whichever
  one it touched. *Applied only by the resolver's `auto` button — never
  automatically.* **Rejected:** dropping by recency (destroys voicings for no
  musical reason), and refusing the insert (the composer must be able to place
  what they hear and decide afterwards).
- **D16** *(2026-08-16)* — **Insert never refuses and never silently drops.**
  Every note lands, conflicts are marked on the lanes, and removal is a separate
  explicit act. *Why:* one code path instead of a "does it fit?" branch — the
  bug surface is what costs hours, not the code volume; and the composer always
  sees the complete sonority before choosing what dies. **Corollary:** the check
  runs on EVERY mutation, not at insert time — dragging a gesture would otherwise
  re-create conflicts that an insert-time-only check could never see.
- **D17** *(2026-08-16, corrected same day)* — **Playability conflicts are split
  HARD vs SOFT, and the split is load-bearing.** HARD = the intervals overlap:
  physics, cannot be wrong, cannot be tuned away. SOFT = the player is being asked
  to re-attack faster than they can: an ESTIMATE. *Why the split:* an estimate
  that turns out wrong can then only mis-tint something amber — it can never block
  work or force a decision.
  **SOFT is measured ATTACK-TO-ATTACK.** The first version measured the END-to-start
  gap, which was wrong: a fixed one-shot's length includes decay the player is not
  articulating through, so it demanded a rest after the sample had already finished.
  It flagged 167 spots in piece-s11 and 78 in dens8 that are entirely comfortable.
  Corrected constants come straight from **2j's tremolo table, which IS an attack
  rate** — half step 4.5 Hz = 0.111 s, fifth 3.0 Hz = 0.167 s — giving
  `minAttack 0.11 + 0.0093/semitone (cap 0.22)`, plus a 0.03 s tongue reset.
  Result: dens builds 78/86 → **0**; piece-s11 167 → **42**, all of them real.
  *Still estimates pending the composer's ear, same status as 2j itself.*

- **D18** *(2026-08-16)* — **`docs/AI_METHODOLOGY.md` is the governing working
  instruction, and it outranks the inherited preference docs.** Fix what blocks
  the piece, flag the rest to `docs/NITS.md` · never put minutiae to the composer
  (surface a decision only when it changes the musical result AND only they can
  answer it) · prefer one large robust build over a small fragile one, because
  **code volume is not the constraint — broken code and composer attention are** ·
  **a confidence claim must be verified in the running app, because the composer
  plans around it** · no clear evidence means no diagnosis, flag it instead.
  *Why:* the previous session lost hours to small bugs, and this one lost composer
  time to a four-option design menu about things that did not matter. *Rejected:*
  time estimates of any kind — they have been wrong in both directions, so
  confidence and residual risk are reported instead.

- **D19** *(2026-08-16)* — **A played take is packed to the PLAYABLE CEILING, not
  thinned by a guessed amount.** For each note in time order: free player → place
  it · none → nudge to the earliest opening within a small budget · budget blown
  → accept a tight-but-legal spot · nothing fits → delete. **Deletion is the last
  resort by construction**, so density automatically rides the ceiling (10 players
  ÷ 0.45 s one-shot ≈ 22 attacks/s) and never exceeds it. *Why:* the composer's
  model — *"nudge first, maintain max density, and then delete"* — and it is one
  convergent pass instead of an iterate-and-check loop. *Rejected:* the
  prune-simultaneities-then-space-attacks pair I proposed first; measured on DB3
  it kept 127 notes and still left 1 hard + 1 soft, against pack-to-ceiling's 160
  notes and 0/0. **Corollary the measurement settled:** nudging does NOT retain
  density (60 ms → 400 ms of budget buys 8 notes — at saturation a shifted note
  walks into the next collision, exactly as the composer predicted). What the
  small budget buys is **cleanliness: 37 soft flags → 0** for a mean 35 ms move.
  Playbook: `docs/DENSITY_PIPELINE.md`; PLAN 2t.
- **D20** *(2026-08-16)* — **Player assignment is LEAP-AWARE; the jump moves
  between players rather than being asked of one.** `assignCluster`'s tie-break
  was pitch-blind (tier → least-recently-used → lane index), so a single player
  could be handed a 26-semitone jump in 0.35 s while another sat in the same
  register, and no part had a tessitura. The leap term competes with LRU and
  **can never outrank the tier**, so a wide-open player still beats a
  close-pitched busy one — it only chooses between equally legal lanes. Measured
  on DB3's 251-note take: mean leap 7.9 → 3.1 st · octave-plus leaps 58 → 11 ·
  part span 29 → 23 st · **hard conflicts 154 → 135** (pitch-clustered lanes pack
  better). *Why it matters beyond tidiness:* it is the only real fix for a soft
  RATE flag — nudging in time cannot help because the line is still as fast
  (2r's "move to another player", now applied at assignment so there is nothing
  left to resolve). *Verified in the running app*, matching the tool exactly.
- **D21** *(2026-08-16)* — **A simultaneity clump in a played take is an ACCIDENT
  of hand-slapping, not a chord — so it is spread and thinned by registral
  spread, not by voice-leading.** Composer: *"in the densest areas, I'm just
  hitting all my hands on all the keys… some of those attacks are mistaken chords
  rather than just a flurry of attacks."* Survival order within a clump
  (`--pick spread`): top, bottom, then farthest-from-everything-kept. *Why:* the
  extremes preserve the band's registral WIDTH as its thickness drops — what you
  actually hear in a cluster mass — and the max-min fill stops the middle
  hollowing out over consecutive clumps. *Rejected as defaults but kept as flags:*
  seeded `random` and raw-MIDI `arrival`; the composer explicitly declined to
  audition variants for now.

- **D22** *(2026-08-16)* — **Articulation is an ARC, not a ramp.** Fortepiano is a
  swell of its own that peaks *just before* the density takes off and is gone by
  the apex. Measured off the two density builds already in the piece: DB1 and DB2
  both land at **~21 % fp overall**, with 14–33 % / 0–25 % early, a **peak of
  55–70 % at 12–20 s**, then thinning to 0 at the apex. *(This is also where the
  composer's remembered "seventy, thirty" comes from — DB2 hits 70 % at 12–16 s.
  Never a global ratio, the top of this arc.)* *Why:* the first version ramped
  P(staccato) 0→1 from an all-fortepiano opening, which put every fp in the
  sparsest bars where it reads as an isolated event rather than a colour in a
  mix — composer: *"it felt like I didn't hear it."* **The roll only proposes and
  physics disposes:** fp is a FIXED 1.35–2.22 s one-shot (D9), so conversion
  replaces a 0.45 s staccato with a note 3–5× longer; room here → room elsewhere
  (leap-aware) → it stays staccato, reported. Zero new conflicts by construction.
  *Consequence worth carrying:* **DB3 cannot reach 21 %** — its sparse region is
  ~11 s of a 23.5 s build, so the physics ceiling is 18 notes (11 %).
  `tools/artic_pass.js`, superseding the D9-obsolete `tools/transform_fp.js`.
- **D23** *(2026-08-16)* — **A finished density build enters the piece by
  PLACEMENT SCRIPT, not through the Insertion strip.** The strip's two sources
  store a pitch set (blasts) or a `{t,p,v,d,tech}` event stream (clusters);
  **neither has a field for `layer`, `envShape`, `nodes` or `segments`**, so a
  round trip flattens every hand-shaped surge back into a block. Copy
  `tools/piece_s08.js`: offset the notes, copy the objects wholesale, one
  `groupId` plus its META shape, then re-audit. *Why not build UI:* you insert a
  density build once, and the sandbox principle is UI for hammered loops, prompts
  for one-offs. A third strip source ("Gestures", carrying whole orchestrated
  objects) earns its build when several builds need placing and re-placing —
  not before. Full write-up: `docs/DENSITY_PIPELINE.md` §6.

- **D24** *(2026-08-16)* — **LOUDNESS IS A LAYER ON EVERY MORPH MODEL, not one
  model of six.** Composer: *"centre volume changes more prominently — we
  undersold that earlier."* Every render carries a per-voice dynamic contour
  (`dyn {base, shape, amount, turns, spread}`, shape ∈ swell/rise/fall/rotate/
  flat), so a pitch morph also swells unless `flat` turns it off. **M6 is
  therefore the volume-ONLY model** — it holds pitch and technique and defaults
  the layer to `rotate`. *Why it matters beyond the feature:* morph dynamics now
  take the identical calibrated path as every hand-drawn crescendo in the piece,
  so a hairpin inside a morph sounds like a hairpin in the piece. *Rejected:*
  leaving volume as one selectable model (the composer's whole point was that it
  is not one option among six but a dimension of all of them).
- **D25** *(2026-08-16)* — **A morph note is an ORDINARY score `waveCurve` plus
  one new field, `morphBend`** — not a new object type and not a new `env`
  structure, which is what the plan's schema specified. Level envelopes already
  exist in this app as `nodes`/`segments`, and the engine emits level in the
  score's own 0–10 unit rather than absolute CC7 because the CC7 law is a
  MEASURED map loaded at runtime (`probes/cc7_map.json`) — emitting the law's
  INPUT keeps that calibration in exactly one place. *Consequence:* existing code
  already draws, plays, drags and group-scales morph notes, so "envelopes survive
  a drag" came free from debugged machinery instead of new code. Verified in
  Phase 4. *Rejected:* the plan's `env: {bend, cc7}` — it would have forked the
  CC7 calibration, which the same plan forbids, and it contradicted the engine's
  own purity rule (a pure engine cannot fetch the map).
- **D26** *(2026-08-16)* — **The patch's ±2 semitone bend limit is an
  implementation detail, not a musical constraint.** A wider move is SPLIT into
  consecutive re-keyed notes (bend to the edge, re-key, continue, contiguous so
  the player slurs across a fingering change). Measured: fan waypoints land within
  1.0 ¢ *including both seams*, and the composer reports **no audible seam** on a
  continuous re-keyed glissando. *So a fan may be as wide as the music wants.*
  *Caveat kept:* one leg, one register, one rate — a very fast or very low re-key
  is unprobed. *Rejected:* flagging wide fans as unplayable (correct but useless),
  and hiding the seam under a dynamic dip (unnecessary — nothing to hide).

- **D27** *(2026-08-16, PLAN 2j)* — **ARTICULATION DECIDES WHETHER PHASE IS A
  DEVICE AT ALL.** Two families, and they do not behave alike. **Articulated
  (staccato):** phase relationships between attacks read as RHYTHM — the axis is
  regular↔irregular and the composer's names for it are **smear · ticks · rain ·
  gallop · groove**. **Smeared (ord, flz, fp-under-overlap):** ten voices blur
  into a wash and **timing-phase does nothing at any rate or spread**, because
  each attack is masked by nine tones already sounding — composer: *"everything
  sounds continuous, no swells at all."* *Why it is a decision and not a note:*
  it closes a whole search direction. Do not re-litigate timing-based swelling in
  a sustained texture. *Evidence:* `phase08`–`phase11`; the negative was
  predicted by measurement (sounding-note count never left 8–10) before it was
  heard. *Corollaries kept:* **ord masks staccato** at equal dynamic, so "attacks
  on a bed" needs dynamic or registral separation; and **fortepiano under overlap
  loses its piano tail**, reading as attack-only — a usable colour, found not
  designed.

- **D28** *(2026-08-16, PLAN 2j)* — **MODULATION IN A SUSTAINED TEXTURE COMES
  FROM PITCH, AND IT IS CALCULABLE.** `beat rate (Hz) = |f1 − f2|`;
  `cents = 1200·log₂(1 + beat/f)`. Verified by ear: asked 1 beat/sec, heard
  *"beats ~1hz"*. **Below ~1 Hz it reads as FLANGER** — correct acoustics, since
  partial *n* beats at *n·Δf*, so the fundamental crawls while the upper partials
  shimmer — **and above ~1 Hz as BEATING**; one bend ramp morphs between them.
  **THE REGISTER LAW (measured by decoding the MIDI): a fixed cents detuning
  doubles its beat rate per octave** — 13.19 ¢ gives 0.50 / 1.00 / 2.00 Hz at
  C2 / C3 / C4. *Consequence:* detuning a chord by a constant amount
  **stratifies** it (top shimmers, bottom crawls); a uniform beat rate needs
  different cents per register. *Why it matters beyond this arc:* it is also the
  **performability answer** — a player cannot hit "+13 ¢", but beating is
  **self-correcting by ear**, so *"beat about twice a second"* is a real
  instruction. Pitch beating is MORE performable than the timing version.

- **D29** *(2026-08-16, PLAN 2j — **CONFIRMED by the composer day 11**)* —
  **SCOPE SPLIT:
  2v OWNS EVERYTHING BEND-BASED; THE TEXTURE SANDBOX OWNS ATTACK FIELDS.** 2v
  already has sustained rendering, bend, pitch sets, dynamics contours, the
  params-file loop and an insert path — and its **M1 "detune bloom" is exactly
  the pitch beating above**, while **M3 "fan"** is `phase13`'s fanned detuning.
  So the new sandbox should own **density · scatter · jitter · spread · voices ·
  articulation** and *layer with* 2v rather than duplicate it; pitch beating
  enters as a requirement ON 2v (beat rate in Hz as the dial, plus the register
  law). *Why:* otherwise the same engine gets built twice, in two places, with
  two sets of bugs — and the deadline is Sept 4. **CONFIRMED by the composer
  2026-08-16 (day 11), so it is now binding on both projects:** the 2x plan
  builds attack fields with **no bend anywhere**, and pitch beating enters 2v
  as a requirement on M1/M3 (beat rate in **Hz** as the dial rather than raw
  cents, plus the register law — a fixed cents detuning doubles its beat rate
  per octave). *Nothing musical is given up: the two outputs layer freely in
  the score — attack fields over a beating bed.* *Rejected:* letting the
  sandbox own beating too (duplicates 2v's debugged bend/emit machinery, and
  app playback cannot carry bend, so that audition loop would degrade to
  MIDI-only).

- **D30** *(2026-08-16)* — **PUSH IS AUTOMATIC AFTER EACH COMMIT.** Supersedes
  "never push without asking" for this project. Each agent stages **explicit
  paths only** (never `git add -A`, which would sweep the other's half-finished
  work) and pushes its own commit; a push carries both agents' commits, which is
  harmless as long as every commit is complete. *Why:* with two agents in one
  working tree the composer was left tracking who owed a push; the rule removes
  that bookkeeping without adding risk. *Recorded in `CLAUDE.md` and in
  `docs/RUNNING_LOG.md`'s working rules.*

## §5 Done

- 2026-08-10 — 0a stack seed.
- 2026-08-10 — Gain staging calibrated; CC7 law measured; cresc lengths DB.
- 2026-08-10 — Crescendo research arc: laws, Xenakis rules, swell-cloud species;
  **SC4 dense hold approved (provisional)**.
- 2026-08-11 — 10-part expansion + UI batch + Roads catalog + engine framework.
- 2026-08-11 — **Pass 2 complete**: L4 carved, MAXDENSE-1 recipe adopted (DB 035),
  finding 14; five live calibration cycles (OC, DH1–DH5).
- 2026-08-16 — **PLAN 2r playability/collision avoidance shipped**: occupancy
  model, HARD/SOFT tiers, conflict-aware insertion for blasts and clusters, live
  lane wash, and the resolver (move to another player / drop / nudge / auto).
- 2026-08-16 — **PLAN 2s back-audit**: all 164 scores checked; every piece file and
  density build clean of hard conflicts. `tools/audit_playability.js`.
- 2026-08-16 — **`docs/AI_METHODOLOGY.md`** adopted as the governing working
  instruction (D18).
- 2026-08-16 — **PLAN 2t DENSITY PIPELINE shipped** (D19–D23): pack-to-ceiling
  (`tools/pack_take.js`), leap-aware `assignCluster`, the fortepiano arc
  (`tools/artic_pass.js`), version arcs (`tools/build_versions.js`), tonality
  variants (`tools/tonality_variants.js`), part-by-part report
  (`audit_playability.js --parts`), playbook `docs/DENSITY_PIPELINE.md`.
  DB3: 251 → 160 notes, **HARD 0 / soft 0**, verified in the app.
- 2026-08-16 — **`docs/PAPER_NOTES.md` DB3 case study** — one gesture end to end
  with the measurement that forced each stage; the paper's worked example.
- 2026-08-16 — **PLAN 2u spec'd** (tonality sub-menu) — not built; the remap
  engine already exists in the cluster sandbox.
- 2026-08-16 — **PLAN 2w GESTURE BANK + RECALL** — `bank_gesture.js` /
  `place_gesture.js`: capture a finished orchestrated gesture by name, recall it
  into any score. The second insertion path, for material the strip cannot carry.
  DB3 placed into the piece as **piece-s16** (Messiaen mode 3 on F).
- 2026-08-16 — **PLAN 2v MORPHING CHORDS COMPLETE** (D24–D26). Probes (bend
  works ±1.99 st, residue trap real, quartertones patch not a uniform quarter
  tone) · pure engine `score/public/morph.js` with six models, breath/striation
  carrier, universal dynamics layer, and **101 unit tests** · emit layer with
  registry-driven panic · the **Morph panel** (generates, auditions, inserts,
  never edits) · segmented re-key for wide glissandi · recipes banked with their
  dial boundaries. **Measured: spectral targets within 0.4 ¢, fan waypoints
  within 1.0 ¢ including seams.** Five of six models produced material the
  composer called interesting or better; three are keepers.

- 2026-08-16 — **PLANS 2z + 2y drafted and APPROVED** (day 11): GESTURE
  SHAPING v2 (`docs/plans/GESTURE_SHAPING.md` — gesture-level ADSR, multilayer
  attack, release-as-subset, motion) and MODEL ↔ ACTUAL
  (`docs/plans/MODEL_AND_ACTUAL_PLAN.md` — model store, one-dial recipes,
  actuals with provenance + placements, shape presets). Order: 2z then 2y,
  never concurrent. 2x ID collision resolved (gesture shaping → 2z).

- 2026-08-16 (day 11) — **PLAN 2x TEXTURE SANDBOX plan approved** —
  `docs/plans/TEXTURE_SANDBOX_PLAN.md` v3, handoff-hardened, kickoff prompt in
  §16. **D29 confirmed** (attack fields only, no bend). Qualitative/recipe
  interface · Texture panel in the composer score · no editor · panel loop +
  long-render pockets · 2y-aligned MODEL/ACTUAL stores · seeds + PIN/A-B +
  humanize, with a robustness verdict required before banking.
- 2026-08-16 — **PLAN 2j PHASE-SHIFTING RESEARCH ARC complete** (D27–D29):
  13 experiments `phase01`…`phase13`; the two-family model; the dials
  (density · scatter · jitter · spread) with measured ranges; the density and
  stage-width ceilings; **pitch beating verified predictive** and the register
  law measured. Write-up `docs/PHASE_SHIFTING.md`, hand-off
  `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`, generators `tools/phase_shift.js`
  + `tools/pitch_beat.js` + `tools/midi_out.js` (SMF writer with pitch bend).

## §6 Human Notes

- *(2026-08-12)* **Try PLAYING some of the shapes** — as another way to collect
  data models (performed shapes = ground truth for D6's harvest; ties to D3's
  performer-model question; the Stereo-Mix capture path from the probes could
  record it).  **DONE 2026-08-13/14** — A1-5, A2-hp-whole,
  cluster_samples_01, clusterClouds02 and vertical_shapes_01 were all played in
  and banked; the play-in pipeline (2f) runs on them.
- *(2026-08-15)* **Composer break taken mid-session** — piece-s09 is the live
  state; nothing is half-written.  **CLOSED 2026-08-16** — piece-s09 untouched
  since; the day went to the cluster sandbox.
- *(2026-08-16)* **Budget:** Max 5× plan; extra credits bill near API rates, so
  topping up buys far less than the subscription per dollar. The lever is session
  hygiene, not spend — see `docs/SESSION_HYGIENE.md`.
- *(2026-08-16)* **One listening test owed** (PLAN 2q): does SI2 tuba respond to
  note velocity, to CC7, or both? Everything downstream of dynamics depends on
  the answer. **Narrowed 2026-08-16:** it does NOT block insertion — inserted
  blast/cluster notes already play at the recorded velocity with CC7 pinned full
  (`sonifyMode:'plain'`), matching D12. It still matters for the drawn crescendo
  material, which follows CC7.
- *(2026-08-16)* **Methodology set by the composer** → `docs/AI_METHODOLOGY.md`
  (D18). The composer will append their own prompt text to that file.
- *(2026-08-16)* **Deferred by the composer, not to be raised again unprompted:**
  the META shape overhang (NITS) and the amber soft flags in the piece — both
  wait until they actually get in the way.
- *(2026-08-16, day 9)* **Listening owed on DB3 — the whole session is unheard.**
  `densBld03-arc-v2` (5 stages, 122.8 s) and `densBld03-tonalities` (9 harmonies,
  224 s). Then the grain pass in section E, then the apex decision. **This is the
  first thing next session.**
- *(2026-08-16, day 9)* **The apex question, restated because it recurs:** the
  packed build is limited by the SAMPLE's ring time, not by tuba technique — the
  probe measured "Sounded (s)", decay and room included, and D17 already made
  that correction for SOFT but not for HARD. The apex exceeds ten players under
  any assumption (44 hard even at a 0.11 s floor), but the thinning amount is
  model-dependent, ~30 to 91 notes. In NITS; needs a real player's articulation
  rate, same evidence 2j and 2q are waiting on.

- *(2026-08-16, day 10 — 2j; updated day 11)* **Two calls owed** → resolved as:
  (1) `phase13-beatfield` listen **DEFERRED by the composer (day 11) — not
  blocking 2x**; hear whenever; the verdicts (upper beating boundary, register
  law by ear) feed 2v's dial boundaries / MORPH_FINDINGS, so it is not to be
  raised again unprompted. (2) **D29 (2j/2v scope split): explained day 11,
  awaiting the composer's one-word confirm** — the 2x plan (v3) assumes the
  recommended split (2v keeps everything bend-based incl. pitch beating; 2x =
  attack fields only).
- *(2026-08-16, day 10 — 2j)* **Push policy changed (D30):** either agent pushes
  automatically after its own commit, staging explicit paths only. You should no
  longer have to track who owes a push.
