// splice.js — Phase B6: cutting the strip into pages with the first three
// accommodation strategies (architecture §3):
//   · bars-prefer-chunk-boundaries — cuts land at chunk starts wherever
//     possible; the M5 chunk is the atom of the strip
//   · stamp-atomic — no glyph group is ever split: when a sub-beat chunk
//     must be interrupted, the cut snaps to ITS beat grid, and sub-beat
//     beams never cross a beat, so a beam group cannot straddle a cut
//   · page-edge-rules — behavior comes from notation/registry/
//     page_rules.json (RULES as data, P6), incl. re-showing a continuing
//     chunk's tempo label after the cut
// Matisse-cut material (staff lines, parachute bricks) clips at edges in
// the renderer — that strategy needed no code here, which is the point.
// Pure, dual-load.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationSplice = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const EPS = 1e-6;

  function interruptedChunks(ir, t) {
    return ir.chunks.filter(c => c.span[0] < t - EPS && t < c.span[1] - EPS);
  }

  // Snap t to the beat grid of chunk c (anchor + k·beat), clamped to [lo, hi].
  function snapToBeat(c, t, lo, hi) {
    const b = c.tempo.beatSeconds, a = c.tempo.anchorSeconds;
    const k = Math.round((t - a) / b);
    let s = a + k * b;
    if (s < lo) s = a + Math.ceil((lo - a) / b - EPS) * b;
    if (s > hi) s = a + Math.floor((hi - a) / b + EPS) * b;
    return (s > lo - EPS && s < hi + EPS) ? s : null;
  }

  function chooseCut(ir, target, lo, hi) {
    // candidates: every chunk edge in [lo, hi], plus the target itself
    const cands = new Set([target]);
    for (const c of ir.chunks) for (const e of c.span)
      if (e > lo + EPS && e < hi - EPS) cands.add(e);
    let best = null;
    for (const t of cands) {
      const cut = interruptedChunks(ir, t);
      const score = [cut.length, Math.abs(t - target)];
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1]))
        best = { t, score, cut };
    }
    let { t, cut } = best;
    let kind = cut.length === 0 ? 'clean' : 'interrupting';
    // stamp-atomic: an interrupted sub-beat chunk forces a snap to ITS grid
    const subBeat = cut.filter(c => c.tempo && c.tempo.subdivision >= 2);
    if (subBeat.length) {
      const s = snapToBeat(subBeat[0], t, lo, hi);
      if (s !== null) { t = s; kind = 'beat-snapped'; cut = interruptedChunks(ir, t); }
    }
    return { t, kind, interrupted: cut.map(c => c.id) };
  }

  function planPages(ir, rules, pageSeconds) {
    const [w0, w1] = ir.source.window;
    const slack = rules.cutSlackSeconds, minPage = rules.minPageSeconds;
    const pages = [];
    let t = w0;
    while (t < w1 - EPS) {
      const target = t + pageSeconds;
      let cut, kind = 'end', interrupted = [];
      if (target >= w1 - minPage) cut = w1;
      else {
        const lo = Math.max(t + minPage, target - slack);
        const hi = Math.min(w1 - minPage, target + slack);
        const r = chooseCut(ir, target, lo, hi);
        cut = r.t; kind = r.kind; interrupted = r.interrupted;
      }
      // continuation labels: chunks with tempo that continue ACROSS the page start
      const reshow = [];
      for (const c of ir.chunks) {
        if (c.tempo && c.span[0] < t - EPS && t < c.span[1] - EPS)
          reshow.push({ part: c.part, text: rules.continuationPrefix + c.tempo.label });
      }
      pages.push({ t0: t, t1: cut, kind, interrupted, reshow });
      t = cut;
    }
    return pages;
  }

  return { planPages, chooseCut, interruptedChunks, snapToBeat };
});
