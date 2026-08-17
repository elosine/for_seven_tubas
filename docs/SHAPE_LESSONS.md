# SHAPE LESSONS — the harvest from bespoke gesture shaping

> **What this is.** The composer's working mode from day 12 (2026-08-16): the
> gesture-shaping ENGINE (2z) is correct, but its shape *presets* did not work as
> sound models. So shapes get built **bespoke, one morph at a time**, tuned by ear
> until that gesture sounds right, saved, and used in the score. The lessons from
> each build accumulate here, and at some point they are what a revised engine
> gets rebuilt from.
>
> This is **D6** (the reverse-engineering approach governs the piece phase)
> applied to shaping: *"construct the piece shape by shape, adapting the machinery
> PER SHAPE until each sounds as intended; the accumulated per-shape adaptations
> inform the machine."* Generalisation is **harvested from the shapes, not imposed
> on them.**
>
> **The composer's instruction:** get the morphs into the score first. Do not stop
> to fix the engine. Document as we go.

---

## How to use this file

- **One section per bespoke shape**, in the order they were built.
- Each records: the morph · what the composer asked for **in their words** · what
  was dialled · **what was wrong when heard** · what fixed it · the
  generalisation candidate.
- **The "what was wrong" line is the valuable one.** A shape that worked first
  time teaches almost nothing; the correction is the data.
- A generalisation is only promoted to a *rule* once it has been asked for
  **twice** (2y §4's discipline — nothing speculative ships before that).
- AI files these unprompted, at the moment the verdict is spoken
  (`docs/TAXONOMY.md` contract). Ambiguity gets a `?`, never a question mid-flow.

**Where the shape itself lives, until 2y lands:** as a `shape` block on a variant
in `bank/morph_params.json`, with the verdict in `_auditionNotes` (2z §13).
Nothing is lost — 2y's MA0 migrates keepers into `bank/shape_presets.json`.

---

## Lesson 0 — the generic battery did not work as sound models

*(2026-08-16, day 12. The finding that started this file.)*

**What was built.** 2z shipped a full gesture ADSR with layers — gain curves,
entry/exit scheduling, edge technique, transient, noise layer, motion — and a
listening battery (variants G–N) that exercised each mechanism on BEATING BLOOM:
transient vs noise layer, hit-and-settle, three release treatments, a tongue-stop,
and the plan's worked example.

**Composer's verdict.** *"Those aren't really working as auditory models, as sound
models, but that's okay… So it's correct as an engine."*

**What that separates, and why it matters.** The mechanisms are individually
correct and tested — 297 assertions, and the app round-trip is verified. What
failed is the **mapping from a mechanism to a sound**: a designed attack built by
choosing plausible parameter values does not reliably produce a gesture that reads
as *that gesture's* attack. The dials are right; the *settings* were guesses.

**Consequence for method.** Preset shapes designed top-down are the wrong unit.
The unit is a **specific gesture, tuned by ear, kept**. That is what the rest of
this file records.

**Open — deliberately not diagnosed** (AI_METHODOLOGY rule 5: no clear evidence,
no diagnosis). We do NOT yet know *which* aspect failed — whether the timings were
wrong for a 40 s morph, whether the gain range is too narrow to read against the
D24 dynamics layer already swelling underneath, whether the attack windows were
too long or too short, or whether some mechanisms simply do not carry at ensemble
scale. **The bespoke builds are the evidence-gathering.** Each correction below
should say which of these it moved, so the pattern can be read later.

---

## Lesson 1 — a measurement is only evidence about the step it crosses

*(2026-08-16, day 12. Not a shaping lesson; a method lesson, banked here because
it is the reason a whole day's blessed verdicts are slightly suspect.)*

Two pre-existing bugs surfaced while building 2z, both in day-10's 2v code:

1. **Morph pitch was out by up to 40.2 cents** on any note whose onset sat off its
   played key. `n.bend` is already key-relative; `toScoreObjects` and
   `morph_emit.js` each added the residual a second time.
2. **The panel carried the previous variant's dials across a variant switch**, and
   it stuck — variant N auditioned at A's span and A's seed.

Neither was visible because **the checks were mirrors**: `tools/morph_probe.js`
computed its expected pitch with the same double-add as the engine, and the unit
test did likewise. The day-10 result *"spectral targets land within 0.4 ¢"* was a
true statement about the **MIDI→audio** chain that could say nothing about the
**engine→MIDI** step.

**The rule worth keeping:** where a convention is expressed in more than one
place, assert the two ends **against each other**, never each against a shared
formula. `test_morph.js` now pins `sounding cents === midi*100 + bend` in the
engine, in the score object, and in the emitted MIDI.

**Standing consequence:** the six blessed settings in `bank/morph_recipes.json`
were auditioned through both bugs. They are still good material — the composer
liked what they heard — but any *comparison* between them from day 10 was of the
wrong thing, and the pitches were slightly off. **Re-hear before enshrining.**

---

## Lesson 2 — *(next bespoke shape goes here)*

<!--
TEMPLATE — copy for each build.

**Morph:** which model / variant, and why this one.
**Composer asked for:** verbatim.
**Dialled:** the shape block that was tried.
**Heard:** what was actually wrong, in the composer's words.
**Fixed by:** the change that made it work.
**Which aspect moved:** timing | gain range | window length | layer choice |
  motion | interaction with the D24 dynamics layer | other.
**Generalisation candidate:** the rule this suggests — and whether it has now
  been asked for once or twice.
-->
