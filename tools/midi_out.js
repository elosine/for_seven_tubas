// midi_out.js — minimal Standard MIDI File writer (SMF type 1).
//
// Exists so a generated texture can be heard OUTSIDE the composer app, with
// Reaper doing the timing. That makes it possible to separate "the material is
// uneven" from "our browser scheduler is uneven" — a question the app cannot
// answer about itself.
//
//   const { writeMidi } = require('./midi_out');
//   writeMidi('midi/test.mid', {
//     bpm: 120,
//     tracks: [{ name: 'Tuba 1', channel: 4, notes: [{ t: 0.5, pitch: 48, dur: 0.12, vel: 95 }] }],
//   });
//
// channel is 1-based (matching sandbox/instruments.js, where staccato = ch 4).

const fs = require('fs');
const path = require('path');

const PPQ = 960;                                  // 0.52 ms per tick at 120 BPM
const BEND_RANGE_CENTS = 199;                     // MEASURED, 2v Phase 0 (1.99 st)

const vlq = n => {                                // variable-length quantity
    const out = [n & 0x7f];
    n >>= 7;
    while (n > 0) { out.unshift((n & 0x7f) | 0x80); n >>= 7; }
    return out;
};
const be = (n, bytes) => Array.from({ length: bytes }, (_, i) => (n >> (8 * (bytes - 1 - i))) & 0xff);
const chunk = (id, data) => Buffer.concat([Buffer.from(id, 'ascii'), Buffer.from(be(data.length, 4)), Buffer.from(data)]);

function trackChunk(events, name) {
    // events: {tick, kind:'on'|'off', bytes:[]} — note-OFF sorts first at equal
    // ticks so a repeated note releases before it retriggers; controllers land
    // before the attack they prepare (sonify_core's KIND_RANK, same order).
    const rank = k => (k === 'off' ? 0 : k === 'cc' ? 1 : k === 'bend' ? 2 : 3);   // off, cc, bend, on
    events.sort((a, b) => a.tick - b.tick || rank(a.kind) - rank(b.kind));
    const data = [];
    if (name) data.push(0x00, 0xff, 0x03, ...vlq(name.length), ...Buffer.from(name, 'ascii'));
    let last = 0;
    for (const e of events) {
        data.push(...vlq(Math.max(0, e.tick - last)), ...e.bytes);
        last = e.tick;
    }
    data.push(0x00, 0xff, 0x2f, 0x00);            // end of track
    return chunk('MTrk', data);
}

function writeMidi(file, { bpm = 120, tracks }) {
    const secToTick = s => Math.round(s * (bpm / 60) * PPQ);
    const usPerQn = Math.round(60000000 / bpm);

    const conductor = [];
    conductor.push({ tick: 0, kind: 'meta', bytes: [0xff, 0x51, 0x03, ...be(usPerQn, 3)] });
    const chunks = [trackChunk(conductor, 'tempo')];

    for (const tr of tracks) {
        const ch = (tr.channel || 1) - 1;
        const ev = [];
        // RAW mode (export_midi.js): pre-built {t, kind, bytes} events — the
        // channel already lives in the status byte, mixed channels per track OK.
        for (const e of tr.events || []) {
            ev.push({ tick: secToTick(e.t), kind: e.kind, bytes: e.bytes });
        }
        for (const n of tr.notes || []) {
            ev.push({ tick: secToTick(n.t), kind: 'on', bytes: [0x90 | ch, n.pitch, n.vel || 95] });
            ev.push({ tick: secToTick(n.t + n.dur), kind: 'off', bytes: [0x80 | ch, n.pitch, 0] });
        }
        // PITCH BEND — `bends: [{t, cents}]`. The range is the MEASURED one from
        // 2v Phase 0 (BEND_RANGE_ST 1.99, and RPN 0 is ignored so it cannot be
        // widened). Residue is confirmed real there too, so whoever builds a
        // schedule must end it with an explicit return to 0.
        for (const b of tr.bends || []) {
            const v = Math.max(0, Math.min(16383,
                8192 + Math.round(8192 * b.cents / BEND_RANGE_CENTS)));
            ev.push({ tick: secToTick(b.t), kind: 'bend', bytes: [0xe0 | ch, v & 0x7f, (v >> 7) & 0x7f] });
        }
        chunks.push(trackChunk(ev, tr.name));
    }

    const header = chunk('MThd', [...be(1, 2), ...be(chunks.length, 2), ...be(PPQ, 2)]);
    const abs = path.isAbsolute(file) ? file : path.join(__dirname, '..', file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, Buffer.concat([header, ...chunks]));

    const notes = tracks.reduce((a, t) => a + (t.notes ? t.notes.length : (t.events || []).filter(e => e.kind === 'on').length), 0);
    const end = Math.max(0, ...tracks.flatMap(t => (t.notes || []).map(n => n.t + n.dur)),
        ...tracks.flatMap(t => (t.events || []).map(e => e.t)));
    return { file: abs, tracks: tracks.length, notes, seconds: +end.toFixed(2), ppq: PPQ, bpm };
}

module.exports = { writeMidi, PPQ, BEND_RANGE_CENTS };
