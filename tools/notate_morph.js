#!/usr/bin/env node
// notate_morph.js — build a morph-section notation page.
//
// THE TEMPLATE (day 35). Everything the composer settled on T1/BLOOM, made
// general. Read docs/MORPH_NOTATION.md before changing anything here — every
// number in it is derived and has a reason.
//
//   node tools/notate_morph.js --group grp-act-bloom-01-01 --id morph-bloom --apply
//   node tools/notate_morph.js --group grp-act-converge-01-01 --part 3 --id x
//
// --part defaults to ALL ten; pass a number for a single part.
// Without --apply it prints what it would write and touches nothing.
//
// WHAT IT DRAWS (composer's dictation, day 35):
//   · the normal staff and the normal bass clef — no special furniture
//   · a HEADER at each part's entry: the section's two written pitches as small
//     black noteheads with a gliss line between (ONE head where there is no
//     glissando), and beneath it, on the house dynamic row, a drawn niente
//     circle · arrow · end mark
//   · ONE go line at every breath onset, and nothing else per breath. No
//     noteheads along the curve — settled day 35. A beating-speed indicator may
//     join the go line later at chosen junctures; a head at every onset will not.
//   · TWO interpolated curves: glissando brightOrange over the TOP half of the
//     lane, crescendo limeGreen over the BOTTOM. Filled, no border, each
//     normalised to its own extremes so it fills its half — the composer's
//     principle: the curve traces TOTAL DISPLACEMENT, its bottom the lowest
//     pitch reached in the section and its top the highest.
//   · TWO meters (glissMeter · crescMeter) and no follower dots

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const Core = require(path.join(ROOT, 'score', 'public', 'sonify_core.js'));

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const has = n => process.argv.includes('--' + n);

const GROUP = arg('group');
const PARTS_ARG = arg('part', 'all');
const ID = arg('id');
const SCORE = arg('score', 'piece-s27');
const APPLY = has('apply');
const PAD = +arg('pad', 3.9);
const LABEL = arg('label');

if (!GROUP || !ID) {
  console.error('usage: --group <groupId> [--part <0-9>|all] --id <ir-id> [--label "..."] [--apply]');
  process.exit(2);
}

const sc = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', SCORE + '.json'), 'utf8'));
const ALL = sc.objects.filter(o => o.groupId === GROUP && o.type === 'waveCurve' && o.layer < 10);
if (!ALL.length) { console.error('no tones for group ' + GROUP); process.exit(2); }
const PARTS = PARTS_ARG === 'all'
  ? [...new Set(ALL.map(o => o.layer))].sort((a, b) => a - b)
  : [+PARTS_ARG];

const NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STEPS = { 0: ['C', 0], 1: ['C', 1], 2: ['D', 0], 3: ['D', 1], 4: ['E', 0], 5: ['F', 0],
                6: ['F', 1], 7: ['G', 0], 8: ['G', 1], 9: ['A', 0], 10: ['A', 1], 11: ['B', 0] };
const nameOf = m => NM[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

function crom(P, x) {
  const n = P.length - 1, f = x * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
    + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}
// capped at 25: past that the curve stops interpolating the gesture and starts
// tracing the sounding data, wobble included — the one thing to remove
const LADDER = [9, 13, 17, 21, 25];
const NS = 400;

function buildPart(PART) {
  const tones = ALL.filter(o => o.layer === PART).sort((a, b) => a.startSeconds - b.startSeconds);
  if (!tones.length) return null;
  const T_ENTRY = tones[0].startSeconds, T_END = tones[tones.length - 1].endSeconds;

  function sampleFull(kind, n) {
    const out = []; let last = 0;
    for (let i = 0; i <= n; i++) {
      const t = T_ENTRY + (i / n) * (T_END - T_ENTRY);
      const o = tones.find(x => t >= x.startSeconds && t <= x.endSeconds);
      // PITCH IS note + bend. morphBend is kept inside its +/-199 c range by
      // RE-SPELLING: a far-travelling voice shifts note number by a semitone and
      // the bend re-centres ~97 c the other way. The sounding pitch stays
      // continuous while the bend series jumps — fitting the bend alone gave a
      // 90 c error on CONVERGE that no number of anchors could fix. (day 35)
      if (o) last = kind === 'bend'
        ? o.sonifyNote * 100 + Core.morphBendAt(o.morphBend, t - o.startSeconds)
        : Core.evalWaveCurve(o, (t - o.startSeconds) / (o.endSeconds - o.startSeconds));
      out.push(last);
    }
    return out;
  }
  // THE ANCHOR COUNT IS MEASURED: try the ladder, take the smallest whose rms is
  // within 25 % of the best. Reproduces 21 (bend) and 13 (level) on T1/BLOOM.
  function fitCurve(kind) {
    const fine = sampleFull(kind, 1200);
    const trials = LADDER.map(n => {
      const P = []; for (let k = 0; k < n; k++) P.push(fine[Math.round(k / (n - 1) * (fine.length - 1))]);
      let m = 0, ss = 0;
      for (let i = 0; i < fine.length; i++) { const d = Math.abs(crom(P, i / (fine.length - 1)) - fine[i]); if (d > m) m = d; ss += d * d; }
      return { n, P, max: m, rms: Math.sqrt(ss / fine.length) };
    });
    const bestRms = Math.min(...trials.map(t => t.rms));
    const pick = trials.find(t => t.rms <= bestRms * 1.25);
    // normalise to the curve's OWN min..max — the composer's principle
    const loV = Math.min(...fine), hiV = Math.max(...fine), spread = (hiV - loV) || 1;
    const samples = [];
    for (let i = 0; i <= NS; i++) samples.push(+Math.max(0, Math.min(1, (crom(pick.P, i / NS) - loV) / spread)).toFixed(5));
    return { samples, anchors: pick.n, max: pick.max, rms: pick.rms, fine, loV, hiV };
  }
  const G = fitCurve('bend'), L = fitCurve('level');

  const baseMidi = tones[0].sonifyNote;
  const loC = G.loV, hiC = G.hiV, extent = hiC - loC, startC = G.fine[0];
  const dir = (hiC - startC) >= (startC - loC) ? 1 : -1;
  // a non-zero glissando is written as AT LEAST one quarter tone, in the
  // direction it travels — a choice to show the gesture, not a rounding
  const qSteps = Math.max(extent > 1 ? 1 : 0, Math.round(extent / 50));
  const accName = qSteps === 0 ? null : (dir > 0 ? 'quarterSharp' : 'quarterFlat');
  const accOn = qSteps === 0 ? null : (dir > 0 ? 'high' : 'low');
  const sp = STEPS[((baseMidi % 12) + 12) % 12];
  const spelled = { step: sp[0], alter: sp[1], octave: Math.floor(baseMidi / 12) - 1 };

  const events = [], chunks = [], overlays = [];
  tones.forEach((o, i) => {
    const id = 'ev-' + o.id;
    events.push({ id, source: { score: SCORE, objectId: o.id },
      onset: o.startSeconds, duration: o.endSeconds - o.startSeconds,
      pitch: { midi: o.sonifyNote, spelled }, technique: 'ord', provenance: 'derived' });
    chunks.push({ id: 'ch-' + ID + '-p' + PART + '-' + (i + 1), part: PART,
      span: [o.startSeconds, o.endSeconds], class: 'morph-tone',
      strategy: 'unresolved', events: [id], provenance: 'derived' });
    overlays.push({ id: 'ov-dev-' + ID + '-p' + PART + '-' + (i + 1), kind: 'engraving',
      target: { event: id },
      value: { device: {
        goLine: true,
        onsetHead: false, onsetAcc: null,
        brick: false, nhUnit: false, gc: false, ringBar: false,
        curve: false, cut: false, dynPair: false, dynMark: false, techText: false
      } }, provenance: 'authored' });
  });
  overlays.unshift({ id: 'ov-header-' + ID + '-p' + PART, kind: 'header',
    target: { part: PART, t: T_ENTRY },
    value: { endMark: 'fff', acc: accName, accOn, oneHead: qSteps === 0 },
    provenance: 'authored' });
  if (qSteps > 0) overlays.unshift({ id: 'ov-gliss-' + ID + '-p' + PART, kind: 'gliss',
    target: { part: PART, span: [T_ENTRY, T_END] },
    value: { samples: G.samples, fit: G.anchors + ' anchors; max ' + G.max.toFixed(2) + ' c' },
    provenance: 'authored' });
  overlays.unshift({ id: 'ov-cresc-' + ID + '-p' + PART, kind: 'cresc',
    target: { part: PART, span: [T_ENTRY, T_END] },
    value: { samples: L.samples, fit: L.anchors + ' anchors; max ' + L.max.toFixed(3) },
    provenance: 'authored' });

  return { PART, tones, T_ENTRY, T_END, G, L, baseMidi, loC, hiC, extent, qSteps,
           accName, events, chunks, overlays };
}

const built = PARTS.map(buildPart).filter(Boolean);
const events = [].concat(...built.map(b => b.events));
const chunks = [].concat(...built.map(b => b.chunks));
const overlays = [].concat(...built.map(b => b.overlays));
const T_ENTRY = Math.min(...built.map(b => b.T_ENTRY));
const T_END = Math.max(...built.map(b => b.T_END));
const secs = T_END - T_ENTRY;

// ---------------------------------------------------------------- report
const SECT = GROUP.replace('grp-act-', '').replace('-01-01', '').toUpperCase();
console.log('');
console.log(SECT + '   ' + T_ENTRY.toFixed(2) + ' -> ' + T_END.toFixed(2) + ' s   ('
  + secs.toFixed(0) + ' s, ' + built.length + ' part' + (built.length > 1 ? 's' : '') + ')');
console.log('');
console.log(' part  base   displacement   written        gliss fit   cresc fit   breaths');
let refused = null;
built.forEach(b => {
  const written = b.qSteps === 0 ? 'ONE pitch'
    : (b.qSteps + ' qt ' + (b.accName === 'quarterSharp' ? 'UP' : 'DOWN'));
  console.log('  T' + String(b.PART + 1).padEnd(3),
    nameOf(b.baseMidi).padEnd(5),
    (b.extent.toFixed(1) + ' c').padStart(11),
    '  ' + written.padEnd(13),
    (b.qSteps === 0 ? '—' : b.G.max.toFixed(2) + ' c').padStart(9),
    (b.L.max.toFixed(3)).padStart(10),
    String(b.tones.length).padStart(8));
  if (b.qSteps > 0 && b.G.max > 25) refused = b;
});

if (refused) {
  console.error('');
  console.error('REFUSED: T' + (refused.PART + 1) + ' cannot be said as ONE smooth curve —');
  console.error('  fit error ' + refused.G.max.toFixed(1) + ' c (limit 25 = half a quarter tone; past');
  console.error('  that the drawn line puts the player in the WRONG quarter tone).');
  console.error('  See docs/MORPH_NOTATION.md.');
  process.exit(1);
}

const W0 = +(T_ENTRY - PAD).toFixed(2), W1 = +(T_END + 2).toFixed(2);
const ir = {
  irVersion: '0.1', id: ID,
  label: LABEL || ('MORPH ' + SECT + (PARTS.length > 1 ? '' : ' — T' + (PARTS[0] + 1))),
  source: { score: SCORE, window: [W0, W1], parts: PARTS },
  provenance: {
    createdBy: 'tools/notate_morph.js', date: arg('date', '2026-08-24'),
    notes: 'The morph-section template (day 35). See docs/MORPH_NOTATION.md.',
    build: 'node tools/notate_morph.js --group ' + GROUP + ' --part ' + PARTS_ARG
         + ' --id ' + ID + ' --score ' + SCORE + (LABEL ? ' --label "' + LABEL + '"' : '') + ' --apply'
  },
  events, chunks, overlays,
  animated: { curveFollower: false, envFollower: false, lineWedge: false },
  layoutPolicy: { bracketSide: 'above' }
};

console.log('');
console.log('  window ' + W0 + ' - ' + W1 + '   |  ' + events.length + ' events, ' + overlays.length + ' overlays');
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
