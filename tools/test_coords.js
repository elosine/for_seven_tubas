#!/usr/bin/env node
// test_coords.js — unit + snapshot tests for notation/lib/coords.js (P8:
// regression starts BEFORE the first pixel ships).
//
//   node tools/test_coords.js               run (green/red)
//   node tools/test_coords.js --update      rewrite the committed snapshot
//   node tools/test_coords.js --prove-red   Principle 6 self-check: perturb a
//                                           conversion and assert the
//                                           snapshot comparison FAILS
//
// Snapshot: tools/fixtures/coords_snapshot.json (committed; changing it is a
// reviewed act, never a side effect).

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'coords_snapshot.json');

let failures = 0;
const eq = (a, b, tol, msg) => {
  if (Math.abs(a - b) > (tol || 1e-9)) { failures++; console.error('FAIL ' + msg + ': ' + a + ' vs ' + b); }
};
const ok = (cond, msg) => { if (!cond) { failures++; console.error('FAIL ' + msg); } };

// ---------- unit tests ----------
const parts = [0, 1, 2];
const systems = Coords.systemsForParts(parts, { topPad: 0.05, botPad: 0.05, gap: 0.02 });
ok(systems.length === 3, 'three systems');
ok(systems[0].laneFrac0 < systems[0].laneFrac1, 'band increases');
eq(systems[0].laneFrac0, 0.05, 1e-9, 'top pad');
for (let i = 1; i < systems.length; i++)
  ok(systems[i].laneFrac0 > systems[i - 1].laneFrac1, 'bands disjoint and ordered');
eq(systems[2].laneFrac1, 0.95, 1e-9, 'bottom pad');

const v = Coords.makeView({ widthPx: 1200, heightPx: 600, window: [10, 40], systems });
// round-trips
for (const t of [10, 17.35, 40]) eq(v.secondsOfX(v.xOfSeconds(t)), t, 1e-9, 'seconds round-trip ' + t);
for (const f of [0, 0.4437, 1]) eq(v.laneFracOfY(v.yOfLaneFrac(f)), f, 1e-9, 'laneFrac round-trip ' + f);
const s0 = v.system(0);
for (const ss of [-6, 0, 2.5, 6]) eq(s0.ssOfY(s0.yOfSs(ss)), ss, 1e-9, 'ss round-trip ' + ss);
// orientation: +ss is UP the page (smaller y)
ok(s0.yOfSs(2) < s0.yOfSs(0), '+ss goes up');
// middle line sits mid-band
eq(s0.yOfSs(0), (s0.yTopPx + s0.yBotPx) / 2, 1e-9, 'ss 0 = band middle');
// window edges
eq(v.xOfSeconds(10), 0, 1e-9, 'window start at x=0');
eq(v.xOfSeconds(40), 1200, 1e-9, 'window end at width');

// viewport-invariance (P5 / SZ-7): doubling the viewport doubles every px
// value but changes NO relationship — ratios are identical.
const v2 = Coords.makeView({ widthPx: 2400, heightPx: 1200, window: [10, 40], systems });
eq(v2.xOfSeconds(23.7) / v.xOfSeconds(23.7), 2, 1e-9, 'x scales with width');
eq(v2.system(1).ssPx / v.system(1).ssPx, 2, 1e-9, 'ssPx scales with band (SZ-7)');
eq(
  (v2.system(1).yOfSs(3) - v2.system(1).yOfSs(0)) / (v.system(1).yOfSs(3) - v.system(1).yOfSs(0)),
  2, 1e-9, 'ss offsets scale coherently');

// errors are loud
let threw = false;
try { v.system(9); } catch (e) { threw = true; }
ok(threw, 'unknown part throws');

// ---------- V1: per-part weights (irregular lanes are a config edit) ----------
const wsys = Coords.systemsForParts([0, 1, 2], { topPad: 0.05, botPad: 0.05, gap: 0.02, weights: [2, 1, 1] });
eq(wsys[0].laneFrac0, 0.05, 1e-9, 'weights: top pad holds');
eq(wsys[2].laneFrac1, 0.95, 1e-9, 'weights: bottom pad holds');
const h0 = wsys[0].laneFrac1 - wsys[0].laneFrac0, h1 = wsys[1].laneFrac1 - wsys[1].laneFrac0;
eq(h0 / h1, 2, 1e-9, 'weights: lane heights proportional to weights');
for (let i = 1; i < wsys.length; i++) ok(wsys[i].laneFrac0 > wsys[i - 1].laneFrac1, 'weighted bands disjoint');
threw = false; try { Coords.systemsForParts([0, 1], { weights: [1] }); } catch (e) { threw = true; }
ok(threw, 'weights length mismatch throws');
threw = false; try { Coords.systemsForParts([0, 1], { weights: [1, 0] }); } catch (e) { threw = true; }
ok(threw, 'non-positive weight throws');

// ---------- V1: per-lane ssPerSystem (lane height and staff scale decoupled) ----------
const mixed = [
  { part: 0, laneFrac0: 0.0, laneFrac1: 0.5 },
  { part: 1, laneFrac0: 0.5, laneFrac1: 1.0, ssPerSystem: 24 },
];
const vm = Coords.makeView({ widthPx: 1000, heightPx: 400, window: [0, 10], systems: mixed, ssPerSystem: 12 });
eq(vm.system(0).ssPx, 200 / 12, 1e-9, 'lane 0 uses the view-global staff scale');
eq(vm.system(1).ssPx, 200 / 24, 1e-9, 'lane 1 uses its own staff scale — same height, smaller staff');

// ---------- V1 [A21c]: prefatory gutter — time maps onto [gutterPx, widthPx] ----------
const vg = Coords.makeView({ widthPx: 1200, heightPx: 600, window: [10, 40], systems, gutterPx: 48 });
eq(vg.xOfSeconds(10), 48, 1e-9, 'cursor enters at the gutter edge');
eq(vg.xOfSeconds(40), 1200, 1e-9, 'window end still at width');
eq(vg.pxPerSecond, (1200 - 48) / 30, 1e-9, 'pxPerSecond over the MUSIC width');
for (const t of [10, 23.7, 40]) eq(vg.secondsOfX(vg.xOfSeconds(t)), t, 1e-9, 'gutter round-trip ' + t);
threw = false; try { Coords.makeView({ widthPx: 100, heightPx: 100, window: [0, 1], systems, gutterPx: 100 }); } catch (e) { threw = true; }
ok(threw, 'gutter that leaves no music room throws');

// ---------- V1: the PP-6 zoom invariant — EVERY coordinate scales ×Z ----------
// (uniform AND irregular lanes; prove-red mutates the zoom cfg's staff scale)
function assertZoomInvariant(baseCfg, Z, label, sabotage) {
  const base = Coords.makeView(baseCfg);
  const zc = Coords.zoomCfg(baseCfg, Z);
  if (sabotage) zc.ssPerSystem = (zc.ssPerSystem || Coords.DEFAULTS.ssPerSystem) * 1.3;
  const zoom = Coords.makeView(zc);
  const [zt0, zt1] = zoom.window;
  for (const frac of [0, 0.31, 1]) {
    const t = zt0 + (zt1 - zt0) * frac;
    eq(zoom.xOfSeconds(t), Z * base.xOfSeconds(t), 1e-6, label + ': x ×' + Z + ' @' + frac);
  }
  for (const s of base.systems) {
    const zs = zoom.system(s.part);
    eq(zs.ssPx, Z * s.ssPx, 1e-9, label + ': ssPx ×' + Z + ' part ' + s.part);
    eq(zs.yOfSs(3) - zs.yOfSs(0), Z * (s.yOfSs(3) - s.yOfSs(0)), 1e-9, label + ': ss offsets ×' + Z);
    eq(zs.yTopPx, Z * s.yTopPx, 1e-9, label + ': lane top ×' + Z);
  }
  eq(zoom.pxPerSecond, Z * base.pxPerSecond, 1e-9, label + ': pxPerSecond ×' + Z);
  eq(zoom.gutterPx, Z * (baseCfg.gutterPx || 0), 1e-9, label + ': gutter ×' + Z);
}
const uniformCfg = { widthPx: 1920, heightPx: 1080, window: [49, 61], gutterPx: 48, systems: Coords.systemsForParts([0,1,2,3,4,5,6,7,8,9]) };
const irregularCfg = { widthPx: 1920, heightPx: 1080, window: [49, 61], gutterPx: 48, systems: Coords.systemsForParts([0,1,2,3,4,5,6,7,8,9], { weights: [2,1,1,1,1,1,1,1,1,3] }) };
assertZoomInvariant(uniformCfg, 2, 'zoom uniform');
assertZoomInvariant(irregularCfg, 2, 'zoom irregular');
assertZoomInvariant(uniformCfg, 3, 'zoom Z=3');
// prove-red also sabotages the zoom cfg's staff scale — the invariant
// assertions must catch it (Principle 6: see it go red)
if (process.argv.includes('--prove-red')) assertZoomInvariant(uniformCfg, 2, 'zoom SABOTAGE (must fail)', true);

// ---------- V1: the px boundary — layout.js must never compute pixels ----------
const layoutSrc = fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'layout.js'), 'utf8');
ok(!/[a-z]Px\b/.test(layoutSrc) && !/pxPerSecond/.test(layoutSrc) && !/widthPx|heightPx/.test(layoutSrc),
  'px boundary: layout.js is pixel-free (seconds + ss only)');

// ---------- snapshot ----------
function buildSnapshot(perturb) {
  const out = {};
  const cfgs = {
    'scroll-1200x600-w10-40': { widthPx: 1200, heightPx: 600, window: [10, 40], systems },
    'page-800x1000-w0-12': {
      widthPx: 800, heightPx: 1000, window: [0, 12],
      systems: Coords.systemsForParts([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    },
  };
  for (const [name, cfg] of Object.entries(cfgs)) {
    const view = Coords.makeView(cfg);
    const rows = [];
    for (const t of [cfg.window[0], (cfg.window[0] + cfg.window[1]) / 2, cfg.window[1]])
      rows.push(['xOfSeconds', t, +view.xOfSeconds(t).toFixed(6)]);
    for (const s of view.systems) {
      rows.push(['system', s.part, +s.yTopPx.toFixed(6), +s.yBotPx.toFixed(6), +s.ssPx.toFixed(6)]);
      for (const ss of [-4, 0, 4])
        rows.push(['yOfSs', s.part, ss, +(s.yOfSs(ss) + (perturb ? 1 : 0)).toFixed(6)]);
    }
    out[name] = rows;
  }
  return out;
}

const args = process.argv.slice(2);
const current = buildSnapshot(args.includes('--prove-red'));
if (args.includes('--update')) {
  fs.mkdirSync(path.dirname(SNAP), { recursive: true });
  fs.writeFileSync(SNAP, JSON.stringify(current, null, 1));
  console.log('snapshot written: ' + SNAP);
} else {
  if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot — run --update once and commit it'); }
  else {
    const want = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
    const a = JSON.stringify(want), b = JSON.stringify(current);
    if (a !== b) { failures++; console.error('FAIL: snapshot drift — a coordinate changed; if intentional, --update and review the diff'); }
  }
}

if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK: the perturbed run fails as it must'); process.exit(0); }
  console.error('PROVE-RED BROKEN: perturbation passed — the snapshot asserts nothing');
  process.exit(1);
}
if (failures) { console.error(`COORDS RED: ${failures} failure(s)`); process.exit(1); }
console.log('COORDS GREEN: unit tests + snapshot stable');
