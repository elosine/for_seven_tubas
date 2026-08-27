# APPROVED 2026-08-27 — the submission fallback

**Composer, day 37 (2026-08-27), on V-CUT:** *"the cut looks good. and we can
keep that video. And if we can't resolve any of these outstanding issues, we can
still use it for the submission. So keep it, please."*

That closes PHASE 5's fifth criterion (the composer's eye), with one caveat the
composer named at the same time: the meters still show a green bleed (W1b, see
RUNNING_LOG day 37). This copy exists so later fixes can never cost the piece
its submittable video.

## What these five files are

The 2026-08-27 re-render: all five outputs, 22 819 frames each, carrying
- the compositor premultiply fix
- morph meters at fillOpacity 0.60 (A1)
- transitions --fade 5 --fadeMode cross
- cut seed 71 (2/2/2 across BLOOM · CONVERGENCE · BALANCE, +2 trance)
- audio notation/audio/piece-final-draft-001.wav

`cut-list-seed71.json` is the exact cut list used.

## The revert point for everything else

Engine, registry, IR and score are git-tracked and were CLEAN at commit

    00c20c4

To reproduce these renders exactly: check out that commit, `npm install`, then
`notation/video/renders/phase3.sh` + `phase4.sh`.

**Do not delete this folder without the composer's say-so.** The render scripts
write to `renders/`, never here.
