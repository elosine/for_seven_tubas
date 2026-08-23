#!/usr/bin/env node
// notate_section.js — V3: THE TRIAL-INSERTION LOOP, one command.
// Score name + window + profile -> extracted IR + validation + picker
// entry. The composer-score insert loop, ported to notation trials: after
// this, the section is one dropdown pick away in the container windows.
// Unhandled material renders as parachute bricks BY DESIGN — mixed
// fidelity always ships.
//
//   node tools/notate_section.js --score piece-s25-finished01 --w0 0 --w1 40
//        [--parts 0-9] [--profile trance|section1] [--id slug] [--label text]
//        [--exp]
//
// NOTATION-WORKFLOW additions (day 22 — the version-file system, option A1):
//   --from <id> --id <new>   fork an existing IR into a new version file
//                            (experiment saves: db1-T3-x01, x02, ...);
//                            content copied verbatim, re-validated, own
//                            picker entry. Edit the fork's file directly —
//                            the app hot-reloads it within ~1 s.
//   --exp                    group the entry under "experiments" in the picker
//   --bricks                 every chunk unresolved: bricks everywhere + per-note devices (working files)
//   --cluster t0-t1[@part]   mark a span as one beamed cluster (repeatable; authored
//                            overlays). THE MODIFIERS BELOW ARE POSITIONAL: each applies
//                            to the --cluster that precedes it (day 24, two clusters in
//                            one file). Was: mark a span as one beamed cluster (authored
//                            overlays). @part (0-based lane) confines it to ONE part —
//                            required in an all-parts file, where a bare span would sweep
//                            every lane's notes in that window into one beam group.
//   --accents 4,7,8          cluster members (1-based) carrying an accent
//   --dyn 1,9,12:fff         cluster members carrying a dynamic (bare = its band; n:mark = explicit)
//   --beamBreak 9            member(s) that start a NEW beam group inside the same cluster/tempo
//   --tuplet 10-11@3:2       members 10-11 form a 3:2 tuplet; spare slots become rests in the bracket
//   --beam t0-t1@part        beam the notes in a span WITHOUT making them a cluster:
//                            each keeps its own technique device (head, ring bar,
//                            dynamic) and only gains a stem to a shared beam. No
//                            tempo fit, no grid, no rests. Repeatable.
//   --noGc wc-98[,wc-…]      drop the GC from named objects (per-note device override)
//   --noGoLine               drop the go line from this cluster (day 24 principle: THE GO LINE
//                            MARKS DISPLACEMENT — a head already sitting on its go time does not
//                            need one). Applied per cluster while the composer reviews each.
//   --pickup N               the first N members are a PICK-UP: the tempo is fitted to the
//                            REST of the cluster and the pick-up is placed on that grid
//                            before position 0 (negative slots). The GC and go line move
//                            to the first member AFTER the pick-up — the downbeat.
//   --trueDurations          write 8ths/16ths by gap instead of all-16ths-plus-rests
//   --beamThrough 2          beam group N keeps its secondary beam unbroken across rests
//   --clusterTol <s>         metric tolerance for the cluster fit (default 0.030)
//   --prune <id>             remove an IR + its picker entry (git keeps history)
//
// Steps: extract (extract_core, same as ir_extract.js) -> validate
// (ir_validate.js --against-source --complete, an INDEPENDENT process) ->
// write notation/ir/<id>.ir.json -> update notation/ir/index.json (the
// manifest the app's picker reads). Refresh the app; the section is there.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Extract = require(path.join(ROOT, 'notation', 'lib', 'extract_core.js'));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}
const flag = name => process.argv.includes('--' + name);
const manifestPath = path.join(ROOT, 'notation', 'ir', 'index.json');
const readManifest = () => fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { irs: [] };
const writeManifest = m => fs.writeFileSync(manifestPath, JSON.stringify(m, null, 1));

// ---- --prune: remove a version file + its picker entry ----
const pruneId = arg('prune');
if (pruneId) {
  const file = path.join(ROOT, 'notation', 'ir', pruneId + '.ir.json');
  const manifest = readManifest();
  const had = manifest.irs.some(e => e.id === pruneId);
  manifest.irs = manifest.irs.filter(e => e.id !== pruneId);
  writeManifest(manifest);
  const existed = fs.existsSync(file);
  if (existed) fs.unlinkSync(file);
  console.log('PRUNED ' + pruneId + ' — file ' + (existed ? 'removed' : 'absent') +
    ', manifest entry ' + (had ? 'removed' : 'absent') + ' (git history keeps both)');
  process.exit(0);
}

// ---- --from: fork an existing IR into a new version file ----
const fromId = arg('from');
if (fromId) {
  const id = arg('id');
  if (!id) { console.error('--from needs --id <new-version-id>'); process.exit(2); }
  const srcFile = path.join(ROOT, 'notation', 'ir', fromId + '.ir.json');
  const doc = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  doc.id = id;
  const outRel = 'notation/ir/' + id + '.ir.json';
  fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(doc, null, 1));
  // --demo: schema/structure validation only — demo forks deliberately edit
  // musical content (pitches for device exercises) and would rightly fail
  // the against-source cross-check; they are visual test-benches, not piece
  // data, and must say so in their label.
  const vArgs = flag('demo') ? [] : ['--against-source', '--complete'];
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'ir_validate.js'), outRel, ...vArgs],
      { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    fs.unlinkSync(path.join(ROOT, outRel));
    console.error('VALIDATION FAILED — fork removed:\n' + String(e.stdout || '') + String(e.stderr || ''));
    process.exit(1);
  }
  const manifest = readManifest();
  const src = manifest.irs.find(e => e.id === fromId) || {};
  const label = arg('label', id + ' (from ' + fromId + ')');
  manifest.irs = manifest.irs.filter(e => e.id !== id);
  manifest.irs.push({
    id, label, score: src.score || (doc.source && doc.source.score),
    window: src.window || (doc.source && doc.source.window),
    profile: src.profile, exp: flag('exp') || src.exp || undefined, from: fromId,
  });
  writeManifest(manifest);
  console.log('FORKED ' + fromId + ' -> ' + id + ' · VALID · in the picker as "' + label + '"' +
    (flag('exp') || src.exp ? ' [experiments]' : ''));
  console.log('  edit ' + outRel + ' directly — the open notation page picks changes up within ~1 s');
  process.exit(0);
}

// ---- normal extract mode ----
const scoreName = arg('score');
const w0 = parseFloat(arg('w0')), w1 = parseFloat(arg('w1'));
if (!scoreName || isNaN(w0) || isNaN(w1)) {
  console.error('usage: notate_section.js --score <name> --w0 <s> --w1 <s> [--parts 0-9] [--profile trance|section1] [--id slug] [--label text] [--exp]\n' +
    '       notate_section.js --from <id> --id <new> [--label text] [--exp]\n' +
    '       notate_section.js --prune <id>');
  process.exit(2);
}
const partsArg = arg('parts', '0-9');
const parts = partsArg.includes('-') && !partsArg.includes(',')
  ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(partsArg.split('-').map(Number))
  : partsArg.split(',').map(Number);
const profile = arg('profile', 'trance');
const id = arg('id', (scoreName + '-' + w0 + '-' + w1).replace(/[^a-zA-Z0-9-]/g, '-'));
const label = arg('label', id + ' (' + profile + ')');
const outRel = 'notation/ir/' + id + '.ir.json';

const score = JSON.parse(fs.readFileSync(path.join(ROOT, 'scores', scoreName + '.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const sampleLengths = JSON.parse(fs.readFileSync(path.join(ROOT, 'bank', 'sample_lengths.json'), 'utf8'));
// THE FIGURE STANDARDS (day 24): every --cluster / --beam overlay is built
// from registry data, so the rules survive a cleared chat. Edit the registry,
// not this file, to change how a figure is drawn.
const FIG = (JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'container.json'), 'utf8')).engraving.layout.figures) || {};
const FIG_CL = FIG.cluster || {}, FIG_BM = FIG.beam || {};

const { doc, warnings } = Extract.extract(score, {
  scoreName, window: [w0, w1], parts, id, registry, sampleLengths, profile, options: {},
  date: new Date().toISOString().slice(0, 10),
  toolName: 'tools/notate_section.js (profile ' + profile + ')' + (flag('bricks') ? ' --bricks' : ''),
});
// --bricks (day 23, the composer's working loop — "bricks and the midi sound
// all the way through"): every chunk stays UNRESOLVED, so the page shows the
// parachute bricks everywhere and each note carries its technique's device;
// no bars, no beams. The chunker's grouping is not lost — it is simply not
// applied; a plain re-extract without --bricks brings it back. Working files
// only (the canonical extraction keeps the chunker's strategies).
// --cluster t0-t1 (day 23, the composer's working loop): mark a span as ONE
// beamed cluster. The tool RUNS THE TEMPO FIT (the same exhaustive search as
// tools/cluster_tempo.js), so the drawn rhythm follows the analysis rather
// than a guess: unit, grid positions, how many beams, where the rests go.
// Each member gets an engraving overlay carrying the cluster device; the
// FIRST member additionally gets the GC and the go line — "the GC only on the
// first one, though, so it launches the whole cluster" (composer).
// Repeatable. Written at EXTRACTION so a re-extract keeps it.
{
  // POSITIONAL MODIFIERS (day 24, the moment a file held TWO clusters): every
  // --cluster collects the --clusterTol / --accents / --dyn / --beamBreak /
  // --beamThrough / --tuplet flags that FOLLOW it, up to the next --cluster.
  // Before this they were global, and T2's cluster silently inherited T1's
  // accents and a tuplet over members it did not have. A modifier before any
  // --cluster is an error, not a default.
  const BOOL_MODS = new Set(['--noGoLine']);
  const MODS = new Set(['--clusterTol', '--accents', '--dyn', '--beamBreak', '--beamThrough', '--tuplet', '--pickup', '--noGoLine']);
  const spans = [];
  for (let i = 0; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === '--cluster') {
      const m = String(process.argv[i + 1] || '').match(/^([\d.]+)-([\d.]+)(?:@(\d+))?$/);
      if (!m) { console.error('--cluster needs t0-t1 or t0-t1@part (e.g. --cluster 31.49-33.59@0)'); process.exit(2); }
      spans.push({ sp: [parseFloat(m[1]), parseFloat(m[2]), m[3] === undefined ? null : parseInt(m[3], 10)], mods: [] });
      i++; continue;
    }
    if (MODS.has(a)) {
      if (!spans.length) { console.error(a + ' must follow the --cluster it modifies'); process.exit(2); }
      // BOOLEAN modifiers carry no value — consuming the next argv as their
      // 'value' would swallow the flag after them (e.g. --noGoLine --dyn 1:mf
      // would eat --dyn and silently drop the dynamic).
      if (BOOL_MODS.has(a)) { spans[spans.length - 1].mods.push([a, '']); continue; }
      spans[spans.length - 1].mods.push([a, String(process.argv[i + 1] || '')]);
      i++;
    }
  }
  // ONE implementation of the fit, shared with tools/cluster_tempo.js
  const ClusterFit = require(path.join(ROOT, 'notation', 'lib', 'cluster_fit.js'));
  // event -> part, off the chunks (the only place the extraction records it).
  // Without this a span in an all-parts file claims all ten lanes at once.
  const partOfEvent = new Map();
  for (const c of doc.chunks) for (const evId of c.events) partOfEvent.set(evId, c.part);
  spans.forEach(({ sp, mods }, n) => {
    const key = 'cl-' + (n + 1);
    const modVals = name => mods.filter(([k]) => k === '--' + name).map(([, v]) => v);
    const TOL = parseFloat(modVals('clusterTol')[0] || '0.030');
    const label = sp[0] + '-' + sp[1] + (sp[2] === null ? '' : '@' + sp[2]);
    const members = doc.events.filter(e => e.onset >= sp[0] - 1e-9 && e.onset <= sp[1] + 1e-9 &&
      (sp[2] === null || partOfEvent.get(e.id) === sp[2])).sort((a, b) => a.onset - b.onset);
    if (!members.length) { console.error('--cluster ' + label + ': no events in the span'); process.exit(2); }
    if (sp[2] === null && parts.length > 1) {
      console.error('--cluster ' + label + ': this IR carries ' + parts.length + ' parts — a bare span would beam ' +
        members.length + ' notes across lanes ' + [...new Set(members.map(e => partOfEvent.get(e.id)))].join(',') +
        ' into one group. Name the part: --cluster ' + sp[0] + '-' + sp[1] + '@<part>');
      process.exit(2);
    }
    // --pickup N (day 24, composer: "1 should be a pick-up. The GC then is
    // actually on number two"): the tempo belongs to the MAIN figure, and the
    // pick-up hangs off the front of it. So the fit runs on the members AFTER
    // the pick-up — otherwise a loose anticipation drags the whole grid to fit
    // itself — and the pick-up is then measured onto that grid at negative
    // positions. Its own error is reported separately and never constrains the
    // fit, which is the whole point: a pick-up is played TO the downbeat, not
    // metronomically before it.
    const noGoLine = mods.some(([k]) => k === '--noGoLine');
    const pickup = Math.max(0, parseInt(modVals('pickup')[0] || '0', 10));
    if (pickup >= members.length) { console.error('--pickup ' + pickup + ': cluster ' + label + ' has only ' + members.length + ' members'); process.exit(2); }
    const mainMembers = members.slice(pickup);
    const fit = ClusterFit.fit(mainMembers.map(e => e.onset), { TOL });
    if (!fit) {
      console.error('--cluster ' + label + ': NO metric fit within ' + (TOL * 1000) + ' ms — proportional is the honest reading here');
      process.exit(2);
    }
    if (pickup) {
      // place each pick-up note on the main grid, at whatever slot it lands
      // nearest; report the miss so an unplayable pick-up is never silent
      const anchor = mainMembers[0].onset;
      const pre = [];
      for (let i = 0; i < pickup; i++) {
        const rel = (members[i].onset - anchor) / fit.unit;
        const slot = Math.round(rel);
        pre.push({ slot, errMs: Math.abs(rel - slot) * fit.unit * 1000 });
      }
      // shift the whole grid so the earliest pick-up sits at 0 and the rest follow
      const shift = -Math.min(...pre.map(p => p.slot));
      fit.grid = pre.map(p => p.slot + shift).concat(fit.grid.map(g => g + shift));
      console.log('    pick-up: ' + pickup + ' note(s) placed on the main grid at slot(s) ' +
        pre.map((p, i) => members[i].source.objectId + '@' + (p.slot + shift) + ' (off ' + p.errMs.toFixed(0) + ' ms)').join(', ') +
        ' — the fit itself is the ' + mainMembers.length + ' note(s) after it');
    }
    console.log('  cluster ' + key + ': ' + members.length + ' notes ' + label + ' s, part ' + partOfEvent.get(members[0].id) + ' (' + members.map(e => e.source.objectId).join(' ') + ')');
    console.log('    fit: unit ' + (fit.unit * 1000).toFixed(1) + ' ms · beat ' + fit.beat.toFixed(3) + ' s = ' + fit.bpm.toFixed(1) + ' bpm x ' + fit.subdivision +
      (fit.tuplet ? ('  [' + fit.tuplet + '-tuplet]') : '  [no tuplet]') +
      ' · max err ' + (fit.maxErr * 1000).toFixed(1) + ' ms · grid ' + fit.grid.join(',') + ' · ' + fit.beams + ' beam(s), 1/' + fit.restDur + ' rests');
    // --accents 4,7,8 / --dyn 1 (1-based member numbers, composer's call per
    // cluster): which members carry an accent, and which carries the single
    // ambient dynamic. Everything else stays bare — the ambient-plus-deviation
    // shape from DYNAMICS_FRAMEWORK, decided by ear rather than derived.
    const listArg = (name) => {
      const out = new Set();
      for (const val of modVals(name))
        for (const v of val.split(',')) { const n = parseInt(v, 10); if (n > 0) out.add(n); }
      return out;
    };
    const accentAt = listArg('accents');
    // --dyn accepts `n` (use the note's velocity band) or `n:mark` (an explicit
    // mark, the composer overruling the band — day 23: fff on the last note,
    // whose band is f)
    const dynAt = new Map();
    for (const val of modVals('dyn')) {
      for (const v of val.split(',')) {
        const mm = v.match(/^(\d+)(?::(\w+))?$/); if (!mm) continue;
        dynAt.set(parseInt(mm[1], 10), mm[2] || 'band');
      }
    }
    // --beamBreak 9 : member numbers (1-based) that START a new beam group.
    // One cluster (one tempo, one grid) can carry several beam groups —
    // composer, day 23: "let's not beam them altogether... the first group of
    // notes and then the second group, but conceptually keep the same tempo".
    const breaks = listArg('beamBreak');
    // --beamThrough 2 : beam group #2 (1-based) keeps its secondary beam
    // unbroken across rests — composer, day 23, on the second figure.
    const through = listArg('beamThrough');
    // --tuplet 10-11@3:2 : members 10..11 form a 3:2 tuplet (three in the
    // space of two units). Slots beyond the members become rests INSIDE the
    // bracket — composer, day 23: "one sixteenth rest, which is part of that
    // bracket". Repeatable.
    const tuplets = [];
    for (const val of modVals('tuplet')) {
      const mm = val.match(/^(\d+)-(\d+)@(\d+):(\d+)$/);
      if (!mm) { console.error('--tuplet needs a-b@num:den (e.g. --tuplet 10-11@3:2)'); process.exit(2); }
      tuplets.push({ from: +mm[1], to: +mm[2], num: +mm[3], den: +mm[4] });
    }
    const anyArtic = accentAt.size ? 'accent' : null;
    if (accentAt.size) console.log('    accents on members ' + [...accentAt].join(','));
    if (dynAt.size) console.log('    dynamics: ' + [...dynAt].map(([n, m]) => n + ':' + m).join(' '));
    if (breaks.size) console.log('    beam breaks before members ' + [...breaks].join(','));
    // WRITTEN DURATIONS (day 23): each member lasts until the next attack, in
    // grid units — so an 8th is written as an 8th and fills its own gap
    // instead of a 16th plus a rest. A member inside a tuplet takes the
    // tuplet's slot value instead. The last member of a BEAM GROUP stops at
    // one unit (a group never spills across its own end).
    const lastOfGroup = new Set();
    for (let k = 1; k <= members.length; k++) { if (breaks.has(k)) lastOfGroup.add(k - 2); }
    lastOfGroup.add(members.length - 1);
    const tupOf = k => tuplets.find(t => k + 1 >= t.from && k + 1 <= t.to) || null;
    // EVERY PARTIAL IS A 16th (day 23, composer's midway solution): the
    // written value no longer carries duration — the instrument's staccato is
    // one fixed length whatever is written (measured: 0.43-0.48 s across this
    // figure, longer than any gap in it). So all notes are 16ths, the gaps get
    // 16th rests, and the SECOND beam level does the phrasing work: a
    // connecting segment between adjacent 16ths, a stub on a note that opens a
    // gap. --trueDurations restores the 8th/16th writing.
    const trueDur = flag('trueDurations');
    const durUnits = members.map((e, k) => {
      if (tupOf(k)) return null;                       // tuplet members: slot value
      if (!trueDur) return 1;
      if (lastOfGroup.has(k)) return 1;
      return fit.grid[k + 1] - fit.grid[k];
    });
    const beamsFor = u => (u >= 4 ? 0 : u >= 2 ? 1 : 2);   // quarter 0, 8th 1, 16th 2 (only under --trueDurations)
    console.log('    written values: ' + members.map((e, k) => tupOf(k) ? 'tup' : (durUnits[k] === 1 ? '16th' : durUnits[k] === 2 ? '8th' : durUnits[k] + 'u')).join(' '));
    for (const t of tuplets) console.log('    tuplet ' + t.num + ':' + t.den + ' over members ' + t.from + '-' + t.to +
      ' (' + t.num + ' slots of ' + (t.den / t.num * fit.unit * 1000).toFixed(1) + ' ms; ' + (t.num - (t.to - t.from + 1)) + ' rest slot(s))');
    let sub = 0;   // beam-group index within the cluster
    members.forEach((e, k) => {
      if (breaks.has(k + 1)) sub++;
      const gkey = key + String.fromCharCode(97 + sub);   // cl-1a, cl-1b, ...
      // the DOWNBEAT owns the launch, not the pick-up (composer: "the GC then
      // is actually on number two")
      const firstOnly = v => v === 'first' ? k === pickup : !!v;
      // THE GO LINE MARKS DISPLACEMENT (day 24): a cluster head sits with its
      // LEFT EDGE on its own go time, so it is not displaced and needs no line.
      // Per-cluster while the composer reviews part by part; the registry
      // default flips to false once every figure has been seen.
      const dev = {
        goLine: noGoLine ? false : firstOnly(FIG_CL.goLine != null ? FIG_CL.goLine : 'first'),
        gc: firstOnly(FIG_CL.gc != null ? FIG_CL.gc : 'first'),
        ringBar: false, dynBesideStem: !!FIG_CL.dynBesideStem,
        dynMark: dynAt.has(k + 1) ? dynAt.get(k + 1) : false,
        nhUnit: true, nhHead: FIG_CL.nhHead || 'filled', nhHeadScale: FIG_CL.nhHeadScale || 0.844, nhStem: 'beam', nhAnchor: FIG_CL.nhAnchor || 'leftEdge',
        nhDot: FIG_CL.nhDot != null ? !!FIG_CL.nhDot : true, nhDotGapSs: FIG_CL.nhDotGapSs != null ? FIG_CL.nhDotGapSs : 0.15,
        beamGroup: gkey, clusterId: key, beamUnit: fit.unit, beamPos: fit.grid[k],
        beamLevels: fit.beams, beamSubdivision: fit.subdivision,
      };
      const tp = tupOf(k);
      if (tp) {
        dev.tupletGroup = key + '-tp' + tp.from;
        dev.tupletNum = tp.num; dev.tupletDen = tp.den;
        dev.tupletStartPos = fit.grid[tp.from - 1];
        dev.tupletSlot = k - (tp.from - 1);
        dev.noteBeams = 2;                       // a triplet 16th still shows two beams
        dev.beamHasTuplet = true;
      } else {
        dev.noteUnits = durUnits[k];
        dev.noteBeams = beamsFor(durUnits[k]);
      }
      if (tuplets.length) dev.beamHasTuplet = true;
      if (through.has(sub + 1)) dev.beamThrough = true;
      if (accentAt.has(k + 1)) dev.nhArtic = 'accent';
      if (anyArtic) dev.beamHasArtic = anyArtic;
      doc.overlays.push({ id: 'ov-' + key + '-' + e.id, kind: 'engraving', target: { event: e.id }, value: { device: dev }, provenance: 'authored' });
    });
  });
}
// --beam t0-t1@part (day 24, the composer's mixed pair): BEAM WITHOUT
// CLUSTERING. --cluster exists for a run of staccato partials: it fits a
// tempo, redraws every member as a 16th on that grid, and fills the gaps
// with rests. This is the other case — the composer beaming notes that keep
// being what they are: *"stem the half note, and then just connect it to the
// sixteenth note with a beam, and have the sixteenth stub on the first one"*.
// So the overlay carries ONLY the stem/beam fields; head, ring bar, dot and
// dynamic still resolve from each note's own technique entry (D50). No
// beamUnit is written, which is what keeps the grid — and therefore the
// rests — out of it.
//
// HOW MANY BEAMS a member carries is derived from its technique rather than
// asked for: a SHORT fixed one-shot (staccato) is the "sixteenth" and takes
// two levels; anything that rings (fortepiano, cuivre, ord) is the long note
// and takes the primary beam only. The second level then has no neighbour to
// connect to and layout draws it as a STUB on the short note — exactly the
// figure asked for, and the same beamlet rule day 23 settled.
{
  const spans = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] !== '--beam') continue;
    const m = String(process.argv[i + 1] || '').match(/^([\d.]+)-([\d.]+)(?:@(\d+))?$/);
    if (!m) { console.error('--beam needs t0-t1 or t0-t1@part (e.g. --beam 31.17-31.40@1)'); process.exit(2); }
    spans.push([parseFloat(m[1]), parseFloat(m[2]), m[3] === undefined ? null : parseInt(m[3], 10)]);
  }
  const partOfEvent = new Map();
  for (const c of doc.chunks) for (const evId of c.events) partOfEvent.set(evId, c.part);
  const RINGS = new Set(FIG_BM.ringTechniques || ['fortepiano', 'cuivre', 'ord']);   // long notes: primary beam only
  spans.forEach((sp, k) => {
    const key = 'bm-' + (k + 1);
    const label = sp[0] + '-' + sp[1] + (sp[2] === null ? '' : '@' + sp[2]);
    const members = doc.events.filter(e => e.onset >= sp[0] - 1e-9 && e.onset <= sp[1] + 1e-9 &&
      (sp[2] === null || partOfEvent.get(e.id) === sp[2])).sort((a, b) => a.onset - b.onset);
    if (members.length < 2) { console.error('--beam ' + label + ': ' + members.length + ' event(s) in the span — a beam needs at least 2'); process.exit(2); }
    if (sp[2] === null && parts.length > 1) {
      console.error('--beam ' + label + ': this IR carries ' + parts.length + ' parts — name the part: --beam ' + sp[0] + '-' + sp[1] + '@<part>');
      process.exit(2);
    }
    console.log('  beam ' + key + ': ' + members.length + ' notes ' + label + ' s, part ' + partOfEvent.get(members[0].id) +
      ' (' + members.map(e => e.source.objectId + ':' + e.technique).join(' ') + ')');
    console.log('    beam levels: ' + members.map(e => e.source.objectId + '=' + (RINGS.has(e.technique) ? '1 (primary only, it rings)' : '2 (a 16th)')).join(' · '));
    // WHO CARRIES THE GC (registry figures.beam.gc): 'ring' = the first
    // member that rings (the long note — composer, day 24: "let's shift the
    // GC to the half note"), 'first' = member 1, false = none. A group with
    // no ringing member falls back to the first, so the cue never vanishes.
    const ringIdx = members.findIndex(e => RINGS.has(e.technique));
    const gcRule = FIG_BM.gc != null ? FIG_BM.gc : 'first';
    const gcIdx = gcRule === 'ring' ? (ringIdx >= 0 ? ringIdx : 0) : gcRule === 'first' ? 0 : -1;
    if (gcRule === 'ring' && ringIdx < 0) console.log('    note: no ringing member — GC falls back to the first note');
    console.log('    GC on ' + (gcIdx >= 0 ? members[gcIdx].source.objectId + ' (' + gcRule + ')' : 'none'));
    members.forEach((e, i) => {
      const firstOnly = v => v === 'first' ? i === 0 : !!v;
      const dev = {
        nhStem: 'beam', beamGroup: key,
        noteBeams: RINGS.has(e.technique) ? 1 : 2,
        beamPos: i, noteUnits: 1,
        // the standards (registry engraving.layout.figures.beam): no go
        // lines, GC on the ringing note, every head centred on its go time,
        // dynamics together above the beam
        goLine: firstOnly(FIG_BM.goLine != null ? FIG_BM.goLine : false),
        gc: i === gcIdx,
        dynAboveBeam: FIG_BM.dynAboveBeam != null ? !!FIG_BM.dynAboveBeam : true,
      };
      const anch = FIG_BM.anchor || (i === 0 ? FIG_BM.firstAnchor : null);
      if (anch) dev.nhAnchor = anch;
      doc.overlays.push({ id: 'ov-' + key + '-' + e.id, kind: 'engraving', target: { event: e.id }, value: { device: dev }, provenance: 'authored' });
    });
  });
}
// --noGc wc-98 (day 24): a per-note device override that removes the GC —
// composer, on the long tone at the end of the beamed pair: *"remove the GC
// from the second one"*. Named by OBJECT ID rather than by member number so
// it stays unambiguous with several groups in flight, and so it can be used
// on any note, beamed or not. Merged onto whatever overlay the note already
// carries.
{
  const ids = new Set();
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] !== '--noGc') continue;
    for (const v of String(process.argv[i + 1] || '').split(',')) if (v.trim()) ids.add(v.trim());
  }
  for (const id of ids) {
    const e = doc.events.find(x => x.source.objectId === id);
    if (!e) { console.error('--noGc ' + id + ': no such object in this window/parts'); process.exit(2); }
    const existing = doc.overlays.find(o => o.kind === 'engraving' && o.target.event === e.id);
    if (existing) existing.value.device = Object.assign({}, existing.value.device, { gc: false });
    else doc.overlays.push({ id: 'ov-nogc-' + e.id, kind: 'engraving', target: { event: e.id }, value: { device: { gc: false } }, provenance: 'authored' });
    console.log('  noGc: ' + id + ' (' + e.technique + ' at ' + e.onset.toFixed(3) + ') — GC removed, page and ball');
  }
}
if (flag('bricks')) {
  // devices go too (day 23 bug): the chunker's cloud-landing GC is a
  // GROUPING artifact — left behind, animobj still made a ball for it
  // while layout drew nothing (the unresolved branch has no tick), so a
  // ball fell on wc-49 out of nowhere. A ball without an arc is a bug.
  for (const c of doc.chunks) { c.strategy = 'unresolved'; delete c.tempo; delete c.groups; delete c.devices; }
  for (const e of doc.events) delete e.metric;
  doc.provenance.notes += ' BRICKS MODE: all chunks forced unresolved (working file).';
}
fs.writeFileSync(path.join(ROOT, outRel), JSON.stringify(doc, null, 1));

// independent validation — a failed doc is REMOVED, never left half-usable
try {
  execFileSync(process.execPath, [path.join(ROOT, 'tools', 'ir_validate.js'), outRel, '--against-source', '--complete'],
    { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  fs.unlinkSync(path.join(ROOT, outRel));
  console.error('VALIDATION FAILED — IR removed:\n' + String(e.stdout || '') + String(e.stderr || ''));
  process.exit(1);
}

// picker manifest (the app reads this; hardcoded options remain as fallback)
const manifest = readManifest();
manifest.irs = manifest.irs.filter(e => e.id !== id);
manifest.irs.push({ id, label, score: scoreName, window: [w0, w1], profile, exp: flag('exp') || undefined });
writeManifest(manifest);

const byStrategy = {};
for (const c of doc.chunks) byStrategy[c.strategy] = (byStrategy[c.strategy] || 0) + 1;
console.log('READY: ' + id + ' — ' + doc.events.length + ' events, ' + doc.chunks.length + ' chunks ' +
  JSON.stringify(byStrategy) + ' · VALID vs source · in the picker as "' + label + '"' +
  (flag('exp') ? ' [experiments]' : ''));
for (const w of warnings) console.warn('  warn: ' + w);
