#!/usr/bin/env node
// phase_shift.js — Reich-style PHASE SHIFTING between two (or more) tubas.
// Research + recipe hunt: docs/PHASE_SHIFTING.md.
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
// does, so nothing here is un-performable.
//
// THE GOVERNING DIAL IS NOT THE SHIFT DURATION — it is DRIFT PER ATTACK
// (ms of offset gained per beat). That is what the ear tracks, and it is
// tempo-invariant, so it is the number the recipes are written in.
// Reference: Reich's Drumming advances one full position in 20-30 s
// (~12-18 ms/beat at 100 BPM). See docs/PHASE_SHIFTING.md.
//
// NOTE LENGTH (composer 2026-08-16): the written block is a VISUAL, set by
// --notelen, and no longer the measured one-shot length. A staccato sample is
// a fixed one-shot (D9/2n) — the probe measured where it ENDS ITSELF, and
// whether note-off truncates it was never tested. Short blocks let the score
// read cleanly and run at rapid tempos; if the sound is unchanged, note-off
// does not truncate and the block is a convenience, not a lie about attack
// placement. Pass --notelen sample to go back to the measured length.
//
//   node tools/phase_shift.js --bpm 100 --out 60 --back 60 --name phase02-m60
//   node tools/phase_shift.js --tech ord --notelen sample --legato 0.9
//
// Then: node tools/audit_playability.js phase0

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
    notelen: 0.12,      // s written per note; 'sample' = measured one-shot (D9)
    level: 7.5,         // curve level 0-10; drives recVel under sonifyMode plain
    legato: 0.9,        // ord + --notelen sample only
    lanes: '0,1',       // Tuba 1 + Tuba 2
    t0: 2,              // lead-in before the first attack
    marks: 1,           // 1 = mark where the offset crosses each listening threshold
};
process.argv.slice(2).forEach((a, i, arr) => {
    if (!a.startsWith('--')) return;
    const k = a.slice(2), v = arr[i + 1];
    if (!(k in D)) { console.error('unknown flag --' + k); process.exit(1); }
    D[k] = (typeof D[k] === 'number' && v !== 'sample') ? Number(v) : v;
});

const LANES = String(D.lanes).split(',').map(Number);
const P = 60 / D.bpm;                       // seconds per beat
const COLORS = ['#3F7D5A', '#8E4585', '#B08A2E', '#4E7A9B'];
const MARK_COL = '#7A7A7A';

// The perceptual ladder a single slow shift traverses, in ms of offset.
// Predicted boundaries — the point of the experiment is to replace them with
// the composer's ear. docs/PHASE_SHIFTING.md carries the table.
const THRESHOLDS_MS = [10, 20, 30, 50, 80, 120, 160, 200, 250, 300, 400, 500];

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

// ---- note length ----
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
function techLength(tech, pitch) {
    const tbl = SAMPLE_LEN[tech];
    if (!tbl) return null;                                    // ord: variable
    if (tbl[pitch] != null) return tbl[pitch];
    const keys = Object.keys(tbl).map(Number);
    return tbl[keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a)];
}
const SAMPLE = techLength(D.tech, D.pitch);                   // what it actually rings
const WRITTEN = D.notelen === 'sample' ? SAMPLE : Number(D.notelen);   // what we send

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
        mkNote(lane, on, WRITTEN != null ? WRITTEN : Math.max(0.04, gap * D.legato),
            COLORS[li % COLORS.length], stageAt(k * P));
    });
    return times;
});

// ---- markers: the stages, then the listening ladder on the way out ----
const driftPerBeat = (D.target * P * 1000) / (D.out / P);     // ms of offset per beat
const head = `PHASE · 2 tubas ${pn(D.pitch)} ${D.tech} · ${D.bpm} BPM` +
    ` · out ${D.out}s to ${(D.target * P * 1000).toFixed(0)} ms` +
    ` · DRIFT ${driftPerBeat.toFixed(1)} ms/beat`;
mkMarker(D.t0, head, COLORS[0]);
let acc = 0;
const stageStart = STAGES.map(s => { const a = acc; acc += s.dur; return a; });
STAGES.forEach((s, i) => {
    if (i === 0) return;
    mkMarker(D.t0 + stageStart[i], `${i + 1}. ${s.name} · ${s.from === s.to
        ? `${(s.from * P * 1000).toFixed(0)} ms` : `${(s.from * P * 1000).toFixed(0)} → ${(s.to * P * 1000).toFixed(0)} ms`}`,
        COLORS[1]);
});
mkMarker(D.t0 + TOTAL, '— end —', COLORS[0]);

const crossings = [];
if (+D.marks) {
    STAGES.forEach((s, i) => {
        if (s.to <= s.from) return;                            // rising stages only
        THRESHOLDS_MS.forEach(ms => {
            const beats = ms / 1000 / P;
            if (beats <= s.from || beats > s.to) return;
            const t = stageStart[i] + s.dur * (beats - s.from) / (s.to - s.from);
            crossings.push({ ms, t });
            mkMarker(D.t0 + t, `${ms} ms`, MARK_COL);
        });
    });
}

const out = {
    version: 1, layoutVersion: 2, tracks, assets: {},
    metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
    objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid,
};
fs.writeFileSync(path.join(ROOT, 'scores/' + D.name + '.json'), JSON.stringify(out));

// ---- VERIFY: report what was actually written, not what was intended ----
const A = onsets[0], B = onsets[1];
console.log(`\n${D.name}: ${LANES.length} lanes x ${N} notes, ${(D.t0 + TOTAL).toFixed(1)}s` +
    ` · beat ${(P * 1000).toFixed(0)} ms · block ${WRITTEN}s written` +
    (SAMPLE != null ? ` (sample rings ${SAMPLE}s)` : ''));
console.log(`  DRIFT ${driftPerBeat.toFixed(2)} ms/beat` +
    ` · ${(D.out / P / D.target).toFixed(0)} attacks to traverse a full beat` +
    ` · Reich Drumming ≈ 12-18 ms/beat`);

console.log('\n  stage boundaries — offset measured off the written onsets:');
[...STAGES.map((s, i) => ({ t: stageStart[i], n: s.name })), { t: TOTAL, n: 'end' }].forEach(({ t, n }) => {
    const k = Math.min(N - 1, Math.round(t / P));
    const ms = (B[k] - A[k]) * 1000;
    console.log(`    ${(D.t0 + t).toFixed(1).padStart(7)}s  ${n.padEnd(15)}${ms.toFixed(0).padStart(5)} ms` +
        ` = ${(ms / (P * 1000)).toFixed(3)} beat`);
});
if (crossings.length) {
    console.log('\n  listening ladder (offset crosses, on the way out):');
    console.log('    ' + crossings.map(c => `${c.ms}ms @ ${(D.t0 + c.t).toFixed(1)}s`).join(' · '));
}

const gaps = l => l.slice(1).map((t, i) => t - l[i]);
const gA = gaps(A), gB = gaps(B);
const tightest = Math.min(...gA, ...gB);
console.log(`\n  tightest attack pair on one player: ${tightest.toFixed(3)}s` +
    ` · lane B tempo ${(60 / Math.max(...gB)).toFixed(1)}-${(60 / Math.min(...gB)).toFixed(1)} BPM (A steady ${D.bpm})`);
console.log(`  onsets strictly increasing: ${[gA, gB].every(g => g.every(x => x > 0)) ? 'yes' : 'NO — BUG'}` +
    `\n  written blocks clear the next attack: ${tightest > WRITTEN ? 'yes' : 'NO — overlap'}` +
    (SAMPLE != null && tightest <= SAMPLE
        ? `\n  *** SAMPLE OVERLAP: it rings ${SAMPLE}s into a ${tightest.toFixed(3)}s gap —` +
          ` the score looks clean but one player is double-sounding ***` : ''));
