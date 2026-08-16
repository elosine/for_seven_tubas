#!/usr/bin/env node
// phase_shift.js — phase shifting as a TEXTURE device. Research: docs/PHASE_SHIFTING.md.
//
// TWO MODELS, one generator.
//
// 1. SWEEP (`--model sweep`) — the Reich move. One player holds a strict pulse,
//    the other plays the SAME grid displaced by a moving offset, out and back.
//    Good for FINDING the categories: one slow pass traverses every phase
//    relationship exactly once, with markers where it crosses each threshold.
//
// 2. BEAT (`--model beat`) — the acoustic-beating model, and the one that makes
//    a TEXTURE. Two groups simply hold DIFFERENT STEADY TEMPOS. Their phase
//    relationship then cycles forever at the difference frequency, exactly as
//    two detuned tones beat:
//
//        lap time T (s) = 60 / (ΔBPM x players per voice)
//        ΔBPM = 60 x voice-players / T
//
//    No accelerando, no Reich-grade skill: each player holds one steady tempo
//    and the beating is automatic. Ramp one voice's tempo and the flutter
//    accelerates — that is the "beating tones" effect, calculable in advance.
//
// A VOICE IS A HOCKETED GROUP. Density is what makes flutter audible, and one
// tuba cannot articulate fast enough (staccato rings ~0.42 s → ~2.3 attacks/s).
// So a voice is N players round-robin on one composite pulse: composite rate =
// N x BPM/60, while each player stays comfortable. 5 + 5 across the ten parts
// gives ~9 attacks/s per voice, ~18/s interlocked — right at the ensemble
// ceiling established by 2t.
//
//   node tools/phase_shift.js --preset fluttermap
//   node tools/phase_shift.js --preset accel
//   node tools/phase_shift.js --preset list
//   node tools/phase_shift.js --model sweep --name phase02-m60 --bpm 100 --out 60 --back 60
//
// Then: node tools/audit_playability.js phase

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const r2 = x => +x.toFixed(2);

// ---- measured one-shot lengths (D9) ----
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
function ringLength(tech, pitch) {
    const tbl = SAMPLE_LEN[tech];
    if (!tbl) return null;                                    // ord: variable
    if (tbl[pitch] != null) return tbl[pitch];
    const keys = Object.keys(tbl).map(Number);
    return tbl[keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a)];
}

const COLORS = ['#3F7D5A', '#8E4585', '#B08A2E', '#4E7A9B'];
const MARK_COL = '#7A7A7A';
// The perceptual ladder one sweep traverses, in ms of offset. PREDICTED —
// the experiment exists to replace these. docs/PHASE_SHIFTING.md §4.
const THRESHOLDS_MS = [10, 20, 30, 50, 80, 120, 160, 200, 250, 300, 400, 500];

// ============================ ONSET BUILDERS ============================
// Each returns an array of times in seconds, relative to the section start.

// BEAT: a voice's composite pulse at `rate(t)` attacks/s, by phase integration
// (so a ramping tempo is exact rather than stepwise).
// `phase0` (0..1) delays the voice by that fraction of its own attack period.
// Spreading N voices at j/N makes the UNION perfectly even at the start; without
// it every voice enters together and the composite is a clump plus a hole.
function steadyOnsets(rateOf, dur, phase0 = 0, DT = 0.0002) {
    const out = []; let phase = 0, next = phase0;
    for (let t = 0; t < dur; t += DT) {
        phase += rateOf(t) * DT;
        while (phase >= next) { out.push(+t.toFixed(4)); next += 1; }
    }
    return out.filter(t => t < dur);
}

// SWEEP: the strict grid, optionally displaced by an offset schedule in beats.
function sweepOnsets(P, stages, dur, shifted) {
    const offsetBeats = t => {
        let acc = 0;
        for (const s of stages) {
            if (t < acc + s.dur || s === stages[stages.length - 1]) {
                const u = Math.max(0, Math.min(1, (t - acc) / s.dur));
                return s.from + (s.to - s.from) * u;
            }
            acc += s.dur;
        }
        return 0;
    };
    const out = [];
    for (let k = 0; k <= Math.floor(dur / P + 1e-9); k++) {   // closing attack included
        const grid = k * P;
        out.push(grid + (shifted ? offsetBeats(grid) * P : 0));
    }
    return out;
}

// ============================== BUILD ==============================

function buildScore(spec) {
    const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores/trem02-phase.json'), 'utf8'));
    const tracks = (src.data || src).tracks;
    let nid = 1;
    const objs = [];
    const report = [];

    const mkNote = (lane, on, dur, colour, tag, pitch, tech, level) => objs.push({
        id: 'wc-' + (nid++), type: 'waveCurve', layer: lane,
        startSeconds: +on.toFixed(4), endSeconds: +(on + dur).toFixed(4),
        nodes: [{ pos: 0, y: level, smooth: 0.25 }, { pos: 1, y: level, smooth: 0.25 }],
        segments: [{ model: 'power', slope: 0 }],
        color: colour, fillMode: 'bottom', opacity: 0.55,
        performanceNotes: tag, properties: {},
        sonifyNote: pitch, technique: tech, sonifyMode: 'plain',
        recVel: Math.max(1, Math.min(127, Math.round(level / 10 * 127))),
    });
    // markers live in objects, NEVER in the markers array — Principle 4
    const mkMarker = (time, label, colour) => objs.push({
        id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +time.toFixed(2),
        label, color: colour, performanceNotes: '', properties: {},
    });

    let cursor = spec.t0 != null ? spec.t0 : 2;
    spec.sections.forEach((sec, si) => {
        const t0 = cursor;
        const P = 60 / (sec.bpm || 100);
        const stages = sec.stages || null;
        const lines = [];

        const voiceOnsets = sec.voices.map((v, vi) => {
            if (sec.model === 'sweep') return sweepOnsets(P, stages, sec.dur, vi > 0);
            const bpm0 = v.bpm, bpm1 = v.bpmEnd != null ? v.bpmEnd : v.bpm;
            const hold = v.rampFrom || 0;
            const n = v.lanes.length;
            const rateOf = t => {
                const u = Math.max(0, Math.min(1, (t - hold) / Math.max(1e-9, sec.dur - hold)));
                return n * (bpm0 + (bpm1 - bpm0) * u) / 60;
            };
            // `delay` is in SECONDS (absolute), converted to this voice's own
            // period. Absolute is what matters: staggering by a fraction of each
            // voice's period puts faster voices in the wrong absolute slot.
            const phase0 = v.delay != null ? v.delay * n * v.bpm / 60 : (v.phase || 0);
            return steadyOnsets(rateOf, sec.dur, phase0);
        });

        sec.voices.forEach((v, vi) => {
            const times = voiceOnsets[vi];
            const ring = ringLength(v.tech, v.pitch);
            const written = spec.notelen === 'sample' ? ring : spec.notelen;
            times.forEach((t, k) => {
                const lane = v.lanes[k % v.lanes.length];          // round-robin hocket
                mkNote(lane, t0 + t, written, COLORS[vi % COLORS.length],
                    'phase/' + (sec.tag || 's' + si), v.pitch, v.tech, v.level != null ? v.level : 7.5);
            });
            // per-PLAYER spacing is what physics cares about, not the composite
            const perPlayer = [];
            for (let L = 0; L < v.lanes.length; L++) {
                const mine = times.filter((_, k) => k % v.lanes.length === L);
                for (let i = 1; i < mine.length; i++) perPlayer.push(mine[i] - mine[i - 1]);
            }
            lines.push({
                vi, notes: times.length, players: v.lanes.length,
                composite: times.length / sec.dur,
                tightest: perPlayer.length ? Math.min(...perPlayer) : Infinity,
                ring, written,
            });
        });

        // ---- markers ----
        mkMarker(t0, sec.label, COLORS[0]);
        if (sec.model === 'sweep' && stages) {
            let acc = 0;
            const starts = stages.map(s => { const a = acc; acc += s.dur; return a; });
            stages.forEach((s, i) => {
                if (i > 0) mkMarker(t0 + starts[i], `${i + 1}. ${s.name} · ${(s.from * P * 1000).toFixed(0)}` +
                    (s.from === s.to ? ' ms' : ` → ${(s.to * P * 1000).toFixed(0)} ms`), COLORS[1]);
                if (s.to <= s.from) return;
                THRESHOLDS_MS.forEach(ms => {
                    const beats = ms / 1000 / P;
                    if (beats <= s.from || beats > s.to) return;
                    mkMarker(t0 + starts[i] + s.dur * (beats - s.from) / (s.to - s.from), `${ms} ms`, MARK_COL);
                });
            });
            mkMarker(t0 + sec.dur, '— end —', COLORS[0]);
        } else if (sec.markLaps && sec.voices.length === 2) {
            // A LAP closes each time voice B has gained one whole composite attack
            // on voice A — i.e. the pair returns to unison. Found by integrating
            // the rate DIFFERENCE, so a ramping tempo (the accelerando) is exact.
            const rateOf = v => {
                const bpm0 = v.bpm, bpm1 = v.bpmEnd != null ? v.bpmEnd : v.bpm, hold = v.rampFrom || 0;
                return t => v.lanes.length * (bpm0 + (bpm1 - bpm0) *
                    Math.max(0, Math.min(1, (t - hold) / Math.max(1e-9, sec.dur - hold)))) / 60;
            };
            const rA = rateOf(sec.voices[0]), rB = rateOf(sec.voices[1]);
            let phi = 0, next = 1, lap = 0;
            for (let t = 0; t < sec.dur; t += 0.0005) {
                phi += (rB(t) - rA(t)) * 0.0005;
                while (phi >= next) { mkMarker(t0 + t, `lap ${++lap}`, MARK_COL); next += 1; }
            }
        }

        report.push({ sec, lines, t0 });
        cursor = t0 + sec.dur + (spec.gap != null ? spec.gap : 2);
    });

    const out = {
        version: 1, layoutVersion: 2, tracks, assets: {},
        metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
        objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid,
    };
    fs.writeFileSync(path.join(ROOT, 'scores/' + spec.name + '.json'), JSON.stringify(out));

    // ---- optional MIDI export, so Reaper can do the timing instead of us ----
    if (spec.midi) {
        const { writeMidi } = require('./midi_out');
        // technique -> UVI channel + which instance carries it (sandbox/instruments.js)
        const CH = { ord: [1, ''], fortepiano: [11, ''], cuivre: [5, ''], staccato: [4, 'b'] };
        const notes = objs.filter(o => o.type === 'waveCurve');
        const [ch, suffix] = CH[notes[0].technique] || [1, ''];
        const mk = n => ({ t: n.startSeconds, pitch: n.sonifyNote,
            dur: +(n.endSeconds - n.startSeconds).toFixed(4), vel: n.recVel });

        const perLane = [];
        for (let L = 0; L < 10; L++) {
            const mine = notes.filter(n => n.layer === L);
            if (mine.length) perLane.push({
                name: `Tuba${L + 1}${suffix} SI2 · ch${ch} ${notes[0].technique}`,
                channel: ch, notes: mine.map(mk),
            });
        }
        const a = writeMidi(`midi/${spec.name}-10track.mid`, { tracks: perLane });
        const b = writeMidi(`midi/${spec.name}-1track.mid`, {
            tracks: [{ name: `ALL PARTS · ch${ch} ${notes[0].technique}`, channel: ch, notes: notes.map(mk) }],
        });
        console.log(`\n  MIDI: midi/${spec.name}-10track.mid (${a.tracks} tracks, ${a.notes} notes, ${a.seconds}s)` +
            `\n        midi/${spec.name}-1track.mid  (1 track, ${b.notes} notes)` +
            `\n        route to the "Tuba<N>${suffix} SI2" tracks — notes are on channel ${ch}`);
    }

    // ---- report what was WRITTEN, not what was intended ----
    const notes = objs.filter(o => o.type === 'waveCurve').length;
    console.log(`\n=== ${spec.name} — ${notes} attacks, ${(cursor).toFixed(1)}s, ` +
        `${objs.length - notes} markers ===`);
    let worst = Infinity;
    report.forEach(({ sec, lines, t0 }) => {
        console.log(`  ${t0.toFixed(1).padStart(6)}s  ${sec.label}`);
        lines.forEach(l => {
            worst = Math.min(worst, l.tightest);
            console.log(`          voice ${l.vi} · ${l.players}p · composite ${l.composite.toFixed(2)}/s` +
                ` · per-player gap ${l.tightest.toFixed(3)}s vs ${l.ring}s ring` +
                (l.tightest <= l.ring ? '   *** SAMPLE OVERLAP ***' : ''));
        });
        if (sec.lap) console.log(`          lap ${sec.lap}s · ΔBPM ${sec.dBpm}` +
            ` · ${(lines[0].composite * sec.lap).toFixed(0)} attacks per lap` +
            ` · interlocked ${(lines.reduce((a, l) => a + l.composite, 0)).toFixed(1)}/s`);
    });
    console.log(`  tightest per-player gap anywhere: ${worst.toFixed(3)}s` +
        (worst > 0.42 ? '  (clear of the staccato ring)' : '  *** at or past the ring ***'));
    return out;
}

// ============================== PRESETS ==============================
// Named specs, so a battery is reproducible and self-documenting.

const PITCH = 48;                    // C3 sci (Reaper C2), centre of ord 30-65
const BASE = 110;                    // BPM per player — 0.545 s, clear of the 0.42 s ring
const VP = 5;                        // players per voice (5 + 5 = all ten)
const LANES_A = [0, 1, 2, 3, 4], LANES_B = [5, 6, 7, 8, 9];

// lap time T ⟺ ΔBPM: composite rate = VP*BPM/60, so Δcomposite = VP*ΔBPM/60 = 1/T
const deltaBpm = lap => (60 / VP) / lap;

const PRESETS = {
    // THE FLUTTER MAP — same density throughout, only the beating rate changes.
    fluttermap: () => ({
        name: 'phase03-fluttermap', notelen: 0.12, gap: 2.5,
        sections: [12, 8, 6, 4, 3, 2].map(lap => {
            const d = deltaBpm(lap);
            return {
                label: `LAP ${lap}s · ΔBPM ${r2(d)} · ${VP}+${VP} tubas @ ${BASE} / ${r2(BASE + d)}`,
                tag: 'lap' + lap, dur: Math.max(14, Math.ceil(lap * 3)), model: 'beat',
                lap, dBpm: r2(d), markLaps: lap >= 4,
                voices: [
                    { lanes: LANES_A, pitch: PITCH, tech: 'staccato', bpm: BASE },
                    { lanes: LANES_B, pitch: PITCH, tech: 'staccato', bpm: BASE + d },
                ],
            };
        }),
    }),

    // SMOOTHNESS — the answer to "none of them is a smooth flutter".
    //
    // Two voices can only ever make short-long-short-long: a gallop. So this
    // uses TEN voices, one player each, entering at evenly staggered times, so
    // the union starts as one perfectly even stream at ~18 attacks/s.
    //
    // The variable is the TEMPO SPREAD across the ten. Spread 0 = a dead-even
    // roll forever (the control — this is what "smooth" actually sounds like).
    // Widen it and the ten drift out of their slots, so the stream deviates from
    // even by more and more, faster and faster. Somewhere on this ladder even
    // becomes shimmer and shimmer becomes figure.
    smooth: () => ({
        name: 'phase06-smooth', notelen: 0.12, gap: 2.5, midi: true,
        sections: [0, 0.5, 2, 6].map(span => {
            const lo = BASE - span / 2, stagger = 60 / BASE / 10;
            return {
                label: `SPREAD ${span} BPM · 10 voices ${r2(lo)}–${r2(lo + span)}` +
                    (span ? ` · outer lap ${r2(60 / span)}s` : ' · DEAD EVEN CONTROL'),
                tag: 'sp' + span, dur: 18, model: 'beat',
                voices: Array.from({ length: 10 }, (_, j) => ({
                    lanes: [j], pitch: PITCH, tech: 'staccato',
                    bpm: lo + span * j / 9,
                    delay: j * stagger,      // absolute, so the union starts even
                })),
            };
        }),
    }),

    // THE JITTER TEST — is unevenness in the MATERIAL or in our playback?
    // Two perfectly even controls, then the real thing. Written as a score AND
    // as MIDI files, so the same content can be A/B'd app vs Reaper.
    jitter: () => ({
        name: 'phase04-jitter', notelen: 0.12, gap: 2, midi: true,
        sections: [
            { label: 'CONTROL 1 · PERFECTLY EVEN 18.3/s · 10 tubas, one voice @ 110',
              tag: 'ctrl18', dur: 10, model: 'beat',
              voices: [{ lanes: [0,1,2,3,4,5,6,7,8,9], pitch: PITCH, tech: 'staccato', bpm: BASE }] },
            { label: 'CONTROL 2 · PERFECTLY EVEN 9.2/s · 5 tubas, one voice @ 110',
              tag: 'ctrl9', dur: 8, model: 'beat',
              voices: [{ lanes: LANES_A, pitch: PITCH, tech: 'staccato', bpm: BASE }] },
            { label: 'REAL · two voices, lap 12s (ΔBPM 1) — the galloping one',
              tag: 'real', dur: 14, model: 'beat', lap: 12, dBpm: 1, markLaps: true,
              voices: [
                  { lanes: LANES_A, pitch: PITCH, tech: 'staccato', bpm: BASE },
                  { lanes: LANES_B, pitch: PITCH, tech: 'staccato', bpm: BASE + deltaBpm(12) },
              ] },
        ],
    }),

    // THE BEATING ACCELERANDO — one voice slowly detunes, flutter speeds up.
    accel: () => ({
        name: 'phase03-accel', notelen: 0.12, gap: 2,
        sections: [{
            label: `BEATING ACCEL · ${VP}+${VP} tubas · B ${BASE} → ${BASE + 8}` +
                ` · lap ∞ → ${r2((60 / VP) / 8)}s`,
            tag: 'accel', dur: 78, model: 'beat', markLaps: true,
            voices: [
                { lanes: LANES_A, pitch: PITCH, tech: 'staccato', bpm: BASE },
                { lanes: LANES_B, pitch: PITCH, tech: 'staccato', bpm: BASE, bpmEnd: BASE + 8, rampFrom: 6 },
            ],
        }],
    }),
};

// ============================== CLI ==============================
const argv = process.argv.slice(2);
const flag = k => { const i = argv.indexOf('--' + k); return i < 0 ? null : argv[i + 1]; };

if (flag('preset')) {
    const p = flag('preset');
    if (p === 'list') { console.log('presets:', Object.keys(PRESETS).join(', ')); process.exit(0); }
    if (!PRESETS[p]) { console.error('unknown preset', p); process.exit(1); }
    buildScore(PRESETS[p]());
} else {
    // single-section sweep — the original phase01/phase02 generator
    const D = { name: 'phase01-8th', bpm: 85, pitch: 48, target: 0.5, lock: 4, out: 20,
        hold: 10, back: 20, tech: 'staccato', notelen: 0.12, level: 7.5, lanes: '0,1', t0: 2 };
    argv.forEach((a, i) => {
        if (!a.startsWith('--')) return;
        const k = a.slice(2), v = argv[i + 1];
        if (k === 'model') return;
        if (!(k in D)) { console.error('unknown flag --' + k); process.exit(1); }
        D[k] = (typeof D[k] === 'number' && v !== 'sample') ? Number(v) : v;
    });
    const stages = [
        { name: 'unison', dur: D.lock, from: 0, to: 0 },
        { name: 'shifting apart', dur: D.out, from: 0, to: D.target },
        { name: 'held apart', dur: D.hold, from: D.target, to: D.target },
        { name: 'shifting back', dur: D.back, from: D.target, to: 0 },
        { name: 'unison', dur: D.lock, from: 0, to: 0 },
    ].filter(s => s.dur > 0);
    const P = 60 / D.bpm;
    const drift = (D.target * P * 1000) / (D.out / P);
    buildScore({
        name: D.name, notelen: D.notelen, t0: D.t0, gap: 0,
        sections: [{
            label: `PHASE · 2 tubas ${pn(D.pitch)} ${D.tech} · ${D.bpm} BPM` +
                ` · out ${D.out}s to ${(D.target * P * 1000).toFixed(0)} ms · DRIFT ${drift.toFixed(1)} ms/beat`,
            dur: stages.reduce((a, s) => a + s.dur, 0), model: 'sweep', bpm: D.bpm, stages,
            voices: String(D.lanes).split(',').map(Number).map(l =>
                ({ lanes: [l], pitch: D.pitch, tech: D.tech, level: D.level })),
        }],
    });
    console.log(`  DRIFT ${drift.toFixed(2)} ms/beat · ${(D.out / P / D.target).toFixed(0)} attacks per lap` +
        ` · Reich Drumming ≈ 12-18 ms/beat`);
}
