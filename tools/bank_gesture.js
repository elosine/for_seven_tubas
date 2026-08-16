#!/usr/bin/env node
// bank_gesture.js — capture a finished, orchestrated gesture into bank/<ENTITY>.json
// so it can be RECALLED and placed again later.
//
// This is the "insertion option, done differently" (composer 2026-08-16). The
// Insertion strip cannot carry an orchestrated build — its two sources store a
// pitch set or a {t,p,v,d,tech} event stream, neither of which has a field for
// `layer`, `envShape`, `nodes` or `segments`, so a round trip flattens every
// hand-shaped surge back into a block (D23, DENSITY_PIPELINE.md §6). A bank
// entry keeps the whole object array verbatim instead, and `place_gesture.js`
// puts it into a score.
//
// Format follows bank/GESTURE-2.json, which was banked by hand in the same
// situation (composer 2026-08-13: "save this one as a gesture").
//
//   node tools/bank_gesture.js scores/densBld03-arc-v2b.json --section E \
//        --entity DB3 --color '#8E6BA8' --label 'DB3' \
//        --note "composer's hand-grained copy: fp arc + 5 surge long tones"
//
// Without --section the whole score becomes the gesture.

const fs = require('fs');
const path = require('path');

const META_LAYER = 10;
const BANK = path.join(__dirname, '..', 'bank');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const SRC = args[0];
const SECTION = flag('section', null);
const ENTITY = flag('entity', null);
const COLOR = flag('color', '#7E8CA0');
const LABEL = flag('label', null);          // short tag for per-note performanceNotes
const NOTE = flag('note', '');
const KIND = flag('kind', 'gesture');
const FORCE = args.includes('--force');

if (!SRC || SRC.startsWith('--') || !ENTITY) {
    console.error('usage: node tools/bank_gesture.js <score.json> --entity <NAME> [--section <letter>]');
    console.error('       [--color "#RRGGBB"] [--label <tag>] [--note "<provenance>"] [--kind <kind>] [--force]');
    process.exit(1);
}

const OUT = path.join(BANK, ENTITY + '.json');
if (fs.existsSync(OUT) && !FORCE) {
    console.error('bank/' + ENTITY + '.json already exists. Re-run with --force to overwrite, or pick another --entity.');
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const data = raw.data || raw;
const all = data.objects.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null);

// section matching, same rule as extract_section.js
const isLetter = SECTION && /^[A-Za-z]$/.test(SECTION);
const matches = n => {
    if (!SECTION) return true;
    const lbl = String(n.performanceNotes || '');
    return isLetter ? lbl.slice(0, 1).toUpperCase() === SECTION.toUpperCase()
                    : lbl.toLowerCase().includes(SECTION.toLowerCase());
};
const picked = all.filter(matches);
if (!picked.length) {
    console.error('no notes matched --section "' + SECTION + '". sections present:\n  ' +
        [...new Set(all.map(n => n.performanceNotes))].join('\n  '));
    process.exit(1);
}
const secLabels = [...new Set(picked.map(n => n.performanceNotes))];
if (SECTION && secLabels.length > 1) {
    console.error('ambiguous --section: matched ' + secLabels.length + ' sections:\n  ' + secLabels.join('\n  '));
    process.exit(1);
}

const t0 = Math.min(...picked.map(n => n.startSeconds));
const span = +(Math.max(...picked.map(n => n.endSeconds)) - t0).toFixed(3);
const tag = LABEL || ENTITY;

// Notes are copied WHOLESALE — envShape, nodes, segments, technique, sonifyNote,
// recVel, sonifyMode, colour all survive. Only ids, times and the section-residue
// label are rewritten; groupId is dropped (it is assigned at placement).
let nid = 1;
const objects = picked
    .slice()
    .sort((a, b) => a.startSeconds - b.startSeconds || a.layer - b.layer)
    .map(n => {
        const c = JSON.parse(JSON.stringify(n));
        delete c.groupId;
        c.id = 'wc-' + (nid++);
        c.startSeconds = +(n.startSeconds - t0).toFixed(3);
        c.endSeconds = +(n.endSeconds - t0).toFixed(3);
        c.performanceNotes = tag + ' ' + (c.envShape ? c.envShape : c.technique);
        return c;
    });

const entry = {
    entity: ENTITY,
    source: SRC + (SECTION ? ' section "' + secLabels[0] + '"' : ''),
    kind: KIND,
    color: COLOR,
    created: new Date().toISOString(),
    spanSec: span,
    parts: new Set(objects.map(o => o.layer)).size,
    objects,
    provenance: NOTE,
};
fs.writeFileSync(OUT, JSON.stringify(entry, null, 1));

// ---- report ----------------------------------------------------------------
const tech = {}, lanes = {};
objects.forEach(n => { tech[n.technique] = (tech[n.technique] || 0) + 1; lanes[n.layer] = (lanes[n.layer] || 0) + 1; });
const env = objects.filter(n => n.envShape);
console.log('=== BANKED — ' + ENTITY + ' ===');
console.log('  from         ', entry.source);
console.log('  notes        ', objects.length, JSON.stringify(tech));
console.log('  span         ', span + 's over', entry.parts, 'parts   ' + JSON.stringify(lanes));
console.log('  env-shaped   ', env.length, env.length ? JSON.stringify([...new Set(env.map(n => n.envShape))]) : '');
env.forEach(n => console.log('       L' + n.layer + '  ' + n.startSeconds.toFixed(3) + '→' + n.endSeconds.toFixed(3) +
    '  midi ' + n.sonifyNote + '  ' + n.technique + '/' + n.envShape));
console.log('  wrote        ', 'bank/' + ENTITY + '.json');
console.log('\n  recall it with:  node tools/place_gesture.js ' + ENTITY + ' --into scores/<piece>.json --after 3.48 --out scores/<next>.json');
