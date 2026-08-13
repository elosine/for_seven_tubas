// transform_fp.js — composer 2026-08-13, applied to A1-5-fp_cres:
//  - their G-converted surges preserved untouched (pinned to their lanes)
//  - 25-30 s = crossfade zone: P(staccato) ramps 0 -> 1 (fp before, stac after)
//  - fortepiano durations x3 target (>= x2 when possible), proportions kept;
//    parts redistributed to absorb collisions (surge spans respected)
// Usage: node tools/transform_fp.js scores/A1-5-fp_cres.json

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
const rand = mulberry32(20260814);
const REARTIC = 0.08, PARTS = 10;
const FADE_LO = 25, FADE_HI = 30, SCALE = 3, SCALE_MIN = 2;

const scorePath = process.argv[2] || 'scores/A1-5-fp_cres.json';
const raw = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const data = raw.data || raw;
const keep = [];      // surges + anything non-plain: untouched
const plain = [];
for (const o of data.objects) {
  if (o.type === 'waveCurve' && o.sonifyNote != null && o.sonifyMode === 'plain') plain.push(o);
  else keep.push(o);
}
plain.sort((a, b) => a.startSeconds - b.startSeconds);

// surge intervals per lane (pinned obstacles)
const surgeIv = Array.from({ length: PARTS }, () => []);
keep.forEach(o => {
  if (o.type === 'waveCurve' && o.sonifyNote != null && o.layer < PARTS) {
    surgeIv[o.layer].push([o.startSeconds - REARTIC, o.endSeconds + REARTIC]);
  }
});
const collides = (lane, on, off) => surgeIv[lane].some(([a, b]) => on < b && off > a);
const capBeforeNextSurge = (lane, on, dur) => {
  let cap = dur;
  for (const [a] of surgeIv[lane]) if (a > on) cap = Math.min(cap, a - on);
  return cap;
};

let nid = data.nextId || 1;
const lastEnd = new Array(PARTS).fill(-Infinity);
const out = [];
let fpN = 0, stN = 0, fullScale = 0, partScale = 0, thinned = 0;

for (const o of plain) {
  const on = o.startSeconds;
  const dur0 = o.endSeconds - o.startSeconds;
  // technique by crossfade zone
  let useStac;
  if (on < FADE_LO) useStac = false;
  else if (on >= FADE_HI) useStac = true;
  else useStac = rand() < (on - FADE_LO) / (FADE_HI - FADE_LO);
  const desired = useStac ? dur0 : dur0 * SCALE;
  const minKeep = useStac ? dur0 : dur0 * SCALE_MIN;
  // find a part: prefer full desired, else best available
  let bestPart = -1, bestAvail = -Infinity, fullPart = -1;
  const order = Array.from({ length: PARTS }, (_, i) => i).sort(() => rand() - 0.5);
  for (const p of order) {
    if (on < lastEnd[p] + REARTIC) continue;
    let avail = capBeforeNextSurge(p, on, desired + 1);
    if (collides(p, on, on + 0.01)) continue;
    if (avail > bestAvail) { bestAvail = avail; bestPart = p; }
    if (avail >= desired && fullPart < 0) fullPart = p;
  }
  if (bestPart < 0) { thinned++; continue; }
  const part = fullPart >= 0 ? fullPart : bestPart;
  const avail = fullPart >= 0 ? desired : Math.max(0.1, bestAvail - 0.02);
  let dur = Math.min(desired, avail);
  if (!useStac) {
    if (dur >= desired - 1e-6) fullScale++;
    else { dur = Math.max(Math.min(minKeep, avail), Math.min(dur0, avail)); partScale++; }
  }
  lastEnd[part] = on + dur;
  if (useStac) stN++; else fpN++;
  out.push({
    ...o, id: 'wc-' + (nid++), layer: part,
    endSeconds: Math.round((on + dur) * 1000) / 1000,
    technique: useStac ? 'staccato' : 'fortepiano',
    color: useStac ? '#607D8B' : '#8D6E63',
    performanceNotes: useStac ? 'STAC' : 'FP3x',
  });
}

const result = {
  ...data,
  objects: keep.concat(out),
  nextId: nid,
  metadata: { created: data.metadata?.created, modified: new Date().toISOString() },
};
const outPath = scorePath.replace(/\.json$/, '-2.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log('kept untouched:', keep.filter(o => o.sonifyNote != null).length, 'surges/other');
console.log('fp (x3 target):', fpN, '(full-scale', fullScale, '/ clamped', partScale + ')', '| staccato:', stN, '| thinned:', thinned);
console.log('written:', outPath);
