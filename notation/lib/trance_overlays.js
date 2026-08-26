// trance_overlays.js — THE TRANCE SECTION'S NOTATION, as overlays.
//
// DAY 36 REWRITE, from docs/plans/TRANCE_A4_REVISION.md (v3 FINAL). The day-35
// build measured ONE tempo for the whole ensemble and gave up wherever the
// parts disagreed; the composer's redirect is the opposite reading —
//
//   · TEMPO IS PER PART. Each part is marked with the tempo IT plays in, even
//     when it does not sound every beat. Bar line + ♩=N in that part's lane
//     wherever THAT part starts a new tempo. The ball bounces at its tempo.
//   · EVERY IN-TEMPO NOTE is a black notehead + stem + staccato dot, whatever
//     its technique — head LEFT EDGE on its go time, no GC, no go line.
//   · THE LONG-TONE COLUMNS (10 of them) take the 40.92 treatment: GC, go
//     line, open stemless head, and ONE ring length for the whole column =
//     (the column's minimum next-attack gap) − a breath.
//   · DYNAMICS: f on each part's first note, then nothing until the swells'
//     own pairs and the ppp→fff at each part's PH6 entry.
//   · THE BALL is one per lane at that part's own tempo — tiled, always in
//     flight — and OFF through the columns and the swells.
//   · cuivré text is KEPT. (Day 35's "no text anywhere" meant the score's own
//     commentary — beat numbers and structural labels — not the notation.)
//
// THE MAP BELOW IS AUTHORED DATA, measured against piece-s28 on day 36 and
// carried here verbatim from the plan. The build RE-DERIVES it from the score
// as a check and prints every mismatch; it never silently substitutes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TranceOverlays = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const BREATH = 0.5;        // registry breathSeconds — the ring's own number
  const HEAD = 0.030;        // one notehead at page scale (NOTATION_STANDARDS
                             // first principle 4) — the on-grid tolerance
  const SWELL_MIN = 2.0;     // an ord note this long inside the swell span is a swell
  const COL_TOL = 0.005;     // a column member's onset, to the millisecond

  // THE PRINTED TEMPO. false = print the authored map (the plan is the spec).
  // true  = print what the re-derivation measured. The two differ in exactly
  // four segments (PS2/PS3/PS4/PS5) and the build says so, loudly: day 35's
  // tempoOf() rounded the inter-onset gap to 2 dp BEFORE inverting it, which
  // is where 93.8 / 100 / 107.1 / 113.2 came from. See the MISMATCH block.
  const PRINT_MEASURED = false;

  // ---------------------------------------------------------------------
  // THE PER-PART TEMPO MAP (plan §"THE PER-PART TEMPO MAP", verbatim)
  //   bpm  — one number, every part
  //   per  — ten numbers, T1..T10 (null = that part has no tempo here)
  //   ball:false — no ball, no bar, no tempo mark; the row does not reset a
  //                part's "current tempo" either (the section carries through)
  // ---------------------------------------------------------------------
  const TEMPO_MAP = [
    { t0: 499.83, t1: 521.03, name: 'PULSE',    bpm: 150 },
    // THE TWO PULSED PASSAGES INSIDE THE COLUMNS (day 36, composer: "there
    // are 2 pulsed sections between long tone sections 521.83 and 523.4,
    // these need the bouncing ball, no need for tempo marking I think they
    // continue in 150"). So: ball ON across each passage, at 150, for EVERY
    // lane — the ball shows the grid, the noteheads show your subset, exactly
    // as in the opening pulse — and no bar line, because nobody changed
    // tempo. `ballSpans` runs from the first beat to the last INCLUSIVE, and
    // is not derived per part: passage A has only one note in most lanes and
    // none at all in T10, and a lane still has to bounce through it.
    { t0: 521.03, t1: 529.03, name: 'VERT',     ball: false, tempo: false,
      ballSpans: [{ t0: 521.83, t1: 522.23, bpm: 150 }, { t0: 523.43, t1: 525.03, bpm: 150 }] },
    { t0: 529.03, t1: 534.23, name: 'seg32',    per: [102.6, 67.1, 110.5, 126.3, 150, null, 67.1, 110.5, 126.3, 118.4] },
    { t0: 534.23, t1: 535.83, name: 'base x4',  bpm: 150 },
    { t0: 535.83, t1: 545.83, name: 'seg17',    per: [100, 55, 55, 75, 75, 75, 55, 45.8, 55, 90] },
    { t0: 545.83, t1: 548.63, name: 'base x7',  bpm: 150 },
    { t0: 548.63, t1: 560.63, name: 'seg27',    bpm: 80 },
    { t0: 560.63, t1: 566.63, name: 'base x15', bpm: 150 },
    { t0: 566.63, t1: 578.63, name: 'PS1',      bpm: 87 },
    { t0: 578.63, t1: 582.23, name: 'P9',       bpm: 150 },
    { t0: 582.23, t1: 593.43, name: 'PS2',      bpm: 93.8 },
    { t0: 593.43, t1: 594.63, name: 'P10',      bpm: 150 },
    { t0: 594.63, t1: 604.63, name: 'MT B',     per: [85.7, 107.1, 75, 32.1, 42.9, 128.6, 107.1, 75, 64.3, 42.9] },
    { t0: 604.63, t1: 617.43, name: 'PS3',      bpm: 100 },
    { t0: 617.43, t1: 620.63, name: 'P12',      bpm: 150 },
    { t0: 620.63, t1: 647.43, name: 'PS4',      bpm: 107.1 },
    { t0: 647.43, t1: 664.63, name: 'CB',       ball: false, tempo: false },
    { t0: 664.63, t1: 685.03, name: 'PS5',      bpm: 113.2 },
    { t0: 685.03, t1: 709.43, name: 'SW',       ball: false, tempo: false },
    { t0: 709.43, t1: 751.50, name: 'PS6/PH6',  bpm: 120 },
  ];

  // THE TEN LONG-TONE COLUMNS. `ring` is authored from the plan and re-derived
  // below: (min next-attack gap among the column's members) − BREATH.
  const COLUMNS = [
    { t: 521.03, ring: 0.30 }, { t: 522.63, ring: 0.30 }, { t: 525.43, ring: 0.30 },
    { t: 526.23, ring: 0.70 }, { t: 527.43, ring: 1.10 },
    { t: 647.43, ring: 2.30 }, { t: 650.23, ring: 1.10 }, { t: 651.83, ring: 2.70 },
    { t: 655.03, ring: 0.70 }, { t: 656.23, ring: 7.96 },
  ];

  const SWELL = [685.03, 709.43];
  const PH6 = { t0: 709.43, t1: 751.42, knee: 746.29, samples: 401 };

  // ---------------------------------------------------------------------
  // THE GRID FIT — what tempo is this part actually playing here?
  //
  // A part's onsets are a stream WITH RESTS on ONE grid (the plan's RQ-2, and
  // the reason the day-35 modal-gap reading failed: a part sounding every
  // other beat of the 150 grid reads as 75). So: take the multiples k from the
  // AUTHORED step, then least-squares the step itself against them. A part
  // playing 0.8 apart on a 0.4 grid keeps k = 0, 2, 4 and refines to 0.4.
  //
  // The anchor is the part's first onset unless another onset puts MORE of the
  // stream on the grid — seg17's T8 and T9 each carry one displaced note, the
  // residue of the phase ladder, and anchoring on it would throw the ball off
  // every note after it.
  // ---------------------------------------------------------------------
  function fitGrid(onsets, stepGuess) {
    let best = null;
    for (let i = 0; i < onsets.length; i++) {
      const a = onsets[i];
      let on = 0;
      for (const x of onsets) {
        const k = Math.round((x - a) / stepGuess);
        if (Math.abs(x - a - k * stepGuess) <= HEAD) on++;
      }
      if (!best || on > best.on) best = { a, i, on };
    }
    const a = best.a, wide = 0.4 * stepGuess;
    let num = 0, den = 0;
    for (const x of onsets) {
      const d = x - a, k = Math.round(d / stepGuess);
      if (k === 0 || Math.abs(d - k * stepGuess) > wide) continue;   // outlier: not this grid
      num += k * d; den += k * k;
    }
    const step = den > 0 ? num / den : stepGuess;
    let worst = 0, off = 0;
    for (const x of onsets) {
      const k = Math.round((x - a) / step), r = Math.abs(x - a - k * step);
      if (r > worst) worst = r;
      if (r > HEAD) off++;
    }
    return { anchor: a, anchorIdx: best.i, step, bpm: 60 / step, worst, off, n: onsets.length };
  }

  const r1 = v => Math.round(v * 10) / 10;

  // ---------------------------------------------------------------------
  function build(objects, groupId, parts, idBase) {
    const all = objects.filter(o => o.groupId === groupId && o.type === 'waveCurve' && o.layer < 10
      && (!parts || !parts.length || parts.indexOf(o.layer) >= 0));
    if (!all.length) return null;
    const pfx = idBase || 'tr';
    const overlays = [];
    const dev = new Map();                 // objectId -> device fields (merged)
    const put = (o, d) => dev.set(o.id, Object.assign(dev.get(o.id) || {}, d));
    const notes = [];                      // per part, sorted
    for (let L = 0; L < 10; L++) notes[L] = all.filter(o => o.layer === L).sort((a, b) => a.startSeconds - b.startSeconds);
    const flags = [], mismatches = [];

    // ---- classify: column member · swell · in-tempo -------------------
    const colOf = o => COLUMNS.find(c => Math.abs(o.startSeconds - c.t) < COL_TOL) || null;
    const isSwell = o => o.technique === 'ord' && (o.endSeconds - o.startSeconds) >= SWELL_MIN
      && o.startSeconds >= SWELL[0] - 1e-6 && o.startSeconds < SWELL[1];
    const inTempo = [], swells = [], columnMembers = [];
    for (const o of all) {
      if (colOf(o)) columnMembers.push(o);
      else if (isSwell(o)) swells.push(o);
      else inTempo.push(o);
    }

    // ---- §1 THE IN-TEMPO NOTES ---------------------------------------
    // black head, plain stem, staccato dot, LEFT EDGE on the go time. No GC
    // and no go line: the head is already on its own moment, and a go line
    // marks displacement (NOTATION_STANDARDS, "the go line marks displacement").
    // No brick — the drawn note IS the notation. No ring bar: the 16 attacks
    // at 517.83/519.43 are ord/cuivre, whose defaults carry one.
    for (const o of inTempo) {
      const d = {
        nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'plain',
        nhDot: true, nhDotGapSs: 0.15, nhAnchor: 'leftEdge',
        gc: false, goLine: false, brick: false, ringBar: false,
        curve: false, dynPair: false, dynMark: false,
      };
      if (o.technique === 'cuivre') d.techText = 'cuivré';
      put(o, d);
    }

    // ---- §2 THE LONG-TONE COLUMNS ------------------------------------
    // ONE written length for the whole column (the composer's 40.92 rule),
    // re-derived here and checked against the authored table.
    const colRows = [];
    for (const c of COLUMNS) {
      const mem = columnMembers.filter(o => Math.abs(o.startSeconds - c.t) < COL_TOL);
      let minGap = Infinity;
      for (const m of mem) {
        const nx = notes[m.layer].find(x => x.startSeconds > m.startSeconds + 1e-6);
        const gap = nx ? nx.startSeconds - m.startSeconds : Infinity;
        if (gap < minGap) minGap = gap;
      }
      const derived = minGap === Infinity ? null : +(minGap - BREATH).toFixed(4);
      if (derived != null && Math.abs(derived - c.ring) > 0.005)
        mismatches.push({ key: 'col' + c.t, parts: [], seg: 'COLUMN ' + c.t.toFixed(2),
          authored: c.ring + ' s ring', measured: derived + ' s', driftMs: null });
      const techs = [...new Set(mem.map(m => m.technique))];
      colRows.push({ t: c.t, n: mem.length, techs, ring: c.ring, derived });
      for (const m of mem) {
        const d = {
          gc: true, goLine: true, ringBar: true, ringSeconds: c.ring,
          nhHead: 'open', nhStem: null, nhDot: false, brick: false,
          curve: false, dynPair: false,
          dynMark: m.technique === 'fortepiano' ? 'sfzp' : false,
        };
        if (m.technique === 'cuivre') d.techText = 'cuivré';
        put(m, d);
      }
    }

    // ---- §6 THE SWELLS ------------------------------------------------
    // Unchanged as devices — curve, 90° cut, go line, nh-unit, ppp→arrow→fff.
    // The ONE change is `curveZero`: the drawn curve is re-mapped to start at
    // 0 instead of at the sounding floor (0.2), so the swell reads as a swell
    // and not as a step. Drawing only; the sounding envelope is untouched.
    for (const o of swells) {
      put(o, { curve: true, cut: true, goLine: true, nhUnit: true, dynPair: true,
               dynMark: false, brick: false, curveZero: true });
    }

    // ---- §3 DYNAMICS: f at each part's first note ---------------------
    for (let L = 0; L < 10; L++) if (notes[L].length) put(notes[L][0], { dynMark: 'f' });

    // ---- §4 + §5 THE PER-PART TEMPO MAP, BAR LINES AND BALL -----------
    const ballTicks = [];        // {part, at, step}
    const mapRows = [];
    const lastBpm = new Array(10).fill(null);
    for (const seg of TEMPO_MAP) {
      const row = { name: seg.name, t0: seg.t0, t1: seg.t1, per: new Array(10).fill(null) };
      // a ball-only passage: no tempo derived, no mark, every lane bounces
      for (const bs of seg.ballSpans || []) {
        const step = 60 / bs.bpm;
        const n = Math.round((bs.t1 - bs.t0) / step);
        for (let L = 0; L < 10; L++)
          for (let k = 0; k <= n; k++)
            ballTicks.push({ part: L, at: +(bs.t0 + k * step).toFixed(4), step: +step.toFixed(4) });
        row.ballOnly = (row.ballOnly || 0) + (n + 1) * 10;
      }
      if (seg.tempo === false) { mapRows.push(row); continue; }
      for (let L = 0; L < 10; L++) {
        const authored = seg.bpm != null ? seg.bpm : (seg.per ? seg.per[L] : null);
        const on = notes[L].filter(o => o.startSeconds >= seg.t0 - 1e-6 && o.startSeconds < seg.t1 - 1e-6)
          .map(o => o.startSeconds);
        if (authored == null || on.length < 2) {
          if (authored != null && on.length < 2)
            flags.push('T' + (L + 1) + ' · ' + seg.name + ': ' + on.length + ' note' + (on.length === 1 ? '' : 's')
              + ' — no tempo mark, no ball (a part needs two notes to be in a tempo)');
          if (authored == null && seg.per && on.length >= 2)
            flags.push('T' + (L + 1) + ' · ' + seg.name + ': the map gives this part no tempo, but it has ' + on.length + ' notes');
          continue;
        }
        const fit = fitGrid(on, 60 / authored);
        row.per[L] = { authored, measured: r1(fit.bpm), step: fit.step, first: on[0], last: on[on.length - 1] };
        if (Math.abs(r1(fit.bpm) - authored) > 0.05) {
          // the number that matters is how far the AUTHORED grid has walked
          // away from the material by the end of the segment — one notehead
          // at page scale is 30 ms (NOTATION_STANDARDS, first principle 4)
          const stepA = 60 / authored;
          let drift = 0;
          for (const x of on) { const k = Math.round((x - fit.anchor) / stepA); drift = Math.max(drift, Math.abs(x - fit.anchor - k * stepA)); }
          const key = seg.name + '|' + authored + '|' + r1(fit.bpm) + '|' + (drift * 1000).toFixed(0);
          const hit = mismatches.find(m => m.key === key);
          if (hit) hit.parts.push('T' + (L + 1));
          else mismatches.push({ key, parts: ['T' + (L + 1)], seg: seg.name, authored, measured: r1(fit.bpm), driftMs: +(drift * 1000).toFixed(0) });
        }
        if (fit.off) flags.push('T' + (L + 1) + ' · ' + seg.name + ': ' + fit.off + ' of ' + fit.n
          + ' note(s) off this part\'s grid by more than a notehead — no ball on them'
          + (fit.anchorIdx ? '; grid anchored on note ' + (fit.anchorIdx + 1) + ', not the first' : ''));

        // the bar line + tempo mark, in THIS part's lane, only where THIS
        // part's tempo changes. A row with no tempo (VERT/CB/SW) does not
        // reset it: the section carries through the columns and the swells.
        const printed = PRINT_MEASURED ? r1(fit.bpm) : authored;
        if (lastBpm[L] == null || Math.abs(lastBpm[L] - printed) > 0.05) {
          overlays.push({
            id: 'ov-' + pfx + '-tempo-p' + L + '-' + overlays.length, kind: 'tempo',
            target: { t: on[0], part: L }, value: { bpm: printed }, provenance: 'authored',
          });
          lastBpm[L] = printed;
        }

        // THE BALL. One per lane, tiled at the part's own step so it is always
        // in flight and lands on every beat of that part's grid — including
        // the beats the part rests through (the composer: the ball shows the
        // grid, the noteheads show your subset). Ticks run from the part's
        // first onset in the segment to its last.
        // The k-window tolerance is HEAD expressed in beats, not an epsilon:
        // a part's first or last onset in a segment can sit a few ms off the
        // exact tick (the phase ladder puts every part's entry at its own
        // fraction of a beat), and a hair-width epsilon rounded those beats
        // AWAY — 26 first/last notes across the section had no ball under it.
        if (seg.ball !== false) {
          const tol = HEAD / fit.step;
          const k0 = Math.ceil((on[0] - fit.anchor) / fit.step - tol);
          const k1 = Math.floor((on[on.length - 1] - fit.anchor) / fit.step + tol);
          for (let k = k0; k <= k1; k++) ballTicks.push({ part: L, at: +(fit.anchor + k * fit.step).toFixed(4), step: +fit.step.toFixed(4) });
        }
      }
      mapRows.push(row);
    }

    // NO DOUBLE BALL AT A SEAM. A ball occupies [at − 0.6·duration,
    // at + 0.4·duration] (the GC's descentRatio), so tiling at `duration =
    // step` makes consecutive balls abut exactly — WITHIN a segment. At a
    // seam the previous segment's step can be longer than the distance to the
    // next segment's first beat, and then two balls are in the lane at once
    // (16 places, worst T4 @603.96: a 1.87 s step with 1.03 s to the next
    // run). Clamping each ball's flight to the distance to the NEXT one keeps
    // the abutment and never lets one overrun its successor. A run's last
    // ball keeps its own step, so the deliberate gaps — the three ball-off
    // windows, and the rest between one segment's last note and the next
    // segment's first — stay gaps.
    for (let L = 0; L < 10; L++) {
      const lane = ballTicks.filter(t => t.part === L).sort((a, b) => a.at - b.at);
      for (let i = 0; i < lane.length - 1; i++) {
        const gap = +(lane[i + 1].at - lane[i].at).toFixed(4);
        if (gap < lane[i].step) lane[i].step = gap;
      }
    }

    // ---- §7 THE PH6 APPARATUS ----------------------------------------
    // The final crescendo, per part: the limeGreen bottom-half curve of the
    // morph machinery (overlay kind `cresc` → cresccurve item + crescMeter
    // follower), sampled from the per-note level ramp the score already
    // carries (y 2.2 → 9.5), normalised to start at 0 and flat after the knee.
    // Plus the ppp → arrow → fff pair at each part's own entry.
    let crescN = 0, pairN = 0;
    for (let L = 0; L < 10; L++) {
      const ph = notes[L].filter(o => o.startSeconds >= PH6.t0 - 1e-6 && o.startSeconds < PH6.t1 + 1e-6);
      if (ph.length < 2) continue;
      const lv = ph.map(o => ({ t: o.startSeconds, y: (o.nodes && o.nodes.length ? o.nodes[0].y : 0) }));
      const y0 = lv[0].y, y1 = Math.max(...lv.map(p => p.y));
      const knee = (lv.find(p => p.y >= y1 - 1e-9) || {}).t;
      if (knee != null && Math.abs(knee - PH6.knee) > 0.6)
        mismatches.push({ key: 'ph6knee', parts: ['T' + (L + 1)], seg: 'PH6 knee',
          authored: PH6.knee + ' s (the "PS6 hold ff" marker)', measured: knee.toFixed(2) + ' s', driftMs: null });
      const span = y1 - y0;
      const smp = [];
      for (let i = 0; i < PH6.samples; i++) {
        const t = PH6.t0 + (PH6.t1 - PH6.t0) * i / (PH6.samples - 1);
        let v;
        if (t <= lv[0].t) v = 0;
        else if (t >= lv[lv.length - 1].t) v = span > 0 ? (lv[lv.length - 1].y - y0) / span : 0;
        else {
          let j = 1; while (j < lv.length && lv[j].t < t) j++;
          const a = lv[j - 1], b = lv[j];
          const y = b.t === a.t ? b.y : a.y + (b.y - a.y) * (t - a.t) / (b.t - a.t);
          v = span > 0 ? (y - y0) / span : 0;
        }
        smp.push(+Math.min(1, Math.max(0, v)).toFixed(5));
      }
      overlays.push({
        id: 'ov-' + pfx + '-cresc-p' + L, kind: 'cresc',
        target: { part: L, span: [PH6.t0, PH6.t1] },
        // fullHeight (day 36, composer: "the curve only reaches half track
        // height, can you make the curve full track height"). The bottom-half
        // default is a MORPH-page convention — there the glissando owns the
        // top half. Nothing glissandos here, so the final crescendo gets the
        // whole lane, and its animated meter follows it.
        value: { samples: smp, fullHeight: true, fit: 'per-note level ramp y ' + y0 + '→' + y1 + ', normalised to start at 0; flat after the knee at ' + (knee != null ? knee.toFixed(2) : '?') + ' s' },
        provenance: 'authored',
      });
      crescN++;
      put(ph[0], { dynPair: true, dynMark: false });   // ppp → arrow → fff at this part's entry
      pairN++;
    }

    // ---- emit the engraving overlays ---------------------------------
    let i = 0;
    for (const o of all) {
      const d = dev.get(o.id);
      if (!d) continue;
      overlays.push({ id: 'ov-' + pfx + '-n' + (i++), kind: 'engraving',
        target: { event: 'ev-' + o.id }, value: { device: d }, provenance: 'authored' });
    }

    return {
      overlays, ballTicks, mapRows, colRows, flags, mismatches,
      inTempo: inTempo.length, columns: columnMembers.length, swells: swells.length,
      cresc: crescN, pairs: pairN, printMeasured: PRINT_MEASURED,
      tempoMarks: overlays.filter(o => o.kind === 'tempo').length,
    };
  }

  return { build, fitGrid, TEMPO_MAP, COLUMNS, PH6, SWELL, BREATH, HEAD, PRINT_MEASURED };
}));
