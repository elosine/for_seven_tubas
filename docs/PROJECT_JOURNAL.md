# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**Last session:** *2026-08-11 (day 2, Claude Code) — the calibration day*
- **Independent batch:** Penn State research (**deadline Sept 4, 2026**; 10 parts
  + M1 fits the call) · 10-part expansion + floating META draw window + grain-edit
  suite + Roads env catalog (DB 027) · automation eval (AUTOMATION_EVAL.md; UVI
  deferred-until-bites; tuba 8–10 hardware now UP) · engine framework
  (ENGINE_FRAMEWORK.md: seeded renders, ladder batteries, span test, validated
  tweak analyzer).
- **PASS 2 COMPLETE (live sitting, OC→DH1–DH5):** LAW L4 carved (×2.75 category
  spacing; both-ends saturation; 4 duration categories) · anti-clump machinery
  (maxShortRun, short→mid conversion, run-breaking longs) · **RECIPE MAXDENSE-1
  (DB 035)** · finding 14 (apex-stack loudness) · keeper-excerpt practice.
- **Grain-type pass OPENED (PLAN 2c):** env-catalog regenerated at tier durs
  (0.8/2.2/4.5) · dh5a-pitchfields = unison/chromatic/quartal down one timeline,
  same seed (engine additions: `spec.t0`, `spec.notes`).

**Open at session end (awaiting composer listen):** env-catalog elimination pass
(8 shapes; per-shape tier calibration suspected) · dh5a-pitchfields verdicts
(mass identity off-unison? finding-14 × real intervals) · `surge` naming still
unconfirmed.

**Next up:** grain-type verdicts → envelope-species mix pass (sequence-alternation
hypothesis applies) · four-pass plan pass 3 (least dense — DH2 gap-distribution
hypothesis waits there) + pass 4 (gradations) · level-scatter A/B (finding 13) ·
P3 release-vocabulary session.

**Day 1 (2026-08-10, compressed):** stack seeded from piece #3 · SI2 roster,
dual-port D2 · CC7 law + gain staging calibrated · research arc: laws L1–L3,
Xenakis rules X1–X8, the swell-cloud species (peak-cut = attack) · SC4 dense hold
approved provisional.

**Orientation for a cold session:** RESEARCH_INDEX.md (map) → CURVE_DATABASE.md
(laws L1–L4, entries 001–036, MAXDENSE-1) → ENGINE_FRAMEWORK.md (the method) →
COMPOSER_LOG.md (verbatim). Server: `node score/server.js` (:5200). Score archive
in the Load dropdown.

**Session end (2026-08-12, day 3 — remote workflow + the density arc + containers):**
- **CRD remote listening LIVE** (REMOTE_AUDITION.md; whole day driven remotely).
- **Species settled for now:** kept {sine, expodec, surge}; standing mix
  {.70/.21/.09}, alt species short+mid tiers only; all CC7 (KS-sampled surge
  shelved as option); env research deferred.
- **THE DENSITY ARC (dens1–10) → DB 044:** finding 15 (count-regime law, fusion
  ceiling) · apex-scramble bug fixed (peak-anchored law) · accelerando scheduler
  (composer-designed) · one-dial curve RE-CENTERED to composer's ear · level
  carries climax (12b/13 resolved) · RECIPE BUILD-1 (provisional; dens10 unheard).
- **CONTAINERS begun (DB 045):** v1 Density Build stamp (dur + curvature
  diamond); cont-build-001 awaiting shaping; NAMING.md adopted
  (cont-* / piece-s* / archive).
- Per-part SOLO buttons; engine additions: anchor 'peak', accel{curve, ramped
  noiseSigma, levelRamp, levelCurve}, envMixRamp points, altTiersMax.

**Open at session end:** composer shapes cont-build-001 → AI fills via BUILD-1
(dur→span, curvature→accel.curve) — THE NEXT WORKING STEP · dens10 verdict
(levelCurve value) outstanding · piece-s01 assembly follows the first filled
container.

**Session end (2026-08-13, day 4 — "a very productive day": the piece begins + two texture families):**
- **PIECE ASSEMBLY LIVE (piece-s01→s07c):** opening + five gestures inserted, every
  gesture a **movable META group shape** (`groupId`: body-drag = move; edge node /
  green box / panel = time-scale members). Composer drags verified in the wild.
  Latest state: GESTURE-2 ×0.75 at 50 s reharmonized m6-on-F (s07c).
- **Harmony world:** palette + pairing ledger (GESTURES.md) — chord shortlist,
  BbE-2oct, four 7-note chromatic clusters, m7/m4 picks; pinned pairings B2×BbE ·
  M×5ths-30 · L2×spread; audition scores sl01/sl02, harmony-blasts, pairs01.
- **GESTURE-2 BANKED** (A2 take → A1 treatment → composer edits; #4E7A9B) +
  compression study (gest2-compress: uniform time-scaling, ×0.75/×0.5).
- **OVERLAPPING-CRESCENDO RESEARCH (cressand-01…17):** rise = the pulse nucleus
  (first-class dial) · **26.5 dB peak-to-bed margin calibrated from composer
  verdicts** · margin-SOLVED tapers · min-gap 0.44 pinned, backwards chain
  construction · compression floor found (chain D ≈ uniform pulse) ·
  **`cressand-family` = the reference** (7 chains) · `cressand-pitches` (7 pitch
  strategies incl. 11-pc tone row, Raga Bhairav 12-TET).
- **OSTINATO ENGINE PORTED from piece #2** (the played timing tables →
  bank/ostinato_timing_db_2p2p.json; curve-lookup algorithm in tools/ost_variety.js).
  **`ost01-variety` = 8-formation listening exercise** (quartet/sextet/ten,
  simultaneous waves at different speeds, accretive 2→10, decretive 10→2).
- **App safety day:** Clear-All forks to new name · save-name collisions
  auto-suffix · Cache-Control no-store + visible **buildTag** (b16-boxscale) ·
  cuivre palette (C key, hover-preview) · ALT-scroll zoom flipped · gest1-pitches
  RESTORED from git (autosave clobber caught).
- **Lesson banked (memory):** wire interaction features into ALL mutation paths
  (body/node/box/panel); off-grid values fingerprint which path the composer uses.

**COMPOSER NOTES (2026-08-14) — three items banked as PLAN 2i / 2j / 2k:**
- **2i counterpoint section:** long crescendos in the banked harmonies + the
  cressand accel chains + blast interjections + tremolo, against each other.
  Sketch: cres-on-chord → blast, blast → long accel chain with the chord
  round-robin/interspersed with tremolos · plus a pointillistic section with
  ordinario blasts **spatialized 1 → 10**.
- **2j tremolo notation & phase shifting:** sine-wave figure (peak/trough = which
  note), phase-shifted between players for real ensemble phase shifting;
  research the rapid-tremolo perceptual limit → alternating/interlocking
  strategy; irregular tremolos (ball tracing the wave / wave fill / both);
  **sine humps follow the human-sampled ostinato timing — irregular in TIME
  only for now.** This is the missing ingredient for 2i.
- **2k performance score:** robust group rehearsal mode (leader/follower not
  fragile) + a much clearer, simpler entry page. Port-plus-rework from piece #2.

**NEXT SESSION, FIRST THING:** listen to `ost01-variety` → narrow the ostinato
formations for the piece. Then: cressand-family / cressand-pitches verdicts ·
sl02 Messiaen adds after listening · composer may provide more ostinato sample
tables (interpolation/combination strategy = standing to-do) · piece continues
from s07c.

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
  record it).

