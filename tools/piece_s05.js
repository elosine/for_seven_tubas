// piece_s05.js — composer dictation 2026-08-13: carve clust01-10track
// 54.06-56.2 (inside the CLUST01-H block) as its own cluster entity
// CLUST01-H1, and insert it into the piece after the blast (composer will
// drag into place). piece-s04 -> piece-s05, filled movable META shape.

const fs = require('fs');

const WIN = [54.06, 56.2];
const GROUP = 'grp-h1-01';
const META_LAYER = 10;
const GAP_AFTER_BLAST = 1.5;

const tt = JSON.parse(fs.readFileSync('scores/clust01-10track.json', 'utf8'));
const seg = tt.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null &&
  o.startSeconds >= WIN[0] && o.startSeconds < WIN[1])
  .sort((a, b) => a.startSeconds - b.startSeconds);
if (!seg.length) throw new Error('empty carve');

// provenance: map score-time back to take-time via the H block marker
const mks = tt.objects.filter(o => o.type === 'marker');
const hMk = mks.find(m => m.label.startsWith('CLUST01-H'));
const hBank = JSON.parse(fs.readFileSync('bank/CLUST01-H.json', 'utf8'));
const takeT0 = hBank.window[0]; // H's first-onset region in the take
const t0 = seg[0].startSeconds;
const span = Math.max(...seg.map(n => n.endSeconds)) - t0;

fs.writeFileSync('bank/CLUST01-H1.json', JSON.stringify({
  entity: 'CLUST01-H1', source: 'scores/clust01-10track.json (CLUST01-H block) carve ' + WIN.join('-'),
  kind: 'pointillistic-cluster', created: new Date().toISOString(),
  takeWindowApprox: [+(takeT0 + (WIN[0] - hMk.time)).toFixed(2), +(takeT0 + (WIN[1] - hMk.time)).toFixed(2)],
  spanSec: +span.toFixed(2),
  notes: seg.map(n => ({ on: +(n.startSeconds - t0).toFixed(3), off: +(n.endSeconds - t0).toFixed(3),
    pitch: n.sonifyNote, vel: n.recVel != null ? n.recVel : 100,
    technique: n.technique || 'staccato', layer: n.layer })),
  provenance: 'composer carve 2026-08-13 (10-track distribution kept)',
}, null, 1));
console.log('banked CLUST01-H1:', seg.length, 'notes,', span.toFixed(2) + 's');

// insert into the piece after the blast (current disk state = composer's latest)
const piece = JSON.parse(fs.readFileSync('scores/piece-s04.json', 'utf8'));
const pdata = piece.data || piece;
const blast = pdata.objects.filter(o => o.groupId === 'grp-vert03-fp-01' && o.type === 'waveCurve');
const AT = +(Math.max(...blast.map(n => n.endSeconds)) + GAP_AFTER_BLAST).toFixed(2);

let nid = (pdata.nextId || 1) + 1;
const objs = pdata.objects.slice();
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: AT,
  label: 'CLUST01-H1', color: '#AD5F2A', groupId: GROUP,
  performanceNotes: '', properties: {} });
const shifted = seg.map(n => ({ ...n, id: 'wc-' + (nid++), groupId: GROUP,
  startSeconds: +(n.startSeconds - t0 + AT).toFixed(3),
  endSeconds: +(n.endSeconds - t0 + AT).toFixed(3) }));
objs.push(...shifted);

// filled rate-contour META shape
{
  const s0 = AT, s1 = +(AT + span).toFixed(3), W = 5;
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
    startSeconds: s0, endSeconds: s1,
    nodes, segments: nodes.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: '#AD5F2A', fillMode: 'bottom', opacity: 0.45, groupId: GROUP,
    performanceNotes: 'CLUST01-H1 (drag = move, edge = stretch)', properties: {} });
}

fs.writeFileSync('scores/piece-s05.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));
console.log('piece-s05:', objs.length, 'objects | H1 inserted at', AT + 's (blast ended',
  Math.max(...blast.map(n => n.endSeconds)).toFixed(2) + ')');
