// midiplayer.js — LIVE MIDI under the notation transport (the composer's
// working-loop playback: no render needed, the daily Reaper/UVI rig sounds).
//
// A transport CONSUMER, not a timebase (D47: the clock stays transport.js;
// this module only ever receives `t`). Semantics are a faithful port of
// composer.html's tickCurvePlayback: prearm CC0/KS/CC7 at -0.15 s · noteOn
// (recVel for plain notes) · CC7 stream tracing the curve >= 25 ms
// on-change · morph bend stream + residue cure · noteOff on exit · the
// flush cure (CC7=127 sweep on every touched channel). Math + lookups come
// from sonify_core.js — the same computation export_midi.js serializes, so
// what you hear live IS what the recording plays.
//
// Scrub behavior matches the live app: seeking into the middle of a note
// starts it mid-flight; seeking away releases it.
//
//   makeMidiPlayer({ score, instruments, ccPoints, outputs, levelSpanDb? })
//     -> { tick(t), flush(), missingPorts(), stats() }
//   · outputs: { portNameLower -> WebMIDI output } (composer.html's map shape)
//   · call tick(t) each frame WHILE PLAYING; call flush() on pause/stop/exit.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root && root.SonifyCore);
  else root.NotationMidiPlayer = factory(root.SonifyCore);
})(typeof self !== 'undefined' ? self : this, function (SonifyCoreArg) {
  const Core = SonifyCoreArg || (typeof require === 'function' ? require('../../score/public/sonify_core.js') : null);

  function makeMidiPlayer(cfg) {
    const score = cfg.score, instruments = cfg.instruments, ccPoints = cfg.ccPoints;
    const outputs = cfg.outputs || {};
    const spanDb = cfg.levelSpanDb != null ? cfg.levelSpanDb : Core.LEVEL_SPAN_DB;
    const PREARM_S = Core.PREARM_S;

    const active = {};        // wc.id -> { note, port, ch, lastCC, lastSendT, lastBend }
    const prearmed = {};      // wc.id -> true once entry CC went out
    const touched = new Set(); // 'port|ch' any event went to (the flush sweep list)
    const bentCh = new Set(); // 'port|ch' a morph bend touched
    const missing = new Set(); // ports the score wants but no output exists
    let lastT = null;
    let sent = 0;

    // resolution cache — 4400 objects/frame; techniqueFor is pure per (layer, technique)
    const resCache = new Map();
    function resolve(wc) {
      const key = wc.layer + '|' + (wc.technique || '');
      let r = resCache.get(key);
      if (r === undefined) { r = Core.techniqueFor(wc, instruments); resCache.set(key, r); }
      return r;
    }
    const send = (out, key, bytes) => { out.send(bytes); touched.add(key); sent++; };

    function tick(t) {
      const prev = lastT;
      lastT = t;
      if (prev == null) return;   // first tick after (re)start: establish position only

      for (const wc of score.objects || []) {
        if (wc.type !== 'waveCurve' || wc.sonifyNote == null) continue;
        // cheap reject before any lookup (the whole piece is iterated per frame)
        if (t < wc.startSeconds - PREARM_S - 1 && !active[wc.id]) continue;
        if (t > wc.endSeconds + 1 && !active[wc.id]) continue;
        const r = resolve(wc);
        if (!r || !r.port) continue;
        const out = outputs[r.port];
        if (!out) { missing.add(r.port); continue; }
        const ch = r.ch, key = r.port + '|' + ch;
        const tech = r.tech;
        const st = active[wc.id];

        const ksMode = (wc.sonifyMode === 'ks' && wc.ksNote != null) || wc.sonifyMode === 'plain';
        const ksArm = () => {
          if (wc.sonifyMode === 'ks' && wc.ksNote != null) {
            send(out, key, [0x90 | ch, wc.ksNote, 100]);
            send(out, key, [0x80 | ch, wc.ksNote, 0]);
          }
          send(out, key, [0xB0 | ch, 7, wc.sonifyMode === 'plain' ? 127
            : Core.curveValToCC(Math.max(...wc.nodes.map(n => n.y)) / 10, ccPoints, spanDb)]);
        };

        const inside = t >= wc.startSeconds && t <= wc.endSeconds;
        if (!inside) {
          if (st) {
            send(out, key, [0x80 | ch, st.note, 0]);
            if (st.lastBend != null) send(out, key, [0xE0 | ch, 0, 64]);  // residue cure
            delete active[wc.id];
          }
          if (t >= wc.startSeconds - PREARM_S && t < wc.startSeconds) {
            if (!prearmed[wc.id]) {
              if (tech && tech.cc0 != null) send(out, key, [0xB0 | ch, 0, tech.cc0]);
              if (ksMode) ksArm();
              else send(out, key, [0xB0 | ch, 7, Core.curveValToCC(Core.evalWaveCurve(wc, 0), ccPoints, spanDb)]);
              prearmed[wc.id] = true;
            }
          } else {
            delete prearmed[wc.id];
          }
          continue;
        }
        const t01 = (t - wc.startSeconds) / Math.max(1e-6, wc.endSeconds - wc.startSeconds);
        const cc = ksMode ? null : Core.curveValToCC(Core.evalWaveCurve(wc, t01), ccPoints, spanDb);
        if (!st) {
          if (!prearmed[wc.id]) {   // scrubbed in mid-curve: no pre-arm happened
            if (tech && tech.cc0 != null) send(out, key, [0xB0 | ch, 0, tech.cc0]);
            if (ksMode) ksArm();
            else send(out, key, [0xB0 | ch, 7, cc]);
          }
          send(out, key, [0x90 | ch, wc.sonifyNote,
            (wc.sonifyMode === 'plain' && wc.recVel != null) ? wc.recVel : 100]);
          delete prearmed[wc.id];
          active[wc.id] = { note: wc.sonifyNote, port: r.port, ch, lastCC: cc, lastSendT: t, lastBend: null };
          continue;
        }
        // CC7 stream: >= 25 ms apart, on change — paced by transport t, not a
        // wall clock (D47: nothing downstream reads a time source)
        if (!ksMode && cc !== st.lastCC && Math.abs(t - st.lastSendT) >= Core.CC_STEP_S) {
          send(out, key, [0xB0 | ch, 7, cc]);
          st.lastCC = cc; st.lastSendT = t;
        }
        if (wc.morphBend && wc.morphBend.length) {
          const bv = Math.round(Core.morphBendAt(wc.morphBend, t - wc.startSeconds));
          if (bv !== st.lastBend) {
            const v = Core.bend14(bv);
            send(out, key, [0xE0 | ch, v & 0x7F, (v >> 7) & 0x7F]);
            st.lastBend = bv;
            bentCh.add(key);
          }
        }
      }
    }

    // flushCurvePlayback's cure, whole: active offs + bend center where bent
    // + CC7=127 sweep on EVERY touched channel (the "tracks very quiet" class)
    function flush() {
      for (const id of Object.keys(active)) {
        const st = active[id];
        const out = outputs[st.port];
        if (out) send(out, st.port + '|' + st.ch, [0x80 | st.ch, st.note, 0]);
        delete active[id];
      }
      for (const key of bentCh) {
        const [port, chS] = key.split('|'); const out = outputs[port];
        if (out) out.send([0xE0 | +chS, 0, 64]);
      }
      bentCh.clear();
      for (const key of touched) {
        const [port, chS] = key.split('|'); const out = outputs[port];
        if (out) out.send([0xB0 | +chS, 7, 127]);
      }
      touched.clear();
      for (const id of Object.keys(prearmed)) delete prearmed[id];
      lastT = null;
    }

    return {
      tick, flush,
      missingPorts: () => [...missing].sort(),
      stats: () => ({ active: Object.keys(active).length, sent, touched: touched.size }),
    };
  }

  return { makeMidiPlayer };
});
