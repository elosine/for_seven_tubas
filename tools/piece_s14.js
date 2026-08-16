// piece_s14.js — place DB3 (the third density buildup) into the piece.
// piece-s13 -> piece-s14.
//
// Source: scores/densBld03-take1-fp.json — the packed take with the fortepiano
// arc (PLAN 2t / D19-D22). 160 notes, ten lanes, HARD 0 / soft 0 in isolation.
// Per docs/DENSITY_PIPELINE.md §6 this goes in by PLACEMENT SCRIPT, not through
// the Insertion strip: the strip's cluster format has no field for layer,
// envShape, nodes or segments, so a round trip would flatten the orchestration.
//
// Note objects are copied WHOLESALE (technique, sonifyNote, recVel, sonifyMode,
// color, nodes, segments, envShape). Only id / groupId / startSeconds /
// endSeconds / performanceNotes are rewritten. Fixed-articulation lengths (D9)
// are therefore preserved exactly — nothing is rescaled.

const fs = require('fs');

const SRC = 'scores/piece-s13.json';
const BUILD = 'scores/densBld03-take1-fp.json';
const OUT = 'scores/piece-s14.json';
const GROUP = 'grp-db3-01';
const LABEL = 'DB3 — density buildup 3 (packed, fp arc)';
const COLOR = '#8E6BA8';              // new lineage; not used by any existing group
const META_LAYER = 10;
const GAP = 3.48;                     // the INT1 -> DB2 gap in the piece: the only
                                      // INT -> DB transition precedent we have
const W = 10;                         // rate-contour windows for the META shape

const piece = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const pdata = piece.data || piece;
const objs = pdata.objects.slice();
let nid = (pdata.nextId || 1) + 1;

// ---- where the piece currently ends -------------------------------------
const pieceNotes = objs.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER);
const pieceEnd = Math.max(...pieceNotes.map(n => n.endSeconds));
const AT = +(pieceEnd + GAP).toFixed(3);

// ---- the build -----------------------------------------------------------
const bdata = (() => { const b = JSON.parse(fs.readFileSync(BUILD, 'utf8')); return b.data || b; })();
const bNotes = bdata.objects.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER);
const t0 = Math.min(...bNotes.map(n => n.startSeconds));
const t1 = Math.max(...bNotes.map(n => n.endSeconds));
const span = +(t1 - t0).toFixed(3);
const dt = +(AT - t0).toFixed(3);

const TECH_LABEL = { fortepiano: 'DB3 fortepiano', staccato: 'DB3 staccato', cuivre: 'DB3 cuivre', ord: 'DB3 ord' };

const placed = bNotes.map(n => ({
    ...n,
    id: 'wc-' + (nid++),
    groupId: GROUP,
    startSeconds: +(n.startSeconds + dt).toFixed(3),
    endSeconds: +(n.endSeconds + dt).toFixed(3),
    performanceNotes: TECH_LABEL[n.technique] || ('DB3 ' + n.technique),
}));

// ---- marker + META group shape (rate contour, same convention as DB2) ----
objs.push({
    id: 'mk-' + (nid++), type: 'marker', layer: 0, time: AT,
    label: LABEL, color: COLOR, groupId: GROUP, performanceNotes: '', properties: {},
});
objs.push(...placed);

const rates = [];
for (let w = 0; w < W; w++) {
    const a = AT + (span * w) / W, b = AT + (span * (w + 1)) / W;
    rates.push(placed.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
}
const mx = Math.max(...rates, 1);
const nds = rates.map((r, i) => ({
    pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.6 + 8.9 * (r / mx)) * 10) / 10,
    smooth: 0.35,
}));
nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });

objs.push({
    id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER, groupId: GROUP,
    startSeconds: AT, endSeconds: +(AT + span).toFixed(3),
    nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: COLOR, fillMode: 'bottom', opacity: 0.45,
    performanceNotes: 'DB3 density contour (drag = move, edge/box = stretch)', properties: {},
});

fs.writeFileSync(OUT, JSON.stringify({
    ...pdata,
    metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
    objects: objs, nextId: nid,
}));

// ---- report ---------------------------------------------------------------
const tech = {};
placed.forEach(n => { tech[n.technique] = (tech[n.technique] || 0) + 1; });
const lanes = {};
placed.forEach(n => { lanes[n.layer] = (lanes[n.layer] || 0) + 1; });
console.log('piece ends at   ', pieceEnd.toFixed(3), 's');
console.log('DB3 placed at   ', AT, '->', (AT + span).toFixed(3), 's   (gap', GAP + 's, span', span + 's)');
console.log('notes           ', placed.length, JSON.stringify(tech));
console.log('per lane        ', JSON.stringify(lanes));
console.log('META shape      ', nds.length, 'nodes, rate profile', JSON.stringify(rates));
console.log('written         ', OUT, '—', objs.length, 'objects, nextId', nid);
