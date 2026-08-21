// render.js — Phase B5: layout model + coords view → SVG string (pass 5).
// Pure, dual-load. The ONLY place pixels exist. Ink is black-on-paper; the
// parachute bricks and read-through labels use muted color so mixed
// fidelity is visible at a glance.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./stamps.js'));
  } else {
    root.NotationRender = factory(root.NotationStamps);
  }
})(typeof self !== 'undefined' ? self : this, function (Stamps) {

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
    }, (opts && opts.engraving) || {});
    const FONT = esc0 => String(esc0).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fontAttr = ' font-family="' + FONT(E.fontFamily).replace(/"/g, '&quot;') + '"';
    const S = Stamps.makeStamps(glyphs);
    const boxFor = g => {
      if (g === 'notehead') return S.notehead();
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

      for (const it of sysModel.items) {
        if (it.k === 'staff') {
          const x0 = view.xOfSeconds(Math.max(it.t0, w0)), x1 = view.xOfSeconds(Math.min(it.t1, w1));
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
          parts.push(Stamps.toSvg(boxFor(it.g), { xPx: X(it.t, it.dxSs), yPx: Y(it.ySs), ssPx, align: it.align }));
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
          const w = glyphs.notehead.filled.wSs * (1 + 2 * stds.ledgerLine.lengthFraction) * ssPx;
          parts.push('<rect x="' + (X(it.t, 0) - w / 2).toFixed(2) + '" y="' + (Y(it.ySs) - stds.ledgerLine.thickness * ssPx / 2).toFixed(2) +
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
        } else if (it.k === 'brick') {
          if (it.t1 < w0 || it.t0 > w1) continue;
          const x0 = view.xOfSeconds(Math.max(it.t0, w0)), x1 = view.xOfSeconds(Math.min(it.t1, w1));
          parts.push('<rect x="' + x0.toFixed(2) + '" y="' + (Y(it.ySs) - 0.5 * ssPx).toFixed(2) + '" width="' + Math.max(1, x1 - x0).toFixed(2) +
            '" height="' + (1 * ssPx).toFixed(2) + '" fill="' + o.brick + '" opacity="' + E.brickOpacity + '"/>');
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
