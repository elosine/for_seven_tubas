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
section('SEED IS THE DRAW NUMBER (R5) — the identity-vs-draw question');
// ===========================================================================
// At ten voices a jitter/scatter setting is a LOTTERY, not a texture: each
// render is one draw from it, and the phantom "accents" in the research came
// from judging single draws. So stepping the seed MUST change the draw — and it
// must do so for BOTH stochastic dials, which are seeded through different
// paths (jitter inside generate(), scatter inside normaliseSpec()).
//
// THIS SECTION EXISTS BECAUSE IT ONCE SILENTLY FAILED. The jitter stream was
// seeded from a hardcoded constant, so a RAIN texture rendered bit-identically
// at every seed and the panel's central question answered itself. 150 other
// assertions did not catch it; only stepping the dial in the running app did.
const seededRain = s => ({
    name: 'r', seed: s, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 14, label: 'r', tag: 'r', voices: [{ players: 10, bpm: 110,
        articulation: 'staccato', notelen: 0.12, scatter: 0, jitterMs: 45, level: 7.5,
        pitch: { root: 48 } }] }],
});
const seededGroove = s => ({
    name: 'g', seed: s, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 14, label: 'g', tag: 'g', voices: [{ players: 10, bpm: 48,
        articulation: 'staccato', notelen: 0.12, scatter: 0.5, jitterMs: 0, level: 7.5,
        pitch: { root: 48 } }] }],
});
[['jitter-driven (RAIN)', seededRain], ['scatter-driven (GROOVE)', seededGroove]].forEach(([what, mk]) => {
    const draws = [11, 12, 13].map(s => render(mk(s)));
    const sigs = draws.map(d => JSON.stringify(d.objects));
    ok(what + ': three seeds give three different draws',
        new Set(sigs).size === 3,
        new Set(sigs).size + ' distinct of 3');
    ok(what + ': each draw is reproducible',
        JSON.stringify(render(mk(11)).objects) === sigs[0]);
    ok(what + ': the texture keeps its character across draws',
        draws.every(d => d.report[0].metrics.sd > 5),
        draws.map(d => d.report[0].metrics.sd).join(' / '));
});
// jitter must not change HOW MANY attacks there are — it displaces, it does not
// add or remove. (Scatter can lose an attack off the end of a fixed window,
// which is correct: the window does not move.)
const rainCounts = [11, 12, 13, 14, 15].map(s => render(seededRain(s)).notes);
ok('a jitter draw never changes the attack count', new Set(rainCounts).size === 1,
    rainCounts.join('/'));
// the inert case, stated rather than assumed: a fully determined texture has
// exactly one draw, and the panel says so instead of silently doing nothing
const flatGallop = s => ({
    name: 'gal', seed: s, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 10, label: 'gal', tag: 'gal', voices: [
        { players: 5, bpm: 110, articulation: 'staccato', notelen: 0.12, pitch: { root: 48 } },
        { players: 5, bpm: 112, articulation: 'staccato', notelen: 0.12, pitch: { root: 48 } }] }],
});
ok('a texture with no stochastic dial is seed-independent BY CONSTRUCTION',
    JSON.stringify(render(flatGallop(1)).objects) === JSON.stringify(render(flatGallop(99)).objects));

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
section('HUMANIZE — the robustness pass (R6, the performance rule)');
// ===========================================================================
// Human timing error is mathematically the SAME operation as the dials already
// here, so this is composition, not new machinery. It must perturb the finished
// arrangement and NOTHING else, or the clean-vs-humanized A/B is not an A/B.
const cleanSpec = () => ({
    name: 'hum', seed: 3, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 10, label: 'hum', tag: 'hum', voices: [{ players: 10, bpm: 110,
        articulation: 'staccato', notelen: 0.12, scatter: 0, jitterMs: 0, level: 7.5,
        pitch: { root: 48 } }] }],
});
const clean = render(cleanSpec());
const human = TX.render(cleanSpec(), Object.assign({}, OPTS, { humanize: {} }));
eq('humanize changes nothing about HOW MANY attacks there are', human.notes, clean.notes);
ok('but it does move them', JSON.stringify(human.objects) !== JSON.stringify(clean.objects));
ok('a dead-even texture stops being dead even', human.report[0].metrics.sd > 10,
    human.report[0].metrics.sd + ' ms (was ' + clean.report[0].metrics.sd + ')');
// stage scatter is FIXED per player, so unlike pure jitter it leaves a figure
ok('stage offset leaves a persistent figure (it is fixed, like scatter)',
    human.report[0].metrics.unevenness > clean.report[0].metrics.unevenness,
    clean.report[0].metrics.unevenness + ' -> ' + human.report[0].metrics.unevenness);
ok('humanize is itself deterministic',
    JSON.stringify(TX.render(cleanSpec(), Object.assign({}, OPTS, { humanize: {} })).objects) ===
    JSON.stringify(human.objects));
eq('the default stage spread is the ~30 ms stage-width ceiling, halved', TX.HUMANIZE.stageMs, 15);
eq('the default human error is the estimate stated in the plan', TX.HUMANIZE.jitterMs, 25);
// THE PREDICTION THIS EXISTS TO TEST (docs/PHASE_SHIFTING.md §6): rain is robust,
// smear is fragile — because human error IS jitter, so it changes rain far less.
const rainSpec = () => {
    const s = cleanSpec(); s.sections[0].voices[0].jitterMs = 45; return s;
};
const rainClean = render(rainSpec());
const rainHum = TX.render(rainSpec(), Object.assign({}, OPTS, { humanize: {} }));
const smearShift = human.report[0].metrics.sd - clean.report[0].metrics.sd;
const rainShift = rainHum.report[0].metrics.sd - rainClean.report[0].metrics.sd;
ok('humanize disturbs SMEAR more than RAIN (the fragility prediction, measured)',
    smearShift > rainShift,
    'smear +' + smearShift.toFixed(1) + ' ms vs rain +' + rainShift.toFixed(1) + ' ms');
ok('humanize is spec-level too, not only an option',
    TX.render(Object.assign(cleanSpec(), { humanize: {} }), OPTS).report[0].metrics.sd > 10);
eq('and `humanize` is a known key, not a typo', render(Object.assign(cleanSpec(),
    { humanize: {} })).unknown.length, 0);

// ===========================================================================
section('INSERT PATH — re-time to the playhead as one draggable group');
// ===========================================================================
const ins = render(PRESETS.density());
const placed = TX.toScoreObjects(ins, 100, { groupId: 'grp-tex-01', startId: 500, color: '#3F7D5A' });
eq('every object comes through', placed.length, ins.objects.length);
const pn0 = placed.filter(o => o.type === 'waveCurve');
eq('the render starts exactly at the playhead', Math.min.apply(null, pn0.map(o => o.startSeconds)), 100);
ok('every object joins the group', placed.every(o => o.groupId === 'grp-tex-01'));
ok('ids are rewritten so nothing collides with the score',
    placed.every(o => /^(wc|mk)-tex-\d+$/.test(o.id)));
ok('note durations are preserved exactly', pn0.every((o, i) => {
    const src = ins.objects.filter(x => x.type === 'waveCurve')[i];
    return Math.abs((o.endSeconds - o.startSeconds) - (src.endSeconds - src.startSeconds)) < 1e-9;
}));
ok('markers travel with it (R9 — the render stays self-describing)',
    placed.some(o => o.type === 'marker'));
ok('marker times shift by the same amount as the notes',
    placed.filter(o => o.type === 'marker').every(o => o.time >= 100 - 1e-6));
eq('the span survives placement', TX.spanOf(ins), +(Math.max.apply(null, pn0.map(o => o.endSeconds)) -
    Math.min.apply(null, pn0.map(o => o.startSeconds))).toFixed(4));
ok('placement does not mutate the source render',
    ins.objects.filter(o => o.type === 'waveCurve')[0].startSeconds !== 100);
// an inserted texture is ORDINARY notes — that is D29's whole point
ok('inserted notes are plain score notes, with no bend field anywhere',
    placed.every(o => o.bend === undefined && o.morphBend === undefined));
ok('...and they stay sonifyMode plain (the proven audition path, trap #5)',
    pn0.every(o => o.sonifyMode === 'plain' && o.recVel != null));

// ===========================================================================
section('PITCH LAYER (§8) — sets, policies, and the physics that follows');
// ===========================================================================
const TON = require('../score/public/tonality.js');
const POPTS = Object.assign({}, OPTS, { tonality: TON, maxLanes: 10 });
const pitchSpec = (policy, set, pool, bpm) => ({
    name: 'p', seed: 11, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 10, label: 'p', tag: 'p', voices: [{ players: 10, bpm: bpm || 110,
        articulation: 'staccato', notelen: 0.12, scatter: 0, jitterMs: 30, level: 7.5,
        pitch: { policy: policy, set: set, root: 48, pool: pool } }] }],
});
const pitchesOf = g => [...new Set(g.objects.filter(o => o.type === 'waveCurve')
    .map(o => o.sonifyNote))].sort((a, b) => a - b);

eq('the palette carries all 15 named sets', TON.names().length, 15);
ok('every set sits inside the tuba ord range',
    TON.names().every(n => TON.setNamed(n).every(p => p >= TON.LO && p <= TON.HI)));

// --- policies
const uni = TX.render(pitchSpec('unison', 'm3 (F)', true), POPTS);
eq('unison ignores the set and holds the root', pitchesOf(uni).length, 1);
eq('...on the root itself', pitchesOf(uni)[0], 48);
const pv = TX.render(pitchSpec('perVoice', 'm3 (F)', true), POPTS);
eq('perVoice gives each of the ten players exactly one pitch', pitchesOf(pv).length, 10);
ok('...register-sorted, lowest on the HIGHEST lane (assignBlast convention)', (() => {
    const byLane = {};
    pv.objects.filter(o => o.type === 'waveCurve').forEach(o => { byLane[o.layer] = o.sonifyNote; });
    const lanes = Object.keys(byLane).map(Number).sort((a, b) => a - b);
    return byLane[lanes[0]] > byLane[lanes[lanes.length - 1]];
})(), JSON.stringify((() => { const b = {}; pv.objects.filter(o => o.type === 'waveCurve')
    .forEach(o => { b[o.layer] = o.sonifyNote; }); return b; })()));
const drw = TX.render(pitchSpec('draw', 'm3 (F)', true), POPTS);
ok('draw uses many of the set', pitchesOf(drw).length > 10, String(pitchesOf(drw).length));
ok('every drawn pitch is IN the set',
    pitchesOf(drw).every(p => TON.pcsPool([...new Set(TON.setNamed('m3 (F)').map(q => q % 12))]).indexOf(p) >= 0));
const cyc = TX.render(pitchSpec('cycle', 'm3 (F)', true), POPTS);
ok('cycle also stays in the set',
    pitchesOf(cyc).every(p => TON.pcsPool([...new Set(TON.setNamed('m3 (F)').map(q => q % 12))]).indexOf(p) >= 0));
ok('draw and cycle are different orderings of the same material',
    JSON.stringify(drw.objects) !== JSON.stringify(cyc.objects));
ok('draw is seeded — same seed, same pitches',
    JSON.stringify(TX.render(pitchSpec('draw', 'm3 (F)', true), POPTS).objects) ===
    JSON.stringify(drw.objects));
ok('...and a new seed redraws them',
    JSON.stringify(TX.render(Object.assign(pitchSpec('draw', 'm3 (F)', true), { seed: 12 }), POPTS).objects) !==
    JSON.stringify(drw.objects));

// --- pooled vs literal
// 'cl low' is a 7-note chromatic cluster F#1-C2, so pooling its pitch classes
// over the whole range genuinely widens it; that is the case the chip exists for.
const pooled = TX.render(pitchSpec('draw', 'cl low', true), POPTS);
const literal = TX.render(pitchSpec('draw', 'cl low', false), POPTS);
ok('POOLED spreads the pitch classes over the whole range',
    pitchesOf(pooled).length > pitchesOf(literal).length,
    pitchesOf(pooled).length + ' vs ' + pitchesOf(literal).length);
ok('...covering a far wider register',
    (Math.max(...pitchesOf(pooled)) - Math.min(...pitchesOf(pooled))) >
    (Math.max(...pitchesOf(literal)) - Math.min(...pitchesOf(literal))));
eq('LITERAL uses exactly the set\'s notes', pitchesOf(literal).length, 7);
ok('...and they ARE the set\'s notes',
    JSON.stringify(pitchesOf(literal)) === JSON.stringify(TON.setNamed('cl low')));
// an OCTAVE set is pool-invariant by construction — one pitch class, already
// spread across the range — so the chip correctly does nothing there
ok('an octave set is pool-invariant (one pitch class, already spread)',
    JSON.stringify(pitchesOf(TX.render(pitchSpec('draw', 'oct F#', true), POPTS))) ===
    JSON.stringify(pitchesOf(TX.render(pitchSpec('draw', 'oct F#', false), POPTS))));

// --- never silently wrong
const bad = TX.render(pitchSpec('draw', 'no such set', true), POPTS);
eq('an unknown set is REPORTED', bad.unresolvedSets.length, 1);
eq('...by name', bad.unresolvedSets[0], 'no such set');
ok('...and it still renders, at the root', pitchesOf(bad).length === 1 && pitchesOf(bad)[0] === 48);
eq('a set name with no tonality module injected is reported too',
    render(pitchSpec('draw', 'm3 (F)', true)).unresolvedSets.length, 1);

// --- THE PHYSICS FOLLOWS THE PITCH (the 2u trap, and the Phase-2 finding)
// C3 is the 10th SHORTEST of the 36 measured staccato samples, and the entire
// 13-experiment research arc ran on that one pitch. So the 23/s ceiling is
// C3-specific: give a texture real pitches and the worst-case ring rises.
const ringAt = p => SL.staccato[p];
ok('the staccato ring is NOT monotonic in pitch (2n multisample sawtooth)',
    ringAt(36) < ringAt(30) && ringAt(42) > ringAt(36),
    [ringAt(30), ringAt(36), ringAt(42), ringAt(48)].join(' / '));
eq('C3 is a comparatively SHORT sample', ringAt(48), 0.42);
ok('...shorter than the range median',
    ringAt(48) < Object.values(SL.staccato).sort((a, b) => a - b)[18]);
const ceilUnison = TX.render(pitchSpec('unison', null, true), POPTS).ceiling;
const ceilSet = TX.render(pitchSpec('draw', 'cl spread', true), POPTS).ceiling;
eq('the unison-C3 ceiling is the familiar ~23/s', ceilUnison.rate, 23.8, 0.2);
ok('a real pitch set LOWERS the ceiling', ceilSet.rate < ceilUnison.rate,
    ceilSet.rate + '/s vs ' + ceilUnison.rate + '/s');
ok('...by roughly a fifth', (ceilUnison.rate - ceilSet.rate) / ceilUnison.rate > 0.15,
    ((1 - ceilSet.rate / ceilUnison.rate) * 100).toFixed(0) + '%');
// and the ring indicator must fire on a density that was fine at unison C3
const at21 = TX.render(pitchSpec('draw', 'cl spread', true, 126), POPTS);
ok('21/s is clean at unison C3 but flags once the set is applied',
    at21.rings.length > 0 && TX.render(pitchSpec('unison', null, true, 126), POPTS).rings.length === 0,
    'set ' + at21.rings.length + ' vs unison ' +
        TX.render(pitchSpec('unison', null, true, 126), POPTS).rings.length);

// ===========================================================================
section('TONALITY MODULE — extracted from clusterview, must not have drifted');
// ===========================================================================
// The remap moved out of clusterview.html so exactly one copy exists. If it
// drifted, every cross-sandbox pitch comparison would quietly mean something
// different in the two places. Randomised equivalence against the documented
// behaviour, including the two cases that make the no-repeat kick subtle:
// simultaneities (same t) and genuine repeats (same srcP).
const evOf = (pitches, times) => pitches.map((p, i) => ({ p: p, srcP: p, t: times[i], v: 80 }));
const r1 = TON.remap(evOf([48, 48, 50], [0, 0, 0]), TON.setNamed('oct F#'), false);
ok('distinct sources colliding on one target get bumped apart',
    new Set(r1.map(e => e.p)).size > 1, JSON.stringify(r1.map(e => e.p)));
const r2 = TON.remap(evOf([48, 48], [0, 1]), TON.setNamed('oct F#'), false);
eq('a genuine repeat in the source STAYS a repeat', r2[0].p, r2[1].p);
ok('every remapped pitch lands in the target set',
    TON.remap(evOf([31, 44, 57, 63], [0, 1, 2, 3]), TON.setNamed('5ths 30'), false)
       .every(e => TON.setNamed('5ths 30').indexOf(e.p) >= 0));
ok('pooled keeps register spread that literal collapses', (() => {
    const src = [32, 40, 48, 56, 64];
    const p = TON.remap(evOf(src, [0, 1, 2, 3, 4]), TON.setNamed('oct F#'), true).map(e => e.p);
    const l = TON.remap(evOf(src, [0, 1, 2, 3, 4]), TON.setNamed('oct F#'), false).map(e => e.p);
    return (Math.max(...p) - Math.min(...p)) >= (Math.max(...l) - Math.min(...l));
})());
ok('remap is deterministic', JSON.stringify(TON.remap(evOf([40, 50, 60], [0, 1, 2]), TON.setNamed('m3 (F)'), true)) ===
    JSON.stringify(TON.remap(evOf([40, 50, 60], [0, 1, 2]), TON.setNamed('m3 (F)'), true)));
ok('the module is pure — no DOM, no node', (() => {
    const src = fs.readFileSync(path.join(ROOT, 'score/public/tonality.js'), 'utf8')
        .split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    return ['document.', 'window.', 'require(', 'fs.', 'Math.random', 'new Date']
        .every(n => src.indexOf(n) < 0);
})());
ok('clusterview loads it rather than defining its own', (() => {
    const cv = fs.readFileSync(path.join(ROOT, 'score/public/clusterview.html'), 'utf8');
    return cv.indexOf('src="/tonality.js"') >= 0 &&
           cv.indexOf('Tonality.remap(') >= 0 &&
           cv.indexOf("'row (placed)': ROW,") < 0;      // the old inline copy is gone
})());

// ===========================================================================
section('CURVES (§7) — any dial automatable, and the shape dial');
// ===========================================================================
eq('linear is the default shape', TX.easeShape(0.5, 'linear'), 0.5);
eq('curveAt hits its breakpoints exactly',
    TX.curveAt([{ t: 0, value: 10 }, { t: 4, value: 20 }], 4, 0), 20);
eq('...and interpolates between them',
    TX.curveAt([{ t: 0, value: 10 }, { t: 4, value: 20 }], 2, 0), 15);
eq('before the first breakpoint it holds',
    TX.curveAt([{ t: 2, value: 10 }, { t: 4, value: 20 }], 0, 0), 10);
eq('after the last it holds too',
    TX.curveAt([{ t: 0, value: 10 }, { t: 4, value: 20 }], 99, 0), 20);
eq('no curve falls back to the scalar', TX.curveAt(null, 3, 7.5), 7.5);
// the "more exponential build" dial: k>0 holds back then rushes, and +k/-k
// must be exact mirrors or "more exponential" is a lopsided control
ok('exp k>0 holds back early', TX.easeShape(0.5, { exp: 2 }) < 0.5);
ok('exp k<0 rushes early', TX.easeShape(0.5, { exp: -2 }) > 0.5);
eq('...and they mirror exactly',
    TX.easeShape(0.5, { exp: 2 }) + TX.easeShape(0.5, { exp: -2 }), 1, 1e-9);
[0.25, 0.5, 0.75].forEach(u => ok('exp stays inside [0,1] at u=' + u,
    TX.easeShape(u, { exp: 3 }) > 0 && TX.easeShape(u, { exp: 3 }) < 1));
eq('every shape pins the endpoints', TX.easeShape(0, { exp: 3 }), 0, 1e-12);
eq('...both of them', TX.easeShape(1, { exp: 3 }), 1, 1e-12);

// a bpm curve really drives density
const curved = spec => render(Object.assign({
    name: 'c', seed: 5, t0: 0, gap: 0, notelen: 0.12 }, spec));
const ramp = curved({ sections: [{ dur: 20, label: 'c', tag: 'c', voices: [{ players: 10,
    articulation: 'staccato', notelen: 0.12, level: 7.5, bpm: 60, pitch: { root: 48 },
    curves: { bpm: [{ t: 0, value: 60 }, { t: 20, value: 120 }] } }] }] });
const firstHalf = ramp.objects.filter(o => o.type === 'waveCurve' && o.startSeconds < 10).length;
const secondHalf = ramp.objects.filter(o => o.type === 'waveCurve' && o.startSeconds >= 10).length;
// steadyOnsets INTEGRATES rate(t), so the counts are predictable in closed form
// rather than approximate: for a linear a->b ramp over T, the two halves hold
// (3a+b)/4 and (a+3b)/4 of the mean rate, i.e. a ratio of exactly (a+3b)/(3a+b).
// Asserting the predicted number is a far stronger check than "it went up".
const predictedRatio = (60 + 3 * 120) / (3 * 60 + 120);          // = 1.4
eq('a bpm curve drives density by exact integration, not stepwise',
    secondHalf / firstHalf, predictedRatio, 0.05);
eq('...and the total matches the integral of the ramp',
    firstHalf + secondHalf, 10 * ((60 + 120) / 2) / 60 * 20, 6);
// level and techMix
const lvl = curved({ sections: [{ dur: 8, label: 'c', tag: 'c', voices: [{ players: 4, bpm: 60,
    articulation: 'staccato', notelen: 0.12, level: 2, pitch: { root: 48 },
    curves: { level: [{ t: 0, value: 2 }, { t: 8, value: 10 }] } }] }] });
const vels = lvl.objects.filter(o => o.type === 'waveCurve').map(o => o.recVel);
ok('a level curve drives velocity across the span', vels[vels.length - 1] > vels[0] * 2,
    vels[0] + ' -> ' + vels[vels.length - 1]);
const mixed = curved({ sections: [{ dur: 20, label: 'c', tag: 'c', voices: [{ players: 10, bpm: 90,
    articulation: 'staccato', notelen: 0.12, level: 7.5, pitch: { root: 48 },
    curves: { techMix: [{ t: 0, value: { staccato: 1 } },
                        { t: 20, value: { staccato: 0, ord: 1 } }] } }] }] });
const techEarly = mixed.objects.filter(o => o.type === 'waveCurve' && o.startSeconds < 3)
    .map(o => o.technique);
const techLate = mixed.objects.filter(o => o.type === 'waveCurve' && o.startSeconds > 17)
    .map(o => o.technique);
// A crossfade is PROBABILISTIC by design — at t=2 of a 20 s fade the mix is
// still ~90/10, so a stray `ord` early is the mechanism working, not a fault.
// Assert the proportion, which is what "crossfade" actually means.
const pct = (arr, t) => arr.filter(x => x === t).length / Math.max(1, arr.length);
ok('an articulation crossfade is mostly the FIRST technique early',
    pct(techEarly, 'staccato') > 0.8, (pct(techEarly, 'staccato') * 100).toFixed(0) + '% staccato');
ok('...and mostly the SECOND late',
    pct(techLate, 'ord') > 0.8, (pct(techLate, 'ord') * 100).toFixed(0) + '% ord');
ok('...crossing over in between', (() => {
    const mid = mixed.objects.filter(o => o.type === 'waveCurve' &&
        o.startSeconds > 9 && o.startSeconds < 11).map(o => o.technique);
    return pct(mid, 'ord') > 0.25 && pct(mid, 'ord') < 0.75;
})());
ok('...seeded, so the same spec draws the same techniques',
    JSON.stringify(mixed.objects) === JSON.stringify(curved({ sections: [{ dur: 20, label: 'c',
        tag: 'c', voices: [{ players: 10, bpm: 90, articulation: 'staccato', notelen: 0.12,
        level: 7.5, pitch: { root: 48 }, curves: { techMix: [{ t: 0, value: { staccato: 1 } },
        { t: 20, value: { staccato: 0, ord: 1 } }] } }] }] }).objects));

// ===========================================================================
section('CATEGORY MORPH — does it really connect the two models?');
// ===========================================================================
// The gate: engine metrics at t=0 / t=end must match the STATIC models'. The
// curve arrives at 24 s and HOLDS to 34 s so the tail is genuinely at the
// destination rather than still in transit — measuring a moving window against
// a static model would be comparing the journey to the arrival.
const MODELS = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/texture_models.json'), 'utf8')).models;
const statOf = name => TX.render(MODELS[name].spec, POPTS).report[0].metrics;
const mRain = statOf('RAIN'), mGroove = statOf('GROOVE');
const bp = (a, b) => [{ t: 0, value: a }, { t: 24, value: b }, { t: 34, value: b }];
const morphSpec = {
    name: 'm', seed: 11, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 34, label: 'RAIN -> GROOVE', tag: 'm', voices: [{ players: 10, bpm: 110,
        articulation: 'staccato', notelen: 0.12, level: 7.5, pitch: { policy: 'unison', root: 48 },
        curves: { bpm: bp(110, 48), jitterMs: bp(45, 0), scatter: bp(0, 0.5) } }] }],
};
const morphed = TX.render(morphSpec, POPTS);
const winMetrics = (g, a, b, per) => TX.metricsOf(
    TX.windowNotes(g, a, b).filter(o => o.type === 'waveCurve')
        .map(o => ({ t: o.startSeconds, lane: o.layer })), per);
const mHead = winMetrics(morphed, 0, 8, 60 / 110);
const mTail = winMetrics(morphed, 26, 34, 60 / 48);
ok('the morph renders and is playable', morphed.notes > 0 && morphed.summary.hard === 0);
ok('its head matches static RAIN on cv (within 10%)',
    Math.abs(mHead.cv - mRain.cv) / mRain.cv < 0.10,
    mHead.cv + ' vs ' + mRain.cv);
ok('its plateau matches static GROOVE on cv (within 10%)',
    Math.abs(mTail.cv - mGroove.cv) / mGroove.cv < 0.10,
    mTail.cv + ' vs ' + mGroove.cv);
ok('...and on unevenness, the figure metric',
    Math.abs(mTail.unevenness - mGroove.unevenness) < 0.15,
    mTail.unevenness + ' vs ' + mGroove.unevenness);
ok('the figure genuinely emerges across the morph', mTail.unevenness > mHead.unevenness * 2,
    mHead.unevenness + ' -> ' + mTail.unevenness);
// cv exists because sd cannot survive a density change
ok('cv is density-independent where sd is not', (() => {
    const slow = curved({ sections: [{ dur: 12, label: 'c', tag: 'c', voices: [{ players: 10,
        bpm: 55, articulation: 'staccato', notelen: 0.12, level: 7.5, jitterMs: 45,
        pitch: { root: 48 } }] }] }).report[0].metrics;
    const fast = curved({ sections: [{ dur: 12, label: 'c', tag: 'c', voices: [{ players: 10,
        bpm: 110, articulation: 'staccato', notelen: 0.12, level: 7.5, jitterMs: 45,
        pitch: { root: 48 } }] }] }).report[0].metrics;
    return Math.abs(slow.sd - fast.sd) > 3 && Math.abs(slow.cv - fast.cv) < Math.abs(slow.sd - fast.sd);
})());

// ===========================================================================
section('POCKETS (§10) — parametric first, literal as the exact fallback');
// ===========================================================================
const fz = TX.windowToSpec(morphSpec, 10, 18, { mode: 'freeze' });
const mv = TX.windowToSpec(morphSpec, 10, 18, { mode: 'moving' });
eq('a pocket is one section', fz.sections.length, 1);
eq('...of the window\'s length', fz.sections[0].dur, 8);
ok('FREEZE holds the dial state — no curves survive', fz.sections[0].voices[0].curves == null);
ok('...at the window\'s own values, not the spec\'s',
    Math.abs(fz.sections[0].voices[0].bpm - 110) > 1 &&
    Math.abs(fz.sections[0].voices[0].jitterMs - 45) > 1,
    'bpm ' + fz.sections[0].voices[0].bpm + ', jitter ' + fz.sections[0].voices[0].jitterMs);
ok('MOVING keeps a two-point curve per dial that actually moved',
    mv.sections[0].voices[0].curves && Object.keys(mv.sections[0].voices[0].curves).length >= 2,
    JSON.stringify(Object.keys(mv.sections[0].voices[0].curves || {})));
ok('both pockets render', TX.render(fz, POPTS).notes > 0 && TX.render(mv, POPTS).notes > 0);
ok('a pocket is still a MODEL — a new seed gives a new draw of it',
    JSON.stringify(TX.render(fz, POPTS).objects) !==
    JSON.stringify(TX.render(Object.assign(JSON.parse(JSON.stringify(fz)), { seed: 99 }), POPTS).objects));

// THE DETERMINISM SUBTLETY (plan §10). A literal clip must SLICE the full
// render, never re-seed a short one: the jitter stream draws per attack across
// the whole timeline, so an attack at t=10 uses a completely different draw in
// an 8-second render than in a 34-second one.
const sliced = TX.windowNotes(morphed, 10, 18).filter(o => o.type === 'waveCurve');
const slicedAgain = TX.windowNotes(TX.render(morphSpec, POPTS), 10, 18)
    .filter(o => o.type === 'waveCurve');
ok('a literal clip reproduces the window byte-identically',
    JSON.stringify(sliced) === JSON.stringify(slicedAgain), sliced.length + ' notes');
ok('...and it is NOT what re-rendering a short spec gives',
    JSON.stringify(sliced.map(o => o.startSeconds)) !==
    JSON.stringify(TX.render(mv, POPTS).objects.filter(o => o.type === 'waveCurve')
        .map(o => o.startSeconds)),
    'if these ever match, the trap has been silently reintroduced');
ok('a literal clip starts at zero',
    Math.min.apply(null, sliced.map(o => o.startSeconds)) >= 0 &&
    Math.min.apply(null, sliced.map(o => o.startSeconds)) < 1);
ok('...and stays inside the window length',
    Math.max.apply(null, sliced.map(o => o.startSeconds)) <= 8 + 1e-6);

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

// ---- SAMPLE RING, the conflict D17 structurally cannot see ----
// D17 compares WRITTEN note bounds. A fixed one-shot rings for its measured
// length whatever was written (D9), so a staccato re-attacked faster than its
// ring is a player playing over themselves while the badge reads 0 hard — and
// the mock-up renders it cleanly (2r), so the ear cannot catch it either.
const overCeiling = render({
    name: 'ring', seed: 1, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 6, label: 'ring', tag: 'ring', voices: [{ players: 10, bpm: 200,
        articulation: 'staccato', notelen: 0.12, level: 7.5, pitch: { root: 48 } }] }],
});
eq('33/s staccato reads as ZERO hard under the written-bounds law', overCeiling.summary.hard, 0);
ok('...but the ring indicator catches it', overCeiling.rings.length > 0,
    JSON.stringify(overCeiling.rings));
eq('...and names the real gap', overCeiling.rings[0].tightest, 0.3, 0.01);
eq('...against the measured ring', overCeiling.rings[0].ring, SL.staccato[48]);
// aggregated, not one row per expanded per-player voice
eq('...as ONE row for the whole group, not ten', overCeiling.rings.length, 1);
eq('...counting all ten players', overCeiling.rings[0].players, 10);
const underCeiling = render({
    name: 'ring2', seed: 1, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 6, label: 'ring2', tag: 'ring2', voices: [{ players: 10, bpm: 110,
        articulation: 'staccato', notelen: 0.12, level: 7.5, pitch: { root: 48 } }] }],
});
eq('at 18/s the ring is clear and nothing is reported', underCeiling.rings.length, 0);
ok('variable-length techniques are clamped instead, never ring-flagged',
    render(oneVoice('ord', 2.0, 60)).rings.length === 0);
// the whole research corpus sits inside the ring — that is what made it usable
Object.entries(CORPUS).forEach(([preset, file]) => {
    ok(file + ' stays inside the sample ring', render(PRESETS[preset]()).rings.length === 0,
        JSON.stringify(render(PRESETS[preset]()).rings));
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

// LONG RENDERS need a time-stamp on screen or the composer cannot name a window
// ("28-35 s is interesting"), which is the entire input to the pocket workflow.
const longRender = render({
    name: 'long', seed: 1, t0: 0, gap: 0, notelen: 0.12,
    sections: [{ dur: 90, label: 'a long process', tag: 'lp', markEvery: 10,
        voices: [{ players: 10, bpm: 110, articulation: 'staccato', notelen: 0.12,
            level: 7.5, pitch: { root: 48 } }] }],
});
const lm = longRender.objects.filter(o => o.type === 'marker').sort((a, b) => a.time - b.time);
ok('a long section carries periodic time markers', lm.length >= 9, String(lm.length));
ok('...so no gap is longer than the marking interval', (() => {
    for (let i = 1; i < lm.length; i++) if (lm[i].time - lm[i - 1].time > 10.5) return false;
    return true;
})());
ok('...and they name the elapsed time', /\d+s$/.test(lm[1].label), lm[1].label);
// THE PASSTHROUGH BUG THIS CAUGHT: normaliseSpec used to rebuild a section
// field-by-field, so any key not on its list was silently dropped — markEvery
// was added, did nothing, and looked like a marker bug rather than a plumbing
// one. The section is now copied wholesale.
ok('normaliseSpec carries UNLISTED section fields through', (() => {
    const n = TX.normaliseSpec({ name: 'x', seed: 1, sections: [{ dur: 4, label: 'x', tag: 'x',
        markEvery: 2, someFutureField: 'kept',
        voices: [{ players: 2, bpm: 60, articulation: 'staccato', notelen: 0.12,
            pitch: { root: 48 } }] }] }, { maxLanes: 10 });
    return n.sections[0].markEvery === 2 && n.sections[0].someFutureField === 'kept';
})());

// ===========================================================================
console.log('\n' + '='.repeat(58));
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach(f => console.log('  x ' + f));
    process.exit(1);
}
console.log('  texture engine OK');
