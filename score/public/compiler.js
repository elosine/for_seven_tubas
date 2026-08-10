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


// ---- compileGrains: static-bed grain clouds (W/Z series; engine v2) ----
// Grain = the AUDIBLE event. Types (Roads vocabulary, breath-scale):
//   rexpodec: slow rise to peak at end + quick release (the crescendo-grain)
//   sine:     symmetric swell, peak mid (hanning-ish; messa di voce)
//   expodec:  near-instant attack, long decay (fp)
// All scheduled by PEAK time (rearticulation = peak arrivals, part-agnostic).
// spec: { T, density (grains/sec), grainMean (audible sec), grainScatter (lognormal
//   sigma, 0=frozen), envelopeMix: {rexpodec,sine,expodec} weights,
//   ratio: 5, ratioRange: [lo,hi]|null, level:{min,max}, levelScatter,
//   release: 0.3, parts, note, technique, tag }
function compileGrains(C, spec) {
  const T0 = 2, T = spec.T, parts = spec.parts || 7;
  const R = spec.release != null ? spec.release : 0.3;
  const SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pick = mix => {
    const entries = Object.entries(mix).filter(e => e[1] > 0);
    let r = Math.random() * entries.reduce((s, e) => s + e[1], 0);
    for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
    return entries[0][0];
  };
  const thetaOf = ratio => { const k = Math.log(ratio); return Math.log((Math.exp(k) + 1) / 2) / k; };

  const N = Math.round(spec.density * T);
  const peaks = [];
  for (let i = 0; i < N; i++) peaks.push(T0 + Math.random() * T);   // homogeneous Poisson bed
  peaks.sort((a, b) => a - b);

  const lastEnd = new Array(parts).fill(-Infinity);
  let dropped = 0;
  const placed = [];
  const typeCount = { rexpodec: 0, sine: 0, expodec: 0 };
  let audibleSum = 0;

  // Reserved lanes: long-preamble grains (rexpodec) starve under greedy assignment —
  // dedicate them a share of parts; cheap grains prefer the rest, spillover allowed.
  const mix = spec.envelopeMix || { rexpodec: 1 };
  const wTot = Object.values(mix).reduce((s, w) => s + w, 0);
  const rexShare = (mix.rexpodec || 0) / (wTot || 1);
  const rexParts = rexShare > 0 ? Math.max(1, Math.round(parts * rexShare * 1.5)) : 0;
  let _rr = 0;   // rotate within each pool so sparse fills spread across all tubas
  const partOrderFor = type => {
    const pool = [], rest = [];
    if (type === 'rexpodec') {
      for (let p = 0; p < rexParts; p++) pool.push(p);
      for (let p = rexParts; p < parts; p++) rest.push(p);
    } else {
      for (let p = rexParts; p < parts; p++) pool.push(p);
      for (let p = 0; p < rexParts; p++) rest.push(p);
    }
    const r = _rr++ % Math.max(1, pool.length);
    return pool.slice(r).concat(pool.slice(0, r)).concat(rest);
  };

  // Pass 1: draw all candidates (type, size, shape, span). Pass 2 assigns in START
  // order — long-preamble grains begin far before their peaks and must claim lanes
  // when their PREAMBLE begins, not when their peak arrives.
  const candidates = [];
  for (const peak of peaks) {
    const type = pick(mix);
    let grain = spec.grainMean * Math.exp((spec.grainScatter || 0) * gauss());
    grain = Math.max(0.4, Math.min(6, grain));
    const ratio = spec.ratioRange
      ? spec.ratioRange[0] * Math.pow(spec.ratioRange[1] / spec.ratioRange[0], Math.random())
      : (spec.ratio || 5);
    const lvBase = spec.level ? spec.level.min + Math.random() * 0 : 1;
    let lv = (spec.level ? spec.level.min + (spec.level.max - spec.level.min) * Math.random() : 1);
    if (spec.levelScatter) lv = Math.max(0.5, Math.min(1, lv + gauss() * spec.levelScatter));
    let start, end, nodes, segments;
    const slope = Math.log(ratio) / 4;
    if (type === 'sine') {
      start = peak - grain / 2; end = peak + grain / 2;
      nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: 0.5, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
      segments = [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 }];
    } else if (type === 'expodec') {
      const atk = Math.max(0.08, grain * 0.08);
      start = peak - atk; end = start + grain;
      const p = Math.round((atk / grain) * 1000) / 1000;
      nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
      segments = [{ model: 'power', slope: 0 }, { model: 'logarithmic', slope: -0.5 }];
    } else {
      const theta = thetaOf(ratio);
      const attack = grain / (1 - theta);            // preamble + grain
      start = peak - attack; end = peak + R;
      const p = Math.round((attack / (attack + R)) * 1000) / 1000;
      nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
      segments = [{ model: 'exponential', slope }, { model: 'power', slope: 0 }];
    }
    if (start < 0.1) { dropped++; continue; }
    candidates.push({ start, end, peak, nodes, segments, type, grain });
  }

  candidates.sort((a, b) => a.start - b.start);
  for (const ev of candidates) {
    let chosen = -1;
    for (const cand of partOrderFor(ev.type)) {
      if (ev.start >= lastEnd[cand] + SEP) { chosen = cand; break; }
    }
    if (chosen < 0) { dropped++; continue; }
    lastEnd[chosen] = ev.end;
    typeCount[ev.type]++;
    audibleSum += ev.grain;
    placed.push(ev);
  }
  placed.sort((a, b) => a.peak - b.peak);

  placed.forEach((ev, i) => {
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.start * 100) / 100, endSeconds: Math.round(ev.end * 100) / 100,
      layer: ev.part, nodes: ev.nodes, segments: ev.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: `${spec.tag || 'W'} ${ev.type[0]}${i + 1}`
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = spec.technique || 'ord';
  });
  C.deselectAll();

  const manifest = {
    requested: N, placed: placed.length, dropped, types: typeCount,
    realizedDensity: +(placed.length / T).toFixed(2),
    audibleOverlap: +(audibleSum / T).toFixed(2),      // expected simultaneous audible grains
  };
  return { placed, manifest };
}


// ---- compileMetaGrains: fill drawn META shapes (layer 7) with grains ----
// The draw-a-fish engine. Reads every META curve in the loaded score; fills the
// tuba lanes so the texture follows the drawn intensity: height drives density +
// grain size + level together (the intensity bundle), placement = inhomogeneous
// Poisson (thinning), envelope mix per the current mass recipe.
function compileMetaGrains(C, spec) {
  spec = spec || {};
  const metas = spec.metas || C.objects.filter(o => o.type === 'waveCurve' && o.layer === 7);
  if (!metas.length) return { error: 'no META curves in this score' };
  const parts = 7, R = spec.release != null ? spec.release : 0.3, SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const rec = {
    densityMin: spec.densityMin != null ? spec.densityMin : 0.25,
    densityMax: spec.densityMax != null ? spec.densityMax : 3.2,
    sizeLo: spec.sizeLo != null ? spec.sizeLo : 2.4,     // grain at m=0 (audible sec)
    sizeHi: spec.sizeHi != null ? spec.sizeHi : 1.4,     // grain at m=1
    sizeScatter: spec.sizeScatter != null ? spec.sizeScatter : 0.35,
    levelMin: spec.levelMin != null ? spec.levelMin : 0.75,
    levelScatter: 0.06,
    mix: spec.mix || { sine: 0.6, expodec: 0.25, rexpodec: 0.15 },
    ratioRange: spec.ratioRange || [2, 6]
  };
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pick = mix => {
    const entries = Object.entries(mix).filter(e => e[1] > 0);
    let r = Math.random() * entries.reduce((s, e) => s + e[1], 0);
    for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
    return entries[0][0];
  };
  const thetaOf = ratio => { const k = Math.log(ratio); return Math.log((Math.exp(k) + 1) / 2) / k; };

  const candidates = [];
  const perShape = [];
  for (const meta of metas) {
    const S = meta.startSeconds, E = meta.endSeconds, span = E - S;
    const N = Math.max(1, Math.round(rec.densityMax * span));
    let accepted = 0;
    for (let i = 0; i < N; i++) {
      const tt = S + Math.random() * span;
      const m = Math.max(0, Math.min(1, C.evalWaveCurve(meta, (tt - S) / span)));
      const dens = spec.densityMap === 'geo'
        ? rec.densityMin * Math.pow(rec.densityMax / rec.densityMin, m)
        : rec.densityMin + (rec.densityMax - rec.densityMin) * m;
      if (Math.random() > dens / rec.densityMax) continue;   // thinning
      accepted++;
      const type = pick(rec.mix);
      let grain = (rec.sizeLo * Math.pow(rec.sizeHi / rec.sizeLo, m)) * Math.exp(rec.sizeScatter * gauss());
      grain = Math.max(0.3, Math.min(6, grain));
      const ratio = rec.ratioRange[0] * Math.pow(rec.ratioRange[1] / rec.ratioRange[0], Math.random());
      let lv = spec.levelFlat != null
        ? spec.levelFlat + gauss() * rec.levelScatter
        : rec.levelMin + (1 - rec.levelMin) * m + gauss() * rec.levelScatter;
      lv = Math.max(0.4, Math.min(1, lv));
      let start, end, nodes, segments;
      const slope = Math.log(ratio) / 4;
      if (type === 'sine') {
        start = tt - grain / 2; end = tt + grain / 2;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: 0.5, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 }];
      } else if (type === 'expodec') {
        const atk = Math.max(0.08, grain * 0.08);
        start = tt - atk; end = start + grain;
        const p = Math.round((atk / grain) * 1000) / 1000;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'power', slope: 0 }, { model: 'logarithmic', slope: -0.5 }];
      } else {
        const theta = thetaOf(ratio);
        const attack = grain / (1 - theta);
        start = tt - attack; end = tt + R;
        const p = Math.round((attack / (attack + R)) * 1000) / 1000;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'exponential', slope: slope }, { model: 'power', slope: 0 }];
      }
      if (start < 0.1) continue;
      candidates.push({ start, end, peak: tt, nodes, segments, type, grain });
    }
    perShape.push({ span: [S, E], candidates: accepted });
  }

  const wTot = Object.values(rec.mix).reduce((s, w) => s + w, 0);
  const rexShare = (rec.mix.rexpodec || 0) / (wTot || 1);
  const rexParts = rexShare > 0 ? Math.max(1, Math.round(parts * rexShare * 1.5)) : 0;
  let _rr = 0;   // rotate within each pool so sparse fills spread across all tubas
  const partOrderFor = type => {
    const pool = [], rest = [];
    if (type === 'rexpodec') {
      for (let p = 0; p < rexParts; p++) pool.push(p);
      for (let p = rexParts; p < parts; p++) rest.push(p);
    } else {
      for (let p = rexParts; p < parts; p++) pool.push(p);
      for (let p = 0; p < rexParts; p++) rest.push(p);
    }
    const r = _rr++ % Math.max(1, pool.length);
    return pool.slice(r).concat(pool.slice(0, r)).concat(rest);
  };
  candidates.sort((a, b) => a.start - b.start);
  const lastEnd = new Array(parts).fill(-Infinity);
  let dropped = 0;
  const placed = [];
  const typeCount = { rexpodec: 0, sine: 0, expodec: 0 };
  for (const ev of candidates) {
    let chosen = -1;
    for (const cand of partOrderFor(ev.type)) {
      if (ev.start >= lastEnd[cand] + SEP) { chosen = cand; break; }
    }
    if (chosen < 0) { dropped++; continue; }
    lastEnd[chosen] = ev.end;
    typeCount[ev.type]++;
    placed.push({ ...ev, part: chosen });
  }
  placed.sort((a, b) => a.peak - b.peak);
  placed.forEach((ev, i) => {
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.start * 100) / 100, endSeconds: Math.round(ev.end * 100) / 100,
      layer: ev.part, nodes: ev.nodes, segments: ev.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: `FILL ${ev.type[0]}${i + 1}`
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = spec.technique || 'ord';
  });
  C.deselectAll();
  const perPart = new Array(parts).fill(0);
  placed.forEach(e => perPart[e.part]++);
  return { manifest: { shapes: perShape, placed: placed.length, dropped, types: typeCount, perPart } };
}


// ---- compileCurveIso: DETERMINISTIC curve realization for parameter isolation ----
// The interpolation contract (composer + AI, 2026-08-10):
//   1. The curve is sampled AT EACH GRAIN'S ONSET (causal: a player starting a swell
//      reads the curve where they start).
//   2. Onsets advance by rate integration: next = current + spacing(curve here) —
//      smooth by construction, zero statistical noise. Noise returns later as a dial.
//   3. mode 'duration': onset spacing FIXED, grain duration follows the curve.
//      mode 'rate':     grain duration FIXED, onset spacing follows the curve
//                       (geometrically: sparse lows, packed highs).
//      mode 'both':     both follow.
// Sine grains only; round-robin parts with busy-skip; level flat.
function compileCurveIso(C, spec) {
  const meta = spec.meta;
  const S = meta.startSeconds, E = meta.endSeconds, span = E - S;
  const parts = 7, SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const durAt = m => spec.durMin + (spec.durMax - spec.durMin) * m;
  const rateAt = m => spec.rateMin * Math.pow(spec.rateMax / spec.rateMin, m);
  const lastEnd = new Array(parts).fill(-Infinity);
  let t = S, i = 0, skipped = 0;
  const placed = [];
  while (t <= E - 0.05) {
    const m = Math.max(0, Math.min(1, C.evalWaveCurve(meta, (t - S) / span)));
    const dur = (spec.mode === 'duration' || spec.mode === 'both') ? durAt(m) : spec.durFixed;
    const spacing = (spec.mode === 'rate' || spec.mode === 'both') ? 1 / rateAt(m) : spec.spacingFixed;
    let part = -1;
    for (let k = 0; k < parts; k++) {
      const cand = (i + k) % parts;
      if (t >= lastEnd[cand] + SEP) { part = cand; break; }
    }
    if (part >= 0) {
      lastEnd[part] = t + dur;
      const lv = spec.levelFlat != null ? spec.levelFlat : 0.9;
      const wc = C.createWaveCurve({
        startSeconds: Math.round(t * 100) / 100, endSeconds: Math.round((t + dur) * 100) / 100,
        layer: part,
        nodes: [{ pos: 0, y: 0, smooth: 0.25 }, { pos: 0.5, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }],
        segments: [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 }],
        color: HUES[part], opacity: 0.3, performanceNotes: `ISO ${spec.mode[0]}${i + 1}`
      });
      wc.sonifyNote = spec.note != null ? spec.note : 45;
      wc.technique = 'ord';
      placed.push({ t: Math.round(t * 100) / 100, dur: Math.round(dur * 100) / 100 });
    } else skipped++;
    t += spacing; i++;
  }
  C.deselectAll();
  const first = placed[0], last = placed[placed.length - 1];
  return { manifest: { placed: placed.length, skipped,
    firstGrain: first, lastGrain: last,
    spacingRange: spec.mode === 'rate' || spec.mode === 'both'
      ? [Math.round(100 / rateAt(1)) / 100, Math.round(100 / rateAt(0)) / 100] : spec.spacingFixed,
    durRange: spec.mode === 'duration' || spec.mode === 'both' ? [spec.durMin, spec.durMax] : spec.durFixed } };
}


// ---- compileStratified: LAW-ENFORCING trajectory renderer ----
// L1 scatter floors baked in (override only via spec.lawOverride, marked in manifest).
// L2 quota windows: the trajectory hands each window an exact budget (fractional
// accumulator); ALL randomness lives inside windows. L3 defaults = keeper stats.
// trajectory: [{dur, from, to}] in onsets/sec (geometric interpolation within legs).
function compileStratified(C, spec) {
  const T0 = spec.t0 != null ? spec.t0 : 2;
  const parts = 7, SEP = 0.05, WIN = spec.window != null ? spec.window : 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const FLOORS = { sizeSigma: 0.35, levelSigma: 0.05, minSpecies: 2 };
  const lawNotes = [];
  let sizeSigma = spec.sizeSigma != null ? spec.sizeSigma : 0.45;
  if (sizeSigma < FLOORS.sizeSigma && !spec.lawOverride) { sizeSigma = FLOORS.sizeSigma; lawNotes.push('sizeSigma clamped to floor'); }
  const mix = spec.mix || { sine: 0.65, expodec: 0.22, rexpodec: 0.13 };
  if (Object.values(mix).filter(w => w > 0).length < FLOORS.minSpecies && !spec.lawOverride) lawNotes.push('WARNING: single-species mix (law-breaking)');
  const levelSigma = Math.max(spec.lawOverride ? 0 : FLOORS.levelSigma, spec.levelSigma != null ? spec.levelSigma : 0.06);
  const levelFlat = spec.levelFlat != null ? spec.levelFlat : 0.9;
  const R = spec.release != null ? spec.release : 0.3;
  const ratioRange = spec.ratioRange || [2, 6];
  const traj = spec.trajectory;
  const total = traj.reduce((s, leg) => s + leg.dur, 0);
  const densAt = tt => {
    let acc = 0;
    for (const leg of traj) {
      if (tt <= acc + leg.dur || leg === traj[traj.length - 1]) {
        const f = Math.max(0, Math.min(1, (tt - acc) / leg.dur));
        return leg.from * Math.pow(leg.to / leg.from, f);
      }
      acc += leg.dur;
    }
    return traj[traj.length - 1].to;
  };
  // grain mean size follows density: sparse -> longer (keeper-anchored)
  const dMax = Math.max(...traj.map(l => Math.max(l.from, l.to)));
  const sizeAt = d => {
    const m = Math.max(0, Math.min(1, d / dMax));
    const lo = spec.sizeSparse != null ? spec.sizeSparse : 1.8;
    const hi = spec.sizeDense != null ? spec.sizeDense : 1.3;
    return lo * Math.pow(hi / lo, m);
  };
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pick = mm => {
    const entries = Object.entries(mm).filter(e => e[1] > 0);
    let r = Math.random() * entries.reduce((s, e) => s + e[1], 0);
    for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
    return entries[0][0];
  };
  const thetaOf = ratio => { const k = Math.log(ratio); return Math.log((Math.exp(k) + 1) / 2) / k; };

  // L2: window budgets with fractional accumulator; stratified-jittered onsets inside
  const candidates = [];
  const windows = [];
  let acc = 0;
  for (let w0 = 0; w0 < total; w0 += WIN) {
    const wLen = Math.min(WIN, total - w0);
    const d = densAt(w0 + wLen / 2);
    acc += d * wLen;
    const n = Math.floor(acc);
    acc -= n;
    windows.push({ at: +(w0.toFixed(2)), budget: n, dens: +(d.toFixed(2)) });
    for (let k = 0; k < n; k++) {
      const slot = wLen / n;
      const tt = T0 + w0 + k * slot + Math.random() * slot;   // stratified jitter
      const dHere = densAt(tt - T0);
      const type = pick(mix);
      let grain = sizeAt(dHere) * Math.exp(sizeSigma * gauss());
      grain = Math.max(0.3, Math.min(6, grain));
      let lv = Math.max(0.4, Math.min(1, levelFlat + gauss() * levelSigma));
      const ratio = ratioRange[0] * Math.pow(ratioRange[1] / ratioRange[0], Math.random());
      let start, end, nodes, segments;
      if (type === 'sine') {
        start = tt - grain / 2; end = tt + grain / 2;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: 0.5, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 }];
      } else if (type === 'expodec') {
        const atk = Math.max(0.08, grain * 0.08);
        start = tt - atk; end = start + grain;
        const p = Math.round((atk / grain) * 1000) / 1000;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'power', slope: 0 }, { model: 'logarithmic', slope: -0.5 }];
      } else {
        const theta = thetaOf(ratio);
        const attack = grain / (1 - theta);
        start = tt - attack; end = tt + R;
        const p = Math.round((attack / (attack + R)) * 1000) / 1000;
        nodes = [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }];
        segments = [{ model: 'exponential', slope: Math.log(ratio) / 4 }, { model: 'power', slope: 0 }];
      }
      if (start < 0.1) continue;
      candidates.push({ start, end, peak: tt, nodes, segments, type, grain });
    }
  }

  const wTot = Object.values(mix).reduce((s, w) => s + w, 0);
  const rexShare = (mix.rexpodec || 0) / (wTot || 1);
  const rexParts = rexShare > 0 ? Math.max(1, Math.round(parts * rexShare * 1.5)) : 0;
  let _rr = 0;
  const partOrderFor = type => {
    const pool = [], rest = [];
    if (type === 'rexpodec') {
      for (let p = 0; p < rexParts; p++) pool.push(p);
      for (let p = rexParts; p < parts; p++) rest.push(p);
    } else {
      for (let p = rexParts; p < parts; p++) pool.push(p);
      for (let p = 0; p < rexParts; p++) rest.push(p);
    }
    const r = _rr++ % Math.max(1, pool.length);
    return pool.slice(r).concat(pool.slice(0, r)).concat(rest);
  };
  candidates.sort((a, b) => a.start - b.start);
  const lastEnd = new Array(parts).fill(-Infinity);
  let dropped = 0;
  const placed = [];
  const typeCount = { rexpodec: 0, sine: 0, expodec: 0 };
  for (const ev of candidates) {
    let chosen = -1;
    for (const cand of partOrderFor(ev.type)) {
      if (ev.start >= lastEnd[cand] + SEP) { chosen = cand; break; }
    }
    if (chosen < 0) { dropped++; continue; }
    lastEnd[chosen] = ev.end;
    typeCount[ev.type]++;
    placed.push({ ...ev, part: chosen });
  }
  placed.sort((a, b) => a.peak - b.peak);
  placed.forEach((ev, i) => {
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.start * 100) / 100, endSeconds: Math.round(ev.end * 100) / 100,
      layer: ev.part, nodes: ev.nodes, segments: ev.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: `STR ${ev.type[0]}${i + 1}`
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = 'ord';
  });
  C.deselectAll();
  const durs = placed.map(e => e.grain).sort((a, b) => a - b);
  const perPart = new Array(parts).fill(0);
  placed.forEach(e => perPart[e.part]++);
  return { manifest: {
    laws: lawNotes.length ? lawNotes : 'clean',
    windows, placed: placed.length, dropped, types: typeCount, perPart,
    grainSpread: durs.length ? [+durs[0].toFixed(2), +durs[Math.floor(durs.length / 2)].toFixed(2), +durs[durs.length - 1].toFixed(2)] : null
  } };
}


// ---- compileSwellCloud: SC-series — the crescendo-cloud with PEAK-CUT scheduling ----
// The composer's species (2026-08-10): swell-and-cut atoms; the peak-cut IS the
// attack (a reversed pizzicato). We schedule ENDING density on a trajectory
// (L2 quota windows, jittered inside per L1); onsets are back-calculated
// (onset = peak - duration). Durations: lognormal spread whose MEAN couples to
// local ending-rate feasibility (dense endings force shorter swells - physics).
// Single-species by composer instruction (SC3 restores shape variety).
function compileSwellCloud(C, spec) {
  const T0 = spec.t0 != null ? spec.t0 : 2;
  const parts = 7, SEP = 0.05, WIN = spec.window != null ? spec.window : 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41'];
  const relRange = spec.releaseRange || [spec.cutRelease != null ? spec.cutRelease : 0.08, spec.cutRelease != null ? spec.cutRelease : 0.08];
  const sizeSigma = spec.sizeSigma != null ? spec.sizeSigma : 0.35;
  const levelFlat = spec.levelFlat != null ? spec.levelFlat : 0.9;
  const levelSigma = 0.06;
  const ratioRange = spec.ratioRange || [2, 4];
  let total, rateAt;
  if (spec.gaussian) {
    // smooth star-cloud bell: rate(t) = rMin + (rMax-rMin)*exp(-(t-T/2)^2 / 2sigma^2)
    const g = spec.gaussian;
    total = g.T;
    rateAt = tt => g.rMin + (g.rMax - g.rMin) * Math.exp(-Math.pow(tt - g.T / 2, 2) / (2 * g.sigma * g.sigma));
  } else {
    const traj = spec.trajectory;
    total = traj.reduce((s, l) => s + l.dur, 0);
    rateAt = tt => {
      let acc = 0;
      for (const leg of traj) {
        if (tt <= acc + leg.dur || leg === traj[traj.length - 1]) {
          const f = Math.max(0, Math.min(1, (tt - acc) / leg.dur));
          return leg.from * Math.pow(leg.to / leg.from, f);
        }
        acc += leg.dur;
      }
      return traj[traj.length - 1].to;
    };
  }
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const candidates = [];
  const windows = [];
  let acc = 0;
  for (let w0 = 0; w0 < total; w0 += WIN) {
    const wLen = Math.min(WIN, total - w0);
    const rate = rateAt(w0 + wLen / 2);
    acc += rate * wLen;
    const n = Math.floor(acc);
    acc -= n;
    windows.push({ at: +(w0.toFixed(1)), budget: n, rate: +rate.toFixed(2) });
    for (let k = 0; k < n; k++) {
      const slot = wLen / n;
      const peak = spec.uniformWindows
        ? T0 + w0 + Math.random() * wLen                        // max randomness given quota
        : T0 + w0 + k * slot + Math.random() * slot;            // stratified jitter
      const localRate = rateAt(peak - T0);
      // feasibility-coupled mean: dense endings force shorter swells
      const mean = Math.min(spec.sizeBase != null ? spec.sizeBase : 1.8, 0.8 * parts / localRate);
      let D = mean * Math.exp(sizeSigma * gauss());
      const dc = spec.durClamp || [0.4, 3];
      D = Math.max(dc[0], Math.min(dc[1], D));
      const lv = Math.max(0.5, Math.min(1, levelFlat + gauss() * levelSigma));
      const ratio = ratioRange[0] * Math.pow(ratioRange[1] / ratioRange[0], Math.random());
      const Rr = relRange[0] + Math.random() * (relRange[1] - relRange[0]);   // releases vary too (L1)
      const start = peak - D, end = peak + Rr;
      if (start < 0.1) continue;
      const p = Math.round((D / (D + Rr)) * 1000) / 1000;
      candidates.push({
        start, end, peak, grain: D,
        nodes: [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: 10 * lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }],
        segments: [{ model: 'exponential', slope: Math.log(ratio) / 4 }, { model: 'power', slope: 0 }],
        type: 'swellcut'
      });
    }
  }
  candidates.sort((a, b) => a.start - b.start);
  const lastEnd = new Array(parts).fill(-Infinity);
  let _rr = 0, dropped = 0;
  const placed = [];
  for (const ev of candidates) {
    let chosen = -1;
    for (let k = 0; k < parts; k++) {
      const cand = (_rr + k) % parts;
      if (ev.start >= lastEnd[cand] + SEP) { chosen = cand; break; }
    }
    if (chosen < 0) { dropped++; continue; }
    _rr = (chosen + 1) % parts;
    lastEnd[chosen] = ev.end;
    placed.push({ ...ev, part: chosen });
  }
  placed.sort((a, b) => a.peak - b.peak);
  placed.forEach((ev, i) => {
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.start * 100) / 100, endSeconds: Math.round(ev.end * 100) / 100,
      layer: ev.part, nodes: ev.nodes, segments: ev.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: `SC e${i + 1}`
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = 'ord';
  });
  C.deselectAll();
  const durs = placed.map(e => e.grain).sort((a, b) => a - b);
  const perPart = new Array(parts).fill(0);
  placed.forEach(e => perPart[e.part]++);
  return { manifest: {
    note: 'single-species (swell-cut) by composer instruction — SC3 restores variety',
    windows, placed: placed.length, dropped, perPart,
    durSpread: durs.length ? [+durs[0].toFixed(2), +durs[Math.floor(durs.length / 2)].toFixed(2), +durs[durs.length - 1].toFixed(2)] : null
  } };
}
