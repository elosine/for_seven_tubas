# PAPER NOTES — the method behind *for seven tubas*

> Working notes toward the paper (PLAN §6 item 5: "paper FROM the piece").
> Composer's framing, 2026-08-14. Not a draft — a place to accumulate the
> argument and its evidence while the piece is being made.

## Title (tentative, composer 2026-08-14)

**Composition by Kobayashi**

Subtitle candidates (stored for later evaluation):

1. *Bespoke tools for sui generis musical materials*
2. *A hot-dog solution to writing for ten tubas*
3. *Reframing the material, not the craft*
4. *Sandboxes, sonic shapes, and deferred notation*
5. *Standing up instruments for ideas*
6. *A workflow for hearing your way into a piece*

## The thesis: a Kobayashi-inspired process

**The reference.** Takeru Kobayashi did not get better at eating hot dogs the
way the field ate hot dogs. He decomposed the received problem — bun and
sausage as one object, eaten as served — and rebuilt the method from its parts
(break the sausage, wet the bun, use the whole body). The record fell not to
more effort inside the old frame but to a *bespoke frame*.

**The compositional claim (composer's words, paraphrased):** a new piece can be
approached almost as a **sui generis** process. Not "inventing the art of
composition" — rather, that a composer may think about **musical materials in a
way unlike the traditional ways** — building a bespoke lens for this piece's materials
(a lens that may well *include* traditional thinking), and then build the tools
that make that lens workable.

**Why it is now possible.** Standing up a custom, bespoke apparatus for an
esoteric musical material used to cost more than the material was worth. That
cost has collapsed. The consequence is the method below.

## The method, in passes

1. **Conceive a material sui generis.** Take one material — a density buildup,
   an overlapping-crescendo pulse, a blast — and think about what it *is* and
   what its adjustable parameters are, without inheriting a notation-first or
   instrument-first frame.
2. **Stand up a sandbox for it.** A small bespoke tool that makes that material
   audible and its parameters adjustable in real time. The sandbox is where the
   material gets *defined*: what its dimensions are, which ones matter, where
   its perceptual limits sit. (Examples in this piece: the density/accelerando
   testbeds, the crescendo-chain solver, the blast sandbox.)
3. **Explore, refine, decide — and document the decisions.** The tool records
   what was auditioned and what was kept, so the compositional choices leave a
   trail rather than living only in the finished object.
4. **Produce concrete gestures.** Fix specific instances out of the parameter
   space — static objects, banked with provenance.
5. **Assemble.** Place gestures into a formal arrangement, fluidly: move them,
   stretch or compress their durations, revoice, substitute. The score at this
   stage is a **sonic shape**, not yet notation.
6. **A SEPARATE PASS: extract the performance score.** Only here do the
   instrumental considerations enter — range, playability, breath,
   re-articulation limits, part assignment — converting sonic shapes into
   performable notation. Deferring this pass is what lets stages 1–5 stay
   about sound.

*(Stage 6 is the architecture already committed to in PLAN §7: composer score →
notation score → performance score.)*

## On the use of AI — how to treat it in the paper

**Not the headline.** The paper is about the compositional method and the
music; AI is the reason the method is affordable, not the subject.

Two things the paper must do:

1. **Show what it enabled.** The fluidity — that a bespoke sandbox for an
   esoteric material can exist in an afternoon, that a parameter can be
   questioned and re-heard in minutes — is precisely what makes the
   Kobayashi-style reframing practical rather than theoretical. That is a claim
   about *method*, evidenced by the piece.
2. **Be transparent about the use.** Plainly state where AI was used (tool
   building, analysis of played takes, generation under composer-specified
   rules, documentation) and where the musical decisions were made (the
   composer's ear, at every juncture — every parameter in this piece was fixed
   by listening and choosing, not by a model's preference).

**A tension worth naming in the paper** (composer, 2026-08-14): between
building UI and simply prompting. UI rabbit-holes into contingencies that never
get used; pure prompting is too slow for the loops one hammers dozens of times a
minute. The working principle that emerged: **build interface only where
interaction speed compounds** (browse / audition / collect), prompt for
one-offs, and prefer piece-specific tools over universal machinery.

## Evidence available from this project

- Perceptual calibrations arrived at by listening, then encoded as rules
  (duration-category spacing; the sounding-count regimes; the
  peak-to-bed clarity margin that made crescendo-chain rises solvable).
- Played takes analyzed into models, models regenerated into siblings, siblings
  chosen or rejected by ear.
- A taxonomy that files decisions automatically so the record of *what was
  chosen and why* survives the making.
- The deferred-notation architecture (three scores).
- **A complete worked arc for one gesture, DB3** — see below. If the paper needs
  one example carried end to end with its data, this is it.

---

## CASE STUDY — DB3, one density buildup end to end (2026-08-16)

> Kept as the paper's worked example: the same gesture at every stage, with the
> measurement that forced each step. Every number here was produced by a tool in
> `tools/`, and the artefacts are committed, so the arc is reproducible rather
> than recalled. Method doc: `docs/DENSITY_PIPELINE.md`. Decisions: journal
> D19/D20/D21. All five stages are audible back to back in
> `scores/densBld03-take1-AB.json`.

**Why it is a good example for the thesis.** It is stage 1→6 of the method in one
sitting, and it is the first place where **stage 6 pushed back on stage 1–5**: the
sonic shape, conceived without instrumental constraint, turned out to demand
2.5× what the ensemble can do. The interesting part is that the resolution was
*not* "compose within the limit from the start" — it was to keep conceiving
freely and then build a tool that finds the nearest playable neighbour, which is
a different compositional relationship to constraint than either free writing or
idiomatic writing.

### The stages, with their evidence

| stage | artefact | what it is | the measurement that forced the next step |
|---|---|---|---|
| 1. played | `densBld03-take1.json` | 251 notes, 21.9 s, one part, hands on the keys | apex demands **54.5 attacks/s**; 10 tubas can render **~22/s** |
| 2. distributed | `…-unpacked.json` | all 251 notes over ten players | **134 hard conflicts** — complete but unplayable |
| 3. packed | `…-packed.json` | thinned to the ceiling | **160 notes, 0 hard, 0 soft**; 91 deleted, all in 20.0–23.1 s |
| 4. articulated | `…-fp.json` | fortepiano → staccato crossfade | **15 of 36** fp rolls denied by density, not by dice |
| 5. hand-shaped | section E of the arc | composer converts grains to long tones | — |

### Findings worth reporting

1. **The mock-up cannot reveal a double-booked player.** Technique = MIDI channel,
   so two overlapping notes on one player go out on two sampler channels and both
   sound cleanly. Playability here is not auditionable; it has to be computed.
   *(This is the strongest single argument in the piece for tools over ears — and
   it is narrow: it applies to assignment, not to any musical judgement.)*
2. **The apex was not a flurry, it was chords.** In 20–24 s, **108 notes fall in
   25 attack moments** (clumps up to 9 notes). The composer's own account — *"I'm
   just hitting all my hands on all the keys… some of those attacks are mistaken
   chords rather than just a flurry of attacks"* — turned a thinning problem into
   a spreading problem, and the tool was designed around the composer's model of
   their own gesture rather than around the data alone. **Journal D21.**
3. **Nudging does not buy density; it buys cleanliness.** Raising the displacement
   budget 60 ms → 400 ms recovers 8 notes. Raising it 0 → 60 ms removes **37 soft
   flags**. The composer predicted the first half of this before it was measured
   (*"at that density, if we just bunch things over, they just continue to run
   into each other"*). **D19.**
4. **A pitch-blind assignment writes unplayable parts that pass every playability
   check.** Before the leap term, one player was handed a 26-semitone jump in
   0.35 s while another sat in the same register; mean leap 7.9 st, 58 octave-plus
   leaps, no part with a tessitura. Adding leap to the tie-break: mean **3.1 st**,
   **11** octave-plus leaps — *and hard conflicts fell 154 → 135*, because
   pitch-clustered lanes pack better. Good part-writing and efficient packing
   turned out to be the same objective. **D20.**
5. **The articulation crossfade emerged from physics, not from the ramp.**
   Fortepiano is a fixed 1.35–2.22 s one-shot (D9), so converting a 0.45 s
   staccato triples-to-quintuples that player's occupancy. The probability ramp
   proposes; the density disposes. All 15 denials fell between 11.4 s and 16.0 s —
   the tool drew the crossfade where the music already had one.
6. **A measured constraint can encode the recording rather than the instrument.**
   The 0.33–0.53 s staccato figure is the *sample's* sounded length, decay and
   room included; the player stopped blowing long before. D17 had already made
   this correction for the soft tier and not the hard one. The pipeline is
   therefore conservative by construction — the apex genuinely exceeds ten players
   under any assumption (44 hard even at a 0.11 s floor), but the amount deleted
   is model-dependent, between roughly 30 and 91 notes. **Filed in NITS, not
   resolved** — an honest example of a limit the process can state but not yet
   settle.

### On the AI question specifically

The division of labour in this arc is unusually legible, which is why it is worth
printing:

- **The composer** played the gesture, named the failure they feared (*"the note
  pace was too rapid"*), proposed the max-density model that replaced the AI's
  first design, supplied the physical account of their own playing that fixed the
  thinning strategy, and predicted the nudge result correctly before measurement.
- **The AI** measured, built four tools, found the pitch-blind assignment defect,
  and reported one finding that undercut its own result (item 6).
- **The first AI proposal was worse than what replaced it** — prune-then-space
  kept 127 notes with 1 hard + 1 soft, against the composer's pack-to-ceiling at
  160 and 0/0. Worth printing precisely because it is not the expected direction.
