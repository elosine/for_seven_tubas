// segment_bank.js — split a multi-sample take into bankable entities + cleaned versions.
// Composer 2026-08-13 (cluster_samples_01):
//  - segments split on silence gaps (> GAP_SPLIT s of no onsets)
//  - each segment banked RAW as its own callable entity (bank/<NAME>-<X>.json)
//  - CLEANED version: two-hands artifact removal — within each simultaneity
//    group (chain-linked onsets < CHORD_EPS apart) keep ONE note: the LOUDEST
//    (the intended accent); tie -> earliest. Threshold fixed, documented;
//    intentional fast alternation (> CHORD_EPS gaps) survives untouched.
//  - scores/<name>-cleaned.json: cleaned segments consecutive, marker-labeled.
// Usage: node tools/segment_bank.js scores/cluster_samples_01.json CLUST01

const fs = require('fs');
const path = require('path');

const GAP_SPLIT = 1.8;
const CHORD_EPS = 0.055;

const scorePath = process.argv[2] || 'scores/cluster_samples_01.json';
const NAME = process.argv[3] || 'CLUST01';
const raw = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const data = raw.data || raw;
const notes = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({
    on: o.startSeconds, off: o.endSeconds, part: o.layer, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : Math.round((Math.max(...o.nodes.map(n => n.y)) / 10) * 127),
    technique: o.technique || 'staccato',
  }))
  .sort((a, b) => a.on - b.on);

// ---- segmentation on silence gaps ----
const segments = [];
let cur = [notes[0]];
for (let i = 1; i < notes.length; i++) {
  if (notes[i].on - Math.max(...cur.map(n => n.off)) > GAP_SPLIT) { segments.push(cur); cur = []; }
  cur.push(notes[i]);
}
segments.push(cur);

// ---- de-chord: chain-linked groups < CHORD_EPS, keep loudest (tie: earliest) ----
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

fs.mkdirSync('bank', { recursive: true });
const letters = 'ABCDEFGHIJKLMNOP';
const registry = [];
let nid = 1;
const outObjs = [];
let cursor = 2;

segments.forEach((seg, i) => {
  const id = NAME + '-' + letters[i];
  const t0 = seg[0].on;
  const span = Math.max(...seg.map(n => n.off)) - t0;
  const norm = arr => arr.map(n => ({ ...n, on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3) }));
  const clean = dechord(seg);
  fs.writeFileSync(path.join('bank', id + '.json'), JSON.stringify({
    entity: id, source: scorePath, kind: 'pointillistic-cluster', created: new Date().toISOString(),
    spanSec: +span.toFixed(2), notes: norm(seg), cleaned: norm(clean),
    dechord: { eps: CHORD_EPS, keep: 'loudest (tie: earliest)' },
  }, null, 1));
  registry.push({ id, notes: seg.length, cleaned: clean.length, removed: seg.length - clean.length, span: +span.toFixed(1) });

  // audition score: cleaned, consecutive, labeled
  outObjs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label: id + ' cleaned (' + clean.length + '/' + seg.length + ' notes)', color: '#AD5F2A',
    performanceNotes: '', properties: {} });
  for (const n of clean) {
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    outObjs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: n.part,
      startSeconds: +(cursor + n.on - t0).toFixed(3), endSeconds: +(cursor + n.off - t0).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#607D8B', fillMode: 'bottom', opacity: 0.55, performanceNotes: id, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }
  cursor += span + 5;
});

const outName = NAME.toLowerCase() + '-cleaned';
fs.writeFileSync('scores/' + outName + '.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: outObjs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

console.log('segments:', segments.length);
registry.forEach(r => console.log(' ', r.id + ':', r.notes, 'notes ->', r.cleaned, 'cleaned (' + r.removed, 'chord-notes removed),', r.span + 's'));
console.log('banked: bank/' + NAME + '-A..' + letters[segments.length - 1] + '.json (raw + cleaned in each)');
console.log('audition score: scores/' + outName + '.json');
