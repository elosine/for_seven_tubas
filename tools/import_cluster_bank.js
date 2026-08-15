// import_cluster_bank.js — seed bank/cluster_bank.json from everything the
// composer has PLAYED (composer 2026-08-15: "all the banks import").
//   - CLUST01-* (incl. carves), CLUST02-A, CLOUD02-A..L  (bank notes arrays)
//   - GESTURE-1 (the opening density build, from piece-s09 grp-g1-opening)
//   - GESTURE-2 (the second density build, bank/GESTURE-2.json objects)
// Events normalized to {t, p, v, d, tech}, t from 0. Re-runnable: preserves
// recorded clusters (REC-*), snippets, gestures and lists.

const fs = require('fs');

const OUT = 'bank/cluster_bank.json';
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const bank = {
  _contract: 'Cluster sandbox data (see docs/TAXONOMY.md addendum). clusters = playable source material (imported takes + REC-* recordings); snippets = {cluster,t0,t1} pointers (transitional); gestures = CG### baked keepers with provenance; lists = named selections of gesture ids.',
  clusters: {},
  snippets: (prev.snippets) || {},
  gestures: (prev.gestures) || {},
  lists: (prev.lists) || {},
};

const put = (id, name, family, events, src) => {
  if (!events.length) { console.log('SKIP (empty):', id); return; }
  const t0 = Math.min(...events.map(e => e.t));
  events = events.map(e => ({ t: +(e.t - t0).toFixed(3), p: e.p, v: e.v,
    d: +e.d.toFixed(3), tech: e.tech })).sort((a, b) => a.t - b.t);
  bank.clusters[id] = { name, family, src,
    span: +Math.max(...events.map(e => e.t + e.d)).toFixed(3),
    n: events.length, events };
};

// ---- bank note-array entities ----
const families = fs.readdirSync('bank').filter(f =>
  /^(CLUST01|CLUST02|CLOUD02)-/.test(f) && f.endsWith('.json'));
for (const f of families.sort()) {
  const d = JSON.parse(fs.readFileSync('bank/' + f, 'utf8'));
  const id = d.entity || f.replace('.json', '');
  const notes = d.notes || [];
  put(id, id, id.split('-')[0],
    notes.map(n => ({ t: n.on, p: n.pitch, v: n.vel, d: Math.max(0.05, n.off - n.on),
      tech: n.technique || 'staccato' })), 'bank/' + f);
}

// ---- GESTURE-1: the opening, extracted from the piece ----
const piece = JSON.parse(fs.readFileSync('scores/piece-s09.json', 'utf8'));
const g1 = piece.objects.filter(o => o.groupId === 'grp-g1-opening' &&
  o.type === 'waveCurve' && o.layer < 10 && o.sonifyNote != null);
put('GESTURE-1', 'GESTURE-1 (opening density build)', 'DENSITY',
  g1.map(o => ({ t: o.startSeconds, p: o.sonifyNote, v: o.recVel || 100,
    d: Math.max(0.05, o.endSeconds - o.startSeconds), tech: o.technique || 'staccato' })),
  'scores/piece-s09.json#grp-g1-opening');

// ---- GESTURE-2: banked objects ----
const g2 = JSON.parse(fs.readFileSync('bank/GESTURE-2.json', 'utf8'));
const g2n = g2.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
put('GESTURE-2', 'GESTURE-2 (second density build)', 'DENSITY',
  g2n.map(o => ({ t: o.startSeconds, p: o.sonifyNote, v: o.recVel || 100,
    d: Math.max(0.05, o.endSeconds - o.startSeconds), tech: o.technique || 'staccato' })),
  'bank/GESTURE-2.json');

fs.writeFileSync(OUT, JSON.stringify(bank, null, 1));
const fams = {};
Object.values(bank.clusters).forEach(c => { fams[c.family] = (fams[c.family] || 0) + 1; });
console.log('cluster_bank.json:', Object.keys(bank.clusters).length, 'clusters —',
  Object.entries(fams).map(([k, v]) => k + ' x' + v).join(', '));
