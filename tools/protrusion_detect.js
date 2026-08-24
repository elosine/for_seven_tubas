#!/usr/bin/env node
// protrusion_detect.js — V3 [A21]: the geometric auto-filer. Lays out an
// IR in the VIDEO container geometry and files every place ink leaves its
// lane band — through the inter-lane gap into a neighbor, or off the
// frame — to docs/NOTATION_POLISH.md. Detection is automatic and silent
// (D18: the composer is never asked about micro-layout mid-notation);
// FIXES are tier-3 work via the data channels.
//
//   node tools/protrusion_detect.js <ir-id> [<ir-id>...] [--dry]
//
// Model-space pass (seconds + ss; the container's numbers map it): outward
// ink extents per event cluster vs the lane's half-height + gap. Reports
// worst offender per part per second-bucket so the ledger stays readable
// (one line per real spot, not one per notehead).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));

const ids = process.argv.slice(2).filter(a => !a.startsWith('--'));
const dry = process.argv.includes('--dry');
if (!ids.length) { console.error('usage: protrusion_detect.js <ir-id> [...] [--dry]'); process.exit(2); }

// container geometry -> the ss budget per lane (same arithmetic as the app)
const H = C.frame.heightPx, lanes = C.realizations['video-jury'].lanes;
const n = 10;
const lanePx = ((H - lanes.padTopPx - lanes.padBotPx - lanes.gapPx * (n - 1)) / n);
const ssPx = C.staff.staffHeightPx / 4;
const HALF = lanePx / 2 / ssPx;              // ss from staff middle to lane edge
const GAP = lanes.gapPx / ssPx;              // inter-lane gap in ss

// outward reach of each item kind beyond its anchor ySs (ss units)
function extent(it) {
  if (it.k === 'glyph' && it.g === 'notehead') return { y: it.ySs, r: 0.55 };
  if (it.k === 'glyph' && String(it.g).startsWith('accidental')) return { y: it.ySs, r: 1.4 };
  if (it.k === 'dot') return { y: it.ySs, r: 0.2 };
  if (it.k === 'ledger') return { y: it.ySs, r: 0.1 };
  if (it.k === 'stem') return { y: (Math.abs(it.yA) > Math.abs(it.yB) ? it.yA : it.yB), r: 0 };
  if (it.k === 'text') return { y: it.ySs, r: 0.7 };
  if (it.k === 'beam') return it.tips && it.tips.length ? { y: it.tips[0].ySs, r: 0.5 } : null;
  // day 31: brackets and the dyn/accent glyph rows were invisible to this
  // detector — the CLOUD02-D repair pass moves them to whichever side has
  // room, so their lane-edge behaviour must be measured, not assumed.
  if (it.k === 'tuplet') return { y: it.ySs, r: 0.9 };   // line + hook/numeral either way
  if (it.k === 'glyph' && /^dyn-/.test(String(it.g))) { const gm = G.dynamic[String(it.g).slice(4)]; return { y: it.ySs, r: gm ? gm.hSs / 2 : 0.5 }; }
  if (it.k === 'glyph' && /^artic-/.test(String(it.g))) { const gm = G.articulation[String(it.g).slice(6)]; return { y: it.ySs, r: gm ? gm.hSs / 2 : 0.42 }; }
  return null;
}

let filed = 0;
const lines = [];
for (const id of ids) {
  const ir = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', id + '.ir.json'), 'utf8'));
  const model = Layout.layoutSection(ir, G, (C.engraving && C.engraving.layout) || {});
  for (const sys of model.systems) {
    // bucket by whole second; keep the worst overflow per bucket
    const worst = new Map();
    for (const it of sys.items) {
      const e = extent(it);
      if (!e) continue;
      const top = e.y + e.r, bot = e.y - e.r;
      const over = Math.max(top - HALF, -bot - HALF, 0);
      if (over <= GAP) continue;             // inside lane or absorbed by the gap
      // a beam item carries neither t nor t0 — its time is its first tip's
      // (latent since V3; first hit day 31, when a beam first crossed the line)
      const t = it.t !== undefined ? it.t : (it.t0 !== undefined ? it.t0 : (it.tips && it.tips.length ? it.tips[0].t : 0));
      const key = Math.floor(t || 0);
      const px = ((over - GAP) * ssPx);
      const prev = worst.get(key);
      if (!prev || px > prev.px) worst.set(key, { t, px, kind: it.k + (it.g ? ':' + it.g : ''), dir: top - HALF > -bot - HALF ? 'top' : 'bottom' });
    }
    for (const [, w] of [...worst.entries()].sort((a, b) => a[0] - b[0])) {
      lines.push('- `' + id + '` · T' + (sys.part + 1) + ' @ ' + w.t.toFixed(2) + ' s — ' + w.kind +
        ' crosses the ' + w.dir + ' lane edge into the neighbor by ~' + w.px.toFixed(1) + ' px');
      filed++;
    }
  }
}

if (dry) {
  console.log(lines.join('\n') || '(clean)');
} else if (filed) {
  const LEDGER = path.join(ROOT, 'docs', 'NOTATION_POLISH.md');
  const stamp = '\n### ' + new Date().toISOString().slice(0, 10) + ' — ' + ids.join(', ') + '\n\n';
  fs.appendFileSync(LEDGER, stamp + lines.join('\n') + '\n');
}
console.log('protrusion_detect: ' + filed + ' item(s) ' + (dry ? '(dry run)' : filed ? 'filed to docs/NOTATION_POLISH.md' : '— clean, nothing filed'));
