#!/usr/bin/env node
// capture_lane.js — render ONE part's lane at one instant as a standalone SVG,
// for the Performance Instructions images (day 40, running-order step 4).
//
// v2 (day 40, after the composer's RETRY): the first version invented its own
// single-lane geometry and everything scaled wrong (thin arcs, missing discs,
// bricks showing). This version renders THE JURY FRAME itself — the exact
// container/zoom geometry the composer approves in the app and the video
// (static_page.js + the exporter's lane recipe, D4 bricks off) — and then
// CROPS the SVG to the requested lane and time span via the viewBox. Nothing
// is re-scaled by hand, so the image cannot look different from the app.
//
//   node tools/capture_lane.js --part 3 --t 7.33 --span 7.15-7.95 \
//        --out docs/notation_instructions/images/x.svg [--zoom 2] [--ir db1]
//
//   --span   the time range the image shows (the crop)
//   --zoom   horizontal scale, app-zoom units: px/s = 1920 / (11.41 / zoom).
//            Default 2 (the composer's working zoom). The render window is
//            centred on the span at that scale; a span wider than the window
//            widens it (px/s drops, geometry does not).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Anim = require(path.join(ROOT, 'notation', 'lib', 'animobj.js'));
const StaticPage = require(path.join(ROOT, 'notation', 'lib', 'static_page.js'));

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : dflt;
};
const part = parseInt(arg('part', '0'), 10);
const t = parseFloat(arg('t', '0'));
const [s0, s1] = arg('span', '0-10').split('-').map(Number);
const zoom = parseFloat(arg('zoom', '2'));
const irId = arg('ir', 'db1');
const out = arg('out', null);
if (!out) { console.error('capture_lane: --out is required'); process.exit(1); }

const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const C = rd('notation/registry/container.json');
const glyphs = rd('notation/lib/glyphs.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));

// ---- THE JURY FRAME, exactly as export_video.js builds it ----
const FRAME_PARTS = ir.source.parts.slice();
const rz = (C.realizations || {})['video-jury'] || {};
const lanes = rz.lanes || { padTopPx: 8, padBotPx: 8, gapPx: 4 };
const W = (C.frame && C.frame.widthPx) || 1920;
const H = (C.frame && C.frame.heightPx) || 1080;
const topPad = lanes.padTopPx / H, botPad = lanes.padBotPx / H;
const gap = lanes.gapPx / H;
const systems = Coords.systemsForParts(FRAME_PARTS, { topPad, botPad, gap, weights: lanes.weights });

// ---- window: the span centred at the app-zoom horizontal scale ----
const pageSeconds = 11.41;                       // the approved density (D-log)
let winSpan = pageSeconds / zoom;
if (s1 - s0 > winSpan) winSpan = s1 - s0;        // wide span wins; px/s drops
const mid = (s0 + s1) / 2;
const w0 = mid - winSpan / 2, w1 = mid + winSpan / 2;

const model = Layout.layoutSection(ir, glyphs, Object.assign(
  { m4AttackLines: false, frameParts: FRAME_PARTS },
  (C.engraving && C.engraving.layout) || {}));
const view = Coords.makeView({ widthPx: W, heightPx: H, window: [w0, w1], systems });

// ---- static page (shared module: D4 bricks off, engraving registry) ----
let svg = StaticPage.staticPageSvg({
  model, view, glyphs, C,
  srcEnd: ir.source.window[1], ownsEnd: false, edgeBar: false,
});

// ---- the animated layer at instant t — the app/exporter wiring verbatim ----
const dev = Layout.deviceResolver(ir, (C.engraving || {}).layout || {});
const inst = Anim.collect(ir, null, C.animated, {
  parts: ir.source.parts, meta: false,
  deviceOf: dev, drawnOf: e => Layout.drawnLevelSamples(e, dev(e) || {}),
});
const overlay = Anim.frameSvg(inst, view, t, C.animated);
svg = svg.replace('</svg>', '<g class="anim">' + overlay + '</g></svg>');

// ---- crop to the lane + span, via the viewBox — no rescaling ----
const sys = view.system(part);
// headroom above the lane so GC arc apexes are not clipped (they legitimately
// overflow the lane band in the frame); a little below for descenders.
const padTop = parseFloat(arg('padTop', '30'));
const padBot = parseFloat(arg('padBot', '6'));
const y0 = sys.yTopPx - padTop, hCrop = (sys.yBotPx - sys.yTopPx) + padTop + padBot;
const x0 = view.xOfSeconds(s0), x1 = view.xOfSeconds(s1);
const wCrop = x1 - x0;
svg = svg
  .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="' + wCrop.toFixed(0) +
    '" height="' + hCrop.toFixed(0) + '" viewBox="' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' ' +
    wCrop.toFixed(1) + ' ' + hCrop.toFixed(1) + '">' +
    '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + wCrop.toFixed(1) +
    '" height="' + hCrop.toFixed(1) + '" fill="#fff"/>');

fs.mkdirSync(path.dirname(path.join(ROOT, out)), { recursive: true });
fs.writeFileSync(path.join(ROOT, out), svg);
console.log('wrote ' + out + '  (' + svg.length + ' bytes · T' + (part + 1) + ' @ ' + t +
  ' s · span ' + s0 + '-' + s1 + ' · window ' + w0.toFixed(2) + '-' + w1.toFixed(2) +
  ' · crop ' + wCrop.toFixed(0) + 'x' + hCrop.toFixed(0) + ')');
