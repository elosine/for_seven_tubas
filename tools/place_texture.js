#!/usr/bin/env node
// place_texture.js — PLAN 2x §12. Put a texture into a score.
//
//   node tools/place_texture.js --list
//   node tools/place_texture.js --model RAIN --into piece-s18 --at 40 --out untitled-tex
//   node tools/place_texture.js --actual ACT-RAIN-01 --into untitled --after 3 --out untitled
//   node tools/place_texture.js --model RAIN --dur 20 --at 40 --into untitled --dry
//
// Two sources, one placement path:
//   --model <NAME>    REGENERATE from the model's spec (R10 — a texture is its
//                     parameters, so this stays adjustable: --dur, --seed)
//   --actual <ENTITY> RECALL the exact banked render, and log the placement back
//                     into the actual's `placements` array
//
// Conventions are 2w's, deliberately identical to tools/place_gesture.js so a
// texture drags, scales and reads like every other grouped gesture in the piece:
// one `grp-<slug>-NN` groupId across notes + marker + META shape, notes copied
// wholesale with only id/groupId/times rewritten, and a density contour on the
// META layer so there is something to grab.
//
// D23: density material enters the piece by PLACEMENT SCRIPT, not through the
// Insertion strip. The panel's "Insert @ cursor" covers the interactive case.

const fs = require('fs');
const path = require('path');
const TX = require('../score/public/texture_engine.js');
const TON = require('../score/public/tonality.js');

const ROOT = path.join(__dirname, '..');
const SCORES = path.join(ROOT, 'scores');
const ACTUALS_DIR = path.join(ROOT, 'bank/texture_actuals');
const MODELS_PATH = path.join(ROOT, 'bank/texture_models.json');
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
const OPTS = { sampleLengths: SAMPLE_LEN, tonality: TON, maxLanes: 10 };
const META_LAYER = 10;
const COLOR = '#3F7D5A';

const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? (d === undefined ? null : d) : argv[i + 1]; };
const has = k => argv.indexOf('--' + k) >= 0;
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));

if (has('list') || !argv.length) {
    const store = readJSON(MODELS_PATH);
    console.log('MODELS (regenerable — --model <NAME>):');
    Object.keys(store.models).forEach(id => {
        const rb = store.models[id].robustness || {};
        console.log('  ' + id.padEnd(14) + (store.models[id].label || '').padEnd(22) +
            (rb.survives === true ? 'survives' : rb.survives === false ? 'DOES NOT survive' : 'UNHEARD'));
    });
    console.log('\nACTUALS (exact banked renders — --actual <ENTITY>):');
    const acts = fs.existsSync(ACTUALS_DIR)
        ? fs.readdirSync(ACTUALS_DIR).filter(f => /^ACT-.*\.json$/.test(f)) : [];
    if (!acts.length) console.log('  none banked yet.');
    acts.forEach(f => {
        const a = readJSON(path.join(ACTUALS_DIR, f));
        console.log('  ' + a.entity.padEnd(22) + (a.label || '').slice(0, 50));
    });
    process.exit(0);
}

const MODEL = flag('model'), ACTUAL = flag('actual');
const INTO = flag('into'), OUT = flag('out'), AT = flag('at'), AFTER = flag('after');
const DRY = has('dry');
if (!MODEL && !ACTUAL) { console.error('need --model <NAME> or --actual <ENTITY>'); process.exit(1); }
if (!INTO) { console.error('need --into <score name>'); process.exit(1); }
if (AT == null && AFTER == null) { console.error('need --at <sec> or --after <sec>'); process.exit(1); }

// ---- the material -----------------------------------------------------------
let objects, label, slug, provenanceNote;
if (ACTUAL) {
    const p = path.join(ACTUALS_DIR, ACTUAL.replace(/\.json$/, '') + '.json');
    if (!fs.existsSync(p)) { console.error('no actual ' + ACTUAL); process.exit(1); }
    const a = readJSON(p);
    objects = a.objects;
    label = a.label;
    slug = a.provenance.model.toLowerCase();
    provenanceNote = 'ACTUAL ' + a.entity + ' (model ' + a.provenance.model +
        ', seed ' + a.provenance.seed + ')';
} else {
    const store = readJSON(MODELS_PATH);
    const m = store.models[MODEL];
    if (!m) { console.error('no model ' + MODEL + ' — have: ' + Object.keys(store.models).join(', ')); process.exit(1); }
    const spec = JSON.parse(JSON.stringify(m.spec));
    if (flag('dur')) spec.sections.forEach(s => { s.dur = Number(flag('dur')); });
    if (flag('seed') != null) spec.seed = Number(flag('seed'));
    const g = TX.render(spec, OPTS);
    objects = g.objects;
    label = (m.label || MODEL) + ' · ' + spec.sections[0].dur + ' s · seed ' +
        (spec.seed != null ? spec.seed : 0);
    slug = MODEL.toLowerCase();
    provenanceNote = 'MODEL ' + MODEL + ' regenerated (seed ' + (spec.seed != null ? spec.seed : 0) + ')';
    // never place a texture whose robustness nobody has judged without saying so
    const rb = m.robustness || {};
    if (rb.survives === null || rb.survives === undefined) {
        console.log('  NOTE: ' + MODEL + ' has no robustness verdict yet (§9) — placing it is fine,' +
            '\n        but nobody has heard whether it survives human timing error.');
    }
}

// ---- the target score -------------------------------------------------------
const intoPath = path.join(SCORES, INTO.replace(/\.json$/, '') + '.json');
if (!fs.existsSync(intoPath)) { console.error('no score ' + intoPath); process.exit(1); }
const score = readJSON(intoPath);
const objs = score.objects || [];
let nid = score.nextId || (objs.length + 1);

const lastEnd = objs.reduce((m, o) => Math.max(m, o.endSeconds || o.time || 0), 0);
const at = AT != null ? Number(AT) : lastEnd + Number(AFTER);

// group id: first free grp-<slug>-NN, so the same texture can be placed twice
let seq = 1;
while (objs.some(o => o.groupId === 'grp-' + slug + '-' + String(seq).padStart(2, '0'))) seq++;
const GROUP = 'grp-' + slug + '-' + String(seq).padStart(2, '0');

// ---- place ------------------------------------------------------------------
const placed = TX.toScoreObjects({ objects: objects }, at, {
    groupId: GROUP, startId: nid, color: COLOR,
});
nid += placed.length + 4;
const span = TX.spanOf({ objects: objects });
const notes = placed.filter(o => o.type === 'waveCurve');

// density contour on the META layer — for a flat-level field this is the shape
// the ear tracks, and it is what place_gesture draws for density material (2w)
const W = 12, prof = [];
const lo = Math.min.apply(null, notes.map(o => o.startSeconds));
for (let w = 0; w < W; w++) {
    const a = lo + (span * w) / W, b = lo + (span * (w + 1)) / W;
    prof.push(notes.filter(o => o.startSeconds >= a && o.startSeconds < b).length);
}
const peak = Math.max(1, Math.max.apply(null, prof));
const nds = prof.map((c, i) => ({ pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
    y: Math.max(0.4, Math.min(10, Math.round((c / peak) * 8 * 10) / 10)), smooth: 0.35 }));
nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });
const meta = { id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER, groupId: GROUP,
    startSeconds: +at.toFixed(3), endSeconds: +(at + span).toFixed(3),
    nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
    color: COLOR, fillMode: 'bottom', opacity: 0.45,
    performanceNotes: 'TEXTURE ' + label + ' — density contour (drag = move, edge/box = stretch)',
    properties: {} };

// ---- audit, using the SAME law as the panel and audit_playability -----------
const merged = objs.concat(placed, [meta]);
const before = TX.playability(objs);
const after = TX.playability(merged);
console.log('\n=== place ' + provenanceNote + ' into ' + INTO + ' @ ' + at.toFixed(2) + 's ===');
console.log('  ' + notes.length + ' attacks over ' + new Set(notes.map(o => o.layer)).size +
    ' parts, ' + span.toFixed(2) + ' s, group ' + GROUP);
console.log('  playability  before: ' + before.hard + ' hard / ' + before.soft + ' soft' +
    '   after: ' + after.hard + ' hard / ' + after.soft + ' soft' +
    (after.hard > before.hard ? '   *** THIS PLACEMENT ADDS ' + (after.hard - before.hard) +
        ' HARD CONFLICTS ***' : ''));
if (DRY) { console.log('\n  --dry: nothing written.'); process.exit(0); }

if (!OUT) { console.error('need --out <score name> (or --dry)'); process.exit(1); }
score.objects = merged;
score.nextId = nid;
score.metadata = score.metadata || {};
score.metadata.modified = new Date().toISOString();
const outPath = path.join(SCORES, OUT.replace(/\.json$/, '') + '.json');
fs.writeFileSync(outPath, JSON.stringify(score));
console.log('  wrote scores/' + path.basename(outPath));

// log the placement back into the actual, so an ACTUAL knows where it lives
if (ACTUAL) {
    const p = path.join(ACTUALS_DIR, ACTUAL.replace(/\.json$/, '') + '.json');
    const a = readJSON(p);
    a.placements = a.placements || [];
    a.placements.push({ score: path.basename(outPath, '.json'), at: +at.toFixed(3), groupId: GROUP,
        placed: new Date().toISOString().slice(0, 10) });
    fs.writeFileSync(p, JSON.stringify(a, null, 2) + '\n');
    console.log('  logged the placement in ' + ACTUAL + ' (' + a.placements.length + ' total)');
}
