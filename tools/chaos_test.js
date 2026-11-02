#!/usr/bin/env node
// chaos_test.js — GATE E-5, THE CHAOS TEST (PLAN 9g VERIFY; AR-57, 44, 47):
// N fake stands on the real server; the room plays; then a stand is killed and
// rejoins · the SERVER is killed mid-piece and restarted · every survivor is
// checked against the others. Each fake stand does what a real one will do
// (DESIGN §5): a few clock samples → an offset to server time; then
//   scoreTime = anchorScoreTime + (serverNow − anchorServerTime) × rate
// from the tuple it holds — after GO the network is optional (AR-44).
//
//   node tools/chaos_test.js [--n 10] [--port 5396]
//
// Reports: the spread of the N positions read at one instant (ms), the rejoin
// time of the killed stand, the reconnect time of every stand after the server
// restart, and whether the tuple came back byte-identical. Bars: spread ≤ 10 ms
// on this one machine (the beacon's device-to-device bar is 7.7 ms, AR-47; here
// the only noise is the offset estimate) · rejoin ≤ 3 s · nobody lost.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { io } = require('socket.io-client');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const N = parseInt(arg('--n', '10'), 10);
const PORT = parseInt(arg('--port', '5396'), 10);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'stand-chaos-'));
const data = path.join(scratch, 'data');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const localNow = () => performance.now();   // the stand's own clock, ms

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'server', 'server.js'), '--data', data, '--port', String(PORT), '--quiet'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    child.stderr.on('data', d => process.stderr.write('[server] ' + d));
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
const admin = async (key, op, body) => (await fetch('http://127.0.0.1:' + PORT + '/admin/' + op, { method: 'POST', headers: { 'x-admin-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();

// ---- a fake stand -------------------------------------------------------------------------
function makeStand(token, label) {
  const S = { token, label, tuple: null, offset: 0, welcomeAt: 0, connectAt: 0, reconnects: 0, sock: null, mode: null };
  S.sock = io('http://127.0.0.1:' + PORT, { transports: ['websocket'], reconnection: true, reconnectionDelay: 200, reconnectionDelayMax: 1000, randomizationFactor: 0.2, forceNew: true });
  S.sock.on('connect', () => {
    S.connectAt = localNow();
    S.sock.emit('hello', { token }, w => {
      if (!w || !w.ok) return;
      S.tuple = w.roomState; S.mode = w.mode; S.welcomeAt = localNow(); S.reconnects++;
    });
  });
  S.sock.on('state', t => { S.tuple = t; });
  S.sock.on('mode', m => { S.mode = m.mode; if (m.roomState) S.tuple = m.roomState; });
  S.sample = async (k) => {
    // the floor clock in miniature: the best of k pings by round trip
    let best = null;
    for (let i = 0; i < (k || 8); i++) {
      const t0 = localNow();
      const pong = await new Promise(res => S.sock.emit('ping', t0, res));
      const t1 = localNow();
      const rtt = t1 - t0, off = pong.ts - (t0 + t1) / 2;
      if (!best || rtt < best.rtt) best = { rtt, off };
      await sleep(15);
    }
    S.offset = best.off; S.rtt = best.rtt;
  };
  S.serverNow = () => localNow() + S.offset;
  S.position = () => {
    const t = S.tuple; if (!t) return null;
    if (!t.playing) return t.anchorScoreTime;
    return t.anchorScoreTime + Math.max(0, S.serverNow() - t.anchorServerTime) / 1000 * t.rate;
  };
  S.waitWelcome = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (S.tuple) return true; await sleep(20); } return false; };
  return S;
}

const spreadMs = stands => {
  const pos = stands.map(s => s.position()).filter(p => p != null);
  return { n: pos.length, spreadMs: (Math.max(...pos) - Math.min(...pos)) * 1000, min: Math.min(...pos), max: Math.max(...pos) };
};
const tupleKey = t => t ? [t.seq, t.anchorServerTime.toFixed(3), t.anchorScoreTime, t.rate, t.playing].join('|') : 'none';

(async () => {
  const report = { n: N, steps: [] };
  const say = (k, v) => { report.steps.push(Object.assign({ step: k }, v)); console.log('  ' + k + '  ' + JSON.stringify(v)); };
  let server = await startServer();
  let ok = true;
  const stands = [];
  try {
    const key = fs.readFileSync(path.join(data, 'admin.key'), 'utf8').trim();
    await admin(key, 'piece.register', { id: 'tubas', title: 'for seven tubas', ir: 'db1' });
    let ens = (await admin(key, 'ensemble.create', { name: 'Chaos', piece: 'tubas' })).ensemble;
    // N stands: the ten rows, plus doubling rows if N > 10
    while (ens.rows.length < N) ens = (await admin(key, 'row.add', { ensembleId: ens.id, partIndex: ens.rows.length % 10 })).ensemble;
    await admin(key, 'parts.set', { ensembleId: ens.id, rows: [{ id: ens.rows[0].id, leader: true }] });

    for (let i = 0; i < N; i++) stands.push(makeStand(ens.rows[i].token, ens.rows[i].part + (i >= 10 ? ' (2)' : '')));
    for (const s of stands) if (!(await s.waitWelcome(5000))) throw new Error('a stand never got welcome: ' + s.label);
    for (const s of stands) await s.sample(8);
    say('joined', { stands: stands.length, offsetsMs: stands.map(s => +s.offset.toFixed(2)), rttMs: +Math.max(...stands.map(s => s.rtt)).toFixed(2) });

    // the leader flips REHEARSAL and plays from 100 s
    const leader = stands[0];
    await new Promise(res => leader.sock.emit('mode', { mode: 'REHEARSAL' }, res));
    const play = await new Promise(res => leader.sock.emit('state', { playing: true, anchorScoreTime: 100, rate: 1 }, res));
    await sleep(2200);   // past the 1.5 s lead; every stand has the tuple
    let sp = spreadMs(stands);
    say('playing', { tuple: tupleKey(play.roomState), spreadMs: +sp.spreadMs.toFixed(2), positionS: +sp.min.toFixed(3) });
    if (sp.n !== N || sp.spreadMs > 10) ok = false;

    // 1. kill a stand, rejoin
    const victim = stands[3];
    const seqBefore = victim.tuple.seq;
    victim.sock.disconnect();
    await sleep(800);
    const t0 = localNow();
    victim.tuple = null;
    victim.sock.connect();
    const back = await victim.waitWelcome(5000);
    const rejoinMs = localNow() - t0;
    await victim.sample(6);
    sp = spreadMs(stands);
    say('stand killed + rejoined', { rejoinMs: +rejoinMs.toFixed(0), sameTuple: back && victim.tuple.seq === seqBefore, spreadMs: +sp.spreadMs.toFixed(2) });
    if (!back || victim.tuple.seq !== seqBefore || rejoinMs > 3000 || sp.spreadMs > 10) ok = false;

    // 2. the server dies mid-piece and comes back
    const keyBefore = tupleKey(leader.tuple);
    const posBefore = spreadMs(stands);
    for (const s of stands) { s.tuple_keep = s.tuple; s.reconnects = 0; s.welcomeAt = 0; }
    const tKill = localNow();
    await stop(server);
    await sleep(1500);
    // while the server is down, every stand still knows where it is (AR-44)
    const during = spreadMs(stands);
    server = await startServer();
    const tUp = localNow();
    let all = false;
    for (let i = 0; i < 200 && !all; i++) { all = stands.every(s => s.reconnects >= 1 && s.tuple); if (!all) await sleep(50); }
    const reconnectMs = stands.map(s => +(s.welcomeAt - tUp).toFixed(0));
    for (const s of stands) await s.sample(6);
    sp = spreadMs(stands);
    const keyAfter = tupleKey(leader.tuple);
    say('server killed + restarted', { downMs: +(tUp - tKill).toFixed(0), allBack: all, reconnectMsAfterUp: reconnectMs, tupleIdentical: keyBefore === keyAfter, spreadMs: +sp.spreadMs.toFixed(2), positionS: +sp.min.toFixed(3), spreadWhileDownMs: +during.spreadMs.toFixed(2) });
    if (!all || keyBefore !== keyAfter || sp.n !== N || sp.spreadMs > 10 || Math.max(...reconnectMs) > 3000) ok = false;
    // the position kept moving through the outage (AR-44: after GO the network is optional)
    if (!(sp.min > posBefore.min + (tUp - tKill) / 1000 - 0.05)) ok = false;

    // 3. the leader stops; everyone stops at the same place
    const stopAck = await new Promise(res => leader.sock.emit('state', { playing: false }, res));
    await sleep(300);
    const stopped = stands.map(s => s.tuple && s.tuple.seq === stopAck.roomState.seq && s.tuple.playing === false);
    say('stopped', { everyone: stopped.every(Boolean), at: +stopAck.roomState.anchorScoreTime.toFixed(3) });
    if (!stopped.every(Boolean)) ok = false;
  } catch (e) {
    ok = false;
    console.error('!! ' + (e.stack || e));
  } finally {
    for (const s of stands) { try { s.sock.disconnect(); } catch (e) { /* closing */ } }
    await stop(server);
    try { fs.rmSync(scratch, { recursive: true, force: true }); } catch (e) { /* scratch */ }
  }
  report.ok = ok;
  const out = path.join(ROOT, 'testkit', 'results', 'chaos__' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 1));
  console.log((ok ? 'CHAOS OK' : 'CHAOS FAILED') + ' — ' + path.relative(ROOT, out));
  process.exit(ok ? 0 : 1);
})();
