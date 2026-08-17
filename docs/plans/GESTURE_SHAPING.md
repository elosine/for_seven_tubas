# GESTURE SHAPING (PLAN 2z) — implementation plan (v2)

> **Status: APPROVED by the composer 2026-08-16 (v2). Ready to implement —
> build this BEFORE PLAN 2y, never concurrently.** Written to be implemented cold
> by a separate session, **possibly a less capable model** — hence §11's
> environment facts, the worked example in §12, and the per-gate acceptance
> checklists. Read `docs/AI_METHODOLOGY.md` first — it governs everything here
> — then `docs/RUNNING_LOG.md` COLD START (the six traps), then this file
> top to bottom.
>
> **v2 changes from v1** (composer, day 11): the **D** of ADSR added
> (attack peak + decay into the body) · attack rebuilt as a **multilayered
> object** (gain + scheduling + edge articulation + per-voice transient +
> noise layer on spare players + pitch motion) · **release redefined as a
> SUBSET, not a mirror** (taper + exits + dropout + motion; no
> peak/decay/transient/noise) · **striated entry demoted from default**
> (when a shape block is present, entry defaults to `together`) ·
> `order` and `motion` added throughout.
>
> **Plan ID note:** this item was listed as `2x` in PLAN.md, colliding with
> the texture sandbox; it is now **2z**, the sandbox keeps 2x.
>
> Sibling plan: `docs/plans/MODEL_AND_ACTUAL_PLAN.md` (PLAN 2y). Build order
> settled with the composer: **2z first, then 2y**. **Boundary:** 2z builds
> the capability and dials; 2y stores, names and recalls (including the
> shape-preset library — see §13). **Do NOT run 2z and 2y as two concurrent
> agents** — they share `morph.js`, `morph_panel.js`, `bank/morph_params.json`
> and `tools/test_morph.js`. Sequence them, and if any other agent is active
> in the repo, re-declare file ownership before writing anything.

---

## 1 · What this is (composer's words)

Day 10:

> *"The META SHAPE IS REALLY THE SOUND ITSELF. These morphs might have some
> sort of attack that can be designed and built into the gesture, and then
> some internal change over time, and some kind of release. In other words, we
> can craft a gesture on its own terms and then just fill in the tuba parts to
> make that gesture… I'm imagining being able to have an ATTACK instead, and
> add some cuivre, and then that proceeds into the morph, and then maybe
> decide some sort of release."*

Day 11 design session, distilled:

- **The attack is a multilayered item, as in electronic music.** A noise
  layer; an initial articulation; the building of a spectrum over time; a
  curve. Techniques dismissed as uninteresting for the *body* (singing into
  the tuba, flutter) may be exactly right as **ways of getting noise into the
  initial attack**. Stacking/doubling with staccatos or fortepiano belongs
  here too.
- **The release is a SUBSET of the attack's elements, not its mirror.** A
  traditional release — thinning of parts, getting quieter — plus the morph
  aspects: coming out of (or into) beating, pitch change on the way out, a
  release slope that can sharpen or soften, glissando. And the combination:
  *"some parts just immediately drop out, but yet it feels like a taper."*
- **Decay is real:** an attack may overshoot and settle into the body's level
  — the D of ADSR — rather than rising straight to it.
- **The striated (Grisey-like) entry is one option, NOT the default.**
- **Working mode:** the composer narrates qualitatively; the AI writes the
  params; the vocabulary of named shapes and dials is **harvested from those
  sessions** (D6's harvest principle), not pre-designed.

**This inverts the current order.** Today the carrier derives entry and exit
from breath logic alone and the overall shape is emergent; here the shape is
designed first and the parts are filled in to realise it — the same relation
the META layer already has to the density builds.

**Not in scope:** new morph models, the recipe/one-dial layer and shape
presets (2y), performance notation for releases (P3's naming session stays
queued), full phase-chaining (attack as its own independent morph — see §5.5
for why, and what the v2-future landing spot is).

---

## 2 · The envelope model — how this maps to ADSR

One gesture-level gain function `g(t)` multiplies the output of the existing
dynamics layer (`dynLevel`, D24) inside `stateAt`. Every model inherits it;
no model knows it exists.

```
gain
peak ─────────╮
              │╲  decay
   1 ─────────┼─╲────────────────────────╮
              │                          │╲  release
from ──╮  att │        BODY              │ ╲
       │╱     │  (the morph: dyn layer,  │  ╲
   0 ──╯      │   swells, the S — alive) │   ╲── to
      t=0   a.len  a.len+d.len    span−r.len  span
```

- **A** = `attack.len` + `curve`: `from` → `peak`.
- **D** = `decay.len` + `curve`: `peak` → 1. **`peak` defaults to 1, which
  makes decay inert** — ADSR degrades gracefully to ASR to "no shape" with
  one code path, no branches.
- **S** = the body at gain 1. The sustain is *not flat* — it is the whole
  existing morph (the D24 dynamics layer's swells/rotation plus whatever
  model is running). That is why S needs no new parameters here.
- **R** = `release.len` + `curve`: 1 → `to`.
- No `shape` block ⇒ `g ≡ 1` ⇒ **byte-identical output to today** (hard gate
  G0 — the composer's blessed recipes cannot drift).

The gain shapes CC7 loudness. It does **not** replace the *articulated*
attack — that is what §5.3's edge articulation, transient and noise layers
are for. Both kinds of attack exist and compose.

---

## 3 · Where it attaches (verified against the code, 2026-08-16)

All engine work in `score/public/morph.js` — PURE (no DOM/MIDI/fetch),
node-testable via `tools/test_morph.js` (101 assertions today; run before and
after every change).

| seam | today | with shape |
|---|---|---|
| **gain** | `dynLevel()` → per-note level breakpoints | `level = dynLevel(...) * g(t)` inside `stateAt`, before the existing clamp |
| **entry** | `buildCarrier`: first entry at `t = striationPhase(...) * segLen * 0.5` | entries distributed over `[0, attack.len]` per `entry`/`order`; the legacy formula IS what runs when `shape` is absent (§5.2) |
| **exit** | voices run to `span` | per-voice `endT` over `[span − release.len, span]`; dropout voices end early (§5.2) |
| **technique** | `stateAt` returns model/base technique | window override **in `stateAt` itself**, so the breath callback, fixed-length lookup, SWITCH check and emitted note all agree by construction |
| **pitch** | models via `voiceProgress` | `motion` adds a cents deviation inside the windows, **zero at the window's inner edge by construction** (§5.5); flows through the existing GLISS/REKEY machinery |
| **output** | note-relative `level` + `bend` breakpoints | unchanged — shaping is baked into the same note-relative breakpoints, so drag / group-scale / save-reload safety is inherited, not re-earned |

`toScoreObjects`, `morph_emit.js` and the insert path are untouched. The
panel's META contour is sampled from the notes' mean level, so the drawn META
shape automatically shows the designed envelope.

---

## 4 · Schema

One new optional top-level params key. All sub-keys optional with the listed
defaults; unknown sub-keys are **reported** (the engine's existing
unknown-key policy, extended down the tree).

```json
"shape": {
  "attack": {
    "len": 2.0,                //  s. REQUIRED if attack block present
    "entry": "together",       //  together | ramp | striated      (default together)
    "order": "low-first",      //  low-first | high-first | seeded (default low-first; used by ramp/striated)
    "curve": "expo",           //  linear | expo | sudden          (default expo)
    "from": 0.2,               //  gain at t=0, 0..1               (default 0.15)
    "peak": 1.0,               //  gain at end of attack, >= 1     (default 1; >1 engages decay)
    "technique": null,         //  colour of each voice's FIRST sustain segment (§5.3)
    "transient": null,         //  { "technique": "staccato" } — per-voice prepended one-shot (§5.3)
    "noise": null,             //  { "technique": "cuivre", "voices": 2, "midi": [60,63], "len": 1.2 } (§5.4)
    "motion": null             //  { "type": "converge", "cents": 40, "curve": "expo" } (§5.5)
  },
  "decay": {
    "len": 3.0,                //  s, peak -> 1. If attack.peak > 1 and decay absent,
    "curve": "expo"            //  a default decay {len: min(4, span*0.15), curve expo} is
  },                           //  applied AND reported in warnings — never silent
  "release": {
    "len": 8.0,                //  s, measured back from span. REQUIRED if release block present
    "exit": "staggered",       //  together | staggered            (default staggered)
    "order": "high-first",     //  low-first | high-first | seeded (default seeded)
    "curve": "expo",           //  linear | expo | sudden          (sudden = the tongue-stop cut)
    "to": 0.0,                 //  gain at span, 0..1              (default 0)
    "technique": null,         //  colour of each voice's LAST segment (e.g. flutter out)
    "motion": null,            //  { "type": "disperse", "cents": 30, "curve": "linear" } (§5.5)
    "dropout": null            //  { "fraction": 0.4 } — that share of voices exits early
  }                            //  and abruptly; the rest taper. Cluster-safe (§5.2)
}
```

Validation rules (enforced in `normaliseParams`'s shape handling, tested):

- `attack.len + decay.len + release.len` clamped to ≤ `carrier.span`
  (body may reach zero); clamping reported as `SHAPE_CLAMP`.
- `peak < 1` is clamped to 1 with a warning (`from` is the low-start dial).
- `dropout.fraction` clamped 0..1. `motion.cents` sanity-bounded ±1200
  (the REKEY machinery handles anything inside that).
- `shape` joins `KNOWN_KEYS`. **Fix in passing (G0):** `lanes` and `voices`
  are read by `normaliseParams` but missing from `KNOWN_KEYS`, producing a
  spurious `PARAM: unrecognised key` warning today. Add both.

---

## 5 · The five elements

### 5.1 Gain ADSR — §2. Curves

`linear`; `expo` (perceptual — implementation picks the exponent, pins it
with a test); `sudden` (holds ≈ 1 until the last ~10 % of its window, then
moves — as a release curve this is the tongue-stop / rexpodec cut of P3's
lineage). **Known floor:** the engine clamps level to ≥ 0.4 (of 10), so
`to: 0` lands at 0.4 — very quiet through the measured CC7 map, not digital
silence; the same floor every hand-drawn decrescendo already has. Do not
"fix" the clamp; note it in the panel help text.

### 5.2 Scheduling — who enters, who leaves, in what order

Entries (all one code path; the mode only changes each voice's offset):

- **`together`** (default when a shape block is present) — all voices at
  t = 0. The block attack.
- **`ramp`** — spread evenly across `[0, attack.len]` in the chosen `order`.
  The electronic fade-in: orderly accumulation.
- **`striated`** — the current seeded-irregular entry, scaled to the window.
  Kept as an option, **explicitly not the default** (composer, day 11).
- **No shape block ⇒ the legacy formula runs unchanged** — that identity is
  what makes G0's byte-identical gate achievable without an if/else fork.

`order`: `low-first` | `high-first` (voice index = pitch order — the render
sorts voices ascending, verified) | `seeded` (`staggerOrder`, a new draw per
seed).

Exits: **`together`** (all reach span) or **`staggered`** (per-voice `endT`
spread across `[span − len, span]` in `order`). Implemented as a per-voice
bound in `buildCarrier`; the final segment truncates to `endT`.

**Dropout** — the composer's *"some parts just immediately drop out, but yet
it feels like a taper"*: `fraction` of the voices exit **early and abruptly**
(their own `endT` in the first half of the release window, per-voice `sudden`
gain), the remaining voices taper to `to` over the full window.
**Cluster-safe by rule:** which voices drop is chosen with `reduceSource`'s
cluster logic — near-unison pairs drop or stay **whole**, never half a pair,
because half a pair does not beat (COLD START rule; the same reason voice
reduction keeps whole clusters). So *"do we want the beating to thin out"*
has a principled answer: beating thins by pairs.

Breath machinery is untouched: the body still segments by `maxBreath`,
splits instead of truncating, flags `BREATH`. A release window longer than a
breath contains a breath re-entry under a falling `g(t)` — musically correct
(a long taper IS re-attacked quieter).

### 5.3 Edge articulation — technique + transient

Two distinct things, both per-voice, both routed through existing machinery:

- **`technique`** — the colour of each voice's first (attack) or last
  (release) *sustain* segment. The full technique table is available here,
  **including the ones dismissed for the body**: `play_sing_ks` (singing into
  the tuba), `flz`, `bisb` — the composer wants them as noise sources at the
  edges. `SWITCH_PREP` already checks the prep gap into the body technique
  (only `play_sing_ks` at 1.0 s can flag against the ≥ 0.75 s breath gap).
- **`transient`** — a **prepended one-shot** (staccato / fortepiano /
  cuivre) before each voice's first sustain segment: the doubled/stacked
  attack. **The physics, stated so nobody fights it (D9):** one-shots end
  themselves — staccato 0.33–0.53 s, cuivre 0.99–1.35 s, fp 1.35–2.22 s
  (`fixedLength()` + `bank/sample_lengths.json`) — and one player cannot
  sound two notes at once, so the sustain re-attack follows at
  `transient start + sample length + RATE.tongueReset`. A staccato transient
  therefore gives hit-then-tone at ≈ 0.5 s scale (ten hits at t = 0, sustains
  blooming in half a second later — a real ensemble attack); it can never
  give hit-AND-tone from the same player. **Simultaneous stacking is the
  noise layer's job (§5.4), which uses different players.** Transients carry
  no motion (plain hits at the voice's onset pitch).

Range reality (verified in `TECHNIQUES`): **cuivre exists only MIDI 60–67**.
Out-of-range asks go through the existing `feasibleTechnique()` — which
resolves a low cuivre to **fortepiano** (nearest range, same `fixed`
durClass) — and carry the existing `RANGE` flag. Musically the right
degradation: fp is the brassy accent available across 30–65. The panel shows
the substitution count; the G5 battery hears it.

### 5.4 Noise layer — spare players, simultaneous stack

`attack.noise = { technique, voices: N, midi: […] | "chord-top" | "chord",
len }` — N additional players from the lanes the morph does **not** occupy
hit one-shots (or a short sustain) at the gesture onset, simultaneous with
the entering morph voices. This is the true *"add some cuivre whether it's
in the chord or not"*: the AI writing the params picks pitches freely —
e.g. chord tones folded into cuivre's 60–67 octave — because a data
computation at param-writing time beats an engine feature (the conversational
mode makes the AI the octave-folder).

- **Spare lanes only, never double-booked** (2r's philosophy). If the morph
  uses all ten lanes, the noise layer renders nothing and a warning names the
  shortfall (`NOISE: wanted 2 voices, 0 spare lanes`) — never silent, never
  stolen from the morph.
- Noise notes are ordinary render notes on their own lanes: they flow
  through `toScoreObjects`, insert, audit and playback like everything else.

### 5.5 Motion — the morph technology inside the windows

The composer's ask: the envelope parts themselves are *dynamic* — spectrum
assembling on the way in, beating dissolving on the way out, glissando
tails.

`motion` = an additive cents deviation applied inside a window, with **the
structural invariant: zero at the window's inner edge** — an attack motion
decays to 0 by `attack.len`; a release motion grows from 0 at
`span − release.len`. Continuity with the body is therefore guaranteed *by
construction*: there is no handoff to verify, ever.

- Attack types: **`converge`** (voices enter scattered ± `cents` and focus
  into the body's start — M3's fan math run backwards; the spectrum-assembly
  entry) · **`gliss-in`** (all enter offset by signed `cents`, sliding in) ·
  `none`.
- Release types: **`disperse`** (M1's detune opening as it fades — beating
  *out*) · **`to-unison`** (pairs close as they fade — beating resolving) ·
  **`gliss-out`** (signed cents tail) · `none`.
- Deviations ride through the existing adaptive-resolution bend sampling and
  the GLISS/REKEY machinery — wide motions get the segmented re-key the
  composer has already heard as seamless (D26). No new pitch code paths.

**Why not full phase-chaining** (attack as its own independent morph with
its own model): continuity would become a checked property instead of a
structural one, and it doubles the surface. It is also already achievable
today by generating two morphs and inserting them butted together. If a
chained single-object gesture is ever wanted, that is the named v2 landing
spot — do not half-build it here.

**Answer to the composer's ADSR-as-a-model question, recorded:** the
envelope does NOT become a seventh model. The architecture's virtue is
orthogonality — morph (WHAT changes) ⊥ carrier (WHEN voices sound) ⊥ shape
(the gesture's macro-form) — which is exactly what lets any shape compose
with any model. The *spirit* of the question (attacks with a quality of
change over time, own dials) is served by motion + layers + curves, and by
2y recipes over `shape.*` paths.

---

## 6 · Flags & checks — keep them meaningful

- **SEAM exemption:** the cross-onset SEAM check (soft) already exempts
  `striation === 'aligned'`; extend it to onsets inside an attack window
  with `entry: "together"` (and to noise-layer onsets). Aligned onsets are
  *the point* of those; a designed attack that throws 10 SEAM flags every
  render trains the composer to ignore flags — worse than no check.
- Per-voice OVERLAP (hard) and RATE (soft) untouched; the transient's
  sample-length spacing (§5.3) must land clean against them in every test
  fixture.
- New soft flags: `EDGE_RING` (one-shot outlasts its window) ·
  `SHAPE_CLAMP` (A+D+R clamped to span). New warnings (not flags): noise
  lane shortfall · default decay applied · `SHAPE_OVER_M4` (edge technique
  overriding M4's path inside a window — visible, not silent).

---

## 7 · Panel + conversational layer

- **Panel** (`morph_panel.js`): a "Shape" group — attack `len / entry /
  order / curve / from / peak / technique / transient / noise / motion`,
  decay `len`, release `len / exit / order / curve / to / motion / dropout`.
  All default "off" (absent block). Read-and-nudge fields, regenerate on
  change, same as the existing dials. `preflight()` untouched (no new host
  seams).
- **The primary interface is narration** (composer, day 11: *"for the first
  few attacks, I'll just narrate, and we'll build the vocabulary"*). The AI
  writes `shape` blocks into `bank/morph_params.json` variants; the
  vocabulary below is a **starting** map, expected to grow from the
  narrated sessions and be harvested into 2y recipes/presets (D6):
  - *"give it a real attack / harder"* → `from`↓ `curve sudden` `len`↓
  - *"hit it and settle"* → `peak` 1.3–1.6 + `decay`
  - *"stack the attack / double it"* → `transient staccato` (hit-then-tone)
    or `noise` (simultaneous, spare players)
  - *"brassy / noisy start"* → `noise cuivre` (60–67, AI folds pitches) or
    edge `technique` flz / play_sing_ks
  - *"assemble out of the air"* → `entry ramp` + `motion converge` + `from 0`
  - *"let it fall apart / dissolve"* → `release motion disperse` +
    `dropout` + `curve expo`
  - *"tongue-stop"* → `release {exit together, curve sudden}`
  - *"thin out but keep the beating"* → `dropout` (cluster-safe by
    construction)

---

## 8 · What already exists that this must NOT duplicate

- The D24 dynamics layer — shaping multiplies it, never replaces it.
- Striation / stagger machinery — entry modes reuse `striationPhase` /
  `staggerOrder`.
- Breath, fixed lengths, feasibility, SWITCH, GLISS/REKEY — routed through.
- `reduceSource`'s cluster logic — reused for dropout selection.
- The Roads envelope catalog (4e) — curve names echo it; do not port the
  8-shape catalog without a musical need (NITS if tempting).
- Insert/drag/scale/save-reload — inherited via note-relative envelopes;
  re-verified once in G5, not re-implemented.

---

## 9 · Build order & phase gates

Each gate = run `node tools/test_morph.js` (all assertions green, including
the new ones named), plus the listed checks. Claims of "works" come from
running, not reading (AI_METHODOLOGY rule 4).

**G0 — contracts + regression floor** *(no behaviour change)*
- Fixtures: render all six `bank/morph_recipes.json` recipes + all
  `morph_params.json` variants; store note-array hashes in the test file.
- `shape`/`lanes`/`voices` into `KNOWN_KEYS`; shape sub-key validation.
- **Accept:** existing 101 assertions green; fixtures byte-identical.

**G1 — gain ADSR**
- `g(t)` incl. peak/decay; curves pinned at window edges + midpoints.
- **Accept:** `{from:1, peak:1, to:1}` ≡ no shape (byte-identical);
  default-decay warning fires when `peak>1` with no decay block; fixtures
  unchanged.

**G2 — scheduling**
- Entry modes + order · exits + `endT` · dropout (cluster-safe) · SEAM
  exemption.
- **Accept:** measured onset distributions per mode (together: all 0;
  ramp: even spacing in order; striated: window-scaled) · dropout never
  splits a near-unison cluster (explicit assertion) · zero spurious SEAM on
  together · fixtures unchanged.

**G3 — edge articulation + noise**
- Window technique override · transient prepend with sample-length spacing ·
  noise layer on spare lanes.
- **Accept:** cuivre@45 → fortepiano + RANGE (assert the actual fallback) ·
  transient spacing clears OVERLAP/RATE in fixtures · noise shortfall warns
  and renders without it · fixtures unchanged.

**G4 — motion**
- converge / gliss-in / disperse / to-unison / gliss-out.
- **Accept:** deviation is 0 at every window's inner edge (assert at the
  breakpoint level) · a ±300 ¢ motion produces REKEY splits via the existing
  machinery · fixtures unchanged.

**G5 — panel + app verification + LISTENING CHECK-IN** *(the musical gate)*
- Panel group, vocabulary, then in the running app (scratch session, never a
  `piece-*` file; CTRL+S first):
  1. insert a shaped morph → drag → group-scale ×0.75 → save → reload:
     `morphBend` + levels byte-identical through the round trip (2v's
     Phase-4 gate, on shaped material).
  2. **Listening battery** (panel variants, the established loop):
     C (BEATING BLOOM) plain **vs** + staccato transient **vs** + cuivre
     noise layer · a peak+decay "hit and settle" · release: plain taper vs
     dropout vs motion disperse · one `sudden` tongue-stop · **B re-heard**
     (the ramp-INTO-technique fix from day 10, never re-auditioned — the
     edge-technique mechanism leans on the same instinct, so this validates
     both).
- **Accept:** composer verdicts recorded (RUNNING_LOG + `_auditionNotes`);
  keeper shapes noted for 2y's preset library.

---

## 10 · Failure modes → mitigations

| # | failure | mitigation |
|---|---|---|
| 1 | Shaping drifts the already-blessed recipes | G0 fixtures; absent `shape` ⇒ byte-identical is a standing assertion |
| 2 | Transient expected to give hit-AND-tone from one player | physics stated in §5.3; the sequential spacing is by design; simultaneous = noise layer |
| 3 | Cuivre asked below MIDI 60 | known fp fallback + RANGE flag; heard in G5 before it surprises anyone |
| 4 | Noise layer with no spare lanes | renders without it + named warning; never steals a morph lane, never silent |
| 5 | Dropout kills half a unison pair (beating dies wrongly) | cluster-safe selection via `reduceSource` logic; explicit G2 assertion |
| 6 | Designed attack drowns in SEAM flags | together/noise exemption, §6 |
| 7 | Release fights breath (window > maxBreath) | body machinery splits; re-entry under falling g(t) is the correct sound |
| 8 | Motion breaks continuity with the body | impossible by construction — zero at inner edge is structural, asserted anyway |
| 9 | Drag/scale detaches the shape | nothing absolute is added; G5 app round-trip proves it |
| 10 | `to: 0` "isn't silent" | the 0.4 level floor, §5.1 — same as every drawn decrescendo |
| 11 | M4 + edge technique fight | window wins + `SHAPE_OVER_M4` warning |
| 12 | Concurrent agents collide in shared files | header rule; declare ownership first |

**Residual risk, stated plainly (rule 4):** the mechanics above are all
testable and tested. The genuinely open musical questions: (1) does a
designed attack read as *the gesture's* attack rather than "some players did
something at the start" — G5 exists to answer it; (2) the transient's
hit-then-tone spacing (~0.5 s for staccato) may read as two events rather
than one attack — if so, the noise layer is the alternative and the
transient stays as a different colour; (3) cuivre note-off behaviour is
still 2o's open question — if a cuivre edge rings past a `sudden` cut,
that is the moment 2o's 60-second probe finally runs. None of these can
block the build; all are listening outcomes.

---

## 11 · ENVIRONMENT FACTS (for the implementing model — read before coding)

Hard-won on day 10; do not rediscover:

1. **No `package.json`, no `node_modules`, no node MIDI binding.** Plain
   `node` runs the tools (`node tools/test_morph.js`). Anything that must
   SOUND goes through the browser panel (Web MIDI, needs a user gesture,
   permanently denied in preview panes — the composer's own browser has it)
   or a `.mid` file into Reaper. Never write a node script that opens MIDI.
2. **PowerShell scripts invoked as `.ps1` files get refused by the
   permission layer; inline PowerShell runs.** (You should not need either —
   this plan is engine + panel only.)
3. **`const Composer` is a lexical global, not `window.Composer`.** Use the
   `HOST()` accessor pattern already in the morph files.
4. **Markers belong in `objects`, never `data.markers`** (Principle 4 —
   markers in `markers` survive save/load and are never drawn).
5. **Autosave writes every 5 s.** Test in a scratch session (`untitled`),
   never a `piece-*` file; CTRL+S before experimenting on any non-piece
   score (that is what creates a Restore snapshot).
6. **Server:** `node score/server.js` → `:5200/composer.html`. One server;
   never start a second.
7. **Git:** stage explicit paths only (never `git add -A`); push after each
   commit (D30). Another agent may share this tree.
8. **House IDs used above:** D9 (only ORD is a real duration — one-shots
   take their sample length) · D16 (never refuse, never silently drop —
   flag) · D17 (HARD = physics, SOFT = estimate; a wrong estimate may only
   mis-tint) · D24 (dynamics is a layer on every model) · D26 (bend limit is
   an implementation detail — segmented re-key) · 2r (the app's
   conflict/occupancy machinery). Full text: `docs/PROJECT_JOURNAL.md` §4.

---

## 12 · Worked example (the target of the whole plan)

*"Take BEATING BLOOM, hit it hard and brassy, let it settle, bloom, then let
it fall apart as it fades — low voices last."*

```json
{
  "model": "M1",
  "source": { "kind": "pitches", "midi": [41, 41, 46, 46, 51, 51, 56, 56] },
  "target": { "cents": 25, "direction": "alternate" },
  "dials": { "bias": 0.3, "spread": 0.35, "depth": 1 },
  "carrier": { "span": 40, "segLen": 8, "segVar": 0.3, "striation": "staggered" },
  "dyn": { "base": 0.5, "shape": "swell", "amount": 0.42, "spread": 0.55 },
  "seed": 11,
  "shape": {
    "attack": {
      "len": 1.5, "entry": "together", "curve": "sudden",
      "from": 0.85, "peak": 1.35,
      "noise": { "technique": "cuivre", "voices": 2, "midi": [63, 65], "len": 1.2 }
    },
    "decay": { "len": 3.0, "curve": "expo" },
    "release": {
      "len": 9.0, "exit": "staggered", "order": "high-first",
      "curve": "expo", "to": 0.0,
      "motion": { "type": "disperse", "cents": 30, "curve": "linear" },
      "dropout": { "fraction": 0.4 }
    }
  }
}
```

Expected render properties (G5 sanity list): 8 morph voices + 2 cuivre noise
notes on spare lanes at t≈0 · all sustains enter at t=0 under a gain rising
0.85→1.35 in 1.5 s, settling to 1 by 4.5 s · the bloom runs as ever · from
31 s voices leave high-first, ~3 of 8 abruptly (whole pairs), the rest
tapering with a growing detune · badge shows only the flags the design
predicts (no SEAM wall, any RANGE/EDGE_RING named).

---

## 13 · Boundary with 2y (MODEL ↔ ACTUAL)

- 2z ships the capability + dials; **2y ships the shape-preset library**
  (`bank/shape_presets.json` — named keeper shapes, applicable to any model,
  filed by the AI from the narrated sessions per the TAXONOMY contract) and
  recipes that patch `shape.*` paths ("harder attack", "dissolve more").
- Until 2y lands, keeper shapes live where everything lives today:
  `bank/morph_params.json` variants + verdicts in `_auditionNotes` /
  RUNNING_LOG. Nothing is lost; 2y's MA0 migrates them.

## 14 · Implementer rules

1. `node tools/test_morph.js` before touching anything and after every
   change. The fixtures are the contract with the composer's blessed
   material.
2. One code path per element. If you are writing
   `if (shape) { new } else { old }`, stop — the default must BE the legacy
   values flowing through the new code (§5.2).
3. Never shorten, never refuse, never silently drop — flag or warn (D16).
4. The engine stays pure; nothing in this plan needs DOM/MIDI/fetch beyond
   the existing panel row.
5. Verify in the running app before reporting (rule 4); scratch sessions
   only.
6. Where this plan and the code disagree, **the code's measured constants
   win** — then update this plan, so the next reader inherits the truth.

---

## 15 · BUILT — where the code corrected the plan (2026-08-16)

> Implementer rule 6: where this plan and the code disagreed, the code's measured
> behaviour won and the truth is recorded here. All gates G0–G5 built; **G5's
> listening is the only part still owed, and it is the composer's.**
> 297 assertions green (101 inherited + 196 new).

**Constants the plan left to the implementation**

- **`expo` is EASE-OUT, exponent 1/2.2** (`curveEase`). Reasoning worth keeping:
  level is the score's 0–10 drawn height, which maps to CC7 across a 40 dB span,
  so level-space is already roughly dB-space and a *linear* g(t) is already an
  exponential amplitude envelope. `expo` therefore has to be more front-loaded
  than linear to mean anything — as a release it is the expodec tail, as an
  attack the instrumental bloom that arrives then settles.
- **`sudden` holds the window's START value until the last 10 %, then moves** —
  exactly as §5.1 specified. As an attack curve that reads as a delayed slam, so
  it wants a short `attack.len`; the §7 vocabulary already says `len`↓.

**Behaviours the plan did not anticipate**

1. **Gain feeds back into breath.** `g(t)` shapes `level`, and `level` is what
   `maxBreath()` reads — so a quiet attack lengthens the segments under it,
   exactly as a quiet passage does for a real player. Correct physics, but it
   means a shape is not a pure level overlay: it can move segment boundaries.
   Pinned by assertion.
2. **An edge technique forces a segment boundary**, because a player cannot
   change technique mid-note. Implemented as a `boundaries` list in the carrier
   schedule (the same "split, never truncate" rule the breath ceiling uses), and
   only when `technique` is actually asked for. **Fixed one-shots are immune**
   (D9: the sample decides its length; it rings past and is flagged EDGE_RING).
3. **SWITCH fires on the RELEASE edge only.** The check is on switching *into* a
   technique that needs preparing, so a `play_sing_ks` release edge flags (the
   body hands over mid-gesture) and a `play_sing_ks` attack edge cannot — it is
   the first thing the player does and there is nothing to prepare from. §5.3
   predicted the flag but not its direction.
4. **Dropout UNDER-drops rather than over-drops.** Cluster safety binds first, so
   when cluster sizes do not divide the ask the achieved count is the largest
   whole-cluster set at or below `fraction` — thinning more than the composer
   said is the worse error. §12's "~3 of 8" is **2 of 8** (one whole pair) for
   `fraction: 0.4` on four pairs. Achieved set is reported in
   `meta.shape.dropped` and in the panel.
5. **§12's `noise.len: 1.2` is ignored, with a warning.** Cuivre is a fixed
   one-shot, so D9's sample length wins. `len` only applies to a sustain-class
   noise technique. The worked example is otherwise reproduced exactly.
6. **`SHAPE_CLAMP` has no note to live on** — it is a params-level condition. It
   is emitted as a warning *and* counted in `summary.soft` so it shows in the
   badge rather than scrolling away in the warning list.
7. **G1's "byte-identical" gate needed splitting.** A unit-gain shape
   (`from:1, peak:1, to:1`) reproduces the unshaped **levels** note for note —
   that is the real invariant and it is asserted. Full-render byte-identity
   against *no shape* does not hold in general, because a shape block also
   changes the entry (`together` is its default, day 11). The no-shape identity
   is what G0's twelve fixtures guard, and they are untouched.
8. **The SEAM exemption is scoped to the designed attack and no wider.** A
   lockstep carrier later in the span (`segVar: 0`, voices never de-phase) is a
   real ensemble seam and stays flagged. Both halves are asserted, because
   exempting too much is the same failure as flagging too much.

**Two pre-existing bugs found by building this, both fixed**

- **A 40-cent pitch error in the morph output.** `n.bend` is already
  key-relative; `toScoreObjects` and `morph_emit.js` added the residual again.
  `tools/morph_probe.js` and the unit test computed their expectations the same
  way, so the day-10 "0.4 ¢" result verified the MIDI-to-audio chain and could
  not have caught it. Fixed in all four; the convention is now asserted end to
  end. **Consequence: 2v material with off-key onsets plays differently from day
  10 — correctly, but differently.** Full write-up in `docs/NITS.md`.
- **The panel carried the previous variant's dials across a variant switch**,
  and it stuck. Variant N auditioned at A's span and A's seed. Every
  cross-variant comparison in the panel was of the wrong thing, day 10 included.
  Fields are now stamped `variant@rev`.

**Verified in the running app** (scratch session; the research scores were
checked byte-identical to HEAD afterwards): insert → drag +25 s → group-scale
×0.75 → save → reload leaves all 40 note objects identical in pitch, technique,
times, `morphBend` and level nodes; the two cuivre one-shots keep their sample
lengths through the scale while the sustains scale (D9); marker and META shape
are drawn (Principle 4); the Shape group renders 14 rows and 7 selects reading
from the params file.
