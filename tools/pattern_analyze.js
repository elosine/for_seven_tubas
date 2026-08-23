#!/usr/bin/env node
// pattern_analyze.js — the D63 analyser at the command line.
//
//   node tools/pattern_analyze.js --ir db1-all-x01 --validate
//       every decided figure in the IR: what the analyser proposes vs what
//       was built. A disagreement is a finding, not a failure — it is either
//       a case the rule gets wrong or a case the composer's ear did something
//       the rule should learn.
//   node tools/pattern_analyze.js --ir db1-c2i-x01 --part 0 --span 36.0-40.4
//       a fresh span: breath seams, then each gesture cut into GROUPS at its
//       pace changes (8h) and written on ONE GRID (8i) — words first, then the
//       writing group by group with its brackets, then the flags, then each
//       group on its own grid LAST as the alternative.
//       --paceRatio 1.31   move the threshold that decides where a cut MAY land
//       --cuts 2,5,7,10,14 name the seams by hand; the rule steps aside (8h).
//                          Notes are numbered from 1 within the gesture, so the
//                          span must hold exactly one.
//   node tools/pattern_analyze.js --ir db1-c2i-x01 --scan 36.19-40.42
//       THE PRE-READ MEASUREMENT (8i): one row per gesture, every part — the
//       groups, the one grid's unit and heads, its brackets, and the flags that
//       need a hand (over a head, a straddle, no clean seam, a ratio tie, flow).
//
// 8g/8h (days 27-28): a gesture is cut into GROUPS where the PACE CHANGES — the
// seam is the slower gap, and the boundary note goes with the quick side (D68).
// 8i (day 28, D69): those groups are then written on ONE GRID with the beams
// broken at the seams, because a pace change must be SAID on the page — the
// bracket on the quick group is the message. Each group on its own grid is
// printed LAST, as the by-hand alternative where one grid cannot hold the
// gesture under a head.
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
// a cut set as the groups it makes: 2,5 over 7 notes -> [1,2]+[3,4,5]+[6,7]
const groupsOf = (cuts, n) => {
  const out = []; let s = 1;
  for (const c of (cuts || [])) { out.push([s, c]); s = c + 1; }
  out.push([s, n]);
  return out.map(([a, b]) => '[' + (b - a <= 3 ? Array.from({ length: b - a + 1 }, (_, i) => a + i).join(',') : a + '-' + b) + ']').join('+');
};

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

// ---------- the two ways to overrule the segmenter (8h) ----------
// --paceRatio moves the threshold that decides where a cut MAY land; --cuts
// names the seams outright and the rule steps aside. --cuts numbers notes from
// 1 within the gesture, so it is refused when the span holds more than one — a
// silent mis-application would be worse than an error.
const CUTS = String(arg('cuts', '')).trim();
const cutsArr = CUTS ? CUTS.split(',').map(x => parseInt(x.trim(), 10)) : null;
if (cutsArr && cutsArr.some(x => !Number.isInteger(x))) { console.error('--cuts wants whole note numbers, e.g. --cuts 2,5,7,10,14'); process.exit(2); }
const PACE = parseFloat(arg('paceRatio', '0'));
const segOptTop = {};
if (PACE > 1) segOptTop.PACE_RATIO = PACE;
if (cutsArr && process.argv.includes('--scan')) { console.error('--cuts names the seams inside ONE gesture; --scan sweeps many. Use --part/--span for a hand reading'); process.exit(2); }
// ---------- the gestures inside a span (shared by --span and --scan) ----------
// A gesture ends at a BREATH: a gap of `breathSeconds` or more is a place a
// player can go again, so it is where one gesture stops and the next starts.
// Everything below (segmentation, the one-grid writing) happens INSIDE one.
const gesturesIn = (part, t0, t1) => {
  const notes = evs.filter(e => partOf.get(e.id) === part && e.onset >= t0 - 1e-9 && e.onset <= t1 + 1e-9);
  if (notes.length < 2) return [];
  const gp = notes.slice(1).map((e, i) => e.onset - notes[i].onset);
  const out = [[notes[0]]];
  for (let i = 1; i < notes.length; i++) { if (gp[i - 1] >= BREATH) out.push([]); out[out.length - 1].push(notes[i]); }
  return out;
};

// THE WRITING OF ONE GROUP ON THE SINGLE GRID, in values and brackets:
// "16th 16th" · "7:4 [16th 16th 16th]" · "16th + 7:4 [16th 16th 16th]".
// Every head is a 16th (day 23, the composer's midway solution); what the
// bracket adds is the RELATION — which is the whole of D69.
const groupWriting = (bvg, g) => {
  const brOf = i => (bvg.brackets.find(b => i >= b.notes[0] && i <= b.notes[1]) || null);
  const runs = []; let run = null;
  for (let i = g.from; i <= g.to; i++) {
    const b = brOf(i), k = b ? 'b' + b.beat : 'plain';
    if (!run || run.k !== k) { run = { k: k, b: b, n: 0 }; runs.push(run); }
    run.n++;
  }
  return runs.map(r => {
    const v = Array(r.n).fill('16th').join(' ');
    return r.b ? (r.b.text + ' [' + v + ']') : v;
  }).join(' + ');
};

// ---------- --scan t0-t1 : THE PRE-READ MEASUREMENT (8i) ----------
// One row per gesture in the span, every part. The question it answers is the
// one the reads open with: CAN THIS GESTURE BE SAID ON ONE GRID? Under D69 the
// bracket is the message, so "how many figures need a tuplet" is no longer a
// score — it only measured how finely the material had been cut. What matters
// now is whether the ONE grid stays within a head (the eye's mental rounding),
// and whether any bracket crosses a seam and says "quicker" about two groups.
const scanSp = String(arg('scan', '')).match(/^([\d.]+)-([\d.]+)$/);
if (scanSp) {
  const t0 = +scanSp[1], t1 = +scanSp[2];
  const parts = [...new Set(ir.chunks.map(c => c.part))].sort((a, b) => a - b);
  const rows = [];
  for (const p of parts) for (const g of gesturesIn(p, t0, t1)) {
    if (g.length < 2) { rows.push({ part: p, t0: g[0].onset, n: 1, lone: true }); continue; }
    const s = PF.segment(g.map(e => e.onset), Object.keys(segOptTop).length ? segOptTop : undefined);
    if (!s) { rows.push({ part: p, t0: g[0].onset, n: g.length, noFit: true }); continue; }
    const bvg = PF.bracketsVsGroups(s.single, s.cuts);
    const flowPairs = [];
    for (let i = 0; i + 1 < s.figures.length; i++) {
      const fl = PF.flow(s.figures[i], s.figures[i + 1]);
      if (fl && fl.fits) flowPairs.push((i + 1) + '+' + (i + 2));
    }
    rows.push({
      part: p, t0: g[0].onset, n: g.length, cuts: s.cuts, groups: s.figures.length,
      unit: s.single ? Math.round(s.single.unit * 1000) : null,
      heads: s.single ? s.single.heads : null,
      tupBeats: s.single ? s.single.beats.filter(b => b.tuplet).length : 0,
      brackets: bvg ? bvg.brackets.map(b => b.text).join(' ') : '',
      over: s.single ? s.single.coherent === false : true,
      straddles: bvg ? bvg.straddles.length : 0,
      noSeam: !!s.noSeam, ratioTies: s.ratioTies.length, flow: flowPairs.join(','),
    });
  }
  console.log('SCAN  ' + arg('ir') + '  ' + t0.toFixed(2) + '-' + t1.toFixed(2) + '  — can each gesture be said on ONE grid? (8i)');
  console.log('');
  console.log('part  t0      notes  groups (cuts)          unit  heads  brackets      flags');
  for (const r of rows) {
    const head = ('T' + (r.part + 1)).padEnd(6) + r.t0.toFixed(2).padEnd(8);
    if (r.lone) { console.log(head + '    1  a lone one-shot'); continue; }
    if (r.noFit) { console.log(head + String(r.n).padStart(5) + '  NO READING FOUND'); continue; }
    const flags = [];
    if (r.over) flags.push('OVER A HEAD');
    if (r.straddles) flags.push(r.straddles + ' STRADDLE' + (r.straddles > 1 ? 'S' : ''));
    if (r.noSeam) flags.push('no clean seam');
    if (r.ratioTies) flags.push(r.ratioTies + ' ratio tie' + (r.ratioTies > 1 ? 's' : ''));
    if (r.flow) flags.push('flow ' + r.flow);
    console.log(head + String(r.n).padStart(5) + '  ' +
      (r.groups + ' (' + (r.cuts.join(',') || '—') + ')').padEnd(22) +
      String(r.unit).padStart(4) + '  ' + r.heads.toFixed(2).padStart(5) + '  ' +
      (r.brackets || 'plain').padEnd(13) + ' ' + flags.join(' · '));
  }
  const real = rows.filter(r => !r.lone && !r.noFit);
  const over = real.filter(r => r.over);
  console.log('');
  console.log('SUMMARY — ' + real.length + ' gesture(s)');
  console.log('  one grid WITHIN a head: ' + (real.length - over.length) + '   ·   OVER a head: ' + over.length +
    (over.length ? ('  → ' + over.map(r => 'T' + (r.part + 1) + ' @' + r.t0.toFixed(2) + ' (' + r.heads.toFixed(1) + ')').join(', ')) : ''));
  const st = real.filter(r => r.straddles);
  console.log('  brackets straddling a seam: ' + st.length +
    (st.length ? ('  → ' + st.map(r => 'T' + (r.part + 1) + ' @' + r.t0.toFixed(2)).join(', ')) : ''));
  const ns = real.filter(r => r.noSeam);
  console.log('  no clean seam: ' + ns.length + (ns.length ? ('  → ' + ns.map(r => 'T' + (r.part + 1) + ' @' + r.t0.toFixed(2)).join(', ')) : ''));
  const rt = real.filter(r => r.ratioTies);
  console.log('  ratio ties: ' + rt.length + (rt.length ? ('  → ' + rt.map(r => 'T' + (r.part + 1) + ' @' + r.t0.toFixed(2)).join(', ')) : ''));
  console.log('');
  console.log('The gestures OVER a head are the by-hand cases for the reads: --ownGrids, or split at a seam with --cuts.');
  process.exit(0);
}

// ---------- a fresh span ----------
const part = parseInt(arg('part'), 10);
const sp = String(arg('span', '')).match(/^([\d.]+)-([\d.]+)$/);
if (isNaN(part) || !sp) { console.error('usage: --ir <id> (--validate | --scan t0-t1 | --part N --span t0-t1 [--cuts a,b,c] [--paceRatio r])'); process.exit(2); }
const notes = evs.filter(e => partOf.get(e.id) === part && e.onset >= +sp[1] - 1e-9 && e.onset <= +sp[2] + 1e-9);
if (notes.length < 2) { console.error('fewer than 2 notes in the span'); process.exit(2); }
console.log('T' + (part + 1) + '  ' + notes.length + ' notes  ' + notes[0].onset.toFixed(3) + ' – ' + notes[notes.length - 1].onset.toFixed(3));
const gaps = notes.slice(1).map((e, i) => e.onset - notes[i].onset);
console.log('gaps: ' + gaps.map(g => ms(g)).join(' | ') + ' ms');

const groups = gesturesIn(part, +sp[1], +sp[2]);
console.log('breath seams (>= ' + ms(BREATH) + ' ms): ' + (groups.length - 1) + ' → ' + groups.map(g => g.length).join(' + ') + ' notes');
console.log('');

for (const g of groups) {
  const ons = g.map(e => e.onset);
  const label = g.length + ' notes @' + ons[0].toFixed(2);
  if (g.length === 1) { console.log(label + ' — a lone one-shot'); console.log(''); continue; }
  const opt = Object.assign({}, segOptTop);
  if (cutsArr) {
    if (groups.filter(x => x.length > 1).length > 1) {
      console.error('--cuts numbers notes inside ONE gesture, and this span holds ' +
        groups.filter(x => x.length > 1).length + ' — narrow the span to the gesture you mean'); process.exit(2);
    }
    const why = PF.cutsReason(ons.length, cutsArr, PF.SEG_DEFAULTS.MIN_FIGURE_NOTES);
    if (why) { console.error('--cuts ' + CUTS + ': ' + why); process.exit(2); }
    opt.CUTS = cutsArr;
  }
  const s = PF.segment(ons, opt);
  if (!s) { console.log('GESTURE ' + label + ' — no writing found'); console.log(''); continue; }
  const bvg = PF.bracketsVsGroups(s.single, s.cuts);
  // the words column is as wide as the widest words in THIS gesture: a fixed 23
  // ran "long medium short medium long" straight into the writing beside it
  const wCol = Math.max(23, ...s.figures.map(f => f.words.length)) + 2;

  // ---- WORDS FIRST. The composer reads shapes, not tables (day 24).
  console.log('GESTURE ' + label + '   pace families: ' +
    s.paceBands.map(b => b.notes + ' gap' + (b.notes > 1 ? 's' : '') + ' ' + b.minMs + (b.maxMs !== b.minMs ? '-' + b.maxMs : '') + ' ms').join(' · '));
  console.log('   ' + (NUM[s.figures.length] || s.figures.length) + ' GROUP' + (s.figures.length > 1 ? 'S' : '') + ':   ' + s.words);
  console.log('');

  // ---- THE WRITING, ONE GRID (8i, D69). This is what --figures builds and
  // what the composer chose: the groups are beam groups on ONE grid, and every
  // pace change is SAID as the bracket on the quick group.
  console.log('   THE WRITING — ONE GRID, beams broken at the seams (--figures):');
  console.log('      ' + fmtFit(s.single));
  if (bvg) bvg.groups.forEach((gr, i) => console.log('      ' + (i + 1) + '.  notes ' +
    (gr.from + '-' + gr.to).padStart(6).padEnd(7) + s.figures[i].words.padEnd(wCol) + groupWriting(bvg, gr)));
  if (s.single && s.single.coherent === false)
    console.log('      ONE GRID IS OVER A HEAD (' + s.single.heads.toFixed(1) + ') — the page cannot say the relation on one grid; ' +
      'by hand: --ownGrids, or split at a seam (--cuts) and build two clusters');
  console.log('');

  // ---- FLAGS: never applied, always said out loud
  const flags = [];
  // 8i — A STRADDLE FIRST. A bracket that covers half of one group and half of
  // the next says "quicker" about both, which is the one thing D69 forbids.
  for (const st of (bvg ? bvg.straddles : []))
    flags.push('STRADDLE: the ' + st.text + ' on beat ' + st.beat + ' covers notes ' + st.notes[0] + '-' + st.notes[1] +
      ', across the seam after note ' + st.seamAfter + ' — one bracket saying "quicker" about two groups. ' +
      'Move the seam (--cuts), or write it --ownGrids. FLAGGED, not fixed (composer, day 28: call A(a))');
  // 8h — THE SEAMS THEMSELVES come before anything about how a group is
  // written: where the cuts are is the bigger question, and the two ways the
  // rule can be unsure of them are structural, not matters of cost.
  const paceUsed = opt.PACE_RATIO || PF.SEG_DEFAULTS.PACE_RATIO;
  if (s.byHand) flags.push('CUTS BY HAND: after note ' + s.cuts.join(', ') + ' = ' + groupsOf(s.cuts, ons.length) +
    ' — the pace rule was not consulted; the writing is still fitted from the notes');
  if (s.noSeam) flags.push('NO CLEAN SEAM under the rule — every slow gap has a slower neighbour, so the only pace ' +
    'changes here are joins, not seams. This one is by ear; the one-grid writing above is what the tool can offer');
  // both sides of a ratio tie name the same flip, so they are printed as one
  // line: where the seam is now, and where it goes if the threshold moves;
  // grouped by the READING they lead to, not by boundary — several boundaries
  // moving together are one decision, and the threshold that matters is the
  // first one crossed
  const tieGroups = new Map();
  for (const t of s.ratioTies) {
    const k = (t.altCuts || []).join(',');
    if (!tieGroups.has(k)) tieGroups.set(k, { ratio: Infinity, altRatio: t.altRatio, altCuts: t.altCuts, because: null, here: [], there: [] });
    const tg = tieGroups.get(k);
    if (t.ratio < tg.ratio) { tg.ratio = t.ratio; tg.because = t.because; }
    (s.cuts.indexOf(t.afterNote) >= 0 ? tg.here : tg.there).push(t.afterNote);
  }
  for (const tg of tieGroups.values()) {
    const where = tg.because ? ' (where the ' + tg.because.slowMs + ' ms gap joins the ' + tg.because.quickMs + ' ms band)' : '';
    flags.push('RATIO TIE — ' + (tg.here.length
      ? 'the cut after ' + tg.here.join(' and ') + ' holds at pace ratio ' + paceUsed + ' only up to ' + tg.ratio.toFixed(3) + where +
        '; past that the seam is after ' + (tg.there.join(' and ') || 'nothing')
      : 'no seam is legal at pace ratio ' + paceUsed + ', but past ' + tg.ratio.toFixed(3) + where + ' one is — after ' + tg.there.join(' and ')) +
      ' — cuts ' + (tg.altCuts || []).join(',') + ' = ' + groupsOf(tg.altCuts, ons.length) +
      '.  --paceRatio ' + tg.altRatio + ' to see it — composer\'s call');
  }
  // ONE LINE PER NOTE IN QUESTION, closest call first, four at most. Every
  // near-tie is about a note that could sit on either side of a seam, and both
  // directions name the same note — printing both read as duplication.
  const byNote = new Map();
  for (const t of s.nearTies) {
    const note = t.kind === 'cut' ? t.afterNote : t.afterNote + 1;
    if (!byNote.has(note) || t.delta < byNote.get(note).delta) byNote.set(note, t);
  }
  [...byNote].sort((a, b) => a[1].delta - b[1].delta || a[0] - b[0]).slice(0, 4).forEach(([note, t]) => {
    flags.push('note ' + note + ' could go either way — ' + (t.kind === 'cut' ? 'keeping it with the next group' : 'moving it to the previous group') +
      ' costs only +' + t.delta.toFixed(2) + ' (the ' + t.gapMs + ' ms gap after note ' + t.afterNote + ')');
  });
  if (byNote.size > 4) flags.push('(' + (byNote.size - 4) + ' further boundary' + (byNote.size - 4 > 1 ? 'ies' : '') + ' near-tied as well — this gesture has several equally good readings)');
  // a pickup is asked PER GROUP: is the group's first note off the grid of the
  // rest of it? (standards: "AI may propose a pickup but must flag it")
  s.figures.forEach((f, i) => {
    if (f.notes < 3) return;
    const rest = PF.fit(f.onsets.slice(1));
    if (!rest || !rest.coherent || !f.fit) return;
    const relSlot = (f.onsets[0] - f.onsets[1]) / rest.unit, miss = Math.abs(relSlot - Math.round(relSlot)) * rest.unit;
    if (miss > PF.DEFAULTS.HEAD_SECONDS || rest.heads < f.fit.heads - 0.3)
      flags.push('note ' + f.from + ' may be a PICKUP into group ' + (i + 1) + ' — it is ' + ms(f.onsets[1] - f.onsets[0]) +
        ' ms before note ' + (f.from + 1) + ' and sits ' + ms(miss) + ' ms off the grid of the rest (' + rest.heads.toFixed(1) +
        ' heads without it vs ' + f.fit.heads.toFixed(1) + ' with) — FLAGGED, not applied');
  });
  if (flags.length) { console.log('   FLAGS'); for (const x of flags) console.log('    · ' + x); console.log(''); }

  // ---- FLOW (8h part B): could two adjacent groups share ONE tuplet relation
  // at a cleaner ratio than the fit's per-beat brackets? A FLAG ONLY — nothing
  // is built from it (composer, day 28: call B(a)). Taken by hand where wanted,
  // with --tuplet a-b@3:2 on the shared grid.
  const flowLines = [];
  for (let i = 0; i + 1 < s.figures.length; i++) {
    const fl = PF.flow(s.figures[i], s.figures[i + 1]);
    if (!fl || !fl.fits) continue;
    flowLines.push('groups ' + (i + 1) + '+' + (i + 2) + ' could share ONE grid at ' + fl.unitMs + ' ms — ' +
      fl.shape + ' — worst ' + fl.worstMs + ' ms = ' + fl.heads.toFixed(2) + ' heads' +
      (fl.coherent === false ? '   [OVER A HEAD]' : '') + '; the ' + fl.target + ' bracket is what says "quicker"');
  }
  if (flowLines.length) {
    console.log('   FLOW (a flag only — nothing is built from it; --tuplet a-b@3:2 by hand)');
    for (const x of flowLines) console.log('    · ' + x);
    console.log('');
  }

  if (s.alternatives.length) {
    console.log('   ALSO POSSIBLE');
    for (const a of s.alternatives.slice(0, 3))
      console.log('    · cut after ' + (a.cuts.join(', ') || 'nothing') + '  (+' + a.delta.toFixed(2) + ')   ' + a.words);
    console.log('');
  }

  // ---- LAST, THE ALTERNATIVE: each group on its OWN grid (the 8g reading).
  // Under D69 this is no longer the default — a group written as plain 16ths on
  // its own grid prints no relation, so the page's VALUES say "same" where its
  // SPACING says "different". Kept because it is the by-hand answer where one
  // grid cannot hold the gesture under a head.
  console.log('   also, each group on its OWN grid (--ownGrids, the 8g reading — no relation printed between them):');
  s.figures.forEach((f, i) => {
    const ff = f.fit;
    console.log('      ' + (i + 1) + '.  notes ' + (f.from + '-' + f.to).padStart(6).padEnd(7) + '@' + f.onsets[0].toFixed(2) + '   ' + f.words.padEnd(wCol) +
      (ff ? (('♩=' + ff.bpm.toFixed(0)).padEnd(8) + (ff.heads.toFixed(1) + ' heads').padEnd(11) + ff.shape +
        (ff.tupletBeats ? ('   TUPLET ' + ff.beats.filter(b => b.tuplet).map(b => 'beat' + b.beat + ':' + b.tuplet).join(',')) : '') +
        (ff.coherent === false ? '   [OVER A HEAD]' : '')) : 'NO FIT'));
  });
  // the deferred tuplet-vs-dotted question, raised only where a group carries
  // its OWN tuplet under this reading
  s.figures.forEach((f, i) => {
    if (!f.fit || !f.fit.tupletBeats || !f.dotted || !f.dotted.coherent || !f.dotted.dottedCount) return;
    console.log('      group ' + (i + 1) + ' carries its own tuplet here (' + f.fit.beats.filter(b => b.tuplet).map(b => b.tuplet + ':4').join(',') +
      ', ' + f.fit.heads.toFixed(1) + ' heads); it could instead be ' + f.dotted.shape + ' at ' + f.dotted.heads.toFixed(1) +
      ' heads — no 32nd head, but a half-16th grid. DEFERRED to the page (composer, day 26)');
  });
  console.log('');
}
