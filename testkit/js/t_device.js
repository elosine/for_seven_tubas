// t_device.js — T5, THE DEVICE REPORT CARD, and T1, FRAME HEALTH.
// T5: what this machine is and what it can do (one glance per device).
// T1: an empty animation loop — the device's own frame cadence, idle and under
//     a synthetic main-thread load — the floor every renderer stands on.
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};
  const S = TK.stats;

  function timerResolution() {
    let min = Infinity, last = performance.now();
    for (let i = 0; i < 20000; i++) {
      const t = performance.now();
      const d = t - last;
      if (d > 0 && d < min) min = d;
      last = t;
    }
    return S.r2(min === Infinity ? null : min * 1000) ;
  }
  function gpu() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return { webgl: false };
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { webgl: true, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR) };
    } catch (e) { return { webgl: false, error: String(e) }; }
  }
  async function wakeLock() {
    if (!('wakeLock' in navigator)) {
      return { available: false, why: isSecureContext ? 'not in this browser' : 'needs HTTPS — this page is plain http on a LAN address (the Hetzner host will be HTTPS)' };
    }
    try {
      const s = await navigator.wakeLock.request('screen');
      await s.release();
      return { available: true, works: true };
    } catch (e) { return { available: true, works: false, why: (e && e.name) + ': ' + (e && e.message) }; }
  }
  async function decoding() {
    const out = {};
    const v = document.createElement('video');
    const types = {
      'H.264 1080p60 (the kit\'s clip)': 'video/mp4; codecs="avc1.64002A"',
      'H.264 1080p30': 'video/mp4; codecs="avc1.640028"',
      'HEVC': 'video/mp4; codecs="hvc1.1.6.L123.B0"',
      'VP9': 'video/webm; codecs="vp09.00.40.08"',
      'AV1': 'video/mp4; codecs="av01.0.08M.08"',
    };
    for (const [k, t] of Object.entries(types)) out[k] = { canPlay: v.canPlayType(t) || 'no' };
    if (navigator.mediaCapabilities && navigator.mediaCapabilities.decodingInfo) {
      try {
        const r = await navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: types['H.264 1080p60 (the kit\'s clip)'], width: 1920, height: 1080, bitrate: 1200000, framerate: 60 } });
        out['H.264 1080p60 (the kit\'s clip)'].supported = r.supported;
        out['H.264 1080p60 (the kit\'s clip)'].smooth = r.smooth;
        out['H.264 1080p60 (the kit\'s clip)'].powerEfficient = r.powerEfficient;
      } catch (e) { /* not answerable here */ }
    }
    return out;
  }
  async function storage() {
    if (!(navigator.storage && navigator.storage.estimate)) return { available: false, why: isSecureContext ? 'not in this browser' : 'needs HTTPS' };
    try {
      const e = await navigator.storage.estimate();
      return { available: true, quotaMB: S.r0(e.quota / 1048576), usedMB: S.r1(e.usage / 1048576) };
    } catch (e) { return { available: false, why: String(e) }; }
  }

  async function runT5() {
    const hz = await S.rafRun(1.5, null);
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform || null,
      cores: navigator.hardwareConcurrency || null,
      memoryGB: navigator.deviceMemory || null,
      screen: { width: screen.width, height: screen.height, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], refreshHz: hz.refreshHz },
      secureContext: isSecureContext,
      timerResolutionUs: timerResolution(),
      gpu: gpu(),
      wakeLock: await wakeLock(),
      requestVideoFrameCallback: TK.lanes.hasRVFC,
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      longTaskApi: new S.LongTasks().supported,
      serviceWorker: 'serviceWorker' in navigator ? (isSecureContext ? 'available' : 'present, but needs HTTPS to register') : 'not in this browser',
      storage: await storage(),
      decoding: await decoding(),
    };
  }

  async function runT1(opts, say) {
    const secs = (opts && opts.quick) ? 10 : 30;
    const th = TK.lanes.theater.open();
    th.stage.innerHTML = '<div class="t1">T1 · an empty animation loop — nothing is drawn; only the device\'s own frame timing is measured</div>';
    const out = {};
    try {
      th.hud('T1 · idle — ' + secs + ' s');
      out.idle = await S.rafRun(secs, null, { load: 'off' });
      th.hud('T1 · under synthetic load (8 ms per frame + a 60 ms stall every 2 s) — ' + secs + ' s');
      out.heavyLoad = await S.rafRun(secs, null, { load: 'heavy' });
    } finally { th.close(); }
    return out;
  }

  TK.device = { runT5, runT1 };
})(typeof self !== 'undefined' ? self : this);
