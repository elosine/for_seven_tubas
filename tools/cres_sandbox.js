// cres_sandbox.js — the overlapping-crescendo sandbox (composer 2026-08-13:
// "a continuous, sustained texture — individual crescendos audible, overall
// crescendo as there's more and more overlap"; the Risset lineage).
//   - entry gaps geometric: IOI_k = START_IOI * RATIO^k; final entry at gap 0
//     (unison with the previous one)
//   - pitches: Messiaen mode 6 on F, ascending the ord-range pool (24 notes),
//     wrapping for the final unison entry
//   - each crescendo: ord note with a rising level curve (apex at POS_APEX,
//     short release); durations shorten in the dense zone to respect 10 lanes
// Dials below. Output: scores/cressand-01.json

const fs = require('fs');

// ---- DIALS ----
const START_IOI = 14;      // first crescendo length = first gap (s)
const RATIO = 0.8;         // geometric acceleration of entries
const DUR = 14;            // full crescendo duration (s)
const DUR_PER_IOI = 9.5;   // dense-zone duration cap = IOI * this (10 lanes - margin)
const DUR_MIN = 3;         // no crescendo shorter than this
const UNISON_DUR = 10;     // the final unison pair's duration
const POS_APEX = 0.85;     // apex position within each swell
const LV_START = 0.5, LV_APEX = 9.3, LV_END = 0.5;
const PARTS = 10;

// mode 6 on F, ord range, ascending
const pcs = [0, 2, 4, 5, 6, 8, 10, 11].map(x => (x + 5) % 12);
const POOL = []; for (let p = 30; p <= 65; p++) if (pcs.includes(p % 12)) POOL.push(p);
const N = POOL.length + 1;   // one full climb + the wrapping unison entry

// entry times
const entries = [];
let t = 2;
for (let k = 0; k < N; k++) {
  const last = k === N - 1;
  entries.push({ t: last ? entries[k - 1].t : t, pitch: POOL[k % POOL.length], k });
  if (!last) t += START_IOI * Math.pow(RATIO, k);
}

// durations + lane assignment (lane must be free; steal-free scheduling)
const laneEnd = new Array(PARTS).fill(-Infinity);
let nid = 1; const objs = [];
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: 2,
  label: 'CRES-SAND 01 · m6(F) up · IOI 14x' + RATIO + ' -> unison', color: '#B8860B',
  performanceNotes: '', properties: {} });

entries.forEach((e, i) => {
  const isUnisonPair = i >= N - 2;
  // pigeonhole: this lane is needed again 10 entries from now — the duration
  // must end before that (this is what shortens swells in the dense zone)
  const tNeeded = i + PARTS < N ? entries[i + PARTS].t - 0.1 : Infinity;
  let dur = isUnisonPair ? UNISON_DUR
    : Math.min(DUR, Math.max(0.8, Math.min(Math.max(DUR_MIN, tNeeded - e.t), tNeeded - e.t)));
  const feas = [];
  for (let p = 0; p < PARTS; p++) if (e.t >= laneEnd[p] + 0.08) feas.push(p);
  if (!feas.length) { console.log('  NO LANE for entry', i, 'at', e.t.toFixed(1)); return; }
  const lane = feas[i % feas.length];
  laneEnd[lane] = e.t + dur;
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: lane,
    startSeconds: +e.t.toFixed(3), endSeconds: +(e.t + dur).toFixed(3),
    nodes: [
      { pos: 0, y: LV_START, smooth: 0.35 },
      { pos: POS_APEX, y: LV_APEX, smooth: 0.35 },
      { pos: 1, y: LV_END, smooth: 0.35 },
    ],
    segments: [{ model: 'power', slope: 0.45 }, { model: 'power', slope: -0.3 }],
    color: '#B8860B', fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'cres ' + (i + 1) + '/' + N, properties: {},
    sonifyNote: e.pitch, technique: 'ord', recVel: 110 });
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-01.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

const notes = objs.filter(o => o.type === 'waveCurve');
const tEnd = Math.max(...notes.map(n => n.endSeconds));
// concurrency profile
let peak = 0;
for (let x = 2; x < tEnd; x += 0.25) {
  const c = notes.filter(n => n.startSeconds <= x && n.endSeconds > x).length;
  if (c > peak) peak = c;
}
console.log('cressand-01:', notes.length, 'crescendos over', (tEnd - 2).toFixed(1) + 's | peak concurrency', peak,
  '| pool', POOL.length, 'pitches | last gaps', entries.slice(-4, -1).map((e, i, a) => i ? (e.t - a[i - 1].t).toFixed(2) : null).filter(Boolean).join(', '), '+ unison');
