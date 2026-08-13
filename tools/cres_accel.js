// cres_accel.js — cressand-03 (composer 2026-08-13): SIMPLIFIED.
// Ten swells, every apex at MAX amplitude, and the PEAKS follow a straight
// accelerando (geometric gap chain) — peak-anchored placement: each note
// starts at (peakTime - apexPos*dur) so the apexes ARE the acceleration.
// Short envelope. Pulse travels the stage line (one lane each).

const fs = require('fs');

// ---- DIALS ----
const N = 10;
const TIME_SCALE = 0.6;       // -07: whole sequence at 60% time; R (relative accel)
                              // and the C overlap ramp are scale-invariant
const GAP0 = 2.2 * TIME_SCALE, R = 0.80;
const FALL = 0.1;             // abrupt rexpodec-style cut (kept from -05)
const RISE_SLOPE = 0.15;      // near-linear rise
const FALL_SLOPE = -0.7;      // steep drop
// -06: OVERLAP IS ITS OWN DIAL — concurrency C(k) = parts sounding at peak k.
// rise_k = C_k * gapBefore_k, so overlap follows this ramp regardless of how
// steep or gentle the acceleration curve is set.
const C0 = 1.0, C1 = 4.0;     // overlap at first peak -> last peak
const C_CURVE = 1.0;          // 1 = linear ramp; >1 back-loads the pileup
const RISE_MIN = 0.3;
const LV_APEX = 10;           // max amplitude, every peak
const LV_EDGE = 0.3;
const PITCH = 41;             // one pitch: the first available F (F2)
const COLOR = '#3B7EA1';      // blue instead of brown
const OUT = 'cressand-07';

// peak times: accelerating chain
const peaks = [];
let t = 4;
for (let k = 0; k < N; k++) { peaks.push(t); if (k < N - 1) t += GAP0 * Math.pow(R, k); }

let nid = 1; const objs = [];
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: OUT.toUpperCase() + ' · 10 peaks, accel ' + GAP0 + 's x' + R + ', C ' + C0 + '->' + C1 + ', F2', color: COLOR,
  performanceNotes: '', properties: {} });

peaks.forEach((pt, i) => {
  // overlap dial: rise spans C_k gaps back from this apex
  const u = i / (N - 1);
  const Ck = C0 + (C1 - C0) * Math.pow(u, C_CURVE);
  const gapBefore = i > 0 ? peaks[i] - peaks[i - 1] : GAP0;
  const rise = Math.max(RISE_MIN, Ck * gapBefore);
  const dur = rise + FALL;
  const apexPos = rise / dur;
  const start = pt - rise;
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
    startSeconds: +start.toFixed(3), endSeconds: +(start + dur).toFixed(3),
    nodes: [
      { pos: 0, y: LV_EDGE, smooth: 0.35 },
      { pos: +apexPos.toFixed(4), y: LV_APEX, smooth: 0.35 },
      { pos: 1, y: LV_EDGE, smooth: 0.35 },
    ],
    segments: [{ model: 'power', slope: RISE_SLOPE }, { model: 'power', slope: FALL_SLOPE }],
    color: COLOR, fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'peak ' + (i + 1) + '/' + N + ' C' + Ck.toFixed(1) + ' @' + pt.toFixed(2), properties: {},
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
  '| C ramp', C0, '->', C1, '(curve ' + C_CURVE + '), fall', FALL + 's');
