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
    carrier: { span: 30, segLen: 8, segVar: 0.35, striation: 'staggered' },
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

function voiceProgress(voiceIdx, nVoices, t, span, dials, order) {
    const u = span > 0 ? clamp(t / span, 0, 1) : 1;
    const k = nVoices > 1 ? order[voiceIdx] / (nVoices - 1) : 0;
    const w = clamp(dials.spread, 0, 1) * 0.8;   // stagger uses at most 80% of the span
    const start = k * w;
    const run = Math.max(1e-6, 1 - w);
    const p = clamp((u - start) / run, 0, 1);
    return applyBias(p, dials.bias) * clamp(dials.depth, 0, 1);
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
function buildCarrier(vi, nVoices, carrier, seedRng, ctxForBreath) {
    const span = Math.max(0.01, carrier.span);
    const segLen = Math.max(0.05, carrier.segLen);
    const segVar = clamp(carrier.segVar, 0, 1);
    const pattern = STRIATIONS.indexOf(carrier.striation) >= 0 ? carrier.striation : 'staggered';
    const segs = [];
    let t = 0;
    let idx = 0;

    // Offset the FIRST segment so voices do not all re-attack together.
    const phase0 = striationPhase(pattern, vi, nVoices, 0, seedRng);
    t = -phase0 * segLen * 0.5;

    while (t < span && segs.length < 512) {
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

        let dur = Math.min(want, span - start);
        if (dur <= 0.02) break;

        const gapBase = Math.max(BREATH_GAP_MIN, MEASURED.RESET_GAP_S);
        const gapJit = 1 + (seedRng() * 2 - 1) * segVar * 0.5;
        let gap = gapBase * gapJit;
        if (gap < BREATH_GAP_FLOOR) { gap = BREATH_GAP_FLOOR; flags.push('BREATH'); }

        segs.push({ idx: idx++, start: round3(start), dur: round3(dur), flags: flags });
        t = start + dur + gap;
    }
    return segs;
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
    return {
        model: model,
        source: p.source || { kind: 'pitches', midi: [34, 41, 46, 50, 53, 58, 62, 65] },
        target: p.target || null,
        dials: Object.assign({}, DEFAULTS.dials, p.dials),
        carrier: Object.assign({}, DEFAULTS.carrier, p.carrier),
        dyn: dyn,
        seed: p.seed != null ? p.seed : DEFAULTS.seed,
        label: p.label || '',
    };
}

// Unknown keys are REPORTED, never silently ignored — a typo'd dial that does
// nothing is worse than one that errors (plan §4.1).
const KNOWN_KEYS = ['model', 'source', 'target', 'dials', 'carrier', 'dyn', 'seed', 'label'];
function unknownKeys(v) {
    return Object.keys(v || {}).filter(k => KNOWN_KEYS.indexOf(k) < 0 && k[0] !== '_');
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
    const startMidi = resolveSource(P.source, o.resolveVert).slice().sort((a, b) => a - b);
    const nVoices = Math.min(startMidi.length, o.maxVoices || 10);
    const notes = [];
    const warnings = unknownKeys(params).map(k => 'PARAM: unrecognised key "' + k + '"');

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
    const span = P.carrier.span;

    // state of one voice at time t — the MORPH half, independent of the carrier
    function stateAt(vi, t) {
        const p = voiceProgress(vi, nVoices, t, span, P.dials, order);
        const base = {
            cents: startCents[vi],
            technique: (P.target && P.target.baseTechnique) || 'ord',
            level: dynLevel(P.dyn, vi, nVoices, p),   // the layer — every model
        };
        const moved = modelFn(ctx, vi, p) || {};
        return {
            cents: moved.cents != null ? moved.cents : base.cents,
            technique: moved.technique || base.technique,
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
        });

        let prevTech = null;
        segs.forEach(seg => {
            const s0 = stateAt(vi, seg.start);
            const flags = seg.flags.slice();

            // ---- envelopes, NOTE-RELATIVE ----
            const STEPS = 12;
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
            const playedMidi = Math.round(((lo + hi) / 2) / 100);
            const reach = Math.max(Math.abs(lo - playedMidi * 100), Math.abs(hi - playedMidi * 100));
            // Beyond that, the note must be re-keyed under the seam (plan §8's
            // segmented strategy, scheduled for Phase 3 with M3). Flagged, never
            // silently clipped.
            if (reach > bendReach() + 1e-6) flags.push('GLISS');

            const fe = feasibleTechnique(s0.technique, playedMidi);
            if (fe.flagged) flags.push('RANGE');

            // technique-switch prep: did the previous segment leave enough room?
            if (prevTech && prevTech !== fe.technique) {
                const need = SWITCH_PREP[fe.technique] || 0;
                const prev = notes[notes.length - 1];
                if (prev && seg.start - (prev.tStart + prev.dur) < need - 1e-6) flags.push('SWITCH');
            }
            prevTech = fe.technique;

            // re-entry "sneak in": every segment after the first enters under a
            // short rise, so the seam is hidden by shape as well as by stagger.
            if (seg.idx > 0 && P.carrier.striation !== 'aligned' && level.length > 2) {
                const target0 = level[0][1];
                const riseTo = Math.min(0.7, seg.dur * 0.35);
                level.unshift([0, Math.max(0.4, target0 - 2.5)]);
                level[1] = [round3(riseTo), target0];
            }

            notes.push({
                voice: vi,
                tStart: round3(seg.start),
                dur: round3(seg.dur),
                cents: Math.round(s0.cents * 10) / 10,
                midi: playedMidi,
                technique: fe.technique,
                durClass: (TECHNIQUES[fe.technique] || TECHNIQUES.ord).durClass,
                level: level,
                bend: bend,
                flags: flags,
            });
        });
    }

    notes.sort((a, b) => a.tStart - b.tStart || a.voice - b.voice);

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

    // cross-voice onset rule — the stagger is what hides the seam
    if (P.carrier.striation !== 'aligned') {
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].voice === notes[i - 1].voice) continue;
            if (Math.abs(notes[i].tStart - notes[i - 1].tStart) < CROSS_ONSET_MIN) {
                notes[i].flags.push('SEAM'); bump(summary.soft, 'SEAM');
            }
        }
    }
    ['BREATH', 'SWITCH', 'RANGE', 'GLISS'].forEach(f => {
        if (summary.flags[f]) summary.soft[f] = summary.flags[f];
    });

    return {
        notes: notes, summary: summary, warnings: warnings,
        meta: {
            model: P.model, seed: P.seed, span: span, voices: nVoices,
            label: P.label, striation: P.carrier.striation,
            bendRangeSt: MEASURED.BEND_RANGE_ST, prearmS: MEASURED.BEND_PREARM_S,
        },
    };
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
    const lane = o.laneOf || (v => v);
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
        // BEND IS STORED RELATIVE TO THE PLAYED KEY, not to the note's exact
        // cents. n.cents can sit anywhere between keys (a spectral partial, a
        // detune), and n.midi is that rounded to a playable key — so the
        // residual (cents - key*100) is a real, permanent part of the bend. Fold
        // it in here, once, and playback can send morphBend verbatim. Leaving it
        // out would play every microtonal target at the nearest semitone and the
        // error would be invisible in the score.
        const residual = n.cents - n.midi * 100;
        const bend = n.bend.map(pt => [pt[0], Math.round((pt[1] + residual) * 10) / 10]);
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
