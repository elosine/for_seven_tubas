// cres_ref.js — THE FAMILY (composer 2026-08-13):
//  scores/cressand-family.json — the REFERENCE file: seven margin-solved
//   chains, longest to shortest (-2, -1, 0, A, B, C, D), unison F2.
//   Pins: min gap 0.44 built backwards; 26.5 dB clarity margin; rise cap 5 /
//   floor 1.8; true-cliff; percussive slopes; C & D first events proportional.
//  scores/cressand-pitches.json — the same seven chains, each in a different
//   pitch strategy:
//   -2: 4-note low cluster F2 down (38-41), random
//   -1: 12-note cluster up from F2 (41-52), random
//    0: four fifths stacked on A1 (33,40,47,54,61), random
//    A: Messiaen mode 3 on F, pooled 30-65, random
//    B: 11-pc tone row, ORDERED, octaves spread over the full range
//    C: Messiaen mode 7 on F, pooled 30-65, random
//    D: Raga Bhairav on F (12-TET approx: S r G M P d N), random
//      (true shruti intonation would need pitch-bend support — not built yet)

const fs = require('fs');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const N = 10;
const GAP_MIN = 0.44;
const MARGIN_DB = 26.5, CAP = 5.0, FLOOR = 1.8, SHRINK_STEP = 0.05;
const SLOPE0 = 0.6, SLOPE1 = 0.95;
const LV_APEX = 10, LV_EDGE = 0.3;
const COLOR = '#3B7EA1';
const SEQ_GAP = 6;
const LO = 30, HI = 65;

const gapsFor = step => Array.from({ length: N - 1 }, (_, i) => GAP_MIN + (N - 2 - i) * step);
const span = g => g.reduce((a, b) => a + b, 0);
const stepForSpan = s => (s / (N - 1) - GAP_MIN) * 2 / (N - 2);
const A = gapsFor(0.11);
const B = gapsFor(stepForSpan(span(A) * 0.7));
const C = gapsFor(stepForSpan(span(B) * 0.85));
const D = gapsFor(stepForSpan(span(C) * 0.85));
const Z = gapsFor(stepForSpan(span(A) * 1.15));
const M1 = gapsFor(stepForSpan(span(Z) * 1.15));
const M2 = gapsFor(stepForSpan(span(M1) * 1.15));   // one more to the left

const slopeAt = k => SLOPE0 + (SLOPE1 - SLOPE0) * (k / (N - 1));
const envDb = (u, slope) => ((0.3 + 9.7 * Math.pow(u, 1 + 4 * slope)) / 10 - 1) * 40;

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

function solve(gaps) {
  const peaks = [0];
  gaps.forEach(g => peaks.push(peaks[peaks.length - 1] + g));
  const R = new Array(N).fill(CAP);
  for (let iter = 0; iter < 4000; iter++) {
    const m = margins(peaks, R);
    let worst = -1, worstVal = MARGIN_DB;
    m.forEach((x, k) => { if (x < worstVal) { worstVal = x; worst = k; } });
    if (worst < 0) break;
    let jBig = -1, eBig = -1;
    peaks.forEach((pj, j) => {
      if (j === worst) return;
      const start = pj - R[j], t = peaks[worst];
      if (t <= start || t >= pj) return;
      const e = Math.pow(10, envDb((t - start) / R[j], slopeAt(j)) / 10);
      if (e > eBig) { eBig = e; jBig = j; }
    });
    if (jBig < 0 || R[jBig] <= FLOOR) break;
    R[jBig] = Math.max(FLOOR, R[jBig] - SHRINK_STEP);
  }
  return { peaks, R };
}

const CHAINS = [
  ['chain-2', M2, false], ['chain-1', M1, false], ['chain0', Z, false],
  ['chainA', A, false], ['chainB', B, false], ['chainC', C, true], ['chainD', D, true],
];

// ---- pitch strategies ----
const rand = mulberry32(20260827);
const pcsPool = pcs => { const out = []; for (let p = LO; p <= HI; p++) if (pcs.includes(p % 12)) out.push(p); return out; };
const onF = ivs => ivs.map(x => (x + 5) % 12);
const pickerNoRepeat = set => { let last = null; return () => {
  let p; do { p = set[Math.floor(rand() * set.length)]; } while (set.length > 1 && p === last);
  last = p; return p; }; };
// 11-pc tone row, octaves spread over the full range
const rowGen = () => {
  const pcs = [...Array(12).keys()];
  for (let i = pcs.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pcs[i], pcs[j]] = [pcs[j], pcs[i]]; }
  const row = pcs.slice(0, 11);
  const placed = row.map((pc, i) => {
    const target = LO + (HI - LO) * ((i * 7) % 11) / 10;   // scattered targets
    let best = null, bd = 1e9;
    for (let p = LO; p <= HI; p++) if (p % 12 === pc) { const d = Math.abs(p - target); if (d < bd) { bd = d; best = p; } }
    return best;
  });
  let k = 0; return () => placed[k++ % placed.length];
};
const STRATEGIES = {
  'chain-2': ['low cluster F2 down (38-41)', pickerNoRepeat([38, 39, 40, 41])],
  'chain-1': ['cluster up from F2 (41-52)', pickerNoRepeat(Array.from({ length: 12 }, (_, i) => 41 + i))],
  'chain0': ['4 fifths on A1 (33..61)', pickerNoRepeat([33, 40, 47, 54, 61])],
  'chainA': ['Messiaen m3 (F)', pickerNoRepeat(pcsPool(onF([0, 2, 3, 4, 6, 7, 8, 10, 11])))],
  'chainB': ['11-pc tone row, full range', rowGen()],
  'chainC': ['Messiaen m7 (F)', pickerNoRepeat(pcsPool(onF([0, 1, 2, 3, 5, 6, 7, 8, 10, 11])))],
  'chainD': ['Raga Bhairav (F, 12-TET)', pickerNoRepeat(pcsPool(onF([0, 1, 4, 5, 7, 8, 11])))],
};

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
const shell = (objs, nid) => ({ version: 1, layoutVersion: 2, tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid });

function render(fileTag, pitchFor) {
  let nid = 1; const objs = []; let cursor = 8;
  CHAINS.forEach(([label, gaps, propFirst]) => {
    const { peaks, R } = solve(gaps);
    if (propFirst) R[0] = Math.min(CAP, R[1] * gaps[0] / gaps[1]);
    const strat = pitchFor(label);
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(cursor - 5.5).toFixed(2),
      label: fileTag + ' ' + label + ' [' + gaps[0].toFixed(2) + '..' + GAP_MIN + ']' +
        (strat.name ? ' · ' + strat.name : ''),
      color: COLOR, performanceNotes: '', properties: {} });
    peaks.forEach((p, i) => {
      const pt = p + cursor;
      objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: i % 10,
        startSeconds: +(pt - R[i]).toFixed(3), endSeconds: +pt.toFixed(3),
        nodes: [{ pos: 0, y: LV_EDGE, smooth: 0.35 }, { pos: 1, y: LV_APEX, smooth: 0.35 }],
        segments: [{ model: 'power', slope: +slopeAt(i).toFixed(2) }],
        color: COLOR, fillMode: 'bottom', opacity: 0.5,
        performanceNotes: label + ' peak ' + (i + 1) + ' rise ' + R[i].toFixed(2), properties: {},
        sonifyNote: strat.pick(), technique: 'ord', recVel: 112 });
    });
    cursor += peaks[N - 1] + SEQ_GAP + CAP;
  });
  return { objs, nid, mins: (cursor / 60).toFixed(1) };
}

// reference: unison F2
const ref = render('FAMILY', () => ({ name: 'F2', pick: () => 41 }));
fs.writeFileSync('scores/cressand-family.json', JSON.stringify(shell(ref.objs, ref.nid)));
console.log('cressand-family (REFERENCE): 7 chains,', ref.mins, 'min, unison F2');

// pitch strategies
const pit = render('PITCH', label => {
  const [name, pick] = STRATEGIES[label];
  return { name, pick };
});
fs.writeFileSync('scores/cressand-pitches.json', JSON.stringify(shell(pit.objs, pit.nid)));
console.log('cressand-pitches: 7 chains,', pit.mins, 'min');
Object.entries(STRATEGIES).forEach(([c, [name]]) => console.log(' ', c + ':', name));
