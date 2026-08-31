#!/usr/bin/env node
// gen_demo_heldmax_midi.js — ONE MIDI file: ten 32-second held dyads at each
// pair's MEASURED maximum beating (day 40, demo-videos option b — composer:
// "b, the samples loop so 30 sec is fine").
//
//   node tools/gen_demo_heldmax_midi.js     → notation/audio/demo-heldmax.mid
//
// Timeline (60 BPM = 1 beat/s, matching the demo session):
//   BLOOM dyads        pair k at t = 10 + k*40, dur 32 s  (k = 0..4)
//   CONVERGENCE dyads  pair k at t = 210 + k*40, dur 32 s
// Bloom = the pair's unison base with the bends the score reaches at its own
// beating peak (measured from morphBend). Convergence = the two written notes
// plain (the full split; max beating is the section start). ord = channel 1;
// bends use the rack's MEASURED 199-cent range via tools/midi_out.js.
const fs = require('fs');
const path = require('path');
const { writeMidi } = require('./midi_out');
const ROOT = path.join(__dirname, '..');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', 'piece-final-draft-001.json'), 'utf8'));
const morphs = (save.objects || []).filter(o => o.type === 'waveCurve' && o.morphBend && o.layer <= 9);

const PAIRS = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]];
const BLOOM = [141, 259], CONV = [259, 386];
const PEAKS = [179, 186, 188, 176, 182];          // the census peak instants

const trajFor = (part, lo, hi) => {
  const spans = morphs.filter(o => o.layer === part && o.startSeconds >= lo - 1 && o.startSeconds < hi)
    .sort((a, b) => a.startSeconds - b.startSeconds);
  return t => {
    let best = null;
    for (const o of spans) {
      if (t >= o.startSeconds - 1e-9 && t <= o.endSeconds + 1e-9) { best = o; break; }
      if (o.startSeconds <= t) best = o;
    }
    if (!best) best = spans[0];
    const rel = Math.min(Math.max(t - best.startSeconds, 0), best.endSeconds - best.startSeconds);
    const nb = best.morphBend;
    let bend = nb[nb.length - 1][1];
    for (let i = 0; i < nb.length - 1; i++)
      if (rel >= nb[i][0] && rel <= nb[i + 1][0]) {
        const f = (rel - nb[i][0]) / Math.max(1e-9, nb[i + 1][0] - nb[i][0]);
        bend = nb[i][1] + (nb[i + 1][1] - nb[i][1]) * f; break;
      }
    if (rel <= nb[0][0]) bend = nb[0][1];
    return { note: best.sonifyNote, cents: bend };
  };
};
const baseOf = (part, lo, hi) => morphs.filter(o => o.layer === part && o.startSeconds >= lo - 1 && o.startSeconds < hi)
  .sort((a, b) => a.startSeconds - b.startSeconds)[0].sonifyNote;

const DUR = 32, VEL = 95;
const tracks = Array.from({ length: 10 }, (_, p) => ({ name: 'Tuba ' + (p + 1), channel: 1, notes: [], bends: [] }));
const map = [];

PAIRS.forEach(([a, b], k) => {
  // ---- BLOOM: unison base ± the score's own peak bends
  const t0 = 10 + k * 40;
  const A = trajFor(a, ...BLOOM)(PEAKS[k]);
  const B = trajFor(b, ...BLOOM)(PEAKS[k]);
  for (const [p, x] of [[a, A], [b, B]]) {
    tracks[p].bends.push({ t: t0 - 0.1, cents: x.cents }, { t: t0 + DUR + 0.2, cents: 0 });
    tracks[p].notes.push({ t: t0, pitch: x.note, dur: DUR, vel: VEL });
  }
  map.push('BLOOM  T' + (a + 1) + '+T' + (b + 1) + '  t=' + t0 + '-' + (t0 + DUR) +
    '  notes ' + A.note + (A.cents >= 0 ? '+' : '') + A.cents.toFixed(1) + 'c / ' +
    B.note + (B.cents >= 0 ? '+' : '') + B.cents.toFixed(1) + 'c');
  // ---- CONVERGENCE: the two written notes plain (the full split)
  const t1 = 210 + k * 40;
  const na = baseOf(a, ...CONV), nb = baseOf(b, ...CONV);
  tracks[a].notes.push({ t: t1, pitch: na, dur: DUR, vel: VEL });
  tracks[b].notes.push({ t: t1, pitch: nb, dur: DUR, vel: VEL });
  map.push('CONV   T' + (a + 1) + '+T' + (b + 1) + '  t=' + t1 + '-' + (t1 + DUR) + '  notes ' + na + ' / ' + nb);
});

const res = writeMidi('notation/audio/demo-heldmax.mid', { bpm: 60, tracks });
console.log('wrote ' + path.relative(ROOT, res.file) + ' — ' + res.tracks + ' tracks · ' + res.notes + ' notes · ' + res.seconds + ' s @ 60 BPM');
map.forEach(l => console.log('  ' + l));
