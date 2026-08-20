# DELIVERABLES BUILD PLAN — the video-score container + exports

> Drawn 2026-08-20 (day 20, second sitting) from
> `PENN_STATE_DELIVERABLES_PREPLAN.md` (decision slate PP-1…PP-6, three-tier
> taxonomy §3, architecture evaluation §8). **STATUS: READY, NOT STARTED.**
> Composer's sequencing: phase shifting → finish the piece → **run this plan**
> → part-by-part notation from the beginning of the piece. No implementation
> before the composer's go (D35). PLAN.md item **8a**.

## What this plan delivers

- The **two-window container** (video view 1920×1080 + zoom view) that ALL
  tier-2 notation work is previewed in.
- **Transport + sweeping cursor** — the scoped animation subset (NOT Phase
  E / D45).
- The **trial-insertion loop** (section → IR → picker) at working speed.
- The two **export pipelines**: video (frame render + ffmpeg + Reaper audio)
  and PDF (Letter landscape).
- The **polish ledger** and the tier-3 fine-tooth-comb pass at the very end.

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
extremes).

Decisions to close (= preplan §5 drill-down + §3 tier-1 list):
1. **Lane config / track height** — header height, paddings, gaps (start from
   ~80 px header → ~100 px/part; proof 2–3 candidates).
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

**Gate G1:** composer flips between the windows on a real section; confirms
by eye that zoomed = the final, bigger.

## V2 — TRANSPORT + CURSOR (the scoped animation subset)

- **Clock:** play/pause/seek; when a Reaper-render audio file is loaded, the
  clock SLAVES to `audio.currentTime` (sync exact by construction); without
  audio, `performance.now`.
- **Cursor:** `view.xOfSeconds(t)` per animation frame; **system turn** when
  the clock crosses `page.t1`, behavior per V0 decision 4.
- **Scope fence:** no leader/follower, no per-part cursors, no GC bouncing
  ball, no networked sync — all D45 territory.

**Gate G2:** composer plays a section with audio and the onsets land on the
cursor by eye; one mechanical spot-check (known onset time vs cursor x).

## V3 — TRIAL-INSERTION LOOP (tier-2 working speed)

- **One command:** score name + time window + extraction profile → IR file +
  picker entry (wraps `tools/ir_extract.js`; profiles: trance, section1,
  unresolved-fallback). Unhandled material renders as parachute bricks BY
  DESIGN — mixed fidelity always ships.
- **Create the polish ledger:** `docs/NOTATION_POLISH.md` (tier-3 intake;
  working rule printed at its head: micro-defects are FILED, never discussed
  mid-notation — D18).

**Gate G3:** composer runs the loop on a fresh section start-to-preview with
at most one prompt.

## V4 — VIDEO EXPORT (deliverable pipeline)

- **Deterministic frame render:** t = k/fps → layout/render SVG → rasterize →
  pipe to ffmpeg (installed: 8.1.1 full build, on PATH) → mux the Reaper WAV.
  fps 60 default (drop to 30 only if proofs show no cursor-smoothness loss at
  V0's px/s).
- **Rasterizer decision** (@resvg/resvg-js vs headless Chrome): whichever
  embeds the V0 font faithfully — proof is a frame-vs-app pixel comparison.
- **Sync proof:** 30 s onset-dense excerpt; known onset times land within
  ±1 frame of the cursor.

**Gate G4:** the 30 s excerpt .mp4 approved (look + sync) BEFORE any
full-piece render.

## V5 — PDF EXPORT

- mm-based view (Letter landscape 279.4×215.9 mm; margins from
  `container.json`); `planPages` at the print seconds-per-system; SVG pages →
  PDF (same rasterizer-family decision as V4, judged on font fidelity).
- Title page, page numbers, part labels on every page.

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
  Time scale → V0.3 · Polish ledger + pass → V3/POL · Scoped animation → V2 ·
  Video pipeline → V4 · PDF pipeline → V5 · Architecture check → done
  (preplan §8).

## What this plan does NOT do (fences)

- **No Phase E / performance runtime** (D45): no leader/follower, no GC ball,
  no iPad versions, no responsive layouts, no M1/M2 at load.
- **No glyph-vocabulary expansion** beyond what V0 proofs need. New devices
  (tuplet numerals m≥3, double flags/beams, open heads/values, hairpins,
  tremolo sine figure, morph/gliss notation, release devices M3/P3) are
  TIER-2 material-time work, built per material during part-by-part notation.
- No study/conductor-score revamp; no rehearsal scenarios (preplan §4).

## Risk notes

- **Font fidelity in rasterization** is the classic export trap — both export
  gates carry pixel/print proofs for exactly this reason.
- **Label/header presentation is measured, never assumed** (D41 corollary;
  the hardcoded-marker-font trap is in memory and in this codebase today).
- **Full-piece IR coverage grows part by part**; the container renders mixed
  fidelity throughout (parachute). The FINAL video needs every section at
  approved fidelity — that is tier-2's exit condition, not this plan's.
