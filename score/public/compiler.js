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

// ========== CURTIS ROADS GRAIN-ENVELOPE CATALOG (Microsound ch. 3) ==========
// Every classic grain envelope as a waveCurve recipe, PEAK-ANCHORED: given the
// perceptually salient moment (the peak), each recipe reports how many seconds
// it needs before (pre) and after (post) so engines can schedule the peak and
// back-calculate the span — the swell-cloud scheduling model generalized.
//   grainEnvelope(shape, { dur, lv, ratio, release })
//     dur     total sounding length (s)             lv      0..1 amplitude
//     ratio   end:start growth (exponential shapes) release cut-tail length (s)
// Shapes: 'sine' (Hanning bell) · 'gaussian' · 'quasi-gaussian' (Tukey flat-top)
//   · 'triangle' · 'trapezoid' (linear ASR) · 'expodec' · 'surge' (= rexpodec,
//   our classic crescendo-cut — name proposed to composer) · 'sinc' (main lobe
//   + faint echo lobe; playable approximation of the side-lobe shape).
const GRAIN_ENV_SHAPES = ['sine', 'gaussian', 'quasi-gaussian', 'triangle',
  'trapezoid', 'expodec', 'surge', 'sinc'];

function grainEnvelope(shape, o) {
  const dur = o.dur, lv = o.lv != null ? o.lv : 0.9;
  const ratio = o.ratio || 4, R = o.release != null ? o.release : 0.06;
  const Y = 10 * lv, sm = 0.25;
  const n = (pos, y) => ({ pos: Math.round(pos * 1000) / 1000, y: Math.round(y * 100) / 100, smooth: sm });
  switch (shape) {
    case 'sine':            // raised cosine / Hanning — messa di voce
      return { pre: dur / 2, post: dur / 2,
        nodes: [n(0, 0), n(0.5, Y), n(1, 0)],
        segments: [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 }] };
    case 'gaussian':        // concentrated peak, long quiet tails
      return { pre: dur / 2, post: dur / 2,
        nodes: [n(0, 0), n(0.5, Y), n(1, 0)],
        segments: [{ model: 'sigmoid', slope: 0.95 }, { model: 'sigmoid', slope: 0.95 }] };
    case 'quasi-gaussian':  // Tukey flat-top: smooth up, held apex, smooth down
      return { pre: dur / 2, post: dur / 2, peakPos: 0.5,
        nodes: [n(0, 0), n(0.3, Y), n(0.7, Y), n(1, 0)],
        segments: [{ model: 'sigmoid', slope: 0.7 }, { model: 'power', slope: 0 }, { model: 'sigmoid', slope: 0.7 }] };
    case 'triangle':        // line-segment bell
      return { pre: dur / 2, post: dur / 2,
        nodes: [n(0, 0), n(0.5, Y), n(1, 0)],
        segments: [{ model: 'power', slope: 0 }, { model: 'power', slope: 0 }] };
    case 'trapezoid': {     // linear attack-sustain-release
      return { pre: dur * 0.15, post: dur * 0.85, peakPos: 0.15,
        nodes: [n(0, 0), n(0.15, Y), n(0.85, Y), n(1, 0)],
        segments: [{ model: 'power', slope: 0 }, { model: 'power', slope: 0 }, { model: 'power', slope: 0 }] };
    }
    case 'expodec': {       // sharp attack, exponential decay
      const atk = Math.max(0.08, dur * 0.08), p = atk / dur;
      return { pre: atk, post: dur - atk, peakPos: p,
        nodes: [n(0, 0), n(p, Y), n(1, 0)],
        segments: [{ model: 'power', slope: 0 }, { model: 'logarithmic', slope: -0.5 }] };
    }
    case 'surge': {         // rexpodec: exponential swell -> peak-cut (the attack)
      const p = dur / (dur + R);
      return { pre: dur, post: R, peakPos: p,
        nodes: [n(0, 0), n(p, Y), n(1, 0)],
        segments: [{ model: 'exponential', slope: Math.log(ratio) / 4 }, { model: 'power', slope: 0 }] };
    }
    case 'sinc': {          // main lobe + one faint echo lobe
      return { pre: dur * 0.42, post: dur * 0.58, peakPos: 0.42,
        nodes: [n(0, 0), n(0.42, Y), n(0.62, 0.2), n(0.78, Y * 0.25), n(1, 0)],
        segments: [{ model: 'sigmoid', slope: 0.6 }, { model: 'sigmoid', slope: 0.6 },
                   { model: 'sigmoid', slope: 0.5 }, { model: 'sigmoid', slope: 0.5 }] };
    }
    default: throw new Error('unknown grain envelope: ' + shape);
  }
}

// Audition score: every catalog shape at three durations, sequential on one part,
// labeled via performanceNotes. compileEnvCatalog(Composer, { note, part, level }).
function compileEnvCatalog(C, spec) {
  spec = spec || {};
  const note = spec.note != null ? spec.note : 45;
  const part = spec.part != null ? spec.part : 0;
  const lv = spec.level != null ? spec.level : 0.9;
  const DURS = spec.durs || [0.8, 1.5, 2.5];
  const GAP = spec.gap != null ? spec.gap : 1.2;
  let t = 2;
  const placed = [];
  for (const shape of GRAIN_ENV_SHAPES) {
    for (const dur of DURS) {
      const env = grainEnvelope(shape, { dur, lv, ratio: 4, release: 0.06 });
      const start = t, end = t + env.pre + env.post;
      const wc = C.createWaveCurve({
        startSeconds: Math.round(start * 100) / 100, endSeconds: Math.round(end * 100) / 100,
        layer: part, nodes: env.nodes, segments: env.segments,
        color: '#1565C0', opacity: 0.35,
        performanceNotes: `${shape} ${dur}s`
      });
      wc.sonifyNote = note;
      wc.technique = 'ord';
      placed.push({ shape, dur, start: +start.toFixed(2) });
      t = end + GAP;
    }
  }
  C.deselectAll();
  return { manifest: { shapes: GRAIN_ENV_SHAPES.length, exemplars: placed.length, totalLen: +t.toFixed(1), placed } };
}

// ========== LADDER-BATTERY GENERATOR (ENGINE_FRAMEWORK.md §3) ==========
// One dial × k steps × ONE frozen seed → k saved scores named `${name}-L1..Lk`
// plus a ladder sheet (rung → value → key manifest numbers). The realization is
// identical across rungs except where the dial acts — informed A/B by design.
//
//   await generateLadder(Composer, {
//     name: 'lad-maxdur', engine: 'onset', base: { ...oc1 spec... },
//     dial: 'maxDur',                  // named dial or {path:'durModel.maxDur', mode:'mul'}
//     factors: [0.64, 0.8, 1, 1.25, 1.56],   // mul dials (default, ×1.25 ladder)
//     // values: [...]                 // or absolute values
//     seed: 12345                      // optional; auto-generated once, shared by all rungs
//   });
//
// Named dials — onset engine: apexRate (scales EVERY trajectory rate, keeps the
// shape), maxDur, shortBand, pShort (additive), release, ratio, reArtic, window,
// longRate, longDur. Swell engine: rate (=apexRate), sizeBase, sizeSigma (add),
// durClamp, release, ratio, window. Anything else: {path, mode}.
const LADDER_DIALS = {
  apexRate: { path: 'trajectory', mode: 'traj' }, rate: { path: 'trajectory', mode: 'traj' },
  maxDur: { path: 'durModel.maxDur', mode: 'mul' },
  shortBand: { path: 'durModel.shortBand', mode: 'mul' },
  pShort: { path: 'durModel.pShort', mode: 'add' },
  release: { path: 'releaseRange', mode: 'mul' },
  ratio: { path: 'ratioRange', mode: 'mul' },
  reArtic: { path: 'reArtic', mode: 'mul' },
  window: { path: 'window', mode: 'mul' },
  longRate: { path: 'longStream.rate', mode: 'mul' },
  longDur: { path: 'longStream.durRange', mode: 'mul' },
  sizeBase: { path: 'sizeBase', mode: 'mul' },
  sizeSigma: { path: 'sizeSigma', mode: 'add' },
  durClamp: { path: 'durClamp', mode: 'mul' },
};

function ladderGetSet(obj, path) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  const k = keys[keys.length - 1];
  return { get: () => o[k], set: v => { o[k] = v; } };
}

function ladderApply(spec, dial, factorOrDelta, absValue) {
  const d = typeof dial === 'string' ? LADDER_DIALS[dial] : dial;
  if (!d) throw new Error('unknown ladder dial: ' + dial);
  if (d.mode === 'traj') {   // scale every rate in the trajectory, preserving shape
    spec.trajectory.forEach(leg => { leg.from *= factorOrDelta; leg.to *= factorOrDelta; });
    return +(Math.max(...spec.trajectory.map(l => Math.max(l.from, l.to)))).toFixed(2);
  }
  const { get, set } = ladderGetSet(spec, d.path);
  const cur = get();
  let next;
  if (absValue != null) next = absValue;
  else if (Array.isArray(cur)) next = cur.map(x => d.mode === 'add' ? +(x + factorOrDelta).toFixed(3) : +(x * factorOrDelta).toFixed(3));
  else next = d.mode === 'add' ? +(cur + factorOrDelta).toFixed(3) : +(cur * factorOrDelta).toFixed(3);
  set(next);
  return next;
}

async function generateLadder(C, opts) {
  const engine = opts.engine === 'swell' ? compileSwellCloud : compileOnsetCloud;
  const seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 4294967296);
  const steps = opts.values ? opts.values : (opts.factors || [0.64, 0.8, 1, 1.25, 1.56]);
  const sheet = [];
  for (let i = 0; i < steps.length; i++) {
    const spec = JSON.parse(JSON.stringify(opts.base));
    spec.seed = seed;
    spec.tag = (opts.base.tag || 'LAD') + '-L' + (i + 1);
    const value = ladderApply(spec, opts.dial, opts.values ? null : steps[i], opts.values ? steps[i] : null);
    C.objects = []; C.markers = []; C.nextId = 1;
    C.selectedObject = null; C.selectedObjects = [];
    const res = engine(C, spec);
    if (C.renderAll) C.renderAll();
    const scoreName = opts.name + '-L' + (i + 1);
    if (C.sessionNameInput) { C.sessionNameInput.value = scoreName; await C.saveSession(false); }
    const m = res.manifest;
    sheet.push({
      rung: 'L' + (i + 1), score: scoreName,
      dialValue: value, step: steps[i],
      placed: m.placed, apexOnsets: m.apexRealized ? m.apexRealized.onsetsPerSec : null,
      truncApex: m.truncation ? m.truncation.apex : null,
      occApex: m.occupancy ? m.occupancy.apex : null,
      apexDurs: m.apexRealized ? m.apexRealized.durHist : null,
    });
  }
  return { seed, dial: opts.dial, name: opts.name, sheet };
}

// Deterministic RNG (mulberry32). Every engine render is seeded: pass spec.seed
// to reproduce a realization EXACTLY, or omit it and read the auto-seed back from
// the manifest. This is the informed-A/B backbone (ENGINE_FRAMEWORK.md): change
// ONE dial with the SAME seed and the two renders differ only where the dial acts.
function makeRand(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function compileMeta(C, spec) {
  const T0 = 2;
  const T = spec.T;
  const N = spec.events;
  const parts = spec.parts || 10;
  const R = spec.release != null ? spec.release : 0.35;
  const SEP = 0.05;
  const MIN_ATTACK = 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
  const T0 = 2, T = spec.T, parts = spec.parts || 10;
  const R = spec.release != null ? spec.release : 0.3;
  const SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
  const metas = spec.metas || C.objects.filter(o => o.type === 'waveCurve' && o.layer === 10);
  if (!metas.length) return { error: 'no META curves in this score' };
  const parts = spec.parts || 10, R = spec.release != null ? spec.release : 0.3, SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
  const parts = spec.parts || 10, SEP = 0.05;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
  const parts = spec.parts || 10, SEP = 0.05, WIN = spec.window != null ? spec.window : 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
  const seed = spec.seed != null ? (spec.seed >>> 0) : Math.floor(Math.random() * 4294967296);
  const rand = makeRand(seed);
  const T0 = spec.t0 != null ? spec.t0 : 2;
  const parts = spec.parts || 10, SEP = 0.05, WIN = spec.window != null ? spec.window : 0.5;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
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
    while (u === 0) u = rand();
    while (v === 0) v = rand();
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
        ? T0 + w0 + rand() * wLen                        // max randomness given quota
        : T0 + w0 + k * slot + rand() * slot;            // stratified jitter
      const localRate = rateAt(peak - T0);
      // feasibility-coupled mean: dense endings force shorter swells
      const mean = Math.min(spec.sizeBase != null ? spec.sizeBase : 1.8, 0.8 * parts / localRate);
      let D = mean * Math.exp(sizeSigma * gauss());
      const dc = spec.durClamp || [0.4, 3];
      D = Math.max(dc[0], Math.min(dc[1], D));
      const lv = Math.max(0.5, Math.min(1, levelFlat + gauss() * levelSigma));
      const ratio = ratioRange[0] * Math.pow(ratioRange[1] / ratioRange[0], rand());
      const Rr = relRange[0] + rand() * (relRange[1] - relRange[0]);   // releases vary too (L1)
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
    seed,
    windows, placed: placed.length, dropped, perPart,
    durSpread: durs.length ? [+durs[0].toFixed(2), +durs[Math.floor(durs.length / 2)].toFixed(2), +durs[durs.length - 1].toFixed(2)] : null
  } };
}

// ========== PASS 2: THE ONSET-DRIVEN CLOUD (compileOnsetCloud) ==========
// Composer 2026-08-11 — flips the generative direction: schedule ONSETS (varied
// gaps, yet dense), durations follow. Physical law: no overlap within a part +
// re-articulation gap. Duration model = the SHORT-GRAIN CATEGORY hypothesis:
// all durs in a short band are ONE perceptual category ("the short grain");
// diversity lives in a single random selection across the longer range.
// The manifest IS the evaluation instrument for apex-density vs diversity:
// truncation fraction (esp. inside the apex window) shows exactly when the
// physical limit starts eating the duration distribution.
//
// spec: { trajectory: [{dur,from,to}] (ONSET rate legs, geometric interp),
//   window: 0.25, parts: 10,
//   durModel: { shortBand: [0.6, 0.9], pShort: 0.45, maxDur: 3.5 },
//   reArtic: 0.08, releaseRange: [0.02, 0.08], ratioRange: [3, 6],
//   levelFlat: 0.9, apexWindow: [t0, t1] (score-relative, for apex metrics),
//   note: 45, technique: 'ord', tag: 'OC' }
function compileOnsetCloud(C, spec) {
  const seed = spec.seed != null ? (spec.seed >>> 0) : Math.floor(Math.random() * 4294967296);
  const rand = makeRand(seed);
  const T0 = 2;
  const parts = spec.parts || 10;
  const HUES = ['#1565C0', '#2E7D32', '#7B1FA2', '#C62828', '#E6A23C', '#00838F', '#6D4C41', '#283593', '#00695C', '#AD1457'];
  const dm = spec.durModel || {};
  const shortBand = dm.shortBand || [0.6, 0.9];
  const pShort = dm.pShort != null ? dm.pShort : 0.45;
  const maxDur = dm.maxDur != null ? dm.maxDur : 3.5;
  // TIERED duration model (LAW L4, composer-confirmed 2026-08-11): perceived
  // diversity needs category-sized jumps (~×2.5 between tiers); variety inside a
  // tier is texture, not difference. tiers[0] = the capped dense stream; every
  // further tier is RESERVED (span claimed at assignment — never truncated),
  // its rate = share × trajectory rate, so tiers thin out with the arch.
  //   durModel: { tiers: [ {range:[0.6,1.0], share:0.786},
  //                        {range:[1.9,2.75], share:0.143},
  //                        {range:[4.5,6.0],  share:0.071} ] }
  const tiers = dm.tiers || null;
  const denseRange = tiers ? tiers[0].range : shortBand;
  const denseShare = tiers ? tiers[0].share : 1;
  const reArtic = spec.reArtic != null ? spec.reArtic : 0.08;
  const relRange = spec.releaseRange || [0.02, 0.08];
  const ratioRange = spec.ratioRange || [3, 6];
  const levelFlat = spec.levelFlat != null ? spec.levelFlat : 0.9;
  const levelSigma = 0.06;
  const WIN = spec.window != null ? spec.window : 0.25;
  const traj = spec.trajectory;
  const total = traj.reduce((s, l) => s + l.dur, 0);
  const rateAt = tt => {
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
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // ---- 1. Onset stream: L2 quota windows, uniform placement (max random) ----
  const onsets = [];
  const windows = [];
  let acc = 0;
  for (let w0 = 0; w0 < total; w0 += WIN) {
    const wLen = Math.min(WIN, total - w0);
    const rate = rateAt(w0 + wLen / 2) * denseShare;
    acc += rate * wLen;
    const n = Math.floor(acc);
    acc -= n;
    windows.push({ at: +(w0.toFixed(1)), budget: n, rate: +rate.toFixed(2) });
    for (let k = 0; k < n; k++) onsets.push(T0 + w0 + rand() * wLen);
  }
  onsets.sort((a, b) => a - b);

  // ---- 1b. Optional LONG STREAM (Xenakis superposition): a sparse stream of
  // long grains threaded through the dense mass on rotating lanes. Their spans
  // are RESERVED at assignment (blockedUntil), so the dense stream can't land
  // on a sounding long grain — this is how wide dur-diversity survives at a
  // dense apex (X-rules: species superposition).
  const ls = spec.longStream || null;   // legacy { rate: 0.7, durRange: [2.2, 5] }
  // Reserved streams: tiers 1..k (share-scaled) or the legacy longStream (fixed rate)
  const resStreams = tiers
    ? tiers.slice(1).map((t, i) => ({ share: t.share, range: t.range, tier: i + 1 }))
    : (ls ? [{ rate: ls.rate, range: ls.durRange, tier: 1 }] : []);
  let merged = onsets.map(t => ({ t, res: 0 }));
  for (const rs of resStreams) {
    let lacc = 0;
    for (let w0 = 0; w0 < total; w0 += WIN) {
      const wLen = Math.min(WIN, total - w0);
      lacc += (rs.share != null ? rs.share * rateAt(w0 + wLen / 2) : rs.rate) * wLen;
      const n = Math.floor(lacc);
      lacc -= n;
      for (let k = 0; k < n; k++) merged.push({ t: T0 + w0 + rand() * wLen, res: rs.tier, range: rs.range });
    }
  }
  const stream = merged.sort((a, b) => a.t - b.t);

  // ---- 2. Part assignment: causal, RANDOM among feasible (max scatter) ----
  // Feasibility floor: at least a short grain + max release + reArtic must fit.
  const footprint = denseRange[0] + relRange[1] + reArtic;
  const lastOnset = new Array(parts).fill(-Infinity);
  const blockedUntil = new Array(parts).fill(-Infinity);
  const assigned = [];
  let dropped = 0, longDropped = 0;
  for (const o of stream) {
    const t = o.t;
    const feas = [];
    for (let p = 0; p < parts; p++) {
      if (t - lastOnset[p] >= footprint && t >= blockedUntil[p]) feas.push(p);
    }
    if (!feas.length) { if (o.res) longDropped++; else dropped++; continue; }
    const p = feas[Math.floor(rand() * feas.length)];
    lastOnset[p] = t;
    const a = { t, part: p, res: o.res };
    if (o.res) {
      // duration fixed NOW and the span reserved (never truncated — LAW L4 tiers)
      a.resDur = o.range[0] + rand() * (o.range[1] - o.range[0]);
      blockedUntil[p] = t + a.resDur + relRange[1] + reArtic;
    }
    assigned.push(a);
  }

  // ---- 3. Durations: two-category target, capped by the part's next onset ----
  const byPart = new Array(parts).fill(null).map(() => []);
  assigned.forEach(a => byPart[a.part].push(a));
  byPart.forEach(list => list.forEach((a, i) => { a.next = i + 1 < list.length ? list[i + 1].t : Infinity; }));
  const events = [];
  let truncated = 0, shortfallSum = 0;
  for (const a of assigned) {
    const release = relRange[0] + rand() * (relRange[1] - relRange[0]);
    let target, dur, wasTrunc = false;
    if (a.res) {
      // reserved-tier grain: span was claimed at assignment, never truncated
      target = dur = Math.min(a.resDur, total + T0 - a.t);
    } else if (tiers) {
      // dense tier: uniform within tier (within-tier variety is texture — L4)
      target = denseRange[0] + rand() * (denseRange[1] - denseRange[0]);
      const cap = a.next - a.t - release - reArtic;
      dur = Math.min(target, cap, total + T0 - a.t);
      if (target > cap) { wasTrunc = true; truncated++; shortfallSum += target - cap; }
    } else {
      target = rand() < pShort
        ? shortBand[0] + rand() * (shortBand[1] - shortBand[0])     // the short grain
        : shortBand[1] + rand() * (maxDur - shortBand[1]);          // one random selection (uniform = leans long)
      const cap = a.next - a.t - release - reArtic;
      dur = Math.min(target, cap, total + T0 - a.t);
      if (target > cap) { wasTrunc = true; truncated++; shortfallSum += target - cap; }
    }
    const lv = Math.max(0.5, Math.min(1, levelFlat + gauss() * levelSigma));
    const ratio = ratioRange[0] * Math.pow(ratioRange[1] / ratioRange[0], rand());
    events.push({ onset: a.t, part: a.part, dur, target, release, lv, ratio, wasTrunc, isLong: !!a.res, tier: a.res });
  }

  // ---- 4. Render: surge envelopes, onset-anchored ----
  events.forEach((ev, i) => {
    const env = grainEnvelope('surge', { dur: ev.dur, lv: ev.lv, ratio: ev.ratio, release: ev.release });
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.onset * 100) / 100,
      endSeconds: Math.round((ev.onset + ev.dur + ev.release) * 100) / 100,
      layer: ev.part, nodes: env.nodes, segments: env.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: (spec.tag || 'OC') + ' o' + (i + 1)
    });
    wc.sonifyNote = spec.note != null ? spec.note : 45;
    wc.technique = spec.technique || 'ord';
    wc.envShape = 'surge';
  });
  C.deselectAll();

  // ---- 5. Manifest: the apex-density vs diversity evaluation instrument ----
  const aw = spec.apexWindow || null;
  const inApex = ev => aw ? (ev.onset - T0 >= aw[0] && ev.onset - T0 <= aw[1]) : false;
  const gaps = [];
  for (let i = 1; i < assigned.length; i++) gaps.push(assigned[i].t - assigned[i - 1].t);
  const stats = arr => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const mean = arr.reduce((x, y) => x + y, 0) / arr.length;
    const sd = Math.sqrt(arr.reduce((x, y) => x + (y - mean) * (y - mean), 0) / arr.length);
    return { min: +s[0].toFixed(3), med: +s[Math.floor(s.length / 2)].toFixed(3), max: +s[s.length - 1].toFixed(3), cv: +(sd / mean).toFixed(2) };
  };
  const partGapCVs = byPart.filter(l => l.length > 2).map(list => {
    const g = list.slice(1).map((a, i) => a.t - list[i].t);
    return stats(g).cv;
  });
  const band = d => d < denseRange[1] ? 'short' : d < 2 ? '1-2s' : d < 3 ? '2-3s' : '3s+';
  const hist = evs => {
    const h = { short: 0, '1-2s': 0, '2-3s': 0, '3s+': 0 };
    evs.forEach(e => h[band(e.dur)]++);
    return h;
  };
  const apexEvents = events.filter(inApex);
  const denseEvents = events.filter(e => !e.isLong);
  const apexDense = apexEvents.filter(e => !e.isLong);
  const soundSum = events.reduce((s, e) => s + e.dur + e.release, 0);
  const perPart = byPart.map(l => l.length);
  return { manifest: {
    seed,
    onsets: onsets.length, placed: assigned.length, dropped,
    longStream: ls ? { placed: events.filter(e => e.isLong).length, dropped: longDropped,
                       durs: events.filter(e => e.isLong).map(e => +e.dur.toFixed(1)) } : null,
    tierMix: tiers ? tiers.map((t, i) => {
      const evs = apexEvents.filter(e => e.tier === i);
      return { tier: i, range: t.range, apexCount: evs.length,
               meanDur: evs.length ? +(evs.reduce((s, e) => s + e.dur, 0) / evs.length).toFixed(2) : null };
    }) : null,
    reservedDropped: resStreams.length ? longDropped : null,
    onsetGaps: stats(gaps),
    perPartGapCV: partGapCVs.length ? +(partGapCVs.reduce((a, b) => a + b, 0) / partGapCVs.length).toFixed(2) : null,
    durTargetHist: (() => { const h = { short: 0, '1-2s': 0, '2-3s': 0, '3s+': 0 }; events.forEach(e => h[band(e.target)]++); return h; })(),
    durRealizedHist: hist(events),
    truncation: { overall: +(truncated / Math.max(1, denseEvents.length)).toFixed(3),
                  apex: aw ? +(apexDense.filter(e => e.wasTrunc).length / Math.max(1, apexDense.length)).toFixed(3) : null,
                  meanShortfall: truncated ? +(shortfallSum / truncated).toFixed(2) : 0 },
    occupancy: { overall: +(soundSum / (parts * total)).toFixed(2),
                 apex: aw ? +(apexEvents.reduce((s, e) => s + Math.min(e.dur, aw[1] - (e.onset - T0)), 0) / (parts * (aw[1] - aw[0]))).toFixed(2) : null },
    apexRealized: aw ? { onsetsPerSec: +(apexEvents.length / (aw[1] - aw[0])).toFixed(1),
                         durHist: hist(apexEvents) } : null,
    perPart, windowCount: windows.length
  } };
}
