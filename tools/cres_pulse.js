// cres_pulse.js — cressand-02: the LED-trail pulse (composer 2026-08-13).
// Crescendos travel the stage line (lanes cycle 0->9), rapid pulse, durations
// shorten with the accelerating gaps (constant concurrency C — the
// hear-individuals vs overall-build balance), apex levels ramp so the trail
// brightens; last one brightest, then a fade tail.
// Analysis basis: apex = perceptual attack (peak-anchor law); C ~ 2-3.5 keeps
// a 2-3 ghost trail behind the newest swell (finding 15 regimes); the BUILD
// is carried by level, not overlap (percept-inert above ~4/s).

const fs = require('fs');

// ---- DIALS ----
const IOI0 = 1.4, IOI1 = 0.5;   // pulse gap start -> end (s), exponential
const SPAN = 32;                // pulse phase length (s)
const C = 2.8;                  // concurrency: duration = C * gap
const DUR_CLAMP = [1.2, 4.0];
const LV0 = 4.0, LV1 = 9.5;     // apex level ramp (trail brightens)
const LV_CURVE = 1.2;           // >1 = back-loaded brightness
const POS_APEX = 0.75;
const FADE_TAIL = 6;            // final brightest swell's release (s)
const PARTS = 10;

const pcs = [0, 2, 4, 5, 6, 8, 10, 11].map(x => (x + 5) % 12);   // m6 on F
const POOL = []; for (let p = 30; p <= 65; p++) if (pcs.includes(p % 12)) POOL.push(p);

// entry times: exponential gap shrink across SPAN
const entries = [];
let t = 2, k = 0;
while (t - 2 < SPAN) {
  const u = Math.min(1, (t - 2) / SPAN);
  const gap = IOI0 * Math.pow(IOI1 / IOI0, u);
  entries.push({ t, gap });
  t += gap; k++;
}
const K = entries.length;

let nid = 1; const objs = [];
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: 'CRES-SAND 02 · LED pulse across the line · C=' + C + ' · gaps ' + IOI0 + '->' + IOI1,
  color: '#B8860B', performanceNotes: '', properties: {} });

entries.forEach((e, i) => {
  const last = i === K - 1;
  const u = i / (K - 1);
  const apexLv = +(LV0 + (LV1 - LV0) * Math.pow(u, LV_CURVE)).toFixed(1);
  const dur = last ? C * e.gap + FADE_TAIL
    : Math.min(DUR_CLAMP[1], Math.max(DUR_CLAMP[0], C * e.gap));
  const lane = i % PARTS;                    // the pulse travels the stage line
  const apexPos = last ? (C * e.gap * POS_APEX) / dur : POS_APEX;
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: lane,
    startSeconds: +e.t.toFixed(3), endSeconds: +(e.t + dur).toFixed(3),
    nodes: [
      { pos: 0, y: 0.4, smooth: 0.35 },
      { pos: +apexPos.toFixed(3), y: apexLv, smooth: 0.35 },
      { pos: 1, y: last ? 0 : 0.4, smooth: 0.35 },
    ],
    segments: [{ model: 'power', slope: 0.45 }, { model: 'power', slope: last ? -0.5 : -0.3 }],
    color: '#B8860B', fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'pulse ' + (i + 1) + '/' + K + ' lv' + apexLv, properties: {},
    sonifyNote: POOL[i % POOL.length], technique: 'ord', recVel: 110 });
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-02.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

const notes = objs.filter(o => o.type === 'waveCurve');
let peak = 0, clash = 0;
const lanes = {};
notes.forEach(x => { (lanes[x.layer] = lanes[x.layer] || []).push(x); });
Object.values(lanes).forEach(arr => { arr.sort((a, b) => a.startSeconds - b.startSeconds);
  for (let i = 1; i < arr.length; i++) if (arr[i].startSeconds < arr[i - 1].endSeconds + 0.08) clash++; });
const tEnd = Math.max(...notes.map(n => n.endSeconds));
for (let x = 2; x < tEnd; x += 0.2) {
  const c = notes.filter(n => n.startSeconds <= x && n.endSeconds > x).length;
  if (c > peak) peak = c;
}
console.log('cressand-02:', K, 'pulses over', SPAN + 's (+' + FADE_TAIL + 's tail) | peak concurrency', peak,
  '| lane clashes', clash, '| apex rate', (1 / IOI0).toFixed(1), '->', (1 / IOI1).toFixed(1) + '/s');
