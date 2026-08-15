// int2_harmonies.js — INT2 blast-harmony working file (composer 2026-08-14).
// SINGLE SOURCE: voicings live in bank/blast_taxonomy.json. This tool
//   1. computes the standing voicings per chord — V1 (as played) and
//      V2 (ten-note octave-displaced, max-spread),
//   2. keeps any EXTRA voicings already filed in the taxonomy (V3, V4 …),
//   3. writes the pitches back into the taxonomy (so the chord viewer and the
//      score always agree), and
//   4. renders scores/int2-harmonies.json — every voicing of every chord, in
//      order, with wide gaps left for more variants.
// Add a voicing by editing EXTRA below (or the taxonomy) and re-running.

const fs = require('fs');

const CHORDS = ['03', '04', '11', '12', '13', '16', '28'];
const ORD_LO = 30, ORD_HI = 65, PARTS = 10;
const GAP = 3, CHORD_GAP = 7;
const TAX_PATH = 'bank/blast_taxonomy.json';

// composer-dictated extra voicings: chord -> { V#: {desc, pitches} }
const EXTRA = {
  '28': {
    V3: { desc: 'as played, A#1 up an octave (34 -> 46)', pitches: [30, 41, 46, 60, 61, 62] },
  },
};

const tenNote = uniq => {
  const have = new Set(uniq.filter(p => p >= ORD_LO && p <= ORD_HI));
  const srcOf = {};
  uniq.forEach(p => { for (let d = -36; d <= 36; d += 12) {
    const q = p + d;
    if (q >= ORD_LO && q <= ORD_HI && !srcOf[q]) srcOf[q] = p;
  } });
  const cands = () => Object.keys(srcOf).map(Number).filter(q => !have.has(q));
  while (have.size < PARTS && cands().length) {
    let best = null, bs = -1;
    for (const q of cands()) {
      const d = Math.min(...[...have].map(h => Math.abs(h - q)));
      if (d > bs) { bs = d; best = q; }
    }
    have.add(best);
  }
  return { pitches: [...have].sort((a, b) => a - b), srcOf };
};

const tax = JSON.parse(fs.readFileSync(TAX_PATH, 'utf8'));
let nid = 1; const objs = []; let cursor = 3;

CHORDS.forEach(id => {
  const key = 'VERT01-' + id;
  const b = JSON.parse(fs.readFileSync('bank/' + key + '.json', 'utf8'));
  const uniq = b.pitches.slice().sort((a, c) => a - c);
  const velOf = p => (b.velocities[p] != null ? b.velocities[p] : 100);
  const hold = b.spanSec;
  const over = uniq.filter(p => p > ORD_HI || p < ORD_LO);
  const { pitches: tens, srcOf } = tenNote(uniq);

  const voicings = {
    V1: { desc: 'as played (' + uniq.length + ' pitches)' + (over.length ? '; ' + over.join(',') + ' above ord' : ''), pitches: uniq },
    V2: { desc: 'ten-note octave-displaced, max-spread', pitches: tens },
  };
  // keep anything already filed, then apply this run's dictated extras
  const filed = (tax.harmonies[key] && tax.harmonies[key].voicings) || {};
  Object.entries(filed).forEach(([v, o]) => { if (!voicings[v] && o.pitches) voicings[v] = o; });
  Object.entries(EXTRA[id] || {}).forEach(([v, o]) => { voicings[v] = o; });

  Object.entries(voicings).forEach(([vname, v]) => {
    const pitches = v.pitches.slice().sort((a, c) => a - c);
    const shown = pitches.length > PARTS
      ? pitches.slice().sort((a, c) => velOf(c) - velOf(a)).slice(0, PARTS).sort((a, c) => a - c)
      : pitches;
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
      label: key + ' · ' + vname + ' ' + v.desc, color: '#AD5F2A', performanceNotes: '', properties: {} });
    shown.forEach((p, k) => {
      const src = uniq.includes(p) ? p : (srcOf[p] || (p - 12 >= ORD_LO ? p - 12 : uniq[0]));
      const lv = Math.max(1, Math.round((velOf(src) / 127) * 100) / 10);
      objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: PARTS - 1 - k,
        startSeconds: +cursor.toFixed(3), endSeconds: +(cursor + hold).toFixed(3),
        nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
        segments: [{ model: 'power', slope: 0 }],
        color: '#455A64', fillMode: 'bottom', opacity: 0.55,
        performanceNotes: key + ' ' + vname, properties: {},
        sonifyNote: p, technique: 'ord', sonifyMode: 'plain', recVel: velOf(src) });
    });
    v.hear = 'int2-harmonies @ ' + cursor.toFixed(1) + 's';
    cursor += hold + GAP;
  });
  cursor += CHORD_GAP - GAP;

  tax.harmonies[key] = tax.harmonies[key] || { realizations: [] };
  tax.harmonies[key].voicings = voicings;
  console.log(key + ':', Object.keys(voicings).join(', '));
});

fs.writeFileSync(TAX_PATH, JSON.stringify(tax, null, 2));
const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/int2-harmonies.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('int2-harmonies:', (cursor / 60).toFixed(1), 'min |',
  objs.filter(o => o.type === 'waveCurve').length, 'notes | taxonomy updated');
