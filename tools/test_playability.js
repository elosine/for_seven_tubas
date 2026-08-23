#!/usr/bin/env node
// test_playability.js — guards notation/lib/playability.js and the regressions
// that day 25 paid for.
//
//   node tools/test_playability.js
//
// The golden case is CLOUD02-I as it stood BEFORE the playability process ran on
// it: tools/fixtures/cloud02i-preamend.json, 159 notes, 13 tight pairs, 0 hard.
// It lives in fixtures/ and NOT in scores/ for a reason learned the hard way the
// same day: `cloud02i_ab.js --isolate` rewrites scores/cloud02i-orig.json from
// the CURRENT archive, so the moment the archive was amended that file stopped
// being the "before" and silently became the "after". A fixture must not be
// derived from something the tools rewrite.

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'notation', 'lib', 'playability.js'));

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '\n          ' + detail : '')); }
};
const eq = (name, got, want) => ok(name, got === want, 'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));

// ── 1 · the browser engine is the authority ──────────────────────────────────
// composer.html's Composer.CONFLICT is what tints the composer's screen while
// they work. If this module drifts from it, the tool and the screen disagree and
// nobody finds out. So: read the numbers out of the HTML and compare.
console.log('\n1 · constants match Composer.CONFLICT in composer.html');
{
  const html = fs.readFileSync(path.join(ROOT, 'score', 'public', 'composer.html'), 'utf8');
  const block = html.slice(html.indexOf('CONFLICT: {'), html.indexOf('CONFLICT: {') + 400);
  const read = key => {
    const m = block.match(new RegExp(key + ':\\s*([0-9.]+)'));
    return m ? parseFloat(m[1]) : null;
  };
  for (const key of ['tongueReset', 'minAttack', 'perSemitone', 'maxLeapAdd']) {
    eq('  ' + key, P.CONFLICT[key], read(key));
  }
}

// ── 2 · the golden case ──────────────────────────────────────────────────────
console.log('\n2 · CLOUD02-I before the playability process (the golden case)');
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'fixtures', 'cloud02i-preamend.json'), 'utf8'));
const notes = P.noteEvents(fixture.objects);
const before = P.flags(notes);

eq('  159 notes', notes.length, 159);
eq('  13 flags before', before.length, 13);
eq('  0 of them hard', before.filter(f => f.tier === 'hard').length, 0);

const r = P.redistribute(notes);
eq('  0 flags after redistribution', r.unresolved.length, 0);
ok('  at least one move', r.moves.length > 0, 'moves: ' + r.moves.length);

// The exact move LIST is an implementation detail (a different but equally valid
// set reaches 0 flags), so it is not asserted. What must hold is the contract.
console.log('\n3 · the contract: redistribution changes nothing but `layer`');
{
  const by = new Map(notes.map(n => [n.id, n]));
  eq('  no note added or removed', r.notes.length, notes.length);
  let moved = 0, tampered = [];
  for (const n of r.notes) {
    const o = by.get(n.id);
    if (!o) { tampered.push(n.id + ' is not in the input'); continue; }
    if (n.layer !== o.layer) moved++;
    for (const k of ['startSeconds', 'endSeconds', 'sonifyNote', 'recVel', 'technique', 'groupId']) {
      if (n[k] !== o[k]) tampered.push(n.id + '.' + k + ': ' + o[k] + ' -> ' + n[k]);
    }
  }
  ok('  time, pitch, velocity, technique, group untouched', tampered.length === 0, tampered.slice(0, 5).join('; '));
  eq('  every reported move really moved', moved, new Set(r.moves.map(m => m.id)).size);
}

// ── 4 · the two-pass rule ────────────────────────────────────────────────────
// Day 25: at the section's tail every part was busy and two pairs had no home for
// their SECOND note, while the first note of each had several. Without the
// first-note pass those two are left unresolved. This asserts the pass is load-
// bearing on this material, not decorative.
console.log('\n4 · the first-note pass is load-bearing (day 25)');
{
  const secondOnly = (function () {
    // the module with the first-note fallback disabled, by construction:
    // redistribute() only ever tries the first note when homeFor(second) fails,
    // so we emulate "second only" by re-running and counting what it reports.
    const work = notes.map(n => ({ ...n }));
    const givenUp = [];
    for (let g = 0; g < 200; g++) {
      const f = P.flags(work).find(x => !givenUp.includes(x.b.id));
      if (!f) break;
      const per = new Array(P.PARTS).fill(0);
      for (const k of work) per[k.layer]++;
      let best = null;
      for (let Q = 0; Q < P.PARTS; Q++) {
        if (Q === f.b.layer) continue;
        const p = work.filter(k => k.layer === Q && k.id !== f.b.id).sort((x, y) => x.startSeconds - y.startSeconds);
        const prev = p.filter(k => k.startSeconds <= f.b.startSeconds).pop();
        const next = p.find(k => k.startSeconds > f.b.startSeconds);
        if (prev && P.pairTier(prev, f.b) !== 'free') continue;
        if (next && P.pairTier(f.b, next) !== 'free') continue;
        const score = per[Q] * 100;
        if (!best || score < best.score) best = { part: Q, score };
      }
      if (!best) { givenUp.push(f.b.id); continue; }
      f.b.layer = best.part;
    }
    return P.flags(work).length;
  })();
  ok('  second-note pass alone leaves flags; both passes clear them',
    secondOnly > 0 && r.unresolved.length === 0,
    'second-only left ' + secondOnly + ', two-pass left ' + r.unresolved.length);
  ok('  the module used the first-note pass at least once',
    r.moves.some(m => m.which === 'first'),
    'passes used: ' + [...new Set(r.moves.map(m => m.which))].join(','));
}

// ── 5 · determinism ──────────────────────────────────────────────────────────
console.log('\n5 · determinism');
{
  const a = P.redistribute(notes).moves.map(m => m.id + '>' + m.to).join(',');
  const b = P.redistribute(notes).moves.map(m => m.id + '>' + m.to).join(',');
  ok('  same input, same moves', a === b);
}

// ── 6 · the gap-fill floor regressions (two real bugs, day 25) ───────────────
// 1. the tie-break was folded into a running best-so-far and could LOWER the
//    tracked room below the true maximum, so the floor test fired against a
//    drifted value and the fill stopped early (the 25 ms fill added NOTHING
//    while seven notes with 25–30 ms of room were still on the table);
// 2. the tie tolerance could admit a note BELOW the floor, so the 30 ms fill
//    came out with a 27 ms gap and 2 fused attacks.
// Guarded on the built artefacts: each floor must be honoured exactly.
console.log('\n6 · gap-fill floors are honoured (regression: cloud02i_ab.js, day 25)');
for (const [file, floorMs] of [['cloud02i-b3', 30], ['cloud02i-b4', 25], ['cloud02i-b5', 20]]) {
  const f = path.join(ROOT, 'scores', file + '.json');
  if (!fs.existsSync(f)) { console.log('  SKIP  ' + file + ' not built'); continue; }
  const n = P.noteEvents(JSON.parse(fs.readFileSync(f, 'utf8')).objects);
  const t = n.map(x => x.startSeconds).sort((a, b) => a - b);
  let min = Infinity;
  for (let i = 1; i < t.length; i++) min = Math.min(min, t[i] - t[i - 1]);
  ok('  ' + file + ' min attack gap >= ' + floorMs + ' ms',
    Math.round(min * 1000) >= floorMs, 'got ' + Math.round(min * 1000) + ' ms');
}

// ── 7 · breath + audibility report shape ─────────────────────────────────────
console.log('\n7 · breath and audibility report');
{
  const b = P.breathRuns(notes);
  eq('  one row per part', b.length, P.PARTS);
  ok('  every part inside the dials on this material', b.every(x => !x.n || (x.okCatch && x.okFull)),
    b.filter(x => x.n && (!x.okCatch || !x.okFull)).map(x => 'T' + (x.part + 1)).join(','));
  const a = P.audibility(notes, P.staccatoLengths(ROOT));
  ok('  audibility flags the fusion this section is known for', a.fused > 100,
    'fused ' + a.fused + ' of ' + (a.notes - 1));
  ok('  sounding count well past the mass boundary', a.soundingMax > 15, 'max ' + a.soundingMax);
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'ALL ' + pass + ' PASS'));
process.exit(fail ? 1 : 0);
