// pulse_seq.js — PLAN 2aa, the pulse sequencer's engine.
//
// PURE. No DOM, no MIDI, no fetch, no fs, no Date, no Math.random. Loads in the
// browser (window.PulseSeq) and in node (module.exports) from the same file —
// the morph.js / texture_engine.js pattern, and what makes tools/test_pulse.js
// possible and cheap. The panel holds the DOM and the timers; everything that
// can be wrong about the NOTES is decided here, where a test can see it.
//
// v1 IS AUDITION-ONLY. Nothing in this file writes a score object. The grid ->
// waveCurve emitter is PLAN 2aa v2 and is deliberately absent.
//
// TWO RULES ARE INHERITED, NOT INVENTED, AND BOTH MATTER:
//
//   1. PER-NOTE ARTICULATION (`techFor`). A banked sonority carries `artic` per
//      pitch plus cuivreConverted/cuivreAdded; a pitch in either cuivre list
//      plays cuivre, otherwise its artic entry. This is the same rule the blast
//      inserter uses (composer.html durFor/auditionSon). It is load-bearing
//      here: FIVE of the composer's seven staccato/cuivre pairs — S020/S023,
//      S026/S029, S032/S035, S038/S041, S044/S047 — have IDENTICAL pitch sets
//      and differ ONLY in articulation. Force everything to staccato (as 2aa's
//      first draft said) and half the menu becomes silent duplicates.
//
//   2. ORD IS THE ONLY REAL DURATION (PLAN 2n / D9). fp, staccato and cuivre are
//      FIXED one-shots — the sample ends itself — so a fixed note takes its
//      MEASURED length and the grid's note-length field cannot stretch it. The
//      field still governs anything variable (ord). Handing the grid length to a
//      staccato would draw a 0.25 s block over a 0.45 s sound: the exact lie 2n
//      was written to stop.

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PulseSeq = api;
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pitchName = m => (m == null ? '?' : NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1));

const LANES = 10;                 // ten tubas (journal day 15: "10 parts tracks one to ten")
const DEFAULT_TECH = 'staccato';
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r4 = x => +x.toFixed(4);

// THE canonical technique rule — mirrored from the blast inserter so the pulse
// strip and the Insertion strip can never disagree about what a sonority IS.
function techFor(son, pitch) {
    const cv = (son.cuivreConverted || []).indexOf(pitch) >= 0 ||
               (son.cuivreAdded || []).indexOf(pitch) >= 0;
    return cv ? 'cuivre' : ((son.artic || {})[pitch] || 'ord');
}

// ---------------------------------------------------------------- the palette
//
// Resolve bank/pulse_palette.json against bank/blast_taxonomy.json. Refs resolve
// LIVE (2aa's extensibility contract) so a rename or an edit in the taxonomy
// reaches the menu without anyone touching this file.
//
// A BROKEN REF IS KEPT, NOT DROPPED (methodology rule 3: never silently
// discard). It arrives as an entry with `missing:true` and zero pitches, and its
// reason lands in `problems` where the panel shows it. A menu that quietly
// shrinks is how you lose an hour.
function resolvePalette(file, tax) {
    const src = (file && file.entries) || {};
    const sons = (tax && tax.sonorities) || {};
    const out = { order: [], entries: {}, problems: [] };

    Object.keys(src).forEach(id => {
        const e = src[id] || {};
        const entry = { id: id, label: e.label || id, ref: e.ref || null,
                        pitches: [], tech: {}, missing: false };

        if (e.ref) {
            const son = sons[e.ref];
            if (!son || !Array.isArray(son.pitches)) {
                entry.missing = true;
                out.problems.push(id + ': ref ' + e.ref + ' not in blast_taxonomy.json');
            } else {
                entry.pitches = son.pitches.slice().sort((a, b) => a - b);
                entry.pitches.forEach(p => { entry.tech[p] = techFor(son, p); });
                entry.chord = son.chord || null;
                entry.voicing = son.voicing || null;
                if (son.dyn != null) entry.dyn = son.dyn;
            }
        } else {
            const t = e.technique || DEFAULT_TECH;
            entry.pitches = (Array.isArray(e.pitches) ? e.pitches.slice() : [])
                .filter(p => typeof p === 'number' && isFinite(p))
                .sort((a, b) => a - b)
                .filter((p, i, a) => i === 0 || p !== a[i - 1]);
            entry.pitches.forEach(p => { entry.tech[p] = t; });
        }
        entry.silent = entry.pitches.length === 0;
        out.order.push(id);
        out.entries[id] = entry;
    });

    if (!out.order.length) out.problems.push('palette has no entries');
    return out;
}

// ------------------------------------------------------------------- the grid
//
// grid  = { bpm, columns, noteLen, cells: [entryId | null, ...] }
// pal   = the resolved palette above
// opts  = { techLength(tech, midi) -> seconds|null   (Composer.techLength; null = variable)
//           level, velocity, lanes, laneStart }
//
// Returns { notes, meta }. A note is deliberately shaped for the emit layer:
//   { voice, midi, tStart, dur, technique, vel, level, col, entry }
//
// LANES ARE ROUTING, NOT ORCHESTRATION (2aa: the lane/entry-order split and
// doubling are v4). One rotating cursor walks 0..9 across the WHOLE grid rather
// than restarting each column, so a 3-note pitch-class entry spreads over the
// ensemble instead of hammering tubas 1-3 for thirty-two columns.
function buildGrid(grid, pal, opts) {
    const o = opts || {};
    const lanes = o.lanes || LANES;
    const techLength = typeof o.techLength === 'function' ? o.techLength : null;
    const level = o.level != null ? o.level : 10;
    const velocity = o.velocity != null ? o.velocity : 127;

    const bpm = clamp(+grid.bpm || 130, 20, 400);
    const columns = Math.round(clamp(+grid.columns || 32, 1, 256));
    const noteLen = clamp(+grid.noteLen || 0.25, 0.02, 10);
    const step = 60 / bpm;
    const fallback = pal.order[0] || null;

    const notes = [];
    const unknown = [];
    const used = {};
    let cursor = (o.laneStart || 0) % lanes;
    let silentCols = 0, missingCols = 0;

    for (let i = 0; i < columns; i++) {
        let id = (grid.cells || [])[i];
        if (id == null) id = fallback;
        let entry = pal.entries[id];
        if (!entry) {
            // an id the palette no longer has (an entry was renamed out from
            // under a saved grid). Say so, fall back, never drop the column.
            if (id != null && unknown.indexOf(id) < 0) unknown.push(id);
            entry = pal.entries[fallback];
        }
        if (!entry) continue;
        used[entry.id] = (used[entry.id] || 0) + 1;
        if (entry.missing) missingCols++;
        if (!entry.pitches.length) { silentCols++; continue; }

        const tStart = r4(i * step);
        entry.pitches.forEach(midi => {
            const technique = entry.tech[midi] || DEFAULT_TECH;
            const measured = techLength ? techLength(technique, midi) : null;
            notes.push({
                voice: cursor,
                midi: midi,
                tStart: tStart,
                dur: r4(measured != null ? measured : noteLen),
                technique: technique,
                vel: entry.dyn != null ? entry.dyn : velocity,
                level: level,
                col: i,
                entry: entry.id,
            });
            cursor = (cursor + 1) % lanes;
        });
    }

    notes.sort((a, b) => a.tStart - b.tStart || a.midi - b.midi);
    const span = r4(columns * step);
    const tail = notes.reduce((m, n) => Math.max(m, n.tStart + n.dur), 0);

    return {
        notes: notes,
        meta: {
            bpm: bpm, columns: columns, noteLen: noteLen, step: r4(step),
            span: span, tail: r4(tail), overhang: r4(Math.max(0, tail - span)),
            lanes: lanes, laneNext: cursor,
            sounding: columns - silentCols, silentCols: silentCols,
            missingCols: missingCols, unknown: unknown, used: used,
        },
    };
}

// What a column costs one player: with `lanes` lanes and a chord of N notes, the
// same lane comes round every lanes/N columns. Reported by the panel so an
// unplayable-looking grid says so BEFORE the composer builds a section on it.
// (2r: the mock-up plays double-booking perfectly cleanly — the ear cannot
// catch this, so it has to be shown.)
function lanePressure(built) {
    const per = {};
    built.notes.forEach(n => { (per[n.voice] = per[n.voice] || []).push(n.tStart); });
    let tightest = Infinity, who = null;
    Object.keys(per).forEach(v => {
        const ts = per[v].slice().sort((a, b) => a - b);
        for (let i = 1; i < ts.length; i++) {
            const gap = ts[i] - ts[i - 1];
            if (gap < tightest) { tightest = gap; who = +v; }
        }
    });
    return { tightestGap: tightest === Infinity ? null : r4(tightest), lane: who };
}

return {
    LANES: LANES, DEFAULT_TECH: DEFAULT_TECH,
    pitchName: pitchName, techFor: techFor,
    resolvePalette: resolvePalette, buildGrid: buildGrid, lanePressure: lanePressure,
};
}));
