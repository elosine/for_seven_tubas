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

// Measured SI2 cresc-KS sample lengths per MIDI note (SI2_tuba_sample_lengths.md,
// probe 2026-08-10, C#0 variant; C0 cut variant assumed same multisamples).
// Surge grains rendered on the SAMPLED crescendo (composer 2026-08-12) must fit
// inside the sample — longer grains revert to CC7 shaping (the composer's rule).
const CRESC_SAMPLE_LEN = {
  29: 4.44, 30: 4.2, 31: 3.96, 32: 3.73, 33: 4.02, 34: 3.8, 35: 3.58, 36: 3.39,
  37: 4.09, 38: 3.86, 39: 3.64, 40: 3.44, 41: 4.79, 42: 4.52, 43: 4.27, 44: 4.03,
  45: 4.98, 46: 4.7, 47: 4.44, 48: 4.19, 49: 5.86, 50: 5.54, 51: 5.23, 52: 4.93,
  53: 5.17, 54: 4.88, 55: 4.61, 56: 4.35, 57: 5.43, 58: 5.12, 59: 4.84, 60: 4.57,
  61: 4.98, 62: 4.7, 63: 4.44, 64: 4.19
};

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
  const T0 = spec.t0 != null ? spec.t0 : 2;   // timeline offset: renders can sit down-timeline
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
  const traj = spec.trajectory || null;
  const accel = spec.accel || null;   // {T, gapStart, gapEnd, gamma, noiseSigma, hold}
  const total = accel ? accel.T + (accel.hold != null ? accel.hold : 0)
                      : traj.reduce((s, l) => s + l.dur, 0);
  // leg.mode: 'geo' (default — constant % growth) or 'linear' (constant
  // onsets/s² growth). Perceptual note (dens1 LONG verdict): sounding-count
  // ∝ rate, and the ear tracks count-regime crossings — geometric ramps spend
  // most of their time below the polyphony threshold.
  const rateAt = tt => {
    let acc = 0;
    for (const leg of traj) {
      if (tt <= acc + leg.dur || leg === traj[traj.length - 1]) {
        const f = Math.max(0, Math.min(1, (tt - acc) / leg.dur));
        return leg.mode === 'linear'
          ? leg.from + (leg.to - leg.from) * f
          : leg.from * Math.pow(leg.to / leg.from, f);
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

  // ---- 1. Onset stream ----
  // Two generators:
  // (a) QUOTA WINDOWS (default): L2 rate-curve → windowed budgets → uniform
  //     placement. Right for STATIONARY textures; at sparse rates the window
  //     randomness is huge relative to the gaps — builds read lumpy (dens2).
  // (b) ACCELERANDO (spec.accel; composer's time-domain model 2026-08-12): the
  //     apex points are placed DIRECTLY as a gap chain shrinking along an
  //     acceleration curve — gap(u) = gapStart·(gapEnd/gapStart)^(u^gamma),
  //     u = t/T. gamma = the gradual/sudden dial (1 = steady accelerando,
  //     >1 = gentle-then-sharpening). Each gap × lognormal jitter (noiseSigma)
  //     — sound-mass randomness at the per-gap timescale, zero-mean in log so
  //     the density trend itself is untouched. After T, holds at gapEnd.
  const gapAt = accel ? (u => accel.gapStart * Math.pow(accel.gapEnd / accel.gapStart,
    Math.pow(Math.max(0, Math.min(1, u)), accel.gamma != null ? accel.gamma : 1))) : null;
  const rateAtEff = accel
    ? (tt => 1 / gapAt(Math.min(tt, accel.T) / accel.T))
    : rateAt;
  const onsets = [];
  const windows = [];
  if (accel) {
    const sigma = accel.noiseSigma != null ? accel.noiseSigma : 0.15;
    let t = 0;
    const end = accel.T + (accel.hold != null ? accel.hold : 0);
    while (t < end) {
      onsets.push(T0 + t);
      const g = gapAt(Math.min(t, accel.T) / accel.T);
      t += g * Math.exp(sigma * gauss());
    }
  } else {
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
  }
  onsets.sort((a, b) => a - b);

  // ---- PEAK-ANCHORED scheduling (spec.anchor 'peak'; the dens4 bug fix) ----
  // The generated points are PEAK times — the perceptual attacks. Durations and
  // species are drawn per point, ONSETS BACK-CALCULATED (onset = peak - pre),
  // per-part interval scheduling in peak order. Fixes the apex-scramble:
  // onset-anchored accel left apex gaps near-random (CV 0.94 vs onset 0.39,
  // dens4 diagnosis 2026-08-12 — the bug the composer was hearing).
  const peakMode = spec.anchor === 'peak';
  let peakEvents = null, peakDropped = 0, peakTrunc = 0;

  // ---- 1b. Optional LONG STREAM (Xenakis superposition): a sparse stream of
  // long grains threaded through the dense mass on rotating lanes. Their spans
  // are RESERVED at assignment (blockedUntil), so the dense stream can't land
  // on a sounding long grain — this is how wide dur-diversity survives at a
  // dense apex (X-rules: species superposition).
  const ls = spec.longStream || null;   // legacy { rate: 0.7, durRange: [2.2, 5] }
  // Reserved streams: tiers 1..k (share-scaled) or the legacy longStream (fixed rate)
  const resStreams = peakMode ? []
    : tiers
    ? tiers.slice(1).map((t, i) => ({ share: t.share, range: t.range, tier: i + 1 }))
    : (ls ? [{ rate: ls.rate, range: ls.durRange, tier: 1 }] : []);
  let merged = onsets.map(t => ({ t, res: 0 }));
  for (const rs of resStreams) {
    let lacc = 0;
    for (let w0 = 0; w0 < total; w0 += WIN) {
      const wLen = Math.min(WIN, total - w0);
      lacc += (rs.share != null ? rs.share * rateAtEff(w0 + wLen / 2) : rs.rate) * wLen;
      const n = Math.floor(lacc);
      lacc -= n;
      for (let k = 0; k < n; k++) {
        const rt = T0 + w0 + rand() * wLen;
        // a reserved grain that can't fit its minimum before score end is skipped
        if (rt + rs.range[0] <= T0 + total) merged.push({ t: rt, res: rs.tier, range: rs.range });
      }
    }
  }
  const stream = merged.sort((a, b) => a.t - b.t);

  // ALTERNATION pass (composer hypothesis, DH4 verdict): duration is
  // multidimensional — the ear hears the values AND the repetition. Same-tier
  // runs in the GLOBAL onset order read as clumps; alternation smooths. This
  // pass swaps tier TAGS between nearby onsets (times never move, so window
  // quotas and per-tier rates stay exact): dense-tier runs capped at 3
  // (unavoidable floor at majority share), every other tier capped at 1.
  let altSwaps = 0;
  if (!peakMode && dm.alternate && tiers) {
    const capFor = ti => ti === 0 ? 3 : 1;
    let run = 1;
    for (let i = 1; i < stream.length; i++) {
      if (stream[i].res === stream[i - 1].res) run++; else run = 1;
      if (run > capFor(stream[i].res)) {
        let j = i + 1;
        while (j < stream.length && stream[j].res === stream[i].res) j++;
        if (j < stream.length) {
          const tags = { res: stream[i].res, range: stream[i].range };
          stream[i].res = stream[j].res; stream[i].range = stream[j].range;
          stream[j].res = tags.res; stream[j].range = tags.range;
          altSwaps++; run = 1;
        }
      }
    }
  }

  // ---- 2. Part assignment: causal, RANDOM among feasible (max scatter) ----
  // Feasibility floor: at least a short grain + max release + reArtic must fit.
  const footprint = denseRange[0] + relRange[1] + reArtic;
  const lastOnset = new Array(parts).fill(-Infinity);
  const blockedUntil = new Array(parts).fill(-Infinity);
  // Anti-clump (composer, DH3): cap CONSECUTIVE short-tier grains per part —
  // runs of shorts in one part read as "lots of short ones". A reserved-tier
  // grain resets the part's run.
  const maxShortRun = dm.maxShortRun != null ? dm.maxShortRun : null;
  const shortRun = new Array(parts).fill(0);
  const assigned = [];
  let dropped = 0, longDropped = 0, converted = 0;
  for (const o of (peakMode ? [] : stream)) {
    const t = o.t;
    const feas = [];
    for (let p = 0; p < parts; p++) {
      if (t - lastOnset[p] >= footprint && t >= blockedUntil[p]) feas.push(p);
    }
    if (!feas.length) { if (o.res) longDropped++; else dropped++; continue; }
    // a rest perceptually resets a part's short-run ("in a row" = close in time)
    if (maxShortRun != null) feas.forEach(p => { if (t - lastOnset[p] > 2.0) shortRun[p] = 0; });
    let pool = feas;
    if (maxShortRun != null) {
      if (o.res) {
        // long grains are the run-breakers: target the worst short-run part
        const worst = Math.max(...feas.map(p => shortRun[p]));
        if (worst > 0) pool = feas.filter(p => shortRun[p] === worst);
      } else {
        const fresh = feas.filter(p => shortRun[p] < maxShortRun);
        if (fresh.length) pool = fresh;   // soft cap: never drop just for run length
        else if (tiers && tiers.length > 1) {
          // every feasible part is run-saturated: CONVERT this short onset into a
          // mid-tier grain — breaks the worst run while keeping the onset density
          o.res = 1; o.range = tiers[1].range;
          converted++;
          const worst = Math.max(...feas.map(p => shortRun[p]));
          pool = feas.filter(p => shortRun[p] === worst);
        }
      }
    }
    const p = pool[Math.floor(rand() * pool.length)];
    if (o.res) shortRun[p] = 0; else shortRun[p]++;
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
  // Envelope species mix (2c pass): per-grain shape from weighted mix, with a
  // per-part no-immediate-repeat redraw — the DH4 alternation instinct applied
  // to species (same-species runs in a part read as clumps).
  const envMix = spec.envMix || null;   // e.g. {surge:.55, sine:.2, expodec:.1}
  // envMixRamp = {from:{...}, to:{...}}: weights interpolate linearly across the
  // render — "introduce" a species over the segment (composer, DH7).
  const envRamp = spec.envMixRamp || null;
  const lerpW = (a, b, f) => {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    const w = {};
    keys.forEach(k => { w[k] = (a[k] || 0) + ((b[k] || 0) - (a[k] || 0)) * f; });
    return w;
  };
  const mixAt = (tt) => {
    if (envRamp && envRamp.points) {
      // piecewise-linear waypoints: [{t, w}, ...] — holds + transitions in one
      // continuous render (no segment seams)
      const pts = envRamp.points;
      if (tt <= pts[0].t) return pts[0].w;
      for (let i = 1; i < pts.length; i++) {
        if (tt <= pts[i].t) {
          const f = (tt - pts[i - 1].t) / Math.max(1e-6, pts[i].t - pts[i - 1].t);
          return lerpW(pts[i - 1].w, pts[i].w, f);
        }
      }
      return pts[pts.length - 1].w;
    }
    if (envRamp) return lerpW(envRamp.from, envRamp.to, Math.max(0, Math.min(1, tt / total)));
    return envMix;
  };
  const lastShape = new Array(parts).fill(null);
  const drawShape = (part, tt) => {
    const w = mixAt(tt);
    if (!w) return 'surge';
    const keys = Object.keys(w);
    const totW = keys.reduce((s, k) => s + w[k], 0);
    let pick;
    for (let tries = 0; tries < 2; tries++) {
      let r = rand() * totW;
      pick = keys[keys.length - 1];
      for (const k of keys) { r -= w[k]; if (r <= 0) { pick = k; break; } }
      if (pick !== lastShape[part]) break;   // redraw once on immediate repeat
    }
    lastShape[part] = pick;
    return pick;
  };

  if (peakMode) {
    peakEvents = [];
    const lastEndP = new Array(parts).fill(0.1 - reArtic);
    const lastShapeP = new Array(parts).fill(null);
    const shortRunP = new Array(parts).fill(0);
    const tierW = tiers ? tiers.map(t => t.share) : null;
    const tierTot = tierW ? tierW.reduce((a, b) => a + b, 0) : 0;
    let lastGlobalShape = null;
    const preOf = (sh, d) => sh === 'surge' ? d : sh === 'sine' ? d / 2
      : sh === 'expodec' ? Math.max(0.08, d * 0.08) : d / 2;
    const postOf = (sh, d, rel) => sh === 'surge' ? rel : sh === 'sine' ? d / 2
      : sh === 'expodec' ? d - Math.max(0.08, d * 0.08) : d / 2;
    for (const pk of onsets) {
      let tierIdx = 0;
      if (tierW) {
        let r = rand() * tierTot;
        for (let k = 0; k < tierW.length; k++) { r -= tierW[k]; if (r <= 0) { tierIdx = k; break; } }
      }
      const range = tiers ? tiers[tierIdx].range : shortBand;
      const target = range[0] + rand() * (range[1] - range[0]);
      const release = relRange[0] + rand() * (relRange[1] - relRange[0]);
      // species: mix weights (altTiersMax respected), global no-immediate-repeat
      let shape = 'surge';
      if ((envMix || envRamp) && tierIdx <= (spec.altTiersMax != null ? spec.altTiersMax : Infinity)) {
        const w = mixAt(pk - T0) || { surge: 1 };
        const keys = Object.keys(w);
        const tot = keys.reduce((sm, k) => sm + w[k], 0);
        for (let tries = 0; tries < 2; tries++) {
          let r = rand() * tot;
          shape = keys[keys.length - 1];
          for (const k of keys) { r -= w[k]; if (r <= 0) { shape = k; break; } }
          if (shape !== lastGlobalShape) break;
        }
      }
      lastGlobalShape = shape;
      const need = preOf(shape, target);
      const feas = [];
      for (let p = 0; p < parts; p++) if (pk - need >= lastEndP[p] + reArtic) feas.push(p);
      let dur = target, part = -1;
      if (feas.length) {
        let pool = feas.filter(p => lastShapeP[p] !== shape);
        if (!pool.length) pool = feas;
        if (tierIdx === 0 && dm.maxShortRun != null) {
          const fresh = pool.filter(p => shortRunP[p] < dm.maxShortRun);
          if (fresh.length) pool = fresh;
        }
        part = pool[Math.floor(rand() * pool.length)];
      } else {
        // shrink to the most-available part (back-span truncation)
        let best = 0, bestAvail = -Infinity;
        for (let p = 0; p < parts; p++) {
          const av = pk - (lastEndP[p] + reArtic);
          if (av > bestAvail) { bestAvail = av; best = p; }
        }
        const durMax = shape === 'surge' ? bestAvail : shape === 'sine' ? bestAvail * 2 : bestAvail / 0.09;
        if (!(durMax >= 0.4)) { peakDropped++; continue; }
        dur = Math.min(target, durMax);
        part = best;
        peakTrunc++;
      }
      const post = postOf(shape, dur, release);
      lastEndP[part] = pk + post;
      lastShapeP[part] = shape;
      if (tierIdx === 0) shortRunP[part]++; else shortRunP[part] = 0;
      const lv = Math.max(0.5, Math.min(1, levelFlat + gauss() * levelSigma));
      const ratio = ratioRange[0] * Math.pow(ratioRange[1] / ratioRange[0], rand());
      peakEvents.push({ onset: pk - preOf(shape, dur), part, dur, target, release, lv, ratio,
                        wasTrunc: dur < target - 1e-9, isLong: tierIdx >= 2, tier: tierIdx, shape });
    }
  }

  const events = peakMode ? peakEvents : [];
  let truncated = 0, shortfallSum = 0;
  if (peakMode) {
    dropped = peakDropped;
    truncated = peakTrunc;
    // manifest mirrors: gap/per-part stats come from the assigned list
    peakEvents.forEach(e => assigned.push({ t: e.onset, part: e.part }));
    assigned.sort((x, y) => x.t - y.t);
    assigned.forEach(x => byPart[x.part].push(x));
  }
  for (const a of (peakMode ? [] : assigned)) {
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
    // altTiersMax (composer 2026-08-12): alternate species only on tiers <= max
    // (short/medium); longer tiers are ALWAYS surge.
    const altMax = spec.altTiersMax != null ? spec.altTiersMax : Infinity;
    let shape;
    if ((a.res || 0) > altMax) { shape = 'surge'; lastShape[a.part] = 'surge'; }
    else shape = drawShape(a.part, a.t - T0);
    events.push({ onset: a.t, part: a.part, dur, target, release, lv, ratio, wasTrunc,
                  isLong: !!a.res, tier: a.res, shape });
  }

  // ---- 4. Render: onset-anchored envelopes (species per grain) ----
  let ksCount = 0, ksFallback = 0;
  events.forEach((ev, i) => {
    const shape = ev.shape || 'surge';
    const env = grainEnvelope(shape, { dur: ev.dur, lv: ev.lv, ratio: ev.ratio, release: ev.release });
    const wc = C.createWaveCurve({
      startSeconds: Math.round(ev.onset * 100) / 100,
      endSeconds: Math.round((ev.onset + env.pre + env.post) * 100) / 100,
      layer: ev.part, nodes: env.nodes, segments: env.segments,
      color: HUES[ev.part % HUES.length], opacity: 0.3,
      performanceNotes: (spec.tag || 'OC') + ' ' + shape[0] + (i + 1)
    });
    // pitch field: spec.notes = per-part pitch array (stack/cluster voicings);
    // falls back to the single spec.note unison
    wc.sonifyNote = spec.notes ? spec.notes[ev.part % spec.notes.length]
                               : (spec.note != null ? spec.note : 45);
    wc.technique = spec.technique || 'ord';
    wc.envShape = shape;
    // SAMPLED-CRESCENDO surge (composer 2026-08-12): surge grains ride the real
    // cresc-KS sample (C0 = cut, no tail) when they FIT inside it; longer ones
    // revert to CC7 shaping (the composer's rule). Physics note: the sample's
    // own arc sets loudness growth — short grains reach only its quiet start.
    if (spec.surgeKS && shape === 'surge') {
      const sampLen = CRESC_SAMPLE_LEN[wc.sonifyNote];
      if (sampLen && ev.dur + ev.release <= sampLen - 0.15) {
        wc.technique = 'cresc_decr_ks';
        wc.sonifyMode = 'ks';
        wc.ksNote = spec.surgeKS.ksNote != null ? spec.surgeKS.ksNote : 24;
        ksCount++;
      } else {
        ksFallback++;
      }
    }
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
    convertedShorts: converted,
    surgeKS: spec.surgeKS ? { ks: ksCount, cc7Fallback: ksFallback } : null,
    speciesMix: (envMix || envRamp) ? (() => {
      const all = {}, apex = {};
      events.forEach(e => { all[e.shape] = (all[e.shape] || 0) + 1; });
      apexEvents.forEach(e => { apex[e.shape] = (apex[e.shape] || 0) + 1; });
      return { all, apex };
    })() : null,
    alternation: tiers ? (() => {
      const seq = events.slice().sort((a, b) => a.onset - b.onset).map(e => e.tier);
      let maxRun = 1, run = 1;
      for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
      return { enabled: !!dm.alternate, swaps: altSwaps, maxGlobalRunRealized: maxRun };
    })() : null,
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
