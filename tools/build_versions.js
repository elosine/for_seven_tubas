#!/usr/bin/env node
// build_versions.js — lay several scores end to end in ONE save file, each
// section labelled with a marker, so a development arc is auditioned by
// scrolling rather than by loading files one at a time.
// (composer 2026-08-16: "keep the versions in the same save file")
//
//   node tools/build_versions.js --out scores/densBld03-arc.json --gap 3 \
//     "A · as played, one part=scores/densBld03-take1.json:solo" \
//     "C · packed=scores/densBld03-take1-packed.json" \
//     "D · fortepiano crossfade=scores/densBld03-take1-fp.json" \
//     "E · your copy to edit=scores/densBld03-take1-fp.json"
//
// Each argument is  LABEL=path[:solo]
//   :solo  collapses that section onto part 1 — for showing the raw take as it
//          was played, before any distribution
// Sections keep their own colours; every note is tagged with its section label
// in performanceNotes so a report can partition by section afterwards.
//
// Duplicated sections are fine and are the point: "your version" and "the copy
// I edit" start identical and diverge.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const OUT = flag('out', null);
const GAP = parseFloat(flag('gap', '3'));
const specs = args.filter((a, i) =>
  !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

if (!OUT || !specs.length) {
  console.error('usage: node tools/build_versions.js --out <file> [--gap 3] "LABEL=path[:solo]" ...');
  process.exit(1);
}

// Sections are identified by their MARKER and by the gap between them. Note
// colour therefore carries the information the eye actually needs while working:
// ARTICULATION. (An earlier version painted every note by section, which made a
// fortepiano pass invisible — 21 fp notes in a section of 160, all one colour.)
// These are the colours already in use elsewhere for exactly these things.
const ARTIC_COLOR = {
  staccato: '#607D8B',    // slate — the captured-TAKE colour
  fortepiano: '#8D6E63',  // brown — transform_fp.js's FP3x
  ord: '#2E7D32',         // green — convertSelectedToSurge
  cuivre: '#FF9C54',      // orange — the blast strip's cuivre
};
const MARKER_PALETTE = ['#607D8B', '#B8663F', '#3FA7B8', '#8D6E63', '#7E9B5B', '#9B5B8E'];
let base = null, objs = [], marks = [], id = 1, off = 0;
const summary = [];

specs.forEach((spec, si) => {
  const eq = spec.indexOf('=');
  if (eq < 0) { console.error('bad spec (need LABEL=path): ' + spec); process.exit(1); }
  const label = spec.slice(0, eq);
  let p = spec.slice(eq + 1);
  let solo = false;
  if (/:solo$/.test(p)) { solo = true; p = p.replace(/:solo$/, ''); }

  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  const data = raw.data || raw;
  if (!base) base = JSON.parse(JSON.stringify(data));
  const notes = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
  if (!notes.length) { console.error('no notes in ' + p); process.exit(1); }

  const t0 = Math.min(...notes.map(o => o.startSeconds));

  marks.push({
    id: 'mk-' + (id++), type: 'marker', layer: 0, time: +off.toFixed(3),
    label: label + '  (' + notes.length + ' notes)',
    color: MARKER_PALETTE[si % MARKER_PALETTE.length],
    performanceNotes: path.basename(p), properties: {},
  });

  const techCount = {};
  notes.forEach(o => {
    const c = JSON.parse(JSON.stringify(o));
    c.id = 'wc-' + (id++);
    c.layer = solo ? 0 : o.layer;
    c.startSeconds = +(off + o.startSeconds - t0).toFixed(3);
    c.endSeconds = +(off + o.endSeconds - t0).toFixed(3);
    c.groupId = 'sec-' + si;
    c.performanceNotes = label;
    c.color = ARTIC_COLOR[o.technique] || o.color;
    techCount[o.technique] = (techCount[o.technique] || 0) + 1;
    objs.push(c);
  });

  const end = Math.max(...notes.map(o => o.endSeconds)) - t0;
  summary.push({ label, p, n: notes.length, at: off, len: end, solo, techCount });
  off += end + GAP;
});

base.objects = objs;
base.markers = marks;
base.nextId = id;
base.metadata = Object.assign({}, base.metadata, { modified: new Date().toISOString() });
fs.writeFileSync(OUT, JSON.stringify(base, null, 1));

console.log('=== VERSION ARC → ' + OUT + ' ===');
summary.forEach(s => console.log('  ' + String(s.at.toFixed(2)).padStart(7) + 's  ' +
  s.label.padEnd(34) + String(s.n).padStart(4) + ' notes  ' +
  s.len.toFixed(1) + 's' + (s.solo ? '  [one part]' : '') + '   ' +
  Object.entries(s.techCount).map(([k, v]) => k + ' ' + v).join(', ')));
console.log('  total ' + (off - GAP).toFixed(1) + 's');
console.log('\n  colour = ARTICULATION: ' +
  Object.entries(ARTIC_COLOR).map(([k, v]) => k + ' ' + v).join('  ·  ') +
  '\n  (sections are identified by their markers and the gaps between them)');
