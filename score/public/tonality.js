// tonality.js — the shared pitch-set palette and remap (PLAN 2x §3.4).
//
// PURE. No DOM, no MIDI, no fetch, no fs, no Date, no Math.random. Loads in the
// browser (window.Tonality) and in node (module.exports) from the same file.
//
// WHY THIS FILE EXISTS. All of this lived inline in clusterview.html: the 15
// named tonality sets, the pooled/literal switch, and the no-repeat kick. The
// texture sandbox's pitch layer (§8) needs exactly the same machinery, and the
// one thing worse than no shared module is two copies that drift — a remap that
// means something subtly different in two places would make every cross-sandbox
// comparison a lie. So it moves here and clusterview is rewired to it IN THE
// SAME COMMIT. Nothing is reimplemented: the palette, the nearest-in-set search
// and the no-repeat kick are the clusterview code, moved.
//
// THE 2u LESSON IS A HARD REQUIREMENT ON EVERY CONSUMER: re-pitching changes
// PLAYABILITY. A fixed one-shot's length depends on its pitch (staccato
// 0.33-0.53 s), and the soft rule is leap-dependent, so a remap can create real
// conflicts — MEASURED on DB3: Messiaen m3/F (26 pitches) came out clean while
// m5/F# (17) produced 9 hard and the BbE 2-oct cluster (20) produced 12. A
// variant with hard conflicts sounds perfectly fine in the mock-up (2r). So the
// conflict count must be visible WHILE CHOOSING, not after.

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Tonality = api;
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nm = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const LO = 30, HI = 65, TOP = 67;          // ord range; cuivre extends to 67

// ================= tonality palette =================
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const pcsPool = pcs => range(LO, HI).filter(m => pcs.includes(m % 12));
const onPc = (root, degs) => degs.map(d => (root + d) % 12);
const ROW = (() => {
    const pcs = [0, 7, 3, 10, 5, 1, 8, 4, 11, 6, 2];
    return pcs.map((pc, i) => {
        const target = LO + (HI - LO) * ((i * 7) % 11) / 10;
        let best = null;
        for (let m = LO; m <= HI; m++)
            if (m % 12 === pc && (best === null || Math.abs(m - target) < Math.abs(best - target))) best = m;
        return best;
    }).sort((a, b) => a - b);
})();
const TONALITIES = {
    'cl low': range(30, 36), 'cl mid': range(44, 50), 'cl high': range(59, 65),
    'cl spread': [30, 36, 43, 47, 56, 57, 58],
    'BbE 2oct': [...range(34, 40), ...range(58, 64)],
    '5ths 30': [30, 37, 44, 51, 58, 65], '5ths 37': [37, 44, 51, 58, 65],
    'oct F#': [30, 42, 54], 'oct Bb': [34, 46, 58],
    'm7 (F#)': pcsPool(onPc(6, [0, 1, 2, 3, 5, 6, 7, 8, 10, 11])),
    'm4 (F#)': pcsPool(onPc(6, [0, 1, 2, 5, 6, 7, 8, 11])),
    'm6 (F#)': pcsPool(onPc(6, [0, 2, 4, 5, 6, 8, 10, 11])),
    'm3 (F)': pcsPool(onPc(5, [0, 2, 3, 4, 6, 7, 8, 10, 11])),
    'Bhairav (F)': pcsPool(onPc(5, [0, 1, 4, 5, 7, 8, 11])),
    'row (placed)': ROW,
};

function foldInto(p) { while (p < LO) p += 12; while (p > HI) p -= 12; return p; }

// POOLED vs LITERAL. Pooled spreads the target's PITCH CLASSES over the whole
// range, so register and contour survive the remap; literal uses exactly the
// target's notes, which collapses the material into that chord's own register.
// The difference is large enough to be worth a visible control, not a default.
function resolveTarget(targetLit, pool) {
    if (!targetLit || !targetLit.length) return null;
    return pool ? pcsPool([...new Set(targetLit.map(q => q % 12))]) : targetLit.slice();
}

function nearestIn(target, q, excl) {
    let best = null, bd = 1e9;
    for (const m of target) {
        if (excl && excl.has(m)) continue;
        const d = Math.abs(m - q);
        if (d < bd) { bd = d; best = m; }
    }
    return best;
}

// REMAP, moved verbatim from clusterview's transform layer.
// `ev` is [{p, t, srcP}] and IS MUTATED IN PLACE — that is the original
// contract and changing it would ripple through clusterview's transform chain.
// `srcP` is the ORIGINAL pitch, which the no-repeat kick needs: distinct
// sources colliding on one target get bumped, while repeats that were in the
// source stay repeats. Losing that distinction would turn a real repeated note
// into a spurious step.
function remap(ev, targetLit, pool) {
    const target = resolveTarget(targetLit, pool);
    if (!target || !target.length) return ev;

    const map = {};
    for (const e of ev) {
        if (map[e.p] === undefined) map[e.p] = nearestIn(target, e.p);
        e.p = map[e.p];
    }
    // no-repeat kick: DISTINCT sources colliding on one target get bumped;
    // repeats present in the source stay repeats
    let prevP = null, prevSrc = null, curT = null, used = new Set();
    for (const e of ev) {
        if (curT === null || Math.abs(e.t - curT) > 0.001) { curT = e.t; used = new Set(); }
        let q = e.p;
        const clashPrev = prevP !== null && q === prevP && e.srcP !== prevSrc;
        if ((clashPrev || used.has(q)) && target.length > 1) {
            const excl = new Set(used);
            if (prevP !== null && e.srcP !== prevSrc) excl.add(prevP);
            const alt = nearestIn(target, e.srcP, excl);
            if (alt !== null) q = alt;
        }
        used.add(q);
        prevP = q; prevSrc = e.srcP;
        e.p = q;
    }
    return ev;
}

// Resolve a named set, a chord from a lookup, or a literal MIDI list into the
// pitch array a consumer actually uses. Never throws on an unknown name — it
// returns null and the caller reports it, because a silently-empty pitch set
// would render a texture at the wrong pitch with no indication why.
function setNamed(name, chords) {
    if (!name) return null;
    if (Array.isArray(name)) return name.slice();               // literal MIDI list
    if (TONALITIES[name]) return TONALITIES[name].slice();
    if (chords && chords[name]) return chords[name].slice();
    return null;
}

function names() { return Object.keys(TONALITIES); }

return {
    NAMES, nm, LO, HI, TOP,
    range, pcsPool, onPc, ROW, TONALITIES,
    foldInto, resolveTarget, nearestIn, remap, setNamed, names,
};
}));
