# NOTATION IR — SCHEMA v0

> **Status: A2 draft, 2026-08-19 (Phase A step 2).** The stratum-3 notation
> IR as data (NOTATION_ARCHITECTURE.md §1 S3, amendments 1–2). **v0 is meant
> to be broken by A3–A5** — three chunks worked BY HAND from real piece data
> (trance bar · morph window · density apex) before any extractor code;
> schema flaws found by hand are cheap, by code expensive. Version bumps by
> amendment; IDs stable, never renumbered.
>
> Machine contract: `ir_v0.schema.json` (same directory). Validator:
> `tools/ir_validate.js` (schema + referential integrity + against-source).

## 1. The two technical picks (decision §8 rows 5–6, resolved here)

**Locations & naming** — notation is a stratum, so it gets its own root:

```
notation/
  schema/     IR_SCHEMA_v0.md · ir_v0.schema.json · examples/
  ir/         one JSON per worked span: <slug>.ir.json  (A3: trance-bar-01.ir.json)
  registry/   classes.json (A1 §2 entry shape) · accommodations.json (A1 §3 bucket)
```

S1 stays `scores/` · S2 stays `analysis/` (+ `bank/` tables) · S4 code comes
with slice 1. *Rejected:* filing under `docs/plans/` (this is data, not a
plan) and under `bank/` (banked material is compositional, not notational).

**Identity** — three rules:

1. Every IR node has a string `id`, unique within its file; global reference
   is `<file-slug>#<id>`.
2. **Derived node ids are deterministic functions of their source ids** —
   an event extracted 1:1 from S1 object `wc-4386` is ALWAYS `ev-wc-4386`,
   in every regeneration. This is what makes the amendment-1 survival law
   mechanical: authored overlays re-attach by id, and the id cannot drift.
   **Derived CHUNKS too**: a derived chunk's id is
   `ch-<part>-<sourceObjectId of its earliest member event>` (e.g.
   `ch-4-wc-4386`). If regeneration moves a chunk's start, its id CHANGES —
   so an authored strategy overlay targeting the old chunk **orphans
   loudly** instead of silently re-binding to the wrong chunk. Enforced by
   the validator for both.
3. Nodes with no single source (authored events, aggregates) get hand ids
   (`ev-a-001`); once assigned, never renumbered.

**The vertical-unit question EXITS A2.** The IR is semantic: it contains no
layout units of any kind — no staff-spaces, no lane fractions, and (per the
coordinate contract) a pixel anywhere in an IR file is a bug the validator
rejects. Positions here are TIME (seconds; optional metric) and PITCH
(semantic). The staff-space-vs-lane-fraction choice belongs to the
coordinate module and is made when that module is built (slice 1).

## 2. Design laws (from the architecture doc; enforced by the validator)

- **Reference, don't copy, the continuous.** Envelopes, bends, curve shapes
  stay in S1; the IR points at them (`source`). A second copy could only
  drift (D33's corollary). The IR copies ONLY the minimal sounding facts it
  notates — onset, duration, pitch, technique — and the validator's
  `--against-source` mode asserts the copies still match the source score
  (Principle 5: two ends checked against each other, not against a shared
  helper). Checked: onset, pitch, technique, and part-vs-source-layer.
  **Duration is exempt by design**: one-shots carry sample-true length,
  which diverges from the drawn block (D9).
- **Provenance kinds on every fact** (amendment 1), split by node kind:
  structural nodes (events, chunks, groups, devices) are `derived` or
  `authored`; **overrides live ONLY in overlays** (`authored` /
  `authored-override`, the latter with `contradicts` recording what the S1
  evidence suggested — overlays are the authored channel, so an override is
  always an overlay, never an edit to a derived node). Corollary: **derived
  MARKS are never stored** — a per-material rule's proposals are translator
  output, regenerated every run (P6); stored derived facts are limited to
  STRUCTURE (events, chunks, groups, metric, devices).
- **Overlays live apart from chunks.** All authored notational content sits
  in the `overlays` array, targeting nodes by id — so regeneration of
  derived content structurally cannot touch it. An overlay whose target no
  longer resolves is flagged `orphaned: true`, never dropped. **Flag
  ownership:** the future re-attachment maintenance pass sets and clears
  the flag; the validator is READ-ONLY — it errors on unresolved targets
  (unless flagged) and on stale flags (`orphaned: true` whose target
  resolves).
- **Concert pitch, spelled; transposition is a load-time rule** (M2). The
  IR stores concert `midi` + a concert `spelled` form; family adaptation
  re-derives spelling through a per-family rule at load. Nothing in the IR
  is pre-transposed. `alter` is a float — quartertones are `±0.5`.
- **Fixed one-shots carry their TRUE length** (D9): `duration` for
  staccato/fp/cuivre events is the sample-true sounding length, not the
  drawn block.
- **Every chunk has a `strategy`, and `unresolved` is a legal value.** An
  unresolved chunk renders as its class's graphic fallback (the parachute,
  A1 §6) — so a score ships at any moment, mixed-fidelity by construction.

## 3. Document shape

One IR document = one worked span of one or more parts:

```jsonc
{
  "irVersion": "0.1",
  "id": "trance-bar-01",                       // file slug
  "source": {                                   // the S1 window this document notates
    "score": "tranceA002f",                     // scores/<score>.json
    "window": [0.0, 4.8],                       // absolute seconds
    "parts": [4, 5]                             // S1 layer indices (players)
  },
  "provenance": { "createdBy": "hand",          // "hand" | tool name
                  "date": "2026-08-19",
                  "notes": "" },
  "events":   [ /* §4 */ ],
  "chunks":   [ /* §5 */ ],
  "overlays": [ /* §6 */ ]
}
```

## 4. Events — the sounding facts being notated

```jsonc
{
  "id": "ev-wc-4386",                           // deterministic (rule §1.2)
  "source": { "score": "tranceA002f",           // omitted only on authored events
              "objectId": "wc-4386" },
  "onset": 0.0,                                 // absolute seconds (canonical clock)
  "duration": 0.42,                             // seconds; sample-true for one-shots (D9)
  "pitch": { "midi": 31,                        // concert
             "spelled": { "step": "G", "alter": 0, "octave": 1 } },
  "technique": "staccato",                      // S1 technique name
  "metric": { "chunk": "ch-4-wc-4386",          // optional: position(s) on the chunk grid
              "grid": [0] },
  "provenance": "derived"                       // derived | authored (overrides = overlays)
}
```

- `spelled` is S3 content (a decision). v0 default: derived by a naive rule
  (sharps ascending, flats descending — placeholder), overridable per event
  by a `spelling` overlay. Real spelling rules are per-material, harvested.
- Sustained/continuous events (ord with envelope, morph notes): same shape;
  the envelope and any `morphBend` are NOT copied — display and audio read
  them from S1 via `source`, through the optional per-material transform
  slot (amendment 2).

## 5. Chunks — the atom of the strip

A chunk is a contiguous span of ONE part with a class and a strategy
(the M5 grouping-that-behaves-together, generalized: a morph window or a
swell is also a chunk — one without a tempo).

```jsonc
{
  "id": "ch-4-wc-4386",                         // deterministic (rule §1.2)
  "part": 4,
  "span": [0.0, 1.9],                           // absolute seconds
  "class": "trance-stream",                     // MUST exist in registry/classes.json
  "strategy": "simple-bar",                     // simple-bar | tuplet-bar | proportional
                                                //  | device | fallback | unresolved
  "tempo": {                                    // OPTIONAL — the two-clocks mapping
    "anchorSeconds": 0.0,                       //  re-anchor point (the GC's job, D43)
    "unitSeconds": 0.31520,                     //  the grid unit — REPORT UNITS (D43 iii)
    "beatSeconds": 0.31520,                     //  the counted beat
    "subdivision": 1,                           //  units per beat (integer); beatSeconds
                                                //   = subdivision × unitSeconds, checked
    "maxErrSeconds": 0.0062,                    //  worst onset error of the fit (E1)
    "label": "8ths @ 190"                       //  human label; never load-bearing
  },
  "events": ["ev-wc-4386", "ev-wc-4387"],       // refs into events[]
  "groups": [                                   // perceptual grouping (Mists baseline)
    { "id": "bg-1", "kind": "beam",
      "events": ["ev-wc-4386", "ev-wc-4387"],
      "provenance": "derived" }
  ],
  "devices": [                                  // S4 device instances anchored here
    { "id": "dev-1", "kind": "gc",
      "mode": "landing", "at": 0.0,             //  "at" = absolute seconds, within span
      "provenance": "derived" }
  ],
  "provenance": "derived"
}
```

**Exclusivity (validator-enforced):** an event belongs to at most ONE chunk,
and same-part chunk spans are disjoint — the chunk is the atom of the strip,
so double membership would notate a note twice.

**A3 amendments (2026-08-19, found by hand-working `trance-bar-01`):**
- **A chunk's span is ONSET OWNERSHIP, not sounding time.** Disjointness
  applies to onsets only; sounding overlap across a boundary is legal and
  expected — in the real seam, the octave-figure's last B1 (sample-true
  0.37 s, D9) is still ringing when the BASE stream starts 0.136 s later.
- **Boundary convention for adjacent same-part chunks:** the boundary sits
  at the NEXT chunk's first onset (span half-open `[start, next-start)`),
  so every instant belongs to exactly one chunk and no gap needs inventing.

**Tempo grain is the finest (per chunk), by design** — per-part or shared
tempi are then special cases (equal maps across chunks/parts), so the open
musical choice (§8 row 8) forks nothing here.

**E1 fold-in mapping** (`analysis/e1/*.e1.json` chunk record → IR chunk):

| E1 field | IR |
|---|---|
| `part` ("tuba9") | `part` = index of the track whose id matches in `score.tracks` — resolved by lookup, NEVER by parsing the numeral (`tuba9` is layer **8**) |
| `t0` | `tempo.anchorSeconds` (+ `span[0]`) |
| `uMs / 1000` | `tempo.unitSeconds` |
| `beat` | `tempo.beatSeconds` |
| `pq` | `tempo.subdivision` = the units-per-beat integer (q of p:q against the beat); exact, unlike float recovery from `beat/uMs` |
| `cls` | strategy: `binary`/`compound` → `simple-bar` · `tuplet-per-beat` → `tuplet-bar` (also echoed in `tempo.label`) |
| `ns[]` | each event's `metric.grid` |
| `maxErrMs / 1000` | `tempo.maxErrSeconds`; the tool + ε go in the document's `provenance` |

Fold-in rules: an IR document folds **exactly one ε variant** of the E1
record (name it in `provenance.notes`); only `fullVocab` variants carry
chunk lists — the others store bare counts and are not foldable.

## 6. Overlays — the authored channel

```jsonc
{
  "id": "ov-001",
  "kind": "dynamic",                            // dynamic | articulation | instruction
                                                //  | spelling | grouping | strategy
  "target": { "event": "ev-wc-4386" },          // or { "chunk": "ch-4-wc-4386" }
                                                // or { "part": 4, "span": [t0, t1] }
                                                // or { "parts": [0,1,2], "span": [t0, t1] }
                                                //    (multi-part span — gesture-wide
                                                //     instructions; all real groupIds
                                                //     span multiple parts)
                                                // or { "span": [t0, t1] } = ALL
                                                //    source.parts in that window
  "value": "p",                                 // vocabulary is per-material (amendment 1)
  "provenance": "authored",                     // or "authored-override"
  "contradicts": null,                          // authored-override: what S1 suggested
  "orphaned": false                             // set/cleared by the re-attachment
                                                //  maintenance pass, never by hand;
                                                //  validator errors on stale flags
}
```

- `instruction` carries per-material verbal directives (*"crescendo in the
  beating"*) — amendment 2.
- A `strategy` overlay overrides a chunk's strategy — the composer's per-
  chunk call in D43's mixed strategy, expressed without editing derived
  data. Its `value` must be a member of the chunk strategy enum
  (validator-enforced; "vocabulary is per-material" covers marks, not
  strategies).

## 7. What v0 deliberately leaves out (A3–A5 decide if they force entry)

Ties/slurs across events · rests as first-class nodes (v0: rests are gaps —
verified sufficient on the real trance data: every layer-4/5 IOI is a
positive pulse multiple, zero overlaps) · single-part chords (zero
same-layer same-onset collisions in all three surveyed scores; enters by
amendment if material produces one) · multi-part chunks (v0: chunk = one
part; ensemble alignment lives in shared `anchorSeconds`) · release-device
notation (M3 — awaits the P3 session) · tremolo sine figures (2j — enter as
`devices` when notated) · page/system hints (layout strata, not IR). Each
enters by amendment when a hand-worked chunk actually needs it, not before.

**Not omissions — S1 read-through:** marker/label objects (rehearsal marks,
the trance pulse-count stream) and gesture labels (`groupId` +
`performanceNotes`) are S1 facts that renderers read directly from the
source score; they enter the IR only when a NOTATIONAL DECISION attaches to
them (reference-don't-copy, §2). A caution for A3: the classify layer must
still route them (registry classes `marker-label`, `grouped-gesture`), and
all 23 real groupIds span multiple parts — gesture-wide authored content
uses the `{parts, span}` overlay target.

**Vacuity note:** an empty document, or a chunk with zero events, validates
clean — `VALID` on a near-empty file certifies little; read the counts in
the success line.

**Completeness note (A4 finding):** the validator never checks that every
S1 onset inside `source.window` × `source.parts` has an event — partial
coverage is legal and normal for hand-worked documents (`morph-window-01`
carries only the first breath-span of its gesture). A `--complete` mode
becomes necessary when the EXTRACTOR exists and claims full coverage;
queued for that build, not before.
