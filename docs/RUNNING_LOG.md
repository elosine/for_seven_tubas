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

### Verdicts on `phase07-scatter`, and THE MODEL REVISED (composer, 2026-08-16)
- scatter 0 *"just at the margin of smear"* · 0.03 *"isn't smear anymore — more
  **ticks**"* · 0.08 *"relatively uniform, approaching gallop"* · 0.2 *"is
  gallop — what lends to it is a sense of **accent**"* · 1.0 *"strong gallop"* ·
  morph *"still patterned, just more dense"*. **"In general the rain is
  minimized."**
- **THE COMPOSER DIAGNOSED IT:** *"part of the rain comes out of some sort of
  randomness… with strict no drift it's almost inevitably going to be patterned,
  probably the repetition of overlap."* Correct, and it is arithmetic: a FIXED
  random offset repeats **identically every 0.545 s cycle**, so it is a frozen
  random rhythm played on a loop 1.8×/s — a figure, with accents. **Scatter never
  made rain; it made a lopsided loop.** Rain needs **non-repetition**, which is a
  different property from irregularity and now gets its own dial.
- **FOUR DIALS:** **density** (attacks/s → tick↔tone) · **scatter** (fixed
  offsets → repeating figure/gallop) · **jitter** (re-randomised per attack →
  non-repetition/rain) · **spread** (tempo difference → rate of change).
- **TWO PHYSICAL CEILINGS.** (1) Ten players ÷ 0.42 s ring = **~23 attacks/s**,
  and tick→tone fusion wants ~50 ms (20/s), so staccato *just* reaches the
  boundary and cannot pass it — which is what makes the articulation blade
  load-bearing. (2) **STAGE WIDTH:** 343 m/s over ~10 m of stage = **~30 ms of
  propagation spread**, against a 55 ms grid at 18/s. **The ensemble's size alone
  imposes half a slot of scatter, so dead-even smear cannot exist in a hall.**
  The mock-up (coincident, sample-accurate) shows textures that are not live-real.
- **STANDING PERFORMANCE RULE (composer):** *"it's not gonna work to give them
  very precise cents instructions… graphic indicators of a speed of beating that
  they estimate — as rapid as possible, to something like a triplet at 60 BPM."*
  **No texture may depend on a precise beating rate or precise cents.** Adopted
  as a constraint on the RESEARCH, not only the notation: every keeper gets a
  **perturbation pass** (re-render with human-scale error, check the category
  survives). Human error *is* jitter, so the tool already exists.
  **Prediction with teeth: rain is what the ensemble gives you for free; smear is
  the fragile one.**
- **CONCEPTUAL MODEL SHIFTED (composer):** *"I was thinking about strict acoustic
  beating… with tubas and their attack, the conceptual model needs to be
  different."* Out: phase shifting as a continuous dial-able beating phenomenon.
  In: **find interesting categories wherever they sit, then find the morphs**
  ("rain → gallop over 30 s, very gradually"). Pitch to be imposed as sets,
  deliberately not over-systematised; it is expected to dissolve the accent.

### E1 + E2 built — the two that follow directly from those verdicts
- **`phase08-density`** — 8 · 12 · 17 · 23 attacks/s, dead even, nothing else
  varying. Cell 4 is the hard ceiling (per-player gap 0.435 s vs the 0.42 s ring).
  Answers where articulation stops being countable, and whether smear is
  reachable by density alone.
- **`phase09-jitterrain`** — jitter 0 / ±15 / ±35 ms, then **the A/B: ±60 ms
  jitter vs scatter 0.2**. Measured to be a fair test: **jitter sd 34.0 ms with
  cycle-position unevenness 0.22, scatter sd 32.2 ms at 1.34** — same roughness,
  opposite repetition structure.
- Both audit 0 hard / 0 soft; both verified loading in the app (721 and 1177
  notes across ten lanes, markers rendering). **Unheard.**
- Full experiment plan with questions and takeaways: `docs/PHASE_SHIFTING.md` §10.

### Commit / push policy — settled
- Each agent commits its own chunk with **explicit paths** (never `git add -A`).
- **Push is now automatic after each commit**, by either agent — it is one repo
  and one branch, so a push carries both agents' work, which is harmless as long
  as every commit is complete (rule 4). This replaces "never push without asking"
  for this project; `CLAUDE.md` should be updated to match at session end.

### FINDINGS MATRIX — morph-listen-01 heard (2026-08-16)

Composer's summary: *"all of these and the originals are very rich. As far as
creating interesting musical materials, we are already there. It's more of a
spoiled-by-riches situation now, and I just have to make choices."*

**Q1 SPAN — a morph holds at every span tested. No density floor needed.**
- 10 s and 30 s similar in kind; **30 s "much more dramatic"** — so span is not
  just duration, it changes the weight of the gesture.
- **60 s: "as expected, a more drawn-out version of the morph. Re-articulations
  aren't prioritised to the ear — under the surface."** This was the open risk
  (would a minute thin out into separate events?) and the answer is **no**. The
  breath model needs no rework.

**Q2 VOICES — the pair-preserving reduction works, with a named cost.**
Four voices: *"still interesting… less detailed and less subtle, and it's really
the BEATING that carries it. Still has a nice morph shape. Just lacks some of the
detail of the reference — maybe like an 8-bit versus 16-bit comparison."*
So reduction is lossy in **detail**, not in identity. 8-bit/16-bit is the right
frame: use full voicing where the morph is the subject, reduced where it is a
layer.

**Q3 CONCURRENT — does NOT read as two entities, and that is fine.**
*"Doesn't sound like two entities, but very interesting still and quite complex,
both in terms of the overall sound and in the detail of the morphing — the change
is quite interesting and complex as well."*
**Reframes the feature:** concurrency is a way to build ONE richer sonority, not
a way to run two audible voices. No registral-separation work is needed for the
current use; if two *distinguishable* morphs are ever wanted, that is a separate
problem (register, timing offset, contrasting technique).

**Q4 PULSE — re-articulation is a musical parameter, and it contributes to the
perception of CHANGE, not only of rhythm.**
- seg 3 s: *"does preserve some of that pulsing effect. When more parts are in,
  or there's more volume, it's more like a PULSE; in the beginning when it's more
  sparse it's more like RE-ARTICULATION."* — the same mechanism reads as two
  different things depending on density. Worth carrying.
- seg 15 s: *"perhaps it loses some of the detail. So maybe the re-articulation
  helps with the change as well."* — **re-articulation is one of the carriers of
  the morph's audibility**, not merely a breathing necessity. Long segments are
  not automatically "smoother"; they are less informative.

**Consequence for defaults:** keep segLen in the 3–8 s band as the working range;
15 s is available but costs detail. No engine change required.

### E1 + E2 VERDICTS — the axis collapses to random↔patterned (composer, 2026-08-16)

**`phase08-density`** (8 / 12 / 17 / 23 attacks/s, dead even):
- 8/s *"still very separate, an interesting artifact — like James Bond suspense
  patter underneath. The articulation and the ten tubas very strongly create
  patterns, beat patterns."*
- 12/s *"the smear is definitely creeping in, but the pattern is still prominent."*
- 17/s *"the patterning is more random or rain-like, and it's more of a smear,
  though not completely homogeneous."*
- 23/s *"the articulated smear — we've heard something similar before."*
- **COMPOSER'S CONCLUSION, and it closes a whole axis:** *"with the staccato patch
  it's really impossible to avoid articulation in the texture. Everything's gonna
  sound articulated, and it's just a question of whether it's more random rain-like
  or more patterned."* Scale confirmed: **articulated smear → gallop → strong
  loops / grooves.**

**`phase09-jitterrain`** (jitter 0 / ±15 / ±35 / ±60, then scatter 0.2):
- jitter 0 *"even the perfectly even one sounds like it has some bit of jitter.
  Doesn't sound like a groove."* — **it is dead even to 0.1 ms in the data**, so
  the perceived unevenness is downstream of the file (sampler round-robin?
  playback? unresolved — see below).
- ±15 *"slightly more patterned… something to do with what is perceived as an
  accent — some accumulation of parts, or maybe one tuba sounds more prominent."*
- ±35 and ±60 *"pretty scattershot, more rain-like."*
- **THE A/B: *"the last one doesn't sound particularly patterned. If anything it's
  subtly more repetitive than the previous one, but not by much."*** So the
  non-repeating vs looping difference is **real but WEAK at 18/s** — the loop
  hypothesis is **not confirmed**, only weakly supported.

**Synthesis (AI reading, testable):** repetition is audible only when the ear can
PARSE the figure. At 8/s the loop is 1.25 s with resolvable events → strong
patterns; at 18/s the events are 55 ms apart, below the rate at which a figure can
be tracked → everything reads as texture and the repetition structure stops
mattering. **Compositional rule if it holds: want a groove, go slow; want a
texture, go fast. Crossover somewhere near 12–17/s.** Untested — this is the
obvious next experiment.

**Two confounds now known, and they matter for how we run these:**
1. **Order effects.** Scatter 0.2 was *"gallop, a sense of accent"* as phase07
   cell 4, but *"doesn't sound particularly patterned"* as phase09 cell 5 after
   four jitter cells. Same setting, opposite verdict. A/Bs must be back-to-back.
2. **Draw variance.** At ten voices, "scatter 0.2" is a RANDOM VARIABLE, not a
   texture — one draw clumps and accents, another does not (the two used different
   seeds). **Practice: audition several seeds at one setting**, as with tonality
   variants; do not treat a single draw as the setting's sound.

### E3 built — `phase10-articulation` (the extra blade)
Six cells, ten players, rain-like ±35 ms jitter throughout, C3. A **survey, not a
ladder** — each technique has its own physics and they cannot be held constant.
1 staccato 18/s (reference) · 2 ord 0.50 s 18/s (≈9 sounding at once, a bed) ·
3 ord 0.25 s 18/s · 4 MIX 5 staccato + 5 ord · 5 fortepiano **5/s** (forced by its
1.77 s ring) · 6 **flatterzunge** 0.50 s 18/s — flutter from the instrument.
- **A real bug caught by a new guard:** 0.50 s ord notes outlast the same player's
  next attack once jitter widens the spacing — 15 hard conflicts. The generator now
  **clamps any variable-length note to the player's own next attack** (0.05 s
  margin, clearing the audit's 0.03 s tongue reset) and prints what it changed:
  `ord50 0.5→0.443`, `mix 0.5→0.448`, `flz 0.5→0.443`. Fixed one-shots are NOT
  clamped — the sample rings regardless, so that stays a visible conflict.
- MIDI export reworked for mixed articulation: one track per (technique, player),
  correct channel each (`staccato→Tuba<N>b ch4 · ord→ch1 · fortepiano→ch11 ·
  flz→ch10`).
- Audit **0 hard / 0 soft**; all 13 phase scores clean. Loads in the app: 1146
  notes, ten lanes, six markers. **Unheard.**

### PHASE 2 + PHASE 3 GATES — MEASURED AND PASSED (2026-08-16)

Recording `03-REC-260816_1319.wav`, 15/15 slots aligned within 120 ms.
Probe design note: **monophonic and sequential on purpose.** The analyzer
estimates one f0 per slot, so an eight-voice chord sounding together cannot be
measured at all — each voice is sounded ALONE and checked against the pitch the
engine said it would produce. `tuba1` only; both models are `ord`.

**Phase 2 gate — M2 spectral targets: worst error 0.4 cents over 8 voices**
(gate was ±10). Every voice landed on its octave-folded partial: B1 −11.2,
D2 −18.2, F2 −0.1, A2 −28.0, C3 +4.2, F3 +0.2, A#3 +1.8, D4 −18.2. The chain
from engine intention → cents → 14-bit bend → sampler is accurate to a fraction
of a cent, which is 25× inside the tolerance the plan asked for.

**Phase 3 gate — wide-fan waypoints: worst error 1.0 cent over 6 points**,
including both re-key seams (B2 +49.5 and E3 −44.0 — the engine sitting near a
bend limit immediately before switching key). So the segmented re-key produces
the pitches it claims, at the seams specifically, which is where it could have
been wrong.

**Continuous glissando leg:** asked 0 → 190 ¢, arrived at 191.4 ¢, deviation from
a straight line 3.3 ¢ RMS.

*Significance beyond the gate:* this is the first end-to-end evidence that the
whole pitch chain is trustworthy — not just that bend works (Phase 0) but that
the engine's arithmetic, the cents→bend conversion, the centred-key choice and
the re-key splitting all compose correctly. Microtonal targets in this system can
be believed.

Analyzer extended with a probe-4 section so the gate is reproducible rather than
a one-off calculation; `probes/last_bend_analysis.json` carries the constants.

### E3 VERDICTS — it is the STACCATO PATCH, and that reverses E1 (composer, 2026-08-16)
- 2 · ord 0.50 s *"continuous tone swelling and pulsing"*; in hindsight *"more of
  a wash, more washy"*.
- 3 · ord 0.25 s *"still not articulated, similar to 2."*
- 4 · MIX *"ords dominate, mask staccato."*
- 5 · fortepiano *"a bit strange. The piano part of the envelope is buried, so you
  hear just the attacks — and since they're of a particular sort and overlapping,
  it lends a sort of weird texture."*
- 6 · flatterzunge *"closer to number three, but with more roughness."*
- **VERDICT: *"everything here sounds not articulated except for the first one. So
  it's really the staccato patch that lends the articulation. Everything else is
  smeared or blurry."*** **This REVERSES E1's conclusion.** Articulation is not a
  property of the density or of the ensemble — it is a property of **that patch**.

### THE REUNIFICATION — two families, and the original model was right after all
- **ARTICULATED family (staccato).** The random↔patterned axis we mapped:
  articulated smear → rain → gallop → groove. Phase relationships read as RHYTHM.
- **SMEARED family (ord, flz, and fp-under-density).** Ten overlapping voices
  blur into a wash. Phase relationships read as **AMPLITUDE / TEXTURE modulation**
  — the composer heard cell 2 *"swelling and pulsing"*.
- **So the composer's original acoustic-beating model was never wrong; it just
  does not survive a hard attack.** It lives in the ord family. The smooth,
  accelerable, sinusoidal flutter that staccato refused to produce is exactly what
  a smeared texture should do.
- **Two findings worth keeping on their own:** ord **MASKS** staccato at equal
  dynamic (so "attacks on a bed" needs dynamic or registral separation, not just
  layering); and **fortepiano under overlap loses its piano tail** and reads as
  attack-only — a usable colour, discovered rather than designed.

### E4 built — `phase11-ordbeat` (the beating dial, in the smeared family)
- All ord, ten players, **jitter OFF** so the modulation is periodic rather than
  stochastic (phase10 cell 2's pulsing was stochastic — jitter, no tempo spread).
  Cells: flat control · lap 8 s · lap 4 s · lap 2 s · accel ΔBPM 0→6 over 22 s.
- **MEASURED BEFORE LISTENING, and it changes the prediction:** over the lap-4
  cell the number of notes SOUNDING stays at **8–10 — essentially constant**, so
  there is **no loudness swell of the sustained tone**. What cycles cleanly on the
  4 s lap is **attack coincidence** (onsets within 20 ms of another):
  `0 0 0 2 4 5 2 0 0 0 2 4 4 2`.
  **So the beating here is carried by transient clustering, not amplitude.**
  Residual risk stated up front: with ord's soft attack that may be too subtle.
  **If it is, the fallback is real pitch-based acoustic beating (E6)**, which
  modulates actual amplitude rather than attack density.
- Audit 0 hard / 0 soft; loads in the app, 1575 notes, ten lanes, five section
  markers plus lap markers. **Unheard.**

### RE-KEY SEAM: NO SEAM (2026-08-16)

Composer on the continuous re-keyed glissando leg: **"no seam."** The segmented
re-key is transparent, so **a fan may be as wide as the music wants** — the
patch's ±2 semitone bend limit is now an implementation detail, not a musical
constraint, and no dynamic dip is needed to hide the fingering change. *Caveat:
one leg, one register, one rate; a very fast or very low re-key is unprobed.*
That closes the last ear-judgement in PLAN 2v.

### RECIPES BANKED — `bank/morph_recipes.json`

The auditioned settings are now a keeper library, generated by
`tools/bank_recipes.js` from `morph_params.json` (so parameters cannot drift from
what was actually heard) plus the composer's verdicts.

**This is the first working instance of the MODEL half of
`docs/plans/MODEL_AND_ACTUAL.md`.** A model was defined there as *"a point plus
the directions worth travelling from it, and how far"* — so the file stores not
only the six blessed settings but the **dial boundaries** learned by ear:

| dial | tested | working range | sweet | what the edge costs |
|---|---|---|---|---|
| span | 10 / 30 / 60 s | 10–60 | 30 | no failure found at either end; 30 s reads "much more dramatic" than 10 |
| voices | 8 / 4 | 4–10 | 8 | 4 is lossy in detail, not identity ("8-bit vs 16-bit"); beating carries it |
| segLen | 3 / 8 / 15 s | 3–8 | 7 | 15 s loses detail — re-articulation carries audibility |
| concurrency | 1 / 2 | 1–2 | 1 | 2 does not read as two entities; it enriches one sonority |

Each entry also carries its measured render (notes, voices, span, conflicts) and
the engine constants in force, so a recipe is reproducible without the panel.

**What is still missing for the full MODEL idea:** the one-dial collapse — a
named recipe like "more rapid re-articulation" that moves several parameters
together within these bounds. The boundaries are now recorded; the collapse is
the composer's to scope.

### E4 RESULT — a clean NEGATIVE, and it closes the timing route (2026-08-16)
- Composer on `phase11-ordbeat`: ***"Everything sounds continuous. No swells at
  all."*** Also, fairly: *"I don't really understand the test or how it was
  constructed."*
- **The negative result is correct and was predictable from my own measurement**,
  which said the count of sounding notes never moves off 8–10. I flagged that as a
  risk and shipped anyway instead of fixing it — that was the wrong call.
- **THE PRINCIPLE IT ESTABLISHES:** *onset phase only matters while onsets are
  audible events.* In an ord wash each attack is masked by nine tones already
  sounding, so displacing attacks in time changes **nothing**. Timing-based
  beating therefore **cannot work in the smeared family, at any rate or spread**.
  That is a real boundary, not a tuning problem.
- Consequence for the two families:
  - **ARTICULATED (staccato)** — timing phase works, and gives RHYTHM
    (rain / gallop / groove). It will never give a smooth swell.
  - **SMEARED (ord, flz)** — timing phase gives nothing. A swell here has to come
    from **pitch**, not from time.

### E6 built — `phase12-pitchbeat`: real acoustic beating
- The composer's ORIGINAL description was always this, not the rhythmic analogue:
  *"acoustic beating when two notes are approaching unison… you can calculate and
  adjust the rate of deviating from unison."* Two pitches a few cents apart
  modulate **real amplitude**.
  `beat rate (Hz) = |f1 − f2|` · `cents = 1200·log₂(1 + beat/f)`.
- At C3 (130.81 Hz): **0.5 Hz = 6.6c · 1 Hz = 13.2c · 2 Hz = 26.3c · 4 Hz = 52.1c**
  — all far inside the patch's measured ±199 c bend range (2v Phase 0).
- Six sections: unison control · 0.5 · 1 · 2 · 4 beats/sec · then a **sweep 0→4
  over 20 s**. Long ord tones (ord sustains 32 s in the piece, so this is safe).
- **MIDI ONLY, deliberately** — the composer score has no bend on these objects
  (2v owns bend), so a score version would play at the wrong pitches and lie.
  Two tracks, both ord ch1, **must go to two different UVI instances** because
  bend is per-instance.
- Uses 2v's measured constants without touching their files: `BEND_PREARM_S 0.05`
  (bend armed before note-on, else it slides) and an explicit **reset to 0 at the
  end** (bend residue is confirmed real).
- **Verified by decoding the file with an independent reader:** the bend bytes
  come back as **0.500 / 1.000 / 1.999 / 3.999 Hz** beat rates, and the final
  event is raw 8192 (centred). The math round-trips.
- **PERFORMABILITY — this is the part that matters.** A player cannot be told
  "13 cents sharp", but **beating is self-correcting**: they hear the beat and
  adjust until it is at the asked-for speed. *"Beat about twice a second"* is a
  real instruction in a way that a cents value never was. **Pitch beating is MORE
  performable than the timing version, not less** — which inverts the worry in
  §5G's performance rule.

### Process note taken from the composer's criticism
*"I don't have any insight into how the tests were constructed."* Fair. From here
every experiment gets **one plain-language sentence of what it is and what would
count as a result**, in the chat guide AND in the score's first marker — not
parameter names like ΔBPM.

### PHASE 4 GATES — VERIFIED IN THE RUNNING APP. PLAN 2v COMPLETE.

All four checks run against `piece-s17` in a scratch session (never a piece file):

| gate | result |
|---|---|
| **Insert over existing material** | 33 notes + marker + META shape land at the playhead. Dropped deliberately ON TOP of DB3 at 120 s it produced **117 hard conflicts**, correctly surfaced by 2r's wash — insert never refuses, it marks (D16). Placed clear at 150 s: badge unchanged at 42 soft, i.e. **zero new conflicts of its own**. |
| **Drag the group** | +12 s moves every note, the marker and the META shape together; `morphBend` and the level nodes are **byte-identical** afterwards — note-relative envelopes travel, as designed (§13.7). |
| **Group-scale ×0.75** | span 30 → 22.5 s, all 33 sustain notes scaled by exactly 0.75, bend envelopes intact, no new conflicts. |
| **Save and reload** | 33 notes, META and marker all survive; every `morphBend` present and **exactly matching pre-save**. |

**D9 tested separately and holds.** The first scale test used an all-`ord` render,
so the fixed-length rule was never exercised — worth noting, because a gate that
does not touch the thing it claims to prove is worthless. Re-ran with an M4 render
containing staccato and fortepiano and squeezed it ×0.5: **16 ord notes scaled to
exactly 0.5; all 42 fixed one-shots unchanged** (staccato 0.42 s, fortepiano
1.77 s). Only ORD is a real duration, inside a morph as everywhere else.

**Bug the gate caught: the panel's insert was not creating a META group shape.**
The group inserted and sounded correctly but had nothing on layer 10, so there was
no handle to grab and group-scaling had nothing to act on. Now built, with the
contour sampled from the morph's own mean level across voices, so the drawn shape
is what the ensemble actually does rather than a generic arch.

---

## PLAN 2v — COMPLETE (2026-08-16)

Every phase built, heard and measured:

- **Phase 0** probes — bend works, ±1.99 st, no artifacts; residue trap real and
  quantified; quartertones patch is *not* a uniform quarter tone.
- **Phase 1** pure engine + 101 unit tests + emit layer + panel; dynamics made a
  layer on every model at the composer's call.
- **Phase 2** M1/M2/M5 — spectral targets land **within 0.4 cents**.
- **Phase 3** M3 + the segmented re-key — fan waypoints within **1.0 cent**
  including both seams, and the composer reports **no audible seam**.
- **Phase 4** insert / drag / scale / save-reload all verified above.

**Five of six models produced material the composer called interesting or better;
three are keepers usable in the piece.** Composer: *"as far as creating
interesting musical materials, we are already there."*

**Carried forward, not built:** the gesture-shaping architecture (attack / body /
release, parts filled in afterwards) and the MODEL↔ACTUAL storage system — both
have their own docs in `docs/plans/` and are the composer's to scope.
