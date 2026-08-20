#!/usr/bin/env node
// ir_validate_battery.js — the mutation battery for tools/ir_validate.js,
// committed as a RUNNABLE artifact (Phase A critic finding: "N mutations on
// record" must be fact, not prose). Run after ANY validator or schema edit:
//
//   node tools/ir_validate_battery.js
//
// 29 red cases (each must FAIL with the expected message fragment) + 5 green
// cases (the example and all three hand-worked IR docs must PASS, IR docs in
// --against-source mode). Principle 6: a suite is evidence only once seen
// red — every check here has been. History: 9 cases at A2 draft, 27 after
// the A2 verify rebuild (subsuming the 9), +2 at A4 (spelling checks).
// Exit 0 all good; exit 1 with failures listed.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VALIDATOR = path.join(ROOT, 'tools', 'ir_validate.js');
const EXAMPLE = path.join(ROOT, 'notation', 'schema', 'examples', 'example-min.ir.json');
const MORPH = path.join(ROOT, 'notation', 'ir', 'morph-window-01.ir.json');
const TRANCE = path.join(ROOT, 'notation', 'ir', 'trance-bar-01.ir.json');
const APEX = path.join(ROOT, 'notation', 'ir', 'density-apex-01.ir.json');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ir-battery-'));

const SECTION = path.join(ROOT, 'notation', 'ir', 'trance-section-01.ir.json');
const clone = o => JSON.parse(JSON.stringify(o));
const exampleBase = JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'));
const morphBase = JSON.parse(fs.readFileSync(MORPH, 'utf8'));
const sectionBase = JSON.parse(fs.readFileSync(SECTION, 'utf8'));

function run(file, against, extraFlags) {
  const args = [VALIDATOR, file];
  if (against) args.push('--against-source');
  for (const f of extraFlags || []) args.push(f);
  const r = spawnSync('node', args, { encoding: 'utf8', cwd: ROOT });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// --- red cases: {name, base, against?, expect (message fragment), mutate(d)} ---
const RED = [
  { name: 'bad-enum', expect: 'not in enum', mutate: d => { d.chunks[0].strategy = 'simple-barz'; } },
  { name: 'missing-pitch', expect: 'missing required "pitch"', mutate: d => { delete d.events[0].pitch; } },
  { name: 'dangling-ref', expect: 'does not', mutate: d => { d.chunks[0].events = ['ev-nope']; } },
  { name: 'nondet-ev-id', expect: 'deterministic-id rule', mutate: d => { d.events[0].id = 'ev-xyz'; } },
  { name: 'spell-mismatch', expect: 'spelled', mutate: d => { d.events[1].pitch.spelled.step = 'D'; } },
  { name: 'pixel-key', expect: 'layout-unit key', mutate: d => { d.overlays[0].value = { x: 3 }; } },
  { name: 'orphan-target', expect: 'does not resolve', mutate: d => { d.overlays[0].target.event = 'ev-gone'; } },
  { name: 'span-outside', expect: 'span outside source.window', mutate: d => { d.chunks[1].span = [17.9, 25]; } },
  { name: 'no-contradicts', expect: 'must record what it contradicts', mutate: d => { d.overlays[0].contradicts = null; } },
  { name: 'proto-key', expect: 'unknown property', mutate: d => { d.events[0].toString = 'smuggled'; } },
  { name: 'dup-event-id', expect: 'duplicate node id', mutate: d => { d.events.push(clone(d.events[0])); } },
  {
    name: 'marker-source', against: true, expect: 'not a waveCurve',
    mutate: d => {
      d.events[1].id = 'ev-mk-4834';
      d.events[1].source = { score: 'tranceA002f', objectId: 'mk-4834' };
      d.chunks[1].id = 'ch-5-mk-4834';
      d.chunks[1].events = ['ev-mk-4834'];
      d.overlays[0].target.event = 'ev-mk-4834';
    },
  },
  { name: 'overlay-badspan', expect: 'not in source.parts', mutate: d => { d.overlays[1].target = { part: 8, span: [100, 5] }; } },
  { name: 'ev-override', expect: 'not in enum', mutate: d => { d.events[0].provenance = 'authored-override'; } },
  {
    name: 'cross-score', against: true, expect: 'not found in scores/',
    mutate: d => {
      d.events[1].id = 'ev-zz-1';
      d.events[1].source = { score: 'no-such-score', objectId: 'zz-1' };
      d.chunks[1].id = 'ch-5-zz-1';
      d.chunks[1].events = ['ev-zz-1'];
      d.overlays[0].target.event = 'ev-zz-1';
    },
  },
  { name: 'bad-class', expect: 'not in notation/registry', mutate: d => { d.chunks[0].class = 'definitely-not-a-class'; } },
  {
    name: 'double-member', expect: 'member of both',
    mutate: d => {
      d.chunks.push({ id: 'ch-x', part: 4, span: [1.0, 1.5], class: 'trance-stream', strategy: 'unresolved', events: ['ev-wc-4386'], provenance: 'authored' });
    },
  },
  {
    name: 'part-mismatch', against: true, expect: 'source object layer',
    mutate: d => {
      d.chunks[0].part = 5;
      d.chunks[0].id = 'ch-5-wc-4386';
      d.events[0].metric.chunk = 'ch-5-wc-4386';
    },
  },
  { name: 'device-at', expect: 'outside chunk span', mutate: d => { d.chunks[0].devices[0].at = 999; } },
  {
    name: 'beam-dup', expect: 'duplicate',
    mutate: d => {
      d.chunks[0].groups = [{ id: 'bg-1', kind: 'beam', events: ['ev-wc-4386', 'ev-wc-4386'], provenance: 'derived' }];
    },
  },
  { name: 'stale-orphan', expect: 'stale orphaned flag', mutate: d => { d.overlays[0].orphaned = true; } },
  {
    name: 'strategy-value', expect: 'strategy overlay value',
    mutate: d => { Object.assign(d.overlays[1], { kind: 'strategy', target: { chunk: 'ch-4-wc-4386' }, value: 'flying-buttress' }); },
  },
  { name: 'curve-smuggle', expect: 'curve-data key', mutate: d => { d.overlays[0].value = { nodes: [[0, 0.2]] }; } },
  { name: 'pageX-key', expect: 'layout-unit key', mutate: d => { d.overlays[0].value = { pageX: 120 }; } },
  { name: 'tempo-inconsist', expect: 'tempo inconsistent', mutate: d => { d.chunks[0].tempo.subdivision = 3; } },
  {
    name: 'nondet-ch-id', expect: 'deterministic-id rule',
    mutate: d => { d.chunks[0].id = 'ch-99'; d.events[0].metric.chunk = 'ch-99'; },
  },
  { name: 'docprov-extra', expect: 'unknown property', mutate: d => { d.provenance.secret = 'x'; } },
  // A4 additions, on morph-window-01 (overlays[1] is a spelling overlay there):
  { name: 'respell-repitch', base: 'morph', expect: 'renames, never re-pitches', mutate: d => { d.overlays[1].value = { step: 'B', alter: 0, octave: 2 }; } },
  { name: 'respell-badshape', base: 'morph', expect: 'must be a {step, alter, octave} object', mutate: d => { d.overlays[1].value = 'Bb2'; } },
  // B1 addition: --complete must notice a dropped S1 object (remove one
  // isolated single — event + its chunk — from the extractor's section doc):
  {
    name: 'incomplete-doc', base: 'section', flags: ['--complete'], expect: 'has no event in this document',
    mutate: d => {
      d.events = d.events.filter(e => e.id !== 'ev-wc-5017');
      d.chunks = d.chunks.filter(c => c.id !== 'ch-5-wc-5017');
    },
  },
];

// --- green cases ---
const GREEN = [
  { name: 'green:example (plain)', file: EXAMPLE, against: false },
  { name: 'green:example (vs source)', file: EXAMPLE, against: true },
  { name: 'green:trance-bar-01', file: TRANCE, against: true },
  { name: 'green:morph-window-01', file: MORPH, against: true },
  { name: 'green:density-apex-01', file: APEX, against: true },
  { name: 'green:trance-section-01 (full)', file: SECTION, against: true, flags: ['--complete'] },
];

const BASES = { morph: morphBase, section: sectionBase };
let failures = 0;
for (const c of RED) {
  const d = clone(BASES[c.base] || exampleBase);
  c.mutate(d);
  const f = path.join(TMP, c.name + '.ir.json');
  fs.writeFileSync(f, JSON.stringify(d));
  const r = run(f, c.against, c.flags);
  const ok = r.code === 1 && r.out.includes(c.expect);
  if (!ok) { failures++; console.error(`FAIL red ${c.name}: exit=${r.code}, expected fragment "${c.expect}" — got:\n${r.out.slice(0, 400)}`); }
  else console.log(`ok  red   ${c.name}`);
}
for (const g of GREEN) {
  const r = run(g.file, g.against, g.flags);
  const ok = r.code === 0 && r.out.includes('VALID');
  if (!ok) { failures++; console.error(`FAIL ${g.name}: exit=${r.code}\n${r.out.slice(0, 400)}`); }
  else console.log(`ok  ${g.name}`);
}
fs.rmSync(TMP, { recursive: true, force: true });
if (failures) { console.error(`\nBATTERY RED: ${failures} failure(s) of ${RED.length + GREEN.length}`); process.exit(1); }
console.log(`\nBATTERY GREEN: ${RED.length} red + ${GREEN.length} green cases all behaved (${RED.length + GREEN.length} total)`);
