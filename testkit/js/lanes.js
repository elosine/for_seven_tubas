// lanes.js — T2, THE RENDERER SHOOT-OUT (docs/ENGINE_BRIEF.md §2, §5).
// The same 60 s of the piece, drawn five ways, each timed by T1's recorder:
//   A0  today's engine VERBATIM — frameSvg() over all of the piece's animated
//       objects, innerHTML into the overlay, the time readout updated, a page
//       turn = innerHTML of the whole page. The baseline the diagnosis indicts.
//   A1  retained SVG — the overlay built once; per frame only the attributes
//       that moved are set. Pages pre-parsed; a turn is a visibility flip.
//   A2  GPU layers — every moving element is its own layer, moved with
//       transform only (no layout, no repaint of the page).
//   B   canvas, game-engine style — the page rasterized once per page, the
//       moving elements redrawn on a second canvas every frame.
//   C   pre-rendered video — the exporter's own frames, drawn by the hardware
//       decoder; the main thread does nothing.
// A1/A2/B read trace.json (the engine's per-frame state, precomputed) so they
// isolate the RENDERING strategy; A0 runs the engine itself, which is the point.
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};
  const S = TK.stats;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------ assets
  let A = null;
  async function loadAssets(say) {
    if (A) return A;
    const get = async (p, kind) => {
      const r = await fetch(p, { cache: 'no-cache' });
      if (!r.ok) throw new Error(p + ' → HTTP ' + r.status + (r.status === 404 ? ' (run: node testkit/build_assets.js)' : ''));
      return kind === 'text' ? r.text() : r.json();
    };
    if (say) say('loading the piece window…');
    const manifest = await get('assets/manifest.json');
    const trace = await get('assets/trace.json');
    const engine = await get('assets/engine_inputs.json');
    const pages = [];
    for (const sg of trace.segments) pages.push({ seg: sg.seg, t0: sg.t0, t1: sg.t1, svg: await get('assets/' + sg.svg, 'text') });
    const segOfFrame = new Int16Array(trace.frames);
    let pi = 0;
    for (let k = 0; k < trace.frames; k++) {
      while (pi + 1 < trace.pageAt.length && trace.pageAt[pi + 1][0] <= k) pi++;
      segOfFrame[k] = trace.segments.findIndex(s => s.seg === trace.pageAt[pi][1]);
    }
    A = { manifest, trace, engine, pages, segOfFrame, fps: trace.fps, t0: trace.t0, t1: trace.t1, W: trace.width, H: trace.height };
    // one pass: each track's largest value per numeric attribute (A2 sizes its layers by it)
    A.max = trace.tracks.map(() => ({}));
    for (let k = 0; k < trace.frames; k++) {
      eachActive(k, (tid, tr, fl, i) => {
        const m = A.max[tid];
        for (let j = 0; j < tr.dyn.length; j++) {
          const v = fl[i + j];
          if (typeof v === 'number') m[tr.dyn[j]] = Math.max(m[tr.dyn[j]] || 0, Math.abs(v));
        }
      });
    }
    return A;
  }
  const segAt = t => {
    for (let i = 0; i < A.pages.length; i++) if (t < A.pages[i].t1) return i;
    return A.pages.length - 1;
  };
  const num = v => (v === '' || v == null || isNaN(+v)) ? v : +v;

  // ------------------------------------------------------------ the theater
  // full-screen, black, a 16:9 stage centred — every visual test runs here
  const theater = {
    el: null, stage: null, hudEl: null, onExit: null,
    open() {
      if (!this.el) {
        this.el = document.createElement('div');
        this.el.id = 'theater';
        this.el.innerHTML = '<div id="stage"></div><div id="hud"></div><button id="th-exit" type="button">stop</button>';
        document.body.appendChild(this.el);
        this.stage = this.el.querySelector('#stage');
        this.hudEl = this.el.querySelector('#hud');
        this.el.querySelector('#th-exit').addEventListener('click', () => { if (this.onExit) this.onExit(); });
        addEventListener('resize', () => this.fit());
      }
      this.el.style.display = 'block';
      this.fit();
      return this;
    },
    fit() {
      if (!this.stage) return;
      const w = Math.floor(Math.min(innerWidth, innerHeight * 16 / 9)), h = Math.floor(w * 9 / 16);
      Object.assign(this.stage.style, { width: w + 'px', height: h + 'px', left: Math.floor((innerWidth - w) / 2) + 'px', top: Math.floor((innerHeight - h) / 2) + 'px' });
    },
    hud(s) { if (this.hudEl) this.hudEl.textContent = s; },
    close() { if (this.el) { this.el.style.display = 'none'; this.stage.innerHTML = ''; } this.onExit = null; },
  };

  function pagesInto(sheet) {
    return A.pages.map(p => {
      const d = document.createElement('div');
      d.className = 'pg';
      d.innerHTML = p.svg;
      d.style.visibility = 'hidden';
      sheet.appendChild(d);
      return d;
    });
  }
  function turnTo(ctx, si) {
    if (si === ctx.si) return;
    if (ctx.si >= 0) ctx.pageEls[ctx.si].style.visibility = 'hidden';
    ctx.pageEls[si].style.visibility = 'visible';
    ctx.si = si;
  }
  // walk one frame of the trace: cb(tid, track, flat, index of its first value)
  function eachActive(k, cb) {
    const fl = A.trace.f[k], tracks = A.trace.tracks;
    let i = 0;
    while (i < fl.length) {
      const tid = fl[i++], tr = tracks[tid];
      cb(tid, tr, fl, i);
      i += tr.dyn.length;
    }
  }
  function activeBook(n) { return { on: new Uint8Array(n), seen: new Uint32Array(n), stamp: 0, active: [] }; }
  function retire(book, hide) {
    for (let a = book.active.length - 1; a >= 0; a--) {
      const tid = book.active[a];
      if (book.seen[tid] !== book.stamp) { hide(tid); book.on[tid] = 0; book.active.splice(a, 1); }
    }
  }

  // ------------------------------------------------------------ A0: verbatim
  const A0 = {
    id: 'A0', label: 'A0 · today\'s engine (verbatim)',
    desc: 'per frame: frameSvg() over every animated object in the piece, innerHTML into the overlay, the time readout updated — the notation app\'s own path',
    async setup(stage) {
      stage.innerHTML = '<div class="sheet"></div><div class="readout"><span></span><span></span></div>';
      if (typeof NotationAnimObj === 'undefined' || typeof NotationCoords === 'undefined') throw new Error('engine scripts not loaded (assets/engine/*.js)');
      return { sheet: stage.querySelector('.sheet'), r: stage.querySelectorAll('.readout span'), si: -1, shown: '', ov: null, view: null };
    },
    frame(ctx, t) {
      const si = segAt(t);
      if (si !== ctx.si) {
        ctx.si = si;
        ctx.sheet.innerHTML = A.pages[si].svg;              // a page turn, as render() does it
        const ov = document.createElementNS(SVGNS, 'svg');
        ov.setAttribute('width', A.W); ov.setAttribute('height', A.H);
        ov.setAttribute('viewBox', '0 0 ' + A.W + ' ' + A.H);
        ov.setAttribute('class', 'ov');
        ctx.sheet.appendChild(ov);
        ctx.ov = ov;
        ctx.view = NotationCoords.makeView(A.engine.segments[si].cfg);
      }
      ctx.ov.innerHTML = NotationAnimObj.frameSvg(A.engine.instances, ctx.view, t, A.engine.style);
      const s = 't ' + t.toFixed(2) + ' s';
      if (s !== ctx.shown) { ctx.shown = s; ctx.r[0].textContent = s; ctx.r[1].textContent = s; }
    },
  };

  // ------------------------------------------------------------ A1: retained SVG
  const A1 = {
    id: 'A1', label: 'A1 · retained SVG',
    desc: 'the overlay built once; per frame only the attributes that moved are set; pages pre-parsed, a turn is a visibility flip',
    async setup(stage) {
      stage.innerHTML = '<div class="sheet"></div>';
      const sheet = stage.firstChild;
      const pageEls = pagesInto(sheet);
      const ov = document.createElementNS(SVGNS, 'svg');
      ov.setAttribute('width', A.W); ov.setAttribute('height', A.H);
      ov.setAttribute('viewBox', '0 0 ' + A.W + ' ' + A.H);
      ov.setAttribute('class', 'ov');
      sheet.appendChild(ov);
      const nodes = A.trace.tracks.map(tr => {
        const n = document.createElementNS(SVGNS, tr.tag);
        for (const k in tr.static) n.setAttribute(k, tr.static[k]);
        n.style.display = 'none';
        ov.appendChild(n);
        return n;
      });
      return { pageEls, si: -1, nodes, last: A.trace.tracks.map(tr => new Array(tr.dyn.length)), book: activeBook(nodes.length) };
    },
    frame(ctx, t, k) {
      turnTo(ctx, A.segOfFrame[k]);
      const b = ctx.book;
      b.stamp++;
      eachActive(k, (tid, tr, fl, i) => {
        const node = ctx.nodes[tid], last = ctx.last[tid];
        if (!b.on[tid]) { node.style.display = ''; b.on[tid] = 1; b.active.push(tid); }
        b.seen[tid] = b.stamp;
        for (let j = 0; j < tr.dyn.length; j++) {
          const v = fl[i + j];
          if (v !== last[j]) { node.setAttribute(tr.dyn[j], v); last[j] = v; }
        }
      });
      retire(b, tid => { ctx.nodes[tid].style.display = 'none'; });
    },
  };

  // ------------------------------------------------------------ A2: GPU layers
  function geomMax(tid, names) {
    const tr = A.trace.tracks[tid], m = {};
    for (const n of names) m[n] = tr.static[n] != null ? Math.abs(+tr.static[n]) : (A.max[tid][n] || 0);
    return m;
  }
  function makeMover(tid, layer) {
    const tr = A.trace.tracks[tid], st = tr.static;
    const g = {};
    for (const k in st) g[k] = num(st[k]);
    const el = document.createElement('div');
    el.className = 'mv';
    const op = st.opacity != null ? +st.opacity : 1;
    let kind = 'svg';
    if (tr.tag === 'circle') {
      const mx = geomMax(tid, ['r']);
      g.r0 = mx.r || +st.r || 1;
      Object.assign(el.style, { width: 2 * g.r0 + 'px', height: 2 * g.r0 + 'px', borderRadius: '50%', background: st.fill || '#000', opacity: op });
      kind = 'circle';
    } else if (tr.tag === 'line' && !tr.dyn.includes('y1') && !tr.dyn.includes('y2')) {
      const sw = +st['stroke-width'] || 1;
      const y1 = +st.y1, y2 = +st.y2;
      Object.assign(el.style, { width: sw + 'px', height: Math.abs(y2 - y1) + 'px', background: st.stroke || '#000', opacity: op });
      g.sw = sw; g.ytop = Math.min(y1, y2);
      kind = 'vline';
    } else if (tr.tag === 'rect' && st.fill && st.fill !== 'none' && !st.stroke) {
      const mx = geomMax(tid, ['width', 'height']);
      g.W0 = mx.width || 1; g.H0 = mx.height || 1;
      Object.assign(el.style, { width: g.W0 + 'px', height: g.H0 + 'px', background: st.fill, opacity: op, transformOrigin: '0 0' });
      kind = 'fillrect';
    } else if (tr.tag === 'rect' && (!st.fill || st.fill === 'none') && st.stroke) {
      const sw = +st['stroke-width'] || 1;
      const mx = geomMax(tid, ['width', 'height']);
      Object.assign(el.style, { boxSizing: 'border-box', width: (mx.width + sw) + 'px', height: (mx.height + sw) + 'px',
        border: sw + 'px solid ' + st.stroke, opacity: op });
      g.sw = sw;
      kind = 'strokerect';
    }
    if (kind === 'svg') {
      // no layer form for this element (a pie's path): an SVG child, attributes as A1
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('width', A.W); svg.setAttribute('height', A.H);
      svg.setAttribute('viewBox', '0 0 ' + A.W + ' ' + A.H);
      svg.setAttribute('class', 'mvsvg');
      const n = document.createElementNS(SVGNS, tr.tag);
      for (const k in st) n.setAttribute(k, st[k]);
      svg.appendChild(n);
      svg.style.display = 'none';
      layer.appendChild(svg);
      return { kind, el: svg, node: n, g, last: new Array(tr.dyn.length), tf: '' };
    }
    el.style.display = 'none';
    layer.appendChild(el);
    return { kind, el, g, tf: '' };
  }
  const A2 = {
    id: 'A2', label: 'A2 · GPU layers',
    desc: 'every moving element is its own compositor layer, moved with transform only — no layout, no repaint of the page',
    async setup(stage) {
      stage.innerHTML = '<div class="sheet"></div>';
      const sheet = stage.firstChild;
      const pageEls = pagesInto(sheet);
      const layer = document.createElement('div');
      layer.className = 'movers';
      layer.style.transform = 'scale(' + (stage.clientWidth / A.W) + ')';
      sheet.appendChild(layer);
      const movers = A.trace.tracks.map((tr, tid) => makeMover(tid, layer));
      return { pageEls, si: -1, movers, book: activeBook(movers.length) };
    },
    frame(ctx, t, k) {
      turnTo(ctx, A.segOfFrame[k]);
      const b = ctx.book;
      b.stamp++;
      eachActive(k, (tid, tr, fl, i) => {
        const m = ctx.movers[tid], g = m.g;
        if (!b.on[tid]) { m.el.style.display = ''; b.on[tid] = 1; b.active.push(tid); }
        b.seen[tid] = b.stamp;
        if (m.kind === 'svg') {
          for (let j = 0; j < tr.dyn.length; j++) { const v = fl[i + j]; if (v !== m.last[j]) { m.node.setAttribute(tr.dyn[j], v); m.last[j] = v; } }
          return;
        }
        for (let j = 0; j < tr.dyn.length; j++) g[tr.dyn[j]] = fl[i + j];
        let tf;
        if (m.kind === 'circle') tf = 'translate3d(' + (g.cx - g.r0) + 'px,' + (g.cy - g.r0) + 'px,0)' + (g.r !== g.r0 ? ' scale(' + (g.r / g.r0) + ')' : '');
        else if (m.kind === 'vline') tf = 'translate3d(' + (g.x1 - g.sw / 2) + 'px,' + g.ytop + 'px,0)';
        else if (m.kind === 'fillrect') tf = 'translate3d(' + g.x + 'px,' + g.y + 'px,0) scale(' + (g.width / g.W0) + ',' + (g.height / g.H0) + ')';
        else tf = 'translate3d(' + (g.x - g.sw / 2) + 'px,' + (g.y - g.sw / 2) + 'px,0)';
        if (tf !== m.tf) { m.el.style.transform = tf; m.tf = tf; }
      });
      retire(b, tid => { ctx.movers[tid].el.style.display = 'none'; });
    },
  };

  // ------------------------------------------------------------ B: canvas
  let fontCss = null;
  async function embeddedFonts() {
    if (fontCss !== null) return fontCss;
    // an SVG drawn as an IMAGE cannot see the page's web fonts; inline them
    const face = async (file, style) => {
      try {
        const buf = new Uint8Array(await (await fetch('assets/fonts/' + file)).arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        return "@font-face{font-family:'Crimson Pro Light';font-style:" + style + ';font-weight:300;src:url(data:font/ttf;base64,' + btoa(bin) + ")}";
      } catch (e) { return ''; }
    };
    fontCss = (await face('CrimsonPro-Light.ttf', 'normal')) + (await face('CrimsonPro-LightItalic.ttf', 'italic'));
    return fontCss;
  }
  function loadImage(url) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image failed')); im.src = url; });
  }
  const B = {
    id: 'B', label: 'B · canvas (game-engine style)',
    desc: 'the page rasterized once per page; the moving elements redrawn on a second canvas every frame',
    async setup(stage) {
      const dpr = devicePixelRatio || 1;
      const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
      stage.innerHTML = '<canvas class="cv"></canvas><canvas class="cv"></canvas>';
      const [pc, oc] = stage.querySelectorAll('canvas');
      pc.width = oc.width = w; pc.height = oc.height = h;
      const css = await embeddedFonts();
      const pageCanvases = [];
      for (const p of A.pages) {
        const svg = p.svg.replace(/(<svg[^>]*>)/, '$1<defs><style>' + css + '</style></defs>');
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        const img = await loadImage(url);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        pageCanvases.push(c);
      }
      const geo = A.trace.tracks.map(tr => { const g = {}; for (const k in tr.static) g[k] = num(tr.static[k]); return g; });
      return { pc: pc.getContext('2d'), oc: oc.getContext('2d', { alpha: true }), w, h, s: w / A.W, pageCanvases, si: -1, geo };
    },
    frame(ctx, t, k) {
      const si = A.segOfFrame[k];
      if (si !== ctx.si) { ctx.si = si; ctx.pc.drawImage(ctx.pageCanvases[si], 0, 0); }
      const c = ctx.oc;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, ctx.w, ctx.h);
      c.setTransform(ctx.s, 0, 0, ctx.s, 0, 0);
      eachActive(k, (tid, tr, fl, i) => {
        const g = ctx.geo[tid];
        for (let j = 0; j < tr.dyn.length; j++) g[tr.dyn[j]] = fl[i + j];
        c.globalAlpha = g.opacity != null ? +g.opacity : 1;
        const fill = g.fill && g.fill !== 'none' ? g.fill : null, stroke = g.stroke && g.stroke !== 'none' ? g.stroke : null;
        if (tr.tag === 'circle') {
          c.beginPath(); c.arc(g.cx, g.cy, g.r, 0, 6.283185307179586);
          if (fill) { c.fillStyle = fill; c.fill(); }
          if (stroke) { c.strokeStyle = stroke; c.lineWidth = +g['stroke-width'] || 1; c.stroke(); }
        } else if (tr.tag === 'line') {
          c.beginPath(); c.moveTo(g.x1, g.y1); c.lineTo(g.x2, g.y2);
          c.strokeStyle = stroke || '#000'; c.lineWidth = +g['stroke-width'] || 1; c.stroke();
        } else if (tr.tag === 'rect') {
          if (fill) { c.fillStyle = fill; c.fillRect(g.x, g.y, g.width, g.height); }
          if (stroke) { c.strokeStyle = stroke; c.lineWidth = +g['stroke-width'] || 1; c.strokeRect(g.x, g.y, g.width, g.height); }
        } else if (tr.tag === 'path' && g.d) {
          const p = new Path2D(g.d);
          if (fill || !stroke) { c.fillStyle = fill || '#000'; c.fill(p); }
          if (stroke) { c.strokeStyle = stroke; c.lineWidth = +g['stroke-width'] || 1; c.stroke(p); }
        }
      });
      c.globalAlpha = 1;
    },
  };

  // ------------------------------------------------------------ C: video
  function waitEvent(el, ev, ms) {
    return new Promise((res, rej) => {
      const to = setTimeout(() => { el.removeEventListener(ev, h); rej(new Error(ev + ' timeout')); }, ms);
      const h = () => { clearTimeout(to); el.removeEventListener(ev, h); res(); };
      el.addEventListener(ev, h);
    });
  }
  const hasRVFC = typeof HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  // presentation analysis of rVFC samples [{edt, mt, pf}] — shared with T4.
  // A callback reports the newest frame; presentedFrames says how many were
  // actually shown since the last one. So a two-frame jump in media time with
  // two frames presented is a COALESCED callback (nothing wrong); only media
  // frames that were never presented are SKIPS. A HOLD is a frame left on
  // screen for more than 1.5x its duration (a repeat, visible as a hitch).
  function presentation(samples, fps) {
    const frameMs = 1000 / fps;
    let skips = 0, holds = 0, coalesced = 0, n = 0, shown = 0;
    const jud = [];
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      const dmt = b.mt - a.mt, dedt = b.edt - a.edt;
      if (dmt <= 0 || dmt > 1000) continue;          // a seek or a loop, not playback
      const nMedia = Math.max(1, Math.round(dmt / frameMs));
      const nShown = (a.pf != null && b.pf != null) ? Math.max(1, b.pf - a.pf) : 1;
      n++; shown += nShown;
      skips += Math.max(0, nMedia - nShown);
      coalesced += nShown - 1;
      if (dedt > 1.5 * frameMs * nMedia) holds++;
      jud.push(Math.abs(dedt - dmt) / nMedia);
    }
    const s = S.sorted(jud);
    const secs = samples.length > 1 ? (samples[samples.length - 1].edt - samples[0].edt) / 1000 : 0;
    return { callbacks: samples.length, seconds: S.r1(secs), framesShownPerSec: S.r1(shown / Math.max(1e-9, secs)), skips, holds, coalescedCallbacks: coalesced,
      eventsPerMin: S.r2((skips + holds) / Math.max(1e-9, secs / 60)), judderP95Ms: S.r2(S.pct(s, 95)), judderMaxMs: S.r1(S.pct(s, 100)) };
  }
  const C = {
    id: 'C', label: 'C · pre-rendered video',
    desc: 'the same window as a 60 fps video from the exporter; the hardware decoder draws every frame, the main thread draws nothing',
    async setup(stage) {
      stage.innerHTML = '<video class="vid" muted playsinline preload="auto"></video>';
      const v = stage.firstChild;
      v.muted = true; v.playsInline = true;
      v.src = 'assets/clip.mp4';
      await waitEvent(v, 'canplaythrough', 20000).catch(() => {});
      v.currentTime = 0;
      await waitEvent(v, 'seeked', 5000).catch(() => {});
      return { v, samples: [], q0: null, stopped: false };
    },
    start(ctx) {
      const v = ctx.v;
      const cb = (now, md) => {
        if (ctx.stopped) return;
        if (ctx.measuring) ctx.samples.push({ edt: md.expectedDisplayTime, mt: md.mediaTime * 1000, pf: md.presentedFrames });
        v.requestVideoFrameCallback(cb);
      };
      if (hasRVFC) v.requestVideoFrameCallback(cb);
      return v.play();
    },
    measureStart(ctx) {
      ctx.measuring = true;
      ctx.q0 = ctx.v.getVideoPlaybackQuality ? ctx.v.getVideoPlaybackQuality() : null;
    },
    frame() {},
    teardown(ctx) {
      ctx.stopped = true;
      const v = ctx.v;
      const q1 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      v.pause();
      const out = { rvfc: hasRVFC };
      if (q1 && ctx.q0) out.decoder = { frames: q1.totalVideoFrames - ctx.q0.totalVideoFrames, dropped: q1.droppedVideoFrames - ctx.q0.droppedVideoFrames };
      if (hasRVFC) out.presentation = presentation(ctx.samples, A.fps);
      v.removeAttribute('src'); v.load();
      return out;
    },
  };

  const LANES = { A0, A1, A2, B, C };

  // ------------------------------------------------------------ the runner
  // THE COST OF A FRAME, device-independent: the lane's own JavaScript, and the
  // whole main-thread frame (JS + style + layout + paint), measured by a message
  // posted from rAF, which runs after the browser has rendered that frame. On a
  // fast machine every lane makes its frames; the cost says how much headroom a
  // cheap stand will have (a 5x-slower tablet multiplies it by 5).
  function costOf(list) {
    const s = S.sorted(list);
    return { p50: S.r2(S.pct(s, 50)), p95: S.r2(S.pct(s, 95)), max: S.r1(S.pct(s, 100)) };
  }
  function laneLoop(lane, ctx, o) {
    return new Promise(resolve => {
      const rec = new S.FrameRecorder(), lt = new S.LongTasks(), load = new S.Load(o.load);
      let tStart = null, measuring = false, lastHud = -1e9, aborted = false;
      const jsMs = [], frameMs = [];
      const mc = new MessageChannel();
      let pendingStart = null;
      mc.port1.onmessage = () => { if (pendingStart !== null) { frameMs.push(performance.now() - pendingStart); pendingStart = null; } };
      theater.onExit = () => { aborted = true; };
      const total = o.warm + o.seconds;
      function step(ts) {
        if (tStart === null) tStart = ts;
        const el = (ts - tStart) / 1000;
        const t = A.t0 + el;
        const k = Math.min(A.trace.frames - 1, Math.max(0, Math.round(el * A.fps)));
        const c0 = performance.now();
        try { lane.frame(ctx, t, k, ts); } catch (e) { return resolve({ error: String(e && e.message || e) }); }
        const c1 = performance.now();
        if (measuring) { jsMs.push(c1 - c0); if (pendingStart === null) { pendingStart = c0; mc.port2.postMessage(0); } }
        if (!measuring && el >= o.warm) { measuring = true; lt.start(); if (lane.measureStart) lane.measureStart(ctx); }
        if (measuring) { rec.tick(ts); load.tick(ts); }
        if (ts - lastHud > 1000) { lastHud = ts; o.hud(lane.label + (o.load !== 'off' ? ' · load ' + o.load : '') + ' — ' + Math.max(0, Math.ceil(total - el)) + ' s'); }
        if (el >= total || aborted) {
          const s = rec.summary();
          s.longTasks = lt.stop();
          s.load = load.level;
          s.laneJsMs = costOf(jsMs);
          s.mainThreadFrameMs = costOf(frameMs);
          if (aborted) s.aborted = true;
          mc.port1.close();
          return resolve(s);
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  async function runT2(opts, say) {
    const o = Object.assign({ seconds: 15, warm: 1, loads: ['off', 'heavy'], lanes: ['A0', 'A1', 'A2', 'B', 'C'] }, opts || {});
    await loadAssets(say);
    const th = theater.open();
    const out = {
      window: [A.t0, A.t0 + o.warm + o.seconds], seconds: o.seconds, loads: o.loads, lanes: {},
      note: 'A1/A2/B replay the engine\'s precomputed per-frame state (trace.json) to isolate the rendering strategy; A0 runs the engine itself. B draws the page from an SVG image with the fonts embedded.',
    };
    try {
      for (const id of o.lanes) {
        const lane = LANES[id];
        out.lanes[id] = { label: lane.label, desc: lane.desc, runs: {} };
        for (const load of o.loads) {
          th.hud(lane.label + ' — preparing');
          th.stage.innerHTML = '';
          let ctx;
          try { ctx = await lane.setup(th.stage); } catch (e) { out.lanes[id].runs[load] = { error: 'setup: ' + (e && e.message || e) }; continue; }
          await S.sleep(500);
          if (lane.start) { try { await lane.start(ctx); } catch (e) { /* autoplay refused etc. — measured as-is */ } }
          const fr = await laneLoop(lane, ctx, { warm: o.warm, seconds: o.seconds, load, hud: s => th.hud(s) });
          const extras = lane.teardown ? await lane.teardown(ctx) : null;
          out.lanes[id].runs[load] = Object.assign({ frames: fr }, extras || {});
          th.stage.innerHTML = '';
          if (fr.aborted) throw new Error('stopped by the user');
          await S.sleep(300);
        }
      }
    } finally {
      th.close();
    }
    return out;
  }

  TK.lanes = { loadAssets, theater, LANES, runT2, presentation, waitEvent, hasRVFC, assets: () => A };
})(typeof self !== 'undefined' ? self : this);
