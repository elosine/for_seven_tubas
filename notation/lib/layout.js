// layout.js — Phase B4: IR chunks → placed layout items (architecture §4,
// passes 3–4). Pure, dual-load, VIEW-INDEPENDENT: every item is positioned
// by (t seconds, dxSs fine offset, ySs from the staff middle) — pixels do
// not exist here (P5). The renderer (B5) resolves items through the coords
// view.
//
// v0 simplifications, stated (plan DB-5/DB-6):
// · All noteheads are filled + stemmed; note VALUES beyond the sub-beat
//   level are not distinguished (no open heads, no rests — rests are gaps
//   and the strip's space IS the gap, spec §7).
// · Beams render only at sub-beat level (tempo.subdivision >= 2): grid-
//   contiguous neighbors within one beat beam together; lone sub-beat
//   notes get an 8th flag. subdivision == 1 pulses are quarter-style.
// · Accidental on every altered note (atonal convention, no carry).
// · fp/cuivre accents woven in streams get a small text tag (v0 — glyph
//   articulations at material time).
// · unresolved / unfittable chunks render as PARACHUTE BRICKS (per-event
//   translucent blocks at pitch height) — mixed fidelity by construction.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationLayout = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const STEP_IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const MIDDLE_BASS = 3 * 7 + 1; // D3 — the bass staff's middle line

  // Staff position in ss from the middle line (+up), from a spelled pitch.
  function staffPosBass(spelled) {
    const idx = spelled.octave * 7 + STEP_IDX[spelled.step];
    return (idx - MIDDLE_BASS) * 0.5;
  }

  function ledgersFor(ySs) {
    const out = [];
    const a = Math.abs(ySs);
    if (a < 3) return out;
    const s = Math.sign(ySs);
    for (let n = 3; n <= Math.floor(a + 0.001); n++) out.push(s * n);
    return out;
  }

  const ACC_KIND = { '1': 'sharp', '-1': 'flat', '0': 'natural' };

  function layoutSection(ir, glyphs, opts) {
    const o = Object.assign({ stemLen: 3.5, dotGap: 0.5, accGap: 0.25, tagY: 3.5, tempoY: 4.6, tickY: 3.0 }, opts || {});
    const nh = glyphs.notehead.filled;
    const nhHalfW = nh.wSs / 2;
    const upAttach = { dx: nh.anchors.stemAttachUp.x - nh.anchors.center.x, dy: nh.anchors.stemAttachUp.y - nh.anchors.center.y };
    const dnAttach = { dx: nh.anchors.stemAttachDown.x - nh.anchors.center.x, dy: nh.anchors.stemAttachDown.y - nh.anchors.center.y };
    const evById = new Map(ir.events.map(e => [e.id, e]));
    const warnings = [];
    const [w0, w1] = ir.source.window;

    const systems = ir.source.parts.map(part => {
      const items = [];
      items.push({ k: 'staff', t0: w0, t1: w1 });
      items.push({ k: 'clef', t: w0 });

      const chunks = ir.chunks.filter(c => c.part === part);
      for (const c of chunks) {
        const evs = c.events.map(id => evById.get(id));
        const notated = c.class === 'trance-stream' && c.strategy !== 'unresolved';
        if (!notated) {
          // PARACHUTE: bricks at pitch height, one per event.
          for (const e of evs) {
            const ySs = staffPosBass(e.pitch.spelled);
            items.push({ k: 'brick', t0: e.onset, t1: e.onset + e.duration, ySs, ev: e.id });
          }
          continue;
        }

        const m = c.tempo ? c.tempo.subdivision : 1;
        items.push({ k: 'text', t: c.tempo ? c.tempo.anchorSeconds : c.span[0], dxSs: 0, ySs: o.tempoY, text: c.tempo ? c.tempo.label : '', size: 0.75 });
        for (const d of c.devices || []) if (d.kind === 'gc') items.push({ k: 'tick', t: d.at, ySs: o.tickY });

        // note pass
        const placed = new Map(); // eventId -> {ySs, stemDir, attach}
        for (const e of evs) {
          const ySs = staffPosBass(e.pitch.spelled);
          const stemDir = ySs >= 0 ? 'down' : 'up';
          placed.set(e.id, { e, ySs, stemDir });
          items.push({ k: 'glyph', g: 'notehead', t: e.onset, dxSs: 0, ySs, align: 'center' });
          for (const L of ledgersFor(ySs)) items.push({ k: 'ledger', t: e.onset, dxSs: 0, ySs: L });
          if (e.pitch.spelled.alter !== 0) {
            const kind = ACC_KIND[String(e.pitch.spelled.alter)];
            if (kind) {
              const acc = glyphs.accidental[kind];
              items.push({ k: 'glyph', g: 'accidental-' + kind, t: e.onset, dxSs: -(nhHalfW + o.accGap + acc.wSs / 2), ySs, align: 'center' });
            } else warnings.push(e.id + ': no accidental glyph for alter ' + e.pitch.spelled.alter);
          }
          if (e.technique === 'staccato') {
            // the dot sits on the notehead side OPPOSITE the stem:
            // stem up → dot below the head (−ss), stem down → above (+ss)
            const off = nh.hSs / 2 + o.dotGap;
            items.push({ k: 'dot', t: e.onset, dxSs: 0, ySs: stemDir === 'up' ? ySs - off : ySs + off });
          }
          if (e.technique !== 'staccato') {
            items.push({ k: 'text', t: e.onset, dxSs: 0, ySs: o.tagY, text: e.technique === 'fortepiano' ? 'fp' : e.technique, size: 0.7 });
          }
        }

        // stems + beams/flags
        const beamRuns = [];
        if (m >= 2 && c.tempo) {
          // group grid-contiguous neighbors within one beat
          const grid = evs.filter(e => e.metric).sort((a, b) => a.metric.grid[0] - b.metric.grid[0]);
          let run = [];
          const flushRun = () => { if (run.length) beamRuns.push(run); run = []; };
          for (const e of grid) {
            const n = e.metric.grid[0];
            if (!run.length) { run.push(e); continue; }
            const pn = run[run.length - 1].metric.grid[0];
            const sameBeat = Math.floor(n / m) === Math.floor(pn / m);
            if (n === pn + 1 && sameBeat) run.push(e);
            else { flushRun(); run.push(e); }
          }
          flushRun();
        }
        const inBeamRun = new Map();
        for (const r of beamRuns) if (r.length >= 2) for (const e of r) inBeamRun.set(e.id, r);

        const doneStem = new Set();
        for (const r of beamRuns.filter(r => r.length >= 2)) {
          // uniform stem direction: majority vote
          const ups = r.filter(e => placed.get(e.id).ySs < 0).length;
          const dir = ups >= r.length / 2 ? 'up' : 'down';
          const att = dir === 'up' ? upAttach : dnAttach;
          // beam line: 3.5 ss beyond the extreme notehead in stem direction
          const ys = r.map(e => placed.get(e.id).ySs);
          const beamYSs = dir === 'up' ? Math.max(...ys) + o.stemLen : Math.min(...ys) - o.stemLen;
          // NOTE: ySs is musical (+up); item positions keep musical sign.
          const tips = r.map(e => ({ t: e.onset, dxSs: att.dx, ySs: beamYSs }));
          items.push({ k: 'beam', tips });
          for (const e of r) {
            const p = placed.get(e.id);
            // attach point in musical ss: att.dy is box-down-positive, so
            // subtracting converts (same rule as the unbeamed branch below)
            items.push({ k: 'stem', t: e.onset, dxSs: att.dx, yA: p.ySs - att.dy, yB: beamYSs, attach: dir });
            doneStem.add(e.id);
          }
        }
        for (const e of evs) {
          if (doneStem.has(e.id)) continue;
          const p = placed.get(e.id);
          const att = p.stemDir === 'up' ? upAttach : dnAttach;
          const yStart = p.ySs - att.dy; // musical-ss of the attach point (dy is box-down)
          const yEnd = p.stemDir === 'up' ? yStart + o.stemLen : yStart - o.stemLen;
          items.push({ k: 'stem', t: e.onset, dxSs: att.dx, yA: yStart, yB: yEnd, attach: p.stemDir });
          if (m >= 2 && e.metric) items.push({ k: 'glyph', g: p.stemDir === 'up' ? 'flag-up8' : 'flag-down8', t: e.onset, dxSs: att.dx, ySs: yEnd, align: 'stemTip' });
        }
      }
      return { part, items };
    });

    return { systems, window: [w0, w1], warnings };
  }

  return { layoutSection, staffPosBass, ledgersFor };
});
