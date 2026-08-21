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

> *2026-08-20, same sitting: all covered — the plan is drawn:
> `docs/plans/DELIVERABLES_BUILD_PLAN.md` (V0–V5 + POL). §8 below is the
> architecture evaluation that grounds it.*

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

## 8. Architecture evaluation (2026-08-20 — read against PP-1…PP-6)

**VERDICT: NOT a new build.** The four-strata architecture holds exactly as
designed; the two windows are VIEW CONFIGS over proven modules. The genuinely
new work is three self-contained components (transport+cursor, video export,
PDF export) plus app-shell growth. Files read: `notation/lib/coords.js`,
`splice.js`, `layout.js`, `render.js`, `graphic.js`, `extract_core.js`
(header), `app/notation.html`, `registry/page_rules.json`.

**EXISTS, PARAMETER-READY (config, not code):**
- `coords.js makeView({widthPx, heightPx, window, systems, ssPerSystem})` —
  the locked 1920×1080 video view is literally a config. **PP-6's invariant
  is guaranteed by construction:** ss is lane-relative (SZ-7), all px derive
  from the view — zoom Z = same systems, heightPx×Z, window span ÷Z → every
  coordinate scales exactly ×Z. Provable mechanically, not hoped.
- `splice.js planPages(ir, rules, pageSeconds)` — seconds-per-system is a
  parameter; the zoom re-cut = `planPages(pageSeconds/Z)`. Page-edge behavior
  already rules-as-data (`page_rules.json`).
- `layout.js` — VIEW-INDEPENDENT (seconds + ss only), so video, zoom and
  print all share one layout model; overlays (spelling/dynamic/instruction)
  already render; parachute bricks guarantee mixed fidelity ships.
- `render.js` — pure model+view→SVG; print reuses it with a mm-scaled view.
- IR pipeline — schema+validator+battery, extractor profiles (trance,
  section1), IR picker in the app. The trial-insertion loop works at the
  data level today.
- Graphic view with META overlay + D28 beating lane; `/notation` mount on
  :5200 (verified live day 20).

**NEEDS MODIFICATION (targeted, in `notation.html` shell only):**
- The app is currently responsive-width (`clientWidth`) with hardcoded
  110 px/system and manual window/pages browsing. Needs: a **video mode**
  (locked 1920×1080, header band, lanes from the container spec) and a
  **zoom mode** (PP-6: ×Z view + re-cut pages + vertical scroll shell).
  The lib modules do not change.
- META overlay exists in `graphic.js` only → port into the notation view
  (semi-transparent, per PP-2).
- Header: markers currently draw INSIDE the SVG at hardcoded y=12/font 10 —
  placeholder, not a header. Real header band is V0/V1 work; label
  presentation measured, never assumed (D41 corollary + the renderMarker
  trap in memory).

**NEW BUILDS (the real work, all scoped):**
1. **Transport + cursor** — the app has ZERO animation today. Clock
   (play/pause/seek; slaved to an `<audio>` element playing the Reaper
   render when present), cursor = `view.xOfSeconds(t)` per frame, system
   turn when the clock crosses `page.t1`. Small and self-contained; the
   scoped subset, explicitly NOT Phase E (D45).
2. **Video export** — deterministic frame render (t=k/fps → SVG →
   rasterize) → ffmpeg mux with the Reaper WAV. **ffmpeg 8.1.1 full build
   is already installed and on PATH.** Rasterizer choice (resvg vs headless
   Chrome) decided by font fidelity at build time.
3. **PDF export** — mm-based view (Letter landscape), margins, title/page
   numbers, SVG pages → PDF. Same rasterizer-family decision.
4. **Polish ledger** — a doc + working rule; trivial.

**Deliberately NOT in this build (tier-2 material-time work):** glyph
vocabulary growth — open noteheads/values, tuplet numerals m≥3, double
flags/beams, hairpins, tremolo sine figure (2j), morph/gliss notation,
release devices (M3/P3). Current inventory (filled heads, 8th flags,
accidentals, staccato dots, bass clef, beams/stems/ledgers, M4 attack
lines, GC ticks, bricks) renders the slice-1 + section-1 material; new
devices get built per material during part-by-part notation, with the
parachute carrying everything else meanwhile.

### §8 addendum — the typesetting question (composer, same sitting)

Composer: adjustments like notehead size or stem height, and future
"fonts," must be accommodated by the STRUCTURES — *"this is more like
typesetting, really… kerning and whatever other things."*

Assessment against the code:
- **The typesetting architecture is already right in kind.** Glyph metrics
  are DATA in staff-space units (`glyphs.json`: widths + anchor points),
  stamps are metric boxes positioned by anchor (`stamps.js`), attachment
  (stem→head) derives from the head's anchors, and every layout item
  carries a `dxSs` fine-offset channel — the structural "kerning" channel
  exists on every item. Horizontal position is proportional TIME by design,
  so classical duration-spacing kerning does not apply here; fine offsets
  and collision fixes ride `dxSs`.
- **The one real gap: engraving numbers are SCATTERED.** Some live in
  `glyphs.json standards` (staff/stem/beam/ledger thickness, dot size),
  some as `layout.js` code defaults (stemLen 3.5, accGap 0.25, the
  text-lane heights), some as inline `render.js` multipliers (label and
  text sizes). Today "slightly bigger noteheads" or "longer stems" is a
  CODE edit. **Closed by plan amendment:** V0 gains the ENGRAVING REGISTRY
  (one typography block in `container.json`, censused from the code); V1
  wires layout/render to read it and writes the glyph extension contract.
  After that, such adjustments are data edits that re-render everywhere —
  set at tier 1, freely adjustable at tier 3 (POL).
- **New "fonts" are accommodated by the model as it stands:** the
  box+anchors+staff-space scheme is exactly how SMuFL music-font metadata
  describes glyphs, so a real engraving font (Bravura et al.) could back
  the same stamps later — a `glyphs.json` regeneration, not a rebuild. New
  glyph KINDS have a fixed, small extension path (metrics entry + stamp
  maker + renderer case + layout emitter), documented as part of V1.

### §8 second addendum — the composer's plan interrogation (2026-08-20, day 21, before implementation)

The composer pressed three points before the go; each was checked against
the CODE (this repo's `notation/lib/*` + both prior repos' performance
apps), and the build plan carries the amendments as **[A21]** items.

**1. THE ANIMATED OBJECTS WERE A MISS — now V2's core.** Composer: this
score will use *"probably all of the animated objects"* from the previous
two scores — wave-curve/curve following (glissandi, crescendos), **GCs**
(beat grids for play-along; single-shot events — as already discussed under
M5), the line-wedge object, etc. The original plan fenced the GC ball out
as "D45 territory" — that conflated ANIMATION with INTERACTIVITY. Re-cut:
animated objects on the shared fixed timeline are IN this build; what stays
severed (D45) is interactivity — leader/follower, per-player views,
networked sync, rehearsal controls.
**Code finding that makes this cheap:** both prior performance apps share
ONE overlay inventory — **GC ball · curve follower · line-wedge meter ·
motive pie** — and every draw is already a function of
`currentDisplayTimeSec` (piece #1/#2 `performance_canvas_patches.js`;
piece #1's GC data model: impact/start/end, stiffness, damping, ictus,
descentRatio). So the V2 contract — every animated object = pure
`state(t) → SVG` — is a PORT of proven code, not a new design, and it is
exactly the property V4's deterministic frame render requires. Print
counterparts exist as precedent too (piece #1 `compose_pages.js` prints GC
arcs), so the PDF side is covered by V0 decision 11 + V5.

**2. BUILD-NOW-REFINE-LATER made structural.** The composer's observed
draft defects (beam direction wrong, ink protruding into a neighbor lane)
must be fixable LATER without code. Code findings: beam direction is a
hard-coded convention in `layout.js` (farthest-from-middle, ties down);
`dxSs` exists on every item but no authored per-item override reaches it;
the overlay pipeline WARNS on unknown kinds rather than dropping them —
the extension point is waiting. Amendments: the **engraving-override
overlay kind** (stem force · beam split · dx/dy nudge · size) in V1, and
the **protrusion detector** auto-filing to the polish ledger in V3. Tier-3
polish becomes data edits working a machine-fed ledger.

**3. THE TRACK-HEIGHT THOUGHT EXPERIMENT (architecture probe, not a
decision).** Findings: `makeView` already accepts arbitrary per-part lane
fractions — irregular heights are representable by construction — but the
`systemsForParts` generator only emits EQUAL bands, and `ssPerSystem` is
one global, so today a taller lane necessarily means a proportionally
bigger staff. Amendments (V1): per-part weights in the generator; optional
per-lane `ssPerSystem` so lane height and staff scale are independent;
the PP-6 Z-test extended to irregular configs; and the px boundary (only
`coords.js` computes pixels) asserted mechanically — the invariant that
retires the viewport-math bug class from previous pieces. Because layout
is view-independent (seconds + ss only), ANY track-height regime — video,
zoom, print, future part extraction or conductor⇄part conversion — is a
lane-config + view edit; part-score derivation itself stays D45.

*(The "fixed width, scroll downward" memory: nothing was nixed — it split
by window. The VIDEO view is all-parts-in-frame with no scrolling (it is a
video); the ZOOM view scrolls vertically. PP-2/PP-6 stand.)*
