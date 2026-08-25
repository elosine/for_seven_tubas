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
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gc.js'));
  else root.NotationAnimObj = factory(root.NotationGC);
})(typeof self !== 'undefined' ? self : this, function (GC) {

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

  // ---------- the five state functions ----------
  // gc: THE BALL OF THE GC OBJECT (day 23, ported whole from piece #1 —
  // physics + look in notation/lib/gc.js, ONE copy shared with render.js,
  // which draws the static arc + impact marker). inst {part, at, preset?};
  // active over [at − duration·descentRatio, at + duration·(1−descentRatio)].
  // The ball TRAVELS IN TIME along the drawn arc (x = xOfSeconds(t), as
  // piece #1's calculateBallPositionForPage), arriving at the impact marker
  // on the go line exactly at impact. Sizes are piece #1's px at the 1080
  // frame, scaled by the view's magnification (PP-6).
  register('gc', (inst, view, t, st) => {
    const s = view.system(inst.part);
    const P = GC.params(Object.assign({}, st.preset || {}, (inst && inst.preset) || {}));
    const frac = GC.heightFrac(P, t - inst.at);
    if (frac === null) return [];
    const G = GC.laneGeom(s, view, st.look);
    const x = view.xOfSeconds(t);
    const y = G.impactY - frac * G.h;
    const r = G.look.ballRadiusPx * G.k;
    return ['<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) +
      '" fill="' + (st.color || G.look.color) + '"' + (st.opacity != null && st.opacity < 1 ? ' opacity="' + st.opacity + '"' : '') + '/>'];
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

  // glissMeter (day 35, composer: "give it its own curve follower, just the
  // top half bright orange and then everything else the same as the existing
  // one"): curveMeter's mechanism exactly — an outlined meter + fill riding a
  // fixed offset LEFT of the cursor, fill height = the current drawn level —
  // but confined to the TOP HALF of the lane, which is the glissando's half.
  register('glissMeter', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const s = view.system(inst.part);
    const yT = s.yTopPx, yMid = (s.yTopPx + s.yBotPx) / 2, H = yMid - yT;
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
      '<rect x="' + x.toFixed(1) + '" y="' + (yMid - lvl * H).toFixed(1) + '" width="' + w + '" height="' + (lvl * H).toFixed(1) +
        '" fill="' + st.color + '" opacity="' + (st.fillOpacity != null ? st.fillOpacity : 0.3) + '"/>',
    ];
  });

  // crescMeter (day 35): the glissMeter's twin — the same curveMeter
  // mechanism and numbers, confined to the BOTTOM HALF of the lane, which is
  // the crescendo's half, and coloured limeGreen.
  register('crescMeter', (inst, view, t, st) => {
    if (t < inst.t0 || t > inst.t1) return [];
    const s = view.system(inst.part);
    const yMid = (s.yTopPx + s.yBotPx) / 2, yB = s.yBotPx, H = yB - yMid;
    const frac = (t - inst.t0) / Math.max(1e-9, inst.t1 - inst.t0);
    const smp = inst.samples;
    const fi = frac * (smp.length - 1), i0 = Math.floor(fi);
    const lvl = i0 >= smp.length - 1 ? smp[smp.length - 1]
      : smp[i0] + (smp[i0 + 1] - smp[i0]) * (fi - i0);
    const w = st.wPx || 8;
    const x = view.xOfSeconds(t) - w - (st.gapPx != null ? st.gapPx : 3);
    return [
      '<rect x="' + x.toFixed(1) + '" y="' + yMid.toFixed(1) + '" width="' + w + '" height="' + H.toFixed(1) +
        '" fill="none" stroke="' + st.color + '" stroke-width="' + (st.outlineWPx || 1.5) + '" opacity="' + (st.outlineOpacity != null ? st.outlineOpacity : 0.8) + '"/>',
      '<rect x="' + x.toFixed(1) + '" y="' + (yB - lvl * H).toFixed(1) + '" width="' + w + '" height="' + (lvl * H).toFixed(1) +
        '" fill="' + st.color + '" opacity="' + (st.fillOpacity != null ? st.fillOpacity : 0.3) + '"/>',
    ];
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
    // day 35: an IR may switch OFF animated kinds it does not want — the morph
    // page wants its two METERS and none of the dots (composer: "I want the
    // meters. I don't want the dots."). Opt-in: absent = every kind as before.
    const offKinds = (ir && ir.animated) || {};
    const kindOn = k => offKinds[k] !== false;
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
    // the glissando's own meter, one per `gliss` overlay (day 35)
    for (const ov of ((ir && ir.overlays) || [])) {
      const tg = ov.target || {};
      if (ov.kind === 'gliss' && tg.part !== undefined && tg.span && ov.value && ov.value.samples && has(tg.part)) {
        out.push({ kind: 'glissMeter', part: tg.part, t0: tg.span[0], t1: tg.span[1], samples: ov.value.samples, _src: 'ir-gliss' });
      }
      if (ov.kind === 'cresc' && tg.part !== undefined && tg.span && ov.value && ov.value.samples && has(tg.part)) {
        out.push({ kind: 'crescMeter', part: tg.part, t0: tg.span[0], t1: tg.span[1], samples: ov.value.samples, _src: 'ir-cresc' });
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
        if (style.motivePie && style.motivePie.enabled === false) break;   // registry off-switch (day 24)
        if (![...g.layers].every(has)) continue;   // the whole group or no pie
        out.push({ kind: 'motivePie', t0: g.t0, t1: g.t1, color: g.color, groupId: id, _src: 's1-group' });
      }
    }
    return out.filter(i => kindOn(i.kind));
  }

  // one frame: every active instance's state at t, plus the cursor.
  // opts.cursor === false suppresses the cursor line — the per-part solo
  // (day 24) draws the frame in two passes (soloed at full opacity, the
  // rest inside a dimming group) and only the first pass owns the cursor.
  function frameSvg(instances, view, t, style, opts) {
    const [w0, w1] = view.window;
    const parts = [];
    if ((!opts || opts.cursor !== false) && t >= w0 && t <= w1) {
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
