#!/usr/bin/env node
// test_splice.js — B6 gate (+ phase-review fixes): cut preference by
// MATERIAL extent, multi-part stamp-atomic scoring, minPage enforcement,
// entry guards, full-section coverage, continuation labels, snapshot +
// --prove-red.
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

// helper: build a stream chunk WITH events on its grid
function streamChunk(ir, id, part, anchor, unit, m, count, skipEvery) {
  const evIds = [];
  for (let n = 0; n < count; n++) {
    if (skipEvery && n % skipEvery === skipEvery - 1) continue;
    const eid = 'ev-' + id + '-' + n;
    ir.events.push({
      id: eid, onset: +(anchor + n * unit).toFixed(6), duration: 0.1,
      pitch: { midi: 45, spelled: { step: 'A', alter: 0, octave: 2 } }, technique: 'staccato',
      metric: { chunk: id, grid: [n] }, provenance: 'derived',
    });
    evIds.push(eid);
  }
  const last = ir.events[ir.events.length - 1].onset;
  ir.chunks.push({
    id, part, span: [anchor, Math.max(last + unit, anchor + 1)], class: 'trance-stream', strategy: 'simple-bar',
    tempo: { anchorSeconds: anchor, unitSeconds: unit, beatSeconds: unit * m, subdivision: m, label: id },
    events: evIds, provenance: 'derived',
  });
}

// ---- cuts prefer chunk boundaries (by MATERIAL extent) ----
const synth = { irVersion: '0.1', id: 's', source: { score: 'x', window: [0, 40], parts: [0, 1] }, provenance: { createdBy: 't', date: 'x' }, events: [], chunks: [], overlays: [] };
streamChunk(synth, 'ch-0-a', 0, 0, 0.5, 1, 23);      // material 0..11.0
streamChunk(synth, 'ch-0-b', 0, 11.3, 0.5, 1, 57);   // 11.3..39.3
streamChunk(synth, 'ch-1-a', 1, 0, 0.4, 1, 28);      // 0..10.8
streamChunk(synth, 'ch-1-b', 1, 11.3, 0.4, 1, 71);   // 11.3..39.3
synth.chunks[0].span = [0, 11.3]; synth.chunks[2].span = [0, 11.3];
const p1 = Splice.planPages(synth, RULES, 12);
eq(p1[0].t1, 11.3, 1e-9, 'cut snaps to the shared chunk boundary near the 12 s target');
ok(p1[0].kind === 'clean', 'boundary cut is clean');
ok(p1[1].reshow.length === 0, 'clean cut needs no continuation labels');
eq(p1[0].t0, 0, 1e-12, 'starts at window start');
eq(p1[p1.length - 1].t1, 40, 1e-12, 'ends at window end');
for (let i = 1; i < p1.length; i++) eq(p1[i].t0, p1[i - 1].t1, 1e-12, 'pages contiguous @' + i);

// ---- interrupting a sub-beat chunk snaps to a safe slot on ITS grid ----
const synth2 = { irVersion: '0.1', id: 's2', source: { score: 'x', window: [0, 40], parts: [0] }, provenance: { createdBy: 't', date: 'x' }, events: [], chunks: [], overlays: [] };
streamChunk(synth2, 'ch-0-sub', 0, 0.13, 0.2, 3, 190); // dense sub-beat stream, beamable pairs everywhere
const p2 = Splice.planPages(synth2, RULES, 12);
ok(p2.length >= 2, 'long chunk paginates');
ok(p2[0].severed === 0, 'no beamable pair severed by the first cut');
ok(p2[0].kind === 'beat-snapped', 'cut through the sub-beat chunk is beat-snapped');
ok(p2[1].reshow.length === 1 && p2[1].reshow[0].text.startsWith(RULES.continuationPrefix), 'interrupted chunk reshows its label');

// ---- MULTI-PART stamp-atomic (review must-fix): two incommensurate grids ----
const synth4 = { irVersion: '0.1', id: 's4', source: { score: 'x', window: [0, 40], parts: [0, 1] }, provenance: { createdBy: 't', date: 'x' }, events: [], chunks: [], overlays: [] };
streamChunk(synth4, 'ch-0-x', 0, 0, 0.25, 2, 150, 3);   // pairs with gaps (every 3rd slot empty)
streamChunk(synth4, 'ch-1-y', 1, 0.355, 0.21, 2, 178, 3);
const p4 = Splice.planPages(synth4, RULES, 12);
for (const p of p4) ok(p.severed === 0, 'multi-part: cut at ' + p.t1.toFixed(3) + ' severs no beamable pair (severed=' + p.severed + ')');
// end-to-end: no laid-out beam straddles any cut
{
  const model4 = Layout.layoutSection(synth4, G);
  const cuts4 = p4.slice(0, -1).map(p => p.t1);
  let beams4 = 0, straddles4 = 0;
  for (const sys of model4.systems) for (const it of sys.items) {
    if (it.k !== 'beam') continue;
    beams4++;
    const ts = it.tips.map(q => q.t);
    for (const c of cuts4) if (Math.min(...ts) < c - 1e-9 && Math.max(...ts) > c + 1e-9) straddles4++;
  }
  ok(beams4 > 20, 'multi-part synthetic carries beams (' + beams4 + ')');
  ok(straddles4 === 0, 'STAMP-ATOMIC multi-part: zero of ' + beams4 + ' beams straddle ' + cuts4.length + ' cuts');
}

// ---- guards (review findings) ----
let threw = false;
try { Splice.planPages(synth, RULES, 0); } catch (e) { threw = true; }
ok(threw, 'pageSeconds 0 throws instead of hanging');
const pSmall = Splice.planPages(synth, RULES, 2);
ok(pSmall.every(p => p.t1 - p.t0 >= RULES.minPageSeconds - 1e-9), 'pageSeconds < minPage still yields no sub-minimum page');

// ---- REAL SECTION ----
const ir = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-section-01.ir.json'), 'utf8'));
const pages = Splice.planPages(ir, RULES, 12);
eq(pages[0].t0, ir.source.window[0], 1e-12, 'section pages start at window start');
eq(pages[pages.length - 1].t1, ir.source.window[1], 1e-9, 'section pages end at window end');
for (let i = 1; i < pages.length; i++) eq(pages[i].t0, pages[i - 1].t1, 1e-12, 'section pages contiguous @' + i);
ok(pages.every(p => p.t1 - p.t0 >= RULES.minPageSeconds - 1e-9), 'no page shorter than the minimum');
ok(pages.every(p => p.severed === 0), 'no beamable pair severed anywhere in the section');

// dead-span reshow is gone (review should-fix): every reshown chunk has
// MATERIAL crossing the page start
const ext = Splice.materialExtents(ir);
for (const p of pages) {
  for (const rs of p.reshow) {
    const live = ir.chunks.some(c => c.part === rs.part && c.tempo &&
      ext.get(c.id)[0] < p.t0 - 1e-9 && p.t0 < ext.get(c.id)[1] - 1e-9);
    ok(live, 'reshow on part ' + rs.part + ' @' + p.t0.toFixed(2) + ' is backed by material');
  }
}

// continuation labels reach the rendered SVG when they exist
const withReshow = pages.find(p => p.reshow.length > 0);
if (withReshow) {
  const view = Coords.makeView({
    widthPx: 1200, heightPx: 1100, window: [withReshow.t0, withReshow.t1],
    systems: Coords.systemsForParts(ir.source.parts),
  });
  const model = Layout.layoutSection(ir, G);
  const svg = Render.renderSection(model, view, G, { reshow: withReshow.reshow, ownsEnd: false });
  ok(svg.includes(RULES.continuationPrefix), 'continuation label rendered on the page');
}

// ---- snapshot ----
function snap(perturb) {
  return pages.map(p => [+(p.t0 + (perturb ? 0.01 : 0)).toFixed(4), +p.t1.toFixed(4), p.kind, p.interrupted.length, p.offGrid.length, p.reshow.length]);
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
console.log(`SPLICE GREEN: ${pages.length} section pages, multi-part stamp-atomic proven, material-extent reshow, guards in place`);
