#!/usr/bin/env node
// stand_check.js — 9h-1 VERIFY, make-or-break only: the stand page opens for
// every part, draws its overlay at the busiest minute, and plays — in a headless
// Edge at the iPad's screen size (1180×820 CSS px, landscape). Nothing the
// batteries already prove is re-proven here.
//
//   node tools/stand_check.js                 its own score server on port 5299, then closed
//   node tools/stand_check.js --port 5200     a server already running (the composer's)
//   node tools/stand_check.js --parts 1,4 --t 141.5 --size 1180,820
//
// Writes testkit/results/stand_check__<ts>.json and a screenshot of each
// checked part to testkit/results/stand_shots/ (gitignored). Exit 1 on any failure.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
const OWN_PORT = 5299;
const PORT = parseInt(arg('port', String(OWN_PORT)), 10);
const DBG = parseInt(arg('debug-port', '9336'), 10);
const PARTS = arg('parts', '1,2,3,4,5,6,7,8,9,10').split(',').map(Number).filter(n => n >= 1 && n <= 10);
const T = parseFloat(arg('t', '141.5'));
const SIZE = arg('size', '1180,820');
const IR = arg('ir', 'db1');
const PLAY_MS = parseInt(arg('play-ms', '1500'), 10);
// --q "s=6&z=1.2": extra page parameters (the size knobs) — the shot's name carries them
const QX = arg('q', '');
const OUT = path.join(ROOT, 'testkit', 'results');
const SHOT_DIR = path.join(OUT, 'stand_shots');
const BASE = 'http://localhost:' + PORT + '/notation/app/stand.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const CANDIDATES = [arg('browser', null),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const BROWSER = CANDIDATES.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
if (!BROWSER) { console.error('no Edge/Chrome found — pass --browser <path>'); process.exit(2); }

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

async function main() {
  let server = null;
  const up = async () => { try { return (await fetch(BASE)).ok; } catch (e) { return false; } };
  if (!(await up())) {
    if (PORT !== OWN_PORT) { console.error('no score server on port ' + PORT); process.exit(2); }
    // the check's own server on its own port — the composer's servers are theirs
    server = spawn(process.execPath, [path.join(ROOT, 'score', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(OWN_PORT) }), stdio: 'ignore' });
    for (let i = 0; i < 40 && !(await up()); i++) await sleep(250);
    if (!(await up())) { console.error('could not start a score server on port ' + OWN_PORT); try { server.kill(); } catch (e) { } process.exit(2); }
  }
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'stand-check-'));
  const proc = spawn(BROWSER, ['--headless=new', '--remote-debugging-port=' + DBG, '--user-data-dir=' + profile,
    '--window-size=' + SIZE, '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    'about:blank'], { stdio: 'ignore' });
  let cdp = null;
  const cleanup = () => {
    if (cdp) cdp.close();
    try { proc.kill(); } catch (e) { /* */ }
    if (server) { try { server.kill(); } catch (e) { /* */ } }
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* */ } }, 1500);
  };
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  const report = { tool: 'tools/stand_check.js', at: new Date().toISOString(), ir: IR, t: T, size: SIZE, port: PORT, ownServer: !!server, parts: [], head: null, ok: false };
  try {
    let ver = null;
    for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + DBG + '/json/version')).json(); } catch (e) { await sleep(250); } }
    if (!ver) throw new Error('the headless browser did not open its debugging port');
    report.browser = ver.Browser;
    try { report.gitHead = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).stdout.toString().trim(); } catch (e) { /* */ }
    const target = await (await fetch('http://127.0.0.1:' + DBG + '/json/new?about:blank', { method: 'PUT' })).json();
    cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.ready;
    const problems = [];
    cdp.on(m => {
      if (m.method === 'Runtime.exceptionThrown') problems.push('exception: ' + ((m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description) || m.params.exceptionDetails.text));
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('console.error: ' + m.params.args.map(a => a.value || a.description).join(' '));
    });
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    const [vw, vh] = SIZE.split(',').map(Number);
    // the iPad: its CSS size, 2× pixels, touch
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: vw, height: vh, deviceScaleFactor: 2, mobile: true });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    const evalJs = async (expr) => {
      const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception || {}).description || ''));
      return r.result.value;
    };
    for (const part of PARTS) {
      problems.length = 0;
      const url = BASE + '?part=' + part + '&ir=' + IR + '&t=' + T + (QX ? '&' + QX : '');
      const row = { part, url, ok: false };
      await cdp.send('Page.navigate', { url });
      let st = null;
      for (let i = 0; i < 80; i++) {
        await sleep(250);
        try { st = await evalJs('window.__standState ? window.__standState() : null'); } catch (e) { st = null; }
        if (st && (st.ready || st.error)) break;
      }
      if (!st) { row.error = 'the page never reported'; report.parts.push(row); continue; }
      row.error = st.error || ''; row.pages = st.pages; row.pageIdx = st.pageIdx; row.size = st.size;
      row.instances = st.instances; row.pieces = st.pieces; row.overlay = st.overlay;
      if (part === PARTS[0]) {
        // the three lines of the head (standalone on the iPad)
        report.head = await evalJs(`({
          viewport: !!document.querySelector('meta[name="viewport"][content*="viewport-fit=cover"]'),
          appleCapable: (document.querySelector('meta[name="apple-mobile-web-app-capable"]')||{}).content === 'yes',
          manifest: !!document.querySelector('link[rel="manifest"]'),
          icon: !!document.querySelector('link[rel="apple-touch-icon"]') })`);
        const mf = await (await fetch('http://localhost:' + PORT + '/notation/app/stand.manifest.json')).json().catch(() => null);
        report.head.manifestDisplay = mf && mf.display;
        const ic = await fetch('http://localhost:' + PORT + '/notation/app/stand-icon.png');
        report.head.iconServed = ic.ok && (ic.headers.get('content-type') || '').startsWith('image/png');
      }
      // it plays: the clock advances, frames are drawn, elements exist
      if (!row.error) {
        const t0 = (await evalJs('window.__standState().t'));
        await evalJs('window.__standPlay()');
        await sleep(PLAY_MS);
        const after = await evalJs('window.__standState()');
        await evalJs('window.__standPause()');
        row.played = { from: +t0.toFixed(2), to: +after.t.toFixed(2), advanced: after.t - t0 > PLAY_MS / 1000 * 0.8, playingWas: after.playing, elements: after.overlay && after.overlay.elements };
        // and it turns the page: start one second before this page's end, play
        // two seconds, land on the next page with no error
        const pageEnd = after.size && after.size.page && after.size.page[1];
        if (pageEnd && after.pageIdx < after.pages - 1) {
          await evalJs('window.__standGoto(' + (pageEnd - 1) + ')');
          const before = await evalJs('window.__standState().pageIdx');
          await evalJs('window.__standPlay()');
          await sleep(2000);
          const st2 = await evalJs('window.__standState()');
          await evalJs('window.__standPause()');
          row.turn = { fromPage: before + 1, toPage: st2.pageIdx + 1, ok: st2.pageIdx === before + 1 && !st2.error, turnMs: st2.turns.length ? st2.turns[st2.turns.length - 1].ms : null };
          await evalJs('window.__standGoto(' + T + ')');
          await sleep(300);
        }
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        row.shot = path.join('testkit', 'results', 'stand_shots', 'part' + part + (QX ? '__' + QX.replace(/[^a-z0-9.=]+/gi, '_') : '') + '.png');
        fs.writeFileSync(path.join(ROOT, row.shot), Buffer.from(shot.data, 'base64'));
      }
      row.problems = problems.slice();
      row.ok = !row.error && row.pages > 0 && row.pieces !== null && row.pieces >= 0 && row.played && row.played.advanced && (!row.turn || row.turn.ok) && row.problems.length === 0;
      report.parts.push(row);
      console.log(`part ${String(part).padStart(2)}  ${row.ok ? 'OK ' : 'BAD'}  pages ${row.pages}  at page ${row.pageIdx + 1}  instances ${row.instances}  pieces ${row.pieces}` +
        (row.size ? `  frame ${row.size.W}×${row.size.H}  staff space ${row.size.ss} px  ${row.size.pxPerS} px/s  ${row.size.s} s × ${row.size.rows} rows` : '') +
        (row.played ? `  played ${row.played.from}→${row.played.to} s  elements ${row.played.elements}` : '') +
        (row.turn ? `  turn ${row.turn.fromPage}→${row.turn.toPage} ${row.turn.ok ? 'ok' : 'BAD'} ${row.turn.turnMs != null ? row.turn.turnMs.toFixed(0) + ' ms' : ''}` : '') +
        (row.error ? '\n   ' + row.error.split('\n')[0] : '') + (row.problems.length ? '\n   ' + row.problems.join('\n   ') : ''));
    }
    const headOk = report.head && report.head.viewport && report.head.appleCapable && report.head.manifest && report.head.icon && report.head.manifestDisplay === 'standalone' && report.head.iconServed;
    report.ok = headOk && report.parts.length === PARTS.length && report.parts.every(r => r.ok);
    console.log('head:', JSON.stringify(report.head), headOk ? 'OK' : 'BAD');
    const file = path.join(OUT, 'stand_check__' + report.at.replace(/[:.]/g, '-') + '.json');
    fs.writeFileSync(file, JSON.stringify(report, null, 1));
    console.log((report.ok ? 'ALL OK' : 'FAILED') + ' — ' + path.relative(ROOT, file));
  } catch (e) {
    console.error(e.stack || e); report.fatal = String(e.message || e);
  } finally { cleanup(); }
  process.exit(report.ok ? 0 : 1);
}
main();
