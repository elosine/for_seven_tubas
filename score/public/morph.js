// morph.js — PLAN 2v, the morphing-chords engine.
//
// PURE. No DOM, no MIDI, no fetch, no Date.now, no Math.random. Loads in the
// browser (window.Morph) and in node (module.exports) from the same file, which
// is what makes tools/test_morph.js possible and cheap.
//
// THREE ORTHOGONAL OBJECTS (docs/plans/MORPHING_CHORDS.md §2):
//   MORPH    state(voice, p) -> { cents, technique, level }   — WHAT changes
//   CARRIER  breath/striation -> when each voice sounds        — WHEN it sounds
//   RENDER   sample the morph at each carrier segment -> notes + envelopes
// Neither MORPH nor CARRIER knows about the other. "Sustained vs pulsed" is a
// dial (segLen), never a branch.
//
// PITCH IS CENTS EVERYWHERE internally: cents = midi*100 + offset. Resolved to
// (key, bendValue) only in the emit layer.
//
// ---------------------------------------------------------------------------
// TWO DELIBERATE DEVIATIONS FROM THE PLAN'S SCHEMA, both to avoid forking
// machinery the plan itself says not to fork:
//
// 1. The plan's render output carries `env.cc7` with absolute CC7 values. This
//    engine emits `level` breakpoints in the score's own 0-10 drawn-height unit
//    instead. Reason: composer.html turns level into CC7 through a MEASURED
//    inverse map (probes/cc7_map.json, curveValToCC, levelSpanDb 40). Emitting
//    CC7 here would mean reimplementing that calibration in a second place — the
//    exact "do not invent a new curve" the plan forbids in §8.
//
// 2. Consequently a morph note is an ORDINARY score waveCurve (nodes/segments in
//    0-10) plus one new optional field, `bend`. Existing playback already renders
//    the dynamics with zero new code; bend is the only thing it cannot do. That
//    is the smallest possible new surface.
//
// Envelopes are NOTE-RELATIVE (seconds from that note's start) so that dragging
// or group-scaling an inserted morph carries and stretches them automatically.
// Absolute-time envelopes would silently detach sound from notation on the first
// drag — the classic defeat-the-fix-later failure (plan §13.7).

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Morph = api;
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

// ===========================================================================
// 1 · CONSTANTS
// ===========================================================================

// --- MEASURED on SI2 tuba, probe run 2026-08-16 (docs/MORPH_FINDINGS.md).
//     These are facts about the instrument. Do not "tidy" them to round numbers.
const MEASURED = {
    BEND_RANGE_ST: 1.99,    // +25%/-25%/+50%/+100% bend read 49.4/-50.6/99.5/199.7 c
    BEND_PREARM_S: 0.05,    // UPPER BOUND: 50/100/150/250 ms rungs read identically,
                            // so the true minimum is at or below 50 ms, untested.
    RESET_GAP_S: 0.0,       // resetting bend at note-off is inaudible in the tail
    RPN_HONOURED: false,    // asking for 12 st changed nothing; +/-2 is a hard ceiling
    GLISS_CLEAN_CENTS: 200, // composer: every ramp to +/-200 c "fine and natural"
};

// --- D17 (PLAN 2r) re-attack rule. Reused VERBATIM; the plan forbids inventing
//     new constants here, and the app's Composer.CONFLICT is the authority.
const RATE = {
    tongueReset: 0.03,
    minAttack: 0.11,
    perSemitone: 0.0093,
    maxLeapAdd: 0.22,
};

// --- ESTIMATES (amber). A wrong value here may only mis-tint a flag; by
//     construction it can never block a render or force a composer decision
//     (plan §13.12, D17's split).
const BREATH_GAP_MIN = 0.75;    // comfortable
const BREATH_GAP_FLOOR = 0.40;  // snatch breath — flagged if used
const GLISS_AIR_COST = 0.7;     // breath multiplier while bending
const CROSS_ONSET_MIN = 0.08;   // two voices must not re-attack within this
const MAX_SEG_HARD_S = 30.0;    // absolute segment ceiling, safety net

// maxBreath(register, dyn) in seconds — ESTIMATE.
const BREATH_TABLE = [
    { lo: 30, hi: 40, p: 14, mf: 10, f: 6 },
    { lo: 41, hi: 52, p: 18, mf: 13, f: 9 },
    { lo: 53, hi: 65, p: 15, mf: 11, f: 8 },
];

// seconds needed between segments of DIFFERENT technique — ESTIMATE.
const SWITCH_PREP = {
    bisb: 0.3, flz: 0.3, flz_voice_unison: 0.3, cuivre: 0.3,
    play_sing_ks: 1.0,   // the player has to start singing
};

// D9: fixed one-shots end themselves; only ORD is a real duration.
const FIXED_LEN_DEFAULT = { fortepiano: 1.67, staccato: 0.45, cuivre: 1.17 };

// Technique table, transcribed from sandbox/instruments.js (slot order is the
// composer's UVI build = ground truth). durClass 'fixed' = the sample ends
// itself and the note must take its true length (D9).
const TECHNIQUES = {
    ord:              { channel: 1,  portB: false, lo: 30, hi: 65, durClass: 'sustain' },
    bisb:             { channel: 2,  portB: false, lo: 30, hi: 64, durClass: 'sustain' },
    cuivre:           { channel: 5,  portB: false, lo: 60, hi: 67, durClass: 'fixed' },
    flz_voice_unison: { channel: 9,  portB: false, lo: 30, hi: 64, durClass: 'sustain' },
    flz:              { channel: 10, portB: false, lo: 30, hi: 65, durClass: 'sustain' },
    fortepiano:       { channel: 11, portB: false, lo: 30, hi: 65, durClass: 'fixed' },
    mute_ord:         { channel: 14, portB: false, lo: 20, hi: 70, durClass: 'sustain' },
    play_sing_ks:     { channel: 1,  portB: true,  lo: 30, hi: 65, durClass: 'sustain' },
    quartertones:     { channel: 2,  portB: true,  lo: 30, hi: 64, durClass: 'sustain' },
    single_tonguing:  { channel: 3,  portB: true,  lo: 30, hi: 65, durClass: 'sustain' },
    staccato:         { channel: 4,  portB: true,  lo: 30, hi: 65, durClass: 'fixed' },
};

// DYNAMICS IS A LAYER ON EVERY MODEL (composer, 2026-08-16, choosing option b:
// "centre volume changes more prominently"). Loudness is not one model among six
// — it rides along with all of them, so an M2 spectral drift also swells unless
// you turn it off with shape 'flat'. M6 is then not "the volume model" but "the
// model whose ONLY change is volume": it holds pitch and technique and lets this
// layer do the work, defaulting to the rotating shape.
const DYN_SHAPES = ['swell', 'rise', 'fall', 'rotate', 'flat'];

const DEFAULTS = {
    model: 'M6',
    dials:   { bias: 0, spread: 0.5, depth: 1 },
    // `span` is the ONE-WAY gliss length — the pace. `duration` is how long the
    // BODY lasts and `release` how long the run-down takes; both null means the
    // legacy form, where the gliss is stretched to fill the one and only time
    // value. See docs/plans/MORPH_CYCLING_PLAN.md.
    carrier: { span: 30, segLen: 8, segVar: 0.35, striation: 'staggered',
               duration: null, release: null },
    dyn:     { base: 0.6, shape: null, amount: 0.35, turns: 1, spread: 0.5 },
    seed: 1,
};

// ===========================================================================
// 2 · SMALL PURE HELPERS
// ===========================================================================

function mulberry32(a) {
    a = a >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const round3 = v => Math.round(v * 1000) / 1000;
const centsToMidi = c => Math.round(c / 100);
const midiOf = c => centsToMidi(c);

function maxBreath(midi, level01) {
    const row = BREATH_TABLE.find(r => midi >= r.lo && midi <= r.hi) ||
                BREATH_TABLE[BREATH_TABLE.length - 1];
    if (level01 <= 0.4) return row.p;
    if (level01 <= 0.75) return row.mf;
    return row.f;
}
function requiredAttackGap(midiA, midiB) {
    return RATE.minAttack +
        Math.min(RATE.maxLeapAdd, Math.abs(midiB - midiA) * RATE.perSemitone);
}
function fixedLength(tech, midi, sampleLengths) {
    const tbl = sampleLengths && sampleLengths[tech];
    if (tbl) {
        if (tbl[midi] != null) return tbl[midi];
        const keys = Object.keys(tbl).map(Number);
        if (keys.length) {
            let best = keys[0];
            keys.forEach(k => { if (Math.abs(k - midi) < Math.abs(best - midi)) best = k; });
            return tbl[best];
        }
    }
    return FIXED_LEN_DEFAULT[tech] || null;
}

// bend value for a cents offset, at the MEASURED range. Byte order is LSB then
// MSB — getting this backwards produces wild jumps, so test_morph asserts it.
function bendValue(centsOffset, rangeSt) {
    const r = rangeSt || MEASURED.BEND_RANGE_ST;
    return clamp(Math.round(8192 + (centsOffset / (100 * r)) * 8192), 0, 16383);
}
function bendBytes(centsOffset, channel, rangeSt) {
    const v = bendValue(centsOffset, rangeSt);
    return [0xE0 | ((channel - 1) & 0x0F), v & 0x7F, (v >> 7) & 0x7F];
}
// how far a single note can be bent before the emit layer must re-key (plan §8)
function bendReach() { return MEASURED.BEND_RANGE_ST * 100; }

// ===========================================================================
// 3 · PROGRESS — the dials. Models say WHAT changes; this says HOW FAR ALONG
//     each voice is at time t. Every model reads it identically.
// ===========================================================================

// bias -1 front-loaded ... 0 even ... +1 back-loaded
function applyBias(p, bias) {
    const e = Math.pow(3, clamp(bias, -1, 1));
    return Math.pow(clamp(p, 0, 1), e);
}

// The order voices set off in. Seeded, so "another version" is a new seed only.
function staggerOrder(nVoices, seed) {
    const rng = mulberry32(seed);
    const idx = [];
    for (let i = 0; i < nVoices; i++) idx.push({ i: i, k: rng() });
    idx.sort((a, b) => a.k - b.k);
    const order = new Array(nVoices);
    idx.forEach((o, rank) => { order[o.i] = rank; });
    return order;
}

// THE DYNAMICS LAYER. Runs for every model. Returns level in the score's 0-10
// drawn-height unit, which composer.html converts to CC7 through the MEASURED
// map — the same path every hand-drawn crescendo in the piece takes, so a
// hairpin inside a morph sounds like a hairpin in the piece.
function dynLevel(dyn, vi, nVoices, p) {
    const shape = dyn.shape || 'swell';
    if (shape === 'flat') return clamp(dyn.base * 10, 0.4, 10);
    // Per-voice phase so the ensemble does not breathe in lockstep. `spread` 0
    // = everyone together (one big swell), 1 = fully fanned out.
    const phase = nVoices > 1 ? (vi / nVoices) * clamp(dyn.spread, 0, 1) : 0;
    const turns = dyn.turns != null ? dyn.turns : 1;
    let w;
    switch (shape) {
        case 'rise':   w = (clamp(p - phase * 0.5, 0, 1) - 0.5) * 2; break;
        case 'fall':   w = (0.5 - clamp(p - phase * 0.5, 0, 1)) * 2; break;
        case 'rotate': w = Math.sin(2 * Math.PI * (turns * p + phase)); break;
        case 'swell':
        default: {
            // an arch: silence-ward at both ends, peak in the middle, shifted
            // per voice so the peaks are staggered across the ensemble
            const q = clamp(p - phase * 0.35, 0, 1);
            w = Math.sin(Math.PI * q) * 2 - 1;
            break;
        }
    }
    const amt = dyn.amount != null ? dyn.amount : 0.35;
    return clamp((dyn.base + amt * w) * 10, 0.4, 10);
}

// THE TIMELINE (FR-3). One time value used to do two jobs — "how long the gliss
// takes" and "how long the gesture lasts" — because the gliss was stretched to
// fill the span. These split them:
//
//   span      the ONE-WAY gliss length. The pace. Meaning unchanged.
//   duration  how long the BODY runs. Cycling is ON exactly when it exceeds span
//             — there is no separate switch to get out of sync with.
//   release   the forced run-down. Forced rather than inherited from the cycle,
//             because inheriting it would re-couple release length to pace, which
//             is the very conflation this exists to remove.
function carrierTiming(carrier) {
    const span = Math.max(0.01, carrier.span);
    const duration = carrier.duration != null ? Math.max(span, carrier.duration) : span;
    const release = carrier.release != null ? Math.max(0, carrier.release) : 0;
    // TWO INDEPENDENT THINGS, and conflating them was a real defect: `release`
    // used to switch `cycling` on, so typing a release into a ONE-WAY bloom made
    // the body start folding back before the release had begun. Measured on
    // voice 1: end-of-note detune went -1 -9 -16 -25 -25 (arrive and hold) to
    // -1 -9 -16 -23 -13 -3 0 (arrive and immediately turn around). Adding a
    // run-down must not rewrite the gesture it is running down from.
    const cycling = duration > span + 1e-9;   // the BODY repeats (folds)
    const extended = cycling || release > 0;  // anything past the legacy one-shot
    return { span: span, duration: duration, release: release,
             total: duration + release, cycling: cycling, extended: extended };
}

// 0 -> 1 -> 0 -> 1 …  The trajectory reverses instead of stopping, so the pair
// glisses out and back with NO pitch discontinuity. A sawtooth would have to
// jump back to the start pitch mid-note; the composer ruled that out.
// Symmetric by construction, which is what makes `bias` mirror the return sweep
// for free — a cycle-asymmetry dial was explicitly declined.
function foldPhase(x) {
    if (x <= 0) return 0;
    const m = x % 2;
    return m <= 1 ? m : 2 - m;
}

function voiceProgress(voiceIdx, nVoices, t, span, dials, order, cyc) {
    const k = nVoices > 1 ? order[voiceIdx] / (nVoices - 1) : 0;
    const w = clamp(dials.spread, 0, 1) * 0.8;   // stagger uses at most 80% of the span
    const start = k * w;
    const run = Math.max(1e-6, 1 - w);

    // THE LEGACY PATH IS LITERALLY UNTOUCHED, and that is deliberate. Folding
    // cannot subsume clamping here: a voice reaches raw phase 1 at u = start+run
    // <= 1, so for the rest of the span raw exceeds 1 and the fold would send it
    // back DOWN where today it holds at the top. (Voice 0: raw hits 1.389 by the
    // end, folding to 0.611 against today's 1.0.) A branch that keeps the old
    // formula verbatim is the safest way to hold byte-identity, which is the
    // load-bearing gate for this whole change.
    const legacyAt = tt => {
        const u = span > 0 ? clamp(tt / span, 0, 1) : 1;
        return clamp((u - start) / run, 0, 1);
    };
    if (!cyc || !cyc.extended) {
        return applyBias(legacyAt(t), dials.bias) * clamp(dials.depth, 0, 1);
    }

    // THE BODY. Folding only when the body actually repeats; a one-way bloom
    // keeps the legacy ramp-and-hold and can still be given a release.
    const phaseAt = cyc.cycling
        ? tt => foldPhase((((span > 0 ? tt / span : 1)) - start) / run)
        : legacyAt;
    let x;
    if (t <= cyc.duration || cyc.release <= 0) {
        x = phaseAt(t);
    } else {
        // THE RELEASE (FR-6). Every voice travels from wherever it stands to a
        // trough over the SAME number of seconds, so they descend at different
        // rates — voices near a trough crawl, voices at a peak move fast. That
        // raggedness is wanted; a uniform fade sounds mechanical.
        //
        // Because loudness rides this same progress, driving it to 0 returns the
        // pitch to unison AND the level to its floor in one motion: the bloom
        // CLOSES as it fades. That is free — it is the cycle finishing its
        // downward half — which is why it was chosen over decoupling the two.
        const held = phaseAt(cyc.duration);
        const k2 = clamp((t - cyc.duration) / cyc.release, 0, 1);
        x = held * (1 - k2);
    }
    return applyBias(x, dials.bias) * clamp(dials.depth, 0, 1);
}

// ===========================================================================
// 4 · THE SIX MODELS
//     Each returns the state vector for one voice at progress p:
//        { cents, technique, level }   (level in 0-10, the score's own unit)
//     A model moves a SUBSET; whatever it does not set, holds.
// ===========================================================================

function partialCents(fundamentalMidi, n) {
    return fundamentalMidi * 100 + Math.round(1200 * Math.log2(n));
}

const MODELS = {
    // M1 — DETUNE BLOOM. Voices peel off +/-50 c one at a time. Alternating
    // directions maximises beating; one direction makes the chord "lean".
    M1: function (ctx, vi, p) {
        const dir = ctx.target && ctx.target.direction === 'up' ? 1
                  : ctx.target && ctx.target.direction === 'down' ? -1
                  : (vi % 2 === 0 ? 1 : -1);
        const amt = (ctx.target && ctx.target.cents) || 50;
        return { cents: ctx.startCents[vi] + dir * amt * p };
    },

    // M2 — SPECTRAL DRIFT. Voices arrive on harmonic partials of a fundamental.
    // Each voice goes to its NEAREST free partial (assigned once, in render), not
    // to partials[vi]: a spectral drift should sound like the chord focusing into
    // a spectrum, with every voice moving a short distance. Indexing blindly made
    // voices leap octaves — measured, it demanded 1681 cents of bend against a
    // patch that has 199. Reverse (spectrum -> inharmonic) is the same code with
    // start and target swapped by the caller.
    M2: function (ctx, vi, p) {
        const target = (ctx._m2 && ctx._m2[vi] != null) ? ctx._m2[vi] : ctx.startCents[vi];
        return { cents: ctx.startCents[vi] + (target - ctx.startCents[vi]) * p };
    },

    // M3 — FAN. Chord A -> chord B, each voice at its own rate (the rate spread
    // is the dials' job). `stepped` quantises to a chromatic or quarter-tone
    // staircase instead of a continuous bend.
    M3: function (ctx, vi, p) {
        const tgt = ctx.targetCents && ctx.targetCents.length
            ? ctx.targetCents[vi % ctx.targetCents.length]
            : ctx.startCents[vi];
        let c = ctx.startCents[vi] + (tgt - ctx.startCents[vi]) * p;
        const step = ctx.target && ctx.target.stepped;
        if (step) {
            const grid = step === 'quartertone' ? 50 : 100;
            c = Math.round(c / grid) * grid;
        }
        return { cents: c };
    },

    // M4 — COLOUR MORPH. Pitches hold; techniques migrate along an ordered path.
    // Stepped, not blended: a player is playing one technique at a time.
    M4: function (ctx, vi, p) {
        const path = (ctx.target && ctx.target.path && ctx.target.path.length)
            ? ctx.target.path : ['ord', 'bisb', 'flz'];
        const i = clamp(Math.floor(p * path.length), 0, path.length - 1);
        return { technique: path[i] };
    },

    // M5 — SPACING MIGRATION. Voices step by whole degrees at staggered times so
    // the voicing opens or closes. Outer voices travel furthest, which is what
    // makes it read as the chord spreading rather than transposing.
    M5: function (ctx, vi, p) {
        const steps = (ctx.target && ctx.target.steps != null) ? ctx.target.steps : 2;
        const n = ctx.nVoices;
        const centre = (n - 1) / 2;
        const away = n > 1 ? (vi - centre) / centre : 0;   // -1 .. +1
        return { cents: ctx.startCents[vi] + away * steps * 100 * p };
    },

    // M6 — BALANCE MORPH. Pitches and techniques HOLD; the only thing that moves
    // is internal weighting, so voices emerge and recede and prominence travels
    // through the chord. It returns nothing because the universal dynamics layer
    // does the work — M6's identity is that it defaults that layer to 'rotate'
    // and changes nothing else. (Since 2026-08-16 dynamics ride every model, so
    // "the volume model" is really "the volume-ONLY model".)
    M6: function () { return {}; },
};

// ===========================================================================
// 5 · CARRIER — breath + striation. A 30 s morph is a chain of breaths.
// ===========================================================================

const STRIATIONS = ['staggered', 'grouped', 'aligned', 'converging', 'diverging'];

// Phase offset (0..1 of one segment) for a voice under each named pattern.
function striationPhase(pattern, vi, nVoices, segIdx, rng) {
    switch (pattern) {
        case 'aligned':   return 0;
        case 'grouped':   return (vi % 3) / 3;
        case 'diverging': return ((vi / Math.max(1, nVoices)) * Math.min(1, segIdx / 4));
        case 'converging':return ((vi / Math.max(1, nVoices)) * Math.max(0, 1 - segIdx / 4));
        case 'staggered':
        default:          return vi / Math.max(1, nVoices);
    }
}

// Build one voice's segment list across the span. Never silently truncates: if a
// model implies a segment longer than the player can hold, it SPLITS and flags.
function buildCarrier(vi, nVoices, carrier, seedRng, ctxForBreath, sched) {
    // Segments are built across the WHOLE timeline — body plus run-down — not
    // across the gliss length. With no duration set the two are the same number.
    const TIMING = carrierTiming(carrier);
    // MEASURED AND REJECTED: stopping new segments at `duration` (so nobody
    // tongues in during the fade) cuts every voice 1–5 s into the release,
    // because only the unused remainder of the current breath is left. A 12 s
    // release then ended at 45.4 s with voices still 7.4 cents from unison and
    // the fade barely half done. Players re-breathing through a long fade is
    // physically correct anyway — what must not survive is the re-ENTRY RAMP
    // that made each one sound like an attack (handled below).
    const span = TIMING.total;
    const segLen = Math.max(0.05, carrier.segLen);
    const segVar = clamp(carrier.segVar, 0, 1);
    const pattern = STRIATIONS.indexOf(carrier.striation) >= 0 ? carrier.striation : 'staggered';
    const segs = [];
    let t = 0;
    let idx = 0;

    // Stagger the FIRST entry so voices do not all attack together. This offset
    // must be POSITIVE: an earlier version shifted backwards and then clamped
    // negatives to zero, which silently collapsed every voice onto t=0 and made
    // the whole striation model a no-op — visible only as a wall of SEAM flags
    // in the panel.
    //
    // PLAN 2z: when a shape is present it supplies this voice's own entry and
    // exit instead. `sched` absent IS the legacy formula, which is why no-shape
    // renders need no branch to stay byte-identical.
    const phase0 = striationPhase(pattern, vi, nVoices, 0, seedRng);
    t = (sched && sched.startT != null) ? sched.startT : phase0 * segLen * 0.5;
    const limit = (sched && sched.endT != null) ? Math.min(span, sched.endT) : span;
    // Times at which a segment MUST end. A player cannot change technique
    // mid-note, so an edge technique's window boundary is a physical segment
    // boundary — the same "split, never truncate" rule the breath ceiling uses.
    const bounds = (sched && sched.boundaries) || null;

    while (t < limit && segs.length < 512) {
        const jitter = 1 + (seedRng() * 2 - 1) * segVar;
        let want = segLen * jitter;
        const start = Math.max(0, t);
        const flags = [];

        // breath ceiling for this voice, here
        const info = ctxForBreath(start);
        let ceiling = maxBreath(info.midi, info.level01);
        if (info.bending) ceiling *= GLISS_AIR_COST;
        ceiling = Math.min(ceiling, MAX_SEG_HARD_S);
        if (info.fixedLen != null) {
            want = info.fixedLen;              // D9: the sample decides, not us
        } else if (want > ceiling) {
            want = ceiling;
            flags.push('BREATH');              // split, never truncate silently
        }

        // LET THEM FINISH (FR-6). Truncating every voice at the end time is a
        // hard simultaneous chop, and it manufactures runt notes for whoever
        // started just before it. Under cycling the last segment runs its
        // natural length instead: progress has reached 0 by then so it is
        // inaudible, and for a real player it is simply finishing the note.
        // A shape-driven exit (`sched.endT`) is a deliberate cut and still wins.
        const hardEnd = !!(sched && sched.endT != null);
        let dur = (TIMING.extended && !hardEnd) ? want : Math.min(want, limit - start);
        // A fixed one-shot is immune: the sample decides its length (D9), so a
        // window boundary may not cut it short — it rings past and gets flagged.
        if (bounds && info.fixedLen == null) {
            bounds.forEach(b => { if (b > start + 0.02 && b - start < dur) dur = b - start; });
        }
        if (dur <= 0.02) break;

        const gapBase = Math.max(BREATH_GAP_MIN, MEASURED.RESET_GAP_S);
        const gapJit = 1 + (seedRng() * 2 - 1) * segVar * 0.5;
        let gap = gapBase * gapJit;
        if (gap < BREATH_GAP_FLOOR) { gap = BREATH_GAP_FLOOR; flags.push('BREATH'); }

        segs.push({ idx: idx++, start: round3(start), dur: round3(dur), flags: flags });
        t = start + dur + gap;
    }
    // The 512 cap used to exit SILENTLY, which is the one thing this file says
    // it never does ("split, never truncate silently"). It only bites past about
    // 70 minutes at an 8 s breath, so it does not fire on any existing render —
    // but a long render must say so rather than just stopping.
    if (segs.length >= 512 && t < limit) segs[segs.length - 1].flags.push('SEGCAP');
    return segs;
}

// ===========================================================================
// 5b · GESTURE SHAPE (PLAN 2z) — the gesture-level ADSR and its layers.
//
// THE ORTHOGONALITY RULE: morph (WHAT changes) _|_ carrier (WHEN voices sound)
// _|_ shape (the gesture's macro-form). Shaping is NOT a seventh model; every
// model inherits it and no model knows it exists.
//
// ONE CODE PATH, NO FORK. `shape` absent => gain g(t) === 1, no entry/exit
// bounds, no windows — which is bit-for-bit what the engine did before 2z.
// That identity is the hard G0 gate: the composer's blessed recipes cannot
// drift because there is no second path for them to drift down.
// ===========================================================================

const ENTRY_MODES     = ['together', 'ramp', 'striated'];
const EXIT_MODES      = ['together', 'staggered'];
const ORDER_MODES     = ['low-first', 'high-first', 'seeded'];
const SHAPE_CURVES    = ['linear', 'expo', 'sudden'];
const ATTACK_MOTIONS  = ['converge', 'gliss-in', 'none'];
const RELEASE_MOTIONS = ['disperse', 'to-unison', 'gliss-out', 'none'];

const SHAPE_KEYS    = ['attack', 'decay', 'release'];
const ATTACK_KEYS   = ['len', 'entry', 'order', 'curve', 'from', 'peak',
                       'technique', 'transient', 'noise', 'motion'];
const DECAY_KEYS    = ['len', 'curve'];
const RELEASE_KEYS  = ['len', 'exit', 'order', 'curve', 'to',
                       'technique', 'motion', 'dropout'];
const TRANSIENT_KEYS = ['technique'];
const NOISE_KEYS     = ['technique', 'voices', 'midi', 'len'];
const MOTION_KEYS    = ['type', 'cents', 'curve'];
const DROPOUT_KEYS   = ['fraction'];

// THE CURVE. Returns the eased fraction 0..1 of the way through a window.
//
//   linear  straight.
//   expo    EASE-OUT (x^(1/2.2)): the change happens early, then eases into the
//           target. Note what the unit already is — level is the score's 0-10
//           drawn height, which composer.html maps to CC7 across a 40 dB span,
//           so level-space is already roughly dB-space and a LINEAR ramp here is
//           already an exponential amplitude envelope. `expo` therefore has to
//           be more front-loaded than linear to mean anything: as a release it
//           is the expodec tail (drops fast, long quiet approach), as an attack
//           it is the instrumental bloom that arrives then settles.
//   sudden  holds at the window's START value until the last 10 %, then moves.
//           As a release curve that is the tongue-stop / rexpodec cut.
const EXPO_EXP = 1 / 2.2;
function curveEase(curve, u) {
    const x = clamp(u, 0, 1);
    if (curve === 'linear') return x;
    if (curve === 'sudden') return x < 0.9 ? 0 : (x - 0.9) / 0.1;
    return Math.pow(x, EXPO_EXP);       // expo — the default
}

// g(t) — THE GESTURE-LEVEL GAIN. Multiplies the D24 dynamics layer; the body
// (the S of ADSR) is not flat, it is the whole existing morph running at gain 1.
//
//   peak ---------.
//                 |\  decay
//      1 ---------+-\----------------------.
//   from --.  att |        BODY            |\  release
//          |/     |   (dyn layer, swells)  | \
//      0 --'      |                        |  \--- to
//         0    a.len  a.len+d.len   span-r.len  span
//
// `rel` is the per-voice release override (dropout voices cut early and
// abruptly — §5.2). Absent shape returns exactly 1, which is what makes the
// no-shape path bit-identical rather than merely equivalent.
function shapeGain(shape, t, span, rel) {
    if (!shape) return 1;
    const A = shape.attack, D = shape.decay, R = shape.release;
    const aLen = A ? A.len : 0;
    const dLen = D ? D.len : 0;
    const peak = A ? A.peak : 1;
    if (A && aLen > 0 && t < aLen) {
        return A.from + (peak - A.from) * curveEase(A.curve, t / aLen);
    }
    if (D && dLen > 0 && t < aLen + dLen) {
        return peak + (1 - peak) * curveEase(D.curve, (t - aLen) / dLen);
    }
    if (R && R.len > 0) {
        const rStart = span - R.len;
        if (t >= rStart) {
            // A dropout voice runs its own shorter, harder window; everyone else
            // tapers over the full release.
            const rLen = (rel && rel.len > 0) ? rel.len : R.len;
            const rCurve = (rel && rel.curve) ? rel.curve : R.curve;
            return 1 + (R.to - 1) * curveEase(rCurve, (t - rStart) / rLen);
        }
    }
    return 1;
}

// Position of a voice in an ordered edge sequence (rank 0 goes first). The
// voice index IS pitch order — the render sorts the source ascending — so
// low-first is the identity and high-first is its mirror.
function shapeRank(mode, vi, nVoices, seededOrder) {
    if (mode === 'high-first') return nVoices - 1 - vi;
    if (mode === 'seeded') return seededOrder[vi];
    return vi;                                   // low-first
}

// WHICH VOICES DROP OUT — the composer's *"some parts just immediately drop
// out, but yet it feels like a taper"*.
//
// CLUSTER-SAFE BY RULE. Near-unison voices are ONE unit: half a pair does not
// beat, so splitting a pair does not give a thinner version of the beating, it
// gives a different and worse sound (the same reason reduceSource drops whole
// clusters — COLD START). So whole clusters drop, chosen evenly across the
// register so the surviving band keeps its width (D21's registral spread).
//
// The fraction is a DIAL, not a contract: cluster sizes may not divide the ask,
// and when they do not this UNDER-drops rather than over-drops — thinning more
// than the composer said is the worse error. The achieved count is reported in
// meta.shape.dropped.
function dropoutVoices(startMidi, fraction) {
    const n = startMidi.length;
    const drop = {};
    const want = Math.round(clamp(fraction, 0, 1) * n);
    if (want <= 0 || n === 0) return drop;
    if (want >= n) { for (let i = 0; i < n; i++) drop[i] = 1; return drop; }

    const clusters = [];
    for (let i = 0; i < n; i++) {
        const last = clusters[clusters.length - 1];
        if (last && startMidi[i] - startMidi[last[last.length - 1]] <= 1) last.push(i);
        else clusters.push([i]);
    }
    const nC = clusters.length;
    const wantedC = Math.max(1, Math.round((nC * want) / n));
    const picks = [];
    for (let i = 0; i < wantedC; i++) {
        picks.push(nC === 1 ? 0
            : Math.round((i * (nC - 1)) / Math.max(1, wantedC - 1)));
    }
    let dropped = 0;
    [...new Set(picks)].forEach(ci => {
        const c = clusters[ci];
        if (dropped + c.length <= want) { c.forEach(v => { drop[v] = 1; }); dropped += c.length; }
    });
    return drop;
}

// --- validation helpers. Everything unknown or out of range is REPORTED and
//     replaced by a sane default; nothing is ever silently ignored (D16).
function reportUnknown(obj, allowed, path, warn) {
    Object.keys(obj || {}).forEach(k => {
        if (allowed.indexOf(k) < 0 && k[0] !== '_') {
            warn.push('SHAPE: unrecognised key "' + path + '.' + k + '"');
        }
    });
}
function pickEnum(v, list, dflt, path, warn) {
    if (v == null) return dflt;
    if (list.indexOf(v) >= 0) return v;
    warn.push('SHAPE: ' + path + ' "' + v + '" is not one of ' + list.join(' | ') +
              ' — using ' + dflt);
    return dflt;
}
function pickNum(v, dflt, lo, hi, path, warn) {
    if (v == null) return dflt;
    const n = Number(v);
    if (!isFinite(n)) {
        warn.push('SHAPE: ' + path + ' is not a number — using ' + dflt);
        return dflt;
    }
    const c = clamp(n, lo, hi);
    if (c !== n) warn.push('SHAPE: ' + path + ' ' + n + ' clamped to ' + c);
    return c;
}
function pickTechnique(v, path, warn) {
    if (v == null) return null;
    if (TECHNIQUES[v]) return v;
    warn.push('SHAPE: ' + path + ' "' + v + '" is not a known technique — ignored');
    return null;
}
function pickMotion(raw, list, path, warn) {
    if (!raw) return null;
    reportUnknown(raw, MOTION_KEYS, path, warn);
    const type = pickEnum(raw.type, list, 'none', path + '.type', warn);
    if (type === 'none') return null;
    // to-unison resolves the MODEL's own deviation back to zero, so it has no
    // amount of its own; saying so beats letting a dial sit there doing nothing.
    if (type === 'to-unison' && raw.cents != null) {
        warn.push('SHAPE: ' + path + '.cents is ignored by to-unison — it resolves ' +
                  "the model's own deviation to zero");
    }
    return {
        type: type,
        cents: pickNum(raw.cents, 40, -1200, 1200, path + '.cents', warn),
        curve: pickEnum(raw.curve, SHAPE_CURVES, 'expo', path + '.curve', warn),
    };
}

// Normalise + validate a `shape` block against the span. Returns the shape (or
// null) and every complaint it had on the way.
function normaliseShape(raw, span) {
    const warn = [];
    if (raw == null) return { shape: null, warnings: warn };
    if (typeof raw !== 'object' || Array.isArray(raw)) {
        warn.push('SHAPE: "shape" must be an object — ignored');
        return { shape: null, warnings: warn };
    }
    reportUnknown(raw, SHAPE_KEYS, 'shape', warn);

    let attack = null;
    if (raw.attack) {
        const a = raw.attack;
        reportUnknown(a, ATTACK_KEYS, 'shape.attack', warn);
        if (a.len == null) warn.push('SHAPE: attack.len is required when an attack block is present — using 2');
        let peak = pickNum(a.peak, 1, 0, 10, 'shape.attack.peak', warn);
        if (peak < 1) {
            warn.push('SHAPE: attack.peak ' + peak + ' < 1 clamped to 1 — "from" is the low-start dial');
            peak = 1;
        }
        let transient = null;
        if (a.transient) {
            reportUnknown(a.transient, TRANSIENT_KEYS, 'shape.attack.transient', warn);
            let tt = pickTechnique(a.transient.technique, 'shape.attack.transient.technique', warn) || 'staccato';
            // A transient is a PREPENDED ONE-SHOT: it must be a technique that
            // ends itself (D9), because nothing else has a length we know.
            if ((TECHNIQUES[tt] || {}).durClass !== 'fixed') {
                warn.push('SHAPE: transient.technique "' + tt + '" is not a one-shot (D9) — using staccato');
                tt = 'staccato';
            }
            transient = { technique: tt };
        }
        let noise = null;
        if (a.noise) {
            reportUnknown(a.noise, NOISE_KEYS, 'shape.attack.noise', warn);
            const midi = Array.isArray(a.noise.midi) ? a.noise.midi.slice()
                : (a.noise.midi === 'chord' || a.noise.midi === 'chord-top') ? a.noise.midi
                : (a.noise.midi == null ? 'chord-top'
                    : (warn.push('SHAPE: noise.midi must be an array, "chord" or "chord-top" — using chord-top'),
                       'chord-top'));
            noise = {
                technique: pickTechnique(a.noise.technique, 'shape.attack.noise.technique', warn) || 'cuivre',
                voices: Math.round(pickNum(a.noise.voices, 1, 1, 10, 'shape.attack.noise.voices', warn)),
                midi: midi,
                len: a.noise.len == null ? null : pickNum(a.noise.len, 1, 0.05, 60, 'shape.attack.noise.len', warn),
            };
        }
        attack = {
            len:   pickNum(a.len, 2, 0, 3600, 'shape.attack.len', warn),
            entry: pickEnum(a.entry, ENTRY_MODES, 'together', 'shape.attack.entry', warn),
            order: pickEnum(a.order, ORDER_MODES, 'low-first', 'shape.attack.order', warn),
            curve: pickEnum(a.curve, SHAPE_CURVES, 'expo', 'shape.attack.curve', warn),
            from:  pickNum(a.from, 0.15, 0, 1, 'shape.attack.from', warn),
            peak:  peak,
            technique: pickTechnique(a.technique, 'shape.attack.technique', warn),
            transient: transient,
            noise: noise,
            motion: pickMotion(a.motion, ATTACK_MOTIONS, 'shape.attack.motion', warn),
        };
    }

    let decay = null;
    if (raw.decay) {
        reportUnknown(raw.decay, DECAY_KEYS, 'shape.decay', warn);
        if (raw.decay.len == null) warn.push('SHAPE: decay.len is required when a decay block is present — using 3');
        decay = {
            len:   pickNum(raw.decay.len, 3, 0, 3600, 'shape.decay.len', warn),
            curve: pickEnum(raw.decay.curve, SHAPE_CURVES, 'expo', 'shape.decay.curve', warn),
        };
    }
    // peak > 1 with no decay would leave the gesture parked above the body for
    // the whole span, which is never what "hit it and settle" means. Supply the
    // decay AND say so — a default that hides is a bug with a nice manner.
    if (attack && attack.peak > 1 && !decay) {
        decay = { len: Math.min(4, span * 0.15), curve: 'expo' };
        warn.push('SHAPE: attack.peak ' + attack.peak + ' > 1 with no decay block — ' +
                  'applied a default decay of ' + round3(decay.len) + ' s (expo)');
    }

    let release = null;
    if (raw.release) {
        const r = raw.release;
        reportUnknown(r, RELEASE_KEYS, 'shape.release', warn);
        if (r.len == null) warn.push('SHAPE: release.len is required when a release block is present — using 8');
        let dropout = null;
        if (r.dropout) {
            reportUnknown(r.dropout, DROPOUT_KEYS, 'shape.release.dropout', warn);
            dropout = { fraction: pickNum(r.dropout.fraction, 0.4, 0, 1, 'shape.release.dropout.fraction', warn) };
        }
        release = {
            len:   pickNum(r.len, 8, 0, 3600, 'shape.release.len', warn),
            exit:  pickEnum(r.exit, EXIT_MODES, 'staggered', 'shape.release.exit', warn),
            order: pickEnum(r.order, ORDER_MODES, 'seeded', 'shape.release.order', warn),
            curve: pickEnum(r.curve, SHAPE_CURVES, 'expo', 'shape.release.curve', warn),
            to:    pickNum(r.to, 0, 0, 1, 'shape.release.to', warn),
            technique: pickTechnique(r.technique, 'shape.release.technique', warn),
            motion: pickMotion(r.motion, RELEASE_MOTIONS, 'shape.release.motion', warn),
            dropout: dropout,
        };
    }

    if (!attack && !decay && !release) {
        warn.push('SHAPE: block is empty — no shaping applied');
        return { shape: null, warnings: warn };
    }

    // A + D + R cannot exceed the span. The body may reach zero length — a
    // gesture that is all edge is a legitimate thing to ask for — but the
    // windows may not run past the end, so they scale together and say so.
    const aLen = attack ? attack.len : 0;
    const dLen = decay ? decay.len : 0;
    const rLen = release ? release.len : 0;
    const total = aLen + dLen + rLen;
    let clamped = null;
    if (total > span && total > 0) {
        const k = span / total;
        if (attack) attack.len = round3(attack.len * k);
        if (decay) decay.len = round3(decay.len * k);
        if (release) release.len = round3(release.len * k);
        clamped = 'SHAPE_CLAMP: attack+decay+release ' + round3(total) + ' s exceeds span ' +
                  round3(span) + ' s — all three scaled by ' + k.toFixed(3);
        warn.push(clamped);
    }

    return {
        shape: { attack: attack, decay: decay, release: release, _clamped: !!clamped },
        warnings: warn,
    };
}

// ===========================================================================
// 6 · RENDER — sample the morph over each carrier segment.
// ===========================================================================

function normaliseParams(v) {
    const p = v || {};
    const model = p.model || DEFAULTS.model;
    const dyn = Object.assign({}, DEFAULTS.dyn, p.dyn);
    // An unset shape resolves by model: M6 rotates (that IS M6), everything else
    // swells. Set it explicitly — including 'flat' — to override.
    if (!dyn.shape) dyn.shape = (model === 'M6') ? 'rotate' : 'swell';
    if (DYN_SHAPES.indexOf(dyn.shape) < 0) dyn.shape = 'swell';
    const carrier = Object.assign({}, DEFAULTS.carrier, p.carrier);
    // PLAN 2z. `shape` is the gesture's macro-form (ADSR + its layers). Absent
    // is the ordinary case and costs nothing: null all the way down.
    // The gesture ADSR has to fit the whole timeline, not the gliss length —
    // identical when no duration is set, since total then IS the span.
    const sh = normaliseShape(p.shape, carrierTiming(carrier).total);
    return {
        model: model,
        source: p.source || { kind: 'pitches', midi: [34, 41, 46, 50, 53, 58, 62, 65] },
        target: p.target || null,
        dials: Object.assign({}, DEFAULTS.dials, p.dials),
        carrier: carrier,
        dyn: dyn,
        shape: sh.shape,
        _shapeWarnings: sh.warnings,
        seed: p.seed != null ? p.seed : DEFAULTS.seed,
        label: p.label || '',
        // CONCURRENT MORPHS. `lanes` names the players this morph occupies, e.g.
        // [0,1,2,3] and [4,5,6,7] for two at once. Voice count follows from it,
        // and the source chord is reduced to fit by reduceSource. Omit both and
        // it behaves as before: one voice per source pitch, lanes 0..n-1.
        lanes: Array.isArray(p.lanes) && p.lanes.length ? p.lanes.slice() : null,
        voices: p.voices != null ? p.voices : null,
    };
}

// Unknown keys are REPORTED, never silently ignored — a typo'd dial that does
// nothing is worse than one that errors (plan §4.1).
//
// `lanes` and `voices` were READ by normaliseParams but missing from this list,
// so every concurrent-morph params file earned a spurious "unrecognised key"
// warning (found while planning 2z; fixed in its G0). `shape` is 2z's own key.
const KNOWN_KEYS = ['model', 'source', 'target', 'dials', 'carrier', 'dyn', 'seed', 'label',
                    'lanes', 'voices', 'shape'];
function unknownKeys(v) {
    return Object.keys(v || {}).filter(k => KNOWN_KEYS.indexOf(k) < 0 && k[0] !== '_');
}

// ===========================================================================
// 6b · PARAM PATHS (PLAN 2y) — the dot-path schema a recipe may patch.
//
// A recipe is DATA: endpoints plus interpolation, never code (2y §4). Which
// means the only thing standing between a typo and a dial that silently does
// nothing is this table. An unrecognised path is a REPORTED ERROR at load
// time — the engine's existing unknown-key policy, extended down the tree.
//
// The declared TYPE is also the interpolation rule (2y §9.6): only plain
// numbers lerp. Everything else STEPS to the value of the highest waypoint at
// or below the dial position, because interpolating a pitch array or a
// striation name element-wise invites subtle garbage, while stepping is
// predictable and audible.
// ===========================================================================

const PARAM_PATHS = {
    'model': 'string', 'seed': 'number', 'label': 'string',
    'lanes': 'array', 'voices': 'number',

    'source.kind': 'string', 'source.midi': 'array', 'source.id': 'string',

    // `target` carries a different payload per model; all of them are known, so
    // enumerate rather than wildcard — a wildcard would pass every typo.
    'target.cents': 'number', 'target.direction': 'string', 'target.midi': 'array',
    'target.kind': 'string', 'target.id': 'string', 'target.path': 'array',
    'target.steps': 'number', 'target.fundamental': 'number', 'target.partials': 'array',
    'target.stepped': 'string', 'target.baseTechnique': 'string',

    'dials.bias': 'number', 'dials.spread': 'number', 'dials.depth': 'number',

    'carrier.span': 'number', 'carrier.segLen': 'number', 'carrier.segVar': 'number',
    'carrier.striation': 'string',
    'carrier.duration': 'number', 'carrier.release': 'number',

    'dyn.base': 'number', 'dyn.shape': 'string', 'dyn.amount': 'number',
    'dyn.turns': 'number', 'dyn.spread': 'number',

    // the 2z gesture shape — recipes patch these like any other dial
    'shape.attack.len': 'number', 'shape.attack.entry': 'string',
    'shape.attack.order': 'string', 'shape.attack.curve': 'string',
    'shape.attack.from': 'number', 'shape.attack.peak': 'number',
    'shape.attack.technique': 'string',
    'shape.attack.transient.technique': 'string',
    'shape.attack.noise.technique': 'string', 'shape.attack.noise.voices': 'number',
    'shape.attack.noise.midi': 'array', 'shape.attack.noise.len': 'number',
    'shape.attack.motion.type': 'string', 'shape.attack.motion.cents': 'number',
    'shape.attack.motion.curve': 'string',
    'shape.decay.len': 'number', 'shape.decay.curve': 'string',
    'shape.release.len': 'number', 'shape.release.exit': 'string',
    'shape.release.order': 'string', 'shape.release.curve': 'string',
    'shape.release.to': 'number', 'shape.release.technique': 'string',
    'shape.release.motion.type': 'string', 'shape.release.motion.cents': 'number',
    'shape.release.motion.curve': 'string',
    'shape.release.dropout.fraction': 'number',
};

// null = not a patchable path. Callers REPORT null; they never guess.
function paramPathType(path) {
    return Object.prototype.hasOwnProperty.call(PARAM_PATHS, path) ? PARAM_PATHS[path] : null;
}

function getParamPath(obj, path) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length; i++) {
        if (o == null || typeof o !== 'object') return undefined;
        o = o[parts[i]];
    }
    return o;
}

// Creates intermediate objects, which is deliberate: a recipe patching
// `shape.attack.len` onto a model that has no shape block yet is a legitimate
// thing to want, and the path was validated before we got here.
function setParamPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
        o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
}

// ===========================================================================
// 6c · RECIPES (PLAN 2y §4) — the one-dial collapse.
//
// The composer's spec: "a combination of parameters into a single dial… each
// recipe essentially is paired down to one dial, in some ranges."
//
// A recipe is ENDPOINTS + INTERPOLATION, stored as pure data — diffable,
// boundable, testable, writable by the AI mid-conversation, and impossible to
// smuggle code into. A stored *function* would be a second engine to debug.
//
// TWO RULES WORTH KNOWING BEFORE READING THE CODE:
//
// 1. ONLY PLAIN NUMBERS LERP (§9.6). Strings, arrays and objects STEP to the
//    value of the highest waypoint at or below the dial. Interpolating a pitch
//    array or a striation name element-wise invites subtle garbage; stepping is
//    predictable and audible.
// 2. A RECIPE NOT PRESENT IN `settings` IS NOT APPLIED. The base params are the
//    base params. This is what stops merely opening a model — with its sliders
//    sitting at their defaults — from quietly rewriting material the composer
//    blessed. "Off" is the default state of every dial, and `recipeSettings` in
//    an actual's provenance therefore records exactly what was turned.
// ===========================================================================

const RECIPE_ROUND = 1e6;   // 6 dp: keeps lerped values readable and diffable

function applyRecipe(params, recipe, x) {
    const out = JSON.parse(JSON.stringify(params || {}));
    const warnings = [];
    const name = (recipe && recipe.recipe) || '(unnamed)';
    const d = (recipe && recipe.dial) || { min: 0, max: 1 };
    const wps = ((recipe && recipe.waypoints) || []).slice().sort((a, b) => a.at - b.at);
    if (wps.length < 2) {
        warnings.push('RECIPE "' + name + '": needs at least 2 waypoints — not applied');
        return { params: out, warnings: warnings, paths: [] };
    }
    const pos = clamp(x, d.min, d.max);
    if (pos !== x) warnings.push('RECIPE "' + name + '": dial ' + x + ' clamped to ' + pos);

    const paths = {};
    wps.forEach(w => Object.keys(w.patch || {}).forEach(p => { paths[p] = 1; }));
    const touched = [];

    Object.keys(paths).forEach(p => {
        const type = paramPathType(p);
        if (type === null) {
            // Never a silent no-op: a dial that does nothing is worse than one
            // that errors (the engine's unknown-key policy, extended down).
            warnings.push('RECIPE "' + name + '": unknown param path "' + p + '" — not applied');
            return;
        }
        const decl = wps.filter(w => w.patch &&
            Object.prototype.hasOwnProperty.call(w.patch, p));
        if (!decl.length) return;
        touched.push(p);

        let lo = null, hi = null;
        decl.forEach(w => { if (w.at <= pos + 1e-12) lo = w; });
        for (let i = decl.length - 1; i >= 0; i--) if (decl[i].at >= pos - 1e-12) hi = decl[i];

        if (!lo) { setParamPath(out, p, decl[0].patch[p]); return; }   // below the first
        if (!hi || lo === hi) { setParamPath(out, p, lo.patch[p]); return; }

        const a = lo.patch[p], b = hi.patch[p];
        if (type === 'number' && typeof a === 'number' && typeof b === 'number') {
            const t = (hi.at - lo.at) > 0 ? (pos - lo.at) / (hi.at - lo.at) : 0;
            setParamPath(out, p, Math.round((a + (b - a) * t) * RECIPE_ROUND) / RECIPE_ROUND);
        } else {
            setParamPath(out, p, a);        // STEP to the highest at or below
        }
    });
    return { params: out, warnings: warnings, paths: touched };
}

// Resolve a model's params under a set of dial positions.
// Recipes apply in the MODEL's listed order — not the settings' key order — so
// "last wins" is a property of the model, not of how a caller happened to type
// the object.
function resolveParams(model, settings) {
    const s = settings || {};
    let params = JSON.parse(JSON.stringify((model && model.baseParams) || {}));
    const warnings = [];
    const recipes = (model && model.recipes) || [];
    const known = {};
    const owner = {};
    recipes.forEach(r => { known[r.recipe] = 1; });

    recipes.forEach(r => {
        if (!Object.prototype.hasOwnProperty.call(s, r.recipe)) return;   // OFF unless set
        const res = applyRecipe(params, r, s[r.recipe]);
        params = res.params;
        res.warnings.forEach(w => warnings.push(w));
        res.paths.forEach(p => {
            if (owner[p] && owner[p] !== r.recipe) {
                warnings.push('RECIPE: "' + owner[p] + '" and "' + r.recipe +
                              '" both move "' + p + '" — "' + r.recipe + '" wins (listed later)');
            }
            owner[p] = r.recipe;
        });
    });
    Object.keys(s).forEach(n => {
        if (!known[n]) warnings.push('RECIPE: this model has no recipe named "' + n + '"');
    });
    return { params: params, warnings: warnings };
}

// REDUCE A CHORD TO n VOICES WITHOUT LOSING WHAT MAKES IT WORK.
//
// Needed for concurrent morphs: two or three at once means four or five players
// each, and the naive answer (drop the top, or take every other note) destroys
// exactly the thing being listened for. In BEATING BLOOM the musical unit is the
// PAIR — drop half of a pair and that pair stops beating altogether, so a
// "thinned" version is not a quieter version of the effect, it is a different
// and worse one.
//
// So: group near-equal pitches into clusters (a unison pair is one cluster),
// then keep WHOLE clusters, chosen evenly across the register so the band keeps
// its width. Same principle as D21's registral-spread thinning for density
// builds — drop structural units, never fragments of them.
function reduceSource(midi, n) {
    const sorted = midi.slice().sort((a, b) => a - b);
    if (n >= sorted.length) return sorted;
    const clusters = [];
    sorted.forEach(m => {
        const last = clusters[clusters.length - 1];
        if (last && m - last[last.length - 1] <= 1) last.push(m);
        else clusters.push([m]);
    });
    // choose which clusters survive, evenly spaced across the register
    const keep = [];
    let budget = n;
    const wanted = Math.max(1, Math.min(clusters.length, Math.round(n / (sorted.length / clusters.length))));
    const idx = [];
    for (let i = 0; i < wanted; i++) {
        idx.push(clusters.length === 1 ? 0
            : Math.round((i * (clusters.length - 1)) / Math.max(1, wanted - 1)));
    }
    [...new Set(idx)].forEach(i => {
        const c = clusters[i];
        if (budget >= c.length) { keep.push(...c); budget -= c.length; }
    });
    // top up from the widest-spaced remaining pitches if the clusters undershot
    if (keep.length < n) {
        const rest = sorted.filter(m => !keep.includes(m));
        while (keep.length < n && rest.length) {
            let best = 0, bestD = -1;
            rest.forEach((m, i) => {
                const d = keep.length ? Math.min(...keep.map(k => Math.abs(k - m))) : 1e9;
                if (d > bestD) { bestD = d; best = i; }
            });
            keep.push(rest.splice(best, 1)[0]);
        }
    }
    return keep.sort((a, b) => a - b).slice(0, n);
}

function resolveSource(source, resolveVert) {
    if (!source) return [];
    if (source.kind === 'vert' && resolveVert) return (resolveVert(source.id) || []).slice();
    return (source.midi || []).slice();
}

// Substitute the nearest feasible technique rather than refusing (D16 spirit).
function feasibleTechnique(tech, midi) {
    const t = TECHNIQUES[tech];
    if (t && midi >= t.lo && midi <= t.hi) return { technique: tech, flagged: false };
    // nearest by range distance, preferring a sustain-class replacement
    let best = null, bestD = Infinity;
    Object.keys(TECHNIQUES).forEach(k => {
        const c = TECHNIQUES[k];
        const d = midi < c.lo ? c.lo - midi : midi > c.hi ? midi - c.hi : 0;
        const bias = (t && c.durClass === t.durClass) ? 0 : 0.5;
        if (d + bias < bestD) { bestD = d + bias; best = k; }
    });
    return { technique: best || 'ord', flagged: true };
}

function render(params, opts) {
    const P = normaliseParams(params);
    const o = opts || {};
    const rng = mulberry32(P.seed);
    const rawMidi = resolveSource(P.source, o.resolveVert).slice().sort((a, b) => a - b);
    const cap = P.lanes ? P.lanes.length : (P.voices || o.maxVoices || 10);
    const startMidi = reduceSource(rawMidi, Math.min(cap, o.maxVoices || 10));
    const nVoices = startMidi.length;
    const notes = [];
    const warnings = unknownKeys(params).map(k => 'PARAM: unrecognised key "' + k + '"')
        .concat(P._shapeWarnings || []);

    if (!nVoices) {
        return { notes: [], summary: { hard: 0, soft: {}, flags: {} },
                 warnings: warnings.concat(['PARAM: no source pitches']),
                 meta: { model: P.model, seed: P.seed, span: P.carrier.span, voices: 0 } };
    }

    const startCents = [];
    for (let i = 0; i < nVoices; i++) startCents.push(startMidi[i] * 100);
    const targetCents = (P.target && P.target.midi)
        ? P.target.midi.slice().sort((a, b) => a - b).map(m => m * 100)
        : (P.target && P.target.kind === 'vert' && o.resolveVert)
            ? (o.resolveVert(P.target.id) || []).slice().sort((a, b) => a - b).map(m => m * 100)
            : null;

    const ctx = {
        startCents: startCents, targetCents: targetCents, nVoices: nVoices,
        target: P.target, dyn: P.dyn, dynBase: P.dyn.base,
    };

    // M2: assign each voice its NEAREST free partial, nearest-first, so no voice
    // travels further than it must and no two land on the same partial.
    if (P.model === 'M2') {
        const t = P.target || {};
        const fund = t.fundamental != null ? t.fundamental : 41;   // F2, the piece's anchor
        const parts = (t.partials && t.partials.length) ? t.partials
                                                        : [2, 3, 4, 5, 6, 7, 8, 9, 11, 13];
        // OCTAVE-FOLD each partial into the playable register. Partial 11 of F2
        // is MIDI 82 and partial 13 is 85 — both above the tuba entirely, and
        // asking a voice at MIDI 58 to reach them demanded 1400 cents of bend
        // against a patch that has 199. What makes a chord sound spectral is the
        // partial's PITCH CLASS (7 is -31 c, 11 is +49 c, 13 is -41 c); which
        // octave it is voiced in is an orchestration choice, and for ten tubas
        // the answer is "one they can play". So every octave transposition of
        // every partial inside the ord range is a candidate, and each voice
        // takes the nearest free one.
        const ordLo = TECHNIQUES.ord.lo * 100, ordHi = TECHNIQUES.ord.hi * 100;
        const cand = [];
        parts.forEach(n => {
            const bcents = partialCents(fund, n);
            let c = bcents;
            while (c - 1200 >= ordLo) c -= 1200;      // drop to the bottom of the range
            for (; c <= ordHi; c += 1200) if (c >= ordLo) cand.push(c);
        });
        if (!cand.length) parts.forEach(n => cand.push(partialCents(fund, n)));
        const pairs = [];
        for (let v = 0; v < nVoices; v++) {
            cand.forEach((c, ci) => pairs.push({ v: v, ci: ci, d: Math.abs(c - startCents[v]) }));
        }
        pairs.sort((a, b) => a.d - b.d);
        const usedV = {}, usedC = {};
        ctx._m2 = new Array(nVoices);
        pairs.forEach(pr => {
            if (usedV[pr.v] || usedC[pr.ci]) return;
            usedV[pr.v] = usedC[pr.ci] = 1;
            ctx._m2[pr.v] = cand[pr.ci];
        });
        for (let v = 0; v < nVoices; v++) {                 // more voices than partials
            if (ctx._m2[v] == null) {
                let best = cand[0];
                cand.forEach(c => {
                    if (Math.abs(c - startCents[v]) < Math.abs(best - startCents[v])) best = c;
                });
                ctx._m2[v] = best;
            }
        }
    }
    const modelFn = MODELS[P.model] || MODELS.M6;
    const order = staggerOrder(nVoices, P.seed);
    // TWO MEANINGS, NOW NAMED. Inside this function `span` already meant "the
    // whole timeline" in every use except one — release anchoring, the stateAt
    // lookahead clamps, shape normalisation and the meta all want the total.
    // `voiceProgress` was the single consumer that meant the gliss length, and
    // conflating the two is what made lengthening a gesture also slow it down.
    const TIMING = carrierTiming(P.carrier);
    const travel = TIMING.span;          // the one-way gliss — pace
    const span = TIMING.total;           // the timeline, as everything below means

    // Per-voice release override, filled by the scheduler below. Empty (all
    // undefined) means every voice tapers over the shape's own release window.
    const voiceRel = new Array(nVoices);

    // ---- THE SHAPE'S SCHEDULE (PLAN 2z §5.2) ------------------------------
    // Who enters when, who leaves when, who drops out. `null` throughout when
    // there is no shape, and buildCarrier then runs its legacy formula.
    const shapeSched = new Array(nVoices).fill(null);
    const SH = P.shape;
    const shapeInfo = { entryTogether: false, attackEnd: 0, dropped: [], noise: 0 };
    const SH_A = SH ? SH.attack : null;
    const SH_R = SH ? SH.release : null;
    const aLen = SH_A ? SH_A.len : 0;
    const rLen = SH_R ? SH_R.len : 0;
    const rStart = span - rLen;
    const transientPlan = new Array(nVoices).fill(null);
    let sawM4Override = false;
    if (SH) {
        const A = SH_A, R = SH_R;
        const seededOrder = staggerOrder(nVoices, P.seed + 101);
        const pattern = STRIATIONS.indexOf(P.carrier.striation) >= 0 ? P.carrier.striation : 'staggered';
        const denom = Math.max(1, nVoices - 1);

        // ENTRIES. `together` is the default whenever a shape block is present
        // (composer, day 11 — the striated entry is one option, not the norm),
        // and it is also what a shape with no attack block gets.
        shapeInfo.entryTogether = !A || A.entry === 'together';
        shapeInfo.attackEnd = aLen;
        for (let vi = 0; vi < nVoices; vi++) {
            let startT = 0;
            if (A && aLen > 0) {
                if (A.entry === 'ramp') {
                    startT = (shapeRank(A.order, vi, nVoices, seededOrder) / denom) * aLen;
                } else if (A.entry === 'striated') {
                    startT = striationPhase(pattern, vi, nVoices, 0, null) * aLen;
                }
            }
            shapeSched[vi] = { startT: round3(startT), endT: null, boundaries: null };
        }

        // EXITS + DROPOUT.
        if (R && rLen > 0) {
            const dropSet = (R.dropout && R.dropout.fraction > 0)
                ? dropoutVoices(startMidi, R.dropout.fraction) : {};
            const rankOf = vi => shapeRank(R.order, vi, nVoices, seededOrder);
            const dropIdx = [], taperIdx = [];
            for (let vi = 0; vi < nVoices; vi++) (dropSet[vi] ? dropIdx : taperIdx).push(vi);
            dropIdx.sort((a, b) => rankOf(a) - rankOf(b));
            taperIdx.sort((a, b) => rankOf(a) - rankOf(b));
            shapeInfo.dropped = dropIdx.slice();

            // Dropouts leave early and ABRUPTLY, spread over the first half of
            // the release window with their own `sudden` gain — the abruptness
            // is the point, and cluster-safety is what keeps the beating honest
            // as it thins (it thins by whole pairs).
            dropIdx.forEach((vi, k) => {
                const endT = rStart + ((k + 1) / dropIdx.length) * rLen * 0.5;
                shapeSched[vi].endT = round3(endT);
                voiceRel[vi] = { len: Math.max(0.05, endT - rStart), curve: 'sudden' };
            });
            // The rest taper. `together` = everyone reaches the end; `staggered`
            // spreads the ends across the window. Positions run 1..n rather than
            // 0..n-1 so that even the first to leave gets some taper — an exit at
            // exactly the release start is a cut, which is what dropout is for.
            taperIdx.forEach((vi, k) => {
                if (R.exit === 'together') { shapeSched[vi].endT = round3(span); return; }
                const u = (k + 1) / taperIdx.length;
                shapeSched[vi].endT = round3(rStart + u * rLen);
            });
        }

        // Technique-window boundaries: a player cannot change technique
        // mid-note, so an edge technique forces a segment break at its window's
        // inner edge. Only added when an edge technique is actually asked for.
        const bounds = [];
        if (A && A.technique && aLen > 0) bounds.push(aLen);
        if (R && R.technique && rLen > 0) bounds.push(rStart);
        if (bounds.length) {
            for (let vi = 0; vi < nVoices; vi++) shapeSched[vi].boundaries = bounds;
        }

        // TRANSIENT — a prepended one-shot, the doubled/stacked attack.
        //
        // THE PHYSICS, so nobody fights it (D9): a one-shot ends itself, and one
        // player cannot sound two notes at once. So the sustain re-attack lands
        // at transient start + the SAMPLE's true length + a tongue reset, and a
        // staccato transient gives HIT-THEN-TONE at about half a second — ten
        // hits at t=0 with the sustains blooming in behind them, which is what a
        // real ensemble attack sounds like. It can never give hit-AND-tone from
        // the same player; simultaneous stacking is the noise layer's job (§5.4),
        // which uses different players.
        if (A && A.transient) {
            for (let vi = 0; vi < nVoices; vi++) {
                const tMidi = midiOf(startCents[vi]);
                const fe = feasibleTechnique(A.transient.technique, tMidi);
                const len = fixedLength(fe.technique, tMidi, o.sampleLengths) ||
                            FIXED_LEN_DEFAULT[fe.technique] || 0.45;
                const at = shapeSched[vi].startT;
                transientPlan[vi] = {
                    tStart: round3(at), dur: round3(len), midi: tMidi,
                    technique: fe.technique, flagged: fe.flagged,
                };
                shapeSched[vi].startT = round3(at + len + RATE.tongueReset);
            }
        }
    }

    // MOTION (§5.5) — the morph technology INSIDE the envelope's windows:
    // spectrum assembling on the way in, beating dissolving on the way out,
    // glissando tails.
    //
    // THE STRUCTURAL INVARIANT: zero at the window's INNER edge. An attack
    // motion decays to 0 by attack.len; a release motion grows from 0 at
    // span - release.len. Continuity with the body is therefore guaranteed by
    // construction — there is no handoff to check, ever, at any setting.
    //
    // The deviations ride the existing adaptive bend sampling and the
    // GLISS/REKEY machinery, so a wide motion gets the segmented re-key the
    // composer has already heard as seamless (D26). No new pitch code path.
    function motionDev(vi, t, movedCents) {
        let dev = 0;
        if (SH_A && SH_A.motion && aLen > 0 && t < aLen) {
            const m = SH_A.motion;
            const w = 1 - curveEase(m.curve, t / aLen);       // 1 at onset -> 0 at the body
            if (m.type === 'converge') {
                // M3's fan math run backwards: voices enter scattered around the
                // chord and focus into it. Symmetric about the centre, so the
                // chord's centre of gravity never moves.
                const half = (nVoices - 1) / 2;
                const away = half > 0 ? (vi - half) / half : 0;    // -1 .. +1
                dev += w * m.cents * away;
            } else {                                              // gliss-in
                dev += w * m.cents;
            }
        }
        if (SH_R && SH_R.motion && rLen > 0 && t >= rStart) {
            const m = SH_R.motion;
            const w = curveEase(m.curve, (t - rStart) / rLen);    // 0 at the body -> 1 at span
            if (m.type === 'disperse') {
                dev += w * m.cents * (vi % 2 === 0 ? 1 : -1);      // M1's detune opening
            } else if (m.type === 'to-unison') {
                // Beating RESOLVING: unwind whatever the model has done, back to
                // the voice's starting pitch. That is why it needs no cents of
                // its own — the model's deviation is the amount.
                dev += w * (startCents[vi] - movedCents);
            } else {                                              // gliss-out
                dev += w * m.cents;
            }
        }
        return dev;
    }

    // state of one voice at time t — the MORPH half, independent of the carrier
    function stateAt(vi, t) {
        const p = voiceProgress(vi, nVoices, t, travel, P.dials, order, TIMING);
        // THE SHAPE MULTIPLIES THE LAYER, it never replaces it (plan §2, D24).
        // With no shape this is `* 1` and the clamp is a no-op on an already
        // clamped value, so the render is bit-identical — that identity is the
        // G0 gate and it is what lets shaping exist without a second code path.
        const g = shapeGain(P.shape, t, span, voiceRel[vi]);
        // THE RELEASE MUST FADE, AND DRIVING PROGRESS DOWN IS NOT ENOUGH.
        //
        // The dynamics layer is not monotonic in progress. `swell` is an ARCH:
        // it is quiet at p=1, loudest at p=0.5 and quiet again at p=0 — so
        // running p from 1 to 0 walks back through the peak, and the "release"
        // got LOUDER before it faded. Measured on a one-way bloom + 12 s
        // release: seven notes inside the release window peaked at 9.20 of 10,
        // which the composer heard as an attack at the end. `rotate` has the
        // same problem for the same reason; only `rise` happens to be monotonic.
        //
        // So the release applies its own fade on top. Pitch still closes to
        // unison via p (that is the gesture), but the LEVEL is guaranteed to
        // descend whatever shape the body is using.
        // Attenuating the arch was not enough on its own: the peak sits early in
        // the release, where the fade has barely begun, so a swell still surged
        // to 7.3 of 10 a second after the body ended. So the level's progress is
        // FROZEN at its body-end value and fades from there — a release is a
        // fade, not a continuation of the breathing. Pitch keeps following p, so
        // the bloom still closes to unison; only the level stops breathing.
        const inRelease = TIMING.release > 0 && t > TIMING.duration;
        const relFade = inRelease
            ? Math.max(0, 1 - (t - TIMING.duration) / TIMING.release) : 1;
        const pDyn = inRelease
            ? voiceProgress(vi, nVoices, TIMING.duration, travel, P.dials, order, TIMING)
            : p;
        const base = {
            cents: startCents[vi],
            technique: (P.target && P.target.baseTechnique) || 'ord',
            level: clamp(dynLevel(P.dyn, vi, nVoices, pDyn) * g * relFade, 0.4, 10),
        };
        const moved = modelFn(ctx, vi, p) || {};
        // EDGE TECHNIQUE. The override lives HERE, in stateAt, so the breath
        // callback, the fixed-length lookup, the SWITCH check and the emitted
        // note all agree by construction — there is no second place for them to
        // disagree. The full technique table is available at the edges,
        // including the ones dismissed for the body (singing into the tuba,
        // flutter, bisb): the composer wants them as noise sources here.
        let technique = moved.technique || base.technique;
        if (SH_A && SH_A.technique && aLen > 0 && t < aLen) {
            if (moved.technique) sawM4Override = true;
            technique = SH_A.technique;
        } else if (SH_R && SH_R.technique && rLen > 0 && t >= rStart) {
            if (moved.technique) sawM4Override = true;
            technique = SH_R.technique;
        }
        const cents0 = moved.cents != null ? moved.cents : base.cents;
        return {
            cents: cents0 + motionDev(vi, t, cents0),
            technique: technique,
            level: moved.level != null ? moved.level : base.level,
            p: p,
        };
    }

    for (let vi = 0; vi < nVoices; vi++) {
        const voiceRng = mulberry32(P.seed * 7919 + vi * 104729);
        const segs = buildCarrier(vi, nVoices, P.carrier, voiceRng, function (t) {
            const s = stateAt(vi, t);
            const midi = midiOf(s.cents);
            const tech = feasibleTechnique(s.technique, midi).technique;
            const cls = (TECHNIQUES[tech] || TECHNIQUES.ord).durClass;
            const sMid = stateAt(vi, Math.min(span, t + 1));
            return {
                midi: midi, level01: s.level / 10,
                bending: Math.abs(sMid.cents - s.cents) > 5,
                fixedLen: cls === 'fixed' ? fixedLength(tech, midi, o.sampleLengths) : null,
            };
        }, shapeSched[vi]);

        let prevTech = null;
        segs.forEach(seg => {
            const s0 = stateAt(vi, seg.start);
            const flags = seg.flags.slice();

            // ---- envelopes, NOTE-RELATIVE ----
            // Resolution is ADAPTIVE. A re-key split can only land on a
            // breakpoint, so with a fixed 12 steps a 1200-cent fan moves ~92
            // cents per step and a split can overshoot the bend range by most of
            // that. Sample finely enough that a step is ~25 cents of pitch
            // change; a still chord costs the same 12 steps as before.
            let probeLo = s0.cents, probeHi = s0.cents;
            for (let k = 0; k <= 8; k++) {
                const c = stateAt(vi, Math.min(span, seg.start + (seg.dur * k) / 8)).cents;
                if (c < probeLo) probeLo = c;
                if (c > probeHi) probeHi = c;
            }
            const STEPS = Math.max(12, Math.min(96, Math.ceil((probeHi - probeLo) / 25)));
            const bend = [];
            const level = [];
            let lo = s0.cents, hi = s0.cents;
            for (let k = 0; k <= STEPS; k++) {
                const dt = (seg.dur * k) / STEPS;
                const s = stateAt(vi, Math.min(span, seg.start + dt));
                if (s.cents < lo) lo = s.cents;
                if (s.cents > hi) hi = s.cents;
                bend.push([round3(dt), Math.round((s.cents - s0.cents) * 10) / 10]);
                level.push([round3(dt), Math.round(s.level * 10) / 10]);
            }

            // THE PLAYED KEY IS CENTRED ON THE EXCURSION, not taken from the
            // onset. One note has one key, and bend is +/-2 semitones EITHER
            // WAY — centring uses both halves, so a note that travels 300 cents
            // fits where an onset-anchored key would have needed 300 in one
            // direction and failed.
            //
            // SEGMENTED RE-KEY (plan §8). Beyond +/-2 semitones one note cannot
            // reach, so the note is SPLIT: bend to the edge, re-key, continue.
            // The splits are computed here and emitted as consecutive notes with
            // no gap, so the player slurs across a fingering change — which is
            // what a wide tuba glissando actually is. Anything that still cannot
            // be expressed is flagged, never silently clipped.
            const reachMax = bendReach();
            const spans = [];
            {
                let s = 0, sLo = bend[0][1], sHi = bend[0][1];
                for (let k = 1; k < bend.length; k++) {
                    const c = bend[k][1];
                    const nLo = Math.min(sLo, c), nHi = Math.max(sHi, c);
                    // Widest span a single key can cover, EXACTLY: the key is the
                    // centre rounded to a semitone, and that rounding can shift
                    // the centre by up to 50 cents, so the half-width available
                    // is (reach - 50), not reach. Guessing a fudge factor here
                    // left notes 0.5 cents over the edge.
                    if ((nHi - nLo) > 2 * (reachMax - 50) && k > s + 1) {
                        spans.push([s, k - 1]);
                        // the new span STARTS at the split point and must include
                        // the sample that triggered the split — omitting it let a
                        // span silently exceed the range by one step
                        s = k - 1;
                        sLo = Math.min(bend[s][1], c);
                        sHi = Math.max(bend[s][1], c);
                    } else { sLo = nLo; sHi = nHi; }
                }
                spans.push([s, bend.length - 1]);
            }
            if (spans.length > 1) flags.push('REKEY');
            const playedMidi = Math.round(((lo + hi) / 2) / 100);
            const reach = Math.max(Math.abs(lo - playedMidi * 100), Math.abs(hi - playedMidi * 100));
            if (spans.length === 1 && reach > reachMax + 1e-6) flags.push('GLISS');

            const fe = feasibleTechnique(s0.technique, playedMidi);
            if (fe.flagged) flags.push('RANGE');

            // technique-switch prep: did the previous segment leave enough room?
            const techChanged = !!(prevTech && prevTech !== fe.technique);
            if (techChanged) {
                const need = SWITCH_PREP[fe.technique] || 0;
                const prev = notes[notes.length - 1];
                if (prev && seg.start - (prev.tStart + prev.dur) < need - 1e-6) flags.push('SWITCH');
            }
            prevTech = fe.technique;

            // re-entry "sneak in": every segment after the first enters under a
            // short rise, so the seam is hidden by shape as well as by stagger.
            //
            // A TECHNIQUE CHANGE GETS A LONGER, DEEPER RAMP (composer, after
            // hearing M4: "there has to be some sort of ramp into the technique —
            // if it's singing into the tuba, maybe they do a singing crescendo,
            // start with the effect and ramp into the full effect"). Stepping
            // abruptly read as "a collection of different techniques" rather than
            // one sonority changing colour. A player taking up flutter or sung
            // tone leans into it; the dynamic entry is the only handle MIDI gives
            // us for that, so make it long enough to hear as an approach.
            // NOT DURING THE RELEASE. The sneak-in exists to hide a seam inside a
            // sustained body, where a small dip-and-rise reads as one continuous
            // sound. Inside a fade it does the opposite: the dip floors at 0.4
            // and the rise back to target is a crescendo on every re-entry —
            // which is what the composer heard as "a short attack at the end of
            // the release". A note beginning in the release just starts at its
            // faded level. (Suppressing the RAMP, not the note: players really do
            // re-breathe through a long diminuendo.)
            const inRel = TIMING.release > 0 && seg.start > TIMING.duration;
            if (seg.idx > 0 && !inRel && P.carrier.striation !== 'aligned' && level.length > 2) {
                const target0 = level[0][1];
                const dip = techChanged ? 4.5 : 2.5;
                const riseTo = Math.min(techChanged ? 2.2 : 0.7,
                                        seg.dur * (techChanged ? 0.55 : 0.35));
                level.unshift([0, Math.max(0.4, target0 - dip)]);
                level[1] = [round3(riseTo), target0];
            }

            // Emit one note per span. A single span is the ordinary case and
            // reproduces the previous behaviour exactly.
            spans.forEach((sp, si) => {
                const i0 = sp[0], i1 = sp[1];
                const t0 = bend[i0][0], t1 = bend[i1][0];
                const subDur = Math.max(0.02, t1 - t0);
                // absolute cents across this span -> its own centred key
                let aLo = Infinity, aHi = -Infinity;
                for (let k = i0; k <= i1; k++) {
                    const c = s0.cents + bend[k][1];
                    if (c < aLo) aLo = c;
                    if (c > aHi) aHi = c;
                }
                const key = spans.length === 1 ? playedMidi : Math.round(((aLo + aHi) / 2) / 100);
                const subBend = [];
                for (let k = i0; k <= i1; k++) {
                    subBend.push([round3(bend[k][0] - t0),
                                  Math.round(((s0.cents + bend[k][1]) - key * 100) * 10) / 10]);
                }
                // level slice, re-based; the first span keeps the re-entry ramp
                const subLevel = level
                    .filter(pt => pt[0] >= t0 - 1e-6 && pt[0] <= t1 + 1e-6)
                    .map(pt => [round3(Math.max(0, pt[0] - t0)), pt[1]]);
                if (!subLevel.length || subLevel[0][0] > 0) {
                    subLevel.unshift([0, subLevel.length ? subLevel[0][1] : 5]);
                }
                notes.push({
                    voice: vi,
                    tStart: round3(seg.start + t0),
                    dur: round3(subDur),
                    cents: Math.round((s0.cents + bend[i0][1]) * 10) / 10,
                    midi: key,
                    technique: fe.technique,
                    durClass: (TECHNIQUES[fe.technique] || TECHNIQUES.ord).durClass,
                    level: subLevel,
                    bend: subBend,
                    flags: si === 0 ? flags : flags.filter(f => f !== 'BREATH'),
                });
            });
        });
    }

    // ---- the attack's extra layers (§5.3, §5.4) ---------------------------
    // A flat-level, no-bend one-shot. Both layers are ORDINARY render notes, so
    // they flow through toScoreObjects, insert, audit and playback like
    // everything else — no special case anywhere downstream.
    function edgeNote(voice, tStart, dur, midi, technique, level, flags) {
        return {
            voice: voice, tStart: round3(tStart), dur: round3(dur),
            cents: midi * 100, midi: midi, technique: technique,
            durClass: (TECHNIQUES[technique] || TECHNIQUES.ord).durClass,
            level: [[0, Math.round(level * 10) / 10], [round3(dur), Math.round(level * 10) / 10]],
            bend: [[0, 0], [round3(dur), 0]],
            flags: flags,
        };
    }

    const noiseLanes = [];
    if (SH) {
        transientPlan.forEach((tp, vi) => {
            if (!tp) return;
            const flags = [];
            if (tp.flagged) flags.push('RANGE');
            // A one-shot that rings past the window it was written for: the
            // sample decides its own length (D9), so this is reported, never
            // shortened.
            if (tp.tStart + tp.dur > aLen + 1e-6) flags.push('EDGE_RING');
            notes.push(edgeNote(vi, tp.tStart, tp.dur, tp.midi, tp.technique,
                stateAt(vi, tp.tStart).level, flags));
        });

        // NOISE LAYER — spare players, SIMULTANEOUS with the entering morph
        // voices. This is the true "add some cuivre whether it's in the chord or
        // not": it is the only way to stack a hit AND a tone at the same instant,
        // because it uses different players.
        const NZ = SH_A && SH_A.noise;
        if (NZ) {
            const morphLanes = P.lanes || Array.from({ length: nVoices }, (_, i) => i);
            const maxLanes = o.maxVoices || 10;
            const spare = [];
            for (let l = 0; l < maxLanes; l++) if (morphLanes.indexOf(l) < 0) spare.push(l);
            const n = Math.min(NZ.voices, spare.length);
            // NEVER STOLEN FROM THE MORPH, never silent about it (2r's rule).
            if (n < NZ.voices) {
                warnings.push('NOISE: wanted ' + NZ.voices + ' voices, ' + spare.length +
                              ' spare lane(s) — rendered ' + n);
            }
            const pitches = Array.isArray(NZ.midi) ? NZ.midi
                : NZ.midi === 'chord' ? startMidi
                : startMidi.slice().reverse();               // chord-top
            const lvl = clamp(dynLevel(P.dyn, 0, nVoices, 0) * shapeGain(SH, 0, span, null), 0.4, 10);
            let warnedLen = false;
            for (let k = 0; k < n; k++) {
                const midi = Math.round(pitches[k % pitches.length]);
                const fe = feasibleTechnique(NZ.technique, midi);
                const cls = (TECHNIQUES[fe.technique] || TECHNIQUES.ord).durClass;
                let dur;
                if (cls === 'fixed') {
                    dur = fixedLength(fe.technique, midi, o.sampleLengths) ||
                          FIXED_LEN_DEFAULT[fe.technique] || 0.45;
                    if (NZ.len != null && !warnedLen) {
                        warnedLen = true;
                        warnings.push('NOISE: "' + fe.technique + '" is a fixed one-shot (D9) — ' +
                                      'its sample length wins and "len" is ignored');
                    }
                } else {
                    dur = NZ.len != null ? NZ.len : Math.max(0.5, aLen);
                }
                const flags = [];
                if (fe.flagged) flags.push('RANGE');
                if (dur > Math.max(aLen, 0.001) + 1e-6) flags.push('EDGE_RING');
                noiseLanes.push(spare[k]);
                notes.push(edgeNote(nVoices + k, 0, Math.min(dur, span), midi,
                    fe.technique, lvl, flags));
            }
            shapeInfo.noise = n;
        }
        if (sawM4Override) {
            warnings.push('SHAPE_OVER_M4: an edge technique overrides the model inside its ' +
                          "window — the window wins, and the model's path resumes after it");
        }
    }

    notes.sort((a, b) => a.tStart - b.tStart || a.voice - b.voice);

    // Onsets that a designed attack is SUPPOSED to align (see the SEAM rule).
    const seamExempt = new Set();
    if (SH) {
        // the noise layer is aligned WITH the attack on purpose, always
        notes.forEach(n => { if (n.voice >= nVoices) seamExempt.add(n); });
        if (shapeInfo.entryTogether) {
            const aEnd = Math.max(shapeInfo.attackEnd, CROSS_ONSET_MIN);
            notes.forEach(n => { if (n.tStart <= aEnd + 1e-6) seamExempt.add(n); });
        }
    }

    // ---- checks -----------------------------------------------------------
    const summary = { hard: 0, soft: {}, flags: {} };
    const bump = (bag, k) => { bag[k] = (bag[k] || 0) + 1; };
    notes.forEach(n => n.flags.forEach(f => bump(summary.flags, f)));

    // Voices map 1:1 to players, so double-booking WITHIN a morph is structurally
    // impossible — but a carrier bug could still produce it, so assert rather
    // than assume. Conflicts with existing score material are 2r's job at insert.
    const byVoice = {};
    notes.forEach(n => { (byVoice[n.voice] = byVoice[n.voice] || []).push(n); });
    Object.keys(byVoice).forEach(v => {
        const list = byVoice[v];
        for (let i = 1; i < list.length; i++) {
            const a = list[i - 1], b = list[i];
            if (b.tStart < a.tStart + a.dur - 1e-6) { summary.hard++; b.flags.push('OVERLAP'); }
            else {
                const gap = b.tStart - a.tStart;
                if (gap < requiredAttackGap(a.midi, b.midi) + RATE.tongueReset - 1e-6) {
                    b.flags.push('RATE'); bump(summary.soft, 'RATE');
                }
            }
        }
    });

    // cross-voice onset rule — the stagger is what hides the seam.
    //
    // A DESIGNED ATTACK IS EXEMPT. Aligned onsets are the whole point of
    // `entry: together` and of the noise layer, so flagging them would throw ten
    // SEAM flags on every render of a working design and train the composer to
    // ignore the badge — worse than having no check at all (§6). The existing
    // striation === 'aligned' exemption is the same idea, already agreed.
    if (P.carrier.striation !== 'aligned') {
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].voice === notes[i - 1].voice) continue;
            if (seamExempt.has(notes[i]) || seamExempt.has(notes[i - 1])) continue;
            if (Math.abs(notes[i].tStart - notes[i - 1].tStart) < CROSS_ONSET_MIN) {
                notes[i].flags.push('SEAM'); bump(summary.soft, 'SEAM');
            }
        }
    }
    ['BREATH', 'SWITCH', 'RANGE', 'GLISS', 'EDGE_RING'].forEach(f => {
        if (summary.flags[f]) summary.soft[f] = summary.flags[f];
    });
    // SHAPE_CLAMP has no note to live on — it is a params-level condition — but
    // it is a soft flag so that it shows in the badge count, not only in the
    // warning list where it could scroll away.
    if (SH && SH._clamped) summary.soft.SHAPE_CLAMP = 1;

    const meta = {
        model: P.model, seed: P.seed, span: span, voices: nVoices,
        // The noise layer's lanes ride on the end, so toScoreObjects maps its
        // notes onto real players with no special case.
        lanes: (P.lanes || Array.from({ length: nVoices }, (_, i) => i)).concat(noiseLanes),
        droppedFrom: rawMidi.length,
        label: P.label, striation: P.carrier.striation,
        bendRangeSt: MEASURED.BEND_RANGE_ST, prearmS: MEASURED.BEND_PREARM_S,
    };
    // CYCLING FIELDS ARE CONDITIONAL, for the same reason `shape` is: `meta` is
    // inside the fixture hash, so adding keys unconditionally would break every
    // blessed render and make the byte-identity gate report a regression that is
    // not one. `span` above keeps meaning the gliss length, unchanged.
    // `extended`, not `cycling` — a release-only render is longer than its span
    // too, and the length is what the composer needs in order to place it.
    if (TIMING.extended) {
        meta.duration = round3(TIMING.duration);
        meta.release = round3(TIMING.release);
        // What the composer actually needs to place this in the score: the real
        // end, which "let them finish" makes unpredictable by up to a breath.
        meta.totalLength = round3(notes.reduce((a, n) => Math.max(a, n.tStart + n.dur), 0));
    }
    // Only present when a shape is — meta must stay byte-identical without one.
    if (SH) {
        meta.shape = {
            entry: SH.attack ? SH.attack.entry : 'together',
            exit: SH.release ? SH.release.exit : null,
            attackLen: SH.attack ? SH.attack.len : 0,
            decayLen: SH.decay ? SH.decay.len : 0,
            releaseLen: SH.release ? SH.release.len : 0,
            dropped: shapeInfo.dropped.slice(),
            noiseVoices: shapeInfo.noise,
        };
    }

    return { notes: notes, summary: summary, warnings: warnings, meta: meta };
}

// ===========================================================================
// 7 · SCORE CONVERSION — a morph note becomes an ordinary waveCurve.
//     Kept here (pure) so both the panel preview and the insert path use one
//     conversion and cannot drift apart.
// ===========================================================================

function toScoreObjects(result, at, opts) {
    const o = opts || {};
    const color = o.color || '#7E57C2';
    const groupId = o.groupId || 'grp-morph-01';
    let nid = o.startId || 1;
    // Lane mapping follows the render's own `meta.lanes`, so a morph told to
    // occupy players 5-8 inserts onto those lanes rather than 0-3.
    const lanes = (result.meta && result.meta.lanes) || null;
    const lane = o.laneOf || (v => (lanes && lanes[v] != null) ? lanes[v] : v);
    return result.notes.map(n => {
        const dur = Math.max(0.02, n.dur);
        const nodes = n.level.map(pt => ({
            pos: clamp(round3(pt[0] / dur), 0, 1),
            y: clamp(pt[1], 0, 10),
            smooth: 0.25,
        }));
        // strictly increasing pos, else the renderer's segment lookup misbehaves
        for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].pos <= nodes[i - 1].pos) nodes[i].pos = Math.min(1, nodes[i - 1].pos + 1e-3);
        }
        // BEND IS ALREADY RELATIVE TO THE PLAYED KEY. n.cents can sit anywhere
        // between keys (a spectral partial, a detune, an attack motion) and
        // n.midi is that rounded to a playable key — but the render loop
        // already subtracts the key when it builds `bend`
        // (subBend = (s0.cents + bend) - key*100), so the residual is IN there.
        //
        // It used to be added a SECOND time here, which played every off-key
        // note sharp or flat by exactly its own residual — up to 40.2 cents,
        // measured on a stock M2 spectral render (2026-08-16, found during 2z
        // G4). It went unseen because tools/morph_probe.js computed its expected
        // pitch with the same double-add, so the day-10 "spectral targets within
        // 0.4 c" measurement verified the MIDI-to-audio chain and could not have
        // caught the engine-to-MIDI step. morph_emit.js had the identical bug.
        //
        // THE INVARIANT, now asserted in test_morph: sounding cents at any
        // breakpoint === n.midi * 100 + n.bend[k][1], in the engine, in the
        // score object, and in the emitted MIDI. One convention, three places.
        const bend = n.bend.map(pt => [pt[0], pt[1]]);
        return {
            id: 'wc-' + (nid++),
            type: 'waveCurve',
            layer: lane(n.voice),
            groupId: groupId,
            startSeconds: round3(at + n.tStart),
            endSeconds: round3(at + n.tStart + dur),
            nodes: nodes,
            segments: nodes.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
            color: color,
            fillMode: 'bottom',
            opacity: 0.55,
            performanceNotes: (o.label || 'MORPH') + ' ' + n.technique,
            properties: {},
            sonifyNote: n.midi,
            technique: n.technique,
            morphBend: bend,            // the one genuinely new field
            morphFlags: n.flags.length ? n.flags.slice() : undefined,
        };
    });
}

return {
    MEASURED: MEASURED, RATE: RATE, TECHNIQUES: TECHNIQUES, DEFAULTS: DEFAULTS,
    BREATH_TABLE: BREATH_TABLE, SWITCH_PREP: SWITCH_PREP, STRIATIONS: STRIATIONS,
    DYN_SHAPES: DYN_SHAPES, dynLevel: dynLevel,
    ENTRY_MODES: ENTRY_MODES, EXIT_MODES: EXIT_MODES, ORDER_MODES: ORDER_MODES,
    SHAPE_CURVES: SHAPE_CURVES, ATTACK_MOTIONS: ATTACK_MOTIONS,
    RELEASE_MOTIONS: RELEASE_MOTIONS,
    curveEase: curveEase, normaliseShape: normaliseShape, shapeGain: shapeGain,
    shapeRank: shapeRank, dropoutVoices: dropoutVoices,
    PARAM_PATHS: PARAM_PATHS, paramPathType: paramPathType,
    getParamPath: getParamPath, setParamPath: setParamPath,
    applyRecipe: applyRecipe, resolveParams: resolveParams,
    BREATH_GAP_MIN: BREATH_GAP_MIN, CROSS_ONSET_MIN: CROSS_ONSET_MIN,
    mulberry32: mulberry32,
    bendValue: bendValue, bendBytes: bendBytes, bendReach: bendReach,
    maxBreath: maxBreath, requiredAttackGap: requiredAttackGap,
    fixedLength: fixedLength, feasibleTechnique: feasibleTechnique,
    applyBias: applyBias, staggerOrder: staggerOrder, voiceProgress: voiceProgress,
    partialCents: partialCents, MODELS: MODELS,
    normaliseParams: normaliseParams, unknownKeys: unknownKeys,
    render: render, toScoreObjects: toScoreObjects,
};
}));
