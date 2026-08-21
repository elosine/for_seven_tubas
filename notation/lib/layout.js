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
    // engraving numbers: code defaults = the V0.10 registry values, so a
    // caller without opts renders identically; the shell passes
    // container.json `engraving.layout` and edits there re-render everywhere.
    const o = Object.assign({ stemLen: 3.5, accGap: 0.25, tagY: 3.5, tempoY: 4.6, tickY: 3.0, dynY: -4.6, nhGapSs: 0.25 }, opts || {});
    const TS = Object.assign({ dynamic: 0.9, instruction: 0.75, tempo: 0.75, technique: 0.7 }, o.textSizes || {});
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
    // [A21/V1] the ENGRAVING-OVERRIDE channel — the tier-3 "kerning" hands:
    // per-event { stemDir, dxSs, dySs, beamBreak }. Build-now-refine-later
    // made structural: polish is a data edit, never a code edit.
    const engrave = new Map();   // eventId -> override value
    // [V1] sectional staff: overlay { kind:'staff', value:'off',
    //   target:{part, span} } suppresses the staff lines in that span
    // ("not every page or every section will have staff").
    const staffOff = [];         // {part, span:[a,b]}
    for (const ov of ir.overlays || []) {
      const tgt = ov.target || {};
      if (ov.kind === 'spelling' && tgt.event) { respell.set(tgt.event, ov.value); continue; }
      if (ov.kind === 'engraving' && tgt.event) { engrave.set(tgt.event, ov.value || {}); continue; }
      if (ov.kind === 'staff' && ov.value === 'off' && tgt.part !== undefined && tgt.span) {
        staffOff.push({ part: tgt.part, span: tgt.span }); continue;
      }
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
    const engOf = id => engrave.get(id) || {};

    const spelledOf = e => respell.get(e.id) || e.pitch.spelled;

    const systems = ir.source.parts.map(part => {
      const items = [];
      // staff lines, minus any authored staff-off spans for this part
      const offs = staffOff.filter(s => s.part === part)
        .map(s => [Math.max(w0, s.span[0]), Math.min(w1, s.span[1])])
        .filter(s => s[1] > s[0]).sort((a, b) => a[0] - b[0]);
      let cur = w0;
      for (const [a, b] of offs) {
        if (a > cur) items.push({ k: 'staff', t0: cur, t1: a });
        cur = Math.max(cur, b);
      }
      if (cur < w1) items.push({ k: 'staff', t0: cur, t1: w1 });
      items.push({ k: 'clef', t: w0 });
      for (const d of dynTexts) if (d.part === part) items.push({ k: 'text', t: d.t, dxSs: 0, ySs: o.dynY, text: d.text, size: TS.dynamic });
      for (const ins of instrTexts) if (ins.parts.includes(part)) items.push({ k: 'text', t: ins.t, dxSs: 0, ySs: o.tempoY + 1.4, text: ins.text, size: TS.instruction });

      const chunks = ir.chunks.filter(c => c.part === part).sort((a, b) => a.span[0] - b.span[0]);
      let prevTempoLabel = null;
      for (const c of chunks) {
        const evs = c.events.map(id => evById.get(id));
        const NOTATED = c.class === 'trance-stream' || c.class === 'density-cloud-note';
        const isStream = NOTATED && c.strategy !== 'unresolved';
        const metric = isStream && c.strategy === 'simple-bar';
        if (!isStream) {
          for (const e of evs) {
            const ySs = staffPosBass(spelledOf(e));
            // hover identity (day 22): what this un-notated material IS —
            // pitch · technique · envelope · mode · span · class/strategy ·
            // source object. Rendered as a native SVG <title> tooltip.
            const sp = spelledOf(e);
            const pname = sp.step + (sp.alter > 0 ? '#'.repeat(sp.alter) : 'b'.repeat(-sp.alter)) + sp.octave;
            const tip = pname + ' · ' + e.technique
              + (e.env ? ' · ' + e.env : '') + (e.mode ? ' · ' + e.mode : '')
              + ' · ' + e.onset.toFixed(2) + '–' + (e.onset + e.duration).toFixed(2) + ' s'
              + ' · ' + c.class + ' / ' + c.strategy + ' · ' + (e.source && e.source.objectId || e.id);
            items.push({ k: 'brick', t0: e.onset, t1: e.onset + e.duration, ySs, ev: e.id, tip });
            // THE SURGE/ENV-CURVE DEVICE, element 1+2 of N (day 22, composer
            // spec; ported from piece #1's viola opening gesture — curve +
            // dotted go line; notehead/dynamics/arrow follow in later
            // iterations). Draws whenever the event carries its drawn level
            // curve; the parachute brick stays until the device is complete.
            if (e.level && e.level.samples && e.level.samples.length >= 2) {
              // cut: a surge IS peak-cut — the notated back edge is a clean
              // 90° drop (composer, day 22); the sounding 2% release ramp
              // stays in the data, only the drawing squares it off
              items.push({ k: 'envcurve', t0: e.onset, t1: e.onset + e.duration, samples: e.level.samples, ev: e.id, cut: e.env === 'surge' });
              items.push({ k: 'goline', t: e.onset, ev: e.id });

              // THE NH-UNIT (device element 3, day 22): open head (stemless)
              // + accidental + ledgers + ottava, right-anchored a fixed gap
              // BEFORE go time (o.nhGapSs; the composer's "2 px" at staff
              // 31.6 = 0.25 ss — expressed in ss so the PP-6 zoom invariant
              // holds). Placement laws = piece #2's locked numbers, now in
              // glyphs.standards (accidental gap D.6 · ottava sessions
              // 57/77 · engage rule = staffRouter's 3-ledger threshold).
              {
                const stds = glyphs.standards;
                const nhO = glyphs.notehead.open;
                const spN = spelledOf(e);
                let yDraw = staffPosBass(spN);
                // ottava: smallest shift bringing the WRITTEN note within
                // 3 ledger lines (|ySs| <= 5); one octave = 3.5 staff steps
                const th = 2 + ((stds.ottava && stds.ottava.ledgerLineThreshold) || 3);
                let octShift = 0;
                while (yDraw > th) { yDraw -= 3.5; octShift++; }
                while (yDraw < -th) { yDraw += 3.5; octShift--; }
                const gapSs = o.nhGapSs != null ? o.nhGapSs : 0.25;
                const ledgers = ledgersFor(yDraw);
                // SYSTEMIC anchor rule (day 22 round 2): the gap before the
                // go line is measured from the unit's RIGHTMOST INK — the
                // ledger overhang when ledgers exist, else the head edge.
                const ledgerExt = ledgers.length
                  ? nhO.wSs * ((stds.ledgerLine && stds.ledgerLine.lengthFraction) || 0.25) : 0;
                const headDx = -(gapSs + ledgerExt + nhO.wSs / 2);
                items.push({ k: 'glyph', g: 'notehead-open', t: e.onset, dxSs: headDx, ySs: yDraw, align: 'center' });
                for (const L of ledgers) items.push({ k: 'ledger', t: e.onset, dxSs: headDx, ySs: L, wSs: nhO.wSs });
                // unit ink extents (grow as elements land) — feed both the
                // accidental clearance and the ottava geometry
                let leftEdgeDx = headDx - nhO.wSs / 2 - ledgerExt * (ledgers.length ? 1 : 0);
                let inkTopY = yDraw + nhO.hSs / 2, inkBotY = yDraw - nhO.hSs / 2;
                if (spN.alter) {
                  const accKind = ({ '1': 'sharp', '-1': 'flat', '2': 'sharp', '-2': 'flat',
                    '0.5': 'quarterSharp', '-0.5': 'quarterFlat',
                    '1.5': 'threeQuarterSharp', '-1.5': 'threeQuarterFlat' })[String(spN.alter)];
                  const acc = accKind && glyphs.accidental[accKind];
                  if (acc) {
                    const accGap = (stds.accidental && stds.accidental.gapToNotehead) || 0.1;
                    const align = acc.anchors && acc.anchors.noteY ? 'noteY' : 'center';
                    // vertical extents of the accidental glyph about the note y
                    const accTopExt = align === 'noteY' ? acc.anchors.noteY.y : acc.hSs / 2;
                    const accBotExt = acc.hSs - accTopExt;
                    // H.4c.3 LEDGER CLEARANCE (piece #2, ported day 22 round
                    // 2 — the composer remembered right): the accidental's
                    // right edge sits the D.6 gap left of WHICHEVER extends
                    // further left — the head's left edge or any ledger the
                    // glyph's y-span touches. (p2 matched ledger y to the
                    // accidental's anchorY; extended here to the glyph bbox,
                    // which degenerates to p2's rule on exact-line notes.)
                    let clearDx = headDx - nhO.wSs / 2;   // head left edge
                    for (const L of ledgers) {
                      if (L <= yDraw + accTopExt + 1e-9 && L >= yDraw - accBotExt - 1e-9) {
                        clearDx = Math.min(clearDx, headDx - nhO.wSs / 2 - ledgerExt);
                        break;
                      }
                    }
                    // anchor-aware horizontal edges (round-2 measurement
                    // finding): a noteY-aligned glyph anchors OFF-CENTER, so
                    // its right edge sits (wSs - anchorX) past the anchor,
                    // not wSs/2 — center alignment is the degenerate case
                    const anchorX = align === 'noteY' ? acc.anchors.noteY.x : acc.wSs / 2;
                    const accDx = clearDx - accGap - (acc.wSs - anchorX);
                    items.push({ k: 'glyph', g: 'accidental-' + accKind, t: e.onset, dxSs: accDx, ySs: yDraw, align });
                    leftEdgeDx = Math.min(leftEdgeDx, accDx - anchorX);
                    inkTopY = Math.max(inkTopY, yDraw + accTopExt);
                    inkBotY = Math.min(inkBotY, yDraw - accBotExt);
                  } else if (accKind === undefined) {
                    warnings.push('nh-unit ' + e.id + ': no accidental glyph for alter ' + spN.alter);
                  }
                }
                if (octShift !== 0) {
                  // bracket over the NOTEHEAD ONLY (composer, round 2): the
                  // hook lands at the head's right edge (+ endPadSs, registry,
                  // default 0). Vertical per session 77: outer VISIBLE edge
                  // sits standardGapSs beyond the unit's outermost INK (head,
                  // accidental, or ledger — whichever reaches furthest), so
                  // the line sits one hookLength past that. Label: 8va/8vb at
                  // one octave, 15ma/15mb at two (clamped, warned beyond).
                  const O = stds.ottava || {};
                  const std = O.standardGapSs || 0.45, hook = O.hookLengthSs || 0.8;
                  const above = octShift > 0;   // sounding higher than written
                  const n = Math.min(2, Math.abs(octShift));
                  if (Math.abs(octShift) > 2) warnings.push('nh-unit ' + e.id + ': ' + Math.abs(octShift) + ' octaves exceeds 15ma — clamped');
                  const label = above ? (n === 1 ? 'va8' : 'ma15') : (n === 1 ? 'vb8' : 'mb15');
                  const ref = above ? inkTopY : inkBotY;
                  const lineY = above ? ref + std + hook : ref - std - hook;
                  items.push({
                    k: 'ottava', t: e.onset, dx0Ss: leftEdgeDx,
                    dx1Ss: headDx + nhO.wSs / 2 + ((O.endPadSs != null) ? O.endPadSs : 0),
                    ySs: lineY, dir: above ? 'above' : 'below', label, ev: e.id,
                  });
                }
              }
            }
          }
          prevTempoLabel = null;
          continue;
        }

        const m = c.tempo ? c.tempo.subdivision : 1;
        if (metric && c.tempo && c.tempo.label !== prevTempoLabel) {
          items.push({ k: 'text', t: c.tempo.anchorSeconds, dxSs: 0, ySs: o.tempoY, text: c.tempo.label, size: TS.tempo });
        }
        prevTempoLabel = metric && c.tempo ? c.tempo.label : null;
        for (const d of c.devices || []) if (d.kind === 'gc') items.push({ k: 'tick', t: d.at, ySs: o.tickY });

        // M4 prototype (PLAN §3 M4): proportional chunks may render as
        // VERTICAL ATTACK LINES at pitch height instead of head+stem —
        // the rapid-staccato device, statically prototyped (the bouncing
        // ball is Phase E runtime). Opt-in via opts.m4AttackLines.
        if (o.m4AttackLines && c.strategy === 'proportional') {
          for (const e of evs) {
            const ySs = staffPosBass(spelledOf(e));
            items.push({ k: 'attackline', t: e.onset, ySs });
            for (const L of ledgersFor(ySs)) items.push({ k: 'ledger', t: e.onset, dxSs: 0, ySs: L });
          }
          continue;
        }

        // ---- note pass: heads, ledgers, accidentals (no stems/dots yet) ----
        // engraving overrides ride here: dxSs shifts ALL of the event's ink
        // (head, ledgers, accidental, stem, flag, dot, beam tip); dySs
        // shifts the head+stem+dot only (ledgers stay on the pitch's lines
        // — a nudge is cosmetic, the pitch is not restated); stemDir wins
        // over the convention.
        const placed = new Map();
        for (const e of evs) {
          const sp = spelledOf(e);
          const eng = engOf(e.id), edx = eng.dxSs || 0, edy = eng.dySs || 0;
          const yPitch = staffPosBass(sp);
          const ySs = yPitch + edy;
          placed.set(e.id, {
            e, ySs, dx: edx,
            stemDir: eng.stemDir === 'up' || eng.stemDir === 'down' ? eng.stemDir : (ySs >= 0 ? 'down' : 'up'),
            stemForced: eng.stemDir === 'up' || eng.stemDir === 'down',
          });
          items.push({ k: 'glyph', g: 'notehead', t: e.onset, dxSs: edx, ySs, align: 'center' });
          for (const L of ledgersFor(yPitch)) items.push({ k: 'ledger', t: e.onset, dxSs: edx, ySs: L });
          if (sp.alter !== 0) {
            const kind = ACC_KIND[String(sp.alter)];
            if (kind) {
              const acc = glyphs.accidental[kind];
              const align = acc.anchors && acc.anchors.noteY ? 'noteY' : 'center';
              items.push({ k: 'glyph', g: 'accidental-' + kind, t: e.onset, dxSs: edx - (nhHalfW + o.accGap + acc.wSs / 2), ySs, align });
            } else warnings.push(e.id + ': no accidental glyph for alter ' + sp.alter);
          }
          if (e.technique !== 'staccato') {
            items.push({ k: 'text', t: e.onset, dxSs: 0, ySs: o.tagY, text: e.technique === 'fortepiano' ? 'fp' : e.technique, size: TS.technique });
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
            if (engOf(e.id).beamBreak) flushRun(); // authored split BEFORE this event
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
          // ties go DOWN (engraving convention — review finding). An
          // authored stemDir on any note of the run forces the whole run.
          let ext = placed.get(r[0].id).ySs;
          for (const e of r) { const y = placed.get(e.id).ySs; if (Math.abs(y) > Math.abs(ext)) ext = y; }
          let dir = ext >= 0 ? 'down' : 'up';
          const forced = r.map(e => placed.get(e.id)).find(p => p.stemForced);
          if (forced) dir = forced.stemDir;
          const att = dir === 'up' ? upAttach : dnAttach;
          const ys = r.map(e => placed.get(e.id).ySs);
          const beamYSs = dir === 'up'
            ? Math.max(Math.max(...ys) + o.stemLen, 0)
            : Math.min(Math.min(...ys) - o.stemLen, 0);
          items.push({ k: 'beam', dir, tips: r.map(e => ({ t: e.onset, dxSs: att.dx + placed.get(e.id).dx, ySs: beamYSs })) });
          for (const e of r) {
            const p = placed.get(e.id);
            p.stemDir = dir; // final direction — dots read this later
            items.push({ k: 'stem', t: e.onset, dxSs: att.dx + p.dx, yA: p.ySs - att.dy, yB: beamYSs, attach: dir });
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
          items.push({ k: 'stem', t: e.onset, dxSs: att.dx + p.dx, yA: yStart, yB: yEnd, attach: p.stemDir });
          // flag ONLY off-beat notes of metric sub-beat chunks
          if (metric && m >= 2 && e.metric && e.metric.grid[0] % m !== 0) {
            items.push({ k: 'glyph', g: p.stemDir === 'up' ? 'flag-up8' : 'flag-down8', t: e.onset, dxSs: att.dx + p.dx, ySs: yEnd, align: 'stemTip' });
          }
        }
        // ---- dot pass: AFTER stem directions are final (review finding) ----
        for (const e of evs) {
          if (e.technique !== 'staccato') continue;
          const p = placed.get(e.id);
          items.push({ k: 'dot', t: e.onset, dxSs: p.dx, ySs: dotYFor(p.ySs, p.stemDir) });
        }
      }
      return { part, items };
    });

    return { systems, window: [w0, w1], warnings };
  }

  return { layoutSection, staffPosBass, ledgersFor, dotYFor, stemLenFor };
});
