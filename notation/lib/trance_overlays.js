// trance_overlays.js — the trance section's notation, as overlays (day 35).
//
// The composer's dictation:
//   · every note a QUARTER NOTE — no flagged stems — except the long held tones
//   · the long held tones are the FORTEPIANOS, drawn as they always have been
//   · no text anywhere in the section (the score's beat numbers and structural
//     labels are working marks, not notation)
//   · a BAR LINE at every new tempo, a medium space left of the bar's leftmost
//     ink, with the tempo stated once at the top to one decimal place
//   · the end crescendos take the SURGE shape (curve + ppp -> arrow -> fff)
//   · the bouncing ball stays
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TranceOverlays = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const LONG = 0.5;          // at/above this a note is a HELD TONE, not a quarter
  const SWELL = 2.0;         // an ord note this long is one of the end crescendos
  const MIN_PARTS = 6;       // parts that must agree before a stretch is 'unison'

  // The tempo of a stretch is its modal inter-onset interval. Sections where the
  // parts disagree (the multitempo and phase-shift passages) return null — they
  // have no single tempo to state, and get no bar line.
  function tempoOf(notes, t0, t1) {
    const per = [];
    for (let L = 0; L < 10; L++) {
      const a = notes.filter(o => o.layer === L && o.startSeconds >= t0 - 1e-6 && o.startSeconds < t1)
        .sort((x, y) => x.startSeconds - y.startSeconds);
      if (a.length < 3) continue;
      const io = {};
      for (let k = 0; k < a.length - 1; k++) { const d = +(a[k + 1].startSeconds - a[k].startSeconds).toFixed(2); io[d] = (io[d] || 0) + 1; }
      const best = Object.keys(io).map(Number).sort((x, y) => io[y] - io[x])[0];
      if (best > 0) per.push(+(60 / best).toFixed(1));
    }
    // A stretch counts as UNISON only when most of the ensemble is actually in
    // it and every contributing part agrees. Without the part-count floor, a
    // transitional passage in which only two parts have enough notes to measure
    // would be called a unison tempo and get a bar line it has not earned —
    // which is exactly what happened at 534.23 and 593.43 (both multitempo).
    if (per.length < MIN_PARTS) return null;
    const uniq = [...new Set(per)];
    return uniq.length === 1 ? uniq[0] : null;
  }

  function build(objects, groupId, parts, idBase) {
    const all = objects.filter(o => o.groupId === groupId && o.type === 'waveCurve' && o.layer < 10
      && (!parts || !parts.length || parts.indexOf(o.layer) >= 0));
    if (!all.length) return null;
    const marks = objects.filter(o => o.groupId === groupId && o.type === 'marker')
      .sort((a, b) => a.time - b.time);
    const structural = marks.filter(m => !/^\d+$/.test(String(m.label || '').trim()));
    const pfx = idBase || 'tr';
    const overlays = [];

    // ---- the notes
    let quarters = 0, held = 0, swells = 0;
    all.forEach((o, i) => {
      const len = o.endSeconds - o.startSeconds;
      const dev = {};
      if (o.technique === 'staccato' || (len < LONG && o.technique !== 'fortepiano')) {
        // QUARTER NOTES: a plain stem, no flag. `nhStem:'plain'` is the day-23
        // vocabulary; the staccato dot stays because it is articulation, not
        // note value, and the composer asked only about the stems.
        dev.nhStem = 'plain';
        dev.brick = false;          // the drawn note IS the notation here
        quarters++;
      } else if (o.technique === 'ord' && len >= SWELL) {
        // THE END CRESCENDOS: the surge device — curve, go line, nh-unit, and
        // the ppp -> arrow -> fff pair. Set as device fields rather than by
        // changing the sounding envelope, so the notation says surge without
        // the score's audio moving.
        dev.curve = true; dev.cut = true; dev.goLine = true; dev.nhUnit = true;
        dev.dynPair = true; dev.dynMark = false; dev.brick = false;
        swells++;
      } else {
        held++;                                     // fortepianos and the rest: unchanged
        return;
      }
      overlays.push({ id: 'ov-' + pfx + '-n' + i, kind: 'engraving',
        target: { event: 'ev-' + o.id }, value: { device: dev }, provenance: 'authored' });
    });

    // ---- the tempo bar lines, one per stretch whose parts agree
    const tempi = [];
    for (let i = 0; i < structural.length; i++) {
      const t0 = structural[i].time;
      const t1 = (i + 1 < structural.length) ? structural[i + 1].time : 1e9;
      const bpm = tempoOf(all, t0, t1);
      if (bpm == null) continue;
      if (tempi.length && Math.abs(tempi[tempi.length - 1].bpm - bpm) < 0.05) continue;  // same tempo, no new bar
      tempi.push({ t: t0, bpm });
    }
    tempi.forEach((tp, i) => overlays.push({ id: 'ov-' + pfx + '-tempo-' + i, kind: 'tempo',
      target: { t: tp.t }, value: { bpm: tp.bpm }, provenance: 'authored' }));

    return { overlays, quarters, held, swells, tempi, structural: structural.length,
             beatMarks: marks.length - structural.length };
  }

  return { build, tempoOf, LONG, SWELL };
}));
