#!/usr/bin/env node
// E1b — the FIXED-BEAT chunker (docs/NOTATION_EXPERIMENTS.md §5).
//
// Why this exists. E1 searches the grid unit freely per chunk. In that frame the
// composer's first-level p:q vocabulary is PROVABLY REDUNDANT: with a countable
// beat free in [0.30,1.00] (a 3.33x range), some integer subdivision p<=9 always
// lands the beat in range, so a straight label always exists and q>1 is never
// needed. p:q can only earn its keep when the beat is CONSTRAINED — one tempo
// held across a passage (the day-19 fixed-tempo lesson, and M5's open question
// "is the tempo per part or is the bar a shared window").
//
// So: fix ONE beat per part (or one across the whole ensemble), and ask how much
// of the part a first-level vocabulary claims at that single tempo.
//
// Usage: node tools/e1b_fixed_beat.js [scores/cloud02-10track.json]
// Writes: analysis/e1/<name>.e1b.json

const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || 'scores/cloud02-10track.json';
const EPS = [0.020, 0.030];
const MINRUN = 6;
const BEAT_MIN = 0.30, BEAT_MAX = 1.00, BEAT_STEP = 0.005;
const PLAYABLE_UNIT = 0.090;
const SEG_K = 2.0, SEG_FLOOR = 0.35;
const DEDUPE = 0.005;

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
const VOCAB = [];
for (let p = 1; p <= 9; p++) VOCAB.push({ p, q: 1 });
for (const q of [2, 3, 4]) for (let p = q + 1; p <= 9; p++)
  if (gcd(p, q) === 1) VOCAB.push({ p, q });
const complexity = c => (c.q === 1 ? c.p : 10 + c.p + c.q);
function noteClass(c) {
  if (c.q === 1 && [1, 2, 4, 8].includes(c.p)) return 'binary';
  if (c.q === 1 && [3, 6].includes(c.p)) return 'compound';
  if (c.q === 1) return 'tuplet-per-beat';
  return 'tuplet-p:q';
}
const STRAIGHT_ONLY = VOCAB.filter(c => c.q === 1);

// ---- load + segment (same rules as E1) ----
const score = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const nTracks = score.tracks.length;
const parts = score.tracks.map(t => ({ id: t.id, onsets: [] }));
for (const o of score.objects) {
  if (o.type !== 'waveCurve' || o.layer >= nTracks) continue;
  parts[o.layer].onsets.push(o.startSeconds);
}
for (const p of parts) {
  p.onsets.sort((a, b) => a - b);
  p.onsets = p.onsets.filter((t, i, a) => i === 0 || t - a[i - 1] > DEDUPE);
}
function segment(onsets) {
  if (!onsets.length) return [];
  const iois = [];
  for (let i = 1; i < onsets.length; i++) iois.push(onsets[i] - onsets[i - 1]);
  const groups = [[onsets[0]]];
  for (let i = 0; i < iois.length; i++) {
    const win = iois.slice(Math.max(0, i - 4), Math.min(iois.length, i + 5)).sort((a, b) => a - b);
    const med = win[Math.floor(win.length / 2)];
    if (iois[i] > Math.max(SEG_FLOOR, SEG_K * med)) groups.push([]);
    groups[groups.length - 1].push(onsets[i + 1]);
  }
  return groups;
}
for (const p of parts) p.groups = segment(p.onsets).filter(g => g.length >= MINRUN);
const totalNotes = parts.reduce((s, p) => s + p.onsets.length, 0);
const ceilingNotes = parts.reduce((s, p) => s + p.groups.reduce((a, g) => a + g.length, 0), 0);

// Maximal run from index st on grid unit u, anchored at st (the GC re-anchors
// every chunk, so error never accumulates across chunk boundaries).
function runFrom(group, st, u, eps) {
  let len = 1, lastN = 0;
  for (let i = st + 1; i < group.length; i++) {
    const d = group[i] - group[st];
    const n = Math.round(d / u);
    if (n <= lastN) break;
    if (Math.abs(d - n * u) > eps) break;
    lastN = n; len++;
  }
  return len;
}

// Claim chunks greedily (longest first) over one group at one fixed unit.
function claimAtUnit(group, u, eps) {
  const out = [];
  (function rec(s, e) {
    let best = null;
    for (let st = s; st < e; st++) {
      let len = 1, lastN = 0;
      for (let i = st + 1; i < e; i++) {
        const d = group[i] - group[st];
        const n = Math.round(d / u);
        if (n <= lastN || Math.abs(d - n * u) > eps) break;
        lastN = n; len++;
      }
      if (len >= MINRUN && (!best || len > best.len)) best = { st, len };
    }
    if (!best) return;
    out.push(best);
    rec(s, best.st); rec(best.st + best.len, e);
  })(0, group.length);
  return out;
}

// For one beat, the allowed grid units (playable only) with their simplest label.
function unitsForBeat(beat, vocab) {
  const m = new Map();
  for (const c of vocab) {
    const u = beat * c.q / c.p;
    if (u < PLAYABLE_UNIT) continue;
    const k = Math.round(u * 1e5);
    if (!m.has(k) || complexity(c) < complexity(m.get(k).c)) m.set(k, { u, c });
  }
  return [...m.values()];
}

function evaluatePart(part, beat, eps, vocab) {
  const units = unitsForBeat(beat, vocab);
  let claimed = 0; const chunks = [];
  for (const g of part.groups) {
    // pick, per group, the vocabulary unit that claims the most notes
    let bestUnit = null, bestClaims = null, bestNotes = -1;
    for (const un of units) {
      const cl = claimAtUnit(g, un.u, eps);
      const n = cl.reduce((s, c) => s + c.len, 0);
      if (n > bestNotes) { bestNotes = n; bestUnit = un; bestClaims = cl; }
    }
    if (!bestClaims) continue;
    claimed += bestNotes;
    for (const c of bestClaims)
      chunks.push({ t0: g[c.st], len: c.len, pq: bestUnit.c.p + ':' + bestUnit.c.q,
        cls: noteClass(bestUnit.c), uMs: bestUnit.u * 1000 });
  }
  return { claimed, chunks };
}

const out = { source: SRC, generated: new Date().toISOString(), totalNotes, ceilingNotes,
  config: { EPS, MINRUN, BEAT_MIN, BEAT_MAX, BEAT_STEP, PLAYABLE_UNIT }, perPart: {}, ensemble: {} };

console.log('E1b fixed-beat chunker — ' + SRC);
console.log('notes ' + totalNotes + ' · segmentation ceiling ' + ceilingNotes +
  ' (' + (100 * ceilingNotes / totalNotes).toFixed(1) + ' %)');
console.log('constraint: ONE beat per part, playable grid units only (>=' +
  PLAYABLE_UNIT * 1000 + ' ms)');

for (const eps of EPS) {
  console.log('');
  console.log('=== eps = ' + (eps * 1000) + ' ms ===');
  console.log('  part    best beat          coverage   vocabulary used (at best beat)');
  let totFull = 0, totStraight = 0;
  const rows = [];
  for (const part of parts) {
    let best = null, bestStraight = null;
    for (let b = BEAT_MIN; b <= BEAT_MAX + 1e-9; b += BEAT_STEP) {
      const r = evaluatePart(part, b, eps, VOCAB);
      if (!best || r.claimed > best.claimed) best = { beat: b, ...r };
      const rs = evaluatePart(part, b, eps, STRAIGHT_ONLY);
      if (!bestStraight || rs.claimed > bestStraight.claimed) bestStraight = { beat: b, ...rs };
    }
    totFull += best.claimed; totStraight += bestStraight.claimed;
    const pq = {};
    for (const c of best.chunks) pq[c.pq] = (pq[c.pq] || 0) + 1;
    const usedPQ = best.chunks.filter(c => c.cls === 'tuplet-p:q').length;
    rows.push({ id: part.id, beat: best.beat, claimed: best.claimed, notes: part.onsets.length,
      straightClaimed: bestStraight.claimed, chunks: best.chunks.length, usedPQ,
      vocab: Object.entries(pq).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '×' + v).join(' ') });
    console.log('  ' + part.id.padEnd(7) + ' ' +
      (best.beat.toFixed(3) + 's (' + (60 / best.beat).toFixed(0) + ' bpm)').padEnd(18) +
      String(best.claimed).padStart(3) + '/' + String(part.onsets.length).padEnd(4) +
      ' (' + (100 * best.claimed / part.onsets.length).toFixed(0).padStart(3) + ' %) ' +
      Object.entries(pq).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '×' + v).join(' '));
  }
  console.log('  TOTAL   full vocab ' + totFull + '/' + totalNotes +
    ' (' + (100 * totFull / totalNotes).toFixed(1) + ' %)   ·   straight-only ' +
    totStraight + '/' + totalNotes + ' (' + (100 * totStraight / totalNotes).toFixed(1) + ' %)' +
    '   ·   p:q gain ' + (100 * (totFull - totStraight) / totalNotes).toFixed(1) + ' pts');
  out.perPart[Math.round(eps * 1000)] = rows;

  // one shared ensemble beat
  let bestShared = null;
  for (let b = BEAT_MIN; b <= BEAT_MAX + 1e-9; b += BEAT_STEP) {
    let claimed = 0, pqUsed = 0;
    for (const part of parts) {
      const r = evaluatePart(part, b, eps, VOCAB);
      claimed += r.claimed; pqUsed += r.chunks.filter(c => c.cls === 'tuplet-p:q').length;
    }
    if (!bestShared || claimed > bestShared.claimed) bestShared = { beat: b, claimed, pqUsed };
  }
  console.log('  SHARED ensemble beat: ' + bestShared.beat.toFixed(3) + 's (' +
    (60 / bestShared.beat).toFixed(0) + ' bpm) claims ' + bestShared.claimed + '/' + totalNotes +
    ' (' + (100 * bestShared.claimed / totalNotes).toFixed(1) + ' %)' +
    ' · p:q chunks ' + bestShared.pqUsed);
  out.ensemble[Math.round(eps * 1000)] = bestShared;
}

fs.mkdirSync(path.join('analysis', 'e1'), { recursive: true });
const outPath = path.join('analysis', 'e1', path.basename(SRC, '.json') + '.e1b.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log('');
console.log('written: ' + outPath);
