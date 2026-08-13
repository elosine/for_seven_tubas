// make_playable.js — reorganize a played take (composer 2026-08-13):
//   SEG A: the played notes verbatim, redistributed across 10 parts causally,
//          thinned ONLY where physically impossible (re-artic law).
//   SEG B: the composer's envelope strategy — played onsets become surge APEXES
//          (peak-anchored, back-calculated); surge duration is capped by local
//          density and available back-span; below a minimum the note renders as
//          the played staccato instead. The surge->staccato crossfade EMERGES
//          from density + physics (no probability dial).
// Usage: node tools/make_playable.js scores/A1-5.json

const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260813);

const REARTIC = 0.08, PARTS = 10;
const MIN_SURGE = 0.5, MAX_SURGE = 3.5, DENS_CAP = 2.5;  // surgeDur <= DENS_CAP / localRate
const ORD_LO = 30, ORD_HI = 65;

const scorePath = process.argv[2] || 'scores/A1-5.json';
const name = path.basename(scorePath, '.json');
const raw = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const data = raw.data || raw;
const played = data.objects
  .filter(o => o.type === 'waveCurve' && o.sonifyNote != null)
  .map(o => ({
    on: o.startSeconds, off: o.endSeconds, pitch: o.sonifyNote,
    vel: o.recVel != null ? o.recVel : Math.round((Math.max(...o.nodes.map(n => n.y)) / 10) * 127),
  }))
  .sort((a, b) => a.on - b.on);
const t0 = played[0].on;
const span = played[played.length - 1].on - t0;

// local aggregate rate (3 s window) from the played onsets
const localRate = t => played.filter(n => Math.abs(n.on - t) <= 1.5).length / 3;

let nid = 1;
const objs = [];
const mkStac = (ev, tOff, tag) => {
  const lv = Math.max(1, Math.round((ev.vel / 127) * 100) / 10);
  objs.push({
    id: 'wc-' + (nid++), type: 'waveCurve', layer: ev.part,
    startSeconds: Math.round((ev.on + tOff) * 1000) / 1000,
    endSeconds: Math.round((ev.off + tOff) * 1000) / 1000,
    nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
    segments: [{ model: 'power', slope: 0 }],
    color: '#607D8B', fillMode: 'bottom', opacity: 0.55, performanceNotes: tag, properties: {},
    sonifyNote: ev.pitch, technique: 'staccato', sonifyMode: 'plain', recVel: ev.vel,
  });
};
const mkSurge = (apexAbs, dur, release, part, pitch, vel, tag) => {
  // apex loudness: high band (8.5-10 -> about -8.7..0 dB via the CC7 law) so
  // surges sit level with the full-volume staccatos; velocity tints within it
  const lv = Math.round((8.5 + 1.5 * (vel / 127)) * 10) / 10;
  const p = Math.round((dur / (dur + release)) * 1000) / 1000;
  objs.push({
    id: 'wc-' + (nid++), type: 'waveCurve', layer: part,
    startSeconds: Math.round((apexAbs - dur) * 1000) / 1000,
    endSeconds: Math.round((apexAbs + release) * 1000) / 1000,
    nodes: [{ pos: 0, y: 0, smooth: 0.25 }, { pos: p, y: lv, smooth: 0.25 }, { pos: 1, y: 0, smooth: 0.25 }],
    segments: [{ model: 'exponential', slope: 0.35 }, { model: 'power', slope: 0 }],
    color: '#2E7D32', fillMode: 'bottom', opacity: 0.4, performanceNotes: tag, properties: {},
    sonifyNote: Math.max(ORD_LO, Math.min(ORD_HI, pitch)), technique: 'ord', envShape: 'surge',
  });
};

// ---- SEG A: verbatim, redistributed, thinned only where impossible ----
const segAoff = 2 - t0;
{
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let thinned = 0;
  for (const n of played) {
    const feas = [];
    for (let p = 0; p < PARTS; p++) if (n.on >= lastEnd[p] + REARTIC) feas.push(p);
    if (!feas.length) { thinned++; continue; }
    const part = feas[Math.floor(rand() * feas.length)];
    lastEnd[part] = n.off;
    mkStac({ ...n, part }, segAoff, 'PLAY-A');
  }
  console.log('SEG A (verbatim/10 parts): placed', played.length - thinned, 'thinned', thinned);
}

// ---- SEG B: surge apexes -> density crossfade -> staccato ----
const segBoff = 2 + span + 8 - t0;
{
  const lastEnd = new Array(PARTS).fill(-Infinity);
  let surges = 0, stacs = 0, thinned = 0;
  for (const n of played) {
    const d = Math.max(0.2, localRate(n.on));
    const release = 0.02 + rand() * 0.06;
    const apexAbs = n.on + segBoff;
    // widest feasible back-span across parts (peak-anchored)
    let bestPart = -1, bestAvail = -Infinity;
    const feasNow = [];
    for (let p = 0; p < PARTS; p++) {
      const avail = apexAbs - (lastEnd[p] + REARTIC);
      if (avail > bestAvail) { bestAvail = avail; bestPart = p; }
      if (avail >= 0) feasNow.push(p);
    }
    const durCap = Math.min(MAX_SURGE, DENS_CAP / d, bestAvail);
    if (durCap >= MIN_SURGE) {
      const dur = Math.max(MIN_SURGE, durCap * (0.7 + rand() * 0.3));
      lastEnd[bestPart] = apexAbs + release;
      mkSurge(apexAbs, Math.min(dur, bestAvail), release, bestPart, n.pitch, n.vel, 'PLAY-B');
      surges++;
    } else if (feasNow.length) {
      const part = feasNow[Math.floor(rand() * feasNow.length)];
      lastEnd[part] = apexAbs + (n.off - n.on);
      mkStac({ ...n, part }, segBoff, 'PLAY-B');
      stacs++;
    } else { thinned++; }
  }
  console.log('SEG B (envelope strategy): surges', surges, 'staccato', stacs, 'thinned', thinned);
}

const out = {
  version: 1, layoutVersion: 2, tracks: data.tracks,
  assets: {}, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid,
};
const outPath = 'scores/' + name + '-playable.json';
fs.writeFileSync(outPath, JSON.stringify(out));
console.log('written:', outPath, '| SEG A at 2s, SEG B at', (2 + span + 8).toFixed(0) + 's');
