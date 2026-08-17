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

// `const Composer = {...}` in composer.html is a LEXICAL global: visible to every
// classic script by bare identifier, but NOT a property of window. Reaching for
// it as `root.Composer` silently yielded undefined, which made every MIDI route
// resolve to null and produced a "nothing sounded" that had nothing to do with
// MIDI. Always go through here.
function HOST() { return (typeof Composer !== 'undefined') ? Composer : null; }

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
        const C = HOST();
        if (!C || !C._zoneMidiOutputs) return null;
        return C._zoneMidiOutputs[String(portName || '').toLowerCase()] || null;
    },
    // voice -> lane -> instrument -> (port, channel) for a technique
    routeFor(lane, techKey) {
        const C = HOST();
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
    // Requests access HERE rather than delegating to Composer.initZoneMidi,
    // which swallows its error into a console.warn — so the panel could only
    // report "unavailable" and leave the composer guessing between a browser
    // permission, a missing port, and a broken rig. Those need different fixes,
    // so the real error has to reach the status line.
    _midiError: null,
    async ensureMidi() {
        const C = HOST();
        if (!C) { this._midiError = 'the score app has not finished loading'; return false; }
        if (C._zoneMidiOutputs && Object.keys(C._zoneMidiOutputs).length) return true;
        if (typeof navigator.requestMIDIAccess !== 'function') {
            this._midiError = 'this browser has no Web MIDI API';
            return false;
        }
        try {
            const access = await navigator.requestMIDIAccess();
            C._zoneMidiOutputs = C._zoneMidiOutputs || {};
            access.outputs.forEach(o => { C._zoneMidiOutputs[o.name.toLowerCase()] = o; });
            C._zoneMidiAccess = access;
            C._zoneMidiInited = true;
            if (C.bindHwInput) { try { C.bindHwInput(); } catch (e) {} }
            const n = Object.keys(C._zoneMidiOutputs).length;
            this._midiError = n ? null : 'the browser granted MIDI but reports no output ports — is loopMIDI running?';
            return n > 0;
        } catch (e) {
            const name = (e && e.name) || 'Error';
            this._midiError = name === 'NotAllowedError'
                ? 'this browser has BLOCKED Web MIDI for localhost:5200. It is a per-browser ' +
                  'setting, so a window where the score plays fine will work here too — ' +
                  'open the score in that window, or allow MIDI in this one (padlock icon → MIDI devices).'
                : name + ': ' + ((e && e.message) || 'MIDI request failed');
            return false;
        }
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
            return { scheduled: 0, skipped: 0, reason: this._midiError || 'MIDI unavailable' };
        }

        // audition on the same players the insert would use
        const _lanes = (result.meta && result.meta.lanes) || null;
        const laneOf = o.laneOf || (v => (_lanes && _lanes[v] != null) ? _lanes[v] : v);
        const velBase = o.velocity || 96;
        // VELOCITY HAS TO FOLLOW A FADE-IN TOO, and this is real evidence for
        // the open PLAN 2q question (velocity vs CC7 on SI2).
        //
        // The engine was made to open a fade at level 0 -> CC7 0, and the
        // composer still heard an attack, only quieter. If CC7 alone governed
        // loudness, CC7 0 would be silence. It is not — so the note-on velocity
        // is producing the transient, exactly as D12 found in the cluster
        // sandbox ("velocity is what the meter shows"). CC7 cannot mute a
        // velocity-96 attack; it can only attenuate what follows it.
        //
        // So a note whose opening level is below the engine's 0.4 floor — which
        // now happens ONLY inside an attack window — takes a proportionally
        // softer velocity. MIDI velocity 0 means note-off, so the floor is 1.
        // Everything else is untouched at 96.
        const velFor = n => {
            const l0 = (n.level && n.level[0] && n.level[0][1] != null) ? n.level[0][1] : 10;
            if (l0 >= 0.4) return velBase;
            return Math.max(1, Math.round(velBase * (l0 / 0.4)));
        };
        const prearm = (M.MEASURED.BEND_PREARM_S || 0.05) * 1000;
        const scheduled = [];
        let skipped = 0;
        const missing = {};

        result.notes.forEach(n => {
            const route = this.routeFor(laneOf(n.voice), n.technique);
            if (!route) {
                skipped++;
                const C = HOST();
                const inst = C && C.trackInstrument ? C.trackInstrument(laneOf(n.voice)) : null;
                missing[(inst && inst.port) || ('lane ' + laneOf(n.voice))] = 1;
                return;
            }
            const key = n.midi;
            // n.bend is ALREADY relative to the played key (the render loop
            // subtracts it). Adding the residual here as well played every
            // off-key note out by its own residual — measured at up to 40.2
            // cents on an M2 spectral render, found during 2z G4 and fixed in
            // both places at once. See the note in morph.js toScoreObjects.
            const bend = n.bend.map(pt => [pt[0], pt[1]]);
            const onMs = n.tStart * 1000;
            const offMs = (n.tStart + n.dur) * 1000;

            // pre-arm the bend so the note STARTS at pitch (probe 0.3)
            this._timers.push(setTimeout(() => this.sendBend(route, bend[0][1]),
                Math.max(0, onMs - prearm)));
            // CC7 for this note's opening level; the level curve is followed below
            this._timers.push(setTimeout(() => {
                try { route.out.send([0xB0 | route.ch, 7, this.levelToCC(n.level[0][1])]); } catch (e) {}
            }, Math.max(0, onMs - prearm + 5)));
            this._timers.push(setTimeout(() => this.noteOn(route, key, velFor(n)), onMs));
            this._timers.push(setTimeout(() => this.noteOff(route, key), offMs));
            scheduled.push({ route: route, bend: bend, level: n.level, onMs: onMs, offMs: offMs,
                             lastB: null, lastC: null });
        });

        if (!scheduled.length) {
            return { scheduled: 0, skipped: skipped,
                     reason: 'no MIDI port for ' + Object.keys(missing).join(', ') +
                             ' — is loopMIDI running with those ports open?' };
        }
        // ARM CC7 BEFORE THE FIRST NOTE, SYNCHRONOUSLY.
        //
        // A note at tStart 0 scheduled its CC7 at max(0, -45) = 0 — the same
        // millisecond as its note-on, so it had no lead at all. And stop()
        // leaves CC7 at 127 on every channel it touched, so the opening note
        // could speak at full volume for the instant before its own level
        // landed. Sending each route's opening level now, before any timer,
        // gives real lead and makes a fade-in start from where it should.
        scheduled.forEach(s2 => {
            if (s2.onMs > prearm) return;
            try {
                s2.route.out.send([0xB0 | s2.route.ch, 7, this.levelToCC(s2.level[0][1])]);
            } catch (e) {}
        });

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
        const C = HOST();
        const v = Math.max(0, Math.min(1, level0to10 / 10));
        if (C && typeof C.curveValToCC === 'function') return C.curveValToCC(v);
        return Math.round(v * 127);
    },

    isPlaying() { return this._playing; },
};

root.MorphEmit = EMIT;
}(typeof self !== 'undefined' ? self : this));
