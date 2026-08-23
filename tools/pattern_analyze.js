#!/usr/bin/env node
// pattern_analyze.js — the D63 analyser at the command line.
//
//   node tools/pattern_analyze.js --ir db1-all-x01 --validate
//       every decided figure in the IR: what the analyser proposes vs what
//       was built. A disagreement is a finding, not a failure — it is either
//       a case the rule gets wrong or a case the composer's ear did something
//       the rule should learn.
//   node tools/pattern_analyze.js --ir db1-c2i-x01 --part 0 --span 36.0-40.4
//       a fresh span: breath seams, then each gesture cut into its FIGURES
//       (8g) — words first, then each figure's writing, then the flags.
//
// 8g (day 27): a gesture is no longer forced onto one grid. segment() cuts it
// where the PACE CHANGES and fits each figure alone — standards principle 6,
// "group first, grid second; figures need not share a tempo". The old
// one-grid reading is still printed, LAST, as "also", so the two can be
// compared on the same page.
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
const NUM = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];

// ---------- validate: the decided figures ----------
if (flag('validate')) {
  const byCl = new Map();
  for (const o of ir.overlays) {
    const d = o.value.device; if (!d || !d.clusterId) continue;
    const e = ir.events.find(x => x.id === o.target.event);
    if (!byCl.has(d.clusterId)) byCl.set(d.clusterId, []);
    byCl.get(d.clusterId).push({ e, d });
  }
  // A CLUSTER MAY NOW HOLD SEVERAL FIGURES, each on its own grid (8g,
  // --figures). Validation compares GRIDS, so the unit of comparison is the
  // figure, not the cluster: members are split by device.gridId where one is
  // present. A cluster built before 8g has no gridId and stays one unit, so
  // the day-24 count is unchanged.
  const units = [];
  for (const [cid, members] of [...byCl].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
    members.sort((a, b) => a.e.onset - b.e.onset);
    const ids = [...new Set(members.map(m => m.d.gridId).filter(Boolean))];
    if (ids.length <= 1) { units.push({ label: cid, members }); continue; }
    for (const gid of ids) units.push({ label: cid + ' ' + gid.replace(cid + '-', ''), members: members.filter(m => m.d.gridId === gid) });
  }
  let agree = 0, total = 0;
  const rows = [];
  for (const { label, members } of units) {
    const ons = members.map(m => m.e.onset);
    // the built writing, as a PATTERN: gap ratios in 16ths, pickups excluded
    const main = members.filter(m => !m.d.pickup);
    const pickups = members.filter(m => m.d.pickup);
    if (!main.length) continue;
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
    rows.push({ cid: label, part: partOf.get(members[0].e.id), n: ons.length, t0: ons[0], verdict, built: builtGrid16, builtUnit: built.unit, f, pickupNote });
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
  const s = PF.segment(ons);
  if (!s) { console.log('GESTURE ' + label + ' — no writing found'); console.log(''); continue; }

  // ---- WORDS FIRST. The composer reads shapes, not tables (day 24).
  console.log('GESTURE ' + label + '   pace families: ' +
    s.paceBands.map(b => b.notes + ' gap' + (b.notes > 1 ? 's' : '') + ' ' + b.minMs + (b.maxMs !== b.minMs ? '-' + b.maxMs : '') + ' ms').join(' · '));
  console.log('   ' + (NUM[s.figures.length] || s.figures.length) + ' FIGURE' + (s.figures.length > 1 ? 'S' : '') + ':   ' + s.words);
  console.log('');
  s.figures.forEach((f, i) => {
    const ff = f.fit;
    console.log('   ' + (i + 1) + '.  notes ' + (f.from + '-' + f.to).padStart(6).padEnd(7) + '@' + f.onsets[0].toFixed(2) + '   ' + f.words.padEnd(23) +
      (ff ? (('♩=' + ff.bpm.toFixed(0)).padEnd(8) + (ff.heads.toFixed(1) + ' heads').padEnd(11) + ff.shape +
        (ff.tupletBeats ? ('   TUPLET ' + ff.beats.filter(b => b.tuplet).map(b => 'beat' + b.beat + ':' + b.tuplet).join(',')) : '') +
        (ff.coherent === false ? '   [OVER A HEAD]' : '')) : 'NO FIT'));
  });
  console.log('');

  // ---- FLAGS: never applied, always said out loud
  const flags = [];
  // ONE LINE PER NOTE IN QUESTION, closest call first, four at most. Every
  // near-tie is about a note that could sit on either side of a seam, and both
  // directions name the same note — printing both read as duplication.
  const byNote = new Map();
  for (const t of s.nearTies) {
    const note = t.kind === 'cut' ? t.afterNote : t.afterNote + 1;
    if (!byNote.has(note) || t.delta < byNote.get(note).delta) byNote.set(note, t);
  }
  [...byNote].sort((a, b) => a[1].delta - b[1].delta || a[0] - b[0]).slice(0, 4).forEach(([note, t]) => {
    flags.push('note ' + note + ' could go either way — ' + (t.kind === 'cut' ? 'keeping it with the next figure' : 'moving it to the previous figure') +
      ' costs only +' + t.delta.toFixed(2) + ' (the ' + t.gapMs + ' ms gap after note ' + t.afterNote + ')');
  });
  if (byNote.size > 4) flags.push('(' + (byNote.size - 4) + ' further boundary' + (byNote.size - 4 > 1 ? 'ies' : '') + ' near-tied as well — this gesture has several equally good readings)');
  // a pickup is asked PER FIGURE now: is the figure's first note off the grid
  // of the rest of it? (standards: "AI may propose a pickup but must flag it")
  s.figures.forEach((f, i) => {
    if (f.notes < 3) return;
    const rest = PF.fit(f.onsets.slice(1));
    if (!rest || !rest.coherent || !f.fit) return;
    const relSlot = (f.onsets[0] - f.onsets[1]) / rest.unit, miss = Math.abs(relSlot - Math.round(relSlot)) * rest.unit;
    if (miss > PF.DEFAULTS.HEAD_SECONDS || rest.heads < f.fit.heads - 0.3)
      flags.push('note ' + f.from + ' may be a PICKUP into figure ' + (i + 1) + ' — it is ' + ms(f.onsets[1] - f.onsets[0]) +
        ' ms before note ' + (f.from + 1) + ' and sits ' + ms(miss) + ' ms off the grid of the rest (' + rest.heads.toFixed(1) +
        ' heads without it vs ' + f.fit.heads.toFixed(1) + ' with) — FLAGGED, not applied');
  });
  // the deferred tuplet-vs-dotted question, raised only where it is live
  s.figures.forEach((f, i) => {
    if (!f.fit || !f.fit.tupletBeats || !f.dotted || !f.dotted.coherent || !f.dotted.dottedCount) return;
    flags.push('figure ' + (i + 1) + ' is written with a tuplet (' + f.fit.beats.filter(b => b.tuplet).map(b => b.tuplet + ':4').join(',') +
      ', ' + f.fit.heads.toFixed(1) + ' heads); it could instead be ' + f.dotted.shape + ' at ' + f.dotted.heads.toFixed(1) +
      ' heads — no 32nd head, but a half-16th grid. DEFERRED to the page (composer, day 26)');
  });
  if (flags.length) { console.log('   FLAGS'); for (const x of flags) console.log('    · ' + x); console.log(''); }

  if (s.alternatives.length) {
    console.log('   ALSO POSSIBLE');
    for (const a of s.alternatives.slice(0, 3))
      console.log('    · cut after ' + (a.cuts.join(', ') || 'nothing') + '  (+' + a.delta.toFixed(2) + ')   ' + a.words);
    console.log('');
  }

  // ---- THE SINGLE GRID LAST, for comparison only (this is what the tool
  // printed FIRST before 8g, and what T1 showed was the wrong frame).
  console.log('   also, as ONE grid (the pre-8g reading):');
  console.log('      ' + fmtFit(s.single));
  if (s.single) {
    const worstFig = Math.max.apply(null, s.figures.map(f => f.fit ? f.fit.heads : 0));
    const tup = s.figures.reduce((a, f) => a + (f.fit ? f.fit.tupletBeats : 0), 0);
    console.log('      the ' + s.figures.length + ' figures need ' + (tup ? tup + ' tuplet beat(s)' : 'NO tuplet at all') +
      ' and nothing past ' + worstFig.toFixed(1) + ' heads' +
      '   (cost ' + s.total.toFixed(2) + ' vs ' + (s.singleCost == null ? '?' : s.singleCost.toFixed(2)) + ' for the one grid)');
  }
  console.log('');
}
