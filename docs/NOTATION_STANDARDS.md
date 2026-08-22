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
| The tempo is the analysis's, not a guess; **tolerance is a compositional dial** — looser buys simpler | — | `--clusterTol` (0.03 default; T1 used 0.05) |

## The beam standard (a short note beamed into a long one)

| rule | composer's words | lives in |
|---|---|---|
| Each note keeps its own technique device (head, ring bar, dot, dynamic) | "stem the half note, and then just connect it to the sixteenth note with a beam" | `--beam` writes ONLY stem/beam fields |
| Beam levels are **derived**: a short one-shot is the 16th (two levels → a stub); anything that rings takes the primary only | "have the sixteenth stub on the first one" | `figures.beam.ringTechniques` |
| **No go lines** | "get rid of that go line too" | `figures.beam.goLine: false` |
| GC on the **first note only** | "remove the GC from the second one" | `figures.beam.gc: "first"` |
| The first note's **head is centred on its go time** | "move the first black note head in so that it's centered on the go line" | `figures.beam.firstAnchor: "headCenter"` |
| The members' dynamics go **together on one row above the beam**; the beam is lowered to fit them | "when we have two consecutive dynamics like that, let's go ahead and put them together… they both need to be at the top because the sfzp won't fit below" | `figures.beam.dynAboveBeam: true`; `layout.js` group dyns row |

## Laws that apply to every beam (code, not numbers)

| law | why | lives in |
|---|---|---|
| **A beam is FLAT. Always.** The group is levelled to the tip furthest from the staff and every stem moves with it | "Beams should always be flat" — a mixed fp+staccato group once sloped by half a space because each note took its own flag's height | `layout.js`, the group pass (day 24) |
| **One stem direction per group**, decided by the member **furthest from the middle line**; ties go UP (the GC objects live under the staff) | T2's cluster: the first note (A3) made the group stem-down and the A1 three ledgers below got a 0.33 ss stem | `layout.js` groupDir pre-pass (day 24) |
| A beam may be **lowered** — for accents, for a tuplet bracket, for the dynamics row — never raised past the flagged-stem height | "if you need to bring it down to accommodate the sfzp" | `layout.js` beamY rules |
| A page cut is **never later than the page's window end** | the constant-time-scale page (day 22) drew [t0, t0+8]; a cut at 33.1 left 32.0–33.1 on no page | `notation/lib/splice.js` planPages (day 24) |

## The one-shot vocabulary (for completeness — settled days 22–23)

| device | elements | lives in |
|---|---|---|
| **surge** | level curve with a 90° cut · go line · open nh-unit · ppp→fff pair + arrow; no GC, no band mark | `engraving.layout.devices.byEnv.surge` |
| **fortepiano** (and **cuivre**, day 24) | go line · GC · open nh-unit · ring bar cut a breath before the next gesture (D55) · `sfzp` | `devices.byTechnique.fortepiano / cuivre` |
| **staccato** | go line · GC · filled head 0.844 · 16th flag (flag-clear stem) · dot at 0.15 · one band dynamic beside the stem (D52) · unit 0.6 ss before go so the head clears the impact marker | `devices.byTechnique.staccato` |
| **plain ord** (day 24, provisional) | go line · open nh-unit · band dynamic; no GC, no ring bar | `devices.byTechnique.ord` |
| No ottava anywhere: tubists read ledgers (D54) | — | `glyphs.standards.ottava.ledgerLineThreshold 4` |

## Per-note overrides (when one note must differ)

- `--noGc <objectId>[,…]` — remove the GC from named notes
- any device field, per item, in the version file's overlay: `{ kind: "engraving", target: { event }, value: { device: { … } } }` — `stemDir`, `nhAnchor`, `dynMark`, `gc`, `goLine`, …
