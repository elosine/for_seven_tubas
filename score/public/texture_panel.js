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
    // LIVE mode (PLAN 2ag): a streaming scheduler the composer drives in real
    // time. `data` mirrors the params file's `live` block; box edits are
    // ephemeral until the AI writes them back into the file.
    lv: { playing: false, tick: null, runT: null, slot: 0, step: 0,
          data: null, skipped: 0, state: null, logT0: null, log: [] },

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
            // The panel is FIXED, so the page scrollbar can never reach its
            // bottom — since the LIVE section it can outgrow the viewport, so
            // it scrolls as a whole (the dials keep their own inner scroll).
            'max-height:calc(100vh - 112px)', 'overflow-y:auto',
        ].join(';');
        d.innerHTML = [
            // sticky, so the drag handle stays grabbable while the panel scrolls
            '<div id="texDrag" style="cursor:move;font-weight:600;color:#8fd6ab;',
            'margin:-10px -12px 8px;padding:7px 12px;border-bottom:1px solid #444;',
            'position:sticky;top:-10px;z-index:1;',
            'background:rgb(35,47,44)">TEXTURE',   // the old green tint, opaque (sticky must not show through)
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
            // LIVE (PLAN 2ag) — walk six (bpm, players) steps in real time.
            // The character is TWO NUMBERS, not a mode: jitter>0 = rain,
            // Δbpm>0 = gallop (two half-groups at bpm∓Δ/2), both 0 = smear
            // (ticks emerges at slow bpm). Groove stays out — per-player fixed
            // offsets are a later add. Steps are read from the DOM every tick,
            // so edits and arrow presses land on the NEXT attack — no restart.
            '<div style="color:#8fd6ab;border-top:1px solid #3a3a44;margin-top:8px;padding-top:6px;font-weight:600">LIVE',
            '<span id="texLvSlots" style="font-weight:400;margin-left:6px"></span></div>',
            // steps are ROWS (built per-sequence in lvDraw — the count follows
            // the file, so a first-pass ladder can carry 12+ steps and a dialed
            // one 6). Columns: # · bpm · players · offset.
            '<div id="texLvGrid" style="margin-top:5px"></div>',
            '<div style="display:flex;gap:5px;align-items:center;margin-top:5px;color:#9a9">',
            'jitter<input id="texLvJit" type="number" step="5" min="0" value="0" title="ms; 45 = rain" style="width:44px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px">',
            '&Delta;bpm<input id="texLvDb" type="number" step="1" min="0" value="0" title="2 = gallop: two half-groups at bpm&#8723;&Delta;/2" style="width:40px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px">',
            '<button id="texLvGo" style="flex:1" title="stream continuously; &larr;/&rarr; walk the steps live">Live</button>',
            '<button id="texLvRun" title="auto-advance one step every N seconds (wraps)">Run</button>',
            '<input id="texLvSecs" type="number" step="1" min="1" value="6" style="width:34px;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px">s',
            '</div>',
            // PITCH (live). Presets only, all inside the staccato sounding
            // window MIDI 30-65 (notes outside it are SILENT - the known trap).
            // Lane j gets pitches[j], ascending across the stage line.
            '<div style="display:flex;gap:5px;align-items:center;margin-top:4px;color:#9a9">pitch',
            '<select id="texLvPitch" style="flex:1;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px">',
            '<option value="unison">unison (root)</option>',
            '<option value="octaves">octaves (root pc)</option>',
            '<option value="fifths">fifths stack</option>',
            '<option value="clusterFA">cluster F&ndash;A, octave spread</option>',
            '</select></div>',
            '<div id="texLvOut" style="color:#9a9;margin-top:3px">&mdash;</div>',
            // STOPWATCH LOG — every step change while live gets a timestamped
            // line. `0` restarts the clock (the composer plays a while, THEN
            // starts timing); Copy puts the log on the clipboard as plain text
            // the AI can render back as a fixed texture with those durations.
            '<div style="display:flex;gap:5px;align-items:center;margin-top:4px">',
            '<button id="texLvZero" title="restart the stopwatch at 0.0 and clear the log (key: 0)">0</button>',
            '<button id="texLvCopy" title="copy the log as plain text">Copy log</button>',
            '<span style="color:#666">step changes are logged while LIVE</span>',
            '</div>',
            '<div id="texLvLog" style="display:none;max-height:90px;overflow:auto;margin-top:3px;',
            'font-family:Consolas,monospace;font-size:10px;color:#9a9;background:#1b1b20;',
            'border:1px solid #333;border-radius:3px;padding:3px 6px;white-space:pre"></div>',
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
        d.querySelector('#texLvGo').addEventListener('click', () => this.lvPlay());
        d.querySelector('#texLvRun').addEventListener('click', () => this.lvRun());
        d.querySelector('#texLvZero').addEventListener('click', () => this.lvZero());
        d.querySelector('#texLvCopy').addEventListener('click', () => this.lvCopy());
        // the scheduler reads the DOM each tick, so inputs only need the readout.
        // The grid is rebuilt per sequence, so its listener is DELEGATED.
        d.querySelector('#texLvGrid').addEventListener('input', () => this.lvReadout());
        d.querySelectorAll('#texLvJit,#texLvDb').forEach(i =>
            i.addEventListener('input', () => this.lvReadout()));
        d.querySelector('#texLvPitch').addEventListener('change', () => this.lvReadout());
        this.makeDraggable(d, d.querySelector('#texDrag'));

        // Keys are scoped to the panel: composer.html has global handlers and a
        // stray SPACE here must not fight the transport (plan §15.11).
        d.setAttribute('tabindex', '0');
        d.addEventListener('keydown', e => {
            if (e.target.matches('input,select,textarea')) return;
            const k = e.key;
            const take = () => { e.preventDefault(); e.stopPropagation(); };
            // LIVE owns the keys while it streams: arrows walk the steps at the
            // next attack, SPACE stops. (Click the panel background first if
            // focus is in a number box — there, arrows edit the number.)
            if (this.lv.playing) {
                if (k === 'ArrowLeft' || k === 'ArrowRight') { take(); this.lvStep(k === 'ArrowRight' ? 1 : -1); return; }
                if (k === ' ') { take(); this.lvStop(); return; }
                if (k === '0') { take(); this.lvZero(); return; }
                if (k === 'ArrowUp' || k === 'ArrowDown') { take(); return; }
            }
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
            // ONE stop path: any panic (main Play, Morph, ours) also lands the
            // live stream. lvStop flips `playing` before its own panic, so this
            // cannot recurse.
            if (this.lv.playing) this.lvStop();
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
            // a rev bump is a deliberate AI write — the live boxes follow it
            // too (mid-stream edits land on the next attack, same contract)
            this.lvLoad(j.live);
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

    // ------------------------------------------------------------ LIVE (2ag)
    // A streaming scheduler, deliberately unlike play(): play() books every
    // note of a fixed render upfront; this books only a 160 ms lookahead and
    // reads the boxes each tick, so arrows and edits land on the NEXT attack
    // with no restart. Unseeded by design — a live instrument is not a render;
    // anything worth keeping gets written into the params file and rendered
    // seeded. D29 holds (no bend); CC7 pinned, dynamics ride velocity (D12).

    lvDefaults() {
        const bpms = [36, 54, 72, 90, 108, 132];   // the kept A–F rungs
        const seq = (name, jit, db) => ({ name, jitterMs: jit, dBpm: db, root: 48,
            steps: bpms.map(b => ({ bpm: b, players: 10 })) });
        return { secsPerStep: 6, slot: 1,
                 seqs: [seq('smear A–F', 0, 0), seq('rain A–F', 45, 0),
                        seq('gallop A–F', 0, 2), seq('accretion', 0, 0), seq('scratch', 0, 0)] };
    },

    lvLoad(live) {
        this.lv.data = live ? JSON.parse(JSON.stringify(live)) : this.lvDefaults();
        if (!Array.isArray(this.lv.data.seqs) || !this.lv.data.seqs.length) this.lv.data = this.lvDefaults();
        const want = (this.lv.data.slot || 1) - 1;
        this.lv.slot = Math.max(0, Math.min(this.lv.data.seqs.length - 1, want));
        this.lvDraw();
    },

    lvSeq() { return this.lv.data ? this.lv.data.seqs[this.lv.slot] : null; },

    lvDraw() {
        const d = this.el, s = this.lvSeq();
        if (!s) return;
        const slots = d.querySelector('#texLvSlots');
        slots.innerHTML = '';
        this.lv.data.seqs.forEach((q, i) => {
            const b = document.createElement('button');
            b.textContent = q.name || ('S' + (i + 1));   // named, per the composer
            b.title = 'slot ' + (i + 1);
            b.style.cssText = 'margin:0 0 2px 3px;font-size:10px;padding:0 4px;' +
                (i === this.lv.slot ? 'background:#3F7D5A;color:#fff;border-color:#6fb98f' : '');
            b.addEventListener('click', () => this.lvSlot(i));
            slots.appendChild(b);
        });
        const steps = s.steps || [];
        if (this.lv.step >= steps.length) this.lv.step = 0;
        const grid = d.querySelector('#texLvGrid');
        const inp = 'style="width:100%;box-sizing:border-box;background:#1b1b20;color:#ddd;border:1px solid #444;padding:1px 2px"';
        grid.style.cssText = 'display:grid;grid-template-columns:24px 1fr 1fr 1fr;gap:3px;align-items:center;margin-top:5px';
        grid.innerHTML =
            '<span style="color:#9a9">#</span><span style="color:#9a9">bpm</span>' +
            '<span style="color:#9a9">players</span><span style="color:#9a9">offset</span>' +
            steps.map((st, i) =>
                '<span id="texLvH' + i + '" style="text-align:center;color:#9a9;border-radius:3px">' + (i + 1) + '</span>' +
                '<input id="texLvBpm' + i + '" type="number" step="1" value="' + (st.bpm != null ? st.bpm : 60) + '" ' + inp + '>' +
                '<input id="texLvPl' + i + '" type="number" step="1" min="1" max="10" value="' + (st.players != null ? st.players : 10) + '" ' + inp + '>' +
                '<input id="texLvOff' + i + '" type="number" step="0.01" min="0" max="0.99" value="' + (st.offset || 0) + '" ' + inp + '>'
            ).join('');
        d.querySelector('#texLvJit').value = s.jitterMs || 0;
        d.querySelector('#texLvDb').value = s.dBpm || 0;
        d.querySelector('#texLvPitch').value = s.pitchMode || 'unison';
        if (this.lv.data.secsPerStep) d.querySelector('#texLvSecs').value = this.lv.data.secsPerStep;
        this.lvHilite();
        this.lvReadout();
    },

    lvSaveBoxes() {
        const d = this.el, s = this.lvSeq();
        if (!s) return;
        const n = (s.steps || []).length;
        s.steps = [];
        for (let i = 0; i < n; i++) s.steps.push({
            bpm: parseFloat(d.querySelector('#texLvBpm' + i).value) || 60,
            players: parseFloat(d.querySelector('#texLvPl' + i).value) || 10,
            offset: parseFloat(d.querySelector('#texLvOff' + i).value) || 0,
        });
        s.jitterMs = parseFloat(d.querySelector('#texLvJit').value) || 0;
        s.dBpm = parseFloat(d.querySelector('#texLvDb').value) || 0;
        s.pitchMode = (d.querySelector('#texLvPitch') || {}).value || 'unison';
    },

    lvSlot(i) {
        this.lvSaveBoxes();          // box edits survive a slot round-trip (in memory only)
        this.lv.slot = i;
        this.lvDraw();
        if (this.lv.playing) this.lvLog('(slot)');   // a character change is a log event too
    },

    lvHilite() {
        if (!this.el) return;
        for (let i = 0; ; i++) {
            const h = this.el.querySelector('#texLvH' + i);
            if (!h) break;
            h.style.cssText = 'text-align:center;border-radius:3px;' +
                (i === this.lv.step ? 'background:#3F7D5A;color:#fff' : 'color:#9a9');
        }
    },

    lvStep(delta) {
        const len = ((this.lvSeq() || {}).steps || []).length || 1;
        this.lv.step = (this.lv.step + delta + len) % len;
        this.lvHilite();
        this.lvReadout();
        if (this.lv.playing) this.lvLog();       // arrows AND auto-run land here
    },

    // ------------------------------------------------- stopwatch log (2ag)
    // The log is the composer PERFORMING the ladder's shape by hand, captured
    // as data — paste it back to the AI and it renders as a fixed texture with
    // exactly those step durations (the 2f play-in pattern, at form level).
    lvLogLine(tag) {
        const p = this.lvParams();
        const t = ((performance.now() - this.lv.logT0) / 1000).toFixed(1);
        const ch = p.off > 0 ? 'offset ' + p.off
            : p.db > 0 ? 'gallop d' + p.db : (p.jit > 0 ? 'rain jit' + p.jit : 'smear');
        return t.padStart(6) + 's  step ' + (this.lv.step + 1) + '  ' + p.bpm + 'x' + p.players +
            ' = ' + (p.players * p.bpm / 60).toFixed(1) + '/s  ' + ch + (tag ? '  ' + tag : '');
    },
    lvLog(tag) {
        if (this.lv.logT0 == null) return;
        this.lv.log.push(this.lvLogLine(tag));
        this.lvLogDraw();
    },
    lvLogDraw() {
        const box = this.el.querySelector('#texLvLog');
        if (!box) return;
        box.style.display = this.lv.log.length ? '' : 'none';
        box.textContent = this.lv.log.join('\n');
        box.scrollTop = box.scrollHeight;
    },
    lvZero() {
        this.lv.logT0 = performance.now();
        this.lv.log = [];
        const seq = this.lvSeq() || {};
        this.lvLog('(zero · ' + (seq.name || 'S' + (this.lv.slot + 1)) + ')');
    },
    lvCopy() {
        if (!this.lv.log.length) { this.setStatus('log is empty — press 0 while LIVE', true); return; }
        const text = this.lv.log.join('\n');
        const done = () => this.setStatus('log copied (' + this.lv.log.length + ' lines)');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done,
                () => this.setStatus('clipboard refused — select the log text by hand', true));
        } else this.setStatus('no clipboard API — select the log text by hand', true);
    },

    lvParams() {
        const d = this.el, i = this.lv.step;
        const num = (id, fb) => {
            const el = d.querySelector('#' + id);
            const v = el ? parseFloat(el.value) : NaN;
            return isNaN(v) ? fb : v;
        };
        return {
            bpm: Math.max(1, num('texLvBpm' + i, 60)),
            players: Math.max(1, Math.min(10, Math.round(num('texLvPl' + i, 10)))),
            jit: Math.max(0, num('texLvJit', 0)),
            db: Math.max(0, num('texLvDb', 0)),
            off: Math.max(0, Math.min(0.99, num('texLvOff' + i, 0))),
            pitchMode: (d.querySelector('#texLvPitch') || {}).value || 'unison',
        };
    },

    // PITCH PRESETS — lane j gets pitches(mode)[j], ascending across the stage.
    // Everything stays inside the staccato window 30-65; F1 (29) is below the
    // floor, which is why the F-A cluster starts at F#1. Ring caps measured
    // 2026-08-20: unison(C3) 142 · octaves 125 · fifths 122 · clusterFA 117.
    lvPitches(mode, players, root) {
        let set;
        if (mode === 'octaves') {
            const pc = ((root % 12) + 12) % 12;
            set = [];
            for (let k = pc; k <= 65; k += 12) if (k >= 30) set.push(k);
        } else if (mode === 'fifths') {
            let k = ((root % 12) + 12) % 12;
            while (k < 30) k += 12;
            set = [];
            for (; k <= 65; k += 7) set.push(k);
        } else if (mode === 'clusterFA') {
            set = [30, 31, 33, 41, 42, 44, 45, 53, 55, 57];
        } else return new Array(players).fill(root);
        // spread the set over the lanes, ascending, low end thicker
        const out = [];
        for (let j = 0; j < players; j++) out.push(set[Math.floor(j * set.length / players)]);
        return out;
    },

    // ROTOR (the phase ladder): player j sits at (j·f mod 1) of the per-player
    // cycle. One number spans the taxonomy — f=1/players even (smear) · f=1/q
    // → q evenly spaced cluster-pulses · q>players rationals → uneven figures ·
    // tiny f → the cascade/decollage · irrational → never-repeating lumpy.
    // Per-player spacing stays 60/bpm regardless of f, so the BPM cap table is
    // untouched. offset 0 = OFF (the legacy even round-robin path).
    lvRotor(players, f) {
        const out = [];
        for (let j = 0; j < players; j++) out.push((j * f) % 1);
        return out;
    },
    // orientation only: distinct onset groups per cycle, merged at ~1/48 cycle
    lvRotorGroups(players, f) {
        const bins = new Set();
        this.lvRotor(players, f).forEach(x => bins.add(Math.round(x * 48) % 48));
        return bins.size;
    },

    // Δ>0 splits the players into two half-groups at bpm∓Δ/2 — the two-stream
    // structure that IS a gallop. lap = 60/(Δ × players-per-group): tempo does
    // not move the flutter, player count does.
    lvSplit(players, bpm, db) {
        if (!(db > 0) || players < 2) return [{ n: players, bpm: bpm, lane0: 0 }];
        const nA = Math.ceil(players / 2);
        return [{ n: nA, bpm: bpm - db / 2, lane0: 0 },
                { n: players - nA, bpm: bpm + db / 2, lane0: nA }];
    },

    async lvPlay() {
        if (this.lv.playing) { this.lvStop(); return; }
        const bad = this.preflight();
        if (bad.length) { this.setStatus('PREFLIGHT: ' + bad.join(' · '), true); return; }
        if (!this.lv.data) this.lvLoad(this.params && this.params.live);
        E.panic();
        if (!await E.ensureMidi()) { this.setStatus(E._midiError || 'MIDI unavailable', true); return; }

        const routes = [], missing = {};
        for (let L = 0; L < 10; L++) {
            const r = E.routeFor(L, 'staccato');
            routes.push(r || null);
            if (!r) {
                const C = HOST();
                const inst = C && C.trackInstrument ? C.trackInstrument(L) : null;
                missing[(inst && inst.port) || ('lane ' + L)] = 1;
            }
        }
        if (!routes.some(Boolean)) {
            this.setStatus('no MIDI port for ' + Object.keys(missing).join(', ') +
                ' — is loopMIDI running with those ports open?', true);
            return;
        }
        // CC7 pinned, same contract and same conversion point as play() (D12)
        routes.forEach(r => { if (r) try { r.out.send([0xB0 | r.ch, 7, 127]); } catch (e) {} });

        const seq = this.lvSeq() || {};
        const root = seq.root != null ? seq.root : 48;
        const vel = 95;                       // level 7.5 → velocity
        const LOOK = 160, NOTE = 120, TICK = 60;
        const st = { next: [performance.now() + 150, performance.now() + 150],
                     rr: [0, 0], cyc: performance.now() + 150 };
        this.lv.state = st;
        this.lv.skipped = 0;
        this.lv.playing = true;
        E._playing = true;
        const fire = (route, at, key) => {
            if (!route) { this.lv.skipped++; return; }
            const k = key != null ? key : root;
            E._timers.push(setTimeout(() => E.noteOn(route, k, vel),
                Math.max(0, at - performance.now())));
            E._timers.push(setTimeout(() => E.noteOff(route, k),
                Math.max(0, at + NOTE - performance.now())));
        };
        this.lv.tick = setInterval(() => {
            const now = performance.now();
            const p = this.lvParams();
            const laneP = this.lvPitches(p.pitchMode, p.players, root);
            if (p.off > 0) {
                // ROTOR mode — whole cycles are booked as they enter the look
                // window, so edits land on the NEXT CYCLE (up to 60/bpm late),
                // not the next attack. Δbpm is ignored while an offset is set.
                st.next[0] = now + LOOK; st.next[1] = now + LOOK;   // keep the group clocks fresh
                const T = 60000 / p.bpm;
                if (st.cyc < now) st.cyc = now + 100;               // stale after a mode switch
                while (st.cyc < now + LOOK) {
                    for (let j = 0; j < p.players; j++) {
                        fire(routes[j], st.cyc + ((j * p.off) % 1) * T +
                            (p.jit ? (2 * Math.random() - 1) * p.jit : 0), laneP[j]);
                    }
                    st.cyc += T;
                }
                return;
            }
            st.cyc = now + LOOK;                                    // keep the rotor clock fresh
            const groups = this.lvSplit(p.players, p.bpm, p.db);
            for (let gi = 0; gi < 2; gi++) {
                const g = groups[gi];
                // a dormant group's clock rides just ahead of now, so raising Δ
                // mid-stream starts group B cleanly instead of draining a backlog
                if (!g) { st.next[gi] = now + LOOK; continue; }
                const iv = 60000 / (g.n * g.bpm);
                while (st.next[gi] < now + LOOK) {
                    const lane = g.lane0 + (st.rr[gi]++ % g.n);
                    fire(routes[lane], st.next[gi] + (p.jit ? (2 * Math.random() - 1) * p.jit : 0), laneP[lane]);
                    st.next[gi] += iv;
                }
            }
        }, TICK);
        this.el.querySelector('#texLvGo').textContent = 'Stop';
        this.el.focus();                      // arrows work immediately
        this.lvZero();                        // clock runs from Live; 0 restarts it whenever ready
        this.lvReadout();
    },

    lvStop() {
        if (this.lv.tick) { clearInterval(this.lv.tick); this.lv.tick = null; }
        this.lvLog('(stop)');                // total duration, while logT0 is still live
        this.lv.playing = false;             // BEFORE panic — the onStop chain checks it
        if (this.lv.runT) this.lvRun();      // stopping also parks the auto-run
        E.panic();
        const b = this.el.querySelector('#texLvGo');
        if (b) b.textContent = 'Live';
        this.lvReadout();
    },

    // auto-run: one step every N seconds, wrapping. Works while stopped too —
    // it just walks the highlight, which is also how it gets verified silently.
    lvRun() {
        const b = this.el.querySelector('#texLvRun');
        if (this.lv.runT) {
            clearInterval(this.lv.runT); this.lv.runT = null;
            if (b) b.textContent = 'Run';
            return;
        }
        const secs = Math.max(1, parseFloat(this.el.querySelector('#texLvSecs').value) || 6);
        this.lv.runT = setInterval(() => this.lvStep(1), secs * 1000);
        if (b) b.textContent = '■';
    },

    lvReadout() {
        const out = this.el && this.el.querySelector('#texLvOut');
        if (!out || !this.lv.data) return;
        const p = this.lvParams();
        const rate = p.players * p.bpm / 60;
        const seq = this.lvSeq() || {};
        const len = ((seq.steps || []).length) || 1;
        let s = 'S' + (this.lv.slot + 1) + (seq.name ? ' "' + seq.name + '"' : '') +
            ' · step ' + (this.lv.step + 1) + '/' + len + ' · ' + p.bpm + ' BPM × ' + p.players +
            ' = <b>' + rate.toFixed(1) + '/s</b>';
        if (p.off > 0) {
            s += ' · offset ' + p.off + ' → ≈' + this.lvRotorGroups(p.players, p.off) +
                ' onset groups/cycle' + (p.db > 0 ? ' <span style="color:#777">(Δ ignored)</span>' : '');
        }
        else if (p.db > 0) s += ' · gallop Δ' + p.db + ', lap ~' + (60 / (p.db * Math.ceil(p.players / 2))).toFixed(1) + ' s';
        else if (p.jit > 0) s += ' · rain ±' + p.jit + ' ms';
        else s += ' · smear';
        // per-preset per-player caps (measured 2026-08-20; unison = C3)
        const CAPS = { unison: 142, octaves: 125, fifths: 122, clusterFA: 117 };
        if (p.pitchMode !== 'unison') s += ' · ' + p.pitchMode;
        const cap = CAPS[p.pitchMode] || 142;
        if (p.bpm > cap) s += ' <span style="color:#e0b062">&#9888; over the ' + cap +
            ' BPM ring cap for this pitch set</span>';
        else if (rate > 23) s += ' <span style="color:#e0b062">&#9888; past the ~23/s C3 ring ceiling</span>';
        if (this.lv.playing) s += ' · <b style="color:#8fd6ab">LIVE</b>';
        if (this.lv.skipped) s += ' · <span style="color:#e0b062">' + this.lv.skipped + ' skipped (no port)</span>';
        out.innerHTML = s;
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
