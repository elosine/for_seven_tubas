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

// ── 8 · the COLLAPSE pass (day 31) ───────────────────────────────────────────
// The second golden: CLOUD02-D 42.0–48.5 s as it stood BEFORE the process ran on
// it. At 45.45 s all ten parts drop from the D4/E4 register into E2–F#3 inside
// 80 ms, so the greedy pass — which only accepts a home where the note comes out
// FREE — correctly places none of them. The joint re-seating takes the worst leap
// from 57 % short (T6 D4→E2, 22 st in 136 ms) to 20 %.
console.log('\n8 · the collapse pass: a gesture where nobody is free');
const cd = P.noteEvents(JSON.parse(fs.readFileSync(
  path.join(ROOT, 'tools', 'fixtures', 'cloud02d-collapse.json'), 'utf8')).objects);
const worstOf = fl => fl.length ? Math.max(...fl.map(x => (x.need - x.attack) / x.need)) : 0;
{
  eq('  120 notes', cd.length, 120);
  eq('  18 flags before, none hard', P.flags(cd).filter(x => x.tier !== 'hard').length, 18);

  const off = P.redistribute(cd, { collapse: false });
  eq('  greedy alone leaves 9', off.unresolved.length, 9);
  eq('  greedy alone leaves a 57% leap', Math.round(worstOf(off.unresolved) * 100), 57);

  const on = P.redistribute(cd);
  const g = (on.collapses || []).find(c => c.applied);
  ok('  the collapse pass finds exactly one gesture to re-seat',
    (on.collapses || []).filter(c => c.applied).length === 1,
    'applied: ' + (on.collapses || []).filter(c => c.applied).map(c => c.at.toFixed(2)).join(','));
  eq('  it is the 45.45 s drop', g && +g.at.toFixed(2), 45.45);
  eq('  all ten parts are in it', g && g.parts, 10);
  eq('  worst leap 57% before', Math.round(g.worstBefore * 100), 57);
  eq('  worst leap 20% after', Math.round(g.worstAfter * 100), 20);
  eq('  the archive floor: 20%', Math.round(worstOf(on.unresolved) * 100), 20);

  // THE TRADE, asserted so it cannot regress silently: minimax lowers the worst
  // and may RAISE the count. The composer chose this on day 31 ("take the floor").
  ok('  it lowers the worst and may raise the count — the trade, on purpose',
    worstOf(on.unresolved) < worstOf(off.unresolved) && on.unresolved.length >= off.unresolved.length,
    off.unresolved.length + ' -> ' + on.unresolved.length + ' flags');
  eq('  no hard pair is created', on.unresolved.filter(x => x.tier === 'hard').length, 0);

  // the same contract the greedy pass is held to
  const by = new Map(cd.map(n => [n.id, n]));
  const tampered = [];
  let moved = 0;
  for (const n of on.notes) {
    const o = by.get(n.id);
    if (!o) { tampered.push(n.id + ' is not in the input'); continue; }
    if (n.layer !== o.layer) moved++;
    for (const k of ['startSeconds', 'endSeconds', 'sonifyNote', 'recVel', 'technique', 'groupId']) {
      if (n[k] !== o[k]) tampered.push(n.id + '.' + k);
    }
  }
  eq('  no note added or removed', on.notes.length, cd.length);
  ok('  re-seating changes nothing but layer', tampered.length === 0, tampered.slice(0, 5).join('; '));
  eq('  every reported move really moved', moved, new Set(on.moves.map(m => m.id)).size);

  // a re-seat is a PERMUTATION: the gesture's parts keep their note counts
  const count = (set, lo, hi) => {
    const c = new Array(P.PARTS).fill(0);
    for (const n of set) if (n.startSeconds >= lo && n.startSeconds <= hi) c[n.layer]++;
    return c.join(',');
  };
  eq('  the gesture is a permutation — every part keeps its note count',
    count(on.notes, g.span[0], g.span[1]), count(cd, g.span[0], g.span[1]));

  const a = P.redistribute(cd).moves.map(m => m.id + '>' + m.to).join(',');
  const b = P.redistribute(cd).moves.map(m => m.id + '>' + m.to).join(',');
  ok('  deterministic', a === b);
}

// ── 9 · the collapse pass keeps out of the way ───────────────────────────────
console.log('\n9 · the collapse pass does not fire where the greedy pass already wins');
{
  const r2 = P.redistribute(notes);   // CLOUD02-I: greedy clears it to 0
  eq('  CLOUD02-I still clears to 0', r2.unresolved.length, 0);
  eq('  and no gesture was re-seated', (r2.collapses || []).filter(c => c.applied).length, 0);
  ok('  no collapse moves in the golden case', !r2.moves.some(m => m.which === 'collapse'));
}

// ── 10 · minimaxAssign is a minimax, not a min-sum ───────────────────────────
// Built by hand so the right answer is not in question. Min-SUM would take the
// diagonal (0 + 0 + 9 = 9, worst 9); minimax must refuse the 9 and take a
// seating whose worst is 3 even though its total is larger.
console.log('\n10 · minimaxAssign flattens the worst, it does not minimise the total');
{
  const m = [[0, 3, 2], [0, 3, 2], [9, 3, 2]];
  const best = P.minimaxAssign(m);
  const chosen = best.perm.map((j, i) => m[i][j]);
  eq('  worst is 3, not 9', Math.max(...chosen), 3);
  ok('  it is a permutation', new Set(best.perm).size === 3, JSON.stringify(best.perm));
  const blocked = P.minimaxAssign([[Infinity, Infinity], [Infinity, Infinity]]);
  eq('  no seating at all returns null', blocked, null);
  const tie = P.minimaxAssign([[0, 0], [0, 0]]);
  eq('  equal seatings prefer nobody moving', tie.moves, 0);
}

// ── 11 · the same-slot rule bars a seating outright (day 31) ─────────────────
// Learned by having --apply refused: two notes under 30 ms apart in ONE part
// cannot be written, because extraction cannot give them the same grid slot.
// That is invisible to pairTier() — a 20 ms gap is merely 'soft' to it — so the
// bar has to live in seatCost, and it has to be Infinity, not a big number.
console.log('\n11 · the same-slot rule is a bar, not a penalty');
{
  const at = (t, midi) => ({ id: 'x' + t, startSeconds: t, endSeconds: t + 0.005, sonifyNote: midi, layer: 0 });
  const n = at(1.000, 60);
  eq('  a 20 ms neighbour before is barred', P.seatCost(at(0.980, 60), n, null), Infinity);
  eq('  a 20 ms neighbour after is barred', P.seatCost(null, n, at(1.020, 60)), Infinity);
  ok('  a 200 ms neighbour is merely scored', isFinite(P.seatCost(at(0.800, 60), n, null)));
  ok('  pairTier alone would have called the 20 ms one soft, not impossible',
    P.pairTier(at(0.980, 60), n) === 'soft');
  ok('  and minimaxAssign refuses to seat into a bar',
    P.minimaxAssign([[Infinity, 0.5], [0.5, Infinity]]).perm.join() === '1,0');
}

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'ALL ' + pass + ' PASS'));
process.exit(fail ? 1 : 0);
