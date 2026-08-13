// ost_variety.js — scores/ost01-variety.json (composer 2026-08-13, session
// wrap): the piece-#2 ostinato engine arrives in tuba land. The TABLES are the
// composer's played timing samples (bank/ostinato_timing_db_2p2p.json, 6
// samples: curvePosition -> gap/velocity/durations). Algorithm ported from
// piece #2 generate_ostinato_midi.js: curve-level attack lookup with nearby
// cycling; gap = minGap + (raw-minGap)*stretch, smoothed toward local average,
// x speed. Tubas: attacks distributed over the section's PLAYER GROUP under
// the 0.08 s re-artic law (ensemble hocket carries piano-speed gaps).
// EIGHT sections — the next-session listening exercise:
//   1 quartet (0-3), arch, low cluster      5 TWO WAVES: slow-low 4tet + fast-high 4tet
//   2 quartet (6-9), fast, 4 fifths on A1   6 TRIPLE WAVES: 3+3+4, three speeds
//   3 sextet (2-7), m6(F)                   7 ACCRETIVE 2->10 players
//   4 full ten, BbE-2oct                    8 DECRETIVE 10->2 players

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
const rand = mulberry32(20260828);
const REARTIC = 0.08, LO = 30, HI = 65;
const WINDOW = 0.1;

const DB = JSON.parse(fs.readFileSync('bank/ostinato_timing_db_2p2p.json', 'utf8'));

// ---- ported engine ----
function makeLookup(attacks) {
  const sorted = [...attacks].sort((a, b) => a.curvePosition - b.curvePosition);
  const gaps = sorted.filter(a => a.gapToNextMs !== null).map(a => a.gapToNextMs);
  const centerGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const minGap = Math.min(...gaps);
  let lastCycle = 0, lastRegion = -1;
  const get = y => {
    const nearby = sorted.filter(a => a.curvePosition >= y - WINDOW && a.curvePosition <= y + WINDOW);
    if (!nearby.length) return sorted.reduce((b, a) => Math.abs(a.curvePosition - y) < Math.abs(b.curvePosition - y) ? a : b);
    const region = Math.round(y / WINDOW);
    if (region !== lastRegion) { lastRegion = region; lastCycle = 0; }
    return nearby[lastCycle++ % nearby.length];
  };
  return { get, centerGap, minGap, attacks: sorted };
}

function genAttacks(sampleIdx, curve, durSec, { speed = 1, stretch = 1.5, smooth = 0.7 }) {
  const lk = makeLookup(DB.samples[sampleIdx].attacks);
  const out = [];
  let t = 0, count = 0;
  while (t < durSec * 1000 && count < 4000) {
    const y = curve(t / (durSec * 1000));
    const atk = lk.get(y);
    let raw = atk.gapToNextMs !== null ? atk.gapToNextMs : lk.centerGap;
    let gap = lk.minGap + (raw - lk.minGap) * stretch;
    if (smooth > 0) {
      const nearby = lk.attacks.filter(a => a.curvePosition >= y - WINDOW && a.curvePosition <= y + WINDOW && a.gapToNextMs !== null).map(a => a.gapToNextMs);
      const localAvg = nearby.length ? nearby.reduce((a, b) => a + b, 0) / nearby.length : lk.centerGap;
      const even = lk.minGap + (localAvg - lk.minGap) * stretch;
      gap += (even - gap) * smooth;
    }
    gap = Math.max(20, gap * speed);
    const avgDur = atk.noteDurationsMs.reduce((a, b) => a + b, 0) / atk.noteDurationsMs.length;
    out.push({ onSec: t / 1000, durSec: Math.max(0.06, Math.min(avgDur, gap * 0.9) / 1000), vel: atk.avgVelocity });
    t += gap; count++;
  }
  return out;
}

// ---- pitch sets (the palette) ----
const chroma = (a, b) => { const s = []; for (let p = a; p <= b; p++) s.push(p); return s; };
const pcsPool = pcs => chroma(LO, HI).filter(p => pcs.includes(p % 12));
const onF = ivs => ivs.map(x => (x + 5) % 12);
const M6F = pcsPool(onF([0, 2, 4, 5, 6, 8, 10, 11]));
const BBE = [...chroma(34, 40), ...chroma(58, 64)];
const SPREAD = [30, 36, 43, 47, 56, 57, 58];
const pick = set => { let last = null; return () => {
  let p; do { p = set[Math.floor(rand() * set.length)]; } while (set.length > 1 && p === last);
  last = p; return p; }; };

// ---- curves ----
const arch = u => u <= 0.5 ? u * 2 : (1 - u) * 2;
const rampUp = u => u;
const rampDown = u => 1 - u;
const wave = cycles => u => 0.5 + 0.5 * Math.sin(2 * Math.PI * cycles * u - Math.PI / 2);

// ---- assembly ----
let nid = 1; const objs = []; let cursor = 3;
const COLOR = '#7B5EA7';

function layer(cursorT, label, sampleIdx, curve, durSec, params, players, pitchFn, activeAt) {
  const atks = genAttacks(sampleIdx, curve, durSec, params);
  const lastEnd = {}; players.forEach(p => lastEnd[p] = -Infinity);
  let prev = -1, thinned = 0;
  atks.forEach(a => {
    const on = cursorT + a.onSec;
    const act = activeAt ? players.filter(p => activeAt(a.onSec / durSec, p)) : players;
    const feas = act.filter(p => on >= lastEnd[p] + REARTIC);
    if (!feas.length) { thinned++; return; }
    const pool = feas.length > 1 ? feas.filter(p => p !== prev) : feas;
    const part = pool[Math.floor(rand() * pool.length)];
    prev = part;
    lastEnd[part] = on + a.durSec;
    const rec = Math.max(30, Math.min(115, Math.round(40 + a.vel * 0.7)));
    const lv = Math.max(1, Math.round((rec / 127) * 100) / 10);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: part,
      startSeconds: +on.toFixed(3), endSeconds: +(on + a.durSec).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: COLOR, fillMode: 'bottom', opacity: 0.55,
      performanceNotes: label, properties: {},
      sonifyNote: pitchFn(), technique: 'staccato', sonifyMode: 'plain', recVel: rec });
  });
  return { n: atks.length, thinned };
}

function section(label, durSec, layers) {
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label, color: COLOR, performanceNotes: '', properties: {} });
  const stats = layers.map(L => layer(cursor + (L.offset || 0), label, L.sample, L.curve,
    L.dur, L.params, L.players, L.pitch, L.activeAt));
  const total = Math.max(...layers.map(L => (L.offset || 0) + L.dur));
  console.log(label + ':', stats.map(s => s.n + ' atk (' + s.thinned + ' thin)').join(' + '));
  cursor += total + 3.5;
}

section('1 quartet 0-3 arch · low cluster', 14, [
  { sample: 0, curve: arch, dur: 14, params: { speed: 1.3, stretch: 1.6, smooth: 0.7 },
    players: [0, 1, 2, 3], pitch: pick(chroma(38, 41)) }]);
section('2 quartet 6-9 fast · 4 fifths A1', 12, [
  { sample: 1, curve: arch, dur: 12, params: { speed: 0.8, stretch: 1.4, smooth: 0.7 },
    players: [6, 7, 8, 9], pitch: pick([33, 40, 47, 54, 61]) }]);
section('3 sextet 2-7 · m6(F)', 14, [
  { sample: 2, curve: arch, dur: 14, params: { speed: 1.0, stretch: 1.5, smooth: 0.7 },
    players: [2, 3, 4, 5, 6, 7], pitch: pick(M6F) }]);
section('4 full ten · BbE-2oct', 16, [
  { sample: 3, curve: arch, dur: 16, params: { speed: 0.9, stretch: 1.5, smooth: 0.7 },
    players: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], pitch: pick(BBE) }]);
section('5 TWO WAVES: slow-low 0-3 + fast-high 6-9 (offset center)', 24, [
  { sample: 4, curve: wave(2), dur: 24, params: { speed: 1.5, stretch: 1.7, smooth: 0.75 },
    players: [0, 1, 2, 3], pitch: pick(chroma(30, 36)) },
  { sample: 5, curve: wave(5), dur: 16, offset: 8, params: { speed: 0.75, stretch: 1.3, smooth: 0.65 },
    players: [6, 7, 8, 9], pitch: pick(chroma(59, 65)) }]);
section('6 TRIPLE WAVES 3+3+4 · three speeds', 22, [
  { sample: 0, curve: wave(2), dur: 22, params: { speed: 1.6, stretch: 1.7, smooth: 0.75 },
    players: [0, 1, 2], pitch: pick([30, 37, 44]) },
  { sample: 2, curve: wave(3), dur: 22, params: { speed: 1.1, stretch: 1.5, smooth: 0.7 },
    players: [3, 4, 5], pitch: pick(M6F.filter(p => p >= 44 && p <= 55)) },
  { sample: 5, curve: wave(5), dur: 22, params: { speed: 0.7, stretch: 1.3, smooth: 0.65 },
    players: [6, 7, 8, 9], pitch: pick(chroma(41, 52)) }]);
section('7 ACCRETIVE 2->10 · m6(F)', 24, [
  { sample: 3, curve: rampUp, dur: 24, params: { speed: 1.0, stretch: 1.5, smooth: 0.7 },
    players: [4, 5, 3, 6, 2, 7, 1, 8, 0, 9], pitch: pick(M6F),
    activeAt: (u, p) => [4, 5, 3, 6, 2, 7, 1, 8, 0, 9].indexOf(p) < 2 + Math.floor(u * 8.01) }]);
section('8 DECRETIVE 10->2 · cluster spread', 24, [
  { sample: 1, curve: rampDown, dur: 24, params: { speed: 1.0, stretch: 1.5, smooth: 0.7 },
    players: [4, 5, 3, 6, 2, 7, 1, 8, 0, 9], pitch: pick(SPREAD),
    activeAt: (u, p) => [4, 5, 3, 6, 2, 7, 1, 8, 0, 9].indexOf(p) < 10 - Math.floor(u * 8.01) }]);

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/ost01-variety.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('ost01-variety:', (cursor / 60).toFixed(1), 'min,', objs.filter(o => o.type === 'waveCurve').length, 'notes');
