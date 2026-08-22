// splice.js — Phase B6 (+ phase-review fixes): cutting the strip into pages
// with the first three accommodation strategies (architecture §3):
//   · bars-prefer-chunk-boundaries — cuts land at chunk starts wherever
//     possible; the M5 chunk is the atom of the strip
//   · stamp-atomic — no beam group may straddle a cut. Candidates are
//     scored against the BEAMABLE PAIRS of every interrupted sub-beat
//     chunk (all parts, not just the first — review finding): if any
//     candidate in the slack window severs zero pairs, one is chosen.
//     Any sub-beat chunk still left off its grid is RECORDED on the page
//     (offGrid) so a renderer can mark it, never silently.
//   · page-edge-rules — behavior from notation/registry/page_rules.json
//     (RULES as data, P6), incl. re-showing a continuing chunk's tempo
//     label after the cut.
// Interruption and continuation are judged by a chunk's MATERIAL extent
// (last member onset), not its span — spans run to the next chunk's start
// by convention and overstate the material by seconds (review finding:
// dead-span "(cont.)" labels on parts with nothing to play).
// Pure, dual-load.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationSplice = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const EPS = 1e-6;

  // material extent per chunk: [firstOnset, lastOnset] of member events
  function materialExtents(ir) {
    const on = new Map(ir.events.map(e => [e.id, e.onset]));
    const m = new Map();
    for (const c of ir.chunks) {
      const ts = c.events.map(id => on.get(id)).filter(t => t !== undefined);
      m.set(c.id, ts.length ? [Math.min(...ts), Math.max(...ts)] : [c.span[0], c.span[0]]);
    }
    return m;
  }

  function interruptedChunks(ir, ext, t) {
    return ir.chunks.filter(c => {
      const e = ext.get(c.id);
      return e[0] < t - EPS && t < e[1] - EPS;
    });
  }

  // beamable pairs of a sub-beat chunk: beat-adjacent grid neighbors
  // (exactly what layout beams); returns [t0, t1] onset pairs.
  function beamablePairs(ir, chunk) {
    const t = chunk.tempo;
    if (!t || t.subdivision < 2) return [];
    const evs = ir.events.filter(e => e.metric && e.metric.chunk === chunk.id)
      .sort((a, b) => a.metric.grid[0] - b.metric.grid[0]);
    const out = [];
    for (let i = 1; i < evs.length; i++) {
      const a = evs[i - 1].metric.grid[0], b = evs[i].metric.grid[0];
      if (b === a + 1 && Math.floor(a / t.subdivision) === Math.floor(b / t.subdivision))
        out.push([evs[i - 1].onset, evs[i].onset]);
    }
    return out;
  }

  function severedPairs(pairs, t) {
    return pairs.filter(p => p[0] < t - EPS && t < p[1] - EPS).length;
  }

  function offGridChunks(interrupted, t) {
    return interrupted.filter(c => {
      if (!c.tempo || c.tempo.subdivision < 2) return false;
      const b = c.tempo.beatSeconds, a = c.tempo.anchorSeconds;
      const k = (t - a) / b;
      return Math.abs(k - Math.round(k)) > 1e-6;
    }).map(c => c.id);
  }

  function chooseCut(ir, ext, allPairs, target, lo, hi) {
    // candidates: chunk material edges and every interrupted sub-beat
    // chunk's beat slots in [lo, hi], plus the target clamped INTO bounds
    // (an out-of-bounds target used to leak sub-minimum pages — review)
    const cands = new Set([Math.min(hi, Math.max(lo, target))]);
    for (const c of ir.chunks) for (const e of ext.get(c.id))
      if (e > lo + EPS && e < hi - EPS) cands.add(e);
    for (const c of interruptedChunks(ir, ext, Math.min(hi, Math.max(lo, target)))) {
      if (!c.tempo || c.tempo.subdivision < 2) continue;
      const b = c.tempo.beatSeconds, a = c.tempo.anchorSeconds;
      for (let k = Math.ceil((lo - a) / b); a + k * b <= hi + EPS; k++) {
        const s = a + k * b;
        if (s > lo - EPS) cands.add(s);
      }
    }
    let best = null;
    for (const t of cands) {
      const cut = interruptedChunks(ir, ext, t);
      let severed = 0;
      for (const c of cut) severed += severedPairs(allPairs.get(c.id) || [], t);
      const score = [severed, cut.length, Math.abs(t - target)];
      const better = !best || score[0] < best.score[0] ||
        (score[0] === best.score[0] && (score[1] < best.score[1] ||
          (score[1] === best.score[1] && score[2] < best.score[2])));
      if (better) best = { t, score, cut };
    }
    const { t, cut, score } = best;
    const offGrid = offGridChunks(cut, t);
    const kind = cut.length === 0 ? 'clean' : (offGrid.length < cut.filter(c => c.tempo && c.tempo.subdivision >= 2).length || score[0] === 0) && cut.some(c => c.tempo && c.tempo.subdivision >= 2) ? 'beat-snapped' : 'interrupting';
    return { t, kind, interrupted: cut.map(c => c.id), offGrid, severed: score[0] };
  }

  function planPages(ir, rules, pageSeconds) {
    if (!(isFinite(pageSeconds) && pageSeconds > 0)) throw new Error('splice: pageSeconds must be a finite number > 0');
    const [w0, w1] = ir.source.window;
    const slack = rules.cutSlackSeconds, minPage = rules.minPageSeconds;
    const ext = materialExtents(ir);
    const allPairs = new Map(ir.chunks.map(c => [c.id, beamablePairs(ir, c)]));
    const wantReshow = !rules.reshowAtCut || rules.reshowAtCut.includes('tempoLabelContinuation');
    const pages = [];
    let t = w0;
    let guard = 0;
    while (t < w1 - EPS) {
      if (++guard > 10000) throw new Error('splice: page planning did not converge');
      const target = t + pageSeconds;
      let cut, kind = 'end', interrupted = [], offGrid = [], severed = 0;
      if (target >= w1 - minPage) cut = w1;
      else {
        const lo = Math.max(t + minPage, target - slack);
        // NEVER LATER THAN THE PAGE END (day 24): the video page draws a
        // CONSTANT window [t0, t0 + pageSeconds] (day 22), so a cut chosen
        // past that edge leaves material on NO page — T2 32.0-33.1 vanished
        // between page 4 (shown to 32.0) and page 5 (starting 33.1). The slack
        // now reaches only backwards; an early cut merely overlaps the next
        // page, which loses nothing.
        const hi = Math.max(lo, Math.min(w1 - minPage, target));   // >= lo keeps the minPage guarantee when pageSeconds < minPage
        const r = chooseCut(ir, ext, allPairs, target, lo, hi);
        cut = r.t; kind = r.kind; interrupted = r.interrupted; offGrid = r.offGrid; severed = r.severed;
      }
      if (!(cut > t + EPS)) throw new Error('splice: cut did not advance past ' + t);
      const reshow = [];
      if (wantReshow) for (const c of ir.chunks) {
        const e = ext.get(c.id);
        if (c.tempo && e[0] < t - EPS && t < e[1] - EPS)
          reshow.push({ part: c.part, text: rules.continuationPrefix + c.tempo.label });
      }
      pages.push({ t0: t, t1: cut, kind, interrupted, offGrid, severed, reshow });
      t = cut;
    }
    return pages;
  }

  return { planPages, chooseCut, interruptedChunks, materialExtents, beamablePairs };
});
