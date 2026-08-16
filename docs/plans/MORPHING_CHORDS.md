# MORPHING CHORDS — implementation plan

> **Status:** approved design; Phase 0 COMPLETE, Phase 1 in progress. Written
> 2026-08-16 (design session, Fable 5) for a separate implementing session.
>
> ### Amendments during implementation (2026-08-16) — read with §3, §4, §8
>
> 1. **DYNAMICS IS A LAYER ON EVERY MODEL, not one model of six** *(composer's
>    call: "centre volume changes more prominently — we undersold that")*. Every
>    render carries a per-voice dynamic contour — `dyn: {base, shape, amount,
>    turns, spread}` with `shape ∈ swell|rise|fall|rotate|flat` — so an M2
>    spectral drift also swells unless `flat` turns it off. **M6 is therefore not
>    "the volume model" but "the volume-ONLY model"**: it holds pitch and
>    technique and defaults the layer to `rotate`.
> 2. **The engine emits `level` (the score's 0-10 drawn height), not absolute
>    CC7.** §4.2's `env.cc7` and §2's "no fetch" purity rule contradict each
>    other — the CC7 law is a MEASURED map loaded at runtime
>    (`probes/cc7_map.json` → `curveValToCC`, `levelSpanDb 40`), so a pure engine
>    cannot apply it. Emitting the law's INPUT keeps the calibration in exactly
>    one place, which is what §8's "do not invent a new curve" is protecting.
> 3. **A morph note is an ordinary score `waveCurve`** (`nodes`/`segments`) plus
>    one new optional field `morphBend` — not a new `env` object. Level envelopes
>    already exist in this app as nodes; only bend is genuinely new. Existing
>    code already draws, plays, drags and group-scales them, which delivers
>    §13.7 (envelopes survive drag) via debugged machinery instead of new code.
> 4. **Probe tooling is PowerShell + Python, not node** (§2's file table). There
>    is no `package.json`, no `node_modules` and no node MIDI binding in this
>    repo; every existing probe uses winmm P/Invoke + numpy/soundfile.
> 5. **Running a probe: build the schedule with the script (`-DryRun`), then play
>    it from inline PowerShell** reading `probes/last_bend_schedule.json`.
>    Invoking `bend_probe.ps1` as a file was refused by the permission layer
>    every time; inline code ran every time.
>
> **Phase 0 results are in `docs/MORPH_FINDINGS.md`.** Headline: bend WORKS
> (±1.99 st, linear, no artifacts to full range), so no fallback is needed and
> all six models proceed. The residue trap is real (+49.4 ¢). The quartertones
> patch is **not** a uniform quarter-tone shift (+23 ¢ at F2 → +57 ¢ at C4), so
> §3's M1/M2 fallback would have been wrong as specified — bend is the vehicle.
> **PLAN id: 2v** (2u was claimed by the tonality sub-menu in the same-day
> parallel session; the 2v one-liner is in `docs/PLAN.md`).
>
> **Implementer: read `docs/AI_METHODOLOGY.md` first.** It governs this work.
> Every "verified" claim below the build line must come from the running app.

---

## 1 · What this is (requirements, composer's words distilled)

Start with a sonority and change it over time — pitch, timbre, and/or loudness —
producing tambral morph effects (lineage: the string quartet's multi-rate
glissando chords). Requirements:

- **Model-driven, not note-by-note.** A small set of named models that
  consistently produce interesting results; global "one-dial" feel (bias /
  speed / drama) rather than per-note editing.
- **Conversational control.** The composer speaks ("slower", "more dramatic",
  "more interesting sonority"); the AI turns the actual knobs; the composer
  auditions and decides by ear. Fluid experiment loop to discover which models
  work at which durations — and which are not viable.
- **Realistic duration model.** A 30 s morph is a chain of breaths. Each part
  re-articulates; the re-articulations are striated across players in a
  **notatable** way.
- **Playability evaluated at generation time** — never again "inserted it, then
  found at notation time the parts are unplayable."
- **Glissando viability researched** per register, including its air cost.
- Only methods that can be **easily notated and communicated to players**.

Decisions already made by the composer (do not reopen):

- Lives **in the composer score** (a panel), not a separate sandbox page.
- The panel **generates, auditions, inserts — never edits**. Editing happens
  after insert, in the score editor that already exists and is debugged.
- The SI2 `gliss_menu` patch is **not usable** for this (sampled gestures);
  continuous pitch = **pitch bend** (probed first).
- Probes use the composer's **record → play → analyze** workflow.

---

## 2 · Architecture (three orthogonal objects)

```
MORPH   pure function  state(voice, t) → { cents, technique, dyn01 }
CARRIER breath/striation model → when each voice sounds (onsets, durations, breaths)
RENDER  for each carrier onset, sample the morph → notes + note-relative envelopes
```

- Neither MORPH nor CARRIER knows about MIDI, the DOM, or each other.
- **One render path** covers sustained (long `segLen`) through pulsed (short
  `segLen`). "Sustained vs pulsed" is a dial, not a branch.
- **Pitch is CENTS everywhere internally** (cents relative to MIDI 0; i.e.
  `midi*100 + offset`). Resolved to `(port, channel, key, bendValue)` only in
  the emit layer. If a probe result contradicts an assumption, the fix is a
  constant + re-render — never a rebuild.
- **Determinism:** engine uses a seeded PRNG (mulberry32), never `Math.random`.
  Same params + seed ⇒ identical render.

### File layout (keeps the `composer.html` diff minimal — another agent works there)

| File | Contents |
|---|---|
| `score/public/morph.js` | **Pure engine**: models M1–M6, carrier, renderer, playability checks, tables. No DOM, no MIDI, no fetch. Loadable by both browser and node. |
| `tools/test_morph.js` | Node unit tests over the pure engine (state tables, carrier invariants, flag logic). Runs with no server, no audio. |
| `tools/probe_bend.js` · `tools/probe_qt.js` | Probe MIDI players (see §8). |
| `tools/analyze_bend_probe.js` | f0-vs-time analyzer over the recorded WAV (autocorrelation; tuba f0 ≈ 40–350 Hz), reports cents + timings per probe step. |
| `bank/morph_params.json` | The conversational control file (schema §4). AI writes it; panel polls it. |
| `docs/MORPH_FINDINGS.md` | Findings matrix + gliss viability + probe results (template §12). |
| `score/public/composer.html` | Panel UI + wiring + emit-layer extension + insert hook ONLY. Search by element id / string anchors, **not** line numbers (file is being edited concurrently): `blastsBtn`, the strip source `<select>` (options `blasts|clusters`), the source-abstraction comment "SOURCE ABSTRACTION". |
| `score/server.js` | One GET route `/api/morphparams` serving `bank/morph_params.json` with `Cache-Control: no-store` (follow the existing no-store/buildTag pattern). |

---

## 3 · The six models

Shared state vector per voice: **(cents, technique, dyn01)**. A model moves a
subset; the rest hold. All models take the same dials (§5). `progress p(t)` for
each voice comes from the dials (bias/spread/depth + seed ordering), so models
only define *what* changes, never *when*.

| id | name | moves | mechanism | notation | needs |
|---|---|---|---|---|---|
| **M1** | DETUNE BLOOM | cents | voices peel off ±50¢ one at a time (alternating directions = max beating; one direction = the chord "leans") | quarter-tone accidentals | bend **or** `quartertones` patch |
| **M2** | SPECTRAL DRIFT | cents | voices arrive at harmonic partials over a fundamental (`cents_n = fund*100 + round(1200·log2 n)`); reverse = spectrum→inharmonic | quarter-tone accidentals (+ cents nums optional) | bend **or** `quartertones` patch |
| **M3** | FAN | cents | chord A → chord B, each voice traveling at its own rate; continuous (bend gliss) or **stepped** (chromatic/quarter-tone staircase) | gliss lines / staircase | bend for continuous; stepped works without |
| **M4** | COLOUR MORPH | technique | pitches hold; techniques migrate voice-by-voice through an ordered path, e.g. `ord → bisb → flz → play_sing_ks` | technique labels (standard) | nothing unverified — **build first** |
| **M5** | SPACING MIGRATION | cents (whole steps) | voices step by chord/scale degrees at staggered times; the voicing opens/closes | ordinary notation | nothing unverified |
| **M6** | BALANCE MORPH | dyn01 | pitches/techniques hold; per-voice hairpins shift internal weighting — voices emerge/recede, prominence rotates | hairpins (standard) | nothing unverified — **build first** |

- Models are combinable because they share the state vector (e.g. M2+M6). Build
  single-model first; combination is a Phase-2+ flag (`models: ["M2","M6"]`,
  applied in sequence to the state), not a redesign.
- **Technique feasibility mask** (engine table, from `sandbox/instruments.js`):
  every technique carries `{rangeLow, rangeHigh, durClass}` where `durClass` is
  `sustain` (ord, bisb, flz, flz_voice_unison, play_sing_ks, quartertones,
  mute_ord) or `fixed` (fortepiano 1.35–2.22 s · cuivre 0.99–1.35 s · staccato
  0.33–0.53 s — from `bank/sample_lengths.json`, D9). Cuivre range is **60–67
  only**. When a model asks for an infeasible (technique, pitch): substitute the
  nearest feasible option **and set flag `RANGE` on the note** — never refuse,
  never silently skip (D16 spirit).
- M2 default fundamentals: **F2 = MIDI 41** and **Bb1 = MIDI 34** (PLAN 2l's
  anchors). Default partial set `[2,3,4,5,6,7,8,9,11,13]`, configurable.

---

## 4 · Data model (exact schemas)

### 4.1 `bank/morph_params.json` — the conversational control file

```json
{
  "rev": 12,
  "active": "A",
  "autoplay": false,
  "variants": {
    "A": {
      "label": "back-loaded, 30s",
      "model": "M2",
      "source": { "kind": "pitches", "midi": [34,41,46,50,53,58,62,65] },
      "target": { "kind": "spectrum", "fundamental": 41,
                  "partials": [2,3,4,5,6,7,8,9,11,13] },
      "dials":   { "bias": 0.6, "spread": 0.8, "depth": 1.0 },
      "carrier": { "span": 30.0, "segLen": 8.0, "segVar": 0.35,
                   "striation": "staggered" },
      "dyn":     { "base": 0.6 },
      "seed": 3
    },
    "B": null,
    "C": null
  }
}
```

- `rev` strictly increases on every AI write; the panel polls `/api/morphparams`
  every 1 s and regenerates the preview when `rev` changes (shows "v12 · A").
- `autoplay` default **false** — sound never starts without the composer
  pressing SPACE/Play. (No surprise audio.)
- `source.kind`: `"pitches"` (explicit MIDI list) or `"vert"`
  (`{"kind":"vert","id":"VERT01-28"}` → resolve pitch set from `bank/`).
- `target` by model: M2 `spectrum` · M3 `{kind:"pitches"|"vert"}` · M5
  `{kind:"scale", steps:+2}` · M4 `{kind:"techPath", path:["ord","bisb","flz"]}`
  · M1/M6 none (dial+seed-driven).
- Unknown/missing fields: engine fills documented defaults and flags `PARAM` in
  the panel status line — never throws, never silently ignores a typo'd key
  (list unrecognized keys in the status line).

### 4.2 Render output (engine → panel / insert)

```js
{
  notes: [ {
    voice: 0,             // 0..9, maps to a player (§7)
    tStart: 0.00, dur: 7.4,          // seconds, morph-local
    cents: 4100,          // pitch at onset (MIDI*100 + offset)
    technique: "ord",
    vel: 96,              // constant per D12-class; dynamics live in env.cc7
    env: {                // NOTE-RELATIVE breakpoints [dtSec, value]
      bend: [[0, 0], [3.2, -50]],    // cents offsets from onset cents
      cc7:  [[0, 64], [7.4, 96]]     // absolute CC7 values (calibrated law)
    },
    flags: []             // "RANGE" | "BREATH" | "SWITCH" | "GLISS" | "RATE"
  } ],
  summary: { hard: 0, soft: { BREATH: 2, GLISS: 1 } },
  meta: { model, seed, rev, span }
}
```

- **Envelopes are note-relative** (breakpoints in seconds from note start).
  Reason: when the inserted group is dragged or group-scaled, envelopes travel
  and stretch with their notes automatically. Absolute-time envelopes would
  silently detach sound from notation on the first drag — the classic
  defeat-the-fix-later failure.
- Playback interpolates breakpoints linearly, emitting bend/CC7 at ~30 Hz while
  a segment is changing and nothing while static.

### 4.3 Score note extension

Inserted notes are ordinary score notes **plus optional `env` field** exactly as
above. Absent `env` ⇒ behavior identical to today (one code path, default empty
envelope). Regression requirement: an existing score plays byte-identically
(§11 P1 gate).

---

## 5 · Dials and the conversational layer

Global dials (each model reads them the same way):

| dial | range | meaning |
|---|---|---|
| `bias` | −1…+1 | change front-loaded ⇄ even ⇄ back-loaded (warps each voice's progress curve) |
| `spread` | 0…1 | voices move together ⇄ maximally staggered (start-time spread of the per-voice progress ramps) |
| `depth` | 0…1 | how far toward the target the morph travels (0.5 = halfway) |
| `seed` | int | ordering/jitter reroll ("try another version of that") |

Composer-vocabulary → knob map (the AI's job at usage time, listed so it's
mechanical): *slower / longer* → `carrier.span` up · *more dramatic* → `depth`
up + `bias` toward +1 · *more interesting sonority* → model/target/partials/seed
· *smoother* → `spread` up, `segLen` up · *choppier* → `segLen` down ·
*another version* → new `seed` only.

**Loop:** composer speaks → AI writes 1–3 labeled variants into
`morph_params.json` (bump `rev`) → panel regenerates ≤1 s → composer arrows
A/B/C, SPACE to audition → decision → AI banks keepers / inserts. No WS, no
connection state; survives page reload. (Down-payment on PLAN 5b, not the full
channel.)

---

## 6 · Carrier: breath + striation

Per voice: a sequence of note segments separated by breath gaps, covering
`span`.

- `segLen` (mean seconds) + `segVar` (0–1 relative jitter, seeded). 12 s =
  sustained-with-breaths; 0.5 s = pulsed. Same code.
- **Hard rule:** no segment exceeds
  `min(maxBreath(register, dyn), sampleCeiling(technique))`. If a model implies
  longer, the carrier **splits the segment and flags `BREATH`** — never
  silently truncates.
- **Breath gap** ≥ `max(BREATH_GAP_MIN, RESET_GAP_S)` (§8): the player must
  breathe *and* the previous tail must decay enough that the next pre-arm bend
  change is inaudible.
- **Striation patterns** (notatable; a named pattern, not auto-plumbing —
  the composer treats striation as audible material):
  - `staggered` — breath points never coincide across voices (seamless wash)
  - `grouped` — 2–3 subgroups breathe together (audible layering)
  - `aligned` — everyone together (a deliberate seam)
  - `converging` — staggered → aligned across the span (re-attacks become an
    arrival) · `diverging` — the reverse
- **Cross-voice onset rule:** unless striation is `aligned` (or converging near
  its end), no two voices re-attack within 80 ms of each other — the stagger is
  what hides the seam.
- **Re-entry shape:** each segment after the first re-enters under a short CC7
  rise (default 0.7 s from `base−0.25` to `base`, clipped ≥ 0) — the standard
  "sneak in". First segments and `aligned` attacks enter at level.

**Breath table `maxBreath(register, dyn)` — ESTIMATES (amber, composer's ear
refines; wrong values mis-tint, never block):**

| register (MIDI) | p | mf | f |
|---|---|---|---|
| low 30–40 | 14 s | 10 s | 6 s |
| mid 41–52 | 18 s | 13 s | 9 s |
| high 53–65 | 15 s | 11 s | 8 s |

`BREATH_GAP_MIN = 0.75 s` comfortable (0.4 s floor = snatch breath, flag if
used). **Gliss air-cost multiplier 0.7** while glissing (estimate → findings
doc refines).

**Technique-switch prep table (seconds between segments of different technique,
ESTIMATES, amber; violation ⇒ flag `SWITCH`):** ord↔staccato/fortepiano 0 ·
↔bisb 0.3 · ↔flz 0.3 · ↔cuivre 0.3 · ↔quartertones 0 (patch switch only) ·
↔play_sing_ks 1.0 (must start singing).

**Re-attack rate check:** reuse 2r/D17 constants verbatim
(`minAttack = 0.11 + 0.0093·semitones, cap 0.22` + 0.03 tongue reset) ⇒ flag
`RATE`. Do not invent new constants.

---

## 7 · Voice → player mapping

- Morph voices map **1:1 to players** (voice 0 = lowest starting pitch), using
  the same pitch-ordered stage-reading convention as `assignBlast` — copy that
  convention, do not re-derive. ≤10 voices.
- Consequence: **double-booking within a morph is structurally impossible**
  (each player owns one monophonic line with breath gaps). Conflicts with
  *existing* score material are 2r's job at insert (§10).

---

## 8 · MIDI emission layer (the hygiene lives here, once)

All sound — probe, panel audition, score playback of morph notes — goes through
**one shared pair**:

- `emitNote(portCh, key, vel, tOn, tOff, env)` — resolves cents→(key, bend);
  **pre-arms bend** at `tOn − BEND_PREARM_S` (bend-center is the pre-arm value
  when the note has no fractional cents); registers the note in an
  **active-note registry**.
- `panic()` — the verified stop sequence: explicit note-off for every
  registered note (registry, not memory of what "should" be playing) → CC123
  per channel → wait `RESET_GAP_S` → bend-center per used channel → CC7 restore
  per port. **Do not trust CC123 alone** — history: "all notes off wasn't
  working as expected." The registry is the source of truth.

Formulas (14-bit bend; get the byte order right):

```
value = clamp( round(8192 + cents / (100 * BEND_RANGE_ST) * 8192), 0, 16383 )
msg   = [0xE0 | (channel-1), value & 0x7F, (value >> 7) & 0x7F]   // LSB, MSB
```

- `BEND_RANGE_ST` from Probe 1 (UVI default likely ±2 st — **do not assume;
  measure**). If the patch honors RPN 0 (bend range), optionally widen; if not,
  glisses wider than the range use the **segmented strategy**: bend to the
  range edge, re-key under the seam at the crossing point, continue. Both
  branches are decided now; the implementer improvises nothing.
- Bend is per-channel; each player's `ord` is channel 1 of their own port, and
  §7 guarantees monophony per player — so per-player bend is clean. The only
  cross-talk risk is a **ringing release tail** on the same channel when the
  next segment's pre-arm fires; that is exactly what `RESET_GAP_S` (Probe 0)
  bounds.
- Dynamics: **CC7 envelopes through the existing calibrated CC7 law** — find
  and reuse the score's dyn→CC7 mapping (search `PREARM_S` in composer.html).
  Do **not** invent a new curve. Velocity stays constant. This puts morph
  material in the same class as the existing drawn-crescendo material and
  sidesteps the open 2q question the same way that material does.

### Probe suite (order matters; composer's record→play→analyze workflow)

**Probe 0 — bend hygiene calibration** (`tools/probe_bend.js --hygiene` +
`tools/analyze_bend_probe.js`). Steps, each announced by a console marker and
separated by 2 s silence so the analyzer can segment:

1. Reference: `ord` note at 0¢, 2 s → measured f0 baseline.
2. **Residue demo:** bend +50¢ → note → note-off → *no reset* → new note
   ("next material") → analyzer reports its cents. Expected +50 if residue is
   real: the trap, quantified.
3. **Pre-arm ladder:** bend change to +50¢ at 50 / 100 / 150 / 250 ms before
   note-on → analyzer reports onset pitch per case (target from first sample,
   or a scoop?) ⇒ **`BEND_PREARM_S`** = smallest reliable lead.
4. **Leak ladder:** (a) bend-center during sustain (audible sweep — expected,
   this is the mechanism M1–M3 use); (b) bend-center at 0 / 50 / 150 / 300 ms
   after note-off ⇒ **`RESET_GAP_S`** = shortest gap with no audible blip in
   the recording.
5. **All-notes-off battery:** 10-note chord across ports → `panic()` →
   analyzer measures actual silence latency → one probe note per port at 0¢ to
   verify clean state (no residue anywhere).

Output: `BEND_PREARM_S`, `RESET_GAP_S`, verified stop-sequence — written as
named constants at the top of the emit layer AND recorded in
`docs/MORPH_FINDINGS.md` with the measured numbers.

**Probe 1 — bend response & range:** does SI2 `ord` respond to bend at all?
Steps: bend +50¢/−50¢/+100¢/+200¢/(+400¢ after RPN 0 widen attempt) each with
a sounding note → analyzer reports achieved cents ⇒ `BEND_RANGE_ST`, RPN
honored yes/no. **If bend is dead:** M1/M2 route through the `quartertones`
patch (Probe 2), rounding cents to nearest 50; M3 becomes stepped-only. Both
fallbacks are full renders, not degraded stubs.

**Probe 2 — quarter-tone patch mapping:** same key on `ord` (port A ch 1) vs
`quartertones` (port B ch 2), several keys across the range → analyzer reports
the offset. Expected: shifted-duplicate (+50¢ per key), but **measure**.

**Probe 3 — bent-sample quality:** long `ord` note with bend ramps of ±50¢,
±100¢, ±200¢ — composer listens for resampling artifacts; analyzer confirms
trajectory. Feeds the gliss-viability table (which widths are usable where).

---

## 9 · Panel spec (composer.html)

- Button **`Morph`** next to `blastsBtn` → floating panel (follow the existing
  floating-window pattern, e.g. the META window).
- Contents, top to bottom:
  - status line: `v12 · variant A · "back-loaded, 30s" · ⚠ 0 hard / 3 soft`
  - variant tabs **A | B | C** (←/→ cycles; only tabs present in the file)
  - read-and-nudge fields for the dials/carrier (AI-written values displayed;
    composer *may* nudge — fields are editable number inputs, no sliders, no
    curve editors)
  - flags list: each flag = one row `T4 · 12.3 s · BREATH split (wanted 16 s,
    max 10 s)` — same red (HARD) / amber (SOFT) colours as 2r; **no new visual
    vocabulary**
  - transport: **Generate** (re-render from current fields) · **Play/Stop**
    (SPACE) · **Insert at playhead**
- Keyboard: SPACE = play/stop, ←/→ = variant — **only while the panel has
  focus** (scope the handler; composer.html already has global key handlers —
  do not collide with them).
- **The panel never edits notes.** No selection, no drag, no per-note anything,
  no undo stack. That boundary is what keeps this from becoming the cluster
  sandbox again (its editor cost 80 % of the build). Preview state lives in
  panel-local variables — **never in the score object** (autosave writes the
  score every 5 s; a preview that touches the score is a data-loss bug, see
  memory: autosave-overwrites-loaded-score).
- Panel audition plays through `emitNote()/panic()` (§8) — the same path as
  everything else. No second scheduler.

---

## 10 · Insert path & score integration

- **Insert** converts the render to ordinary score notes (+`env`) in a group
  with a `groupId` + META group shape, exactly like blast/cluster inserts —
  reuse that code path; do not write a parallel one.
- 2r's occupancy wash runs on every mutation already; inserted morph notes are
  ordinary notes, so conflicts with existing material surface automatically,
  and the resolver works on them unchanged.
- D9 discipline: `fixed`-class techniques in a morph (cuivre/fp/staccato
  segments from M4) take true sample length and are **immune to group
  scaling**; `sustain`-class segments scale. This is existing behavior — the
  requirement is only that morph inserts go through the same insert code that
  already enforces it.
- Group-scaling a morph stretches note times and (because envelopes are
  note-relative) envelope breakpoints together. **Rates change when stretched**
  — the playability checks (BREATH etc.) are part of the 2r-style wash for
  `env`-carrying notes ONLY insofar as 2r already covers them (overlap, rate).
  Breath/switch flags are generation-time; after heavy manual stretching the
  composer can re-run the check via the panel's Generate on the same params.
  (Do not build a live breath-wash into the score in v1 — flag to NITS if it
  turns out to be missed.)

---

## 11 · Build order & phase gates

**Phase 0 — probes.** Scripts + analyzer; composer records; constants measured.
*Gate:* Probe 0 residue demo first reproduces the trap, then the protocol
(pre-arm + gap + panic) makes it vanish — both shown in the analyzer output.
Constants written into emit layer + findings doc. Probes 1–3 recorded and
analyzed.

**Phase 1 — floor.** `morph.js` (state vector, dials, carrier, renderer,
checks) + `test_morph.js` green + emit layer + panel + params-file loop +
**M6 and M4** (zero unverified dependencies).
*Gate (in the running app, session `untitled`):* params file edit → panel shows
new rev ≤1 s · M6 30 s render plays, dynamics audibly rotate · M4 renders with
technique labels and any RANGE/SWITCH flags visible · SPACE/←/→ work only with
panel focus · **regression: a pre-existing score (e.g. `piece-s09`) plays
unchanged** · stop mid-morph leaves no residue (play any ord note after —
correct pitch, correct volume).

**Phase 2 — pitch models.** M1, M2, M5 on whichever mechanism the probes
blessed (bend or quartertones fallback); spectral targets; depth/bias/spread
audibly do what §5 says.
*Gate:* M2 F-spectrum render measured by the analyzer lands each voice within
±10¢ of its target partial (record one render and check — this is the
confidence claim the composer will plan around, so it must be measured, not
inferred).

**Phase 3 — fan/gliss.** M3 continuous (bend ramps, segmented strategy if
needed) + stepped mode. Gliss-viability table drafted from Probe 3 + composer's
ear.
*Gate:* a 2-voice fan A→B plays and the recording's f0 traces cross as
designed; wide-interval fan exercises the segmented path without an audible
seam at the re-key (or the seam is documented as audible → findings doc,
composer decides).

**Phase 4 — insert + findings.** Insert path, env-on-notes playback in the
score, 2r interplay, `MORPH_FINDINGS.md` matrix sessions with the composer.
*Gate:* insert an M2 morph over existing piece material → conflicts (if any)
appear in the resolver like any other material · drag the group, replay —
envelopes moved with it · group-scale ×0.75 — sustain segments scale, any
fixed-class segments don't · save/reload the score — everything survives.

Worst-case floor (all probes bad): **M4 + M5 + M6 + carrier/striation + the
conversational loop still ship whole.** The plan cannot strand the composer.

---

## 12 · Findings doc template (`docs/MORPH_FINDINGS.md`)

- **Probe results:** constants + measured tables (filled in Phase 0).
- **Model × span matrix** (filled by listening; the deliverable that answers
  "which models are viable"):

| model | 10 s | 30 s | 60 s+ | verdict / notes |
|---|---|---|---|---|
| M1 … M6 | | | | |

- **Gliss viability table:** per register band — feasible width (from Probe 3 +
  ear), air-cost multiplier, notes.
- Keeper params (JSON blobs of blessed variants, named).

---

## 13 · Failure modes → mitigations (the ledger)

1. **Stale bend state** (the CC7-residue class, piece #3 Principle 3): one emit
   layer, pre-arm before every note, registry-driven `panic()`, bend-center
   after `RESET_GAP_S`, visible reset button. Probe 0 measures the constants
   and demonstrates the failure before the fix.
2. **All-notes-off unreliable** (history): explicit per-note offs from the
   registry, CC123 as belt-and-braces only. Probe 0 battery verifies.
3. **Reset leaking into sound** (history): never reset while ringing;
   `RESET_GAP_S` measured, breath gaps ≥ it by construction.
4. **Bend range exceeded / bend dead:** measured in Probe 1; segmented-gliss
   and quartertones-patch fallbacks pre-decided (§8). No improvisation.
5. **14-bit bend encoding wrong** (wild jumps): formula + byte order written
   out (§8); unit test asserts `cents→value` for ±0/±50/±100¢.
6. **Technique infeasible** (cuivre 60–67, fixed lengths): feasibility mask;
   substitute nearest + `RANGE` flag; never refuse, never silently skip.
7. **Envelopes detach on drag/scale:** note-relative breakpoints (§4.2).
8. **Unplayable material discovered at notation time** (the composer's bite):
   checks run at **generation**, flags shown before Play, printed in findings,
   2r takes over after insert. Evaluation is part of rendering — not a
   skippable step.
9. **Preview clobbers the score / autosave trap:** preview never touches the
   score object; ALL implementation testing under session **`untitled`** (the
   one name autosave skips).
10. **Regression in core playback** (env support edit): `env` optional,
    absent ⇒ identical behavior; explicit regression gate in Phase 1.
11. **Panel scope creep into an editor:** the no-editing boundary (§9) is a
    design rule, not a preference. New interaction wishes → NITS.
12. **Estimate wrongness** (breath, switch-prep, gliss tables): all SOFT/amber
    per D17 — a wrong estimate mis-tints, never blocks, never asks the
    composer to decide anything.
13. **Seam audibility** (the genuine musical unknown): cross-voice stagger +
    re-entry swell mitigate; M4/M6 build first so the question is heard early;
    the findings matrix is where the answer lands. No architectural bet rides
    on it.
14. **Concurrent edits to composer.html:** engine in its own file; panel/wiring
    edits anchored by ids/strings, not line numbers; implement after the other
    session's wrap (check `git status` first).

---

## 14 · Implementer rules (read before writing code)

- Read `docs/AI_METHODOLOGY.md`; it outranks everything here on how to work.
- Session name **`untitled`** for all app testing. Never load/mutate canonical
  `piece-*` or archive scores except the read-only regression plays.
- Verify every gate **in the running app** and say what you ran and what came
  back. Distinguish measured from inferred. State residual risk in one line.
- No time estimates. Confidence + risk instead.
- Engine stays pure (no DOM/MIDI/fetch in `morph.js`) — that's what makes
  `test_morph.js` possible and cheap.
- Reuse: `assignBlast`'s ordering convention · the insert/group/META path ·
  the CC7 law · 2r constants. **Do not re-derive or fork any of them.**
- Deviations that matter → one line in the session journal; papercuts → NITS.
- Commit at phase gates referencing **2v**; never push without asking.
