#!/usr/bin/env node
// extract_section.js — pull ONE section out of a version-arc score into a
// standalone score, rebased to t=0.
//
// `tools/build_versions.js` lays several versions of a gesture end to end in one
// file and tags every note with the section label in `performanceNotes`
// ("E · YOUR COPY — edit grains here"). Once the composer has edited a section
// by hand — grain envelopes, deletions, moves — that section, not the tool
// output that seeded it, is the live version of the gesture. This gets it back
// out so the rest of the pipeline (tonality variants, placement into the piece)
// can run on the EDITED material.
//
// Notes are copied WHOLESALE: envShape, nodes, segments, technique, sonifyNote,
// recVel, sonifyMode, color. Only id and the times change.
//
//   node tools/extract_section.js scores/densBld03-arc-v2b.json --section E \
//        --out scores/densBld03-take1-surge.json

const fs = require('fs');
const path = require('path');

const META_LAYER = 10;
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const SRC = args[0];
const SECTION = flag('section', null);
const OUT = flag('out', null);
const KEEP_T0 = args.includes('--keep-times');

if (!SRC || SRC.startsWith('--') || !SECTION || !OUT) {
    console.error('usage: node tools/extract_section.js <arc-score.json> --section <letter|substring> --out <file> [--keep-times]');
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const data = raw.data || raw;
const allNotes = data.objects.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null);

// Section labels look like "E · YOUR COPY — edit grains here". Match a bare
// letter against the label's leading token, anything longer as a substring.
const isLetter = /^[A-Za-z]$/.test(SECTION);
const matches = n => {
    const lbl = String(n.performanceNotes || '');
    return isLetter ? lbl.slice(0, 1).toUpperCase() === SECTION.toUpperCase()
                    : lbl.toLowerCase().includes(SECTION.toLowerCase());
};

const sections = [...new Set(allNotes.map(n => n.performanceNotes))];
const picked = allNotes.filter(matches);
if (!picked.length) {
    console.error('no notes matched section "' + SECTION + '".\nsections present:\n  ' + sections.join('\n  '));
    process.exit(1);
}
const label = [...new Set(picked.map(n => n.performanceNotes))];
if (label.length > 1) {
    console.error('ambiguous: "' + SECTION + '" matched ' + label.length + ' sections:\n  ' + label.join('\n  '));
    process.exit(1);
}

const t0 = KEEP_T0 ? 0 : Math.min(...picked.map(n => n.startSeconds));
let nid = 1;
const objs = picked
    .slice()
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map(n => ({
        ...JSON.parse(JSON.stringify(n)),
        id: 'wc-' + (nid++),
        startSeconds: +(n.startSeconds - t0).toFixed(3),
        endSeconds: +(n.endSeconds - t0).toFixed(3),
    }));

const out = { ...data, objects: objs, markers: [], nextId: nid,
    metadata: { ...(data.metadata || {}), modified: new Date().toISOString() } };
fs.writeFileSync(OUT, JSON.stringify(out));

// ---- report ----------------------------------------------------------------
const tech = {}, lanes = {};
objs.forEach(n => { tech[n.technique] = (tech[n.technique] || 0) + 1; lanes[n.layer] = (lanes[n.layer] || 0) + 1; });
const env = objs.filter(n => n.envShape);
console.log('=== EXTRACT — ' + path.basename(SRC) + '  section "' + label[0] + '" ===');
console.log('  notes        ', objs.length, JSON.stringify(tech));
console.log('  span         ', Math.min(...objs.map(n => n.startSeconds)).toFixed(3), '→',
    Math.max(...objs.map(n => n.endSeconds)).toFixed(3), 's   (rebased from ' + t0.toFixed(3) + 's)');
console.log('  per lane     ', JSON.stringify(lanes));
console.log('  env-shaped   ', env.length, env.length ? JSON.stringify([...new Set(env.map(n => n.envShape))]) : '');
env.forEach(n => console.log('       L' + n.layer + '  ' + n.startSeconds.toFixed(3) + '→' + n.endSeconds.toFixed(3) +
    '  midi ' + n.sonifyNote + '  ' + n.technique + '/' + n.envShape));
console.log('  wrote        ', OUT);
