#!/usr/bin/env node
// test_notate_block.js — the battery for the block generator (day 35).
//
// THE GOLDEN IS THE POINT. The generator was built from n=2 hand-notated
// instances — the 41 s fp blast (day 30) and the 48.05 octaves-Bb long tone
// (day 35). Two instances were not enough evidence to build ON (the day-35
// evaluation said so, and reversed only when the composer supplied the fact
// that the material recurs), but they are exactly enough to build FROM,
// because they can be replayed: strip both --ringFromBrick flags out of the
// db1 build command, rebuild that page as a twin, let the MACHINE put them
// back, and require the result to be item-for-item identical to the page the
// composer has already approved. If the machine cannot reproduce the two
// pages that already exist, it has no business touching a third.
//
//   node tools/test_notate_block.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const DeviceCheck = require(path.join(ROOT, 'notation', 'lib', 'device_check.js'));
const Prove = require(path.join(ROOT, 'notation', 'lib', 'prove_unmoved.js'));

let pass = 0, fail = 0;
function ok(cond, what, detail) {
  if (cond) { pass++; console.log('  ok   ' + what); }
  else { fail++; console.log('  FAIL ' + what + (detail ? '\n         ' + detail : '')); }
}
const run = (args, opts) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, args, Object.assign({ cwd: ROOT, encoding: 'utf8' }, opts || {})) };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
};

const GLYPHS = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const CONTAINER = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));
const LAYOUT_OPTS = Object.assign(
  { m4AttackLines: false, frameParts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  (CONTAINER.engraving && CONTAINER.engraving.layout) || {});
const layoutOf = ir => Layout.layoutSection(JSON.parse(JSON.stringify(ir)), GLYPHS, LAYOUT_OPTS);
const readIr = id => JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', id + '.ir.json'), 'utf8'));

const NB = path.join(ROOT, 'tools', 'notate_block.js');
const NS = path.join(ROOT, 'tools', 'notate_section.js');
const SCORE = 'piece-s25-finished01';
const GOLDEN_ID = 'nb-golden-tmp';
const goldenPath = path.join(ROOT, 'notation', 'ir', GOLDEN_ID + '.ir.json');

// ---------------------------------------------------------------------------
console.log('\n1. device_check — the table is DERIVED from layout.js, not guessed');
// ---------------------------------------------------------------------------
{
  const t = DeviceCheck.tableFromLayoutFile(fs, path.join(ROOT, 'notation', 'lib', 'layout.js'));
  ok(/^derived from/.test(t.source), 'table derived from the live layout.js (not the fallback)', t.source);
  ok(JSON.stringify(t.table.ringSeconds) === '["ringBar"]',
    'ringSeconds depends on ringBar  <- the D72 pair, found in the source', JSON.stringify(t.table.ringSeconds));
  ok((t.table.nhDotGapSs || []).indexOf('nhDot') >= 0,
    'nhDotGapSs depends on nhDot  <- a second, independently checkable pair');
  ok(Object.keys(t.table).length >= 20,
    'the derivation found the whole guard structure (' + Object.keys(t.table).length + ' dependent fields)');

  // THE D72 SCENARIO ITSELF, rebuilt: ringSeconds on an ord note, no ringBar.
  const fake = {
    events: [{ id: 'ev-x', onset: 48.05, duration: 4.41, technique: 'ord', source: { objectId: 'wc-x' } }],
    chunks: [{ part: 0, events: ['ev-x'] }],
    overlays: []
  };
  const ordDev = { goLine: true, nhUnit: true, dynMark: 'band' };
  const gapRes = DeviceCheck.findGaps(fake, () => Object.assign({}, ordDev, { ringSeconds: 4.41 }), t.table);
  ok(gapRes.gaps.length === 1 && gapRes.gaps[0].field === 'ringSeconds' && gapRes.gaps[0].needs === 'ringBar',
    'D72 REPRODUCED: ringSeconds on ord with no ringBar is caught', JSON.stringify(gapRes.gaps));
  const fixed = DeviceCheck.findGaps(fake, () => Object.assign({}, ordDev, { ringSeconds: 4.41, ringBar: true }), t.table);
  ok(fixed.gaps.length === 0, 'and the D72 FIX (ringBar written alongside) passes clean');
  const offSwitch = DeviceCheck.findGaps(fake, () => ({ nhUnit: false, nhDot: false, ringBar: false }), t.table);
  ok(offSwitch.gaps.length === 0, 'a --bare event (every field false) is not a gap — off asks for nothing');
}

// ---------------------------------------------------------------------------
console.log('\n2. prove_unmoved — a page against itself, and against a real move');
// ---------------------------------------------------------------------------
{
  const db1 = readIr('db1');
  const M = layoutOf(db1);
  const same = Prove.diff(M, layoutOf(db1));
  ok(Prove.isClean(same, 0) && same.beforeCount === same.afterCount,
    'db1 against itself: ADDED 0 / REMOVED 0 / CHANGED 0 (' + same.beforeCount + ' items)');

  const moved = JSON.parse(JSON.stringify(db1));
  const ov = moved.overlays.find(o => o.value && o.value.device && o.value.device.ringSeconds != null);
  ov.value.device.ringSeconds = 2.0;
  const d2 = Prove.diff(M, layoutOf(moved));
  ok(d2.changed.length === 1 && d2.added.length === 0 && d2.removed.length === 0,
    'a lengthened ring bar reads as CHANGED 1, not as an add plus a remove',
    'added ' + d2.added.length + ' removed ' + d2.removed.length + ' changed ' + d2.changed.length);
  ok(!Prove.isClean(d2, 0), 'and isClean refuses it');

  const dropped = JSON.parse(JSON.stringify(db1));
  dropped.overlays = dropped.overlays.filter(o => !(o.value && o.value.device && o.value.device.ringSeconds != null));
  const d3 = Prove.diff(M, layoutOf(dropped));
  ok(d3.removed.length + d3.changed.length > 0, 'dropping every ring overlay is caught (' +
    d3.removed.length + ' removed, ' + d3.changed.length + ' changed)');
}

// ---------------------------------------------------------------------------
console.log('\n3. reading the block — the three schemas, one place (day-35 T2)');
// ---------------------------------------------------------------------------
{
  const r = run([NB, '--score', SCORE, '--group', 'grp-octbb-ord-01']);
  ok(r.code === 0, 'dry run on the 48.05 long tone exits 0');
  ok(/10 on parts T1 T2 T3 T4 T5 T6 T7 T8 T9 T10/.test(r.out), '10 notes found, one per tuba');
  ok(/\(\+1 handle\)/.test(r.out), 'the group handle is NOT counted as a note');
  ok(/brick   4\.41 s \(uniform\)/.test(r.out), 'the brick derives as 4.41 s, uniform');
  ok(/48\.0-48\.1/.test(r.out), 'the emitted span matches the hand-built one exactly: 48.0-48.1');
  ok(/ALREADY DONE/.test(r.out), 'and it recognises db1 already carries that flag (idempotent)');

  const r2 = run([NB, '--score', SCORE, '--group', 'grp-vert03-fp-01']);
  ok(/40\.9-41\.0/.test(r2.out), 'the 41 s blast emits 40.9-41.0, the hand-built span');
  ok(/brick   1\.01 s \(uniform\)/.test(r2.out), 'its brick derives as 1.01 s');
  ok(/fortepiano x7, cuivre x3/.test(r2.out), 'a MIXED-technique block is read correctly (7 fp + 3 cuivre)');
}

// ---------------------------------------------------------------------------
console.log('\n4. the refusals');
// ---------------------------------------------------------------------------
{
  // THE ONE-INSTANT HALF OF THE DEFINITION, now asserted in its own right.
  // This cloud has a perfectly uniform 0.05 s brick and 153 onsets over 4.1 s.
  // Until day 35 it was turned away for its TECHNIQUE — accidental cover that
  // disappeared the moment staccato became legal in a block.
  const r = run([NB, '--score', SCORE, '--group', 'grp-cloud02-i-01']);
  ok(r.code === 2 && /this is not a block/.test(r.out),
    'a 159-note CLOUD is REFUSED for being spread, not for its technique', 'exit ' + r.code);
  ok(/spread over 4\.138 s.*153 distinct onsets/s.test(r.out) && /pattern_analyze/.test(r.out),
    'and the refusal measures the spread and points at the figure process', r.out.slice(-400));

  // DAY 35, FIFTH SITTING — this case CHANGED SIDES, and deliberately.
  // grp-s035-846 (9 staccato + 1 cuivre) was the original build's example of the
  // T3 refusal: a technique with no ring bar. The composer then dictated eleven
  // such columns, and the registry turned out to have answered the question the
  // refusal was asking — staccato's dotted 16th IS its notation. So a MIXED block
  // is now legal, and what must still be refused is a technique on NEITHER list.
  const r2 = run([NB, '--score', SCORE, '--group', 'grp-s035-846']);
  ok(r2.code !== 2 || !/no ring bar/.test(r2.out),
    'a MIXED block (9 staccato + 1 cuivre) is no longer refused for the staccato', 'exit ' + r2.code);
  ok(/split   1 ring \(cuivre\) \+ 9 self-drawing \(staccato\)/.test(r2.out),
    'and it partitions into 1 ring + 9 self-drawing', r2.out.slice(0, 600));

  // the T3 trap itself, still shut: a technique on neither list
  {
    const tmpScore = 'nb-tech-tmp';
    const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', SCORE + '.json'), 'utf8'));
    s.objects.forEach(o => { if (o.groupId === 'grp-s035-846' && o.technique === 'staccato') o.technique = 'flutter'; });
    fs.writeFileSync(path.join(ROOT, 'scores', tmpScore + '.json'), JSON.stringify(s, null, 1));
    const rT = run([NB, '--score', tmpScore, '--group', 'grp-s035-846']);
    ok(rT.code === 2 && /no rule for/.test(rT.out) && /flutter/.test(rT.out),
      'an UNKNOWN technique is still REFUSED — the T3 trap stays shut', 'exit ' + rT.code);
    fs.unlinkSync(path.join(ROOT, 'scores', tmpScore + '.json'));
  }

  const r3 = run([NB, '--score', SCORE, '--group', 'grp-s009-817']);
  ok(r3.code === 3 && /OUTSIDE THE WINDOW/.test(r3.out),
    'a block at 81.7 s is REFUSED against db1 (window ends 55.94) — T4, decided not guessed', 'exit ' + r3.code);
  ok(/notate_section\.js --score .* --w0 81 --w1 \d+/.test(r3.out),
    'and the refusal prints the exact command for the new-IR option');

  const r4 = run([NB, '--score', SCORE, '--group', 'grp-nope-999']);
  ok(r4.code === 2 && /No group/.test(r4.out), 'an unknown group is refused with a pointer to --list');

  const r5 = run([NB, '--score', 'nb-no-such-score', '--group', 'grp-octbb-ord-01']);
  ok(r5.code === 2 && /No score file/.test(r5.out), 'an unknown score is refused');
}

// ---------------------------------------------------------------------------
console.log('\n5. THE GOLDEN — the machine must rebuild the two approved pages exactly');
// ---------------------------------------------------------------------------
{
  const db1 = readIr('db1');
  const stripped = db1.provenance.build
    .replace(/ --ringFromBrick [0-9.]+-[0-9.]+/g, '')
    .replace('--id db1', '--id ' + GOLDEN_ID);
  ok(!/--ringFromBrick/.test(stripped), 'both --ringFromBrick flags stripped from the twin command');

  // tokenise the same way notate_block does
  const argv = [];
  { let i = 0, c = stripped;
    while (i < c.length) {
      while (i < c.length && /\s/.test(c[i])) i++;
      if (i >= c.length) break;
      if (c[i] === '"') { let j = i + 1, b = '';
        while (j < c.length) { if (c[j] === '\\') { b += c[j + 1]; j += 2; continue; } if (c[j] === '"') { j++; break; } b += c[j++]; }
        argv.push(b); i = j;
      } else { let j = i; while (j < c.length && !/\s/.test(c[j])) j++; argv.push(c.slice(i, j)); i = j; }
    } }

  const built = run([NS].concat(argv.slice(2)));
  ok(built.code === 0 && fs.existsSync(goldenPath), 'the twin page builds', built.out.slice(-400));

  if (fs.existsSync(goldenPath)) {
    const bare = layoutOf(readIr(GOLDEN_ID));
    const target = layoutOf(db1);
    const nBare = bare.systems.reduce((a, s) => a + s.items.length, 0);
    const nDb1 = target.systems.reduce((a, s) => a + s.items.length, 0);

    // WHAT THE GOLDEN TAUGHT (day 35, second sitting of the build): the twin is
    // only TEN items short, not twenty. --ringFromBrick ADDS bars on ord, whose
    // registry entry has no ringBar, but merely RESIZES them on fortepiano and
    // cuivre, which already draw one at the sample length. One instruction, one
    // material class, two different diffs — which is exactly why the proof had
    // to become CONFINEMENT ("nothing outside this block moved") instead of the
    // ADDED-n/REMOVED-0/CHANGED-0 shape the day-35 hand proof happened to take.
    ok(nBare === nDb1 - 10,
      'the twin is 10 items short: the ord long tone loses its bars, the fp blast keeps its own',
      nBare + ' vs ' + nDb1);
    const barLensBare = [...new Set(bare.systems.flatMap(s => s.items)
      .filter(i => i.k === 'ringbar' && i.t0 > 40.9 && i.t0 < 41.0)
      .map(i => +(i.t1 - i.t0).toFixed(3)))];
    ok(barLensBare.length > 1,
      'and the fp blast bars in the twin are RAGGED sample lengths (' + barLensBare.join(', ') + ' s) — what the flag exists to fix');

    const g1 = run([NB, '--score', SCORE, '--group', 'grp-vert03-fp-01', '--ir', GOLDEN_ID, '--apply']);
    ok(g1.code === 0, 'the machine notates the 41 s blast into the twin', g1.out.slice(-800));
    ok(/OUTSIDE the target: added 0 \/ changed 0 \/ removed 0/.test(g1.out),
      'CONFINED: nothing outside the 41 s block moved');
    ok(/the ask, ring: 10\/10 notes carry one ring bar, length 1\.01 s.*uniform/.test(g1.out),
      'and all ten bars come out at the drawn brick, 1.01 s uniform');
    ok(/no orphaned device fields/.test(g1.out), 'device-gap assert clean on the rebuilt page');

    const g2 = run([NB, '--score', SCORE, '--group', 'grp-octbb-ord-01', '--ir', GOLDEN_ID, '--apply']);
    ok(g2.code === 0, 'the machine notates the 48.05 long tone into the twin', g2.out.slice(-800));
    ok(/ADDED 10 \/ REMOVED 0 \/ CHANGED 0/.test(g2.out),
      'the ord long tone ADDS ten bars (its registry entry has no ringBar) — D72 in the diff');
    ok(/OUTSIDE the target: added 0 \/ changed 0 \/ removed 0/.test(g2.out),
      'CONFINED: nothing outside the 48.05 block moved');
    ok(/the ask, ring: 10\/10 notes carry one ring bar, length 4\.41 s.*uniform/.test(g2.out),
      'and all ten bars come out at the drawn brick, 4.41 s uniform');

    // THE GOLDEN ASSERTION
    const d = Prove.diff(layoutOf(db1), layoutOf(readIr(GOLDEN_ID)));
    ok(Prove.isClean(d, 0),
      'GOLDEN: the machine-built page is ITEM-FOR-ITEM IDENTICAL to the approved db1',
      'added ' + d.added.length + ' removed ' + d.removed.length + ' changed ' + d.changed.length);
    ok(d.warningsBefore === d.warningsAfter, 'and the layout warnings match exactly (' + d.warningsAfter + ')');
  }
}

// ---------------------------------------------------------------------------
console.log('\n6. the snapshot restores a page that cannot prove itself');
// ---------------------------------------------------------------------------
{
  if (fs.existsSync(goldenPath)) {
    // Corrupt the twin build command so the rebuild fails, then check the file
    // is byte-restored rather than left half-written.
    const before = fs.readFileSync(goldenPath, 'utf8');
    const doc = JSON.parse(before);
    // strip the fp block flag so the tool does not short-circuit on "already
    // done", and poison the command so the rebuild itself exits non-zero
    doc.provenance.build = doc.provenance.build
      .replace(/ --ringFromBrick 40\.9-41(\.0)?/, '') + ' --dynSide 999.0@0:above';
    fs.writeFileSync(goldenPath, JSON.stringify(doc, null, 1));
    const snapshot = fs.readFileSync(goldenPath, 'utf8');
    const r = run([NB, '--score', SCORE, '--group', 'grp-vert03-fp-01', '--ir', GOLDEN_ID, '--apply']);
    const after = fs.readFileSync(goldenPath, 'utf8');
    ok(r.code !== 0, 'a rebuild that cannot succeed exits non-zero', 'exit ' + r.code);
    ok(after === snapshot, 'and the IR file is byte-restored from the snapshot — nothing half-written');
    fs.writeFileSync(goldenPath, before);
  } else ok(false, 'twin page missing, snapshot test skipped');
}

// ---------------------------------------------------------------------------
console.log('\n7. THE BLAST COLUMNS — mixed blocks and all-staccato blocks (day 35, fifth sitting)');
// ---------------------------------------------------------------------------
// Self-contained on purpose: a TEMP FIXTURE score, not whichever save file
// happens to have been normalised. The composer's eleven columns live in
// piece-s26 and get their bricks normalised as part of building that page; a
// battery that depended on that edit would pass or fail on the state of a file
// it does not own.
{
  const TMP_SCORE = 'nb-blast-tmp';
  const TWIN = 'nb-blast-ir-tmp';
  const tmpScorePath = path.join(ROOT, 'scores', TMP_SCORE + '.json');
  const twinPath = path.join(ROOT, 'notation', 'ir', TWIN + '.ir.json');
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', SCORE + '.json'), 'utf8'));

  // the raw column is ragged (0.41-0.51 s), which is the refusal below;
  // normalise a COPY to the composer's shortest-in-the-stack rule, 0.41
  const RAGGED = 'grp-s008-949';
  const rawLens = new Set(s.objects.filter(o => o.groupId === RAGGED && o.sonifyNote != null)
    .map(o => +(o.endSeconds - o.startSeconds).toFixed(4)));
  ok(rawLens.size > 1, 'fixture: the all-staccato column starts ragged (' + [...rawLens].join(', ') + ' s)');

  const rRag = run([NB, '--score', SCORE, '--group', RAGGED]);
  ok(rRag.code === 2 && /NOT UNIFORM/.test(rRag.out) && /set_brick\.js/.test(rRag.out),
    'a ragged column is REFUSED and told to normalise first — WHICH length is a composer call',
    'exit ' + rRag.code);

  s.objects.forEach(o => {
    if (o.groupId === RAGGED && o.sonifyNote != null) o.endSeconds = +(o.startSeconds + 0.41).toFixed(3);
  });
  fs.writeFileSync(tmpScorePath, JSON.stringify(s, null, 1));

  const built = run([NS, '--score', TMP_SCORE, '--w0', '81', '--w1', '111', '--parts', '0-9',
    '--profile', 'section1', '--id', TWIN, '--bricks', '--bracketsAbove', '--label', 'blast battery fixture']);
  ok(built.code === 0 && fs.existsSync(twinPath), 'a fixture page over 81-111 builds', built.out.slice(-300));

  if (fs.existsSync(twinPath)) {
    // (a) ALL-STACCATO -> VERIFY, not build. Nothing to write, and it says so
    //     only after looking at the laid-out page.
    const v = run([NB, '--score', TMP_SCORE, '--group', RAGGED, '--ir', TWIN, '--apply']);
    const beforeBytes = fs.readFileSync(twinPath, 'utf8');
    ok(v.code === 0 && /NOTHING TO WRITE/.test(v.out),
      'an ALL-STACCATO block writes nothing and verifies instead', 'exit ' + v.code + '\n' + v.out.slice(-500));
    ok(/9\/9 notes draw a notehead; 0 carry a ring bar/.test(v.out),
      'and it PROVES the page: 9/9 heads drawn, 0 ring bars', v.out.slice(-500));
    ok(/parachute brick/.test(v.out), 'each member is reported as an un-figured parachute brick');
    ok(fs.readFileSync(twinPath, 'utf8') === beforeBytes, 'the IR file is untouched by a verify run');

    // (b) MIXED -> the cuivre gets the bar, the staccato is left alone
    const m = run([NB, '--score', TMP_SCORE, '--group', 'grp-s035-846', '--ir', TWIN, '--apply']);
    ok(m.code === 0, 'a MIXED block (1 cuivre + 9 staccato) builds', m.out.slice(-700));
    ok(/the ask, ring: 1\/1 notes carry one ring bar, length 0\.35 s.*uniform/.test(m.out),
      'the one cuivre note gets a 0.35 s bar — the drawn brick');
    ok(/the ask, self-drawing: 9\/9 draw a notehead, 0 carry a bar \(expected 0\), 0 item\(s\) moved/.test(m.out),
      'and the nine staccato notes draw their heads, carry no bar, and DID NOT MOVE', m.out.slice(-700));
    ok(/OUTSIDE the target: added 0 \/ changed 0 \/ removed 0/.test(m.out),
      'CONFINED: nothing outside the mixed block moved');

    // (c) D73 IN THE NEW MATERIAL: the same instruction, two diff shapes.
    //     cuivre already draws a bar at the sample length -> CHANGED.
    //     ord has no ringBar in the registry -> ADDED.
    ok(/ADDED 0 \/ REMOVED 0 \/ CHANGED 1/.test(m.out),
      'D73 again: on cuivre the flag CHANGES an existing bar (sample length -> brick)', m.out.slice(-700));
    const o = run([NB, '--score', TMP_SCORE, '--group', 'grp-s009-817', '--ir', TWIN, '--apply']);
    ok(o.code === 0 && /ADDED 10 \/ REMOVED 0 \/ CHANGED 0/.test(o.out),
      'and on ord the SAME flag ADDS ten — which is why the proof is confinement, not a count',
      o.out.slice(-700));
    ok(/10\/10 notes carry one ring bar, length 2\.172 s.*uniform/.test(o.out),
      'the 81.75 long tone comes out at its 2.172 s brick, uniform');

    // (d) idempotent on a mixed block
    const m2 = run([NB, '--score', TMP_SCORE, '--group', 'grp-s035-846', '--ir', TWIN, '--apply']);
    ok(m2.code === 0 && /ALREADY DONE/.test(m2.out), 'a mixed block is idempotent — re-running is a no-op');
  }

  const p = run([NS, '--prune', TWIN]);
  ok(!fs.existsSync(twinPath), 'the fixture page is pruned', p.out.slice(-200));
  if (fs.existsSync(tmpScorePath)) fs.unlinkSync(tmpScorePath);
  ok(!fs.existsSync(tmpScorePath), 'and the fixture score is removed (never a picker entry)');
}

// ---------------------------------------------------------------------------
// cleanup: the twin is scaffolding, never a page in the picker
if (fs.existsSync(goldenPath)) {
  const p = run([NS, '--prune', GOLDEN_ID]);
  ok(!fs.existsSync(goldenPath), 'the twin page is pruned (no stray picker entry)', p.out.slice(-200));
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'index.json'), 'utf8'));
  ok(!(man.irs || []).some(e => e.id === GOLDEN_ID), 'and its manifest entry is gone');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
