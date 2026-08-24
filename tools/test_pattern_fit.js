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
// 8g/8h — SEGMENTATION. T1 36.22-39.61 is the golden: the gesture the composer
// read by hand on day 26, the one that made 8g exist — and read again BY EAR on
// day 28, which is what the golden now asserts.
// =====================================================================
const T1 = [36.218, 36.457, 36.701, 36.857, 37.017, 37.364, 37.652, 37.956,
  38.198, 38.340, 38.614, 38.775, 38.933, 39.090, 39.355, 39.610];
{
  const s = PF.segment(T1);
  ok(!!s, '8g T1: the gesture segments');
  // THE COMPOSER'S VERDICT, day 28, by ear: [1,2]+[3,4,5] · [6,7]+[8,9,10] ·
  // [11-14] · [15,16] = cuts after 2, 5, 7, 10, 14. The day-27 rule gave
  // 3,5,8,10,14 — two boundaries one note late, both from testing a seam
  // against the gap BEFORE it only. Two-sided legality (8h, D68) makes the
  // LEGAL set exactly these five and the DP takes all of them.
  // Asserting the WHOLE set, so any drift in either direction is caught.
  ok(s.cuts.join(',') === '2,5,7,10,14', '8h T1: cuts 2,5,7,10,14 — the composer\'s reading (' + s.cuts.join(',') + ')');
  ok(s.allowedCuts.join(',') === '2,5,7,10,14', '8h T1: those five are the only LEGAL seams (' + s.allowedCuts.join(',') + ')');
  for (const b of [5, 10, 14]) ok(s.cuts.indexOf(b) >= 0, "8g T1: keeps the composer's cut after note " + b);
  // THE RATIO TIE, in place of the day-27 near-tie on note 11 (which is no
  // longer even a legal boundary). 7-vs-8 hangs on the pace threshold itself:
  // the 304 ms gap joins the 239 ms band at 1.272, and the seam moves.
  {
    const t = s.ratioTies.find(x => x.afterNote === 7);
    ok(!!t, '8h T1: the cut after 7 is flagged as a RATIO TIE');
    ok(t && Math.abs(t.ratio - 1.272) < 0.005, '8h T1: it flips at pace ratio 1.272 (' + (t && t.ratio) + ')');
    ok(t && t.because && t.because.slowMs === 304 && t.because.quickMs === 239,
      '8h T1: because 304 ms joins the 239 ms band (' + (t && t.because && (t.because.slowMs + '/' + t.because.quickMs)) + ')');
    const wide = PF.segment(T1, { PACE_RATIO: 1.31 });
    ok(wide.cuts.indexOf(8) >= 0 && wide.cuts.indexOf(7) < 0,
      '8h T1: at pace ratio 1.31 the seam is after 8, not 7 (' + wide.cuts.join(',') + ')');
  }
  // every figure trivially readable: no tuplet anywhere, nothing near the line.
  // RE-MEASURED under the two-sided rule (day 28) — the day-27 claim survives.
  ok(s.figures.every(f => f.fit && f.fit.tupletBeats === 0), '8g T1: no figure needs a tuplet — ' +
    s.figures.map(f => f.fit.tupletBeats).join('/'));
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
// --- 8h: NO CLEAN SEAM. T7 @36.19 of CLOUD02-I — gaps 378 323 130 292 367.
// Every slow gap has a slower neighbour, so the only pace changes are joins;
// the rule finds nowhere to cut and SAYS SO rather than inventing a seam.
{
  const rel = [0, 0.378, 0.701, 0.831, 1.123, 1.490];
  const s = PF.segment(rel);
  ok(s && s.allowedCuts.length === 0, '8h T7 @36.19: no legal seam at all (' + (s && s.allowedCuts.join(',')) + ')');
  ok(s && s.noSeam === true, '8h T7 @36.19: flagged noSeam — by ear, not by rule');
  ok(s && s.figures.length === 1, '8h T7 @36.19: still returns the gesture as one figure');
  // and the distinction that makes the flag worth having: an even run also has
  // no legal cut, but there is nothing wrong with reading it as one figure
  ok(PF.segment([0, 0.158, 0.316, 0.474]).noSeam === false, '8h: an even run has no seam and no COMPLAINT (noSeam false)');
}
// --- 8h: CUTS BY HAND. The composer names the seams; legality steps aside and
// each figure is still fitted alone. "Say the boundary and it moves."
{
  const h = PF.segment(T1, { CUTS: [2, 5, 7, 10, 14] });
  ok(h && h.byHand === true, '8h --cuts: byHand is set');
  ok(h && h.cuts.join(',') === '2,5,7,10,14', '8h --cuts: the hand reading comes back exactly (' + (h && h.cuts.join(',')) + ')');
  ok(h && h.figures.length === 6 && h.figures.every(f => f.fit), '8h --cuts: six figures, each with its own fit');
  // legality is overridden, not consulted: the day-27 set builds too
  const old = PF.segment(T1, { CUTS: [3, 5, 8, 10, 14] });
  ok(old && old.cuts.join(',') === '3,5,8,10,14', '8h --cuts: an ILLEGAL set is still built when asked (' + (old && old.cuts.join(',')) + ')');
  // a cut that isolates a note is refused — a figure is a pattern
  ok(PF.segment(T1, { CUTS: [1] }) === null, '8h --cuts 1: refused (it would leave a one-note figure)');
  ok(/one-note|1 note/.test(PF.cutsReason(16, [1], 2) || ''), '8h --cuts 1: and the reason says why (' + PF.cutsReason(16, [1], 2) + ')');
  ok(PF.cutsReason(16, [2, 5, 7, 10, 14], 2) === null, '8h --cuts: a legal-shaped set has no complaint');
  ok(PF.cutsReason(16, [16], 2) !== null, '8h --cuts 16: past the end is refused');
}
// --- 8h part B: FLOW. Two adjacent figures at 2:1 or 3:2 could share ONE grid.
// A REPORT ONLY — nothing is built from it. T1's figures 1+2 are the case the
// composer raised: 239 ms against 158 ms is 3:2, and on one grid it is
// 16th 16th + a 3:2 bracket, well inside a head.
{
  const s = PF.segment(T1);
  const fl = PF.flow(s.figures[0], s.figures[1]);
  ok(fl && fl.fits && fl.target === '3:2', '8h flow: T1 figures 1+2 stand at 3:2 (' + (fl && fl.ratio) + ')');
  ok(fl && fl.unitMs === 239, '8h flow: on the SLOW figure\'s unit, 239 ms (' + (fl && fl.unitMs) + ')');
  ok(fl && fl.heads < 0.5, '8h flow: worst ' + (fl && fl.worstMs) + ' ms = ' + (fl && fl.heads.toFixed(2)) + ' heads — inside a head');
  ok(fl && /3:2 \[/.test(fl.shape), '8h flow: the quick figure is written as a 3:2 bracket (' + (fl && fl.shape) + ')');
  // 4:3 is not the composer's vocabulary — only 2:1 and 3:2 are offered
  const no = PF.flow({ onsets: [0, 0.4], fit: { unit: 0.4, grid: [0, 1] } }, { onsets: [1, 1.3], fit: { unit: 0.3, grid: [0, 1] } });
  ok(no && no.fits === false, '8h flow: 4:3 is not offered (only 2:1 and 3:2)');
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

// =====================================================================
// 8i — BRACKETS vs GROUPS (D69, "the bracket is the message"). 8h decides
// WHERE the seams are; fit() decides which BEATS carry a tuplet. Nothing makes
// the two line up, and where they do not a bracket says "quicker" about half of
// one group and half of the next. That is a STRADDLE, and it is flagged.
// =====================================================================
{
  const s = PF.segment(T1);
  const b = PF.bracketsVsGroups(s.single, s.cuts);
  ok(!!b, '8i T1: bracketsVsGroups returns a reading');
  // THE COMPOSER'S PAGE (t1-hybrid2, approved day 28): ONE grid at 125 ms with
  // three brackets — 7:4, 6:4, 7:4. This is the golden for the whole of 8i.
  ok(s.single && Math.round(s.single.unit * 1000) === 125, '8i T1: the one grid is a 125 ms 16th (' + (s.single && Math.round(s.single.unit * 1000)) + ')');
  ok(b && b.brackets.map(x => x.text).join(' ') === '7:4 6:4 7:4',
    '8i T1: three brackets, 7:4 6:4 7:4 (' + (b && b.brackets.map(x => x.text).join(' ')) + ')');
  ok(b && b.brackets.map(x => x.notes.join('-')).join(' ') === '3-5 6-7 12-14',
    '8i T1: they cover notes 3-5, 6-7, 12-14 (' + (b && b.brackets.map(x => x.notes.join('-')).join(' ')) + ')');
  // and against the groups: two cover a group exactly, one covers part of one
  // (note 11 sits in the plain beat before the septuplet), three are plain
  ok(b && b.groups.map(g => g.from + '-' + g.to).join(' ') === '1-2 3-5 6-7 8-10 11-14 15-16',
    '8i T1: six groups, the composer’s (' + (b && b.groups.map(g => g.from + '-' + g.to).join(' ')) + ')');
  ok(b && b.groups.filter(g => g.plain).map(g => g.group).join(',') === '1,4,6',
    '8i T1: groups 1, 4 and 6 are plain 16ths (' + (b && b.groups.filter(g => g.plain).map(g => g.group).join(',')) + ')');
  ok(b && b.groups[1].brackets[0].covers === 'exact' && b.groups[2].brackets[0].covers === 'exact',
    '8i T1: the 7:4 and the 6:4 cover groups 2 and 3 exactly');
  ok(b && b.groups[4].brackets[0].covers === 'part',
    '8i T1: the second 7:4 covers PART of group 5 — note 11 is in the plain beat before it (' + (b && b.groups[4].brackets[0].covers) + ')');
  // THE CLAIM THAT MATTERS: on T1 the fit's beats and the composer's seams see
  // the same quick runs, because a seam IS a pace change. So no bracket leaves
  // its group, and the page the composer approved is legal under D69.
  ok(b && b.straddles.length === 0, '8i T1: NO bracket straddles a seam (' + (b && b.straddles.length) + ')');
}
// --- 8i: a straddle IS detected. Pure function, so the case is constructed:
// a triplet on beat 1 covers notes 3-5, and the seam falls after note 4.
{
  const single = { grid: [0, 1, 4, 5.333, 6.667, 8], beats: [{ beat: 0, tuplet: null }, { beat: 1, tuplet: 3 }, { beat: 2, tuplet: null }] };
  const b = PF.bracketsVsGroups(single, [4]);
  ok(b && b.straddles.length === 1, '8i straddle: a bracket across a seam is caught (' + (b && b.straddles.length) + ')');
  ok(b && b.straddles[0].seamAfter === 4 && b.straddles[0].notes.join('-') === '3-5',
    '8i straddle: it names the seam (after 4) and the notes (3-5)');
  ok(b && b.straddles[0].text === '3:2', '8i straddle: and the bracket it is (' + (b && b.straddles[0].text) + ')');
  ok(b && b.groups[0].brackets[0].covers === 'straddle' && b.groups[1].brackets[0].covers === 'straddle',
    '8i straddle: both groups report the bracket as leaving them');
  // and the negative: move the seam to the beat line and the same notes are clean
  ok(PF.bracketsVsGroups(single, [2]).straddles.length === 0, '8i straddle: a seam ON the beat line straddles nothing');
}
// --- 8i: the SCAN is the pre-read measurement. Its two numbers on CLOUD02-I are
// the day-28 record: every gesture fits ONE grid inside a head, and five of them
// carry a bracket that crosses a seam (design call A(a) — the watch item is real).
{
  const out = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'pattern_analyze.js'), '--ir', 'db1', '--scan', '36.19-40.42'], { cwd: ROOT }).toString();
  const w = out.match(/one grid WITHIN a head: (\d+)\s+·\s+OVER a head: (\d+)/);
  ok(w && w[1] === '15' && w[2] === '0', '8i scan: CLOUD02-I is 15 gestures within a head, 0 over (' + (w ? w[1] + '/' + w[2] : '?') + ')');
  const st = out.match(/brackets straddling a seam: (\d+)/);
  ok(st && st[1] === '5', '8i scan: five gestures carry a straddling bracket (' + (st ? st[1] : '?') + ')');
  ok(/T7\s+36\.19.*no clean seam/.test(out), '8i scan: T7 @36.19 still reports no clean seam');
}
// --- 8i: --ownGrids is the ALTERNATIVE, and segment() is what it is built from.
// The per-figure reading is unchanged by 8i — every 8g/8h assertion above still
// describes what --ownGrids writes; only the DEFAULT moved to one grid.
{
  const s = PF.segment(T1);
  ok(s.figures.length === 6 && s.figures.every(f => f.fit && f.fit.coherent !== false),
    '8i --ownGrids: the six per-figure fits are untouched by 8i');
  ok(Math.max.apply(null, s.figures.map(f => f.fit.heads)) < 0.4,
    '8i --ownGrids: and still nothing past 0.4 heads (' + Math.max.apply(null, s.figures.map(f => f.fit.heads)).toFixed(2) + ')');
}

// --- day 29: NOTHING WITHIN A HEAD -> displacement decides (found under --plain).
// T2's second gesture with tuplets off: no plain grid is within a head, and the
// least-bad one must be the one NEAREST THE SPACING (1.2 heads, rests between the
// 16ths), not the rest-free grid of eight even 16ths at 3.8 heads that the old
// order preferred ("no rests" ranked above "close to the spacing").
{
  const T2b = [38.599, 38.756, 38.971, 39.199, 39.629, 39.848, 40.140, 40.326];
  const f = PF.fit(T2b, { TUPLETS: [] });
  ok(f && f.coherent === false, '--plain T2 @38.60: no plain 16th grid is within a head');
  ok(f && f.heads < 1.3 && f.heads > 1.0, '--plain T2 @38.60: the least-bad plain grid is ~1.2 heads (' + (f && f.heads.toFixed(2)) + '), not 3.8');
  ok(f && f.tupletBeats === 0, '--plain: and it carries no tuplet');
  const even = PF.fit(T2b, { TUPLETS: [], UMIN: 0.238, UMAX: 0.238 });
  ok(even && even.heads > 3, 'the rest-free grid at 238 ms is 3.8 heads (' + (even && even.heads.toFixed(1)) + ') — what the old order chose');
  // coherent readings are sorted as before: T8's plain reading still wins
  const t8 = PF.fit([31.765, 32.026, 32.442, 32.835]);
  ok(t8 && t8.coherent && t8.tupletBeats === 0, 'coherent order unchanged: T8 31.76 is still plain and coherent');
}

if (process.argv.includes('--prove-red')) {
  const f = PF.fit([31.765, 32.026, 32.442, 32.835], { MAX_HEADS: 0.01 });
  ok(f && !f.coherent, 'prove-red: a 0.01-head line makes T8 incoherent');
  // and the segmenter: with pace bands wide enough to swallow every gap, T1 has
  // no pace change anywhere and must come out as ONE figure
  ok(PF.segment(T1, { PACE_RATIO: 99 }).figures.length === 1, 'prove-red: one pace band makes T1 a single figure');
  // and the straddle detector: cut T1 mid-septuplet and it must complain
  ok(PF.bracketsVsGroups(PF.segment(T1).single, [2, 4, 7, 10, 14]).straddles.length > 0, 'prove-red: a seam inside the 7:4 is a straddle');
}
if (fails) { console.error('PATTERN_FIT RED: ' + fails + ' failure(s) of ' + checks); process.exit(1); }
console.log('PATTERN_FIT GREEN: ' + checks + ' checks — calibration + unit range + T7 guard + validation agreement + 8g segmentation (T1 golden, no-shatter, words) + 8h seams (two-sided legality, ratio tie, no-clean-seam, cuts by hand, flow) + 8i brackets vs groups (T1 golden 7:4 6:4 7:4, straddle detection, the CLOUD02-I scan) + day-29 --plain fallback (displacement first when nothing is within a head)');
