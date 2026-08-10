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
  const partOrderFor = type => {
    const order = [];
    if (type === 'rexpodec') {
      for (let p = 0; p < rexParts; p++) order.push(p);
      for (let p = rexParts; p < parts; p++) order.push(p);
    } else {
      for (let p = rexParts; p < parts; p++) order.push(p);
      for (let p = 0; p < rexParts; p++) order.push(p);
    }
    return order;
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
      const dens = rec.densityMin + (rec.densityMax - rec.densityMin) * m;
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
  const partOrderFor = type => {
    const order = [];
    if (type === 'rexpodec') {
      for (let p = 0; p < rexParts; p++) order.push(p);
      for (let p = rexParts; p < parts; p++) order.push(p);
    } else {
      for (let p = rexParts; p < parts; p++) order.push(p);
      for (let p = 0; p < rexParts; p++) order.push(p);
    }
    return order;
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
  return { manifest: { shapes: perShape, placed: placed.length, dropped, types: typeCount } };
}
