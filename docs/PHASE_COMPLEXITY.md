# PHASE COMPLEXITY — the process record

> Day 21 (2026-08-20), one sitting. How the phase-shifting audition work turned
> into a theory of onset complexity, a live instrument, and a computed ladder.
> Written to be read cold; the paper cares about the SEQUENCE, so wrong turns
> are kept, labeled. Raw trail: RUNNING_LOG day 21 (2ag follow-ups 1–12).
> Quotables: PAPER_NOTES day 21. Machinery: PLAN 2ag. Slate history: the
> `_slate` field of `bank/texture_params.json` (revs 1–14, all in git).

---

## 1. Where it started

The session opened on PLAN 2ad (settle phase-shifting textures for the trance
section, by ear, zero new code). The composer auditioned the five stored
models and said **"they sound kind of the same"** — which turned out to be
half a slate problem (the references all sat at 18 attacks/s, near the
measured point of minimum character separation) and half a real question that
took the whole sitting to name.

Through the tempo/density ladders (revs 2–9: speed ladder, character×speed
grid, acceleration ladders, accretion, the live rig) the composer kept
converging on what they actually wanted, and finally named it:

> *"What I think was missing was that phasing consideration, and I might not
> need to use tempos at all. Probably what I was looking for is ONSET
> COMPLEXITY USING PHASING. That's closer to the original Steve Reich music
> as a gradual process."*

## 2. The conceptual ground

**Phase is the substrate of the whole dial space.** The existing texture
dials are the derivatives of phase: **scatter** = static phase (randomly
drawn) · **ΔBPM** = phase *velocity* (the gallop's lap is a phase wrap) ·
**jitter** = phase *noise*. What no surface exposed was **composed phase** —
*chosen* offsets. The original 2j research had already located the
interlocking textures exactly there (90° = hocket, 180° = aligned-opposite).

Standing constraints that bind all of this: **D27** (attack fields only —
sustained timing-phase is inaudible), **D29** (no pitch bend in textures),
and the performance rule that no texture may depend on precise timing.

## 3. The instrument: the rotor

One number per step, added to the live rig (PLAN 2ag): **offset f** — player
j sits at **(j·f) mod 1** of the per-player cycle (60/bpm). `f = 0` is the
legacy even round-robin, byte-for-byte.

- f = 1/players → even smear · f = 1/q → q evenly spaced cluster-pulses ·
  denominators past the player count → uneven rhythm cells · tiny f → the
  cascade/décollage · irrational → lumpy never-grid (three-distance theorem:
  at most 3 distinct gap sizes; verified in node).
- **Per-player spacing stays 60/bpm at any offset**, so the BPM cap table
  (§6) is untouched by phasing.
- Live scheduling is cycle-at-a-time: edits land on the next cycle (≤ 60/bpm
  late). ΔBPM is ignored while an offset is set; jitter still applies — it is
  the blur axis for free.

## 4. The ladder iterations — the trail, wrong turns kept

1. **rev 10 — first-pass 12 rungs** (0.1, 0.5, 1/3, 0.25, 0.2, 0.125, 1/16,
   3/16, 3/20, golden, 0.03, 0.01). Spanned the amount range, mostly at
   simple ratios.
2. **The composer's two-axis finding, by ear:** *"it seems to me that it's a
   combination of offset amount and then complexity, ratio complexity."*
   Correct — rev 10 walked AMOUNT with complexity held mostly simple. The
   axes are independent.
3. **rev 11 — the mediant walk** (1/2, 2/5, 3/7, 4/9, 5/12, 7/17, √2−1).
   Meant as "depth within the ½→⅓ zone." **The composer caught the error:**
   stated as a walk *from 1/2 to 1/3*, it actually **converges** to ~0.414
   and never sweeps. Converge-vs-sweep was an AI communication failure, not
   a math one — but the ladder was not what was promised.
4. **rev 13 — the true sweep** (all zone fractions q ≤ 12, descending: 1/2,
   5/11, 4/9, 3/7, 5/12, 2/5, 3/8, 4/11, 1/3). Verified group counts
   2/10/9/7/10/5/8/10/3 — a value-ordered sweep necessarily **zigzags** in
   complexity, because simple and complex ratios interleave on the number
   line.
5. **The composer's Reich insight closed the loop:** what makes the phasing
   pieces interesting is the heterogeneous stepping — *"something very
   patterned that immediately resolves into something very smeary."* Which
   forced the realization in §5.

## 5. The theory that survived: complexity is UNEVENNESS, and it is an inverted U

- At unison, every simple fraction (q ≤ players) produces **evenly spaced**
  pulses — they differ only in count. Denominator "complexity" collapses;
  the number is the wrong thing to rank.
- What the ear ranks: **gap unevenness** (primary), **accent/stack variance**
  (secondary), onset count (weak).
- **Both ends of the space are simple**: the clean pulse AND the uniform
  smear. Complexity lives between — pulse → groove → knotty → smear. A
  Reich-style progression passes *through* complexity between two kinds of
  simplicity.

## 6. Physical constraints (measured this sitting, mostly via composer questions)

- **Per-player BPM caps** (bpm < 60/ring): unison C3 **143** · m3(F) 120 ·
  cl low 124 · cl mid 122 · oct F# 117 · cl high/m7/m4 115 · everything
  else, and safe-for-anything: **113**. Breaks confirmed empirically at the
  analytic values (C3 dirty at exactly 143).
- **Rain is the one model with a tighter cap**: jitter closes adjacent
  attacks by up to 2×, so cap = 60/(ring + 2·jitter) → ~117 C3, ~96
  safe-for-anything at jitter 45.
- **There is NO player-count threshold** — dropping players never fixes a
  ring problem (the limit is per body). Measured: 132 BPM dirty at 10, 9, 8,
  and 6 players alike.
- **The composer's redistribution insight (unweld line from body):** the
  ring is per BODY, so a line can hop bodies. Pooled: **8 lines of 132**
  redistribute cleanly over 10 players (9 marginal; 10 = the 18.9/s wall).
  Literal (each pitch truly at 132): **pairs at 66 BPM, 180° — 5 true lines
  max** with 10 players. Full 22/s pitched needs 12 bodies = the M1 / Penn
  State route.
- **The live floor:** composed offsets under ~30–50 ms are mock-up-only
  (stage width ~30 ms + human error ±25 ms). The tightest décollages are
  color, not controllable steps.

## 7. The experiment: machine proposes, ear corrects (rev 14, current)

Scorer: **`tools/score_offsets.js`**. For each of 997 offsets at 98 BPM × 10:
build the cycle's pattern (onset groups after a wrap-aware 25 ms fusion
merge), score = **gap CV + 0.1 × stack-size std**. 430 distinct audible
patterns; 12 picks with monotone score 0.00 → 1.25 written to the `phase`
slot:

    rung  offset  groups  score   character
      1   0.5       2     0.00    two pulses
      2   0.2       5     0.00    five pulses
      3   0.286     7     0.05    seven, accented stacks
      4   0.2805    7     0.09    seven with a limp
      5   0.0935   10     0.20    near-smear, one hitch
      6   0.1835   10     0.29    lilting 51/62 swing + turnaround
      7   0.384    10     0.34    three-gap cell (49/93/44)
      8   0.4585   10     0.39    nine-run + two long holes
      9   0.461    10     0.47    same family, deeper
     10   0.2365   10     0.58    sharp 33/112 cell
     11   0.469    10     0.77    tight run + two big holes
     12   0.0585   10     1.25    fast ripple + 290 ms rest

**The scorer independently reproduced the inverted-U** — smear and pulses
both land at ~0 with the knotty cells between — which is the strongest
internal evidence the unevenness framing is right. (Also: the 0.498 near-half
turned out to be a sub-fusion *flam-thickened* stack — a distinct color, kept
out of the ladder.)

**The protocol:** the score order is a hypothesis about perception; the
composer's listen is the experiment. Disagreements (rungs that sound alike,
or out of order) correct the weights and the scorer re-runs in minutes.

## 7b. THE LANDSCAPE MEASURED (day 37) — the "inverted U" is NOT an arch

> Run in answer to the composer's question while drafting the paper: *"is the
> arch linear? simple → complex → back to simple evenly?"* **Answer: no.**
> Script: `scratchpad/arch_shape.js`, reusing `score_offsets.js` math verbatim
> (same N=10, 98 BPM, 25 ms fusion, same score). All 997 sweep points.

**Mean score per offset band — the terrain is not a hump:**

    0.00-0.05   0.308   (78 of 96 near-zero — the fusion block)
    0.05-0.10   0.758   ← the peak
    0.10-0.15   0.144   ← a trough
    0.15-0.20   0.245
    0.20-0.25   0.238
    0.25-0.30   0.224
    0.30-0.35   0.263
    0.35-0.40   0.297
    0.40-0.45   0.203
    0.45-0.50   0.389

**The simple states are isolated WELLS, not a region.** 117 of 997 score
near-zero, and they sit at: the near-unison block (0.002–0.0405, where all ten
attacks fall inside the 25 ms fusion window and read as ONE event) — then
**0.10 · 0.20 · 0.30 · 0.40 · 0.50** and nothing else.

### THE FINDING: the simple states are the fractions whose denominator DIVIDES THE PLAYER COUNT

1/10, 1/5, 3/10, 2/5, 1/2 all score **exactly 0.000**. But **1/3 scores 0.047
and 1/4 scores 0.050** — and their gap CV is **0.000**, perfectly even. Their
entire score comes from **accents**: ten players over three slots is 3+3+4, over
four slots is 3+3+2+2, so some attack points are thicker than others.

**Ten divides evenly by 1, 2, 5, 10 — and those are exactly the offsets that
score zero.** The simple states are a property of **the ensemble size**, not of
the arithmetic. *Consequence for M1 (the roster-scaling mandate): change the
number of players and the wells move.*

### Density is NOT complexity — measured

    groups   n     mean score
      1      78     0.000      (everything fused: unison)
      2      41     0.020
      3      54     0.061
      4      41     0.070
      5      66     0.046
      6      27     0.076
      7      70     0.080
      8      42     0.089
      9      54     0.091
     10     524     0.533   min 0.000  max 1.770

**All the complexity lives at ten groups** — i.e. only once every player has a
distinct attack point. And even there it spans the whole range: `f = 0.1` gives
**ten attack points at gap CV 0.000, score 0.000** — maximum density, zero
complexity. **Density and complexity are orthogonal, and this is the proof.**

### Why this matters to the argument

**The "both ends are simple" claim survives** — the two-pulse state and the
even ten-attack smear both score 0.000. **But "simple → complex → simple" as a
traversal does not.** The space is a terrain of narrow wells with high ground
between them. Step through it and you fall in and out of simplicity repeatedly.

**That is the mechanism behind the composer's own beat-1 description** —
*"something very patterned immediately resolves into a timbral smear and then
steps through a kaleidoscopic variety of rhythms."* The kaleidoscope is the
well structure. **The material cross-cuts because the landscape is punctured,
not because it is an arch traversed quickly.**

## 8. Open / next

- The composer's listening verdicts on the rev-14 ladder (the experiment §7).
- **Pacing:** a progression that accelerates *separately from tempo* —
  per-step durations or a start→end curve on the auto-run. Discussed, not
  built.
- Other zones / re-scored ladders as the weights get corrected. 98 BPM is
  the current working tempo (composer's call).
- Composed-phase groups as a live dial (2 groups at 90°, 3 at 120° — the
  interlocking family). Flagged, not built.
- GROOVE (per-player fixed random offsets) remains the live rig's set-aside.
- Everything here is **UNHEARD** as of writing; no keeper banked. The 2x
  listening-slate gate still applies.
