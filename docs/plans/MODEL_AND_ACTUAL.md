# MODEL → ACTUAL — storage, recall and insert (composer's concept, 2026-08-16)

> **Status: CONCEPT ONLY. Not planned, not built.** Captured verbatim-in-substance
> the day it was described, so that scoping it later starts from the composer's
> own framing rather than a reconstruction. The composer will scope and plan this;
> this file is the raw material, not the plan.
>
> Sibling of the other deferred item, GESTURE SHAPING (the "meta shape is the
> sound itself" idea — designed attack / body / release, parts filled in
> afterwards). Both are downstream of PLAN 2v finishing.

---

## The distinction the composer is drawing

> *"This is a little bit like virtual versus actual in Bergson. So we have the
> MODEL and various permutations, or ways to permute it, and then we have the
> decided-on, concrete, ACTUALIZED version."*

Two different kinds of thing, needing two different stores:

| | **MODEL** (virtual) | **ACTUAL** (actualized) |
|---|---|---|
| what it is | a sonority *plus its potential* | one decided, concrete sound object |
| example | "BEATING BLOOM" and everything it could become | the 34-note render at 40 s, 4 voices, seed 11, that went into the piece |
| identity | named, stable, reusable | named, fixed, insertable |
| contains | parameters, elements, recipes, limits | notes, envelopes, lanes, duration |

The composer's own example of a model: *"There's the reference — I guess that
was number two — and that has an identity."*

## What a MODEL carries

1. **The sonority itself** — the pitch material and which model/mechanism drives it.
2. **The elements present in it** — what is actually operating (beating pairs,
   swells, re-articulation rate, register).
3. **A slate of RECOMMENDED MORPHS with their BOUNDARIES.**
   > *"more rapid re-articulations, from once every second to once every seven
   > seconds, or whatever."*
4. **RECIPES — combinations of parameters collapsed into a single dial.**
   > *"a combination of parameters into a single dial, or several single dials,
   > that are the recommended changes for these… each recipe essentially is
   > paired down to one dial, in some ranges."*

So a model is not a preset. A preset is one point; **a model is a point plus the
directions worth travelling from it, and how far.** The recipes are the composer's
curated paths through a parameter space that is otherwise too large and too
fiddly to explore by typing numbers.

*Why the one-dial framing matters — the composer's stated working preference:*
> *"It's too fiddly to understand the range of numbers to put in, or how quickly
> or slowly to change things. The actual numbers make a lot of sense, but when we
> get into morphing them, I'm hoping AI can help. I can describe what I want more
> or less of, and then AI could dial those in."*

A recipe is the durable, reusable form of exactly that conversation.

## What the process must do

> *"I need a storage place for the model and all the parameters and the specs;
> and I need a storage place for all the actualized things, the sound objects,
> and a smart way to organize all that, and to be at the ready for composition.
> And then we'll need a tool or process that goes from virtual to actualized."*

The loop, in the composer's order:

1. **Choose a model.**
2. **Modify it with the dials** — by hand, or by describing it and having the AI
   turn the knobs.
3. **Listen to some variety.**
4. **Settle on a concrete version.**
5. **Store the actualized object**, organised and ready to place in the piece.

## What already exists that this should absorb, not duplicate

- **`bank/morph_params.json`** is a first sketch of the MODEL store — named
  variants with parameters, and an `_auditionNotes` field already accumulating
  verdicts. It has no recipes and no boundaries.
- **`bank/<ENTITY>.json` + `tools/bank_gesture.js` + `tools/place_gesture.js`**
  (PLAN 2w) is a working ACTUAL store: a finished orchestrated object, banked by
  name, recalled and placed anywhere. DB3 and DB3-m3F live there now.
- **`tools/extract_section.js`** already answers the composer's earlier ask —
  "take second 9 to second 15 and make it its own thing" — for any score.
- **`docs/TAXONOMY.md`** is the precedent for automatic filing: the AI files
  keepers without being asked.

So the ACTUAL half is largely built and proven. **The MODEL half — recipes,
boundaries, one-dial collapse — is the genuinely new work**, plus the organising
layer that makes both browsable at composition time.

## Open questions for scoping

- Where does this live — the composer score, a sandbox page, or files driven by
  prompts? (The standing principle: UI only where interaction speed compounds;
  prompts for one-offs.)
- Is a recipe a stored *function* over parameters, or a stored *set of endpoints*
  the AI interpolates between?
- Does an actualized object keep a link back to the model and dial positions that
  produced it? (Almost certainly yes — it is what makes a variant re-derivable.)
- How do models and actuals get organised for composition — by sonority, by
  gesture type, by section of the piece?
