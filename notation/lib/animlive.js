// animlive.js — 9a: THE A2 RENDERER (docs/DESIGN.md §7, REQUIREMENTS AR-50).
//
// The live overlay's RETAINED twin of NotationAnimObj.frameSvg. The jitter's
// address (ENGINE_BRIEF §1) was the per-frame rebuild: every frame the whole
// overlay was assembled as one SVG string and installed with innerHTML —
// string build, HTML parse, DOM teardown and recreation, style, layout,
// paint, garbage, 60 times a second. Here the overlay is built ONCE (it
// outlives the pages) and each frame only moves what moves:
//   · every mover is its own compositor layer (will-change: transform)
//   · per frame only `style.transform` is written — no layout, no repaint of
//     the page — and only when the value changed
//   · the animated instances are INDEXED BY TIME once: a page's plan looks
//     only at the instances that can be alive on it, not at all 4000+
//   · elements are pooled by look: a turn creates nothing, and the element
//     count is the most ever alive at once
//
// THE EXPORTER IS UNTOUCHED. Print and video keep drawing through
// animobj.js's string path (frameSvg), byte-identical to before. The two
// paths share the inputs (instances, view, style, gc.js physics) and the
// numbers below mirror animobj's state functions one for one;
// tools/test_animlive.js holds them together — it plays the whole piece
// through both and fails on any element that differs by more than the
// string path's own rounding (0.05 px).
//
// Two halves:
//   plan(instances, view, style, opts) -> scene     PURE (Node-testable):
//       one page: the pieces each live instance draws, their fixed geometry,
//       and scene.step(t), which fills in the moving numbers for time t.
//   mount(host, frame) -> { setLayers, frame(t), setScale, attach, destroy }
//       DOM, once per page geometry: setLayers([{scene, opacity}]) at every
//       page and solo change — the solo split draws the soloed instances at
//       full ink and the rest at 0.3, exactly as frameSvg's two passes;
//       frame(t) steps every scene and writes transforms.
//
// The contract with frameSvg holds for t inside the page's window — the only
// times the live loop draws while playing (a turn happens the frame t
// passes the window end). Outside it, only the instances that can be alive
// within a margin of the page are drawn.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gc.js'), require('./animobj.js'));
  else root.NotationAnimLive = factory(root.NotationGC, root.NotationAnimObj);
})(typeof self !== 'undefined' ? self : this, function (GC, AnimObj) {

  const MARGIN_S = 1;   // instances alive within 1 s of the page window are planned

  // ---------- pieces ----------
  // A piece is one drawn element. Fixed fields are set at plan time; the
  // moving fields (x, y, lvl, frac) and `on` are written by step(t).
  // A RIDER (ride: true) moves sideways only with the cursor — every disc,
  // the cursor, the meters (at a fixed dx left of it) — so the DOM half
  // slides one container per frame and a rider writes only its own vertical
  // change (a ball's height, a fill's level).
  //   disc  filled circle            moving cx, cy
  //   ring  stroked circle           fixed
  //   vbar  the cursor line          moving x
  //   box   stroked rect (meter)     moving x
  //   fill  filled rect (meter)      moving x, lvl — bottom-anchored at yBase,
  //                                  height lvl·hMax
  //   pie   filled pie slice         moving frac (0..1 from 12 o'clock)
  function piece(shape, fixed) { return Object.assign({ shape, on: false, cx: 0, cy: 0, x: 0, lvl: 0, frac: 0 }, fixed); }

  // the meters' level at t — animobj's interpolation, verbatim
  function meterLevel(inst, t) {
    const frac = (t - inst.t0) / Math.max(1e-9, inst.t1 - inst.t0);
    const smp = inst.samples;
    const fi = frac * (smp.length - 1), i0 = Math.floor(fi);
    return i0 >= smp.length - 1 ? smp[smp.length - 1] : smp[i0] + (smp[i0 + 1] - smp[i0]) * (fi - i0);
  }

  // ---------- the kinds: animobj's eight state functions, as plan + step ----------
  // plan(inst, view, st) -> { a, b, pieces, step(t, view) } or null (not in view).
  // [a, b] is a superset of the instance's live span — the time index; step
  // decides exactly, with the same tests the string path makes.
  const KINDS = {
    gc(inst, view, st) {
      const s = view.system(inst.part);
      const P = GC.params(Object.assign({}, st.preset || {}, (inst && inst.preset) || {}));
      const G = GC.laneGeom(s, view, st.look);
      const r = G.look.ballRadiusPx * G.k;
      const ball = piece('disc', { ride: true, r, fill: st.color || G.look.color, opacity: st.opacity != null && st.opacity < 1 ? st.opacity : 1 });
      return {
        a: inst.at - P.pre - 1e-6, b: inst.at + P.post + 1e-6, pieces: [ball],
        step(t) {
          const frac = GC.heightFrac(P, t - inst.at);
          if (frac === null) return false;
          ball.cx = view.xOfSeconds(t); ball.cy = G.impactY - frac * G.h;
          return true;
        },
      };
    },
    curveFollower(inst, view, st) {
      const s = view.system(inst.part);
      const dot = piece('disc', { ride: true, r: st.radiusSs * s.ssPx, fill: st.color, opacity: st.opacity });
      const y0 = AnimObj.staffPosOfMidi(inst.midi);
      return {
        a: inst.t0, b: inst.t1, pieces: [dot],
        step(t) {
          if (t < inst.t0 || t > inst.t1) return false;
          dot.cx = view.xOfSeconds(t); dot.cy = s.yOfSs(y0 + AnimObj.bendAt(inst.morphBend, inst.t0, t) * 0.25);
          return true;
        },
      };
    },
    envFollower(inst, view, st) {
      const yTop = view.systems[0].yTopPx, yBot = view.systems[view.systems.length - 1].yBotPx;
      const dot = piece('disc', { ride: true, r: st.radiusPx, fill: inst.color || st.color, opacity: st.opacity });
      return {
        a: inst.t0, b: inst.t1, pieces: [dot],
        step(t) {
          if (t < inst.t0 || t > inst.t1) return false;
          dot.cx = view.xOfSeconds(t);
          dot.cy = yBot - AnimObj.lvlAt(inst.nodes, (t - inst.t0) / (inst.t1 - inst.t0)) * (yBot - yTop);
          return true;
        },
      };
    },
    curveMeter(inst, view, st) {
      const s = view.system(inst.part);
      return meter(inst, view, st, s.yTopPx, s.yBotPx, s.yBotPx);
    },
    glissMeter(inst, view, st) {
      const s = view.system(inst.part);
      const yMid = (s.yTopPx + s.yBotPx) / 2;
      return meter(inst, view, st, s.yTopPx, yMid, yMid);
    },
    crescMeter(inst, view, st) {
      const s = view.system(inst.part);
      const yMid = inst.full ? s.yTopPx : (s.yTopPx + s.yBotPx) / 2;
      return meter(inst, view, st, yMid, s.yBotPx, s.yBotPx);
    },
    lineWedge(inst, view, st) {
      const s = view.system(inst.part);
      const cx = view.xOfSeconds(inst.t0), cy = s.yOfSs(st.ySs), r = st.radiusSs * s.ssPx;
      return pieWith(inst, cx, cy, r, st.color, 0.4, st.color, st.opacity);
    },
    motivePie(inst, view, st) {
      const c = inst.color || st.color;
      return pieWith(inst, view.xOfSeconds(inst.t0), st.topPx, st.radiusPx, c, 0.5, c, st.opacity);
    },
  };
  // the three meters: an outline over [yBoxTop, yBoxTop + H] riding a fixed
  // offset left of the cursor, and a fill rising from yBase by level · H
  function meter(inst, view, st, yBoxTop, yBoxBot, yBase) {
    const H = yBoxBot - yBoxTop;
    const w = st.wPx || 8, gap = st.gapPx != null ? st.gapPx : 3;
    const box = piece('box', { ride: true, dx: -w - gap, y: yBoxTop, w, h: H, stroke: st.color, sw: st.outlineWPx || 1.5,
      opacity: st.outlineOpacity != null ? st.outlineOpacity : 0.8 });
    const fill = piece('fill', { ride: true, dx: -w - gap, yBase, w, hMax: H, fill: st.color, opacity: st.fillOpacity != null ? st.fillOpacity : 0.3 });
    return {
      a: inst.t0, b: inst.t1, pieces: [box, fill],
      step(t) {
        if (t < inst.t0 || t > inst.t1) return false;
        const x = view.xOfSeconds(t) - w - gap;
        box.x = x; fill.x = x; fill.lvl = meterLevel(inst, t);
        return true;
      },
    };
  }
  // lineWedge / motivePie: a fixed ring and a pie filling over [t0, t1]
  function pieWith(inst, cx, cy, r, ringColor, ringOpacity, pieColor, pieOpacity) {
    const ring = piece('ring', { cx, cy, r, stroke: ringColor, sw: 1, opacity: ringOpacity });
    const pie = piece('pie', { cx, cy, r, fill: pieColor, opacity: pieOpacity });
    return {
      a: inst.t0, b: inst.t1, pieces: [ring, pie],
      step(t) {
        if (t < inst.t0 || t > inst.t1) return false;
        pie.frac = (t - inst.t0) / (inst.t1 - inst.t0);
        return true;
      },
    };
  }

  // ---------- the time index: built once per instance list ----------
  // Every instance's live span, sorted by start — so a page's plan touches
  // only the instances that can be alive on it, not all 4000+ (measured day
  // 45: building every instance's closures at every turn cost the turn ~100
  // ms at CPU ×6). Cached on the list itself; a new style (the registry
  // hot-reloaded) rebuilds it.
  const INDEX = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function spanOf(inst, style) {
    if (inst.kind === 'gc') {
      const st = style.gc || {};
      const P = GC.params(Object.assign({}, st.preset || {}, (inst && inst.preset) || {}));
      return [inst.at - P.pre - 1e-6, inst.at + P.post + 1e-6];
    }
    return [inst.t0, inst.t1];
  }
  function indexOf(instances, style) {
    const hit = INDEX && INDEX.get(instances);
    if (hit && hit.style === style) return hit;
    const list = [];
    let maxLen = 0;
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (!KINDS[inst.kind]) continue;
      const [a, b] = spanOf(inst, style);
      if (!(b >= a)) continue;
      list.push({ i, inst, a, b });
      maxLen = Math.max(maxLen, b - a);
    }
    list.sort((x, y) => x.a - y.a);
    const idx = { style, list, maxLen };
    if (INDEX) INDEX.set(instances, idx);
    return idx;
  }

  // ---------- plan: one page's scene ----------
  // opts.cursor === false: no cursor (the dimmed half of a solo split).
  // The z-order is frameSvg's: the cursor first, then the instances in list
  // order, each instance's pieces in the order its state function emits them.
  function plan(instances, view, style, opts) {
    const O = opts || {};
    const [w0, w1] = view.window;
    const lo = w0 - MARGIN_S, hi = w1 + MARGIN_S;
    let cursor = null;
    if (O.cursor !== false) {
      const c = style.cursor;
      cursor = piece('vbar', { ride: true, yTop: view.systems[0].yTopPx, yBot: view.systems[view.systems.length - 1].yBotPx,
        w: c.wPx, fill: c.color, opacity: c.opacity });
    }
    const { list, maxLen } = indexOf(instances || [], style);
    // the first entry that could still be alive at lo: a >= lo - maxLen
    let k0 = 0, k1 = list.length;
    while (k0 < k1) { const m = (k0 + k1) >> 1; if (list[m].a < lo - maxLen) k0 = m + 1; else k1 = m; }
    const cand = [];
    for (let k = k0; k < list.length && list[k].a <= hi; k++) if (list[k].b >= lo) cand.push(list[k]);
    cand.sort((x, y) => x.i - y.i);   // back to list order = draw order
    const items = [];
    for (const c of cand) {
      let it;
      try { it = KINDS[c.inst.kind](c.inst, view, style[c.inst.kind] || {}); } catch (e) { continue; }   // part not in this view
      it.inst = c.inst;
      items.push(it);
    }
    const pieces = (cursor ? [cursor] : []).concat(...items.map(it => it.pieces));
    pieces.forEach((p, n) => { p.z = n + 1; });
    const scene = { view, window: [w0, w1], cursor, items, pieces, step, xc: 0 };
    function step(t) {
      scene.xc = view.xOfSeconds(t);   // where the riders ride: the cursor's x
      if (cursor) {
        cursor.on = t >= w0 && t <= w1;
        if (cursor.on) cursor.x = view.xOfSeconds(t);
      }
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const on = t >= it.a && t <= it.b && it.step(t);
        for (let j = 0; j < it.pieces.length; j++) it.pieces[j].on = on;
      }
    }
    return scene;
  }

  // ---------- the scene as frameSvg leaves (for the parity battery) ----------
  // -> [{tag, attrs}] in draw order, attribute values as numbers where
  // numeric — what tools/test_animlive.js compares against the string path.
  // A pie is a <circle> when full and absent when empty, as arcPath draws it.
  function leaves(scene) {
    const out = [];
    for (const p of scene.pieces) {
      if (!p.on) continue;
      if (p.shape === 'vbar') out.push({ tag: 'line', attrs: { x1: p.x, y1: p.yTop, x2: p.x, y2: p.yBot, stroke: p.fill, 'stroke-width': p.w, opacity: p.opacity } });
      else if (p.shape === 'disc') out.push({ tag: 'circle', attrs: Object.assign({ cx: p.cx, cy: p.cy, r: p.r, fill: p.fill }, p.opacity !== 1 ? { opacity: p.opacity } : {}) });
      else if (p.shape === 'ring') out.push({ tag: 'circle', attrs: { cx: p.cx, cy: p.cy, r: p.r, fill: 'none', stroke: p.stroke, 'stroke-width': p.sw, opacity: p.opacity } });
      else if (p.shape === 'box') out.push({ tag: 'rect', attrs: { x: p.x, y: p.y, width: p.w, height: p.h, fill: 'none', stroke: p.stroke, 'stroke-width': p.sw, opacity: p.opacity } });
      else if (p.shape === 'fill') out.push({ tag: 'rect', attrs: { x: p.x, y: p.yBase - p.lvl * p.hMax, width: p.w, height: p.lvl * p.hMax, fill: p.fill, opacity: p.opacity } });
      else if (p.shape === 'pie') {
        if (p.frac <= 0) continue;
        if (p.frac >= 1) out.push({ tag: 'circle', attrs: { cx: p.cx, cy: p.cy, r: p.r, fill: p.fill, opacity: p.opacity } });
        else out.push({ tag: 'path', attrs: { d: piePath(p.cx, p.cy, p.r, p.frac), fill: p.fill, opacity: p.opacity } });
      }
    }
    return out;
  }
  // animobj.arcPath's slice, without its rounding
  function piePath(cx, cy, r, frac) {
    const a = -Math.PI / 2 + frac * 2 * Math.PI;
    return 'M ' + cx + ' ' + cy + ' L ' + cx + ' ' + (cy - r) + ' A ' + r + ' ' + r + ' 0 ' + (frac > 0.5 ? 1 : 0) + ' 1 ' +
      (cx + r * Math.cos(a)) + ' ' + (cy + r * Math.sin(a)) + ' Z';
  }

  // ---------- mount: the DOM half — ONE overlay for the whole piece ----------
  // The overlay outlives the pages: a page turn hands it the next page's
  // scenes (setLayers) and nothing is torn down. Its elements are POOLED by
  // look (shape · size · colour · opacity): a piece that comes alive borrows
  // an element of its look, writes its transform, and gives it back when it
  // ends — so the element count is the most ever alive at once (tens), not
  // every instance on the page (hundreds), and a turn creates nothing.
  // Draw order = frameSvg's, held by z-index (piece.z), not by DOM order.
  //
  // The host may have its contents replaced (the page re-renders by
  // innerHTML); attach(host) puts the overlay back on top.
  function mount(host, frame) {
    const doc = host.ownerDocument;
    const W = frame.widthPx, H = frame.heightPx;
    const clip = doc.createElement('div');
    clip.className = 'animlive';
    clip.id = 'animov';
    Object.assign(clip.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px',
      overflow: 'hidden', pointerEvents: 'none' });
    const stage = doc.createElement('div');
    Object.assign(stage.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px',
      transformOrigin: '0 0', contain: 'strict' });
    clip.appendChild(stage);
    host.appendChild(clip);
    // one group per layer (full ink · the solo dim), each holding the RIDER —
    // a container that slides with the cursor, carrying every rider — and,
    // above it, the fixed pieces (a hold's ring and pie)
    const groups = [];
    const pools = new Map();  // layer · rider/fixed · look -> free elements
    let layers = [];          // [{scene, n}]
    let made = 0;
    function group(n, opacity) {
      if (!groups[n]) {
        const g = doc.createElement('div');
        Object.assign(g.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px' });
        const rider = doc.createElement('div');
        Object.assign(rider.style, { position: 'absolute', left: '0', top: '0', width: '0', height: '0', willChange: 'transform' });
        const fixed = doc.createElement('div');
        Object.assign(fixed.style, { position: 'absolute', left: '0', top: '0', width: W + 'px', height: H + 'px', isolation: 'isolate' });
        g.appendChild(rider); g.appendChild(fixed);
        stage.appendChild(g);
        groups[n] = { g, rider, fixed, tf: '' };
      }
      groups[n].g.style.opacity = opacity != null && opacity < 1 ? String(opacity) : '';
      return groups[n];
    }
    function acquire(n, p) {
      const key = n + (p.ride ? 'R|' : 'F|') + lookOf(p);
      const free = pools.get(key);
      let m;
      if (free && free.length) m = free.pop();
      else { m = makeEl(doc, p.ride ? groups[n].rider : groups[n].fixed, p, key); made++; }
      m.el.style.zIndex = String(p.z);
      m.el.style.display = '';
      m.tf = ''; m.d = '';
      return m;
    }
    function release(m) {
      m.el.style.display = 'none';
      let free = pools.get(m.key);
      if (!free) { free = []; pools.set(m.key, free); }
      free.push(m);
    }
    function setLayers(next) {
      for (const L of layers) for (const p of L.scene.pieces) if (p._m) { release(p._m); p._m = null; }
      layers = [];
      next.forEach((L, n) => { if (L && L.scene) { group(n, L.opacity); layers.push({ scene: L.scene, n }); } });
    }
    function frameAt(t) {
      for (let li = 0; li < layers.length; li++) {
        const L = layers[li], ps = L.scene.pieces, G = groups[L.n];
        L.scene.step(t);
        const rtf = 'translate3d(' + L.scene.xc + 'px,0,0)';
        if (rtf !== G.tf) { G.rider.style.transform = rtf; G.tf = rtf; }
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i];
          const vis = p.on && (p.shape === 'fill' ? p.lvl > 0 : p.shape === 'pie' ? p.frac > 0 : true);
          if (!vis) { if (p._m) { release(p._m); p._m = null; } continue; }
          if (!p._m) p._m = acquire(L.n, p);
          paint(p._m, p);
        }
      }
    }
    function setScale(k) {
      clip.style.width = (W * k) + 'px'; clip.style.height = (H * k) + 'px';
      stage.style.transform = k === 1 ? '' : 'scale(' + k + ')';
    }
    function attach(h) { if (h.lastChild !== clip) h.appendChild(clip); }
    function destroy() { if (clip.parentNode) clip.parentNode.removeChild(clip); }
    return { frame: frameAt, setLayers, setScale, attach, destroy, el: clip, W, H,
      stats: () => ({ elements: made, pooled: [...pools.values()].reduce((a, f) => a + f.length, 0) }) };
  }

  // the look: everything about an element that is NOT its place — two pieces
  // of the same look can share an element
  function lookOf(p) {
    if (p.shape === 'disc') return 'disc|' + p.r + '|' + p.fill + '|' + p.opacity;
    if (p.shape === 'ring') return 'ring|' + p.r + '|' + p.stroke + '|' + p.sw + '|' + p.opacity;
    if (p.shape === 'vbar') return 'vbar|' + p.w + '|' + (p.yBot - p.yTop) + '|' + p.fill + '|' + p.opacity;
    if (p.shape === 'box') return 'box|' + p.w + '|' + p.h + '|' + p.stroke + '|' + p.sw + '|' + p.opacity;
    if (p.shape === 'fill') return 'fill|' + p.w + '|' + p.hMax + '|' + p.fill + '|' + p.opacity;
    return 'pie|' + p.r + '|' + p.fill + '|' + p.opacity;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function makeEl(doc, parent, p, key) {
    let el, node = null;
    const st = { position: 'absolute', left: '0', top: '0', display: 'none' };
    if (p.shape === 'disc') {
      el = doc.createElement('div');
      Object.assign(st, { width: 2 * p.r + 'px', height: 2 * p.r + 'px', borderRadius: '50%', background: p.fill, willChange: 'transform' });
    } else if (p.shape === 'ring') {
      el = doc.createElement('div');
      Object.assign(st, { boxSizing: 'border-box', width: (2 * p.r + p.sw) + 'px', height: (2 * p.r + p.sw) + 'px', borderRadius: '50%',
        border: p.sw + 'px solid ' + p.stroke });
    } else if (p.shape === 'vbar') {
      el = doc.createElement('div');
      Object.assign(st, { width: p.w + 'px', height: (p.yBot - p.yTop) + 'px', background: p.fill, willChange: 'transform' });
    } else if (p.shape === 'box') {
      el = doc.createElement('div');
      Object.assign(st, { boxSizing: 'border-box', width: (p.w + p.sw) + 'px', height: (p.h + p.sw) + 'px',
        border: p.sw + 'px solid ' + p.stroke, willChange: 'transform' });
    } else if (p.shape === 'fill') {
      el = doc.createElement('div');
      Object.assign(st, { width: p.w + 'px', height: p.hMax + 'px', background: p.fill, transformOrigin: '0 100%', willChange: 'transform' });
    } else {   // pie: a small SVG the size of the pie; only its path changes
      el = doc.createElementNS(SVGNS, 'svg');
      const S = 2 * p.r + 2;
      el.setAttribute('width', S); el.setAttribute('height', S);
      el.setAttribute('viewBox', '0 0 ' + S + ' ' + S);
      node = doc.createElementNS(SVGNS, 'path');
      node.setAttribute('fill', p.fill);
      el.appendChild(node);
      st.overflow = 'visible';
    }
    if (p.opacity != null && p.opacity !== 1) st.opacity = String(p.opacity);
    Object.assign(el.style, st);
    parent.appendChild(el);
    return { el, node, key, tf: '', d: '' };
  }
  // one piece on its element, one frame: the transform (and a pie's path),
  // written only when it changed. A rider's transform is RELATIVE to the
  // cursor's x (its rider slides): the cursor and a meter's outline never
  // change while alive; a ball changes with its height, a fill with its level.
  function paint(m, p) {
    let tf;
    if (p.shape === 'disc') tf = 'translate3d(' + (-p.r) + 'px,' + (p.cy - p.r) + 'px,0)';
    else if (p.shape === 'vbar') tf = p._tf || (p._tf = 'translate3d(' + (-p.w / 2) + 'px,' + p.yTop + 'px,0)');
    else if (p.shape === 'box') tf = p._tf || (p._tf = 'translate3d(' + (p.dx - p.sw / 2) + 'px,' + (p.y - p.sw / 2) + 'px,0)');
    else if (p.shape === 'fill') tf = 'translate3d(' + p.dx + 'px,' + (p.yBase - p.hMax) + 'px,0) scaleY(' + p.lvl + ')';
    else if (p.shape === 'ring') tf = p._tf || (p._tf = 'translate(' + (p.cx - p.r - p.sw / 2) + 'px,' + (p.cy - p.r - p.sw / 2) + 'px)');
    else {   // pie: fixed in place, its path is what changes
      tf = p._tf || (p._tf = 'translate(' + (p.cx - p.r - 1) + 'px,' + (p.cy - p.r - 1) + 'px)');
      const c = p.r + 1;
      const d = p.frac >= 1
        ? 'M ' + (c - p.r) + ' ' + c + ' A ' + p.r + ' ' + p.r + ' 0 1 0 ' + (c + p.r) + ' ' + c + ' A ' + p.r + ' ' + p.r + ' 0 1 0 ' + (c - p.r) + ' ' + c + ' Z'
        : piePath(c, c, p.r, p.frac);
      if (d !== m.d) { m.node.setAttribute('d', d); m.d = d; }
    }
    if (tf !== m.tf) { m.el.style.transform = tf; m.tf = tf; }
  }

  return { plan, leaves, mount, KINDS, MARGIN_S, indexOf, _meterLevel: meterLevel };
});
