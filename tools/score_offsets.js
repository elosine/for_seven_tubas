// Offset-complexity scorer (2ag). n=10 players, one cycle T at 98 BPM.
// Pattern = merged onset groups (fusion window 25 ms, wrap-aware).
// Score = gap unevenness (CV, primary) + 0.1 * stack-size std (accents).
const N = 10, BPM = 98, T = 60000 / BPM;       // 612.2 ms cycle
const FUSE = 25;                                // ms — attacks closer than this read as one

function pattern(f) {
    const pos = [];
    for (let j = 0; j < N; j++) pos.push(((j * f) % 1) * T);
    pos.sort((a, b) => a - b);
    // wrap-aware chain merge: rotate so the largest raw gap is the seam
    let big = 0, bigI = 0;
    for (let i = 0; i < N; i++) {
        const g = (i === N - 1 ? pos[0] + T - pos[N - 1] : pos[i + 1] - pos[i]);
        if (g > big) { big = g; bigI = (i + 1) % N; }
    }
    const rot = pos.slice(bigI).concat(pos.slice(0, bigI).map(x => x + T));
    const groups = [[rot[0]]];
    for (let i = 1; i < N; i++) {
        if (rot[i] - rot[i - 1] <= FUSE) groups[groups.length - 1].push(rot[i]);
        else groups.push([rot[i]]);
    }
    const centers = groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);
    const sizes = groups.map(g => g.length);
    const gaps = [];
    for (let i = 0; i < centers.length; i++)
        gaps.push(i === centers.length - 1 ? centers[0] + T - centers[centers.length - 1]
                                           : centers[i + 1] - centers[i]);
    return { centers, sizes, gaps };
}
function stats(a) {
    const m = a.reduce((x, y) => x + y, 0) / a.length;
    const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length);
    return { m, sd };
}
function scoreOf(f) {
    const p = pattern(f);
    if (p.centers.length < 2) return { f, G: p.centers.length, cv: 0, acc: 0, score: 0, p };
    const g = stats(p.gaps), s = stats(p.sizes);
    const cv = g.sd / g.m;
    return { f, G: p.centers.length, cv, acc: s.sd, score: cv + 0.1 * s.sd, p };
}
// sweep 0.002 .. 0.5 (f and 1-f mirror; above 0.5 is retrograde territory)
const all = [];
for (let f = 0.002; f <= 0.5 + 1e-9; f += 0.0005) all.push(scoreOf(+f.toFixed(4)));
// dedupe on the audible signature: gap multiset + stack multiset (5 ms bins)
const seen = new Map();
for (const r of all) {
    const key = r.p.gaps.map(x => Math.round(x / 5)).sort((a, b) => a - b).join(',') + '|' +
                r.p.sizes.slice().sort((a, b) => a - b).join(',');
    if (!seen.has(key) || Math.abs(seen.get(key).f - 0.25) > Math.abs(r.f - 0.25)) seen.set(key, r);
}
const uniq = [...seen.values()].sort((a, b) => a.score - b.score);
console.log('grid points:', all.length, '-> distinct audible patterns:', uniq.length);
console.log('score range:', uniq[0].score.toFixed(3), '..', uniq[uniq.length - 1].score.toFixed(3));

// LADDER: rung 1-2 = two clean pulses (score 0, different rates), then 10 rungs
// at even quantiles of the positive-score list, distinct group counts preferred
const zero = uniq.filter(r => r.score < 0.02);
const pos = uniq.filter(r => r.score >= 0.02);
const picks = [];
const half = zero.find(r => r.G === 2) || zero[0];
const five = zero.find(r => r.G === 5) || zero[Math.floor(zero.length / 2)];
picks.push(half, five);
for (let k = 0; k < 10; k++) {
    const i = Math.min(pos.length - 1, Math.round((k + 0.5) * pos.length / 10));
    let r = pos[i], step = 0;   // nudge to avoid duplicate picks
    while (picks.includes(r) && i + ++step < pos.length) r = pos[i + step];
    picks.push(r);
}
console.log('');
console.log('rung  offset   groups  gapCV  accents  score   gaps(ms)');
picks.forEach((r, i) => console.log(
    String(i + 1).padStart(3) + '   ' + r.f.toFixed(4) + '   ' + String(r.G).padStart(3) +
    '   ' + r.cv.toFixed(2).padStart(6) + '   ' + r.acc.toFixed(2).padStart(5) +
    '   ' + r.score.toFixed(3).padStart(6) + '   ' +
    r.p.gaps.map(x => Math.round(x)).join(' ')));
require('fs').writeFileSync(process.argv[2] || 'picks.json',
    JSON.stringify(picks.map(r => ({ offset: r.f, G: r.G, score: +r.score.toFixed(3) })), null, 1));
