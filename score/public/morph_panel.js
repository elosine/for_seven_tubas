// morph_panel.js — PLAN 2v §9, the Morph panel.
//
// THE PANEL GENERATES, AUDITIONS AND INSERTS. IT NEVER EDITS.
// No selection, no drag, no per-note anything, no undo stack. That boundary is a
// design rule, not a preference: the cluster sandbox's editor cost 80% of that
// build, and editing already exists and is debugged in the score itself. New
// interaction wishes go to NITS, not in here.
//
// It also injects its own button and DOM, so composer.html only has to load the
// script. That keeps the diff in a file two agents share down to one line.
//
// PREVIEW STATE NEVER TOUCHES THE SCORE. Autosave writes the score every 5 s, so
// a preview that lived in Composer.objects would be a data-loss bug (see the
// autosave-overwrites-loaded-score history). The render lives in a local var
// until the composer presses Insert.

(function (root) {
'use strict';

// `const Composer = {...}` in composer.html is a LEXICAL global: visible to every
// classic script by bare identifier, but NOT a property of window. Reaching for
// it as `root.Composer` silently yielded undefined, which made every MIDI route
// resolve to null and produced a "nothing sounded" that had nothing to do with
// MIDI. Always go through here.
function HOST() { return (typeof Composer !== 'undefined') ? Composer : null; }

const M = root.Morph, E = root.MorphEmit;
if (!M || !E) { console.warn('[morph_panel] needs morph.js + morph_emit.js'); return; }

const PANEL = {
    el: null, rev: -1, params: null, active: 'A', result: null, poll: null,

    // ---------------------------------------------------------------- boot
    init() {
        const host = document.getElementById('blastsBtn');
        if (!host) { console.warn('[morph_panel] no blastsBtn to anchor to'); return; }
        const btn = document.createElement('button');
        btn.id = 'morphBtn';
        btn.textContent = 'Morph';
        btn.title = 'morphing chords: generate, audition, insert at the playhead (never edits)';
        btn.addEventListener('click', () => this.toggle());
        host.parentNode.insertBefore(btn, host.nextSibling);
        this.build();
        this.startPolling();
    },

    build() {
        const d = document.createElement('div');
        d.id = 'morphPanel';
        d.style.cssText = [
            'position:fixed', 'right:16px', 'top:96px', 'width:340px', 'z-index:9000',
            'background:rgba(28,28,32,0.97)', 'border:1px solid #6a5acd', 'border-radius:6px',
            'padding:10px 12px', 'color:#ddd', 'font:11px/1.45 system-ui,sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.5)', 'display:none',
        ].join(';');
        d.innerHTML = [
            '<div id="morphDrag" style="cursor:move;font-weight:600;color:#b9a8ff;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'background:rgba(106,90,205,0.16)">MORPH',
            '<span id="morphClose" style="float:right;cursor:pointer;color:#888">&#10005;</span></div>',
            '<div id="morphStatus" style="color:#9a9;margin-bottom:7px">idle</div>',
            '<div id="morphTabs" style="margin-bottom:8px"></div>',
            '<div id="morphFields" style="margin-bottom:8px"></div>',
            '<div id="morphFlags" style="max-height:132px;overflow:auto;margin-bottom:8px"></div>',
            // FIXED COLUMNS, not flex. The Play button's label changes to
            // "Playing…" while it runs; in a flex row that reflowed everything to
            // the right, so reaching for Stop landed on "Insert @ cursor" and put
            // a morph into the score by accident (composer, 2026-08-16). A
            // transport control must never move under the pointer.
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">',
            '<button id="morphGen">Generate</button>',
            '<button id="morphPlay" style="overflow:hidden;white-space:nowrap">Play</button>',
            '<button id="morphStop">Stop</button>',
            '</div>',
            '<div style="margin-top:6px">',
            '<button id="morphIns" style="width:100%"',
            ' title="insert at the playhead as a group">Insert @ cursor</button>',
            '</div>',
            '<div style="color:#666;margin-top:7px">SPACE play/stop &middot; &larr;/&rarr; variant',
            ' &mdash; only while this panel has focus</div>',
        ].join('');
        document.body.appendChild(d);
        this.el = d;

        d.querySelector('#morphClose').addEventListener('click', () => this.toggle(false));
        d.querySelector('#morphGen').addEventListener('click', () => this.generate());
        d.querySelector('#morphPlay').addEventListener('click', () => this.play());
        d.querySelector('#morphStop').addEventListener('click', () => E.panic());
        d.querySelector('#morphIns').addEventListener('click', () => this.insert());
        this.makeDraggable(d, d.querySelector('#morphDrag'));

        // Keys are scoped to the panel: composer.html has global handlers and a
        // stray SPACE here must not fight the transport (plan §9).
        d.setAttribute('tabindex', '0');
        d.addEventListener('keydown', e => {
            if (e.target.matches('input,select,textarea')) return;
            if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); E.isPlaying() ? E.panic() : this.play(); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault(); e.stopPropagation();
                const keys = this.variantKeys();
                if (!keys.length) return;
                let i = keys.indexOf(this.active) + (e.key === 'ArrowRight' ? 1 : -1);
                this.active = keys[(i + keys.length) % keys.length];
                this.generate();
            }
        });
        E.onStop = () => { const b = d.querySelector('#morphPlay'); if (b) b.textContent = 'Play'; };
    },

    makeDraggable(box, handle) {
        let sx = 0, sy = 0, bx = 0, by = 0, on = false;
        handle.addEventListener('mousedown', e => {
            if (e.target.id === 'morphClose') return;
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

    // PREFLIGHT — every assumption this panel makes about the host app, checked
    // at OPEN time and reported loudly.
    //
    // This exists because of how the first audition failed. `Composer` is a
    // lexical `const`, so `window.Composer` was undefined; every MIDI route
    // silently resolved to null and the panel reported a MIDI problem that did
    // not exist. A wrong assumption about the host must fail HERE, by name, not
    // as silence three layers down at Play time.
    preflight() {
        const C = HOST();
        const bad = [];
        if (!C) bad.push('Composer not reachable (lexical global — use HOST())');
        else {
            if (typeof C.trackInstrument !== 'function') bad.push('Composer.trackInstrument missing');
            else if (!C.trackInstrument(0)) bad.push('Composer.trackInstrument(0) returned nothing');
            if (typeof C.curveValToCC !== 'function') bad.push('Composer.curveValToCC missing (level→CC7 law)');
            if (!Array.isArray(C.objects)) bad.push('Composer.objects is not an array');
            if (typeof C._zoneMidiOutputs !== 'object') bad.push('Composer._zoneMidiOutputs missing');
        }
        if (typeof M.render !== 'function') bad.push('morph.js engine missing');
        if (typeof E.play !== 'function') bad.push('morph_emit.js missing');
        this._preflight = bad;
        if (bad.length) console.error('[morph] PREFLIGHT FAILED:', bad);
        return bad;
    },

    toggle(force) {
        const show = force != null ? force : this.el.style.display === 'none';
        this.el.style.display = show ? '' : 'none';
        if (show) {
            const bad = this.preflight();
            this.el.focus();
            if (bad.length) { this.setStatus('PREFLIGHT: ' + bad.join(' · '), true); return; }
            this.refresh(true);
        } else { E.panic(); }
    },

    // ------------------------------------------------- the conversational loop
    // The AI writes bank/morph_params.json and bumps `rev`; the panel notices
    // within a second and regenerates. No websocket, no connection state, and it
    // survives a page reload (plan §5).
    startPolling() {
        this.poll = setInterval(() => { if (this.el.style.display !== 'none') this.refresh(false); }, 1000);
    },
    async refresh(force) {
        try {
            const r = await fetch('/api/morphparams', { cache: 'no-store' });
            const j = await r.json();
            if (!force && j.rev === this.rev) return;
            this.rev = j.rev;
            this.params = j;
            const keys = this.variantKeys();
            if (keys.indexOf(this.active) < 0) this.active = j.active && keys.indexOf(j.active) >= 0 ? j.active : keys[0];
            this.generate();
        } catch (e) { this.setStatus('params file unavailable — ' + e.message, true); }
    },
    variantKeys() {
        const v = (this.params && this.params.variants) || {};
        return Object.keys(v).filter(k => v[k]);
    },
    current() {
        const v = (this.params && this.params.variants) || {};
        return v[this.active] || null;
    },

    // ------------------------------------------------------------- rendering
    generate() {
        const p = this.current();
        if (!p) { this.setStatus('no variant', true); return; }
        // THE FIELDS BELONG TO A VARIANT. Reading them blindly merged the
        // PREVIOUS variant's dials into the new one — switching from A to N
        // auditioned N at A's span and A's seed, and it stuck, because draw()
        // then redrew the fields from the already-wrong merge. Every cross-
        // variant comparison in the panel was therefore of the wrong thing.
        // (Found 2026-08-16 while setting up 2z's G5 battery.)
        //
        // So: nudges persist while you stay put; changing variant, or the AI
        // rewriting the params file, resets to what the file actually says.
        const stamp = this.active + '@' + this.rev;
        const merged = (this._fieldStamp === stamp)
            ? this.readFields(p)
            : JSON.parse(JSON.stringify(p));
        this._fieldStamp = stamp;
        try {
            this.result = M.render(merged, {
                maxVoices: 10,
                sampleLengths: (HOST() && HOST().sampleLen) || null,
            });
        } catch (e) {
            this.setStatus('render failed: ' + e.message, true);
            console.error(e); return;
        }
        this.draw(merged);
    },

    draw(p) {
        const r = this.result, s = r.summary;
        const soft = Object.keys(s.soft).reduce((a, k) => a + s.soft[k], 0);
        this.setStatus('v' + this.rev + ' &middot; ' + this.active + ' &middot; "' +
            (p.label || p.model) + '" &middot; ' + r.notes.length + ' notes &middot; ' +
            (s.hard ? '<b style="color:#e06666">' + s.hard + ' hard</b> / ' : '') +
            (soft ? '<span style="color:#e0b062">' + soft + ' soft</span>' : 'clean'), false, true);

        const tabs = this.el.querySelector('#morphTabs');
        tabs.innerHTML = '';
        this.variantKeys().forEach(k => {
            const b = document.createElement('button');
            b.textContent = k;
            b.style.cssText = 'margin-right:4px;' + (k === this.active
                ? 'background:#6a5acd;color:#fff;border-color:#8f7fe0' : '');
            b.addEventListener('click', () => { this.active = k; this.generate(); });
            tabs.appendChild(b);
        });

        // read-and-nudge number fields, no sliders and no curve editors (§9)
        const f = this.el.querySelector('#morphFields');
        f.innerHTML = '';
        const row = (label, path, val, step) => {
            const w = document.createElement('div');
            w.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:2px 0';
            w.innerHTML = '<span style="color:#9a9">' + label + '</span>';
            const i = document.createElement('input');
            i.type = 'number'; i.step = step; i.value = val; i.dataset.path = path;
            i.style.cssText = 'width:74px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px';
            i.addEventListener('change', () => this.generate());
            w.appendChild(i); f.appendChild(w);
        };
        const sel = (label, path, val, opts) => {
            const w = document.createElement('div');
            w.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:2px 0';
            w.innerHTML = '<span style="color:#9a9">' + label + '</span>';
            const s = document.createElement('select');
            s.dataset.path = path;
            s.style.cssText = 'width:80px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px';
            opts.forEach(o => {
                const op = document.createElement('option');
                op.value = o; op.textContent = o;
                if (o === val) op.selected = true;
                s.appendChild(op);
            });
            s.addEventListener('change', () => this.generate());
            w.appendChild(s); f.appendChild(w);
        };
        const head = t => {
            const h = document.createElement('div');
            h.style.cssText = 'color:#b9a8ff;margin:7px 0 2px;border-top:1px solid #3a3a44;padding-top:5px';
            h.textContent = t; f.appendChild(h);
        };
        const note = (t, colour) => {
            const d = document.createElement('div');
            d.style.cssText = 'color:' + (colour || '#777') + ';margin:1px 0';
            d.innerHTML = t; f.appendChild(d);
        };

        row('span (s)', 'carrier.span', p.carrier.span, 1);
        row('segment (s)', 'carrier.segLen', p.carrier.segLen, 0.5);
        row('bias  −1…+1', 'dials.bias', p.dials.bias, 0.1);
        row('spread 0…1', 'dials.spread', p.dials.spread, 0.1);
        row('depth 0…1', 'dials.depth', p.dials.depth, 0.1);
        row('dyn amount', 'dyn.amount', p.dyn.amount, 0.05);
        row('seed', 'seed', p.seed, 1);

        // ------------------------------------------------------------ SHAPE
        // PLAN 2z. The panel SHOWS and NUDGES a shape; it does not build one
        // from nothing. That is deliberate: the composer's chosen interface for
        // this is narration ("for the first few attacks, I'll just narrate, and
        // we'll build the vocabulary"), the AI writes the block into
        // morph_params.json, and a from-scratch builder here would be the
        // sandbox-UI mistake — a big surface for a loop nobody hammers.
        const sh = p.shape;
        const num = (v, d) => (v != null ? v : d);
        if (!sh || (!sh.attack && !sh.decay && !sh.release)) {
            head('SHAPE');
            note('none — narrate one ("hit it hard and brassy, let it settle,<br>' +
                 'then let it fall apart") and its dials appear here.');
        } else {
            head('SHAPE · attack');
            if (!sh.attack) note('no attack block');
            else {
                row('len (s)', 'shape.attack.len', num(sh.attack.len, 2), 0.25);
                sel('entry', 'shape.attack.entry', num(sh.attack.entry, 'together'), M.ENTRY_MODES);
                sel('order', 'shape.attack.order', num(sh.attack.order, 'low-first'), M.ORDER_MODES);
                sel('curve', 'shape.attack.curve', num(sh.attack.curve, 'expo'), M.SHAPE_CURVES);
                row('from 0…1', 'shape.attack.from', num(sh.attack.from, 0.15), 0.05);
                row('peak ≥1', 'shape.attack.peak', num(sh.attack.peak, 1), 0.05);
                const layers = [];
                if (sh.attack.technique) layers.push('edge <b>' + sh.attack.technique + '</b>');
                if (sh.attack.transient) layers.push('transient <b>' + sh.attack.transient.technique +
                    '</b> (hit-then-tone)');
                if (sh.attack.noise) layers.push('noise <b>' + sh.attack.noise.technique + '</b> ×' +
                    sh.attack.noise.voices + ' (spare lanes, simultaneous)');
                if (sh.attack.motion) layers.push('motion <b>' + sh.attack.motion.type + '</b> ' +
                    sh.attack.motion.cents + ' c');
                if (layers.length) note(layers.join('<br>'), '#9a9');
            }
            if (sh.decay) {
                head('SHAPE · decay (peak → body)');
                row('len (s)', 'shape.decay.len', num(sh.decay.len, 3), 0.25);
                sel('curve', 'shape.decay.curve', num(sh.decay.curve, 'expo'), M.SHAPE_CURVES);
            }
            head('SHAPE · release');
            if (!sh.release) note('no release block');
            else {
                row('len (s)', 'shape.release.len', num(sh.release.len, 8), 0.5);
                sel('exit', 'shape.release.exit', num(sh.release.exit, 'staggered'), M.EXIT_MODES);
                sel('order', 'shape.release.order', num(sh.release.order, 'seeded'), M.ORDER_MODES);
                sel('curve', 'shape.release.curve', num(sh.release.curve, 'expo'), M.SHAPE_CURVES);
                row('to 0…1', 'shape.release.to', num(sh.release.to, 0), 0.05);
                if (sh.release.dropout) {
                    row('dropout 0…1', 'shape.release.dropout.fraction',
                        num(sh.release.dropout.fraction, 0.4), 0.1);
                }
                const rl = [];
                if (sh.release.technique) rl.push('edge <b>' + sh.release.technique + '</b>');
                if (sh.release.motion) rl.push('motion <b>' + sh.release.motion.type + '</b>' +
                    (sh.release.motion.type === 'to-unison' ? '' : ' ' + sh.release.motion.cents + ' c'));
                if (rl.length) note(rl.join('<br>'), '#9a9');
            }
            // The level floor, said once, where it will be read. `to: 0` is not
            // digital silence and never was — it is the bottom of the measured
            // CC7 map, the same floor every hand-drawn decrescendo has.
            note('“to: 0” lands on the 0.4 level floor — very quiet through the<br>' +
                 'measured CC7 map, not silence. Same floor as every drawn hairpin.');
            const ms = r.meta.shape;
            if (ms) {
                const bits = [];
                if (ms.dropped && ms.dropped.length) {
                    bits.push('dropout: ' + ms.dropped.length + ' voice(s) cut early — T' +
                        ms.dropped.map(v => v + 1).join(', T') + ' (whole clusters)');
                }
                if (ms.noiseVoices) bits.push('noise layer: ' + ms.noiseVoices + ' spare lane(s)');
                if (bits.length) note(bits.join('<br>'), '#8a8ac0');
            }
        }

        // flags, in 2r's existing red/amber vocabulary — no new colours
        const fl = this.el.querySelector('#morphFlags');
        fl.innerHTML = '';
        const rows = r.notes.filter(n => n.flags.length).slice(0, 40);
        if (!rows.length && !r.warnings.length) {
            fl.innerHTML = '<div style="color:#6a6">no flags</div>';
        }
        r.warnings.forEach(w => {
            fl.innerHTML += '<div style="color:#e0b062">' + w + '</div>';
        });
        rows.forEach(n => {
            const hard = n.flags.indexOf('OVERLAP') >= 0;
            fl.innerHTML += '<div style="color:' + (hard ? '#e06666' : '#e0b062') + '">T' +
                (n.voice + 1) + ' &middot; ' + n.tStart.toFixed(1) + ' s &middot; ' +
                n.flags.join(', ') + '</div>';
        });
    },

    readFields(p) {
        const merged = JSON.parse(JSON.stringify(p));
        // Walk to the parent of a dotted path. Shape rows are only drawn for
        // blocks that already exist, so this never invents one — a nudge on a
        // dial cannot conjure `shape.attack` out of nothing.
        const parentOf = (path, create) => {
            const parts = path.split('.');
            let o = merged;
            for (let k = 0; k < parts.length - 1; k++) {
                if (o[parts[k]] == null) { if (!create) return null; o[parts[k]] = {}; }
                o = o[parts[k]];
            }
            return { obj: o, key: parts[parts.length - 1] };
        };
        this.el.querySelectorAll('#morphFields input').forEach(i => {
            const t = parentOf(i.dataset.path, i.dataset.path.indexOf('shape.') !== 0);
            if (!t) return;
            const v = parseFloat(i.value);
            if (!isNaN(v)) t.obj[t.key] = v;
        });
        this.el.querySelectorAll('#morphFields select').forEach(s => {
            const t = parentOf(s.dataset.path, false);
            if (t) t.obj[t.key] = s.value;
        });
        return merged;
    },

    // ------------------------------------------------------------- transport
    async play() {
        if (!this.result) this.generate();
        if (!this.result) return;
        const btn = this.el.querySelector('#morphPlay');
        btn.textContent = 'starting…';
        const r = await E.play(this.result, {});
        if (!r.scheduled) {
            btn.textContent = 'Play';
            this.setStatus(r.reason || 'nothing sounded', true);
            return;
        }
        btn.textContent = 'Playing…';
        this.setStatus('playing ' + r.scheduled + ' notes' +
            (r.skipped ? ' (' + r.skipped + ' had no port)' : ''));
    },

    insert() {
        const C = HOST();
        if (!C || !this.result) return;
        const at = (C.playheadTime != null ? C.playheadTime : (C.currentTime || 0));
        const p = this.current() || {};
        let seq = 1;
        while (C.objects.some(o => o.groupId === 'grp-morph-' + String(seq).padStart(2, '0'))) seq++;
        const gid = 'grp-morph-' + String(seq).padStart(2, '0');
        const objs = M.toScoreObjects(this.result, at, {
            groupId: gid, startId: (C.nextId || 1) + 1,
            label: (p.label || this.result.meta.model), color: '#7E57C2',
        });
        // marker + META group shape, exactly like every other grouped gesture, so
        // it drags and scales as one unit. The META shape was MISSING in the
        // first version — the group inserted and sounded correctly but had no
        // shape on layer 10, so there was nothing to grab and group-scaling had
        // no handle. Caught by the Phase 4 gate, not by inspection.
        const span = this.result.meta.span;
        C.objects.push({
            id: 'mk-morph-' + seq, type: 'marker', layer: 0, time: +at.toFixed(3),
            label: 'MORPH ' + this.result.meta.model + (p.label ? ' — ' + p.label : ''),
            color: '#7E57C2', groupId: gid, performanceNotes: '', properties: {},
        });
        objs.forEach(o => C.objects.push(o));

        // contour follows the morph's own dynamic shape: sample the mean level
        // across the voices so the drawn shape is what the ensemble actually does
        const W = 10, prof = [];
        for (let w = 0; w < W; w++) {
            const a = (span * w) / W, b = (span * (w + 1)) / W;
            const live = this.result.notes.filter(n => n.tStart < b && n.tStart + n.dur > a);
            prof.push(live.length
                ? live.reduce((s, n) => s + n.level[n.level.length - 1][1], 0) / live.length
                : 0.6);
        }
        const nds = prof.map((y, i) => ({ pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
            y: Math.max(0.4, Math.min(10, Math.round(y * 10) / 10)), smooth: 0.35 }));
        nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
        nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });
        C.objects.push({
            id: 'wc-morphmeta-' + seq, type: 'waveCurve', layer: 10, groupId: gid,
            startSeconds: +at.toFixed(3), endSeconds: +(at + span).toFixed(3),
            nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
            color: '#7E57C2', fillMode: 'bottom', opacity: 0.45,
            performanceNotes: 'MORPH ' + this.result.meta.model +
                ' contour (drag = move, edge/box = stretch)', properties: {},
        });
        C.nextId = (C.nextId || 1) + objs.length + 4;
        if (C.renderAll) C.renderAll();
        if (C.markDirty) C.markDirty();
        if (C.scheduleConflictRefresh) C.scheduleConflictRefresh();
        this.setStatus('inserted ' + objs.length + ' notes at ' + at.toFixed(2) + ' s as ' + gid);
    },

    setStatus(msg, bad, html) {
        const s = this.el.querySelector('#morphStatus');
        if (!s) return;
        s.style.color = bad ? '#e06666' : '#9a9';
        if (html) s.innerHTML = msg; else s.textContent = msg;
    },
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => PANEL.init());
else PANEL.init();
root.MorphPanel = PANEL;
}(typeof self !== 'undefined' ? self : this));
