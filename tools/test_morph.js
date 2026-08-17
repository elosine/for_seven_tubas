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

// STAGGER IS THE WHOLE POINT of a non-aligned striation: if every voice enters
// at the same instant the seam is naked. A previous version offset the first
// entry backwards and clamped negatives to zero, collapsing all voices onto 0.
const firstOnsets = {};
car.notes.forEach(n => {
    if (firstOnsets[n.voice] == null || n.tStart < firstOnsets[n.voice]) firstOnsets[n.voice] = n.tStart;
});
const entries = Object.keys(firstOnsets).map(k => firstOnsets[k]);
ok('staggered striation gives voices distinct entry times',
    new Set(entries.map(v => Math.round(v * 20))).size >= 4, JSON.stringify(entries));
eq('and raises no SEAM flags', car.summary.soft.SEAM || 0, 0);
// aligned is the deliberate opposite and must still collapse to one instant
const alignedR = M.render(Object.assign({}, base, {
    carrier: { span: 30, segLen: 8, segVar: 0, striation: 'aligned' } }));
const alignedFirst = {};
alignedR.notes.forEach(n => {
    if (alignedFirst[n.voice] == null || n.tStart < alignedFirst[n.voice]) alignedFirst[n.voice] = n.tStart;
});
eq('aligned striation enters together on purpose',
    new Set(Object.keys(alignedFirst).map(k => alignedFirst[k])).size, 1);

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
// Total travel must be measured as ABSOLUTE pitch against the voice's starting
// pitch. A note's `bend` is relative to its own played key, and a wide move is
// now split across several re-keyed notes, so the last bend value of one note is
// only that note's share of the journey.
const travel = r => {
    const start = {};
    r.notes.forEach(n => { if (start[n.voice] == null) start[n.voice] = n.cents; });
    return Math.max.apply(null, r.notes.map(n =>
        Math.abs((n.cents + n.bend[n.bend.length - 1][1]) - start[n.voice])));
};
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
section('dynamics is a LAYER on every model (composer 2026-08-16, option b)');
// ===========================================================================
const levelRange = r => {
    const v = [];
    r.notes.forEach(n => n.level.forEach(p => v.push(p[1])));
    return Math.max.apply(null, v) - Math.min.apply(null, v);
};
// the whole point of option (b): pitch models swell too, without asking
['M1', 'M2', 'M3', 'M4', 'M5'].forEach(mod => {
    const r = M.render(Object.assign({}, base, {
        model: mod,
        target: mod === 'M3' ? { midi: [36, 43, 48, 52, 55, 60] }
              : mod === 'M2' ? { fundamental: 41, partials: [2, 3, 4, 5, 6, 7] }
              : mod === 'M4' ? { path: ['ord', 'bisb'] }
              : mod === 'M5' ? { steps: 2 } : null,
    }));
    ok(mod + ' carries a dynamic contour by default', levelRange(r) > 1.0,
        'level range ' + levelRange(r).toFixed(1));
});
// ...and it can be switched off. Measured on the LAST breakpoint of each note,
// which is the shape's own value: the carrier still prepends a re-entry swell to
// every segment after the first to hide the breath seam, and that is a carrier
// feature independent of the dynamic shape.
const flat = M.render(Object.assign({}, base, { model: 'M2',
    target: { fundamental: 41, partials: [2, 3, 4, 5, 6, 7] },
    dyn: { base: 0.6, shape: 'flat' } }));
const shapeVals = flat.notes.map(n => n.level[n.level.length - 1][1]);
ok("shape 'flat' contributes no contour of its own",
    Math.max.apply(null, shapeVals) - Math.min.apply(null, shapeVals) < 0.01,
    'spread ' + (Math.max.apply(null, shapeVals) - Math.min.apply(null, shapeVals)).toFixed(3));
ok("and 'flat' still gets the seam-hiding re-entry swell", levelRange(flat) > 1.0,
    'level range ' + levelRange(flat).toFixed(1));

// M6's identity: dynamics ONLY. Nothing else may move.
const m6b = M.render(Object.assign({}, base, { model: 'M6' }));
eq('M6 defaults to the rotate shape', M.normaliseParams({ model: 'M6' }).dyn.shape, 'rotate');
eq('other models default to swell', M.normaliseParams({ model: 'M2' }).dyn.shape, 'swell');
const m6Techs = {};
m6b.notes.forEach(n => { m6Techs[n.technique] = 1; });
eq('M6 holds technique', Object.keys(m6Techs).length, 1);
ok('M6 still moves level', levelRange(m6b) > 1.5, levelRange(m6b).toFixed(1));

// shapes behave as named
const shp = s => M.render(Object.assign({}, base, { model: 'M2',
    target: { fundamental: 41, partials: [2, 3, 4, 5] },
    dials: { bias: 0, spread: 0, depth: 1 },
    dyn: { base: 0.5, shape: s, amount: 0.4, spread: 0 },
    carrier: { span: 30, segLen: 2, segVar: 0, striation: 'aligned' } }));
const firstLast = r => {
    const v0 = r.notes.filter(n => n.voice === 0).sort((a, b) => a.tStart - b.tStart);
    return [v0[0].level[0][1], v0[v0.length - 1].level[v0[v0.length - 1].level.length - 1][1]];
};
const ri = firstLast(shp('rise'));
ok('rise ends louder than it starts', ri[1] > ri[0] + 1, JSON.stringify(ri));
const fa = firstLast(shp('fall'));
ok('fall ends quieter than it starts', fa[1] < fa[0] - 1, JSON.stringify(fa));
const sw = shp('swell');
const swV0 = sw.notes.filter(n => n.voice === 0).sort((a, b) => a.tStart - b.tStart);
const swMid = swV0[Math.floor(swV0.length / 2)].level[0][1];
ok('swell peaks in the middle', swMid > firstLast(sw)[0] + 1 && swMid > firstLast(sw)[1] + 1,
    'mid ' + swMid.toFixed(1) + ' vs ends ' + JSON.stringify(firstLast(sw)));
ok('level never leaves 0.4..10', sw.notes.every(n => n.level.every(p => p[1] >= 0.4 && p[1] <= 10)));

// dyn.spread fans the voices apart in time
const together = M.render(Object.assign({}, base, { model: 'M6', dyn: { base: 0.6, shape: 'rotate', amount: 0.4, spread: 0 } }));
const fanned = M.render(Object.assign({}, base, { model: 'M6', dyn: { base: 0.6, shape: 'rotate', amount: 0.4, spread: 1 } }));
const spreadAt = r => {
    const early = r.notes.filter(n => n.tStart < 6).map(n => n.level[0][1]);
    return early.length > 1 ? Math.max.apply(null, early) - Math.min.apply(null, early) : 0;
};
ok('dyn.spread 1 makes voices differ more than spread 0',
    spreadAt(fanned) > spreadAt(together),
    spreadAt(fanned).toFixed(1) + ' vs ' + spreadAt(together).toFixed(1));

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

// SEGMENTED RE-KEY (plan §8): a fan wider than the patch's +/-2 semitones is
// SPLIT into consecutive re-keyed notes rather than clipped or refused.
const wide = M.render({
    model: 'M3', seed: 1,
    source: { kind: 'pitches', midi: [40, 44] },
    target: { midi: [52, 56] },
    dials: { bias: 0, spread: 0, depth: 1 },
    carrier: { span: 20, segLen: 18, segVar: 0, striation: 'aligned' },
});
ok('bendReach is the measured range', Math.abs(M.bendReach() - 199) < 1);
ok('a 12-semitone fan is re-keyed, not refused', (wide.summary.flags.REKEY || 0) > 0);
eq('and therefore never left unplayable as GLISS', wide.summary.flags.GLISS || 0, 0);
ok('every note stays inside the patch bend range',
    wide.notes.every(n => n.bend.every(p => Math.abs(p[1]) <= M.bendReach() + 0.5)),
    'max ' + Math.max.apply(null, wide.notes.map(n =>
        Math.max.apply(null, n.bend.map(p => Math.abs(p[1]))))).toFixed(1));
// the split pieces must be CONTIGUOUS — a gap would be an audible break, not a
// fingering change under a slur
const wv0 = wide.notes.filter(n => n.voice === 0).sort((a, b) => a.tStart - b.tStart);
ok('a re-keyed voice produced more than one note', wv0.length > 1, String(wv0.length));
let contiguous = true;
for (let i = 1; i < wv0.length; i++) {
    const gap = wv0[i].tStart - (wv0[i - 1].tStart + wv0[i - 1].dur);
    if (gap > 0.02 && gap < 0.3) contiguous = false;   // 0 = slurred, >0.3 = a real breath
}
ok('re-key splits are contiguous (slurred), not gapped', contiguous);
// and the whole journey still arrives: 40 -> 52 is 12 semitones
const arrive = (wv0[wv0.length - 1].cents + wv0[wv0.length - 1].bend[wv0[wv0.length - 1].bend.length - 1][1]);
ok('the fan still reaches its target after re-keying',
    Math.abs(arrive - 5200) < 60, 'arrived at ' + (arrive / 100).toFixed(2) + ' vs 52.00');

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

// morphBend must be relative to the PLAYED KEY, residual folded in — otherwise
// every microtonal target plays at the nearest semitone and nothing shows it.
const micro = M.render({
    model: 'M2', seed: 1,
    source: { kind: 'pitches', midi: [41, 48, 53, 58] },
    target: { fundamental: 41, partials: [4, 7, 11, 13] },   // 7 and 11 are the far-from-12TET ones
    dials: { bias: 0, spread: 0, depth: 1 },
    carrier: { span: 20, segLen: 18, segVar: 0, striation: 'aligned' },
});
const microObjs = M.toScoreObjects(micro, 0, {});
let residOk = true, sawResidual = false;
microObjs.forEach((o, i) => {
    const n = micro.notes[i];
    const resid = n.cents - n.midi * 100;
    if (Math.abs(resid) > 1) sawResidual = true;
    // played pitch at each breakpoint must equal key*100 + morphBend
    o.morphBend.forEach((pt, k) => {
        const wantCents = n.cents + n.bend[k][1];
        const gotCents = o.sonifyNote * 100 + pt[1];
        if (Math.abs(gotCents - wantCents) > 0.2) residOk = false;
    });
});
ok('a spectral render actually produces off-key targets', sawResidual);
ok('key*100 + morphBend reproduces the intended cents exactly', residOk);
// Octave-folding must keep an M2 render inside the patch's bend range. (A wide
// M3 fan legitimately exceeds it and is flagged GLISS — that is the segmented
// re-key case, Phase 3. M2 has no such excuse: it should never need to leap.)
const m2Max = Math.max.apply(null,
    microObjs.map(o => Math.max.apply(null, o.morphBend.map(p => Math.abs(p[1])))));
ok('an M2 spectral render stays inside the patch bend range',
    m2Max <= M.bendReach() + 0.5, 'max ' + m2Max.toFixed(1) + ' c vs reach ' + M.bendReach().toFixed(0));
ok('and every M2 note lands in the playable ord range',
    microObjs.every(o => o.sonifyNote >= 30 && o.sonifyNote <= 65),
    JSON.stringify(microObjs.map(o => o.sonifyNote)));
eq('so nothing is flagged GLISS', micro.summary.flags.GLISS || 0, 0);
// the spectral colour survives folding: partial 7 is -31 c, 11 is +49 c
const classes = microObjs.map(o => {
    const c = o.sonifyNote * 100 + o.morphBend[o.morphBend.length - 1][1];
    return Math.round(((c % 1200) + 1200) % 1200);
});
ok('folded partials keep a microtonal pitch class (the spectral colour)',
    classes.some(c => c % 100 > 15 && c % 100 < 85), JSON.stringify(classes));

// ===========================================================================
section('concurrent morphs: lanes + structure-preserving voice reduction');
// ===========================================================================
// Two or three morphs at once means four or five players each. Reducing by
// dropping the top note would break BEATING BLOOM completely — half a unison
// pair does not beat — so reduction drops WHOLE clusters.
const PAIRS = { kind: 'pitches', midi: [41, 41, 46, 46, 51, 51, 56, 56] };
[8, 6, 4, 2].forEach(n => {
    const r = M.render({ model: 'M1', seed: 11, source: PAIRS, voices: n,
        target: { cents: 25 }, dials: { bias: 0, spread: 0, depth: 1 },
        carrier: { span: 20, segLen: 8, segVar: 0, striation: 'staggered' } });
    const firsts = {};
    r.notes.forEach(x => { if (firsts[x.voice] == null) firsts[x.voice] = x.cents / 100; });
    const pitches = Object.keys(firsts).map(k => Math.round(firsts[k])).sort((a, b) => a - b);
    eq('reduce to ' + n + ' gives exactly ' + n + ' voices', r.meta.voices, n);
    const counts = {};
    pitches.forEach(p2 => { counts[p2] = (counts[p2] || 0) + 1; });
    ok('reduce to ' + n + ' keeps whole pairs (no orphans)',
        Object.keys(counts).every(k => counts[k] === 2), JSON.stringify(pitches));
});

// lanes: a morph told to occupy players 6-9 must render AND insert there
const onHigh = M.render({ model: 'M6', seed: 3, lanes: [6, 7, 8, 9],
    source: { kind: 'pitches', midi: [34, 41, 48, 53, 58, 62] },
    carrier: { span: 20, segLen: 8, segVar: 0, striation: 'staggered' } });
eq('lanes sets the voice count', onHigh.meta.voices, 4);
eq('lanes are carried in meta', JSON.stringify(onHigh.meta.lanes), '[6,7,8,9]');
const usedLayers = [...new Set(M.toScoreObjects(onHigh, 0, {}).map(o => o.layer))].sort((a, b) => a - b);
eq('inserted objects land on those lanes', JSON.stringify(usedLayers), '[6,7,8,9]');

const lowM = M.render({ model: 'M1', seed: 11, lanes: [0, 1, 2, 3], source: PAIRS,
    target: { cents: 25 },
    carrier: { span: 20, segLen: 8, segVar: 0, striation: 'staggered' } });
const lowLayers = [...new Set(M.toScoreObjects(lowM, 0, {}).map(o => o.layer))];
ok('two morphs on separate lanes never share a player',
    lowLayers.every(l => usedLayers.indexOf(l) < 0),
    JSON.stringify(lowLayers) + ' vs ' + JSON.stringify(usedLayers));

// ===========================================================================
section('G0 REGRESSION FLOOR — the blessed material must never drift (PLAN 2z)');
// ===========================================================================
// The composer auditioned and blessed six recipes. 2z adds a whole shaping
// layer to the same engine; the ONE thing that must stay true is that material
// carrying no `shape` block renders bit-for-bit as it did before. These hashes
// are the contract. If one breaks, the change is not "an improvement" — it is a
// silent rewrite of approved music, and the fix is the code, not the hash.
//
// Regenerate deliberately (never to make a red test green):
//     node tools/test_morph.js --print-fixtures
const crypto = require('crypto');
const SL = require('../bank/sample_lengths.json');
const RECIPES = require('../bank/morph_recipes.json');
const PARAMS = require('../bank/morph_params.json');
const hash = o => crypto.createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 16);

const FIXTURES = [
    // [name, sha1-16 of notes, sha1-16 of [summary, meta], note count]
    ['recipe:A', '57b31106a5fd8beb', '7ae5e6a433bcd3b1', 34],
    ['recipe:B', '12f081f3ee31f405', '291d4f9bb6d294bd', 38],
    ['recipe:C', 'c398a29b878ff65d', 'd180d091caa54285', 39],
    ['recipe:D', '08cbea9602c3427a', '30d02b689b448a2c', 40],
    ['recipe:E', '13d704311b5e5326', 'a248b2f0ffffdfff', 40],
    ['recipe:F', '816b03205391d2d3', 'af1b0e5244075dc6', 40],
    ['variant:A', '57b31106a5fd8beb', 'cba3c24e478c9f62', 34],
    ['variant:B', '12f081f3ee31f405', 'a8d1bf440073cda6', 38],
    ['variant:C', 'c398a29b878ff65d', 'a33ac059f5e818db', 39],
    ['variant:D', '08cbea9602c3427a', '5ac1d989263b2437', 40],
    ['variant:E', '13d704311b5e5326', 'ea5b0b5bc37ca9b9', 40],
    ['variant:F', '816b03205391d2d3', '6ee0ba454bae8a10', 40],
];

function fixtureCases() {
    const cases = [];
    Object.keys(RECIPES.recipes).forEach(k => {
        const r = RECIPES.recipes[k];
        cases.push(['recipe:' + r.slot, r.params]);
    });
    Object.keys(PARAMS.variants).forEach(k => cases.push(['variant:' + k, PARAMS.variants[k]]));
    return cases;
}
const FIX_OPTS = { maxVoices: 10, sampleLengths: SL };

if (process.argv.indexOf('--print-fixtures') >= 0) {
    fixtureCases().forEach(([name, p]) => {
        const res = M.render(p, FIX_OPTS);
        console.log("    ['" + name + "', '" + hash(res.notes) + "', '" +
            hash([res.summary, res.meta]) + "', " + res.notes.length + "],");
    });
    process.exit(0);
}

const fixMap = {};
FIXTURES.forEach(f => { fixMap[f[0]] = f; });
eq('fixture table covers every blessed recipe and live variant',
    fixtureCases().length, FIXTURES.length);
fixtureCases().forEach(([name, p]) => {
    const want = fixMap[name];
    if (!want) { ok('fixture exists for ' + name, false, 'no stored hash'); return; }
    const res = M.render(p, FIX_OPTS);
    eq(name + ' renders the same note count', res.notes.length, want[3]);
    eq(name + ' notes are byte-identical to the blessed render', hash(res.notes), want[1]);
    eq(name + ' summary+meta are byte-identical', hash([res.summary, res.meta]), want[2]);
});

// The spurious-warning fix (found while planning 2z): `lanes` and `voices` were
// READ by normaliseParams but missing from KNOWN_KEYS, so every concurrent-morph
// params file reported keys that were working perfectly.
const lanesWarn = M.render({ model: 'M6', seed: 1, lanes: [0, 1, 2], voices: 3,
    source: { kind: 'pitches', midi: [41, 46, 51] },
    carrier: { span: 10, segLen: 8, segVar: 0, striation: 'staggered' } });
ok('lanes/voices no longer warn as unrecognised keys', lanesWarn.warnings.length === 0,
    JSON.stringify(lanesWarn.warnings));
ok('shape is a known key', M.render({ model: 'M6', seed: 1, shape: { attack: { len: 1 } },
    source: { kind: 'pitches', midi: [41, 46] },
    carrier: { span: 10, segLen: 8, segVar: 0, striation: 'staggered' } })
    .warnings.every(w => w.indexOf('unrecognised key "shape"') < 0));

// ===========================================================================
section('G0 shape schema — validated, defaulted, and never silently ignored');
// ===========================================================================
const ns = (sh, span) => M.normaliseShape(sh, span == null ? 30 : span);

eq('no shape block is null, with nothing to say', ns(null).shape, null);
eq('and reports no warnings', ns(null).warnings.length, 0);

const nsDef = ns({ attack: { len: 2 } });
eq('attack entry defaults to together (striated is demoted, composer day 11)',
    nsDef.shape.attack.entry, 'together');
eq('attack curve defaults to expo', nsDef.shape.attack.curve, 'expo');
eq('attack from defaults to 0.15', nsDef.shape.attack.from, 0.15);
eq('attack peak defaults to 1, which makes decay inert', nsDef.shape.attack.peak, 1);
eq('a peak of 1 needs no decay block', nsDef.shape.decay, null);

const nsRel = ns({ release: { len: 8 } });
eq('release exit defaults to staggered', nsRel.shape.release.exit, 'staggered');
eq('release order defaults to seeded', nsRel.shape.release.order, 'seeded');
eq('release to defaults to 0', nsRel.shape.release.to, 0);

const nsPeak = ns({ attack: { len: 1.5, peak: 1.4 } }, 40);
ok('peak > 1 with no decay block supplies a default decay',
    nsPeak.shape.decay && nsPeak.shape.decay.len > 0, JSON.stringify(nsPeak.shape.decay));
ok('and says so out loud', nsPeak.warnings.some(w => /default decay/.test(w)),
    JSON.stringify(nsPeak.warnings));

const nsLow = ns({ attack: { len: 1, peak: 0.5 } });
eq('peak below 1 is clamped to 1', nsLow.shape.attack.peak, 1);
ok('and points at "from" as the low-start dial',
    nsLow.warnings.some(w => /from/.test(w)), JSON.stringify(nsLow.warnings));

const nsBad = ns({ attack: { len: 1, entry: 'sideways', order: 'sideways', curve: 'wobbly' },
                   release: { len: 2, exit: 'diagonally' }, wobble: 1 });
eq('a bad entry mode falls back to together', nsBad.shape.attack.entry, 'together');
eq('a bad curve falls back to expo', nsBad.shape.attack.curve, 'expo');
eq('a bad exit mode falls back to staggered', nsBad.shape.release.exit, 'staggered');
ok('every bad value is reported', nsBad.warnings.length >= 5, JSON.stringify(nsBad.warnings));
ok('an unknown sub-key is named with its full path',
    nsBad.warnings.some(w => /shape\.wobble/.test(w)), JSON.stringify(nsBad.warnings));

const nsClamp = ns({ attack: { len: 20 }, decay: { len: 20 }, release: { len: 20 } }, 30);
eq('A+D+R are scaled to fit the span',
    Math.round((nsClamp.shape.attack.len + nsClamp.shape.decay.len + nsClamp.shape.release.len) * 10) / 10, 30);
ok('and the clamp is reported as SHAPE_CLAMP',
    nsClamp.warnings.some(w => /SHAPE_CLAMP/.test(w)), JSON.stringify(nsClamp.warnings));

const nsTrans = ns({ attack: { len: 1, transient: { technique: 'ord' } } });
eq('a sustain technique cannot be a transient (D9) — substituted',
    nsTrans.shape.attack.transient.technique, 'staccato');
ok('and the substitution is reported',
    nsTrans.warnings.some(w => /one-shot/.test(w)), JSON.stringify(nsTrans.warnings));

const nsDrop = ns({ release: { len: 5, dropout: { fraction: 1.8 } } });
eq('dropout fraction is clamped to 0..1', nsDrop.shape.release.dropout.fraction, 1);
const nsMot = ns({ release: { len: 5, motion: { type: 'disperse', cents: 9000 } } });
eq('motion cents is sanity-bounded to +/-1200', nsMot.shape.release.motion.cents, 1200);
eq('an empty shape block is dropped, with a warning',
    ns({}).shape, null);

// curves: linear is straight, expo is front-loaded, sudden holds then moves
eq('linear curve is the identity', M.curveEase('linear', 0.5), 0.5, 1e-9);
ok('expo is front-loaded (more of the move happens early)',
    M.curveEase('expo', 0.5) > 0.6, String(M.curveEase('expo', 0.5)));
eq('sudden holds at the start value through most of the window',
    M.curveEase('sudden', 0.5), 0);
ok('and moves in the last tenth', M.curveEase('sudden', 0.95) > 0.4);
['linear', 'expo', 'sudden'].forEach(c => {
    eq(c + ' starts at 0', M.curveEase(c, 0), 0, 1e-9);
    eq(c + ' ends at 1', M.curveEase(c, 1), 1, 1e-9);
});

// ===========================================================================
section('G1 gain ADSR — the shape multiplies the dynamics layer (PLAN 2z §2)');
// ===========================================================================
const SPAN = 40;
const gShape = M.normaliseShape({
    attack:  { len: 4, curve: 'linear', from: 0.2, peak: 1.5 },
    decay:   { len: 6, curve: 'linear' },
    release: { len: 10, curve: 'linear', to: 0.1 },
}, SPAN).shape;
const g = (t, rel) => M.shapeGain(gShape, t, SPAN, rel);

eq('g(0) is `from`', g(0), 0.2, 1e-9);
eq('g(attack.len) is `peak`', g(4), 1.5, 1e-9);
eq('g at the attack midpoint is halfway (linear)', g(2), 0.85, 1e-9);
eq('g(attack+decay) has settled to the body at 1', g(10), 1, 1e-9);
eq('g at the decay midpoint is halfway back (linear)', g(7), 1.25, 1e-9);
eq('the body sits at exactly 1', g(20), 1, 1e-9);
eq('g at the release start is still 1', g(SPAN - 10), 1, 1e-9);
eq('g at the release midpoint is halfway to `to` (linear)', g(35), 0.55, 1e-9);
eq('g(span) is `to`', g(SPAN), 0.1, 1e-9);

// peak defaults to 1, which makes the decay window INERT — that is how ADSR
// degrades to ASR and then to nothing without a single branch.
const inert = M.normaliseShape({ attack: { len: 4, from: 1 }, decay: { len: 6 } }, SPAN).shape;
let inertOk = true;
for (let t = 0; t <= SPAN; t += 0.25) if (Math.abs(M.shapeGain(inert, t, SPAN) - 1) > 1e-12) inertOk = false;
ok('peak 1 makes the decay window inert (g === 1 everywhere)', inertOk);

// THE UNIT SHAPE. A shape whose gain is 1 everywhere must be indistinguishable
// from no shape at all — this is the standing proof that shaping is a multiply,
// never a rewrite.
const unit = M.normaliseShape({
    attack: { len: 4, from: 1, peak: 1 }, release: { len: 10, to: 1 },
}, SPAN).shape;
let unitOk = true;
for (let t = 0; t <= SPAN; t += 0.1) if (M.shapeGain(unit, t, SPAN) !== 1) unitOk = false;
ok('a unit shape has gain exactly 1 at every instant', unitOk);

const shapeBase = {
    model: 'M6', seed: 5,
    source: { kind: 'pitches', midi: [34, 41, 46, 50, 53, 58] },
    carrier: { span: SPAN, segLen: 8, segVar: 0.3, striation: 'staggered' },
    dyn: { base: 0.6, shape: 'rotate', amount: 0.35, spread: 0.5 },
};
const plainR = M.render(shapeBase);
// Gain and scheduling are separable, and the test has to say which it is
// measuring. These two renders share a schedule EXACTLY (same entry, same exit)
// and differ only in from/peak/to, so any difference is the gain and nothing
// else. Comparing a shaped render against a no-shape one would not isolate it:
// a shape block also changes the entry (together is its default, day 11), which
// is G2's business.
const SCHED = { entry: 'striated', order: 'low-first' };
const unitR = M.render(Object.assign({}, shapeBase, {
    shape: { attack: Object.assign({ len: 4, from: 1, peak: 1 }, SCHED),
             release: { len: 10, exit: 'together', to: 1 } },
}));
const shapedR = M.render(Object.assign({}, shapeBase, {
    shape: { attack: Object.assign({ len: 4, curve: 'linear', from: 0.15, peak: 1 }, SCHED),
             release: { len: 10, exit: 'together', curve: 'linear', to: 0 } },
}));
ok('a unit-gain shape leaves the levels alone while a real one moves them',
    hash(unitR.notes.map(n => n.level)) !== hash(shapedR.notes.map(n => n.level)));
// GAIN FEEDS BACK INTO BREATH, and that is correct physics, not a leak: the
// shaped level is what maxBreath() reads, so a quiet attack buys longer
// segments exactly as a quiet passage does for a real player. Worth pinning,
// because it means a shape is not purely a level overlay.
ok('a quiet attack lengthens the segments under it (breath follows dynamic)',
    Math.max.apply(null, shapedR.notes.filter(n => n.tStart < 4).map(n => n.dur)) >=
    Math.max.apply(null, unitR.notes.filter(n => n.tStart < 4).map(n => n.dur)),
    'shaped ' + Math.max.apply(null, shapedR.notes.filter(n => n.tStart < 4).map(n => n.dur)) +
    ' vs unit ' + Math.max.apply(null, unitR.notes.filter(n => n.tStart < 4).map(n => n.dur)));
// the unit shape must also equal the plain render's LEVELS wherever the two
// schedules coincide — same voice, same onset, same dur
const plainKey = {};
plainR.notes.forEach(n => { plainKey[n.voice + '@' + n.tStart + '/' + n.dur] = n.level; });
let matched = 0, mismatched = 0;
unitR.notes.forEach(n => {
    const p = plainKey[n.voice + '@' + n.tStart + '/' + n.dur];
    if (!p) return;
    matched++;
    if (JSON.stringify(p) !== JSON.stringify(n.level)) mismatched++;
});
ok('a unit-gain shape reproduces the unshaped levels note for note',
    matched > 10 && mismatched === 0, matched + ' compared, ' + mismatched + ' differ');
const levelAt = (r, lo, hi) => {
    const v = [];
    r.notes.forEach(n => n.level.forEach((pt, i) => {
        const t = n.tStart + pt[0];
        if (t >= lo && t <= hi) v.push(pt[1]);
    }));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
ok('a real attack pulls the opening down below the unshaped render',
    levelAt(shapedR, 0, 1.5) < levelAt(plainR, 0, 1.5) - 0.5,
    levelAt(shapedR, 0, 1.5) + ' vs ' + levelAt(plainR, 0, 1.5));
ok('and a real release pulls the ending down',
    levelAt(shapedR, SPAN - 2, SPAN) < levelAt(plainR, SPAN - 2, SPAN) - 0.5,
    levelAt(shapedR, SPAN - 2, SPAN) + ' vs ' + levelAt(plainR, SPAN - 2, SPAN));

// `to: 0` lands on the engine's 0.4 level floor, NOT on digital silence — the
// same floor every hand-drawn decrescendo in the piece already has (§5.1).
// Do not "fix" this; it is the CC7 map's bottom, and the panel says so.
const toZero = shapedR.notes.filter(n => n.tStart + n.dur > SPAN - 0.6);
ok('the tail reaches the 0.4 floor',
    toZero.some(n => n.level[n.level.length - 1][1] <= 0.45), JSON.stringify(
        toZero.map(n => n.level[n.level.length - 1][1])));
ok('and never goes below it',
    shapedR.notes.every(n => n.level.every(pt => pt[1] >= 0.4 - 1e-9)));

// peak > 1 really does overshoot the body
const hitSettle = M.render(Object.assign({}, shapeBase, {
    shape: { attack: { len: 1.5, curve: 'linear', from: 0.8, peak: 1.5 },
             decay: { len: 4, curve: 'linear' } },
    dyn: { base: 0.5, shape: 'flat' },
}));
const peakLv = levelAt(hitSettle, 1.2, 1.8), bodyLv = levelAt(hitSettle, 12, 25);
ok('a peak of 1.5 overshoots the body level and settles back',
    peakLv > bodyLv + 1, 'peak ' + peakLv + ' vs body ' + bodyLv);

// ===========================================================================
section('G2 scheduling — who enters, who leaves, in what order (PLAN 2z §5.2)');
// ===========================================================================
const SRC8 = { kind: 'pitches', midi: [34, 38, 41, 45, 48, 53, 58, 62] };
const schedBase = {
    model: 'M6', seed: 7, source: SRC8,
    carrier: { span: 40, segLen: 7, segVar: 0, striation: 'staggered' },
    dyn: { base: 0.6, shape: 'flat' },
};
const firstOnset = r => {
    const f = {};
    r.notes.forEach(n => { if (f[n.voice] == null || n.tStart < f[n.voice]) f[n.voice] = n.tStart; });
    return Object.keys(f).sort((a, b) => a - b).map(k => f[k]);
};
const lastEnd = r => {
    const e = {};
    r.notes.forEach(n => { const t = n.tStart + n.dur; if (e[n.voice] == null || t > e[n.voice]) e[n.voice] = t; });
    return Object.keys(e).sort((a, b) => a - b).map(k => e[k]);
};
const entryR = mode => M.render(Object.assign({}, schedBase, {
    shape: { attack: { len: 3, entry: mode, order: 'low-first', from: 0.2 } },
}));

const blockAtk = entryR('together');
ok('entry together puts every voice at t = 0',
    firstOnset(blockAtk).every(t => t === 0), JSON.stringify(firstOnset(blockAtk)));
// ...and the designed block attack must NOT then be buried under SEAM flags.
// The exemption is scoped to the attack window and nothing more: a lockstep
// carrier LATER in the span (segVar 0, so the voices never de-phase) is a real
// ensemble seam and stays flagged. Both halves of that are asserted, because
// exempting too much is the same failure as flagging too much.
eq('a designed block attack raises no SEAM flags inside the attack window',
    blockAtk.notes.filter(n => n.flags.indexOf('SEAM') >= 0 && n.tStart <= 3).length, 0);
const jittered = M.render(Object.assign({}, schedBase, {
    carrier: { span: 40, segLen: 7, segVar: 0.3, striation: 'staggered' },
    shape: { attack: { len: 3, entry: 'together', from: 0.2 } },
}));
ok('and an ordinary jittered carrier under a block attack is essentially clean',
    (jittered.summary.soft.SEAM || 0) <= 2, String(jittered.summary.soft.SEAM || 0));
ok('while a zero-jitter carrier still reports its lockstep re-entries',
    (blockAtk.summary.soft.SEAM || 0) > 0, String(blockAtk.summary.soft.SEAM || 0));

const ramp = entryR('ramp');
const rampOn = firstOnset(ramp);
ok('entry ramp spreads entries evenly across the attack window',
    rampOn[0] === 0 && Math.abs(rampOn[7] - 3) < 1e-6, JSON.stringify(rampOn));
let evenOk = true;   // entry times are stored at round3, so 3/7 lands at 0.429
for (let i = 1; i < rampOn.length; i++) {
    if (Math.abs((rampOn[i] - rampOn[i - 1]) - 3 / 7) > 2e-3) evenOk = false;
}
ok('and the spacing really is even', evenOk, JSON.stringify(rampOn));

const rampHigh = M.render(Object.assign({}, schedBase, {
    shape: { attack: { len: 3, entry: 'ramp', order: 'high-first', from: 0.2 } },
}));
const rhOn = firstOnset(rampHigh);
ok('order high-first sends the top voice in first',
    rhOn[7] === 0 && Math.abs(rhOn[0] - 3) < 1e-6, JSON.stringify(rhOn));
const rampSeed = M.render(Object.assign({}, schedBase, {
    shape: { attack: { len: 3, entry: 'ramp', order: 'seeded', from: 0.2 } },
}));
ok('order seeded is a permutation of the same entry times',
    JSON.stringify(firstOnset(rampSeed).slice().sort((a, b) => a - b)) ===
    JSON.stringify(rampOn.slice().sort((a, b) => a - b)));
ok('and it is not the low-first order', JSON.stringify(firstOnset(rampSeed)) !== JSON.stringify(rampOn));

const striated = entryR('striated');
const stOn = firstOnset(striated);
ok('entry striated stays inside the attack window',
    stOn.every(t => t >= 0 && t <= 3 + 1e-6), JSON.stringify(stOn));
ok('and is irregular, not evenly spaced',
    new Set(stOn.map(t => Math.round(t * 100))).size > 3, JSON.stringify(stOn));

// EXITS
const exitTogether = M.render(Object.assign({}, schedBase, {
    shape: { release: { len: 12, exit: 'together', to: 0 } },
}));
ok('exit together lets every voice run to the span',
    lastEnd(exitTogether).every(t => t > 40 - 8), JSON.stringify(lastEnd(exitTogether)));
const exitStag = M.render(Object.assign({}, schedBase, {
    shape: { release: { len: 12, exit: 'staggered', order: 'high-first', to: 0 } },
}));
const stagEnds = lastEnd(exitStag);
ok('exit staggered spreads the endings across the release window',
    new Set(stagEnds.map(t => Math.round(t))).size >= 4, JSON.stringify(stagEnds));
ok('and high-first means the top voice stops before the bottom one',
    stagEnds[7] < stagEnds[0], 'top ' + stagEnds[7] + ' vs bottom ' + stagEnds[0]);
ok('no voice sounds past the span', exitStag.notes.every(n => n.tStart + n.dur <= 40 + 1e-6));

// DROPOUT — cluster-safe. This is the assertion that protects the beating.
const PAIRS8 = { kind: 'pitches', midi: [41, 41, 46, 46, 51, 51, 56, 56] };
const dropR = M.render({
    model: 'M1', seed: 11, source: PAIRS8, target: { cents: 25, direction: 'alternate' },
    dials: { bias: 0, spread: 0, depth: 1 },
    carrier: { span: 40, segLen: 8, segVar: 0, striation: 'staggered' },
    shape: { release: { len: 12, exit: 'staggered', order: 'high-first', to: 0,
                        dropout: { fraction: 0.5 } } },
});
const dropped = dropR.meta.shape.dropped;
ok('dropout actually drops voices', dropped.length > 0, JSON.stringify(dropped));
// the pitch pairs are voices (0,1) (2,3) (4,5) (6,7)
let pairSafe = true;
for (let p = 0; p < 8; p += 2) {
    const a = dropped.indexOf(p) >= 0, b = dropped.indexOf(p + 1) >= 0;
    if (a !== b) pairSafe = false;
}
ok('DROPOUT NEVER SPLITS A NEAR-UNISON PAIR (half a pair does not beat)',
    pairSafe, 'dropped ' + JSON.stringify(dropped));
ok('and it never drops more than the fraction asked for',
    dropped.length <= Math.round(0.5 * 8), String(dropped.length));
const dEnd = lastEnd(dropR);
ok('the dropped voices leave in the first half of the release window',
    dropped.every(v => dEnd[v] <= 40 - 12 + 6 + 1e-6),
    JSON.stringify(dropped.map(v => dEnd[v])));
const tapers = [0, 1, 2, 3, 4, 5, 6, 7].filter(v => dropped.indexOf(v) < 0);
ok('while the rest taper on into the second half',
    tapers.some(v => dEnd[v] > 40 - 6), JSON.stringify(tapers.map(v => dEnd[v])));
// THE ABRUPTNESS TEST. A dropped voice is still LOUD right up to its exit and
// then stops; a tapering voice is already quiet long before it ends. Measure
// just before each voice's end — the very last breakpoint is the cut itself, so
// reading that would compare two silences and prove nothing.
const nearEndLevel = (r, v) => {
    const ns = r.notes.filter(n => n.voice === v).sort((a, b) => a.tStart - b.tStart);
    const n = ns[ns.length - 1];
    return n.level[Math.floor(n.level.length * 0.9)][1];
};
const dropLv = Math.min.apply(null, dropped.map(v => nearEndLevel(dropR, v)));
const taperLv = Math.max.apply(null, tapers.map(v => nearEndLevel(dropR, v)));
ok('every dropped voice is still loud at its cut, louder than any taper is at its end',
    dropLv > taperLv, 'quietest drop ' + dropLv + ' vs loudest taper ' + taperLv);

// fraction 0 and 1 are the honest extremes
eq('dropout fraction 0 drops nobody',
    M.render(Object.assign({}, schedBase, { shape: { release: { len: 10, dropout: { fraction: 0 } } } }))
        .meta.shape.dropped.length, 0);
eq('dropout fraction 1 drops everybody',
    M.render(Object.assign({}, schedBase, { shape: { release: { len: 10, dropout: { fraction: 1 } } } }))
        .meta.shape.dropped.length, 8);

// dropoutVoices in isolation: whole clusters, evenly across the register
const dv = M.dropoutVoices([41, 41, 46, 46, 51, 51, 56, 56], 0.5);
eq('dropoutVoices drops exactly the fraction when clusters allow', Object.keys(dv).length, 4);
ok('and always in whole pairs',
    [0, 2, 4, 6].every(p => !!dv[p] === !!dv[p + 1]), JSON.stringify(Object.keys(dv)));
const dvSingle = M.dropoutVoices([34, 40, 46, 52, 58], 0.4);
eq('with no clusters the fraction is exact', Object.keys(dvSingle).length, 2);

// the shape never breaks the invariants the carrier already guaranteed
[blockAtk, ramp, striated, exitStag, dropR].forEach((r, i) => {
    ok('shaped render ' + i + ' double-books no player', r.summary.hard === 0);
    ok('shaped render ' + i + ' keeps every note inside the span',
        r.notes.every(n => n.tStart >= -1e-6 && n.tStart + n.dur <= r.meta.span + 1e-6));
});

// ===========================================================================
section('G3 edge articulation + noise layer (PLAN 2z §5.3, §5.4)');
// ===========================================================================
const edgeBase = {
    model: 'M6', seed: 4, source: { kind: 'pitches', midi: [41, 46, 51, 56] },
    carrier: { span: 30, segLen: 6, segVar: 0, striation: 'staggered' },
    dyn: { base: 0.6, shape: 'flat' },
};
const techOf = (r, pred) => [...new Set(r.notes.filter(pred).map(n => n.technique))];

// --- window technique: the colour of the first / last sustain segment
const edgeAtk = M.render(Object.assign({}, edgeBase, {
    shape: { attack: { len: 5, entry: 'together', technique: 'flz' } },
}));
eq('an attack technique colours the segments inside the attack window',
    JSON.stringify(techOf(edgeAtk, n => n.tStart < 5)), '["flz"]');
eq('and the body returns to the base technique after it',
    JSON.stringify(techOf(edgeAtk, n => n.tStart > 6)), '["ord"]');
// the boundary is a real segment break — a player cannot change technique
// mid-note, so the window edge must land between notes, never inside one
ok('no note straddles the attack window boundary',
    edgeAtk.notes.every(n => n.tStart >= 5 - 1e-6 || n.tStart + n.dur <= 5 + 1e-6),
    JSON.stringify(edgeAtk.notes.filter(n => n.tStart < 5 && n.tStart + n.dur > 5)
        .map(n => [n.tStart, n.dur])));

const edgeRel = M.render(Object.assign({}, edgeBase, {
    shape: { release: { len: 8, exit: 'together', technique: 'bisb', to: 0.2 } },
}));
eq('a release technique colours the segments inside the release window',
    JSON.stringify(techOf(edgeRel, n => n.tStart >= 22 - 1e-6)), '["bisb"]');
ok('and the body before it is untouched',
    techOf(edgeRel, n => n.tStart < 22).join() === 'ord');

// the body-rejected techniques are explicitly welcome at the edges
['play_sing_ks', 'flz', 'bisb'].forEach(t => {
    const r = M.render(Object.assign({}, edgeBase, { shape: { attack: { len: 4, technique: t } } }));
    ok('"' + t + '" is available as an edge colour', techOf(r, n => n.tStart < 4).indexOf(t) >= 0,
        JSON.stringify(techOf(r, n => n.tStart < 4)));
});
// Singing into the tuba needs 1.0 s of prep against a 0.75 s breath gap — the
// one edge technique that can legitimately flag SWITCH. Note the DIRECTION: the
// check is on switching INTO a technique that needs preparing, so it fires on a
// release edge (the body hands over to singing mid-gesture) and cannot fire on
// an attack edge, where the technique is the first thing the player does and
// there is nothing to prepare from.
const singRel = M.render(Object.assign({}, edgeBase, {
    shape: { release: { len: 8, exit: 'together', technique: 'play_sing_ks', to: 0.2 } } }));
ok('a play_sing_ks release edge flags SWITCH against the breath gap, as predicted',
    (singRel.summary.flags.SWITCH || 0) > 0, JSON.stringify(singRel.summary.flags));
const singAtk = M.render(Object.assign({}, edgeBase, {
    shape: { attack: { len: 4, technique: 'play_sing_ks' } } }));
eq('while a play_sing_ks attack edge has nothing to prepare from, so does not',
    singAtk.summary.flags.SWITCH || 0, 0);

// M4 moves technique too. The window wins, and it says so rather than quietly
// overwriting the model's path.
const overM4 = M.render(Object.assign({}, edgeBase, {
    model: 'M4', target: { path: ['ord', 'bisb', 'flz'] },
    shape: { attack: { len: 5, technique: 'cuivre' } },
}));
ok('an edge technique overriding M4 is reported, not silent',
    overM4.warnings.some(w => /SHAPE_OVER_M4/.test(w)), JSON.stringify(overM4.warnings));
ok("and M4's path resumes after the window",
    techOf(overM4, n => n.tStart > 6).length >= 1, JSON.stringify(techOf(overM4, n => n.tStart > 6)));

// --- transient: the prepended one-shot, HIT-THEN-TONE
const trans = M.render(Object.assign({}, edgeBase, {
    shape: { attack: { len: 3, entry: 'together', transient: { technique: 'staccato' } } },
}), { sampleLengths: SL });
const firstPer = {};
trans.notes.forEach(n => {
    if (!firstPer[n.voice] || n.tStart < firstPer[n.voice].tStart) firstPer[n.voice] = n;
});
const firstNotes = Object.keys(firstPer).map(k => firstPer[k]);
ok('every voice gets a transient one-shot first',
    firstNotes.length === 4 && firstNotes.every(n => n.technique === 'staccato'),
    JSON.stringify(firstNotes.map(n => n.technique)));
ok('the transients all land at t = 0 under entry together',
    firstNotes.every(n => n.tStart === 0), JSON.stringify(firstNotes.map(n => n.tStart)));
ok('and take their TRUE sample length, not the attack length (D9)',
    firstNotes.every(n => n.dur > 0.3 && n.dur < 0.6), JSON.stringify(firstNotes.map(n => n.dur)));
// the sustain follows AFTER the sample plus a tongue reset — one player cannot
// sound two notes at once, so hit-AND-tone is impossible here by physics
const v0 = trans.notes.filter(n => n.voice === 0).sort((a, b) => a.tStart - b.tStart);
ok('the sustain re-attacks after the sample has ended, never during it',
    v0[1].tStart >= v0[0].tStart + v0[0].dur + M.RATE.tongueReset - 1e-6,
    'hit ends ' + (v0[0].tStart + v0[0].dur) + ', tone starts ' + v0[1].tStart);
ok('so hit-then-tone happens at about the half-second scale',
    v0[1].tStart > 0.3 && v0[1].tStart < 0.7, String(v0[1].tStart));
eq('the transient spacing clears OVERLAP entirely', trans.summary.hard, 0);
eq('and raises no RATE flag either', trans.summary.soft.RATE || 0, 0);

// --- cuivre range reality: 60-67 only. Ask below it and the engine degrades to
//     fortepiano — the brassy accent that IS available down there — and flags it.
const feLow = M.feasibleTechnique('cuivre', 45);
eq('cuivre asked at MIDI 45 resolves to fortepiano', feLow.technique, 'fortepiano');
ok('and is flagged RANGE', feLow.flagged === true);
const cuivreLow = M.render(Object.assign({}, edgeBase, {
    source: { kind: 'pitches', midi: [41, 45, 48] },
    shape: { attack: { len: 3, transient: { technique: 'cuivre' } } },
}), { sampleLengths: SL });
ok('a low cuivre transient renders as fortepiano rather than being refused',
    cuivreLow.notes.some(n => n.technique === 'fortepiano'),
    JSON.stringify([...new Set(cuivreLow.notes.map(n => n.technique))]));
ok('and carries the RANGE flag', (cuivreLow.summary.flags.RANGE || 0) > 0);

// --- noise layer: spare players, simultaneous stack
const noiseR = M.render(Object.assign({}, edgeBase, {
    shape: { attack: { len: 2, entry: 'together',
                       noise: { technique: 'cuivre', voices: 2, midi: [63, 65] } } },
}), { sampleLengths: SL, maxVoices: 10 });
const noiseNotes = noiseR.notes.filter(n => n.voice >= 4);
eq('the noise layer renders its voices', noiseNotes.length, 2);
eq('and reports them in meta', noiseR.meta.shape.noiseVoices, 2);
ok('noise notes sound SIMULTANEOUSLY with the entering morph voices',
    noiseNotes.every(n => n.tStart === 0), JSON.stringify(noiseNotes.map(n => n.tStart)));
eq('at the pitches asked for', JSON.stringify(noiseNotes.map(n => n.midi).sort()), '[63,65]');
eq('in the technique asked for', JSON.stringify([...new Set(noiseNotes.map(n => n.technique))]), '["cuivre"]');
// toScoreObjects maps 1:1 with result.notes IN ORDER — and the notes are sorted
// by time, so the noise notes (t = 0) sort to the FRONT, not the back. Find
// them by voice index, not by position.
const noiseObjs = M.toScoreObjects(noiseR, 0, {});
const noiseLayers = noiseR.notes.map((n, i) => (n.voice >= 4 ? noiseObjs[i].layer : null))
    .filter(l => l != null);
ok('the noise layer lands on SPARE lanes, never a morph lane',
    noiseLayers.length === 2 && noiseLayers.every(l => l >= 4 && l < 10),
    JSON.stringify(noiseLayers));
eq('morph voice count is unchanged by the noise layer', noiseR.meta.voices, 4);
eq('and the designed simultaneity raises no SEAM flags inside the attack window',
    noiseR.notes.filter(n => n.flags.indexOf('SEAM') >= 0 && n.tStart <= 2).length, 0);

// no spare lanes: renders without it, names the shortfall, steals nothing
const noRoom = M.render({
    model: 'M6', seed: 4, lanes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    source: { kind: 'pitches', midi: [34, 38, 41, 45, 48, 51, 53, 56, 58, 62] },
    carrier: { span: 20, segLen: 6, segVar: 0, striation: 'staggered' },
    shape: { attack: { len: 2, noise: { technique: 'cuivre', voices: 2, midi: [63, 65] } } },
}, { sampleLengths: SL, maxVoices: 10 });
eq('with all ten lanes taken the noise layer renders nothing', noRoom.meta.shape.noiseVoices, 0);
ok('and names the shortfall out loud',
    noRoom.warnings.some(w => /NOISE: wanted 2 voices, 0 spare/.test(w)),
    JSON.stringify(noRoom.warnings));
eq('the morph itself is untouched', noRoom.meta.voices, 10);

// a fixed one-shot's sample length wins over any `len` asked for (D9), said out loud
const noiseLen = M.render(Object.assign({}, edgeBase, {
    shape: { attack: { len: 2, noise: { technique: 'cuivre', voices: 1, midi: [63], len: 5 } } },
}), { sampleLengths: SL });
ok('a fixed noise technique ignores "len" and says so',
    noiseLen.warnings.some(w => /fixed one-shot/.test(w)), JSON.stringify(noiseLen.warnings));
ok('and takes the sample length instead',
    noiseLen.notes.filter(n => n.voice >= 4).every(n => n.dur < 2), JSON.stringify(
        noiseLen.notes.filter(n => n.voice >= 4).map(n => n.dur)));
// ...and when it outlasts the window it is FLAGGED, never shortened
ok('a one-shot that rings past its window is flagged EDGE_RING',
    (M.render(Object.assign({}, edgeBase, {
        shape: { attack: { len: 0.3, noise: { technique: 'cuivre', voices: 1, midi: [63] } } },
    }), { sampleLengths: SL }).summary.flags.EDGE_RING || 0) > 0);

// everything above must leave the playability invariants intact
[edgeAtk, edgeRel, trans, noiseR, cuivreLow].forEach((r, i) => {
    eq('G3 render ' + i + ' double-books no player', r.summary.hard, 0);
});

// ===========================================================================
console.log('\n' + '='.repeat(58));
console.log('  ' + pass + ' passed, ' + fail + ' failed');
if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach(f => console.log('  x ' + f));
    process.exit(1);
}
console.log('  morph engine OK');
