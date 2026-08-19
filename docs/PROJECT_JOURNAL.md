# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**DAYS 18-19 (2026-08-18/19) — THE METHOD SETTLED AND THE TRANCE SECTION STARTED
BEING WRITTEN. Claude Code / Opus 5.**

- **D41 governs everything now:** the section is written with **AI prompts and
  pasted console scripts, not panels** (the composer stopped using the day-16/17
  panels and said why). Scripts are handed over **in chat as fenced code blocks**;
  one scratch score overwritten per paste; scripts FULL-clear and refuse to clear
  real work. **Read `tools/console/README.md` before writing any console script**
  — four labelling rules that each cost a round trip.
- **PLAN 2ae BUILT** — 12 octave unisons banked, three column buttons in the
  Insertion strip (insert / replace / delete), `O` = selection→ORD, drag-length
  readout, `A`/`SHIFT+A` column select, multi-resize. A marquee was assessed and
  **rejected on purpose** (left-drag already pans; lanes are separate divs).
- **PLAN 2af SPEC'd then RUN** — `docs/plans/TRANCE_GENERATOR.md` is the machine
  (UNIT · HARMONY · CUIVRE · PLAYER ASSIGNMENT), `tools/trance_gen*.py` are the
  three hand-run variants, and five audition scores came out of them.
- **The composer is now assembling the actual section** from `gen-aud-05` by
  index: `aud-7` → `aud-11` / `tranceA002f`.

**Next up — START HERE:**
1. **THE PHASE-SHIFTING MACHINE (PLAN 2ad).** The composer named this as the
   first thing next session. **It needs ZERO code and is already set up:**
   `Texture` button in the score app; A/B/C are the SMEAR / RAIN / GALLOP
   references; the panel polls `bank/texture_params.json` every 1000 ms and lands
   on an AI edit within a second with no reload (**proven live day 17**). The
   loop is: composer plays → comments in the day-12 vocabulary (smear · ticks ·
   rain · gallop · groove, regular↔irregular, displacement in beats, see
   `bank/texture_models.json` `_vocabulary`) → AI edits the variants and bumps
   `rev` → composer re-plays. Bank a keeper with
   `node tools/texture_bank.js --bank <NAME> --from <variant> --survives yes|no
   --note "<plain ASCII — the shell mangles em-dashes>"`.
   **The measured prediction to test first: RAIN and GALLOP have nearly the same
   jitter (sd 30.7 vs 32.3 ms) but very different unevenness (0.14 vs 0.68). If
   they sound alike they are one category with two labels.** Either answer is a
   result.
2. Keep assembling the section; ask for more sonorities freely (a JSON edit to
   `bank/blast_taxonomy.json`, no code, no reload).
3. Still queued behind the trance work: the notation pass (FR-7, D3, dynamics).

**Open at session end:**
- **THE SILENT-NOTE TRAP, still live outside the generator.** Staccato sounds
  only MIDI 30-65, and **7 of the 13 species in `more chords` carry a 66 or 68**
  — they render and never speak. `trance_gen*.py` octave-folds at use-time, but
  **the Insertion strip does not**, and the blast sandbox will let you bank a
  pitch the technique cannot sound with no warning. A one-line range check at
  bank time was offered and NOT built.
- **Unheard, and the notation bet rests on it:** whether a paired stream reads as
  one line split between two players, or as two players who happen to coincide.
- 15 identical chords close `aud-11` — far more static than anything else in the
  section. Flagged to the composer, not acted on.
- **Deliberately uncommitted, do not "clean up":** every `scores/*.json` from
  this work — `aud*`, `gen-aud-01…05`, `tranceA001*`, `tranceA002*`,
  `tranceSB*`, `piece-s21…s24`, plus `reaper/7_tubas_rack.rpp`. The `gen-aud-*`
  files are large and **regenerable** from `tools/trance_gen*.py`; the `aud*` and
  `tranceA002*` files are the composer's own work and are not.
- Still open from day 15: the lazy-MIDI bug (keyboard dead on a fresh page until
  Play / CC7 Reset / REC-arm; `initZoneMidi`, composer.html ~12246).
- **Nothing about the SOUND has been verified by anyone** — Web MIDI is blocked
  in the verification pane, so every claim in these docs is a data claim.

---

- **Day 17 (08-17):** **the two audition machines** — 2ab panel snapshots
  (`bank/panel_snapshots.json`, also the AI-dialling channel; 75/75,
  localStorage-wiped gate) and 2ac the MULTITEMPO RIG (`MT` button, ratio sets
  over one BPM, 3 separation modes, 90/90 — C = 1.2 s at 150 / 3:4:5, streams
  realign within 0.6 ms). 2ad phase-shift selector proved to need ZERO code.
  → D39, D40. All three still unheard at the time.
- **Day 16 (08-17):** **PLAN 2aa v1, the PULSE SEQUENCER STRIP** — `Pulse`
  panel, a 29-entry sonority menu (`bank/pulse_palette.json`) resolved live
  against the taxonomy, pure `pulse_seq.js` engine (103/103, mutation-tested),
  seamless looping measured at 240-260 ms. Audition only; writes nothing. The
  finding that changed the build: **five of the seven staccato/cuivre pairs have
  identical pitch sets**, so refs resolve with per-note articulation (**D37**);
  and a looped audition schedules ahead on one time base rather than
  re-invoking `E.play` (**D38**). *Still unheard.*
- **Day 15 (08-17), three sittings:** two more morphs placed by the composer —
  `piece-s23`, 1236 objects, **496.6 s (8:16)**, carrying `ACT-BLOOM-01`,
  `ACT-CONVERGE-01` and `ACT-BALANCE-01` · the **BALANCE abrupt-ending law**
  found and fixed in DATA (`carrier.release: 5` + a `close it` recipe; BALANCE
  cut at 97% of its own peak against 29–59% for the other five, because it is
  the only model on `rotate`) · the time-readout regression fixed (the px/s
  hover handler was deleting the m:ss spans) · **the clear cycle split in two**
  (`/checkpoint`+`/resume` beside `/session-end`+`/session-start`;
  `SESSION_HYGIENE.md`) · the **fade ladder** verified, extracted to
  `M.buildLadder`, pinned by `test_ladder.js` (54/54) · then the evening's
  trance work: a keyboard fifths chain (`tranceSB01`), two accretive pulses, and
  the realignment that became **PLAN 2aa**. **THE ENSEMBLE IS TEN TUBAS** —
  composer, explicitly: *"10 parts tracks one to ten"*; the repo name stays
  historical. Full trail: `RUNNING_LOG.md` day 15.
- **Day 14 (08-17):** **THE BLIP IS GONE** — it was CC7 *timing*, not values
  (a 250 ms cold-attack lead + the CC7 restore delayed 2 s past the tail);
  composer: *"Blip gone."* The composer then placed the first morph in the piece.
- **Day 13 (08-17):** **MORPH CYCLING** (FR-3/FR-6) — `carrier.span` split from
  `carrier.duration`, so lengthening a morph no longer slows it; **three engine
  bugs found by the composer's EAR**, all of one kind (a mechanism correct for
  the body reused where its assumptions fail) plus two dead panel paths; the
  spec ledger `docs/FEATURE_REQUESTS.md` opened; 354 assertions, fixtures never
  regenerated.
- **Day 12 (08-16/17), two concurrent sessions in one tree.** **2x TEXTURE
  SANDBOX built end to end** (317 assertions; `Texture` button; detail in
  `docs/plans/TEXTURE_SANDBOX_PLAN.md` §13). Its finding that reaches past the
  sandbox, MEASURED: **the 23/s density ceiling is C3-SPECIFIC** — any real pitch
  set drops it to 18.9–20.8/s, so a texture calibrated by ear at unison C3 is
  ~18 % too dense once it has pitches; the engine now computes the ceiling per
  render. Four defects found by RUNNING it, none by reading (dead seed stepping
  → **Principle 6**; `active` ignored on rev bump; shared `E.onStop`; the
  conflict badge is structurally ring-blind). → **D33** (parallel texture actuals
  store). **2z GESTURE SHAPING built** (331 assertions) and **2y MA0–MA3 built**
  (model store, validator, recipe engine, ACTUALs panel → **D32**). The
  composer's verdict on 2z's generic shapes — *"correct as an engine"* but not as
  sound models — set **D31: bespoke, one morph at a time**. Two pre-existing 2v
  bugs fixed by measurement: **pitch out by up to 40.2 ¢** on off-key onsets
  (→ **Principle 5**) and the panel carrying the previous variant's dials across
  a switch, which made every day-10 cross-variant comparison invalid.
  **Still open, and all of it is in §6 Human Notes:** the entire 2x listening
  slate (nothing has been heard by anyone), MA4 (rename the six placeholder model
  ids before actuals reference them; bless the recipe slates), and re-hearing the
  six models now that both bugs are fixed.
- **Day 11 (08-16):** planning only — 2z and 2y drafted, design-reviewed with the
  composer and approved; build order 2z→2y, never concurrent; 2x ID collision
  resolved. Both plans hardened for a cold implementer.
- **Day 10 (08-16), two concurrent sessions:** **2v MORPHING CHORDS complete**
  (D24–D26; six models, 101 tests; bend works ±1.99 st; *"we are already there —
  spoiled by riches"*) and the **2j PHASE-SHIFTING arc complete** (D27–D29; the
  two-family model; pitch beating verified predictive; the register law).
- **Day 9 (08-16):** DB3 orchestrated; **PLAN 2t DENSITY PIPELINE** shipped
  (D19–D23) — 251 → 160 notes at 0 hard / 0 soft, placed as **piece-s16**; 2w
  gesture bank + recall; labels-never-render bug fixed (Principle 4).
- **Day 8 (08-16):** collision avoidance end to end (**2r**), HARD/SOFT tiers
  (D17), back-audit of all 164 scores clean (**2s**); `AI_METHODOLOGY.md`
  adopted as governing (D18); `NITS.md` opened.
- **Day 7 (08-16):** the CLUSTER SANDBOX (**2p**) — 42 takes, piano-roll editor,
  lists + items (D14), velocity-not-CC7 (D12), `SESSION_HYGIENE.md`.
- **Day 6 (08-15):** the blast pipeline — piece-s09, Blast Sandbox + three-tier
  taxonomy (D11), the SAMPLE-LENGTH SURVEY → **D9**, the save system (D10).
- **Day 3 (08-12):** CRD remote listening; species {sine, expodec, surge}; the
  density arc → DB 044; containers begun (DB 045).

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

5. **A check that shares a formula with the thing it checks is a MIRROR, not
   a test.** A morph note's `bend` is relative to its played key; both
   `toScoreObjects` and `morph_emit.js` added the residual a second time, so any
   note whose onset sat off its key sounded out by exactly that residual —
   **measured at 40.2 cents** on a stock M2 spectral render. It survived a whole
   day of work because `tools/morph_probe.js` computed its *expected* pitch with
   the same double-add, and so did the unit test. The day-10 result *"spectral
   targets land within 0.4 ¢"* was true — about the MIDI→audio chain — and could
   say nothing about the engine→MIDI step it appeared to bless.
   **Generalisation: where a convention is expressed in more than one place,
   assert the two ends AGAINST EACH OTHER, never each against a shared helper.**
   `test_morph.js` now pins `sounding cents === midi*100 + bend` in the engine,
   in the score object and in the emitted MIDI. *(2026-08-16, day 12; full
   write-up in `docs/NITS.md`.)*

6. **A GREEN SUITE IS EVIDENCE ONLY ONCE YOU HAVE SEEN IT GO RED.** 2x's texture
   engine passed **150 assertions on the first run** — and seed stepping was
   completely dead: the jitter PRNG used a hardcoded constant, so a RAIN texture
   rendered bit-identically at every seed, and R5's central identity-vs-draw
   question silently answered itself "same every time". No assertion covered it
   because none had been written to fail. **The fix is mutation testing: break
   the thing deliberately and confirm the suite notices.** Eight deliberate
   breakages (rounding, clamp headroom, D17 constants, lane blocks, seed stride,
   hocket order) were all caught; the two that were NOT caught were the useful
   ones — one was a genuine coverage gap (every corpus note sits at `level 7.5`,
   where several velocity scalings round to the same byte) and one was a **no-op
   mutation** (`toFixed(4)→(5)` on a grid whose values are already exact at 4 dp,
   proven over 200,000 values). **Generalisation: distinguishing "test gap" from
   "harmless mutation" requires measuring, not reasoning** — and a suite that has
   never failed is an untested test suite. *(2026-08-16, day 12, PLAN 2x.)*

7. **EXPLICIT-PATH STAGING PROTECTS OTHER FILES, NOT A SHARED ONE.**
   `git commit -- <path>` commits the **working-tree** content of that path, so a
   file two agents are editing in the same minute carries *both* edits into
   whoever commits first. Observed twice on `score/server.js` on day 12: 2y's
   `/api/actuals`, `/api/morphmodels` and `/api/actualplacement` routes landed
   inside 2x's Phase-1 commit (`4c1958e`), which had verified only that no
   *unexpected file* was staged. **Harmless here** — both halves were complete
   and everything worked — but two things follow. (a) A per-file "only my files"
   check is not sufficient; when a shared file is in play, read its diff before
   committing. (b) `git blame` on shared plumbing will attribute lines to the
   wrong plan, so trust the code and the plan docs over the commit that carries
   it. *(2026-08-16, day 12; noted from both sides.)*

## §4 Decisions

- **D41** *(2026-08-18, day 18)* — **The trance section is written with AI prompts
  and pasted console scripts; panels are not built for it.** Composer's call after
  2aa-2ac: "my attempts to build tools like panels have turned out to be very
  labor intensive and aren't lending the results." Consequences, all binding:
  (a) scripts are delivered **in chat as fenced code blocks**, not as files —
  the copy button is the delivery mechanism; (b) **one scratch score** (`aud`),
  overwritten by every paste, never incremented — CTRL+S already banks a
  timestamped keeper into `scores/versions/`, so a trail of files buys nothing;
  (c) scripts **FULL-clear** (`Composer.objects=[]`) and never tag-filter — the
  tag-scoped version was a real bug, since different scripts carried different
  tags and material silently accumulated across pastes; (d) scripts carry a
  `PROTECTED` regex and refuse to clear a real score. *Why:* the composer's
  constraint is their own time at the keyboard, not code volume. *Rejected:*
  more panel work; per-take file numbering.
  **Corollary on effort, stated by the composer and worth obeying:** object
  insertion/mutation is trusted and should NOT be re-verified; **label and
  overlay presentation must be measured before delivery**, because every
  presentation slip costs a fresh script and a paste cycle. The column-numbering
  work the same day proved the split — the note-building was right first time,
  the labels were wrong three ways.


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

- **D31** *(2026-08-16, day 12 — composer)* — **GESTURE SHAPES ARE BUILT
  BESPOKE, ONE MORPH AT A TIME; the engine is not fixed now.** After hearing
  2z's generic shape battery: *"Those aren't really working as auditory models,
  as sound models, but that's okay… So it's correct as an engine."* The
  mechanisms are individually correct and tested; what failed is the mapping
  from a mechanism to a sound — the dials are right, the preset SETTINGS were
  guesses. So: pick a morph, build a shape for it by ear until that gesture
  sounds right, save it, use it in the score, and **harvest the lesson**
  (`docs/SHAPE_LESSONS.md`, one section per shape, the "what was wrong" line
  being the valuable one). When enough lessons accumulate, the engine gets
  revisited — from evidence, with time, not now. *Why:* the composer needs
  morphs in the score against a Sept 4 deadline, and a top-down preset is the
  wrong UNIT — the unit is a specific gesture tuned by ear. *This is D6's
  reverse-engineering principle applied to shaping.* **Deliberately NOT
  diagnosed** (AI_METHODOLOGY rule 5): we do not yet know *which* aspect failed
  — timing, gain range against the D24 layer already swelling underneath, window
  lengths, or mechanisms that simply do not carry at ensemble scale. The bespoke
  builds ARE the evidence-gathering.

- **D32** *(2026-08-16, day 12 — PLAN 2y)* — **A RECIPE DIAL IS OFF UNTIL IT IS
  TURNED.** A recipe absent from `settings` is not applied; `resolveParams`
  returns the base params untouched, and the panel's sliders carry an explicit
  on/off. *Why it is load-bearing and not a preference:* 2y's own worked example
  has *"more dramatic"* defaulting to 0.35 over a base whose `depth` is 1, so a
  panel that applied defaults on open would have silently rewritten material the
  composer had blessed **the moment they looked at a model**. It also makes
  `recipeSettings` in an actual's provenance mean exactly "what was turned",
  which is what makes an actual re-derivable. *Rejected:* seeding each dial's
  default to the value that reproduces the base (only works for single-path
  recipes, and hides the question instead of answering it).
  **Corollary — an ACTUAL is a render the composer DECIDED**, so the shelf ships
  empty: seeding it with renders nobody listened to is the same failure the MA1
  boundary gate exists to prevent.
- **D33** *(2026-08-16, day 12 — PLAN 2x)* — **TEXTURE ACTUALS LIVE IN A PARALLEL
  STORE, `bank/texture_actuals/`, not in 2y's `bank/actuals/`.** The 2x plan
  (§12, §15.9) expected to share that directory under distinct `ACT-` prefixes.
  *Why that turned out to be unsafe:* 2y's `tools/model_bank.js --validate` walks
  **every** file in `bank/actuals/` and requires each one to (a) name a model
  present in `bank/morph_models.json` and (b) satisfy
  `Morph.toScoreObjects(notes) === objects`. Both are morph-shaped **by design** —
  that integrity check is the whole point of their store. A texture actual
  satisfies neither, so filing one there would have turned a shipped, currently
  `VALID` tool red over a file it was never written to describe. Parallel stores
  are also exactly what §15.9 already requires for the model stores themselves
  (`texture_models.json` vs `morph_models.json`), so this is the same rule applied
  one level down. The schema mirrors 2y's key-for-key wherever a key means the
  same thing, so the two can be merged later by whoever decides they should be.
  *Rejected:* (1) teaching 2y's validator to skip foreign actuals — it is their
  file and it was being actively edited; (2) giving texture actuals a fake
  morph-shaped `notes` array to satisfy the integrity check — that check would
  then be asserting nothing, which is worse than not running it.
  **Corollary:** `notes` is deliberately ABSENT from the texture ACTUAL schema. A
  morph actual stores it because audition plays envelopes the score objects do not
  carry; a texture note **is** the score note (D29 — no bend, no envelope), so a
  second array could only ever drift from the first. Reasoning is recorded in
  `bank/texture_actuals/README.md`, a test asserts 2x never writes a 2y path, and
  2y's validator was re-run after every write and stayed `VALID`.

- **D34** *(2026-08-17, day 13 — composer)* — **NOTES ARE WRITTEN AS THE WORK
  HAPPENS, FOR TWO READERS: the next cold session, and the paper.** Composer:
  *"I am clearing the chat window often… but also, more specifically, for a
  paper. So collecting journal and experimental notes — so when we sit down to
  write the paper, we have the process documented."* This is a **standing
  instruction, never re-asked**: the AI files at the moment of the verdict or
  the measurement, not at a wrap, and captures quotable composer verdicts
  **verbatim before starting the next render**. *Why it is a decision and not a
  preference:* an unrecorded listening verdict cannot be re-run — the ear that
  produced it has moved on — so the loss is permanent, not deferred. **Filing
  contract (one destination each, no double-drafting):** RUNNING_LOG = the raw
  chronological trail · COMPOSER_LOG = verbatim words · SHAPE_LESSONS = one
  bespoke shape end to end · PAPER_NOTES = the distilled argument, entered only
  once a finding supports a claim · MORPH_FINDINGS = measured morph facts ·
  §4 here = decisions · NITS = real-but-not-now. Written into
  `docs/AI_METHODOLOGY.md` ("Capture as you go") with a fifth item added to its
  self-check. *(Filed as D33 first; renumbered to D34 at session end — the
  concurrent 2x session had already taken D33 for the texture actuals store.)* *Rejected:* a single combined notes file (the raw trail and the
  argument have different readers and different lifetimes — merging them makes
  the trail unciteable and the argument unreadable).

- **D35** *(2026-08-17, day 13 — composer)* — **THE AI DOES NOT IMPLEMENT
  ANYTHING WITHOUT AN EXPLICIT GO.** Composer: *"please check in with me before
  implementing anything or wait for me to ask you explicitly to implement."*
  Proposals, specs and measurements: yes, freely. Edits to code: only on a
  direct instruction. *Why it was needed:* this is a **restoration**, not a new
  rule — `HOW_WE_WORK.md` already said "conceptual proposal before any code
  edit", and over one morning it had eroded into fix-it-as-you-see-it, which is
  how a session about composing became a session about the panel. The companion
  practice is `docs/FEATURE_REQUESTS.md`: requests are collected and spec'd for a
  batch pass rather than built as they arise.

- **D36** *(2026-08-17, day 13 — PLAN 2q, PARTIALLY SETTLED, see the caveat)* —
  **CC7 ALONE DOES NOT GOVERN LOUDNESS ON SI2: NOTE-ON VELOCITY CONTRIBUTES.**
  Evidence: with the engine made to open a fade at level 0 → **CC7 = 0**, the
  composer still heard an attack. If CC7 alone governed loudness, CC7 = 0 would
  be silence. Consistent with **D12**, which chose velocity in the cluster
  sandbox because *"velocity is what the meter shows"*. Consequence wired in: a
  note opening below the engine's 0.4 level floor — which happens only inside an
  attack window — takes a proportionally softer velocity, floored at 1.
  **⚠ THE CAVEAT IS LOAD-BEARING AND THE COMPOSER DISPUTES THE DIAGNOSIS:** they
  report that playing four or eight ordinario notes from a keyboard produces **no
  attack at all**, which the velocity story does not explain. **So the blip is
  NOT diagnosed** (AI_METHODOLOGY rule 5) — what is established is only the
  negative, that CC7 = 0 is not silence. The positive cause is open, most likely
  somewhere in the generated-MIDI → Reaper → UVI chain rather than in the engine.
  See §6 and `docs/NITS.md`.
  **ADDENDUM (2026-08-17, day 14 — blip RESOLVED, and it dissolves this
  decision's evidence.** The blip was CC7 **timing**: the opening CC7 = 0 had
  only ~2–5 ms of real lead, so a sampler that smooths CC7 still had the channel
  near the stop()-restored 127 when the note spoke. Fix (250 ms cold-attack
  lead + CC7 restore delayed 2 s past the tail) → composer: *"Blip gone."*
  Consequence for D36: "an attack at CC7 = 0" is explained **without** velocity
  governing loudness — the channel was not actually at 0 yet — so the inference
  "velocity contributes on SI2" is **unsupported again**, not disproven. D12's
  cluster-sandbox evidence stands separately; **PLAN 2q's one-pitch listening
  test (velocity 30/70/127) is still the decider.** The emit layer's velocity
  scaling inside attack windows stays — harmless either way. See
  `MORPH_FINDINGS.md` "The CC7 timing law".)*

- **D37** *(2026-08-17, day 16 — PLAN 2aa)* — **A RECALLED SONORITY CARRIES ITS
  ARTICULATION, NOT JUST ITS PITCHES.** Any path that resolves a banked sonority
  by reference resolves it with the per-note technique rule the blast inserter
  already uses: a pitch in `cuivreConverted ∪ cuivreAdded` → `cuivre`, otherwise
  its `artic` entry. *Why:* **five of the composer's seven staccato /
  staccato-cuivre pairs have IDENTICAL pitch sets** — S020/S023, S026/S029,
  S032/S035, S038/S041, S044/S047 — so a pitches-only recall makes half of a
  menu into byte-identical duplicates, and the mock-up plays them without a
  clue that anything is wrong. *Rejected:* 2aa v1's own instruction ("technique
  `staccato`", one technique for the whole pass), which is what exposed this.
  *Measured in the running app:* S044 → six notes on ch 4 (`tubaNb`, staccato);
  S047, the same six pitches → three on ch 4 and **C4/C#4/D4 on ch 5** (cuivre).
  Generalises past 2aa: the same trap waits in any future recall path (v2's
  write-to-score, a notation export) that treats a sonority as a pitch list.

- **D38** *(2026-08-17, day 16 — PLAN 2aa)* — **A LOOPED AUDITION SCHEDULES THE
  NEXT CYCLE AHEAD; `MorphEmit.play` IS FOR ONE-SHOT RENDERS.** `E.play` shifts
  its whole schedule by `CC_LEAD_MS` (250 ms) and calls `panic()` on entry, both
  of which are right for a single morph render and fatal for a loop: re-invoking
  it per cycle opens a **250 ms hole at every seam — more than half a beat at
  130 BPM**. *Rejected:* (a) re-invoke at span, the hole; (b) re-invoke at
  span − 250 ms, which closes the hole but panics over the last column's still
  ringing one-shot — and whether a note-off truncates a fixed sample is exactly
  PLAN 2o's open question, so it would have been a fix built on an unknown;
  (c) batch N cycles per call, which only makes the stumble rarer. *Adopted:*
  cycles laid down `LOOKAHEAD_MS` (400) ahead against one absolute time base,
  nothing stopped and restarted — the `texture_panel.js` precedent for this
  material class. **`panic()` stays the single stop path**: every timer is
  pushed into `E._timers`, and fired cycles are pruned so the array cannot grow
  without bound. *Measured over 4.5 cycles at a nominal 250 ms step:
  240/250/260 ms throughout, the seam indistinguishable from any other step.*

- **D39** *(2026-08-17, day 17 — PLAN 2ab)* — **A PANEL SNAPSHOT'S `state` IS
  OPAQUE TO THE SERVER, AND ALL PANELS SHARE ONE FILE.**
  `bank/panel_snapshots.json` stores, per panel, whatever that panel's own
  `save()` writes to localStorage — byte for byte, never validated, never
  interpreted. An unknown panel key is CREATED on first save rather than
  rejected. *Why it is a decision and not a detail:* it is what made 2ac cost
  **zero** server lines, and it means a panel can change its state shape without
  touching the server or the file's contract. *Corollary that is also load-
  bearing:* the state is **deep-copied** on the way in, because the caller is a
  live browser object that keeps mutating. *Rejected:* a per-panel schema (a
  new panel would need a server edit, and every shape change becomes a
  migration) · storing snapshots under `scores/` (sandbox state is not score
  objects, and the 5 s autosave has clobbered a loaded score before — D8).
  *Second corollary, proven in the running app:* the same file is the **AI-dial
  channel** — a snapshot the AI writes while a panel is open appears on the next
  `Load` with no page reload.

- **D40** *(2026-08-17, day 17 — PLAN 2ac)* — **IN A MULTITEMPO TEXTURE, LANE =
  STREAM. AND THE ONLY THING THAT CATCHES THE ALTERNATIVE IS A TEST.**
  Each tempo stream belongs to one player for the whole cycle; the pulse strip's
  per-NOTE round-robin cursor (`pulse_seq.js` `buildGrid`) is correct there and
  wrong here. *Why it earns a decision:* copying the cursor produces a texture
  that is **completely plausible by ear** — a wrong-but-regular pulse still
  sounds like a pulse — so neither listening nor reading finds it. It was caught
  because the plan's own traps block named it the day before and a mutation test
  was written for it. **Generalisation for the remaining builds: when a rule's
  violation would still sound musical, it needs an assertion, not an audition.**
  *(Same family as Principle 5 — a check that shares a formula with the thing it
  checks is a mirror; here, a check that shares an EAR with it is too.)*

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
- 2026-08-16/17 — **PLAN 2x TEXTURE SANDBOX shipped, phases 0–4.** Pure engine
  extracted from the 2j generator with a **byte-identity gate on nine committed
  research scores** · `Texture` panel (five category MODELS, seeds, PIN/A-B,
  humanize, live badge, insert) · pitch layer with `tonality.js` extracted from
  clusterview (**400/400 randomised equivalence**) · breakpoint curves and
  category morphs whose endpoints match the static models within 1 % · parametric
  and literal pockets · `texture_bank.js` + `place_texture.js` with
  mutation-tested provenance integrity and a robustness gate that has no
  `--force`. **317 assertions.** Measured finding: the 23/s density ceiling is
  C3-specific and falls to ~19–21/s under any real pitch set.
  **Unheard — the listening slate in §6 is the remaining scope.**
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

- 2026-08-16 — **PLAN 2z GESTURE SHAPING COMPLETE** (day 12, gates G0–G5).
  Gesture-level ADSR gain over the D24 layer · entry/exit scheduling with
  cluster-safe dropout (beating thins by whole pairs) · edge technique,
  transient (hit-THEN-tone by D9 physics) and noise layer on spare lanes ·
  motion with **zero at each window's inner edge by construction** · Shape panel
  group. **331 assertions** (from 101); twelve G0 fixtures keep the blessed
  material byte-identical. App round-trip verified on shaped material.
  `docs/plans/GESTURE_SHAPING.md` §15 records where the code corrected the plan.
- 2026-08-16 — **A MEASURED 40.2-CENT PITCH ERROR IN THE MORPH OUTPUT, FIXED**
  in all four places that carried the wrong formula (engine conversion, emit
  layer, probe, unit test). Pre-existing since 2v. See Principle 5.
- 2026-08-16 — **PLAN 2y MODEL ↔ ACTUAL: MA0–MA3 COMPLETE** (D32). Model store
  seeded from the frozen day-10 audit record · `tools/model_bank.js` validator
  written FIRST and negative-tested against eight defects · recipe engine
  (endpoints + interpolation, only numbers lerp) · one shared save path for the
  CLI and the panel · `/api/actuals` routes · panel with MODELS / scratch /
  ACTUALs, bounded recipe sliders, seed stepper, Save as ACTUAL and a browser.
  Full loop verified in the running app. **MA4 (the composer's naming/blessing
  session) is the only gate outstanding.**
- 2026-08-17 — **PLAN 2aa v1 PULSE SEQUENCER STRIP shipped** (the trance
  section's sandbox): `Pulse` panel in the composer score, a 29-entry sonority
  menu in `bank/pulse_palette.json` resolved live against the taxonomy, a pure
  grid→notes engine (`pulse_seq.js`, 103 assertions, mutation-tested) and a
  seamless real-time loop. **Audition only — it writes nothing to the score.**
  Two rulings came out of building it: **D37** (a recalled sonority carries its
  articulation) and **D38** (a looped audition schedules ahead). *The sound is
  unheard — the composer's audition is the open half.*

- 2026-08-17 — **PLAN 2ab PANEL SNAPSHOTS shipped**: named panel states in
  `bank/panel_snapshots.json` via `GET/POST /api/snapshots`, a pure merge module
  (`score/snapshots.js`, 75 assertions, mutation-tested), `Save`/`Load` on the
  pulse panel. **Verified across a wiped localStorage plus a browser reload**, so
  the state provably came back from the server file. → **D39**. It is also the
  AI-dial channel the other two panels use.
- 2026-08-17 — **PLAN 2ac MULTITEMPO AUDITION RIG shipped**: the `MT` panel —
  several tempi at once from one BPM and a reduced integer ratio set, with
  UNISON / REGISTER / HARMONY separation modes and the shared onsets highlighted.
  Pure engine `multitempo.js` (90 assertions, four mutation tests). **Measured
  live: C = 1.2 s at 150/3:4:5, the streams realign on C, 2C and 3C, and the loop
  seam is indistinguishable from an ordinary step.** → **D40**. *The sound is
  unheard — the composer's audition is the open half.*
- 2026-08-17 — **PLAN 2ad PHASE-SHIFT SELECTOR readied with ZERO code**: its one
  conditional item proved unnecessary (the Texture panel already polls every
  second and honours `active` on a rev bump — verified live), the A/B/C slate is
  already SMEAR/RAIN/GALLOP, and the banking CLI was run end to end and reverted.
  **Waits only on the composer's ear.**

## §6 Human Notes

- *(2026-08-19, day 19)* **NEXT SESSION STARTS HERE — the phase-shifting
  machine.** The composer named it explicitly at session end. It needs no code:
  `Texture` button, A/B/C are SMEAR / RAIN / GALLOP, the panel polls every second
  so an AI edit lands with no reload. **Answer one question by ear: are they
  distinct?** The measured prediction on record — RAIN and GALLOP have nearly the
  same jitter (sd 30.7 vs 32.3 ms) but very different unevenness (0.14 vs 0.68);
  if they sound alike they are one category with two labels. Then say what you
  want more or less of and the AI edits the slate.
- *(2026-08-19, day 19)* **Two things owed to your ear on the trance section:**
  whether a PAIRED stream reads as one line split between two players or as two
  players who coincide (the whole notation scheme rests on this), and whether the
  15 identical chords closing `aud-11` are too static.
- *(2026-08-19, day 19)* **A trap worth knowing while you bank chords:** the
  staccato patch sounds only MIDI 30-65, and seven of your `more chords` species
  contain a 66 or 68 that renders silently. The generator folds them into range;
  **the Insertion strip does not.** A range warning at bank time is un-built.


- *(2026-08-17, day 17)* **THE PHASE-SHIFT SITTING IS SET UP AND WAITING — it is
  the day-12 texture slate, now with the path around it verified.** `Texture`
  button; A / B / C are already the SMEAR / RAIN / GALLOP references. Play the
  three and answer one question: **are they distinct by ear?** Then say what you
  want more or less of — the AI edits the slate and the panel lands on it within
  a second, no reload (verified). Bank a keeper with
  `node tools/texture_bank.js --bank <NAME> --from <variant> --survives yes|no
  --note "<plain ASCII — the shell mangles em-dashes>"`.
  **The measured prediction to test first:** RAIN and GALLOP have nearly the
  same jitter (sd 30.7 vs 32.3 ms) but very different unevenness (0.14 vs 0.68).
  If they sound alike, they are one category with two labels and the models
  should merge. Either answer is a result. *(This supersedes the day-12 slate
  note below as the entry point; that note still holds for items 3-5.)*

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
  raised again unprompted. (2) **D29 (2j/2v scope split): CONFIRMED by the
  composer day 11 and held throughout the 2x build** — 2v owns everything
  bend-based including pitch beating; 2x is attack fields only, and a test
  asserts no bend field appears anywhere in its output. **Closed.**
- *(2026-08-16, day 10 — 2j)* **Push policy changed (D30):** either agent pushes
  automatically after its own commit, staging explicit paths only. You should no
  longer have to track who owes a push. **Day-12 note on how that actually
  played out:** the other agent staged `score/server.js` while a 2y edit of mine
  was in flight, so my `/api/actuals` routes landed inside *their* commit
  (`4c1958e`). Harmless — the commit is complete and everything works — but
  explicit-path staging does not protect a file two agents are editing at the
  same minute. Nothing to fix; worth knowing when reading git blame.

- *(2026-08-16/17, day 12 — PLAN 2x)* **THE TEXTURE LISTENING SLATE IS YOURS, and
  it is the entire remaining scope of 2x.** Nothing in this build has been heard
  by anyone — Web MIDI is denied in the preview pane, so every claim in the plan
  doc is a *data* claim. `node score/server.js` → `Texture` button, beside Morph.
  In the order I would do it:
  1. **SMEAR vs RAIN vs GALLOP** — are the three distinct by ear? Quick, and it
     validates the whole vocabulary the recipes are built on.
  2. **`H` on SMEAR, then `H` on RAIN** — the humanize A/B. This is the
     fragile/robust prediction's **first real data point** in the whole arc
     (stage ±15 ms fixed + human ±25 ms per attack, both ESTIMATES). Prediction on
     record: rain survives, smear converts into rain for free.
  3. **Pitch** — which set is the keeper, and does pitch dissolve the accent
     artefacts (E5's expectation)? Note the measured surprise first: the ceiling
     you calibrated at unison C3 drops ~18 % under any real set.
  4. **`node tools/phase_shift.js --process dissolve`** — does `rain → stutter`
     still SNAP? phase06 heard it; a metric can show a discontinuity but not
     whether the ear jumps.
  5. **`--process crossover`** — where does a groove stop being parseable and
     become texture? §5's open question; the answer goes back into
     `bank/texture_models.json` as data and updates TICKS/GROOVE.
  Each verdict has a slot waiting for it — `tools/texture_bank.js --bank <NAME>
  --from <variant> --survives yes|no --note "..."`. **Until then all five models
  read `UNHEARD` and refuse to be banked as keepers.** Nothing needs rebuilding
  to record one.
- *(2026-08-16, day 12)* **MA4 is yours, and it is the only gate left on 2y.**
  (1) Rename the six placeholder model ids — cheap now, expensive once actuals
  reference them. (2) Bless or edit the recipe slates and their boundaries.
  (3) Make the first real actuals and place them. `node tools/model_bank.js
  --list` shows the store; the panel's MODELS tab is the loop.
- *(2026-08-16, day 12)* **Re-hear the six models before you name them.** They
  were auditioned on day 10 through two bugs since fixed — pitch out by up to
  40.2 ¢ on off-key onsets, and the panel feeding one variant's dials to
  another. The material is good and you liked it; what was unreliable was any
  **comparison between them**. Each model carries this note in its `notes` field.
- *(2026-08-16, day 12)* **The ACTUALs "hear" button has never made a sound.**
  Its data path is verified — the emit layer gets the stored notes
  byte-identical, every note resolves to a lane, envelopes intact — but Web MIDI
  is denied in the preview pane, so it needs one press in your own browser.
- *(2026-08-17, day 13)* **THE BLIP IS YOURS TO CALL, and it is not diagnosed.**
  Three real engine causes were found and fixed (opening CC7 went 24 → 0, CC7 now
  has lead at t=0, velocity scales inside an attack). It persists, quieter. Your
  counter-evidence — a keyboard-played chord has **no** attack — is not explained
  by any of them, and my diagnosis was not reliable enough to act on. Full
  write-up and the next places to look are in `docs/NITS.md`; **the one control
  nobody has run is a generated `.mid` played in Reaper against the same notes
  played live**, which separates the chain from the engine in a single test.
- *(2026-08-17, day 13)* **To hear the attack without the blip:** the
  recommendation on the table when the session ended was to render several fade
  lengths **end to end into one `.mid`** (via the existing `tools/midi_out.js`)
  and audition them in Reaper. Not built — say the word.
- *(2026-08-17, day 13)* **`ACT-BLOOM-01` is stale.** It was saved a moment before
  the reload that carried the save fix, so it kept your sliders
  (`slower / longer 0.76`, `more dramatic 0.55`, seed 11, pace 48) but not the
  duration, the release or the attack. Re-save as `-02` and delete it; the model
  file's `actuals` list references it too.
- *(2026-08-17, day 13)* **Penn State is 15 minutes maximum** — recorded from your
  reading of the call. With 3–5 morph objects planned, a 5-minute one is a third
  of the piece; worth deciding their lengths against the whole before building
  more.
- *(2026-08-16, day 12)* **The bespoke-shaping loop starts whenever you want it**
  (D31): pick a morph, describe the shape in your words, AI writes the `shape`
  block, you listen, we correct, AI files the lesson to
  `docs/SHAPE_LESSONS.md`. The "what was wrong" line is the one that matters —
  a shape that works first time teaches nothing.
