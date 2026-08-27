#!/usr/bin/env node
// % of pixels whose max channel delta exceeds 8 (the h.264 crf16 noise floor —
// two encodes of the same frame land well under it; different content lands
// far above). Usage: node pxdiff.js a.png b.png
const fs = require('fs');
const { PNG } = require('pngjs');
const a = PNG.sync.read(fs.readFileSync(process.argv[2]));
const b = PNG.sync.read(fs.readFileSync(process.argv[3]));
if (a.width !== b.width || a.height !== b.height) { console.log('SIZE MISMATCH'); process.exit(1); }
let n = 0;
const total = a.width * a.height;
for (let i = 0; i < total * 4; i += 4) {
  const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i+1] - b.data[i+1]), Math.abs(a.data[i+2] - b.data[i+2]));
  if (d > 8) n++;
}
console.log((100 * n / total).toFixed(2) + ' %  (' + n + ' of ' + total + ')');
