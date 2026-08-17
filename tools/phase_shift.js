#!/usr/bin/env node
// phase_shift.js — phase shifting as a TEXTURE device. Research: docs/PHASE_SHIFTING.md.
//
// PLAN 2x Phase 0: the generator moved to score/public/texture_engine.js (pure,
// browser + node). What is left here is the impure half — reading the sample
// table and the track template, wrapping objects into a score file, MIDI export,
// the console report — plus the PRESETS, which are the regression corpus for the
// extraction and stay put.
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
const TX = require('../score/public/texture_engine.js');

const ROOT = path.join(__dirname, '..');
const pn = TX.pn;
const r2 = TX.r2;

// ---- measured one-shot lengths (D9) — injected into the pure engine ----
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
const ENGINE_OPTS = { sampleLengths: SAMPLE_LEN };

// ============================== BUILD ==============================
// Impure wrapper: engine -> score file (+ optional MIDI) + the console report.

function buildScore(spec) {
    const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores/trem02-phase.json'), 'utf8'));
    const tracks = (src.data || src).tracks;

    const g = TX.render(spec, ENGINE_OPTS);
    const objs = g.objects;

    const out = {
        version: 1, layoutVersion: 2, tracks, assets: {},
        metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
        objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: g.nextId,
    };
    fs.writeFileSync(path.join(ROOT, 'scores/' + spec.name + '.json'), JSON.stringify(out));

    // ---- optional MIDI export, so Reaper can do the timing instead of us ----
    if (spec.midi) writeMidiFor(spec.name, objs);

    // ---- report what was WRITTEN, not what was intended ----
    printReport(spec, g);
    return out;
}

// technique -> UVI channel + which instance carries it (sandbox/instruments.js).
// D2: 21 techniques > 16 channels, so each tuba has two UVI instances and
// staccato lives on the `b` one.
const CH = { ord: [1, ''], fortepiano: [11, ''], cuivre: [5, ''], flz: [10, ''], staccato: [4, 'b'] };

function writeMidiFor(name, objs) {
    const { writeMidi } = require('./midi_out');
    const notes = objs.filter(o => o.type === 'waveCurve');
    const mk = n => ({ t: n.startSeconds, pitch: n.sonifyNote,
        dur: +(n.endSeconds - n.startSeconds).toFixed(4), vel: n.recVel });

    // one track per (technique, player) — a mixed-articulation score needs
    // different channels AND different UVI instances, so it cannot collapse
    const perLane = [];
    for (const tech of [...new Set(notes.map(n => n.technique))]) {
        const [c, sfx] = CH[tech] || [1, ''];
        for (let L = 0; L < 10; L++) {
            const mine = notes.filter(n => n.layer === L && n.technique === tech);
            if (mine.length) perLane.push({
                name: `Tuba${L + 1}${sfx} SI2 · ch${c} ${tech}`, channel: c, notes: mine.map(mk),
            });
        }
    }
    const routing = [...new Set(notes.map(n => n.technique))]
        .map(t => `${t} → Tuba<N>${(CH[t] || [1, ''])[1]} ch${(CH[t] || [1])[0]}`).join(' · ');
    const a = writeMidi(`midi/${name}-10track.mid`, { tracks: perLane });
    const b = writeMidi(`midi/${name}-1track.mid`, {
        tracks: [...new Set(notes.map(n => n.technique))].map(tech => ({
            name: `ALL PARTS · ch${(CH[tech] || [1])[0]} ${tech}`, channel: (CH[tech] || [1])[0],
            notes: notes.filter(n => n.technique === tech).map(mk),
        })),
    });
    console.log(`\n  MIDI: midi/${name}-10track.mid (${a.tracks} tracks, ${a.notes} notes, ${a.seconds}s)` +
        `\n        midi/${name}-1track.mid  (${b.tracks} track(s), ${b.notes} notes)` +
        `\n        routing: ${routing}`);
}

function printReport(spec, g) {
    console.log(`\n=== ${spec.name} — ${g.notes} attacks, ${g.end.toFixed(1)}s, ` +
        `${g.markers} markers ===`);
    if (g.unknown.length) console.log('  UNRECOGNISED KEYS (ignored, not applied): ' + g.unknown.join(', '));
    let worst = Infinity;
    g.report.forEach(({ sec, lines, t0, metrics }) => {
        console.log(`  ${t0.toFixed(1).padStart(6)}s  ${sec.label}`);
        lines.forEach(l => {
            worst = Math.min(worst, l.tightest);
            console.log(`          voice ${l.vi} · ${l.players}p · composite ${l.composite.toFixed(2)}/s` +
                ` · per-player gap ${l.tightest.toFixed(3)}s vs ` +
                (l.ring == null ? `${l.written}s written (variable-length)` : `${l.ring}s ring`) +
                (l.ring != null && l.tightest <= l.ring ? '   *** SAMPLE OVERLAP ***' : '') +
                (l.ring == null && l.tightest <= l.written ? '   *** NOTES OVERLAP ON ONE PLAYER ***' : ''));
        });
        console.log(`          metrics · sd ${metrics.sd.toFixed(1)} ms` +
            ` · unevenness ${metrics.unevenness.toFixed(2)}` +
            ` · ${metrics.n} attacks over ${metrics.players} players`);
        if (sec.lap) console.log(`          lap ${sec.lap}s · ΔBPM ${sec.dBpm}` +
            ` · ${(lines[0].composite * sec.lap).toFixed(0)} attacks per lap` +
            ` · interlocked ${(lines.reduce((a, l) => a + l.composite, 0)).toFixed(1)}/s`);
    });
    if (g.clamps.length) console.log('  CLAMPED — a variable-length note cannot outlast ' +
        'the same player next attack:\n    ' + g.clamps.join('\n    '));
    console.log(`  tightest per-player gap anywhere: ${worst.toFixed(3)}s` +
        (worst > 0.42 ? '  (clear of the staccato ring)' : '  *** at or past the ring ***'));
    console.log(`  playability: ${g.summary.hard} hard / ${g.summary.soft} soft`);
}

// ============================== PRESETS ==============================
// Named specs, so a battery is reproducible and self-documenting. These nine are
// also the REGRESSION CORPUS for the engine extraction (tools/test_texture.js):
// each must regenerate its committed score in scores/ byte-for-byte.

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

    // E4 · ORD BEATING — the reunification. E3 overturned E1's conclusion: it is
    // the STACCATO PATCH that carries the articulation, not the density and not
    // the ensemble. In ord, ten overlapping voices smear into a wash — and the
    // composer heard that wash "swelling and pulsing".
    //
    // That swelling IS the beating. With sustained overlapping tones, coincident
    // onsets reinforce in AMPLITUDE instead of stacking as rhythm. So the original
    // acoustic-beating model — smooth, sinusoidal, accelerable — was never wrong;
    // it just does not survive a hard attack. It lives in the ord family.
    //
    // phase10's pulsing was STOCHASTIC (jitter, no tempo spread). Here jitter is
    // OFF and the tempo spread is the dial, so the swell should be periodic and
    // its rate calculable: lap = 60 / (ΔBPM × 5 players).
    ordbeat: () => {
        const VOICE = (lanes, bpm, extra) => ({ lanes, pitch: PITCH, tech: 'ord',
            bpm, notelen: 0.5, ...extra });
        const pair = lap => {
            const d = 12 / lap;                          // 60 / (5 players × lap)
            return { label: `LAP ${lap}s · ΔBPM ${r2(d)} · 5+5 ord @ 108 / ${r2(108 + d)}` +
                    ` · swell every ${lap}s`,
                tag: 'lap' + lap, dur: 16, model: 'beat', lap, dBpm: r2(d), markLaps: true,
                voices: [VOICE(LANES_A, 108), VOICE(LANES_B, 108 + d)] };
        };
        return {
            name: 'phase11-ordbeat', notelen: 0.5, gap: 2.5, midi: true,
            sections: [
                { label: 'CONTROL · 10 ord, no tempo difference, no jitter — a FLAT bed',
                  tag: 'flat', dur: 12, model: 'beat',
                  voices: [VOICE([0,1,2,3,4,5,6,7,8,9], 108)] },
                pair(8), pair(4), pair(2),
                { label: 'ACCEL · ΔBPM 0 → 6 · swell period ∞ → 2s — the beating accelerando',
                  tag: 'accel', dur: 26, model: 'beat', markLaps: true,
                  voices: [VOICE(LANES_A, 108),
                           VOICE(LANES_B, 108, { bpmEnd: 114, rampFrom: 4 })] },
            ],
        };
    },

    // E3 · ARTICULATION — the "extra blade". Composer's conclusion from E1:
    // "with the staccato patch it's really impossible to avoid articulation in
    // the texture… everything's gonna sound articulated, and it's just a question
    // of whether it's more random rain-like or more patterned."
    //
    // So the smear↔tone axis is CLOSED for staccato, and the only way off it is a
    // different sound. This is a SURVEY, not a ladder — each technique has its own
    // physics and they cannot be held constant. Density is held at 18/s except
    // where a ring time forbids it (fortepiano), and that cell says so.
    // Rain-like jitter (±35 ms) throughout, since that was the composer's
    // preferred character from E2.
    articulation: () => {
        const v = (lanes, tech, bpm, notelen) =>
            ({ lanes, pitch: PITCH, tech, bpm, notelen, jitterMs: 35 });
        const all = [0,1,2,3,4,5,6,7,8,9];
        const cell = (label, tag, voices, dur = 12) => ({ label, tag, dur, model: 'beat', voices });
        return {
            name: 'phase10-articulation', notelen: 0.12, gap: 2.5, midi: true,
            sections: [
                cell('1 · STACCATO 18/s — the reference, what we already know',
                    'stac', [v(all, 'staccato', 108, 0.12)]),
                cell('2 · ORD 0.50s notes, 18/s — 9 sounding at once, a continuous bed',
                    'ord50', [v(all, 'ord', 108, 0.50)]),
                cell('3 · ORD 0.25s notes, 18/s — half-gapped, attacks exposed again',
                    'ord25', [v(all, 'ord', 108, 0.25)]),
                cell('4 · MIX · 5 staccato + 5 ord(0.50s), 18/s total — attacks ON a bed',
                    'mix', [v([0,1,2,3,4], 'staccato', 108, 0.12), v([5,6,7,8,9], 'ord', 108, 0.50)]),
                cell('5 · FORTEPIANO 5/s — its own ceiling (1.77s ring), sparse swells',
                    'fp', [v(all, 'fortepiano', 30, 1.77)]),
                cell('6 · FLATTERZUNGE 0.50s, 18/s — flutter from the INSTRUMENT',
                    'flz', [v(all, 'flz', 108, 0.50)]),
            ],
        };
    },

    // E1 · DENSITY — the tone↔tick boundary (composer: "one is just at the
    // margin of smear… the direction would be towards closer intervals").
    // Dead even, one voice of ten players; only the attack rate changes.
    // CEILING: per-player gap must clear the 0.42 s staccato ring, so ten
    // players cap at ~23 attacks/s = 43 ms. Fusion into tone wants ~50 ms or
    // less — so this ladder JUST crosses the boundary, and cannot go past it
    // without a shorter sample.
    density: () => ({
        name: 'phase08-density', notelen: 0.12, gap: 2.5, midi: true,
        sections: [8, 12, 17, 23].map(rate => ({
            label: `DENSITY ${rate}/s · ${r2(1000 / rate)} ms apart · 10 players @ ${r2(rate * 6)} BPM` +
                (rate >= 20 ? ' · AT THE CEILING' : ''),
            tag: 'd' + rate, dur: 12, model: 'beat',
            voices: [{ lanes: [0,1,2,3,4,5,6,7,8,9], pitch: PITCH, tech: 'staccato', bpm: rate * 6 }],
        })),
    }),

    // E2 · JITTER vs SCATTER — the rain test. Composer: "I think part of the rain
    // comes out of some sort of randomness… with strict no drift it's almost
    // inevitably going to be patterned, probably the repetition of overlap."
    // Exactly right: a FIXED random offset repeats every cycle, so it is a loop.
    // Jitter re-randomises every attack, so nothing ever repeats. Same amount of
    // irregularity, opposite repetition structure — cells 4 and 5 are the A/B.
    jitterrain: () => {
        const even = extra => ({ lanes: [0,1,2,3,4,5,6,7,8,9], pitch: PITCH,
            tech: 'staccato', bpm: BASE, ...extra });
        const rnd = TX.lcgC(20260817);
        const u = Array.from({ length: 10 }, rnd);
        return {
            name: 'phase09-jitterrain', notelen: 0.12, gap: 2.5, midi: true,
            sections: [
                { label: 'JITTER 0 ms · dead even (control)', tag: 'j0', dur: 12,
                  model: 'beat', voices: [even({})] },
                { label: 'JITTER ±15 ms · never repeats', tag: 'j15', dur: 12,
                  model: 'beat', voices: [even({ jitterMs: 15 })] },
                { label: 'JITTER ±35 ms · never repeats', tag: 'j35', dur: 12,
                  model: 'beat', voices: [even({ jitterMs: 35 })] },
                { label: 'A/B 1 · JITTER ±60 ms — irregular and NON-REPEATING',
                  tag: 'jAB', dur: 14, model: 'beat', voices: [even({ jitterMs: 60 })] },
                { label: 'A/B 2 · SCATTER 0.2 — same irregularity, but it LOOPS every 0.55 s',
                  tag: 'sAB', dur: 14, model: 'beat',
                  voices: Array.from({ length: 10 }, (_, j) => ({
                      lanes: [j], pitch: PITCH, tech: 'staccato', bpm: BASE,
                      delay: ((j / 10 + 0.2 * u[j] + 1) % 1) * (60 / BASE),
                  })) },
            ],
        };
    },

    // SCATTER — the composer's categories (smear · rain · stutter · pulse) turn
    // out to need TWO independent dials, not one:
    //
    //   SCATTER = how irregularly the voices sit inside the cycle. 0 = perfectly
    //             even (the "articulated smear"), 1 = uniformly random (rain).
    //   SPREAD  = how fast that arrangement CHANGES (tempo difference).
    //
    // phase06 coupled them: everything started even and spread drove the scatter
    // upward over time, which is why the transitions were abrupt and why rain
    // could not be held. With scatter as its own dial and spread at ZERO, each
    // texture is STATIC — rain that stays rain for as long as you want.
    scatter: () => {
        const rnd = TX.lcgC(20260816);                      // seeded, reproducible
        const T = 60 / BASE;
        const cell = (sc, dur, morph) => {
            const u = Array.from({ length: 10 }, rnd);      // one draw per voice
            return {
                label: morph
                    ? `MORPH · scatter 0 → 1 over ${dur}s · even dissolving into rain`
                    : `SCATTER ${sc}` + (sc === 0 ? ' · EVEN (articulated smear)' :
                        sc === 1 ? ' · UNIFORM RANDOM (rain)' : '') + ' · static, no drift',
                tag: 'sc' + (morph ? 'morph' : sc), dur, model: 'beat',
                voices: Array.from({ length: 10 }, (_, j) => ({
                    lanes: [j], pitch: PITCH, tech: 'staccato', bpm: BASE,
                    delay: ((j / 10 + (morph ? 0 : sc * u[j]) + 1) % 1) * T,
                    // a morph reaches its scattered target by drifting there:
                    // phase gain = (bpmEnd-bpm)/2/60 * dur, solved for bpmEnd
                    ...(morph ? { bpmEnd: BASE + 120 * u[j] / dur } : {}),
                })),
            };
        };
        return {
            name: 'phase07-scatter', notelen: 0.12, gap: 2.5, midi: true,
            // low end sampled finely: 0 -> 0.1 was already a jump from 0.1 ms of
            // deviation to 21 ms, i.e. straight past whatever is between smear
            // and rain. Scatter s displaces each voice by up to +/- s/2 of a cycle.
            sections: [cell(0, 12), cell(0.03, 12), cell(0.08, 12), cell(0.2, 12),
                cell(1, 14), cell(1, 20, true)],
        };
    },

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

// ============================== MODELS ==============================
// `--fromModel <NAME>` renders a MODEL from bank/texture_models.json (plan §5:
// the five categories ARE the first five models). The store is data — the
// vocabulary is the composer's and has already evolved once mid-research — so
// this reads it fresh every run and never caches a copy in code.
function loadModels() {
    const f = path.join(ROOT, 'bank/texture_models.json');
    if (!fs.existsSync(f)) return null;
    return JSON.parse(fs.readFileSync(f, 'utf8'));
}
function specFromModel(name, overrides) {
    const store = loadModels();
    if (!store) { console.error('bank/texture_models.json does not exist yet (plan 2x Phase 1)'); process.exit(1); }
    const m = store.models && store.models[name];
    if (!m) {
        console.error('unknown model ' + name + ' — have: ' +
            Object.keys(store.models || {}).join(', '));
        process.exit(1);
    }
    const spec = JSON.parse(JSON.stringify(m.spec));
    Object.assign(spec, overrides || {});
    if (!spec.name) spec.name = 'tex-' + name.toLowerCase();
    return spec;
}

// ============================== CLI ==============================
// Guarded so tools/test_texture.js can require the PRESETS (the regression
// corpus) without the CLI firing and writing score files as a side effect.
module.exports = { PRESETS, buildScore, specFromModel, ENGINE_OPTS };
if (require.main !== module) return;

const argv = process.argv.slice(2);
const flag = k => { const i = argv.indexOf('--' + k); return i < 0 ? null : argv[i + 1]; };
const has = k => argv.indexOf('--' + k) >= 0;

if (flag('fromModel')) {
    const overrides = {};
    if (flag('name')) overrides.name = flag('name');
    if (flag('seed')) overrides.seed = Number(flag('seed'));
    if (has('midi')) overrides.midi = true;
    buildScore(specFromModel(flag('fromModel'), overrides));
} else if (flag('preset')) {
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
