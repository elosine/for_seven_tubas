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
//   --bare t0-t1[@part]      CLEAR THE NOTATION, KEEP THE BRICKS: every drawn element off
//                            for the span (go line, GC + ball, notehead unit, dot, ring bar,
//                            dynamic). @part optional — bare sweeps every lane by default.
//                            Repeatable. Errors rather than blank a note that carries a figure.
//   --pattern                take the grid from the PATTERN analyser (D63: pattern before
//                            grid — notation/lib/pattern_fit.js) instead of cluster_fit.
//                            Tuplets it chose become bracket groups; no --tuplet needed.
//   --paceRatio 1.4          with --figures: how far apart two gaps must be to be
//                            different PACES (default 1.25) — the dial that decides where
//                            a cut may land. Large enough = one pace, no legal cut, the
//                            whole gesture on one grid (the pre-8g reading).
//   --cuts 2,5,7,10,14       with --figures: NAME THE SEAMS BY HAND (8h) — "cut after
//                            note 2, after note 5, …", numbered from 1 within the main
//                            members. The pace rule steps aside; each figure is still
//                            fitted alone. Refused if a cut would leave a one-note figure.
//   --figures                8i (day 28, D69 — THE BRACKET IS THE MESSAGE): the gesture is
//                            cut into GROUPS at the pace changes (pattern_fit.segment, the
//                            8h two-sided seam rule) and written on ONE GRID, with the beams
//                            broken at the seams. Every pace change is then SAID on the page
//                            as the tuplet relation the fit found — a bracket on the quick
//                            group. Implies --pattern; cannot be combined with --beamBreak
//                            (the seams ARE the breaks — move one with --cuts). A bracket
//                            that crosses a seam is FLAGGED (a straddle), never fixed.
//   --ownGrids               with --figures: the 8g/8h reading instead — each figure on its
//                            OWN grid (its own gridId, rests, values and brackets computed
//                            inside it), no relation printed between them. The alternative,
//                            by hand, where one grid cannot hold the gesture under a head.
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
  const BOOL_MODS = new Set(['--noGoLine', '--pattern', '--figures', '--ownGrids']);
  const MODS = new Set(['--clusterTol', '--accents', '--dyn', '--beamBreak', '--beamThrough', '--tuplet', '--pickup', '--noGoLine', '--pattern', '--figures', '--ownGrids', '--paceRatio', '--cuts']);
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
  // Techniques that RING. A cluster member of one of these keeps its own
  // technique device and takes the primary beam only. Read from
  // figures.beam.ringTechniques, which stays the one place the list lives.
  const RING_TECH = new Set((FIG.beam || {}).ringTechniques || ['fortepiano', 'cuivre', 'ord']);
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
    // A pickup into a SINGLE downbeat has no rhythm of its own to fit (one
    // onset is not a grid), so the fit falls back to ALL the members — which
    // for two notes is exact by construction, the unit being the gap. The
    // pickup designation still does its real job: moving the GC to the
    // downbeat. Day 24, rebuilding the T2/T4 pairs as clusters.
    // THE GRID MUST BE ABLE TO HOLD THE PICK-UP (day 24, T6). Fitting only
    // the main members keeps a loose anticipation from dragging the grid — but
    // when the main figure is short the fit is barely constrained and picks a
    // COARSE unit the pick-up cannot sit on. T6: two main notes 503 ms apart
    // fitted a 500 ms unit, and the pick-up 203 ms earlier rounded onto the
    // downbeat's own slot, 203 ms out. So: fit the main members, then TEST the
    // pick-up against that grid; if it collides or misses the tolerance, the
    // exclusion has failed its purpose and everything is fitted together.
    const fitAll = () => ClusterFit.fit(members.map(e => e.onset), { TOL });
    let onePastPickup = members.length - pickup < 2;
    let mainMembers = onePastPickup ? members : members.slice(pickup);
    let fit = ClusterFit.fit(mainMembers.map(e => e.onset), { TOL });
    if (fit && pickup && !onePastPickup) {
      const anchor = mainMembers[0].onset;
      let ok = true, prev = 0;
      for (let i = pickup - 1; i >= 0; i--) {
        const rel = (members[i].onset - anchor) / fit.unit, slot = Math.round(rel);
        // COLLISION only (day 24, second pass). A pick-up that misses the
        // tolerance is the normal case — it is played TO the downbeat, not
        // metronomically before it — and the miss is reported, never acted on.
        // The first version of this test also refitted on a tolerance miss,
        // which silently turned T3's chosen 16th reading (pickup 55 ms off a
        // 1 ms grid) into the 32nd reading the composer had rejected.
        if (slot >= prev) { ok = false; break; }
        prev = slot;
      }
      if (!ok) {
        const whole = fitAll();
        if (!whole) { console.error('--cluster ' + label + ': the main figure fits but the pick-up sits on no slot of that grid, and the whole figure does not fit either — proportional is the honest reading'); process.exit(2); }
        console.log('    note: the main figure grid (unit ' + (fit.unit * 1000).toFixed(0) + ' ms) could not hold the pick-up — refitted ALL members together');
        fit = whole; mainMembers = members; onePastPickup = true;
      }
    }
    if (!fit) {
      console.error('--cluster ' + label + ': NO metric fit within ' + (TOL * 1000) + ' ms — proportional is the honest reading here');
      process.exit(2);
    }
    // --figures (8i, day 28 — D69, THE BRACKET IS THE MESSAGE): THE GESTURE IS
    // CUT INTO GROUPS WHERE THE PACE CHANGES, AND WRITTEN ON ONE GRID.
    //
    // 8g/8h settled the CUT; 8i settled the WRITING. The composer, shown the
    // same notes both ways: *"there should be some communication to the
    // performer if there is a speed change... the first two sixteenth notes
    // look much further apart than the next three. And so the seven-four
    // bracket is appropriate."* Each group on its own grid writes everything as
    // plain 16ths and prints no tempo, so the page says "same" with its VALUES
    // while its SPACING says "different". ONE grid says the relation out loud,
    // as the bracket the fit already found.
    //
    // So the seams from pattern_fit.segment() become BEAM BREAKS on the single
    // grid (break member = base + cut + 1), and the grid and its tuplets come
    // from the EXISTING --pattern path. No new drawing code — which is what
    // lets the build be proved identical to the page the composer approved by
    // hand (t1-hybrid2 = --pattern --beamBreak 3,6,8,11,15).
    //
    // The gesture keeps ONE launch: the GC and the go line stay on its first
    // note (figures.cluster.gc = 'first'), and every head sits with its LEFT
    // EDGE on its own go time. A seam adds no ink of its own — it is a beam
    // that stops and another that starts.
    //
    // --ownGrids keeps the 8g/8h reading as the ALTERNATIVE: each figure its own
    // grid domain (device.gridId), its rests, values and brackets computed
    // inside it and never across a seam. By hand, where one grid cannot hold the
    // gesture under a head.
    //
    // --beamBreak is no longer the other case for a gesture like this:
    // --figures synthesises the breaks itself, and a seam is moved with --cuts.
    // Asking for both is a contradiction, so it is an error rather than a
    // precedence rule nobody would remember.
    const useFigures = mods.some(([k]) => k === '--figures');
    const ownGrids = mods.some(([k]) => k === '--ownGrids');
    if (useFigures && mods.some(([k]) => k === '--pattern')) {
      console.error('--cluster ' + label + ': --figures writes the groups on ONE grid from the pattern analyser — --pattern is implied, drop it'); process.exit(2);
    }
    if (useFigures && mods.some(([k]) => k === '--beamBreak')) {
      console.error('--cluster ' + label + ': --figures breaks the beams at the seams itself; use --cuts to move a seam'); process.exit(2);
    }
    if (ownGrids && !useFigures) {
      console.error('--cluster ' + label + ': --ownGrids is how --figures writes its groups — add --figures'); process.exit(2);
    }
    // --cuts (8h) names the seams BETWEEN groups, so it means nothing without
    // them: silently ignoring it would let a hand reading be built as the
    // tool's own and nobody would see the difference.
    if (!useFigures && mods.some(([k]) => k === '--cuts')) {
      console.error('--cluster ' + label + ': --cuts names the seams between FIGURES — add --figures'); process.exit(2);
    }
    let perMember = null, seg = null, bvg = null;
    const figBreaks = new Set();   // 8i: the seams, as 1-based member numbers
    if (useFigures) {
      const PF = require(path.join(ROOT, 'notation', 'lib', 'pattern_fit.js'));
      // --paceRatio: how far apart two gaps must be to count as different paces
      // (default 1.25). It is the one dial that changes WHERE cuts may go —
      // raise it to group more loosely (at the limit, one pace band means no
      // cut is legal anywhere and the gesture stays a single group on one
      // grid, which is the pre-8g reading); lower it to group more tightly.
      const paceRatio = parseFloat(modVals('paceRatio')[0] || '0');
      const segOpt = {};
      if (paceRatio > 1) segOpt.PACE_RATIO = paceRatio;
      // --cuts: the composer names the seams and the pace rule steps aside
      // entirely (8h). Notes are numbered from 1 within the MAIN members, so a
      // pick-up does not shift them.
      const cutsRaw = (modVals('cuts')[0] || '').trim();
      if (cutsRaw) {
        const cl = cutsRaw.split(',').map(x => parseInt(x.trim(), 10));
        if (cl.some(x => !Number.isInteger(x))) { console.error('--cluster ' + label + ' --cuts: whole note numbers, e.g. --cuts 2,5,7,10,14'); process.exit(2); }
        const why = PF.cutsReason(mainMembers.length, cl, PF.SEG_DEFAULTS.MIN_FIGURE_NOTES);
        if (why) { console.error('--cluster ' + label + ' --cuts ' + cutsRaw + ': ' + why); process.exit(2); }
        segOpt.CUTS = cl;
      }
      seg = PF.segment(mainMembers.map(e => e.onset), Object.keys(segOpt).length ? segOpt : undefined);
      if (paceRatio > 1) console.log('    paceRatio ' + paceRatio + ' (default ' + PF.SEG_DEFAULTS.PACE_RATIO + ')');
      if (segOpt.CUTS) console.log('    cuts BY HAND after note ' + segOpt.CUTS.join(', ') + ' — the pace rule was not consulted');
      if (!seg) { console.error('--cluster ' + label + ' --figures: the analyser found no reading'); process.exit(2); }
      const base = (pickup && !onePastPickup) ? pickup : 0;   // index of mainMembers[0] within members
      // THE SEAM IS THE BEAM BREAK (8i). Everything else about the one-grid
      // build then comes from the --pattern path below, unchanged. Under
      // --ownGrids the beam groups are the grid domains instead, so the breaks
      // are not synthesised at all — they would say the same thing twice.
      if (!ownGrids) for (const c of seg.cuts) figBreaks.add(base + c + 1);
      bvg = PF.bracketsVsGroups(seg.single, seg.cuts);
      if (ownGrids) {
        perMember = new Array(members.length).fill(null);
        seg.figures.forEach((fg, fi) => {
          const gid = key + '-f' + (fi + 1), grp = key + String.fromCharCode(97 + fi), ff = fg.fit;
          // a tuplet lives inside ONE beat of ONE figure; slots are explicit
          // because a tuplet may have a rest between two of its notes
          const tup = new Map();
          for (const b of (ff.beats || [])) {
            if (!b.tuplet) continue;
            const p2 = b.tuplet >= 4 ? 4 : 2;
            ff.grid.forEach((g, i) => {
              const rel = g - b.beat * 4;
              if (rel >= -1e-6 && rel < 4 - 1e-6) tup.set(i, {
                group: gid + '-pb' + b.beat, num: b.tuplet, den: 4, startPos: b.beat * 4,
                slot: Math.round(rel / (4 / b.tuplet)), text: b.tuplet + ':' + p2,
                valueDur: 16 / (4 / p2), beams: Math.log2(p2),
              });
            });
          }
          for (let i = 0; i < fg.notes; i++)
            perMember[base + (fg.from - 1) + i] = {
              unit: ff.unit, pos: ff.grid[i], gridId: gid, group: grp, beams: 2, sub: 4,
              tuplet: tup.get(i) || null, last: i === fg.notes - 1, figure: fi + 1,
            };
        });
        // A PICK-UP HANGS OFF FIGURE 1, on figure 1's unit — the same rule as
        // before (the tempo belongs to the main figure), narrowed to the figure
        // the pick-up actually leads into.
        if (pickup && !onePastPickup) {
          const f1 = perMember[pickup], anchor = mainMembers[0].onset, pre = [];
          for (let i = 0; i < pickup; i++) {
            const rel = (members[i].onset - anchor) / f1.unit, slot = Math.round(rel);
            pre.push({ slot: slot, errMs: Math.abs(rel - slot) * f1.unit * 1000 });
          }
          let ok = true, prev = 0;
          for (let i = pickup - 1; i >= 0; i--) { if (pre[i].slot >= prev) { ok = false; break; } prev = pre[i].slot; }
          if (!ok) { console.error('--cluster ' + label + ' --figures --ownGrids: the pick-up sits on no slot of figure 1’s grid (unit ' + (f1.unit * 1000).toFixed(0) + ' ms) — drop --ownGrids or drop --pickup'); process.exit(2); }
          const shift = -Math.min.apply(null, pre.map(x => x.slot));
          for (const pm of perMember) if (pm && pm.gridId === key + '-f1') pm.pos += shift;
          for (let i = 0; i < pickup; i++)
            perMember[i] = { unit: f1.unit, pos: pre[i].slot + shift, gridId: key + '-f1', group: key + 'a', beams: 2, sub: 4, tuplet: null, last: false, figure: 1 };
          console.log('    pick-up: ' + pickup + ' note(s) on figure 1’s grid at slot(s) ' +
            pre.map((x, i) => members[i].source.objectId + '@' + (x.slot + shift) + ' (off ' + x.errMs.toFixed(0) + ' ms)').join(', '));
        }
        console.log('  cluster ' + key + ': ' + members.length + ' notes ' + label + ' s, part ' + partOfEvent.get(members[0].id) +
          ' — ' + seg.figures.length + ' FIGURES, each on its OWN grid (--ownGrids)');
        console.log('    ' + seg.words);
        seg.figures.forEach((fg, fi) => console.log('    f' + (fi + 1) + ': notes ' + (base + fg.from) + '-' + (base + fg.to) +
          '  ' + fg.words + '  ·  unit ' + (fg.fit.unit * 1000).toFixed(0) + ' ms = ' + fg.fit.bpm.toFixed(0) + ' bpm · ' +
          fg.fit.heads.toFixed(1) + ' heads · grid ' + fg.fit.grid.join(',') +
          (fg.fit.tupletBeats ? ('  TUPLET ' + fg.fit.beats.filter(b => b.tuplet).map(b => 'beat' + b.beat + ':' + b.tuplet).join(',')) : '')));
      }
      // one line per note in question, closest call first: both directions of a
      // near-tie name the SAME note, and printing both reads as duplication
      const ntBy = new Map();
      for (const t of seg.nearTies) {
        const note = t.kind === 'cut' ? t.afterNote : t.afterNote + 1;
        if (!ntBy.has(note) || t.delta < ntBy.get(note).delta) ntBy.set(note, t);
      }
      [...ntBy].sort((a, b) => a[1].delta - b[1].delta || a[0] - b[0]).forEach(([note, t]) =>
        console.log('    NEAR-TIE: note ' + note + ' could go either way (+' + t.delta.toFixed(2) + ', the ' + t.gapMs +
          ' ms gap after note ' + t.afterNote + ') — built as chosen; say the word to move it'));
    }
    // --pattern (D63): the grid comes from the pattern analyser — worst
    // displacement in noteheads at page scale, tuplets admitted per beat where
    // plain 16ths fail the eye. Its fractional positions ARE the tuplet slots;
    // each tuplet beat becomes a bracket group over that beat, with the
    // members' slot numbers explicit (a tuplet may have a rest between two
    // of its notes — the existing --tuplet path assumed consecutive slots).
    //
    // 8i: --figures (without --ownGrids) IS this path. segment() already fitted
    // the whole gesture as seg.single on its way to pricing the cuts, so the
    // same object is reused rather than re-fitted — one grid, one set of
    // brackets, and the seams arriving separately as beam breaks.
    const oneGrid = useFigures && !ownGrids;
    const usePattern = oneGrid || mods.some(([k]) => k === '--pattern');
    let patTuplets = null;   // k(member index) -> {group, num, den, startPos, slot}
    if (usePattern) {
      const PF = require(path.join(ROOT, 'notation', 'lib', 'pattern_fit.js'));
      const pf = oneGrid ? seg.single : PF.fit(mainMembers.map(e => e.onset));
      if (!pf) { console.error('--cluster ' + label + (oneGrid ? ' --figures' : ' --pattern') + ': the analyser found no writing'); process.exit(2); }
      // THE PICK-UP GOES ON THE PATTERN GRID, measured against the pattern's
      // own unit (day 28, 8i). The first version of this took its slots from
      // the cluster_fit grid that the pattern is about to replace — which is a
      // different unit, and on a span with no pick-up the slice was empty so
      // nothing ever showed it. Same rule as the cluster_fit path below: each
      // pick-up lands on the nearest slot, the whole grid shifts so the
      // earliest sits at 0, and the miss is reported rather than acted on.
      let pre = [], shift = 0;
      if (pickup && !onePastPickup) {
        const anchor = mainMembers[0].onset, slots = [];
        for (let i = 0; i < pickup; i++) {
          const rel = (members[i].onset - anchor) / pf.unit, slot = Math.round(rel);
          slots.push({ slot: slot, errMs: Math.abs(rel - slot) * pf.unit * 1000 });
        }
        shift = -Math.min.apply(null, slots.map(x => x.slot));
        pre = slots.map(x => x.slot + shift);
        console.log('    pick-up: ' + pickup + ' note(s) on the pattern grid at slot(s) ' +
          slots.map((x, i) => members[i].source.objectId + '@' + (x.slot + shift) + ' (off ' + x.errMs.toFixed(0) + ' ms)').join(', '));
      }
      fit.unit = pf.unit; fit.beat = pf.unit * 4; fit.bpm = pf.bpm; fit.subdivision = 4; fit.beams = 2; fit.restDur = 16;
      fit.maxErr = pf.worstSeconds; fit.tuplet = null;
      fit.grid = pre.concat(pf.grid.map(g => +(g + shift).toFixed(4)));
      patTuplets = new Map();
      for (const b of pf.beats) {
        if (!b.tuplet) continue;
        const startPos = b.beat * 4 + shift;
        pf.grid.forEach((g, i) => {
          const k = i + pre.length;
          const rel = g - b.beat * 4;
          // written at the largest power-of-2 count p <= n: a triplet over the
          // beat is three 8THS ('3:2', one beam, 8th rests); 5/6/7 are 16ths ('n:4')
          const p2 = b.tuplet >= 4 ? 4 : 2;
          if (rel >= -1e-6 && rel < 4 - 1e-6) patTuplets.set(k, { group: key + '-pb' + b.beat, num: b.tuplet, den: 4, startPos, slot: Math.round(rel / (4 / b.tuplet)),
            text: b.tuplet + ':' + p2, valueDur: 16 / (4 / p2), beams: Math.log2(p2) });
        });
      }
      console.log('    PATTERN (D63): ' + pf.shape + '   worst ' + (pf.worstSeconds * 1000).toFixed(0) + ' ms = ' + pf.heads.toFixed(1) + ' heads' + (pf.coherent ? '' : '  [OVER A HEAD]'));
    }
    if (!ownGrids) console.log('  cluster ' + key + ': ' + members.length + ' notes ' + label + ' s, part ' + partOfEvent.get(members[0].id) + ' (' + members.map(e => e.source.objectId).join(' ') + ')');
    if (!ownGrids) console.log('    fit: unit ' + (fit.unit * 1000).toFixed(1) + ' ms · beat ' + fit.beat.toFixed(3) + ' s = ' + fit.bpm.toFixed(1) + ' bpm x ' + fit.subdivision +
      (fit.tuplet ? ('  [' + fit.tuplet + '-tuplet]') : '  [no tuplet]') +
      ' · max err ' + (fit.maxErr * 1000).toFixed(1) + ' ms · grid ' + fit.grid.join(',') + ' · ' + fit.beams + ' beam(s), 1/' + fit.restDur + ' rests');
    // 8i: THE GROUPS AND THE BRACKETS, SIDE BY SIDE. What the page will say
    // about each group, and whether any bracket says it across a seam.
    if (oneGrid) {
      const gBase = (pickup && !onePastPickup) ? pickup : 0;
      console.log('    ' + seg.figures.length + ' GROUPS on ONE grid (8i), beams broken after note ' +
        (seg.cuts.map(c => gBase + c).join(', ') || 'nothing') + ':  ' + seg.words);
      (bvg ? bvg.groups : []).forEach(g => console.log('    g' + g.group + ': notes ' + (gBase + g.from) + '-' + (gBase + g.to) +
        '  ' + seg.figures[g.group - 1].words.padEnd(23) +
        (g.plain ? 'plain 16ths' : g.brackets.map(b => b.text + ' over notes ' + (gBase + b.notes[0]) + '-' + (gBase + b.notes[1]) +
          (b.covers === 'exact' ? '' : b.covers === 'part' ? ' (part of the group; the rest is plain)' : ' — STRADDLES A SEAM')).join(' · '))));
      for (const st of (bvg ? bvg.straddles : []))
        console.log('    STRADDLE: the ' + st.text + ' on beat ' + st.beat + ' covers notes ' + (gBase + st.notes[0]) + '-' + (gBase + st.notes[1]) +
          ', across the seam after note ' + (gBase + st.seamAfter) + ' — the bracket says "quicker" about two different groups. ' +
          'FLAGGED, not fixed: move the seam (--cuts) or write it as --ownGrids');
      if (seg.single && seg.single.coherent === false)
        console.log('    ONE GRID IS OVER A HEAD (' + seg.single.heads.toFixed(1) + ') — the page cannot say the relation on one grid. ' +
          'By hand: --ownGrids, or split at a seam (--cuts) and build two clusters');
    }
    if (pickup && !onePastPickup && !useFigures && !usePattern) {
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
    for (const b of figBreaks) breaks.add(b);   // 8i: --figures' seams ARE the breaks
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
    // with --figures the groups are the FIGURES: a member is last when the next
    // one is on a different grid (a group never spills across its own end)
    if (perMember) for (let k = 0; k < members.length - 1; k++)
      if (perMember[k] && perMember[k + 1] && perMember[k].gridId !== perMember[k + 1].gridId) lastOfGroup.add(k);
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
      if (perMember) return perMember[k + 1].pos - perMember[k].pos;   // its own figure's units
      return fit.grid[k + 1] - fit.grid[k];
    });
    // BEAM LEVELS FOLLOW THE GRID, not a fixed 16th assumption (day 24 — the
    // composer, on T10: "did you end up using thirty second notes? I don't see
    // them"). A note of u units on a grid of m units per beat is worth u/m of a
    // quarter, so it carries log2(m/u) beams: m=4,u=1 -> 2 (a 16th, every
    // cluster before this one); m=8,u=1 -> 3 (a 32nd). The old constant said 2
    // whatever the grid was, so T10's 32nd-grid figure drew 16ths over 32nd
    // POSITIONS — the beams under-reported the grid by a factor of two while
    // the rests (base = sub*4, already grid-aware) reported it correctly. The
    // one figure in the section fitted at subdivision 8, so the one that showed
    // it.
    const beamsFor = (u, sd) => Math.max(0, Math.round(Math.log2((sd || fit.subdivision) / u)));
    console.log('    written values: ' + members.map((e, k) => tupOf(k) ? 'tup' : (durUnits[k] === 1 ? '16th' : durUnits[k] === 2 ? '8th' : durUnits[k] + 'u')).join(' '));
    for (const t of tuplets) console.log('    tuplet ' + t.num + ':' + t.den + ' over members ' + t.from + '-' + t.to +
      ' (' + t.num + ' slots of ' + (t.den / t.num * fit.unit * 1000).toFixed(1) + ' ms; ' + (t.num - (t.to - t.from + 1)) + ' rest slot(s))');
    let sub = 0;   // beam-group index within the cluster
    members.forEach((e, k) => {
      if (breaks.has(k + 1)) sub++;
      const pm = perMember && perMember[k];
      const gkey = pm ? pm.group : key + String.fromCharCode(97 + sub);   // cl-1a, cl-1b, ...
      // the DOWNBEAT owns the launch, not the pick-up (composer: "the GC then
      // is actually on number two")
      const firstOnly = v => v === 'first' ? k === pickup : !!v;
      // THE GO LINE MARKS DISPLACEMENT (day 24): a cluster head sits with its
      // LEFT EDGE on its own go time, so it is not displaced and needs no line.
      // Per-cluster while the composer reviews part by part; the registry
      // default flips to false once every figure has been seen.
      // A RINGING MEMBER KEEPS ITS OWN TECHNIQUE DEVICE (day 24 — the beam
      // standard folded back into the cluster). A fortepiano inside a cluster
      // is still a fortepiano: open head, ring bar, its own sfzp, primary beam
      // only. Only the short partials are rewritten as 16ths with the cluster
      // head and dot. This is what retires --beam: a pickup into a fortepiano
      // is a cluster whose downbeat happens to ring.
      const rings = RING_TECH.has(e.technique);
      const dev = {
        // NO GO LINES ON CLUSTERS (D58): every head sits with its LEFT EDGE on
        // its own go time, so nothing is displaced and nothing needs marking.
        goLine: noGoLine ? false : firstOnly(FIG_CL.goLine != null ? FIG_CL.goLine : false),
        gc: firstOnly(FIG_CL.gc != null ? FIG_CL.gc : 'first'),
        dynBesideStem: !!FIG_CL.dynBesideStem,
        dynMark: dynAt.has(k + 1) ? dynAt.get(k + 1) : false,
        nhUnit: true, nhStem: 'beam', nhAnchor: FIG_CL.nhAnchor || 'leftEdge',
        beamGroup: gkey, clusterId: key,
        beamUnit: pm ? pm.unit : fit.unit, beamPos: pm ? pm.pos : fit.grid[k],
        beamLevels: pm ? pm.beams : fit.beams, beamSubdivision: pm ? pm.sub : fit.subdivision,
      };
      // THE GRID DOMAIN. Rests, written values and tuplet brackets are computed
      // per gridId (layout.js), which is the figure under --figures and the
      // whole cluster otherwise.
      if (pm) { dev.gridId = pm.gridId; dev.figure = pm.figure; }
      else if (oneGrid) dev.figure = sub + 1;
      if (k < pickup) dev.pickup = true;   // recorded so analysers/validators can exclude it from the grid (day 24)
      if (rings) {
        // head, ring bar and dynamic come from its technique entry; the mark
        // joins the group's row so a pickup+fp reads as one gesture
        delete dev.dynMark;
        dev.dynAboveBeam = true;
      } else {
        dev.ringBar = false;
        dev.nhHead = FIG_CL.nhHead || 'filled';
        dev.nhHeadScale = FIG_CL.nhHeadScale || 0.844;
        dev.nhDot = FIG_CL.nhDot != null ? !!FIG_CL.nhDot : true;
        dev.nhDotGapSs = FIG_CL.nhDotGapSs != null ? FIG_CL.nhDotGapSs : 0.15;
      }
      const ptp = pm ? pm.tuplet : (patTuplets && patTuplets.get(k));
      const tp = tupOf(k);
      if (ptp) {
        dev.tupletGroup = ptp.group;
        dev.tupletNum = ptp.num; dev.tupletDen = ptp.den;
        dev.tupletStartPos = ptp.startPos;
        dev.tupletSlot = ptp.slot;
        dev.tupletText = ptp.text; dev.tupletValue = ptp.valueDur;
        dev.noteBeams = ptp.beams;
        dev.beamHasTuplet = true;
      } else if (tp) {
        dev.tupletGroup = key + '-tp' + tp.from;
        dev.tupletNum = tp.num; dev.tupletDen = tp.den;
        dev.tupletStartPos = fit.grid[tp.from - 1];
        dev.tupletSlot = k - (tp.from - 1);
        dev.noteBeams = 2;                       // a triplet 16th still shows two beams
        dev.beamHasTuplet = true;
      } else {
        dev.noteUnits = durUnits[k];
        dev.noteBeams = rings ? 1 : beamsFor(durUnits[k], pm ? pm.sub : null);   // a ringing note takes the primary beam only
      }
      if (tuplets.length || (patTuplets && patTuplets.size) || ptp) dev.beamHasTuplet = true;
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
        // THE GO LINE MARKS DISPLACEMENT (D58): in a beam only the GC-bearing
        // member is displaced — pushed clear of the impact disc — so only it
        // carries a go line. Every other head sits with its LEFT EDGE on its own
        // go time (D59) and needs none.
        goLine: FIG_BM.goLine === 'gc' ? (i === gcIdx) : firstOnly(FIG_BM.goLine != null ? FIG_BM.goLine : false),
        gc: i === gcIdx,
        dynAboveBeam: FIG_BM.dynAboveBeam != null ? !!FIG_BM.dynAboveBeam : true,
      };
      // 'before' is the layout default (the unit hangs ahead of the go time to
      // clear the disc), so it is expressed by NOT setting an anchor.
      const anch = i === gcIdx ? (FIG_BM.gcAnchor || 'before') : (FIG_BM.anchor || (i === 0 ? FIG_BM.firstAnchor : null));
      if (anch && anch !== 'before') dev.nhAnchor = anch;
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
// --bare t0-t1[@part] (day 26): CLEAR THE NOTATION, KEEP THE BRICKS.
// Composer, setting up Part 3 on CLOUD02-I: *"the bricks are fine, that's
// what I want to see, just the bricks. It's the GC notation that's
// distracting right now."* An unfigured note is not blank — `--bricks`
// leaves the chunk unresolved but every note still carries its TECHNIQUE's
// device (staccato = go line + GC + head + flag + dot + band dynamic), so
// 159 staccatos drew 159 arcs, balls and dashed lines over the material the
// composer was trying to read. This switches every drawn element OFF for the
// span, per note, leaving the parachute brick alone.
// Unlike --cluster/--beam, @part is OPTIONAL in a multi-part file: bare is a
// REMOVAL, not a grouping, and sweeping every lane is the normal intent.
// Repeatable. Written at extraction, so a re-extract keeps the span bare.
{
  const BARE_OFF = { curve: false, cut: false, goLine: false, gc: false, nhUnit: false, nhDot: false, ringBar: false, dynMark: false, dynPair: false, dynBesideStem: false };
  const spans = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] !== '--bare') continue;
    const m = String(process.argv[i + 1] || '').match(/^([\d.]+)-([\d.]+)(?:@(\d+))?$/);
    if (!m) { console.error('--bare needs t0-t1 or t0-t1@part (e.g. --bare 36.19-40.33)'); process.exit(2); }
    spans.push([parseFloat(m[1]), parseFloat(m[2]), m[3] === undefined ? null : parseInt(m[3], 10)]);
  }
  if (spans.length) {
    const partOfEvent = new Map();
    for (const c of doc.chunks) for (const evId of c.events) partOfEvent.set(evId, c.part);
    // A FIGURE MUST NEVER BE SILENTLY BLANKED (day 24's lesson, applied at
    // build time): if a --cluster/--beam already gave a note ink, baring it
    // would erase a figure the composer built and the page would just look
    // wrong. Hard error naming the notes, with the narrower span to use.
    const figured = new Set();
    for (const ov of doc.overlays) if (ov.kind === 'engraving' && ov.target && ov.target.event && ov.value && ov.value.device) figured.add(ov.target.event);
    spans.forEach(sp => {
      const label = sp[0] + '-' + sp[1] + (sp[2] === null ? '' : '@' + sp[2]);
      const members = doc.events.filter(e => e.onset >= sp[0] - 1e-9 && e.onset <= sp[1] + 1e-9 &&
        (sp[2] === null || partOfEvent.get(e.id) === sp[2])).sort((a, b) => a.onset - b.onset);
      if (!members.length) { console.error('--bare ' + label + ': no events in the span'); process.exit(2); }
      const clash = members.filter(e => figured.has(e.id));
      if (clash.length) {
        console.error('--bare ' + label + ': ' + clash.length + ' note(s) already carry a figure — baring them would erase it:');
        console.error('    ' + clash.map(e => e.source.objectId + '@' + partOfEvent.get(e.id) + ' ' + e.onset.toFixed(3) + 's').join(', '));
        console.error('  Narrow the bare span (or add @part) so it excludes them.');
        process.exit(2);
      }
      for (const e of members) {
        const existing = doc.overlays.find(o => o.kind === 'engraving' && o.target.event === e.id);
        if (existing) existing.value.device = Object.assign({}, existing.value.device, BARE_OFF);
        else doc.overlays.push({ id: 'ov-bare-' + e.id, kind: 'engraving', target: { event: e.id }, value: { device: Object.assign({}, BARE_OFF) }, provenance: 'authored' });
      }
      const byPart = {};
      for (const e of members) { const p = partOfEvent.get(e.id); byPart[p] = (byPart[p] || 0) + 1; }
      console.log('  bare ' + label + ': ' + members.length + ' notes cleared to bricks (' +
        Object.keys(byPart).sort((a, b) => a - b).map(p => 'T' + (+p + 1) + ':' + byPart[p]).join(' ') + ')');
    });
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
// THE COMMAND IS THE SAVE (day 25, composer asked how the files work): a
// version file is derived — the archive plus the composer's decisions (spans,
// pickups, dynamics) — and those decisions ARE the argv. Store it, so the file
// can say how to rebuild itself without the journal.
doc.provenance.build = 'node tools/notate_section.js ' + process.argv.slice(2).map(a => (/[\s"]/.test(a) ? JSON.stringify(a) : a)).join(' ');
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
