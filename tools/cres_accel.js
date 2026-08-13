// cres_accel.js — cressand-03 (composer 2026-08-13): SIMPLIFIED.
// Ten swells, every apex at MAX amplitude, and the PEAKS follow a straight
// accelerando (geometric gap chain) — peak-anchored placement: each note
// starts at (peakTime - apexPos*dur) so the apexes ARE the acceleration.
// Short envelope. Pulse travels the stage line (one lane each).

const fs = require('fs');

// ---- DIALS ----
const N = 10;
const GAP0 = 2.2, R = 0.75;   // first peak gap (s), geometric ratio
const DUR = 1.6;              // short envelope (s)
const POS_APEX = 0.7;         // apex 70% in -> 1.12s rise, 0.48s fall
const LV_APEX = 10;           // max amplitude, every peak
const LV_EDGE = 0.3;

const pcs = [0, 2, 4, 5, 6, 8, 10, 11].map(x => (x + 5) % 12);   // m6 on F
const POOL = []; for (let p = 30; p <= 65; p++) if (pcs.includes(p % 12)) POOL.push(p);

// peak times: accelerating chain
const peaks = [];
let t = 4;
for (let k = 0; k < N; k++) { peaks.push(t); if (k < N - 1) t += GAP0 * Math.pow(R, k); }

let nid = 1; const objs = [];
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: 'CRES-SAND 03 · 10 peaks, straight accel ' + GAP0 + 's x' + R + ', all max', color: '#B8860B',
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
    segments: [{ model: 'power', slope: 0.45 }, { model: 'power', slope: -0.3 }],
    color: '#B8860B', fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'peak ' + (i + 1) + '/' + N + ' @' + pt.toFixed(2), properties: {},
    sonifyNote: POOL[i % POOL.length], technique: 'ord', recVel: 112 });
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-03.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

const gaps = peaks.slice(1).map((p, i) => (p - peaks[i]).toFixed(2));
console.log('cressand-03: peaks at', peaks.map(p => p.toFixed(2)).join(', '));
console.log('peak gaps:', gaps.join(', '), '| span', (peaks[N - 1] - peaks[0]).toFixed(1) + 's');
