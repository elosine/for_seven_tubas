# MODEL ↔ ACTUAL (PLAN 2y) — implementation plan

> **Status: APPROVED by the composer 2026-08-16. Ready to implement — AFTER
> PLAN 2z, never concurrently with it.** Written to be implemented cold. Read `docs/AI_METHODOLOGY.md` first, then the concept file
> `docs/plans/MODEL_AND_ACTUAL.md` (the composer's own framing — this plan
> implements it, it does not restate it), then `docs/RUNNING_LOG.md` COLD START.
>
> Sibling plan: `docs/plans/GESTURE_SHAPING.md` (PLAN 2z). Recommended order:
> **2z first, then this** — so stock models are seeded once, with shape dials
> already existing. Not a hard dependency: this plan treats params as opaque
> blobs, so it survives either order.
>
> **Do NOT run 2y and 2z as two concurrent agents** — shared files
> (`morph.js`, `morph_panel.js`, `bank/morph_params.json`, `tools/test_morph.js`).

---

## 1 · What this builds, in one paragraph

The composer's Bergson distinction, made operational. A **MODEL** is *"a point
plus the directions worth travelling from it, and how far"* — stored as: a
blessed base setting (the point), the composer's named **RECIPES** (each one
dial that moves several parameters together, with boundaries), and identity/
provenance. An **ACTUAL** is one decided render — concrete notes, envelopes,
lanes — stored with full provenance back to the model and dial positions that
made it, labeled for compositional use, and placeable into the piece. Plus the
loop between them: choose model → turn dials (by hand or by telling the AI) →
audition seeds → settle → **Save as ACTUAL** → it is filed, browsable, and
insertable forever after.

**The ACTUAL half largely exists** (2w gesture bank: `bank_gesture.js` /
`place_gesture.js`; `extract_section.js`). **The MODEL half — recipes,
boundaries, the one-dial collapse — is the new work**, plus the organising
layer. `bank/morph_recipes.json` already stores the dial boundaries learned by
ear on day 10; this plan turns that record into a living store.

---

## 2 · The four open questions from the concept doc — answered

Decided here per AI_METHODOLOGY rule 2 (don't put minutiae to the composer);
each is cheap to reverse, and none changes what the composer hears.

1. **Where does it live?** Hybrid, per the standing principle (UI only where
   interaction speed compounds). The choose→dial→seed→audition loop is a
   hammered loop → it gets panel UI (§6). Storage is JSON files in `bank/`
   (source of truth, human-readable, git-diffable). One-off operations
   (validate, re-derive, bulk list) are prompts/CLI, not UI.
2. **Is a recipe a stored function or stored endpoints?** **Endpoints +
   interpolation** (§4). Pure data: diffable, boundable, testable, writable by
   the AI mid-conversation, and impossible to smuggle code into. A function
   would be a second engine to debug.
3. **Does an actual link back to its model and dials?** **Yes** — a
   `provenance` block (§5). It is what makes a variant re-derivable, and
   re-derivation is also the store's integrity check.
4. **How are they organised for composition?** Actuals organised **by model**
   (primary), plus freeform `tags` in the composer's vocabulary and a
   `placements` log (which scores, where) appended automatically at place
   time. "By section of the piece" falls out of `placements` for free rather
   than being a filing decision anyone has to make.

---

## 3 · The MODEL store — `bank/morph_models.json`

One file, all models — it is a *menu*; seeing them together is the point.
(Actuals get one file each, §5 — they carry note arrays and would bloat a
single file.)

```json
{
  "_comment": "MODEL store (PLAN 2y). A model = a point + directions + limits.",
  "rev": 1,
  "models": {
    "BLOOM": {
      "name": "BEATING BLOOM",
      "id": "BLOOM",                       // stable handle; ACT ids derive from it
      "status": "stock",                   // stock | draft | retired
      "modelType": "M1",
      "character": "Unison pairs splitting apart; beating grows from zero, opens upward.",
      "elements": ["beating pairs", "swells", "re-articulation pulse", "low-mid register"],
      "verdict": "keeper — composer 2026-08-16: 'industrial… Lucier terrain'",
      "baseParams": { "…": "a full params blob, exactly what render() takes" },
      "recipes": [ { "…": "see §4" } ],
      "actuals": ["ACT-BLOOM-01"],         // maintained by the actualize path
      "seededFrom": "bank/morph_recipes.json slot C"
    }
  }
}
```

- **Seeding (MA0):** the six blessed settings in `bank/morph_recipes.json`
  become the first stock models (keepers A/C/D prominent; E/F as stock;
  B as draft). `morph_recipes.json` itself stays **frozen as the day-10 audit
  record** — the models file is seeded *from* it, never regenerates *over* it.
  `tools/bank_recipes.js` is retired with a pointer comment.
- **Names are the composer's.** Seed with placeholder ids (BLOOM, CONVERGE,
  BALANCE, SPACING, SPECTRAL, COLOUR); the composer renames in the MA4
  working session. Ids are cheap to change before actuals reference them,
  which is exactly why naming happens at MA4 and not later.
- **The `_auditionNotes` habit carries over:** every composer verdict lands in
  the model's `verdict`/notes at the moment it is spoken (TAXONOMY contract,
  §7 — filing is the AI's job, unprompted).

---

## 4 · Recipes — the one-dial collapse

The composer's spec: *"a combination of parameters into a single dial… each
recipe essentially is paired down to one dial, in some ranges."*

```json
{
  "recipe": "more dramatic",
  "description": "depth up and bias later — the morph arrives harder",
  "dial": { "min": 0, "max": 1, "default": 0.35 },
  "waypoints": [
    { "at": 0, "patch": { "dials.depth": 0.6, "dials.bias": 0.0 } },
    { "at": 1, "patch": { "dials.depth": 1.0, "dials.bias": 0.6 } }
  ],
  "boundsFrom": "bank/morph_recipes.json dials table (heard 2026-08-16)"
}
```

- **Semantics:** `applyRecipe(baseParams, recipe, x)` — numeric leaf values
  lerp between the bracketing waypoints; non-numeric values (striation names,
  technique paths, `shape.*.entry`) **step** at the waypoint that declares
  them. ≥ 2 waypoints; intermediate waypoints allowed (a dial can bend).
- **Paths** are dot-paths into the params blob (`carrier.segLen`,
  `dyn.amount`, `target.cents`, `shape.attack.len`). Validation: every path
  must resolve against `normaliseParams`' known structure; an unknown path is
  a **reported error at load time**, never a silent no-op (the engine's
  existing unknown-key policy, extended down the tree).
- **Composition:** a model's recipes apply in listed order over `baseParams`;
  two recipes touching the same path = last-wins **+ a warning naming both
  recipes and the path**. Kept simple on purpose — if a conflict warning ever
  annoys, the fix is editing the recipes, not adding a merge algebra.
- **Seed is NOT a recipe.** *"Another version"* = new seed, same point in
  parameter space — identity, not direction. The seed stepper is its own
  control (§6).
- **Where it runs:** `applyRecipe` + validation live in `morph.js` (pure,
  node-testable, same file the params feed). `KNOWN_KEYS`-style discipline
  throughout.
- **Initial recipe slates are deliberately MINIMAL** *(composer, day 11:
  "for the first few attacks, I'll just narrate, and we'll build the
  vocabulary")*. Seed only what already exists — the `_vocabulary` block of
  `bank/morph_params.json` (literally a proto-recipe list) bounded by the
  recipes bank's dials table: *slower/longer* (span 10→60) · *more dramatic*
  (depth+bias) · *smoother↔choppier* (segLen 8→3) · *louder swells*
  (dyn.amount 0.2→0.5) · per-model specials (*more beating*: target.cents for
  BLOOM). Everything else — especially the shape vocabulary (*harder attack*,
  *dissolve more*, over `shape.*` paths) — is **harvested from the narrated
  sessions** (D6's harvest principle): the composer describes qualitatively,
  the AI dials it in, and when a description recurs it gets filed as a named
  recipe with the boundaries practice revealed. MA4 blesses what practice
  produced; nothing speculative ships before it has been asked for twice.

---

## 5 · The ACTUAL store — `bank/actuals/ACT-<MODEL>-<NN>.json`

Format = the 2w gesture-bank format (so `place_gesture.js` machinery applies),
**extended**:

```json
{
  "entity": "ACT-BLOOM-01",
  "kind": "actual",
  "label": "bloom, 40 s, slow-dramatic, the one with the high shimmer",
  "tags": ["beating", "industrial", "opens-upward"],
  "spanSec": 40.0, "parts": 8, "register": "34–62",
  "objects": [ "…score waveCurves verbatim, t=0-based, morphBend intact…" ],
  "notes":   [ "…the render() output that produced objects…" ],
  "provenance": {
    "model": "BLOOM",
    "recipeSettings": { "more dramatic": 0.7, "slower/longer": 0.5 },
    "resolvedParams": { "…post-recipe params blob…" },
    "seed": 11,
    "engineConstants": { "bendRangeSt": 1.99, "prearmS": 0.05 },
    "captured": "2026-08-16"
  },
  "placements": [ { "score": "piece-s18", "at": 141.2, "when": "2026-08-17" } ]
}
```

- **Both `objects` and `notes` are stored.** Insert uses `objects` (ground
  truth, frozen — later engine changes must never mutate a placed actual's
  identity); audition uses `notes` (the emit layer plays render output).
  Integrity: `toScoreObjects(notes) ≡ objects`, checked by the validate tool.
- **Re-derivation check (MA2 gate):** `render(resolvedParams, seed)` must
  reproduce `notes` byte-identically at capture time. Every actual is
  reproducible the day it is born; if the engine later drifts, the stored
  objects still stand and the validate tool *reports* the drift instead of
  anyone discovering it mid-composition.
- **Subdirectory `bank/actuals/`**, not flat `bank/` — the flat bank already
  mixes entities, sample tables and taxonomies. `place_gesture.js --list`
  learns to scan both (a ~5-line extension; verified: its list filter is
  `entity + objects[]`, which actuals satisfy).
- **`placements` is appended automatically** whenever an actual is placed
  (panel insert or `place_gesture`). "Where have I already used this" is the
  question a reusable collection gets asked most; nobody should maintain the
  answer by hand.
- **Labeling contract:** `entity` (stable id) + `label` (one breath, the
  composer's phrase) + `tags` (composer vocabulary). AI files all three at
  save time without asking; ambiguity gets a `?` note (TAXONOMY rule). The
  browse views (§6) always show: id · label · model · span · parts · register
  · tags · placement count.
- Hand-played/hand-built material (DB3 lineage) stays in flat `bank/` as
  plain gestures — an ACTUAL is specifically *a decided render of a model*.
  Both kinds appear in `--list`; `kind` distinguishes them.

### 5.1 The SHAPE-PRESET library — `bank/shape_presets.json`

The composer's reuse question, answered lightweight *(day 11: a crafted
attack/shape is probably reusable across models; "if it's too complicated to
categorize, we'll just leave it")*:

- A shape preset is a **named, copyable `shape` block** (2z's schema) plus
  label, tags and the verdict that blessed it — e.g. `"brass hit into
  dissolve"`. Because a shape is just params, applying it to any model is a
  merge, not a feature: **reuse by construction, no category system.**
- Filed by the AI from the narrated sessions the moment a shape is kept
  (TAXONOMY contract, §7); `?` note when unsure. If genuine *categories* of
  attack ever emerge, they are harvested then (D6) — never designed up front.
- Surfacing: a shape dropdown next to the model menu (§6); recipes may patch
  `shape.*` paths like any other. An actual's `resolvedParams` already
  records the shape it was made with, so provenance needs nothing new.
- **Explicitly rejected (composer's own instinct):** making the envelope a
  seventh morph model. Morph ⊥ carrier ⊥ shape orthogonality is what makes
  any shape compose with any model — see 2z §5.5.

---

## 6 · Surfacing — panel, files, CLI

**Panel** (`morph_panel.js` — the hammered loop earns UI; everything else
does not):

- The variant chips A–F become a **model menu** fed from
  `morph_models.json` (falling back to raw `morph_params.json` variants, which
  stay for scratch work — drafts live there until blessed into models), plus a
  **shape-preset dropdown** (§5.1) that merges a named shape onto the current
  model's params.
- Per-recipe **sliders** (bounded by the recipe's dial min/max), a **seed
  stepper** (± buttons — *"another version"*), and the existing
  generate/play/insert row unchanged.
- **`Save as ACTUAL`**: renders → converts → writes `bank/actuals/…` via a new
  `POST /api/actuals` route (server.js follows the `/api/clusterbank` pattern;
  verified: hand-rolled http routes, no express) → status line shows the id it
  filed. Never overwrites; ids increment.
- **Actuals browser**: a list (id · label · tags · span · placements) with
  `hear` (plays `notes` through the existing emit path) and `insert @ cursor`
  (places `objects` at the playhead with a fresh groupId + META shape — the
  existing insert path, fed from storage instead of the live render).
- `preflight()` gains one check: `/api/actuals` reachable.

**Files:** models and actuals are readable JSON; the AI edits
`morph_models.json` directly in conversation (recipes, verdicts, tags) —
same loop as `morph_params.json` today, with `rev` bump + panel poll.

**CLI** (`tools/model_bank.js`): `--list` (models + recipes + actuals),
`--show <id>`, `--validate` (schema, recipe paths, actual integrity,
re-derivation), `--actualize <model> [--set recipe=x …] [--seed n]` (the
panel-free path, for batch or remote work).

**Insertion strip: explicitly NOT extended.** D23 stands — the strip's sources
cannot carry orchestrated material, and an actual is orchestrated (morphBend,
envelopes, lanes). The panel browser and `place_gesture` are the two insert
paths. If browsing actuals ever outgrows the panel, a third strip source is a
*named future decision*, not scope here.

---

## 7 · The filing contract (TAXONOMY.md extended to morphs)

Standing AI obligations, unprompted, from the moment MA2 lands:

- Composer blesses a setting in conversation (*"keeper," "use that one,"
  "save this"*) → file it: update/create the model, bank the actual with
  provenance, tag it, note the verdict verbatim. Never ask taxonomy questions
  mid-flow; ambiguous filings get `?` notes.
- Composer states a preference direction (*"I always want the attack harder
  than that"*) → it becomes a recipe default or boundary edit, noted.
- Every placement logs to `placements` automatically.

---

## 8 · Build order & phase gates

**MA0 — schemas + seed migration**
- `morph_models.json` seeded from the six recipes; `bank/actuals/` created;
  `bank/shape_presets.json` created (migrating any keeper shapes 2z's
  listening sessions left in `morph_params.json`); `model_bank.js --validate`
  written FIRST (the validator is the spec).
- **Gate:** validate passes on the seeded store; `place_gesture --list` shows
  both shelves; zero behaviour change anywhere else.

**MA1 — recipe engine**
- `applyRecipe` + path validation + composition in `morph.js`; tests extend
  `test_morph.js` (lerp values pinned; stepping for discrete values;
  clamping at dial bounds; unknown path reported; conflict warning named;
  recipes over a `shape` block if 2z landed first).
- **Gate:** unit tests green; applying every seeded recipe at min/default/max
  to its model produces params inside the recipes bank's heard boundaries.

**MA2 — actualization + integrity**
- Save path (panel button + `/api/actuals` + CLI), provenance, both-arrays
  storage, placements logging in both insert paths, `place_gesture` subdir
  support.
- **Gate (in the running app, scratch session):** save an actual → reload the
  page → hear it from storage → insert it → drag → group-scale ×0.75 → save
  score → reload — `morphBend` and levels byte-identical through the round
  trip (2v Phase-4 gate, on stored material). Re-derivation check passes.
  `placements` shows the insert.

**MA3 — panel surfacing**
- Model menu, recipe sliders, seed stepper, actuals browser.
- **Gate (in the running app):** the full loop — choose BLOOM, move two
  recipe dials, step three seeds, hear each, save one, find it in the
  browser, insert it — performed end to end and reported with what was run
  and what came back.

**MA4 — the composer's working session** *(the musical gate)*
- Name the models, bless/edit the recipe slates and boundaries, make the
  first real actuals for the piece. Verdicts filed as spoken.
- **Gate:** the store contains composer-named models with composer-blessed
  recipes; at least one actual placed in a piece score via the new path.

---

## 9 · Failure modes → mitigations

| # | failure | mitigation |
|---|---|---|
| 1 | Second engine grows inside recipes (code-as-data) | endpoints-only; paths validated against the params schema; no eval, no expressions |
| 2 | A recipe silently does nothing (typo'd path) | load-time path validation, reported — the engine's existing unknown-key policy extended |
| 3 | Engine evolves; old actuals change sound | actuals insert from frozen `objects`, never re-rendered; validate *reports* drift |
| 4 | Two stores drift (models vs actuals vs recipes bank) | recipes bank frozen as audit record; `actuals[]` maintained only by the actualize path; validate checks referential integrity both ways |
| 5 | Actual auditions ≠ actual inserts | both arrays stored from the same render; `toScoreObjects(notes) ≡ objects` asserted at save and by validate |
| 6 | Labeling debt ("what was ACT-BLOOM-03 again?") | label+tags mandatory at save (AI supplies them, `?` if unsure); browse views always show the full card; placements answer "where used" |
| 7 | Autosave clobbers a test score during MA2/MA3 gates | scratch session only; CTRL+S first (COLD START trap 5) |
| 8 | Panel/server seam breaks silently | `preflight()` check for `/api/actuals`; server route follows the existing clusterbank pattern verified in server.js |
| 9 | Concurrent-agent file collisions | header rule; `bank/actuals/` and `morph_models.json` are this plan's files — declare ownership if another agent is active |

**Residual risk, stated plainly:** the mechanics are conventional and fully
testable; low risk. The genuine unknowns are curatorial — whether the seeded
recipe slates match what the composer's ear wants the dials to *mean*
(MA4 exists precisely to find out, cheaply, by editing JSON), and whether
model-primary organisation stays browsable past ~20 models (if not: tags
already exist; a grouping view is a NITS-grade addition later). Neither can
bite before MA4, and both are data edits, not rebuilds.

---

## 9.5 · Insertion — inherited, and gated anyway

Both insert paths place **ordinary score objects** (waveCurves + `morphBend`),
so everything downstream is debugged machinery, not new code:

- **Panel insert** (actuals browser → `insert @ cursor`): places `objects` at
  the playhead with a fresh auto-numbered `groupId`, a marker **in `objects`**
  (never `data.markers` — Principle 4) and a META group shape, exactly as the
  live morph insert does today.
- **`place_gesture.js`**: the CLI path for scores not currently open; copies
  objects verbatim with a time offset — `morphBend` and level nodes ride
  along untouched (verify once in MA2, then trust it).
- **2r's conflict machinery applies automatically** — the occupancy wash runs
  on every mutation, so an actual dropped onto existing material marks its
  conflicts like any insert (never refuses, never silently drops — D16).
- **Both paths append to `placements`.** That is the only genuinely new
  insertion code in this plan.

MA2's gate exercises the full round trip (insert → drag → group-scale →
save → reload) on stored material, so "insertion works" is verified, not
assumed.

## 9.6 · Precision & determinism rules (read before writing the recipe engine)

1. **Only plain numbers lerp.** Strings, booleans, arrays and objects STEP:
   they take the value of the highest waypoint at or below the dial position.
   (Interpolating `target.midi` arrays element-wise invites subtle garbage;
   stepping is predictable and audible.)
2. **"Byte-identical" in the gates means DEEP-EQUAL on parsed JSON** —
   structural equality of the note/object arrays — not literal file bytes.
   Key order and float formatting may differ between writes; content may not.
3. **Determinism:** `render(resolvedParams, seed)` is pure and seeded
   (`mulberry32`); given the same inputs it must reproduce the same notes.
   Never introduce `Date.now`/`Math.random` into the stores or the engine —
   timestamps are written by the tool layer at save time only.
4. **Dot-path patches** resolve against the normalised params structure;
   creating a path that `normaliseParams` does not know is a load-time
   validation error, reported with the recipe's name and the offending path.

## 10 · ENVIRONMENT FACTS (for the implementing model — read before coding)

Hard-won earlier in this project; do not rediscover:

1. **No `package.json`, no `node_modules`, no node MIDI binding.** Plain
   `node` runs the tools (`node tools/test_morph.js`, `node
   tools/model_bank.js`). Anything that must SOUND goes through the browser
   panel (Web MIDI — needs a user gesture; permanently denied in preview
   panes; granted in the composer's own browser). Never write a node script
   that opens MIDI.
2. **The server is hand-rolled `http`, not express.** Add `/api/actuals` by
   copying the existing patterns in `score/server.js`: `/api/composer/save`
   (POST with body collect) and `/api/clusterbank` (GET+POST on one bank
   file). Follow their `safe()` path hygiene.
3. **`const Composer` is a lexical global, not `window.Composer`** — use the
   `HOST()` accessor pattern already in the morph files.
4. **Markers belong in `objects`, never `data.markers`** (Principle 4).
5. **Autosave writes every 5 s.** All app gates run in a scratch session
   (`untitled`), never a `piece-*` file; CTRL+S first on any non-piece score.
6. **The panel polls `bank/morph_params.json` via `/api/morphparams` on `rev`
   change** — reuse that pattern for the model store (bump `rev`, panel
   refreshes); no websockets, no connection state.
7. **Git: stage explicit paths only** (never `git add -A` — another agent may
   share this tree); push after each commit (D30).
8. **House IDs used above:** D9 (one-shots take their sample length) · D16
   (never refuse, never silently drop — flag) · D23 (the Insertion strip
   cannot carry orchestrated material) · D24 (dynamics is a layer) · 2r (the
   conflict/occupancy machinery) · 2w (the gesture bank tools this extends).
   Full text: `docs/PROJECT_JOURNAL.md` §4 and `docs/PLAN.md`.

## 11 · Worked example (end to end)

The model entry (in `bank/morph_models.json`):

```json
"BLOOM": {
  "name": "BEATING BLOOM", "id": "BLOOM", "status": "stock", "modelType": "M1",
  "character": "Unison pairs splitting apart; beating grows from zero, opens upward.",
  "verdict": "keeper — composer 2026-08-16: 'industrial… Lucier terrain'",
  "baseParams": { "model": "M1",
    "source": { "kind": "pitches", "midi": [41,41,46,46,51,51,56,56] },
    "target": { "cents": 25, "direction": "alternate" },
    "dials": { "bias": 0.3, "spread": 0.35, "depth": 1 },
    "carrier": { "span": 40, "segLen": 8, "segVar": 0.3, "striation": "staggered" },
    "dyn": { "base": 0.5, "shape": "swell", "amount": 0.42, "spread": 0.55 },
    "seed": 11 },
  "recipes": [
    { "recipe": "more beating",
      "description": "pairs split wider — faster beats, opens further",
      "dial": { "min": 0, "max": 1, "default": 0.5 },
      "waypoints": [
        { "at": 0, "patch": { "target.cents": 10 } },
        { "at": 1, "patch": { "target.cents": 50 } } ] }
  ],
  "actuals": [], "seededFrom": "bank/morph_recipes.json slot C"
}
```

`applyRecipe(baseParams, "more beating", 0.7)` ⇒ params with
`target.cents = 10 + 0.7·(50−10) = 38`; everything else untouched. Render
with seed 11, listen, settle ⇒ `Save as ACTUAL` writes
`bank/actuals/ACT-BLOOM-01.json` carrying `objects`, `notes`, and
`provenance { model: "BLOOM", recipeSettings: { "more beating": 0.7 },
resolvedParams: …, seed: 11 }`, and appends `"ACT-BLOOM-01"` to the model's
`actuals`. Inserting it later appends
`{ score, at, when }` to its `placements`.

MA2 sanity list for exactly this example: the file validates ·
re-render(resolvedParams, 11) deep-equals `notes` ·
`toScoreObjects(notes)` deep-equals `objects` · insert at 150 s in a scratch
score adds zero new conflicts of its own · drag +12 s and scale ×0.75
preserve `morphBend` per note · `--list` shows the actual under BLOOM.

## 12 · Implementer rules

1. `node tools/test_morph.js` before and after every change; the validator
   runs in CI-style at every gate.
2. The stores are data. If a feature wants code in JSON, it is the wrong
   feature (rule of §9 #1).
3. Never regenerate `bank/morph_recipes.json`; never mutate a stored actual's
   `objects`.
4. Verify every gate in the running app and say what was run (AI_METHODOLOGY
   rule 4). Scratch sessions, never `piece-*`.
5. File composer verdicts the moment they are spoken (§7) — that habit IS the
   product.
6. Stage explicit paths only; push after each commit (D30).

---

## 13 · BUILT — MA0–MA3 complete (2026-08-16, day 12)

> **MA0, MA1, MA2 and MA3 are built and verified in the running app. MA4 — the
> composer's naming/blessing session and the first real actuals — is the only
> gate outstanding, and it is theirs.** Implementer rule 4: what follows was run,
> not read.

**What exists now**

| piece | where |
|---|---|
| model store, 6 models, 26 recipes | `bank/morph_models.json` (`rev` polled by the panel) |
| validator = the spec | `tools/model_bank.js --validate` |
| recipe engine | `morph.js` `applyRecipe` / `resolveParams` |
| save path (one, shared) | `buildActual()` — used by `--actualize` AND `POST /api/actuals` |
| actuals shelf | `bank/actuals/` (empty on purpose — see below) |
| shape presets | `bank/shape_presets.json` (empty; filled from narration) |
| panel | MODELS / scratch / ACTUALs, recipe sliders, seed stepper, Save as ACTUAL, browser |
| routes | `/api/morphmodels` · `/api/shapepresets` · `/api/actuals` · `/api/actuals/<id>` · `POST /api/actualplacement` |

**Decisions taken during the build** (rule 2 — made, not put to the composer)

1. **A DIAL IS OFF UNTIL TURNED.** A recipe absent from `settings` is not
   applied. This is the load-bearing one: the plan's own §11 example has
   `"more dramatic"` defaulting to 0.35 over a base whose `depth` is 1, so a
   panel that applied defaults on open would silently rewrite blessed material
   the moment the composer looked at it. Sliders therefore carry an explicit
   on/off, and `recipeSettings` in provenance means exactly "what was turned".
2. **The store is seeded but the actuals shelf is EMPTY.** Three actuals were
   made while testing and then deleted. An ACTUAL is *a render the composer
   decided*; seeding the shelf with renders nobody listened to is the same
   failure the MA1 gate exists to prevent.
3. **Lerped values round to 6 dp** — keeps `resolvedParams` readable and
   diffable without affecting determinism (the stored value is what re-renders).
4. **`model_bank.js` guards its CLI dispatch on `require.main`** so the server
   can share `buildActual()` rather than growing a second save path.

**Negative-tested, because a check that cannot fail is worth nothing**

- The **validator** was run against eight deliberate defects (typo'd path, <2
  waypoints, default outside range, non-ascending waypoints, bad status, id/key
  mismatch, duplicate path across recipes, unrenderable baseParams) — all eight
  caught, exit 1.
- The **MA1 boundary gate** was run against a recipe widened to span 200 — it
  fails with the offending value named.
- The **actual integrity checks** were run against three corruptions —
  objects/notes disagreeing (ERROR: audition would differ from insert),
  resolvedParams that no longer reproduce the notes (reported DRIFT; the stored
  objects still stand), and a model that stops listing its actual (ERROR).

**MA2 + MA3 gates, run in the app** (scratch session; research scores checked
byte-identical to HEAD afterwards): choose BLOOM → recipes confirmed OFF at open
→ turn two dials (`target.cents` 25→42; `carrier.span` 20 / 55 / 35 across the
range) → step three seeds, each a genuinely different draw → **Save as ACTUAL**
→ found in the browser → **insert @ cursor**: 35 notes placed **verbatim** from
storage, marker in `objects` (Principle 4), META shape present → drag +30 s →
group-scale ×0.75 → save → reload: **byte-identical throughout** → placement
logged automatically.

**Carried into MA4 — the composer should know**

- The six seeded models were auditioned on day 10 **through two bugs later found
  in 2z G4**: morph pitch was out by up to 40.2 ¢ on off-key onsets, and the
  panel carried the previous variant's dials across a switch. The material is
  good, but any day-10 *comparison between models* was of the wrong thing.
  Every model carries this note in its `notes` field. **Re-hear before blessing.**
- Recipe slates are deliberately minimal and the shape-preset library is empty,
  per §4's discipline: nothing speculative ships before it has been asked for
  twice. `docs/SHAPE_LESSONS.md` is where the narration harvest accumulates.
