// multitempo.js — PLAN 2ac. The MULTITEMPO AUDITION RIG's engine, pure.
//
// Loads in the browser (window.Multitempo) and in node (module.exports) from the
// same file, exactly as pulse_seq.js does, so tools/test_multitempo.js can assert
// every number below without a browser.
//
// ---------------------------------------------------------------------------
// WHAT THIS IS
//
// N simultaneous pulse streams, each at its own tempo, related by small-integer
// ratios against one BPM. The composer listens for the composite pattern. Every
// attack is a one-shot; nothing here sustains, bends or writes to a score.
//
// THE MATH, and it is the whole engine (PLAN 2ac):
//
//   ratios r1:r2:…:rN, positive integers 1..64, FIRST REDUCED BY THEIR GCD
//     (2:4:6 -> 1:2:3 — the same music, and the reduced form is what the
//      composer needs to see, because the loop length follows from it)
//   stream 1's tempo IS the BPM;  stream i runs at  BPM · ri/r1
//   COMMON CYCLE   C = r1 · 60/BPM   seconds
//   stream i attacks at  t = k · C/ri   for k = 0 … ri-1
//
// so in one cycle stream i plays exactly ri attacks and every stream realigns
// at t = C. That realignment is why the loop can simply repeat: there is no
// drift to accumulate. Non-integer ratios are OUT OF SCOPE for v1 precisely
// because they never realign — drift belongs to the phase machinery (2ad/FR-9).
//
// The composer's vocabulary maps onto the terms, which is the point of choosing
// ratios as the dial:
//   "closer beats"                -> terms near each other      (7:8)
//   "longer loop / less pattern"  -> larger reduced terms       (15:16)
//   "sparse -> dense arc"         -> NOT a ratio property. Deferred (v2).
//
// ---------------------------------------------------------------------------
// TRAPS THIS FILE WAS WRITTEN AGAINST (PLAN 2ac "SYMBOLS AND TRAPS")
//
//   · `r4` and `clamp` are PRIVATE in pulse_seq.js. `PulseSeq.r4` does not
//     exist. They are redefined here, identically.
//   · LANE = STREAM INDEX. pulse_seq.js's buildGrid round-robins a cursor
//     across lanes PER NOTE; copying that here would be wrong and would still
//     sound plausible. Stream i is player i, always. (Routing only —
//     orchestration is explicitly not this pass.)
//   · The 2n law: a one-shot takes its MEASURED length; `noteLen` cannot
//     stretch it. The two lines that implement it are copied from
//     pulse_seq.js:153 and :158 rather than re-derived.
//   · `entry.dyn` is carried through, as buildGrid does — a palette entry may
//     specify its own dynamic and dropping it silently flattens that sonority.
//
// NOTHING IS EVER SILENTLY DISCARDED. A bad ratio term, an unknown palette
// entry or an unknown pitch class is named in `meta.problems` and the affected
// stream renders SILENT — it keeps its index, so lanes and the display stay
// aligned with what the composer typed (AI_METHODOLOGY rule 3).

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Multitempo = api;
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LANES = 10;                 // ten tubas; stream i is player i
const DEFAULT_TECH = 'staccato';
const LO = 30, HI = 67;           // the bank's playable range, as in the palette
const MAX_TERM = 64;

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r4 = x => +x.toFixed(4);    // identical to pulse_seq.js's private r4

function gcd2(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }

// "3:4:5" | [3,4,5] -> [3,4,5]. Anything else is a term-level problem, not a
// throw: the composer is typing into a live field.
function parseRatios(v) {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === 'number') return [v];
    if (typeof v !== 'string') return [];
    return v.split(/[:\s,]+/).filter(s => s.length).map(s => Number(s));
}

// The pitch class's octaves inside the playable range, low -> high.
function pcOctaves(pc) {
    const out = [];
    for (let m = LO; m <= HI; m++) if (((m % 12) + 12) % 12 === pc) out.push(m);
    return out;
}

// Contiguous chunks, low -> high, sizes as equal as possible with the EXTRAS
// GOING TO THE LOWEST STREAMS: 10 pitches over 4 streams -> [3,3,2,2].
// Contiguous and not dealt round-robin because the composer asked to hear each
// tempo "in some sort of distinct region".
function chunk(sorted, n) {
    const out = [];
    const base = Math.floor(sorted.length / n);
    const rem = sorted.length % n;
    let at = 0;
    for (let i = 0; i < n; i++) {
        const size = base + (i < rem ? 1 : 0);
        out.push(sorted.slice(at, at + size));
        at += size;
    }
    return out;
}

// cfg = { bpm, ratios, mode, unisonPitch, pc, entryId, noteLen }
// pal = the resolved palette from PulseSeq.resolvePalette (HARMONY mode only)
function buildStreams(cfg, pal, opts) {
    const c = cfg || {};
    const o = opts || {};
    const lanes = o.lanes || LANES;
    const techLength = typeof o.techLength === 'function' ? o.techLength : null;
    const level = o.level != null ? o.level : 10;
    const velocity = o.velocity != null ? o.velocity : 127;
    const problems = [];

    const bpm = clamp(+c.bpm || 150, 20, 400);
    const noteLen = clamp(+c.noteLen || 0.25, 0.02, 10);
    const mode = (c.mode === 'register' || c.mode === 'harmony') ? c.mode : 'unison';

    // ---- terms. An invalid term keeps its slot as null so stream numbering,
    // lane numbering and the display never shift under the composer.
    const raw = parseRatios(c.ratios);
    const terms = raw.map((v, i) => {
        if (!isFinite(v) || Math.floor(v) !== v || v < 1 || v > MAX_TERM) {
            problems.push('stream ' + (i + 1) + ': "' + raw[i] +
                          '" is not a whole number 1-' + MAX_TERM + ' — silent');
            return null;
        }
        if (i >= lanes) {
            problems.push('stream ' + (i + 1) + ': beyond ' + lanes + ' players — silent');
            return null;
        }
        return v;
    });
    const valid = terms.filter(t => t != null);

    // ---- reduce by the GCD of the valid terms
    let g = 0;
    valid.forEach(t => { g = gcd2(g, t); });
    const reduced = terms.map(t => (t == null ? null : (g > 1 ? t / g : t)));
    const reducedValid = reduced.filter(t => t != null);

    if (!reducedValid.length) {
        if (!raw.length) problems.push('no ratios given');
        return {
            notes: [], meta: {
                bpm: bpm, noteLen: noteLen, mode: mode,
                reduced: reduced, reducedText: '', cycleSec: 0,
                span: 0, tail: 0, overhang: 0, step: 0,
                perStream: terms.map(() => 0), totalNotes: 0,
                streams: terms.length, lanes: lanes, problems: problems,
            },
        };
    }

    // Stream 1 anchors the tempo. If stream 1 itself is invalid, the FIRST
    // VALID term anchors instead — stated rather than left to chance, so a typo
    // in one field cannot silently retune everything else.
    const anchor = reducedValid[0];
    const cycleSec = anchor * (60 / bpm);

    // ---- pitches per stream
    const nStreams = terms.length;
    let pitchesFor = () => [];
    let techOf = () => DEFAULT_TECH;
    let dynOf = () => null;

    if (mode === 'unison') {
        const p = Math.round(clamp(+c.unisonPitch != null && isFinite(+c.unisonPitch)
            ? +c.unisonPitch : 48, 0, 127));
        pitchesFor = () => [p];
    } else if (mode === 'register') {
        const pc = ((Math.round(+c.pc) % 12) + 12) % 12;
        if (!isFinite(+c.pc)) {
            problems.push('pitch class "' + c.pc + '" unknown — every stream silent');
            pitchesFor = () => [];
        } else {
            const oct = pcOctaves(pc);
            if (!oct.length) {
                problems.push('pitch class ' + NAMES[pc] + ' has no octave in ' +
                              LO + '-' + HI + ' — every stream silent');
                pitchesFor = () => [];
            } else {
                // stream i takes the i-th octave low->high, WRAPPING when there
                // are more streams than octaves (F# has 4; a 5th stream reuses
                // the lowest).
                pitchesFor = i => [oct[i % oct.length]];
            }
        }
    } else {
        const entry = pal && pal.entries ? pal.entries[c.entryId] : null;
        if (!entry) {
            problems.push('sonority "' + c.entryId + '" is not in the palette — every stream silent');
            pitchesFor = () => [];
        } else if (!entry.pitches || !entry.pitches.length) {
            // a legitimate silent entry (the palette's "—"), not an error
            pitchesFor = () => [];
        } else {
            const sorted = entry.pitches.slice().sort((a, b) => a - b);
            const chunks = chunk(sorted, nStreams);
            pitchesFor = i => chunks[i] || [];
            // THE 2aa RULE: per-note articulation, so a staccato/cuivre pair
            // that shares a pitch set is not two identical streams.
            techOf = midi => (entry.tech && entry.tech[midi]) || DEFAULT_TECH;
            dynOf = () => (entry.dyn != null ? entry.dyn : null);
            if (entry.missing) problems.push('sonority "' + c.entryId + '" is MISSING from the taxonomy');
            if (sorted.length < nStreams) {
                problems.push(sorted.length + ' pitches over ' + nStreams +
                              ' streams — the highest ' + (nStreams - sorted.length) +
                              ' get nothing');
            }
        }
    }

    // ---- lay the cycle down
    const notes = [];
    const perStream = [];
    for (let i = 0; i < nStreams; i++) {
        const ri = reduced[i];
        if (ri == null) { perStream.push(0); continue; }
        const pitches = pitchesFor(i) || [];
        if (!pitches.length) { perStream.push(0); continue; }
        const stepI = cycleSec / ri;
        for (let k = 0; k < ri; k++) {
            const tStart = r4(k * stepI);
            pitches.forEach(midi => {
                const technique = techOf(midi);
                // pulse_seq.js:153 and :158, verbatim — PLAN 2n: a one-shot
                // takes its measured length and noteLen cannot stretch it.
                const measured = techLength ? techLength(technique, midi) : null;
                notes.push({
                    voice: i,                      // LANE = STREAM INDEX. Never a cursor.
                    midi: midi,
                    tStart: tStart,
                    dur: r4(measured != null ? measured : noteLen),
                    technique: technique,
                    vel: dynOf(midi) != null ? dynOf(midi) : velocity,
                    level: level,
                    col: k,                        // attack index within the stream
                    entry: 'T' + (i + 1),          // which stream this note belongs to
                });
            });
        }
        perStream.push(ri);
    }

    notes.sort((a, b) => a.tStart - b.tStart || a.midi - b.midi);
    const span = r4(cycleSec);
    const tail = notes.reduce((m, n) => Math.max(m, n.tStart + n.dur), 0);

    return {
        notes: notes,
        meta: {
            bpm: bpm, noteLen: noteLen, mode: mode,
            reduced: reduced,
            reducedText: reduced.map(t => (t == null ? '?' : t)).join(':'),
            cycleSec: span,
            span: span,                            // the scheduler's name for it
            tail: r4(tail), overhang: r4(Math.max(0, tail - span)),
            step: span,                            // one "column" = one whole cycle
            perStream: perStream,
            totalNotes: notes.length,
            streams: nStreams, lanes: lanes,
            problems: problems,
        },
    };
}

// Display helper: which onsets are shared by more than one stream. This is the
// composite pattern the composer is listening for, so it is worth showing.
function coincidences(built) {
    const at = {};
    built.notes.forEach(n => {
        const k = n.tStart.toFixed(4);
        (at[k] = at[k] || {})[n.voice] = 1;
    });
    const out = {};
    Object.keys(at).forEach(k => {
        const c = Object.keys(at[k]).length;
        if (c > 1) out[k] = c;
    });
    return out;
}

return {
    LANES: LANES, DEFAULT_TECH: DEFAULT_TECH, LO: LO, HI: HI, MAX_TERM: MAX_TERM,
    NAMES: NAMES,
    parseRatios: parseRatios, pcOctaves: pcOctaves, chunk: chunk,
    buildStreams: buildStreams, coincidences: coincidences,
};
}));
