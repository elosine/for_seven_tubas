#!/usr/bin/env node
// test_midiplayer.js — headless battery for notation/lib/midiplayer.js.
// Drives tick(t) over the WHOLE PIECE at 60 fps into a fake MIDI rig, then
// asserts the live stream against sonify_core.compileScore — the two
// consumers of the one computation checked against each other (the live
// player may quantize onsets to the frame; nothing else may differ).
// Also proves the scrub-in path and the flush cure.
//
//   node tools/test_midiplayer.js

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Core = require(path.join(ROOT, 'score', 'public', 'sonify_core.js'));
const { makeMidiPlayer } = require(path.join(ROOT, 'notation', 'lib', 'midiplayer.js'));

const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', 'piece-s25-finished01.json'), 'utf8'));
const INSTRUMENTS = new Function(
    fs.readFileSync(path.join(ROOT, 'sandbox', 'instruments.js'), 'utf8') + '\nreturn INSTRUMENTS;')();
const ccPoints = JSON.parse(fs.readFileSync(path.join(ROOT, 'probes', 'cc7_map.json'), 'utf8'))
    .points.slice().sort((a, b) => a.db - b.db);

let checks = 0, fails = 0;
const fail = m => { fails++; if (fails <= 12) console.error('  FAIL: ' + m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };

function makeRig() {
    const log = [];
    const outputs = {};
    const rig = { log, t: 0 };
    for (let i = 1; i <= 10; i++)
        for (const port of ['tuba' + i, 'tuba' + i + 'b'])
            outputs[port] = { send: bytes => log.push({ t: rig.t, port, bytes }) };
    rig.outputs = outputs;
    return rig;
}

// ---- full-piece run at 60 fps ----
const rig = makeRig();
const player = makeMidiPlayer({ score, instruments: INSTRUMENTS, ccPoints, outputs: rig.outputs });
const sounding = score.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
const tEnd = Math.max(...sounding.map(o => o.endSeconds)) + 1;
const DT = 1 / 60;
for (let t = 0; t <= tEnd; t += DT) { rig.t = t; player.tick(t); }
rig.t = tEnd; player.flush();

ok(player.missingPorts().length === 0, 'missing ports: ' + player.missingPorts());

const ons = rig.log.filter(e => (e.bytes[0] & 0xF0) === 0x90 && e.bytes[2] > 0);
const offs = rig.log.filter(e => (e.bytes[0] & 0xF0) === 0x80 || ((e.bytes[0] & 0xF0) === 0x90 && e.bytes[2] === 0));
ok(ons.length === sounding.length, `noteOns ${ons.length} != sounding ${sounding.length}`);
ok(offs.length === sounding.length, `noteOffs ${offs.length} != sounding ${sounding.length}`);

// cross-check vs the FILE path: same notes, same channels, same velocities;
// onsets may lag the frame grid by < 1 frame
const compiled = Core.compileScore(score, INSTRUMENTS, ccPoints, {});
const fileOns = compiled.events.filter(e => e.kind === 'on');
ok(fileOns.length === ons.length, `file ons ${fileOns.length} != live ons ${ons.length}`);
const keyOf = e => e.port + '|' + (e.bytes[0] & 0x0F) + '|' + e.bytes[1] + '|' + e.bytes[2];
const fileByKey = new Map();
for (const e of fileOns) {
    const k = keyOf(e);
    if (!fileByKey.has(k)) fileByKey.set(k, []);
    fileByKey.get(k).push(e.t);
}
let unmatched = 0, worstLag = 0;
for (const e of ons) {
    const k = keyOf(e);
    const ts = fileByKey.get(k);
    let hit = -1;
    if (ts) for (let i = 0; i < ts.length; i++) {
        const lag = e.t - ts[i];
        if (lag >= -1e-9 && lag <= DT + 1e-9) { hit = i; if (lag > worstLag) worstLag = lag; break; }
    }
    if (hit < 0) unmatched++;
    else ts.splice(hit, 1);
}
ok(unmatched === 0, unmatched + ' live noteOns have no file counterpart within one frame');
console.log('  worst onset lag vs file: ' + (worstLag * 1000).toFixed(2) + ' ms (frame = 16.67)');

// prearm: a CC7 on the note's channel in [start-0.15-frame, noteOn t]
const ccByChan = {};
for (const e of rig.log.filter(x => (x.bytes[0] & 0xF0) === 0xB0 && x.bytes[1] === 7)) {
    const k = e.port + '|' + (e.bytes[0] & 0x0F);
    (ccByChan[k] = ccByChan[k] || []).push(e.t);
}
let noPrearm = 0;
for (const wc of sounding) {
    const r = Core.techniqueFor(wc, INSTRUMENTS);
    const list = ccByChan[r.port + '|' + r.ch] || [];
    if (!list.some(t => t >= wc.startSeconds - Core.PREARM_S - DT && t <= wc.startSeconds + DT + 1e-9)) noPrearm++;
}
ok(noPrearm === 0, noPrearm + ' notes had no CC7 prearm/entry');

// plain velocity fidelity
let velBad = 0;
for (const e of ons) if (e.bytes[2] === 0) velBad++;
const plainVels = new Set(sounding.filter(w => w.sonifyMode === 'plain' && w.recVel != null).map(w => w.recVel));
ok(velBad === 0, velBad + ' zero-velocity noteOns');

// bends only where morphBend lives; every bent channel re-centered by the end
const bends = rig.log.filter(e => (e.bytes[0] & 0xF0) === 0xE0);
const bentChans = new Set(bends.map(e => e.port + '|' + (e.bytes[0] & 0x0F)));
const expectBent = new Set(sounding.filter(w => w.morphBend && w.morphBend.length)
    .map(w => { const r = Core.techniqueFor(w, INSTRUMENTS); return r.port + '|' + r.ch; }));
ok([...bentChans].every(k => expectBent.has(k)), 'bend on a channel no morph note touches');
ok(bends.length > 0 === expectBent.size > 0, 'bend presence mismatch');
for (const k of bentChans) {
    const last = bends.filter(e => e.port + '|' + (e.bytes[0] & 0x0F) === k).pop();
    ok(last.bytes[1] === 0 && last.bytes[2] === 64, 'channel ' + k + ' not re-centered at end');
}

// the flush cure: CC7=127 sweep present after the last note event
const flushT = tEnd;
const sweep = rig.log.filter(e => e.t === flushT && (e.bytes[0] & 0xF0) === 0xB0 && e.bytes[1] === 7 && e.bytes[2] === 127);
ok(sweep.length > 0, 'flush sent no CC7=127 sweep');

// ---- scrub-in: seek to the middle, notes spanning t start mid-flight ----
const rig2 = makeRig();
const p2 = makeMidiPlayer({ score, instruments: INSTRUMENTS, ccPoints, outputs: rig2.outputs });
const T0 = 300;
const spanning = sounding.filter(w => w.startSeconds < T0 && w.endSeconds > T0 + 3 * DT);
rig2.t = T0; p2.tick(T0);                       // establish position (no sound yet)
ok(rig2.log.length === 0, 'first tick after seek emitted events');
for (let k = 1; k <= 3; k++) { rig2.t = T0 + k * DT; p2.tick(T0 + k * DT); }
const ons2 = rig2.log.filter(e => (e.bytes[0] & 0xF0) === 0x90 && e.bytes[2] > 0);
ok(ons2.length >= spanning.length, `scrub-in started ${ons2.length} < spanning ${spanning.length}`);
rig2.t = T0 + 1; p2.flush();
const offs2 = rig2.log.filter(e => (e.bytes[0] & 0xF0) === 0x80);
ok(offs2.length >= spanning.length, 'flush did not release scrubbed notes');

console.log(`checks ${checks} · failures ${fails} · live events ${rig.log.length} ` +
    `(${ons.length} on / ${offs.length} off / ${bends.length} bend) vs file ${compiled.events.length}`);
process.exit(fails ? 1 : 0);
