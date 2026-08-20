#!/usr/bin/env node
// test_extract_played.js — D1 gate: the 'section1' (played-material)
// extraction profile. Synthetic recovery, outlier isolation (the sub-run
// claim), residue rules, and the REAL-DATA coverage cross-check against
// D43's independently-measured numbers. Snapshot + --prove-red.
//   node tools/test_extract_played.js [--update] [--prove-red]

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Extract = require(path.join(ROOT, 'notation', 'lib', 'extract_core.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Splice = require(path.join(ROOT, 'notation', 'lib', 'splice.js'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'page_rules.json'), 'utf8'));
const sampleLengths = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank', 'sample_lengths.json'), 'utf8'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'extract_played_snapshot.json');

let failures = 0;
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };
const between = (x, lo, hi, msg) => { if (x < lo || x > hi) { failures++; console.error(`FAIL ${msg}: ${x} not in [${lo}, ${hi}]`); } };

function xt(objs, eps) {
  return Extract.extract({ objects: objs }, {
    scoreName: 'synthetic', window: [0, 60], parts: [0], id: 't',
    registry, sampleLengths, profile: 'section1', options: { EPS: eps },
    date: 'x', toolName: 't',
  }).doc;
}
const note = (id, t) => ({ id, type: 'waveCurve', layer: 0, startSeconds: +t.toFixed(6), endSeconds: +(t + 0.2).toFixed(6), sonifyNote: 45, technique: 'staccato', nodes: [{}, {}] });

// ---- jittered unit recovery: 0.15 s pulse with deterministic ±8 ms jitter ----
{
  const objs = [];
  for (let n = 0; n < 20; n++) objs.push(note('wa-' + n, n * 0.15 + 0.008 * Math.sin(n * 2.399)));
  const d = xt(objs, 0.02);
  const bars = d.chunks.filter(c => c.strategy === 'simple-bar');
  eq(bars.length, 1, 0, 'jittered pulse claims one bar');
  between(bars[0].tempo.unitSeconds, 0.140, 0.160, 'recovered unit near 150 ms');
  eq(d.events.filter(e => e.metric).length, 20, 0, 'all 20 notes on the grid');
}
// ---- one outlier must NOT condemn the run (sub-run claim) ----
{
  const objs = [];
  for (let n = 0; n < 20; n++) objs.push(note('wb-' + n, n * 0.15));
  objs[10].startSeconds = +(10 * 0.15 + 0.06).toFixed(6); // 60 ms out — unfittable at eps 20
  const d = xt(objs, 0.02);
  const bars = d.chunks.filter(c => c.strategy === 'simple-bar');
  ok(bars.length >= 1, 'outlier: at least one bar still claimed');
  const gridded = d.events.filter(e => e.metric).length;
  between(gridded, 13, 19, 'outlier: most notes stay claimed (' + gridded + '/20)');
}
// ---- a large gap splits groups; short groups are residue not bars ----
{
  const objs = [];
  for (let n = 0; n < 4; n++) objs.push(note('wc-' + n, n * 0.2));           // 4 notes < MINRUN
  for (let n = 0; n < 8; n++) objs.push(note('wd-' + n, 5 + n * 0.2));      // gap 4.2 s, then 8 notes
  const d = xt(objs, 0.02);
  ok(d.chunks.filter(c => c.strategy === 'simple-bar').length === 1, 'only the >=MINRUN group becomes a bar');
  const prop = d.chunks.find(c => c.strategy === 'proportional');
  ok(prop && prop.events.length === 4, 'the short group is proportional residue');
}

// ---- REAL DATA: coverage cross-check vs D43 (independent tool, same frame) ----
const e20 = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'section1-e20.ir.json'), 'utf8'));
const e30 = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'section1-e30.ir.json'), 'utf8'));
const cov = ir => ir.events.filter(e => e.metric).length / ir.events.length * 100;
const c20 = cov(e20), c30 = cov(e30);
// D43 measured 26.2 % and 57.1 % with the E1 tool; two implementations of
// the same frame should land within a few points of each other.
between(c20, 20, 32, 'eps=20 coverage corroborates D43 (' + c20.toFixed(1) + '% vs 26.2%)');
between(c30, 45, 62, 'eps=30 coverage corroborates D43 (' + c30.toFixed(1) + '% vs 57.1%)');
ok(c30 > c20 + 15, 'the eps dial moves coverage the way D43 says it does');
for (const ir of [e20, e30]) {
  ok(ir.chunks.filter(c => c.tempo).every(c => c.tempo.unitSeconds >= 0.09 - 1e-9), 'every fitted unit is playable (>= 90 ms)');
}

// ---- the whole pipeline holds on the played material ----
const model = Layout.layoutSection(e30, G);
ok(model.warnings.length === 0, 'section-1 e30 lays out clean');
const beams = model.systems.reduce((n, s) => n + s.items.filter(i => i.k === 'beam').length, 0);
ok(beams > 10, 'REAL beams now exist (' + beams + ') — the played fits have beat-adjacent pairs');
const pages = Splice.planPages(e30, RULES, 12);
ok(pages.every(p => p.severed === 0), 'stamp-atomic holds on real beamed material across ' + (pages.length - 1) + ' cuts');

// ---- snapshot ----
function snap(perturb) {
  return {
    c20: +(c20 + (perturb ? 1 : 0)).toFixed(2), c30: +c30.toFixed(2),
    bars20: e20.chunks.filter(c => c.strategy === 'simple-bar').length,
    bars30: e30.chunks.filter(c => c.strategy === 'simple-bar').length,
    beams30: beams, pages30: pages.length,
  };
}
const args = process.argv.slice(2);
const current = snap(args.includes('--prove-red'));
if (args.includes('--update')) { fs.writeFileSync(SNAP, JSON.stringify(current, null, 1)); console.log('snapshot written'); }
else if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot'); }
else if (JSON.stringify(JSON.parse(fs.readFileSync(SNAP, 'utf8'))) !== JSON.stringify(current)) {
  failures++; console.error('FAIL: extract-played snapshot drift — if intentional, --update and review');
}
if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK'); process.exit(0); }
  console.error('PROVE-RED BROKEN'); process.exit(1);
}
if (failures) { console.error(`EXTRACT-PLAYED RED: ${failures} failure(s)`); process.exit(1); }
console.log(`EXTRACT-PLAYED GREEN: coverage ${c20.toFixed(1)}%/${c30.toFixed(1)}% corroborates D43; ${beams} real beams; stamp-atomic holds`);
