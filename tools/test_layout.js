#!/usr/bin/env node
// test_layout.js — B4 gate: pitch→staff-position units, ledger rules, item
// census on the REAL A3 window, stem/dot/beam rules, the parachute pass,
// full-section smoke, committed snapshot + --prove-red.
//
//   node tools/test_layout.js [--update] [--prove-red]

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'layout_snapshot.json');

let failures = 0;
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };

// ---- pitch → bass-staff position (ss from middle line, +up) ----
const sp = (step, alter, octave) => ({ step, alter, octave });
eq(Layout.staffPosBass(sp('D', 0, 3)), 0, 1e-12, 'D3 = middle line');
eq(Layout.staffPosBass(sp('E', 0, 3)), 0.5, 1e-12, 'E3 = space above middle');
eq(Layout.staffPosBass(sp('A', 0, 3)), 2, 1e-12, 'A3 = top line');
eq(Layout.staffPosBass(sp('B', 0, 3)), 2.5, 1e-12, 'B3 = above top line');
eq(Layout.staffPosBass(sp('G', 0, 2)), -2, 1e-12, 'G2 = bottom line');
eq(Layout.staffPosBass(sp('B', 0, 1)), -4.5, 1e-12, 'B1 below staff');
eq(Layout.staffPosBass(sp('G', 0, 1)), -5.5, 1e-12, 'G1 lower still');
// ledger rules
ok(Layout.ledgersFor(0.5).length === 0, 'no ledgers inside staff');
ok(JSON.stringify(Layout.ledgersFor(-4.5)) === JSON.stringify([-3, -4]), 'B1 gets ledgers -3,-4');
ok(JSON.stringify(Layout.ledgersFor(-5.5)) === JSON.stringify([-3, -4, -5]), 'G1 gets three ledgers');
ok(JSON.stringify(Layout.ledgersFor(3)) === JSON.stringify([3]), 'first ledger above at +3');

// ---- REAL DATA: the A3 window (trance-bar-01) ----
const bar = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-bar-01.ir.json'), 'utf8'));
const L = Layout.layoutSection(bar, G);
ok(L.systems.length === 1, 'one system for part 4');
const items = L.systems[0].items;
const count = k => items.filter(i => i.k === k).length;
ok(count('staff') === 1 && count('clef') === 1, 'staff + clef furniture');
eq(count('glyph'), 19, 0, '19 noteheads, no flags/accidentals (naturals, m=1)');
eq(count('stem'), 19, 0, '19 stems');
eq(count('dot'), 19, 0, '19 staccato dots');
eq(count('beam'), 0, 0, 'no beams at subdivision 1');
eq(count('text'), 2, 0, 'two tempo labels');
eq(count('tick'), 2, 0, 'two GC re-anchor ticks');
// ledger tally: events are B1,B2,B3,B1 + E3x15. B1 (-4.5) -> ledgers -3,-4
// (x2 events) = 4; B2 (-1), B3 (+2.5), E3 (+0.5) -> none.
eq(count('ledger'), 4, 0, 'ledgers: two B1 events, two ledgers each');
// stems: B1 (-4.5) stem up; B3 (+2.5) stem down; E3 (+0.5) stem down
const stemFor = t => items.find(i => i.k === 'stem' && Math.abs(i.t - t) < 1e-9);
ok(stemFor(58.4136).attach === 'up', 'B1 stem up');
ok(stemFor(59.9136).attach === 'down', 'B3 stem down');
ok(stemFor(60.8).attach === 'down', 'E3 stem down');
// dot opposite stem: B1 stem up -> dot below (ySs < notehead ySs)
const dotAt = t => items.find(i => i.k === 'dot' && Math.abs(i.t - t) < 1e-9);
ok(dotAt(58.4136).ySs < -4.5, 'B1 dot below head (stem up)');
ok(dotAt(60.8).ySs > 0.5, 'E3 dot above head (stem down)');

// ---- beaming at sub-beat level (synthetic m=2 chunk) ----
const synth = {
  irVersion: '0.1', id: 'synth', source: { score: 'x', window: [0, 4], parts: [0] },
  provenance: { createdBy: 'test', date: 'x' },
  events: [0, 1, 2, 4].map(n => ({
    id: 'ev-n' + n, onset: n * 0.2, duration: 0.1,
    pitch: { midi: 45, spelled: sp('A', 0, 2) }, technique: 'staccato',
    metric: { chunk: 'ch-0-a', grid: [n] }, provenance: 'derived',
  })),
  chunks: [{
    id: 'ch-0-a', part: 0, span: [0, 4], class: 'trance-stream', strategy: 'simple-bar',
    tempo: { anchorSeconds: 0, unitSeconds: 0.2, beatSeconds: 0.4, subdivision: 2, label: 't' },
    events: ['ev-n0', 'ev-n1', 'ev-n2', 'ev-n4'], provenance: 'derived',
  }],
  overlays: [],
};
const Ls = Layout.layoutSection(synth, G);
const si = Ls.systems[0].items;
const beams = si.filter(i => i.k === 'beam');
eq(beams.length, 1, 0, 'one beam run (n0,n1 share beat 0; n2 alone in beat 1; n4 alone in beat 2)');
eq(beams[0].tips.length, 2, 0, 'beam covers the two contiguous same-beat notes');
const flags = si.filter(i => i.k === 'glyph' && String(i.g).startsWith('flag'));
eq(flags.length, 2, 0, 'n2 and n4 get 8th flags');

// ---- parachute: unresolved chunk renders bricks ----
const fb = JSON.parse(JSON.stringify(synth));
fb.chunks[0].strategy = 'unresolved';
const Lf = Layout.layoutSection(fb, G);
eq(Lf.systems[0].items.filter(i => i.k === 'brick').length, 4, 0, 'unresolved chunk -> 4 bricks');
eq(Lf.systems[0].items.filter(i => i.k === 'glyph').length, 0, 0, 'no glyphs on the parachute path');

// ---- full-section smoke ----
const section = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-section-01.ir.json'), 'utf8'));
const Lsec = Layout.layoutSection(section, G);
ok(Lsec.systems.length === 10, 'ten systems');
const tot = Lsec.systems.reduce((n, s) => n + s.items.length, 0);
ok(tot > 2000, 'full section lays out (' + tot + ' items)');
ok(Lsec.warnings.length === 0, 'no layout warnings on the section');
const bricksSec = Lsec.systems.reduce((n, s) => n + s.items.filter(i => i.k === 'brick').length, 0);
eq(bricksSec, 5, 0, 'the 5 unresolved singles render as bricks');

// ---- snapshot ----
function buildSnapshot(perturb) {
  const model = Layout.layoutSection(bar, G);
  const rows = model.systems[0].items.map(i => {
    const c = Object.assign({}, i);
    if (perturb && c.k === 'glyph') c.ySs = (c.ySs || 0) + 0.1;
    return [c.k, +(c.t ?? c.t0 ?? 0).toFixed(4), +((c.ySs ?? c.yA ?? 0)).toFixed(4), c.g || c.text || c.attach || ''];
  });
  return rows;
}
const args = process.argv.slice(2);
const current = buildSnapshot(args.includes('--prove-red'));
if (args.includes('--update')) {
  fs.writeFileSync(SNAP, JSON.stringify(current, null, 1));
  console.log('snapshot written: ' + SNAP);
} else if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot — run --update once'); }
else if (JSON.stringify(JSON.parse(fs.readFileSync(SNAP, 'utf8'))) !== JSON.stringify(current)) {
  failures++; console.error('FAIL: layout snapshot drift — if intentional, --update and review');
}

if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK'); process.exit(0); }
  console.error('PROVE-RED BROKEN'); process.exit(1);
}
if (failures) { console.error(`LAYOUT RED: ${failures} failure(s)`); process.exit(1); }
console.log('LAYOUT GREEN: staff math + A3 census + beaming + parachute + section smoke + snapshot');
