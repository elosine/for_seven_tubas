// gest2_compress.js — composer dictation 2026-08-13:
//  (1) bank A2-fp_cresE as GESTURE-2 (the finished A2 gesture: 129 notes,
//      28 fp, 9 surge conversions, composer-edited).
//  (2) scores/gest2-compress: the gesture verbatim, then time-compressed
//      x0.75 ("duration reduced by 25%"), then x0.5.
//  Compression = uniform time scaling about the gesture start: every onset
//  (hence every gap) AND every duration multiplied by the factor. Pitch,
//  velocity, technique, envelope conversions untouched. Where the faster
//  spacing breaks the 0.08 s re-articulation law on a lane, the note is
//  relocated to a feasible lane (reported).

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
const rand = mulberry32(20260825);
const REARTIC = 0.08, PARTS = 10;

const d = JSON.parse(fs.readFileSync('scores/A2-fp_cresE.json', 'utf8'));
const data = d.data || d;
const src = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .sort((a, b) => a.startSeconds - b.startSeconds);
const t0 = Math.min(...src.map(n => n.startSeconds));
const t1 = Math.max(...src.map(n => n.endSeconds));

// (1) bank
fs.writeFileSync('bank/GESTURE-2.json', JSON.stringify({
  entity: 'GESTURE-2', source: 'scores/A2-fp_cresE.json (A2-hp-whole take, A1 treatment, composer-edited)',
  kind: 'gesture', color: '#4E7A9B', created: new Date().toISOString(),
  spanSec: +(t1 - t0).toFixed(2),
  objects: src.map(o => { const c = { ...o }; delete c._els; return c; }),
  provenance: 'composer 2026-08-13: "save this one as a gesture" — 28 fp, 9 surge conversions, ord edits',
}, null, 1));
console.log('banked GESTURE-2:', src.length, 'notes,', (t1 - t0).toFixed(1) + 's');

// (2) compression sequence
let nid = 1; const objs = []; let cursor = 2;
[['GESTURE-2 orig', 1], ['x0.75 (-25% duration)', 0.75], ['x0.5 (-50% duration)', 0.5]].forEach(([label, s]) => {
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label: label + ' · ' + ((t1 - t0) * s).toFixed(1) + 's', color: '#4E7A9B',
    performanceNotes: '', properties: {} });
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let prev = -1, moved = 0;
  for (const n of src) {
    const on = cursor + (n.startSeconds - t0) * s;
    const off = cursor + (n.endSeconds - t0) * s;
    const feas = [];
    for (let p = 0; p < PARTS; p++) if (on >= lastEnd[p] + REARTIC) feas.push(p);
    let lane = n.layer;
    if (!feas.includes(lane)) {
      const pool = feas.length > 1 ? feas.filter(p => p !== prev) : feas;
      if (!pool.length) { moved++; continue; }   // physically impossible -> thin (counted)
      lane = pool[Math.floor(rand() * pool.length)]; moved++;
    }
    prev = lane;
    lastEnd[lane] = off;
    const c = { ...n, id: 'wc-' + (nid++), layer: lane,
      startSeconds: +on.toFixed(3), endSeconds: +Math.max(on + 0.02, off).toFixed(3) };
    delete c._els;
    objs.push(c);
  }
  console.log(label + ':', 'relocated/thinned', moved);
  cursor += (t1 - t0) * s + 4;
});

fs.writeFileSync('scores/gest2-compress.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('gest2-compress:', (cursor / 60).toFixed(1), 'min');
