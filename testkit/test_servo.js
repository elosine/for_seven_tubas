#!/usr/bin/env node
// test_servo.js — the frame servo, proven in simulation before any browser.
//
//   node testkit/test_servo.js
//
// A simulated player (its media clock runs at playbackRate × its own motor
// drift, rate changes land two vsyncs late), a simulated display (whole frames
// at vsync instants; a vsync with no new frame = a REPEAT, a frame never shown
// = a SKIP) and the piece clock the stand should follow.
//
// What is checked is what the composer asked about: does the servo hold the
// video to the clock WITHOUT making its own jitter? So the battery counts the
// frames the servo itself repeats or skips, and whether it hunts.
//
// `continuous: false` = a browser whose video.currentTime is frame-quantized:
// the drift-learning loop has nothing clean to learn from and stays off; the
// phase servo alone must still hold.

const Servo = require('./js/servo.js');

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function sim(o) {
  const R = mulberry32(o.seed || 3);
  const fps = 60, frameMs = 1000 / fps;
  const vsync = 1000 / (o.displayHz || 60);
  const servo = new Servo({ fps });
  const half = servo.half;
  const targetRate = 1 + (o.clockPpm || 0) * 1e-6;
  let m = (o.phase || 0) * frameMs + half;         // media clock (ms); leads by half a frame = the centred start
  let applied = 1;
  const queue = [];
  let lastFrame = o.nearest ? Math.floor(m / frameMs + 0.5) : Math.floor(m / frameMs);
  const res = { repeats: 0, skips: 0, late: 0, maxAbsErrFSettled: 0, afterStep: null, overshoot: 0, stepEpisodes: 0 };
  let episodesAtStep = null, closedAt = null;
  const end = o.seconds * 1000;
  for (let k = 1; k * vsync < end; k++) {
    const v = k * vsync;
    while (queue.length && queue[0][0] <= k) applied = queue.shift()[1];
    m += vsync * applied * (1 + (o.motorPpm || 0) * 1e-6);
    // the browser's frame choice for a vsync: the previous frame (floor) or the nearest (round)
    const frame = o.nearest ? Math.floor(m / frameMs + 0.5 + 1e-9) : Math.floor(m / frameMs + 1e-9);
    if (frame === lastFrame) { res.repeats++; if (v > 10000) res.late++; continue; }   // the display holds the old frame; no rVFC
    if (frame > lastFrame + 1) { res.skips += frame - lastFrame - 1; if (v > 10000) res.late += frame - lastFrame - 1; }
    lastFrame = frame;
    const stepOn = o.stepAtS != null && v >= o.stepAtS * 1000;
    if (stepOn && episodesAtStep === null) episodesAtStep = servo.stats.episodes;
    const target = v * targetRate + (stepOn ? o.stepMs : 0);
    const out = servo.update({
      mediaMs: frame * frameMs, targetMs: target, nowMs: v, targetRate,
      clockMs: o.continuous === false ? null : m + (R() - 0.5) * 1.0,
    });
    if (out.action === 'rate') queue.push([k + 2, out.rate]);
    if (v > end - 60000) { res.sumLast = (res.sumLast || 0) + out.err; res.nLast = (res.nLast || 0) + 1; }
    const a = Math.abs(out.errF);
    const settled = v > 5000 && (!stepOn || (closedAt !== null && v > closedAt + 1000));
    if (settled) res.maxAbsErrFSettled = Math.max(res.maxAbsErrFSettled, a);
    if (stepOn) {
      if (closedAt === null && a <= half + 2) { closedAt = v; res.afterStep = (v - o.stepAtS * 1000) / 1000; }
      if (closedAt !== null) res.overshoot = Math.max(res.overshoot, Math.sign(o.stepMs) * -out.errF - half);
    }
  }
  res.meanLastMin = res.nLast ? res.sumLast / res.nLast : 0;
  res.policy = servo.policy;
  res.stats = servo.stats;
  res.motorPpm = servo.motorPpm();
  if (episodesAtStep !== null) res.stepEpisodes = servo.stats.episodes - episodesAtStep;
  res.perMin = (res.repeats + res.skips) / (o.seconds / 60);
  return res;
}

const H = 500 / 60;   // half a frame, 8.33 ms
const scenarios = [
  { name: 'same clocks, phase 0.3 frame', seconds: 300, phase: 0.3,
    check: r => [['|err| ≤ half a frame + 3 ms', r.maxAbsErrFSettled <= H + 3], ['no frame events after settling', r.late === 0], ['no hunting (≤ 1 episode)', r.stats.episodes <= 1]] },
  { name: 'same clocks, phase 0.5 frame (the worst quantization)', seconds: 300, phase: 0.5,
    check: r => [['|err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3], ['no hunting (≤ 1 episode)', r.stats.episodes <= 1], ['no frame events after settling', r.late === 0]] },
  { name: 'a NEAREST-frame browser (Edge, measured) — the centring loop finds it', seconds: 120, phase: 0.3, nearest: true,
    check: r => [['|err| ≤ half + 3 ms after settling', r.maxAbsErrFSettled <= H + 3], ['no frame events after settling', r.late <= 1],
      ['shown error centred (|mean| ≤ 2 ms over the last minute)', Math.abs(r.meanLastMin) <= 2], ['policy detected: nearest', r.policy === 'nearest']] },
  { name: 'same clocks, quantized currentTime', seconds: 300, phase: 0.3, continuous: false,
    check: r => [['|err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3], ['no frame events after settling', r.late === 0]] },
  { name: 'player motor +300 ppm fast — drift learned', seconds: 300, phase: 0.2, motorPpm: 300,
    check: r => [['|err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3], ['FLL learned 300 ± 15 ppm', Math.abs(r.motorPpm - 300) <= 15],
      ['≤ 1 frame event after settling', r.late <= 1]] },
  { name: 'player motor +300 ppm, currentTime quantized (FLL off, PLL alone)', seconds: 300, phase: 0.2, motorPpm: 300, continuous: false,
    // 300 ppm = 18 ms/min of drift = ~1.1 frames/min that SOMETHING must absorb
    // until the slow quantized FLL (5-min window) has learned it
    // quantized observation sees a natural wrap only as a whole-frame jump, so its
    // smoothed error overshoots the engage point (half + 2) by the actuation lag
    check: r => [['|err| ≤ half + 4 ms (engage point + actuation lag)', r.maxAbsErrFSettled <= H + 4], ['frame events ≤ 2.5/min over 5 min', r.perMin <= 2.5]] },
  { name: 'piece clock 50 ppm vs the display (fed forward; ~1 inherent skip in 5 min)', seconds: 300, phase: 0.7, clockPpm: 50,
    check: r => [['|err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3], ['only the inherent skips (≤ 2), none undone', r.late <= 2 && r.repeats <= 1]] },
  { name: 'display 59.94 Hz, video 60 fps (skips are inherent: ~3.6/min)', seconds: 300, phase: 0.1, displayHz: 59.94,
    check: r => [['|err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3], ['skips ≈ the inherent 3.6/min, not more (≤ 4.2/min)', r.perMin <= 4.2],
      ['never undone by a repeat', r.repeats <= 1]] },
  { name: 'STEP +80 ms at 10 s (the deliberate wrong-clock case)', seconds: 60, phase: 0.3, stepAtS: 10, stepMs: 80,
    check: r => [['closes within 6 s', r.afterStep !== null && r.afterStep <= 6], ['no overshoot past the quantum (≤ 3 ms)', r.overshoot <= 3],
      ['one episode, no ringing', r.stepEpisodes === 1], ['settled |err| ≤ half + 3 ms', r.maxAbsErrFSettled <= H + 3],
      ['costs ≈ 80/16.7 ≈ 5 skipped frames, no more (≤ 6)', r.repeats + r.skips <= 6]] },
  { name: 'STEP −80 ms at 10 s', seconds: 60, phase: 0.6, stepAtS: 10, stepMs: -80,
    check: r => [['closes within 6 s', r.afterStep !== null && r.afterStep <= 6], ['no overshoot (≤ 3 ms)', r.overshoot <= 3], ['one episode', r.stepEpisodes === 1],
      ['≤ 6 frame events', r.repeats + r.skips <= 6]] },
];

let failed = 0;
console.log('test_servo — the frame servo in simulation (60 fps video; half a frame = ' + H.toFixed(2) + ' ms)\n');
for (const sc of scenarios) {
  const r = sim(sc);
  const checks = sc.check(r);
  const ok = checks.every(c => c[1]);
  if (!ok) failed++;
  console.log((ok ? 'PASS ' : 'FAIL ') + sc.name);
  console.log('     settled |errF| max ' + r.maxAbsErrFSettled.toFixed(2) + ' ms · repeats ' + r.repeats + ', skips ' + r.skips +
    ' (' + r.perMin.toFixed(2) + '/min; ' + r.late + ' after 10 s) · rate changes ' + r.stats.rateChanges + ' · episodes ' + r.stats.episodes +
    ' · learned motor ' + r.motorPpm.toFixed(0) + ' ppm · shown mean (last min) ' + r.meanLastMin.toFixed(2) + ' ms' +
    (r.afterStep !== null ? ' · closed in ' + r.afterStep.toFixed(2) + ' s, overshoot ' + r.overshoot.toFixed(2) + ' ms' : ''));
  for (const c of checks) if (!c[1]) console.log('     ✗ ' + c[0]);
}
console.log('\n' + (failed ? failed + ' scenario(s) FAILED' : 'all ' + scenarios.length + ' scenarios pass'));
process.exit(failed ? 1 : 0);
