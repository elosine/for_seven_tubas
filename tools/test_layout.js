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
// the parachute path carries whatever DEVICE the technique has (registry
// data, day 22/23) — none ⇒ bricks alone; the staccato unit (day 23) ⇒
// filled head + stem + flag per note, bricks staying underneath
const Lf0 = Layout.layoutSection(JSON.parse(JSON.stringify(fb)), G, { devices: { byEnv: {}, byTechnique: {} } });
eq(Lf0.systems[0].items.filter(i => i.k === 'glyph').length, 0, 0, 'no device: no glyphs on the parachute path');
eq(Lf.systems[0].items.filter(i => i.k === 'glyph' && i.g === 'notehead').length, 4, 0, 'staccato device: 4 filled heads on the parachute path');
eq(Lf.systems[0].items.filter(i => i.k === 'stem').length, 4, 0, 'staccato device: 4 stems');
eq(Lf.systems[0].items.filter(i => i.k === 'glyph' && i.g === 'flag-up16').length, 4, 0, 'staccato device: 4 sixteenth flags');

// ---- DEVICE MEMBERSHIP (day 22, second note): registry-resolved ----
// surge env = curve + go line + nh-unit + dyn pair; fortepiano technique =
// go line + nh-unit only; staccato = brick alone; per-item override wins.
{
  const mk = (id, technique, env, withCurve) => {
    const e = { id, onset: 1, duration: 1.49, pitch: { midi: 32, spelled: { step: 'G', alter: 1, octave: 1 } }, technique, provenance: 'derived', mode: 'plain' };
    if (technique === 'staccato') e.vel = 90;   // wc-29's captured velocity → band mf
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
  // G#1 = 5.5 steps below the middle line. Day 23 (composer's verdict on
  // the ottava question): TUBA PLAYERS READ LEDGER LINES — threshold 4, so
  // the whole piece (lowest note F#1 = exactly 4 ledgers) writes at pitch,
  // no 8vb anywhere. G#1 takes three ledgers (-3, -4, -5).
  ok(F.some(i => i.k === 'glyph' && i.g === 'notehead-open' && i.ySs === -5.5) && F.some(i => i.k === 'glyph' && i.g === 'accidental-sharp'), 'fortepiano: open head at pitch (G#1, -5.5) + sharp');
  ok(!F.some(i => i.k === 'ottava') && has(F, 'ledger') === 3, 'fortepiano G#1: no ottava, three ledgers');
  ok(has(F, 'brick') === 1, 'fortepiano: the brick stays until the device is complete');
  // the ring bar: go line -> onset + sounding length (1.49 = the measured
  // G#1 fp sample), centered on the WRITTEN head (G#2 under 8vb = -2)
  const rb = F.find(i => i.k === 'ringbar');
  // THE BREATH RULE (day 23, composer): the bar ends a breath before the NEXT
  // gesture, capped by the sample length. In this fixture the fp is the only
  // event in its chunk and nothing follows it, so it keeps its full 1.49.
  ok(rb && Math.abs(rb.t0 - 1) < 1e-9 && Math.abs(rb.t1 - 2.49) < 1e-9 && rb.ySs === -5.5, 'fortepiano alone: ring bar = the full sample (nothing follows to shorten it)');
  {
    // a next attack 0.9 s later leaves 0.4 s of bar (0.9 - 0.5 breath) and flags
    const near = JSON.parse(JSON.stringify(dir));
    near.events.push({ id: 'nx', onset: 1.9, duration: 0.46, pitch: { midi: 31, spelled: { step: 'G', alter: 0, octave: 1 } }, technique: 'staccato', provenance: 'derived', mode: 'plain', vel: 90 });
    near.chunks.find(c => c.events[0] === 'f').events.push('nx');
    const L = Layout.layoutSection(near, G);
    const b = L.systems[0].items.find(i => i.k === 'ringbar' && i.ev === 'f');
    ok(b && Math.abs((b.t1 - b.t0) - 0.4) < 1e-9, 'fortepiano: bar ends a breath before the next gesture (' + (b && (b.t1 - b.t0).toFixed(3)) + ' s)');
    ok(L.warnings.some(w => /ring bar f:/.test(w) && /0\.40/.test(w)), 'fortepiano: the shortened bar is FLAGGED for the composer');
    // a gap shorter than the breath draws no bar and warns
    const tight = JSON.parse(JSON.stringify(near));
    tight.events.find(e => e.id === 'nx').onset = 1.3;
    const L2 = Layout.layoutSection(tight, G);
    ok(!L2.systems[0].items.some(i => i.k === 'ringbar' && i.ev === 'f') && L2.warnings.some(w => /no room before the next attack/.test(w)), 'fortepiano: gap under the breath -> no bar + a warning');
    // breathSeconds 0 restores the full sample even with a near neighbour
    const L3 = Layout.layoutSection(JSON.parse(JSON.stringify(near)), G, { breathSeconds: 0 });
    const b3 = L3.systems[0].items.find(i => i.k === 'ringbar' && i.ev === 'f');
    ok(b3 && Math.abs((b3.t1 - b3.t0) - 0.9) < 1e-9, 'fortepiano: breathSeconds 0 -> the bar runs to the next attack');
  }
  // the fp now carries a GC too (composer, day 23) — so its unit is pushed
  // clear of the impact marker like the staccato's
  ok(has(F, 'gc') === 1, 'fortepiano: carries a GC');
  ok(has(S, 'ringbar') === 0, 'surge: no ring bar');
  // the single mark: sfzp on the dynamic slot, centered on the head column.
  // THE SIDE-WITH-ROOM RULE (day 23): G#1's bottom ink (sharp tip, -6.25)
  // leaves 0.26 ss to the lane edge (6.51) — the mark (0.45 + 0.97) cannot
  // fit below, so the chain flips ABOVE the unit's top ink.
  const mark = F.find(i => i.k === 'glyph' && i.g === 'dyn-sfzp');
  const hd = F.find(i => i.k === 'glyph' && i.g === 'notehead-open');
  ok(mark && Math.abs(mark.dxSs - hd.dxSs) < 1e-9, 'fortepiano: sfzp centered on the head column');
  // ... and ABOVE THE STAFF, not among the ledgers: the chain's reference is
  // the outer staff line (+2) when the unit's ink is lower than that
  ok(mark && mark.ySs - G.dynamic.sfzp.hSs / 2 >= 2 + 0.45 - 1e-9, 'fortepiano G#1: sfzp ABOVE the staff (clears the top line by the 0.45 gap)');
  ok(mark && Math.abs((mark.ySs - G.dynamic.sfzp.hSs / 2) - (2 + 0.45)) < 1e-9, 'fortepiano G#1: sfzp sits exactly 0.45 above the top staff line');
  ok(mark && mark.ySs + G.dynamic.sfzp.hSs / 2 <= 6.51 + 1e-9, 'fortepiano G#1: the flipped mark stays inside the lane');
  // a note with room below keeps the chain below: same fp device on D3
  {
    const mid = JSON.parse(JSON.stringify(dir));
    mid.events = mid.events.map(e => e.id === 'f' ? Object.assign({}, e, { pitch: { midi: 50, spelled: { step: 'D', alter: 0, octave: 3 } } }) : e);
    const FM = one(mid, 'f');
    const mm = FM.find(i => i.k === 'glyph' && i.g === 'dyn-sfzp'), hm = FM.find(i => i.k === 'glyph' && i.g === 'notehead-open');
    ok(mm && hm && mm.ySs < hm.ySs, 'fortepiano D3: chain stays BELOW when there is room');
    // an in-staff note's dynamic clears the BOTTOM staff line, never sits inside the staff
    ok(mm && Math.abs((mm.ySs + G.dynamic.sfzp.hSs / 2) - (-2 - 0.45)) < 1e-9, 'fortepiano D3: sfzp sits exactly 0.45 below the bottom staff line');
  }
  // the rule is registry data: a huge lane puts G#1's chain back below
  {
    const FB = Layout.layoutSection(JSON.parse(JSON.stringify(dir)), G, { chainSide: { rule: 'sideWithRoom', laneHalfSs: 20 } }).systems[0].items.filter(() => true);
    const sub = JSON.parse(JSON.stringify(dir)); sub.events = sub.events.filter(e => e.id === 'f'); sub.chunks = sub.chunks.filter(c => c.events[0] === 'f');
    const FB2 = Layout.layoutSection(sub, G, { chainSide: { rule: 'sideWithRoom', laneHalfSs: 20 } }).systems[0].items;
    const m2 = FB2.find(i => i.k === 'glyph' && i.g === 'dyn-sfzp'), h2 = FB2.find(i => i.k === 'glyph' && i.g === 'notehead-open');
    ok(m2 && h2 && m2.ySs < h2.ySs, 'fortepiano G#1 with a 20 ss half-lane: chain below (the rule reads the registry lane)');
  }
  ok(has(S, 'glyph') && !S.some(i => i.g === 'dyn-sfzp'), 'surge: no single mark (pair + arrow instead)');
  // THE STACCATO UNIT (wc-29, day 23 — composer: "black note head, stem,
  // and I think one flag"): filled head + stem + 8th flag, nothing else
  // yet. G1 at pitch (-5.5, below the middle line) → stem UP, flag-up8
  // at the tip; the flag reaches past the head, so the column anchor
  // (rightmost ink a gap before go) is the flag's right edge.
  // OPTION B (day 23 layering discussion): NO go line — the GC's impact
  // marker is the go mark; the unit sits before it like every other unit
  // day 23 (composer): the go line is BACK on the staccato; the GC stays;
  // the dynamic is THE ONE-SHOT MARK from the velocity bands (vel 90 → mf)
  ok(has(K, 'goline') === 1 && has(K, 'gc') === 1 && has(K, 'ringbar') === 0 && has(K, 'brick') === 1, 'staccato: go line + GC, no ring bar; brick stays');
  const kmark = K.find(i => i.k === 'glyph' && /^dyn-/.test(i.g));
  ok(kmark && kmark.g === 'dyn-mf', 'staccato vel 90 → band mark mf (' + (kmark && kmark.g) + ')');
  // the band table is registry data: tighter thresholds move the mark
  {
    const sub = JSON.parse(JSON.stringify(dir)); sub.events = sub.events.filter(e => e.id === 'k'); sub.chunks = sub.chunks.filter(c => c.events[0] === 'k');
    const KB = Layout.layoutSection(sub, G, { dynamicBands: [{ max: 60, mark: 'ppp' }, { max: 89, mark: 'p' }, { max: 127, mark: 'fff' }] }).systems[0].items;
    ok(KB.some(i => i.g === 'dyn-fff'), 'staccato: bands from opts → vel 90 lands in fff under a 3-band table');
    // a plain-mode event WITHOUT vel warns (stale extraction), draws no mark
    const sub2 = JSON.parse(JSON.stringify(sub)); delete sub2.events[0].vel;
    const L2 = Layout.layoutSection(sub2, G);
    ok(!L2.systems[0].items.some(i => /^dyn-/.test(i.g || '')) && L2.warnings.some(w => /no vel/.test(w)), 'staccato without vel: no mark + a warning (never a silent default)');
  }
  const kh = K.find(i => i.k === 'glyph' && i.g === 'notehead');
  const ks = K.find(i => i.k === 'stem');
  const kf = K.find(i => i.k === 'glyph' && i.g === 'flag-up16');   // day 23: the double flag
  ok(kh && kh.ySs === -5.5 && !K.some(i => i.g === 'notehead-open'), 'staccato: FILLED head at pitch (G1, -5.5)');
  // the head is SCALED (piece #2 cellMotive.scaleFactor 0.844, composer day
  // 23): its stem-attach offset scales with it
  const HK = 0.844;
  ok(kh && Math.abs(kh.scale - HK) < 1e-9, 'staccato: head carries the 0.844 scale (piece #2 cellMotive)');
  ok(ks && ks.attach === 'up' && Math.abs(ks.dxSs - (kh.dxSs + (G.notehead.filled.anchors.stemAttachUp.x - G.notehead.filled.anchors.center.x) * HK)) < 1e-9, 'staccato: stem up from the SCALED head right attach point');
  // G1 sits 5.5 below the middle line: the stem extends to the middle line
  // (stemLenFor: max(3.5, |ySs|)) — a stem outside the staff reaches it
  // FLAG-CLEAR (composer: the flag bottom clears the staff by ~3 px = 0.38
  // ss): flag bottom = tip − flag height must sit exactly 0.38 above the
  // top staff line (+2) — asserted from the emitted flag item's own metrics
  // THE MARK BETWEEN STAFF AND FLAG (composer: "the dynamic above the staff
  // and below the bottom of the flag"): G1's chain cannot fit below (dot at
  // the lane edge), so it flips above; the stem rule lifts the compressed
  // flag (0.65 × 3.008 = 1.955 ss) over the mark; gaps = chainAboveGapSs 0.3
  // round 6 (composer): the mark sits BESIDE the stem — right edge 0.15 ss
  // left of the stem's left edge — above the staff (0.3); the flag is back
  // to full height and clears only the staff (0.38)
  ok(kf && kf.scaleY == null, 'staccato: flag at full height (no scaleY)');
  ok(kmark && Math.abs((kmark.ySs - G.dynamic.mf.hSs / 2) - (2 + 0.3)) < 1e-9, 'staccato G1: mf bottom exactly 0.3 above the top staff line (' + (kmark.ySs - G.dynamic.mf.hSs / 2).toFixed(3) + ')');
  ok(kf && Math.abs((kf.ySs - G.flag.up16.hSs) - (2 + 0.38)) < 1e-9, 'staccato G1: 16th-flag bottom exactly 0.38 above the top staff line (' + (kf.ySs - G.flag.up16.hSs).toFixed(3) + ')');
  const stemLeft = ks.dxSs - G.standards.stem.thickness / 2;
  ok(kmark && Math.abs((kmark.dxSs + G.dynamic.mf.wSs / 2) - (stemLeft - 0.15)) < 1e-9, 'staccato G1: mf right edge exactly 0.15 ss left of the stem (' + (stemLeft - (kmark.dxSs + G.dynamic.mf.wSs / 2)).toFixed(3) + ')');
  ok(kf && kf.ySs <= 6.51 + 1e-9, 'staccato G1: stem tip inside the lane (' + kf.ySs.toFixed(3) + ' ≤ 6.51)');
  ok(ks && (ks.yB - ks.yA) > 5.5, 'staccato G1: the flag-clear stem is longer than the middle-line default (' + (ks.yB - ks.yA).toFixed(2) + ' ss)');
  // a note with room keeps the default: the same device on A3 (+4, stem down,
  // flag rises from the tip below) needs flag top ≤ −2.38 → tip ≤ −5.39 → 9.4 ss,
  // longer than the default, so the rule still governs; on D3 (0) stem down:
  // tip ≤ −5.39 → 5.39 > 3.5 — also governed. The rule governs every in-staff
  // note; it yields only when the default already clears.
  // STACCATO DOT on the notehead side (below, stem up), centered in a space
  const kdot = K.find(i => i.k === 'dot');
  ok(kdot && Math.abs(kdot.dxSs - kh.dxSs) < 1e-9, 'staccato: dot centered on the head column');
  // the dot: notehead side (below, stem up), 0.3 ss from the SCALED head's
  // bottom edge (composer: "two or three pixels, very tight")
  ok(kdot && Math.abs((kh.ySs - G.notehead.filled.hSs * HK / 2) - (kdot.ySs + 0.2) - 0.15) < 1e-9 && kdot.ySs < kh.ySs, 'staccato: dot 0.15 ss below the head edge — the tight gap (' + kdot.ySs.toFixed(3) + ')');
  ok(kf && Math.abs(kf.dxSs - ks.dxSs) < 1e-9 && Math.abs(kf.ySs - ks.yB) < 1e-9 && kf.align === 'stemTip', 'staccato: the 16th flag hangs from the stem tip');
  // CENTERED ON THE GO LINE (day 23, composer: "everything centered on the
  // go line"). Measured from the EMITTED items' own glyph metrics — the ink
  // midpoint, not a re-run of the placement formula.
  const flagRight = kf.dxSs + G.flag.up16.wSs - G.flag.up16.anchors.stemTip.x;
  const ka = K.find(i => i.k === 'glyph' && i.g === 'accidental-sharp');
  const accAnchorX = (G.accidental.sharp.anchors && G.accidental.sharp.anchors.noteY)
    ? G.accidental.sharp.anchors.noteY.x : G.accidental.sharp.wSs / 2;
  const inkL = Math.min(kh.dxSs - G.notehead.filled.wSs / 2, ka.dxSs - accAnchorX);
  const inkR = Math.max(kh.dxSs + G.notehead.filled.wSs / 2, flagRight);
  // BEFORE the go time with the device gap 0.6 ss: the rightmost ink (the
  // flag's right edge here) ends 0.6 before go, so the head clears the
  // impact marker (r 0.51 ss, centred on go) with air
  // THE GC-CLEARANCE PUSH IS CONDITIONAL (day 24): it applies only when the
  // head actually reaches the disc. Once the composer moved the ball ONTO the
  // lane edge (D60) the disc top sits at −6.00 ss, and G1's head underside is
  // −5.87 — it clears, so the device's own 0.6 governs and the note is NOT
  // dragged further off its go time. Both branches are asserted.
  ok(Math.abs(inkR - (-0.60)) < 1e-9, 'staccato G1 clears the disc: rightmost ink at the device gap 0.60, no push (' + inkR.toFixed(3) + ')');
  {
    // ...and a note LOW enough to reach the disc still gets pushed. F#1 (midi
    // 30) draws at −6.0, head underside −6.37, below the disc top −6.00.
    const low = JSON.parse(JSON.stringify(dir));
    low.events = low.events.filter(e => e.id === 'k');
    low.chunks = low.chunks.filter(c => c.events[0] === 'k');
    low.events[0].pitch = { midi: 30, spelled: { step: 'F', alter: 1, octave: 1 } };
    const LK = Layout.layoutSection(low, G).systems[0].items;
    const lh = LK.find(i => i.k === 'glyph' && i.g === 'notehead');
    const lf = LK.find(i => i.k === 'glyph' && i.g === 'flag-up16');
    const lInkR = Math.max(lh.dxSs + G.notehead.filled.wSs / 2,
      lf.dxSs + G.flag.up16.wSs - G.flag.up16.anchors.stemTip.x);
    ok(Math.abs(lh.ySs - (-6.0)) < 1e-9, 'F#1 draws at −6.0 ss (' + lh.ySs.toFixed(2) + ')');
    ok(Math.abs(lInkR - (-0.66)) < 1e-9, 'staccato F#1 REACHES the disc: pushed to 0.66 = radius + tight gap (' + lInkR.toFixed(3) + ')');
  }
  ok(inkR < -0.51 - 1e-9, 'staccato: the whole unit clears the impact marker (r 0.51)');
  ok(kh.dxSs + G.notehead.filled.wSs * HK / 2 < -0.51 - 1e-9, 'staccato: the head clears the impact marker (r 0.51)');
  ok(kdot.dxSs + 0.2 < -0.51 - 1e-9, 'staccato: the dot clears the impact marker too');
  // the fp keeps the day-22 anchor — rightmost ink a gap BEFORE go — so the
  // change is per-technique device data, not a global re-anchoring
  const fhd = F.find(i => i.k === 'glyph' && i.g === 'notehead-open');
  ok(fhd.dxSs + G.notehead.open.wSs / 2 < -0.51 - 1e-9, 'fortepiano: head clears the impact marker (GC-clearance gap)');
  // stemDir override per item, as on metric notes
  const kd = JSON.parse(JSON.stringify(dir));
  kd.overlays = [{ id: 'o3', kind: 'engraving', target: { event: 'k' }, value: { stemDir: 'down' } }];
  const K2 = one(kd, 'k');
  ok(K2.find(i => i.k === 'stem').attach === 'down' && K2.some(i => i.g === 'flag-down16'), 'staccato: stemDir override flips stem + flag');
  // per-item override: give the fp a dyn pair; take the surge's curve away
  const ov = JSON.parse(JSON.stringify(dir));
  ov.overlays = [
    { id: 'o1', kind: 'engraving', target: { event: 'f' }, value: { device: { dynPair: ['f', 'p'] } } },
    { id: 'o2', kind: 'engraving', target: { event: 's' }, value: { device: { curve: false } } },
  ];
  const F2 = one(ov, 'f'), S2 = one(ov, 's');
  ok(has(F2, 'dynarrow') === 1 && F2.some(i => i.g === 'dyn-f') && F2.some(i => i.g === 'dyn-p'), 'override: fp gains an f->p pair');
  ok(has(S2, 'envcurve') === 0 && has(S2, 'goline') === 1, 'override: surge curve off, go line stays');
  // ---- THE BEAMED CLUSTER (day 23, composer: "treat this as one cluster...
  // the smaller notehead at each position, stem them all, a single beam
  // above the staff at the same height as our flagged ones, nothing else") ----
  {
    const CL = { device: { goLine: false, gc: false, ringBar: false, dynMark: false, nhDot: false,
      nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'beam', nhAnchor: 'center', beamGroup: 'cl-1' } };
    const cl = JSON.parse(JSON.stringify(dir));
    cl.events = [0, 1, 2].map(n => ({ id: 'c' + n, onset: 1 + n * 0.3, duration: 0.46,
      pitch: { midi: 43, spelled: { step: 'G', alter: 0, octave: 2 } }, technique: 'staccato', provenance: 'derived', mode: 'plain', vel: 90 }));
    cl.chunks = [{ id: 'cc', part: 0, span: [1, 2.5], class: 'fixed-oneshot', strategy: 'unresolved', events: ['c0', 'c1', 'c2'] }];
    cl.overlays = cl.events.map(e => ({ id: 'ov-cl-' + e.id, kind: 'engraving', target: { event: e.id }, value: CL, provenance: 'authored' }));
    const L = Layout.layoutSection(cl, G);
    const its = L.systems[0].items, cnt = k => its.filter(i => i.k === k).length;
    ok(its.filter(i => i.k === 'glyph' && i.g === 'notehead').length === 3 && its.every(i => i.k !== 'glyph' || i.g !== 'notehead' || i.scale === 0.844), 'cluster: a small filled head at every position');
    ok(cnt('stem') === 3 && cnt('dot') === 0 && cnt('goline') === 0 && cnt('gc') === 0 && !its.some(i => /^dyn-/.test(i.g || '')), 'cluster: stems only — no dot, go line, GC or dynamic');
    const bm = its.find(i => i.k === 'beam');
    ok(bm && bm.tips.length === 3 && bm.dir === 'up' && bm.group === 'cl-1', 'cluster: ONE beam over all three');
    // the beam sits at the flagged one-shot's stem tip: staff edge + flag
    // clearance + a flag's height — asserted against the constants, and
    // against a real flagged note laid out from the same registry
    // the beam follows the flag the one-shots wear — day 23: the 16th
    const expectY = 2 + 0.38 + G.flag.up16.hSs;
    ok(bm && bm.tips.every(t => Math.abs(t.ySs - expectY) < 1e-9), 'cluster: beam at the flagged-stem height (' + (bm && bm.tips[0].ySs.toFixed(3)) + ' = 2 + 0.38 + ' + G.flag.up16.hSs + ')');
    ok(its.filter(i => i.k === 'stem').every(st => Math.abs(st.yB - expectY) < 1e-9), 'cluster: every stem reaches the beam');
    const kfTip = K.find(i => i.k === 'glyph' && i.g === 'flag-up16');
    ok(kfTip && Math.abs(kfTip.ySs - expectY) < 1e-9, 'cluster: a lone flagged one-shot tops out at the same height');
    // a one-note cluster draws no beam and warns
    const solo = JSON.parse(JSON.stringify(cl));
    solo.events = solo.events.slice(0, 1); solo.chunks[0].events = ['c0']; solo.overlays = solo.overlays.slice(0, 1);
    const L1 = Layout.layoutSection(solo, G);
    ok(!L1.systems[0].items.some(i => i.k === 'beam') && L1.warnings.some(w => /beam group "cl-1" has 1 note/.test(w)), 'cluster of one: no beam + a warning');
    // ---- A LONE NOTE IN ITS OWN BEAM GROUP (day 29, composer, T2's seventh
    // partial: "two beamlets on the right for that single sixteenth") ----
    // three notes on a 16th grid at slots 0, 1 and 4; the third is a beam
    // group of its own. It draws a right-pointing stub at BOTH levels, the
    // silence before it is two 16th rests under --rest16, and the cluster
    // does not warn.
    {
      const lone = JSON.parse(JSON.stringify(cl));
      lone.events = [0, 1, 4].map((slot, n) => ({ id: 'c' + n, onset: 1 + slot * 0.2, duration: 0.46,
        pitch: { midi: 43, spelled: { step: 'G', alter: 0, octave: 2 } }, technique: 'staccato', provenance: 'derived', mode: 'plain', vel: 90 }));
      lone.chunks[0].events = ['c0', 'c1', 'c2'];
      lone.overlays = lone.events.map((e, n) => {
        const v = JSON.parse(JSON.stringify(CL));
        Object.assign(v.device, { clusterId: 'k', beamGroup: n < 2 ? 'k-a' : 'k-b', beamUnit: 0.2, beamPos: [0, 1, 4][n], beamLevels: 2, beamSubdivision: 4, noteBeams: 2 });
        if (n === 2) v.device.rest16Before = true;
        return { id: 'ov-cl-' + e.id, kind: 'engraving', target: { event: e.id }, value: v, provenance: 'authored' };
      });
      const LL = Layout.layoutSection(lone, G);
      const it = LL.systems[0].items;
      const stubs = it.filter(i => i.k === 'beam' && i.stub && Math.abs(i.tips[0].t - 1.8) < 1e-9);
      ok(stubs.length === 2 && stubs.every(b => !b.inward && b.tips[1].dxSs > b.tips[0].dxSs + 1e-9 && b.tips[0].t === b.tips[1].t),
        'lone note: a right-pointing stub at both beam levels (' + stubs.length + ')');
      ok(stubs.length === 2 && Math.abs(stubs[0].tips[0].ySs - stubs[1].tips[0].ySs) > 1e-9, 'lone note: the two stubs sit at different levels');
      ok(!LL.warnings.some(w => /beam group "k-b"/.test(w)), 'lone note inside a cluster: no warning');
      const pri = it.find(i => i.k === 'beam' && !i.stub && i.group === 'k-a');
      ok(pri && pri.tips.length === 2, 'lone note: the pair before it keeps its ordinary beam');
      const rests = it.filter(i => i.k === 'rest').sort((a, b) => a.t - b.t);
      ok(rests.length === 2 && rests.every(r => r.units === 1 && r.dur === 16) && Math.abs(rests[0].t - 1.4) < 1e-9 && Math.abs(rests[1].t - 1.6) < 1e-9,
        '--rest16: the two-slot silence before the lone note is two 16th rests, not an 8th (' + rests.map(r => r.dur + (r.dotted ? '.' : '')).join(' ') + ')');
      // and WITHOUT the mark the same silence is one 8th rest, as before
      const plain8 = JSON.parse(JSON.stringify(lone));
      delete plain8.overlays[2].value.device.rest16Before;
      const r8 = Layout.layoutSection(plain8, G).systems[0].items.filter(i => i.k === 'rest');
      ok(r8.length === 1 && r8[0].units === 2 && r8[0].dur === 8, 'without --rest16 the same silence is one 8th rest (' + r8.map(r => r.dur).join(' ') + ')');
      // ---- --beamOver (day 29, composer: "extend the bar... over the first
      // sixteenth rest... two beams all the way through") ----
      // the pair k-a (slots 0,1; rest at slot 2) with beamThrough + beamOverRest:
      // both levels run from note 1 to a phantom tip at slot 2's time + the
      // 16th rest's width + the pad; no stem is drawn for the phantom.
      const ov = JSON.parse(JSON.stringify(lone));
      for (const n of [0, 1]) Object.assign(ov.overlays[n].value.device, { beamThrough: true, beamOverRest: true });
      const LO = Layout.layoutSection(ov, G);
      const io_ = LO.systems[0].items;
      const pa = io_.filter(i => i.k === 'beam' && !i.stub && /^k-a/.test(i.group));
      const tEnd = 1 + 2 * 0.2, dxEnd = G.rest.rest16.wSs + 0.2;
      ok(pa.length === 2 && pa.every(b => b.tips.length === 3 && Math.abs(b.tips[2].t - tEnd) < 1e-9 && Math.abs(b.tips[2].dxSs - dxEnd) < 1e-9),
        '--beamOver: both beam levels of the pair reach one slot on, past the first rest glyph (' + pa.map(b => b.tips.length).join('/') + ' tips)');
      ok(io_.filter(i => i.k === 'stem').length === 3, '--beamOver: the phantom tip draws no stem');
      ok(io_.filter(i => i.k === 'rest').length === 2, '--beamOver: the rests under the beam are still drawn');
      // ---- --beamOverLeft (day 29, composer, the lone seventh partial:
      // "a group of two — beams over [the] sixteenth rest and then the
      // partial"): the lone note k-b (slot 4, rest at 3 before it) reaches
      // back — BOTH levels as real two-tip beams from the rest's slot to the
      // stem; no stubs drawn for it.
      const ol = JSON.parse(JSON.stringify(lone));
      Object.assign(ol.overlays[2].value.device, { beamOverLeft: true });
      const LOL = Layout.layoutSection(ol, G);
      const kb = LOL.systems[0].items.filter(i => i.k === 'beam' && /^k-b/.test(i.group));
      const tRest = 1 + 3 * 0.2;
      ok(kb.length === 2 && kb.every(b => !b.stub && b.tips.length === 2 && Math.abs(b.tips[0].t - tRest) < 1e-9 && b.tips[0].dxSs < 0),
        '--beamOverLeft: both levels run from the preceding rest slot to the lone stem (' + kb.map(b => b.tips.length).join('/') + ')');
      ok(!LOL.systems[0].items.some(i => i.stub && /^k-b/.test(i.group)), '--beamOverLeft: no stubs on the lone note');
    }
  }

  // registry opts replace the code defaults wholesale
  const R = Layout.layoutSection(JSON.parse(JSON.stringify(dir)), G, { devices: { byEnv: {}, byTechnique: {} } }).systems[0].items;
  ok(has(R, 'goline') === 0 && has(R, 'envcurve') === 0 && has(R, 'brick') === 3, 'empty devices map: bricks only');
}

// ---- day 29: A BRACKET SITS ON ITS OWN GROUP'S BEAM (the collision fix) ----
// A cluster now holds several beam groups, several with brackets, at different
// stack heights. Every tuplet item must clear the beam of the group whose span
// it covers — checked on the real promoted file (db1 — CLOUD02-I folded day 30; T1's three
// brackets over three different groups).
{
  const irC = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'db1.ir.json'), 'utf8'));
  const LC = Layout.layoutSection(irC, G);
  const s0 = LC.systems.find(s => s.part === 0);
  const tups = s0.items.filter(i => i.k === 'tuplet' && i.t0 > 35);
  ok(tups.length >= 3, 'section file: T1 carries its three brackets (' + tups.length + ')');
  let bad = 0;
  for (const t of tups) {
    for (const bm of s0.items.filter(i => i.k === 'beam' && !/-b2|stub/.test(i.group || ''))) {
      const t0 = bm.tips[0].t, t1 = bm.tips[bm.tips.length - 1].t;
      if (t.t0 <= t1 + 0.01 && t.t1 >= t0 - 0.01 && t.ySs <= bm.tips[0].ySs + 0.5) bad++;
    }
  }
  ok(bad === 0, 'every bracket clears every beam it spans (' + bad + ' collisions)');
}

// ---- day 33: HOOKS FACE THEIR OWN STAFF (the inverted-flag regression) ----
// Day 32: the dictated-side block wrote its draw flag backwards and T6/T7's
// brackets pointed their hooks at the NEIGHBOURING part — the composer lost
// the ability to tell who owned what ('I've lost confidence that the
// brackets are being shown with the correct tuba part'). The invariant is
// structural: an above-staff bracket is dir 'up' (hooks drawn descending
// toward its notes), a below-staff bracket dir 'down' (ascending). Checked
// on every tuplet of every part of both real files. Dictated sides remain
// free — the invariant binds hooks to the SIDE, not the side to a rule.
{
  for (const name of ['db1', 'db1-c2d-x01']) {
    const p = path.join(ROOT, 'notation', 'ir', name + '.ir.json');
    if (!fs.existsSync(p)) continue;
    const irH = JSON.parse(fs.readFileSync(p, 'utf8'));
    const LH = Layout.layoutSection(irH, G);
    let inv = 0, n = 0;
    for (const sy of LH.systems) for (const i of sy.items) {
      if (i.k !== 'tuplet') continue;
      n++;
      if ((i.ySs > 0 && i.dir !== 'up') || (i.ySs < 0 && i.dir !== 'down')) inv++;
    }
    ok(inv === 0, name + ': every bracket hooks toward its own staff (' + inv + ' of ' + n + ' inverted)');
  }
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
