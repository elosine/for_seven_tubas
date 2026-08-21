# DELIVERABLES BUILD PLAN — the video-score container + exports

> Drawn 2026-08-20 (day 20, second sitting) from
> `PENN_STATE_DELIVERABLES_PREPLAN.md` (decision slate PP-1…PP-6, three-tier
> taxonomy §3, architecture evaluation §8). **STATUS: READY, NOT STARTED.**
> Composer's sequencing: phase shifting → finish the piece → **run this plan**
> → part-by-part notation from the beginning of the piece. No implementation
> before the composer's go (D35). PLAN.md item **8a**.
>
> **AMENDED 2026-08-20 (day 21, plan-interrogation sitting)** after the
> composer pressed on three points before implementation: (1) this is THE
> ARCHITECTURAL PASS — structures must be right so nothing later forces a
> recursive rebuild; (2) build-now-refine-later must be structurally
> supported (per-item engraving overrides, not code edits); (3) **the
> animated graphic objects from the previous two scores ARE in this score**
> — the original V2 fence cut them out at the wrong joint. Details in
> preplan §8 second addendum. Amendments marked **[A21]** below.

## Where this sits in the §7 architecture **[A21b]**

*(Added 2026-08-20 after the composer's second interrogation point: this
score must REJOIN the one-score-many-realizations architecture — "all synced
to the same timeline… each of these scores are realizations of the dataset"
— not become a separate system beside it.)*

**The video/paper score = three more MANIFESTATIONS of the four-strata
spine** (PLAN §7 amendment: one data spine · composition data → derived
data → notation IR → renderers/runtimes). The video view, zoom view, and
print view are stratum-4 VIEW CONFIGS over the same strata 1–3 everything
else reads — same S1, same IR, same coords/layout/render modules the study
score already uses. Three invariants make "same system" binding rather than
aspirational:

1. **ONE TIMELINE.** Every realization keys to S1's timecode in seconds —
   `view.xOfSeconds(t)` is the only bridge to space, and no realization may
   introduce a private timebase. The video's audio-slaved clock REPORTS
   positions on that same timeline; so will D45's networked clock.
2. **THE CLOCK IS AN INTERFACE, NOT AN ENGINE.** Transport implementations
   differ per realization (here: local, audio-slaved; performance score:
   networked/WebSocket-synced, D45) — but they implement one interface
   (now / play / pause / seek, in S1 seconds), and **everything downstream
   (cursor, animated objects, system turns) consumes `t` and never reads a
   clock source directly**. Swapping the transport swaps the sync
   machinery; zero notation or animation code changes. That is the seam
   the two "different animation engines" share — the engine is the same,
   only the timekeeper differs.
3. **A REALIZATION IS A CONFIG, NOT A FORK.** `container.json` is
   structured as named REALIZATION entries (video-jury · zoom-working ·
   print-letter), each = view config + transport binding + device set +
   styling. The composer's anticipated "modified conductor score — this
   one plus extra bells and whistles" is then a FOURTH entry (extra
   overlays/device set over the same strata), and the performance score's
   realizations are later entries with the networked transport — never a
   parallel codebase.

Animated objects obey the strata too: each declares which stratum feeds it
(GC devices are already IR data — `layout.js` consumes `devices[].kind ===
'gc'` today; envelope/wave-curve follows read S1; beating curves read
stratum 2) — no side files, no second dataset.

## What this plan delivers

- The **two-window container** (video view 1920×1080 + zoom view) that ALL
  tier-2 notation work is previewed in.
- **Transport + sweeping cursor + the ANIMATED OBJECT LAYER** — the
  animated notation vocabulary inherited from pieces #1/#2 (GC · curve
  follower · line-wedge meter · envelope/wave-curve following), ported onto
  the deterministic clock. **[A21]** What stays out is D45's INTERACTIVE
  runtime, not animation itself.
- The **trial-insertion loop** (section → IR → picker) at working speed.
- The two **export pipelines**: video (frame render + ffmpeg + Reaper audio)
  and PDF (Letter landscape).
- The **polish ledger** and the tier-3 fine-tooth-comb pass at the very end.
- **[A21] The refinement channels**: per-item engraving overrides in the IR
  overlay vocabulary, so tier-3 polish is data edits, never code edits.

## Sequencing constraint

**V0 → V1 → V2 → V3 must complete BEFORE part-by-part notation starts** —
they ARE the container. V4/V5 are needed only by submission and may land any
time after V1. POL runs last, after all notation.

---

## V0 — CLOSE TIER 1 (the decision phase; produces the container spec)

Deliverable: **`notation/registry/container.json`** — every look-defining
number, decided by the composer's EYE against true-size proofs rendered at
exactly 1920×1080 (and a printed page for the print side). Proofs are cheap
renders of REAL material (a trance window + the density apex — the two
extremes). **[A21b]** Structured as named REALIZATION entries from day one
(`video-jury` · `zoom-working` · `print-letter`), each = view config +
transport binding + device set + styling — so a later conductor-score or
performance realization is a new entry over the same strata, never a fork
(§ "Where this sits" invariant 3). Shared typography/engraving lives once;
entries override only what differs.

Decisions to close (= preplan §5 drill-down + §3 tier-1 list):
1. **Lane config / track height** — header height, paddings, gaps (start from
   ~80 px header → ~100 px/part; proof 2–3 candidates). **[A21] Lane heights
   are PER-PART DATA from the start** (a weights array; equal is the default
   config, not the only shape) — irregular track heights, and later part/
   conductor conversions, are lane-config edits, never layout changes.
2. **Staff size in the lane** — `ssPerSystem` ladder (e.g. 10 / 12 / 14;
   current default 12).
3. **Horizontal time scale** — seconds-per-system (= px/s at 1920 wide);
   proof on BOTH trance and apex; decide global vs per-section.
4. **System-turn behavior** — hard cut vs two-system swap with lookahead
   (mock both, composer picks by watching).
5. **Zoom factor Z** — one fixed (2× candidate) vs 2–3 steps.
6. **Header content + typography** — title / markers / timecode. Label
   presentation MEASURED, never assumed (D41 corollary; render.js markers are
   a y=12/font-10 placeholder today).
7. **THE FONT** — notation text, labels, tempo marks. Look-defining AND it
   constrains V4/V5 (the rasterizer must embed it faithfully).
8. **META overlay styling** in the video view (opacity/color; ported from
   graphic.js).
9. **Print numbers** — Letter-landscape margins, staff mm, seconds-per-system;
   proof = one printed page the composer holds.
10. **The ENGRAVING REGISTRY** *(typesetting amendment, composer 2026-08-20 —
   preplan §8 addendum)*: census every engraving number now living in code —
   `layout.js` defaults (stemLen 3.5, accGap 0.25, text-lane heights) and
   `render.js` inline text-size multipliers — and consolidate them with
   `glyphs.json standards` into ONE typography block of `container.json`.
   After this, "noteheads a touch bigger / stems longer" is a data edit that
   re-renders everywhere — set at tier 1, adjustable at POL, never a code
   edit.
11a. **[A21c] THE PREFATORY GUTTER** *(composer finding on the round-1
   proofs: a first note sitting ON the bass clef)*: untimed dead space at
   the system's left edge — the view maps time onto `[gutterPx, 1920]`,
   gutter CONTENT is per page as rules-as-data (clef, or nothing — not
   every page opens with one), and **the cursor enters at the music start,
   never sweeping the dead area** (same at any right-edge dead space).
   V0 decides the gutter width by proof; V1 gives `makeView` the music
   region; V2's cursor honors it. Replaces render.js's pin-clef-at-x=0
   placeholder.
11. **[A21] The ANIMATED-OBJECT VOCABULARY + styling** — which animated
   objects ship in this score's video view (starting inventory = the shared
   overlay set of BOTH prior performance apps: **GC ball · curve follower ·
   line-wedge meter · motive pie**, plus this piece's envelope/wave-curve
   following for crescendos and glissandi), their look (ball size/color,
   follower dot, wedge/donut style, stroke weights — into the engraving
   registry), and each object's **static PRINT COUNTERPART** for the PDF
   (precedent: piece #1 `compose_pages.js` already prints GC arcs + ictus
   marks). Styling only at V0 — the working contract and ports are V2.

**Gate G0:** composer blesses `container.json`; numbers FROZEN. Later change
requests are tier-3 ledger items unless structural.

## V1 — THE TWO WINDOWS (app-shell work; lib modules unchanged)

- **Video mode** in `notation.html`: locked 1920×1080 sheet (kills the
  responsive `clientWidth` sizing in this mode), header band, lanes and
  spacing from `container.json`, META overlay ported into the notation view.
- **Zoom mode** (PP-6): same layout model; view `heightPx×Z`,
  `planPages(pageSeconds/Z)`, vertical-scroll shell; one-click toggle
  video↔zoom that preserves the current time position.
- **The PP-6 invariant as a TEST, not a hope** (Principle 6 — see it go red):
  render one window at Z=1 and Z=2, assert every drawn coordinate scales
  exactly ×Z; prove the test by mutating `ssPerSystem` and watching it fail.
- **Wire layout/render to the V0 engraving registry** (no engraving magic
  numbers left in code) and write the GLYPH EXTENSION CONTRACT one-pager:
  a new glyph kind = a `glyphs.json` metrics box (ss-unit width + anchors) +
  a `stamps.js` maker + one renderer case + a layout emitter. The
  box+anchors+ss model is SMuFL-shaped, so a real engraving font (Bravura
  et al.) can back the same stamps later from its metadata — a glyphs.json
  regeneration, not a rebuild.
- **[A21] LANE FLEXIBILITY in coords.js** (the architectural-pass items —
  small, verified against the code 2026-08-20):
  - `systemsForParts` gains **per-part weights** (equal stays the default);
    `makeView` already accepts arbitrary `laneFrac` pairs, so consumers do
    not change.
  - **Decouple lane height from staff scale**: optional per-lane
    `ssPerSystem` (today it is one global — a taller lane necessarily means
    a proportionally bigger staff; "taller lane, same staff, more air" must
    be expressible for parts with high ledgers or graphic material).
  - Extend the PP-6 Z-test to an IRREGULAR lane config (not just uniform).
  - **The px boundary as a test**: no module other than `coords.js` computes
    pixels from seconds/ss — the invariant that kills the viewport-math
    class of bug from previous pieces. Assert it mechanically (source scan
    for px math outside coords + a two-view remap check).
- **[A21] The ENGRAVING-OVERRIDE CHANNEL** (build-now-refine-later, made
  structural): a new authored overlay kind in the IR vocabulary —
  per-target **stem-direction force · beam split/join · dxSs/dySs nudge ·
  size scale** — consumed by `layout.js` beside spelling/dynamic/
  instruction. The composer's observed defects (beam direction wrong, notes
  protruding into a neighbor lane) become DATA fixes filed at tier 3, never
  code edits. The unknown-overlay path already WARNS rather than drops, so
  overrides authored before the consumer exists are visible, not lost.

**Gate G1:** composer flips between the windows on a real section; confirms
by eye that zoomed = the final, bigger. **[A21]** Plus: one render with an
irregular lane config, and one engraving override (a forced stem direction)
visibly applied.

## V2 — TRANSPORT + CURSOR + THE ANIMATED OBJECT LAYER **[A21]**

*(Retitled by the day-21 amendment. The original fence — "no GC bouncing
ball, all D45 territory" — cut at the wrong joint: it conflated ANIMATION
with INTERACTIVITY. The composer will use the animated graphic objects from
the previous two scores in THIS score — GCs for beat grids and single-shot
events, curve/wave-curve following for glissandi and crescendos, line
wedges, etc. The video deliverable itself needs them; they ride the same
clock as the cursor.)*

- **Clock:** play/pause/seek; when a Reaper-render audio file is loaded, the
  clock SLAVES to `audio.currentTime` (sync exact by construction); without
  audio, `performance.now`. **[A21b] Built as the first implementation of
  the CLOCK INTERFACE** (§ "Where this sits" invariant 2): transport
  exposes now/play/pause/seek in S1 seconds; cursor, system turns, and
  every animated object take `t` as an argument and NEVER read the clock
  source directly. Enforced the same way as the px boundary: a source
  check that `audio.currentTime` / `performance.now` appear only inside
  the transport module. D45's networked transport later implements the
  same interface — the sync machinery swaps, nothing downstream changes.
- **Cursor:** `view.xOfSeconds(t)` per animation frame; **system turn** when
  the clock crosses `page.t1`, behavior per V0 decision 4.
- **The ANIMATED-OBJECT CONTRACT** (the architectural core of this phase):
  every animated object is a **pure function `state(t) → drawable
  primitives`** — no wall-clock reads, no frame-to-frame accumulated state —
  registered per object kind (the animated sibling of the glyph extension
  contract). This single property is what makes the SAME objects work in
  the live app (rAF loop calls state(t)) and in V4's deterministic frame
  render (t = k/fps calls state(t)) with zero divergence. **Verified
  feasible 2026-08-20:** both prior performance apps already draw their
  entire overlay set from `currentDisplayTimeSec` (piece #1/#2
  `performance_canvas_patches.js`: `calculateBallPositionForPage(gc, t, …)`,
  `_drawCurveFollower(…, t, …)`, `_drawLineWedgeMeter(…, t, …)`) — the port
  is canvas→SVG/registry mechanics, not a redesign.
- **The PORTS** (initial inventory, per V0 decision 11): **GC ball**
  (piece #1 data model: impact/start/end seconds, stiffness, damping,
  ictus, descentRatio — port + extend per M5) · **curve follower** ·
  **line-wedge meter** · **envelope/wave-curve following** (this piece's
  waveCurve node envelopes as the followed curve — the crescendo/glissando
  reading) · motive pie if V0 keeps it.
- **Determinism test (Principle 6 — see it go red):** render state(T) after
  playing 0→T frame-by-frame AND from a cold seek straight to T; assert
  identical output. Prove the test catches violations by feeding it a
  deliberately stateful object.
- **Scope fence (re-cut):** no leader/follower, no per-part or per-player
  cursors, no networked/multi-device sync, no interactive rehearsal
  controls — THAT is D45 territory. Animated notation objects rendered on
  the shared fixed timeline are IN.

**Gate G2:** composer plays a section with audio and the onsets land on the
cursor by eye; one mechanical spot-check (known onset time vs cursor x).
**[A21]** Plus: a GC and a curve follower running on real material, and the
determinism test green (after having been seen red).

## V3 — TRIAL-INSERTION LOOP (tier-2 working speed)

- **One command:** score name + time window + extraction profile → IR file +
  picker entry (wraps `tools/ir_extract.js`; profiles: trance, section1,
  unresolved-fallback). Unhandled material renders as parachute bricks BY
  DESIGN — mixed fidelity always ships.
- **Create the polish ledger:** `docs/NOTATION_POLISH.md` (tier-3 intake;
  working rule printed at its head: micro-defects are FILED, never discussed
  mid-notation — D18).
- **[A21] The PROTRUSION DETECTOR** (auto-filing, AI-side): a geometric pass
  over any render that files ledger items when ink leaves its lane band
  (stems/ledgers/beams crossing into a neighbor part — the defect the
  composer already spotted in the conductor-score draft) or items overlap.
  Detection is automatic and silent; FIXES are tier-3 work via the V1
  engraving-override channel or accepted air. Keeps D18: the composer is
  never asked about micro-layout mid-notation.

**Gate G3:** composer runs the loop on a fresh section start-to-preview with
at most one prompt.

## V4 — VIDEO EXPORT (deliverable pipeline)

- **Deterministic frame render:** t = k/fps → layout/render SVG → rasterize →
  pipe to ffmpeg (installed: 8.1.1 full build, on PATH) → mux the Reaper WAV.
  fps 60 default (drop to 30 only if proofs show no cursor-smoothness loss at
  V0's px/s).
- **Rasterizer decision** (@resvg/resvg-js vs headless Chrome): whichever
  embeds the V0 font faithfully — proof is a frame-vs-app pixel comparison.
  **[A21]** The comparison frame must include ANIMATED objects mid-flight
  (a GC ball between ictus points, a follower on a curve) — the V2
  determinism contract is what makes this provable at all.
- **Sync proof:** 30 s onset-dense excerpt; known onset times land within
  ±1 frame of the cursor. **[A21]** Include at least one GC landing: the
  ball's impact frame vs the audio onset is the tightest sync check the
  system has.

**Gate G4:** the 30 s excerpt .mp4 approved (look + sync) BEFORE any
full-piece render.

## V5 — PDF EXPORT

- mm-based view (Letter landscape 279.4×215.9 mm; margins from
  `container.json`); `planPages` at the print seconds-per-system; SVG pages →
  PDF (same rasterizer-family decision as V4, judged on font fidelity).
- Title page, page numbers, part labels on every page.
- **[A21] Static print counterparts of the animated objects** (per V0
  decision 11): each animated device has a defined frozen form on paper —
  GC = printed arc + ictus mark (piece #1 `compose_pages.js` precedent),
  followers = the curve itself, wedges = their printed wedge/hairpin form.
  The PDF must never silently omit something the video shows.

**Gate G5:** one printed page approved at true size, then the full-score PDF.

## POL — TIER-3 POLISH PASS (last, after ALL notation)

- Work `docs/NOTATION_POLISH.md` fine-tooth-comb WITH the composer; every
  item fixed or explicitly waived; re-run V4 + V5 exports; bundle the three
  deliverables (recording · video · PDF).

**Gate G6:** composer signs off — *"it looks exactly how I want"* — and the
submission bundle exists.

---

## Requirements traceability (preplan §7 → phases)

- Video view at 1920×1080 → V1 · Zoom view → V1 · Trial-insertion → V3 ·
  Time scale → V0.3 · Polish ledger + pass → V3/POL · Scoped animation +
  animated objects → V2 · Video pipeline → V4 · PDF pipeline → V5 ·
  Architecture check → done (preplan §8 + second addendum) · **[A21]**
  Lane flexibility + px boundary + engraving overrides → V1 · Animated
  vocabulary + styling + print counterparts → V0.11/V2/V5 · Protrusion
  detector → V3.

## What this plan does NOT do (fences)

- **No Phase E / performance runtime** (D45, boundary re-cut by [A21]): no
  leader/follower, no per-player cursors, no networked/multi-device sync,
  no interactive rehearsal controls, no iPad versions, no responsive
  layouts, no M1/M2 at load. **Animated notation objects on the shared
  fixed timeline (GC, followers, wedges) are IN — see V2.** The severed
  D45 project inherits the V2 contract rather than rebuilding it.
  **[A21b]** More precisely: D45 inherits the WHOLE stack — strata 1–3,
  coords/layout/render, the animated-object registry, the clock
  interface — and adds new realization entries plus a networked transport
  implementation. What is severed is a PROJECT boundary, not a system
  boundary: one system, same logic, different realization configs.
- **No glyph-vocabulary expansion** beyond what V0 proofs need. New devices
  (tuplet numerals m≥3, double flags/beams, open heads/values, hairpins,
  tremolo sine figure, morph/gliss notation, release devices M3/P3) are
  TIER-2 material-time work, built per material during part-by-part
  notation. **[A21]** Animated devices invented at tier 2 (e.g. 2j's sine
  figure with ball/fill animation) are instances of the V2 contract — the
  contract is the architecture, the devices grow per material.
- No study/conductor-score revamp; no rehearsal scenarios (preplan §4).

## Risk notes

- **Font fidelity in rasterization** is the classic export trap — both export
  gates carry pixel/print proofs for exactly this reason.
- **Label/header presentation is measured, never assumed** (D41 corollary;
  the hardcoded-marker-font trap is in memory and in this codebase today).
- **Full-piece IR coverage grows part by part**; the container renders mixed
  fidelity throughout (parachute). The FINAL video needs every section at
  approved fidelity — that is tier-2's exit condition, not this plan's.
