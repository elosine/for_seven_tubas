// extract_core.js — pure S1 → IR extraction (Phase B1, plan DB-6).
// Dual-load (node + browser). No filesystem access: caller supplies the
// parsed score, the registry, and the sample-length bank.
//
// Trance-scope segmentation (DB-6): per part, staccato/cuivre events form a
// STREAM while consecutive inter-onset intervals are integer multiples of a
// shared pulse unit (approx-GCD refined, least-squares fitted). Runs of >= 2
// promote to class trance-stream; singletons stay fixed-oneshot. ord/fp
// material chunks singly, strategy unresolved (realization is material-time,
// amendment 1). Derived ids are deterministic (spec §1): ev-<objectId>,
// ch-<part>-<firstEventObjectId>; per-chunk group/device ids derive from the
// chunk's source id so they stay unique and stable.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./classify.js'));
  } else {
    root.NotationExtract = factory(root.NotationClassify);
  }
})(typeof self !== 'undefined' ? self : this, function (Classify) {

  const DEFAULTS = {
    TOL: 0.015,        // s — onset tolerance for grid membership (trance is near-exact)
    GAPMAX: 4.0,       // s — a gap beyond this always breaks a run (section break)
    KMAX: 12,          // max grid multiples a single gap may span inside a run
    MAXUNIT: 2.0,      // s — a first-IOI above this starts no stream
    PLAYABLE: 0.09,    // s — D43 playable-unit floor: below it, strategy=proportional;
                       //     ALSO the rebase floor (see segment) — a rebased unit finer
                       //     than a playable pulse is a fabricated grid, the E1
                       //     false-positive one level down
    BEAT_MIN: 0.3,     // s — countable-beat floor for the subdivision choice
    // --- 'section1' profile (played material; E1's frame, D43's constraints) ---
    SEG_K: 2.0,        // split when a gap exceeds SEG_K × the local median IOI…
    SEG_FLOOR: 0.35,   // …with this absolute floor on the split threshold (s)
    MINRUN: 6,         // a group below this is residue, not a bar (D43: "a chunk of 3 notes is useless")
    EPS: 0.02,         // s — per-onset tolerance for a metric fit (THE open ε dial, A1 §8 row 3)
    UNIT_MAX: 1.0,     // s — no pulse slower than this inside a fitted bar
  };

  const PC = { 0: ['C', 0], 1: ['C', 1], 2: ['D', 0], 3: ['D', 1], 4: ['E', 0], 5: ['F', 0], 6: ['F', 1], 7: ['G', 0], 8: ['G', 1], 9: ['A', 0], 10: ['A', 1], 11: ['B', 0] };
  function naiveSpell(midi) {
    const pc = ((midi % 12) + 12) % 12;
    const [step, alter] = PC[pc];
    return { step, alter, octave: Math.floor(midi / 12) - 1 };
  }

  function approxGcd(a, b, tol) {
    // Euclid with tolerance; a,b > 0.
    let x = Math.max(a, b), y = Math.min(a, b);
    while (y > tol) {
      const r = x - Math.round(x / y) * y;
      x = y; y = Math.abs(r);
    }
    return x;
  }

  // Least-squares unit through the anchor: rel_i ≈ n_i · u.
  function fitUnit(rels, u0, TOL) {
    let u = u0;
    for (let pass = 0; pass < 3; pass++) {
      const ns = rels.map(r => Math.max(0, Math.round(r / u)));
      let num = 0, den = 0;
      for (let i = 0; i < rels.length; i++) { num += ns[i] * rels[i]; den += ns[i] * ns[i]; }
      if (den === 0) return null;
      u = num / den;
    }
    const ns = rels.map(r => Math.round(r / u));
    let maxErr = 0;
    for (let i = 0; i < rels.length; i++) maxErr = Math.max(maxErr, Math.abs(rels[i] - ns[i] * u));
    // grid must be strictly increasing (two notes may not share a slot)
    for (let i = 1; i < ns.length; i++) if (ns[i] <= ns[i - 1]) return null;
    if (maxErr > TOL) return null;
    return { u, ns, maxErr };
  }

  // Classes that may JOIN a pulse stream as woven accent/pulse events (the
  // trance fabric: staccato pulses + VERT chord hits + short plain ords, all
  // on the player's grid). Multi-node material (drawn crescendos, morphs)
  // always SPLITS a stream — its realization is its own chunk.
  const STREAM_JOINABLE = new Set(['fixed-oneshot', 'ord-sustained']);

  // Segment one part's time-sorted {ev, cls} items: joinable items form
  // pulse runs; splitter items flush the run and stand alone.
  function segment(items, opt) {
    const runs = [];      // {events: [ev], unit} — joinable runs (unit null if single)
    const splitters = []; // {ev, cls} — always their own chunk
    let run = [];
    let unit = null;
    const flush = () => { if (run.length) runs.push({ events: run, unit }); run = []; unit = null; };
    for (const item of items) {
      if (!STREAM_JOINABLE.has(item.cls)) { flush(); splitters.push(item); continue; }
      const e = item.ev;
      if (!run.length) { run.push(e); continue; }
      const d = e.onset - run[run.length - 1].onset;
      if (d <= opt.TOL) {
        // (near-)same onset as the previous stream note — a stacked dyad or
        // coinciding accent. It can never occupy a grid slot of its own
        // (grids are strictly increasing), and letting it into the run used
        // to fail the whole fit and demote EVERY note to a parachute brick
        // (review finding, proven by run). Sideline it; the run survives.
        splitters.push(item);
        continue;
      }
      if (d > opt.GAPMAX) { flush(); run.push(e); continue; }
      if (unit === null) {
        if (d <= opt.MAXUNIT && d > 0) { unit = d; run.push(e); }
        else { flush(); run.push(e); }
        continue;
      }
      let k = Math.round(d / unit);
      if (k < 1 || Math.abs(d - k * unit) > opt.TOL) {
        // Try rebasing on a finer common unit — ONLY when the finer unit is
        // itself a plausible pulse: at least the PLAYABLE floor, and a
        // near-integer subdivision of the current unit. Without both guards
        // the approx-GCD will glue two unrelated streams on a fabricated
        // fine grid (measured live at the A3 seam: gcd(0.75, 0.136) "found"
        // a 0.068 s unit that fit everything — D43's false positive).
        const g = approxGcd(unit, d, opt.TOL / 2);
        const div = unit / g;
        const ok = g >= opt.PLAYABLE && g <= opt.MAXUNIT &&
          Math.abs(div - Math.round(div)) <= 0.05 &&
          run.slice(1).every((_, i) => {
            const dd = run[i + 1].onset - run[i].onset;
            return Math.abs(dd - Math.round(dd / g) * g) <= opt.TOL;
          }) && Math.abs(d - Math.round(d / g) * g) <= opt.TOL && Math.round(d / g) <= opt.KMAX;
        if (ok) { unit = g; k = Math.round(d / g); }
        else { flush(); run.push(e); continue; }
      }
      if (k > opt.KMAX) { flush(); run.push(e); continue; }
      run.push(e);
    }
    flush();
    return { runs, splitters };
  }

  // ---- 'section1' profile: played material (Phase D, slice 2) ----
  // Segmentation by E1's perceptual-gap rule; per-group least-squares fit
  // constrained to PLAYABLE units (>= the D43 floor); fit within EPS ->
  // simple-bar, else the group is proportional RESIDUE (fit-as-data where a
  // best fit exists but misses tolerance — the A5 pattern). Groups shorter
  // than MINRUN are residue by definition.
  function segmentPlayed(items, opt) {
    const runs = [];
    const splitters = [];
    let run = [];
    const flush = () => { if (run.length) runs.push(run); run = []; };
    const iois = [];
    for (const item of items) {
      if (!STREAM_JOINABLE.has(item.cls)) { flush(); splitters.push(item); continue; }
      const e = item.ev;
      if (!run.length) { run.push(e); continue; }
      const d = e.onset - run[run.length - 1].onset;
      if (d <= opt.TOL / 2) { splitters.push(item); continue; } // stacked duplicate
      const recent = iois.slice(-6).sort((a, b) => a - b);
      const med = recent.length ? recent[Math.floor(recent.length / 2)] : d;
      const threshold = Math.max(opt.SEG_K * med, opt.SEG_FLOOR);
      if (d > threshold) { flush(); run.push(e); iois.length = 0; }
      else { run.push(e); iois.push(d); }
    }
    flush();
    return { runs, splitters };
  }

  function fitPlayed(evs, opt) {
    const anchor = evs[0].onset;
    const rels = evs.map(e => e.onset - anchor);
    const iois = [];
    for (let i = 1; i < evs.length; i++) iois.push(evs[i].onset - evs[i - 1].onset);
    const sorted = iois.slice().sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const cands = new Set();
    for (const base of [med, sorted[0], sorted[sorted.length - 1]]) {
      for (let k = 1; k <= 10; k++) {
        const u = base / k;
        if (u >= opt.PLAYABLE - 1e-9 && u <= opt.UNIT_MAX + 1e-9) cands.add(+u.toFixed(6));
      }
    }
    let best = null;
    for (const u0 of cands) {
      const f = fitUnit(rels, u0, opt.EPS);
      if (!f || f.u < opt.PLAYABLE - 1e-9 || f.u > opt.UNIT_MAX + 1e-9) continue;
      if (!best || f.maxErr < best.maxErr - 1e-9 || (Math.abs(f.maxErr - best.maxErr) <= 1e-9 && f.u > best.u)) best = f;
    }
    return best; // null => no playable fit within EPS
  }

  // Claim MAXIMAL fitting sub-runs inside a perceptual group (E1's frame —
  // one outlier must not condemn the whole segment). Left-to-right: extend
  // each candidate start as far as a fit survives; claim the longest;
  // leftovers between claims become proportional residue.
  function fitSubruns(evs, opt) {
    const n = evs.length;
    const claims = [];
    let i = 0;
    while (i <= n - opt.MINRUN) {
      let best = null, fails = 0;
      for (let j = i + opt.MINRUN - 1; j < n; j++) {
        const f = fitPlayed(evs.slice(i, j + 1), opt);
        if (f) { best = { j, f }; fails = 0; }
        else if (best && ++fails >= 3) break; // adding notes only degrades past here
      }
      if (best) { claims.push({ i, j: best.j, fit: best.f }); i = best.j + 1; }
      else i++;
    }
    const leftovers = [];
    let prev = 0;
    for (const c of claims) {
      if (c.i > prev) leftovers.push([prev, c.i]);
      prev = c.j + 1;
    }
    if (prev < n) leftovers.push([prev, n]);
    return { claims, leftovers };
  }

  function extract(score, params) {
    const opt = Object.assign({}, DEFAULTS, params.options || {});
    const profile = params.profile || 'trance';
    const { scoreName, window: [w0, w1], parts, id, registry, sampleLengths, date, toolName } = params;
    Classify.assertRegistry(registry);
    const warnings = [];

    // HALF-OPEN window (A3 span-ownership law; matches render.js's page
    // rule): an onset exactly at w1 belongs to the NEXT window. Was
    // inclusive both ends — surfaced day 21 when a piece extraction hit
    // an onset at exactly the cut and the chunk-span validator refused it.
    const inWin = o => o.type === 'waveCurve' && o.startSeconds >= w0 && o.startSeconds < w1 && parts.includes(o.layer);
    const objs = score.objects.filter(inWin).sort((a, b) => a.startSeconds - b.startSeconds || a.layer - b.layer);

    const events = [];
    const perPart = new Map(parts.map(p => [p, []]));
    for (const o of objs) {
      const cls = Classify.classify(o);
      if (cls === 'meta-shape' || cls === 'marker-label') continue; // S1 read-through
      if (o.sonifyNote === undefined) throw new Error('extract: ' + o.id + ' (' + cls + ') has no sonifyNote');
      let duration;
      if (cls === 'fixed-oneshot') {
        const table = sampleLengths[o.technique];
        const len = table && table[String(o.sonifyNote)];
        if (len) duration = len;
        else { duration = o.endSeconds - o.startSeconds; warnings.push(o.id + ': no ' + o.technique + ' sample length for midi ' + o.sonifyNote + '; using drawn length'); }
      } else {
        duration = o.endSeconds - o.startSeconds; // ORD family: real duration (D9)
      }
      const ev = {
        id: 'ev-' + o.id,
        source: { score: scoreName, objectId: o.id },
        onset: o.startSeconds,
        duration,
        pitch: { midi: o.sonifyNote, spelled: naiveSpell(o.sonifyNote) },
        technique: o.technique,
        provenance: 'derived',
      };
      // envelope identity (day 22, schema amendment 3): the species the
      // composer drew (surge/sine/expodec...) and the non-default sonify
      // mode ('plain' = captured note, 'ks' = keyswitched sample; curve
      // mode = omitted default). Notation devices + tooltips consume these.
      if (o.envShape) ev.env = o.envShape;
      if (o.sonifyMode === 'plain' || o.sonifyMode === 'ks') ev.mode = o.sonifyMode;
      events.push(ev);
      perPart.get(o.layer).push({ ev, cls, obj: o });
    }

    const chunks = [];
    for (const part of parts) {
      const list = perPart.get(part);
      if (!list.length) continue;
      const partChunks = []; // {firstOnset, make(spanEnd) -> chunk}
      const clsOf = new Map(list.map(x => [x.ev.id, x.cls]));
      const items = list.map(x => ({ ev: x.ev, cls: x.cls }));

      if (profile === 'section1') {
        // played material: perceptual groups, playable fits, honest residue
        const seg = segmentPlayed(items, opt);
        const mkSingle = e => partChunks.push({
          firstOnset: e.onset,
          make: end => ({
            id: 'ch-' + part + '-' + e.source.objectId, part, span: [e.onset, end],
            class: clsOf.get(e.id), strategy: 'unresolved',
            events: [e.id], provenance: 'derived',
          }),
        });
        const mkProportional = evsRun => {
          const srcId = evsRun[0].source.objectId;
          const anchor = evsRun[0].onset;
          partChunks.push({
            firstOnset: anchor,
            make: end => ({
              id: 'ch-' + part + '-' + srcId, part, span: [anchor, end], class: 'density-cloud-note',
              strategy: 'proportional',
              events: evsRun.map(e => e.id),
              devices: [{ id: 'dev-' + srcId, kind: 'gc', mode: 'landing', at: anchor, provenance: 'derived' }],
              provenance: 'derived',
            }),
          });
        };
        const mkBar = (evsRun, fit) => {
          const srcId = evsRun[0].source.objectId;
          const chId = 'ch-' + part + '-' + srcId;
          const anchor = evsRun[0].onset;
          const m = Math.max(1, Math.ceil(opt.BEAT_MIN / fit.u - 1e-9));
          const beat = fit.u * m;
          evsRun.forEach((e, i) => { e.metric = { chunk: chId, grid: [fit.ns[i]] }; });
          partChunks.push({
            firstOnset: anchor,
            make: end => ({
              id: chId, part, span: [anchor, end], class: 'density-cloud-note',
              strategy: 'simple-bar',
              tempo: {
                anchorSeconds: anchor, unitSeconds: fit.u, beatSeconds: beat,
                subdivision: m, maxErrSeconds: fit.maxErr,
                label: 'unit ' + (fit.u * 1000).toFixed(1) + ' ms · beat ' + beat.toFixed(3) + ' s (' + (60 / beat).toFixed(0) + ' bpm) × ' + m,
              },
              events: evsRun.map(e => e.id),
              groups: [{ id: 'bg-' + srcId, kind: 'beam', events: evsRun.map(e => e.id), provenance: 'derived' }],
              devices: [{ id: 'dev-' + srcId, kind: 'gc', mode: 'landing', at: anchor, provenance: 'derived' }],
              provenance: 'derived',
            }),
          });
        };
        for (const r of seg.runs) {
          if (r.length === 1) { mkSingle(r[0]); continue; }
          const { claims, leftovers } = fitSubruns(r, opt);
          for (const c of claims) mkBar(r.slice(c.i, c.j + 1), c.fit);
          for (const [a, b] of leftovers) {
            const piece = r.slice(a, b);
            if (piece.length === 1) mkSingle(piece[0]);
            else mkProportional(piece);
          }
        }
        for (const x of seg.splitters) {
          partChunks.push({
            firstOnset: x.ev.onset,
            make: end => ({
              id: 'ch-' + part + '-' + x.ev.source.objectId, part, span: [x.ev.onset, end],
              class: x.cls, strategy: 'unresolved',
              events: [x.ev.id], provenance: 'derived',
            }),
          });
        }
        partChunks.sort((a, b) => a.firstOnset - b.firstOnset);
        for (let i = 0; i < partChunks.length; i++) {
          const end = i + 1 < partChunks.length ? partChunks[i + 1].firstOnset : w1;
          chunks.push(partChunks[i].make(end));
        }
        continue;
      }

      const { runs, splitters } = segment(items, opt);
      for (const r of runs) {
        if (r.events.length >= 2 && r.unit !== null) {
          const anchor = r.events[0].onset;
          const rels = r.events.map(e => e.onset - anchor);
          const fit = fitUnit(rels, r.unit, opt.TOL);
          if (fit) {
            const srcId = r.events[0].source.objectId;
            const chId = 'ch-' + part + '-' + srcId;
            const m = Math.max(1, Math.ceil(opt.BEAT_MIN / fit.u - 1e-9));
            const beat = fit.u * m;
            r.events.forEach((e, i) => { e.metric = { chunk: chId, grid: [fit.ns[i]] }; });
            partChunks.push({
              firstOnset: anchor,
              make: end => ({
                id: chId, part, span: [anchor, end], class: 'trance-stream',
                strategy: fit.u >= opt.PLAYABLE ? 'simple-bar' : 'proportional',
                tempo: {
                  anchorSeconds: anchor, unitSeconds: fit.u, beatSeconds: beat,
                  subdivision: m, maxErrSeconds: fit.maxErr,
                  label: 'unit ' + (fit.u * 1000).toFixed(1) + ' ms · beat ' + beat.toFixed(3) + ' s (' + (60 / beat).toFixed(0) + ' bpm) × ' + m,
                },
                events: r.events.map(e => e.id),
                groups: [{ id: 'bg-' + srcId, kind: 'beam', events: r.events.map(e => e.id), provenance: 'derived' }],
                devices: [{ id: 'dev-' + srcId, kind: 'gc', mode: 'landing', at: anchor, provenance: 'derived' }],
                provenance: 'derived',
              }),
            });
            continue;
          }
        }
        // singleton or unfittable: one chunk per event, keeps its own class
        for (const e of r.events) {
          partChunks.push({
            firstOnset: e.onset,
            make: end => ({
              id: 'ch-' + part + '-' + e.source.objectId, part, span: [e.onset, end],
              class: clsOf.get(e.id), strategy: 'unresolved',
              events: [e.id], provenance: 'derived',
            }),
          });
        }
      }
      for (const x of splitters) {
        partChunks.push({
          firstOnset: x.ev.onset,
          make: end => ({
            id: 'ch-' + part + '-' + x.ev.source.objectId, part, span: [x.ev.onset, end],
            class: x.cls, strategy: 'unresolved',
            events: [x.ev.id], provenance: 'derived',
          }),
        });
      }
      partChunks.sort((a, b) => a.firstOnset - b.firstOnset);
      // boundary convention: span end = next chunk's first onset; last = window end
      for (let i = 0; i < partChunks.length; i++) {
        const end = i + 1 < partChunks.length ? partChunks[i + 1].firstOnset : w1;
        chunks.push(partChunks[i].make(end));
      }
    }

    return {
      doc: {
        irVersion: '0.1',
        id,
        source: { score: scoreName, window: [w0, w1], parts },
        provenance: {
          createdBy: toolName || 'extract_core',
          date: date || 'undated',
          tool: toolName || 'extract_core',
          notes: 'Derived extraction (B1). Segmentation: DB-6 greedy IOI runs, TOL ' + opt.TOL + ' s. Regenerable; authored content belongs in overlays only.',
        },
        events,
        chunks,
        overlays: [],
      },
      warnings,
    };
  }

  return { extract, segment, segmentPlayed, fitPlayed, fitUnit, approxGcd, naiveSpell, DEFAULTS };
});
