// t_clock.js — T3: THE CLOCK (docs/ENGINE_BRIEF.md §3, §5).
//   · the ROOM CLOCK every visual test shares: TK.SyncClock (the floor rule) fed
//     by pings to /api/time every 2 s
//   · the scripted run: lock → baseline (this device's drift, measured) →
//     calibrate → the server LIES to this stand (bias · jitter · drift ·
//     subtle), with honest recoveries between → scored against the server's
//     HONEST stamp, which only the scoring ever reads
//   · the BEACON: the zero-rig two-screen check (flash + sweep + digits on the
//     room clock) — film two stands side by side in slow motion, count frames
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};
  const S = TK.stats;

  // ------------------------------------------------------------ the room clock
  const room = {
    clock: null, cid: null, timer: null, samples: [], naiveWin: [], busy: false, onSample: null, pingMs: 2000, lie: 'none',
    async ping() {
      const Ls = performance.now();
      const r = await fetch('api/time?cid=' + encodeURIComponent(this.cid) + '&n=' + Math.round(Ls), { cache: 'no-store' });
      const j = await r.json();
      const Lr = performance.now();
      return { Ls, Lr, S: j.s, T: j.t, lie: j.lie };
    },
    async lock() {
      if (!this.cid) this.cid = 'st-' + Math.random().toString(36).slice(2, 8);
      this.stop();
      this.clock = new TK.SyncClock();
      this.samples = []; this.naiveWin = [];
      const burst = [];
      for (let i = 0; i < 8; i++) { burst.push(await this.ping()); await S.sleep(120); }
      const info = this.clock.lock(burst);
      for (const x of burst) this._record(x, 'lock');
      return info;
    },
    start() {
      if (this.timer) return;
      const tick = async () => {
        if (this.busy) return;
        this.busy = true;
        try { const x = await this.ping(); const r = this.clock.ingest(x); this._record(x, r.action); }
        catch (e) { this.samples.push({ action: 'network-error', err: String(e && e.message || e), at: performance.now() }); }
        finally { this.busy = false; }
      };
      this.timer = setInterval(tick, this.pingMs);
    },
    stop() { if (this.timer) clearInterval(this.timer); this.timer = null; },
    async ensure() {
      if (!this.clock || this.clock.state === 'unlocked') await this.lock();
      this.start();
      return this.clock;
    },
    _record(x, action) {
      const mid = (x.Ls + x.Lr) / 2, rtt = x.Lr - x.Ls;
      const s = { mid, rtt, off: x.S - mid, tru: x.T - mid, lie: x.lie, action, applied: this.clock.applied(mid), state: this.clock.state };
      // what a plain min-RTT sync would use: the best of the last 8, no gates
      this.naiveWin.push({ rtt, off: s.off });
      if (this.naiveWin.length > 8) this.naiveWin.shift();
      s.naive = this.naiveWin.slice().sort((a, b) => a.rtt - b.rtt)[0].off;
      this.samples.push(s);
      if (this.onSample) this.onSample(s);
    },
    async sabotage(mode) {
      await fetch('api/sabotage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cid: this.cid, mode }) });
      this.lie = mode;
    },
    // the honest line: the server's TRUE stamps, fitted over the run — the
    // yardstick for both the floor-rule clock and the naive one
    truth(from, to) {
      const xs = [], ys = [];
      for (const s of this.samples.slice(from || 0, to)) if (s.tru != null) { xs.push(s.mid); ys.push(s.tru); }
      return S.linfit(xs, ys);
    },
  };

  // ------------------------------------------------------------ live chart
  function drawChart(cv, samples, truthFit, windowMs) {
    if (!cv || !truthFit) return;
    const dpr = devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const pts = samples.filter(s => s.tru != null);
    if (pts.length < 2) return;
    const tEnd = pts[pts.length - 1].mid, tBeg = Math.max(pts[0].mid, tEnd - windowMs);
    const lim = 40;                                         // ± ms shown; beyond is pinned to the edge
    const X = t => 40 + (W - 50) * (t - tBeg) / Math.max(1, tEnd - tBeg);
    const Y = e => H / 2 - (H / 2 - 12) * Math.max(-1, Math.min(1, e / lim));
    // lie periods
    g.fillStyle = 'rgba(220, 60, 40, 0.10)';
    let a = null;
    for (const s of pts) {
      if (s.mid < tBeg) continue;
      if (s.lie !== 'none' && a === null) a = s.mid;
      if (s.lie === 'none' && a !== null) { g.fillRect(X(a), 0, X(s.mid) - X(a), H); a = null; }
    }
    if (a !== null) g.fillRect(X(a), 0, X(tEnd) - X(a), H);
    // grid
    g.strokeStyle = '#ccc'; g.lineWidth = 1; g.font = '11px system-ui, sans-serif'; g.fillStyle = '#777';
    for (const e of [-40, -20, -10, 0, 10, 20, 40]) {
      g.beginPath(); g.moveTo(40, Y(e)); g.lineTo(W - 10, Y(e)); g.stroke();
      g.fillText((e > 0 ? '+' : '') + e, 4, Y(e) + 4);
    }
    const line = (key, color) => {
      g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
      let first = true;
      for (const s of pts) {
        if (s.mid < tBeg) continue;
        const e = s[key] - truthFit.at(s.mid);
        if (first) { g.moveTo(X(s.mid), Y(e)); first = false; } else g.lineTo(X(s.mid), Y(e));
      }
      g.stroke();
    };
    line('naive', '#d0342c');
    line('applied', '#1a8a3a');
    g.fillStyle = '#d0342c'; g.fillText('plain sync', W - 170, 14);
    g.fillStyle = '#1a8a3a'; g.fillText('floor rule', W - 90, 14);
    g.fillStyle = '#777'; g.fillText('error vs the server\'s honest time (ms) · shaded = the server is lying to this stand', 44, H - 4);
  }

  // ------------------------------------------------------------ the scripted run
  const PLANS = {
    quick: [['baseline', 'none', 100], ['calibrate'], ['bias', 'bias', 40], ['recover', 'none', 30], ['drift', 'drift', 45], ['recover', 'none', 30]],
    full: [['baseline', 'none', 480], ['calibrate'], ['bias', 'bias', 60], ['recover', 'none', 45], ['jitter', 'jitter', 60], ['recover', 'none', 45],
      ['drift', 'drift', 60], ['recover', 'none', 45], ['subtle', 'subtle', 120], ['recover', 'none', 60]],
  };
  const WHAT = {
    baseline: 'honest network — measuring this device\'s clock drift',
    bias: 'the server says it is 250 ms later than it is',
    jitter: 'the server\'s stamps jump ±120 ms at random',
    drift: 'the server\'s clock "drifts" 1000 ppm — faster than any real clock',
    subtle: 'the server drifts 80 ppm — a lie a real clock COULD tell',
    recover: 'honest again',
  };

  async function runT3(opts, ui) {
    const plan = PLANS[opts.quick ? 'quick' : 'full'];
    const u = Object.assign({ phase() {}, sample() {}, log() {}, aborted: () => false }, ui || {});
    room.stop();
    const lockInfo = await room.lock();
    room.clock.onLog = e => u.log(e);
    room.onSample = s => u.sample(s, room);
    room.start();
    const episodes = [];
    let drift = null, cal = null;
    try {
      for (const step of plan) {
        if (u.aborted()) throw new Error('stopped by the user');
        if (step[0] === 'calibrate') {
          // samples wait 30 s in quarantine before they are trusted, so a
          // 100-s baseline yields ~70 s of trusted history; 35 s is the floor
          drift = room.clock.drift(35000);
          cal = room.clock.calibrate(performance.now(), 35000);
          u.phase('calibrate', 'none', 0, cal ? 'calibrated: ' + (cal.clockPpm >= 0 ? '+' : '') + cal.clockPpm.toFixed(1) + ' ppm' : 'calibration skipped (too little data)');
          continue;
        }
        const [name, mode, secs] = step;
        await room.sabotage(mode);
        const snap = { refuse: Object.assign({}, room.clock.refuse), trips: room.clock.count.trips, corr: room.clock.count.corrections };
        const i0 = room.samples.length;
        u.phase(name, mode, secs, WHAT[name]);
        const tEnd = performance.now() + secs * 1000;
        while (performance.now() < tEnd) {
          if (u.aborted()) throw new Error('stopped by the user');
          await S.sleep(250);
        }
        const refused = {};
        for (const k in room.clock.refuse) refused[k] = room.clock.refuse[k] - snap.refuse[k];
        episodes.push({ name, mode, seconds: secs, from: i0, to: room.samples.length, refused,
          trips: room.clock.count.trips - snap.trips, corrections: room.clock.count.corrections - snap.corr });
      }
    } finally {
      await room.sabotage('none').catch(() => {});
    }
    // ---- score against the honest line
    const tf = room.truth();
    const ss = room.samples;
    const err = s => ({ floor: s.applied - tf.at(s.mid), naive: s.naive - tf.at(s.mid) });
    const t0 = ss.length ? ss[0].mid : 0;
    for (const ep of episodes) {
      let fMax = 0, nMax = 0, fEnd = 0;
      const part = ss.slice(ep.from, ep.to).filter(s => s.tru != null && s.mid - t0 > 20000);
      part.forEach((s, i) => {
        const e = err(s);
        fMax = Math.max(fMax, Math.abs(e.floor)); nMax = Math.max(nMax, Math.abs(e.naive));
        if (i >= part.length / 2) fEnd = Math.max(fEnd, Math.abs(e.floor));
      });
      ep.floorMaxMs = S.r1(fMax); ep.naiveMaxMs = S.r1(nMax); ep.floorMaxSecondHalfMs = S.r1(fEnd); ep.samples = part.length;
      delete ep.from; delete ep.to;
    }
    const rtts = S.sorted(ss.filter(s => s.rtt != null).map(s => s.rtt));
    const res = {
      cid: room.cid, pingEveryS: room.pingMs / 1000, samples: ss.length,
      lock: { offsetMs: S.r1(lockInfo.offset), rttMs: S.r1(lockInfo.rtt) },
      rttMs: { min: S.r1(rtts[0]), median: S.r1(S.pct(rtts, 50)), p95: S.r1(S.pct(rtts, 95)), max: S.r1(S.pct(rtts, 100)) },
      drift: drift ? { clockPpm: S.r1(drift.clockPpm), sigmaPpm: S.r2(drift.sigmaPpm), spanS: S.r0(drift.spanS), n: drift.n, residualMs: S.r2(drift.residualMs),
        meaning: 'this device\'s clock runs ' + Math.abs(drift.clockPpm).toFixed(1) + ' ppm ' + (drift.clockPpm >= 0 ? 'fast' : 'slow') + ' against the server — free-running, it would drift ' +
          (Math.abs(drift.clockPpm) * 750e-3).toFixed(1) + ' ms over the 12.5-minute piece' } : null,
      calibration: cal ? { clockPpm: S.r1(cal.clockPpm), sigmaPpm: S.r2(cal.sigmaPpm) } : null,
      episodes,
      final: room.clock.status(performance.now()),
      decisions: room.clock.log.filter(e => e.kind !== 'correct').slice(-40).map(e => ({ atS: S.r1((e.L - t0) / 1000), kind: e.kind, msg: e.msg })),
      corrections: room.clock.log.filter(e => e.kind === 'correct').length,
      trace: ss.filter(s => s.tru != null).map(s => [S.r1((s.mid - t0) / 1000), S.r2(s.rtt), S.r2(s.applied - tf.at(s.mid)), S.r2(s.naive - tf.at(s.mid)), s.lie === 'none' ? 0 : s.lie[0]]),
      traceColumns: ['t s', 'rtt ms', 'floor-rule error ms', 'plain-sync error ms', 'lie'],
    };
    return res;
  }

  // ------------------------------------------------------------ the beacon
  async function beacon(say) {
    if (say) say('locking to the room clock…');
    await room.ensure();
    const th = TK.lanes.theater.open();
    th.el.classList.add('beacon');
    th.stage.innerHTML = '<canvas class="bc"></canvas>';
    const cv = th.stage.firstChild;
    let stop = false;
    th.onExit = () => { stop = true; };
    th.hud('BEACON — room clock · tap stop to leave');
    return new Promise(resolve => {
      let lastSec = null, flash = 0;
      function step(ts) {
        if (stop) { th.el.classList.remove('beacon'); th.close(); return resolve(); }
        const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
        if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
        const g = cv.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const rt = room.clock.now(ts);
        const sec = Math.floor(rt / 1000);
        if (lastSec !== null && sec !== lastSec) flash = 2;
        lastSec = sec;
        g.fillStyle = flash > 0 ? '#fff' : '#000';
        g.fillRect(0, 0, W, H);
        if (flash > 0) flash--;
        const frac = ((rt % 1000) + 1000) % 1000 / 1000;
        g.fillStyle = '#ff15a0';
        g.fillRect(frac * W - 3, H * 0.62, 6, H * 0.3);
        g.fillStyle = flash > 0 ? '#000' : '#fff';
        g.font = Math.round(H * 0.16) + 'px ui-monospace, Menlo, Consolas, monospace';
        g.textAlign = 'center';
        g.fillText(((rt / 1000) % 100).toFixed(3), W / 2, H * 0.42);
        g.font = Math.round(H * 0.035) + 'px system-ui, sans-serif';
        g.fillText('room ' + room.clock.state + ' · flash = every whole second of room time', W / 2, H * 0.54);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  TK.clock = { room, runT3, beacon, drawChart, WHAT };
})(typeof self !== 'undefined' ? self : this);
