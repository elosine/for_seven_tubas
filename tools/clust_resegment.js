// clust_resegment.js — composer-corrected segmentation of cluster_samples_01
// (dictation 2026-08-13), re-bank as CLUST01-A..T, rebuild the cleaned audition
// score, and build the 10-track + META-shape score.
// Distribution augmentation: rotation preference — among feasible parts, avoid
// the immediately previous part when possible (max interleave for point-lines).

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
const rand = mulberry32(20260817);
const REARTIC = 0.08, PARTS = 10, CHORD_EPS = 0.055;

// composer-dictated boundaries (take-time windows, edges snapped to data gaps)
const WINDOWS = [
  [1.0, 9.6],       // A  clus1 "8 sec" (spans its internal pause, per dictation)
  [10.8, 18.8],     // B  "11 to 19"
  [19.9, 20.9],     // C  \
  [21.3, 23.0],     // D   \
  [23.5, 26.6],     // E    the five sub-clusters of "20 to 31"
  [27.0, 28.2],     // F   /
  [29.2, 30.9],     // G  /
  [31.7, 41.0],     // H  "32 to about 41"
  [42.1, 50.5],     // I  (gap-split, unmentioned region)
  [52.0, 60.9],     // J
  [62.7, 72.6],     // K
  [74.7, 85.2],     // L  "starting at 76"
  [86.4, 90.6],     // M
  [92.1, 101.2],    // N  "97 is its own cluster"
  [103.8, 105.6],   // O
  [107.4, 109.1],   // P
  [110.2, 115.2],   // Q
  [116.9, 129.5],   // R  (final run, split at dictated 129.5)
  [129.5, 138.1],   // S  "same with 129.5"
  [140.5, 147.4],   // T
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRST';

const raw = JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8'));
const data = raw.data || raw;
const notes = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({
    on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : Math.round((Math.max(...o.nodes.map(n => n.y)) / 10) * 127),
    technique: o.technique || 'staccato',
  }))
  .sort((a, b) => a.on - b.on);

function dechord(seg) {
  const groups = [];
  let g = [seg[0]];
  for (let i = 1; i < seg.length; i++) {
    if (seg[i].on - g[g.length - 1].on < CHORD_EPS) g.push(seg[i]);
    else { groups.push(g); g = [seg[i]]; }
  }
  groups.push(g);
  return groups.map(gr => gr.slice().sort((a, b) => (b.vel - a.vel) || (a.on - b.on))[0]);
}

// META shape: windowed-rate contour (5 windows) as a layer-10 curve
function metaShape(seg, tOff, span, nid) {
  const W = 5;
  const rates = [];
  for (let w = 0; w < W; w++) {
    const a = seg[0].on + (span * w) / W, b = seg[0].on + (span * (w + 1)) / W;
    rates.push(seg.filter(n => n.on >= a && n.on < b).length / (span / W));
  }
  const mx = Math.max(...rates, 0.1);
  const nodes = rates.map((r, i) => ({
    pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.5 + 9 * (r / mx)) * 10) / 10, smooth: 0.35,
  }));
  nodes.unshift({ pos: 0, y: nodes[0].y, smooth: 0.35 });
  nodes.push({ pos: 1, y: nodes[nodes.length - 1].y, smooth: 0.35 });
  return {
    id: 'wc-' + nid, type: 'waveCurve', layer: 10,
    startSeconds: +tOff.toFixed(2), endSeconds: +(tOff + span).toFixed(2),
    nodes, segments: nodes.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: '#AD5F2A', fillMode: 'line', opacity: 0.7,
    performanceNotes: 'SHAPE', properties: {},
  };
}

fs.mkdirSync('bank', { recursive: true });
// clear stale CLUST01 bank files (the 10-entity segmentation is superseded)
fs.readdirSync('bank').filter(f => f.startsWith('CLUST01-')).forEach(f => fs.unlinkSync('bank/' + f));

let nidC = 1, nidT = 1;
const cleanObjs = [], trackObjs = [];
let curC = 2, curT = 2;
const registry = [];

WINDOWS.forEach(([a, b], i) => {
  const id = 'CLUST01-' + LETTERS[i];
  const seg = notes.filter(n => n.on >= a && n.on < b);
  if (!seg.length) { registry.push({ id, notes: 0 }); return; }
  const t0 = seg[0].on;
  const span = Math.max(...seg.map(n => n.off)) - t0;
  const clean = dechord(seg);
  const norm = arr => arr.map(n => ({ ...n, on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3) }));
  fs.writeFileSync('bank/' + id + '.json', JSON.stringify({
    entity: id, source: 'scores/cluster_samples_01.json', kind: 'pointillistic-cluster',
    created: new Date().toISOString(), window: [a, b], spanSec: +span.toFixed(2),
    notes: norm(seg), cleaned: norm(clean),
    dechord: { eps: CHORD_EPS, keep: 'loudest (tie: earliest)' },
  }, null, 1));

  // cleaned audition score (single-lane as played)
  cleanObjs.push({ id: 'mk-' + (nidC++), type: 'marker', layer: 0, time: +curC.toFixed(2),
    label: id + ' (' + clean.length + '/' + seg.length + ')', color: '#AD5F2A', performanceNotes: '', properties: {} });
  for (const n of clean) {
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    cleanObjs.push({ id: 'wc-' + (nidC++), type: 'waveCurve', layer: 0,
      startSeconds: +(curC + n.on - t0).toFixed(3), endSeconds: +(curC + n.off - t0).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#607D8B', fillMode: 'bottom', opacity: 0.55, performanceNotes: id, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }

  // 10-track distributed version + META shape
  trackObjs.push({ id: 'mk-' + (nidT++), type: 'marker', layer: 0, time: +curT.toFixed(2),
    label: id + ' 10-track', color: '#AD5F2A', performanceNotes: '', properties: {} });
  trackObjs.push(metaShape(seg, curT, span, nidT++));
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let prevPart = -1, thinned = 0;
  for (const n of clean) {
    const onAbs = curT + n.on - t0;
    const feas = [];
    for (let p = 0; p < PARTS; p++) if (onAbs >= lastEnd[p] + REARTIC) feas.push(p);
    if (!feas.length) { thinned++; continue; }
    // rotation preference: avoid the immediately previous part when possible
    const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
    const part = pool[Math.floor(rand() * pool.length)];
    prevPart = part;
    lastEnd[part] = onAbs + (n.off - n.on);
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    trackObjs.push({ id: 'wc-' + (nidT++), type: 'waveCurve', layer: part,
      startSeconds: +onAbs.toFixed(3), endSeconds: +(onAbs + n.off - n.on).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#607D8B', fillMode: 'bottom', opacity: 0.55, performanceNotes: id, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }
  registry.push({ id, notes: seg.length, cleaned: clean.length, span: +span.toFixed(1), thinned });
  curC += span + 4;
  curT += span + 4;
});

const shell = objs => ({ version: 1, layoutVersion: 2, tracks: data.tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] },
  nextId: Math.max(nidC, nidT) + 1 });
fs.writeFileSync('scores/clust01-cleaned.json', JSON.stringify(shell(cleanObjs)));
fs.writeFileSync('scores/clust01-10track.json', JSON.stringify(shell(trackObjs)));

registry.forEach(r => console.log(r.id + ':', r.notes || 0, 'notes ->', r.cleaned || 0, 'cleaned,', (r.span || 0) + 's', r.thinned ? ('(' + r.thinned + ' thinned)') : ''));
console.log('bank: 20 entities rewritten | scores: clust01-cleaned + clust01-10track (with META shapes)');
