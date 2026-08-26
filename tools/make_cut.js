#!/usr/bin/env node
// make_cut.js — build a randomized cut list for the video (day 36, composer:
// "can you produce a randomized cut? if the 2 zoomed versions take up about
// 25-33% of the time in like around 20-30 second segments, spaced out").
//
//   node tools/make_cut.js [--seed N] [--frac 0.29] [--min 20] [--max 30]
//                          [--dur 751.92] [--lead 40] [--tail 45] [--gap 25]
//                          [--fps 30] [--out notation/video/cut-list.json]
//
// SEEDED, so a cut can be reproduced or re-rolled by changing one number.
// Emits both seconds and FRAME INDICES: every video is generated from the same
// transport t at the same fps, so a cut is a frame-for-frame splice and the
// master WAV is laid under it untouched — sync cannot drift.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };

const SEED = +arg('seed', 7);
const FRAC = +arg('frac', 0.29);      // share of the running time in close-up
const MIN = +arg('min', 20);          // segment length bounds, seconds
const MAX = +arg('max', 30);
const DUR = +arg('dur', 751.92);      // the master WAV's length
const LEAD = +arg('lead', 40);        // stay wide at the start
const TAIL = +arg('tail', 45);        // stay wide at the end
const GAP = +arg('gap', 25);          // minimum wide stretch between close-ups
const FPS = +arg('fps', 30);
const OUT = arg('out', 'notation/video/cut-list.json');

// mulberry32 — small, seeded, reproducible
function rng(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);

// the piece's sections, for reporting WHERE each close-up lands
const SECTIONS = [
  [2.00, 34.65, 'opening gesture'], [36.19, 46.40, 'clouds I/D'],
  [48.05, 52.46, 'octave long tones'], [55.94, 80.03, 'density build 2'],
  [81.75, 110.62, 'INT2 blasts'], [113.00, 135.34, 'density build 3'],
  [141.39, 258.03, 'BLOOM'], [259.56, 381.91, 'CONVERGENCE'],
  [386.68, 495.27, 'BALANCE'], [499.83, 751.42, 'TRANCE'],
];
const where = (a, b) => {
  const hit = SECTIONS.filter(s => b > s[0] && a < s[1]).map(s => s[2]);
  return hit.length ? hit.join(' + ') : 'rest';
};

// ---- place the close-ups
const target = DUR * FRAC;
const usable = DUR - LEAD - TAIL;
const segs = [];
let placed = 0, guard = 0;
while (placed < target && guard++ < 10000) {
  const len = MIN + rand() * (MAX - MIN);
  if (placed + len > target * 1.06) break;              // don't overshoot the band
  // candidate start, respecting the lead-in and every existing segment's gap
  let ok = false, t0 = 0;
  for (let tries = 0; tries < 400 && !ok; tries++) {
    t0 = LEAD + rand() * (usable - len);
    ok = segs.every(s => t0 >= s.t1 + GAP || t0 + len <= s.t0 - GAP);
  }
  if (!ok) break;                                        // no room left at this spacing
  segs.push({ t0, t1: t0 + len });
  placed += len;
}
segs.sort((a, b) => a.t0 - b.t0);

// ---- assign TOP / BOTTOM: random, but never three of a kind in a row
let prev = null, run = 0;
for (const s of segs) {
  let pick = rand() < 0.5 ? 'top' : 'bottom';
  if (pick === prev && run >= 2) pick = pick === 'top' ? 'bottom' : 'top';
  run = pick === prev ? run + 1 : 1;
  prev = pick;
  s.src = pick === 'top' ? 'V-TOP' : 'V-BOT';
}

// ---- build the full timeline: V-MAIN everywhere else
const f = t => Math.round(t * FPS);
const timeline = [];
let cur = 0;
for (const s of segs) {
  if (s.t0 > cur) timeline.push({ t0: cur, t1: s.t0, src: 'V-MAIN' });
  timeline.push({ t0: s.t0, t1: s.t1, src: s.src });
  cur = s.t1;
}
if (cur < DUR) timeline.push({ t0: cur, t1: DUR, src: 'V-MAIN' });
timeline.forEach(x => { x.f0 = f(x.t0); x.f1 = f(x.t1); });

const zoomT = segs.reduce((a, s) => a + (s.t1 - s.t0), 0);
const doc = {
  _note: 'Randomized cut list. Every source video is generated from the same transport t at the same fps, '
    + 'so this is a frame-for-frame splice and the master WAV is laid under it untouched.',
  seed: SEED, fps: FPS, durationSeconds: DUR,
  closeUpSeconds: +zoomT.toFixed(2),
  closeUpFraction: +(zoomT / DUR).toFixed(4),
  segments: segs.length,
  params: { frac: FRAC, minSeg: MIN, maxSeg: MAX, lead: LEAD, tail: TAIL, gap: GAP },
  timeline,
};
fs.mkdirSync(path.join(ROOT, path.dirname(OUT)), { recursive: true });
fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(doc, null, 1));

// ---- report
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
console.log('CUT LIST  seed ' + SEED + '  ·  ' + FPS + ' fps  ·  master ' + DUR.toFixed(2) + ' s');
console.log('  ' + segs.length + ' close-ups, ' + zoomT.toFixed(1) + ' s = '
  + (100 * zoomT / DUR).toFixed(1) + '% of the running time'
  + '   (asked: 25-33%, ' + MIN + '-' + MAX + ' s each)');
console.log('  lengths ' + segs.map(s => (s.t1 - s.t0).toFixed(0)).join(', ') + ' s');
console.log('');
console.log('  #   start     end      len   source   frames            lands in');
segs.forEach((s, i) => {
  console.log('  ' + String(i + 1).padStart(2) + '  ' + mmss(s.t0).padStart(6) + '  ' + mmss(s.t1).padStart(6)
    + '  ' + (s.t1 - s.t0).toFixed(1).padStart(6) + '   ' + s.src.padEnd(7)
    + '  ' + String(f(s.t0)).padStart(6) + '-' + String(f(s.t1)).padEnd(7)
    + '  ' + where(s.t0, s.t1));
});
const gaps = segs.slice(1).map((s, i) => s.t0 - segs[i].t1);
console.log('');
console.log('  wide stretches between close-ups: ' + gaps.map(g => g.toFixed(0)).join(', ') + ' s');
console.log('  opens wide for ' + segs[0].t0.toFixed(0) + ' s, closes wide for '
  + (DUR - segs[segs.length - 1].t1).toFixed(0) + ' s');
console.log('\nwrote ' + OUT + '  (' + timeline.length + ' timeline entries)');
