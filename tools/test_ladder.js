#!/usr/bin/env node
// test_ladder.js — unit tests over the FADE LADDER assembly (M.buildLadder).
//
// The ladder exists so the composer can audition one attack at several lengths
// inside ONE play session. What a test CAN judge is whether the rungs are laid
// out so that audition is honest: each rung clipped to its own window, no rung
// bleeding into the next, and every rung after the first opening COLD — because
// a warm entry is the condition the blip lived in, and a ladder that quietly
// produced one would be measuring the wrong thing.
//
// What a test cannot judge is which fade the composer wants. That is the
// listening half, and it is why this file stops where it does.
//
//   node tools/test_ladder.js

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
    if (cond) { pass++; return; }
    fail++; fails.push(name + (detail ? '  -> ' + detail : ''));
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

// The ladder needs REAL params with an attack block. Any banked ACTUAL carries
// the params that were actually heard, which is the truest fixture available;
// prefer BLOOM, take any, and skip cleanly if the composer has none banked
// rather than pinning the test to a file they are free to delete.
function findBase() {
    const dir = path.join(__dirname, '..', 'bank', 'actuals');
    if (!fs.existsSync(dir)) return null;
    const names = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    names.sort((a, b) => (/BLOOM/.test(b) ? 1 : 0) - (/BLOOM/.test(a) ? 1 : 0));
    for (const n of names) {
        let j;
        try { j = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); } catch (e) { continue; }
        const p = j.provenance && j.provenance.resolvedParams;
        if (p && p.shape && p.shape.attack) return { params: p, from: n };
    }
    return null;
}

const found = findBase();
if (!found) {
    console.log('SKIP — no banked ACTUAL carries resolvedParams.shape.attack.');
    console.log('The ladder assembly is unverified; re-run once an actual with a');
    console.log('shape preset is banked.');
    process.exit(0);
}
const base = found.params;
console.log('base: ' + found.from + ' — model=' + base.model + ' seed=' + base.seed +
            ' attack.len=' + base.shape.attack.len);

const LENS = [1, 2, 3, 5, 8];
const L = M.buildLadder(base, LENS, { renderOpts: { maxVoices: 10, sampleLengths: null } });
const HOLD = L.holdS, GAP = L.gapS;
const ORD_TAIL_S = 0.69;    // measured day 14
const CC_LEAD_S = 0.250;    // morph_emit.CC_LEAD_MS

const byRung = L.rungs.map(rg => ({
    rg: rg,
    notes: L.notes.filter(n => n.tStart >= rg.at - 1e-9 && n.tStart < rg.at + rg.clip + 1e-9),
}));

// ===========================================================================
section('every rung rendered and opens where it was placed');
// ===========================================================================
ok('all lengths produced a rung', L.rungs.length === LENS.length,
    L.rungs.length + ' of ' + LENS.length);
byRung.forEach(R => {
    ok('L=' + R.rg.len + ' has notes', R.notes.length > 0, R.notes.length + ' notes');
    const first = Math.min.apply(null, R.notes.map(n => n.tStart));
    ok('L=' + R.rg.len + ' opens at its own start', Math.abs(first - R.rg.at) < 1e-6,
        'first ' + first.toFixed(3) + ' vs at ' + R.rg.at.toFixed(3));
});

// ===========================================================================
section('clipping keeps each rung inside attack + hold');
// ===========================================================================
byRung.forEach(R => {
    const end = Math.max.apply(null, R.notes.map(n => n.tStart + n.dur));
    ok('L=' + R.rg.len + ' ends by attack+hold', end <= R.rg.at + R.rg.clip + 1e-6,
        'end ' + end.toFixed(3) + ' vs limit ' + (R.rg.at + R.rg.clip).toFixed(3));
    ok('L=' + R.rg.len + ' clip left no dead notes', R.notes.every(n => n.dur > 0),
        R.notes.filter(n => n.dur <= 0).length + ' with dur <= 0');
});
ok('every note belongs to exactly one rung',
    byRung.reduce((s, R) => s + R.notes.length, 0) === L.notes.length,
    byRung.reduce((s, R) => s + R.notes.length, 0) + ' vs ' + L.notes.length);

// ===========================================================================
section('the gap is load-bearing: no overlap, and it outlives tail + lead');
// ===========================================================================
for (let i = 0; i + 1 < byRung.length; i++) {
    const A = byRung[i], B = byRung[i + 1];
    const aEnd = Math.max.apply(null, A.notes.map(n => n.tStart + n.dur));
    const bStart = Math.min.apply(null, B.notes.map(n => n.tStart));
    const gap = bStart - aEnd;
    ok('gap ' + A.rg.len + '->' + B.rg.len + ' outlives the ord tail',
        gap > ORD_TAIL_S, 'gap ' + gap.toFixed(3) + ' s vs tail ' + ORD_TAIL_S);
    ok('gap ' + A.rg.len + '->' + B.rg.len + ' outlives the CC7 lead',
        gap > CC_LEAD_S, 'gap ' + gap.toFixed(3) + ' s vs lead ' + CC_LEAD_S);
}
ok('the configured gap itself clears both', GAP > ORD_TAIL_S && GAP > CC_LEAD_S,
    'GAP_S ' + GAP);

// ===========================================================================
section('rungs 2..N open COLD — emit\'s own cold/warm test, per voice');
// ===========================================================================
// emit: cold = no other note on the same channel starting earlier and still
// sounding within CC_LEAD of my note-on. Channel derives from the voice's lane,
// so voice identity is the right grain here.
const byVoice = {};
L.notes.forEach(n => { (byVoice[n.voice] = byVoice[n.voice] || []).push(n); });
byRung.forEach((R, ri) => {
    if (!ri) return;
    const opens = {};
    R.notes.forEach(n => {
        if (opens[n.voice] == null || n.tStart < opens[n.voice]) opens[n.voice] = n.tStart;
    });
    const warm = Object.keys(opens).filter(v => (byVoice[v] || []).some(o =>
        o.tStart < opens[v] - 1e-9 && o.tStart + o.dur > opens[v] - CC_LEAD_S));
    ok('rung ' + R.rg.len + ' s: every voice enters cold', warm.length === 0,
        warm.length + ' warm (voices ' + warm.join(',') + ')');
});

// ===========================================================================
section('the rungs actually differ — a longer fade is quieter early');
// ===========================================================================
// NOT "when does it peak": the global peak belongs to the morph's own dyn curve
// and barely moves with the attack. The attack governs the RAMP, so the ramp is
// what a rung demonstrates and what is asserted here.
function interp(bp, dt) {
    if (!bp || !bp.length) return 0;
    if (dt <= bp[0][0]) return bp[0][1];
    for (let i = 1; i < bp.length; i++) {
        if (dt <= bp[i][0]) {
            const a = bp[i - 1], b = bp[i];
            return a[1] + ((dt - a[0]) / Math.max(1e-6, b[0] - a[0])) * (b[1] - a[1]);
        }
    }
    return bp[bp.length - 1][1];
}
const ramp = byRung.map(R => {
    const t0 = Math.min.apply(null, R.notes.map(n => n.tStart));
    const open = R.notes.filter(n => Math.abs(n.tStart - t0) < 1e-9);
    return { len: R.rg.len,
             at1: open.reduce((s, n) => s + interp(n.level, 1), 0) / open.length };
});
ramp.forEach(r => console.log('    len=' + String(r.len).padStart(2) +
    '  mean level @1 s = ' + r.at1.toFixed(2)));
for (let i = 0; i + 1 < ramp.length; i++) {
    ok('a ' + ramp[i + 1].len + ' s fade is quieter at 1 s than a ' + ramp[i].len + ' s one',
        ramp[i + 1].at1 < ramp[i].at1,
        ramp[i].at1.toFixed(3) + ' -> ' + ramp[i + 1].at1.toFixed(3));
}
ok('the default ladder spans a real range (shortest >= 3x longest at 1 s)',
    ramp[0].at1 >= ramp[ramp.length - 1].at1 * 3,
    ramp[0].at1.toFixed(3) + ' vs ' + ramp[ramp.length - 1].at1.toFixed(3));

// ===========================================================================
section('meta reuse is safe, and the span covers the sound');
// ===========================================================================
const lane0 = JSON.stringify(M.render(Object.assign(JSON.parse(JSON.stringify(base)),
    { shape: Object.assign(JSON.parse(JSON.stringify(base.shape)),
        { attack: Object.assign({}, base.shape.attack, { len: LENS[0] }) }) }),
    { maxVoices: 10, sampleLengths: null }).meta.lanes);
LENS.forEach(len => {
    const p = JSON.parse(JSON.stringify(base));
    p.shape.attack.len = len;
    const lanes = JSON.stringify(M.render(p, { maxVoices: 10, sampleLengths: null }).meta.lanes);
    ok('L=' + len + ' renders the same lanes as rung 1', lanes === lane0, lanes);
});
const lastEnd = Math.max.apply(null, L.notes.map(n => n.tStart + n.dur));
ok('span covers the last note', L.span >= lastEnd,
    'span ' + L.span.toFixed(2) + ' lastEnd ' + lastEnd.toFixed(2));
ok('span does not trail past one gap', L.span - lastEnd < GAP + 0.01,
    'trailing ' + (L.span - lastEnd).toFixed(2) + ' s');

// ===========================================================================
section('the guards the panel relies on');
// ===========================================================================
function throwsWith(fn, msg) {
    try { fn(); return false; } catch (e) { return e.message === msg; }
}
ok('params with no shape are refused',
    throwsWith(() => M.buildLadder({ model: 'M1' }, LENS), 'no attack block'));
ok('params with a shape but no attack are refused',
    throwsWith(() => M.buildLadder({ model: 'M1', shape: {} }, LENS), 'no attack block'));
ok('an empty length list is refused',
    throwsWith(() => M.buildLadder(base, []), 'no usable lengths'));
ok('junk lengths are refused',
    throwsWith(() => M.buildLadder(base, ['x', '', '-3', '0']), 'no usable lengths'));
ok('a mixed list keeps only the usable lengths',
    M.buildLadder(base, ['2', 'x', '-1', '4'],
        { renderOpts: { maxVoices: 10, sampleLengths: null } }).rungs.map(r => r.len)
        .join(',') === '2,4');
// a failing rung must name itself — the panel prints the length
ok('a render failure carries its rung length', (() => {
    try {
        M.buildLadder(base, [1, 2], { render: p => {
            if (p.shape.attack.len === 2) throw new Error('boom');
            return { notes: [], meta: {} };
        } });
        return false;
    } catch (e) { return e.rungLen === 2 && e.message === 'boom'; }
})());
// the panel overrides nothing else: the base params must come back untouched
const beforeLen = base.shape.attack.len;
M.buildLadder(base, [7], { renderOpts: { maxVoices: 10, sampleLengths: null } });
ok('buildLadder does not mutate the caller\'s params',
    base.shape.attack.len === beforeLen, 'len is now ' + base.shape.attack.len);

console.log('\n' + pass + ' pass, ' + fail + ' fail');
if (fail) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  ' + f)); process.exit(1); }
