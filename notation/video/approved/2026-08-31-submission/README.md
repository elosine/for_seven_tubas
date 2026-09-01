# APPROVED 2026-08-31 — THE SUBMISSION COPY (supersedes 2026-08-27)

**Composer, day 40, on today's re-render:** *"That v cut is fine. It's good.
Let's use that."*

This folder holds the **day-40 re-renders** — the same five outputs as the
2026-08-27 set, re-rendered after the proofread batch-1 fixes landed:

- **#2 cuivré text gap** — techText clearance 0.15 → 0.3 ss (20 marks raised)
- **#3 T1 @ 78.49** — cl-50 rebuilt with `--dyn 1:f,5:mf` (5 overlays)
- **#4 curveMeter shadow** — `fillOpacity` 0.3 → 0.6, and W1b's ownership
  rule extended to fullHeight crescendos (per-event meters stand down under
  the final-crescendo section follower — the t=730 doubling)

## Measured, not asserted

`phase5.sh` ran against this set on day 40: **morph probes 0.00 %**, and the
**t=730 probe differs from the 2026-08-27 archive BY THE FIX** — that delta is
the change, expected and on the record (RUNNING_LOG day 40). All five files
were `cmp`-verified **byte-identical to `renders/`** at archive time.

`cut-list-seed71.json` is copied from the committed
`notation/video/cut-list.json`, unchanged since the 08-27 set.

## The five files

V-CUT (the composed final cut — the watch/submit file) · V-MAIN ·
ZOOM-MASTER (1920×2160) · V-TOP · V-BOT. Audio
`notation/audio/piece-final-draft-001.wav` throughout.

## Housekeeping

- `notation/video/approved/2026-08-27-submission/` stays untouched — it is
  the pre-fix approved set and its own README still applies to it.
- `phase5.sh`'s archive drift check points HERE now.
- To reproduce: the day-40 tree (`375e2db` or later that day),
  `phase3.sh` + `phase4.sh` (~21.4 min).

**Do not delete this folder without the composer's say-so.** The render
scripts write to `renders/`, never here.
