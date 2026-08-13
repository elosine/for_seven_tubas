// a2_fp_cres.js — composer dictation 2026-08-13: give A2-hp-whole (the human
// take, 129 staccato notes, 1.7-32.4s) the A1 treatment:
//   - dense tail (>= ~27s, where the rate jumps toward 13/s): ALL staccato
//   - crossfade zone 22-27s: fp probability ramps 0.5 -> 0
//   - beginning (< 22s): 50% become FORTEPIANO
//   - every fp note: duration x3 (proportions preserved)
//   - redistributed over 10 tracks (re-artic 0.08s, rotation preference)
// Output: scores/A2-fp_cres.json

const fs = require('fs');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260822);
const REARTIC = 0.08, PARTS = 10;
const XFADE = [22, 27], P_FP = 0.5, DUR_MULT = 3;

const d = JSON.parse(fs.readFileSync('scores/A2-hp-whole.json', 'utf8'));
const data = d.data || d;
const src = data.objects.filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({ on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : 100 }))
  .sort((a, b) => a.on - b.on);

let nFp = 0;
const treated = src.map(n => {
  let pFp = 0;
  if (n.on < XFADE[0]) pFp = P_FP;
  else if (n.on < XFADE[1]) pFp = P_FP * (1 - (n.on - XFADE[0]) / (XFADE[1] - XFADE[0]));
  const isFp = rand() < pFp;
  if (isFp) nFp++;
  const dur = (n.off - n.on) * (isFp ? DUR_MULT : 1);
  return { ...n, off: n.on + dur, technique: isFp ? 'fortepiano' : 'staccato' };
});

// 10-track redistribution, rotation preference
let nid = 1; const objs = []; let thinned = 0;
objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +(src[0].on).toFixed(2),
  label: 'A2 fp/stac crossfade (' + nFp + ' fp x' + DUR_MULT + ', xfade ' + XFADE.join('-') + 's)',
  color: '#AD5F2A', performanceNotes: '', properties: {} });
const lastEnd = new Array(PARTS).fill(-Infinity);
let prevPart = -1;
for (const n of treated) {
  const feas = [];
  for (let p = 0; p < PARTS; p++) if (n.on >= lastEnd[p] + REARTIC) feas.push(p);
  if (!feas.length) { thinned++; continue; }
  const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
  const part = pool[Math.floor(rand() * pool.length)];
  prevPart = part;
  lastEnd[part] = n.off;
  const lv = Math.max(1, Math.round((n.vel / 127) * 100) / 10);
  objs.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: part,
    startSeconds: +n.on.toFixed(3), endSeconds: +n.off.toFixed(3),
    nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
    segments: [{ model: 'power', slope: 0 }],
    color: n.technique === 'fortepiano' ? '#8D6E63' : '#607D8B',
    fillMode: 'bottom', opacity: 0.55,
    performanceNotes: 'A2 ' + n.technique, properties: {},
    sonifyNote: n.pitch, technique: n.technique, sonifyMode: 'plain', recVel: n.vel });
}

fs.writeFileSync('scores/A2-fp_cres.json', JSON.stringify({ version: 1, layoutVersion: 2,
  tracks: data.tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid }));
console.log('A2-fp_cres:', treated.length, 'notes |', nFp, 'fp (x' + DUR_MULT + ' dur) |',
  'xfade', XFADE.join('-') + 's | thinned', thinned);
