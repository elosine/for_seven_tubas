#!/usr/bin/env node
// test_render.js — B5 gate: the A3 window renders to stable SVG. Element
// census + committed snapshot (hash of the SVG string) + --prove-red.
//   node tools/test_render.js [--update] [--prove-red]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Render = require(path.join(ROOT, 'notation', 'lib', 'render.js'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const SNAP = path.join(ROOT, 'tools', 'fixtures', 'render_snapshot.json');

let failures = 0;
const ok = (c, msg) => { if (!c) { failures++; console.error('FAIL ' + msg); } };
const eq = (a, b, msg) => { if (a !== b) { failures++; console.error(`FAIL ${msg}: ${a} vs ${b}`); } };

const bar = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-bar-01.ir.json'), 'utf8'));
const model = Layout.layoutSection(bar, G);
const view = Coords.makeView({
  widthPx: 1200, heightPx: 300, window: bar.source.window,
  systems: Coords.systemsForParts(bar.source.parts),
});
const svg = Render.renderSection(model, view, G, { markers: [{ time: 60.8, label: 'base x15' }] });

const n = re => (svg.match(re) || []).length;
ok(svg.startsWith('<svg '), 'is an svg');
eq(n(/<path /g), 20, '20 paths: 19 noteheads + 1 clef (no flags/accidentals)');
eq(n(/<circle /g), 19, '19 staccato dots');
eq(n(/<polygon /g), 0, 'no beams at subdivision 1');
// rects: 5 staff lines + 19 stems + 4 ledgers + 2 GC ticks + 1 paper = 31
eq(n(/<rect /g), 31, 'rect census (staff+stems+ledgers+ticks+paper)');
// texts: 2 tempo + 1 part label + 1 marker + authored instruction + dynamic = 6
eq(n(/<text /g), 6, 'text census (incl. rendered overlays)');
ok(svg.includes('base x15'), 'marker read-through rendered');
ok(!svg.includes('NaN'), 'no NaN leaked into the SVG');

// out-of-window clipping: a narrow window drops distant items
const view2 = Coords.makeView({ widthPx: 600, heightPx: 300, window: [58.4, 60.0], systems: Coords.systemsForParts([4]) });
const svg2 = Render.renderSection(model, view2, G, {});
ok((svg2.match(/<circle /g) || []).length === 3, 'narrow window shows only its 3 dots');

// page ownership (review fix): an event exactly on the cut belongs to the
// NEXT page — ownsEnd:false excludes the 60.8 BASE attack, true includes it
const view3 = Coords.makeView({ widthPx: 600, heightPx: 300, window: [58.4, 60.8], systems: Coords.systemsForParts([4]) });
const openSvg = Render.renderSection(model, view3, G, { ownsEnd: false });
const closedSvg = Render.renderSection(model, view3, G, { ownsEnd: true });
ok((openSvg.match(/<circle /g) || []).length === 4, 'half-open page: boundary attack excluded');
ok((closedSvg.match(/<circle /g) || []).length === 5, 'final/standalone window: boundary attack included');

// ---- V1 [A21c]: gutter view — furniture in the dead space, music after ----
// (regex includes NEGATIVE x — the first version didn't, and passed
// vacuously while the clef sat at x=-35.8 off-screen. Probe first.)
const allTranslates = s => [...s.matchAll(/<g transform="translate\((-?[\d.]+)/g)].map(m => parseFloat(m[1]));
// a view whose staff scale lets the clef FIT the 48px gutter (ssPx ≈ 8)
const gView = Coords.makeView({
  widthPx: 1200, heightPx: 100, window: bar.source.window, gutterPx: 48,
  systems: Coords.systemsForParts(bar.source.parts),
});
const gSsPx = gView.system(4).ssPx;
const gSvg = Render.renderSection(model, gView, G, { engraving: { fontFamily: "'Crimson Pro Light', serif" } });
const gTr = allTranslates(gSvg);
ok(Math.min(...gTr) >= 0, 'gutter: no stamp vanishes off the left edge');
const clefXexp = 48 - G.clef.bass.wSs * gSsPx - 0.75 * gSsPx;
ok(gTr.some(x => Math.abs(x - clefXexp) < 0.6), 'gutter: clef right-aligned toward the music start');
ok(gTr.filter(x => x < clefXexp + G.clef.bass.wSs * gSsPx - 0.5).length === 1,
  'gutter: only the clef occupies the dead space');
ok(gSvg.includes('Crimson Pro Light'), 'engraving fontFamily reaches the text items');
ok(gSvg.split('font-family="sans-serif"').length - 1 === 0,
  'no text falls back to the hardcoded font when a registry font is given');
// a view whose staff scale makes the clef TOO BIG for the gutter: the clamp
// keeps it VISIBLE (x>=2) — overflow must never vanish off-screen
const bigView = Coords.makeView({
  widthPx: 1200, heightPx: 300, window: bar.source.window, gutterPx: 48,
  systems: Coords.systemsForParts(bar.source.parts),
});
const bigTr = allTranslates(Render.renderSection(model, bigView, G, {}));
// (the clamp is on the anchor point; the stamp's translate sits an anchor-
// offset left of it — the invariant is VISIBILITY, i.e. nothing at x<0)
ok(Math.min(...bigTr) >= 0, 'oversized clef clamps visibly — nothing vanishes off-screen');

// ---- snapshot (svg hash + censuses; the full svg is deterministic) ----
function snap(perturb) {
  const s = perturb ? svg.replace('viewBox', 'viewbox') : svg;
  return {
    sha1: crypto.createHash('sha1').update(s).digest('hex'),
    bytes: s.length, paths: n(/<path /g), rects: n(/<rect /g), circles: n(/<circle /g), texts: n(/<text /g),
  };
}
const args = process.argv.slice(2);
const current = snap(args.includes('--prove-red'));
if (args.includes('--update')) { fs.writeFileSync(SNAP, JSON.stringify(current, null, 1)); console.log('snapshot written'); }
else if (!fs.existsSync(SNAP)) { failures++; console.error('FAIL: no committed snapshot'); }
else if (JSON.stringify(JSON.parse(fs.readFileSync(SNAP, 'utf8'))) !== JSON.stringify(current)) {
  failures++; console.error('FAIL: render snapshot drift — if intentional, --update and review');
}
if (args.includes('--prove-red')) {
  if (failures > 0) { console.log('PROVE-RED OK'); process.exit(0); }
  console.error('PROVE-RED BROKEN'); process.exit(1);
}
if (failures) { console.error(`RENDER RED: ${failures} failure(s)`); process.exit(1); }
console.log('RENDER GREEN: census + clipping + snapshot stable');
