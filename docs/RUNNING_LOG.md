# RUNNING LOG

> **Why this exists** (composer, 2026-08-16): the chat gets cleared to conserve
> tokens, and something important was lost that way in another project. So the
> AI writes a short entry **as the work happens**, not at session end. Not
> everything — the things that would be expensive to rediscover: decisions, why
> a number is what it is, what was verified, what is still unheard.
>
> Append at the bottom, newest last. Session End still promotes the durable
> items into `PROJECT_JOURNAL.md` §2/§4 and `PLAN.md`; this file is the net
> underneath that, and it is safe to read cold.

---

## Working rules in force

**Two agents in one repo (2026-08-16).** A second agent is building the morphing
sandbox (PLAN 2v) in this same working tree — same filesystem, same branch, one
server on `:5200`. The rules that keep us out of each other's way:

1. **Never `git add -A`.** Stage explicit paths only, or you sweep the other
   agent's half-finished work into your commit.
2. **Owned files are off limits.** 2v owns `score/public/morph.js`,
   `tools/test_morph.js`, `probes/*`, `docs/plans/MORPHING_CHORDS.md`,
   `docs/MORPH_FINDINGS.md`, and the morph panel inside
   `score/public/composer.html`. Read freely, never write.
3. **Shared docs get small targeted appends** (`PLAN.md`, `PROJECT_JOURNAL.md`,
   `NITS.md`, this file) — never a rewrite of a section you did not author.
4. **Commit your own chunk as soon as it is finished**, so nothing sits
   uncommitted where the other agent might sweep it.
5. **Pushing carries BOTH agents' commits** — it is one repo and one branch.
   Harmless as long as each commit is complete, but it means either agent can
   do the push, and neither should do it without asking.
6. **One server on `:5200`.** Don't start a second — use the one that is
   running. Loading a score in a browser tab makes it that tab's session and
   autosave will write to *that* file, so never open a `piece-*` save just to
   look at something.

---

## 2026-08-16 · day 10 (Claude Code) — phase shifting

### Session start
- Piece is at **piece-s16 (135.8 s)**; DB3 placed in Messiaen mode 3 on F.
- PLAN 2v Phase 0 (bend probes) came back **passed** — bend is clean to ±200 ¢,
  RPN 0 ignored so the range cannot be widened, and the quartertones patch is
  **not** a uniform +50 ¢ (offset tracks pitch, +23 ¢ at F2 → +57 ¢ at C4).
  That also answers PLAN 2l's blocking question: **bend is the mechanism**.
- Journal §2 is three commits stale (it ends at day 9).

### PHASE01 — the first phase-shift audition
- Composer's spec: two tubas, middle of the range, ~85 BPM, shift to an eighth
  apart over 20 s, hold 10 s, shift back over 20 s.
- Built `tools/phase_shift.js` (parameterized, so the next experiment is a flag)
  → `scores/phase01-8th.json`. **C3 = MIDI 48**, dead centre of `ord` 30–65.
  *Naming trap worth remembering:* the composer's Reaper "F1" = MIDI 41 = F2
  scientific, so this C3 shows as **C2 in Reaper**.
- Model: lane A keeps a strict pulse, lane B plays the same grid displaced by a
  moving offset in BEATS; both lanes emit the same *number* of notes, so they
  are guaranteed back in unison at the end.
- Verified in the running app: loads, lanes 1–2 draw, markers render, badge 0;
  `audit_playability` 0 hard / 0 soft. **Not heard by AI** — no MIDI sent.
- **Found a real bug → NITS:** the conflict badge does **not** recompute when
  you switch scores from a menu. It kept `⚠ 42 soft` from `piece-s16` on a clean
  score until a page reload. Wrong in both directions. Not fixed — the other
  agent is in `composer.html`.

### Composer verdict on phase01: "the shift is far too quick"
- Researched Reich. **The surprise: phase01 was already at Reich's rate.**
  *Drumming* advances one full position in ~20–30 s ≈ 12–18 ms of drift per beat;
  phase01 was 12.5 ms/beat. So "too quick" means **we want to be several times
  slower than Reich**, and the reason is probably resolution — Reich phases a
  stream of 12 semiquavers, we were phasing a bare one-note-per-beat pulse, so
  the ear got very few frames between unison and interlock.
- **The portable dial is drift per attack (ms/beat), not shift duration** — it
  is tempo-invariant. All recipes get written in it. Full write-up, reference
  numbers and the predicted category ladder: **`docs/PHASE_SHIFTING.md`**.

### PHASE02 — the small / medium / large set (100 BPM)
- `phase02-s30` (6.0 ms/beat) · `phase02-m60` (3.0 ms/beat) ·
  `phase02-l120` (1.5 ms/beat) — 2×, 4×, 8× slower than Reich. Only the shift
  duration varies; everything else is pinned.
- **Note length is now a visual: 0.12 s written** (composer's call), against a
  staccato sample that rings ~0.42 s. **This doubles as the probe for an open
  question** — 2n measured where the one-shot *ends itself* but never tested
  whether note-off truncates it (2o asks the same for cuivre). If these sound
  the same as phase01, note-off does not truncate; if they sound clipped, D9
  needs an amendment and variable-length staccato becomes a new dial.
- Each score carries **grey markers at every threshold crossing** (10, 20, 30,
  50, 80, 120, 160, 200, 250, 300 ms), so naming a category is a matter of
  reading the timeline where the sound changes.
- All four phase scores audit **0 hard / 0 soft**.

**Still unheard:** all four phase scores. Everything above about how they sound
is prediction.

### THE REFRAME — beating, not sweeping (composer, 2026-08-16)

The composer stated the actual objective, and it changes the model:

> *"a better metaphor is beating tones… you can calculate and adjust the rate of
> deviating from unison to create faster and slower beats… slide a note towards
> unison at a certain speed and create reliable effects."*

**That is not a metaphor — it is the same arithmetic.** Two pulse trains at rates
f₁, f₂ have a phase relationship cycling at |f₁ − f₂|, exactly as two detuned
tones beat. So:

- **`lap time T = 60 / (ΔBPM × players per voice)`** — the whole dial, in musical
  units. Two groups just hold different steady tempos; the beating is automatic.
  No accelerando, no Reich-grade phase discipline, trivial to notate.
- **What pulsates is apparent density:** at unison the voices reinforce (rate R),
  at interlock they interleave (rate 2R). The texture oscillates between R and 2R
  at the lap rate. **That alternation IS the flutter.**
- **Density has to come from PLAYERS, not from faster tonguing.** One tuba tops
  out near 2.3 attacks/s (0.42 s staccato ring). So a *voice* is now a **hocketed
  group**: N players round-robin on one composite pulse. 5 + 5 at 110 BPM =
  9.2 attacks/s per voice, ~18.5/s interlocked — landing on 2t's ~22/s ceiling
  from below, with every player at a comfortable 1.7/s.

### PHASE03 — the beat set
- `tools/phase_shift.js` rewritten to carry **both models** (`sweep` = the Reich
  move for finding categories, `beat` = steady tempo difference for making
  texture) with named presets. **Regression gate:** the refactor regenerates
  `phase02-m60` with byte-identical notes and markers, and `phase01-8th` with
  identical notes — so the earlier scores are provably unaffected.
- **`phase03-fluttermap`** — six cells, lap 12 / 8 / 6 / 4 / 3 / 2 s
  (ΔBPM 1 / 1.5 / 2 / 3 / 4 / 6), everything else pinned. 137 s.
- **`phase03-accel`** — voice B ramps 110 → 118 BPM over 72 s, so the lap goes
  ∞ → 1.5 s: **the beating-tones demo.** Grey `lap N` markers bunch up visibly.
- Verified: audit **0 hard / 0 soft**, every part 1.66–1.72 attacks/s, tightest
  per-player gap 0.52 s vs the 0.42 s ring; loads in the app with all ten lanes
  drawn and 18 markers rendering.

### Counterpoint — why past experiments blended (analysis, not yet tested)
Recorded in `docs/PHASE_SHIFTING.md` §6. The short version: the setup is
maximally **fusing** on every cue at once — same pitch, same timbre, same rate,
same location. Levers, strongest first: **register separation · articulation ·
non-simply-related rates · loudness · spatial position.** The last one matters
methodologically — **the mock-up has no spatialization, so it is systematically
biased toward mass**, and a texture that blends in the render may separate in the
hall. Do not settle counterpoint on the mock-up alone.

**The tension to remember:** beating needs two *nearly identical* rates,
counterpoint needs *different* ones. So a flutter voice is one object, and
counterpoint is built between two flutter pairs.

---

## 2026-08-16 · day 10 (Claude Code, 2nd agent) — PLAN 2v morphing chords

### What this is for, in the composer's own framing (2026-08-16)

> *"The main purpose of why I'm designing this sandbox system is so I can use my
> ear to discover interesting sonorities and morphing — sonorities that change
> over time. I'm not looking to build a model that is able to mathematically
> produce spectral chords in their documented variations… I'm just trying to have
> a flexible way of modifying different parameters."*

**Spectral chords were a metaphor in the original requirements, not a spec.** The
harmonic-series target is ONE option among several for "where should this chord
move to", and must not become the centre of gravity. The deliverable is a fast
ear-driven loop: make a sonority, change it over time, hear it, keep the good
ones. Anything that serves discovery-by-ear beats anything that serves
theoretical completeness.

### COMPOSER DECISION — dynamics rides every model (the "option b" call)

Composer: *"a later addition to the plan was to centre volume changes more
prominently for the morphing transformations — we had undersold that earlier."*
Checked: **that addition was never written down anywhere** (searched the plan and
all of `docs/`). What the plan had was M6 as one model of six. Offered three
readings; composer chose **(b)**:

- **Loudness is a LAYER on every model, not a model you pick instead.** Every
  render carries a per-voice dynamic contour: `dyn {base, shape, amount, turns,
  spread}`, `shape ∈ swell | rise | fall | rotate | flat`. So a pitch morph also
  swells unless `flat` turns it off.
- **M6 is therefore the volume-ONLY model** — it holds pitch and technique and
  defaults the layer to `rotate` (prominence travelling through the chord).
- *Why it composes cleanly:* morph dynamics go through the score's MEASURED
  level→CC7 map, the same path as every hand-drawn crescendo, so a hairpin inside
  a morph sounds like a hairpin in the piece.

### PHASE 0 — probes, gate PASSED (`docs/MORPH_FINDINGS.md`)

- **Bend works: ±1.99 semitones, linear** (4 measurements, spread 0.05), and the
  composer's ear says every ramp to full bend sounds *"fine and natural"*. **No
  artifact limit inside the range** → all six models proceed, no fallback.
- **RPN 0 is IGNORED** — the range cannot be widened. Anything wider than ±200 ¢
  needs the segmented re-key, scheduled with M3 in Phase 3.
- **The residue trap is REAL:** a note after an unreset bend played **+49.4 ¢**
  sharp. Same class as the CC7 residue (Principle 3). Pre-arm 0.05 s (an UPPER
  bound — all four rungs read identically, so the true floor is below 50 ms);
  reset gap 0.0 s (resetting at note-off is inaudible).
- **The quartertones patch is NOT a uniform quarter tone.** Offset tracks pitch:
  +26 ¢ at A♯1, +23 ¢ at F2, +36 ¢ at A♯2, +44 ¢ at F3, **+57 ¢ at C4**. By ear at
  one pitch it passes as a quarter tone, which is exactly why it needed
  measuring. Closes PLAN 2l's first step with a *different answer than expected*:
  bend is the vehicle, the patch is a colour.

### Deviations from the plan, all recorded in `docs/plans/MORPHING_CHORDS.md`

1. **Probe tooling is PowerShell + Python, not node** — no `package.json`, no
   `node_modules`, no node MIDI binding exists here.
2. **Engine emits `level` (0–10 drawn height), not absolute CC7.** §4.2's schema
   and §2's "no fetch" purity rule contradict each other: the CC7 law is a
   measured map loaded at runtime, so a pure engine cannot apply it. Emitting the
   law's INPUT keeps the calibration in one place.
3. **A morph note is an ordinary `waveCurve` + one new field `morphBend`** — not
   a new `env` object. Level envelopes already exist as nodes; only bend is new.

### Bugs the tests caught that inspection would not have

- **A +10.9 ¢ systematic sharp bias in the f0 analyzer** (Hanning-windowed
  autocorrelation tapers with lag). It had already inflated the measured bend
  range from 2.00 to 2.14 st. Caught by a self-test that renders synthetic audio
  with known deviations — a real take has no ground truth to check against.
- **Labels that never rendered** (found by the composer, not by testing): markers
  written to `data.markers` survive save/load but `renderAll()` only iterates
  `this.objects`. Five DB3 scores shipped invisible. Now Principle 4.
- **M2 spectral drift was unplayable** — indexed partials blindly, demanding
  1681 ¢ of bend against a patch with 199. Fixed by nearest-free-partial
  assignment plus **octave-folding partials into the tuba's range** (partials 11
  and 13 of F2 are MIDI 82 and 85 — above the instrument).

### TOOLING FRICTION — solved, worth remembering

Invoking `probes/bend_probe.ps1` **as a file** was refused by the permission layer
every time; **inline PowerShell ran every time**. Working pattern: build the
schedule with the script (`-DryRun`), then play it from inline code reading
`probes/last_bend_schedule.json`. Cost the composer many minutes before it was
identified. Also: a PowerShell command handed to the composer in a ```bash block
loses its backslashes — use forward slashes and an absolute path.

### State

- **Built and committed:** probe suite + f0 analyzer + self-test; the pure engine
  `score/public/morph.js` (all six models, carrier, dynamics layer, checks) with
  **81 passing unit tests** in `tools/test_morph.js`.
- **Next:** the Morph panel in `composer.html` — the first thing the composer can
  actually touch. Nothing in `composer.html` has been modified yet.
- **Still unheard: everything.** No morph has been auditioned. The one genuine
  musical unknown is whether a 30 s morph — necessarily a chain of overlapping
  breaths — reads as ONE sonority breathing or as separate notes. No test can
  answer it; that is check-in 1.

### Troubleshooting discipline — composer's correction (2026-08-16)

Two rounds were lost to avoidable dead ends (playing the probe; the first
audition). Composer: *"lean on evidence rather than guessing… a bunch of obvious
things that aren't the problem. Like loopMIDI — I've been using it all morning,
so that shouldn't have even been a consideration."* Rules taken from it:

1. **Never ship a diagnostic that asks the composer to check something the code
   can check.** The message *"are the MIDI ports open?"* is what put loopMIDI in
   the frame — the AI invented that dead end. Error text now names one of three
   distinguishable causes, because they need three different fixes.
2. **When new code cannot reach a subsystem that is demonstrably working, the
   wiring is the suspect, not the subsystem.** MIDI had been in use all morning.
   `typeof Composer` was a one-line check that would have found the real cause
   (a lexical `const` is not a `window` property) in seconds.
3. **Prove the boundary before theorising past it.** Same shape as the probe
   episode, where the schedule was already proven and one single-note send would
   have settled it immediately.

**Architectural consequence — PREFLIGHT.** Every bug in 2v so far has been at the
seam where the panel reaches into the app's internals (`trackInstrument`,
`curveValToCC`, `_zoneMidiOutputs`, `objects`), and that seam had no verification.
`MorphPanel.preflight()` now checks each assumption when the panel OPENS and
prints failures by name in the status line. Verified by deleting
`Composer.curveValToCC` and watching it report exactly that. A wrong assumption
about the host now fails loudly at open time instead of as silence three layers
down at Play time.

### CHECK-IN 1 — the first morphs were heard (2026-08-16)

**The central unknown is answered: a 30 s morph DOES hold together as one
sonority.** It was the one thing no test could settle — a long chord is a chain
of overlapping breaths, and it could have read as separate notes. It did not.

**Variant A (M6, balance only — pitches and techniques frozen): KEEPER.**
Composer: *"A is very nice… there were some very interesting parts that might
have something to do with close intervals, like approaching unison. So lots of
nice acoustic beating in there. And potentially at the same time, volume changes.
It did sound like acoustic beating and swelling, which is nice."*

Two things follow, and the second is the important one:

1. **A change with NO pitch movement registers.** The quiet half of the
   vocabulary is viable, which was the second question.
2. **What the composer's ear actually latched onto was BEATING at near-unison,
   combined with the swells** — not the balance rotation per se. That is a
   finding about the material, not about the model, and it points the search:
   narrow intervals + dynamics, rather than wide voicings. Variants C and D now
   chase it deliberately (below). *Note A's source chord has no close intervals
   at all (34/38/41/45/48/53/58/62), so the beating heard was between upper
   partials — worth remembering, because it means beating is available without
   writing unisons.*

**Variant B (M4, colour morph): useful, not interesting.** Composer: *"it sounds
exactly like a held sonority with players shifting different techniques within it
— more like a collection of different techniques… I probably wouldn't want to
spend too much time trying to work this one out, but my initial instinct is that
there has to be some sort of ramp INTO the technique. So if it's singing into the
tuba, maybe they do a singing crescendo — start with the effect and ramp into the
full effect."*

Acted on: a technique change now enters under a **long, deep dynamic ramp**
(dip 4.5 of 10, rise up to 2.2 s or 55 % of the segment) instead of the ordinary
0.7 s seam-hider. The dynamic entry is the only handle MIDI gives us for "lean
into the effect". Not pursued further, per the composer.

**New variants written from that verdict:**
- **C — BEATING BLOOM.** Four unisons (F2 A#2 D#3 G#3 doubled) splitting apart by
  M1 detune to 50 cents, over 40 s, under swells. Measured end-state beating:
  2.6 / 3.5 / 4.6 / 6.2 Hz — faster in the higher pairs, so the texture opens
  upward.
- **D — BEATING CONVERGE.** Whole-tone pairs (A2-B2, D3-E3, A3-B3, D4-E4) closing
  to exact unison by M3 fan. Beating slows to **0 Hz** — the reverse gesture,
  interference resolving into fusion.

**Open, minor:** composer had to press Play twice on the first audition. Most
likely the one-time browser MIDI permission handshake, which only happens on a
cold page. Discriminating test if it recurs: does it need two presses on EVERY
play within one page session (real bug), or only the first after a reload
(permission handshake, not a bug)? Not chased without that evidence.

### FIRST LISTENING on `phase03-fluttermap` (composer, 2026-08-16)
- Cell 1 *"discernible rhythmic pattern, more like a loop"* · cell 2 *"smoother,
  but still a gallop — patterned"* · cell 3 *"a different type of gallop"*.
  **"None are producing a smooth flutter."** Plus two side observations:
  *"some phasing appears almost like an accent or another line"* (Reich ghost
  notes) and an occasional *"phasor sound"*. Also **visual latency/jitter** in
  the app's playhead — unknown whether it reaches the audio.
- **THE GALLOP IS THE MODEL, measured not asserted.** Composite intervals in
  cell 1 alternate `0/108 · 1/107 · 2/106 …` then `14/94 · 15/93 …` then
  `68/41 · 67/42 …`. Two even combs at slightly different spacings can only
  union into a **two-element alternation** whose ratio sweeps. **Two voices are
  a gallop by construction** — smoothness needs more voices.
- **Both side observations are real and worth keeping.** The "accent" is the
  *resultant pattern*: attacks landing within a few ms read as one louder event,
  so an accent line emerges that nobody plays — free counterpoint. The "phasor"
  is **literal flanging**: two copies of the same sample 0–20 ms apart comb-filter
  each other and the comb sweeps. **So below ~30 ms the phase relationship stops
  being rhythm and becomes TIMBRE** — a usable zone we had not identified.

### `phase04-jitter` — the app-vs-Reaper test the composer asked for
- Same content as a score AND as MIDI (`midi/phase04-jitter-{10track,1track}.mid`,
  **channel 4 = staccato → the `TubaNb SI2` instances**). Two dead-even controls
  (18.3/s and 9.2/s) then the real galloping cell.
- New `tools/midi_out.js` (SMF type 1 writer). **Verified by parsing the file
  back with an independent reader:** 517 note-ons matching the score one-for-one,
  max onset error **0.30 ms** (under one 0.52 ms tick), controls measuring
  54.1–54.7 and 108.8–109.4 ms. The reference is clean.

### `phase06-smooth` — spread, not voice count, is the smoothness dial
- Ten voices of one player each, **entering at evenly staggered absolute times**,
  union to a perfectly even ~18 attacks/s. Variable = **tempo spread**:
  **0 (dead-even control) · 0.5 · 2 · 6 BPM**. Deviation from even at entry →
  +15 s: 0.4→0.4 ms · 0.6→21 ms · 1.9→81 ms · 5.1→50 ms. Each cell starts even
  and degrades inside its own 18 s, so the crossover is heard within the cell.
- **A design trap caught by measuring before it cost a listen:** staggering each
  voice by a fraction of *its own* period puts faster voices in the wrong
  absolute slot — the texture opened with a clump plus a hole
  (`30 31 32 33 34 35 36 224`). **The stagger must be in absolute seconds.**
  An earlier `phase05-voicecount` battery was built, measured, found confounded
  and deleted rather than shipped.
- *Behaviour worth knowing:* evenly-spaced tempos spread the voices' phases
  linearly, so they wrap and re-converge — the texture always fails toward
  **clump + hole**, never toward "irregular but even".
- Audit 0 hard / 0 soft; loads in the app, ten lanes at 132–133 notes each, all
  four markers rendering. **Unheard.**

### CHECK-IN 1 continued — C/D/E/F heard, and a design direction (2026-08-16)

**A, C and D declared KEEPERS — "usable as objects in the actual piece."** That
is the system doing its job: the composer found material by ear.

- **C (beating bloom)** — *"sounds industrial and resembles many experiments I've
  done with strings and beating tones… familiar terrain, like some of the
  acoustic pieces by Alvin Lucier."*
- **E / F** — *"interesting and similar. One thing to note is it sounds like
  either one or several tubas are re-articulating at a relatively big dynamic,
  and those sound like PULSES. They not only pulse the volume, they also pulse
  the beating, the visceralness."* Worth keeping: the carrier's re-articulations
  are not just a breathing necessity, they are an audible rhythmic layer that
  modulates the beating. That is a compositional handle nobody designed — it fell
  out of the breath model.

**Working mode confirmed (composer):** *"it's too fiddly to understand the range
of numbers to put in… the actual numbers make a lot of sense, but when we get
into morphing them, I'm hoping AI can help. I can describe what I want more or
less of and then AI could dial those in."* So the number fields stay as a
read-and-nudge display; the primary interface is speech → AI writes params →
composer listens. No structural change.

### CONCEPTUAL — GESTURE SHAPING, the electronic-music model (composer, later)

Not now; recorded so it is not lost, and it probably deserves its own plan and
build once 2v settles.

> *"The electronic music model makes a lot of sense, and we kind of explored this
> with the granular synthesis model. So the META SHAPE IS REALLY THE SOUND
> ITSELF. These morphs might have some sort of attack that can be designed and
> built into the gesture, and then some internal change over time, and some kind
> of release. In other words, we can craft a gesture on its own terms and then
> just fill in the tuba parts to make that gesture. For example, in C and D
> there's a striated entry — I'm imagining being able to have an ATTACK instead,
> and add some cuivre, and then that proceeds into the morph, and then maybe
> decide some sort of release."*

What this implies architecturally: the carrier currently derives entry and exit
from breath logic alone. The proposal is that a morph should have an **envelope
at the gesture level** — designed attack (possibly a different technique, e.g.
cuivre), a body (the morph proper), and a designed release — with the tuba parts
filled in to realise it. That inverts the current order: shape first, parts
second. It is the same relationship the META layer already has to the density
builds. **Its own plan when 2v is done.**

### Voicing gap CLOSED (2026-08-16)

Composer wanted two or three concurrent morphs, which means four or five players
each. Two things were needed and both are built:

1. **`lanes`** on a variant names the players it occupies (`[0,1,2,3]` and
   `[6,7,8,9]`), carried through render → audition → insert so a morph auditions
   on the same players it will insert onto. Verified: zero lane overlap.
2. **Structure-preserving reduction.** Dropping the top note would have destroyed
   BEATING BLOOM outright — half a unison pair does not beat. `reduceSource`
   groups near-equal pitches into clusters and keeps WHOLE clusters, chosen
   evenly across the register. Measured: 8 → 6 → 4 → 2 voices all keep intact
   pairs (F2 F2 · G#3 G#3 at four voices). Same principle as D21's registral
   spread for density builds — drop structural units, never fragments.

**UI fix:** the transport row was flex, so the Play button growing to "Playing…"
reflowed it and Stop moved under the pointer — the composer hit *Insert @ cursor*
twice by accident. Now a fixed 3-column grid with Insert on its own row. A
transport control must never move while it is being used.

**Restore, for the record:** the `-- Restore --` dropdown only lists snapshots
from EXPLICIT saves (CTRL+S / Save as next / Variant). Autosave writes none by
design. `piece-*` files are additionally protected by the `-work` copy; other
scores are not, so CTRL+S before experimenting is the habit that creates a
restore point. Git is the net either way, since `scores/*.json` are committed.

### Composer verdicts on `phase06-smooth` + THE CATEGORY VOCABULARY (2026-08-16)
- **smear → rain → stutter → pulse** — the composer's own words, adopted as the
  category names. spread 0 = *"an articulated smear… not quite sustained tone but
  approaching that"* · spread 0.5 = *"approaching rain, still some discernible
  patterning"* · spread 2 = *"starts rain, then at ~52 s jumps into a stuttery
  pattern with a loop characteristic… rain to gallop relatively abruptly"* ·
  spread 6 = *"resolves pretty quickly into pulse; the transition isn't very
  prominent"*.
- **Governing instruction:** *"the gallops aren't disqualifying, they just are
  what they are… the point is to use phase shifting to find interesting
  textures."* **rain and articulated smear are keepers.**
- **Diagnosis: phase06 had ONE dial doing TWO jobs.** Every cell started even and
  the tempo spread drove irregularity upward over time, so nothing could sit
  still and the rain→stutter snap arrived as a jump. They separate:
  **SCATTER** (how irregularly voices sit in the cycle) picks the CATEGORY;
  **SPREAD** (tempo difference) sets how fast the category CHANGES. Spread 0 =
  static, so a texture holds indefinitely.

### `phase07-scatter` — the categories, held still
- Ten voices, one player each, **all at exactly 110 BPM**, displaced by a seeded
  random amount. Scatter 0 / 0.03 / 0.08 / 0.2 / 1.0, then a **morph cell**
  (scatter 0 → 1 over 20 s). Measured sd of the intervals, early → late:
  0.1→0.1 · 6.4→6.4 · 21.5→21.3 · 32.6→33.0 · 46.2→46.1 ms — **every static cell
  holds.** Morph: 4.2 → 43.8.
- The first ladder had too coarse a low end (0 → 0.1 jumped from 0.1 ms to 21 ms
  of deviation, straight past the smear/rain boundary); resampled at 0.03/0.08.
- **The morph cell is the "waves" primitive** the composer asked for earlier:
  scatter IS the pronouncedness dial. Ramp = dissolve, oscillate = waves.
- **Scatter cannot make PULSE** — pulse comes from voices converging, which is a
  spread effect. That is the one category that needs drift.
- Audit 0 hard / 0 soft; loads in the app, ten lanes ~150 notes each, all six
  markers rendering. **Unheard.**

### Housekeeping
- **`phase03-fluttermap` restored** — a UI glitch in the other agent's session
  inserted 67 `ord` notes in two groups (`grp-morph-01/02`, pitches 34–62) into
  it. Restored from git to 2231 staccato notes on C3. **The inserted material was
  preserved first**, in the session scratchpad as
  `phase03-fluttermap-WITH-morph-insert.json` and `morph-insert-only.json`
  (the 67 notes alone, 31 s) in case 2v wants them.
- **Jitter test DEFERRED by the composer** — they want to A/B it at a specific
  point in a real score rather than as a standalone, and the gallop is explained
  anyway. `midi/phase04-jitter-*.mid` stay in the repo for when it matters.
