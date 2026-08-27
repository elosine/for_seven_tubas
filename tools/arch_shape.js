// Is the complexity "arch" actually an arch? Reuses score_offsets.js math exactly.
const N = 10, BPM = 98, T = 60000 / BPM;
const FUSE = 25;

function pattern(f) {
    const pos = [];
    for (let j = 0; j < N; j++) pos.push(((j * f) % 1) * T);
    pos.sort((a, b) => a - b);
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
    if (p.centers.length < 2) return { f, G: p.centers.length, cv: 0, acc: 0, score: 0 };
    const g = stats(p.gaps), s = stats(p.sizes);
    return { f, G: p.centers.length, cv: g.sd / g.m, acc: s.sd, score: g.sd / g.m + 0.1 * s.sd };
}

const all = [];
for (let f = 0.002; f <= 0.5 + 1e-9; f += 0.0005) all.push(scoreOf(+f.toFixed(4)));

console.log('=== 1. IS SCORE AN ARCH OVER OFFSET? (mean score per 0.05 band) ===');
for (let lo = 0; lo < 0.5; lo += 0.05) {
    const band = all.filter(r => r.f >= lo && r.f < lo + 0.05);
    const m = band.reduce((a, b) => a + b.score, 0) / band.length;
    const zeros = band.filter(r => r.score < 0.02).length;
    console.log(`  ${lo.toFixed(2)}-${(lo + 0.05).toFixed(2)}  mean ${m.toFixed(3)}  ` +
        '#'.repeat(Math.round(m * 40)) + `   (${zeros} near-zero of ${band.length})`);
}

console.log('\n=== 2. WHERE ARE THE SIMPLE (near-zero) STATES? ===');
const zeros = all.filter(r => r.score < 0.02);
console.log('  count:', zeros.length, 'of', all.length);
console.log('  offsets:', zeros.map(r => r.f.toFixed(4)).join(' '));

console.log('\n=== 3. SCORE vs DENSITY (group count) ===');
const byG = new Map();
for (const r of all) {
    if (!byG.has(r.G)) byG.set(r.G, []);
    byG.get(r.G).push(r.score);
}
[...byG.keys()].sort((a, b) => a - b).forEach(G => {
    const v = byG.get(G);
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    console.log(`  ${String(G).padStart(2)} groups  n=${String(v.length).padStart(4)}  ` +
        `mean ${m.toFixed(3)}  min ${Math.min(...v).toFixed(3)}  max ${Math.max(...v).toFixed(3)}`);
});

console.log('\n=== 4. THE TWO SIMPLE EXTREMES — are both really simple? ===');
for (const f of [0.5, 0.3333, 0.25, 0.2, 0.1, 0.0935, 0.0585, 0.01, 0.002]) {
    const r = scoreOf(f);
    console.log(`  f=${String(f).padEnd(7)} groups ${String(r.G).padStart(2)}  ` +
        `gapCV ${r.cv.toFixed(3)}  accents ${r.acc.toFixed(2)}  score ${r.score.toFixed(3)}`);
}
