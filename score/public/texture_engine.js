// texture_engine.js — PLAN 2x, the attack-field texture engine.
//
// PURE. No DOM, no MIDI, no fetch, no fs, no Date, no Math.random. Loads in the
// browser (window.Texture) and in node (module.exports) from the same file —
// the morph.js pattern, and what makes tools/test_texture.js possible and cheap.
//
// This is an EXTRACTION of the generator that produced the 13 phase-shifting
// experiments (docs/PHASE_SHIFTING.md), not a rewrite. tools/phase_shift.js kept
// the whole thing — onset models, hocketed voices, scatter, jitter, spread,
// clamping, markers — tangled with fs reads, score writing and console output.
// The pure half moves here; the CLI keeps the impure half and the presets.
//
// THE REGRESSION CONTRACT: given a resolved spec, `generate()` returns an
// `objects` array byte-identical to what buildScore() produced. Nine committed
// research scores are the corpus (tools/test_texture.js). Every rounding call —
// toFixed(4) on onsets and note bounds, toFixed(3) on a clamped length,
// toFixed(2) on marker times — is part of that contract. Do not "clean up" one.
//
// D29: ATTACK FIELDS ONLY. No pitch bend anywhere in this engine; bend-based
// work is PLAN 2v's (score/public/morph.js). The two layer in the score.
//
// ---------------------------------------------------------------------------
// TWO SPEC DIALECTS, ONE GENERATOR
//
//   RESOLVED  what the presets emit and what generate() consumes. A voice is a
//             lane list + one composite pulse; per-player offsets are expressed
//             as separate one-player voices. Verbose, fully explicit, frozen by
//             the byte-identity gate.
//   PANEL     what the composer's dials and bank/texture_params.json speak
//             (plan §4.1): players / scatter / jitter / articulation / pitch.
//
// normaliseSpec() lifts PANEL into RESOLVED. RESOLVED passes through untouched,
// which is why the presets still reproduce byte-for-byte. One generator, no
// branch inside it — the dialect difference is resolved before it is reached.
// ---------------------------------------------------------------------------

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Texture = api;
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => (m == null ? '?' : NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1));
const r2 = x => +x.toFixed(2);

const COLORS = ['#3F7D5A', '#8E4585', '#B08A2E', '#4E7A9B'];
const MARK_COL = '#7A7A7A';

// The perceptual ladder one sweep traverses, in ms of offset. PREDICTED —
// the sweep experiments exist to replace these. docs/PHASE_SHIFTING.md §4.
const THRESHOLDS_MS = [10, 20, 30, 50, 80, 120, 160, 200, 250, 300, 400, 500];

// D17 playability constants — the SAME numbers as tools/audit_playability.js and
// Composer.CONFLICT. Reused, never re-typed; if one moves, all three move.
const D17 = {
    META_LAYER: 10,
    TONGUE_RESET: 0.03,
    MIN_ATTACK: 0.11,
    PER_SEMITONE: 0.0093,
    MAX_LEAP_ADD: 0.22,
};
D17.WINDOW = D17.MIN_ATTACK + D17.MAX_LEAP_ADD;

// Research-measured soft rails (docs/PHASE_SHIFTING.md §5). The panel marks a
// value amber outside these and renders anyway — never blocks (D16 spirit).
const RAILS = {
    density: [1, 23],       // composite attacks/s; ceiling = 10 players / 0.42 s ring
    jitterMs: [0, 60],
    scatter: [0, 1],
    spreadBpm: [0, 6],
    players: [1, 10],
};

// ===========================================================================
// PRNG — the LCG the research used. Seeded, portable, identical in node and the
// browser. `>>> 0` keeps it in uint32 so the stream cannot drift between hosts.
// ===========================================================================
function lcg(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
// centred on 0, range [-0.5, 0.5) — the form every existing call site uses
function lcgC(seed) { const r = lcg(seed); return () => r() - 0.5; }

// ===========================================================================
// SAMPLE PHYSICS
// ===========================================================================
// Measured one-shot lengths (D9, bank/sample_lengths.json) are INJECTED — node
// reads the file, the panel hands over the app's copy. Nothing here hardcodes
// 0.42 s, so if the note-off-truncation probe (2n/2o) ever changes the table,
// every consumer follows for free.
function ringLength(sampleLengths, tech, pitch) {
    const tbl = sampleLengths && sampleLengths[tech];
    if (!tbl) return null;                                    // ord, flz: variable
    if (tbl[pitch] != null) return tbl[pitch];
    const keys = Object.keys(tbl).map(Number);
    return tbl[keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a)];
}

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

// ============================== METRICS ==============================
// The two numbers the research calibrated by ear, computed here so the engine,
// the panel status line and the tests all read the same scale.
//
//   sd          standard deviation of COMPOSITE inter-attack intervals, in ms.
//               The evenness axis. MEASURED calibration (phase07):
//               scatter 0 -> 0.1 ms · 0.03 -> 6.4 · 0.08 -> 21.5 · 0.2 -> 32.6 ·
//               1.0 -> 46.2.
//
//   unevenness  how unevenly the players sit INSIDE one cycle, as the
//               coefficient of variation of the circular gaps between their mean
//               cycle positions. This is the dial that separates a texture from a
//               figure, and it is the whole scatter-vs-jitter distinction:
//                 SCATTER  a player's offset is FIXED, so its cycle position
//                          persists -> the gaps stay uneven -> high.
//                 JITTER   the offset is redrawn every attack, so each player's
//                          position averages back to its even slot -> low, no
//                          matter how large the jitter.
//               0 = evenly spread through the cycle · ~1 = randomly placed ·
//               >1 = clumped.
//
// The PAIR is the classifier the vocabulary needs:
//   smear   sd low,  unevenness low     even, and no figure
//   rain    sd high, unevenness low     irregular, and NOTHING repeats
//   groove  sd high, unevenness high    irregular, and it repeats every cycle
// ============================== ==================== ==============================
function sdOf(values) {
    if (values.length < 2) return 0;
    const m = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((a, b) => a + (b - m) * (b - m), 0) / values.length);
}

// circular mean of positions given as fractions of a cycle, returned in [0,1)
function circularMean(fracs) {
    let x = 0, y = 0;
    for (const f of fracs) { const a = 2 * Math.PI * f; x += Math.cos(a); y += Math.sin(a); }
    if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) return 0;
    return ((Math.atan2(y, x) / (2 * Math.PI)) % 1 + 1) % 1;
}

// `events`: [{t, lane}] within one section, t relative to section start.
// `period`: the reference cycle in seconds (a PLAYER's period, not the composite).
function metricsOf(events, period) {
    const times = events.map(e => e.t).slice().sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
    const sd = sdOf(gaps) * 1000;                              // ms

    // per-player mean cycle position
    const byLane = new Map();
    for (const e of events) {
        if (!byLane.has(e.lane)) byLane.set(e.lane, []);
        byLane.get(e.lane).push(((e.t / period) % 1 + 1) % 1);
    }
    const means = [...byLane.keys()].sort((a, b) => a - b)
        .map(k => circularMean(byLane.get(k)))
        .sort((a, b) => a - b);
    let unevenness = 0;
    if (means.length > 1) {
        const cg = [];
        for (let i = 1; i < means.length; i++) cg.push(means[i] - means[i - 1]);
        cg.push(1 - means[means.length - 1] + means[0]);       // wrap-around gap
        unevenness = sdOf(cg) * means.length;                  // mean gap is 1/n
    }
    return {
        n: times.length,
        sd: +sd.toFixed(2),
        unevenness: +unevenness.toFixed(3),
        period: +period.toFixed(4),
        players: means.length,
    };
}

// ============================== PLAYABILITY ==============================
// D17 verbatim. HARD = two notes sounding at once on one player (physics).
// SOFT = a real gap too short to re-tongue or leap (estimates). Same law as
// tools/audit_playability.js and Composer.CONFLICT — one law, three consumers.
function requiredAttack(prev, next) {
    const leap = Math.abs((next.sonifyNote || 0) - (prev.sonifyNote || 0));
    return D17.MIN_ATTACK + Math.min(D17.MAX_LEAP_ADD, leap * D17.PER_SEMITONE);
}
function pairTier(a, b) {
    if (b.startSeconds < a.endSeconds - 1e-6) return 'hard';
    if (b.startSeconds - a.endSeconds < D17.TONGUE_RESET - 1e-6) return 'soft';
    return (b.startSeconds - a.startSeconds) < requiredAttack(a, b) - 1e-6 ? 'soft' : 'free';
}
function playability(objects) {
    const lanes = new Map();
    for (const o of objects) {
        if (!o || o.type !== 'waveCurve' || o.sonifyNote == null) continue;
        if (!(o.layer >= 0 && o.layer < D17.META_LAYER)) continue;
        if (o.startSeconds == null || o.endSeconds == null) continue;
        if (!lanes.has(o.layer)) lanes.set(o.layer, []);
        lanes.get(o.layer).push(o);
    }
    const pairs = [];
    for (const [layer, list] of lanes) {
        list.sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds);
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i], b = list[j];
                if (b.startSeconds - a.endSeconds > D17.WINDOW) break;
                const tier = pairTier(a, b);
                if (tier === 'free') continue;
                pairs.push({
                    tier, layer, at: a.startSeconds,
                    gap: +(b.startSeconds - a.endSeconds).toFixed(3),
                    attack: +(b.startSeconds - a.startSeconds).toFixed(3),
                    need: +requiredAttack(a, b).toFixed(3),
                    a: pn(a.sonifyNote) + ' ' + (a.technique || '?'),
                    b: pn(b.sonifyNote) + ' ' + (b.technique || '?'),
                    overlapBy: +(a.endSeconds - b.startSeconds).toFixed(3),
                });
            }
        }
    }
    return {
        hard: pairs.filter(p => p.tier === 'hard').length,
        soft: pairs.filter(p => p.tier === 'soft').length,
        pairs,
    };
}

// ============================== NORMALISE ==============================
// PANEL dialect -> RESOLVED dialect. Unknown keys are COLLECTED, never thrown
// and never silently dropped (the 2v rule): a typo shows up in the panel status
// line instead of quietly doing nothing.

const SPEC_KEYS = ['name', 'seed', 'sections', 't0', 'gap', 'notelen', 'midi', 'humanize'];
const SECTION_KEYS = ['dur', 'label', 'tag', 'voices', 'model', 'bpm', 'stages',
    'lap', 'dBpm', 'markLaps'];
const VOICE_KEYS = ['players', 'lanes', 'bpm', 'bpmEnd', 'rampFrom', 'articulation',
    'tech', 'notelen', 'scatter', 'jitterMs', 'level', 'pitch', 'delay', 'phase',
    'curves', 'ci'];

function unknownKeys(spec) {
    const out = [];
    const scan = (obj, known, where) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) if (known.indexOf(k) < 0) out.push(where + '.' + k);
    };
    scan(spec, SPEC_KEYS, 'spec');
    (spec.sections || []).forEach((sec, si) => {
        scan(sec, SECTION_KEYS, 'section[' + si + ']');
        (sec.voices || []).forEach((v, vi) => scan(v, VOICE_KEYS, 'section[' + si + '].voice[' + vi + ']'));
    });
    return out;
}

// A voice is in PANEL dialect if it names `players` (a count) rather than
// `lanes` (an explicit list). Everything else is carried through as written.
function isPanelVoice(v) { return v.players != null && v.lanes == null; }

// Lane assignment, pre-decided (plan §4.1): voice groups take CONTIGUOUS lane
// blocks in listed order — group 0 gets lanes 0..players-1, group 1 the next
// block. An explicit `lanes` array overrides. This reproduces the
// LANES_A = [0..4] / LANES_B = [5..9] convention every existing preset uses.
function assignLanes(voices, maxLanes) {
    let next = 0;
    return voices.map(v => {
        if (v.lanes) return v.lanes.slice();
        const n = Math.max(1, Math.min(v.players || 1, maxLanes - next));
        const lanes = [];
        for (let i = 0; i < n; i++) lanes.push((next + i) % maxLanes);
        next += n;
        return lanes;
    });
}

// ============================== PITCH LAYER (§8) ==============================
// The biggest hole in the research: the whole rain/gallop map was made with ten
// players on ONE C3. This imposes pitch over the generated attacks, deliberately
// under-systematised — the composer's stated preference is "impose pitch sets and
// let the chips fall where they may". No voice-leading, no progressions.
//
// THE SET IS INJECTED, NOT IMPORTED. `pitch.set` is either a literal MIDI array
// or a NAME resolved through `opts.tonality` (score/public/tonality.js). Same
// injection pattern as sampleLengths, so this file keeps zero dependencies and
// stays loadable anywhere. A name given with no tonality module resolves to
// null and is REPORTED — never silently rendered at the root pitch, which would
// look like the set had been applied.
//
// PHYSICS FOLLOWS PITCH (the 2u trap): a fixed one-shot's ring length depends on
// its pitch (staccato 0.33-0.53 s) and the soft rule is leap-dependent, so a
// remap can create real conflicts that the mock-up plays perfectly cleanly.
// Every consumer must recompute the badge when the set changes.
const PITCH_POLICIES = ['unison', 'perVoice', 'draw', 'cycle'];

function resolveSet(pspec, tonality) {
    if (!pspec) return { set: null, unresolved: null };
    const s = pspec.set;
    if (!s) return { set: null, unresolved: null };
    if (Array.isArray(s)) return { set: s.slice().sort((a, b) => a - b), unresolved: null };
    if (tonality && typeof tonality.setNamed === 'function') {
        const got = tonality.setNamed(s, pspec.chords || null);
        if (got && got.length) {
            // POOLED spreads the set's pitch CLASSES over the whole range so
            // register and contour survive; LITERAL uses exactly those notes.
            const pooled = (pspec.pool !== false && typeof tonality.pcsPool === 'function')
                ? tonality.pcsPool([...new Set(got.map(q => ((q % 12) + 12) % 12))])
                : got;
            return { set: pooled.slice().sort((a, b) => a - b), unresolved: null };
        }
    }
    return { set: null, unresolved: String(s) };
}

// perVoice: each player holds ONE pitch, register-sorted across the group.
// Convention copied from Composer.assignBlast, not re-derived — its comment is
// explicit that the stage reads "lowest = Tuba 10", i.e. ideal lane
// (META_LAYER-1)-i for ascending pitches. So within a group the LAST player gets
// the LOWEST pitch. When the set is wider than the group, the players are spread
// across the whole set rather than taking its bottom n, so the voicing keeps the
// set's registral width.
function perVoicePitch(set, j, n) {
    if (!set || !set.length) return null;
    const rank = (n - 1) - j;                       // lowest pitch to the highest lane
    const idx = (n <= 1) ? 0 : Math.round(rank * (set.length - 1) / (n - 1));
    return set[Math.max(0, Math.min(set.length - 1, idx))];
}

// PANEL -> RESOLVED for one voice group.
//
// A panel voice group is expanded into ONE ONE-PLAYER VOICE PER PLAYER. That is
// what makes `scatter` expressible at all — scatter is a FIXED PER-PLAYER offset
// inside the cycle, and the resolved dialect carries one offset per voice. It is
// also the truer jitter model: each player then jitters around its own slot,
// where a hocketed group jitters the composite and re-sorts, which can hand an
// attack to a different player. Expanding always (scatter 0 included) keeps one
// code path — at scatter 0 the offsets are exactly j/n of the cycle, i.e. the
// even interleave the hocketed form produces.
function expandVoice(v, lanes, groupIndex, rnd, opts) {
    const n = lanes.length;
    const T = 60 / (v.bpm || 100);                 // one PLAYER's period
    const sc = v.scatter || 0;
    const u = [];
    for (let j = 0; j < n; j++) u.push(rnd());     // one draw per player, always

    const pspec = (v.pitch && typeof v.pitch === 'object') ? v.pitch : null;
    const root = pspec ? (pspec.root != null ? pspec.root : 48)
                       : (typeof v.pitch === 'number' ? v.pitch : 48);
    const rs = resolveSet(pspec, opts && opts.tonality);
    const policy = pspec ? (pspec.policy || 'unison') : 'unison';

    const out = [];
    for (let j = 0; j < n; j++) {
        // unison and perVoice are per-voice CONSTANTS, so they resolve here and
        // ride the existing scalar-pitch path — no per-attack machinery, and the
        // byte-identity corpus is untouched. Only draw/cycle need per-attack
        // resolution, and they carry their set through to generate().
        let pitch = root;
        if (rs.set && policy === 'perVoice') pitch = perVoicePitch(rs.set, j, n);
        out.push({
            lanes: [lanes[j]],
            pitch: pitch,
            tech: v.articulation || v.tech || 'staccato',
            bpm: v.bpm,
            bpmEnd: v.bpmEnd != null ? v.bpmEnd : undefined,
            rampFrom: v.rampFrom,
            notelen: v.notelen,
            level: v.level,
            jitterMs: v.jitterMs,
            delay: ((j / n + sc * u[j] + 1) % 1) * T,
            ci: groupIndex,                        // colour follows the GROUP
            pitchSet: (rs.set && (policy === 'draw' || policy === 'cycle')) ? rs.set : null,
            pitchPolicy: policy,
            pitchNoRepeat: pspec ? pspec.noRepeat !== false : true,
            pitchIndex: j,
            unresolvedSet: rs.unresolved,
        });
    }
    return out;
}

// HUMANIZE (plan §9, R6) — the robustness pass, as a post-pass over the RESOLVED
// spec so it works on both dialects and on every preset.
//
// The standing performance rule (docs/PHASE_SHIFTING.md §6) is that no texture
// may depend on precise timing, so every keeper has to be auditionable with
// human-scale error applied. That error is mathematically the SAME OPERATION as
// the dials already here, which is why this is composition rather than new
// machinery:
//
//   stageMs   a FIXED per-player offset — where the player is standing. ~30 ms
//             of arrival spread across a 10 m stage (343 m/s), so +/-15 ms.
//             Fixed, therefore it behaves like scatter: it can create a figure.
//   jitterMs  a PER-ATTACK error — human timing. Re-drawn every attack, so it
//             behaves like jitter and never repeats.
//
// Both are ESTIMATES (the stage figure is inferred from physics, not measured in
// a hall; the human figure is a guess). They can mis-tint an A/B — they can never
// block a render. The prediction they exist to test: rain is robust and smear is
// fragile, because human error converts smear into rain for free.
const HUMANIZE = { stageMs: 15, jitterMs: 25 };

function applyHumanize(resolved, h) {
    if (!h) return resolved;
    const stageMs = h.stageMs != null ? h.stageMs : HUMANIZE.stageMs;
    const jitterMs = h.jitterMs != null ? h.jitterMs : HUMANIZE.jitterMs;
    // Stage offset is per LANE, not per voice: it is where a player physically
    // stands, so it must be the same in every voice that player appears in.
    const rnd = lcgC(((h.seed != null ? h.seed : 424242) * 2246822519) >>> 0);
    const stage = {};
    for (let L = 0; L < D17.META_LAYER; L++) stage[L] = 2 * rnd() * stageMs / 1000;
    resolved.sections.forEach(sec => {
        sec.voices = sec.voices.map(v => {
            const lane = v.lanes && v.lanes.length ? v.lanes[0] : 0;
            return Object.assign({}, v, {
                jitterMs: (v.jitterMs || 0) + jitterMs,
                delay: (v.delay != null ? v.delay : 0) + stage[lane],
            });
        });
    });
    return resolved;
}

function normaliseSpec(spec, opts) {
    opts = opts || {};
    const maxLanes = opts.maxLanes || D17.META_LAYER;
    // A MISSING SEED STAYS MISSING — it must not become 1. The presets carry no
    // seed, and generate() folds `spec.seed || 0` into the jitter stream, so
    // defaulting here would shift every preset's jitter and break the Phase 0
    // byte-identity corpus.
    const seed = spec.seed != null ? spec.seed : null;
    const out = {
        name: spec.name, seed: seed,
        t0: spec.t0, gap: spec.gap, notelen: spec.notelen, midi: spec.midi,
        sections: [],
    };
    // One PRNG for the whole spec, consumed in section order then group order, so
    // the same spec always draws the same offsets — determinism is by seed only.
    const rnd = lcgC(seed != null ? (seed * 2654435761) >>> 0 : 20260816);
    (spec.sections || []).forEach(sec => {
        const panel = (sec.voices || []).some(isPanelVoice);
        if (!panel) { out.sections.push(sec); return; }   // RESOLVED — pass through
        const lanes = assignLanes(sec.voices, maxLanes);
        const voices = [];
        sec.voices.forEach((v, gi) => {
            expandVoice(v, lanes[gi], gi, rnd, opts).forEach(x => voices.push(x));
        });
        out.sections.push({
            dur: sec.dur, label: sec.label, tag: sec.tag,
            model: sec.model || 'beat', bpm: sec.bpm, stages: sec.stages,
            lap: sec.lap, dBpm: sec.dBpm, markLaps: sec.markLaps,
            voices,
        });
    });
    // humanize LAST, so it perturbs the finished arrangement rather than being
    // folded into the scatter draw — the clean and humanized renders must differ
    // by exactly the error model and nothing else, or the A/B is not an A/B.
    return applyHumanize(out, opts.humanize || spec.humanize);
}

// ---- insert path ----------------------------------------------------------
// Re-time a render to the playhead and re-id it as one draggable group, using the
// 2w placement conventions (groupId + marker + META shape are added by the
// caller). Texture notes are ORDINARY score notes — that is the whole point of
// D29's no-bend scope — so nothing here is special-cased at playback.
function toScoreObjects(result, at, opts) {
    opts = opts || {};
    const objs = result.objects;
    if (!objs.length) return [];
    let first = Infinity;
    objs.forEach(o => {
        const t = o.type === 'marker' ? o.time : o.startSeconds;
        if (t < first) first = t;
    });
    const shift = at - first;
    let id = opts.startId || 1;
    return objs.map(o => {
        const c = JSON.parse(JSON.stringify(o));
        if (c.type === 'marker') {
            c.id = 'mk-tex-' + (id++);
            c.time = +(c.time + shift).toFixed(3);
        } else {
            c.id = 'wc-tex-' + (id++);
            c.startSeconds = +(c.startSeconds + shift).toFixed(4);
            c.endSeconds = +(c.endSeconds + shift).toFixed(4);
            if (opts.color) c.color = opts.color;
        }
        if (opts.groupId) c.groupId = opts.groupId;
        return c;
    });
}

// The span a render occupies, for the META shape and the audition tail.
function spanOf(result) {
    let lo = Infinity, hi = -Infinity;
    result.objects.forEach(o => {
        if (o.type === 'marker') return;
        if (o.startSeconds < lo) lo = o.startSeconds;
        if (o.endSeconds > hi) hi = o.endSeconds;
    });
    return (lo === Infinity) ? 0 : +(hi - lo).toFixed(4);
}

// ============================== GENERATE ==============================
// The generator. Consumes a RESOLVED spec; returns objects + report + metrics.
// Impure concerns (score-file wrapping, MIDI, timestamps, console) belong to the
// caller — tools/phase_shift.js for the CLI, texture_panel.js for the app.
//
// EMISSION ORDER IS PART OF THE CONTRACT. Per section: every voice's notes in
// voice order, then that section's markers; ids run wc-1, mk-2, ... in that
// sequence and `nextId` is the final counter. Reordering any of it changes every
// id downstream and breaks the byte-identity gate.
function generate(spec, opts) {
    opts = opts || {};
    const SL = opts.sampleLengths || null;
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

    const clamps = [];
    // A named pitch set that could not be resolved is REPORTED, never quietly
    // rendered at the root — a texture silently at the wrong pitch looks exactly
    // like one at the right pitch until you read the numbers.
    const unresolvedSets = {};
    let cursor = spec.t0 != null ? spec.t0 : 2;
    spec.sections.forEach((sec, si) => {
        const t0 = cursor;
        const P = 60 / (sec.bpm || 100);
        const stages = sec.stages || null;
        const lines = [];
        const events = [];                       // {t, lane} for section metrics

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

        // PER-ATTACK JITTER — displaces every attack independently, so unlike
        // `scatter` (a fixed offset, which loops once per cycle and therefore
        // reads as a rhythmic figure) the pattern NEVER repeats. This is the
        // rain mechanism; it is also the human-timing error model (plan §9).
        sec.voices.forEach((v, vi) => {
            if (!v.jitterMs) return;
            // THE JITTER STREAM MUST FOLLOW THE SPEC SEED (R5). It originally did
            // not — `7654321 + vi*977` is a hardcoded constant — so on a RAIN
            // texture (jitter > 0, scatter 0) stepping the seed produced a
            // bit-identical render and the panel's whole identity-vs-draw
            // question silently answered itself "same every time". Found in the
            // running app at the Phase 1 gate, not by reading.
            //
            // Adding `spec.seed * PRIME` keeps the legacy stream EXACTLY when no
            // seed is present (the presets carry none, and `|| 0` leaves the old
            // constant untouched), so the Phase 0 byte-identity corpus is
            // unaffected. That is why normaliseSpec must NOT default a missing
            // seed to 1 — doing so would shift every preset's jitter.
            const rnd = lcgC((7654321 + vi * 977 + (spec.seed || 0) * 2654435761) >>> 0);
            voiceOnsets[vi] = voiceOnsets[vi].map(t => +(t + 2 * rnd() * v.jitterMs / 1000).toFixed(4));
            voiceOnsets[vi].sort((a, b) => a - b);
        });

        sec.voices.forEach((v, vi) => {
            const times = voiceOnsets[vi];
            const ring = ringLength(SL, v.tech, v.pitch);

            // per-PLAYER spacing is what physics cares about, not the composite —
            // and it has to be known BEFORE the note length is fixed
            const perPlayer = [];
            for (let L = 0; L < v.lanes.length; L++) {
                const mine = times.filter((_, k) => k % v.lanes.length === L);
                for (let i = 1; i < mine.length; i++) perPlayer.push(mine[i] - mine[i - 1]);
            }
            const tightest = perPlayer.length ? Math.min(...perPlayer) : Infinity;

            const asked = v.notelen != null ? v.notelen
                : (spec.notelen === 'sample' ? ring : spec.notelen);
            // A VARIABLE-LENGTH note (ord, flz) that outlasts the player's own next
            // attack is physically impossible, so clamp it — and say so. Fixed
            // one-shots (D9) cannot be clamped: the sample rings regardless, which
            // is a real conflict and stays visible as one.
            const cap = tightest - 0.05;   // clears audit_playability TONGUE_RESET (0.03 s)
            const written = (ring == null && asked > cap) ? +cap.toFixed(3) : asked;
            if (written !== asked) clamps.push(`${sec.tag}/${v.tech}: ${asked}s → ${written}s`);

            // PER-ATTACK PITCH for the draw/cycle policies. unison and perVoice
            // already resolved to this voice's scalar `pitch` in expandVoice, so
            // they take the `|| v.pitch` branch and nothing changes for them —
            // which is what keeps the byte-identity corpus intact.
            const pset = v.pitchSet;
            const prnd = pset ? lcg((99991 + vi * 7717 + (spec.seed || 0) * 2654435761) >>> 0) : null;
            let lastPitch = null;
            const pitchAt = k => {
                if (!pset || !pset.length) return v.pitch;
                if (v.pitchPolicy === 'cycle') return pset[(v.pitchIndex + k) % pset.length];
                // draw: seeded, with optional no-immediate-repeat on this player
                let p = pset[Math.floor(prnd() * pset.length) % pset.length];
                if (v.pitchNoRepeat && pset.length > 1 && p === lastPitch) {
                    p = pset[(pset.indexOf(p) + 1 + Math.floor(prnd() * (pset.length - 1))) % pset.length];
                }
                lastPitch = p;
                return p;
            };

            let ringWorst = ring;
            times.forEach((t, k) => {
                const lane = v.lanes[k % v.lanes.length];          // round-robin hocket
                const p = pitchAt(k);
                // the ring follows the ATTACK's own pitch (2u): staccato runs
                // 0.33-0.53 s across the range, so a set that sits low rings
                // longer and can be unplayable at a density the same set sitting
                // high plays cleanly
                if (pset) {
                    const r = ringLength(SL, v.tech, p);
                    if (r != null && (ringWorst == null || r > ringWorst)) ringWorst = r;
                }
                mkNote(lane, t0 + t, written, COLORS[(v.ci != null ? v.ci : vi) % COLORS.length],
                    'phase/' + (sec.tag || 's' + si), p, v.tech, v.level != null ? v.level : 7.5);
                events.push({ t, lane });
            });
            lines.push({
                vi, notes: times.length, players: v.lanes.length,
                composite: times.length / sec.dur, tightest, ring: ringWorst, written,
            });
            if (v.unresolvedSet) unresolvedSets[v.unresolvedSet] = 1;
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

        // Reference cycle for the unevenness metric = the FIRST voice's player
        // period. With mixed tempos (a gallop) that is a choice, not a fact — the
        // number then reads "how uneven against voice 0's cycle", which is what
        // the ear does anyway: it locks to one pulse and hears the rest against it.
        const period = 60 / ((sec.voices[0] && sec.voices[0].bpm) || sec.bpm || 100);
        report.push({ sec, lines, t0, metrics: metricsOf(events, period) });
        cursor = t0 + sec.dur + (spec.gap != null ? spec.gap : 2);
    });

    return {
        objects: objs, nextId: nid, report, clamps,
        unresolvedSets: Object.keys(unresolvedSets),
        end: cursor,
        notes: objs.filter(o => o.type === 'waveCurve').length,
        markers: objs.filter(o => o.type === 'marker').length,
        unknown: unknownKeys(spec),
    };
}

// SAMPLE-RING OVERLAP — the conflict the D17 badge structurally cannot see.
//
// D17 (and tools/audit_playability.js, and Composer.CONFLICT) compares WRITTEN
// note bounds. A fixed one-shot's written length is whatever was drawn, but the
// SAMPLE rings for its own measured duration regardless (D9 — that is what makes
// it fixed). So ten players re-attacking staccato every 0.30 s against a 0.42 s
// ring is physically a player playing over themselves, and the badge says
// "0 hard", because on paper the 0.12 s notes do not touch.
//
// This is exactly the 2r/2u trap in its worst form: the mock-up renders it
// perfectly cleanly, because technique = MIDI channel and the two attacks go out
// on two UVI voices. You cannot hear the problem, and at the density ceiling
// this is the ONLY thing standing between a texture and an unplayable one.
//
// Reported SEPARATELY rather than folded into the badge, deliberately: the
// "one law, two consumers" property of D17 is worth keeping intact and verified
// (plan §11), so this adds a second, clearly-labelled indicator instead of
// forking the law. Nothing here is a new constant — the ring comes from
// bank/sample_lengths.json via the report the engine already produces.
// AGGREGATED per (section, technique). A panel voice group is expanded into one
// voice PER PLAYER, so a ten-player field over its ring would otherwise report
// ten near-identical rows each claiming "1 player" — technically true, unreadable,
// and it understates the problem by describing it one player at a time. The
// composer needs one line: how many players, how tight, against which ring.
function ringOverlaps(report) {
    const byKey = new Map();
    report.forEach(({ sec, lines }) => {
        lines.forEach(l => {
            if (l.ring == null || !isFinite(l.tightest)) return;   // variable-length: clamped instead
            if (l.tightest > l.ring) return;
            const v = sec.voices[l.vi] || {};
            const key = (sec.tag || '') + '|' + v.tech + '|' + l.ring;
            const lanes = v.lanes || [];
            let e = byKey.get(key);
            if (!e) {
                e = { tag: sec.tag, tech: v.tech, ring: l.ring,
                      tightest: l.tightest, lanes: new Set() };
                byKey.set(key, e);
            }
            e.tightest = Math.min(e.tightest, l.tightest);          // report the WORST
            lanes.forEach(x => e.lanes.add(x));
        });
    });
    return [...byKey.values()].map(e => ({
        tag: e.tag, tech: e.tech, players: e.lanes.size,
        tightest: +e.tightest.toFixed(3), ring: e.ring,
        overBy: +(e.ring - e.tightest).toFixed(3),
    }));
}

// THE DENSITY CEILING IS PITCH-DEPENDENT (measured, PLAN 2x Phase 2).
//
// docs/PHASE_SHIFTING.md states the ceiling as ~23 attacks/s: ten players over
// the 0.42 s staccato ring. That number is CORRECT and it is also C3-SPECIFIC —
// every one of the 13 research experiments used ten players on a single C3, and
// C3 happens to be the 10th SHORTEST of the 36 measured staccato samples. The
// ring runs 0.33-0.53 s across the range and it is NOT monotonic (2n's
// multisample sawtooth), so it cannot be reasoned about by register.
//
// Introduce any real pitch set and the worst-case ring rises to 0.48-0.53 s,
// which drops the ceiling to ~19-21/s. A texture calibrated by ear at unison C3
// is therefore ~18% too dense the moment it is given pitches — and the mock-up
// plays the difference perfectly cleanly (2r).
//
// So the ceiling is COMPUTED from the render's own worst ring rather than
// hardcoded, and the panel marks density against that.
function ceilingOf(report, maxLanes) {
    let worst = null, players = 0;
    report.forEach(({ lines }) => {
        let secPlayers = 0;
        lines.forEach(l => {
            secPlayers += l.players;
            if (l.ring != null && (worst == null || l.ring > worst)) worst = l.ring;
        });
        players = Math.max(players, secPlayers);
    });
    if (worst == null) return null;                   // all variable-length: no ring ceiling
    return { ring: worst, players: players || maxLanes || D17.META_LAYER,
             rate: +(((players || maxLanes || D17.META_LAYER)) / worst).toFixed(1) };
}

// One-call convenience for the panel and the CLI: normalise, generate, audit.
function render(spec, opts) {
    const resolved = normaliseSpec(spec, opts);
    const g = generate(resolved, opts);
    g.spec = resolved;
    g.summary = playability(g.objects);
    g.rings = ringOverlaps(g.report);
    g.ceiling = ceilingOf(g.report, opts && opts.maxLanes);
    // spec-level unknown keys are reported against the ORIGINAL, not the resolved
    // form, so a panel typo is named as the composer wrote it
    g.unknown = unknownKeys(spec);
    return g;
}

return {
    COLORS, MARK_COL, THRESHOLDS_MS, D17, RAILS, HUMANIZE,
    pn, r2,
    lcg, lcgC,
    ringLength,
    steadyOnsets, sweepOnsets,
    sdOf, circularMean, metricsOf,
    requiredAttack, pairTier, playability, ringOverlaps, ceilingOf,
    SPEC_KEYS, SECTION_KEYS, VOICE_KEYS, unknownKeys,
    PITCH_POLICIES, resolveSet, perVoicePitch,
    assignLanes, expandVoice, applyHumanize, normaliseSpec,
    toScoreObjects, spanOf,
    generate, render,
};
}));
