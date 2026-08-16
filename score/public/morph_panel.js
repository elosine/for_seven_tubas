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
            '<div style="display:flex;gap:6px;flex-wrap:wrap">',
            '<button id="morphGen">Generate</button>',
            '<button id="morphPlay">Play</button>',
            '<button id="morphStop">Stop</button>',
            '<button id="morphIns" title="insert at the playhead as a group">Insert @ cursor</button>',
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

    toggle(force) {
        const show = force != null ? force : this.el.style.display === 'none';
        this.el.style.display = show ? '' : 'none';
        if (show) { this.el.focus(); this.refresh(true); } else { E.panic(); }
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
        const merged = this.readFields(p);
        try {
            this.result = M.render(merged, {
                maxVoices: 10,
                sampleLengths: (root.Composer && root.Composer.sampleLen) || null,
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
        row('span (s)', 'carrier.span', p.carrier.span, 1);
        row('segment (s)', 'carrier.segLen', p.carrier.segLen, 0.5);
        row('bias  −1…+1', 'dials.bias', p.dials.bias, 0.1);
        row('spread 0…1', 'dials.spread', p.dials.spread, 0.1);
        row('depth 0…1', 'dials.depth', p.dials.depth, 0.1);
        row('dyn amount', 'dyn.amount', p.dyn.amount, 0.05);
        row('seed', 'seed', p.seed, 1);

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
        this.el.querySelectorAll('#morphFields input').forEach(i => {
            const parts = i.dataset.path.split('.');
            let o = merged;
            for (let k = 0; k < parts.length - 1; k++) { o[parts[k]] = o[parts[k]] || {}; o = o[parts[k]]; }
            const v = parseFloat(i.value);
            if (!isNaN(v)) o[parts[parts.length - 1]] = v;
        });
        return merged;
    },

    // ------------------------------------------------------------- transport
    play() {
        if (!this.result) this.generate();
        if (!this.result) return;
        const n = E.play(this.result, {});
        this.el.querySelector('#morphPlay').textContent = 'Playing…';
        if (!n) this.setStatus('nothing sounded — are the MIDI ports open?', true);
    },

    insert() {
        const C = root.Composer;
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
        // it drags and scales as one unit
        const span = this.result.meta.span;
        C.objects.push({
            id: 'mk-morph-' + seq, type: 'marker', layer: 0, time: +at.toFixed(3),
            label: 'MORPH ' + this.result.meta.model + (p.label ? ' — ' + p.label : ''),
            color: '#7E57C2', groupId: gid, performanceNotes: '', properties: {},
        });
        objs.forEach(o => C.objects.push(o));
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
