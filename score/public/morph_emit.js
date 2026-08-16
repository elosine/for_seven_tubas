// morph_emit.js — PLAN 2v, the MIDI emit layer. ALL morph sound goes through
// here: the panel's audition and the score's playback of inserted morph notes.
// One place for the hygiene, because the hygiene is the failure mode.
//
// WHY A REGISTRY. Probe 0 confirmed the residue trap is real: a note played
// after an unreset bend came out +49.4 cents sharp. And the piece-#3 history is
// that "all notes off wasn't working as expected". So panic() does NOT trust
// CC123 — it sends an explicit note-off for every note this layer actually
// started, from a registry, and uses CC123 only as belt-and-braces.
//
// MEASURED CONSTANTS come from docs/MORPH_FINDINGS.md via Morph.MEASURED:
//   BEND_PREARM_S 0.05  — set the bend this far before note-on so the note
//                         STARTS at pitch instead of scooping into it
//   RESET_GAP_S   0.0   — resetting bend at note-off proved inaudible
//   BEND_RANGE_ST 1.99  — the patch's real range; RPN 0 is ignored so it is a
//                         hard ceiling

(function (root) {
'use strict';

const M = root.Morph;
if (!M) { console.warn('[morph_emit] morph.js must load first'); return; }

const EMIT = {
    _active: [],        // [{out, ch, key, port}] — every note WE started
    _bentCh: {},        // "port|ch" -> true, so we only reset what we touched
    _timers: [],
    _playing: false,
    _t0: 0,
    _raf: null,
    _plan: null,
    onFrame: null,      // host hook: (elapsedSec) => void
    onStop: null,

    // ---- resolution -------------------------------------------------------
    outputFor(portName) {
        const C = root.Composer;
        if (!C || !C._zoneMidiOutputs) return null;
        return C._zoneMidiOutputs[String(portName || '').toLowerCase()] || null;
    },
    // voice -> lane -> instrument -> (port, channel) for a technique
    routeFor(lane, techKey) {
        const C = root.Composer;
        const inst = C && C.trackInstrument ? C.trackInstrument(lane) : null;
        if (!inst) return null;
        const tech = (inst.techniques || []).find(t => t.key === techKey)
                  || (inst.techniques || []).find(t => t.key === 'ord');
        const port = (tech && tech.port) || inst.port;
        const out = this.outputFor(port);
        if (!out) return null;
        return { out: out, port: port, ch: ((tech && tech.channel) || 1) - 1, tech: tech };
    },

    // ---- primitives -------------------------------------------------------
    sendBend(route, cents) {
        const v = M.bendValue(cents);
        route.out.send([0xE0 | route.ch, v & 0x7F, (v >> 7) & 0x7F]);
        this._bentCh[route.port + '|' + route.ch] = true;
    },
    noteOn(route, key, vel) {
        route.out.send([0x90 | route.ch, key, vel]);
        this._active.push({ out: route.out, ch: route.ch, key: key, port: route.port });
    },
    noteOff(route, key) {
        route.out.send([0x80 | route.ch, key, 0]);
        for (let i = this._active.length - 1; i >= 0; i--) {
            const a = this._active[i];
            if (a.ch === route.ch && a.key === key && a.port === route.port) {
                this._active.splice(i, 1);
                break;
            }
        }
    },

    // THE VERIFIED STOP SEQUENCE (probe 0.5: silence 0.69 s after the explicit
    // note-offs, both ports clean afterwards). Order matters.
    panic() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
        this._playing = false;

        // 1. explicit note-off for everything WE started — the registry is the
        //    source of truth, not memory of what "should" be sounding
        this._active.forEach(a => { try { a.out.send([0x80 | a.ch, a.key, 0]); } catch (e) {} });
        const started = this._active.length;
        this._active = [];

        // 2. CC123 as belt-and-braces only
        const outs = {};
        Object.keys(this._bentCh).forEach(k => {
            const port = k.split('|')[0], ch = +k.split('|')[1];
            const out = this.outputFor(port);
            if (out) { outs[k] = { out: out, ch: ch }; try { out.send([0xB0 | ch, 123, 0]); } catch (e) {} }
        });

        // 3. wait RESET_GAP_S, then centre the bend on every channel we bent and
        //    restore CC7. Measured as 0, but honour it if it is ever raised.
        const gapMs = Math.max(0, (M.MEASURED.RESET_GAP_S || 0) * 1000);
        const finish = () => {
            Object.keys(outs).forEach(k => {
                const o = outs[k];
                try { o.out.send([0xE0 | o.ch, 0, 64]); o.out.send([0xB0 | o.ch, 7, 127]); } catch (e) {}
            });
            this._bentCh = {};
        };
        if (gapMs > 0) this._timers.push(setTimeout(finish, gapMs)); else finish();
        if (this.onStop) try { this.onStop(); } catch (e) {}
        return started;
    },

    // MIDI IS INITIALISED LAZILY BY THE APP, and `navigator.requestMIDIAccess()`
    // needs a USER GESTURE — so it can only succeed on the composer's own click.
    // The app kicks it from the transport and the Rec button; the panel has to
    // kick it too or every route resolves to null and nothing sounds at all.
    // (That is exactly what happened on the first audition: `_zoneMidiOutputs`
    // was an empty object and `play` scheduled zero notes.)
    async ensureMidi() {
        const C = root.Composer;
        if (!C) return false;
        if (!C._zoneMidiInited && C.initZoneMidi) {
            try { await C.initZoneMidi(); } catch (e) { /* reported below */ }
        }
        return !!(C._zoneMidiOutputs && Object.keys(C._zoneMidiOutputs).length);
    },

    // ---- audition ---------------------------------------------------------
    // Plays a render. Bend envelopes are note-relative, so each note carries its
    // own trajectory and nothing here needs to know about the morph as a whole.
    // Returns {scheduled, skipped, reason} so the panel can say WHY nothing
    // sounded instead of guessing at the composer.
    async play(result, opts) {
        const o = opts || {};
        this.panic();
        if (!result || !result.notes || !result.notes.length) {
            return { scheduled: 0, skipped: 0, reason: 'nothing rendered' };
        }
        if (!await this.ensureMidi()) {
            return { scheduled: 0, skipped: 0,
                     reason: 'MIDI unavailable — the browser grants it only on a real click. ' +
                             'Click Play again; if it persists, check loopMIDI is running.' };
        }

        const laneOf = o.laneOf || (v => v);
        const vel = o.velocity || 96;
        const prearm = (M.MEASURED.BEND_PREARM_S || 0.05) * 1000;
        const scheduled = [];
        let skipped = 0;
        const missing = {};

        result.notes.forEach(n => {
            const route = this.routeFor(laneOf(n.voice), n.technique);
            if (!route) {
                skipped++;
                const C = root.Composer;
                const inst = C && C.trackInstrument ? C.trackInstrument(laneOf(n.voice)) : null;
                missing[(inst && inst.port) || ('lane ' + laneOf(n.voice))] = 1;
                return;
            }
            const key = n.midi;
            const resid = n.cents - n.midi * 100;
            const bend = n.bend.map(pt => [pt[0], pt[1] + resid]);
            const onMs = n.tStart * 1000;
            const offMs = (n.tStart + n.dur) * 1000;

            // pre-arm the bend so the note STARTS at pitch (probe 0.3)
            this._timers.push(setTimeout(() => this.sendBend(route, bend[0][1]),
                Math.max(0, onMs - prearm)));
            // CC7 for this note's opening level; the level curve is followed below
            this._timers.push(setTimeout(() => {
                try { route.out.send([0xB0 | route.ch, 7, this.levelToCC(n.level[0][1])]); } catch (e) {}
            }, Math.max(0, onMs - prearm + 5)));
            this._timers.push(setTimeout(() => this.noteOn(route, key, vel), onMs));
            this._timers.push(setTimeout(() => this.noteOff(route, key), offMs));
            scheduled.push({ route: route, bend: bend, level: n.level, onMs: onMs, offMs: offMs,
                             lastB: null, lastC: null });
        });

        if (!scheduled.length) {
            return { scheduled: 0, skipped: skipped,
                     reason: 'no MIDI port for ' + Object.keys(missing).join(', ') +
                             ' — is loopMIDI running with those ports open?' };
        }
        const span = (o.span || result.meta.span) * 1000 + 1200;
        this._plan = scheduled;
        this._t0 = performance.now();
        this._playing = true;

        const tick = () => {
            if (!this._playing) return;
            const el = performance.now() - this._t0;
            scheduled.forEach(s => {
                if (el < s.onMs || el > s.offMs) return;
                const dt = (el - s.onMs) / 1000;
                const bv = Math.round(this.interp(s.bend, dt));
                if (bv !== s.lastB) { this.sendBend(s.route, bv); s.lastB = bv; }
                const cc = this.levelToCC(this.interp(s.level, dt));
                if (cc !== s.lastC) {
                    try { s.route.out.send([0xB0 | s.route.ch, 7, cc]); } catch (e) {}
                    s.lastC = cc;
                }
            });
            if (this.onFrame) try { this.onFrame(el / 1000); } catch (e) {}
            if (el > span) { this.panic(); return; }
            this._raf = requestAnimationFrame(tick);
        };
        this._raf = requestAnimationFrame(tick);
        return { scheduled: scheduled.length, skipped: skipped, reason: null };
    },

    // linear interpolation over [[dtSec, value], ...]
    interp(bp, dt) {
        if (!bp || !bp.length) return 0;
        if (dt <= bp[0][0]) return bp[0][1];
        for (let i = 1; i < bp.length; i++) {
            if (dt <= bp[i][0]) {
                const a = bp[i - 1], b = bp[i];
                const f = (dt - a[0]) / Math.max(1e-6, b[0] - a[0]);
                return a[1] + f * (b[1] - a[1]);
            }
        }
        return bp[bp.length - 1][1];
    },

    // level 0-10 -> CC7 through the score's MEASURED map. Never re-derive it:
    // Composer.curveValToCC is the authority (probes/cc7_map.json, levelSpanDb).
    levelToCC(level0to10) {
        const C = root.Composer;
        const v = Math.max(0, Math.min(1, level0to10 / 10));
        if (C && typeof C.curveValToCC === 'function') return C.curveValToCC(v);
        return Math.round(v * 127);
    },

    isPlaying() { return this._playing; },
};

root.MorphEmit = EMIT;
}(typeof self !== 'undefined' ? self : this));
