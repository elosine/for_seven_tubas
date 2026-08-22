// gc.js — THE GC OBJECT, ported whole from piece #1 (string quartet,
// public/index.html: GCMaker.calculateTrajectory / renderGC / update) on
// day 23 at the composer's instruction: "when I say GC, that is the whole
// thing ... the same colors, the same lines, and line thickness, and then
// those trajectory ... the ball should be the same color, the same size."
// Piece #2's copy of the same three functions was diffed against piece #1's
// the same day: the drawn object is byte-identical (only page-section
// plumbing differs), so this one port serves both sources.
//
// ONE copy of the physics: render.js draws the static arc + impact marker
// from it, animobj.js moves the ball along it. Pure, dual-load.
//
// The object (piece #1's numbers, all in px at the 1080-high frame; a
// zoomed view scales them by view.heightPx / frameHeightPx so the PP-6
// magnification holds):
//   arc      polyline of 201 samples, stroke = the GC color, 1.5 px, no fill;
//            x is TIME (impact + Δt · pxPerSecond) — the ball travels along it
//   impact   circle r 4 px at (impactX, laneBottom − 5)
//   ball     circle r 5 px, same color, at (xOfSeconds(t), impactY − relY(t))
//   height   h = laneHeight − 10 (impact 5 px above the lane bottom, apex
//            5 px below the lane top — "visual height fills the track")
//   color    neonMagenta = rgb(255, 21, 160) (piece #1 ColorMap)
// Physics (piece #1, verbatim):
//   descentPower = 1 + ictus/1000·20   ascentPower = 1 + stiffness/50
//   rebound = damping/100              descentFraction = descentRatio/100
//   descent: relY = h·(1 − u^descentPower), u: 0→1 over duration·descentFraction
//   ascent:  relY = h·rebound·(1 − (1−u)^ascentPower), over the remainder
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationGC = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // piece #1's "Short" preset = BartokPizz_GC_20260309_112021 — the preset
  // every GC of its 6:10 section carries (43/43, verified day 23)
  const DEFAULT_PRESET = { stiffness: 62, damping: 100, ictus: 90, descentRatio: 60, duration: 0.6 };

  // piece #1's drawn look, verbatim (renderGC + update)
  const LOOK = {
    color: 'rgb(255, 21, 160)',
    arcStrokePx: 1.5,
    impactRadiusPx: 4,
    ballRadiusPx: 5,
    impactInsetPx: 5,     // impactY = trackBottom - 5
    heightInsetPx: 10,    // h = staffHeight - 10
    frameHeightPx: 1080,  // the px above are stated at this frame height
    samples: 100,         // per phase, as piece #1 (numSamples)
  };

  function params(preset) {
    const P = Object.assign({}, DEFAULT_PRESET, preset || {});
    const df = P.descentRatio / 100;
    return {
      descentPower: 1 + (P.ictus / 1000) * 20,
      ascentPower: 1 + P.stiffness / 50,
      rebound: P.damping / 100,
      pre: P.duration * df,          // timeFall
      post: P.duration * (1 - df),   // timeRise
      preset: P,
    };
  }

  // height fraction (0..1 of h) at Δt = t − impact; null outside the span
  function heightFrac(P, dt) {
    const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u);   // float edges → NaN guard
    if (dt < -P.pre - 1e-9 || dt > P.post + 1e-9) return null;
    if (dt <= 0) {
      const u = cl(P.pre > 0 ? (dt + P.pre) / P.pre : 1);
      return 1 - Math.pow(u, P.descentPower);
    }
    const u = cl(P.post > 0 ? dt / P.post : 1);
    return P.rebound * (1 - Math.pow(1 - u, P.ascentPower));
  }

  // the sampled polyline piece #1 draws: [{dt, frac}], descent 0..N then
  // ascent 1..N (201 points at samples = 100)
  function trajectory(P, samples) {
    const N = samples || LOOK.samples;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pts.push({ dt: -P.pre + u * P.pre, frac: 1 - Math.pow(u, P.descentPower), phase: 'descend' });
    }
    for (let i = 1; i <= N; i++) {
      const u = i / N;
      pts.push({ dt: u * P.post, frac: P.rebound * (1 - Math.pow(1 - u, P.ascentPower)), phase: 'ascend' });
    }
    return pts;
  }

  // lane geometry for a system, in px: the frame-scale factor, impact y,
  // and the drop height — piece #1's renderGC numbers
  function laneGeom(sys, view, look) {
    const L = Object.assign({}, LOOK, look || {});
    const k = view.heightPx / L.frameHeightPx;
    const impactY = sys.yBotPx - L.impactInsetPx * k;
    const h = sys.heightPx - L.heightInsetPx * k;
    return { k, impactY, h, look: L };
  }

  return { DEFAULT_PRESET, LOOK, params, heightFrac, trajectory, laneGeom };
});
