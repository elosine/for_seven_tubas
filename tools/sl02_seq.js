// sl02_seq.js — composer dictation 2026-08-13 (second pass on the harmonies):
//  CHORD SHORTLIST for the cluster sequence — by number: VERT01-03,04,06,07;
//  by take-time (vertical_shapes_01): 48->11, 52.5->12, 74.8->16, 109.68->23,
//  140.38->28, 163->33 (the last chord).
//  Plus: fifths stacks x2 transpositions, octave stacks x2 notes
//  (F# and Bb — the piece's two standing anchors). Messiaen deferred —
//  composer will listen and add later.
//  Same cluster shortlist rotation as sl01: [L2, M, S1, B2, I1, J2].

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
const rand = mulberry32(20260819);
const REARTIC = 0.08, PARTS = 10, LO = 30, HI = 65;

const pick = arr => arr[Math.floor(rand() * arr.length)];
const vertSet = id => {
  const b = JSON.parse(fs.readFileSync('bank/VERT01-' + id + '.json', 'utf8'));
  const set = b.pitches.filter(p => p >= LO && p <= HI);
  const dropped = b.pitches.filter(p => p < LO || p > HI);
  if (dropped.length) console.log('  note: VERT01-' + id, 'filtered out-of-ord pitches', dropped.join(','));
  return set;
};
const stack = (root, step) => { const s = []; for (let q = root; q <= HI; q += step) s.push(q); return s; };

const CHORDS = ['03', '04', '06', '07', '11', '12', '16', '23', '28', '33'];
const TREATMENTS = [];
CHORDS.forEach(id =>
  TREATMENTS.push(['VERT01-' + id, (() => { const set = vertSet(id); return () => pick(set); })()]));
[30, 37].forEach(root =>
  TREATMENTS.push(['5ths root ' + root, (() => { const s = stack(root, 7); return () => pick(s); })()]));
[['F#', 30], ['Bb', 34]].forEach(([name, root]) =>
  TREATMENTS.push(['octaves ' + name, (() => { const s = stack(root, 12); return () => pick(s); })()]));

const SHORTLIST = ['L2', 'M', 'S1', 'B2', 'I1', 'J2'];
const anyScore = JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8'));
const tracks = (anyScore.data || anyScore).tracks;

let nid = 1; const objs = []; let cursor = 2;
TREATMENTS.forEach(([tname, fn], i) => {
  const cid = SHORTLIST[i % SHORTLIST.length];
  const ent = JSON.parse(fs.readFileSync('bank/CLUST01-' + cid + '.json', 'utf8'));
  const clean = ent.cleaned;
  const span = ent.spanSec;
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label: cid + ' x ' + tname, color: '#AD5F2A', performanceNotes: '', properties: {} });
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let prevPart = -1;
  for (const n of clean) {
    const onAbs = cursor + n.on;
    const feas = [];
    for (let p = 0; p < PARTS; p++) if (onAbs >= lastEnd[p] + REARTIC) feas.push(p);
    if (!feas.length) continue;
    const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
    const part = pool[Math.floor(rand() * pool.length)];
    prevPart = part;
    lastEnd[part] = onAbs + (n.off - n.on);
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: part,
      startSeconds: +onAbs.toFixed(3), endSeconds: +(onAbs + n.off - n.on).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#607D8B', fillMode: 'bottom', opacity: 0.55,
      performanceNotes: cid + ' x ' + tname, properties: {},
      sonifyNote: fn(n.pitch), technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }
  cursor += span + 4;
});

fs.writeFileSync('scores/sl02-harmonies.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('sequence:', TREATMENTS.length, 'excerpts over shortlist [' + SHORTLIST.join(', ') + '],', (cursor / 60).toFixed(1), 'min -> scores/sl02-harmonies.json');
