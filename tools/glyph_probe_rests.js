#!/usr/bin/env node
// glyph_probe_rests.js — day 23: the SHORT-FORM glyph capture (principle 10)
// for RESTS, which neither piece #1 nor piece #2 ever needed — the composer's
// beamed cluster is the first material in the lineage with a rest in it.
//
// One LilyPond fixture at the locked NoteHead.font-size = #-2, one extraction
// through piece #2's oracle modules (READ-ONLY), and — the equality check that
// makes the run trustworthy — a NOTEHEAD rendered in the same fixture, whose
// numbers must match the ported notehead.filled. If the head matches, the
// pipeline is the same one that produced every other glyph in glyphs.json.
//
// Output → notation/glyph_sources/rest_extra.json, merged by port_glyphs.js.
//
//   node tools/glyph_probe_rests.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P2 = 'C:/Users/jwloy/GitHub/composition_for_two_pianos_and_two_percussion/tools/notation_studio/oracle';
const { renderLp } = require(path.join(P2, 'lp_render.js'));
const { extractCompositeGroups } = require(path.join(P2, 'probes', 'dynamic_measure.js'));
const { scalePath } = require(path.join(P2, 'probes', 'accidental_extract_glyphs.js'));

// Rests are rendered on a staff with the engravers removed, at the locked
// notehead size. A c'' notehead goes first as the pipeline check. Rests sit at
// their DEFAULT vertical position, which is what we want to measure: LP places
// the 8th/16th rest hanging from the middle line region.
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
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override Rest.font-size = #-2
    c''4 s4
    r8  s4
    r16 s4
    r32 s4
    r4  s4
    \bar ""
  }
  \layout { }
}
`;
const ORDER = ['rest8', 'rest16', 'rest32', 'rest4'];

function composite(c) {
  const xMin = Math.min(...c.letters.map(L => L.worldBBox.minX));
  const xMax = Math.max(...c.letters.map(L => L.worldBBox.maxX));
  const yMin = Math.min(...c.letters.map(L => L.worldBBox.minY));
  const yMax = Math.max(...c.letters.map(L => L.worldBBox.maxY));
  const segments = c.letters.map(L => scalePath(L.d, L.sx, L.sy, (c.tx + L.dx) - xMin, (c.ty + L.dy) - yMin));
  return {
    path: segments.join(' '),
    width: +(xMax - xMin).toFixed(4), height: +(yMax - yMin).toFixed(4),
    // staffY: where the glyph's ORIGIN sits relative to the staff middle line,
    // in staff spaces, +up (LP's y grows down; the fixture's staff middle is
    // computed from the staff lines below)
    tx: c.tx, ty: c.ty, letterCount: c.letters.length,
    bboxTop: yMin, bboxBot: yMax,
  };
}

function main() {
  const fixDir = path.join(ROOT, 'tools', 'fixtures', 'lp_probes');
  fs.mkdirSync(fixDir, { recursive: true });
  const r = renderLp(LP_SOURCE, { basename: 'rests', outDir: path.join(fixDir, '_lp_out') });
  fs.copyFileSync(r.svgPath, path.join(fixDir, 'rests.svg'));
  fs.writeFileSync(path.join(fixDir, 'rests.ly'), LP_SOURCE);
  const svg = fs.readFileSync(path.join(fixDir, 'rests.svg'), 'utf8');
  const groups = extractCompositeGroups(svg).map(composite);
  console.log('groups: ' + groups.length);
  for (const g of groups) console.log('  tx ' + g.tx.toFixed(3) + ' ty ' + g.ty.toFixed(3) + ' letters ' + g.letterCount + ' w ' + g.width.toFixed(4) + ' h ' + g.height.toFixed(4));
  const sorted = groups.slice().sort((a, b) => a.tx - b.tx);
  if (sorted.length !== ORDER.length + 1) throw new Error('expected ' + (ORDER.length + 1) + ' glyphs (notehead + ' + ORDER.length + ' rests), got ' + sorted.length + ' — inspect the fixture');
  const head = sorted[0], rests = sorted.slice(1);

  // PIPELINE CHECK: the notehead must equal the ported one
  const ported = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8')).notehead.filled;
  const dw = Math.abs(ported.wSs - head.width), dh = Math.abs(ported.hSs - head.height);
  console.log('notehead pipeline check: ported ' + ported.wSs + '×' + ported.hSs + ' vs fresh ' +
    head.width.toFixed(4) + '×' + head.height.toFixed(4) + ' · path identical: ' + (ported.path === head.path));
  if (dw > 1e-3 || dh > 1e-3) throw new Error('notehead pipeline check FAILED — this extraction is not the pipeline that made glyphs.json');

  // THE MIDDLE LINE, derived from the fixture rather than from the staff
  // lines (LP does not draw them as <line> elements here): every rest's
  // ORIGIN is at the same ty, and the c'' notehead's origin sits exactly 0.5
  // staff space above the middle line on a treble staff (C5 is the space
  // above the B4 middle line). So mid = headTy + 0.5 — and the rests' shared
  // ty must equal it, which is the cross-check. Units are staff spaces: the
  // notehead measured 1.04 wide, exactly the ported ss value.
  const mid = head.ty + 0.5;
  const restTys = [...new Set(rests.map(g => +g.ty.toFixed(4)))];
  console.log('middle line (from the notehead) ' + mid.toFixed(4) + ' · rest origins ' + restTys.join(' '));
  if (restTys.length !== 1 || Math.abs(restTys[0] - mid) > 1e-3)
    throw new Error('rest origins do not sit on the derived middle line — placement convention unclear, inspect the fixture');
  console.log('=> LP anchors every rest ON the middle line (the convention, captured as data)');
  const spacePx = 1;   // the fixture is measured in staff spaces (see above)

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    _meta: {
      source: 'LP fixture tools/fixtures/lp_probes/rests.svg (Rest.font-size = #-2, the locked notehead size)',
      anchor: 'path (0, 0) == glyph bbox top-left; topSs/botSs give the bbox edges relative to the STAFF MIDDLE LINE, +up',
      extractedBy: 'tools/glyph_probe_rests.js (piece #2 oracle modules, read-only)',
      pipelineCheck: 'a c\'\' notehead in the same fixture matched the ported notehead.filled',
      lilypond: r.stderr.match(/GNU LilyPond [\d.]+/) ? r.stderr.match(/GNU LilyPond [\d.]+/)[0] : 'see fixture',
      date: today,
    },
  };
  ORDER.forEach((k, i) => {
    const g = rests[i];
    out[k] = {
      path: g.path, width: g.width, height: g.height,
      // LP's default vertical placement, kept as data: the bbox edges in staff
      // spaces about the middle line (+ up). The renderer positions a rest by
      // these, so LP's own convention travels with the glyph.
      topSs: +((mid - g.bboxTop) / spacePx).toFixed(4),
      botSs: +((mid - g.bboxBot) / spacePx).toFixed(4),
    };
  });
  const outDir = path.join(ROOT, 'notation', 'glyph_sources');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'rest_extra.json'), JSON.stringify(out, null, 1) + '\n');
  fs.rmSync(path.join(fixDir, '_lp_out'), { recursive: true, force: true });
  console.log('wrote notation/glyph_sources/rest_extra.json (' + ORDER.join(', ') + ')');
}
main();
