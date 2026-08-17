# bank/texture_actuals/ — texture ACTUALs (PLAN 2x §12)

One file per actual: `ACT-<MODEL>-<NN>.json`, where `<MODEL>` is a texture model
from `bank/texture_models.json` (SMEAR · TICKS · RAIN · GALLOP · GROOVE, and
whatever the composer banks).

An **ACTUAL** is *one decided render of a texture model* — concrete score notes
with full provenance back to the model, spec and seed that produced them, plus a
`placements` log appended whenever it is put into a score.

    node tools/texture_bank.js --list
    node tools/texture_bank.js --validate
    node tools/place_texture.js --list

## Why this is not `bank/actuals/`

PLAN 2x §12 originally expected to share `bank/actuals/` with PLAN 2y under
distinct `ACT-` prefixes. That turned out not to be safe, and the reason is worth
keeping:

2y's `tools/model_bank.js --validate` walks **every** file in `bank/actuals/` and
requires each one to name a model present in `bank/morph_models.json` **and** to
satisfy `Morph.toScoreObjects(notes) === objects`. Both are morph-shaped by
design — that integrity check is the point of their store. A texture actual
satisfies neither, so filing one there would turn a shipped, currently-`VALID`
tool red over a file it was never written to describe.

So the two stores are **parallel**, exactly as §15.9 already requires for the
model stores themselves (`texture_models.json` vs `morph_models.json`). Nothing
in 2x ever writes a 2y file.

## Schema

Mirrors 2y's `ACTUAL_KEYS` key-for-key where the keys mean the same thing, so the
two stores can be merged later by whoever decides they should be:

`entity` · `kind` (`"texture-actual"`) · `label` · `tags` · `spanSec` · `parts` ·
`register` · `objects` · `provenance` · `placements`

**`notes` is deliberately absent.** A morph actual stores the render output
alongside the score objects because audition plays envelopes the objects do not
carry. A texture note *is* an ordinary score note — D29 means no bend and no
envelope — so `objects` is the whole truth, and a second array could only ever
drift from it.

## The integrity rule

`--validate` re-renders each actual's `provenance.spec` at its recorded seed and
asserts it reproduces the stored notes exactly (lanes, pitches, techniques,
onsets, durations, velocities). A model whose recorded parameters no longer
reproduce its own actual is recording a fiction — that is 2y's idea and it is the
reason provenance is worth storing at all.

## The robustness gate

A model cannot be banked without a robustness verdict, and an actual cannot be
made from a model that lacks one. The standing performance rule
(`docs/PHASE_SHIFTING.md` §6) is that no texture may depend on precise timing, so
a keeper has to be heard against the human-error pass (**H** in the Texture
panel) before it is filed. There is no `--force`: a model filed without a verdict
is one nobody checked, recorded as though somebody had.

`survives: null` is a legitimate and honest state — it means *not yet heard*, and
`--list` prints it as `UNHEARD`.
