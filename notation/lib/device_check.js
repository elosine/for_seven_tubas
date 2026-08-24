// device_check.js — THE DEVICE-GAP ASSERT (day 35, D72 made mechanical).
//
// D72: "A DEVICE FLAG MUST TURN ITS DEVICE ON, NOT ONLY SIZE IT." The bug it
// came from: --ringFromBrick wrote device.ringSeconds on the composer's ord
// long tone at 48.05, and layout draws a ring bar only under dev.ringBar,
// which the registry grants fortepiano and cuivre but not ord. The tool
// printed "10 ring bar(s) written from the drawn brick" over a blank page.
// Had that success line been trusted, the job would have been reported done.
//
// The general shape of the bug: a device field that only MODIFIES something
// (a size, a side, a count) written onto an event whose resolved device never
// draws the thing being modified. Silent by construction — the field is real,
// the value is right, and nothing reads it.
//
// THE TABLE IS DERIVED FROM layout.js, NOT HAND-WRITTEN. A hand-written list
// of "ringSeconds needs ringBar" would be correct today and stale the first
// time layout grows a guard. Instead we brace-match layout.js and ask, for
// every dev.X it reads: is EVERY read site of X inside an `if (dev.Y)` block?
// If so, X depends on Y — that is what "only drawn under" means, in the only
// place that can say it. Verified on the two known pairs (ringSeconds→ringBar,
// nhDotGapSs→nhUnit+nhDot) plus 38 others the same pass found.
//
// Falls back to a MINIMUM hardcoded table if layout.js cannot be parsed, so a
// parse failure degrades to a weaker check rather than to no check at all.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DeviceCheck = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // The floor: the pairs we have actually been bitten by or verified by hand.
  // Used only if the derivation fails.
  var FALLBACK = {
    ringSeconds: ['ringBar'],
    ringBarBreath: ['ringBar'],
    nhDot: ['nhUnit'],
    nhHead: ['nhUnit'],
    nhStem: ['nhUnit'],
    beamGroup: ['nhUnit'],
    tupletNum: ['nhUnit', 'tupletGroup'],
    tupletDen: ['nhUnit', 'tupletGroup']
  };

  // Fields that are legitimately written as "off" switches rather than
  // modifiers — a false/0 value asks for nothing, so it can never be orphaned.
  function asks(v) { return !(v === false || v === null || v === undefined); }

  // ---- the derivation ------------------------------------------------------
  // Find every `if (dev.NAME ...) { ... }` block and its extent, then for each
  // `dev.X` read record which of those blocks enclose it. X depends on Y when
  // EVERY read of X lies inside a Y block. (Single-statement guards without
  // braces are skipped: they enclose nothing.)
  function deriveTable(src) {
    var guards = [], re = /if\s*\(\s*dev\.([A-Za-z0-9_]+)\s*(?:\)|&&|===|!==|\|\|)/g, m;
    while ((m = re.exec(src))) {
      var j = m.index, depth = 0;
      while (j < src.length && src[j] !== '(') j++;
      for (; j < src.length; j++) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')') { depth--; if (depth === 0) { j++; break; } }
      }
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] !== '{') continue;                    // no block: guards nothing
      var d = 0, k = j;
      for (; k < src.length; k++) {
        if (src[k] === '{') d++;
        else if (src[k] === '}') { d--; if (d === 0) { k++; break; } }
      }
      guards.push({ name: m[1], start: j, end: k });
    }
    if (!guards.length) return null;
    var reads = {}, rr = /dev\.([A-Za-z0-9_]+)/g;
    while ((m = rr.exec(src))) {
      var name = m[1], pos = m.index, encl = [];
      for (var g = 0; g < guards.length; g++)
        if (pos > guards[g].start && pos < guards[g].end && guards[g].name !== name)
          encl.push(guards[g].name);
      (reads[name] = reads[name] || []).push(encl);
    }
    var out = {};
    Object.keys(reads).forEach(function (k) {
      var common = null;
      reads[k].forEach(function (encl) {
        common = common === null ? encl.slice() : common.filter(function (x) { return encl.indexOf(x) >= 0; });
      });
      if (common && common.length) out[k] = common;
    });
    return Object.keys(out).length ? out : null;
  }

  // Node-side convenience: derive from the layout module on disk.
  function tableFromLayoutFile(fsMod, layoutPath) {
    try {
      var t = deriveTable(fsMod.readFileSync(layoutPath, 'utf8'));
      if (t) return { table: t, source: 'derived from ' + layoutPath };
    } catch (e) { /* fall through */ }
    return { table: FALLBACK, source: 'FALLBACK table (layout.js could not be parsed — check is weaker than usual)' };
  }

  // ---- the assert ----------------------------------------------------------
  // ir            the notation IR
  // resolveDevice e => effective device object (use layout's own deviceResolver;
  //               never re-implement the byTechnique -> byEnv -> per-item merge)
  // table         from tableFromLayoutFile / deriveTable
  //
  // Returns { gaps: [...], checked: n }. A gap is a field that ASKS for
  // something on an event whose resolved device does not draw it.
  function findGaps(ir, resolveDevice, table) {
    var gaps = [], checked = 0;
    var partOf = {};
    (ir.chunks || []).forEach(function (c) {
      (c.events || []).forEach(function (id) { partOf[id] = c.part; });
    });
    (ir.events || []).forEach(function (e) {
      var dev = resolveDevice(e) || {};
      checked++;
      Object.keys(dev).forEach(function (f) {
        if (!asks(dev[f])) return;
        var needs = table[f];
        if (!needs) return;
        needs.forEach(function (n) {
          if (asks(dev[n])) return;
          gaps.push({
            event: e.id,
            object: (e.source && e.source.objectId) || null,
            part: partOf[e.id] != null ? partOf[e.id] : null,
            onset: e.onset,
            technique: e.technique,
            field: f,
            value: dev[f],
            needs: n
          });
        });
      });
    });
    return { gaps: gaps, checked: checked };
  }

  function formatGaps(res) {
    if (!res.gaps.length) return '  device-gap assert: ' + res.checked + ' events, no orphaned device fields.';
    var lines = ['  DEVICE GAP — ' + res.gaps.length + ' field(s) ask for something that is never drawn:'];
    res.gaps.slice(0, 12).forEach(function (g) {
      lines.push('    ' + (g.object || g.event) + ' @T' + (g.part != null ? g.part + 1 : '?') +
        ' ' + Number(g.onset).toFixed(2) + 's tech=' + g.technique +
        ': device.' + g.field + '=' + JSON.stringify(g.value) +
        ' but device.' + g.needs + ' is off — layout draws nothing.');
    });
    if (res.gaps.length > 12) lines.push('    … and ' + (res.gaps.length - 12) + ' more.');
    lines.push('  (D72: a device flag must turn its device on, not only size it.)');
    return lines.join('\n');
  }

  return { deriveTable: deriveTable, tableFromLayoutFile: tableFromLayoutFile, findGaps: findGaps, formatGaps: formatGaps, FALLBACK: FALLBACK };
}));
