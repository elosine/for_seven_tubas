// trem_tests.js — SINGLE-PLAYER tremolo tests + a 2-tuba phase-shift test
// (composer 2026-08-14; ensemble/interlocking tremolo comes later, PLAN 2j).
//
// SPEED CEILING — the governing rule from the tuba literature is "you must not
// trill faster than you can slur", so max tremolo rate = max clean legato slur
// rate for that interval in that register. No published notes/sec figure was
// found, so these are ESTIMATES to be verified by ear / with players:
//   half step (single valve, F2-F#2):  MAX 4.5 Hz  = 9 alternations/s
//   fifth   (partial + valve, F2-C3):  MAX 3.0 Hz  = 6 alternations/s
// Hz here = ONE UP-AND-DOWN CYCLE (two notes), per the composer's ".8 hz".
// The tables step to these; change MAX_HALF / MAX_FIFTH after the listen.
//
// Pitches: MIDI 41 = F2 scientific (~87.31 Hz) — Reaper displays it as F1.
//   half step -> 41/42 (F2/F#2) · fifth -> 41/48 (F2/C3, ~130.81 Hz)
//
// Outputs: scores/trem01-single.json · scores/trem02-phase.json

const fs = require('fs');

// ---- DIALS ----
const F_LO = 0.8;                 // "pretty slow" start (Hz, up-and-down cycles)
const MAX_HALF = 4.5, MAX_FIFTH = 3.0;
const SWEEP = 14, LONG = 28;      // section lengths (s)
const BREATH = 0.5;               // simulated breath gap (s)
const PHASE_BASE = 3.0;           // 2-tuba test: both start here (6 alternations/s)
const PHASE_LOCK = 4;             // seconds locked in phase at each end
const PHASE_DRIFT = 30;           // 180deg at 15 s, back in phase at 30 s
const LV = 7.5, LEGATO = 0.98;
const HALF = [41, 42], FIFTH = [41, 48];
const COLOR = '#A0522D';
const DT = 0.0001;                // phase-integration step (0.1 ms)

// note times for any rate function f(t) in Hz — integrate phase, emit a note
// every half cycle (one note per direction of the tremolo)
function noteTimes(fOf, durSec) {
  const out = [];
  let phase = 0, next = 0;
  for (let t = 0; t < durSec; t += DT) {
    phase += fOf(t) * DT;
    while (phase >= next) { out.push(+t.toFixed(4)); next += 0.5; }
  }
  return out.filter(t => t < durSec);   // drop a note rounded onto the boundary
}
const expSweep = (f0, f1, T) => t => f0 * Math.pow(f1 / f0, Math.min(1, t / T));

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
const shell = (objs, nid) => ({ version: 1, layoutVersion: 2, tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid });

function mkNote(nid, lane, on, dur, pitch, lv) {
  return { id: 'wc-' + nid, type: 'waveCurve', layer: lane,
    startSeconds: +on.toFixed(4), endSeconds: +(on + dur).toFixed(4),
    nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
    segments: [{ model: 'power', slope: 0 }],
    color: COLOR, fillMode: 'bottom', opacity: 0.55, performanceNotes: 'trem', properties: {},
    sonifyNote: pitch, technique: 'ord', sonifyMode: 'plain',
    recVel: Math.max(1, Math.min(127, Math.round(lv / 10 * 127))) };
}

// ---------- FILE 1: single-player ----------
{
  let nid = 1; const objs = []; let cursor = 2;
  const section = (label, pair, fOf, durSec, breathAt) => {
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
      label, color: COLOR, performanceNotes: '', properties: {} });
    let times = noteTimes(fOf, durSec);
    let gapIdx = -1;
    if (breathAt != null) {
      gapIdx = times.findIndex(t => t >= breathAt);
      times = times.filter(t => t < breathAt || t >= breathAt + BREATH);
    }
    times.forEach((t, i) => {
      const nextT = times[i + 1] != null ? times[i + 1] : t + (t - (times[i - 1] || t - 0.2));
      let dur = Math.max(0.04, (nextT - t) * LEGATO);
      let lv = LV;
      if (breathAt != null) {
        if (t < breathAt && t > breathAt - 0.9) lv = LV - 2.2 * (1 - (breathAt - t) / 0.9);  // ease off to breathe
        if (t >= breathAt + BREATH && t < breathAt + BREATH + 0.5) lv = LV + 1.2;            // fresh entry
        if (t < breathAt && times[i + 1] >= breathAt + BREATH) dur = Math.min(dur, 0.18);    // clip into the gap
      }
      objs.push(mkNote(nid++, 0, cursor + t, dur, pair[i % 2], +lv.toFixed(1)));
    });
    console.log(' ', label, '->', times.length, 'notes' + (gapIdx >= 0 ? ' (breath at ' + breathAt + 's)' : ''));
    cursor += durSec + 3;
  };

  section('T1 half step F2-F#2 · ' + F_LO + '->' + MAX_HALF + ' Hz over ' + SWEEP + 's',
    HALF, expSweep(F_LO, MAX_HALF, SWEEP), SWEEP);
  section('T2 fifth F2-C3 · ' + F_LO + '->' + MAX_FIFTH + ' Hz over ' + SWEEP + 's',
    FIFTH, expSweep(F_LO, MAX_FIFTH, SWEEP), SWEEP);
  section('T3 half step · ' + MAX_HALF + '->' + F_LO + ' Hz (decel mirror)',
    HALF, expSweep(MAX_HALF, F_LO, SWEEP), SWEEP);
  section('T4 half step · ' + F_LO + '->' + MAX_HALF + ' Hz over ' + LONG + 's, BREATH at halfway',
    HALF, expSweep(F_LO, MAX_HALF, LONG), LONG, LONG / 2);

  fs.writeFileSync('scores/trem01-single.json', JSON.stringify(shell(objs, nid)));
  console.log('trem01-single:', objs.filter(o => o.type === 'waveCurve').length, 'notes,',
    (cursor / 60).toFixed(1), 'min');
}

// ---------- FILE 2: two tubas, phase shift ----------
{
  let nid = 1; const objs = []; const t0 = 2;
  const total = PHASE_LOCK * 2 + PHASE_DRIFT;
  const DELTA = 1 / PHASE_DRIFT;   // one full cycle of drift over 30 s -> 180deg at 15 s
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: t0,
    label: 'PHASE · 2 tubas, half step F2-F#2 @ ' + PHASE_BASE + ' Hz · ' + PHASE_LOCK +
      's locked → 180° at ' + (PHASE_LOCK + PHASE_DRIFT / 2) + 's → back in phase at ' +
      (PHASE_LOCK + PHASE_DRIFT) + 's → ' + PHASE_LOCK + 's locked',
    color: COLOR, performanceNotes: '', properties: {} });
  const rate1 = () => PHASE_BASE;
  const rate2 = t => (t > PHASE_LOCK && t <= PHASE_LOCK + PHASE_DRIFT) ? PHASE_BASE + DELTA : PHASE_BASE;
  [[0, rate1], [1, rate2]].forEach(([lane, f]) => {
    const times = noteTimes(f, total);
    times.forEach((t, i) => {
      const nextT = times[i + 1] != null ? times[i + 1] : t + 1 / (2 * PHASE_BASE);
      objs.push(mkNote(nid++, lane, t0 + t, Math.max(0.04, (nextT - t) * LEGATO), HALF[i % 2], LV));
    });
    console.log('  lane', lane + ':', times.length, 'notes');
  });
  fs.writeFileSync('scores/trem02-phase.json', JSON.stringify(shell(objs, nid)));

  // verify the phase relationship at the checkpoints
  const notesOf = lane => objs.filter(o => o.type === 'waveCurve' && o.layer === lane).map(o => o.startSeconds);
  const A = notesOf(0), B = notesOf(1);
  [PHASE_LOCK, PHASE_LOCK + PHASE_DRIFT / 2, PHASE_LOCK + PHASE_DRIFT, total].forEach(cp => {
    const t = t0 + cp;
    const near = arr => arr.reduce((a, b) => Math.abs(b - t) < Math.abs(a - t) ? b : a);
    const off = Math.abs(near(A) - near(B)) * PHASE_BASE * 360;   // degrees of a full cycle
    console.log('  at ' + cp + 's: offset ' + (off % 360).toFixed(0) + '° (0=in phase, 180=interlocked)');
  });
  console.log('trem02-phase:', objs.filter(o => o.type === 'waveCurve').length, 'notes,', total + 's');
}
