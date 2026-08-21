#!/usr/bin/env node
// notate_section.js — V3: THE TRIAL-INSERTION LOOP, one command.
// Score name + window + profile -> extracted IR + validation + picker
// entry. The composer-score insert loop, ported to notation trials: after
// this, the section is one dropdown pick away in the container windows.
// Unhandled material renders as parachute bricks BY DESIGN — mixed
// fidelity always ships.
//
//   node tools/notate_section.js --score piece-s25-finished01 --w0 0 --w1 40
//        [--parts 0-9] [--profile trance|section1] [--id slug] [--label text]
//
// Steps: extract (extract_core, same as ir_extract.js) -> validate
// (ir_validate.js --against-source --complete, an INDEPENDENT process) ->
// write notation/ir/<id>.ir.json -> update notation/ir/index.json (the
// manifest the app's picker reads). Refresh the app; the section is there.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Extract = require(path.join(ROOT, 'notation', 'lib', 'extract_core.js'));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}
const scoreName = arg('score');
const w0 = parseFloat(arg('w0')), w1 = parseFloat(arg('w1'));
if (!scoreName || isNaN(w0) || isNaN(w1)) {
  console.error('usage: notate_section.js --score <name> --w0 <s> --w1 <s> [--parts 0-9] [--profile trance|section1] [--id slug] [--label text]');
  process.exit(2);
}
const partsArg = arg('parts', '0-9');
const parts = partsArg.includes('-') && !partsArg.includes(',')
  ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(partsArg.split('-').map(Number))
  : partsArg.split(',').map(Number);
const profile = arg('profile', 'trance');
const id = arg('id', (scoreName + '-' + w0 + '-' + w1).replace(/[^a-zA-Z0-9-]/g, '-'));
const label = arg('label', id + ' (' + profile + ')');
const outRel = 'notation/ir/' + id + '.ir.json';

const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', scoreName + '.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const sampleLengths = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank', 'sample_lengths.json'), 'utf8'));

const { doc, warnings } = Extract.extract(score, {
  scoreName, window: [w0, w1], parts, id, registry, sampleLengths, profile, options: {},
  date: new Date().toISOString().slice(0, 10),
  toolName: 'tools/notate_section.js (profile ' + profile + ')',
});
fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(doc, null, 1));

// independent validation — a failed doc is REMOVED, never left half-usable
try {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'ir_validate.js'), outRel, '--against-source', '--complete'],
    { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  fs.unlinkSync(path.join(ROOT, outRel));
  console.error('VALIDATION FAILED — IR removed:\n' + String(e.stdout || '') + String(e.stderr || ''));
  process.exit(1);
}

// picker manifest (the app reads this; hardcoded options remain as fallback)
const manifestPath = path.join(ROOT, 'notation', 'ir', 'index.json');
let manifest = { irs: [] };
if (fs.existsSync(manifestPath)) manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.irs = manifest.irs.filter(e => e.id !== id);
manifest.irs.push({ id, label, score: scoreName, window: [w0, w1], profile });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

const byStrategy = {};
for (const c of doc.chunks) byStrategy[c.strategy] = (byStrategy[c.strategy] || 0) + 1;
console.log('READY: ' + id + ' — ' + doc.events.length + ' events, ' + doc.chunks.length + ' chunks ' +
  JSON.stringify(byStrategy) + ' · VALID vs source · in the picker as "' + label + '"');
for (const w of warnings) console.warn('  warn: ' + w);
