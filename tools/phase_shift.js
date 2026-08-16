#!/usr/bin/env node
// phase_shift.js — Reich-style PHASE SHIFTING between two (or more) tubas.
// Composer 2026-08-16: "two tubas, middle of the range, ~85 BPM, phase shift to
// an eighth note apart over 20 s, hold ~10 s, then back over 20 s."
//
// THE MODEL. One player keeps a strict pulse; the other plays the SAME grid
// displaced by a moving offset. The offset is expressed in BEATS (0.5 = an
// eighth), so the whole score re-scales when you change --bpm.
//
//   lane A onset k :  t0 + k*P
//   lane B onset k :  t0 + k*P + off(k*P) * P
//
// Both lanes emit the same NUMBER of notes, so they are guaranteed to be back
// in unison at the end — the drift is exactly the offset ramp and nothing else.
// A linear ramp = a constant tempo difference, which is what a player actually
// does (85 BPM against 83.6 BPM here), so nothing about this is un-performable.
//
// Sign: positive offset = lane B is LATE (drags). Negative = it pushes ahead.
//
// Durations follow D9 — fortepiano / staccato / cuivre are FIXED one-shots and
// take their measured length from bank/sample_lengths.json; only ord stretches.
//
//   node tools/phase_shift.js                          # the composer's spec
//   node tools/phase_shift.js --bpm 100 --target 0.25 --name phase02-16th
//   node tools/phase_shift.js --tech ord --legato 0.9
//
// Then: node tools/audit_playability.js phase01

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

// ---- DIALS (all overridable as --flags) ----
const D = {
    name: 'phase01-8th',
    bpm: 85,
    pitch: 48,          // C3 sci (Reaper shows C2) — dead centre of ord 30-65
    target: 0.5,        // offset to reach, IN BEATS. 0.5 = one eighth note
    lock: 4,            // s in unison at each end, so you hear the reference
    out: 20,            // s to drift apart
    hold: 10,           // s held at the target offset
    back: 20,           // s to drift back
    tech: 'staccato',   // crisp attack = the phase relationship is audible
    level: 7.5,         // curve level 0-10; drives recVel under sonifyMode plain
    legato: 0.9,        // ord only (fixed one-shots ignore it)
    lanes: '0,1',       // Tuba 1 + Tuba 2
    t0: 2,              // lead-in before the first attack
};
process.argv.slice(2).forEach((a, i, arr) => {
    if (!a.startsWith('--')) return;
    const k = a.slice(2), v = arr[i + 1];
    if (!(k in D)) { console.error('unknown flag --' + k); process.exit(1); }
    D[k] = (typeof D[k] === 'number') ? Number(v) : v;
});

const LANES = String(D.lanes).split(',').map(Number);
const P = 60 / D.bpm;                       // seconds per beat
const COLORS = ['#3F7D5A', '#8E4585', '#B08A2E', '#4E7A9B'];

// ---- the offset schedule: one table, one interpolator, one code path ----
const STAGES = [
    { name: 'unison', dur: D.lock, from: 0, to: 0 },
    { name: 'shifting apart', dur: D.out, from: 0, to: D.target },
    { name: 'held apart', dur: D.hold, from: D.target, to: D.target },
    { name: 'shifting back', dur: D.back, from: D.target, to: 0 },
    { name: 'unison', dur: D.lock, from: 0, to: 0 },
].filter(s => s.dur > 0);
const TOTAL = STAGES.reduce((a, s) => a + s.dur, 0);

function offsetBeats(t) {                    // t = grid time from the first attack
    let acc = 0;
    for (const s of STAGES) {
        if (t < acc + s.dur || s === STAGES[STAGES.length - 1]) {
            const u = Math.max(0, Math.min(1, (t - acc) / s.dur));
            return s.from + (s.to - s.from) * u;
        }
        acc += s.dur;
    }
    return 0;
}
const stageAt = t => {
    let acc = 0;
    for (const s of STAGES) { if (t < acc + s.dur) return s.name; acc += s.dur; }
    return STAGES[STAGES.length - 1].name;
};

// ---- fixed one-shot lengths (D9) ----
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
function techLength(tech, pitch) {
    const tbl = SAMPLE_LEN[tech];
    if (!tbl) return null;                                    // ord: variable
    if (tbl[pitch] != null) return tbl[pitch];
    const keys = Object.keys(tbl).map(Number);
    return tbl[keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a)];
}
const FIXED = techLength(D.tech, D.pitch);

// ---- score shell (tracks cloned from a current 10-lane score) ----
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores/trem02-phase.json'), 'utf8'));
const tracks = (src.data || src).tracks;
let nid = 1;
const objs = [];

function mkNote(lane, on, dur, colour, stage) {
    const lv = D.level;
    objs.push({
        id: 'wc-' + (nid++), type: 'waveCurve', layer: lane,
        startSeconds: +on.toFixed(4), endSeconds: +(on + dur).toFixed(4),
        nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
        segments: [{ model: 'power', slope: 0 }],
        color: colour, fillMode: 'bottom', opacity: 0.55,
        performanceNotes: 'phase/' + stage, properties: {},
        sonifyNote: D.pitch, technique: D.tech, sonifyMode: 'plain',
        recVel: Math.max(1, Math.min(127, Math.round(lv / 10 * 127))),
    });
}
function mkMarker(time, label, colour) {
    objs.push({
        id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +time.toFixed(2),
        label, color: colour, performanceNotes: '', properties: {},
    });   // objects, NEVER the markers array — Principle 4: markers[] never renders
}

// ---- generate ----
const N = Math.floor(TOTAL / P) + 1;
const onsets = LANES.map((lane, li) => {
    const shifted = li > 0;                              // lane 0 = the strict pulse
    const times = [];
    for (let k = 0; k < N; k++) {
        const grid = k * P;
        times.push(D.t0 + grid + (shifted ? offsetBeats(grid) * P : 0));
    }
    times.forEach((on, k) => {
        const gap = (times[k + 1] != null ? times[k + 1] : on + P) - on;
        mkNote(lane, on, FIXED != null ? FIXED : Math.max(0.04, gap * D.legato),
            COLORS[li % COLORS.length], stageAt(k * P));
    });
    return times;
});

// ---- markers at every stage boundary ----
const head = `PHASE · 2 tubas ${pn(D.pitch)} (MIDI ${D.pitch}) ${D.tech} · ${D.bpm} BPM` +
    ` · target ${D.target} beat = ${(D.target * P * 1000).toFixed(0)} ms`;
mkMarker(D.t0, head, COLORS[0]);
{
    let acc = 0;
    STAGES.forEach((s, i) => {
        const at = D.t0 + acc;
        const lbl = `${i + 1}. ${s.name} · ${s.from === s.to
            ? `${s.from} beat` : `${s.from} → ${s.to} beat`} over ${s.dur}s`;
        if (i > 0) mkMarker(at, lbl, COLORS[1]);
        acc += s.dur;
    });
    mkMarker(D.t0 + TOTAL, '— end —', COLORS[0]);
}

const out = {
    version: 1, layoutVersion: 2, tracks, assets: {},
    metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
    objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid,
};
fs.writeFileSync(path.join(ROOT, 'scores/' + D.name + '.json'), JSON.stringify(out));

// ---- VERIFY: report what was actually written, not what was intended ----
const A = onsets[0], B = onsets[1];
console.log(`\n${D.name}: ${LANES.length} lanes x ${N} notes = ${N * LANES.length} attacks` +
    `, ${(D.t0 + TOTAL).toFixed(1)}s · beat ${(P * 1000).toFixed(1)} ms` +
    ` · ${D.tech} length ${FIXED != null ? FIXED + 's (fixed, D9)' : 'legato ' + D.legato}`);

console.log('\n  stage boundaries — offset measured off the written onsets:');
let acc = 0;
[...STAGES.map(s => { const a = acc; acc += s.dur; return { t: a, s }; }), { t: TOTAL, s: { name: 'end' } }]
    .forEach(({ t, s }) => {
        const k = Math.min(N - 1, Math.round(t / P));
        const ms = (B[k] - A[k]) * 1000;
        console.log(`    ${(D.t0 + t).toFixed(1).padStart(6)}s  ${s.name.padEnd(15)}` +
            `offset ${ms.toFixed(0).padStart(5)} ms = ${(ms / (P * 1000)).toFixed(3)} beat`);
    });

const gaps = l => l.slice(1).map((t, i) => t - l[i]);
const gA = gaps(A), gB = gaps(B);
const rng = g => `${Math.min(...g).toFixed(3)}–${Math.max(...g).toFixed(3)}s`;
console.log(`\n  inter-onset within a lane:  A ${rng(gA)}   B ${rng(gB)}`);
console.log(`  lane B implied tempo:       ${(60 / Math.max(...gB)).toFixed(1)}–${(60 / Math.min(...gB)).toFixed(1)} BPM` +
    ` (lane A steady ${D.bpm})`);
const monotonic = [gA, gB].every(g => g.every(x => x > 0));
const clears = FIXED == null || Math.min(...gA, ...gB) > FIXED;
console.log(`  onsets strictly increasing: ${monotonic ? 'yes' : 'NO — BUG'}` +
    `\n  every note ends before the same player's next attack: ${clears ? 'yes' : 'NO — self-overlap'}`);
