#!/usr/bin/env node
// a2_bench.js — 9a VERIFY on the REAL page: notation.html played through the
// busiest minute of the piece in a headless Edge, today's renderer (a0: the
// per-frame innerHTML rebuild) against A2 (notation/lib/animlive.js), each
// timed by the test kit's own instruments (testkit/js/stats.js — the same
// "frames on time" the stands report), optionally with the CPU slowed down
// to stand in for a cheap tablet.
//
//   node score/server.js                          (or any port: --port 5210)
//   node tools/a2_bench.js                        a0 + a2, CPU ×1 and ×6, 60 s, + shots
//   node tools/a2_bench.js --renderers a2 --throttle 1,4,6 --seconds 30
//   node tools/a2_bench.js --shots 150,170.5,190 --no-run      the fidelity half only
//   node tools/a2_bench.js --renderers a2 --throttle 6 --seconds 20 --shots '' --trace
//                                                 + where the main thread's time went
//
// THE FIDELITY HALF (--shots): the same instants drawn by both renderers,
// screenshotted and diffed pixel by pixel — a renderer that drew the wrong
// picture would make its timing meaningless.
//
// Headless numbers are a PC check, not a stand's numbers: CPU throttling
// slows the main thread only (the compositor and GPU keep their speed), which
// is exactly the part A2 changes. The stands are the composer's check.
// A throwaway browser profile in the OS temp folder, deleted at the end.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const flag = n => process.argv.includes('--' + n);
const PORT = parseInt(arg('port', '5200'), 10);
const DBG = parseInt(arg('debug-port', '9334'), 10);
const RENDERERS = arg('renderers', 'a0,a2').split(',').map(s => s.trim()).filter(Boolean);
const THROTTLES = arg('throttle', '1,6').split(',').map(Number).filter(x => x >= 1);
const SECONDS = parseFloat(arg('seconds', '60'));
const WARM = parseFloat(arg('warm', '1.5'));
const SIZE = arg('size', '1920,1080');
const LABEL = arg('label', 'dev PC headless');
const IR = arg('ir', 'db1');
const NO_RUN = flag('no-run');
// --inject-css '<css>': an experiment lever — a style added to the page before each run (e.g. hide the time readout to measure what it costs)
const INJECT_CSS = arg('inject-css', null);
// --kit-lane A2L [--kit-port 4760]: the same timing (and --trace) on one of the
// TEST KIT's T2 lanes instead of the notation page — the like-for-like
// comparison of the page against the kit's own renderer lanes
const KIT_LANE = arg('kit-lane', null);
const KIT_PORT = parseInt(arg('kit-port', '4760'), 10);
// --trace: where the main thread's time goes during the run (a DevTools
// timeline trace, summarised) — the evidence for any fix beyond the overlay
const TRACE = flag('trace');
const TRACE_CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'loading'];
function summariseTrace(events) {
  const meta = new Map();
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') meta.set(e.pid + ':' + e.tid, e.args && e.args.name);
  const main = events.filter(e => e.ph === 'X' && e.dur != null && meta.get(e.pid + ':' + e.tid) === 'CrRendererMain');
  const tasks = main.filter(e => e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask').sort((a, b) => a.ts - b.ts);
  const byName = {};
  for (const e of main) {
    if (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') continue;
    const d = e.args && e.args.data;
    let k = e.name;
    if (e.name === 'FunctionCall' && d) k += ' ' + (d.functionName || '?') + ' @' + String(d.url || '').split('/').pop() + ':' + d.lineNumber;
    if (e.name === 'TimerFire' || e.name === 'EventDispatch') k += d && d.type ? ' ' + d.type : '';
    (byName[k] = byName[k] || { ms: 0, n: 0 }).ms += e.dur / 1000;
    byName[k].n++;
  }
  const top = Object.entries(byName).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25).map(([k, v]) => ({ name: k, ms: Math.round(v.ms), n: v.n }));
  // the long tasks, each with what took the time inside it
  const long = tasks.filter(t => t.dur > 30000).map(t => {
    const inside = main.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur && e.dur > 3000 && e.name !== 'RunTask' && e.name !== 'ThreadControllerImpl::RunTask')
      .sort((a, b) => b.dur - a.dur).slice(0, 4)
      .map(e => { const d = e.args && e.args.data; return e.name + (d && d.functionName ? ' ' + d.functionName : '') + (d && d.url ? ' @' + String(d.url).split('/').pop() : '') + ' ' + (e.dur / 1000).toFixed(1) + ' ms'; });
    return { atMs: Math.round((t.ts - (tasks[0] ? tasks[0].ts : t.ts)) / 1000), ms: +(t.dur / 1000).toFixed(1), inside };
  });
  return { mainThreadEvents: main.length, tasks: tasks.length, longTasks: long.length, top, long: long.slice(0, 40) };
}
// --profile: the JavaScript's own time, function by function (V8 sampling
// profiler) — which code inside the frame costs what
const PROFILE = flag('profile');
function summariseProfile(p) {
  const self = new Map(), byId = new Map(p.nodes.map(n => [n.id, n]));
  const dt = p.timeDeltas || [];
  for (let i = 0; i < p.samples.length; i++) {
    const n = byId.get(p.samples[i]);
    const cf = n.callFrame;
    const k = (cf.functionName || '(anonymous)') + ' @' + String(cf.url || '').split('/').pop().split('?')[0] + ':' + (cf.lineNumber + 1);
    self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000);
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  return { totalMs: Math.round(total), top: [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, ms]) => ({ fn: k, ms: Math.round(ms) })) };
}
async function traced(cdp, fn) {
  const events = [];
  let done;
  const finished = new Promise(r => { done = r; });
  cdp.on(m => {
    if (m.method === 'Tracing.dataCollected') for (const e of m.params.value) events.push(e);
    if (m.method === 'Tracing.tracingComplete') done();
  });
  await cdp.send('Tracing.start', { categories: TRACE_CATS.join(','), transferMode: 'ReportEvents' });
  const out = await fn();
  await cdp.send('Tracing.end');
  await finished;
  return { out, trace: summariseTrace(events) };
}

let T0 = arg('t0', null);
if (T0 === null) {
  // the kit's busiest minute (testkit/build_assets.js scan), so the page and
  // the kit's lanes are measured on the same music
  try { T0 = JSON.parse(fs.readFileSync(path.join(ROOT, 'testkit', 'assets', 'manifest.json'), 'utf8')).window[0]; } catch (e) { T0 = 141.5; }
}
T0 = +T0;
const SHOTS = (arg('shots', NO_RUN ? '150,170.5,190' : (T0 + 8.5) + ',' + (T0 + 29) + ',' + (T0 + 48.5))).split(',').filter(x => x.trim() !== '').map(Number).filter(isFinite);
const OUT = path.join(ROOT, 'testkit', 'results');
const SHOT_DIR = path.join(OUT, 'a2shots');
const BASE = 'http://localhost:' + PORT + '/notation/app/notation.html';

const CANDIDATES = [arg('browser', null),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const BROWSER = CANDIDATES.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
if (!BROWSER) { console.error('no Edge/Chrome found — pass --browser <path>'); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
// the cursor's colour, from the registry (the shots find the cursor by it)
function readCursorColor() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8')).animated.cursor.color; } catch (e) { return '#FF15A0'; }
}
const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h); const n = m ? parseInt(m[1], 16) : 0xFF15A0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.n = 0; this.pending = new Map(); this.handlers = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = () => rej(new Error('websocket error')); });
    this.ws.onmessage = ev => {
      const m = JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString());
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id);
        if (m.error) p.rej(new Error(m.error.message)); else p.res(m.result);
      } else if (m.method) for (const h of this.handlers) h(m);
    };
  }
  send(method, params) {
    const id = ++this.n;
    this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }
  on(h) { this.handlers.push(h); }
  close() { try { this.ws.close(); } catch (e) { /* */ } }
}

// the recorder, run inside the page: the kit's FrameRecorder + LongTasks, and
// THE COST OF A FRAME as the kit defines it (lanes.js mainThreadFrameMs): from
// the start of the frame's first animation callback to a message that runs
// after the browser has rendered that frame. The page has two callbacks per
// frame (its own loop and this recorder), so requestAnimationFrame is wrapped
// for the run to catch whichever starts first. Then the share of frames whose
// cost FITS a 60 Hz frame (16.7 ms) — the stands' budget, whatever the refresh
// of the machine measuring (this PC's headless Edge runs at 100 Hz, found day
// 45, so its "on time" is judged against 10 ms).
const MEASURE = secs => `(async () => {
  const S = TK.stats;
  const rec = new S.FrameRecorder(), lt = new S.LongTasks();
  const frameMs = []; let first = null, posted = false;
  const mc = new MessageChannel();
  mc.port1.onmessage = () => { if (first !== null) frameMs.push(performance.now() - first); first = null; posted = false; };
  const raf0 = window.requestAnimationFrame;
  window.requestAnimationFrame = cb => raf0.call(window, ts => {
    if (first === null) first = performance.now();
    if (!posted) { posted = true; mc.port2.postMessage(0); }
    cb(ts);
  });
  lt.start();
  const out = await new Promise(res => {
    let t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      rec.tick(ts);
      if (ts - t0 >= ${secs * 1000}) {
        const s = rec.summary(); s.longTasks = lt.stop();
        const f = S.sorted(frameMs);
        const fit = ms => S.r1(100 * f.filter(x => x <= ms).length / Math.max(1, f.length));
        s.mainThreadFrameMs = { p50: S.r2(S.pct(f, 50)), p95: S.r2(S.pct(f, 95)), p99: S.r2(S.pct(f, 99)), max: S.r1(S.pct(f, 100)),
          fits60HzPct: fit(1000 / 60), fits100HzPct: fit(10), n: f.length };
        return res(s);
      }
      window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  });
  window.requestAnimationFrame = raf0;
  mc.port1.close();
  return out;
})()`;

async function main() {
  try { const r = await fetch(BASE); if (!r.ok) throw new Error(); }
  catch (e) { console.error('the score server is not running on port ' + PORT + ' — start it: node score/server.js (or pass --port)'); process.exit(2); }
  const statsSrc = fs.readFileSync(path.join(ROOT, 'testkit', 'js', 'stats.js'), 'utf8');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'a2-bench-'));
  const proc = spawn(BROWSER, ['--headless=new', '--remote-debugging-port=' + DBG, '--user-data-dir=' + profile,
    '--window-size=' + SIZE, '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    'about:blank'], { stdio: 'ignore' });
  let cdp = null;
  const problems = [];
  const cleanup = () => {
    if (cdp) cdp.close();
    try { proc.kill(); } catch (e) { /* */ }
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* */ } }, 1500);
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  const report = { tool: 'tools/a2_bench.js', label: LABEL, injectCss: INJECT_CSS, at: new Date().toISOString(), ir: IR, window: [T0, T0 + SECONDS],
    size: SIZE, runs: [], shots: null };
  try {
    let ver = null;
    for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + DBG + '/json/version')).json(); } catch (e) { await sleep(250); } }
    if (!ver) throw new Error('the headless browser did not open its debugging port');
    report.browser = ver.Browser;
    try { report.gitHead = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).stdout.toString().trim(); } catch (e) { /* */ }
    const target = await (await fetch('http://127.0.0.1:' + DBG + '/json/new?about:blank', { method: 'PUT' })).json();
    cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.ready;
    cdp.on(m => {
      if (m.method === 'Runtime.exceptionThrown') problems.push('exception: ' + ((m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description) || m.params.exceptionDetails.text));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('console.error: ' + m.params.args.map(a => a.value || a.description).join(' '));
    });
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    // the frame at its true size: the fit scale is 1, as on a 1080p screen at F11
    const [vw, vh] = SIZE.split(',').map(Number);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 1, mobile: false });
    const evaluate = async (expr, ms) => {
      const p = cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      const r = await Promise.race([p, sleep(ms || 60000).then(() => ({ timeout: true }))]);
      if (r.timeout) throw new Error('timed out: ' + expr.slice(0, 80));
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };
    // the page's saved UI (its own localStorage, in this throwaway profile):
    // the presentation score, the piece, no MIDI
    await cdp.send('Page.navigate', { url: BASE });
    await sleep(1500);
    await evaluate("localStorage.setItem('notation-ui', JSON.stringify({ view: 'video', ir: " + JSON.stringify(IR) +
      ", eng: false, midi: false, bricks: true, metaov: false, tshow: true, wSeeded: true })); true");
    async function open(renderer) {
      await cdp.send('Page.navigate', { url: BASE + '?renderer=' + renderer });
      for (let i = 0; i < 120; i++) {
        const ok = await evaluate("typeof window.__notationState === 'function' && window.__notationState().pages > 0 && !!document.querySelector('#sheet svg')").catch(() => false);
        if (ok) break;
        await sleep(250);
      }
      const st = await evaluate('window.__notationState()');
      if (st.renderer !== renderer) throw new Error('asked for renderer ' + renderer + ', the page runs ' + st.renderer);
      await evaluate(statsSrc + '; true');
      if (INJECT_CSS) await evaluate('(() => { const st = document.createElement("style"); st.textContent = ' + JSON.stringify(INJECT_CSS) + '; document.head.appendChild(st); return true; })()');
      const flowing = await evaluate('TK.stats.framesFlowing(3000)', 10000);
      if (!flowing) throw new Error('no animation frames even headless');
    }
    console.log('a2_bench: ' + path.basename(BROWSER) + ' ' + ver.Browser + ' · ' + SIZE + ' · ' + IR + ' ' + T0 + '–' + (T0 + SECONDS) + ' s');

    // ---------------- the kit lane, like for like ----------------
    if (KIT_LANE) {
      for (const rate of THROTTLES) {
        await cdp.send('Page.navigate', { url: 'http://localhost:' + KIT_PORT + '/' });
        for (let i = 0; i < 80; i++) { if (await evaluate("typeof TK !== 'undefined' && !!TK.kit").catch(() => false)) break; await sleep(250); }
        await cdp.send('Emulation.setCPUThrottlingRate', { rate });
        const go = () => evaluate('TK.lanes.runT2({ seconds: ' + SECONDS + ', loads: ["off"], lanes: [' + JSON.stringify(KIT_LANE) + '] })', (SECONDS + 90) * 1000);
        let r, trace = null;
        if (TRACE) { const x = await traced(cdp, go); r = x.out; trace = x.trace; } else r = await go();
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        const f = r.lanes[KIT_LANE].runs.off.frames || {};
        report.runs.push({ kitLane: KIT_LANE, cpuSlowdown: rate, frames: f, trace });
        console.log('  kit lane ' + KIT_LANE + ' · CPU ×' + rate + ' : on time ' + f.onTimePct + ' % · missed ' + f.missedFrames + ' (' + f.missedPct + ' %) · frame cost p50 ' + (f.mainThreadFrameMs || {}).p50 + ' / p95 ' + (f.mainThreadFrameMs || {}).p95 + ' ms');
        if (trace) console.log('    trace (main thread, inclusive ms): ' + trace.top.slice(0, 14).map(x => x.name + ' ' + x.ms).join(' · '));
      }
    }

    // ---------------- the timing half ----------------
    if (!NO_RUN && !KIT_LANE) for (const rate of THROTTLES) for (const renderer of RENDERERS) {
      await open(renderer);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await evaluate('window.__notationGoto(' + (T0 - WARM) + '); window.__notationPlay(); true');
      await sleep(WARM * 1000);
      const turnsBefore = (await evaluate('window.__notationState()')).turns.length;
      let fr, trace = null;
      let profile = null;
      if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 }); await cdp.send('Profiler.start'); }
      if (TRACE) { const r = await traced(cdp, () => evaluate(MEASURE(SECONDS), (SECONDS + 60) * 1000)); fr = r.out; trace = r.trace; }
      else fr = await evaluate(MEASURE(SECONDS), (SECONDS + 60) * 1000);
      if (PROFILE) { profile = summariseProfile((await cdp.send('Profiler.stop')).profile); await cdp.send('Profiler.disable'); }
      const st = await evaluate('window.__notationState()');
      await evaluate('window.__notationPause(); true');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const turns = st.turns.slice(turnsBefore).map(x => ({ t: +x.t.toFixed(2), ms: +x.ms.toFixed(1) }));
      const run = { renderer, cpuSlowdown: rate, frames: fr, turns, playedTo: +st.t.toFixed(2), overlay: st.overlay };
      if (profile) {
        run.profile = profile;
        console.log('    JS self time (' + profile.totalMs + ' ms sampled): ' + profile.top.slice(0, 16).map(x => x.fn + ' ' + x.ms).join(' · '));
      }
      if (trace) {
        run.trace = trace;
        console.log('    trace (main thread, inclusive ms): ' + trace.top.slice(0, 14).map(x => x.name + ' ' + x.ms).join(' · '));
        for (const L of trace.long.slice(0, 12)) console.log('    long task @' + L.atMs + ' ms: ' + L.ms + ' ms — ' + L.inside.join(' | '));
      }
      report.runs.push(run);
      console.log('  ' + renderer.toUpperCase() + ' · CPU ×' + rate + ' : on time ' + fr.onTimePct + ' % · missed ' + fr.missedFrames + ' (' + fr.missedPct + ' %) · stalls ' + fr.stalls +
        ' · frame cost p50 ' + fr.mainThreadFrameMs.p50 + ' / p95 ' + fr.mainThreadFrameMs.p95 + ' / p99 ' + fr.mainThreadFrameMs.p99 + ' ms · fits a 60 Hz frame ' + fr.mainThreadFrameMs.fits60HzPct + ' %' + ' · refresh ' + fr.refreshHz + ' Hz' +
        ' · long tasks ' + (fr.longTasks.supported ? fr.longTasks.count + ' (max ' + fr.longTasks.maxMs + ' ms)' : 'n/a') +
        ' · turns ' + turns.map(x => x.ms).join('/') + ' ms');
    }

    // ---------------- the fidelity half ----------------
    if (SHOTS.length && RENDERERS.length) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const files = {};
      for (const renderer of RENDERERS) {
        await open(renderer);
        files[renderer] = [];
        for (const t of SHOTS) {
          await evaluate("window.__notationPause(); window.__notationGoto(" + t + "); document.getElementById('bar').classList.remove('shown'); true");
          await evaluate('new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 400)).then(() => true)');
          const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
          const f = path.join(SHOT_DIR, renderer + '_t' + t + '.png');
          fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
          files[renderer].push(f);
        }
      }
      report.shots = { at: SHOTS, dir: path.relative(ROOT, SHOT_DIR).replace(/\\/g, '/') };
      if (files.a0 && files.a2) {
        // pixel diff (Python + PIL, already on this machine for the kit's film
        // reader). Two answers: how many pixels differ and where (the
        // anti-aliasing at the movers' edges is expected), and THE CURSOR'S
        // PLACE — the centre of its colour, row by row, in both pictures
        const cc = JSON.stringify(hexRgb(readCursorColor()));
        const py = 'import sys, json\nfrom PIL import Image\nimport numpy as np\nout = []\nCC = np.array(' + cc + ')\n' +
          'for a, b in zip(sys.argv[1::2], sys.argv[2::2]):\n' +
          '  A = np.asarray(Image.open(a).convert("RGB")).astype(float); B = np.asarray(Image.open(b).convert("RGB")).astype(float)\n' +
          '  d = np.abs(A - B).max(axis=2)\n' +
          '  ys, xs = np.nonzero(d > 48)\n' +
          '  off = None\n' +
          '  if len(xs):\n' +
          '    x0 = int(np.median(xs)); lo = max(0, x0 - 8); hi = x0 + 9\n' +
          '    def cen(I):\n' +
          '      sub = I[:, lo:hi]; w = np.clip(1 - np.abs(sub - CC).sum(axis=2) / 250, 0, None) ** 2\n' +
          '      s = w.sum(axis=1); return (w * np.arange(lo, lo + sub.shape[1])).sum(axis=1) / np.maximum(s, 1e-9), s\n' +
          '    ca, sa = cen(A); cb, sb = cen(B)\n' +
          '    rows = [y for y in range(A.shape[0]) if sa[y] > 1.0 and sb[y] > 1.0]\n' +
          '    if rows:\n' +
          '      dd = np.array([cb[y] - ca[y] for y in rows]); off = {"rows": len(rows), "medianPx": round(float(np.median(dd)), 3), "p95AbsPx": round(float(np.percentile(np.abs(dd), 95)), 3)}\n' +
          '  out.append({"differ8": int((d > 8).sum()), "differ48": int((d > 48).sum()), "max": int(d.max()), ' +
          '"bbox48": [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None, "cursorOffset": off})\n' +
          'print(json.dumps(out))\n';
        const pyFile = path.join(os.tmpdir(), 'a2_bench_diff.py');
        fs.writeFileSync(pyFile, py);
        const pairs = [];
        files.a0.forEach((f, i) => pairs.push(f, files.a2[i]));
        const r = spawnSync('python', [pyFile, ...pairs], { encoding: 'utf8' });
        if (r.status === 0) {
          report.shots.diff = JSON.parse(r.stdout).map((d, i) => Object.assign({ t: SHOTS[i] }, d));
          for (const d of report.shots.diff) console.log('  shot t=' + d.t + ' a0 vs a2: ' + d.differ8 + ' px differ by >8 · ' + d.differ48 + ' by >48' +
            (d.bbox48 ? ' (all within x ' + d.bbox48[0] + '–' + d.bbox48[2] + ')' : '') +
            (d.cursorOffset ? ' · cursor a2 − a0: median ' + d.cursorOffset.medianPx + ' px, 95 % within ' + d.cursorOffset.p95AbsPx + ' px' : ''));
        } else { problems.push('pixel diff failed: ' + (r.stderr || '').slice(0, 300)); }
      }
    }
    report.problems = problems.slice(0, 40);
    const file = path.join(OUT, 'a2bench__' + LABEL.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '__' + report.at.replace(/[:.]/g, '-') + '.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    console.log('  page problems: ' + (problems.length ? '\n    ' + problems.slice(0, 20).join('\n    ') : 'none'));
    console.log('RESULTS_FILE=' + path.relative(ROOT, file).replace(/\\/g, '/'));
  } finally { cleanup(); }
}
main().catch(e => { console.error('a2_bench failed: ' + e.message); process.exit(1); });
