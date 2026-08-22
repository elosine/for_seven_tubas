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
//        [--exp]
//
// NOTATION-WORKFLOW additions (day 22 — the version-file system, option A1):
//   --from <id> --id <new>   fork an existing IR into a new version file
//                            (experiment saves: db1-T3-x01, x02, ...);
//                            content copied verbatim, re-validated, own
//                            picker entry. Edit the fork's file directly —
//                            the app hot-reloads it within ~1 s.
//   --exp                    group the entry under "experiments" in the picker
//   --bricks                 every chunk unresolved: bricks everywhere + per-note devices (working files)
//   --cluster t0-t1          mark a span as one beamed cluster (repeatable; authored overlays)
//   --clusterTol <s>         metric tolerance for the cluster fit (default 0.030)
//   --prune <id>             remove an IR + its picker entry (git keeps history)
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
const flag = name => process.argv.includes('--' + name);
const manifestPath = path.join(ROOT, 'notation', 'ir', 'index.json');
const readManifest = () => fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { irs: [] };
const writeManifest = m => fs.writeFileSync(manifestPath, JSON.stringify(m, null, 1));

// ---- --prune: remove a version file + its picker entry ----
const pruneId = arg('prune');
if (pruneId) {
  const file = path.join(ROOT, 'notation', 'ir', pruneId + '.ir.json');
  const manifest = readManifest();
  const had = manifest.irs.some(e => e.id === pruneId);
  manifest.irs = manifest.irs.filter(e => e.id !== pruneId);
  writeManifest(manifest);
  const existed = fs.existsSync(file);
  if (existed) fs.unlinkSync(file);
  console.log('PRUNED ' + pruneId + ' — file ' + (existed ? 'removed' : 'absent') +
    ', manifest entry ' + (had ? 'removed' : 'absent') + ' (git history keeps both)');
  process.exit(0);
}

// ---- --from: fork an existing IR into a new version file ----
const fromId = arg('from');
if (fromId) {
  const id = arg('id');
  if (!id) { console.error('--from needs --id <new-version-id>'); process.exit(2); }
  const srcFile = path.join(ROOT, 'notation', 'ir', fromId + '.ir.json');
  const doc = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  doc.id = id;
  const outRel = 'notation/ir/' + id + '.ir.json';
  fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(doc, null, 1));
  // --demo: schema/structure validation only — demo forks deliberately edit
  // musical content (pitches for device exercises) and would rightly fail
  // the against-source cross-check; they are visual test-benches, not piece
  // data, and must say so in their label.
  const vArgs = flag('demo') ? [] : ['--against-source', '--complete'];
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'ir_validate.js'), outRel, ...vArgs],
      { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    fs.unlinkSync(path.join(ROOT, outRel));
    console.error('VALIDATION FAILED — fork removed:\n' + String(e.stdout || '') + String(e.stderr || ''));
    process.exit(1);
  }
  const manifest = readManifest();
  const src = manifest.irs.find(e => e.id === fromId) || {};
  const label = arg('label', id + ' (from ' + fromId + ')');
  manifest.irs = manifest.irs.filter(e => e.id !== id);
  manifest.irs.push({
    id, label, score: src.score || (doc.source && doc.source.score),
    window: src.window || (doc.source && doc.source.window),
    profile: src.profile, exp: flag('exp') || src.exp || undefined, from: fromId,
  });
  writeManifest(manifest);
  console.log('FORKED ' + fromId + ' -> ' + id + ' · VALID · in the picker as "' + label + '"' +
    (flag('exp') || src.exp ? ' [experiments]' : ''));
  console.log('  edit ' + outRel + ' directly — the open notation page picks changes up within ~1 s');
  process.exit(0);
}

// ---- normal extract mode ----
const scoreName = arg('score');
const w0 = parseFloat(arg('w0')), w1 = parseFloat(arg('w1'));
if (!scoreName || isNaN(w0) || isNaN(w1)) {
  console.error('usage: notate_section.js --score <name> --w0 <s> --w1 <s> [--parts 0-9] [--profile trance|section1] [--id slug] [--label text] [--exp]\n' +
    '       notate_section.js --from <id> --id <new> [--label text] [--exp]\n' +
    '       notate_section.js --prune <id>');
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
  toolName: 'tools/notate_section.js (profile ' + profile + ')' + (flag('bricks') ? ' --bricks' : ''),
});
// --bricks (day 23, the composer's working loop — "bricks and the midi sound
// all the way through"): every chunk stays UNRESOLVED, so the page shows the
// parachute bricks everywhere and each note carries its technique's device;
// no bars, no beams. The chunker's grouping is not lost — it is simply not
// applied; a plain re-extract without --bricks brings it back. Working files
// only (the canonical extraction keeps the chunker's strategies).
// --cluster t0-t1 (day 23, the composer's working loop): mark a span as ONE
// beamed cluster. The tool RUNS THE TEMPO FIT (the same exhaustive search as
// tools/cluster_tempo.js), so the drawn rhythm follows the analysis rather
// than a guess: unit, grid positions, how many beams, where the rests go.
// Each member gets an engraving overlay carrying the cluster device; the
// FIRST member additionally gets the GC and the go line — "the GC only on the
// first one, though, so it launches the whole cluster" (composer).
// Repeatable. Written at EXTRACTION so a re-extract keeps it.
{
  const spans = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] !== '--cluster') continue;
    const m = String(process.argv[i + 1] || '').match(/^([\d.]+)-([\d.]+)$/);
    if (!m) { console.error('--cluster needs t0-t1 (e.g. --cluster 31.49-33.59)'); process.exit(2); }
    spans.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  const TOL = parseFloat(arg('clusterTol', '0.030'));
  // ONE implementation of the fit, shared with tools/cluster_tempo.js
  const ClusterFit = require(path.join(ROOT, 'notation', 'lib', 'cluster_fit.js'));
  spans.forEach((sp, n) => {
    const key = 'cl-' + (n + 1);
    const members = doc.events.filter(e => e.onset >= sp[0] - 1e-9 && e.onset <= sp[1] + 1e-9).sort((a, b) => a.onset - b.onset);
    if (!members.length) { console.error('--cluster ' + sp.join('-') + ': no events in the span'); process.exit(2); }
    const fit = ClusterFit.fit(members.map(e => e.onset), { TOL });
    if (!fit) {
      console.error('--cluster ' + sp.join('-') + ': NO metric fit within ' + (TOL * 1000) + ' ms — proportional is the honest reading here');
      process.exit(2);
    }
    console.log('  cluster ' + key + ': ' + members.length + ' notes ' + sp[0] + '-' + sp[1] + ' s (' + members.map(e => e.source.objectId).join(' ') + ')');
    console.log('    fit: unit ' + (fit.unit * 1000).toFixed(1) + ' ms · beat ' + fit.beat.toFixed(3) + ' s = ' + fit.bpm.toFixed(1) + ' bpm x ' + fit.subdivision +
      (fit.tuplet ? ('  [' + fit.tuplet + '-tuplet]') : '  [no tuplet]') +
      ' · max err ' + (fit.maxErr * 1000).toFixed(1) + ' ms · grid ' + fit.grid.join(',') + ' · ' + fit.beams + ' beam(s), 1/' + fit.restDur + ' rests');
    members.forEach((e, k) => {
      const dev = {
        goLine: k === 0, gc: k === 0, ringBar: false, dynMark: false, dynBesideStem: false,
        nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'beam', nhAnchor: 'leftEdge',
        nhDot: true, nhDotGapSs: 0.15,
        beamGroup: key, beamUnit: fit.unit, beamPos: fit.grid[k], beamLevels: fit.beams, beamRestDur: fit.restDur,
      };
      doc.overlays.push({ id: 'ov-' + key + '-' + e.id, kind: 'engraving', target: { event: e.id }, value: { device: dev }, provenance: 'authored' });
    });
  });
}
if (flag('bricks')) {
  // devices go too (day 23 bug): the chunker's cloud-landing GC is a
  // GROUPING artifact — left behind, animobj still made a ball for it
  // while layout drew nothing (the unresolved branch has no tick), so a
  // ball fell on wc-49 out of nowhere. A ball without an arc is a bug.
  for (const c of doc.chunks) { c.strategy = 'unresolved'; delete c.tempo; delete c.groups; delete c.devices; }
  for (const e of doc.events) delete e.metric;
  doc.provenance.notes += ' BRICKS MODE: all chunks forced unresolved (working file).';
}
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
const manifest = readManifest();
manifest.irs = manifest.irs.filter(e => e.id !== id);
manifest.irs.push({ id, label, score: scoreName, window: [w0, w1], profile, exp: flag('exp') || undefined });
writeManifest(manifest);

const byStrategy = {};
for (const c of doc.chunks) byStrategy[c.strategy] = (byStrategy[c.strategy] || 0) + 1;
console.log('READY: ' + id + ' — ' + doc.events.length + ' events, ' + doc.chunks.length + ' chunks ' +
  JSON.stringify(byStrategy) + ' · VALID vs source · in the picker as "' + label + '"' +
  (flag('exp') ? ' [experiments]' : ''));
for (const w of warnings) console.warn('  warn: ' + w);
