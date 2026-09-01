#!/usr/bin/env bash
# demos.sh — the five per-pair YouTube demo videos (day 40 spec: PERFORMANCE_NOTES
# "DEMO VIDEOS — build spec"). Consults the existing pipeline throughout:
# export_video.js does every frame (statics via --probe, playbacks via --t0/--t1
# with --parts, audio aligned by the exporter's own -ss t0 mux).
#
#   bash notation/video/renders/demos.sh T1T2     one pair
#   bash notation/video/renders/demos.sh all      all five
#
# Structure per video (composer spec, day 40):
#   [Bloom static, label on image, 30 s peak-beating audio (day-40 revision)]
#   [whole Bloom section, two lanes, pair demo audio]
#   [1.5 s white gap]
#   [Convergence static, "N Hz" label, 30 s section-start audio]
#   [whole Convergence section]
# No minimums (composer: "too precise"), no Balance segment.
set -euo pipefail
cd "$(dirname "$0")/../../.."   # repo root

OUT=notation/video/renders/demos
TMP=$OUT/tmp
mkdir -p "$TMP"
# fontfile referenced RELATIVE so the filtergraph never sees a drive colon
cp -n /c/Windows/Fonts/georgia.ttf "$TMP/georgia.ttf" 2>/dev/null || true
FONT="$TMP/georgia.ttf"

# pair rows: NAME PARTS TUBA_A TUBA_B BLOOM_END BLOOM_PEAK CONV_END CONV_HZ BHELD CHELD BLOOM_HZ
# (ends = the pair's own last curve end, measured from the save; peaks and Hz
#  from the day-40 beating census — the same data as the chart. BHELD/CHELD =
#  offsets into demo-heldmax.wav, the option-b sustained-max dyads, one second
#  into each 32 s slot; see tools/gen_demo_heldmax_midi.js. BLOOM_HZ = the
#  pair's Bloom max beating, printed exactly as the chart prints it.)
ROWS=(
  "T1T2  0,1 1 2  253.5 179 378.0 9  11  211 2"
  "T3T4  2,3 3 4  255.3 186 380.3 13 51  251 2.6"
  "T5T6  4,5 5 6  253.6 188 381.1 18 91  291 3.3"
  "T7T8  6,7 7 8  252.4 176 381.8 27 131 331 4.3"
  "T9T10 8,9 9 10 258.0 182 381.9 36 171 371 5.4"
)

build_pair() {
  local NAME=$1 PARTS=$2 TA=$3 TB=$4 BEND=$5 BPEAK=$6 CEND=$7 CHZ=$8 BHELD=$9 CHELD=${10} BHZ=${11}
  local WAV=notation/audio/demo-$NAME.wav
  local HELD=notation/audio/demo-heldmax.wav
  [ -f "$HELD" ] || { echo "!! missing $HELD"; exit 1; }
  [ -f "$WAV" ] || { echo "!! missing $WAV"; exit 1; }
  echo "=== $NAME (Tuba $TA + Tuba $TB) ==="

  # ---- 1. probe stills (skipped when already present)
  if [ ! -f "$TMP/$NAME-bloom.png" ]; then
  node tools/export_video.js --parts "$PARTS" --probe "$BPEAK" --probeDir "$TMP" | tail -1
  mv "$TMP/db1_video_t${BPEAK/./-}"*.png "$TMP/$NAME-bloom.png" 2>/dev/null || \
    mv "$TMP"/db1_video_t*.png "$TMP/$NAME-bloom.png"
  node tools/export_video.js --parts "$PARTS" --probe 260.5 --probeDir "$TMP" | tail -1
  mv "$TMP/db1_video_t260-500.png" "$TMP/$NAME-conv.png"
  fi

  # ---- 2. static segments: 30 s, label on image, SUSTAINED-MAX audio
  # (option b, day 40: the dyad render demo-heldmax.wav, not the demo mix —
  #  the music never holds its maximum longer than ~15 s; the dyads do.)
  ffmpeg -y -v error -loop 1 -t 30 -i "$TMP/$NAME-bloom.png" -ss "$BHELD" -t 30 -i "$HELD" \
    -vf "drawtext=text='Bloom — $BHZ Hz — Tuba $TA + Tuba $TB':fontfile=$FONT:fontsize=58:fontcolor=black:x=70:y=48" \
    -c:v libx264 -crf 16 -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -shortest "$TMP/$NAME-s1.mp4"
  ffmpeg -y -v error -loop 1 -t 30 -i "$TMP/$NAME-conv.png" -ss "$CHELD" -t 30 -i "$HELD" \
    -vf "drawtext=text='Convergence — $CHZ Hz — Tuba $TA + Tuba $TB':fontfile=$FONT:fontsize=58:fontcolor=black:x=70:y=48" \
    -c:v libx264 -crf 16 -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -ar 48000 -shortest "$TMP/$NAME-s2.mp4"

  # ---- 3. section playbacks (skipped when already rendered)
  [ -f "$TMP/$NAME-bloom.mp4" ] || node tools/export_video.js --parts "$PARTS" --t0 141.4 --t1 "$BEND" --audio "$WAV" \
    --out "$TMP/$NAME-bloom.mp4" 2>&1 | grep --line-buffered -E "^export_video|^done|pages" | tail -2
  [ -f "$TMP/$NAME-convplay.mp4" ] || node tools/export_video.js --parts "$PARTS" --t0 259.6 --t1 "$CEND" --audio "$WAV" \
    --out "$TMP/$NAME-convplay.mp4" 2>&1 | grep --line-buffered -E "^export_video|^done|pages" | tail -2

  # ---- 4. the gap (white, silent, 1.5 s) — built once
  [ -f "$TMP/gap.mp4" ] || ffmpeg -y -v error \
    -f lavfi -i "color=white:s=1920x1080:r=30:d=1.5" \
    -f lavfi -t 1.5 -i "anullsrc=r=48000:cl=stereo" \
    -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest "$TMP/gap.mp4"

  # ---- 5. concat
  ffmpeg -y -v error \
    -i "$TMP/$NAME-s1.mp4" -i "$TMP/$NAME-bloom.mp4" -i "$TMP/gap.mp4" \
    -i "$TMP/$NAME-s2.mp4" -i "$TMP/$NAME-convplay.mp4" \
    -filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a][4:v][4:a]concat=n=5:v=1:a=1[v][a]" \
    -map "[v]" -map "[a]" -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k \
    "$OUT/demo-$NAME.mp4"
  echo "=== $OUT/demo-$NAME.mp4 DONE ==="
}

ARG="${1:-all}"
for row in "${ROWS[@]}"; do
  # shellcheck disable=SC2086
  set -- $row
  if [ "$1" = "$ARG" ] || [ "$ARG" = "all" ]; then build_pair "$@"; fi
done
