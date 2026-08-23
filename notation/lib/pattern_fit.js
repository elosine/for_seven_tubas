// pattern_fit.js — D63, PATTERN BEFORE GRID (day 24, the composer's first
// principles). The proportional page already guarantees timing: every head's
// left edge sits on its true moment. So the written rhythm inside a cluster
// has ONE job — show the figure's long-short PATTERN so it is played as one
// unit from one go — and the right notation is the one whose implied
// positions are closest to where the eye already sees the heads.
//
// THE OBJECTIVE: for a candidate writing, place every note where the
// notation IMPLIES it (grid position × unit, tuplet slots included) and
// measure the worst gap from its true onset — in NOTEHEADS at page scale
// (registry: one cluster head = 6.9 px = 30 ms on the video page; scales
// with the view). Under one head the eye reads the writing as true; over
// one head it is the cognitive dissonance the composer named ("four equal
// 16ths over medium-short-long spacing"). Calibrated on the composer's own
// verdicts: T8 31.76 at 0.2 heads = coherent, T1's last figure as even
// 16ths at 2.1 heads = dissonant.
//
// SIMPLICITY BREAKS TIES, never overrides: among writings under one head,
// fewest tuplet beats, then fewest empty slots, then finest fidelity. A
// tuplet that brings a figure under a head beats a plain grid that does not.
// The 30 ms tolerance of cluster_fit survives INVERTED — as the guard against
// claiming a shape the spacing does not show (T7's 24 ms tell).
//
// THE CANDIDATE SPACE: the played head is a 16th (the composer: 8ths too
// long, 32nds too short), so the unit IS a 16th and a beat is four of them.
// Within a beat, a note may sit on the plain 16th grid or on ONE tuplet
// subdivision of that beat — 3, 5, 6 or 7 equal slots (triplet 8ths,
// quintuplet, triplet 16ths, septuplet). Each beat chooses independently;
// the tuplet cost is per beat. Units sweep 80–400 ms in 1 ms steps.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationPatternFit = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const DEFAULTS = {
    // THE 16TH IS A REAL 16TH: unit 125-375 ms = a beat of 0.5-1.5 s, the
    // conductable range (cluster_fit's BEAT_MIN/MAX, and every figure the
    // composer has chosen sits at 134-229 ms). Below 125 ms the "16th" is a
    // 32nd in disguise — the first draft halved T1's unit to 88 ms to shave
    // 5 ms and called the result 16ths.
    UMIN: 0.125, UMAX: 0.375, USTEP: 0.001,
    SUB: 4,                       // 16ths per beat: the played head is a 16th
    TUPLETS: [3, 5, 6, 7],        // equal slots per beat a tuplet may offer
    HEAD_SECONDS: 0.030,          // one notehead at the video page scale
    PX_PER_SECOND: 232, HEAD_PX: 6.9,
    MAX_HEADS: 1.0,               // the dissonance line
  };

  // where the notation puts note i: beat index + slot within the beat,
  // on either the plain grid or the beat's tuplet
  function placeInBeat(relBeats, tupN, sub) {
    // relBeats: position in beats (float). returns {beat, slot, n, pos}
    const beat = Math.floor(relBeats + 1e-9);
    const frac = relBeats - beat;
    const n = tupN || sub;
    const slot = Math.round(frac * n);
    // a slot at n wraps to the next beat's 0
    if (slot >= n) return { beat: beat + 1, slot: 0, n, pos: beat + 1 };
    return { beat, slot, n, pos: beat + slot / n };
  }

  function fit(onsets, options) {
    const opt = Object.assign({}, DEFAULTS, options || {});
    if (!onsets || onsets.length < 2) return null;
    const anchor = onsets[0];
    const rels = onsets.map(t => t - anchor);
    const headS = opt.HEAD_SECONDS;
    const cands = [];
    for (let u = opt.UMIN; u <= opt.UMAX + 1e-9; u += opt.USTEP) {
      const beat = u * opt.SUB;
      const relBeats = rels.map(r => r / beat);
      // group notes by beat index (floor), decide each beat's subdivision
      const byBeat = new Map();
      relBeats.forEach((rb, i) => { const b = Math.floor(rb + 1e-9); if (!byBeat.has(b)) byBeat.set(b, []); byBeat.get(b).push(i); });
      const placement = new Array(rels.length);
      let tupBeats = 0, worst = 0, ok = true;
      const beatChoice = new Map();
      for (const [b, idxs] of byBeat) {
        // try plain, then each tuplet; keep the one with the smallest worst error in this beat
        // PLAIN WINS WHEN IT IS UNDER A HEAD. A tuplet is admitted only where
        // the plain grid fails the eye in THIS beat — then the simplest tuplet
        // that passes (3 before 5 before 6 before 7), else the least error.
        // (The first draft adopted a tuplet whenever it shaved a few ms, which
        // put a quintuplet on T2's figure that plain 16ths already wrote.)
        const TUPCOST = { 3: 1, 5: 1.5, 6: 1.25, 7: 2 };
        const lim = headS * opt.MAX_HEADS;
        let best = null;
        const tryN = n => {
          const pl = idxs.map(i => placeInBeat(relBeats[i], n, opt.SUB));
          const keys = new Set(pl.map(p => p.beat + ':' + p.slot + ':' + p.n));
          if (keys.size !== pl.length) return null;
          const w = Math.max(...idxs.map((i, k) => Math.abs(pl[k].pos * beat - rels[i])));
          return { n, pl, w, cost: n ? TUPCOST[n] : 0 };
        };
        const plain = tryN(null);
        if (plain && plain.w <= lim) best = plain;
        else {
          for (const n of opt.TUPLETS) { const c = tryN(n); if (c && c.w <= lim) { best = c; break; } }
          if (!best) for (const n of [null].concat(opt.TUPLETS)) { const c = tryN(n); if (c && (!best || c.w < best.w - 1e-9)) best = c; }
        }
        if (!best) { ok = false; break; }
        idxs.forEach((i, k) => { placement[i] = best.pl[k]; });
        beatChoice.set(b, best.n);
        tupBeats += best.cost;
        worst = Math.max(worst, best.w);
      }
      if (!ok) continue;
      // positions must be strictly increasing
      let mono = true;
      for (let i = 1; i < placement.length; i++) if (placement[i].pos <= placement[i - 1].pos + 1e-9) { mono = false; break; }
      if (!mono) continue;
      const span = placement[placement.length - 1].pos - placement[0].pos;   // in beats
      const slotsUsed = span * opt.SUB;
      cands.push({
        unit: u, beat, bpm: 60 / beat, worst, heads: worst / headS,
        tupBeats, beats: beatChoice, placement, span,
        empty: Math.max(0, Math.round(slotsUsed) - (rels.length - 1)),
      });
    }
    if (!cands.length) return null;
    const underHead = cands.filter(c => c.heads <= opt.MAX_HEADS + 1e-9);
    const pool = underHead.length ? underHead : cands;
    pool.sort((a, b) =>
      (a.tupBeats - b.tupBeats) ||
      (a.empty - b.empty) ||
      (a.heads - b.heads) ||
      (b.unit - a.unit));
    const best = pool[0];
    return Object.assign(describe(best, rels, opt), { coherent: underHead.length > 0, alternatives: pool.slice(1, 4).map(c => describe(c, rels, opt)) });
  }

  // a human-readable shape: written values per note + the gap categories
  function describe(c, rels, opt) {
    const sub = opt.SUB;
    const names = { 1: '16th', 2: '8th', 3: '8th.', 4: 'quarter', 6: 'quarter.', 8: 'half' };
    const parts = [];
    for (let i = 0; i < c.placement.length; i++) {
      const p = c.placement[i], q = c.placement[i + 1];
      const tup = p.n !== sub ? p.n + ':' + (p.n === 6 ? 4 : p.n === 3 ? 2 : 4) : null;
      if (!q) { parts.push((tup ? '[' + tup + '] ' : '') + '16th'); break; }
      const gapUnits = (q.pos - p.pos) * sub;           // in 16ths
      const within = p.beat === q.beat && p.n === q.n && p.n !== sub;
      let v;
      if (within) v = '[' + tup + '] ' + (q.slot - p.slot) + ' slot' + (q.slot - p.slot > 1 ? 's' : '');
      else if (Math.abs(gapUnits - Math.round(gapUnits)) < 1e-6) v = names[Math.round(gapUnits)] || (Math.round(gapUnits) + '/16');
      else v = (tup ? '[' + tup + '] ' : '') + gapUnits.toFixed(2) + '/16';
      parts.push(v);
    }
    // gap categories by ratio to the shortest gap
    const gaps = rels.slice(1).map((r, i) => r - rels[i]);
    const minG = Math.min(...gaps);
    const cat = gaps.map(g => { const r = g / minG; return r < 1.25 ? 'short' : r < 1.75 ? 'medium' : r < 2.5 ? 'long' : 'very long'; });
    return {
      unit: c.unit, bpm: c.bpm, worstSeconds: c.worst, heads: c.heads, tupletBeats: c.tupBeats, emptySlots: c.empty,
      grid: c.placement.map(p => +(p.pos * sub).toFixed(3)),
      beats: [...c.beats].map(([b, n]) => ({ beat: b, tuplet: n })),
      shape: parts.join(' · '),
      gapsMs: gaps.map(g => Math.round(g * 1000)),
      gapCategories: cat,
    };
  }

  return { fit, DEFAULTS };
});
