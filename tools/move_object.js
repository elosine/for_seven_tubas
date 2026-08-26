#!/usr/bin/env node
// move_object.js — MOVE ONE OBJECT TO ANOTHER PART, in the score itself.
//
// Why this is a tool and not a one-liner: `scores/piece-s25-finished01.json`
// is the FROZEN ARCHIVE (docs/ARCHIVE_AMENDMENTS.md rule 1). Notation-time
// corrections belong in the IR — but moving a note from one tuba to another
// is not a correction, it is a COMPOSITIONAL edit: it changes who plays the
// note and therefore which MIDI port sounds it. An IR-only move would draw
// the note on the new staff while the archive kept sounding it on the old
// port, which is exactly the silent divergence the protocol exists to
// prevent. So the edit goes in the score, and rule 5 wants it to be an
// explicit, ledgered act — "a script run from this ledger". This is that
// script.
//
//   node tools/move_object.js --score piece-s25-finished01 --object wc-28 --toPart 8
//   node tools/move_object.js ... --apply          (dry run is the default)
//
// The dry run prints exactly what would change plus the ledger line to paste.
// Nothing else in the object is touched: same onset, same pitch, same
// technique, same velocity, same group. Only `layer`.
//
// Safety, deliberately noisy rather than silent (methodology rule 3):
//  - refuses if the target part already has an object within --tol of the
//    onset, because extraction sidelines same-onset notes as splitters and
//    the move would quietly change how the part reads. --force overrides.
//  - refuses a no-op move.
//  - rewrites with THE FILE'S OWN formatting — DISCOVERED by finding the
//    serialisation that reproduces the file we read, never assumed — so the
//    diff is the one field and nothing else. Refuses if it cannot find one.
//  - git is the undo: `git checkout -- scores/<name>.json`.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const flag = name => process.argv.includes('--' + name);

const scoreName = arg('score');
const objectId = arg('object');
const toPart = parseInt(arg('toPart'), 10);
const tol = parseFloat(arg('tol', '0.03'));
if (!scoreName || !objectId || isNaN(toPart)) {
  console.error('usage: move_object.js --score <name> --object <id> --toPart <0-9> [--tol s] [--apply] [--force]');
  process.exit(2);
}

const file = path.join(ROOT, 'scores', scoreName + '.json');
const raw = fs.readFileSync(file, 'utf8');
const score = JSON.parse(raw);

const obj = (score.objects || []).find(o => o.id === objectId);
if (!obj) { console.error('no object ' + objectId + ' in ' + scoreName); process.exit(1); }
const fromPart = obj.layer;
if (fromPart === toPart) { console.error(objectId + ' is already on part ' + toPart + ' (T' + (toPart + 1) + ') — nothing to do'); process.exit(1); }

const label = p => 'T' + (p + 1) + ' (' + ((score.tracks && score.tracks[p] && score.tracks[p].id) || '?') + ')';
console.log(objectId + ': ' + obj.technique + ' midi ' + obj.sonifyNote + ' vel ' + obj.recVel +
  ' at ' + obj.startSeconds.toFixed(3) + '–' + obj.endSeconds.toFixed(3) + ' s' +
  (obj.groupId ? ' · group ' + obj.groupId : '') + (obj.performanceNotes ? ' · "' + obj.performanceNotes + '"' : ''));
console.log('  ' + label(fromPart) + '  ->  ' + label(toPart));

// what the destination already has around that instant
const dest = (score.objects || [])
  .filter(o => o.type === 'waveCurve' && o.layer === toPart && o.id !== objectId)
  .sort((a, b) => a.startSeconds - b.startSeconds);
const clash = dest.filter(o => Math.abs(o.startSeconds - obj.startSeconds) <= tol);
const before = dest.filter(o => o.startSeconds < obj.startSeconds).slice(-1)[0];
const after = dest.filter(o => o.startSeconds > obj.startSeconds)[0];
console.log('  destination neighbours: ' +
  (before ? before.id + ' at ' + before.startSeconds.toFixed(2) : '(nothing before)') + '  |  ' +
  (after ? after.id + ' at ' + after.startSeconds.toFixed(2) : '(nothing after)'));
if (before) console.log('    gap before: ' + (obj.startSeconds - before.startSeconds).toFixed(2) + ' s');
if (after) console.log('    gap after : ' + (after.startSeconds - obj.startSeconds).toFixed(2) + ' s');

if (clash.length && !flag('force')) {
  console.error('REFUSED: ' + label(toPart) + ' already has ' + clash.map(o => o.id + '@' + o.startSeconds.toFixed(3)).join(', ') +
    ' within ' + tol + ' s of ' + obj.startSeconds.toFixed(3) + '.\n' +
    '  Same-onset notes in one part are sidelined by extraction (they cannot share a grid slot),\n' +
    '  so this move would silently change how that part reads. --force if that is intended.');
  process.exit(1);
}

const ledger = '| ' + new Date().toISOString().slice(0, 10) + ' | `' + objectId + '` (' + obj.technique +
  ' midi ' + obj.sonifyNote + ' at ' + obj.startSeconds.toFixed(2) + ' s) | part ' + label(fromPart) +
  ' | part ' + label(toPart) + ' | composer instruction (compositional move, not a correction) | ' +
  '— | SCORE EDIT (archive) |';

if (!flag('apply')) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.');
  console.log('ledger line for docs/ARCHIVE_AMENDMENTS.md:\n' + ledger);
  process.exit(0);
}

obj.layer = toPart;
// THE FILE'S OWN FORMATTING, ACTUALLY PROVEN (day 36 fix). The old check
// re-serialised the OUTPUT with the same formatter and compared it to itself,
// which can only ever pass — it proved self-consistency, not fidelity. And the
// hardcoded 2-space was wrong for the score chain, which the composer's app
// writes MINIFIED: moving one note re-serialised the whole file and turned a
// one-field edit into a 229,694-line diff (piece-s28, day 36). Archive rule 1
// wants the diff to BE the one field, so the format is now DISCOVERED — the
// serialisation that reproduces the file we actually read.
const FORMATS = [
  { name: 'minified',           f: o => JSON.stringify(o) },
  { name: 'minified + newline', f: o => JSON.stringify(o) + '\n' },
  { name: '2-space',            f: o => JSON.stringify(o, null, 2) },
  { name: '2-space + newline',  f: o => JSON.stringify(o, null, 2) + '\n' },
  { name: '1-space',            f: o => JSON.stringify(o, null, 1) },
  { name: '1-space + newline',  f: o => JSON.stringify(o, null, 1) + '\n' },
];
const asRead = JSON.parse(raw);                 // the file as read, unmutated
const fmt = FORMATS.find(c => c.f(asRead) === raw);
if (!fmt && !flag('reformat')) {
  console.error('formatting not recognised — NOT WRITING.\n' +
    '  scores/' + scoreName + '.json does not reproduce under any known serialisation,\n' +
    '  so writing it would reformat the whole file and bury the one-field edit.\n' +
    '  --reformat writes 2-space anyway (and expect a whole-file diff).');
  process.exit(1);
}
const out = fmt ? fmt.f(score) : JSON.stringify(score, null, 2) + '\n';
fs.writeFileSync(file, out);
console.log('  formatting preserved: ' + (fmt ? fmt.name : '2-space (FORCED by --reformat)'));
console.log('\nAPPLIED to scores/' + scoreName + '.json (undo: git checkout -- scores/' + scoreName + '.json)');
console.log('Re-extract any IR built from this score so the page and the sound follow.');
console.log('ledger line for docs/ARCHIVE_AMENDMENTS.md:\n' + ledger);
