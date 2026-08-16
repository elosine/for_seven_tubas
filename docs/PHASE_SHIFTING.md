# PHASE SHIFTING — research, dials, and the recipe hunt

> Opened 2026-08-16 (PLAN 2j lineage). Purpose, in the composer's words: *isolate
> sound categories, isolate the dials that produce them, and learn the range of
> each dial* — "rapid fluttering happens when you're at this BPM, phase shifting
> over this much time, at this rate."
>
> Tool: `tools/phase_shift.js`. Scores: `phase01-*`, `phase02-*` in the Scores menu.

---

## 1 · The governing dial is DRIFT PER ATTACK, not shift duration

"Shift over 20 seconds" is not portable — it means something different at every
tempo and every target offset. The number that stays meaningful is:

- **drift** = **ms of offset gained per beat** (per attack, for a one-note-per-beat pulse)
- **attacks per lap** = how many attacks elapse while the offset traverses a *full* beat

They are the same fact stated two ways, and both are tempo-invariant. Every
recipe here is written in them; seconds are a consequence.

```
drift (ms/beat) = target_offset_ms / (shift_seconds / beat_seconds)
attacks per lap = beat_ms / drift
```

**Corollary that explains a lot: attacks per lap is the RESOLUTION of the
process** — how many discrete frames the ear is given between unison and
interlock. This is why a bare quarter-note pulse feels faster than Reich at the
same drift: his patterns are streams of 12 semiquavers, so hundreds of attacks
sample the journey. One attack per 600 ms gives you very few frames, and each
one lands as a visible step. **Pulse density is therefore a second dial.**

---

## 1B · The BEATING model — the one that makes a texture

Composer, 2026-08-16: *"a better metaphor is beating tones… you can calculate
and adjust the rate of deviating from unison to create faster and slower beats…
you can slide a note towards unison at a certain speed and create reliable
effects."*

**That is not a metaphor — it is the same arithmetic.** Two pulse trains at
rates f₁ and f₂ have a phase relationship that cycles at |f₁ − f₂|, exactly as
two detuned tones beat at their frequency difference. So a phase texture has the
same two parameters as a beating dyad:

| beating tones | phase texture |
|---|---|
| carrier frequency | **attack rate** R — the grain of the texture |
| beat frequency Δf | **lap rate** 1/T — how often the pair returns to unison |
| — | **attacks per lap** R·T — the resolution (see §1) |

**The whole formula, in musical units:**

```
lap time T (seconds) = 60 / (ΔBPM × players per voice)
ΔBPM = 60 × players per voice / T
```

Three consequences worth having in the front of the mind:

1. **A sweep is not needed.** Each group just holds a DIFFERENT STEADY TEMPO and
   the beating happens by itself, forever. No Reich-grade gradual accelerando,
   no phase discipline — the notation is "you are at 110, you are at 114."
2. **The flutter accelerates by detuning further.** Ramp one voice's tempo and
   T shortens continuously. That is the composer's "slide toward unison at a
   certain speed" — and it is calculable in advance, not found by trial.
3. **What you actually hear pulsating** is apparent density: at unison the two
   voices reinforce (rate R, doubled attacks), at interlock they interleave
   (rate 2R, even attacks). **The texture oscillates between R and 2R at the lap
   rate.** That alternation is the flutter.

### A VOICE IS A HOCKETED GROUP — this is where density comes from

One tuba cannot articulate fast enough to make a flutter: staccato rings ~0.42 s,
so ~2.3 attacks/s is the ceiling for one player. **So a voice is N players
round-robin on one composite pulse.** Composite rate = N × BPM/60 while every
individual player stays comfortable.

At **5 + 5 across the ten parts, 110 BPM each**: composite **9.2 attacks/s per
voice, ~18.5/s interlocked** — which lands right on the ~22/s ensemble ceiling
2t established, from the opposite direction. Per player: 0.545 s between attacks
against a 0.42 s ring. Verified: `audit_playability --parts` gives every part
1.66–1.72 attacks/s, **0 hard / 0 soft**.

---

## 2 · Reference points from the literature

| source | figure | status |
|---|---|---|
| Reich, *Drumming* | the moving player reaches **one full position ahead in ~20–30 s** | sourced |
| Reich, *Piano Phase* | shift completed over **4–16 repeats** of the figure; players hold each new relationship 4–8 repeats before the next shift | sourced |
| Frontiers 2023 phasing study | tempi **80–140 BPM**; **successful** trials averaged **21.2 taps per phasing lap**, failed ones **8.8** | sourced |
| Reich, *Music as a Gradual Process* (1968) | the process should be so gradual that hearing it is "like watching a minute hand" | the aesthetic target |

**Converted to drift** (assuming the study's 80–140 BPM band, i.e. a 600 ms beat
at 100 BPM — *this conversion is ours, not the sources'*):

- Reich's Drumming rate ≈ **12–18 ms/beat** ≈ **33–50 attacks per lap**
- The study's *executable floor* ≈ **21 attacks per lap** — that is how fast a
  trained player can still control the drift, **not** an aesthetic target
- `phase01-8th` (the first attempt: 85 BPM, 353 ms over 20 s) = **12.5 ms/beat,
  57 attacks per lap** — i.e. already at Reich's rate, and the composer's verdict
  was **"far too quick."**

**So the working conclusion is: for a bare pulse, we want to be several times
slower than Reich.** That is what `phase02-*` tests.

---

## 3 · The score set

Everything below: two tubas, **C3 (MIDI 48, Reaper C2)**, staccato, one attack
per beat, **100 BPM** (beat = 600 ms), target offset **300 ms = one eighth**,
**10 s held** at the target, 4 s unison at each end. The *only* variable is the
shift duration.

| score | shift each way | drift | attacks per lap | vs Reich | total |
|---|---|---|---|---|---|
| `phase02-s30` | 30 s | **6.0 ms/beat** | 100 | 2× slower | 80 s |
| `phase02-m60` | 60 s | **3.0 ms/beat** | 200 | 4× slower | 140 s |
| `phase02-l120` | 120 s | **1.5 ms/beat** | 400 | 8× slower | 260 s |
| *(`phase01-8th`)* | *20 s @ 85 BPM* | *12.5 ms/beat* | *57* | *same* | *60 s* |

A 2× ladder — wide enough that any real difference is unmissable.

**Note length: 0.12 s written.** The block is now a visual, not the sounding
length (§5).

### The BEAT set — `phase03-*` (2026-08-16)

Ten tubas, 5 + 5, all on C3 staccato, base 110 BPM. Only the tempo *difference*
changes, and that is the whole flutter dial.

| score | what | lap | ΔBPM | attacks/lap | length |
|---|---|---|---|---|---|
| `phase03-fluttermap` | six cells, slow → fast beating | 12 · 8 · 6 · 4 · 3 · 2 s | 1 · 1.5 · 2 · 3 · 4 · 6 | 110 · 74 · 55 · 37 · 28 · 18 | 137 s |
| `phase03-accel` | voice B ramps 110 → 118 BPM | ∞ → 1.5 s | 0 → 8 | — | 82 s |

`phase03-accel` is the **beating-tones demo**: starts in unison, one group
detunes steadily, the flutter accelerates continuously. Grey `lap N` markers
sit at every return to unison, so the accelerando is visible as the markers
bunch up.

**What to listen for, in both:** does the texture read as a *rate of flutter*
that you can hear changing, or as an arbitrary rhythm? The boundary between
those two is the finding.

---

## 4 · The listening ladder — categories to name

One slow shift traverses the whole perceptual range once, so **a single playthrough
IS the taxonomy, played as a continuum.** Each score carries grey markers where the
offset crosses each value, so the composer can name the category and read the
number straight off the timeline.

The boundaries below are **PREDICTED from general auditory grouping — they are
the thing the experiment replaces.** Overwrite them with what is actually heard.

| offset | predicted category | what it should sound like |
|---|---|---|
| 0–10 ms | **fused** | one attack, reinforced; thicker, not doubled |
| 10–30 ms | **thickened / comb** | still one attack, but the colour changes |
| 30–50 ms | **smear** | onset gets fuzzy; two-ness is ambiguous |
| 50–80 ms | **flam** | clearly ornamented single event (grace note) |
| 80–120 ms | **slapback** | two attacks, still grouped as one gesture |
| 120–200 ms | **doublet** | two separate events in an uneven rhythm |
| 200–280 ms | **lopsided / swung** | a limping two-beat, nearly even |
| 300 ms (½ beat) | **interlocked** | fuses into ONE even stream at double rate |

### Dwell time — the compositional dial

How long the music *sits inside* a category. This is what a recipe actually
specifies. `dwell = window_width_ms ÷ (drift ÷ beat_seconds)`.

| category window | s30 (10 ms/s) | m60 (5 ms/s) | l120 (2.5 ms/s) |
|---|---|---|---|
| fused (10 ms) | 1 s | 2 s | 4 s |
| thickened (20 ms) | 2 s | 4 s | 8 s |
| smear (20 ms) | 2 s | 4 s | 8 s |
| flam (30 ms) | 3 s | 6 s | 12 s |
| slapback (40 ms) | 4 s | 8 s | 16 s |
| doublet (80 ms) | 8 s | 16 s | 32 s |
| lopsided (80 ms) | 8 s | 16 s | 32 s |

*Read it backwards to compose:* want 15 seconds of flam? The flam window is
~30 ms wide, so drift must be 2 ms/s — `--out` = target_ms / 2.

---

## 5 · Note length: what is written vs what sounds

**Written block = 0.12 s** (`--notelen`), chosen so the score reads cleanly and
can run at rapid tempos. **The staccato sample rings ~0.42 s at C3** and 2n
established it is a fixed one-shot that ends itself — but *whether note-off
truncates it was never tested* (the same open question 2o raises for cuivre).

**This set doubles as that probe, at no cost:**
- if the short blocks sound the same as `phase01-8th` did → note-off does **not**
  truncate; the block is a harmless visual convenience
- if they sound clipped → note-off **does** truncate, which is a new dial
  (variable-length staccato) and D9 needs an amendment

**The one thing to watch:** the tool prints a `*** SAMPLE OVERLAP ***` warning
when the pulse gets tighter than the ring time. At 100 BPM the gap is 594 ms
against a 420 ms ring, so we are clear — but past ~140 BPM on a quarter-note
pulse, one player is physically double-sounding while the score still looks
clean. That is the `HARD occupancy uses sample length` question already in
`docs/NITS.md`.

---

## 5B · FIRST LISTENING — and why two voices always gallop

**Composer, 2026-08-16, on `phase03-fluttermap`:** cell 1 *"has a discernible
rhythmic pattern, more like a loop"*; cell 2 *"smoother, but still has a gallop —
not necessarily bad, but patterned"*; cell 3 *"just a different type of gallop"*.
**"None are producing a smooth flutter."** Also noticed: *"some phasing appears
almost like an accent or another line"* — akin to Reich's ghost notes — and a
*"phasor sound"* occasionally.

**The gallop is the model, not a defect.** Measured straight off the generated
onsets, the composite inter-attack intervals in cell 1:

```
near unison:   0  108   1  107   2  106   3  105  ...
quarter lap:  14   94  15   93  16   92  17   91  ...
later:        68   41  67   42  66   43  65   44  ...
```

Two even combs of slightly different spacing can only ever union into a
**two-element alternation** — short, long, short, long — whose ratio sweeps from
1:∞ (unison) through 1:1 (even, for one instant) and back. **A two-voice texture
is a gallop by construction.** Smoothness needs more voices (§5C).

**The two side observations are both real, and both worth keeping:**

- **The "accent / another line"** is the *resultant pattern*. When the two
  attacks land within a few ms they read as one louder, thicker event, so an
  accent pattern emerges that nobody is playing. This is the same phenomenon
  Reich's ghost notes exploit. It is free counterpoint — worth composing with
  rather than removing.
- **The "phasor" sound is literally flanging.** Two copies of the *same sample*
  0–20 ms apart comb-filter each other, and the comb sweeps as the offset drifts.
  **So below ~30 ms the phase relationship stops being rhythm and becomes
  TIMBRE.** That is a whole usable zone we had not identified: a ten-tuba unison
  whose colour is controlled by sub-30 ms tempo differences.

## 5C · SMOOTHNESS — `phase06-smooth`

If two voices gallop, use ten. Ten voices of one player each, **entering at
evenly staggered absolute times**, union to one perfectly even stream at
~18 attacks/s. The variable is then the **tempo spread** across the ten.

| cell | spread | outer lap | deviation from even (sd) at entry → +15 s |
|---|---|---|---|
| 1 | **0 BPM** | — | **0.4 ms → 0.4 ms** — dead even forever. *This is the control: what "smooth" actually is.* |
| 2 | 0.5 BPM | 120 s | 0.6 ms → 21 ms |
| 3 | 2 BPM | 30 s | 1.9 ms → 81 ms |
| 4 | 6 BPM | 10 s | 5.1 ms → 50 ms |

Each cell **starts even and degrades within its own 18 s**, so the transition
from smooth to figural happens inside the cell — the composer names where it
crosses rather than comparing across cells from memory.

**A design trap found by measuring, before it wasted a listen:** the first
version staggered each voice by a fraction of *its own* period. Because the
periods differ, that puts faster voices in the wrong absolute slot, and the
texture opened with a clump plus a hole (`30 31 32 33 34 35 36 224`). **The
stagger has to be in absolute seconds.** Fixed; entry is now even to 0.4 ms.

**What the degradation actually looks like:** evenly-spaced tempos spread the
voices' phases linearly, so they wrap past each other and re-converge — the
texture always fails toward *clump + hole*, never toward "irregular but even".
Whether the clumped state is a flutter or a figure is the ear's call.

## 5D · The JITTER TEST — `phase04-jitter`

The composer asked whether the unevenness is partly our own playback. Same
content as a score **and** as MIDI files, so the app and Reaper can be A/B'd:

- `midi/phase04-jitter-10track.mid` — one track per player, faithful routing
- `midi/phase04-jitter-1track.mid` — everything on one track, drag-and-drop
- **Notes are on channel 4 = Staccato**, which lives on the **`TubaNb SI2`**
  instances, not the main ones.

Three sections: a dead-even 18.3/s control, a dead-even 9.2/s control, then the
real galloping cell. **If the controls sound even in Reaper but uneven in the
app, the app's scheduler is adding jitter.** If they are even in both, the
gallop is entirely the material.

*Verified, not assumed:* the MIDI file was parsed back with an independent
reader — 517 note-ons matching the score one-for-one, channel 4, max onset error
**0.30 ms** (under one tick), and the two control sections measure 54.1–54.7 ms
and 108.8–109.4 ms between attacks. **The reference is clean**, so anything
audible is downstream of the file.

---

## 5E · THE COMPOSER'S CATEGORIES — and the two dials they need

**Verdicts on `phase06-smooth` (2026-08-16), verbatim enough to build on:**

| cell | composer |
|---|---|
| spread 0 | *"a bit of a smear effect — not quite sustained tone but approaching that. Still can hear all the articulations. Doesn't sound like a gallop, but a little regular, not quite pulsed. **An articulated smear.**"* |
| spread 0.5 | *"approaching **rain**, but still some discernible patterning within — somewhere between gallop and rain."* |
| spread 2 | *"starts out rain, then at ~52 s jumps into a **stuttery pattern** with a loop characteristic, some sort of accent. **Rain to gallop relatively abruptly** — the transition wasn't smooth."* |
| spread 6 | *"resolves pretty quickly into **pulse**. The transition isn't very prominent — rain, then pulse, with some smear in between."* |

Also, and it governs the whole search: *"the gallops aren't disqualifying, they
just are what they are… the point is to use phase shifting to find interesting
textures."* **`rain` is a keeper. `articulated smear` is a keeper.**

### The naming, adopted

**smear → rain → stutter → pulse**, in order of increasing irregularity. These
are the composer's words and they are now the category names.

### Why the transitions were abrupt, and why rain could not be held

`phase06` had **one dial doing two jobs.** Every cell started perfectly even and
the tempo spread drove the irregularity upward *over time* — so the texture was
always sliding, could never sit anywhere, and the perceptual snap from rain to
stutter arrived as a jump. **They are two independent dials:**

| dial | what it is | what it sets |
|---|---|---|
| **SCATTER** | how irregularly the voices sit inside the cycle | **which category** — smear · rain · stutter |
| **SPREAD** | tempo difference between voices | **how fast the category changes** — 0 = static, forever |

With spread at **zero** a texture is *static*: rain that stays rain for as long
as you want it. That is what makes these usable as material rather than as
demonstrations.

## 5F · `phase07-scatter` — the categories, held still

Ten voices, one player each, **all at exactly 110 BPM** (so nothing drifts), each
displaced inside the cycle by a seeded random amount. Measured deviation from
even, early in the cell → late in the cell:

| cell | scatter | sd early → late | predicted category |
|---|---|---|---|
| 1 | 0 | **0.1 → 0.1 ms** | articulated smear (the control) |
| 2 | 0.03 | **6.4 → 6.4 ms** | smear, just loosened |
| 3 | 0.08 | **21.5 → 21.3 ms** | ? — the boundary is expected here |
| 4 | 0.2 | **32.6 → 33.0 ms** | rain |
| 5 | 1.0 | **46.2 → 46.1 ms** | uniform random — literal rain |
| 6 | 0 → 1 over 20 s | **4.2 → 43.8 ms** | **the morph**: smear dissolving into rain |

Early ≈ late in every static cell — **the textures genuinely hold.**

**Cell 6 is the primitive the composer asked for weeks ago** — "make the flutter
more pronounced, less pronounced, in waves". Scatter *is* the pronouncedness dial.
Ramp it for a dissolve; oscillate it for waves.

**What scatter cannot make: pulse.** Pulse came from voices *converging* on each
other, which is a spread effect. So pulse is the one category that needs drift.

---

## 6 · COUNTERPOINT vs SOUND MASS — the second objective

Composer: *"several of these going at the same time in different tempos. My
previous experiments in the past, they kind of blend into a single texture. I'm
trying to see if there are tweaks — pitch, articulation — where we can push it
more into the counterpoint range."*

**The blending is not bad luck — the current setup is maximally FUSING on every
known cue at once.** Auditory streaming splits a texture into separate lines when
the lines differ; ours are identical in pitch, identical in timbre, identical in
attack rate, and share one location. Change any of those and they come apart.

**The segregation levers, strongest first:**

1. **Register separation.** The single most powerful cue. Two streams a wide
   interval apart segregate almost regardless of anything else, and the faster
   the rate, the *smaller* the interval needed. Concretely: voice A at C3, voice
   B at F1 or G4 rather than both on C3.
2. **Timbre / articulation.** Also very strong, and the composer already reached
   for it — *"mixing in some different tone type things."* staccato vs fortepiano
   vs cuivre vs flatterzunge are genuinely different spectra here, not shadings.
3. **Attack rate that is not a simple ratio.** Two voices at 110 and 114 fuse
   *because they are nearly the same rate* — that is what makes the beating work.
   For counterpoint the rates must be far apart AND not simply related (110 vs
   137 rather than 110 vs 220, which locks into a polyrhythm and re-fuses).
4. **Loudness.** One voice foregrounded reads as figure against ground.
5. **Spatial position.** *Real in performance, absent from the mock-up.* Ten
   tubas spread across a stage separate strongly by direction — and every port
   here is the same instrument with no panning, so **the mock-up is
   systematically biased toward mass.** A texture that blends in the render may
   well come apart in the hall. Do not settle this question on the mock-up alone.

**The tension to be aware of:** beating (§1B) requires two *nearly identical*
rates, and counterpoint requires *different* ones. So a flutter voice is best
treated as ONE object, and counterpoint is built between **two flutter pairs** —
e.g. 5+5 becomes (3+3 at C3) against (2+2 at F1, cuivre, a different lap rate).
That is the next build, and it wants the flutter verdicts first.

## 7 · Clip → morph — the workflow, which already exists

Composer's conception: *"generate examples with pockets of interesting sounds,
clip those, and create shapes that will morph."* Nothing new is needed for this:

- **Find** — play a battery, note the time where it gets interesting.
- **Clip** — `tools/extract_section.js` (already used to lift DB3's section E).
- **Bank** — `tools/bank_gesture.js` writes it to `bank/<NAME>.json` (2w).
- **Recall** — `tools/place_gesture.js --at <time>` drops it into any score.
- **Morph** — the parameters are analytic here, so "make the transition quicker"
  or "make the flutter come in waves" is a regenerate, not an edit: modulate
  ΔBPM over time. A *wave* of flutter = ΔBPM oscillating instead of ramping.

So the loop is: **battery → composer names the pocket → regenerate that pocket
alone with the shape you want.** Clipping the audition render is the fallback,
not the primary path, because regenerating keeps it parametric.

## 8 · Open — next dials, in order

1. **Flutter verdicts** (§9) — everything below waits on these.
2. **Wave / non-linear ΔBPM** — flutter that swells and recedes rather than
   ramping. One parameter change once §1B is confirmed.
3. **Counterpoint battery** — §6's levers, two flutter pairs.
4. **Mixed articulation inside a voice** — the composer's "extra blade in the
   drawer": long tones or fortepiano woven through the staccato flutter.
5. **Note-off truncation** (§5) — decides the density ceiling for everything.

## 9 · Verdicts (fill in by ear)

| score | verdict | notes | keep? |
|---|---|---|---|
| `phase02-s30` / `m60` / `l120` | | which drift reads as "gradual" | |
| `phase03-fluttermap` | | which lap times read as *flutter* vs rhythm | |
| `phase03-accel` | | does the acceleration read as one continuous change | |

**Sources:** [Reich — Piano Phase](https://stevereich.com/composition/piano-phase/) ·
[Frontiers 2023, phasing performance study](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1207646/full) ·
[Piano Phase (Wikipedia)](https://en.wikipedia.org/wiki/Piano_Phase)
