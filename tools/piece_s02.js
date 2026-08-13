// piece_s02.js — composer dictation 2026-08-13: insert the B2 x BbE-2oct
// pairing (the exact notes auditioned in pairs01) into the piece at 36.54 s,
// with a META-layer shape (5-window rate contour) bound to the excerpt via
// groupId — dragging the shape in the app retimes the whole excerpt.
// piece-s01 -> piece-s02 (increment, never overwrite the piece save).

const fs = require('fs');

const AT = 36.54;
const GROUP = 'grp-b2-bbe-01';
const META_LAYER = 10;

const piece = JSON.parse(fs.readFileSync('scores/piece-s01.json', 'utf8'));
const pdata = piece.data || piece;
const pairs = JSON.parse(fs.readFileSync('scores/pairs01.json', 'utf8'));

// extract the B2 x BbE-2oct excerpt (first marker region of pairs01)
const mks = pairs.objects.filter(o => o.type === 'marker');
const mk = mks.find(m => m.label.startsWith('B2 x BbE'));
const next = mks[mks.indexOf(mk) + 1];
const notes = pairs.objects.filter(o => o.type === 'waveCurve' &&
  o.startSeconds >= mk.time && (!next || o.startSeconds < next.time));
if (!notes.length) throw new Error('excerpt extraction failed');

let nid = (pdata.nextId || 1) + 1;
const dt = AT - mk.time;
const objs = pdata.objects.slice();

objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +AT.toFixed(3),
  label: 'B2 x BbE-2oct', color: '#AD5F2A', groupId: GROUP,
  performanceNotes: '', properties: {} });

const shifted = notes.map(n => ({ ...n, id: 'wc-' + (nid++), groupId: GROUP,
  startSeconds: +(n.startSeconds + dt).toFixed(3),
  endSeconds: +(n.endSeconds + dt).toFixed(3) }));
objs.push(...shifted);

// META shape: 5-window event-rate contour over the excerpt span
{
  const t0 = Math.min(...shifted.map(n => n.startSeconds));
  const t1 = Math.max(...shifted.map(n => n.endSeconds));
  const span = t1 - t0, W = 5;
  const rates = [];
  for (let w = 0; w < W; w++) {
    const a = t0 + (span * w) / W, b = t0 + (span * (w + 1)) / W;
    rates.push(shifted.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
  }
  const mx = Math.max(...rates, 1);
  const nodes = rates.map((r, i) => ({
    pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.5 + 9 * (r / mx)) * 10) / 10, smooth: 0.35 }));
  nodes.unshift({ pos: 0, y: nodes[0].y, smooth: 0.35 });
  nodes.push({ pos: 1, y: nodes[nodes.length - 1].y, smooth: 0.35 });
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
    startSeconds: +t0.toFixed(3), endSeconds: +t1.toFixed(3),
    nodes, segments: nodes.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: '#AD5F2A', fillMode: 'line', opacity: 0.7, groupId: GROUP,
    performanceNotes: 'B2 x BbE-2oct (drag me = move the gesture)', properties: {} });
}

fs.writeFileSync('scores/piece-s02.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s02:', pdata.objects.length, '->', objs.length, 'objects |',
  notes.length, 'notes inserted at', AT + 's (dt ' + dt.toFixed(2) + ') | group', GROUP);
