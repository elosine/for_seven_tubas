# bank/actuals/ — ACTUALs (PLAN 2y §5)

One file per actual: `ACT-<MODEL>-<NN>.json`.

An **ACTUAL** is *one decided render of a model* — concrete notes, envelopes and
lanes, stored with full provenance back to the model, recipe settings and seed
that made it, plus a `placements` log appended automatically whenever it is put
into a score.

Two arrays are stored on purpose:

- **`objects`** — score waveCurves, frozen. Insert uses these. A later engine
  change must never mutate a placed actual's identity.
- **`notes`** — the `render()` output that produced them. Audition uses these.

`toScoreObjects(notes) ≡ objects` is asserted at save and by the validator, so
what you hear and what you place cannot drift apart.

Hand-played / hand-built material (the DB3 lineage) stays in flat `bank/` as
plain gestures — an ACTUAL is specifically a decided render of a model. Both
kinds show up in `place_gesture.js --list`; `kind` distinguishes them.

    node tools/model_bank.js --list
    node tools/model_bank.js --validate
