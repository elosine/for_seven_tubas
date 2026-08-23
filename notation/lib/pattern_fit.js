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

  // ---------------------------------------------------------------------
  // SEGMENTATION (8g, day 27) — THE FIGURES INSIDE A GESTURE
  //
  // fit() answers "what is the best writing for THESE notes". segment()
  // answers the question that comes before it: WHICH NOTES BELONG TOGETHER.
  // Standards principle 6 — "GROUP FIRST, GRID SECOND; figures need not share
  // a tempo (no tempo is printed)" — was written down on day 24 and never
  // implemented: pattern_analyze handed fit() a whole breath-group, and fit()
  // had no choice but to force one grid over it.
  //
  // T1 36.22-39.61 is why it exists. Sixteen notes on ONE grid need tuplets on
  // three separate beats (7:4, 6:4, 7:4) and still sit at 0.7 heads. Cut where
  // the pace changes and the same notes are a handful of trivial figures with
  // no tuplet anywhere.
  //
  // The composer, day 26: players do PATTERN RECOGNITION, not tempo tracking —
  // the page and the cursor already carry the time, so the only failure is
  // dissonance past the eye's mental rounding. A tuplet bracket bought to hold
  // two unrelated paces together is ink that buys nothing.
  //
  // ---------------------------------------------------------------------
  // WHY THE COST ALONE IS NOT ENOUGH — the day-27 finding, kept because it
  // cost an afternoon to establish and would cost another to rediscover.
  //
  // PLAN 8g specified the search as "every cut set, cost(figure) from the
  // existing fit() ranking, + CUT_COST per cut". THAT MODEL CANNOT PRODUCE THE
  // COMPOSER'S OWN READING OF T1, for any CUT_COST — proved, not guessed. The
  // day-26 reading (cuts after notes 5, 8, 11, 14) has BOTH more figures AND a
  // higher figure-cost than the reading the DP prefers (cut after 2 and 5),
  // because notes 1-5 need a quintuplet (cost 2.38) while notes 1-2 are a pair
  // and a pair always fits a grid exactly, for free. More figures AND dearer
  // figures means no cut price can rescue it: raising CUT_COST hurts the
  // composer's reading faster than the alternative.
  //
  // TWO THINGS WERE MISSING, and both are in the composer's own words:
  //
  // 1. A CUT MUST LAND WHERE THE PACE CHANGES. Day 26 did not search cut sets
  //    at all — it sorted the gaps into pace families (~157 / ~245 / ~300 ms)
  //    and read the runs. So the seam gap must belong to a DIFFERENT pace band
  //    than the gap before it: a figure ends when the pace changes, never in
  //    the middle of an even stream. This is what kills the spurious cut after
  //    note 2 (gaps 239 then 244 — the same pace, mid-run), and it makes
  //    NO-SHATTER STRUCTURAL rather than a matter of tuning: an even run has no
  //    pace change anywhere in it, so it has no legal cut and comes out as ONE
  //    figure whatever the weights are.
  //
  // 2. A FIGURE IS SHORT. "Pattern recognition" means a shape the eye takes in
  //    at once; an eleven-note "figure" is a gesture, not a pattern. Without a
  //    length term the DP happily writes most of a gesture as one figure at
  //    0.93 heads — legal by the letter, and exactly what 8g exists to stop.
  //
  // With both in, the model is stable: 67 % of the +/-20 % weight neighbourhood
  // gives the same reading of T1, against 10 % before.
  //
  // WHERE IT STILL DISAGREES WITH THE COMPOSER, and why that is not a bug:
  // it finds cuts after notes 5, 8 and 14 (three of the four made by hand), it
  // FLAGS note 11 as a near-tie (the fourth — the composer flagged it too), and
  // it makes one cut the composer did not, after note 3. That cut is the
  // composer's own principle 6 carried one step further: it splits the
  // "long long / short short" figure at its pace change and so removes the
  // quintuplet — six figures, no tuplet anywhere, nothing past 0.2 heads,
  // against five figures with a 5:4 at 0.63. The tool proposes; the ear
  // disposes. Every boundary it is unsure of is printed.
  // ---------------------------------------------------------------------
  const SEG_DEFAULTS = {
    MIN_FIGURE_NOTES: 2,      // a figure is a pattern; one note is a one-shot
    // THE COST OF A FIGURE = fit()'s own ranking as a scalar, same order of
    // importance (tuplet beats, then empty slots, then heads).
    W_TUPLET: 1.0, W_EMPTY: 0.25, W_HEADS: 1.0,
    // A FIGURE IS SHORT (see above): every note past SOFT_MAX_NOTES costs
    // W_LONG. Six is the largest figure in the decided section-1 vocabulary.
    SOFT_MAX_NOTES: 6, W_LONG: 0.5,
    // what a seam costs. Low, because the pace-change rule already decides
    // WHERE a cut may go; this only decides HOW MANY.
    CUT_COST: 0.5,
    // a figure with no coherent writing at all is not admissible; a penalty
    // rather than Infinity so a gesture that cannot be segmented cleanly still
    // returns its least-bad reading instead of nothing.
    OVER_HEAD_PENALTY: 100,
    // a boundary whose alternative is within this much is FLAGGED, never
    // decided: "this note could go either way" (T1's note 11, the 161 ms gap).
    NEAR_TIE: 0.5,
    // two gaps within this ratio are the same pace to the eye. One number does
    // two jobs: it bands the gaps into the pace families that say where a cut
    // may land, and it turns milliseconds into the words the composer reads.
    PACE_RATIO: 1.25,
  };

  // THE PACE FAMILIES. Gaps banded by ratio to the band's own shortest — the
  // day-26 hand method ("the gaps sort into three pace families, ~157 / ~245 /
  // ~300 ms, in runs"), made repeatable.
  function paceBands(gaps, ratio) {
    const r = ratio || SEG_DEFAULTS.PACE_RATIO;
    const sorted = gaps.slice().sort((a, b) => a - b);
    const bands = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const band = bands[bands.length - 1];
      if (sorted[i] / band[0] < r) band.push(sorted[i]);
      else bands.push([sorted[i]]);
    }
    const bandOf = g => { for (let i = 0; i < bands.length; i++) if (bands[i].indexOf(g) >= 0) return i; return 0; };
    return { bands: bands, bandOf: bandOf };
  }

  // THE WORDS COME FROM THE SPACING, NOT FROM THE NOTATION (principle 3: the
  // analysis chooses the notation that best shows the pattern AS IT LOOKS).
  // 239|244|156|160 reads "long long short short", which is what the composer
  // said when they looked at it — and what the quintuplet writing's implied
  // 1.6|1.6|0.8|1.0 would NOT have said.
  function words(gaps, options) {
    const ratio = (options && options.PACE_RATIO) || SEG_DEFAULTS.PACE_RATIO;
    if (!gaps || !gaps.length) return '';
    if (gaps.length === 1) return 'pair';
    const pb = paceBands(gaps, ratio);
    if (pb.bands.length === 1) return gaps.map(() => 'even').join(' ');
    const NAMES = pb.bands.length === 2 ? ['short', 'long']
      : pb.bands.length === 3 ? ['short', 'medium', 'long']
        : ['short', 'medium', 'long', 'very long'];
    return gaps.map(g => NAMES[Math.min(NAMES.length - 1, Math.floor(pb.bandOf(g) * NAMES.length / pb.bands.length))]).join(' ');
  }

  // A DOTTED READING, OFFERED NEVER TAKEN (deferred to the page, day 26).
  // T1's first figure is 3:3:2:2 — the composer's own description. On a 16th
  // grid that needs a quintuplet; on a HALF-16th grid it is two dotted 16ths
  // and two 16ths, no 32nd head anywhere, which bends principle 7 rather than
  // breaking it. The choice is the composer's when the figure is drawn, so the
  // tool reports both and writes neither on its own.
  function dottedReading(onsets, options) {
    const opt = Object.assign({}, DEFAULTS, options || {});
    if (!onsets || onsets.length < 2) return null;
    const rels = onsets.map(t => t - onsets[0]);
    let best = null;
    for (let u = opt.UMIN; u <= opt.UMAX + 1e-9; u += opt.USTEP) {
      const half = u / 2;
      const slots = rels.map(r => Math.round(r / half));
      let mono = true;
      for (let i = 1; i < slots.length; i++) if (slots[i] <= slots[i - 1]) { mono = false; break; }
      if (!mono) continue;
      // every gap must be a whole 16th or a DOTTED one (3 half-units); a lone
      // half-unit gap would be a 32nd, which the standards refuse
      const gapsH = slots.slice(1).map((s, i) => s - slots[i]);
      if (gapsH.some(g => g % 2 === 1 && g !== 3)) continue;
      const worst = Math.max.apply(null, rels.map((r, i) => Math.abs(slots[i] * half - r)));
      if (!best || worst < best.worst - 1e-9) best = { unit: u, worst: worst, slots: slots, gapsH: gapsH };
    }
    if (!best) return null;
    const NAME = { 2: '16th', 3: 'dotted 16th', 4: '8th', 6: 'dotted 8th', 8: 'quarter' };
    const dots = best.gapsH.filter(g => g === 3 || g === 6).length;
    return {
      unit: best.unit, worstSeconds: best.worst, heads: best.worst / opt.HEAD_SECONDS,
      halfSlots: best.slots, dottedCount: dots,
      shape: best.gapsH.map(g => NAME[g] || (g / 2) + '/16').concat(['16th']).join(' · '),
      coherent: best.worst <= opt.HEAD_SECONDS * opt.MAX_HEADS + 1e-9,
    };
  }

  function segment(onsets, options) {
    const opt = Object.assign({}, DEFAULTS, SEG_DEFAULTS, options || {});
    const n = onsets ? onsets.length : 0;
    if (n < 2) return null;
    const MIN = Math.max(2, opt.MIN_FIGURE_NOTES);
    const gaps = onsets.slice(1).map((t, i) => t - onsets[i]);
    const pb = paceBands(gaps, opt.PACE_RATIO);
    // A CUT MUST LAND WHERE THE PACE CHANGES. Cut "after note b" makes gaps[b-1]
    // the seam; it is legal only where that gap is a different pace from the one
    // before it. An even run therefore has no legal cut at all.
    const allowed = new Set();
    for (let b = MIN; b <= n - MIN; b++) if (pb.bandOf(gaps[b - 1]) !== pb.bandOf(gaps[b - 2])) allowed.add(b);
    // fit() is the expensive call (~2-7 ms); every [i,j) is wanted by the main
    // search and again by each constrained re-run, so it is memoised once.
    const memo = new Map();
    const fitOf = (i, j) => {
      const k = i + ':' + j;
      if (!memo.has(k)) memo.set(k, fit(onsets.slice(i, j), opt));
      return memo.get(k);
    };
    const costOf = (i, j) => {
      const f = fitOf(i, j);
      if (!f) return null;
      const over = f.coherent === false;
      return {
        f: f, over: over,
        cost: opt.W_TUPLET * f.tupletBeats + opt.W_EMPTY * f.emptySlots + opt.W_HEADS * f.heads +
          opt.W_LONG * Math.max(0, (j - i) - opt.SOFT_MAX_NOTES) + (over ? opt.OVER_HEAD_PENALTY : 0),
      };
    };
    // best[j] = cheapest reading of the first j notes. `forbid` bans a cut at a
    // boundary, `force` requires one — used only to PRICE the alternative to
    // each decision, never to make it.
    const solve = (forbid, force) => {
      const best = new Array(n + 1).fill(null);
      best[0] = { total: 0, starts: [] };
      for (let j = MIN; j <= n; j++) {
        for (let i = 0; i + MIN <= j; i++) {
          if (!best[i]) continue;
          if (i > 0 && !allowed.has(i)) continue;
          if (i > 0 && forbid && forbid.has(i)) continue;
          if (force) { let bad = false; for (const b of force) if (b > i && b < j) { bad = true; break; } if (bad) continue; }
          const c = costOf(i, j);
          if (!c) continue;
          const total = best[i].total + c.cost + (i > 0 ? opt.CUT_COST : 0);
          if (!best[j] || total < best[j].total - 1e-9) best[j] = { total: total, starts: best[i].starts.concat([i]) };
        }
      }
      return best[n];
    };
    const sol = solve(null, null);
    if (!sol) return null;
    const cuts = sol.starts.slice(1);            // boundary b = "cut after note b"
    const figureAt = (s, e) => {
      const g = onsets.slice(s, e);
      const gp = g.slice(1).map((t, i) => t - g[i]);
      const c = costOf(s, e);
      return {
        from: s + 1, to: e, notes: e - s, onsets: g,
        gapsMs: gp.map(x => Math.round(x * 1000)),
        words: words(gp, opt), fit: c ? c.f : null, cost: c ? +c.cost.toFixed(4) : null,
        dotted: dottedReading(g, opt),
      };
    };
    const figures = sol.starts.map((s, idx) => figureAt(s, idx + 1 < sol.starts.length ? sol.starts[idx + 1] : n));
    // NEAR-TIES + ALTERNATIVES. For every boundary the pace rule allows: what
    // it would cost to un-cut it (if it is a cut) or to cut it (if it is not).
    // Inside NEAR_TIE the decision belongs to the composer, and the report says
    // so instead of hiding it. Each constrained answer is also a real
    // alternative reading, so the two fall out of one pass.
    const nearTies = [], altMap = new Map();
    const cutSet = new Set(cuts);
    for (const b of [...allowed].sort((a, z) => a - z)) {
      const alt = cutSet.has(b) ? solve(new Set([b]), null) : solve(null, new Set([b]));
      if (!alt) continue;
      const delta = +(alt.total - sol.total).toFixed(3);
      const altCuts = alt.starts.slice(1);
      const key = altCuts.join(',');
      if (key !== cuts.join(',') && !altMap.has(key))
        altMap.set(key, { cuts: altCuts, total: +alt.total.toFixed(4), delta: delta,
          words: alt.starts.map((s, i) => figureAt(s, i + 1 < alt.starts.length ? alt.starts[i + 1] : n).words).join(' · ') });
      if (delta < opt.NEAR_TIE)
        nearTies.push({ afterNote: b, kind: cutSet.has(b) ? 'cut' : 'nocut', delta: delta, gapMs: Math.round(gaps[b - 1] * 1000) });
    }
    const alternatives = [...altMap.values()].sort((a, b) => a.delta - b.delta);
    const single = fit(onsets, opt);
    const singleCost = single ? (opt.W_TUPLET * single.tupletBeats + opt.W_EMPTY * single.emptySlots + opt.W_HEADS * single.heads) : null;
    return {
      figures: figures, cuts: cuts, nearTies: nearTies, alternatives: alternatives,
      allowedCuts: [...allowed].sort((a, b) => a - b),
      paceBands: pb.bands.map(b => ({ notes: b.length, minMs: Math.round(b[0] * 1000), maxMs: Math.round(b[b.length - 1] * 1000) })),
      gapsMs: gaps.map(g => Math.round(g * 1000)),
      total: +sol.total.toFixed(4),
      figureCost: +figures.reduce((s, f) => s + (f.cost || 0), 0).toFixed(4),
      cutCost: opt.CUT_COST,
      coherent: figures.every(f => f.fit && f.fit.coherent !== false),
      words: figures.map(f => f.words).join(' · '),
      single: single, singleCost: singleCost == null ? null : +singleCost.toFixed(4),
    };
  }

  return { fit, segment, words, paceBands, dottedReading, DEFAULTS, SEG_DEFAULTS };
});
