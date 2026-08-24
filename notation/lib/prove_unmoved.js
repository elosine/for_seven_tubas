// prove_unmoved.js — THE "NOTHING MOVED" HARNESS (day 35).
//
// Written because it had already been hand-rolled TWICE: day 34 (the fold —
// 425 approved layout rows proven identical before and after) and day 35 (the
// long tone — 3843 -> 3853 items, ADDED 10 / REMOVED 0 / CHANGED 0). Both
// times by hand, both times because the approved-span gate only compares a
// FORK against db1 and prints NOT APPLICABLE for a direct rebuild. A DIRECT
// db1 rebuild has had no automatic guard at all, and long-tone material goes
// into db1 directly (day-35 T4). This closes that hole.
//
// What it compares is the LAID-OUT PAGE, not the IR: two IRs can differ in
// overlays and draw the same page, and — the case that matters — can look
// harmless in the IR and still move approved ink. The question a rebuild has
// to answer is "did anything the composer already approved move?", and only
// the layout model can answer it.
//
// Method: lay both IRs out through layout.js with the app's own opts, flatten
// every system's items with its part, canonicalise (sorted keys, numbers to 6
// decimals), and take the multiset difference. Surviving pairs that share
// (part, kind, event) and bucket position are reported as CHANGED with the
// fields that differ, so a MOVE reads as a move rather than as an add and a
// remove. Warning counts are compared too: a rebuild that silently starts
// emitting a layout warning has changed something even if no item moved.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProveUnmoved = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PREC = 6;

  function canon(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? +v.toFixed(PREC) : String(v);
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object') {
      var o = {};
      Object.keys(v).sort().forEach(function (k) { o[k] = canon(v[k]); });
      return o;
    }
    return v;
  }

  // one flat, comparable list of every drawn item, tagged with its part
  function flatten(model) {
    var out = [];
    (model.systems || []).forEach(function (s) {
      (s.items || []).forEach(function (it) {
        var c = canon(it);
        out.push({ part: s.part, k: it.k, ev: it.ev || null, str: JSON.stringify(c), item: c });
      });
    });
    return out;
  }

  function bucketKey(r) { return r.part + '|' + r.k + '|' + (r.ev || '-'); }

  function diff(beforeModel, afterModel) {
    var A = flatten(beforeModel), B = flatten(afterModel);

    var countB = new Map();
    B.forEach(function (r) { countB.set(r.str, (countB.get(r.str) || 0) + 1); });
    var removed = A.filter(function (r) {
      var n = countB.get(r.str) || 0;
      if (n > 0) { countB.set(r.str, n - 1); return false; }
      return true;
    });
    var countA = new Map();
    A.forEach(function (r) { countA.set(r.str, (countA.get(r.str) || 0) + 1); });
    var added = B.filter(function (r) {
      var n = countA.get(r.str) || 0;
      if (n > 0) { countA.set(r.str, n - 1); return false; }
      return true;
    });

    // pair survivors that share (part, kind, event): those are MOVES, not an
    // unrelated add plus remove. Sorted so the pairing is deterministic.
    var byKeyR = new Map();
    removed.forEach(function (r) {
      var k = bucketKey(r);
      if (!byKeyR.has(k)) byKeyR.set(k, []);
      byKeyR.get(k).push(r);
    });
    byKeyR.forEach(function (list) { list.sort(function (a, b) { return a.str < b.str ? -1 : 1; }); });

    var byKeyA = new Map();
    added.forEach(function (r) {
      var k = bucketKey(r);
      if (!byKeyA.has(k)) byKeyA.set(k, []);
      byKeyA.get(k).push(r);
    });

    var stillAdded = [], usedR = new Set(), changed = [];
    byKeyA.forEach(function (list, k) {
      list.sort(function (a, b) { return a.str < b.str ? -1 : 1; });
      var pool = byKeyR.get(k) || [];
      list.forEach(function (aRow, i) {
        if (i < pool.length) {
          var bRow = pool[i];
          usedR.add(bRow);
          var fields = [];
          var keys = new Set(Object.keys(aRow.item).concat(Object.keys(bRow.item)));
          keys.forEach(function (f) {
            if (JSON.stringify(aRow.item[f]) !== JSON.stringify(bRow.item[f]))
              fields.push(f + ': ' + JSON.stringify(bRow.item[f]) + ' -> ' + JSON.stringify(aRow.item[f]));
          });
          changed.push({ part: aRow.part, k: aRow.k, ev: aRow.ev, fields: fields });
        } else stillAdded.push(aRow);
      });
    });
    var stillRemoved = removed.filter(function (r) { return !usedR.has(r); });

    return {
      beforeCount: A.length,
      afterCount: B.length,
      added: stillAdded,
      removed: stillRemoved,
      changed: changed,
      warningsBefore: (beforeModel.warnings || []).length,
      warningsAfter: (afterModel.warnings || []).length,
      warningsNew: (afterModel.warnings || []).filter(function (w) { return (beforeModel.warnings || []).indexOf(w) < 0; }),
      warningsGone: (beforeModel.warnings || []).filter(function (w) { return (afterModel.warnings || []).indexOf(w) < 0; })
    };
  }

  // clean = nothing already on the page moved. Additions are allowed and
  // counted; a REMOVE or a CHANGE is never silent.
  function isClean(d, expectAdded) {
    if (d.removed.length || d.changed.length) return false;
    if (expectAdded != null && d.added.length !== expectAdded) return false;
    return true;
  }

  // CONFINEMENT — the claim a targeted rebuild actually needs to make.
  //
  // isClean() asks "did anything change?", which is the right question for a
  // FOLD (day 34: a rename must move nothing). It is the wrong question for an
  // ADDITION, and the golden caught why. Writing --ringFromBrick onto the ord
  // long tone at 48.05 ADDS ten ring bars, because ord has no ringBar in the
  // registry and there was nothing there before. Writing the same flag onto
  // the fortepiano/cuivre blast at 40.93 CHANGES ten ring bars, because those
  // techniques already draw one and the flag only re-sizes it from the sample
  // length to the drawn brick. Same instruction, same material class, two
  // different diffs — and "ADDED 10 / REMOVED 0 / CHANGED 0", the shape of the
  // day-35 hand-rolled proof, is true of only one of them.
  //
  // So the claim is CONFINEMENT, not stillness: every added, removed or
  // changed item belongs to an event this operation was aimed at, and nothing
  // else on the page moved at all. That is the sentence the composer plans
  // around, and it holds for both cases.
  function confine(d, allowedEvents) {
    var allow = allowedEvents instanceof Set ? allowedEvents : new Set(allowedEvents || []);
    var outside = { added: [], removed: [], changed: [] };
    d.added.forEach(function (r) { if (!allow.has(r.ev)) outside.added.push(r); });
    d.removed.forEach(function (r) { if (!allow.has(r.ev)) outside.removed.push(r); });
    d.changed.forEach(function (c) { if (!allow.has(c.ev)) outside.changed.push(c); });
    outside.total = outside.added.length + outside.removed.length + outside.changed.length;
    // a warning that names an event outside the target is also a spill
    outside.warnings = (d.warningsNew || []).filter(function (w) {
      var m = String(w).match(/ev-[A-Za-z0-9_-]+/);
      return !m || !allow.has(m[0]);
    });
    return outside;
  }

  function summariseConfined(d, outside) {
    var L = [];
    L.push('    inside the target:  added ' + (d.added.length - outside.added.length) +
      ' / changed ' + (d.changed.length - outside.changed.length) +
      ' / removed ' + (d.removed.length - outside.removed.length));
    L.push('    OUTSIDE the target: added ' + outside.added.length +
      ' / changed ' + outside.changed.length +
      ' / removed ' + outside.removed.length +
      (outside.total === 0 ? '   <- nothing else on the page moved' : '   <- SPILL'));
    outside.added.concat(outside.removed).slice(0, 6).forEach(function (r) {
      L.push('      T' + (r.part + 1) + ' ' + r.k + ' ' + (r.ev || '') + ' ' + r.str.slice(0, 100));
    });
    outside.changed.slice(0, 6).forEach(function (c) {
      L.push('      T' + (c.part + 1) + ' ' + c.k + ' ' + (c.ev || '') + '  ' + c.fields.join('; ').slice(0, 120));
    });
    if (outside.warnings.length)
      L.push('    NEW WARNINGS outside the target: ' + outside.warnings.length);
    return L.join('\n');
  }

  function summarise(d, expectAdded) {
    var L = [];
    L.push('  page items ' + d.beforeCount + ' -> ' + d.afterCount +
      '   ADDED ' + d.added.length + ' / REMOVED ' + d.removed.length + ' / CHANGED ' + d.changed.length);
    var kinds = {};
    d.added.forEach(function (r) {
      var key = r.k + (r.item.t0 != null ? ' @' + r.item.t0 : (r.item.t != null ? ' @' + r.item.t : ''));
      kinds[key] = (kinds[key] || 0) + 1;
    });
    var kk = Object.keys(kinds);
    if (kk.length) L.push('    added: ' + kk.slice(0, 8).map(function (k) { return kinds[k] + 'x ' + k; }).join(', ') + (kk.length > 8 ? ', ...' : ''));
    d.removed.slice(0, 8).forEach(function (r) {
      L.push('    REMOVED  T' + (r.part + 1) + ' ' + r.k + ' ' + (r.ev || '') + '  ' + r.str.slice(0, 120));
    });
    if (d.removed.length > 8) L.push('    ... and ' + (d.removed.length - 8) + ' more removed.');
    d.changed.slice(0, 8).forEach(function (c) {
      L.push('    CHANGED  T' + (c.part + 1) + ' ' + c.k + ' ' + (c.ev || '') + '  ' + c.fields.join('; ').slice(0, 160));
    });
    if (d.changed.length > 8) L.push('    ... and ' + (d.changed.length - 8) + ' more changed.');
    L.push('    warnings ' + d.warningsBefore + ' -> ' + d.warningsAfter +
      (d.warningsNew.length ? '  (NEW: ' + d.warningsNew.length + ')' : '') +
      (d.warningsGone.length ? '  (gone: ' + d.warningsGone.length + ')' : ''));
    d.warningsNew.slice(0, 5).forEach(function (w) { L.push('      NEW WARNING: ' + w); });
    if (expectAdded != null && d.added.length !== expectAdded)
      L.push('    EXPECTED ' + expectAdded + ' added, got ' + d.added.length + '.');
    return L.join('\n');
  }

  return {
    diff: diff, isClean: isClean, summarise: summarise, flatten: flatten, canon: canon,
    confine: confine, summariseConfined: summariseConfined
  };
}));
