#!/usr/bin/env node
// E1 — the chunker (docs/NOTATION_EXPERIMENTS.md §5).
// Two stages: perceptual segmentation (gap rule), then first-level-rational fit
// per group with per-onset error (the M5 classifier reframe: coverage, not verdict).
//
// Method note: the fit searches the GRID UNIT u (seconds between adjacent grid
// positions), with candidates derived from the data itself (u ~ delta/n), then
// least-squares refined. A unit is only ACCEPTED if it can be labelled by a
// first-level rational p:q whose implied beat (u*p/q) is countable, i.e. inside
// [BEAT_MIN, BEAT_MAX]. That labelling step is the complexity prior — it is what
// stops the day-19 false positive (a 20 ms "beat" that is a fine grid, not a tempo).
//
// Usage: node tools/e1_chunker.js [scores/cloud02-10track.json]
// Writes: analysis/e1/<name>.e1.json

const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || 'scores/cloud02-10track.json';
const EPS = [0.010, 0.015, 0.020, 0.025, 0.030]; // tolerance sweep (s)
const MINRUN = 6;                        // smallest chunk worth a bar
const MAXRUN = 24;                       // cost bound; a 24-note bar is already generous
// Both of the following are BINDING knobs — see the sensitivity table in
// docs/NOTATION_EXPERIMENTS.md §8. Overridable for sensitivity runs:
//   BEAT_MIN=0.25 PLAYABLE_UNIT=0.080 node tools/e1_chunker.js
const BEAT_MIN = +(process.env.BEAT_MIN || 0.30), BEAT_MAX = +(process.env.BEAT_MAX || 1.00);
const PLAYABLE_UNIT = +(process.env.PLAYABLE_UNIT || 0.090);
const SEG_K = 2.0, SEG_FLOOR = 0.35;     // boundary: IOI > max(FLOOR, K * local median)
const DEDUPE = 0.005;                    // onsets closer than this = one attack
const APEX = [48.9, 54.9];               // known ensemble apex window

// ---- vocabulary: first-level rationals only ----
// p:q = p notes in the time of q beats. q=1 => straight subdivision.
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
const VOCAB = [];
for (let p = 1; p <= 9; p++) VOCAB.push({ p, q: 1 });
for (const q of [2, 3, 4]) for (let p = q + 1; p <= 9; p++)
  if (gcd(p, q) === 1) VOCAB.push({ p, q });
const complexity = c => (c.q === 1 ? c.p : 10 + c.p + c.q);
// the day-19 measurement's vocabulary, for the like-for-like comparison
const isStraight = c => c.q === 1 && [1, 2, 3, 4, 6, 8].includes(c.p);
// NOTATION complexity class — note that 5:1/7:1/9:1 are quintuplet/septuplet/
// nonuplet subdivisions, i.e. tuplets, even though q === 1.
function noteClass(c) {
  if (c.q === 1 && [1, 2, 4, 8].includes(c.p)) return 'binary';
  if (c.q === 1 && [3, 6].includes(c.p)) return 'compound';
  if (c.q === 1) return 'tuplet-per-beat';       // 5:1, 7:1, 9:1
  return 'tuplet-p:q';                           // 9:2, 7:3, … the composer's case
}

const U_MIN = BEAT_MIN * Math.min(...VOCAB.map(c => c.q / c.p));
const U_MAX = BEAT_MAX * Math.max(...VOCAB.map(c => c.q / c.p));

// Label a grid unit with the simplest vocabulary entry giving a countable beat.
function labelUnit(u, straightOnly) {
  let best = null;
  for (const c of VOCAB) {
    if (straightOnly && !isStraight(c)) continue;
    const beat = u * c.p / c.q;
    if (beat < BEAT_MIN || beat > BEAT_MAX) continue;
    if (!best || complexity(c) < complexity(best.c)) best = { c, beat };
  }
  return best;
}

// ---- fit one window (deltas[0] === 0) to a grid unit ----
// opts.minUnit is part of the SEARCH, not a post-filter: a window whose global
// best fit is a fine grid may still have an acceptable coarse fit, and that is
// exactly the case the playable-unit question asks about.
function fitWindow(deltas, opts) {
  const straightOnly = !!(opts && opts.straightOnly);
  const minUnit = (opts && opts.minUnit) || U_MIN;
  const span = deltas[deltas.length - 1];
  // candidate units derived from the data: every delta divided by a small integer
  const cands = new Set();
  for (const d of deltas) {
    if (d <= 0) continue;
    for (let n = 1; n <= Math.ceil(d / minUnit) && n <= 200; n++) {
      const u = d / n;
      if (u >= minUnit && u <= U_MAX) cands.add(Math.round(u * 1e5) / 1e5);
    }
  }
  let best = null;
  for (const u0 of cands) {
    let u = u0, ns = null;
    for (let pass = 0; pass < 3; pass++) {
      ns = deltas.map(d => Math.round(d / u));
      let ok = true;
      for (let i = 1; i < ns.length; i++) if (ns[i] <= ns[i - 1]) { ok = false; break; }
      if (!ok) { ns = null; break; }
      let num = 0, den = 0;
      for (let i = 1; i < ns.length; i++) { num += ns[i] * deltas[i]; den += ns[i] * ns[i]; }
      const uR = den ? num / den : u;
      if (Math.abs(uR - u) < 1e-6) { u = uR; break; }
      u = uR;
    }
    if (!ns) continue;
    if (u < minUnit || u > U_MAX) continue;
    const label = labelUnit(u, straightOnly);
    if (!label) continue;                       // no countable beat => reject (the prior)
    let maxErr = 0;
    for (let i = 0; i < ns.length; i++)
      maxErr = Math.max(maxErr, Math.abs(deltas[i] - ns[i] * u));
    const cand = { maxErr, u, ns, label, span };
    if (!best || maxErr < best.maxErr - 0.001 ||
        (Math.abs(maxErr - best.maxErr) <= 0.001 &&
         complexity(label.c) < complexity(best.label.c)))
      best = cand;
  }
  return best;
}

// ---- load score ----
const score = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const nTracks = score.tracks.length;
const parts = score.tracks.map(t => ({ id: t.id, onsets: [] }));
for (const o of score.objects) {
  if (o.type !== 'waveCurve') continue;
  if (o.layer >= nTracks) continue;             // meta layer (e.g. layer 10 in cloud02)
  parts[o.layer].onsets.push(o.startSeconds);
}
for (const p of parts) {
  p.onsets.sort((a, b) => a - b);
  p.onsets = p.onsets.filter((t, i, a) => i === 0 || t - a[i - 1] > DEDUPE);
}
const totalNotes = parts.reduce((s, p) => s + p.onsets.length, 0);

// ---- stage 1: perceptual segmentation ----
function segment(onsets) {
  if (!onsets.length) return [];
  const iois = [];
  for (let i = 1; i < onsets.length; i++) iois.push(onsets[i] - onsets[i - 1]);
  const groups = [[onsets[0]]];
  for (let i = 0; i < iois.length; i++) {
    const win = iois.slice(Math.max(0, i - 4), Math.min(iois.length, i + 5))
      .sort((a, b) => a - b);
    const med = win[Math.floor(win.length / 2)];
    if (iois[i] > Math.max(SEG_FLOOR, SEG_K * med)) groups.push([]);
    groups[groups.length - 1].push(onsets[i + 1]);
  }
  return groups;
}

// ---- stage 2: fit every candidate sub-run of every group ----
const partData = [];
for (const part of parts) {
  const groups = segment(part.onsets);
  const scored = [];
  for (const g of groups) {
    if (g.length < MINRUN) continue;
    const full = new Map(), playable = new Map(), straight = new Map();
    const cap = Math.min(g.length, MAXRUN);
    for (let len = cap; len >= MINRUN; len--) {
      for (let st = 0; st + len <= g.length; st++) {
        const deltas = g.slice(st, st + len).map(t => t - g[st]);
        const f = fitWindow(deltas, {}); if (f) full.set(st + ',' + len, f);
        const p = fitWindow(deltas, { minUnit: PLAYABLE_UNIT });
        if (p) playable.set(st + ',' + len, p);
        const s = fitWindow(deltas, { straightOnly: true });
        if (s) straight.set(st + ',' + len, s);
      }
    }
    scored.push({ onsets: g, full, playable, straight });
  }
  partData.push({ id: part.id, onsets: part.onsets, groups, scored });
}

// ---- greedy claim: longest chunk that fits within eps, then recurse either side ----
function claim(group, fits, eps) {
  const out = [];
  (function rec(s, e) {
    for (let len = Math.min(e - s, MAXRUN); len >= MINRUN; len--) {
      for (let st = s; st + len <= e; st++) {
        const f = fits.get(st + ',' + len);
        if (f && f.maxErr <= eps) {
          out.push({ start: st, len, fit: f });
          rec(s, st); rec(st + len, e);
          return;
        }
      }
    }
  })(0, group.length);
  return out;
}

function coverage(eps, which) {
  let claimedNotes = 0, apexClaimed = 0;
  const descs = [];
  for (const pd of partData) {
    for (const sc of pd.scored) {
      for (const c of claim(sc.onsets, sc[which], eps)) {
        claimedNotes += c.len;
        const f = c.fit;
        descs.push({ part: pd.id, t0: sc.onsets[c.start], len: c.len,
          pq: f.label.c.p + ':' + f.label.c.q, cls: noteClass(f.label.c),
          beat: f.label.beat, uMs: f.u * 1000, maxErrMs: f.maxErr * 1000, ns: f.ns });
        for (let i = c.start; i < c.start + c.len; i++) {
          const t = sc.onsets[i];
          if (t >= APEX[0] && t <= APEX[1]) apexClaimed++;
        }
      }
    }
  }
  return { claimedNotes, descs, apexClaimed };
}

const apexTotal = partData.reduce((s, pd) =>
  s + pd.onsets.filter(t => t >= APEX[0] && t <= APEX[1]).length, 0);

// ---- report ----
console.log('E1 chunker — ' + SRC);
console.log('parts ' + parts.length + ' · notes ' + totalNotes +
  ' · groups ' + partData.reduce((s, p) => s + p.groups.length, 0) +
  ' (>=' + MINRUN + ': ' + partData.reduce((s, p) => s + p.scored.length, 0) + ')' +
  ' · apex-window notes ' + apexTotal);
const gl = partData.flatMap(p => p.groups.map(g => g.length)).sort((a, b) => a - b);
console.log('group length min/med/max: ' + gl[0] + '/' + gl[Math.floor(gl.length / 2)] +
  '/' + gl[gl.length - 1]);
const ceilingNotes = partData.reduce((s, p) =>
  s + p.groups.filter(g => g.length >= MINRUN).reduce((a, g) => a + g.length, 0), 0);
console.log('SEGMENTATION CEILING: ' + ceilingNotes + '/' + totalNotes + ' notes (' +
  (100 * ceilingNotes / totalNotes).toFixed(1) + ' %) live in groups of >=' + MINRUN +
  ' — no fit can claim more than this.');
console.log('');
console.log('COVERAGE (% of all notes claimed by chunks of >=' + MINRUN + ' notes)');
console.log('  eps      full vocab   playable-unit only   straight-only (day-19 vocab)');
const table = {};
for (const eps of EPS) {
  const f = coverage(eps, 'full');
  const p = coverage(eps, 'playable');
  const s = coverage(eps, 'straight');
  table[Math.round(eps * 1000)] = { f, p, s };
  const pct = x => (100 * x.claimedNotes / totalNotes).toFixed(1).padStart(5) + ' %';
  console.log('  ' + (Math.round(eps * 1000) + ' ms').padEnd(8) +
    ' ' + pct(f) + ' (' + String(f.claimedNotes).padStart(4) + ')' +
    '   ' + pct(p) + ' (' + String(p.claimedNotes).padStart(4) + ')' +
    '     ' + pct(s) + ' (' + String(s.claimedNotes).padStart(4) + ')');
}

const H = table[20];
function describe(title, res) {
  console.log('');
  console.log(title);
  if (!res.descs.length) { console.log('  (no chunks)'); return; }
  const lens = res.descs.map(d => d.len).sort((a, b) => a - b);
  console.log('  chunks ' + res.descs.length + ' · notes ' + res.claimedNotes +
    ' · len min/med/max ' + lens[0] + '/' + lens[Math.floor(lens.length / 2)] + '/' + lens[lens.length - 1]);
  const cls = {};
  for (const d of res.descs) cls[d.cls] = (cls[d.cls] || 0) + 1;
  console.log('  notation class: ' + Object.entries(cls).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => k + '×' + v).join(' · '));
  const pqCount = {};
  for (const d of res.descs) pqCount[d.pq] = (pqCount[d.pq] || 0) + 1;
  console.log('  vocabulary: ' + Object.entries(pqCount).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => k + '×' + v).join(' '));
  const units = res.descs.map(d => d.uMs).sort((a, b) => a - b);
  const bpms = res.descs.map(d => 60 / d.beat).sort((a, b) => a - b);
  console.log('  grid unit ms min/med/max ' + units[0].toFixed(0) + '/' +
    units[Math.floor(units.length / 2)].toFixed(0) + '/' + units[units.length - 1].toFixed(0) +
    '  ·  beat bpm min/med/max ' + bpms[0].toFixed(0) + '/' +
    bpms[Math.floor(bpms.length / 2)].toFixed(0) + '/' + bpms[bpms.length - 1].toFixed(0));
  console.log('  apex window claimed: ' + res.apexClaimed + '/' + apexTotal +
    ' (' + (100 * res.apexClaimed / apexTotal).toFixed(1) + ' %)');
}
describe('AT eps=20 ms — FULL VOCAB (any grid unit)', H.f);
describe('AT eps=20 ms — PLAYABLE UNIT ONLY (grid unit >= ' + (PLAYABLE_UNIT * 1000) + ' ms)', H.p);
describe('AT eps=30 ms — PLAYABLE UNIT ONLY', table[30].p);

console.log('');
console.log('PER PART at eps=20 ms (full vocab / playable-unit only)');
for (const pd of partData) {
  const mine = H.f.descs.filter(d => d.part === pd.id);
  const minePl = H.p.descs.filter(d => d.part === pd.id);
  const n = mine.reduce((s, d) => s + d.len, 0), nPl = minePl.reduce((s, d) => s + d.len, 0);
  let bestShare = 0;
  for (const d0 of mine) {
    const share = mine.filter(d => Math.abs(d.beat - d0.beat) / d0.beat < 0.05)
      .reduce((s, d) => s + d.len, 0);
    bestShare = Math.max(bestShare, share);
  }
  console.log('  ' + pd.id.padEnd(7) + ' notes ' + String(pd.onsets.length).padStart(3) +
    ' · claimed ' + String(n).padStart(3) + ' (' + (100 * n / pd.onsets.length).toFixed(0).padStart(3) + ' %)' +
    ' / playable ' + String(nPl).padStart(3) + ' (' + (100 * nPl / pd.onsets.length).toFixed(0).padStart(3) + ' %)' +
    ' · chunks ' + String(mine.length).padStart(2) +
    ' · one-tempo share ' + (n ? (100 * bestShare / n).toFixed(0) : '0') + ' %');
}

console.log('');
console.log('LONGEST CHUNKS (eps=20 ms, playable unit only)');
for (const d of [...H.p.descs].sort((a, b) => b.len - a.len).slice(0, 5)) {
  console.log('  ' + d.part + ' @ ' + d.t0.toFixed(2) + 's · ' + d.len + ' notes · ' +
    d.pq + ' at beat ' + d.beat.toFixed(3) + 's (' + (60 / d.beat).toFixed(1) + ' bpm)' +
    ' · unit ' + d.uMs.toFixed(0) + ' ms · maxErr ' + d.maxErrMs.toFixed(1) + ' ms');
  console.log('     grid: ' + d.ns.join(' '));
}

// ---- persist ----
const out = {
  source: SRC, generated: new Date().toISOString(), totalNotes, apexTotal,
  config: { EPS, MINRUN, MAXRUN, BEAT_MIN, BEAT_MAX, PLAYABLE_UNIT, SEG_K, SEG_FLOOR,
    vocabulary: VOCAB.map(c => c.p + ':' + c.q) },
  parts: partData.map(p => ({ id: p.id, notes: p.onsets.length, groups: p.groups.map(g => g.length) })),
  coverage: Object.fromEntries(Object.entries(table).map(([eps, t]) => [eps, {
    fullVocab: { claimedNotes: t.f.claimedNotes, apexClaimed: t.f.apexClaimed, chunks: t.f.descs },
    playableUnit: { claimedNotes: t.p.claimedNotes, chunks: t.p.descs },
    straightOnly: { claimedNotes: t.s.claimedNotes, chunks: t.s.descs.length },
  }])),
};
fs.mkdirSync(path.join('analysis', 'e1'), { recursive: true });
const outPath = path.join('analysis', 'e1', path.basename(SRC, '.json') + '.e1.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log('');
console.log('written: ' + outPath);
