#!/usr/bin/env node
// pack_take.js — PACK A PLAYED TAKE TO THE PLAYABLE CEILING (composer 2026-08-16).
//
// The problem: a density build played by one person at a keyboard demands far
// more than ten tubas can articulate. densBld03-take1 asks for 54.5 attacks/s at
// its apex; ten players holding a ~0.45 s staccato one-shot top out at ~22/s.
//
// The model (composer's, and it replaced an earlier prune-then-space pair — one
// convergent operation instead of iterate-and-check). For each note, in time
// order:
//   1. a player free right now?          -> place it where it was played
//   2. no?                               -> nudge later to the earliest opening,
//                                           within --budget
//   3. budget exceeded?                  -> accept a tight-but-legal spot (soft)
//   4. nothing fits?                     -> delete it
// Deletion is the last resort by construction, so density automatically rides
// the ceiling and never exceeds it. No thinning amount has to be guessed.
//
// Nudging is NOT how density is retained — at true saturation, shifting a note
// just walks it into the next collision (composer predicted this; measured: a
// 340 ms larger budget buys 8 notes). What the small budget actually buys is
// CLEANLINESS: 0 ms leaves 37 soft flags, 60 ms leaves none, for displacements
// well under the ear's threshold at this density.
//
// WHICH note dies (--pick, default 'spread'): within a simultaneity clump,
// survival is ordered top, bottom, then whichever remaining note is farthest
// from everything already kept. The extremes go first so the band keeps its
// registral WIDTH when its thickness has to drop; the max-min fill then stops
// the middle hollowing out over many consecutive clumps. 'random' (seeded) and
// 'arrival' (raw MIDI order) are kept as alternates.
//
// Assignment mirrors Composer.assignCluster in score/public/composer.html,
// leap-aware term included — same constants, same tie-breaks. The browser is
// the authority; this tool is cross-checked against it (same discipline as
// tools/audit_playability.js).
//
//   node tools/pack_take.js scores/densBld03-take1.json
//   node tools/pack_take.js scores/x.json --budget 0.06 --pick spread --out scores/x-packed.json
//
// Writes a TEN-PART score you can load and hear immediately, and prints the
// before/after report. The source take is never modified.

const fs = require('fs');
const path = require('path');

// ---- rule constants: keep identical to Composer.CONFLICT ----
const PARTS = 10;
const TONGUE_RESET = 0.03;
const MIN_ATTACK = 0.11;
const PER_SEMITONE = 0.0093;
const MAX_LEAP_ADD = 0.22;
const LEAP_WEIGHT = 120;
const CLUMP_EPS = 0.05;      // notes this close count as one attack moment
const VARIABLE_TECHS = { ord: 1, cuivre: 1 };   // drawn duration; everything else is a one-shot

// ---- args ----
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] != null ? args[i + 1] : dflt;
};
const srcPath = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== undefined
  ? !String(args[args.indexOf(a) - 1]).startsWith('--') : true) || args[0];
const BUDGET = parseFloat(flag('budget', '0.06'));
const PICK = flag('pick', 'spread');
const SEED = parseInt(flag('seed', '20260816'), 10);
const OUT = flag('out', null);

if (!srcPath || srcPath.startsWith('--')) {
  console.error('usage: node tools/pack_take.js <score.json> [--budget 0.06] [--pick spread|random|arrival] [--out path]');
  process.exit(1);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

// ---- measured one-shot lengths (D9: ORD is the only real duration) ----
const SL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bank', 'sample_lengths.json'), 'utf8'));
function soundLen(tech, pitch, drawn) {
  if (VARIABLE_TECHS[tech]) return Math.max(0.05, drawn);
  const tbl = SL[tech];
  if (!tbl) return Math.max(0.05, drawn);
  if (tbl[pitch] != null) return tbl[pitch];
  const keys = Object.keys(tbl).map(Number);
  let best = keys[0];
  keys.forEach(k => { if (Math.abs(k - pitch) < Math.abs(best - pitch)) best = k; });
  return tbl[best];
}

// ---- the same tiering the app uses ----
const requiredAttack = (pa, pb) =>
  MIN_ATTACK + Math.min(MAX_LEAP_ADD, Math.abs(pb - pa) * PER_SEMITONE);
function tierOn(last, s, e, p) {
  if (!last) return 'free';
  if (s < last.e - 1e-6) return 'hard';
  if (s - last.e < TONGUE_RESET - 1e-6) return 'soft';
  return (s - last.s) < requiredAttack(last.p, p) - 1e-6 ? 'soft' : 'free';
}
// earliest moment this player could legally attack pitch p
const freeAt = (last, p) => last
  ? Math.max(last.e + TONGUE_RESET, last.s + requiredAttack(last.p, p))
  : -Infinity;

// ---- load ----
const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const data = raw.data || raw;
const name = path.basename(srcPath, '.json');
const noteObjs = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .sort((a, b) => a.startSeconds - b.startSeconds);
if (!noteObjs.length) { console.error('no played notes in ' + srcPath); process.exit(1); }

const events = noteObjs.map(o => ({
  obj: o,
  t: o.startSeconds,
  p: o.sonifyNote,
  tech: o.technique || 'staccato',
  len: soundLen(o.technique || 'staccato', o.sonifyNote, o.endSeconds - o.startSeconds),
}));

// ---- clump into attack moments, then order survival within each clump ----
function clumps(evs) {
  const out = []; let cur = [evs[0]];
  for (let i = 1; i < evs.length; i++) {
    if (evs[i].t - cur[0].t <= CLUMP_EPS) cur.push(evs[i]);
    else { out.push(cur); cur = [evs[i]]; }
  }
  out.push(cur);
  return out;
}
// spread: top, bottom, then farthest-from-everything-kept (max-min pitch spacing)
function spreadOrder(clump) {
  if (clump.length <= 2) return clump.slice().sort((a, b) => b.p - a.p);
  const pool = clump.slice().sort((a, b) => a.p - b.p);
  const kept = [pool.pop(), pool.shift()];        // top, bottom
  while (pool.length) {
    let bi = 0, bd = -1;
    pool.forEach((c, i) => {
      const dmin = Math.min(...kept.map(k => Math.abs(k.p - c.p)));
      if (dmin > bd) { bd = dmin; bi = i; }
    });
    kept.push(pool.splice(bi, 1)[0]);
  }
  return kept;
}
function orderClump(c) {
  if (c.length < 2) return c;
  if (PICK === 'arrival') return c;
  if (PICK === 'random') return c.map(x => [rand(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return spreadOrder(c);
}
// rebuild the stream with within-clump survival priority applied, but keep the
// stream in time order so the packer still walks time forward
const ordered = [];
for (const c of clumps(events)) {
  orderClump(c).forEach((e, rank) => ordered.push(Object.assign({}, e, { rank })));
}
ordered.sort((a, b) => (a.t - b.t) || (a.rank - b.rank));

// ---- the pack ----
const lanes = Array.from({ length: PARTS }, () => []);   // placed notes per player
const last = Array(PARTS).fill(null);
const busy = Array(PARTS).fill(-1);
const placed = [];
let nudged = 0, deleted = 0, softN = 0, maxDisp = 0, dispSum = 0;
const deletedAt = [];

for (const e of ordered) {
  const L = e.len;

  // 1. lanes that are genuinely free at the played time — pick leap-aware
  let cands = [];
  for (let i = 0; i < PARTS; i++) {
    if (tierOn(last[i], e.t, e.t + L, e.p) === 'free') cands.push(i);
  }
  let lane = null, at = e.t, tier = 'free';

  if (cands.length) {
    let best = null;
    for (const i of cands) {
      const leap = last[i] ? Math.abs(last[i].p - e.p) : 0;
      const score = Math.max(0, busy[i]) * 1000 + leap * LEAP_WEIGHT + i;
      if (!best || score < best.score) best = { i, score };
    }
    lane = best.i;
  } else {
    // 2. nudge to the earliest opening, within budget
    let bestT = Infinity, bestL = null;
    for (let i = 0; i < PARTS; i++) {
      const f = freeAt(last[i], e.p);
      const tie = f + (last[i] ? Math.abs(last[i].p - e.p) : 0) * 1e-6;
      if (tie < bestT) { bestT = tie; bestL = i; }
    }
    const target = Math.max(e.t, freeAt(last[bestL], e.p));
    if (target - e.t <= BUDGET + 1e-9) {
      lane = bestL; at = target; nudged++;
      const disp = at - e.t;
      maxDisp = Math.max(maxDisp, disp); dispSum += disp;
    } else {
      // 3. a tight-but-legal spot at the played time beats losing the note
      let sl = null, sLeap = Infinity;
      for (let i = 0; i < PARTS; i++) {
        if (tierOn(last[i], e.t, e.t + L, e.p) !== 'soft') continue;
        const leap = last[i] ? Math.abs(last[i].p - e.p) : 0;
        if (leap < sLeap) { sLeap = leap; sl = i; }
      }
      if (sl != null) { lane = sl; at = e.t; tier = 'soft'; softN++; }
      else { deleted++; deletedAt.push(e.t); continue; }   // 4. it cannot fit
    }
  }

  last[lane] = { s: at, e: at + L, p: e.p };
  busy[lane] = at + L;
  lanes[lane].push({ e, at, len: L, tier });
  placed.push({ e, at, len: L, lane, tier });
}

// ---- verify the result against the same rule, from scratch ----
function audit(lanesArr) {
  let hard = 0, soft = 0;
  lanesArr.forEach(l => {
    const s = l.slice().sort((a, b) => a.at - b.at);
    for (let i = 1; i < s.length; i++) {
      const A = { s: s[i - 1].at, e: s[i - 1].at + s[i - 1].len, p: s[i - 1].e.p };
      const t = tierOn(A, s[i].at, s[i].at + s[i].len, s[i].e.p);
      if (t === 'hard') hard++; else if (t === 'soft') soft++;
    }
  });
  return { hard, soft };
}
const check = audit(lanes);

// ---- patch-range check: a note outside the technique's range simply does not
// sound, and nothing else in the chain would tell you (never silently discard) --
const RANGES = (() => {
  try {
    const src = fs.readFileSync(path.join(__dirname, '..', 'sandbox', 'instruments.js'), 'utf8');
    const inst = /tuba1:\s*\{[\s\S]*?\n\s*\}/.exec(src);
    const out = {};
    const re = /key:\s*"([^"]+)"[^}]*rangeLow:\s*(\d+),\s*rangeHigh:\s*(\d+)/g;
    let m; while ((m = re.exec(inst ? inst[0] : src))) out[m[1]] = [+m[2], +m[3]];
    return out;
  } catch (e) { return {}; }
})();
function rangeCheck(list, label) {
  const bad = list.filter(x => {
    const r = RANGES[x.e ? x.e.tech : x.tech];
    return r && (( x.e ? x.e.p : x.p) < r[0] || (x.e ? x.e.p : x.p) > r[1]);
  });
  if (!bad.length) return null;
  const ps = [...new Set(bad.map(x => (x.e ? x.e.p : x.p)))].sort((a, b) => a - b);
  return label + ': ' + bad.length + ' note(s) outside the patch range — pitches ' + ps.join(',');
}
const rangeIn = rangeCheck(events, 'SOURCE');
const rangeOut = rangeCheck(placed, 'PACKED');

// ---- write the ten-part score ----
const out = JSON.parse(JSON.stringify(data));
let nextId = out.nextId || 1;
const keepNonNote = out.objects.filter(o => !(o.type === 'waveCurve' && o.sonifyNote != null));
const group = 'grp-' + name + '-packed';
out.objects = keepNonNote.concat(placed.map(n => {
  const o = JSON.parse(JSON.stringify(n.e.obj));
  o.id = 'wc-' + (nextId++);
  o.layer = n.lane;
  o.groupId = group;
  o.startSeconds = +n.at.toFixed(3);
  o.endSeconds = +(n.at + n.len).toFixed(3);   // TRUE sounding length (D9)
  o.performanceNotes = 'PACKED';
  return o;
}));
out.nextId = nextId;
const outPath = OUT || path.join('scores', name + '-packed.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));

// ---- report ----
const rate = (evs, w0, w1) => evs.filter(x => x.t >= w0 && x.t < w1).length / (w1 - w0);
const t0 = events[0].t, tEnd = Math.max(...events.map(e => e.t));
const meanLen = events.reduce((s, e) => s + e.len, 0) / events.length;

console.log('=== PACK TO CEILING — ' + name + ' ===');
console.log('  pick=' + PICK + '  budget=' + (BUDGET * 1000).toFixed(0) + 'ms  players=' + PARTS +
  (PICK === 'random' ? '  seed=' + SEED : ''));
console.log('  ceiling = ' + PARTS + ' players / ' + meanLen.toFixed(2) + 's mean one-shot = ' +
  (PARTS / meanLen).toFixed(1) + ' attacks/s\n');
console.log('  IN   ' + String(events.length).padStart(4) + ' notes   ' +
  (tEnd - t0).toFixed(2) + 's');
console.log('  OUT  ' + String(placed.length).padStart(4) + ' notes   kept ' +
  (100 * placed.length / events.length).toFixed(0) + '%');
console.log('       nudged  ' + String(nudged).padStart(4) + '   mean ' +
  (nudged ? (dispSum / nudged * 1000).toFixed(0) : '0') + 'ms  max ' + (maxDisp * 1000).toFixed(0) + 'ms');
console.log('       deleted ' + String(deleted).padStart(4) +
  (deletedAt.length ? '   between ' + Math.min(...deletedAt).toFixed(1) + 's and ' +
    Math.max(...deletedAt).toFixed(1) + 's' : ''));
console.log('       soft    ' + String(softN).padStart(4) + '   (accepted rather than delete)');
console.log('\n  VERIFY (re-derived from the written lanes): HARD=' + check.hard + '  soft=' + check.soft);

console.log('\n  rate profile — played vs packed (attacks/s per 2 s):');
for (let w = 0; w + 2 <= Math.ceil(tEnd - t0) + 2; w += 2) {
  const a = rate(events.map(e => ({ t: e.t - t0 })), w, w + 2);
  const b = rate(placed.map(n => ({ t: n.at - t0 })), w, w + 2);
  if (!a && !b) continue;
  console.log('    ' + String(w).padStart(2) + '-' + (w + 2) + 's  played ' +
    a.toFixed(1).padStart(5) + '  packed ' + b.toFixed(1).padStart(5) + '  ' +
    '#'.repeat(Math.round(b)));
}

const perLane = lanes.map(l => l.length);
console.log('\n  notes per part: ' + perLane.map((n, i) => 'T' + (i + 1) + '=' + n).join(' '));

console.log('\n  patch range: ' + (rangeIn ? '⚠ ' + rangeIn : 'source clean') +
  ' | ' + (rangeOut ? '⚠ ' + rangeOut : 'packed clean'));

console.log('\n  wrote ' + outPath + '  (load it from the Scores menu)');

// ---------------------------------------------------------------------------
// --compare: one score holding the versions back to back, so the cost of the
// thinning is an ear judgement instead of a number. Sections, GAP seconds apart:
//   A  as played, one part          (what your hands did)
//   B  as played, distributed       (all 251 notes over ten players — complete,
//                                    but unplayable; this is the "before")
//   C  packed                       (the "after")
// ---------------------------------------------------------------------------
if (args.includes('--compare')) {
  const GAP = parseFloat(flag('gap', '3'));
  const t0src = events[0].t;
  const cmp = JSON.parse(JSON.stringify(data));
  let cid = 1;
  const objs = [], marks = [];
  const stamp = (label, at, color) => marks.push({
    id: 'mk-' + (cid++), type: 'marker', layer: 0, time: +at.toFixed(3),
    label, color, performanceNotes: '', properties: {},
  });
  const emit = (note, lane, at, dur, tag, color) => {
    const o = JSON.parse(JSON.stringify(note.obj || note.e.obj));
    o.id = 'wc-' + (cid++); o.layer = lane;
    o.startSeconds = +at.toFixed(3); o.endSeconds = +(at + dur).toFixed(3);
    o.color = color; o.performanceNotes = tag;
    objs.push(o);
  };

  // A — as played, one part
  let off = 0;
  stamp('A · AS PLAYED, one part (' + events.length + ' notes)', off, '#607D8B');
  events.forEach(e => emit(e, 0, off + (e.t - t0src), e.len, 'A-PLAYED', '#607D8B'));
  const endA = Math.max(...events.map(e => e.t - t0src + e.len));

  // B — as played, distributed over ten (leap-aware, NOT packed)
  off = endA + GAP;
  const bLast = Array(PARTS).fill(null), bBusy = Array(PARTS).fill(-1);
  let bHard = 0;
  stamp('B · ALL NOTES over 10 parts — unpacked (' + events.length + ')', off, '#B8663F');
  events.forEach(e => {
    let best = null;
    for (let i = 0; i < PARTS; i++) {
      const tier = tierOn(bLast[i], e.t, e.t + e.len, e.p);
      const leap = bLast[i] ? Math.abs(bLast[i].p - e.p) : 0;
      const sc = (tier === 'free' ? 0 : tier === 'soft' ? 1 : 2) * 1e6 +
        Math.max(0, bBusy[i]) * 1000 + leap * LEAP_WEIGHT + i;
      if (!best || sc < best.sc) best = { i, sc, tier };
    }
    if (best.tier === 'hard') bHard++;
    bLast[best.i] = { s: e.t, e: e.t + e.len, p: e.p };
    bBusy[best.i] = e.t + e.len;
    emit(e, best.i, off + (e.t - t0src), e.len, 'B-UNPACKED', '#B8663F');
  });
  const endB = off + Math.max(...events.map(e => e.t - t0src + e.len));

  // C — packed
  off = endB + GAP;
  stamp('C · PACKED, 10 parts, 0 conflicts (' + placed.length + ')', off, '#3FA7B8');
  placed.forEach(n => emit(n, n.lane, off + (n.at - t0src), n.len, 'C-PACKED', '#3FA7B8'));
  const endC = off + Math.max(...placed.map(n => n.at - t0src + n.len));

  // Markers go in `objects` — composer.html's renderAll() only iterates that
  // array, so a label in `data.markers` round-trips through save/load and is
  // never drawn (fixed 2026-08-16; see tonality_variants.js for the full note).
  cmp.objects = objs.concat(marks);
  cmp.markers = [];
  cmp.nextId = cid;
  const cmpPath = path.join('scores', name + '-AB.json');
  fs.writeFileSync(cmpPath, JSON.stringify(cmp, null, 1));
  console.log('\n=== COMPARISON SCORE ===');
  console.log('  A  0.00s  as played, one part      ' + String(events.length).padStart(4) + ' notes');
  console.log('  B  ' + (endA + GAP).toFixed(2) + 's  all notes over 10 parts  ' +
    String(events.length).padStart(4) + ' notes   ' + bHard + ' HARD (this is the "before")');
  console.log('  C  ' + (endB + GAP).toFixed(2) + 's  packed                   ' +
    String(placed.length).padStart(4) + ' notes   0 hard');
  console.log('  total ' + endC.toFixed(1) + 's');
  console.log('  wrote ' + cmpPath);
}
