// animobj.js — V2: THE ANIMATED OBJECT LAYER (D46; the animated sibling of
// the glyph extension contract — see notation/GLYPH_EXTENSION_CONTRACT.md).
//
// THE CONTRACT: every animated object is a pure function
//     state(inst, view, t, style) -> array of SVG strings
// No wall-clock reads, no frame-to-frame state — enforced by source scan
// and by the determinism test (cold-seek T === play-through T) in
// tools/test_animobj.js. That single property is why the same objects run
// in the live app (rAF loop) and the V4 frame-by-frame video export with
// zero divergence.
//
// V2 ports (V0.11 inventory, all five composer-confirmed):
//   gc            — the gravitational conductor ball: falls under gravity,
//                   lands exactly on its anchor (IR chunk devices kind
//                   'gc'); predictive — arrival readable from trajectory.
//   curveFollower — a dot riding a morph-bend curve (S1 morphBend) at the
//                   sounding pitch height. Glissandi.
//   envFollower   — a dot riding a layer-10 META level envelope across the
//                   full parts area. Crescendo shapes.
//   lineWedge     — a filling ring over a long-held note (progress through
//                   the hold). Derived from note duration in V2; authored
//                   bindings can come later.
//   motivePie     — a pie filling over a score GROUP's span (gesture
//                   groups are this piece's motive instances). Piece #1/#2
//                   pie, rebound to group data.
//
// Data bindings live in collect() — each instance records which stratum
// fed it. New device kinds: register(kind, stateFn) + a collect source +
// styling in container.json `animated`. See the contract doc.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationAnimObj = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const REG = {};
  function register(kind, stateFn) { REG[kind] = stateFn; }
  function kinds() { return Object.keys(REG); }

  // ---------- shared helpers (pure) ----------
  const STEP_IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const MIDDLE_BASS = 3 * 7 + 1; // D3 (mirrors layout.staffPosBass — asserted equal in tests)
  const STEPS = [['C',0],['C',1],['D',0],['D',1],['E',0],['F',0],['F',1],['G',0],['G',1],['A',0],['A',1],['B',0]];
  function staffPosOfMidi(midi) {
    const pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
    const idx = oct * 7 + STEP_IDX[STEPS[pc][0]];
    return (idx - MIDDLE_BASS) * 0.5;
  }
  function bendAt(mb, startSeconds, t) {
    if (!mb || !mb.length) return 0;
    const dt = t - startSeconds;
    if (dt <= mb[0][0]) return mb[0][1];
    for (let i = 1; i < mb.length; i++) {
      if (dt <= mb[i][0]) {
        const [t0, v0] = mb[i - 1], [t1, v1] = mb[i];
        return t1 === t0 ? v1 : v0 + (v1 - v0) * (dt - t0) / (t1 - t0);
      }
    }
    return mb[mb.length - 1][1];
  }
  function lvlAt(nodes, frac) {
    if (!nodes || !nodes.length) return 0;
    if (frac <= nodes[0].pos) return nodes[0].lvl;
    for (let i = 1; i < nodes.length; i++) {
      if (frac <= nodes[i].pos) {
        const a = nodes[i - 1], b = nodes[i];
        return b.pos === a.pos ? b.lvl : a.lvl + (b.lvl - a.lvl) * (frac - a.pos) / (b.pos - a.pos);
      }
    }
    return nodes[nodes.length - 1].lvl;
  }
  function arcPath(cx, cy, r, frac) { // pie slice from 12 o'clock, clockwise
    if (frac <= 0) return '';
    if (frac >= 1) return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '"/>';
    const a = -Math.PI / 2 + frac * 2 * Math.PI;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    const large = frac > 0.5 ? 1 : 0;
    return '<path d="M ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' L ' + cx.toFixed(1) + ' ' + (cy - r).toFixed(1) +
      ' A ' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 ' + large + ' 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Z"/>';
  }

  // GC preset → trajectory constants (piece #1's GCMaker formulas). A
  // per-instance `preset:{...}` overrides the registry's, so one note can
  // carry a different ball without a second registry entry.
  function gcParams(st, inst) {
    const P = Object.assign({ stiffness: 62, damping: 100, ictus: 90, descentRatio: 60, duration: 0.6 },
      st.preset || {}, (inst && inst.preset) || {});
    const df = P.descentRatio / 100;
    return {
      descentPower: 1 + (P.ictus / 1000) * 20,
      ascentPower: 1 + P.stiffness / 50,
      rebound: P.damping / 100,
      pre: P.duration * df,
      post: P.duration * (1 - df),
    };
  }

  // ---------- the five state functions ----------
  // gc: inst {part, at}; active [at - flight, at + bounce]. Fixed x at the
  // anchor; ball falls from `dropSs` above the tick, height ∝ (time left)²
  // (flight time readable from the trajectory — the preparatory-beat
  // property), one damped bounce after impact.
  // THE REAL GC TRAJECTORY (day 23) — ported verbatim from the string
  // quartet's GCMaker.generateTrajectory (piece #1, public/index.html):
  //   descentPower = 1 + (ictus/1000)·20      ascentPower = 1 + stiffness/50
  //   reboundFraction = damping/100           descentFraction = descentRatio/100
  //   descent  y = h·(1 − u^descentPower)     u: 0→1 over duration·descentFraction
  //   ascent   y = h·rebound·(1 − (1−u)^ascentPower)
  // Timing is asymmetric about the impact and comes straight from the
  // preset: the ball is airborne duration·descentFraction BEFORE the go
  // point and duration·(1−descentFraction) after. The five preset numbers
  // are registry data (animated.gc); piece #1's own records confirm the
  // convention — every GC in its 6:10 section has
  // start = impact − 0.36, end = impact + 0.24 at duration 0.6 / ratio 60.
  register('gc', (inst, view, t, st) => {
    const s = view.system(inst.part);
    const P = gcParams(st, inst);
    if (t < inst.at - P.pre || t > inst.at + P.post) return [];
    const x = view.xOfSeconds(inst.at);
    // THE BALL SPANS THE LANE (day 23, composer, after seeing the first
    // version): "the impact point at the bottom of the track and the arc
    // to stop at the very top of the track ... the vertical trajectory of
    // the ball will be the whole lane height." So the geometry is
    // LANE-relative, not staff-step-relative — impact at the lane bottom,
    // apex at the lane top, each inset by the ball's radius so the disc is
    // whole at both extremes (insetSs 0 puts its CENTRE on the edges).
    // It therefore scales with lane height, part count and zoom on its own.
    // span:'staffSteps' returns to the old landSs/dropSs staging.
    const r = st.radiusSs * s.ssPx;
    const laneMode = st.span !== 'staffSteps';
    const inset = laneMode ? (st.insetSs != null ? st.insetSs * s.ssPx : r) : 0;
    const yLand = laneMode ? s.yBotPx - inset : s.yOfSs(st.landSs);
    const dropPx = laneMode ? (s.yBotPx - s.yTopPx) - 2 * inset : st.dropSs * s.ssPx;
    // clamp: at the exact window edge floating point can hand back u = -1e-16,
    // and Math.pow(negative, 2.8) is NaN — a silent invisible ball (found by
    // the battery on the first run, day 23)
    const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u);
    let hFrac;
    if (t <= inst.at) {
      const u = cl(P.pre > 0 ? (t - (inst.at - P.pre)) / P.pre : 1);
      hFrac = 1 - Math.pow(u, P.descentPower);
    } else {
      const u = cl(P.post > 0 ? (t - inst.at) / P.post : 1);
      hFrac = P.rebound * (1 - Math.pow(1 - u, P.ascentPower));
    }
    const y = yLand - hFrac * dropPx;
    return ['<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) +
      '" fill="' + st.color + '"/>'];
  });

  // curveFollower: inst {part, t0, t1, midi, morphBend}; dot at the
  // SOUNDING pitch height while the morph plays (0.25 ss/semitone approx).
  register('curveFollower', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const s = view.system(inst.part);
    const ySs = staffPosOfMidi(inst.midi) + bendAt(inst.morphBend, inst.t0, t) * 0.25;
    return ['<circle cx="' + view.xOfSeconds(t).toFixed(1) + '" cy="' + s.yOfSs(ySs).toFixed(1) +
      '" r="' + (st.radiusSs * s.ssPx).toFixed(1) + '" fill="' + st.color + '" opacity="' + st.opacity + '"/>'];
  });

  // envFollower: inst {t0, t1, nodes[{pos,lvl 0..1}], color}; dot riding
  // the META level envelope over the FULL parts area (like the overlay).
  register('envFollower', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const yTop = view.systems[0].yTopPx, yBot = view.systems[view.systems.length - 1].yBotPx;
    const frac = (t - inst.t0) / (inst.t1 - inst.t0);
    const y = yBot - lvlAt(inst.nodes, frac) * (yBot - yTop);
    return ['<circle cx="' + view.xOfSeconds(t).toFixed(1) + '" cy="' + y.toFixed(1) +
      '" r="' + st.radiusPx + '" fill="' + (inst.color || st.color) + '" opacity="' + st.opacity + '"/>'];
  });

  // curveMeter (day 22, THE piece-#2 curve follower, ported mechanism):
  // while an event with a drawn level curve plays, an outlined meter +
  // fill rect ride a fixed offset LEFT of the cursor in that part's lane;
  // the fill's height IS the current level (grows from the lane bottom).
  // p2 numbers: 8 px wide, 3 px gap, fill 0.3, outline 1.5 @ 0.8.
  register('curveMeter', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const s = view.system(inst.part);
    const yT = s.yTopPx, yB = s.yBotPx, H = yB - yT;
    const frac = (t - inst.t0) / Math.max(1e-9, inst.t1 - inst.t0);
    const smp = inst.samples;
    const fi = frac * (smp.length - 1), i0 = Math.floor(fi);
    const lvl = i0 >= smp.length - 1 ? smp[smp.length - 1]
      : smp[i0] + (smp[i0 + 1] - smp[i0]) * (fi - i0);
    const w = st.wPx || 8;
    const x = view.xOfSeconds(t) - w - (st.gapPx != null ? st.gapPx : 3);
    return [
      '<rect x="' + x.toFixed(1) + '" y="' + yT.toFixed(1) + '" width="' + w + '" height="' + H.toFixed(1) +
        '" fill="none" stroke="' + st.color + '" stroke-width="' + (st.outlineWPx || 1.5) + '" opacity="' + (st.outlineOpacity != null ? st.outlineOpacity : 0.8) + '"/>',
      '<rect x="' + x.toFixed(1) + '" y="' + (yB - lvl * H).toFixed(1) + '" width="' + w + '" height="' + (lvl * H).toFixed(1) +
        '" fill="' + st.color + '" opacity="' + (st.fillOpacity != null ? st.fillOpacity : 0.3) + '"/>',
    ];
  });

  // lineWedge: inst {part, t0, t1, ySs}; a ring above the note filling
  // with progress through the hold.
  register('lineWedge', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const s = view.system(inst.part);
    const frac = (t - inst.t0) / (inst.t1 - inst.t0);
    const cx = view.xOfSeconds(inst.t0), cy = s.yOfSs(st.ySs), r = st.radiusSs * s.ssPx;
    return [
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) +
        '" fill="none" stroke="' + st.color + '" stroke-width="1" opacity="0.4"/>',
      '<g fill="' + st.color + '" opacity="' + st.opacity + '">' + arcPath(cx, cy, r, frac) + '</g>',
    ];
  });

  // motivePie: inst {t0, t1, color}; a pie at the group's start, top of
  // the frame, filling over the group's span (gesture groups = this
  // piece's motive instances).
  register('motivePie', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const frac = (t - inst.t0) / (inst.t1 - inst.t0);
    const cx = view.xOfSeconds(inst.t0), cy = st.topPx, r = st.radiusPx;
    return [
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + (inst.color || st.color) + '" stroke-width="1" opacity="0.5"/>',
      '<g fill="' + (inst.color || st.color) + '" opacity="' + st.opacity + '">' + arcPath(cx, cy, r, frac) + '</g>',
    ];
  });

  // ---------- data bindings: strata → instances ----------
  // Each instance records its source stratum. score may be null (IR-only).
  // opts (day 22, the collapse): { parts, meta }. Instances are SCOPED TO
  // THE SAVE — the ten-lane frame exposed every score-wide object (phantom
  // pies, other parts' wedges). Part-bearing kinds filter to the save's
  // parts; motivePie qualifies only when its WHOLE group lives inside them
  // (a lone member isn't the group); envFollower rides the META overlay's
  // visibility (opts.meta).
  function collect(ir, score, style, opts) {
    const O = opts || {};
    const partList = O.parts || (ir && ir.source && ir.source.parts) || null;
    const allowed = partList ? new Set(partList) : null;   // null = unscoped
    const has = l => !allowed || allowed.has(l);
    const metaOn = O.meta !== false;
    const out = [];
    const evById = new Map(((ir && ir.events) || []).map(e => [e.id, e]));
    // per-NOTE GC (day 23, wc-29): the engraving device may put a ball on a
    // single note — its impact is the note's go time, so the ball lands on
    // the go line. The resolver comes from the caller (layout.deviceResolver)
    // so this module keeps no second copy of the membership rules (D50).
    const devOf = typeof O.deviceOf === 'function' ? O.deviceOf : null;
    for (const c of (ir && ir.chunks) || []) {
      for (const d of c.devices || []) {
        if (d.kind === 'gc') out.push({ kind: 'gc', part: c.part, at: d.at, _src: 'ir-device' });
      }
      if (devOf) for (const id of c.events || []) {
        const e = evById.get(id);
        if (!e) continue;
        const dv = devOf(e) || {};
        if (dv.gc) out.push(Object.assign({ kind: 'gc', part: c.part, at: e.onset, _src: 'device' },
          typeof dv.gc === 'object' ? { preset: dv.gc } : {}));
      }
      // curveMeter rides every event that carries its drawn level (stratum
      // 3 data — no side files, per the A21b strata rule)
      for (const id of c.events || []) {
        const e = evById.get(id);
        if (e && e.level && e.level.samples && e.level.samples.length >= 2) {
          out.push({ kind: 'curveMeter', part: c.part, t0: e.onset, t1: e.onset + e.duration, samples: e.level.samples, _src: 'ir-level' });
        }
      }
    }
    // notes whose device already visualizes progress (a drawn level curve →
    // envcurve + curveMeter) don't get the generic hold-wedge on top
    // (composer, day 22: "still a pie at the go cursor — take that away")
    const leveled = new Set(((ir && ir.events) || [])
      .filter(e => e.level && e.level.samples)
      .map(e => e.source && e.source.objectId).filter(Boolean));
    if (score && score.objects) {
      const groups = new Map();
      for (const o of score.objects) {
        if (o.type !== 'waveCurve') continue;
        if (o.morphBend && o.layer <= 9 && has(o.layer)) {
          out.push({ kind: 'curveFollower', part: o.layer, t0: o.startSeconds, t1: o.endSeconds, midi: o.sonifyNote, morphBend: o.morphBend, _src: 's1-morph' });
        }
        if (metaOn && o.layer === 10 && o.nodes && o.nodes.length) {
          out.push({
            kind: 'envFollower', t0: o.startSeconds, t1: o.endSeconds, color: o.color,
            nodes: o.nodes.map(n => ({ pos: n.pos, lvl: Math.min(10, Math.max(0, n.y)) / 10 })), _src: 's1-meta',
          });
        }
        if (o.layer <= 9 && !o.morphBend && has(o.layer) && !leveled.has(o.id)
          && (o.endSeconds - o.startSeconds) >= style.lineWedge.minHoldSeconds) {
          out.push({ kind: 'lineWedge', part: o.layer, t0: o.startSeconds, t1: o.endSeconds, _src: 's1-hold' });
        }
        if (o.groupId) {
          const g = groups.get(o.groupId) || { t0: Infinity, t1: -Infinity, color: o.color, layers: new Set() };
          g.t0 = Math.min(g.t0, o.startSeconds); g.t1 = Math.max(g.t1, o.endSeconds);
          if (o.layer <= 9) g.layers.add(o.layer);
          groups.set(o.groupId, g);
        }
      }
      for (const [id, g] of groups) {
        if (![...g.layers].every(has)) continue;   // the whole group or no pie
        out.push({ kind: 'motivePie', t0: g.t0, t1: g.t1, color: g.color, groupId: id, _src: 's1-group' });
      }
    }
    return out;
  }

  // one frame: every active instance's state at t, plus the cursor
  function frameSvg(instances, view, t, style) {
    const [w0, w1] = view.window;
    const parts = [];
    if (t >= w0 && t <= w1) {
      const yTop = view.systems[0].yTopPx, yBot = view.systems[view.systems.length - 1].yBotPx;
      const x = view.xOfSeconds(t);
      parts.push('<line x1="' + x.toFixed(1) + '" y1="' + yTop.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + yBot.toFixed(1) +
        '" stroke="' + style.cursor.color + '" stroke-width="' + style.cursor.wPx + '" opacity="' + style.cursor.opacity + '"/>');
    }
    for (const inst of instances) {
      const fn = REG[inst.kind];
      if (!fn) continue;
      const st = style[inst.kind] || {};
      try {
        if (inst.part !== undefined) view.system(inst.part); // part not in view → skip
        for (const s of fn(inst, view, t, st)) parts.push(s);
      } catch (e) { /* instance outside this view's parts */ }
    }
    return parts.join('\n');
  }

  return { register, kinds, collect, frameSvg, staffPosOfMidi, bendAt, lvlAt, arcPath, _registry: REG };
});
