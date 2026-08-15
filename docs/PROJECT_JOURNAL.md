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

**Session end (2026-08-15, day 6 - the blast pipeline, end to end):**
- **piece-s09 SHIPPED (88.5 s)** - opening build - CLOUD02-I/D - fp + ord blasts -
  GESTURE-2 x0.75 (m6 on F) - and INT2's first four sonority blasts: S009 ch03 V2
  (81.75) - S035 ch13 V2 (84.61) - S047 ch28 V3 (85.38) - S010 ch03 V2 (86.58).
  First piece save promoted through the new working-copy flow.
- **BLAST SANDBOX** (`/chordview.html`), built end to end: strip of all 33 chords
  (arrow-step + auto-hear), version menu as the pivot, click-to-edit keyboard,
  always-on cuivre layer distinguishing added vs converted, per-note articulation
  (dot-cycling) + C1/C2 mix slots, zoom presets, real per-player Web-MIDI audition.
- **THE THREE-TIER TAXONOMY IS LIVE** (`docs/TAXONOMY.md`, `bank/blast_taxonomy.json`):
  chord -> voicings (V-numbers, PITCH SET only) -> sonorities (S-numbers: voicing +
  per-note articulation + cuivre + length + dyn, content-deduped) -> named custom
  lists. **48 sonorities; "INT2 blasts" = 47.** Cuivre is CHORD-level articulation,
  never a voicing change; manual thinning is stored as that voicing's cuivre
  arrangement. Chord SUBSETS filter the strip without touching the main 33.
- **INSERTION:** Blasts strip in the composer score (list menu, mini-keyboards
  labelled by CHORD number, description readout, arrow-stepping, audition) ->
  insert at the playhead as a 10-part group + META shape built at insert time.
  Blast shapes are orchid #C452B5 (three greens on the META lane were unreadable).
- **SAMPLE-LENGTH SURVEY - the day's research result.** Probe + analyzer, 80 notes,
  0 silent, drift <= 30 ms. **fp, cuivre and staccato are all FIXED one-shots**
  with the multisample sawtooth the cresc patch showed: fp 1.35-2.22 s, cuivre
  0.99-1.35 s, staccato 0.33-0.53 s (`docs/SI2_oneshot_lengths.md`,
  `docs/SI2_staccato_lengths.md`; tables in `bank/sample_lengths.json`).
  **Consequence, wired into insert + playback + all three group-scaling paths:
  ORD is the only real duration** - fixed articulations take their true sample
  length and are IMMUNE to stretching (they translate, never scale). Inserted fp
  blasts had been drawn at 3.0 s while the sound died at ~1.7 s. (PLAN 2n)
- **SAVE SYSTEM reworked:** Piece menu (piece-*, natural-sorted) vs Scores menu;
  **working copies** protect the canonical piece from autosave (the boot path was
  writing straight into the piece file - fixed); "Save as next" promotes; "Variant"
  saves lettered siblings; "Restore" surfaces the version snapshots; the session
  field colour-codes protected vs direct edit.
- App fixes: group-aware delete (a META shape takes its parts with it) - blast
  strip layering (was rendering behind the lane container) - strip pushes the
  score down instead of covering it - ALT-scroll zoom direction - time/zoom
  readouts retired into the floating bubble (hover = px/s, double-click = reset).
- **Paper:** `docs/PAPER_NOTES.md` opened - title **"Composition by Kobayashi"**
  + 6 subtitle candidates, the Kobayashi thesis (bespoke reframing of materials),
  the six-pass method, deferred notation, and the stance on AI (not the headline:
  fluidity + transparency). Verbatim dictation in COMPOSER_LOG.
- **PROJECT PLANNER** (`docs/PLANNER.md` + `/planner.html`): the collapsible
  sieve - section -> container -> gesture -> decisions, to-dos per tier, NOW
  breadcrumb. Check it FIRST for "what now / what next".

**Open at session end (2026-08-15):** INT2 continues in **piece-s09** - four
blasts placed, the section's texture arc (spaced articulations -> overlapping
counterpoint) still to be realised; pointillistic clusters chosen but not placed;
the morphing crescendo not started (its gate is the quarter-tone patch mapping
test, PLAN 2l). Blast reorchestration is by AI prompt, by design - nothing built.
`ost01-variety` still unheard; cressand-family / cressand-pitches verdicts still
outstanding; sl02 Messiaen adds pending a listen.

**NEXT SESSION, FIRST THING:** open `piece-s09` from the Piece menu (it opens a
protected working copy) and keep placing INT2 material - more blasts from the
"INT2 blasts" list plus the pointillistic clusters - then shape the texture arc.
Queued behind it: listen to `ost01-variety`; cressand verdicts; the quarter-tone
mapping test that unblocks the morphing crescendo.

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
  state; nothing is half-written.

