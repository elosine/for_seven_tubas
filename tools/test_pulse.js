#!/usr/bin/env node
// test_pulse.js — unit tests over the PULSE SEQUENCER engine (PLAN 2aa v1).
//
// What a test CAN judge here is whether the grid becomes the right notes: the
// pulse lands on the beat, a sonority keeps its own articulation, a fixed
// one-shot keeps its measured length, lanes rotate, and nothing is ever
// silently dropped. That is the cheap half of verification.
//
// What it cannot judge is whether the pattern of harmonic change is right.
// That is the composer's, in the running app, and it is the whole point of the
// panel — which is why this file stops where it does.
//
//   node tools/test_pulse.js
//
// THE GATE: the composer's seven staccato/staccato-cuivre pairs must be
// DISTINGUISHABLE. Five of them share an identical pitch set and differ only in
// articulation, so a palette that resolved pitches alone would turn half the
// menu into silent duplicates. Those five assertions are the reason this file
// exists rather than a smoke test.

const fs = require('fs');
const path = require('path');
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

// Composer.techLength's rule, mirrored: measured table, nearest measured pitch,
// then the fixed fallback; null for a variable technique (ord).
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

// ---------------------------------------------------------------- the palette
section('palette resolution');

ok('no problems resolving the shipped palette', PAL.problems.length === 0, PAL.problems.join(' · '));
ok('menu order is the file order',
    PAL.order[0] === 'FIFTHS' && PAL.order[1] === 'CLUST10',
    PAL.order.slice(0, 3).join(','));
ok('FIFTHS is the tranceSB01 accretion chord',
    JSON.stringify(PAL.entries.FIFTHS.pitches) === JSON.stringify([31, 36, 41, 45, 49, 52, 54, 56, 59, 62]));
ok('CLUST10 is 10 chromatic notes centred C3 (44–53)',
    PAL.entries.CLUST10.pitches.length === 10 &&
    PAL.entries.CLUST10.pitches[0] === 44 && PAL.entries.CLUST10.pitches[9] === 53);
ok('literal entries default to staccato',
    PAL.entries.CLUST10.tech[48] === 'staccato' && PAL.entries.FIFTHS.tech[31] === 'staccato');

// every octave of a pitch class, inside the bank range 30–67
const PC = { C: [36, 48, 60], 'F#': [30, 42, 54, 66], G: [31, 43, 55, 67], B: [35, 47, 59] };
Object.keys(PC).forEach(k => {
    ok('pitch class ' + k + ' = every octave in 30–67',
        JSON.stringify(PAL.entries[k].pitches) === JSON.stringify(PC[k]),
        JSON.stringify(PAL.entries[k].pitches));
});
ok('12 pitch classes are present',
    ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        .every(k => PAL.entries[k] && PAL.entries[k].pitches.length >= 3));
ok('the silent entry is silent', PAL.entries['—'].silent === true &&
    PAL.entries['—'].pitches.length === 0);

// ------------------------------------------------------ the composer's 14 refs
section('the blast-menu sonorities (composer, day 16)');

const PAIRS = [
    ['3', 'S008', 'S011'], ['4', 'S014', 'S017'], ['11', 'S020', 'S023'],
    ['12', 'S026', 'S029'], ['13', 'S032', 'S035'], ['16', 'S038', 'S041'],
    ['28', 'S044', 'S047'],
];

PAIRS.forEach(([species, plain, cuivre]) => {
    [plain, cuivre].forEach(id => {
        const e = PAL.entries[id];
        ok(id + ' resolves from the taxonomy', !!e && !e.missing && e.pitches.length > 0);
        ok(id + ' is species ' + species,
            e && e.chord === 'VERT01-' + (species.length < 2 ? '0' + species : species),
            e && e.chord);
    });
    const a = PAL.entries[plain], b = PAL.entries[cuivre];

    // the plain half is pure staccato
    ok(plain + ' is all staccato',
        a.pitches.every(p => a.tech[p] === 'staccato'),
        JSON.stringify(a.tech));
    // the cuivre half carries at least one cuivre note
    const cv = b.pitches.filter(p => b.tech[p] === 'cuivre');
    ok(cuivre + ' carries cuivre notes', cv.length > 0, JSON.stringify(b.tech));
    // ...and the rest of it is still staccato
    ok(cuivre + ' is staccato everywhere else',
        b.pitches.every(p => b.tech[p] === 'cuivre' || b.tech[p] === 'staccato'),
        JSON.stringify(b.tech));

    // THE GATE. Where the pitch sets are identical, articulation is the ONLY
    // thing that separates the pair — so it had better separate them.
    const samePitches = JSON.stringify(a.pitches) === JSON.stringify(b.pitches);
    if (samePitches) {
        ok('species ' + species + ': ' + plain + ' vs ' + cuivre +
            ' — identical pitches, so they MUST differ in articulation',
            JSON.stringify(a.tech) !== JSON.stringify(b.tech));
    } else {
        ok('species ' + species + ': ' + plain + ' vs ' + cuivre + ' differ in pitch set', true);
    }
});

const identicalPairs = PAIRS.filter(([, a, b]) =>
    JSON.stringify(PAL.entries[a].pitches) === JSON.stringify(PAL.entries[b].pitches));
ok('five pairs are pitch-identical (the finding that forced per-note articulation)',
    identicalPairs.length === 5, identicalPairs.map(p => p[1] + '/' + p[2]).join(' '));

// cuivre only exists on MIDI 60–67 (sandbox/instruments.js technique range, and
// bank/sample_lengths.json only measured 60–67). A cuivre note outside it would
// fall back to `ord` at routeFor and sound as a completely different technique.
const INSTR = (() => {
    const src = fs.readFileSync(path.join(ROOT, 'sandbox/instruments.js'), 'utf8');
    try { return new Function(src + '\nreturn INSTRUMENTS;')(); } catch (e) { return null; }
})();
const cuivreTech = INSTR && INSTR.tuba1 && (INSTR.tuba1.techniques || []).find(t => t.key === 'cuivre');
ok('instruments.js still puts cuivre at 60–67',
    !!cuivreTech && cuivreTech.rangeLow === 60 && cuivreTech.rangeHigh === 67,
    cuivreTech && (cuivreTech.rangeLow + '–' + cuivreTech.rangeHigh));
PAIRS.forEach(([species, , cuivre]) => {
    const e = PAL.entries[cuivre];
    const outside = e.pitches.filter(p => e.tech[p] === 'cuivre' && (p < 60 || p > 67));
    ok(cuivre + ' keeps every cuivre note inside the playable range',
        outside.length === 0, JSON.stringify(outside));
});

// techFor is the blast inserter's rule — check it against the raw taxonomy
section('techFor mirrors the blast inserter');
Object.keys(TAX.sonorities).forEach(id => {
    const son = TAX.sonorities[id];
    const bad = (son.pitches || []).filter(p => {
        const cv = (son.cuivreConverted || []).indexOf(p) >= 0 ||
                   (son.cuivreAdded || []).indexOf(p) >= 0;
        const expect = cv ? 'cuivre' : ((son.artic || {})[p] || 'ord');
        return PS.techFor(son, p) !== expect;
    });
    if (bad.length) ok(id + ': techFor matches', false, JSON.stringify(bad));
});
ok('techFor matches the inserter on all ' + Object.keys(TAX.sonorities).length + ' banked sonorities', true);

// -------------------------------------------------------------------- the grid
section('grid → notes');

const gridOf = (cells, over) => Object.assign(
    { bpm: 130, columns: cells.length, noteLen: 0.25, cells: cells }, over || {});

const g1 = PS.buildGrid(gridOf(['FIFTHS', 'FIFTHS', 'FIFTHS', 'FIFTHS']), PAL, { techLength });
// times are rounded to 4 decimals on the way out — that rounding is part of the
// contract, so the tolerance is the rounding, not a fudge factor
ok('span = columns × 60/BPM', Math.abs(g1.meta.span - 4 * (60 / 130)) < 5e-5, String(g1.meta.span));
ok('step = 60/BPM', Math.abs(g1.meta.step - 60 / 130) < 1e-4, String(g1.meta.step));
ok('one note per pitch per column', g1.notes.length === 40, String(g1.notes.length));
ok('column k starts at k·step', [0, 1, 2, 3].every(k => {
    const col = g1.notes.filter(n => n.col === k);
    return col.length === 10 && col.every(n => Math.abs(n.tStart - k * (60 / 130)) < 1e-3);
}));
ok('notes come out in time order',
    g1.notes.every((n, i) => i === 0 || n.tStart >= g1.notes[i - 1].tStart));

// LANES ARE ROUND-ROBIN ACROSS THE WHOLE GRID (routing, not orchestration)
ok('a 10-note chord uses all ten lanes in every column', [0, 1, 2, 3].every(k => {
    const s = new Set(g1.notes.filter(n => n.col === k).map(n => n.voice));
    return s.size === 10;
}));
const g2 = PS.buildGrid(gridOf(['F', 'F', 'F', 'F', 'F']), PAL, { techLength });
ok('a 3-note entry spreads over the ensemble instead of hammering lanes 0–2',
    new Set(g2.notes.map(n => n.voice)).size === 10, String(new Set(g2.notes.map(n => n.voice)).size));
ok('lane cursor wraps at 10 and never leaves 0–9',
    g2.notes.every(n => n.voice >= 0 && n.voice < 10));
ok('meta.laneNext continues the rotation', g2.meta.laneNext === (15 % 10));

// PLAN 2n / D9 — ORD IS THE ONLY REAL DURATION
section('fixed one-shots keep their measured length (PLAN 2n)');
const g3 = PS.buildGrid(gridOf(['S047']), PAL, { techLength });
ok('staccato takes the MEASURED sample length, not the grid note length',
    g3.notes.filter(n => n.technique === 'staccato')
        .every(n => Math.abs(n.dur - SL.staccato[n.midi]) < 1e-6 && n.dur !== 0.25),
    JSON.stringify(g3.notes.map(n => n.technique + ':' + n.dur)));
ok('cuivre takes the MEASURED cuivre length',
    g3.notes.filter(n => n.technique === 'cuivre')
        .every(n => Math.abs(n.dur - SL.cuivre[n.midi]) < 1e-6),
    JSON.stringify(g3.notes.filter(n => n.technique === 'cuivre').map(n => n.midi + ':' + n.dur)));
ok('a longer grid note-length does NOT stretch a fixed one-shot',
    JSON.stringify(PS.buildGrid(gridOf(['S047'], { noteLen: 3 }), PAL, { techLength }).notes.map(n => n.dur)) ===
    JSON.stringify(g3.notes.map(n => n.dur)));
const gOrd = PS.buildGrid(gridOf(['ORDTEST'], { noteLen: 0.8 }),
    PS.resolvePalette({ entries: { ORDTEST: { pitches: [41, 48], technique: 'ord' } } }, TAX),
    { techLength });
ok('a VARIABLE technique does take the grid note length',
    gOrd.notes.every(n => n.dur === 0.8), JSON.stringify(gOrd.notes.map(n => n.dur)));
ok('overhang reports a one-shot ringing past the last column',
    g3.meta.overhang > 0, String(g3.meta.overhang));

// nothing is ever silently dropped
section('nothing is silently dropped');
const g4 = PS.buildGrid(gridOf(['FIFTHS', '—', 'FIFTHS']), PAL, { techLength });
ok('a silent column produces no notes', g4.notes.filter(n => n.col === 1).length === 0);
ok('a silent column still occupies its time', g4.meta.columns === 3 && g4.meta.silentCols === 1);
ok('the column after a silence is still on the beat',
    Math.abs(g4.notes.filter(n => n.col === 2)[0].tStart - 2 * (60 / 130)) < 1e-3);

const g5 = PS.buildGrid(gridOf(['FIFTHS', 'GONE', 'FIFTHS']), PAL, { techLength });
ok('an unknown id is REPORTED, not swallowed', g5.meta.unknown.join(',') === 'GONE');
ok('an unknown id falls back to the first entry rather than going silent',
    g5.notes.filter(n => n.col === 1).length === 10);
const g6 = PS.buildGrid(gridOf([null, null]), PAL, { techLength });
ok('an unassigned column plays the first palette entry',
    g6.notes.every(n => n.entry === 'FIFTHS') && g6.notes.length === 20);

const broken = PS.resolvePalette({ entries: { X: { ref: 'S999' } } }, TAX);
ok('a broken ref is KEPT as an entry, not dropped',
    broken.order.length === 1 && broken.entries.X.missing === true);
ok('a broken ref explains itself', /S999/.test(broken.problems.join(' ')), broken.problems.join(' '));

// determinism — the engine is pure
section('purity');
const a1 = PS.buildGrid(gridOf(['S008', 'CLUST10', 'S023']), PAL, { techLength });
const a2 = PS.buildGrid(gridOf(['S008', 'CLUST10', 'S023']), PAL, { techLength });
ok('same grid → byte-identical notes', JSON.stringify(a1) === JSON.stringify(a2));
ok('clamps out-of-range settings instead of producing junk', (() => {
    const g = PS.buildGrid({ bpm: 0, columns: 0, noteLen: 0, cells: [] }, PAL, { techLength });
    return g.meta.bpm >= 20 && g.meta.columns >= 1 && g.meta.noteLen >= 0.02;
})());

// lane pressure — what a column costs one player
section('lane pressure');
const lp = PS.lanePressure(PS.buildGrid(gridOf(new Array(32).fill('FIFTHS')), PAL, { techLength }));
ok('ten notes over ten lanes → one attack per player per column',
    Math.abs(lp.tightestGap - 60 / 130) < 1e-3, String(lp.tightestGap));
const lp3 = PS.lanePressure(PS.buildGrid(gridOf(new Array(32).fill('F')), PAL, { techLength }));
ok('a 3-note entry gives each player one attack every ~10/3 columns',
    lp3.tightestGap > 60 / 130, String(lp3.tightestGap));

// ---------------------------------------------------------------------- report
console.log('\n' + (fail ? 'FAIL' : 'PASS') + ' — ' + pass + '/' + (pass + fail));
if (fail) { fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
