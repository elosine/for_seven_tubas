# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**SESSION END (2026-08-16, day 9 — DB3 + the DENSITY PIPELINE, Claude Code):**
- **DB3 recorded and orchestrated.** The composer played it in on one lane
  (`scores/densBld03-take1.json` — 251 notes, 21.9 s, all staccato, G1–G4).
  Its apex demands **54.5 attacks/s**; ten tubas holding a ~0.45 s staccato
  one-shot can render **~22/s**. The mock-up cannot reveal that (2r), so it had
  to be computed.
- **PLAN 2t DENSITY PIPELINE shipped** — the reusable process, playbook in
  **`docs/DENSITY_PIPELINE.md`** (read that first; it has the worked example,
  every knob and what it costs, and section 6 on getting a build into the piece).
  Five tools: `pack_take.js` (pack-to-ceiling), `artic_pass.js` (the fp arc),
  `build_versions.js` (versions end to end in one file), `tonality_variants.js`,
  and `audit_playability.js --parts`. Plus **leap-aware `assignCluster`** in the
  app. Decisions **D19–D23**.
- **Result:** 160 of 251 notes kept, **0 hard / 0 soft**, everything before 18 s
  identical to what was played, 91 deleted all between 20.0–23.1 s. Per player:
  peak 2.0–2.5 attacks/s, tightest pair 0.43 s — 2–4× clear of D17's own
  estimated limit, so the estimate would have to be wrong by >2× to matter.
- **Two real bugs found by testing in the running app, not by inspection:**
  G-convert forced a 0.15 s overlap when a note had no room to swell back (always
  at an apex); and `build_versions.js` painted notes by section, which made the
  whole fortepiano pass invisible — the composer caught that one.
- **Everything is verified live.** The app's `assignCluster` returned
  135 hard / 10 soft / 3.13 st mean leap against the tool's 135 / 10 / 3.1 —
  exact agreement. Packed and variant scores load with the badge as predicted.
- **`docs/PAPER_NOTES.md` gains the DB3 CASE STUDY** — five stages with the
  measurement that forced each, six findings, and the division of labour
  (including that the AI's first design was worse than the composer's).

**Open at session end (2026-08-16, day 9) — all of it is "go listen":**
- **NOTHING HAS BEEN HEARD YET.** Two scores are waiting, both load-and-play:
  `densBld03-arc-v2` (5 stages: as-played · unpacked · packed · fp mix · your
  copy — 122.8 s) and `densBld03-tonalities` (9 harmonies — 224 s; ORIGINAL and
  **Messiaen m3 on F** are the only two with zero flags).
- **Section E of `densBld03-arc-v2` is the composer's to edit** — grain
  envelopes. **G** = selection → surge crescendos (peak-anchored, back-filled by
  lane availability). **C** = cuivre. **P** = property panel (it is on demand,
  not on selection — that is the 2026-08-13 decision, not a bug).
- **THE APEX DECISION IS STILL OPEN** and it is the fork: zero conflicts cost 91
  notes, all at the apex. Alternatives are more players (mandate M1) or
  converting the apex to sustained material so overlap becomes the point.
- **DB3 cannot reach DB1/DB2's ~21 % fortepiano** — its sparse region is ~11 s
  of a 23.5 s build and fp needs 1.35–2.22 s of a free player. Physics ceiling is
  18 notes (11 %); currently 12. Not a bug, a property of this gesture.
- **PLAN 2u (tonality sub-menu) is spec'd, not built.** The remap engine already
  exists in the cluster sandbox — it is a surfacing job.
- Carried, all still deferred by the composer: META shape overhang (NITS) ·
  velocity-vs-CC7 (2q — does NOT touch the insert path) · 42 soft flags in
  piece-s11/s12 · HARD-occupancy-uses-sample-length (NITS, opened today) ·
  `ost01-variety` unheard · cressand-family verdicts · quarter-tone mapping test.

**Day 8 (2026-08-16):** collision avoidance end to end (PLAN 2r) — occupancy
model, HARD/SOFT tiers (D17), conflict-aware insert, live wash, resolver with
move-to-another-player; back-audit of all 164 scores found nothing to redo (2s);
**`docs/AI_METHODOLOGY.md` adopted as governing (D18)**; `docs/NITS.md` opened.

**Day 7 (2026-08-16):** the CLUSTER SANDBOX (`/clusterview.html`, 2p) — 42
imported takes + recording, piano-roll editor, non-destructive transforms,
lists+items (D14), velocity-not-CC7 (D12), `docs/SESSION_HYGIENE.md`.

**Day 6 (2026-08-15):** the blast pipeline — piece-s09 (88.5 s), Blast Sandbox +
three-tier taxonomy (D11), insertion strip, the SAMPLE-LENGTH SURVEY and the rule
it produced (**D9: only ORD is a real duration**), the save system (D10).

**Days 4–5 (2026-08-13/14):** piece assembly began (piece-s01→s07c, movable META
group shapes); harmony palette + pairing ledger; GESTURE-2 banked; the cressand
research; ostinato engine ported; NAMING.md.

**Day 3 (2026-08-12):** CRD remote listening; species {sine, expodec, surge};
**THE DENSITY ARC → DB 044** (finding 15, accelerando scheduler, RECIPE BUILD-1);
containers begun (DB 045).

**Days 1–2 (2026-08-10/11):** stack seeded from piece #3; SI2 roster + dual-port
(D2); CC7 law and gain staging; research arc laws L1–L3, Xenakis X1–X8, the
swell-cloud species; **Penn State research — deadline Sept 4, 2026**; 10-part
expansion, floating META window, grain suite, Roads catalog; **LAW L4 + RECIPE
MAXDENSE-1** (DB 035).

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

