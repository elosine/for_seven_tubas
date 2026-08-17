#!/usr/bin/env node
// pulse_build.js — build an ACCRETIVE PULSE section from a sketch score.
//
// The composer's spec (2026-08-17, the Ghost-Trance-like final section):
//   "a steady pulse and then various permutations along the way with accents"
//   - one steady pulse (120 BPM)
//   - each sketched pitch gets its own player and enters ONE AT A TIME, in the
//     order it was played into the sketch
//   - the gap before the next entry is a random 5-11 repeats of the pulse
//   - once a voice is in it stays in — by the end everyone is playing
//   - after the last entry, everyone sustains for `tail` more pulses
//
// The sketch score is READ ONLY. Its notes are the pitch material and their
// recorded ORDER is the entry order; nothing else about it is used, and it is
// never written back to.
//
//   node tools/pulse_build.js
//   node tools/pulse_build.js --seed 4 --bpm 132 --min 4 --max 9 --tail 20
//   node tools/pulse_build.js --in scores/foo.json --out scores/bar.json --flat
//
// Every run prints the drawn repeat counts, so a shape you like is reproducible
// by its seed and a shape you don't is one --seed away from another.

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');   // mulberry32: the project's RNG

// --------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
function arg(name, dflt) {
    const i = argv.indexOf('--' + name);
    if (i < 0) return dflt;
    const v = argv[i + 1];
    return (v == null || v.startsWith('--')) ? true : v;
}
const OPT = {
    in: String(arg('in', 'scores/tranceSB01.json')),
    out: arg('out', null),
    bpm: parseFloat(arg('bpm', 120)),
    min: parseInt(arg('min', 5), 10),
    max: parseInt(arg('max', 11), 10),
    tail: parseInt(arg('tail', 15), 10),
    seed: parseInt(arg('seed', 1), 10),
    noteLen: parseFloat(arg('note-len', 0.25)),
    laneBase: parseInt(arg('lane-base', 0), 10),
    flat: arg('flat', false) === true,
    start: parseFloat(arg('start', 0)),
};
if (!(OPT.bpm > 0)) throw new Error('--bpm must be positive');
if (!(OPT.min >= 1) || OPT.max < OPT.min) throw new Error('--min/--max are not a usable range');

const ROOT = path.join(__dirname, '..');
const inPath = path.isAbsolute(OPT.in) ? OPT.in : path.join(ROOT, OPT.in);
const outPath = OPT.out
    ? (path.isAbsolute(OPT.out) ? OPT.out : path.join(ROOT, OPT.out))
    : inPath.replace(/\.json$/i, '-2.json');

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

// --------------------------------------------------------------- the sketch
const src = JSON.parse(fs.readFileSync(inPath, 'utf8'));
// entry order IS the order they were played in; ties keep file order
const sketch = (src.objects || [])
    .filter(o => o.sonifyNote != null && o.type === 'waveCurve')
    .map((o, i) => Object.assign({ _i: i }, o))
    .sort((a, b) => (a.startSeconds - b.startSeconds) || (a._i - b._i));

if (!sketch.length) {
    console.error('no pitched notes found in ' + OPT.in);
    process.exit(1);
}
const lanes = (src.tracks || []).length;
if (OPT.laneBase + sketch.length > lanes) {
    console.error('WARNING: ' + sketch.length + ' voices from lane ' + OPT.laneBase +
                  ' exceeds the score\'s ' + lanes + ' tracks — the overflow will ' +
                  'land on lanes that do not exist.');
}

// --------------------------------------------------------------- the schedule
const rnd = M.mulberry32(OPT.seed);
// gap before each entry after the first: min..max inclusive
const repeats = [];
for (let k = 1; k < sketch.length; k++) {
    repeats.push(OPT.min + Math.floor(rnd() * (OPT.max - OPT.min + 1)));
}
const entry = [0];
repeats.forEach(r => entry.push(entry[entry.length - 1] + r));
const lastIn = entry[entry.length - 1];
const totalPulses = lastIn + OPT.tail;      // last voice plays exactly `tail` notes
const pulseSec = 60 / OPT.bpm;

// --------------------------------------------------------------- the objects
const objects = [];
let nid = src.nextId || 1;
const voices = sketch.map((s, k) => {
    const lane = OPT.laneBase + k;
    const y = OPT.flat ? 9 : s.nodes[0].y;
    const vel = OPT.flat ? 115 : s.recVel;
    let count = 0;
    for (let p = entry[k]; p < totalPulses; p++) {
        const t = OPT.start + p * pulseSec;
        objects.push({
            id: 'wc-' + (nid++),
            type: 'waveCurve',
            layer: lane,
            startSeconds: +t.toFixed(3),
            endSeconds: +(t + OPT.noteLen).toFixed(3),
            nodes: [{ pos: 0, y: y, smooth: 0.25 }, { pos: 1, y: y, smooth: 0.25 }],
            segments: [{ model: 'power', slope: 0 }],
            color: '#607D8B',
            fillMode: 'bottom',
            opacity: 0.55,
            performanceNotes: 'PULSE ' + noteName(s.sonifyNote),
            properties: {},
            sonifyNote: s.sonifyNote,
            technique: s.technique || 'staccato',
            sonifyMode: 'plain',
            recVel: vel,
        });
        count++;
    }
    return { k: k, lane: lane, midi: s.sonifyNote, name: noteName(s.sonifyNote),
             entryPulse: entry[k], entrySec: +(OPT.start + entry[k] * pulseSec).toFixed(3),
             count: count, y: y };
});

objects.push({
    id: 'mk-pulse-01', type: 'marker', layer: 0, time: +OPT.start.toFixed(3),
    label: 'TRANCE PULSE ' + OPT.bpm + ' — accretive (' + sketch.length + ' voices, seed ' +
           OPT.seed + ')',
    color: '#26A69A', performanceNotes: '', properties: {},
});

// --------------------------------------------------------------- write
const out = Object.assign({}, src, {
    objects: objects,
    nextId: nid + 1,
    metadata: Object.assign({}, src.metadata || {},
        { modified: new Date().toISOString(),
          note: 'accretive pulse built by tools/pulse_build.js from ' +
                path.basename(inPath) + ' (seed ' + OPT.seed + ')' }),
});
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

// --------------------------------------------------------------- report
const endSec = OPT.start + totalPulses * pulseSec;
console.log('SOURCE  ' + path.basename(inPath) + ' — ' + sketch.length + ' pitches, ' +
            lanes + ' tracks');
console.log('PULSE   ' + OPT.bpm + ' BPM (' + pulseSec.toFixed(3) + ' s), note ' +
            OPT.noteLen + ' s, seed ' + OPT.seed +
            ', repeats ' + OPT.min + '-' + OPT.max + ', tail ' + OPT.tail);
console.log('');
console.log('  #  lane  note   enters at        plays   gap before next');
voices.forEach((v, i) => {
    console.log('  ' + String(v.k + 1).padStart(2) + '  ' + String(v.lane + 1).padStart(4) +
        '  ' + v.name.padEnd(5) + '  pulse ' + String(v.entryPulse).padStart(3) +
        ' = ' + v.entrySec.toFixed(2).padStart(6) + ' s  ' +
        String(v.count).padStart(4) + '    ' +
        (i < repeats.length ? repeats[i] + ' repeats' : '—'));
});
console.log('');
console.log('ALL IN  at pulse ' + lastIn + ' = ' + (OPT.start + lastIn * pulseSec).toFixed(2) +
            ' s, then ' + OPT.tail + ' pulses together');
console.log('LENGTH  ' + totalPulses + ' pulses = ' + endSec.toFixed(2) + ' s (' +
            Math.floor(endSec / 60) + ':' + String(Math.round(endSec % 60)).padStart(2, '0') + ')');
console.log('NOTES   ' + (objects.length - 1) + ' across ' + sketch.length + ' lanes');
console.log('WROTE   ' + path.relative(ROOT, outPath));
