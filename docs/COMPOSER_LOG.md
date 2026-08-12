# Composer Log — for seven tubas

> **Standing practice (inherited from piece #3):** the composer's substantive prompts
> get captured here as dated journal notes — lightly cleaned from speech-to-text,
> content untouched. AI appends automatically.

## 2026-08-12 — STOP; into the piece: containers; naming; wrap-protocol change (dictated)

"Let's stop this process here — just capture all we learned. I want to get into
the piece: we'll move to recipe and even CONTAINERS, and hopefully come back to
refine. What I mean: I'll have a container like 'starting the piece with a
density build over 18 seconds' — some graphic like a curve — I'll get it
visually like I want the sound to be, then we fill it with the existing
technology; move forward like this, and time permitting come back to any given
container and refine the grain recipe to better reflect it. There will be some
new ones, but same: get the shape to acceptable, come back and refine later. I
would like a meta layer — probably drawer for now, I think we have implemented
this. Start with a density curve over 16 seconds like our surge curve — for
this one, in the meta score, can I have control over dur and just a handle for
curvature. And devise, probably just a naming system, for sandbox save files —
ones that represent a single shape — and the score files we'll add these to.
Then wrap, commit, push. Let's update the protocol: I'll explicitly say if I
have anything to add for a wrap — if I don't include it, assume no further
input from me."

*(→ density arc captured (DB 044, finding 15 indexed); container v1 shipped
(DB 045, cont-build-001); NAMING.md; D5 wrap-protocol divergence; session end.)*

## 2026-08-12 — dens9 verdict: B (level cue) works; perceived peak at ~115 (dictated)

"B works better — seems to peak at around 115; notice a little change at end
but more subtle. A was hard to get a grasp — maybe parts smooth and sometimes
seems to jump speed, but hard to tell."

*(→ level-carries-climax CONFIRMED; linear level saturates early (perceived
peak at 75% of ramp) → accel.levelCurve: the crescendo dial on the LEVEL
trajectory, back-loading the swell. dens10-levelsurge (levelCurve 0.5).
DB 043i.)*

## 2026-08-12 — dens8 verdict: the shifted expectations; no climax above fusion (dictated)

"#1's ramp sounds like linear until 41 s then plateau-ish til end — the
smoothest linear ramp is begin to ~41; this is what I would have expected from
#2. #2 sounds like a much slower ramp to about 121 and then samey after — what
I might have expected from #3. #3: slow ramp til about 193, doesn't necessarily
step up but feels same-ey after — I don't get a sense of it reaching climax."

*(→ SYSTEMATIC one-notch shift: composer's perceptual-linear = raw curve −0.4 →
dial RE-CENTERED (ACCEL_CURVE_ZERO). Universal top-end sameness above ~4/s at
ALL curvatures = finding 15's fusion ceiling CONFIRMED — rate cannot deliver
climax past fusion → accel.levelRamp built (finding-13 level cue deployed).
dens9-climax-ab. DB 043h.)*

## 2026-08-12 — The one-dial accel curve, like the crescendo curves (dictated)

"I was picturing it as a curve like the ones we use for the individual
crescendos — can we get to ONE dial? So: more ramp at beginning, gradual ramp at
end → to linear, even change throughout → to little change at beginning, swell
at end. Or is it more complex? Or do we just have to calibrate the dial?"

*(→ exactly right and not more complex: accel.curve built on the SAME family and
slope convention as the crescendo segment models (exponential, k = 4·curve);
bloom-side < 0 < surge-side. The center ("even to the ear") is a calibration —
dens8-curve-ladder, then re-center. DB 043g.)*

## 2026-08-12 — THE BUG FOUND: apex-scramble; peak-anchored scheduling (composer-triggered)

"Something not quite right, and it may be the bug I was hearing — the lack of
ramp; this one is not a pure accel. Can you look at the apexes in the generated
timeline and troubleshoot?"

*(→ diagnosis confirmed: the engine accelerated ONSETS but the ear hears APEXES
(peak-cut = attack); durations 0.6–5 s scrambled the chain — apex-gap CV 0.94 vs
onset 0.39; reserved tiers also leaked window-randomness. FIX: anchor:'peak' —
chain points = peak times, species-aware pre/post, onsets back-calculated,
per-part reservation in peak order. Verified: apex gaps exactly the chain
(2.00, 1.83, 1.69…), zero drops. dens4-accel-pure regenerated. DB 043c.)*

## 2026-08-12 — dens2 verdict: flattened; the ACCELERANDO model advised (dictated)

"That one flattened most of the way — a little bit of build in the beginning
then quite dense for most; by 20 pretty dense. The reason I asked about the
machinery is to see if I could advise: looks like we need more of a GRADUAL
change of apexes. I don't know if there's a different algo that is more linear —
metaphor: time-domain vs frequency-domain in FFT. So: increase in apex points
gradually over time — something like an ACCELERATION, and we can apply different
curves to the acceleration (faster or slower) — that would be the gradual/sudden
dial. Then overlay a NOISE algo calibrated to the right time scale, so the
result is sound-mass randomness over smooth accel, but not dramatic enough to
alter the relative density through time. And if we need to tweak the overall
duration of the curve until we dial it in — a longer time span to make a smooth
change happen — we can."

*(→ the composer designed the scheduler: spec.accel gap-chain generator built
exactly to this spec — time-domain point placement, gamma = gradual/sudden,
lognormal per-gap jitter. dens3-accel-ab. DB 043.)*

## 2026-08-12 — LONG-ramp verdict: three stages, steps at ~19 and ~35 (dictated)

"For the long one — this is the closest, but it seems to get dense around 35;
quite sparse til 19, then step up. So essentially 3 stages: start to 19, 19 to
35 — no real sense of change [within stages]. I think focus on apex density.
What do you suggest for a smoother density curve, and can you explain the
mechanism?"

*(→ the sounding-count regime analysis (candidate finding 15): steps = count
crossings 1→2 (~t19, rate 1.5/s) and fuse-into-mass ~4.5 (~t35, rate 3.9/s);
geometric ramp spends 40% of its time below the polyphony threshold. dens2-long-ab
A/B: linear vs regime-engineered ramp; engine leg.mode 'linear'. DB 042.)*

## 2026-08-12 — Mix correction before ramp evaluation (dictated)

"Let's make some adjustments before I can evaluate ramp: there seem to be very
little or no expodec (these are the attack and quick decay?) — so 70/30
surge/other; other: 70/30 expodec/sine. And if possible just medium and short
envs for the other — any long should all be surge."

*(→ standing mix now {surge .70, expodec .21, sine .09}; alt species restricted
to tiers short+mid (altTiersMax engine dial); longs always surge. dens1-builds
regenerated.)*

## 2026-08-12 — Back to CC7; env research deferred; INTO MATERIALS: density builds (dictated)

"Let's keep this [KS] mode as a possibility but go back to all CC7 — I think
performers can achieve something closer to that. More research needs to be done
to nail down grain-env diversity; I'm not getting a concrete sense of what it's
doing, but let's defer — get into developing specific musical materials, the
recipe paradigm, for this piece, and hopefully get back to a thorough set of
experiments in the future. For now let's mix in some alternate grain-envs —
maybe something like 30%, random for now, maybe 70/30 in that portion rex/sin
[= surge .7 / sine .3]. Then can you generate some density curves — let's not
worry yet about 'least dense' unless that becomes necessary; I'm more interested
in the PERCEPTUAL DELTA of density. Generate a long, med, short, real-short
BUILD, sustaining max density for a while after each — long ramp from
not-so-dense to max density, etc. I'm more interested in CONTINUOUS change, so
calibrating that. Don't feel you need to use all 10 parts all the time — min
density might be just one part. Please generate, then do a mid-sesh wrap,
commit, push."

*(→ standing mix {surge .7, sine .3}, all CC7 (KS kept as option); dens1-builds
4-ramp battery; grain-env research → deferred/future; DB 041.)*

## 2026-08-12 — DH8 pinned; strategy to Penn State; KS-surge; AI-driven workflow (dictated)

"[DH8] Not quite sure how to characterize, but I have a sense of maybe how to
use — let's put a pin in it. Strategy to Penn State due date: get into the piece.
A few more things in the cloud research, but then into building a sound
(motives/gestures) toolbox for the piece, make the piece, back into the paper
FROM the piece — describing the process, research — then, if there's time,
augment the paper/engine with additional research. I do want to finish up the
grain, at least so it's useful; then develop the TRANSITION BEHAVIOR and SPEED
LIMITS — not unlike what we just did, but for all parameters, with 'density' as
the one dial. So: can I have the same but from surge to sin. Also a change to
the surge: use the crescendo KS patch for those — the C0 I believe, this is
cres without tail — and mind max length; I don't think we exceed it here, but
if we do we'll need to revert to CC7 for those. Finally: this AI-generated
save-score is working better than manual sandbox, so we'll continue this way —
maybe engage sandbox, but under AI control; might have to develop some two-way
infrastructure so you have realtime control of the web pages."

*(→ roadmap in PLAN §6; dh9 surge(KS)→sine; KS sonify mode in playback engine;
PLAN 5b two-way page control. DB 040.)*

## 2026-08-12 — DH6 verdict: illegible; drop quasi-gauss; staged introduction (dictated)

"Not what I expected — hard to provide analysis. Let's drop the quasi-gauss. Can
we have — what's the length? — so one length as before, surge; then over the same
length, introduce rex or exp — the attack-first one [= expodec]; then one full
length, mixed."

*(→ kept roster now {sine, expodec, surge}. DH7: three 18 s segments down one
timeline, same seed — pure surge · surge with expodec RAMPING IN across the
segment · full three-species mix. Engine: envMixRamp. DB 038.)*

## 2026-08-12 — Envelope elimination pass (dictated, FIRST REMOTE VERDICT via CRD)

"Envelopes: let's use 1 (sin?), 3 — is that tri-something? — and the penultimate
and the one before that, I presume expo/rexpo."

*(Catalog order: 1 sine · 2 gaussian · 3 quasi-gaussian flat-top · 4 triangle ·
5 trapezoid · 6 expodec · 7 surge · 8 sinc. Reading: KEEP {sine, #3 =
quasi-gaussian (not triangle — confirmation pending), expodec, surge}; CUT
{gaussian, triangle, trapezoid, sinc}. → DB 036v.)*

## 2026-08-12 — Infrastructure ask: the remote audition pipeline (dictated)

"A couple of infrastructure things: I would like to set up some Reaper and
composer functions — let's see if we can complete this task and build the
structures in doing. I would like to listen to examples remotely on my phone.
Start to finish: load a score in the composer score → record-activate the Reaper
record track → record in Reaper → play in the composer score → stop in Reaper →
load the file to Google Drive, jusyangster@gmail. Give me the plan of what needs
to be implemented and then I'll give the go."

*(→ plan presented; PLAN 5a opened pending go.)*

**Backup/reframe (same day):** "I have remote access, and a PC laptop as a remote
device as well as my phone — I just thought phone-listening via Google Drive
would be easiest. I also have a Hetzner share. The objective is twofold; the main
one right now is to LISTEN REMOTELY; second, less important, is to build some
automation infrastructure. Ideally, from the remote laptop (probably best
candidate) or phone, I can listen to the score examples AND watch the score in
real time. If that's too big a project, then the most expedient route to an audio
file I can listen to remotely — present some options."

*(→ options 1–3 presented: remote-desktop-with-audio first (zero build; ASIO
gotcha flagged) · async file/video pipeline via Hetzner/Drive · full live-stream
build deferred. PLAN 5a reframed.)*

## 2026-08-11 — Next: grain type; pitch fields enter (dictated)

"What is the next one to go for? Maybe grain type. Can you sort out a preview so I
can hear the new grain types — and in our three categories of durations, these
might need to be calibrated depending on the grain type. If you can give me all
the different grain types, I'll probably want to eliminate some. And then, just
for listening: can I hear DH5a — leave the existing one there — and further down
the timeline, a chromatic one: ten pitches in one octave, doesn't have to be
sequential. And then, again down the timeline, another one with stacked fourths
and fifths."

*(→ env-catalog regenerated at tier durs; dh5a-pitchfields: unison / chromatic /
quartal segments, same seed. DB 036.)*

## 2026-08-11 — DH5 verdict: both pass; the apex-stack loudness; pass-2 wrap (dictated)

"Both of those are good. A is good enough — so clumping is reduced. And B works as
well. I think the apex onsets are dense enough to still give it a dense feel. Also,
I'm hearing the SIMULTANEITY — vertical texture, chord-like, even though these are
unisons. There's a certain part of the end of the envelope that, when those are
stacked together, you get — not an attack, but a LOUDNESS there. Those are
interesting sounds and add to the field of density. I don't think we need to dial
those in, but if certain patterns emerge we could capture that sort of overlap as a
recipe, if I want to. Actually, any excerpts that sound particularly interesting
could be excerpted as well. That was a new observation: you get the quote-unquote
attack from the apex, but you also hear when several curves overlap in their
loudest parts. For now those two parameters are well explored and we have enough to
go with — we can fine-tune when all the parameters are in, and when I'm looking for
a particular type of texture in the actual piece. We're getting a good handle on
what the dials are and what their scale is. These were productive tests."

*(→ DB 034v verdict + RECIPE MAXDENSE-1 (DB 035); finding 14 apex-stack loudness;
keeper-excerpt practice adopted; PLAN 2b done.)*

## 2026-08-11 — DH4 verdict: midshift wins, go further; duration is multidimensional (dictated)

"Mid shift is better. I think we can go even more in this direction. The sonic
effect is: when you have several similar durations in a row, you get a CLUMPING
effect — not necessarily bad, but it becomes perceptually salient. If we have more
of an ALTERNATION of durations — and this might also go for grain envelope types
when we get there — you get a noisier, smoother texture. What I'm thinking is: the
APEX is fairly one-dimensional, it represents a point — the attack — so it's just
the statistical scattering; it'll give you one effect or another in the larger
texture. Whereas DURATION is multidimensional: you're hearing the differences in
duration AND you're hearing the repetition too. Even within parts — it's hard to
tell, could be globally as well. When I'm hearing a lot of short ones in a row it
has a particular, perceptible effect. I don't have a full grasp on this, but it
seems like the diversity dial needs to be on multiple dimensions for grain
duration. Give me your synthesis back, see if it merits another generation — in
the mid-shift direction, maybe even more."

*(→ synthesis; DH5 A/B: further mid-shift vs + global alternation pass; DB 034.
Sequence-level salience held as hypothesis — carve into law only after listen.)*

## 2026-08-11 — DH3 verdict: L2 spacing wins; long-end saturation; shorts clump (dictated)

"L2 is probably the best, the most distinct. It might be a slightly sliding scale:
all of the short ones sound the same, and as they get very long they all START
sounding long. One long one sounds the same as another quite-a-bit-longer one —
on the long scale there's a threshold: once it's of a certain length, everything
beyond that still sounds long. So the very long ones should be more exceptional,
more rare — use the extra-long ones FOR EFFECT, and have the long ones on the
shorter side be the go-to ones. The medium ones sound medium — the middle ones are
discernible, that's fine. For [L]2 I can hear the different grain shapes. And the
short ones — I think because you're hearing the apex maybe? — it sounds like
there's LOTS of short ones. So two is good for grain shape, but maybe there needs
to be fewer short ones in a row in any given part, or better blend."

*(→ L4 refined: both-ends saturation, 4 perceptual categories; ×2.75 adopted;
maxShortRun anti-clump in engine; DH4 A/B; DB 033.)*

## 2026-08-11 — Readback confirmed; directive: perceptual dur-diversity next (dictated)

"Yes. That's a great summary — aptly put. Thank you. So then let's see if we can…
the apex density is fine. Let's see if we can get that perceptual grain duration
and diversity in the next go."

*(→ bluntness principle carved as LAW L4; tiered duration model in the engine;
DH3 spacing ladder; DB 032.)*

## 2026-08-11 — DH2 observations: gaps read as figures; the perceptual-scale problem (dictated)

"A couple observations. When there are longer durations, they blend well. But when
there are gaps — a not-playing gap — they are plenty discernible. I think it was
L1: some of the parts had gaps, and they stood out, because they were prominent.
My guess is that if ALL the parts had gaps — and we can play with this in the
sparse section when we get there — and they were generally distributed, they might
not be as prominent. That's a guess. When the gaps were reduced it felt like a
more continuous texture; when there were gaps, there were pockets of activity,
interrupted, less continuous.

Second observation: at least for dur, and maybe also for onset, there is a SCALE
issue, for lack of a better term. I don't think we have the scale quite nailed.
Even though I see there's a diversity of shorter grain durs, the difference needs
to be GREATER to sense the diversity. Ballpark, from the image (L4, Tuba 8): most
of those sound too similar — maybe envelope/grain 6 of Tuba 8 [1.08 s], or grain 6
of Tuba 7 [1.47 s] — everything that size and under counts as ONE grain length.
Then you have a bigger gap [in value], and then an even longer one, and around
that range is similar. The grain durs need to be MORE DIFFERENT. And I know we're
dealing with the most dense, but when we start shaping, I imagine it's similar for
the apex distances — the spaces between apexes have to be bigger than we expect to
be able to detect [difference]. Mathematically it makes sense, but perceptually we
probably have to be more BLUNT about the difference in change in ALL the
parameters. Read this back to me in your own words so we're on the same page."

*(→ readback + the tiered-duration proposal; DB 031v pending confirmation.)*

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
