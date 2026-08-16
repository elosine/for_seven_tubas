# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**Day 2 (2026-08-11):** the calibration day — Penn State research (deadline **Sept 4, 2026**); 10-part expansion, floating META window, grain suite, Roads env catalog; LAW L4 + anti-clump machinery + **RECIPE MAXDENSE-1** (DB 035); finding 14; grain-type pass opened.

**Day 1 (2026-08-10, compressed):** stack seeded from piece #3 · SI2 roster,
dual-port D2 · CC7 law + gain staging calibrated · research arc: laws L1–L3,
Xenakis rules X1–X8, the swell-cloud species (peak-cut = attack) · SC4 dense hold
approved provisional.

**Orientation for a cold session:** RESEARCH_INDEX.md (map) → CURVE_DATABASE.md
(laws L1–L4, entries 001–036, MAXDENSE-1) → ENGINE_FRAMEWORK.md (the method) →
COMPOSER_LOG.md (verbatim). Server: `node score/server.js` (:5200). Score archive
in the Load dropdown.

**Day 3 (2026-08-12):** CRD remote listening live; species settled {sine, expodec, surge} with the standing mix; **THE DENSITY ARC → DB 044** (finding 15 count-regime law, apex-scramble fix/peak-anchored law, accelerando scheduler, one-dial curve re-centered, level-carries-climax, RECIPE BUILD-1); containers begun (DB 045); NAMING.md adopted.

**Session end (2026-08-13, day 4):** piece assembly began (piece-s01->s07c, movable META group shapes via groupId); harmony palette + pairing ledger; GESTURE-2 banked + compression study; the cressand research (rise-as-nucleus, 26.5 dB clarity margin, margin-solved tapers, `cressand-family`); ostinato engine ported from piece #2 (`ost01-variety`); app safety (Clear-All forks, no-store + buildTag, cuivre C-key palette).

**Session end (2026-08-16, day 7 - the CLUSTER SANDBOX):**
- **`/clusterview.html` shipped** - the second sandbox, built, rebuilt once, and
  hardened. **42 played clusters imported** (CLUST01 + carves, CLUST02, CLOUD02
  A-L, GESTURE-1/2 as DENSITY) plus in-app **recording** with live MIDI thru.
- **Piano-roll editor:** notes are duration BARS at true sounding length, piano
  gutter, zoom (+/-/fit, ALT-wheel, wheel-pan), playback cursor, audio-editor
  transport (click = cursor, drag = select, SPACE = play/stop, HOME = zero).
  Per-note editing: move pitch/time, drag length, cycle articulation, add,
  delete, velocity by arrows or type-in.
- **Non-destructive transforms** (a PREVIEW over the stored notes, never a lock):
  time-stretch 0.25-10x on a LOG slider, tonality remap (15 palette sets + all 33
  chords) with **pooled** mode and a **no-repeat kick**, reverse, octave-fold,
  thin, velocity.
- **PRESET MODEL (rebuilt on composer feedback):** the snippet/gesture split is
  gone. **Lists + items** - pick a list, click an item to load, edit it
  (autosaves back), duplicate for a variant, delete to remove. New items come
  from the play window or from what you hear. Composer-score strip gained a
  **source menu (Blasts | Clusters)** reading these lists.
- **CUIVRE is variable-length** (PLAN 2o): a player can cut one short, so the
  measured 0.99-1.35 s is a ceiling, not a floor. fp/staccato stay fixed.
- **LOUDNESS = NOTE VELOCITY** (composer's call): CC7 removed from the per-note
  path, pinned full once per port. *Note this contradicts the composer score,
  which drives dynamics from CC7 with a 150 ms pre-arm - see Open below.*
- **`docs/SESSION_HYGIENE.md`**: measured burn (4,854 turns, 2.42 B tokens of
  context re-read, ~499 K carried per turn - output is not the cost), the
  `/session-end -> /clear -> /session-start` cycle, model strategy (design with
  Fable, implement with Opus **from a written plan**), and seven sandbox lessons.

**Open at session end (2026-08-16):**
- **Velocity vs CC7 is UNRESOLVED as a system question.** The cluster sandbox now
  sends note velocity only; the composer score sonifies via CC7 (`PREARM_S=0.15`,
  "settle CC7 before the attack"). If SI2 turns out to be velocity-insensitive,
  sandbox dynamics will not survive into the score. **Test before trusting either:**
  play one pitch at velocity 30/70/127 and listen.
- **CG001/CG002 were flattened to all-127** by storing at 200 % when boosting
  still clamped. The bug is fixed (proportional cap); the two items are not
  recoverable - re-derive from the SN1 material now living as CG005 in `unsorted`.
- `piece-s09` unchanged today (88.5 s, four INT2 blasts). INT2 assembly resumes
  there; the texture arc (spaced -> overlapping counterpoint) is still to be built.
- Still queued: `ost01-variety` unheard - cressand-family / cressand-pitches
  verdicts - quarter-tone mapping test (gate for the morphing crescendo, PLAN 2l).

**NEXT SESSION, FIRST THING:** `/clear` then `/session-start` (see
SESSION_HYGIENE). Then either (a) settle the velocity-vs-CC7 question with the
one-pitch listening test above, or (b) go straight to placing INT2 material in
`piece-s09` - blasts plus the cluster items now insertable from the strip.

**Day 6 (2026-08-15):** the blast pipeline end to end - piece-s09 shipped (88.5 s,
INT2's first four sonority blasts); Blast Sandbox + the three-tier taxonomy (48
sonorities, "INT2 blasts" = 47); insertion strip; the SAMPLE-LENGTH SURVEY (fp
1.35-2.22 s, cuivre 0.99-1.35 s, staccato 0.33-0.53 s, all FIXED one-shots) and
the rule it produced - **only ORD is a real duration**; the save system (Piece vs
Scores menus, working copies, Save-as-next, Variant, Restore); PAPER_NOTES opened.

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

## §5 Done

- 2026-08-10 — 0a stack seed.
- 2026-08-10 — Gain staging calibrated; CC7 law measured; cresc lengths DB.
- 2026-08-10 — Crescendo research arc: laws, Xenakis rules, swell-cloud species;
  **SC4 dense hold approved (provisional)**.
- 2026-08-11 — 10-part expansion + UI batch + Roads catalog + engine framework.
- 2026-08-11 — **Pass 2 complete**: L4 carved, MAXDENSE-1 recipe adopted (DB 035),
  finding 14; five live calibration cycles (OC, DH1–DH5).

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
  the answer.

