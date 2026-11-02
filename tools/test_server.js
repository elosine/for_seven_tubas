#!/usr/bin/env node
// test_server.js — THE PROTOCOL BATTERY for the stand server (PLAN 9g VERIFY):
// every message of DESIGN §3, every authority refusal (AR-10, 13), the door
// (/s/<token>, reissue, revoked), rate limiting (AR-5), the REHEARSAL → ALONE
// fallback, the spare from a snapshot (AR-58, 59). Headless: the server as a
// child process on a scratch data folder, Socket.IO clients from Node.
//
//   node tools/test_server.js            -> GREEN or the first failure, exit code
//
// Make-or-break only: one assertion per rule, the real server, no mocks.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { io } = require('socket.io-client');

const ROOT = path.join(__dirname, '..');
const PORT = 5398, PORT2 = 5397;
const IDLE_MS = 1500;
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'stand-server-test-'));

let pass = 0, fail = 0;
const checks = [];
function assert(cond, name, detail) {
  lastStep = name;
  if (cond) { pass++; checks.push('  ok   ' + name); }
  else { fail++; checks.push('  FAIL ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); console.log(checks[checks.length - 1]); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function startServer(args, dataDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js'), '--data', dataDir, '--quiet', ...args], { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.stderr.on('data', d => process.stderr.write('[server] ' + d));
    child.stdout.on('data', () => {});
    child.on('message', m => { if (m && m.ready) resolve(child); });
    child.on('exit', code => reject(new Error('server exited ' + code)));
    setTimeout(() => reject(new Error('server did not start')), 8000);
  });
}
// bounded: if the kill's exit event does not come within 5 s, taskkill the tree
const stop = child => new Promise(r => {
  if (!child || child.exitCode != null || child.signalCode != null) return r();   // a signal kill leaves exitCode null
  const t = setTimeout(() => { try { spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { /* gone */ } setTimeout(r, 500); }, 5000);
  child.once('exit', () => { clearTimeout(t); r(); });
  child.kill();
});

async function http(port, p, opts) {
  const r = await fetch('http://127.0.0.1:' + port + p, opts);
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch (e) { /* not json */ }
  return { status: r.status, json, text, headers: r.headers };
}
const admin = (port, key, op, body) => http(port, '/admin/' + op, { method: body ? 'POST' : 'GET', headers: { 'x-admin-key': key, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

function connect(port) {
  const s = io('http://127.0.0.1:' + port, { transports: ['websocket'], reconnection: false, forceNew: true });
  s.inbox = {};   // event -> [payloads]
  for (const ev of ['welcome', 'state', 'mode', 'rooms', 'roster', 'display', 'refused']) s.on(ev, p => { (s.inbox[ev] = s.inbox[ev] || []).push(p); });
  return new Promise((res, rej) => { s.once('connect', () => res(s)); s.once('connect_error', rej); });
}
const call = (s, ev, msg) => new Promise(res => s.emit(ev, msg, res));
const last = (s, ev) => (s.inbox[ev] || [])[(s.inbox[ev] || []).length - 1];
async function waitFor(s, ev, pred, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 1500)) { const p = last(s, ev); if (p && (!pred || pred(p))) return p; await sleep(20); }
  return null;
}

// the watchdog: a hang (an ack that never comes) prints what passed and where it stopped
let lastStep = 'start';
const step = name => { lastStep = name; };
setTimeout(() => {
  console.log(checks.join('\n'));
  console.log('!! WATCHDOG: hung after "' + lastStep + '" — ' + pass + ' ok, ' + fail + ' failed so far');
  process.exit(3);
}, 90000).unref();

(async () => {
  const data1 = path.join(scratch, 'd1');
  let server = await startServer(['--port', String(PORT), '--idle-ms', String(IDLE_MS)], data1);
  let server2 = null;
  try {
    const key = fs.readFileSync(path.join(data1, 'admin.key'), 'utf8').trim();

    // ---- http basics ---------------------------------------------------------------
    let r = await http(PORT, '/health');
    assert(r.status === 200 && r.json.ok === true && r.json.clock === 'monotonic', '/health ok', r.json);
    r = await http(PORT, '/api/time?n=42');
    assert(r.status === 200 && typeof r.json.s === 'number' && typeof r.json.t === 'number' && r.json.n === '42', '/api/time the kit shape (s, t, n)', r.json);
    r = await http(PORT, '/api/info');
    assert(r.status === 200 && Array.isArray(r.json.lan) && r.json.spare === false, '/api/info', r.json);
    r = await http(PORT, '/notation/lib/transport.js');
    assert(r.status === 200 && /timebase|nowAt/.test(r.text), 'static: /notation/lib/transport.js served');
    r = await http(PORT, '/testkit/js/syncclock.js');
    assert(r.status === 200 && /ping/.test(r.text), 'static: the clock module served');
    r = await http(PORT, '/notation/../package.json');
    assert(r.status === 404 || r.status === 403, 'static: no path traversal', r.status);
    r = await http(PORT, '/socket.io/socket.io.js');
    assert(r.status === 200 && r.text.length > 10000, 'the Socket.IO client is served');
    r = await http(PORT, '/api/composer/load/piece-final-draft-001');
    assert(r.status === 200 && r.json && r.json.success === true && r.json.data, "the stand's score file served read-only");

    // ---- admin (AR-1): behind the key -----------------------------------------------
    r = await admin(PORT, 'wrong-key', 'pieces');
    assert(r.status === 401, 'admin: wrong key refused', r.status);
    r = await admin(PORT, key, 'piece.register', { id: 'tubas', title: 'for seven tubas', ir: 'db1', version: 'db1' });
    assert(r.status === 200 && r.json.ok && r.json.piece.parts.length === 10 && r.json.piece.parts[0].name === 'Tuba 1', 'admin: piece.register reads the parts from the IR', r.json);
    r = await admin(PORT, key, 'piece.register', { id: 'nope', ir: 'does-not-exist' });
    assert(r.status === 400, 'admin: a piece without an IR is refused', r.json);
    r = await admin(PORT, key, 'ensemble.create', { name: 'Test Tubas', piece: 'tubas' });
    assert(r.status === 200 && r.json.ok && r.json.ensemble.rows.length === 10 && /\/s\/[A-Za-z0-9_-]{24}$/.test(r.json.ensemble.gatekeeperLink), 'admin: ensemble.create — ten rows, a gatekeeper link', r.json);
    const ens = r.json.ensemble;
    const gk = ens.gatekeeperLink.split('/s/')[1];
    const row0 = ens.rows[0], row1 = ens.rows[1], row2 = ens.rows[2];
    r = await admin(PORT, key, 'parts.set', { ensembleId: ens.id, rows: [{ id: row0.id, name: 'Pat', leader: true }] });
    assert(r.status === 200 && r.json.ensemble.rows[0].leader === true && r.json.ensemble.rows[0].name === 'Pat' && r.json.ensemble.rows[1].leader === false, 'admin: parts.set — the leader tick, a name', r.json);
    r = await admin(PORT, key, 'row.add', { ensembleId: ens.id, partIndex: 0 });
    assert(r.status === 200 && r.json.ensemble.rows.length === 11 && r.json.ensemble.rows[10].part === 'Tuba 1', 'admin: row.add — doubling, a new token on the same part', r.json);
    r = await admin(PORT, key, 'ensembles');
    assert(r.status === 200 && r.json.ensembles.length === 1 && r.json.ensembles[0].live === 0, 'admin: ensembles lists it', r.json);

    // ---- the door over http -------------------------------------------------------------
    r = await http(PORT, '/s/' + row0.token);
    assert(r.status === 200 && /<title>/.test(r.text) && /stand/i.test(r.text), '/s/<token> serves the stand page');
    r = await http(PORT, '/s/stand.manifest.json');
    assert(r.status === 200 && r.json && r.json.display === 'standalone', '/s/stand.manifest.json — the sibling files resolve');
    r = await http(PORT, '/s/notatokenatall');
    assert(r.status === 404, '/s/<unknown> → 404', r.status);
    r = await http(PORT, '/api/snapshot?token=' + gk);
    assert(r.status === 200 && r.json && r.json.ensembles && r.json.ensembles[ens.id], '/api/snapshot with the gatekeeper token');
    r = await http(PORT, '/api/snapshot?token=' + row0.token);
    assert(r.status === 403, '/api/snapshot with a player token → 403', r.status);

    // ---- hello → welcome ---------------------------------------------------------------
    const stray = await connect(PORT);
    let a = await call(stray, 'state', { playing: true });
    assert(a.ok === false && a.error === 'hello first', 'state before hello refused');
    a = await call(stray, 'hello', { token: 'not-a-token-at-all' });
    assert(a.ok === false && a.error === 'unknown token', 'hello: unknown token refused', a);
    stray.disconnect();

    const leader = await connect(PORT), player = await connect(PORT), third = await connect(PORT), keeper = await connect(PORT);
    a = await call(leader, 'hello', { token: row0.token });
    assert(a.ok && a.role === 'player' && a.leader === true && a.part === 'Tuba 1' && a.partIndex === 0 && a.mode === 'ALONE' && a.roomState.playing === false && a.piece.id === 'tubas' && a.room === 'ensemble', 'hello: the leader row → welcome (player, leader, part, mode, stopped tuple)', a);
    a = await call(player, 'hello', { token: row1.token });
    assert(a.ok && a.leader === false && a.part === 'Tuba 2', 'hello: a player → welcome (not leader)', a);
    a = await call(third, 'hello', { token: row2.token });
    assert(a.ok && a.part === 'Tuba 3', 'hello: a third player');
    a = await call(keeper, 'hello', { token: gk });
    assert(a.ok && a.role === 'gatekeeper' && Array.isArray(a.rows) && a.rows.length === 11 && a.rows[0].token === row0.token, 'hello: the gatekeeper → welcome with the rows and their links', a && a.role);
    const roster = await waitFor(player, 'roster', p => p.members.length === 4);
    assert(roster && roster.players === 3 && roster.members.find(m => m.rowId === row0.id).leader === true, 'roster broadcast: 3 players + the gatekeeper, the leader marked', roster);

    // ---- the clock ----------------------------------------------------------------------
    const t0 = Date.now();
    const pong = await call(leader, 'ping', t0);
    assert(pong.t0 === t0 && typeof pong.ts === 'number' && near(pong.ts, Date.now(), 2000), 'ping → pong(t0, ts)', pong);

    // ---- authority: state and mode in the ensemble room (AR-10) ----------------------------
    a = await call(player, 'state', { playing: true, anchorScoreTime: 10 });
    assert(a.ok === false && a.error === 'not the leader', "a player's state in the ensemble room refused", a);
    a = await call(player, 'mode', { mode: 'REHEARSAL' });
    assert(a.ok === false && a.error === 'not the leader', "a player's mode refused", a);
    a = await call(keeper, 'mode', { mode: 'REHEARSAL' });
    assert(a.ok && a.mode === 'REHEARSAL', 'the gatekeeper sets REHEARSAL', a);
    const modeEv = await waitFor(player, 'mode', p => p.mode === 'REHEARSAL');
    assert(!!modeEv, 'mode broadcast reaches every stand of the ensemble (the auto-join signal)');
    a = await call(leader, 'mode', { mode: 'SOMETHING' });
    assert(a.ok === false, 'a bad mode refused', a);

    let before = (await http(PORT, '/api/time')).json.s;
    a = await call(leader, 'state', { playing: true, anchorScoreTime: 100, rate: 0.85 });
    assert(a.ok && a.roomState.playing === true && a.roomState.rate === 0.85 && a.roomState.anchorScoreTime === 100 && a.roomState.anchorServerTime > before + 1000 && a.roomState.anchorServerTime < before + 2500 && a.roomState.seq >= 1, "the leader's PLAY: the anchor 1–2 s ahead, the speed kept", a.roomState);
    const st = await waitFor(player, 'state', p => p.seq === a.roomState.seq);
    assert(st && st.anchorServerTime === a.roomState.anchorServerTime, 'state broadcast to the room, the same tuple', st);
    const seqPlay = a.roomState.seq;
    a = await call(leader, 'state', { rate: 0.9, playing: true, anchorScoreTime: 100 });
    assert(a.ok && a.roomState.rate === 0.85, 'a speed off the presets keeps the previous one (50 / 70 / 85 / 100)', a.roomState);
    await sleep(1700);
    a = await call(leader, 'state', { playing: false });
    assert(a.ok && a.roomState.playing === false && a.roomState.anchorScoreTime > 100 && a.roomState.anchorScoreTime < 101, 'STOP: the anchor is the position reached (the lead honoured)', a.roomState);
    a = await call(leader, 'state', { playing: true, anchorScoreTime: 50 });
    await sleep(1600);
    const sync = await call(leader, 'resync', {});
    assert(sync.ok && sync.roomState.resync === true && sync.roomState.playing === true && sync.roomState.anchorScoreTime > 50 && sync.roomState.anchorScoreTime < 50.3 && sync.roomState.seq === a.roomState.seq + 1, 'RESYNC: the same motion, a fresh anchor at the position now', sync.roomState);
    a = await call(player, 'resync', {});
    assert(a.ok === false && a.error === 'not the leader', "a player's resync refused");

    // ---- CONCERT locks the speed (AR-34, 62) ------------------------------------------------
    a = await call(leader, 'state', { playing: false, anchorScoreTime: 0, rate: 0.7 });
    a = await call(leader, 'mode', { mode: 'CONCERT' });
    assert(a.ok && a.mode === 'CONCERT' && a.roomState.rate === 1, 'CONCERT: the tuple goes to 100', a.roomState);
    a = await call(leader, 'state', { playing: true, anchorScoreTime: 0, rate: 0.5 });
    assert(a.ok && a.roomState.rate === 1, 'CONCERT: a speed command stays at 100', a.roomState);
    a = await call(keeper, 'mode', { mode: 'REHEARSAL' });
    a = await call(leader, 'state', { playing: false, anchorScoreTime: 0 });

    // ---- the display (AR-31, 32) ----------------------------------------------------------------
    a = await call(player, 'display.show', { partIndex: 3 });
    assert(a.ok === false && a.error === 'gatekeeper only', "a player's display.show refused");
    a = await call(keeper, 'display.show', { partIndex: 3 });
    const disp = await waitFor(third, 'display', p => p.partIndex === 3);
    assert(a.ok && disp, 'the gatekeeper zooms the display for everyone', disp);

    // ---- sectionals (AR-13): live, headless, gone when empty ----------------------------------
    a = await call(keeper, 'sectional.start', {});
    assert(a.ok === false && a.error === 'players only', 'the gatekeeper cannot start a sectional');
    a = await call(player, 'sectional.start', {});
    assert(a.ok && a.room === 's1' && a.roomState.playing === false, 'sectional.start → a live room with its own tuple', a);
    let rl = await waitFor(leader, 'rooms', p => p.list.length === 1);
    assert(rl && rl.list[0].label === 'Tuba 2', 'rooms(list) broadcast, auto-labelled from the members', rl);
    a = await call(third, 'sectional.join', { id: 's1' });
    assert(a.ok && a.room === 's1', 'sectional.join');
    rl = await waitFor(leader, 'rooms', p => p.list[0] && p.list[0].members.length === 2);
    assert(rl && rl.list[0].label === 'Tuba 2 · Tuba 3', 'the label follows the members', rl && rl.list[0]);
    a = await call(third, 'sectional.join', { id: 's9' });
    assert(a.ok === false && /no such sectional/.test(a.error), 'joining a sectional that is not there is refused');
    leader.inbox.state = [];
    a = await call(third, 'state', { playing: true, anchorScoreTime: 200 });
    assert(a.ok && a.room === 's1' && a.roomState.anchorScoreTime === 200, "any member's state moves the sectional (headless, last wins)", a);
    const secSt = await waitFor(player, 'state', p => p.anchorScoreTime === 200);
    assert(!!secSt, "the sectional's state reaches its other member");
    await sleep(250);
    assert((leader.inbox.state || []).length === 0, "...and never the ensemble room");
    a = await call(player, 'sectional.leave', {});
    assert(a.ok && a.room === 'ensemble', 'sectional.leave → back to the ensemble room', a);
    third.disconnect();
    rl = await waitFor(leader, 'rooms', p => p.list.length === 0, 2000);
    assert(!!rl, 'the sectional dies when its last member leaves');

    // ---- readiness (AR-14, 63) -------------------------------------------------------------------
    a = await call(leader, 'ready', { video: true, calibrated: true });
    const ro = await waitFor(player, 'roster', p => p.ready === 1);
    assert(a.ok && ro && ro.players === 2 && ro.ready === 1, 'ready → the roster counts it (1 of 2)', ro);

    // ---- marks (AR-4): the owning token ------------------------------------------------------------
    a = await call(leader, 'marks.put', { view: 'part', marks: [{ t: 12.5, pts: [[0, 0], [1, 1]] }] });
    assert(a.ok && a.count === 1, 'marks.put', a);
    a = await call(leader, 'marks.get', { view: 'part' });
    assert(a.ok && a.marks.length === 1 && a.marks[0].t === 12.5, 'marks.get returns them', a);
    a = await call(player, 'marks.get', { view: 'part' });
    assert(a.ok && a.marks.length === 0, "another token sees none of them");
    a = await call(leader, 'marks.put', { view: 'nope', marks: [] });
    assert(a.ok === false, 'a bad view refused');

    // ---- the gatekeeper's page: reissue kills the old link at once (AR-5) ----------------------------
    a = await call(keeper, 'token.reissue', { rowId: row1.id });
    const newRow1 = a.ok && a.rows.find(x => x.id === row1.id);
    assert(a.ok && newRow1 && newRow1.token !== row1.token, 'token.reissue → a new token on the row', a && a.ok);
    const kicked = await waitFor(player, 'refused', p => p.error === 'revoked', 1500);
    await sleep(100);
    assert(kicked && player.connected === false, 'the stand on the old link is told and dropped', { kicked: !!kicked, connected: player.connected });
    const again = await connect(PORT);
    a = await call(again, 'hello', { token: row1.token });
    assert(a.ok === false && a.error === 'revoked', 'hello with the old link → revoked, with the plain message', a);
    r = await http(PORT, '/s/' + row1.token);
    assert(r.status === 410 && /ask your leader/.test(r.text), '/s/<old token> → 410 with the plain message');
    a = await call(again, 'hello', { token: newRow1.token });
    assert(a.ok && a.part === 'Tuba 2', 'hello with the new link works', a);
    a = await call(again, 'parts.set', { rows: [] });
    assert(a.ok === false && a.error === 'gatekeeper only', "a player's parts.set refused");
    a = await call(keeper, 'parts.set', { rows: [{ id: row2.id, leader: true }] });
    assert(a.ok && a.rows.find(x => x.id === row2.id).leader === true && a.rows.find(x => x.id === row0.id).leader === false, 'the leader tick moves (at most one row)');
    a = await call(leader, 'state', { playing: false, anchorScoreTime: 1 });
    assert(a.ok === false && a.error === 'not the leader', 'the tick is read live: the old leader loses authority at once');
    a = await call(keeper, 'parts.set', { rows: [{ id: row0.id, leader: true }] });
    a = await call(keeper, 'snapshot', {});
    assert(a.ok && a.snapshot.ensembles[ens.id], "the gatekeeper's snapshot (save a spare copy)");

    // ---- rate limiting (AR-5) ---------------------------------------------------------------------------
    const flood = await connect(PORT);
    let limited = false;
    for (let i = 0; i < 40 && !limited; i++) { const x = await call(flood, 'hello', { token: 'flood-' + i }); if (x.error === 'rate') limited = true; }
    assert(limited, 'hello is rate limited per address (within 40 bad attempts)');
    flood.disconnect();

    // ---- REHEARSAL → ALONE after the empty time (DESIGN §6) ----------------------------------------------
    a = await call(keeper, 'mode', { mode: 'REHEARSAL' });
    for (const s of [leader, again, keeper]) s.disconnect();
    await sleep(IDLE_MS + 700);
    r = await admin(PORT, key, 'ensemble/' + ens.id);
    assert(r.status === 200 && r.json.ensemble.mode === 'ALONE' && r.json.roster.members.length === 0, 'REHEARSAL falls back to ALONE once the room has been empty for the idle time', r.json && r.json.ensemble.mode);

    // ---- persistence: the registry survives a restart -----------------------------------------------------
    await stop(server);
    const server1b = await startServer(['--port', String(PORT)], data1);
    r = await admin(PORT, key, 'ensemble/' + ens.id);
    assert(r.status === 200 && r.json.ensemble.rows.length === 11 && r.json.ensemble.rows[0].leader === true, 'the registry survives a restart (rows, the tick)', r.json && r.json.ensemble.rows.length);
    const back = await connect(PORT);
    a = await call(back, 'hello', { token: row0.token });
    assert(a.ok && a.roomState && a.roomState.anchorScoreTime === 0 && a.roomState.playing === false, 'the standing room tuple survives too', a.roomState);
    back.disconnect();

    // ---- THE SPARE: the same tokens from a snapshot (AR-58, 59) -----------------------------------------------
    const snapFile = path.join(scratch, 'spare.json');
    fs.writeFileSync(snapFile, JSON.stringify((await admin(PORT, key, 'snapshot')).json));
    server2 = await startServer(['--port', String(PORT2), '--spare', snapFile], path.join(scratch, 'd2'));
    r = await http(PORT2, '/health');
    assert(r.status === 200 && r.json.spare === true && r.json.ensembles === 1, 'the spare starts from the snapshot', r.json);
    const sp = await connect(PORT2);
    a = await call(sp, 'hello', { token: row0.token });
    assert(a.ok && a.spare === true && a.leader === true && a.part === 'Tuba 1' && a.roomState.playing === false, "the leader's link works on the spare, as leader; the room starts stopped", a);
    a = await call(sp, 'state', { playing: true, anchorScoreTime: 30 });
    assert(a.ok && a.roomState.playing === true, 'the spare runs the room');
    sp.disconnect();
    server = server1b;
  } finally {
    // the verdict first, so a teardown hang can never hide it
    console.log(checks.filter(c => c.startsWith('  ok')).length + ' ok, ' + fail + ' failed');
    if (fail) console.log(checks.filter(c => c.startsWith('  FAIL')).join('\n'));
    else console.log('SERVER GREEN: the eleven messages · the authority refusals · the door · reissue · rate limit · the fallback · persistence · the spare');
    await stop(server);
    await stop(server2);
    try { fs.rmSync(scratch, { recursive: true, force: true }); } catch (e) { /* scratch */ }
  }
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('!! ' + (e.stack || e)); process.exit(2); });
