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
const readLocal = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'glyph_sources', f), 'utf8'));
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
// day 22 (nh-unit): the full seven — quartertone pairs included (SI2 tuba
// quartertones are piece material; piece #2 measured all seven at D.6)
for (const key of ['sharp', 'flat', 'natural', 'quarterSharp', 'quarterFlat', 'threeQuarterSharp', 'threeQuarterFlat']) {
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
// flat-family quartertones share the flat's vertical asymmetry (piece #2
// D.6: topExtent 0.89 / bottomExtent 0.364 identical to flat) — same noteY
// y; x = bulb center (quarterFlat = mirrored single bulb, threeQuarterFlat
// = double bulb, right bulb registers on the note; x PROVISIONAL, polish-eye)
if (accidentals.quarterFlat) accidentals.quarterFlat.anchors = Object.assign({}, accidentals.quarterFlat.anchors, { noteY: { x: 0.235, y: 0.88 } });
if (accidentals.threeQuarterFlat) accidentals.threeQuarterFlat.anchors = Object.assign({}, accidentals.threeQuarterFlat.anchors, { noteY: { x: 0.561, y: 0.88 } });

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
    // day 22 (nh-unit, the surge device element 3): the OPEN head — piece
    // #2's halfNote (D.3b locked; wider than filled, 1.1072 vs 1.04, same
    // height). Used stemless as the surge cue head; stem anchors carried
    // anyway so a stemmed use later costs nothing.
    open: (() => {
      const no = dims.notehead.halfNote;
      const cy = no.height / 2;
      return {
        path: nh.halfNote.path, wSs: no.width, hSs: no.height,
        anchors: {
          center: { x: no.width / 2, y: cy },
          stemAttachUp: { x: no.stemAttachUp.x, y: cy + no.stemAttachUp.y },
          stemAttachDown: { x: no.stemAttachDown.x, y: cy + no.stemAttachDown.y },
        },
        _provenance: prov('glyphs/notehead_paths.json halfNote + dimensions_table.json notehead.halfNote (D.3b)'),
      };
    })(),
  },
  // day 22 (nh-unit): ottava labels — piece #2's baked project-font glyphs
  // (Crimson Pro Light Italic outlined to paths, session 57); 8va/8vb only
  // for now, 15ma/22ma exist at the source when needed
  // day 22 (dynamic element): the ENGRAVED dynamic letters — Emmentaler at
  // piece #2's locked font-size -8.5 (session 49: the SQ1-baseline corpus
  // decision). Slice-1's deliberate no-port is superseded: the surge device
  // renders marks as glyphs, not text. Vertical registration: center-aligned
  // on the dynamics band (baseline metadata not in the source; p-vs-f
  // optical baseline = polish-eye item).
  dynamic: (() => {
    const dp = read('glyphs/dynamic_paths.json');
    const out2 = {};
    for (const k of Object.keys(dp)) {
      if (k.startsWith('_')) continue;
      out2[k] = { path: dp[k].path, wSs: dp[k].width, hSs: dp[k].height, _provenance: prov('glyphs/dynamic_paths.json ' + k + ' (dims.dynamic, font-size -8.5 locked session 49)') };
    }
    // day 22 (second note, wc-23 = sfzp): THIS piece's additions, captured
    // by tools/glyph_probe_dyn_extra.js through the same LP pipeline at the
    // same locked size (sfz re-extracted as the equality check) — merged
    // here so a re-port never drops them.
    const extra = readLocal('dynamic_extra.json');
    for (const k of Object.keys(extra)) {
      if (k.startsWith('_')) continue;
      out2[k] = { path: extra[k].path, wSs: extra[k].width, hSs: extra[k].height, _provenance: { source: extra._meta.source, extracted: extra._meta.date, by: extra._meta.extractedBy } };
    }
    return out2;
  })(),
  // day 22: ARTICULATIONS for the column standard's articulation slot —
  // accent + marcato, same probe (stock Script size). Placement above/below
  // is the layout's business, not the glyph's.
  articulation: (() => {
    const sc = readLocal('script_extra.json');
    const out3 = {};
    for (const k of Object.keys(sc)) {
      if (k.startsWith('_')) continue;
      out3[k] = { path: sc[k].path, wSs: sc[k].width, hSs: sc[k].height, _provenance: { source: sc._meta.source, extracted: sc._meta.date, by: sc._meta.extractedBy } };
    }
    return out3;
  })(),
  ottavaText: (() => {
    const tx = read('glyphs/text_paths.json');
    const one = (k) => ({ path: tx[k].path, wSs: tx[k].width, hSs: tx[k].height, _provenance: prov('glyphs/text_paths.json ' + k) });
    return { va8: one('8va'), vb8: one('8vb'), ma15: one('15ma'), mb15: one('15mb') };
  })(),
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
    // day 22 (nh-unit): the placement LAWS from piece #2, ported with their
    // locked provenance — accidental gap (D.6), accidental-column packing
    // (D.8.2), chord displacement threshold (D.8.1), ottava geometry +
    // engage rule (sessions 57/77 + staffRouter).
    accidental: { gapToNotehead: 0.1, _provenance: prov('dimensions_table.json accidental (D.6 locked: LP 0.35 tightened to 0.10 by eye probe)') },
    accidentalColumn: { minLateralGap: 0.1, fullSlotWidth: 0.75, verticalCollisionTolerance: 0.05, _provenance: prov('dimensions_table.json accidentalColumn (D.8.2 locked: right-to-left packing; full slot when y-bboxes collide, tight gap when clear)') },
    noteColumn: { displaceThresholdSteps: 1, _provenance: prov('dimensions_table.json noteColumn (D.8.1 locked: displace when |staffPosDelta| <= 1, bottom-up, alternate sides, wider intervals reset)') },
    ottava: {
      lineThicknessSs: 0.0671, hookLengthSs: 0.8, dashLengthSs: 0.3, gapBetweenDashesSs: 0.7,
      minDashCount: 2, minBracketSpanSs: 1.3671, textGapBeforeLineSs: 0.1, lineAttachAboveBaselineSs: 0.3249,
      ledgerLineThreshold: 3, standardGapSs: 0.45,
      _provenance: prov('dimensions_table.json ottava + staffRouter (sessions 57/77 locked: engage smallest variant bringing written notes within 3 ledger lines; bracket outer VISIBLE edge sits standardGapSs from the reference edge, so lineY = ref -/+ (standardGapSs + hookLengthSs); text baseline at lineY + lineAttachAboveBaselineSs)'),
    },
    _provenance: prov('dimensions_table.json (staff/ledgerLine/stem/beam rows; stem.defaultLength 3.5 ss = conventional one-octave stem, piece #2 default 10 was cell-motive-specific)'),
  },
};

const outFile = path.join(ROOT, 'notation', 'lib', 'glyphs.json');
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('wrote ' + outFile + ' — noteheads, 8th flags, bass clef, ' + Object.keys(accidentals).length + ' accidentals, standards');
