// compiler.js — the time-warp meta-curve compiler (T2 machinery; P2 prototype).
// Compiles a drawn/parametric meta-shape into a part schedule of calibrated swells.
// Every compile returns a MANIFEST of realized values (the calibration instrument:
// verdicts attach to measured numbers). See docs/CURVE_DATABASE.md "The compiler".
//
// Usage (from the composer page):
//   const res = compileMeta(Composer, {
//     T: 20, shape: { model: 'exponential', slope: 0.4 },
//     events: 18, placement: 'even'|'jitter'|'poisson', sigma: 0.15,
//     duration: { max: 8, min: 2 }, release: 0.35,
//     attack: { model: 'exponential', slope: 0.4 },
//     level: { min: 1.0, max: 1.0 },        // fraction of full span at m=0 / m=1
//     align: 'flow'|'convergent',
//     parts: 7, note: 45, technique: 'ord', tag: 'T3'
//   });
//   // curves are created on the loaded score; res.manifest has the numbers.

function compileMeta(C, spec) {
  const T0 = 2;
  const T = spec.T;
  const N = spec.events;
  const parts = spec.parts || 7;
  const R = spec.release != null ? spec.release : 0.35;
  const SEP = 0.05;
  const MIN_ATTACK = 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const level = spec.level || { min: 1, max: 1 };
  const attack = spec.attack || { model: 'exponential', slope: 0.4 };

  // --- meta shape m(x) on x in [0,1], sampled; supports {model,slope} or nodes list ---
  const S = 2000;
  const m = new Array(S + 1);
  if (spec.shape.nodes) {
    const wcLike = { nodes: spec.shape.nodes, segments: spec.shape.segments };
    for (let i = 0; i <= S; i++) m[i] = C.evalWaveCurve(wcLike, i / S);
  } else {
    for (let i = 0; i <= S; i++) m[i] = C.computeYAtT(spec.shape.model, spec.shape.slope || 0, 0, 1, i / S);
  }
  // floor so dead-flat zeros still admit occasional events
  for (let i = 0; i <= S; i++) m[i] = Math.max(1e-4, m[i]);

  // --- cumulative activity Lambda, normalized to [0,1] ---
  const cum = new Array(S + 1);
  cum[0] = 0;
  for (let i = 1; i <= S; i++) cum[i] = cum[i - 1] + (m[i] + m[i - 1]) / 2;
  for (let i = 0; i <= S; i++) cum[i] /= cum[S];
  const invLambda = u => {                    // Lambda-space -> x in [0,1]
    u = Math.max(0, Math.min(1, u));
    let lo = 0, hi = S;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < u) lo = mid; else hi = mid; }
    const span = cum[hi] - cum[lo] || 1e-9;
    return (lo + (u - cum[lo]) / span) / S;
  };

  // --- placement statistic in Lambda-space (the fluidity dial) ---
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  let targets = [];
  if (spec.placement === 'poisson') {
    for (let i = 0; i < N; i++) targets.push(Math.random());
  } else {
    // even slots; jitter displaces each by gauss * sigma slot-widths (sigma = fraction of slot)
    for (let i = 0; i < N; i++) {
      let u = (i + 0.5) / N;
      if (spec.placement === 'jitter') u += gauss() * (spec.sigma || 0) / N;
      targets.push(u);
    }
  }
  targets = targets.map(u => Math.max(0.001, Math.min(0.999, u))).sort((a, b) => a - b);

  // --- peaks in clock time; duration & level laws from local m ---
  const events = [];
  for (const u of targets) {
    const x = invLambda(u);
    const mx = m[Math.round(x * S)];
    const D = spec.duration.max * Math.pow(spec.duration.min / spec.duration.max, mx);
    const peakY = 10 * (level.min + (level.max - level.min) * mx);
    events.push({ peak: T0 + x * T, D, peakY });
  }
  if (spec.align === 'convergent') {
    for (let p = 0; p < parts && events.length - 1 - p >= 0; p++) events[events.length - 1 - p].peak = T0 + T;
  }

  // --- greedy part assignment with collision guard ---
  const lastEnd = new Array(parts).fill(-Infinity);
  let rr = 0, dropped = 0;
  const placed = [];
  for (const ev of events) {
    let chosen = -1;
    for (let k = 0; k < parts; k++) {
      const cand = (rr + k) % parts;
      const availStart = lastEnd[cand] + SEP;
      if (ev.peak - Math.min(ev.D, ev.peak - availStart) >= availStart - 1e-9 &&
          ev.peak - availStart >= MIN_ATTACK) { chosen = cand; break; }
    }
    if (chosen < 0) { dropped++; continue; }
    const start = Math.max(ev.peak - ev.D, lastEnd[chosen] + SEP, 0.1);
    placed.push({ start, peak: ev.peak, end: ev.peak + R, part: chosen, peakY: ev.peakY, attackLen: ev.peak - start });
    lastEnd[chosen] = ev.peak + R;
    rr = (chosen + 1) % parts;
  }

  // --- create curves ---
  placed.forEach((ev, i) => {
    const peakPos = Math.round(((ev.peak - ev.start) / (ev.end - ev.start)) * 1000) / 1000;
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.start * 100) / 100,
      endSeconds: Math.round(ev.end * 100) / 100,
      layer: ev.part,
      nodes: [{ pos: 0, y: 0, smooth: 0.25 }, { pos: peakPos, y: Math.round(ev.peakY * 100) / 100, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }],
      segments: [{ model: attack.model, slope: attack.slope }, { model: 'power', slope: 0 }],
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: `${spec.tag || 'CMP'} e${i + 1}`
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = spec.technique || 'ord';
  });
  C.deselectAll();

  // --- manifest: the calibration instrument ---
  const peaks = placed.map(e => e.peak).sort((a, b) => a - b);
  const gaps = peaks.slice(1).map((p, i) => p - peaks[i]);
  const durs = placed.map(e => e.attackLen);
  const perPart = new Array(parts).fill(0);
  placed.forEach(e => perPart[e.part]++);
  const q = (arr, f) => { const s = arr.slice().sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) * f)] : null; };
  const manifest = {
    requested: N, placed: placed.length, dropped,
    peakGapSec: gaps.length ? { min: +q(gaps, 0).toFixed(2), median: +q(gaps, 0.5).toFixed(2), max: +q(gaps, 1).toFixed(2) } : null,
    attackSec: { min: +q(durs, 0).toFixed(2), median: +q(durs, 0.5).toFixed(2), max: +q(durs, 1).toFixed(2) },
    perPart, span: [+peaks[0]?.toFixed(2), +peaks[peaks.length - 1]?.toFixed(2)]
  };
  return { placed, manifest };
}
