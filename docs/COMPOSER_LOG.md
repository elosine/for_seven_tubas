# Composer Log — for seven tubas

> **Standing practice (inherited from piece #3):** the composer's substantive prompts
> get captured here as dated journal notes — lightly cleaned from speech-to-text,
> content untouched. AI appends automatically.

## 2026-08-11 — DH1 verdict: longs blend; sacrifice density for envelope-length diversity (dictated)

"Okay. I think the long durations work well. And I think it blends well, and I
think I would lean more towards a diversity of envelope lengths and sacrifice some
of the apex density. The last test was plenty dense, and there was sort of a
homogeneity. So I don't know what that means for the engine. But a mix of really
long and then, within a certain range, a larger diversity. So here, I'm not sure
how much we tried with the other parts, but they're kind of too close in
similarity."

*(→ longStream graduates to engine core; DH2 rate ladder at diversity-leaning
settings; DB 030 verdict + 031.)*

## 2026-08-11 — The engine-development framework (dictated)

"Let's develop a systematic framework for developing the grain generative engine.
Mental model so far: you generated some grains and scattered the apexes — what did
you use? Branch here: I listen, we can choose to tweak current engine settings or
choose a new engine. How to evaluate best new-engine candidates? If it's tweak, how
to understand which tweaks and the scale/scope — like, are 5 ms changes good or do
they need to be 100 ms, or does the range need to be expanded by .5 or multiples of
100 — so, informed A/B testing. Then I included a feedback loop: generate → I
manually tweak → analysis → extract data/lessons from the manual tweak. What are
the types of analysis tools, and how to extract lessons from a tweak — in other
words, how to determine if tweaks point to a new model or settings adjustments, and
then how much or which direction from either. This is a conceptual start — let's
build from here."

*(→ ENGINE_FRAMEWORK.md; seeded engines; tools/analyze_tweaks.js.)*

## 2026-08-11 — Automation eval; pass 2 spec: onset-driven density, the short-grain category (dictated)

"Can you give me an eval for AI adding ports to loopMIDI, and to the Reaper config
that will allow AI to create new tracks, add VSTi, config inputs, input-enable new
MIDI ports. And give potential solves to direct access to UVI — actually first
cost/benefit: I think the only thing so far was instance volume. For the new track
[8] 9 and 10 setup, is any direct UVI access necessary? If yes, then solution to
that — MCP? Claude co-work? If not, then defer until bites.

Then let's prepare cloud tests for when I can attend here. First max density apex,
new tests for 10 parts. I think in anticipation of the next set of tests: slightly
longer min grain dur, longer max grain dur, and that probably means greater
diversity of grain durs — maybe we can lean towards longer. Or the mental model is:
on the short end of the spectrum, all durs within a certain range are treated as ONE
category, 'the short grain', then the rest as one random selection — clarify with me
if this doesn't make sense.

Then — this is to test the max-density grain-dur/onset algo/model — let's drive the
test clouds with ONSET diversity: the gaps between onset times varied and yet dense.
The physical limitation is re-articulation time — no overlap within one part, and a
short gap to re-articulate a new note. We may have to lower apex density. Let's have
a way to EVALUATE — so when this becomes a factor, and how to modulate/evaluate:
greater apex density vs. onset/grain-dur diversity.

I think the current mental model of the current hypothesis is: at max density there
is an optimal max grain duration that will satisfy the sound-image of density
through grain-dur diversity and onset density/diversity. But also I would say the
previous models had good apex density — or getting there, not perfect yet — and
maybe grain durs too short, or not enough diversity. Xenakis has pretty wide
diversity of note durs while maintaining a dense sound — so same, please.

Document asks/my analysis, generate plan/proposal, execute what you can — more for
the grain tests. I'll look at the automation proposals before implementation."

*(→ AUTOMATION_EVAL.md; pass 2 engine compileOnsetCloud; CURVE_DATABASE 028.)*

## 2026-08-10 — Post-wrap addendum: releases, generative engine, Penn State, 10 parts (dictated)

"1) A vocabulary and animated/notational devices for the RELEASE portion of the
envelope for tuba/brass — the abrupt stop like the rexpodec might be a tongue stop;
the scrolling curve won't work for env-release, so devices that let players release
in reliably variable ways. 2) After the stochastic-cloud research: a statistical/
mathematical model/GENERATOR for these gestures — variability in the right bounds,
plot grain peaks per our density decisions, generate grain-dur series and shapes —
a shape-to-sound translator; and the drawing tool must produce shapes with realistic
parameter scales (limits on rates of change). I know we discussed recipes, but I now
feel comfortable trying a generative engine — the issue was the theoretical model
wasn't translating into the right sound; that's the research we're doing.
3) Penn State new music festival application — tuba/euphonium ensemble category,
minimum 6 parts; research their ensemble's max size. 4) Expand THIS piece to 10
parts; generate additional parts on the fly as variations of the 10 (e.g., 19
independent parts at first rehearsal); real-time transposition/octave/tessitura
adaptation so any part is readable by any tuba/euphonium family member — a MANDATE
for performance-score notation. 5) Composer score: 10 lanes full-height; the shape
tool becomes a floating window locked to the timeline, transparent, with cursor.
6) Grain editing: adjust parameters with MIDI following — apex dot on every envelope;
whole-shape grab (bounding box, horizontal-only move); dotted start line + go-time
number box; for grains REMOVE node/curve tools — just amplitude handle (top) and
duration handle (side), both 'as if generated at that value', with indicators; and a
grain-env toggle: sine, [our classic crescendo — name it], expodec, plus calculate
ALL the Curtis Roads envelope shapes for audition, to settle a tuba/brass-specific
set. 7) Note: generate shape-cloud → tweak manually → REVERSE-ANALYZE the tweaks to
inform the generative algorithm. Work independently; document/commit/push as you go."

## 2026-08-10 — Day wrap: SC4 approved; the four-pass plan (dictated)

"That's pretty good — when we finish the other parameters we can revisit. Slight
open question on release shape and duration; table it. Next: play with the curve
durations, but maybe driven by onset — scattering the onsets, and that will scatter
the durations as well. Third pass: establish the least dense texture. Fourth pass:
perceivable gradations of density — how quickly we can go from least dense to most
dense, how gradual, and whether we can do things in between or jumps."

*(→ Resume Here rewritten for a cold session; sc4-max-dense = the approved dense
hold; passes 2–4 queued.)*

## 2026-08-10 — The convergence: peak-cut = attack; the SC program (dictated)

"Let's stick with this crescendo-based cloud — swell and cut, the original shape.
Invert the onset to offset: the peak of the swell is the equivalent of the attack.
Build the density of those swells — a density of one swell peak following another.
Randomness so it doesn't sound periodic; durations variable too. First order of
business: an escalating/de-escalating series of curve ENDINGS — densest point =
endings following each other densely, edges spaced out — a Gaussian-style curve.
Stage two: variety of curve durations and onsets, backwards calculated from the
swell density. Stage three: vary the curve shape, then the variety itself. [Line-
mass understood and held; point-cloud framework noted but maybe not this piece.]"

*(→ SC1 built: ending-density arch, feasibility-coupled durations, flat level as
the honest ending-density test. DB 023.)*

## 2026-08-10 — Back to Xenakis: Metastaseis/Pithoprakta as the model (dictated)

"Looking at Metastaseis and Pithoprakta — how he created these clouds. They have very
clear density profiles that grow and shrink. On a cursory listen it seems it's really
the onset density — the number of players playing at the same time, or just the onset
density. I recognize seven is going to limit the effect. The durations are just
heterogeneous — not a uniform increase. Maybe it's more straightforward than I'm
making it out — as simple as more people playing and more onsets. Since these pieces
are for acoustic instruments, we can achieve something similar with the tuba — we're
just not pulling on the right strings. Put the granular metaphor on hold; stick with
the sound mass/cloud as achieved by Xenakis, and boil down a few rules."

*(→ XENAKIS_MASS_RULES.md: two species (point-cloud w/ attacked atoms; line-mass in
pitch space); X1–X8; finding 13 explained by X3 — our swells were onset-less points.
Proposed: XT1 tuba point-cloud, XT2 line-mass (needs pitch opened).)*

## 2026-08-10 — The reset: reject naive approaches, find what we can build on (dictated)

"It feels like we've lost some progress — these two [ISO tests] represent the ones
that are rejected: the rate one is just a repeated pattern; the duration ones don't
change in their amount of overlap. Reset and reject these approaches. There's a
certain amount of complexity here that's difficult to codify — the 'sound of the
curve' will be some more complex composite of overlaps, peak distribution, curve
duration and jitter. I want to find a way to systematically make progress — steps
robust enough that we don't go back. Draw some conclusions, document them, move on.
Maybe ignore the curve data for now: just an increase in density and activity over
five seconds, plateau two or three, descend to about midpoint. I need one of the
things we can build on."

*(→ Laws L1–L3 carved into CURVE_DATABASE; stratified engine = the synthesis;
keeper stats = the anchored plateau.)*

## 2026-08-10 — Sculpting rounds (dictated, condensed)

Rounds of draw-tool feedback: live stroke preview needed ("can't see the line as I
draw"); green for meta curves; no panel pop; nodes hard to grab; diamonds → real
2-axis sculpting ("move the diamond horizontally... weight one side of the curve
versus the other; it just makes the hump bigger or smaller"); eraser cursor on ALT;
splice at the playhead ("split it at the cursor — it's not clear where I'm
splitting"), then moved to ALT+X; diamonds drifting off the line → pinned on-curve.
Verdict at close: "slightly clunky, but workable for now."

*(→ Final grammar: circles move points · on-curve diamonds lean/bulge spans
(doubling rule) · dblclick adds · ALT-click erases · ALT+X splits at playhead ·
box handles stretch/retime · P opens panel.)*

## 2026-08-10 — Freehand-with-fit; more vertical room (dictated)

"Move directly to freehand with fit — but talk options first. Gehry metaphor:
essentially freehand but without the jagged points; afterwards I add nodes or
adjust the humps easily. Maybe a pseudo-Bezier mode too. And eat one more track —
I need more vertical room; compress the other seven down. The dials might become
a pop-out thing eventually. Prototype in what exists and I'll comment."

*(→ Options laid out (sketch→fit / lazy pen / click-through pen / relax button);
Option 1 prototyped: Draw toggle + fit-strength dial, pre-smooth + point-reduction.
Noisy 120-pt arch → 10/6/3 nodes at light/medium/heavy. META now 32 %. Pop-out
tool palette parked for next UI pass; click-through pen = next tool if wanted.)*

## 2026-08-10 — The drawing layer (dictated)

"Design a curve drawing layer — the top two tracks become one track, that's my
drawing layer; compress the seven tuba tracks into the remaining space. Then devise
the drawing tools: I find freehand too erratic — maybe I lack the skill — it's not
precise enough, though we may need it in certain cases. Find the right kind of meta
shape drawing tools or combination of tools."

*(→ META lane built (layer 7, top, double height, silent). Tools v1: stamp palette
(arch/surge/bloom/line/saw) + full node editing; freehand-with-fit offered as v2.)*

## 2026-08-10 — Granular embraced; the CATIA division of labor (dictated)

"Granular synthesis is a good metaphor — let's use it, think of it as pure sound,
sort out performance consequences later. Parameters: grain envelope/shape (sine,
expodec, rexpodec, combinations), heterogeneity of envelopes, a variation slider
per parameter (grain duration consistent or ranged), grain overlap, etcetera. The
problem: TOO MANY PARAMETERS — this is where AI could really help. As composer I
want to be responsible for the meta shape — the Frank Gehry draw/sculpt — with the
CATIA engine underneath: if I draw a fish, the software sorts out the necessary
statistical complexity — grain shapes, curves, heterogeneity — to achieve that
shape in sonic terms. The task: find the SALIENT elements (does grain duration
matter? is granular even right?), find the appropriate RESOLUTION of change within
each, and the right COMBINATION to produce the meta-shape effect. We need a RECIPE.
Devise tests to reliably discern these, progressively — some may be dead ends, but
I want building blocks."

*(→ Salience-first program adopted; three-layer architecture (composer/recipe/
engine); crescendo-grain ≈ Roads' RExpodec at 1000× timescale. Tests W0–W3.)*

## 2026-08-10 — The stochastic sound mass; the grain (dictated)

"Not there yet for the precision comparison — defer until the mechanism is nailed
down. Only jitter-high and Poisson approach what I'm thinking, and maybe by
accident. The others revealed there has to be a BASELINE of jitter — otherwise it
sounds like a straight acceleration, a pulse almost. Sometimes there were clusters
of crescendos that sounded like the density I was looking for — THE STOCHASTIC
SOUND MASS. Characteristics: no direct repetition — different durations from each
other, different curve shapes, enough that you hear chaos internally. And back to
threshold-to-peak as the operable range — the duration of the actual crescendo,
threshold to peak: think of that as THE GRAIN. Elements: amount of simultaneous
overlap · grain duration · per-crescendo difference/jitter in duration, curve
speed, overlap, repetition rate — overall: how quickly am I perceiving the
REARTICULATION of the crescendo regardless of part. Break it down very basically;
zero in on the proper components to vary, the extent each needs to vary, and their
truthful sonic consequences. Much more broken down, systematic."

*(→ Reframe: granular synthesis at ensemble scale — grains scheduled in grain-time,
parameters as DISTRIBUTIONS not values; static-bed Z-series calibration proposed.)*

## 2026-08-10 — ADSR, fluidity, the Gehry/Xenakis compiler (dictated)

"Let's have some basic internal concept of ADSR — a relatively short release for
each of these; the abrupt releases make them sound like articulation. The strict
mathematical acceleration is too precise. The wall: I have a sense of the meta
shape, and a vaguer sense of internal mechanism — duration and overlap — but not
how to drill into the precise tweaks for full fluidity. Another metaphor alongside
Xenakis: Frank Gehry — very fluid curves AND precise. If I wanted a shape lasting
only five seconds with a nice acceleration-and-build feel and a quick release, we'd
find the internals to build it. If I drew some complex meta shape, we'd have a
sense of how to divvy out the internal individual crescendos to produce that sound
— with extreme versions possible, and fine gradation, so a curve and a slightly
more curved version could be realized and you could hear the difference. I'm
essentially doing Xenakis, but with animated notation that might have more
precision. Worth bringing in Formalized Music. Then: available tools to calculate
these things, and build the appropriate tests."

*(→ The time-warp compiler identified as the unifying mechanism; path T1–T5 in
CURVE_DATABASE; Achorripsis lineage confirmed and cited.)*

## 2026-08-10 — Counterpoint recognized (dictated)

"We are actually dealing with counterpoint. We can borrow examples from Fugue,
Stretto, mensuration canons, Ockeghem. Let's use some of these models and see if
they apply as well as the statistical mathematical ones, and see which ones work.
Each part represents a density mode or node — it's not about different amounts of
swells per participant. [13 s example: parts 2–4 with four swells each, first
longest to last shortest, length-series differing between parts so peaks don't
hit in unison.]"

*(→ Contrapuntal strategy family added to the realization model alongside the
statistical one; S4d built as an acceleration/prolation canon.)*

## 2026-08-10 — Peak-aligned duration modulation; the Xenakis frame (dictated)

"Eventually maybe the score object is just a meta bell or crescendo on a meta track —
I draw the shape over the duration, and the parts fill in underneath. Not ready yet.
Duration hasn't been taken into account — that's the missing key. The nine-second
example: the first curve is nine seconds to apex, the others come in progressively
shorter but ALL apex at nine seconds. The dial is the duration of the subsequent
curves — essentially equivalent to the meta-crescendo curve. Longer version (say
14 s, over 28): adjust the duration of each curve AND the repetition rate so that
as you reach the apex, statistically more and more parts overlap — there might be
gaps, not just one after another. One end: a single crescendo per part at different
lengths. Other end: rapid repeating, calibrated for growing overlap. This is
Xenakis-like — stochastic plots: a plot of an overall texture, and we build the
internal components. Don't assume a linear progression — we want the PERCEIVED
overall feel: density, motion, volume following the drawn shape. Noise later."

*(→ Two alignment paradigms identified: FLOW (onset-chained — everything so far)
vs CONVERGENT (peak-aligned — new). Organization in CURVE_DATABASE; meta-track
parked in PLAN.)*

## 2026-08-10 — The MOVEMENT dial (dictated)

"Holding a density, there is a movement dial. On one end, all seven are just playing
a long tone. On the other end, rapid repeated entries — the shortest possible
crescendo repeated and overlapped. It's really less about volume than texture and
energy. My understanding: there's a meta shape (bloom, exponential, or bell), and
underneath is more opaque to me — that's what I want to figure out. If we wanted a
bell curve with the seven tubas: how to tweak the overlap and duration of each
individual crescendo so the swells grow in both intensity/volume AND movement —
more busy — and then the other direction, less busy and less volume."

*(→ Movement = the factorization choice inside density = rate × duration: same
density from few-long or many-short. Three dials: Density / Movement / Level.
Bell build: L 8→2 s, spacing 2.55→0.29 s, peak 70→100 %, all riding the arch.)*

## 2026-08-10 — The ensemble-crescendo dials (dictated, post-restart)

"The salient factors: the amount of parts playing simultaneously — and I'll consider
simultaneity based on THRESHOLD TO PEAK; two parts are playing together if both are
somewhere between threshold and peak. We might adjust this later. Then the duration
of max overlap. If we use the crescendo shapes we solved for as the general shape,
the volume/amplitude will equal the amount of overlap — so apex will be all seven.
And the curve speed — the delta — is the amount/speed with which the overlap stacks
up. So we need to modulate both the onsets (when the envelopes come in) and their
durations. Take the standard eight-second curve: if I wanted my overall shape to
follow that curve, how do the internal mechanisms work so the overall sound sounds
like the overall curve?"

*(→ Analysis in chat: Little's-law identity N = rate × delivery-time; the ceiling
theorem N_sustained ≤ 7·(1−threshold); apex-as-moment vs apex-as-plateau fork.)*

## 2026-08-10 — The meta-curve grammar (dictated)

"Think of a Gaussian bell, metaphorically — apex and the opposite of apex. Variable
duration: the amount of time it takes to get to the apex and back down. Or it could
be sawtooth-shaped. The curve up or down can be various shapes — a meta crescendo
that follows a different shape to the apex, and whatever in between, we can control
that. And if you zoom into the curve, we control the jaggedness: on one extreme,
over x seconds it eventually reaches the apex but with a lot of randomness in
between — variability in the overlap. On the other end, totally smooth — overlap
increases smoothly along the curve."

*(→ The meta-curve gets the full grammar: contour (arch/sawtooth/…), nadir↔apex
range, time-to-apex/back, segment shapes from the same Bloom/Linear/Surge families,
and a noise/jaggedness dial. Discussion below in chat; schema → CURVE_DATABASE.)*

## 2026-08-10 — Ratio adopted; performer-side deferred to notation time

"I understand the ratio — we can keep that. Let's come up with names for the two
sides, and the halfway-loudness moment. And help me not forget the performer
interpretation, visual interpretation side of things: I just want to get some overlap
and actual models under the belt. We'll do a straight visual-curve-to-sound-curve
correspondence for now, and later, after analysis and research, we'll see if the
performance score curves need to be changed in some way to produce the same sound
effect."

*(→ D3 application note updated: experiments = curve-literal; performer transform
revisited at notation time; AI carries the reminder.)*

## 2026-08-10 — S1 verdicts (dictated)

"Get rid of the last one [D] — it doesn't distinguish itself enough. Number one [A]
I would describe like a bloom — though I'm not sure the visual shape conveys a sound;
we'll do a more scientific approach to that later. The middle one [B, linear] can
stay as is — while it's linear, it's probably not what I would describe as your
typical crescendo. When there's a hairpin in traditional notation, it probably sounds
more like three [C] rather than two [B]. But two has its own sound category. The last
one [C] I would equate to the expected crescendo. Let's probe the spectrum — just
after linear to something more extreme, a few examples in between, and let me see if
there's a difference, if there's a spectrum. Curve number one [A] — there might be a
bit of a spectrum there too, but let's sort out three first."

*(→ S1c B→C spectrum drawn; hairpin≈exponential logged as notation-mapping finding;
entry-bite fixed via CC pre-arm.)*

## 2026-08-10 — Simplification: the causal chain is visual shape → performer → sound

"I want to simplify as much as possible. The cause-effect I'm looking for is visual
shape → sound, with the performer in between, which we will infer. First: establish
what categories of crescendo SOUND there are — two, three, four, how many — and how
we distinguish them. They should be distinct, and it's those particular sounds we're
targeting. Then for each category, find the visual curve shape (and speed of
following, etc.) that will address that category — making assumptions about how the
animation will actually be played, so the MIDI is that interpreted version, not a
mathematical trace of the curve.

Let's start with the categories, and jump into the composer score for this: I'll
have you draw the verbatim curve and play it for me — MIDI follows the curve
precisely — to find whether there's any actual distinction. It could be there's just
one type of crescendo shape I want to use. Then we'll try those at different lengths,
maybe different volume changes. Then we'll solve whether the visual curve has to
change to produce that sound, given the performer won't follow it like a computer."

*(→ Sound-first taxonomy: categories of crescendo percept, discovered by ear via
curve-literal renders IN THE SCORE; drawn curves later inverse-filtered through the
performer model (D3) to hit the surviving categories.)*

## 2026-08-10 — Crescendo experiment notes (dictated)

"I want to try crescendos where the overlapping increases, and one where it starts
with unison and then moves towards no overlap. Ones where maybe the percentage
overlap is the same or there's no overlap, but the length of the crescendos increases
or decreases. I want to build a set of pitches or chords that we try these at —
unison all the way up to seven-note chords, and in different ranges. And I want to
see what gradually changing the shape of the curve over time sounds like —
interpolating one shape into another over a series of repeated crescendos.

Responding to the research: take into account the performer reactions. These are
animated curves — they're meant to be following the curves visually and playing
them. We'll have to infer or guess to a certain extent what they'll actually be
played like, and make the MIDI file more like what a performer would do looking at
a particular curve, rather than the MIDI crescendo following the curve precisely."

*(→ Battery S0–S7 in CRESCENDO_EXPERIMENTS.md; performer-model rendering = D3.)*

## 2026-08-10 — The detour begins

"I'm going to take a detour now, and I want to come back to the bass clarinet piece.
But I now want to start a piece for seven tubas. Set up the composer with seven tracks,
Tuba 1 through Tuba 7, and set up the instrument library. I'll make the loopMIDI
routing and instrument rack now."

*(→ Repo seeded from piece #3's stack: 7-track composer on :5200, sandbox on :4700,
instruments skeleton with ports `Tuba1`…`Tuba7`. Sample library TBD → survey next.)*
