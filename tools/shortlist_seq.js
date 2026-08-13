// shortlist_seq.js — composer dictation 2026-08-13:
//  BANK CORRECTIONS: A split at the 7.08s pause (A1/A2); carves L2 (from
//  cleaned-t 109.39), S1 (start->176.3), B2 (18.69->end), I1 (start->69.64),
//  J2 (80.3->end) — parents left in place.
//  SHORTLIST = [L2, M, S1, B2, I1, J2] (dictated order).
//  SEQUENCE score sl01-harmonies: 18 excerpts alternating the shortlist, each
//  with one pitch treatment: 7 VERT chords + oct-displace + 3 fifths
//  transpositions + 7 Messiaen modes (all anchored F#). Every excerpt marker-
//  labeled "cluster x concept". 10-part rotation distribution.

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
const rand = mulberry32(20260818);
const REARTIC = 0.08, PARTS = 10, CHORD_EPS = 0.055, LO = 30, HI = 65;

// take-time windows from the corrected segmentation (clust_resegment)
const WIN = { A: [1.0, 9.6], B: [10.8, 18.8], I: [42.1, 50.5], J: [52.0, 60.9],
              L: [74.7, 85.2], M: [86.4, 90.6], S: [129.5, 138.1] };

const raw = JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8'));
const data = raw.data || raw;
const notes = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({ on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : 100, technique: o.technique || 'staccato' }))
  .sort((a, b) => a.on - b.on);
const inWin = ([a, b]) => notes.filter(n => n.on >= a && n.on < b);

// cleaned-score marker starts (for cleaned-time -> take-time mapping)
const cleaned = JSON.parse(fs.readFileSync('scores/clust01-cleaned.json', 'utf8'));
const markStart = {};
cleaned.objects.filter(o => o.type === 'marker').forEach(m => {
  const id = m.label.split(' ')[0].replace('CLUST01-', '');
  markStart[id] = m.time;
});
const segT0 = id => inWin(WIN[id])[0].on;
const toTake = (id, cleanedT) => segT0(id) + (cleanedT - markStart[id]);

// corrected/carved windows (take-time)
const CARVES = {
  A1: [1.0, 6.2],                    // beginning cluster (pause 5.27-7.08)
  A2: [7.08, 9.6],                   // "the one that starts around seven seconds"
  L2: [toTake('L', 109.39), WIN.L[1]],
  S1: [WIN.S[0], toTake('S', 176.3)],
  B2: [toTake('B', 18.69), WIN.B[1]],
  I1: [WIN.I[0], toTake('I', 69.64)],
  J2: [toTake('J', 80.3), WIN.J[1]],
};

function dechord(seg) {
  const groups = []; let g = [seg[0]];
  for (let i = 1; i < seg.length; i++) {
    if (seg[i].on - g[g.length - 1].on < CHORD_EPS) g.push(seg[i]);
    else { groups.push(g); g = [seg[i]]; }
  }
  groups.push(g);
  return groups.map(gr => gr.slice().sort((a, b) => (b.vel - a.vel) || (a.on - b.on))[0]);
}

// bank the new entities
for (const [id, w] of Object.entries(CARVES)) {
  const seg = inWin(w);
  if (!seg.length) { console.log('EMPTY carve', id, w); continue; }
  const t0 = seg[0].on;
  const norm = arr => arr.map(n => ({ ...n, on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3) }));
  fs.writeFileSync('bank/CLUST01-' + id + '.json', JSON.stringify({
    entity: 'CLUST01-' + id, source: 'scores/cluster_samples_01.json',
    kind: 'pointillistic-cluster', created: new Date().toISOString(),
    window: w.map(x => +x.toFixed(2)), spanSec: +(Math.max(...seg.map(n => n.off)) - t0).toFixed(2),
    notes: norm(seg), cleaned: norm(dechord(seg)),
    dechord: { eps: CHORD_EPS, keep: 'loudest (tie: earliest)' },
    provenance: 'composer carve 2026-08-13',
  }, null, 1));
  console.log('banked CLUST01-' + id + ':', seg.length, 'notes, window', w.map(x => x.toFixed(1)).join('-'));
}
// A is superseded by A1/A2
if (fs.existsSync('bank/CLUST01-A.json')) fs.unlinkSync('bank/CLUST01-A.json');

// ---- pitch treatments ----
const F = 6;
const rangePcs = pcs => { const out = []; for (let p = LO; p <= HI; p++) if (pcs.includes(p % 12)) out.push(p); return out; };
const pick = arr => arr[Math.floor(rand() * arr.length)];
const vertSet = id => {
  const b = JSON.parse(fs.readFileSync('bank/VERT01-' + id + '.json', 'utf8'));
  return b.pitches.filter(p => p >= LO && p <= HI);
};
const MODES = {
  'Messiaen m1 (whole-tone)': [0,2,4,6,8,10], 'Messiaen m2': [0,1,3,4,6,7,9,10],
  'Messiaen m3': [0,2,3,4,6,7,8,10,11], 'Messiaen m4': [0,1,2,5,6,7,8,11],
  'Messiaen m5': [0,1,5,6,7,11], 'Messiaen m6': [0,2,4,5,6,8,10,11],
  'Messiaen m7': [0,1,2,3,5,6,7,8,10,11],
};
const fifthStack = root => { const s = []; for (let q = root; q <= HI; q += 7) s.push(q); return s; };
const TREATMENTS = [];
['01', '05', '09', '13', '17', '23', '28'].forEach(id =>
  TREATMENTS.push(['VERT01-' + id, (() => { const set = vertSet(id); return () => pick(set); })()]));
TREATMENTS.push(['oct-displace', p => { const r = rand();
  let q = r < 0.5 ? p : r < 0.8 ? p + 12 : r < 0.95 ? p - 12 : p + 24;
  return (q >= LO && q <= HI) ? q : p; }]);
[30, 33, 37].forEach(root =>
  TREATMENTS.push(['5ths root ' + root, (() => { const s = fifthStack(root); return () => pick(s); })()]));
Object.entries(MODES).forEach(([name, pcs]) =>
  TREATMENTS.push([name + ' (F#)', (() => { const pool = rangePcs(pcs.map(x => (x + F) % 12)); return () => pick(pool); })()]));

// ---- the sequence ----
const SHORTLIST = ['L2', 'M', 'S1', 'B2', 'I1', 'J2'];
const getCleaned = id => {
  const f = CARVES[id] ? 'bank/CLUST01-' + id + '.json' : 'bank/CLUST01-' + id + '.json';
  return JSON.parse(fs.readFileSync(f, 'utf8'));
};
let nid = 1; const objs = []; let cursor = 2;
TREATMENTS.forEach(([tname, fn], i) => {
  const cid = SHORTLIST[i % SHORTLIST.length];
  const ent = getCleaned(cid);
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

fs.writeFileSync('scores/sl01-harmonies.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('sequence:', TREATMENTS.length, 'excerpts over shortlist [' + SHORTLIST.join(', ') + '],', (cursor / 60).toFixed(1), 'min -> scores/sl01-harmonies.json');
