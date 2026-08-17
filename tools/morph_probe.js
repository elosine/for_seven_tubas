#!/usr/bin/env node
// morph_probe.js — PLAN 2v, the Phase 2 + Phase 3 measurement gates.
//
// Writes a probe schedule in the same format probes/analyze_bend_probe.py
// already reads, so the measurement reuses the f0 analyzer that was itself
// self-tested to 0.0 cents error. Play it with the inline-PowerShell pattern
// (see docs/RUNNING_LOG.md — invoking a .ps1 by file gets refused).
//
// WHY THE PROBE IS MONOPHONIC AND SEQUENTIAL. The analyzer estimates ONE f0 per
// slot. An eight-voice spectral chord sounding together cannot be measured that
// way — the whole point is to check each voice individually against the pitch
// the engine SAID it would produce. So every voice is sounded alone, in turn.
// The musical render is unchanged; this is a measuring instrument, not music.
//
// Therefore only ONE port is needed: M2 and M3 are both `ord`, which is
// tuba1 channel 1. tuba1b is not used.
//
//   node tools/morph_probe.js
//   -> probes/last_bend_schedule.json   (then play it, then analyze the wav)

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');

const PORT = 'tuba1', CH = 1, VEL = 100;
const HOLD = 2500, GAP = 2000;
const CENTER = 8192;
const P = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bank', 'morph_params.json'), 'utf8'));

const bendVal = cents => Math.max(0, Math.min(16383,
    Math.round(8192 + (cents / (100 * M.MEASURED.BEND_RANGE_ST)) * 8192)));

const actions = [], slots = [];
let t = 1000, idx = 0;

function addSlot(step, label, key, bendCents, expectCents, opts) {
    const o = opts || {};
    const dur = o.dur || HOLD;
    actions.push({ tMs: t - 250, type: 'bend', port: PORT, channel: CH,
                   d1: bendVal(bendCents) & 0x7F, d2: (bendVal(bendCents) >> 7) & 0x7F });
    actions.push({ tMs: t, type: 'note_on', port: PORT, channel: CH, d1: key, d2: VEL });
    if (o.ramp) {
        // continuous glissando, stepped at 25 ms — the rate the renderer emits at
        const steps = Math.floor(o.ramp.lenMs / 25);
        for (let i = 1; i <= steps; i++) {
            const c = bendCents + (o.ramp.toCents - bendCents) * (i / steps);
            const v = bendVal(c);
            actions.push({ tMs: t + o.ramp.startMs + i * 25, type: 'bend', port: PORT,
                           channel: CH, d1: v & 0x7F, d2: (v >> 7) & 0x7F });
        }
    }
    actions.push({ tMs: t + dur, type: 'note_off', port: PORT, channel: CH, d1: key, d2: 0 });
    actions.push({ tMs: t + dur + 300, type: 'bend', port: PORT, channel: CH, d1: 0, d2: 64 });
    const s = { idx: idx++, probe: '4', step: step, label: label, port: PORT, channel: CH,
                pitch: key, onMs: t, offMs: t + dur,
                preBendValue: bendVal(bendCents), preBendLeadMs: 250,
                midBendValue: null, postBendValue: CENTER, postBendAfterMs: 300,
                expect: o.ramp ? 'ramp' : 'morph-target',
                expectCents: expectCents, bendFraction: NaN };
    if (o.ramp) { s.rampStartMs = o.ramp.startMs; s.rampLenMs = o.ramp.lenMs;
                  s.expectCents = o.ramp.toCents; }
    slots.push(s);
    t += dur + GAP;
}

// ---- SECTION 1 — Phase 2 gate: does an M2 spectral render land on its partials?
// Each voice's FINAL pitch, sounded alone. The engine says where it should be;
// the analyzer says where it is; the gate is +/-10 cents.
const spec = M.render(P.variants.F, { maxVoices: 10 });
const lastOf = {};
spec.notes.forEach(n => { if (!lastOf[n.voice] || n.tStart > lastOf[n.voice].tStart) lastOf[n.voice] = n; });
const specTargets = [];
Object.keys(lastOf).map(Number).sort((a, b) => a - b).forEach(v => {
    const n = lastOf[v];
    // Sounding pitch is key*100 + bend — `bend` is already key-relative.
// This line read n.cents + bend, the same double-add that was live in the
// engine, so this probe's day-10 "0.4 c" result confirmed the MIDI-to-audio
// chain while agreeing with the engine's error. Fixed 2026-08-16 (2z G4).
const endCents = n.midi * 100 + n.bend[n.bend.length - 1][1];
    const key = Math.round(endCents / 100);
    const off = Math.round((endCents - key * 100) * 10) / 10;
    specTargets.push({ voice: v, key: key, off: off, endCents: endCents });
    addSlot('4a-v' + v, 'M2 voice ' + v + ' final target', key, off, off);
});

// ---- SECTION 2 — Phase 3 gate, static: a wide fan's waypoints.
// Sampling the trajectory as held pitches measures the engine's pitch maths
// precisely; the moving version follows in section 3.
const fan = M.render({
    model: 'M3', seed: 1,
    source: { kind: 'pitches', midi: [40, 44] }, target: { midi: [52, 56] },
    dials: { bias: 0, spread: 0, depth: 1 },
    carrier: { span: 20, segLen: 18, segVar: 0, striation: 'aligned' },
}, { maxVoices: 10 });
const v0 = fan.notes.filter(n => n.voice === 0).sort((a, b) => a.tStart - b.tStart);
const waypoints = [];
v0.forEach((n, i) => {
    [0, n.bend.length - 1].forEach((bi, j) => {
        if (i > 0 && j === 0) return;                     // skip duplicate seams
        const c = n.midi * 100 + n.bend[bi][1];
        const key = Math.round(c / 100);
        const off = Math.round((c - key * 100) * 10) / 10;
        waypoints.push({ key: key, off: off, cents: c });
    });
});
waypoints.forEach((w, i) =>
    addSlot('4b-w' + i, 'fan waypoint ' + i + ' (' + (w.cents / 100).toFixed(2) + ')',
            w.key, w.off, w.off));

// ---- SECTION 3 — Phase 3 gate, moving: one continuous re-keyed glissando leg.
// The ear check for the seam, and a trajectory the analyzer can fit.
const legFrom = 0, legTo = 190;
addSlot('4c-gliss', 'continuous glissando leg, one key', waypoints[0].key, legFrom, legTo,
        { dur: 5000, ramp: { startMs: 800, lenMs: 3000, toCents: legTo } });

// ---- write ---------------------------------------------------------------
const out = {
    created: new Date().toISOString(), probe: '4', pitch: waypoints[0].key, velocity: VEL,
    portA: PORT, portB: 'tuba1b', ordChannel: CH, qtChannel: 2,
    bendRangeAssumedSt: M.MEASURED.BEND_RANGE_ST, settleMs: GAP,
    outName: 'MORPH_verify', totalMs: t,
    slots: slots, actions: actions.slice().sort((a, b) => a.tMs - b.tMs),
};
fs.writeFileSync(path.join(__dirname, '..', 'probes', 'last_bend_schedule.json'),
                 JSON.stringify(out, null, 1));

const NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => NM[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
console.log('=== MORPH VERIFICATION PROBE (PLAN 2v Phase 2 + 3 gates) ===\n');
console.log('  PORT NEEDED: ' + PORT + ' only (ord = channel 1). tuba1b is NOT used.\n');
console.log('  Section 1 — M2 spectral targets, each voice sounded ALONE:');
specTargets.forEach(s => console.log('     voice ' + s.voice + '  ' + pn(s.key).padEnd(4) +
    '  intended offset ' + (s.off >= 0 ? '+' : '') + s.off + ' c'));
console.log('\n  Section 2 — wide-fan waypoints (' + waypoints.length + '):');
waypoints.forEach((w, i) => console.log('     w' + i + '  ' + pn(w.key).padEnd(4) +
    '  ' + (w.off >= 0 ? '+' : '') + w.off + ' c   = ' + (w.cents / 100).toFixed(2)));
console.log('\n  Section 3 — one continuous glissando leg, 0 -> ' + legTo + ' c over 3 s');
console.log('\n  ' + slots.length + ' slots, ' + actions.length + ' MIDI actions, ' +
            (t / 1000).toFixed(1) + ' s (' + (t / 60000).toFixed(1) + ' min)');
console.log('  wrote probes/last_bend_schedule.json');
