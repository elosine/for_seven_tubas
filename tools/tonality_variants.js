#!/usr/bin/env node
// tonality_variants.js — re-pitch a finished, ORCHESTRATED gesture onto a set of
// tonalities and lay the versions end to end for auditioning.
// (composer 2026-08-16, standing in for the tonality sub-menu — PLAN 2u)
//
// Same remap the cluster sandbox uses (clusterview.html `viewEvents`):
//   POOLED   the target's pitch CLASSES spread over the whole range, so the
//            gesture keeps its register and its contour — each note goes to the
//            nearest member. This is the default and the only sane one for a
//            three-octave density build.
//   LITERAL  exactly the target's notes; collapses the range hard.
//   no-repeat kick: two DISTINCT source pitches landing on the same target get
//            bumped apart; repeats already in the source stay repeats.
//
// WHAT IS DIFFERENT HERE vs the sandbox: the input is already distributed across
// ten players, and re-pitching changes PLAYABILITY —
//   * a fixed one-shot's length depends on its pitch (staccato 0.33-0.53 s,
//     fortepiano 1.35-2.22 s), so a remap can lengthen a note into its neighbour
//   * the soft rule is leap-dependent (0.11 + 0.0093/semitone), so changed
//     intervals change what is comfortable
// So after each remap this tool re-lengths every fixed note, re-checks, and
// moves ONLY the notes that ended up conflicted to a legal player (leap-aware).
// Lanes are otherwise left alone, so the variants stay comparable by ear.
//
//   node tools/tonality_variants.js scores/densBld03-take1-fp.json \
//        --out scores/densBld03-tonalities.json [--gap 3] [--literal]

const fs = require('fs');
const path = require('path');

const PARTS = 10, LO = 30, HI = 67;
const TONGUE_RESET = 0.03, MIN_ATTACK = 0.11, PER_SEMITONE = 0.0093, MAX_LEAP_ADD = 0.22;
const LEAP_WEIGHT = 120;
const VARIABLE = new Set(['ord', 'cuivre']);
const ARTIC_COLOR = { staccato: '#607D8B', fortepiano: '#8D6E63', ord: '#2E7D32', cuivre: '#FF9C54' };

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const SRC = args[0];
const OUT = flag('out', 'scores/tonality-variants.json');
const GAP = parseFloat(flag('gap', '3'));
const POOL = !args.includes('--literal');
if (!SRC || SRC.startsWith('--')) {
  console.error('usage: node tools/tonality_variants.js <score.json> --out <file> [--gap 3] [--literal]');
  process.exit(1);
}

const SL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bank', 'sample_lengths.json'), 'utf8'));
function oneShot(tech, pitch) {
  const t = SL[tech]; if (!t) return null;
  if (t[pitch] != null) return t[pitch];
  const k = Object.keys(t).map(Number); let b = k[0];
  k.forEach(x => { if (Math.abs(x - pitch) < Math.abs(b - pitch)) b = x; });
  return t[b];
}

// ---- Messiaen modes of limited transposition. Mode 1 (whole tone) and mode 2
// (octatonic) are deliberately absent — the composer excluded both. ----
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MESSIAEN = {
  3: [0, 2, 3, 4, 6, 7, 8, 10, 11],        // 9 notes — the richest, nearly chromatic
  4: [0, 1, 2, 5, 6, 7, 8, 11],            // 8 notes
  5: [0, 1, 5, 6, 7, 11],                  // 6 notes — the starkest
  6: [0, 2, 4, 5, 6, 8, 10, 11],           // 8 notes — the one already in the piece (DB2)
  7: [0, 1, 2, 3, 5, 6, 7, 8, 10, 11],     // 10 notes — densest
};
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pcsPool = pcs => range(LO, HI).filter(m => pcs.includes(((m % 12) + 12) % 12));
const mode = (n, root) => pcsPool(MESSIAEN[n].map(d => (root + d) % 12));

// The set the composer asked for: the Messiaen modes at a VARIETY of
// transpositions (m6/F is the one already used in DB2, kept for comparison),
// the original, and an assortment. Roots lean on the piece's F and Bb anchors.
const VARIANTS = [
  { label: 'ORIGINAL (no remap)', target: null },
  { label: 'Messiaen m3 on F', target: mode(3, 5) },
  { label: 'Messiaen m4 on Bb', target: mode(4, 10) },
  { label: 'Messiaen m6 on F  (as in DB2)', target: mode(6, 5) },
  { label: 'Messiaen m7 on C#', target: mode(7, 1) },
  { label: 'Messiaen m5 on F#', target: mode(5, 6) },
  { label: 'BbE 2-oct cluster', target: [...range(34, 40), ...range(58, 64)] },
  { label: 'fifths on F#', target: [30, 37, 44, 51, 58, 65] },
  { label: 'Bhairav on F', target: pcsPool([0, 1, 4, 5, 7, 8, 11].map(d => (5 + d) % 12)) },
];

// ---- load the source gesture ----
const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const data = raw.data || raw;
const srcNotes = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null && o.layer < PARTS)
  .sort((a, b) => a.startSeconds - b.startSeconds);
if (!srcNotes.length) { console.error('no notes in ' + SRC); process.exit(1); }
const T0 = Math.min(...srcNotes.map(o => o.startSeconds));

// ---- the remap (clusterview's algorithm) ----
function remap(notes, targetLit) {
  const target = POOL ? pcsPool([...new Set(targetLit.map(q => ((q % 12) + 12) % 12))]) : targetLit.slice();
  const nearestIn = (q, excl) => {
    let best = null, bd = 1e9;
    for (const m of target) {
      if (excl && excl.has(m)) continue;
      const d = Math.abs(m - q);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  };
  const map = {};
  const out = notes.map(o => ({ src: o, p: null }));
  for (const e of out) {
    if (map[e.src.sonifyNote] === undefined) map[e.src.sonifyNote] = nearestIn(e.src.sonifyNote);
    e.p = map[e.src.sonifyNote];
  }
  // no-repeat kick, per attack moment
  let prevP = null, prevSrc = null, curT = null, used = new Set();
  for (const e of out) {
    const t = e.src.startSeconds;
    if (curT === null || Math.abs(t - curT) > 0.001) { curT = t; used = new Set(); }
    let q = e.p;
    const clash = prevP !== null && q === prevP && e.src.sonifyNote !== prevSrc;
    if ((clash || used.has(q)) && target.length > 1) {
      const excl = new Set(used);
      if (prevP !== null && e.src.sonifyNote !== prevSrc) excl.add(prevP);
      const alt = nearestIn(e.src.sonifyNote, excl);
      if (alt !== null) q = alt;
    }
    used.add(q); prevP = q; prevSrc = e.src.sonifyNote;
    e.p = q;
  }
  return out;
}

// ---- playability, same rule as the app ----
const reqAtk = (pa, pb) => MIN_ATTACK + Math.min(MAX_LEAP_ADD, Math.abs(pb - pa) * PER_SEMITONE);
function tierPair(a, b) {   // a starts first; {s,e,p}
  if (b.s < a.e - 1e-6) return 'hard';
  if (b.s - a.e < TONGUE_RESET - 1e-6) return 'soft';
  return (b.s - a.s) < reqAtk(a.p, b.p) - 1e-6 ? 'soft' : 'free';
}
function laneTier(list, c, exclude) {
  let w = 'free';
  for (const o of list) {
    if (o === exclude) continue;
    const t = (o.s <= c.s) ? tierPair(o, c) : tierPair(c, o);
    if (t === 'hard') return 'hard';
    if (t === 'soft') w = 'soft';
  }
  return w;
}

// ---- build one variant: remap, re-length, repair only what broke ----
function makeVariant(v) {
  const mapped = v.target ? remap(srcNotes, v.target)
                          : srcNotes.map(o => ({ src: o, p: o.sonifyNote }));
  const notes = mapped.map(m => {
    const tech = m.src.technique || 'staccato';
    const drawn = m.src.endSeconds - m.src.startSeconds;
    const len = VARIABLE.has(tech) ? drawn : (oneShot(tech, m.p) || drawn);
    return { src: m.src, p: m.p, tech, s: m.src.startSeconds, e: m.src.startSeconds + len,
             layer: m.src.layer, moved: false };
  });
  const lanes = Array.from({ length: PARTS }, () => []);
  notes.forEach(n => lanes[n.layer].push(n));
  lanes.forEach(l => l.sort((a, b) => a.s - b.s));

  // REPAIR PASS. Only HARD is repaired: it is physics and cannot be tuned away,
  // while soft is an estimate that may only tint something amber (D17). And a
  // soft destination is accepted for a hard note — trading physics for an
  // estimate is always the right direction. Accepting only fully-free lanes
  // moved nothing at all at this density, which is how the first version of
  // this loop managed a repair count of zero across every variant.
  const RANK = { free: 0, soft: 1, hard: 2 };
  let moved = 0, stuck = 0;
  for (const n of notes.slice().sort((a, b) => a.s - b.s)) {
    if (laneTier(lanes[n.layer], n, n) !== 'hard') continue;
    let best = null;
    for (let L = 0; L < PARTS; L++) {
      if (L === n.layer) continue;
      const tier = laneTier(lanes[L], n, null);
      if (tier === 'hard') continue;
      let prev = null;
      for (const q of lanes[L]) { if (q.s > n.s) break; prev = q; }
      const sc = RANK[tier] * 1e6 + (prev ? Math.abs(prev.p - n.p) : 0) * LEAP_WEIGHT + L;
      if (!best || sc < best.sc) best = { L, sc };
    }
    if (best) {
      lanes[n.layer].splice(lanes[n.layer].indexOf(n), 1);
      n.layer = best.L; n.moved = true; moved++;
      lanes[best.L].push(n); lanes[best.L].sort((a, b) => a.s - b.s);
    } else stuck++;
  }
  // final census
  let hard = 0, soft = 0;
  for (const l of lanes) for (let i = 1; i < l.length; i++) {
    const t = tierPair(l[i - 1], l[i]);
    if (t === 'hard') hard++; else if (t === 'soft') soft++;
  }
  const pitches = notes.map(n => n.p);
  return { notes, moved, stuck, hard, soft,
    lo: Math.min(...pitches), hi: Math.max(...pitches),
    distinct: new Set(pitches).size };
}

// ---- assemble ----
const out = JSON.parse(JSON.stringify(data));
const objs = [], marks = [];
let id = 1, off = 0;
const rows = [];
const pn = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

for (const v of VARIANTS) {
  const r = makeVariant(v);
  const end = Math.max(...r.notes.map(n => n.e)) - T0;
  // the conflict count goes IN the label: a variant with hard conflicts sounds
  // perfectly fine in the mock-up (2r — technique is a MIDI channel, so a
  // double-booked player still renders cleanly) and you would never hear that it
  // is unplayable. It has to be readable at the moment you are choosing.
  marks.push({ id: 'mk-' + (id++), type: 'marker', layer: 0, time: +off.toFixed(3),
    label: v.label + '  · ' + r.distinct + ' pitches ' + pn(r.lo) + '–' + pn(r.hi) +
      (r.hard ? '  · ⚠ ' + r.hard + ' HARD (unplayable as-is)'
              : r.soft ? '  · ' + r.soft + ' soft' : '  · clean'),
    color: r.hard ? '#B84A4A' : '#9B5B8E', performanceNotes: '', properties: {} });
  for (const n of r.notes) {
    const c = JSON.parse(JSON.stringify(n.src));
    c.id = 'wc-' + (id++);
    c.layer = n.layer;
    c.sonifyNote = n.p;
    c.startSeconds = +(off + n.s - T0).toFixed(3);
    c.endSeconds = +(off + n.e - T0).toFixed(3);
    c.groupId = 'ton-' + rows.length;
    c.performanceNotes = v.label;
    c.color = ARTIC_COLOR[n.tech] || c.color;
    objs.push(c);
  }
  marks.push({ id: 'mk-' + (id++), type: 'marker', layer: 0, time: +(off + end).toFixed(3),
    label: '— end ' + v.label + ' —', color: '#9B5B8E', performanceNotes: '', properties: {} });
  rows.push({ v, r, at: off, end });
  off += end + GAP;
}

out.objects = objs; out.markers = marks; out.nextId = id;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

console.log('=== TONALITY VARIANTS — ' + path.basename(SRC) + ' ===');
console.log('  mode: ' + (POOL ? 'POOLED (pitch classes over the full range — keeps register + contour)'
                                : 'LITERAL (exactly the target notes)') + '\n');
console.log('     at        variant                          pitches  range        moved  stuck  HARD  soft');
rows.forEach(x => console.log(
  '  ' + (x.at.toFixed(1) + 's').padStart(7) + '   ' + x.v.label.padEnd(32) +
  String(x.r.distinct).padStart(5) + '   ' + (pn(x.r.lo) + '–' + pn(x.r.hi)).padEnd(11) +
  String(x.r.moved).padStart(6) + String(x.r.stuck).padStart(7) +
  String(x.r.hard).padStart(6) + String(x.r.soft).padStart(6)));
console.log('\n  total ' + (off - GAP).toFixed(1) + 's   wrote ' + OUT);
console.log('  moved = notes the remap made HARD, relocated to a legal player (leap-aware)');
console.log('  stuck = hard notes with nowhere to go — these ARE the HARD count');
console.log('  soft  = estimates only; they tint amber and never block (D17)');
