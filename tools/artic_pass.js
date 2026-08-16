#!/usr/bin/env node
// artic_pass.js — FORTEPIANO → STACCATO CROSSFADE over a packed density build.
// (composer 2026-08-16; the D9-correct successor to tools/transform_fp.js)
//
// The shape the composer asked for, in their words: "the densest area staccato,
// and then just before that a crossfade area where the fortepianos were becoming
// less frequent and turning into mostly staccatos, and then before that it was
// just fortepianos."
//
//   before --fp-until    P(staccato) = 0     -> all fortepiano
//   in the zone          P(staccato) ramps 0 -> 1 linearly
//   after --stac-from    P(staccato) = 1     -> all staccato
//
// WHAT CHANGED SINCE transform_fp.js (2026-08-13). That tool scaled fortepiano
// durations x3 (>= x2 when squeezed). **That is now wrong**: D9 (2026-08-15,
// measured) established that fortepiano is a FIXED one-shot, 1.35-2.22 s, which
// ends itself and never scales. So conversion does not stretch a note — it
// replaces a 0.45 s staccato with a 1.35-2.22 s fortepiano, a 3-5x jump in how
// long that player is occupied.
//
// Which means the crossfade cannot be purely probabilistic: a coin-flip that
// says "fortepiano" in the middle of the build would double-book the player.
// So the roll only ever proposes, and PHYSICS DISPOSES —
//   1. roll says fortepiano?  -> does this player have room for the full sample?
//   2. no room?               -> is there another player who does (leap-aware)?
//   3. still no?              -> it stays staccato, and that is reported
// The crossfade therefore EMERGES from density as well as being biased by the
// ramp — the same principle as make_playable.js's surge/staccato threshold.
// Zero new hard conflicts by construction.
//
//   node tools/artic_pass.js scores/densBld03-take1-packed.json
//   node tools/artic_pass.js <score> --fp-until 12 --stac-from 18 --seed 1234
//
// Input must be an already-packed ten-part score (see docs/DENSITY_PIPELINE.md).

const fs = require('fs');
const path = require('path');

const PARTS = 10;
const TONGUE_RESET = 0.03;
const MIN_ATTACK = 0.11;
const PER_SEMITONE = 0.0093;
const MAX_LEAP_ADD = 0.22;
const LEAP_WEIGHT = 120;

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const srcPath = args[0];
if (!srcPath || srcPath.startsWith('--')) {
  console.error('usage: node tools/artic_pass.js <packed-score.json> [--fp-until S] [--stac-from S] [--seed N] [--out path]');
  process.exit(1);
}
const SEED = parseInt(flag('seed', '20260816'), 10);
const OUT = flag('out', null);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

const SL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bank', 'sample_lengths.json'), 'utf8'));
function oneShot(tech, pitch) {
  const tbl = SL[tech];
  if (!tbl) return null;
  if (tbl[pitch] != null) return tbl[pitch];
  const keys = Object.keys(tbl).map(Number);
  let b = keys[0];
  keys.forEach(k => { if (Math.abs(k - pitch) < Math.abs(b - pitch)) b = k; });
  return tbl[b];
}
const requiredAttack = (pa, pb) => MIN_ATTACK + Math.min(MAX_LEAP_ADD, Math.abs(pb - pa) * PER_SEMITONE);

const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const data = raw.data || raw;
const name = path.basename(srcPath, '.json');
const notes = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null && o.layer < PARTS);
if (!notes.length) { console.error('no pitched notes in ' + srcPath); process.exit(1); }

const t0 = Math.min(...notes.map(o => o.startSeconds));
const tEnd = Math.max(...notes.map(o => o.endSeconds));
const span = tEnd - t0;
const FP_UNTIL = parseFloat(flag('fp-until', (t0 + span * 0.55).toFixed(2)));
const STAC_FROM = parseFloat(flag('stac-from', (t0 + span * 0.78).toFixed(2)));

// lanes, sorted; we mutate in place and re-check as we go
const lanes = Array.from({ length: PARTS }, () => []);
notes.forEach(o => lanes[o.layer].push(o));
lanes.forEach(l => l.sort((a, b) => a.startSeconds - b.startSeconds));

// does pitch p, sounding `dur` from time s, fit on lane L without touching anything?
function fits(L, s, dur, p, exclude) {
  for (const o of lanes[L]) {
    if (o === exclude) continue;
    const a = o.startSeconds <= s ? o : null;
    if (a) {
      if (s < a.endSeconds - 1e-6) return false;
      if (s - a.endSeconds < TONGUE_RESET - 1e-6) return false;
      if (s - a.startSeconds < requiredAttack(a.sonifyNote, p) - 1e-6) return false;
    } else {
      if (o.startSeconds < s + dur - 1e-6) return false;
      if (o.startSeconds - (s + dur) < TONGUE_RESET - 1e-6) return false;
      if (o.startSeconds - s < requiredAttack(p, o.sonifyNote) - 1e-6) return false;
    }
  }
  return true;
}

let fpN = 0, stacN = 0, movedN = 0, deniedN = 0;
const deniedAt = [];
// earliest first: an early fp claims its space before later notes are considered
const inOrder = notes.slice().sort((a, b) => a.startSeconds - b.startSeconds);

for (const o of inOrder) {
  const s = o.startSeconds, p = o.sonifyNote;
  const pStac = s < FP_UNTIL ? 0 : s >= STAC_FROM ? 1 : (s - FP_UNTIL) / (STAC_FROM - FP_UNTIL);
  const wantStac = rand() < pStac;
  if (wantStac) { stacN++; continue; }              // already staccato; nothing to do

  const fpLen = oneShot('fortepiano', p);
  // 1. room where it already is?
  if (fits(o.layer, s, fpLen, p, o)) {
    o.technique = 'fortepiano';
    o.endSeconds = +(s + fpLen).toFixed(3);
    o.color = '#8D6E63';
    o.performanceNotes = 'FP';
    fpN++;
    continue;
  }
  // 2. another player with room — leap-aware, so the move does not create a jump
  let best = null;
  for (let L = 0; L < PARTS; L++) {
    if (L === o.layer) continue;
    if (!fits(L, s, fpLen, p, null)) continue;
    let prev = null;
    for (const q of lanes[L]) { if (q.startSeconds > s) break; prev = q; }
    const leap = prev ? Math.abs(prev.sonifyNote - p) : 0;
    const sc = leap * LEAP_WEIGHT + L;
    if (!best || sc < best.sc) best = { L, sc };
  }
  if (best) {
    lanes[o.layer].splice(lanes[o.layer].indexOf(o), 1);
    o.layer = best.L;
    o.technique = 'fortepiano';
    o.endSeconds = +(s + fpLen).toFixed(3);
    o.color = '#8D6E63';
    o.performanceNotes = 'FP·moved';
    lanes[best.L].push(o);
    lanes[best.L].sort((a, b) => a.startSeconds - b.startSeconds);
    fpN++; movedN++;
    continue;
  }
  // 3. physics says no — it stays staccato, and we say so
  stacN++; deniedN++; deniedAt.push(s);
}

// ---- verify: no new conflicts ----
function audit() {
  let hard = 0, soft = 0;
  for (const l of lanes) {
    const s = l.slice().sort((a, b) => a.startSeconds - b.startSeconds);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      if (b.startSeconds < a.endSeconds - 1e-6) hard++;
      else if (b.startSeconds - a.endSeconds < TONGUE_RESET - 1e-6) soft++;
      else if (b.startSeconds - a.startSeconds < requiredAttack(a.sonifyNote, b.sonifyNote) - 1e-6) soft++;
    }
  }
  return { hard, soft };
}
const chk = audit();

const outPath = OUT || path.join('scores', name.replace(/-packed$/, '') + '-fp.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 1));

console.log('=== ARTICULATION PASS — ' + name + ' ===');
console.log('  all fortepiano before ' + FP_UNTIL.toFixed(2) + 's  ·  crossfade to ' +
  STAC_FROM.toFixed(2) + 's  ·  all staccato after   (seed ' + SEED + ')');
console.log('  fortepiano is a FIXED one-shot 1.35-2.22 s (D9) — conversion does not stretch,\n' +
  '  it replaces a ~0.45 s staccato with a 3-5x longer note, so the roll only proposes.\n');
console.log('  fortepiano ' + String(fpN).padStart(4) + '   (' + movedN + ' moved to a player with room)');
console.log('  staccato   ' + String(stacN).padStart(4) + '   (' + deniedN + ' of these WANTED fp but no player had room)');
if (deniedAt.length) {
  console.log('             denied between ' + Math.min(...deniedAt).toFixed(1) + 's and ' +
    Math.max(...deniedAt).toFixed(1) + 's — the density decided, not the dice');
}
console.log('\n  VERIFY: HARD=' + chk.hard + '  soft=' + chk.soft);

// articulation by 2 s window, so the crossfade is visible
console.log('\n  articulation profile:');
for (let w = Math.floor(t0); w < tEnd; w += 2) {
  const inW = notes.filter(o => o.startSeconds >= w && o.startSeconds < w + 2);
  if (!inW.length) continue;
  const f = inW.filter(o => o.technique === 'fortepiano').length;
  console.log('    ' + String(w).padStart(2) + '-' + (w + 2) + 's  ' +
    String(inW.length).padStart(3) + ' notes   fp ' + String(f).padStart(3) + '  ' +
    'F'.repeat(f) + '.'.repeat(inW.length - f));
}
console.log('\n  wrote ' + outPath);
