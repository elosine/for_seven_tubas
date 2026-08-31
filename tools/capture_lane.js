#!/usr/bin/env node
// capture_lane.js — render ONE part's lane at one instant as a standalone SVG,
// for the Performance Instructions images (day 40, running-order step 4).
// The static sheet and the animated overlay come from the SAME modules the app
// and the video use (renderSection + frameSvg, drawnOf wired), so the image
// cannot drift from the score.
//
//   node tools/capture_lane.js --part 1 --t 691.19 --window 688.8-692.0 \
//        --out docs/notation_instructions/images/curve_cresc_691_T2.svg
//        [--width 1500] [--height 290] [--ir db1]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Render = require(path.join(ROOT, 'notation', 'lib', 'render.js'));
const Anim = require(path.join(ROOT, 'notation', 'lib', 'animobj.js'));

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const part = parseInt(arg('part', '0'), 10);
const t = parseFloat(arg('t', '0'));
const [w0, w1] = arg('window', '0-10').split('-').map(Number);
const widthPx = parseInt(arg('width', '1500'), 10);
const heightPx = parseInt(arg('height', '290'), 10);
const irId = arg('ir', 'db1');
const out = arg('out', null);
if (!out) { console.error('capture_lane: --out is required'); process.exit(1); }

const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const C = rd('notation/registry/container.json');
const glyphs = rd('notation/lib/glyphs.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));

const model = Layout.layoutSection(ir, glyphs, Object.assign(
  { m4AttackLines: false, frameParts: ir.source.parts.slice() },
  (C.engraving && C.engraving.layout) || {}));

// single-system view, the window-path recipe for one part
const view = Coords.makeView({
  widthPx, heightPx, window: [w0, w1],
  systems: Coords.systemsForParts([part], { topPad: 24 / heightPx, botPad: 10 / heightPx, gap: 8 / heightPx }),
});

let svg = Render.renderSection(model, view, glyphs, {
  engraving: (C.engraving && C.engraving.render) || {}, staffFull: true,
});

// the animated layer at instant t — same wiring as the app (deviceOf + drawnOf)
const dev = Layout.deviceResolver(ir, (C.engraving || {}).layout || {});
const inst = Anim.collect(ir, null, C.animated, {
  parts: ir.source.parts, meta: false,
  deviceOf: dev, drawnOf: e => Layout.drawnLevelSamples(e, dev(e) || {}),
}).filter(i => i.part === undefined || i.part === part);
const overlay = Anim.frameSvg(inst, view, t, C.animated);
svg = svg.replace('</svg>', '<g class="anim">' + overlay + '</g></svg>');

// white ground so the image stands alone (the app supplies its own page ground)
svg = svg.replace(/(<svg[^>]*>)/, '$1<rect x="0" y="0" width="' + widthPx + '" height="' + heightPx + '" fill="#fff"/>');

fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
fs.writeFileSync(path.join(ROOT, out), svg);
console.log('wrote ' + out + '  (' + svg.length + ' bytes, part T' + (part + 1) + ' @ ' + t + ' s, window ' + w0 + '-' + w1 + ')');
