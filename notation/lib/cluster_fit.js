// cluster_fit.js — day 23: ONE implementation of "what tempo notates this
// cluster with the least complexity at acceptable accuracy". Used by
// tools/cluster_tempo.js (the analysis report) and tools/notate_section.js
// (--cluster, which draws the result). Two consumers, one algorithm — the
// report and the page can never disagree.
//
// THE MODEL (composer's question, day 23: "find the right tempo that will
// prevent us from using triple-nested tuplets"):
//   ACCURACY   max |onset − grid| must be within the tolerance (the ear's).
//   COMPLEXITY what the reader must do, scored:
//              · a subdivision that is a power of 2 costs nothing; anything
//                else is ONE tuplet level
//              · a grid finer than the playable floor (D43's 0.09 s) is a
//                fabricated pulse — the E1 false-positive, heavily penalised
//              · a beat outside a conductable range reads as no beat at all
//              · more grid positions than notes = more rests to read
// A single-unit grid can never produce NESTED tuplets: nesting needs a
// second, incommensurate grid. So the model answers the composer's worry by
// construction, and the remaining question is only tolerance vs tuplet size.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationClusterFit = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const DEFAULTS = {
    UMIN: 0.02, UMAX: 0.5, USTEP: 0.0002,
    PLAYABLE: 0.09,       // D43's playable-pulse floor
    BEAT_MIN: 0.5,        // below this the "beat" is really a subdivision
    BEAT_MAX: 1.5,
    TOL: 0.030,           // the ear's tolerance (E1's open epsilon)
  };

  const pow2 = m => m > 0 && (m & (m - 1)) === 0;

  // score a (unit, subdivision) pair — lower is better
  function score(u, m, ns, opt) {
    let sc = 0;
    if (u < opt.PLAYABLE) sc += 100;                 // fabricated pulse: disqualifying
    if (!pow2(m)) sc += 10;                          // one tuplet level
    if (m > 12) sc += 20;                            // a tuplet nobody reads
    const beat = u * m;
    if (beat < opt.BEAT_MIN) sc += 6;
    if (beat > opt.BEAT_MAX) sc += 4;
    const span = ns[ns.length - 1];
    sc += Math.max(0, span - (ns.length - 1)) * 0.25; // rests to read
    sc += span * 0.05;                               // long grids are harder
    return sc;
  }

  // exhaustive: every unit in the range, so "no fit" is a RESULT
  function fit(onsets, options) {
    const opt = Object.assign({}, DEFAULTS, options || {});
    if (!onsets || onsets.length < 2) return null;
    const anchor = onsets[0], rels = onsets.map(t => t - anchor);
    let best = null;
    for (let u = opt.UMIN; u <= opt.UMAX + 1e-9; u += opt.USTEP) {
      let maxErr = 0; const ns = [];
      for (const r of rels) {
        const n = Math.round(r / u); ns.push(n);
        const e = Math.abs(r - n * u); if (e > maxErr) maxErr = e;
      }
      if (maxErr > opt.TOL) continue;
      if (new Set(ns).size !== ns.length) continue;   // two notes on one grid point
      // the beat: double the unit until it is conductable
      let m = 1; while (u * m < opt.BEAT_MIN && m < 16) m *= 2;
      const sc = score(u, m, ns, opt);
      const cand = {
        unit: u, subdivision: m, beat: u * m, bpm: 60 / (u * m),
        maxErr, grid: ns, anchor, score: sc,
        beams: Math.max(1, Math.round(Math.log2(m))),   // m=4 -> 16ths -> 2 beams
        restDur: m * 4,                                  // m=4 -> 16th rests
        tuplet: pow2(m) ? null : m,
      };
      if (!best || sc < best.score - 1e-9 || (Math.abs(sc - best.score) < 1e-9 && maxErr < best.maxErr)) best = cand;
    }
    return best;
  }

  return { fit, score, DEFAULTS };
});
