# THE TRANCE GENERATOR — a recipe machine for the final section

> **Status: SPEC ONLY. Nothing is built.** Written 2026-08-18 (day 18) from the
> composer's dictation so the machine is not lost between sessions. For this
> piece the composer will ask the AI to run it by hand — see *Running it now*
> at the bottom. Formalising it into a workflow/UI is a later job.
>
> Companion reading: `docs/PLAN.md` 2aa (pulse strip) · 2ac (the MT rig this
> borrows its rhythm models from) · `tools/console/README.md` (the console-script
> rules) · `bank/blast_taxonomy.json` (the harmony source).

---

## What it makes

A **sound image**: a finite passage of staccato tuba attacks, generated from a
recipe, inserted into the score as ordinary `waveCurve` objects. Everything is
discrete — no crescendo, no accelerando, no continuous data. The score object is
the deliverable; the recipe is what gets kept.

Four layers combine over a given duration.

---

## Layer 1 · UNIT — the rhythm

A **unit** is the atom of this layer:

    unit = (MT ratio model, tempo)

The same model at a different tempo is a **different unit** — the pairing is the
thing, not the ratio alone. The composer finds units by ear in the `MT` panel:
choose a model, dial the tempo until the pattern moves at the right speed, keep
the pair. The library of units is supplied by the composer, not derived.

**Properties that fall out of the ratio maths** (BPM `B`, terms `r1..rn`,
`T = 60/B`):

| quantity | formula |
|---|---|
| realignment cycle | `C = T * r1 / gcd(terms)` |
| attacks per cycle, stream i | `ri / gcd` |
| step of stream i | `T * r1 / ri` |
| **rate of stream i** | **`B * ri / r1`** |

**Convention: put the LARGEST term first.** Then every other part is slower than
the reference, so **the BPM you dial is the fastest part in the group** — which
is exactly the ceiling check the composer asked for, free, with no display to
build. Terms are capped at 1–64, so `C` maxes at `64 * T` (25.6 s at 150 bpm,
38.4 s at 100, 64 s at 60).

**The one axis that matters here** is how tightly the terms are clustered:

- **spread terms** (`3:4:5:6`) → genuinely different tempi → polyrhythm, a
  gallop you can hear repeat, and density climbs fast
- **clustered terms** (`47:43:41:37`) → near-identical tempi sliding slowly
  against each other → phasing, long cycle, and **density stays flat** (~6
  onsets/s at 100 bpm with 4 parts, ~9 with 6) however long the cycle gets

That flatness is the point: length and complexity grow without the texture
thickening. Units auditioned as takes 09-23 in `bank/panel_snapshots.json`.

**Actualisation:** the unit loops. Given a duration, **index in at a random point
in the loop** and run forward. (Seeded — see below.)

---

## Layer 2 · HARMONY

Runs on **its own grid at its own BPM**, deliberately independent of the unit's
tempo. Two clocks. Chord changes may fall between attacks, and that is intended.

- **Hold length:** each harmony is held for a number of beats drawn from an
  **allowed set**. For this piece: `{1,2,3,4}`. The engine must take an arbitrary
  set — `{2,3}` or `{2,4,7}` are equally valid and the composer expects to vary it.
- **Source:** the `more chords` custom list in `bank/blast_taxonomy.json` —
  13 chord species, each with a plain and a cuivre staccato entry, pitch sets
  4–8 notes. **Staccato only.**
- **Selection is by SPECIES** (the chord family, e.g. `VERT01-18`), not by
  individual sonority id.

### Pitch selection strategy (pluggable)

The engine should treat this as a named strategy so others can be added. For
this piece, one strategy:

**`shuffled-bag` (tone-row-like)** — exhaust the whole set in random order before
anything repeats, then reshuffle and go again. Applied at two levels:

1. **which species comes next** — all 13 before any repeat
2. **how a species' pitches land on the parts** — every pitch of the chord is
   used before any is doubled; **if the chord has fewer pitches than there are
   parts, the remaining parts are filled by free random draw**

Strategies named as future options, not built: strict tone row exhausted *in
order* (no shuffle), and register-active variants.

---

## Layer 3 · CUIVRE — a rate on top, not a property of the harmony

Cuivre is **not** a plain-vs-cuivre toggle on the harmony. It is its own layer
that decides *when*; the harmony sounding at that moment decides *what is
available*.

- When a cuivre event fires, take the **cuivre version of the currently sounding
  species** and pick which note at random from that family's assigned cuivre
  pitches.
- **For this piece: a COUNT PER SEGMENT** — "four times in this excerpt", "twice".
  The passages are short enough that a probability rate would be too coarse.
- **For the engine:** a probability/rate should also be available, and an
  **"accordion"** — the rate (or the harmony hold length) expanding and
  contracting across a passage. *Open question, deliberately deferred:* whether
  any passage in this piece is long enough for an accordion to read. **Decide at
  actualisation time.**

**Open:** is the count per *ensemble* or per *part*? "Four cuivres in this
excerpt" is far sparser than four per part. Assume **per ensemble** until the
composer says otherwise.

---

## Layer 4 · PLAYER ASSIGNMENT — a minimum-rest constraint, not a rotation period

The composer first framed this as "rotate the sound image around the ten parts",
then described the actual requirement, which is different and simpler:

> make sure every player has enough space — that nobody gets two attacks too
> close together.

**The rule:**

    for each attack, in time order:
      candidates = players sorted by longest-silent first
      pick the first whose gap since its own last attack >= FLOOR
      if none qualifies, take the largest gap available AND report it

**`FLOOR = 0.45 s`** — the measured staccato sample length (`FIXED_TECHS`), so no
tuba re-attacks before its own previous note has stopped sounding.

**Why this instead of a rotation period:** rotation emerges from it (spatial
spread comes free, which was the secondary want); it needs no clock of its own;
it solves the real problem directly; and it fails *honestly* — when the music is
too dense to honour the floor it says so rather than silently crowding a player.

**It is comfortably satisfiable.** Measured across the audition units at 100 bpm
over 10 players: 0.58-0.95 attacks per player per second, i.e. **average gaps of
1.05-1.71 s against a 0.45 s floor**. The fallback should almost never fire.

**Prototype already exists:** `scores/tranceA001b.json` was made by exactly this
kind of pass — a finished score redealt across the ten players from a shuffled
deck, no player reappearing until the others had been used. It needs extending
from unison columns to non-unison chords, but it is not a blank page.

---

## Actualisation

Inputs: **a unit · a harmony grid + hold set · a cuivre count · a duration · a seed.**

1. enter the unit's loop at a random index
2. run forward for the duration, emitting attacks
3. the harmony layer, on its own grid, decides the pitch set in force at each moment
4. the cuivre layer overrides individual notes to the cuivre version
5. player assignment places every attack under the minimum-rest rule
6. emit `waveCurve` objects: flat nodes, `technique: 'staccato'` (or `'cuivre'`),
   `sonifyMode: 'plain'`, `recVel` from the sonority's `dyn`

**Seeded.** The same seed reproduces the object exactly.

### Nothing continuous is lost

Every decision lands in discrete per-note fields (`sonifyNote`, `technique`,
`recVel`, `startSeconds`, `endSeconds`). The `nodes` array *can* carry a
continuous envelope but here holds two flat points. Confirmed with the composer:
no crescendo, no accelerando, nothing that needs a curve. If dynamics ever
become continuous, `nodes` + `ord` is the existing path (see `applyPanelField`'s
staccato-grain -> long-tone conversion).

**Stamp the recipe into each note's `properties`** — unit, seed, harmony grid,
cuivre count. Costs nothing, rides along in the score JSON, and makes any
passage regenerable and explainable later without hunting for parameters.

---

## Running it now, for this piece

**AI-dictated workflow.** No UI, no engine. The composer names a unit, a harmony
grid, a cuivre count and a duration; the AI runs the recipe by hand and delivers
the passage — as a console script per `tools/console/README.md`, or written
straight to a score file. This document is what makes that repeatable and what a
cold implementer would build from.

## Open questions, none blocking

1. Cuivre count per ensemble or per part (assumed: ensemble)
2. Whether any passage is long enough for the accordion (decide at actualisation)
3. Whether a sound image, once made, is a fixed score object or a stored recipe
   re-actualisable at different durations — this decides whether the eventual
   machine writes notes or writes parameters
