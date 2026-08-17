# TEXTURE SANDBOX (attack fields) — implementation plan

> **Status: DRAFT v3 — revised after composer review round 1, then
> handoff-hardened (2026-08-16); not yet commissioned.** Written from
> `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`
> (the evidence document — read it first; every claim there is tagged HEARD /
> MEASURED / inferred and this plan does not re-argue them).
>
> **PLAN id: 2x** (the same-day 2x collision was resolved by the parallel
> session: GESTURE SHAPING took 2z, MODEL↔ACTUAL is 2y, so 2x is uniquely this).
>
> **D29 — CONFIRMED by the composer 2026-08-16.** The scope split is settled:
> **2v owns everything bend-based, including pitch beating; this sandbox owns
> ATTACK FIELDS only** (density · scatter · jitter · spread · voices ·
> articulation, plus a pitch layer over the attacks). **No pitch bend anywhere
> in this build** — if a texture seems to want beating, that is 2v's Morph
> panel, and the two layer freely in the score.
>
> **Composer rulings from review round 1 (bind this plan):**
> 1. **The interface is QUALITATIVE.** The composer speaks the texture
>    vocabulary ("more rain-like", "a different gallop", "quicker, more
>    exponential build"); **the AI holds the recipes** that turn vocabulary into
>    dial moves. One-knob feel, never a wall of knobs. (§6)
> 2. **No editor. AI manages all editing** by regeneration. (§1)
> 3. **No separate page.** The surface is a **panel in the composer score**
>    (the Morph-panel pattern) plus ordinary score save-files for long renders.
>    (§3)
> 4. **Both creation modes are first-class:** the quick panel loop AND the
>    long-render-then-clip-pockets workflow ("generate a full phase shift, I
>    listen, I give time clips"). (§2, §10)
> 5. **Storage follows the MODEL ↔ ACTUAL taxonomy** (PLAN 2y, Bergson's
>    virtual/actual): models = regenerable parameter-points with directions and
>    boundaries; actuals = concrete decided sound objects with provenance. (§12)
>
> **Implementer: read `docs/AI_METHODOLOGY.md` first.** It governs this work.
> Then §16 (footholds) before touching any file. Every "verified" claim below
> the build line must come from the running app.

---

## 1 · What this is

A **Texture panel** in the composer score where the composer summons a named
attack-field texture (**smear · ticks · rain · gallop · groove**), hears it
immediately, steps through variants, morphs it over time, checks it survives
human timing error, and banks the keeper — continuing the 2j research arc
(13 experiments, `docs/PHASE_SHIFTING.md`) as accumulating material instead of
one-off scripts.

Three rulings shape everything:

- **Qualitative first (composer, review round 1):** *"essentially a one-knob
  type of thing… AI would know precisely the recipes behind the scenes to all
  the dials."* The numeric dials exist, stay visible and editable (R1), but the
  working interface is the vocabulary + the AI + the recipes (§6).
- **No editor — regeneration only (R10).** A liked texture is re-generated
  from its parameters, never edited note-by-note. The cluster sandbox's
  piano-roll editor cost ~80 % of that build; this panel has **no selection,
  no drag, no per-note anything**. New interaction wishes → NITS.
- **The UI / AI line** (composer's standing sandbox principle): UI exists only
  for the hammered loop — generate → listen → step seed → A/B → humanize →
  keep. One-off operations stay prompts/CLI: long-render batteries, pocket
  extraction, placement into the piece, MIDI export, taxonomy filing.

**Deadline context:** piece due Sept 4 2026. The sandbox serves the piece.

---

## 2 · How the composer uses it (the two modes)

**Mode A — the quick loop (panel).**
1. Composer: *"give me rain, but with the gallop trying to surface underneath."*
2. AI writes 2–3 labeled variants into `bank/texture_params.json` (rev bump).
3. Panel shows the new rev ≤ 1 s; composer arrows A/B/C, SPACE to play,
   ↑/↓ to step seeds (different draws of the same texture), **P** to pin,
   **A** to flip pinned↔current back-to-back, **H** for the humanized A/B.
4. Composer: *"B, but more fluttery."* AI applies the `fluttery` recipe to B,
   writes the next rev; the pin still holds old B for direct comparison.
5. Keeper → *"bank that as RAIN-SURFACE"* → AI stores the **MODEL** (params +
   seed + boundaries + robustness verdict) and files per TAXONOMY.md.
6. Later: *"actualize RAIN-SURFACE, 20 s, at the playhead"* → panel Insert (or
   `place_texture.js`) → an **ACTUAL** with provenance, conflicts surfacing
   through 2r as with any material.

**Mode B — the long render and its pockets.**
1. Composer: *"render me a 4-minute process: smear dissolving to rain, gallop
   emerging late, vary the seeds."*
2. AI (CLI) writes `tex-process-01` into `scores/` — self-describing markers
   throughout (R9) — and the composer listens in the score app as usual.
3. Composer names time windows: *"28–35 s and 61–70 s are interesting."*
4. AI **pockets** each window (§10): as a **parametric pocket** (the dial
   state at that window, frozen into a new MODEL — tweakable: *"the 28–35 one,
   but brighter, quicker"*) and/or a **literal clip** (`extract_section.js` →
   an ACTUAL). Regeneration is the primary path; clipping is always available.

Both modes end at the same stores (§12) and the same insert path.

---

## 3 · Architecture

```
ENGINE   score/public/texture_engine.js   pure: spec → {objects[], report, metrics}
PANEL    texture_panel.js + composer.html wiring   (Morph-panel pattern)
AUDITION morph_emit.js (2v's emit layer, reused as-is — plain notes, no bend)
LOOP     bank/texture_params.json + GET /api/textureparams + 1 s panel poll
CLI      tools/phase_shift.js (rewired over the engine) — score files + MIDI
STORES   bank/texture_models.json + bank/actuals/  (2y-aligned, §12)
```

### 3.1 Engine extraction — `score/public/texture_engine.js`

`tools/phase_shift.js` already contains the working generator (two onset
models, hocketed voices, scatter, jitter, spread, ramps, per-voice
articulation, variable-length clamping, seeded PRNG, playability report,
self-describing markers). **The build is an extraction, not a rewrite:**

- Move the pure core into `texture_engine.js`, loadable by browser and node
  (the `morph.js` dual-load pattern: `(function(root){ ... })(this)`).
- File-dependent tables become **injected parameters**: ring lengths
  (`bank/sample_lengths.json`) and the track template. Node injects via `fs`;
  the panel uses the live app's state (it never needs the template — only the
  CLI wraps objects into a score file).
- `tools/phase_shift.js` becomes a thin CLI over the engine: the existing
  presets (the regression corpus), `--fromModel <name>`, score writing, MIDI
  export via `midi_out.js`.
- **Determinism:** seeded PRNG only (the LCG already in use); seed is part of
  every spec; `new Date()` stays in the CLI wrapper. Same spec ⇒ identical
  `objects`, byte-for-byte.
- **Metrics live in the engine:** sd of composite inter-attack intervals +
  cycle-position unevenness — the two numbers the research calibrated by ear
  (scatter 0 → 0.1 ms · 0.03 → 6.4 · 0.08 → 21.5 · 0.2 → 32.6 · 1.0 → 46.2).
  They regression-lock the extraction (§13 Phase 0 gate) and display in the
  panel status line so new settings read against the researched map.

### 3.2 The panel — `score/public/texture_panel.js`

Follows the Morph panel exactly (2v §9 — the pattern is proven and the
composer likes the workflow):

- **`Texture` button** near the `Morph` button → floating panel (existing
  floating-window pattern).
- Contents, top to bottom: status line
  (`v7 · B · "rain, gallop under" · seed 3 · sd 34 ms · ⚠ 0 hard / 2 soft`) ·
  variant tabs A|B|C · category buttons (the five models, §5) · editable
  number fields for the dials (§4 — visible, never primary) · flags list
  (2r colours, no new visual vocabulary) · transport: **Generate · Play/Stop ·
  Pin · A/B · Humanize · Insert at playhead**.
- Keyboard, **only while the panel has focus** (composer.html has global
  handlers — scope like 2v did): SPACE play/stop · ←/→ variant · ↑/↓ seed ·
  **P** pin · **A** pinned↔current · **H** humanize A/B · **G** generate.
- **Audition goes through `morph_emit.js`** — `EMIT.routeFor(lane, techKey)`
  already resolves (port, channel) per D2 (`tech.port || inst.port`; staccato
  = ch 4 on the `b` instance), the note registry + `panic()` already solve
  clean-stop, and a texture note is the no-bend case (never call `sendBend`).
  **No new scheduler.** If EMIT proves unliftable for dense streams (§15.13),
  the pre-decided fallback is a copy of clusterview's setTimeout player.
- **The panel never edits notes, never touches the score object** except via
  Insert. Preview state is panel-local (autosave writes the score every 5 s —
  memory: autosave-overwrites-loaded-score).
- No preview drawing in v1: textures are judged by ear, and inserted/loaded
  material is drawn by the score itself. (A lanes strip is a NITS-candidate,
  not a requirement.)

### 3.3 The conversational loop — `bank/texture_params.json`

Copy of the 2v params-file loop (schema §4.2): `rev` strictly increases on
every AI write; `GET /api/textureparams` serves it `Cache-Control: no-store`
(copy the `/api/morphparams` route in `score/server.js`); the panel polls at
1 s and regenerates on rev change; `autoplay` is absent by design — sound only
on the composer's SPACE/Play. Survives page reload; no WS, no connection
state. **This loop is the qualitative interface's transport, so it lands in
Phase 1, not later.**

### 3.4 Shared tonality module — `score/public/tonality.js`

The pitch layer (§8) needs the 15 named tonality sets + 33 VERT01 chords +
the pooled/literal remap with no-repeat kick. All of it exists **inline in
clusterview.html** (the `TONALITIES` const and the remap inside its transform
layer — anchor by those names, not line numbers). Extract to `tonality.js`;
**rewire clusterview to the module in the same commit** so exactly one copy
exists; verify by loading clusterview and confirming one remap A/B unchanged.
This is the only edit to a shipped surface in the plan, and it is gated
(§13 Phase 2).

---

## 4 · The spec object (the dials)

One spec drives engine, panel, params file and CLI alike:

### 4.1 Texture spec

```js
{
  name, seed,
  sections: [{
    dur, label,                    // label auto-composed if absent (R9)
    voices: [{                     // 1–4 voice GROUPS in the panel; engine unbounded
      players: 5,                  // round-robin hocket size (lanes auto-assigned)
      bpm: 110, bpmEnd: null,      // spread = per-group bpm difference; ramps
      articulation: 'staccato',    // staccato|ord|flz|fortepiano|cuivre
      notelen: 0.12,               // written length; 'sample' = ring length
      scatter: 0,                  // 0–1 fixed per-player cycle offset (seeded)
      jitterMs: 0,                 // ±ms re-randomised per attack
      level: 7.5,
      pitch: { policy: 'unison', set: null, root: 48 },   // §8
      curves: null                 // §7 — per-dial breakpoint lists, see below
    }]
  }]
}
```

**Lane assignment (pre-decided — do not invent):** voice groups take
**contiguous lane blocks in listed order** — group 0 gets lanes `0…players-1`,
group 1 the next block, and so on (lane N = score layer N = Tuba N+1). An
explicit `lanes: [..]` array on a voice overrides this. This reproduces the
`LANES_A = [0..4] / LANES_B = [5..9]` convention every existing preset uses.

**Curve schema (pre-decided):** `curves` is an object whose keys are the
voice's own scalar dial names — `bpm`, `jitterMs`, `scatter`, `level` — each
mapping to a breakpoint list `[{t, value, shape}]` (`t` in seconds from
section start; `shape`: `'linear'` default, or `{exp: k}` for the
"more exponential" bend). When a curve is present it overrides the scalar
(and `bpmEnd`). One extra key, `techMix`, carries articulation crossfades:
`[{t, value: {staccato: 1}}, {t: 30, value: {staccato: 0.3, ord: 0.7}}]` —
at each attack the engine interpolates the mix and draws the technique from
it (seeded). Unknown curve keys → listed in the status line, ignored, never
thrown.

Research ranges are **soft rails**: the panel marks a value amber outside the
measured range (density > 23/s, jitter > 60 ms…) and renders anyway — never
blocks (D16 spirit).

### 4.2 `bank/texture_params.json`

```json
{
  "rev": 7,
  "active": "B",
  "variants": {
    "A": { "label": "rain, even bed",        "spec": { }, "fromModel": "RAIN" },
    "B": { "label": "rain, gallop under",    "spec": { }, "fromModel": "RAIN" },
    "C": null
  }
}
```

Unknown/missing fields: engine fills documented defaults and lists
unrecognized keys in the panel status line — never throws, never silently
ignores a typo (the 2v rule).

### 4.3 Worked example (the implementer's reference render)

The AI writes this into `bank/texture_params.json`:

```json
{
  "rev": 1,
  "active": "A",
  "variants": {
    "A": {
      "label": "A: RAIN reference · jitter 45",
      "fromModel": "RAIN",
      "spec": {
        "name": "rain-ref", "seed": 11,
        "sections": [{
          "dur": 14,
          "voices": [{
            "players": 10, "bpm": 110,
            "articulation": "staccato", "notelen": 0.12,
            "scatter": 0, "jitterMs": 45, "level": 7.5,
            "pitch": { "policy": "unison", "root": 48 }
          }]
        }]
      }
    },
    "B": null, "C": null
  }
}
```

Expected engine result (orient by these, exact values depend on seed):
composite rate ≈ 10 × 110/60 ≈ **18.3 attacks/s** · ~256 notes over 14 s ·
per-player gap ≈ 0.545 s vs the ~0.42 s C3 staccato ring → **0 hard / 0
soft** · metrics: sd of composite inter-attack intervals ≈ **30–40 ms** with
cycle-position unevenness **well under 0.5** (jitter never repeats — compare
scatter 1.0, which gives sd ≈ 46 ms at unevenness ≈ 1.3) · first marker: a
plain-language sentence naming the texture, the moved dials and the seed.
Status line reads like: `v1 · A · "RAIN reference · jitter 45" · seed 11 ·
sd 34 ms · ⚠ 0 hard / 0 soft`.

---

## 5 · The categories are the first five MODELS

A category is **not code and not a mere preset — it is a MODEL in the 2y
sense** (a point plus the directions worth travelling from it, and how far),
stored in `bank/texture_models.json` and editable there, because the
vocabulary is the composer's and already evolved once mid-research
(smear·rain·stutter·pulse → smear·ticks·rain·gallop·groove). Shipped seeds,
straight from the research:

| model | point (defaults) | source |
|---|---|---|
| **SMEAR** | 1×10 voices, scatter 0, jitter 0, spread 0, 18–23/s | phase07 cell 1, HEARD |
| **TICKS** | same, density 8–15/s | phase07 cell 2 region, HEARD |
| **RAIN** | jitter ±35–60 ms, density mid-high | phase09/E2, HEARD |
| **GALLOP** | 2×5 voices, ΔBPM (lap 2–12 s) — or scatter 0.2–1.0 | phase03/07, HEARD |
| **GROOVE** | fixed scatter 0.2–1.0 at LOW density (parseable figure) | phase07 diagnosis |

Panel category buttons load the model's point into the dials (dials stay
visible — R1). The **repetition/density crossover** (groove↔texture boundary,
predicted near 12–17/s, untested) is a battery run *in* the sandbox; its
answer updates TICKS/GROOVE **as data**.

---

## 6 · The qualitative layer — vocabulary and recipes

The composer's stated interface: describe the change; AI turns the knobs.
Mechanically that is a **vocabulary → dial-endpoints table**, applied by the
AI when writing `texture_params.json` variants. Per 2y's ruling: **recipes are
endpoints + interpolation ranges, stored as data — never code in JSON.**

Starting table (research-derived; refined by ear into the store's
`_vocabulary` block, mirroring `bank/morph_params.json`'s):

| the composer says | the recipe moves |
|---|---|
| *rainier / more rain-like* | jitterMs → 35–60, scatter → 0, spread → 0 |
| *smearier / smoother* | jitter+scatter → 0, density → 18–23/s |
| *tickier / more separated* | density → 8–15/s, scatter 0 |
| *more gallop* | scatter → 0.2–1.0, or 2-voice ΔBPM (lap 2–12 s) |
| *a DIFFERENT gallop* | **same dials, new seed** (§9 — identity vs draw) |
| *groovier / more of a loop* | density down + fixed scatter up |
| *more fluttery* | ΔBPM up within lap 2–12 s (faster alternation) |
| *denser / greater density* | density up (amber past 23/s — the ceiling) |
| *more mechanical / more human* | jitter down / up |
| *quicker build* | morph duration down |
| *more exponential build* | curve shape exponent up (§7) |

Two-sided contract: the AI **also reports which dials it moved** in the
variant label (*"B: rain, jitter 45→60"*), so the numbers stay learnable —
qualitative on top, never opaque.

Per-model recipes (e.g. RAIN's *"gallop-surfacing"* direction with its heard
boundaries) accumulate in `texture_models.json` exactly as 2y's
`morph_models.json` does for morphs — same schema shape, separate file, no
shared writes (§15.9).

---

## 7 · Morphs (R3)

Any dial automatable along a curve. Data model: per-voice-group breakpoint
lists `{t, value, shape}` (`shape`: linear | exp(k) — the "more exponential
build" dial), interpolated by the engine. v1 panel exposes the two-point case
(**from-model → to-model over N seconds**); the engine speaks full breakpoint
lists so batteries, pockets and the AI loop get the general case free.

Mechanisms, all proven in the engine or one-line generalisations:

- **density(t), spread(t):** `steadyOnsets` already integrates `rateOf(t)` —
  exact under ramps; generalise from (bpm, bpmEnd) to breakpoints.
- **jitter(t):** amplitude looked up per attack. Trivial.
- **scatter(t):** per-voice offset drifts to its target arrangement — the
  phase07 cell-6 mechanism (a solved tempo detour), generalised to arbitrary
  from→to endpoints. *(Least-proven line in this plan — modest math, flagged.)*
- **articulation(t):** per-attack technique drawn from a crossfading mix (the
  E3 blend as a curve); each technique keeps its own ring length in the
  playability pass.

**A category morph = a dial morph between two models.** Where a pair snaps
instead of crossfading (phase06 heard rain→stutter snap), that is a finding to
record per pair (E4's question), not a bug to fix.

---

## 8 · Pitch layer (R4) — from day one

The biggest research hole: the whole rhythmic map was ten players on one C3.
The layer imposes pitch over the generated attacks — deliberately
under-systematised (*"impose pitch sets and let the chips fall where they
may"*).

- **Sets:** the 15 tonality sets + 33 VERT01 chords via `tonality.js` (§3.4),
  plus literal MIDI lists. **Pooled/literal** chip as specified in 2u.
- **Policies** (per voice group, seeded): `unison` (the research control) ·
  `perVoice` (each player one pitch, register-sorted — copy `assignBlast`'s
  stage-reading convention, don't re-derive) · `draw` (every attack draws from
  the set; optional no-immediate-repeat) · `cycle` (round-robin through set).
- **Physics follows pitch:** ring length is per-pitch (staccato 0.33–0.53 s),
  so clamping and playability use the **per-attack** pitch — the engine's
  `ringLength(tech, pitch)` already does. The 2u lesson is a hard requirement:
  **the conflict badge updates live while choosing a set** (a narrow set
  creates real conflicts the mock-up plays cleanly).
- Out-of-range pitches substitute nearest-in-set + amber flag — never refuse,
  never silently skip.

Not in v1: voice-leading, progressions, per-attack registral scripting. If
pitch dissolves the accent artefacts (the composer's expectation — E5), that
goes in findings, not machinery.

---

## 9 · Seeds, PIN/A-B, humanize — the honesty machinery

Why these are first-class (they exist to fix the research method's two
measured confounds):

- **Seeds (draw variance, R5).** At ten voices, "jitter ±35 ms" is not one
  sound — it is a **lottery**, and each render is one draw from it. The
  phantom "accents" in the research came from judging single draws. The seed
  is the draw number: visible in the panel, stepped with ↑/↓, stamped in every
  render's marker. Stepping seeds answers *"is this the setting, or just this
  draw?"* — and *"a different gallop"* is literally a new seed at the same
  dials. A texture that only works on one seed is not a texture yet.
- **PIN / A-B (order effects).** In the research batteries the same setting
  drew opposite verdicts at different battery positions (ear drift). **P**
  pins the current render as the reference; **A** flips playback between
  pinned and current, back-to-back, same position. Every comparison becomes
  pairwise and immediate: change one thing — a dial, or only the seed — and
  flip. Batteries remain for coverage; verdicts come from A/Bs.
- **Humanize (R6, the performance rule).** **H** re-renders the current spec
  with the human/hall error model overlaid and A/Bs it against the clean
  render. The model is composition of existing dials: **stage scatter** (fixed
  per-player offset, up to ±15 ms — the ~30 ms front-to-back propagation
  spread over a 10 m stage) + **human jitter** (per-attack, default ±25 ms,
  adjustable; ESTIMATE, amber — mis-tints an A/B, never blocks). A keeper
  **cannot be banked without a robustness verdict** (`survives: yes/no/notes`).
  Scatter-0 (SMEAR-family) keepers carry a standing label: **dead-even is not
  reachable live** (stage-width ceiling; the mock-up is biased toward evenness
  and mass).

---

## 10 · Pockets — long renders and time windows

The composer's retained workflow: *"create a long phase shift and then snip
parts of it."* Prompt-driven (the AI line), two pre-decided routes:

- **Parametric pocket (primary — it stays adjustable).** New engine helper
  `windowToSpec(spec, t0, t1)`: resolve every time-varying dial over the
  window and emit a new spec — either **frozen** (constants at the window's
  values → a static texture) or **moving** (a two-point morph across the
  window). Seed policy is explicit, and `literal` has one pre-decided
  subtlety: **regenerate the FULL original spec deterministically and keep
  only the notes inside the window** (exact by construction) — never re-seed
  a shorter render, because the jitter streams draw per-attack across the
  whole timeline and a short render's draws would differ. `fresh` = the
  window's dial values with new seeds. The result is a **MODEL**, immediately
  tweakable (*"the 28–35 one, but brighter, quicker"*).
- **Literal clip (fallback, always available).** `extract_section.js` on the
  render → an **ACTUAL**. Loses adjustability, keeps the exact sound.

CLI support: long-process presets (`tex-process-*` score files with
self-describing markers so the composer can navigate by eye) and
`--window t0 t1 [--freeze|--moving] [--fresh]` invoking `windowToSpec`.

---

## 11 · Playability, always on (R7)

- Engine computes per-player tightest attack gap vs ring (per-attack pitch),
  clamps **variable-length** notes to the player's own next attack, never
  clamps **fixed one-shots** — their overlaps stay visible as real conflicts
  (D9).
- Panel badge `⚠ N hard / M soft` on **every** generate, using the D17
  constants verbatim (`minAttack 0.11 + 0.0093/st cap 0.22`, tongue reset
  0.03). No new constants.
- After Insert, 2r's occupancy wash and resolver apply unchanged (inserted
  texture notes are ordinary notes).
- Gate: the badge agrees with `tools/audit_playability.js` on the same render
  saved as a score — one law, two consumers, verified equal (§13 Phase 1).

---

## 12 · Stores, export, and the 2y alignment (R8)

Two stores, following PLAN 2y's architecture (parallel files, same shapes —
**no shared writes** with 2y's stores; see §15.9):

- **MODEL store — `bank/texture_models.json`** (mirrors 2y's
  `morph_models.json`): per model — the point (spec), the elements heard in
  it, recipes with boundaries (endpoints-only), verdicts, the **required
  robustness verdict**, and links to its actuals. Seeded at Phase 1 with the
  five categories (§5). `_vocabulary` block carries §6's table.
- **ACTUAL store — `bank/actuals/ACT-<MODEL>-<NN>.json`** (2y's convention):
  the concrete render — score `objects` — with **provenance** back to model,
  spec, seed, rev. Written by panel Insert-and-bank or by
  `tools/place_texture.js`. If 2y's converter/validate tooling has shipped by
  build time, use it; if not, write files matching its plan's §5 format
  (read it) so the stores merge cleanly later.
- **Into the piece:** `tools/place_texture.js --model <name> [--actual NN]
  --at <t>` — regenerates (or recalls the actual) and places via the 2w
  conventions (`groupId`, META shape, marker, audit). Panel **Insert at
  playhead** covers the interactive case.
- **MIDI:** `node tools/phase_shift.js --fromModel <name> --midi` →
  `midi/` via `midi_out.js` (10-track + 1-track with the routing print).
- **Score files:** long renders and batteries save under `tex-` names via the
  normal scores dir, appearing in the Scores menu like `phase01–13`.
- **Taxonomy filing** of chosen keepers happens per `docs/TAXONOMY.md`
  (AI files without being asked — not a UI feature).

---

## 13 · Build phases & gates

**Phase 0 — extraction + tests. — `DONE 2026-08-16`, gate passed.**
`texture_engine.js` extracted; CLI rewired over it; `tools/test_texture.js`
green (no server, no audio — the `test_morph.js` model): the measured
scatter→deviation table · jitter never-repeats vs scatter repeats-exactly ·
clamp logic (variable clamps, fixed never) · seed determinism · density
arithmetic · pitch (unison control) · markers land in `objects` and the
`markers` array stays empty.
*Gate:* regenerate `phase07-scatter` through the new path — `objects` array
**identical** to the committed score (metadata timestamps excluded). The
research corpus is the regression suite. *(If exact float identity fails for a
legitimate reason — e.g. an operation-order change — stop and say so; do not
loosen the gate silently.)*

> **PHASE 0 RESULT (measured, 2026-08-16).** The gate passed **wider than
> specified**: all **nine** preset scores regenerate byte-identically (11,740
> objects), and extracted-vs-HEAD output is identical on **both** onset models
> across 11 renders. **129 assertions green.** Three corrections to this
> section, all verified by running:
>
> 1. **The unevenness numbers in the sentence above were predictions, not
>    measurements** (the planning model never ran code). The metric is now
>    defined precisely — *coefficient of variation of the circular gaps between
>    players' mean cycle positions* — and the **measured** phase09 A/B split is
>    **jitter ±60 ms → 0.088 · scatter 0.2 → 0.591** at near-identical sd
>    (34.0 vs 32.2 ms). The *split* is real and large (6.7×); the absolute
>    values are not 0.22/1.34. Tests assert the split, not the guessed numbers.
> 2. **`sd` reproduces the research table almost exactly** — scatter 0 / .03 /
>    .08 / .2 / 1.0 → **0.09 / 6.40 / 21.36 / 32.92 / 46.28 ms** against the
>    MEASURED 0.1 / 6.4 / 21.5 / 32.6 / 46.2. The ear-calibrated scale survives
>    the extraction intact.
> 3. **`phase01-8th` and `phase02-*` cannot be reproduced by the committed CLI**
>    — they carry per-stage `performanceNotes` (`phase/unison`) that the current
>    sweep path stopped emitting (it now writes `phase/s0`). **Verified
>    pre-existing:** the HEAD code before this extraction produces the same
>    divergence. Not caused by 2x, not repaired by 2x → `docs/NITS.md`. The nine
>    beat-model scores are unaffected and are the regression corpus.
>
> Gate evidence is reproducible with `node tools/test_texture.js`.

**Phase 1 — panel floor. — `BUILT 2026-08-16`; gate PART-PASSED, listening
items open.** Panel + EMIT audition + params loop + category
buttons (models seeded) + dials + seed stepping + PIN/A-B + humanize + badge +
auto-composed labels (R9).
*Gate (running app, session `untitled`):* params file edit → panel shows new
rev ≤ 1 s · SMEAR / RAIN / GALLOP audibly distinct through the panel · badge
equals `audit_playability.js` on the same render saved as a score · A/B flips
back-to-back with no residue (stop, play one ord note — clean pitch/volume) ·
humanize A/B heard on one SMEAR and one RAIN (the fragile/robust prediction's
first data point) · keys dead when the panel lacks focus.

> **PHASE 1 RESULT (2026-08-16).** Verified in the running app on a throwaway
> server (`PORT=5210`) so the composer's own `:5200` was never disturbed. **175
> assertions green, and Phase 0's byte-identity corpus still holds after every
> Phase 1 change.**
>
> **Gate items verified by machine — 3 of 6:**
> - **params edit → panel: 888 ms**, measured with a watcher, inside the 1 s bar.
> - **badge == `audit_playability.js`: 90 hard / 0 soft on both**, on a
>   checksum-identical render (browser and node agreed bit-for-bit before the
>   tool was run). One law, two consumers, verified equal.
> - **keys dead unfocused / live focused**, SPACE swallowed so the app's global
>   transport never sees it, and number fields not hijacked.
>
> **Gate items that need the composer's ears — 3 of 6, OPEN:** SMEAR/RAIN/GALLOP
> audibly distinct · A/B with no residue · humanize A/B on one SMEAR and one
> RAIN. These need loopMIDI + Reaper + UVI and a musician; they are the Phase 1
> listening session, not something an agent can sign off.
>
> **Four defects found by running it, none by reading it:**
> 1. **Seed stepping did nothing** (R5 dead). The jitter PRNG was seeded from a
>    hardcoded constant, so a RAIN texture rendered bit-identically at every
>    seed — the panel's central identity-vs-draw question silently answered
>    itself. Fixed by folding `spec.seed` into the stream in a way that leaves
>    the preset stream untouched (a missing seed must stay missing, never
>    default to 1, or the Phase 0 corpus shifts). **150 assertions had not
>    caught it**; there is now a section that does.
> 2. **`active` in the params file was ignored on a rev bump** — the AI could
>    write a new slate saying "hear B" and the composer would sit on A reading
>    A's dials. Inherited from 2v's panel; fixed here, filed for 2v in NITS.
> 3. **`E.onStop` is a single slot both panels share** — a plain assignment left
>    the Morph panel's Play button stuck reading "Playing…" forever. Now chained.
> 4. **The badge is structurally ring-blind.** D17 compares WRITTEN note bounds,
>    so ten players re-attacking staccato every 0.30 s against a 0.42 s ring
>    reads `0 hard` — and the mock-up plays it perfectly cleanly (2r). Added as
>    a SEPARATE, loud indicator rather than by forking the shared law. The whole
>    research corpus sits inside its ring; this only bites past the ceiling.
>
> **One deviation from the plan, flagged per §17.** `EMIT.play()` was **not
> liftable**: it pre-arms a pitch bend per note and drives dynamics through a
> per-frame CC7 envelope, while a texture note is a plain velocity note with CC7
> pinned (§15.10, trap #5) and D29 forbids bend. The plan's pre-decided fallback
> is "a copy of clusterview's setTimeout player" (§3.2); what was built is that
> fallback **improved** — EMIT's `ensureMidi` / `routeFor` / `noteOn` / `noteOff`
> / `panic()` and its note registry are reused verbatim, so there is still
> exactly one stop path, and only the ~20-line scheduling loop is local.
>
> **§15.13 is now a measurement, not a worry.** The scheduler corrects each
> delay for the time the scheduling loop itself consumes (without it, notes
> placed late in a ~900-timer loop fire late by a systematic ramp), and it
> records actual-vs-intended onset for every note. The panel reports mean and
> max drift after each play and points at the `--midi` escape hatch when drift
> exceeds 15 ms — so a suspicious dense texture can be blamed on the material or
> the playback with evidence.

**Phase 2 — pitch layer. — `DONE 2026-08-16`, gate passed.** `tonality.js`
extraction (clusterview rewired, verified unchanged on a remap A/B), policies,
pooled/literal, badge live on set change.
*Gate:* a RAIN keeper re-rendered under three sets back-to-back; one
deliberately narrow set shows its conflicts **while choosing** (the 2u case
reproduced); clusterview behaves identically pre/post extraction.

> **PHASE 2 RESULT (2026-08-16). 210 assertions; Phase 0's corpus still 9/9
> byte-identical with the tonality module injected (the pitch layer is inert for
> presets by construction).**
>
> - **The clusterview extraction is proven, not assumed:** the old inline
>   implementation was lifted out of the committed file and run against the new
>   module over **400 randomised cases** (15 sets × pooled/literal × clusters
>   containing simultaneities and genuine repeats) — **400/400 byte-identical**,
>   plus **15/15 palette sets identical**. Then confirmed live: clusterview
>   loads the module, all 15 tonalities render, and a real transform on
>   `CLOUD02-A` (50 notes) remaps correctly and stays non-destructive.
> - **Policies:** `unison` · `perVoice` (register-sorted, lowest pitch on the
>   highest lane — `assignBlast`'s stated convention, copied not re-derived) ·
>   `draw` (seeded, no-immediate-repeat) · `cycle`. Pooled/literal chip.
>   An unresolved set name is reported loudly and rendered at the root, never
>   silently.
>
> **THE PHASE-2 FINDING — the density ceiling is pitch-dependent, and the
> research number is a best case.** MEASURED: **C3 (0.42 s) is the 10th
> *shortest* of the 36 staccato samples**, and all 13 experiments used it. The
> ring runs 0.33–0.53 s and is **not monotonic** in pitch (2n's multisample
> sawtooth), so it cannot be reasoned about by register. Implied ceilings:
> **unison C3 → 23.8/s; every real pitch set → 18.9–20.8/s.** So a texture
> calibrated by ear at unison C3 is **~18% too dense the moment it is given
> pitches**, and the mock-up plays the difference perfectly cleanly (2r).
> The engine now **computes** the ceiling from each render's own worst ring and
> the panel marks density against that, rather than against a flat 23. The 2u
> case reproduces exactly as the gate asked: picking m3 (F) / cl spread / oct Bb
> at 21/s drops the ceiling to 20.0 / 18.9 / 18.9 and the amber warning fires
> **while choosing**. *(Also measured: jitter alone can push a texture past the
> ring — at 21/s with jitter ±45 ms the tightest gap dips under 0.42 s even at
> unison C3. Density alone does not tell you whether a texture is playable.)*
>
> **Still needs the composer:** which pitch set is the keeper, and whether pitch
> dissolves the accent artefacts (E5's expectation). Both are listening
> questions; the machinery to ask them is built.

**Phase 3 — morphs + pockets. — `DONE 2026-08-16`, gate passed.** Breakpoint
curves; from→to model morph in the panel; `windowToSpec` + CLI `--window`;
long-process presets.
*Gate:* "RAIN → GALLOP over 30 s" renders and plays; engine metrics at t=0 /
t=end match the static models' metrics (the morph really connects them); a
pocket extracted from a long render regenerates and, with `literal` seed
policy, reproduces the window's attacks exactly; one known-snap pair
reproduces and is recorded as a finding, not patched.

> **PHASE 3 RESULT (2026-08-16). 252 assertions; corpus still 9/9.**
>
> - **Curves on `bpm` · `jitterMs` · `scatter` · `level` · `techMix`.** Density
>   is exact rather than stepwise because `steadyOnsets` already integrates
>   `rate(t)` — asserted against the closed form: for a linear a→b ramp the two
>   halves hold `(3a+b)/4` and `(a+3b)/4` of the mean rate, a ratio of exactly
>   **1.4** for 60→120, which is what the engine produces. `scatter(t)` is the
>   least-proven line in the plan and is now a direct phase-offset drift rather
>   than phase07's solve-for-`bpmEnd` tempo detour, so from→to endpoints are
>   arbitrary. The **exp shape** dial is a true exponential so `+k` and `−k`
>   mirror exactly (asserted) — "more exponential" is a symmetric control.
> - **The morph really connects the models.** With the curve arriving at 24 s and
>   *holding* to 34 s (measuring a moving window against a static model compares
>   the journey to the arrival), the endpoints land **within 1 %** of the static
>   models on `cv`, and unevenness matches at **0.814 vs 0.814**.
> - **New metric `cv`** — sd over the mean interval. `sd` is an absolute spread
>   in ms, so it roughly doubles when density halves even if character is
>   unchanged. The research table is all at one density so sd was right there,
>   but a morph *changes* density and sd cannot survive that comparison. `cv` is
>   the same irregularity measured in units of the beat.
> - **Pockets both ways.** `windowToSpec` freeze/moving → a MODEL that is still
>   tweakable; `windowNotes` → the exact clip. **The determinism trap is
>   demonstrated, not just avoided:** slicing [10,18] from the full render gives
>   99 notes, re-rendering the same window as a short spec gives 98 with
>   different onsets, because the jitter stream draws per attack across the whole
>   timeline. Both are legitimate — the bug would be silently giving one when
>   asked for the other.
> - **Long processes** `dissolve` · `crossover` · `colour`, with periodic time
>   markers so a window is nameable by eye (largest gap 13 s over 191 s). The
>   `crossover` battery is the §5 open question — repetition parseable at 8/s,
>   not at 18/s — set up to be answered by ear and written back as data.
>
> **Found while building:** `normaliseSpec` rebuilt each section field-by-field
> and so silently dropped any key not on its list. `markEvery` was added, did
> nothing, and looked like a marker bug rather than a plumbing one. Sections are
> now copied wholesale; a regression test pins it.
>
> **Gate item left for the composer:** the known-snap pair. phase06 *heard*
> rain→stutter snap; the metric trajectory can show a discontinuity but whether
> it snaps *to the ear* is not something a test can judge. The `dissolve` process
> is built to ask exactly that question and records it as a finding either way.

**Phase 4 — stores + placement + export.** `texture_models.json` +
`bank/actuals/` writes with provenance; robustness-verdict-required banking;
`place_texture.js`; `--fromModel` MIDI; recipes/`_vocabulary` maturation loop.
*Gate:* bank a keeper → place into a scratch score → correct
`groupId`/META/audit → drag the group and replay (survives — they are ordinary
notes) · an ACT file's provenance re-derives its render exactly (2y's
integrity idea) · MIDI decodes with the right note count and channels.

**Worst-case floor:** Phases 0–1 alone already deliver the qualitative loop on
static textures with seeds, A/B and humanize — more than the script workflow
ever gave. Morphs, pitch and stores each add value independently; none can
strand the composer.

---

## 14 · Requirements → where they land

| req | where |
|---|---|
| R1 sound-first | §5 models over §4 dials; §6 vocabulary over both |
| R2 static holds | spread 0 = static by construction (phase07-verified) |
| R3 morphs | §7 |
| R4 pitch layer | §8, Phase 2 |
| R5 seed auditioning | §9 |
| R6 robustness | §9, required verdict at banking |
| R7 playability | §11 |
| R8 export ×2 | §12 |
| R9 self-describing | auto-composed labels/markers (Phase 1); tex-process markers (§10) |
| R10 regeneration | models are params (§12); pockets parametric-first (§10); **no editor** (§1) |

Research batteries the surface must be able to express (acceptance, not
features): E4 category morphs (§7) · E5 pitch (§8) · E7 perturbation (§9) ·
the counterpoint levers (register via per-group pitch, articulation per group,
non-simple rates per group — all present in §4's voice groups; spatial
position stays unrenderable and is **flagged** on any counterpoint verdict,
never settled on the render alone).

---

## 15 · Failure modes → mitigations

1. **Autosave clobbers a loaded score** (memory): panel preview never touches
   the score object; app testing under session `untitled`; long renders save
   as new `tex-` names only.
2. **Markers silently never render** (Principle 4): engine writes markers into
   `objects` only; unit test asserts the `markers` array stays empty.
3. **Draw variance read as a verdict:** seed visible, seed-only A/B is one
   keystroke, marker carries the seed.
4. **Order effects:** PIN/A-B back-to-back primitive; batteries for coverage,
   never verdict-by-memory-across-positions.
5. **Mock-up bias (coincident, sample-accurate, no stage):** humanize includes
   stage scatter; scatter-0 keepers labeled not-reachable-live; counterpoint
   verdicts flagged render-only.
6. **Pitch changes physics:** per-attack ring lookup; badge recomputes on
   every set/policy change (the 2u trap).
7. **Extraction regression:** Phase 0 identity gate on a committed research
   score + the measured-table unit locks.
8. **Concurrent agents in composer.html:** 2z (gesture shaping) and 2y (model
   panel work) may touch it too. Engine/panel live in their own files; the
   composer.html diff is wiring only, anchored by element ids and strings
   (`blastsBtn`, the Morph button), never line numbers; `git status` before
   editing; explicit-path staging (D30).
9. **Store collision with 2y:** separate files (`texture_models.json` vs
   `morph_models.json`); `bank/actuals/` shared as a *convention*, with
   distinct `ACT-<MODEL>-…` name prefixes; never write 2y's files; if 2y's
   validate exists, run it after our writes.
10. **Velocity vs CC7 (2q, open):** audition emits velocity from `level` with
    CC7 pinned (D12/the clusterview position); score playback of inserted
    notes is `sonifyMode:'plain'` — same class as blasts/clusters. One
    documented spot to convert if 2q resolves the other way.
11. **Keyboard collisions:** panel-scoped handlers only (the 2v rule).
12. **Note-off truncation unknown (2n/2o):** the ceiling comes from
    `bank/sample_lengths.json` at render time; if the 60-second probe ever
    shows truncation, the table updates and every consumer follows — nothing
    hardcodes 0.42 s.
13. **Timer-based audition jitter at high density** (EMIT schedules with
    setTimeout-class timers; 23 attacks/s = 43 ms grid): if a dense texture
    sounds suspicious in the panel, the phase04 escape hatch applies — render
    the same content as MIDI (`--midi`) and A/B in Reaper before any verdict
    blames the material. Written into the panel's help line.
14. **The qualitative layer goes opaque** (composer loses the numbers): every
    AI-written variant label names the dials it moved (§6's two-sided
    contract); dials always visible in the panel.

---

## 16 · FOOTHOLDS — for the implementing model (read before any code)

**Kickoff prompt** (the composer pastes this to start the implementing
session):

```text
/session-start docs/plans/TEXTURE_SANDBOX_PLAN.md

Implement PLAN 2x (TEXTURE SANDBOX). The plan is
docs/plans/TEXTURE_SANDBOX_PLAN.md — follow it exactly, in phase order
(0 → 4), stopping at each phase gate and verifying in the running app before
moving on.

Before any code: read docs/AI_METHODOLOGY.md (governing), then the plan's
§16 FOOTHOLDS, then docs/plans/PHASE_SANDBOX_REQUIREMENTS.md for the
evidence behind the design.

Rails:
- D29 is confirmed: attack fields only — no pitch bend anywhere in this build.
- Another agent works in this same tree (2z/2y): git pull before every work
  chunk; stage explicit paths only (never git add -A); push after each commit.
- Test in the app under session name 'untitled'; never mutate piece-* or
  archive scores.
- Commit at phase gates referencing 2x. No time estimates — confidence and
  risk instead. If a gate fails, report it plainly; never loosen a gate.
- If a reuse target (morph_emit.js, the Morph panel patterns, the tonality
  remap) proves unliftable, stop and say so — the fallbacks are pre-decided
  in the plan.
```

Facts a cold session needs, verified 2026-08-16. If one of these proves wrong,
stop and re-check rather than improvising around it.

**Environment.**
- Windows; no `package.json`, no `node_modules`, no npm anywhere in this repo.
  Plain `node <script>` only. (The 2v implementer lost time assuming node MIDI
  bindings existed. There are none; the browser owns MIDI.)
- Server: `node score/server.js` → `http://localhost:5200/composer.html`.
  Static files from `score/public/`. Scores live in `scores/` (menu = dir
  listing via `/api/composer/list`).
- App testing: session name **`untitled`** (the one autosave skips). Never
  load-and-mutate `piece-*` or archive scores.
- Git: explicit paths only (never `git add -A` — a second agent works in this
  tree), commit referencing **2x**, push after commit (D30).
- **The other agent is implementing 2z (gesture shaping) and 2y (model↔actual)
  in this same tree, 2z first — both plans approved 2026-08-16.** Before every
  work chunk: `git pull`, then `git status`, then check whether composer.html
  gained new panels/buttons since your last look. Their files
  (`docs/plans/GESTURE_SHAPING.md`, `MODEL_AND_ACTUAL_PLAN.md`,
  `bank/morph_models.json`, `bank/actuals/` writes from their side) are
  read-only to you.
- **Rounding is part of byte-identity.** The engine rounds onset times with
  `toFixed(4)`, note bounds with `toFixed(4)`, marker times with `toFixed(2)`.
  Preserve every existing rounding call exactly during extraction — the
  Phase 0 identity gate depends on them.
- Lanes: score layer N = lane N = **Tuba N+1**; §4.1's contiguous-block rule
  reproduces the presets' `LANES_A/LANES_B` convention.

**Files this plan creates:** `score/public/texture_engine.js` ·
`score/public/texture_panel.js` · `score/public/tonality.js` ·
`tools/test_texture.js` · `tools/place_texture.js` ·
`bank/texture_params.json` · `bank/texture_models.json` · `bank/actuals/`
(shared convention). **Modifies:** `tools/phase_shift.js` (rewire over
engine) · `score/server.js` (one GET route) · `score/public/composer.html`
(button + script tags + panel wiring only) · `score/public/clusterview.html`
(tonality rewire only).

**Anchors (search by string, never by line number).**
- `tools/phase_shift.js`: onset builders `steadyOnsets` / `sweepOnsets`;
  note/marker constructors `mkNote` / `mkMarker` inside `buildScore`; the
  jitter block (comment "PER-ATTACK JITTER"); the clamp (comment "A
  VARIABLE-LENGTH note"); ring lookup `ringLength(tech, pitch)`; the
  technique→channel map `CH = { ord: [1,''], fortepiano: [11,''], cuivre:
  [5,''], flz: [10,''], staccato: [4,'b'] }` — staccato lives on the **`b`**
  UVI instance (D2: 21 techniques > 16 channels → two ports per tuba;
  resolution rule is `tech.port || inst.port`).
- `score/public/morph_emit.js`: the `EMIT` object — `routeFor(lane, techKey)`,
  `noteOn/noteOff`, `panic()`, the `_active` registry. **Trap documented in
  its header:** `Composer` in composer.html is a *lexical* global —
  `root.Composer` is silently undefined; always go through a
  `typeof Composer !== 'undefined'` check (the `HOST()` pattern).
- `score/public/morph_panel.js`: the poll loop against `/api/morphparams`
  (rev compare), panel focus/keyboard scoping, floating-window creation —
  copy these patterns wholesale.
- `score/server.js`: the `/api/morphparams` route is the template for
  `/api/textureparams` (no-store header pattern).
- `score/public/clusterview.html`: `TONALITIES` const (15 named sets); the
  remap sits in the transform layer near the `TAXCH` chord lookup — extract
  both set data and the pooled/literal + no-repeat-kick logic.
- Insert path: mirror the Morph panel's insert — find it in
  `score/public/morph_panel.js` (search for its Insert button wiring and the
  `groupId` + META-shape construction) and follow the same conventions as
  `tools/place_gesture.js` (PLAN 2w). Do not write a parallel insert.
- Playability constants: D17 in `tools/audit_playability.js` — reuse, never
  re-type.

**Known traps from the 2v implementation (same stack, same season).**
1. Markers/labels written to the `markers` array round-trip but never render
   (Principle 4) — always `objects`.
2. Bend residue is real but irrelevant here — this plan never sends bend; do
   not add "bend hygiene" machinery, it lives in 2v.
3. The permission layer has refused running repo `.ps1` files but allowed the
   same code inline — if a PowerShell step ever appears, run it inline.
4. Autosave writes the loaded score every 5 s — see §15.1.
5. Score playback of plain notes (`sonifyMode:'plain'`, `recVel`) is the
   proven path for this material — `phase01–13` were auditioned exactly this
   way. Do not route texture score playback through CC7 sonification.
6. When a gate fails, report it plainly with what you ran and what came back
   (AI_METHODOLOGY rule 4). Never loosen a gate to pass it.

---

## 17 · Implementer rules

- `docs/AI_METHODOLOGY.md` outranks this plan on how to work.
- Verify gates **in the running app**; say what you ran and what came back;
  measured vs inferred kept distinct; residual risk in one line; no time
  estimates.
- Reuse verbatim, never fork: `morph_emit.js` · the Morph panel patterns ·
  D17 constants · `assignBlast` ordering · 2w placement conventions · the
  tonality remap. If a reuse target proves unliftable, stop and say so —
  the fallbacks in §3.2/§15 are pre-decided, nothing is improvised.
- Deviations that matter → one line in the session journal; papercuts → NITS.
- Commit at phase gates referencing **2x**; explicit paths; push after commit.
