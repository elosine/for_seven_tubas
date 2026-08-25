#!/usr/bin/env node
// notate_morph.js — build a morph-section notation page for ONE part.
//
// THE TEMPLATE (day 35). Everything the composer settled on T1/BLOOM, made
// general: run it for any part of any morph group and it produces the same
// vocabulary. Read docs/MORPH_NOTATION.md before changing anything here — the
// numbers in it are derived, and each one has a reason.
//
//   node tools/notate_morph.js --group grp-act-bloom-01-01 --part 0 --id morph-x01
//   node tools/notate_morph.js --group grp-act-converge-01-01 --part 3 --id morph-c-t4 --apply
//
// Without --apply it prints what it WOULD write and touches nothing.
//
// WHAT IT DRAWS (composer's dictation, day 35):
//   · the normal staff and the normal bass clef — no special furniture
//   · a HEADER at the section entry: two small black noteheads (the section's
//     two written pitches) with a gliss line between them, and beneath it, on
//     the house dynamic row, a niente circle · arrow · end mark
//   · ONE go line at every breath onset. No noteheads at the onsets — the
//     glissando curve already says where the pitch has got to
//   · TWO interpolated curves: the glissando in brightOrange over the TOP half
//     of the lane, the crescendo in limeGreen over the BOTTOM half. Filled, no
//     border, each normalised to its own peak so it fills its half
//   · TWO meters (glissMeter · crescMeter) and no follower dots

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const Core = require(path.join(ROOT, 'score', 'public', 'sonify_core.js'));

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const has = n => process.argv.includes('--' + n);

const GROUP = arg('group');
const PART = arg('part') != null ? +arg('part') : null;
const ID = arg('id');
const SCORE = arg('score', 'piece-s27');
const APPLY = has('apply');
const PAD = +arg('pad', 3.9);              // seconds of window before the entry, for the header
const LABEL = arg('label');

if (!GROUP || PART == null || !ID) {
  console.error('usage: --group <groupId> --part <0-9> --id <ir-id> [--score piece-s27] [--label "..."] [--apply]');
  process.exit(2);
}

const sc = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', SCORE + '.json'), 'utf8'));
const tones = sc.objects
  .filter(o => o.groupId === GROUP && o.layer === PART && o.type === 'waveCurve')
  .sort((a, b) => a.startSeconds - b.startSeconds);
if (!tones.length) { console.error('no tones for group ' + GROUP + ' part ' + PART); process.exit(2); }

const T_ENTRY = tones[0].startSeconds;
const T_END = tones[tones.length - 1].endSeconds;

// ---------------------------------------------------------------- sampling
function sampleFull(kind, n) {
  const out = []; let last = 0;
  for (let i = 0; i <= n; i++) {
    const t = T_ENTRY + (i / n) * (T_END - T_ENTRY);
    const o = tones.find(x => t >= x.startSeconds && t <= x.endSeconds);
    // PITCH IS note + bend, NOT the bend alone. The engine keeps morphBend
    // inside its +/-199 c range by re-spelling: when a voice travels far, the
    // note NUMBER shifts by a semitone and the bend re-centres by ~97 c the
    // other way. The sounding pitch stays continuous (+/-3 c) but the bend
    // series jumps. BLOOM never changes note, so fitting the bend worked there
    // by luck; CONVERGE re-spells four times and fitting the bend alone gave a
    // 90 c error no number of anchors could fix. (day 35)
    if (o) last = kind === 'bend'
      ? o.sonifyNote * 100 + Core.morphBendAt(o.morphBend, t - o.startSeconds)
      : Core.evalWaveCurve(o, (t - o.startSeconds) / (o.endSeconds - o.startSeconds));
    out.push(last);
  }
  return out;
}
function crom(P, x) {
  const n = P.length - 1, f = x * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
    + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}
// THE ANCHOR COUNT IS MEASURED, NOT HARDCODED: try a ladder, take the KNEE —
// the SMALLEST count whose rms is within 25 % of the best available. Fewer
// anchors is not just cheaper: on T1/BLOOM 21 anchors give a WORSE rms than 25
// (0.196 vs 0.163 c) but a BETTER worst case (0.767 vs 0.953 c), and the worst
// case is what a reader sees. The 25 % knee reproduces 21 for the bend and 13
// for the level — the counts the composer approved on T1/BLOOM.
// capped at 25: past that the curve stops being an interpolation of the
// gesture and becomes a tracing of the sounding data, wobble included — which
// is the one thing the composer asked to remove.
const LADDER = [9, 13, 17, 21, 25];
function fitCurve(kind, N) {
  const fine = sampleFull(kind, 1200);
  const trials = LADDER.map(n => {
    const P = []; for (let k = 0; k < n; k++) P.push(fine[Math.round(k / (n - 1) * (fine.length - 1))]);
    let m = 0, ss = 0;
    for (let i = 0; i < fine.length; i++) { const d = Math.abs(crom(P, i / (fine.length - 1)) - fine[i]); if (d > m) m = d; ss += d * d; }
    return { n, P, max: m, rms: Math.sqrt(ss / fine.length) };
  });
  const bestRms = Math.min(...trials.map(t => t.rms));
  const pick = trials.find(t => t.rms <= bestRms * 1.25);
  // normalise against the curve's OWN min..max — the composer's rule: the
  // bottom of the drawn curve is the lowest pitch reached in the section and
  // the top is the highest, whatever the interval between them
  const loV = Math.min(...fine), hiV = Math.max(...fine), spread = (hiV - loV) || 1;
  const span = spread;
  const samples = [];
  for (let i = 0; i <= N; i++) samples.push(+Math.max(0, Math.min(1, (crom(pick.P, i / N) - loV) / spread)).toFixed(5));
  return { samples, anchors: pick.n, max: pick.max, rms: pick.rms, span, fine, trials };
}

const NS = 400;
const G = fitCurve('bend', NS);
const L = fitCurve('level', NS);

// ---------------------------------------------------------------- the two written pitches
const baseMidi = tones[0].sonifyNote;
// G.fine is now absolute pitch in cents; the extremes ARE the section's two pitches
const loC = Math.min(...G.fine), hiC = Math.max(...G.fine);
const extent = hiC - loC;                                    // total displacement, always >= 0
// which way does the part travel FROM its starting pitch? The header shows the
// LOWEST pitch on the left and the HIGHEST on the right; the accidental belongs
// on whichever of the two is not the starting note.
const startC = G.fine[0];
const dir = (hiC - startC) >= (startC - loC) ? 1 : -1;
// THE COMPOSER'S RULE (day 35): the written figure shows the section's two
// pitches to the closest QUARTER TONE — but a glissando smaller than half a
// quarter tone would round to a single pitch and say nothing, so a non-zero
// gliss is written as AT LEAST one quarter tone. That is a compositional
// choice to show the gesture, not a rounding; see docs/MORPH_NOTATION.md.
const qSteps = Math.max(extent > 1 ? 1 : 0, Math.round(extent / 50));
const accName = qSteps === 0 ? null : (dir > 0 ? 'quarterSharp' : 'quarterFlat');
// dir > 0: the part rises, so the HIGH (right) head is the altered one
// dir < 0: the part falls, so the LOW (left) head is the altered one
const accOn = qSteps === 0 ? null : (dir > 0 ? 'high' : 'low');
const NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STEPS = { 0: ['C', 0], 1: ['C', 1], 2: ['D', 0], 3: ['D', 1], 4: ['E', 0], 5: ['F', 0],
                6: ['F', 1], 7: ['G', 0], 8: ['G', 1], 9: ['A', 0], 10: ['A', 1], 11: ['B', 0] };
const sp = STEPS[((baseMidi % 12) + 12) % 12];
const spelled = { step: sp[0], alter: sp[1], octave: Math.floor(baseMidi / 12) - 1 };

// ---------------------------------------------------------------- assemble
const events = [], chunks = [], overlays = [];
tones.forEach((o, i) => {
  const id = 'ev-' + o.id;
  events.push({
    id, source: { score: SCORE, objectId: o.id },
    onset: o.startSeconds, duration: o.endSeconds - o.startSeconds,
    pitch: { midi: o.sonifyNote, spelled }, technique: 'ord', provenance: 'derived'
  });
  chunks.push({
    id: 'ch-' + ID + '-' + (i + 1), part: PART,
    span: [o.startSeconds, o.endSeconds], class: 'morph-tone',
    strategy: 'unresolved', events: [id], provenance: 'derived'
  });
  overlays.push({
    id: 'ov-dev-' + ID + '-' + (i + 1), kind: 'engraving', target: { event: id },
    value: { device: {
      goLine: true,
      // no onset heads: the glissando curve already says where the pitch is
      onsetHead: false, onsetAcc: null,
      brick: false, nhUnit: false, gc: false, ringBar: false,
      curve: false, cut: false, dynPair: false, dynMark: false, techText: false
    } }, provenance: 'authored'
  });
});

const endMark = 'fff';                      // every morph peaks in the top band — see the doc
overlays.unshift(
  { id: 'ov-header-' + ID, kind: 'header', target: { part: PART, t: T_ENTRY },
    value: { endMark, acc: accName, accOn }, provenance: 'authored' },
  { id: 'ov-gliss-' + ID, kind: 'gliss', target: { part: PART, span: [T_ENTRY, T_END] },
    value: { samples: G.samples,
      fit: G.anchors + ' anchors off the sounding bend, Catmull-Rom; max ' + G.max.toFixed(3)
         + ' c, rms ' + G.rms.toFixed(3) + ' c' }, provenance: 'authored' },
  { id: 'ov-cresc-' + ID, kind: 'cresc', target: { part: PART, span: [T_ENTRY, T_END] },
    value: { samples: L.samples,
      fit: L.anchors + ' anchors off the sounding level, Catmull-Rom; max ' + L.max.toFixed(3)
         + ', rms ' + L.rms.toFixed(3) }, provenance: 'authored' }
);

const W0 = +(T_ENTRY - PAD).toFixed(2), W1 = +(T_END + 2).toFixed(2);
const ir = {
  irVersion: '0.1', id: ID,
  label: LABEL || ('MORPH ' + GROUP.replace('grp-act-', '').replace('-01-01', '').toUpperCase()
    + ' — T' + (PART + 1)),
  source: { score: SCORE, window: [W0, W1], parts: [PART] },
  provenance: {
    createdBy: 'tools/notate_morph.js',
    date: arg('date', '2026-08-24'),
    notes: 'The morph-section template (day 35). See docs/MORPH_NOTATION.md.',
    build: 'node tools/notate_morph.js --group ' + GROUP + ' --part ' + PART + ' --id ' + ID
         + ' --score ' + SCORE + (LABEL ? ' --label "' + LABEL + '"' : '') + ' --apply'
  },
  events, chunks, overlays,
  animated: { curveFollower: false, envFollower: false, lineWedge: false },
  layoutPolicy: { bracketSide: 'above' }
};

// ---------------------------------------------------------------- report
const secs = (T_END - T_ENTRY);
console.log('');
console.log(ir.label + '   (' + GROUP + ', part ' + PART + ' = T' + (PART + 1) + ')');
console.log('  span      ' + T_ENTRY.toFixed(3) + ' -> ' + T_END.toFixed(3) + '   (' + secs.toFixed(1) + ' s, ' + tones.length + ' breaths)');
console.log('  base      midi ' + baseMidi + ' = ' + NM[baseMidi % 12] + (Math.floor(baseMidi / 12) - 1));
console.log('  gliss     ' + (loC/100).toFixed(2) + ' .. ' + (hiC/100).toFixed(2) + ' midi  = ' + extent.toFixed(1) + ' cents total   -> written as '
  + (qSteps === 0 ? 'ONE pitch (no gliss)' : qSteps + ' quarter tone' + (qSteps > 1 ? 's' : '') + ' ' + (dir > 0 ? 'UP' : 'DOWN') + '  (' + accName + ')'));
console.log('  gliss fit ' + G.anchors + ' anchors   max ' + G.max.toFixed(3) + ' c   rms ' + G.rms.toFixed(3) + ' c');
console.log('  cresc     0 .. ' + Math.max(...L.fine).toFixed(3) + '   fit ' + L.anchors + ' anchors   max '
  + L.max.toFixed(3) + '   rms ' + L.rms.toFixed(3));
console.log('  window    ' + W0 + ' - ' + W1);
if (extent > 1 && extent < 25) console.log('  FLAG      total displacement is under half a quarter tone ('
  + extent.toFixed(1) + ' c) — the written quarter tone is a CHOICE to show the gesture');

// ---------------------------------------------------------------- REFUSALS
// The template draws ONE smooth interpolated curve. That is only honest when
// the material IS one gesture. Two ways it is not — both found on day 35 by
// running this tool over all three morphs.
let turns = 0;
for (let i = 2; i < G.fine.length; i++) {
  const d1 = G.fine[i - 1] - G.fine[i - 2], d2 = G.fine[i] - G.fine[i - 1];
  if (d1 * d2 < 0 && Math.abs(d2) > 0.5) turns++;
}
const range = Math.max(...G.fine) - Math.min(...G.fine);
if (range < 1) {
  console.log('  NOTE      this part has NO GLISSANDO (range ' + range.toFixed(2) + ' c).');
  console.log('            The top half of the lane would be EMPTY and the header would show one');
  console.log('            pitch, not two. Ask the composer what the top half carries here.');
}
if (G.max > 25) {
  console.error('');
  console.error('REFUSED: this glissando cannot be said as ONE smooth curve.');
  console.error('  fit error ' + G.max.toFixed(1) + ' cents  (limit 25 = half a quarter tone; past');
  console.error('  that the drawn line puts the player in the WRONG quarter tone)');
  console.error('  range ' + range.toFixed(0) + ' c over ' + secs.toFixed(0) + ' s with ' + turns
    + ' direction reversals — an OSCILLATION, not an arc.');
  console.error('  The template is built for a single gesture. This part needs its own reading;');
  console.error('  see docs/MORPH_NOTATION.md, "Where the template stops".');
  process.exit(1);
}

if (!APPLY) { console.log('\n(dry run — pass --apply to write)\n'); process.exit(0); }

fs.writeFileSync(path.join(ROOT, 'notation', 'ir', ID + '.ir.json'), JSON.stringify(ir, null, 1));
const ip = path.join(ROOT, 'notation', 'ir', 'index.json');
const idx = JSON.parse(fs.readFileSync(ip, 'utf8'));
const list = Array.isArray(idx) ? idx : idx.entries || idx.irs || idx.items;
const row = { id: ID, label: ir.label, score: SCORE, window: [W0, W1], profile: 'section1' };
const at = list.findIndex(e => e.id === ID);
if (at >= 0) list[at] = row; else list.push(row);
fs.writeFileSync(ip, JSON.stringify(idx, null, 1));
console.log('\nWRITTEN: notation/ir/' + ID + '.ir.json   (picker row ' + (at >= 0 ? 'updated' : 'added') + ')\n');
