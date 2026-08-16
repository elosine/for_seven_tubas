#!/usr/bin/env node
// pitch_beat.js — REAL acoustic beating: two sustained tones a few cents apart.
//
// WHY THIS EXISTS. Everything up to phase11 beat by displacing ATTACKS in time.
// That works while the attacks are the sound (staccato) and does nothing at all
// once they are not: in an ord wash the onsets are masked by nine other tones
// still sounding, so the composer heard phase11 as "everything continuous, no
// swells at all". Measured beforehand and it says the same thing — the count of
// sounding notes never moves off 8-10, so there is nothing to swell.
//
// The composer's ORIGINAL description was never the rhythmic analogue:
//   "acoustic beating when two notes are approaching unison — the flutter becomes
//    quicker, and you can calculate and adjust the rate of deviating from unison."
// That is two PITCHES a few cents apart, and it modulates real amplitude.
//
//   beat rate (Hz) = |f1 - f2|          cents = 1200 * log2(1 + beat/f)
//
// At C3 (130.81 Hz): 0.5 Hz beat = 6.6 cents · 1 Hz = 13.2 · 2 Hz = 26.3 ·
// 4 Hz = 52.2. All far inside the patch's measured +/-199 cent bend range.
//
// PERFORMABILITY — this is the part that matters for the piece. A player cannot
// be told "play 13 cents sharp", but beating is SELF-CORRECTING: they hear the
// beat and adjust until it is at the asked-for speed. So "beat about twice a
// second" is a real instruction in a way that "+26 cents" never was. Pitch
// beating is MORE performable than the timing version, not less.
//
// MIDI ONLY, on purpose: the composer score has no pitch bend on these objects
// (2v owns that), so a score version would play at the wrong pitches and lie.
//
//   node tools/pitch_beat.js

const path = require('path');
const { writeMidi, BEND_RANGE_CENTS } = require('./midi_out');

const PITCH = 48;                                   // C3 sci (Reaper C2)
const F = 440 * Math.pow(2, (PITCH - 69) / 12);     // 130.81 Hz
const centsFor = beatHz => 1200 * Math.log2(1 + beatHz / F);

const SECTION = 12, SWEEP = 20, GAP = 2, PREARM = 0.05;   // PREARM: 2v Phase 0
const RATES = [0, 0.5, 1, 2, 4];

const A = { name: `Tuba1 SI2 · ch1 ord · REFERENCE (no bend)`, channel: 1, notes: [], bends: [] };
const B = { name: `Tuba2 SI2 · ch1 ord · DETUNED`, channel: 1, notes: [], bends: [] };
const plan = [];

let t = 1;
for (const hz of RATES) {
    const cents = centsFor(hz);
    // bend is armed BEFORE the note starts — a bend sent after note-on slides
    B.bends.push({ t: +(t - PREARM).toFixed(3), cents: +cents.toFixed(2) });
    for (const tr of [A, B]) tr.notes.push({ t, pitch: PITCH, dur: SECTION, vel: 95 });
    plan.push({ label: hz === 0 ? 'UNISON (control)' : `${hz} beats/sec`,
        t, cents: +cents.toFixed(2), dur: SECTION });
    t += SECTION + GAP;
}

// SWEEP — 0 to 4 beats/sec over 20 s, bend refreshed every 50 ms
{
    B.bends.push({ t: +(t - PREARM).toFixed(3), cents: 0 });
    for (const tr of [A, B]) tr.notes.push({ t, pitch: PITCH, dur: SWEEP, vel: 95 });
    for (let s = 0; s <= SWEEP; s += 0.05) {
        B.bends.push({ t: +(t + s).toFixed(3), cents: +centsFor(4 * s / SWEEP).toFixed(2) });
    }
    plan.push({ label: 'SWEEP 0 → 4 beats/sec', t, cents: +centsFor(4).toFixed(2), dur: SWEEP });
    t += SWEEP + GAP;
}
B.bends.push({ t: +t.toFixed(3), cents: 0 });        // residue is real — always reset

const r = writeMidi('midi/phase12-pitchbeat.mid', { tracks: [A, B] });

console.log(`\n=== phase12-pitchbeat — ${r.seconds}s, 2 tracks, ${r.notes} long tones ===`);
console.log(`  ${PITCH} = C3 = ${F.toFixed(2)} Hz · bend range ${BEND_RANGE_CENTS}c (measured)\n`);
console.log('    start   section                  detune    check');
for (const p of plan) {
    const back = F * (Math.pow(2, p.cents / 1200) - 1);      // cents -> Hz, round trip
    console.log(`  ${String(Math.floor(p.t / 60)) + ':' + String(Math.round(p.t % 60)).padStart(2, '0')}` +
        `    ${p.label.padEnd(24)} ${(p.cents + 'c').padStart(7)}   ` +
        `= ${back.toFixed(2)} Hz apart → ${back.toFixed(2)} beats/sec`);
}
console.log(`\n  bend events: ${B.bends.length} (incl. the reset to 0 at the end)`);
console.log(`  ROUTING: both tracks are ord on channel 1 — drop track 1 on "Tuba1 SI2"`);
console.log(`           and track 2 on "Tuba2 SI2". Bend is per-instance, so they`);
console.log(`           MUST be on two different UVI instances or the detune is lost.`);
