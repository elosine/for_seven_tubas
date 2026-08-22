// render.js — Phase B5: layout model + coords view → SVG string (pass 5).
// Pure, dual-load. The ONLY place pixels exist. Ink is black-on-paper; the
// parachute bricks and read-through labels use muted color so mixed
// fidelity is visible at a glance.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./stamps.js'), require('./gc.js'));
  } else {
    root.NotationRender = factory(root.NotationStamps, root.NotationGC);
  }
})(typeof self !== 'undefined' ? self : this, function (Stamps, GC) {

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function renderSection(model, view, glyphs, opts) {
    const o = Object.assign({ ink: '#111', brick: '#4E7A9B', muted: '#8a8a8a', paper: '#fff' }, opts || {});
    // engraving registry (V0.10/V1): every look number in one mergeable
    // block; code defaults = the census values, so a caller without opts
    // renders identically. The shell passes container.json engraving.render.
    const E = Object.assign({
      fontFamily: 'sans-serif',
      partLabel: { xPx: 4, yOffsetSs: 0.9, sizeSs: 1.1 },
      textScale: 1.3,
      clefInsetSs: 0.6, clefGutterGapSs: 0.75,
      attackLine: { wSs: 0.18, hSs: 2.2, offsetSs: 1.1 },
      tick: { wSs: 0.12, hSs: 0.8 },
      brickOpacity: 0.45,
      reshow: { xSs: 4.2, sizeSs: 0.75 },
      // the env-curve device (day 22, retuned same day by composer verdicts:
      // "no outline to curve" -> fill-only, opacity raised to read alone;
      // "go line not visible" -> thicker/darker dashes, AI-intuited numbers).
      // Green = this piece's surge color (#2E7D32).
      envCurve: { strokeWPx: 0, strokeOpacity: 0, fillOpacity: 0.3, color: '#2E7D32' },
      // go line: near-black (composer, day 22 second note: "always black
      // gray" — the surge green was never meant for it); width/opacity/dash
      // = the retuned numbers, untouched
      goLine: { wPx: 1.5, opacity: 0.85, dash: '5,4', color: '#333' },
      // the ring bar (wc-23 element 2): 2/3 of the brick height, always black
      ringBar: { hSs: 0.667, color: '#111', opacity: 1 },
    }, (opts && opts.engraving) || {});
    const FONT = esc0 => String(esc0).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fontAttr = ' font-family="' + FONT(E.fontFamily).replace(/"/g, '&quot;') + '"';
    const S = Stamps.makeStamps(glyphs);
    const boxFor = g => {
      if (g === 'notehead') return S.notehead();
      if (g === 'notehead-open') return S.noteheadOpen();
      if (g.startsWith('dyn-')) return S.dynamic(g.slice(4));
      if (g === 'flag-up8') return S.flag8('up');
      if (g === 'flag-down8') return S.flag8('down');
      if (g.startsWith('accidental-')) return S.accidental(g.slice('accidental-'.length));
      throw new Error('render: unknown glyph item "' + g + '"');
    };
    const stds = glyphs.standards;
    const parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + view.widthPx + '" height="' + view.heightPx +
      '" viewBox="0 0 ' + view.widthPx + ' ' + view.heightPx + '" style="background:' + o.paper + '">');
    parts.push('<rect x="0" y="0" width="' + view.widthPx + '" height="' + view.heightPx + '" fill="' + o.paper + '"/>');

    const [w0, w1] = view.window;
    // Page ownership is HALF-OPEN at the right edge (an event exactly on a
    // cut belongs to the NEXT page — review finding: it inked on both).
    // The final page of a tiling (or a standalone window) owns its end:
    // pass opts.ownsEnd = true.
    const ownsEnd = !opts || opts.ownsEnd !== false;
    const inWin = t => t >= w0 - 1e-9 && (ownsEnd ? t <= w1 + 1e-9 : t < w1 - 1e-9);

    for (const sysModel of model.systems) {
      let sys;
      try { sys = view.system(sysModel.part); } catch (e) { continue; } // part not in this view
      const ssPx = sys.ssPx;
      const X = (t, dxSs) => view.xOfSeconds(t) + (dxSs || 0) * ssPx;
      const Y = ss => sys.yOfSs(ss);
      parts.push('<g fill="' + o.ink + '">');
      // part label at the left edge (inside the gutter when one exists)
      parts.push('<text x="' + E.partLabel.xPx + '" y="' + (sys.yTopPx + E.partLabel.yOffsetSs * ssPx).toFixed(1) + '" font-size="' + (E.partLabel.sizeSs * ssPx).toFixed(1) +
        '"' + fontAttr + ' fill="' + o.muted + '">T' + (sysModel.part + 1) + '</text>');
      // page-edge rule: a chunk continuing across the cut re-shows its tempo
      // label at the page start (splice.js planPages -> page.reshow)
      for (const rs of (opts && opts.reshow) || []) {
        if (rs.part !== sysModel.part) continue;
        parts.push('<text x="' + (view.gutterPx + E.reshow.xSs * ssPx).toFixed(1) + '" y="' + Y(4.6).toFixed(1) + '" font-size="' +
          (E.reshow.sizeSs * ssPx * E.textScale).toFixed(1) + '"' + fontAttr + ' fill="' + o.muted + '">' + esc(rs.text) + '</text>');
      }

      // DRAWING LAYERS (day 22, composer): notation ink first, the env
      // curve OVER the notation, the go line over the curve. (The animation
      // overlay is its own SVG above everything; within a layer, push order
      // holds — stable sort.)
      const LAYER = k => (k === 'envcurve' ? 1 : k === 'goline' ? 2 : 0);
      const itemsInLayers = [...sysModel.items].sort((a, b) => LAYER(a.k) - LAYER(b.k));
      for (const it of itemsInLayers) {
        if (it.k === 'staff') {
          // staff is FURNITURE: in a free window wider than the material
          // (opts.staffFull, notation-view window mode) the outer segments
          // extend to the view edges instead of stopping where the section
          // ends — "staff lines cut short" verdict, day 22. Interior
          // staff-off spans keep their authored extents.
          const mw = model.window || [it.t0, it.t1];
          const full = opts && opts.staffFull;
          const t0 = (full && it.t0 <= mw[0] + 1e-9) ? w0 : Math.max(it.t0, w0);
          const t1 = (full && it.t1 >= mw[1] - 1e-9) ? w1 : Math.min(it.t1, w1);
          const x0 = view.xOfSeconds(t0), x1 = view.xOfSeconds(t1);
          for (let line = -2; line <= 2; line++) {
            const y = Y(line) - (stds.staff.lineThickness * ssPx) / 2;
            parts.push('<rect x="' + x0.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + (x1 - x0).toFixed(2) +
              '" height="' + (stds.staff.lineThickness * ssPx).toFixed(2) + '"/>');
          }
        } else if (it.k === 'clef') {
          // with a prefatory gutter the clef lives IN the dead space,
          // right-aligned toward the music start (A21c — it must never sit
          // over the first notes); without one it pins to the view's left
          // edge as before (staff furniture, always shown)
          if (view.gutterPx > 0) {
            // clamp at the left edge: a clef too big for the gutter pokes
            // VISIBLY into the music (protrusion-detector territory) rather
            // than vanishing off-screen — invisible failure is worse
            const cw = glyphs.clef.bass.wSs * ssPx;
            const cx = Math.max(2, view.gutterPx - cw - E.clefGutterGapSs * ssPx);
            parts.push(Stamps.toSvg(S.clefBass(), { xPx: cx, yPx: Y(1), ssPx, align: 'fLine' }));
          } else {
            const cx = Math.max(view.xOfSeconds(it.t), 0);
            parts.push(Stamps.toSvg(S.clefBass(), { xPx: cx + E.clefInsetSs * ssPx, yPx: Y(1), ssPx, align: 'fLine' }));
          }
        } else if (it.k === 'glyph') {
          if (!inWin(it.t)) continue;
          parts.push(Stamps.toSvg((it.scale || it.scaleY) ? Stamps.scaled(boxFor(it.g), it.scale || 1, it.scaleY != null ? it.scaleY : (it.scale || 1)) : boxFor(it.g), { xPx: X(it.t, it.dxSs), yPx: Y(it.ySs), ssPx, align: it.align }));
        } else if (it.k === 'stem') {
          if (!inWin(it.t)) continue;
          const x = X(it.t, it.dxSs) - (stds.stem.thickness * ssPx) / 2;
          const yTop = Math.min(Y(it.yA), Y(it.yB)), h = Math.abs(Y(it.yA) - Y(it.yB));
          parts.push('<rect x="' + x.toFixed(2) + '" y="' + yTop.toFixed(2) + '" width="' + (stds.stem.thickness * ssPx).toFixed(2) + '" height="' + h.toFixed(2) + '"/>');
        } else if (it.k === 'dot') {
          if (!inWin(it.t)) continue;
          parts.push('<circle cx="' + X(it.t, it.dxSs).toFixed(2) + '" cy="' + Y(it.ySs).toFixed(2) + '" r="' + (glyphs.standards.staccatoDot.diameter / 2 * ssPx).toFixed(2) + '"/>');
        } else if (it.k === 'ledger') {
          if (!inWin(it.t)) continue;
          // day 22: honor the item's dxSs (was silently dropped — a shifted
          // head left its ledgers behind) and its own head width (the open
          // head is wider than filled)
          const w = (it.wSs || glyphs.notehead.filled.wSs) * (1 + 2 * stds.ledgerLine.lengthFraction) * ssPx;
          parts.push('<rect x="' + (X(it.t, it.dxSs) - w / 2).toFixed(2) + '" y="' + (Y(it.ySs) - stds.ledgerLine.thickness * ssPx / 2).toFixed(2) +
            '" width="' + w.toFixed(2) + '" height="' + (stds.ledgerLine.thickness * ssPx).toFixed(2) + '"/>');
        } else if (it.k === 'beam') {
          const tips = it.tips.filter(p => inWin(p.t));
          if (tips.length < 2) continue;
          // beam thickness extends TOWARD the noteheads: down the page for
          // up-stems, up the page for down-stems (review finding: down-stem
          // beams hung beyond the tips)
          const t = stds.beam.thickness * ssPx * (it.dir === 'down' ? -1 : 1);
          const fwd = tips.map(p => X(p.t, p.dxSs).toFixed(2) + ',' + Y(p.ySs).toFixed(2));
          const back = tips.slice().reverse().map(p => X(p.t, p.dxSs).toFixed(2) + ',' + (Y(p.ySs) + t).toFixed(2));
          parts.push('<polygon points="' + fwd.concat(back).join(' ') + '"/>');
        } else if (it.k === 'text') {
          if (!inWin(it.t)) continue;
          parts.push('<text x="' + X(it.t, it.dxSs).toFixed(1) + '" y="' + Y(it.ySs).toFixed(1) + '" font-size="' + ((it.size || 1) * ssPx * E.textScale).toFixed(1) +
            '"' + fontAttr + ' fill="' + o.muted + '">' + esc(it.text) + '</text>');
        } else if (it.k === 'attackline') {
          if (!inWin(it.t)) continue;
          // M4: a vertical stroke straddling the pitch position
          parts.push('<rect x="' + (X(it.t, 0) - E.attackLine.wSs / 2 * ssPx).toFixed(2) + '" y="' + (Y(it.ySs + E.attackLine.offsetSs)).toFixed(2) +
            '" width="' + (E.attackLine.wSs * ssPx).toFixed(2) + '" height="' + (E.attackLine.hSs * ssPx).toFixed(2) + '"/>');
        } else if (it.k === 'tick') {
          if (!inWin(it.t)) continue;
          parts.push('<rect x="' + (X(it.t, 0) - E.tick.wSs / 2 * ssPx).toFixed(2) + '" y="' + (Y(it.ySs) - E.tick.hSs * ssPx).toFixed(2) +
            '" width="' + (E.tick.wSs * ssPx).toFixed(2) + '" height="' + (E.tick.hSs * ssPx).toFixed(2) + '"/>');
        } else if (it.k === 'envcurve') {
          // the drawn level curve over the FULL lane band (piece #1: value
          // 0..1 maps bottom -> top of the track), clipped to the window
          if (it.t1 < w0 || it.t0 > w1) continue;
          const EC = E.envCurve;
          const yT = sys.yTopPx, yB = sys.yBotPx;
          // cut (surge): the RISE, truncated at its peak sample, is mapped
          // over the FULL note span so it meets the note end at full height —
          // a SHARP top-right corner, then the 90° vertical back edge (the
          // fill closure). Round 2 verdict: the first build held a 2% shelf
          // at the peak ("why it isn't a sharp right top corner"); the shelf
          // was the drawn cut-ramp's honest x — legibility wins, the <=2%
          // time stretch of the rise is accepted. Sounding data untouched.
          let samples = it.samples;
          if (it.cut) {
            let iMax = 0;
            for (let i = 1; i < samples.length; i++) if (samples[i] > samples[iMax]) iMax = i;
            if (iMax >= 1) samples = samples.slice(0, iMax + 1);
          }
          const n = samples.length;
          const pts = [];
          for (let i = 0; i < n; i++) {
            const t = it.t0 + (it.t1 - it.t0) * (i / (n - 1));
            if (t < w0 - 1e-9 || t > w1 + 1e-9) continue;
            pts.push([view.xOfSeconds(t), yB - samples[i] * (yB - yT)]);
          }
          if (pts.length >= 2) {
            const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
            if (EC.fillOpacity > 0) {
              parts.push('<path d="' + line + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + yB.toFixed(1) +
                ' L' + pts[0][0].toFixed(1) + ',' + yB.toFixed(1) + ' Z" fill="' + EC.color +
                '" fill-opacity="' + EC.fillOpacity + '" stroke="none"/>');
            }
            if (EC.strokeWPx > 0 && EC.strokeOpacity > 0) {
              parts.push('<path d="' + line + '" fill="none" stroke="' + EC.color + '" stroke-width="' + EC.strokeWPx +
                '" stroke-opacity="' + EC.strokeOpacity + '"/>');
            }
          }
        } else if (it.k === 'dynarrow') {
          // the surge's hairpin replacement: a short rightward arrow between
          // the two marks — line + solid triangular head, stem-thickness
          if (!inWin(it.t)) continue;
          const x0 = X(it.t, it.dx0Ss), x1 = X(it.t, it.dx1Ss);
          const yA = Y(it.ySs);
          const headL = (it.headSs || 0.45) * ssPx, thick = (it.thickSs || 0.13) * ssPx;
          parts.push('<line x1="' + x0.toFixed(2) + '" y1="' + yA.toFixed(2) + '" x2="' + (x1 - headL).toFixed(2) +
            '" y2="' + yA.toFixed(2) + '" stroke="#111" stroke-width="' + thick.toFixed(2) + '"/>');
          parts.push('<path d="M' + x1.toFixed(2) + ',' + yA.toFixed(2) +
            ' L' + (x1 - headL).toFixed(2) + ',' + (yA - headL * 0.45).toFixed(2) +
            ' L' + (x1 - headL).toFixed(2) + ',' + (yA + headL * 0.45).toFixed(2) + ' Z"/>');
        } else if (it.k === 'ottava') {
          // piece #2 session-57 bracket over the NOTEHEAD ONLY (round 2):
          // label · dashes RIGHT-ALIGNED stepping back from the hook (p2's
          // emitDashes — the connecting dash meets the hook, forming the L),
          // hook at the head's right edge. Geometry: glyphs.standards.ottava.
          if (!inWin(it.t)) continue;
          const O = stds.ottava || {};
          const lg = glyphs.ottavaText && glyphs.ottavaText[it.label];
          const yLine = Y(it.ySs);
          let xLabel = X(it.t, it.dx0Ss || 0);
          const xHook = X(it.t, it.dx1Ss || 0);
          // a too-narrow unit widens the bracket leftward to its minimum span
          const minSpan = (O.minBracketSpanSs || 1.37) * ssPx;
          const lgW = lg ? (lg.wSs + (O.textGapBeforeLineSs || 0.1)) * ssPx : 0;
          if (xHook - (xLabel + lgW) < minSpan) xLabel = xHook - minSpan - lgW;
          let xDashStart = xLabel;
          if (lg) {
            // text baseline straddles the line (lineAttachAboveBaselineSs)
            const ty = yLine + (O.lineAttachAboveBaselineSs || 0.32) * ssPx - lg.hSs * ssPx;
            parts.push('<g transform="translate(' + xLabel.toFixed(2) + ',' + ty.toFixed(2) + ') scale(' + ssPx + ')">' +
              '<path d="' + lg.path + '"/></g>');
            xDashStart = xLabel + lgW;
          }
          const thick = (O.lineThicknessSs || 0.067) * ssPx;
          const dashLen = (O.dashLengthSs || 0.3) * ssPx, dashGap = (O.gapBetweenDashesSs || 0.7) * ssPx;
          let xEnd = xHook;
          while (xEnd - dashLen >= xDashStart - 1e-6) {
            parts.push('<line x1="' + (xEnd - dashLen).toFixed(2) + '" y1="' + yLine.toFixed(2) + '" x2="' + xEnd.toFixed(2) +
              '" y2="' + yLine.toFixed(2) + '" stroke="#111" stroke-width="' + thick.toFixed(2) + '"/>');
            xEnd -= dashLen + dashGap;
          }
          // hook extends from the line BACK TOWARD the staff
          const hook = (O.hookLengthSs || 0.8) * ssPx * (it.dir === 'above' ? 1 : -1);
          parts.push('<line x1="' + xHook.toFixed(2) + '" y1="' + yLine.toFixed(2) + '" x2="' + xHook.toFixed(2) +
            '" y2="' + (yLine + hook).toFixed(2) + '" stroke="#111" stroke-width="' + thick.toFixed(2) + '"/>');
        } else if (it.k === 'goline') {
          // dotted vertical at go time, full lane band (piece #1's go-time
          // marker: 0.5 @ 0.4, dasharray 2,2)
          if (!inWin(it.t)) continue;
          const GL = E.goLine;
          const gx = view.xOfSeconds(it.t).toFixed(2);
          parts.push('<line x1="' + gx + '" y1="' + sys.yTopPx.toFixed(1) + '" x2="' + gx + '" y2="' + sys.yBotPx.toFixed(1) +
            '" stroke="' + GL.color + '" stroke-width="' + GL.wPx + '" stroke-opacity="' + GL.opacity +
            '" stroke-dasharray="' + GL.dash + '"/>');
        } else if (it.k === 'gc') {
          // THE GC OBJECT's static ink (day 23, piece #1's renderGC verbatim):
          // the trajectory polyline across TIME, stroke = the GC color at
          // 1.5 px, no fill; the impact marker r 4 px on the go line, 5 px
          // above the lane bottom. Sizes at the 1080 frame × magnification.
          // Clipped to the page like the ring bar (an arc may cross a cut).
          const P = GC.params(Object.assign({}, (E.gc && E.gc.preset) || {}, it.preset || {}));
          if (it.t + P.post < w0 || it.t - P.pre > w1) continue;
          const G = GC.laneGeom(sys, view, E.gc && E.gc.look);
          const color = (E.gc && E.gc.color) || G.look.color;
          const d = GC.trajectory(P).map((p, i) =>
            (i ? 'L' : 'M') + view.xOfSeconds(it.t + p.dt).toFixed(2) + ' ' + (G.impactY - p.frac * G.h).toFixed(2)).join(' ');
          parts.push('<path class="gc-arc" d="' + d + '" stroke="' + color + '" stroke-width="' + (G.look.arcStrokePx * G.k).toFixed(2) + '" fill="none"/>');
          if (inWin(it.t)) parts.push('<circle class="gc-impact" cx="' + view.xOfSeconds(it.t).toFixed(2) + '" cy="' + G.impactY.toFixed(2) +
            '" r="' + (G.look.impactRadiusPx * G.k).toFixed(2) + '" fill="' + color + '"/>');
        } else if (it.k === 'ringbar') {
          // the sounding-length bar: left edge flush with the go line,
          // right edge at onset + sounding length, centered on the written
          // head; clipped to the page like a brick
          if (it.t1 < w0 || it.t0 > w1) continue;
          const RB = E.ringBar;
          const x0 = view.xOfSeconds(Math.max(it.t0, w0)), x1 = view.xOfSeconds(Math.min(it.t1, w1));
          const h = RB.hSs * ssPx;
          parts.push('<rect x="' + x0.toFixed(2) + '" y="' + (Y(it.ySs) - h / 2).toFixed(2) + '" width="' + Math.max(1, x1 - x0).toFixed(2) +
            '" height="' + h.toFixed(2) + '" fill="' + RB.color + '" opacity="' + RB.opacity + '"/>');
        } else if (it.k === 'brick') {
          if (o.hideBricks) continue;   // day 22: the bricks toggle
          if (it.t1 < w0 || it.t0 > w1) continue;
          const x0 = view.xOfSeconds(Math.max(it.t0, w0)), x1 = view.xOfSeconds(Math.min(it.t1, w1));
          // native tooltip (day 22): hover a brick to see what it is; the
          // brick must opt back into pointer events — the sheet SVG is
          // otherwise passive and the anim overlay above is pointer-inert.
          const tip = it.tip ? '<title>' + esc(it.tip) + '</title>' : '';
          parts.push('<rect x="' + x0.toFixed(2) + '" y="' + (Y(it.ySs) - 0.5 * ssPx).toFixed(2) + '" width="' + Math.max(1, x1 - x0).toFixed(2) +
            '" height="' + (1 * ssPx).toFixed(2) + '" fill="' + o.brick + '" opacity="' + E.brickOpacity + '"' +
            (tip ? ' pointer-events="all">' + tip + '</rect>' : '/>'));
        }
      }
      parts.push('</g>');
    }

    // read-through marker labels along the top (S1, not IR — passed in opts)
    for (const mk of (opts && opts.markers) || []) {
      if (!inWin(mk.time)) continue;
      parts.push('<text x="' + view.xOfSeconds(mk.time).toFixed(1) + '" y="12" font-size="10" font-family="sans-serif" fill="' + o.muted + '">' + esc(mk.label) + '</text>');
    }
    parts.push('</svg>');
    return parts.join('\n');
  }

  return { renderSection };
});
