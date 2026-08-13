// piece_s03.js — composer dictation 2026-08-13: in the piece, REPLACE the
// B2 x BbE-2oct excerpt (grp-b2-bbe-01) with clust02a scr2 x BbE-2oct (the
// denser scrambled burst), same spot (36.54 s), again with a movable META
// group shape. piece-s02 -> piece-s03.

const fs = require('fs');

const AT = 36.54;
const OLD_GROUP = 'grp-b2-bbe-01';
const GROUP = 'grp-scr2-bbe-01';
const META_LAYER = 10;

const piece = JSON.parse(fs.readFileSync('scores/piece-s02.json', 'utf8'));
const pdata = piece.data || piece;
const versions = JSON.parse(fs.readFileSync('scores/clust02a-versions.json', 'utf8'));

const removed = pdata.objects.filter(o => o.groupId === OLD_GROUP).length;
const objs = pdata.objects.filter(o => o.groupId !== OLD_GROUP);

const mks = versions.objects.filter(o => o.type === 'marker');
const mk = mks.find(m => m.label === 'scr2 x BbE-2oct');
const next = mks[mks.indexOf(mk) + 1];
const notes = versions.objects.filter(o => o.type === 'waveCurve' &&
  o.startSeconds >= mk.time && (!next || o.startSeconds < next.time));
if (!notes.length) throw new Error('scr2 extraction failed');

let nid = (pdata.nextId || 1) + 1;
const dt = AT - mk.time;

objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +AT.toFixed(3),
  label: 'CLUST02-A scr2 x BbE-2oct', color: '#AD5F2A', groupId: GROUP,
  performanceNotes: '', properties: {} });

const shifted = notes.map(n => ({ ...n, id: 'wc-' + (nid++), groupId: GROUP,
  startSeconds: +(n.startSeconds + dt).toFixed(3),
  endSeconds: +(n.endSeconds + dt).toFixed(3) }));
objs.push(...shifted);

// META shape: 5-window event-rate contour over the excerpt
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
    performanceNotes: 'CLUST02-A scr2 x BbE-2oct (drag me = move the gesture)', properties: {} });
}

fs.writeFileSync('scores/piece-s03.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s03: removed', removed, 'objects (' + OLD_GROUP + '), inserted',
  notes.length, 'notes at', AT + 's | group', GROUP, '| total', objs.length, 'objects');
