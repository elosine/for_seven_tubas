#!/usr/bin/env node
// test_multitempo.js — unit tests over the MULTITEMPO RIG's engine (PLAN 2ac).
//
//   node tools/test_multitempo.js
//
// What a test CAN judge here is whether the ratios become the right onsets:
// the set reduces, the cycle closes, every stream realigns at C, each stream
// stays on its own player, a sonority keeps its own articulation, and a
// one-shot keeps its measured length. That is the cheap half.
//
// What it cannot judge is whether four tempi together sound like anything worth
// keeping. That is the composer's, in a window where Web MIDI is allowed, and
// it is the entire point of the rig.
//
// THE GATE, and why the mutation block at the bottom exists: three of the rules
// here (reduce first · chunk low->high · lane = stream index) produce output
// that is COMPLETELY PLAUSIBLE when broken — a wrong-but-regular pulse still
// sounds like a pulse. Each is therefore deliberately broken at the end and the
// assertions re-run, to prove they discriminate rather than merely pass.

const fs = require('fs');
const path = require('path');
const MT = require('../score/public/multitempo.js');
const PS = require('../score/public/pulse_seq.js');

const ROOT = path.join(__dirname, '..');
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const PAL_FILE = rd('bank/pulse_palette.json');
const TAX = rd('bank/blast_taxonomy.json');
const SL = rd('bank/sample_lengths.json');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
    if (cond) { pass++; return; }
    fail++; fails.push(name + (detail ? '  -> ' + detail : ''));
}
function section(s) { console.log('\n--- ' + s + ' ---'); }
const J = v => JSON.stringify(v);

// Composer.techLength's rule, mirrored from test_pulse.js so the 2n law is
// exercised with the same numbers the panel will see.
const FIXED = { fortepiano: 1.67, staccato: 0.45, cuivre: 1.17 };
function techLength(tech, pitch) {
    const fb = FIXED[tech];
    if (fb === undefined) return null;
    const tbl = SL[tech];
    if (tbl && tbl[pitch] != null) return tbl[pitch];
    if (tbl) {
        const keys = Object.keys(tbl).map(Number);
        if (keys.length) {
            const near = keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a);
            return tbl[near];
        }
    }
    return fb;
}
const PAL = PS.resolvePalette(PAL_FILE, TAX);
const OPTS = { techLength: techLength };
const onsetsOf = (b, voice) => b.notes.filter(n => n.voice === voice)
    .map(n => n.tStart).filter((v, i, a) => a.indexOf(v) === i).sort((x, y) => x - y);

// ------------------------------------------------------------------ reduction
section('ratio reduction');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '2:4:6', mode: 'unison' }, PAL, OPTS);
    ok('2:4:6 reduces to 1:2:3', J(b.meta.reduced) === J([1, 2, 3]), J(b.meta.reduced));
    ok('reducedText reads 1:2:3', b.meta.reducedText === '1:2:3', b.meta.reducedText);
    ok('reduced attack counts follow', J(b.meta.perStream) === J([1, 2, 3]), J(b.meta.perStream));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '15:16', mode: 'unison' }, PAL, OPTS);
    ok('15:16 is already reduced', J(b.meta.reduced) === J([15, 16]), J(b.meta.reduced));
    ok('15:16 keeps its counts', J(b.meta.perStream) === J([15, 16]), J(b.meta.perStream));
}
{
    const b = MT.buildStreams({ bpm: 120, ratios: '6:9', mode: 'unison' }, PAL, OPTS);
    ok('6:9 reduces to 2:3', J(b.meta.reduced) === J([2, 3]), J(b.meta.reduced));
    // and reduction must change the CYCLE, not merely the label
    ok('6:9 cycle uses the reduced anchor (2 x 0.5 = 1 s)', b.meta.cycleSec === 1, b.meta.cycleSec);
}

// ----------------------------------------------------------------- cycle math
section('cycle math — BPM 150, 3:4:5');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4:5', mode: 'unison', unisonPitch: 48 }, PAL, OPTS);
    const C = 1.2;                       // 3 x 60/150
    ok('cycle C = 1.2 s', b.meta.cycleSec === C, b.meta.cycleSec);
    ok('span mirrors cycleSec (the scheduler reads span)', b.meta.span === C, b.meta.span);
    ok('per-stream counts are 3/4/5', J(b.meta.perStream) === J([3, 4, 5]), J(b.meta.perStream));
    ok('total notes = 12 (unison: one pitch each)', b.notes.length === 12, b.notes.length);

    const exp0 = [0, 0.4, 0.8];                          // k * C/3
    const exp1 = [0, 0.3, 0.6, 0.9];                     // k * C/4
    const exp2 = [0, 0.24, 0.48, 0.72, 0.96];            // k * C/5
    ok('stream 1 onsets', J(onsetsOf(b, 0)) === J(exp0), J(onsetsOf(b, 0)));
    ok('stream 2 onsets', J(onsetsOf(b, 1)) === J(exp1), J(onsetsOf(b, 1)));
    ok('stream 3 onsets', J(onsetsOf(b, 2)) === J(exp2), J(onsetsOf(b, 2)));

    ok('every onset is inside the cycle', b.notes.every(n => n.tStart >= 0 && n.tStart < C));
    ok('all three streams attack together at t=0',
       b.notes.filter(n => n.tStart === 0).length === 3);
    ok('onsets are r4-rounded', b.notes.every(n => n.tStart === +n.tStart.toFixed(4)));
    ok('notes are sorted by time', b.notes.every((n, i) => i === 0 || n.tStart >= b.notes[i - 1].tStart));
}
{
    // the anchor rule: stream 1's tempo IS the BPM
    const b = MT.buildStreams({ bpm: 120, ratios: '1:2', mode: 'unison' }, PAL, OPTS);
    ok('anchor 1 at 120 BPM -> C = 0.5 s', b.meta.cycleSec === 0.5, b.meta.cycleSec);
    ok('stream 1 fires once per cycle', onsetsOf(b, 0).length === 1);
    ok('stream 2 fires twice, on the halves', J(onsetsOf(b, 1)) === J([0, 0.25]), J(onsetsOf(b, 1)));
}

// --------------------------------------------------------------- lane = stream
section('LANE = STREAM INDEX (never a round-robin cursor)');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4:5', mode: 'unison' }, PAL, OPTS);
    ok('voices used are exactly 0,1,2',
       J(Array.from(new Set(b.notes.map(n => n.voice))).sort()) === J([0, 1, 2]));
    ok('every stream-1 note is on voice 0', b.notes.filter(n => n.entry === 'T1').every(n => n.voice === 0));
    ok('every stream-2 note is on voice 1', b.notes.filter(n => n.entry === 'T2').every(n => n.voice === 1));
    ok('every stream-3 note is on voice 2', b.notes.filter(n => n.entry === 'T3').every(n => n.voice === 2));
    ok('entry names the stream', b.notes.every(n => n.entry === 'T' + (n.voice + 1)));
    ok('col is the attack index within the stream',
       b.notes.filter(n => n.voice === 2).map(n => n.col).sort((a, c) => a - c).join() === '0,1,2,3,4');
}
{
    // a chord must NOT spread across players — every note of one stream's attack
    // belongs to that stream's player
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'CLUST10' }, PAL, OPTS);
    ok('a 5-note chunk stays on one voice',
       b.notes.filter(n => n.voice === 0).every(n => n.voice === 0) &&
       new Set(b.notes.map(n => n.voice)).size === 2);
}

// -------------------------------------------------------------------- UNISON
section('UNISON');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4:5', mode: 'unison', unisonPitch: 48 }, PAL, OPTS);
    ok('every note is MIDI 48', b.notes.every(n => n.midi === 48));
    ok('every note is staccato', b.notes.every(n => n.technique === 'staccato'));
    ok('one note per attack', b.notes.length === 12);
    const b2 = MT.buildStreams({ bpm: 150, ratios: '2:3', mode: 'unison', unisonPitch: 36 }, PAL, OPTS);
    ok('the pitch input is honoured', b2.notes.every(n => n.midi === 36));
    const b3 = MT.buildStreams({ bpm: 150, ratios: '2:3', mode: 'unison' }, PAL, OPTS);
    ok('default unison pitch is C3 = 48', b3.notes.every(n => n.midi === 48));
}

// ------------------------------------------------------------------ REGISTER
section('REGISTER — one pitch class, one octave per stream, wrapping');
{
    ok('F# octaves in 30-67 are 30,42,54,66', J(MT.pcOctaves(6)) === J([30, 42, 54, 66]));
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1:1:1:1', mode: 'register', pc: 6 }, PAL, OPTS);
    const byVoice = [0, 1, 2, 3, 4].map(v => b.notes.filter(n => n.voice === v).map(n => n.midi)[0]);
    ok('5 streams over 4 octaves wrap to [30,42,54,66,30]',
       J(byVoice) === J([30, 42, 54, 66, 30]), J(byVoice));
    ok('register notes are staccato', b.notes.every(n => n.technique === 'staccato'));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1:1', mode: 'register', pc: 0 }, PAL, OPTS);
    const byVoice = [0, 1, 2].map(v => b.notes.filter(n => n.voice === v).map(n => n.midi)[0]);
    ok('C stratifies low->high as 36,48,60', J(byVoice) === J([36, 48, 60]), J(byVoice));
    ok('REGISTER really separates the streams', new Set(byVoice).size === 3);
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '1:2', mode: 'register', pc: 'nope' }, PAL, OPTS);
    ok('an unknown pitch class is NAMED, not thrown', b.meta.problems.length > 0);
    ok('and every stream is silent', b.notes.length === 0);
}

// ------------------------------------------------------------------- HARMONY
section('HARMONY — contiguous chunks, low -> high, extras to the LOWEST');
{
    ok('chunk(10, 4) sizes are [3,3,2,2]',
       J(MT.chunk([1,2,3,4,5,6,7,8,9,10], 4).map(c => c.length)) === J([3, 3, 2, 2]));
    ok('chunk(10, 4) is contiguous low->high',
       J(MT.chunk([1,2,3,4,5,6,7,8,9,10], 4)) === J([[1,2,3],[4,5,6],[7,8],[9,10]]));
    ok('chunk(12, 4) splits evenly',
       J(MT.chunk([1,2,3,4,5,6,7,8,9,10,11,12], 4).map(c => c.length)) === J([3, 3, 3, 3]));

    // CLUST10 = 44..53, ten chromatic pitches
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1:1:1', mode: 'harmony', entryId: 'CLUST10' }, PAL, OPTS);
    const got = [0, 1, 2, 3].map(v => b.notes.filter(n => n.voice === v).map(n => n.midi).sort((a, c) => a - c));
    ok('stream 1 takes the LOWEST chunk', J(got[0]) === J([44, 45, 46]), J(got[0]));
    ok('stream 2 the next', J(got[1]) === J([47, 48, 49]), J(got[1]));
    ok('stream 3 the next', J(got[2]) === J([50, 51]), J(got[2]));
    ok('stream 4 the highest', J(got[3]) === J([52, 53]), J(got[3]));
    ok('every pitch is used exactly once', b.notes.length === 10);
    ok('the chunks ascend', got[0][0] < got[1][0] && got[1][0] < got[2][0] && got[2][0] < got[3][0]);
}
{
    // THE 2aa RULE: a staccato/cuivre pair shares a pitch set and must NOT
    // become two identical streams. S047 = species 28 staccato + cuivre.
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'S047' }, PAL, OPTS);
    const cuivre = b.notes.filter(n => n.technique === 'cuivre').map(n => n.midi).sort((a, c) => a - c);
    const stac = b.notes.filter(n => n.technique === 'staccato').map(n => n.midi).sort((a, c) => a - c);
    ok('S047 carries cuivre notes', cuivre.length > 0, J(cuivre));
    ok('S047 carries staccato notes too', stac.length > 0, J(stac));
    ok('S047 cuivre notes are C4/C#4/D4 (60,61,62)', J(cuivre) === J([60, 61, 62]), J(cuivre));

    const plain = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'S044' }, PAL, OPTS);
    ok('S044 (its staccato twin) has the same pitches',
       J(plain.notes.map(n => n.midi).sort((a, c) => a - c)) === J(b.notes.map(n => n.midi).sort((a, c) => a - c)));
    ok('but NOT the same techniques — the pair is distinguishable',
       J(plain.notes.map(n => n.technique).sort()) !== J(b.notes.map(n => n.technique).sort()));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'NOPE-404' }, PAL, OPTS);
    ok('an unknown sonority is NAMED', b.meta.problems.some(p => p.indexOf('NOPE-404') >= 0), J(b.meta.problems));
    ok('and nothing sounds', b.notes.length === 0);
    ok('and it did not throw', true);
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1:1:1:1:1:1', mode: 'harmony', entryId: 'S044' }, PAL, OPTS);
    ok('more streams than pitches is NAMED', b.meta.problems.some(p => /get nothing/.test(p)), J(b.meta.problems));
    ok('and the streams that do have pitches still sound', b.notes.length > 0);
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: '—' }, PAL, OPTS);
    ok('the silent palette entry is silent WITHOUT a problem', b.notes.length === 0 && b.meta.problems.length === 0);
}

// ------------------------------------------------------- the 2n duration law
section('PLAN 2n — a one-shot keeps its measured length');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4', mode: 'unison', unisonPitch: 48, noteLen: 2.0 }, PAL, OPTS);
    const measured = techLength('staccato', 48);
    ok('noteLen 2.0 does NOT stretch a staccato', b.notes.every(n => n.dur === +measured.toFixed(4)),
       'dur=' + b.notes[0].dur + ' measured=' + measured);
    ok('and the measured length is well under the field', measured < 2.0);
    const noLen = MT.buildStreams({ bpm: 150, ratios: '3:4', mode: 'unison', noteLen: 2.0 }, PAL, {});
    ok('with no techLength the field IS the duration (the fallback path)',
       noLen.notes.every(n => n.dur === 2));
}

// ------------------------------------------------------------ problems / dyn
section('nothing is silently discarded');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:0:5', mode: 'unison' }, PAL, OPTS);
    ok('a zero term is NAMED', b.meta.problems.some(p => /stream 2/.test(p)), J(b.meta.problems));
    ok('that stream is silent', b.notes.filter(n => n.voice === 1).length === 0);
    ok('but keeps its slot, so stream 3 is still voice 2', b.notes.some(n => n.voice === 2));
    ok('and the others still play', b.notes.filter(n => n.voice === 0).length === 3);
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4.5', mode: 'unison' }, PAL, OPTS);
    ok('a non-integer term is NAMED and silent', b.meta.problems.length === 1 &&
       b.notes.filter(n => n.voice === 1).length === 0, J(b.meta.problems));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:99', mode: 'unison' }, PAL, OPTS);
    ok('a term over 64 is NAMED and silent', b.meta.problems.length === 1 &&
       b.notes.filter(n => n.voice === 1).length === 0, J(b.meta.problems));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '', mode: 'unison' }, PAL, OPTS);
    ok('no ratios at all is NAMED, not a crash', b.meta.problems.length > 0 && b.notes.length === 0);
    ok('and meta still has a usable shape', b.meta.cycleSec === 0 && J(b.meta.perStream) === J([]));
}
{
    // entry.dyn must be carried, as buildGrid does. NOTE: `dyn` reaches an entry
    // ONLY through a taxonomy ref — resolvePalette copies son.dyn (pulse_seq.js:84)
    // and a literal `pitches` entry has no dyn at all. So the fixture is a ref
    // with an invented dyn, which is the path that actually exists.
    const TAX2 = JSON.parse(JSON.stringify(TAX));
    TAX2.sonorities.DYNTEST = { pitches: [48, 50], artic: 'staccato',
                                cuivreConverted: [], cuivreAdded: [], dyn: 64 };
    const pal2 = PS.resolvePalette({ entries: { DYNTEST: { ref: 'DYNTEST' } } }, TAX2);
    const b = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'DYNTEST' }, pal2, OPTS);
    ok('entry.dyn reaches the notes', b.notes.every(n => n.vel === 64), J(b.notes.map(n => n.vel)));
    ok('the real palette carries the taxonomy dyn too',
       MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'harmony', entryId: 'S044' }, PAL, OPTS)
         .notes.every(n => n.vel === 127));
    const b2 = MT.buildStreams({ bpm: 150, ratios: '1:1', mode: 'unison' }, PAL, OPTS);
    ok('with no dyn the default velocity stands', b2.notes.every(n => n.vel === 127));
}
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4:5', mode: 'unison' }, PAL, OPTS);
    ok('meta carries overhang for the scheduler', typeof b.meta.overhang === 'number');
    ok('tail exceeds the cycle when the sample rings past it', b.meta.tail > 0);
    ok('bpm is clamped into 20-400', MT.buildStreams({ bpm: 9999, ratios: '1:2' }, PAL, OPTS).meta.bpm === 400);
}

// ------------------------------------------------------------- coincidences
section('coincidence readout (the composite pattern)');
{
    const b = MT.buildStreams({ bpm: 150, ratios: '3:4:5', mode: 'unison' }, PAL, OPTS);
    const co = MT.coincidences(b);
    ok('t=0 is shared by all three streams', co['0.0000'] === 3, J(co));
    ok('3:4:5 shares ONLY the downbeat', Object.keys(co).length === 1, J(co));
    const b2 = MT.buildStreams({ bpm: 150, ratios: '2:4', mode: 'unison' }, PAL, OPTS);
    const co2 = MT.coincidences(b2);
    ok('2:4 reduces to 1:2 and coincides at the downbeat only', Object.keys(co2).length === 1, J(co2));
}

// ================================================================= MUTATIONS
// Each block breaks ONE rule and re-runs the assertion that guards it. If a
// mutated build still satisfies the check, the check was decorative.
section('MUTATION TESTS — do the guards discriminate?');
{
    // 1. SKIP THE REDUCTION — 6:9 stays 6:9, so the cycle is 3x too long.
    const real = MT.buildStreams({ bpm: 120, ratios: '6:9', mode: 'unison' }, PAL, OPTS);
    const unreduced = { cycleSec: 6 * (60 / 120), reduced: [6, 9] };
    ok('reduction check FAILS against an unreduced build',
       !(unreduced.cycleSec === 1 && J(unreduced.reduced) === J([2, 3])));
    ok('and PASSES against the real one',
       real.meta.cycleSec === 1 && J(real.meta.reduced) === J([2, 3]));
}
{
    // 2. REVERSE THE CHUNK ORDER — highest chunk to stream 1.
    const realChunks = MT.chunk([44,45,46,47,48,49,50,51,52,53], 4);
    const reversed = realChunks.slice().reverse();
    ok('chunk check FAILS against reversed chunks', J(reversed[0]) !== J([44, 45, 46]));
    ok('and PASSES against the real one', J(realChunks[0]) === J([44, 45, 46]));
    ok('the reversal is otherwise plausible — same sizes, same pitches',
       J(reversed.map(c => c.length).sort()) === J(realChunks.map(c => c.length).sort()));
}
{
    // 3. ONSETS FROM THE UNREDUCED TERMS — a regular, wrong pulse.
    const C = 1.0;                                  // the correct 6:9 -> 2:3 cycle at 120
    const wrong = [];
    for (let k = 0; k < 6; k++) wrong.push(+(k * (C / 6)).toFixed(4));   // used 6, not 2
    const right = [];
    for (let k = 0; k < 2; k++) right.push(+(k * (C / 2)).toFixed(4));
    const real = MT.buildStreams({ bpm: 120, ratios: '6:9', mode: 'unison' }, PAL, OPTS);
    ok('onset check FAILS against unreduced onsets', J(onsetsOf(real, 0)) !== J(wrong));
    ok('and PASSES against the real one', J(onsetsOf(real, 0)) === J(right), J(onsetsOf(real, 0)));
    // regular to within r4's own rounding — an exact float compare would be
    // testing IEEE754, not the property.
    ok('the wrong pulse is still perfectly regular — which is why it needs a test',
       wrong.every((t, i) => i === 0 || Math.abs((t - wrong[i - 1]) - C / 6) < 1e-3));
}
{
    // 4. LANE ROUND-ROBIN — buildGrid's cursor, applied here, is the silent one.
    const real = MT.buildStreams({ bpm: 150, ratios: '1:1:1', mode: 'harmony', entryId: 'CLUST10' }, PAL, OPTS);
    let cursor = 0;
    const roundRobin = real.notes.map(() => cursor++ % 10);
    const perStreamHolds = real.notes.every(n => n.voice === +n.entry.slice(1) - 1);
    const rrHolds = real.notes.every((n, i) => roundRobin[i] === +n.entry.slice(1) - 1);
    ok('lane=stream check FAILS against a round-robin cursor', !rrHolds);
    ok('and PASSES against the real one', perStreamHolds);
}

// ---------------------------------------------------------------------- done
console.log('');
if (fails.length) {
    console.log('FAILURES:');
    fails.forEach(f => console.log('  ' + f));
}
console.log((fail ? 'FAIL' : 'PASS') + ' — ' + pass + '/' + (pass + fail));
process.exit(fail ? 1 : 0);
