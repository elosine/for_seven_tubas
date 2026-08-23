// cloud02i_ab.js — PLAN 8f step 2: the CLOUD02-I listening file.
//
// Three copies of the section end to end in ONE scratch score so the composer can
// hear them side by side (composer, day 25: "a save file for just this section, and
// I can hear the original and then alternative side by side… the original and then
// b, and then next to that, after that, a"):
//
//   0.0 s  ORIGINAL              159 staccatos, exactly as in the archive
//   8.0 s  B — thin by ensemble  sounding-count cap 6, shaped by the section's own
//                                META curve, round-robin across the parts
//  16.0 s  A — thin by part      drop every note that starts inside the previous
//                                kept note's ring (D51 sample length), per part
//
// NOTHING IS CANONICAL HERE. The archive score is read-only; whichever version the
// composer picks becomes a SCORE EDIT, ledgered in docs/ARCHIVE_AMENDMENTS.md and
// applied to the archive, then re-extracted. This file is for ears only.
//
//   node tools/cloud02i_ab.js [--cap 6] [--slice 0.1] [--ringFrac 1.0]
//                             [--out scores/cloud02i-ab.json]

const fs = require('fs');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };

const SRC     = flag('src', 'scores/piece-s25-finished01.json');
const GROUP   = flag('group', 'grp-cloud02-i-01');
const OUT     = flag('out', 'scores/cloud02i-ab.json');
const CAP     = +flag('cap', 6);          // (b): peak sounding count
const SLICE   = +flag('slice', 0.1);      // (b): round-robin admission slice, seconds
const RINGFRAC= +flag('ringFrac', 1.0);   // (a): fraction of the ring that must finish
const STARTS  = [0, 8, 16];               // where each copy begins
const META_LAYER = 10;
const PARTS = 10;

// ── D51: a fixed one-shot's length is its sample length ───────────────────────
// Canonical source is the probe table; the IR carries the same numbers as event
// `duration`, and we assert the two agree before using them.
function staccatoLengths() {
  const md = fs.readFileSync('docs/SI2_staccato_lengths.md', 'utf8');
  const map = {};
  for (const line of md.split('\n')) {
    if (!/^\|\s*Staccato/.test(line)) continue;
    const c = line.split('|').map(s => s.trim());
    const midi = +(c[3].match(/\((\d+)\)/) || [])[1];
    const secs = +c[5];
    if (midi && secs) map[midi] = secs;
  }
  return map;
}

const LEN = staccatoLengths();
const lenOf = n => LEN[n] != null ? LEN[n] : 0.45;

// ── source material ───────────────────────────────────────────────────────────
const score = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const inGroup = score.objects.filter(o => o.groupId === GROUP);
const notes = inGroup
  .filter(o => o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null)
  .sort((a, b) => a.startSeconds - b.startSeconds);
const meta = inGroup.find(o => o.type === 'waveCurve' && o.layer === META_LAYER);
if (!notes.length) throw new Error('no notes in group ' + GROUP);
if (!meta) throw new Error('no META curve in group ' + GROUP);

const T0 = meta.startSeconds;
const T1 = meta.endSeconds;
const SPAN = T1 - T0;

// cross-check the lengths against the IR (D49: the IR is authoritative for sound)
try {
  const ir = JSON.parse(fs.readFileSync('notation/ir/db1.ir.json', 'utf8'));
  const byObj = new Map(ir.events.map(e => [e.source.objectId, e]));
  let checked = 0, bad = 0;
  for (const n of notes) {
    const e = byObj.get(n.id);
    if (!e || e.technique !== 'staccato') continue;
    checked++;
    if (Math.abs(e.duration - lenOf(n.sonifyNote)) > 0.005) bad++;
  }
  console.log(`D51 length check vs db1 IR: ${checked} events, ${bad} mismatched`);
  if (bad) throw new Error('SI2 table and IR durations disagree — stop and look');
} catch (err) {
  if (/disagree/.test(err.message)) throw err;
  console.log('D51 length check skipped (' + err.message + ')');
}

// ── the target curve for (b) ──────────────────────────────────────────────────
// The META curve is a RATE CONTOUR normalised to its own maximum: cloud02.js wrote
// y = 0.5 + 9*(r/max). So (y-0.5)/9 recovers the shape in 0..1, and the target
// sounding count is that shape times the cap. Nodes are interpolated with a
// smoothstep — an approximation of the drawn bezier, close enough for an envelope
// and stated here rather than hidden.
function shapeAt(t) {
  const p = Math.max(0, Math.min(1, (t - T0) / SPAN));
  const nd = meta.nodes;
  let i = 0;
  while (i < nd.length - 2 && nd[i + 1].pos < p) i++;
  const a = nd[i], b = nd[i + 1];
  const span = b.pos - a.pos;
  const u = span <= 0 ? 0 : (p - a.pos) / span;
  const s = u * u * (3 - 2 * u);
  const y = a.y + (b.y - a.y) * s;
  return Math.max(0, (y - 0.5) / 9);
}
const targetAt = t => CAP * shapeAt(t);

// ── (b) thin by ensemble: cap the sounding count, round-robin across parts ────
function thinEnsemble() {
  const kept = [];
  const lastKept = new Array(PARTS).fill(-Infinity);
  const ringing = t => kept.reduce((n, k) =>
    n + (k.startSeconds <= t && t < k.startSeconds + lenOf(k.sonifyNote) ? 1 : 0), 0);

  for (let a = T0; a < T1; a += SLICE) {
    const b = a + SLICE;
    const slice = notes.filter(n => n.startSeconds >= a && n.startSeconds < b);
    if (!slice.length) continue;
    // longest-waiting part gets first refusal on the slots in this slice
    slice.sort((x, y) =>
      (x.startSeconds - lastKept[x.layer] === y.startSeconds - lastKept[y.layer])
        ? x.startSeconds - y.startSeconds
        : (y.startSeconds - lastKept[y.layer]) - (x.startSeconds - lastKept[x.layer]));
    // Everything admitted inside one slice counts as concurrent. The slice
    // (0.1 s) is far shorter than a staccato sample (0.33–0.53 s), so notes in
    // the same slice really do overlap — and without this the priority order
    // would let a note admitted out of time-order go uncounted by the notes
    // before it, which pushed the measured peak to 9 against a cap of 6.
    let admittedHere = 0;
    for (const n of slice) {
      if (ringing(n.startSeconds) + admittedHere < targetAt(n.startSeconds)) {
        kept.push(n);
        lastKept[n.layer] = n.startSeconds;
        admittedHere++;
      }
    }
  }
  return kept.sort((x, y) => x.startSeconds - y.startSeconds);
}

// ── (a) thin by part: every note must start after the previous one has rung out ─
function thinByPart() {
  const kept = [];
  for (let L = 0; L < PARTS; L++) {
    const part = notes.filter(n => n.layer === L);
    let last = null;
    for (const n of part) {
      if (!last || n.startSeconds >= last.startSeconds + RINGFRAC * lenOf(last.sonifyNote)) {
        kept.push(n); last = n;
      }
    }
  }
  return kept.sort((x, y) => x.startSeconds - y.startSeconds);
}

// ── measurement (so the report is measured, not guessed) ──────────────────────
function census(set, label) {
  const per = new Array(PARTS).fill(0);
  for (const n of set) per[n.layer]++;
  const counts = [];
  for (let t = T0; t <= T1 + 0.6; t += 0.05) {
    counts.push(set.reduce((n, k) =>
      n + (k.startSeconds <= t && t < k.startSeconds + lenOf(k.sonifyNote) ? 1 : 0), 0));
  }
  const mean = counts.reduce((a, c) => a + c, 0) / counts.length;
  // largest gap opened inside each part
  let seams = 0;
  for (let L = 0; L < PARTS; L++) {
    const p = set.filter(n => n.layer === L);
    for (let i = 1; i < p.length; i++) if (p[i].startSeconds - p[i - 1].startSeconds >= 0.5) seams++;
  }
  return { label, n: set.length, rate: +(set.length / SPAN).toFixed(1), per,
    soundingMax: Math.max(...counts), soundingMean: +mean.toFixed(1), breathSeams: seams };
}

const B = thinEnsemble();
const A = thinByPart();
const reports = [census(notes, 'ORIGINAL'), census(B, 'B ensemble cap ' + CAP), census(A, 'A by-part')];

// ── emit the scratch score ────────────────────────────────────────────────────
let nid = 1;
const objs = [];
const COPIES = [
  { set: notes, at: STARTS[0], group: 'grp-c2i-orig', color: '#5E8C7A', tag: 'ORIGINAL',
    label: `ORIGINAL — ${notes.length} notes, ${(notes.length / SPAN).toFixed(0)}/s`, meta: 'orig' },
  { set: B, at: STARTS[1], group: 'grp-c2i-b', color: '#B5651D', tag: 'B ensemble cap ' + CAP,
    label: `B ensemble cap ${CAP} — ${B.length} notes, ${(B.length / SPAN).toFixed(0)}/s`, meta: 'target' },
  { set: A, at: STARTS[2], group: 'grp-c2i-a', color: '#4A6FA5', tag: 'A by-part',
    label: `A by-part — ${A.length} notes, ${(A.length / SPAN).toFixed(0)}/s`, meta: null },
];

for (const c of COPIES) {
  const shift = c.at - T0;
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +c.at.toFixed(3),
    label: c.label, color: c.color, groupId: c.group, performanceNotes: '', properties: {} });
  for (const n of c.set) {
    objs.push({ ...n, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(n.startSeconds + shift).toFixed(3),
      endSeconds: +(n.endSeconds + shift).toFixed(3),
      performanceNotes: c.tag });
  }
  if (c.meta === 'orig') {
    objs.push({ ...meta, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(meta.startSeconds + shift).toFixed(3),
      endSeconds: +(meta.endSeconds + shift).toFixed(3),
      performanceNotes: 'CLOUD02-I rate contour (the drawn gesture)' });
  } else if (c.meta === 'target') {
    // the cap-6 target, drawn back in the META convention so it reads like one
    const nds = meta.nodes.map(nd => ({ pos: nd.pos, y: nd.y, smooth: nd.smooth }));
    objs.push({ ...meta, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(meta.startSeconds + shift).toFixed(3),
      endSeconds: +(meta.endSeconds + shift).toFixed(3),
      nodes: nds,
      performanceNotes: `target sounding count ${(CAP * shapeAt(T0)).toFixed(1)}–${CAP} (same shape, capped)` });
  }
}

const out = {
  version: score.version, layoutVersion: score.layoutVersion,
  tracks: score.tracks, assets: {},
  metadata: {
    created: new Date().toISOString(), modified: new Date().toISOString(),
    provenance: {
      build: 'node ' + ['tools/cloud02i_ab.js', ...args].join(' '),
      source: SRC, group: GROUP, window: [+T0.toFixed(3), +T1.toFixed(3)],
      note: 'SCRATCH — three copies of CLOUD02-I for A/B listening. Nothing canonical; '
          + 'the chosen version becomes a SCORE EDIT ledgered in docs/ARCHIVE_AMENDMENTS.md.',
      census: reports,
    },
  },
  objects: objs, markers: [],
  databases: score.databases, nextId: nid,
  viewport: { pixelsPerSecond: 120, scrollOffset: 0 },
};
fs.writeFileSync(OUT, JSON.stringify(out));

for (const r of reports) {
  console.log(`${r.label.padEnd(18)} ${String(r.n).padStart(3)} notes  ${String(r.rate).padStart(4)}/s  `
    + `sounding max ${String(r.soundingMax).padStart(2)} mean ${r.soundingMean}  `
    + `breath seams ${r.breathSeams}  per part [${r.per.join(' ')}]`);
}
console.log('\nwrote ' + OUT + ' — ' + objs.length + ' objects, copies at ' + STARTS.join('s / ') + 's');
