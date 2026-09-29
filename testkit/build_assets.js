#!/usr/bin/env node
// build_assets.js — the test kit's content, drawn by the REAL engine
// (docs/ENGINE_BRIEF.md §5b). Read-only use of notation/lib and
// tools/export_video.js; it writes nothing outside testkit/assets/.
//
//   node testkit/build_assets.js                 pick the busiest 60 s, build everything
//   node testkit/build_assets.js --t0 690        force the window start (seconds)
//   node testkit/build_assets.js --seconds 30    a shorter window
//   node testkit/build_assets.js --no-video      skip the two mp4s (fast rebuild)
//   node testkit/build_assets.js --scan-only     print the busiest-window scan, write nothing
//
// SAME MUSIC IN EVERY LANE, or the renderer comparison is invalid. So every
// asset is cut from ONE window [t0, t0+seconds] of the piece:
//   pages/seg_<n>.svg     the static pages the window crosses — StaticPage, the
//                         exact code the video and print exporters draw with
//   trace.json            every moving element's state at every 1/60 s, with a
//                         stable identity per element — lanes A1 / A2 / B
//   engine/*.js +         the production animation modules and their inputs —
//   engine_inputs.json    lane A0 runs the current engine VERBATIM
//   clip.mp4              the same window through tools/export_video.js (60 fps,
//                         the exporter's own encode, remuxed for streaming) — lane C
//   clip_g60.mp4          the same frames re-encoded with a keyframe every 1 s —
//                         T4 seeks both, because GOP length decides seek speed
//   fonts/                the page's two Crimson Pro faces
//   manifest.json         what was built, from what, and how big
//
// WHY THE BUSIEST WINDOW: the renderer question is decided at the worst case,
// not the average one. The scan counts the moving elements the engine draws at
// every half second of the piece and takes the 60 s with the highest mean.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const KIT = __dirname;
const ROOT = path.join(KIT, '..');
const OUT = path.join(KIT, 'assets');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Splice = require(path.join(ROOT, 'notation', 'lib', 'splice.js'));
const AnimObj = require(path.join(ROOT, 'notation', 'lib', 'animobj.js'));
const StaticPage = require(path.join(ROOT, 'notation', 'lib', 'static_page.js'));

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const flag = name => process.argv.includes('--' + name);
const irId = arg('ir', 'db1');
const SECONDS = parseFloat(arg('seconds', '60'));
const FPS = parseFloat(arg('fps', '60'));
const T0_ARG = arg('t0', null);
const NO_VIDEO = flag('no-video');
const SCAN_ONLY = flag('scan-only');

// ------------------------------------------------------------------ load
// Everything from here to `segments` mirrors tools/export_video.js (the video
// geometry is notation.html's renderContainerView). Drift here would make the
// kit test a picture the composer never approved.
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const glyphs = rd('notation/lib/glyphs.json');
const pageRules = rd('notation/registry/page_rules.json');
const C = rd('notation/registry/container.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));
let score = null;
try { score = rd(path.join('scores', ir.source.score + '.json')); } catch (e) { score = null; }

const FRAME_PARTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const model = Layout.layoutSection(ir, glyphs, Object.assign(
  { m4AttackLines: false, frameParts: FRAME_PARTS },
  (C.engraving && C.engraving.layout) || {}));

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
const pages = Splice.planPages(ir, pageRules, pageSeconds);
const srcEnd = ir.source.window[1];
function baseCfgFor(i) {
  const p = pages[i];
  return {
    widthPx: W, heightPx: H, window: [p.t0, p.t0 + pageSeconds],
    gutterPx: (C.prefatory && C.prefatory.gutterPx) || 0, systems, ssPerSystem,
  };
}
// export_video.js buildSegments('video'), keeping each segment's plain-data cfg
// so the browser can rebuild the identical view for lane A0.
const segments = [];
{
  let tCur = 0;
  for (let i = 0; i < pages.length; i++) {
    const end = Math.min(pages[i].t0 + pageSeconds, srcEnd);
    if (end <= tCur) continue;
    const cfg = baseCfgFor(i);
    segments.push({ page: i, t0: tCur, t1: end, cfg, view: Coords.makeView(cfg),
      reshow: pages[i].reshow, ownsEnd: i === pages.length - 1 });
    tCur = end;
  }
}
const segAt = t => {
  for (let i = 0; i < segments.length; i++) if (t < segments[i].t1) return i;
  return segments.length - 1;
};

// the animated instances — export_video.js's exact collect() call
const _dev = Layout.deviceResolver(ir, (C.engraving || {}).layout || {});
const instances = AnimObj.collect(ir, score, C.animated, {
  parts: FRAME_PARTS, meta: false, deviceOf: _dev,
  drawnOf: e => Layout.drawnLevelSamples(e, _dev(e) || {}),
}).filter(i => i.part === undefined || FRAME_PARTS.includes(i.part));
const REG = AnimObj._registry;
const style = C.animated;

// ------------------------------------------------------------------ one frame, per element
// frameSvg() joins every element into one string; the retained lanes need each
// element SEPARATELY with a stable identity. This walks the registry exactly as
// frameSvg does (same order, same skip rules) and keeps the pieces apart.
// attribute names can hold digits (x1, y2): a letters-only name pattern silently
// dropped every <line> — the cursor — from the first trace (caught by the
// lane screenshots, day 42)
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9:_-]*="[^"]*")*)\s*(\/?)>/g;
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9:_-]*)="([^"]*)"/g;
function parseLeaves(str) {
  const leaves = [], stack = [];
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(str))) {
    const close = m[1], tag = m[2], attrStr = m[3], selfClose = m[4];
    if (close) { stack.pop(); continue; }
    const attrs = {};
    ATTR_RE.lastIndex = 0;
    let a;
    while ((a = ATTR_RE.exec(attrStr))) attrs[a[1]] = a[2];
    if (tag === 'g' && !selfClose) { stack.push(attrs); continue; }
    // a <g> carries the fill/opacity of the pie inside it; fold them onto the
    // leaf (a one-child group composites identically)
    const merged = Object.assign({}, ...stack, attrs);
    leaves.push({ tag, attrs: merged, inG: stack.length > 0 });
  }
  return leaves;
}
// arcPath() draws a full pie as <circle>, a partial one as <path> — one element
// switching tags. The retained lanes keep ONE node per element, so a full pie
// becomes the equivalent closed path.
function normalize(leaf) {
  if (leaf.inG && leaf.tag === 'circle') {
    const cx = +leaf.attrs.cx, cy = +leaf.attrs.cy, r = +leaf.attrs.r;
    const a = Object.assign({}, leaf.attrs);
    delete a.cx; delete a.cy; delete a.r;
    a.d = 'M ' + (cx - r).toFixed(1) + ' ' + cy.toFixed(1) + ' A ' + r.toFixed(1) + ' ' + r.toFixed(1) +
      ' 0 1 0 ' + (cx + r).toFixed(1) + ' ' + cy.toFixed(1) + ' A ' + r.toFixed(1) + ' ' + r.toFixed(1) +
      ' 0 1 0 ' + (cx - r).toFixed(1) + ' ' + cy.toFixed(1) + ' Z';
    return { tag: 'path', attrs: a };
  }
  return { tag: leaf.tag, attrs: leaf.attrs };
}
// -> [{key, kind, tag, attrs}] for every element the engine draws at t
function elementsAt(t) {
  const view = segments[segAt(t)].view;
  const out = [];
  // the cursor, from frameSvg itself (no instances = cursor only)
  parseLeaves(AnimObj.frameSvg([], view, t, style)).forEach((lf, l) => {
    const n = normalize(lf);
    out.push({ key: 'cursor:' + l, kind: 'cursor', tag: n.tag, attrs: n.attrs });
  });
  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i];
    const fn = REG[inst.kind];
    if (!fn) continue;
    const st = style[inst.kind] || {};
    let outs;
    try {
      if (inst.part !== undefined) view.system(inst.part);
      outs = fn(inst, view, t, st);
    } catch (e) { continue; }
    outs.forEach((s, j) => parseLeaves(s).forEach((lf, l) => {
      const n = normalize(lf);
      out.push({ key: i + ':' + j + ':' + l, kind: inst.kind, tag: n.tag, attrs: n.attrs });
    }));
  }
  return out;
}

// ------------------------------------------------------------------ the busiest window
function scan() {
  const step = 0.5;
  const tEnd = srcEnd;
  const counts = [];
  for (let t = 0; t <= tEnd; t += step) counts.push({ t, n: elementsAt(t).length });
  const per = Math.round(SECONDS / step);
  let best = null;
  let sum = 0;
  for (let i = 0; i < counts.length; i++) {
    sum += counts[i].n;
    if (i >= per) sum -= counts[i - per].n;
    if (i >= per - 1) {
      const t0 = counts[i - per + 1].t;
      if (t0 + SECONDS > srcEnd) break;
      const mean = sum / per;
      if (!best || mean > best.mean) best = { t0, mean };
    }
  }
  return { counts, best };
}

const t0Build = Date.now();
console.log('build_assets: ' + irId + ' · ' + instances.length + ' animated instances (production evaluates ALL of them every frame) · ' +
  segments.length + ' page segments · material ends ' + srcEnd.toFixed(2) + ' s');
const sc = scan();
const maxAt = sc.counts.reduce((a, b) => (b.n > a.n ? b : a));
const meanAll = sc.counts.reduce((a, b) => a + b.n, 0) / sc.counts.length;
console.log('  scan: mean ' + meanAll.toFixed(1) + ' moving elements/frame over the piece · peak ' + maxAt.n + ' at ' + maxAt.t.toFixed(1) + ' s');
console.log('  busiest ' + SECONDS + ' s window starts ' + sc.best.t0.toFixed(1) + ' s (mean ' + sc.best.mean.toFixed(1) + ' elements/frame)');
if (SCAN_ONLY) {
  // a coarse profile: mean elements per 30 s
  for (let b = 0; b < srcEnd; b += 30) {
    const seg = sc.counts.filter(c => c.t >= b && c.t < b + 30);
    if (!seg.length) continue;
    const m = seg.reduce((a, c) => a + c.n, 0) / seg.length;
    console.log('    ' + String(b).padStart(4) + '–' + String(b + 30).padEnd(4) + ' s  ' + '#'.repeat(Math.round(m)) + ' ' + m.toFixed(1));
  }
  process.exit(0);
}

const T0 = T0_ARG != null ? parseFloat(T0_ARG) : sc.best.t0;
const T1 = T0 + SECONDS;
if (T1 > srcEnd + 1e-9) { console.error('window ' + T0 + '–' + T1 + ' runs past the material end ' + srcEnd); process.exit(2); }
const NF = Math.round(SECONDS * FPS);
console.log('  window ' + T0.toFixed(2) + '–' + T1.toFixed(2) + ' s · ' + NF + ' frames at ' + FPS + ' fps');

fs.mkdirSync(OUT, { recursive: true });
for (const d of ['pages', 'engine', 'fonts']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
for (const f of fs.readdirSync(path.join(OUT, 'pages'))) fs.unlinkSync(path.join(OUT, 'pages', f));

// ------------------------------------------------------------------ pages
const segIdxs = [];
for (let s = segAt(T0); s < segments.length; s++) {
  if (segments[s].t0 >= T1) break;
  segIdxs.push(s);
}
const segMeta = segIdxs.map(s => {
  const sg = segments[s];
  const svg = StaticPage.staticPageSvg({ model, view: sg.view, glyphs, C, srcEnd, reshow: sg.reshow, ownsEnd: sg.ownsEnd });
  const file = 'pages/seg_' + s + '.svg';
  fs.writeFileSync(path.join(OUT, file), svg);
  return { seg: s, page: sg.page, t0: sg.t0, t1: sg.t1, window: sg.cfg.window, svg: file, bytes: Buffer.byteLength(svg) };
});
console.log('  pages: ' + segMeta.length + ' (' + segMeta.map(p => 'seg ' + p.seg + ' ' + (p.bytes / 1024).toFixed(0) + ' KB').join(', ') + ')');

// ------------------------------------------------------------------ trace
const trackIdx = new Map();   // key -> track id
const tracks = [];            // {key, kind, tag, attrs: Map name -> Set of values}
const rawFrames = [];         // per frame: [{tid, attrs}]
const pageAt = [];
let lastSeg = -1, activeSum = 0, activeMax = 0;
for (let k = 0; k < NF; k++) {
  const t = T0 + k / FPS;
  const s = segAt(t);
  if (s !== lastSeg) { pageAt.push([k, s]); lastSeg = s; }
  const els = elementsAt(t);
  activeSum += els.length; activeMax = Math.max(activeMax, els.length);
  const fr = [];
  for (const e of els) {
    let tid = trackIdx.get(e.key);
    if (tid === undefined) {
      tid = tracks.length;
      trackIdx.set(e.key, tid);
      tracks.push({ key: e.key, kind: e.kind, tag: e.tag, vals: {} });
    }
    const tr = tracks[tid];
    if (tr.tag !== e.tag) throw new Error('track ' + e.key + ' changed tag ' + tr.tag + ' -> ' + e.tag);
    for (const [n, v] of Object.entries(e.attrs)) {
      if (!tr.vals[n]) tr.vals[n] = new Set();
      tr.vals[n].add(v);
    }
    fr.push({ tid, attrs: e.attrs });
  }
  rawFrames.push(fr);
}
// split each track's attributes into static (one value all its life) and dynamic
const isNum = v => v !== '' && !isNaN(+v);
const trackOut = tracks.map(tr => {
  const stat = {}, dyn = [];
  for (const [n, set] of Object.entries(tr.vals)) {
    if (set.size === 1) stat[n] = [...set][0];
    else dyn.push(n);
  }
  dyn.sort();
  const numeric = {};
  for (const n of dyn) numeric[n] = [...tr.vals[n]].every(isNum);
  return { key: tr.key, kind: tr.kind, tag: tr.tag, static: stat, dyn, num: dyn.map(n => numeric[n]) };
});
const f = rawFrames.map(fr => {
  const flat = [];
  for (const { tid, attrs } of fr) {
    const tr = trackOut[tid];
    flat.push(tid);
    tr.dyn.forEach((n, i) => {
      const v = attrs[n];
      // a dynamic attribute can be absent on some frames (never, in practice) —
      // fall back to the static value so the decoder never sees a hole
      flat.push(v === undefined ? null : (tr.num[i] ? +v : v));
    });
  }
  return flat;
});
const trace = {
  version: 1, ir: irId, fps: FPS, t0: T0, t1: T1, frames: NF, width: W, height: H,
  segments: segMeta, pageAt, tracks: trackOut.map(t => ({ key: t.key, kind: t.kind, tag: t.tag, static: t.static, dyn: t.dyn })),
  f,
};
const traceJson = JSON.stringify(trace);
fs.writeFileSync(path.join(OUT, 'trace.json'), traceJson);
console.log('  trace: ' + tracks.length + ' tracks · mean ' + (activeSum / NF).toFixed(1) + ' / max ' + activeMax +
  ' elements per frame · ' + (traceJson.length / 1048576).toFixed(2) + ' MB');

// ------------------------------------------------------------------ lane A0 inputs (the engine, verbatim)
for (const f2 of ['coords.js', 'gc.js', 'animobj.js']) {
  fs.copyFileSync(path.join(ROOT, 'notation', 'lib', f2), path.join(OUT, 'engine', f2));
}
const engineInputs = {
  note: 'lane A0 = the notation app\'s per-frame path verbatim: frameSvg() over ALL of the piece\'s instances, innerHTML into the overlay <svg>, the t-readout updated',
  instances, style,
  segments: segIdxs.map(s => ({ seg: s, t0: segments[s].t0, t1: segments[s].t1, cfg: segments[s].cfg })),
};
const eiJson = JSON.stringify(engineInputs);
fs.writeFileSync(path.join(OUT, 'engine_inputs.json'), eiJson);
console.log('  engine inputs: ' + instances.length + ' instances · ' + (eiJson.length / 1048576).toFixed(2) + ' MB');

// ------------------------------------------------------------------ fonts
for (const ff of fs.readdirSync(path.join(ROOT, 'notation', 'app', 'fonts'))) {
  if (/\.ttf$/i.test(ff)) fs.copyFileSync(path.join(ROOT, 'notation', 'app', 'fonts', ff), path.join(OUT, 'fonts', ff));
}

// ------------------------------------------------------------------ video
const files = {};
let video = null;
if (!NO_VIDEO) {
  const tmp = path.join(OUT, '_clip_src.mp4');
  const clip = path.join(OUT, 'clip.mp4');
  const g60 = path.join(OUT, 'clip_g60.mp4');
  const tv = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'export_video.js'), '--ir', irId, '--view', 'video',
    '--fps', String(FPS), '--t0', String(T0), '--t1', String(T1), '--out', tmp], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) { console.error('export_video failed'); process.exit(1); }
  // the exporter writes the moov atom at the END; a browser streaming the file
  // then has to fetch the tail before the first frame. Remux, not re-encode.
  let q = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-c', 'copy', '-movflags', '+faststart', clip], { stdio: 'inherit' });
  if (q.status !== 0) { console.error('ffmpeg remux failed'); process.exit(1); }
  // keyframe every 60 frames (1 s): a seek decodes at most one second of frames
  q = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-g', String(Math.round(FPS)), '-keyint_min', String(Math.round(FPS)), '-sc_threshold', '0',
    '-movflags', '+faststart', g60], { stdio: 'inherit' });
  if (q.status !== 0) { console.error('ffmpeg g60 encode failed'); process.exit(1); }
  fs.unlinkSync(tmp);
  const b1 = fs.statSync(clip).size, b2 = fs.statSync(g60).size;
  const pieceSeconds = 750;
  video = {
    clip: { file: 'clip.mp4', bytes: b1, kbps: Math.round(b1 * 8 / SECONDS / 1000), gop: 'exporter default (libx264 keyint 250)' },
    clip_g60: { file: 'clip_g60.mp4', bytes: b2, kbps: Math.round(b2 * 8 / SECONDS / 1000), gop: 'keyframe every 1 s' },
    projectedFullPieceMB: { clip: +(b1 / SECONDS * pieceSeconds / 1048576).toFixed(0), clip_g60: +(b2 / SECONDS * pieceSeconds / 1048576).toFixed(0),
      note: 'this window is the BUSIEST 60 s at full-score 1920x1080, 60 fps; ' + pieceSeconds + ' s of piece' },
    renderSeconds: Math.round((Date.now() - tv) / 1000),
  };
  console.log('  video: clip.mp4 ' + (b1 / 1048576).toFixed(1) + ' MB (' + video.clip.kbps + ' kbps) · clip_g60.mp4 ' +
    (b2 / 1048576).toFixed(1) + ' MB (' + video.clip_g60.kbps + ' kbps) · projected full piece ≈ ' +
    video.projectedFullPieceMB.clip + ' / ' + video.projectedFullPieceMB.clip_g60 + ' MB · rendered in ' + video.renderSeconds + ' s');
}

// ------------------------------------------------------------------ manifest
for (const sub of ['', 'pages', 'engine', 'fonts']) {
  const dir = path.join(OUT, sub);
  for (const ff of fs.readdirSync(dir)) {
    const p = path.join(dir, ff);
    if (fs.statSync(p).isFile() && ff !== 'manifest.json') files[(sub ? sub + '/' : '') + ff] = fs.statSync(p).size;
  }
}
let gitHead = null;
try { gitHead = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).stdout.toString().trim(); } catch (e) { gitHead = null; }
const manifest = {
  built: new Date().toISOString(), gitHead, ir: irId, irSourceScore: ir.source.score,
  window: [T0, T1], seconds: SECONDS, fps: FPS, frames: NF,
  selection: T0_ARG != null ? 'forced --t0' : 'busiest ' + SECONDS + ' s by mean moving elements per frame',
  scan: { meanElementsPiece: +meanAll.toFixed(2), peak: { t: maxAt.t, n: maxAt.n }, windowMean: +(activeSum / NF).toFixed(2), windowMax: activeMax },
  instancesAll: instances.length, tracks: tracks.length, segments: segMeta, video, files,
  buildSeconds: Math.round((Date.now() - t0Build) / 1000),
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('done in ' + manifest.buildSeconds + ' s -> testkit/assets/ (' + Object.keys(files).length + ' files)');
