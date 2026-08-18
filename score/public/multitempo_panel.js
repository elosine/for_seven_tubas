// multitempo_panel.js — PLAN 2ac, the MULTITEMPO AUDITION RIG.
//
// Several tempi at once, related by small-integer ratios against one BPM. Type
// a ratio set, press SPACE, hear what the streams make together. That is the
// entire job. It writes nothing to the score.
//
// STRUCTURALLY THIS IS pulse_seq_panel.js. The plan says so explicitly, and the
// reason is that the parts NOT copied are the parts that were measured: the
// preflight block, the absolute-time-base lookahead scheduler, the MIDI glue
// (MorphEmit.ensureMidi / routeFor / noteOn / noteOff, with panic() as the one
// stop path), SPACE scoping, and the 2ab snapshot loop. Day 16 measured the
// scheduler at 240-260 ms attacks against a 250 ms nominal across 4.5 cycles
// with an inaudible seam; re-deriving that would be throwing away evidence.
// WHAT CHANGES IS ONLY THE GRID: a ratio set instead of a column strip.
//
// WHY NOT texture_engine (PLAN 2ac, decided): its rate integration is built for
// attack FIELDS and its behaviour with several exact concurrent grids is
// unverified. This material is one-shot pulses on an exact common cycle, which
// is what the pulse scheduler already does correctly.
//
// ---------------------------------------------------------------------------
// THE TAKE LOOP — how the composer and the AI work this panel together
//
// The composer listens and comments in their own words ("closer beats", "longer
// loop", "less patterning"). The AI translates that into ratio terms, writes a
// 2ab snapshot named `take-NN-<slug>` with the composer's VERBATIM words in its
// `comment`, and the composer picks it from Load — which refetches every time it
// opens, so a take written while the panel is open appears without a reload.
// THE AI NEVER OVERWRITES AN EXISTING TAKE; it writes a new name.
// Every listening verdict is filed to docs/RUNNING_LOG.md at the moment it is
// spoken (AI_METHODOLOGY: an unrecorded verdict is a lost experiment).
//
// The vocabulary, as ratio terms:
//   "closer beats"               -> terms near each other        (7:8)
//   "longer loop / less pattern" -> larger reduced terms         (15:16)
//   "sparse -> dense arc"        -> NOT a ratio property. Deferred (2ac v2).

(function (root) {
'use strict';

// `const Composer = {...}` in composer.html is a LEXICAL global: visible to every
// classic script by bare identifier, but NOT a property of window. Reaching for
// it as `root.Composer` silently yields undefined, which makes every MIDI route
// resolve to null and produces a "nothing sounded" that has nothing to do with
// MIDI. Always go through here. (Trap documented in morph_emit.js's header.)
function HOST() { return (typeof Composer !== 'undefined') ? Composer : null; }

const MT = root.Multitempo, PS = root.PulseSeq, E = root.MorphEmit;
if (!MT || !PS || !E) { console.warn('[mt_panel] needs multitempo.js + pulse_seq.js + morph_emit.js'); return; }

const LOOKAHEAD_MS = 400;       // schedule cycle k+1 this far before it starts
const STORE = 'multitempo.v1';
const PANEL_ID = 'multitempo';  // this panel's bucket in bank/panel_snapshots.json (2ab)
const PRESETS = ['2:3', '3:4', '4:5', '7:8', '3:4:5', '15:16'];
const STREAM_HUE = i => (i * 47) % 360;

const PANEL = {
    el: null, pal: null, picker: null,
    cfg: { bpm: 150, ratios: '3:4:5', mode: 'unison', unisonPitch: 48,
           pc: 0, entryId: null, noteLen: 0.25 },
    loopOn: true, played: null, routes: null,
    base: 0, cycleIds: {}, ph: null,

    init() {
        const host = document.getElementById('pulseBtn') ||
                     document.getElementById('textureBtn') ||
                     document.getElementById('morphBtn') ||
                     document.getElementById('blastsBtn');
        if (!host) { console.warn('[mt_panel] no button to anchor to'); return; }
        const btn = document.createElement('button');
        btn.id = 'mtBtn';
        btn.textContent = 'MT';
        btn.title = 'multitempo audition rig: several tempi at once by ratio (audition only)';
        btn.addEventListener('click', () => this.toggle());
        host.parentNode.insertBefore(btn, host.nextSibling);
        this.restore();
        this.build();
    },

    build() {
        const d = document.createElement('div');
        d.id = 'mtPanel';
        d.style.cssText = [
            'position:fixed', 'right:16px', 'top:150px', 'width:496px', 'z-index:9000',
            'background:rgba(28,28,32,0.97)', 'border:1px solid #6EA8B0', 'border-radius:6px',
            'padding:10px 12px', 'color:#ddd', 'font:11px/1.45 system-ui,sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.5)', 'display:none',
        ].join(';');
        const inp = 'background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px';
        d.innerHTML = [
            '<div id="mtDrag" style="cursor:move;font-weight:600;color:#9fd3db;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'background:rgba(110,168,176,0.20)">MULTITEMPO &nbsp;<span style="color:#6b8e93;font-weight:400">',
            'audition only &mdash; writes nothing</span>',
            '<span id="mtClose" style="float:right;cursor:pointer;color:#888">&#10005;</span></div>',
            '<div id="mtStatus" style="color:#9a9;margin-bottom:7px">idle</div>',

            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">',
            '<label>BPM <input id="mtBpm" type="number" min="20" max="400" step="1"',
            ' style="width:52px;' + inp + '"></label>',
            '<label title="whole numbers 1-64, separated by colons — stream 1 runs at the BPM">',
            'ratios <input id="mtRatios" type="text" style="width:96px;' + inp + '"></label>',
            '<label title="only bites on variable techniques — fixed one-shots take their measured sample length (PLAN 2n)">',
            'note <input id="mtLen" type="number" min="0.02" max="10" step="0.05"',
            ' style="width:52px;' + inp + '"> s</label>',
            '<label><input id="mtLoop" type="checkbox"> loop</label>',
            '</div>',

            '<div style="display:flex;gap:4px;align-items:center;margin-bottom:6px;flex-wrap:wrap">',
            '<span style="color:#9a9">presets</span>',
            PRESETS.map(p => '<button class="mtPreset" data-r="' + p + '">' + p + '</button>').join(''),
            '</div>',

            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">',
            '<label>separate <select id="mtMode" style="' + inp + '">',
            '<option value="unison">UNISON — one pitch</option>',
            '<option value="register">REGISTER — one pc, an octave each</option>',
            '<option value="harmony">HARMONY — one sonority, split low&rarr;high</option>',
            '</select></label>',
            '<span id="mtModeArg"></span>',
            '<button id="mtReload" title="re-read the palette from bank/pulse_palette.json">&#8635;</button>',
            '<button id="mtSave" title="save these settings under a name (bank/panel_snapshots.json)">Save</button>',
            '<button id="mtLoad" title="load saved settings — the list refetches every time">Load</button>',
            '</div>',

            '<div id="mtStreams" style="position:relative;margin-bottom:8px"></div>',

            // FIXED COLUMNS, not flex — the Play label changes while it runs, and
            // in a flex row that reflows everything to the right (the 2v lesson:
            // the composer reached for Stop and hit Insert). A transport control
            // must never move under the pointer.
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">',
            '<button id="mtPlay" style="overflow:hidden;white-space:nowrap">Play</button>',
            '<button id="mtStop">Stop</button>',
            '</div>',
            '<div style="color:#666;margin-top:7px">a brighter tick = two or more streams attack together',
            ' &middot; SPACE play/stop &mdash; only while this panel has focus</div>',
        ].join('');
        document.body.appendChild(d);
        this.el = d;

        d.querySelector('#mtClose').addEventListener('click', () => this.toggle(false));
        d.querySelector('#mtPlay').addEventListener('click', () => this.play());
        d.querySelector('#mtStop').addEventListener('click', () => E.panic());
        d.querySelector('#mtReload').addEventListener('click', () => this.loadPalette(true));
        d.querySelector('#mtSave').addEventListener('click', () => this.snapSave());
        d.querySelector('#mtLoad').addEventListener('click', ev => this.openSnapshots(ev.currentTarget));
        Array.prototype.forEach.call(d.querySelectorAll('.mtPreset'), b => {
            b.addEventListener('click', () => {
                d.querySelector('#mtRatios').value = b.dataset.r;
                this.readFields();
            });
        });
        d.querySelector('#mtLoop').addEventListener('change', e => {
            this.loopOn = e.target.checked; this.save();
        });
        d.querySelector('#mtMode').addEventListener('change', () => {
            this.cfg.mode = d.querySelector('#mtMode').value;
            this.drawModeArg();
            this.save(); this.report();
        });
        ['#mtBpm', '#mtRatios', '#mtLen'].forEach(sel => {
            d.querySelector(sel).addEventListener('change', () => this.readFields());
        });
        this.makeDraggable(d, d.querySelector('#mtDrag'));

        // Keys are scoped to the panel: composer.html has global handlers and a
        // stray SPACE here must not fight the score transport.
        d.setAttribute('tabindex', '0');
        d.addEventListener('keydown', e => {
            if (e.target.matches('input,select,textarea')) return;
            if (e.key === ' ') {
                e.preventDefault(); e.stopPropagation();
                E.isPlaying() ? E.panic() : this.play();
            } else if (e.key === 'Escape') { this.closePicker(); }
        });

        // CHAIN, never overwrite. `E.onStop` is a single slot on a layer four
        // panels now share; a plain assignment would leave another panel's Play
        // button reading "Playing…" forever after any stop here.
        const prev = E.onStop;
        E.onStop = () => {
            if (prev) { try { prev(); } catch (err) {} }
            this.onStopped();
        };

        this.writeFields();
    },

    makeDraggable(box, handle) {
        let sx = 0, sy = 0, bx = 0, by = 0, on = false;
        handle.addEventListener('mousedown', e => {
            if (e.target.id === 'mtClose') return;
            on = true; sx = e.clientX; sy = e.clientY;
            const r = box.getBoundingClientRect(); bx = r.left; by = r.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!on) return;
            box.style.left = (bx + e.clientX - sx) + 'px';
            box.style.top = (by + e.clientY - sy) + 'px';
            box.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => { on = false; });
    },

    // PREFLIGHT — every assumption about the host app, checked at OPEN time and
    // named. A wrong assumption must fail here, loudly, not as silence three
    // layers down at Play time (the 2v lesson).
    preflight() {
        const C = HOST();
        const bad = [];
        if (!C) bad.push('Composer not reachable');
        if (!E || typeof E.ensureMidi !== 'function') bad.push('MorphEmit.ensureMidi missing');
        if (typeof E.routeFor !== 'function') bad.push('MorphEmit.routeFor missing');
        if (typeof E.noteOn !== 'function' || typeof E.noteOff !== 'function') bad.push('MorphEmit note fns missing');
        if (typeof E.panic !== 'function') bad.push('MorphEmit.panic missing');
        if (!Array.isArray(E._timers)) bad.push('MorphEmit._timers missing (the stop registry)');
        if (C && typeof C.techLength !== 'function') bad.push('Composer.techLength missing (2n sample lengths)');
        if (typeof MT.buildStreams !== 'function') bad.push('Multitempo.buildStreams missing');
        if (bad.length) console.error('[mt] PREFLIGHT FAILED:', bad);
        return bad;
    },

    toggle(force) {
        const show = force != null ? force : this.el.style.display === 'none';
        this.el.style.display = show ? '' : 'none';
        if (!show) { E.panic(); this.closePicker(); return; }
        const bad = this.preflight();
        this.el.focus();
        if (bad.length) { this.setStatus('PREFLIGHT: ' + bad.join(' · '), true); return; }
        this.loadPalette(false);
    },

    // ------------------------------------------------------------- the palette
    // Shared with the pulse strip on purpose (2ac): a `ref` carries its per-note
    // articulation, which is what keeps a staccato/cuivre pair from becoming two
    // identical streams (the 2aa finding).
    async loadPalette(force) {
        if (this.pal && !force) { this.drawStreams(); return; }
        try {
            const [file, tax] = await Promise.all([
                fetch('/api/pulsepalette', { cache: 'no-store' }).then(r => r.json()),
                fetch('/api/taxonomy', { cache: 'no-store' }).then(r => r.json()),
            ]);
            this.pal = PS.resolvePalette(file, tax && tax.tax);
            if (this.pal.problems.length) console.warn('[mt] palette:', this.pal.problems);
            if (!this.cfg.entryId) this.cfg.entryId = this.pal.order[0] || null;
            this.drawModeArg();
            this.drawStreams();
        } catch (e) {
            this.setStatus('palette load failed: ' + e.message, true);
        }
    },

    // --------------------------------------------------------------- the grid
    readFields() {
        const num = (sel, dflt) => {
            const v = parseFloat(this.el.querySelector(sel).value);
            return isFinite(v) ? v : dflt;
        };
        this.cfg.bpm = Math.max(20, Math.min(400, num('#mtBpm', 150)));
        this.cfg.noteLen = Math.max(0.02, Math.min(10, num('#mtLen', 0.25)));
        this.cfg.ratios = String(this.el.querySelector('#mtRatios').value || '').trim();
        this.writeFields();
        this.save();
        this.drawStreams();
    },
    writeFields() {
        this.el.querySelector('#mtBpm').value = this.cfg.bpm;
        this.el.querySelector('#mtRatios').value = this.cfg.ratios;
        this.el.querySelector('#mtLen').value = this.cfg.noteLen;
        this.el.querySelector('#mtLoop').checked = this.loopOn;
        this.el.querySelector('#mtMode').value = this.cfg.mode;
    },

    // The mode's own input, rebuilt when the mode changes. One control, never
    // three hidden ones — a stale hidden field is how a panel ends up playing
    // something the composer cannot see (the day-12 lesson).
    drawModeArg() {
        const box = this.el.querySelector('#mtModeArg');
        const inp = 'background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px';
        if (this.cfg.mode === 'unison') {
            box.innerHTML = '<label>pitch <input id="mtPitch" type="number" min="0" max="127" step="1"' +
                            ' style="width:52px;' + inp + '"></label>';
            const el = box.querySelector('#mtPitch');
            el.value = this.cfg.unisonPitch;
            el.addEventListener('change', () => {
                const v = parseInt(el.value, 10);
                this.cfg.unisonPitch = isFinite(v) ? Math.max(0, Math.min(127, v)) : 48;
                el.value = this.cfg.unisonPitch;
                this.save(); this.drawStreams();
            });
        } else if (this.cfg.mode === 'register') {
            box.innerHTML = '<label>pc <select id="mtPc" style="' + inp + '">' +
                MT.NAMES.map((n, i) => '<option value="' + i + '">' + n + '</option>').join('') +
                '</select></label>';
            const el = box.querySelector('#mtPc');
            el.value = String(this.cfg.pc);
            el.addEventListener('change', () => {
                this.cfg.pc = parseInt(el.value, 10) || 0;
                this.save(); this.drawStreams();
            });
        } else {
            const order = this.pal ? this.pal.order : [];
            box.innerHTML = '<label>sonority <select id="mtEntry" style="max-width:170px;' + inp + '">' +
                order.map(id => '<option value="' + id + '">' + id + '</option>').join('') +
                '</select></label>';
            const el = box.querySelector('#mtEntry');
            if (this.cfg.entryId) el.value = this.cfg.entryId;
            el.addEventListener('change', () => {
                this.cfg.entryId = el.value;
                this.save(); this.drawStreams();
            });
        }
    },

    built() {
        const C = HOST();
        return MT.buildStreams(this.cfg, this.pal, {
            techLength: (t, p) => (C && C.techLength ? C.techLength(t, p) : null),
        });
    },

    // One row per stream, its attacks laid out across the common cycle. This is
    // the composite pattern made visible: a brighter tick is an onset two or
    // more streams share, which is exactly what the ear is hunting for.
    drawStreams() {
        if (!this.el) return;
        const box = this.el.querySelector('#mtStreams');
        const b = this.built();
        const m = b.meta;
        const co = MT.coincidences(b);
        box.innerHTML = '';

        const rows = document.createElement('div');
        rows.style.cssText = 'position:relative';
        for (let i = 0; i < m.streams; i++) {
            const row = document.createElement('div');
            row.style.cssText = 'position:relative;height:16px;margin-bottom:2px;' +
                'background:#202027;border-radius:2px';
            const tag = document.createElement('span');
            tag.style.cssText = 'position:absolute;left:3px;top:1px;color:hsl(' +
                STREAM_HUE(i) + ',45%,62%);font-size:9px';
            tag.textContent = 'T' + (i + 1) + (m.reduced[i] == null ? ' —' : ' ×' + m.reduced[i]);
            row.appendChild(tag);
            // ONE tick per ONSET, not per note: in HARMONY a stream attacks a
            // whole chunk at once, so `seen` must live outside the loop. (It did
            // not, at first — 39 notes drew 39 stacked ticks where 12 onsets
            // exist. Invisible on screen, because they land on the same pixel.)
            const seen = {};
            b.notes.filter(n => n.voice === i).forEach(n => {
                const key = n.tStart.toFixed(4);
                if (seen[key]) return;
                seen[key] = 1;
                const tick = document.createElement('div');
                const shared = co[key] > 1;
                tick.style.cssText = 'position:absolute;top:2px;height:12px;width:3px;' +
                    'left:calc(' + (m.cycleSec ? (n.tStart / m.cycleSec) * 100 : 0) + '% - 1px);' +
                    'background:hsl(' + STREAM_HUE(i) + ',' + (shared ? '75%,72%' : '40%,45%') + ');' +
                    (shared ? 'box-shadow:0 0 4px hsl(' + STREAM_HUE(i) + ',75%,60%)' : '');
                row.appendChild(tick);
            });
            rows.appendChild(row);
        }
        const head = document.createElement('div');
        head.id = 'mtPlayhead';
        head.style.cssText = 'position:absolute;top:0;bottom:0;width:1px;background:#e8e8e8;' +
            'opacity:0.75;left:0;display:none;pointer-events:none';
        rows.appendChild(head);
        box.appendChild(rows);
        this.report(b);
    },

    report(pre) {
        if (!this.el) return;
        const b = pre || this.built();
        const m = b.meta;
        const lp = PS.lanePressure(b);
        if (!E.isPlaying()) {
            const bits = [
                (m.reducedText || '—'),
                'cycle ' + m.cycleSec.toFixed(2) + ' s',
                m.perStream.join('/') + ' attacks',
                m.totalNotes + ' notes',
            ];
            if (lp.tightestGap != null) bits.push('tightest same-player gap ' + lp.tightestGap.toFixed(2) + ' s');
            this.setStatus(bits.join(' · ') + (m.problems.length ? ' · ' + m.problems.join(' · ') : ''),
                           m.problems.length > 0);
        }
    },

    // ------------------------------------------------------- snapshots (2ab)
    async snapSave() {
        const name = window.prompt('Save these settings as (letters, digits, . _ - and spaces):', '');
        if (name == null) return;
        const comment = window.prompt('A note about it (optional):', '') || '';
        try {
            const r = await fetch('/api/snapshots', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ panel: PANEL_ID, name: name, comment: comment,
                    state: { cfg: this.cfg, loopOn: this.loopOn } }),
            }).then(x => x.json());
            if (!r.success) { this.setStatus('save failed: ' + (r.error || '?'), true); return; }
            this.setStatus('saved "' + name + '"' + (r.existed ? ' (replaced)' : '') +
                           ' · ' + r.panels + ' snapshot' + (r.panels === 1 ? '' : 's'));
        } catch (e) { this.setStatus('save failed: ' + e.message, true); }
    },

    async openSnapshots(anchor) {
        this.closePicker();
        let entries = {};
        try {
            const file = await fetch('/api/snapshots', { cache: 'no-store' }).then(x => x.json());
            entries = (file && file.panels && file.panels[PANEL_ID]) || {};
        } catch (e) { this.setStatus('snapshot list failed: ' + e.message, true); return; }
        const names = Object.keys(entries).sort((a, b) =>
            String(entries[b].saved || '').localeCompare(String(entries[a].saved || '')));

        const p = document.createElement('div');
        p.style.cssText = [
            'position:fixed', 'z-index:9100', 'max-height:280px', 'overflow:auto',
            'background:#1b1b20', 'border:1px solid #6EA8B0', 'border-radius:4px',
            'padding:4px', 'font:10px/1.4 system-ui,sans-serif', 'color:#ddd',
            'box-shadow:0 6px 20px rgba(0,0,0,0.6)', 'min-width:300px',
        ].join(';');
        if (!names.length) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:3px 5px;color:#888';
            empty.textContent = 'no saved settings yet';
            p.appendChild(empty);
        }
        names.forEach(n => {
            const e = entries[n] || {};
            const row = document.createElement('div');
            row.style.cssText = 'padding:2px 5px;border-radius:2px;white-space:nowrap;' +
                                'display:flex;gap:8px;align-items:baseline';
            const when = String(e.saved || '').slice(0, 16).replace('T', ' ');
            const note = e.comment ? (e.comment.length > 44 ? e.comment.slice(0, 44) + '…' : e.comment) : '';
            const pick = document.createElement('span');
            pick.style.cssText = 'cursor:pointer;flex:1;overflow:hidden;text-overflow:ellipsis';
            pick.innerHTML = '<b style="color:#9fd3db"></b><span style="color:#777"></span>' +
                             '<span style="color:#999"></span>';
            pick.children[0].textContent = n;
            pick.children[1].textContent = '  ' + when;
            pick.children[2].textContent = note ? '  — ' + note : '';
            pick.addEventListener('mouseenter', () => { row.style.background = '#2c2c34'; });
            pick.addEventListener('mouseleave', () => { row.style.background = ''; });
            pick.addEventListener('click', () => {
                if (!this.applyState(e.state)) {
                    this.setStatus('"' + n + '" has no settings in it — nothing loaded', true);
                    return;
                }
                this.writeFields();
                this.drawModeArg();
                this.save();
                this.drawStreams();
                this.closePicker();
                this.setStatus('loaded "' + n + '" · ' + this.cfg.ratios + ' @ ' + this.cfg.bpm + ' BPM');
            });
            const del = document.createElement('span');
            del.textContent = '×';
            del.title = 'delete this snapshot';
            del.style.cssText = 'cursor:pointer;color:#a66;padding:0 3px';
            del.addEventListener('click', async ev => {
                ev.stopPropagation();
                if (!window.confirm('Delete snapshot "' + n + '"?')) return;
                try {
                    const r = await fetch('/api/snapshots', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ panel: PANEL_ID, name: n, delete: true }),
                    }).then(x => x.json());
                    if (!r.success) { this.setStatus('delete failed: ' + (r.error || '?'), true); return; }
                    this.setStatus('deleted "' + n + '" · ' + r.panels + ' left');
                    this.openSnapshots(anchor);
                } catch (err) { this.setStatus('delete failed: ' + err.message, true); }
            });
            row.appendChild(pick); row.appendChild(del);
            p.appendChild(row);
        });
        document.body.appendChild(p);
        const r = anchor.getBoundingClientRect();
        p.style.left = Math.min(r.left, window.innerWidth - p.offsetWidth - 12) + 'px';
        p.style.top = Math.min(r.bottom + 3, window.innerHeight - p.offsetHeight - 12) + 'px';
        this.picker = p;
        this._away = ev => { if (!p.contains(ev.target)) this.closePicker(); };
        setTimeout(() => document.addEventListener('mousedown', this._away), 0);
    },
    closePicker() {
        if (this.picker) { this.picker.remove(); this.picker = null; }
        if (this._away) { document.removeEventListener('mousedown', this._away); this._away = null; }
    },

    // ONE path for "adopt a saved state", used by BOTH localStorage restore and
    // a 2ab snapshot load — the same reasoning as the pulse panel's applyState.
    applyState(s) {
        if (!s || !s.cfg) return false;
        const c = s.cfg;
        this.cfg = {
            bpm: c.bpm || 150,
            ratios: typeof c.ratios === 'string' ? c.ratios : '3:4:5',
            mode: (c.mode === 'register' || c.mode === 'harmony') ? c.mode : 'unison',
            unisonPitch: c.unisonPitch != null ? c.unisonPitch : 48,
            pc: c.pc != null ? c.pc : 0,
            entryId: c.entryId || null,
            noteLen: c.noteLen != null ? c.noteLen : 0.25,
        };
        this.loopOn = s.loopOn !== false;
        return true;
    },
    save() {
        try {
            localStorage.setItem(STORE, JSON.stringify({ cfg: this.cfg, loopOn: this.loopOn }));
        } catch (e) {}
    },
    restore() {
        try { this.applyState(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch (e) {}
    },

    // ------------------------------------------------------------- transport
    async play() {
        if (!this.pal) { this.setStatus('palette not loaded', true); return; }
        const btn = this.el.querySelector('#mtPlay');
        btn.textContent = 'starting…';
        E.panic();
        if (!await E.ensureMidi()) {
            btn.textContent = 'Play';
            this.setStatus(E._midiError || 'MIDI unavailable', true);
            return;
        }
        const b = this.built();
        if (!b.notes.length) {
            btn.textContent = 'Play';
            this.setStatus('nothing to play' + (b.meta.problems.length ? ' · ' + b.meta.problems.join(' · ') : ''), true);
            return;
        }

        // Resolve every (lane, technique) route ONCE, and name what is missing.
        const routes = {}, missing = {};
        let skipped = 0;
        b.notes.forEach(n => {
            const k = n.voice + '|' + n.technique;
            if (!(k in routes)) {
                const r = E.routeFor(n.voice, n.technique);
                routes[k] = r || null;
                if (!r) {
                    const C = HOST();
                    const inst = C && C.trackInstrument ? C.trackInstrument(n.voice) : null;
                    missing[(inst && inst.port) || ('lane ' + n.voice)] = 1;
                }
            }
            if (!routes[k]) skipped++;
        });
        if (skipped === b.notes.length) {
            btn.textContent = 'Play';
            this.setStatus('no MIDI port for ' + Object.keys(missing).join(', ') +
                ' — is loopMIDI running with those ports open?', true);
            return;
        }

        // CC7 PINNED. Dynamics ride VELOCITY for this material (D12, and how
        // every banked blast was auditioned). panic() only restores CC7 on
        // channels it BENT, and we never bend, so pinning is ours to do.
        Object.keys(routes).forEach(k => {
            const r = routes[k];
            if (r) try { r.out.send([0xB0 | r.ch, 7, 127]); } catch (e) {}
        });

        this.played = b;
        this.routes = routes;
        this.cycleIds = {};
        // the pad gives the pinned CC7 the same settle the morph layer measured
        // for a cold attack, and absorbs the scheduling loop's own duration
        this.base = performance.now() + (E.CC_LEAD_MS || 250);
        E._playing = true;
        this.scheduleCycle(0);
        this.startPlayhead();
        btn.textContent = 'Playing…';
        this.setStatus('playing ' + (b.notes.length - skipped) + ' notes/cycle · ' +
            b.meta.reducedText + ' · cycle ' + b.meta.span.toFixed(2) + ' s' +
            (this.loopOn ? ' · looping' : '') +
            (skipped ? ' · ' + skipped + ' had no port' : ''));
    },

    // ONE ABSOLUTE TIME BASE, cycle by cycle. Every note's delay is computed from
    // `base` and corrected by the time the scheduling loop itself has taken, so
    // the loop cannot drift and the seam has no gap: cycle k+1 is laid down
    // LOOKAHEAD_MS before it starts, while cycle k is still sounding.
    // COPIED VERBATIM from pulse_seq_panel.js — day 16 measured it.
    scheduleCycle(k) {
        const b = this.played;
        if (!b) return;
        const spanMs = b.meta.span * 1000;
        const t0 = this.base + k * spanMs;
        const ids = [];
        b.notes.forEach(n => {
            const r = this.routes[n.voice + '|' + n.technique];
            if (!r) return;
            const on = t0 + n.tStart * 1000;
            const off = on + n.dur * 1000;
            ids.push(setTimeout(() => E.noteOn(r, n.midi, n.vel), Math.max(0, on - performance.now())));
            ids.push(setTimeout(() => E.noteOff(r, n.midi), Math.max(0, off - performance.now())));
        });
        // hand them to the shared registry so E.panic() remains the ONLY stop path
        ids.forEach(id => E._timers.push(id));
        this.cycleIds[k] = ids;
        // drop cycle k-2's ids: they have all fired, and an unbounded _timers
        // array would make panic() walk tens of thousands of dead ids
        const stale = this.cycleIds[k - 2];
        if (stale) {
            const s = {};
            stale.forEach(id => { s[id] = 1; });
            E._timers = E._timers.filter(id => !s[id]);
            delete this.cycleIds[k - 2];
        }

        const boundary = t0 + spanMs - LOOKAHEAD_MS;
        E._timers.push(setTimeout(() => {
            if (!E._playing) return;
            if (this.loopOn) this.scheduleCycle(k + 1);
            else E._timers.push(setTimeout(() => E.panic(),
                LOOKAHEAD_MS + Math.max(600, b.meta.overhang * 1000)));
        }, Math.max(0, boundary - performance.now())));
    },

    startPlayhead() {
        this.stopPlayhead();
        const b = this.played;
        if (!b || !b.meta.span) return;
        const head = this.el.querySelector('#mtPlayhead');
        if (!head) return;
        const spanMs = b.meta.span * 1000;
        head.style.display = '';
        this.ph = setInterval(() => {
            const el = performance.now() - this.base;
            if (el < 0) { head.style.left = '0%'; return; }
            head.style.left = ((el % spanMs) / spanMs * 100) + '%';
        }, 30);
    },
    stopPlayhead() {
        if (this.ph) { clearInterval(this.ph); this.ph = null; }
        const head = this.el && this.el.querySelector('#mtPlayhead');
        if (head) head.style.display = 'none';
    },

    onStopped() {
        this.stopPlayhead();
        this.cycleIds = {};
        const btn = this.el && this.el.querySelector('#mtPlay');
        if (btn) btn.textContent = 'Play';
        if (this.el && this.el.style.display !== 'none') this.report();
    },

    setStatus(msg, bad) {
        const s = this.el.querySelector('#mtStatus');
        s.textContent = msg;
        s.style.color = bad ? '#e88' : '#9a9';
    },
};

root.MtPanel = PANEL;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => PANEL.init());
else PANEL.init();

}(typeof self !== 'undefined' ? self : this));
