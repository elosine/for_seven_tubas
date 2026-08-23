#!/usr/bin/env node
// playability.js — THE PLAYABILITY PROCESS, one command, any section.
//
// Composer, day 25 (2026-08-23), naming it: *"I want to define this process, what
// we're doing now, as the playability process. And what that is is exactly as it
// sounds. I just want to evaluate things for playability… the smear or audibility
// is of secondary concern… And then I don't mind getting a flag about those other
// aspects."* And on why it is a tool: *"create whatever code is necessary to be
// able to run this thinning analysis / redistributing process automatically again
// for subsequent parts."*
//
// WHAT IT DOES, in order:
//   1  audit      hard overlaps + tight re-attacks, per part          (levels 1–2)
//   2  redistribute  move the tight notes to parts that have room; never remove,
//                    never change time or pitch, report what cannot be placed
//   3  bricks     optionally normalise one-shot written lengths — NOT cosmetic:
//                 a long brick reads as a HARD conflict over a comfortable attack
//                 gap, and redistribution can move a note under one (measured on
//                 CLOUD02-I: the 12 moves created two such artefacts)
//   4  breath     longest run per part without a chance to inhale   (level 3)
//   5  flag       fused attacks, sounding count                     (level 4, INFO)
//
// Dry run by default. `--apply` writes the moves and bricks to the score, appends
// the ledger lines to docs/ARCHIVE_AMENDMENTS.md, and prints the re-extract command.
//
//   node tools/playability.js --score piece-s25-finished01 --section CLOUD02-D
//   node tools/playability.js --score piece-s25-finished01 --w0 42.38 --w1 46.0
//   node tools/playability.js --score … --section CLOUD02-D --brick 0.05 --apply
//   node tools/playability.js --score … --section CLOUD02-D --listen
//
// --section  a marker label; the window runs from that marker to the next one.
// --listen   write a scratch before/after score for the composer to hear.
//
// The archive is frozen (docs/ARCHIVE_AMENDMENTS.md rule 1): --apply is an
// explicit, ledgered act. `git checkout -- scores/<name>.json` is the undo.

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'notation', 'lib', 'playability.js'));

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] != null ? argv[i + 1] : d; };
const has = n => argv.includes('--' + n);

const scoreName = arg('score');
const section = arg('section');
const w0arg = arg('w0'), w1arg = arg('w1');
const brick = arg('brick') != null ? +arg('brick') : null;
const APPLY = has('apply');
const LISTEN = has('listen');
const dials = {
  catchGap: +arg('catchGap', P.BREATH.catchGap), fullGap: +arg('fullGap', P.BREATH.fullGap),
  maxRunCatch: +arg('maxRunCatch', P.BREATH.maxRunCatch), maxRunFull: +arg('maxRunFull', P.BREATH.maxRunFull),
};

if (!scoreName || (!section && (w0arg == null || w1arg == null))) {
  console.error('usage: playability.js --score <name> (--section <marker label> | --w0 <s> --w1 <s>)');
  console.error('       [--brick 0.05] [--apply] [--listen] [--catchGap .5 --fullGap 1 --maxRunCatch 5 --maxRunFull 10]');
  process.exit(2);
}

const file = path.join(ROOT, 'scores', scoreName + '.json');
const score = JSON.parse(fs.readFileSync(file, 'utf8'));
const all = P.noteEvents(score.objects || []);

// ── the window ───────────────────────────────────────────────────────────────
let w0, w1, windowLabel;
if (section) {
  const marks = (score.objects || []).filter(o => o.type === 'marker').sort((a, b) => a.time - b.time);
  const i = marks.findIndex(m => (m.label || '').toLowerCase().startsWith(section.toLowerCase()));
  if (i < 0) {
    console.error('no marker starting "' + section + '". Markers in this score:');
    marks.forEach(m => console.error('  ' + m.time.toFixed(2).padStart(8) + '  ' + m.label));
    process.exit(1);
  }
  w0 = marks[i].time;
  w1 = i + 1 < marks.length ? marks[i + 1].time : Math.max(...all.map(o => o.endSeconds));
  windowLabel = marks[i].label + '  (' + w0.toFixed(2) + '–' + w1.toFixed(2) + ' s, marker to next marker)';
} else {
  w0 = +w0arg; w1 = +w1arg;
  windowLabel = w0.toFixed(2) + '–' + w1.toFixed(2) + ' s';
}

const inWindow = all.filter(o => o.startSeconds >= w0 && o.startSeconds < w1);
if (!inWindow.length) { console.error('no notes in ' + windowLabel); process.exit(1); }
const ids = new Set(inWindow.map(o => o.id));

const NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => NM[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const T = p => 'T' + (p + 1);

console.log('THE PLAYABILITY PROCESS — ' + scoreName);
console.log(windowLabel + ' · ' + inWindow.length + ' notes\n');

// ── 1 audit ──────────────────────────────────────────────────────────────────
// The window is audited IN CONTEXT: a part's neighbours just outside the window
// still constrain it, so the whole score is passed to flags() and the results
// filtered. Auditing the window alone would miss a tight pair straddling its edge.
const flagsInWindow = (notes) => P.flags(notes).filter(f => ids.has(f.b.id) || ids.has(f.a.id));
const before = flagsInWindow(all);
console.log('1 · AUDIT — hard overlaps and tight re-attacks');
if (!before.length) console.log('  clean: no hard, no soft.');
for (const f of before) {
  console.log('  ' + (f.tier === 'hard' ? 'HARD' : 'soft') + ' ' + T(f.part).padEnd(4)
    + '@' + f.b.startSeconds.toFixed(2) + '  ' + pn(f.a.sonifyNote) + '→' + pn(f.b.sonifyNote)
    + ' (' + Math.abs(f.b.sonifyNote - f.a.sonifyNote) + ' st)'
    + '  attack ' + Math.round(f.attack * 1000) + ' ms, needs ' + Math.round(f.need * 1000)
    + (f.tier === 'hard' ? '  · brick overlaps by ' + Math.round(f.overlap * 1000) + ' ms' : ''));
}

// ── 2 redistribute ───────────────────────────────────────────────────────────
// Run on the whole score so a receiving part is checked against ALL its notes,
// then keep only the moves that touch this window.
const red = P.redistribute(all);
const moves = red.moves.filter(m => ids.has(m.id));
console.log('\n2 · REDISTRIBUTE — move tight notes to parts with room (no removals, no time or pitch change)');
if (!moves.length) console.log('  nothing to move.');
for (const m of moves) {
  console.log('  ' + m.id.padEnd(9) + T(m.from) + ' → ' + T(m.to).padEnd(4)
    + ' @' + m.at.toFixed(2) + '  ' + pn(m.midi)
    + '  (' + m.tier + ' pair with ' + m.pairWith + ', ' + m.which + '-note pass'
    + ', ' + Math.round(m.attack * 1000) + ' vs ' + Math.round(m.need * 1000) + ' ms)');
}
const stillStuck = red.unresolved.filter(f => ids.has(f.b.id) || ids.has(f.a.id));
if (stillStuck.length) {
  console.log('  UNRESOLVED — no part can take these; the composer decides (accept, or change the music):');
  for (const f of stillStuck) {
    console.log('    ' + f.tier + ' ' + T(f.part) + '@' + f.b.startSeconds.toFixed(2)
      + '  ' + pn(f.a.sonifyNote) + '→' + pn(f.b.sonifyNote)
      + '  ' + Math.round(f.attack * 1000) + ' vs ' + Math.round(f.need * 1000) + ' ms'
      + '  (short by ' + Math.round((f.need - f.attack) * 1000) + ' ms, '
      + Math.round(100 * (f.need - f.attack) / f.need) + '%)');
  }
}

// ── 3 bricks ─────────────────────────────────────────────────────────────────
// Applied to the REDISTRIBUTED set, because that is the order --apply uses and
// the order that matters: moves can create brick overlaps that only this clears.
const afterMoves = red.notes;
const brickTargets = brick != null
  ? afterMoves.filter(o => ids.has(o.id) && (o.technique || 'staccato') === 'staccato')
  : [];
const withBricks = brick == null ? afterMoves
  : afterMoves.map(o => brickTargets.some(t => t.id === o.id)
    ? { ...o, endSeconds: +(o.startSeconds + brick).toFixed(3) } : o);
if (brick != null) {
  const lens = brickTargets.map(o => o.endSeconds - o.startSeconds);
  const hardAfterMoves = flagsInWindow(afterMoves).filter(f => f.tier === 'hard').length;
  const hardAfterBricks = flagsInWindow(withBricks).filter(f => f.tier === 'hard').length;
  console.log('\n3 · BRICKS — written one-shot length -> ' + (brick * 1000).toFixed(0) + ' ms');
  console.log('  ' + brickTargets.length + ' staccato notes, currently '
    + (Math.min(...lens) * 1000).toFixed(0) + '–' + (Math.max(...lens) * 1000).toFixed(0) + ' ms');
  console.log('  hard in this window after the moves: ' + hardAfterMoves + ' -> ' + hardAfterBricks
    + (hardAfterMoves > hardAfterBricks ? '   (the moves put notes under long bricks; this clears them)' : ''));
  console.log('  sound unaffected — D51: a fixed one-shot lasts its sample length, and the IR carries it');
}

// ── verify: the whole point is that the result is clean ──────────────────────
const finalFlags = flagsInWindow(withBricks);
console.log('\n   RESULT for this window: '
  + finalFlags.filter(f => f.tier === 'hard').length + ' hard, '
  + finalFlags.filter(f => f.tier === 'soft').length + ' soft'
  + '   (was ' + before.filter(f => f.tier === 'hard').length + ' hard, '
  + before.filter(f => f.tier === 'soft').length + ' soft)');

// ── 4 breath ─────────────────────────────────────────────────────────────────
// Measured in context too: a run does not stop at the window edge.
console.log('\n4 · BREATH — longest run with no chance to inhale (model, not measured — dials: '
  + 'catch ' + dials.catchGap + ' s / full ' + dials.fullGap + ' s, limits '
  + dials.maxRunCatch + ' s / ' + dials.maxRunFull + ' s)');
const ctx = withBricks.filter(o => o.startSeconds >= w0 - 20 && o.startSeconds < w1 + 20);
const breath = P.breathRuns(ctx, dials);
let breathBad = 0;
for (const b of breath) {
  if (!b.n) continue;
  const bad = !b.okCatch || !b.okFull;
  if (bad) breathBad++;
  console.log('  ' + T(b.part).padEnd(4) + String(b.n).padStart(3) + ' notes  '
    + 'no catch-breath for ' + b.catchRun.toFixed(1).padStart(5) + ' s (from ' + b.catchAt.toFixed(1) + ')'
    + '   no full breath for ' + b.fullRun.toFixed(1).padStart(5) + ' s'
    + (b.held ? '   held ' + b.held + ' s' : '')
    + (bad ? '   <-- OVER THE DIAL' : ''));
}
if (!breathBad) console.log('  every part is inside the dials.');

// ── 5 audibility — INFORMATION ONLY ──────────────────────────────────────────
const lengths = P.staccatoLengths(ROOT);
const aud = P.audibility(withBricks.filter(o => ids.has(o.id)), lengths);
console.log('\n5 · AUDIBILITY FLAG (information — this process never removes a note)');
console.log('  ' + aud.rate + ' attacks/s across the ensemble · '
  + aud.fused + ' of ' + (aud.notes - 1) + ' attacks land within ' + aud.fusionWindowMs + ' ms of the previous one'
  + ' (the ear takes those as one impulse)');
console.log('  sounding count max ' + aud.soundingMax + ', mean ' + aud.soundingMean
  + '   (voices fuse into a mass at about 4–5 — DB 042)');
if (aud.fused > (aud.notes - 1) * 0.3) {
  console.log('  -> a thinning study is available if you want one: tools/cloud02i_ab.js (research, not this process)');
}

// ── --listen ─────────────────────────────────────────────────────────────────
if (LISTEN) {
  const shift = (set, at) => set.filter(o => ids.has(o.id)).map((o, i) => ({
    ...o, id: 'wc-l' + (at) + '-' + i,
    startSeconds: +(o.startSeconds - w0 + at).toFixed(3),
    endSeconds: +(o.endSeconds - w0 + at).toFixed(3),
  }));
  const span = w1 - w0, gap = Math.max(3, span * 0.8);
  const objs = [
    { id: 'mk-1', type: 'marker', layer: 0, time: 0, label: 'BEFORE — ' + before.length + ' flags',
      color: '#5E8C7A', groupId: 'grp-before', performanceNotes: '', properties: {} },
    ...shift(all, 0).map(o => ({ ...o, groupId: 'grp-before', color: '#5E8C7A', performanceNotes: 'BEFORE' })),
    { id: 'mk-2', type: 'marker', layer: 0, time: +(span + gap).toFixed(3),
      label: 'AFTER — ' + moves.length + ' moved, ' + finalFlags.length + ' flags',
      color: '#1B5E20', groupId: 'grp-after', performanceNotes: '', properties: {} },
    ...shift(withBricks, span + gap).map(o => ({ ...o, groupId: 'grp-after', color: '#1B5E20', performanceNotes: 'AFTER' })),
  ];
  const out = path.join(ROOT, 'scores', 'playability-' + (section || (w0 + '-' + w1)).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json');
  fs.writeFileSync(out, JSON.stringify({
    version: score.version, layoutVersion: score.layoutVersion, tracks: score.tracks, assets: {},
    metadata: { created: new Date().toISOString(), modified: new Date().toISOString(),
      provenance: { build: 'node ' + ['tools/playability.js', ...argv].join(' '),
        note: 'SCRATCH: before/after for listening. Nothing canonical.' } },
    objects: objs, markers: [], databases: score.databases, nextId: objs.length + 1,
    viewport: { pixelsPerSecond: 120, scrollOffset: 0 },
  }));
  console.log('\n   --listen: wrote ' + path.relative(ROOT, out) + ' (before at 0 s, after at '
    + (span + gap).toFixed(1) + ' s)');
}

// ── --apply ──────────────────────────────────────────────────────────────────
if (!APPLY) {
  console.log('\nDRY RUN — nothing written. Add --apply to make the moves'
    + (brick != null ? ' and the brick change' : '') + ', ledger them, and get the re-extract command.');
  process.exit(0);
}

if (!moves.length && brick == null) { console.log('\nnothing to apply.'); process.exit(0); }

console.log('\n--- APPLYING ---');
for (const m of moves) {
  const out = execFileSync('node', [path.join(ROOT, 'tools', 'move_object.js'),
    '--score', scoreName, '--object', m.id, '--toPart', String(m.to), '--apply'],
    { encoding: 'utf8', cwd: ROOT });
  const line = out.split('\n').find(l => l.startsWith('| '));
  console.log('  moved ' + m.id + ' ' + T(m.from) + ' -> ' + T(m.to));
  m.ledger = line;
}
if (brick != null) {
  const grp = [...new Set(brickTargets.map(o => o.groupId).filter(Boolean))];
  const a = ['--score', scoreName, '--brick', String(brick), '--apply'];
  if (grp.length === 1) a.push('--group', grp[0]); else { a.push('--w0', String(w0), '--w1', String(w1)); }
  const out = execFileSync('node', [path.join(ROOT, 'tools', 'set_brick.js'), ...a], { encoding: 'utf8', cwd: ROOT });
  console.log('  ' + out.split('\n').find(l => l.includes('notes, written length')).trim());
  var brickLedger = out.split('\n').find(l => l.startsWith('| '));
}

// re-read and re-audit from disk — proof the file on disk is what we claimed
const after = JSON.parse(fs.readFileSync(file, 'utf8'));
const check = P.flags(P.noteEvents(after.objects || [])).filter(f => ids.has(f.b.id) || ids.has(f.a.id));
console.log('  re-audited from disk: ' + check.filter(f => f.tier === 'hard').length + ' hard, '
  + check.filter(f => f.tier === 'soft').length + ' soft in this window');

const ledgerFile = path.join(ROOT, 'docs', 'ARCHIVE_AMENDMENTS.md');
const why = 'THE PLAYABILITY PROCESS (`tools/playability.js --section ' + (section || w0 + '-' + w1) + '`)';
const lines = moves.map(m => (m.ledger || '').replace(
  'composer instruction (compositional move, not a correction)',
  why + ': ' + m.tier + ' re-attack ' + Math.round(m.attack * 1000) + ' ms vs '
  + Math.round(m.need * 1000) + ' needed, pair with ' + m.pairWith + ' (' + m.which + '-note pass)'
).replace('| — |', '| window re-audited from disk after applying: '
  + check.filter(f => f.tier === 'hard').length + ' hard, ' + check.filter(f => f.tier === 'soft').length + ' soft |')
  .replace('SCORE EDIT (archive) |', 'SCORE EDIT (archive) — applied |'));
if (typeof brickLedger === 'string') lines.push(brickLedger);
fs.appendFileSync(ledgerFile, lines.join('\n') + '\n');
console.log('  appended ' + lines.length + ' ledger line(s) to docs/ARCHIVE_AMENDMENTS.md');

console.log('\nNEXT — re-extract every IR built from this score so page and sound follow:');
console.log('  node -e "console.log(require(\'./notation/ir/db1.ir.json\').provenance.build)" | bash');
console.log('  node tools/pattern_analyze.js --ir db1 --validate');
console.log('  git add -- scores/' + scoreName + '.json docs/ARCHIVE_AMENDMENTS.md notation/ir/');
