# PENN STATE DELIVERABLES — PREPLAN

> Captured 2026-08-20 (day 20, second sitting) from the composer's session-start
> dictation; verbatim passages in COMPOSER_LOG same date, including two
> same-sitting amendments (PP-6 two windows; the §3 decision taxonomy).
> **Status: PREPLAN.** Decisions taken here feed the eventual plan; nothing is
> built now — the composer moves to the phase-shifting sitting next, and this
> work waits until the piece is finished. **Read this doc first when sitting
> down to draw the actual plan.**

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

## 3. THE DECISION TAXONOMY — three tiers (composer, same sitting; governs the plan's phasing)

*The composer's clarification, dictated; verbatim in COMPOSER_LOG. The point:
"eliminate as many of the decisions upfront that will completely change the way
the notation looks" so that during notation "everything's already coming in the
way it should look" — and "save all the little details till the end."*

- **TIER 1 — LOOK-DEFINING decisions → taken UP FRONT (this preplan + the
  plan's first phase).** Anything that would wholesale change how the notation
  looks: the frame and windows (PP-1/PP-6), track heights and part count in
  frame (PP-2), staff size, horizontal time scale (px/s), system cutting and
  turns (PP-3), print format (PP-4), header, fonts/glyph scale, cursor style,
  META overlay presence and styling, margins/gutters. **The plan's first phase
  is "close tier 1"** — each item decided against true-size proofs before
  part-by-part notation begins.
- **TIER 2 — NOTATION-CONTENT decisions → taken DURING the part-by-part
  work.** What the notation IS for each material: strategy per chunk, devices,
  spelling, beaming — judged inside the locked container, at final spacing and
  aspect ratio, via the zoom view. **Micro-layout is explicitly out of scope
  in this tier**: defects get FILED to the polish ledger, not fixed and not
  discussed, unless one actually blocks reading the material.
- **TIER 3 — THE POLISH PASS → at the END, fine-tooth comb.** After everything
  is notated, one significant pass over the micro details — borders,
  inter-part crowding, ledger-line creep into the next part, collisions,
  pixel-level spacing — until *"it looks exactly how I want."* An explicit,
  planned phase, not an afterthought.

**The tension this taxonomy resolves (composer's words):** spacing and
performability judgments are only valid *"if I'm actually looking at what…
the jury will actually be looking at"* — but building notation needs a zoomed
view. **PP-6's invariant is the reconciliation:** the zoom is a uniform
magnification of the same geometry, so a judgment made zoomed holds at final
size, and the 1080 video view stays one click away for the true-final check.

**Mechanism — the polish ledger:** during tier 2, every micro-defect (spotted
by composer or AI) goes to a notation-specific NITS-style ledger with a pointer
to where it is visible (score, section, timestamp). The tier-3 pass works the
ledger. **AI working rule (D18 applied to notation): micro-layout issues are
filed, never surfaced as decisions mid-notation.**

**Boundary note (composer):** this container is composer/jury-facing (video +
paper) and will *flow into* the performance score later — but the
performer-facing rehearsal/performance versions are the severed project (D45)
and will likely look *"dramatically different."* Performer requirements do NOT
constrain tier-1 decisions here.

## 4. Scope fence — DEFERRED until piece + paper are submitted

- Study/conductor score proper: the real workout, notation↔graphic switching
  polish, "getting the graphic score really working."
- Group-ensemble rehearsal scenarios (e.g. *"make the beating a little faster
  at marker number five"* as a rehearsal-time operation).
- The performance-score revamp = **D45's severed project** (individual
  rehearsal version, iPad practice version, ensemble variants).
- Different screen sizes · portrait vs landscape · any responsive layout.

## 5. Decision slate

*2026-08-20, same sitting: composer adopted the recommendations below
PROVISIONALLY ("let's go with your recommendations plus any amendments") —
drill-down pending; nothing final until then. The two-window amendment (PP-6)
came from the composer's second dictation (verbatim in COMPOSER_LOG).*

- **PP-1 — Final frame = 1920×1080** (16:9), authored at exactly that logical
  size; SVG, so a 2× recording costs nothing. — **ADOPTED (provisional)**
- **PP-6 — ONE GEOMETRY, TWO WINDOWS** *(the composer's amendment)*: the locked
  1080 **video view** (all parts, the frame the video is made from) + a
  **zoom view** for working — a uniform magnification of the SAME layout
  (every track identical dimensions, just bigger). Rules: **vertical scroll
  allowed, horizontal NEVER scrolls during playback** — so at zoom Z the
  systems are re-cut to 1/Z of the time span, keeping each zoomed system
  full-width with the cursor sweeping inside the frame. (Plain magnification
  without the re-cut would clip the system horizontally and force panning
  mid-animation — exactly what the composer excluded.) Pagination-is-a-view
  (§7b) makes the re-cut cheap; the zoom is a magnifier, not a second format —
  what is approved zoomed is what ships. — **ADOPTED (provisional)**
- **PP-2 — All 10 parts always in the video frame** (~100 px per part after a
  ~80 px header); META/graphic layer as a semi-transparent overlay. In the
  zoom view fewer parts fit → vertical scroll. — **ADOPTED (provisional)**
- **PP-3 — Motion model: stationary system + sweeping cursor, with system
  turns** (reuses B6 splicing; cursor = time→x on the proportional grid; turns
  prefer chunk boundaries). Reinforced by PP-6: it is the only model where
  "no horizontal motion of the viewport" holds in both windows. — **ADOPTED
  (provisional)**
- **PP-4 — Print: Letter landscape** — ~19 mm/part → ~6 mm staves, one 10-part
  system per page; jury-friendly on screens. Other formats can return
  post-submission since pagination is a view. — **ADOPTED (provisional)**
- **PP-5 — Sizing method: track heights + staff size DERIVED from the frame
  budgets** (not chosen freely); exact numbers proven by eye on true-size
  renders at plan time. — **ADOPTED (provisional)**

**Drill-down queue (next — these are all TIER 1 items):** zoom factor(s) — one
fixed Z (e.g. 2×) or steps · parts visible in the zoom window · header contents
(title/markers/timecode) · system-turn behavior (hard turn vs two-system swap
with lookahead) · horizontal time scale px/s (per-section or global) · META
overlay styling.

## 6. Feasibility arithmetic (for the discussion; the plan proves it visually)

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

## 7. Requirements the PLAN must cover

- **Close tier 1 first (§3):** the plan's opening phase enumerates every
  look-defining parameter and decides each against true-size proofs BEFORE
  part-by-part notation begins.
- **Video view** in the notation app at exactly 1920×1080: fixed frame, track
  heights per PP-2, motion per PP-3.
- **Zoom view** per PP-6: uniform magnification, re-cut systems, vertical
  scroll only; one click between the two windows.
- **Trial-insertion path:** load any section's IR/render into the video
  container and play it with the animation — the composer-score insert loop,
  ported to notation trials. This is the container the composer previews
  EVERYTHING in, tests and final score alike.
- **Horizontal time scale (px/s on screen; seconds-per-system in print)** —
  a core container parameter next to track height; possibly per-section;
  decided with proofs (the density apex and the trance section need different
  answers or one honest compromise).
- **The polish ledger + tier-3 pass (§3):** a notation-specific NITS-style
  ledger fed throughout tier 2; the fine-tooth-comb pass is the plan's LAST
  phase before deliverable export.
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
