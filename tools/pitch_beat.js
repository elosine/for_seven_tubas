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

// ===================================================================
// phase13 — WHERE BEATING STOPS, and what TEN detuned tubas do.
// phase12 confirmed the mechanism: asked 1 Hz, heard ~1 Hz, and 0.5 Hz read as
// FLANGER rather than throb (correct — a complex tone does not beat at one rate;
// partial n beats at n x Δf, so the upper partials shimmer while the fundamental
// crawls). This asks the two questions that follow.
// ===================================================================
{
    const TR = Array.from({ length: 10 }, (_, i) =>
        ({ name: `Tuba${i + 1} SI2 · ch1 ord`, channel: 1, notes: [], bends: [] }));
    const hzAt = midi => 440 * Math.pow(2, (midi - 69) / 12);
    const centsAt = (midi, beatHz) => 1200 * Math.log2(1 + beatHz / hzAt(midi));
    const plan13 = [];

    // voices: [{tuba, pitch, cents}]
    const sect = (label, dur, voices, note) => {
        for (const v of voices) {
            TR[v.tuba].bends.push({ t: +(t13 - PREARM).toFixed(3), cents: +v.cents.toFixed(2) });
            TR[v.tuba].notes.push({ t: t13, pitch: v.pitch, dur, vel: 95 });
        }
        plan13.push({ label, t: t13, dur, n: voices.length, note });
        t13 += dur + GAP;
    };
    let t13 = 1;

    // 1-2 · how far up does BEATING go before it is just an interval?
    sect('8 beats/sec — beating or roughness?', 12,
        [{ tuba: 0, pitch: PITCH, cents: 0 }, { tuba: 1, pitch: PITCH, cents: centsAt(PITCH, 8) }],
        '2 tubas');
    sect('15 beats/sec — near the bend limit, ~a whole tone apart', 12,
        [{ tuba: 0, pitch: PITCH, cents: 0 }, { tuba: 1, pitch: PITCH, cents: centsAt(PITCH, 15) }],
        '2 tubas');

    // 3-5 · TEN tubas, one pitch, fanned detuning. 45 pairs, 45 beat rates at once.
    for (const spread of [6, 13, 40]) {
        sect(`TEN tubas fanned over ${spread} cents — many beat rates at once`, 14,
            Array.from({ length: 10 }, (_, j) => ({ tuba: j, pitch: PITCH, cents: spread * j / 9 })),
            `fastest pair ${(hzAt(PITCH) * (Math.pow(2, spread / 1200) - 1)).toFixed(2)} Hz`);
    }

    // 6 · REGISTER — the same detuning beats TWICE AS FAST an octave up
    sect('SAME 13 cents at C2 / C3 / C4 — three beat rates from one detuning', 14,
        [36, 48, 60].flatMap((p, i) => [
            { tuba: i * 2, pitch: p, cents: 0 },
            { tuba: i * 2 + 1, pitch: p, cents: 13.18 }]),
        '0.5 / 1.0 / 2.0 Hz');

    // 7 · the bloom
    {
        const dur = 26, voices = Array.from({ length: 10 }, (_, j) => ({ tuba: j, pitch: PITCH }));
        for (const v of voices) TR[v.tuba].notes.push({ t: t13, pitch: v.pitch, dur, vel: 95 });
        for (let s = 0; s <= dur; s += 0.05) {
            const spread = 40 * s / dur;
            voices.forEach((v, j) => TR[v.tuba].bends.push(
                { t: +(t13 + s - (s ? 0 : PREARM)).toFixed(3), cents: +(spread * j / 9).toFixed(2) }));
        }
        plan13.push({ label: 'BLOOM · unison fanning open to 40 cents over 26 s', t: t13, dur, n: 10, note: 'the morph' });
        t13 += dur + GAP;
    }
    TR.forEach(tr => tr.bends.push({ t: +t13.toFixed(3), cents: 0 }));   // residue reset

    const r13 = writeMidi('midi/phase13-beatfield.mid', { tracks: TR.filter(x => x.notes.length) });
    console.log(`\n=== phase13-beatfield — ${r13.seconds}s, ${r13.tracks} tracks, ${r13.notes} long tones ===\n`);
    console.log('    start   section                                                    ');
    for (const p of plan13) {
        console.log(`  ${String(Math.floor(p.t / 60))}:${String(Math.round(p.t % 60)).padStart(2, '0')}` +
            `    ${p.label.padEnd(56)} (${p.n} tubas, ${p.note})`);
    }
    console.log(`\n  ROUTING: track N → "Tuba<N> SI2", ord channel 1. Bend is per-instance,`);
    console.log(`           so every tuba must be its own UVI instance.`);
}

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
