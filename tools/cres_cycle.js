// cres_cycle.js — cressand-12 (composer 2026-08-13): take pulses 4-5-6-7 of
// the pinned chain (cressand-11) — the gap cell [0.77, 0.66, 0.55, 0.44] with
// their envelope sharpness — and REPEAT the cell for 24 seconds. Rise 2.07 s
// (the pinned +15%), abrupt 0.1 s fall, unison F2. Pulses take any free lane;
// if all ten are busy a pulse is skipped (reported).

const fs = require('fs');

// ---- DIALS ----
const GAP_CELL = [0.77, 0.66, 0.55, 0.44];     // gaps after pulses 4,5,6,7
const SLOPE_CELL = [0.52, 0.57, 0.63, 0.68];   // matching rise sharpness
const SPAN = 24;
const RISE = 2.07, FALL = 0.1;
const FALL_SLOPE = -0.7;
const LV_APEX = 10, LV_EDGE = 0.3;
const PITCH = 41, COLOR = '#3B7EA1';
const PARTS = 10, REARTIC = 0.08;

const peaks = [];
let t = 4, k = 0;
while (t - 4 <= SPAN) { peaks.push({ t, k }); t += GAP_CELL[k % 4]; k++; }

let nid = 1; const objs = []; let skipped = 0;
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: 'CRESSAND-12 · cell 4-5-6-7 [' + GAP_CELL.join(',') + '] x ' + SPAN + 's, rise ' + RISE, color: COLOR,
  performanceNotes: '', properties: {} });

const laneEnd = new Array(PARTS).fill(-Infinity);
let prev = -1;
peaks.forEach((e, i) => {
  const start = e.t - RISE;
  const dur = RISE + FALL;
  const feas = [];
  for (let p = 0; p < PARTS; p++) if (start >= laneEnd[p] + REARTIC) feas.push(p);
  if (!feas.length) { skipped++; return; }
  const pool = feas.length > 1 ? feas.filter(p => p !== prev) : feas;
  const lane = pool[i % pool.length];
  prev = lane;
  laneEnd[lane] = start + dur;
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: lane,
    startSeconds: +start.toFixed(3), endSeconds: +(start + dur).toFixed(3),
    nodes: [
      { pos: 0, y: LV_EDGE, smooth: 0.35 },
      { pos: +(RISE / dur).toFixed(4), y: LV_APEX, smooth: 0.35 },
      { pos: 1, y: LV_EDGE, smooth: 0.35 },
    ],
    segments: [{ model: 'power', slope: SLOPE_CELL[e.k % 4] }, { model: 'power', slope: FALL_SLOPE }],
    color: COLOR, fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'pulse ' + (i + 1) + ' @' + e.t.toFixed(2), properties: {},
    sonifyNote: PITCH, technique: 'ord', recVel: 112 });
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-12.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

const notes = objs.filter(o => o.type === 'waveCurve');
let peakC = 0;
for (let x = 2; x < 4 + SPAN + 3; x += 0.1) {
  const c = notes.filter(n => n.startSeconds <= x && n.endSeconds > x).length;
  if (c > peakC) peakC = c;
}
console.log('cressand-12:', notes.length, 'pulses over', SPAN + 's | skipped', skipped,
  '| peak concurrency', peakC, '| cell period', GAP_CELL.reduce((a, b) => a + b, 0).toFixed(2) + 's');
