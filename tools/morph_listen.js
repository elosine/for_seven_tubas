#!/usr/bin/env node
// morph_listen.js — lay morph renders end to end in one score for auditioning.
//
// PLAN 2v Phase 4's findings matrix is a LISTENING deliverable, and listening to
// one variant at a time in the panel cannot answer comparative questions ("does
// this still work at 60 s?", "does a 4-voice version survive?"). This builds a
// single score where each question is a labelled section, so the answer is a
// judgement made by scrolling rather than by remembering.
//
// Labels go in `objects`, NOT the `markers` array — see PROJECT_JOURNAL
// Principle 4: renderAll() only iterates objects, so a marker written to
// `markers` survives save/load and is never drawn.
//
//   node tools/morph_listen.js [--out scores/morph-listen-01.json] [--gap 3]

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const OUT = flag('out', 'scores/morph-listen-01.json');
const GAP = parseFloat(flag('gap', '3'));
const TICK = 6;      // repeat the short label every N seconds (a marker is a point)

const P = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bank', 'morph_params.json'), 'utf8'));
const V = P.variants;
const merge = (base, over) => Object.assign({}, base, over,
    { carrier: Object.assign({}, base.carrier, (over || {}).carrier),
      dyn: Object.assign({}, base.dyn, (over || {}).dyn),
      dials: Object.assign({}, base.dials, (over || {}).dials) });

// ---- the questions, in order. Each entry is one labelled section. ----------
const SECTIONS = [
  { q: 'Q1 SPAN', short: 'span 10s',  colour: '#7E57C2',
    note: 'does the gesture survive being fast?',
    renders: [merge(V.C, { carrier: { span: 10, segLen: 4 }, label: 'C @10s' })] },
  { q: 'Q1 SPAN', short: 'span 30s',  colour: '#7E57C2',
    note: 'the middle case',
    renders: [merge(V.C, { carrier: { span: 30, segLen: 7 }, label: 'C @30s' })] },
  { q: 'Q1 SPAN', short: 'span 60s',  colour: '#7E57C2',
    note: 'does it hold, or thin out into separate events?',
    renders: [merge(V.C, { carrier: { span: 60, segLen: 9 }, label: 'C @60s' })] },

  { q: 'Q2 VOICES', short: '8 voices', colour: '#3FA7B8',
    note: 'the full version, as heard',
    renders: [merge(V.C, { carrier: { span: 30, segLen: 7 }, label: 'C 8 voices' })] },
  { q: 'Q2 VOICES', short: '4 voices', colour: '#3FA7B8',
    note: 'half the players — does it still beat?',
    renders: [merge(V.C, { voices: 4, carrier: { span: 30, segLen: 7 }, label: 'C 4 voices' })] },

  { q: 'Q3 CONCURRENT', short: 'C+D at once', colour: '#B8733F',
    note: 'two morphs, 4 players each — two things or mush?',
    renders: [merge(V.C, { voices: 4, lanes: [0, 1, 2, 3], carrier: { span: 40, segLen: 8 }, label: 'C low' }),
              merge(V.D, { voices: 4, lanes: [6, 7, 8, 9], carrier: { span: 40, segLen: 8 }, label: 'D high' })] },

  { q: 'Q4 PULSE', short: 'segment 3s', colour: '#5E8C7A',
    note: 'short segments = fast re-articulation',
    renders: [merge(V.C, { carrier: { span: 30, segLen: 3 }, label: 'C seg 3' })] },
  { q: 'Q4 PULSE', short: 'segment 8s', colour: '#5E8C7A',
    note: 'the current default',
    renders: [merge(V.C, { carrier: { span: 30, segLen: 8 }, label: 'C seg 8' })] },
  { q: 'Q4 PULSE', short: 'segment 15s', colour: '#5E8C7A',
    note: 'long held segments, few re-entries',
    renders: [merge(V.C, { carrier: { span: 30, segLen: 15 }, label: 'C seg 15' })] },
];

const objs = [];
let nid = 1, at = 0;
const rows = [];

SECTIONS.forEach(sec => {
  const results = sec.renders.map(p => M.render(p, { maxVoices: 10 }));
  const span = Math.max(...results.map(r =>
      Math.max(...r.notes.map(n => n.tStart + n.dur))));
  const hard = results.reduce((a, r) => a + r.summary.hard, 0);
  const notes = results.reduce((a, r) => a + r.notes.length, 0);

  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +at.toFixed(3),
    label: sec.q + ' · ' + sec.short + ' — ' + sec.note +
           (hard ? '  ⚠ ' + hard + ' HARD' : ''),
    color: hard ? '#B84A4A' : sec.colour, performanceNotes: '', properties: {} });
  for (let t = TICK; t < span - 1; t += TICK) {
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(at + t).toFixed(3),
      label: sec.short, color: sec.colour, performanceNotes: '', properties: {} });
  }

  results.forEach((r, ri) => {
    const placed = M.toScoreObjects(r, at, {
      groupId: 'grp-listen-' + rows.length + '-' + ri,
      startId: nid, label: sec.renders[ri].label, color: sec.colour,
    });
    nid += placed.length + 1;
    objs.push(...placed);
  });

  rows.push({ q: sec.q, short: sec.short, at: at, span: span, notes: notes, hard: hard,
              voices: results.map(r => r.meta.voices).join('+') });
  at += span + GAP;
});

const score = {
  version: 1, layoutVersion: 2,
  tracks: [], assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: {}, nextId: nid + 1,
  viewport: { scrollX: 0, zoom: 1 },
};
fs.writeFileSync(OUT, JSON.stringify(score));

console.log('=== MORPH LISTENING SCORE ===\n');
console.log('     at      question        variant        voices  notes  hard');
rows.forEach(r => console.log(
  '  ' + (r.at.toFixed(1) + 's').padStart(7) + '   ' + r.q.padEnd(14) +
  r.short.padEnd(15) + r.voices.padStart(6) + String(r.notes).padStart(7) +
  String(r.hard).padStart(6)));
console.log('\n  total ' + (at - GAP).toFixed(1) + 's (' + ((at - GAP) / 60).toFixed(1) +
            ' min)   wrote ' + OUT);
