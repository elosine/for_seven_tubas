// cres_family.js — cressand-15 (composer 2026-08-13). PINNED: min gap 0.44
// anchored on the last pair + the working-backwards methodology; true-cliff
// rise-only envelopes; F2. Four sequences in a row:
//   1. chain A (1.32->0.44, step .11), rise 2.07   (the -14 pair, kept)
//   2. chain B (0.79->0.44, 30% shorter), rise 2.07  ("the shorter one worked")
//   3. chain B, rise 2.38  (+15%)
//   4. chain B, rise 2.74  (+15% on the second duration)

const fs = require('fs');

const N = 10;
const GAP_MIN = 0.44;
const SLOPE0 = 0.6, SLOPE1 = 0.95;
const LV_APEX = 10, LV_EDGE = 0.3;
const PITCH = 41, COLOR = '#3B7EA1';
const SEQ_GAP = 5;

const gapsFor = step => Array.from({ length: N - 1 }, (_, i) => GAP_MIN + (N - 2 - i) * step);
const span = g => g.reduce((a, b) => a + b, 0);
const A = gapsFor(0.11);
const stepB = (span(A) * 0.7 / (N - 1) - GAP_MIN) * 2 / (N - 2);
const B = gapsFor(stepB);

const SEQS = [
  ['chainA rise 2.07', A, 2.07],
  ['chainB rise 2.07', B, 2.07],
  ['chainB rise 2.38 (+15%)', B, 2.38],
  ['chainB rise 2.74 (+15% again)', B, 2.74],
];

let nid = 1; const objs = []; let cursor = 5;
SEQS.forEach(([label, gaps, rise]) => {
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(cursor - 2.5).toFixed(2),
    label: 'CRESSAND-15 ' + label + ' [' + gaps[0].toFixed(2) + '..' + GAP_MIN + ']',
    color: COLOR, performanceNotes: '', properties: {} });
  const peaks = [cursor];
  gaps.forEach(g => peaks.push(peaks[peaks.length - 1] + g));
  peaks.forEach((pt, i) => {
    const u = i / (N - 1);
    const slope = +(SLOPE0 + (SLOPE1 - SLOPE0) * u).toFixed(2);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
      startSeconds: +(pt - rise).toFixed(3), endSeconds: +pt.toFixed(3),
      nodes: [{ pos: 0, y: LV_EDGE, smooth: 0.35 }, { pos: 1, y: LV_APEX, smooth: 0.35 }],
      segments: [{ model: 'power', slope }],
      color: COLOR, fillMode: 'bottom', opacity: 0.5,
      performanceNotes: label + ' peak ' + (i + 1) + '/' + N, properties: {},
      sonifyNote: PITCH, technique: 'ord', recVel: 112 });
  });
  cursor = peaks[peaks.length - 1] + SEQ_GAP + 2.8;
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-15.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('cressand-15: 4 sequences,', (cursor / 60).toFixed(1), 'min | chainB gaps',
  B.map(g => g.toFixed(2)).join(','));
