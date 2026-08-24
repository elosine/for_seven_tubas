#!/usr/bin/env node
// notate_block.js — THE BLOCK / LONG-TONE GENERATOR (day 35).
//
//   node tools/notate_block.js --score piece-s25-finished01 --group grp-octbb-ord-01
//   node tools/notate_block.js --score <save> --group <id> --apply
//   node tools/notate_block.js --score <save> --list          (find the blocks)
//
// WHY THIS EXISTS. Notating a block — a struck-or-held sonority, one uniform
// drawn brick, one instant, every part — took seven hand steps on day 35 and
// hit four traps on the way. The material recurs (VERT01-03 @40.93 day 30,
// octaves-Bb @48.05 day 35, and the composer next long tones at 81-110 s), and
// the hand process is the same every time: find the group, derive the brick,
// find how the analogous approved thing was notated, check the mechanism
// reaches this material, rebuild, prove. This collapses the mechanical part of
// that into one command and turns each of the four traps into a refusal.
//
// WHAT IT DOES NOT DO, on purpose. It does not decide what the material should
// LOOK like, and it does not decide where to fix a gap when the mechanism does
// not reach (flag vs registry vs material — D72 was a judgement call with a
// rejected alternative on the record). Those two steps stayed human in the
// day-35 evaluation and stay human here. The machine is the
// fetch-derive-emit-prove spine.
//
// THE FOUR TRAPS, AS REFUSALS:
//   T1 (the wrong probe)      — proof comes from layout.js itself via
//                               prove_unmoved, never from guessed SVG attributes.
//   T2 (field-name guessing)  — one place knows that score objects use
//                               startSeconds/endSeconds, markers use time and IR
//                               events use onset/duration: readBlock(), below.
//   T3 (a success line that    — the device-gap assert runs on the rebuilt IR and
//       described an effect      refuses if any device field asks for something
//       it never verified)       the resolved device never draws (D72).
//   T4 (fork vs direct)       — decided explicitly from the target IR own
//                               window, and REFUSED rather than guessed when the
//                               block falls outside it.
//
// SAFETY: --apply snapshots the IR bytes first. If the proof is not clean or
// the device-gap assert fires, the original file is written back and the tool
// exits non-zero. A rebuild that cannot prove itself does not survive.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const DeviceCheck = require(path.join(ROOT, 'notation', 'lib', 'device_check.js'));
const Prove = require(path.join(ROOT, 'notation', 'lib', 'prove_unmoved.js'));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}
const flag = name => process.argv.includes('--' + name);
const die = msg => { console.error('\n' + msg + '\n'); process.exit(2); };

// --- the app own layout composition (notation.html line ~228). Anything that
// lays a page out for proof must compose it the same way, or it is measuring a
// page nobody sees.
const GLYPHS = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const CONTAINER = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));
const LAYOUT_OPTS = Object.assign(
  { m4AttackLines: false, frameParts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  (CONTAINER.engraving && CONTAINER.engraving.layout) || {});
const layoutOf = ir => Layout.layoutSection(JSON.parse(JSON.stringify(ir)), GLYPHS, LAYOUT_OPTS);

// ---------------------------------------------------------------------------
// T2 answer: ONE place that knows the field names of all three schemas.
// score objects: startSeconds / endSeconds / layer / technique / sonifyNote / recVel
// score markers: time / label
// IR events:     onset / duration / technique / source.objectId
// ---------------------------------------------------------------------------
function readBlock(score, groupId) {
  const members = (score.objects || []).filter(o => o.groupId === groupId);
  if (!members.length) die('No group "' + groupId + '" in this score.\n' +
    'Run with --list to see the groups it does have.');
  const marker = members.find(o => o.type === 'marker') || null;
  // A block HANDLE is the group drag/stretch bar: a waveCurve with no
  // technique and no pitch. It is not a note and must never be counted as one.
  const curves = members.filter(o => o.type === 'waveCurve');
  const notes = curves.filter(o => o.technique && o.sonifyNote != null);
  const handles = curves.filter(o => !(o.technique && o.sonifyNote != null));
  return { groupId, marker, notes, handles, members };
}

function describeBlock(b) {
  const L = [];
  const t0s = b.notes.map(n => n.startSeconds);
  const bricks = b.notes.map(n => +(n.endSeconds - n.startSeconds).toFixed(4));
  const techs = {}; b.notes.forEach(n => { techs[n.technique] = (techs[n.technique] || 0) + 1; });
  const parts = b.notes.map(n => n.layer).sort((a, c) => a - c);
  const vels = new Set(b.notes.map(n => n.recVel));
  L.push('  group   ' + b.groupId + (b.marker ? '   marker "' + b.marker.label + '" @ ' + b.marker.time + ' s' : '   (no marker)'));
  L.push('  notes   ' + b.notes.length + ' on parts T' + parts.map(p => p + 1).join(' T') +
    (b.handles.length ? '   (+' + b.handles.length + ' handle)' : ''));
  L.push('  onset   ' + (new Set(t0s).size === 1 ? t0s[0] + ' s (all together)' :
    Math.min(...t0s) + '-' + Math.max(...t0s) + ' s  [NOT simultaneous]'));
  L.push('  brick   ' + (new Set(bricks).size === 1 ? bricks[0] + ' s (uniform)' :
    Math.min(...bricks) + '-' + Math.max(...bricks) + ' s  [NOT uniform]'));
  L.push('  tech    ' + Object.keys(techs).map(t => t + ' x' + techs[t]).join(', '));
  L.push('  vel     ' + [...vels].join(', '));
  L.push('  pitches ' + b.notes.map(n => n.sonifyNote).join(' '));
  return L.join('\n');
}

// ---------------------------------------------------------------------------
// The build command a version file stores is argv joined, with any argument
// containing whitespace or a quote written as JSON. Parse it back the same way.
// ---------------------------------------------------------------------------
function tokenizeBuild(cmd) {
  const out = [];
  let i = 0;
  while (i < cmd.length) {
    while (i < cmd.length && /\s/.test(cmd[i])) i++;
    if (i >= cmd.length) break;
    if (cmd[i] === '"') {
      let j = i + 1, buf = '';
      while (j < cmd.length) {
        if (cmd[j] === '\\') { buf += cmd[j + 1]; j += 2; continue; }
        if (cmd[j] === '"') { j++; break; }
        buf += cmd[j++];
      }
      out.push(buf); i = j;
    } else {
      let j = i;
      while (j < cmd.length && !/\s/.test(cmd[j])) j++;
      out.push(cmd.slice(i, j)); i = j;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// T4 answer: fork vs direct, decided from the target IR own window rather than
// from a habit. The 41 s precedent is already inside db1 build command, which
// is why the 48.05 long tone was a db1 flag and not a fork.
// ---------------------------------------------------------------------------
function windowOf(ir, argvOfBuild) {
  const w0i = argvOfBuild.indexOf('--w0'), w1i = argvOfBuild.indexOf('--w1');
  const src = ir.source || {};
  const w0 = w0i >= 0 ? parseFloat(argvOfBuild[w0i + 1]) : (src.w0 != null ? src.w0 : null);
  const w1 = w1i >= 0 ? parseFloat(argvOfBuild[w1i + 1]) : (src.w1 != null ? src.w1 : null);
  return { w0, w1 };
}

// The span --ringFromBrick takes. The two hand-built precedents used the tenth
// of a second containing the onset (40.934 -> 40.9-41.0; 48.05 -> 48.0-48.1),
// so that is the natural form — but it is then CHECKED against the IR own
// events and tightened if it would sweep in a neighbour. A span that selects
// the wrong notes is exactly the class of silent error this tool exists to end.
// Written with at least one decimal, so the tenth-of-a-second form comes out
// as the composer already has it on the page: 40.9-41.0 and 48.0-48.1, not
// 40.9-41 and 48-48.1. The flag parses either, but a build command is read by
// people — and an IR whose provenance.build no longer matches the command in
// the journal costs someone an afternoon proving they are the same thing.
function fmtT(x) {
  const s = String(+(+x).toFixed(4));
  return s.indexOf('.') < 0 ? s + '.0' : s;
}
function spanFor(onsets, ir, groupObjectIds) {
  const lo = Math.min(...onsets), hi = Math.max(...onsets);
  const natural = [Math.floor(lo * 10) / 10, +(Math.floor(lo * 10) / 10 + 0.1).toFixed(4)];
  const wanted = new Set(groupObjectIds);
  const RING = new Set(['fortepiano', 'cuivre', 'ord']);
  const selects = sp => (ir.events || [])
    .filter(e => e.onset >= sp[0] - 1e-9 && e.onset <= sp[1] + 1e-9 && RING.has(e.technique))
    .map(e => e.source && e.source.objectId);
  const ok = sp => {
    const got = selects(sp);
    return got.length === wanted.size && got.every(id => wanted.has(id));
  };
  if (ok(natural)) return { span: natural, tightened: false };
  const tight = [+(lo - 0.005).toFixed(4), +(hi + 0.005).toFixed(4)];
  if (ok(tight)) return { span: tight, tightened: true };
  return { span: natural, tightened: false, bad: selects(natural) };
}

// ===========================================================================
const scoreName = arg('score');
if (!scoreName) die('--score <save name> is required (e.g. --score piece-s25-finished01).');
const scorePath = path.join(ROOT, 'scores', scoreName + '.json');
if (!fs.existsSync(scorePath)) die('No score file at ' + path.relative(ROOT, scorePath));
const score = JSON.parse(fs.readFileSync(scorePath, 'utf8'));

// ---- --list: find the block-shaped groups (step 1 of the seven, mechanised)
if (flag('list')) {
  const seen = new Set();
  const rows = [];
  for (const o of score.objects || []) {
    if (!o.groupId || seen.has(o.groupId)) continue;
    seen.add(o.groupId);
    const b = readBlock(score, o.groupId);
    if (!b.notes.length) continue;
    const bset = new Set(b.notes.map(n => +(n.endSeconds - n.startSeconds).toFixed(4)));
    const oset = new Set(b.notes.map(n => n.startSeconds));
    rows.push({
      gid: o.groupId,
      t: b.marker ? b.marker.time : Math.min(...b.notes.map(n => n.startSeconds)),
      label: b.marker ? b.marker.label : '',
      n: b.notes.length,
      brick: bset.size === 1 ? [...bset][0] : null,
      uniformOnset: oset.size === 1,
      techs: [...new Set(b.notes.map(n => n.technique))]
    });
  }
  rows.sort((a, b) => a.t - b.t);
  console.log('\nGROUPS in ' + scoreName + '   (BLOCK = one instant, one uniform brick)\n');
  for (const r of rows) {
    const isBlock = r.brick != null && r.uniformOnset;
    console.log('  ' + (isBlock ? 'BLOCK ' : '      ') + String(r.t).padStart(9) + ' s  ' +
      r.gid.padEnd(22) + String(r.n).padStart(3) + ' notes  ' +
      (r.brick != null ? (r.brick + ' s').padStart(9) : '   mixed ') + '  ' +
      r.techs.join('+').padEnd(18) + ' ' + r.label);
  }
  const n = rows.filter(r => r.brick != null && r.uniformOnset).length;
  console.log('\n  ' + n + ' of ' + rows.length + ' groups are block-shaped (this tool handles those).\n');
  process.exit(0);
}

const groupId = arg('group');
if (!groupId) die('--group <id> is required (or --list to see what the score has).');
const irId = arg('ir', 'db1');
const APPLY = flag('apply');

const block = readBlock(score, groupId);
console.log('\nBLOCK  ' + groupId + '   in ' + scoreName);
console.log(describeBlock(block));

// ---- REFUSALS on the material itself --------------------------------------
if (!block.notes.length) die('That group has no notes (only a marker/handle).');
const bricks = [...new Set(block.notes.map(n => +(n.endSeconds - n.startSeconds).toFixed(4)))];
if (bricks.length !== 1)
  die('REFUSED: the brick is NOT UNIFORM across the block (' + bricks.join(', ') + ' s).\n' +
    'This tool writes ONE written length for the whole block, from ONE drawn brick — the\n' +
    'instruction for the 41 s block was "make sure they are all the same length, take the\n' +
    'length from the brick". With bricks that differ, WHICH one is the block length is a\n' +
    'composer question, not a derivation. Normalise them first:\n' +
    '  node tools/set_brick.js --score ' + scoreName + ' --group ' + groupId + ' --brick 0.05 --apply');
const brick = bricks[0];
const onsets = [...new Set(block.notes.map(n => n.startSeconds))];
if (onsets.length !== 1)
  console.log('  NOTE: the notes are not struck together (' + onsets.length +
    ' distinct onsets) — the ring span will cover them all.');
const RING_TECHS = new Set(['fortepiano', 'cuivre', 'ord']);
const nonRing = block.notes.filter(n => !RING_TECHS.has(n.technique));
if (nonRing.length)
  die('REFUSED: ' + nonRing.length + ' note(s) carry a technique with no ring bar (' +
    [...new Set(nonRing.map(n => n.technique))].join(', ') + ').\n' +
    '--ringFromBrick only reaches ' + [...RING_TECHS].join('/') + ', so those notes would be\n' +
    'silently skipped — the exact shape of the day-35 T3 trap. Decide what those parts\n' +
    'should draw before running this.');

// ---- the target IR --------------------------------------------------------
const irPath = path.join(ROOT, 'notation', 'ir', irId + '.ir.json');
if (!fs.existsSync(irPath)) die('No IR at ' + path.relative(ROOT, irPath) + ' (--ir <id>).');
const irBytes = fs.readFileSync(irPath, 'utf8');
const ir = JSON.parse(irBytes);
const buildCmd = (ir.provenance && ir.provenance.build) || '';
if (!buildCmd) die('IR ' + irId + ' has no provenance.build — it cannot rebuild itself, so this\n' +
  'tool cannot add to it. (Every IR made by notate_section since day 25 stores its command.)');
const buildArgv = tokenizeBuild(buildCmd).slice(2);   // drop "node tools/notate_section.js"
const win = windowOf(ir, buildArgv);
if ((ir.source || {}).score !== scoreName)
  die('IR ' + irId + ' was extracted from "' + (ir.source || {}).score + '", not "' + scoreName + '".\n' +
    'Notating this block into it would mix two scores. Name the matching --score.');

const t = block.marker ? block.marker.time : Math.min(...onsets);
console.log('\nTARGET  ' + irId + '   window ' + win.w0 + '-' + win.w1 + ' s');

// ---- T4: FORK OR DIRECT, decided rather than assumed -----------------------
const inWindow = win.w0 != null && win.w1 != null &&
  t >= win.w0 - 1e-9 && Math.max(...onsets) <= win.w1 + 1e-9;
if (!inWindow) {
  const end = Math.ceil(Math.max(...onsets) + brick + 1);
  console.error('\nREFUSED — THE BLOCK IS OUTSIDE THE WINDOW OF ' + irId + '.');
  console.error('  block at ' + t + ' s;  ' + irId + ' covers ' + win.w0 + '-' + win.w1 + ' s.');
  console.error('\n  This is a SECTION decision, not a block one, so it is not the machine to make.');
  console.error('  A fork inherits the same window, so forking does not reach it either. Two options:');
  console.error('\n  (a) EXTEND THE WINDOW of ' + irId + ' — one page for the whole piece so far.');
  console.error('      Edit --w1 ' + win.w1 + ' -> ' + end + ' in its provenance.build, rerun that command,');
  console.error('      then re-run this one.');
  console.error('\n  (b) A NEW IR for the new section — the way db1 itself was made:');
  console.error('        node tools/notate_section.js --score ' + scoreName +
    ' --w0 ' + Math.floor(t) + ' --w1 ' + end +
    ' --parts 0-9 --profile section1 --id <new-id> --bricks --label "<section name>"');
  console.error('        node tools/notate_block.js --score ' + scoreName + ' --group ' + groupId +
    ' --ir <new-id> --apply');
  console.error('');
  process.exit(3);
}
console.log('  FORK-VS-DIRECT: the block is INSIDE the window -> DIRECT (append the flag to the');
console.log('  own build command of ' + irId + ' and rebuild under --id ' + irId + ').');
console.log('  Precedent: db1 already carries --ringFromBrick for the 41 s block. A fork here');
console.log('  would be a needless page; an unguarded hand edit would be worse. Day-35 T4.');

// ---- the flags ------------------------------------------------------------
const objIds = block.notes.map(n => n.id);
const sp = spanFor(onsets, ir, objIds);
if (sp.bad)
  die('REFUSED: no ring span selects exactly this block.\n' +
    '  wanted ' + objIds.length + ' notes (' + objIds.slice(0, 4).join(', ') + (objIds.length > 4 ? ', ...' : '') + ')\n' +
    '  a span around ' + t + ' s selects ' + sp.bad.length + ' (' + sp.bad.slice(0, 6).join(', ') + ')\n' +
    'Another ringing gesture sits within the same tenth of a second. Widening or narrowing\n' +
    'the span would notate the wrong notes, so this one needs a hand.');
const spanArg = fmtT(sp.span[0]) + '-' + fmtT(sp.span[1]);
const newFlags = ['--ringFromBrick', spanArg];
console.log('\nFLAGS   ' + newFlags.join(' ') + (sp.tightened ? '   (tightened to clear a neighbour)' : ''));
console.log('        -> device.ringSeconds ' + brick + ' s + device.ringBar on ' +
  block.notes.length + ' events (D72: the flag turns the device on, not only sizes it).');

// Compared by VALUE, not by string: "48.0-48.1" and "48-48.1" are the same
// span, and a formatting difference must not make the tool rebuild a page that
// is already correct.
const already = buildArgv.some((a, i) => {
  if (a !== '--ringFromBrick') return false;
  const m = String(buildArgv[i + 1] || '').match(/^([\d.]+)-([\d.]+)$/);
  return !!m && Math.abs(parseFloat(m[1]) - sp.span[0]) < 1e-9 && Math.abs(parseFloat(m[2]) - sp.span[1]) < 1e-9;
});
if (already) {
  console.log('\nALREADY DONE — the build command of ' + irId + ' already carries ' +
    newFlags.join(' ') + '.\nThis block is notated. Nothing to do.\n');
  process.exit(0);
}

if (!APPLY) {
  console.log('\nDRY RUN. To build it:');
  console.log('  node tools/notate_block.js --score ' + scoreName + ' --group ' + groupId +
    (irId !== 'db1' ? ' --ir ' + irId : '') + ' --apply\n');
  process.exit(0);
}

// ---- BUILD, then PROVE. The snapshot is the safety net --------------------
console.log('\nBUILDING ' + irId + ' from its own provenance.build + the new flag ...');
const beforeModel = layoutOf(ir);
const nextArgv = buildArgv.concat(newFlags);
try {
  const out = execFileSync(process.execPath,
    [path.join(ROOT, 'tools', 'notate_section.js')].concat(nextArgv),
    { cwd: ROOT, encoding: 'utf8' });
  out.split('\n').filter(l => /ringFromBrick|events|chunks|VALID|INVALID|clusters/i.test(l))
    .forEach(l => console.log('  | ' + l.trim()));
} catch (e) {
  fs.writeFileSync(irPath, irBytes);
  die('The rebuild FAILED — ' + irId + ' restored from the snapshot, nothing changed.\n' +
    (e.stdout || '') + (e.stderr || ''));
}

const after = JSON.parse(fs.readFileSync(irPath, 'utf8'));
const afterModel = layoutOf(after);

// T3 refusal: does every device field actually draw?
console.log('\nDEVICE-GAP ASSERT (D72)');
const dcT = DeviceCheck.tableFromLayoutFile(fs, path.join(ROOT, 'notation', 'lib', 'layout.js'));
console.log('  table ' + dcT.source);
const resolve = Layout.deviceResolver(after, LAYOUT_OPTS);
const gaps = DeviceCheck.findGaps(after, resolve, dcT.table);
console.log(DeviceCheck.formatGaps(gaps));

// T1 answer: the proof comes from layout, not from the DOM
//
// THE CLAIM IS CONFINEMENT, NOT STILLNESS — and the golden is what taught us
// the difference. On ord (48.05) this flag ADDS ten ring bars, because ord
// carries no ringBar in the registry and there was nothing there. On
// fortepiano/cuivre (40.93) it CHANGES ten, because those techniques already
// draw a bar and the flag only re-sizes it from the sample length to the drawn
// brick. "ADDED 10 / REMOVED 0 / CHANGED 0" — the shape the proof took when it
// was hand-rolled on day 35 — is therefore true of the long tone and FALSE of
// the blast, though the instruction and the material class are the same. So
// what is asserted here is: every item that moved belongs to this block, and
// nothing else on the page moved at all.
const blockEventIds = new Set((after.events || [])
  .filter(e => e.source && objIds.indexOf(e.source.objectId) >= 0).map(e => e.id));
console.log('\nPROOF — the whole page, before vs after');
const d = Prove.diff(beforeModel, afterModel);
console.log(Prove.summarise(d));
const outside = Prove.confine(d, blockEventIds);
console.log(Prove.summariseConfined(d, outside));

// and the thing actually asked for: each note now carries ONE bar, one brick long
const bars = [];
for (const s of afterModel.systems) for (const it of s.items)
  if (it.k === 'ringbar' && blockEventIds.has(it.ev)) bars.push(it);
const lens = [...new Set(bars.map(b => +(b.t1 - b.t0).toFixed(4)))];
console.log('    the ask: ' + bars.length + '/' + block.notes.length + ' notes carry a ring bar, length ' +
  lens.map(x => x + ' s').join(', ') + (lens.length === 1 && Math.abs(lens[0] - brick) < 1e-6
    ? '   <- the drawn brick, uniform' : '   <- DOES NOT MATCH THE BRICK ' + brick + ' s'));

const barsRight = bars.length === block.notes.length && lens.length === 1 && Math.abs(lens[0] - brick) < 1e-6;
if (outside.total || d.removed.length || gaps.gaps.length || !barsRight) {
  fs.writeFileSync(irPath, irBytes);
  console.error('\nREFUSED — ' + (gaps.gaps.length ? 'a device field asks for something that is never drawn'
    : outside.total ? 'the rebuild moved ink OUTSIDE this block'
      : d.removed.length ? 'the rebuild REMOVED something'
        : 'the ring bars did not come out as the drawn brick') + '.');
  console.error(irId + ' has been RESTORED from the snapshot; nothing changed on disk.\n');
  process.exit(4);
}

const addedN = d.added.length, changedN = d.changed.length;
console.log('\nDONE. ' + block.notes.length + ' ring bars of ' + brick + ' s on ' + irId +
  ' (' + addedN + ' added, ' + changedN + ' resized); nothing else on the page moved.');
console.log('Look at it: node score/server.js -> http://localhost:5200/notation/app/notation.html');
console.log('            pick ' + irId + ', window ' + Math.max(0, t - 0.3).toFixed(1) +
  ' +' + (brick + 1).toFixed(1) + ' s\n');
