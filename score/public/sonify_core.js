// sonify_core.js — THE sonification computation, extracted pure (2026-08-21,
// notation-workflow build). One event compiler, N consumers:
//   - tools/export_midi.js       score -> .mid file (Reaper records the audio)
//   - notation.html MidiTimebase score -> live Web MIDI under the D47 clock
//
// The math is copied VERBATIM from composer.html's playback path
// (computeYAtT / computeSegY / evalWaveCurve / curveValToCC / morphBendAt,
// tickCurvePlayback semantics: prearm CC0/KS/CC7 at -0.15 s, noteOn, CC7
// stream >= 25 ms on-change, morph bend stream, noteOff, residue cures).
// composer.html itself is NOT rewired (live app left untouched);
// tools/test_sonify_core.js asserts the two copies against each other over
// randomized inputs, so drift is caught, not assumed absent (Principle 5).
//
// Dual-load pattern (morph.js / texture_engine.js precedent): browser global
// `SonifyCore` + node module.exports.

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) module.exports = factory();
    else root.SonifyCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {

    const PREARM_S = 0.15;            // settle CC7/KS before the attack (kills the entry bite)
    const BEND_RANGE_CENTS = 199;     // MEASURED, 2v Phase 0 (1.99 st; RPN 0 is ignored by SI2)
    const CC_STEP_S = 0.025;          // live sends CC7 at >= 25 ms spacing; file samples the same grid
    const BEND_STEP_S = 0.010;        // morph bend sampling grid (live = per-frame on integer-cent change)
    const LEVEL_SPAN_DB = 40;         // Composer.levelSpanDb default (the level-span dial)

    // ---- curve math (verbatim from composer.html) ----

    function computeYAtT(model, slope, y1Norm, y2Norm, t) {
        t = Math.max(0, Math.min(1, t));
        switch (model) {
            case 'power': {
                const exponent = Math.pow(4, slope);
                return y1Norm + (y2Norm - y1Norm) * Math.pow(t, exponent);
            }
            case 'sigmoid': {
                const steepness = slope * 4;
                if (Math.abs(steepness) < 0.01) return y1Norm + (y2Norm - y1Norm) * t;
                const raw = 1 / (1 + Math.exp(-steepness * (t - 0.5)));
                const atZero = 1 / (1 + Math.exp(-steepness * -0.5));
                const atOne = 1 / (1 + Math.exp(-steepness * 0.5));
                return y1Norm + (y2Norm - y1Norm) * ((raw - atZero) / (atOne - atZero));
            }
            case 'exponential': {
                const k = slope * 4;
                if (Math.abs(k) < 0.01) return y1Norm + (y2Norm - y1Norm) * t;
                return y1Norm + (y2Norm - y1Norm) * ((Math.exp(k * t) - 1) / (Math.exp(k) - 1));
            }
            case 'logarithmic': {
                const absK = Math.abs(slope) * 5;
                let shaped;
                if (absK < 0.01) shaped = t;
                else if (slope < 0) shaped = Math.tanh(absK * t) / Math.tanh(absK);
                else shaped = 1 - Math.tanh(absK * (1 - t)) / Math.tanh(absK);
                return y1Norm + (y2Norm - y1Norm) * shaped;
            }
            case 'bezier': default: {
                const ctrlYNorm = slope >= 0
                    ? y1Norm + (y2Norm - y1Norm) * (1 - Math.abs(slope)) * 0.5
                    : y2Norm - (y2Norm - y1Norm) * (1 - Math.abs(slope)) * 0.5;
                const ctrlXNorm = 0.5 + Math.max(-1, Math.min(1, slope)) * 0.49;
                const a = 1 - 2 * ctrlXNorm;
                const b = 2 * ctrlXNorm;
                const c = -t;
                let bT;
                if (Math.abs(a) < 0.0001) bT = t;
                else {
                    const discriminant = b * b - 4 * a * c;
                    if (discriminant < 0) bT = t;
                    else {
                        const sqrtD = Math.sqrt(discriminant);
                        const t1 = (-b + sqrtD) / (2 * a);
                        const t2 = (-b - sqrtD) / (2 * a);
                        bT = (t1 >= 0 && t1 <= 1) ? t1 : t2;
                        bT = Math.max(0, Math.min(1, bT));
                    }
                }
                const omt = 1 - bT;
                return omt * omt * y1Norm + 2 * omt * bT * ctrlYNorm + bT * bT * y2Norm;
            }
        }
    }

    function computeSegY(seg, y1Norm, y2Norm, t) {
        if (seg && seg.model === 'ctrl') {
            const cx = Math.max(0.02, Math.min(0.98, seg.cx != null ? seg.cx : 0.5));
            const cy = Math.max(-0.4, Math.min(1.4, seg.cy != null ? seg.cy : (y1Norm + y2Norm) / 2));
            const a = 1 - 2 * cx, b = 2 * cx, c = -t;
            let bT;
            if (Math.abs(a) < 0.0001) bT = t;
            else {
                const disc = b * b - 4 * a * c;
                if (disc < 0) bT = t;
                else {
                    const sq = Math.sqrt(disc);
                    const t1 = (-b + sq) / (2 * a), t2 = (-b - sq) / (2 * a);
                    bT = (t1 >= 0 && t1 <= 1) ? t1 : t2;
                    bT = Math.max(0, Math.min(1, bT));
                }
            }
            const omt = 1 - bT;
            return Math.max(0, Math.min(1, omt * omt * y1Norm + 2 * omt * bT * cy + bT * bT * y2Norm));
        }
        return computeYAtT(seg ? (seg.model || 'bezier') : 'bezier', seg ? (seg.slope || 0) : 0, y1Norm, y2Norm, t);
    }

    function evalWaveCurve(wc, t01) {
        const nodes = wc.nodes;
        if (!nodes || nodes.length < 2) return 0;
        t01 = Math.max(0, Math.min(1, t01));
        for (let i = 1; i < nodes.length; i++) {
            if (t01 <= nodes[i].pos || i === nodes.length - 1) {
                const a = nodes[i - 1], b = nodes[i];
                const seg = wc.segments[Math.min(i - 1, wc.segments.length - 1)] || { model: 'bezier', slope: 0 };
                const lt = (t01 - a.pos) / Math.max(1e-6, b.pos - a.pos);
                return computeSegY(seg, a.y / 10, b.y / 10, lt);
            }
        }
        return nodes[nodes.length - 1].y / 10;
    }

    // ---- level -> CC7 through the MEASURED map (E0 calibration) ----
    // ccPoints = cc7_map.json `points`, sorted ascending in db (as the app sorts).

    function curveValToCC(v, ccPoints, levelSpanDb) {
        v = Math.max(0, Math.min(1, v));
        if (v <= 0.001) return 0;
        const pts = ccPoints;
        if (!pts) return Math.round(v * 127);
        const span = levelSpanDb != null ? levelSpanDb : LEVEL_SPAN_DB;
        const target = (v - 1) * span;   // 0 dB at full height
        if (target <= pts[0].db) return pts[0].cc;
        for (let i = 1; i < pts.length; i++) {
            if (target <= pts[i].db) {
                const a = pts[i - 1], b = pts[i];
                const f = (target - a.db) / Math.max(1e-6, b.db - a.db);
                return Math.round(a.cc + f * (b.cc - a.cc));
            }
        }
        return pts[pts.length - 1].cc;
    }

    // linear interpolation over note-relative [[dtSec, cents], ...]
    function morphBendAt(bp, dt) {
        if (dt <= bp[0][0]) return bp[0][1];
        for (let i = 1; i < bp.length; i++) {
            if (dt <= bp[i][0]) {
                const a = bp[i - 1], b = bp[i];
                return a[1] + ((dt - a[0]) / Math.max(1e-6, b[0] - a[0])) * (b[1] - a[1]);
            }
        }
        return bp[bp.length - 1][1];
    }

    // cents -> 14-bit bend value (the app's formula, clamped)
    function bend14(cents) {
        return Math.max(0, Math.min(16383, Math.round(8192 + (cents / (100 * 1.99)) * 8192)));
    }

    // ---- port/channel resolution (tickCurvePlayback's lookups) ----
    // laneIdx 0-9 -> instruments['tuba'+(laneIdx+1)]; tech.port overrides inst.port.

    function techniqueFor(wc, instruments) {
        const inst = instruments['tuba' + (wc.layer + 1)];
        if (!inst) return null;
        const techs = inst.techniques || [];
        const tech = techs.find(t => t.key === wc.technique) || techs[0] || null;
        return {
            inst,
            tech,
            port: ((tech && tech.port) || inst.port || '').toLowerCase(),
            ch: ((tech && tech.channel) || 1) - 1,   // 0-based
        };
    }

    // ---- THE EVENT COMPILER ----
    // score -> flat, time-sorted MIDI event list. Event:
    //   { t (abs seconds), port, ch (0-based), kind: 'cc'|'on'|'off'|'bend', bytes:[..] }
    // Same-instant ordering (consumers must preserve it): off < cc < bend < on.
    // opts: { window: [t0, t1]   notes whose [start,end) intersects; default all
    //         parts: [laneIdx]   default all
    //         endSweep: bool     append the STOP cure (CC7=127 + bend center on
    //                            every touched channel) 0.5 s after the last event }

    const KIND_RANK = { off: 0, cc: 1, bend: 2, on: 3 };

    function compileScore(score, instruments, ccPoints, opts) {
        opts = opts || {};
        const win = opts.window || null;
        const partSet = opts.parts ? new Set(opts.parts) : null;
        const spanDb = opts.levelSpanDb;
        const ev = [];
        const touched = new Set();      // 'port|ch' with any event
        const bent = new Set();         // 'port|ch' a morph bend touched
        const stats = { notes: 0, ccStream: 0, bendStream: 0, skippedNoTech: 0 };

        for (const wc of (score.objects || [])) {
            if (wc.type !== 'waveCurve' || wc.sonifyNote == null) continue;
            if (partSet && !partSet.has(wc.layer)) continue;
            if (win && !(wc.startSeconds < win[1] && wc.endSeconds > win[0])) continue;
            const r = techniqueFor(wc, instruments);
            if (!r || !r.port) { stats.skippedNoTech++; continue; }
            const { tech, port, ch } = r;
            const key = port + '|' + ch;
            touched.add(key);

            const t0 = wc.startSeconds, t1 = wc.endSeconds;
            const ksMode = (wc.sonifyMode === 'ks' && wc.ksNote != null) || wc.sonifyMode === 'plain';
            const pre = Math.max(0, t0 - PREARM_S);

            // pre-arm: CC0 (menu patches), KS latch, entry CC7
            if (tech && tech.cc0 != null) ev.push({ t: pre, port, ch, kind: 'cc', bytes: [0xB0 | ch, 0, tech.cc0] });
            if (wc.sonifyMode === 'ks' && wc.ksNote != null) {
                ev.push({ t: pre, port, ch, kind: 'on', bytes: [0x90 | ch, wc.ksNote, 100] });
                ev.push({ t: pre, port, ch, kind: 'off', bytes: [0x80 | ch, wc.ksNote, 0] });
            }
            const entryCC = wc.sonifyMode === 'plain' ? 127
                : ksMode ? curveValToCC(Math.max(...wc.nodes.map(n => n.y)) / 10, ccPoints, spanDb)
                    : curveValToCC(evalWaveCurve(wc, 0), ccPoints, spanDb);
            ev.push({ t: pre, port, ch, kind: 'cc', bytes: [0xB0 | ch, 7, entryCC] });

            // the note
            const vel = (wc.sonifyMode === 'plain' && wc.recVel != null) ? wc.recVel : 100;
            ev.push({ t: t0, port, ch, kind: 'on', bytes: [0x90 | ch, wc.sonifyNote, vel] });
            ev.push({ t: t1, port, ch, kind: 'off', bytes: [0x80 | ch, wc.sonifyNote, 0] });
            stats.notes++;

            // CC7 stream tracing the curve (curve mode only), >= 25 ms, on change
            if (!ksMode) {
                let lastCC = entryCC;
                const dur = Math.max(1e-6, t1 - t0);
                for (let t = t0 + CC_STEP_S; t < t1; t += CC_STEP_S) {
                    const cc = curveValToCC(evalWaveCurve(wc, (t - t0) / dur), ccPoints, spanDb);
                    if (cc !== lastCC) {
                        ev.push({ t, port, ch, kind: 'cc', bytes: [0xB0 | ch, 7, cc] });
                        lastCC = cc; stats.ccStream++;
                    }
                }
            }

            // morph bend stream (PLAN 2v): note-relative cents breakpoints.
            // Initial value lands at t0 (rank bend < on puts it before the attack);
            // residue cure: explicit return to center right after the noteOff.
            if (wc.morphBend && wc.morphBend.length) {
                bent.add(key);
                let lastBv = null;
                for (let t = t0; t < t1; t += BEND_STEP_S) {
                    const bv = Math.round(morphBendAt(wc.morphBend, t - t0));
                    if (bv !== lastBv) {
                        const v = bend14(bv);
                        ev.push({ t, port, ch, kind: 'bend', bytes: [0xE0 | ch, v & 0x7F, (v >> 7) & 0x7F] });
                        lastBv = bv; stats.bendStream++;
                    }
                }
                ev.push({ t: t1, port, ch, kind: 'bend', bytes: [0xE0 | ch, 0, 64] });
            }
        }

        // the STOP cure, as flushCurvePlayback does it: CC7=127 sweep on every
        // touched channel (+ bend center where a morph bent it) so the rig is
        // never left quiet (Principle 3 / the CC7-residue class)
        if (opts.endSweep && ev.length) {
            const tEnd = Math.max(...ev.map(e => e.t)) + 0.5;
            for (const key of touched) {
                const [port, chS] = key.split('|'); const ch = +chS;
                if (bent.has(key)) ev.push({ t: tEnd, port, ch, kind: 'bend', bytes: [0xE0 | ch, 0, 64] });
                ev.push({ t: tEnd, port, ch, kind: 'cc', bytes: [0xB0 | ch, 7, 127] });
            }
        }

        ev.sort((a, b) => a.t - b.t || KIND_RANK[a.kind] - KIND_RANK[b.kind]);

        return { events: ev, stats, touched: [...touched].sort() };
    }

    return {
        PREARM_S, BEND_RANGE_CENTS, CC_STEP_S, BEND_STEP_S, LEVEL_SPAN_DB, KIND_RANK,
        computeYAtT, computeSegY, evalWaveCurve, curveValToCC, morphBendAt, bend14,
        techniqueFor, compileScore,
    };
}));
