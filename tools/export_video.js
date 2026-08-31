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
//        [--cut notation/video/cut-list.json] [--fade 8] [--fadeMode dip|cross]
//        (--fade 0 = hard cuts)
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
const StaticPage = require(path.join(ROOT, 'notation', 'lib', 'static_page.js'));
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
const fadeFrames = Math.max(0, Math.round(parseFloat(arg('fade', '8')) || 0));   // W2: 0 = hard cuts
const fadeMode = arg('fadeMode', 'dip');                                        // dip | cross
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
// Z is the ZOOM FACTOR, not a mode flag. It was gated on viewMode==='zoom',
// which made a CUT render its V-TOP/V-BOT halves from an UNZOOMED 1080-tall
// frame — 63 zoom segments instead of 129, and the close-ups would have been
// the top half of the wide shot. Caught by a dry run before any pixels.
const Z = zoomZ || ((C.realizations || {})['zoom-working'] || {}).zoomZ || 2;
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
function buildSegments(mode) {
  const out = [];
  let tCur = 0;
  if (mode === 'zoom') {
    const probe = Coords.zoomCfg(baseCfgFor(0), Z, 0);
    const span = probe.window[1] - probe.window[0];
    for (let s = 0; tCur < srcEnd && s < 100000; s++) {
      const pi = pageContaining(tCur);
      const cfg = Coords.zoomCfg(baseCfgFor(pi), Z, tCur);
      const end = Math.min(cfg.window[1], srcEnd);
      out.push({ t0: tCur, t1: end, view: Coords.makeView(cfg),
        reshow: pages[pi].reshow, ownsEnd: end >= srcEnd - 1e-9 });
      tCur = tCur + span;
    }
  } else {
    for (let i = 0; i < pages.length; i++) {
      const end = Math.min(pages[i].t0 + pageSeconds, srcEnd);
      if (end <= tCur) continue;
      out.push({ t0: tCur, t1: end, view: Coords.makeView(baseCfgFor(i)),
        reshow: pages[i].reshow, ownsEnd: i === pages.length - 1 });
      tCur = end;
    }
  }
  return out;
}
const SEGS = { video: buildSegments('video'), zoom: null };
const segsOf = m => (m === 'zoom' ? (SEGS.zoom || (SEGS.zoom = buildSegments('zoom'))) : SEGS.video);
const segments = segsOf(viewMode);
const pieceEnd = segments.length ? segments[segments.length - 1].t1 : srcEnd;
const segAtIn = (list, t) => {
  for (let i = 0; i < list.length; i++) if (t < list[i].t1) return i;
  return Math.max(0, list.length - 1);
};
const segAt = t => segAtIn(segments, t);

// ---------------------------------------------------------------- static page
// The page itself lives in notation/lib/static_page.js so the PRINT exporter
// draws the identical page (day 37). Proven: all 64 db1 static SVGs are
// byte-identical across this change.
function staticSvg(i, list) {
  const seg = (list || segments)[i];
  return StaticPage.staticPageSvg({
    model, view: seg.view, glyphs, C, srcEnd,
    reshow: seg.reshow, ownsEnd: seg.ownsEnd,
  });
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
const _dev = Layout.deviceResolver(ir, (C.engraving || {}).layout || {});
const animInstances = AnimObj.collect(ir, score, C.animated, {
  parts: ir.source.parts, meta: false,     // D4: META off
  deviceOf: _dev,
  // day 40: the meters ride the DRAWN curve (layout.drawnLevelSamples is the
  // one source) — the video stays pixel-congruent with the app by sharing it
  drawnOf: e => Layout.drawnLevelSamples(e, _dev(e) || {}),
});
function overlaySvg(view, t) {
  const inner = AnimObj.frameSvg(animInstances, view, t, C.animated);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + view.widthPx + '" height="' + view.heightPx +
    '" viewBox="0 0 ' + view.widthPx + ' ' + view.heightPx + '">' + inner + '</svg>';
}

// source-over onto a copy of the cached page.
//
// THE OVERLAY IS PREMULTIPLIED, and this loop used to say "straight alpha".
// MEASURED day 36 (post-clear): resvg returns premultiplied RGBA — a bare
// <rect fill="#F04B00" opacity="0.3"/> comes back as RGB (72,23,0) A 76, the
// colour already multiplied by its alpha. Doing `over*na + base*ia` on that
// applies the alpha a SECOND time:  C·a·a + base·(1-a)  instead of
// C·a + base·(1-a). Every TRANSLUCENT animated element therefore contributed
// only `a` of its own colour and composited as a grey smudge — the morph
// meters measured (198,157,139) where the app draws (248,173,139). That was
// the composer's "strange shadow" in WISHLIST W1. Opaque elements took the
// a===255 fast path and were always exact, which is why the magenta cursor
// looked right and nothing else gave it away.
//
// Premultiplied source-over is `over + base*(1-a)` — no na term. Safe in a
// Buffer: premultiplied RGB <= alpha, so over[i] + base[i]*(1-a) <= 255 and
// nothing can wrap. The base is the page raster built with background:'white',
// so its alpha is 255 everywhere (premultiplied == straight for it), and out's
// alpha bytes are never written, so the buffer stays opaque RGBA for ffmpeg.
//
// NOTE the static page never went through here (it is one resvg pass with an
// opaque background), which is why PHASE 5's --dumpPage pixel proof passed:
// that proof covers the STATIC page only, not the animated layer.
function composite(base, over) {
  const out = Buffer.from(base);
  for (let i = 0; i < out.length; i += 4) {
    const a = over[i + 3];
    if (a === 0) continue;
    if (a === 255) { out[i] = over[i]; out[i + 1] = over[i + 1]; out[i + 2] = over[i + 2]; continue; }
    const ia = 1 - a / 255;
    out[i] = over[i] + out[i] * ia;
    out[i + 1] = over[i + 1] + out[i + 1] * ia;
    out[i + 2] = over[i + 2] + out[i + 2] * ia;
  }
  return out;
}

// ---------------------------------------------------------------- page cache
// One cache PER MODE: a cut alternates between the video page and the zoom
// segment, and a single slot would re-rasterize on every switch. Two slots cost
// 8.3 MB + 16.6 MB and make the 19 switches of a cut free.
let pageRasters = 0;
const CACHE = { video: { idx: -1, px: null }, zoom: { idx: -1, px: null } };
function pageFor(i, mode) {
  const c = CACHE[mode], list = segsOf(mode);
  if (i !== c.idx) { c.px = raster(staticSvg(i, list), 'white').px; c.idx = i; pageRasters++; }
  return { px: c.px, view: list[i].view };
}
function frameRGBA(t, mode) {
  const m = mode || viewMode;
  const list = segsOf(m);
  const { px, view } = pageFor(segAtIn(list, t), m);
  const ov = raster(overlaySvg(view, t), null);
  return composite(px, ov.px);
}
// take rows [y0, y0+h) out of a W-wide RGBA buffer — the zoom master's halves
function cropRows(px, y0, h) {
  const rowBytes = W * 4;
  return px.subarray(y0 * rowBytes, (y0 + h) * rowBytes);
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

// ---------------------------------------------------------------- the cut
// PHASE 4. The plan said "assemble by frame index from the FINISHED renders",
// which was a cost assumption from when a render was thought to take hours.
// It takes six minutes, so the cut is RENDERED, not spliced: every frame is
// first-generation. Splicing would have made the close-ups THIRD generation
// (V-TOP/V-BOT are already a re-encode of the zoom master), and a 19-branch
// trim/concat filtergraph buffers gigabytes waiting for its turn.
// Nothing about the CONTENT changes — same cut list, same frame indices, same
// master WAV laid under it untouched, so V-CUT still cannot drift.
let cutMap = null;   // frame index -> 'V-MAIN' | 'V-TOP' | 'V-BOT'
const cutPath = arg('cut');
if (cutPath) {
  const cl = JSON.parse(fs.readFileSync(path.isAbsolute(cutPath) ? cutPath : path.join(ROOT, cutPath), 'utf8'));
  if (cl.fps !== fps) console.log('  !! cut list is ' + cl.fps + ' fps and this render is ' + fps);
  cutMap = cl.timeline.slice();
  for (let i = 1; i < cutMap.length; i++) {
    if (cutMap[i].f0 !== cutMap[i - 1].f1) throw new Error('cut list is not contiguous at entry ' + i);
  }
}

const t0 = tStart != null ? tStart : 0;
const t1 = tEnd != null ? tEnd : pieceEnd;
const nFrames = Math.round((t1 - t0) * fps);
const outH = cutMap ? H : (viewMode === 'zoom' ? H * Z : H);

if (cutMap) {
  // The cut list was built against the material end (751.92 s); this render
  // runs to the page sweep's end. Rather than leave the tail unassigned, the
  // FINAL entry is extended — it is a wide V-MAIN shot, and D5's shape is
  // "closes wide so the final crescendo stays on the full ensemble".
  // Compare against the ABSOLUTE end frame, not nFrames: for a partial render
  // (--t0 88 --t1 95) nFrames is 210 and extending the last segment to 210 would
  // destroy the map. Both branches are about the FULL timeline.
  const endFrame = Math.round(t1 * fps);
  const last = cutMap[cutMap.length - 1];
  if (last.f1 < endFrame) {
    console.log('  cut list ends at frame ' + last.f1 + ', render ends at ' + endFrame + ' — extending the final ' +
      last.src + ' segment by ' + (endFrame - last.f1) + ' frames (' + ((endFrame - last.f1) / fps).toFixed(2) + ' s)');
    last.f1 = endFrame;
  } else if (last.f1 > endFrame) {
    console.log('  cut list runs past the render end (' + last.f1 + ' > ' + endFrame + ') — the tail is simply not reached');
  }
}
let cutIdx = 0;
function srcAtFrame(k) {
  while (cutIdx < cutMap.length - 1 && k >= cutMap[cutIdx].f1) cutIdx++;
  while (cutIdx > 0 && k < cutMap[cutIdx].f0) cutIdx--;
  return cutMap[cutIdx].src;
}

// ---------------------------------------------------------------- the fade
// W2 (composer, day 36): "some very quick and subtle transitions when they cut
// to the zoomed part. Maybe a short fade." PHASE 4.3 built hard cuts and said
// "crossfades only if asked" — this IS the ask, so it adds a decision rather
// than overturning one.
//
// THE TRAP, named in the plan: a dissolve must NOT change the frame count, or
// PHASE 5's duration equality breaks. So it blends ACROSS the existing
// boundary — the window is CENTRED on the cut frame, [f - n/2, f + n/2) — and
// no frame is ever inserted or dropped. Both ends of every close-up get one:
// an asymmetric fade reads as a mistake.
//
// Frame 0 is the start of the film, not a cut, and the extended final segment
// is not one either, so only the interior boundaries dissolve.
const blends = [];
if (cutMap && fadeFrames > 0) {
  const half = fadeFrames / 2;
  for (let i = 1; i < cutMap.length; i++) {
    const f = cutMap[i].f0;
    // never spill past a neighbouring cut, and never before the first frame
    const a = Math.max(Math.round(f - half), cutMap[i - 1].f0, 0);
    const b = Math.min(Math.round(f + half), cutMap[i].f1);
    if (b - a >= 2) blends.push({ a: a, b: b, f: f, from: cutMap[i - 1].src, to: cutMap[i].src });
  }
}
let blendIdx = 0;
function blendAt(k) {
  while (blendIdx < blends.length && k >= blends[blendIdx].b) blendIdx++;
  while (blendIdx > 0 && k < blends[blendIdx - 1].b) blendIdx--;
  const w = blends[blendIdx];
  return (w && k >= w.a && k < w.b) ? w : null;
}
function srcBuf(src, t) {
  if (src === 'V-MAIN') return frameRGBA(t, 'video');
  const full = frameRGBA(t, 'zoom');
  return cropRows(full, src === 'V-BOT' ? H : 0, H);   // the y=1080 gap, measured
}
// linear cross-dissolve; w is the weight of B. Both buffers are opaque RGBA, so
// the alpha bytes lerp 255->255 and stay 255. +0.5 rounds instead of truncating,
// which would bias every dissolve fractionally dark.
function mix(A, B, w) {
  const out = Buffer.allocUnsafe(A.length), v = 1 - w;
  for (let i = 0; i < out.length; i++) out[i] = A[i] * v + B[i] * w + 0.5;
  return out;
}
// DIP, and why it is the default. A cross-dissolve superimposes the two sources,
// and here they are THE SAME NOTATION AT TWO SCALES — so the mid-dissolve frame
// carries two complete sets of staff lines and, worst of all, TWO CURSORS, since
// the wide and zoomed playheads sit at different x. Measured on the first
// boundary (f=2740) before any full render: it reads as a double exposure, not a
// transition. Dipping through paper instead shows only ONE source at a time, so
// nothing ever doubles — the ink falls away and the new scale rises out of it.
// It is also cheaper: one source per frame instead of two.
//
// The dip never reaches blank paper. Over an 8-frame window the deepest frame
// sits at 0.875, so the notation thins to about an eighth of its ink and comes
// back; there is no white flash.
function toward(buf, wht) {
  const out = Buffer.allocUnsafe(buf.length), v = 1 - wht, add = 255 * wht;
  for (let i = 0; i < out.length; i++) out[i] = buf[i] * v + add + 0.5;
  return out;
}
function cutFrame(k, t) {
  // ABSOLUTE frame index — the cut list is indexed from t=0, while k counts from
  // --t0. They are the same only for a full render; a partial one would take its
  // sources from the wrong segments entirely. The blend windows are in the same
  // absolute frames, so a partial render of one boundary transitions identically.
  const kAbs = Math.round(t * fps);
  const w = blendAt(kAbs);
  if (!w) return srcBuf(srcAtFrame(kAbs), t);
  if (fadeMode === 'dip') {
    const half = Math.max(w.f - w.a, w.b - w.f);
    const d = 1 - Math.abs(kAbs + 0.5 - w.f) / half;
    // strictly one source per frame: the outgoing shot up to the cut, the
    // incoming shot from the cut on. Nothing is ever superimposed.
    return toward(srcBuf(kAbs + 0.5 < w.f ? w.from : w.to, t), Math.max(0, d));
  }
  // alpha hits exactly 0.5 at the cut frame, so the boundary is the midpoint
  return mix(srcBuf(w.from, t), srcBuf(w.to, t), (kAbs - w.a + 0.5) / (w.b - w.a));
}
const ff = ['-y',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', W + 'x' + outH, '-r', String(fps), '-i', 'pipe:0'];
if (audio) ff.push('-ss', String(t0), '-i', audio, '-c:a', 'aac', '-b:a', '256k', '-shortest');
ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', outFile);

console.log('export_video: ' + irId + ' · ' + (cutMap ? 'CUT (' + cutMap.length + ' segments, ' + segsOf('zoom').length + ' zoom segs, ' + (fadeFrames > 0 ? blends.length + ' x ' + fadeFrames + '-frame ' + fadeMode : 'hard cuts') + ')' : viewMode + (viewMode === 'zoom' ? ' x' + Z : '')) +
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
    const buf = cutMap ? cutFrame(k, t) : frameRGBA(t);
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
