// Composer score server — for seven tubas
// Zero-dependency Node http server. Port 5200.
//
// Saving protocol (see docs/PROJECT_JOURNAL.md):
//   - Canonical score: scores/<name>.json (committed to git at musical milestones)
//   - Versions: scores/versions/<name>_v<timestamp>.json — written ONLY on explicit
//     save (Save button / CTRL+S), rolling cap of 20 per score, gitignored.
//   - Autosave (5s debounce in the UI) writes the canonical file with no version copy.
const http = require('http');
const fs = require('fs');
const path = require('path');

// 5200 is THE port — every doc, bookmark and launch config says so, and the
// default is unchanged. The override exists only so a second, throwaway instance
// can be started for verification while the composer's own server keeps running
// on 5200 (two agents share this tree). Never use it for real work.
const PORT = Number(process.env.PORT) || 5200;
const ROOT = __dirname;                                   // score/
const PUBLIC_DIR = path.join(ROOT, 'public');
const DOCS_DIR = path.join(ROOT, '..', 'docs');           // serves /docs/instrument_map.json
const SCORES_DIR = path.join(ROOT, '..', 'scores');
const MOTIVES_DIR = path.join(ROOT, '..', 'sandbox', 'motives');   // shared library (D8-E)
const VERSIONS_DIR = path.join(SCORES_DIR, 'versions');
const VERSION_CAP = 20;

for (const d of [SCORES_DIR, VERSIONS_DIR, MOTIVES_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.mid': 'audio/midi'
};

const safe = name => String(name).replace(/[^a-zA-Z0-9_-]/g, '_');

// ---- score persistence ----

function saveComposerScore(name, data, makeVersion) {
    const filename = `${safe(name)}.json`;
    const filepath = path.join(SCORES_DIR, filename);
    data.metadata = data.metadata || {};
    data.metadata.modified = new Date().toISOString();

    let versioned = false;
    if (makeVersion && fs.existsSync(filepath)) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync(filepath, path.join(VERSIONS_DIR, `${safe(name)}_v${ts}.json`));
        pruneVersions(name);
        versioned = true;
    }
    fs.writeFileSync(filepath, JSON.stringify(data));
    return { success: true, filename, versioned, modified: data.metadata.modified };
}

function pruneVersions(name) {
    const prefix = `${safe(name)}_v`;
    const files = fs.readdirSync(VERSIONS_DIR)
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .sort();                                          // ISO timestamps sort chronologically
    while (files.length > VERSION_CAP) {
        fs.unlinkSync(path.join(VERSIONS_DIR, files.shift()));
    }
}

function listScores() {
    return fs.readdirSync(SCORES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => {
            const st = fs.statSync(path.join(SCORES_DIR, f));
            return { name: f.replace(/\.json$/, ''), filename: f, modified: st.mtime.toISOString(), size: st.size };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

// ---- tiny req/res helpers (express-shaped so ported handlers work unchanged) ----

function wrapRes(res) {
    return {
        status(code) { res.statusCode = code; return this; },
        json(obj) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); }
    };
}

function readBody(req, cb) {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
        try { cb(null, body ? JSON.parse(body) : {}); }
        catch (e) { cb(e); }
    });
}

// ---- ported from piece #2 server.js (self-contained; used by zone MIDI generation) ----
function handleGenerateOstinato(req, res) {
    try {
        const { chordChanges, handA, handB, curve, duration, smooth, speed, stretch, velMin, velMax, channel } = req.body;

        if (!curve || !duration) {
            return res.status(400).json({ error: 'Missing required fields: curve, duration' });
        }

        // Normalize a hand source into internal format
        function parseHandSource(raw, fallback) {
            if (!raw) return { mode: 'fixed', midis: fallback };
            // New format: { mode, midis/items/strategy }
            if (raw.mode === 'set' && Array.isArray(raw.items) && raw.items.length > 0) {
                return {
                    mode: 'set',
                    items: raw.items.map(it => ({
                        midis: (it.midis || [60]).map(n => parseInt(n, 10))
                    })),
                    strategy: raw.strategy || 'random'
                };
            }
            if (raw.mode === 'fixed' && Array.isArray(raw.midis)) {
                return { mode: 'fixed', midis: raw.midis.map(n => parseInt(n, 10)) };
            }
            // Legacy format: raw is a plain array of MIDI numbers
            if (Array.isArray(raw)) {
                return { mode: 'fixed', midis: raw.map(n => parseInt(n, 10)) };
            }
            return { mode: 'fixed', midis: fallback };
        }

        // Build chord change timeline (sorted by normalized time)
        let chords = [];
        if (chordChanges && Array.isArray(chordChanges) && chordChanges.length > 0) {
            chords = chordChanges
                .map(cc => ({
                    t: parseFloat(cc.t) || 0,
                    hA: parseHandSource(cc.handA, [60]),
                    hB: parseHandSource(cc.handB, [48])
                }))
                .sort((a, b) => a.t - b.t);
        } else if (handA && handB) {
            // Legacy: single chord pair
            chords = [{
                t: 0,
                hA: { mode: 'fixed', midis: String(handA).split(',').map(n => parseInt(n.trim(), 10)) },
                hB: { mode: 'fixed', midis: String(handB).split(',').map(n => parseInt(n.trim(), 10)) }
            }];
        } else {
            return res.status(400).json({ error: 'Missing chordChanges or handA/handB' });
        }

        // Lookup: which chord source is active at a given normalized time?
        function getChordsAt(normTime) {
            let active = chords[0];
            for (let i = 1; i < chords.length; i++) {
                if (chords[i].t <= normTime) active = chords[i];
                else break;
            }
            return active;
        }

        // Resolve a hand source to concrete MIDI pitches for one event
        // Tracks round-robin / no-repeat state per hand key
        const _resolveState = { _rrIndex: {}, _lastPick: {} };
        function resolveHandPitches(handSource, handKey) {
            if (handSource.mode === 'fixed') return handSource.midis;
            if (handSource.mode === 'set') {
                const items = handSource.items;
                const strategy = handSource.strategy || 'random';
                let item;
                if (strategy === 'roundRobin') {
                    const idx = (_resolveState._rrIndex[handKey] || 0) % items.length;
                    item = items[idx];
                    _resolveState._rrIndex[handKey] = idx + 1;
                } else if (strategy === 'noRepeat') {
                    const lastIdx = _resolveState._lastPick[handKey];
                    let attempts = 0, idx;
                    do {
                        idx = Math.floor(Math.random() * items.length);
                        attempts++;
                    } while (idx === lastIdx && items.length > 1 && attempts < 10);
                    item = items[idx];
                    _resolveState._lastPick[handKey] = idx;
                } else {
                    item = items[Math.floor(Math.random() * items.length)];
                }
                return item.midis;
            }
            return handSource.midis || [60];
        }

        if (!fs.existsSync(OSTINATO_DB_PATH)) {
            return res.status(500).json({ error: 'Ostinato timing database not found' });
        }

        const db = JSON.parse(fs.readFileSync(OSTINATO_DB_PATH, 'utf-8'));
        if (!db.samples || db.samples.length === 0) {
            return res.status(500).json({ error: 'No samples in timing database' });
        }

        // Parse curve spec
        const curveSpec = parseOstinatoCurve(curve);

        const durationMs = parseFloat(duration) * 1000;
        const stretchFactor = parseFloat(stretch) || 1.0;
        const speedScale = parseFloat(speed) || 1.0;
        const smoothFactor = parseFloat(smooth) || 0;
        const ch = parseInt(channel) || 0;
        const windowSize = 0.05;

        // Random sample
        const sampleIndex = Math.floor(Math.random() * db.samples.length);
        const sample = db.samples[sampleIndex];
        const attacks = sample.attacks;

        // Create attack lookup (inline from generate_ostinato_midi.js)
        const sorted = [...attacks].sort((a, b) => a.curvePosition - b.curvePosition);
        const gaps = sorted.filter(a => a.gapToNextMs !== null).map(a => a.gapToNextMs);
        const centerGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const allGaps = attacks.filter(a => a.gapToNextMs !== null).map(a => a.gapToNextMs);
        const minGap = Math.min(...allGaps);

        let lastCycleIndex = 0;
        let lastCurveRegion = -1;

        function getAttack(curveY) {
            const lo = curveY - windowSize;
            const hi = curveY + windowSize;
            const nearby = [];
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i].curvePosition >= lo && sorted[i].curvePosition <= hi) {
                    nearby.push({ index: i, attack: sorted[i] });
                }
            }
            if (nearby.length === 0) {
                let bestIdx = 0;
                let bestDist = Math.abs(sorted[0].curvePosition - curveY);
                for (let i = 1; i < sorted.length; i++) {
                    const dist = Math.abs(sorted[i].curvePosition - curveY);
                    if (dist < bestDist) { bestDist = dist; bestIdx = i; }
                }
                return sorted[bestIdx];
            }
            const region = Math.round(curveY / windowSize);
            if (region !== lastCurveRegion) { lastCurveRegion = region; lastCycleIndex = 0; }
            const idx = lastCycleIndex % nearby.length;
            lastCycleIndex++;
            return nearby[idx].attack;
        }

        // Generate events
        const generatedEvents = [];
        let currentTimeMs = 0;
        let handToggle = 0;
        let attackCount = 0;

        while (currentTimeMs < durationMs) {
            const normalizedTime = currentTimeMs / durationMs;
            const curveY = evaluateOstinatoCurve(curveSpec, normalizedTime);
            const attack = getAttack(curveY);

            let rawGap = (attack.gapToNextMs !== null) ? attack.gapToNextMs : centerGap;
            let gap = minGap + (rawGap - minGap) * stretchFactor;

            if (smoothFactor > 0) {
                const lo = curveY - windowSize;
                const hi = curveY + windowSize;
                const nearbyGaps = attacks.filter(a =>
                    a.curvePosition >= lo && a.curvePosition <= hi && a.gapToNextMs !== null
                ).map(a => a.gapToNextMs);
                const localAvgGap = nearbyGaps.length > 0
                    ? nearbyGaps.reduce((a, b) => a + b, 0) / nearbyGaps.length
                    : centerGap;
                const evenGap = minGap + (localAvgGap - minGap) * stretchFactor;
                gap = gap + (evenGap - gap) * smoothFactor;
            }

            gap *= speedScale;
            gap = Math.max(20, gap);

            const activeChord = getChordsAt(normalizedTime);
            const handSource = (handToggle === 0) ? activeChord.hA : activeChord.hB;
            const pitches = resolveHandPitches(handSource, handToggle === 0 ? 'hA' : 'hB');

            let durations;
            if (attack.noteDurationsMs.length === pitches.length) {
                durations = [...attack.noteDurationsMs];
            } else {
                const avgDur = attack.noteDurationsMs.reduce((a, b) => a + b, 0) / attack.noteDurationsMs.length;
                durations = pitches.map(() => avgDur);
            }
            durations = durations.map(d => Math.min(d, gap * 0.9));

            generatedEvents.push({
                onsetMs: currentTimeMs,
                notes: pitches,
                velocity: attack.avgVelocity,
                durations
            });

            currentTimeMs += gap;
            handToggle = 1 - handToggle;
            attackCount++;
            if (attackCount > 10000) break;
        }

        // Velocity remapping: if velMin and/or velMax are provided, remap from sample range
        const hasVelMin = velMin != null && !isNaN(velMin);
        const hasVelMax = velMax != null && !isNaN(velMax);
        if (hasVelMin || hasVelMax) {
            const vels = generatedEvents.map(e => e.velocity);
            const sampleMin = Math.min(...vels);
            const sampleMax = Math.max(...vels);
            const sampleRange = sampleMax - sampleMin || 1;
            const outMin = hasVelMin ? parseInt(velMin, 10) : sampleMin;
            const outMax = hasVelMax ? parseInt(velMax, 10) : sampleMax;
            generatedEvents.forEach(e => {
                const norm = (e.velocity - sampleMin) / sampleRange;
                e.velocity = Math.round(Math.max(1, Math.min(127, outMin + norm * (outMax - outMin))));
            });
        }

        res.json({
            success: true,
            events: generatedEvents,
            attackCount: generatedEvents.length,
            sampleIndex,
            durationMs
        });
    } catch (e) {
        console.error('Ostinato generation error:', e);
        res.status(500).json({ error: e.message });
    }
}

// ---- server ----

const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const R = wrapRes(res);

    // APIs
    if (req.method === 'POST' && url === '/api/composer/save') {
        return readBody(req, (err, body) => {
            if (err) return R.status(400).json({ success: false, error: 'Bad JSON' });
            const { name, data, makeVersion } = body;
            if (!name || !data) return R.status(400).json({ success: false, error: 'Name and data required' });
            try {
                const result = saveComposerScore(name, data, !!makeVersion);
                console.log(`Saved: ${result.filename}${result.versioned ? ' (+version)' : ''}`);
                R.json(result);
            } catch (e) { R.status(500).json({ success: false, error: e.message }); }
        });
    }
    if (req.method === 'GET' && url.startsWith('/api/composer/load/')) {
        const filepath = path.join(SCORES_DIR, `${safe(url.slice('/api/composer/load/'.length))}.json`);
        if (!fs.existsSync(filepath)) return R.status(404).json({ success: false, error: 'Score not found' });
        try { return R.json({ success: true, data: JSON.parse(fs.readFileSync(filepath, 'utf8')) }); }
        catch (e) { return R.status(500).json({ success: false, error: e.message }); }
    }
    if (req.method === 'GET' && url === '/api/composer/list') {
        try { return R.json({ success: true, sessions: listScores() }); }
        catch (e) { return R.status(500).json({ success: false, error: e.message }); }
    }
    // MORPH PARAMS (PLAN 2v) — the conversational control file. The AI writes
    // bank/morph_params.json and bumps `rev`; the panel polls this once a second
    // and regenerates when rev changes. no-store because the whole point is that
    // an edit on disk is visible within the second.
    if (req.method === 'GET' && url === '/api/morphparams') {
        try {
            const mp = path.join(__dirname, '..', 'bank', 'morph_params.json');
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            return res.end(fs.readFileSync(mp, 'utf8'));
        } catch (e) {
            return R.status(500).json({ success: false, error: e.message });
        }
    }
    // TEXTURE PARAMS + MODELS (PLAN 2x) — the same loop for attack fields.
    // Two files, both read-only to the panel: `texture_params.json` is the live
    // variant slate the AI rewrites, `texture_models.json` is the category store
    // the panel's model buttons load their points from. Separate from 2v's files
    // by design — parallel stores, never a shared write (plan §15.9).
    if (req.method === 'GET' && (url === '/api/textureparams' || url === '/api/texturemodels')) {
        try {
            const name = url === '/api/textureparams' ? 'texture_params.json' : 'texture_models.json';
            const tp = path.join(__dirname, '..', 'bank', name);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            return res.end(fs.readFileSync(tp, 'utf8'));
        } catch (e) {
            return R.status(500).json({ success: false, error: e.message });
        }
    }

    // CLUSTER BANK — the cluster sandbox's data (composer 2026-08-15).
    // GET returns it; POST actions mutate one tier each.
    if (url === '/api/clusterbank') {
        const cbPath = path.join(__dirname, '..', 'bank', 'cluster_bank.json');
        const readCb = () => JSON.parse(fs.readFileSync(cbPath, 'utf8'));
        if (req.method === 'GET') {
            try { return R.json({ success: true, bank: readCb() }); }
            catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, body) => {
                if (err) return R.status(400).json({ success: false, error: 'Bad JSON' });
                try {
                    const cb = readCb();
                    const { action } = body || {};
                    const write = () => fs.writeFileSync(cbPath, JSON.stringify(cb, null, 1));
                    if (action === 'saveCluster') {
                        // a recording from the sandbox: REC-01, REC-02, ...
                        const { name, events, tech } = body;
                        if (!Array.isArray(events) || !events.length)
                            return R.status(400).json({ success: false, error: 'events required' });
                        let n = 1;
                        while (cb.clusters['REC-' + String(n).padStart(2, '0')]) n++;
                        const id = 'REC-' + String(n).padStart(2, '0');
                        const span = Math.max(...events.map(e => e.t + e.d));
                        cb.clusters[id] = { name: name || id, family: 'REC', src: 'sandbox recording',
                            recTech: tech || 'staccato', span: +span.toFixed(3),
                            n: events.length, events };
                        write();
                        console.log(`Clusterbank: ${id} recorded (${events.length} notes, ${span.toFixed(1)}s)`);
                        return R.json({ success: true, id });
                    }
                    if (action === 'deleteCluster') {
                        // only recordings may be deleted from the app
                        if (!/^REC-/.test(body.id || '')) return R.status(400).json({ success: false, error: 'only REC-* deletable' });
                        delete cb.clusters[body.id];
                        write();
                        return R.json({ success: true });
                    }
                    if (action === 'saveSnippet') {
                        // a snippet is a full COPY of its window's events (composer
                        // 2026-08-15): editable in place, source untouched
                        const { events, span, provenance } = body;
                        if (!Array.isArray(events) || !events.length)
                            return R.status(400).json({ success: false, error: 'events required' });
                        let n = 1;
                        while (cb.snippets['SN' + n]) n++;
                        const id = 'SN' + n;
                        cb.snippets[id] = { events, span: +(+span).toFixed(3),
                            provenance: provenance || {}, created: new Date().toISOString() };
                        write();
                        console.log(`Clusterbank: ${id} cut (${events.length} notes)`);
                        return R.json({ success: true, id });
                    }
                    if (action === 'updateSnippet') {
                        // in-place edit from the mini piano-roll (also migrates
                        // old pointer snippets to the copy model)
                        const sn = cb.snippets[body.id];
                        if (!sn) return R.status(400).json({ success: false, error: 'unknown snippet' });
                        if (Array.isArray(body.events) && body.events.length) sn.events = body.events;
                        if (body.span != null) sn.span = +(+body.span).toFixed(3);
                        if (body.provenance) sn.provenance = body.provenance;
                        delete sn.cluster; delete sn.t0; delete sn.t1;   // pointer-era fields
                        write();
                        return R.json({ success: true });
                    }
                    if (action === 'deleteSnippet') {
                        delete cb.snippets[body.id];
                        write();
                        return R.json({ success: true });
                    }
                    if (action === 'saveGesture') {
                        // a baked keeper: CG###, static events + provenance
                        const { events, span, provenance, list } = body;
                        if (!Array.isArray(events) || !events.length)
                            return R.status(400).json({ success: false, error: 'events required' });
                        // content dedup (same events -> same id), like sonorities
                        const key = JSON.stringify(events);
                        let id = Object.keys(cb.gestures).find(g => JSON.stringify(cb.gestures[g].events) === key);
                        let existed = true;
                        if (!id) {
                            existed = false;
                            let n = 1;
                            while (cb.gestures['CG' + String(n).padStart(3, '0')]) n++;
                            id = 'CG' + String(n).padStart(3, '0');
                            cb.gestures[id] = { events, span: +(+span).toFixed(3),
                                provenance: provenance || {}, created: new Date().toISOString() };
                        }
                        let added = false;
                        if (list && list !== '__library__') {
                            cb.lists[list] = cb.lists[list] || [];
                            if (!cb.lists[list].includes(id)) { cb.lists[list].push(id); added = true; }
                        }
                        write();
                        console.log(`Clusterbank: ${id} ${existed ? 'matched' : 'saved'}${added ? ' -> ' + list : ''}`);
                        return R.json({ success: true, id, existed, added });
                    }
                    if (action === 'updateGesture') {
                        // save-over: replace a stored keeper in place (the
                        // composer score's strip reads these, so this is a
                        // deliberate, explicit action - never an autosave)
                        const g = cb.gestures[body.id];
                        if (!g) return R.status(400).json({ success: false, error: 'unknown gesture' });
                        if (Array.isArray(body.events) && body.events.length) g.events = body.events;
                        if (body.span != null) g.span = +(+body.span).toFixed(3);
                        if (body.provenance) g.provenance = body.provenance;
                        g.modified = new Date().toISOString();
                        write();
                        console.log(`Clusterbank: ${body.id} overwritten (${g.events.length} notes)`);
                        return R.json({ success: true, id: body.id });
                    }
                    if (action === 'deleteGesture') {
                        delete cb.gestures[body.id];
                        Object.keys(cb.lists).forEach(l => {
                            cb.lists[l] = cb.lists[l].filter(x => x !== body.id);
                        });
                        write();
                        return R.json({ success: true });
                    }
                    if (action === 'createList') {
                        const name = String(body.name || '').trim();
                        if (!name) return R.status(400).json({ success: false, error: 'name required' });
                        cb.lists[name] = cb.lists[name] || [];
                        write();
                        return R.json({ success: true });
                    }
                    if (action === 'removeFromList') {
                        const { list, id } = body;
                        if (cb.lists[list]) cb.lists[list] = cb.lists[list].filter(x => x !== id);
                        write();
                        return R.json({ success: true });
                    }
                    return R.status(400).json({ success: false, error: 'unknown action' });
                } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
            });
        }
    }
    // MODEL <-> ACTUAL (PLAN 2y). Three reads and one write.
    //
    // The write goes through tools/model_bank.js — the SAME buildActual() the
    // CLI uses — so the panel button and `--actualize` cannot drift into two
    // slightly different save paths. That file guards its own CLI dispatch on
    // require.main, so requiring it here is inert.
    // PULSE PALETTE (PLAN 2aa) — the sonority menu for the pulse sequencer strip.
    // Dumb file read, same shape as the two below: the panel resolves `ref`
    // entries against /api/taxonomy itself, so a rename in the taxonomy reaches
    // the menu with nothing to rebuild here.
    if (req.method === 'GET' && url === '/api/pulsepalette') {
        try {
            const pp = path.join(__dirname, '..', 'bank', 'pulse_palette.json');
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            return res.end(fs.readFileSync(pp, 'utf8'));
        } catch (e) {
            return R.status(500).json({ success: false, error: e.message });
        }
    }
    // PANEL SNAPSHOTS (PLAN 2ab) — named states for the sandbox panels, one file
    // for all of them. `state` is OPAQUE here: whatever the panel's own save()
    // writes, stored verbatim, so a new panel needs no server edit. All the
    // merge rules (and their whys) live in score/snapshots.js, pinned by
    // tools/test_snapshots.js.
    if (url === '/api/snapshots') {
        const SNAP_FILE = path.join(__dirname, '..', 'bank', 'panel_snapshots.json');
        const SNAP = require('./snapshots.js');
        if (req.method === 'GET') {
            try {
                if (!fs.existsSync(SNAP_FILE)) {
                    // Say the file is missing rather than pretending it is empty:
                    // an empty list and a deleted bank look identical otherwise.
                    return R.json({ _version: 1, _missing: true, panels: {} });
                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
                return res.end(fs.readFileSync(SNAP_FILE, 'utf8'));
            } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, body) => {
                if (err) return R.status(400).json({ success: false, error: 'bad body' });
                try {
                    const file = fs.existsSync(SNAP_FILE)
                        ? JSON.parse(fs.readFileSync(SNAP_FILE, 'utf8'))
                        : { _version: 1, panels: {} };
                    const r = SNAP.merge(file, body);
                    if (!r.ok) return R.status(400).json({ success: false, error: r.error });
                    fs.writeFileSync(SNAP_FILE, JSON.stringify(file, null, 2) + '\n');
                    return R.json({ success: true, action: r.action,
                                    existed: r.existed, panels: r.count });
                } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
            });
        }
    }
    if (req.method === 'GET' && (url === '/api/morphmodels' || url === '/api/shapepresets')) {
        try {
            const name = url === '/api/morphmodels' ? 'morph_models.json' : 'shape_presets.json';
            const mp = path.join(__dirname, '..', 'bank', name);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            return res.end(fs.readFileSync(mp, 'utf8'));
        } catch (e) {
            return R.status(500).json({ success: false, error: e.message });
        }
    }
    if (url === '/api/actuals') {
        const MB = require('../tools/model_bank.js');
        if (req.method === 'GET') {
            try {
                const dir = MB.ACTUALS_DIR;
                const list = !fs.existsSync(dir) ? [] : fs.readdirSync(dir)
                    .filter(f => /\.json$/i.test(f))
                    .map(f => {
                        const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
                        // the browse card, without shipping every note array
                        return { entity: a.entity, label: a.label, tags: a.tags,
                                 spanSec: a.spanSec, parts: a.parts, register: a.register,
                                 model: a.provenance && a.provenance.model,
                                 seed: a.provenance && a.provenance.seed,
                                 recipeSettings: (a.provenance && a.provenance.recipeSettings) || {},
                                 placements: (a.placements || []).length,
                                 notes: (a.notes || []).length };
                    });
                return R.json({ success: true, actuals: list });
            } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, body) => {
                if (err) return R.status(400).json({ success: false, error: 'bad body' });
                try {
                    const built = MB.buildActual(body.model, {
                        recipeSettings: body.recipeSettings || {},
                        seed: body.seed, label: body.label, tags: body.tags,
                        shape: body.shape, shapePreset: body.shapePreset,
                        params: body.params,
                    });
                    if (built.error) return R.status(400).json({ success: false, error: built.error });
                    MB.writeActual(built);
                    return R.json({ success: true, entity: built.actual.entity,
                                    rev: built.store.rev, warnings: built.warnings });
                } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
            });
        }
    }
    if (req.method === 'GET' && url.startsWith('/api/actuals/')) {
        try {
            const MB = require('../tools/model_bank.js');
            const file = path.basename(url.slice('/api/actuals/'.length)).replace(/\.json$/, '') + '.json';
            const p = path.join(MB.ACTUALS_DIR, file);
            if (!fs.existsSync(p)) return R.status(404).json({ success: false, error: 'no such actual' });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            return res.end(fs.readFileSync(p, 'utf8'));
        } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
    }
    // PLACEMENTS are logged automatically by whoever places (2y §5) — the panel
    // posts here, place_gesture.js writes the file directly.
    if (req.method === 'POST' && url === '/api/actualplacement') {
        return readBody(req, (err, body) => {
            if (err) return R.status(400).json({ success: false, error: 'bad body' });
            try {
                const MB = require('../tools/model_bank.js');
                const p = path.join(MB.ACTUALS_DIR, path.basename(body.entity) + '.json');
                if (!fs.existsSync(p)) return R.status(404).json({ success: false, error: 'no such actual' });
                const a = JSON.parse(fs.readFileSync(p, 'utf8'));
                a.placements = a.placements || [];
                a.placements.push({ score: body.score, at: body.at, group: body.group,
                                    when: new Date().toISOString().slice(0, 10) });
                fs.writeFileSync(p, JSON.stringify(a, null, 2) + '\n');
                return R.json({ success: true, placements: a.placements.length });
            } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        });
    }

    // TAXONOMY — the blast filing registry (docs/TAXONOMY.md). GET returns it;
    // POST actions: saveVoicing (assigns the next V number for the chord),
    // addKeeper (appends a realization snapshot to a section palette).
    if (url === '/api/taxonomy') {
        const taxPath = path.join(__dirname, '..', 'bank', 'blast_taxonomy.json');
        const readTax = () => JSON.parse(fs.readFileSync(taxPath, 'utf8'));
        if (req.method === 'GET') {
            try { return R.json({ success: true, tax: readTax() }); }
            catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, body) => {
                if (err) return R.status(400).json({ success: false, error: 'Bad JSON' });
                try {
                    const tax = readTax();
                    const { action } = body || {};
                    if (action === 'saveVoicing') {
                        const { chord, desc, pitches, cuivre } = body;
                        if (!chord || !Array.isArray(pitches) || !pitches.length)
                            return R.status(400).json({ success: false, error: 'chord + pitches required' });
                        tax.harmonies[chord] = tax.harmonies[chord] || { voicings: {}, realizations: [] };
                        const vs = tax.harmonies[chord].voicings = tax.harmonies[chord].voicings || {};
                        let n = 1;
                        while (vs['V' + n]) n++;
                        vs['V' + n] = { desc: desc || 'saved from sandbox', pitches: pitches.slice().sort((a, b) => a - b) };
                        if (Array.isArray(cuivre) && cuivre.length) vs['V' + n].cuivre = cuivre.slice().sort((a, b) => a - b);
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: ${chord} V${n} saved`);
                        return R.json({ success: true, voicing: 'V' + n });
                    }
                    if (action === 'saveSonority') {
                        // layer 3: voicing + per-note articulations + cuivre +
                        // length/dyn -> the BIG library of blast sonorities
                        const { sonority } = body;
                        if (!sonority || !sonority.chord) return R.status(400).json({ success: false, error: 'sonority required' });
                        tax.sonorities = tax.sonorities || {};
                        // DEDUP: an exact content match returns the existing id
                        // (so re-starring a sound is idempotent; adding it to a
                        // new list just adds membership). Different dyn/len/
                        // artic = genuinely different sonority = new id.
                        const key = o => JSON.stringify([o.chord, o.voicing, o.pitches,
                            o.cuivreConverted || [], o.cuivreAdded || [], o.artic || {}, o.ordLen, o.dyn]);
                        const dupe = Object.entries(tax.sonorities).find(([, o]) => key(o) === key(sonority));
                        if (dupe) {
                            console.log(`Taxonomy: sonority duplicate -> ${dupe[0]}`);
                            return R.json({ success: true, id: dupe[0], duplicate: true });
                        }
                        let n = 1;
                        while (tax.sonorities['S' + String(n).padStart(3, '0')]) n++;
                        const id = 'S' + String(n).padStart(3, '0');
                        sonority.saved = new Date().toISOString();
                        tax.sonorities[id] = sonority;
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: sonority ${id} (${sonority.chord})`);
                        return R.json({ success: true, id });
                    }
                    if (action === 'addToList') {
                        // named custom lists (e.g. "INT2 blasts") of sonority ids
                        const { list, id } = body;
                        if (!list || !id) return R.status(400).json({ success: false, error: 'list + id required' });
                        tax.customLists = tax.customLists || {};
                        tax.customLists[list] = tax.customLists[list] || [];
                        if (!tax.customLists[list].includes(id)) tax.customLists[list].push(id);
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: ${id} -> list "${list}" (${tax.customLists[list].length})`);
                        return R.json({ success: true, count: tax.customLists[list].length });
                    }
                    if (action === 'chordCuivre') {
                        // cuivre is CHORD-LEVEL ARTICULATION (composer 2026-08-14):
                        // one set of cuivre pitches per chord, riding on any voicing
                        const { chord, pitches, arrangement } = body;
                        if (!chord) return R.status(400).json({ success: false, error: 'chord required' });
                        tax.harmonies[chord] = tax.harmonies[chord] || { voicings: {}, realizations: [] };
                        tax.harmonies[chord].stdCuivre = (pitches || []).slice().sort((a, b) => a - b);
                        if (arrangement && arrangement.voicing) {
                            // a manually-thinned "cuivre version" of one voicing
                            tax.harmonies[chord].cuivreArr = tax.harmonies[chord].cuivreArr || {};
                            tax.harmonies[chord].cuivreArr[arrangement.voicing] =
                                { pitches: arrangement.pitches, cuivre: arrangement.cuivre };
                        }
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: ${chord} cuivre = [${tax.harmonies[chord].stdCuivre}]` +
                            (arrangement ? ` + ${arrangement.voicing} arrangement` : ''));
                        return R.json({ success: true, stdCuivre: tax.harmonies[chord].stdCuivre,
                            cuivreArr: tax.harmonies[chord].cuivreArr });
                    }
                    if (action === 'subset') {
                        // chord-library SUBSETS: named views of the 33 (the main
                        // library itself is never edited from here)
                        const { op, name, chord } = body;
                        if (!name) return R.status(400).json({ success: false, error: 'subset name required' });
                        tax.chordSubsets = tax.chordSubsets || {};
                        if (op === 'create') tax.chordSubsets[name] = tax.chordSubsets[name] || [];
                        else if (op === 'add') {
                            tax.chordSubsets[name] = tax.chordSubsets[name] || [];
                            if (!tax.chordSubsets[name].includes(chord)) tax.chordSubsets[name].push(chord);
                            tax.chordSubsets[name].sort();
                        } else if (op === 'remove') {
                            tax.chordSubsets[name] = (tax.chordSubsets[name] || []).filter(c => c !== chord);
                        } else return R.status(400).json({ success: false, error: 'unknown op' });
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: subset "${name}" ${op}${chord ? ' ' + chord : ''} (${tax.chordSubsets[name].length})`);
                        return R.json({ success: true, members: tax.chordSubsets[name] });
                    }
                    if (action === 'createList') {
                        const { list } = body;
                        if (!list) return R.status(400).json({ success: false, error: 'list name required' });
                        tax.customLists = tax.customLists || {};
                        tax.customLists[list] = tax.customLists[list] || [];
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: list created "${list}"`);
                        return R.json({ success: true });
                    }
                    if (action === 'removeFromList') {
                        const { list, id } = body;
                        if (!list || !id) return R.status(400).json({ success: false, error: 'list + id required' });
                        tax.customLists = tax.customLists || {};
                        tax.customLists[list] = (tax.customLists[list] || []).filter(x => x !== id);
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        return R.json({ success: true, count: tax.customLists[list].length });
                    }
                    if (action === 'addKeeper') {
                        const { section, entry } = body;
                        if (!section || !entry) return R.status(400).json({ success: false, error: 'section + entry required' });
                        tax.sectionPalettes = tax.sectionPalettes || {};
                        tax.sectionPalettes[section] = tax.sectionPalettes[section] || [];
                        entry.saved = new Date().toISOString();
                        tax.sectionPalettes[section].push(entry);
                        fs.writeFileSync(taxPath, JSON.stringify(tax, null, 2));
                        console.log(`Taxonomy: keeper -> ${section} (${tax.sectionPalettes[section].length})`);
                        return R.json({ success: true, count: tax.sectionPalettes[section].length });
                    }
                    return R.status(400).json({ success: false, error: 'unknown action' });
                } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
            });
        }
    }
    // PALETTE — a curated menu of material scores. Entries are REFERENCES to
    // scores/<file>.json (never copies), so editing a file updates it in both
    // the Load menu and the palette.
    if (url === '/api/composer/palette') {
        const palettePath = path.join(__dirname, 'palette.json');
        const read = () => {
            if (!fs.existsSync(palettePath)) return { entries: [] };
            return JSON.parse(fs.readFileSync(palettePath, 'utf8'));
        };
        if (req.method === 'GET') {
            try {
                const p = read();
                const existing = new Set(listScores().map(s => s.name));
                // flag entries whose file has gone missing rather than hiding them
                const entries = (p.entries || []).map(e => ({ ...e, missing: !existing.has(e.file) }));
                return R.json({ success: true, entries });
            } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, body) => {
                if (err) return R.status(400).json({ success: false, error: 'Bad JSON' });
                const { action, name, file, group } = body || {};
                if (!file) return R.status(400).json({ success: false, error: 'file required' });
                try {
                    const p = read();
                    p.entries = p.entries || [];
                    if (action === 'remove') {
                        p.entries = p.entries.filter(e => e.file !== file);
                    } else {
                        const i = p.entries.findIndex(e => e.file === file);
                        const entry = { name: name || file, file, group: group || 'working' };
                        if (i >= 0) p.entries[i] = { ...p.entries[i], ...entry };
                        else p.entries.push(entry);
                    }
                    fs.writeFileSync(palettePath, JSON.stringify(p, null, 2));
                    console.log(`Palette ${action === 'remove' ? 'removed' : 'saved'}: ${file}`);
                    R.json({ success: true, entries: p.entries });
                } catch (e) { R.status(500).json({ success: false, error: e.message }); }
            });
        }
    }
    // load a specific version snapshot (Restore menu)
    if (req.method === 'GET' && url.startsWith('/api/composer/version-load/')) {
        const file = safe(url.slice('/api/composer/version-load/'.length).replace(/\.json$/, '')) + '.json';
        const fp = path.join(VERSIONS_DIR, file);
        if (!fs.existsSync(fp)) return R.status(404).json({ success: false, error: 'version not found' });
        try { return R.json({ success: true, data: JSON.parse(fs.readFileSync(fp, 'utf8')) }); }
        catch (e) { return R.status(500).json({ success: false, error: e.message }); }
    }
    // discard a working copy after it has been promoted
    if (req.method === 'POST' && url === '/api/composer/discard') {
        return readBody(req, (err, body) => {
            if (err) return R.status(400).json({ success: false, error: 'Bad JSON' });
            const fp = path.join(SCORES_DIR, `${safe(body.name)}.json`);
            try {
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
                console.log(`Discarded working copy: ${body.name}`);
                R.json({ success: true });
            } catch (e) { R.status(500).json({ success: false, error: e.message }); }
        });
    }
    if (req.method === 'GET' && url.startsWith('/api/composer/versions/')) {
        const prefix = `${safe(url.slice('/api/composer/versions/'.length))}_v`;
        try {
            return R.json({
                success: true,
                versions: fs.readdirSync(VERSIONS_DIR).filter(f => f.startsWith(prefix)).sort().reverse()
            });
        } catch (e) { return R.status(500).json({ success: false, error: e.message }); }
    }
    // ---- motive library (same files the sandbox reads/writes) ----
    if (req.method === 'GET' && url === '/api/motives') {
        try {
            const list = fs.readdirSync(MOTIVES_DIR).filter(f => f.endsWith('.json')).map(f => {
                try {
                    const m = JSON.parse(fs.readFileSync(path.join(MOTIVES_DIR, f), 'utf8'));
                    return { file: f, name: m.name || f, instrument: m.instrument || '', technique: m.technique || '', notes: (m.events || []).length };
                } catch (e) { return { file: f, name: f, instrument: '', technique: '', notes: 0 }; }
            });
            return R.json(list);
        } catch (e) { return R.status(500).json({ error: e.message }); }
    }
    if (req.method === 'POST' && url === '/api/motives') {
        return readBody(req, (err, m) => {
            if (err || !m.name || !Array.isArray(m.events)) return R.status(400).json({ error: 'name and events required' });
            let slug = String(m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'motive';
            let file = slug + '.json', n = 2;
            while (fs.existsSync(path.join(MOTIVES_DIR, file))) file = `${slug}-${n++}.json`;
            fs.writeFileSync(path.join(MOTIVES_DIR, file), JSON.stringify(m, null, 2));
            console.log(`Motive created: ${file}`);
            R.json({ file });
        });
    }
    if (url.startsWith('/api/motives/')) {
        const file = path.basename(url.slice('/api/motives/'.length));
        if (!file.endsWith('.json')) return R.status(400).json({ error: 'bad file' });
        const filepath = path.join(MOTIVES_DIR, file);
        if (req.method === 'GET') {
            if (!fs.existsSync(filepath)) return R.status(404).json({ error: 'not found' });
            try { return R.json(JSON.parse(fs.readFileSync(filepath, 'utf8'))); }
            catch (e) { return R.status(500).json({ error: e.message }); }
        }
        if (req.method === 'POST') {
            return readBody(req, (err, m) => {
                if (err || !m || !Array.isArray(m.events)) return R.status(400).json({ error: 'events required' });
                fs.writeFileSync(filepath, JSON.stringify(m, null, 2));
                console.log(`Motive updated: ${file}`);
                R.json({ file });
            });
        }
    }
    if (req.method === 'GET' && url.startsWith('/probes/') && url.endsWith('.json')) {
        const pfile = path.join(ROOT, '..', 'probes', path.basename(url));
        if (!fs.existsSync(pfile)) { res.statusCode = 404; return res.end('{}'); }
        res.setHeader('Content-Type', 'application/json');
        return fs.createReadStream(pfile).pipe(res);
    }
    if (req.method === 'GET' && url === '/sandbox/instruments.js') {
        res.setHeader('Content-Type', 'text/javascript');
        return fs.createReadStream(path.join(ROOT, '..', 'sandbox', 'instruments.js')).pipe(res);
    }
    if (req.method === 'POST' && url === '/api/generate-ostinato') {
        return readBody(req, (err, body) => {
            if (err) return R.status(400).json({ error: 'Bad JSON' });
            handleGenerateOstinato({ body }, R);
        });
    }

    // Static: /docs/* from repo docs, everything else from score/public
    if (req.method === 'GET') {
        let base = PUBLIC_DIR, rel = url;
        if (url === '/' || url === '/composer.html') rel = '/composer.html';
        if (url.startsWith('/docs/')) { base = DOCS_DIR; rel = url.slice('/docs'.length); }
        if (url.startsWith('/bank/')) { base = path.join(__dirname, '..', 'bank'); rel = url.slice('/bank'.length); }
        // notation stratum (read-only GET): app page, lib modules, IR docs,
        // registry, schema — Phase B5 (plan DB-1)
        if (url.startsWith('/notation/')) { base = path.join(__dirname, '..', 'notation'); rel = url.slice('/notation'.length); }
        const filepath = path.normalize(path.join(base, rel));
        if (!filepath.startsWith(path.normalize(base))) { res.statusCode = 403; return res.end('Forbidden'); }
        if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
            res.setHeader('Content-Type', MIME[path.extname(filepath).toLowerCase()] || 'application/octet-stream');
            // never let the browser cache app code — a stale composer.html
            // silently drops new features (the 2026-08-13 resize confusion)
            res.setHeader('Cache-Control', 'no-store');
            return fs.createReadStream(filepath).pipe(res);
        }
    }
    res.statusCode = 404;
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Composer score (b.cl / harp / accordion) at http://localhost:${PORT}/composer.html`);
    console.log(`Scores: ${SCORES_DIR}`);
});
