// graphic.js — Phase C1: the GRAPHIC SCORE view + the first derived-data
// rehearsal lane (architecture §1, the study score's second view).
// Composer's dictation (day 19): "a view just like the composer score —
// bricks and then a meta layer overlay, with shapes, like early graphic
// score representations of electronic pieces", plus "represent the beating
// parts… some general representation of beating speed — so a conductor can
// rehearse the section."
//
// Reads S1 DIRECTLY (read-through — no IR needed, any score renders) and
// derives the beating lane from S1 morphBend pairs by D28's law:
// beat(t) = |f1(t) − f2(t)|, f = 440·2^((midi+bend−69)/12). Pure, dual-load.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationGraphic = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const MIDI_LO = 24, MIDI_HI = 72; // fixed pitch axis for the lanes (tuba terrain)

  const freqOf = m => 440 * Math.pow(2, (m - 69) / 12);

  // piecewise-linear bend (semitones) at absolute time t for a morph note
  function bendAt(o, t) {
    const mb = o.morphBend;
    if (!mb || !mb.length) return 0;
    const dt = t - o.startSeconds;
    if (dt <= mb[0][0]) return mb[0][1];
    for (let i = 1; i < mb.length; i++) {
      if (dt <= mb[i][0]) {
        const [t0, v0] = mb[i - 1], [t1, v1] = mb[i];
        return t1 === t0 ? v1 : v0 + (v1 - v0) * (dt - t0) / (t1 - t0);
      }
    }
    return mb[mb.length - 1][1];
  }

  function soundingFreq(o, t) { return freqOf(o.sonifyNote + bendAt(o, t)); }

  // beating pairs: same base pitch, both morph-bent, overlapping in time
  function beatingCurves(score, [w0, w1], parts, samples) {
    const N = samples || 60;
    const morphs = score.objects.filter(o => o.type === 'waveCurve' && o.morphBend &&
      parts.includes(o.layer) && o.startSeconds < w1 && o.endSeconds > w0);
    const curves = [];
    for (let i = 0; i < morphs.length; i++) for (let j = i + 1; j < morphs.length; j++) {
      const a = morphs[i], b = morphs[j];
      if (a.sonifyNote !== b.sonifyNote) continue;
      const t0 = Math.max(a.startSeconds, b.startSeconds, w0);
      const t1 = Math.min(a.endSeconds, b.endSeconds, w1);
      if (t1 - t0 < 0.2) continue;
      const pts = [];
      let peak = 0;
      for (let k = 0; k <= N; k++) {
        const t = t0 + (t1 - t0) * k / N;
        const hz = Math.abs(soundingFreq(a, t) - soundingFreq(b, t));
        peak = Math.max(peak, hz);
        pts.push([t, hz]);
      }
      curves.push({ label: 'T' + (a.layer + 1) + '/T' + (b.layer + 1) + ' (' + a.sonifyNote + ')', a: a.id, b: b.id, pts, peak });
    }
    return curves;
  }

  function layoutGraphic(score, cfg) {
    const { window: [w0, w1], parts } = cfg;
    const inWin = o => o.startSeconds < w1 && o.endSeconds > w0;
    const bricks = [];
    for (const o of score.objects) {
      if (o.type !== 'waveCurve' || o.layer === 10 || !parts.includes(o.layer)) continue;
      if (!inWin(o)) continue;
      const frac = 1 - Math.min(1, Math.max(0, (o.sonifyNote - MIDI_LO) / (MIDI_HI - MIDI_LO)));
      bricks.push({ part: o.layer, t0: o.startSeconds, t1: o.endSeconds, frac, color: o.color || '#607D8B', morph: !!o.morphBend, id: o.id });
    }
    // META overlay: layer-10 waveCurves, their level envelope (y 0..10) as a shape
    const meta = [];
    for (const o of score.objects) {
      if (o.type !== 'waveCurve' || o.layer !== 10 || !inWin(o)) continue;
      meta.push({
        t0: o.startSeconds, t1: o.endSeconds, color: o.color || '#2E8B57',
        nodes: (o.nodes || []).map(n => ({ pos: n.pos, lvl: Math.min(10, Math.max(0, n.y)) / 10 })),
      });
    }
    const markers = score.objects.filter(o => o.type === 'marker' && o.time >= w0 && o.time <= w1)
      .map(o => ({ time: o.time, label: o.label }));
    const beating = beatingCurves(score, [w0, w1], parts, cfg.samples);
    return { window: [w0, w1], parts, bricks, meta, markers, beating };
  }

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // view must be built over model.parts (+ one extra band appended for the
  // beating lane when model.beating is non-empty — the caller does this via
  // cfg.beatBand = the systemsForParts entry to use).
  function renderGraphic(model, view, opts) {
    const o = Object.assign({ paper: '#fff', muted: '#8a8a8a', metaOpacity: 0.18, brickOpacity: 0.8 }, opts || {});
    const [w0, w1] = view.window;
    const parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + view.widthPx + '" height="' + view.heightPx +
      '" viewBox="0 0 ' + view.widthPx + ' ' + view.heightPx + '" style="background:' + o.paper + '">');
    parts.push('<rect x="0" y="0" width="' + view.widthPx + '" height="' + view.heightPx + '" fill="' + o.paper + '"/>');
    const X = t => view.xOfSeconds(Math.min(w1, Math.max(w0, t)));

    for (const part of model.parts) {
      const sys = view.system(part);
      parts.push('<rect x="0" y="' + sys.yTopPx.toFixed(1) + '" width="' + view.widthPx + '" height="' + sys.heightPx.toFixed(1) + '" fill="#000" opacity="0.035"/>');
      parts.push('<text x="4" y="' + (sys.yTopPx + 12).toFixed(1) + '" font-size="11" font-family="sans-serif" fill="' + o.muted + '">T' + (part + 1) + '</text>');
    }
    for (const b of model.bricks) {
      const sys = view.system(b.part);
      const y = sys.yTopPx + b.frac * sys.heightPx;
      const h = Math.max(3, sys.heightPx * 0.08);
      parts.push('<rect x="' + X(b.t0).toFixed(1) + '" y="' + (y - h / 2).toFixed(1) + '" width="' + Math.max(1.5, X(b.t1) - X(b.t0)).toFixed(1) +
        '" height="' + h.toFixed(1) + '" fill="' + esc(b.color) + '" opacity="' + o.brickOpacity + '"' + (b.morph ? ' rx="2"' : '') + '/>');
    }
    // META overlay spans the full parts area (not the beating lane)
    const yTopAll = view.system(model.parts[0]).yTopPx;
    const yBotAll = view.system(model.parts[model.parts.length - 1]).yBotPx;
    for (const m of model.meta) {
      if (!m.nodes.length) continue;
      const pts = m.nodes.map(n => {
        const t = m.t0 + (m.t1 - m.t0) * n.pos;
        return X(t).toFixed(1) + ',' + (yBotAll - n.lvl * (yBotAll - yTopAll)).toFixed(1);
      });
      const poly = [X(m.t0).toFixed(1) + ',' + yBotAll.toFixed(1)].concat(pts, [X(m.t1).toFixed(1) + ',' + yBotAll.toFixed(1)]);
      parts.push('<polygon points="' + poly.join(' ') + '" fill="' + esc(m.color) + '" opacity="' + o.metaOpacity + '"/>');
    }
    // beating lane (derived data made visible — D28)
    if (model.beating.length && opts && opts.beatBand) {
      const bb = opts.beatBand;
      const hzMax = Math.max(1, ...model.beating.map(c => c.peak));
      parts.push('<rect x="0" y="' + bb.yTopPx.toFixed(1) + '" width="' + view.widthPx + '" height="' + bb.heightPx.toFixed(1) + '" fill="#4E7A9B" opacity="0.06"/>');
      parts.push('<text x="4" y="' + (bb.yTopPx + 12).toFixed(1) + '" font-size="11" font-family="sans-serif" fill="' + o.muted + '">beating (0–' + hzMax.toFixed(1) + ' Hz)</text>');
      model.beating.forEach((c, i) => {
        const pts = c.pts.map(([t, hz]) => X(t).toFixed(1) + ',' + (bb.yBotPx - (hz / hzMax) * bb.heightPx * 0.9).toFixed(1)).join(' ');
        const hue = (i * 67) % 360;
        parts.push('<polyline points="' + pts + '" fill="none" stroke="hsl(' + hue + ',45%,40%)" stroke-width="1.5"/>');
        parts.push('<text x="' + (X(c.pts[0][0]) + 3).toFixed(1) + '" y="' + (bb.yBotPx - (c.pts[0][1] / hzMax) * bb.heightPx * 0.9 - 3).toFixed(1) +
          '" font-size="9" font-family="sans-serif" fill="hsl(' + hue + ',45%,35%)">' + esc(c.label) + '</text>');
      });
    }
    for (const mk of model.markers) {
      parts.push('<text x="' + X(mk.time).toFixed(1) + '" y="12" font-size="10" font-family="sans-serif" fill="' + o.muted + '">' + esc(mk.label) + '</text>');
    }
    parts.push('</svg>');
    return parts.join('\n');
  }

  return { layoutGraphic, renderGraphic, beatingCurves, bendAt, soundingFreq, MIDI_LO, MIDI_HI };
});
