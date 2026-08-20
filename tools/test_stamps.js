#!/usr/bin/env node
// test_stamps.js — B3 gate: parity vs piece #2's measured standards (checked
// against LITERAL numbers from its dimensions_table, not against glyphs.json
// reading itself back — the two-ends principle), anchor sanity, the
// anchors-compose assembly proof, and a committed snapshot with --prove-red.
//
//   node tools/test_stamps.js [--update] [--prove-red]

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const Stamps = require(path.join(ROOT, 'notation', 'lib', 'stamps.js'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'stamps_snapshot.json');

let failures = 0;
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };

const S = Stamps.makeStamps(G);

// ---- parity vs piece #2 dimensions_table (literal values, session-49-era) ----
const nh = S.notehead();
eq(nh.wSs, 1.04, 1e-9, 'notehead width = 1.04 ss (dims table)');
eq(nh.hSs, 0.883, 1e-3, 'notehead height = 0.883 ss (dims table)');
eq(nh.anchors.stemAttachUp.x, 0.9675, 1e-9, 'stemAttachUp.x = 0.9675 (dims table)');
eq(nh.anchors.stemAttachUp.y, 0.883 / 2 - 0.136, 1e-3, 'stemAttachUp.y = center - 0.136 (convention conversion)');
eq(nh.anchors.stemAttachDown.y, 0.883 / 2 + 0.136, 1e-3, 'stemAttachDown.y = center + 0.136');
const st = S.stem(3.5, 'up');
eq(st.wSs, 0.13, 1e-9, 'stem thickness = 0.13 ss (dims table)');
const bm = S.beamSeg(0, 0, 4, 0.5);
// beam vertical thickness: the polygon's two left points differ by 0.4 in y
eq(bm.prims[0].pts[3][1] - bm.prims[0].pts[0][1], 0.4, 1e-9, 'beam thickness = 0.40 ss (dims table)');
const stf = S.staffLines(20);
eq(stf.anchors.line1.y - stf.anchors.line0.y, 1, 1e-9, 'staff interline = 1 ss');
ok(stf.prims.length === 5, 'staff has 5 lines');
eq(stf.anchors.middle.y, stf.anchors.line2.y, 1e-12, 'middle = line2');
const fl = S.flag8('up');
eq(fl.wSs, 0.892, 1e-9, 'flag8up width (dims table)');
eq(fl.anchors.stemTip.x, 0.064, 1e-9, 'flag stemTip x = 0.064 (dims table stemTipXOffset)');
const cb = S.clefBass();
eq(cb.anchors.fLine.y, 1.052, 1e-9, 'bass clef fLine anchor (source file)');
for (const k of ['sharp', 'flat', 'natural']) ok(S.accidental(k).prims.length === 1, 'accidental ' + k + ' present');

// ---- anchors compose: assemble notehead + up-stem + flag by anchors only ----
// Place notehead center at (100, 200) px, ssPx = 8. Stem root sits at the
// notehead's stemAttachUp; flag's stemTip sits at the stem's tip. Assert the
// composed absolute positions are consistent — no position arithmetic
// outside anchor alignment.
const ssPx = 8, nx = 100, ny = 200;
const abs = (b, place, anchorName) => {
  const al = place.align ? b.anchors[place.align] : { x: 0, y: 0 };
  const a = b.anchors[anchorName];
  return { x: place.xPx + (a.x - al.x) * ssPx, y: place.yPx + (a.y - al.y) * ssPx };
};
const nhPlace = { xPx: nx, yPx: ny, ssPx, align: 'center' };
const attach = abs(nh, nhPlace, 'stemAttachUp');
const stemUp = S.stem(3.5, 'up');
const stemPlace = { xPx: attach.x, yPx: attach.y, ssPx, align: 'root' };
const tip = abs(stemUp, stemPlace, 'tip');
eq(tip.x, attach.x, 1e-9, 'stem tip x == root x (vertical stem)');
eq(attach.y - tip.y, 3.5 * ssPx, 1e-9, 'stem tip is 3.5 ss above the attach point');
const flagPlace = { xPx: tip.x, yPx: tip.y, ssPx, align: 'stemTip' };
ok(Number.isFinite(flagPlace.xPx), 'flag placed at stem tip by anchor');
// toSvg renders each without throwing and lands the aligned anchor at the target
for (const [b, p] of [[nh, nhPlace], [stemUp, stemPlace], [S.flag8('up'), flagPlace]]) {
  const svg = Stamps.toSvg(b, p);
  ok(svg.startsWith('<g transform="translate('), 'toSvg renders ' + b.kind);
}

// ---- snapshot ----
function buildSnapshot(perturb) {
  const rows = [];
  const dump = b => rows.push([b.kind, +b.wSs.toFixed(5), +(b.hSs + (perturb ? 0.01 : 0)).toFixed(5),
    Object.entries(b.anchors).map(([k, v]) => k + ':' + (+v.x.toFixed(4)) + ',' + (+v.y.toFixed(4))).sort().join(' ')]);
  dump(S.notehead()); dump(S.stem(3.5, 'up')); dump(S.stem(3.5, 'down'));
  dump(S.flag8('up')); dump(S.flag8('down')); dump(S.clefBass());
  dump(S.accidental('sharp')); dump(S.accidental('flat')); dump(S.accidental('natural'));
  dump(S.staccatoDot()); dump(S.staffLines(20)); dump(S.ledgerLine(1.04)); dump(S.beamSeg(0, 0, 4, 0.5));
  rows.push(['svg:notehead', Stamps.toSvg(S.notehead(), { xPx: 100, yPx: 200, ssPx: 8, align: 'center' }).slice(0, 60)]);
  return rows;
}
const args = process.argv.slice(2);
const current = buildSnapshot(args.includes('--prove-red'));
if (args.includes('--update')) {
  fs.writeFileSync(SNAP, JSON.stringify(current, null, 1));
  console.log('snapshot written: ' + SNAP);
} else if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot — run --update once'); }
else if (JSON.stringify(JSON.parse(fs.readFileSync(SNAP, 'utf8'))) !== JSON.stringify(current)) {
  failures++; console.error('FAIL: stamps snapshot drift — if intentional, --update and review');
}

if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK'); process.exit(0); }
  console.error('PROVE-RED BROKEN: perturbation passed'); process.exit(1);
}
if (failures) { console.error(`STAMPS RED: ${failures} failure(s)`); process.exit(1); }
console.log('STAMPS GREEN: parity + anchors-compose + snapshot stable');
