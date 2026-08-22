#!/usr/bin/env node
// glyph_probe_dyn_extra.js — day 22 (second note): the SHORT form of piece
// #2's Just-In-Time Glyph Capture — one LilyPond fixture, one extraction,
// no corpus audit (the size is the locked -8.5; the spacings are the
// locked column standard). Adds the dynamics this piece needs beyond the
// ported ten (fp · sfp · sfzp) and the two articulations the column
// standard reserves a slot for (accent · marcato). `sfz` is rendered
// again as the PIPELINE CHECK: its numbers must equal the ported ones.
//
// Piece #2's oracle modules are used READ-ONLY (lp_render, the composite
// grouper, scalePath). Output → notation/glyph_sources/{dynamic,script}_extra.json,
// which tools/port_glyphs.js merges into glyphs.json (re-runnable).
//
//   node tools/glyph_probe_dyn_extra.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P2 = 'C:/Users/jwloy/GitHub/composition_for_two_pianos_and_two_percussion/tools/notation_studio/oracle';
const { renderLp } = require(path.join(P2, 'lp_render.js'));
const { extractCompositeGroups } = require(path.join(P2, 'probes', 'dynamic_measure.js'));
const { scalePath } = require(path.join(P2, 'probes', 'accidental_extract_glyphs.js'));

const LP_SOURCE = String.raw`\version "2.24.0"
\paper {
  indent = 0
  ragged-right = ##t
  paper-width = 200\mm
  paper-height = 30\mm
  top-margin = 2\mm
  bottom-margin = 2\mm
  left-margin = 2\mm
  right-margin = 2\mm
  tagline = ##f
  print-page-number = ##f
  page-breaking = #ly:one-line-breaking
}
sfp = #(make-dynamic-script "sfp")
sfzp = #(make-dynamic-script "sfzp")
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override DynamicText.font-size = #-8.5
    c''4\sfz  s4
    c''4\fp   s4
    c''4\sfp  s4
    c''4\sfzp s4
    c''4^\accent  s4
    c''4^\marcato s4
    \bar ""
  }
  \layout { }
}
`;
const DYN_ORDER = ['sfz', 'fp', 'sfp', 'sfzp'];
const SCRIPT_ORDER = ['accent', 'marcato'];

function composite(c) {
  const xMin = Math.min(...c.letters.map(L => L.worldBBox.minX));
  const xMax = Math.max(...c.letters.map(L => L.worldBBox.maxX));
  const yMin = Math.min(...c.letters.map(L => L.worldBBox.minY));
  const yMax = Math.max(...c.letters.map(L => L.worldBBox.maxY));
  const segments = c.letters.map(L => scalePath(L.d, L.sx, L.sy, (c.tx + L.dx) - xMin, (c.ty + L.dy) - yMin));
  return {
    path: segments.join(' '),
    width: +(xMax - xMin).toFixed(4), height: +(yMax - yMin).toFixed(4),
    anchor: { x: +((c.tx + c.letters[0].dx) - xMin).toFixed(4), y: +(c.ty - yMin).toFixed(4) },
    letterCount: c.letters.length, tx: c.tx, ty: c.ty,
  };
}

function main() {
  const fixDir = path.join(ROOT, 'tools', 'fixtures', 'lp_probes');
  fs.mkdirSync(fixDir, { recursive: true });
  const r = renderLp(LP_SOURCE, { basename: 'dynamic_extra', outDir: path.join(fixDir, '_lp_out') });
  fs.copyFileSync(r.svgPath, path.join(fixDir, 'dynamic_extra.svg'));
  fs.writeFileSync(path.join(fixDir, 'dynamic_extra.ly'), LP_SOURCE);
  const svg = fs.readFileSync(path.join(fixDir, 'dynamic_extra.svg'), 'utf8');
  const groups = extractCompositeGroups(svg).map(composite);
  // staff lines / noteheads / spacers are groups too: keep multi-letter or
  // sub-staff groups by position. Dynamics sit BELOW the staff (ty > 5,
  // piece #2's filter); the forced-above scripts sit ABOVE it (ty < 0).
  const below = groups.filter(g => g.ty > 5).sort((a, b) => a.tx - b.tx);
  // noteheads all share one ty (the c'' line); the scripts are the
  // remaining single-letter groups above that line
  const headTy = groups.filter(g => g.letterCount === 1 && g.ty < 5).map(g => g.ty).sort((a, b) => a - b);
  const noteTy = headTy[Math.floor(headTy.length / 2)];
  const above = groups.filter(g => g.ty < noteTy - 0.5).sort((a, b) => a.tx - b.tx);
  console.log('groups: ' + groups.length + ' · below staff ' + below.length + ' · above ' + above.length);
  for (const g of groups) console.log('  tx ' + g.tx.toFixed(2) + ' ty ' + g.ty.toFixed(2) + ' letters ' + g.letterCount + ' w ' + g.width + ' h ' + g.height);
  if (below.length !== DYN_ORDER.length) throw new Error('expected ' + DYN_ORDER.length + ' dynamics below the staff, got ' + below.length);
  if (above.length !== SCRIPT_ORDER.length) throw new Error('expected ' + SCRIPT_ORDER.length + ' scripts above the staff, got ' + above.length);
  const today = new Date().toISOString().slice(0, 10);
  const meta = (what) => ({
    source: 'LP fixture tools/fixtures/lp_probes/dynamic_extra.svg (' + what + ')',
    anchor: 'path (0, 0) == composite bbox top-left; anchor { x, y } == typographic baseline-left offset within bbox',
    extractedBy: 'tools/glyph_probe_dyn_extra.js (piece #2 oracle modules, read-only)',
    lilypond: r.stderr.match(/GNU LilyPond [\d.]+/) ? r.stderr.match(/GNU LilyPond [\d.]+/)[0] : 'see fixture',
    date: today,
  });
  const dyn = { _meta: Object.assign(meta('DynamicText.font-size = #-8.5, the locked size; sfz = pipeline check vs the ported composite'), { fontSize: -8.5 }) };
  DYN_ORDER.forEach((k, i) => { const { tx, ty, ...rest } = below[i]; dyn[k] = rest; });
  const scr = { _meta: meta('stock Script size at NoteHead.font-size = #-2, piece #2 mute_harmonic convention; forced above with ^') };
  SCRIPT_ORDER.forEach((k, i) => { const { tx, ty, ...rest } = above[i]; scr[k] = rest; });
  // PIPELINE CHECK: sfz must equal the ported composite
  const ported = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8')).dynamic.sfz;
  const dw = Math.abs(ported.wSs - dyn.sfz.width), dh = Math.abs(ported.hSs - dyn.sfz.height);
  const samePath = ported.path === dyn.sfz.path;
  console.log('sfz pipeline check: ported ' + ported.wSs + '×' + ported.hSs + ' vs fresh ' + dyn.sfz.width + '×' + dyn.sfz.height + ' · path identical: ' + samePath);
  if (dw > 1e-3 || dh > 1e-3) throw new Error('sfz pipeline check FAILED — the fresh extraction does not match the ported glyph');
  delete dyn.sfz;   // the check only; the ported one stays the source of record
  const outDir = path.join(ROOT, 'notation', 'glyph_sources');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'dynamic_extra.json'), JSON.stringify(dyn, null, 1) + '\n');
  fs.writeFileSync(path.join(outDir, 'script_extra.json'), JSON.stringify(scr, null, 1) + '\n');
  fs.rmSync(path.join(fixDir, '_lp_out'), { recursive: true, force: true });
  console.log('wrote notation/glyph_sources/dynamic_extra.json (' + Object.keys(dyn).filter(k => !k.startsWith('_')).join(', ') + ') + script_extra.json (' + SCRIPT_ORDER.join(', ') + ')');
}
main();
