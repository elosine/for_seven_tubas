#!/usr/bin/env node
// verify_film.js — PHASE 5, the criterion the old proof did NOT cover.
//
// --dumpPage compares the STATIC page only; the premultiply bug lived in the
// compositor, which the static path never touches. So this reads the ANIMATED
// layer straight out of the finished mp4: find the cursor, step left to the
// meter, and check the colour against what the app draws.
// Usage: node verify_film.js <frame.png>   (a V-MAIN frame at t=200)
const fs = require('fs');
const { PNG } = require('pngjs');

const img = PNG.sync.read(fs.readFileSync(process.argv[2]));
const at = (x, y) => { const i = (img.width * y + x) << 2; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');

// the cursor is the only strongly magenta thing on the page (#FF15A0, opaque)
const Y = 260;                      // inside Tuba 3's glissando half at t=200
let cx = -1, best = 1e9;
for (let x = 0; x < img.width; x++) {
  const [r, g, b] = at(x, Y);
  const d = Math.abs(r - 255) + Math.abs(g - 21) + Math.abs(b - 160);
  if (d < best) { best = d; cx = x; }
}
console.log('cursor found at x=' + cx + '  ' + hex(at(cx, Y)) + '   (target #ff15a0, distance ' + best + ')');

// the meter rides w+gap = 11 px left of the cursor and is 8 px wide; sample its middle
const mx = cx - 11 + 3;
const gliss = at(mx, Y);
const cresc = at(mx, 300);
const groundG = at(cx - 24, Y);
const groundC = at(cx - 24, 300);

console.log('');
console.log('                    measured in the film      the app draws     was, in the old render');
const row = (name, got, app, old) =>
  console.log('  ' + name.padEnd(16) + hex(got) + ' (' + got.join(',').padEnd(11) + ')   ' +
    app.padEnd(16) + '  ' + old);
row('gliss meter', gliss, '245,131,80', '198,157,139  (bug, at 0.3)');
row('cresc meter', cresc, '185,255,80', '177,201,139  (bug, at 0.3)');
console.log('');
console.log('  ground beside it: ' + hex(groundG) + ' / ' + hex(groundC) + '  (unchanged, static page)');

const near = (got, want, tol) => got.every((v, i) => Math.abs(v - want[i]) <= tol);
const TOL = 12;   // h.264 crf16 + yuv420p chroma subsampling on an 8 px saturated column
const okG = near(gliss, [245, 131, 80], TOL), okC = near(cresc, [185, 255, 80], TOL);
console.log('');
console.log('  gliss within ' + TOL + ' of the app: ' + (okG ? 'YES' : 'NO'));
console.log('  cresc within ' + TOL + ' of the app: ' + (okC ? 'YES' : 'NO'));
console.log('');
console.log(okG && okC
  ? '  PASS - the compositor fix and A1 are both in the film.'
  : '  FAIL - the animated layer does not match the app.');
