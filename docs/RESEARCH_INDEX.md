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
| `DYNAMICS_FRAMEWORK.md` | Dynamics line (day 23): the sonic fact, literature read (Nakamura, Kosta et al., Fabiani & Friberg, Ligeti), derived principles, the two layers of the density build, proposals P1–P5, measurements owed |
| `research/` | Obtained sources (Nakamura 1987 PDF; Ligeti 1960 scans) |
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
10. **Static overlap density = repetition, at BOTH poles** (S2a/S2b): dense Risset
    spacing reads as "a loop of the crescendo's last bit"; sparse threshold-relay
    reads as "repeated events." The ensemble crescendo lives in the **derivative of
    overlap density** (and, hypothesis, in evolving harmony once off unison).
11. **The preamble occupancy ceiling, measured** (W0 manifests): 1.5 s rexpodec grains
    at 5× occupy ~5 s of a part → 7 parts cap at ≈1.4 grains/s regardless of requested
    density. Preamble-free grain types (sine, expodec) raise the ceiling — envelope-type
    mixing is a density resource, not only a color.
12b. **Density alone is a weak motion cue at breath scale** (strat-001): an exactly-
    rendered 6.4× density trajectory with flat level was imperceptible as build/
    plateau/descent, while the texture itself improved (heterogeneity). Motion
    perception appears to need a cue bundle — level suspected primary. (→ cue-
    contribution A/B series.)
12. **The two strata of the crescendo-grain** (W0 verdict): the second half
    (threshold→peak) IS the grain and its stochastic overlap works; the uniform first
    halves (preambles) read as a mechanical understory. The texture has two coupled
    overlap profiles — grain-stratum and understory — and preamble DIVERSITY
    (durations, ratios, types) is the lever that turns the understory from mechanical
    ramps into a soft bed. All three scatter dials screened SALIENT (W2/W3/W4); none frozen.
13b. **LAW L4 — the perceptual-scale (bluntness) law** (DH1–DH3 arc, composer-confirmed
    2026-08-11): in-mass discrimination is coarse; parameter diversity must jump in
    category-sized steps (×2.75 adopted) to be heard; the duration axis saturates at
    both ends → 4 usable categories. Full statement in CURVE_DATABASE laws.
15. **The sounding-count regime law** (dens1–dens10 arc, composer-confirmed at three
    curvatures, 2026-08-12): density percept = count regimes (events <1 → polyphonic
    ~2 → fused ~4–5); crossings are categorical; above ~4 onsets/s rate is percept-
    inert (the fusion ceiling) — climax must come from the cue bundle (level: 12b/13
    resolved). Full capture: CURVE_DATABASE 044.
14. **The apex-stack loudness** (composer, DH5 listen, 2026-08-11): when several
    swells overlap in their LOUDEST portions, the stack reads as a vertical,
    chord-like event — "not an attack, but a loudness there" — even on unisons.
    A second density resource beside the peak-cut attack: the field carries both
    attack-points (apexes) and loudness-masses (co-peaking overlaps). Not dialed-in
    deliberately yet; parked as a capturable RECIPE (peak-coincidence control) if
    patterns emerge in the piece. Related: the +8.5 dB convergent-tutti note.

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
