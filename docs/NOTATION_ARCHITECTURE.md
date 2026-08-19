# NOTATION ARCHITECTURE — for seven tubas

> **Status: A1 draft, 2026-08-19 (Phase A, PLAN §7 amendment). Under composer
> review — amendment 1 (§1 S3: material-dependent realization, provenance
> kinds) applied 2026-08-19 during that review.** This document is deliberately CAPPED to six contracts: strata ·
> class registry · accommodation bucket · engine passes · coordinate contract ·
> parachute contract. Its content is of three kinds, each marked by its
> citation: composer-CONFIRMED architecture (PLAN §7 amendment, COMPOSER_LOG
> day 19) · predecessor-ADOPTED lessons (cited to their source docs) ·
> AI-PROPOSED contract terms (the uncited laws in §§2–6), which are proposals
> awaiting this draft's composer review. Open musical/design decisions are
> marked OPEN (§8) and are decided by no one here.
>
> **What this doc is NOT** (doc discipline, §9): not a build plan
> (phases live in PLAN §7), not the experiment charter
> (`NOTATION_EXPERIMENTS.md`), not a per-class catalogue (that is registry
> DATA, §2), not a session log (`RUNNING_LOG.md`). Piece #2's notation plan
> grew to 357 KB, ~30 % of it session stamps and ~20 % per-idiom catalogues,
> and its numbered architecture stopped growing at §18 (session 58) while its
> session log ran on to session 87. This doc grows by AMENDMENT, with supersessions
> marked, and pushes everything that grows linearly (classes, strategies,
> runs) out into data files and their own docs.

**Sources.** Composer dictations: COMPOSER_LOG day 19 (three entries). Record:
PLAN §7 + amendment, PROJECT_JOURNAL D42/D43, RUNNING_LOG day 19. Predecessors
(consulted 2026-08-19, findings journaled): piece #2
`THREE_SCORES.md` / `COORDINATE_SYSTEM_VISION.md` (principles P1–P8) /
`NOTATION_SYSTEM_PLAN.md`; piece #1 `NOTATION_FRAGMENT_WORKFLOW.md`.

---

## 1. The four strata — one data spine, N manifestations

*"One rich data source in time with different manifestations but same
identity."* Every artifact this phase produces is a reading of one spine;
nothing is an export of another manifestation.

### S1 — Composition data (exists: the composer app)

The strips: all parts plus the META strip, locked to **one timecode in
seconds**. Ground truth of the storage, measured 2026-08-19 on real scores
(`piece-s23`, `tranceA002f`, `cloud02-10track`):

- **Storage is deliberately uniform: two object types**, `waveCurve` and
  `marker`. Everything else is fields and context: morph notes are waveCurves
  with `morphBend`; META shapes are layer-10 waveCurves; gestures are
  `groupId` sets; envelopes are `nodes`/`segments`; technique + the D9
  one-shot tables decide real sounding length.
- **Class is NOT derivable from storage type alone**, and layer conventions
  drift between scores (in `piece-s23` markers sit at layer 0 and META shapes
  at layer 10; in `tranceA002f` markers sit at layer 10). Consequence: the
  engine's first pass is a genuine CLASSIFIER over rules (§4), not a type-tag
  lookup.
- **S1 is LIVE.** The trance section (`tranceA002f`, the current latest) is
  being composed right now, and notation starts interleaved with composing
  (PLAN §7 amendment supersedes phase-2-after-composing). So nothing
  downstream may assume a frozen source: every derived or IR entry carries
  provenance (§1, S2/S3) and is regenerable when its source moves.

### S2 — Derived data (partial: results become first-class)

Analysis products **with provenance**: E1 chunker output, beating structure
(D28's register law), playability audits (2r/2s), sample-length tables (D9),
the future performer-transform renderings (D3). Contract:

- Every S2 entry names its source (score file + object ids or time window),
  its tool + parameters, and its date. Piece #2's converted entries carried
  provenance blocks; here it is mandatory, because S1 moves (above).
- S2 is where the side project folds in: the M5 chunk is already named **the
  atom of the strip** (PLAN §7 amendment), and the E1 chunk record FORMAT is
  an input to the IR schema (A2) per `NOTATION_EXPERIMENTS.md` §7.

### S3 — Notation IR (new: the layer this phase builds)

The notation layer AS DATA, render-late: spelled pitches, chunks/bars,
per-chunk tempo maps, beam groups (perceptual grouping, per the Mists
baseline — M5), dynamic marks, device references, and **decisions stored as
rules** (P6), never baked outcomes.

**Why render-late is forced, not preferred.** Mandates M1 (on-the-fly part
multiplication) and M2 (family adaptation: any part readable by any
tuba/euphonium family member at rehearsal time) require transposition and
re-layout at load time — you cannot transpose an SVG. Piece #1 stated the
precondition for its baked-SVG fragments itself: pre-generation was valid
only because fragments were *"a small, fixed menu of pre-composed
material."* M1/M2 are precisely the failure of that precondition, so the
semantic IR is the only design that satisfies the mandates.

**Manifestation is COMPILATION, not reading.** There are decisions —
spelling, grouping, tempo, strategy choice per chunk (D43's mixed strategy) —
that exist in no stratum below. They live HERE, as first-class data, or they
get baked into renders and go stale (piece #2's P6 lesson).

**AMENDMENT 1 (2026-08-19, composer-confirmed during A1 review) —
realization is MATERIAL-DEPENDENT, and IR content carries PROVENANCE KINDS.**

- **The governing statement (composer, verbatim):** *"the material will
  determine how the data layer is interpreted and then realized for that
  material."* Interpretation + realization rules attach to the CLASS (§2's
  `ir` field, §4's per-class translators). The composer's hypotheticals: the
  trance may realize dynamics as a mark per attack plus hairpins; a morph
  realizes loudness as an animated curve and may carry a beating indication
  instead of traditional dynamics at all.
- **Dynamics (and other notational content) DECOUPLE from the MIDI.** S1's
  level numbers are a SOUND PROXY, tuned so the sampler behaves — not
  notational intent. There is no one-to-one, no global level→mark rule, and
  possibly no algorithm at all for some materials; any that exist are
  per-material proposals.
- **Provenance kinds on every IR fact:** `derived` (a per-material rule made
  it — rule + inputs recorded, regenerable) · `authored` (the composer wrote
  it — source of truth) · `authored-override` (the composer wrote it AND it
  contradicts the S1 evidence; the contradiction is recorded, not hidden).
  Translators PROPOSE; authoring wins.
- **The survival law:** S1 is live, so regenerating derived content must
  never eat authored content — authored facts re-attach by stable node
  identity, with an explicit orphan policy when their anchor disappears.
  (Lands on A2: stable IDs + the provenance field; A3–A5 each include one
  deliberate authored override to exercise the mechanism.)
- **No P6 conflict:** P6 guards against stale DERIVATIONS posing as
  decisions; an `authored` mark is source data — the provenance label is
  exactly what keeps the two distinguishable.
- **Continuous change is carried by CURVES** — *"the performer expressing
  the curve, watching the curve and expressing it."* Marks anchor discrete
  events; the displayed curve is the notation of the continuous channel;
  hairpins are a study-score engraving of the same data, not the primary
  device.

**AMENDMENT 2 (2026-08-19, composer-confirmed, same review) — D3's
performer transform dissolves into the same pattern.** Performers react
INSTINCTIVELY to a few **blunt shape families**, not to fine geometry (a
20 % vs 25 % slope is not consistently distinguishable between players);
morph instructions may redirect what the performer listens for (*"a
crescendo in the beating"*) without following the playback's mathematical
curve. Structural consequences, closed now so nothing forks later:
- the **raw S1 curve stays canonical**; the display pipeline carries an
  OPTIONAL per-material transform slot — compensation, if ever wanted, is
  an S2 derivation switched on per class, never a rebuild;
- **performance semantics attach to the shape FAMILY** (a per-material
  vocabulary, kin to the tap experiments), not to exact geometry — the
  exact curve remains in the data and the display, but what it MEANS to a
  player is decided per material, at material time;
- per-material verbal instructions (what to listen for) are IR content with
  `authored` provenance, like any other mark.

### S4 — Renderers / runtimes

The engine (§4) over data-linked **meta-structures** — proportional time
grid, per-part tempo rulers, lanes, page frames — served by ONE coordinate
module (§5), assembling **stamps/sprites** (any sounding datum → a glyph
group; atomic under splicing). Runtime devices are S4 objects that enter the
class registry like everything else: the GC and scrolling cursor (M4/M5),
the tremolo sine figure (2j), and the **env-release device family (M3)** —
which is its own class group, not a cursor variant, because M3's defining
constraint is that *scrolling curves won't serve releases*. The release
vocabulary itself is an owed composer design session (PLAN parking-lot P3;
§8).

### The four forms = configurations, not codebases

| Form | What it is |
|---|---|
| Composer score | S1's own app (exists; untouched by this phase) |
| Study score | **TWO VIEWS** (confirmed day 19): "study-composers" full score — real notation, all parts, click-a-part-to-zoom — and a GRAPHIC SCORE view (bricks + META overlay), plus rehearsal visualizations of S2 continuous data (beating curves, approach/recede balls, breaths, swells) |
| Notation layer | S3 + an engraving-quality renderer for proofing |
| Performance score | The runtime (PLAN §7c): scroll/pages, sync, GC, applying M1/M2 at load time |

### The two clocks

Notation has two time systems and the mapping between them is itself S3 data:

1. **Absolute seconds** — the strip coordinate, canonical, and the only
   time exchanged between machines; pixels stay local per the coordinate
   contract (§5; consistent with piece #2's P5 and its networked-sync
   design).
2. **Musical time per chunk** — each chunk's tempo map (per-chunk tempo maps
   are confirmed S3 content, PLAN §7 amendment). Per-chunk RE-ANCHORING is
   structural: every metric fit re-zeroes error at the chunk's first onset,
   which is the GC's load-bearing job (D43), not decoration. No global bar
   count exists. **OPEN (priced, not decided):** whether tempo scope is per
   chunk, per part, or ensemble-shared — D43 prices the ordering (per-chunk
   26.2 % > per-part 15.9 % > shared 9.1 % coverage at ε = 20 ms, stable at
   both tolerances) but M5's open list still owns the choice (§8 row 8).

---

## 2. Class registry — the contract

Storage is uniform (§1), so notation classes are SEMANTIC, assigned by the
classifier pass via **explicit ordered rules**. The registry is DATA (file
path fixed in A2, alongside the IR schema); this section fixes only its entry
shape and its laws.

**Entry shape** — every class carries:

| Field | Meaning |
|---|---|
| `class` | stable name |
| `classify` | the rule that claims an S1/S4 object (fields, layer, technique, context) |
| `ir` | what it becomes in S3 (translator contract) |
| `accommodation` | which splice strategy from the bucket (§3) applies |
| `fallback` | its guaranteed graphic manifestation (§6 — REQUIRED, no exceptions) |
| `status` | proposed / confirmed / superseded |

**Laws (predecessor-paid):**

- **Classification exists from day one.** Piece #2 built translators first
  and retrofitted the classifier last, after discovering nothing decided
  which translator runs. Here the classifier is pass 1 of the pipeline from
  the first slice.
- **Unknown THROWS with diagnostics** (feature vector, near-miss rules),
  never a silent `unknown` bucket (piece #2's CL-5). A silent unknown is how
  material disappears from a part.
- **Features are never silently inferred**; the feature catalogue grows only
  from need.
- **Decisions live at the CLASS level, not the instance** (P7). Per-instance
  overrides are exceptions, marked as such.
- **New classes are decisions, not silent additions** (piece #2's emit-kind
  rule, generalized). A new class gets a registry entry + a journal line.

**Seed classes** (observed in the real scores; the catalogue itself lives in
the registry file, not here): staccato one-shot note · fixed one-shot
(fp / cuivre, D9 true-length) · ORD sustained with envelope
(`nodes`/`segments`) · drawn crescendo curve (CC7 material, D3-transform
pending) · morph note (`morphBend`, re-key chains D26) · trance stream unit
(fixed-tempo per player, PLAN 2af) · density-cloud note (M5 material) · META
shape · marker/label · grouped gesture (`groupId`) · S4 devices (GC modes ·
scrolling cursor · tremolo sine figure (2j) · env-release devices (M3),
pending the P3 design session).

---

## 3. Accommodation strategies — the bucket

**The composer's term and concept (day 19):** *"not infinite resolution but a
bucket of solutions that accommodate most splices."* A finite registry of
splice behaviors keyed to object CLASS — never per-instance fixes.

**Why this is new work, not inherited:** piece #2 never spliced an object.
Its only boundary behavior was whole-object page-edge clamping (PL-2), and an
object wider than a page was explicitly out of scope. The strip model makes
slicing first-class — *"a ticker tape… slice it up in any chunks"* — so the
splice bucket is the genuinely novel layer of this architecture, and the
place slice-1 evidence matters most.

**The bucket so far** (from the day-19 dictation; each entry is a strategy
CLASS, applied per object class via the registry):

1. **Matisse cut** — a long curve splices like a paper cutout: clip
   geometry at the boundary, both sides keep their identity. (The composer's
   own example; the sticky case from prior pieces — "long curves… keep their
   integrity in different page sizes.")
2. **Cursor jump with continuous delta** — a scrolling/looping runtime
   object reaches the splice, jumps to a new x,y and a new loop, while the
   TIME delta stays continuous across the visual break.
3. **Stamps are atomic** — a glyph group is never cut. If a stamp straddles
   a boundary, the boundary moves or the stamp moves; the stamp does not
   split.
4. **Bars prefer chunk boundaries** — the M5 chunk is the atom of the strip
   (PLAN §7 amendment); cuts land at chunk starts wherever possible, which
   is also where the GC re-anchors (D43).
5. **Page-edge decision tree as RULES** — clamp/move behavior so nothing
   falls off the page, stored as rules, not baked positions (P6 applied at
   the layout level; piece #2's PL-2 is the seed, upgraded from "whole
   object only" to per-class).

**Laws:** the bucket is finite and versioned; a new strategy is a decision
with a journal line; every registry class names exactly one primary strategy
(per-view overrides live in the registry data file as explicit, marked
exceptions — not in the §2 entry shape); non-local notation (beams, ties spanning
a cut) resolves at IR level by preferring chunk-aligned cuts — a cut that
would break a beam group is a LAST resort and must be marked in the render.

---

## 4. Engine passes

The per-object pipeline, adopted from piece #2's proven seven-stage shape
(it shipped an entire piece: 431 svgElements, 177/177 markers) with the
strata boundaries made explicit:

| Pass | Consumes → produces | Stratum |
|---|---|---|
| 1. Classify | S1/S4 object → class binding (registry §2) | S1 → |
| 2. Translate | object + binding (+ S2 data: chunks, tempo maps) → IR node | → S3 |
| 3. Layout | IR node → layout-box tree (positions in score units, anchors) | S3 → S4 |
| 4. Size | box tree + view config → scale (transparent, overridable — P4) | S4 |
| 5. Render | box tree → drawn output (SVG/canvas) | S4 |
| 6. Emit | render + animation hooks → typed entries (finite emit-kind registry) | S4 |
| 7. Route | entries → idempotent upsert into the target manifestation | S4 |

**Laws:**

- **Stamps are typed boxes with anchors, not frozen paths.** Piece #2's
  root-cause autopsy: a glyph library of frozen pixels can only translate
  bounding boxes; the fix was glyphs exposing anchors in score units —
  *"anchors compose; positions don't."* Adopted wholesale. Glyphs are
  captured just-in-time (no bulk font preload), with provenance.
- **No runtime engraver dependency.** If LilyPond (or any engraver) is used,
  it is a scripted OFFLINE oracle for glyph extraction and reference
  measurement — never called during authoring or performance (piece #2's
  ND-4).
- **Time-varying behavior is a first-class emit kind** (animation binding:
  target + kind + params), never baked into a render (piece #2's SZ-4). This
  is what keeps the GC, cursors, and the other S4 device families data-driven.
- **The emit-kind registry is finite**; new kinds are decisions.
- **The engine is also a WORKSHOP** (composer requirement, day 19): a surface
  for developing NEW notation — try a device on real IR data, see it
  rendered, keep or discard. Piece #2's studio precedent (ND-5: a minimal
  viewer + text-command layer over the same engine), so new-notation
  development exercises the production passes, not a parallel code path.
- **Pipeline matures object-by-object** (piece #2's working mode): new
  class → translator → idiom → run end-to-end on the real object → ship.
  This is D6's reverse-engineering principle applied to notation.

---

## 5. Coordinate contract

Piece #2's most expensive lesson (two coordinate systems, fragmented ad-hoc
translation, the SZ-8 bug and the three-iteration Rosetta debacle — symptoms
surfacing far from causes), adopted on day one as EIGHT laws (P1–P8,
`COORDINATE_SYSTEM_VISION.md`), condensed to this piece's contract:

- **ONE coordinate module** owns every translation between units. Every
  other module CALLS it; nothing duplicates the math; **mirrors are a
  smell** (piece #2 `COORDINATE_SYSTEM_VISION.md` §5; its journal's final
  Principle 29 sharpens it — mirrors also miss SHARED bugs, so test against
  runtime output, never a copy of the runtime's algorithm). A constant
  change touches one file.
- **Three-layer stack:** (1) **score time in seconds** — canonical,
  persistent, network-synced; the strip coordinate. (2) **lane-relative
  score units** — persistent, viewport-invariant (lane fraction and a
  vertical score unit; the exact unit for notation — staff-space vs lane
  fraction — is fixed in A2 with the schema). (3) **pixels** — recomputed
  every frame from layers 1+2 × the live viewport, and **stored nowhere: a
  pixel value in any score or IR file is a bug.**
- **Composer-first units** (P1): every position spec is written in score
  units; CSS px exists only inside the render pass.
- **Standard edge anchors on every element** (P2): topMost / bottomMost /
  leftMost / rightMost alongside semantic anchors, so "put this at X"
  never requires knowing internal geometry.
- **Sizing is transparent and overridable** (P4): any shrink factor is
  visible before render, forceable to 1, and policy-pluggable.
- **Viewport-invariance is structural** (P5): a view (page size, screen
  width, paper format) supplies only its window mapping through the one
  module — which is what makes pagination a VIEW of the strip rather than a
  property of the notation.
- **Snapshot regression from the first shipped element** (P8): unit tests on
  conversions, snapshot tests on resolved positions/scales, visual
  regression on renders. Every engine change keeps snapshots stable unless
  the change is the point — then the diff shows exactly what moved. (This is
  also Principle 6's mutation-testing stance applied to layout.)

---

## 6. Parachute contract

**The composer's economics (day 19, binding):** solid plan → AI codes a lot →
controlled refining → **parachute**. No duration estimates, ever; phase gates
with composer review.

The parachute is STRUCTURAL, not a promise:

- **Every registry class carries a `fallback`** — a guaranteed graphic
  manifestation renderable from S1/S2 alone (proportional bricks, curves,
  attack lines: what the composer app already draws). A class without a
  fallback cannot ship (§2 — the field is required).
- Therefore **"produce a score NOW" always renders**: chunks whose IR is
  decided render as notation; everything else renders as its fallback, on
  the same strip, same timecode, same coordinate module. A score can ship at
  any moment of the phase, mixed-fidelity by construction.
- Distinct from the fallback: D43's Section-1 RESIDUE — the material simple
  bars cannot claim — is still to be NOTATED somehow. The candidate
  treatments on record are Mists-style proportional notation + GC (the named
  baseline, itself *"maybe not the only one"*), tuplets, an M4-style visual
  device, or a compositional re-think; E0–E3 adjudicate. The graphic
  fallback is the guarantee BENEATH all of those, not itself the residue
  strategy.

---

## 7. Fold-in (restates `NOTATION_EXPERIMENTS.md` §7)

The architecture build — this doc's track — is the composer's *"main but
separateish build"*; the experiments (E0–E3) are *"a concurrent side project
that will eventually get folded in"* (D42). The fold-in, restated from
`NOTATION_EXPERIMENTS.md` §7 merged with its header rules:

- E1 chunk records → **S2 derived data** with provenance; the chunk record
  format is an INPUT to the IR schema (A2).
- GC modes (E3, ported from the piece #1/#2 `GCMaker` lineage) → **S4
  runtime devices**, entering the class registry with their accommodation
  strategies like every other class (the source's wording; the required
  `fallback` field is this doc's §2 law, applied on entry).
- Experiment verdicts → **rules in S3** (P6), never baked outcomes. Failed
  strategies are kept with their failure reasons (D42).
- Neither track blocks or reorders the other; per-experiment green-lights.

---

## 8. Open decisions (owed — nothing here decides them)

| # | Decision | Owner | Blocks |
|---|---|---|---|
| 1 | ~~0–10 → dynamic-mark convention~~ **DEFERRED by dissolution (amendment 1):** no global ladder exists; marks are authored-first IR content, per-material rules harvested only when a material demands one | composer authors per material | nothing — slice 1 proceeds hand-marked |
| 2 | ~~D3 performer-transform~~ **STRUCTURALLY RESOLVED (amendment 2):** raw curve canonical + optional per-material transform slot; performance semantics attach to blunt shape families, decided per material at material time | composer, at material time | nothing now |
| 3 | ε tolerance (20 vs 30 ms) and the playable-unit floor (80–120 ms) | composer's ear / E2 | Section-1 strategy mix (D43) |
| 4 | GC smooth-entry cue at bounce apex vs impact | composer | E3 scope |
| 5 | Vertical score unit for notation (staff-space vs lane-fraction hybrid) | A2 schema work | A2 |
| 6 | Registry + IR file locations and naming | A2 schema work | A2 |
| 7 | ~~Velocity vs CC7 (PLAN 2q)~~ **DEMOTED (amendment 1):** neither carrier is notational truth, so notation no longer needs the verdict; 2q stays a mock-up/sandbox consistency question | composer listening test | mock-up fidelity only — not notation |
| 8 | Tempo scope: per chunk vs per part vs ensemble-shared — D43 prices it (26.2 / 15.9 / 9.1 %); M5's open list also holds: notated vs conducted vs both · GC as person, scroll cue, or click · bar lengths on the realignment cycle `C` | composer / E2 | Section-1 IR |
| 9 | Release vocabulary + devices (M3) — the PLAN parking-lot P3 design session | composer + AI working session | M3 device classes |

---

## 9. Doc discipline (how this file stays capped)

- Contracts live here; **catalogues live in data** (registry file, bucket
  file); **runs live in ledgers** (`NOTATION_EXPERIMENTS.md` §8,
  RUNNING_LOG); **verbatim composer language lives in COMPOSER_LOG**.
- Changes are AMENDMENTS: supersede in place with a dated marker, never
  fork the doc.
- If a section starts growing linearly with content (per-class, per-run,
  per-session), that content is in the wrong file — move it, leave the
  contract.
