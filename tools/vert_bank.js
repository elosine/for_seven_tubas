// vert_bank.js — bank vertical_shapes_01: 33 chords -> entities VERT01-01..33,
// plus scores/vert01-versions:
//   v1 "as played": notes distributed one-per-part, low pitch -> low lane
//     (bottom of the score); chords > 10 notes FLAGGED, 10 loudest placed.
//   v2 "10-note": octave displacements of the played pitch material (within ord
//     30-65) fill to 10 unique frequencies, max-min spread greedy; displaced
//     notes inherit their source note's velocity.
// Usage: node tools/vert_bank.js

const fs = require('fs');
const ORD_LO = 30, ORD_HI = 65, PARTS = 10;

const raw = JSON.parse(fs.readFileSync('scores/vertical_shapes_01.json', 'utf8'));
const data = raw.data || raw;
const notes = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({
    on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : 100,
  }))
  .sort((a, b) => a.on - b.on);

// chord grouping: onset gap > 1.0 s = new chord
const chords = [];
let cur = [notes[0]];
for (let i = 1; i < notes.length; i++) {
  if (notes[i].on - cur[cur.length - 1].on > 1.0) { chords.push(cur); cur = []; }
  cur.push(notes[i]);
}
chords.push(cur);

fs.mkdirSync('bank', { recursive: true });
let nid = 1;
const objs = [];
let cursor = 2;
const flags = [];

chords.forEach((ch, i) => {
  const id = 'VERT01-' + String(i + 1).padStart(2, '0');
  const t0 = Math.min(...ch.map(n => n.on));
  const hold = Math.max(...ch.map(n => n.off)) - t0;
  const uniq = [...new Set(ch.map(n => n.pitch))].sort((a, b) => a - b);
  const overRange = uniq.filter(p => p > ORD_HI || p < ORD_LO);
  const velOf = p => Math.max(...ch.filter(n => n.pitch === p).map(n => n.vel));

  fs.writeFileSync('bank/' + id + '.json', JSON.stringify({
    entity: id, source: 'scores/vertical_shapes_01.json', kind: 'vertical-chord',
    created: new Date().toISOString(), spanSec: +hold.toFixed(2),
    pitches: uniq, velocities: Object.fromEntries(uniq.map(p => [p, velOf(p)])),
    notes: ch.map(n => ({ on: +(n.on - t0).toFixed(3), off: +(n.off - t0).toFixed(3), pitch: n.pitch, vel: n.vel })),
    flags: { exceedsTen: uniq.length > PARTS, aboveOrdRange: overRange },
  }, null, 1));

  let label = id + ' (' + uniq.length + ' pitches)';
  if (uniq.length > PARTS) { label += ' EXCEEDS 10'; flags.push(id + ': ' + uniq.length + ' pitches — composer to redact or promote to >10-player version'); }
  if (overRange.length) flags.push(id + ': above ord F4 — ' + overRange.join(','));

  // v1: as played, one note per part, low pitch -> bottom lane
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
    label: label + ' · v1 played', color: '#AD5F2A', performanceNotes: '', properties: {} });
  const placed = uniq.length > PARTS
    ? uniq.slice().sort((a, b) => velOf(b) - velOf(a)).slice(0, PARTS).sort((a, b) => a - b)
    : uniq;
  placed.forEach((p, k) => {
    const lv = Math.max(1, Math.round((velOf(p) / 127) * 100) / 10);
    objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: PARTS - 1 - k,
      startSeconds: +cursor.toFixed(3), endSeconds: +(cursor + hold).toFixed(3),
      nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
      segments: [{ model: 'power', slope: 0 }],
      color: '#455A64', fillMode: 'bottom', opacity: 0.55, performanceNotes: id + ' v1', properties: {},
      sonifyNote: p, technique: 'ord', sonifyMode: 'plain', recVel: velOf(p) });
  });
  cursor += hold + 2.5;

  // v2: 10 unique frequencies via octave displacement (only when playable set <= 10)
  if (uniq.length <= PARTS) {
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
    const tens = [...have].sort((a, b) => a - b);
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
      label: id + ' v2 ten-note (' + tens.length + ')', color: '#7B1FA2', performanceNotes: '', properties: {} });
    tens.forEach((p, k) => {
      const src = uniq.includes(p) ? p : (srcOf[p] || uniq[0]);
      const lv = Math.max(1, Math.round((velOf(src) / 127) * 100) / 10);
      objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: PARTS - 1 - k,
        startSeconds: +cursor.toFixed(3), endSeconds: +(cursor + hold).toFixed(3),
        nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
        segments: [{ model: 'power', slope: 0 }],
        color: '#6A4FA3', fillMode: 'bottom', opacity: 0.55, performanceNotes: id + ' v2', properties: {},
        sonifyNote: p, technique: 'ord', sonifyMode: 'plain', recVel: velOf(src) });
    });
    cursor += hold + 2.5;
  }
});

fs.writeFileSync('scores/vert01-versions.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));

console.log('banked:', chords.length, 'chords (VERT01-01..' + String(chords.length).padStart(2, '0') + ')');
console.log('score: vert01-versions (' + (cursor / 60).toFixed(1) + ' min)');
console.log('FLAGS:');
flags.forEach(f => console.log(' ', f));
