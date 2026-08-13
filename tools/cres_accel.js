// cres_accel.js — cressand-03 (composer 2026-08-13): SIMPLIFIED.
// Ten swells, every apex at MAX amplitude, and the PEAKS follow a straight
// accelerando (geometric gap chain) — peak-anchored placement: each note
// starts at (peakTime - apexPos*dur) so the apexes ARE the acceleration.
// Short envelope. Pulse travels the stage line (one lane each).

const fs = require('fs');

// ---- DIALS ----
const N = 10;
const GAP0 = 2.2, R = 0.80;   // first peak gap (s), geometric ratio (0.75 too rapid)
const FALL = 0.1;             // -05: abrupt rexpodec-style cut after the apex
const RISE = 2.24 / 2 - FALL; // -05: half the -04 duration
const RISE_SLOPE = 0.15;      // pushed toward linear (-04 was 0.45)
const FALL_SLOPE = -0.7;      // steep drop
const DUR = RISE + FALL;
const POS_APEX = RISE / DUR;
const LV_APEX = 10;           // max amplitude, every peak
const LV_EDGE = 0.3;
const PITCH = 41;             // one pitch: the first available F (F2)
const COLOR = '#3B7EA1';      // blue instead of brown
const OUT = 'cressand-05';

// peak times: accelerating chain
const peaks = [];
let t = 4;
for (let k = 0; k < N; k++) { peaks.push(t); if (k < N - 1) t += GAP0 * Math.pow(R, k); }

let nid = 1; const objs = [];
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: OUT.toUpperCase() + ' · 10 peaks, accel ' + GAP0 + 's x' + R + ', dur ' + DUR.toFixed(2) + 's, F2', color: COLOR,
  performanceNotes: '', properties: {} });

peaks.forEach((pt, i) => {
  const start = pt - POS_APEX * DUR;
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
    startSeconds: +start.toFixed(3), endSeconds: +(start + DUR).toFixed(3),
    nodes: [
      { pos: 0, y: LV_EDGE, smooth: 0.35 },
      { pos: POS_APEX, y: LV_APEX, smooth: 0.35 },
      { pos: 1, y: LV_EDGE, smooth: 0.35 },
    ],
    segments: [{ model: 'power', slope: RISE_SLOPE }, { model: 'power', slope: FALL_SLOPE }],
    color: COLOR, fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'peak ' + (i + 1) + '/' + N + ' @' + pt.toFixed(2), properties: {},
    sonifyNote: PITCH, technique: 'ord', recVel: 112 });
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/' + OUT + '.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

const gaps = peaks.slice(1).map((p, i) => (p - peaks[i]).toFixed(2));
console.log(OUT + ': peaks at', peaks.map(p => p.toFixed(2)).join(', '));
console.log('peak gaps:', gaps.join(', '), '| span', (peaks[N - 1] - peaks[0]).toFixed(1) + 's',
  '| dur', DUR.toFixed(2) + 's (rise ' + RISE.toFixed(2) + ' / fall ' + FALL + ')');
