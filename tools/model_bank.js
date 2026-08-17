#!/usr/bin/env node
// model_bank.js — PLAN 2y, the MODEL <-> ACTUAL store's CLI and its validator.
//
// THE VALIDATOR IS THE SPEC. It was written before the store it validates, and
// it is the only place that says what a well-formed model, recipe or actual is.
// If a rule is not enforced here it is not a rule.
//
//   node tools/model_bank.js --list
//   node tools/model_bank.js --show BLOOM
//   node tools/model_bank.js --validate
//
// (--actualize arrives with MA2, the save path.)
//
// Everything here is plain node against JSON files. No server, no MIDI: the
// engine is pure, so re-derivation can be checked offline, which is what makes
// "every actual is reproducible the day it is born" a cheap promise to keep.

const fs = require('fs');
const path = require('path');
const M = require('../score/public/morph.js');

const ROOT = path.join(__dirname, '..');
const MODELS_PATH = path.join(ROOT, 'bank', 'morph_models.json');
const ACTUALS_DIR = path.join(ROOT, 'bank', 'actuals');
const PRESETS_PATH = path.join(ROOT, 'bank', 'shape_presets.json');
const SAMPLE_LENGTHS = path.join(ROOT, 'bank', 'sample_lengths.json');

const args = process.argv.slice(2);
const has = f => args.indexOf('--' + f) >= 0;
const valOf = f => { const i = args.indexOf('--' + f); return i >= 0 ? args[i + 1] : null; };

// ---------------------------------------------------------------- loading
function readJSON(p) {
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { return { _parseError: e.message }; }
}
function loadActuals() {
    if (!fs.existsSync(ACTUALS_DIR)) return [];
    return fs.readdirSync(ACTUALS_DIR)
        .filter(f => /\.json$/i.test(f))
        .map(f => ({ file: f, data: readJSON(path.join(ACTUALS_DIR, f)) }));
}
const sampleLengths = readJSON(SAMPLE_LENGTHS);
const RENDER_OPTS = { maxVoices: 10, sampleLengths: sampleLengths };

// ---------------------------------------------------------------- reporting
const problems = [];
const warnings = [];
const err = (where, msg) => problems.push(where + ': ' + msg);
const warn = (where, msg) => warnings.push(where + ': ' + msg);

// Structural equality on parsed JSON. 2y §9.6 rule 2: "byte-identical" in the
// gates means DEEP-EQUAL on parsed JSON — key order and float formatting may
// differ between writes, content may not.
function deepEq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---------------------------------------------------------------- schema
const MODEL_KEYS = ['name', 'id', 'status', 'modelType', 'character', 'elements',
                    'verdict', 'tags', 'notes', 'baseParams', 'recipes', 'actuals',
                    'seededFrom'];
const RECIPE_KEYS = ['recipe', 'description', 'dial', 'waypoints', 'boundsFrom', 'notes'];
const DIAL_KEYS = ['min', 'max', 'default'];
const WAYPOINT_KEYS = ['at', 'patch'];
const ACTUAL_KEYS = ['entity', 'kind', 'label', 'tags', 'spanSec', 'parts', 'register',
                     'objects', 'notes', 'provenance', 'placements', 'source'];
const PROV_KEYS = ['model', 'recipeSettings', 'resolvedParams', 'seed',
                   'engineConstants', 'captured', 'shapePreset'];
const STATUSES = ['stock', 'draft', 'retired'];

function checkUnknown(obj, allowed, where) {
    Object.keys(obj || {}).forEach(k => {
        if (allowed.indexOf(k) < 0 && k[0] !== '_') warn(where, 'unrecognised key "' + k + '"');
    });
}

function validateRecipe(rec, where, seenPaths) {
    if (!rec || typeof rec !== 'object') { err(where, 'recipe is not an object'); return; }
    checkUnknown(rec, RECIPE_KEYS, where);
    if (!rec.recipe) err(where, 'missing "recipe" (the dial\'s name)');
    if (!rec.description) warn(where, 'no description — the composer reads these');

    const d = rec.dial;
    if (!d || typeof d !== 'object') err(where, 'missing "dial" {min,max,default}');
    else {
        checkUnknown(d, DIAL_KEYS, where + '.dial');
        ['min', 'max', 'default'].forEach(k => {
            if (typeof d[k] !== 'number') err(where + '.dial', k + ' must be a number');
        });
        if (typeof d.min === 'number' && typeof d.max === 'number' && !(d.max > d.min)) {
            err(where + '.dial', 'max must exceed min');
        }
        if (typeof d.default === 'number' && typeof d.min === 'number' &&
            typeof d.max === 'number' && (d.default < d.min || d.default > d.max)) {
            err(where + '.dial', 'default ' + d.default + ' is outside [' + d.min + ',' + d.max + ']');
        }
    }

    const wps = rec.waypoints;
    if (!Array.isArray(wps) || wps.length < 2) {
        err(where, 'needs at least 2 waypoints (a dial is endpoints + interpolation)');
        return;
    }
    let prev = -Infinity;
    wps.forEach((w, i) => {
        const ww = where + '.waypoints[' + i + ']';
        checkUnknown(w, WAYPOINT_KEYS, ww);
        if (typeof w.at !== 'number') { err(ww, '"at" must be a number'); return; }
        if (w.at <= prev) err(ww, '"at" must strictly ascend (got ' + w.at + ' after ' + prev + ')');
        prev = w.at;
        if (d && typeof d.min === 'number' && (w.at < d.min || w.at > d.max)) {
            err(ww, '"at" ' + w.at + ' is outside the dial range');
        }
        if (!w.patch || typeof w.patch !== 'object') { err(ww, 'missing "patch"'); return; }
        Object.keys(w.patch).forEach(p => {
            const t = M.paramPathType(p);
            // THE RULE THAT MATTERS: a typo'd path is an error, never a dial
            // that quietly does nothing (2y §9 failure 2).
            if (t === null) err(ww, 'unknown param path "' + p + '"');
            else if (t === 'number' && typeof w.patch[p] !== 'number') {
                err(ww, '"' + p + '" is declared numeric but got ' +
                    JSON.stringify(w.patch[p]) + ' — it would step, not lerp');
            }
            if (seenPaths) {
                if (seenPaths[p] && seenPaths[p] !== rec.recipe) {
                    warn(where, 'path "' + p + '" is also moved by recipe "' +
                         seenPaths[p] + '" — last recipe listed wins');
                } else seenPaths[p] = rec.recipe;
            }
        });
    });
    // endpoints must cover the dial, or the ends of the slider do nothing
    if (d && typeof d.min === 'number' && wps.length) {
        if (wps[0].at > d.min) warn(where, 'first waypoint at ' + wps[0].at +
            ' leaves [' + d.min + ',' + wps[0].at + ') flat');
        if (wps[wps.length - 1].at < d.max) warn(where, 'last waypoint at ' +
            wps[wps.length - 1].at + ' leaves (' + wps[wps.length - 1].at + ',' + d.max + '] flat');
    }
}

function validateModel(id, m, actualIndex) {
    const where = 'model ' + id;
    if (!m || typeof m !== 'object') { err(where, 'not an object'); return; }
    checkUnknown(m, MODEL_KEYS, where);
    if (m.id !== id) err(where, '"id" is "' + m.id + '" but the key is "' + id + '"');
    if (!m.name) err(where, 'missing "name"');
    if (STATUSES.indexOf(m.status) < 0) err(where, 'status "' + m.status + '" not one of ' + STATUSES.join('|'));
    if (!m.character) warn(where, 'no "character" — this is what the composer browses by');

    if (!m.baseParams || typeof m.baseParams !== 'object') { err(where, 'missing "baseParams"'); return; }
    if (m.modelType && m.baseParams.model && m.modelType !== m.baseParams.model) {
        err(where, 'modelType "' + m.modelType + '" disagrees with baseParams.model "' +
            m.baseParams.model + '"');
    }
    // baseParams must render, and must do so without the engine complaining
    let res = null;
    try { res = M.render(m.baseParams, RENDER_OPTS); }
    catch (e) { err(where, 'baseParams does not render: ' + e.message); return; }
    if (!res.notes.length) err(where, 'baseParams renders zero notes');
    res.warnings.forEach(w => warn(where + '.baseParams', w));
    if (res.summary.hard) err(where, 'baseParams renders ' + res.summary.hard + ' HARD conflicts');

    const seenPaths = {};
    (m.recipes || []).forEach((r, i) =>
        validateRecipe(r, where + '.recipes[' + i + ']' + (r && r.recipe ? ' "' + r.recipe + '"' : ''), seenPaths));

    (m.actuals || []).forEach(aid => {
        if (!actualIndex[aid]) err(where, 'lists actual "' + aid + '" which does not exist in bank/actuals/');
        else if (actualIndex[aid].provenance && actualIndex[aid].provenance.model !== id) {
            err(where, 'lists actual "' + aid + '" but that actual\'s provenance points at "' +
                actualIndex[aid].provenance.model + '"');
        }
    });
}

function validateActual(file, a, models) {
    const where = 'actual ' + file;
    if (!a || typeof a !== 'object') { err(where, 'not an object'); return; }
    if (a._parseError) { err(where, 'unparseable JSON: ' + a._parseError); return; }
    checkUnknown(a, ACTUAL_KEYS, where);
    const expect = file.replace(/\.json$/i, '');
    if (a.entity !== expect) err(where, '"entity" is "' + a.entity + '" but the file is "' + expect + '"');
    if (a.kind !== 'actual') err(where, '"kind" must be "actual" (got ' + JSON.stringify(a.kind) + ')');
    if (!a.label) err(where, 'missing "label" — labeling is mandatory at save (2y §5)');
    if (!Array.isArray(a.tags)) warn(where, 'no tags array');
    if (!Array.isArray(a.objects) || !a.objects.length) { err(where, 'missing "objects"'); return; }
    if (!Array.isArray(a.notes) || !a.notes.length) { err(where, 'missing "notes"'); return; }
    if (!Array.isArray(a.placements)) err(where, 'missing "placements" array (may be empty)');

    const p = a.provenance;
    if (!p || typeof p !== 'object') { err(where, 'missing "provenance"'); return; }
    checkUnknown(p, PROV_KEYS, where + '.provenance');
    if (!p.model) err(where + '.provenance', 'missing "model"');
    else if (!models[p.model]) err(where + '.provenance', 'model "' + p.model + '" is not in the model store');
    else if ((models[p.model].actuals || []).indexOf(a.entity) < 0) {
        err(where, 'model "' + p.model + '" does not list this actual in its "actuals" array');
    }
    if (!p.resolvedParams) { err(where + '.provenance', 'missing "resolvedParams"'); return; }
    if (typeof p.seed !== 'number') err(where + '.provenance', 'missing numeric "seed"');
    if (!p.captured) warn(where + '.provenance', 'no capture date');

    // INTEGRITY 1 — the two stored arrays must agree. Audition plays `notes`,
    // insert places `objects`; if they can drift, the composer hears one thing
    // and puts another into the score (2y §9 failure 5).
    let objsFromNotes = null;
    try { objsFromNotes = M.toScoreObjects({ notes: a.notes, meta: a._meta || {} }, 0, {}); }
    catch (e) { err(where, 'toScoreObjects(notes) threw: ' + e.message); }
    if (objsFromNotes) {
        const strip = o => ({ layer: o.layer, startSeconds: o.startSeconds, endSeconds: o.endSeconds,
                              sonifyNote: o.sonifyNote, technique: o.technique,
                              morphBend: o.morphBend, nodes: o.nodes });
        const gotN = a.objects.filter(o => o.morphBend).map(strip);
        const wantN = objsFromNotes.map(strip);
        // objects carry a time offset and ids from placement-time; compare the
        // sound-bearing content only, rebased to the first onset
        const rebase = arr => {
            if (!arr.length) return arr;
            const t0 = Math.min.apply(null, arr.map(o => o.startSeconds));
            return arr.map(o => Object.assign({}, o, {
                startSeconds: +(o.startSeconds - t0).toFixed(3),
                endSeconds: +(o.endSeconds - t0).toFixed(3) }));
        };
        if (!deepEq(rebase(gotN), rebase(wantN))) {
            err(where, 'toScoreObjects(notes) does not reproduce "objects" — ' +
                'audition and insert would differ (' + gotN.length + ' vs ' + wantN.length + ' notes)');
        }
    }

    // INTEGRITY 2 — re-derivation. Every actual is reproducible the day it is
    // born. If the engine later drifts this REPORTS it; the stored objects
    // still stand, and nobody discovers the drift mid-composition.
    try {
        const re = M.render(p.resolvedParams, RENDER_OPTS);
        if (!deepEq(re.notes, a.notes)) {
            warn(where, 'RE-DERIVATION DRIFT — render(resolvedParams, seed ' + p.seed +
                 ') no longer reproduces the stored notes (' + re.notes.length + ' vs ' +
                 a.notes.length + '). The stored objects still stand; the engine has moved.');
        }
    } catch (e) { err(where, 're-derivation threw: ' + e.message); }
}

function validatePresets(pre) {
    if (!pre) { warn('shape_presets', 'bank/shape_presets.json is missing'); return; }
    if (pre._parseError) { err('shape_presets', 'unparseable: ' + pre._parseError); return; }
    const ps = pre.presets || {};
    Object.keys(ps).forEach(k => {
        const where = 'shape preset ' + k;
        const s = ps[k];
        if (!s.label) warn(where, 'no label');
        if (!s.shape) { err(where, 'missing "shape" block'); return; }
        const ns = M.normaliseShape(s.shape, s.assumeSpan || 40);
        ns.warnings.forEach(w => warn(where, w));
        if (!ns.shape) err(where, 'shape block normalises to nothing');
    });
}

// ---------------------------------------------------------------- commands
function cmdValidate() {
    const models = readJSON(MODELS_PATH);
    if (!models) { console.error('MISSING: bank/morph_models.json'); process.exit(1); }
    if (models._parseError) { console.error('UNPARSEABLE morph_models.json: ' + models._parseError); process.exit(1); }
    checkUnknown(models, ['_comment', 'rev', 'models', 'seededFrom'], 'morph_models.json');
    if (typeof models.rev !== 'number') err('morph_models.json', 'missing numeric "rev" (the panel polls it)');

    const acts = loadActuals();
    const actualIndex = {};
    acts.forEach(a => { if (a.data && a.data.entity) actualIndex[a.data.entity] = a.data; });

    const ms = models.models || {};
    Object.keys(ms).forEach(id => validateModel(id, ms[id], actualIndex));
    acts.forEach(a => validateActual(a.file, a.data, ms));
    validatePresets(readJSON(PRESETS_PATH));

    console.log('=== model_bank --validate ===\n');
    console.log('  models   : ' + Object.keys(ms).length);
    console.log('  recipes  : ' + Object.keys(ms).reduce((n, k) => n + ((ms[k].recipes || []).length), 0));
    console.log('  actuals  : ' + acts.length);
    console.log('  presets  : ' + Object.keys((readJSON(PRESETS_PATH) || {}).presets || {}).length);
    console.log('');
    // A repeated warning is the same fact twice; the same path is naturally
    // flagged once per waypoint that carries it.
    const uniqWarn = [...new Set(warnings)];
    if (uniqWarn.length) {
        console.log('  WARNINGS (' + uniqWarn.length + ')');
        uniqWarn.forEach(w => console.log('    ~ ' + w));
        console.log('');
    }
    if (problems.length) {
        console.log('  ERRORS (' + problems.length + ')');
        problems.forEach(p => console.log('    x ' + p));
        console.log('\n  INVALID');
        process.exit(1);
    }
    console.log('  VALID' + (warnings.length ? ' (with warnings)' : ''));
}

function cmdList() {
    const models = readJSON(MODELS_PATH) || { models: {} };
    const acts = loadActuals();
    const byModel = {};
    acts.forEach(a => {
        const m = a.data && a.data.provenance && a.data.provenance.model;
        (byModel[m] = byModel[m] || []).push(a.data);
    });
    console.log('=== MODELS (bank/morph_models.json, rev ' + models.rev + ') ===\n');
    console.log('  id          type  status  name                           recipes  actuals');
    Object.keys(models.models).forEach(id => {
        const m = models.models[id];
        console.log('  ' + id.padEnd(11) + String(m.modelType).padEnd(6) +
            String(m.status).padEnd(8) + String(m.name).slice(0, 30).padEnd(31) +
            String((m.recipes || []).length).padStart(4) + '     ' +
            String((m.actuals || []).length).padStart(4));
        (m.recipes || []).forEach(r => console.log('      · ' + String(r.recipe).padEnd(22) +
            '[' + r.dial.min + '…' + r.dial.max + ']  ' + (r.description || '')));
        (byModel[id] || []).forEach(a => console.log('      → ' + String(a.entity).padEnd(22) +
            (a.label || '') + '   (' + (a.placements || []).length + ' placement(s))'));
    });
    const orphans = acts.filter(a => !a.data || !a.data.provenance ||
        !models.models[a.data.provenance.model]);
    if (orphans.length) {
        console.log('\n  ORPHAN ACTUALS (no model): ' + orphans.map(o => o.file).join(', '));
    }
    const pre = readJSON(PRESETS_PATH);
    const ps = (pre && pre.presets) || {};
    console.log('\n=== SHAPE PRESETS (bank/shape_presets.json) ===\n');
    if (!Object.keys(ps).length) console.log('  (none yet — filed from the narrated sessions, 2y §5.1)');
    Object.keys(ps).forEach(k => console.log('  ' + k.padEnd(24) + (ps[k].label || '')));
}

function cmdShow(id) {
    const models = readJSON(MODELS_PATH) || { models: {} };
    const m = models.models[id];
    if (!m) { console.error('no such model: ' + id + '   (try --list)'); process.exit(1); }
    console.log(JSON.stringify(m, null, 2));
}

// ---------------------------------------------------------------- dispatch
if (has('validate')) cmdValidate();
else if (has('show')) cmdShow(valOf('show'));
else if (has('list') || !args.length) cmdList();
else {
    console.error('usage: node tools/model_bank.js [--list | --show <id> | --validate]');
    process.exit(1);
}
