#!/usr/bin/env bash
# PHASE 4 — V-CUT. Rendered, not spliced: every frame first-generation.
# NOTE: grep needs --line-buffered (block-buffers to a file otherwise).
set -e
cd "$(dirname "$0")/../../.."
node tools/export_video.js --ir db1 --cut notation/video/cut-list.json --fps 30 --t1 760.63 \
  --audio notation/audio/piece-final-draft-001.wav \
  --out notation/video/renders/V-CUT.mp4 2>&1 | grep --line-buffered -E "^export_video|^  [0-9]+/|^done|^  cut|^  [0-9]+ pages"
echo "=== V-CUT DONE ==="
ls -la notation/video/renders/V-CUT.mp4
