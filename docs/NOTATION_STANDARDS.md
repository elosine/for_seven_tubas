# NOTATION STANDARDS — the settled rules, in words, with where each one lives

> Created day 24 (2026-08-22) at the composer's request: *"let's try to capture
> these as standards or something documented somehow because after the clear,
> we've lost. I've had to reestablish some of these rules."*
>
> **Every rule here is also DATA or CODE somewhere** — this file is the index,
> not the source of truth. The right-hand column says where. An AI reading
> this cold should be able to draw any figure in the section-1 vocabulary
> without asking the composer a single question that is answered below.
> When a rule changes, change the registry/code first, then this line.

## How a figure is built

`tools/notate_section.js` builds every figure from **registry data**
(`notation/registry/container.json → engraving.layout.figures`). Two figure
kinds exist:

| kind | flag | what it is |
|---|---|---|
| **cluster** | `--cluster t0-t1@part` | a composer-named span of partials on ONE analysed tempo (D56). Tempo = exhaustive complexity-scored fit (`notation/lib/cluster_fit.js`); every partial written as a 16th, gaps as rests |
| **beam** | `--beam t0-t1@part` | notes joined by a beam that KEEP their own technique device — no tempo, no grid, no rests (day 24) |

**Modifiers are positional** (day 24): `--clusterTol` `--accents` `--dyn`
`--beamBreak` `--beamThrough` `--tuplet` `--figures` `--paceRatio` each apply to
the `--cluster` that precedes them. `@part` is required in a multi-part file.
**`--figures` (8g, day 27) cuts the cluster into FIGURES, each on its own grid** —
see principle 6 below. It refuses to combine with `--beamBreak` (the opposite case:
several beam groups on ONE tempo) or `--pattern` (which it implies).

## The cluster standard

| rule | composer's words | lives in |
|---|---|---|
| Go line on the **first partial only** | "Goline just for the first partial" | `figures.cluster.goLine: "first"` |
| GC on the **first partial only** | "the GC only on the first one, so it launches the whole cluster" | `figures.cluster.gc: "first"` |
| Every partial's **notehead LEFT EDGE sits on its own go time** | "the left edge of the note head should line up with all the go times… because of the scrolling person" | `figures.cluster.nhAnchor: "leftEdge"` |
| Filled head at the cell scale, staccato dot at the tight gap | (day 23, wc-29) | `figures.cluster.nhHead/nhHeadScale 0.844/nhDot/nhDotGapSs 0.15` |
| Every partial a **16th**; gaps are rests; second beam level = **beamlets** (stub right on a note with no 16th neighbour) | "a short beam where the sixteenth note beam is, not something that connects" | `notate_section` written values; `layout.js` beamlet rule; `engraving.layout.beamStubSs 1.0` |
| `--beamThrough N` keeps group N's second beam solid across its rests | "they can all be beamed together, it's fine" (figure 2, day 23) | per-cluster modifier |
| Several beam groups may share one tempo | "the first group of notes and then the second group, but conceptually keep the same tempo" | `--beamBreak n` |
| **Dynamics = ambient + deviation**: one mark on a chosen member, **accents on the members louder than it** | "loud, slightly softer, loud, slightly softer, loud loud" → `--dyn 1:f --accents 1,3,5,6` | `figures.cluster.dynamics`; DYNAMICS_FRAMEWORK.md |
| Per-partial marks remain available | "let's just keep all the dynamics" | `--dyn 1,2,3,…` (bare = the velocity band; `n:mark` overrules it) |
| Accents sit **above the beam on one row**; the beam is lowered to make room inside the lane | (day 23) | `layout.js` beamHasArtic; `engraving.layout.stackGapSs` |
| Tuplet bracket = the composer's own LilyPond standard (D57) | — | `engraving.layout.tuplet`; `--tuplet a-b@n:d` |
| **A PICK-UP is fitted separately** (`--pickup N`): the tempo is fitted to the notes AFTER the pick-up, then the pick-up is placed on that grid at a negative slot, and the **GC and go line move to the downbeat** — the first note after it | "1 should be a pick-up. The GC then is actually on number two" | `--pickup N` (positional); the pick-up's own miss is reported, never constrains the fit |
| The tempo is the analysis's, not a guess; **tolerance is a compositional dial** — looser buys simpler | — | `--clusterTol` (0.03 default; T1 used 0.05) |

## The beam standard (a short note beamed into a long one)

| rule | composer's words | lives in |
|---|---|---|
| Each note keeps its own technique device (head, ring bar, dot, dynamic) | "stem the half note, and then just connect it to the sixteenth note with a beam" | `--beam` writes ONLY stem/beam fields |
| Beam levels are **derived**: a short one-shot is the 16th (two levels → a stub); anything that rings takes the primary only | "have the sixteenth stub on the first one" | `figures.beam.ringTechniques` |
| **The GC-bearing member is DISPLACED and keeps its go line**; every other head sits with its left edge ON its go time and has none | "the ones that are on GCs should in fact have the go line and the notation lines up before, but the ones that are part of clusters, the left edge should line up with the go time" | `figures.beam.goLine: "gc"`, `anchor: "leftEdge"`, `gcAnchor: "before"` |
| GC on the **RINGING note** — the long one whose entry needs the cue (`first` stays legal, and is the fallback when nothing rings) | "let's shift the GC to the half note" | `figures.beam.gc: "ring"` |
| The duration bar **moves with the head, always** — it starts after the unit's ink (`ringBarGapSs`) and never before the attack | "anytime we move the note head, the duration bar gets moved together with it" | `layout.js` derives `ringBarItem.dx0Ss` from `headDx`, clamped at 0 |
| The members' dynamics go **together on one row above the beam**; the beam is lowered to fit them | "when we have two consecutive dynamics like that, let's go ahead and put them together… they both need to be at the top because the sfzp won't fit below" | `figures.beam.dynAboveBeam: true`; `layout.js` group dyns row |

## THERE ARE TWO FIGURE KINDS, AND ONLY TWO (day 24)

**A one-shot** — a single note with a GC. The ball says *when*, the notehead
says *what*. The head hangs before the go time so it never covers the disc, and
**a go line joins the two**.

**A cluster** — a group with a rhythm. The GC launches the group; every head
sits with its **left edge on its own go time**; **no go line**, because nothing
is displaced. Members that ring (fortepiano, cuivre, ord) keep their own
technique device — open head, ring bar, their own mark — and take the primary
beam only. A pickup into a lone fortepiano is a cluster whose downbeat rings.

*(The separate "beam" figure built earlier on day 24 was retired the same day:
it was a cluster all along.)*

### A GO NEEDS A BREATH — the classification rule

**A note with less than `breathSeconds` (0.5 s) before the next attack cannot be
its own go.** It attaches to what follows: a **member** if it fits the grid, a
**pickup** if it does not.

Not a new number — `breathSeconds` already ends the ring bar ("the bar ends a
breath before the next gesture"), so one value answers both *when does this
gesture end* and *is this a separate gesture at all*. A player who cannot get a
breath is playing one shape, not two.

Measured against the section when adopted: of 43 fortepianos, exactly **two**
have under a breath before them — T2's (220 ms) and T4's (398 ms), the two the
composer had already made pickups by ear. Every other fp has 600 ms or more.
Zero false positives. **Outstanding:** 33 loose notes elsewhere in the section
(T4–T10, outside the dense 36–46 s passage) sit under a breath from their
neighbour and cannot stay one-shots.

### Dynamics on a pickup

**The dynamic goes on the first sounding note, even when that note is a
pickup** — Gould, and the default in Dorico/LilyPond. A cluster's ambient mark
therefore lands on member 1 whether or not member 1 is the pickup. A `sfzp` is
note-specific and says nothing about the pickup, so without its own mark the
pickup would have no stated level at all (every one-shot in this piece resets
the dynamic, so nothing is "prevailing"). Where a beam group contains a ringing
note, the members' marks share one row above the beam.

### The GC clearance push is CONDITIONAL

A GC-bearing unit is pushed clear of the disc **only when its head actually
reaches it** — head underside below `−laneHalfSs + gcImpactInsetSs +
gcImpactRadiusSs`. With the ball on the lane edge that is midi 29–30 only.
Unconditional pushing drags heads off their own go time and then reads, under
the go-line rule, as a displacement that is not real.


## THE GO LINE MARKS DISPLACEMENT (day 24 — the governing principle)

**A go line belongs on a unit whose head is NOT on its go time. A head that
already sits on its go time does not get one.**

Composer, day 23, in the asking: *"the other go lines are there because the
notation doesn't line up with the go time."* Locked in day 24.

| unit | head position | go line |
|---|---|---|
| one-shot (staccato / fp / cuivre) | hangs **before** its go time (`nhGapSs` 0.6, to clear the GC disc) | **yes** — it marks the displacement |
| surge | unit before the go time | **yes** |
| cluster partial | **left edge ON** its go time (`nhAnchor: "leftEdge"`) | **no** — nothing to mark |
| beam member | head **centred on** its go time (`anchor: "headCenter"`) | **no** |

Being rolled out one figure at a time at the composer's request
(`--noGoLine`, a positional cluster modifier) so each is seen before the
registry default flips to `false`.

### Three marks say "now"; only one is the datum

At an onset there can be three marks all stating the same time: the GC's impact
disc, the go line, and the notehead's left edge. The **GC is the datum** — it
alone carries the *launch*, not merely the time. The go line survives only
where the head is displaced. Everything else is redundant ink at the one place
in the notation that must not be ambiguous.

**Alignment: left edge on the go time.** Time-space notation (Feldman, Brown,
Cage) puts the attack where the notehead *begins*; conventional engraving
aligns simultaneities on their left edges; and the scrolling cursor touches the
head as the note starts. Centre alignment has no tradition behind it — whole
notes are the only case anyone argues about.

### Rests follow the same rule as noteheads

**A rest is a note-shaped silence: its LEFT EDGE sits on the moment the silence
begins** — the position and spacing a note of that value would get. Gould, Ross,
Read and every engraving default align rests left with notes in other voices;
the whole-bar rest is the one exception, and it is a different symbol. Stone
reports the same for proportional notation, where rests are usually omitted
altogether and, when kept, mark the start of the silence.

**A rest may not cross a beat** (D62). A cluster is *go, then count*, and
since no tempo is printed the rests are the only thing that shows where the
beat is: a rest BEGINNING on a beat makes it visible, one running across it
hides it. The run is capped at the next beat boundary and the longest value
that fits inside is taken — dotted values still allowed where they do not
cross. Registry `figures.cluster.restsSplitAtBeat`. Measured on T3's cluster
before the change: beats 2, 3 and 4 each fell inside a rest symbol, so the
player counted through three invisible downbeats in a row.

**Vertical placement is LilyPond's own, per glyph** (`glyphs.rest.*.topSs`,
placed top-left by `stamps.rest`). Roughly centred on the middle line, with the
standard refinement that flagged rests share a top edge and add hooks
alternately downward (16th) then upward (32nd) — which is why the 16th hangs
0.49 ss low. Inherited whole; do not fix it.

### The ball lands on the lane edge

`impactInsetPx` **5 → 0** (day 24), in BOTH registry copies —
`engraving.render.gc.look` (the static disc) and `animated.gc.look` (the falling
ball). They must agree or the ball lands where the disc is not; nothing checked
this until `test_animobj` gained the assertion the same day, and the test itself
now reads the number instead of restating it.

**Why:** the disc occupied y −6.39..−5.37 ss while **42 % of the section's
staccatos sit at C2 or lower**, so a bottom-octave head landing on its own go
time shared a position with the disc — Tufte's 1+1=3 at the datum, and exactly
the collision the day-23 Option B discussion existed to prevent.

**Measured before and after: 3 of 7 GC-bearing figure notes collided; now 0 of
7.** Only midi 29–30 (F1/F♯1, the piece's two lowest) still reach the disc, and
by a ledger line rather than the head.

Day 23 called vertical separation impossible *"because the marker's height IS
the object"*. That was too strong: the **landing height** is a number we chose,
not something inherent to the GC. Moving it changes where the ball lands, not
what the GC is.

## Laws that apply to every beam (code, not numbers)

| law | why | lives in |
|---|---|---|
| **A beam is FLAT. Always.** The group is levelled to the tip furthest from the staff and every stem moves with it | "Beams should always be flat" — a mixed fp+staccato group once sloped by half a space because each note took its own flag's height | `layout.js`, the group pass (day 24) |
| **One stem direction per group**, decided by the member **furthest from the middle line**; ties go UP (the GC objects live under the staff) | T2's cluster: the first note (A3) made the group stem-down and the A1 three ledgers below got a 0.33 ss stem | `layout.js` groupDir pre-pass (day 24) |
| A beam may be **lowered** — for accents, for a tuplet bracket, for the dynamics row — never raised past the flagged-stem height | "if you need to bring it down to accommodate the sfzp" | `layout.js` beamY rules |
| **A beamlet on the group's LAST note points INWARD** (left of the stem); everywhere else it points right, toward the gap the note opens | "the beamlet should go inside the stem rather than protruding outside… on the left of the stem" | `layout.js` beamlet flush (day 24); Gould: a fractional beam points toward its own group |
| **The ring bar starts after the nh-unit's ink** (head · ledgers · accidental) plus a small gap — never at the go line, and never before it | "you have to shorten the duration bar from the left. It still got its own old setting… have the notehead and ledger and a little bit of space and then a duration bar" | `engraving.layout.ringBarGapSs` (0.25 = the `nhGapSs` standard); `layout.js` ringBarItem.dx0Ss, clamped at 0 |
| A page cut is **never later than the page's window end** | the constant-time-scale page (day 22) drew [t0, t0+8]; a cut at 33.1 left 32.0–33.1 on no page | `notation/lib/splice.js` planPages (day 24) |

## The one-shot vocabulary (for completeness — settled days 22–23)

| device | elements | lives in |
|---|---|---|
| **surge** | level curve with a 90° cut · go line · open nh-unit · ppp→fff pair + arrow; no GC, no band mark | `engraving.layout.devices.byEnv.surge` |
| **fortepiano** (and **cuivre**, day 24) | go line · GC · open nh-unit · ring bar cut a breath before the next gesture (D55) · `sfzp` | `devices.byTechnique.fortepiano / cuivre` |
| **staccato** | go line · GC · filled head 0.844 · 16th flag (flag-clear stem) · dot at 0.15 · one band dynamic beside the stem (D52) · unit 0.6 ss before go so the head clears the impact marker | `devices.byTechnique.staccato` |
| **plain ord** (day 24, provisional) | go line · open nh-unit · band dynamic; no GC, no ring bar | `devices.byTechnique.ord` |
| No ottava anywhere: tubists read ledgers (D54) | — | `glyphs.standards.ottava.ledgerLineThreshold 4` |

## Deriving cluster dynamics (captured, NOT wired)

Composer, day 24: *"forte with accents is good. We can capture that as a standard.
I'm not sure we're ready for AI to generate the clusters, but let's just capture it
in case that does happen."* No flag runs this — `--dyn` and `--accents` stay the
composer's. It is written down so a generator starts from this reasoning.
Lives in `figures.cluster.dynamicsRule`.

1. Band every partial from its captured velocity (`dynamicBands`).
2. **Ambient**: one dynamic at the *softer* level, not one per partial. Where the
   level shifts mid-cluster, a second ambient at that point — in practice at a
   beam-group start, taking that member's own band.
3. **Accents**: every partial whose band is *above* its current ambient. Partials
   at the ambient get nothing.

**Why**: there is no engraved mark meaning "slightly softer" — the composer asked.
The inverse is standard: state the soft level once, mark the loud ones.

**Measured against both real clusters (day 24)** — this is the part a generator
needs:

| cluster | bands | rule gives | composer chose | verdict |
|---|---|---|---|---|
| cl-2 (T2, 6) | fff f fff f fff fff — **two** | ambient `f`, accents 1,3,5,6 | ambient `f`, accents 1,3,5,6 | **exact, derived independently** |
| cl-1 (T1, 12) | mf/f/fff — **three** | ambients at members 1 and 9; accents 4,7,8 | dynamics on 1 and 9; accents 4,7,8,**12** | ambients and 3 of 4 accents; member 12's accent is *below* its ambient — a shaping choice on the final partial no velocity rule predicts |

So: reliable for a two-band cluster, a starting point for a three-band one, never
the last word. **A generated cluster should PROPOSE marks and say which partials it
could not explain.**

## Per-note overrides (when one note must differ)

- `--noGc <objectId>[,…]` — remove the GC from named notes
- any device field, per item, in the version file's overlay: `{ kind: "engraving", target: { event }, value: { device: { … } } }` — `stemDir`, `nhAnchor`, `dynMark`, `gc`, `goLine`, …

## FIRST PRINCIPLES OF THE CLUSTER NOTATION (day 24, composer — governs all analysis from here)

1. **Noteheads are spatially true, always.** Left edge on the moment; the cursor
   hits it. Time is guaranteed by the page, not by the written rhythm.
2. **Cluster notation is a grouping device.** Beams, flags and rests show a
   *pattern* (long-short-short-long) to be played as one unit from one go.
3. **The analysis chooses the notation that best shows the pattern as it
   LOOKS** — not the grid with the smallest ms error. *"If it looks like medium,
   short, short, long, those can't be notated as equal-duration notes."*
4. **Dissonance is the failure:** written-equal notes over visibly unequal
   spacing. The threshold has a number — a note displaced by more than **one
   notehead width at page scale** (6.9 px = 30 ms on the video page, 15 ms in
   zoom) from where the notation implies it.
5. **Tuplets are welcome** — 3, 5, even 7:5 — when they make the visible pattern
   legible. The ms guard runs the other way too: no tuplet over spacing that
   does not show one.
6. **Group first, grid second.** Gather notes into logical long-short figures;
   ~~figures need not share a tempo (no tempo is printed)~~.
   **DAY 28 VERDICT (D69) — SUPERSEDES the writing clause above and the "own grid"
   sentences below; PLAN 8i builds it and rewrites this principle:** *the groups are
   beam groups on ONE grid, and the bracket the fit places on a quicker group is the
   communication of the pace change to the performer — "there should be some
   communication to the performer if there is a speed change... the first two sixteenth
   notes look much further apart than the next three, and so the seven-four bracket is
   appropriate."* Own grids (no bracket) are the alternative, by hand. The seam rule
   below (where the groups are) is unchanged.
   **IMPLEMENTED day 27 (8g)** — `pattern_fit.segment()`, run by
   `pattern_analyze` and written by `notate_section --cluster … --figures`. The
   grouping rule is D67: **a cut may only land where the PACE CHANGES** — the seam
   gap must be in a different pace band (ratio ≥ `PACE_RATIO`, 1.25) from the gap
   before it. A figure ends when the pace changes, never in the middle of an even
   stream, so an even run has no legal cut at all and can never be shattered into
   pairs. A figure is also SHORT (`SOFT_MAX_NOTES` 6). Each figure is fitted alone
   and becomes its own beam group and its own **grid domain** (`device.gridId`):
   its rests, its written values and any tuplet bracket are computed inside it.
   **The gesture still goes once** — one GC and one go line on its first note; a
   seam between figures adds no ink and no rest, because two figures share no grid
   in which a rest would mean anything. Near-tie boundaries are FLAGGED, never
   decided (`--paceRatio` moves them). *Measured: on T1 of CLOUD02-I this replaces
   one grid needing 7:4 · 6:4 · 7:4 at 0.7 heads with six figures needing no tuplet
   at all and nothing past 0.3 heads.*

   **THE SEAM IS THE SLOWER GAP — day 28 (8h, D68), the rule that says WHICH SIDE.**
   A cut lands where the pace changes (D67, above); 8h adds which of the two notes
   at that change belongs to which figure. **A seam is a gap that is not quicker
   than either neighbour and is a pace change from at least one of them** — a
   banded local maximum (Lerdahl & Jackendoff GPR 2b: a group boundary falls at the
   greater inter-onset interval). *The boundary note goes with the QUICK side.*
   Day 27 compared the seam with the gap BEFORE it only, so at a slow→quick change
   the quick gap became the seam and the pace-change note landed on the slow side —
   on T1 that gave cuts after 3 and 8 where the composer's ear said 2 and 7. Under
   the two-sided rule the legal set on T1 is exactly the composer's five (2, 5, 7,
   10, 14) and the search takes all of them. **Where the reading hangs on the
   threshold itself it is flagged as a RATIO TIE** (T1's 7-vs-8 flips at 1.272,
   where the 304 ms gap joins the 239 ms band), and **where the rule can find no
   seam at all it says so** (`noSeam`) instead of inventing one — T7 @36.19, whose
   every slow gap has a slower neighbour, is by ear. `--cuts a,b,c` names the seams
   by hand on either tool and legality steps aside; each figure is still fitted alone.

   ***RE-MEASURED under the two-sided rule (day 28), and the day-27 claim did NOT
   survive: across all ten parts of CLOUD02-I, THREE figures need a tuplet*** — T7
   @36.19 (notes 1–6, 0.9 heads), T7 @39.51 (notes 5–8, 0.6), T8 @37.14 (notes 4–7,
   0.9) — against **none** under the one-sided rule. The reason is not that the new
   rule reads worse: the old rule cut MORE (60 figures against 55), and a
   short-enough figure fits any grid for free. Cutting only at real seams leaves
   larger, more musical figures, and three of them genuinely want a bracket. Worst
   displacement across the whole section improved, 1.00 heads → 0.93. **So the
   tuplet-vs-dotted question deferred on day 26 is LIVE again, in three places.**
7. **Played noteheads stay 16ths** on a 16th grid — not 8ths (too long), not
   32nds (too short). Where a 32nd rest would separate two 16ths, write two
   16ths.
8. **Pickups are subjective.** The fortepiano case follows the breath rule; the
   rest are by ear. AI may propose a pickup but must flag it; the composer
   confirms or reverts.

**Calibration (composer's eye):** T8 31.76, worst displacement 0.2 heads → *coherent*; T1's last figure as four even 16ths, 2.1 heads → *dissonant* (the 3:2 cured it). One point each side of the line.

*Status: BUILT and VALIDATED (day 24 late) — `notation/lib/pattern_fit.js`, run via
`node tools/pattern_analyze.js --ir <id> --part N --span t0-t1` (fresh material) or
`--validate` (every decided figure). **24 of 25** decided figures reproduced; the one
disagreement is understood (cl-1, T1's 3:2 at 1.2 heads — T10's 32nds stopped being an
exception on day 24). Pickups are FLAGGED, never applied.
**Day 27 (8g): `segment()` added — a gesture is cut into FIGURES before anything is
fitted (principle 6 above; the cut rule is D67), and the report gives the figures in
words first with near-ties flagged, printing the old one-grid reading LAST for
comparison. `fit()` itself is unchanged.**
**Day 28 (8h): the seam test became TWO-SIDED (D68) — see principle 6. With it came
the RATIO TIE flag, the NO CLEAN SEAM flag, `--cuts a,b,c` (name the seams by hand,
on both tools) and the FLOW flag (adjacent figures at 2:1 or 3:2 could share one
grid — a report only, nothing is built from it). `fit()` is still unchanged.**
`tools/test_pattern_fit.js` guards the calibration, the T1 golden (now the composer's
own cuts), the structural no-shatter cases, the words, and the 8h seam behaviour — 61
checks.*
