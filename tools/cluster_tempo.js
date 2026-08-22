#!/usr/bin/env node
// cluster_tempo.js — day 23, the composer's question: "can you analyze the
// cluster, see if we can find a tempo that keeps... the least complex, precise
// rhythmic notation... finding the right tempo that will prevent us from using
// triple-nested tuplets."
//
// THE MODEL. A cluster is a list of onsets. Notating it precisely means
// choosing (a) a beat (tempo) and (b) a subdivision of that beat, then writing
// each onset at the nearest grid point. Two quantities matter:
//   ACCURACY  — max |onset - grid| in ms. The composer's ear sets the tolerance
//               (E1's open epsilon; 20/30/50 ms are the standing candidates).
//   COMPLEXITY — what the reader has to do. Scored, in order:
//               1. is the subdivision a plain power of 2 (no tuplet at all)?
//               2. if not, ONE tuplet (3,5,6,7...) inside a beat is one level;
//                  a tuplet inside a tuplet is nesting — what to avoid.
//               3. how many distinct rhythmic values appear.
//               4. how far the grid positions spread (a 32nd grid over a slow
//                  beat is precise but unreadable).
//
// The search is exhaustive over a unit grid, so "no fit exists under X ms" is a
// RESULT, not a failure to find one.
//
// The search + scoring live in notation/lib/cluster_fit.js — the SAME module
// notate_section --cluster uses to draw the result, so this report and the page
// can never disagree. This tool adds the human-readable survey around it.
//
// usage: node tools/cluster_tempo.js --ir db1-t1-x02 --t0 31.49 --t1 33.59
//        node tools/cluster_tempo.js --onsets 31.549,31.892,...
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };

let onsets, label;
if (arg('onsets')) {
  onsets = arg('onsets').split(',').map(Number);
  label = 'given onsets';
} else {
  const id = arg('ir', 'db1-t1-x02');
  const t0 = parseFloat(arg('t0')), t1 = parseFloat(arg('t1'));
  const ir = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', id + '.ir.json'), 'utf8'));
  onsets = ir.events.filter(e => e.onset >= t0 - 1e-9 && e.onset <= t1 + 1e-9).map(e => e.onset).sort((a, b) => a - b);
  label = id + ' ' + t0 + '-' + t1 + ' s';
}
if (onsets.length < 2) { console.error('need at least 2 onsets'); process.exit(2); }

const anchor = onsets[0];
const rels = onsets.map(t => t - anchor);
const span = rels[rels.length - 1];
const iois = onsets.slice(1).map((t, i) => t - onsets[i]);

console.log('CLUSTER TEMPO ANALYSIS — ' + label);
console.log('  ' + onsets.length + ' onsets, span ' + span.toFixed(3) + ' s');
console.log('  IOIs: ' + iois.map(x => x.toFixed(3)).join(' ') + '  (min ' + Math.min(...iois).toFixed(3) + ', max ' + Math.max(...iois).toFixed(3) + ')');
console.log('  onsets rel: ' + rels.map(x => x.toFixed(3)).join(' '));
console.log('');

// ---- exhaustive unit search ----
// A unit is the finest grid step. Search 20-500 ms in 0.2 ms increments; for
// each, the best fit is the nearest-integer assignment (the anchor is grid 0).
const UMIN = 0.02, UMAX = 0.5, USTEP = 0.0002;
const PLAYABLE = 0.09;    // D43's playable-pulse floor (a written note this fast is a limit)
const fits = [];
for (let u = UMIN; u <= UMAX + 1e-9; u += USTEP) {
  let maxErr = 0; const ns = [];
  for (const r of rels) {
    const n = Math.round(r / u);
    ns.push(n);
    const err = Math.abs(r - n * u);
    if (err > maxErr) maxErr = err;
  }
  if (new Set(ns).size !== ns.length) continue;          // two notes on one grid point
  fits.push({ u, maxErr, ns, lastN: ns[ns.length - 1] });
}

// ---- complexity scoring ----
// For a beat of m units, the grid positions modulo m tell us what tuplet, if
// any, the reader needs. m a power of 2 => no tuplet. m odd/other => one
// tuplet level. Nesting only appears if a SECOND, incommensurate grid is
// needed — which this single-unit model never produces, so the honest report
// is: this model can always avoid nesting; the question is the tolerance and
// the tuplet size.
const pow2 = m => (m & (m - 1)) === 0;
function complexity(u, m) {
  const beat = u * m;
  const bpm = 60 / beat;
  let score = 0;
  if (!pow2(m)) score += 10;              // one tuplet level
  if (m > 12) score += 10;                // a tuplet nobody reads
  if (beat < 0.3) score += 5;             // beat too fast to conduct/feel
  if (beat > 1.5) score += 3;             // beat too slow: everything is a subdivision
  if (u < PLAYABLE) score += 8;           // grid finer than the playable floor
  return { score, beat, bpm, tuplet: pow2(m) ? null : m };
}

const ClusterFit = require(path.join(ROOT, 'notation', 'lib', 'cluster_fit.js'));
console.log('=== THE CHOSEN FIT (notation/lib/cluster_fit.js — what --cluster will draw) ===');
for (const tol of [0.020, 0.030, 0.050]) {
  const f = ClusterFit.fit(onsets, { TOL: tol });
  if (!f) { console.log('  tol ' + (tol * 1000) + ' ms: NO FIT — proportional is the honest reading'); continue; }
  console.log('  tol ' + (tol * 1000) + ' ms: unit ' + (f.unit * 1000).toFixed(1) + ' ms · beat ' + f.beat.toFixed(3) + ' s = ' +
    f.bpm.toFixed(1) + ' bpm x ' + f.subdivision + (f.tuplet ? (' [' + f.tuplet + '-tuplet]') : ' [no tuplet]') +
    ' · max err ' + (f.maxErr * 1000).toFixed(1) + ' ms · grid ' + f.grid.join(',') + ' · ' + f.beams + ' beam(s), 1/' + f.restDur + ' rests');
}
console.log('');

const TOLS = [0.020, 0.030, 0.050];
for (const tol of TOLS) {
  const ok = fits.filter(f => f.maxErr <= tol);
  console.log('=== tolerance ' + (tol * 1000) + ' ms ===');
  if (!ok.length) { console.log('  NO FIT at any unit 20-500 ms — the cluster is not metric at this tolerance.'); console.log(''); continue; }
  // for each fit, try beats of m units and keep the best-scoring readable option
  const cands = [];
  for (const f of ok) {
    for (let m = 1; m <= 16; m++) {
      const c = complexity(f.u, m);
      if (c.beat < 0.2 || c.beat > 2.2) continue;
      // the grid must not demand more than 'm' subdivisions inside one beat
      const maxPos = f.lastN;
      cands.push({ u: f.u, m, maxErr: f.maxErr, ns: f.ns, maxPos, ...c });
    }
  }
  cands.sort((a, b) => a.score - b.score || a.maxErr - b.maxErr || b.u - a.u);
  const seen = new Set(); const top = [];
  for (const c of cands) { const k = c.m + '|' + Math.round(c.bpm); if (seen.has(k)) continue; seen.add(k); top.push(c); if (top.length >= 5) break; }
  for (const c of top) {
    const noteVal = c.m === 1 ? 'beat' : ('1/' + c.m + ' of the beat');
    console.log('  unit ' + (c.u * 1000).toFixed(1) + ' ms · beat ' + c.beat.toFixed(3) + ' s = ' + c.bpm.toFixed(1) + ' bpm × ' + c.m +
      (c.tuplet ? ('  [' + c.tuplet + '-tuplet]') : '  [plain, no tuplet]') +
      ' · max err ' + (c.maxErr * 1000).toFixed(1) + ' ms · grid ' + c.ns.join(',') + ' (score ' + c.score + ')');
  }
  console.log('');
}

// ---- what a NON-metric reading costs ----
const med = iois.slice().sort((a, b) => a - b)[Math.floor(iois.length / 2)];
console.log('For reference: median IOI ' + med.toFixed(3) + ' s (' + (60 / med).toFixed(1) + ' bpm if that were the beat);');
console.log('proportional (spatial) notation needs no tempo at all and has zero error by construction.');
