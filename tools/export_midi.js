#!/usr/bin/env node
// export_midi.js — score -> Standard MIDI File for the Reaper audio recording.
// One track per loopMIDI port in the FIXED order T1, T1b, T2, T2b … T10, T10b
// (empty b-tracks kept so Reaper routing stays stable across exports).
// Events come from sonify_core.compileScore — the SAME computation the
// composer score plays live (prearm CC7/CC0, curve-following CC7 stream,
// morph bends + residue cure, recVel plain notes) — serialized instead of sent.
//
//   node tools/export_midi.js --score piece-s25-finished01
//        [--out midi/<score>.mid] [--w0 s --w1 s] [--parts 0-9]
//
// REAPER: set the session tempo to 60 BPM (or accept the file's embedded
// tempo map on import) — the file is authored at 60 BPM / 960 PPQ so one
// beat = one second, tick = ~1.04 ms. At any other session tempo with the
// embedded map discarded, every duration is wrong.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Core = require(path.join(ROOT, 'score', 'public', 'sonify_core.js'));
const { writeMidi } = require(path.join(__dirname, 'midi_out.js'));

function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 ? process.argv[i + 1] : def;
}
const scoreName = arg('score');
if (!scoreName) {
    console.error('usage: export_midi.js --score <name> [--out file.mid] [--w0 s --w1 s] [--parts 0-9]');
    process.exit(2);
}
const out = arg('out', 'midi/' + scoreName + '.mid');
const w0 = arg('w0'), w1 = arg('w1');
const partsArg = arg('parts');
const parts = partsArg
    ? (partsArg.includes('-') && !partsArg.includes(',')
        ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(partsArg.split('-').map(Number))
        : partsArg.split(',').map(Number))
    : null;

const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', scoreName + '.json'), 'utf8'));
const INSTRUMENTS = new Function(
    fs.readFileSync(path.join(ROOT, 'sandbox', 'instruments.js'), 'utf8') + '\nreturn INSTRUMENTS;')();
const ccPoints = JSON.parse(fs.readFileSync(path.join(ROOT, 'probes', 'cc7_map.json'), 'utf8'))
    .points.slice().sort((a, b) => a.db - b.db);

const opts = { endSweep: true };
if (w0 != null && w1 != null) opts.window = [parseFloat(w0), parseFloat(w1)];
if (parts) opts.parts = parts;
const { events, stats, touched } = Core.compileScore(score, INSTRUMENTS, ccPoints, opts);

// fixed port -> track order: T1, T1b, T2, T2b, ...
const PORT_ORDER = [];
for (let i = 1; i <= 10; i++) PORT_ORDER.push(['tuba' + i, 'T' + i], ['tuba' + i + 'b', 'T' + i + 'b']);
const byPort = {};
for (const [port] of PORT_ORDER) byPort[port] = [];
let dropped = 0;
for (const e of events) {
    if (byPort[e.port]) byPort[e.port].push({ t: e.t, kind: e.kind, bytes: e.bytes });
    else dropped++;
}
if (dropped) console.warn('WARN: ' + dropped + ' events on unexpected ports were dropped');

const BPM = 60;   // one beat = one second; 960 PPQ -> ~1.04 ms/tick
const res = writeMidi(out, {
    bpm: BPM,
    tracks: PORT_ORDER.map(([port, name]) => ({ name, events: byPort[port] })),
});

// ---- independent read-back: parse the bytes we just wrote, recount ----
function verifyFile(file) {
    const buf = fs.readFileSync(file);
    let p = 0;
    const u32 = () => (p += 4, buf.readUInt32BE(p - 4));
    const u16 = () => (p += 2, buf.readUInt16BE(p - 2));
    if (buf.toString('ascii', 0, 4) !== 'MThd') throw new Error('no MThd');
    p = 4; const hlen = u32(); const fmt = u16(), ntrk = u16(), ppq = u16(); p = 8 + hlen;
    const counts = []; let maxTick = 0;
    for (let tI = 0; tI < ntrk; tI++) {
        if (buf.toString('ascii', p, p + 4) !== 'MTrk') throw new Error('no MTrk at track ' + tI);
        p += 4; const len = u32(); const end = p + len;
        let tick = 0, running = 0; const c = { on: 0, off: 0, cc: 0, bend: 0, name: '' };
        while (p < end) {
            let d = 0, b;
            do { b = buf[p++]; d = (d << 7) | (b & 0x7f); } while (b & 0x80);
            tick += d; if (tick > maxTick) maxTick = tick;
            let st = buf[p];
            if (st & 0x80) { p++; running = st; } else st = running;
            if (st === 0xff) { const type = buf[p++]; let l = 0; do { b = buf[p++]; l = (l << 7) | (b & 0x7f); } while (b & 0x80); if (type === 0x03) c.name = buf.toString('ascii', p, p + l); p += l; }
            else if ((st & 0xf0) === 0x90) { const vel = buf[p + 1]; p += 2; vel > 0 ? c.on++ : c.off++; }
            else if ((st & 0xf0) === 0x80) { p += 2; c.off++; }
            else if ((st & 0xf0) === 0xb0) { p += 2; c.cc++; }
            else if ((st & 0xf0) === 0xe0) { p += 2; c.bend++; }
            else if ((st & 0xf0) === 0xc0 || (st & 0xf0) === 0xd0) { p += 1; }
            else throw new Error('unexpected status 0x' + st.toString(16) + ' in track ' + tI);
        }
        counts.push(c);
    }
    return { fmt, ntrk, ppq, counts, maxTick };
}

const v = verifyFile(res.file);
const fileOn = v.counts.reduce((a, c) => a + c.on, 0);
const fileCC = v.counts.reduce((a, c) => a + c.cc, 0);
const fileBend = v.counts.reduce((a, c) => a + c.bend, 0);
const wantOn = events.filter(e => e.kind === 'on').length;
const wantCC = events.filter(e => e.kind === 'cc').length;
const wantBend = events.filter(e => e.kind === 'bend').length;
const lastT = Math.max(...events.map(e => e.t));
const durOK = Math.abs(v.maxTick / v.ppq / (BPM / 60) - lastT) < 0.01;
const good = fileOn === wantOn && fileCC === wantCC && fileBend === wantBend
    && v.ntrk === 21 && v.ppq === 960 && durOK;

console.log('WROTE ' + res.file);
console.log('  21 tracks (tempo + T1,T1b..T10,T10b) · ' + stats.notes + ' notes · '
    + wantCC + ' CC events · ' + wantBend + ' bends · ' + touched.length + ' port-channels · '
    + lastT.toFixed(2) + ' s (' + (lastT / 60).toFixed(2) + ' min, incl. the end CC7=127 sweep)');
console.log('  read-back verify: ' + (good ? 'OK — file counts match compiled events exactly'
    : 'MISMATCH — on ' + fileOn + '/' + wantOn + ' cc ' + fileCC + '/' + wantCC + ' bend ' + fileBend + '/' + wantBend
    + ' ntrk ' + v.ntrk + ' ppq ' + v.ppq + ' durOK ' + durOK));
v.counts.slice(1).forEach(c => console.log('    ' + (c.name + '    ').slice(0, 5)
    + ' notes ' + String(c.on).padStart(5) + ' · cc ' + String(c.cc).padStart(6) + ' · bend ' + String(c.bend).padStart(5)));
console.log('\n  *** REAPER: SET THE SESSION TEMPO TO 60 BPM ***');
console.log('  (or accept the embedded tempo map on import — the file is 60 BPM / 960 PPQ,');
console.log('   one beat = one second; any other tempo mis-times everything)');
if (!good) process.exit(1);
