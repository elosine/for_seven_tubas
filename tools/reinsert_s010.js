// reinsert_s010.js — composer 2026-08-14: in piece-s08-work, drop the S010
// blast that was inserted with the guessed 3.0 s fortepiano length and put it
// back at 86.58 with the MEASURED one-shot lengths (probe 2026-08-15).
//   fp / cuivre / staccato = fixed, per-note sample length
//   ord = the only variable duration (uses the sonority's ordLen)

const fs = require('fs');

const SCORE = 'scores/piece-s08-work.json';
const SON_ID = 'S010';
const AT = 86.58;
const META_LAYER = 10, PARTS = 10;
const COLOR = '#5E8C7A';

const LEN = JSON.parse(fs.readFileSync('bank/sample_lengths.json', 'utf8'));
const tax = JSON.parse(fs.readFileSync('bank/blast_taxonomy.json', 'utf8'));
const son = tax.sonorities[SON_ID];
if (!son) throw new Error(SON_ID + ' not in the taxonomy');

const techLen = (tech, pitch) => {
  const tbl = LEN[tech];
  if (!tbl) return null;
  if (tbl[pitch] != null) return tbl[pitch];
  const keys = Object.keys(tbl).map(Number);
  if (!keys.length) return null;
  return tbl[keys.reduce((a, b) => Math.abs(b - pitch) < Math.abs(a - pitch) ? b : a)];
};
const durFor = pitch => {
  const cv = (son.cuivreConverted || []).includes(pitch) || (son.cuivreAdded || []).includes(pitch);
  const art = (son.artic || {})[pitch] || 'ord';
  const tech = cv ? 'cuivre' : art;
  const measured = techLen(tech, pitch);
  return measured != null ? measured : (son.ordLen || 1);
};

const d = JSON.parse(fs.readFileSync(SCORE, 'utf8'));

// 1. remove the old S010 insertion (any group whose marker names it)
const oldGroups = [...new Set(d.objects
  .filter(o => o.groupId && /^grp-s010-/i.test(o.groupId))
  .map(o => o.groupId))];
const before = d.objects.length;
d.objects = d.objects.filter(o => !oldGroups.includes(o.groupId));
console.log('removed', before - d.objects.length, 'objects from', oldGroups.join(', ') || '(none)');

// 2. re-insert with measured lengths
let nid = (d.nextId || 1) + 1;
const group = 'grp-s010-' + Math.floor(AT * 10);
const pitches = son.pitches.slice().sort((a, b) => a - b).slice(0, PARTS);
const lv = Math.max(1, Math.round(((son.dyn || 127) / 127) * 100) / 10);

d.objects.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: AT,
  label: SON_ID + ' ' + son.chord.replace('VERT01-', 'ch') + ' ' + son.voicing,
  color: COLOR, groupId: group, performanceNotes: '', properties: {} });

const report = [];
pitches.forEach((pitch, k) => {
  const cv = (son.cuivreConverted || []).includes(pitch) || (son.cuivreAdded || []).includes(pitch);
  const art = (son.artic || {})[pitch] || 'ord';
  const dur = durFor(pitch);
  report.push({ pitch, tech: cv ? 'cuivre' : art, dur });
  d.objects.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: 9 - k, groupId: group,
    startSeconds: AT, endSeconds: +(AT + dur).toFixed(3),
    nodes: [{ pos: 0, y: lv, smooth: 0.25 }, { pos: 1, y: lv, smooth: 0.25 }],
    segments: [{ model: 'power', slope: 0 }],
    color: COLOR, fillMode: 'bottom', opacity: 0.55,
    performanceNotes: SON_ID, properties: {},
    sonifyNote: pitch, technique: cv ? 'cuivre' : art, sonifyMode: 'plain',
    recVel: son.dyn || 127 });
});

// META shape spans the longest sounding element
const span = Math.max(...report.map(r => r.dur));
d.objects.push({ id: 'wc-' + (nid++), type: 'waveCurve', layer: META_LAYER, groupId: group,
  startSeconds: AT, endSeconds: +(AT + span).toFixed(3),
  nodes: [{ pos: 0, y: 8.5, smooth: 0 }, { pos: 1, y: 8.5, smooth: 0 }],
  segments: [{ model: 'power', slope: 0 }],
  color: COLOR, fillMode: 'bottom', opacity: 0.45,
  performanceNotes: SON_ID + ' (drag = move, box = stretch)', properties: {} });

d.nextId = nid;
d.metadata = d.metadata || {};
d.metadata.modified = new Date().toISOString();
fs.writeFileSync(SCORE, JSON.stringify(d));

const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const nm = m => names[m % 12] + (Math.floor(m / 12) - 1);
console.log(SON_ID, son.chord, son.voicing, '-> ' + AT + 's, span ' + span.toFixed(2) + 's');
report.forEach(r => console.log('  ' + nm(r.pitch).padEnd(4), r.tech.padEnd(11), r.dur + 's'));
console.log('objects now:', d.objects.length);
