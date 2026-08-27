#!/usr/bin/env bash
# PHASE 3 — the three renders (V-MAIN, ZOOM MASTER, and the two crops of it).
# t1 = 760.63 = page 63's window end: the cursor finishes its sweep exactly at
# the right edge, and 753->760.63 carries the final decay. All outputs share it,
# which is PHASE 5's duration-equality requirement.
set -e
cd "$(dirname "$0")/../../.."
T1=760.63
WAV=notation/audio/piece-final-draft-001.wav
OUT=notation/video/renders

echo "=== V-MAIN ==="
node tools/export_video.js --ir db1 --view video --fps 30 --t1 $T1 \
  --audio "$WAV" --out "$OUT/V-MAIN.mp4" 2>&1 | grep -E "^export_video|^  [0-9]+/|^done|^  [0-9]+ pages"

echo "=== ZOOM MASTER ==="
node tools/export_video.js --ir db1 --view zoom --z 2 --fps 30 --t1 $T1 \
  --audio "$WAV" --out "$OUT/ZOOM-MASTER.mp4" 2>&1 | grep -E "^export_video|^  [0-9]+/|^done|^  [0-9]+ pages"

echo "=== V-TOP / V-BOT — two crops, one pass ==="
ffmpeg -y -v error -i "$OUT/ZOOM-MASTER.mp4" \
  -filter_complex "[0:v]split=2[a][b];[a]crop=1920:1080:0:0[top];[b]crop=1920:1080:0:1080[bot]" \
  -map "[top]" -map 0:a -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a copy "$OUT/V-TOP.mp4" \
  -map "[bot]" -map 0:a -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p -c:a copy "$OUT/V-BOT.mp4"

echo "=== PHASE 3 DONE ==="
ls -la "$OUT"/*.mp4
