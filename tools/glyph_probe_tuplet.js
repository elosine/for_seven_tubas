#!/usr/bin/env node
// glyph_probe_tuplet.js — day 23: SHORT-FORM capture (principle 10) of the
// TUPLET BRACKET + NUMERAL, using the composer's OWN LilyPond standard, found
// by surveying piece #2's 809-file .ly corpus (101 with tuplets; the settings
// are unanimous where they appear):
//
//   \override TupletBracket.direction        = #UP          (29/29)
//   \override TupletBracket.bracket-visibility = ##t        (190 uses)
//   \override TupletBracket.padding          = #0.5         ("bracket height")
//   \override TupletNumber.text  = #tuplet-number::calc-fraction-text  (29/32)
//   \override TupletNumber.font-size = #-5                  (32 uses)
//   + the composer's own flatten-tuplet-bracket: force the bracket FLAT by
//     levelling both ends to the higher one. Verbatim from SATP001_pno.ly.
//
// What the corpus could NOT give: measured geometry (no rendered SVG in it
// shows a bracket). This fixture supplies it — bracket thickness, hook length,
// the numeral outlines — with a NOTEHEAD in the same render as the equality
// check that this is the pipeline that made glyphs.json.
//
// Output -> notation/glyph_sources/tuplet_extra.json, merged by port_glyphs.js.
//
//   node tools/glyph_probe_tuplet.js
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
  paper-height = 40\mm
  top-margin = 4\mm
  bottom-margin = 2\mm
  left-margin = 2\mm
  right-margin = 2\mm
  tagline = ##f
  print-page-number = ##f
  page-breaking = #ly:one-line-breaking
}
% the composer's own function, verbatim from lilypond_code/SATP001_pno.ly
#(define (flatten-tuplet-bracket grob)
   (let* ((pos (ly:grob-property grob 'positions))
          (max-pos (max (car pos) (cdr pos))))
     (ly:grob-set-property! grob 'positions (cons max-pos max-pos))))
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override Rest.font-size = #-2
    \override Stem.thickness = #1.3
    % --- the composer's tuplet standard ---
    \override TupletBracket.bracket-visibility = ##t
    \override TupletBracket.direction = #UP
    \override TupletBracket.after-line-breaking = #flatten-tuplet-bracket
    \override TupletBracket.padding = #0.5
    \override TupletNumber.text = #tuplet-number::calc-fraction-text
    \override TupletNumber.font-size = #-5
    c''4 s4
    \tuplet 3/2 { c''16 c''16 r16 } s4
    \bar ""
  }
  \layout { }
}
`;

function composite(c) {
  const xMin = Math.min(...c.letters.map(L => L.worldBBox.minX));
  const xMax = Math.max(...c.letters.map(L => L.worldBBox.maxX));
  const yMin = Math.min(...c.letters.map(L => L.worldBBox.minY));
  const yMax = Math.max(...c.letters.map(L => L.worldBBox.maxY));
  const segments = c.letters.map(L => scalePath(L.d, L.sx, L.sy, (c.tx + L.dx) - xMin, (c.ty + L.dy) - yMin));
  return {
    path: segments.join(' '),
    width: +(xMax - xMin).toFixed(4), height: +(yMax - yMin).toFixed(4),
    tx: c.tx, ty: c.ty, letterCount: c.letters.length, bboxTop: yMin, bboxBot: yMax, bboxLeft: xMin, bboxRight: xMax,
  };
}

function main() {
  const fixDir = path.join(ROOT, 'tools', 'fixtures', 'lp_probes');
  fs.mkdirSync(fixDir, { recursive: true });
  const r = renderLp(LP_SOURCE, { basename: 'tuplet', outDir: path.join(fixDir, '_lp_out') });
  fs.copyFileSync(r.svgPath, path.join(fixDir, 'tuplet.svg'));
  fs.writeFileSync(path.join(fixDir, 'tuplet.ly'), LP_SOURCE);
  const svg = fs.readFileSync(path.join(fixDir, 'tuplet.svg'), 'utf8');

  const groups = extractCompositeGroups(svg).map(composite);
  console.log('glyph groups: ' + groups.length);
  for (const g of groups) console.log('  tx ' + g.tx.toFixed(3) + ' ty ' + g.ty.toFixed(3) + ' letters ' + g.letterCount +
    ' w ' + g.width.toFixed(4) + ' h ' + g.height.toFixed(4));

  const sorted = groups.slice().sort((a, b) => a.tx - b.tx);
  const head = sorted[0];
  // PIPELINE CHECK
  const ported = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8')).notehead.filled;
  console.log('notehead pipeline check: ported ' + ported.wSs + 'x' + ported.hSs + ' vs fresh ' +
    head.width.toFixed(4) + 'x' + head.height.toFixed(4) + ' · path identical: ' + (ported.path === head.path));
  if (Math.abs(ported.wSs - head.width) > 1e-3 || Math.abs(ported.hSs - head.height) > 1e-3)
    throw new Error('notehead pipeline check FAILED — this is not the pipeline that made glyphs.json');
  const mid = head.ty + 0.5;   // c'' sits 0.5 ss above the middle line (see glyph_probe_rests)

  // the BRACKET: LP draws it as path/polyline strokes, not glyphs. Find the
  // horizontal + vertical strokes above the staff.
  const paths = [...svg.matchAll(/<(path|polyline|line|rect)\b([^>]*)>/g)].map(m => ({ tag: m[1], attrs: m[2] }));
  console.log('non-glyph drawing elements: ' + paths.length);
  const strokes = [];
  for (const p of paths) {
    const d = (p.attrs.match(/\sd="([^"]+)"/) || [])[1];
    const pts = (p.attrs.match(/points="([^"]+)"/) || [])[1];
    const sw = parseFloat((p.attrs.match(/stroke-width="([\d.]+)"/) || [])[1] || 'NaN');
    if (d && /^M\s*[-\d.]+\s*[-\d.]+\s*L/.test(d.trim())) {
      const nums = d.match(/-?[\d.]+/g).map(Number);
      strokes.push({ kind: 'path', nums, sw, d });
    } else if (pts) {
      const nums = pts.match(/-?[\d.]+/g).map(Number);
      strokes.push({ kind: 'polyline', nums, sw });
    }
  }
  console.log('line-like strokes: ' + strokes.length);
  for (const s of strokes.slice(0, 20)) console.log('  ' + s.kind + ' sw ' + s.sw + '  ' + s.nums.slice(0, 8).map(n => n.toFixed(3)).join(' '));

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    _meta: {
      source: 'LP fixture tools/fixtures/lp_probes/tuplet.svg — the composer\'s own overrides, surveyed from piece #2 lilypond_code (101 of 809 .ly files carry tuplets; direction #UP 29/29, padding 0.5, calc-fraction-text 29/32, font-size -5, plus the flatten-tuplet-bracket scheme function verbatim)',
      standard: { direction: 'UP', bracketVisibility: true, padding: 0.5, numberText: 'tuplet-number::calc-fraction-text', numberFontSize: -5, flattened: true },
      anchor: 'path (0,0) == glyph bbox top-left; ySs values are relative to the STAFF MIDDLE LINE, +up',
      extractedBy: 'tools/glyph_probe_tuplet.js (piece #2 oracle modules, read-only)',
      pipelineCheck: 'a c\'\' notehead in the same fixture matched the ported notehead.filled',
      lilypond: (r.stderr.match(/GNU LilyPond [\d.]+/) || ['see fixture'])[0],
      date: today,
      middleLineY: mid,
    },
    _rawGroups: groups.map(g => ({ tx: +g.tx.toFixed(4), ty: +g.ty.toFixed(4), w: g.width, h: g.height, letters: g.letterCount,
      topSs: +((mid - g.bboxTop)).toFixed(4), botSs: +((mid - g.bboxBot)).toFixed(4) })),
    _rawStrokes: strokes.map(s => ({ kind: s.kind, sw: s.sw, nums: s.nums.map(n => +n.toFixed(4)) })),
  };
  const outDir = path.join(ROOT, 'notation', 'glyph_sources');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'tuplet_probe_raw.json'), JSON.stringify(out, null, 1) + '\n');
  fs.rmSync(path.join(fixDir, '_lp_out'), { recursive: true, force: true });
  console.log('wrote notation/glyph_sources/tuplet_probe_raw.json (raw groups + strokes for inspection)');
}
main();
