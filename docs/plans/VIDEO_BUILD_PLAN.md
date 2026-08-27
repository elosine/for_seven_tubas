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

- ~~**0.1** export the MIDI~~ **DONE day 36** — `midi/piece-final-draft-001.mid`, **21 tracks (tempo + T1, T1b … T10, T10b)**, 4481 notes (matching the score and the page exactly), 25 755 CC, 4408 bends, 751.92 s. Read-back verified against the compiled events.
- ~~**0.2** Reaper render at 60 BPM~~ **DONE day 36** — `notation/audio/piece-final-draft-001.wav`, **2 ch / 48 000 Hz / 24-bit, 762.000 s**. Session at `TEMPO 60` with one envelope point; 20 MIDI items one per Tuba track, all `POSITION 0`. *The first render clipped (**Peak +4.2 dBFS, Clip >999**) because the pre-flight measured the trance crescendo — sustained loudness, not transient peak; master −6 → **−13.5** fixed it. Plain gain, no limiter: LRA 19.8 is the piece.*
- ~~**0.3** verify duration / first attack~~ **DONE day 36** — measured off the PCM, not listened to: data 219 456 000 B → **762.000 s exactly**; **digital silence until 2.0319 s** against `db1`'s first onset **2.0000 s**. The **32 ms** is the sampler's leading transient, constant, not drift.
- ~~**0.4** the sync proof~~ **DONE day 36** — composer, on MAIN DRAFT with the render attached: *"sync is very good"*. The auto-detect handshake is live (`GET /api/notation/renders` → the file; `db1.source.score` names the same save).

**PHASE 0 IS CLOSED.**

## PHASE 1 · DECIDE — before building (see "Decisions" below)

## PHASE 2 · THE FRAME EXPORTER — the real build

- **2.1 Rasterizer proof.** Render one busy frame (the trance PH6, ten lanes of
  ink, cuivré text, tuplet brackets) through both candidates and compare against
  the live app **on font fidelity** — Crimson Pro and the glyph set. Decide from
  the images. *The preplan already names this as the deciding criterion.*
- **2.2 `tools/export_video.js`.** For each frame `k`: `t = k/fps` → layout +
  render → SVG (the pure dual-load modules, in Node) → `animobj.frameSvg(t)`
  overlay → rasterize → **pipe straight into ffmpeg's stdin.**
  - 751 s × 30 fps ≈ **22.5k frames per version**, ~68k across the three renders.
    *(Corrected: staged PNGs would be roughly **15–35 GB**, not the 100 GB first
    quoted — line art compresses well. Still pipe: it avoids the disk churn and
    the cleanup, and it is one command instead of two.)*
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

## DECISIONS — ANSWERED (composer, day 36)

| | |
|---|---|
| **D1 · zoom pace** | **(a) accept it.** The close-ups run at ~6 s/system and sweep at 2× — what is already built, and it keeps the ink-to-spacing ratio honest |
| **D2 · frame rate** | **30 fps** |
| **D3 · time scale** | **one global 12 s** for all four outputs |
| **D4 · on screen** | **META off, bricks off**, no solo dimming |
| **D5 · the cut** | **randomized**, ~25–33 % of the running time in ~20–30 s segments, spaced out — built, see below |
| **the score name** | **settled.** `db1` rebuilt against `piece-final-draft-001`; proven identical once the name is normalised away (4483 occurrences = one per event + header + provenance). MIDI, page and audio now all say one name |

## THE CUT LIST — built (`tools/make_cut.js`, seed 11)

`notation/video/cut-list.json` — **9 close-ups, 222.4 s = 29.6 % of the running
time**, segments 22–27 s, wide stretches of 26–89 s between them. Opens wide for
91 s and closes wide for 59 s, so the final crescendo stays on the full ensemble.
TOP 5 / BOT 4, four in the first half and five in the second.

**Seeded and reproducible** — `--seed N` re-rolls the whole thing in a second,
`--frac`, `--min/--max`, `--gap`, `--lead/--tail` move the constraints. The file
carries **frame indices as well as seconds**, because the splice is frame-for-frame.

Constraints applied: never three of the same close-up in a row · a minimum wide
stretch between segments · nothing in the lead-in or the tail.

## RISKS, NAMED

| risk | mitigation |
|---|---|
| **font fidelity in the rasterizer** — the biggest quality risk | 2.1 decides it against a real proof before anything is built |
| 68k frames of I/O | pipe to ffmpeg stdin, never stage |
| audio/score name mismatch (`piece-s28` vs `piece-final-draft-001`) | settled in 0.2 before rendering |
| a long render failing at 90 % | `--t0/--t1` so any span can be re-rendered and re-concatenated |
| the zoom master is 1920×2160 — non-standard | it is an intermediate only; both deliverables are cropped to 1080 |
