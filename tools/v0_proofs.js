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
function proof(cfg) {
  const { model, ir, t0, sps, headerPx, ssPerSystem, file, params } = cfg;
  const parts = ir.source.parts;
  const areaH = H - headerPx;
  const topPad = 8 / areaH, botPad = 8 / areaH, gap = 4 / areaH;
  const systems = Coords.systemsForParts(parts, { topPad, botPad, gap });
  const view = Coords.makeView({ widthPx: W, heightPx: areaH, window: [t0, t0 + sps], systems, ssPerSystem });
  const inner = Render.renderSection(model, view, glyphs, { ownsEnd: true })
    .replace('<svg ', '<svg x="0" y="' + headerPx + '" ');

  // Header mock — px sizes stated so the eye judges REAL sizes (V0.6 intake).
  const titlePx = Math.round(headerPx * 0.30);           // 18/24/30 at 60/80/100
  const markerPx = Math.round(headerPx * 0.22);          // 13/18/22
  const timePx = Math.round(headerPx * 0.26);            // 16/21/26
  const midY = headerPx / 2;
  const mm = Math.floor(t0 / 60), ss2 = (t0 % 60).toFixed(1).padStart(4, '0');
  const head = [
    '<rect x="0" y="0" width="' + W + '" height="' + headerPx + '" fill="#fafafa"/>',
    '<line x1="0" y1="' + headerPx + '" x2="' + W + '" y2="' + headerPx + '" stroke="#999" stroke-width="1"/>',
    '<text x="16" y="' + (midY + titlePx * 0.35) + '" font-family="sans-serif" font-size="' + titlePx + '" fill="#222">for seven tubas</text>',
    '<text x="420" y="' + (midY + markerPx * 0.35) + '" font-family="sans-serif" font-size="' + markerPx + '" fill="#555">' + cfg.marker + '</text>',
    '<line x1="410" y1="' + (headerPx * 0.2) + '" x2="410" y2="' + (headerPx * 0.8) + '" stroke="#ccc" stroke-width="1"/>',
    '<text x="' + (W - 16) + '" y="' + (midY + timePx * 0.35) + '" text-anchor="end" font-family="monospace" font-size="' + timePx + '" fill="#333">' + mm + ':' + ss2 + '</text>',
  ].join('\n');

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">',
    '<!-- V0 proof: ' + params + ' -->',
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fff"/>',
    head, inner, '</svg>',
  ].join('\n');
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

// index.html — browse at 100%; caption OUTSIDE the frame so the look stays clean
const blocks = rows.map((r, i) =>
  '<div class="proof" id="p' + i + '"><div class="cap">' + (i + 1) + '/' + rows.length + ' — ' + r.params +
  ' <span class="m">lane ' + r.lanePx + 'px · staff ' + r.staffPx + 'px · ' + r.pxPerS + 'px/s</span></div>' +
  '<img src="' + r.file + '" width="1920" height="1080"></div>').join('\n');
fs.writeFileSync(path.join(OUT, 'index.html'), [
  '<!doctype html><meta charset="utf-8"><title>V0 proofs</title>',
  '<style>body{background:#2b2b2b;color:#ddd;font:13px sans-serif;margin:0;padding:12px}',
  '.proof{margin:0 0 28px}.cap{padding:6px 2px;color:#bbb}.m{color:#7fa}img{display:block;background:#fff;box-shadow:0 2px 12px #0008}',
  '.note{color:#fc6;padding:4px 2px 14px}</style>',
  '<div class="note">View at 100% browser zoom (CTRL+0). Each frame is exactly 1920×1080 — the shipped video size. Keys: J/K next/prev.</div>',
  blocks,
  '<script>let i=0;const n=' + rows.length + ';document.addEventListener("keydown",e=>{if(e.key==="j"||e.key==="J")i=Math.min(n-1,i+1);else if(e.key==="k"||e.key==="K")i=Math.max(0,i-1);else return;document.getElementById("p"+i).scrollIntoView()});</script>',
].join('\n'));

console.table(rows);
console.log('wrote ' + rows.length + ' proofs + index.html -> notation/app/proofs_v0/');
