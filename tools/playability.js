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
  console.error('       [--brick 0.05] [--apply] [--listen] [--noCollapse] [--refigure] [--catchGap .5 --fullGap 1 --maxRunCatch 5 --maxRunFull 10]');
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

// ── FROZEN: notes the composer has already figured ───────────────────────────
// Day 31, learned by breaking it. A figure in an IR is `--cluster t0-t1@part`:
// the notes of THAT part in THAT span. Move a note across parts and the figure
// silently re-members itself — a different set of notes under a reading the
// composer approved. It happened to two of db1's forty (T7's 44.54-44.73 lost a
// note and stopped fitting at all; T7's 45.47-46.22 swapped D#2 for A2 and would
// have gone on fitting, unnoticed). So every note inside an approved figure is
// frozen unless --refigure says otherwise, and the report says how many.
const irDir = path.join(ROOT, 'notation', 'ir');
const frozen = new Set();
const figureSrc = [];
if (!has('refigure') && fs.existsSync(irDir)) {
  for (const nm of fs.readdirSync(irDir).filter(n => n.endsWith('.ir.json'))) {
    let ir; try { ir = JSON.parse(fs.readFileSync(path.join(irDir, nm), 'utf8')); } catch { continue; }
    const build = (ir.provenance || {}).build || '';
    if (!build.includes('--score ' + scoreName)) continue;
    const cls = build.match(/--cluster \S+/g) || [];
    let n = 0;
    for (const c of cls) {
      const [span, part] = c.replace('--cluster ', '').split('@');
      const [a, b] = span.split('-').map(Number);
      for (const o of all) {
        if (o.layer === +part && o.startSeconds >= a - 1e-9 && o.startSeconds <= b + 1e-9) {
          frozen.add(o.id); n++;
        }
      }
    }
    if (cls.length) figureSrc.push(nm.replace('.ir.json', '') + ' (' + cls.length + ' figures, ' + n + ' notes)');
  }
}
const frozenHere = inWindow.filter(o => frozen.has(o.id)).length;
if (figureSrc.length) {
  console.log('\n   FROZEN — already figured, so not free to move: ' + frozenHere + ' of '
    + inWindow.length + ' notes in this window');
  figureSrc.forEach(x => console.log('     ' + x));
  console.log('     (--refigure lifts this and re-opens them; the figures would then need rebuilding)');
} else if (has('refigure')) {
  console.log('\n   --refigure: approved figures are NOT protected this run');
}

// ── 2 redistribute ───────────────────────────────────────────────────────────
// Run on the whole score so a receiving part is checked against ALL its notes,
// then keep only the moves that touch this window.
const red = P.redistribute(all, { collapse: has('noCollapse') ? false : undefined, frozen });
const moves = red.moves.filter(m => ids.has(m.id));
const oneAtATime = moves.filter(m => m.which !== 'collapse');
const reseats = moves.filter(m => m.which === 'collapse');
console.log('\n2 · REDISTRIBUTE — move tight notes to parts with room (no removals, no time or pitch change)');
if (!oneAtATime.length) console.log('  nothing one part can take on its own.');
for (const m of oneAtATime) {
  console.log('  ' + m.id.padEnd(9) + T(m.from) + ' → ' + T(m.to).padEnd(4)
    + ' @' + m.at.toFixed(2) + '  ' + pn(m.midi)
    + '  (' + m.tier + ' pair with ' + m.pairWith + ', ' + m.which + '-note pass'
    + ', ' + Math.round(m.attack * 1000) + ' vs ' + Math.round(m.need * 1000) + ' ms)');
}

// ── 2b collapse ──────────────────────────────────────────────────────────────
// Where the greedy pass gives up because NOBODY is free, the gesture is re-seated
// as a whole: who catches which note is chosen jointly, to flatten the worst leap.
const gestures = (red.collapses || []).filter(c => c.at >= w0 - 1 && c.at < w1 + 1);
if (gestures.length) {
  console.log('\n2b · COLLAPSE — gestures where nobody was free, re-seated as a whole'
    + (has('noCollapse') ? ' (DISABLED by --noCollapse)' : ''));
  for (const c of gestures) {
    const head = '  @' + c.at.toFixed(2) + '  ' + c.parts + ' parts, ' + c.flags + ' flag'
      + (c.flags === 1 ? '' : 's');
    if (!c.applied) { console.log(head + '  — left alone: ' + c.reason); continue; }
    console.log(head + '  — worst leap ' + Math.round(c.worstBefore * 100) + '% → '
      + Math.round(c.worstAfter * 100) + '% short, ' + c.tightBefore + ' → ' + c.tightAfter
      + ' tight, ' + c.reseats + ' notes change hands');
    if (c.excluded.length) console.log('      sat out (two notes in the gesture): '
      + c.excluded.map(p => T(p)).join(' '));
    if ((c.frozen || []).length) console.log('      pinned (already figured): '
      + c.frozen.map(p => T(p)).join(' '));
    for (const m of reseats.filter(x => Math.abs(x.gesture - c.at) < 1e-9)) {
      console.log('      ' + m.id.padEnd(9) + T(m.from) + ' → ' + T(m.to).padEnd(4)
        + ' @' + m.at.toFixed(2) + '  ' + pn(m.midi)
        + (m.need != null ? '  (now ' + Math.round(m.attack * 1000) + ' vs '
          + Math.round(m.need * 1000) + ' ms — ' + m.tier + ')' : ''));
    }
  }
}
const reseated = gestures.some(c => c.applied);
const stillStuck = red.unresolved.filter(f => ids.has(f.b.id) || ids.has(f.a.id));
if (stillStuck.length) {
  console.log('  ' + (reseated
    ? 'AT THE FLOOR — no seating of these gestures does better; the composer decides (accept, or change the music):'
    : 'UNRESOLVED — no part can take these; the composer decides (accept, or change the music):'));
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
// A collapse is a PERMUTATION and move_object.js moves one note at a time, so
// going round a cycle always finds the destination still held by a note that is
// itself about to leave. Day 31: that transient tripped move_object's same-slot
// guard and stopped --apply half-way through. The guard is right about the thing
// it guards — a part left holding two notes 30 ms apart cannot be written — but
// it is asking about a state this batch never ends in. So: prove the END state
// first, force only past notes that are leaving in this same batch, and re-ask
// the guard's own question of the file on disk afterwards.
const SLOT = P.COLLAPSE.sameSlot;
const sameSlotFaults = (set) => {
  const bad = [];
  P.byPart(set).forEach((p, part) => {
    for (let i = 1; i < p.length; i++) {
      if (p[i].startSeconds - p[i - 1].startSeconds <= SLOT + 1e-9)
        bad.push(T(part) + ' ' + p[i - 1].id + '/' + p[i].id + ' @' + p[i].startSeconds.toFixed(3));
    }
  });
  return bad;
};
{
  const wouldBe = all.map(o => {
    const m = moves.find(x => x.id === o.id);
    return m ? { ...o, layer: m.to } : o;
  });
  const faults = sameSlotFaults(wouldBe);
  if (faults.length) {
    console.error('  REFUSED, nothing applied — the end state would be unwritable:');
    faults.forEach(b => console.error('    ' + b));
    process.exit(1);
  }
  console.log('  end state checked before touching the file: no same-slot fault');
}

const batch = new Set(moves.map(m => m.id));
const live = () => P.noteEvents(JSON.parse(fs.readFileSync(file, 'utf8')).objects || []);
for (const m of moves) {
  const clash = live().filter(o => o.layer === m.to && o.id !== m.id
    && Math.abs(o.startSeconds - m.at) <= SLOT);
  const staying = clash.filter(o => !batch.has(o.id));
  if (staying.length) {
    console.error('  STOPPED at ' + m.id + ': ' + T(m.to) + ' holds '
      + staying.map(o => o.id + '@' + o.startSeconds.toFixed(3)).join(', ')
      + ', which is not moving. Earlier moves stand; git checkout is the undo.');
    process.exit(1);
  }
  const args = [path.join(ROOT, 'tools', 'move_object.js'),
    '--score', scoreName, '--object', m.id, '--toPart', String(m.to), '--apply'];
  if (clash.length) args.push('--force');
  const out = execFileSync('node', args, { encoding: 'utf8', cwd: ROOT });
  const line = out.split('\n').find(l => l.startsWith('| '));
  console.log('  moved ' + m.id + ' ' + T(m.from) + ' -> ' + T(m.to)
    + (clash.length ? '   (forced past ' + clash.map(o => o.id).join(', ')
      + ' — leaving in this batch)' : ''));
  m.ledger = line;
}
{
  const faults = sameSlotFaults(live());
  console.log('  same-slot re-asked of the file on disk: '
    + (faults.length ? 'FAILED — ' + faults.join('; ') : 'clean'));
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
const reasonFor = (m) => {
  if (m.which !== 'collapse') {
    return why + ': ' + m.tier + ' re-attack ' + Math.round(m.attack * 1000) + ' ms vs '
      + Math.round(m.need * 1000) + ' needed, pair with ' + m.pairWith + ' (' + m.which + '-note pass)';
  }
  const g = (red.collapses || []).find(c => Math.abs(c.at - m.gesture) < 1e-9) || {};
  return why + ': joint re-seating of the ' + m.gesture.toFixed(2) + ' s collapse ('
    + g.parts + ' parts, worst leap ' + Math.round(g.worstBefore * 100) + '% → '
    + Math.round(g.worstAfter * 100) + '% short) — this part now takes ' + pn(m.midi)
    + (m.need != null ? ' after ' + m.pairWith + ', ' + Math.round(m.attack * 1000) + ' ms vs '
      + Math.round(m.need * 1000) + ' needed' : '');
};
const lines = moves.map(m => (m.ledger || '').replace(
  'composer instruction (compositional move, not a correction)', reasonFor(m)
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
