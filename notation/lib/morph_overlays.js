// morph_overlays.js — the morph-section notation, as overlays.
//
// One place computes the vocabulary the composer settled on day 35, so that
// BOTH the standalone page builder (tools/notate_morph.js) and the main-draft
// builder (tools/notate_section.js --morph <groupId>) produce the same thing.
// Read docs/MORPH_NOTATION.md before changing any number here.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../score/public/sonify_core.js'));
  else root.MorphOverlays = factory(root.SonifyCore);
}(typeof self !== 'undefined' ? self : this, function (Core) {

  // capped at 25 anchors: past that the curve stops interpolating the gesture
  // and starts tracing the sounding data, wobble included
  const LADDER = [9, 13, 17, 21, 25];
  const NS = 400;
  const STEPS = { 0: ['C', 0], 1: ['C', 1], 2: ['D', 0], 3: ['D', 1], 4: ['E', 0], 5: ['F', 0],
                  6: ['F', 1], 7: ['G', 0], 8: ['G', 1], 9: ['A', 0], 10: ['A', 1], 11: ['B', 0] };

  function crom(P, x) {
    const n = P.length - 1, f = x * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
      + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  }

  // Build every overlay one part of one morph group needs.
  //   objects : the score's waveCurve objects (any superset)
  //   groupId : e.g. 'grp-act-bloom-01-01'
  //   part    : 0-9
  //   idBase  : prefix for overlay ids, so two callers cannot collide
  function forPart(objects, groupId, part, idBase) {
    const tones = objects
      .filter(o => o.groupId === groupId && o.layer === part && o.type === 'waveCurve')
      .sort((a, b) => a.startSeconds - b.startSeconds);
    if (!tones.length) return null;
    const T0 = tones[0].startSeconds, T1 = tones[tones.length - 1].endSeconds;

    function sample(kind, n) {
      const out = []; let last = 0;
      for (let i = 0; i <= n; i++) {
        const t = T0 + (i / n) * (T1 - T0);
        const o = tones.find(x => t >= x.startSeconds && t <= x.endSeconds);
        // PITCH IS note + bend. morphBend is kept inside +/-199 c by RE-SPELLING:
        // a far-travelling voice shifts note number and the bend re-centres ~97 c
        // the other way. Fitting the bend alone gave a 90 c error on CONVERGE that
        // no number of anchors could fix. (day 35)
        if (o) last = kind === 'bend'
          ? o.sonifyNote * 100 + Core.morphBendAt(o.morphBend, t - o.startSeconds)
          : Core.evalWaveCurve(o, (t - o.startSeconds) / (o.endSeconds - o.startSeconds));
        out.push(last);
      }
      return out;
    }
    // the anchor count is MEASURED: smallest whose rms is within 25 % of the best
    function fit(kind) {
      const fine = sample(kind, 1200);
      const trials = LADDER.map(n => {
        const P = []; for (let k = 0; k < n; k++) P.push(fine[Math.round(k / (n - 1) * (fine.length - 1))]);
        let m = 0, ss = 0;
        for (let i = 0; i < fine.length; i++) { const d = Math.abs(crom(P, i / (fine.length - 1)) - fine[i]); if (d > m) m = d; ss += d * d; }
        return { n, P, max: m, rms: Math.sqrt(ss / fine.length) };
      });
      const best = Math.min(...trials.map(t => t.rms));
      const pick = trials.find(t => t.rms <= best * 1.25);
      // normalise to the curve's OWN min..max — the composer's principle: the
      // bottom of the drawn curve is the lowest pitch reached in the section,
      // the top the highest, whatever the interval
      const lo = Math.min(...fine), hi = Math.max(...fine), spread = (hi - lo) || 1;
      const samples = [];
      for (let i = 0; i <= NS; i++) samples.push(+Math.max(0, Math.min(1, (crom(pick.P, i / NS) - lo) / spread)).toFixed(5));
      return { samples, anchors: pick.n, max: pick.max, rms: pick.rms, fine, lo, hi };
    }
    const G = fit('bend'), L = fit('level');

    const baseMidi = tones[0].sonifyNote;
    const extent = G.hi - G.lo, startC = G.fine[0];
    const dir = (G.hi - startC) >= (startC - G.lo) ? 1 : -1;
    // a non-zero glissando is written as AT LEAST one quarter tone, in the
    // direction it travels — a choice to show the gesture, not a rounding
    const qSteps = Math.max(extent > 1 ? 1 : 0, Math.round(extent / 50));
    const acc = qSteps === 0 ? null : (dir > 0 ? 'quarterSharp' : 'quarterFlat');
    const accOn = qSteps === 0 ? null : (dir > 0 ? 'high' : 'low');
    const sp = STEPS[((baseMidi % 12) + 12) % 12];
    const spelled = { step: sp[0], alter: sp[1], octave: Math.floor(baseMidi / 12) - 1 };

    const pfx = idBase + '-p' + part;
    const overlays = [
      { id: 'ov-cresc-' + pfx, kind: 'cresc', target: { part, span: [T0, T1] },
        value: { samples: L.samples, fit: L.anchors + ' anchors; max ' + L.max.toFixed(3) },
        provenance: 'authored' },
      { id: 'ov-header-' + pfx, kind: 'header', target: { part, t: T0 },
        value: { endMark: 'fff', acc, accOn, oneHead: qSteps === 0 }, provenance: 'authored' },
    ];
    if (qSteps > 0) overlays.unshift(
      { id: 'ov-gliss-' + pfx, kind: 'gliss', target: { part, span: [T0, T1] },
        value: { samples: G.samples, fit: G.anchors + ' anchors; max ' + G.max.toFixed(2) + ' c' },
        provenance: 'authored' });

    tones.forEach((o, i) => {
      overlays.push({ id: 'ov-dev-' + pfx + '-' + (i + 1), kind: 'engraving',
        target: { event: 'ev-' + o.id },
        value: { device: {
          goLine: true,
          // NO onset heads anywhere on the curve — settled day 35. The go line is
          // the only per-breath mark. A beating-speed indicator may join it later.
          onsetHead: false, onsetAcc: null,
          brick: false, nhUnit: false, gc: false, ringBar: false,
          curve: false, cut: false, dynPair: false, dynMark: false, techText: false
        } }, provenance: 'authored' });
    });

    return { part, tones, T0, T1, G, L, baseMidi, spelled, extent, qSteps, acc, overlays };
  }

  // Every part of a group. `parts` optional; defaults to whatever the group has.
  function forGroup(objects, groupId, parts, idBase) {
    const present = [...new Set(objects
      .filter(o => o.groupId === groupId && o.type === 'waveCurve' && o.layer < 10)
      .map(o => o.layer))].sort((a, b) => a - b);
    const want = parts && parts.length ? present.filter(p => parts.indexOf(p) >= 0) : present;
    return want.map(p => forPart(objects, groupId, p, idBase || groupId)).filter(Boolean);
  }

  return { forPart, forGroup, crom, LADDER };
}));
