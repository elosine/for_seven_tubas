#!/usr/bin/env node
// export_video.js — the notation page, frame by frame, into an mp4.
//
// PHASE 2.2 of docs/plans/VIDEO_BUILD_PLAN.md. One transport `t` drives
// everything: layout + render give the STATIC page, animobj.frameSvg(t) gives
// the moving layer, and the two are composited and piped straight into
// ffmpeg's stdin — no staged PNGs, no disk churn.
//
//   node tools/export_video.js --ir db1 --view video --fps 30 \
//        --audio notation/audio/piece-final-draft-001.wav --out out.mp4
//        [--z 2] [--t0 S --t1 S] [--probe 703.5,710.2 --probeDir dir]
//
// THE PAGE CACHE (2.1's profile, and the whole reason this is fast): resvg
// spends 131 ms parsing a 234 KB page SVG and 13 ms actually drawing it. The
// static page does not change for the 360 frames of a 12 s page — only the
// overlay does. So each page is rasterized ONCE and every frame composites a
// small overlay over the cached pixels. 64 page rasters for the whole piece.
//
// FONTS: never let the rasterizer resolve by family. Windows carries
// CrimsonPro-VariableFont_wght.ttf as "Crimson Pro" and the page asks for
// "Crimson Pro Light" — a system lookup silently draws weight 400 instead of
// the repo's Light 300. loadSystemFonts:false + explicit files, always.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Render = require(path.join(ROOT, 'notation', 'lib', 'render.js'));
const Splice = require(path.join(ROOT, 'notation', 'lib', 'splice.js'));
const AnimObj = require(path.join(ROOT, 'notation', 'lib', 'animobj.js'));
const { Resvg } = require('@resvg/resvg-js');

// ---------------------------------------------------------------- args
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const irId = arg('ir', 'db1');
const viewMode = arg('view', 'video');            // video | zoom
const fps = parseFloat(arg('fps', '30'));
const zoomZ = parseFloat(arg('z', '0')) || null;
const audio = arg('audio', null);
const outFile = arg('out', null);
const tStart = arg('t0') != null ? parseFloat(arg('t0')) : null;
const tEnd = arg('t1') != null ? parseFloat(arg('t1')) : null;
const probes = (arg('probe', '') || '').split(',').filter(Boolean).map(Number);
const probeDir = arg('probeDir', path.join(ROOT, 'notation', 'video', 'probe'));
const dumpPage = arg('dumpPage');
if (!outFile && !probes.length && dumpPage == null) {
  console.error('usage: export_video.js --ir <id> --view video|zoom --fps N --audio <wav> --out <mp4>');
  console.error('       (or --probe t1,t2,... --probeDir <dir> to write single frames instead)');
  console.error('       (or --dumpPage N [--dumpTo file.svg] to write one static page SVG)');
  process.exit(2);
}

// ---------------------------------------------------------------- load
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const glyphs = rd('notation/lib/glyphs.json');
const pageRules = rd('notation/registry/page_rules.json');
const C = rd('notation/registry/container.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));
let score = null;
try { score = rd(path.join('scores', ir.source.score + '.json')); } catch (e) { score = null; }

const FRAME_PARTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];   // the jury frame: all lanes, always
const model = Layout.layoutSection(ir, glyphs, Object.assign(
  { m4AttackLines: false, frameParts: FRAME_PARTS },
  (C.engraving && C.engraving.layout) || {}));

// ------------------------------------------------- the app's video geometry
// Mirrors notation.html renderContainerView() exactly. Any drift here is a
// drift between the video and what the composer approved on screen.
const rz = (C.realizations || {})['video-jury'] || {};
const lanes = rz.lanes || { padTopPx: 8, padBotPx: 8, gapPx: 4 };
const W = (C.frame && C.frame.widthPx) || 1920;
const H = (C.frame && C.frame.heightPx) || 1080;
const pageSeconds = (C.timeScale && C.timeScale.defaults && C.timeScale.defaults.trance) || 12;
let topPad = lanes.padTopPx / H, botPad = lanes.padBotPx / H;
const gap = lanes.gapPx / H;
let lanePx = ((1 - topPad - botPad - gap * (FRAME_PARTS.length - 1)) / FRAME_PARTS.length) * H;
if (lanes.sparseCapPx && lanePx > lanes.sparseCapPx) {
  lanePx = lanes.sparseCapPx;
  const content = (lanePx * FRAME_PARTS.length + lanes.gapPx * (FRAME_PARTS.length - 1)) / H;
  topPad = botPad = Math.max(0, (1 - content) / 2);
}
const systems = Coords.systemsForParts(FRAME_PARTS, { topPad, botPad, gap, weights: lanes.weights });
const ssPerSystem = lanePx / (((C.staff && C.staff.staffHeightPx) || 31.6) / 4);
const Z = viewMode === 'zoom' ? (zoomZ || ((C.realizations || {})['zoom-working'] || {}).zoomZ || 2) : 1;
const pages = Splice.planPages(ir, pageRules, pageSeconds);
const srcEnd = ir.source.window[1];

function baseCfgFor(pageIdx) {
  const p = pages[pageIdx];
  return {
    widthPx: W, heightPx: H, window: [p.t0, p.t0 + pageSeconds],
    gutterPx: (C.prefatory && C.prefatory.gutterPx) || 0, systems, ssPerSystem,
  };
}
const pageContaining = t => {
  let best = 0;
  for (let i = 0; i < pages.length; i++) if (pages[i].t0 <= t) best = i; else break;
  return best;
};

// THE TURN SEQUENCE — from notation.html drawOverlayFrame(). A segment is held
// until t reaches min(window[1], srcEnd) and then HARD-CUTS. The two modes turn
// on different things, and getting this wrong is the difference between the film
// the composer approved and a different one:
//
//   video — turn to the NEXT PAGE. Pages do NOT tile at pageSeconds: planPages
//           breaks on musical rules and the window is a fixed span from p.t0, so
//           a break that falls early makes the successor start BEFORE the turn,
//           and that music appears on both pages. MEASURED on db1: 64 pages, and
//           8 of the 63 gaps are short — 10.018, 10.642, 10.718, 10.802, 10.882,
//           11.598, 11.982, 11.988 s — 7.37 s of overlap in total. Dividing t by
//           pageSeconds is right for the first 55 pages and wrong for the rest,
//           cumulatively, which is the worst way for it to be wrong.
//
//   zoom  — pageIdx never advances (`state.zoomT0 = w1`); the window steps by
//           its own span, pageSeconds / Z = 6 s, CONTIGUOUSLY and with no regard
//           for page boundaries. That is D1's "~6 s per system, sweeping at 2x".
//
// One deliberate departure, and the only one: in zoom the app leaves `pageIdx`
// wherever video mode left it, so `reshow`/`ownsEnd` come from a stale page.
// That is a UI artifact of ←/→ doubling as the zoom step, not a design — here
// they come from the page CONTAINING each window's start.
const segments = [];
{
  let tCur = 0;
  if (viewMode === 'zoom') {
    const probe = Coords.zoomCfg(baseCfgFor(0), Z, 0);
    const span = probe.window[1] - probe.window[0];
    for (let s = 0; tCur < srcEnd && s < 100000; s++) {
      const pi = pageContaining(tCur);
      const cfg = Coords.zoomCfg(baseCfgFor(pi), Z, tCur);
      const end = Math.min(cfg.window[1], srcEnd);
      segments.push({ t0: tCur, t1: end, view: Coords.makeView(cfg),
        reshow: pages[pi].reshow, ownsEnd: end >= srcEnd - 1e-9 });
      tCur = tCur + span;
    }
  } else {
    for (let i = 0; i < pages.length; i++) {
      const end = Math.min(pages[i].t0 + pageSeconds, srcEnd);
      if (end <= tCur) continue;
      segments.push({ t0: tCur, t1: end, view: Coords.makeView(baseCfgFor(i)),
        reshow: pages[i].reshow, ownsEnd: i === pages.length - 1 });
      tCur = end;
    }
  }
}
const pieceEnd = segments.length ? segments[segments.length - 1].t1 : srcEnd;
const segAt = t => {
  for (let i = 0; i < segments.length; i++) if (t < segments[i].t1) return i;
  return Math.max(0, segments.length - 1);
};

// ---------------------------------------------------------------- static page
function staticSvg(i) {
  const seg = segments[i], view = seg.view;
  const svg = Render.renderSection(model, view, glyphs, {
    reshow: seg.reshow, ownsEnd: seg.ownsEnd,
    engraving: (C.engraving && C.engraving.render) || {},
    hideBricks: true,          // D4: bricks off
  });
  // the system TERMINAL barline, exactly as notation.html appends it
  const eb = ((C.engraving && C.engraving.render) || {}).systemEndBar;
  let endBar = '';
  if (eb && view.systems.length) {
    const ys = view.systems[0].yTopPx, ye = view.systems[view.systems.length - 1].yBotPx;
    const xEnd = (srcEnd > view.window[0] && srcEnd < view.window[1]) ? view.xOfSeconds(srcEnd) : view.widthPx;
    endBar = '<rect x="' + (xEnd - eb.wPx).toFixed(2) + '" y="' + ys.toFixed(1) +
      '" width="' + eb.wPx + '" height="' + (ye - ys).toFixed(1) + '" fill="#111" opacity="' + (eb.opacity || 0.55) + '"/>';
  }
  // NO metaOverlaySvg: D4 says META off, and the app returns '' for it then.
  return svg.replace('</svg>', endBar + '</svg>');
}

// ---------------------------------------------------------------- rasterizer
const FONTS = ['CrimsonPro-Light.ttf', 'CrimsonPro-LightItalic.ttf']
  .map(f => path.join(ROOT, 'notation', 'app', 'fonts', f));
const fontOpt = { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'Crimson Pro Light' };
function raster(svg, background) {
  const opts = { fitTo: { mode: 'original' }, font: fontOpt };
  if (background) opts.background = background;
  const img = new Resvg(svg, opts).render();
  return { px: img.pixels, w: img.width, h: img.height };
}

// ---------------------------------------------------------------- anim layer
const animInstances = AnimObj.collect(ir, score, C.animated, {
  parts: ir.source.parts, meta: false,     // D4: META off
  deviceOf: Layout.deviceResolver(ir, (C.engraving || {}).layout || {}),
});
function overlaySvg(view, t) {
  const inner = AnimObj.frameSvg(animInstances, view, t, C.animated);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + view.widthPx + '" height="' + view.heightPx +
    '" viewBox="0 0 ' + view.widthPx + ' ' + view.heightPx + '">' + inner + '</svg>';
}

// source-over, straight alpha, onto a copy of the cached page
function composite(base, over) {
  const out = Buffer.from(base);
  for (let i = 0; i < out.length; i += 4) {
    const a = over[i + 3];
    if (a === 0) continue;
    if (a === 255) { out[i] = over[i]; out[i + 1] = over[i + 1]; out[i + 2] = over[i + 2]; continue; }
    const na = a / 255, ia = 1 - na;
    out[i] = over[i] * na + out[i] * ia;
    out[i + 1] = over[i + 1] * na + out[i + 1] * ia;
    out[i + 2] = over[i + 2] * na + out[i + 2] * ia;
  }
  return out;
}

// ---------------------------------------------------------------- page cache
let cachedIdx = -1, cachedPx = null, pageRasters = 0;
function pageFor(i) {
  if (i !== cachedIdx) {
    cachedPx = raster(staticSvg(i), 'white').px;
    cachedIdx = i; pageRasters++;
  }
  return { px: cachedPx, view: segments[i].view };
}
function frameRGBA(t) {
  const { px, view } = pageFor(segAt(t));
  const ov = raster(overlaySvg(view, t), null);
  return composite(px, ov.px);
}

// ---------------------------------------------------------------- dump mode
// 2.4's evidence: write ONE page's static SVG so it can be rasterized and
// diffed against the same page pulled out of the running app. A pixel match
// is the proof that this Node path and the app draw the same picture.
if (dumpPage != null) {
  const i = parseInt(dumpPage, 10);
  const out = arg('dumpTo', path.join(probeDir, irId + '-page' + i + '.svg'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, staticSvg(i));
  const seg = segments[i];
  console.log('segment ' + i + '  window ' + seg.view.window[0].toFixed(2) + '–' + seg.view.window[1].toFixed(2) +
    ' s  held ' + seg.t0.toFixed(2) + '–' + seg.t1.toFixed(2) + ' s  reshow ' + (seg.reshow ? seg.reshow.length : 0) +
    '  ownsEnd ' + seg.ownsEnd + '  -> ' + out);
  process.exit(0);
}

// ---------------------------------------------------------------- probe mode
if (probes.length) {
  fs.mkdirSync(probeDir, { recursive: true });
  let PNG = null;
  try { PNG = require('pngjs').PNG; } catch (e) { PNG = null; }
  for (const t of probes) {
    const rgba = frameRGBA(t);
    const name = irId + '_' + viewMode + '_t' + t.toFixed(3).replace('.', '-');
    if (PNG) {
      const p = new PNG({ width: W, height: viewMode === 'zoom' ? H * Z : H });
      rgba.copy(p.data);
      fs.writeFileSync(path.join(probeDir, name + '.png'), PNG.sync.write(p));
    } else {
      fs.writeFileSync(path.join(probeDir, name + '.rgba'), rgba);
    }
    console.log('probe t=' + t.toFixed(3) + '  page ' + segAt(t) + '  -> ' + name + (PNG ? '.png' : '.rgba'));
  }
  console.log(pageRasters + ' page raster(s)');
  process.exit(0);
}

// ---------------------------------------------------------------- ffmpeg
const t0 = tStart != null ? tStart : 0;
const t1 = tEnd != null ? tEnd : pieceEnd;
const nFrames = Math.round((t1 - t0) * fps);
const outH = viewMode === 'zoom' ? H * Z : H;
const ff = ['-y',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + outH, '-r', String(fps), '-i', 'pipe:0'];
if (audio) ff.push('-ss', String(t0), '-i', audio, '-c:a', 'aac', '-b:a', '256k', '-shortest');
ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', outFile);

console.log('export_video: ' + irId + ' · ' + viewMode + (viewMode === 'zoom' ? ' x' + Z : '') +
  ' · ' + W + 'x' + outH + ' · ' + fps + ' fps');
console.log('  ' + pages.length + ' pages, ' + segments.length + ' turn segments, material ends ' + srcEnd + ' s');
console.log('  frames ' + nFrames + '  (' + t0.toFixed(2) + '–' + t1.toFixed(2) + ' s)');

const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
proc.on('error', e => { console.error('ffmpeg failed to start: ' + e.message); process.exit(1); });
proc.stdin.on('error', () => { });   // ffmpeg may close early on --shortest

let k = 0;
const started = Date.now();
function pump() {
  while (k < nFrames) {
    const t = t0 + k / fps;
    const buf = frameRGBA(t);
    k++;
    if (k % (fps * 30) === 0 || k === nFrames) {
      const el = (Date.now() - started) / 1000;
      console.log('  ' + k + '/' + nFrames + '  t=' + t.toFixed(1) + 's  ' +
        (k / el).toFixed(1) + ' fps  eta ' + (((nFrames - k) / (k / el)) / 60).toFixed(1) + ' min  ' +
        pageRasters + ' page rasters');
    }
    if (!proc.stdin.write(buf)) { proc.stdin.once('drain', pump); return; }
  }
  proc.stdin.end();
}
pump();
proc.on('close', code => {
  const el = (Date.now() - started) / 1000;
  console.log('done in ' + (el / 60).toFixed(1) + ' min · ' + (nFrames / el).toFixed(1) + ' fps · ' +
    pageRasters + ' page rasters for ' + nFrames + ' frames · ffmpeg exit ' + code);
});
