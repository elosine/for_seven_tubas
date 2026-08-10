// Sandbox server: static files + phrase (motive) save/list.
//   node sandbox/serve.js   →  http://localhost:4700
// Phrases: POST /motives {name, events, ...} → sandbox/motives/<slug>.json
//          GET  /motives → index [{file, name, created, notes}]
//          GET  /motives/<file>.json → served statically like any file
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4700;
const ROOT = __dirname;
const MOTIVES = path.join(ROOT, 'motives');
if (!fs.existsSync(MOTIVES)) fs.mkdirSync(MOTIVES);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (req.method === 'POST' && urlPath === '/motives') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      try {
        const m = JSON.parse(body);
        if (!m.name || !Array.isArray(m.events)) return json(res, 400, { error: 'name and events required' });
        let slug = String(m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'phrase';
        let file = slug + '.json', n = 2;
        while (fs.existsSync(path.join(MOTIVES, file))) file = `${slug}-${n++}.json`;
        fs.writeFileSync(path.join(MOTIVES, file), JSON.stringify(m, null, 2));
        json(res, 200, { file });
      } catch (e) { json(res, 400, { error: 'bad json' }); }
    });
    return;
  }

  if (req.method === 'POST' && urlPath === '/captures') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const cap = JSON.parse(body);
        const file = path.join(ROOT, 'captures.json');
        const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
        list.push(cap);
        fs.writeFileSync(file, JSON.stringify(list, null, 2));
        json(res, 200, { count: list.length });
      } catch (e) { json(res, 400, { error: 'bad json' }); }
    });
    return;
  }

  if (req.method === 'GET' && urlPath === '/motives') {
    const list = fs.readdirSync(MOTIVES).filter(f => f.endsWith('.json')).map(f => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(MOTIVES, f), 'utf8'));
        return { file: f, name: m.name || f, created: m.created || '', notes: (m.events || []).length };
      } catch (e) { return { file: f, name: f, created: '', notes: 0 }; }
    }).sort((a, b) => (a.created < b.created ? 1 : -1));
    return json(res, 200, list);
  }

  let file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`sandbox at http://localhost:${PORT}`));
