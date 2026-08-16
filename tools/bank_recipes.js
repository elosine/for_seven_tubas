#!/usr/bin/env node
// bank_recipes.js — capture the auditioned morph settings into a keeper library.
//
// Generated from bank/morph_params.json (so the parameters cannot drift from
// what was actually heard) plus the composer's verdicts, which live here because
// only a person can supply them.
//
// This is the FIRST INSTANCE of the MODEL half described in
// docs/plans/MODEL_AND_ACTUAL.md — a model is "a point plus the directions worth
// travelling from it, and how far". So each entry carries not only the settings
// that were blessed, but the DIAL EXPLORATIONS around them (span, voices,
// segment) with what each one cost, measured by ear in morph-listen-01. That is
// the raw material for collapsing parameters into single dials later.
//
//   node tools/bank_recipes.js

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');

const BANK = path.join(__dirname, '..', 'bank');
const P = JSON.parse(fs.readFileSync(path.join(BANK, 'morph_params.json'), 'utf8'));

// Composer verdicts, 2026-08-16. Their words; the AI supplies no adjectives.
const VERDICT = {
  A: { rating: 'keeper',
       words: 'Very nice. There were some very interesting parts that might have something to do with close intervals, like approaching unison. Lots of nice acoustic beating in there, and potentially at the same time volume changes. It did sound like acoustic beating and swelling, which is nice.',
       character: 'Held sonority, nothing moving but internal balance. The beating is between UPPER PARTIALS — the chord itself has no close intervals — so beating is available without writing unisons.' },
  B: { rating: 'useful, least interesting',
       words: 'It sounds exactly like a held sonority with players shifting different techniques within it. It sounds more like just a collection of different techniques. Useful, but not as interesting.',
       character: 'Technique migration. Reads as a sequence of colours rather than one sonority changing. Since the audition, technique changes ENTER under a long deep dynamic ramp (composer: "start with the effect and ramp into the full effect") — that change has not itself been re-heard.' },
  C: { rating: 'keeper',
       words: 'Very interesting. Sounds industrial and resembles many experiments I have done with strings and beating tones. Familiar terrain, like some of the acoustic pieces by Alvin Lucier.',
       character: 'Unison pairs splitting apart. Beating grows from zero; faster in the higher pairs (2.6 / 3.5 / 4.6 / 6.2 Hz at full separation), so the texture opens upward.' },
  D: { rating: 'keeper',
       words: 'Very interesting.',
       character: 'Whole-tone pairs closing to exact unison. The reverse gesture: beating slows to 0 Hz, interference resolving into fusion.' },
  E: { rating: 'interesting',
       words: 'Interesting and similar. It sounds like either one or several tubas are re-articulating at a relatively big dynamic, and those sound like pulses. They not only pulse the volume, they also pulse the beating, the visceralness.',
       character: 'Voicing opens outward, 12 to 20 semitones. The re-articulations read as a rhythmic layer on top of the pitch change.' },
  F: { rating: 'interesting',
       words: 'Interesting and similar.',
       character: 'Chord focuses onto the harmonics of F. Each voice moves only 0-49 cents and the total span barely changes (28 to 27 st), so it reads as the same chord coming into focus. VERIFIED BY MEASUREMENT: every voice lands within 0.4 cents of its target partial.' },
};

// The dial explorations from morph-listen-01, with what each cost by ear. These
// are the "recommended morphs and their boundaries" — the beginnings of a
// one-dial collapse.
const DIALS = [
  { dial: 'span', unit: 's', tested: [10, 30, 60], working: [10, 60], sweet: 30,
    finding: 'Holds at every span tested; no lower or upper failure found. 30 s read as "much more dramatic" than 10 s, so span changes the WEIGHT of the gesture, not just its length. At 60 s: "a more drawn-out version of the morph — re-articulations are not prioritised to the ear, under the surface." No density floor is needed.' },
  { dial: 'voices', unit: 'players', tested: [8, 4], working: [4, 10], sweet: 8,
    finding: 'Reduction is lossy in DETAIL, not in identity: "still interesting, less detailed and less subtle, and it is really the beating that carries it — maybe like an 8-bit versus 16-bit comparison." Use full voicing where the morph is the subject, reduced where it is a layer. Reduction keeps whole unison pairs, never fragments (half a pair does not beat).' },
  { dial: 'segLen', unit: 's', tested: [3, 8, 15], working: [3, 8], sweet: 7,
    finding: 'Re-articulation is one of the CARRIERS of the morph\'s audibility, not just a breathing necessity: at 15 s "perhaps it loses some of the detail — maybe the re-articulation helps with the change as well." Long segments are not smoother, they are less informative. At 3 s the same mechanism reads two ways depending on density: "when more parts are in, or there is more volume, it is more like a PULSE; when it is more sparse it is more like RE-ARTICULATION."' },
  { dial: 'concurrency', unit: 'morphs', tested: [1, 2], working: [1, 2], sweet: 1,
    finding: 'Two morphs on separate players do NOT read as two entities: "doesn\'t sound like two entities, but very interesting still and quite complex, both in terms of the overall sound and in the detail of the morphing." So concurrency is a way to build ONE richer sonority, not two audible voices. If two DISTINGUISHABLE morphs are ever wanted that is a separate problem (register, timing offset, contrasting technique).' },
];

const recipes = {};
['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
  const v = P.variants[k];
  if (!v) return;
  const r = M.render(v, { maxVoices: 10 });
  recipes[v.label.split('—')[0].trim().split('(')[0].trim() || k] = {
    slot: k,
    label: v.label,
    model: v.model,
    rating: (VERDICT[k] || {}).rating || null,
    composerVerdict: (VERDICT[k] || {}).words || null,
    character: (VERDICT[k] || {}).character || null,
    params: { model: v.model, source: v.source, target: v.target || null,
              dials: v.dials, carrier: v.carrier, dyn: v.dyn, seed: v.seed },
    measured: { notes: r.notes.length, voices: r.meta.voices, span: r.meta.span,
                hard: r.summary.hard, flags: r.summary.flags },
  };
});

const out = {
  _comment: 'Auditioned morph settings, kept for reuse. Generated by tools/bank_recipes.js from bank/morph_params.json plus the composer verdicts recorded in that tool. This is the first instance of the MODEL half of docs/plans/MODEL_AND_ACTUAL.md: each entry is a blessed point in parameter space, and `dials` records the directions worth travelling from it and what each costs.',
  captured: new Date().toISOString().slice(0, 10),
  auditionedFrom: ['panel variants A-F', 'scores/morph-listen-01.json'],
  engineConstants: {
    bendRangeSt: M.MEASURED.BEND_RANGE_ST,
    bendPrearmS: M.MEASURED.BEND_PREARM_S,
    resetGapS: M.MEASURED.RESET_GAP_S,
    glissCleanCents: M.MEASURED.GLISS_CLEAN_CENTS,
    note: 'Measured on SI2 tuba 2026-08-16, docs/MORPH_FINDINGS.md. Pitch chain verified end to end: spectral targets land within 0.4 cents, fan waypoints within 1.0 cent including re-key seams, and the composer reports no audible seam on a continuous re-keyed glissando.',
  },
  dials: DIALS,
  recipes: recipes,
};
fs.writeFileSync(path.join(BANK, 'morph_recipes.json'), JSON.stringify(out, null, 2));

console.log('=== MORPH RECIPE LIBRARY ===\n');
console.log('  ' + 'recipe'.padEnd(34) + 'model'.padEnd(6) + 'rating'.padEnd(24) + 'measured');
Object.keys(recipes).forEach(name => {
  const r = recipes[name];
  console.log('  ' + name.slice(0, 33).padEnd(34) + String(r.model).padEnd(6) +
    String(r.rating).padEnd(24) + r.measured.voices + ' voices, ' +
    r.measured.notes + ' notes, ' + r.measured.span + 's');
});
console.log('\n  dial boundaries captured: ' + DIALS.map(d => d.dial).join(', '));
console.log('  wrote bank/morph_recipes.json');
