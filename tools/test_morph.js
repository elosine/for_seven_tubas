#!/usr/bin/env node
// test_morph.js — unit tests over the pure morph engine (PLAN 2v Phase 1).
//
// No server, no audio, no MIDI. This is the cheap half of verification: it pins
// the things that are TRUE BY CONSTRUCTION (bend encoding, determinism, carrier
// invariants, flag logic) so the expensive half — listening in the running app —
// is spent only on the things a test cannot judge.
//
//   node tools/test_morph.js

const M = require('../score/public/morph.js');

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

// ===========================================================================
section('bend encoding (§13.5 — wrong byte order = wild pitch jumps)');
// ===========================================================================
eq('centre is 8192', M.bendValue(0), 8192);
// at the MEASURED range of 1.99 st, +199 c is very nearly full bend
eq('+199 c ~ full up', M.bendValue(199) > 16000, true);
eq('-199 c ~ full down', M.bendValue(-199) < 400, true);
eq('+50 c is a quarter of the way up', M.bendValue(50), 8192 + Math.round(50 / 199 * 8192), 6);
ok('clamped at the top', M.bendValue(9999) === 16383);
ok('clamped at the bottom', M.bendValue(-9999) === 0);
// byte order: LSB first, then MSB
const b = M.bendBytes(0, 1);
eq('status byte is 0xE0 on ch1', b[0], 0xE0);
eq('centre LSB', b[1], 0);
eq('centre MSB', b[2], 64);
const b2 = M.bendBytes(0, 5);
eq('channel 5 encodes in the status nibble', b2[0], 0xE4);
const hi = M.bendBytes(199, 1);
ok('LSB and MSB are both 7-bit', hi[1] <= 127 && hi[2] <= 127, JSON.stringify(hi));
ok('a bend up raises the MSB', hi[2] > 64);

// ===========================================================================
section('determinism (§2 — same params + seed => identical render)');
// ===========================================================================
const base = {
    model: 'M6', seed: 3,
    source: { kind: 'pitches', midi: [34, 41, 46, 50, 53, 58] },
    carrier: { span: 30, segLen: 8, segVar: 0.35, striation: 'staggered' },
};
const r1 = M.render(base);
const r2 = M.render(JSON.parse(JSON.stringify(base)));
ok('two renders are byte-identical', JSON.stringify(r1) === JSON.stringify(r2));
const r3 = M.render(Object.assign({}, base, { seed: 4 }));
ok('a new seed changes the render', JSON.stringify(r1) !== JSON.stringify(r3));
ok('render produced notes', r1.notes.length > 0, String(r1.notes.length));

// ===========================================================================
section('carrier invariants');
// ===========================================================================
const car = M.render(Object.assign({}, base, { carrier: { span: 30, segLen: 8, segVar: 0.3, striation: 'staggered' } }));
let overlap = 0, outside = 0;
const byVoice = {};
car.notes.forEach(n => { (byVoice[n.voice] = byVoice[n.voice] || []).push(n); });
Object.keys(byVoice).forEach(v => {
    const list = byVoice[v].slice().sort((a, b) => a.tStart - b.tStart);
    for (let i = 1; i < list.length; i++) {
        if (list[i].tStart < list[i - 1].tStart + list[i - 1].dur - 1e-6) overlap++;
    }
});
car.notes.forEach(n => { if (n.tStart < -1e-6 || n.tStart > 30 + 1e-6) outside++; });
eq('no voice ever double-books itself', overlap, 0);
eq('no note starts outside the span', outside, 0);
eq('engine agrees it has no hard conflicts', car.summary.hard, 0);
ok('every voice got at least one segment',
    Object.keys(byVoice).length === 6, Object.keys(byVoice).length + ' of 6');

// breath gaps are respected
let tooTight = 0;
Object.keys(byVoice).forEach(v => {
    const list = byVoice[v].slice().sort((a, b) => a.tStart - b.tStart);
    for (let i = 1; i < list.length; i++) {
        const gap = list[i].tStart - (list[i - 1].tStart + list[i - 1].dur);
        if (gap < 0.40 - 1e-6) tooTight++;
    }
});
eq('no gap below the snatch-breath floor', tooTight, 0);

// a long segLen must be SPLIT and flagged, never silently truncated
const longSeg = M.render(Object.assign({}, base, {
    carrier: { span: 60, segLen: 40, segVar: 0, striation: 'staggered' },
}));
const maxDur = Math.max.apply(null, longSeg.notes.map(n => n.dur));
ok('an over-long segment is capped by the breath table', maxDur <= 18 + 1e-6, 'max ' + maxDur);
ok('and the cap is flagged BREATH', (longSeg.summary.flags.BREATH || 0) > 0);

// segLen is a DIAL, not a branch: short segLen => pulsed, same code
const pulsed = M.render(Object.assign({}, base, {
    carrier: { span: 30, segLen: 0.5, segVar: 0.2, striation: 'staggered' },
}));
ok('short segLen yields many more notes than long',
    pulsed.notes.length > car.notes.length, pulsed.notes.length + ' vs ' + car.notes.length);

// ===========================================================================
section('dials');
// ===========================================================================
eq('bias 0 is linear', M.applyBias(0.5, 0), 0.5, 1e-9);
ok('bias +1 is back-loaded', M.applyBias(0.5, 1) < 0.5);
ok('bias -1 is front-loaded', M.applyBias(0.5, -1) > 0.5);
const order = M.staggerOrder(6, 3);
eq('stagger order is a permutation', order.slice().sort((a, b) => a - b).join(','), '0,1,2,3,4,5');
// depth 0.5 travels half as far
const d1 = M.render(Object.assign({}, base, { model: 'M5', target: { steps: 4 }, dials: { bias: 0, spread: 0, depth: 1 } }));
const dHalf = M.render(Object.assign({}, base, { model: 'M5', target: { steps: 4 }, dials: { bias: 0, spread: 0, depth: 0.5 } }));
const travel = r => Math.max.apply(null, r.notes.map(n => Math.abs(n.bend[n.bend.length - 1][1])));
ok('depth 0.5 travels about half as far as depth 1',
    Math.abs(travel(dHalf) / Math.max(1e-6, travel(d1)) - 0.5) < 0.25,
    (travel(dHalf) / travel(d1)).toFixed(2));

// ===========================================================================
section('models');
// ===========================================================================
// M2 spectral targets — partial cents must be right or the whole model is wrong
eq('partial 2 is an octave', M.partialCents(41, 2) - 41 * 100, 1200);
eq('partial 3 is an octave + a fifth', M.partialCents(41, 3) - 41 * 100, 1902, 1);
eq('partial 7 is 969 c (the flat seventh)', M.partialCents(41, 7) - 41 * 100, 3369, 1);
eq('partial 11 is the half-sharp', (M.partialCents(41, 11) - 41 * 100) % 1200, 551, 2);

// M4 moves technique, never pitch
const m4 = M.render(Object.assign({}, base, {
    model: 'M4', target: { path: ['ord', 'bisb', 'flz'] },
    carrier: { span: 30, segLen: 3, segVar: 0, striation: 'staggered' },
}));
const m4Techs = {};
m4.notes.forEach(n => { m4Techs[n.technique] = 1; });
ok('M4 visits more than one technique', Object.keys(m4Techs).length > 1, Object.keys(m4Techs).join(','));
const m4Bend = Math.max.apply(null, m4.notes.map(n => Math.max.apply(null, n.bend.map(p => Math.abs(p[1])))));
eq('M4 does not move pitch at all', m4Bend, 0);

// M6 moves level, never pitch or technique
const m6 = M.render(Object.assign({}, base, { model: 'M6', target: { amount: 0.45, turns: 1 } }));
const m6Bend = Math.max.apply(null, m6.notes.map(n => Math.max.apply(null, n.bend.map(p => Math.abs(p[1])))));
eq('M6 does not move pitch', m6Bend, 0);
const levels = [];
m6.notes.forEach(n => n.level.forEach(p => levels.push(p[1])));
ok('M6 actually rotates the balance',
    Math.max.apply(null, levels) - Math.min.apply(null, levels) > 1.5,
    (Math.max.apply(null, levels) - Math.min.apply(null, levels)).toFixed(1));

// M1 detune bloom splits the chord both ways.
// NOTE: measure absolute pitch against the voice's STARTING pitch, not the
// note's own `bend` envelope — bend is note-relative, so a note late in the
// span only carries the movement remaining inside its own duration.
const M1_SRC = [34, 41, 46, 50, 53, 58];
const m1 = M.render(Object.assign({}, base, { model: 'M1', dials: { bias: 0, spread: 0, depth: 1 } }));
const drift = m1.notes.filter(n => n.tStart > 20)
    .map(n => n.cents - M1_SRC[n.voice] * 100);
ok('M1 sends voices in both directions',
    drift.some(v => v > 20) && drift.some(v => v < -20), JSON.stringify(drift.slice(0, 6)));
const maxDrift = Math.max.apply(null, m1.notes.map(n => Math.abs(n.cents - M1_SRC[n.voice] * 100)));
ok('M1 reaches about a quarter tone at full depth',
    Math.abs(maxDrift - 50) < 6, 'max drift ' + maxDrift.toFixed(1) + ' c');

// ===========================================================================
section('feasibility & flags (never refuse, never silently skip — D16)');
// ===========================================================================
const fe1 = M.feasibleTechnique('cuivre', 40);      // cuivre is 60-67 only
ok('an out-of-range technique is substituted', fe1.technique !== 'cuivre');
ok('and the substitution is flagged', fe1.flagged === true);
const fe2 = M.feasibleTechnique('ord', 46);
ok('an in-range technique is left alone', fe2.technique === 'ord' && fe2.flagged === false);

const rangeR = M.render(Object.assign({}, base, {
    model: 'M4', target: { path: ['cuivre'] },
    source: { kind: 'pitches', midi: [34, 36, 38] },
}));
ok('a whole render of infeasible technique still produces notes', rangeR.notes.length > 0);
ok('and flags RANGE rather than dropping them', (rangeR.summary.flags.RANGE || 0) > 0);

// a bend wider than the patch allows must be flagged GLISS, not silently clipped
const wide = M.render({
    model: 'M3', seed: 1,
    source: { kind: 'pitches', midi: [40, 44] },
    target: { midi: [52, 56] },
    dials: { bias: 0, spread: 0, depth: 1 },
    carrier: { span: 20, segLen: 18, segVar: 0, striation: 'aligned' },
});
ok('a 12-semitone fan exceeds the patch and says so', (wide.summary.flags.GLISS || 0) > 0);
ok('bendReach is the measured range', Math.abs(M.bendReach() - 199) < 1);

// unknown params are reported
const warn = M.render(Object.assign({}, base, { sped: 3, wobble: 1 }));
eq('unrecognised keys are reported, not ignored', warn.warnings.length, 2);

// D9: fixed-class techniques take their true sample length
const fixed = M.render(Object.assign({}, base, {
    model: 'M4', target: { path: ['staccato'] },
    carrier: { span: 20, segLen: 6, segVar: 0, striation: 'staggered' },
}));
const stac = fixed.notes.filter(n => n.technique === 'staccato');
ok('staccato notes exist', stac.length > 0);
ok('and none is longer than a staccato sample',
    stac.every(n => n.dur <= 0.55), 'max ' + Math.max.apply(null, stac.map(n => n.dur)));

// ===========================================================================
section('envelopes are NOTE-RELATIVE (§13.7 — survive drag and scale)');
// ===========================================================================
const env = M.render(base);
let relOk = true;
env.notes.forEach(n => {
    if (n.bend[0][0] !== 0) relOk = false;
    if (Math.abs(n.bend[n.bend.length - 1][0] - n.dur) > 0.02) relOk = false;
});
ok('every bend envelope starts at 0 and ends at the note duration', relOk);
ok('every note starts its own bend at 0 cents offset',
    env.notes.every(n => n.bend[0][1] === 0));

// ===========================================================================
section('score conversion');
// ===========================================================================
const objs = M.toScoreObjects(env, 100, { groupId: 'grp-morph-01', label: 'TEST' });
eq('one score object per note', objs.length, env.notes.length);
ok('all are waveCurves on lanes 0-9',
    objs.every(o => o.type === 'waveCurve' && o.layer >= 0 && o.layer < 10));
ok('times are offset by the placement point',
    Math.abs(objs[0].startSeconds - (100 + env.notes[0].tStart)) < 1e-6);
ok('nodes are strictly increasing in pos', objs.every(o => {
    for (let i = 1; i < o.nodes.length; i++) if (o.nodes[i].pos <= o.nodes[i - 1].pos) return false;
    return true;
}));
ok('nodes stay within 0..1', objs.every(o => o.nodes.every(n => n.pos >= 0 && n.pos <= 1)));
ok('levels stay within 0..10', objs.every(o => o.nodes.every(n => n.y >= 0 && n.y <= 10)));
ok('segments count matches nodes', objs.every(o => o.segments.length === o.nodes.length - 1));
ok('each carries a sonifyNote and technique',
    objs.every(o => typeof o.sonifyNote === 'number' && !!o.technique));
ok('bend rides along as morphBend', objs.every(o => Array.isArray(o.morphBend)));

// ===========================================================================
console.log('\n' + '='.repeat(58));
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach(f => console.log('  x ' + f));
    process.exit(1);
}
console.log('  morph engine OK');
