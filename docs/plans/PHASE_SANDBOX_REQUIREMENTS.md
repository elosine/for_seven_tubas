# PHASE / TEXTURE SANDBOX — REQUIREMENTS (pre-plan)

> **What this is.** The composer will hand this to a stronger model to produce a
> full implementation plan. It is the *requirements and evidence* document, not
> the plan. Written 2026-08-16 at the end of the phase-shifting research arc
> (PLAN 2j), to be read cold.
>
> **Companion reading, in this order:** `docs/AI_METHODOLOGY.md` (governing) →
> this file → `docs/PHASE_SHIFTING.md` (the full research write-up) →
> `docs/RUNNING_LOG.md` (chronology, verbatim composer verdicts) →
> `tools/phase_shift.js` + `tools/pitch_beat.js` (the working generators).
>
> **Everything marked HEARD was judged by the composer's ear. Everything marked
> MEASURED was computed from the generated data or decoded from the MIDI file.
> Nothing else is established.**

---

## 1 · What the sandbox is for

The composer's words, 2026-08-16:

> *"The overall approach is to have a general sonic shape / change-over-time
> sense, and the dials that produce them, and then the ranges within those dials,
> and then how to tweak them… I want to isolate some sound categories and then
> isolate the dials, the factors that need to be adjusted, and then understand the
> range of those adjustments."*

> *"Generate examples with pockets of interesting sounds, clip those, and create
> shapes that will morph."*

So: **a surface where the composer dials a named texture, hears it immediately,
morphs it over time, and exports the keeper into the piece.** The controls must be
**sound-first** (name the texture) with the numeric dials underneath, not the
other way round.

**Deadline context:** the piece is due **Sept 4 2026** (Penn State, PLAN 4a). The
sandbox is in service of the piece, not the other way round (AI_METHODOLOGY).

---

## 2 · STATUS: are the experiments finished?

**Yes for mechanism discovery; no for combination.** Thirteen experiments
(`phase01`–`phase13`) established the families, the dials, the ceilings and the
laws. What is left is **combinations** — pitch, counterpoint, category morphs,
robustness — and those are exactly what a sandbox exists to explore. Continuing
as one-off scripts would be slower and would not accumulate.

**Recommendation: stop the script-based experiments, build the sandbox, and run
the remaining questions inside it.**

### The holes, ranked — the plan must make each of these reachable

| # | hole | why it matters | blocks the build? |
|---|---|---|---|
| 1 | **Pitch has never been introduced.** Every rhythmic experiment was ten players on a single C3. | The composer expects pitch to dissolve the accent artefacts, and the piece needs pitch sets. The *whole* rhythmic map was made at unison. | **No — but the sandbox must have a pitch layer from day one.** |
| 2 | **Counterpoint vs mass never tested.** Objective 2 of the original brief. | Past attempts blended; the segregation levers are known but untried (`PHASE_SHIFTING.md` §6). | No |
| 3 | **Category morphs never tested** (rain → gallop etc.). | This is what the piece actually needs. Only within-family sweeps have run. | No |
| 4 | **No robustness pass has ever been run.** | The standing performance rule says every keeper must survive human-scale timing error. Zero keepers have been checked. | No — but it must be a **first-class feature**, not an afterthought |
| 5 | **Note-off truncation still unknown** (2n/2o). | Sets the density ceiling constant. | No — it is one number |
| 6 | **Dynamics untouched in this arc.** Everything ran at one level; velocity-vs-CC7 (2q) is still open. | Loudness is a dial we have not used at all. | No |
| 7 | **`phase13` is unheard** — upper boundary of beating, ten-voice field, register law by ear. | 10 minutes of listening; do it before the plan freezes. | No |
| 8 | **Mock-up spatial bias never quantified.** | The render is coincident and sample-accurate; the hall is not. | No |

---

## 3 · THE MODEL — two families, and they do not behave alike

This is the central finding of the arc and the sandbox must be built on it.

### 3A · ARTICULATED family — staccato

HEARD: *"it's really the staccato patch that lends the articulation. Everything
else is smeared or blurry."*

Phase relationships between attacks read as **RHYTHM**. The category axis is
**regular ↔ irregular**, and the composer's names for it are:

| category | what it is | how to get it |
|---|---|---|
| **articulated smear** | dead even at max density; "approaching a sustained tone but you can still hear all the articulations" | scatter 0, 18–23 attacks/s |
| **ticks** | even but the attacks separate again | scatter 0, lower density |
| **rain** | irregular, non-repeating | jitter ±35–60 ms |
| **gallop** | a lopsided two-element figure | two voices at slightly different tempos, OR fixed scatter |
| **loop / groove** | a parseable repeating figure with accents | fixed scatter at LOW density |

### 3B · SMEARED family — ord, flz (and fortepiano under overlap)

Ten overlapping voices blur into a wash. **Timing-phase does NOTHING here** —
HEARD as *"everything sounds continuous, no swells at all."*

**The principle: onset phase only matters while onsets are audible events.** In a
wash each attack is masked by nine tones already sounding. This is a boundary, not
a tuning problem — do not let a plan re-litigate it.

**In this family, modulation must come from PITCH.**

### 3C · PITCH BEATING — the one fully predictive result

HEARD: asked 1 beat/sec, heard *"beats ~1hz"*. 2 and 4 Hz likewise.

```
beat rate (Hz) = |f1 − f2|
cents          = 1200 · log₂(1 + beat/f)
```

- **< ~1 Hz reads as FLANGER, not throb** (HEARD). Correct acoustics: partial *n*
  beats at *n·Δf*, so the fundamental crawls while the upper partials shimmer.
- **≥ ~1 Hz reads as BEATING** (HEARD).
- The two are **continuously connected by one bend ramp** — HEARD as
  *"flanger into beats to acceleration"*. **This is the working morph primitive.**

---

## 4 · THE DIALS, with measured ranges

### Articulated family

| dial | definition | range | notes |
|---|---|---|---|
| **density** | composite attacks/s = players × BPM/60 | **1 – 23/s** | ceiling MEASURED: 10 players ÷ 0.42 s staccato ring |
| **scatter** | *fixed* per-player offset, as a fraction of the cycle | 0 – 1 | **repeats every cycle → reads as a figure** |
| **jitter** | offset re-randomised *every attack* | 0 – ±60 ms | **never repeats → the rain mechanism** |
| **spread** | tempo difference between voices | 0 – ~6 BPM | 0 = static; sets the *rate of change* |
| **voices** | independent tempo groups | 1 – 10 | a voice is N players round-robin on one composite pulse |
| **articulation** | staccato / ord / flz / fp / cuivre | — | **decides which family you are in** |

Measured deviation-from-even (sd of inter-attack intervals) for calibration:
scatter 0 → 0.1 ms · 0.03 → 6.4 · 0.08 → 21.5 · 0.2 → 32.6 · 1.0 → 46.2.

### Pitch-beating family

| dial | definition | range |
|---|---|---|
| **beat rate** | Δf in Hz between two sustained tones | 0 – ~16 Hz at C3 (bend-limited) |
| **fan width** | cents spread across N voices | 0 – 199 cents (MEASURED bend limit; RPN is ignored so it cannot be widened) |
| **register** | see the law below | — |

---

## 5 · LAWS AND CEILINGS — physics, not preferences

1. **Density ceiling ≈ 23 attacks/s** (MEASURED). Ten players ÷ 0.42 s staccato
   ring. Tick→tone fusion wants ~50 ms (20/s), so staccato *just* reaches the
   boundary and cannot pass it.
2. **THE REGISTER LAW** (MEASURED, decoded from the file): a *fixed* cents
   detuning **doubles its beat rate per octave** — 13.19 c gives 0.50 Hz at C2,
   1.00 at C3, 2.00 at C4. **So detuning a chord uniformly stratifies it: the top
   shimmers, the bottom crawls.** A uniform beat rate needs different cents per
   register. Feeds PLAN 2l (spectral chords) directly.
3. **STAGE-WIDTH CEILING** (inferred from physics, not measured in a hall):
   343 m/s over ~10 m of stage = **~30 ms of arrival spread**, against a 55 ms
   grid at 18 attacks/s. **Dead-even smear is not reachable live.** The mock-up is
   coincident and sample-accurate, so it is systematically biased toward
   evenness *and* toward mass.
4. **Bend range ±199 cents**, linear, artefact-free across the whole range
   (MEASURED, 2v Phase 0). RPN 0 is ignored. Residue is real — always reset.
5. **ord masks staccato** at equal dynamic (HEARD). "Attacks on a bed" needs
   dynamic or registral separation, not layering.
6. **fortepiano under overlap loses its piano tail** and reads as attack-only
   (HEARD) — *"a sort of weird texture"*. A usable colour, found not designed.

---

## 6 · THE PERFORMANCE RULE — a constraint on the *research*, not just notation

Composer, standing instruction:

> *"It's not gonna work to give them very precise cents instructions… maybe the
> approach is graphic indicators that indicate a certain speed of beating and they
> can just estimate — as rapid as possible, to something that sounds like a
> triplet at 60 BPM. Almost like tempo markings."*

**No texture may depend on a precise beating rate or a precise interval in cents.**

- **Human timing error is mathematically the same operation as the jitter dial**,
  so the sandbox can model it directly. **Every keeper must be auditionable with
  human-scale error applied** — this is a required feature, not a nicety.
- **Prediction, untested: rain is robust and smear is fragile.** If human error
  behaves like jitter, the ensemble converts smear into rain for free.
- **Pitch beating INVERTS the worry.** A player cannot hit "+13 cents", but
  beating is **self-correcting** — they hear the beat and adjust until it is at
  the asked-for speed. *"Beat about twice a second"* is a real instruction.
  **Pitch beating is more performable than the timing version, not less.**

---

## 7 · SCOPE BOUNDARY — read this before planning anything

**A second agent is concurrently building the MORPHING CHORDS sandbox (PLAN 2v,
`docs/plans/MORPHING_CHORDS.md`), and it already owns most of the pitch domain.**
2v has, or is building: sustained-tone rendering, **pitch bend**, pitch sets from
`bank/`, per-voice dynamics contours, a carrier/striation layer, an AI-driven
params-file loop, and an insert path. Its model **M1 "detune bloom" is
dial-and-seed driven — i.e. it is exactly our pitch-beating bloom**, and **M3
"fan"** is the fanned detuning of `phase13`.

**Therefore the recommended split:**

| | owns |
|---|---|
| **2v morph sandbox** | SUSTAINED sonorities changing over time — pitch, timbre, dynamics. **All bend-based work, including pitch beating.** |
| **this sandbox** | **ATTACK FIELDS** — textures built from many discrete attacks: density · scatter · jitter · spread · voices · articulation. The articulated family. |

**Do not rebuild pitch beating.** Specify it as a *requirement on 2v's M1/M3*
(beat rate in Hz as the dial rather than raw cents, plus the register law) and
have this sandbox be able to **layer with** 2v's output rather than duplicate it.

**Files 2v owns — read freely, never write:** `score/public/morph.js`,
`tools/test_morph.js`, `probes/*`, `docs/plans/MORPHING_CHORDS.md`,
`docs/MORPH_FINDINGS.md`, and the morph panel inside `score/public/composer.html`.

---

## 8 · WHAT THE SANDBOX MUST DO

**R1 · Sound-first control surface.** The composer picks a **named category**
(smear / ticks / rain / gallop / loop) and the numeric dials follow. Numbers stay
visible and editable underneath — never hidden, never the primary interface.

**R2 · Static textures that hold.** Spread 0 must mean *nothing drifts* — a rain
that stays rain indefinitely. (This was the fix that made phase07 usable.)

**R3 · Morph between categories over time.** "Rain → gallop over 30 seconds."
Any dial must be automatable along a curve, not just set to a constant.

**R4 · Pitch layer.** Impose pitch sets over a texture, deliberately
*not* over-systematised — the composer's stated preference is
*"impose pitch sets and let the chips fall where they may."* Must reuse the
existing 15 named tonality sets + 33 VERT01 chords and the pooled/literal remap
already built in the cluster sandbox (PLAN 2u).

**R5 · Seed auditioning.** At ten voices a scatter/jitter setting is a **random
variable, not a texture** — different draws clump differently, which is where the
phantom "accents" came from. Stepping through seeds at one setting must be as
cheap as stepping through settings.

**R6 · Robustness pass.** One click: re-render the current texture with
human-scale timing error and A/B it. §6.

**R7 · Playability, always on.** Reuse `tools/audit_playability.js` /
`Composer.CONFLICT`. Variable-length notes must be clamped to the player's own
next attack (already implemented in `phase_shift.js`); fixed one-shots must never
be clamped and their overlaps must stay visible as real conflicts (D9).

**R8 · Export two ways.** (a) Score objects placeable in the piece via
`tools/bank_gesture.js` / `place_gesture.js` (D23: density builds enter by
placement script, not the Insertion strip). (b) **MIDI files** via
`tools/midi_out.js` for anything the composer app cannot render — currently
anything bend-dependent.

**R9 · Every experiment self-describing.** Composer's criticism, taken:
*"I don't have any insight into how the tests were constructed."* Every generated
score must carry, in its **first marker and in plain language**, what it is and
what would count as a result — not parameter names.

**R10 · Regeneration over clipping.** A liked pocket is re-generated from its
parameters, not cut out of a render, so it stays adjustable. Clipping
(`tools/extract_section.js`) is the fallback.

---

## 9 · WHAT ALREADY EXISTS AND SHOULD BE REUSED

- **`tools/phase_shift.js`** — working generator: two onset models (sweep / beat),
  hocketed voices, scatter, jitter, spread, per-voice articulation and note
  length, variable-length clamping, markers, MIDI export, named presets. **This is
  the engine; the sandbox is a surface over it.**
- **`tools/midi_out.js`** — SMF writer with pitch bend (verified by independent
  decode).
- **`tools/pitch_beat.js`** — the beating generator; likely folds into 2v.
- **`tools/audit_playability.js --parts`** — per-player report.
- **Cluster sandbox `/clusterview.html` (PLAN 2p)** — the UI precedent: lists +
  items (D14), non-destructive transforms (D13: *a transform never disables an
  interaction*), the tonality remap engine, in-app recording.
- **Score format** — waveCurve objects, `sonifyMode:'plain'`, markers **in
  `objects` and never in the `markers` array** (Principle 4 — they silently never
  render otherwise).
- **`bank/sample_lengths.json`** — measured one-shot lengths.

### Design principle the composer set for all sandboxes (2026-08-14)

> **UI only where interaction speed compounds** (browse/audition loops:
> arrow-through-and-listen). **AI prompts for one-off operations.** **Lean
> piece-specific over universal.**

---

## 10 · OPEN QUESTIONS THE PLAN SHOULD ACCOMMODATE (not resolve)

1. **The repetition/density crossover.** Repetition is strongly audible at
   8 attacks/s and barely audible at 18/s — presumably because the ear can no
   longer parse a figure. **Untested.** If true: *slow = groove, fast = texture*,
   crossover near 12–17/s.
2. **Two known confounds in our own method.** **Order effects** — the same
   setting got opposite verdicts in different positions in a battery. **Draw
   variance** — see R5. A/Bs must be back-to-back and seed-controlled.
3. **Does note-off truncate a staccato/cuivre sample?** Unknown; it sets the
   density ceiling.
4. **Velocity vs CC7** (PLAN 2q) — unresolved, and dynamics are untouched in this
   arc.
5. **Counterpoint levers**, in expected order of power: register separation ·
   articulation · non-simply-related rates · loudness · spatial position. The last
   is **unrenderable in the mock-up**, so counterpoint must not be settled on the
   render alone.
