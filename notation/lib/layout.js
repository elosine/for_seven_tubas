// layout.js — Phase B4 (+ phase-review fixes): IR chunks → placed layout
// items (architecture §4, passes 3–4). Pure, dual-load, VIEW-INDEPENDENT:
// every item is positioned by (t seconds, dxSs fine offset, ySs from the
// staff middle) — pixels do not exist here (P5). The renderer (B5)
// resolves items through the coords view.
//
// v0 simplifications, stated (plan DB-5/DB-6):
// · All noteheads are filled + stemmed; note VALUES beyond the sub-beat
//   level are not distinguished (no open heads, no rests — rests are gaps
//   and the strip's space IS the gap, spec §7).
// · Sub-beat chunks (subdivision >= 2): OFF-BEAT notes get flag/beam
//   treatment; ON-BEAT notes render quarter-style (review finding — a flag
//   on an on-beat note misstates its metric position). Beams join
//   beat-adjacent neighbors; m>=3 tuplet numerals and double flags/beams
//   are material-time work, recorded.
// · strategy 'proportional' (below the D43 playable floor) renders
//   noteheads/stems WITHOUT metric apparatus (no beams, flags, or bpm
//   label) — the residue treatment is OPEN (E0–E3); only 'simple-bar'
//   gets the full metric dress.
// · Accidental on every altered note (atonal convention, no carry).
// · Authored overlays: 'spelling' is APPLIED before staff placement;
//   'dynamic' renders below the staff, 'instruction' above; every other
//   kind is WARNED about, never silently dropped (amendment 1: authoring
//   wins; review finding: silence was the failure mode).
// · unresolved / unfittable chunks render as PARACHUTE BRICKS.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationLayout = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const STEP_IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const MIDDLE_BASS = 3 * 7 + 1; // D3 — the bass staff's middle line

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

  // Engraving: a stem outside the staff extends to the middle line.
  function stemLenFor(ySs, base) { return Math.max(base, Math.abs(ySs)); }

  // Staccato dot: opposite the stem, centered in a SPACE (never on a line;
  // review finding). On-line heads reach 1.5 ss to the next space center;
  // in-space heads reach 1.0 ss to the next space.
  function dotYFor(ySs, stemDir) {
    const onLine = Math.abs(ySs - Math.round(ySs)) < 1e-6;
    const off = onLine ? 1.5 : 1.0;
    return stemDir === 'up' ? ySs - off : ySs + off;
  }

  function layoutSection(ir, glyphs, opts) {
    const o = Object.assign({ stemLen: 3.5, accGap: 0.25, tagY: 3.5, tempoY: 4.6, tickY: 3.0, dynY: -4.6 }, opts || {});
    const nh = glyphs.notehead.filled;
    const nhHalfW = nh.wSs / 2;
    const upAttach = { dx: nh.anchors.stemAttachUp.x - nh.anchors.center.x, dy: nh.anchors.stemAttachUp.y - nh.anchors.center.y };
    const dnAttach = { dx: nh.anchors.stemAttachDown.x - nh.anchors.center.x, dy: nh.anchors.stemAttachDown.y - nh.anchors.center.y };
    const evById = new Map(ir.events.map(e => [e.id, e]));
    const chById = new Map(ir.chunks.map(c => [c.id, c]));
    const warnings = [];
    const [w0, w1] = ir.source.window;

    // ---- overlay passes (authored channel — amendment 1) ----
    const respell = new Map();   // eventId -> spelled
    const dynTexts = [];         // {part, t, text}
    const instrTexts = [];       // {parts, t, text}
    for (const ov of ir.overlays || []) {
      const tgt = ov.target || {};
      if (ov.kind === 'spelling' && tgt.event) { respell.set(tgt.event, ov.value); continue; }
      if (ov.kind === 'dynamic' && tgt.event) {
        const e = evById.get(tgt.event);
        if (e) {
          const part = (ir.chunks.find(c => c.events.includes(tgt.event)) || {}).part;
          if (part !== undefined) { dynTexts.push({ part, t: e.onset, text: String(ov.value) }); continue; }
        }
      }
      if (ov.kind === 'instruction') {
        const t = tgt.span ? tgt.span[0] : (tgt.chunk && chById.has(tgt.chunk) ? chById.get(tgt.chunk).span[0] : null);
        const parts = tgt.parts || (tgt.part !== undefined ? [tgt.part] : (tgt.chunk && chById.has(tgt.chunk) ? [chById.get(tgt.chunk).part] : null));
        if (t !== null && parts) { instrTexts.push({ parts, t, text: String(ov.value) }); continue; }
      }
      warnings.push('overlay ' + ov.id + ' (' + ov.kind + ') has no layout consumer yet — authored content NOT rendered');
    }

    const spelledOf = e => respell.get(e.id) || e.pitch.spelled;

    const systems = ir.source.parts.map(part => {
      const items = [];
      items.push({ k: 'staff', t0: w0, t1: w1 });
      items.push({ k: 'clef', t: w0 });
      for (const d of dynTexts) if (d.part === part) items.push({ k: 'text', t: d.t, dxSs: 0, ySs: o.dynY, text: d.text, size: 0.9 });
      for (const ins of instrTexts) if (ins.parts.includes(part)) items.push({ k: 'text', t: ins.t, dxSs: 0, ySs: o.tempoY + 1.4, text: ins.text, size: 0.75 });

      const chunks = ir.chunks.filter(c => c.part === part).sort((a, b) => a.span[0] - b.span[0]);
      let prevTempoLabel = null;
      for (const c of chunks) {
        const evs = c.events.map(id => evById.get(id));
        const isStream = c.class === 'trance-stream' && c.strategy !== 'unresolved';
        const metric = isStream && c.strategy === 'simple-bar';
        if (!isStream) {
          for (const e of evs) {
            const ySs = staffPosBass(spelledOf(e));
            items.push({ k: 'brick', t0: e.onset, t1: e.onset + e.duration, ySs, ev: e.id });
          }
          prevTempoLabel = null;
          continue;
        }

        const m = c.tempo ? c.tempo.subdivision : 1;
        if (metric && c.tempo && c.tempo.label !== prevTempoLabel) {
          items.push({ k: 'text', t: c.tempo.anchorSeconds, dxSs: 0, ySs: o.tempoY, text: c.tempo.label, size: 0.75 });
        }
        prevTempoLabel = metric && c.tempo ? c.tempo.label : null;
        for (const d of c.devices || []) if (d.kind === 'gc') items.push({ k: 'tick', t: d.at, ySs: o.tickY });

        // ---- note pass: heads, ledgers, accidentals (no stems/dots yet) ----
        const placed = new Map();
        for (const e of evs) {
          const sp = spelledOf(e);
          const ySs = staffPosBass(sp);
          placed.set(e.id, { e, ySs, stemDir: ySs >= 0 ? 'down' : 'up' });
          items.push({ k: 'glyph', g: 'notehead', t: e.onset, dxSs: 0, ySs, align: 'center' });
          for (const L of ledgersFor(ySs)) items.push({ k: 'ledger', t: e.onset, dxSs: 0, ySs: L });
          if (sp.alter !== 0) {
            const kind = ACC_KIND[String(sp.alter)];
            if (kind) {
              const acc = glyphs.accidental[kind];
              const align = acc.anchors && acc.anchors.noteY ? 'noteY' : 'center';
              items.push({ k: 'glyph', g: 'accidental-' + kind, t: e.onset, dxSs: -(nhHalfW + o.accGap + acc.wSs / 2), ySs, align });
            } else warnings.push(e.id + ': no accidental glyph for alter ' + sp.alter);
          }
          if (e.technique !== 'staccato') {
            items.push({ k: 'text', t: e.onset, dxSs: 0, ySs: o.tagY, text: e.technique === 'fortepiano' ? 'fp' : e.technique, size: 0.7 });
          }
        }

        // ---- beam pass (metric chunks only): beat-adjacent OFF/ON mix ----
        const beamRuns = [];
        if (metric && m >= 2 && c.tempo) {
          const grid = evs.filter(e => e.metric).sort((a, b) => a.metric.grid[0] - b.metric.grid[0]);
          let run = [];
          const flushRun = () => { if (run.length >= 2) beamRuns.push(run); run = []; };
          for (const e of grid) {
            const n = e.metric.grid[0];
            if (!run.length) { run.push(e); continue; }
            const pn = run[run.length - 1].metric.grid[0];
            if (n === pn + 1 && Math.floor(n / m) === Math.floor(pn / m)) run.push(e);
            else { flushRun(); run.push(e); }
          }
          flushRun();
        }
        const doneStem = new Set();
        for (const r of beamRuns) {
          // direction: the note FARTHEST from the middle line decides;
          // ties go DOWN (engraving convention — review finding)
          let ext = placed.get(r[0].id).ySs;
          for (const e of r) { const y = placed.get(e.id).ySs; if (Math.abs(y) > Math.abs(ext)) ext = y; }
          const dir = ext >= 0 ? 'down' : 'up';
          const att = dir === 'up' ? upAttach : dnAttach;
          const ys = r.map(e => placed.get(e.id).ySs);
          const beamYSs = dir === 'up'
            ? Math.max(Math.max(...ys) + o.stemLen, 0)
            : Math.min(Math.min(...ys) - o.stemLen, 0);
          items.push({ k: 'beam', dir, tips: r.map(e => ({ t: e.onset, dxSs: att.dx, ySs: beamYSs })) });
          for (const e of r) {
            const p = placed.get(e.id);
            p.stemDir = dir; // final direction — dots read this later
            items.push({ k: 'stem', t: e.onset, dxSs: att.dx, yA: p.ySs - att.dy, yB: beamYSs, attach: dir });
            doneStem.add(e.id);
          }
        }
        for (const e of evs) {
          if (doneStem.has(e.id)) continue;
          const p = placed.get(e.id);
          const att = p.stemDir === 'up' ? upAttach : dnAttach;
          const yStart = p.ySs - att.dy;
          const L = stemLenFor(p.ySs, o.stemLen);
          const yEnd = p.stemDir === 'up' ? yStart + L : yStart - L;
          items.push({ k: 'stem', t: e.onset, dxSs: att.dx, yA: yStart, yB: yEnd, attach: p.stemDir });
          // flag ONLY off-beat notes of metric sub-beat chunks
          if (metric && m >= 2 && e.metric && e.metric.grid[0] % m !== 0) {
            items.push({ k: 'glyph', g: p.stemDir === 'up' ? 'flag-up8' : 'flag-down8', t: e.onset, dxSs: att.dx, ySs: yEnd, align: 'stemTip' });
          }
        }
        // ---- dot pass: AFTER stem directions are final (review finding) ----
        for (const e of evs) {
          if (e.technique !== 'staccato') continue;
          const p = placed.get(e.id);
          items.push({ k: 'dot', t: e.onset, dxSs: 0, ySs: dotYFor(p.ySs, p.stemDir) });
        }
      }
      return { part, items };
    });

    return { systems, window: [w0, w1], warnings };
  }

  return { layoutSection, staffPosBass, ledgersFor, dotYFor, stemLenFor };
});
