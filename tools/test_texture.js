#!/usr/bin/env node
// test_texture.js — unit tests over the pure texture engine (PLAN 2x Phase 0).
//
// No server, no audio, no MIDI, no writes. This is the cheap half of
// verification: it pins what is TRUE BY CONSTRUCTION — the extraction's
// byte-identity, the measured metric scale, the clamp law, determinism — so the
// expensive half (listening in the running app) is spent only on what a test
// cannot judge.
//
//   node tools/test_texture.js
//
// THE GATE (plan §13 Phase 0) is the REGRESSION CORPUS section: the nine preset
// scores committed in scores/ must regenerate through the extracted engine with
// a byte-identical `objects` array. The 2j research arc is the safety net for
// its own extraction.

const fs = require('fs');
const path = require('path');
const TX = require('../score/public/texture_engine.js');
const { PRESETS } = require('./phase_shift.js');

const ROOT = path.join(__dirname, '..');
const SL = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
const OPTS = { sampleLengths: SL };

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
    if (cond) { pass++; return; }
    fail++; fails.push(name + (detail ? '  -> ' + detail : ''));
}
function eq(name, got, want, tol) {
    const good = tol != null ? Math.abs(got - want) <= tol : got === want;
    ok(name, good, 'got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want) +
        (tol != null ? ' +/-' + tol : ''));
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

const render = spec => TX.render(spec, OPTS);

// ===========================================================================
section('REGRESSION CORPUS — the extraction gate (plan §13 Phase 0)');
// ===========================================================================
// Every committed research score must come back byte-identical through the
// extracted engine. If one of these fails, the extraction changed the music.
const CORPUS = {
    scatter: 'phase07-scatter',
    density: 'phase08-density',
    jitterrain: 'phase09-jitterrain',
    articulation: 'phase10-articulation',
    ordbeat: 'phase11-ordbeat',
    smooth: 'phase06-smooth',
    fluttermap: 'phase03-fluttermap',
    accel: 'phase03-accel',
    jitter: 'phase04-jitter',
};
let corpusObjects = 0;
for (const [preset, file] of Object.entries(CORPUS)) {
    const p = path.join(ROOT, 'scores', file + '.json');
    if (!fs.existsSync(p)) { ok(file + ' exists', false, 'missing ' + p); continue; }
    const committed = JSON.parse(fs.readFileSync(p, 'utf8'));
    const g = render(PRESETS[preset]());
    corpusObjects += g.objects.length;
    ok(file + ' regenerates byte-identical',
        JSON.stringify(g.objects) === JSON.stringify(committed.objects),
        g.objects.length + ' vs ' + committed.objects.length + ' objects');
    eq(file + ' nextId matches', g.nextId, committed.nextId);
    // Principle 4 — labels written to the `markers` array round-trip but NEVER
    // render. Every marker must live in `objects`.
    ok(file + ' markers array stays empty', (committed.markers || []).length === 0);
    ok(file + ' carries its markers in objects',
        g.objects.some(o => o.type === 'marker'));
}
console.log('  (' + corpusObjects + ' objects across ' + Object.keys(CORPUS).length + ' scores)');

// ===========================================================================
section('METRIC CALIBRATION — sd against the MEASURED research table');
// ===========================================================================
// docs/PHASE_SHIFTING.md §5: scatter 0 -> 0.1 ms . 0.03 -> 6.4 . 0.08 -> 21.5 .
// 0.2 -> 32.6 . 1.0 -> 46.2. These were measured off the phase07 render by the
// research; the engine must still read the same scale, or every dial number the
// composer learned by ear is silently re-based.
const scat = render(PRESETS.scatter());
const byTag = {};
scat.report.forEach(r => { byTag[r.sec.tag] = r.metrics; });
eq('scatter 0    sd ~ 0.1 ms', byTag['sc0'].sd, 0.1, 0.15);
eq('scatter 0.03 sd ~ 6.4 ms', byTag['sc0.03'].sd, 6.4, 0.8);
eq('scatter 0.08 sd ~ 21.5 ms', byTag['sc0.08'].sd, 21.5, 1.5);
eq('scatter 0.2  sd ~ 32.6 ms', byTag['sc0.2'].sd, 32.6, 1.5);
eq('scatter 1.0  sd ~ 46.2 ms', byTag['sc1'].sd, 46.2, 1.5);
ok('sd rises monotonically with scatter',
    byTag['sc0'].sd < byTag['sc0.03'].sd && byTag['sc0.03'].sd < byTag['sc0.08'].sd &&
    byTag['sc0.08'].sd < byTag['sc0.2'].sd && byTag['sc0.2'].sd < byTag['sc1'].sd);
// unevenness must move WITH scatter — a fixed offset is a persistent figure
ok('unevenness rises with scatter too',
    byTag['sc0'].unevenness < byTag['sc0.08'].unevenness &&
    byTag['sc0.08'].unevenness < byTag['sc1'].unevenness,
    [byTag['sc0'].unevenness, byTag['sc0.08'].unevenness, byTag['sc1'].unevenness].join(' / '));
eq('scatter 0 is exactly even — no figure at all', byTag['sc0'].unevenness, 0, 1e-9);

// ===========================================================================
section('JITTER vs SCATTER — the same irregularity, opposite repetition');
// ===========================================================================
// phase09 cells 4 and 5 are the research A/B and the reason `unevenness` exists.
// JITTER redraws the offset every attack, so each player's cycle position
// averages back to its even slot -> NOTHING repeats -> unevenness stays low.
// SCATTER fixes the offset, so the position persists -> it reads as a figure
// that loops once per cycle -> unevenness high. sd cannot tell them apart.
const jr = render(PRESETS.jitterrain());
const jt = {};
jr.report.forEach(r => { jt[r.sec.tag] = r.metrics; });
ok('the A/B pair is matched on evenness (sd within 3 ms)',
    Math.abs(jt['jAB'].sd - jt['sAB'].sd) < 3,
    'jitter ' + jt['jAB'].sd + ' ms vs scatter ' + jt['sAB'].sd + ' ms');
ok('...and separated on unevenness by at least 4x',
    jt['sAB'].unevenness > 4 * jt['jAB'].unevenness,
    'jitter ' + jt['jAB'].unevenness + ' vs scatter ' + jt['sAB'].unevenness);
ok('jitter never builds a figure, however large it gets',
    jt['j15'].unevenness < 0.2 && jt['j35'].unevenness < 0.2 && jt['jAB'].unevenness < 0.2,
    [jt['j15'].unevenness, jt['j35'].unevenness, jt['jAB'].unevenness].join(' / '));
ok('but jitter DOES move sd, monotonically',
    jt['j0'].sd < jt['j15'].sd && jt['j15'].sd < jt['j35'].sd && jt['j35'].sd < jt['jAB'].sd,
    [jt['j0'].sd, jt['j15'].sd, jt['j35'].sd, jt['jAB'].sd].join(' / '));

// ===========================================================================
section('DENSITY ARITHMETIC — composite rate = players x BPM/60');
// ===========================================================================
const dens = render(PRESETS.density());
[[0, 8], [1, 12], [2, 17], [3, 23]].forEach(([i, rate]) => {
    const l = dens.report[i].lines[0];
    eq('density cell ' + rate + '/s renders ~' + rate + '/s', l.composite, rate, 0.15);
    eq('  with all 10 players', l.players, 10);
});
// the MEASURED ceiling: 10 players / 0.42 s staccato ring ~ 23 attacks/s. At the
// top cell the per-player gap must still clear the ring, or the texture is a
// pile of overlapping samples rather than a field of attacks.
const top = dens.report[3].lines[0];
ok('at the 23/s ceiling the per-player gap still clears the ring',
    top.tightest > top.ring, top.tightest.toFixed(3) + 's vs ' + top.ring + 's ring');
eq('and the whole density ladder is playable', dens.summary.hard, 0);

// ===========================================================================
section('CLAMP LAW (D9) — variable clamps, fixed one-shots never do');
// ===========================================================================
// A VARIABLE-length note (ord, flz) that outlasts the player's own next attack
// is physically impossible, so it is clamped and the clamp is reported. A FIXED
// one-shot (staccato, fortepiano, cuivre) rings for its sample length whatever
// is written, so clamping would be a lie — the overlap stays visible as a real
// conflict instead.
const oneVoice = (tech, notelen, bpm) => ({
    name: 'clamp-probe', t0: 0, gap: 0, notelen: 0.12,
    sections: [{ label: 'probe', tag: 'probe', dur: 8, model: 'beat',
        voices: [{ lanes: [0], pitch: 48, tech, bpm, notelen }] }],
});
const varLong = render(oneVoice('ord', 2.0, 60));     // period 1.0 s, asked 2.0 s
eq('a variable-length note is clamped to the next attack', varLong.report[0].lines[0].written, 0.95);
ok('and the clamp is REPORTED, never silent', varLong.clamps.length === 1, JSON.stringify(varLong.clamps));
eq('clamping removes the impossible overlap', varLong.summary.hard, 0);

const fixedLong = render(oneVoice('staccato', 2.0, 60));
eq('a fixed one-shot is NOT clamped', fixedLong.report[0].lines[0].written, 2.0);
ok('...it has no clamp to report', fixedLong.clamps.length === 0);
ok('...and its overlap stays visible as a real conflict', fixedLong.summary.hard > 0,
    fixedLong.summary.hard + ' hard');

const varShort = render(oneVoice('ord', 0.3, 60));    // comfortably inside the period
eq('a variable note that fits is left alone', varShort.report[0].lines[0].written, 0.3);
ok('...with nothing reported', varShort.clamps.length === 0);

// ring length is looked up per pitch, never hardcoded (2n/2o: if the note-off
// probe ever changes the table, every consumer follows)
eq('staccato ring at C3 comes from the table', TX.ringLength(SL, 'staccato', 48), SL.staccato[48]);
ok('a pitch outside the table falls back to the nearest measured one',
    TX.ringLength(SL, 'staccato', 99) === SL.staccato[65], String(TX.ringLength(SL, 'staccato', 99)));
eq('a variable technique has no ring at all', TX.ringLength(SL, 'ord', 48), null);

// ===========================================================================
section('LEVEL -> VELOCITY — the dial the corpus never exercises');
// ===========================================================================
// Every note in the research corpus sits at level 7.5, where several plausible
// scalings happen to round to the same byte — so byte-identity alone does NOT
// pin this map. It matters because `level` is a panel dial and velocity is how
// the audition expresses dynamics (2q, velocity-vs-CC7, still open).
const velAt = lvl => render({
    name: 'v', t0: 0, gap: 0, notelen: 0.12,
    sections: [{ label: 'v', tag: 'v', dur: 2, model: 'beat',
        voices: [{ lanes: [0], pitch: 48, tech: 'staccato', bpm: 60, notelen: 0.12, level: lvl }] }],
}).objects.find(o => o.type === 'waveCurve').recVel;
eq('level 10 is full velocity', velAt(10), 127);
eq('level 7.5 (the corpus level)', velAt(7.5), 95);
eq('level 5 is half', velAt(5), 64);
eq('level 2.5 is a quarter', velAt(2.5), 32);
eq('level 0 never reaches a silent note-on', velAt(0), 1);
ok('velocity rises monotonically with level',
    [0, 1, 2.5, 5, 7.5, 9, 10].every((l, i, a) => i === 0 || velAt(l) >= velAt(a[i - 1])));
ok('velocity is always a legal MIDI byte',
    [0, 2.5, 5, 7.5, 10, 12].every(l => velAt(l) >= 1 && velAt(l) <= 127),
    JSON.stringify([0, 2.5, 5, 7.5, 10, 12].map(velAt)));
eq('an out-of-range level clamps rather than overflowing', velAt(99), 127);

// ===========================================================================
section('DETERMINISM — same spec + seed => identical objects');
// ===========================================================================
const panelSpec = seed => ({
    name: 'det', seed, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 6, label: 'det', tag: 'det',
        voices: [{ players: 10, bpm: 110, articulation: 'staccato', notelen: 0.12,
            scatter: 0.5, jitterMs: 20, level: 7.5, pitch: { policy: 'unison', root: 48 } }] }],
});
const a1 = render(panelSpec(4)), a2 = render(panelSpec(4)), b1 = render(panelSpec(5));
ok('the same seed renders identically',
    JSON.stringify(a1.objects) === JSON.stringify(a2.objects));
ok('a different seed is a DIFFERENT DRAW of the same texture',
    JSON.stringify(a1.objects) !== JSON.stringify(b1.objects));
eq('...but the same amount of it', a1.notes, b1.notes);
ok('...and a comparable character (sd within 25%)',
    Math.abs(a1.report[0].metrics.sd - b1.report[0].metrics.sd) < 0.25 * a1.report[0].metrics.sd,
    a1.report[0].metrics.sd + ' vs ' + b1.report[0].metrics.sd);
// the preset corpus is seeded too — rendering twice must not drift
ok('presets are seeded, not ambient',
    JSON.stringify(render(PRESETS.scatter()).objects) ===
    JSON.stringify(render(PRESETS.scatter()).objects));

// ===========================================================================
section('PANEL DIALECT — normalisation into the resolved form');
// ===========================================================================
const twoGroups = {
    name: 'lanes', seed: 1, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 4, label: 'lanes', tag: 'lanes', voices: [
        { players: 5, bpm: 110, articulation: 'staccato', notelen: 0.12, pitch: { root: 48 } },
        { players: 5, bpm: 116, articulation: 'staccato', notelen: 0.12, pitch: { root: 48 } },
    ] }],
};
const tg = render(twoGroups);
const lanesOf = ci => [...new Set(tg.objects.filter(o =>
    o.type === 'waveCurve' && o.color === TX.COLORS[ci]).map(o => o.layer))].sort((a, b) => a - b);
// plan §4.1: contiguous lane blocks in listed order — reproduces LANES_A/LANES_B
ok('group 0 takes lanes 0-4', JSON.stringify(lanesOf(0)) === JSON.stringify([0, 1, 2, 3, 4]),
    JSON.stringify(lanesOf(0)));
ok('group 1 takes lanes 5-9', JSON.stringify(lanesOf(1)) === JSON.stringify([5, 6, 7, 8, 9]),
    JSON.stringify(lanesOf(1)));
ok('colour follows the GROUP, not the expanded voice',
    new Set(tg.objects.filter(o => o.type === 'waveCurve').map(o => o.color)).size === 2);
ok('an explicit lanes array overrides the block rule',
    JSON.stringify(TX.assignLanes([{ lanes: [7, 8] }, { players: 2 }], 10)) ===
    JSON.stringify([[7, 8], [0, 1]]));

// scatter 0 must be the EVEN INTERLEAVE, i.e. identical in character to the
// hocketed form the presets use — that is what makes expansion safe as the one
// code path (engine header).
const even = render({
    name: 'even', seed: 1, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 6, label: 'even', tag: 'even', voices: [{ players: 10, bpm: 110,
        articulation: 'staccato', notelen: 0.12, scatter: 0, pitch: { root: 48 } }] }],
});
ok('scatter 0 through the panel dialect is dead even', even.report[0].metrics.sd < 0.2,
    even.report[0].metrics.sd + ' ms');
eq('...and shows no figure', even.report[0].metrics.unevenness, 0, 1e-9);
eq('...at the expected composite rate', even.report[0].metrics.n / 6, 10 * 110 / 60, 0.3);

// unknown keys are COLLECTED, never thrown and never silently dropped (2v rule)
const typo = { name: 't', seed: 1, sections: [{ dur: 2, label: 't', tag: 't', jiterMs: 40,
    voices: [{ players: 2, bpm: 110, articulation: 'staccato', notelen: 0.12, pitch: { root: 48 },
        wobble: 3 }] }] };
const tp = render(typo);
ok('a section-level typo is reported', tp.unknown.some(k => k.indexOf('jiterMs') >= 0),
    JSON.stringify(tp.unknown));
ok('a voice-level typo is reported', tp.unknown.some(k => k.indexOf('wobble') >= 0),
    JSON.stringify(tp.unknown));
ok('...and it still renders anyway', tp.notes > 0);
eq('a clean spec reports nothing', render(panelSpec(1)).unknown.length, 0);

// ===========================================================================
section('PITCH — unison is the Phase-0 control (policies land in Phase 2)');
// ===========================================================================
const pit = render({
    name: 'p', seed: 2, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 4, label: 'p', tag: 'p', voices: [{ players: 4, bpm: 110,
        articulation: 'staccato', notelen: 0.12, pitch: { policy: 'unison', root: 41 } }] }],
});
const pitches = [...new Set(pit.objects.filter(o => o.type === 'waveCurve').map(o => o.sonifyNote))];
ok('unison puts every attack on the one pitch', pitches.length === 1 && pitches[0] === 41,
    JSON.stringify(pitches));
ok('every pitch is a legal MIDI note',
    pit.objects.filter(o => o.type === 'waveCurve').every(o => o.sonifyNote >= 0 && o.sonifyNote <= 127));

// ===========================================================================
section('PLAYABILITY — D17, one law shared with audit_playability.js');
// ===========================================================================
eq('MIN_ATTACK', TX.D17.MIN_ATTACK, 0.11);
eq('PER_SEMITONE', TX.D17.PER_SEMITONE, 0.0093);
eq('MAX_LEAP_ADD', TX.D17.MAX_LEAP_ADD, 0.22);
eq('TONGUE_RESET', TX.D17.TONGUE_RESET, 0.03);
eq('the leap term is capped', TX.requiredAttack({ sonifyNote: 0 }, { sonifyNote: 60 }), 0.33, 1e-9);
eq('a semitone leap costs one increment',
    TX.requiredAttack({ sonifyNote: 48 }, { sonifyNote: 49 }), 0.11 + 0.0093, 1e-9);
ok('overlap is HARD',
    TX.pairTier({ startSeconds: 0, endSeconds: 1, sonifyNote: 48 },
        { startSeconds: 0.5, endSeconds: 1.5, sonifyNote: 48 }) === 'hard');
ok('a too-tight re-attack is SOFT',
    TX.pairTier({ startSeconds: 0, endSeconds: 0.02, sonifyNote: 48 },
        { startSeconds: 0.05, endSeconds: 0.1, sonifyNote: 48 }) === 'soft');
ok('a comfortable gap is FREE',
    TX.pairTier({ startSeconds: 0, endSeconds: 0.1, sonifyNote: 48 },
        { startSeconds: 1, endSeconds: 1.1, sonifyNote: 48 }) === 'free');
// the META layer is not a player and must never generate conflicts
ok('layer 10 (META) is excluded from the occupancy model',
    TX.playability([
        { type: 'waveCurve', layer: 10, startSeconds: 0, endSeconds: 5, sonifyNote: 48 },
        { type: 'waveCurve', layer: 10, startSeconds: 1, endSeconds: 6, sonifyNote: 48 },
    ]).hard === 0);
// the whole committed corpus is clean — the generators respected one-note-per-player
Object.entries(CORPUS).forEach(([preset, file]) => {
    ok(file + ' has no hard conflicts', render(PRESETS[preset]()).summary.hard === 0,
        String(render(PRESETS[preset]()).summary.hard));
});

// ===========================================================================
section('PURITY — the engine must load in a browser unchanged');
// ===========================================================================
const src = fs.readFileSync(path.join(ROOT, 'score/public/texture_engine.js'), 'utf8');
const body = src.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
[['require(', 'no node require'], ['fs.', 'no filesystem'], ['new Date', 'no clock'],
 ['Math.random', 'no ambient randomness'], ['document.', 'no DOM'],
 ['fetch(', 'no network'], ['process.', 'no node process']].forEach(([needle, why]) => {
    ok('engine is pure: ' + why, body.indexOf(needle) < 0, 'found "' + needle + '"');
});
ok('engine exports through the dual-load wrapper',
    /module\.exports\s*=\s*api/.test(src) && /root\.Texture\s*=\s*api/.test(src));
eq('and node sees the API', typeof TX.generate, 'function');

// ===========================================================================
section('MARKERS — Principle 4, they only render from `objects`');
// ===========================================================================
const mk = render(PRESETS.fluttermap());
const markers = mk.objects.filter(o => o.type === 'marker');
ok('markers are emitted as objects', markers.length > 0, String(markers.length));
ok('every marker carries a time and a label',
    markers.every(m => typeof m.time === 'number' && typeof m.label === 'string'));
ok('marker times are rounded to 2 dp (the byte-identity contract)',
    markers.every(m => Math.abs(m.time * 100 - Math.round(m.time * 100)) < 1e-9));
ok('note bounds are rounded to 4 dp',
    mk.objects.filter(o => o.type === 'waveCurve').every(o =>
        Math.abs(o.startSeconds * 1e4 - Math.round(o.startSeconds * 1e4)) < 1e-6));
ok('the engine never returns a `markers` array to fill', mk.markers === markers.length);
// R9 — every render is self-describing: the first marker is a plain-language
// sentence, not a parameter dump
ok('the first marker of a section is its plain-language label',
    markers[0].label === mk.report[0].sec.label, markers[0].label);

// ===========================================================================
console.log('\n' + '='.repeat(58));
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach(f => console.log('  x ' + f));
    process.exit(1);
}
console.log('  texture engine OK');
