// cloud02.js — composer dictation 2026-08-14: clusterClouds02 (1232 staccato
// notes / 60 s) -> bank CLOUD02-A..L (12 silence-gap clusters) keeping AS MANY
// NOTES AS POSSIBLE that are still performable:
//   - out-of-range pitches OCTAVE-FOLDED into staccato range 30-65 (not dropped)
//   - within simultaneities, loudest placed first; a note is dropped ONLY when
//     no lane is free under the 0.08 s re-artic law (quietest lose)
// scores/cloud02-10track.json: the 12 ten-track versions in sequence, each with
// a filled rate-contour META shape bound via groupId (movable/stretchable).

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
const rand = mulberry32(20260829);
const REARTIC = 0.08, PARTS = 10, LO = 30, HI = 65;
const GAP_SPLIT = 0.9;
const META_LAYER = 10;
const COLOR = '#5E8C7A';

const raw = JSON.parse(fs.readFileSync('scores/clusterClouds02.json', 'utf8'));
const data = raw.data || raw;
const notes = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({ on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : 100, technique: o.technique || 'staccato' }))
  .sort((a, b) => a.on - b.on);

// segmentation on silence gaps
const segments = [];
let cur = [notes[0]];
for (let i = 1; i < notes.length; i++) {
  const lastOff = Math.max(...cur.slice(-14).map(n => n.off));
  if (notes[i].on - lastOff > GAP_SPLIT) { segments.push(cur); cur = []; }
  cur.push(notes[i]);
}
segments.push(cur);
const LETTERS = 'ABCDEFGHIJKLMNOP';
console.log('segments:', segments.length);

let nid = 1; const objs = []; let cursor = 3;
const registry = [];

segments.forEach((seg, si) => {
  const id = 'CLOUD02-' + LETTERS[si];
  const t0 = seg[0].on;
  const span = Math.max(...seg.map(n => n.off)) - t0;

  // performability pass: fold pitches, place loudest-first within 30ms groups
  let folded = 0;
  const work = seg.map(n => {
    let p = n.pitch;
    while (p < LO) p += 12;
    while (p > HI) p -= 12;
    if (p !== n.pitch) folded++;
    return { ...n, pitch: p };
  });
  work.sort((a, b) => (Math.round(a.on * 33) - Math.round(b.on * 33)) || (b.vel - a.vel) || (a.on - b.on));

  const lastEnd = new Array(PARTS).fill(-Infinity);
  let prevPart = -1, dropped = 0;
  const placed = [];
  for (const n of work) {
    const feas = [];
    for (let p = 0; p < PARTS; p++) if (n.on >= lastEnd[p] + REARTIC) feas.push(p);
    if (!feas.length) { dropped++; continue; }
    const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
    const part = pool[Math.floor(rand() * pool.length)];
    prevPart = part;
    lastEnd[part] = n.off;
    placed.push({ ...n, layer: part });
  }
  placed.sort((a, b) => a.on - b.on);

  const rel = arr => arr.map(n => ({ ...n, on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3) }));
  fs.writeFileSync('bank/' + id + '.json', JSON.stringify({
    entity: id, source: 'scores/clusterClouds02.json', kind: 'pointillistic-cluster',
    created: new Date().toISOString(), window: [+t0.toFixed(2), +(t0 + span).toFixed(2)],
    spanSec: +span.toFixed(2),
    notes: rel(seg), performable: rel(placed),
    cleaning: { rule: 'max-retention: octave-fold to 30-65, loudest-first placement, drop only when no lane free (re-artic 0.08)', folded, dropped },
  }, null, 1));

  // ten-track section with grouped META shape
  const GROUP = 'grp-cloud02-' + LETTERS[si];
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label: id + ' (' + placed.length + '/' + seg.length + ')', color: COLOR, groupId: GROUP,
    performanceNotes: '', properties: {} });
  for (const n of placed) {
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: n.layer, groupId: GROUP,
      startSeconds: +(cursor + n.on - t0).toFixed(3), endSeconds: +(cursor + n.off - t0).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: COLOR, fillMode: 'bottom', opacity: 0.55,
      performanceNotes: id, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
  }
  // filled rate-contour META shape (6 windows), same group = movable handle
  {
    const W = 6; const rates = [];
    for (let w = 0; w < W; w++) {
      const a = t0 + (span * w) / W, b = t0 + (span * (w + 1)) / W;
      rates.push(placed.filter(n => n.on >= a && n.on < b).length);
    }
    const mx = Math.max(...rates, 1);
    const nds = rates.map((r, i) => ({
      pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
      y: Math.round((0.5 + 9 * (r / mx)) * 10) / 10, smooth: 0.35 }));
    nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
    nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
      startSeconds: +cursor.toFixed(3), endSeconds: +(cursor + span).toFixed(3),
      nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
      color: COLOR, fillMode: 'bottom', opacity: 0.45, groupId: GROUP,
      performanceNotes: id + ' (drag = move, edge/box = stretch)', properties: {} });
  }
  registry.push({ id, raw: seg.length, kept: placed.length, dropped, folded, span: +span.toFixed(1) });
  cursor += span + 4;
});

fs.writeFileSync('scores/cloud02-10track.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

registry.forEach(r => console.log(r.id + ':', r.raw, 'notes ->', r.kept, 'kept (' + r.dropped, 'dropped,',
  r.folded, 'folded),', r.span + 's,', (r.kept / r.span).toFixed(1) + '/s'));
console.log('bank:', registry.length, 'entities | score: cloud02-10track (' + (cursor / 60).toFixed(1) + ' min)');
