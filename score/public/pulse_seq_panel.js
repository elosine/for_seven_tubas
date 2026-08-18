// pulse_seq_panel.js — PLAN 2aa v1, the Pulse sequencer strip.
//
// A steady pulse grid. Click a column, give it a sonority, hear the whole grid
// loop until the pattern of harmonic change is right. That is the entire job.
//
// v1 IS AUDITION-ONLY AND WRITES NOTHING TO THE SCORE. No insert button exists
// on purpose (2aa v2). Autosave rewrites the loaded score every 5 s, so preview
// state that touched Composer.objects would be a data-loss bug — the grid lives
// in this panel and in localStorage, nowhere else.
//
// It injects its own button and DOM: composer.html gains two script tags and
// nothing else, because two agents share that file.
//
// WHERE THIS DEPARTS FROM THE PLAN, AND WHY — 2aa said "playback = MorphEmit.play,
// NO new scheduler". It reuses every dangerous part of that layer (ensureMidi,
// routeFor, noteOn/noteOff and their registry, and panic() as the one stop path)
// but does its OWN timer scheduling, exactly as texture_panel.js does and for
// the same two reasons plus one new one:
//   · E.play() is built for morphs — it pre-arms a pitch bend per note and drives
//     a per-frame CC7 envelope. These are plain velocity notes with CC7 pinned
//     (D12, the clusterview position, and how every banked blast was heard).
//   · IT CANNOT LOOP SEAMLESSLY. E.play() shifts its whole schedule by
//     CC_LEAD_MS (250 ms) and panics on entry, so re-invoking it per cycle
//     inserts a 250 ms hole — more than half a beat at 130 BPM — at every loop
//     boundary, or else cuts the last column's ring to avoid it. The composer is
//     listening for a pattern; a stumble at the seam corrupts the judgement.
// So the loop is scheduled cycle-by-cycle against one absolute time base: the
// next cycle's notes are placed 400 ms before it starts, and nothing is ever
// stopped and restarted. Stopping is still exactly E.panic().

(function (root) {
'use strict';

// `const Composer = {...}` in composer.html is a LEXICAL global: visible to every
// classic script by bare identifier, but NOT a property of window. Reaching for
// it as `root.Composer` silently yields undefined, which makes every MIDI route
// resolve to null and produces a "nothing sounded" that has nothing to do with
// MIDI. Always go through here. (Trap documented in morph_emit.js's header.)
function HOST() { return (typeof Composer !== 'undefined') ? Composer : null; }

const PS = root.PulseSeq, E = root.MorphEmit;
if (!PS || !E) { console.warn('[pulse_panel] needs pulse_seq.js + morph_emit.js'); return; }

const PER_ROW = 8;              // 8 cells per row: wide enough for CLUST10 to read
const LOOKAHEAD_MS = 400;       // schedule cycle k+1 this far before it starts
const STORE = 'pulseSeq.v1';
const PANEL_ID = 'pulse';         // this panel's bucket in bank/panel_snapshots.json (2ab)

// stable colour per sonority id — the pattern of harmonic change has to be
// visible at a glance, not only audible
function hueOf(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return h;
}

const PANEL = {
    el: null, pal: null, brush: null, picker: null,
    grid: { bpm: 130, columns: 32, noteLen: 0.25, cells: [] },
    loopOn: true, played: null, routes: null,
    base: 0, cycleIds: {}, ph: null, phCol: -1,

    // ---------------------------------------------------------------- boot
    init() {
        const host = document.getElementById('textureBtn') ||
                     document.getElementById('morphBtn') ||
                     document.getElementById('blastsBtn');
        if (!host) { console.warn('[pulse_panel] no button to anchor to'); return; }
        const btn = document.createElement('button');
        btn.id = 'pulseBtn';
        btn.textContent = 'Pulse';
        btn.title = 'pulse sequencer strip: assign a sonority per impulse and loop it (audition only)';
        btn.addEventListener('click', () => this.toggle());
        host.parentNode.insertBefore(btn, host.nextSibling);
        this.restore();
        this.build();
    },

    build() {
        const d = document.createElement('div');
        d.id = 'pulsePanel';
        d.style.cssText = [
            'position:fixed', 'right:16px', 'top:120px', 'width:496px', 'z-index:9000',
            'background:rgba(28,28,32,0.97)', 'border:1px solid #B08A2E', 'border-radius:6px',
            'padding:10px 12px', 'color:#ddd', 'font:11px/1.45 system-ui,sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.5)', 'display:none',
        ].join(';');
        d.innerHTML = [
            '<div id="pulseDrag" style="cursor:move;font-weight:600;color:#e0c274;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'background:rgba(176,138,46,0.20)">PULSE &nbsp;<span style="color:#8a7a4a;font-weight:400">',
            'audition only &mdash; writes nothing</span>',
            '<span id="pulseClose" style="float:right;cursor:pointer;color:#888">&#10005;</span></div>',
            '<div id="pulseStatus" style="color:#9a9;margin-bottom:7px">idle</div>',
            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:7px;flex-wrap:wrap">',
            '<label>cols <input id="pulseCols" type="number" min="1" max="256" step="1"',
            ' style="width:48px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px"></label>',
            '<label>BPM <input id="pulseBpm" type="number" min="20" max="400" step="1"',
            ' style="width:52px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px"></label>',
            '<label title="only bites on variable techniques — fixed one-shots (staccato/cuivre/fp) take their measured sample length (PLAN 2n)">',
            'note <input id="pulseLen" type="number" min="0.02" max="10" step="0.05"',
            ' style="width:52px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px"> s</label>',
            '<label><input id="pulseLoop" type="checkbox"> loop</label>',
            '<button id="pulseReload" title="re-read the palette from bank/pulse_palette.json">&#8635;</button>',
            '<button id="pulseSave" title="save this grid under a name (bank/panel_snapshots.json)">Save</button>',
            '<button id="pulseLoad" title="load a saved grid — the list refetches every time">Load</button>',
            '</div>',
            '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">',
            '<span style="color:#9a9">brush</span>',
            '<span id="pulseBrush" style="padding:1px 6px;border:1px solid #555;border-radius:3px">—</span>',
            '<button id="pulseFillAll" title="set every column to the brush">fill all</button>',
            '<span id="pulsePressure" style="color:#8a7a4a;margin-left:auto"></span>',
            '</div>',
            '<div id="pulseStrip" style="display:grid;gap:3px;margin-bottom:8px;',
            'grid-template-columns:repeat(' + PER_ROW + ',1fr)"></div>',
            // FIXED COLUMNS, not flex — the Play label changes while it runs, and
            // in a flex row that reflows everything to the right (the 2v lesson:
            // the composer reached for Stop and hit Insert). A transport control
            // must never move under the pointer.
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">',
            '<button id="pulsePlay" style="overflow:hidden;white-space:nowrap">Play</button>',
            '<button id="pulseStop">Stop</button>',
            '</div>',
            '<div style="color:#666;margin-top:7px">click a cell &rarr; pick a sonority &middot;',
            ' shift+click &rarr; fill from there to the end &middot; alt+click &rarr; paint the brush',
            ' &middot; SPACE play/stop &mdash; only while this panel has focus</div>',
        ].join('');
        document.body.appendChild(d);
        this.el = d;

        d.querySelector('#pulseClose').addEventListener('click', () => this.toggle(false));
        d.querySelector('#pulsePlay').addEventListener('click', () => this.play());
        d.querySelector('#pulseStop').addEventListener('click', () => E.panic());
        d.querySelector('#pulseFillAll').addEventListener('click', () => {
            if (!this.brush) return;
            for (let i = 0; i < this.grid.columns; i++) this.grid.cells[i] = this.brush;
            this.save(); this.drawStrip();
        });
        d.querySelector('#pulseReload').addEventListener('click', () => this.loadPalette(true));
        d.querySelector('#pulseSave').addEventListener('click', () => this.snapSave());
        d.querySelector('#pulseLoad').addEventListener('click', ev =>
            this.openSnapshots(ev.currentTarget));
        d.querySelector('#pulseLoop').addEventListener('change', e => {
            this.loopOn = e.target.checked; this.save();
        });
        ['#pulseCols', '#pulseBpm', '#pulseLen'].forEach(sel => {
            d.querySelector(sel).addEventListener('change', () => this.readFields());
        });
        this.makeDraggable(d, d.querySelector('#pulseDrag'));

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

        // CHAIN, never overwrite. `E.onStop` is a single slot on a layer three
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
            if (e.target.id === 'pulseClose') return;
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
        if (!C) bad.push('Composer not reachable (lexical global — use HOST())');
        else {
            if (typeof C.trackInstrument !== 'function') bad.push('Composer.trackInstrument missing');
            else if (!C.trackInstrument(0)) bad.push('Composer.trackInstrument(0) returned nothing');
            if (typeof C._zoneMidiOutputs !== 'object') bad.push('Composer._zoneMidiOutputs missing');
            if (typeof C.techLength !== 'function') bad.push('Composer.techLength missing (2n sample lengths)');
        }
        if (typeof E.routeFor !== 'function') bad.push('morph_emit.js missing');
        if (typeof PS.buildGrid !== 'function') bad.push('pulse_seq.js missing');
        if (bad.length) console.error('[pulse] PREFLIGHT FAILED:', bad);
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
    async loadPalette(force) {
        if (this.pal && !force) { this.drawStrip(); return; }
        try {
            const [file, tax] = await Promise.all([
                fetch('/api/pulsepalette', { cache: 'no-store' }).then(r => r.json()),
                fetch('/api/taxonomy', { cache: 'no-store' }).then(r => r.json()),
            ]);
            this.pal = PS.resolvePalette(file, tax && tax.tax);
            if (this.pal.problems.length) console.warn('[pulse] palette:', this.pal.problems);
            if (!this.brush) this.brush = this.pal.order[0] || null;
            this.drawStrip();
            this.setStatus(this.pal.order.length + ' sonorities' +
                (this.pal.problems.length ? ' · ' + this.pal.problems.join(' · ') : ''),
                this.pal.problems.length > 0);
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
        this.grid.columns = Math.round(Math.max(1, Math.min(256, num('#pulseCols', 32))));
        this.grid.bpm = Math.max(20, Math.min(400, num('#pulseBpm', 130)));
        this.grid.noteLen = Math.max(0.02, Math.min(10, num('#pulseLen', 0.25)));
        this.writeFields();
        this.save();
        this.drawStrip();
    },
    writeFields() {
        this.el.querySelector('#pulseCols').value = this.grid.columns;
        this.el.querySelector('#pulseBpm').value = this.grid.bpm;
        this.el.querySelector('#pulseLen').value = this.grid.noteLen;
        this.el.querySelector('#pulseLoop').checked = this.loopOn;
    },

    save() {
        try {
            localStorage.setItem(STORE, JSON.stringify({
                grid: this.grid, loopOn: this.loopOn, brush: this.brush,
            }));
        } catch (e) {}
    },
    // ONE path for "adopt a saved state", used by BOTH localStorage restore and
    // a 2ab snapshot load. Two paths would mean a snapshot could arrive with
    // defaults the scratch path applies and this one does not — the branch is
    // exactly where that bug would live (AI_METHODOLOGY rule 3).
    applyState(s) {
        if (!s || !s.grid) return false;
        this.grid = {
            bpm: s.grid.bpm || 130,
            columns: s.grid.columns || 32,
            noteLen: s.grid.noteLen != null ? s.grid.noteLen : 0.25,
            // sliced, never adopted by reference: a snapshot object fetched for
            // the Load list stays in that list, and editing cells afterwards
            // must not rewrite the copy sitting in it.
            cells: Array.isArray(s.grid.cells) ? s.grid.cells.slice() : [],
        };
        this.loopOn = s.loopOn !== false;
        this.brush = s.brush || null;
        return true;
    },
    restore() {
        try {
            this.applyState(JSON.parse(localStorage.getItem(STORE) || 'null'));
        } catch (e) {}
    },

    drawStrip() {
        const box = this.el.querySelector('#pulseStrip');
        box.innerHTML = '';
        const first = this.pal ? this.pal.order[0] : null;
        for (let i = 0; i < this.grid.columns; i++) {
            const id = this.grid.cells[i] != null ? this.grid.cells[i] : first;
            const known = this.pal && this.pal.entries[id];
            const c = document.createElement('div');
            c.className = 'pulseCell';
            c.dataset.i = String(i);
            const hue = id ? hueOf(id) : 0;
            c.style.cssText = [
                'cursor:pointer', 'border-radius:3px', 'padding:3px 2px', 'text-align:center',
                'border:1px solid ' + (known ? 'hsl(' + hue + ',35%,42%)' : '#8b3a3a'),
                'background:' + (known && !known.silent ? 'hsl(' + hue + ',30%,26%)' : '#232326'),
                'color:' + (known ? '#eee' : '#e88'),
                'font:9px/1.25 ui-monospace,monospace', 'overflow:hidden', 'white-space:nowrap',
            ].join(';');
            c.innerHTML = '<span style="color:#777">' + (i + 1) + '</span><br>' +
                          (id == null ? '·' : String(id));
            c.title = known ? (known.label + (known.pitches.length
                        ? ' — ' + known.pitches.map(PS.pitchName).join(' ') : ''))
                      : (id + ': not in the palette');
            c.addEventListener('click', ev => this.cellClick(i, ev));
            box.appendChild(c);
        }
        this.report();
    },

    cellClick(i, ev) {
        const first = this.pal ? this.pal.order[0] : null;
        const cur = this.grid.cells[i] != null ? this.grid.cells[i] : first;
        if (ev.shiftKey) {
            const fill = this.brush || cur;
            if (!fill) return;
            for (let k = i; k < this.grid.columns; k++) this.grid.cells[k] = fill;
            this.save(); this.drawStrip(); return;
        }
        if (ev.altKey) {
            if (!this.brush) return;
            this.grid.cells[i] = this.brush;
            this.save(); this.drawStrip(); return;
        }
        this.openPicker(i, ev.currentTarget);
    },

    openPicker(i, anchor) {
        this.closePicker();
        if (!this.pal) return;
        const p = document.createElement('div');
        p.style.cssText = [
            'position:fixed', 'z-index:9100', 'max-height:280px', 'overflow:auto',
            'background:#1b1b20', 'border:1px solid #B08A2E', 'border-radius:4px',
            'padding:4px', 'font:10px/1.4 system-ui,sans-serif', 'color:#ddd',
            'box-shadow:0 6px 20px rgba(0,0,0,0.6)', 'min-width:300px',
        ].join(';');
        this.pal.order.forEach(id => {
            const e = this.pal.entries[id];
            const row = document.createElement('div');
            row.style.cssText = 'padding:2px 5px;cursor:pointer;border-radius:2px;white-space:nowrap';
            row.innerHTML = '<b style="color:hsl(' + hueOf(id) + ',45%,62%)">' + id + '</b>' +
                            '<span style="color:#999"> &nbsp;' + e.label + '</span>' +
                            (e.missing ? '<span style="color:#e88"> — MISSING</span>' : '');
            row.addEventListener('mouseenter', () => { row.style.background = '#2c2c34'; });
            row.addEventListener('mouseleave', () => { row.style.background = ''; });
            row.addEventListener('click', () => {
                this.grid.cells[i] = id;
                this.brush = id;
                this.el.querySelector('#pulseBrush').textContent = id;
                this.save(); this.drawStrip(); this.closePicker();
            });
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

    // ---------------------------------------------------- snapshots (PLAN 2ab)
    // localStorage stays the live scratch. A snapshot is a NAMED point the
    // composer chose to keep, in bank/panel_snapshots.json, which survives a
    // clear, a browser and a machine — and is the channel the AI writes takes
    // into. The list refetches on every open, so an AI-written take appears
    // without a page reload.
    async snapSave() {
        const name = window.prompt('Save this grid as (letters, digits, . _ - and spaces):', '');
        if (name == null) return;                     // cancelled — say nothing
        const comment = window.prompt('A note about it (optional):', '') || '';
        try {
            const r = await fetch('/api/snapshots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    panel: PANEL_ID, name: name, comment: comment,
                    // EXACTLY what save() writes to localStorage — one payload
                    // shape, so a snapshot can never carry less than the scratch.
                    state: { grid: this.grid, loopOn: this.loopOn, brush: this.brush },
                }),
            }).then(x => x.json());
            if (!r.success) { this.setStatus('save failed: ' + (r.error || '?'), true); return; }
            this.setStatus('saved "' + name + '"' + (r.existed ? ' (replaced)' : '') +
                           ' · ' + r.panels + ' snapshot' + (r.panels === 1 ? '' : 's'));
        } catch (e) {
            this.setStatus('save failed: ' + e.message, true);
        }
    },

    async openSnapshots(anchor) {
        this.closePicker();
        let entries = {};
        try {
            const file = await fetch('/api/snapshots', { cache: 'no-store' }).then(x => x.json());
            entries = (file && file.panels && file.panels[PANEL_ID]) || {};
        } catch (e) {
            this.setStatus('snapshot list failed: ' + e.message, true); return;
        }
        const names = Object.keys(entries).sort((a, b) =>
            String(entries[b].saved || '').localeCompare(String(entries[a].saved || '')));

        const p = document.createElement('div');
        p.style.cssText = [
            'position:fixed', 'z-index:9100', 'max-height:280px', 'overflow:auto',
            'background:#1b1b20', 'border:1px solid #B08A2E', 'border-radius:4px',
            'padding:4px', 'font:10px/1.4 system-ui,sans-serif', 'color:#ddd',
            'box-shadow:0 6px 20px rgba(0,0,0,0.6)', 'min-width:300px',
        ].join(';');

        if (!names.length) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:3px 5px;color:#888';
            empty.textContent = 'no saved snapshots yet';
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
            pick.innerHTML = '<b style="color:#e0c274"></b><span style="color:#777"></span>' +
                             '<span style="color:#999"></span>';
            pick.children[0].textContent = n;
            pick.children[1].textContent = '  ' + when;
            pick.children[2].textContent = note ? '  — ' + note : '';
            pick.addEventListener('mouseenter', () => { row.style.background = '#2c2c34'; });
            pick.addEventListener('mouseleave', () => { row.style.background = ''; });
            pick.addEventListener('click', () => {
                if (!this.applyState(e.state)) {
                    this.setStatus('"' + n + '" has no grid in it — nothing loaded', true);
                    return;
                }
                this.writeFields();                    // the number inputs, not just the model
                this.save();                           // the loaded state becomes the scratch
                this.drawStrip();
                this.closePicker();
                this.setStatus('loaded "' + n + '" · ' + this.grid.columns + ' cols · ' +
                               this.grid.bpm + ' BPM');
            });
            const del = document.createElement('span');
            del.textContent = '×';
            del.title = 'delete this snapshot';
            del.style.cssText = 'cursor:pointer;color:#a66;padding:0 3px';
            del.addEventListener('mouseenter', () => { del.style.color = '#e88'; });
            del.addEventListener('mouseleave', () => { del.style.color = '#a66'; });
            del.addEventListener('click', async ev => {
                ev.stopPropagation();
                if (!window.confirm('Delete snapshot "' + n + '"?')) return;
                try {
                    const r = await fetch('/api/snapshots', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ panel: PANEL_ID, name: n, delete: true }),
                    }).then(x => x.json());
                    if (!r.success) { this.setStatus('delete failed: ' + (r.error || '?'), true); return; }
                    this.setStatus('deleted "' + n + '" · ' + r.panels + ' left');
                    this.openSnapshots(anchor);        // reopen on fresh data
                } catch (err) {
                    this.setStatus('delete failed: ' + err.message, true);
                }
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

    built() {
        const C = HOST();
        return PS.buildGrid(this.grid, this.pal, {
            techLength: (t, p) => (C && C.techLength ? C.techLength(t, p) : null),
        });
    },

    report() {
        if (!this.pal) return;
        const b = this.built();
        const m = b.meta;
        const lp = PS.lanePressure(b);
        this.el.querySelector('#pulseBrush').textContent = this.brush || '—';
        this.el.querySelector('#pulsePressure').textContent =
            lp.tightestGap != null ? 'tightest same-player gap ' + lp.tightestGap.toFixed(2) + ' s' : '';
        if (!E.isPlaying()) {
            this.setStatus(m.columns + ' cols · ' + m.bpm + ' BPM · ' + m.span.toFixed(2) + ' s · ' +
                b.notes.length + ' notes' + (m.silentCols ? ' · ' + m.silentCols + ' silent' : '') +
                (m.unknown.length ? ' · UNKNOWN: ' + m.unknown.join(',') : ''), m.unknown.length > 0);
        }
    },

    // ------------------------------------------------------------- transport
    async play() {
        if (!this.pal) { this.setStatus('palette not loaded', true); return; }
        const btn = this.el.querySelector('#pulsePlay');
        btn.textContent = 'starting…';
        E.panic();
        if (!await E.ensureMidi()) {
            btn.textContent = 'Play';
            this.setStatus(E._midiError || 'MIDI unavailable', true);
            return;
        }
        const b = this.built();
        if (!b.notes.length) { btn.textContent = 'Play'; this.setStatus('every column is silent', true); return; }

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
        // channels it BENT, and we never bend, so pinning is ours to do. This is
        // the one documented spot to convert if PLAN 2q resolves the other way.
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
            b.meta.span.toFixed(2) + ' s' + (this.loopOn ? ' · looping' : '') +
            (skipped ? ' · ' + skipped + ' had no port' : ''));
    },

    // ONE ABSOLUTE TIME BASE, cycle by cycle. Every note's delay is computed from
    // `base` and corrected by the time the scheduling loop itself has taken, so
    // the loop cannot drift and the seam has no gap: cycle k+1 is laid down
    // LOOKAHEAD_MS before it starts, while cycle k is still sounding.
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
        if (!b) return;
        const spanMs = b.meta.span * 1000, stepMs = b.meta.step * 1000;
        this.ph = setInterval(() => {
            const el = performance.now() - this.base;
            const col = el < 0 ? -1 : Math.floor((el % spanMs) / stepMs);
            if (col === this.phCol) return;
            this.paintPlayhead(col);
            this.phCol = col;
        }, 30);
    },
    stopPlayhead() {
        if (this.ph) { clearInterval(this.ph); this.ph = null; }
        this.paintPlayhead(-1);
        this.phCol = -1;
    },
    paintPlayhead(col) {
        const cells = this.el.querySelectorAll('.pulseCell');
        for (let i = 0; i < cells.length; i++) {
            cells[i].style.outline = (i === col) ? '2px solid #e0c274' : '';
        }
    },

    onStopped() {
        this.stopPlayhead();
        this.cycleIds = {};
        const btn = this.el && this.el.querySelector('#pulsePlay');
        if (btn) btn.textContent = 'Play';
        if (this.el && this.el.style.display !== 'none') this.report();
    },

    setStatus(msg, bad) {
        const s = this.el.querySelector('#pulseStatus');
        s.textContent = msg;
        s.style.color = bad ? '#e88' : '#9a9';
    },
};

root.PulsePanel = PANEL;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => PANEL.init());
else PANEL.init();

}(typeof self !== 'undefined' ? self : this));
