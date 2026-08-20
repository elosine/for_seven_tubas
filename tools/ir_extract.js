#!/usr/bin/env node
// ir_extract.js — S1 score → notation IR document (Phase B1, plan DB-6/DB-8).
// Usage:
//   node tools/ir_extract.js --score tranceA002f --w0 0 --w1 66.8 \
//        --parts 0-9 --id trance-section-01 --out notation/ir/trance-section-01.ir.json
// Prints stats; does NOT validate — run tools/ir_validate.js on the output
// (with --against-source --complete) as a separate, independent step.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Extract = require(path.join(ROOT, 'notation', 'lib', 'extract_core.js'));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}
const scoreName = arg('score');
const w0 = parseFloat(arg('w0')), w1 = parseFloat(arg('w1'));
const partsArg = arg('parts');
const id = arg('id');
const out = arg('out');
if (!scoreName || isNaN(w0) || isNaN(w1) || !partsArg || !id || !out) {
  console.error('usage: ir_extract.js --score <name> --w0 <s> --w1 <s> --parts <a-b|csv> --id <slug> --out <file>');
  process.exit(2);
}
const parts = partsArg.includes('-') && !partsArg.includes(',')
  ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(partsArg.split('-').map(Number))
  : partsArg.split(',').map(Number);

const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', scoreName + '.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const sampleLengths = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank', 'sample_lengths.json'), 'utf8'));

const { doc, warnings } = Extract.extract(score, {
  scoreName, window: [w0, w1], parts, id, registry, sampleLengths,
  date: new Date().toISOString().slice(0, 10),
  toolName: 'tools/ir_extract.js',
});

fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
fs.writeFileSync(path.join(ROOT, out), JSON.stringify(doc, null, 1));

const byStrategy = {};
for (const c of doc.chunks) byStrategy[c.strategy] = (byStrategy[c.strategy] || 0) + 1;
const byClass = {};
for (const c of doc.chunks) byClass[c.class] = (byClass[c.class] || 0) + 1;
const streamEvents = doc.events.filter(e => e.metric).length;
console.log(`wrote ${out}`);
console.log(`events: ${doc.events.length} (${streamEvents} on grids) · chunks: ${doc.chunks.length}`);
console.log('  by class:', JSON.stringify(byClass));
console.log('  by strategy:', JSON.stringify(byStrategy));
const worst = Math.max(0, ...doc.chunks.filter(c => c.tempo).map(c => c.tempo.maxErrSeconds));
console.log(`  worst stream fit error: ${(worst * 1000).toFixed(3)} ms`);
for (const w of warnings) console.warn('  warn: ' + w);
