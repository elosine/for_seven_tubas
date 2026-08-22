#!/usr/bin/env node
// test_animobj.js — V2 gate battery: the animated-object contract + the
// clock interface.
//   node tools/test_animobj.js               run
//   node tools/test_animobj.js --prove-red   register a deliberately
//                                            STATEFUL object and assert
//                                            the determinism test fails
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Anim = require(path.join(ROOT, 'notation', 'lib', 'animobj.js'));
const Transport = require(path.join(ROOT, 'notation', 'lib', 'transport.js'));
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));
const ST = C.animated;

let failures = 0;
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };

// ---------- THE PX/CLOCK BOUNDARIES (source scans) ----------
// animobj may never read a clock; transport is the ONLY clock reader.
const animSrc = fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'animobj.js'), 'utf8');
ok(!/performance\.now|Date\.now|currentTime|requestAnimationFrame|new Date/.test(animSrc),
  'clock boundary: animobj.js reads no time source');
for (const f of ['coords.js', 'layout.js', 'render.js', 'splice.js']) {
  const s = fs.readFileSync(path.join(ROOT, 'notation', 'lib', f), 'utf8');
  ok(!/performance\.now|audio\.currentTime/.test(s), 'clock boundary: ' + f + ' reads no time source');
}

// staffPos mirror assertion (Principle 5: assert the two ends against each
// other, never each against a shared helper)
for (const midi of [30, 43, 47, 52, 65, 67]) {
  const pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
  const STEPS = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
  const viaLayout = Layout.staffPosBass({ step: STEPS[pc][0], alter: STEPS[pc][1], octave: oct });
  eq(Anim.staffPosOfMidi(midi), viaLayout, 1e-12, 'staffPos mirror at midi ' + midi);
}

// ---------- fixtures: a real view + synthetic instances ----------
const systems = Coords.systemsForParts([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
const view = Coords.makeView({ widthPx: 1920, heightPx: 1080, window: [10, 22], gutterPx: 48, systems, ssPerSystem: 13 });
const score = {
  objects: [
    { type: 'waveCurve', layer: 2, sonifyNote: 47, startSeconds: 12, endSeconds: 16, morphBend: [[0, 0], [4, 2]] },
    { type: 'waveCurve', layer: 10, startSeconds: 11, endSeconds: 21, color: '#2E8B57', nodes: [{ pos: 0, y: 2 }, { pos: 1, y: 9 }] },
    { type: 'waveCurve', layer: 5, sonifyNote: 43, startSeconds: 13, endSeconds: 19 },              // 6 s hold -> lineWedge
    { type: 'waveCurve', layer: 1, sonifyNote: 40, startSeconds: 14, endSeconds: 15, groupId: 'grp-x' },
    { type: 'waveCurve', layer: 3, sonifyNote: 45, startSeconds: 15, endSeconds: 17.5, groupId: 'grp-x' },
  ],
};
const ir = { chunks: [{ part: 4, devices: [{ kind: 'gc', at: 14.0 }] }] };
const inst = Anim.collect(ir, score, ST);

// collect coverage: every kind bound from its stratum
const byKind = k => inst.filter(i => i.kind === k);
ok(byKind('gc').length === 1 && byKind('gc')[0]._src === 'ir-device', 'gc collected from IR devices');
ok(byKind('curveFollower').length === 1, 'morph bend -> curveFollower');
ok(byKind('envFollower').length === 1, 'layer-10 shape -> envFollower');
ok(byKind('lineWedge').length === 1, 'long hold -> lineWedge (morph and short notes excluded)');
ok(byKind('motivePie').length === 1 && byKind('motivePie')[0].t0 === 14 && byKind('motivePie')[0].t1 === 17.5,
  'group span -> motivePie');

// ---------- behavior spot-checks (pure geometry) ----------
// gc: THE REAL TRAJECTORY (day 23) — piece #1's GCMaker formulas, asserted
// against the preset's own arithmetic, not against a copy of the code.
const gcSt = ST.gc, gcSys = view.system(4);
const P = gcSt.preset;
const PRE = P.duration * P.descentRatio / 100;          // 0.36 at the Short preset
const POST = P.duration * (1 - P.descentRatio / 100);   // 0.24
const yAt = t => { const m = Anim._registry.gc(byKind('gc')[0], view, t, gcSt); return m.length ? parseFloat(m[0].match(/cy="(-?[\d.]+)"/)[1]) : null; };
// THE LANE LAW (day 23, composer): impact at the lane BOTTOM, apex at the
// lane TOP, each inset by the ball's radius so the disc is whole there.
const rPx = gcSt.radiusSs * gcSys.ssPx;
const inset = gcSt.insetSs != null ? gcSt.insetSs * gcSys.ssPx : rPx;
const yLand = gcSys.yBotPx - inset, drop = (gcSys.yBotPx - gcSys.yTopPx) - 2 * inset;
const hAt = t => (yLand - yAt(t)) / drop;               // height above the landing line, 0..1
const HTOL = 0.06 / drop;   // cy is written at toFixed(1) — compare within half a rounded pixel
// stated as the composer stated it: the ball's own edges touch the lane's
eq(yAt(14.0) + rPx, gcSys.yBotPx, 0.06, 'gc: at impact the ball sits ON the lane bottom');
eq(yAt(14.0 - PRE) - rPx, gcSys.yTopPx, 0.06, 'gc: the arc tops out AT the lane top');
eq(drop + 2 * rPx, gcSys.yBotPx - gcSys.yTopPx, 1e-9, 'gc: the trajectory spans the whole lane height');
// the SPAN is asymmetric and comes from the preset (piece #1's stored GCs
// carry exactly this: start = impact - 0.36, end = impact + 0.24)
ok(yAt(14.0 - PRE - 0.01) === null && yAt(14.0 + POST + 0.01) === null, 'gc active only over [at-0.36, at+0.24]');
ok(yAt(14.0 - PRE + 0.001) !== null && yAt(14.0 + POST - 0.001) !== null, 'gc active inside that span');
eq(hAt(14.0), 0, HTOL, 'gc lands exactly on the tick at impact time');
eq(hAt(14.0 - PRE), 1, HTOL, 'gc starts at the full drop height');
// rebound = damping/100 (100 => the ball returns to full height)
eq(hAt(14.0 + POST), P.damping / 100, HTOL, 'gc rebounds to damping/100 of the drop');
// THE ICTUS SHAPE: descentPower 2.8 means the ball hangs, then drops late —
// at the MIDPOINT of the descent it has fallen only 1 - 0.5^2.8 of the way
eq(hAt(14.0 - PRE / 2), 1 - Math.pow(0.5, 1 + (P.ictus / 1000) * 20), HTOL, 'descent follows 1 - u^descentPower (the ictus hang)');
// ascent eases out with ascentPower = 1 + stiffness/50
eq(hAt(14.0 + POST / 2), (P.damping / 100) * (1 - Math.pow(0.5, 1 + P.stiffness / 50)), HTOL, 'ascent follows 1 - (1-u)^ascentPower');
ok(hAt(13.7) > hAt(13.9), 'drop height grows with time-to-impact (readable trajectory)');
// ---- per-NOTE GC from the engraving device (day 23, wc-29) ----
{
  const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
  const nir = {
    irVersion: 1, id: 'gc-dev', source: { score: 'x', window: [0, 20], parts: [0] },
    events: [{ id: 'ev-a', onset: 17.749, duration: 0.46, pitch: { midi: 31, spelled: { step: 'G', alter: 0, octave: 1 } }, technique: 'staccato', provenance: 'derived' },
             { id: 'ev-b', onset: 14.544, duration: 1.49, pitch: { midi: 32, spelled: { step: 'G', alter: 1, octave: 1 } }, technique: 'fortepiano', provenance: 'derived' }],
    chunks: [{ id: 'c-a', part: 0, span: [17.749, 20], class: 'fixed-oneshot', strategy: 'unresolved', events: ['ev-a'] },
             { id: 'c-b', part: 0, span: [14.544, 17.749], class: 'fixed-oneshot', strategy: 'unresolved', events: ['ev-b'] }], overlays: [],
  };
  const gcs = Anim.collect(nir, null, ST, { parts: [0], deviceOf: Layout.deviceResolver(nir, {}) }).filter(i => i.kind === 'gc');
  ok(gcs.length === 1 && gcs[0]._src === 'device', 'staccato device -> exactly one per-note GC (the fp has none)');
  eq(gcs[0].at, 17.749, 1e-9, 'per-note GC impact = the note go time (so the ball lands ON the go line)');
  const none = Anim.collect(nir, null, ST, { parts: [0] }).filter(i => i.kind === 'gc');
  ok(none.length === 0, 'no resolver -> no per-note GCs (opt-in, nothing implicit)');
}

// curveFollower: y moves with the bend (midi 47 bending +2 st over 4 s)
const cf = byKind('curveFollower')[0], cfSt = ST.curveFollower;
const cfy = t => parseFloat(Anim._registry.curveFollower(cf, view, t, cfSt)[0].match(/cy="([\d.]+)"/)[1]);
ok(cfy(16) < cfy(12), 'follower rises as the bend rises');
eq(cfy(12), view.system(2).yOfSs(Anim.staffPosOfMidi(47)), 0.11, 'follower starts at the unbent pitch');

// envFollower: rides the level envelope bottom->top
const ef = byKind('envFollower')[0], efSt = ST.envFollower;
const efy = t => parseFloat(Anim._registry.envFollower(ef, view, t, efSt)[0].match(/cy="([\d.]+)"/)[1]);
ok(efy(20.9) < efy(11.1), 'env follower rises with the crescendo');

// lineWedge: fill fraction 0 at start, full circle near the end
const lw = byKind('lineWedge')[0], lwSt = ST.lineWedge;
ok(Anim._registry.lineWedge(lw, view, 13.0, lwSt).join('').includes('path') === false, 'wedge empty at exact hold start');
ok(Anim._registry.lineWedge(lw, view, 18.99, lwSt).join('').includes('circle cx'), 'wedge ~full near hold end');

// frameSvg: cursor present inside the window, absent outside; part-scoped
// instances outside the view are skipped silently
const partial = Coords.makeView({ widthPx: 1920, heightPx: 300, window: [10, 22], systems: Coords.systemsForParts([0, 1]) });
ok(Anim.frameSvg(inst, view, 15, ST).includes('<line'), 'cursor drawn inside the window');
ok(!Anim.frameSvg(inst, view, 9, ST).includes('<line'), 'no cursor outside the window');
ok(Anim.frameSvg(inst, partial, 14.0, ST).indexOf('circle') === -1 || true, 'partial view: no throw on out-of-view parts');

// ---------- THE DETERMINISM TEST (the contract itself) ----------
// play-through: call every instance at a dense t sequence, then at T.
// cold-seek: call ONLY at T. Byte-identical frames required.
function frameAt(T, playThrough) {
  if (playThrough) for (let t = 10; t < T; t += 0.05) Anim.frameSvg(inst, view, t, ST);
  return Anim.frameSvg(inst, view, T, ST);
}
if (process.argv.includes('--prove-red')) {
  // a deliberately STATEFUL object — the determinism test MUST catch it
  let evilCalls = 0;
  Anim.register('evil', () => { evilCalls++; return ['<rect x="' + evilCalls + '" width="1" height="1" y="0"/>']; });
  inst.push({ kind: 'evil', t0: 10, t1: 22 });
}
for (const T of [12.5, 14.0, 17.3, 21.9]) {
  const a = frameAt(T, true), b = frameAt(T, false);
  ok(a === b, 'determinism: cold-seek ' + T + ' === play-through ' + T);
}

// ---------- transport (fake timebase — no real clock in tests) ----------
let fake = 100;
const tp = Transport.makeTransport({ timebase: { now: () => fake } });
eq(tp.now(), 0, 1e-12, 'transport starts at 0, paused');
tp.play(); fake += 2.5;
eq(tp.now(), 2.5, 1e-12, 'transport advances with the timebase while playing');
tp.pause(); fake += 5;
eq(tp.now(), 2.5, 1e-12, 'transport holds position while paused');
tp.seek(40); fake += 1;
eq(tp.now(), 40, 1e-12, 'seek while paused parks at the target');
tp.play(); fake += 0.75;
eq(tp.now(), 40.75, 1e-12, 'play resumes from the seek target');
tp.seek(10); fake += 0.25;
eq(tp.now(), 10.25, 1e-12, 'seek while playing rebases cleanly');
const audioStub = { currentTime: 7, paused: false, play() { this.paused = false; }, pause() { this.paused = true; } };
tp.attachAudio(audioStub, 100);
eq(tp.now(), 107, 1e-12, 'audio-slaved: S1 t = currentTime + offset');
tp.detachAudio(); eq(tp.now(), 107, 1e-12, 'detach keeps the position');

if (process.argv.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK: the stateful object was caught'); process.exit(0); }
  console.error('PROVE-RED BROKEN: a stateful object passed the determinism test');
  process.exit(1);
}
if (failures) { console.error(`ANIMOBJ RED: ${failures} failure(s)`); process.exit(1); }
console.log('ANIMOBJ GREEN: contract + 5 ports + transport + boundaries');
