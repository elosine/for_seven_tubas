// harmony_audition.js — composer dictation 2026-08-13 (evening):
//  FILE 1 scores/harmony-blasts.json — every harmony in the palette as three
//   blasts in a row: staccato (short) / fortepiano (longer lane, natural decay)
//   / short ordinario. Small gaps (composer drags if too long).
//   Messiaen picks: mode 7 and mode 4 (anchored F#).
//  FILE 2 scores/pairs01.json — clusters x harmony "as written" (the pairing
//   ledger) + L2 auditioned in the four new 7-note chromatic clusters:
//   low / middle / high / bottom-7-pcs spread over full range (oct displace).

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
const rand = mulberry32(20260820);
const REARTIC = 0.08, PARTS = 10, LO = 30, HI = 65;
const pick = arr => arr[Math.floor(rand() * arr.length)];

const vertSet = id => JSON.parse(fs.readFileSync('bank/VERT01-' + id + '.json', 'utf8'))
  .pitches.filter(p => p >= LO && p <= HI);
const stack = (root, step) => { const s = []; for (let q = root; q <= HI; q += step) s.push(q); return s; };
const chroma = (a, b) => { const s = []; for (let p = a; p <= b; p++) s.push(p); return s; };

// place notes across LO-HI: pc coverage first, then max spread (targets evenly
// spaced; each target takes the closest unused-pc instance; +penalty on reuse)
function spreadPcs(pcs, count) {
  const targets = [];
  for (let k = 0; k < count; k++) targets.push(LO + (HI - LO) * (count === 1 ? 0.5 : k / (count - 1)));
  const chosen = [], remaining = pcs.slice();
  targets.forEach(t => {
    const pool = remaining.length ? remaining : pcs;
    let best = null, bestD = 1e9, bestPc = null;
    pool.forEach(pc => {
      for (let p = LO; p <= HI; p++) if (((p % 12) + 12) % 12 === pc) {
        const d = Math.abs(p - t) + (chosen.includes(p) ? 100 : 0);
        if (d < bestD) { bestD = d; best = p; bestPc = pc; }
      }
    });
    chosen.push(best);
    const i = remaining.indexOf(bestPc);
    if (i >= 0) remaining.splice(i, 1);
  });
  return [...new Set(chosen)].sort((a, b) => a - b);
}

const F = 6; // F# anchor
const mPcs = ivs => ivs.map(x => (x + F) % 12);
const M7 = mPcs([0, 1, 2, 3, 5, 6, 7, 8, 10, 11]);
const M4 = mPcs([0, 1, 2, 5, 6, 7, 8, 11]);
const BOT7_PCS = chroma(30, 36).map(p => p % 12);

const HARMONIES = []; // [name, pitches ascending]
['03', '04', '06', '07', '11', '12', '16', '23', '28', '33'].forEach(id =>
  HARMONIES.push(['VERT01-' + id, vertSet(id)]));
HARMONIES.push(['5ths root 30', stack(30, 7)]);
HARMONIES.push(['5ths root 37', stack(37, 7)]);
HARMONIES.push(['octaves F#', stack(30, 12)]);
HARMONIES.push(['octaves Bb', stack(34, 12)]);
HARMONIES.push(['BbE-2oct cluster', [...chroma(34, 40), ...chroma(58, 64)]]);
HARMONIES.push(['Messiaen m7 (F#)', spreadPcs(M7, 10)]);
HARMONIES.push(['Messiaen m4 (F#)', spreadPcs(M4, 10)]);
HARMONIES.push(['cluster low', chroma(30, 36)]);
HARMONIES.push(['cluster mid', chroma(44, 50)]);
HARMONIES.push(['cluster high', chroma(59, 65)]);
HARMONIES.push(['cluster spread', spreadPcs(BOT7_PCS, 7)]);
const byName = Object.fromEntries(HARMONIES);

const tracks = (raw => (raw.data || raw).tracks)(JSON.parse(fs.readFileSync('scores/cluster_samples_01.json', 'utf8')));
const shell = (objs, nid) => ({ version: 1, layoutVersion: 2, tracks, assets: {},
  metadata: { created: new Date().toISOString(), modified: new Date().toISOString() },
  objects: objs, markers: [], databases: { chordShapes: [], sets: [], cells: [] }, nextId: nid });
const note = (nid, layer, on, dur, pitch, tech, name, vel) => ({
  id: 'wc-' + nid, type: 'waveCurve', layer,
  startSeconds: +on.toFixed(3), endSeconds: +(on + dur).toFixed(3),
  nodes: [{ pos: 0, y: 9, smooth: 0.25 }, { pos: 1, y: 9, smooth: 0.25 }],
  segments: [{ model: 'power', slope: 0 }],
  color: '#607D8B', fillMode: 'bottom', opacity: 0.55,
  performanceNotes: name, properties: {},
  sonifyNote: pitch, technique: tech, sonifyMode: 'plain', recVel: vel });

// ---- FILE 1: harmony blasts ----
{
  let nid = 1; const objs = []; let t = 2;
  const BLASTS = [['staccato', 0.4], ['fortepiano', 3.5], ['ord', 0.8]];
  HARMONIES.forEach(([name, P]) => {
    const n = P.length;
    const tag = name + ' (' + n + (n > PARTS ? ' -> 10 of ' + n : '') + ')';
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +t.toFixed(2),
      label: tag + ' stac|fp|ord', color: '#AD5F2A', performanceNotes: '', properties: {} });
    BLASTS.forEach(([tech, dur]) => {
      for (let j = 0; j < PARTS; j++) {
        const p = P[Math.floor(j * n / PARTS)]; // even fill/sample, low -> bottom lane
        objs.push(note(nid++, PARTS - 1 - j, t, dur, p, tech, name + ' ' + tech, 112));
      }
      t += dur + 1.5;
    });
    t += 3;
  });
  fs.writeFileSync('scores/harmony-blasts.json', JSON.stringify(shell(objs, nid)));
  console.log('harmony-blasts:', HARMONIES.length, 'harmonies x stac/fp/ord,', (t / 60).toFixed(1), 'min');
}

// ---- FILE 2: cluster x harmony pairs as written ----
{
  const PAIRS = [
    ['B2', 'BbE-2oct cluster'],
    ['M', '5ths root 30'],
    ['L2', 'cluster low'],
    ['L2', 'cluster mid'],
    ['L2', 'cluster high'],
    ['L2', 'cluster spread'],
  ];
  let nid = 1; const objs = []; let cursor = 2;
  PAIRS.forEach(([cid, hname]) => {
    const ent = JSON.parse(fs.readFileSync('bank/CLUST01-' + cid + '.json', 'utf8'));
    const set = byName[hname];
    objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +cursor.toFixed(2),
      label: cid + ' x ' + hname, color: '#AD5F2A', performanceNotes: '', properties: {} });
    const lastEnd = new Array(PARTS).fill(-Infinity);
    let prevPart = -1;
    for (const n of ent.cleaned) {
      const onAbs = cursor + n.on;
      const feas = [];
      for (let p = 0; p < PARTS; p++) if (onAbs >= lastEnd[p] + REARTIC) feas.push(p);
      if (!feas.length) continue;
      const pool = feas.length > 1 ? feas.filter(p => p !== prevPart) : feas;
      const part = pool[Math.floor(rand() * pool.length)];
      prevPart = part;
      lastEnd[part] = onAbs + (n.off - n.on);
      const o = note(nid++, part, onAbs, n.off - n.on, pick(set), n.technique, cid + ' x ' + hname, n.vel);
      o.nodes.forEach(nd => nd.y = Math.max(1, Math.round((n.vel / 127) * 100) / 10));
      objs.push(o);
    }
    cursor += ent.spanSec + 4;
  });
  fs.writeFileSync('scores/pairs01.json', JSON.stringify(shell(objs, nid)));
  console.log('pairs01:', PAIRS.length, 'pairings,', (cursor / 60).toFixed(1), 'min');
}

HARMONIES.slice(-7).forEach(([name, P]) => console.log(' ', name + ':', P.join(',')));
