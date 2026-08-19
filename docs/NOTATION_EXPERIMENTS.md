# NOTATION EXPERIMENTS — Section-1 density builds (side project)

> **Status: DESIGN ONLY — nothing runs until the composer green-lights each
> experiment.** This is a concurrent SIDE PROJECT to the main
> notation-architecture build (PLAN §7 Phases A–E); it does not block Phase A
> and Phase A does not block it. Results fold into the main build as
> stratum-2 derived data and stratum-4 runtime devices (§7 fold-in contract
> below). Charter and clarifications journaled RUNNING_LOG day 19; composer
> framing verbatim in COMPOSER_LOG day 19.
>
> **Rules:** experiment IDs are stable — never renumber, only append. Every
> experiment carries a pre-registered decision/kill rule written BEFORE it
> runs. Failed strategies are kept WITH their failure reasons — the dead ends
> are deliverables, not waste. Every run appends one line to the ledger (§8).

## 1. The question

Make the Section-1 density builds performable with rhythmic accuracy and
without tuplet gymnastics (PLAN §3 M5). The baseline hypothesis is
Mists-style: proportional spacing + beams on what sounds grouped + scrolling
cursor + GC. **The baseline is not the only candidate** — the composer is
explicitly open to paradigm shifts; it is simply the one judged to have
promise. The experiments exist to (a) discriminate between named strategies
and (b) DISCOVER what actually carries timing information to a player —
including the possibility that much of the apparatus is unnecessary.

## 2. Two classes of experiment (composer's distinction, day 19)

- **Discriminative** — prove/disprove a named strategy against another, with
  reasons for failure recorded.
- **Discovery** — probes designed to allow surprise. The composer's example:
  run one condition with just the scroll bar and black dots (or vertical
  lines), one with full notation and helpers — *"and find that the
  discrepancy is negligible."* A result like that would not pick a winner; it
  would relocate where the timing information lives.

## 3. Strategy slate (open list — additions welcome)

- **S0** — cursor-only proportional display (control; already doubted:
  "slippage").
- **S1** — Mists baseline: proportional + perceptual beams + cursor.
- **S2** — S1 + GC landing at group starts.
- **S3** — S2 + GC bouncing the group's internal pulse where E1 finds a
  first-level rational (periodicity in the animation, not the glyphs).
- **S4** — mixed metric notation: tuplet + tempo glyphs on chunks that fit,
  proportional residue (M5's original middle proposal).
- **S5** — full metric at 32nds. Already rejected (the gymnastics M5 exists
  to avoid); kept as the recorded ceiling case.
- **S6+** — open. Paradigm shifts enter here, including anything E0 suggests.

## 4. Inheritance: the GC already exists

**`GCMaker`** — a window-global, well-developed object in BOTH prior
performance apps (piece #1 `string_quartet_no1-composer`, piece #2
`composition_for_two_pianos_and_two_percussion`: see each repo's
`scripts/performance_parts_patches.js` — e.g. `calculateBallPositionForPage`
— plus `performance_rehearsal_patches.js` and `public/index.html`). The term
"gravitational conductor" predates this piece.

**Port, don't rebuild.** The genuinely NEW work is only:
- a data feed from E1 chunk output (landing points = group starts);
- an internal-pulse bounce mode for S3 (ball bounces the chunk's rational
  subdivision);
- a physics check at port time: does the existing object scale bounce height
  to the gap (flight time t → height ∝ t²)? If not, that is the one upgrade
  worth making — height-encodes-duration is the predictive mechanism.

## 5. Experiment designs

### E1 — the chunker (data-only; discriminative for S4, feeds S2/S3)

- **Data:** `cloud02-10track` (cleaned playable realisation, 1184 notes)
  first; then the other Section-1 realisations. Per-part onset lists from the
  canonical score JSON.
- **Stage 1 — segmentation (perceptual groups):** new group when a gap
  exceeds ~2× the local median IOI, with an absolute floor (~350–500 ms,
  tuned by eye against the material). Output feeds beaming and GC landing
  points REGARDLESS of stage 2 — every strategy needs groups.
- **Stage 2 — rational fit per run:** candidates = countable beat 0.30–1.00 s
  (the constraint that killed the earlier 20 ms-beat false positive) ×
  vocabulary {straight ÷1,2,3,4; one-level p:q, p ≤ 9, q ∈ {2,3,4}, reduced}.
  Per-onset error; maximal contiguous runs within tolerance; **ε swept
  10/15/20/25/30 ms**; min run 6 notes; tempo-churn penalty (fixed-tempo
  lesson: prefer one pulse per player per passage; also report best
  single-tempo coverage per part).
- **Vocabulary note:** the first-level restriction is the complexity prior —
  an unrestricted vocabulary fits any onset list (some 21:19 always
  "succeeds"), so restriction is what makes a positive meaningful.
- **Outputs:** coverage-vs-ε curves per part and total; chunk-length and
  tempo histograms; timeline map (claimed spans + description vs residue).
- **Pre-registered kill rule:** coverage < ~30 % at ε = 20 ms, min-run 6 ⇒
  metric description is patchwork; S4 loses by default to S3 and the residue
  strategy becomes primary.
- **Why the day-19 apex verdict does not pre-empt this:** that measurement
  searched straight grids only; a 7:2 on a 60 bpm beat reaches a ~171 ms
  effective grid with a slow counted referent — unsearched space.

### E0 — the floor ladder (discovery; composer-designed)

Ablation ladder on the SAME excerpt, one device per rung, tap accuracy
measured per rung (via the E2 harness):

- **r0** — scroll cursor + black dots, proportionally spaced (no staves).
- **r1** — + vertical attack lines (M4-style).
- **r2** — + full Mists page: staves, noteheads, perceptual beams.
- **r3** — + GC landing at group starts.
- **r4** — + GC internal pulse (only where E1 found a rational).

**Pre-registered readings:** the result is WHERE accuracy jumps, not a
winner. If r0→r2 discrepancy is negligible ⇒ the page carries pitch/reading
value but not timing value — timing lives in the animation, and the page can
be optimized for other virtues. If r3 jumps ⇒ the GC is the load-bearing
device (the composer's main insight confirmed). If r4 adds nothing over r3 ⇒
the internal-pulse mode (S3's extra machinery) is unnecessary. If nothing
jumps ⇒ the material itself bounds accuracy — a compositional finding, not a
notational one.

### E2 — the tap harness (apparatus; serves E0 and head-to-heads)

- **Task:** play/tap along on a MIDI keyboard (loopMIDI infra exists) while
  the app renders a Section-1 strip under one condition; capture tap onsets
  vs target onsets.
- **Design:** within-subject; randomized condition order; ≥2 excerpts
  (apex window + a mid-build window); repeats per condition to measure
  learning; short excerpts (~15–30 s) to keep sessions cheap.
- **Metrics:** median |error|, IQR, % gross misses (> 80 ms — strawman
  threshold, tune on first data), drift over the excerpt, and
  learning slope across repeats.
- **Alignment:** nearest-target matching with an insertion/omission count —
  extra and missing taps are data, not noise.

### E3 — GC port + extension

Port `GCMaker` from piece #1/#2; wire to E1 chunk data; add the
internal-pulse mode; verify the bounce-height physics (§4). Prototype
questions: lookahead (when does the ball appear), irregular-gap chains
(variable-height bounces in sequence), one group vs chained groups.

## 6. The n = 1 subject — bias, stated and designed around

The composer will serve as tap-test subject and named the bias directly:
not a strong traditional-notation reader; an improvisor; years of practice
reading their own animations. **Direction of bias: favors react/animation
conditions, against count/glyph conditions.** Pre-registered interpretation
rules:

- If count conditions (S4-like) WIN anyway → strong evidence, against the
  grain of the subject's bias.
- If animation conditions win → confounded; note it, and defer the
  count-vs-react verdict to a trad-trained replication.
- Comparisons WITHIN the animation family (E0 rungs, GC variants) are the
  most valid for this subject — bias is roughly constant across them.
- The harness stays reusable: 1–2 trad-trained players (real tubists) later
  turn the confounded comparisons into evidence.

## 7. Fold-in contract (to the main build)

- E1 output = **stratum-2 derived data** with provenance; its chunk record
  format is input to the IR schema work (Phase A2) — the M5 chunk is already
  named the atom of the strip.
- GC modes = **stratum-4 runtime devices** (7c), entering the class registry
  with their accommodation strategies like every other object class.
- Decision rules from experiments become **RULES in the notation IR** (P6
  principle), never baked outcomes.
- **Nothing here blocks or reorders the main track:** A1
  (NOTATION_ARCHITECTURE.md) remains the next main-track step on credit
  renewal.

## 8. Run ledger

*(append one line per run: date · experiment · data/excerpt · conditions ·
headline result · decision taken)*

- *(no runs yet)*
