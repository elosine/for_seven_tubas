// cres_back.js — cressand-14 (composer 2026-08-13): anchor the MINIMUM gap at
// the old tuba7->tuba8 distance (0.44 s) and run the curve BACKWARDS from it —
// each earlier gap a step bigger, ten parts total. Then, same file, the same
// exercise with less backwards movement: total span 30% shorter (same 0.44
// min, gentler growth). Everything else pinned from -13: rise 2.07 s,
// true-cliff fall, percussive slopes, unison F2.

const fs = require('fs');

// ---- DIALS ----
const N = 10;
const GAP_MIN = 0.44;          // the old 7->8 distance = the final/min gap
const STEP1 = 0.11;            // seq 1: backwards growth per step (linear)
const SHRINK2 = 0.7;           // seq 2: whole sequence 30% shorter
const RISE = 2.07;
const SLOPE0 = 0.6, SLOPE1 = 0.95;
const LV_APEX = 10, LV_EDGE = 0.3;
const PITCH = 41, COLOR = '#3B7EA1';
const SEQ_GAP = 5;             // silence between the two sequences

// gaps built backwards from the min: [min+8*step, ..., min+step, min]
const gapsFor = step => Array.from({ length: N - 1 }, (_, i) => GAP_MIN + (N - 2 - i) * step);
const span = gaps => gaps.reduce((a, b) => a + b, 0);

const g1 = gapsFor(STEP1);
// seq 2: same linear-to-min shape, span scaled to 70% -> solve the step
const step2 = (span(g1) * SHRINK2 / (N - 1) - GAP_MIN) * 2 / (N - 2);
const g2 = gapsFor(step2);

let nid = 1; const objs = [];
let cursor = 4;

[['seq1 back-stretched', g1], ['seq2 30% shorter', g2]].forEach(([label, gaps]) => {
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(cursor - 2).toFixed(2),
    label: 'CRESSAND-14 ' + label + ' [' + gaps[0].toFixed(2) + '..' + GAP_MIN + '], span ' + span(gaps).toFixed(1) + 's',
    color: COLOR, performanceNotes: '', properties: {} });
  const peaks = [cursor];
  gaps.forEach(g => peaks.push(peaks[peaks.length - 1] + g));
  peaks.forEach((pt, i) => {
    const u = i / (N - 1);
    const slope = +(SLOPE0 + (SLOPE1 - SLOPE0) * u).toFixed(2);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
      startSeconds: +(pt - RISE).toFixed(3), endSeconds: +pt.toFixed(3),
      nodes: [{ pos: 0, y: LV_EDGE, smooth: 0.35 }, { pos: 1, y: LV_APEX, smooth: 0.35 }],
      segments: [{ model: 'power', slope }],
      color: COLOR, fillMode: 'bottom', opacity: 0.5,
      performanceNotes: label + ' peak ' + (i + 1) + '/' + N, properties: {},
      sonifyNote: PITCH, technique: 'ord', recVel: 112 });
  });
  cursor = peaks[peaks.length - 1] + SEQ_GAP + RISE;
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-14.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

console.log('seq1 gaps:', g1.map(g => g.toFixed(2)).join(', '), '| span', span(g1).toFixed(2) + 's');
console.log('seq2 gaps:', g2.map(g => g.toFixed(2)).join(', '), '| span', span(g2).toFixed(2) + 's',
  '(' + (span(g2) / span(g1) * 100).toFixed(0) + '% of seq1)');
