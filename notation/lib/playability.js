// playability.js — THE ONE RULE MODULE for "can a player actually do this".
//
// Written day 25 (2026-08-23). Before this the same constants and the same
// pairTier() lived in three places — `Composer.CONFLICT` in composer.html,
// `tools/audit_playability.js`, and a private copy inside `tools/cloud02i_ab.js`
// — "kept in sync by hand", which is a promise no one keeps. Everything now
// imports from here, and `tools/test_playability.js` asserts these constants
// equal the ones it READS out of composer.html, so the browser engine stays the
// authority (its tinting is what the composer sees while working) and this file
// stays honest about following it.
//
// FOUR LEVELS, kept apart (docs/PLAYABILITY_MODEL.md). This module covers 1–3
// and reports 4; only 1 is physics.
//
//   1 HARD      two notes sounding at once on one player
//   2 SOFT      the re-attack is faster than a player can tongue + move
//   3 BREATH    the player never gets a chance to inhale
//   4 AUDIBILITY  the EAR cannot separate the attacks — reported, never acted on
//
// Level 4 is here because the composer's day-25 instruction was explicit:
// *"this process is strictly for playability… the smear or audibility is of
// secondary concern. And then I don't mind getting a flag about those other
// aspects."* So audibility() exists to FLAG, and nothing in this module ever
// removes a note.

'use strict';

const fs = require('fs');
const path = require('path');

const META_LAYER = 10;
const PARTS = 10;

// ── Level 1 + 2: the re-attack rule ──────────────────────────────────────────
// Numbers come from 2j's measured tremolo table, which IS an attack rate:
// half step 4.5 Hz = 0.111 s; fifth 3.0 Hz = 0.167 s; slope = (0.167−0.111)/6.
// Measured ATTACK-TO-ATTACK, which is what a player feels — measuring the
// end-to-start gap was tried and was wrong, because a fixed one-shot's written
// length includes decay the player is not articulating through.
const CONFLICT = {
  tongueReset: 0.03,   // minimum silence between two notes on one player
  minAttack: 0.11,     // slur-speed limit at a half step
  perSemitone: 0.0093, // 2j's own slope
  maxLeapAdd: 0.22,    // reached at ~2 octaves
};

const requiredAttack = (a, b) =>
  CONFLICT.minAttack + Math.min(CONFLICT.maxLeapAdd,
    Math.abs(b.sonifyNote - a.sonifyNote) * CONFLICT.perSemitone);

function pairTier(a, b) {
  if (b.startSeconds < a.endSeconds - 1e-6) return 'hard';
  if (b.startSeconds - a.endSeconds < CONFLICT.tongueReset - 1e-6) return 'soft';
  return (b.startSeconds - a.startSeconds) < requiredAttack(a, b) - 1e-6 ? 'soft' : 'free';
}

const noteEvents = objects => objects.filter(o =>
  o && o.type === 'waveCurve' && o.sonifyNote != null
  && o.layer >= 0 && o.layer < META_LAYER
  && o.startSeconds != null && o.endSeconds != null);

const byPart = (notes) => {
  const lanes = Array.from({ length: PARTS }, () => []);
  for (const o of notes) lanes[o.layer].push(o);
  lanes.forEach(l => l.sort((x, y) => x.startSeconds - y.startSeconds));
  return lanes;
};

/** Every consecutive pair on one player that is not FREE. */
function flags(notes) {
  const out = [];
  byPart(notes).forEach((p, part) => {
    for (let i = 1; i < p.length; i++) {
      const tier = pairTier(p[i - 1], p[i]);
      if (tier !== 'free') {
        out.push({ tier, part, a: p[i - 1], b: p[i],
          attack: p[i].startSeconds - p[i - 1].startSeconds,
          need: requiredAttack(p[i - 1], p[i]),
          overlap: p[i - 1].endSeconds - p[i].startSeconds });
      }
    }
  });
  return out.sort((x, y) => x.b.startSeconds - y.b.startSeconds);
}

// ── Redistribution — the fix that changes nobody's music ─────────────────────
// Composer, day 25: *"if it's not playable in a given part, redistribute some
// notes to another part — without changing or removing notes."* Only `layer`
// moves. Time, pitch, velocity, technique, group: never.
//
// TWO PASSES. The second note of a tight pair is tried first (the first note is
// where the line was going). If no part can take it, the FIRST note is tried —
// added day 25 because at the tail of CLOUD02-I every part was busy and two
// pairs had no home for their second note, while the first note of each had
// several. Without the second pass those two would have been left for the
// composer to accept or fix by hand.
//
// A receiving part qualifies only when the note is FREE against both its new
// neighbours. Preference: fewest notes (keeps the ensemble even), then smallest
// leap (keeps tessituras tight). Re-flag after every move — a move can create a
// new pair. Notes no part can take are REPORTED, never forced.
function redistribute(notes, opts = {}) {
  const limit = opts.limit || 200;
  const work = notes.map(n => ({ ...n }));
  const moves = [], givenUp = [];

  const homeFor = (n) => {
    const per = new Array(PARTS).fill(0);
    for (const k of work) per[k.layer]++;
    let best = null;
    for (let Q = 0; Q < PARTS; Q++) {
      if (Q === n.layer) continue;
      const p = work.filter(k => k.layer === Q && k.id !== n.id)
        .sort((x, y) => x.startSeconds - y.startSeconds);
      const prev = p.filter(k => k.startSeconds <= n.startSeconds).pop();
      const next = p.find(k => k.startSeconds > n.startSeconds);
      if (prev && pairTier(prev, n) !== 'free') continue;
      if (next && pairTier(n, next) !== 'free') continue;
      const leap = Math.max(prev ? Math.abs(prev.sonifyNote - n.sonifyNote) : 0,
        next ? Math.abs(next.sonifyNote - n.sonifyNote) : 0);
      const score = per[Q] * 100 + leap;
      if (!best || score < best.score) best = { part: Q, score, leap };
    }
    return best;
  };

  for (let guard = 0; guard < limit; guard++) {
    const f = flags(work).find(x => !givenUp.includes(x.b.id));
    if (!f) break;
    let n = f.b, home = homeFor(n), which = 'second';
    if (!home) { n = f.a; home = homeFor(n); which = 'first'; }
    if (!home) { givenUp.push(f.b.id); continue; }
    moves.push({ id: n.id, at: n.startSeconds, midi: n.sonifyNote,
      from: n.layer, to: home.part, tier: f.tier, which,
      attack: f.attack, need: f.need,
      pairWith: which === 'second' ? f.a.id : f.b.id });
    n.layer = home.part;
  }
  return { notes: work.sort((x, y) => x.startSeconds - y.startSeconds),
    moves, unresolved: flags(work) };
}

// ── Level 3: breath ──────────────────────────────────────────────────────────
// NOT MEASURED — a model from brass pedagogy, stated as one. The dials are for a
// tubist to correct (docs/PLAYABILITY_MODEL.md, "Open"). Tonguing rate is level
// 2's business; this is air: how many puffs, how loud, how low, between inhales.
// A staccato costs a fraction of a held note, so a 4 s staccato burst is NOT a
// 4 s held note.
const BREATH = {
  catchGap: 0.5,  // a gap this long between attacks = a quick top-up
  fullGap: 1.0,   // = a real inhale
  maxRunCatch: 5,   // seconds of loud low playing before one is needed
  maxRunFull: 10,   // seconds before a full one is needed
};

/** Per part: the longest stretch of attacks with no gap >= each threshold. */
function breathRuns(notes, dials = BREATH) {
  return byPart(notes).map((p, part) => {
    if (p.length < 2) {
      return { part, n: p.length, catchRun: 0, fullRun: 0, catchAt: null, fullAt: null,
        okCatch: true, okFull: true, held: 0 };
    }
    const longest = (gap) => {
      let best = { dur: 0, from: p[0].startSeconds, n: 0 };
      let cur = [p[0]];
      const close = () => {
        const dur = cur[cur.length - 1].startSeconds - cur[0].startSeconds;
        if (dur > best.dur) best = { dur, from: cur[0].startSeconds, n: cur.length };
      };
      for (let i = 1; i < p.length; i++) {
        if (p[i].startSeconds - p[i - 1].startSeconds >= gap) { close(); cur = []; }
        cur.push(p[i]);
      }
      close();
      return best;
    };
    const c = longest(dials.catchGap), f = longest(dials.fullGap);
    // sustained material spends air continuously — reported separately
    const held = p.filter(o => (o.technique || 'staccato') !== 'staccato')
      .reduce((a, o) => a + (o.endSeconds - o.startSeconds), 0);
    return { part, n: p.length,
      catchRun: c.dur, catchAt: c.from, catchNotes: c.n,
      fullRun: f.dur, fullAt: f.from, fullNotes: f.n,
      okCatch: c.dur <= dials.maxRunCatch, okFull: f.dur <= dials.maxRunFull,
      held: +held.toFixed(2) };
  });
}

// ── Level 4: audibility — REPORTED, never acted on ───────────────────────────
// D51 sample lengths give the sounding count; 30 ms is the fusion window inside
// which the ear takes two onsets as one impulse (and, not by coincidence, the
// composer's one-notehead width at page scale).
const FUSION = 0.03;

function staccatoLengths(root) {
  const md = fs.readFileSync(path.join(root || path.join(__dirname, '..', '..'),
    'docs', 'SI2_staccato_lengths.md'), 'utf8');
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

function audibility(notes, lengths) {
  const len = n => (lengths && lengths[n.sonifyNote] != null)
    ? lengths[n.sonifyNote] : (n.endSeconds - n.startSeconds);
  const t = notes.map(n => n.startSeconds).sort((a, b) => a - b);
  let fused = 0, minGap = Infinity;
  for (let i = 1; i < t.length; i++) {
    const g = t[i] - t[i - 1];
    if (g < FUSION) fused++;
    if (g < minGap) minGap = g;
  }
  const t0 = Math.min(...notes.map(n => n.startSeconds));
  const t1 = Math.max(...notes.map(n => n.startSeconds));
  const counts = [];
  for (let x = t0; x <= t1 + 0.6; x += 0.05) {
    counts.push(notes.reduce((a, n) => a + (n.startSeconds <= x && x < n.startSeconds + len(n) ? 1 : 0), 0));
  }
  return {
    notes: notes.length,
    rate: t1 > t0 ? +(notes.length / (t1 - t0)).toFixed(1) : 0,
    fused, fusionWindowMs: FUSION * 1000,
    minAttackGapMs: minGap === Infinity ? null : Math.round(minGap * 1000),
    soundingMax: counts.length ? Math.max(...counts) : 0,
    soundingMean: counts.length ? +(counts.reduce((a, c) => a + c, 0) / counts.length).toFixed(1) : 0,
  };
}

module.exports = {
  META_LAYER, PARTS, CONFLICT, BREATH, FUSION,
  requiredAttack, pairTier, noteEvents, byPart,
  flags, redistribute, breathRuns, audibility, staccatoLengths,
};
