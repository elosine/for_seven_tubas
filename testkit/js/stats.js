// stats.js — the measuring instruments every test shares (T1's core).
// Frame cadence from requestAnimationFrame timestamps, long tasks, a synthetic
// main-thread load, and the small numeric helpers the report cards use.
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const nextFrame = () => new Promise(r => requestAnimationFrame(r));
  function sorted(a) { return Float64Array.from(a).sort(); }
  function pct(s, p) {
    if (!s.length) return NaN;
    const i = Math.min(s.length - 1, Math.max(0, Math.round(p / 100 * (s.length - 1))));
    return s[i];
  }
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const r1 = x => (x == null || !isFinite(x)) ? null : Math.round(x * 10) / 10;
  const r2 = x => (x == null || !isFinite(x)) ? null : Math.round(x * 100) / 100;
  const r0 = x => (x == null || !isFinite(x)) ? null : Math.round(x);

  // ------------------------------------------------ frame cadence
  // Deltas between consecutive rAF timestamps. The refresh period is the
  // median delta (a 60 Hz screen -> 16.7 ms; 120 Hz -> 8.3 ms). A delta over
  // 1.5 periods means at least one refresh went by with no new frame.
  class FrameRecorder {
    constructor() { this.deltas = []; this.last = null; this.startTs = null; this.hidden = false; }
    tick(ts) {
      if (this.startTs === null) this.startTs = ts;
      if (this.last !== null) this.deltas.push(ts - this.last);
      this.last = ts;
      if (document.hidden) this.hidden = true;
    }
    summary() {
      const d = this.deltas;
      if (d.length < 10) return { frames: d.length, error: 'too few frames — was the tab hidden?' };
      const s = sorted(d);
      const period = pct(s, 50);
      let missed = 0, late = 0, stalls = 0, worst = 0;
      const bins = { onTime: 0, late: 0, dropped1: 0, dropped2to3: 0, stall: 0 };
      for (const x of d) {
        const k = x / period;
        worst = Math.max(worst, x);
        if (k <= 1.25) bins.onTime++;
        else if (k <= 1.5) { bins.late++; late++; }
        else if (k <= 2.5) { bins.dropped1++; missed += Math.round(k) - 1; }
        else if (k <= 4.5) { bins.dropped2to3++; missed += Math.round(k) - 1; }
        else { bins.stall++; missed += Math.round(k) - 1; stalls++; }
      }
      const expected = d.length + missed;
      return {
        frames: d.length, seconds: r1((this.last - this.startTs) / 1000),
        refreshHz: r1(1000 / period), periodMs: r2(period),
        p50: r2(period), p95: r2(pct(s, 95)), p99: r2(pct(s, 99)), max: r1(worst),
        missedFrames: missed, missedPct: r2(100 * missed / expected), stalls,
        onTimePct: r1(100 * bins.onTime / d.length), bins,
        hiddenDuringRun: this.hidden,
      };
    }
  }

  // long tasks (Chromium only; Safari/Firefox report "unsupported")
  class LongTasks {
    constructor() {
      this.list = [];
      this.supported = typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes || []).includes('longtask');
      this.obs = null;
    }
    start() {
      if (!this.supported) return;
      this.obs = new PerformanceObserver(l => { for (const e of l.getEntries()) this.list.push(e.duration); });
      this.obs.observe({ entryTypes: ['longtask'] });
    }
    stop() {
      if (this.obs) this.obs.disconnect();
      if (!this.supported) return { supported: false };
      return { supported: true, count: this.list.length, totalMs: r0(this.list.reduce((a, b) => a + b, 0)), maxMs: r0(Math.max(0, ...this.list)) };
    }
  }

  // synthetic main-thread load — stands in for everything else a real stand's
  // main thread does (network messages, GC, UI). 'heavy' = 8 ms of busy work in
  // every frame plus a 60 ms stall every 2 s.
  const LOADS = {
    off: { perFrameMs: 0, spikeMs: 0, everyMs: 0 },
    light: { perFrameMs: 4, spikeMs: 0, everyMs: 0 },
    heavy: { perFrameMs: 8, spikeMs: 60, everyMs: 2000 },
  };
  function busy(ms) { const t = performance.now(); while (performance.now() - t < ms) { /* spin */ } }
  class Load {
    constructor(level) { this.cfg = LOADS[level] || LOADS.off; this.level = LOADS[level] ? level : 'off'; this.nextSpike = null; }
    tick(ts) {
      if (this.cfg.perFrameMs) busy(this.cfg.perFrameMs);
      if (this.cfg.everyMs) {
        if (this.nextSpike === null) this.nextSpike = ts + this.cfg.everyMs;
        if (ts >= this.nextSpike) { busy(this.cfg.spikeMs); this.nextSpike += this.cfg.everyMs; }
      }
    }
  }

  // run fn(ts) in rAF for `seconds`, recording cadence; resolves with the summary
  // no animation frames at all = the tab is hidden or the screen is locked; say
  // so instead of waiting forever
  function framesFlowing(ms) {
    return new Promise(resolve => {
      let got = false;
      requestAnimationFrame(() => { got = true; resolve(true); });
      setTimeout(() => { if (!got) resolve(false); }, ms || 2000);
    });
  }
  const NO_FRAMES = 'no animation frames arrived — this tab is hidden or the screen is locked; keep the page visible and the screen on';

  function rafRun(seconds, fn, opts) {
    const o = opts || {};
    return new Promise(resolve => {
      const rec = new FrameRecorder(), lt = new LongTasks(), load = new Load(o.load || 'off');
      let t0 = null, stopped = false;
      lt.start();
      setTimeout(() => { if (t0 === null && !stopped) { stopped = true; lt.stop(); resolve({ error: NO_FRAMES }); } }, 2500);
      function step(ts) {
        if (stopped) return;
        if (t0 === null) t0 = ts;
        rec.tick(ts);
        if (fn) fn(ts, ts - t0);
        load.tick(ts);
        if (ts - t0 >= seconds * 1000) {
          stopped = true;
          const s = rec.summary();
          s.longTasks = lt.stop();
          s.load = load.level;
          return resolve(s);
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function linfit(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    let xm = 0, ym = 0;
    for (let i = 0; i < n; i++) { xm += xs[i]; ym += ys[i]; }
    xm /= n; ym /= n;
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - xm; sxx += dx * dx; sxy += dx * (ys[i] - ym); }
    const b = sxx > 0 ? sxy / sxx : 0;
    let ss = 0;
    for (let i = 0; i < n; i++) { const r = ys[i] - (ym + b * (xs[i] - xm)); ss += r * r; }
    return { b, a: ym - b * xm, s: Math.sqrt(ss / Math.max(1, n - 2)), n, at: x => ym + b * (x - xm) };
  }

  TK.stats = { sleep, nextFrame, sorted, pct, mean, r0, r1, r2, FrameRecorder, LongTasks, Load, LOADS, busy, rafRun, linfit, framesFlowing, NO_FRAMES };
})(typeof self !== 'undefined' ? self : this);
