// int2_harmonies.js — composer 2026-08-14 (INT2 blast-harmony working file):
// collect VERT01 chords 03, 04, 11, 12, 13, 16, 28 into scores/int2-harmonies:
// per chord, the two existing versions — v1 AS PLAYED (low pitch -> bottom
// lane) and v2 TEN-NOTE octave-displaced (max-spread greedy, 30-65) — with a
// wide gap after each pair so the composer can add further variants in place.

const fs = require('fs');

const CHORDS = ['03', '04', '11', '12', '13', '16', '28'];
const ORD_LO = 30, ORD_HI = 65, PARTS = 10;
const PAIR_GAP = 3, CHORD_GAP = 8;   // room to add variants per chord

let nid = 1; const objs = []; let cursor = 3;

CHORDS.forEach(id => {
  const b = JSON.parse(fs.readFileSync('bank/VERT01-' + id + '.json', 'utf8'));
  const uniq = b.pitches.slice().sort((x, y) => x - y);
  const velOf = p => b.velocities[p] != null ? b.velocities[p] : 100;
  const hold = b.spanSec;
  const over = uniq.filter(p => p > ORD_HI || p < ORD_LO);

  const place = (label, pitches, srcOfP) => {
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
      label, color: '#AD5F2A', performanceNotes: '', properties: {} });
    pitches.forEach((p, k) => {
      const src = srcOfP ? srcOfP(p) : p;
      const lv = Math.max(1, Math.round((velOf(src) / 127) * 100) / 10);
      objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: PARTS - 1 - k,
        startSeconds: +cursor.toFixed(3), endSeconds: +(cursor + hold).toFixed(3),
        nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
        segments: [{ model: 'power', slope: 0 }],
        color: '#455A64', fillMode: 'bottom', opacity: 0.55,
        performanceNotes: 'VERT01-' + id, properties: {},
        sonifyNote: p, technique: 'ord', sonifyMode: 'plain', recVel: velOf(src) });
    });
  };

  // v1 as played (truth — out-of-ord notes kept, flagged in the label)
  const placed1 = uniq.length > PARTS
    ? uniq.slice().sort((a, c) => velOf(c) - velOf(a)).slice(0, PARTS).sort((a, c) => a - c)
    : uniq;
  place('VERT01-' + id + ' · v1 played (' + uniq.length + ')' + (over.length ? ' [>ord: ' + over.join(',') + ']' : ''), placed1);
  cursor += hold + PAIR_GAP;

  // v2 ten-note octave-displaced, max-min-spread greedy (vert_bank rule)
  const have = new Set(uniq.filter(p => p >= ORD_LO && p <= ORD_HI));
  const srcOf = {};
  uniq.forEach(p => { for (let d = -36; d <= 36; d += 12) {
    const q = p + d;
    if (q >= ORD_LO && q <= ORD_HI && !srcOf[q]) srcOf[q] = p;
  } });
  const cands = () => Object.keys(srcOf).map(Number).filter(q => !have.has(q));
  while (have.size < PARTS && cands().length) {
    let best = null, bestScore = -1;
    for (const q of cands()) {
      const dmin = Math.min(...[...have].map(h => Math.abs(h - q)));
      if (dmin > bestScore) { bestScore = dmin; best = q; }
    }
    have.add(best);
  }
  const tens = [...have].sort((a, c) => a - c);
  place('VERT01-' + id + ' · v2 ten-note (' + tens.length + ')', tens,
    p => uniq.includes(p) ? p : (srcOf[p] || uniq[0]));
  cursor += hold + CHORD_GAP;
});

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
fs.writeFileSync('scores/int2-harmonies.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('int2-harmonies:', CHORDS.length, 'chords x v1/v2,', (cursor / 60).toFixed(1), 'min,',
  objs.filter(o => o.type === 'waveCurve').length, 'notes');
