// texture_panel.js — PLAN 2x §3.2, the Texture panel.
//
// THE PANEL GENERATES, AUDITIONS AND INSERTS. IT NEVER EDITS. (R10)
// No selection, no drag, no per-note anything. That boundary is a design rule,
// not a preference: the cluster sandbox's piano-roll editor cost ~80% of that
// build, and a liked texture is RE-GENERATED from its parameters rather than
// cut and patched. New interaction wishes go to NITS, not in here.
//
// It injects its own button and DOM, so composer.html only has to load two
// scripts — the diff in a file two agents share stays at two lines.
//
// PREVIEW STATE NEVER TOUCHES THE SCORE. Autosave writes the loaded score every
// 5 s, so a preview living in Composer.objects would be a data-loss bug (see the
// autosave-overwrites-loaded-score history). The render lives in a local var
// until the composer presses Insert.
//
// D29: ATTACK FIELDS ONLY — this panel never sends a pitch bend. Bend-based work
// is the Morph panel's (2v). The two layer freely in the score.

(function (root) {
'use strict';

// `const Composer = {...}` in composer.html is a LEXICAL global: visible to every
// classic script by bare identifier, but NOT a property of window. Reaching for
// it as `root.Composer` silently yields undefined, which makes every MIDI route
// resolve to null and produces a "nothing sounded" that has nothing to do with
// MIDI. Always go through here. (Trap documented in morph_emit.js's header.)
function HOST() { return (typeof Composer !== 'undefined') ? Composer : null; }

const TX = root.Texture, E = root.MorphEmit;
if (!TX || !E) { console.warn('[texture_panel] needs texture_engine.js + morph_emit.js'); return; }

const PANEL = {
    el: null, rev: -1, params: null, models: null,
    active: 'A', result: null, spec: null, poll: null,
    pinned: null, abSide: 'cur', humanized: false, timing: null,

    // ---------------------------------------------------------------- boot
    init() {
        // anchor after the Morph button if it exists, else after Insertion —
        // both are stable ids, and neither is a line number (plan §15.8)
        const host = document.getElementById('morphBtn') || document.getElementById('blastsBtn');
        if (!host) { console.warn('[texture_panel] no button to anchor to'); return; }
        const btn = document.createElement('button');
        btn.id = 'textureBtn';
        btn.textContent = 'Texture';
        btn.title = 'attack-field textures: summon a category, hear it, step seeds, A/B, insert (never edits)';
        btn.addEventListener('click', () => this.toggle());
        host.parentNode.insertBefore(btn, host.nextSibling);
        this.build();
        this.startPolling();
    },

    build() {
        const d = document.createElement('div');
        d.id = 'texturePanel';
        d.style.cssText = [
            'position:fixed', 'right:16px', 'top:96px', 'width:360px', 'z-index:9000',
            'background:rgba(28,28,32,0.97)', 'border:1px solid #3F7D5A', 'border-radius:6px',
            'padding:10px 12px', 'color:#ddd', 'font:11px/1.45 system-ui,sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.5)', 'display:none',
        ].join(';');
        d.innerHTML = [
            '<div id="texDrag" style="cursor:move;font-weight:600;color:#8fd6ab;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'background:rgba(63,125,90,0.20)">TEXTURE',
            '<span id="texClose" style="float:right;cursor:pointer;color:#888">&#10005;</span></div>',
            '<div id="texStatus" style="color:#9a9;margin-bottom:7px">idle</div>',
            '<div id="texTabs" style="margin-bottom:6px"></div>',
            '<div id="texModels" style="margin-bottom:8px"></div>',
            '<div id="texFields" style="max-height:250px;overflow:auto;margin-bottom:8px"></div>',
            '<div id="texFlags" style="max-height:110px;overflow:auto;margin-bottom:8px"></div>',
            // FIXED COLUMNS, not flex. The Play button's label changes while it
            // runs; in a flex row that reflows everything to the right, and the
            // composer reached for Stop and hit Insert instead (2v, 2026-08-16).
            // A transport control must never move under the pointer.
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">',
            '<button id="texGen">Generate</button>',
            '<button id="texPlay" style="overflow:hidden;white-space:nowrap">Play</button>',
            '<button id="texStop">Stop</button>',
            '</div>',
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">',
            '<button id="texPin" title="pin this render as the reference for A/B">Pin</button>',
            '<button id="texAB" title="flip playback between pinned and current, back-to-back">A/B</button>',
            '<button id="texHum" title="re-render with stage + human timing error and A/B it against the clean one">Humanize</button>',
            '</div>',
            // MORPH (§7): a category morph is a dial morph between two models.
            // The panel exposes only the two-point case; the engine speaks full
            // breakpoint lists, so batteries and pockets get the general form.
            '<div style="display:flex;gap:5px;align-items:center;margin-top:6px">',
            '<span style="color:#9a9">morph</span>',
            '<select id="texMorphTo" style="flex:1;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px"></select>',
            '<span style="color:#9a9">over</span>',
            '<input id="texMorphSec" type="number" value="30" step="5" style="width:48px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 4px">',
            '<span style="color:#9a9">s</span>',
            '<button id="texMorphGo" title="morph the current dials into the chosen model over N seconds">go</button>',
            '</div>',
            '<div style="margin-top:6px">',
            '<button id="texIns" style="width:100%"',
            ' title="insert at the playhead as a draggable group">Insert @ cursor</button>',
            '</div>',
            '<div style="color:#666;margin-top:7px">SPACE play/stop &middot; &larr;/&rarr; variant',
            ' &middot; &uarr;/&darr; seed &middot; P pin &middot; A flip &middot; H humanize &middot; G generate',
            ' &mdash; only while this panel has focus</div>',
            '<div id="texHelp" style="color:#666;margin-top:4px"></div>',
        ].join('');
        document.body.appendChild(d);
        this.el = d;

        d.querySelector('#texClose').addEventListener('click', () => this.toggle(false));
        d.querySelector('#texGen').addEventListener('click', () => this.generate());
        d.querySelector('#texPlay').addEventListener('click', () => this.play());
        d.querySelector('#texStop').addEventListener('click', () => E.panic());
        d.querySelector('#texPin').addEventListener('click', () => this.pin());
        d.querySelector('#texAB').addEventListener('click', () => this.flip());
        d.querySelector('#texHum').addEventListener('click', () => this.humanize());
        d.querySelector('#texIns').addEventListener('click', () => this.insert());
        d.querySelector('#texMorphGo').addEventListener('click', () => this.morphTo());
        this.makeDraggable(d, d.querySelector('#texDrag'));

        // Keys are scoped to the panel: composer.html has global handlers and a
        // stray SPACE here must not fight the transport (plan §15.11).
        d.setAttribute('tabindex', '0');
        d.addEventListener('keydown', e => {
            if (e.target.matches('input,select,textarea')) return;
            const k = e.key;
            const take = () => { e.preventDefault(); e.stopPropagation(); };
            if (k === ' ') { take(); E.isPlaying() ? E.panic() : this.play(); }
            else if (k === 'ArrowLeft' || k === 'ArrowRight') {
                take();
                const keys = this.variantKeys();
                if (!keys.length) return;
                const i = keys.indexOf(this.active) + (k === 'ArrowRight' ? 1 : -1);
                this.active = keys[(i + keys.length) % keys.length];
                this.humanized = false;
                this.generate();
            } else if (k === 'ArrowUp' || k === 'ArrowDown') {
                // SEED STEPPING (R5) — at ten voices a jitter/scatter setting is a
                // LOTTERY, not a texture: each render is one draw from it, and the
                // phantom "accents" in the research came from judging single draws.
                // Stepping the seed answers "is this the setting, or just this
                // draw?" — and "a different gallop" is literally a new seed.
                take();
                this.stepSeed(k === 'ArrowUp' ? 1 : -1);
            } else if (k === 'p' || k === 'P') { take(); this.pin(); }
            else if (k === 'a' || k === 'A') { take(); this.flip(); }
            else if (k === 'h' || k === 'H') { take(); this.humanize(); }
            else if (k === 'g' || k === 'G') { take(); this.generate(); }
        });
        // CHAIN, never overwrite. `E.onStop` is a single slot on a layer BOTH
        // panels share: the Morph panel sets it to reset its own Play button, and
        // a plain assignment here would silently leave that button reading
        // "Playing…" forever after any texture stop (and vice versa, depending on
        // script order). Two panels, one emit layer — so cooperate with whatever
        // is already there instead of assuming we are alone.
        const prevOnStop = E.onStop;
        E.onStop = () => {
            if (prevOnStop) { try { prevOnStop(); } catch (e) {} }
            const b = d.querySelector('#texPlay');
            if (b) b.textContent = 'Play';
        };
    },

    makeDraggable(box, handle) {
        let sx = 0, sy = 0, bx = 0, by = 0, on = false;
        handle.addEventListener('mousedown', e => {
            if (e.target.id === 'texClose') return;
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
    // at OPEN time and reported loudly by name. A wrong assumption about the host
    // must fail HERE, not as silence three layers down at Play time. (The 2v
    // lesson: `window.Composer` was undefined, every route resolved to null, and
    // the panel reported a MIDI problem that did not exist.)
    preflight() {
        const C = HOST();
        const bad = [];
        if (!C) bad.push('Composer not reachable (lexical global — use HOST())');
        else {
            if (typeof C.trackInstrument !== 'function') bad.push('Composer.trackInstrument missing');
            else if (!C.trackInstrument(0)) bad.push('Composer.trackInstrument(0) returned nothing');
            if (!Array.isArray(C.objects)) bad.push('Composer.objects is not an array');
            if (typeof C._zoneMidiOutputs !== 'object') bad.push('Composer._zoneMidiOutputs missing');
            if (!C.sampleLen) bad.push('Composer.sampleLen missing (ring lengths — clamping and playability need it)');
        }
        if (typeof TX.render !== 'function') bad.push('texture_engine.js missing');
        if (typeof E.routeFor !== 'function') bad.push('morph_emit.js missing');
        this._preflight = bad;
        if (bad.length) console.error('[texture] PREFLIGHT FAILED:', bad);
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
    // The AI writes bank/texture_params.json and bumps `rev`; the panel notices
    // within a second and regenerates. No websocket, no connection state, and it
    // survives a page reload (plan §3.3). `autoplay` is absent BY DESIGN — sound
    // only ever on the composer's SPACE or Play.
    startPolling() {
        this.poll = setInterval(() => {
            if (this.el.style.display !== 'none') this.refresh(false);
        }, 1000);
    },
    async refresh(force) {
        try {
            if (!this.models || force) {
                const m = await fetch('/api/texturemodels', { cache: 'no-store' });
                this.models = await m.json();
            }
            const r = await fetch('/api/textureparams', { cache: 'no-store' });
            const j = await r.json();
            if (!force && j.rev === this.rev) return;
            const revChanged = j.rev !== this.rev;
            this.rev = j.rev;
            this.params = j;
            const keys = this.variantKeys();
            // HONOUR `active` ON A REV BUMP. A new rev is a deliberate AI write —
            // "here is the new slate, and this is the one I mean" — so the panel
            // must land on it. Only inheriting `active` when the current tab had
            // gone invalid (the 2v behaviour) meant the composer sat on A reading
            // A's dials while the AI was describing B, which quietly defeats the
            // whole conversational loop. Found by running the loop, not by
            // reading it. On an ordinary poll with no rev change, the composer's
            // tab is theirs and nothing moves.
            if (revChanged && j.active && keys.indexOf(j.active) >= 0) this.active = j.active;
            if (keys.indexOf(this.active) < 0) this.active = keys[0];
            this.humanized = false;
            this.pinned = null;      // a new slate invalidates the old reference
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
        if (!p || !p.spec) { this.setStatus('no variant', true); return; }
        // THE FIELDS BELONG TO A VARIANT. Reading them blindly merges the PREVIOUS
        // variant's dials into the new one, so switching A→B auditions B at A's
        // seed and A's density — and it sticks, because draw() then redraws the
        // fields from the already-wrong merge. Every cross-variant comparison is
        // then of the wrong thing. (Found in 2v, 2026-08-16; same shape here.)
        // So: nudges persist while you stay put; changing variant, or the AI
        // rewriting the params file, resets to what the file actually says.
        const stamp = this.active + '@' + this.rev;
        const merged = (this._fieldStamp === stamp && this.spec)
            ? this.readFields()
            : JSON.parse(JSON.stringify(p.spec));
        this._fieldStamp = stamp;
        this.spec = merged;
        this.renderSpec(merged);
    },

    renderSpec(spec) {
        try {
            this.result = TX.render(spec, {
                maxLanes: 10,
                sampleLengths: (HOST() && HOST().sampleLen) || null,
                tonality: root.Tonality || null,
                humanize: this.humanized ? this.humanizeSettings() : null,
            });
        } catch (e) {
            this.setStatus('render failed: ' + e.message, true);
            console.error(e); return;
        }
        this.draw(spec);
    },

    humanizeSettings() {
        return { stageMs: TX.HUMANIZE.stageMs, jitterMs: TX.HUMANIZE.jitterMs,
                 seed: (this.spec && this.spec.seed) || 1 };
    },

    stepSeed(delta) {
        if (!this.spec) return;
        this.spec.seed = Math.max(0, (this.spec.seed || 0) + delta);
        this.renderSpec(this.spec);
        if (!this.seedIsLive(this.spec)) {
            this.setStatus('seed ' + this.spec.seed + ' — INERT for this texture: no stochastic dial is' +
                ' engaged (scatter 0, jitter 0), so there is only one draw. Raise jitter or scatter' +
                ' and the seed becomes the draw number.', true);
        }
    },

    // A seed only means something if SOMETHING is drawn from it. A two-tempo
    // gallop with scatter 0 and jitter 0 is fully determined, so stepping its
    // seed is a no-op — and an interface that silently does nothing is worse
    // than one that refuses. Say so instead (AI_METHODOLOGY rule 3: never
    // silently refuse, never silently discard).
    seedIsLive(spec) {
        return (spec.sections || []).some(sec =>
            (sec.voices || []).some(g => (g.scatter || 0) > 0 || (g.jitterMs || 0) > 0));
    },

    // R9 — every render is self-describing. If a variant carries no label, one is
    // composed from the dials that actually moved, in plain language, so a render
    // is never anonymous and the numbers stay learnable (§6's two-sided contract).
    autoLabel(spec) {
        const v = ((spec.sections || [])[0] || {}).voices || [];
        if (!v.length) return spec.name || 'texture';
        const parts = v.map((g, i) => {
            const n = g.players || (g.lanes || []).length || 1;
            const rate = (n * (g.bpm || 100) / 60).toFixed(1);
            const bits = [n + ' tubas', rate + '/s'];
            if (g.jitterMs) bits.push('jitter ' + g.jitterMs + ' ms');
            if (g.scatter) bits.push('scatter ' + g.scatter);
            bits.push(g.articulation || g.tech || 'staccato');
            return (v.length > 1 ? 'group ' + (i + 1) + ': ' : '') + bits.join(' · ');
        });
        return parts.join('  |  ');
    },

    draw(spec) {
        const r = this.result;
        const m = (r.report[0] && r.report[0].metrics) || { sd: 0, unevenness: 0, n: 0 };
        const p = this.current() || {};
        const dens = r.report.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.composite, 0), 0)
                     / Math.max(1, r.report.length);
        const label = p.label || this.autoLabel(spec);
        // THE CEILING FOLLOWS THE PITCH SET, it is not the flat 23/s. That figure
        // is C3-specific — the whole research arc ran on one C3, which is among
        // the SHORTEST staccato samples — so a texture given real pitches has a
        // lower ceiling than the one the composer calibrated by ear.
        const ceil = r.ceiling ? r.ceiling.rate : TX.RAILS.density[1];
        const amber = dens > ceil;

        this.setStatus(
            'v' + this.rev + ' &middot; ' + this.active + (this.humanized ? ' &middot; <b style="color:#8fd6ab">H</b>' : '') +
            ' &middot; "' + label + '"<br>seed <b>' + (spec.seed != null ? spec.seed : '—') + '</b>' +
            (this.seedIsLive(spec) ? '' : ' <span style="color:#777">(inert — nothing stochastic)</span>') +
            ' &middot; ' + (amber ? '<span style="color:#e0b062">' : '') + dens.toFixed(1) + '/s' +
            (amber ? ' &#9888; past the ' + ceil.toFixed(1) + '/s ceiling for this pitch set</span>'
                   : '<span style="color:#777"> of ' + ceil.toFixed(1) + '</span>') +
            ' &middot; sd ' + m.sd.toFixed(1) + ' ms &middot; unev ' + m.unevenness.toFixed(2) +
            ' &middot; ' + r.notes + ' notes<br>' +
            (r.summary.hard ? '<b style="color:#e06666">&#9888; ' + r.summary.hard + ' hard</b> / ' : '&#9888; 0 hard / ') +
            (r.summary.soft ? '<span style="color:#e0b062">' + r.summary.soft + ' soft</span>' : '0 soft') +
            (this.pinned ? ' &middot; <span style="color:#8a8ac0">pinned: ' + this.pinned.tag + '</span>' : ''),
            false, true);

        // ---- variant tabs
        const tabs = this.el.querySelector('#texTabs');
        tabs.innerHTML = '';
        this.variantKeys().forEach(k => {
            const b = document.createElement('button');
            b.textContent = k;
            b.style.cssText = 'margin-right:4px;' + (k === this.active
                ? 'background:#3F7D5A;color:#fff;border-color:#6fb98f' : '');
            b.addEventListener('click', () => {
                this.active = k; this.humanized = false; this.generate();
            });
            tabs.appendChild(b);
        });

        // ---- category buttons: the five MODELS (§5). Loading one replaces the
        // dials with its point; the dials stay visible and editable (R1 — numbers
        // never hidden, never the primary interface).
        const mods = this.el.querySelector('#texModels');
        mods.innerHTML = '<span style="color:#9a9;margin-right:5px">model:</span>';
        const store = (this.models && this.models.models) || {};
        Object.keys(store).forEach(name => {
            const b = document.createElement('button');
            b.textContent = name.toLowerCase();
            b.title = store[name].heard || name;
            b.style.cssText = 'margin-right:3px;font-size:10px;padding:1px 5px';
            b.addEventListener('click', () => {
                this.spec = JSON.parse(JSON.stringify(store[name].spec));
                this._fieldStamp = null;      // the model IS the truth now, not the fields
                this.humanized = false;
                this.renderSpec(this.spec);
            });
            mods.appendChild(b);
        });
        // keep the morph destination list in step with the model store
        const msel = this.el.querySelector('#texMorphTo');
        if (msel && msel.options.length !== Object.keys(store).length) {
            const keep = msel.value;
            msel.innerHTML = '';
            Object.keys(store).forEach(n => {
                const o = document.createElement('option');
                o.value = n; o.textContent = n.toLowerCase();
                msel.appendChild(o);
            });
            if (keep) msel.value = keep;
        }

        // ---- dials, per voice group
        const f = this.el.querySelector('#texFields');
        f.innerHTML = '';
        const head = t => {
            const h = document.createElement('div');
            h.style.cssText = 'color:#8fd6ab;margin:6px 0 2px;border-top:1px solid #3a3a44;padding-top:4px';
            h.textContent = t; f.appendChild(h);
        };
        const row = (label, path, val, step, rail) => {
            const w = document.createElement('div');
            w.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:2px 0';
            const out = (rail && (val < rail[0] || val > rail[1]));
            w.innerHTML = '<span style="color:' + (out ? '#e0b062' : '#9a9') + '">' + label +
                (out ? ' &#9888;' : '') + '</span>';
            const i = document.createElement('input');
            i.type = 'number'; i.step = step; i.value = val; i.dataset.path = path;
            i.style.cssText = 'width:74px;background:#1b1b20;color:#ddd;border:1px solid ' +
                (out ? '#7a5a2a' : '#444') + ';padding:1px 4px';
            i.addEventListener('change', () => { this.humanized = false; this.generate(); });
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
            s.addEventListener('change', () => { this.humanized = false; this.generate(); });
            w.appendChild(s); f.appendChild(w);
        };

        row('seed', 'seed', spec.seed != null ? spec.seed : 1, 1);
        const secs = spec.sections || [];
        secs.forEach((sec, si) => {
            row('duration (s)', 'sections.' + si + '.dur', sec.dur, 1);
            (sec.voices || []).forEach((g, gi) => {
                const base = 'sections.' + si + '.voices.' + gi + '.';
                head(secs.length > 1 ? 'section ' + (si + 1) + ' · group ' + (gi + 1)
                                     : 'group ' + (gi + 1) +
                                       ((sec.voices.length > 1) ? '' : ' — the dials'));
                row('players', base + 'players', g.players != null ? g.players : (g.lanes || []).length,
                    1, TX.RAILS.players);
                row('bpm (per player)', base + 'bpm', g.bpm, 1);
                row('scatter 0…1', base + 'scatter', g.scatter || 0, 0.05, TX.RAILS.scatter);
                row('jitter (ms)', base + 'jitterMs', g.jitterMs || 0, 5, TX.RAILS.jitterMs);
                sel('articulation', base + 'articulation',
                    g.articulation || g.tech || 'staccato',
                    ['staccato', 'ord', 'flz', 'fortepiano', 'cuivre']);
                row('note length (s)', base + 'notelen', g.notelen != null ? g.notelen : 0.12, 0.02);
                row('level 0…10', base + 'level', g.level != null ? g.level : 7.5, 0.5);
                // ---- PITCH (§8). The badge and the ceiling recompute on EVERY
                // change here — that is the 2u lesson as a hard requirement:
                // re-pitching changes playability, and a variant with conflicts
                // sounds perfectly fine in the mock-up (2r), so the numbers have
                // to move WHILE you are choosing, not after you have chosen.
                const gp = g.pitch || {};
                sel('pitch policy', base + 'pitch.policy', gp.policy || 'unison', TX.PITCH_POLICIES);
                row('root (MIDI)', base + 'pitch.root', gp.root != null ? gp.root : 48, 1);
                const sets = ['— none (root only) —'].concat(root.Tonality ? root.Tonality.names() : []);
                sel('tonality set', base + 'pitch.set', gp.set || sets[0], sets);
                sel('pooled / literal', base + 'pitch.pool',
                    (gp.pool === false ? 'literal' : 'pooled'), ['pooled', 'literal']);
            });
        });

        // ---- flags, in 2r's existing red/amber vocabulary — no new colours
        const fl = this.el.querySelector('#texFlags');
        fl.innerHTML = '';
        if (r.unknown.length) {
            fl.innerHTML += '<div style="color:#e0b062">unrecognised keys (ignored, not applied): ' +
                r.unknown.join(', ') + '</div>';
        }
        // a named set that did not resolve is LOUD — rendering quietly at the
        // root pitch would look exactly like the set having been applied
        if ((r.unresolvedSets || []).length) {
            fl.innerHTML += '<div style="color:#e06666">&#9888; pitch set not found: ' +
                r.unresolvedSets.join(', ') + ' — rendered at the root pitch instead.</div>';
        }
        if (r.clamps.length) {
            fl.innerHTML += '<div style="color:#e0b062">clamped: ' + r.clamps.join(' · ') + '</div>';
        }
        // SAMPLE RING — the conflict the badge structurally cannot show, and the
        // one the mock-up plays perfectly cleanly (2r: technique = MIDI channel,
        // so two attacks on one player go out on two UVI voices and both sound).
        // At the density ceiling this is the only thing between a texture and an
        // unplayable one, so it gets the loudest line in the panel.
        (r.rings || []).forEach(x => {
            fl.innerHTML += '<div style="color:#e06666">&#9888; SAMPLE RING &middot; ' +
                x.players + ' players re-attack every <b>' + x.tightest.toFixed(2) +
                ' s</b> but ' + x.tech + ' rings <b>' + x.ring + ' s</b> (over by ' +
                x.overBy.toFixed(2) + ' s) — the mock-up will play this cleanly and the hall will not.' +
                '</div>';
        });
        const rows = r.summary.pairs.slice(0, 30);
        if (!rows.length && !r.unknown.length && !r.clamps.length && !(r.rings || []).length) {
            fl.innerHTML = '<div style="color:#6a6">no flags</div>';
        }
        rows.forEach(x => {
            fl.innerHTML += '<div style="color:' + (x.tier === 'hard' ? '#e06666' : '#e0b062') + '">T' +
                (x.layer + 1) + ' &middot; ' + x.at.toFixed(2) + ' s &middot; ' + x.tier +
                ' &middot; ' + x.a + ' → ' + x.b + '</div>';
        });

        this.drawHelp();
    },

    // §15.13 — the escape hatch, said where it will be read. The audition
    // schedules with setTimeout-class timers and 23 attacks/s is a 43 ms grid, so
    // a dense texture CAN sound worse than it is. The panel measures its own
    // timing on every play (below) so this is a number, not a worry.
    drawHelp() {
        const h = this.el.querySelector('#texHelp');
        if (!h) return;
        const t = this.timing;
        h.innerHTML = t
            ? ('last play: <b>' + t.scheduled + '</b> notes · timing drift mean ' +
               t.mean.toFixed(1) + ' ms, max ' + t.max.toFixed(1) + ' ms' +
               (t.max > 15 ? '<br><span style="color:#e0b062">⚠ drift is audible at this density — ' +
                 'A/B against Reaper before blaming the material: ' +
                 '<code>node tools/phase_shift.js --fromModel &lt;NAME&gt; --midi</code></span>' : ''))
            : 'browser timers do the scheduling — after a play, the measured drift appears here.';
    },

    readFields() {
        const merged = JSON.parse(JSON.stringify(this.spec));
        const setPath = (path, val) => {
            const parts = path.split('.');
            let o = merged;
            for (let k = 0; k < parts.length - 1; k++) {
                if (o[parts[k]] == null) o[parts[k]] = {};
                o = o[parts[k]];
            }
            o[parts[parts.length - 1]] = val;
        };
        this.el.querySelectorAll('#texFields input').forEach(i => {
            const v = parseFloat(i.value);
            if (!isNaN(v)) setPath(i.dataset.path, v);
        });
        this.el.querySelectorAll('#texFields select').forEach(s => {
            // two selects carry non-string meanings; everything else is literal
            if (/\.pitch\.pool$/.test(s.dataset.path)) setPath(s.dataset.path, s.value === 'pooled');
            else if (/\.pitch\.set$/.test(s.dataset.path)) {
                setPath(s.dataset.path, s.value.indexOf('none') >= 0 ? null : s.value);
            } else setPath(s.dataset.path, s.value);
        });
        return merged;
    },

    // ------------------------------------------------------------- transport
    //
    // AUDITION. Reuses morph_emit.js for everything that is dangerous —
    // `ensureMidi` (Web MIDI needs a user gesture, and the app inits lazily),
    // `routeFor` (D2: technique → channel, staccato on the `b` UVI instance),
    // `noteOn/noteOff` (which maintain the registry), and `panic()` (the VERIFIED
    // stop sequence). What it does NOT reuse is `E.play()`, because that layer is
    // built for morphs: it pre-arms a pitch bend per note and drives dynamics
    // through a per-frame CC7 envelope. Texture notes are PLAIN velocity notes
    // with CC7 pinned (plan §15.10, D12/the clusterview position) and D29 forbids
    // bend outright, so scheduling here is ~20 lines rather than a fork of the
    // hygiene. This is the plan's pre-decided fallback (§3.2), improved: the
    // registry and panic stay shared, so there is still exactly one stop path.
    async play(which) {
        const src = (which === 'pin' && this.pinned) ? this.pinned : { result: this.result, tag: 'current' };
        if (!src.result) { this.generate(); src.result = this.result; }
        if (!src.result) return;

        const btn = this.el.querySelector('#texPlay');
        btn.textContent = 'starting…';
        E.panic();
        if (!await E.ensureMidi()) {
            btn.textContent = 'Play';
            this.setStatus(E._midiError || 'MIDI unavailable', true);
            return;
        }

        const notes = src.result.objects
            .filter(o => o.type === 'waveCurve')
            .sort((a, b) => a.startSeconds - b.startSeconds);
        if (!notes.length) { btn.textContent = 'Play'; this.setStatus('nothing rendered', true); return; }

        const t0 = notes[0].startSeconds;
        const routes = {};
        const drift = [];
        let skipped = 0;
        const missing = {};

        // Correct each delay for the time the scheduling loop itself takes. At the
        // 23/s ceiling this loop places ~900 timers, and without the correction
        // every note scheduled late in the loop would fire late by however long
        // the loop had been running — a systematic ramp, not noise.
        const base = performance.now();

        notes.forEach(n => {
            const route = E.routeFor(n.layer, n.technique);
            if (!route) {
                skipped++;
                const C = HOST();
                const inst = C && C.trackInstrument ? C.trackInstrument(n.layer) : null;
                missing[(inst && inst.port) || ('lane ' + n.layer)] = 1;
                return;
            }
            routes[route.port + '|' + route.ch] = route;
            const onMs = (n.startSeconds - t0) * 1000;
            const offMs = (n.endSeconds - t0) * 1000;
            const key = n.sonifyNote, vel = n.recVel;
            E._timers.push(setTimeout(() => {
                drift.push(performance.now() - base - onMs);
                E.noteOn(route, key, vel);
            }, Math.max(0, onMs - (performance.now() - base))));
            E._timers.push(setTimeout(() => E.noteOff(route, key),
                Math.max(0, offMs - (performance.now() - base))));
        });

        if (!Object.keys(routes).length) {
            btn.textContent = 'Play';
            this.setStatus('no MIDI port for ' + Object.keys(missing).join(', ') +
                ' — is loopMIDI running with those ports open?', true);
            return;
        }

        // CC7 PINNED. Dynamics ride VELOCITY for this material (D12, and the
        // proven path: phase01–13 were auditioned as plain notes). CC7 is left
        // wherever the score last put it otherwise — a hairpin the composer just
        // played would quietly re-scale the whole texture. panic() only restores
        // CC7 on channels it BENT, and we never bend, so pinning is ours to do.
        // This is the one documented spot to convert if 2q resolves the other way.
        Object.keys(routes).forEach(k => {
            const r = routes[k];
            try { r.out.send([0xB0 | r.ch, 7, 127]); } catch (e) {}
        });

        const span = TX.spanOf(src.result) * 1000 + 600;
        E._playing = true;
        E._timers.push(setTimeout(() => {
            this.timing = drift.length
                ? { scheduled: drift.length,
                    mean: drift.reduce((a, b) => a + Math.abs(b), 0) / drift.length,
                    max: Math.max.apply(null, drift.map(Math.abs)) }
                : null;
            E.panic();
            this.drawHelp();
        }, span));

        btn.textContent = 'Playing…';
        this.setStatus('playing ' + (notes.length - skipped) + ' notes · ' + src.tag +
            (skipped ? ' (' + skipped + ' had no port)' : ''));
    },

    // MORPH TO A MODEL (§7). A CATEGORY MORPH IS A DIAL MORPH BETWEEN TWO
    // MODELS — there is no separate morph machinery, which is why "rain becoming
    // a groove" and "jitter falling while scatter rises" are the same object.
    // Only the dials that actually DIFFER get a curve, so the resulting spec
    // reads as a list of what changed (the §6 two-sided contract, in data form).
    //
    // Where a pair SNAPS instead of crossfading (phase06 heard rain->stutter
    // snap), that is a finding to record per pair, not a bug to fix.
    morphTo() {
        if (!this.spec) return;
        const name = this.el.querySelector('#texMorphTo').value;
        const store = (this.models && this.models.models) || {};
        const dest = store[name];
        if (!dest) { this.setStatus('unknown model ' + name, true); return; }
        const secs = Math.max(1, parseFloat(this.el.querySelector('#texMorphSec').value) || 30);

        const spec = JSON.parse(JSON.stringify(this.spec));
        const dv = ((dest.spec.sections || [])[0] || {}).voices || [];
        const moved = [];
        (spec.sections || []).forEach(sec => {
            sec.dur = secs;
            (sec.voices || []).forEach((g, gi) => {
                const to = dv[Math.min(gi, dv.length - 1)] || {};
                const cur = {
                    bpm: g.bpm, jitterMs: g.jitterMs || 0,
                    scatter: g.scatter || 0, level: g.level != null ? g.level : 7.5,
                };
                const tgt = {
                    bpm: to.bpm != null ? to.bpm : cur.bpm,
                    jitterMs: to.jitterMs != null ? to.jitterMs : 0,
                    scatter: to.scatter != null ? to.scatter : 0,
                    level: to.level != null ? to.level : cur.level,
                };
                const curves = {};
                Object.keys(cur).forEach(k => {
                    if (Math.abs(cur[k] - tgt[k]) < 1e-9) return;
                    curves[k] = [{ t: 0, value: cur[k] }, { t: secs, value: tgt[k] }];
                    if (gi === 0) moved.push(k + ' ' + cur[k] + '→' + tgt[k]);
                });
                g.curves = Object.keys(curves).length ? curves : null;
            });
        });
        spec.name = (spec.name || 'texture') + '-to-' + name.toLowerCase();
        this.spec = spec;
        this._fieldStamp = null;
        this.humanized = false;
        this.renderSpec(spec);
        this.setStatus(moved.length
            ? ('morphing into ' + name + ' over ' + secs + ' s — moving: ' + moved.join(' · '))
            : ('nothing to morph: the current dials already match ' + name), !moved.length);
    },

    // PIN / A-B (plan §9) — the fix for ORDER EFFECTS. In the research batteries
    // the same setting drew opposite verdicts at different positions, because the
    // ear drifts across a long battery. P pins the current render as the
    // reference; A flips playback between pinned and current, back-to-back, in
    // the same position. Every comparison becomes pairwise and immediate: change
    // ONE thing — a dial, or only the seed — and flip.
    pin() {
        if (!this.result) return;
        const p = this.current() || {};
        this.pinned = {
            result: this.result,
            tag: (this.humanized ? 'H · ' : '') + this.active + ' seed ' +
                 ((this.spec && this.spec.seed) != null ? this.spec.seed : '?'),
            label: p.label || this.autoLabel(this.spec),
        };
        this.abSide = 'cur';
        this.draw(this.spec);
        this.setStatus('pinned: ' + this.pinned.tag + ' — press A to flip against it');
    },
    flip() {
        if (!this.pinned) { this.setStatus('nothing pinned — press P first', true); return; }
        this.abSide = this.abSide === 'cur' ? 'pin' : 'cur';
        this.play(this.abSide);
    },

    // HUMANIZE (plan §9, R6) — the robustness pass. Re-renders the CURRENT spec
    // with the stage + human error model overlaid, auto-pinning the clean render
    // so A flips straight between them. The standing performance rule is that no
    // texture may depend on precise timing, so a keeper cannot be banked without
    // a verdict here (that gate lands with the stores in Phase 4).
    humanize() {
        if (!this.spec) return;
        if (this.humanized) {                    // toggle back to clean
            this.humanized = false;
            this.renderSpec(this.spec);
            this.setStatus('clean render — press H again for the humanized one');
            return;
        }
        this.pin();                              // the clean render becomes the reference
        this.humanized = true;
        this.renderSpec(this.spec);
        this.setStatus('HUMANIZED: stage ±' + TX.HUMANIZE.stageMs + ' ms (fixed, where they stand)' +
            ' + human ±' + TX.HUMANIZE.jitterMs + ' ms (per attack). Both are ESTIMATES.' +
            ' Press A to flip against the clean render.');
    },

    // ---------------------------------------------------------------- insert
    // 2w placement conventions: a groupId so it drags and scales as one unit, the
    // engine's own plain-language markers (R9), and a META shape on layer 10 so
    // there is something to GRAB. The META shape was missing in 2v's first
    // version — the group inserted and sounded fine but could not be
    // group-scaled, and only the phase gate caught it.
    insert() {
        const C = HOST();
        if (!C || !this.result) return;
        // SAME BUG, SAME LINE, FIXED THE SAME DAY (2026-08-17, day 14; found in
        // morph_panel, which this was copied from). `Composer.playheadTime` and
        // `Composer.currentTime` DO NOT EXIST, so this expression always yielded
        // 0 and every texture insert landed at t=0 regardless of the view. The
        // app's accessor is `getTimeAtPlayhead()`; `Math.max(0, …)` matches the
        // score's own convention (composer.html:8948). 2x's insert has never
        // been exercised in the app, so this was latent here rather than
        // observed — noted rather than claimed as a reproduced failure.
        const at = (C && typeof C.getTimeAtPlayhead === 'function' && isFinite(C.getTimeAtPlayhead()))
            ? Math.max(0, C.getTimeAtPlayhead())
            : (C.playheadTime != null ? C.playheadTime : (C.currentTime || 0));
        const p = this.current() || {};
        let seq = 1;
        while (C.objects.some(o => o.groupId === 'grp-tex-' + String(seq).padStart(2, '0'))) seq++;
        const gid = 'grp-tex-' + String(seq).padStart(2, '0');

        const objs = TX.toScoreObjects(this.result, at, {
            groupId: gid, startId: (C.nextId || 1) + 1, color: '#3F7D5A',
        });
        objs.forEach(o => C.objects.push(o));

        // contour follows the texture's own ATTACK DENSITY — for a flat-level
        // field that is the shape the ear actually tracks, and it is what
        // place_gesture.js draws for density material (2w).
        const span = TX.spanOf(this.result);
        const notes = this.result.objects.filter(o => o.type === 'waveCurve');
        const W = 12, prof = [];
        const lo = Math.min.apply(null, notes.map(n => n.startSeconds));
        for (let w = 0; w < W; w++) {
            const a = lo + (span * w) / W, b = lo + (span * (w + 1)) / W;
            prof.push(notes.filter(n => n.startSeconds >= a && n.startSeconds < b).length);
        }
        const peak = Math.max(1, Math.max.apply(null, prof));
        const nds = prof.map((c, i) => ({
            pos: Math.round(((i + 0.5) / W) * 1000) / 1000,
            y: Math.max(0.4, Math.min(10, Math.round((c / peak) * 8 * 10) / 10)),
            smooth: 0.35,
        }));
        nds.unshift({ pos: 0, y: nds[0].y, smooth: 0.35 });
        nds.push({ pos: 1, y: nds[nds.length - 1].y, smooth: 0.35 });

        const label = p.label || this.autoLabel(this.spec);
        C.objects.push({
            id: 'wc-texmeta-' + seq, type: 'waveCurve', layer: 10, groupId: gid,
            startSeconds: +at.toFixed(3), endSeconds: +(at + span).toFixed(3),
            nodes: nds, segments: nds.slice(1).map(() => ({ model: 'bezier', slope: 0 })),
            color: '#3F7D5A', fillMode: 'bottom', opacity: 0.45,
            performanceNotes: 'TEXTURE ' + label +
                ' — density contour (drag = move, edge/box = stretch)', properties: {},
        });
        C.nextId = (C.nextId || 1) + objs.length + 4;
        if (C.renderAll) C.renderAll();
        if (C.markDirty) C.markDirty();
        if (C.scheduleConflictRefresh) C.scheduleConflictRefresh();
        this.setStatus('inserted ' + objs.length + ' objects at ' + at.toFixed(2) + ' s as ' + gid);
    },

    setStatus(msg, bad, html) {
        const s = this.el.querySelector('#texStatus');
        if (!s) return;
        s.style.color = bad ? '#e06666' : '#9a9';
        if (html) s.innerHTML = msg; else s.textContent = msg;
    },
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => PANEL.init());
else PANEL.init();
root.TexturePanel = PANEL;
}(typeof self !== 'undefined' ? self : this));
