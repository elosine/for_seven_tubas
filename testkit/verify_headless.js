#!/usr/bin/env node
// verify_headless.js — the kit's own verification harness (ENGINE_BRIEF §5b:
// "run every test ... and confirm sane numbers before claiming done").
//
// Runs the kit page in a HEADLESS Edge (or Chrome) through the DevTools
// protocol, so every test gets real animation frames and real video playback
// even with no window on screen — the Claude preview pane delivers NO frames
// while it is hidden (found day 42: document.visibilityState 'hidden', 0 rAF).
//
//   node testkit/server.js                       (in another terminal)
//   node testkit/verify_headless.js              quick run of T5,T1,T2,T4,T3
//   node testkit/verify_headless.js --tests T5,T2 --full
//   node testkit/verify_headless.js --label "dev PC (headless Edge)" --size 1280,720
//
// It uses a THROWAWAY browser profile in the OS temp folder and deletes it at
// the end — it never opens, reads or changes a real browser profile.
// Headless numbers are a functional check and a PC baseline, not a stand's
// numbers: the stands are the devices the composer holds.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const flag = n => process.argv.includes('--' + n);
const PORT = parseInt(arg('port', '4760'), 10);
const DBG = parseInt(arg('debug-port', '9333'), 10);
const TESTS = arg('tests', 'T5,T1,T2,T4,T3').split(',').map(s => s.trim()).filter(Boolean);
const FULL = flag('full');
const LABEL = arg('label', 'headless-' + (FULL ? 'full' : 'quick'));
const SIZE = arg('size', '1920,1080');
const URL0 = 'http://localhost:' + PORT + '/';

const CANDIDATES = [
  arg('browser', null),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const BROWSER = CANDIDATES.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
if (!BROWSER) { console.error('no Edge/Chrome found — pass --browser <path>'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.n = 0; this.pending = new Map(); this.handlers = [];
    this.ready = new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = e => rej(new Error('websocket error')); });
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

async function main() {
  try { const r = await fetch(URL0 + 'api/info'); if (!r.ok) throw new Error(); }
  catch (e) { console.error('the kit server is not running on ' + URL0 + ' — start it: node testkit/server.js'); process.exit(2); }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-headless-'));
  const proc = spawn(BROWSER, ['--headless=new', '--remote-debugging-port=' + DBG, '--user-data-dir=' + profile,
    '--window-size=' + SIZE, '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    'about:blank'], { stdio: 'ignore' });
  let cdp = null;
  const problems = [];
  const cleanup = () => {
    if (cdp) cdp.close();
    try { proc.kill(); } catch (e) { /* */ }
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* the browser may hold it a moment */ } }, 1500);
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  try {
    let ver = null;
    for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + DBG + '/json/version')).json(); } catch (e) { await sleep(250); } }
    if (!ver) throw new Error('the headless browser did not open its debugging port');
    const target = await (await fetch('http://127.0.0.1:' + DBG + '/json/new?' + encodeURIComponent(URL0), { method: 'PUT' })).json();
    cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.ready;
    cdp.on(m => {
      if (m.method === 'Runtime.exceptionThrown') problems.push('exception: ' + (m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || m.params.exceptionDetails.text));
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) problems.push('console.' + m.params.type + ': ' + m.params.args.map(a => a.value || a.description).join(' '));
    });
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    const evaluate = async (expr, ms) => {
      const p = cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      const r = await Promise.race([p, sleep(ms || 60000).then(() => ({ timeout: true }))]);
      if (r.timeout) throw new Error('timed out: ' + expr.slice(0, 80));
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    };
    for (let i = 0; i < 80; i++) {
      const ok = await evaluate("document.readyState === 'complete' && typeof TK !== 'undefined' && !!TK.kit").catch(() => false);
      if (ok) break;
      await sleep(250);
    }
    console.log('verify_headless: ' + path.basename(BROWSER) + ' ' + ver.Browser + ' · ' + SIZE + ' · ' + (FULL ? 'FULL' : 'quick') + ' · tests ' + TESTS.join(','));
    console.log('  page: ' + JSON.stringify(await evaluate("({visible: document.visibilityState, frames: 0, secure: isSecureContext, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio})")));
    await evaluate("document.querySelector('#label').value = " + JSON.stringify(LABEL) + "; document.querySelector('#" + (FULL ? 'full' : 'quick') + "').checked = true; document.querySelector('#t4net').checked = true; TK.kit.R.tests = {}; true");
    const flowing = await evaluate('TK.stats.framesFlowing(3000)', 10000);
    console.log('  animation frames flowing: ' + flowing);
    if (!flowing) throw new Error('no animation frames even headless');
    // --shots: every renderer lane drawn at the SAME instant of the piece, one
    // screenshot each — a lane that draws the wrong picture would make its timing
    // meaningless, so this is the fidelity half of the verification
    if (flag('shots')) {
      const T = parseFloat(arg('shot-at', '15'));
      const outDir = arg('shots-dir', path.join(__dirname, 'results', 'shots'));
      fs.mkdirSync(outDir, { recursive: true });
      for (const id of ['A0', 'A1', 'A2', 'B', 'C']) {
        await evaluate(`(async () => {
          const L = TK.lanes, A = await L.loadAssets(), th = L.theater.open();
          th.stage.innerHTML = '';
          const lane = L.LANES['${id}'];
          window.__ctx = await lane.setup(th.stage);
          const t = A.t0 + ${T}, k = Math.round(${T} * A.fps);
          if ('${id}' === 'C') { const v = window.__ctx.v; v.currentTime = ${T}; await L.waitEvent(v, 'seeked', 8000).catch(() => {}); await new Promise(r => setTimeout(r, 400)); }
          else lane.frame(window.__ctx, t, k, 0);
          th.hud('${id} @ piece ' + t.toFixed(2) + ' s');
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          return true;
        })()`, 60000);
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const file = path.join(outDir, 'lane_' + id + '.png');
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        console.log('  shot ' + id + ' -> ' + path.relative(process.cwd(), file));
        await evaluate(`(async () => { const L = TK.lanes; const lane = L.LANES['${id}']; if (lane.teardown) await lane.teardown(window.__ctx); L.theater.close(); return true; })()`, 20000);
      }
    }
    const budget = { T5: 60e3, T1: 200e3, T2: 1500e3, T4: 1800e3, T3: 1800e3 };
    for (const t of TESTS) {
      const t0 = Date.now();
      process.stdout.write('  ' + t + ' … ');
      try {
        await evaluate('TK.kit.run.' + t + '().then(() => true)', budget[t] || 600e3);
        const err = await evaluate('TK.kit.R.tests.' + t + ' && TK.kit.R.tests.' + t + '.error || null');
        console.log((err ? 'ERROR: ' + err : 'done') + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
      } catch (e) { console.log('FAILED: ' + e.message); problems.push(t + ': ' + e.message); }
    }
    // nothing ran (a --shots-only pass): nothing to file
    const saved = TESTS.length ? await evaluate("fetch('api/results', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(TK.kit.R)}).then(r => r.json())") : {};
    if (TESTS.length) console.log('  results: ' + (saved.saved || JSON.stringify(saved)));
    console.log('  page problems: ' + (problems.length ? '\n    ' + problems.slice(0, 30).join('\n    ') : 'none'));
    console.log(saved.saved ? 'RESULTS_FILE=' + saved.saved : '');
  } finally { cleanup(); }
}
main().catch(e => { console.error('verify_headless failed: ' + e.message); process.exit(1); });
