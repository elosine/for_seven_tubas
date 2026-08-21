#!/usr/bin/env node
// nh_demo.js — the composer's five nh-unit exercises (day 22), regenerable.
// Forks db1-t1-x01 five times with only the PITCH changed, so every case of
// the notehead-unit shows on the same surge: ledgers below/above, sharp,
// quartertone accidentals, middle line, 8va on a top ledger, 8vb on-staff.
// Demo forks are visual test-benches, NOT piece data — schema-validated
// only (the against-source check would rightly refuse the edited pitches),
// and labeled DEMO in the picker. Prune with notate_section --prune <id>.
//
//   node tools/nh_demo.js

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const SRC = 'db1-t1-x01';

const CASES = [
  { id: 'db1-t1-x02', label: 'DEMO nh: 2 ledgers below · sharp', midi: 37, spelled: { step: 'C', alter: 1, octave: 2 } },
  { id: 'db1-t1-x03', label: 'DEMO nh: 2 ledgers above · 3/4 flat', midi: 62.5, spelled: { step: 'E', alter: -1.5, octave: 4 } },
  { id: 'db1-t1-x04', label: 'DEMO nh: middle line', midi: 50, spelled: { step: 'D', alter: 0, octave: 3 } },
  { id: 'db1-t1-x05', label: 'DEMO nh: 8va · top ledger', midi: 76, spelled: { step: 'E', alter: 0, octave: 5 } },
  { id: 'db1-t1-x06', label: 'DEMO nh: 8vb on staff · 3/4 sharp', midi: 32.5, spelled: { step: 'G', alter: 1.5, octave: 1 } },
];

const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', SRC + '.ir.json'), 'utf8'));
const manifestPath = path.join(ROOT, 'notation', 'ir', 'index.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { irs: [] };
const srcEntry = manifest.irs.find(e => e.id === SRC) || {};

for (const c of CASES) {
  const doc = JSON.parse(JSON.stringify(src));
  doc.id = c.id;
  doc.events[0].pitch = { midi: c.midi, spelled: c.spelled };
  const outRel = 'notation/ir/' + c.id + '.ir.json';
  fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(doc, null, 1));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'ir_validate.js'), outRel], { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    fs.unlinkSync(path.join(ROOT, outRel));
    console.error(c.id + ' VALIDATION FAILED — removed:\n' + String(e.stdout || '') + String(e.stderr || ''));
    process.exit(1);
  }
  manifest.irs = manifest.irs.filter(e => e.id !== c.id);
  manifest.irs.push({ id: c.id, label: c.label, score: srcEntry.score, window: srcEntry.window, profile: srcEntry.profile, exp: true, from: SRC, demo: true });
  console.log('READY ' + c.id + ' — ' + c.label);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
console.log('all five in the picker under experiments (hot-merge ~1 s)');
