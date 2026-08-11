# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**Last session:** *2026-08-10 (day 1, Claude Code — one long day, multiple arcs)*
- **Setup arcs:** stack seeded from piece #3 (7-track composer :5200, sandbox :4700) ·
  SI2 tuba roster 21 techniques, dual-port model (D2) · cresc sample lengths measured
  (docs/SI2_tuba_sample_lengths.md) · CC7 law calibrated (probes/cc7_map.json) ·
  gain staging protocol + ledger (GAIN_STAGING.md; instance master −7.3, master −6
  tutti, REC −10) · META drawing layer + freehand-fit + sculpt tools in the score.
- **Research arc (the day's core):** crescendo taxonomy (P1–P4, sourced) · vocabulary
  BLOOM/SURGE/THRESHOLD · findings 1–13 (RESEARCH_INDEX.md) · **THE LAWS L1–L3**
  (CURVE_DATABASE.md — scatter floors mandatory; quota-guaranteed trends; keeper
  stats = plateau anchor) · **Xenakis mass rules X1–X8** (XENAKIS_MASS_RULES.md) ·
  the piece's own species: the SWELL-CLOUD, where **the peak-cut IS the attack**.
- **State: `sc4-max-dense` approved "pretty good for now"** — 7 s hold at 6.9
  endings/s · releases 0.02–0.08 s (rexpodec floor) · durations 0.5–1.6 s (surge
  3–6×) · max-random quota placement. Engine: compileSwellCloud (compiler.js).

**Next up — the four-pass plan (composer, day wrap):**
1. *(done this day)* the dense hold — SC4.
2. **Durations driven by ONSET scattering** — scatter onsets, durations follow
   (flips the current peak-driven generative direction).
3. **The least dense texture** — get sparse right.
4. **Perceivable density gradations** — speed of least→most dense, gradual vs
   jumps vs in-between.

**Open at session end (tabled):** release shape/duration fine-tune · level-riding
A/B (finding 13) · envelope-shape variety (old SC3 stage) · noise-dial formalization
· algorithm codification second pass · chord/pitch material (S6; line-mass species
held) · P1 Reaper bridge · P2 meta-track object · paper TODOs (RESEARCH_INDEX).

**Orientation for a cold session:** RESEARCH_INDEX.md (map) → CURVE_DATABASE.md
(laws + entries 001–026 + consequences table) → XENAKIS_MASS_RULES.md →
COMPOSER_LOG.md (verbatim). Servers: `node score/server.js` (:5200),
`node sandbox/serve.js` (:4700). Score archive in the Load dropdown (sc1–sc4 etc.).

**Post-wrap addendum (2026-08-10, composer notes — AI working independently):**
10-part expansion + composer-score UI batch (floating draw tool, grain-edit suite,
apex dots, Roads env catalog) — slate + statuses in PLAN §4/parking + chat rundown.
Penn State tuba/euphonium ensemble research for the festival application →
docs/PENN_STATE_RESEARCH.md. Mandates M1–M3 added for the performance score.

**Blockers:** none.

## §3 Principles

*(Inherited from piece #3 — full text in its journal §3; they carry verbatim.)*

1. **Check Reaper input monitoring before blaming the instrument.**
2. **When a working reference exists, diff the files — don't iterate guesses.**

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

## §5 Done

- 2026-08-10 — 0a stack seed.
- 2026-08-10 — Gain staging calibrated; CC7 law measured; cresc lengths DB.
- 2026-08-10 — Crescendo research arc: laws, Xenakis rules, swell-cloud species;
  **SC4 dense hold approved (provisional)**.

## §6 Human Notes

