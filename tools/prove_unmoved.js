#!/usr/bin/env node
// prove_unmoved.js (CLI) — "did anything the composer approved move?"
//
//   node tools/prove_unmoved.js --before <file.ir.json> --after <ir-id|file>
//   node tools/prove_unmoved.js --before day33-db1.ir.json --after db1 --expect-added 0
//
// The library behind it is notation/lib/prove_unmoved.js, and notate_block
// calls that library directly — a rebuild proves itself without anyone
// remembering to run this. This CLI exists for the case notate_block does not
// cover: comparing a page against a version of itself from somewhere else —
// git, an archive, a fork — which is what day 34 needed for THE FOLD (425
// approved layout rows proven identical before and after, hand-rolled) and
// what day 35 needed again for the long tone.
//
// --before takes a PATH (that is the point: the old page usually comes out of
// git). --after takes a path or a live IR id.
//
// Exit 0 = clean. Exit 1 = something moved.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Prove = require(path.join(ROOT, 'notation', 'lib', 'prove_unmoved.js'));

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };

const GLYPHS = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'lib', 'glyphs.json'), 'utf8'));
const CONTAINER = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));
const OPTS = Object.assign({ m4AttackLines: false, frameParts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
  (CONTAINER.engraving && CONTAINER.engraving.layout) || {});

function resolveIr(spec, what) {
  if (!spec) { console.error('--' + what + ' is required (a path, or an IR id for --after).'); process.exit(2); }
  const cands = [spec, path.join(ROOT, spec), path.join(ROOT, 'notation', 'ir', spec + '.ir.json')];
  for (const c of cands) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  console.error('Cannot find --' + what + ' "' + spec + '" (tried a path and notation/ir/<id>.ir.json).');
  process.exit(2);
}

const beforePath = resolveIr(arg('before'), 'before');
const afterPath = resolveIr(arg('after'), 'after');
const expect = arg('expect-added') != null ? parseInt(arg('expect-added'), 10) : null;

const lay = p => Layout.layoutSection(JSON.parse(fs.readFileSync(p, 'utf8')), GLYPHS, OPTS);
console.log('\nBEFORE  ' + path.relative(ROOT, beforePath));
console.log('AFTER   ' + path.relative(ROOT, afterPath));
const d = Prove.diff(lay(beforePath), lay(afterPath));
console.log('');
console.log(Prove.summarise(d, expect));

const clean = Prove.isClean(d, expect);
console.log('\n' + (clean
  ? 'CLEAN — nothing that was already on the page moved.'
  : 'NOT CLEAN — see the rows above.') + '\n');
process.exit(clean ? 0 : 1);
