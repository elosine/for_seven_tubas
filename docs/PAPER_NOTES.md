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

## STANDING INSTRUCTION — capture salient talk as it happens (composer, 2026-08-18)

**The composer wants material for the paper harvested along the way, not
reconstructed afterwards.** Any AI working this repo should file a note here
when something said in session bears on the argument — a framing, a reversal, a
piece of evidence, a phrase worth quoting. Do it at the moment it is said; a
session ends and the wording is gone. `COMPOSER_LOG.md` keeps the verbatim
thinking; this file keeps what the *paper* needs and why it matters to the
argument.

---

## Day 18 (2026-08-18): the tool that worked was not a tool

**The strongest evidence so far, and it complicates the thesis in a useful way.**

Days 12-17 built bespoke machines: a pulse sequencer strip, panel snapshots, a
multitempo rig, a phase-shift selector. On day 18 the composer stopped using
them and said why:

> "my attempts to build tools like panels have turned out to be very labor
> intensive and aren't lending the results. So I'm going to stick with AI
> prompts and console scripts that I can paste in."

Read against the Kobayashi thesis, this is not a failure of the argument — it
sharpens it. **The bespoke frame need not be a piece of software.** What the
composer actually needed was not a panel but a way to say *"give me an accretion
from the bottom up, 4 to 7 repeats, 150"* and hear it ninety seconds later. The
frame that beat the received one was **conversational**, not instrumental. The
"tool" is a working relationship with a system that can build a throwaway
generator per request, and throw it away.

That gives the paper a sharper claim than "build your own tools": **build the
smallest thing that gets the material into your ears, and be willing for it to
be disposable.** A panel is a bet that you will want the same operation many
times. A console script is a bet that you will not. On this piece, the second
bet kept winning — and the pattern the composer *did* want permanently (insert a
sonority into a column) only became visible after a day of disposable versions.

**Second finding, on where verification effort belongs.** The composer drew an
explicit line: generating and mutating musical objects is trusted and should not
be re-checked, but the *presentation* of any label must be right first time,
because each slip costs a fresh script and another paste cycle —

> "then there's an hour of back and forth, and it's... ends up being a giant
> waste of time for something small but something I need."

The same day proved the split exactly. The note-generation was correct on the
first attempt; the column numbering was wrong in three independent ways
(invisible lane, overlapping labels, text over noteheads), none of which the
generator's own output would have revealed. **For the paper: in a
human-in-the-loop composing system, the expensive errors are not in the
algorithm, they are at the interface where the composer reads the result.**
Effort should be spent proportional to how the human perceives the output, not
to how complex the computation was.

---

## Day 18, later: the composer specifies a machine by talking (dictated session)

**This is the thesis happening in real time, and it should probably be the
paper's central worked example.** Over one afternoon the composer moved from
"the pulse panel isn't really working for me" to a complete four-layer generator
spec — without writing code, opening an editor, or building a UI. The spec now
lives at `docs/plans/TRANCE_GENERATOR.md`; what matters for the paper is *how it
got there*.

**The sequence.** He asked to hear things (accretions, burst patterns). He heard
them, adjusted in words ("four to seven repeats", "bottom to top", "same but
with the new base"). Somewhere in that loop the *material* stopped being the
subject and the *procedure* became the subject — he began describing not a
passage but the machine that would make passages. The generator was specified in
the vocabulary the auditioning had produced: "units", "species", "the accordion
thing", "run through it again like a tone row."

**The claim this supports:** a bespoke compositional frame need not be designed
in advance and then inhabited. It can be *discovered by auditioning* — the tool
and the material co-evolve, and the composer ends up holding a formal system he
did not set out to write. Kobayashi did not theorise the broken sausage; he
found it by eating.

**Two moments worth quoting in full.**

*On what the machine is for* — the composer distinguishing the artefact from the
apparatus, which is exactly the distinction the paper is about:

> "I don't necessarily wanna build the UI or whatever the engine, but I wanna
> have this pretty clearly documented so we can at some point. For this piece,
> I'm going to just have you generate several things using the machine as long
> as we understand what the machine is."

The machine exists as a shared understanding before it exists as software, and
that is sufficient to compose with. **The documentation IS the implementation**
for as long as an AI is willing to execute it by hand.

*On specifying by describing a problem rather than a mechanism* — he asked for a
"rotation period" to spread material around the ten players, then described what
he actually wanted:

> "it's to give... make sure that every player has enough space. that they're
> not having two rhythms in a row. So I don't know if you can put just a clamp
> on that. So it gives player one the next note, but if it's less than a minimum
> amount, then it tries to find another player to give it to."

That is a minimum-rest constraint, not a rotation, and it is both simpler and
better: rotation emerges from it as a by-product. **The composer's plain-language
statement of the problem contained a better algorithm than the technical term he
reached for first.** For the paper: in this way of working, the composer should
be encouraged to describe the musical requirement and let the system name the
mechanism, not the other way round.

**A methodological finding worth reporting.** The composer drew an explicit line
about where verification effort belongs — generating and mutating musical objects
is trusted and should not be re-checked, but the *presentation* of any label or
readout must be right first time, because each slip costs a fresh script and
another paste cycle. The same day proved the split: the note-generation was
correct on the first attempt, the column numbering was wrong in three
independent ways. **In a human-in-the-loop composing system the expensive errors
are not in the algorithm; they are at the interface where the composer reads the
result.** Effort should scale with how the human perceives the output, not with
how complex the computation was.

---

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
