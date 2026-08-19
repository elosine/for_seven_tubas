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

**Reframe (composer, day 19, binds the evaluation):** *"listening to
individual parts, this is about finding ways to produce PHRASE PERFORMING
STRATEGIES within a context of rhythmic complexity."* Timing accuracy is the
CONTEXT, not the goal — a strategy that nails onsets but yields no phrase is
not a solution. Consequence: every experiment carries a phrase axis alongside
the error metrics (§5 E2), and the GC's known phrase-level weakness (§4)
makes the page-vs-animation division of labour the live hypothesis: **ball
carries time, page carries phrase.**

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

**Competence profile (composer, day 19 — from two pieces of lived use):**
- *Strong:* rhythmically accurate entries/attack points · spread through the
  ensemble, GCs *"can produce interesting rhythms hard to notate"* (a
  COMPOSITIONAL affordance, not just a reading aid) · baton-like — *"can
  give a pole, a rhythmic marker to play around"* (a reference to phrase
  against, not only a command to obey).
- *Weak:* *"at the phrase level they are less competent"* · **attack-coupled**
  — the ball's landing carries an attack FEEL: it cues a percussive entry
  even when the part wants a slow smooth ramp, so the player must *"resist
  the stated attack."* The timing channel and the articulation channel are
  entangled in the one gesture.
- *Design candidate from the weakness (AI proposal, untested — composer
  decides whether it enters E3):* decouple them. Keep the parabola (the
  predictive mechanism) but cue soft entries at the **apex** — the
  zero-velocity, floating point of the flight — rather than the impact;
  and/or vary the landing rendering (no squash/rebound, dissolve-into-note)
  for ramped attacks. Both preserve trajectory-predictability while changing
  the articulation connotation.

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
notational one. **Under the phrase reframe, "negligible timing discrepancy"
is not "the page is redundant"** — the page may be carrying the phrase
channel, which timing metrics cannot see; the phrase axis (E2) reads that
side of the same runs.

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
- **Phrase axis (the reframe's requirement):** onset error cannot see
  phrasing. Two additions: (a) **tap velocity profiles** — a MIDI keyboard
  reports velocity, so the dynamic shape of a performed group is measurable
  against the intended phrase shape (exploratory — velocity on a keyboard is
  a proxy, not tuba articulation); (b) **composer judgment** per condition:
  "did that feel like performing a phrase or typing?" — recorded alongside
  the numbers, not beneath them.
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

- **2026-08-19 · E1 + E1b · `cloud02-10track` (10 parts, 1184 onsets, 3–86 s)
  · tools `e1_chunker.js`, `e1b_fixed_beat.js` · full results below.**

### E1 results (2026-08-19) — free beat per chunk

**Segmentation ceiling: 814/1184 notes (68.8 %)** live in groups of ≥6 (206
groups, length min/med/max 1/5/20). No fit can claim more than this — so
coverage figures must always be read against 68.8 %, not 100 %.

    condition (eps = per-onset tolerance)        eps=20 ms   eps=30 ms
    free beat, ANY grid unit                       68.8 %      68.8 %   <- = the ceiling
    free beat, playable unit >= 90 ms              26.2 %      57.1 %
    one fixed beat per part, playable (E1b)        15.9 %      44.7 %
    one SHARED ensemble beat, playable (E1b)        9.1 %      36.5 %

**Finding 1 — the free search reproduces the day-19 false positive in new
clothes.** With the grid unit unconstrained, the fit claims *every note the
segmentation makes available* (68.8 % = exactly the ceiling), at ε as tight as
20 ms. But the grid units are 33–87 ms (median **37 ms**) and the vocabulary
selected is 9:1×42, 8:1×24, 7:1×7 — nonuplets and octuplets per beat. That is
not simple notation; it is 32nds-and-finer wearing a countable-beat label. **The
"countable beat" constraint alone is insufficient** — a slow beat plus a high
subdivision is just as unreadable as a fast beat. The binding second constraint
is the GRID UNIT, and it must be stated explicitly.

**Finding 2 — the honest coverage is the playable-unit row, and it is
tolerance-dominated:** 26.2 % at ε=20 ms rising to 57.1 % at ε=30 ms. Chunk
lengths at ε=20 ms are min/med/max 6/6/11 (mostly minimum-length — thin bars);
at ε=30 ms 6/8/15. Vocabulary becomes ordinary: 3:1, 4:1, 2:1. Tempi cluster
fast, 133–200 bpm (median ~165). Apex-window (48.9–54.9 s) playable coverage:
33.6 % at ε=20 ms, 86.7 % at ε=30 ms.

**Finding 3 — first-level p:q rationals are PROVABLY REDUNDANT when the beat is
free, and this is why E1 selected zero of them.** With a countable beat free in
[0.30, 1.00] — a 3.33× range — some integer subdivision p ≤ 9 always lands the
beat in range, so a straight label always exists (checked numerically: 1
exception in 1935 sampled grid units, at the extreme edge u ≈ 33 ms). The
composer's 9:2 / 7:3 vocabulary therefore cannot add coverage in a per-chunk
free-beat frame. **It is not that the material rejects the idea — the analysis
frame makes it unnecessary.** Which tells us exactly where it *can* matter:
when the beat is CONSTRAINED. Hence E1b.

**Finding 4 (E1b) — with the beat fixed, p:q earns its keep, but the gain is
modest and the cost is large.** Fixing one beat per part makes the composer's
vocabulary appear everywhere (9:2, 7:2, 7:3, 8:3, 9:4, 5:2 all selected), and
it beats a straight-only vocabulary by **+0.7 pts at ε=20 ms and +4.6 pts at
ε=30 ms** (15.9 vs 15.2 %; 44.7 vs 40.0 %). But fixing the beat *costs* about
10–12 pts against the free-beat frame, and forcing ONE SHARED beat across the
ensemble costs another 7–8. **The ordering is stable at both tolerances:**
free beat per chunk > one beat per part > one shared ensemble beat. That is a
direct answer to M5's open question "is the tempo per part or is the bar a
shared window": per-part is strictly cheaper than shared, and per-chunk
cheaper still — the cost of ensemble metric agreement is now a number.

**Finding 5 — per-chunk re-anchoring is what makes any of this work, and it is
the GC's structural job.** Every fit above anchors error at each chunk's first
onset, so error never accumulates across chunk boundaries. This is not a
convenience of the analysis; it is an assumption about performance that the GC
discharges — the ball landing at each chunk start re-zeroes the error budget.
**Note that even E1b's "fixed tempo" condition assumes this** (it fixes the
grid unit but not the phase). True continuous metric notation — fixed unit AND
fixed phase across a whole part — is stricter than anything measured here and
remains unmeasured (see E1c below).

**Sensitivity (the honesty check).** Two knobs were swept:

    PLAYABLE_UNIT floor    eps=20 ms   eps=30 ms      <- BINDING
       80 ms                 37.3 %      64.3 %
       90 ms                 26.2 %      57.1 %
      100 ms                 19.8 %      49.9 %
      120 ms                 11.5 %      36.1 %
    BEAT_MIN 0.25 vs 0.30 s: NO effect on coverage (labelling only)

The headline number swings ~3× across a plausible range of "what counts as a
readable subdivision". **E1 therefore cannot settle S4 on its own** — where the
playable line sits is a musical judgment, and E2 is the instrument that could
set it empirically. `BEAT_MIN` not mattering is a corollary of Finding 3.

**Verification (per AI_METHODOLOGY — a confidence claim must be checked).** One
reported chunk was re-derived by hand from the raw score objects: tuba9 @
48.910 s, 10 notes, grid `0 1 2 4 5 7 9 10 12 13`. Independent least squares
gives unit **135.0 ms**, max error **17.0 ms** — matching the tool exactly. Its
raw IOIs (131, 142, 256, 163, 256, 252, 147, 266, 156 ms) are cleanly 1× and 2×
the unit. **Caveat exposed by the check:** this chunk is musically plain
eighths-and-quarters at a ~222 bpm pulse, but gets *labelled* "3:1 triplets at
148 bpm" only because a 0.27 s beat falls under the 0.30 s floor. Labels near
the beat boundary are artifacts of the window, not facts about the music —
report units, not just labels.

**Pre-registered kill rule — FIRES, but not robustly.** The rule was: coverage
< ~30 % at ε=20 ms, min-run 6 ⇒ metric description is patchwork and S4 loses by
default. Playable coverage is **26.2 %**, so it fires — but at an 80 ms floor
it would read 37.3 % and would not. **Verdict recorded: S4-everywhere is dead
(it was already); S4-as-one-strategy-in-a-mix is alive and is what the numbers
actually support** — roughly a quarter to a half of the material admits simple
bars depending on tolerance, and the rest needs something else. This is the
composer's mixed-strategy reframe, now with numbers attached.

**Open / next (not run):**
- **E1c — continuous metric condition:** fixed unit AND fixed phase across a
  part (no per-chunk re-anchoring), to price what the GC is actually buying.
- Run E1 across the other Section-1 realisations — one score is indicative,
  not exhaustive (the day-19 caveat still stands).
- Segmentation is the ceiling at 68.8 %; its parameters (`SEG_K` 2.0,
  `SEG_FLOOR` 0.35 s) were never swept. A different segmentation changes every
  number above.
