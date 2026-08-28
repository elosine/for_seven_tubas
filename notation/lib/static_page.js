// static_page.js — ONE definition of "the notation page with no animated layer".
//
// Why this exists (day 37): the video exporter and the print exporter must draw
// the same page. They had drifted before they even shipped — export_video.js
// carried `staticSvg()` as a private function, so the print score would have
// been a SECOND hand-copy of the same six decisions (D4 bricks off, D4 META
// off, the terminal barline, the engraving registry). The precedent is
// `notation/lib/morph_overlays.js`, shared by notate_morph and notate_section
// for exactly this reason: two tools that must agree share the code that makes
// them agree, rather than agreeing by inspection.
//
// The page is resolution-independent by construction: `model` is in staff-space
// units and `view` maps it to a canvas, so the SAME model draws a 1920x1080
// video frame and a 1224x792 pt tabloid page with no branch in here.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./render.js'));
  } else {
    root.NotationStaticPage = factory(root.NotationRender);
  }
})(typeof self !== 'undefined' ? self : this, function (Render) {

  // The static notation page: everything the composer approved, minus the
  // cursor/meters/ball. Returns an SVG string.
  //
  //   model    layout model from Layout.layoutSection
  //   view     Coords.makeView(cfg) — carries widthPx/heightPx/window/systems
  //   glyphs   glyphs.json
  //   C        container.json (registry)
  //   srcEnd   ir.source.window[1] — where the terminal barline goes
  //   reshow   page.reshow (tempo-label continuations)
  //   ownsEnd  true if this page carries the end of the piece
  //   markers  optional read-through labels; omit for the video (D4: META off)
  //   append   optional SVG injected just before </svg> (print furniture)
  function staticPageSvg(o) {
    const C = o.C || {};
    const view = o.view;
    const opts = {
      reshow: o.reshow, ownsEnd: o.ownsEnd,
      engraving: (C.engraving && C.engraving.render) || {},
      hideBricks: true,          // D4: bricks off
    };
    // render.js reads `(opts && opts.markers) || []`, so an absent key and an
    // undefined one are the same thing — the video path stays byte-identical.
    if (o.markers) opts.markers = o.markers;
    const svg = Render.renderSection(o.model, view, o.glyphs, opts);

    // the system TERMINAL barline, exactly as notation.html appends it
    const eb = ((C.engraving && C.engraving.render) || {}).systemEndBar;
    let endBar = '';
    if (eb && view.systems.length) {
      const ys = view.systems[0].yTopPx, ye = view.systems[view.systems.length - 1].yBotPx;
      const xEnd = (o.srcEnd > view.window[0] && o.srcEnd < view.window[1]) ? view.xOfSeconds(o.srcEnd) : view.widthPx;
      endBar = '<rect x="' + (xEnd - eb.wPx).toFixed(2) + '" y="' + ys.toFixed(1) +
        '" width="' + eb.wPx + '" height="' + (ye - ys).toFixed(1) + '" fill="#111" opacity="' + (eb.opacity || 0.55) + '"/>';
    }
    // NO metaOverlaySvg: D4 says META off, and the app returns '' for it then.
    return svg.replace('</svg>', endBar + (o.append || '') + '</svg>');
  }

  return { staticPageSvg };
});
