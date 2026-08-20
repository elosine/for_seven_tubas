// coords.js — THE coordinate module (Phase B2, plan DB-2; architecture §5).
// ONE module owns every translation between units; every other module CALLS
// it; nothing duplicates the math; mirrors are a smell (piece #2
// COORDINATE_SYSTEM_VISION §5). Pure, dual-load, no state, no DOM.
//
// The three-layer stack (architecture §5):
//   1. score time in SECONDS   — canonical, persistent (the strip)
//   2. lane-relative units     — persistent, viewport-invariant:
//        · lane FRACTION places SYSTEMS (the meta-structure level)
//        · STAFF-SPACE (ss) is the unit inside a system (glyph metrics)
//   3. pixels                  — exist only through a View, stored nowhere
//
// SZ-7 lesson adopted: ss is LANE-RELATIVE — ssPx derives from the system
// band's height (ssPerSystem vertical ss per band), so a resize rescales
// everything coherently and no absolute-pixel calibration can break.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationCoords = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const DEFAULTS = {
    ssPerSystem: 12,   // vertical ss a system band spans (staff 4ss + air above/below)
  };

  // Equal-band meta-structure: N parts stacked top to bottom with fractional
  // padding and gaps. Returns [{part, laneFrac0, laneFrac1}] — laneFrac 0 is
  // the TOP of the viewport, 1 the bottom (screen convention, stated once).
  function systemsForParts(parts, opts) {
    const o = Object.assign({ topPad: 0.02, botPad: 0.02, gap: 0.01 }, opts || {});
    const n = parts.length;
    const usable = 1 - o.topPad - o.botPad - o.gap * (n - 1);
    if (usable <= 0) throw new Error('coords: padding/gaps leave no room for ' + n + ' systems');
    const h = usable / n;
    return parts.map((part, i) => {
      const f0 = o.topPad + i * (h + o.gap);
      return { part, laneFrac0: f0, laneFrac1: f0 + h };
    });
  }

  // A View binds the persistent layers to one viewport. All px appear here
  // and only here.
  //   cfg: { widthPx, heightPx, window: [t0, t1], systems, ssPerSystem? }
  function makeView(cfg) {
    const { widthPx, heightPx } = cfg;
    const [t0, t1] = cfg.window;
    if (!(t1 > t0)) throw new Error('coords: window must increase');
    if (!(widthPx > 0 && heightPx > 0)) throw new Error('coords: viewport must be positive');
    const ssPerSystem = cfg.ssPerSystem || DEFAULTS.ssPerSystem;
    const pxPerSecond = widthPx / (t1 - t0);

    const xOfSeconds = t => (t - t0) * pxPerSecond;
    const secondsOfX = x => t0 + x / pxPerSecond;
    const yOfLaneFrac = f => f * heightPx;
    const laneFracOfY = y => y / heightPx;

    const systems = cfg.systems.map(s => {
      const yTopPx = yOfLaneFrac(s.laneFrac0);
      const yBotPx = yOfLaneFrac(s.laneFrac1);
      const hPx = yBotPx - yTopPx;
      const ssPx = hPx / ssPerSystem;                 // SZ-7: lane-relative
      const yMidPx = (yTopPx + yBotPx) / 2;           // staff middle line
      return {
        part: s.part,
        yTopPx, yBotPx, heightPx: hPx, ssPx, yMidPx,
        // vertical position from a ss offset relative to the staff middle
        // line; +ss goes UP on the page (musical convention), so px go down.
        yOfSs: ss => yMidPx - ss * ssPx,
        ssOfY: y => (yMidPx - y) / ssPx,
        pxOfSs: ss => ss * ssPx,                      // lengths (unsigned)
      };
    });
    const byPart = new Map(systems.map(s => [s.part, s]));

    return {
      widthPx, heightPx, window: [t0, t1], pxPerSecond, ssPerSystem,
      xOfSeconds, secondsOfX, yOfLaneFrac, laneFracOfY,
      systems,
      system: part => {
        const s = byPart.get(part);
        if (!s) throw new Error('coords: no system for part ' + part);
        return s;
      },
    };
  }

  return { makeView, systemsForParts, DEFAULTS };
});
