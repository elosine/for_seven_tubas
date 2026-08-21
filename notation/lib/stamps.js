// stamps.js — typed boxes with anchors (Phase B3; architecture §4).
// "Anchors compose; positions don't" (piece #2 P3): a stamp is a BOX —
// {kind, wSs, hSs, anchors, prims} — in box-local staff-space coordinates
// (top-left origin, y down). Layout places boxes by aligning anchors; the
// SVG path is a leaf nothing ever reads. All prims are FILLS (no strokes),
// so one uniform scale by ssPx renders everything.
//
// Pure, dual-load. Glyph data comes from notation/lib/glyphs.json (ported,
// provenance-carrying); the caller supplies it — no filesystem access here.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationStamps = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const box = (kind, wSs, hSs, anchors, prims) => ({ kind, wSs, hSs, anchors, prims });
  const pathPrim = d => ({ type: 'path', d });
  const rectPrim = (x, y, w, h) => ({ type: 'rect', x, y, w, h });
  const circlePrim = (cx, cy, r) => ({ type: 'circle', cx, cy, r });
  const polyPrim = pts => ({ type: 'poly', pts });

  function makeStamps(G) {
    const S = G.standards;

    function notehead() {
      const g = G.notehead.filled;
      return box('notehead', g.wSs, g.hSs, g.anchors, [pathPrim(g.path)]);
    }

    // day 22 (nh-unit): the OPEN head (piece #2 halfNote), used stemless
    function noteheadOpen() {
      const g = G.notehead.open;
      return box('noteheadOpen', g.wSs, g.hSs, g.anchors, [pathPrim(g.path)]);
    }

    // engraved dynamic mark ('ppp'..'fff', 'sfz', 'sff')
    function dynamic(kind) {
      const g = G.dynamic && G.dynamic[kind];
      if (!g) throw new Error('stamps: no dynamic "' + kind + '"');
      return box('dyn-' + kind, g.wSs, g.hSs, { center: { x: g.wSs / 2, y: g.hSs / 2 } }, [pathPrim(g.path)]);
    }

    // ottava label: baked project-font outline ('va8' | 'vb8')
    function ottavaText(kind) {
      const g = G.ottavaText[kind];
      if (!g) throw new Error('stamps: no ottavaText "' + kind + '"');
      return box('ottava-' + kind, g.wSs, g.hSs, { center: { x: g.wSs / 2, y: g.hSs / 2 } }, [pathPrim(g.path)]);
    }

    // A stem is a thin filled rect. dir 'up': rises from the notehead's
    // stemAttachUp; 'down': descends from stemAttachDown. Anchors: root
    // (where it meets the notehead) and tip (where a flag/beam attaches).
    function stem(lengthSs, dir) {
      const t = S.stem.thickness;
      const L = Math.max(lengthSs, S.stem.minLength);
      const anchors = dir === 'up'
        ? { root: { x: t / 2, y: L }, tip: { x: t / 2, y: 0 } }
        : { root: { x: t / 2, y: 0 }, tip: { x: t / 2, y: L } };
      return box('stem', t, L, anchors, [rectPrim(0, 0, t, L)]);
    }

    function flag8(dir) {
      const g = dir === 'up' ? G.flag.up8 : G.flag.down8;
      return box('flag8' + dir, g.wSs, g.hSs, { stemTip: g.anchors.stemTip }, [pathPrim(g.path)]);
    }

    function clefBass() {
      const g = G.clef.bass;
      return box('clefBass', g.wSs, g.hSs, g.anchors, [pathPrim(g.path)]);
    }

    function accidental(kind) {
      const g = G.accidental[kind];
      if (!g) throw new Error('stamps: no accidental "' + kind + '"');
      const anchors = Object.assign({ center: { x: g.wSs / 2, y: g.hSs / 2 } }, g.anchors || {});
      return box('accidental-' + kind, g.wSs, g.hSs, anchors, [pathPrim(g.path)]);
    }

    function staccatoDot() {
      const d = S.staccatoDot.diameter;
      return box('staccatoDot', d, d, { center: { x: d / 2, y: d / 2 } }, [circlePrim(d / 2, d / 2, d / 2)]);
    }

    // 5-line staff segment of a given width; anchors give each line's y so
    // layout can align pitches; middle line = line index 2 (0 = top).
    function staffLines(widthSs) {
      const t = S.staff.lineThickness, n = S.staff.lineCount, gap = S.staff.interLineSpace;
      const hSs = (n - 1) * gap + t;
      const prims = [], anchors = {};
      for (let i = 0; i < n; i++) {
        const yCenter = i * gap + t / 2;
        prims.push(rectPrim(0, yCenter - t / 2, widthSs, t));
        anchors['line' + i] = { x: 0, y: yCenter };
      }
      anchors.middle = anchors.line2;
      return box('staff', widthSs, hSs, anchors, prims);
    }

    function ledgerLine(noteheadWSs) {
      const t = S.ledgerLine.thickness;
      const w = noteheadWSs * (1 + 2 * S.ledgerLine.lengthFraction);
      return box('ledger', w, t, { center: { x: w / 2, y: t / 2 } }, [rectPrim(0, 0, w, t)]);
    }

    // Beam segment between two stem tips, box-local: a parallelogram with
    // VERTICAL thickness (piece #2 standard 0.40 ss). Endpoints are the two
    // stem-tip anchor points, expressed relative to the box's own top-left.
    function beamSeg(x0, y0, x1, y1) {
      const t = S.beam.thickness;
      const minX = Math.min(x0, x1), minY = Math.min(y0, y1);
      const a = { x: x0 - minX, y: y0 - minY }, b = { x: x1 - minX, y: y1 - minY };
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0) + t;
      return box('beam', w, h, { start: a, end: b }, [
        polyPrim([[a.x, a.y], [b.x, b.y], [b.x, b.y + t], [a.x, a.y + t]]),
      ]);
    }

    return { notehead, noteheadOpen, ottavaText, dynamic, stem, flag8, clefBass, accidental, staccatoDot, staffLines, ledgerLine, beamSeg };
  }

  // Render one placed box to an SVG fragment. Placement: the box's LOCAL
  // anchor `align` lands at (xPx, yPx); everything scales by ssPx.
  function toSvg(b, place) {
    const { xPx, yPx, ssPx, align, fill } = place;
    const a = align ? b.anchors[align] : { x: 0, y: 0 };
    if (align && !a) throw new Error('stamps: box ' + b.kind + ' has no anchor "' + align + '"');
    const tx = xPx - a.x * ssPx, ty = yPx - a.y * ssPx;
    const parts = [];
    for (const p of b.prims) {
      if (p.type === 'path') parts.push('<path d="' + p.d + '"/>');
      else if (p.type === 'rect') parts.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '"/>');
      else if (p.type === 'circle') parts.push('<circle cx="' + p.cx + '" cy="' + p.cy + '" r="' + p.r + '"/>');
      else if (p.type === 'poly') parts.push('<polygon points="' + p.pts.map(q => q.join(',')).join(' ') + '"/>');
    }
    return '<g transform="translate(' + tx.toFixed(3) + ' ' + ty.toFixed(3) + ') scale(' + ssPx.toFixed(5) + ')"' +
      (fill ? ' fill="' + fill + '"' : '') + '>' + parts.join('') + '</g>';
  }

  return { makeStamps, toSvg };
});
