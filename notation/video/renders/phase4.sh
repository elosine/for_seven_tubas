#!/usr/bin/env bash
# PHASE 4 — V-CUT. Rendered, not spliced: every frame first-generation.
# W2 (day 36 post-clear): --fade 5 --fadeMode cross, THE COMPOSER'S PICK from four test
# clips of one boundary. The AI had recommended dip: a cross superimposes the two
# sources and here they are the same notation at two scales, so the mid frame doubles
# the staff lines and splits the cursor. The composer watched all four and chose cross;
# 5 frames (0.17 s) halves the window where that shows. --fadeMode dip is still there.
# NOTE: grep needs --line-buffered (block-buffers to a file otherwise).
set -e
cd "$(dirname "$0")/../../.."
node tools/export_video.js --ir db1 --cut notation/video/cut-list.json --fps 30 --t1 760.63 --fade 5 --fadeMode cross \
  --audio notation/audio/piece-final-draft-001.wav \
  --out notation/video/renders/V-CUT.mp4 2>&1 | grep --line-buffered -E "^export_video|^  [0-9]+/|^done|^  cut|^  [0-9]+ pages"
echo "=== V-CUT DONE ==="
ls -la notation/video/renders/V-CUT.mp4
