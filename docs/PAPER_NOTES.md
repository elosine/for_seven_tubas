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

## Deferred notation is turning into a positive method, not a delay

Worth tracking for the paper: the piece has been composed for nineteen days
without a note of conventional notation, and on day 19 the composer began
specifying what the notation will have to DO — after the material exists, and
constrained by it. That is the "deferred notation" subtitle candidate becoming an
argument rather than a scheduling accident.

The specific move (PLAN M5): rather than choose between full metric notation
(tuplet gymnastics) and spatial/graphic layout (*"there is slippage there as
well… I do not think that is good enough either"*), he proposes a hybrid —
players find and beam their own groupings, a cluster becomes a bar or bars, a
**"gravitational conductor"** marks each bar start, the scrolling proportionate
display stays, and **a tempo is set per bar**.

**The point for the paper:** that hybrid is only available because of a
generative decision made hours earlier for reasons that looked unrelated. Day 19
`fixed-tempo` player assignment gives every performer ONE steady pulse for a
whole passage (verified to 0.094 ms against their own grid). Choose that in the
generator and single-tempo parts with rests become notatable; choose the free
assignment and no metric notation is possible at all. **The compositional system
and the notation are not sequential stages — a choice inside the generator
silently decides what can later be written down.** That is a stronger claim than
"build your own tools", and it is evidenced here.

---

## Notation as an empirical question about the material

A short thread worth following (PLAN M5, 2026-08-19). Faced with whether his
density-build apex can be notated simply, the composer did not reach for a
convention or a house style — he treated it as a measurable property of the
material and asked for experiments: *"these are the types of experiments we can
run... this is actually the type of thing I am going to want to be doing."*

And when the first measurement returned a flat no, the useful move was not to
accept the verdict but to **change the statistic**: stop asking "does this
section notate simply" and start asking "which CHUNKS of it do, and how much
coverage do they give" — a mixed strategy, tuplets permitted where needed. The
measurement becomes a classifier rather than a pass/fail.

**For the paper:** this is the same reversal as the rotation-period episode. The
composer restates the problem and the better method falls out of the restatement.
It also completes a triangle with the fixed-tempo finding — notatability is a
property the generator confers, measurable after the fact, and negotiable by
changing either the material or the notational device. Notation is neither a
downstream formatting stage nor a fixed constraint; it is a third term in the
system.

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

## THE NOTATION ARCHITECTURE — the strip, the compiler, and a three-piece convergence (2026-08-19)

*This may be a paper of its own: the same composer building the same idea three
times, and what survived each realization.*

- **The composer's formulation, quotable as dictated:** the composition is
  *"really data through time"*; each part *"like a Turing machine strip"*, all
  strips *"share a timecode and are locked to it"*; the forms of the piece are
  *"one rich data source in time with different manifestations but same
  identity"*; and the strip is *"a ticker tape and you can slice it up in any
  chunks"* — so pagination (paper sizes, screen widths) is a property of the
  VIEW, not of the notation.
- **The lineage argument.** Piece #1 fused authoring and performance in one
  artifact and paid for it in piece #2, which had to derive its performance
  score by subtraction (~30 patches). Piece #2 separated source from
  manifestation and built a 7-stage per-object compiler with provenance — and
  its hardest-won lessons were about *decisions*, not rendering: store decisions
  as rules, not baked output; attach them to the reusable model, not the
  instance. Piece #4 states the principle the first two were groping toward
  ("same identity") *before* building. The narrative is a monotone: each piece
  moves the boundary between data and rendering one layer deeper.
- **The metaphor pair worth printing.** The Turing strip is the right model of
  the DATA (time-locked, parallel, sliceable); the compiler is the right model
  of the PROCESS (manifestation = compilation passes over the strip, with an
  intermediate representation, caching, and source maps back to the composition
  = piece #2's provenance blocks). Neither metaphor alone survives contact with
  engraving.
- **The convergence nobody planned:** the tape cannot be cut mid-beam or
  mid-tie — notation is non-local — so arbitrary slicing needs preferred cut
  points. Those are exactly M5's *"grouping that behaves together"*, arrived at
  the same week from the opposite direction (performability, not pagination).
  **The M5 chunk is the atom of the strip.** When one unit answers two
  independent problems, it is probably the right unit — a design-validity
  heuristic the paper can state generally.
- **Mandates as architecture.** M1 (on-the-fly part multiplication) and M2
  (family adaptation) — written as *performance* wishes on 2026-08-10 — turn
  out to be the strongest *data* constraint in the system: transposition at
  rehearsal time is impossible against rendered glyphs, so the notation layer
  is forced to be semantic data rendered late. An instance of a general claim:
  in this practice, performance-facing wishes legislate the data model.
- **"Accommodation strategies" (composer's coinage, 2026-08-19).** The AI's
  amendment said the tape is not arbitrarily sliceable; the composer restated
  it into the better design: *"not infinite resolution but a bucket of
  solutions that accommodate most splices."* The image pair is print-ready: a
  long curve splices like a **Matisse cutout** — cut the chunk, paste it on
  the canvas — while the scrolling cursor *"needs to reach the splice and
  return to a totally different x and y and restart a different loop, but be
  aware of the continuous delta over time."* A finite registry of splice
  behaviors per object class, confirmed against lived pain: the same problem
  ("long curves… keep their integrity in different page sizes") was sticky in
  the earlier pieces. Pattern for the collaboration paper: **the AI names a
  limit, the composer converts it into a mechanism** — same move as the M5
  reframe (verdict → classifier) two days earlier.
- **The conductor of continuous music.** The study score's purpose, in the
  composer's framing: traditional notation renders continuous parameters
  poorly, so the conductor's layer visualizes them — beating curves, balls
  that approach and recede — precisely so rehearsal language becomes possible:
  *"you need to get to the C# quicker, the beating needs to be faster here."*
  A notation is being designed backward from the sentences a conductor needs
  to be able to say.
- **The economics of AI collaboration, stated as policy (2026-08-19),
  verbatim:** *"Most AI estimates of time are far too long, orders of
  magnitude. But when the plan is flawed, I have found that the
  troubleshooting and clarification of expectation eats a lot of time. So I
  would lean toward getting a solid plan and let AI do lots of coding and a
  controlled refining/troubleshooting phase — but a parachute, so that if I
  absolutely need to move on to produce a score, we can."* The inversion is
  the finding: with AI, CODE became cheap and PLAN QUALITY became the
  expensive resource — the opposite of the traditional economics of software.
  And the parachute was made structural rather than aspirational: every chunk
  class carries a graphic fallback, so a shippable score exists at every
  moment of the build.

## THE GRAVITATIONAL CONDUCTOR, AND COUNT VS REACT (2026-08-19)

*Same day as the architecture confirmation; the composer, waiting on a credit
renewal, typed the notation thinking for the density builds against a page of
Xenakis's Mists. Three printable items:*

- **The device, in the composer's words:** *"if you group a few notes into
  something that is beamed and proportionate you have a GC — gravitational
  conductor. This is just a bouncing ball that lands like an object under
  gravity, to note precise begin time."* With the scrolling cursor, *"you can
  more or less play the notation pretty accurately."* The AI's contribution
  was the mechanism: a cursor is zero-order (it reports the present), a
  falling ball is predictive — arrival is readable from the trajectory, and
  bounce height encodes the coming gap (flight time t → height ∝ t²) — so the
  device shows the next duration before it sounds, which is exactly the
  information a conductor's preparatory beat carries. A physics engine as
  conductor is not a metaphor here; it is the same information channel.
- **The count/react split, quotable:** *"players probably either count or
  react but not both — one doesn't necessarily help the other."* This is the
  composer doubting their own strongest idea of the same week — M5's
  tempo-per-bar, "the one that might do the real work" — and the record shows
  the reversal happening in real time, which the paper should preserve. The
  candidate synthesis: where the analysis finds a simple rational, the
  periodicity goes into the ANIMATION (the ball bounces the internal pulse),
  not the glyphs — the score's metric knowledge is consumed by the device,
  and the player only ever reacts. If the tap-test (proposed E2, with the
  composer as the n = 1 subject) bears this out, that is a finding: notation
  as a division of labour between page and animation.
- **Elimination-with-reasons as method, stated as intent:** *"run some
  analysis and experiments and flesh out different strategies and eliminate
  ones that don't work with reasons for fail… and learn or invent some new
  things along the way."* The dead strategies are deliverables — each carries
  its failure reason (the day-19 apex table already did this for straight
  grids). This closes the loop the M5 reframe opened: measurement as
  classifier, notation as experimental subject, and the composer's constraint
  ("first-level rationals, not 21:19") acting as the complexity prior that
  makes the classifier's positives mean something.

*Addenda from the clarifying exchange, same day:*

- **The GC is a lineage object, and the record briefly got that wrong.** The
  AI filed "gravitational conductor" as a day-19 coinage; the composer's
  correction — *"GCs already in both performance scores… well developed
  object"* — and a grep confirmed `GCMaker` living in pieces #1 and #2. For
  the three-piece-convergence paper this is a better fact than the coinage
  would have been: the device has survived two realizations and is being
  re-derived from first principles (gravity as predictive display) in the
  third — the argument for it now exists independently of its history.
- **Designing to be surprised.** The composer split the experiment slate into
  prove/disprove and DISCOVER, and supplied the discovery design: an ablation
  floor — bare dots + cursor vs the full notation apparatus — with the
  explicitly welcomed outcome *"the discrepancy is negligible."* A composer
  designing the experiment that could show their notation does no timing work
  is the reframe-pattern again (AI names a comparison, composer converts it
  into a mechanism), pointed at their own apparatus this time.
- **The n = 1 subject names their own confound, quotable:** *"I have bias,
  not that good a trad notation reader, I'm an improvisor and have been
  looking at my own animations."* The methodological move that follows —
  pre-registered asymmetric interpretation (against-the-grain wins count,
  with-the-grain wins defer to replication) — turns a weakness of
  composer-as-subject into a usable instrument. Likely a paper section:
  self-experimentation with stated bias in notation design.
- **The attack-coupling observation (composer, from two pieces of lived GC
  use), print-ready:** the GC *"can give a rhythmically accurate entry or
  attack point but tend to be coupled with the actual attack feel of the ball
  bounce — like if you want a player to enter with a slow smooth attack ramp…
  they will have to resist the stated attack."* A visual timing cue is not
  articulation-neutral: the ball's impact CONNOTES a percussive attack, so
  the timing channel and the articulation channel are entangled in one
  gesture. This is a general claim about animated notation that the
  literature on cross-modal correspondence would predict, discovered here
  from performance practice rather than theory. The proposed decoupling
  (cue soft entries at the parabola's apex — the zero-velocity float — while
  keeping trajectory predictability) is a design hypothesis born directly
  from the observation.
- **The reframe that names the research question:** *"this is about finding
  ways to produce phrase performing strategies within a context of rhythmic
  complexity."* Not "how do players hit onsets" but "how do players perform
  PHRASES while embedded in rhythmic complexity" — accuracy demoted from
  goal to context. Paired with the GC's known phrase-level weakness, the
  division-of-labour hypothesis acquires its positive form: **ball carries
  time, page carries phrase** — each device covering the other's blind side,
  and the evaluation design (timing metrics + velocity-profile/judgment
  phrase axis) now has to see both channels.

### The first run (E1/E1b, 2026-08-19) — three results the paper should carry

- **The false positive has a general form, and it recurs.** Day 19 morning:
  an unconstrained beat search "succeeded" at a 20 ms beat — rejected, because
  a 20 ms beat is a fine grid, not a tempo. The fix was to constrain the beat
  to something countable. E1 then "succeeded" again — claiming *every*
  segmentable note at ε=20 ms — using countable beats with 9:1 and 8:1
  subdivisions and grid units of 33–87 ms. **Same failure, one level up: the
  constraint was placed on the beat when it belonged on the grid unit.** The
  generalizable lesson for computational notation analysis: a fit's
  *plausibility* must be constrained at every level of the description, and a
  metric-fit result with no complexity bound on the SUBDIVISION is not a
  result. This is a methodological finding worth stating on its own.
- **A negative that indicts the method, not the idea.** The AI hypothesized
  that the composer's first-level rationals (9:2, 7:3) would rescue the apex,
  and predicted "unsearched space." The chunker selected zero of them — but
  the reason turned out to be provable rather than empirical: with a countable
  beat free in a 3.33× range, some integer subdivision always lands the beat
  in range, so a straight label always exists and p:q can never be *needed*.
  **The frame made the composer's idea unnecessary before the material could
  be consulted.** Re-run with the beat constrained (one tempo per part — the
  condition under which the idea is meaningful), 9:2, 7:2, 7:3, 8:3, 9:4 and
  5:2 were all selected, gaining +0.7 to +4.6 points over a straight-only
  vocabulary. The paper's point: *a null result is a claim about the
  experiment before it is a claim about the world*, and the discipline that
  caught it was asking why a result was exactly zero rather than reporting it.
- **The price of ensemble metric agreement, measured.** Coverage orders
  stably: free beat per chunk (26.2 % at ε=20 ms) > one fixed beat per part
  (15.9 %) > one shared ensemble beat (9.1 %). M5 had asked, as an open
  question, whether the tempo is per part or the bar is a shared window; the
  answer now has a cost attached rather than an argument. Related and
  structural: every fit re-anchors error at each chunk's first onset, so the
  bouncing ball is not decoration — **the GC's landing is what re-zeroes the
  error budget**, and without it the whole analysis would have to price
  accumulating drift. The device and the analysis turn out to presuppose each
  other, which is the M5-chunk-as-atom convergence appearing a third time.

## 2026-08-19/20 — the notation architecture built end to end in one day (phases A–D)

The arc worth narrating: architecture doc → IR schema → three hand-worked
chunks → the trance section extracted/laid-out/rendered/spliced → study
score with a derived beating lane → Section 1's mixed strategy in
production. Three findings bear on the argument:

1. **Decisions kept DISSOLVING instead of resolving — three times in one
   day.** The dynamics ladder, D3's performer transform, and the vertical
   score unit each evaporated when the architecture found a way to not need
   the answer yet (authored-first marks; blunt shape families + a transform
   slot; an IR with no layout units). The composer's own test — "only
   resolve what forks the architecture" — turned out to dissolve nearly
   everything put to it.
2. **Experiment ↔ production corroboration.** The E1 chunker (an
   experiment) and the section1 extraction profile (production code,
   written independently weeks-in-method apart though days apart in time)
   land within ~3 points of each other on Section-1 coverage (24.0/53.0 %
   vs 26.2/57.1 % at ε=20/30). And the E1 FALSE-POSITIVE lesson ("a fine
   enough grid fits anything") reproduced itself in the production
   segmentation within an hour of writing it — caught by the hand-worked
   golden chunk. The hand-worked-before-code discipline (A3–A5) paid for
   itself in one seam.
3. **Adversarial verification as method:** three review passes (16, 22, 30
   findings), every load-bearing finding PROVEN BY RUNNING code or checked
   at the source, including seven validator checks that themselves lied.
   Composer verdicts, verbatim: "I looked at the notation — looks great" ·
   "the parts looks really good."

Session-end reframe (D45): the performance side becomes its own project
("needs a rethink"); when notation resumes, PARTS come first, then their
layout into the study score; requirements harvested while building the
actual score — D6's reverse-engineering stance applied to notation.

## Day 21 (2026-08-20) — the live rig: hand-performance as a compositional data source

1. **"Performing the ladder's shape by hand, captured as data."** (AI phrasing,
   composer flagged it as a keeper note.) The 2ag live rig lets the composer
   drive a texture's speed/density steps in real time with arrow keys; the
   stopwatch log records WHEN each step change was made. That log is a
   hand-performed formal shape — and it can be rendered back as a fixed,
   seeded, insertable texture with exactly those durations. The loop is
   play-in → capture → render: the 2f play-in analysis pipeline in miniature,
   now operating at the level of FORM (when to move) rather than notes
   (what to play).
2. **The interface argument underneath it:** the composer repeatedly rejected
   parameter catalogs in favor of a performable surface ("I hit play and
   then arrow keys... in real time"). The vocabulary result (smear/rain/
   gallop as TWO numbers, jitter + dBpm) made that surface possible: a
   character space small enough to drive live. Taxonomy work paid off as
   playability, not as documentation.
3. **Same-day method note:** the composer also installed talk-first as the
   standing rule after two mis-built slates (rev 3 grid, rev 4 ladders) —
   "when the composer asks to hear X at different Y, ask whether Y is a
   comparison axis or a trajectory." Both mis-builds produced real findings
   anyway (sd is not speed-invariant; the 18/s references sit near minimum
   character separation) — the wrong shape still measured something true.

4. **The texture dial space is structured as the derivatives of phase**
   (day 21, from the composer asking "is phase ever a parameter here? we
   might have missed an essential parameter"): scatter = static phase
   (position), dBPM = phase velocity (the gallop's lap is a phase wrap),
   jitter = phase noise. The composer's instinct that phase was missing was
   half right: the STATISTICAL phase phenomena are fully dialed, but
   COMPOSED phase (chosen inter-player offsets - 90 = interlocked hocket,
   180 = aligned-opposite, from the original 2j finding) exists only in the
   written spec dialect, not on any browsable surface. The taxonomy insight:
   statistical textures (smear/rain/groove/gallop) vs interlocking
   structures (hockets, phase-locked pairs) divide exactly along
   random-vs-composed phase.
