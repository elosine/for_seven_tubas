#!/usr/bin/env node
// gen_beating_chart.js — the acoustic-beating sequence chart for the
// Performance Instructions (day 40, composer's spec: timeline x, pairs on the
// y labels, each section's sequence start → peak → back; final section has no
// glissando). Data measured from the save's morphBend curves — nothing typed
// in by hand.  Regenerate:
//   node tools/gen_beating_chart.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const save = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', 'piece-final-draft-001.json'), 'utf8'));
const morphs = (save.objects || []).filter(o => o.type === 'waveCurve' && o.morphBend && o.layer <= 9);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const SECS = [['BLOOM', 141.4, 259.5], ['CONVERGENCE', 259.5, 386.7], ['BALANCE', 386.7, 499.8]];
const PAIRS = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]];

const trajFor = (part, lo, hi) => {
  const spans = morphs.filter(o => o.layer === part && o.startSeconds >= lo - 1 && o.startSeconds < hi)
    .sort((a, b) => a.startSeconds - b.startSeconds);
  return t => {
    let best = null;
    for (const o of spans) {
      if (t >= o.startSeconds - 1e-9 && t <= o.endSeconds + 1e-9) { best = o; break; }
      if (o.startSeconds <= t) best = o;
    }
    if (!best) best = spans[0];
    const rel = Math.min(Math.max(t - best.startSeconds, 0), best.endSeconds - best.startSeconds);
    const nb = best.morphBend;
    let bend = nb[nb.length - 1][1];
    for (let i = 0; i < nb.length - 1; i++)
      if (rel >= nb[i][0] && rel <= nb[i + 1][0]) {
        const f = (rel - nb[i][0]) / Math.max(1e-9, nb[i + 1][0] - nb[i][0]);
        bend = nb[i][1] + (nb[i + 1][1] - nb[i][1]) * f; break;
      }
    if (rel <= nb[0][0]) bend = nb[0][1];
    return best.sonifyNote + bend / 100;
  };
};

// ---- geometry ----
const W = 860, LEFT = 78, RIGHT = 12, TOP = 46, ROWH = 58, GAP = 16, BOT = 34;
const T0 = 141.4, T1 = 499.8;
const HGT = TOP + PAIRS.length * (ROWH + GAP) - GAP + BOT;
const X = t => LEFT + (t - T0) / (T1 - T0) * (W - LEFT - RIGHT);
const INK = '#222', MUT = '#777', GRID = '#d8d8d0', ACC = '#F04B00';
let out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + HGT + '" viewBox="0 0 ' + W + ' ' + HGT + '" font-family="Georgia, serif">';

// section bands + headers
SECS.forEach(([name, a, b], i) => {
  if (i === 1) out += '<rect x="' + X(a).toFixed(1) + '" y="' + (TOP - 24) + '" width="' + (X(b) - X(a)).toFixed(1) + '" height="' + (HGT - TOP - BOT + 24 + 8) + '" fill="#00000008"/>';
  out += '<text x="' + ((X(a) + X(b)) / 2).toFixed(1) + '" y="' + (TOP - 30) + '" text-anchor="middle" font-size="13" letter-spacing="2" fill="' + INK + '">' + name + '</text>';
  out += '<line x1="' + X(a).toFixed(1) + '" y1="' + (TOP - 24) + '" x2="' + X(a).toFixed(1) + '" y2="' + (HGT - BOT + 8) + '" stroke="' + GRID + '" stroke-width="1"/>';
});
out += '<line x1="' + X(T1).toFixed(1) + '" y1="' + (TOP - 24) + '" x2="' + X(T1).toFixed(1) + '" y2="' + (HGT - BOT + 8) + '" stroke="' + GRID + '" stroke-width="1"/>';
// time ticks
[[141.4, '2:21'], [259.5, '4:20'], [386.7, '6:27'], [499.8, '8:20']].forEach(([t, lab]) => {
  out += '<text x="' + X(t).toFixed(1) + '" y="' + (HGT - BOT + 24) + '" text-anchor="middle" font-size="11" fill="' + MUT + '">' + lab + '</text>';
});
out += '<text x="' + LEFT + '" y="' + (TOP - 30) + '" text-anchor="end" font-size="11" font-style="italic" fill="' + MUT + '">beating (Hz)&#160;&#160;</text>';

PAIRS.forEach(([a, b], row) => {
  const y0 = TOP + row * (ROWH + GAP), yB = y0 + ROWH;
  // row label + baseline
  out += '<text x="' + (LEFT - 10) + '" y="' + (y0 + ROWH / 2 + 4) + '" text-anchor="end" font-size="13" fill="' + INK + '">T' + (a + 1) + ' + T' + (b + 1) + '</text>';
  out += '<line x1="' + LEFT + '" y1="' + yB + '" x2="' + (W - RIGHT) + '" y2="' + yB + '" stroke="' + GRID + '" stroke-width="1"/>';
  // row max from the two gliss sections
  let rowMax = 0;
  const cell = [];
  SECS.forEach(([name, lo, hi], si) => {
    const fa = trajFor(a, lo, hi), fb = trajFor(b, lo, hi);
    const spans = morphs.filter(o => (o.layer === a || o.layer === b) && o.startSeconds >= lo - 1 && o.startSeconds < hi);
    const s0 = Math.min(...spans.map(o => o.startSeconds)), s1 = Math.max(...spans.map(o => o.endSeconds));
    const pts = [];
    for (let t = s0; t <= s1; t += 0.5) {
      const v = Math.abs(hz(fa(t)) - hz(fb(t)));
      pts.push([t, v]);
      if (si < 2 && v > rowMax) rowMax = v;
    }
    cell.push({ name, si, pts, s0, s1 });
  });
  const Y = v => yB - Math.min(v / (rowMax * 1.12), 1) * (ROWH - 6);
  cell.forEach(({ name, si, pts, s0, s1 }) => {
    if (si === 2) {
      // BALANCE: no glissando — held chord; a flat muted line, no fake beats
      out += '<line x1="' + X(s0).toFixed(1) + '" y1="' + (yB - 8) + '" x2="' + X(s1).toFixed(1) + '" y2="' + (yB - 8) + '" stroke="' + MUT + '" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>';
      return;
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join('');
    out += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>';
    // markers + labels: BLOOM peak · CONVERGENCE start and fused minimum
    if (si === 0) {
      let pk = pts[0]; pts.forEach(p => { if (p[1] > pk[1]) pk = p; });
      out += '<circle cx="' + X(pk[0]).toFixed(1) + '" cy="' + Y(pk[1]).toFixed(1) + '" r="3.5" fill="' + ACC + '"/>';
      out += '<text x="' + X(pk[0]).toFixed(1) + '" y="' + (Y(pk[1]) - 7).toFixed(1) + '" text-anchor="middle" font-size="11" fill="' + INK + '">&#8776; ' + pk[1].toFixed(1).replace(/\.0$/, '') + ' Hz</text>';
    } else {
      const st = pts[0];
      let mn = pts[0]; pts.forEach(p => { if (p[1] < mn[1]) mn = p; });
      out += '<circle cx="' + X(st[0]).toFixed(1) + '" cy="' + Y(st[1]).toFixed(1) + '" r="3.5" fill="' + ACC + '"/>';
      out += '<text x="' + (X(st[0]) + 6).toFixed(1) + '" y="' + (Y(st[1]) - 6).toFixed(1) + '" font-size="11" fill="' + INK + '">&#8776; ' + Math.round(st[1]) + ' Hz</text>';
      out += '<circle cx="' + X(mn[0]).toFixed(1) + '" cy="' + Y(mn[1]).toFixed(1) + '" r="3.5" fill="' + ACC + '"/>';
      out += '<text x="' + X(mn[0]).toFixed(1) + '" y="' + (yB + 13).toFixed(1) + '" text-anchor="middle" font-size="10" font-style="italic" fill="' + MUT + '">fuses &#8776; ' + (mn[1] < 1 ? mn[1].toFixed(1) : Math.round(mn[1])) + ' Hz</text>';
    }
  });
});
// BALANCE column note (once), horizontal under the header
const bx = (X(386.7) + X(499.8)) / 2;
out += '<text x="' + bx.toFixed(1) + '" y="' + (TOP - 8) + '" text-anchor="middle" font-size="11" font-style="italic" fill="' + MUT + '">no glissando &#8212; held chord, crescendos</text>';
out += '</svg>';

const outPath = path.join(ROOT, 'docs', 'notation_instructions', 'images', 'beating_sequence_chart.svg');
fs.writeFileSync(outPath, out);
console.log('wrote ' + path.relative(ROOT, outPath) + ' (' + out.length + ' bytes)');
