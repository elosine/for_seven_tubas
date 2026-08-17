#!/usr/bin/env node
// texture_bank.js — PLAN 2x §12. The MODEL and ACTUAL stores for attack fields.
//
//   node tools/texture_bank.js --list
//   node tools/texture_bank.js --validate
//   node tools/texture_bank.js --bank RAIN-SURFACE --from B --survives yes --note "..."
//   node tools/texture_bank.js --actualize RAIN-SURFACE --dur 20
//
// TWO STORES, following 2y's MODEL <-> ACTUAL taxonomy (the composer's Bergsonian
// virtual/actual):
//   MODEL   bank/texture_models.json — a point, plus the directions worth
//           travelling from it and how far. Regenerable. Editable as data.
//   ACTUAL  bank/texture_actuals/ACT-<MODEL>-<NN>.json — one decided render,
//           with provenance back to the model, spec and seed that made it.
//
// ---------------------------------------------------------------------------
// WHY bank/texture_actuals/ AND NOT 2y's bank/actuals/
//
// The plan (§12, §15.9) expected to share `bank/actuals/` with 2y under distinct
// `ACT-<MODEL>-` prefixes. That is not safe as built, and the reason is worth
// recording rather than working around silently:
//
// 2y's `tools/model_bank.js --validate` walks EVERY file in bank/actuals/ and
// requires each one to (a) name a model present in bank/morph_models.json and
// (b) satisfy `Morph.toScoreObjects(notes) === objects`. Both are morph-shaped
// by design — that integrity check is the whole point of their store. A texture
// actual satisfies neither, so filing one there would turn a shipped, currently
// VALID tool red, for a file it was never meant to describe.
//
// So the stores are PARALLEL, exactly as §15.9 already requires for the model
// stores themselves. The ACTUAL schema below deliberately mirrors 2y's key-for-
// key where the keys mean the same thing, so the two can be merged later by
// whoever decides they should be. Nothing here ever writes a 2y file, and
// `--validate` runs 2y's validator afterwards to prove their store is untouched.
// ---------------------------------------------------------------------------
//
// THE ROBUSTNESS VERDICT IS MANDATORY (§9). A keeper cannot be banked without
// one. The standing performance rule is that no texture may depend on precise
// timing, and every keeper must survive a human-scale error pass — so a model
// banked without that verdict is a model nobody has checked, filed as though
// somebody had. Refusing is the whole point; there is no --force.

const fs = require('fs');
const path = require('path');
const TX = require('../score/public/texture_engine.js');
const TON = require('../score/public/tonality.js');

const ROOT = path.join(__dirname, '..');
const MODELS_PATH = path.join(ROOT, 'bank/texture_models.json');
const ACTUALS_DIR = path.join(ROOT, 'bank/texture_actuals');
const PARAMS_PATH = path.join(ROOT, 'bank/texture_params.json');
const SAMPLE_LEN = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank/sample_lengths.json'), 'utf8'));
const OPTS = { sampleLengths: SAMPLE_LEN, tonality: TON, maxLanes: 10 };

const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJSON = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

// ------------------------------------------------------------------ schema
// Mirrors 2y's ACTUAL_KEYS where the keys mean the same thing, so the two
// stores stay mergeable. `notes` is absent on purpose: a morph actual stores
// the render output separately because audition plays envelopes that the score
// objects do not carry. A texture note IS an ordinary score note (D29 — no bend,
// no envelope), so `objects` is the whole truth and a second array could only
// ever drift from it.
const ACTUAL_KEYS = ['entity', 'kind', 'label', 'tags', 'spanSec', 'parts', 'register',
                     'objects', 'provenance', 'placements'];
const PROV_KEYS = ['model', 'spec', 'seed', 'engineConstants', 'captured',
                   'metrics', 'playability', 'robustness'];

let errs = [], warns = [];
const err = (w, m) => errs.push(w + ': ' + m);
const warn = (w, m) => warns.push(w + ': ' + m);

function checkUnknown(obj, allowed, where) {
    Object.keys(obj || {}).forEach(k => {
        if (allowed.indexOf(k) < 0 && k[0] !== '_') warn(where, 'unrecognised key "' + k + '"');
    });
}

function listActuals() {
    if (!fs.existsSync(ACTUALS_DIR)) return [];
    return fs.readdirSync(ACTUALS_DIR).filter(f => /^ACT-.*\.json$/i.test(f)).sort()
        .map(f => {
            let data;
            try { data = readJSON(path.join(ACTUALS_DIR, f)); }
            catch (e) { data = { _parseError: e.message }; }
            return { file: f, data: data };
        });
}

// ------------------------------------------------------------------ validate
function validateModel(id, m, actualIndex) {
    const where = 'model ' + id;
    if (!m.spec) { err(where, 'missing "spec" — a model without its point cannot be regenerated'); return; }
    if (!m.label) warn(where, 'no label');
    if (!m.heard) warn(where, 'no "heard" description — the composer reads these');
    // THE ROBUSTNESS VERDICT. `survives: null` is a legitimate, honest state
    // meaning "not yet heard" — what must never happen is a model presented as
    // checked when nobody checked it.
    if (!m.robustness || !('survives' in m.robustness)) {
        err(where, 'missing "robustness" verdict block (§9 — required before banking)');
    } else if (m.robustness.survives === null && !m.robustness.note) {
        warn(where, 'robustness UNTESTED and no note saying so');
    }
    (m.actuals || []).forEach(aid => {
        if (!actualIndex[aid]) err(where, 'lists actual "' + aid + '" which does not exist');
        else if (actualIndex[aid].provenance.model !== id) {
            err(where, 'lists actual "' + aid + '" but its provenance points at "' +
                actualIndex[aid].provenance.model + '"');
        }
    });
    // the point must actually render
    try {
        const g = TX.render(m.spec, OPTS);
        if (!g.notes) err(where, 'its spec renders zero notes');
        if (g.unresolvedSets.length) err(where, 'its spec names an unknown pitch set: ' +
            g.unresolvedSets.join(', '));
    } catch (e) { err(where, 'its spec fails to render: ' + e.message); }
}

function validateActual(file, a, models) {
    const where = 'actual ' + file;
    if (a._parseError) { err(where, 'unparseable JSON: ' + a._parseError); return; }
    checkUnknown(a, ACTUAL_KEYS, where);
    const expect = file.replace(/\.json$/i, '');
    if (a.entity !== expect) err(where, '"entity" is "' + a.entity + '" but the file is "' + expect + '"');
    if (a.kind !== 'texture-actual') err(where, '"kind" must be "texture-actual"');
    if (!a.label) err(where, 'missing "label" — labelling is mandatory at save');
    if (!Array.isArray(a.objects) || !a.objects.length) { err(where, 'missing "objects"'); return; }
    if (!Array.isArray(a.placements)) err(where, 'missing "placements" array (may be empty)');

    const p = a.provenance;
    if (!p) { err(where, 'missing "provenance"'); return; }
    checkUnknown(p, PROV_KEYS, where + '.provenance');
    if (!p.model) err(where + '.provenance', 'missing "model"');
    else if (!models[p.model]) err(where + '.provenance', 'model "' + p.model + '" is not in the model store');
    else if ((models[p.model].actuals || []).indexOf(a.entity) < 0) {
        err(where, 'model "' + p.model + '" does not list this actual in its "actuals" array');
    }
    if (!p.spec) { err(where + '.provenance', 'missing "spec"'); return; }
    if (typeof p.seed !== 'number') err(where + '.provenance', 'missing numeric "seed"');
    if (!p.captured) warn(where + '.provenance', 'no capture date');

    // INTEGRITY — the provenance must RE-DERIVE the stored render exactly. This
    // is 2y's idea and it is the reason provenance is worth storing at all: a
    // model whose recorded parameters no longer reproduce its own actual is
    // recording a fiction. Compares sound-bearing content, rebased, because ids
    // and absolute times are assigned at placement.
    let re = null;
    try { re = TX.render(p.spec, OPTS); }
    catch (e) { err(where, 'provenance spec fails to render: ' + e.message); }
    if (re) {
        const strip = arr => {
            const notes = arr.filter(o => o.type === 'waveCurve');
            if (!notes.length) return [];
            const t0 = Math.min.apply(null, notes.map(o => o.startSeconds));
            return notes.map(o => ({
                layer: o.layer, sonifyNote: o.sonifyNote, technique: o.technique,
                start: +(o.startSeconds - t0).toFixed(4),
                dur: +(o.endSeconds - o.startSeconds).toFixed(4),
                recVel: o.recVel,
            }));
        };
        if (JSON.stringify(strip(a.objects)) !== JSON.stringify(strip(re.objects))) {
            err(where, 'PROVENANCE DOES NOT RE-DERIVE ITS OWN RENDER — the stored spec+seed ' +
                'no longer produce the stored objects');
        }
    }
    // D29 — nothing bend-bearing may ever appear in a texture actual
    if (a.objects.some(o => o.bend !== undefined || o.morphBend !== undefined)) {
        err(where, 'carries a bend field — D29 forbids bend in this build');
    }
}

function validate() {
    errs = []; warns = [];
    const store = readJSON(MODELS_PATH);
    const models = store.models || {};
    const acts = listActuals();
    const index = {};
    acts.forEach(a => { if (!a.data._parseError) index[a.data.entity] = a.data; });

    Object.keys(models).forEach(id => validateModel(id, models[id], index));
    acts.forEach(a => validateActual(a.file, a.data, models));

    console.log('=== texture_bank --validate ===\n');
    console.log('  models  : ' + Object.keys(models).length);
    console.log('  actuals : ' + acts.length);
    const banked = Object.keys(models).filter(id => models[id].robustness &&
        models[id].robustness.survives !== null && models[id].robustness.survives !== undefined);
    console.log('  with a robustness verdict : ' + banked.length + ' of ' +
        Object.keys(models).length +
        (banked.length < Object.keys(models).length ? '   (the rest are UNHEARD, and say so)' : ''));
    if (warns.length) { console.log('\n  WARNINGS'); warns.forEach(w => console.log('    - ' + w)); }
    if (errs.length) { console.log('\n  ERRORS'); errs.forEach(e => console.log('    x ' + e)); }
    console.log('\n  ' + (errs.length ? 'INVALID' : 'VALID'));
    return errs.length ? 1 : 0;
}

// ------------------------------------------------------------------ list
function list() {
    const store = readJSON(MODELS_PATH);
    const acts = listActuals();
    console.log('=== TEXTURE MODELS (bank/texture_models.json) ===\n');
    Object.keys(store.models).forEach(id => {
        const m = store.models[id];
        const g = TX.render(m.spec, OPTS);
        const met = g.report[0] ? g.report[0].metrics : {};
        const rb = m.robustness || {};
        const verdict = rb.survives === true ? 'survives' : rb.survives === false ? 'DOES NOT survive'
                      : 'UNHEARD';
        console.log('  ' + id.padEnd(14) + (m.label || '').padEnd(20) +
            (met.n || 0) + ' attacks · sd ' + (met.sd || 0).toFixed(1) + ' ms · unev ' +
            (met.unevenness || 0).toFixed(2) +
            ' · ceiling ' + (g.ceiling ? g.ceiling.rate : '—') + '/s');
        console.log('    robustness: ' + verdict + (rb.note ? ' — ' + rb.note.slice(0, 88) : ''));
        if ((m.actuals || []).length) console.log('    actuals: ' + m.actuals.join(', '));
    });
    console.log('\n=== ACTUALS (bank/texture_actuals/) ===\n');
    if (!acts.length) console.log('  none banked yet.');
    acts.forEach(a => {
        const d = a.data;
        console.log('  ' + (d.entity || a.file).padEnd(22) + (d.label || '').slice(0, 44));
        console.log('    from ' + (d.provenance && d.provenance.model) + ' seed ' +
            (d.provenance && d.provenance.seed) + ' · ' + (d.spanSec || 0).toFixed(1) + ' s · ' +
            (d.parts || 0) + ' parts · placed ' + ((d.placements || []).length) + '×');
    });
}

// ------------------------------------------------------------------ bank
// Bank a MODEL: the spec becomes a regenerable point with a mandatory verdict.
function bank(name, opts) {
    const store = readJSON(MODELS_PATH);
    let spec = null;
    if (opts.from) {
        const params = readJSON(PARAMS_PATH);
        const v = (params.variants || {})[opts.from];
        if (!v) { console.error('no variant "' + opts.from + '" in bank/texture_params.json'); process.exit(1); }
        spec = JSON.parse(JSON.stringify(v.spec));
        if (!opts.label) opts.label = v.label;
    } else if (opts.fromModel) {
        const m = store.models[opts.fromModel];
        if (!m) { console.error('no model ' + opts.fromModel); process.exit(1); }
        spec = JSON.parse(JSON.stringify(m.spec));
    } else {
        console.error('need --from <variant> or --fromModel <MODEL>'); process.exit(1);
    }

    // THE GATE. No --force, deliberately.
    if (opts.survives === undefined) {
        console.error('\n  REFUSED: banking "' + name + '" needs a robustness verdict.\n');
        console.error('  The standing performance rule (docs/PHASE_SHIFTING.md §6) is that no');
        console.error('  texture may depend on precise timing, so a keeper has to be heard');
        console.error('  against the human-error pass before it is filed. Press H in the panel,');
        console.error('  A/B it against the clean render, then bank with the verdict:\n');
        console.error('    node tools/texture_bank.js --bank ' + name + ' --from <variant> \\');
        console.error('         --survives yes|no --note "what you heard"\n');
        console.error('  There is no --force. A model filed without a verdict is a model');
        console.error('  nobody checked, recorded as though somebody had.\n');
        process.exit(1);
    }

    spec.name = name.toLowerCase();
    const g = TX.render(spec, OPTS);
    const met = g.report[0] ? g.report[0].metrics : {};
    store.models[name] = Object.assign({}, store.models[name], {
        label: opts.label || name,
        heard: opts.note || (store.models[name] && store.models[name].heard) || '',
        source: 'banked from the Texture panel ' + (opts.captured || todayFromArgs()),
        spec: spec,
        expect: { density: +(met.n / spec.sections[0].dur).toFixed(1), sd: met.sd,
                  unevenness: met.unevenness },
        robustness: { survives: opts.survives, note: opts.note || '',
                      heardOn: opts.captured || todayFromArgs() },
        actuals: (store.models[name] && store.models[name].actuals) || [],
    });
    writeJSON(MODELS_PATH, store);
    console.log('banked MODEL ' + name + ' — ' + g.notes + ' attacks, sd ' + met.sd +
        ' ms, unevenness ' + met.unevenness + ', ' + g.summary.hard + ' hard / ' +
        g.summary.soft + ' soft');
    console.log('  robustness: ' + (opts.survives ? 'survives' : 'DOES NOT survive') +
        (opts.note ? ' — ' + opts.note : ''));
    if (g.rings.length) console.log('  NOTE: sample-ring overlap — ' + g.rings[0].players +
        ' players re-attack every ' + g.rings[0].tightest + ' s against a ' + g.rings[0].ring + ' s ring');
}

// Actualize: one decided render of a model, stored with provenance.
function actualize(modelName, opts) {
    const store = readJSON(MODELS_PATH);
    const m = store.models[modelName];
    if (!m) { console.error('no model ' + modelName); process.exit(1); }
    if (!m.robustness || m.robustness.survives === null || m.robustness.survives === undefined) {
        console.error('\n  REFUSED: "' + modelName + '" has no robustness verdict, so it is not a');
        console.error('  keeper yet. Bank it with --survives first (§9).\n');
        process.exit(1);
    }
    if (!fs.existsSync(ACTUALS_DIR)) fs.mkdirSync(ACTUALS_DIR, { recursive: true });

    const spec = JSON.parse(JSON.stringify(m.spec));
    if (opts.dur) spec.sections.forEach(s => { s.dur = opts.dur; });
    if (opts.seed != null) spec.seed = opts.seed;
    const g = TX.render(spec, OPTS);

    let n = 1;
    while (fs.existsSync(path.join(ACTUALS_DIR, 'ACT-' + modelName + '-' +
        String(n).padStart(2, '0') + '.json'))) n++;
    const entity = 'ACT-' + modelName + '-' + String(n).padStart(2, '0');
    const notes = g.objects.filter(o => o.type === 'waveCurve');
    const pitches = notes.map(o => o.sonifyNote);
    const met = g.report[0] ? g.report[0].metrics : {};

    const actual = {
        entity: entity,
        kind: 'texture-actual',
        label: opts.label || (m.label || modelName) + ' · ' +
               (spec.sections[0].dur) + ' s · seed ' + (spec.seed != null ? spec.seed : 0),
        tags: ['texture', 'attack-field', modelName.toLowerCase()],
        spanSec: TX.spanOf(g),
        parts: new Set(notes.map(o => o.layer)).size,
        register: [Math.min.apply(null, pitches), Math.max.apply(null, pitches)],
        objects: g.objects,
        provenance: {
            model: modelName,
            spec: spec,
            seed: spec.seed != null ? spec.seed : 0,
            engineConstants: { d17: TX.D17, sampleLengths: 'bank/sample_lengths.json' },
            captured: opts.captured || todayFromArgs(),
            metrics: met,
            playability: { hard: g.summary.hard, soft: g.summary.soft,
                           ringOverlap: g.rings, ceiling: g.ceiling },
            robustness: m.robustness,
        },
        placements: [],
    };
    writeJSON(path.join(ACTUALS_DIR, entity + '.json'), actual);
    m.actuals = m.actuals || [];
    if (m.actuals.indexOf(entity) < 0) m.actuals.push(entity);
    writeJSON(MODELS_PATH, store);
    console.log('wrote bank/texture_actuals/' + entity + '.json — ' + notes.length +
        ' attacks over ' + actual.parts + ' parts, ' + actual.spanSec.toFixed(1) + ' s, ' +
        g.summary.hard + ' hard / ' + g.summary.soft + ' soft');
    return entity;
}

// `new Date()` is banned in the engine but this is the impure CLI half; still,
// the date is passed in where a caller wants determinism (the tests do).
function todayFromArgs() {
    const i = process.argv.indexOf('--captured');
    if (i >= 0) return process.argv[i + 1];
    return new Date().toISOString().slice(0, 10);
}

// ------------------------------------------------------------------ CLI
module.exports = { validate, bank, actualize, listActuals, ACTUALS_DIR, MODELS_PATH, OPTS };
if (require.main !== module) return;

const argv = process.argv.slice(2);
const flag = k => { const i = argv.indexOf('--' + k); return i < 0 ? null : argv[i + 1]; };
const has = k => argv.indexOf('--' + k) >= 0;

if (has('validate')) process.exit(validate());
else if (has('list')) list();
else if (flag('bank')) {
    bank(flag('bank'), {
        from: flag('from'), fromModel: flag('fromModel'), label: flag('label'),
        note: flag('note'), captured: flag('captured'),
        survives: has('survives') ? (flag('survives') !== 'no') : undefined,
    });
} else if (flag('actualize')) {
    actualize(flag('actualize'), {
        dur: flag('dur') ? Number(flag('dur')) : null,
        seed: flag('seed') != null ? Number(flag('seed')) : null,
        label: flag('label'), captured: flag('captured'),
    });
} else {
    console.log('usage:\n' +
        '  node tools/texture_bank.js --list\n' +
        '  node tools/texture_bank.js --validate\n' +
        '  node tools/texture_bank.js --bank <NAME> --from <variant> --survives yes|no --note "..."\n' +
        '  node tools/texture_bank.js --actualize <MODEL> [--dur 20] [--seed 7]');
}
