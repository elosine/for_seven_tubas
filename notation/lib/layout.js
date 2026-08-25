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
      byEnv: { surge: { curve: true, cut: true, goLine: true, nhUnit: true, dynPair: true, dynMark: false } },
      byTechnique: {
        fortepiano: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp' },
        cuivre: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp', techText: 'cuivré' },   // day 24; techText day 30 — the 40.93 fp blast's three cuivre members (registry _cuivreNote)
        ord: { goLine: true, nhUnit: true, dynMark: 'band' },                              // day 24 — plain sustained ord, provisional (registry _ordNote)
        staccato: { goLine: true, gc: true, nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'flag16', nhStemRule: 'flagClear', nhDot: true, nhDotGapSs: 0.15, nhGapSs: 0.6, dynMark: 'band', dynBesideStem: true },
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
    // PER-IR LAYOUT POLICY (day 33): a file can opt into placement rules the
    // registry does not impose globally — approved files stay byte-identical.
    // notate_section --bracketsAbove writes { bracketSide: 'above' }.
    const POL = ir.layoutPolicy || {};
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
    const glissCurves = [];      // {part, span:[a,b], samples:[0..1]} — top half of the lane
    const crescCurves = [];      // {part, span:[a,b], samples:[0..1]} — bottom half of the lane
    const headers = [];          // {part, t, endMark} — the section header block
    for (const ov of ir.overlays || []) {
      const tgt = ov.target || {};
      if (ov.kind === 'spelling' && tgt.event) { respell.set(tgt.event, ov.value); continue; }
      if (ov.kind === 'engraving' && tgt.event) { engrave.set(tgt.event, ov.value || {}); continue; }
      if (ov.kind === 'staff' && ov.value === 'off' && tgt.part !== undefined && tgt.span) {
        staffOff.push({ part: tgt.part, span: tgt.span }); continue;
      }
      // day 35, the MORPH SECTION: the glissando reads as ONE smooth line over a
      // whole section, in the TOP HALF of the lane (the crescendo takes the
      // bottom half). Players cannot make small pitch adjustments, so the drawn
      // line is an interpolated fit of the sounding bend, not its every wiggle.
      // value: { samples:[0..1 ...], fit:'<the formula, for the record>' }
      if (ov.kind === 'gliss' && tgt.part !== undefined && tgt.span && ov.value && ov.value.samples) {
        glissCurves.push({ part: tgt.part, span: tgt.span, samples: ov.value.samples }); continue;
      }
      // the CRESCENDO, the glissando's twin: one interpolated curve for the
      // whole section in the BOTTOM half of the lane, limeGreen (day 35)
      if (ov.kind === 'cresc' && tgt.part !== undefined && tgt.span && ov.value && ov.value.samples) {
        crescCurves.push({ part: tgt.part, span: tgt.span, samples: ov.value.samples }); continue;
      }
      // day 35: THE SECTION HEADER for the morph sections. Dictated order,
      // right-to-left from the go line: go line · standard spacer · fff ·
      // arrow · niente circle; the staff lines start 1 ss left of the circle
      // and stop a MEDIUM spacer short of the go line. Anchored at the go
      // time in ss offsets, so it does not stretch with the time zoom.
      if (ov.kind === 'header' && tgt.part !== undefined && tgt.t !== undefined) {
        headers.push({ part: tgt.part, t: tgt.t, endMark: (ov.value && ov.value.endMark) || 'fff',
          acc: (ov.value && ov.value.acc !== undefined) ? ov.value.acc : 'quarterSharp',
          spelled: (ov.value && ov.value.spelled) || { step: 'F', alter: 0, octave: 2 } }); continue;
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
      byEnv: { surge: { curve: true, cut: true, goLine: true, nhUnit: true, dynPair: true, dynMark: false } },
      byTechnique: {
        fortepiano: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp' },
        cuivre: { goLine: true, gc: true, nhUnit: true, ringBar: true, dynMark: 'sfzp', techText: 'cuivré' },   // day 24; techText day 30 — the 40.93 fp blast's three cuivre members (registry _cuivreNote)
        ord: { goLine: true, nhUnit: true, dynMark: 'band' },                              // day 24 — plain sustained ord, provisional (registry _ordNote)
        // wc-29 (day 23, composer): "black note head, stem, and one flag" —
        // the same unit builder with a filled head and a flagged stem; no
        // go line / ring bar / dynamic until asked
        staccato: { goLine: true, gc: true, nhUnit: true, nhHead: 'filled', nhHeadScale: 0.844, nhStem: 'flag16', nhStemRule: 'flagClear', nhDot: true, nhDotGapSs: 0.15, nhGapSs: 0.6, dynMark: 'band', dynBesideStem: true },
      },
    }, o.devices || {});
    const deviceOf = makeDeviceOf(DEV, engOf);

    const spelledOf = e => respell.get(e.id) || e.pitch.spelled;

    // BEAM GROUP DIRECTION (day 24): ONE direction per group, decided by the
    // member FURTHEST from the middle line (Gould), ties up — this vocabulary
    // keeps its GC objects under the staff, so up is the house side. Found
    // on T2's six-note cluster: the group's first note (A3, above the middle
    // line) set the direction for all three, and the A1 three ledgers down
    // got a 0.33 ss stem with the beam running through its own ledgers. A
    // per-item stemDir override still wins for that note.
    const groupDir = new Map();
    {
      // ONE SIDE PER GESTURE (day 31). The farthest-note rule used to run per
      // BEAM GROUP, so one cluster's groups could flip sides mid-gesture the
      // moment the register crossed the middle line (CLOUD02-D, the first
      // material to do so: T3's cl-40 drew group a stem-up and groups b/c
      // stem-down, its two brackets on OPPOSITE sides of one gesture; T7 the
      // same). A gesture is read as one thing — its seams are beam breaks,
      // not side changes — so the farthest note of the whole CLUSTER picks
      // the side and every group in it follows. Per-item engraving overrides
      // (engS.stemDir) still win per note, unchanged.
      const th = 2 + ((glyphs.standards.ottava && glyphs.standards.ottava.ledgerLineThreshold) || 3);
      const far = new Map();    // gesture key -> {y}
      const gkOf = new Map();   // beamGroup -> gesture key
      for (const e of ir.events) {
        const d = deviceOf(e);
        if (!d.beamGroup || d.nhStem !== 'beam') continue;
        const gk = d.clusterId || d.beamGroup;
        gkOf.set(d.beamGroup, gk);
        let y = staffPosBass(spelledOf(e));
        while (y > th) y -= 3.5;
        while (y < -th) y += 3.5;
        const cur = far.get(gk);
        if (!cur || Math.abs(y) > Math.abs(cur.y) + 1e-9 || (Math.abs(Math.abs(y) - Math.abs(cur.y)) <= 1e-9 && y < cur.y)) far.set(gk, { y });
      }
      for (const [bg, gk] of gkOf) groupDir.set(bg, far.get(gk).y > 0 ? 'down' : 'up');
    }

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
      // rests belong to the CLUSTER, not to a beam group: a gap between two
      // beam groups is exactly where a rest goes, and neither group owns it.
      const clusters = new Map();
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
      for (const g of glissCurves) if (g.part === part)
        items.push({ k: 'glisscurve', t0: g.span[0], t1: g.span[1], samples: g.samples });
      for (const cc of crescCurves) if (cc.part === part)
        items.push({ k: 'cresccurve', t0: cc.span[0], t1: cc.span[1], samples: cc.samples });
      for (const h of headers) if (h.part === part) {
        // THE SECTION FIGURE (day 35, composer): niente circle · arrow · fff,
        // sitting UNDER the staff where any other dynamic goes, and ENDING
        // just before the go line. Ordinary items — the mark is drawn by the
        // same code path as every other dynamic, so it cannot come out mirrored.
        const A = Object.assign({ lenSs: 2.0, headSs: 0.45, gapSs: 0.45, thickSs: 0.13 }, o.dynArrow || {});
        const HD = Object.assign({ circleDiaSs: 0.4695 }, o.sectionHead || {});
        // the dynamic row is the house one — `dynY`, the same number every
        // other dynamic uses (ySs is inverted: negative is BELOW the staff)
        const mg = (glyphs.dynamic || {})[h.endMark] || { wSs: 1.6279 };
        const y = o.dynY;
        const markC = -A.gapSs - mg.wSs / 2;                    // right edge one standard spacer before the go line
        const arrR = markC - mg.wSs / 2 - A.gapSs;
        const arrL = arrR - A.lenSs;
        const cirC = arrL - A.gapSs - HD.circleDiaSs / 2;
        // THE PITCH FIGURE (day 35, composer): two SMALL BLACK noteheads — the
        // section's lowest and highest, to the closest quarter tone — with a
        // gliss line between them. Standard spacing head-to-line; the line's
        // length is the diameter of TWO regular half-note (white) heads.
        const HEAD = glyphs.notehead.filled, OPEN = glyphs.notehead.open;
        const hs = (o.figures && o.figures.cluster && o.figures.cluster.nhHeadScale) || 0.844;
        const hw = HEAD.wSs * hs;
        const glissLen = OPEN.wSs * 2;                       // "two regular half note white notes"
        // the header's accidental follows the gliss DIRECTION — quarterSharp
        // rising, quarterFlat falling; null when the gliss is a single pitch
        const accKey = h.acc;
        const acc = accKey ? glyphs.accidental[accKey] : { wSs: 0 };
        const h2R = -A.gapSs, h2L = h2R - hw;                // ends where the dynamic row ends
        const accR = h2L - (o.accGap || 0.25), accL = accR - acc.wSs;
        const glR = accL - A.gapSs, glL = glR - glissLen;
        const h1R = glL - A.gapSs, h1L = h1R - hw;
        const yP = staffPosBass(h.spelled);
        items.push({ k: 'glyph', g: 'notehead', t: h.t, dxSs: h1L + hw / 2, ySs: yP, align: 'center', scale: hs });
        items.push({ k: 'glissline', t: h.t, dx0Ss: glL, dx1Ss: glR, ySs: yP, thickSs: A.thickSs });
        if (accKey) items.push({ k: 'glyph', g: 'accidental-' + accKey, t: h.t, dxSs: accL + acc.wSs / 2, ySs: yP, align: 'center' });
        items.push({ k: 'glyph', g: 'notehead', t: h.t, dxSs: h2L + hw / 2, ySs: yP, align: 'center', scale: hs });
        items.push({ k: 'niente', t: h.t, dxSs: cirC, ySs: y, diaSs: HD.circleDiaSs, thickSs: A.thickSs });
        items.push({ k: 'dynarrow', t: h.t, dx0Ss: arrL, dx1Ss: arrR, ySs: y, headSs: A.headSs, thickSs: A.thickSs });
        items.push({ k: 'glyph', g: 'dyn-' + h.endMark, t: h.t, dxSs: markC, ySs: y, align: 'center' });
      }
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
            // day 35: `device.brick:false` suppresses the parachute brick for
            // one event — the morph-section experiments draw a go line with no
            // brick under it. Absent/undefined keeps the brick, so every
            // existing page is unchanged.
            if (deviceOf(e).brick !== false)
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
            // THE ONSET HEAD (day 35, the morph section): a small black
            // notehead LEFT-ALIGNED to the go line — the same rule the
            // clusters use, "every partial's notehead left edge sits on its
            // own go time". Its pitch is the QUARTER-TONE APPROXIMATION of the
            // written glissando at that onset, which only steps when the
            // gliss actually reaches the next quarter tone (composer: "the
            // pitch won't change... until they actually reached the
            // destination pitch"). `onsetAcc` names the accidental, if any.
            if (dev.onsetHead) {
              const ohs = (o.figures && o.figures.cluster && o.figures.cluster.nhHeadScale) || 0.844;
              const ohw = glyphs.notehead.filled.wSs * ohs;
              const oy = staffPosBass(spelledOf(e));
              if (dev.onsetAcc) {
                const ag = glyphs.accidental[dev.onsetAcc];
                if (ag) items.push({ k: 'glyph', g: 'accidental-' + dev.onsetAcc, t: e.onset,
                  dxSs: -(o.accGap || 0.25) - ag.wSs / 2, ySs: oy, align: 'center' });
              }
              items.push({ k: 'glyph', g: 'notehead', t: e.onset, dxSs: ohw / 2, ySs: oy, align: 'center', scale: ohs });
            }
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
            let ringBarItem = null;
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
              // device.ringSeconds (day 30): an authored WRITTEN length that
              // replaces the sample-length term outright — the composer's
              // uniform-chord case ("make sure they're all the same length;
              // take the length from the brick"). Drawing only, like the rest
              // of this block; sound stays the IR duration (D49/D51).
              const barLen = dev.ringSeconds != null ? dev.ringSeconds : Math.min(e.duration, room);
              const flagUnder = o.flagShortBarSeconds != null ? o.flagShortBarSeconds : 1.0;
              if (barLen <= 0) {
                warnings.push('ring bar ' + e.id + ': no room before the next attack (' + (nxt - e.onset).toFixed(2) + ' s gap, ' + breath + ' s breath) — bar not drawn');
              } else {
                if (dev.ringSeconds != null && barLen > room + 1e-9)
                  warnings.push('ring bar ' + e.id + ': ringSeconds ' + barLen.toFixed(2) + ' runs past the breath before the next attack (room ' + room.toFixed(2) + ' s) — drawn as asked');
                if (dev.ringSeconds == null && barLen < e.duration - 1e-9 && barLen < flagUnder)
                  warnings.push('ring bar ' + e.id + ': ' + barLen.toFixed(2) + ' s — the next attack is ' + (nxt - e.onset).toFixed(2) + ' s away, less the ' + breath + ' s breath (sample ' + e.duration.toFixed(2) + ') — under ' + flagUnder + ' s, composer judgment');
                items.push({ k: 'ringbar', t0: e.onset, t1: e.onset + barLen, ySs: yDraw, ev: e.id });
                ringBarItem = items[items.length - 1];   // the nh-unit shortens it from the LEFT (day 24)
              }
            }
            // Technique text (day 30, registry byTechnique.techText — the
            // 'cuivré' mark): cuivre draws the same device as fortepiano and
            // was invisible as a technique on the page; the mark is TEXT, the
            // standard brass practice (the '+' sign is hand-stopping, a
            // different instruction). PLACEMENT (composer, same day): left-
            // justified with the NOTEHEAD's left edge, just above the head at
            // the tight gap ("the same spacing as the staccato — the minimum
            // vertical spacing"), in SOLID BLACK; where the text cannot fit
            // under the lane top (T8's G4 — head top + gap + em runs past
            // laneHalfSs) the original tag-row placement stands ("copy tuba
            // eight"). Emitted inside the nh-unit, which knows the head's x;
            // a techText on a device with no nh-unit takes the tag row.
            if (dev.techText && !dev.nhUnit) items.push({ k: 'text', t: e.onset, dxSs: 0, ySs: o.tagY != null ? o.tagY : 3.5, text: dev.techText, size: TS.technique, color: '#000' });
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
                // ...BUT ONLY WHEN THE HEAD ACTUALLY REACHES IT (day 24). The push
                // was written when the disc sat 5 px above the lane edge; once the
                // composer moved it ONTO the edge (D60) almost nothing collides, and
                // an unconditional push just drags heads away from their own go time
                // — which then reads, under D58, as a displacement that is not real.
                // The disc's top edge sits one radius above the lane bottom:
                //   discTop = -laneHalfSs + gcImpactInsetSs + gcImpactRadiusSs
                // gcImpactInsetSs mirrors the animated GC look's landing inset;
                // test_animobj asserts the two agree, converting via the disc radius,
                // the one quantity the registry states in both unit systems. (Layout
                // itself stays pixel-free — test_coords enforces that.)
                if (dev.gc) {
                  const rImp = o.gcImpactRadiusSs != null ? o.gcImpactRadiusSs : 0.51;
                  const tight = o.tightGapSs != null ? o.tightGapSs : 0.15;
                  const laneHalf = (o.chainSide && o.chainSide.laneHalfSs) || 6.51;
                  const inset = o.gcImpactInsetSs != null ? o.gcImpactInsetSs : 0;
                  const discTop = -laneHalf + inset + rImp;
                  // the unit's lowest ink is the HEAD's underside: ledger lines run
                  // from -3 down TO the note, so none of them is ever below it.
                  const lowestInk = yDraw - nhO.hSs / 2;
                  if (lowestInk < discTop) gapSs = Math.max(gapSs, rImp + tight);
                }
                const ledgers = ledgersFor(yDraw);
                // STEM + FLAG (wc-29, day 23 — composer: "black note head,
                // stem, and I think one flag"): nhStem = 'flag8' | 'plain' |
                // off. Direction = the house rule (below the middle line →
                // up) unless the per-item engraving override says stemDir,
                // as on metric notes. Attach points come from THIS head's
                // own anchors; length = the one-octave default, extended to
                // the middle line outside the staff (stemLenFor).
                // nhStem: 'flag8' | 'flag16' | 'plain' | 'beam' (day 23 — the
                // composer's double flag on the one-shot GC notes)
                const stemKind = /^flag\d+$/.test(dev.nhStem || '') || dev.nhStem === 'plain' || dev.nhStem === 'beam' ? dev.nhStem : null;
                const flagDur = /^flag(\d+)$/.test(stemKind || '') ? +RegExp.$1 : null;
                const engS = engOf(e.id);
                const stemDir = engS.stemDir === 'up' || engS.stemDir === 'down' ? engS.stemDir
                  : (dev.beamGroup && groupDir.has(dev.beamGroup)) ? groupDir.get(dev.beamGroup)
                  : (yDraw >= 0 ? 'down' : 'up');
                const attA = stemDir === 'up' ? nhO.anchors.stemAttachUp : nhO.anchors.stemAttachDown;
                const att = { dx: attA.x - nhO.anchors.center.x, dy: attA.y - nhO.anchors.center.y };
                const flagG = flagDur ? glyphs.flag[(stemDir === 'up' ? 'up' : 'down') + flagDur] : null;
                if (flagDur && !flagG) warnings.push('nh-unit ' + e.id + ': no flag glyph for ' + stemKind + ' ' + stemDir);
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
                // 'leftEdge' (day 23, composer, for clusters): the NOTEHEAD's
                // left edge — accidentals and ledgers excluded — sits precisely
                // on the go time, "because of the scrolling person": what
                // crosses the cursor at the go moment is the head itself.
                // 'headCenter' (day 24, composer, the first note of a beamed
                // pair: "move the first black note head in so that it's
                // centered on the go line"): the HEAD's own centre on the go
                // time, accidental and ledgers hanging off it as they fall.
                const headDx = dev.nhAnchor === 'leftEdge'
                  ? nhO.wSs / 2
                  : dev.nhAnchor === 'headCenter'
                    ? 0
                  : dev.nhAnchor === 'center'
                    ? -(leftRel + rightExt) / 2
                    : -(gapSs + rightExt);
                items.push(Object.assign({ k: 'glyph', g: headGlyph, t: e.onset, dxSs: headDx, ySs: yDraw, align: 'center' }, headK !== 1 ? { scale: headK } : {}));
                for (const L of ledgers) items.push({ k: 'ledger', t: e.onset, dxSs: headDx, ySs: L, wSs: nhO.wSs });
                // cuivré (day 30) — see the techText comment above the nh-unit.
                // The em estimate mirrors engraving.render.textScale (1.3): the
                // rendered height is size × textScale, and layout stays in ss.
                if (dev.techText) {
                  const tight = o.tightGapSs != null ? o.tightGapSs : 0.15;
                  const laneHalf = (o.chainSide && o.chainSide.laneHalfSs) || 6.51;
                  const em = TS.technique * (o.textEmScale != null ? o.textEmScale : 1.3);
                  const base = yDraw + nhO.hSs / 2 + tight;   // baseline just above the head
                  // fits only if the text also CLEARS THE LANE LINE by the same
                  // tight gap — at 0.01 ss of daylight (T8's G4) it reads as
                  // touching, which is the composer's "can't go above" case
                  if (base + em + tight <= laneHalf + 1e-9)
                    items.push({ k: 'text', t: e.onset, dxSs: headDx - nhO.wSs / 2, ySs: base, text: dev.techText, size: TS.technique, color: '#000' });
                  else
                    items.push({ k: 'text', t: e.onset, dxSs: 0, ySs: o.tagY != null ? o.tagY : 3.5, text: dev.techText, size: TS.technique, color: '#000' });
                }
                // THE RING BAR STARTS AFTER THE UNIT, NOT AT THE GO LINE (day 24,
                // composer: "you have to shorten the duration bar from the left. It
                // still got its own old setting... have the notehead and ledger and a
                // little bit of space and then a duration bar"). The day-22 spec
                // ("left edge flush with the go line") was written when every unit
                // hung BEFORE its go time; a head centred ON it (nhAnchor headCenter,
                // day 24) puts head and ledgers on top of the bar's first millimetres.
                // Stated against the unit's own right ink edge, the rule is anchor-
                // agnostic and PROVABLY unchanged for a default-anchored unit: there
                // headDx + rightExt = -nhGapSs, so the bar still starts exactly on the
                // go line. Gap default = nhGapSs, the same small horizontal standard.
                if (ringBarItem) {
                  const rbGap = o.ringBarGapSs != null ? o.ringBarGapSs : (o.nhGapSs != null ? o.nhGapSs : 0.25);
                  // ...but NEVER before the go line: the bar is sounding time, and
                  // it starts at the attack. Without the clamp a GC-bearing unit (pushed
                  // 0.66 ss clear of its impact marker) dragged its bar 0.41 ss to the
                  // LEFT of the attack — measured on all 44 default-anchored bars, and
                  // NOT caught by the layout/render snapshots, whose fixture has no
                  // GC-bearing ring bar.
                  ringBarItem.dx0Ss = Math.max(0, headDx + rightExt + rbGap);
                }
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
                // DYNAMICS ABOVE THE BEAM (day 24, composer, on the beamed pair
                // whose sfzp would not fit below: "when we have two consecutive
                // dynamics like that, let's go ahead and put them together... they
                // both need to be at the top"): a beam member with dynAboveBeam
                // hands its mark to the BEAM GROUP, which draws every member's
                // mark on one row above the beam and lowers the beam to make the
                // room. The mark then plays no part in the chain.
                const markAboveBeam = !!(markG && dev.dynAboveBeam && dev.nhStem === 'beam');
                const chainH = (pairG ? pairG.h : 0) + (markG && !markAboveBeam ? markG.hSs : 0);
                const chainN = (pairG ? 1 : 0) + (markG && !markAboveBeam ? 1 : 0);

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
                // day 33: a DICTATED side (--dynSide → device.chainSide)
                // overrides the room test — the test cannot see the
                // neighbouring part's ink (THE CROSS-LANE BLIND SPOT, day 32),
                // and the composer's placement is a verdict (T6's fff @46.18).
                const chainAbove = dev.chainSide
                  ? dev.chainSide === 'above'
                  : CS.rule === 'sideWithRoom' && octShift === 0 && chainN > 0
                    && needBelow > roomBelow + 1e-9 && roomAbove > roomBelow + 1e-9;
                // A BEAMED NOTE WHOSE CHAIN FLIPS ABOVE HANDS ITS MARK TO THE GROUP
                // (day 24, composer, on T5 32.18). There were two independent placers
                // above the beam — the group's accent row, at one height for the whole
                // gesture, and the per-note chain — and neither consulted the other, so
                // a mark that flipped up landed ON the accent (0.84 ss of overlap
                // measured). The group's row already stacks dynamics OUTSIDE the accents
                // and lowers the beam to fit both inside the lane, which is the
                // stackBelow order (articulation inside, dynamic outside) applied above
                // the staff. So there is only ever ONE placer up there now.
                // ...and the MIRROR (day 31, CLOUD02-D — the first material with
                // stem-DOWN beams): on a stem-down beamed note the below-chain IS
                // the beam side, so the old rule left a second placer down there —
                // the per-note chain walked past the beam and put the mark in the
                // bracket's band (measured: T2 44.27, T6 44.47, T7 43.59, T3 45.76,
                // all f/mf boxes crossing the tuplet line at -6.06). One placer per
                // side, both sides: a beamed note whose chain would land on the
                // beam side hands its mark to the group row, whichever side that is.
                const markToGroup = markAboveBeam || !!(markG && dev.nhStem === 'beam'
                  && (stemDir === 'up' ? chainAbove : !chainAbove));

                if (stemKind) {
                  const yStart = yDraw - att.dy;
                  // set when this note joins a beam group, so the group can
                  // LEVEL the beam afterwards and move this note's stem with it
                  let beamTip = null;
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
                    // the beam tracks THE FLAG THE ONE-SHOTS ACTUALLY WEAR
                    // (composer: "at the same height as our flagged ones") —
                    // read from this technique's own device, so switching the
                    // one-shot flag (8th -> 16th, day 23) moves the beam with
                    // it. The battery caught this the moment the flag changed.
                    const techStem = ((DEV.byTechnique || {})[e.technique] || {}).nhStem;
                    const fdur = /^flag(\d+)$/.test(techStem || '') ? +RegExp.$1 : 8;
                    const fgB = glyphs.flag['up' + fdur] || glyphs.flag.up8;
                    let beamY = o.beamYSs != null ? o.beamYSs : (STAFF_EDGE + clr + fgB.hSs);
                    // ...BUT the group's ARTICULATIONS need room above it (day
                    // 23): in this frame the lane holds 6.51 ss and the lowest
                    // cluster notes already reach the bottom edge, so an accent
                    // cannot go on the notehead side — it goes above the beam,
                    // uniformly for the whole group (which also makes the
                    // pattern read). The beam therefore sits at the
                    // flagged-stem height OR lower, whichever lets the accent
                    // stay inside the lane. Registry data all the way down.
                    const CSb = Object.assign({ laneHalfSs: 6.51 }, o.chainSide || {});
                    const gapA = o.stackGapSs != null ? o.stackGapSs : 0.45;
                    if (dev.beamHasArtic) {
                      const aG = glyphs.articulation && glyphs.articulation[dev.beamHasArtic];
                      if (aG) beamY = Math.min(beamY, CSb.laneHalfSs - gapA - aG.hSs);
                    }
                    // ...and lower again for a TUPLET BRACKET (day 23, composer:
                    // "if we need to lower the beams to accommodate, that's
                    // fine"). Above the beam the bracket needs: padding + hook
                    // + however far the numeral's cap rises above the line.
                    if (dev.beamHasTuplet) {
                      const TP = Object.assign({ paddingSs: 0.5, hookLengthSs: 0.7, numeralSizeSs: 1.2348, numeralBaselineBelowSs: 0.41, numeralCapFactor: 0.7 }, o.tuplet || {});
                      const capAbove = TP.numeralSizeSs * TP.numeralCapFactor - TP.numeralBaselineBelowSs;
                      beamY = Math.min(beamY, CSb.laneHalfSs - (TP.paddingSs + TP.hookLengthSs + capAbove));
                    }
                    yEnd = stemDir === 'up' ? beamY : -beamY;
                    const key = dev.beamGroup || 'beam';
                    if (!beamGroups.has(key)) beamGroups.set(key, { dir: stemDir, tips: [], through: !!dev.beamThrough, over: !!dev.beamOverRest, overLeft: !!dev.beamOverLeft });
                    const grp = beamGroups.get(key);
                    grp.tips.push({ t: e.onset, dxSs: headDx + att.dx, ySs: yEnd });
                    // the cluster's metric facts, carried on the overlay by
                    // notate_section --cluster (which runs the tempo fit)
                    if (dev.nhArtic) (grp.artics = grp.artics || []).push({ t: e.onset, dxSs: headDx, kind: dev.nhArtic });
                    if (markToGroup) (grp.dyns = grp.dyns || []).push({ t: e.onset, dxSs: headDx, key: markKey, hSs: markG.hSs });
                    if (dev.tupletGroup) grp.hasTuplet = true;
                    if (dev.bracketSide) grp.bracketSide = dev.bracketSide;   // day 31, dictated
                    if (dev.articSide) grp.articSide = dev.articSide;
                    if (dev.clusterId) grp.clusterId = dev.clusterId;
                    // THE GRID DOMAIN, which is not always the cluster (8g,
                    // day 27): --figures gives each figure its OWN unit, so
                    // rests and tuplet brackets are computed per FIGURE. A
                    // cluster built before 8g carries no gridId and the two
                    // are the same thing, exactly as before.
                    grp.gridId = dev.gridId || dev.clusterId || key;
                    // the WRITTEN value decides how many beams this note carries
                    // (day 23: figure 1 rewritten at true durations — 8ths get
                    // one beam, 16ths two, so the beam pattern itself shows
                    // which notes are close and which are apart)
                    const tipRef = grp.tips[grp.tips.length - 1];
                    beamTip = tipRef;
                    tipRef.beams = dev.noteBeams || 1;
                    tipRef.tup = dev.tupletGroup || null;   // day 29: over/overLeft anchor to bracket rests
                    // grid position + written length, so the secondary beam can
                    // tell "adjacent 16ths" (connect) from "16th then a rest"
                    // (a stub). Tuplet members carry fractional positions so
                    // adjacency inside a bracket works the same way.
                    if (dev.tupletGroup) {
                      tipRef.pos = dev.tupletStartPos + dev.tupletSlot * (dev.tupletDen / dev.tupletNum);
                      tipRef.len = dev.tupletDen / dev.tupletNum;
                    } else if (dev.beamPos != null) {
                      tipRef.pos = dev.beamPos;
                      tipRef.len = dev.noteUnits != null ? dev.noteUnits : 1;
                    }
                    if (dev.beamUnit) {
                      grp.unit = dev.beamUnit;
                      grp.beams = dev.beamLevels || 1;
                      const cid = dev.gridId || dev.clusterId || key;
                      if (!clusters.has(cid)) clusters.set(cid, { unit: dev.beamUnit, sub: dev.beamSubdivision || 4, positions: [] });
                      const cl = clusters.get(cid);
                      if (cl.anchorT == null || e.onset < cl.anchorT) { cl.anchorT = e.onset; cl.anchorPos = dev.beamPos; }
                      cl.positions.push(dev.beamPos);
                      // day 29 (--rest16): the silence ending at this position is
                      // written as 16th rests, one per slot
                      if (dev.rest16Before) (cl.rest16At = cl.rest16At || new Set()).add(dev.beamPos);
                      if (dev.noteUnits) cl.covers = (cl.covers || []).concat([[dev.beamPos, dev.beamPos + dev.noteUnits]]);
                      if (dev.tupletGroup) {
                        if (!cl.tuplets) cl.tuplets = new Map();
                        if (!cl.tuplets.has(dev.tupletGroup)) cl.tuplets.set(dev.tupletGroup, {
                          num: dev.tupletNum, den: dev.tupletDen, startPos: dev.tupletStartPos,
                          slotUnits: dev.tupletDen / dev.tupletNum, slots: new Map(), dir: stemDir,
                          // day 29: WHICH beam group owns this bracket — a cluster
                          // now holds several groups at different beam heights
                          grp: dev.beamGroup || null,
                          // day 24: a tuplet at the 8th level (three 8ths in a quarter) prints
                          // '3:2' and writes 8ths inside the bracket; den (4) is still the span
                          // in 16ths that places the slots. Absent = the 16th-level case (T1).
                          text: dev.tupletText || (dev.tupletNum + ':' + dev.tupletDen),
                          valueDur: dev.tupletValue || (cl.sub * 4),
                        });
                        cl.tuplets.get(dev.tupletGroup).slots.set(dev.tupletSlot, e.onset);
                        cl.covers = (cl.covers || []).concat([[dev.tupletStartPos, dev.tupletStartPos + dev.tupletDen]]);
                      }
                    }
                  }
                  items.push({ k: 'stem', t: e.onset, dxSs: headDx + att.dx, yA: yStart, yB: yEnd, attach: stemDir, ev: e.id });
                  if (beamTip) beamTip.stem = items[items.length - 1];
                  if (flagG) items.push(Object.assign({ k: 'glyph', g: 'flag-' + (stemDir === 'up' ? 'up' : 'down') + flagDur, t: e.onset, dxSs: headDx + att.dx, ySs: yEnd, align: 'stemTip' },
                    flagKy !== 1 ? { scaleY: flagKy } : {}));
                  // the stem tip is the unit's outer ink on its side (a flag
                  // hangs back toward the head, never past the tip)
                  if (stemDir === 'up') inkTopY = Math.max(inkTopY, yEnd); else inkBotY = Math.min(inkBotY, yEnd);
                }
                if (yDot != null) {
                  items.push({ k: 'dot', t: e.onset, dxSs: headDx, ySs: yDot });
                  inkTopY = Math.max(inkTopY, yDot + rDot); inkBotY = Math.min(inkBotY, yDot - rDot);
                }
                // day 31: the head-side dyn row (stem-down groups) needs each
                // member's head-side ink extent — head + accidental + dot
                if (dev.beamGroup && beamGroups.has(dev.beamGroup)) {
                  const tps = beamGroups.get(dev.beamGroup).tips;
                  const tp = tps.length && Math.abs(tps[tps.length - 1].t - e.onset) < 1e-9 ? tps[tps.length - 1] : null;
                  if (tp) {
                    tp.headTopYSs = inkTopY; tp.headBotYSs = inkBotY;
                    // day 33: the accidental's ink, kept SEPARATE from
                    // headTopYSs (whose consumers are approved as-is) — the
                    // bracket-above policy must clear sharps ("brackets
                    // shouldn't be sitting on top of an accent or a
                    // accidental", composer day 33)
                    if (accRel) { tp.accTopYSs = yDraw + accRel.accTopExt; tp.accBotYSs = yDraw - accRel.accBotExt; }
                  }
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
                if (markG && !markToGroup) {
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
      const cl16 = g => { const c = clusters.get(g.gridId); return c ? (c.sub || 4) * 4 : 16; };
      for (const [key, g] of beamGroups) {
        // A LONE NOTE IN A BEAM GROUP OF ITS OWN (day 29, composer, on T2's
        // seventh partial — the one note after two groups of three): "let's
        // just have two beamlets on the right for that single sixteenth". Not
        // a flag (their first thought, withdrawn) — the note keeps the beamed
        // look of the cluster it belongs to, as a stem with a stub at every
        // beam level, pointing RIGHT (the direction of the music it opens; the
        // last-note-points-left rule below is for a note that CLOSES a group,
        // and a lone note closes nothing). Deliberate only inside a cluster
        // that has other notes: a cluster that IS one note is still the old
        // mistake (a --cluster span that swept a single head) and still warns.
        if (g.tips.length === 1) {
          const clOf = clusters.get(g.gridId);
          if (clOf && clOf.positions.length > 1) g.lone = true;
          else { warnings.push('beam group "' + key + '" has 1 note(s) — no beam drawn'); continue; }
        } else if (g.tips.length < 2) { warnings.push('beam group "' + key + '" has ' + g.tips.length + ' note(s) — no beam drawn'); continue; }
        g.tips.sort((a, b) => a.t - b.t);
        // A BEAM IS FLAT, AND IT IS THE GROUP'S, NOT THE NOTE'S (day 24).
        // Each note computes its beam height from ITS OWN technique's flag
        // (the one-shots' flag16), so a group of one technique is level by
        // construction — but a MIXED group is not: a fortepiano carries no
        // nhStem of its own, falls back to flag8 (3.008 ss vs flag16's
        // 3.508), and the beam joining it to a staccato would slope by half
        // a space. Found day 24 by measurement, before drawing the
        // composer's staccato-into-long-tone pair. Levelling to the tip
        // FURTHEST from the staff keeps every stem at least as long as it
        // asked for (never shortens one under its flag clearance), and is a
        // provable no-op when the tips already agree.
        {
          const ys = g.tips.map(t => t.ySs);
          let yLevel = g.dir === 'up' ? Math.max(...ys) : Math.min(...ys);
          // ...and LOWER for the group's dynamics row (day 24): above the
          // beam the row needs stackGap + the tallest mark, inside the lane.
          // Same shape as the accent rule, applied at group level so the
          // whole beam moves as one and stays flat.
          // THE STACK ABOVE THE BEAM (day 24, composer: "unify the collision
          // detection/avoidance"). Three things can sit above a beam — the
          // accent row, a tuplet bracket, the dynamics row — and until now each
          // placed itself against the beam alone, so any two of them collided
          // (T5: mf on the accent; T10: mf on the bracket). One stack, one
          // order, outward from the beam: ACCENTS (nearest the notes, Gould) ·
          // TUPLET BRACKET (its padding is its gap) · DYNAMICS. Each row's
          // offset is computed here once and read by every drawer below; the
          // beam is lowered so the whole stack fits inside the lane.
          {
            const CSg = Object.assign({ laneHalfSs: 6.51 }, o.chainSide || {});
            const gapD = o.stackGapSs != null ? o.stackGapSs : 0.45;
            const TPg = Object.assign({ paddingSs: 0.5, hookLengthSs: 0.7, numeralSizeSs: 1.2348, numeralBaselineBelowSs: 0.41, numeralCapFactor: 0.7 }, o.tuplet || {});
            let h = 0;
            const st = {};
            if (g.artics && g.artics.length) {
              const aH = Math.max(...g.artics.map(a => (glyphs.articulation[a.kind] || { hSs: 0 }).hSs));
              st.articCentre = gapD + aH / 2; h = gapD + aH;
            }
            if (g.hasTuplet) {
              // line at padding + hook above whatever is below it; the numeral's
              // cap rises capAbove past the line
              const capAbove = TPg.numeralSizeSs * TPg.numeralCapFactor - TPg.numeralBaselineBelowSs;
              st.bracketLine = h + TPg.paddingSs + TPg.hookLengthSs; h = st.bracketLine + capAbove;
            }
            // THE DYN ROW SIDE (day 31, the vertical budget): on a stem-DOWN
            // group the beam-side column cannot hold head + stem + accents +
            // bracket + dynamics inside the lane half (measured on T2:
            // 2.6 + 1 + 1.29 + 1.65 + 1.42 = 7.97 > 6.51 — the old clamp made
            // room by shoving the beam INTO the staff, which is what the
            // composer saw: beams on the staff lines, heads with no stems).
            // So for dir-down groups the dynamics row moves to the HEAD side
            // (above the staff/heads — the mirror of the day-22 column
            // standard, which stacks chrome on the head side where there is
            // room). Accents and brackets stay with the beam. Stem-up groups
            // are unchanged (day-24 approved).
            if (g.dyns && g.dyns.length && g.dir === 'up') {
              const dH = Math.max(...g.dyns.map(d => d.hSs));
              st.dynCentre = h + gapD + dH / 2; h = h + gapD + dH;
            }
            g.stack = st;

            // THE FLOOR (day 31): the stack clamp may pull the beam toward the
            // staff to fit the lane, but never (a) inside the staff band, and
            // never (b) past a head so far that its stem inverts or vanishes —
            // the nearest head on the beam side keeps at least minStemSs of
            // stem. Measured failure: cl-38a clamped to -2.15 (staff bottom
            // line -2), stems 0.03 and -0.47. When floor and lane fight, the
            // floor wins and the stack overflows toward the lane edge —
            // protrusion is tier-3, staff invasion is not.
            if (h > 0) { const lim = CSg.laneHalfSs - h; yLevel = g.dir === 'up' ? Math.min(yLevel, lim) : Math.max(yLevel, -lim); }
            // ── THE WIDE-REGISTER REPAIR PASS (day 31, composer with the
            // screenshots: "there needs to be a set of rules that lets the
            // beams and the stems be long enough and is able to switch sides
            // with brackets or accents and might even have brackets and
            // accents be on opposite sides"). The classic layout above welds
            // all furniture to the beam side and, when a gesture's register is
            // wide, the lane cannot hold head + stem + accents + bracket +
            // dynamics on one side — the clamp then shortened stems into
            // nothing and slid beams over noteheads. The repair extends the
            // day-22 sideWithRoom principle (the one-shot chain already
            // switches sides by room) to beamed-group furniture:
            //
            //   RULE 1  the beam sits beyond the farthest head on its side by
            //           beamStemSs (2.5 — just under 2.61, the smallest stem
            //           on any APPROVED page, so the trigger provably never
            //           fires on approved material; measured day 31).
            //   RULE 2  furniture rows keep the day-24 order (accents ·
            //           bracket · dynamics, outward) and fill the BEAM side
            //           while rows fit inside the lane; a row that does not
            //           fit flips to the HEAD side, stacked outward from the
            //           gesture's measured head ink (never inside the staff).
            //   RULE 3  a flipped bracket draws with its hooks toward the
            //           notes (the side flip flips the hook direction).
            //
            // The pass runs ONLY when the classic result leaves a stem under
            // beamStemSs — approved pages never trigger and are untouched.
            {
              const stemPref = o.beamStemSs != null ? o.beamStemSs : 2.5;
              // row joints in the repair stack use THE MEDIUM GAP (day 31,
              // composer named the three-tier system: 0.15 tight · 0.30
              // medium · 0.45 standard; registry gapMediumSs) — the repair is
              // where vertical room is scarce, and it never fires on approved
              // pages, so the classic 0.45 stacks stay as approved.
              const gapM = o.gapMediumSs != null ? o.gapMediumSs : 0.3;
              const yAs = g.tips.filter(t => t.stem).map(t => t.stem.yA);
              const worst = yAs.length ? (g.dir === 'up'
                ? yLevel - Math.max(...yAs) : Math.min(...yAs) - yLevel) : Infinity;
              if (worst < stemPref - 1e-9) {
                // RULE 1 — the beam clears every head
                yLevel = g.dir === 'up'
                  ? Math.max(yLevel, Math.max(...yAs) + stemPref)
                  : Math.min(yLevel, Math.min(...yAs) - stemPref);
                // measured head-side ink extent (head + accidental + dot),
                // never inside the staff band
                const headIn = g.dir === 'up'
                  ? Math.min(-2, ...g.tips.map(t => t.headBotYSs != null ? t.headBotYSs : Infinity))
                  : Math.max(2, ...g.tips.map(t => t.headTopYSs != null ? t.headTopYSs : -Infinity));
                // RULE 2 — assign rows to sides by room
                const lane = CSg.laneHalfSs;
                const capAbove = TPg.numeralSizeSs * TPg.numeralCapFactor - TPg.numeralBaselineBelowSs;
                const rows = [];
                if (g.artics && g.artics.length) {
                  const aH = Math.max(...g.artics.map(a => (glyphs.articulation[a.kind] || { hSs: 0 }).hSs));
                  rows.push({ kind: 'artic', need: gapM + aH, centreOff: gapM + aH / 2 });
                }
                if (g.hasTuplet) rows.push({ kind: 'bracket', need: TPg.paddingSs + TPg.hookLengthSs + capAbove, lineOff: TPg.paddingSs + TPg.hookLengthSs });
                if (g.dyns && g.dyns.length) {
                  const dH = Math.max(...g.dyns.map(d => d.hSs));
                  rows.push({ kind: 'dyn', need: gapM + dH, centreOff: gapM + dH / 2 });
                }
                let usedBeam = 0, usedHead = 0;
                const sgn = g.dir === 'up' ? 1 : -1;      // beam side points this way
                for (const r of rows) {
                  // THE BRACKET'S SIDE (day 31, composer on T7: "brackets…
                  // are too far down. There's plenty of room above"): the
                  // head side only when the whole bracket FITS INSIDE the
                  // lane there; otherwise back to the BEAM side — its
                  // engraving home — which may overflow the lane edge by up
                  // to bracketOverflowMaxSs (the gap plus the neighbour's
                  // usually-empty margin; the protrusion detector still
                  // measures it). Only past that does it stay head-side
                  // (T9), and colliding marks move instead (the post-pass).
                  if (r.kind === 'bracket') {
                    const headOuter = Math.abs(headIn) + usedHead + r.need;
                    const beamOuter = Math.abs(yLevel) + usedBeam + r.need;
                    const maxOver = o.bracketOverflowMaxSs != null ? o.bracketOverflowMaxSs : 1.3;
                    const toHead = headOuter <= lane + 1e-9
                      || (beamOuter > lane + maxOver + 1e-9 && headOuter <= beamOuter);
                    if (toHead) {
                      const y0 = headIn - sgn * usedHead;
                      st.bracketY = y0 - sgn * r.lineOff;
                      st.bracketDirDraw = g.dir === 'up' ? 'down' : 'up';
                      usedHead += r.need;
                    } else {
                      const y0 = sgn * (Math.abs(yLevel) + usedBeam);
                      st.bracketY = y0 + sgn * r.lineOff;
                      st.bracketDirDraw = g.dir;
                      usedBeam += r.need;
                    }
                    continue;
                  }
                  // DYN MARKS leave the row logic entirely (day 31, composer
                  // on T8: "the fff could be down near the staff, and the mf
                  // can reach down closer to that notehead") — placed
                  // per-mark against their own column, below.
                  if (r.kind === 'dyn') { st.dynPerMark = true; continue; }
                  const beamBase = Math.abs(yLevel) + usedBeam;
                  if (beamBase + r.need <= lane + 1e-9) {  // fits on the beam side
                    const y0 = sgn * beamBase;
                    st.articY = y0 + sgn * r.centreOff;
                    usedBeam += r.need;
                  } else {                                  // flips to the head side
                    const y0 = headIn - sgn * usedHead;
                    st.articY = y0 - sgn * r.centreOff;
                    usedHead += r.need;
                  }
                }
                st.repaired = true;
              }
            }
            // ── DICTATED SIDES (day 31, the composer placing T6 and T7 by ear).
            // The automatic room test is a heuristic still being calibrated by
            // the composer's eye; --bracketSide/--articSide let a verdict be
            // stated per cluster in ABSOLUTE terms (above/below the staff),
            // which is how the composer speaks. Rows are then stacked in the
            // day-24 order outward from whatever that side already holds —
            // and on the head side that INCLUDES the per-mark dynamics, which
            // is the clash the composer flagged on T6's f.
            if (g.bracketSide || g.articSide) {
              const gapMd = o.gapMediumSs != null ? o.gapMediumSs : 0.3;
              const TPd = Object.assign({ paddingSs: 0.5, hookLengthSs: 0.7, numeralSizeSs: 1.2348, numeralBaselineBelowSs: 0.41, numeralCapFactor: 0.7 }, o.tuplet || {});
              const capD = TPd.numeralSizeSs * TPd.numeralCapFactor - TPd.numeralBaselineBelowSs;
              const beamSideIsAbove = g.dir === 'up';
              // what each side already holds, as an outward extent
              const dynTops = (g.dyns || []).map(d => {
                const tip = g.tips.find(t => Math.abs(t.t - d.t) < 1e-6);
                const col = g.dir === 'up'
                  ? (tip && tip.headBotYSs != null ? tip.headBotYSs : -2)
                  : (tip && tip.headTopYSs != null ? tip.headTopYSs : 2);
                return g.dir === 'up' ? col - gapMd - d.hSs : col + gapMd + d.hSs;
              });
              const headEdge = g.dir === 'up'
                ? Math.min(-2, ...g.tips.map(t => t.headBotYSs != null ? t.headBotYSs : Infinity), ...dynTops)
                : Math.max(2, ...g.tips.map(t => t.headTopYSs != null ? t.headTopYSs : -Infinity), ...dynTops);
              const used = { above: beamSideIsAbove ? Math.abs(yLevel) : Math.abs(headEdge),
                             below: beamSideIsAbove ? Math.abs(headEdge) : Math.abs(yLevel) };
              const put = (side, need) => { const base = used[side]; used[side] = base + need; return base; };
              // day-24 order: accents nearest the notes, then the bracket
              if (g.artics && g.artics.length && g.articSide) {
                const aH = Math.max(...g.artics.map(a => (glyphs.articulation[a.kind] || { hSs: 0 }).hSs));
                if ((g.articSide === 'above') !== beamSideIsAbove) {
                  // HEAD SIDE = PER-MARK (day 33, composer on T7 @45.68: "the
                  // accent could go below the NOTE" — note-relative, exactly
                  // day-31's "closer to that notehead" for dynamics; the same
                  // law extends to accents: on the head side the heads differ
                  // in height and a group row floats over the shallow
                  // columns). Each accent clears ITS OWN column's ink (head +
                  // dot + accidental) by the medium gap, floored at the staff
                  // edge. (A dyn mark sharing the exact column is not yet
                  // consulted — no dictated cluster has that; NITS if ever.)
                  st.articPerMark = new Map();
                  let outer = 0;
                  for (const a of g.artics) {
                    const tip = g.tips.find(t => Math.abs(t.t - a.t) < 1e-6);
                    let y;
                    if (g.articSide === 'above') {
                      const col = Math.max(2,
                        tip && tip.headTopYSs != null ? tip.headTopYSs : 2,
                        tip && tip.accTopYSs != null ? tip.accTopYSs : -Infinity);
                      y = col + gapMd + aH / 2;
                    } else {
                      const col = Math.min(-2,
                        tip && tip.headBotYSs != null ? tip.headBotYSs : -2,
                        tip && tip.accBotYSs != null ? tip.accBotYSs : Infinity);
                      y = col - gapMd - aH / 2;
                    }
                    st.articPerMark.set(a.t, y);
                    outer = Math.max(outer, Math.abs(y) + aH / 2);
                  }
                  used[g.articSide] = Math.max(used[g.articSide], outer);
                } else {
                  const base = put(g.articSide, gapMd + aH);
                  st.articY = (g.articSide === 'above' ? 1 : -1) * (base + gapMd + aH / 2);
                }
              }
              if (g.hasTuplet && g.bracketSide) {
                const base = put(g.bracketSide, TPd.paddingSs + TPd.hookLengthSs + capD);
                st.bracketY = (g.bracketSide === 'above' ? 1 : -1) * (base + TPd.paddingSs + TPd.hookLengthSs);
                // hooks point toward the notes: down for an above bracket
                // hooks turn TOWARD the notes. The draw flag is named for the
                // STEM sense: 'up' = bracket above, hooks descend; 'down' =
                // bracket below, hooks ascend. Day 32: this was inverted here
                // when the dictation block was written, so every dictated
                // bracket pointed away from its own notes (T6 above/hooks-down,
                // T7 below/hooks-up) -- the composer's 'make sure the brackets
                // are pointing in the right direction'.
                st.bracketDirDraw = g.bracketSide === 'above' ? 'up' : 'down';
              }
            }
            // ── THE BRACKET-ABOVE POLICY (day 33, the composer's verdict:
            // "b"). EVERY bracket sits ABOVE its own staff, always — on the
            // page, ownership reads as "a bracket belongs to the staff
            // directly below it", and no inter-staff band ever holds
            // brackets from two parts (the day-32 T7/T8 unreadability: four
            // brackets, two owners, one band). Replaces the day-31 room test
            // for brackets, which produced 8 above / 8 below. The bracket
            // HUGS its own group's ink — stem-up: the beam; stem-down: the
            // head-column ink INCLUDING accidentals ("brackets shouldn't be
            // sitting on top of an accent or a accidental", composer day
            // 33); either: the accent row when it is above. Cleared by the
            // bracket's own padding, floored at the staff edge — distance is
            // never a fixed row (the "further away than they need to be"
            // complaint WAS the row model). For a classic stem-up stack this
            // reproduces the day-24 numbers exactly (beam · accents ·
            // bracket at the same gaps), so approved-style figures do not
            // move. Overflow past the lane edge is allowed and measured
            // (tier-3), per the day-33 high-ledger discussion: the band
            // above always belongs to THIS part's brackets. A dictated
            // --bracketSide wins (it ran just above; skipped here). Scoped
            // per-IR (ir.layoutPolicy.bracketSide) so approved db1 pages
            // are byte-identical.
            if (POL.bracketSide === 'above' && g.hasTuplet && !g.bracketSide) {
              const TPa = Object.assign({ paddingSs: 0.5, hookLengthSs: 0.7 }, o.tuplet || {});
              let ext = 2;                                     // staff edge floor
              if (g.dir === 'up') ext = Math.max(ext, yLevel); // beam above, stems reach it
              for (const t of g.tips) {
                // headTopYSs is the note-build ink top, which for a stem-UP
                // note contains the PRE-LEVEL stem tip — stale once the
                // stack clamp lowers the beam (measured: T10 @32.93 tips
                // 4.86 over a beam clamped to 2.15, lifting six approved
                // brackets 1.42 ss). On a stem-up group the BEAM is the
                // outer ink (yLevel above); heads only count when they face
                // up (stem-down). Accidentals are stem-free — always count.
                if (g.dir !== "up" && t.headTopYSs != null) ext = Math.max(ext, t.headTopYSs);
                if (t.accTopYSs != null) ext = Math.max(ext, t.accTopYSs);
              }
              if (g.artics && g.artics.length) {
                const aH = Math.max(...g.artics.map(a => (glyphs.articulation[a.kind] || { hSs: 0 }).hSs));
                if (st.articPerMark) { for (const yA of st.articPerMark.values()) if (yA > 0) ext = Math.max(ext, yA + aH / 2); }
                else if (st.articY != null) { if (st.articY > 0) ext = Math.max(ext, st.articY + aH / 2); }
                else if (st.articCentre != null && g.dir === 'up') ext = Math.max(ext, yLevel + st.articCentre + aH / 2);
              }
              st.bracketY = ext + TPa.paddingSs + TPa.hookLengthSs;
              st.bracketDirDraw = 'up';
            }
          }
          for (const t of g.tips) {
            if (Math.abs(t.ySs - yLevel) > 1e-9 && t.stem) t.stem.yB = yLevel;
            t.ySs = yLevel;
          }
        }
        const stubLen = o.beamStubSs != null ? o.beamStubSs : 1.0;
        // THE BEAM OVER THE FIRST REST (day 29, composer, T2: "extend the bar
        // from the first three partials rightwards over the first sixteenth
        // rest... two beams all the way through the first three partials and
        // over the first sixteenth rest"). A phantom tip at the first rest's
        // slot time, carrying the last stem's own x offset, so the beam ends
        // just past that rest's glyph (one slot beyond the last stem) and
        // before the next rest begins — the engraver's beam-over-a-rest, which
        // stops where the rest's stem would be. No stem is drawn for it. Every
        // level that reaches the last note carries on to it.
        // ...and its mirror (day 29, the lone seventh partial as "a group of
        // two — beams over [the] sixteenth rest and then the partial"): a
        // phantom tip BEFORE the group's first note, at the preceding rest's
        // slot, so the beams reach back over that one rest. Starts a pad
        // before the rest's left edge (which sits on its slot time, D61).
        let overLTip = null;
        if (g.overLeft && g.unit && g.tips.length) {
          const first = g.tips[0];
          const cgL = clusters.get(g.gridId);
          const pastL = (o.beamOverPastSs != null ? o.beamOverPastSs : 0.2);
          // day 29 (T3's 3:2): when the group's first note is a TUPLET member
          // with a leading bracket rest, the beam reaches back to THAT rest's
          // slot (an 8th-level slot is wider than one unit); otherwise one
          // written-value width back — the rest immediately before.
          let tSlotL = null;
          const tpL = first.tup && cgL && cgL.tuplets && cgL.tuplets.get(first.tup);
          if (tpL && cgL.anchorT != null) {
            const minNote = Math.min.apply(null, [...tpL.slots.keys()]);
            if (minNote > 0) tSlotL = cgL.anchorT + (tpL.startPos - cgL.anchorPos + (minNote - 1) * tpL.slotUnits) * g.unit;
          }
          if (tSlotL == null) tSlotL = (cgL && cgL.anchorT != null && first.pos != null)
            ? cgL.anchorT + (first.pos - cgL.anchorPos - (first.len || 1)) * g.unit
            : first.t - g.unit;
          overLTip = { t: tSlotL, dxSs: -pastL, ySs: first.ySs, phantom: true };
        }
        let overTip = null;
        if (g.over && g.unit && g.tips.length) {
          const last = g.tips[g.tips.length - 1];
          // the rest's LEFT edge is on its slot time (D61), so its right edge is
          // one glyph width on; the beam ends a hair past that — anchored to
          // the rest, not to the last stem's own x offset (which varies per
          // note with the head it stands on, and left the second group's beam
          // ending in the middle of its rest)
          const past = (o.beamOverPastSs != null ? o.beamOverPastSs : 0.2);
          // timed from the GRID slot (where the rest is), not from the last
          // note's onset, which sits off its slot by the fit error
          const cg = clusters.get(g.gridId);
          // day 29 (T3's 5:4): a group ending on a TUPLET member with trailing
          // bracket rests claims THEM ALL — the beam reaches the last bracket
          // rest's slot (matching the bracket's own content-extent rule);
          // otherwise the first following rest, one written value on.
          let tSlot = null, restDur = cl16(g) || 16;
          const tpR = last.tup && cg && cg.tuplets && cg.tuplets.get(last.tup);
          if (tpR && cg.anchorT != null) {
            const maxNote = Math.max.apply(null, [...tpR.slots.keys()]);
            if (maxNote < tpR.num - 1) {
              tSlot = cg.anchorT + (tpR.startPos - cg.anchorPos + (tpR.num - 1) * tpR.slotUnits) * g.unit;
              restDur = tpR.valueDur || restDur;
            }
          }
          if (tSlot == null) tSlot = (cg && cg.anchorT != null && last.pos != null)
            ? cg.anchorT + (last.pos - cg.anchorPos + (last.len || 1)) * g.unit
            : last.t + (last.len || 1) * g.unit;
          const rg = glyphs.rest && glyphs.rest['rest' + restDur];
          overTip = { t: tSlot, dxSs: (rg ? rg.wSs : 1) + past, ySs: last.ySs, phantom: true };
        }
        if (g.lone && overLTip) {
          // the lone note as "a group of two": every level runs from the
          // phantom over the preceding rest to the stem (day 29)
          const t = g.tips[0];
          const step0 = (glyphs.standards.beam && glyphs.standards.beam.stackStep) || 0.81;
          for (let b = 1; b <= (t.beams || 1); b++) {
            const off = (b - 1) * step0 * (g.dir === 'up' ? -1 : 1);
            items.push({ k: 'beam', dir: g.dir, group: key + (b > 1 ? '-b' + b : ''), overLeft: true,
              tips: [{ t: overLTip.t, dxSs: overLTip.dxSs, ySs: t.ySs + off }, { t: t.t, dxSs: t.dxSs, ySs: t.ySs + off }] });
          }
        } else if (g.lone) {
          // the primary level as a right-pointing stub of the beamlet length
          const t = g.tips[0];
          items.push({ k: 'beam', dir: g.dir, group: key + '-stub', stub: true,
            tips: [{ t: t.t, dxSs: t.dxSs, ySs: t.ySs }, { t: t.t, dxSs: t.dxSs + stubLen, ySs: t.ySs }] });
        } else {
          const tipsP = (overLTip ? [overLTip] : []).concat(g.tips).concat(overTip ? [overTip] : []);
          items.push({ k: 'beam', dir: g.dir, tips: tipsP, group: key, over: overTip ? true : undefined, overLeft: overLTip ? true : undefined });
        }
        // SECONDARY BEAMS (day 23): the cluster's tempo fit says what the
        // notes ARE — at a 16th grid every note is a 16th, so a second beam
        // runs the whole group. beams = log2(value / quarter); the grid comes
        // from the cluster overlay (unitSeconds + the members' positions), so
        // the drawing follows the analysis rather than a guess.
        // SECONDARY BEAMS run only over CONSECUTIVE notes that both carry
        // that level (day 23): with figure 1 written at true durations —
        // 8th 8th 16th 16th 8th 8th 16th 16th — the second beam appears
        // only over the 16th pairs, so the beam pattern itself shows the
        // rhythm instead of implying eight even notes.
        const step = (glyphs.standards.beam && glyphs.standards.beam.stackStep) || 0.81;
        const maxLvl = Math.max(...g.tips.map(t => t.beams || 1));
        for (let b = 2; b <= maxLvl; b++) {
          const off = (b - 1) * step * (g.dir === 'up' ? -1 : 1);
          const stub = stubLen;
          if (g.lone && overLTip) break;   // day 29: already drawn as the two-tip "group of two"
          let run = [];
          const flush = () => {
            if (run.length >= 2) {
              // a run that reaches the group's last note carries on over the rest too
              const tail = (overTip && run[run.length - 1] === g.tips[g.tips.length - 1]) ? [overTip] : [];
              const head = (overLTip && run[0] === g.tips[0]) ? [overLTip] : [];
              items.push({ k: 'beam', dir: g.dir, group: key + '-b' + b,
                tips: head.concat(run).concat(tail).map(t => ({ t: t.t, dxSs: t.dxSs, ySs: t.ySs + off })) });
            } else if (run.length === 1) {
              // A BEAMLET (day 23, composer): a note with no 16th neighbour
              // still shows the second level, as a stub pointing right —
              // "a short beam where the sixteenth note beam is, not something
              // that connects". Standard fractional-beam practice.
              const t = run[0];
              // ...EXCEPT ON THE GROUP'S LAST NOTE, where it points LEFT (day 24,
              // composer, on the third partial of T2's first group: "the beamlet
              // should go inside the stem rather than protruding outside... on the
              // left of the stem"). A right-pointing stub there hangs past the end
              // of the primary beam and reads as material that is not written.
              // Gould's rule too: a fractional beam points toward the group it
              // belongs to, which for the final note is backwards.
              const lastOfGroup = !g.lone && t === g.tips[g.tips.length - 1];   // a lone note closes nothing (day 29)
              const dxA = lastOfGroup ? t.dxSs - stub : t.dxSs;
              const dxB = lastOfGroup ? t.dxSs : t.dxSs + stub;
              items.push({ k: 'beam', dir: g.dir, group: key + '-b' + b + '-stub', stub: true, inward: lastOfGroup || undefined,
                tips: [{ t: t.t, dxSs: dxA, ySs: t.ySs + off }, { t: t.t, dxSs: dxB, ySs: t.ySs + off }] });
            }
            run = [];
          };
          // a run continues only while consecutive notes ABUT: the previous
          // note's written length must reach the next one's position, i.e.
          // nothing (a rest) sits between them
          let prev = null;
          for (const t of g.tips) {
            if ((t.beams || 1) < b) { flush(); prev = null; continue; }
            // ...unless the group beams THROUGH its rests (day 23, composer,
            // on the second figure: "they can all be beamed together, it's
            // fine, the sixteenths"). Standard where the group is one
            // rhythmic unit — the tuplet's internal rest should not sever it.
            if (!g.through && prev && t.pos != null && prev.pos != null && Math.abs((prev.pos + (prev.len || 1)) - t.pos) > 1e-6) flush();
            run.push(t); prev = t;
          }
          flush();
        }
        // ARTICULATIONS above the beam, every one at the SAME height so the
        // group reads as one gesture (Gould: articulations align across a
        // beamed group). Centred on each note's head column.
        if (g.artics && g.artics.length) {
          const beamTop = g.tips[0].ySs;
          for (const a of g.artics) {
            const aG = glyphs.articulation && glyphs.articulation[a.kind];
            if (!aG) { warnings.push('articulation "' + a.kind + '" has no glyph — not drawn'); continue; }
            const y = (g.stack.articPerMark && g.stack.articPerMark.has(a.t)) ? g.stack.articPerMark.get(a.t)
              : g.stack.articY != null ? g.stack.articY
              : (g.dir === 'up' ? beamTop + g.stack.articCentre : beamTop - g.stack.articCentre);
            items.push({ k: 'glyph', g: 'artic-' + a.kind, t: a.t, dxSs: a.dxSs, ySs: y, align: 'center' });
          }
        }
        // THE DYNAMICS ROW above the beam (day 24): every member's mark on ONE
        // line, centred on its head column — consecutive dynamics read as a
        // phrase, not as per-note chrome. Above the accents when both exist.
        if (g.dyns && g.dyns.length) {
          if (g.stack.dynPerMark || (g.dir !== 'up' && g.stack.dynY == null)) {
            // PER-MARK HUGGING (day 31, composer on T8: "the fff could be down
            // near the staff, and the mf can reach down closer to that
            // notehead. There's lots of space."): a head-side mark clears ITS
            // OWN column's ink (that member's head + dot + accidental) by the
            // medium gap — never a group-wide row floated at the tallest
            // head, and never inside the staff. The old one-row rule kept
            // marks "reading as a phrase" (day 24) on the BEAM side, where
            // the row hangs off the beam — on the head side the heads are at
            // wildly different heights and the row floated over low columns.
            const gapM2 = o.gapMediumSs != null ? o.gapMediumSs : 0.3;
            for (const d of g.dyns) {
              const tip = g.tips.find(t => Math.abs(t.t - d.t) < 1e-6);
              const colInk = g.dir === 'up'
                ? Math.min(-2, tip && tip.headBotYSs != null ? tip.headBotYSs : Infinity)
                : Math.max(2, tip && tip.headTopYSs != null ? tip.headTopYSs : -Infinity);
              const y = g.dir === 'up' ? colInk - gapM2 - d.hSs / 2 : colInk + gapM2 + d.hSs / 2;
              items.push({ k: 'glyph', g: 'dyn-' + d.key, t: d.t, dxSs: d.dxSs, ySs: y, align: 'center' });
            }
          } else if (g.stack.dynY != null) {
            for (const d of g.dyns) items.push({ k: 'glyph', g: 'dyn-' + d.key, t: d.t, dxSs: d.dxSs, ySs: g.stack.dynY, align: 'center' });
          } else {
            const base = g.tips[0].ySs;
            const y = base + g.stack.dynCentre;
            for (const d of g.dyns) items.push({ k: 'glyph', g: 'dyn-' + d.key, t: d.t, dxSs: d.dxSs, ySs: y, align: 'center' });
          }
        }
      }
      // RESTS (day 23, composer: "let's put in any rests that are necessary...
      // just have the longest rest you could fit in there, or a combination if
      // it needs to be"). Computed per CLUSTER over the whole grid, so the gap
      // BETWEEN two beam groups gets its rest. Greedy longest-first with metric
      // alignment: at grid position n with r empty units left, take the largest
      // power-of-2 rest R <= r whose start is a multiple of R — the standard
      // rule that keeps a rest from straddling its own beat.
      const FIGCL = ((o.figures || {}).cluster) || {};
      for (const [cid, cl] of clusters) {
        if (!cl.unit || !cl.positions.length) continue;
        const filled = new Set(cl.positions);
        const last = Math.max(...cl.positions), first = Math.min(...cl.positions);
        const t0Grid = cl.anchorT - cl.anchorPos * cl.unit;   // grid position 0 in seconds
        // a note's WRITTEN VALUE covers the units it lasts (day 23): an 8th
        // fills its own gap, so no rest is written there — the cure for
        // figure 1's "twelve even sixteenths" look.
        const covered = n => (cl.covers || []).some(([a, b]) => n >= a && n < b - 1e-9);
        // TUPLET BRACKETS + the rests inside them
        if (cl.tuplets) for (const [tk, tp] of cl.tuplets) {
          const t0 = t0Grid + tp.startPos * cl.unit, t1 = t0 + tp.den * cl.unit;
          // THE BRACKET ENDS AT ITS CONTENT, NOT AT THE BEAT LINE (day 29,
          // composer, on T3's 3:2: "Does that include the third to the last
          // note? The bracket is ambiguous... it needs to come back to not
          // include that note"). A tuplet whose LAST slots are rests was drawn
          // to the full arithmetic span — its right edge landing exactly on
          // the next group's first note (worse when that note plays early and
          // its spatially-true head sits back under the line). The bracket
          // still covers its trailing rest — the rest is part of the tuplet
          // (Gould) — but stops just past the rest's glyph: t1 becomes the
          // last trailing rest's slot time and dx1Ss carries glyph + pad, the
          // beamOver anchoring exactly. A tuplet ending on a NOTE keeps the
          // full span (nothing sits inside it to collide with).
          let tEnd = t1, dx1 = null;
          {
            const noteSlots = [...tp.slots.keys()];
            const lastNote = noteSlots.length ? Math.max.apply(null, noteSlots) : -1;
            if (lastNote >= 0 && lastNote < tp.num - 1) {
              const lastRestSlot = tp.num - 1;
              const rg = glyphs.rest && glyphs.rest['rest' + (tp.valueDur || (cl.sub * 4))];
              tEnd = t0 + lastRestSlot * tp.slotUnits * cl.unit;
              dx1 = (rg ? rg.wSs : 1) + (o.beamOverPastSs != null ? o.beamOverPastSs : 0.2);
            }
          }
          const TP = Object.assign({ paddingSs: 0.5, hookLengthSs: 0.7 }, o.tuplet || {});
          // the bracket belongs to ITS group: read that group's beam and stack
          // (the day-23 code read the FIRST group in the system — right by luck
          // while every tuplet was in T1)
          // THE BRACKET SITS ON ITS OWN GROUP'S BEAM (day 29, composer:
          // "fix the bracket beam collisions"). The old scan took the FIRST
          // tuplet-carrying group of the cluster and hung EVERY bracket at
          // that one's height — right when a cluster was one beam group
          // (day 24), wrong once six groups share a cluster: brackets for
          // later groups landed on their own beams. Each tuplet record now
          // carries its owning beamGroup; the scan stays as the fallback for
          // pre-day-29 files.
          let own = (tp.grp && beamGroups.get(tp.grp)) || null;
          if (!own) for (const gg of beamGroups.values()) if (gg.gridId === cid && gg.hasTuplet) { own = gg; break; }
          const beamTop = own ? own.tips[0].ySs : (beamGroups.size ? [...beamGroups.values()][0].tips[0].ySs : 5.22);
          const lineOff = own && own.stack && own.stack.bracketLine != null ? own.stack.bracketLine : (TP.paddingSs + TP.hookLengthSs);
          // day 31: a repaired group states the bracket's ABSOLUTE line and the
          // hook direction (a flipped bracket hooks toward the notes)
          const rep = own && own.stack && own.stack.bracketY != null;
          const yB = rep ? own.stack.bracketY
            : (tp.dir === 'up' ? beamTop + lineOff : -(Math.abs(beamTop) + lineOff));
          const dDraw = rep ? own.stack.bracketDirDraw : tp.dir;
          items.push({ k: 'tuplet', t0, t1: tEnd, dx1Ss: dx1 != null ? dx1 : undefined, ySs: yB, dir: dDraw, text: tp.text || (tp.num + ':' + tp.den), group: tk });
          for (let sIdx = 0; sIdx < tp.num; sIdx++) {
            if (tp.slots.has(sIdx)) continue;
            const t = t0 + sIdx * tp.slotUnits * cl.unit;
            if (t >= w0 - 1e-9 && t <= w1 + 1e-9) items.push({ k: 'rest', dur: tp.valueDur || (cl.sub * 4), t, dxSs: 0, cluster: cid, units: 1, tuplet: tk });
          }
        }
        // ONE REST PER SILENCE, DOTS ALLOWED (day 24, composer: "can you
        // combine the rests, the second could be a dotted 8th rest and the 4th
        // and 5th rests could be an 8th rest"). The day-23 rule took the
        // longest POWER-OF-2 rest whose start was a multiple of its own length
        // — engraving's beat-alignment convention, which on this material split
        // a 3-unit silence into a 16th plus an 8th and a 2-unit silence into two
        // 16ths. On a PROPORTIONAL page there are no barlines for a rest to
        // straddle, so the alignment rule buys nothing and costs legibility:
        // greedy longest-first over dotted values as well, no alignment test.
        //   R units -> value (cl.sub*4)/R ; R = 3·2^k -> the next longer glyph, dotted
        // Capped at 6 units (a dotted quarter at sub 4): an 8-unit rest would
        // want a half-rest glyph, which this font does not carry — the old code
        // could ask for one and throw. Two quarters instead.
        const restFor = R => {
          const base = cl.sub * 4;
          if ((R & (R - 1)) === 0) { const d = base / R; return glyphs.rest['rest' + d] ? { dur: d, dotted: false } : null; }
          if (R % 3 === 0 && ((R / 3) & (R / 3 - 1)) === 0) { const d = base / (2 * (R / 3)); return glyphs.rest['rest' + d] ? { dur: d, dotted: true } : null; }
          return null;
        };
        for (let n = first; n <= last;) {
          if (filled.has(n) || covered(n)) { n++; continue; }
          let run = 0; while (!filled.has(n + run) && !covered(n + run) && n + run <= last) run++;
          // A REST MAY NOT CROSS A BEAT (day 24, D62 — the composer's
          // performance model: a cluster is "go, then COUNT", and with no tempo
          // mark on the page the rests are the ONLY thing that shows where the
          // beat is). A rest BEGINNING on a beat makes that beat visible; a rest
          // running across one hides it. Measured on T3's cluster before the
          // change: beats 2, 3 and 4 all fell inside a rest symbol, so the player
          // counted through three invisible downbeats in a row.
          // Cap the run at the next beat boundary, then take the longest value
          // that fits inside it — dotted values still allowed where they do not
          // cross (registry figures.cluster.restsSplitAtBeat).
          const splitAtBeat = FIGCL.restsSplitAtBeat !== false;
          const toBeat = cl.sub > 0 ? cl.sub - (((n % cl.sub) + cl.sub) % cl.sub) : run;
          const capped = splitAtBeat ? Math.min(run, toBeat) : run;
          let R = 1, spec = restFor(1);
          // day 29 (--rest16): a silence that ends on a marked member is written
          // as 16th rests, one per slot — the composer's "two sixteenths" before
          // T2's lone last partial, so the 16th pulse reads straight into it.
          const as16 = !!(cl.rest16At && cl.rest16At.has(n + run));
          if (!as16) for (const cand of [6, 4, 3, 2, 1]) { const sp = cand <= capped && restFor(cand); if (sp) { R = cand; spec = sp; break; } }
          // LEFT EDGE ON THE START OF THE SILENCE (day 24, second pass — the
          // research settled it). A rest is a note-shaped silence: engraving
          // (Gould, Ross, Read; LilyPond/Dorico/Sibelius defaults) gives it the
          // rhythmic position and spacing a NOTE of that value would get, and
          // aligns it left with notes in other voices — the only floating rest
          // is the whole-bar rest, a different symbol. Stone reports the same
          // for proportional notation, where rests are usually omitted and, when
          // kept, mark the START of the silence. So the rest's LEFT EDGE goes on
          // its slot time — the identical rule the noteheads follow.
          //
          // Two earlier passes were both wrong, in opposite directions: day 23
          // CENTRED the glyph on the slot (half of it hanging back into the
          // previous note's time — the "hugging" the composer saw), and the
          // first day-24 fix centred it in the whole silence, which no tradition
          // supports. Position is here; the render no longer subtracts a half
          // width.
          const t = t0Grid + n * cl.unit;
          if (t >= w0 - 1e-9 && t <= w1 + 1e-9)
            items.push({ k: 'rest', dur: spec.dur, dotted: spec.dotted || undefined, t, dxSs: 0, cluster: cid, units: R });
          n += R;
        }
      }
      // ── THE MARK-CLEARS-THE-BRACKET POST-PASS (day 31, composer on T9:
      // "There's just a clash between the f and the 3:2 bracket. You could
      // probably just lower the dynamic below the bracket altogether.") A
      // dynamic can reach a bracket's band from several placers (the per-note
      // chain, the group row, per-mark hugging), and the brackets are only
      // known once the cluster walk is done — so the fix is a detection-and-
      // placement rule at the end, exactly as the composer framed it: any
      // dynamic whose box overlaps a tuplet bracket's ink on this part is
      // moved just OUTSIDE the bracket (the medium gap past its outer edge),
      // on the bracket's own side.
      {
        const gapMp = o.gapMediumSs != null ? o.gapMediumSs : 0.3;
        const TPp = Object.assign({ numeralSizeSs: 1.2348, numeralBaselineBelowSs: 0.41, numeralCapFactor: 0.7 }, o.tuplet || {});
        const capP = TPp.numeralSizeSs * TPp.numeralCapFactor - TPp.numeralBaselineBelowSs;
        const brs = items.filter(i => i.k === 'tuplet');
        if (brs.length) for (const it of items) {
          if (!(it.k === 'glyph' && /^dyn-/.test(String(it.g)))) continue;
          const key = String(it.g).slice(4);
          const gm = (glyphs.dynamic || {})[key] || { hSs: 1 };
          for (const b of brs) {
            // the mark's centre is a TIME; its ink is ~0.4 ss wide either side,
            // which at working zoom is ~0.02 s — test with a 0.05 s margin so a
            // mark grazing the hook from just outside the span still counts
            if (it.t < b.t0 - 0.05 || it.t > b.t1 + 0.05) continue;
            // the bracket's ink band: line ± (numeral on its numeral side, hook toward the notes)
            const bandLo = b.ySs - (b.dir === 'down' ? capP : 0.75);
            const bandHi = b.ySs + (b.dir === 'down' ? 0.75 : capP);
            const mLo = it.ySs - gm.hSs / 2, mHi = it.ySs + gm.hSs / 2;
            if (mHi < bandLo - 1e-9 || mLo > bandHi + 1e-9) continue;   // clear already
            // outside = away from the staff, past the bracket's outer edge
            it.ySs = b.ySs >= 0
              ? bandHi + gapMp + gm.hSs / 2
              : bandLo - gapMp - gm.hSs / 2;
          }
        }
      }
      return { part, items };
    });

    return { systems, window: [w0, w1], warnings };
  }

  return { layoutSection, deviceResolver, staffPosBass, ledgersFor, dotYFor, stemLenFor };
});
