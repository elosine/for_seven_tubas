#!/usr/bin/env node
// port_glyphs.js — B3: port the slice-1 glyph set from piece #2's
// LP-extracted library into notation/lib/glyphs.json, with provenance on
// every entry (plan DB-3). The source repo is READ-ONLY; re-run to refresh.
//
// Path convention (inherited): coordinates in STAFF-SPACE, bbox top-left at
// (0,0), y down, fill-only. One scale by ssPx renders them.
//
// Deliberately NOT ported (recorded, plan DB-3 / spec §7): rest glyphs (the
// IR has no rest nodes — rests are gaps, and on the strip the gap IS the
// rest; glyphs enter when rest nodes do) · dynamics glyphs (marks are
// authored-only, amendment 1; v0 renders them as text) · accidental glyphs
// beyond sharp/flat/natural (add when material needs them).

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P2 = 'C:/Users/jwloy/GitHub/composition_for_two_pianos_and_two_percussion/tools/notation_studio/engine';

const read = f => JSON.parse(fs.readFileSync(path.join(P2, f), 'utf8'));
const nh = read('glyphs/notehead_paths.json');
const fl = read('glyphs/flag_paths.json');
const cb = read('glyphs/clef_bass_paths.json');
const ac = read('glyphs/accidental_paths.json');
const dims = read('dimensions_table.json');

const today = new Date().toISOString().slice(0, 10);
const prov = file => ({ source: 'composition_for_two_pianos_and_two_percussion/tools/notation_studio/engine/' + file, ported: today, by: 'tools/port_glyphs.js' });

const nf = dims.notehead.filled;
const centerY = nf.height / 2;

const accidentals = {};
for (const key of ['sharp', 'flat', 'natural']) {
  if (ac[key]) {
    const a = ac[key];
    accidentals[key] = { path: a.path, wSs: a.width, hSs: a.height, _provenance: prov('glyphs/accidental_paths.json') };
    // vertical registration: LP accidentals center on the notehead's staff
    // position; keep the source's origin/anchor if present.
    if (a.origin) accidentals[key].originYSs = a.origin.y;
    if (a.anchors) accidentals[key].anchors = a.anchors;
  }
}
// The flat is vertically ASYMMETRIC: its BULB, not its bbox center, sits on
// the note's line/space (review measurement: bulb center ~x 0.235, y 0.88 of
// the glyph box). Sharp/natural are symmetric — bbox center is correct.
if (accidentals.flat) {
  accidentals.flat.anchors = Object.assign({}, accidentals.flat.anchors, {
    noteY: { x: 0.235, y: 0.88 },
  });
  accidentals.flat._provenance.note = 'noteY anchor = bulb center, measured in phase-B engraving review 2026-08-19';
}

const out = {
  _provenance: {
    note: 'Slice-1 glyph set ported from piece #2 (LP/Emmentaler extractions + measured standards). Paths in STAFF-SPACE, bbox top-left origin, y down, fill-only. Regenerate with tools/port_glyphs.js.',
    ported: today,
  },
  notehead: {
    filled: {
      path: nh.filled.path, wSs: nh.filled.width, hSs: nh.filled.height,
      anchors: {
        center: { x: nh.filled.width / 2, y: centerY },
        // piece #2 stores stem-attach y RELATIVE TO CENTER; converted here
        // to box-local top-origin (assembly-tested in tools/test_stamps.js)
        stemAttachUp: { x: nf.stemAttachUp.x, y: centerY + nf.stemAttachUp.y },
        stemAttachDown: { x: nf.stemAttachDown.x, y: centerY + nf.stemAttachDown.y },
      },
      _provenance: prov('glyphs/notehead_paths.json + dimensions_table.json notehead.filled'),
    },
  },
  flag: {
    up8: { path: fl['8up'].path, wSs: fl['8up'].width, hSs: fl['8up'].height, anchors: { stemTip: fl['8up'].anchor }, _provenance: prov('glyphs/flag_paths.json 8up') },
    down8: { path: fl['8down'].path, wSs: fl['8down'].width, hSs: fl['8down'].height, anchors: { stemTip: fl['8down'].anchor }, _provenance: prov('glyphs/flag_paths.json 8down') },
  },
  clef: {
    bass: {
      path: cb.bass.path, wSs: cb.bass.width, hSs: cb.bass.height,
      anchors: { fLine: cb.bass.anchors.fLine },
      _provenance: prov('glyphs/clef_bass_paths.json (fLine = line the dots straddle = F3)'),
    },
  },
  accidental: accidentals,
  standards: {
    staff: { lineThickness: dims.staff.lineThickness, lineCount: dims.staff.lineCount, interLineSpace: dims.staff.interLineSpace },
    ledgerLine: { thickness: dims.ledgerLine.thickness, lengthFraction: dims.ledgerLine.lengthFraction },
    stem: { thickness: dims.stem.thickness, defaultLength: 3.5, minLength: dims.stem.minLength },
    beam: { thickness: dims.beam.thickness, stackStep: dims.beam.stackStep, gap: dims.beam.gap },
    staccatoDot: { diameter: 0.4, gapFromNotehead: 0.5, _note: 'procedural (piece #2 had no staccato script); LP-typical proportions' },
    _provenance: prov('dimensions_table.json (staff/ledgerLine/stem/beam rows; stem.defaultLength 3.5 ss = conventional one-octave stem, piece #2 default 10 was cell-motive-specific)'),
  },
};

const outFile = path.join(ROOT, 'notation', 'lib', 'glyphs.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('wrote ' + outFile + ' — noteheads, 8th flags, bass clef, ' + Object.keys(accidentals).length + ' accidentals, standards');
