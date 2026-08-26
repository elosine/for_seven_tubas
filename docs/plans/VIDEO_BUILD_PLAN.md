# VIDEO BUILD PLAN — four outputs (day 36, 2026-08-26)

> Composer's ask: *"a regular zoomed out version, a zoomed in version with as
> much as the top half as possible, and another zoomed in version with as much
> of the bottom half as possible, then a cut version that has the main version
> and bits of the zoomed in version cut in at certain times. all versions with
> synced sound."*

## The four outputs

| id | what | frame | source |
|---|---|---|---|
| **V-MAIN** | all ten parts, the jury frame | 1920×1080 | `view=video` |
| **V-TOP** | T1–T5 filling the frame | 1920×1080 | crop of the zoom master |
| **V-BOT** | T6–T10 filling the frame | 1920×1080 | crop of the zoom master |
| **V-CUT** | V-MAIN with V-TOP/V-BOT cut in at chosen times | 1920×1080 | the three above + a cut list |

---

## THE TWO FACTS THAT MAKE THIS CHEAP

**1 · V-TOP and V-BOT are ONE render, cropped twice.** The built zoom is
`zoomCfg`: `heightPx × Z`, `window ÷ Z`, width unchanged. At **Z = 2** the page
is **1920 × 2160** and the staff is **63.2 px** — confirmed on screen:
`trance-a4 · ZOOM ×2 · page 1/22 · 750.4–756.2 s · staff 63.2px`. Ten lanes at
2× height in a 2160-tall page means **the top half IS T1–T5 and the bottom half
IS T6–T10, exactly.** So render the zoom master once and take two ffmpeg crops —
`crop=1920:1080:0:0` and `crop=1920:1080:0:1080`. No second render, no
`frameParts` work, and the two close-ups are guaranteed to agree with each other.

**2 · Every output is frame-synchronous by construction.** All views are drawn
from one transport `t`, and `attachAudio(el, 0)` fixes **WAV t=0 = score t=0**.
So frame *k* means the same musical instant in every version, and V-CUT is a
straight frame-for-frame splice with the master WAV laid under it untouched.
**Sync cannot drift, because nothing is ever re-timed.**

---

## WHAT ALREADY EXISTS — do not rebuild

- **video view** — locked 1920×1080, all ten lanes (PP-2), cursor, system turns
- **zoom view** — `coords.zoomCfg`, Z from `container.json realizations
  ['zoom-working'].zoomZ` (= 2); `⇆ video/zoom` flips at the same music position
- **transport** — play/pause/seek, `attachAudio(el, 0)`, injectable timebase
- **the audio convention** — `notation/audio/<scoreName>.wav|.mp3`, auto-detected;
  the `♪ render` button appears and slaves the clock to it. *The folder does not
  exist yet.*
- **`drawOverlayFrame(t)`** — already exposed as V4's export entry
- **the determinism contract** — `animobj` is `state(t) → SVG`, no wall-clock,
  guarded by a cold-seek-equals-play-through battery. **This is precisely the
  property a frame exporter needs, and it is already proven.**
- **`tools/export_midi.js`** — 21 tracks (T1…T10 + b-tracks), 60 BPM / 960 PPQ
  so one beat = one second
- **ffmpeg 8.1.1** on PATH
- **MAIN DRAFT `db1`** — the whole piece, 0–751 s, 4481 events

## WHAT IS MISSING

1. No piece MIDI export and **no rendered audio**
2. **The frame exporter (V4) — never built.** This is the real work.
3. **Rasterizer undecided** — resvg vs headless Chrome, to be settled by font
   fidelity, not preference
4. **No vertical pin for the zoom** — the app scrolls interactively; export needs
   it as a number (solved by the crop, above)
5. No cut list format and no assembly step

---

## PHASE 0 · AUDIO — blocks everything else

Nothing can be muxed until one master WAV exists, and it is also the only way to
prove sync before spending hours on frames.

- **0.1** `node tools/export_midi.js --score piece-final-draft-001` → `midi/`
- **0.2** *(composer)* Reaper render at **60 BPM**, one stereo WAV, no leading
  silence → `notation/audio/<scoreName>.wav`
  - ⚠ **name it for the score the PAGE names.** `db1.source.score` is
    `piece-s28`, so auto-detect looks for `piece-s28.wav`. Either name it that,
    or rebuild db1 against `piece-final-draft-001` first. **Decide before rendering.**
- **0.3** verify: duration ≈ **751.42 s**, first attack at **2.00 s**, and the
  MIDI's own last event matches. One measurement, not a listen.
- **0.4** **the sync proof**: open MAIN DRAFT in the app, hit `♪ render`, play.
  If the cursor tracks the sound here, every export inherits it. *Do this before
  Phase 2 — it is cheap and it de-risks everything.*

## PHASE 1 · DECIDE — before building (see "Decisions" below)

## PHASE 2 · THE FRAME EXPORTER — the real build

- **2.1 Rasterizer proof.** Render one busy frame (the trance PH6, ten lanes of
  ink, cuivré text, tuplet brackets) through both candidates and compare against
  the live app **on font fidelity** — Crimson Pro and the glyph set. Decide from
  the images. *The preplan already names this as the deciding criterion.*
- **2.2 `tools/export_video.js`.** For each frame `k`: `t = k/fps` → layout +
  render → SVG (the pure dual-load modules, in Node) → `animobj.frameSvg(t)`
  overlay → rasterize → **pipe straight into ffmpeg's stdin.**
  - ⚠ 751 s × 30 fps ≈ **22.5k frames per version**. Writing PNGs to disk would
    cost ~100 GB across the renders. **Pipe; never stage frames.**
- **2.3 Parameters:** `--ir db1 --view video|zoom --z 2 --fps N --t0 --t1
  --audio <wav> --out <mp4>`
- **2.4 Prove it:** two runs byte-identical (determinism), and N spot frames
  compared against the live app at the same `t`.

## PHASE 3 · THE THREE RENDERS

- **V-MAIN** — `--view video` → 1920×1080
- **ZOOM MASTER** — `--view zoom --z 2` → 1920×2160
- **V-TOP / V-BOT** — two ffmpeg crops of the master, in one pass

## PHASE 4 · THE CUT

- **4.1** the composer's cut list — a small data file, `[{t0, t1, src}]`, times
  in seconds
- **4.2** assemble by frame index from the finished renders; **audio comes from
  the master WAV untouched**, so V-CUT cannot drift
- **4.3** hard cuts, matching PP-3's hard-cut system turns. Crossfades only if asked.

## PHASE 5 · VERIFY

Duration equality across all four · A/V offset measured at start, middle and end
· spot frames vs the live app · the composer's eye.

---

## DECISIONS NEEDED

**D1 · The zoom's pace — the only real design question.**
`zoomCfg` divides the time span by Z, so at ×2 a close-up shows **~6 s per
system instead of 12** and the cursor sweeps at **double the on-screen rate**.
Cutting from V-MAIN to V-TOP therefore changes the visual pace as well as the
scale.

- **(a) Accept it — recommended.** It is what is already built, and it is
  principled: magnifying the ink without also spreading the time would leave the
  notes 2× bigger at unchanged spacing, which risks horizontal collisions in the
  dense material (the density builds, the trance at ~2.5 attacks/s). Cutting to
  a faster, closer view is also ordinary film grammar.
- **(b) Keep 12 s/system in the close-ups** — same pace, cuts don't change
  rhythm of motion. Needs a variant that magnifies vertically only, and the
  collision risk has to be measured before committing.

**D2 · Frame rate** — 30 or 60 fps. 30 halves the render time and is standard
for a score video; 60 makes the cursor visibly smoother. *Recommend 30.*

**D3 · Time scale** — `width` is currently a live control (12 s). The registry
holds `trance: 12, denseApex: 8` *per section*. One global value keeps the cut
simple; per-section means the page rate changes mid-video. *Recommend one global
12 s for all four outputs; revisit only if a section reads badly under motion.*

**D4 · What is on screen** — `META` overlay, `bricks`, part `solo` dimming.
*Recommend: META off, bricks off, no solo — the clean presentation frame.*

**D5 · The cut list** — which sections get a close-up, and top or bottom. I can
propose a first pass from the section boundaries (the material moves between
upper and lower parts in the morphs and the trance), for the composer to correct.

---

## RISKS, NAMED

| risk | mitigation |
|---|---|
| **font fidelity in the rasterizer** — the biggest quality risk | 2.1 decides it against a real proof before anything is built |
| 68k frames of I/O | pipe to ffmpeg stdin, never stage |
| audio/score name mismatch (`piece-s28` vs `piece-final-draft-001`) | settled in 0.2 before rendering |
| a long render failing at 90 % | `--t0/--t1` so any span can be re-rendered and re-concatenated |
| the zoom master is 1920×2160 — non-standard | it is an intermediate only; both deliverables are cropped to 1080 |
