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

  // ONE copy of the membership rules (D50): byTechnique → byEnv → per-item
  // override. layoutSection uses it internally; deviceResolver exposes the
  // same function to other modules (animobj's per-note GC) so the rules are
  // never re-implemented next door.
  function makeDeviceOf(DEV, engOf) {
    return e => Object.assign({},
      (DEV.byTechnique || {})[e.technique] || {},
      (e.env && (DEV.byEnv || {})[e.env]) || {},
      (engOf(e.id) || {}).device || {});
  }

  // Public: build the resolver from an IR + the registry engraving.layout
  // (the same opts layoutSection takes). Reads the IR's engraving overlays
  // so a per-item `device:{}` override is honoured here too.
  function deviceResolver(ir, opts) {
    const o = opts || {};
    const DEV = Object.assign({
      byEnv: { surge: { curve: true, cut: true, goLine: true, nhUnit: true, dynPair: true } },
      byTechnique: {
        fortepiano: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp' },
        staccato: { goLine: true, gc: true, nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'flag8', nhStemRule: 'flagClear', nhDot: true, nhDotGapSs: 0.15, nhGapSs: 0.6, dynMark: 'band', dynBesideStem: true },
      },
    }, o.devices || {});
    const engrave = new Map();
    for (const ov of (ir && ir.overlays) || []) {
      if (ov.kind === 'engraving' && ov.target && ov.target.event)
        engrave.set(ov.target.event, Object.assign({}, engrave.get(ov.target.event), ov.value));
    }
    return makeDeviceOf(DEV, id => engrave.get(id) || {});
  }

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
    // NEXT ATTACK IN THE PART (day 23): the ring bar ends a breath before the
    // NEXT GESTURE, so the player has time to take it. Built once per part
    // from every event the IR carries — technique-blind, as the composer put
    // it ("the next gesture minus breath").
    const nextOnset = new Map();
    {
      const byPart = new Map();
      for (const c of ir.chunks) for (const id of c.events || []) {
        const ev = evById.get(id); if (!ev) continue;
        if (!byPart.has(c.part)) byPart.set(c.part, []);
        byPart.get(c.part).push(ev);
      }
      for (const list of byPart.values()) {
        list.sort((a, b) => a.onset - b.onset);
        // the next attack is the next STRICTLY LATER onset — notes sharing an
        // onset are one gesture (a chord/simultaneity), not a next attack to
        // breathe before. Found by the battery, whose fixture stacks three
        // events at one onset and had the bar refuse to draw.
        for (let i = 0; i < list.length; i++) {
          const later = list.find(x => x.onset > list[i].onset + 1e-9);
          if (later) nextOnset.set(list[i].id, later.onset);
        }
      }
    }
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

    // DEVICE MEMBERSHIP IS REGISTRY DATA (day 22, second note): which
    // drawn elements an un-notated event carries — curve · go line ·
    // nh-unit · dynamic pair — resolved by ENV first (surge), then by
    // TECHNIQUE (fortepiano), then the per-item engraving override
    // (`device: {...}`) on top. Code defaults mirror container.json
    // engraving.layout.devices so a caller without opts renders the same.
    // The composer works note by note, in order; a technique entry here
    // is how a settled note's device reaches its siblings (§6 derivation).
    const DEV = Object.assign({
      byEnv: { surge: { curve: true, cut: true, goLine: true, nhUnit: true, dynPair: true } },
      byTechnique: {
        fortepiano: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp' },
        // wc-29 (day 23, composer): "black note head, stem, and one flag" —
        // the same unit builder with a filled head and a flagged stem; no
        // go line / ring bar / dynamic until asked
        staccato: { goLine: true, gc: true, nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'flag8', nhStemRule: 'flagClear', nhDot: true, nhDotGapSs: 0.15, nhGapSs: 0.6, dynMark: 'band', dynBesideStem: true },
      },
    }, o.devices || {});
    const deviceOf = makeDeviceOf(DEV, engOf);

    const spelledOf = e => respell.get(e.id) || e.pitch.spelled;

    // frameParts (day 22, the collapse): when given, EVERY listed lane gets
    // a system — lanes the IR doesn't cover render as empty staves (the
    // composer's "I should still see empty other tracks"). Default = the
    // IR's own parts (proofing views, tests, exports unchanged).
    const systems = (o.frameParts || ir.source.parts).map(part => {
      const items = [];
      // BEAMED CLUSTER (day 23, composer): notes carrying the same
      // device.beamGroup are drawn as small heads + stems reaching ONE beam
      // held at the flagged-stem height. Tips accumulate here and flush to a
      // single beam item after the chunk walk.
      const beamGroups = new Map();
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
            // THE SURGE/ENV-CURVE DEVICE (day 22, composer spec; ported from
            // piece #1's viola opening gesture — curve + dotted go line +
            // nh-unit + dynamic pair/arrow). Membership per deviceOf(e);
            // the parachute brick stays until the device is complete.
            const dev = deviceOf(e);
            const hasCurve = dev.curve && e.level && e.level.samples && e.level.samples.length >= 2;
            if (hasCurve) {
              // cut: a surge IS peak-cut — the notated back edge is a clean
              // 90° drop (composer, day 22); the sounding 2% release ramp
              // stays in the data, only the drawing squares it off
              items.push({ k: 'envcurve', t0: e.onset, t1: e.onset + e.duration, samples: e.level.samples, ev: e.id, cut: !!dev.cut });
            }
            if (dev.goLine) items.push({ k: 'goline', t: e.onset, ev: e.id });
            // THE GC OBJECT (wc-29, day 23 — composer: "when I say GC, that is
            // the whole thing"): the static arc + impact marker are page ink
            // (render.js draws them from notation/lib/gc.js; the ball is
            // animobj's). Impact = the go time. `gc: true` = the registry
            // preset; `gc: {...}` = a per-note preset.
            if (dev.gc) items.push(Object.assign({ k: 'gc', t: e.onset, ev: e.id },
              typeof dev.gc === 'object' ? { preset: dev.gc } : {}));
            // the WRITTEN position (shared by the nh-unit and the ring bar):
            // ottava = smallest shift bringing the written note within 3
            // ledger lines (|ySs| <= 5); one octave = 3.5 staff steps
            const stds = glyphs.standards;
            const spN = spelledOf(e);
            let yDraw = staffPosBass(spN);
            const th = 2 + ((stds.ottava && stds.ottava.ledgerLineThreshold) || 3);
            let octShift = 0;
            while (yDraw > th) { yDraw -= 3.5; octShift++; }
            while (yDraw < -th) { yDraw += 3.5; octShift--; }
            // THE RING BAR (wc-23 element 2, day 22, composer spec): a black
            // bar whose left edge is flush with the go line and whose right
            // edge is exactly the note's sounding length (for fixed
            // one-shots = the measured sample length, the 2n law), centered
            // on the written notehead's vertical center; thickness = 2/3 of
            // the brick height (registry engraving.render.ringBar).
            if (dev.ringBar) {
              // THE BREATH RULE (day 23, composer, corrected): the bar ends a
              // breath before the NEXT GESTURE — "working backwards... the next
              // gesture minus breath". The measured sample length only CAPS it,
              // so a note with room keeps its full ring (nothing earlier in the
              // piece is affected) and only a note crowded by the next attack is
              // shortened. registry breathSeconds (0.5 = a moderately quick tuba
              // breath). DRAWING ONLY: playback still follows the IR duration
              // (D49) — the sample rings what it rings.
              const breath = dev.ringBarBreath === false ? 0 : (o.breathSeconds != null ? o.breathSeconds : 0.5);
              const nxt = nextOnset.get(e.id);
              const room = nxt != null ? nxt - e.onset - breath : Infinity;
              const barLen = Math.min(e.duration, room);
              const flagUnder = o.flagShortBarSeconds != null ? o.flagShortBarSeconds : 1.0;
              if (barLen <= 0) {
                warnings.push('ring bar ' + e.id + ': no room before the next attack (' + (nxt - e.onset).toFixed(2) + ' s gap, ' + breath + ' s breath) — bar not drawn');
              } else {
                if (barLen < e.duration - 1e-9 && barLen < flagUnder)
                  warnings.push('ring bar ' + e.id + ': ' + barLen.toFixed(2) + ' s — the next attack is ' + (nxt - e.onset).toFixed(2) + ' s away, less the ' + breath + ' s breath (sample ' + e.duration.toFixed(2) + ') — under ' + flagUnder + ' s, composer judgment');
                items.push({ k: 'ringbar', t0: e.onset, t1: e.onset + barLen, ySs: yDraw, ev: e.id });
              }
            }
            if (dev.nhUnit) {
              // THE NH-UNIT (device element 3, day 22): open head (stemless)
              // + accidental + ledgers + ottava, right-anchored a fixed gap
              // BEFORE go time (o.nhGapSs; the composer's "2 px" at staff
              // 31.6 = 0.25 ss — expressed in ss so the PP-6 zoom invariant
              // holds). Placement laws = piece #2's locked numbers, now in
              // glyphs.standards (accidental gap D.6 · ottava sessions
              // 57/77 · engage rule = staffRouter's 3-ledger threshold).
              {
                // head kind is device data (wc-29, day 23): 'open' (the
                // surge / fp unit) or 'filled' (the staccato unit)
                const headKind = dev.nhHead === 'filled' ? 'filled' : 'open';
                // HEAD SCALE (day 23, composer: "make the note head smaller —
                // there was already a formulation for a small note head"):
                // piece #2's notehead.cellMotive.scaleFactor 0.844, a uniform
                // scale on the same outline (no new glyph); metrics + anchors
                // scale with it, so ledgers, stem attach and the column
                // anchor all follow. Device data (nhHeadScale), default 1.
                const headK = dev.nhHeadScale > 0 ? dev.nhHeadScale : 1;
                const nhO = (g => headK === 1 ? g : {
                  wSs: g.wSs * headK, hSs: g.hSs * headK,
                  anchors: Object.fromEntries(Object.keys(g.anchors).map(n => [n, { x: g.anchors[n].x * headK, y: g.anchors[n].y * headK }])),
                })(glyphs.notehead[headKind]);
                const headGlyph = headKind === 'filled' ? 'notehead' : 'notehead-open';
                // the gap before go is device data too (day 23, option B for the
                // GC unit: 0.6 ss so the head clears the impact marker's left
                // edge, r 0.51 ss); the registry default (0.25) serves the rest
                let gapSs = dev.nhGapSs != null ? dev.nhGapSs : (o.nhGapSs != null ? o.nhGapSs : 0.25);
                // A UNIT THAT CARRIES A GC IS PUSHED CLEAR OF ITS IMPACT MARKER
                // (day 23, composer, on giving the fortepianos GCs: "you might
                // need to push it over, so all the ledgers, the right edge
                // clears the GC descending arc... just the bottom notehead and
                // ledger lines"). The arc only reaches head height in the last
                // ~15 ms before impact, so clearing the MARKER clears the arc:
                // gap >= marker radius + the tight gap. Registry
                // gcImpactRadiusSs (0.51 = the GC look's 4 px at the 1080 frame
                // over the jury frame's 7.9 px/ss; both scale with frame
                // height, so the ratio is frame-invariant).
                if (dev.gc) {
                  const rImp = o.gcImpactRadiusSs != null ? o.gcImpactRadiusSs : 0.51;
                  const tight = o.tightGapSs != null ? o.tightGapSs : 0.15;
                  gapSs = Math.max(gapSs, rImp + tight);
                }
                const ledgers = ledgersFor(yDraw);
                // STEM + FLAG (wc-29, day 23 — composer: "black note head,
                // stem, and I think one flag"): nhStem = 'flag8' | 'plain' |
                // off. Direction = the house rule (below the middle line →
                // up) unless the per-item engraving override says stemDir,
                // as on metric notes. Attach points come from THIS head's
                // own anchors; length = the one-octave default, extended to
                // the middle line outside the staff (stemLenFor).
                const stemKind = dev.nhStem === 'flag8' || dev.nhStem === 'plain' || dev.nhStem === 'beam' ? dev.nhStem : null;
                const engS = engOf(e.id);
                const stemDir = engS.stemDir === 'up' || engS.stemDir === 'down' ? engS.stemDir : (yDraw >= 0 ? 'down' : 'up');
                const attA = stemDir === 'up' ? nhO.anchors.stemAttachUp : nhO.anchors.stemAttachDown;
                const att = { dx: attA.x - nhO.anchors.center.x, dy: attA.y - nhO.anchors.center.y };
                const flagG = stemKind === 'flag8' ? (stemDir === 'up' ? glyphs.flag.up8 : glyphs.flag.down8) : null;
                // SYSTEMIC anchor rule (day 22 round 2): the gap before the
                // go line is measured from the unit's RIGHTMOST INK — the
                // ledger overhang when ledgers exist, else the head edge —
                // and (day 23) a stem-up flag when it reaches past the head.
                const ledgerExt = ledgers.length
                  ? nhO.wSs * ((stds.ledgerLine && stds.ledgerLine.lengthFraction) || 0.25) : 0;
                const flagRight = flagG ? att.dx + (flagG.wSs - flagG.anchors.stemTip.x) : -Infinity;
                const rightExt = Math.max(nhO.wSs / 2 + ledgerExt, flagRight);
                // ACCIDENTAL GEOMETRY, computed BEFORE the anchor (day 23):
                // every offset below is relative to the head's center, so
                // the unit's horizontal ink is known before it is placed —
                // which is what centering on the go line requires.
                const accKind = spN.alter ? ({ '1': 'sharp', '-1': 'flat', '2': 'sharp', '-2': 'flat',
                  '0.5': 'quarterSharp', '-0.5': 'quarterFlat',
                  '1.5': 'threeQuarterSharp', '-1.5': 'threeQuarterFlat' })[String(spN.alter)] : null;
                const acc = accKind ? glyphs.accidental[accKind] : null;
                let accRel = null;
                if (acc) {
                  const accGap = (stds.accidental && stds.accidental.gapToNotehead) || 0.1;
                  const align = acc.anchors && acc.anchors.noteY ? 'noteY' : 'center';
                  const accTopExt = align === 'noteY' ? acc.anchors.noteY.y : acc.hSs / 2;
                  const accBotExt = acc.hSs - accTopExt;
                  // H.4c.3 LEDGER CLEARANCE (piece #2, ported day 22 round
                  // 2 — the composer remembered right): the accidental's
                  // right edge sits the D.6 gap left of WHICHEVER extends
                  // further left — the head's left edge or any ledger the
                  // glyph's y-span touches. (p2 matched ledger y to the
                  // accidental's anchorY; extended here to the glyph bbox,
                  // which degenerates to p2's rule on exact-line notes.)
                  let clearRel = -nhO.wSs / 2;
                  for (const L of ledgers) {
                    if (L <= yDraw + accTopExt + 1e-9 && L >= yDraw - accBotExt - 1e-9) {
                      clearRel = -nhO.wSs / 2 - ledgerExt;
                      break;
                    }
                  }
                  // anchor-aware horizontal edges (round-2 measurement
                  // finding): a noteY-aligned glyph anchors OFF-CENTER, so
                  // its right edge sits (wSs - anchorX) past the anchor,
                  // not wSs/2 — center alignment is the degenerate case
                  const anchorX = align === 'noteY' ? acc.anchors.noteY.x : acc.wSs / 2;
                  accRel = { dx: clearRel - accGap - (acc.wSs - anchorX), align, anchorX, accTopExt, accBotExt, kind: accKind };
                } else if (spN.alter) {
                  warnings.push('nh-unit ' + e.id + ': no accidental glyph for alter ' + spN.alter);
                }
                const leftRel = Math.min(-(nhO.wSs / 2 + (ledgers.length ? ledgerExt : 0)),
                  accRel ? accRel.dx - accRel.anchorX : Infinity);
                // THE ANCHOR (day 23, composer on wc-29: "everything centered
                // on the go line"): 'center' puts the MIDPOINT of the unit's
                // horizontal ink on the go time; the day-22 default hangs the
                // unit's rightmost ink a fixed gap BEFORE it. Device data, so
                // one technique can differ from another.
                const headDx = dev.nhAnchor === 'center'
                  ? -(leftRel + rightExt) / 2
                  : -(gapSs + rightExt);
                items.push(Object.assign({ k: 'glyph', g: headGlyph, t: e.onset, dxSs: headDx, ySs: yDraw, align: 'center' }, headK !== 1 ? { scale: headK } : {}));
                for (const L of ledgers) items.push({ k: 'ledger', t: e.onset, dxSs: headDx, ySs: L, wSs: nhO.wSs });
                // unit ink extents (grow as elements land) — feed both the
                // accidental clearance and the ottava geometry
                let leftEdgeDx = headDx - nhO.wSs / 2 - ledgerExt * (ledgers.length ? 1 : 0);
                let inkTopY = yDraw + nhO.hSs / 2, inkBotY = yDraw - nhO.hSs / 2;
                // ---- THE CHAIN, RESOLVED BEFORE THE STEM (day 23) ----
                // The single mark: a literal glyph key ('sfzp') or 'band' —
                // THE ONE-SHOT DYNAMIC (DYNAMICS_FRAMEWORK.md): one marking
                // from five wide bands, looked up from the captured velocity
                // (IR `vel`, amendment 5) in registry dynamicBands. A band
                // mark with no velocity is a warning, never a silent default.
                let markKey = null;
                if (dev.dynMark === 'band') {
                  const bands = o.dynamicBands || [{ max: 45, mark: 'ppp' }, { max: 75, mark: 'p' }, { max: 100, mark: 'mf' }, { max: 118, mark: 'f' }, { max: 127, mark: 'fff' }];
                  if (Number.isFinite(e.vel)) {
                    const b = bands.find(b => e.vel <= b.max) || bands[bands.length - 1];
                    markKey = b.mark;
                  } else if (e.mode === 'plain') warnings.push('nh-unit ' + e.id + ': plain-mode event carries no vel (pre-amendment-5 extraction — re-extract) — no mark drawn');
                  // no mode = not a captured note: nothing to band, no mark, no noise
                } else if (dev.dynMark) markKey = dev.dynMark;
                const markG = markKey && glyphs.dynamic ? glyphs.dynamic[markKey] : null;
                if (markKey && !markG) warnings.push('nh-unit ' + e.id + ': dynamic glyph "' + markKey + '" missing — mark not drawn');
                const stackGap = o.stackGapSs != null ? o.stackGapSs : 0.45;
                // the chain's elements and their heights, known before anything
                // is placed — the stem needs them (it may have to clear the chain)
                let pairG = null;
                if (dev.dynPair) {
                  const pr = Array.isArray(dev.dynPair) ? dev.dynPair : (o.dynPair || ['ppp', 'fff']);
                  const a = glyphs.dynamic && glyphs.dynamic[pr[0]], b = glyphs.dynamic && glyphs.dynamic[pr[1]];
                  if (a && b) pairG = { pr, a, b, h: Math.max(a.hSs, b.hSs) };
                  else warnings.push('nh-unit ' + e.id + ': dynamic glyphs missing (' + pr[0] + '/' + pr[1] + ') — marks not drawn');
                }
                const chainH = (pairG ? pairG.h : 0) + (markG ? markG.hSs : 0);
                const chainN = (pairG ? 1 : 0) + (markG ? 1 : 0);

                // the flag, possibly compressed vertically (day 23, composer:
                // "if we can adjust it so it's not so tall") — device
                // nhFlagScaleY / registry flagScaleY; anisotropic, so only the
                // height changes; the stem attach and the flag's x are untouched
                const flagKy = flagG ? (dev.nhFlagScaleY > 0 ? dev.nhFlagScaleY : (o.flagScaleY > 0 ? o.flagScaleY : 1)) : 1;
                const flagH = flagG ? flagG.hSs * flagKy : 0;

                // THE SIDE-WITH-ROOM RULE (day 23, composer, after the ledger
                // measurement — without ottava the lowest notes end at the
                // lane edge and nothing stacks below them): the chain goes
                // BELOW by default and flips ABOVE when it would not fit
                // between the unit's bottom ink and the lane edge. Gould:
                // dynamics above where below is obstructed. An ottava pins
                // the chain to its own side (the sign is outermost).
                // laneHalfSs = the PRESENTATION half-lane (registry
                // engraving.layout.chainSide), so a sparse experiment IR makes
                // the same choice the draft will. Decided on the HEAD-SIDE ink
                // (head, dot, accidental) — the stem is placed afterwards and,
                // for a flagged stem-up unit, the chain sits BETWEEN THE STAFF
                // AND THE FLAG (composer: "the dynamic above the staff and
                // below the bottom of the flag"), the stem clearing it.
                const CS = Object.assign({ rule: 'sideWithRoom', laneHalfSs: 6.51 }, o.chainSide || {});
                const STAFF_EDGE = 2;
                const rDot = ((stds.staccatoDot && stds.staccatoDot.diameter) || 0.4) / 2;
                // STACCATO DOT (day 23, composer: "always on the notehead, so
                // below in this case"; then "reduce the vertical space between
                // the bottom of the note head and the staccato dot... two or
                // three pixels"): the notehead side, opposite the stem; gap
                // from the head's edge = device nhDotGapSs (0.3 ss = 2.4 px at
                // the jury frame) — tighter than the metric notes' space-
                // centred dotYFor, which stays their law.
                let yDot = null;
                if (dev.nhDot) {
                  const gapDot = dev.nhDotGapSs != null ? dev.nhDotGapSs : (stds.staccatoDot && stds.staccatoDot.gapFromNotehead) || 0.5;
                  yDot = stemDir === 'up' ? yDraw - nhO.hSs / 2 - gapDot - rDot : yDraw + nhO.hSs / 2 + gapDot + rDot;
                }
                const headTop = Math.max(inkTopY, yDot != null ? yDot + rDot : -Infinity, accRel ? yDraw + accRel.accTopExt : -Infinity);
                const headBot = Math.min(inkBotY, yDot != null ? yDot - rDot : Infinity, accRel ? yDraw - accRel.accBotExt : Infinity);
                const refBot0 = Math.min(headBot, -STAFF_EDGE), refTop0 = Math.max(headTop, STAFF_EDGE);
                // above a flagged stem-up unit the chain sits under the flag with
                // the tighter gap (registry chainAboveGapSs); elsewhere the house 0.45
                const underFlag = !!flagG && stemDir === 'up';
                const gapAbove = underFlag ? (o.chainAboveGapSs != null ? o.chainAboveGapSs : 0.3) : stackGap;
                const needBelow = chainN ? chainN * stackGap + chainH : 0;
                const needAbove = chainN ? chainN * gapAbove + chainH : 0;
                const roomBelow = CS.laneHalfSs + refBot0, roomAbove = CS.laneHalfSs - refTop0;
                const chainAbove = CS.rule === 'sideWithRoom' && octShift === 0 && chainN > 0
                  && needBelow > roomBelow + 1e-9 && roomAbove > roomBelow + 1e-9;

                if (stemKind) {
                  const yStart = yDraw - att.dy;
                  let L = stemLenFor(yDraw, o.stemLen);
                  // FLAG-CLEAR STEM RULE (day 23, composer: "have the bottom
                  // of the flag clear the staff, just like three pixels or so
                  // — maybe not the full typical gap"): piece #2's
                  // flagClearance law (computeFlaggedStemLength) with this
                  // piece's clearance — registry flagClearanceSs (0.38 ss =
                  // 3 px at the jury frame's 7.9 px/ss; p2 used 1.0). The
                  // flag's near edge clears the outer staff line — or the
                  // CHAIN stacked above the staff, when the chain is up there
                  // and not beside the stem. The default length wins when it
                  // is already longer.
                  if (flagG && dev.nhStemRule === 'flagClear') {
                    const clr = o.flagClearanceSs != null ? o.flagClearanceSs : 0.38;
                    const beside = !!dev.dynBesideStem;
                    const clearTop = STAFF_EDGE + (chainAbove && underFlag && !beside ? needAbove : 0);
                    const need = stemDir === 'up'
                      ? (clearTop + clr + flagH) - yStart      // flag hangs down from the tip
                      : yStart - (-STAFF_EDGE - clr - flagH);  // flag rises from the tip
                    L = Math.max(L, need);
                  }
                  let yEnd = stemDir === 'up' ? yStart + L : yStart - L;
                  // A BEAM MEMBER'S STEM REACHES THE BEAM (day 23, composer:
                  // "a single beam above the staff line... at the same height
                  // as our flagged ones, whatever that long stem was"). The
                  // beam line is exactly the flagged-stem tip: the staff edge
                  // + the flag clearance + a flag's height, so a beamed
                  // cluster and a lone flagged one-shot top out together.
                  if (stemKind === 'beam') {
                    const clr = o.flagClearanceSs != null ? o.flagClearanceSs : 0.38;
                    const beamY = o.beamYSs != null ? o.beamYSs : (STAFF_EDGE + clr + glyphs.flag.up8.hSs);
                    yEnd = stemDir === 'up' ? beamY : -beamY;
                    const key = dev.beamGroup || 'beam';
                    if (!beamGroups.has(key)) beamGroups.set(key, { dir: stemDir, tips: [] });
                    beamGroups.get(key).tips.push({ t: e.onset, dxSs: headDx + att.dx, ySs: yEnd });
                  }
                  items.push({ k: 'stem', t: e.onset, dxSs: headDx + att.dx, yA: yStart, yB: yEnd, attach: stemDir, ev: e.id });
                  if (flagG) items.push(Object.assign({ k: 'glyph', g: stemDir === 'up' ? 'flag-up8' : 'flag-down8', t: e.onset, dxSs: headDx + att.dx, ySs: yEnd, align: 'stemTip' },
                    flagKy !== 1 ? { scaleY: flagKy } : {}));
                  // the stem tip is the unit's outer ink on its side (a flag
                  // hangs back toward the head, never past the tip)
                  if (stemDir === 'up') inkTopY = Math.max(inkTopY, yEnd); else inkBotY = Math.min(inkBotY, yEnd);
                }
                if (yDot != null) {
                  items.push({ k: 'dot', t: e.onset, dxSs: headDx, ySs: yDot });
                  inkTopY = Math.max(inkTopY, yDot + rDot); inkBotY = Math.min(inkBotY, yDot - rDot);
                }
                if (accRel) {
                  items.push({ k: 'glyph', g: 'accidental-' + accRel.kind, t: e.onset, dxSs: headDx + accRel.dx, ySs: yDraw, align: accRel.align });
                  leftEdgeDx = Math.min(leftEdgeDx, headDx + accRel.dx - accRel.anchorX);
                  inkTopY = Math.max(inkTopY, yDraw + accRel.accTopExt);
                  inkBotY = Math.min(inkBotY, yDraw - accRel.accBotExt);
                }
                // THE VERTICAL COLUMN STANDARD (day 22, composer + Gould +
                // piece #2's own chain, which agree): below the unit, from
                // the notehead outward — articulation · DYNAMIC · instruction
                // · OTTAVA (outermost) — each stacked stackGapSs (the
                // session-77 0.45) past the previous outer INK edge. Order is
                // REGISTRY DATA (engraving.layout.stackBelow); the builder
                // walks it and places whichever elements the note carries.
                // Chrome clears THE STAFF as well as the unit's ink: the
                // reference edge is the outer ink or the outer staff line
                // (±2), whichever is further out (found live, day 23: the
                // flipped sfzp had landed across ledgers -3/-4). Above a
                // flagged stem-up unit the reference is the staff top, the
                // flag having been lifted over the chain by the stem rule.
                const refBot = Math.min(inkBotY, -STAFF_EDGE);
                const refTop = (chainAbove && underFlag) ? refTop0 : Math.max(inkTopY, STAFF_EDGE);
                let chainBotY = refBot;   // grows downward as chrome stacks
                let chainTopY = refTop;   // grows upward when the chain is above
                // one placement helper for every chain element: returns the
                // element's center y and advances the chain's outer edge
                const placeChain = h => {
                  if (chainAbove) { const y = chainTopY + gapAbove + h / 2; chainTopY = y + h / 2; return y; }
                  const y = chainBotY - stackGap - h / 2; chainBotY = y - h / 2; return y;
                };

                // DYNAMIC PAIR + ARROW (the surge's hairpin replacement):
                // start mark centered on the NOTE COLUMN (the head), then
                // gap · short arrow · gap · end mark, all on one band.
                // NO DERIVATION (composer, day 22): the two marks state the
                // BOTTOM and TOP levels, not the curve — in this piece every
                // surge is full-curve ppp->fff (registry dynPair); the morph
                // section and any manual judgment go through authored
                // overrides when that work arrives. Drawn only when the
                // device carries dynPair (true = the registry pair; an
                // array = that pair).
                if (pairG) {
                  const A = Object.assign({ lenSs: 2.0, headSs: 0.45, gapSs: 0.45, thickSs: 0.13 }, o.dynArrow || {});
                  const [m1, m2] = pairG.pr, g1 = pairG.a, g2 = pairG.b;
                  const yDyn = placeChain(pairG.h);
                  items.push({ k: 'glyph', g: 'dyn-' + m1, t: e.onset, dxSs: headDx, ySs: yDyn, align: 'center' });
                  const x0 = headDx + g1.wSs / 2 + A.gapSs;
                  items.push({ k: 'dynarrow', t: e.onset, dx0Ss: x0, dx1Ss: x0 + A.lenSs, ySs: yDyn, headSs: A.headSs, thickSs: A.thickSs });
                  items.push({ k: 'glyph', g: 'dyn-' + m2, t: e.onset, dxSs: x0 + A.lenSs + A.gapSs + g2.wSs / 2, ySs: yDyn, align: 'center' });
                }

                // SINGLE DYNAMIC MARK (wc-23, day 22 — composer: "let's go with
                // sfzp"): one engraved mark on the dynamic slot, centered on
                // the note column like the pair's start mark. dynMark is the
                // glyph key (registry device / per-item override).
                if (markG) {
                  const yDyn = placeChain(markG.hSs);
                  // BESIDE THE STEM (day 23, composer): when the chain is above a
                  // stem-up unit, the mark's RIGHT edge sits dynStemGapSs left of
                  // the stem's left edge (registry 0.15 = the staccato-dot gap),
                  // instead of centred on the head column; the flag, on the stem's
                  // other side, is then free to keep its full height
                  let dxMark = headDx;
                  if (dev.dynBesideStem && chainAbove && stemKind && stemDir === 'up') {
                    const gapStem = o.dynStemGapSs != null ? o.dynStemGapSs : 0.15;
                    const stemLeft = headDx + att.dx - ((stds.stem && stds.stem.thickness) || 0.13) / 2;
                    dxMark = stemLeft - gapStem - markG.wSs / 2;
                  }
                  items.push({ k: 'glyph', g: 'dyn-' + markKey, t: e.onset, dxSs: dxMark, ySs: yDyn, align: 'center' });
                }

                if (octShift !== 0) {
                  // OTTAVA — outermost of the below-chain (Gould; p2's own
                  // order). Bracket over the NOTEHEAD ONLY: hook at the
                  // head's right edge (+ endPadSs, default 0). Vertical per
                  // session 77 against the CHAIN's current outer ink (below)
                  // or the unit's top ink (above — no above-chrome yet).
                  // Label: 8va/8vb at one octave, 15ma/15mb at two.
                  const O = stds.ottava || {};
                  const std = O.standardGapSs || 0.45, hook = O.hookLengthSs || 0.8;
                  const above = octShift > 0;   // sounding higher than written
                  const n = Math.min(2, Math.abs(octShift));
                  if (Math.abs(octShift) > 2) warnings.push('nh-unit ' + e.id + ': ' + Math.abs(octShift) + ' octaves exceeds 15ma — clamped');
                  const label = above ? (n === 1 ? 'va8' : 'ma15') : (n === 1 ? 'vb8' : 'mb15');
                  const ref = above ? chainTopY : chainBotY;
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
      // one beam per group, drawn after the notes (a beam of 1 is a lone
      // stem — no beam, and a warning: the composer's cluster caught a
      // single note)
      for (const [key, g] of beamGroups) {
        if (g.tips.length < 2) { warnings.push('beam group "' + key + '" has ' + g.tips.length + ' note(s) — no beam drawn'); continue; }
        g.tips.sort((a, b) => a.t - b.t);
        items.push({ k: 'beam', dir: g.dir, tips: g.tips, group: key });
      }
      return { part, items };
    });

    return { systems, window: [w0, w1], warnings };
  }

  return { layoutSection, deviceResolver, staffPosBass, ledgersFor, dotYFor, stemLenFor };
});
