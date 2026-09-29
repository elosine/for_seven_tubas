// t_video.js — T4: THE VIDEO STAND (docs/ENGINE_BRIEF.md §2 C, §5).
//   seek      how long a jump takes, on the exporter's encode and on the
//             1-second-keyframe encode (GOP length decides it)
//   free-run  the player on its own: frame cadence, repeats/skips, its drift
//             against performance.now(), and whether video.currentTime is a
//             CONTINUOUS clock (which servo mode this browser gets)
//   rate      does the browser honour a 1 % speed change, and what does it cost
//   servo     the frame servo (js/servo.js) holding the video to the clock, with
//             the deliberate wrong-clock case: +80 ms injected at 10 s
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};
  const S = TK.stats;
  const L = () => TK.lanes;

  function makeVideo(stage, src) {
    stage.innerHTML = '<video class="vid" muted playsinline preload="auto"></video>';
    const v = stage.firstChild;
    v.muted = true; v.playsInline = true;
    v.src = src;
    return v;
  }
  async function ready(v) {
    await L().waitEvent(v, 'canplaythrough', 20000).catch(() => {});
    if (v.readyState < 2) await L().waitEvent(v, 'loadeddata', 10000).catch(() => {});
  }
  async function seekTo(v, s) {
    const p = L().waitEvent(v, 'seeked', 8000);
    v.currentTime = s;
    await p;
  }

  // ------------------------------------------------------------ seek latency
  async function seekTest(stage, src, n) {
    const v = makeVideo(stage, src);
    await ready(v);
    const dur = v.duration || 60;
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = 1 + Math.random() * (dur - 2);
      const t0 = performance.now();
      const pFrame = L().hasRVFC ? new Promise(r => v.requestVideoFrameCallback(now => r(now))) : null;
      try { await seekTo(v, x); } catch (e) { out.push({ error: 'seek timeout' }); continue; }
      const seeked = performance.now() - t0;
      let frame = null;
      if (pFrame) { const f = await Promise.race([pFrame, S.sleep(3000).then(() => null)]); if (f) frame = f - t0; }
      out.push({ seeked, frame });
      await S.sleep(120);
    }
    v.removeAttribute('src'); v.load();
    const sk = S.sorted(out.filter(o => o.seeked != null).map(o => o.seeked));
    const fr = S.sorted(out.filter(o => o.frame != null).map(o => o.frame));
    return { src, n, seekedMs: { median: S.r1(S.pct(sk, 50)), p90: S.r1(S.pct(sk, 90)), max: S.r1(S.pct(sk, 100)) },
      firstFrameMs: fr.length ? { median: S.r1(S.pct(fr, 50)), p90: S.r1(S.pct(fr, 90)), max: S.r1(S.pct(fr, 100)) } : null };
  }

  // ------------------------------------------------------------ play and sample
  // one rVFC sample per presented frame: its display instant (edt), its PTS
  // (mt), and the continuous media clock at that instant if currentTime is one
  function collect(v, seconds, extra) {
    return new Promise(resolve => {
      const samples = [];
      let stop = false;
      const cb = (now, md) => {
        if (stop) return;
        const cbNow = performance.now();
        const ct = v.currentTime * 1000;
        samples.push({ edt: md.expectedDisplayTime, mt: md.mediaTime * 1000, pf: md.presentedFrames, ct, ctAt: ct + (md.expectedDisplayTime - cbNow) * v.playbackRate, cbNow, rate: v.playbackRate });
        if (extra) extra(samples[samples.length - 1]);
        v.requestVideoFrameCallback(cb);
      };
      v.requestVideoFrameCallback(cb);
      setTimeout(() => { stop = true; resolve(samples); }, seconds * 1000);
    });
  }
  function analyseFreeRun(samples, fps) {
    const pres = L().presentation(samples, fps);
    // the player's drift against the local clock, from the PTS (quantized but long)
    const ok = samples.filter((s, i) => i > 5);
    const f1 = S.linfit(ok.map(s => s.edt), ok.map(s => s.mt));
    // is currentTime a continuous clock? fit it against the callback instant:
    // continuous -> sub-ms residuals; frame-quantized -> ~ a frame/√12 (~4.8 ms)
    const f2 = S.linfit(ok.map(s => s.cbNow), ok.map(s => s.ct));
    let equalPts = 0;
    for (const s of ok) if (Math.abs(s.ct - s.mt) < 0.05) equalPts++;
    const continuous = f2 ? f2.s < 2 && equalPts / ok.length < 0.5 : false;
    const f3 = S.linfit(ok.map(s => s.cbNow), ok.map(s => s.ctAt));
    return {
      presentation: pres,
      playerDriftPpm: f1 ? S.r1((f1.b - 1) * 1e6) : null,
      playerDriftFromCurrentTimePpm: continuous && f3 ? S.r1((f3.b - 1) * 1e6) : null,
      currentTime: { continuous, residualMs: f2 ? S.r2(f2.s) : null, equalsPtsPct: S.r1(100 * equalPts / Math.max(1, ok.length)),
        meaning: continuous ? 'continuous — the servo steers the continuous lead (best mode)' : 'frame-quantized — the servo falls back to whole-frame control' },
    };
  }

  // ------------------------------------------------------------ rate response
  async function rateTest(v, fps) {
    const segs = [[1.0, 3], [1.01, 6], [0.99, 6], [1.0, 3]];
    await seekTo(v, 1);
    const all = [];
    let seg = 0;
    const pr = collect(v, segs.reduce((a, s) => a + s[1], 0) + 0.3, s => { s.seg = seg; });
    try { await v.play(); } catch (e) { /* measured as-is */ }
    for (let i = 0; i < segs.length; i++) {
      seg = i; v.playbackRate = segs[i][0];
      await S.sleep(segs[i][1] * 1000);
    }
    const samples = await pr;
    v.pause(); v.playbackRate = 1;
    for (const s of samples) all.push(s);
    return segs.map((sg, i) => {
      const part = all.filter(s => s.seg === i);
      const tail = part.filter(s => s.edt - (part[0] ? part[0].edt : 0) > 500);
      const f = S.linfit(tail.map(s => s.edt), tail.map(s => s.mt));
      const pres = L().presentation(part, fps);
      return { requested: sg[0], achieved: f ? +f.b.toFixed(5) : null, errorPpm: f ? S.r0((f.b - sg[0]) * 1e6) : null,
        frameEvents: pres.skips + pres.holds, seconds: sg[1] };
    });
  }

  // ------------------------------------------------------------ the servo run
  async function servoRun(stage, src, o) {
    const v = makeVideo(stage, src);
    await ready(v);
    await seekTo(v, 0);
    const fps = o.fps || 60, frameMs = 1000 / fps;
    const servo = new TK.Servo({ fps });
    const dur = (v.duration || 60) * 1000;
    const clock = o.clock || null;
    const clockNow = x => clock ? clock.now(x) : x;
    const clockRate = x => clock ? (clock.now(x + 1000) - clock.now(x)) / 1000 : 1;
    let anchorClock = null, anchorMedia = 0, runStart = null, settleUntil = 0, loops = 0, stepOn = false;
    const rows = [];
    let stop = false;
    const cb = (now, md) => {
      if (stop) return;
      const edt = md.expectedDisplayTime, mt = md.mediaTime * 1000;
      if (anchorClock === null) { anchorClock = clockNow(edt); anchorMedia = mt; runStart = edt; }
      const el = edt - runStart;
      if (!stepOn && o.stepAtS != null && el >= o.stepAtS * 1000) stepOn = true;
      let target = clockNow(edt) - anchorClock + anchorMedia + (stepOn ? o.stepMs : 0);
      if (target > dur - 800) {
        // loop the clip without disturbing the error: media and target wrap together
        const wrap = dur - 2000;
        anchorMedia -= wrap;
        target -= wrap;
        v.currentTime = Math.max(0, target / 1000);
        servo.reset();
        v.playbackRate = servo.rate = 1;
        settleUntil = edt + 1500; loops++;
        v.requestVideoFrameCallback(cb);
        return;
      }
      if (edt < settleUntil) {
        // frames from before the seek can still arrive — the servo does not act on them
        rows.push({ el, edt, mt, pf: md.presentedFrames, err: mt - target, errF: mt - target, rate: v.playbackRate, eng: false, settle: true });
        v.requestVideoFrameCallback(cb);
        return;
      }
      const cbNow = performance.now();
      const clockMs = o.continuous ? v.currentTime * 1000 + (edt - cbNow) * v.playbackRate : null;
      const out = servo.update({ mediaMs: mt, targetMs: target, nowMs: edt, targetRate: clockRate(edt), clockMs });
      if (out.action === 'rate') v.playbackRate = out.rate;
      rows.push({ el, edt, mt, pf: md.presentedFrames, err: out.err, errF: out.errF, rate: out.rate, eng: out.engaged, settle: edt < settleUntil });
      v.requestVideoFrameCallback(cb);
    };
    v.requestVideoFrameCallback(cb);
    try { await v.play(); } catch (e) { /* measured as-is */ }
    const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
    const tEnd = performance.now() + o.seconds * 1000;
    while (performance.now() < tEnd) {
      if (o.aborted && o.aborted()) break;
      if (o.hud) o.hud('T4 servo · ' + (clock ? 'room clock' : 'local clock') + ' — ' + Math.ceil((tEnd - performance.now()) / 1000) + ' s');
      await S.sleep(500);
    }
    stop = true;
    const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
    v.pause();
    v.removeAttribute('src'); v.load();

    // ---- analysis
    const half = frameMs / 2;
    const stepAtMs = o.stepAtS != null ? o.stepAtS * 1000 : null;
    // the step is CLOSED when, after the error has been seen outside the band,
    // it is back inside it; overshoot = how far it then swings the other way
    let closeAt = null, overshoot = 0, seenAt = null;
    if (stepAtMs != null) {
      for (const r of rows) {
        if (r.el < stepAtMs || r.settle) continue;
        if (seenAt === null) { if (Math.abs(r.errF) > half + 2) seenAt = r.el; continue; }
        if (closeAt === null && Math.abs(r.errF) <= half + 2) closeAt = r.el;
        if (closeAt !== null) overshoot = Math.max(overshoot, Math.sign(o.stepMs) * r.errF - half);
      }
    }
    const steady = rows.filter(r => !r.settle && r.el > 3000 && (stepAtMs == null || r.el < stepAtMs || (closeAt !== null && r.el > closeAt + 1000)));
    const absErr = S.sorted(steady.map(r => Math.abs(r.err)));
    const absErrF = S.sorted(steady.map(r => Math.abs(r.errF)));
    // frame events, split: the step's correction vs steady state
    let skipsSteady = 0, holdsSteady = 0, skipsStep = 0, holdsStep = 0;
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i];
      if (a.settle || b.settle) continue;
      const dmt = b.mt - a.mt, dedt = b.edt - a.edt;
      if (dmt <= 0 || dmt > 1000) continue;
      const nMedia = Math.max(1, Math.round(dmt / frameMs));
      const nShown = (a.pf != null && b.pf != null) ? Math.max(1, b.pf - a.pf) : 1;
      const sk = Math.max(0, nMedia - nShown);
      const hd = dedt > 1.5 * frameMs * nMedia ? 1 : 0;
      const inStep = stepAtMs != null && b.el >= stepAtMs && (closeAt === null || b.el <= closeAt + 1000);
      if (inStep) { skipsStep += sk; holdsStep += hd; } else { skipsSteady += sk; holdsSteady += hd; }
    }
    const steadyMin = steady.length ? (steady[steady.length - 1].el - steady[0].el) / 60000 : 0;
    return {
      clock: clock ? 'room (SyncClock, network)' : 'local (performance.now)', mode: servo.mode, seconds: o.seconds, loops,
      shownErrorMs: { p50: S.r1(S.pct(absErr, 50)), p95: S.r1(S.pct(absErr, 95)), max: S.r1(S.pct(absErr, 100)) },
      smoothedErrorMs: { p50: S.r1(S.pct(absErrF, 50)), p95: S.r1(S.pct(absErrF, 95)), max: S.r1(S.pct(absErrF, 100)) },
      halfFrameMs: S.r2(half),
      framePolicy: servo.policy,
      step: stepAtMs != null ? { injectedMs: o.stepMs, atS: o.stepAtS, closedAfterS: closeAt !== null ? S.r2((closeAt - stepAtMs) / 1000) : null,
        overshootMs: S.r2(overshoot), frameEvents: skipsStep + holdsStep, expectedFrameEvents: S.r1(Math.abs(o.stepMs) / frameMs) } : null,
      steady: { minutes: S.r2(steadyMin), skips: skipsSteady, holds: holdsSteady, frameEventsPerMin: S.r2((skipsSteady + holdsSteady) / Math.max(1e-9, steadyMin)) },
      servo: { rateChanges: servo.stats.rateChanges, episodes: servo.stats.episodes, engagedPct: S.r1(100 * servo.stats.engagedFrames / Math.max(1, servo.stats.frames)),
        learnedPlayerDriftPpm: S.r1(servo.motorPpm()), maxTrimPct: S.r2(100 * Math.max(0, ...rows.map(r => Math.abs(r.rate - 1)))) },
      decoder: q0 && q1 ? { frames: q1.totalVideoFrames - q0.totalVideoFrames, dropped: q1.droppedVideoFrames - q0.droppedVideoFrames } : null,
      trace: rows.filter((r, i) => i % 6 === 0).map(r => [S.r2(r.el / 1000), S.r1(r.err), S.r2(r.errF), S.r0((r.rate - 1) * 1e5) / 1e3]),
      traceColumns: ['t s', 'shown error ms', 'smoothed ms', 'rate − 1 (%)'],
    };
  }

  // ------------------------------------------------------------ T4
  async function runT4(opts, say) {
    const o = Object.assign({ quick: true }, opts || {});
    if (!L().hasRVFC) return { error: 'this browser has no requestVideoFrameCallback — the frame servo cannot see presented frames here (T4 needs Chrome 83+, Safari 15.4+, Firefox 132+)', rvfc: false };
    await L().loadAssets(say);
    const fps = L().assets().fps;
    const th = L().theater.open();
    let aborted = false;
    th.onExit = () => { aborted = true; };
    const out = { rvfc: true, fps };
    try {
      th.hud('T4 · seek test — exporter encode');
      out.seek = [await seekTest(th.stage, 'assets/clip.mp4', o.quick ? 8 : 20)];
      if (aborted) throw new Error('stopped by the user');
      th.hud('T4 · seek test — 1-second keyframes');
      out.seek.push(await seekTest(th.stage, 'assets/clip_g60.mp4', o.quick ? 8 : 20));
      if (aborted) throw new Error('stopped by the user');

      th.hud('T4 · free run — the player on its own');
      let v = makeVideo(th.stage, 'assets/clip_g60.mp4');
      await ready(v); await seekTo(v, 0);
      const pr = collect(v, o.quick ? 20 : 55);
      try { await v.play(); } catch (e) { /* measured as-is */ }
      const q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      const samples = await pr;
      const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      v.pause();
      out.freeRun = analyseFreeRun(samples, fps);
      if (q0 && q1) out.freeRun.decoder = { frames: q1.totalVideoFrames - q0.totalVideoFrames, dropped: q1.droppedVideoFrames - q0.droppedVideoFrames };
      if (aborted) throw new Error('stopped by the user');

      th.hud('T4 · rate response — 1.01× then 0.99×');
      out.rate = await rateTest(v, fps);
      v.removeAttribute('src'); v.load();
      if (aborted) throw new Error('stopped by the user');

      const continuous = out.freeRun.currentTime.continuous;
      out.servoLocal = await servoRun(th.stage, 'assets/clip_g60.mp4', { fps, seconds: o.quick ? 40 : 300, stepAtS: 10, stepMs: 80, continuous,
        hud: s => th.hud(s), aborted: () => aborted });
      if (aborted) throw new Error('stopped by the user');
      if (o.withNetwork) {
        const clock = await TK.clock.room.ensure();
        out.servoRoom = await servoRun(th.stage, 'assets/clip_g60.mp4', { fps, seconds: o.quick ? 40 : 300, stepAtS: 10, stepMs: 80, continuous, clock,
          hud: s => th.hud(s), aborted: () => aborted });
      }
    } finally {
      th.close();
    }
    return out;
  }

  TK.video = { runT4, seekTest, servoRun, analyseFreeRun };
})(typeof self !== 'undefined' ? self : this);
