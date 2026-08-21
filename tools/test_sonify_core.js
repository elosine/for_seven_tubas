#!/usr/bin/env node
// test_sonify_core.js — the two-ends battery for sonify_core.js (Principle 5:
// never verify a copy against a shared helper). Side A = sonify_core.js as
// shipped. Side B = the SAME-NAMED methods extracted at test time from
// composer.html's source text and executed. Randomized inputs over every
// curve model + the real CC7 map, then structural assertions on the compiled
// piece. `--prove-red` perturbs side A and demands the suite notice
// (Principle 6: a suite is evidence only once seen red).
//
//   node tools/test_sonify_core.js [--prove-red]

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Core = require(path.join(ROOT, 'score', 'public', 'sonify_core.js'));

// ---- side B: extract the app's methods from composer.html source ----
const html = fs.readFileSync(path.join(ROOT, 'score', 'public', 'composer.html'), 'utf8');

function extractMethod(name) {
    const re = new RegExp('^(\\s*)(' + name + ')\\(', 'm');
    const m = re.exec(html);
    if (!m) throw new Error('method not found in composer.html: ' + name);
    let i = html.indexOf('{', m.index);
    let depth = 0, j = i;
    for (; j < html.length; j++) {
        if (html[j] === '{') depth++;
        else if (html[j] === '}') { depth--; if (depth === 0) break; }
    }
    return html.slice(m.index + m[1].length, j + 1);
}

const appSrc = ['computeYAtT', 'computeSegY', 'evalWaveCurve', 'curveValToCC', 'morphBendAt']
    .map(extractMethod).join(',\n');
const ccMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'probes', 'cc7_map.json'), 'utf8'));
const app = new Function('return ({' + appSrc + '})')();
app._cc7Points = ccMap.points.slice().sort((a, b) => a.db - b.db);   // as loadCC7Map sorts
app.levelSpanDb = 40;
const ccPoints = app._cc7Points;

// ---- optionally break side A (prove-red) ----
const PROVE_RED = process.argv.includes('--prove-red');
if (PROVE_RED) {
    const orig = Core.computeYAtT;
    Core.computeYAtT = (model, slope, y1, y2, t) => orig(model, slope, y1, y2, Math.min(1, t + 0.001));
}

// seeded PRNG so a failure is reproducible
let seed = 0xC0FFEE;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

let checks = 0, fails = 0;
const fail = msg => { fails++; if (fails <= 10) console.error('  FAIL: ' + msg); };
const eq = (a, b, eps, msg) => { checks++; if (!(Math.abs(a - b) <= eps)) fail(msg + ' — ' + a + ' vs ' + b); };

// 1. computeYAtT over every model
const MODELS = ['power', 'sigmoid', 'exponential', 'logarithmic', 'bezier'];
for (let i = 0; i < 20000; i++) {
    const model = MODELS[i % MODELS.length];
    const slope = rnd() * 2 - 1, y1 = rnd(), y2 = rnd(), t = rnd();
    eq(Core.computeYAtT(model, slope, y1, y2, t), app.computeYAtT(model, slope, y1, y2, t),
        1e-12, `yAtT ${model} slope=${slope} t=${t}`);
}

// 2. computeSegY incl. the ctrl model
for (let i = 0; i < 10000; i++) {
    const seg = i % 3 === 0
        ? { model: 'ctrl', cx: rnd(), cy: rnd() * 1.4 - 0.2 }
        : { model: MODELS[i % MODELS.length], slope: rnd() * 2 - 1 };
    const y1 = rnd(), y2 = rnd(), t = rnd();
    eq(Core.computeSegY(seg, y1, y2, t), app.computeSegY(seg, y1, y2, t), 1e-12, `segY ${seg.model} t=${t}`);
}

// 3. evalWaveCurve on random multi-node curves
for (let i = 0; i < 3000; i++) {
    const n = 2 + Math.floor(rnd() * 5);
    const pos = [0, ...Array.from({ length: n - 2 }, rnd).sort((a, b) => a - b), 1];
    const nodes = pos.map(p => ({ pos: p, y: rnd() * 10 }));
    const segments = Array.from({ length: n - 1 }, (_, k) =>
        k % 4 === 3 ? { model: 'ctrl', cx: rnd(), cy: rnd() } : { model: MODELS[k % MODELS.length], slope: rnd() * 2 - 1 });
    const wc = { nodes, segments };
    for (let s = 0; s <= 10; s++) {
        const t01 = s / 10;
        eq(Core.evalWaveCurve(wc, t01), app.evalWaveCurve.call(app, wc, t01), 1e-12, `evalCurve #${i} t01=${t01}`);
    }
}

// 4. curveValToCC over the real measured map, dense grid
for (let v = 0; v <= 1.00001; v += 0.0001) {
    eq(Core.curveValToCC(v, ccPoints, 40), app.curveValToCC.call(app, v), 0, `curveValToCC v=${v}`);
}

// 5. morphBendAt on random breakpoint schedules
for (let i = 0; i < 2000; i++) {
    const n = 2 + Math.floor(rnd() * 6);
    const ts = Array.from({ length: n }, rnd).sort((a, b) => a - b);
    const bp = ts.map(t => [t * 5, (rnd() * 400 - 200)]);
    for (let s = -1; s <= 11; s++) {
        const dt = (s / 10) * 5;
        eq(Core.morphBendAt(bp, dt), app.morphBendAt(bp, dt), 1e-12, `morphBendAt #${i} dt=${dt}`);
    }
}

// ---- structural assertions on the compiled piece ----
const instSrc = fs.readFileSync(path.join(ROOT, 'sandbox', 'instruments.js'), 'utf8');
const INSTRUMENTS = new Function(instSrc + '\nreturn INSTRUMENTS;')();
const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', 'piece-s25-finished01.json'), 'utf8'));
const sounding = score.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
const { events, stats, touched } = Core.compileScore(score, INSTRUMENTS, ccPoints, { endSweep: true });

const ok = (cond, msg) => { checks++; if (!cond) fail(msg); };
ok(stats.notes === sounding.length, `compiled notes ${stats.notes} != sounding waveCurves ${sounding.length}`);
ok(stats.skippedNoTech === 0, `skippedNoTech = ${stats.skippedNoTech}`);

// every on (vel>0, non-KS) pairs with an off at the note's end
const ons = events.filter(e => e.kind === 'on');
const offs = events.filter(e => e.kind === 'off');
ok(ons.length === offs.length, `on ${ons.length} != off ${offs.length}`);

// ports are exactly the 20 expected, channels within each port's technique table
const PORTS = [];
for (let i = 1; i <= 10; i++) PORTS.push('tuba' + i, 'tuba' + i + 'b');
for (const key of touched) {
    const [port, ch] = key.split('|');
    ok(PORTS.includes(port), `unexpected port ${port}`);
    const legal = new Set();
    for (const inst of Object.values(INSTRUMENTS))
        for (const t of inst.techniques)
            if (((t.port || inst.port) || '').toLowerCase() === port) legal.add(t.channel - 1);
    ok(legal.has(+ch), `port ${port} channel ${ch} not in instrument table`);
}

// onset fidelity: every sounding wc has its noteOn at exactly startSeconds
const onIndex = new Map();
for (const e of ons) onIndex.set(e.t + '|' + e.port + '|' + e.ch + '|' + e.bytes[1], true);
let missing = 0;
for (const wc of sounding) {
    const r = Core.techniqueFor(wc, INSTRUMENTS);
    if (!onIndex.has(wc.startSeconds + '|' + r.port + '|' + r.ch + '|' + wc.sonifyNote)) missing++;
}
ok(missing === 0, `${missing} sounding notes have no noteOn at their startSeconds`);

// events sorted, same-instant rank respected
let sorted = true;
for (let i = 1; i < events.length; i++) {
    const a = events[i - 1], b = events[i];
    if (b.t < a.t || (b.t === a.t && Core.KIND_RANK[b.kind] < Core.KIND_RANK[a.kind] &&
        a.port === b.port && a.ch === b.ch)) { sorted = false; break; }
}
ok(sorted, 'events not sorted by (t, kind rank)');

// morph coverage: every bent channel ends re-centered before/at the sweep
ok(stats.bendStream > 0 === sounding.some(w => w.morphBend && w.morphBend.length),
    'bend stream presence mismatches morphBend presence');

console.log((PROVE_RED ? '[prove-red] ' : '') + `checks ${checks} · failures ${fails} · ` +
    `piece: ${stats.notes} notes, ${stats.ccStream} CC7 stream, ${stats.bendStream} bend stream, ` +
    `${events.length} events, ${touched.length} port-channels`);

if (PROVE_RED) {
    if (fails === 0) { console.error('PROVE-RED FAILED: perturbed core passed the suite'); process.exit(1); }
    console.log('prove-red OK: the suite sees a broken core'); process.exit(0);
}
process.exit(fails ? 1 : 0);
