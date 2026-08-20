# PENN STATE DELIVERABLES — PREPLAN

> Captured 2026-08-20 (day 20, second sitting) from the composer's session-start
> dictation; verbatim passages in COMPOSER_LOG same date. **Status: PREPLAN.**
> Decisions taken here feed the eventual plan; nothing is built now — the
> composer moves to the phase-shifting sitting next, and this work waits until
> the piece is finished. **Read this doc first when sitting down to draw the
> actual plan.**

## 1. The three deliverables (Penn State, due Sept 4)

1. **Recording** — rendered from the MIDI (Reaper). No format decisions needed.
2. **Screen-following video** — FIXED FORMAT, 1080p HD = **1920×1080 px**.
3. **PDF full score** — print-format pagination of the same strips.

## 2. The working method (composer's design)

- **Finish the piece first** (phase-shifting sitting → structures → assembly).
- Then notation development **part by part, section by section**: for each,
  figure out how it is notated, look at examples, take decisions, and build
  whatever machinery is missing. The toolbox mostly exists (PLAN §7 strata,
  slice-1 pipeline B1–B6, study score v0, Phase D mixed strategy).
- **The container principle (why this preplan exists):** the two fixed formats
  get decided UP FRONT so every notation trial is previewed **in the container
  it ships in** — real track heights, staff size, clipping, scrolling-cursor
  animation. Directly analogous to inserting sandbox-type files into the
  composer score and seeing/hearing them in real time. Composer's example: the
  density build section — *"I'll say, let's try this, and we can insert into
  the video score. I can see it the way it will eventually look."*
- The video container **eventually becomes the study score** — but parameters
  stay TIGHT until after submission: one fixed format, nothing responsive.

## 3. Scope fence — DEFERRED until piece + paper are submitted

- Study/conductor score proper: the real workout, notation↔graphic switching
  polish, "getting the graphic score really working."
- Group-ensemble rehearsal scenarios (e.g. *"make the beating a little faster
  at marker number five"* as a rehearsal-time operation).
- The performance-score revamp = **D45's severed project** (individual
  rehearsal version, iPad practice version, ensemble variants).
- Different screen sizes · portrait vs landscape · any responsive layout.

## 4. Decision slate (verdicts recorded as taken; OPEN until then)

- **PP-1 — Video frame** — confirm 1920×1080 (16:9), authored at exactly that
  logical size (SVG stays crisp if recorded at 2×). — **OPEN**
- **PP-2 — Vertical layout** — all 10 parts always in frame vs a windowed
  subset; where the META/graphic layer sits (overlay vs own lane vs absent).
  — **OPEN**
- **PP-3 — Motion model** — stationary system + sweeping cursor with page/system
  turns, vs continuous tape scroll past a fixed playhead, vs a two-system
  hybrid. — **OPEN**
- **PP-4 — Print page** — size + orientation (Letter landscape / Letter
  portrait / Tabloid). — **OPEN**
- **PP-5 — Sizing method** — track heights and staff size DERIVED from the
  fixed frame budget (not chosen freely), with exact numbers proven visually
  at plan time. — **OPEN**

## 5. Feasibility arithmetic (for the discussion; the plan proves it visually)

- **Screen:** 1080 px − ~80 px header (title/markers/timecode) ≈ 1000 px →
  **~100 px per part** ×10. Staff ≈ 40 px tall (10 px per space) leaves
  ~30 px above/below for ledgers, dynamics, labels. Comparable to standard
  scrolling-score videos watched fullscreen.
- **Print, Letter landscape:** ~190 mm printable height → ~19 mm per part →
  ~6 mm staves (≈ rastral 5) — normal large-ensemble full-score size, one
  10-part system per page.
- **Print, Letter portrait:** ~240 mm printable → ~24 mm per part → ~7 mm
  staves; roomier, but shorter systems → more pages.
- Exact numbers are a PLAN deliverable, decided against rendered proofs at
  true size (AI_METHODOLOGY: verified in the running app / by eye).

## 6. Requirements the PLAN must cover

- **Video view** in the notation app at exactly 1920×1080: fixed frame, track
  heights per PP-2, motion per PP-3.
- **Trial-insertion path:** load any section's IR/render into the video
  container and play it with the animation — the composer-score insert loop,
  ported to notation trials. This is the container the composer previews
  EVERYTHING in, tests and final score alike.
- **Horizontal time scale (px/s on screen; seconds-per-system in print)** —
  a core container parameter next to track height; possibly per-section;
  decided with proofs (the density apex and the trance section need different
  answers or one honest compromise).
- **Scoped animation subset:** the scrolling cursor + timeline sync needed FOR
  VIDEO RENDERING ONLY. Explicitly NOT the severed Phase E runtime (D45
  stands) — this is a non-interactive rendering of one fixed view.
- **Video production pipeline** (decide in plan): deterministic frame-by-frame
  render + ffmpeg mux against the Reaper audio (exact sync) vs screen capture
  (simpler, drop-frame risk).
- **PDF pipeline:** strips → pages at the PP-4 format (B6 splicing already
  paginates); margins/staff size with printed-size proofs.
- **Architecture double-check (composer asked for this explicitly):** inventory
  what exists (IR, coords, glyphs, layout passes, render, splice, study-score
  views) vs what needs building or modifying (fixed-viewport view config,
  cursor animation, the two export pipelines).
