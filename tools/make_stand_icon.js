#!/usr/bin/env node
// make_stand_icon.js — the home-screen icon for notation/app/stand.html (9h-1):
// a 192×192 PNG, written with zlib alone (no image library). A dark square with
// a staff of five lines — a placeholder until 9i's design sitting.
//   node tools/make_stand_icon.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const N = 192;
const px = Buffer.alloc(N * N * 4);
const put = (x, y, r, g, b) => { const o = (y * N + x) * 4; px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255; };
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) put(x, y, 0x17, 0x17, 0x17);
// five staff lines, 4 px thick, 22 px apart, centred
for (let i = 0; i < 5; i++) {
  const y0 = 96 - 44 + i * 22 - 2;
  for (let y = y0; y < y0 + 4; y++) for (let x = 28; x < N - 28; x++) put(x, y, 0xe8, 0xe6, 0xe1);
}
// a filled notehead on the middle line (the cursor's pink from the registry)
let pink = [0xff, 0x15, 0xa0];
try { const c = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'notation', 'registry', 'container.json'), 'utf8')).animated.cursor.color;
  const m = /^#?([0-9a-f]{6})$/i.exec(c); if (m) { const n = parseInt(m[1], 16); pink = [n >> 16 & 255, n >> 8 & 255, n & 255]; } } catch (e) { /* */ }
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const dx = (x - 112) / 15, dy = (y - 96) / 11;
  if (dx * dx + dy * dy <= 1) put(x, y, pink[0], pink[1], pink[2]);
}
// PNG: signature · IHDR · IDAT (filter 0 per row) · IEND
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
const crc32 = buf => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const rows = [];
for (let y = 0; y < N; y++) rows.push(Buffer.from([0]), px.subarray(y * N * 4, (y + 1) * N * 4));
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
const out = path.join(__dirname, '..', 'notation', 'app', 'stand-icon.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
