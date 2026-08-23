#!/usr/bin/env node
// pattern_analyze.js — the D63 analyser at the command line.
//
//   node tools/pattern_analyze.js --ir db1-all-x01 --validate
//       every decided cluster in the IR: what the analyser proposes vs what
//       was built. A disagreement is a finding, not a failure — it is either
//       a case the rule gets wrong or a case the composer's ear did something
//       the rule should learn.
//   node tools/pattern_analyze.js --ir db1-all-x01 --part 9 --span 32.17-34.56
//       a fresh span: seams by the breath rule, then each group's best
//       writing and its alternatives, as SHAPES.
//
// Pickups: proposed only, never silent (composer: "the ones you do on your
// own, just flag for me").
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PF = require(path.join(ROOT, 'notation', 'lib', 'pattern_fit.js'));
const CF = require(path.join(ROOT, 'notation', 'lib', 'cluster_fit.js'));

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const flag = n => process.argv.includes('--' + n);
const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8'));
const BREATH = C.engraving.layout.breathSeconds || 0.5;
const ir = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'ir', arg('ir', 'db1-all-x01') + '.ir.json'), 'utf8'));
const partOf = new Map(); for (const c of ir.chunks) for (const id of c.events) partOf.set(id, c.part);
const evs = ir.events.slice().sort((a, b) => a.onset - b.onset);

const ms = x => Math.round(x * 1000);
const fmtFit = f => f ? ('♩=' + f.bpm.toFixed(0) + '  grid ' + f.grid.join(',') +
  (f.tupletBeats ? ('  TUPLET ' + f.beats.filter(b => b.tuplet).map(b => 'beat' + b.beat + ':' + b.tuplet).join(',')) : '') +
  '  worst ' + ms(f.worstSeconds) + ' ms = ' + f.heads.toFixed(1) + ' heads' + (f.coherent === false ? '  [OVER A HEAD — no coherent writing]' : '')) : 'NO FIT';

// ---------- validate: the decided clusters ----------
if (flag('validate')) {
  const byCl = new Map();
  for (const o of ir.overlays) {
    const d = o.value.device; if (!d || !d.clusterId) continue;
    const e = ir.events.find(x => x.id === o.target.event);
    if (!byCl.has(d.clusterId)) byCl.set(d.clusterId, []);
    byCl.get(d.clusterId).push({ e, d });
  }
  let agree = 0, total = 0;
  const rows = [];
  for (const [cid, members] of [...byCl].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    members.sort((a, b) => a.e.onset - b.e.onset);
    const ons = members.map(m => m.e.onset);
    // the built writing, as a PATTERN: gap ratios in 16ths, pickups excluded
    const main = members.filter(m => !m.d.pickup);
    const pickups = members.filter(m => m.d.pickup);
    const sub = main[0].d.beamSubdivision, scale = sub === 8 ? 0.5 : sub === 2 ? 2 : 1;
    const cmpSet = main.length >= 2 ? main : members;   // a pickup into a lone note: compare all
    const builtGrid16 = cmpSet.map(m => +((m.d.beamPos - cmpSet[0].d.beamPos) * scale).toFixed(3));
    const builtTup = main.some(m => m.d.tupletGroup);
    const built = { unit: main[0].d.beamUnit / scale };
    const onsMain = main.map(m => m.e.onset);
    // a pickup into a lone downbeat leaves one main note: fit all members (the tool did the same)
    const f = PF.fit(onsMain.length >= 2 ? onsMain : members.map(m => m.e.onset));
    const propGrid = f ? f.grid.map(g => +(g - f.grid[0]).toFixed(3)) : null;
    // compare SHAPES: the sequence of gap ratios, reduced (so 0,2,4 == 0,1,2)
    const ratios = g => { const d = g.slice(1).map((x, i) => x - g[i]); const m = Math.min(...d); return d.map(x => +(x / m).toFixed(2)).join(':'); };
    const sameShape = f && ratios(propGrid) === ratios(builtGrid16);
    const sameTup = f && (!!f.tupletBeats === builtTup);
    let verdict = !f ? 'NO FIT' : (sameShape && sameTup) ? 'AGREES' : sameShape ? 'same shape, tuplet differs' : 'DIFFERS';
    // pickup check: does the analyser flag it when run on ALL members?
    let pickupNote = '';
    if (pickups.length && onsMain.length >= 2 && f) {
      const all = PF.fit(members.map(m => m.e.onset));
      const rel = (pickups[0].e.onset - onsMain[0]) / f.unit, miss = Math.abs(rel - Math.round(rel)) * f.unit;
      pickupNote = '   pickup: built has ' + pickups.length + '; analyser sees note 1 ' + ms(miss) + ' ms off the main grid (' + (miss > PF.DEFAULTS.HEAD_SECONDS ? 'would FLAG' : 'would NOT flag — under a head') + ')';
    }
    total++; if (verdict === 'AGREES') agree++;
    rows.push({ cid, part: partOf.get(members[0].e.id), n: ons.length, t0: ons[0], verdict, built: builtGrid16, builtUnit: built.unit, f, pickupNote });
  }
  console.log('VALIDATION — the analyser against ' + rows.length + ' decided figures (shapes compared as gap ratios; pickups excluded)');
  console.log('');
  for (const r of rows) {
    console.log(r.cid.padEnd(6) + 'T' + String(r.part + 1).padEnd(3) + String(r.n).padStart(2) + ' notes @' + r.t0.toFixed(2) + '   ' + r.verdict);
    console.log('       built:    unit ' + ms(r.builtUnit) + ' ms  grid ' + r.built.join(','));
    console.log('       proposed: ' + (r.f ? ('unit ' + ms(r.f.unit) + ' ms  ' + fmtFit(r.f)) : 'NO FIT'));
    if (r.f && r.verdict !== 'AGREES') console.log('       shape:    ' + r.f.shape + '   gaps ' + r.f.gapsMs.join('|') + ' = ' + r.f.gapCategories.join('·'));
    if (r.pickupNote) console.log('    ' + r.pickupNote);
  }
  console.log('');
  console.log(agree + ' of ' + total + ' agree outright.');
  process.exit(0);
}

// ---------- a fresh span ----------
const part = parseInt(arg('part'), 10);
const sp = String(arg('span', '')).match(/^([\d.]+)-([\d.]+)$/);
if (isNaN(part) || !sp) { console.error('usage: --ir <id> (--validate | --part N --span t0-t1)'); process.exit(2); }
const notes = evs.filter(e => partOf.get(e.id) === part && e.onset >= +sp[1] - 1e-9 && e.onset <= +sp[2] + 1e-9);
if (notes.length < 2) { console.error('fewer than 2 notes in the span'); process.exit(2); }
console.log('T' + (part + 1) + '  ' + notes.length + ' notes  ' + notes[0].onset.toFixed(3) + ' – ' + notes[notes.length - 1].onset.toFixed(3));
const gaps = notes.slice(1).map((e, i) => e.onset - notes[i].onset);
console.log('gaps: ' + gaps.map(g => ms(g)).join(' | ') + ' ms');

// seams: a gap of a breath or more is a seam (a go is possible there)
const groups = [[notes[0]]];
for (let i = 1; i < notes.length; i++) { if (gaps[i - 1] >= BREATH) groups.push([]); groups[groups.length - 1].push(notes[i]); }
console.log('breath seams (>= ' + ms(BREATH) + ' ms): ' + (groups.length - 1) + ' → ' + groups.map(g => g.length).join(' + ') + ' notes');
console.log('');

for (const g of groups) {
  const ons = g.map(e => e.onset);
  const label = g.length + ' notes @' + ons[0].toFixed(2);
  if (g.length === 1) { console.log(label + ' — a lone one-shot'); console.log(''); continue; }
  const f = PF.fit(ons);
  console.log('GROUP ' + label + (ons.length > 1 ? '   gaps ' + ons.slice(1).map((t, i) => ms(t - ons[i])).join('|') + ' = ' + (f ? f.gapCategories.join(' · ') : '') : ''));
  if (!f) { console.log('   no writing found'); console.log(''); continue; }
  console.log('   BEST:  ' + fmtFit(f));
  console.log('          ' + f.shape);
  for (const a of f.alternatives) console.log('   also:  ' + fmtFit(a) + '   ' + a.shape);
  // pickup proposal: first note under a breath from the second AND off the best grid of the rest by more than a head
  if (g.length >= 3) {
    const rest = PF.fit(ons.slice(1));
    if (rest && rest.coherent) {
      const relSlot = (ons[0] - ons[1]) / rest.unit, miss = Math.abs(relSlot - Math.round(relSlot)) * rest.unit;
      if (miss > PF.DEFAULTS.HEAD_SECONDS || rest.heads < f.heads - 0.3)
        console.log('   PICKUP? note 1 is ' + ms(ons[1] - ons[0]) + ' ms before note 2 and sits ' + ms(miss) + ' ms off the grid of notes 2-' + g.length +
          ' (which fit at ' + rest.heads.toFixed(1) + ' heads vs ' + f.heads.toFixed(1) + ' with it) — FLAGGED for the composer\'s ear, not applied');
    }
  }
  console.log('');
}
