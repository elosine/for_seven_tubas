// piece_s08.js — composer dictation 2026-08-14: in the piece, swap the two
// clusters for the denser clouds and keep every GAP identical:
//   CLUST02-A scr2 x BbE-2oct  ->  CLOUD02-I   (starts 36.19, as dictated)
//   CLUST01-H1                 ->  CLOUD02-D
// Everything downstream (fp blast, ord blast, GESTURE-2) shifts so the
// silences between gestures are exactly what the composer set in s07c.
// piece-s07c -> piece-s08. Each cloud gets its grouped filled META shape.

const fs = require('fs');

const SRC = 'scores/piece-s07c.json';
const AT_I = 36.19;
const META_LAYER = 10;
const CLOUD_COLOR = '#5E8C7A';

const piece = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const pdata = piece.data || piece;

const groupsOf = objs => {
  const g = {};
  objs.forEach(o => { if (o.groupId) (g[o.groupId] = g[o.groupId] || []).push(o); });
  return g;
};
const extentOf = arr => {
  const notes = arr.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER);
  return [Math.min(...notes.map(n => n.startSeconds)), Math.max(...notes.map(n => n.endSeconds))];
};
const G = groupsOf(pdata.objects);
const ext = Object.fromEntries(Object.entries(G).map(([k, v]) => [k, extentOf(v)]));

// the gaps the composer set (silence between consecutive gestures)
const gap = (a, b) => +(ext[b][0] - ext[a][1]).toFixed(3);
const GAPS = {
  toVert: gap('grp-scr2-bbe-01', 'grp-vert03-fp-01'),   // cluster -> fp blast
  toD: gap('grp-vert03-fp-01', 'grp-h1-01'),            // fp blast -> cluster
  toOct: gap('grp-h1-01', 'grp-octbb-ord-01'),          // cluster -> ord blast
  toGest2: gap('grp-octbb-ord-01', 'grp-gest2-75-01'),  // ord blast -> GESTURE-2
};
console.log('preserved gaps:', JSON.stringify(GAPS));

// ---- build the new timeline ----
const loadCloud = id => {
  const b = JSON.parse(fs.readFileSync('bank/CLOUD02-' + id + '.json', 'utf8'));
  const t0 = Math.min(...b.performable.map(n => n.on));
  const t1 = Math.max(...b.performable.map(n => n.off));
  return { id, notes: b.performable, t0, span: +(t1 - t0).toFixed(3) };
};
const CI = loadCloud('I'), CD = loadCloud('D');

const durOf = g => +(ext[g][1] - ext[g][0]).toFixed(3);
const plan = {};
plan.cloudI = [AT_I, +(AT_I + CI.span).toFixed(3)];
plan.vert = [+(plan.cloudI[1] + GAPS.toVert).toFixed(3), 0];
plan.vert[1] = +(plan.vert[0] + durOf('grp-vert03-fp-01')).toFixed(3);
plan.cloudD = [+(plan.vert[1] + GAPS.toD).toFixed(3), 0];
plan.cloudD[1] = +(plan.cloudD[0] + CD.span).toFixed(3);
plan.oct = [+(plan.cloudD[1] + GAPS.toOct).toFixed(3), 0];
plan.oct[1] = +(plan.oct[0] + durOf('grp-octbb-ord-01')).toFixed(3);
plan.gest2 = [+(plan.oct[1] + GAPS.toGest2).toFixed(3), 0];
plan.gest2[1] = +(plan.gest2[0] + durOf('grp-gest2-75-01')).toFixed(3);

// shift an existing group to a new start
const shiftGroup = (objs, gid, newStart) => {
  const dt = +(newStart - ext[gid][0]).toFixed(3);
  objs.forEach(o => {
    if (o.groupId !== gid) return;
    if (o.type === 'marker') o.time = +(o.time + dt).toFixed(3);
    else { o.startSeconds = +(o.startSeconds + dt).toFixed(3); o.endSeconds = +(o.endSeconds + dt).toFixed(3); }
  });
  return dt;
};

// drop the two replaced gestures
const REMOVED = ['grp-scr2-bbe-01', 'grp-h1-01'];
const objs = pdata.objects.filter(o => !REMOVED.includes(o.groupId));
let nid = (pdata.nextId || 1) + 1;

// insert a cloud as a grouped gesture with filled rate-contour META shape
function insertCloud(cloud, at) {
  const GROUP = 'grp-cloud02-' + cloud.id.toLowerCase() + '-01';
  const label = 'CLOUD02-' + cloud.id;
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +at.toFixed(3),
    label, color: CLOUD_COLOR, groupId: GROUP, performanceNotes: '', properties: {} });
  const placed = cloud.notes.map(n => {
    const on = +(at + n.on - cloud.t0).toFixed(3);
    const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
    return { id: 'wc-' + (nid++), type: 'waveCurve', layer: n.layer, groupId: GROUP,
      startSeconds: on, endSeconds: +(on + n.off - n.on).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: CLOUD_COLOR, fillMode: 'bottom', opacity: 0.55,
      performanceNotes: label, properties: {},
      sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel };
  });
  objs.push(...placed);
  const W = 6, rates = [];
  for (let w = 0; w < W; w++) {
    const a = at + (cloud.span * w) / W, b = at + (cloud.span * (w + 1)) / W;
    rates.push(placed.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
  }
  const mx = Math.max(...rates, 1);
  const nds = rates.map((r, i) => ({ pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.5 + 9 * (r / mx)) * 10) / 10, smooth: 0.35 }));
  nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
  nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER, groupId: GROUP,
    startSeconds: +at.toFixed(3), endSeconds: +(at + cloud.span).toFixed(3),
    nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: CLOUD_COLOR, fillMode: 'bottom', opacity: 0.45,
    performanceNotes: label + ' (drag = move, edge/box = stretch)', properties: {} });
  return { GROUP, n: placed.length };
}

const insI = insertCloud(CI, plan.cloudI[0]);
const insD = insertCloud(CD, plan.cloudD[0]);
const dVert = shiftGroup(objs, 'grp-vert03-fp-01', plan.vert[0]);
const dOct = shiftGroup(objs, 'grp-octbb-ord-01', plan.oct[0]);
const dGest = shiftGroup(objs, 'grp-gest2-75-01', plan.gest2[0]);

fs.writeFileSync('scores/piece-s08.json', JSON.stringify({ ...pdata,
  metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
  objects: objs, nextId: nid }));

console.log('CLOUD02-I:', insI.n, 'notes at', plan.cloudI.join('-'));
console.log('vert03 fp blast shifted', dVert >= 0 ? '+' : '', dVert, '->', plan.vert.join('-'));
console.log('CLOUD02-D:', insD.n, 'notes at', plan.cloudD.join('-'));
console.log('ord blast shifted', dOct >= 0 ? '+' : '', dOct, '->', plan.oct.join('-'));
console.log('GESTURE-2 shifted', dGest >= 0 ? '+' : '', dGest, '->', plan.gest2.join('-'));
console.log('piece-s08:', objs.length, 'objects');
