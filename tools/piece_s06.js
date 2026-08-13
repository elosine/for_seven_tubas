// piece_s06.js — composer dictation 2026-08-13: insert the ORDINARIO blast of
// "octaves Bb" (34/46/58) at 43.46 s, duration 2.5 s. Movable filled META
// shape (flat bar — ord sustains, unlike the fp decay). piece-s05 -> piece-s06.

const fs = require('fs');

const AT = 43.46, DUR = 2.5;
const GROUP = 'grp-octbb-ord-01';
const META_LAYER = 10;

const hb = JSON.parse(fs.readFileSync('scores/harmony-blasts.json', 'utf8'));
const mks = hb.objects.filter(o => o.type === 'marker');
const mk = mks.find(m => m.label.startsWith('octaves Bb'));
const next = mks[mks.indexOf(mk) + 1];
const ord = hb.objects.filter(o => o.type === 'waveCurve' && o.technique === 'ord' &&
  o.startSeconds >= mk.time && (!next || o.startSeconds < next.time));
if (ord.length !== 10) throw new Error('expected 10 ord notes, got ' + ord.length);

const piece = JSON.parse(fs.readFileSync('scores/piece-s05.json', 'utf8'));
const pdata = piece.data || piece;
let nid = (pdata.nextId || 1) + 1;
const objs = pdata.objects.slice();

objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: AT,
  label: 'octaves Bb ord blast', color: '#AD5F2A', groupId: GROUP,
  performanceNotes: '', properties: {} });
ord.forEach(n => objs.push({ ...n, id: 'wc-' + (nid++), groupId: GROUP,
  startSeconds: AT, endSeconds: +(AT + DUR).toFixed(3) }));
objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER,
  startSeconds: AT, endSeconds: +(AT + DUR).toFixed(3),
  nodes: [{ pos: 0, y: 8.5, smooth: 0 }, { pos: 1, y: 8.5, smooth: 0 }],
  segments: [{ model: 'power', slope: 0 }],
  color: '#AD5F2A', fillMode: 'bottom', opacity: 0.45, groupId: GROUP,
  performanceNotes: 'octaves Bb ord blast (drag = move, edge = stretch)', properties: {} });

fs.writeFileSync('scores/piece-s06.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s06:', objs.length, 'objects | octaves Bb ord blast at', AT + '-' + (AT + DUR) + 's,',
  'pitches', ord.map(n => n.sonifyNote).join(','));
