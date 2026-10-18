#!/usr/bin/env node
// make_filmcheck.js — the FILM CHECK clip (3.8): settles, with a phone camera,
// whether a browser really shows every frame of a 60 fps video (Safari's own
// counters disagreed: ~53/s by its frame callbacks, ~35/s by its decoder).
//
//   node testkit/make_filmcheck.js            -> testkit/assets/filmcheck.mp4 (30 s, 60 fps)
//
// The picture is built to be counted from a slow-motion film:
//   FAST BAR  a white bar steps one place EVERY FRAME across 60 places (wraps
//             each second) — every displayed frame has a distinct position, so
//             a skipped frame is a double step and a held frame is a stall
//   SLOW BAR  steps one place per second — which second we are in
//   a white border marks the edge of the picture for framing the shot
// testkit/analyze_filmcheck.py reads the film back.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const W = 480, H = 270, FPS = 60, SECONDS = 30, STEP = 8, BAR = 6;   // drawn at 1/4 size, scaled ×4 (nearest)
const FAST = [Math.round(H * 0.28), Math.round(H * 0.62)], SLOW = [Math.round(H * 0.72), Math.round(H * 0.88)];

function frame(n) {
  const b = Buffer.alloc(W * H);
  const bar = (rows, idx) => {
    const x0 = 1 + idx * STEP;
    for (let y = rows[0]; y < rows[1]; y++) b.fill(255, y * W + x0, y * W + x0 + BAR);
  };
  bar(FAST, n % 60);
  bar(SLOW, Math.floor(n / 60) % 60);
  for (let x = 0; x < W; x++) { b[x] = 255; b[(H - 1) * W + x] = 255; }
  for (let y = 0; y < H; y++) { b[y * W] = 255; b[y * W + W - 1] = 255; }
  return b;
}

function build(outDir) {
  const out = path.join(outDir || path.join(__dirname, 'assets'), 'filmcheck.mp4');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', W + 'x' + H, '-r', String(FPS), '-i', 'pipe:0',
      '-vf', 'scale=1920:1080:flags=neighbor', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-g', String(FPS), '-keyint_min', String(FPS), '-sc_threshold', '0', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', reject);
    ff.on('close', code => code === 0 ? resolve(out) : reject(new Error('ffmpeg exit ' + code)));
    let n = 0;
    const total = FPS * SECONDS;
    (function pump() {
      while (n < total) { if (!ff.stdin.write(frame(n++))) { ff.stdin.once('drain', pump); return; } }
      ff.stdin.end();
    })();
  });
}

module.exports = { build, W, H, FPS, SECONDS, STEP, BAR, FAST, SLOW, frame };
if (require.main === module) {
  build().then(out => console.log('film check clip: ' + out + ' (' + (fs.statSync(out).size / 1048576).toFixed(2) + ' MB, ' + SECONDS + ' s at ' + FPS + ' fps)'))
    .catch(e => { console.error('make_filmcheck failed: ' + e.message); process.exit(1); });
}
