// cloud02i_ab.js — PLAN 8f step 2: the CLOUD02-I listening file.
//
// Three copies of the section end to end in ONE scratch score so the composer can
// hear them side by side (composer, day 25: "a save file for just this section, and
// I can hear the original and then alternative side by side… the original and then
// b, and then next to that, after that, a"):
//
//   0.0 s  ORIGINAL              159 staccatos, exactly as in the archive
//   8.0 s  B — thin by ensemble  sounding-count cap 6, shaped by the section's own
//                                META curve, round-robin across the parts
//  16.0 s  A — thin by part      drop every note that starts inside the previous
//                                kept note's ring (D51 sample length), per part
//  24.0 s  B2 — thin by attack   no two attacks closer than `spacing`; the survivor
//           spacing              of each collision is chosen by `tie`
//  32.0 s  B3 — B2 + gap-fill    B2 kept whole; dropped notes added back farthest-
//                                first (most room to the nearest kept attack) down
//                                to `fillFloor`; then audited and, where a part is
//                                tight, a note REDISTRIBUTED to a free part
//
// B2 answers a different question from B (composer, day 25: "what I would like is
// more audible attacks… see how many impulses are landing within a certain threshold
// of each other and then do the round robin thinning"). B caps what is RINGING — the
// mass. B2 caps how close ONSETS may land — the impulses. In the original, 68 % of
// attacks fall within 30 ms of the previous one, inside the window where two onsets
// fuse into one, so this is the more direct cure for the smear. It cannot be done as
// an add-back to B: B was never chosen on onsets and is itself full of near-
// simultaneous attacks, so the rule runs on the ORIGINAL.
//
// NOTHING IS CANONICAL HERE. The archive score is read-only; whichever version the
// composer picks becomes a SCORE EDIT, ledgered in docs/ARCHIVE_AMENDMENTS.md and
// applied to the archive, then re-extracted. This file is for ears only.
//
//   node tools/cloud02i_ab.js [--cap 6] [--slice 0.1] [--ringFrac 1.0]
//                             [--spacing 0.05] [--tie hybrid|loudest|roundrobin]
//                             [--fillFloor 0.03] [--brick 0.05] [--noRedistribute]
//                             [--isolate] [--out scores/cloud02i-ab.json]
//
// --brick normalises every staccato's written length (endSeconds − startSeconds) in
// the ORIGINAL copy — the played lengths ran 50–218 ms and the composer wants them all
// at the staccato minimum. Sound is unaffected (D51: a staccato is a fixed sample);
// measured: it causes no playability change either (0 hard overlaps before and after).
// Page hygiene. Not applied to the archive here — that is a ledgered SCORE EDIT.
//
// --isolate additionally writes each copy as its own score rebased to 0
// (scores/cloud02i-{orig,b,a,b2}.json) so the auditor, the IR extractor and the
// pattern analyser see one version at a time.

const fs = require('fs');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };

const SRC     = flag('src', 'scores/piece-s25-finished01.json');
const GROUP   = flag('group', 'grp-cloud02-i-01');
const OUT     = flag('out', 'scores/cloud02i-ab.json');
const CAP     = +flag('cap', 6);          // (b): peak sounding count
const SLICE   = +flag('slice', 0.1);      // (b): round-robin admission slice, seconds
const RINGFRAC= +flag('ringFrac', 1.0);   // (a): fraction of the ring that must finish
const SPACING = +flag('spacing', 0.05);   // (b2): minimum gap between any two attacks
const TIE     = flag('tie', 'hybrid');    // (b2): hybrid | loudest | roundrobin
const RECENT  = +flag('recent', 0.25);    // (b2, hybrid): "that part just played" window
// (b3+): one version per floor, each seeded from the previous, so B3 ⊂ B4 ⊂ B5 and
// every listen strictly adds notes. Farthest-first order does not depend on the
// floor — the floor only says when to stop — so a nested chain and independent runs
// give the identical selection.
const FILLFLOORS = flag('fillFloors', '0.03').split(',').map(Number);
const BRICK   = flag('brick', null) != null ? +flag('brick') : null; // written staccato length
const REDIST  = !args.includes('--noRedistribute');
const ISOLATE = args.includes('--isolate');
const GAP     = 8;                        // spacing between copies, seconds
const STARTS  = [0, 8, 16, 24, 32];       // ORIGINAL, B, A, B2, then one per fill floor
const META_LAYER = 10;
const PARTS = 10;

// ── D51: a fixed one-shot's length is its sample length ───────────────────────
// Canonical source is the probe table; the IR carries the same numbers as event
// `duration`, and we assert the two agree before using them.
function staccatoLengths() {
  const md = fs.readFileSync('docs/SI2_staccato_lengths.md', 'utf8');
  const map = {};
  for (const line of md.split('\n')) {
    if (!/^\|\s*Staccato/.test(line)) continue;
    const c = line.split('|').map(s => s.trim());
    const midi = +(c[3].match(/\((\d+)\)/) || [])[1];
    const secs = +c[5];
    if (midi && secs) map[midi] = secs;
  }
  return map;
}

const LEN = staccatoLengths();
const lenOf = n => LEN[n] != null ? LEN[n] : 0.45;

// ── source material ───────────────────────────────────────────────────────────
const score = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const inGroup = score.objects.filter(o => o.groupId === GROUP);
const notes = inGroup
  .filter(o => o.type === 'waveCurve' && o.layer < META_LAYER && o.sonifyNote != null)
  .map(o => BRICK != null && o.technique === 'staccato'
    ? { ...o, endSeconds: +(o.startSeconds + BRICK).toFixed(3) } : o)
  .sort((a, b) => a.startSeconds - b.startSeconds);
const meta = inGroup.find(o => o.type === 'waveCurve' && o.layer === META_LAYER);
if (!notes.length) throw new Error('no notes in group ' + GROUP);
if (!meta) throw new Error('no META curve in group ' + GROUP);

const T0 = meta.startSeconds;
const T1 = meta.endSeconds;
const SPAN = T1 - T0;

// cross-check the lengths against the IR (D49: the IR is authoritative for sound)
try {
  const ir = JSON.parse(fs.readFileSync('notation/ir/db1.ir.json', 'utf8'));
  const byObj = new Map(ir.events.map(e => [e.source.objectId, e]));
  let checked = 0, bad = 0;
  for (const n of notes) {
    const e = byObj.get(n.id);
    if (!e || e.technique !== 'staccato') continue;
    checked++;
    if (Math.abs(e.duration - lenOf(n.sonifyNote)) > 0.005) bad++;
  }
  console.log(`D51 length check vs db1 IR: ${checked} events, ${bad} mismatched`);
  if (bad) throw new Error('SI2 table and IR durations disagree — stop and look');
} catch (err) {
  if (/disagree/.test(err.message)) throw err;
  console.log('D51 length check skipped (' + err.message + ')');
}

// ── the target curve for (b) ──────────────────────────────────────────────────
// The META curve is a RATE CONTOUR normalised to its own maximum: cloud02.js wrote
// y = 0.5 + 9*(r/max). So (y-0.5)/9 recovers the shape in 0..1, and the target
// sounding count is that shape times the cap. Nodes are interpolated with a
// smoothstep — an approximation of the drawn bezier, close enough for an envelope
// and stated here rather than hidden.
function shapeAt(t) {
  const p = Math.max(0, Math.min(1, (t - T0) / SPAN));
  const nd = meta.nodes;
  let i = 0;
  while (i < nd.length - 2 && nd[i + 1].pos < p) i++;
  const a = nd[i], b = nd[i + 1];
  const span = b.pos - a.pos;
  const u = span <= 0 ? 0 : (p - a.pos) / span;
  const s = u * u * (3 - 2 * u);
  const y = a.y + (b.y - a.y) * s;
  return Math.max(0, (y - 0.5) / 9);
}
const targetAt = t => CAP * shapeAt(t);

// ── (b) thin by ensemble: cap the sounding count, round-robin across parts ────
function thinEnsemble() {
  const kept = [];
  const lastKept = new Array(PARTS).fill(-Infinity);
  const ringing = t => kept.reduce((n, k) =>
    n + (k.startSeconds <= t && t < k.startSeconds + lenOf(k.sonifyNote) ? 1 : 0), 0);

  for (let a = T0; a < T1; a += SLICE) {
    const b = a + SLICE;
    const slice = notes.filter(n => n.startSeconds >= a && n.startSeconds < b);
    if (!slice.length) continue;
    // longest-waiting part gets first refusal on the slots in this slice
    slice.sort((x, y) =>
      (x.startSeconds - lastKept[x.layer] === y.startSeconds - lastKept[y.layer])
        ? x.startSeconds - y.startSeconds
        : (y.startSeconds - lastKept[y.layer]) - (x.startSeconds - lastKept[x.layer]));
    // Everything admitted inside one slice counts as concurrent. The slice
    // (0.1 s) is far shorter than a staccato sample (0.33–0.53 s), so notes in
    // the same slice really do overlap — and without this the priority order
    // would let a note admitted out of time-order go uncounted by the notes
    // before it, which pushed the measured peak to 9 against a cap of 6.
    let admittedHere = 0;
    for (const n of slice) {
      if (ringing(n.startSeconds) + admittedHere < targetAt(n.startSeconds)) {
        kept.push(n);
        lastKept[n.layer] = n.startSeconds;
        admittedHere++;
      }
    }
  }
  return kept.sort((x, y) => x.startSeconds - y.startSeconds);
}

// ── (a) thin by part: every note must start after the previous one has rung out ─
function thinByPart() {
  const kept = [];
  for (let L = 0; L < PARTS; L++) {
    const part = notes.filter(n => n.layer === L);
    let last = null;
    for (const n of part) {
      if (!last || n.startSeconds >= last.startSeconds + RINGFRAC * lenOf(last.sonifyNote)) {
        kept.push(n); last = n;
      }
    }
  }
  return kept.sort((x, y) => x.startSeconds - y.startSeconds);
}

// ── (b2) thin by attack spacing: no two onsets closer than SPACING ────────────
// Walk the ensemble in time. Attacks within SPACING of the first unresolved one
// form a COLLISION GROUP — the ear hears them as a single impulse. Exactly one
// survives, and the next survivor must be SPACING later still.
//
// Who survives is the second dial, and it decides what happens to the accents:
//   roundrobin — the part that has waited longest. Even parts, but it discards the
//                loud attacks blind (10 of 33 fff survive at 30 ms).
//   loudest    — the loudest attack. Keeps 17 of 33 fff but starves parts (at
//                50 ms one part ended up with no notes at all).
//   hybrid     — loudest, UNLESS that part played within RECENT; then longest-
//                waiting. Keeps the accents without silencing anyone.
function thinBySpacing(T, mode) {
  const kept = [];
  const last = new Array(PARTS).fill(-Infinity);
  const waited = (n) => n.startSeconds - last[n.layer];
  const byWait    = (x, y) => waited(y) - waited(x);
  const byLoud    = (x, y) => (y.recVel - x.recVel) || byWait(x, y);
  const byHybrid  = (x, y) => {
    const jx = waited(x) < RECENT, jy = waited(y) < RECENT;
    if (jx !== jy) return jx ? 1 : -1;   // a part that just played sorts last
    return byLoud(x, y);
  };
  const pick = mode === 'roundrobin' ? byWait : mode === 'loudest' ? byLoud : byHybrid;

  let i = 0;
  while (i < notes.length) {
    const group = [notes[i]];
    let j = i + 1;
    while (j < notes.length && notes[j].startSeconds - group[0].startSeconds < T) group.push(notes[j++]);
    const lastKept = kept.length ? kept[kept.length - 1].startSeconds : -Infinity;
    const cands = group.filter(n => n.startSeconds - lastKept >= T);
    if (cands.length) {
      cands.sort(pick);
      kept.push(cands[0]);
      last[cands[0].layer] = cands[0].startSeconds;
    }
    i = j;
  }
  return kept;
}

// ── (b3) gap-fill, farthest-first ─────────────────────────────────────────────
// Composer, day 25: "find impulses that will thicken the texture… which impulses
// from the original will make this window denser without overlap."
//
// Every dropped note has a ROOM: its distance to the nearest kept attack, ensemble-
// wide. Add the note with the most room, recompute, repeat, stop when the best room
// left is under FILLFLOOR. This fills the sparsest moments first and never piles
// onto a busy one. Ties (within 5 ms) go to the part with the fewest notes, then
// the loudest — the fewest-notes rule alone lifts T6 from 1 note to 4–5.
//
// Proven before this was written: at the SAME floor as B2 nothing can come back
// (every dropped note is within `spacing` of a kept one — that is what the thinning
// pass did), so FILLFLOOR must be below SPACING. 30 ms is the fusion edge and the
// composer's one-notehead width on the video page.
function gapFill(base, floor) {
  const kept = base.slice();
  const per = new Array(PARTS).fill(0);
  for (const k of kept) per[k.layer]++;
  const keyOf = n => n.id;
  const have = new Set(kept.map(keyOf));
  const pool = notes.filter(n => !have.has(keyOf(n)));
  const added = [];
  const TIE_TOL = 0.005;
  for (;;) {
    // Room of every remaining candidate, then the TRUE maximum. Selection and the
    // stopping test must be kept apart: an earlier version folded the tie-break
    // into a running best-so-far, so a tied-but-roomier-looking candidate could
    // LOWER the tracked room below the real maximum — and the floor was then
    // tested against that drifted value. It stopped the 25 ms fill dead while
    // seven notes with 25–30 ms of room were still on the table.
    const cands = [];
    for (const n of pool) {
      if (have.has(keyOf(n))) continue;
      let r = Infinity;
      for (const k of kept) { const d = Math.abs(k.startSeconds - n.startSeconds); if (d < r) r = d; }
      cands.push({ n, r });
    }
    if (!cands.length) break;
    const maxRoom = cands.reduce((m, c) => Math.max(m, c.r), -Infinity);
    if (maxRoom < floor) break;
    // The tie pool is clamped at the floor as well as at maxRoom − tolerance:
    // without the clamp, a note within 5 ms of the roomiest could be admitted with
    // LESS than `floor` of room, and the 30 ms fill came out with a 27 ms gap in it.
    const tied = cands.filter(c => c.r >= Math.max(floor, maxRoom - TIE_TOL))
      .sort((x, y) => (per[x.n.layer] - per[y.n.layer]) || (y.n.recVel - x.n.recVel) || (y.r - x.r));
    const pick = tied[0].n;
    kept.push(pick); have.add(keyOf(pick)); per[pick.layer]++; added.push(pick);
  }
  return { set: kept.sort((x, y) => x.startSeconds - y.startSeconds), added };
}

// ── playability: the auditor's rule, restated here so the loop can run on it ──
// Same constants as tools/audit_playability.js (which mirrors Composer.CONFLICT in
// score/public/composer.html — the browser engine is the authority). HARD = the
// next note starts before the previous brick ends. SOFT = the re-attack is shorter
// than 110 ms plus a leap allowance (9.3 ms per semitone, capped at 220 ms).
const TONGUE_RESET = 0.03, MIN_ATTACK = 0.11, PER_SEMITONE = 0.0093, MAX_LEAP_ADD = 0.22;
const requiredAttack = (a, b) => MIN_ATTACK + Math.min(MAX_LEAP_ADD, Math.abs(b.sonifyNote - a.sonifyNote) * PER_SEMITONE);
function pairTier(a, b) {
  if (b.startSeconds < a.endSeconds - 1e-6) return 'hard';
  if (b.startSeconds - a.endSeconds < TONGUE_RESET - 1e-6) return 'soft';
  return (b.startSeconds - a.startSeconds) < requiredAttack(a, b) - 1e-6 ? 'soft' : 'free';
}
function flags(set) {
  const out = [];
  for (let L = 0; L < PARTS; L++) {
    const p = set.filter(n => n.layer === L).sort((x, y) => x.startSeconds - y.startSeconds);
    for (let i = 1; i < p.length; i++) {
      const tier = pairTier(p[i - 1], p[i]);
      if (tier !== 'free') out.push({ tier, a: p[i - 1], b: p[i], part: L });
    }
  }
  return out;
}

// ── redistribution: move a tight note to a part where it is free ──────────────
// Composer, day 25: "if it's not playable in a given part, redistribute some notes to
// another part — without changing or removing notes." Time and pitch never change;
// only `layer`. For each flagged pair the SECOND note is the candidate (the first is
// where the line was going). A receiving part qualifies when the note is `free`
// against both its neighbours there. Preference: the part with the fewest notes,
// then the smallest leap from that part's neighbours (keeps tessituras tight).
// Re-flag after every move; give up on a note that no part can take and report it.
function redistribute(set) {
  const work = set.map(n => ({ ...n }));
  const moves = [], stuck = [];
  for (let guard = 0; guard < 200; guard++) {
    const fl = flags(work);
    const f = fl.find(x => !stuck.includes(x.b.id));
    if (!f) break;
    const n = f.b;
    const per = new Array(PARTS).fill(0);
    for (const k of work) per[k.layer]++;
    let best = null;
    for (let Q = 0; Q < PARTS; Q++) {
      if (Q === n.layer) continue;
      const p = work.filter(k => k.layer === Q && k.id !== n.id).sort((x, y) => x.startSeconds - y.startSeconds);
      const prev = p.filter(k => k.startSeconds <= n.startSeconds).pop();
      const next = p.find(k => k.startSeconds > n.startSeconds);
      if (prev && pairTier(prev, n) !== 'free') continue;
      if (next && pairTier(n, next) !== 'free') continue;
      const leap = Math.max(prev ? Math.abs(prev.sonifyNote - n.sonifyNote) : 0, next ? Math.abs(next.sonifyNote - n.sonifyNote) : 0);
      const score = per[Q] * 100 + leap;
      if (!best || score < best.score) best = { Q, score, leap };
    }
    if (!best) { stuck.push(n.id); continue; }
    moves.push({ id: n.id, at: n.startSeconds, from: n.layer, to: best.Q, tier: f.tier, leap: best.leap });
    n.layer = best.Q;
  }
  return { set: work.sort((x, y) => x.startSeconds - y.startSeconds), moves, stuck: flags(work) };
}

// ── measurement (so the report is measured, not guessed) ──────────────────────
function census(set, label) {
  const per = new Array(PARTS).fill(0);
  for (const n of set) per[n.layer]++;
  const counts = [];
  for (let t = T0; t <= T1 + 0.6; t += 0.05) {
    counts.push(set.reduce((n, k) =>
      n + (k.startSeconds <= t && t < k.startSeconds + lenOf(k.sonifyNote) ? 1 : 0), 0));
  }
  const mean = counts.reduce((a, c) => a + c, 0) / counts.length;
  // largest gap opened inside each part
  let seams = 0;
  for (let L = 0; L < PARTS; L++) {
    const p = set.filter(n => n.layer === L);
    for (let i = 1; i < p.length; i++) if (p[i].startSeconds - p[i - 1].startSeconds >= 0.5) seams++;
  }
  // the ensemble-wide attack spacing — B2's criterion, reported for every version
  const t = set.map(n => n.startSeconds).sort((a, b) => a - b);
  let minGap = Infinity, fused = 0;
  for (let i = 1; i < t.length; i++) { const g = t[i] - t[i - 1]; if (g < minGap) minGap = g; if (g < 0.03) fused++; }
  const fff = set.filter(n => n.recVel >= 112).length;
  return { label, n: set.length, rate: +(set.length / SPAN).toFixed(1), per,
    soundingMax: Math.max(...counts), soundingMean: +mean.toFixed(1), breathSeams: seams,
    minAttackGapMs: Math.round(minGap * 1000), attacksInsideFusion: fused, fff };
}

const B  = thinEnsemble();
const A  = thinByPart();
const B2 = thinBySpacing(SPACING, TIE);
// the add-back chain: fill → audit → redistribute where a part is tight → next floor
const FILLED = [];
let seed = B2;
FILLFLOORS.forEach((floor, i) => {
  const fill = gapFill(seed, floor);
  const pre = fill.set;
  const redis = REDIST ? redistribute(pre) : { set: pre, moves: [], stuck: flags(pre) };
  const brief = f => ({ tier: f.tier, part: f.part + 1, at: +f.b.startSeconds.toFixed(3) });
  FILLED.push({
    name: 'B' + (i + 3), floor, set: redis.set,
    loop: { added: fill.added.length, flagsBeforeRedistribution: flags(pre).map(brief),
      moves: redis.moves, unresolved: redis.stuck.map(brief) },
  });
  seed = redis.set;
});

const reports = [census(notes, 'ORIGINAL'), census(B, 'B ensemble cap ' + CAP),
  census(A, 'A by-part'), census(B2, `B2 spacing ${Math.round(SPACING * 1000)}ms ${TIE}`),
  ...FILLED.map(f => census(f.set, `${f.name} +fill ${Math.round(f.floor * 1000)}ms`))];
const loop = Object.fromEntries(FILLED.map(f => [f.name, f.loop]));

// ── emit the scratch score ────────────────────────────────────────────────────
let nid = 1;
const objs = [];
const COPIES = [
  { set: notes, at: STARTS[0], group: 'grp-c2i-orig', color: '#5E8C7A', tag: 'ORIGINAL',
    label: `ORIGINAL — ${notes.length} notes, ${(notes.length / SPAN).toFixed(0)}/s`, meta: 'orig' },
  { set: B, at: STARTS[1], group: 'grp-c2i-b', color: '#B5651D', tag: 'B ensemble cap ' + CAP,
    label: `B ensemble cap ${CAP} — ${B.length} notes, ${(B.length / SPAN).toFixed(0)}/s`, meta: 'target' },
  { set: A, at: STARTS[2], group: 'grp-c2i-a', color: '#4A6FA5', tag: 'A by-part',
    label: `A by-part — ${A.length} notes, ${(A.length / SPAN).toFixed(0)}/s`, meta: null },
  { set: B2, at: STARTS[3], group: 'grp-c2i-b2', color: '#8E44AD',
    tag: `B2 spacing ${Math.round(SPACING * 1000)}ms ${TIE}`,
    label: `B2 attack spacing ${Math.round(SPACING * 1000)}ms ${TIE} — ${B2.length} notes, `
         + `${(B2.length / SPAN).toFixed(0)}/s`, meta: null },
  ...FILLED.map((f, i) => ({
    set: f.set, at: STARTS[4] + i * GAP, group: 'grp-c2i-' + f.name.toLowerCase(),
    color: ['#C0392B', '#D68910', '#7D6608'][i % 3],
    tag: `${f.name} fill ${Math.round(f.floor * 1000)}ms`,
    label: `${f.name} = gap-fill ${Math.round(f.floor * 1000)}ms — ${f.set.length} notes, `
         + `${(f.set.length / SPAN).toFixed(0)}/s`
         + (f.loop.moves.length ? `, ${f.loop.moves.length} redistributed` : ''),
    meta: null })),
];
const SLUG = { 'ORIGINAL': 'orig', 'A by-part': 'a' };

for (const c of COPIES) {
  const shift = c.at - T0;
  objs.push({ id: 'mk-' + (nid++), type: 'marker', layer: 0, time: +c.at.toFixed(3),
    label: c.label, color: c.color, groupId: c.group, performanceNotes: '', properties: {} });
  for (const n of c.set) {
    objs.push({ ...n, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(n.startSeconds + shift).toFixed(3),
      endSeconds: +(n.endSeconds + shift).toFixed(3),
      performanceNotes: c.tag });
  }
  if (c.meta === 'orig') {
    objs.push({ ...meta, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(meta.startSeconds + shift).toFixed(3),
      endSeconds: +(meta.endSeconds + shift).toFixed(3),
      performanceNotes: 'CLOUD02-I rate contour (the drawn gesture)' });
  } else if (c.meta === 'target') {
    // the cap-6 target, drawn back in the META convention so it reads like one
    const nds = meta.nodes.map(nd => ({ pos: nd.pos, y: nd.y, smooth: nd.smooth }));
    objs.push({ ...meta, id: 'wc-' + (nid++), groupId: c.group, color: c.color,
      startSeconds: +(meta.startSeconds + shift).toFixed(3),
      endSeconds: +(meta.endSeconds + shift).toFixed(3),
      nodes: nds,
      performanceNotes: `target sounding count ${(CAP * shapeAt(T0)).toFixed(1)}–${CAP} (same shape, capped)` });
  }
}

const out = {
  version: score.version, layoutVersion: score.layoutVersion,
  tracks: score.tracks, assets: {},
  metadata: {
    created: new Date().toISOString(), modified: new Date().toISOString(),
    provenance: {
      build: 'node ' + ['tools/cloud02i_ab.js', ...args].join(' '),
      source: SRC, group: GROUP, window: [+T0.toFixed(3), +T1.toFixed(3)],
      note: 'SCRATCH — three copies of CLOUD02-I for A/B listening. Nothing canonical; '
          + 'the chosen version becomes a SCORE EDIT ledgered in docs/ARCHIVE_AMENDMENTS.md.',
      census: reports,
      b3Loop: loop,
    },
  },
  objects: objs, markers: [],
  databases: score.databases, nextId: nid,
  viewport: { pixelsPerSecond: 120, scrollOffset: 0 },
};
fs.writeFileSync(OUT, JSON.stringify(out));

// ── one score per version, rebased to 0, so the tools see one at a time ───────
if (ISOLATE) {
  for (const c of COPIES) {
    const slug = SLUG[c.tag] || c.group.replace('grp-c2i-', '');
    const file = OUT.replace(/-ab\.json$/, '-' + slug + '.json');
    let id = 1;
    const only = objs.filter(o => o.groupId === c.group).map(o => {
      const x = { ...o, id: (o.type === 'marker' ? 'mk-' : 'wc-') + (id++) };
      if (o.type === 'marker') x.time = +(o.time - c.at).toFixed(3);
      else { x.startSeconds = +(o.startSeconds - c.at).toFixed(3); x.endSeconds = +(o.endSeconds - c.at).toFixed(3); }
      return x;
    });
    fs.writeFileSync(file, JSON.stringify({ ...out,
      metadata: { ...out.metadata, provenance: { ...out.metadata.provenance,
        note: 'SCRATCH: ' + c.tag + ' alone, rebased to 0, for audit / IR extract / pattern analysis.' } },
      objects: only, nextId: id }));
    console.log('  isolated → ' + file + '  (' + only.filter(o => o.type === 'waveCurve' && o.layer < META_LAYER).length + ' notes)');
  }
}

for (const r of reports) {
  console.log(`${r.label.padEnd(26)} ${String(r.n).padStart(3)} notes ${String(r.rate).padStart(5)}/s  `
    + `sounding ${String(r.soundingMax).padStart(2)}/${String(r.soundingMean).padStart(4)}  `
    + `min attack gap ${String(r.minAttackGapMs).padStart(3)}ms  fused ${String(r.attacksInsideFusion).padStart(3)}  `
    + `fff ${String(r.fff).padStart(2)}/33  seams ${String(r.breathSeams).padStart(2)}  [${r.per.join(' ')}]`);
}
const fmtFlag = f => `${f.tier} T${f.part}@${f.at}`;
console.log();
for (const f of FILLED) {
  const L = f.loop;
  console.log(`${f.name} loop (floor ${Math.round(f.floor * 1000)}ms): +${L.added} added`
    + ` · flags before redistribution ${L.flagsBeforeRedistribution.length}`
    + (L.flagsBeforeRedistribution.length ? ' [' + L.flagsBeforeRedistribution.map(fmtFlag).join(', ') + ']' : '')
    + ` · moves ${L.moves.length}`
    + (L.moves.length ? ' [' + L.moves.map(m => `${m.id}@${m.at.toFixed(2)} T${m.from + 1}→T${m.to + 1}`).join(', ') + ']' : '')
    + ` · unresolved ${L.unresolved.length}`
    + (L.unresolved.length ? ' [' + L.unresolved.map(fmtFlag).join(', ') + ']' : ''));
}
console.log('\nwrote ' + OUT + ' — ' + objs.length + ' objects, copies at '
  + COPIES.map(c => c.at + 's').join(' / '));
