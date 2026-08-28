# APPROVED 2026-08-27 — THE SUBMISSION COPY

**Composer, day 37, on the first cut:** *"the cut looks good. and we can keep
that video."* — and, after the W1b re-render: **"video good, good to replace."**

So this folder holds the **post-W1b** renders, and PHASE 5 is closed 5/5 with no
outstanding caveat. (The earlier pre-W1b set that briefly lived here was the
fallback for exactly the defect that is now fixed; it was replaced on the
composer's instruction, not deleted by accident.)

## What these five files are

All five outputs, **22 819 frames each**, carrying

- the compositor premultiply fix (resvg returns premultiplied RGBA)
- morph meters at `fillOpacity` 0.60 (A1)
- transitions `--fade 5 --fadeMode cross`
- cut **seed 71** (2/2/2 across BLOOM · CONVERGENCE · BALANCE, +2 trance)
- **W1b's ownership rule** — where a half-lane section meter owns the lane,
  per-event full-lane `curveMeter`s stand down. This is what removed the green
  bleed at ~300 s and ~450 s. The trance's fullHeight crescendo keeps its meters.
- audio `notation/audio/piece-final-draft-001.wav`

`cut-list-seed71.json` is the exact cut list, and is byte-identical to the
committed `notation/video/cut-list.json`.

| | | frames |
|---|---|---|
| V-CUT 1920×1080 | 65.9 MB | 22 819 |
| V-MAIN 1920×1080 | 65.4 MB | 22 819 |
| ZOOM MASTER 1920×2160 | 90.1 MB | 22 819 |
| V-TOP / V-BOT 1920×1080 | 59.2 / 61.5 MB | 22 819 |

## Measured, not asserted

`notation/video/renders/phase5.sh` re-runs every measured criterion in one
command: duration equality, A/V offset, cut sources, and the **animated layer**
read straight out of the finished mp4 (`--dumpPage` proves the STATIC page only,
which is how the compositor bug once passed). It also checks that
`renders/` still matches THIS folder — if it does not, something was re-rendered
and never re-approved.

## The revert point

The W1b fix landed in

    b4b7cb4

**Verified, not assumed:** between `b4b7cb4` and the commit that replaced these
files, the only change under `tools/ notation/{lib,registry,ir,app,audio} scores/`
is the addition of `tools/arch_shape.js` — an unrelated paper-measurement tool
that no render path touches. **So these renders reproduce from either commit.**

To reproduce: check out `b4b7cb4`, `npm install`, then
`notation/video/renders/phase3.sh` + `phase4.sh` (~21.4 min).

**Do not delete this folder without the composer's say-so.** The render scripts
write to `renders/`, never here.
