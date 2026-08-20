#!/usr/bin/env node
// test_splice.js — B6 gate: cut preference, beat snapping, full-section
// coverage, the STAMP-ATOMIC PROOF (no beam group straddles any cut on the
// real section), continuation labels end-to-end, snapshot + --prove-red.
//   node tools/test_splice.js [--update] [--prove-red]

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Splice = require(path.join(ROOT, 'notation', 'lib', 'splice.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Render = require(path.join(ROOT, 'notation', 'lib', 'render.js'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'page_rules.json'), 'utf8'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'splice_snapshot.json');

let failures = 0;
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };

// ---- synthetic: cuts prefer chunk boundaries ----
const mkChunk = (id, part, s0, s1, tempo) => ({
  id, part, span: [s0, s1], class: 'trance-stream', strategy: 'simple-bar',
  tempo, events: [], provenance: 'derived',
});
const synth = {
  irVersion: '0.1', id: 's', source: { score: 'x', window: [0, 40], parts: [0, 1] },
  provenance: { createdBy: 't', date: 'x' }, events: [], overlays: [],
  chunks: [
    mkChunk('ch-0-a', 0, 0, 11.3, { anchorSeconds: 0, unitSeconds: 0.5, beatSeconds: 0.5, subdivision: 1, label: 'A' }),
    mkChunk('ch-0-b', 0, 11.3, 40, { anchorSeconds: 11.3, unitSeconds: 0.5, beatSeconds: 0.5, subdivision: 1, label: 'B' }),
    mkChunk('ch-1-a', 1, 0, 11.3, { anchorSeconds: 0, unitSeconds: 0.4, beatSeconds: 0.4, subdivision: 1, label: 'C' }),
    mkChunk('ch-1-b', 1, 11.3, 40, { anchorSeconds: 11.3, unitSeconds: 0.4, beatSeconds: 0.4, subdivision: 1, label: 'D' }),
  ],
};
const p1 = Splice.planPages(synth, RULES, 12);
eq(p1[0].t1, 11.3, 1e-9, 'cut snaps to the shared chunk boundary near the 12 s target');
ok(p1[0].kind === 'clean', 'boundary cut is clean');
ok(p1[0].reshow.length === 0, 'first page reshows nothing');
ok(p1[1].reshow.length === 0, 'clean cut needs no continuation labels');
// coverage: contiguous, exact
eq(p1[0].t0, 0, 1e-12, 'starts at window start');
eq(p1[p1.length - 1].t1, 40, 1e-12, 'ends at window end');
for (let i = 1; i < p1.length; i++) eq(p1[i].t0, p1[i - 1].t1, 1e-12, 'pages contiguous @' + i);

// ---- synthetic: interrupting a sub-beat chunk snaps to ITS beat grid ----
const synth2 = JSON.parse(JSON.stringify(synth));
synth2.chunks = [
  mkChunk('ch-0-a', 0, 0, 40, { anchorSeconds: 0.13, unitSeconds: 0.2, beatSeconds: 0.6, subdivision: 3, label: 'SUB' }),
];
const p2 = Splice.planPages(synth2, RULES, 12);
const cut2 = p2[0].t1;
ok(p2[0].kind === 'beat-snapped', 'long sub-beat chunk cut is beat-snapped');
const kBeat = (cut2 - 0.13) / 0.6;
eq(kBeat, Math.round(kBeat), 1e-9, 'cut lies on the interrupted chunk\'s beat grid');
ok(p2[1].reshow.length === 1 && p2[1].reshow[0].text.startsWith(RULES.continuationPrefix), 'interrupted chunk reshows its label');

// ---- REAL SECTION ----
const ir = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-section-01.ir.json'), 'utf8'));
const pages = Splice.planPages(ir, RULES, 12);
eq(pages[0].t0, ir.source.window[0], 1e-12, 'section pages start at window start');
eq(pages[pages.length - 1].t1, ir.source.window[1], 1e-9, 'section pages end at window end');
for (let i = 1; i < pages.length; i++) eq(pages[i].t0, pages[i - 1].t1, 1e-12, 'section pages contiguous @' + i);
ok(pages.every(p => p.t1 - p.t0 >= RULES.minPageSeconds - 1e-9), 'no page shorter than the minimum');

// THE STAMP-ATOMIC PROOF, part 1 — real section. This material turns out to
// carry ZERO beam groups: the sub-beat chunks are the ACCELERANDO streams,
// whose notes sit 2-3 grid units apart (never beat-adjacent). Assert that
// the layout's beam count MATCHES an independent count from the IR (so a
// future re-extraction that produces beams is still protected), and that
// whatever beams exist never straddle a cut.
const model = Layout.layoutSection(ir, G);
const cuts = pages.slice(0, -1).map(p => p.t1);
const evById = new Map(ir.events.map(e => [e.id, e]));
let expectedPairsRuns = 0;
for (const c of ir.chunks) {
  const t = c.tempo;
  if (!t || t.subdivision < 2) continue;
  const ns = c.events.map(id => evById.get(id)).filter(e => e.metric).map(e => e.metric.grid[0]).sort((a, b) => a - b);
  let run = 1;
  for (let i = 1; i <= ns.length; i++) {
    const adj = i < ns.length && ns[i] === ns[i - 1] + 1 && Math.floor(ns[i] / t.subdivision) === Math.floor(ns[i - 1] / t.subdivision);
    if (adj) run++;
    else { if (run >= 2) expectedPairsRuns++; run = 1; }
  }
}
let beams = 0, straddles = 0;
for (const sys of model.systems) for (const it of sys.items) {
  if (it.k !== 'beam') continue;
  beams++;
  const ts = it.tips.map(p => p.t);
  for (const c of cuts) if (Math.min(...ts) < c - 1e-9 && Math.max(...ts) > c + 1e-9) straddles++;
}
eq(beams, expectedPairsRuns, 0, 'layout beam count matches independent IR count (0 on this material — accelerando streams, never beat-adjacent)');
ok(straddles === 0, 'no beam straddles any of ' + cuts.length + ' cuts');

// THE STAMP-ATOMIC PROOF, part 2 — end-to-end on a synthetic beamed chunk:
// a long sub-beat chunk WITH beat-adjacent pairs; the planner must snap the
// cut to its beat grid, and no laid-out beam may straddle it.
const synth3 = {
  irVersion: '0.1', id: 's3', source: { score: 'x', window: [0, 30], parts: [0] },
  provenance: { createdBy: 't', date: 'x' }, overlays: [],
  events: [], chunks: [],
};
const beatN = 0.6, unitN = 0.3;
const ns3 = [];
for (let beat = 0; beat < 48; beat++) { ns3.push(beat * 2, beat * 2 + 1); } // every beat has an adjacent pair
synth3.events = ns3.filter(n => n * unitN < 29.5).map(n => ({
  id: 'ev-s' + n, onset: +(n * unitN).toFixed(6), duration: 0.2,
  pitch: { midi: 45, spelled: { step: 'A', alter: 0, octave: 2 } }, technique: 'staccato',
  metric: { chunk: 'ch-0-s', grid: [n] }, provenance: 'derived',
}));
synth3.chunks = [{
  id: 'ch-0-s', part: 0, span: [0, 30], class: 'trance-stream', strategy: 'simple-bar',
  tempo: { anchorSeconds: 0, unitSeconds: unitN, beatSeconds: beatN, subdivision: 2, label: 'S' },
  events: synth3.events.map(e => e.id), provenance: 'derived',
}];
const p3 = Splice.planPages(synth3, RULES, 12);
ok(p3.length >= 2 && p3[0].kind === 'beat-snapped', 'synthetic: cut through the beamed chunk is beat-snapped');
const model3 = Layout.layoutSection(synth3, G);
const cuts3 = p3.slice(0, -1).map(p => p.t1);
let beams3 = 0, straddles3 = 0;
for (const it of model3.systems[0].items) {
  if (it.k !== 'beam') continue;
  beams3++;
  const ts = it.tips.map(p => p.t);
  for (const c of cuts3) if (Math.min(...ts) < c - 1e-9 && Math.max(...ts) > c + 1e-9) straddles3++;
}
ok(beams3 >= 40, 'synthetic chunk carries beam groups (' + beams3 + ')');
ok(straddles3 === 0, 'STAMP-ATOMIC end-to-end: zero of ' + beams3 + ' beams straddle ' + cuts3.length + ' beat-snapped cuts');

// continuation labels reach the rendered SVG
const withReshow = pages.find(p => p.reshow.length > 0);
ok(!!withReshow, 'some page has continuation labels (interruptions exist on real data)');
if (withReshow) {
  const view = Coords.makeView({
    widthPx: 1200, heightPx: 1100, window: [withReshow.t0, withReshow.t1],
    systems: Coords.systemsForParts(ir.source.parts),
  });
  const svg = Render.renderSection(model, view, G, { reshow: withReshow.reshow });
  ok(svg.includes(RULES.continuationPrefix.replace('(', '(')), 'continuation label rendered on the page');
}

// ---- snapshot ----
function snap(perturb) {
  return pages.map(p => [+(p.t0 + (perturb ? 0.01 : 0)).toFixed(4), +p.t1.toFixed(4), p.kind, p.interrupted.length, p.reshow.length]);
}
const args = process.argv.slice(2);
const current = snap(args.includes('--prove-red'));
if (args.includes('--update')) { fs.writeFileSync(SNAP, JSON.stringify(current, null, 1)); console.log('snapshot written'); }
else if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot'); }
else if (JSON.stringify(JSON.parse(fs.readFileSync(SNAP, 'utf8'))) !== JSON.stringify(current)) {
  failures++; console.error('FAIL: splice snapshot drift — if intentional, --update and review');
}
if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK'); process.exit(0); }
  console.error('PROVE-RED BROKEN'); process.exit(1);
}
if (failures) { console.error(`SPLICE RED: ${failures} failure(s)`); process.exit(1); }
console.log(`SPLICE GREEN: ${pages.length} pages, ${cuts.length} cuts, ${beams} beam groups protected, coverage exact`);
