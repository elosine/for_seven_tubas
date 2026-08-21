// v0_proofs.js — V0 TRUE-SIZE PROOFS (8a [A21], DELIVERABLES_BUILD_PLAN V0).
// Renders candidate containers at EXACTLY 1920×1080 for the composer's eye:
//   A: lane config / header height (V0.1)  — header 60 / 80 / 100 px
//   B: staff size ladder (V0.2)            — ssPerSystem 10 / 12 / 14
//   C: horizontal time scale, trance (V0.3) — 8 / 12 / 16 s per system
//   D: horizontal time scale, apex (V0.3)   — 4 / 6 / 8 s per system
// Real material only: trance-section-01 (busiest window, computed) and
// section1-e20 centered on the density apex (M5 window 48.9–54.9).
// Header band is drawn HERE (mock title/markers/timecode at stated px) —
// render.js's marker path is a placeholder (y=12/font10) and is NOT used.
// Output: notation/app/proofs_v0/*.svg + index.html (browse at 100% zoom).
const fs = require('fs');
const path = require('path');
const Coords = require('../notation/lib/coords.js');
const Layout = require('../notation/lib/layout.js');
const Render = require('../notation/lib/render.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'notation', 'app', 'proofs_v0');
const W = 1920, H = 1080;

const glyphs = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation/lib/glyphs.json'), 'utf8'));
const irTrance = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation/ir/trance-section-01.ir.json'), 'utf8'));
const irS1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation/ir/section1-e20.ir.json'), 'utf8'));

// Busiest trance window per span: slide over the section, count event onsets.
function busiestWindow(ir, span) {
  const on = ir.events.map(e => e.onset).sort((a, b) => a - b);
  const [s0, s1] = ir.source.window;
  let best = s0, bestN = -1;
  for (let t = s0; t <= s1 - span; t += 0.5) {
    const n = on.filter(x => x >= t && x < t + span).length;
    if (n > bestN) { bestN = n; best = t; }
  }
  return { t0: Math.round(best * 2) / 2, n: bestN };
}

const APEX_MID = (48.9 + 54.9) / 2; // M5 apex window center, cloud02-10track

const modelTrance = Layout.layoutSection(irTrance, glyphs, {});
const modelS1 = Layout.layoutSection(irS1, glyphs, {});
for (const w of modelTrance.warnings.concat(modelS1.warnings)) console.log('layout warning:', w);

// One proof = header band + nested notation SVG, exactly 1920×1080.
// headerPx 0 = the chosen video-jury container (no header at all).
// cfg.staffPx (absolute staff height) may replace cfg.ssPerSystem — the
// C-switch: ssPerSystem derives so staff size is the first-class number
// (the V1 decoupling, exercised here ahead of the build).
function proof(cfg) {
  const { model, ir, t0, sps, headerPx, file, params } = cfg;
  const parts = ir.source.parts;
  const areaH = H - headerPx;
  const topPad = 8 / areaH, botPad = 8 / areaH, gap = 4 / areaH;
  const systems = Coords.systemsForParts(parts, { topPad, botPad, gap });
  const lanePxCalc = ((1 - 2 * topPad - gap * (parts.length - 1)) / parts.length) * areaH;
  const ssPerSystem = cfg.staffPx ? lanePxCalc / (cfg.staffPx / 4) : cfg.ssPerSystem;
  const view = Coords.makeView({ widthPx: W, heightPx: areaH, window: [t0, t0 + sps], systems, ssPerSystem });
  const inner = Render.renderSection(model, view, glyphs, { ownsEnd: true })
    .replace('<svg ', '<svg x="0" y="' + headerPx + '" ');

  // Header mock — px sizes stated so the eye judges REAL sizes (V0.6 intake).
  // headerPx 0 (the chosen container): no band, no furniture at all.
  let head = '';
  if (headerPx > 0) {
    const titlePx = Math.round(headerPx * 0.30);         // 18/24/30 at 60/80/100
    const markerPx = Math.round(headerPx * 0.22);        // 13/18/22
    const timePx = Math.round(headerPx * 0.26);          // 16/21/26
    const midY = headerPx / 2;
    const mm = Math.floor(t0 / 60), ss2 = (t0 % 60).toFixed(1).padStart(4, '0');
    head = [
      '<rect x="0" y="0" width="' + W + '" height="' + headerPx + '" fill="#fafafa"/>',
      '<line x1="0" y1="' + headerPx + '" x2="' + W + '" y2="' + headerPx + '" stroke="#999" stroke-width="1"/>',
      '<text x="16" y="' + (midY + titlePx * 0.35) + '" font-family="sans-serif" font-size="' + titlePx + '" fill="#222">for seven tubas</text>',
      '<text x="420" y="' + (midY + markerPx * 0.35) + '" font-family="sans-serif" font-size="' + markerPx + '" fill="#555">' + cfg.marker + '</text>',
      '<line x1="410" y1="' + (headerPx * 0.2) + '" x2="410" y2="' + (headerPx * 0.8) + '" stroke="#ccc" stroke-width="1"/>',
      '<text x="' + (W - 16) + '" y="' + (midY + timePx * 0.35) + '" text-anchor="end" font-family="monospace" font-size="' + timePx + '" fill="#333">' + mm + ':' + ss2 + '</text>',
    ].join('\n');
  }

  let svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">',
    '<!-- V0 proof: ' + params + ' -->',
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>',
    head, inner, '</svg>',
  ].join('\n');
  if (cfg.postProcess) svg = cfg.postProcess(svg);
  fs.writeFileSync(path.join(OUT, file), svg);

  const lane = systems[0];
  const lanePx = (lane.laneFrac1 - lane.laneFrac0) * areaH;
  return { file, params, lanePx: lanePx.toFixed(1), ssPx: (lanePx / ssPerSystem).toFixed(2), staffPx: (4 * lanePx / ssPerSystem).toFixed(1), pxPerS: (W / sps).toFixed(0) };
}

fs.mkdirSync(OUT, { recursive: true });
const trW = busiestWindow(irTrance, 12);
console.log('trance busiest 12 s window: t0=' + trW.t0 + ' (' + trW.n + ' events)');

const rows = [];
const trBase = { model: modelTrance, ir: irTrance, t0: trW.t0, marker: 'TRANCE · tranceA002f · busiest 12 s' };
const apoint = sps => ({ model: modelS1, ir: irS1, t0: Math.round((APEX_MID - sps / 2) * 10) / 10, marker: 'SECTION 1 APEX · cloud02-10track' });

// A — header/lane candidates (ss 12, sps 12)
for (const h of [60, 80, 100]) rows.push(proof({ ...trBase, sps: 12, headerPx: h, ssPerSystem: 12, file: 'A-header' + h + '.svg', params: 'A: header ' + h + 'px · ss/system 12 · 12 s/system · trance' }));
// B — staff-size ladder (header 80, sps 12)
for (const ss of [10, 12, 14]) rows.push(proof({ ...trBase, sps: 12, headerPx: 80, ssPerSystem: ss, file: 'B-ss' + ss + '.svg', params: 'B: ss/system ' + ss + ' · header 80 · 12 s/system · trance' }));
// C — time scale, trance (header 80, ss 12)
for (const sps of [8, 12, 16]) rows.push(proof({ ...trBase, sps, headerPx: 80, ssPerSystem: 12, file: 'C-trance-sps' + sps + '.svg', params: 'C: ' + sps + ' s/system (' + Math.round(W / sps) + ' px/s) · trance' }));
// D — time scale, density apex (header 80, ss 12)
for (const sps of [4, 6, 8]) rows.push(proof({ ...apoint(sps), sps, headerPx: 80, ssPerSystem: 12, file: 'D-apex-sps' + sps + '.svg', params: 'D: ' + sps + ' s/system (' + Math.round(W / sps) + ' px/s) · density apex' }));
// E — THE C-SWITCH TEST (day-21): the CHOSEN container (no header) with
// staff size as the one flipped number — everything must resize from it.
for (const st of [31.6, 28.0]) rows.push(proof({ ...trBase, sps: 12, headerPx: 0, staffPx: st, file: 'E-staff' + String(st).replace('.', 'p') + '.svg', params: 'E: CHOSEN container (no header) · staff ' + st + 'px · 12 s/system · trance' }));
// F — THE FONT (V0.7): same chosen container, one font per proof, applied
// to every text item (part labels, tempo marks, technique tags). Windows
// system fonts only, so what the composer sees is exactly installable ink;
// the winner must then survive the V4/V5 rasterizer (that proof is V4's).
// render.js hardcodes sans-serif today — swapped here by post-process; V1
// moves it into the engraving registry.
const FONTS = [
  ['georgia', 'Georgia, serif'],
  ['times', "'Times New Roman', serif"],
  ['palatino', "'Palatino Linotype', serif"],
  ['segoe', "'Segoe UI', sans-serif"],
  // day-21 addition: the composer remembered the prior scores' voice —
  // both piece #1 and #2 apps use CONSOLAS for all score-machine text
  // (time, tempo, labels). Verified really installed by canvas width vs
  // serif fallback (document.fonts.check false-positives!). Inconsolata,
  // the free variant the composer recalled, is NOT installed — needs a
  // download (composer permission) and only matters if we ever EMBED the
  // font (PDF/web); rendered video pixels carry no font license question.
  ['consolas', 'Consolas, monospace'],
  ['cascadia', "'Cascadia Mono', monospace"],
  // day-21 correction (composer): THE font of both prior pieces — Crimson
  // Pro Light (+ Light Italic for expressive text). LilyPond textFontName
  // in #1/#2, embedded + text-outlined in #2's performance app. TTFs
  // copied from piece #1 into notation/app/fonts/; the pager inlines the
  // SVGs and @font-faces them (an <img>-loaded SVG cannot fetch fonts).
  ['crimson', "'Crimson Pro Light', serif"],
  ['crimson-italic', "'Crimson Pro Light', serif", 'italic'],
];
for (const [name, stack, style] of FONTS) rows.push(proof({
  ...trBase, sps: 12, headerPx: 0, staffPx: 31.6, file: 'F-' + name + '.svg',
  params: 'F: font ' + stack.replace(/'/g, '') + (style ? ' ' + style : '') + ' · chosen container · trance',
  postProcess: svg => svg.replace(/font-family="sans-serif"/g,
    'font-family="' + stack.replace(/'/g, '&#39;') + '"' + (style ? ' font-style="' + style + '"' : '')),
}));

// index.html — PIXEL-EXACT PAGER. One proof at a time at 0,0 with zero page
// chrome, so in browser fullscreen (F11) on a 1920×1080 screen the frame
// fills the screen exactly — the same fit the shipped video will have.
// (v1 was a padded scroll page; on a 1080 screen the padding + caption bar
// + scrollbars forced scrolling and clipped the bottom lane — composer hit
// it immediately. The judgment surface must have no chrome of its own.)
// Keys: J/K step · C caption overlay on/off. Caption defaults ON; it
// overlays the header's right side, one keypress removes it for the clean
// look. Scrollbars appear only if the window is SMALLER than 1920×1080
// (i.e. not fullscreen), so nothing is ever unreachable.
const meta = rows.map((r, i) => ({
  file: r.file,
  cap: (i + 1) + '/' + rows.length + ' — ' + r.params + '   [lane ' + r.lanePx + 'px · staff ' + r.staffPx + 'px · ' + r.pxPerS + 'px/s]',
}));
fs.writeFileSync(path.join(OUT, 'index.html'), [
  '<!doctype html><meta charset="utf-8"><title>V0 proofs</title>',
  '<style>',
  // Crimson Pro Light = the prior pieces\' notation text font; the SVGs are
  // INLINED (not <img>) precisely so these page-level faces reach them.
  '@font-face{font-family:"Crimson Pro Light";font-style:normal;font-weight:300;src:url("../fonts/CrimsonPro-Light.ttf") format("truetype")}',
  '@font-face{font-family:"Crimson Pro Light";font-style:italic;font-weight:300;src:url("../fonts/CrimsonPro-LightItalic.ttf") format("truetype")}',
  'html,body{margin:0;padding:0;background:#000}',
  '#frame{display:block;width:1920px;height:1080px;background:#fff;overflow:hidden}',
  '#frame svg{display:block}',
  '#cap{position:fixed;top:6px;right:8px;background:#000c;color:#fff;font:14px/1.4 sans-serif;padding:6px 10px;border-radius:4px;max-width:46em}',
  '#cap .hint{color:#9ab;font-size:12px}',
  '</style>',
  '<div id="frame"></div>',
  '<div id="cap"></div>',
  '<script>',
  'const M=' + JSON.stringify(meta) + ';let i=0,capOn=true;',
  'const frame=document.getElementById("frame"),cap=document.getElementById("cap");',
  'async function show(){const r=await fetch(M[i].file);frame.innerHTML=await r.text();',
  ' cap.style.display=capOn?"block":"none";',
  ' cap.innerHTML=M[i].cap+"<div class=hint>J/K = next/prev &nbsp;·&nbsp; C = hide this caption &nbsp;·&nbsp; F11 = exact fit</div>";}',
  'document.addEventListener("keydown",e=>{const k=e.key.toLowerCase();',
  ' if(k==="j")i=Math.min(M.length-1,i+1);else if(k==="k")i=Math.max(0,i-1);',
  ' else if(k==="c")capOn=!capOn;else return;show();});',
  'show();',
  '</script>',
].join('\n'));

console.table(rows);
console.log('wrote ' + rows.length + ' proofs + index.html -> notation/app/proofs_v0/');
