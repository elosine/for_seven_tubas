#!/usr/bin/env bash
# PHASE 5 — the measured criteria, one command (first written day 37, after the
# W1b re-render; before this the checks were ad-hoc and the animated-layer probe
# survived only in a dead session's temp dir).
#
# 1 duration equality  all five 22 819 frames; video spread ~0.325 ms; audio 760.618 s
# 2 A/V offset         start_time 0.000000 on both streams of all five
# 3 cut sources        V-CUT vs expected source < 1 %; vs wrong sources 20-62 %
#                      (sub-1 % residual = V-CUT is first-generation, D78)
# 4 animated layer     meter colour read out of the finished mp4 (verify_film.js);
#                      --dumpPage proves the STATIC page only — the premultiply
#                      bug lived in composite(), which statics never touch
# A  (conditional)    renders/ vs the approved archive at four probe times.
#                      Day 37 used this to PROVE the W1b removal (bleed frames
#                      differed, trance control identical). The composer then
#                      approved the new set and it REPLACED the archive, so the
#                      expectation inverted: all four must now be IDENTICAL.
#                      A non-zero row means something was re-rendered and never
#                      re-approved -- which is the whole point of keeping it.
# 5 the composer's eye — not a script.
set -e
cd "$(dirname "$0")/../../.."
R=notation/video/renders
A=notation/video/approved/2026-08-27-submission
F=$R/phase5_frames          # *.png is gitignored under notation/video/
mkdir -p "$F"

echo "=== 1+2: streams (video: start_time,duration,nb_frames | audio: start_time,duration) ==="
for f in V-MAIN ZOOM-MASTER V-TOP V-BOT V-CUT; do
  v=$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames,start_time,duration -of csv=p=0 "$R/$f.mp4")
  a=$(ffprobe -v error -select_streams a:0 -show_entries stream=start_time,duration -of csv=p=0 "$R/$f.mp4")
  echo "$f  v[$v]  a[$a]"
done

echo "=== extracting frames ==="
X() { ffmpeg -y -v error -ss "$1" -i "$2" -frames:v 1 "$F/$3.png"; }
for t in 120 155 250; do
  X $t "$R/V-CUT.mp4"  "cut-$t"
  X $t "$R/V-MAIN.mp4" "main-$t"
  X $t "$R/V-TOP.mp4"  "top-$t"
  X $t "$R/V-BOT.mp4"  "bot-$t"
done
X 200 "$R/V-MAIN.mp4" "main-200"

echo "=== 3: cut sources (V-CUT vs each candidate; expected < 1 %) ==="
for t in 120 155 250; do
  for src in main top bot; do
    echo -n "t=$t vs $src:  "
    node "$R/pxdiff.js" "$F/cut-$t.png" "$F/$src-$t.png"
  done
done

if [ -d "$A" ]; then
  echo "=== A: renders/ vs approved archive (ALL FOUR must read 0.00 %) ==="
  for t in 302.50 303.01 450.00 730.00; do
    X $t "$R/V-MAIN.mp4" "new-$t"
    X $t "$A/V-MAIN.mp4" "old-$t"
    echo -n "t=$t:  "
    node "$R/pxdiff.js" "$F/new-$t.png" "$F/old-$t.png"
  done
  echo "  (the two probes at ~303 and ~450 are the old W1b bleed frames; t=730 the"
  echo "   trance control. Non-zero => renders/ has drifted from the approved copy.)"
fi

echo "=== 4: animated layer (meter colour in the film vs the app) ==="
node "$R/verify_film.js" "$F/main-200.png"
