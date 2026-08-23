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
// the pie port: OFF in the registry since day 24 (the density build's groups are
// provenance, not motives), so the coverage check runs with the switch forced on —
// and the registry value itself is asserted off, so a silent flip back is caught
ok(ST.motivePie.enabled === false, 'registry: motivePie is OFF (day 24)');
ok(byKind('motivePie').length === 0, 'motivePie OFF collects no pies');
{
  const ON = JSON.parse(JSON.stringify(ST)); ON.motivePie.enabled = true;
  const pies = Anim.collect(ir, score, ON).filter(i => i.kind === 'motivePie');
  ok(pies.length === 1 && pies[0].t0 === 14 && pies[0].t1 === 17.5, 'group span -> motivePie (switch on)');
}

// ---------- behavior spot-checks (pure geometry) ----------
// gc: THE GC OBJECT'S BALL (day 23, ported whole from piece #1 via
// notation/lib/gc.js). Every number below is asserted against piece #1's
// stated look (LOOK) and the preset's own arithmetic — never against a
// re-run of the code under test. NaN guard: every read is checked finite.
const GCm = require(path.join(ROOT, 'notation', 'lib', 'gc.js'));
const gcSt = ST.gc, gcSys = view.system(4);
const P = gcSt.preset;
const PRE = P.duration * P.descentRatio / 100;          // 0.36 at the Short preset
const POST = P.duration * (1 - P.descentRatio / 100);   // 0.24
const circleAt = t => { const m = Anim._registry.gc(byKind('gc')[0], view, t, gcSt); if (!m.length) return null;
  const c = { cx: +m[0].match(/cx="(-?[\d.]+)"/)[1], cy: +m[0].match(/cy="(-?[\d.]+)"/)[1], r: +m[0].match(/r="(-?[\d.]+)"/)[1], fill: m[0].match(/fill="([^"]+)"/)[1] };
  if (![c.cx, c.cy, c.r].every(Number.isFinite)) { failures++; console.error('FAIL gc: non-finite geometry at t=' + t + ' ' + m[0]); }
  return c; };
const yAt = t => { const c = circleAt(t); return c ? c.cy : null; };
// piece #1's geometry: k = frame magnification; height = lane − 10; ball r 5;
// stated at the 1080 frame. The LANDING HEIGHT is registry data (day 24: the
// composer lowered the ball to the lane edge so bottom-octave heads stop
// sharing a position with the disc), so read it rather than restate it.
const k = view.heightPx / GCm.LOOK.frameHeightPx;
// ...and the two copies MUST agree, or the ball lands where the disc is not.
// They live in different registry blocks and nothing else checks them.
ok(C.animated.gc.look.impactInsetPx === C.engraving.render.gc.look.impactInsetPx,
  'registry: animated + static impactInsetPx agree (' + C.animated.gc.look.impactInsetPx +
  ' vs ' + C.engraving.render.gc.look.impactInsetPx + ')');
// ...and the LAYOUT copy, in ss, must convert to the same thing. The radius is
// the one quantity stated in BOTH units, so it carries the conversion.
{
  const pxPerSs = C.engraving.render.gc.look.impactRadiusPx / C.engraving.layout.gcImpactRadiusSs;
  const expect = C.animated.gc.look.impactInsetPx / pxPerSs;
  ok(Math.abs(C.engraving.layout.gcImpactInsetSs - expect) < 1e-6,
    'registry: gcImpactInsetSs (' + C.engraving.layout.gcImpactInsetSs + ') = impactInsetPx converted through the radius (' + expect.toFixed(4) + ')');
}
const INSET = C.animated.gc.look.impactInsetPx;
const yLand = gcSys.yBotPx - INSET * k, drop = gcSys.heightPx - 10 * k;
const hAt = t => (yLand - yAt(t)) / drop;               // height above impact, 0..1
const HTOL = 0.06 / drop;   // cy is written at toFixed(1) — compare within half a rounded pixel
ok(yAt(14.0 - PRE - 0.01) === null && yAt(14.0 + POST + 0.01) === null, 'gc active only over [at-0.36, at+0.24]');
ok(yAt(14.0 - PRE + 0.001) !== null && yAt(14.0 + POST - 0.001) !== null, 'gc active inside that span');
eq(hAt(14.0), 0, HTOL, 'gc: at impact the ball sits on the registry landing height (inset ' + INSET + ' px)');
eq(hAt(14.0 - PRE), 1, HTOL, 'gc: starts at the full drop = lane height − 10 (piece #1 h)');
eq(hAt(14.0 + POST), P.damping / 100, HTOL, 'gc rebounds to damping/100 of the drop');
eq(hAt(14.0 - PRE / 2), 1 - Math.pow(0.5, 1 + (P.ictus / 1000) * 20), HTOL, 'descent follows 1 - u^descentPower (the ictus hang)');
eq(hAt(14.0 + POST / 2), (P.damping / 100) * (1 - Math.pow(0.5, 1 + P.stiffness / 50)), HTOL, 'ascent follows 1 - (1-u)^ascentPower');
ok(hAt(13.7) > hAt(13.9), 'drop height grows with time-to-impact (readable trajectory)');
// THE BALL TRAVELS IN TIME (piece #1 calculateBallPositionForPage): x is the
// playhead's x, so it arrives at the go line exactly at impact
{
  const c0 = circleAt(14.0 - PRE), c1 = circleAt(14.0), c2 = circleAt(14.0 + POST);
  eq(c1.cx, view.xOfSeconds(14.0), 0.06, 'gc: ball on the go line at impact');
  eq(c0.cx, view.xOfSeconds(14.0 - PRE), 0.06, 'gc: ball starts duration·descentRatio to the LEFT of the go line');
  ok(c0.cx < c1.cx && c1.cx < c2.cx, 'gc: ball moves left→right with time');
  eq(c1.r, 5 * k, 0.06, 'gc: ball radius = piece #1 5 px × frame magnification');
  ok(c1.fill === 'rgb(255, 21, 160)', 'gc: ball color = piece #1 neonMagenta (' + c1.fill + ')');
}
// the static ink (render.js) shares the SAME physics module — assert the
// arc's endpoints and the impact marker against the identical numbers
{
  const Render = require(path.join(ROOT, 'notation', 'lib', 'render.js'));
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
  const model = { systems: [{ part: 4, items: [{ k: 'gc', t: 14.0, ev: 'x' }] }] };
  const svg = Render.renderSection(model, view, G, { engraving: C.engraving.render });
  const arc = svg.match(/<path class="gc-arc" d="([^"]+)" stroke="([^"]+)" stroke-width="([\d.]+)" fill="none"\/>/);
  ok(!!arc, 'render: the GC arc is drawn');
  if (arc) {
    const pts = arc[1].split(/\s*[ML]/).filter(x => x.trim()).map(p => p.trim().split(/\s+/).map(Number));
    ok(pts.length === 201, 'render: 201 samples (piece #1 numSamples 100 per phase) — ' + pts.length);
    eq(pts[0][0], view.xOfSeconds(14.0 - PRE), 0.06, 'render: arc starts at impact − 0.36 s');
    eq(pts[0][1], yLand - drop, 0.06, 'render: arc starts at the apex (drop above the landing height)');
    eq(pts[100][0], view.xOfSeconds(14.0), 0.06, 'render: arc passes the go line at sample 100');
    eq(pts[100][1], yLand, 0.06, 'render: arc touches the impact point');
    eq(pts[200][0], view.xOfSeconds(14.0 + POST), 0.06, 'render: arc ends at impact + 0.24 s');
    ok(arc[2] === 'rgb(255, 21, 160)', 'render: arc stroke = neonMagenta');
    eq(+arc[3], 1.5 * k, 0.01, 'render: arc stroke-width = piece #1 1.5 px × magnification');
  }
  const imp = svg.match(/<circle class="gc-impact" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="([^"]+)"\/>/);
  ok(!!imp, 'render: the impact marker is drawn');
  if (imp) {
    eq(+imp[1], view.xOfSeconds(14.0), 0.06, 'render: impact marker on the go line');
    eq(+imp[2], yLand, 0.06, 'render: impact marker at the registry landing height (inset ' + INSET + ' px)');
    eq(+imp[3], 4 * k, 0.01, 'render: impact marker r = piece #1 4 px × magnification');
  }
  // the ball lands ON the impact marker: same point, from the two modules
  const cImp = circleAt(14.0);
  if (imp && cImp) { eq(cImp.cx, +imp[1], 0.06, 'ball and marker agree in x at impact'); eq(cImp.cy, +imp[2], 0.06, 'ball and marker agree in y at impact'); }
}
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
  // day 23: the fortepiano carries a GC too (composer) — both notes get one,
  // each impacting on its own go time
  ok(gcs.length === 2 && gcs.every(g => g._src === 'device'), 'staccato AND fortepiano devices -> a per-note GC each (' + gcs.length + ')');
  const ats = gcs.map(g => g.at).sort((a, b) => a - b);
  eq(ats[0], 14.544, 1e-9, 'fp GC impact = its go time');
  eq(ats[1], 17.749, 1e-9, 'staccato GC impact = its go time (the ball lands ON the go line)');
  // EVERY BALL HAS AN ARC (day 23 bug: a leftover chunk device put a ball on
  // wc-49 with nothing drawn). Assert the two sources agree on this IR.
  {
    const Layout2 = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
    const G2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
    const real = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'db1.ir.json'   /* day 25: the canonical section file (the T1 working file was pruned); strictly more coverage */), 'utf8'));
    const balls = Anim.collect(real, null, ST, { parts: real.source.parts, deviceOf: Layout2.deviceResolver(real, (C.engraving || {}).layout || {}) }).filter(i => i.kind === 'gc');
    const arcs = Layout2.layoutSection(real, G2, (C.engraving || {}).layout || {}).systems
      .flatMap(sy => sy.items).filter(i => i.k === 'gc').map(i => +i.t.toFixed(6));
    const missing = balls.map(b => +b.at.toFixed(6)).filter(t => !arcs.includes(t));
    ok(missing.length === 0, 'every ball has an arc on the real working IR (' + balls.length + ' balls, ' + arcs.length + ' arcs; orphans: ' + JSON.stringify(missing) + ')');
  }
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
