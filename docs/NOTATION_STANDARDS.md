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
`--beamBreak` `--beamThrough` `--tuplet` each apply to the `--cluster` that
precedes them. `@part` is required in a multi-part file.

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
