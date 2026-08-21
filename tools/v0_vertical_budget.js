// v0_vertical_budget.js — V0 evidence: does the REAL piece fit the video
// lane vertically? (8a [A21]; composer's question day 21: what is the
// vertical-stress test actually establishing, and is it necessary?)
// The container fixes the budget: no header -> lane 102.8 px, staff 31.6 px
// (ssPx 7.9) -> 6.5 ss of room from staff middle to the lane edge.
// The material fixes the demand: pitch extremes per part (ledgers), plus
// the fixed text furniture (technique tags above, dynamics below).
// This scans the finished piece and reports worst-case ink extents per
// part — a MEASUREMENT, not an eye test. The composer only faces a
// decision if something does not fit.
const fs = require('fs');
const path = require('path');
const Layout = require('../notation/lib/layout.js');

const ROOT = path.join(__dirname, '..');
const scoreFile = process.argv[2] || 'scores/piece-s25-finished01.json';
const score = JSON.parse(fs.readFileSync(path.join(ROOT, scoreFile), 'utf8'));

// container numbers (container.json video-jury draft)
const LANE = 102.8, SS = 7.9, HALF = LANE / 2 / SS; // 6.51 ss to lane edge
const GAP = 4 / SS;                                  // 0.51 ss of inter-lane gap

// naive sharp spelling, same convention as the extractors
const STEPS = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
function spell(midi) {
  const pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
  return { step: STEPS[pc][0], alter: STEPS[pc][1], octave: oct };
}

// outward ink beyond the notehead center: head half-height 0.5 ss +
// staccato dot reach (1.0–1.5 ss opposite the stem; stems point INWARD
// toward the middle line, so dots are the outward-most note ink)
const NOTE_REACH = 0.5 + 1.5;
const TAG_TOP = 3.5 + 1.3;   // technique text lane + its cap height (layout o.tagY)
const DYN_BOT = 4.6 + 1.3;   // dynamics lane below (layout o.dynY)

const parts = {};
for (const o of score.objects || []) {
  if (o.type !== 'waveCurve' || o.layer == null || o.layer > 9 || o.sonifyNote == null) continue;
  const p = parts[o.layer] || (parts[o.layer] = { min: 999, max: -999, n: 0 });
  p.min = Math.min(p.min, o.sonifyNote); p.max = Math.max(p.max, o.sonifyNote); p.n++;
}

console.log('score: ' + scoreFile);
console.log('budget: lane ' + LANE + 'px, staff 31.6px -> ' + HALF.toFixed(2) + ' ss middle-to-edge; gap +' + GAP.toFixed(2) + ' ss');
console.log('fixed furniture: tech tags top ' + TAG_TOP.toFixed(1) + ' ss, dynamics bottom ' + DYN_BOT.toFixed(1) + ' ss (both inside budget: ' + (TAG_TOP <= HALF && DYN_BOT <= HALF) + ')');
const rows = [];
for (let L = 0; L <= 9; L++) {
  const p = parts[L]; if (!p) continue;
  const yHi = Layout.staffPosBass(spell(p.max)), yLo = Layout.staffPosBass(spell(p.min));
  const top = yHi + NOTE_REACH, bot = -(yLo - NOTE_REACH);
  const worst = Math.max(top, bot, TAG_TOP, DYN_BOT);
  const over = worst - HALF;
  rows.push({
    part: 'T' + (L + 1), notes: p.n,
    lo: p.min + ' (' + spell(p.min).step + (spell(p.min).alter ? '#' : '') + spell(p.min).octave + ', ' + yLo.toFixed(1) + 'ss)',
    hi: p.max + ' (' + spell(p.max).step + (spell(p.max).alter ? '#' : '') + spell(p.max).octave + ', ' + yHi.toFixed(1) + 'ss)',
    inkTopSs: top.toFixed(2), inkBotSs: bot.toFixed(2),
    verdict: over <= 0 ? 'FITS' : (over <= GAP ? 'into gap ' + (over * SS).toFixed(1) + 'px' : 'INTO NEIGHBOR ' + (over * SS).toFixed(1) + 'px'),
  });
}
console.table(rows);
