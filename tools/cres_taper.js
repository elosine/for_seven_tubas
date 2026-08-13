// cres_taper.js — cressand-16 (composer 2026-08-13): the MARGIN-SOLVED TAPER.
// Three chains, all built backwards from the pinned 0.44 s min gap:
//   A: step .11  (1.32 -> 0.44)
//   B: 30% shorter span (0.79 -> 0.44)
//   C: 15% shorter than B (0.61 -> 0.44)
// Rises are SOLVED, not chosen: each note gets the longest rise (cap 5 s,
// floor 1.8 s) such that every apex keeps >= 26.5 dB peak-to-bed margin —
// the clarity threshold calibrated from the composer's -15 verdicts.
// Long rises early (headroom), tightening toward the end: the taper.

const fs = require('fs');

const N = 10;
const GAP_MIN = 0.44;
const MARGIN_DB = 26.5, CAP = 5.0, FLOOR = 1.8, SHRINK_STEP = 0.05;
const SLOPE0 = 0.6, SLOPE1 = 0.95;
const LV_APEX = 10, LV_EDGE = 0.3;
const PITCH = 41, COLOR = '#3B7EA1';
const SEQ_GAP = 6;

const gapsFor = step => Array.from({ length: N - 1 }, (_, i) => GAP_MIN + (N - 2 - i) * step);
const span = g => g.reduce((a, b) => a + b, 0);
const stepForSpan = s => (s / (N - 1) - GAP_MIN) * 2 / (N - 2);
const A = gapsFor(0.11);
const B = gapsFor(stepForSpan(span(A) * 0.7));
const C = gapsFor(stepForSpan(span(B) * 0.85));
const D = gapsFor(stepForSpan(span(C) * 0.85));   // -17: 15% shorter again
const Z = gapsFor(stepForSpan(span(A) * 1.15));   // -17: chain 0, other direction
const M1 = gapsFor(stepForSpan(span(Z) * 1.15));  // -17: chain -1, longer still

const slopeAt = k => SLOPE0 + (SLOPE1 - SLOPE0) * (k / (N - 1));
const envDb = (u, slope) => {
  const v = 0.3 + 9.7 * Math.pow(u, 1 + 4 * slope);
  return (v / 10 - 1) * 40;
};

// margins for a rise profile on a gap chain (bed = future notes mid-rise)
function margins(peaks, R) {
  return peaks.map((t, k) => {
    let bedE = 0;
    peaks.forEach((pj, j) => {
      if (j === k) return;
      const start = pj - R[j];
      if (t <= start || t >= pj) return;
      bedE += Math.pow(10, envDb((t - start) / R[j], slopeAt(j)) / 10);
    });
    return bedE ? -10 * Math.log10(bedE) : 99;
  });
}

// solver: start at cap, shrink the biggest bed contributor of the worst apex
function solve(gaps) {
  const peaks = [0];
  gaps.forEach(g => peaks.push(peaks[peaks.length - 1] + g));
  const R = new Array(N).fill(CAP);
  for (let iter = 0; iter < 4000; iter++) {
    const m = margins(peaks, R);
    let worst = -1, worstVal = MARGIN_DB;
    m.forEach((x, k) => { if (x < worstVal) { worstVal = x; worst = k; } });
    if (worst < 0) break;
    // biggest contributor to the worst apex's bed
    let jBig = -1, eBig = -1;
    peaks.forEach((pj, j) => {
      if (j === worst) return;
      const start = pj - R[j];
      const t = peaks[worst];
      if (t <= start || t >= pj) return;
      const e = Math.pow(10, envDb((t - start) / R[j], slopeAt(j)) / 10);
      if (e > eBig) { eBig = e; jBig = j; }
    });
    if (jBig < 0 || R[jBig] <= FLOOR) break;   // can't improve further
    R[jBig] = Math.max(FLOOR, R[jBig] - SHRINK_STEP);
  }
  return { peaks, R, m: margins(peaks, R) };
}

let nid = 1; const objs = []; let cursor = 8;
[['chain-1 (+15% on ch0)', M1, false], ['chain0 (+15% on A)', Z, false],
 ['chainA', A, false], ['chainB', B, false],
 ['chainC', C, true], ['chainD (-15% on C)', D, true]].forEach(([label, gaps, propFirst]) => {
  const { peaks, R, m } = solve(gaps);
  // C & D: first event only PROPORTIONATELY longer than the second (no free cap)
  if (propFirst) R[0] = Math.min(CAP, R[1] * gaps[0] / gaps[1]);
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(cursor - 5.5).toFixed(2),
    label: 'CRESSAND-17 ' + label + ' [' + gaps[0].toFixed(2) + '..' + GAP_MIN + '] taper ' +
      R[0].toFixed(1) + '->' + R[N - 1].toFixed(1) + 's',
    color: COLOR, performanceNotes: '', properties: {} });
  peaks.forEach((p, i) => {
    const pt = p + cursor;
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
      startSeconds: +(pt - R[i]).toFixed(3), endSeconds: +pt.toFixed(3),
      nodes: [{ pos: 0, y: LV_EDGE, smooth: 0.35 }, { pos: 1, y: LV_APEX, smooth: 0.35 }],
      segments: [{ model: 'power', slope: +slopeAt(i).toFixed(2) }],
      color: COLOR, fillMode: 'bottom', opacity: 0.5,
      performanceNotes: label + ' peak ' + (i + 1) + ' rise ' + R[i].toFixed(2), properties: {},
      sonifyNote: PITCH, technique: 'ord', recVel: 112 });
  });
  console.log(label + ': rises', R.map(r => r.toFixed(2)).join(', '));
  console.log('  margins', m.map(x => x >= 99 ? 'inf' : x.toFixed(1)).join(', '));
  cursor += peaks[N - 1] + SEQ_GAP + CAP;
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/cressand-17.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('cressand-17: 6 margin-solved sequences,', (cursor / 60).toFixed(1), 'min');
