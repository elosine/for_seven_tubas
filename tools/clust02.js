// clust02.js — composer dictation 2026-08-13: the B2 cluster wasn't dense
// enough. Carve 32.17-33.79 from the FIRST GESTURE (piece opening, GESTURE-1
// oct-displace) as its own cluster-library entity CLUST02-A (31 staccato notes
// in 1.6 s, ~19/s), then scores/clust02a-versions:
//   1 verbatim, then 4 SCRAMBLES (same density/pointillistic feel, not a
//   repeat: inter-onset gaps shuffled, note order shuffled with dur/vel
//   attached, lanes redistributed), each with its own pitch structure:
//   scr1 = G1 pitch set (multiset permuted) / scr2 = BbE-2oct cluster /
//   scr3 = cluster spread / scr4 = cluster low.

const fs = require('fs');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const REARTIC = 0.08, PARTS = 10;
const WIN = [32.17, 33.79];

const piece = JSON.parse(fs.readFileSync('scores/piece-s01.json', 'utf8'));
const pdata = piece.data || piece;
const src = pdata.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null &&
    o.startSeconds >= WIN[0] && o.startSeconds < WIN[1])
  .map(o => ({ on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : 100, technique: o.technique || 'staccato',
    layer: o.layer }))
  .sort((a, b) => a.on - b.on);
const t0 = src[0].on;
const rel = src.map(n => ({ ...n, on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3) }));
const span = Math.max(...rel.map(n => n.off));

// bank it
fs.writeFileSync('bank/CLUST02-A.json', JSON.stringify({
  entity: 'CLUST02-A', source: 'scores/piece-s01.json (GESTURE-1 oct-displace, piece opening)',
  kind: 'pointillistic-cluster', created: new Date().toISOString(),
  window: WIN, spanSec: +span.toFixed(2), notes: rel,
  provenance: 'composer carve 2026-08-13: "that density and randomness / pointillistic feel"',
}, null, 1));
console.log('banked CLUST02-A:', rel.length, 'notes,', span.toFixed(2) + 's (' + (rel.length / span).toFixed(1) + '/s)');

// pitch structures
const chroma = (a, b) => { const s = []; for (let p = a; p <= b; p++) s.push(p); return s; };
const BBE = [...chroma(34, 40), ...chroma(58, 64)];
const SPREAD = [30, 36, 43, 47, 56, 57, 58];
const LOW = chroma(30, 36);

function scramble(seed, pitchFn) {
  const rand = mulberry32(seed);
  const shuffle = arr => { const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a; };
  const gaps = [];
  for (let i = 1; i < rel.length; i++) gaps.push(rel[i].on - rel[i - 1].on);
  const g = shuffle(gaps);
  const order = shuffle(rel);
  let t = 0;
  return order.map((n, i) => {
    const on = t; if (i < g.length) t += g[i];
    return { on: +on.toFixed(3), off: +(on + (n.off - n.on)).toFixed(3),
      pitch: pitchFn(n.pitch, rand), vel: n.vel, technique: n.technique };
  }).sort((a, b) => a.on - b.on);
}
const g1Pitches = rel.map(n => n.pitch);
const permPitch = seed => { const rand = mulberry32(seed ^ 0x5F3759DF);
  const pool = g1Pitches.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let k = 0; return () => pool[k++ % pool.length]; };
const draw = set => (p, rand) => set[Math.floor(rand() * set.length)];

const VERSIONS = [
  ['CLUST02-A orig', rel.map(n => ({ ...n }))],
  ['scr1 x G1 pitch set', scramble(101, permPitch(101))],
  ['scr2 x BbE-2oct', scramble(202, draw(BBE))],
  ['scr3 x cluster spread', scramble(303, draw(SPREAD))],
  ['scr4 x cluster low', scramble(404, draw(LOW))],
];

// assemble score: orig keeps piece lanes; scrambles redistribute (rotation pref)
const rand = mulberry32(20260821);
let nid = 1; const objs = []; let cursor = 2;
VERSIONS.forEach(([label, notes], vi) => {
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label, color: '#AD5F2A', performanceNotes: '', properties: {} });
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let prevPart = -1;
  for (const n of notes) {
    const onAbs = cursor + n.on;
    let part;
    if (vi === 0) part = n.layer;
    else {
      const feas = [];
      for (let p = 0; p < PARTS; p++) if (onAbs >= lastEnd[p] + REARTIC) feas.push(p);
      if (!feas.length) continue;
      const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
      part = pool[Math.floor(rand() * pool.length)];
      prevPart = part;
      lastEnd[part] = onAbs + (n.off - n.on);
    }
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: part,
      startSeconds: +onAbs.toFixed(3), endSeconds: +(onAbs + n.off - n.on).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#607D8B', fillMode: 'bottom', opacity: 0.55,
      performanceNotes: label, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }
  cursor += span + 3.5;
});

const tracks = pdata.tracks;
fs.writeFileSync('scores/clust02a-versions.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('clust02a-versions:', VERSIONS.length, 'versions,', (cursor / 60).toFixed(1), 'min');
