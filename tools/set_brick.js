#!/usr/bin/env node
// set_brick.js — SET THE WRITTEN LENGTH OF A GROUP'S ONE-SHOTS, in the score itself.
//
// Sibling of move_object.js, and for the same reason: `scores/*.json` archives are
// FROZEN (docs/ARCHIVE_AMENDMENTS.md rule 1), so a change to them is an explicit,
// ledgered act made by a script — never a hand edit.
//
// WHY THIS IS A SCORE EDIT AND NOT AN IR AMENDMENT. The drawn length of a fixed
// one-shot does not decide its SOUND — D51: a staccato lasts its sample length, and
// the IR already carries that (`duration`), which is what the player uses. But the
// drawn length IS what the playability check calls a HARD conflict: two notes on one
// player overlap when the first brick runs past the second's attack. So an
// over-long brick can make a passage read as impossible when the attacks are
// comfortable — measured on CLOUD02-I: two hard conflicts, both from 182–202 ms
// bricks over 133–174 ms attack gaps, both gone at 50 ms.
//
// Composer, day 25: "these should all be staccatos… some of the bricks are longer.
// That must have been from my playing." They are the played lengths, carried from
// clusterClouds02 through cloud02.js.
//
//   node tools/set_brick.js --score piece-s25-finished01 --group grp-cloud02-i-01 --brick 0.05
//   node tools/set_brick.js ... --apply            (dry run is the default)
//
// Only `endSeconds` changes, and only on notes whose technique matches (default
// `staccato`). Onsets, pitches, velocities, parts, groups: untouched.
// git is the undo: `git checkout -- scores/<name>.json`.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const flag = name => process.argv.includes('--' + name);

const scoreName = arg('score');
const group = arg('group');
const w0 = arg('w0') != null ? parseFloat(arg('w0')) : null;
const w1 = arg('w1') != null ? parseFloat(arg('w1')) : null;
const brick = parseFloat(arg('brick', '0.05'));
const technique = arg('technique', 'staccato');
const META_LAYER = 10;

if (!scoreName || (!group && (w0 == null || w1 == null)) || !(brick > 0)) {
  console.error('usage: set_brick.js --score <name> (--group <id> | --w0 <s> --w1 <s>)'
    + ' [--brick 0.05] [--technique staccato] [--apply]');
  process.exit(2);
}

const file = path.join(ROOT, 'scores', scoreName + '.json');
const raw = fs.readFileSync(file, 'utf8');
const score = JSON.parse(raw);

const targets = (score.objects || []).filter(o =>
  o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null
  && (o.technique || 'staccato') === technique
  && (group ? o.groupId === group : (o.startSeconds >= w0 && o.startSeconds < w1)));

if (!targets.length) { console.error('no ' + technique + ' notes matched'); process.exit(1); }

const lens = targets.map(o => o.endSeconds - o.startSeconds);
const changed = targets.filter(o => Math.abs((o.endSeconds - o.startSeconds) - brick) > 1e-6);
console.log(scoreName + ' · ' + (group || w0 + '–' + w1 + ' s') + ' · ' + technique);
console.log('  ' + targets.length + ' notes, written length '
  + (Math.min(...lens) * 1000).toFixed(0) + '–' + (Math.max(...lens) * 1000).toFixed(0) + ' ms'
  + '  ->  ' + (brick * 1000).toFixed(0) + ' ms on all of them (' + changed.length + ' change)');

// what this does to the HARD count — the reason the edit exists, measured both ways
const TONGUE = 0.03, MIN = 0.11, PER = 0.0093, MAXL = 0.22;
const req = (a, b) => MIN + Math.min(MAXL, Math.abs(b.sonifyNote - a.sonifyNote) * PER);
function census(endOf) {
  const all = (score.objects || []).filter(o => o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null);
  const inSet = new Set(targets.map(o => o.id));
  let hard = 0, soft = 0;
  for (let L = 0; L < META_LAYER; L++) {
    const p = all.filter(o => o.layer === L).sort((x, y) => x.startSeconds - y.startSeconds);
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i];
      const aEnd = inSet.has(a.id) ? endOf(a) : a.endSeconds;
      if (b.startSeconds < aEnd - 1e-6) hard++;
      else if (b.startSeconds - aEnd < TONGUE - 1e-6) soft++;
      else if (b.startSeconds - a.startSeconds < req(a, b) - 1e-6) soft++;
    }
  }
  return { hard, soft };
}
const before = census(o => o.endSeconds);
const after = census(o => o.startSeconds + brick);
console.log('  whole score: hard ' + before.hard + ' -> ' + after.hard
  + ' · soft ' + before.soft + ' -> ' + after.soft);
console.log('  (sound is unaffected — D51: a fixed one-shot lasts its sample length, carried by the IR)');

if (!flag('apply')) {
  console.log('\nDRY RUN — nothing written. Add --apply.');
  process.exit(0);
}

for (const o of targets) o.endSeconds = +(o.startSeconds + brick).toFixed(3);

// rewrite in the file's own formatting, verified by round-trip (move_object's discipline)
const indentMatch = raw.match(/\n(\s+)"/);
const indent = indentMatch ? indentMatch[1].length : 0;
const out = JSON.stringify(score, null, indent || undefined) + (raw.endsWith('\n') ? '\n' : '');
const check = JSON.parse(out);
if (check.objects.length !== score.objects.length) throw new Error('round-trip lost objects — not written');
fs.writeFileSync(file, out);

console.log('\nAPPLIED to scores/' + scoreName + '.json (undo: git checkout -- scores/' + scoreName + '.json)');
console.log('Re-extract any IR built from this score.');
console.log('ledger line for docs/ARCHIVE_AMENDMENTS.md:');
console.log('| ' + new Date().toISOString().slice(0, 10) + ' | `' + (group || w0 + '–' + w1 + ' s') + '` ('
  + targets.length + ' ' + technique + ' notes) | written lengths '
  + (Math.min(...lens) * 1000).toFixed(0) + '–' + (Math.max(...lens) * 1000).toFixed(0)
  + ' ms (played) | all ' + (brick * 1000).toFixed(0) + ' ms | composer instruction: "these should all be staccatos… some of the bricks are longer, that must have been from my playing" — and an over-long brick reads as a HARD playability conflict when the attack gap is comfortable | hard '
  + before.hard + ' -> ' + after.hard + ' on the whole score; sound unchanged (D51, IR carries duration) | SCORE EDIT (archive) — applied |');
