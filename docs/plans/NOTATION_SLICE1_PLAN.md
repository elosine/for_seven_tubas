# NOTATION SLICE 1 — Phase B build plan (the TRANCE section end-to-end)

> **Status: B0, 2026-08-19. Phase B green-lit by the composer ("b go").**
> Governing contracts: `docs/NOTATION_ARCHITECTURE.md` (all of it) and
> `notation/schema/IR_SCHEMA_v0.md`. Working economics (binding): solid plan
> → AI codes a lot → controlled refining → parachute. No duration estimates.
> Chunks are commit-sized (credit-safety, the Phase A pattern); each ends
> committed + pushed + logged, with the battery and snapshots green.
>
> **Anti-sprawl:** this doc holds the chunk sequence, the technical
> decisions with rationale, and the gates. Findings go to RUNNING_LOG;
> amendments to the architecture/schema docs; nothing per-run accretes here.

## What slice 1 proves

`tranceA002f` (the live section, 10 parts, 0–66.8 s) travels the whole
pipeline: **extract → IR → stamps → coordinate module → layout → render →
splice**, with the parachute live from the first render — the page NEVER
fails to render; whatever has no notation yet renders as its class fallback
(proportional bricks + curves), mixed-fidelity by construction.

## Technical decisions (AI calls, rationale attached, composer veto open)

- **DB-1 — Where the app lives.** `notation/app/notation.html` + pure
  dual-load modules in `notation/lib/` (the `morph.js` browser+node
  pattern); `score/server.js` gains one read-only static mount for
  `/notation/`. Scores reach the page through the existing
  `/api/composer/load/<name>`. *Why:* notation is a stratum, not a composer-
  app feature; the composer app stays untouched except the mount.
- **DB-2 — The vertical unit (the deferred §8-row-5 fork, now due).**
  TWO-LEVEL: **lane-fraction places SYSTEMS** (which staff sits where in
  the viewport — the meta-structure), **staff-space (ss) is the unit inside
  a system** (all glyph metrics are ss — piece #2's measured tables port
  unchanged). One coords module owns both plus seconds→x; pixels exist only
  at render time (P1/P5); nothing below the render pass ever sees one.
- **DB-3 — Glyphs are PORTED, not rebuilt.** Copy the needed LP-extracted
  path data + dimension rows from piece #2
  (`tools/notation_studio/engine/glyphs/*`, `dimensions_table.json`) into
  `notation/lib/glyphs/` with `_provenance` on every entry (source repo +
  file + date). The source repo is never edited. Slice-1 glyph set:
  filled notehead · stem (procedural) · beam (procedural parallelogram,
  piece #2 standards) · flags · staccato dot · rests · bass clef · staff
  lines (procedural). Text via `<text>` in v0 (piece #2 baked text to
  paths; noted as a v0 shortcut to revisit at proofing quality).
- **DB-4 — Rendering surface: SVG.** The strip is one virtual x-axis in
  seconds; a VIEW renders a window (scroll view + page mode). Piece #2's
  three-layer coordinate lesson applies verbatim.
- **DB-5 — Spacing: proportional x globally in v0.** For a fixed-pulse
  trance stream, metric spacing and proportional spacing COINCIDE (equal
  beats = equal seconds), so slice 1 gets correct bar interiors for free.
  The metric-vs-proportional divergence becomes real only in Section 1
  material (slice 2) — deferred there, recorded here.
- **DB-6 — Extractor segmentation (trance-specific, honest scope).**
  Per part, per class: greedy IOI-run detection — a run extends while each
  IOI is an integer multiple k·u of the run's unit u (approx-GCD refined,
  tolerance ~15 ms; trance data is near-exact), breaking on unit change,
  k too large, or a section-scale gap. Countable beat = u scaled into
  [0.3, 1.0] s by an integer `subdivision`. Strategy: playable unit →
  `simple-bar`; single-note or unfittable → `unresolved` (falls back).
  ord / fp / cuivre accents classify to their registry classes and chunk
  singly, strategy `unresolved` until realization decisions exist.
- **DB-7 — Classifier: executable rules, names pinned to the registry.**
  v0 classify rules live in `notation/lib/classify.js` (code), but every
  class name it can emit is asserted against `registry/classes.json` at
  load — it cannot invent a class. Fully data-driven rules = later, when
  the rules stabilize (P6 applied with restraint). Unknown THROWS with
  diagnostics at extract time (CL-5); render of VALID IR never throws
  (parachute).
- **DB-8 — IR output.** One committed document for the section:
  `notation/ir/trance-section-01.ir.json` (derived; regenerable; committed
  because authored overlays will attach to it). The hand-worked
  `trance-bar-01` stays as the frozen golden reference — overlap is
  intentional.

## The chunks

- **B1 — Extractor.** `tools/ir_extract.js` + `notation/lib/extract_core.js`
  + `classify.js`; validator gains `--complete` (every S1 onset in
  window×parts has an event — the mode queued in spec §7, now due).
  **Gate:** full-section IR validates `--against-source --complete`; the
  **A3 GOLDEN TEST** passes — extracting A3's window reproduces
  `trance-bar-01`'s events exactly and its two chunks (boundaries, units,
  grids) equivalently; stats reported (chunks / strategies / coverage).
- **B2 — Coordinate module.** `notation/lib/coords.js` (seconds ↔ x ·
  lane-fraction ↔ system y · ss ↔ px), pure, unit-tested + snapshot-tested
  (P8 starts HERE, before the first pixel).
- **B3 — Glyph port + stamps.** `notation/lib/glyphs/` + `stamps.js` (typed
  boxes with anchors — "anchors compose; positions don't"); parity checks
  against piece #2's dimension rows.
- **B4 — Layout passes.** IR chunk → system → layout-box tree: staves,
  noteheads, stems, beams (from groups + note values), rests from gaps,
  tempo labels; the FALLBACK pass (bricks + curves via S1 read-through)
  as a first-class sibling, not an afterthought. Snapshots.
- **B5 — The page.** `notation/app/notation.html`: part picker, window
  navigation, all-parts stack; whole section renders mixed-fidelity;
  verified live in the browser pane; screenshots to the composer.
  **Composer gate: first pixels.**
- **B6 — Splicing.** Page mode cutting the strip with the first three
  accommodation strategies (bars-prefer-chunk-boundaries · stamp-atomic ·
  page-edge rules as data); snapshot suite over page renders; phase review
  package. **Composer gate: phase end.**

## Not in slice 1 (recorded so nothing silently grows)

MIDI/audio (the composer app owns the mock-up) · M1/M2 runtime
transposition (Phase E; the IR being semantic keeps it unblocked) ·
Section-1 mixed-strategy notation (slice 2 / Phase D) · engraving beauty
beyond proofing legibility · GC/cursor animation (E3 side project; its
data anchors are already in the IR) · the study score's graphic view and
beating lanes (Phase C).

## Standing verification

`node tools/ir_validate_battery.js` green before every commit · new red
mutations for every new validator/extractor check · layout/render snapshots
from B2 on · every "it works" claim demonstrated in the running page (the
browser pane), per AI_METHODOLOGY.
