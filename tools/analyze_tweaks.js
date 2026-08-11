// analyze_tweaks.js — the feedback-loop instrument (ENGINE_FRAMEWORK.md §5).
// Diffs a composer-tweaked score against its generated original and classifies
// the tweaks: settings adjustment (which dial, how much, which direction) vs
// new-model evidence (what coupling/mechanism the edits point to).
//
//   node tools/analyze_tweaks.js scores/oc1-apex8-md3p5.json scores/oc1-tweaked.json
//
// Grains matched by object id (stable through handle edits). Per-grain deltas:
// onset, duration (start->apex), release (apex->end), level (apex y), env shape,
// part. Aggregates: touched fraction, mean/sd, correlations vs original value,
// onset time, and local onset density. Structural: deletions, additions, swaps.

const fs = require('fs');

function loadScore(p) {
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const data = d.data || d;
  return (data.objects || []).filter(o => o.type === 'waveCurve' && o.sonifyNote != null);
}

function grainStats(wc) {
  const span = wc.endSeconds - wc.startSeconds;
  let aIdx = 0, aY = -Infinity;
  wc.nodes.forEach((n, i) => { if (n.y > aY) { aY = n.y; aIdx = i; } });
  const tPeak = wc.startSeconds + wc.nodes[aIdx].pos * span;
  return {
    id: wc.id, part: wc.layer, onset: wc.startSeconds,
    dur: tPeak - wc.startSeconds, release: wc.endSeconds - tPeak,
    level: aY, env: wc.envShape || wc.segments.map(s => s.model).join('+'),
    peak: tPeak
  };
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 4) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

function localRate(g, all) {
  // aggregate onsets within +/-1s of this grain's onset, per second
  return all.filter(o => Math.abs(o.onset - g.onset) <= 1).length / 2;
}

function cohensD(xs, ys) {
  if (xs.length < 3 || ys.length < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const vx = xs.reduce((a, b) => a + (b - mx) * (b - mx), 0) / xs.length;
  const vy = ys.reduce((a, b) => a + (b - my) * (b - my), 0) / ys.length;
  const sp = Math.sqrt((vx + vy) / 2);
  return sp ? (mx - my) / sp : 0;
}

function analyzeFamily(name, pairs, allOrig, eps, unit) {
  const touched = pairs.filter(p => Math.abs(p.delta) > eps);
  const untouched = pairs.filter(p => Math.abs(p.delta) <= eps);
  const out = { family: name, n: pairs.length, touched: touched.length,
                touchedFrac: +(touched.length / Math.max(1, pairs.length)).toFixed(2) };
  if (touched.length < 3) { out.reading = 'untouched'; return out; }
  const ds = touched.map(p => p.delta);
  const mean = ds.reduce((a, b) => a + b, 0) / ds.length;
  const sd = Math.sqrt(ds.reduce((a, b) => a + (b - mean) * (b - mean), 0) / ds.length);
  out.mean = +mean.toFixed(3); out.sd = +sd.toFixed(3);
  const covar = {
    origValue: p => p.orig,
    onsetTime: p => p.g.onset,
    localRate: p => localRate(p.g, allOrig),
  };
  out.corr = {};   // slope pattern WITHIN touched grains
  for (const k in covar) out.corr[k] = +pearson(touched.map(covar[k]), ds).toFixed(2);
  out.selection = {};   // WHICH grains got touched (selection by covariate)
  for (const k in covar) out.selection[k] = +cohensD(touched.map(covar[k]), untouched.map(covar[k])).toFixed(2);
  const meanSig = Math.abs(mean) > 2 * sd / Math.sqrt(ds.length);
  const maxCorr = Object.entries(out.corr).reduce((a, b) => Math.abs(b[1]) > Math.abs(a[1]) ? b : a);
  const selCandidates = Object.entries(out.selection).filter(([k]) => k !== 'origValue');
  const maxSel = selCandidates.reduce((a, b) => Math.abs(b[1]) > Math.abs(a[1]) ? b : a);
  const partialEdit = untouched.length >= 3 && out.touchedFrac < 0.85;
  if (Math.abs(out.corr.origValue) > 0.6) {
    const ratio = touched.reduce((a, p) => a + (p.orig + p.delta) / Math.max(1e-6, p.orig), 0) / touched.length;
    out.reading = `PROPORTIONAL RESCALE: multiply the ${name} dial/range by ~${ratio.toFixed(2)} (settings tweak)`;
  } else if (Math.abs(maxCorr[1]) > 0.6 && maxCorr[0] !== 'origValue') {
    out.reading = `COUPLING SIGNAL: ${name} deltas track ${maxCorr[0]} (r=${maxCorr[1]}) — the model lacks a ` +
                  `${maxCorr[0]}-dependent mechanism (NEW-MODEL evidence, not a dial)`;
  } else if (partialEdit && Math.abs(maxSel[1]) > 0.8) {
    out.reading = `CONDITIONAL EDIT: only grains selected by ${maxSel[0]} (d=${maxSel[1]}) were changed, by ` +
                  `${mean > 0 ? '+' : ''}${mean.toFixed(2)}${unit} — the model lacks ${maxSel[0]}-coupling (NEW-MODEL evidence)`;
  } else if (meanSig && sd / Math.abs(mean) < 0.8) {
    out.reading = `UNIFORM SHIFT: move the ${name} dial by ${mean > 0 ? '+' : ''}${mean.toFixed(2)}${unit} (settings tweak)`;
  } else if (!meanSig) {
    out.reading = 'POLISH/NOISE: zero-mean scattered edits — no dial lesson; possibly scatter-sigma taste';
  } else {
    out.reading = `MIXED: significant mean ${mean.toFixed(2)}${unit} but high spread — check region grouping below`;
  }
  return out;
}

function main(origPath, tweakPath) {
  const A = loadScore(origPath).map(grainStats);
  const B = loadScore(tweakPath).map(grainStats);
  const bById = new Map(B.map(g => [g.id, g]));
  const aIds = new Set(A.map(g => g.id));
  const matched = A.filter(g => bById.has(g.id)).map(g => ({ a: g, b: bById.get(g.id) }));
  const deleted = A.filter(g => !bById.has(g.id));
  const added = B.filter(g => !aIds.has(g.id));

  const mkPairs = f => matched.map(({ a, b }) => ({ g: a, orig: a[f], delta: b[f] - a[f] }));
  const report = {
    scores: { original: origPath, tweaked: tweakPath },
    counts: { original: A.length, matched: matched.length, deleted: deleted.length, added: added.length },
    families: [
      analyzeFamily('onset', mkPairs('onset'), A, 0.02, 's'),
      analyzeFamily('duration', mkPairs('dur'), A, 0.05, 's'),
      analyzeFamily('release', mkPairs('release'), A, 0.015, 's'),
      analyzeFamily('level', mkPairs('level'), A, 0.2, ' (y0-10)'),
    ],
    structural: {
      envSwaps: matched.filter(({ a, b }) => a.env !== b.env).length,
      partMoves: matched.filter(({ a, b }) => a.part !== b.part).length,
      deletedOnsets: deleted.map(g => +g.onset.toFixed(1)),
      addedGrains: added.map(g => ({ onset: +g.onset.toFixed(1), dur: +g.dur.toFixed(2), part: g.part })),
    },
  };
  // structural readings
  const notes = [];
  if (deleted.length / Math.max(1, A.length) > 0.12) {
    const dm = deleted.reduce((s, g) => s + g.onset, 0) / deleted.length;
    const dsd = Math.sqrt(deleted.reduce((s, g) => s + (g.onset - dm) * (g.onset - dm), 0) / deleted.length);
    notes.push(`OVER-GENERATION: ${deleted.length}/${A.length} deleted` +
      (dsd < 3 ? `, clustered near t=${dm.toFixed(1)}s — the rate trajectory over-shoots there (trajectory tweak)` :
                 ', spread out — global density dial too high (settings tweak)'));
  }
  if (added.length >= 3) {
    const durs = added.map(g => g.dur);
    notes.push(`MISSING COMPONENT: ${added.length} grains hand-added (durs ${Math.min(...durs).toFixed(1)}-` +
      `${Math.max(...durs).toFixed(1)}s) — the model never places these; candidate new mechanism (cf. longStream)`);
  }
  if (report.structural.envSwaps >= 3) notes.push(`ENVELOPE TASTE: ${report.structural.envSwaps} env swaps — check which shapes gained (envelopeMix dial or new default)`);
  report.structuralReadings = notes.length ? notes : ['no structural signals'];
  return report;
}

if (require.main === module) {
  const [o, t] = process.argv.slice(2);
  if (!o || !t) { console.error('usage: node tools/analyze_tweaks.js <original.json> <tweaked.json>'); process.exit(1); }
  console.log(JSON.stringify(main(o, t), null, 2));
}
module.exports = { main, grainStats, loadScore };
