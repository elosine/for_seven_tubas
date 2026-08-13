// piece_s04.js — composer dictation 2026-08-13:
//  (1) Insert VERT01-03's FORTEPIANO blast as the piece's third gesture,
//      parked at 40.0 s ("sometime after that cluster — I'll move it into
//      place"), note duration 1.98 s (composer heard the decay done at 5.88 in
//      harmony-blasts; fp onset there was 3.9). Movable META group shape
//      (fp decay wedge, high -> low).
//  (2) The BIG BUILD finally gets its META shape: a long crescendo wedge over
//      the whole opening (2.0-34.65 s), bound to the opening's objects
//      (grp-g1-opening) so the opening is draggable as one unit too.
// piece-s03 -> piece-s04.

const fs = require('fs');

const BLAST_AT = 40.0, BLAST_DUR = 1.98;
const G_OPEN = 'grp-g1-opening', G_BLAST = 'grp-vert03-fp-01';
const META_LAYER = 10;

const piece = JSON.parse(fs.readFileSync('scores/piece-s03.json', 'utf8'));
const pdata = piece.data || piece;
let nid = (pdata.nextId || 1) + 1;

// (2) tag the opening (everything ungrouped) + add the crescendo wedge
const objs = pdata.objects.map(o => o.groupId ? o : { ...o, groupId: G_OPEN });
const openNotes = objs.filter(o => o.groupId === G_OPEN && o.type === 'waveCurve' && o.sonifyNote != null);
const o0 = Math.min(...openNotes.map(n => n.startSeconds));
const o1 = Math.max(...openNotes.map(n => n.endSeconds));
objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
  startSeconds: +o0.toFixed(3), endSeconds: +o1.toFixed(3),
  nodes: [{ pos: 0, y: 0.8, smooth: 0 }, { pos: 1, y: 9.5, smooth: 0 }],
  segments: [{ model: 'power', slope: 0 }],
  color: '#2E8B57', fillMode: 'line', opacity: 0.7, groupId: G_OPEN,
  performanceNotes: 'GESTURE-1 big build (long crescendo wedge)', properties: {} });

// (1) the fp blast, extracted from harmony-blasts (first harmony = VERT01-03)
const hb = JSON.parse(fs.readFileSync('scores/harmony-blasts.json', 'utf8'));
const fp = hb.objects.filter(o => o.type === 'waveCurve' &&
  o.technique === 'fortepiano' && o.startSeconds < 8);
if (fp.length !== 10) throw new Error('expected 10 fp notes, got ' + fp.length);

objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +BLAST_AT.toFixed(3),
  label: 'VERT01-03 fp blast', color: '#AD5F2A', groupId: G_BLAST,
  performanceNotes: '', properties: {} });
fp.forEach(n => objs.push({ ...n, id: 'wc-' + (nid++), groupId: G_BLAST,
  startSeconds: BLAST_AT, endSeconds: +(BLAST_AT + BLAST_DUR).toFixed(3) }));
objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
  startSeconds: BLAST_AT, endSeconds: +(BLAST_AT + BLAST_DUR).toFixed(3),
  nodes: [{ pos: 0, y: 9.5, smooth: 0 }, { pos: 1, y: 0.8, smooth: 0 }],
  segments: [{ model: 'power', slope: 0 }],
  color: '#AD5F2A', fillMode: 'line', opacity: 0.7, groupId: G_BLAST,
  performanceNotes: 'VERT01-03 fp blast (drag me = move the gesture)', properties: {} });

fs.writeFileSync('scores/piece-s04.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s04:', objs.length, 'objects | opening wedge', o0.toFixed(2) + '-' + o1.toFixed(2),
  '| blast at', BLAST_AT + 's x', BLAST_DUR + 's, pitches', fp.map(n => n.sonifyNote).join(','));
