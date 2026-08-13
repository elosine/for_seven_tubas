// analyze_take.js — the rhythm-spectrum analyzer + sibling generator (PoC).
// Usage: node tools/analyze_take.js scores/A1-5.json
// 1. Extracts the take's structural fingerprint (trend fit on the accel model,
//    noise sigma, durations, level contour, pitch field, feasibility).
// 2. Saves the meta-object to analysis/<name>.json.
// 3. Emits scores/<name>-gen.json: original take + fitted META shape + two
//    generated SIBLINGS (same fingerprint, new seeds) for like-for-like listening.

const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---- load ----
const scorePath = process.argv[2] || 'scores/A1-5.json';
const name = path.basename(scorePath, '.json');
const raw = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const data = raw.data || raw;
const takes = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
if (!takes.length) { console.error('no captured notes'); process.exit(1); }

const notes = takes.map(o => ({
  on: o.startSeconds, off: o.endSeconds, part: o.layer, pitch: o.sonifyNote,
  vel: o.recVel != null ? o.recVel : Math.round((Math.max(...o.nodes.map(n => n.y)) / 10) * 127),
})).sort((a, b) => a.on - b.on);

const t0 = notes[0].on, t1 = notes[notes.length - 1].on;
const span = t1 - t0;

// ---- trend fit: gap(u) = g0 * (g1/g0)^warp(u), warp = (e^(k u)-1)/(e^k-1) ----
const gaps = [];
for (let i = 1; i < notes.length; i++) {
  const g = notes[i].on - notes[i - 1].on;
  if (g > 1e-4) gaps.push({ u: ((notes[i].on + notes[i - 1].on) / 2 - t0) / span, y: Math.log(g) });
}
const warpOf = (k, u) => Math.abs(k) < 0.01 ? u : (Math.exp(k * u) - 1) / (Math.exp(k) - 1);
let best = null;
for (let k = -2; k <= 2.001; k += 0.05) {
  const w = gaps.map(g => warpOf(k, g.u));
  const n = gaps.length;
  const mw = w.reduce((a, b) => a + b, 0) / n;
  const my = gaps.reduce((a, g) => a + g.y, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (w[i] - mw) * (gaps[i].y - my); sxx += (w[i] - mw) ** 2; }
  const b = sxx ? sxy / sxx : 0, a = my - b * mw;
  let sse = 0;
  const resid = [];
  for (let i = 0; i < n; i++) { const r = gaps[i].y - (a + b * w[i]); sse += r * r; resid.push(r); }
  if (!best || sse < best.sse) best = { k, a, b, sse, resid };
}
const fit = {
  curve: +(best.k / 4).toFixed(2),                    // the one-dial value (raw, pre-recentering)
  gapStart: +Math.exp(best.a).toFixed(3),
  gapEnd: +Math.exp(best.a + best.b).toFixed(3),
  rateStart: +(1 / Math.exp(best.a)).toFixed(2),
  rateEnd: +(1 / Math.exp(best.a + best.b)).toFixed(2),
};
// noise sigma by thirds of the take (residual sd of log-gaps)
const third = i => gaps.filter((g, j) => Math.floor(g.u * 3) === i).map((g, j) => 0); // placeholder
const sigmas = [0, 1, 2].map(k => {
  const rs = best.resid.filter((r, i) => Math.floor(gaps[i].u * 2.999) === k);
  if (rs.length < 3) return null;
  const m = rs.reduce((a, b) => a + b, 0) / rs.length;
  return +Math.sqrt(rs.reduce((a, b) => a + (b - m) ** 2, 0) / rs.length).toFixed(3);
});

// ---- durations, level contour, pitch field, feasibility ----
const durs = notes.map(n => n.off - n.on).sort((a, b) => a - b);
const q = p => durs[Math.floor(p * (durs.length - 1))];
const velTh = [0, 1, 2].map(k => {
  const vs = notes.filter(n => Math.floor(((n.on - t0) / span) * 2.999) === k).map(n => n.vel);
  return vs.length ? +(vs.reduce((a, b) => a + b, 0) / vs.length / 127).toFixed(2) : null;
});
const pitchHist = {};
notes.forEach(n => { pitchHist[n.pitch] = (pitchHist[n.pitch] || 0) + 1; });
const REARTIC = 0.08;
let violations = 0;
const byPart = {};
notes.forEach(n => { (byPart[n.part] = byPart[n.part] || []).push(n); });
Object.values(byPart).forEach(list => {
  for (let i = 1; i < list.length; i++) if (list[i].on < list[i - 1].off + REARTIC) violations++;
});

const meta = {
  name, source: scorePath, analyzed: new Date().toISOString(),
  notes: notes.length, parts: Object.keys(byPart).length, spanSec: +span.toFixed(2), startSec: +t0.toFixed(2),
  trend: fit, noiseSigmaThirds: sigmas,
  durations: { min: +q(0).toFixed(3), q1: +q(0.25).toFixed(3), median: +q(0.5).toFixed(3), q3: +q(0.75).toFixed(3), max: +q(1).toFixed(3) },
  levelContourThirds: velTh,
  pitchField: pitchHist,
  feasibility: { rearticViolations: violations, ceiling10parts: 11, peakRate: fit.rateEnd },
};
fs.mkdirSync('analysis', { recursive: true });
fs.writeFileSync(path.join('analysis', name + '.json'), JSON.stringify(meta, null, 2));

// ---- sibling generation: same fingerprint, new seed, 10-part feasible ----
function generateSibling(seed, tOffset) {
  const rand = mulberry32(seed);
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const sigAt = u => {
    const ss = sigmas.filter(x => x != null);
    const s0 = sigmas[0] ?? ss[0] ?? 0.2, s2 = sigmas[2] ?? ss[ss.length - 1] ?? 0.2;
    return s0 + (s2 - s0) * u;
  };
  const lvAt = u => {
    const vs = velTh.filter(x => x != null);
    const a0 = velTh[0] ?? vs[0] ?? 0.7, a2 = velTh[2] ?? vs[vs.length - 1] ?? 0.9;
    return a0 + (a2 - a0) * u;
  };
  const pitches = Object.keys(pitchHist).map(Number);
  const weights = pitches.map(p => pitchHist[p]);
  const wTot = weights.reduce((a, b) => a + b, 0);
  const pickPitch = () => {
    let r = rand() * wTot;
    for (let i = 0; i < pitches.length; i++) { r -= weights[i]; if (r <= 0) return pitches[i]; }
    return pitches[0];
  };
  const medDur = q(0.5);
  const events = [];
  const lastEnd = new Array(10).fill(-Infinity);
  let t = 0, dropped = 0;
  while (t < span) {
    const u = t / span;
    const gap = fit.gapStart * Math.pow(fit.gapEnd / fit.gapStart, warpOf(best.k, u));
    t += gap * Math.exp(sigAt(u) * gauss());
    if (t >= span) break;
    const durV = Math.max(0.05, q(0.25) + rand() * (q(0.75) - q(0.25)));
    const onAbs = tOffset + t;
    const feas = [];
    for (let p = 0; p < 10; p++) if (onAbs >= lastEnd[p] + REARTIC) feas.push(p);
    if (!feas.length) { dropped++; continue; }
    const part = feas[Math.floor(rand() * feas.length)];
    lastEnd[part] = onAbs + durV;
    const vel = Math.max(20, Math.min(127, Math.round(lvAt(u) * 127 + gauss() * 8)));
    events.push({ on: onAbs, off: onAbs + durV, part, pitch: pickPitch(), vel });
  }
  return { events, dropped };
}

// ---- assemble the comparison score ----
let nid = 1;
const objs = [];
const mkNote = (ev, tag) => {
  const lv = Math.max(1, Math.round((ev.vel / 127) * 100) / 10);
  objs.push({
    id: 'wc-' + (nid++), type: 'waveCurve', layer: ev.part,
    startSeconds: Math.round(ev.on * 1000) / 1000, endSeconds: Math.round(ev.off * 1000) / 1000,
    nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
    segments: [{ model: 'power', slope: 0 }],
    color: tag === 'ORIG' ? '#607D8B' : (tag === 'GEN1' ? '#2E7D32' : '#7B1FA2'),
    fillMode: 'bottom', opacity: 0.55, performanceNotes: tag, properties: {},
    sonifyNote: ev.pitch, technique: 'staccato', sonifyMode: 'plain', recVel: ev.vel,
  });
};
const mkShape = (tOff, label) => {
  objs.push({
    id: 'wc-' + (nid++), type: 'waveCurve', layer: 10,
    startSeconds: Math.round(tOff * 100) / 100, endSeconds: Math.round((tOff + span) * 100) / 100,
    nodes: [{ pos: 0, y: 0.6, smooth: 0.25 }, { pos: 1, y: 9.4, smooth: 0.25 }],
    segments: [{ model: 'exponential', slope: Math.max(-1, Math.min(1, best.k / 4)) }],
    color: '#B8860B', fillMode: 'bottom', opacity: 0.5,
    performanceNotes: 'SHAPE ' + label + ' (fit: curve ' + fit.curve + ', ' + fit.rateStart + '->' + fit.rateEnd + '/s)',
    properties: {},
  });
};

// original take, shifted to t=2
const shift = 2 - t0;
notes.forEach(n => mkNote({ on: n.on + shift, off: n.off + shift, part: n.part, pitch: n.pitch, vel: n.vel }, 'ORIG'));
mkShape(2, 'ORIG');
const g1off = 2 + span + 8, g2off = g1off + span + 8;
const g1 = generateSibling(1001, g1off);
const g2 = generateSibling(2002, g2off);
g1.events.forEach(e => mkNote(e, 'GEN1'));
mkShape(g1off, 'GEN1');
g2.events.forEach(e => mkNote(e, 'GEN2'));
mkShape(g2off, 'GEN2');

const out = {
  version: 1, layoutVersion: 2, tracks: data.tracks,
  assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid,
};
const outPath = 'scores/' + name + '-gen.json';
fs.writeFileSync(outPath, JSON.stringify(out));

console.log('=== ' + name + ' fingerprint ===');
console.log(JSON.stringify(meta, null, 2));
console.log('siblings: gen1 ' + g1.events.length + ' notes (' + g1.dropped + ' thinned), gen2 ' +
  g2.events.length + ' (' + g2.dropped + ' thinned)');
console.log('score written: ' + outPath + ' | ORIG at 2s, GEN1 at ' + g1off.toFixed(0) + 's, GEN2 at ' + g2off.toFixed(0) + 's');
