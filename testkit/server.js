#!/usr/bin/env node
// server.js — the test kit's tiny server (docs/ENGINE_BRIEF.md §5b).
// Dependency-free Node, like every other server in this repo.
//
//   node testkit/server.js            -> http://localhost:4760  (and every LAN address)
//   PORT=4800 node testkit/server.js
//
// What it does, and nothing else:
//   static files   testkit/ (the page, js/, assets/) — with HTTP Range, which
//                  Safari REQUIRES before it will play a video at all
//   GET  /api/time       the clock the stands sync to. FREE-RUNNING MONOTONIC
//                        (process.hrtime), never the wall clock: an NTP slew on the
//                        server would look to every stand exactly like a drifting lie
//                        (RUNNING_LOG 67, finding 3). Returns the stamp the stand
//                        uses AND the honest one, `t`, which only the kit's scoring
//                        reads — the clock under test never sees it.
//   POST /api/sabotage   {cid, mode} — make this server LIE to one stand:
//                        bias (+250 ms) · jitter (±120 ms) · drift (1000 ppm) ·
//                        subtle (80 ppm) · none. The floor rule's proof (T3).
//   POST /api/results    save a device's results to testkit/results/
//   GET  /api/info       LAN addresses, uptime — for the page's "open on another device"

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const KIT = __dirname;
const PORT = parseInt(process.env.PORT || '4760', 10);
const RESULTS = path.join(KIT, 'results');

const HR0 = process.hrtime.bigint();
const EPOCH0 = Date.now();
const serverNow = () => EPOCH0 + Number(process.hrtime.bigint() - HR0) / 1e6;

const LIES = {
  bias: () => 250,
  jitter: () => (Math.random() * 2 - 1) * 120,
  drift: since => since * 1000e-6,
  subtle: since => since * 80e-6,
};
const sabotage = new Map();   // cid -> {mode, since}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.ttf': 'font/ttf', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push('http://' + a.address + ':' + PORT + '/');
  }
  return out;
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(KIT, '.' + rel);
  if (!file.startsWith(KIT + path.sep) && file !== KIT) return send(res, 403, { error: 'forbidden' });
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) return send(res, 404, { error: 'not found: ' + rel + (rel.startsWith('/assets/') ? ' — run: node testkit/build_assets.js' : '') });
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const size = st.size;
    const range = req.headers.range;
    const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] !== '' ? parseInt(m[1], 10) : 0;
      let end = m && m[2] !== '' ? parseInt(m[2], 10) : size - 1;
      if (m && m[1] === '' && m[2] !== '') { start = Math.max(0, size - parseInt(m[2], 10)); end = size - 1; }
      if (start >= size || end < start) {
        res.writeHead(416, { 'Content-Range': 'bytes */' + size });
        return res.end();
      }
      end = Math.min(end, size - 1);
      res.writeHead(206, Object.assign(base, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Content-Length': end - start + 1 }));
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, Object.assign(base, { 'Content-Length': size }));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p === '/api/time') {
      const cid = u.searchParams.get('cid') || '';
      const sb = sabotage.get(cid);
      // stamp as late as possible — everything above is before the clock is read
      const t = serverNow();
      let s = t;
      if (sb && sb.mode !== 'none' && LIES[sb.mode]) s = t + LIES[sb.mode](t - sb.since);
      return send(res, 200, '{"s":' + s.toFixed(3) + ',"t":' + t.toFixed(3) + ',"n":' + JSON.stringify(u.searchParams.get('n') || '') + ',"lie":' + JSON.stringify(sb ? sb.mode : 'none') + '}');
    }
    if (p === '/api/sabotage') {
      if (req.method === 'POST') {
        const b = JSON.parse(await readBody(req, 4096) || '{}');
        if (!b.cid) return send(res, 400, { error: 'cid required' });
        const mode = LIES[b.mode] ? b.mode : 'none';
        if (mode === 'none') sabotage.delete(b.cid);
        else sabotage.set(b.cid, { mode, since: serverNow() });
        console.log('sabotage ' + b.cid + ' -> ' + mode);
        return send(res, 200, { cid: b.cid, mode });
      }
      return send(res, 200, Object.fromEntries(sabotage));
    }
    if (p === '/api/results' && req.method === 'POST') {
      const raw = await readBody(req, 50 * 1048576);
      const j = JSON.parse(raw);
      const label = String((j.device && j.device.label) || 'device').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'device';
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.mkdirSync(RESULTS, { recursive: true });
      const name = label + '__' + stamp + '.json';
      fs.writeFileSync(path.join(RESULTS, name), JSON.stringify(j, null, 1));
      console.log('results saved: testkit/results/' + name + ' (' + (raw.length / 1024).toFixed(0) + ' KB)');
      return send(res, 200, { saved: 'testkit/results/' + name });
    }
    if (p === '/api/info') {
      return send(res, 200, { port: PORT, lan: lanUrls(), uptimeS: Math.round((serverNow() - EPOCH0) / 1000), clock: 'monotonic (process.hrtime), epoch-anchored at start' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method' });
    serveStatic(req, res, p);
  } catch (e) {
    send(res, 500, { error: String(e && e.message || e) });
  }
});
server.keepAliveTimeout = 65000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('test kit: http://localhost:' + PORT + '/');
  for (const l of lanUrls()) console.log('     LAN: ' + l + '   <- open this on the other devices');
  if (!fs.existsSync(path.join(KIT, 'assets', 'manifest.json'))) console.log('  !! no assets yet — run: node testkit/build_assets.js');
});
