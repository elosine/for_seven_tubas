# Research index — the paper trail

*Master map of the crescendo/Risset research line (started 2026-08-10). If this
becomes a paper, this file is the skeleton: question → literature → method → data →
findings, with provenance for every claim.*

## The research question

Categories of crescendo **sound** (percepts), produced through the chain
**visual animated curve → performer interpretation (inferred) → sound** — and the
curve shapes + ensemble deployments (Risset-style patterns) that reliably target them.

## Document map

| Doc | Role |
|---|---|
| `CRESCENDO_TAXONOMY.md` | Literature summary (4 pillars, sourced) + the 5-dimension framework |
| `CRESCENDO_EXPERIMENTS.md` | Battery S0–S7, per-run params, results log, verdicts verbatim |
| `RISSET_RECIPES.md` | Ensemble-deployment layer (accelerando lit. + derived crescendo recipes, sourced) |
| `GAIN_STAGING.md` | Level-calibration protocol + ledger (measurement validity) |
| `SI2_tuba_sample_lengths.md` | Instrument dataset: per-note crescendo-sample lengths |
| `COMPOSER_LOG.md` | Composer's verbatim dictated notes, dated (primary source) |
| `CURVE_DATABASE.md` | The three styles (Bloom/Linear/Surge) + catalog of used patterns (entries added as used) |
| `research/audio/INDEX.md` | Audio evidence index (files kept out of git for now) |
| `probes/` | All measurement instruments (MIDI probes + analyzers), reusable |
| `scores/7tubas.json` + git history | Every auditioned stimulus, reproducible at any past state |

## Provenance conventions (in force since start)

- Composer verdicts recorded **verbatim** in COMPOSER_LOG / results logs.
- Every measurement logs its WAV filename + parameters + date.
- Stimuli live in the versioned score; git history reproduces any earlier state.
- Literature claims carry source links at point of use.

## Findings so far (each traceable to a log entry)

1. SI2 tuba cresc samples: fixed lengths 3.39–5.86 s, multisample-group sawtooth (1c).
2. UVI CC7 law ≈ 40·log₁₀(cc/127), 58.1 dB span (S0) — drawn-vs-heard shape requires
   the measured inverse.
3. Crescendo trajectory categories surviving first audition: **bloom / linear /
   expected-crescendo**; sigmoid cut (S1a).
4. **A traditional hairpin ≈ exponential, not linear** (S1a, composer) — direct
   notation-rendering consequence.
5. Attack-bite mechanism: CC7 smoothing race at note-on; cured by 150 ms pre-arm (S1a).
6. Gain staging: one-job-per-stage protocol; ceiling −18 dBFS RMS (ledger row 1).
7. **Shape→duration perceptual conversion** (S1c): back-loading beyond ≈exp-slope 0.6
   (k≈2.4) stops sounding like a shape variant of the same-length crescendo and starts
   sounding like a *shorter* crescendo; the usable same-length shape spectrum is
   linear → k≈2.4, with the "expected crescendo" at k≈1.6–2.4. **Working rule for
   composition: ~10:1 end:start skew = the approximate spectrum boundary.**
8. **The flip is symmetric** (S1d): the same ≈10:1 boundary appears in the bloom
   (front-loaded) family — beyond it, stimuli read as "a short crescendo, then a long
   tone." Both families flip from shape-variant to duration-variant at roughly the
   same growth-ratio. (Scale-invariance across L under test — S1e.)
9. **Skew discriminability peaks at breath scale** (S1e, light-touch): the vivid
   category/boundary structure heard at 8 s largely collapses at 4 s (differences
   compress) and at 16 s (differences wash out). Held as a single-listener
   impression, not a rule; compositionally the skew dial is a directional nudge.

## TODO before "paper" status

- [ ] Full bibliographic pass: convert source URLs to complete citations
      (authors/year/venue) — links captured at point of use are the working form.
- [ ] Re-record keeper auditions (S1a survivors, S1c spectrum) as archived takes.
- [ ] Decide audio archival channel (git-LFS vs FLAC-in-repo vs external + index).
- [ ] The visual-perception→sound "does the shape convey the sound" study (composer
      meta-question, S1a).
- [ ] **If the 10:1 skew tolerance becomes a paper point**: literature dig for existing
      perceptual findings on loudness-ramp curvature / skew-ratio discrimination
      (composer, 2026-08-10 — none surfaced in the first research pass).
