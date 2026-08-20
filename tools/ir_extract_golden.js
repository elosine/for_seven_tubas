#!/usr/bin/env node
// ir_extract_golden.js — the A3 golden test (Phase B1 gate, plan DB-8).
// The extractor, run over the hand-worked A3 window, must reproduce
// notation/ir/trance-bar-01.ir.json:
//   · EVENTS exactly (id, onset, duration, pitch incl. spelling, technique)
//   · CHUNKS equivalently (id, part, span, class, strategy, tempo numbers
//     to 1e-6; labels excluded — prose, never load-bearing)
//   · metric grids exactly
//   · groups as a SUPERSET (every hand group has a machine group with the
//     same event set; ids excluded) · devices by (kind, mode, at)
// Exit 0 on match; exit 1 with a diff list.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Extract = require(path.join(ROOT, 'notation', 'lib', 'extract_core.js'));

const golden = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', 'trance-bar-01.ir.json'), 'utf8'));
const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', golden.source.score + '.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const sampleLengths = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank', 'sample_lengths.json'), 'utf8'));

const { doc } = Extract.extract(score, {
  scoreName: golden.source.score,
  window: golden.source.window,
  parts: golden.source.parts,
  id: 'golden-check',
  registry, sampleLengths,
  date: 'golden', toolName: 'golden',
});

const diffs = [];
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9);

// events
const mine = new Map(doc.events.map(e => [e.id, e]));
for (const g of golden.events) {
  const m = mine.get(g.id);
  if (!m) { diffs.push(`event ${g.id}: missing from extraction`); continue; }
  if (!near(m.onset, g.onset)) diffs.push(`${g.id}: onset ${m.onset} != ${g.onset}`);
  if (!near(m.duration, g.duration, 1e-6)) diffs.push(`${g.id}: duration ${m.duration} != ${g.duration}`);
  if (m.pitch.midi !== g.pitch.midi) diffs.push(`${g.id}: midi ${m.pitch.midi} != ${g.pitch.midi}`);
  const gs = g.pitch.spelled, ms = m.pitch.spelled;
  if (ms.step !== gs.step || ms.alter !== gs.alter || ms.octave !== gs.octave)
    diffs.push(`${g.id}: spelled ${ms.step}${ms.alter}/${ms.octave} != ${gs.step}${gs.alter}/${gs.octave}`);
  if (m.technique !== g.technique) diffs.push(`${g.id}: technique ${m.technique} != ${g.technique}`);
  const gg = g.metric && g.metric.grid.join(','), mg = m.metric && m.metric.grid.join(',');
  if (gg !== mg) diffs.push(`${g.id}: grid [${mg}] != [${gg}]`);
  if (g.metric && m.metric && g.metric.chunk !== m.metric.chunk) diffs.push(`${g.id}: metric.chunk ${m.metric.chunk} != ${g.metric.chunk}`);
}
if (doc.events.length !== golden.events.length)
  diffs.push(`event count ${doc.events.length} != ${golden.events.length}`);

// chunks
const mchunks = new Map(doc.chunks.map(c => [c.id, c]));
for (const g of golden.chunks) {
  const m = mchunks.get(g.id);
  if (!m) { diffs.push(`chunk ${g.id}: missing from extraction (got ${doc.chunks.map(c => c.id).join(', ')})`); continue; }
  if (m.part !== g.part) diffs.push(`${g.id}: part ${m.part} != ${g.part}`);
  if (!near(m.span[0], g.span[0]) || !near(m.span[1], g.span[1])) diffs.push(`${g.id}: span [${m.span}] != [${g.span}]`);
  if (m.class !== g.class) diffs.push(`${g.id}: class ${m.class} != ${g.class}`);
  if (m.strategy !== g.strategy) diffs.push(`${g.id}: strategy ${m.strategy} != ${g.strategy}`);
  if (!!m.tempo !== !!g.tempo) diffs.push(`${g.id}: tempo presence mismatch`);
  if (m.tempo && g.tempo) {
    for (const k of ['anchorSeconds', 'unitSeconds', 'beatSeconds']) {
      if (!near(m.tempo[k], g.tempo[k], 1e-6)) diffs.push(`${g.id}: tempo.${k} ${m.tempo[k]} != ${g.tempo[k]}`);
    }
    if (m.tempo.subdivision !== g.tempo.subdivision) diffs.push(`${g.id}: subdivision ${m.tempo.subdivision} != ${g.tempo.subdivision}`);
    if (!near(m.tempo.maxErrSeconds, g.tempo.maxErrSeconds, 1e-6)) diffs.push(`${g.id}: maxErrSeconds ${m.tempo.maxErrSeconds} != ${g.tempo.maxErrSeconds}`);
  }
  if (m.events.join(',') !== g.events.join(',')) diffs.push(`${g.id}: events [${m.events}] != [${g.events}]`);
  for (const gg of g.groups || []) {
    const want = gg.events.join(',');
    if (!(m.groups || []).some(mg => mg.events.join(',') === want && mg.kind === gg.kind))
      diffs.push(`${g.id}: hand group over [${want}] has no machine counterpart`);
  }
  for (const gd of g.devices || []) {
    if (!(m.devices || []).some(md => md.kind === gd.kind && md.mode === gd.mode && near(md.at, gd.at)))
      diffs.push(`${g.id}: hand device ${gd.kind}/${gd.mode}@${gd.at} has no machine counterpart`);
  }
}
if (doc.chunks.length !== golden.chunks.length)
  diffs.push(`chunk count ${doc.chunks.length} != ${golden.chunks.length}`);

// ---- duplicate-onset resilience (phase-review must-fix, proven red before
// the fix): a doubled onset inside a stream must NOT demote the run ----
{
  const objs = [];
  for (let n = 0; n < 10; n++) objs.push({ id: 'wq-' + n, type: 'waveCurve', layer: 0, startSeconds: n * 0.5, endSeconds: n * 0.5 + 0.2, sonifyNote: 45, technique: 'staccato', nodes: [{}, {}] });
  objs.push({ id: 'wq-dup', type: 'waveCurve', layer: 0, startSeconds: 2.0, endSeconds: 2.2, sonifyNote: 57, technique: 'staccato', nodes: [{}, {}] });
  const { doc: d2 } = Extract.extract({ objects: objs }, {
    scoreName: 'synthetic', window: [0, 6], parts: [0], id: 'dup-check',
    registry, sampleLengths, date: 'x', toolName: 'golden',
  });
  const streams = d2.chunks.filter(c => c.class === 'trance-stream');
  const gridded = d2.events.filter(e => e.metric).length;
  if (streams.length !== 1 || gridded !== 10) {
    diffs.push('duplicate-onset case: expected 1 stream chunk with 10 gridded events, got ' +
      streams.length + ' streams / ' + gridded + ' gridded (' + d2.chunks.length + ' chunks)');
  }
}

if (diffs.length) {
  console.error(`GOLDEN RED — ${diffs.length} difference(s) vs trance-bar-01:`);
  for (const d of diffs) console.error('  · ' + d);
  process.exit(1);
}
console.log(`GOLDEN GREEN: extraction reproduces trance-bar-01 (${golden.events.length} events, ${golden.chunks.length} chunks) + duplicate-onset resilience`);
