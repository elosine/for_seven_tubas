// piece_s07.js — composer dictation 2026-08-13: insert the x0.75 compressed
// GESTURE-2 (from gest2-compress, 129 notes / 24.2 s) into the piece at
// 50.00 s. piece-s06f -> piece-s07, movable filled META shape (GESTURE-2's
// identity color #4E7A9B).

const fs = require('fs');

const AT = 50.0;
const GROUP = 'grp-gest2-75-01';
const META_LAYER = 10;

const gc = JSON.parse(fs.readFileSync('scores/gest2-compress.json', 'utf8'));
const mks = gc.objects.filter(o => o.type === 'marker');
const mk = mks.find(m => m.label.startsWith('x0.75'));
const next = mks[mks.indexOf(mk) + 1];
const notes = gc.objects.filter(o => o.type === 'waveCurve' &&
  o.startSeconds >= mk.time && (!next || o.startSeconds < next.time));
if (notes.length !== 129) throw new Error('expected 129 notes, got ' + notes.length);

const piece = JSON.parse(fs.readFileSync('scores/piece-s06f.json', 'utf8'));
const pdata = piece.data || piece;
let nid = (pdata.nextId || 1) + 1;
const objs = pdata.objects.slice();
const t0 = Math.min(...notes.map(n => n.startSeconds));
const dt = AT - t0;

objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: AT,
  label: 'GESTURE-2 x0.75', color: '#4E7A9B', groupId: GROUP,
  performanceNotes: '', properties: {} });
const shifted = notes.map(n => ({ ...n, id: 'wc-' + (nid++), groupId: GROUP,
  startSeconds: +(n.startSeconds + dt).toFixed(3),
  endSeconds: +(n.endSeconds + dt).toFixed(3) }));
objs.push(...shifted);

// filled rate-contour META shape over the gesture
{
  const s0 = AT;
  const s1 = Math.max(...shifted.map(n => n.endSeconds));
  const span = s1 - s0, W = 6;
  const rates = [];
  for (let w = 0; w < W; w++) {
    const a = s0 + (span * w) / W, b = s0 + (span * (w + 1)) / W;
    rates.push(shifted.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
  }
  const mx = Math.max(...rates, 1);
  const nodes = rates.map((r, i) => ({
    pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.5 + 9 * (r / mx)) * 10) / 10, smooth: 0.35 }));
  nodes.unshift({ pos: 0, y: nodes[0].y, smooth: 0.35 });
  nodes.push({ pos: 1, y: nodes[nodes.length - 1].y, smooth: 0.35 });
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
    startSeconds: +s0.toFixed(3), endSeconds: +s1.toFixed(3),
    nodes, segments: nodes.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: '#4E7A9B', fillMode: 'bottom', opacity: 0.45, groupId: GROUP,
    performanceNotes: 'GESTURE-2 x0.75 (drag = move, green box = stretch)', properties: {} });
}

fs.writeFileSync('scores/piece-s07.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s07:', objs.length, 'objects | GESTURE-2 x0.75 at', AT + '-' +
  Math.max(...shifted.map(n => n.endSeconds)).toFixed(1) + 's | group', GROUP);
