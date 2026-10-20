#!/usr/bin/env node
// test_animlive.js — 9a gate battery: the A2 renderer (notation/lib/animlive.js)
// draws exactly what the exporter's string path (animobj.frameSvg) draws.
//
//   node tools/test_animlive.js               run
//   node tools/test_animlive.js --fps 60      the whole-piece pass at 60 fps (default 20)
//   node tools/test_animlive.js --prove-red   nudge one kind by 0.2 px and assert the
//                                             parity check FAILS (the battery can see)
//
// What it holds together:
//   1. the clock boundary — animlive.js reads no time source (as animobj)
//   2. every kind, on a synthetic fixture with all eight present (the piece
//      itself carries only four), at 0.01 s steps
//   3. THE WHOLE PIECE (db1, the video geometry every stand uses): every page,
//      every frame at --fps, every element compared — tag, order, colour,
//      opacity, and every number within the string path's rounding (0.05 px)
//   4. the time index: every instance alive inside a page window is planned
//      for that page; and each instance compared ALONE at the exact edges of
//      its live span (where an off-by-one in the index would hide a ball)
//   5. the zoom geometry and the solo split (two passes, cursor in the first)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const L = n => require(path.join(ROOT, 'notation', 'lib', n));
const Coords = L('coords.js'), Layout = L('layout.js'), Splice = L('splice.js'), Anim = L('animobj.js'), Live = L('animlive.js'), GC = L('gc.js');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const C = rd('notation/registry/container.json');
const ST = C.animated;
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const FPS = parseFloat(arg('fps', '20'));
const PROVE_RED = process.argv.includes('--prove-red');

let failures = 0, compared = 0, frames = 0;
const firstFails = [];
const fail = msg => { failures++; if (firstFails.length < 12) firstFails.push(msg); };
const ok = (c, msg) => { if (!c) fail(msg); };

if (PROVE_RED) {
  // a deliberate 0.2 px error in one kind's step — the battery must catch it
  const orig = Live.KINDS.gc;
  Live.KINDS.gc = (inst, view, st) => {
    const it = orig(inst, view, st);
    const s0 = it.step;
    it.step = t => { const r = s0(t); if (r) it.pieces[0].cy += 0.2; return r; };
    return it;
  };
}

// ---------- 1. the clock boundary ----------
const src = fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'animlive.js'), 'utf8');
ok(!/performance\.now|Date\.now|currentTime|requestAnimationFrame|new Date/.test(src), 'clock boundary: animlive.js reads no time source');

// ---------- the comparison ----------
// frameSvg's leaves, parsed the way testkit/build_assets.js does (a <g>'s
// fill/opacity fold onto its one child)
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9:_-]*="[^"]*")*)\s*(\/?)>/g;
const ATTR_RE = /([a-zA-Z][a-zA-Z0-9:_-]*)="([^"]*)"/g;
function parseLeaves(str) {
  const out = [], stack = [];
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(str))) {
    if (m[1]) { stack.pop(); continue; }
    const attrs = {};
    ATTR_RE.lastIndex = 0;
    let a;
    while ((a = ATTR_RE.exec(m[3]))) attrs[a[1]] = a[2];
    if (m[2] === 'g' && !m[4]) { stack.push(attrs); continue; }
    out.push({ tag: m[2], attrs: Object.assign({}, ...stack, attrs) });
  }
  return out;
}
const TOL = 0.0501;   // toFixed(1) rounds by at most 0.05
const isNum = v => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(+v));
function sameValue(k, a, b) {
  if (k === 'd') {
    const na = String(a).match(/-?\d+(\.\d+)?(e-?\d+)?|[A-Za-z]/g) || [], nb = String(b).match(/-?\d+(\.\d+)?(e-?\d+)?|[A-Za-z]/g) || [];
    if (na.length !== nb.length) return false;
    return na.every((x, i) => (isNum(x) && isNum(nb[i])) ? Math.abs(+x - +nb[i]) <= TOL : x === nb[i]);
  }
  if (isNum(a) && isNum(b)) return Math.abs(+a - +b) <= TOL;
  return String(a) === String(b);
}
function compare(strLeaves, liveLeaves, where) {
  compared++;
  if (strLeaves.length !== liveLeaves.length) {
    return fail(where + ': ' + strLeaves.length + ' elements on the string path, ' + liveLeaves.length + ' on A2');
  }
  for (let i = 0; i < strLeaves.length; i++) {
    const s = strLeaves[i], l = liveLeaves[i];
    if (s.tag !== l.tag) return fail(where + ' #' + i + ': <' + s.tag + '> vs <' + l.tag + '>');
    const sa = Object.assign({ opacity: '1' }, s.attrs), la = Object.assign({ opacity: 1 }, l.attrs);
    const keys = new Set(Object.keys(sa).concat(Object.keys(la)));
    for (const k of keys) {
      if (!(k in sa) || !(k in la)) return fail(where + ' #' + i + ' <' + s.tag + '>: attribute ' + k + ' only on ' + (k in sa ? 'the string path' : 'A2'));
      if (!sameValue(k, sa[k], la[k])) return fail(where + ' #' + i + ' <' + s.tag + '> ' + k + ': string ' + sa[k] + ' vs A2 ' + la[k]);
    }
  }
}
// one frame, both paths, compared
function frameCheck(instances, view, t, where, opts) {
  frames++;
  const str = parseLeaves(Anim.frameSvg(instances, view, t, ST, opts));
  const sc = Live.plan(instances, view, ST, opts);
  sc.step(t);
  compare(str, Live.leaves(sc), where);
  return str.length;
}

// ---------- 2. every kind, synthetic ----------
{
  const systems = Coords.systemsForParts([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const view = Coords.makeView({ widthPx: 1920, heightPx: 1080, window: [10, 22], gutterPx: 48, systems, ssPerSystem: 13 });
  const score = {
    objects: [
      { type: 'waveCurve', layer: 2, sonifyNote: 47, startSeconds: 12, endSeconds: 16, morphBend: [[0, 0], [4, 2]] },
      { type: 'waveCurve', layer: 10, startSeconds: 11, endSeconds: 21, color: '#2E8B57', nodes: [{ pos: 0, y: 2 }, { pos: 0.4, y: 7 }, { pos: 1, y: 9 }] },
      { type: 'waveCurve', layer: 5, sonifyNote: 43, startSeconds: 13, endSeconds: 19 },
      { type: 'waveCurve', layer: 1, sonifyNote: 40, startSeconds: 14, endSeconds: 15, groupId: 'grp-x' },
      { type: 'waveCurve', layer: 3, sonifyNote: 45, startSeconds: 15, endSeconds: 17.5, groupId: 'grp-x' },
    ],
  };
  const ir = {
    chunks: [{ part: 4, devices: [{ kind: 'gc', at: 14.0 }, { kind: 'gc', at: 15.3, preset: { duration: 1.1, descentRatio: 40 } }] }],
    events: [], overlays: [
      { kind: 'gliss', target: { part: 6, span: [12.5, 18] }, value: { samples: [0, 0.3, 0.9, 0.5, 1] } },
      { kind: 'cresc', target: { part: 7, span: [11, 20] }, value: { samples: [0.1, 0.6, 1] } },
      { kind: 'cresc', target: { part: 8, span: [16, 21.5] }, value: { samples: [0, 1], fullHeight: true } },
    ],
  };
  ir.chunks.push({ part: 0, events: ['e1'], devices: [] });
  ir.events.push({ id: 'e1', onset: 13.2, duration: 4, level: { samples: [0, 0.5, 0.2, 0.8] } });
  const st = Object.assign({}, ST, { motivePie: Object.assign({}, ST.motivePie, { enabled: true }) });
  const inst = Anim.collect(ir, score, st);
  const kinds = new Set(inst.map(i => i.kind));
  for (const k of Object.keys(Live.KINDS)) ok(kinds.has(k), 'fixture carries kind ' + k);
  ok(Object.keys(Live.KINDS).sort().join() === Anim.kinds().sort().join(), 'A2 covers every registered kind (' + Anim.kinds().join(', ') + ')');
  const stSave = ST.motivePie;
  ST.motivePie = st.motivePie;
  for (let t = 9.5; t <= 22.5; t += 0.01) frameCheck(inst, view, +t.toFixed(4), 'synthetic t=' + t.toFixed(2));
  // every instance alone at the exact edges of its span
  for (const i of inst) {
    const P = i.kind === 'gc' ? GC.params(Object.assign({}, ST.gc.preset || {}, i.preset || {})) : null;
    const edges = P ? [i.at - P.pre, i.at, i.at + P.post] : [i.t0, i.t1];
    for (const e of edges) for (const d of [-1e-7, 0, 1e-7]) frameCheck([i], view, e + d, 'synthetic ' + i.kind + ' edge ' + (e + d), { cursor: false });
  }
  ST.motivePie = stSave;
}

// ---------- 3–5. the piece ----------
const irId = arg('ir', 'db1');
const glyphs = rd('notation/lib/glyphs.json');
const pageRules = rd('notation/registry/page_rules.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));
let score = null;
try { score = rd(path.join('scores', ir.source.score + '.json')); } catch (e) { score = null; }
const FRAME_PARTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// the video geometry — notation.html renderContainerView / tools/export_video.js
const rz = (C.realizations || {})['video-jury'] || {};
const lanes = rz.lanes || { padTopPx: 8, padBotPx: 8, gapPx: 4 };
const W = (C.frame && C.frame.widthPx) || 1920, H = (C.frame && C.frame.heightPx) || 1080;
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
const cfgOf = p => ({ widthPx: W, heightPx: H, window: [p.t0, p.t0 + pageSeconds], gutterPx: (C.prefatory && C.prefatory.gutterPx) || 0, systems, ssPerSystem });
const dev = Layout.deviceResolver(ir, (C.engraving || {}).layout || {});
const collect = meta => Anim.collect(ir, score, ST, { parts: ir.source.parts, meta, deviceOf: dev, drawnOf: e => Layout.drawnLevelSamples(e, dev(e) || {}) });
const inst = collect(false);
const instMeta = collect(true);
const t0Run = Date.now();
let drawnMax = 0, drawnSum = 0;

// 3. every page, every frame
for (let pi = 0; pi < pages.length; pi++) {
  const view = Coords.makeView(cfgOf(pages[pi]));
  const [w0, w1] = view.window;
  const end = Math.min(w1, srcEnd);
  const sc = Live.plan(inst, view, ST);
  for (let k = 0; ; k++) {
    const t = w0 + k / FPS;
    if (t > end) break;
    const str = parseLeaves(Anim.frameSvg(inst, view, t, ST));
    sc.step(t);
    frames++;
    compare(str, Live.leaves(sc), irId + ' page ' + (pi + 1) + ' t=' + t.toFixed(3));
    drawnMax = Math.max(drawnMax, str.length); drawnSum += str.length;
  }
}
const piecePass = { frames, seconds: (Date.now() - t0Run) / 1000 };

// 4. the time index: every instance alive inside a window is in that page's plan
{
  let missing = 0, checked = 0;
  for (let pi = 0; pi < pages.length; pi++) {
    const view = Coords.makeView(cfgOf(pages[pi]));
    const [w0, w1] = view.window;
    const planned = new Set(Live.plan(inst, view, ST).items.map(it => it.inst));
    for (const i of inst) {
      let a, b;
      if (i.kind === 'gc') { const P = GC.params(Object.assign({}, ST.gc.preset || {}, i.preset || {})); a = i.at - P.pre; b = i.at + P.post; }
      else { a = i.t0; b = i.t1; }
      if (b < w0 || a > w1) continue;
      try { if (i.part !== undefined) view.system(i.part); } catch (e) { continue; }
      checked++;
      if (!planned.has(i)) { missing++; if (missing <= 3) fail('time index: ' + i.kind + ' [' + a.toFixed(3) + ', ' + b.toFixed(3) + '] alive on page ' + (pi + 1) + ' but not planned'); }
    }
  }
  ok(missing === 0, 'time index complete (' + checked + ' instance-pages checked, ' + missing + ' missing)');
  // each instance alone, at the exact edges of its live span, on its own page
  const pageOf = t => { for (let i = 0; i < pages.length; i++) if (t < pages[i].t0 + pageSeconds && t >= pages[i].t0) return i; return pages.length - 1; };
  for (const i of inst) {
    let edges;
    if (i.kind === 'gc') { const P = GC.params(Object.assign({}, ST.gc.preset || {}, i.preset || {})); edges = [i.at - P.pre, i.at, i.at + P.post]; }
    else edges = [i.t0, (i.t0 + i.t1) / 2, i.t1];
    for (const e of edges) for (const d of [-1e-7, 0, 1e-7]) {
      const t = e + d;
      const view = Coords.makeView(cfgOf(pages[pageOf(t)]));
      frameCheck([i], view, t, irId + ' ' + i.kind + ' alone at edge ' + t.toFixed(7), { cursor: false });
    }
  }
}

// 5. the zoom geometry (×2, as zoom-working) and META on, and the solo split
{
  const Z = ((C.realizations || {})['zoom-working'] || {}).zoomZ || 2;
  for (const pi of [0, Math.floor(pages.length / 2), pages.length - 3]) {
    const zc = Coords.zoomCfg(cfgOf(pages[pi]), Z, pages[pi].t0 + 2);
    const view = Coords.makeView(zc);
    for (let t = view.window[0]; t <= view.window[1]; t += 0.05) frameCheck(instMeta, view, t, irId + ' zoom×' + Z + ' META t=' + t.toFixed(2));
  }
  const on = new Set([1, 4, 7]);
  const onI = inst.filter(i => i.part === undefined || on.has(i.part)), offI = inst.filter(i => i.part !== undefined && !on.has(i.part));
  for (const pi of [3, 40]) {
    const view = Coords.makeView(cfgOf(pages[pi]));
    for (let t = view.window[0]; t <= Math.min(view.window[1], srcEnd); t += 0.1) {
      frameCheck(onI, view, t, 'solo on-pass t=' + t.toFixed(2));
      frameCheck(offI, view, t, 'solo off-pass t=' + t.toFixed(2), { cursor: false });
    }
  }
}

console.log('test_animlive: ' + irId + ' · ' + inst.length + ' instances · ' + pages.length + ' pages · whole piece at ' + FPS + ' fps = ' +
  piecePass.frames + ' frames in ' + piecePass.seconds.toFixed(1) + ' s · elements per frame mean ' + (drawnSum / Math.max(1, piecePass.frames)).toFixed(1) +
  ' / max ' + drawnMax + ' · ' + compared + ' comparisons in all');
if (PROVE_RED) {
  if (failures > 0) { console.log('PROVE-RED OK: a 0.2 px error in one kind was caught (' + failures + ' failures; first: ' + firstFails[0] + ')'); process.exit(0); }
  console.error('PROVE-RED FAILED: a deliberate 0.2 px error went unseen'); process.exit(1);
}
if (failures) { console.error(firstFails.map(s => 'FAIL ' + s).join('\n') + '\n' + failures + ' FAILURE(S)'); process.exit(1); }
console.log('ALL GREEN');
