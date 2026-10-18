#!/usr/bin/env node
// test_syncclock.js — the floor rule, proven in simulation before any browser.
//
//   node testkit/test_syncclock.js          run the battery (exit 1 on any failure)
//   node testkit/test_syncclock.js -v       also print each scenario's decision log
//
// A simulated server, a simulated stand whose crystal drifts, a noisy network
// with delayed packets — and the four lies the composer asked about ("if one
// machine's network is wildly out of sync with the others, it doesn't compound
// the problem"). Each scenario runs 20–30 simulated minutes, pinging every 2 s.
//
// The error measured is what matters on stage: the stand's room clock minus the
// TRUE server time, at every ping. The naive column is what a plain min-RTT
// sync (no gates) would have done with the same samples.
//
// The bounds are the brief's claims, not tuned to the results:
//   normal night ±5–15 ms · the floor rule: a lie is refused or bounded ·
//   calibration closes the slow-lie door · network loss after calibration holds.

const SyncClock = require('./js/syncclock.js');
const VERBOSE = process.argv.includes('-v');

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// lies, as the server would tell them (ms added to its stamp)
const LIES = {
  bias: () => 250,
  jitter: (R) => (R() * 2 - 1) * 120,
  drift: (R, since) => since * 1000e-6,     // 1000 ppm: 60 ms per minute
  subtle: (R, since) => since * 80e-6,      // 80 ppm: 4.8 ms per minute — a clock could do this
};

// THE MEASURED NETWORKS (the stands, 2026-10-18 — RUNNING_LOG 75). The first
// battery ran only on `tidy`, and real Wi-Fi exposed three faults it never
// could. Each returns the two one-way delays of one ping (ms).
const NETS = {
  tidy: R => { const leg = () => 1.5 + R() * 1.0 + (-Math.log(1 - R())) * 0.8 + (R() < 0.05 ? 20 + R() * 60 : 0); return [leg(), leg()]; },
  // laptop on home Wi-Fi: fast, but about 1 packet in 8 is held 20–120 ms on one leg (measured: median 6, p95 118)
  laptop: R => { const leg = () => 1.4 + (-Math.log(1 - R())) * 0.5 + (R() < 0.12 ? 20 + R() * 100 : 0); return [leg(), leg()]; },
  // iPad: slow but STEADY — a power-save hold on both legs most of the time, so
  // the round trip is long while the offset barely moves (measured: min 7,
  // median 17, p95 18; the plain filter's offset scatter 0.6 ms)
  ipad: R => { const ps = R() < 0.92 ? 5 : 0; const leg = () => 3.4 + ps + (R() - 0.5) * 0.6 + (R() < 0.01 ? 50 + R() * 250 : 0); return [leg(), leg()]; },
  // Fire on poor Wi-Fi: each leg delayed independently — asymmetric and heavy-tailed (measured: median 69, p95 134)
  fire: R => { const leg = () => 5 + (-Math.log(1 - R())) * 25 + (R() < 0.05 ? 50 + R() * 100 : 0); return [leg(), leg()]; },
};

function run(sc) {
  const R = mulberry32(sc.seed || 7);
  const drift = (sc.driftPpm || 0) * 1e-6;
  const Loff = 123456.7;
  const L = tt => Loff + tt * (1 + drift);                  // the stand's clock at true time tt
  const net = NETS[sc.net || 'tidy'];
  const lies = sc.lies || (sc.lie ? [sc.lie] : []);
  const lieAt = (S) => {
    for (const lie of lies) {
      const a = lie.fromMin * 60000, b = lie.toMin * 60000;
      if (S >= a && S < b) return LIES[lie.mode](R, S - a);
    }
    return 0;
  };
  const ping = tt => {
    const [d1, d2] = net(R);
    const Strue = tt + d1;
    return { Ls: L(tt), S: Strue + lieAt(Strue), Lr: L(tt + d1 + d2) };
  };
  const clock = new SyncClock(Object.assign({ posture: sc.posture || 'performance' }, sc.opts || {}));
  const burst = [];
  for (let i = 0; i < 8; i++) burst.push(ping(i * 100));
  clock.lock(burst);

  const naiveWin = [];
  const res = { name: sc.name, errMax: 0, errMaxIn: {}, naiveMax: 0, naiveMaxIn: {}, cal: null };
  const inWin = (tt, w) => w && tt >= w[0] * 60000 && tt < w[1] * 60000;
  let tt = 1000;
  const end = sc.minutes * 60000;
  let calibrated = false;
  while (tt < end) {
    tt += 2000;
    const lost = inWin(tt, sc.loss);
    if (!lost) {
      const x = ping(tt);
      clock.ingest(x);
      naiveWin.push({ rtt: x.Lr - x.Ls, off: x.S - (x.Ls + x.Lr) / 2 });
      if (naiveWin.length > 8) naiveWin.shift();
    }
    if (sc.calibrateAtMin != null && !calibrated && tt >= sc.calibrateAtMin * 60000) {
      res.cal = clock.calibrate(L(tt));
      calibrated = true;
    }
    if (tt < 30000) continue;                              // settle after lock
    const err = clock.now(L(tt)) - tt;
    const best = naiveWin.slice().sort((a, b) => a.rtt - b.rtt)[0];
    const nErr = best ? (L(tt) + best.off) - tt : 0;
    res.errMax = Math.max(res.errMax, Math.abs(err));
    res.naiveMax = Math.max(res.naiveMax, Math.abs(nErr));
    for (const [k, w] of Object.entries(sc.windows || {})) {
      if (inWin(tt, w)) {
        res.errMaxIn[k] = Math.max(res.errMaxIn[k] || 0, Math.abs(err));
        res.naiveMaxIn[k] = Math.max(res.naiveMaxIn[k] || 0, Math.abs(nErr));
      }
    }
    res.errEnd = err;
  }
  res.status = clock.status(L(tt));
  res.log = clock.log;
  return res;
}

// During a REFUSED lie the stand runs on its own clock — the floor. So the
// honest bound there is the free-run error: crystal drift × duration (+ 4 ms of
// lock noise). Calibrated, the floor itself is tight — that is B3(i)'s claim.
const freeRun = (ppm, minutes) => ppm * 1e-6 * minutes * 60000 + 4;
const scenarios = [
  { name: 'same clock, clean network', minutes: 20, driftPpm: 0,
    check: r => [['room-clock error ≤ 3 ms', r.errMax <= 3]] },
  { name: 'drift 40 ppm, uncalibrated', minutes: 20, driftPpm: 40,
    check: r => [['error ≤ 6 ms all run (phase-only discipline)', r.errMax <= 6], ['corrections happened', r.status.count.corrections > 0]] },
  { name: 'drift 40 ppm, calibrate at 10 min', minutes: 25, driftPpm: 40, calibrateAtMin: 10,
    windows: { after: [12, 25] },
    check: r => [['measured +40 ± 3 ppm (fast)', r.cal && Math.abs(r.cal.clockPpm - 40) <= 3], ['error ≤ 4 ms after calibration', r.errMaxIn.after <= 4]] },

  { name: 'LIE bias +250 ms (min 8–13), uncalibrated 25 ppm', minutes: 20, driftPpm: 25, lie: { mode: 'bias', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['naive follows the lie (≥ 200 ms)', r.naiveMaxIn.lie >= 200], ['floor: error ≤ free-run (' + freeRun(25, 5).toFixed(1) + ' ms)', r.errMaxIn.lie <= freeRun(25, 5)],
      ['error ≤ 6 ms a minute after it ends', r.errMaxIn.after <= 6]] },
  { name: 'LIE bias +250 ms, calibrated', minutes: 20, driftPpm: 25, calibrateAtMin: 7, lie: { mode: 'bias', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['naive follows (≥ 200 ms)', r.naiveMaxIn.lie >= 200], ['floor holds ≤ 4 ms', r.errMaxIn.lie <= 4], ['≤ 4 ms after', r.errMaxIn.after <= 4]] },
  { name: 'LIE jitter ±120 ms (min 8–13), uncalibrated 25 ppm', minutes: 20, driftPpm: 25, lie: { mode: 'jitter', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['naive thrashes (≥ 60 ms)', r.naiveMaxIn.lie >= 60], ['floor: error ≤ free-run (' + freeRun(25, 5).toFixed(1) + ' ms)', r.errMaxIn.lie <= freeRun(25, 5)],
      ['error ≤ 6 ms a minute after', r.errMaxIn.after <= 6]] },
  { name: 'LIE jitter ±120 ms, calibrated', minutes: 20, driftPpm: 25, calibrateAtMin: 7, lie: { mode: 'jitter', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['floor holds ≤ 4 ms', r.errMaxIn.lie <= 4], ['≤ 4 ms after', r.errMaxIn.after <= 4]] },
  { name: 'LIE drift 1000 ppm (min 8–13), uncalibrated 25 ppm', minutes: 20, driftPpm: 25, lie: { mode: 'drift', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['naive follows (≥ 250 ms by the end)', r.naiveMaxIn.lie >= 250], ['floor: error ≤ free-run (' + freeRun(25, 5).toFixed(1) + ' ms)', r.errMaxIn.lie <= freeRun(25, 5)],
      ['tripped', r.status.count.trips >= 1], ['error ≤ 6 ms a minute after', r.errMaxIn.after <= 6]] },
  { name: 'LIE drift 1000 ppm, calibrated', minutes: 20, driftPpm: 25, calibrateAtMin: 7, lie: { mode: 'drift', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13], after: [14, 20] },
    check: r => [['floor holds ≤ 4 ms', r.errMaxIn.lie <= 4], ['≤ 4 ms after', r.errMaxIn.after <= 4]] },
  { name: 'LIE subtle 80 ppm, uncalibrated (the known residual)', minutes: 20, driftPpm: 25, lie: { mode: 'subtle', fromMin: 8, toMin: 13 },
    windows: { lie: [8, 13] },
    // a lie at clock-like rates is indistinguishable before calibration —
    // bounded by physics: at most 80 ppm × 5 min = 24 ms
    check: r => [['accepted but bounded (≤ 30 ms)', r.errMaxIn.lie <= 30]] },
  { name: 'LIE subtle 80 ppm, AFTER calibration', minutes: 25, driftPpm: 25, calibrateAtMin: 8, lie: { mode: 'subtle', fromMin: 12, toMin: 18 },
    windows: { lie: [12, 18], after: [19, 25] },
    check: r => [['calibration closes the door: error ≤ 8 ms', r.errMaxIn.lie <= 8], ['tripped', r.status.count.trips >= 1],
      ['≤ 4 ms a minute after', r.errMaxIn.after <= 4]] },
  { name: 'network LOST 10 min, drift 40 ppm, uncalibrated', minutes: 25, driftPpm: 40, loss: [10, 20],
    windows: { lost: [10, 20] },
    check: r => [['free-run drifts as the crystal does (≈ 24 ms)', r.errMaxIn.lost >= 15 && r.errMaxIn.lost <= freeRun(40, 10)]] },
  { name: 'network LOST 10 min, drift 40 ppm, calibrated', minutes: 25, driftPpm: 40, calibrateAtMin: 9, loss: [10, 20],
    windows: { lost: [10, 20] },
    check: r => [['calibrated free-run holds ≤ 4 ms', r.errMaxIn.lost <= 4]] },
  { name: 'REHEARSAL posture, bias lie — re-locks (follows the room)', minutes: 15, driftPpm: 25, posture: 'rehearsal',
    lie: { mode: 'bias', fromMin: 5, toMin: 15 },
    check: r => [['re-locked once', r.status.count.relocks === 1], ['now follows the network (≈ 250 ms)', Math.abs(r.errEnd - 250) <= 6]] },
  { name: 'PERFORMANCE posture, same lie, calibrated — never re-locks', minutes: 15, driftPpm: 25, posture: 'performance', calibrateAtMin: 4,
    lie: { mode: 'bias', fromMin: 5, toMin: 15 },
    check: r => [['no re-lock', r.status.count.relocks === 0], ['holds the local clock (≤ 4 ms)', Math.abs(r.errEnd) <= 4]] },
];

// THE T3 FULL RUN, as the iPad ran it: an 8-minute honest baseline, calibrate,
// then the four lies with honest recoveries between. Honest windows start 18 s
// after a lie ends (the plain filter's 8-sample window still holds lies until then).
const T3FULL = {
  minutes: 16.25, calibrateAtMin: 8,
  lies: [{ mode: 'bias', fromMin: 8, toMin: 9 }, { mode: 'jitter', fromMin: 9.75, toMin: 10.75 },
    { mode: 'drift', fromMin: 11.5, toMin: 12.5 }, { mode: 'subtle', fromMin: 13.25, toMin: 15.25 }],
  windows: { h1: [4, 8], bias: [8, 9], h2: [9.3, 9.75], jitter: [9.75, 10.75], h3: [11.05, 11.5], drift: [11.5, 12.5],
    h4: [12.8, 13.25], subtle: [13.25, 15.25], h5: [15.55, 16.25] },
};
const honestMax = (r, which) => Math.max(...['h1', 'h2', 'h3', 'h4', 'h5'].map(k => (which === 'plain' ? r.naiveMaxIn[k] : r.errMaxIn[k]) || 0));
// the standard is the composer's own floor rule: while the network is honest the
// floor clock must be no worse than plain sync (+1 ms); while it lies, it holds
function realistic(net, driftPpm, b) {
  return Object.assign({ name: 'REAL Wi-Fi: ' + net + ' (' + driftPpm + ' ppm) — the T3 full run', net, driftPpm }, T3FULL, {
    check: r => {
      const fh = honestMax(r, 'floor'), nh = honestMax(r, 'plain');
      return [
        b.mayRefuse
          ? ['calibration refused as too uncertain — or right within max(' + b.cal + ' ppm, 3σ)', !r.cal || !!r.cal.refused || Math.abs(r.cal.clockPpm - driftPpm) <= Math.max(b.cal, 3 * r.cal.sigmaPpm)]
          : ['calibrated within ' + b.cal + ' ppm', !!(r.cal && !r.cal.refused && Math.abs(r.cal.clockPpm - driftPpm) <= b.cal)],
        ['honest: floor ≤ max(' + b.floor + ', plain + 1) — floor ' + fh.toFixed(1) + ', plain ' + nh.toFixed(1) + ' ms', fh <= Math.max(b.floor, nh + 1)],
        ['bias / jitter / drift lies: floor ≤ ' + b.lie + ' ms', ['bias', 'jitter', 'drift'].every(k => r.errMaxIn[k] <= b.lie)],
        ['the subtle lie after calibration: floor ≤ ' + b.subtle + ' ms', r.errMaxIn.subtle <= b.subtle],
      ];
    },
  });
}
scenarios.push(
  realistic('ipad', 28, { cal: 2, floor: 2.5, lie: 4, subtle: 6 }),
  realistic('laptop', -14, { cal: 3, floor: 2.5, lie: 4, subtle: 6 }),
  // poor Wi-Fi: an honest calibration may be refused — the stand then runs uncalibrated
  realistic('fire', 40, { cal: 5, floor: 6, lie: 10, subtle: 12, mayRefuse: true }),
  { name: 'REAL Wi-Fi: fire — a 100-s baseline (the quick run): calibration refused, or right', net: 'fire', driftPpm: 40, minutes: 6, calibrateAtMin: 1.67,
    windows: { after: [2.5, 6] },
    check: r => [['refused — or certain (σ ≤ 5 ppm) AND right (within 5 ppm)', !r.cal || !!r.cal.refused || (r.cal.sigmaPpm <= 5 && Math.abs(r.cal.clockPpm - 40) <= 5)],
      ['honest afterwards: floor ≤ plain + 2 ms', r.errMaxIn.after <= (r.naiveMaxIn.after || 0) + 2]] },
);

let failed = 0;
console.log('test_syncclock — the floor rule in simulation (ping every 2 s; errors are room clock − true server time)\n');
for (const sc of scenarios) {
  const r = run(sc);
  const checks = sc.check(r);
  const ok = checks.every(c => c[1]);
  if (!ok) failed++;
  const rf = r.status.refuse, ct = r.status.count;
  console.log((ok ? 'PASS ' : 'FAIL ') + sc.name);
  console.log('     error max ' + r.errMax.toFixed(1) + ' ms' +
    Object.keys(r.errMaxIn).map(k => ' · ' + k + ' ' + r.errMaxIn[k].toFixed(1) + ' (naive ' + r.naiveMaxIn[k].toFixed(1) + ')').join('') +
    ' · naive max ' + r.naiveMax.toFixed(1) + ' ms' + (r.cal ? ' · calibrat' + (r.cal.refused ? 'ion REFUSED (' + r.cal.reason + ')' : 'ed') + ' ' + (r.cal.clockPpm != null ? r.cal.clockPpm.toFixed(1) : '?') + ' ± ' + r.cal.sigmaPpm.toFixed(1) + ' ppm' : ''));
  console.log('     corrections ' + ct.corrections + ' (' + ct.correctedMs.toFixed(1) + ' ms) · refused: jump ' + rf.jump + ', rate ' + rf.rate +
    ', holdover ' + rf.holdover + ', spike ' + rf.spike + ', clamp ' + rf.clamp + ' · trips ' + ct.trips + ' · relocks ' + ct.relocks);
  for (const c of checks) if (!c[1]) console.log('     ✗ ' + c[0]);
  if (VERBOSE || !ok) for (const e of r.log.filter(e => e.kind !== 'correct').slice(0, 12)) console.log('       [' + (e.L / 60000).toFixed(2) + ' min] ' + e.kind + ': ' + e.msg);
}
console.log('\n' + (failed ? failed + ' scenario(s) FAILED' : 'all ' + scenarios.length + ' scenarios pass'));
process.exit(failed ? 1 : 0);
