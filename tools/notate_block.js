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
// DAY 35, FIFTH SITTING — A BLOCK MAY BE MIXED, AND STACCATO DRAWS ITSELF.
// The composer dictated eleven blast columns at 81-110 s. Most are staccato,
// some mix staccato with cuivre, three are staccato throughout. The original
// build REFUSED any technique without a ring bar ("decide what those parts
// should draw before running this"), which was right as a T3 guard and wrong
// as a permanent answer: the registry HAD already decided. byTechnique.staccato
// is the small filled head + 16th flag + dot and NO duration ink — the settled
// day-23 standard and the approved CLOUD02 look. Measured on the real material
// (94.942 T1): brick, goline, gc, notehead(0.844), stem, flag-down16, dot,
// accidental, dyn — and no ringbar, which is the point.
//
// So a block's notes are PARTITIONED, not required to be one technique:
//   RING members (fortepiano/cuivre/ord) take --ringFromBrick, one written
//     length from the drawn brick;
//   SELF-DRAWING members (staccato) are left alone, because the registry
//     already draws them completely;
//   anything else still REFUSES — the T3 trap stays shut for the unknown.
// A block with no ring members has nothing to write, so the tool VERIFIES
// instead of building: it proves on the laid-out page that every member draws
// its head and that none of them carries a bar, and writes nothing.
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

// WHAT A NOTE ACTUALLY DRAWS, read off the laid-out page rather than assumed —
// the T1 discipline applied to the ask itself. Bars, bricks and stems carry an
// `ev`; the NOTEHEAD DOES NOT (the nh-unit emits the glyph without one), so a
// head is matched by part and onset instead. Part comes from the score object's
// own layer, never from the item, because layout items do not carry a part —
// the system does, and a block is simultaneous, so onset alone would count
// every other tuba's head as well.
function pageFacts(model, irDoc, notes) {
  const byObj = new Map((irDoc.events || []).filter(e => e.source).map(e => [e.source.objectId, e]));
  const recs = notes.map(n => {
    const e = byObj.get(n.id);
    return {
      obj: n.id, part: n.layer, tech: n.technique, ev: e ? e.id : null,
      onset: e ? e.onset : n.startSeconds, heads: 0, bars: [], brick: false, missing: !e
    };
  });
  const byEv = new Map(recs.filter(r => r.ev).map(r => [r.ev, r]));
  for (const s of model.systems) for (const it of s.items) {
    const r = it.ev ? byEv.get(it.ev) : null;
    if (r) {
      if (it.k === 'ringbar') r.bars.push(+(it.t1 - it.t0).toFixed(4));
      if (it.k === 'brick') r.brick = true;
    }
    if (it.k === 'glyph' && /^notehead/.test(it.g || ''))
      for (const rr of recs) if (rr.part === s.part && Math.abs(it.t - rr.onset) < 1e-6) rr.heads++;
  }
  return recs;
}

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
//
// The wanted set is the block's RING members only, never all of its notes: a
// mixed column (9 staccato + 1 cuivre at 84.6) is selected correctly by a span
// that picks up exactly its one cuivre note, because that is all the flag can
// reach. Demanding the span select every note would refuse every mixed column.
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
// A BLOCK IS ONE INSTANT — and until day 35 that half of the definition was
// never asserted. The all-staccato refusal happened to cover the case: the
// 159-note CLOUD02-I cloud has a perfectly uniform 0.05 s brick and 153 distinct
// onsets over 4.1 s, and it was turned away for its technique, not for being a
// cloud. Widening the technique rule uncovered it. The threshold is taken from
// the MATERIAL rather than picked: if the attacks are spread wider than the
// notes are long, they cannot be heard as one struck sonority.
const spread = +(Math.max(...onsets) - Math.min(...onsets)).toFixed(4);
if (spread > brick + 1e-9)
  die('REFUSED: this is not a block — the attacks are spread over ' + spread + ' s (' +
    onsets.length + ' distinct onsets) but each note is only ' + brick + ' s long.\n' +
    'Notes further apart than they are long are a GESTURE, not a struck chord, and a\n' +
    'gesture is notated by the figure process, not by one written length:\n' +
    '  node tools/pattern_analyze.js --ir ' + irId + ' --part <0-9> --span ' +
    Math.min(...onsets).toFixed(2) + '-' + (Math.max(...onsets) + brick).toFixed(2) + '\n' +
    'Run --list: a group is marked BLOCK only when it is one instant AND one brick.');
if (onsets.length !== 1)
  console.log('  NOTE: struck within ' + spread + ' s rather than exactly together (' +
    onsets.length + ' onsets, inside the ' + brick + ' s brick) — the ring span covers them all.');
// ---- THE PARTITION (day 35, fifth sitting) --------------------------------
// RING members take a written bar from the brick. SELF-DRAWING members are
// complete without one — the registry draws staccato's dotted 16th and gives it
// no duration ink on purpose (the day-23 standard). Anything else is unknown,
// and an unknown technique is exactly what T3 exists to stop: --ringFromBrick
// would skip it in silence and the success line would still say "done".
const RING_TECHS = new Set(['fortepiano', 'cuivre', 'ord']);
const SELF_DRAWING = new Set(['staccato']);
const ringNotes = block.notes.filter(n => RING_TECHS.has(n.technique));
const selfNotes = block.notes.filter(n => SELF_DRAWING.has(n.technique));
const unknown = block.notes.filter(n => !RING_TECHS.has(n.technique) && !SELF_DRAWING.has(n.technique));
if (unknown.length)
  die('REFUSED: ' + unknown.length + ' note(s) carry a technique this tool has no rule for (' +
    [...new Set(unknown.map(n => n.technique))].join(', ') + ').\n' +
    '--ringFromBrick reaches ' + [...RING_TECHS].join('/') + ' and nothing else, and ' +
    [...SELF_DRAWING].join('/') + ' is\n' +
    'the only technique known to draw itself completely from the registry. Anything outside\n' +
    'those two lists would be silently skipped — the day-35 T3 trap. Decide what those parts\n' +
    'should draw, and add the technique to one of the two lists in this file.');
console.log('  split   ' + ringNotes.length + ' ring (' +
  ([...new Set(ringNotes.map(n => n.technique))].join('/') || '-') + ') + ' +
  selfNotes.length + ' self-drawing (' +
  ([...new Set(selfNotes.map(n => n.technique))].join('/') || '-') + ')');

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

// ---- NOTHING TO WRITE: verify the page instead of building it -------------
// A block of nothing but self-drawing notes is already correct on the page —
// there is no flag to add. Saying "done" without looking would be the T3 trap
// wearing the other hat, so this looks: it lays the page out and reads back,
// per member, that a head is drawn and that no bar is.
const objIds = block.notes.map(n => n.id);
if (!ringNotes.length) {
  console.log('\nNOTHING TO WRITE — every note in this block draws itself.');
  console.log('  ' + [...new Set(selfNotes.map(n => n.technique))].join('/') +
    ' carries no duration ink by the settled standard (the small filled head, the 16th');
  console.log('  flag and the dot ARE the notation), so --ringFromBrick has nothing to reach.');
  console.log('  This run therefore VERIFIES the page as it stands and writes nothing.');
  const facts = pageFacts(layoutOf(ir), ir, block.notes);
  const missing = facts.filter(f => f.missing);
  if (missing.length)
    die('REFUSED: ' + missing.length + ' of this block\'s notes are not in ' + irId + ' at all (' +
      missing.slice(0, 4).map(f => f.obj).join(', ') + ').\n' +
      'A page cannot draw material it never extracted — check the window and --parts.');
  console.log('\nVERIFY — read off the laid-out page (T1), not assumed');
  facts.forEach(f => console.log('    T' + String(f.part + 1).padEnd(3) + f.tech.padEnd(11) +
    ' heads ' + f.heads + '   bars ' + f.bars.length +
    (f.brick ? '   parachute brick (un-figured)' : '   figured')));
  const noHead = facts.filter(f => f.heads === 0), withBar = facts.filter(f => f.bars.length);
  console.log('    ' + (facts.length - noHead.length) + '/' + facts.length +
    ' notes draw a notehead; ' + withBar.length + ' carry a ring bar (expected 0)');
  if (noHead.length || withBar.length) {
    console.error('\nREFUSED — ' + (noHead.length
      ? noHead.length + ' note(s) draw no notehead at all'
      : withBar.length + ' note(s) carry a ring bar they should not') +
      '.\nNothing was written; the page is as it was.\n');
    process.exit(5);
  }
  console.log('\nVERIFIED. ' + irId + ' already draws this block correctly; nothing written,');
  console.log('and nothing needed writing. Brick ' + brick + ' s is the score\'s truth for');
  console.log('playability and for sound — it was never ink on this page (D51).\n');
  process.exit(0);
}

// ---- the flags ------------------------------------------------------------
const ringObjIds = ringNotes.map(n => n.id);
const sp = spanFor([...new Set(ringNotes.map(n => n.startSeconds))], ir, ringObjIds);
if (sp.bad)
  die('REFUSED: no ring span selects exactly this block\'s ringing notes.\n' +
    '  wanted ' + ringObjIds.length + ' notes (' + ringObjIds.slice(0, 4).join(', ') + (ringObjIds.length > 4 ? ', ...' : '') + ')\n' +
    '  a span around ' + t + ' s selects ' + sp.bad.length + ' (' + sp.bad.slice(0, 6).join(', ') + ')\n' +
    'Another ringing gesture sits within the same tenth of a second. Widening or narrowing\n' +
    'the span would notate the wrong notes, so this one needs a hand.');
const spanArg = fmtT(sp.span[0]) + '-' + fmtT(sp.span[1]);
const newFlags = ['--ringFromBrick', spanArg];
console.log('\nFLAGS   ' + newFlags.join(' ') + (sp.tightened ? '   (tightened to clear a neighbour)' : ''));
console.log('        -> device.ringSeconds ' + brick + ' s + device.ringBar on ' +
  ringNotes.length + ' ring event(s) (D72: the flag turns the device on, not only sizes it).');
if (selfNotes.length)
  console.log('        -> the ' + selfNotes.length + ' ' + [...new Set(selfNotes.map(n => n.technique))].join('/') +
    ' note(s) are untouched: notate_section filters the span to ' + [...RING_TECHS].join('/') +
    ',\n           and the registry already draws them whole.');

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

// AND THE THING ACTUALLY ASKED FOR, measured on both halves of the block. The
// claim is no longer one sentence about "the notes" but one about each kind:
// the ring members carry ONE bar of exactly the drawn brick, and the
// self-drawing members carry a head and NO bar. A single combined count would
// pass a mixed column in which the staccato notes had quietly grown bars.
const factsAfter = pageFacts(afterModel, after, block.notes);
const ringFacts = factsAfter.filter(f => RING_TECHS.has(f.tech));
const selfFacts = factsAfter.filter(f => SELF_DRAWING.has(f.tech));
const lens = [...new Set(ringFacts.flatMap(f => f.bars))];
const withOneBar = ringFacts.filter(f => f.bars.length === 1).length;
console.log('    the ask, ring: ' + withOneBar + '/' + ringFacts.length +
  ' notes carry one ring bar, length ' + (lens.map(x => x + ' s').join(', ') || '-') +
  (lens.length === 1 && Math.abs(lens[0] - brick) < 1e-6
    ? '   <- the drawn brick, uniform' : '   <- DOES NOT MATCH THE BRICK ' + brick + ' s'));
const ringRight = ringFacts.length > 0 && withOneBar === ringFacts.length &&
  lens.length === 1 && Math.abs(lens[0] - brick) < 1e-6;

let selfRight = true;
if (selfFacts.length) {
  const headed = selfFacts.filter(f => f.heads > 0).length;
  const barred = selfFacts.filter(f => f.bars.length).length;
  // the flag has no business touching them at all, so say so from the diff too
  const selfEv = new Set(selfFacts.map(f => f.ev));
  const touched = d.added.concat(d.removed).filter(r => selfEv.has(r.ev)).length +
    d.changed.filter(c => selfEv.has(c.ev)).length;
  console.log('    the ask, self-drawing: ' + headed + '/' + selfFacts.length +
    ' draw a notehead, ' + barred + ' carry a bar (expected 0), ' +
    touched + ' item(s) moved by this rebuild (expected 0)');
  selfRight = headed === selfFacts.length && barred === 0 && touched === 0;
}

if (outside.total || d.removed.length || gaps.gaps.length || !ringRight || !selfRight) {
  fs.writeFileSync(irPath, irBytes);
  console.error('\nREFUSED — ' + (gaps.gaps.length ? 'a device field asks for something that is never drawn'
    : outside.total ? 'the rebuild moved ink OUTSIDE this block'
      : d.removed.length ? 'the rebuild REMOVED something'
        : !ringRight ? 'the ring bars did not come out as the drawn brick'
          : 'the self-drawing notes did not come out whole and bar-free') + '.');
  console.error(irId + ' has been RESTORED from the snapshot; nothing changed on disk.\n');
  process.exit(4);
}

const addedN = d.added.length, changedN = d.changed.length;
console.log('\nDONE. ' + ringFacts.length + ' ring bars of ' + brick + ' s on ' + irId +
  ' (' + addedN + ' added, ' + changedN + ' resized)' +
  (selfFacts.length ? ' + ' + selfFacts.length + ' self-drawing note(s) left alone' : '') +
  '; nothing else on the page moved.');
console.log('Look at it: node score/server.js -> http://localhost:5200/notation/app/notation.html');
console.log('            pick ' + irId + ', window ' + Math.max(0, t - 0.3).toFixed(1) +
  ' +' + (brick + 1).toFixed(1) + ' s\n');
