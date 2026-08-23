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
    // Among COHERENT readings the simplest wins (fewest tuplet beats, then
    // fewest empty slots, then heads). When NOTHING is within a head the
    // order flips: displacement FIRST (day 29). Found under --plain on T2's
    // second gesture — with tuplets off, the old order chose eight even 16ths
    // at 3.8 heads (the 430 ms gap written equal to the 157 ms one) over a
    // rest-strewn grid at 1.4 heads, because "no rests" ranked above "close to
    // the spacing". Principle 4 says the dissonance IS the displacement, so
    // the least-bad incoherent reading is the one nearest the spacing, and
    // simplicity only breaks ties. Coherent readings are sorted as before.
    if (underHead.length) pool.sort((a, b) =>
      (a.tupBeats - b.tupBeats) ||
      (a.empty - b.empty) ||
      (a.heads - b.heads) ||
      (b.unit - a.unit));
    else pool.sort((a, b) =>
      (a.heads - b.heads) ||
      (a.tupBeats - b.tupBeats) ||
      (a.empty - b.empty) ||
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
  // WHERE IT DISAGREED WITH THE COMPOSER, AND WHAT THAT DISAGREEMENT WAS
  // (day 27 -> day 28, kept because the correction is the finding).
  //
  // As built on day 27 the tool cut after notes 3, 5, 8, 10 and 14; the
  // composer's ear said 2, 5, 7, 10 and 14. Two of five, each one note late,
  // each in the same direction — which is what a systematic defect looks like,
  // not what taste looks like. The defect was that a seam was tested against
  // the gap BEFORE it only. 8h (D68) makes the test two-sided — THE SEAM IS
  // THE SLOWER GAP — and the legal set becomes the composer's five exactly,
  // with the DP taking all of them. See the rule at the top of segment().
  //
  // Nothing else about D67 moved: a cut still lands only where the pace
  // changes, no-shatter is still structural, and every boundary the tool is
  // unsure of is still printed rather than decided (near-ties by cost,
  // ratio ties by the pace threshold itself).
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

  // WHY A HAND CUT SET IS REFUSED, in words the caller can print. segment()
  // returns null for an impossible --cuts; this is the same check exported so
  // the tools can say WHICH cut is impossible instead of "no reading found".
  function cutsReason(nNotes, cuts, minNotes) {
    const MIN = Math.max(2, minNotes || 2);
    if (!cuts || !cuts.length) return null;
    let prev = 0;
    for (const c of cuts) {
      if (!Number.isInteger(c)) return 'cut "' + c + '" is not a whole note number';
      if (c <= prev) return 'cuts must ascend and not repeat (' + cuts.join(',') + ')';
      if (c >= nNotes) return 'cut after note ' + c + ' is past the end (' + nNotes + ' notes)';
      if (c - prev < MIN) return 'cut after note ' + c + ' leaves a figure of ' + (c - prev) +
        ' note(s); a figure is a pattern, so it needs at least ' + MIN;
      prev = c;
    }
    if (nNotes - prev < MIN) return 'the last figure would be ' + (nNotes - prev) +
      ' note(s); a figure is a pattern, so it needs at least ' + MIN;
    return null;
  }

  // ---------------------------------------------------------------------
  // FLOW (8h, part B) — COULD THESE TWO FIGURES SHARE ONE GRID?
  //
  // A REPORT ONLY. Nothing is written from it. Two adjacent figures whose
  // units stand at 2:1 or 3:2 could be drawn on ONE grid with a bracket on
  // the quicker one, and that reads as a single flowing shape instead of two
  // unrelated tempos side by side. The composer, day 28: a quick group on its
  // own grid "just looks like even 16ths" — the bracket is what says QUICKER.
  //
  // Only 2:1 and 3:2, because that is the composer's vocabulary. The number is
  // printed even when it is poor, marked past a head like everything else, so
  // the choice is made by eye and not by the tool.
  //
  // The written values are the values ON THE SHARED GRID: a figure whose unit
  // is twice the grid unit is 8ths, one at two-thirds of it is a 3:2 bracket
  // of 16ths. (A figure with a rest inside it keeps that rest; the words here
  // name the values, not the full spelling.)
  // ---------------------------------------------------------------------
  function flow(figA, figB, options) {
    const opt = Object.assign({}, DEFAULTS, options || {});
    if (!figA || !figB || !figA.fit || !figB.fit) return null;
    const ua = figA.fit.unit, ub = figB.fit.unit;
    if (!(ua > 0) || !(ub > 0)) return null;
    const slow = Math.max(ua, ub), quick = Math.min(ua, ub), r = slow / quick;
    let target = null;
    for (const t of [2, 1.5]) if (r / t <= 1.08 && r / t >= 1 / 1.08) target = t;
    if (!target) return { fits: false, ratio: +r.toFixed(3) };
    const U = target === 2 ? quick : slow;               // 2:1 counts in the quick unit; 3:2 in the slow
    const mult = u => (Math.abs(u - U) < Math.abs(u - U * 2) && Math.abs(u - U) < Math.abs(u - U * 2 / 3)) ? 1
      : (target === 2 ? 2 : 2 / 3);
    const ma = mult(ua), mb = mult(ub);
    const rel = f => f.fit.grid.map(g => g - f.fit.grid[0]);
    const t0 = figA.onsets[0];
    const startB = Math.round((figB.onsets[0] - t0) / U);
    const idealA = rel(figA).map(g => t0 + ma * g * U);
    const idealB = rel(figB).map(g => t0 + startB * U + mb * g * U);
    let worst = 0;
    figA.onsets.forEach((t, i) => { worst = Math.max(worst, Math.abs(t - idealA[i])); });
    figB.onsets.forEach((t, i) => { worst = Math.max(worst, Math.abs(t - idealB[i])); });
    const value = m => m === 2 ? '8th' : '16th';
    const spell = (f, m) => m === 2 / 3
      ? '3:2 [' + f.onsets.map(() => '16th').join(' ') + ']'
      : f.onsets.map(() => value(m)).join(' ');
    return {
      fits: true, ratio: +r.toFixed(3), target: target === 2 ? '2:1' : '3:2',
      unit: U, unitMs: Math.round(U * 1000),
      shape: spell(figA, ma) + ' | ' + spell(figB, mb),
      worstSeconds: worst, worstMs: Math.round(worst * 1000), heads: worst / opt.HEAD_SECONDS,
      coherent: worst <= opt.HEAD_SECONDS * opt.MAX_HEADS + 1e-9,
    };
  }

  // ---------------------------------------------------------------------
  // BRACKETS vs GROUPS (8i, day 28 — D69). "THE BRACKET IS THE MESSAGE."
  //
  // The composer, looking at T1 written both ways: *"my mental model is that
  // there should be some communication to the performer if there is a speed
  // change... So the first two sixteenth notes look much further apart than
  // the next three. And so the seven-four bracket is appropriate."*
  //
  // So 8h's GROUPING stands and 8g's WRITING falls: the gesture stays on ONE
  // grid, the seams become beam breaks, and every pace change is said out loud
  // as the tuplet relation the fit already found. Written as plain 16ths on
  // their own grids the same notes make a page whose VALUES say "same" while
  // its SPACING says "different".
  //
  // This function is the check that the two agree. fit() chooses a tuplet PER
  // BEAT (design call A(a), day 28: that model stays); segment() chooses the
  // seams. Nothing makes a beat line up with a seam — on T1 they happen to,
  // because a seam IS a pace change and a pace change is what buys a bracket.
  // Where they do NOT, a bracket covers half of one group and half of the next
  // and says the wrong thing under D69. That is a STRADDLE, and it is flagged
  // rather than fixed: the composer decides whether it is worth changing the
  // bracket model for.
  //
  // Takes the ONE-GRID fit (seg.single) and the cut set (seg.cuts). Pure.
  function bracketsVsGroups(single, cuts) {
    if (!single || !single.grid || !single.grid.length) return null;
    const SUB = DEFAULTS.SUB;
    const n = single.grid.length;
    const cutList = (cuts || []).slice().sort((a, b) => a - b).filter(c => c >= 1 && c < n);
    // the groups the cuts make, as [firstNote, lastNote] 1-based
    const bounds = []; { let s = 1; for (const c of cutList) { bounds.push([s, c]); s = c + 1; } bounds.push([s, n]); }
    const groupOf = i => { let g = 1; for (const c of cutList) { if (i > c) g++; else break; } return g; };
    const beatOf = i => Math.floor(single.grid[i - 1] / SUB + 1e-9);
    // every beat the fit put a tuplet on, and which notes fall inside it
    const brackets = [];
    for (const b of (single.beats || [])) {
      if (!b.tuplet) continue;
      const notes = [];
      for (let i = 1; i <= n; i++) if (beatOf(i) === b.beat) notes.push(i);
      if (!notes.length) continue;
      const den = b.tuplet >= 4 ? 4 : 2;
      brackets.push({
        beat: b.beat, tuplet: b.tuplet, text: b.tuplet + ':' + den,
        notes: [notes[0], notes[notes.length - 1]],
        groups: [...new Set(notes.map(groupOf))].sort((x, z) => x - z),
      });
    }
    brackets.sort((a, b) => a.beat - b.beat);
    // A STRADDLE: a bracket whose notes sit on both sides of a seam. One entry
    // per seam crossed — a bracket may cross more than one.
    const straddles = [];
    for (const br of brackets)
      for (const c of cutList)
        if (br.notes[0] <= c && br.notes[1] > c)
          straddles.push({ beat: br.beat, tuplet: br.tuplet, text: br.text, notes: br.notes.slice(), seamAfter: c });
    // per group: the brackets over it, and how much of it each one covers.
    // 'exact' = the bracket and the group are the same notes (T1's three);
    // 'part' = it covers some of the group and nothing outside it (fine — the
    // rest of the group is plain); 'straddle' = it leaves the group.
    const groups = bounds.map(([a, z], gi) => {
      const mine = brackets.filter(br => br.groups.indexOf(gi + 1) >= 0);
      return {
        group: gi + 1, from: a, to: z, notes: z - a + 1,
        brackets: mine.map(br => ({
          beat: br.beat, tuplet: br.tuplet, text: br.text, notes: br.notes.slice(),
          covers: (br.notes[0] < a || br.notes[1] > z) ? 'straddle'
            : (br.notes[0] === a && br.notes[1] === z) ? 'exact' : 'part',
        })),
        plain: mine.length === 0,
      };
    });
    return { groups: groups, brackets: brackets, straddles: straddles, cuts: cutList };
  }

  function segment(onsets, options) {
    const opt = Object.assign({}, DEFAULTS, SEG_DEFAULTS, options || {});
    const n = onsets ? onsets.length : 0;
    if (n < 2) return null;
    const MIN = Math.max(2, opt.MIN_FIGURE_NOTES);
    const gaps = onsets.slice(1).map((t, i) => t - onsets[i]);
    const pb = paceBands(gaps, opt.PACE_RATIO);
    // ------------------------------------------------------------------
    // THE SEAM IS THE SLOWER GAP (8h, day 28 — D68). A cut still lands only
    // where the PACE CHANGES (D67, the composer's own day-26 method); 8h adds
    // WHICH SIDE the boundary note goes to, which the day-27 test got wrong.
    //
    // Cut "after note b" makes gaps[b-1] the seam. Day 27 compared that gap
    // with the one BEFORE it only, so at a slow->quick change the QUICK gap
    // became the seam and the pace-change note landed on the SLOW side. On T1
    // that gave cuts after 3 and 8 where the composer's ear said 2 and 7 — one
    // note off, twice, from the same one-sided defect.
    //
    // A seam is a gap that is NOT QUICKER THAN EITHER NEIGHBOUR and is a pace
    // change from at least one of them — a banded local maximum (Lerdahl &
    // Jackendoff GPR 2b: a group boundary falls at the greater inter-onset
    // interval). Bands index ascending (0 = quickest), so ">=" reads "not
    // quicker". The last clause is the pace-change requirement: a gap in the
    // same band as BOTH neighbours is mid-run and no seam at all — which is
    // what keeps NO-SHATTER structural rather than a matter of weights.
    //
    // The last gap has no right neighbour (R === null); it is judged on the
    // left alone, as before.
    // ------------------------------------------------------------------
    const legalAt = ratio => {
      const b2 = paceBands(gaps, ratio), out = new Set();
      for (let b = MIN; b <= n - MIN; b++) {
        const s = b2.bandOf(gaps[b - 1]), L = b2.bandOf(gaps[b - 2]);
        const R = b < n - 1 ? b2.bandOf(gaps[b]) : null;
        if (s >= L && (R === null || s >= R) && (s !== L || (R !== null && s !== R))) out.add(b);
      }
      return out;
    };
    // CUTS: the composer names the seams and legality steps aside entirely
    // ("say the boundary and it moves", promised day 27, built day 28). Each
    // figure is still fitted ALONE — the hand decides WHERE, the tool still
    // decides how each piece is written.
    const byHand = opt.CUTS && opt.CUTS.length ? opt.CUTS.slice().sort((a, b) => a - b) : null;
    if (byHand && cutsReason(n, byHand, MIN)) return null;
    const allowed = byHand ? new Set(byHand) : legalAt(opt.PACE_RATIO);
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
    const solve = (forbid, force, allowSet) => {
      const A = allowSet || allowed;
      const best = new Array(n + 1).fill(null);
      best[0] = { total: 0, starts: [] };
      for (let j = MIN; j <= n; j++) {
        for (let i = 0; i + MIN <= j; i++) {
          if (!best[i]) continue;
          if (i > 0 && !A.has(i)) continue;
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
    // Under --cuts every named boundary is FORCED as well as allowed, so the
    // DP has exactly one reading to price: the composer's.
    const sol = solve(null, byHand ? new Set(byHand) : null);
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
    // Under --cuts there is nothing to be unsure about: the composer has
    // overridden the rule, so the tool does not second-guess its own seams.
    const nearTies = [], altMap = new Map();
    const cutSet = new Set(cuts);
    for (const b of (byHand ? [] : [...allowed].sort((a, z) => a - z))) {
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
    // ------------------------------------------------------------------
    // RATIO TIES (8h). PACE_RATIO is a model of the eye, not a measurement, so
    // a boundary that hangs on its third decimal belongs to the composer and
    // not to the tool. Re-run the LEGALITY (not the whole DP) at +/-5 % and
    // report every boundary whose legality moves — with the ratio where it
    // actually flips, bisected, and the two gaps whose ratio that is.
    //
    // T1's cut after note 7 is the case: it is legal at 1.25 and illegal at
    // 1.3125, flipping at 1.272 — which is 304/239, the seam gap against the
    // shortest gap of the band it joins. (The day-28 scratch called it
    // 304/242 = 1.256, the seam against its right NEIGHBOUR; the banding is
    // greedy from the band's own shortest, so 239 is the number that decides.)
    // ------------------------------------------------------------------
    const ratioTies = [];
    if (!byHand) {
      const RS = [opt.PACE_RATIO * 0.95, opt.PACE_RATIO, opt.PACE_RATIO * 1.05];
      const sets = RS.map(legalAt);
      // the greedy banding breaks between two sorted gaps when their ratio to
      // the band's own shortest reaches PACE_RATIO, so every flip threshold IS
      // one of those pair ratios: naming the pair says WHY it flipped.
      const breaksOf = r => {
        const sorted = gaps.slice().sort((a, b) => a - b), out = [];
        let anchor = sorted[0];
        for (let i = 1; i < sorted.length; i++)
          if (sorted[i] / anchor >= r) { out.push({ value: sorted[i], anchor: anchor }); anchor = sorted[i]; }
        return out;
      };
      const seen = new Set();
      for (const s of sets) for (const b of s) seen.add(b);
      for (const b of [...seen].sort((x, z) => x - z)) {
        const has = sets.map(s => s.has(b));
        if (has.every(Boolean) || has.every(x => !x)) continue;
        const k = has[0] !== has[1] ? 0 : 1;              // the sample pair that straddles the flip
        let lo = RS[k], hi = RS[k + 1];
        const loHas = has[k];
        for (let it = 0; it < 40; it++) {
          const mid = (lo + hi) / 2;
          if (legalAt(mid).has(b) === loHas) lo = mid; else hi = mid;
        }
        const bLo = breaksOf(lo), bHi = breaksOf(hi);
        const gone = bLo.find(x => !bHi.some(y => Math.abs(y.value - x.value) < 1e-9)) ||
          bHi.find(x => !bLo.some(y => Math.abs(y.value - x.value) < 1e-9)) || null;
        const other = has.findIndex(h => h !== has[1]);   // a sample where it reads differently
        const altSol = solve(null, null, sets[other]);
        ratioTies.push({
          afterNote: b, ratio: +((lo + hi) / 2).toFixed(4),
          legalAt: RS.filter((r, i) => has[i]).map(r => +r.toFixed(4)),
          notLegalAt: RS.filter((r, i) => !has[i]).map(r => +r.toFixed(4)),
          because: gone ? { slowMs: Math.round(gone.value * 1000), quickMs: Math.round(gone.anchor * 1000) } : null,
          altRatio: +RS[other].toFixed(4),
          altCuts: altSol ? altSol.starts.slice(1) : null,
        });
      }
    }
    const single = fit(onsets, opt);
    const singleCost = single ? (opt.W_TUPLET * single.tupletBeats + opt.W_EMPTY * single.emptySlots + opt.W_HEADS * single.heads) : null;
    // NO CLEAN SEAM (8h). The rule can legitimately find NOWHERE to cut — every
    // slow gap has a slower neighbour, so the only pace changes are joins, not
    // seams. That is a real answer for a short even shape and a confession for
    // anything longer or anything the one grid cannot write plainly. Say which:
    // the gesture still comes back as one figure, but flagged for the ear.
    // T7 @36.19 of CLOUD02-I (378 323 130 292 367) is the case that named it.
    const noSeam = !byHand && allowed.size === 0 &&
      (n > opt.SOFT_MAX_NOTES || !single || single.tupletBeats > 0 || single.coherent === false);
    return {
      figures: figures, cuts: cuts, nearTies: nearTies, alternatives: alternatives,
      ratioTies: ratioTies, noSeam: noSeam, byHand: !!byHand,
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

  return { fit, segment, words, paceBands, dottedReading, flow, cutsReason, bracketsVsGroups, DEFAULTS, SEG_DEFAULTS };
});
