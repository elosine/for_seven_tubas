#!/usr/bin/env node
// test_pattern_fit.js — the D63 analyser against the composer's own verdicts.
// The calibration cases are the composer's eye; the agreement count is the
// day-24 validation. If either moves, the rule moved.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const PF = require(path.join(ROOT, 'notation', 'lib', 'pattern_fit.js'));
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.error('  FAIL ' + m); } };

// --- calibration: T8 31.76 reads coherent (composer), plain 16ths, under a head
{
  const f = PF.fit([31.765, 32.026, 32.442, 32.835]);
  ok(f && f.coherent && f.tupletBeats === 0, 'T8 31.76: coherent, no tuplet');
  ok(f && f.heads < 0.5, 'T8 31.76: well under a head (' + (f && f.heads.toFixed(2)) + ')');
  ok(f && f.grid.join(',') === '0,2,5,8', 'T8 31.76: the composer\'s grid 0,2,5,8 (' + (f && f.grid.join(',')) + ')');
}
// --- calibration: T1's last four as FOUR EVEN 16ths is dissonant (2.1 heads) — the analyser must not choose it
{
  const t = [33.930, 34.130, 34.265, 34.509];
  const f = PF.fit(t);
  const even = f && f.grid.join(',') === '0,1,2,3';
  ok(!even, 'T1 last four: never written as four even 16ths');
  // and the displacement of the even writing is over 2 heads (the composer's "dissonance")
  const u = 0.172, d = Math.max(...t.map((x, i) => Math.abs((t[0] + i * u) - x)));
  ok(d / 0.030 > 2, 'T1 last four as even 16ths displaces a note by ' + (d / 0.030).toFixed(1) + ' heads (> 2)');
}
// --- the played head is a 16th at a playable tempo: unit range
ok(PF.DEFAULTS.UMIN >= 0.12 && PF.DEFAULTS.UMAX <= 0.4, 'unit range keeps the 16th a real 16th (125-375 ms)');
// --- T7's last three: NOT a tuplet (the 24 ms tell) — plain 16ths 0,1,3
{
  const f = PF.fit([45.654, 45.844, 46.213]);
  ok(f && f.tupletBeats === 0 && f.grid.join(',') === '0,1,3', 'T7 last three: plain 0,1,3, no tuplet (' + (f && f.grid.join(',')) + ')');
}
// --- validation agreement against the decided figures
{
  const out = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'pattern_analyze.js'), '--ir', 'db1-all-x01', '--validate'], { cwd: ROOT }).toString();
  const m = out.match(/(\d+) of (\d+) agree outright/);
  ok(m && +m[1] >= 23, 'validation: >= 23 of the decided figures reproduced (' + (m ? m[1] + '/' + m[2] : '?') + ')');
  // the two known, understood disagreements — if a NEW one appears, say so
  const differs = [...out.matchAll(/^(cl-\d+)\s.*DIFFERS/gm)].map(x => x[1]);
  const known = new Set(['cl-1', 'cl-25']);
  const unexpected = differs.filter(c => !known.has(c));
  ok(unexpected.length === 0, 'validation: no NEW disagreements (' + (unexpected.join(',') || 'none') + ')');
}

// =====================================================================
// 8g — SEGMENTATION. T1 36.22-39.61 is the golden: the gesture the composer
// read by hand on day 26, the one that made 8g exist.
// =====================================================================
const T1 = [36.218, 36.457, 36.701, 36.857, 37.017, 37.364, 37.652, 37.956,
  38.198, 38.340, 38.614, 38.775, 38.933, 39.090, 39.355, 39.610];
{
  const s = PF.segment(T1);
  ok(!!s, '8g T1: the gesture segments');
  // THE COMPOSER'S DAY-26 READING was cuts after notes 5, 8, 11, 14, with note
  // 11 called a near-tie. The tool finds 5, 8 and 14, flags 11, and makes one
  // cut the composer did not (after note 3) — which removes the quintuplet from
  // their figure 1 entirely. See the long note at the top of pattern_fit.js.
  // Asserting the WHOLE set, so any drift in either direction is caught.
  ok(s.cuts.join(',') === '3,5,8,10,14', '8g T1: cuts 3,5,8,10,14 (' + s.cuts.join(',') + ')');
  for (const b of [5, 8, 14]) ok(s.cuts.indexOf(b) >= 0, "8g T1: keeps the composer's cut after note " + b);
  ok(s.nearTies.some(t => t.afterNote === 11), '8g T1: note 11 flagged as a near-tie — the boundary the composer flagged too');
  // every figure trivially readable: no tuplet anywhere, nothing near the line
  ok(s.figures.every(f => f.fit && f.fit.tupletBeats === 0), '8g T1: no figure needs a tuplet');
  ok(s.figures.every(f => f.fit && f.fit.heads < 0.5), '8g T1: no figure past half a head (worst ' +
    Math.max.apply(null, s.figures.map(f => f.fit.heads)).toFixed(2) + ')');
  // and the whole point: the figures beat the one grid the tool used before 8g
  ok(s.single && s.single.tupletBeats >= 3, '8g T1: the ONE-grid reading needs 3+ tuplet beats (' + (s.single && s.single.tupletBeats) + ')');
  ok(s.total < s.singleCost, '8g T1: the figures cost less than the one grid (' + s.total + ' vs ' + s.singleCost + ')');
  // STABILITY. The weights are a model, not a measurement; the reading must not
  // hinge on the third decimal of CUT_COST.
  ok(PF.segment(T1, { CUT_COST: 0.4 }).cuts.join(',') === s.cuts.join(',') &&
    PF.segment(T1, { CUT_COST: 0.6 }).cuts.join(',') === s.cuts.join(','), '8g T1: same reading at CUT_COST +/-20%');
}
// --- NO SHATTER, and it is STRUCTURAL. An even run has no pace change in it,
// so it has no legal cut at all — no weight can shatter it into pairs.
for (const n of [3, 4, 6, 8, 12]) {
  const even = Array.from({ length: n }, (_, i) => +(i * 0.158).toFixed(3));
  const s = PF.segment(even);
  ok(s.figures.length === 1, '8g: ' + n + ' even 16ths stay ONE figure (' + s.figures.length + ')');
  ok(s.allowedCuts.length === 0, '8g: ' + n + ' even 16ths offer no legal cut at all');
  ok(PF.segment(even, { CUT_COST: 0.01 }).figures.length === 1, '8g: ' + n + ' even 16ths survive a near-zero CUT_COST');
}
// --- THE WORDS ARE THE COMPOSER'S. 239|244|156|160 is what they looked at and
// called "long long short short"; the quintuplet writing implies 1.6|1.6|0.8|1.0
// and would have said something else. The words come from the SPACING.
ok(PF.words([0.239, 0.244, 0.156, 0.160]) === 'long long short short',
  '8g words: 239|244|156|160 reads "long long short short" (' + PF.words([0.239, 0.244, 0.156, 0.160]) + ')');
ok(PF.words([0.288, 0.304]) === 'even even', '8g words: two near-equal gaps read "even even"');
ok(PF.words([0.142, 0.274]) === 'short long', '8g words: 142|274 reads "short long"');
ok(PF.words([0.255]) === 'pair', '8g words: a lone gap is a "pair"');
// --- fit() IS UNTOUCHED (8g rule): segment() must not have changed it.
ok(PF.fit([31.765, 32.026, 32.442, 32.835]).grid.join(',') === '0,2,5,8', '8g: fit() unchanged by segmentation');

if (process.argv.includes('--prove-red')) {
  const f = PF.fit([31.765, 32.026, 32.442, 32.835], { MAX_HEADS: 0.01 });
  ok(f && !f.coherent, 'prove-red: a 0.01-head line makes T8 incoherent');
  // and the segmenter: with pace bands wide enough to swallow every gap, T1 has
  // no pace change anywhere and must come out as ONE figure
  ok(PF.segment(T1, { PACE_RATIO: 99 }).figures.length === 1, 'prove-red: one pace band makes T1 a single figure');
}
if (fails) { console.error('PATTERN_FIT RED: ' + fails + ' failure(s) of ' + checks); process.exit(1); }
console.log('PATTERN_FIT GREEN: ' + checks + ' checks — calibration + unit range + T7 guard + validation agreement + 8g segmentation (T1 golden, no-shatter, words)');
