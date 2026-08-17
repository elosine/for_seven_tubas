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

// WHERE THE PLAYHEAD IS. Both insert paths used to read
// `C.playheadTime != null ? C.playheadTime : (C.currentTime || 0)` — and
// **NEITHER PROPERTY HAS EVER EXISTED ON `Composer`**, so the expression fell
// through to 0 every single time. Every morph insert since 2v landed at t=0
// regardless of the view, which reads as "the insert did nothing" whenever the
// composer is looking anywhere else — and silently piled morph notes onto
// whatever occupies the opening (found 2026-08-17, day 14: two groups stacked
// on DB1 while the composer watched 142 s, with only the conflict badge moving).
//
// The app's real accessor is `getTimeAtPlayhead()` (the playhead is a fixed
// centre line; scrolling IS moving it), used correctly by the Insertion strip,
// curve split and motive insert. `Math.max(0, …)` follows the score's own
// convention at composer.html:8948 — scrollOffset can go negative past t=0.
// The old expression stays as a last-ditch fallback, but it can only fire on a
// host that lacks the accessor entirely.
function playheadAt(C) {
    if (C && typeof C.getTimeAtPlayhead === 'function') {
        const t = C.getTimeAtPlayhead();
        if (isFinite(t)) return Math.max(0, t);
    }
    return (C && C.playheadTime != null) ? C.playheadTime : ((C && C.currentTime) || 0);
}

const M = root.Morph, E = root.MorphEmit;
if (!M || !E) { console.warn('[morph_panel] needs morph.js + morph_emit.js'); return; }

const PANEL = {
    el: null, rev: -1, params: null, active: 'A', result: null, poll: null,

    // PLAN 2y. Three sources of a render, one render path:
    //   variants — the scratch slate the AI rewrites (morph_params.json)
    //   models   — the store: a point + the directions worth travelling from it
    //   actuals  — decided renders, already stored; browsed, heard and placed
    // `mode` only decides where `current()` gets its params; everything
    // downstream (generate / play / insert) is the same code it always was.
    mode: 'variants',
    models: null, presets: null, actuals: [], modelsRev: -1,
    activeModel: null, activePreset: '',
    recipeSettings: {},          // { [modelId]: { [recipeName]: x } } — absent = OFF
    seedOverride: {},            // { [modelId]: n }
    activeActual: null,

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
        // THE PANEL IS A CAPPED FLEX COLUMN WITH ONE SCROLLING MIDDLE.
        //
        // It used to be an uncapped block: MODELS mode adds a character note,
        // five recipe sliders, a seed stepper, a preset picker, seven number
        // fields and a flags list, so the box simply grew past the bottom of the
        // screen — taking Generate / Play / Stop and Insert @ cursor with it,
        // with nothing to scroll (composer, 2026-08-17: "I can't see the bottom
        // now. There's... you can't scroll").
        //
        // Header and buttons are flex-fixed; ONLY the middle scrolls. So the
        // transport and Insert are on screen at every window size and in every
        // mode, by construction rather than by fitting. `resize:both` gives a
        // native grip at the bottom-right for anything this does not cover.
        d.style.cssText = [
            'position:fixed', 'right:16px', 'top:96px', 'width:340px', 'z-index:9000',
            'background:rgba(28,28,32,0.97)', 'border:1px solid #6a5acd', 'border-radius:6px',
            'padding:10px 12px', 'color:#ddd', 'font:11px/1.45 system-ui,sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.5)', 'display:none',
            'flex-direction:column', 'max-height:calc(100vh - 120px)',
            'min-width:300px', 'min-height:200px', 'resize:both', 'overflow:hidden',
        ].join(';');
        d.innerHTML = [
            '<div id="morphDrag" style="cursor:move;font-weight:600;color:#b9a8ff;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'background:rgba(106,90,205,0.16)">MORPH',
            '<span id="morphClose" style="float:right;cursor:pointer;color:#888">&#10005;</span></div>',
            '<div id="morphStatus" style="color:#9a9;margin-bottom:7px;flex:0 0 auto">idle</div>',
            // the ONLY scrolling region. min-height:0 is load-bearing — without
            // it a flex child refuses to shrink below its content and the cap
            // does nothing at all.
            '<div id="morphScroll" style="flex:1 1 auto;overflow-y:auto;min-height:0;',
            'margin:0 -4px 8px;padding:0 4px">',
            '<div id="morphTabs" style="margin-bottom:8px"></div>',
            '<div id="morphFields" style="margin-bottom:8px"></div>',
            '<div id="morphFlags" style="margin-bottom:4px"></div>',
            '</div>',
            // FIXED COLUMNS, not flex. The Play button's label changes to
            // "Playing…" while it runs; in a flex row that reflowed everything to
            // the right, so reaching for Stop landed on "Insert @ cursor" and put
            // a morph into the score by accident (composer, 2026-08-16). A
            // transport control must never move under the pointer.
            '<div style="flex:0 0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">',
            '<button id="morphGen">Generate</button>',
            '<button id="morphPlay" style="overflow:hidden;white-space:nowrap">Play</button>',
            '<button id="morphStop">Stop</button>',
            '</div>',
            '<div style="flex:0 0 auto;margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px">',
            '<button id="morphIns" title="insert at the playhead as a group">Insert @ cursor</button>',
            '<button id="morphSaveAct" title="freeze this render as an ACTUAL with its provenance">',
            'Save as ACTUAL</button>',
            '</div>',
            // FADE LADDER (day 14): hear the current attack at several lengths,
            // back to back, in ONE play session — pressing Play per length gave
            // every audition a fresh press-edge, which is where the blip lives.
            '<div style="flex:0 0 auto;margin-top:6px;display:flex;gap:6px;align-items:center">',
            '<button id="morphLadder" title="hear the current attack at these lengths, back to back">Fade ladder</button>',
            '<input id="morphLadderLens" value="1, 2, 3, 5, 8" ',
            'title="fade lengths in seconds, comma-separated" ',
            'style="flex:1;min-width:0;background:#1a1a22;color:#cca;border:1px solid #333;padding:2px 5px">',
            '</div>',
            '<div style="flex:0 0 auto;color:#666;margin-top:7px">SPACE play/stop &middot; &larr;/&rarr; variant',
            ' &mdash; only while this panel has focus</div>',
        ].join('');
        document.body.appendChild(d);
        this.el = d;

        d.querySelector('#morphClose').addEventListener('click', () => this.toggle(false));
        d.querySelector('#morphGen').addEventListener('click', () => this.generate());
        d.querySelector('#morphPlay').addEventListener('click', () => this.play());
        d.querySelector('#morphStop').addEventListener('click', () => E.panic());
        d.querySelector('#morphIns').addEventListener('click', () => this.insert());
        d.querySelector('#morphSaveAct').addEventListener('click', () => this.saveActual());
        d.querySelector('#morphLadder').addEventListener('click', () => this.playLadder());
        this.makeDraggable(d, d.querySelector('#morphDrag'));
        // shrinking the window can strand a panel that was legally placed
        window.addEventListener('resize', () => this.clampIntoView());

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
            this.bringToFront();
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!on) return;
            box.style.left = (bx + e.clientX - sx) + 'px';
            box.style.top = (by + e.clientY - sy) + 'px';
            box.style.right = 'auto';
            this.clampIntoView();
        });
        document.addEventListener('mouseup', () => { on = false; });
    },

    // A PANEL YOU CANNOT REACH IS A PANEL YOU CANNOT CLOSE.
    //
    // Dragging was unbounded, and the title bar carries BOTH the drag handle and
    // the ✕ — so pushing it above the viewport stranded the panel permanently:
    // nothing to grab, nothing to click, and the position is not persisted so
    // the only recovery was a page reload the composer had no reason to guess at.
    // (Composer, 2026-08-17: "the morph UI header is trapped in browser header,
    // that may be why I'm not seeing it.")
    //
    // Clamping lives in ONE place and is called from the drag, from the window
    // resize and from every open — so there is no code path that can strand it.
    // MIN_TOP clears #topBar (32px, z-index 100): this panel is z-index 9000, so
    // an unclamped panel does not slide under the top bar, it COVERS it, taking
    // the Session field and the save controls with it.
    clampIntoView() {
        const box = this.el;
        if (!box || box.style.display === 'none') return;
        const r = box.getBoundingClientRect();
        if (!r.width && !r.height) return;
        const MIN_TOP = 36, MARGIN = 4;
        const maxLeft = Math.max(MARGIN, window.innerWidth - r.width - MARGIN);
        // KEEP THE WHOLE PANEL ON SCREEN, not just its header. The first version
        // clamped against a 28px header height, so dragging the panel low left
        // it "legally" placed with Generate / Play / Insert below the fold —
        // which is the composer's actual complaint, and close-and-reopen could
        // not recover it because that position passed the check. Measured at
        // 1100x460: top 420, bottom 760, all four buttons off screen.
        // `max-height` caps the panel at 100vh-120, so a fully-on-screen
        // position always exists; Math.max degrades gracefully if it ever does
        // not, pinning to the top rather than refusing to move.
        const maxTop = Math.max(MIN_TOP, window.innerHeight - r.height - MARGIN);
        box.style.left = Math.min(Math.max(r.left, MARGIN), maxLeft) + 'px';
        box.style.top = Math.min(Math.max(r.top, MIN_TOP), maxTop) + 'px';
        box.style.right = 'auto';
    },

    // The Texture panel (PLAN 2x) opens at the IDENTICAL fixed spot — right:16px,
    // top:96px, z-index:9000. With both open the two headers sat exactly on top
    // of one another and which one you got was DOM insertion order. Raising on
    // open and on grab makes "the one I just clicked is the one in front" true by
    // construction, without either panel having to know the other's numbers.
    bringToFront() {
        let z = 9000;
        document.querySelectorAll('div[id$="Panel"]').forEach(p => {
            if (p === this.el || p.style.display === 'none') return;
            const pz = parseInt(window.getComputedStyle(p).zIndex, 10);
            if (!isNaN(pz) && pz >= z) z = pz + 1;
        });
        this.el.style.zIndex = String(z);
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
        if (typeof M.resolveParams !== 'function') bad.push('morph.js recipe engine missing (2y MA1)');
        // 2y: the store's seams, checked at OPEN time and reported by name —
        // the same reason preflight exists at all (a wrong assumption about the
        // host must fail here, not as silence three layers down).
        fetch('/api/actuals', { cache: 'no-store' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); })
            .catch(e => this.setStatus('/api/actuals unreachable — ACTUALs disabled (' +
                e.message + ')', true));
        this._preflight = bad;
        if (bad.length) console.error('[morph] PREFLIGHT FAILED:', bad);
        return bad;
    },

    toggle(force) {
        const show = force != null ? force : this.el.style.display === 'none';
        // 'flex', NOT ''. Clearing the inline display would fall back to the
        // stylesheet default (block) and silently undo the whole flex column —
        // the cap and the internal scroll would be dead and the buttons would
        // slide off the bottom again, with nothing in the CSS looking wrong.
        this.el.style.display = show ? 'flex' : 'none';
        if (show) {
            // Opening is also the RECOVERY path: front + clamp, so "I can't see
            // it" cannot survive clicking the Morph button. Nothing to remember.
            this.bringToFront();
            this.clampIntoView();
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
        let changed = force;
        try {
            const r = await fetch('/api/morphparams', { cache: 'no-store' });
            const j = await r.json();
            if (force || j.rev !== this.rev) {
                this.rev = j.rev;
                this.params = j;
                const keys = this.variantKeys();
                if (keys.indexOf(this.active) < 0) {
                    this.active = j.active && keys.indexOf(j.active) >= 0 ? j.active : keys[0];
                }
                changed = true;
            }
        } catch (e) { this.setStatus('params file unavailable — ' + e.message, true); return; }

        // The model store polls on `rev` exactly like the params file — same
        // pattern, no websockets, survives a reload (2y §10.6).
        try {
            const m = await fetch('/api/morphmodels', { cache: 'no-store' }).then(x => x.json());
            if (force || m.rev !== this.modelsRev) {
                this.modelsRev = m.rev;
                this.models = m;
                if (!this.activeModel || !m.models[this.activeModel]) {
                    this.activeModel = Object.keys(m.models)[0] || null;
                }
                changed = true;
            }
        } catch (e) { /* store optional — the variant path must still work */ }
        try { this.presets = await fetch('/api/shapepresets', { cache: 'no-store' }).then(x => x.json()); }
        catch (e) { this.presets = null; }
        try {
            const a = await fetch('/api/actuals', { cache: 'no-store' }).then(x => x.json());
            if (a.success) this.actuals = a.actuals;
        } catch (e) { /* none yet */ }

        if (changed) this.generate();
    },
    variantKeys() {
        const v = (this.params && this.params.variants) || {};
        return Object.keys(v).filter(k => v[k]);
    },
    modelKeys() { return this.models ? Object.keys(this.models.models) : []; },
    model() { return (this.models && this.models.models[this.activeModel]) || null; },
    settingsFor(id) { return (this.recipeSettings[id] = this.recipeSettings[id] || {}); },

    // The params for whatever is currently selected. This is the ONLY place the
    // three modes differ; every downstream step is shared.
    current() {
        if (this.mode === 'models') {
            const m = this.model();
            if (!m) return null;
            const res = M.resolveParams(m, this.settingsFor(m.id));
            this._resolveWarnings = res.warnings;
            const p = res.params;
            if (this.seedOverride[m.id] != null) p.seed = this.seedOverride[m.id];
            const pre = this.presets && this.presets.presets && this.presets.presets[this.activePreset];
            if (pre) p.shape = JSON.parse(JSON.stringify(pre.shape));
            p.label = m.name + (Object.keys(this.settingsFor(m.id)).length ? ' ·dialled' : '');
            return p;
        }
        this._resolveWarnings = [];
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
        // The stamp must name EVERYTHING that changes what current() returns —
        // mode, selection, either store's rev, the recipe dials, the seed and
        // the shape preset. Miss one and the fields go stale against the params
        // again, which is the bug this stamp exists to prevent.
        const stamp = JSON.stringify([this.mode, this.active, this.rev, this.activeModel,
            this.modelsRev, this.activePreset,
            this.mode === 'models' ? this.settingsFor(this.activeModel) : 0,
            this.mode === 'models' ? this.seedOverride[this.activeModel] : 0]);
        const merged = (this._fieldStamp === stamp)
            ? this.readFields(p)
            : JSON.parse(JSON.stringify(p));
        this._fieldStamp = stamp;
        // exactly what was rendered, so Save as ACTUAL can store what was HEARD
        this._lastParams = merged;
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
        // switching to MODELS or turning recipes on changes the panel's height,
        // which can push a legally-placed panel off the bottom. Re-clamp after
        // every redraw; it is a no-op unless something actually went out.
        this.clampIntoView();
    },

    draw(p) {
        const r = this.result, s = r.summary;
        const soft = Object.keys(s.soft).reduce((a, k) => a + s.soft[k], 0);
        // NAME WHAT IS ACTUALLY SELECTED. The status printed `this.active` — the
        // SCRATCH letter — in every mode, so working on MODELS/BLOOM read
        // "v5 · A · BEATING BLOOM": the letter of a different tab's selection
        // sitting next to the right title. The composer asked "how do I choose
        // the body, is it the ABC buttons?" on the same day, and this line was
        // answering "A" while they were on BLOOM. (2026-08-17.)
        // (`sel` is already the field-builder helper further down this function.)
        const selName = this.mode === 'models' ? this.activeModel
            : this.mode === 'actuals' ? (this.activeActual || 'ACTUALs') : this.active;
        this.setStatus('v' + this.rev + ' &middot; ' + selName + ' &middot; "' +
            // "Let them finish" makes the real end unpredictable by up to a
            // breath, and the composer needs the actual number to place the
            // gesture in the score — so show it rather than the dialled value.
            (p.label || p.model) + '" &middot; ' + r.notes.length + ' notes &middot; ' +
            (r.meta && r.meta.totalLength
                ? '<b>' + r.meta.totalLength.toFixed(1) + ' s</b> &middot; ' : '') +
            (s.hard ? '<b style="color:#e06666">' + s.hard + ' hard</b> / ' : '') +
            (soft ? '<span style="color:#e0b062">' + soft + ' soft</span>' : 'clean'), false, true);

        const tabs = this.el.querySelector('#morphTabs');
        tabs.innerHTML = '';
        // MODE SWITCH (2y §6). Models are the store; variants stay for scratch
        // work — drafts live there until they are blessed into models.
        const modeRow = document.createElement('div');
        modeRow.style.cssText = 'margin-bottom:5px';
        [['models', 'MODELS'], ['variants', 'scratch'], ['actuals', 'ACTUALs']].forEach(([m, lab]) => {
            const b = document.createElement('button');
            b.textContent = lab + (m === 'actuals' && this.actuals.length ? ' (' + this.actuals.length + ')' : '');
            b.style.cssText = 'margin-right:4px;font-size:10px;' + (m === this.mode
                ? 'background:#6a5acd;color:#fff;border-color:#8f7fe0' : '');
            b.addEventListener('click', () => { this.mode = m; this.generate(); });
            modeRow.appendChild(b);
        });
        tabs.appendChild(modeRow);

        const chips = document.createElement('div');
        if (this.mode === 'models') {
            this.modelKeys().forEach(k => {
                const mm = this.models.models[k];
                const b = document.createElement('button');
                b.textContent = k;
                b.title = mm.name + ' — ' + (mm.character || '');
                b.style.cssText = 'margin:0 4px 3px 0;font-size:10px;' +
                    (k === this.activeModel ? 'background:#6a5acd;color:#fff;border-color:#8f7fe0' : '') +
                    (mm.status === 'draft' ? ';opacity:0.65' : '');
                b.addEventListener('click', () => { this.activeModel = k; this.generate(); });
                chips.appendChild(b);
            });
        } else if (this.mode === 'variants') {
            this.variantKeys().forEach(k => {
                const b = document.createElement('button');
                b.textContent = k;
                b.style.cssText = 'margin-right:4px;' + (k === this.active
                    ? 'background:#6a5acd;color:#fff;border-color:#8f7fe0' : '');
                b.addEventListener('click', () => { this.active = k; this.generate(); });
                chips.appendChild(b);
            });
        }
        tabs.appendChild(chips);

        // read-and-nudge number fields, no sliders and no curve editors (§9)
        const f = this.el.querySelector('#morphFields');
        f.innerHTML = '';

        // ------------------------------------------------- ACTUALs browser
        // The full card, always: id · label · model · span · parts · register ·
        // tags · placement count. Labeling debt ("what was ACT-BLOOM-03 again?")
        // is what this prevents (2y §9 failure 6).
        if (this.mode === 'actuals') {
            const fl0 = this.el.querySelector('#morphFlags');
            if (fl0) fl0.innerHTML = '';
            if (!this.actuals.length) {
                f.innerHTML = '<div style="color:#777">No actuals yet.<br><br>' +
                    'Pick a MODEL, turn its dials, step the seed until it is the one, ' +
                    'then <b>Save as ACTUAL</b>. It is filed with the model, the dial ' +
                    'positions and the seed that made it, and it stays placeable forever.</div>';
                return;
            }
            this.actuals.forEach(a => {
                const card = document.createElement('div');
                card.style.cssText = 'border:1px solid #3a3a44;border-radius:4px;padding:5px 6px;margin:0 0 5px';
                const dials = Object.keys(a.recipeSettings || {});
                card.innerHTML =
                    '<div style="color:#b9a8ff;font-weight:600">' + a.entity + '</div>' +
                    '<div style="color:#ddd">' + (a.label || '') + '</div>' +
                    '<div style="color:#888;font-size:10px">' + a.model + ' · ' + a.spanSec +
                    ' s · ' + a.parts + ' parts · MIDI ' + a.register + ' · seed ' + a.seed +
                    (dials.length ? '<br>dials: ' + dials.map(k => k + '=' + a.recipeSettings[k]).join(', ') : '') +
                    ((a.tags || []).length ? '<br>tags: ' + a.tags.join(', ') : '') +
                    '<br>' + a.placements + ' placement(s)</div>';
                const row2 = document.createElement('div');
                row2.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:4px';
                const bh = document.createElement('button');
                bh.textContent = 'hear'; bh.style.fontSize = '10px';
                bh.addEventListener('click', () => this.hearActual(a.entity));
                const bi = document.createElement('button');
                // "place", NOT "insert @ cursor" — the scratch panel's Insert
                // button sits a few pixels above this one and carried the SAME
                // label, so the two were indistinguishable in use. On day 14 the
                // composer meant to place ACT-BLOOM-02 and hit the scratch one
                // twice, putting a 30 s throwaway variant into the piece instead
                // of the 113.9 s actual. Only the group id (`grp-morph-NN` vs
                // `grp-act-bloom-02-NN`) revealed which had run.
                bi.textContent = 'place @ cursor'; bi.style.fontSize = '10px';
                bi.title = 'place this ACTUAL at the playhead — logs the placement back to it';
                bi.addEventListener('click', () => this.insertActual(a.entity));
                row2.appendChild(bh); row2.appendChild(bi);
                card.appendChild(row2);
                f.appendChild(card);
            });
            return;
        }
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

        // ---------------------------------------------- MODEL: recipes + seed
        if (this.mode === 'models' && this.model()) {
            const m = this.model();
            const set = this.settingsFor(m.id);
            note('<b style="color:#b9a8ff">' + m.name + '</b> · ' + m.status +
                 '<br>' + (m.character || ''), '#9a9');

            (m.recipes || []).forEach(rc => {
                const on = Object.prototype.hasOwnProperty.call(set, rc.recipe);
                const w = document.createElement('div');
                w.style.cssText = 'margin:4px 0';
                const head2 = document.createElement('div');
                head2.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
                const cb = document.createElement('input');
                cb.type = 'checkbox'; cb.checked = on;
                cb.style.cssText = 'margin:0 5px 0 0;vertical-align:middle';
                // A DIAL IS OFF UNTIL TURNED (2y §4). Opening a model must never
                // quietly rewrite params the composer blessed, so a recipe is
                // only applied once it is explicitly engaged.
                cb.addEventListener('change', () => {
                    if (cb.checked) set[rc.recipe] = rc.dial.default;
                    else delete set[rc.recipe];
                    this.generate();
                });
                const lab = document.createElement('span');
                lab.style.cssText = 'color:' + (on ? '#ddd' : '#777') + ';flex:1';
                lab.textContent = rc.recipe;
                lab.title = rc.description || '';
                const val = document.createElement('span');
                val.style.cssText = 'color:#8a8ac0;font-size:10px';
                val.textContent = on ? (+set[rc.recipe]).toFixed(2) : 'off';
                head2.appendChild(cb); head2.appendChild(lab); head2.appendChild(val);
                w.appendChild(head2);

                const sl = document.createElement('input');
                sl.type = 'range';
                sl.min = rc.dial.min; sl.max = rc.dial.max;
                sl.step = (rc.dial.max - rc.dial.min) / 100;
                sl.value = on ? set[rc.recipe] : rc.dial.default;
                sl.disabled = !on;
                sl.style.cssText = 'width:100%;margin:1px 0;opacity:' + (on ? 1 : 0.35);
                sl.addEventListener('input', () => { val.textContent = (+sl.value).toFixed(2); });
                sl.addEventListener('change', () => {
                    set[rc.recipe] = parseFloat(sl.value);
                    if (!cb.checked) cb.checked = true;
                    this.generate();
                });
                w.appendChild(sl);
                f.appendChild(w);
            });
            if (!(m.recipes || []).length) note('no recipes yet — narrate one and it appears here');

            // seed stepper — "another version" is identity, not direction, so it
            // is never a recipe (2y §4)
            const sw = document.createElement('div');
            sw.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:5px 0';
            sw.innerHTML = '<span style="color:#9a9">seed (another version)</span>';
            const box = document.createElement('span');
            const mk = (t, d) => {
                const b = document.createElement('button');
                b.textContent = t; b.style.cssText = 'padding:0 6px;margin-left:3px';
                b.addEventListener('click', () => {
                    const cur = this.seedOverride[m.id] != null ? this.seedOverride[m.id]
                        : (m.baseParams.seed || 1);
                    this.seedOverride[m.id] = Math.max(1, cur + d);
                    this.generate();
                });
                return b;
            };
            const cur = document.createElement('span');
            cur.style.cssText = 'color:#ddd;padding:0 4px';
            cur.textContent = String(p.seed);
            box.appendChild(cur); box.appendChild(mk('−', -1)); box.appendChild(mk('+', 1));
            sw.appendChild(box); f.appendChild(sw);

            // shape presets — a named shape block merges onto ANY model, because
            // a shape is just params (2y §5.1: reuse by construction)
            const ps = (this.presets && this.presets.presets) || {};
            const pw = document.createElement('div');
            pw.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin:3px 0';
            pw.innerHTML = '<span style="color:#9a9">shape preset</span>';
            const psel = document.createElement('select');
            psel.style.cssText = 'width:130px;background:#1b1b20;color:#ddd;border:1px solid #444';
            [''].concat(Object.keys(ps)).forEach(k => {
                const o = document.createElement('option');
                o.value = k; o.textContent = k || '(none)';
                if (k === this.activePreset) o.selected = true;
                psel.appendChild(o);
            });
            psel.addEventListener('change', () => { this.activePreset = psel.value; this.generate(); });
            pw.appendChild(psel); f.appendChild(pw);
            if (!Object.keys(ps).length) {
                note('no shape presets yet — kept shapes get filed here', '#666');
            }
            (this._resolveWarnings || []).forEach(w2 => note(w2, '#e0b062'));
            head('dials (nudge the resolved params)');
        }

        // FR-3. `span` is now explicitly the ONE-WAY gliss — the pace — and
        // `duration` is how long the body runs. Blank means "not set", which is
        // the legacy form where the gliss fills the whole gesture: readFields
        // ignores NaN, so an empty box stays null rather than becoming 0.
        row('pace: gliss (s)', 'carrier.span', p.carrier.span, 1);
        row('duration (s)', 'carrier.duration',
            p.carrier.duration != null ? p.carrier.duration : '', 10);
        row('release (s)', 'carrier.release',
            p.carrier.release != null ? p.carrier.release : '', 5);
        row('segment (s)', 'carrier.segLen', p.carrier.segLen, 0.5);
        row('bias  −1…+1', 'dials.bias', p.dials.bias, 0.1);
        row('spread 0…1', 'dials.spread', p.dials.spread, 0.1);
        row('depth 0…1', 'dials.depth', p.dials.depth, 0.1);
        row('dyn amount', 'dyn.amount', p.dyn.amount, 0.05);
        // Under cycling this is the difference between one peak per cycle
        // (`rise`, loudness tracking how open the bloom is) and two (`swell`,
        // whose arch is symmetric in progress so it peaks going out AND back).
        sel('dyn shape', 'dyn.shape', p.dyn.shape || 'swell',
            ['swell', 'rise', 'fall', 'rotate', 'flat']);
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

    // ------------------------------------------------------------- ACTUALs
    // FREEZE A DECIDED RENDER. The write goes to the server, which calls the
    // SAME buildActual() that tools/model_bank.js --actualize uses, so the
    // button and the CLI cannot drift into two save paths (2y §6).
    async saveActual() {
        if (this.mode !== 'models' || !this.model()) {
            this.setStatus('Save as ACTUAL needs a MODEL selected (scratch variants are not models)', true);
            return;
        }
        const m = this.model();
        const label = window.prompt('Label for this actual — one breath, your words:',
            m.name + ', ' + Math.round(this.result.meta.span) + ' s');
        if (label == null) return;
        try {
            const r = await fetch('/api/actuals', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: m.id,
                    recipeSettings: this.settingsFor(m.id),
                    seed: this.result.meta.seed,
                    label: label,
                    tags: (m.tags || []).slice(),
                    params: this._lastParams,
                    shape: this.activePreset ? undefined : (this.current() || {}).shape,
                    shapePreset: this.activePreset || undefined,
                }),
            });
            const j = await r.json();
            if (!j.success) { this.setStatus('save failed: ' + j.error, true); return; }
            this.modelsRev = -1;                       // force a store re-read
            await this.refresh(true);
            this.setStatus('filed ' + j.entity + ' — browse it under ACTUALs');
        } catch (e) { this.setStatus('save failed: ' + e.message, true); }
    },

    async hearActual(entity) {
        try {
            const a = await fetch('/api/actuals/' + entity, { cache: 'no-store' }).then(x => x.json());
            // audition plays `notes` through the existing emit path — the same
            // render the stored `objects` came from
            this.result = { notes: a.notes, summary: { hard: 0, soft: {}, flags: {} },
                            warnings: [], meta: { model: a.provenance.model, seed: a.provenance.seed,
                            span: a.spanSec, voices: a.parts,
                            lanes: [...new Set(a.objects.filter(o => o.morphBend).map(o => o.layer))] } };
            this.activeActual = a;
            await this.play();
        } catch (e) { this.setStatus('could not hear ' + entity + ': ' + e.message, true); }
    },

    async insertActual(entity) {
        const C = HOST();
        if (!C) return;
        try {
            const a = await fetch('/api/actuals/' + entity, { cache: 'no-store' }).then(x => x.json());
            const at = playheadAt(C);
            const notes = a.objects.filter(o => o.morphBend);
            const t0 = Math.min.apply(null, notes.map(o => o.startSeconds));
            let seq = 1;
            const slug = entity.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            while (C.objects.some(o => o.groupId === 'grp-' + slug + '-' + String(seq).padStart(2, '0'))) seq++;
            const gid = 'grp-' + slug + '-' + String(seq).padStart(2, '0');
            let nid = (C.nextId || 1) + 1;
            // objects are placed VERBATIM — a stored actual's identity is frozen;
            // a later engine change must never re-render what is already placed.
            const placed = a.objects.map(o => Object.assign(JSON.parse(JSON.stringify(o)), {
                id: 'wc-' + (nid++), groupId: gid,
                startSeconds: +(o.startSeconds - t0 + at).toFixed(3),
                endSeconds: +(o.endSeconds - t0 + at).toFixed(3),
            }));
            // marker in OBJECTS, never data.markers (Principle 4)
            C.objects.push({ id: 'mk-' + slug + '-' + seq, type: 'marker', layer: 0,
                time: +at.toFixed(3), label: entity + ' — ' + (a.label || ''),
                color: '#7E57C2', groupId: gid, performanceNotes: '', properties: {} });
            placed.forEach(o => C.objects.push(o));
            const nds = [{ pos: 0, y: 5, smooth: 0.35 }, { pos: 1, y: 5, smooth: 0.35 }];
            C.objects.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: 10, groupId: gid,
                startSeconds: +at.toFixed(3), endSeconds: +(at + a.spanSec).toFixed(3),
                nodes: nds, segments: [{ model: 'bezier', slope: 0 }],
                color: '#7E57C2', fillMode: 'bottom', opacity: 0.45,
                performanceNotes: entity + ' (drag = move, edge/box = stretch)', properties: {} });
            C.nextId = nid + 2;
            if (C.renderAll) C.renderAll();
            if (C.markDirty) C.markDirty();
            if (C.scheduleConflictRefresh) C.scheduleConflictRefresh();
            // PLACEMENTS LOG THEMSELVES — "where have I used this" is the
            // question a reusable collection gets asked most (2y §5).
            fetch('/api/actualplacement', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity: entity, score: C.sessionName || 'untitled',
                                       at: +at.toFixed(3), group: gid }),
            }).then(() => this.refresh(true)).catch(() => {});
            this.setStatus('placed ' + entity + ' at ' + at.toFixed(2) + ' s as ' + gid);
        } catch (e) { this.setStatus('insert failed: ' + e.message, true); }
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
            // MODELS mode also puts the recipe CHECKBOXES and SLIDERS in this
            // container, and those carry no `dataset.path` — reading `.indexOf`
            // off undefined threw and took the whole render with it. Those
            // controls own `recipeSettings`, not params, so skip them here.
            if (!i.dataset.path) return;
            const t = parentOf(i.dataset.path, i.dataset.path.indexOf('shape.') !== 0);
            if (!t) return;
            const v = parseFloat(i.value);
            if (!isNaN(v)) t.obj[t.key] = v;
        });
        this.el.querySelectorAll('#morphFields select').forEach(s => {
            // Same as above: the SHAPE PRESET picker lives here and owns
            // `activePreset`, not a params path. Without this guard parentOf
            // split undefined and threw straight out of generate(), so every
            // nudge in MODELS mode was silently lost — the fields kept the typed
            // value while the render went on using the stored params.
            if (!s.dataset.path) return;
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

    // FADE LADDER (day 14) — the fallback the composer asked for: audition the
    // attack at several lengths WITHOUT Reaper, and inside ONE play session so
    // a press-edge artifact (where the blip lives) can hit at most the first
    // rung. The assembly (clip, offset, gap) is `M.buildLadder` — pure, shared
    // with tools/test_ladder.js, so what is tested is what plays. This method
    // is the UI around it: read the lengths, play, narrate the rungs.
    async playLadder() {
        if (!this._lastParams) this.generate();
        const base = this._lastParams;
        if (!base) return;
        if (!base.shape || !base.shape.attack) {
            this.setStatus('the current render has no attack block — pick a shape preset ' +
                           '(e.g. fade-in-3s) first', true);
            return;
        }
        const lens = String(this.el.querySelector('#morphLadderLens').value || '').split(',');
        let L;
        try {
            L = M.buildLadder(base, lens, {
                renderOpts: { maxVoices: 10,
                              sampleLengths: (HOST() && HOST().sampleLen) || null },
            });
        } catch (e) {
            if (e.message === 'no usable lengths') {
                this.setStatus('ladder: no usable lengths', true);
            } else if (e.rungLen != null) {
                this.setStatus('ladder render failed at ' + e.rungLen + ' s: ' + e.message, true);
            } else {
                this.setStatus('ladder: ' + e.message, true);
            }
            return;
        }
        const btn = this.el.querySelector('#morphPlay');
        btn.textContent = 'starting…';
        const res = await E.play({ notes: L.notes, meta: L.meta }, { span: L.span });
        if (!res.scheduled) {
            btn.textContent = 'Play';
            this.setStatus(res.reason || 'nothing sounded', true);
            return;
        }
        btn.textContent = 'Playing…';
        // narrate which rung is sounding; the timers ride E._timers so Stop
        // (and any new play) clears the narration with the sound
        L.rungs.forEach((rg, i) => {
            E._timers.push(setTimeout(() =>
                this.setStatus('ladder: <b>' + rg.len + ' s</b> fade (' + (i + 1) + '/' +
                               L.rungs.length + ') &middot; ' + L.holdS + ' s hold'),
                rg.at * 1000 + E.CC_LEAD_MS));
        });
    },

    insert() {
        const C = HOST();
        if (!C || !this.result) return;
        const at = playheadAt(C);
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
