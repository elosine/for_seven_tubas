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

5. **The inverted-U, independently reproduced (day 21):** the hypothesis
   "onset complexity = gap unevenness; both the clean pulse AND the uniform
   smear are simple" was formed from the composer's Reich observation
   ("something very patterned that immediately resolves into something very
   smeary"). A scorer built on gap-CV alone then ranked 997 offsets - and
   the smear and the pulses both landed at score ~0 with the knotty cells
   between, WITHOUT that shape being designed in. Method note for the paper:
   "machine proposes an order, the ear corrects it" - the score order is an
   explicit hypothesis about perception and the composer's listen is the
   experiment; disagreements feed back as weight corrections. Full process
   record: docs/PHASE_COMPLEXITY.md (wrong turns kept, labeled - the
   converge-vs-sweep miscommunication and the two-axis confound are part of
   the argument, not noise).

6. **First ear data, and the composer names the friction (day 21, on the
   computed ladder):** *"I'm trying to cram a square peg into a round
   circle. By nature this is a discursive process, and it's the dramatic
   changes - that's interesting. But for my purposes, I want a smooth
   ramp... there's definitely a U even in the series that you produced, to
   the ear."* Three things at once: the inverted-U prediction gets EAR
   corroboration; the material's nature (discursive, dramatic) is named as
   possibly against the desired form (smooth ramp); and the experiment is
   endorsed while its premise is questioned. The composer's next move was
   not to fix the ramp but to COMPOSE with the dramatic changes: their own
   re-ordering of the rungs (11-2-7-3-10-4-6) is an alternating high-low
   complexity path - the discursive quality used as material.

7. **The assembly method (day 21, second half) - full record in
   docs/ASSEMBLY_METHOD.md.** The compositional claims worth the paper:
   (a) PITCH RESERVOIRS - rows grown by a dictated rule (up a fifth, down
   to a remaining pitch) are consumed one pitch per insertion, ordering the
   piece's tonal centers without being themes. (b) A PERFORMANCE AS FORM -
   the composer's stopwatch run of the phase ladder became the score's
   section durations verbatim; play-in capture at the level of when-to-move.
   (c) DICTATED PREFERENCE BECOMES GRAMMAR - "one long then one or two
   short, not short-long-short-long" replaced probability dice with a
   structural rule; three spoken iterations to get there, all kept.
   (d) VARIANT FAMILIES OVER PARAMETERS - choices presented as complete
   score files differing in one chunk (five PS1 treatments, five PS2 pitch
   worlds), so the composer compares hearings, not settings; per-chunk
   seeds make the comparison exact (everything else identical to 0.000 ms).
   (e) THE SCORE AS PLAN - the continuation is a one-line running order over
   banked material and deterministic machinery; versions are letters,
   families are suffixes, identity lives in the plan.

8. **The finale afternoon (day 21, closing arc) - three more for the paper:**
   (a) **2q RESOLVED BY EAR MID-COMPOSITION:** the velocity-driven crescendo
   "sounds funny... it's changing the timbre as well" - velocity selects
   sample layers, CC7 is loudness. A years-old open calibration question
   answered not by a designed probe but by a musical judgment during
   assembly; the fix (CC7-curve mode, flat velocity) shipped in the same
   hour. Same session also diagnosed WHY drawn swells were silent: plain
   mode pins CC7 at 127 - the notation looked right and played wrong.
   (b) **THE NATURAL-PACE ENDING:** asked to "fill out the end," the rule
   became: give each part its own next attack at its own pace if it lands
   before the last note, plus the single one that lands just after. The
   measurement showed the ragged ending was already tight (all ten parts'
   final attacks within 0.33s) and exactly ONE extra hit fit - on the very
   part (T5) the composer had named by eye. Endings composed as boundary
   conditions on per-part processes, not as written gestures.
   (c) **THE SANITY-CHECK PATTERN:** "the last PS6 sounds fast - is any
   individual part okay?" Composite 20 attacks/s vs measured per-part
   0.500s steady intervals, zero ring violations in 829 pairs. The
   fast-texture illusion dissolves per part; what remains is endurance
   (84 notes over 40s), a different performer question entirely.

9. **The wrong fence (day 21, plan interrogation) — animation is not
   interactivity.** The deliverables plan had excluded the animated notation
   devices (GC ball, curve followers, line wedges) as "performance-runtime
   territory," severing them with D45. The composer's interrogation exposed
   the cut as running through the wrong joint: the jury VIDEO is itself an
   animated score, so the animated vocabulary developed across two prior
   pieces belongs to the deliverable, and only INTERACTIVITY (leader/
   follower, per-player views, networked sync) stays severed. Paper-facing
   points: (a) the devices survived three pieces because their drawing code
   was accidentally architecture — every overlay a pure function of display
   time — which is precisely the property a deterministic frame-by-frame
   video export needs; formalizing an accident into a contract (state(t) →
   SVG) is the recurring maturation move of this process. (b) The
   fence-finding method was the composer interrogating a written plan
   against intended USE ("I will be using all the animated objects"), not
   reviewing code — the plan document is the interface where such misses
   become visible before they become rebuilds.


10. **Notation as an audit of the "finished" archive (day 22, wc-23).** The
    second note of the piece, designed element by element, exposed a flaw in
    the archive score that no amount of listening in the composer app had
    surfaced: the hand-drawn fp object was 0.70 s long, and the playback
    note-off at the drawn end cut the 1.49 s sample roughly in half. The
    discovery chain is the paper-relevant part: (a) the notation drew the
    note at its *measured* sample length (the 2n table), (b) the composer's
    ear reported the sound ending "about halfway" along that bar, (c) one
    compiled number (0.70/1.49 = 47 %) turned a vague report into a
    hypothesis, (d) a one-variable probe (same note, note-off moved) let the
    composer confirm it in a single listen. Two methodological consequences
    were adopted on the spot: **the IR is authoritative for sound** in the
    notation app (a per-play clone of the score; the archive is never
    edited), and an **archive-amendments ledger** (`ARCHIVE_AMENDMENTS.md`)
    that records each correction with its evidence and keeps fold-back an
    explicit act. The broader claim: a notation layer that draws from
    *measured* facts (sample lengths, thresholds) rather than from the drawn
    object is a second, independent reading of the score, and disagreements
    between the two readings are findings, not bugs. Also worth a sentence:
    the composer's reframing of the unit of work — "the next note,
    regardless of technique" — against the AI's instinct to design a
    "device per technique"; generalization happened anyway, but as registry
    data extracted from a settled note, not as an up-front category.

## #11 — The velocities are a performance, not a score (2026-08-22, day 23)
The staccato material's "fine dynamic gradation" turned out, on inspection,
to be two different things: a captured keyboard performance (the composer's
own play-in sessions) and an engine's statistical jitter — neither a set of
per-note compositional decisions. That reframes the notation problem from
"how to notate 100 vs 103" (unanswerable; Miller's ~5 loudness categories,
Ligeti on Structures Ia) to "how to transmit a performance's dynamic
profile to another performer" — for which performance science has answers:
markings are relative (Kosta et al. 2016), shape transmits better than level
(Nakamura 1987), timbre/attack is half of perceived dynamic (Fabiani &
Friberg 2011). Provenance therefore decides the channel: authored → exact
marks; played-in → ambient + deviations; generated → range + character.
Composer, verbatim: *"play this note at 100 and then play the other note at
103 — that they can't do"*; *"it's usually couched in something else."*

## #12 — Notation as measurement, not transcription (2026-08-22, day 23)

A full day of notating one part produced a pattern worth naming: **almost
every notational decision was settled by a measurement, and several
reversed the intuition that preceded them.**

- The composer worried a staccato 8th would be played longer than a
  staccato 16th. True by convention — and irrelevant here, because the
  measured tuba staccato sample (0.43–0.48 s) is longer than both
  interpretations AND longer than every gap in the figure. The written
  value cannot control duration on this instrument; it controls when the
  next attack comes. The notation was then designed to say that.
- The ottava question dissolved the same way: 8vb exists in piano practice
  to keep chrome near the staff; a tuba part written at pitch reaches the
  lane edge, and the *measurement* (nothing fits below A1) forced a rule —
  the column flips to the side with room — that no amount of taste would
  have produced.
- The GC "design" was two rounds of AI invention before the composer said
  the object already existed and was to be copied whole. Porting it took
  less time than either invented version.

**The generalisation for the paper:** in a proportional score driven by
real recordings, the notation is downstream of instrument measurements, and
the productive move is repeatedly to ask *what does the material actually
do* rather than *what should this look like*. The composer's own phrasing
for the underlying tension: *"play this note at 100 and then play the other
note at 103 — that they can't do."*

Related: the spacing complaint that opened the last stretch — "the beaming
suggests twelve evenly spaced sixteenth notes, but that's not what it looks
like" — is the clearest statement yet of the piece's central notational
problem. **x is real time; beams are metric symbols; the page tells two
stories.** Every device settled on day 23 is a way of keeping those two
stories from contradicting each other.


## #13 — "Go" versus "go, then count": the count/react split resolved by figure (2026-08-22, day 24)

*Continues THE GRAVITATIONAL CONDUCTOR, AND COUNT VS REACT (day 19), where the
composer doubted that players could both count and react. Day 24 resolves it —
not by choosing one, but by assigning each to a figure class.*

**The model, in the composer's words:** *"if one-shots are just a go, then the
clusters are a go, then count."* A one-shot is pure reaction: the GC's ball
lands, the player plays. A cluster — *"much more rapid than the single
one-shots... a different performance strategy"* — is a launch followed by an
internally counted rhythm at a tempo the analysis found but the page does NOT
state (*"it more or less describes a single tempo even though I'm not marking
the tempo"*). Beaming carries phrasing, not beats; **rests split at the beat
are the only thing on the page that makes the beat visible** — which is why
they are included and why they are split. And the scrolling bar is the
error-correction channel: *"even when the notation isn't time-accurate, or is
a little off, the scrolling bar helps with rhythmic accuracy."*

**Why this is a finding and not a preference.** The metric-fit analysis (D56)
was built on day 23 as a way to choose simple notation. Day 24 reveals what it
was actually for: it decides WHICH performance strategy a figure gets. A figure
that admits a simple grid within the ear's tolerance becomes "go, then count";
one that does not stays a succession of "go"s. The analysis is a classifier of
performance behaviour, not an engraving convenience.

**The division of labour is Tufte-clean, and the composer arrived at it by
interrogating their own preference against Stone.** Three candidate systems
were on the table: (a) Gould — metric values, rests, beats visible; (b) Stone's
time-space — uniform heads, no values, no rests, distance is duration; (c) the
Xenakis *Mists* reading the composer named — beams as clumping, no rests, the
bar does the rest. The composer's own partials are written as beamed 16ths,
i.e. metric VALUES; a system that writes values but omits rests belongs to
neither tradition. So (a) is the internally consistent choice, and the deciding
argument was consistency within the notation rather than authority of any
source. Each element then has exactly one job: GC = launch · beams = phrase ·
rests = beat · bar = correction · head edge = moment.

**The method note the paper should keep:** the same session locked three
alignment rules (head left edge on the moment; rest left edge on the moment;
GC ball on the lane edge) and each was settled by MEASUREMENT before argument
— 3 of 7 figure downbeats were found colliding with the GC disc, 42 % of the
section's staccatos live in the colliding register, and two successive rest
placements (centred on the slot; centred in the silence) were both shown wrong
against the sources before the third was adopted. The composer's phrase for
the guardrail: *"when the physical spacing looked quite off or was incongruous
with the notation, then something probably needs to be addressed"* — the
page's proportional truth is the check on its metric reading, which is the
inverse of how notation normally works.

## #14 — Pattern before grid: the cluster notation as rhythm categorisation (2026-08-23, day 24)

*The composer's reframing after a regression put 32nds into a figure they had
rejected. Full statement in COMPOSER_LOG (day 24 late).*

**The claim.** The proportional page guarantees time: every notehead's left edge
is at its true moment, the cursor confirms it. So the rhythmic notation inside a
cluster is free of the duty conventional notation carries — it does not have to
*be* the timing. Its job is to show the **pattern** (long-short-short-long), so
the player performs the figure as one unit from one go. The analysis that chooses
the notation should therefore optimise **pattern fidelity as seen**, not
millisecond error: *"if it looks like medium, short, short, long, those can't be
notated as equal-duration notes."*

**Why this is rhythm categorisation, not a heuristic.** Desain & Honing (2003,
"The formation of rhythmic categories and metric priming") and London (*Hearing
in Time*) describe listeners sorting inter-onset ratios into a small set of
categories (1:1, 2:1, 3:1, 3:2…) with basins of tolerance around each. The
composer's "medium-short-long" is a category judgment made by eye on a
proportional page; the notation's task is to name the category the spacing falls
into. The earlier fitter optimised the wrong quantity — absolute error — and so
could produce a notation (four equal 16ths) that is accurate to 20 ms and
categorically wrong.

**The measurement that makes it codifiable.** On the video page a cluster
notehead is 6.9 px wide and 6.9 px is 30 ms — so "the written pattern places a
note visibly off its true position" has a number: **displacement greater than
one notehead at page scale.** It coincides with the 30 ms tolerance in use since
E1, but the justification moves from the ear to the eye, and it scales with the
page (15 ms in the ×2 zoom). The fitter's new objective is the worst
displacement, in heads, between the positions the notation implies and the true
positions; simplicity breaks ties; tuplets are admitted when they win.

**The guard survives inverted.** The old tolerance does not vanish; it stops
being the goal and becomes the guard against claiming a shape the spacing does
not show. T7's final three (396 | 288 | 286 ms) *felt* 3:2; a written triplet
would need 264 | 264; the 24 ms gap was the tell. Same test, other direction:
no equal notes over unequal spacing, no tuplet over spacing that does not show
one.

**Method note.** Validate the new analyser against the 25 figures the composer
decided by ear before letting it guess at the dense section — the same protocol
the dynamics rule went through (reproduced one cluster exactly, missed one
partial on the other, filed with its failure). Pickups remain a proposal flagged
for the ear: *"the fortepiano is clear; the other ones probably had something to
do with the way I heard it."*

**Calibration of the one-notehead threshold, from the composer's own eye
(day 24, late).** Two figures the composer classified unprompted:

| figure | written vs actual | worst displacement | composer's verdict |
|---|---|---|---|
| T8 31.76 (grid 0,2,5,8) | 268/402/402 vs 261/416/393 ms | **7 ms = 0.2 heads** | *"reads as coherent… I can tell visually that the second gap is wider than the third, but I don't feel the notation is at odds"* |
| T1 figure 2 as four even 16ths | 172/172/172 vs 200/135/244 | **63 ms = 2.1 heads** | *"that T1 example does provide that dissonance if there wasn't the 3:2"* |

One point below the threshold read as coherent, one point above read as
dissonant, both from the ear that will judge the rest. The threshold is not
arbitrary; it is bracketed. (The T8 case also shows the eye tolerating a
visible 23 ms difference between two gaps WRITTEN equal — it is under a head,
so it reads as "the same".)

## Day 25 — "dense" meant unplayable, not too much (the wrong objective, caught)

The composer said of a 4.4 s passage: *"it feels very dense to me."* The AI read that as
an aesthetic judgment about the texture and spent the day building a thinning ladder for
the EAR — sounding-count caps, attack-spacing rules, a gap-fill with two real bugs found
and fixed. All of it measured, all of it verified, all of it aimed at the wrong target.
The composer, asking for a state-of-play: *"My 'this just sounds dense' comment wasn't
meant as negative, just meant by ear. It sounded very unplayable… this process is
strictly for playability."* The original passes playability with eleven part-moves and
no removals. The thinning research survives as a flag, not a deliverable. Methodological
point: the composer's periodic "restate this for me" checks are the error-correction
channel; the AI's verification discipline catches wrong numbers, not wrong objectives.

## Day 26 — the notation sits BETWEEN Ferneyhough and Stone, and the unit of cognition is the pattern

The composer, asked whether a player could follow five tempo changes inside one
cluster, reframed the question away from tempo altogether: *"I'm trying to find some
space between a strict notational rendering, i.e. Brian Ferneyhough, versus a
time-space rendering, i.e. Kurt Stone or Xenakis's* Mists*. And I think this is
precisely the example that falls in between."* The claim about performance: *"in
real-time performance they are doing pattern recognition… as long as we beam everything
in patterns and the spatial layout doesn't look incongruous, then that's the right
notation."* Two "long short short" figures at different tempos are not two tempos to the
player; they are the same pattern twice, and *"the spatial layout… and the scrolling
cursor"* carry the difference. The written rhythm is a grouping device; the page and
the cursor own time (first principle 1, day 24, now with its cognitive justification).

The failure condition has a name — *cognitive dissonance* — and a mechanism — *"a mental
rounding or averaging"*: the eye rounds visibly-unequal gaps to the written pattern
until the inequality passes a threshold, and only then must the notation itself say
*"very long, medium, shorter"* (a tuplet, or a separate figure). This gives the
one-notehead threshold (day 24) its psychology: it is the radius of the rounding. Worth
citing against Stone's account of proportional notation and Ferneyhough's of
"tactility"; the piece's position is that *pattern legibility* is the invariant and
metric exactness and spatial exactness are each sacrificed to it where they conflict.

Process note for the paper: the AI's question ("five tempo changes — playable?") was
the wrong frame, and the composer's answer did not answer it but replaced it. The
analyser had found the right seam (breath) and the wrong unit (one grid per seam); the
correction came from a statement about how players read, not from the numbers.

## THE PAPER'S STRUCTURE — first pass (composer, day 26, 2026-08-23; stored for when the paper starts)

Composer, dictated, *"just a comment for the paper development, I just don't want to
forget it":*

*"I think the first pass will be just to organise the structure and outline the
individual parts. And I think basically there's three parts of the piece, and then
there's the Kobayashi framing. So the framing will be the beginning and the end, and
then we'll describe the three parts of the piece. And so I think the first pass will be
to look at everything for each part of the piece and then construct a narrative, a very
brief narrative of what was done to create that section. And then just a list of all
the processes and things we did to create that section, and then I'll probably choose
the things to talk about, and then we'll expand a narrative for each. So it'll probably
be the case that there's just too much to talk about. And so for each section, I'll
choose the most interesting things to focus on and then dive deep into those and then
make sure they fall into a coherent narrative for that section."*

**Shape:** Kobayashi framing (open) → Part I → Part II → Part III → Kobayashi framing
(close). **First pass, per part of the piece:** (1) a very brief narrative of what was
done to make it; (2) the full list of processes and things done — everything, from the
running log; (3) the composer chooses the most interesting items; (4) those are expanded
into a deep narrative that coheres for the section. Expect too much material; selection
is the composer's, by interest. *The running log's "would this be expensive to
rediscover" bar exists for step 2.*

## The model could not reproduce the composer's ear, and the fix was the composer's own method (2026-08-23, day 27)

A clean instance of the paper's AI question, with numbers.

The segmenter — the tool that decides which notes form a figure — was specified as a
search: try every way of cutting a gesture, price each figure by the criteria the
existing analyser already used (tuplet beats, empty slots, displacement in noteheads),
charge a fixed cost per cut, take the cheapest. A reasonable specification, written
after the composer had already read one gesture by hand.

**It provably could not produce the composer's reading, for any cut price.** Their
reading had both more figures and a higher total figure-cost than the reading the
search preferred; raising the cut price penalised their reading faster than the
alternative. No tuning existed that would work. The failure was not in the weights but
in the *shape* of the objective.

What was missing had already been said, in the transcript of the day the composer read
the gesture by hand. They had not searched cut sets at all: they sorted the gaps into
pace families (~157 / ~245 / ~300 ms) and read the runs. Turned into a rule — **a cut
may only land where the pace changes; a figure never ends in the middle of an even
stream** — it removed the spurious cut, made the anti-shattering guarantee *structural*
rather than a matter of tuning (an even run contains no pace change, so it has no legal
cut whatever the weights are), and took the model's stability from 10 % to 67 % of its
own ±20 % parameter neighbourhood.

Three things worth carrying into the argument:

1. **The composer's method was better than the specification, and it was already on
   record.** The AI's job was not to invent a criterion but to notice that one had
   already been demonstrated and to formalise it. The transcript was the source.
2. **The corrected model then went one step further than the hand reading.** It keeps
   three of the composer's four cuts, flags the fourth as a near-tie exactly as they
   had, and makes one additional cut that eliminates a quintuplet from their figure —
   six figures, no tuplet anywhere, against five with a 5:4. That is their own stated
   principle ("figures need not share a tempo") applied more consistently than they
   applied it by hand. It is offered, not taken: the tool proposes and flags, the ear
   disposes.
3. **A result nobody asked for.** Once cuts land at pace changes, *not one figure in the
   entire section requires a tuplet.* The tuplets were an artefact of forcing a single
   grid onto a whole gesture — a notational complexity produced by the analysis method,
   not by the music.

The general form: when a model cannot reproduce a musician's judgment, the informative
move is to prove it cannot — and then look for the criterion in what the musician
actually did, rather than tuning until the numbers agree. Tuning would have produced a
model that fit one gesture and nothing else; here the fragile tuned version (10 %
robust) was built first, measured, and discarded in favour of the structural rule.

### Day 28 — the verdict splits 8g in two (in progress)

The composer's first look at the segmentation: *"the pattern segmentation approach is
the correct one."* Then a second thought: the single-grid reading *"might potentially
be better"* — **but with the beams broken the way the segmented reading broke them.**
That separates two things 8g had fused: finding the GROUPS (where the pace changes) and
giving each group its own GRID. The grouping survived the eye unchallenged; the
per-figure grid is what is now in question. Worth keeping for the argument whichever way
the verdict goes: the analyser's contribution that held was the *segmentation* — the
perceptual units — not the notational consequence drawn from it. A third reading (one
grid, six beam groups) was built in minutes from an existing flag, because the tool
had already been given the composer's day-23 distinction ("keep the same tempo, but
not beamed altogether") as a primitive.

### Day 28 — the composer's ear reproduces GPR 2b; the tool had half of it

The verdict on T1: the segmentation instinct was right, two of five cuts were one note
off, always in the same direction — the tool put the note at a pace change on the SLOW
side; the composer hears it on the QUICK side ("two plus three", twice). Every one of
the composer's six groups is a banded local maximum of the inter-onset gaps: **the seam
is the slower gap.** That is Lerdahl & Jackendoff's grouping preference rule 2b
(attack-point proximity) and Tenney & Polansky's temporal gestalt boundary — neither
was cited to the composer; they arrived at it by ear in one sentence. D67's rule, built
the day before from the composer's own day-26 method, was a one-sided version
(compare the seam with the gap before it only) — so it was right at every quick→slow
change and wrong at every slow→quick one. The correction does not cancel the rule; it
adds the missing side. On T1 the corrected legal set IS the composer's reading, with no
cost model involved; the one boundary they called tentatively ("sounds more like") is
the one that flips at a 0.5 % change of the band ratio. Across the section, 13 of 14
gestures change under the corrected rule — the reads had not yet been done, so nothing
was lost; the order (verdict before reads) paid for itself.

Two further things for the argument. (1) **The composer set the scope before giving the
verdict:** "we won't get to a universal protocol… improve it and get it closer… if it
doesn't generalize, we move on, it's a by-ear judgment." The tool's job is to be right
where a rule exists and to say where one does not (one gesture in the section has no
clean seam under the rule). (2) **Flow vs grouping.** The composer's caveat — that a
quick group on its own grid "just looks like even sixteenths" — is a distinct
requirement from grouping: the notation should show that one group is quicker than its
neighbour, and a tuplet bracket does that. The 7:4 they pointed to was an artefact of a
125 ms grid; the same five notes on one grid at 240 ms are "two sixteenths, then a 3:2
triplet" at 0.10 heads — the bracket the composer wanted, in the ratio the music has.
Their quoted 50 % measured 53 %.

### Day 28 — THE DIALOGUE ITSELF, both sides (composer: "make sure we're capturing this conversation for the paper — your reactions too, for example the comment about Lerdahl and Jackendoff")

*Standing from here (CLAUDE.md amended): the AI's own reactions — a framing, a
citation, a reversal — are captured verbatim alongside the composer's words, not
summarised. The composer's side of this exchange is in COMPOSER_LOG day 28; the AI's
side is quoted here as it was said.*

**1. The composer's first verdict** — *"T one looks good. I think the pattern
segmentation approach is the correct one."* Interrupted by their own second thought:
*"the eight g before might potentially be better. But can we break the beams the way
in eight g after? And can you give me a very brief, concise description of why AI
thought the after one might be better?"*

**AI (Fable 5), verbatim:**
> Why the AI preferred AFTER — in one breath: the one grid needs three tuplet brackets
> (7:4 · 6:4 · 7:4) to hold paces that aren't in one tempo — ink stating a ratio the
> player never counts, since they read the pattern and the cursor carries the time
> (your D66) — and it still leaves 0.7 heads of displacement. The figures need no
> bracket and leave 0.2. Both sit under the one-head line, so neither is *dissonant*;
> AFTER is simpler, BEFORE is one consistent grid. Your eye decides.

> Your second thought splits 8g into two things it had fused: finding the **groups**
> (kept) vs giving each group its own **grid** (now in question).

**2. The composer's verdict proper** — scope first (*"we probably won't get to a
universal protocol… I don't necessarily want to chase to the end the algorithm. Let's
improve it and get it closer if we can"*), then the ear: the flow caveat (the 7:4
*"communicates that the last two of that five are quicker"*; on separate grids *"they
all just look like even sixteenths"*), then *"two plus three… same thing for the next
five… the rest are grouped correctly."*

**AI, verbatim:**
> Your ear found a rule, and it's a small fix, not a chase. All six of your groups are
> exactly where the gap is a *local maximum* — "the seam is the slower gap; the
> boundary note goes with the quick side." The tool's D67 rule was one-sided (it only
> compared the seam with the gap *before* it), which is why it put the pace-change note
> on the slow side twice. Corrected, the legal cuts on T1 are `2,5,7,10,14` — your
> reading, and nothing else is legal.

> It's a known rule: Lerdahl & Jackendoff's GPR 2b (attack-point proximity) / Tenney's
> temporal-gestalt boundary. You reproduced it by ear in one sentence.

> Your tentative one is a genuine near-tie: the cut after 7 is legal only because
> 304/242 = **1.256** vs the 1.25 band ratio; at 1.3 it becomes the tool's 3+2. The
> system should *flag* that kind of flip, not decide it.

> Across CLOUD02-I, **13 of 14 gestures change** under the corrected rule — so the
> T2–T10 reads should wait for the fix. One gesture (T7 @36.19, "slow slow *quick* slow
> slow") has no clean seam under it → the tool should say so and hand it to your ear.
> That's your "manual investigation" case, predicted.

> Even with your groups, separate grids read "two 16ths, then three 16ths" — the
> quickness is only in the spacing. A bracket is what *says* quicker. Hand-computed:
> your first five on **one** grid at 240 ms = 16th 16th, then a 3:2 triplet — worst
> 3 ms, 0.10 heads (the day-26 quintuplet was 0.63). The 7:4 you liked was the right
> message in the wrong ratio — an artefact of the 125 ms grid.

> Your "about 50 % bigger" measured **53 %**.

*What the exchange shows, for the argument:* the AI's first position (AFTER is better)
was a defensible reading of the stated principles; the composer's ear overrode it on a
ground the principles had not named — flow between groups — and then supplied, without
knowing it, a rule from the grouping literature that the tool had implemented by half.
The AI's contribution was not the rule; it was recognising the rule in the verdict,
measuring it (53 %, 1.256, 13 of 14), locating the defect in one comparison, and
separating what generalises from what stays by ear.

---

## Day 28, second sitting — THE METRIC THAT WAS MEASURING THE WRONG THING (2026-08-23, Opus 5)

*The paper's best moment in this stretch is not that the rule got fixed. It is what the
fix did to the evidence that had been offered for the previous rule.*

**The claim, day 27, in the tool's own report and in the standards document:** *"the 6
figures need NO tuplet at all"* — and, across all ten parts of CLOUD02-I, **not one
figure needs a tuplet**. It was written into `NOTATION_STANDARDS.md` principle 6 as a
measured result, and into the journal as a reason the deferred tuplet-vs-dotted question
"may never come up". It read as strong evidence: a segmentation rule so good that the
notation it produces needs no brackets anywhere.

**Re-measured under the corrected rule (day 28), the number is 3, not 0.** T7 @36.19,
T7 @39.51, T8 @37.14. And the reason is the part worth writing down:

| | day 27 (one-sided seam test) | day 28 (two-sided, D68) |
|---|---|---|
| figures across the section | **60** | **55** |
| figures needing a tuplet | **0** | **3** |
| worst displacement, any figure | 1.00 heads | **0.93 heads** |

**The old rule cut MORE, and a short enough figure fits some grid for free.** Two notes
are always a pair; a pair always lands exactly. "No tuplet anywhere" was not measuring
the quality of the grouping — it was measuring how finely the material had been
shredded. The metric moved with the wrong variable. When the rule stopped over-cutting,
the figures got larger and more musical, three of them turned out to genuinely want a
bracket, and the metric that had looked like a *success* got *worse* while the thing it
was supposed to be a proxy for (worst displacement — the actual dissonance the composer
reads) got *better*: 1.00 → 0.93 heads.

*For the argument:* this is the second time in three days that a plausible objective
function was the problem rather than the model under it (D67 was the first — the cost
model that provably could not reproduce the composer's reading). Both were caught the
same way: **by checking the tool's output against the composer's ear rather than against
the tool's own score.** A system that tunes toward "fewer brackets" will find that
shattering the music into pairs is the global optimum. Nothing in the notation rules
forbids it; only the ear does.

### The smaller correction, kept because it is the same lesson at small scale

The day-28 derivation established that T1's 7-vs-8 boundary hangs on a ratio near the
1.25 pace threshold, and named it **304/242 = 1.256** — the seam gap against its right
neighbour. Building it, the number turned out to be **304/239 = 1.272** — the seam
against the *shortest gap of the band it joins*, because the banding is greedy from each
band's own minimum, not pairwise. The direction of the finding was untouched (a ~2 % move
in one threshold swaps the reading); the arithmetic behind it was wrong, and had it gone
into the paper unmeasured it would have been wrong there. **The tool now bisects for the
crossing and prints what it measures.**

### The AI's own words, verbatim, on the reversal (composer's standing ask)

> The rule checks out exactly — `{2,5,7,10,14}` at 1.25, flipping to `{2,5,8,10,14}` at
> 1.31. One correction to the spec's arithmetic I'll record: the flip is driven by
> 304/**239** = 1.272 (the band's anchor), not 304/242 = 1.256.

> **Finding — the day-27 claim does not survive.** Under the corrected rule three
> figures in CLOUD02-I need a tuplet (0 before).

> Why, and it is not a regression. The old rule cut MORE — 60 figures against 55 — and
> a short-enough figure fits some grid for free. "No tuplet anywhere" was partly an
> artifact of over-cutting. Cutting only at real seams leaves larger, more musical
> figures, and three of them genuinely want a bracket; the worst displacement across the
> section went DOWN, 1.00 → 0.93 heads.

### And the thing the two candidate pages turn out to differ by

`t1-figures2` (the composer's six groups, each on its own grid) against `t1-hybrid2`
(the same six groups on ONE grid): **DOM-audited head for head, all sixteen noteheads
sit at identical x-positions and the six primary beams span identical groups.** The
entire difference between the two readings, on the page, is **three tuplet brackets and
eight beam segments** — 13 polygons against 21, and the text `7:4 6:4 7:4` present or
absent. Same notes, same groups, same single launch. *That is the choice the whole
apparatus exists to put in front of the composer:* not what the notes are, not where the
groups are — those are settled — but whether the page says "these two paces are related"
out loud, or leaves the relation in the spacing.

---

## Day 28, third sitting — "I would like the tuplet brackets": the bracket is the message (2026-08-23, Fable 5)

*The third reversal of the day, and the one that closes the loop: the 8g–8h detour found
the grouping, and the writing went back to where it started — with the groups now
visible. Both sides verbatim, per the composer's standing ask.*

**The AI, asked which file the machine proposed:**

> Short answer: the machine's proposal is `t1-figures2` — that's 8h. `t1-hybrid2` is 8g,
> and it was built by hand from your groups, not by the rule. [...] The choice is yours
> by eye; my lean is figures2, because the 7:4 and 6:4 are artefacts of the 125 ms grid
> rather than a relation you meant — but the counter-argument is the one I made
> yesterday, that without a bracket the quick groups "just look like even 16ths."

**The composer:**

> No. I would like the tuplet brackets. And the idea there is... my mental model is that
> there should be some communication to the performer if there is a speed change. Within
> the threshold or, I guess, for me, it's with the visual. So the first two sixteenth
> notes look much further apart than the next three. And so the seven-four bracket is
> appropriate. So talk to me about this and anything that needs to change in the machine
> before moving on.

**The AI, restating it as a rule and conceding:**

> Two 16ths far apart, then three close together, all written as plain 16ths: the values
> say "same" while the spacing says "different." That's a contradiction on the page. The
> bracket on the quick group resolves it. So figures are still the unit of *grouping* —
> but the gesture stays on one grid, so that every seam's pace change is written as a
> tuplet relation. "No tempo is printed, so figures need not share a grid" — that clause
> of 8g falls.

> Honest note for the paper: net of 8g + 8h, the page came back to the day-26 one-grid
> reading with the beams broken at the right places. The detour found the grouping; the
> writing returned to where it started, now with the groups visible. The FLOW flag I
> built this morning was the seed of this ("the bracket is what says quicker") — you've
> made it the rule.

**Two design calls, and the composer's answers — "Aa, Ba":** bracket scope stays per
beat (fit()'s model) with a straddle flag, rather than rebuilding fit() around the figure;
one grid per gesture with the fit's brackets, rather than pairwise shared grids at the
clean ratio (FLOW found 3:2 at 0.17 heads for figures 1+2 against the 7:4 at 0.7 — on
offer, by hand, not the default).

*What the exchange shows, for the argument.* Three things:

1. **The composer's principle was already on the record a day earlier** — *"the flow
   wasn't communicated in the groupings... the seven-four bracket communicates that the
   last two of that five are quicker"* (COMPOSER_LOG, day 28 first sitting) — and the AI
   had heard it well enough to build a *flag* from it, but not well enough to make it the
   *rule*. It still leaned the other way an hour after building the flag. The composer
   stated the principle whole; the AI had stated it by half and then argued against its
   own half.
2. **The metric and the principle pulled in opposite directions and the principle won.**
   Everything measurable favoured `t1-figures2`: fewer brackets, 0.3 heads against 0.7,
   a cheaper cost. The composer's ground was not measurable by the tool at all — whether
   the page *tells the performer* something the spacing alone leaves implicit. This is
   the same lesson as the morning's "no tuplet" number (a proxy that moved with the wrong
   variable), now from the other side: the proxy was right about legibility and wrong
   about communication.
3. **The detour was not wasted, and the paper should say precisely what it bought.**
   8g removed the brackets to find the groups; 8h corrected which side a boundary note
   falls on; 8i puts the groups back onto the one grid the tool had proposed on day 26.
   What changed between the day-26 page and the final page is only where the beams
   break — and that is exactly the thing the tool could not see without the detour. The
   grouping was worth two days; the writing was worth none, and the composer's eye
   settled it in a sentence.

### Day 28, fourth sitting — what the build DID to the argument (8i, Opus 5)

*Three things came out of building 8i that the third sitting's dialogue could not have
predicted, and each of them is evidence for a different claim.*

**1. The metric that was replaced, and why the replacement is the interesting part.**
Across three days the same section was scored three different ways by the same tool:

| day | rule | the number reported | what it actually measured |
|---|---|---|---|
| 27 (8g) | one-sided seam | "**0** of 60 figures need a tuplet" | how finely the material was cut |
| 28 (8h) | two-sided seam (D68) | "**3** of 55 figures need a tuplet" | the same thing, cut less finely |
| 28 (8i) | one grid (D69) | "**15** of 15 gestures fit one grid inside a head; **12** carry a bracket" | whether the page can say the relation |

The first two numbers moved because the *cutting* changed, not because the material
did — a short-enough figure fits any grid for free, so cutting more finely drives the
"needs a tuplet" count toward zero no matter what the music does. The number looked
like a measurement of the notation and was a measurement of the tool's own parameter.
**It was only visible as a proxy failure once the composer's verdict made the quantity
irrelevant.** For the paper this is the cleanest instance of a recurring shape: *an
automated criterion that improves monotonically in its own parameter is measuring the
parameter.*

**2. The composer's page was reproducible from the rule — but only after the rule had
been corrected by the composer's ear, twice.** `t1-final`, built with no `--cuts` and
no `--beamBreak`, is IR-identical on every drawn field to `t1-hybrid2`, which the
composer had hand-typed. That is the strongest form of the claim the whole project is
testing: *the composer's judgement, once stated, can be encoded and then reproduced
without them.* The honest qualification is the order of events — the ear came first
(day 28: cuts after 2,5,7,10,14, and "I would like the tuplet brackets"), the rule
second (D68 then D69), the reproduction third. The tool did not discover the page; it
was corrected into being able to rebuild it. **What that buys is not this page — it is
the other nine parts**, which the tool now writes the same way without the composer
having to type anything.

**3. The design call the composer deferred came due immediately, and the scan is what
made it visible.** In the third sitting the composer answered call **A(a)** — keep the
bracket scope per beat, flag a bracket that straddles a seam, *and fix it only if one
appears in the reads*. One `--scan` over CLOUD02-I: **five of fifteen gestures carry a
straddling bracket**, T4 @36.20 three of them. So the case the composer treated as
hypothetical is a third of the section. Two observations for the argument:

- **A deferral is only cheap if you can measure how often it will bite before you pay
  for it.** The scan took one command and turned "we'll see" into "five places, named".
  Without it the composer would have met the straddles one at a time across ten
  sittings, deciding the same question ten times.
- **The straddle exists because two independently-correct rules meet.** `fit()` chooses
  tuplets per BEAT (it must — a bracket is a beat-level object); `segment()` chooses
  seams by PACE. On T1 they coincide, which is why the composer's page is legal — *a
  seam IS a pace change, and a pace change is what buys a bracket.* The coincidence is
  not guaranteed, and where it fails the page says "quicker" about two groups at once.
  This is a good small example of a class the paper should name: **composed rules that
  are each right and jointly produce a statement neither intended.**

*A smaller note, for the methodology section.* The plan predicted the three brackets
would cover notes 3–5, 6–7 and **11–14**, with "(verify)" written next to it. Measured:
3–5, 6–7 and **12–14** — note 11 sits in the preceding plain beat. The prediction was
wrong and the flagged uncertainty caught it; the claim that depended on it (no bracket
leaves its group) held. Writing "verify this" beside a guess is what let the guess be
wrong without costing anything.


## Day 29 — "let's get rid of all the brackets": the second read turns the writing rule over (2026-08-23, Fable 5)

**What happened.** One part after D69 — *the bracket is the message*, the composer
asking for T1's 7:4 · 6:4 · 7:4 — the second part came back the other way. Shown four
candidate pages for T2 (the tool's groups with the straddling 7:4; own grids; four
pairs; two gestures), the composer chose none of them and dictated a fifth:

> *"c is the closest, I hear three plus three plus one plus four plus four. and it
> could be three plus four plus four plus four. So let's do this. first three Beamed
> together. Then the rest — then the next three beamed together, let's change that
> eighth rest to two sixteenths, and then that next eighth note will stand alone with
> the two flags. then the next four together, and there will be a GC there. and I
> didn't mention the GC on the first one. So those four together and then the last
> four beam together. And then let's get rid of all the brackets. So let me see that,
> and then let's discuss it."*
>
> *"Sorry. I changed my mind about the flags. Let's just have two beamlets on the
> right for that single sixteenth."*

Three things in that are new to the system, and each one is a place where the
composer's page is not the tool's vocabulary: **a one-note group inside a gesture**
(the tool's segmenter holds that a figure has at least two notes — "a figure is a
pattern; one note is a one-shot" — but the composer's seventh partial is neither a
figure nor a one-shot: a tail, beamleted, with no go of its own); **a silence written
as two 16th rests rather than the longest value that fits** (the day-24 rest rule,
"one rest per silence, dots allowed", made by the same composer — overruled for one
silence, by eye, for reasons not yet said); and **no bracket at all** on a gesture
that the analyser cannot write within a head without one.

**The AI's reaction, verbatim, on the no-bracket request (for the record — the
composer's standing ask is both sides):** *"Caught something that matters: with
tuplets off, the analyser picked a grid of eight even 16ths at 3.8 heads — the 430 ms
gap written equal to the 157 ms one. That's the fit's fallback order: when nothing
fits within a head, it sorts by 'fewest tuplets, fewest rests' before displacement, so
it prefers the page with no rests over the page closest to the spacing. That's
backwards under principle 4."* The order was fixed (displacement first when nothing
is coherent) and the plain page came out at 1.2 heads — the same 1.2 the composer had
once accepted on T1. **The defect had been invisible for five days because every
gesture in the piece so far had a coherent reading; it took the composer removing the
brackets to make the analyser choose among incoherent ones.** That is the recurring
shape of this project: the composer's verdict is what exercises the tool's untested
branch.

**The measurement that belongs in the paper.** The composer's T2 cut set and the
tool's disagree in a way a threshold cannot fix. On gesture 2 the composer cut at the
gesture's biggest gap (430 ms — the cut the tool's DP had passed over as a +0.02 tie,
because a pair fits any grid for free and a cut costs 0.5) and at *neither* of the
smaller pace changes the tool took (215 vs 157; 292 vs 219). For the pace rule to drop
both, the ratio must exceed 292/157 = 1.86; for it to keep the composer's five T1 cuts
it must stay under 1.272. **No constant spans both.** Either the ear's pace threshold
is not a constant — it depends on the gesture (on T2 the 430 ms gap *dominates*, 1.47×
the next; T1's slow gaps form a continuum) — or the composer on T2 was reading page C's
beams as much as hearing. Both are testable; neither is decided. *(And this is the
second time the composer's verdict on a part has changed the rule rather than the
page: T1 found the one-sided seam, T2 finds that the pace ratio is not one number.)*

**On D69 itself.** T1: *"I would like the tuplet brackets."* T2: *"let's get rid of
all the brackets."* These are not contradictory if the rule is the one D69 actually
states — *a pace change must be SAID on the page* — and the beams are doing the
saying here: three-three-one / four-four, with the 16th pulse continued into the lone
note by the two rests. On T1 the bracket said "these three are quicker than the
16ths around them"; on T2 the composer has no quicker group inside a group to mark —
the groups *are* the pace changes. Whether that reconciliation is the composer's or
only the AI's is the question the discussion has to settle. *(AI's lean, stated before
the discussion so it can be wrong on the record: the bracket is the message when a
pace change falls INSIDE a beam group; when the pace change IS the beam break, the
break is the message and the bracket is noise.)*

---

## Day 30 — T4: the composer names the axis ("counting groups and phrase groups"); the AI answers with containment

**The composer, mid-read, unprompted and verbatim:** *"it looks like the tension is
between counting groups and phrase groups. Like, for example, the second five four
and six four, those are really a group of four notes. So if I group them by a five
four beat and then a six four beat, it would look like one and three. Do you have
any insight on this?"*

This names, in two sentences, the axis the whole T4 straddle problem lives on — and
it is the composer's own D62 semantics surfacing: beams were assigned PHRASE, rests
the beat, the GC the launch; D69 later gave brackets the COUNTING message. Two
marks, two jobs — and T4 is the part where the jobs part ways (T1/T3's seams
happened to fall on beats, so identity looked like the rule).

**The AI's answer, verbatim (stated as a rule candidate, not a decision):** "The
rule that reconciles counting and phrase: a bracket must not CROSS a beam-group
boundary — but it may sit strictly INSIDE a larger beam group. Containment, not
identity. Bracket = beam group (T3's ideal) is the tightest case of containment;
the phrase-beam-of-four with two brackets inside is the looser case, equally clean.
What is forbidden is only the overlap — the straddle. The beam is free to say
phrase; the brackets keep saying the count; neither lies."

**And the measurement that sides with the composer's ear:** the four notes (10–13)
have internal gaps 241 / 236 / 197 ms — every pairwise ratio ≤ 1.22, inside the
1.25 same-pace criterion. The tool's 2+2 (cut after 11) exists only because greedy
band anchoring lets the 174 ms anchor claim the 197 while 236 starts a new band —
the third instance of a part's read finding the rule rather than the page (T1: the
one-sided seam; T2: the ratio is not one number; T4: banding vs pairwise pace).
Also structural, independent of taste: the counting grouping at the second 5:4
degenerates to a one-note "group" — a flag, not a beam — the very thing
MIN_FIGURE_NOTES exists to forbid.

**For the paper:** the composer's first-stretch dictation ("the five four is its own
beaming group…") and the 10–13 hesitation are ONE event seen twice — where bracket
and phrase coincide the composer aligns them without comment; where they diverge
the system's two grouping vocabularies become visible and get named. The notation
system did not remove the grouping problem; it split it into two legible layers
that can now disagree in public.

**Day 30, the counter-refinement (T9/T10).** The AI's containment rule, applied
mechanically, dissolved every whole-beat bracket over two pairs into per-pair
3:2s — bracket = group, tidy. The composer, looking at the page: *"all 3:2s in
the beginning meant to be about the same? then if yes 6:4 1 bracket."* The
criterion is not alignment but SAMENESS: the bracket's message is the
subdivision, and saying one subdivision twice is saying it wrong. The AI's rule
survived contact with four parts and was refined by the fifth — the bracket
belongs to the subdivision run, the beam to the phrase, and they need not share
edges (the sanctioned straddle). Note the shape of the exchange: the composer
asked a QUESTION about the material ("meant to be about the same?"), the AI
verified it numerically (one lattice, 112 ms slots in both windows), and only
then did the instruction fire — the criterion is empirical, not stylistic.

---

## Day 32 — THE COMPOSER CALLS THE SYSTEMIC PASS A FAILURE (verbatim, both sides)

The most important process reversal in the notation work so far, and it is about
*what an AI optimises when left to choose*.

**Composer:** *"I'm not sure what happened. but now I can't tell. Which part the
brackets are assigned to. in t seven and t eight. And consequently, I've lost
confidence that the brackets are being shown with the correct tuba part. …It
seems like the last pass was a fail. and I can't tell if things are better or
worse. So to my eye, the spacings are obvious, but for whatever reason, AI is
having trouble figuring it out."*

And on strategy, which is the part that belongs in the paper:

**Composer:** *"I really need to move on. I was just trying to do spot correct
points so I can move on instead of addressing the system. But last AI agent
apparently tried to do systemic fixes and just messed different things up. So
the strategy now is to get this looking right and then move on. But because of
the mess up with the brackets, I can't even do spot fixes anymore."*

**What actually happened, measured (AI, day 32).** The day-31 passes were not
wrong in their own terms: every one was driven by measurement, each fixed the
defect it targeted, and ten batteries plus 75 snapshots stayed green throughout.
The side-switching machinery genuinely removed the collisions it was built to
remove. **But it optimised for "no ink touches anything" and silently spent the
thing that actually matters: a reader's ability to tell which staff a bracket
belongs to.** With brackets free to sit above OR below their own staff, 8 of 16
went above and 8 below, and one visual gap (T7/T8) ended up holding four
brackets owned by two different parts. No collision check can see that failure,
because nothing collides.

**The bug underneath the confusion was real and small:** the hook-direction flag
in the new dictation path was inverted, so the two dictated brackets pointed
their hooks at the *neighbouring* part instead of their own — destroying the one
visual cue that says who owns a bracket. Found by generating an
ownership table from the laid-out geometry rather than looking at the page.

**The methodological lesson, in the composer's frame:** they asked for *spot
fixes so they could move on*; the AI kept reaching for the general rule. Each
generalisation was locally defensible and globally costly. The composer's
instinct — treat the section as a deliverable, not as a system to perfect — was
the correct engineering judgment, and the AI's instinct to systematise was the
expensive one. *(Compare day 30, where extraction of rules was DEFERRED by the
composer for the same reason.)*

**AI, verbatim, for the record:** the assignment was never wrong — all 16
brackets always belonged to the part whose notes they cover. What failed was
legibility, and legibility was never in any of the checks I built.

---

## Day 33 (2026-08-24) — the reopening, and the fix nobody could see

**The composer reopens the systemic pass they had closed the day before —
in the same breath as the distrust it caused (verbatim):** *"instead of making
the small moves, the AI agent must have changed something in the system and
made things worse and worse… this made it so I couldn't tell what to fix
because the brackets were pointing in the wrong direction. So I just wanna do
what is expedient."* — and then: *"actually, let's just have one more crack
then at the vertical spacing rules… there should be a way to decide for each
element if they're on top of the notation or below the notation. and to sort
out any conflicts… I guess if we can't get to it in this go, then we'll just
do it by eye."* The deliverable-vs-system tension (day 32's entry) is not a
settled preference but an oscillation the composer manages: spot fixes when
trust is low, one bounded systemic attempt when the by-eye cost looms larger —
with an explicit exit ramp declared IN ADVANCE ("then we'll just do it by eye").

**AI's finding this sitting: the fix was real and invisible.** The hook
inversion had been fixed at the day-32 checkpoint and verified in layout data;
this sitting verified it again in the running app's rendered SVG (DOM audit,
all 16 hooks toward their own notes). The screenshot the composer sent as
evidence of the problem was the PRE-FIX page — either taken before the fix or
a cached tab (.js does not hot-reload). **"Verified" and "seen by the composer"
are two different states, and trust is set by the second.** A correct fix that
the composer has not seen behaves, in the collaboration, exactly like no fix:
the composer narrated it as ongoing breakage. The verification surface has
three layers here — layout data, rendered DOM, the composer's actual browser
tab — and the day-32 checkpoint claim ("all 16 verified") was true on the
first layer only. The house rule "a confidence claim must be verified in the
running app" turns out to need one more clause: *and the composer's own view
of it confirmed current*.

**And the measured half of the complaint stands:** brackets sit "further away
than they need to be" because day 31 built hugging for dynamics but never for
brackets — 9 of 16 on fixed ±6 ss rows. The composer's eye correctly
distinguished the fixed-row brackets from the hugged ones without knowing
either mechanism existed.

**Coda, same day — the reopened pass lands.** The composer granted one bounded
retry with an exit ramp; the AI put ONE design question (bracket side, three
options with the trade-offs) instead of building first; the verdict took two
words ("b good"). The build then hit exactly the failure class that had burned
day 31 — six approved-span brackets silently lifted 1.42 ss by a stale value —
but this time a mechanised gate (before/after comparison against the approved
file) caught it before any page was shown, and the fix was one scoping line.
The contrast with day 31 is the point: same kind of bug, opposite outcome,
and the difference is not care but MACHINERY — the approved page as a frozen
oracle, checked on every build. Ten batteries, 75 snapshots, live-DOM audit;
two residual cross-lane grazes (0.35 / 0.50 ss) surfaced to the composer as
verdicts rather than resolved by heuristic — which is what "flag, never
squeeze" looks like in practice.

**Second sitting, same day — the composer proposes the generalization.** After
three days in which every systemic pass came from the AI (and one failed), the
direction reverses: the composer dictates three placements, then sketches the
rule behind their own dictations — *"So this isn't necessarily the rule, but
evaluate it if it's helpful… if current track is beams down… and next track is
beams up… try to move accents, text, and dynamics above if possible… I'm not
saying to use this, but see if there are the right rules that might do
something like this."* The epistemic posture is the mirror of day 31: where
the AI once generalised uninvited, the composer now invites generalisation
while withholding commitment. The AI's evaluation: formalised as FACING BANDS
(upper part beams down over lower part beams up), the sketch reproduces every
final dictation of days 31–33 — both facing bands in the section are exactly
where all the dictations landed — but adopting it as machinery would also move
two things nobody asked about (T9's accents, per the sketch's own logic; T3's
accents, on a non-facing band the composer just approved). Recommendation
kept on record: the rule is TRUE as a description and stays a diagnostic; it
becomes machinery only by verdict, with its two deltas named. Also built this
sitting, from the composer's note-relative language ("below the NOTE"): the
per-mark accent law — the day-31 dynamics law extended to accents, which
resolved the last collision in the section.

**Third/fourth sitting — the read that never ran.** 6b, the formal part-by-part
verdict rounds, closed with a sentence: *"6b is done so cld 2 wrapped."* The
ceremony was skipped because its function had already been served — three days
of placement repair kept every figure under the composer's eye, and the
approvals accreted through the dictations themselves. The read is not a ritual
but an exposure condition; when exposure happens by other means, the ritual is
redundant. (Contrast day 30, where the reads were the exposure.) Also this
sitting: the composer's rule sketch stayed a diagnostic at the AI's
recommendation and the composer's silence — the facing-bands line now prints on
every build, machinery deferred to a section with nothing approved to disturb.
