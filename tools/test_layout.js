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
// texts: 2 tempo labels + the authored overlays now RENDER (review fix):
// ov-001 instruction + ov-002 dynamic 'p'
eq(count('text'), 4, 0, 'two tempo labels + instruction + dynamic overlay');
ok(items.some(i => i.k === 'text' && i.text === 'p' && i.ySs < -4), "authored dynamic 'p' renders below the staff");
ok(items.some(i => i.k === 'text' && /own pulse/.test(i.text)), 'authored instruction renders');
eq(count('tick'), 2, 0, 'two GC re-anchor ticks');
// ledger tally: events are B1,B2,B3,B1 + E3x15. B1 (-4.5) -> ledgers -3,-4
// (x2 events) = 4; B2 (-1), B3 (+2.5), E3 (+0.5) -> none.
eq(count('ledger'), 4, 0, 'ledgers: two B1 events, two ledgers each');
// stems: B1 (-4.5) stem up; B3 (+2.5) stem down; E3 (+0.5) stem down
const stemFor = t => items.find(i => i.k === 'stem' && Math.abs(i.t - t) < 1e-9);
ok(stemFor(58.4136).attach === 'up', 'B1 stem up');
ok(stemFor(59.9136).attach === 'down', 'B3 stem down');
ok(stemFor(60.8).attach === 'down', 'E3 stem down');
// ledgered stems extend to the middle line (review fix): B1 stem length
// max(3.5, 4.5) — tip at or above ss 0
ok(stemFor(58.4136).yB >= -1e-9, 'B1 stem reaches the middle line');
// dot opposite stem, snapped to a SPACE (review fix): B1 (-4.5, in space,
// stem up) -> dot at -5.5; E3 (+0.5, space, stem down) -> +1.5
const dotAt = t => items.find(i => i.k === 'dot' && Math.abs(i.t - t) < 1e-9);
eq(dotAt(58.4136).ySs, -5.5, 1e-9, 'B1 dot one space below');
eq(dotAt(60.8).ySs, 1.5, 1e-9, 'E3 dot one space above');
// on-LINE head reaches 1.5 to the next space center
eq(Layout.dotYFor(-1, 'up'), -2.5, 1e-9, 'on-line head: dot in next space (never on a line)');
eq(Layout.dotYFor(-0.5, 'up'), -1.5, 1e-9, 'in-space head: dot in next space');

// ---- beaming at sub-beat level (synthetic m=2 chunk) ----
const synth = {
  irVersion: '0.1', id: 'synth', source: { score: 'x', window: [0, 4], parts: [0] },
  provenance: { createdBy: 'test', date: 'x' },
  events: [0, 1, 3, 4].map(n => ({
    id: 'ev-n' + n, onset: n * 0.2, duration: 0.1,
    pitch: { midi: 45, spelled: sp('A', 0, 2) }, technique: 'staccato',
    metric: { chunk: 'ch-0-a', grid: [n] }, provenance: 'derived',
  })),
  chunks: [{
    id: 'ch-0-a', part: 0, span: [0, 4], class: 'trance-stream', strategy: 'simple-bar',
    tempo: { anchorSeconds: 0, unitSeconds: 0.2, beatSeconds: 0.4, subdivision: 2, label: 't' },
    events: ['ev-n0', 'ev-n1', 'ev-n3', 'ev-n4'],
    devices: [{ id: 'dev-a', kind: 'gc', mode: 'landing', at: 0, provenance: 'derived' }],
    provenance: 'derived',
  }],
  overlays: [],
};
const Ls = Layout.layoutSection(synth, G);
const si = Ls.systems[0].items;
const beams = si.filter(i => i.k === 'beam');
eq(beams.length, 1, 0, 'one beam run (n0,n1 share beat 0; n3/n4 cross a beat boundary)');
eq(beams[0].tips.length, 2, 0, 'beam covers the two contiguous same-beat notes');
ok(beams[0].dir === 'up', 'beam item carries its stem direction');
// flags ONLY on off-beat unbeamed notes (review fix): n3 (odd slot) yes,
// n4 (on-beat) NO
const flags = si.filter(i => i.k === 'glyph' && String(i.g).startsWith('flag'));
eq(flags.length, 1, 0, 'only the off-beat lone note gets a flag');

// beamed-group direction: FARTHEST note decides (review fix) — and the dot
// follows the FINAL direction, not the personal one
const synthDir = JSON.parse(JSON.stringify(synth));
synthDir.events = [0, 1].map(n => ({
  id: 'ev-d' + n, onset: n * 0.2, duration: 0.1,
  pitch: n === 0 ? { midi: 52, spelled: sp('E', 0, 3) } : { midi: 47, spelled: sp('B', 0, 2) },
  technique: 'staccato', metric: { chunk: 'ch-0-a', grid: [n] }, provenance: 'derived',
}));
synthDir.chunks[0].events = ['ev-d0', 'ev-d1'];
const Ld = Layout.layoutSection(synthDir, G);
const di = Ld.systems[0].items;
// E3 (+0.5) personal down; B2 (-1) is farther -> group stems UP
ok(di.filter(i => i.k === 'stem').every(i => i.attach === 'up'), 'farthest note (B2) forces group stems up');
const dDot = di.find(i => i.k === 'dot' && Math.abs(i.t - 0) < 1e-9);
eq(dDot.ySs, -0.5, 1e-9, "E3's dot follows the FINAL (up) stem: next space below the head");

// proportional strategy renders WITHOUT metric apparatus (review fix)
const synthProp = JSON.parse(JSON.stringify(synth));
synthProp.chunks[0].strategy = 'proportional';
const Lp = Layout.layoutSection(synthProp, G);
const pi = Lp.systems[0].items;
ok(pi.filter(i => i.k === 'glyph' && i.g === 'notehead').length === 4, 'proportional: noteheads render');
ok(pi.filter(i => i.k === 'beam').length === 0, 'proportional: no beams');
ok(pi.filter(i => i.k === 'glyph' && String(i.g).startsWith('flag')).length === 0, 'proportional: no flags');
ok(pi.filter(i => i.k === 'text' && /bpm/.test(i.text || '')).length === 0, 'proportional: no bpm label');
ok(pi.filter(i => i.k === 'tick').length === 1, 'proportional: GC tick stays (re-anchor is real)');

// A4 morph doc: spelling overlays APPLY, instruction renders, nothing silent
const morph = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'morph-window-01.ir.json'), 'utf8'));
const Lm = Layout.layoutSection(morph, G);
ok(Lm.warnings.length === 0, 'A4: all overlays consumed (no silent authored content)');
const sys2 = Lm.systems.find(s => s.part === 2);
const brick2 = sys2.items.find(i => i.k === 'brick');
eq(brick2.ySs, -1, 1e-9, 'A4: respelled Bb2 places at -1 (naive A#2 would be -1.5)');
ok(Lm.systems.every(s => s.items.some(i => i.k === 'text' && /beating/.test(i.text || ''))), 'A4: gesture-wide instruction on every part');

// ---- parachute: unresolved chunk renders bricks ----
const fb = JSON.parse(JSON.stringify(synth));
fb.chunks[0].strategy = 'unresolved';
const Lf = Layout.layoutSection(fb, G);
eq(Lf.systems[0].items.filter(i => i.k === 'brick').length, 4, 0, 'unresolved chunk -> 4 bricks');
eq(Lf.systems[0].items.filter(i => i.k === 'glyph').length, 0, 0, 'no glyphs on the parachute path');

// ---- DEVICE MEMBERSHIP (day 22, second note): registry-resolved ----
// surge env = curve + go line + nh-unit + dyn pair; fortepiano technique =
// go line + nh-unit only; staccato = brick alone; per-item override wins.
{
  const mk = (id, technique, env, withCurve) => {
    const e = { id, onset: 1, duration: 1.49, pitch: { midi: 32, spelled: { step: 'G', alter: 1, octave: 1 } }, technique, provenance: 'derived', mode: 'plain' };
    if (env) e.env = env;
    if (withCurve) e.level = { samples: [0, 0.5, 1] };
    return e;
  };
  const dir = {
    irVersion: 1, id: 'dev-test', source: { score: 'x', window: [0, 4], parts: [0] },
    events: [mk('s', 'ord', 'surge', true), mk('f', 'fortepiano'), mk('k', 'staccato')],
    chunks: [
      { id: 'c1', part: 0, span: [1, 2.5], class: 'drawn-crescendo-curve', strategy: 'unresolved', events: ['s'] },
      { id: 'c2', part: 0, span: [1, 2.5], class: 'fixed-oneshot', strategy: 'unresolved', events: ['f'] },
      { id: 'c3', part: 0, span: [1, 2.5], class: 'fixed-oneshot', strategy: 'unresolved', events: ['k'] },
    ], overlays: [],
  };
  const one = (ir, id) => {
    const sub = JSON.parse(JSON.stringify(ir)); sub.events = sub.events.filter(e => e.id === id); sub.chunks = sub.chunks.filter(c => c.events[0] === id);
    return Layout.layoutSection(sub, G).systems[0].items;
  };
  const has = (it, k) => it.filter(i => i.k === k).length;
  const S = one(dir, 's'), F = one(dir, 'f'), K = one(dir, 'k');
  ok(has(S, 'envcurve') === 1 && has(S, 'goline') === 1 && has(S, 'dynarrow') === 1, 'surge: curve + go line + dyn arrow');
  ok(S.some(i => i.k === 'glyph' && i.g === 'notehead-open') && S.some(i => i.k === 'glyph' && i.g === 'accidental-sharp'), 'surge: open head + sharp');
  ok(has(F, 'envcurve') === 0 && has(F, 'goline') === 1 && has(F, 'dynarrow') === 0, 'fortepiano: go line, NO curve, NO dyn pair');
  // G#1 = 5.5 steps below the middle line: past the 3-ledger threshold, so
  // the unit writes it an octave up on the bottom line under 8vb (the same
  // rule the F#1 surge takes — composer's ottava verdict still pending)
  ok(F.some(i => i.k === 'glyph' && i.g === 'notehead-open' && i.ySs === -2) && F.some(i => i.k === 'glyph' && i.g === 'accidental-sharp'), 'fortepiano: open head (written G#2) + sharp');
  ok(F.some(i => i.k === 'ottava' && i.label === 'vb8') && has(F, 'ledger') === 0, 'fortepiano G#1: 8vb, no ledgers');
  ok(has(F, 'brick') === 1, 'fortepiano: the brick stays until the device is complete');
  // the ring bar: go line -> onset + sounding length (1.49 = the measured
  // G#1 fp sample), centered on the WRITTEN head (G#2 under 8vb = -2)
  const rb = F.find(i => i.k === 'ringbar');
  ok(rb && Math.abs(rb.t0 - 1) < 1e-9 && Math.abs(rb.t1 - 2.49) < 1e-9 && rb.ySs === -2, 'fortepiano: ring bar spans onset..onset+1.49 at the written head');
  ok(has(S, 'ringbar') === 0, 'surge: no ring bar');
  // the single mark: sfzp on the dynamic slot, centered on the head column,
  // and the ottava stacks BELOW it (column order: dynamic before ottava)
  const mark = F.find(i => i.k === 'glyph' && i.g === 'dyn-sfzp');
  const hd = F.find(i => i.k === 'glyph' && i.g === 'notehead-open');
  const ot = F.find(i => i.k === 'ottava');
  ok(mark && Math.abs(mark.dxSs - hd.dxSs) < 1e-9, 'fortepiano: sfzp centered on the head column');
  ok(mark && ot && ot.ySs < mark.ySs - G.dynamic.sfzp.hSs / 2, 'fortepiano: ottava below the dynamic');
  ok(has(S, 'glyph') && !S.some(i => i.g === 'dyn-sfzp'), 'surge: no single mark (pair + arrow instead)');
  ok(has(K, 'goline') === 0 && has(K, 'glyph') === 0 && has(K, 'brick') === 1, 'staccato: brick alone');
  // per-item override: give the fp a dyn pair; take the surge's curve away
  const ov = JSON.parse(JSON.stringify(dir));
  ov.overlays = [
    { id: 'o1', kind: 'engraving', target: { event: 'f' }, value: { device: { dynPair: ['f', 'p'] } } },
    { id: 'o2', kind: 'engraving', target: { event: 's' }, value: { device: { curve: false } } },
  ];
  const F2 = one(ov, 'f'), S2 = one(ov, 's');
  ok(has(F2, 'dynarrow') === 1 && F2.some(i => i.g === 'dyn-f') && F2.some(i => i.g === 'dyn-p'), 'override: fp gains an f->p pair');
  ok(has(S2, 'envcurve') === 0 && has(S2, 'goline') === 1, 'override: surge curve off, go line stays');
  // registry opts replace the code defaults wholesale
  const R = Layout.layoutSection(JSON.parse(JSON.stringify(dir)), G, { devices: { byEnv: {}, byTechnique: {} } }).systems[0].items;
  ok(has(R, 'goline') === 0 && has(R, 'envcurve') === 0 && has(R, 'brick') === 3, 'empty devices map: bricks only');
}

// ---- V1 [A21]: the ENGRAVING-OVERRIDE channel (tier-3 hands) ----
// stemDir force: the synthDir pair beams UP by convention (B2 farthest);
// an authored stemDir DOWN on one note forces the whole run down.
const synthForce = JSON.parse(JSON.stringify(synthDir));
synthForce.overlays = [{ id: 'ov-f1', kind: 'engraving', target: { event: 'ev-d1' }, value: { stemDir: 'down' } }];
const Lfr = Layout.layoutSection(synthForce, G);
ok(Lfr.systems[0].items.filter(i => i.k === 'stem').every(i => i.attach === 'down'),
  'engraving stemDir forces the beamed run DOWN against the convention');
ok(Lfr.warnings.length === 0, 'engraving overlay consumed silently (no warning)');
// and the dot follows the FORCED direction
const fDot = Lfr.systems[0].items.find(i => i.k === 'dot' && Math.abs(i.t - 0) < 1e-9);
ok(fDot.ySs > 0.5, 'dot flips to the other side under the forced stem');

// beamBreak: split the (n0,n1) run — no run survives (singletons), and the
// now-unbeamed off-beat n1 gains a flag alongside n3
const synthBreak = JSON.parse(JSON.stringify(synth));
synthBreak.overlays = [{ id: 'ov-b1', kind: 'engraving', target: { event: 'ev-n1' }, value: { beamBreak: true } }];
const Lbk = Layout.layoutSection(synthBreak, G);
eq(Lbk.systems[0].items.filter(i => i.k === 'beam').length, 0, 0, 'beamBreak dissolves the only run');
eq(Lbk.systems[0].items.filter(i => i.k === 'glyph' && String(i.g).startsWith('flag')).length, 2, 0,
  'off-beat notes n1+n3 both flagged once unbeamed');

// dx/dy nudge: head+stem+dot shift horizontally; dy moves head but ledgers
// stay on the pitch's lines (a nudge is cosmetic, not a re-pitch)
const barNudge = JSON.parse(JSON.stringify(bar));
barNudge.overlays = (barNudge.overlays || []).concat([
  { id: 'ov-n1', kind: 'engraving', target: { event: bar.events[0].id }, value: { dxSs: 0.4, dySs: 0.25 } },
]);
const Ln = Layout.layoutSection(barNudge, G);
const nItems = Ln.systems[0].items;
const t0e = bar.events[0].onset;
const nHead = nItems.find(i => i.k === 'glyph' && i.g === 'notehead' && Math.abs(i.t - t0e) < 1e-9);
const bHead = items.find(i => i.k === 'glyph' && i.g === 'notehead' && Math.abs(i.t - t0e) < 1e-9);
eq(nHead.dxSs - bHead.dxSs, 0.4, 1e-9, 'dxSs nudges the head');
eq(nHead.ySs - bHead.ySs, 0.25, 1e-9, 'dySs nudges the head');
const nDot = nItems.find(i => i.k === 'dot' && Math.abs(i.t - t0e) < 1e-9);
eq(nDot.dxSs, 0.4, 1e-9, 'dot follows the dx nudge');
eq(nItems.filter(i => i.k === 'ledger' && Math.abs(i.t - t0e) < 1e-9).map(i => i.ySs).join(','),
  items.filter(i => i.k === 'ledger' && Math.abs(i.t - t0e) < 1e-9).map(i => i.ySs).join(','),
  0, 'ledgers stay on the pitch lines under a dy nudge');

// ---- V1: sectional staff-off ("not every section will have staff") ----
const barStaff = JSON.parse(JSON.stringify(bar));
barStaff.overlays = (barStaff.overlays || []).concat([
  { id: 'ov-s1', kind: 'staff', value: 'off', target: { part: 4, span: [59, 60] } },
]);
const Lso = Layout.layoutSection(barStaff, G);
const staffSegs = Lso.systems[0].items.filter(i => i.k === 'staff');
eq(staffSegs.length, 2, 0, 'staff-off span splits the staff into two segments');
eq(staffSegs[0].t1, 59, 1e-9, 'first segment ends at the off-span');
eq(staffSegs[1].t0, 60, 1e-9, 'second segment resumes after it');
ok(Lso.warnings.length === (bar.overlays || []).filter(o => false).length, 'staff overlay consumed');

// unknown kinds still warn — the no-silent-drop guarantee survives V1
const barZebra = JSON.parse(JSON.stringify(bar));
barZebra.overlays = (barZebra.overlays || []).concat([{ id: 'ov-z', kind: 'zebra', target: {}, value: 1 }]);
ok(Layout.layoutSection(barZebra, G).warnings.some(w => /zebra/.test(w)), 'unknown overlay kind still warns');

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
