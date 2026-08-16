#!/usr/bin/env node
// place_gesture.js — recall a banked gesture and place it into a score.
//
// This plus `bank_gesture.js` IS the insertion path for orchestrated material
// (composer 2026-08-16: "I want to have it as an insertion option, just done
// differently"). The Insertion strip cannot carry a gesture like this — its two
// sources store a pitch set or a {t,p,v,d,tech} event stream, neither of which
// has a field for `layer`, `envShape`, `nodes` or `segments`, so a round trip
// flattens every hand-shaped surge back into a block (D23). A bank entry keeps
// the object array verbatim; this puts it down.
//
// Generalises tools/piece_s08.js and tools/piece_s14.js, which did this by hand.
//
//   node tools/place_gesture.js DB3 --into scores/piece-s14.json --after 3.48 --out scores/piece-s15.json
//   node tools/place_gesture.js DB3 --into scores/piece-s14.json --at 114.101  --out scores/piece-s15.json
//   node tools/place_gesture.js --list
//
// --after N   place N seconds after the LAST note in the score (the usual case)
// --at T      place the gesture's first note at exactly T seconds
// --dry       report only, write nothing

const fs = require('fs');
const path = require('path');

const META_LAYER = 10;
const BANK = path.join(__dirname, '..', 'bank');
const W = 10;                       // rate-contour windows for the META shape
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const has = n => args.includes('--' + n);

// ---- --list ---------------------------------------------------------------
if (has('list') || !args.length) {
    const rows = fs.readdirSync(BANK).filter(f => f.endsWith('.json')).map(f => {
        try {
            const g = JSON.parse(fs.readFileSync(path.join(BANK, f), 'utf8'));
            if (!g.entity || !Array.isArray(g.objects)) return null;
            const env = g.objects.filter(o => o.envShape).length;
            return { entity: g.entity, kind: g.kind || '', n: g.objects.length, span: g.spanSec,
                     parts: g.parts || new Set(g.objects.map(o => o.layer)).size, env, src: g.source || '' };
        } catch (e) { return null; }
    }).filter(Boolean);
    console.log('=== BANKED GESTURES (bank/*.json with an `objects` array) ===\n');
    console.log('  entity        kind            notes   span   parts   env   from');
    rows.forEach(r => console.log('  ' + r.entity.padEnd(13) + String(r.kind).padEnd(16) +
        String(r.n).padStart(5) + String(r.span).padStart(8) + 's' +
        String(r.parts).padStart(7) + String(r.env).padStart(6) + '   ' + r.src.slice(0, 52)));
    if (!rows.length) console.log('  (none)');
    process.exit(0);
}

const ENTITY = args[0].startsWith('--') ? null : args[0];
const INTO = flag('into', null);
const OUT = flag('out', null);
const AFTER = flag('after', null);
const AT = flag('at', null);
const DRY = has('dry');

if (!ENTITY || !INTO || (!OUT && !DRY)) {
    console.error('usage: node tools/place_gesture.js <ENTITY> --into <score.json> (--after <sec> | --at <sec>) --out <score.json> [--dry]');
    console.error('       node tools/place_gesture.js --list');
    process.exit(1);
}
if (AFTER == null && AT == null) { console.error('need --after <sec> or --at <sec>'); process.exit(1); }

const gPath = path.join(BANK, ENTITY + '.json');
if (!fs.existsSync(gPath)) { console.error('no bank entry: bank/' + ENTITY + '.json   (try --list)'); process.exit(1); }
const G = JSON.parse(fs.readFileSync(gPath, 'utf8'));
if (!Array.isArray(G.objects) || !G.objects.length) { console.error('bank/' + ENTITY + '.json has no objects array'); process.exit(1); }

const raw = JSON.parse(fs.readFileSync(INTO, 'utf8'));
const pdata = raw.data || raw;
const objs = pdata.objects.slice();
let nid = (pdata.nextId || 1) + 1;

// ---- where it lands -------------------------------------------------------
const existing = objs.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER);
const scoreEnd = existing.length ? Math.max(...existing.map(n => n.endSeconds)) : 0;
const gNotes = G.objects.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER);
const g0 = Math.min(...gNotes.map(n => n.startSeconds));
const span = +(Math.max(...gNotes.map(n => n.endSeconds)) - g0).toFixed(3);
const at = AT != null ? +parseFloat(AT).toFixed(3) : +(scoreEnd + parseFloat(AFTER)).toFixed(3);
const dt = +(at - g0).toFixed(3);

// group id: first free grp-<entity>-NN, so the same gesture can be placed twice
const slug = ENTITY.toLowerCase().replace(/[^a-z0-9]+/g, '-');
let seq = 1;
while (objs.some(o => o.groupId === 'grp-' + slug + '-' + String(seq).padStart(2, '0'))) seq++;
const GROUP = 'grp-' + slug + '-' + String(seq).padStart(2, '0');
const COLOR = G.color || '#7E8CA0';

// ---- place: notes copied WHOLESALE, only id/groupId/times rewritten --------
const placed = gNotes.map(n => ({
    ...JSON.parse(JSON.stringify(n)),
    id: 'wc-' + (nid++),
    groupId: GROUP,
    startSeconds: +(n.startSeconds + dt).toFixed(3),
    endSeconds: +(n.endSeconds + dt).toFixed(3),
}));

// marker + META group shape (density/rate contour) — same convention as the
// piece's existing grp-* gestures, and it makes the group draggable as a unit.
const marker = { id: 'mk-' + (nid++), type: 'marker', layer: 0, time: at,
    label: ENTITY + (G.kind && G.kind !== 'gesture' ? ' — ' + G.kind : ''),
    color: COLOR, groupId: GROUP, performanceNotes: '', properties: {} };

const rates = [];
for (let w = 0; w < W; w++) {
    const a = at + (span * w) / W, b = at + (span * (w + 1)) / W;
    rates.push(placed.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
}
const mx = Math.max(...rates, 1);
const nds = rates.map((r, i) => ({ pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.round((0.6 + 8.9 * (r / mx)) * 10) / 10, smooth: 0.35 }));
nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });
const meta = { id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER, groupId: GROUP,
    startSeconds: at, endSeconds: +(at + span).toFixed(3),
    nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: COLOR, fillMode: 'bottom', opacity: 0.45,
    performanceNotes: ENTITY + ' contour (drag = move, edge/box = stretch)', properties: {} };

objs.push(marker, ...placed, meta);

// ---- report ---------------------------------------------------------------
const tech = {}, lanes = {};
placed.forEach(n => { tech[n.technique] = (tech[n.technique] || 0) + 1; lanes[n.layer] = (lanes[n.layer] || 0) + 1; });
const env = placed.filter(n => n.envShape);
console.log('=== PLACE ' + ENTITY + ' → ' + path.basename(INTO) + ' ===');
console.log('  score ends   ', scoreEnd.toFixed(3) + 's');
console.log('  placed at    ', at + 's → ' + (at + span).toFixed(3) + 's   (span ' + span + 's' +
    (AFTER != null ? ', gap ' + AFTER + 's' : '') + ')');
console.log('  group        ', GROUP);
console.log('  notes        ', placed.length, JSON.stringify(tech));
console.log('  per lane     ', JSON.stringify(lanes));
console.log('  env-shaped   ', env.length, env.length ? '(' + env.map(n => n.startSeconds.toFixed(1) + 's').join(' ') + ')' : '');
console.log('  META shape   ', nds.length + ' nodes, rate profile ' + JSON.stringify(rates));

if (DRY) { console.log('\n  --dry: nothing written'); process.exit(0); }

fs.writeFileSync(OUT, JSON.stringify({ ...pdata,
    metadata: { ...(pdata.metadata || {}), modified: new Date().toISOString() },
    objects: objs, nextId: nid }));
console.log('  wrote        ', OUT + '  —  ' + objs.length + ' objects');
console.log('\n  now check it:  node tools/audit_playability.js ' + path.basename(OUT, '.json'));
