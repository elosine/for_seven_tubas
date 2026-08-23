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
if (process.argv.includes('--prove-red')) {
  const f = PF.fit([31.765, 32.026, 32.442, 32.835], { MAX_HEADS: 0.01 });
  ok(f && !f.coherent, 'prove-red: a 0.01-head line makes T8 incoherent');
}
if (fails) { console.error('PATTERN_FIT RED: ' + fails + ' failure(s) of ' + checks); process.exit(1); }
console.log('PATTERN_FIT GREEN: ' + checks + ' checks — calibration cases + unit range + T7 guard + ' + 'validation agreement');
