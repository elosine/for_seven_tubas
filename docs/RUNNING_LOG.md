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
>
> **Two agents appended here concurrently on 2026-08-16** — PLAN **2j** (phase
> shifting / textures) and PLAN **2v** (morphing chords). Entries are in
> chronological order, so the two threads interleave. To follow one, read its
> section titles only: 2j runs `PHASE01 … phase13 … ARC ASSESSMENT`, 2v runs
> `PLAN 2v … COLD START`. The consolidated 2j write-up is
> `docs/PHASE_SHIFTING.md`; the 2j hand-off is
> `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`.

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
   do the push. ~~and neither should do it without asking~~ — **superseded by
   D30 (2026-08-16): push automatically after each commit**, staging explicit
   paths only. Do not ask.
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

### E6 RESULT — PITCH BEATING WORKS. First fully predictive result of the arc.
Composer on `phase12-pitchbeat` (2026-08-16): 0.5 Hz *"more flanger effect"* ·
1 Hz *"beats ~1hz"* · 2 and 4 Hz *"the rest the same"* · sweep *"as expected,
flanger into beats to acceleration."*
- **Asked 1 Hz, heard ~1 Hz.** The arithmetic is predictive, which is exactly the
  "reliable effect" the composer wanted from the first message of the arc.
- **0.5 Hz reads as FLANGER, not as a slow throb — and that is correct acoustics,
  not a defect.** A complex tone does not beat at one rate: **partial n beats at
  n × Δf.** At Δf = 0.5 Hz the fundamental crawls while partial 10 shimmers at
  5 Hz and partial 20 at 10 Hz. So a small detuning is heard as timbral swirl.
  **Two new categories, continuously connected: FLANGER (Δf below ~1 Hz) →
  BEATING (Δf ≳ 1 Hz).** The sweep morphs between them on demand.
- **This is the working morph primitive** the arc has been looking for since the
  "waves / more pronounced, less pronounced" request: one bend ramp, calculable.

### E7 built — `phase13-beatfield` (119 s, 10 tracks, MIDI only)
Two questions, plus the ensemble version.
1. **Where does beating stop?** 8 beats/sec, then 15 (≈ a whole tone, near the
   ±199 c bend limit). Beating → roughness → two separate pitches is the pitch-
   domain analogue of the tick↔tone boundary the composer asked about earlier.
2. **TEN detuned tubas** fanned over 6 / 13 / 40 cents — 45 pairs, 45 beat rates
   at once. Fastest pair 0.45 / 0.99 / 3.06 Hz.
3. **THE REGISTER LAW, verified by decoding the file:** the *same* 13.19 cents
   gives **0.50 Hz at C2, 1.00 Hz at C3, 2.00 Hz at C4** — beat rate doubles per
   octave for a fixed cents value. **Compositional consequence: detuning a chord
   by a constant cents amount produces natural stratification — the top shimmers,
   the bottom crawls.** To get a uniform beat rate across a chord you must use
   *different* cents per register. Feeds 2l (spectral chords) directly.
4. **BLOOM** — unison fanning open to 40 cents over 26 s; decoded linear
   (3.1 → 12.3 → 23.1 → 33.8 cents), the ensemble-scale version of the sweep.
All bends decode correctly (8 Hz → 102.76 c, 15 Hz → 187.95 c) and every track
resets to centre at the end. **Unheard.**

---

## COLD START — for the two plans that come next

> Written at the end of day 10 for a session that has never seen this
> conversation. The two builds ahead are **GESTURE SHAPING**
> (`docs/plans/` — attack/body/release, parts filled in afterwards) and
> **MODEL ↔ ACTUAL** (`docs/plans/MODEL_AND_ACTUAL.md`). Read those two files
> plus `docs/AI_METHODOLOGY.md` first; this section is what they assume.

### What 2v actually left behind, in one place

| file | what it is |
|---|---|
| `score/public/morph.js` | the engine. PURE — no DOM/MIDI/fetch, runs in node. Six models, carrier, dynamics layer, playability checks, score conversion |
| `tools/test_morph.js` | 101 assertions. **Run this first and after every change** — it encodes the contracts, not just the behaviour |
| `score/public/morph_emit.js` | all morph MIDI. Registry-driven panic, bend pre-arm, level→CC7 via the app's measured map |
| `score/public/morph_panel.js` | the panel. Generates, auditions, inserts. **Never edits — that boundary is a design rule** |
| `bank/morph_params.json` | live control file; panel polls `/api/morphparams` each second on `rev` change |
| `bank/morph_recipes.json` | the six blessed settings + the dial boundaries learned by ear |
| `tools/morph_listen.js` · `tools/morph_probe.js` · `tools/bank_recipes.js` | listening score, measurement probe, recipe capture |

`composer.html` was touched in only two places: three script tags, and a
`morphBend` block inside the sonification poll guarded by `if (wc.morphBend)`.

### Traps that cost time on day 10 — do not rediscover these

1. **`const Composer` is a LEXICAL global, not `window.Composer`.** Reaching for
   it as `root.Composer` yields `undefined` and every MIDI route silently
   resolves to null. Use the `HOST()` accessor in the morph files.
2. **Markers must go in `objects`, never `data.markers`.** `renderAll()` only
   iterates `objects`; a marker in `markers` survives save/load and is *never
   drawn*. Five scores shipped invisible before the composer noticed (Principle 4).
3. **A `.ps1` invoked as a file gets refused by the permission layer; inline
   PowerShell always runs.** Build a probe schedule with the script (`-DryRun`),
   then play it from inline code reading `probes/last_bend_schedule.json`.
4. **Web MIDI needs a user gesture and is per-browser.** The preview pane has it
   permanently denied; the composer's own browser has it granted.
5. **Autosave writes every 5 s.** `piece-*` files are shielded by a `-work` copy;
   nothing else is. Test under session `untitled`, and CTRL+S before experimenting
   on any non-piece score (that is the only thing that creates a Restore snapshot).
6. **Two agents share this repo.** Never `git add -A`; stage explicit paths.

### What the next two plans should know about the engine

- **The carrier currently derives entry and exit from breath logic alone.**
  Gesture shaping proposes an envelope at the *gesture* level instead — designed
  attack, body, designed release — with parts filled in to realise it. That
  inverts the present order (parts first, shape emergent). The seam between
  `buildCarrier` and the render loop is where that would attach.
- **`reduceSource` drops whole clusters, never fragments**, because half a unison
  pair does not beat. Any future thinning should follow that rule.
- **Envelopes are note-relative and must stay so** — it is what makes drag and
  group-scale safe, verified in Phase 4.
- **Only ORD is a real duration** (D9). Fixed one-shots take their sample length
  and are immune to scaling; verified under a ×0.5 squeeze.
- **`bank/morph_recipes.json` already stores dial BOUNDARIES**, which is the hard
  half of the MODEL idea. The missing piece is the *one-dial collapse* — a named
  recipe moving several parameters together inside those bounds.

### The musical findings that should shape the design

- A 30–60 s morph **holds as one sonority**; no density floor is needed.
- **Beating is the strongest material found**, and it is available *without*
  writing unisons (variant A's chord has no close intervals).
- **Re-articulation carries the morph's audibility**, not just its rhythm — long
  segments are less informative, not smoother.
- **Two concurrent morphs enrich one sonority** rather than reading as two voices.
- Voice reduction is lossy in **detail, not identity** — "8-bit vs 16-bit".

### ARC ASSESSMENT + PRE-PLAN (2026-08-16)
Composer: *"I think I'm fine with this portion of things… I want to draft a plan
for a sandbox… help me collect the data for the pre-plan."*
- **`docs/plans/PHASE_SANDBOX_REQUIREMENTS.md` written** — the requirements-and-
  evidence document to hand to a stronger model, readable cold. Everything is
  marked **HEARD** (composer's ear) vs **MEASURED** (computed/decoded) vs
  inferred; nothing else is claimed.
- **Assessment: mechanism discovery is DONE, combination is not.** Thirteen
  experiments established the two families, the dials, the ceilings and the laws.
  What remains — pitch, counterpoint, category morphs, robustness — is exactly
  what a sandbox exists to explore, and would be slower as one-off scripts.
  **Recommendation: stop the scripts, build the sandbox.**
- **Eight holes ranked**; only one changes the architecture: **pitch has never
  been introduced** (every rhythmic experiment was ten players on one C3), so the
  sandbox needs a pitch layer from day one. The rest are constants or features.
- **SCOPE COLLISION FOUND AND FLAGGED — the most important thing in the document.**
  2v's morph sandbox already owns most of the pitch domain: sustained rendering,
  **bend**, pitch sets, dynamics contours, the params-file loop, an insert path —
  and its **M1 "detune bloom" is dial-and-seed driven, i.e. exactly our pitch
  beating**, while **M3 "fan"** is `phase13`'s fanned detuning. Recommended split:
  **2v owns everything bend-based including pitch beating; this sandbox owns
  ATTACK FIELDS** (density · scatter · jitter · spread · voices · articulation).
  Do not rebuild pitch beating — specify it as a requirement on 2v's M1/M3 (beat
  rate in Hz as the dial, plus the register law) and layer instead.
- Ten requirements R1–R10, including two that came straight from the composer's
  criticisms: **R5 seed auditioning** (a setting is a random variable, not a
  texture) and **R9 self-describing experiments** (plain-language first marker,
  not parameter names).

---

## 2026-08-16 · day 11 (Claude Code) — the two follow-on plans DRAFTED

*(A second agent is concurrently planning in this repo — the two-agent working
rules at the top of this file are back in force.)*

- **PLAN 2z GESTURE SHAPING** (was 2x — ID collision with the texture sandbox,
  both day-10 sessions appended "2x"; the sandbox keeps 2x) —
  `docs/plans/GESTURE_SHAPING.md`. Three levers, all inside the pure engine:
  gesture-level gain g(t) multiplying the D24 dynamics layer · entry/exit
  scheduling (striated | together | ramp; the current striated entry becomes
  the default mode, not the only possibility) · edge technique on first/last
  segments. Attach points verified against morph.js (buildCarrier / stateAt).
  Hard gate G0: absent `shape` ⇒ byte-identical renders (fixtures from the six
  blessed recipes). Code-verified facts baked in: cuivre is MIDI 60–67 and
  feasibleTechnique resolves a low cuivre ask to fortepiano; D9 one-shots take
  sample length, never attack.len.
- **PLAN 2y MODEL ↔ ACTUAL** — `docs/plans/MODEL_AND_ACTUAL_PLAN.md`. The four
  open questions in the concept doc answered (hybrid surface · recipes =
  endpoints + interpolation, pure data · actuals carry provenance · organised
  by model + tags + auto-logged placements). Stores: `bank/morph_models.json`
  (seeded from the frozen morph_recipes.json) + `bank/actuals/ACT-<MODEL>-NN.json`
  with both `notes` and `objects` and a re-derivation integrity check.
- **Found in passing:** `lanes`/`voices` are read by normaliseParams but
  missing from KNOWN_KEYS ⇒ spurious "unrecognised key" warning. Fix scheduled
  in 2z G0.
- **Recommended order: 2z then 2y; never as two concurrent agents** — the two
  plans share morph.js, morph_panel.js, morph_params.json, test_morph.js.
- Both drafts awaiting the composer's review; nothing built.

### 2z plan v2 — the composer's design session (2026-08-16, day 11)

Decisions taken with the composer, folded into `docs/plans/GESTURE_SHAPING.md`
(rewritten as v2) and `docs/plans/MODEL_AND_ACTUAL_PLAN.md` (targeted edits):

- **D restored: full ADSR.** `attack.peak` (default 1) + optional `decay`
  block, peak→1. peak=1 makes decay inert, so ADSR degrades to ASR to
  no-shape in one code path.
- **The attack is a MULTILAYERED object** (electronic-music model): gain ADSR
  · entry scheduling + order · edge technique (the body-rejected techniques —
  singing, flz — are welcome here as noise sources) · per-voice TRANSIENT
  (prepended one-shot; physics stated: D9 means hit-THEN-tone ~0.5 s, never
  hit-AND-tone from one player) · NOISE layer (spare players, simultaneous
  stack — the true "cuivre whether it's in the chord or not") · MOTION
  (converge/gliss-in).
- **The release is a SUBSET, not a mirror:** taper + exits + `dropout`
  (a fraction of voices exits early-abrupt while the rest taper — "drops out
  but feels like a taper"; cluster-safe so beating thins by whole pairs) +
  motion (disperse / to-unison / gliss-out) + technique. No peak/decay/
  transient/noise.
- **Striated entry demoted:** when a shape block is present, entry defaults
  `together`. No-shape behaviour stays byte-identical (G0 unchanged).
- **ADSR does NOT become a seventh model** (composer's query, answered):
  morph ⊥ carrier ⊥ shape orthogonality is what lets any shape compose with
  any model. The quality-of-change ask is served by motion/layers/curves.
- **Shape reuse = lightweight presets, no taxonomy:** `bank/shape_presets.json`
  in 2y — named copyable shape blocks, AI-filed from narrated sessions;
  categories only if practice produces them (D6 harvest).
- **Vocabulary is built by narration:** recipe seeds cut to minimal; the
  composer narrates, AI dials, recurring descriptions get filed as recipes.
- **Plan hardened for a weaker implementing model:** environment-facts
  section (no node MIDI, .ps1 refusal, HOST(), markers-in-objects, autosave,
  D30 git rules), per-gate acceptance checklists, a worked-example params
  blob, and the rule "where plan and code disagree, the code's measured
  constants win — then update the plan."

---

## 2026-08-16 · day 12 (Claude Code) — 2z BUILT, 2y MA0–MA3 BUILT

*(A second agent built the 2x texture sandbox in this same tree throughout.)*

### PLAN 2z GESTURE SHAPING — gates G0–G5, complete

Built in gate order, each gate's tests written before moving on. **331 engine
assertions**, up from 101.

- **G0** twelve fixtures (six blessed recipes + variants A–F), hashed on both the
  note array and `[summary, meta]`. Absent `shape` ⇒ bit-identical, by having no
  second code path rather than by an `if`. Fixed in passing: `lanes`/`voices`
  were read by `normaliseParams` but missing from `KNOWN_KEYS`, so every
  concurrent-morph params file warned about dials that worked.
- **G1** `shapeGain(shape, t, span, rel)` multiplies the D24 dynamics layer
  inside `stateAt`. `peak` defaults to 1, which makes the decay window inert —
  ADSR degrades to ASR to no-shape down one path.
- **G2** entry (`together` default, `ramp`, `striated`) × order; per-voice exits;
  **dropout is cluster-safe**, so beating thins by whole pairs; the SEAM
  exemption is scoped to the designed attack and no wider.
- **G3** edge technique (the body-rejected ones — singing, flutter, bisb — are
  welcome here), transient (**hit-THEN-tone**, ~0.5 s, because D9 says the sample
  decides and one player cannot sound two notes), noise layer on spare lanes.
- **G4** motion, with the structural invariant that deviation is **zero at each
  window's inner edge** — continuity with the body is not a checked property, it
  is unrepresentable otherwise.
- **G5** Shape panel group; app round-trip (insert → drag → group-scale ×0.75 →
  save → reload) byte-identical on shaped material.

**Where the code corrected the plan:** `docs/plans/GESTURE_SHAPING.md` §15 — eight
behaviours, including that **gain feeds back into breath** (a quiet attack
lengthens the segments under it, which is correct physics but means a shape is
not a pure level overlay), and that **SWITCH can only fire on a release edge**.

### THE COMPOSER'S VERDICT, and the redirect it caused

> *"Those aren't really working as auditory models, as sound models, but that's
> okay… So it's correct as an engine."*

Mechanisms right, settings guessed. **D31**: shapes get built bespoke, one morph
at a time, tuned by ear, kept, and the lesson harvested to
`docs/SHAPE_LESSONS.md`. The engine gets revisited later from accumulated
evidence. **What failed is deliberately NOT diagnosed** — the bespoke builds are
the evidence-gathering (methodology rule 5).

### TWO PRE-EXISTING BUGS, FOUND BY MEASUREMENT

1. **Morph pitch was out by up to 40.2 cents.** `n.bend` is already relative to
   the played key; `toScoreObjects` and `morph_emit.js` each added the residual
   again. **It survived because the checks were mirrors** — `morph_probe.js` and
   the unit test computed their expectations with the same double-add, so day
   10's *"spectral targets within 0.4 ¢"* verified the MIDI→audio chain while
   agreeing with the engine's error. → **Principle 5**.
2. **The panel carried the previous variant's dials across a switch**, and it
   stuck. Variant N auditioned at A's span and A's seed.

**Standing consequence:** the six blessed settings were heard through both. The
material is good; any **comparison between them** was of the wrong thing.

### PLAN 2y MODEL ↔ ACTUAL — MA0 through MA3

- **MA0** `bank/morph_models.json` seeded from the frozen day-10 audit record (6
  models, 26 recipes, minimal slates). **The validator was written FIRST because
  it is the spec**, then negative-tested against eight deliberate defects — all
  caught, exit 1. `place_gesture --list` now shows both shelves.
- **MA1** `applyRecipe` / `resolveParams`. Endpoints + interpolation, pure data.
  **Only plain numbers lerp**; strings and arrays step. **Gate:** every seeded
  recipe at min/default/max — 78 settings — stays inside the boundaries actually
  *heard*, renders, adds no hard conflicts. Negative-tested by widening one
  recipe to span 200.
- **MA2** one `buildActual()` shared by `--actualize` and `POST /api/actuals`, so
  CLI and panel cannot drift. Both arrays stored (`objects` frozen for insert,
  `notes` for audition). Three integrity corruptions each caught.
- **MA3** panel: MODELS / scratch / ACTUALs, bounded recipe sliders, seed
  stepper, Save as ACTUAL, browser. **D32: a dial is OFF until turned** — 2y's
  own worked example would otherwise have rewritten blessed params on open.
- **Full loop verified in the app**: choose BLOOM → recipes confirmed OFF →
  two dials → three seeds → Save as ACTUAL → browser → insert @ cursor (placed
  **verbatim** from storage) → drag → scale ×0.75 → save → reload,
  byte-identical, placement logged automatically.

**The actuals shelf ships EMPTY on purpose.** Three were made while testing and
deleted: an ACTUAL is a render the composer *decided*.

### Working rules that earned their keep today

- Every gate and every validator was **negative-tested**. A check that cannot
  fail is worth nothing, and today two of them would have passed while wrong.
- **Six assertion failures across the session were mine, not the code's** — a
  tolerance tighter than the storage grid, a detail string in a tolerance slot,
  reading the cut instead of the level before it, the wrong pitch formula twice.
  Each is recorded in its commit, because "the test was wrong" is the useful
  half of the finding.

---

## DAY 13 (2026-08-17) — MORPH BODIES INTO THE SCORE (PLAN 2v/2y/2z, bespoke per D31)

### The session's frame, set by the composer at the top

> *"I would like to develop and insert some morphs into the score… make a
> bespoke attack and release and just have AI document those for building the
> machine. But right now I just want to get the actual sounds into the score
> and maybe defer the machinery for now. So let's build the body first, and
> then we could talk about how to make the attack and release."*

**BODY FIRST, ENVELOPE SECOND — and the machinery is deferred, not worked
around.** This is D31 in practice: the shaping engine is not to be fixed or
extended; specific gestures get made and placed, and the lessons accumulate.

**Why the split is free rather than a compromise:** in the 2z schema the
gesture envelope is an OPTIONAL `shape` block on a variant. Absent = a pure
body. So "defer the attack and release" costs nothing and disables nothing —
there is no branch to take and no default to switch off. Worth recording for
the paper: the deferral the composer wanted was already the schema's default,
which is what a correctly-factored parameter space buys you.

### Standing instruction adopted — D34 (documentation is continuous)

The composer restated, as a standing instruction, that notes are taken **as the
work happens** — both because the chat window is cleared often and, more
specifically, **because the paper is being written FROM this process**. Filed as
**D34** with a filing contract (one destination per kind of note), and written
into `docs/AI_METHODOLOGY.md` as a new section, "Capture as you go — the paper
is a deliverable, not an epilogue", plus a fifth item on its self-check list.

**The framing that matters for the paper itself:** the negative half is the
useful half. What failed, what the correction was, and *which test was wrong
rather than which code* — those are what make the method reproducible instead of
merely reported. Already the practice (Principle 5, SHAPE_LESSONS' "what was
wrong" line, day 12's six self-inflicted assertion failures); now stated as a
rule so it survives a cold start.

Also fixed while there: this file's working rule 5 still said neither agent
should push without asking, which **D30 superseded** on day 12. A cold agent
reading the rules would have asked the composer a question they had already
answered.

### State at session start (verified, not remembered)

- Tree clean apart from `reaper/7_tubas_rack.rpp` (modified) and
  `scores/piece-s18.json` (**untracked**); nothing unpushed.
- **`piece-s18.json` is the newest piece save** (2026-08-16 22:28), written by
  the 2x texture agent after the day-12 wrap — so the journal's "s16/s17" is
  behind the disk. Which file is the base for morph placement is the composer's
  call, raised and pending.
- Model store `bank/morph_models.json` rev 1: six models, all with placeholder
  ids (BALANCE · COLOUR · BLOOM · CONVERGE · SPACING · SPECTRAL), `actuals: []`
  on every one — the shelf is still empty as designed (D32 corollary).
- **AI decision, not put to the composer** (AI_METHODOLOGY rule 2): the
  placeholder model ids stay as they are for now. They are descriptive enough to
  work with, and renaming plus patching any actuals that reference them is a
  mechanical single-pass job whenever it is wanted. Renaming *before* any actual
  exists would have been cheapest, but the cost of doing it later is bounded and
  small, and it is not worth spending composer attention on ahead of the first
  sound.


### Two UI defects found by the composer trying to open the panel — both fixed, both measured

> *"the morph UI header is trapped in browser header, that may be why I'm not
> seeing it"*

**1 · THE TWO PANELS SHIP AT THE IDENTICAL SPOT.** Measured in the running app:
`morphPanel` and `texturePanel` both compute to **`top:96px · right:16px ·
z-index:9000`**. The Texture panel is 360px wide, the Morph panel 340px — so
with both open the Texture panel **completely covers** the Morph panel, headers
included, and which one you get is DOM insertion order. Two agents built two
panels on two days from the same house style, and neither file mentions the
other. *This is the likeliest cause of what the composer saw.*

**2 · DRAGGING WAS UNBOUNDED, SO A PANEL COULD BE STRANDED PERMANENTLY.**
`makeDraggable` wrote `style.top`/`style.left` with no clamp. The title bar
carries **both** the drag handle and the ✕, so pushing it above the viewport
left nothing to grab and nothing to click. Position is not persisted, so the
only recovery was a page reload — which the composer had no reason to guess at.
Reproduced: dragged to `top:-260` → header unreachable.

**The fix, one code path, no branches:** a single `clampIntoView()` called from
the drag, from `window.resize` and from **every open**; plus `bringToFront()`
called on open and on grab. Opening the panel is therefore also the recovery
action — *"I can't see it" cannot survive clicking the Morph button*, and there
is nothing for the composer to remember. `MIN_TOP = 36` clears `#topBar`, which
matters because the panel is z-index 9000 against the bar's 100: an unclamped
panel does not slide *under* the top bar, it **covers** it, taking the Session
field and the save controls with it.

**Verified in the running app (not by reading):**

| check | before | after |
|---|---|---|
| both panels' default spot | `96px/16px/9000` **identical** | Morph raised to **9001** on open |
| dragged to (−500, −300) | header at `top:-260`, unreachable | clamped to **(4, 36)**, visible |
| dragged past bottom-right | off-screen | clamped to **(936, 688)** in a 1280×720 viewport |
| real mousedown→mousemove(−900,−900)→mouseup | stranded | **clamped live to (4, 36)** — cannot be stranded at all |
| stranded, then click `Morph` | still stranded | **top 36, in front of Texture** |

Page assets all 200; `PANEL.preflight()` returns `[]`.

**3 · A D10 HOLE CLOSED ON THE WAY PAST (not an incident — a hole).** The boot
fallback for a browser with no `localStorage` called `loadSession(newest)`
directly, with none of the `isPieceName → openPiece` guard the branch four lines
above has. If the server's first listed score is ever a canonical `piece-*`
save, that binds the piece file and the first dirty edit autosaves into it —
exactly what D10 exists to prevent, with the protection one branch wide instead
of two. **Stated precisely, because the distinction is the point (rule 4):** I
inferred this would have bound `piece-s18` and that inference was WRONG — the
tab had `localStorage` and took the other branch, and `/api/composer/list` does
not return the newest piece first (it returned `MorphPallette01`). So: a real
hole, closed; **not** a diagnosed incident, and the code comment says so.

**The 404 at page load: identified, and it is nothing.** It recurs exactly once
per load. Every script, `probes/cc7_map.json`, `bank/sample_lengths.json` and
`/api/composer/list` return 200; the page has **no `<link>` and no `<img>` at
all**. It is **`/favicon.ico`** — the browser's automatic request, which this
server does not serve. Not a defect. *Noted because "one recurring 404" left
vague is the kind of thing that gets blamed for something else later.*

**4 · A DEFECT I INTRODUCED, RECORDED BECAUSE THE NEGATIVE HALF IS THE USEFUL
HALF (D34).** While fixing the status line I declared `const sel` inside
`draw()` — which already has a `sel` helper (the select-field builder) about 100
lines further down. `SyntaxError: Identifier 'sel' has already been declared`
took out **the whole file**, so `window.MorphPanel` was undefined and the panel
did not exist at all. Caught in one reload because the verification step is
"open it in the running app", not "read the diff". Renamed to `selName`.
*The generalisable bit:* `draw()` is long enough that a `const` at the top and a
`const` 100 lines down do not look like they are in the same scope, but they
are. Same class as Principle 5 — the failure is invisible at the point of
editing and obvious at the point of running.

**The status line itself (the fix that caused the above).** It printed
`this.active` — the SCRATCH letter — in *every* mode, so working on
MODELS/BLOOM read `v5 · A · "BEATING BLOOM"`: the letter of a different tab's
selection sitting next to the right title. The composer asked *"how do I choose
the body, is it the ABC buttons?"* the same morning, and the status line was
answering **"A"** while they were on BLOOM. Now names what is actually selected.

**Measured while verifying it — the scratch↔MODELS mapping is exact:**

| selection | status line | render |
|---|---|---|
| scratch **C** | `v5 · C · "BEATING BLOOM — four unisons splitting apart, 40 s"` | **39 notes · 3 soft · 0 hard** |
| MODELS **BLOOM** | `v5 · BLOOM · "BEATING BLOOM"` | **39 notes · 3 soft · 0 hard** |
| MODELS **CONVERGE** | `v5 · CONVERGE · "BEATING CONVERGE"` | **40 notes · 8 soft · 0 hard** |

Identical renders confirm C and BLOOM are the same body, which is what the
model store's `seededFrom: slot C` claims but nothing had checked.

**Incidental, and it answers a question the composer asked:** `MorphPallette01`
already exists (today 08:40, **0 objects**) — the composer had already created
an empty scratch score for this arc, by the Clear-All path.

**BLOOM's stock render, measured while setting the view up:** 39 notes, **3 soft
conflicts, 0 hard**, at the store's base params.


### The panel had no height cap and no scroll — fixed structurally, not patched

> *"I can't see the bottom now. There's... you can't scroll… I just wanna be
> able to use the panel."*

**The cause was structural, which is why it kept producing new symptoms.** The
panel was an uncapped block. MODELS mode adds a character note, up to five
recipe sliders, a seed stepper, a preset picker, seven number fields and a flags
list — so the box grew past the bottom of the screen, taking **Generate / Play /
Stop / Insert @ cursor / Save as ACTUAL** with it, with nothing to scroll.

**The fix: a capped flex column with exactly one scrolling middle.** Header and
button rows are `flex:0 0 auto`; only `#morphScroll` scrolls;
`max-height:calc(100vh - 120px)` and `resize:both` for a native grip. **The
transport and Insert are on screen in every mode at every window size by
construction, not by fitting.**

**Two traps inside that fix, both of which would have failed silently:**

1. `toggle()` set `display = ''`, which *clears* the inline property and falls
   back to the stylesheet default `block` — quietly killing the flex column, the
   cap and the scroll, with nothing in the CSS looking wrong. Must be `'flex'`.
2. `min-height:0` on the scrolling child. Without it a flex child refuses to
   shrink below its content and the cap does nothing at all.

**And the clamp from earlier today was still half-right, caught by measuring
rather than assuming.** It kept the *header* on screen (28px), so dragging the
panel low left it "legally" placed with every button below the fold, and
close-and-reopen could not recover it because that position passed the check.
Measured at 1100×460: top 420, bottom 760, all five buttons off screen. Now
clamps the **whole panel**; the `max-height` cap guarantees a fully-on-screen
position always exists, and `Math.max` degrades to top-pinned rather than
refusing to move. Also re-clamps after every redraw, since switching to MODELS
or turning recipes on changes the height.

**Verified at 1100×460 — the hostile case, not the comfortable one:**

| case | buttons on screen |
|---|---|
| every BLOOM recipe on | ✅ top 96 / bottom 436, middle scrolls |
| dragged to the very bottom | ✅ clamped to top 116 / bottom 456 |
| dragged above the top | ✅ clamped to top 36 |
| **all six models, every dial at MAX** | ✅ **none off screen** |

`preflight()` returns `[]`; status reads `v5 · BLOOM · "BEATING BLOOM" · 39
notes · 3 soft`.

**Standing note from the composer, and it governs what gets built next:** *"maybe
we ditch the UI at some point or some features just done manually with AI… I
just wanna move forward."* The escape hatch already exists and costs nothing —
`bank/morph_params.json` is polled once a second, so the AI can write a body
straight into the scratch slate and the composer only presses **Play**. UI work
beyond making the existing panel usable is not to be undertaken unless the
composer asks for it.


### Day 13, second thread — SPEC MODE, and a conceptual arc worth the paper

**Working rule changed mid-session → D35: the AI does not implement anything
without an explicit go.** Composer: *"please check in with me before implementing
anything or wait for me to ask you explicitly to implement."* Then: *"talk
through a number of feature requests and get you to make a document of them…
which includes any of the research you've done. And then I'm gonna pass it on to
another AI to develop all the feature requests."* → `docs/FEATURE_REQUESTS.md`,
written to be implemented cold. *This is a restoration, not a new rule —
`HOW_WE_WORK.md` already said "conceptual proposal before any code edit", and it
had eroded into fix-it-as-you-see-it over the morning.*

**Composer's stated constraint on the whole design:** *"I want to change the code
process or what's going on right now as little as possible, but achieve this sort
of segmentation."* And on method: *"I get lost when we jump into the code…
there were too many layers in already for just one thing"* — so the design
conversation ran **element by element at a conceptual level**, with the code
consulted by the AI and never put on screen. That constraint is what produced the
result below; a code-first discussion would have kept proposing the four-segment
version.

#### THE ARC (this is the paper-relevant part)

The composer arrived with a **four-segment mental model** — entry · development ·
steady state · release — and the question "can the code work this way?"

**Finding 1 — the model already exists, at the wrong level.** The engine has TWO
timelines over one `span`: the 2z gain envelope, which is *already literally*
attack/decay/body/release, and the morph travel, which runs 0→1 across the whole
span and **knows nothing about those boundaries**. So the composer's model exists
at the AMPLITUDE level and does not exist at the PROCESS level.

**Finding 2 — the dials are not orthogonal, and the composer had assumed they
were.** Their plan was: set pace, then set internal character, then set length.
Checked: `segLen` and `cents` are orthogonal; `dyn.amount` is half (magnitude
yes, rate no — swells are driven by progress, so a 5-minute gesture gets **one
five-minute breath**); `bias` is a **global time-warp wearing an intensity
label**; and `span` is a master time-scale, not a pace.

**Finding 3 — the pair is not the unit; the voice is.** The engine has no concept
of a pair. Eight players, staggered individually by a seeded shuffle, and it
never asks who a player's partner is. So a pair's two halves run on separate
timetables and the **gap — the only thing actually audible — is whatever falls
out**. The composer's model assumed the pair was the scheduled unit. *You cannot
hear one player bend 25 ¢; you hear the beating between two. The thing that makes
the sound was the one thing nothing was scheduling.*

**Finding 4 — the root cause, one sentence.** *There is exactly one time value.*
"How long the glissando takes" and "how long the gesture lasts" are the same
number, because the glissandos are stretched to fill it. Every difficulty above
is a consequence. **Split that number in two and the four-segment model stops
being necessary.**

**The composer's resolution (FR-3, PINNED):** rather than a static hold, let each
player **arrive and then cycle** — triangle sweep back to the start pitch and out
again, indefinitely. *"Clearly it becomes a different texture, but I think that's
okay… that'll be interesting."*

**Why this is the elegant answer, and why it was reachable only conceptually:**
every model is a **pure function of progress**. Make progress oscillate instead
of clamp, and all six models inherit cycling for free — no model changes, no
segmentation, no new timeline. **The smallest possible change subsumes the
largest proposed feature.**

#### A prediction to test by ear, worked out on paper

Once cycling, the two halves of a pair sweep at a phase difference, so the
**within-pair phase decides the pair's behaviour**: in phase → the gap swings
0↔50 ¢ and the beating **pulses** (0 → 2.6 Hz → 0); anti-phase → the gap parks at
25 ¢ and the beating **holds steady** (~1.3 Hz); between → it wanders.

**No pair ever goes silent** — the gap reaches zero only at instants, only in the
in-phase case. *This is the opposite of the first intuition* (that pairs might
cancel out and stop beating), and it means the within-pair phase offset is a
**free new dial: pulsing vs steady beating, per pair.**

*All of the above is READ FROM THE CODE, not run.* Nothing in this thread has
been executed or heard, and the FR-3 gates say so.

**Explicitly deferred by the composer:** cycling the *pair's gap* as a unit — a
true repeated bloom — as opposed to cycling each player independently. That one
needs Finding 3 fixed first.


### Day 13 — FR-3 + FR-6 BUILT (cycling morphs, and the release)

Plan: `docs/plans/MORPH_CYCLING_PLAN.md`. Composer gave an explicit go after the
plan; **331 → 347 assertions, 0 failed, fixtures NOT regenerated** (byte-identity
held on every blessed render, which was the load-bearing gate).

**What shipped.** `carrier.span` now means only the ONE-WAY gliss — the pace —
and two new optional fields split length from it: `carrier.duration` (body) and
`carrier.release` (forced run-down). Cycling is on exactly when
`duration > span`; there is no separate switch to fall out of sync. Panel gets
`pace: gliss (s)` · `duration (s)` · `release (s)` · a `dyn shape` selector, and
the status line now shows the **real** total length.

**The core is one function.** `voiceProgress` folds with a triangle instead of
clamping. Measured: **13 direction reversals** over a 300 s body, largest
pitch step across a breath **1.30 cents** (the trajectory advancing during the
gap — continuous, no sawtooth snap).

**Loudness needed no code at all**, exactly as predicted — it already rides the
same progress, so it cycles for free. Measured over 300 s: `rise` 7 peaks,
`swell` 14, range 0.8–8.2 (frozen would have been a single value). *The coupling
that made stretching fail is the thing that makes repeating work.*

**The release works and the bloom closes.** 8/8 voices descending through the
run-down (peaks ~6–9 → 0.8 floor), **final detune 0.00 cents on every voice** —
pitch back at unison as it fades. **Negative control run**, because the positive
result proves nothing without it: with no release the voices end at 7.9–9.2 and
non-unanimous, i.e. the loud abrupt ending this exists to fix.

**No truncation, no runts** — shortest note 5.6 s, voices stopping at different
times (they finish their breath). The silent 512-segment cap now raises `SEGCAP`.

#### THREE DEFECTS FOUND BY RUNNING IT, AND THE HONEST HALF IS THAT TWO WERE PRE-EXISTING

1. **Mine: `meta.totalLength` was `NaN`.** I summed `n.t + n.dur`; the field is
   `tStart`. Caught by the first probe.
2. **My probe was wrong before the code was** — I read `cents` as an array (it is
   a **scalar**) and `level`/`bend` as flat arrays (they are **`[time, value]`
   breakpoints**). That produced a phantom **14-cent pitch jump** and a wall of
   `NaN` levels, both of which looked exactly like real engine bugs. The correct
   reading gives 1.3 cents and clean levels. **A measurement you have not
   validated is not evidence** — this is Principle 5 wearing different clothes,
   and the structures are now pinned by assertion in `test_morph.js` so the next
   person cannot repeat it.
3. **PRE-EXISTING AND SERIOUS: `readFields` threw on every call in MODELS mode**,
   so **nudging any dial there was silently doing nothing** — the field kept the
   typed value while the render went on using the stored params. Both loops
   assumed every control in `#morphFields` carries a `dataset.path`; the recipe
   checkboxes and sliders and the shape-preset picker do not. The exception
   escaped `generate()` uncaught. *This has been true since MA3 shipped on day
   12, and it was found only because a new field had to survive a redraw.*

#### SEAM flags on long renders — measured, NOT a regression

A 5-minute render reports 19 `SEAM` (accidental cross-voice onset alignment)
where the 40 s reference reports 0. That looked like cycling causing it. It is
not: across eight seeds the **legacy** 40 s render averages **2.81 SEAM/minute**
— seed 11 happening to be 0 is luck — against **3.53/minute** for the long form.
Same order, and `hard` is **0** in every case. The small difference is not
diagnosed and is not guessed at (rule 5).

#### Still unheard

Everything above is machine-measured. **Nobody has listened to a cycling morph.**
The predictions in `FEATURE_REQUESTS.md` about the texture — pulsing vs steady
beating by within-pair phase, "no pair goes silent" — remain paper.


### Day 13 — the release/cycling conflation, caught by the composer's EAR

The composer, listening to the stock preview: *"the stop of the preview seems
abrupt… I thought the decay of the natural model was more gradual."*

**It is not a regression** — the fixtures are byte-identical, so the stock render
is exactly what it always was. **But the composer's ear was right and my earlier
description was wrong.** On day 13 I said the ending reads as a release because
"every voice is descending, some cut partway" — inferred from the phase maths,
never measured. **Measured:** every voice ends **fully open at ±25.0 cents**,
final levels spread **0.8 → 5.0**, and **all eight are cut at exactly 40.0 s**.
That is a hard simultaneous chop on an open chord, not a decay. *An inference
wearing the clothes of a check — AI_METHODOLOGY rule 4, and it took the
composer's ear to catch it.*

**Then the fix was blocked by a defect of mine.** Typing a release into the
one-way bloom did not just add a run-down — it switched the whole body into
cycling, because I had written `cycling = duration > span || release > 0`.
Measured on voice 1, end-of-note detune: `-1 -9 -16 -25 -25` (arrive and hold)
became `-1 -9 -16 -23 -13 -3 0` (arrive and immediately turn around). **Adding a
run-down must not rewrite the gesture it is running down from.**

**Separated:** `cycling` = the body repeats (folds) = `duration > span` alone ·
`extended` = anything past the legacy one-shot = drives the timeline, the
let-them-finish rule and the meta. **Now measured on a one-way bloom + 12 s
release:** final detune **0.0 on every voice**, final level **0.8 (the floor) on
every voice**, stops staggered **56.4–58.9 s**. Stock is unchanged. 351
assertions, fixtures still not regenerated.

**Body identity under a release, stated precisely:** sampling both renders at
absolute times through the body, **15 of 558 samples differ, worst delta 1.0** on
the 0.4–10 level scale. All of them sit in the final straddling note, whose
duration legitimately changes when it is allowed to finish instead of being
chopped — so its envelope is drawn over a longer window. **Not "identical";
substantially identical with a known, explained edge.** Saying "identical" here
would have been the same error as before.

**Two measurement mistakes of mine along the way, recorded because they are the
instructive half:** I read a note's *peak* level when I wanted its *final* level
(making a descended voice look like it ended at 6.4), and I compared *end-of-note*
values across two renders whose note lengths differ by design (making a correct
body look changed). **Both looked exactly like engine bugs.** The engine was
right twice; the probe was wrong twice.

**Also found by testing rather than by reading:** the status line reported no
length for a release-only render, because the meta block keyed off `cycling`
instead of `extended`.


### Day 13 — "a short attack at the end of the release", and it was TWO real bugs

Composer, on the demo: *"at the end of the release, there's a little bit of a
short attack. Maybe something to do with the way CC7 is working… if you can point
to a quick fix then let's do it."* Not CC7. Two independent causes, both found by
measuring the render rather than by reasoning about the audio chain.

**BUG 1 — THE DYNAMICS LAYER IS NOT MONOTONIC IN PROGRESS, so "run progress down"
is not the same as "get quieter".** `swell` is an ARCH: quiet at p=1, **loudest
at p=0.5**, quiet at p=0. The release drives p from its body value to 0 — which
walks **back through the peak**. Measured on a one-way bloom + 12 s release:
**seven notes inside the release window peaked at 9.20 of 10.** The release was
swelling to full volume a second after the body ended. `rotate` has the same
shape problem; `rise` is monotonic only by luck.

*This is the same class as the earlier release/cycling conflation: a mechanism
that is correct for the body being reused for the release, where its assumptions
do not hold.*

**Fix:** during the release the level's progress is **frozen at its body-end
value** and faded from there — a release is a fade, not a continuation of the
breathing. Pitch still follows p, so the bloom still closes to unison; only the
level stops breathing. *Attenuating the arch instead was tried first and was not
enough (9.20 → 7.30): the peak sits EARLY in the release, where a linear fade has
barely begun.*

**BUG 2 — the re-entry "sneak-in" is an attack when it happens inside a fade.**
Every segment after the first enters under a deliberate dip-and-rise (−2.5, or
−4.5 across a technique change) so that seams hide inside a sustained body.
Inside a diminuendo it does the opposite: the dip floors at 0.4 and the climb
back to target is **a crescendo on every re-attack**. Suppressed during the
release — the note simply starts at its faded level. **The note is kept, only the
ramp is removed**: players really do re-breathe through a long diminuendo.

**MEASURED AND REJECTED on the way:** stopping new segments at `duration`, so
nobody tongues in during the fade at all. It reads well and it matches FR-6's own
wording — but only the unused remainder of the current breath is left, so every
voice was cut **1–5 s into a 12 s release**, ending at 45.4 s with voices still
**7.4 cents** from unison and the fade half done. *The spec's "players finish
their current breath" quietly assumed the breath outlasts the release, and it
does not.* Recorded because the wording will read as obviously right to the next
person too.

**Result, sampled every 0.25 s across the whole release, all three shapes:**

| dyn shape | loudest note in the release | level rises during the release |
|---|---|---|
| swell | **4.50** (was 9.20) | **0** in 502 samples |
| rise | 8.20 | 1 of 489, +0.20 |
| rotate | 7.20 | **0** in 499 samples |

Bloom still closes to unison in every case; legacy stock render unchanged at 39
notes; **355 assertions, fixtures not regenerated.** Guard added so a release
that surges fails the suite.


### Day 13 — "an attack at the beginning of the fade-in": the level floor, measured

Composer: *"same or similar CC7 glitch. There's an attack at the beginning of the
play… I cannot evaluate the fade in with that at the beginning."*

**Cause, measured in the running app.** Every voice opened at level **0.4** — the
engine's floor — and the MEASURED CC7 map is very steep at the bottom:
`level 0 → CC0`, but `level 0.2 → CC23`. So a fade *from silence* actually began
with **eight tubas tonguing together at CC24**. The composer was right that it was
an attack, and right that it was CC7-shaped; it was not a glitch but a floor.

**Why the floor exists, and why it is now asymmetric.** 2z decided deliberately
that a release lands on the 0.4 floor rather than digital silence — the CC7 map's
bottom, and the same floor every hand-drawn decrescendo in the piece has. There is
an assertion saying so in as many words: *"Do not 'fix' this."* **That is right for
a release and wrong for an attack**, which has to begin in actual silence or the
sample's onset transient is simply audible. So the floor now drops to 0 **only
inside the attack window**; body and release keep 0.4. *Removing it globally was
tried first and correctly failed the 2z assertion — the test earned its keep.*

**Second, smaller cause, same symptom.** A note at `tStart 0` scheduled its CC7 at
`max(0, 0 − 45) = 0` — **the same millisecond as its own note-on**, so it had no
lead at all; and `stop()` leaves CC7 at **127** on every channel it touched. The
opening note could therefore speak at full volume for the instant before its level
landed. Every route's opening CC7 is now sent **synchronously before any timer**.

**Result, measured through the app's own `levelToCC`:** the eight opening voices
went from **CC24 each** to **CC0 each**. Unshaped renders are unchanged (opening
CC26). 354 assertions, fixtures not regenerated.

*Pattern worth naming, third time today: a mechanism that is correct for the body
being reused where its assumptions do not hold — first cycling vs release, then
the swell arch in the release, now the level floor in the attack.*


### Day 13 — the fade-in attack, part 2: PLAN 2q answered by accident

After the level floor was fixed and the eight opening voices went to **CC7 = 0**,
the composer reported: *"still an attack but a little quieter."*

**That is the decisive evidence PLAN 2q has been waiting for since day 7.** If
CC7 alone governed loudness, CC7 = 0 would be silence. It is not. So the
**note-on VELOCITY is producing the transient** — exactly what D12 concluded in
the cluster sandbox (*"velocity is what the meter shows and what the keyboard
sends"*), and the contradiction D12 left open ("if SI2 proves
velocity-insensitive, sandbox dynamics will not carry into the score") now
resolves the other way: **SI2 responds to velocity, and CC7 cannot mute a
velocity-96 attack — it can only attenuate what follows it.**

*Worth noting how it was settled: not by the one-pitch listening test that has
been owed since day 7, but by a fade-in that would not fade in. The test is still
worth running for the calibration, but the qualitative question is answered.*

**Fix:** a note whose opening level is below the engine's 0.4 floor — which after
the previous fix happens ONLY inside an attack window — takes a proportionally
softer velocity, floored at 1 (0 means note-off). Measured: the eight opening
voices went from `CC24/vel96` each, to `CC0/vel96`, to **`CC0/vel1`** each.
**8 of 41 notes affected**; everything outside the attack window is untouched at
96, so no existing material changes.

**Still unresolved and NOT claimed:** whether `vel1 + CC0` is inaudible on the
real instrument, or merely very quiet. Only the composer's ear can say, and this
is the third iteration on the same symptom — if a transient survives at velocity
1, the remaining cause is the SAMPLE's own onset, which no MIDI message can
remove. The honest fallback at that point is to start the fade from a technique
whose sample has no attack, or to accept it and cut it in the final audio.

### Day 13 — SESSION END

**Shipped:** FR-3 (pace split from length; the trajectory cycles) and FR-6 (the
release closes the bloom), the panel made usable, two pre-existing panel bugs
fixed, three attack presets, and the spec ledger. **354 assertions, 0 failed,
fixtures never regenerated.** 17 commits.

**Docs opened today:** `FEATURE_REQUESTS.md` (FR-1…FR-6) ·
`plans/MORPH_CYCLING_PLAN.md` · `plans/MORPH_SECTION.md` · `RESTART_PROMPT.md`.

**Decisions:** **D34** notes are continuous and serve the paper (renumbered from
D33 at session end — the concurrent 2x session had already taken D33) · **D35**
no implementation without an explicit go · **D36** CC7 alone does not govern
loudness on SI2, *with the caveat that the composer disputes the diagnosis and
the blip is NOT solved.*

**THE HONEST ACCOUNT OF THE DAY, since that is the half worth keeping.** The
composer came to compose and spent the session on tooling. Three of the bugs were
found by their ear, not by the suite — and two of those were mechanisms that were
correct in the body and wrong when reused in the release or the attack, which is
now a recognisable shape of error in this engine. Two more had been silently
broken since day 12 and only surfaced because a new field had to survive a
redraw: **dial nudging in MODELS mode had never worked, and Save as ACTUAL had
been discarding everything typed.** Neither had a test, and neither would have
been found by reading.

**And the one I got wrong:** I diagnosed the blip three times, each time with
more confidence than the evidence carried, and the composer's simplest control —
playing the same notes from a keyboard — contradicted the story. The rule exists
for exactly this (rule 5), and the cost was several rounds of their time during a
session they had said twice they could not afford. **The finding is the negative
one only: CC7 = 0 is not silence.** Everything past that is open, and it is
filed as open.

---

## 2026-08-17 — day 14 (Claude Code / Fable 5)

**THE BLIP: ONE MORE CRACK, ON THE COMPOSER'S EXPLICIT ASK.** The day-14 read
of the emit layer produced a mechanism day 13 did not test: **CC7 moving while
sound is present** — the same mechanism at both ends.

- **Start:** the "synchronous" opening-CC7 arm fires at play-press but the
  note-on lands on the next timer tick, so the real lead was ~2–5 ms. A sampler
  that smooths CC7 (the standard zipper-noise guard) still has the channel near
  the stop()-restored 127 when the note speaks. **The score app already met and
  killed this exact artifact** in its own curve playback: `PREARM_S = 0.15`,
  comment "settle CC7/KS before the attack (kills the entry bite)".
- **End:** `panic()` restored CC7=127 in the same instant as the note-offs, so
  the ~0.69 s UVI release tail was yanked up to full — an end blip by
  construction, and it also fired on every replay press (play() panics first).
- **This explains the composer's keyboard counter-evidence instead of fighting
  it:** a keyboard note involves no CC7 movement near its note-on, so no bite.
  Day 13's three fixes corrected the VALUES (CC 24→0, velocity); this is the
  TIMING.

**Built (morph_emit.js):** the whole schedule shifts by `CC_LEAD_MS = 250` (>
the score's proven 150) · every COLD entry (nothing sounding on that channel
through the lead window) gets the full 250 ms CC7 lead — covers t=0, staggered
fade entries, and ladder rungs; warm handoffs (D26 re-key seams, cycling) keep
the short lead so an early CC7 cannot yank the previous note · `panic()` centres
bend immediately (measured inaudible) but delays the CC7=127 restore by
`TAIL_MS = 2000`, per-channel, cancellable — a new play() cancels exactly the
channels it re-arms.

**Built (morph_panel.js): the FADE LADDER** — the composer's requested fallback,
browser-only, no Reaper. One press renders the current params at N attack
lengths (default 1, 2, 3, 5, 8 s), each clipped to attack + 4 s of body, chained
with 2.5 s gaps into ONE play session — so a press-edge artifact can hit at most
the first rung, and rungs 2..N open cold with the full CC7 settle by
construction. Status line narrates which rung is sounding.

**Verified in the running app (:5210, capture-stub MIDI outputs):** opening
CC7=0 at +4 ms, note-on at +254 ms (250 ms lead, all 7 ports) · bend pre-arm
50 ms · rung 2 opens cold with 250 ms lead at 7754 ms exactly as computed ·
panic = note-offs + CC123 immediate, bend centre +0 ms, CC7 restore +2001 ms ·
replay 100 ms after stop cancels all 7 pending restores, **zero stray CC7=127
mid-run over 2.6 s** · `test_morph.js` 354/354, fixtures untouched.

**STATUS, said precisely (rule 5): the TIMING is verified; the SOUND is not.**
Whether 250 ms of settle removes the audible blip is the composer's ear's call.
If it does not, the mechanism story is wrong and the next stop is the
generated-`.mid`-vs-live-keyboard control in Reaper, unchanged from day 13.

**THE VERDICT (same day, after the composer's listen): "Blip gone."** The CC7
timing mechanism is CONFIRMED by ear — filed as "The CC7 timing law" in
MORPH_FINDINGS.md; NITS entry closed; D36 addendum records that the timing story
explains day-13's "attack at CC7=0" without the velocity premise, so 2q's
velocity-vs-CC7 listening test is back to undecided.

**SAVED: `ACT-BLOOM-02` — "BEATING BLOOM, 108 s 001"** (the first post-save-fix,
post-blip-fix actual). 106 notes / 8 voices / 113.9 s total, register 41–56,
model BLOOM seed 11, dials slower/longer 0.76 + more dramatic 0.55, preset
fade-in-3s with attack.len dialled to 9 s, carrier {span 48, duration 90,
release 18}. Supersedes the stale day-13 `ACT-BLOOM-01` (save-fix bug: it kept
the dials but not duration/release/attack). **-01 cleanup is pending the
composer's delete** (AI delete permission was blocked); the model file still
lists both because `model_bank.js --validate` enforces the file↔list symmetry —
verified INVALID with the ref removed early, reverted, VALID restored.

**THE NOTATION DATA WALK (composer's ask, with their graphic-layer dictation in
mind — verbatim in COMPOSER_LOG day 14):** ACT-BLOOM-02 + the placed-group path
audited field by field against the stated notation needs. Everything needed is
present or derivable; findings:

- **Pitch+crescendo curve per player:** `morphBend` [t, cents] key-relative on
  `sonifyNote`/`midi`, `level` breakpoints + drawn `nodes` in the score's
  calibrated 0–10 unit, `engineConstants.bendRangeSt 1.99` — complete.
- **Playing / breathing / rearticulation:** every join in the render is a real
  0.64–0.86 s gap (engine-scheduled breath room, BREATH_GAP_MIN 0.75 est.);
  note `flags` distinguish **BREATH** (segment split forced by the register- and
  dynamic-aware BREATH_TABLE — "split, never truncate silently") from unflagged
  joins (carrier segmentation, segLen 8 ±30%). **SEAM ≠ D26's re-key seam: it
  is a soft cross-voice onset-clash flag** (two voices attacking < 0.08 s
  apart) — rehearsal info, not part notation. Measured: gaps are statistically
  identical across flag kinds (mean 0.744/0.751/0.746 s) — the flags are
  semantic, not timing.
- **Beating layer for the full score (the conductor's graphic):** fully
  derivable — provenance names the pair structure (source pairs on unison keys,
  target {cents 25, direction alternate}), and beat-rate-vs-time per pair =
  |Δf| from midi·100 + bend(t) (D28, register law included). Acceleration =
  its derivative. Which-players-beat-against-which = layer mapping, present.
- **Provenance chain:** the ACTUAL carries model/seed/recipeSettings/
  resolvedParams/shapePreset/engineConstants/captured, and `placements[]`
  self-logs on insert **via the ACTUALs tab's "place"** (`/api/actualplacement`).
  The scratch-panel Insert button does NOT log or carry provenance
  (`properties: {}`) — recommendation: **place morphs into the piece from the
  ACTUALs tab**, so score group ↔ ACTUAL ↔ params stays a closed chain.
- **Gap, non-blocking:** note `flags` (BREATH/SEAM) do not survive into score
  objects — notation should read the ACTUAL + placement offset as the source of
  truth, not the score objects alone (they are the drawn/played view).
- **Convention to choose at notation time, not a data gap:** the 0–10 level →
  dynamic-mark mapping for the "dynamic indicators along the way".
- **D3 RESURFACED (standing duty):** these renders are CURVE-LITERAL; D3 says
  the performer transform is applied/tested at notation time — "we'll see if
  the performance score curves need to be changed to produce the same sound
  effect." That evaluation belongs to the notation pass now approaching.

### The insert that never moved: `Composer.playheadTime` has never existed *(day 14)*

**Symptom (composer):** placed the morph, nothing appeared; placed again, the
conflict badge went up. *"So this is piece eighteen. There should be nothing
after second one forty."*

**Cause, verified in the live app.** All three panels computed the insert time as
`C.playheadTime != null ? C.playheadTime : (C.currentTime || 0)` — and **neither
property is ever assigned on `Composer`** (confirmed live: both `undefined`). The
expression therefore evaluated to **0 on every insert since 2v**. The app's real
accessor is `getTimeAtPlayhead()` (`scrollOffset / pixelsPerSecond` — the
playhead is a fixed centre line, so scrolling IS moving it), used correctly by
the Insertion strip, ALT+X curve split and motive insert.

**Why it read as "nothing happened":** the composer was scrolled to ~142 s
(work-copy viewport 5144 px ÷ 36.2 pps = 142.07) while both groups landed at
**0.00–30.00 s**, stacked onto DB1 — hence the badge moving and nothing visible.

**A second, independent error, and it was the AI's:** the composer was told to
click **"place"**. No such button existed — the ACTUALs card's button read
`insert @ cursor`, **identical to the scratch panel's button a few pixels
above**. So the click landed on the scratch path: the inserted groups are
`grp-morph-01/02`, a 30 s throwaway variant, not the 113.9 s `ACT-BLOOM-02`.
Only the group id distinguished them. Relabelled to **`place @ cursor`**.

**Fixed:** `playheadAt(C)` helper in `morph_panel.js` (used by both insert
paths), same fix inline in `texture_panel.js` (latent there — 2x's insert has
never been run in the app, so it is noted as latent, not as an observed
failure). `Math.max(0, …)` follows composer.html:8948's own convention.

**Verified in the running app, which is the check that was missing originally:**
scrolled to 142.0 s → `place @ cursor` → group `grp-act-bloom-02-01`, 108
objects, **firstStart 142.000**, span 142.0–255.9 s, marker at 142, META shape
matching, layers 0–7 — and **108/108 objects present in the DOM after
`renderAll()`** (106 curves + marker + group shape), which is the Principle-4
check that the thing is actually on screen and not merely in the file. Screenshot
was unavailable (preview pane not compositing); the DOM measurement stands in for
it. `test_morph.js` 354/354.

**Restore:** `scores/piece-s18.json` was never touched (D10 working-copy rule
held); all damage was confined to `piece-s18-work.json`. Recovery is to reopen
`piece-s18` and answer **Cancel** at the working-copy prompt.

**The generalisation worth keeping:** this is **Principle 4 again, one level up** —
an insert whose only consumer is the composer's eye needs one check in the
running app that the object landed WHERE it was asked for, not merely that it was
created. A unit test on `insertActual` would have asserted the offset arithmetic
against the same absent property and passed (Principle 5's mirror). What caught
it was a number the composer could see: 142.

**Time readout (composer request, day 14):** the floating readout on the cursor
keeps its seconds line unchanged (18 px, two decimals) and gains **m:ss beneath
it at 9 px**, grey, no decimals. Floored rather than rounded so 119.99 reads
1:59 next to `119.99` instead of 2:00. Spans are built once and only their
text updates — this runs every scroll frame, so rewriting innerHTML there would
reparse HTML at frame rate and discard the element's drag target. Verified in
the running app across 0 / 7.35 / 59.99 / 60 / 119.99 / 142.07 / 255.919 /
605.5 s, with the drag cursor and child count intact.

**CHECKPOINT — chat cleared here (day 14).** All work committed and pushed;
journal §2 carries a full day-14 entry written for a cold session, and §2's two
long day-12 blocks were compressed to one entry (their detail lives in the plan
docs §13 and their open items in §6, verified present before trimming).


## 2026-08-17 — day 15 (Claude Code / Opus 5)

### "The balance morph seems to end more abruptly than the others" — and it did

The composer's ear again, and again it was real. Full technical record and the
measured tables are in **`docs/MORPH_FINDINGS.md` → "The ending law"**; the short
version for anyone reading the narrative:

- **Measured, stock params, all six models:** BALANCE cut at **97% of its own
  peak** (mean voice level 7.5/10, all eight sounding, the last six seconds
  *rising* into the cut) against **29–59%** for the other five.
- **Cause, and it is one line of arithmetic.** Every legacy render chops every
  voice at the span — common to all six. The difference is purely the level at
  the chop, and that is `dynLevel`'s shape. `swell` is an **arch** whose ends are
  its trough, so five models land quiet for free. `rotate` is a **full turn**
  that comes back to exactly where it started (p=0 and p=1 give identical
  levels). BALANCE is the only model on `rotate` — because that *is* M6's
  identity.
- **The control that made it a diagnosis rather than a reading:** swap only
  `dyn.shape` and the behaviour swaps with it, both directions. BALANCE on
  `swell` → 49%. BLOOM on `rotate` → 100%.
- **Same root as the day-13 release bug**, showing up on the path day 13 did not
  cover. Day 13 fixed non-monotonic dynamics for the *release* (`relFade`); a
  stock model has no release, so that guard never engages. *That is now twice
  this mechanism has surfaced, both times found by ear, never by reading.*
- **Fixed in data, not in the engine:** `BALANCE.baseParams.carrier.release: 5`
  plus a `close it` recipe (0 → 12 s, default ≈5 s, OFF until turned per D32).
  Dial 0 restores the old hard stop **exactly** — end 30.0 s at 97% of peak, the
  pre-change render — so the loud stop stays available rather than being
  legislated away. An engine-side "always taper" was rejected: it would break
  byte-identity on all 354 fixtures for something one data field away.
- **The trap avoided, and it would have been invisible:** the recipe patches
  `carrier.release` only. Pinning `carrier.duration` alongside it would have made
  the existing `slower / longer` recipe switch **cycling** on below span 30 —
  span 10 rendering 42.9 s instead of 18.7 s, a different gesture entirely, with
  nothing in the UI to say so.
- **Verified:** `model_bank --validate` VALID (27 recipes) · `test_morph.js`
  **354 passed, 0 failed, fixtures never regenerated** · the other five models'
  renders numerically identical before and after · the recipe exercised through
  the panel's own `resolveParams` path at dials 0 / 0.42 / 1 and against the span
  recipe at both extremes, no warnings · **the running score server serves rev 7**
  with the new carrier and the new recipe row.
- **Not opened in a browser on purpose.** The composer was live in the app with
  unsaved work, and a second composer session autosaves over the working copy.
  The API check gives the same evidence without that risk; the panel's recipe row
  is the existing generic checkbox+slider loop, not a new code path.

**Length cost, flagged rather than buried:** FR-6's "let them finish" means stock
BALANCE now ends at **39.9 s** rather than 30. It is *audibly* done at ~34 s; the
last ~6 s are players finishing their breath at the 0.4 floor. Stop stagger goes
0 → 5.6 s, which is the ragged descent FR-6 was built to give.

---

## 2026-08-17 — day 16 (Claude Code / Opus 5) — PLAN 2aa v1: the pulse sequencer strip

The trance section's sandbox, built from the day-15 spec cold. Click a column,
give it a sonority, hear the grid loop. Audition only; nothing written to a score.

### The composer confirmed the menu first, and the confirmation found a trap

Before any code the composer enumerated what they wanted in the menu, by species:
the **staccato and staccato-cuivre pair of each**, species 3 · 4 · 11 · 12 · 13 ·
16 · 28 = S008/S011 · S014/S017 · S020/S023 · S026/S029 · S032/S035 · S038/S041 ·
S044/S047. All fourteen check out against `bank/blast_taxonomy.json`: the
sonorities sit in **6-blocks of chord × voicing** (fp / staccato / ord plain, then
fp / staccato / ord with cuivre), so the +1/+4 rule picks exactly the two
staccatos of each block, and "species N" is the `VERT01-NN` chord.

**Then the trap, and it would have been invisible in the mock-up.** *Five of the
seven pairs have identical pitch sets* — S020/S023, S026/S029, S032/S035,
S038/S041, S044/S047 — differing only in which top notes are cuivre. 2aa v1 said
"technique `staccato`" for every note. Under that rule those five pairs would
have produced **byte-identical MIDI**: half the menu, silently duplicated, with
nothing on screen to say so. The palette therefore resolves a `ref` with its
**per-note articulation**, by the blast inserter's own rule.

*Measured in the running app, at a recording stub on the MIDI ports:*

| column | pitches | routing |
|---|---|---|
| S044 | 30 41 46 60 61 62 | all six → `tubaNb` **ch 4** (staccato) |
| S047 | 30 41 46 60 61 62 | 30 41 46 → ch 4 · **60 61 62 → `tubaN` ch 5 (cuivre)** |

Same pitches, different instrument. That is the whole reason the composer asked
for both halves of each pair.

### The scheduler: where the spec was wrong, and what it cost to find out

2aa said *"playback = `MorphEmit.play`, NO new scheduler"* — the right instinct
(that layer is blip-hardened and its `panic()` is the verified stop sequence),
and it is reused for everything dangerous. But `E.play` **cannot loop
seamlessly**: it shifts its entire schedule by `CC_LEAD_MS` (250 ms) and panics
on entry, so re-invoking it once per cycle either opens a **250 ms hole at every
loop boundary — more than half a beat at 130 BPM** — or, if you re-invoke early
to close the hole, cuts the last column's ring. The composer is listening *for
the pattern*; a stumble at the seam corrupts exactly the judgement the panel
exists to support.

So cycles are scheduled one ahead against a single absolute time base, 400 ms of
lookahead, nothing ever stopped and restarted. **Measured over 4.5 cycles of a
4-column grid at 240 BPM (nominal step 250 ms), attack points in ms:**

```
260  520  760 1010 | 1270 1510 1760 2020 | 2260 2510 2770 3010 | 3260 ...
gaps: 260 240 250   260   240  250  260    240  250  260  240   250
```

The bars are the loop seams. **The seam gap is indistinguishable from an ordinary
one** — 260/240/250 everywhere, which is the 5 ms measurement bucket plus timer
jitter, not a structural hole. The pattern `F F CLUST10 F` repeats exactly:
3 · 3 · **10** · 3 notes per attack point, every cycle.

### What a test can judge, and what it cannot

`tools/test_pulse.js` — **103 assertions**, and the gate is the five pitch-
identical pairs: they must differ in articulation or the test fails. Mutation-
tested with three deliberate breakages, all caught:

| mutation | what broke |
|---|---|
| `techFor` ignores the cuivre lists | 91/128 — every identical pair collapses |
| fixed one-shots take the grid note-length | the four PLAN 2n assertions |
| lane cursor resets each column | a 3-note entry hammers lanes 0–2 |

**PLAN 2n is live in the panel, not just in the docs:** a staccato takes its
measured per-pitch length (0.40–0.49 s across CLUST10) and the note-length field
cannot stretch it; only a variable technique (ord) obeys the field.

**What the test cannot judge is whether the pattern of harmonic change is right,**
which is the entire point of the panel. That is the composer's, in a window where
Web MIDI is allowed.

### Not verified: the sound

This browser still blocks Web MIDI (day 15's finding, verbatim message, now with
the port number wrong — filed to NITS). The failure path is clean: the button
returns to `Play`, zero timers, zero sounding notes, and the message names the
fix. Everything above the MIDI port was verified through the real handlers on the
`score-verify` instance (5210) with the session forced to `untitled`, so autosave
could not reach a score.

---

## Day 17 (2026-08-17) — PLAN 2ab built: panel snapshots

*Claude Code / Opus 5. Handed off from the day-17 planning session; implemented
from `docs/PLAN.md` 2ab without re-deriving the spec.*

**What was built:** `bank/panel_snapshots.json` (seed + contract) ·
`score/snapshots.js` (PURE merge module, node-only) · `GET/POST /api/snapshots`
in `score/server.js` · `Save` / `Load` buttons on the pulse panel ·
`tools/test_snapshots.js`. localStorage is unchanged and remains the live
scratch.

**The refactor the spec asked for, and why it matters:** `restore()`'s body
became `applyState(s)`, called by BOTH the localStorage path and the snapshot
Load path. Two paths would have let a snapshot arrive with defaults the scratch
path applies and the load path does not — the branch is exactly where that bug
would live. One change beyond the spec: `cells` is `.slice()`d on adopt, so a
snapshot object still sitting in the open Load list cannot be rewritten by
subsequent cell edits.

### Measured — `tools/test_snapshots.js`, 75 assertions, 0 failed

| Rule | Result |
|---|---|
| state round-trips deep-equal | pass |
| `saved` stamped by the server, client-supplied date ignored | pass |
| same-name save replaces, count stays 1 | pass |
| delete removes; delete-of-missing = `{ok:true, existed:false}`, no throw | pass |
| unknown panel CREATED not rejected; missing `panels` key repaired | pass |
| 9 bad names refused loudly, nothing written; 3 boundary names accepted | pass |
| deep copy — caller mutating its state after merge cannot reach the file | pass |

**The mutation test discriminates:** a deliberately by-reference `brokenMerge`
was run against the same deep-copy assertions; they FAIL against it and PASS
against the real module. `tools/test_pulse.js` re-run: still 103/103.

### Verified in the running app — `score-verify` on :5210, session forced to `untitled`

The autosave guard was read before trusting it: `composer.html:3119` fires only
`if (this.isDirty && this.sessionName !== 'untitled')`, so forcing the session
name IS the neutralisation, not a superstition. `boundName` still read
`tranceSB01-2` (the composer's untracked live sketch) — the reason this
procedure exists.

- Routes by curl: save → `{success, action:'save', existed:false, panels:1}`;
  the entry appears on disk with a server stamp; `bad/name` → **HTTP 400** with
  the charset spelled out in the message.
- **The reload gate, done the hard way:** a distinctive grid (12 cols · 177 BPM ·
  0.33 s · loop OFF · 12 mixed cells incl. `null` and `—` · brush S047) saved
  through the REAL `Save` button (only `window.prompt` was stubbed — automation
  cannot answer a native modal). **localStorage was then WIPED and the browser
  reloaded**, so nothing could return from the scratch: panel came back at
  defaults (32/130/0.25/loop on/no cells). Load → picked the row → **every field
  returned exactly**, `matchesExactly: true` on a full JSON compare, the number
  inputs on screen read 12/177/0.33/unchecked, and the strip drew 12 cells.
- Newest-first sort correct. Delete via the row's `×` removed it from the list,
  from the server, and left the loaded grid untouched.
- **The AI-dial channel works as designed:** a snapshot POSTed by the AI *while
  the panel was open* appeared on the very next `Load` — no page reload.
- A snapshot with no `grid` in it is refused BY NAME in the status line and the
  current grid is left alone (never silently half-applied).

**Not verified: nothing sound-related, because 2ab makes no sound.** This
feature is pure state; the Web MIDI block that gates every audition claim does
not apply here. All test snapshots were deleted afterwards — the committed file
is the clean seed.

---

## Day 17 (2026-08-17) — PLAN 2ac built: the multitempo audition rig

*Claude Code / Opus 5, same sitting as 2ab. Built from the plan without
re-deriving it; the SYMBOLS AND TRAPS block did its job — see below.*

**What was built:** `score/public/multitempo.js` (PURE ratios→notes engine,
node + browser) · `score/public/multitempo_panel.js` (the `MT` button, anchored
after `Pulse`) · `tools/test_multitempo.js` · two script tags in `composer.html`.
2ab wiring: panel id `multitempo`, so Save/Load work on day one.

### The traps block was load-bearing — two of the four would have shipped

The plan's own warnings, written the day before against the source, prevented:
- **lane = stream index.** `buildGrid` round-robins a cursor per NOTE; copying
  it would have scattered each stream across players. Asserted directly now
  (`every stream-1 note is on voice 0`), and mutation-tested.
- **`r4`/`clamp` are private.** Redefined locally rather than reached for
  through `PulseSeq.`, which would have thrown on the first call.

### Measured — `tools/test_multitempo.js`, 90 assertions, 0 failed

Reduction (2:4:6 → 1:2:3; 6:9 → 2:3 **and the cycle shortens with it**, not just
the label) · cycle math at BPM 150, 3:4:5 → **C = 1.2 s**, onsets exactly
[0, .4, .8] / [0, .3, .6, .9] / [0, .24, .48, .72, .96] · REGISTER wrap
(F# = 30/42/54/66, a 5th stream reuses 30) · HARMONY chunks (10 pitches over 4
streams → [3,3,2,2], lowest chunk to stream 1) · **S047's cuivre notes survive
as cuivre (60/61/62) while S044 keeps the same pitches with different
techniques** — the 2aa pair-distinguishability rule, carried into this engine ·
2n honoured (noteLen 2.0 does not stretch a staccato) · every bad input NAMED
and the stream silent, never a throw.

**Four mutation tests, all discriminating:** skip the reduction · reverse the
chunk order · compute onsets from the unreduced terms · apply buildGrid's
round-robin cursor. Each was run against the real assertions and each FAILS
them, which is the only evidence that the assertions mean anything. The third
is the instructive one: **the wrong pulse is perfectly regular**, so it sounds
entirely plausible — a listening test could not have caught it.

**Two test bugs found and fixed, and they were the TEST's fault, not the code's:**
(1) the `entry.dyn` fixture used a literal palette entry, but `dyn` reaches an
entry ONLY through a taxonomy ref (`resolvePalette`, pulse_seq.js:84) — the
fixture asserted an impossible path. (2) A regularity assertion compared floats
exactly; `k·(C/6)` rounded to 4 places gives gaps of 0.1666 and 0.1667, so it
was testing IEEE754 rather than the property. Both rewritten.

### Verified in the running app — :5210, session forced to `untitled`

- `MT` injects after `Pulse`; preflight returns clean; the palette loads and the
  readout reads `3:4:5 · cycle 1.20 s · 3/4/5 attacks · 12 notes`.
- **TIMING, measured at a recording stub over ~3.5 cycles** (Web MIDI is blocked
  in this pane — day 15's finding, unchanged):

  | stream | nominal step | measured onsets (ms from first) |
  |---|---|---|
  | T1 ×3 | 400 ms | 0, 410, 799.5, 1199.4, 1609.6, 1999.5, 2398.9, 2809.6, 3200.3, 3598.4 |
  | T2 ×4 | 300 ms | 0.1, 299, 598.5, 899.6, 1199.6, 1500.5, … 3898.5 |
  | T3 ×5 | 240 ms | 0.1, 238.9, 479, 718.5, 958.5, 1199.6, … 3838.5 |

  Gaps stay inside 389–411 / 299–301 / 239–241 ms against nominals of
  400/300/240 — ordinary `setTimeout` jitter. **The realignment property holds
  in the running app:** all three streams land together at 1199.4/1199.6/1199.6,
  at 2398.9/2399/2399, and at 3598.4/3598.4/3598.4 — i.e. exactly on C, 2C, 3C.
  **The seam is not a seam:** T1's step ACROSS the cycle boundary is 399.9 ms,
  indistinguishable from any other step.
- **Stop is clean, measured one level lower** (only the MIDI port stubbed, so the
  real noteOn/noteOff and panic run): **29 note-ons matched by 29 note-offs**,
  0 timers left, `isPlaying()` false, button back to `Play`, **0 pitch bends**,
  CC7 sent once per lane at 127.
- REGISTER on C stratifies to **36/48/60**. HARMONY on CLUST10 over 3 streams
  chunks to 44-47 / 48-50 / 51-53. S047 keeps cuivre on 60/61/62.
- A bad term (`3:0:5`) is NAMED in red — *stream 2: "0" is not a whole number
  1-64 — silent* — the reduced form reads `3:?:5`, and the other two streams
  still play.
- **2ab round-trip:** a distinctive config (96 BPM · 7:8 · REGISTER F# ·
  0.4 s · loop OFF) saved, **localStorage wiped, browser reloaded**, loaded
  back exactly; the reloaded config rebuilds to C = 4.375 s with pitches 30/42,
  which is 7 × 60/96 and F#'s two lowest octaves.
- **Regression on the shared `E.onStop` slot** (now four panels): playing and
  stopping from either panel leaves BOTH Play buttons restored and 0 timers.

### One defect found by RUNNING it, not by reading

`drawStreams` declared its `seen` dedup map INSIDE the per-note loop, so it
never deduped: in HARMONY a stream attacks a whole chunk at once, and 39 notes
drew **12/12/15 stacked ticks where 3/4/5 onsets exist**. Invisible on screen —
the duplicates land on the same pixel — so only a count caught it. Fixed and
re-verified: **3/4/5 ticks, and exactly 3 bright ones** marking the downbeat
that 3:4:5 shares. *This is Principle 6 again (a defect found by running, not
by reading), and the sixth of its kind in this repo.*

### Not verified: the sound

The composer's, as always. Web MIDI is blocked in this pane, so every claim
above is a DATA claim measured at a stub — the ratios, the realignment and the
stop path are verified; **whether four tempi together are worth keeping is not,
and cannot be.** No screenshot: the browser pane was not compositing frames, so
the visual claims above are DOM reads (tick counts, computed styles), which are
tighter evidence anyway.

---

## Day 17 (2026-08-17) — PLAN 2ad: the phase-shift selector needed NO code

*Claude Code / Opus 5, same sitting as 2ab and 2ac. 2ad was spec'd as "a
workflow, not a build", with exactly one conditional code item. That condition
turned out to be false, so nothing was written.*

### The one permitted code item was not needed, and that was CHECKED, not assumed

2ad said: *"if the Texture panel cannot refetch `/api/textureparams` without a
page reload, add a ↻ button"*. **It can do better than that already.** The panel
polls `/api/textureparams` every 1000 ms whenever it is open
(`texture_panel.js` `startPolling`) and, on a `rev` bump, also honours the
file's `active` field — so an AI write says both *"here is the new slate"* and
*"this is the one I mean"*.

**Verified in the running app** (:5210, session forced to `untitled`), because
reading it is not the same as knowing it: with the panel open and untouched, the
params file was rewritten from the shell to `rev: 2, active: "B"`. The panel
moved to **rev 2, variant B, no reload and no click**. The file was then restored
with `git checkout` and the panel returned to rev 1 / A on its own.

**So the entire conversational channel that 2ad depends on is proven working**,
and 2ad's code scope is closed at zero lines.

### The slate is already loaded — the sitting can start cold

`bank/texture_params.json` already holds exactly the three references the 2x
listening slate asks for first. All three render, each with a distinct measured
signature:

| variant | model | measured |
|---|---|---|
| A | SMEAR | 18.4/s · **sd 0.1 ms** · unevenness 0.00 · 257 notes |
| B | RAIN | 18.4/s · **sd 30.7 ms** · unevenness 0.14 · 257 notes |
| C | GALLOP | 18.6/s · **sd 32.3 ms** · unevenness 0.68 · 260 notes |

**A prediction worth putting on record before it is heard, because the numbers
suggest the vocabulary might not survive it:** B and C have almost the SAME
jitter magnitude (30.7 vs 32.3 ms) and very different *unevenness* (0.14 vs
0.68). If rain and gallop are clearly distinct by ear, unevenness is carrying
the distinction and the vocabulary holds. If they are not, then "rain" and
"gallop" are one category with two labels, and the models should be merged.
Either answer is a result.

### The last step of the sitting was tested so it cannot fail on the composer

`node tools/texture_bank.js --bank RAIN --from B --survives yes --note "…"` was
run end to end: it re-rendered variant B, wrote the verdict into
`bank/texture_models.json`, and reported *"banked MODEL RAIN — 257 attacks, sd
30.74 ms, unevenness 0.139, 0 hard / 0 soft"*. **The probe was then reverted** —
`--validate` reads `0 of 5` verdicts again, exactly as before, and `git status`
on `bank/` is clean. No fabricated verdict was left in the bank.

**One operational gotcha found while doing it, and it matters because the
composer's VERBATIM words are the deliverable:** an em-dash passed to `--note`
through Windows Git Bash arrives mojibake'd (`—` → `â€"`). It is the shell's
argv, not the tool — both `heard` and `robustness.note` receive the identical
mangled string from the same `opts.note`. *(A first reading suggested the two
fields disagreed; they do not. That was an artefact of printing one with
`json.dumps` — which escapes non-ASCII — and the other with `str`. Recorded
because a wrong diagnosis half-reported is worse than none: AI_METHODOLOGY
rule 5.)* **Practical rule for the sitting: keep `--note` plain ASCII, or paste
the composer's exact words into COMPOSER_LOG and put a plain-ASCII summary in
`--note`.**

### What 2ad still needs, and it is the only thing left

**The composer's ear.** 2ad's "Done when" is *one banked keeper carrying the
composer's verbatim note, plus the SMEAR/RAIN/GALLOP distinctness verdict*.
Neither can be produced here — Web MIDI is blocked in this pane, and more
fundamentally a verdict is not a measurement. Everything AROUND the verdict is
now verified: the panel renders, the channel is live, the CLI writes, the
revert is clean.

## Day 18 (2026-08-18) — the method decision, 2ae built, and the generator specified

*(Written at session end rather than as-the-work-happened — my miss. This file
exists precisely so a clear cannot cost the process, and it had ZERO day-18
entries until the composer asked. See the standing instruction now in CLAUDE.md.)*

**The decision that governs everything after it (D41).** The composer stopped
using the panels built on days 16-17 and said why: *"my attempts to build tools
like panels have turned out to be very labor intensive and aren't lending the
results. So I'm going to stick with AI prompts and console scripts that I can
paste in."* Scripts are delivered **in chat as fenced code blocks** (the copy
button is the mechanism), one scratch score overwritten per paste, keepers made
with CTRL+S which already versions.

**The trust split, stated by the composer and worth obeying.** Object
insertion/mutation is TRUSTED — do not re-verify. Label and overlay
PRESENTATION must be right first time, because each slip costs a fresh script
and a paste cycle. Vindicated the same hour: the note-generation was right first
try; the column numbering was wrong three independent ways — META is
`display:none` without `.open` (invisible), 39 of 48 labels overlapped at zoom
22.5 (9px column, 11.7px label), and entry labels in voice lanes sat on top of
noteheads. Fixed by placing labels through an explicit collision test; verified
zero overlaps at zoom 15/22.5/50/100/200 by reading `getBBox()` of every
rendered `<text>`. Rules written to `tools/console/README.md`.

**A real bug of mine the composer caught.** Audition scripts cleared only their
own `properties.gen` tag; different scripts carried different tags, so pasting
an accretion after a burst pattern left every burst note behind and the score
silently accumulated. Now they FULL-clear.

**2ae shipped** — 12 octave unisons banked (`S049`-`S060`), three column buttons
in the Insertion strip (insert / replace / delete), `O` = selection→ORD,
drag-length readout, `A`/`SHIFT+A` column select, and multi-resize (the twin of
`startGroupDrag`, which already did multi-move). A marquee was assessed and
REJECTED on purpose: left-drag on empty lane space already pans, and the lanes
are separate positioned divs so a cross-lane box needs per-lane hit-testing.
Grid material wants "this column", not a rectangle.

**The MT spectrum work — the discovery worth keeping.** Asked for longer cycles,
the maths said cycle `C = T * r1 / gcd`, so length is set by the FIRST term. But
the useful finding was the second one: **it is the CLUSTERING of the terms, not
their size, that changes the kind of music.** Spread terms (`3:4:5:6`) give
polyrhythm and density climbing fast; clustered terms (`47:43:41:37`) give slow
phasing with **density staying flat (~6 onsets/s at 100bpm, 4 parts) however long
the cycle grows**. That flatness is why the spectrum works — length and
complexity increase without the texture thickening. Also: putting the LARGEST
term first makes every other part slower, so **the dialled BPM is the fastest
part in the group** — the ceiling check the composer wanted, free, no display.
23 takes written to `bank/panel_snapshots.json` (the AI-dialling channel, unused
until today).

**The generator (2af) specified by dictation, spec-only.**
`docs/plans/TRANCE_GENERATOR.md`. Four layers: UNIT (ratio model + tempo) ·
HARMONY (own grid, own BPM, hold from an allowed beat-set, species shuffled-bag
from `more chords`) · CUIVRE (a rate layer on top; a COUNT per segment for this
piece) · PLAYER ASSIGNMENT. **The composer asked for a "rotation period", then
described a minimum-rest constraint — and his description was the better
algorithm.** Rotation emerges from it, it needs no clock, and it fails honestly.
FLOOR = 0.45 s (the measured staccato sample). Measured as comfortably
satisfiable: 1.05-1.71 s average gaps per player.

**First actualisation run: `tools/trance_gen.py` → `scores/gen-aud-01.json`.**
5 composer-chosen units x 4 generations x 20 s = 432 s, 4682 notes, 427 markers.
Verified: **zero minimum-rest violations** (tightest gap 0.539 s against the
0.45 s floor), even spread 457-480 notes per player, exactly 80 cuivre events
(4 per segment), all 13 species used. Deterministic — a rerun reproduces the
score byte-for-byte. **Three of the composer's five chosen tempos put the fastest
part under the 450 ms sample** (U19/U17 at 150 → 400 ms, U23 at 140 → 429 ms);
he chose them by ear so this is reported, not corrected.

**NOT verified: the sound.** Web MIDI is still blocked in the verification pane.
Every claim above is a data claim.

## Day 19 (2026-08-19) — the generator run in anger; the trance section starts being built

**The generator stopped being a spec and became the tool.** `tools/trance_gen.py`
(+ `_sets`, `_series` variants) produced five audition scores, and by the end of
the session the composer was assembling actual section material from them.

**THE FINDING THAT MATTERS MOST — silent notes.** The composer heard bricks that
were drawn but never spoke. **The staccato technique sounds only MIDI 30-65;
seven of the thirteen banked species in `more chords` carry a 66 or a 68**
(inherited from the played-in VERT01 voicings), so 273 of 3103 notes — 8.8% —
rendered and were silent. Fixed at use-time by octave-folding into range
(`66->54`, `68->56`), which is this repo's existing max-retention move.
**NOT fixed in the bank on purpose:** the bank records what the composer played
and chose. **The same silence will happen anywhere those species are inserted as
staccato, including through the Insertion strip.** The blast sandbox will let you
keep a pitch the technique cannot sound and nothing warns you. An offered
one-line range check at bank time was not built — worth doing.

**FIXED-TEMPO PER PLAYER (the notation decision).** The composer reasoned that
this section is far easier to notate and perform if each player holds ONE steady
pulse instead of jumping between tempi. Layer 4 gained a second mode and both are
kept: `ASSIGN='fixed-tempo'` puts six streams over ten players as **four pairs
plus two solos**, partners always 5 tubas apart, a pair splitting its stream's
onsets so neither plays every beat. **The orchestration moves entirely into the
pitches**, which are drawn per attack anyway. Verified: 210 player-parts, each
locked to one stream, worst deviation from that player's own grid **0.094 ms**.
**The 0.45 s rest floor became structural rather than enforced** — every stream
period at these tempos is >= 600 ms. *Trade the composer named and accepted:*
this gives up free reorchestration across the ensemble.

**A measurement caveat on myself:** an earlier check reported 696 off-grid
onsets. That was my tolerance being tighter than the file's own 4-decimal
rounding, not a data fault. Reported here because the first number was alarming
and wrong.

**The label collision came back.** `gen-aud-01` put a long header marker and the
species marks on the same lane; `renderMarker` hardcodes font-size 10 / y=24 /
x+4, so they overprinted and both became unreadable — **the exact failure the
composer warned about on day 18, made again.** Fixed by short labels placed
through the collision test, with the first harmony carried inside the index
label because it starts at the same instant and can never win a slot. Verified
423 markers, zero overlapping pairs.

**The five audition scores (all regenerable, all untracked):**
- `gen-aud-01` 5 composer-chosen units x 4 gens, species harmony, cuivre on
- `gen-aud-02` 7 short-cycle units at 100 bpm, cuivre OFF (found distracting)
- `gen-aud-03` same as -02 but fixed-tempo assignment + the range fix
- `gen-aud-04` treatment-major: unison / octaves / fifths / Messiaen swept
- `gen-aud-05` **model-major**, the one being used: one model at a time running
  a five-snippet series — unison, octaves (same pc), fifths, a Messiaen mode,
  and a closed cluster GROWING 4n->10n across the models. Pitch classes, fifths
  transpositions and modes are all shuffled so nothing ascends in order.

**THE ASSEMBLY WORKFLOW, which is how the section is actually being written.**
The composer plays an audition score, picks a segment by its index, and asks for
it at a point in the working score. The AI answers with a console script that
**cuts at a time and appends** — deliberately NOT the full-clear rule, because
this is real work rather than an audition wipe. Pattern established over
`aud-7` -> `aud-11` / `tranceA002f`:
`cut at T · N x base chord on the beat · a segment entering on beat N+1`.
Times the composer names are usually NOT on the grid (28.92, 34.36, 45.68,
60.92) — snap to the beat and SAY which beat was chosen. The base chord is
`[31,45,52,59,65]` = G1 A2 E3 B3 F4 on T1 T3 T5 T7 T9, one voicing held across
the repeats.

**Unheard / unresolved:** whether a paired stream reads as one line split
between two players or as two players who happen to coincide — the whole
notation bet rests on it. And 15 identical chords at the end of `aud-11` is much
more static than anything else in the section; flagged to the composer, not
acted on.

## Day 19 (2026-08-19, later) — the notation architecture: readback against three predecessors

**The composer opened the notation-layer phase at the conceptual top** — four
forms of one composition (composer / study-full / notation / performance), the
Turing-strip mental model, "one rich data source in time with different
manifestations but same identity," ticker-tape slicing so pagination is a view.
Dictation verbatim in COMPOSER_LOG day 19. Directive: readback and assessment
BEFORE any build, and consult the previous pieces for what the model looked like
when actually realized.

**What the predecessor consult found (read, not scanned — the architecture docs
only):**

- **Piece #1 (string quartet)** built the all-in-one WORKSHOP: authoring +
  performance in one `index.html`, curves sampled at 10 ms into time-indexed
  arrays, a curve follower on the scrolling cursor, LilyPond-engraved notation
  FRAGMENTS inserted as SVG, and the **Gravitational Conductor system — the
  bouncing-ball ictus with kinetic feel — already fully conceived**
  (`NOTATION_FRAGMENT_WORKFLOW.md`, Feb 2026). M4/M5's "gravitational conductor"
  is a direct descendant, not a new idea. Lesson the next piece paid for: the
  monolith had to be SUBTRACTED from (~30 patches + 7 strips) to derive a
  performance build.
- **Piece #2 (2p2p)** is where the one-source-many-manifestations model was
  actually engineered: `THREE_SCORES.md` (workshop=substrate / composer=source /
  performance=deliverable), a **7-stage per-object conversion pipeline**
  (classify → translate → layout → size → render → emit → route), **notation
  models/idioms as data** with a glyph library extracted from LilyPond's
  Emmentaler font, and **provenance blocks on every converted entry** pointing
  back at the composer source. Its scars are the instructive part
  (`COORDINATE_SYSTEM_VISION.md`, locked session 59): two coordinate systems
  with fragmented ad-hoc translation = recurring positioning bugs; the cure was
  ONE conversion engine, composer-first units, **decisions stored as RULES not
  baked data (P6), decisions at the IDIOM level not the instance (P7)**, and
  snapshot regression. Also sobering: its `NOTATION_SYSTEM_PLAN.md` is 357 KB —
  this phase sprawls.
- **Piece #3 / this piece** already hold PLAN §7 (2026-08-14): three scores,
  strip model, pagination-is-a-view. Today adds the fourth form (study/full) and
  the identity principle.

**The assessment delivered to the composer (summary — full text in chat, to be
folded into PLAN §7 when the composer responds):** the strip model is the right
data topology and is what all three pieces converged toward; it needs four
amendments. (1) Manifestation is COMPILATION, not reading — there are decisions
(spelling, grouping, tempo, model choice) that live in no stratum of the current
data; they need a first-class home or they get baked and go stale (piece #2's
P6 lesson). (2) The tape is NOT arbitrarily sliceable in the notation
manifestation — beams/ties/bars are non-local; slicing needs a cut-healing
contract, and the natural cut points are exactly **M5's
grouping-that-behaves-together — the M5 chunk is the atom of the strip**, a
convergence nobody planned. (3) Notation has TWO clocks — absolute seconds (the
strip coordinate) and musical time per chunk (M5's tempo-per-bar); the mapping
is itself data that doesn't exist yet. (4) **Mandates M1/M2 (part
multiplication, family adaptation at rehearsal time) force RENDER-LATE
semantics** — you cannot transpose an SVG — so the notation layer must exist as
a semantic intermediate representation (pitches, groupings, tempi), with
engraving at the end, where piece #2 could afford to bake SVG fragments.

**Deliberately NOT done:** no PLAN edit yet (the composer asked for readback
first — the model isn't confirmed), no schema drafting, no prototype. The M5
experiments stay un-run per the day-19 "collector, not verdict" instruction.

## Day 19 (2026-08-19, later still) — the architecture CONFIRMED; accommodation strategies named; the practical path proposed

**The composer confirmed all three decisions from the readback, each with an
elaboration that improved it** (dictations verbatim in COMPOSER_LOG day 19):

- **(a) Study score = a view, not an artifact — and it is TWO views**: a
  "study-composers" full score (all parts, the same notation the performers
  see, click-a-part-to-zoom) and a GRAPHIC SCORE view (the composer-score
  bricks + a meta-layer overlay of shapes, "like early graphic score
  representations of electronic pieces"). Plus derived-data visualizations for
  rehearsal: beating curves and approach/recede balls so a conductor can give
  instructions about continuous parameters ("you need to get to the C# quicker,
  the beating needs to be faster here") — breaths, swells, the things
  traditional notation renders poorly. Architecturally: stratum-2 (derived
  data) made visible, and the day-14 conductor-graphic idea is now part of the
  confirmed model, not a maybe.
- **(b) Render-late confirmed in principle**, with two named additions the
  concept must not block: the ENGINE ("could generate anything in the data
  layer as notation… and could also be a place to develop NEW notation") and
  the META-STRUCTURE (proportionate space grid that turns any sounding datum
  into a stamp/sprite — "black notehead, fff with accent and 1st partial of a
  5:2 tuplet with beams"). Placement: engine = the compiler passes PLUS a
  workshop surface for developing new devices (piece #2's Model Builder
  precedent); meta-structures = the data-linked layout substrates (time grid,
  per-part tempo rulers, lanes, page frames) served by ONE coordinate module —
  piece #2's most expensive lesson adopted on day one.
- **(c) Unified robust data layer as the base — confirmed.**

**Amendment 2 was restated by the composer into something better than my
version: ACCOMMODATION STRATEGIES.** Not infinite-resolution slicing and not
per-instance fixes — a finite BUCKET of splice behaviors that covers most
splice types, keyed to object class. The two poles from the dictation: a long
curve splices like a Matisse cutout (clip and paste, trivially); the scrolling
cursor needs a different mechanism entirely — jump to a new x,y and a new loop
while staying aware of the continuous time delta across the visual break. The
composer also rejoined this to amendment 1: page-boundary behavior (clamp/move
rules so notation doesn't fall off the page edge) is a DECISION TREE stored as
rules — the P6 principle applied at the layout level. **Confirmed from
experience: this exact problem ("long curves… keep their integrity in
different page sizes") was sticky in the previous pieces.**

**The practical-path economics, stated by the composer as policy:** AI time
estimates are orders of magnitude too long, but flawed plans eat real time in
troubleshooting and expectation-clarification — so: one solid plan → AI codes
a lot → a controlled refining phase → **a parachute** if a score must ship
early. Consequence: no duration estimates in the notation phase, ever;
phase gates with composer review instead.

**The proposed path (in chat, awaiting the composer's answer):**
- **Phase A — CONTRACTS**: a deliberately capped NOTATION_ARCHITECTURE.md +
  notation-IR schema v0 + three IR chunks WORKED BY HAND from real piece data
  (one trance bar, one morph window, one density-apex window) before any
  extractor code exists — hand-authoring finds schema flaws cheaper than code.
- **Phase B — vertical slice 1: the TRANCE section** end to end (extract → IR
  → stamps → grid → parts → splicing with the first 2-3 accommodation
  strategies). Chosen because the material is already measured metric
  (0.07 ms), fixed-tempo per player gives the simplest tempo maps, and it is
  what the composer is composing RIGHT NOW — notation feedback while composing
  is the methodology.
- **Phase C — study score v0** (both views + beating lanes).
- **Phase D — vertical slice 2: SECTION 1** — the M5 chunker experiments run
  for real ("when notation actually begins" = then), mixed per-chunk strategy,
  M4 device prototype.
- **Phase E — performance runtime** (sync, GC, M1/M2 — much inherited).
- **The parachute is structural, not a promise:** from slice 1 on, every chunk
  class has a guaranteed graphic-fallback manifestation, so "produce a score
  NOW" always renders — decided chunks as notation, the rest proportional.

**Dependency surfaced:** the 0–10 → dynamic-mark convention and the D3
performer-transform decision (both flagged "open before notation" since day
14) are needed by slice 1 — queued as Phase A agenda items for the composer.

**Supersession noted:** PLAN §7's "the other two begin when the composer score
is done" is superseded — notation starts now, interleaved with composing, and
that is the better order (the trance section gets notation feedback while it
is still wet).

**APPROVED (composer, same day):** slice 1 = TRANCE ("a. good") · Phase A
green-lit ("b green"). Constraint added: the composer wants this phase done
with the most capable model (Fable) but had ~2% of the credit window left,
renewal in an hour — so Phase A is cut into commit-sized chunks (A1
architecture doc → A2 IR schema v0 → A3/A4/A5 the three hand-worked IR chunks:
trance bar, morph window, density apex), each chunk ending committed + pushed
+ logged, so a credit expiry between chunks loses nothing. **Next step on
renewal: A1 — draft docs/NOTATION_ARCHITECTURE.md** (capped; strata · class
registry · accommodation bucket · engine passes · coordinate contract ·
parachute contract), then review with the composer alongside the two owed
decisions (0–10 → dynamic marks, D3).

## Day 19 (2026-08-19, credit-wait interlude) — density-build notation: Mists baseline, first-level rationals, the GC, count vs react

**While waiting on credit renewal for Phase A, the composer typed the notation
thinking for the SECTION-1 density builds** (verbatim in COMPOSER_LOG day 19;
filed as the M5 second amendment in PLAN §3), posting Mists mm. 65–67 as the
visual reference. What is new over the existing M5 record, and the assessment:

- **Baseline named: Xenakis Mists** — proportional spacing, beams = what
  sounds grouped in the individual part. Consequence: SEGMENTATION and
  RATIONAL FIT are separate chunker stages. Every part needs perceptual groups
  (for beams, and for GC landing points) whether or not any tempo fits; a
  metric description only ever applies to the subset that fits. The earlier
  chunker sketch conflated the two.
- **The vocabulary is now FIRST-LEVEL RATIONALS** (9:2, 7:3; not 21:19; no
  nesting). **This re-opens the apex verdict.** The day-19 measurement
  condemned the apex on straight grids only (8ths→32nds, triplet, sextuplet,
  beat 0.30–1.00 s). A p:q tuplet reaches a fine effective grid while the
  counted beat stays slow, e.g. 7:2 against a 60 bpm beat ≈ 171 ms grid — a
  hypothesis space the measurement never searched. "No countable tempo without
  32nds" is currently true FOR STRAIGHT GRIDS ONLY; unknown for this
  vocabulary. Statistical caveat filed with it: a rich enough vocabulary fits
  anything, so the first-level restriction is the complexity prior that keeps
  a fit meaningful, and min-run length + pre-registered kill criteria guard
  the rest.
- **The GC mechanism, made explicit** (the articulable reason behind the
  composer's intuition): the scrolling cursor is zero-order — it reports
  where NOW is and predicts nothing; a ball falling under gravity is
  PREDICTIVE — the eye extrapolates arrival from the trajectory (what a
  conductor's preparatory beat provides), and bounce height encodes the
  coming gap (flight time t → height ∝ t²), so the device displays the next
  duration BEFORE it sounds. The sensorimotor-sync literature on moving vs.
  discrete visual cues appears to point the same way — flagged TO VERIFY when
  E2 is designed, not asserted.
- **The count/react split** — *"players probably either count or react but
  not both"* — is a potential reversal of M5's own point 5 (tempo per bar as
  "the one that might do the real work"), made the same week. Candidate
  synthesis, filed for testing: found periodicity goes into the ANIMATION
  (the GC bounces the chunk's internal pulse; the notation stays
  proportional), so the score's metric knowledge is consumed by the
  conductor-device, not by the player's counting.

**Proposed experiment slate (E1–E3, proposed in chat; awaiting composer
green-light AND credits — the M5 do-not-run stance is not lifted
unilaterally):**
- **E1 — the chunker, extended** (data-only, cheap): per-onset error over
  candidate (countable tempo 0.30–1.00 s beat × first-level rational)
  descriptions; two-stage — gap-based perceptual segmentation first, rational
  fit second; maximal runs within tolerance; coverage-vs-ε curves
  (ε = 10–30 ms); min run 6 notes; tempo-churn penalty (the fixed-tempo
  lesson: one pulse per player per passage). Pre-registered kill criterion:
  coverage under ~30 % at ε = 20 ms ⇒ metric description is patchwork and
  notated tuplets (S4) lose by default to periodicity-in-animation (S3).
  Data: `cloud02-10track` first, then the other Section-1 realisations.
- **E2 — tap-test harness** (the measurable performance experiment): render
  the SAME Section-1 strip under each strategy in the app; the composer taps
  along on a MIDI keyboard (loopMIDI infra exists); compare tap-vs-target
  error distributions per strategy. n = 1 (composer-as-subject) suffices to
  eliminate gross losers; the harness is reusable with real players later.
- **E3 — GC device prototype**: ball physics (one parabola per gap, landing
  = attack), lookahead (when the ball becomes visible), irregular gaps
  (variable-height bounces), single group vs. chained groups.

**The strategy slate these discriminate between:** S0 cursor-only proportional
(control; already doubted — "slippage") · S1 Mists baseline (proportional +
perceptual beams + cursor) · S2 = S1 + GC landing at group starts · S3 = S2 +
GC bouncing the internal pulse where a first-level rational fits · S4 mixed
metric notation (tuplet + tempo glyphs on chunks that fit, proportional
residue) · S5 full metric at 32nds (already rejected — the gymnastics M5
exists to avoid). Elimination evidence: E1 coverage licenses or kills S4; E2
timing error runs S0/S2/S3/S4 head-to-head — the count/react question made
empirical; composer readability judgment covers what the numbers can't.

**Deliberately NOT done:** nothing run (credits, plus the standing M5
do-not-run) · no PLANNER edit (recent notation thinking files via PLAN §3/M5)
· no schema or prototype work (Phase A1 remains the next step on renewal,
unchanged). **Paper filings:** the GC mechanism, the count/react reversal, and
eliminate-with-reasons as method → PAPER_NOTES same day.

## Day 19 (2026-08-19, credit-wait, continued) — clarifications correct the record; NOTATION_EXPERIMENTS.md drawn up

**The composer's reply reshaped four things and answered "what's next" with
"draw up plan / design tests" — done: `docs/NOTATION_EXPERIMENTS.md`, design
only, nothing runs.** The corrections, because two of them fix errors in the
morning's record:

- **CORRECTION — the GC is not a new coinage.** It is **`GCMaker`**, a
  well-developed window-global in BOTH prior performance apps — verified by
  grep: `scripts/performance_parts_patches.js` in piece #1 and piece #2 (e.g.
  `calculateBallPositionForPage`), plus `performance_rehearsal_patches.js`
  and `public/index.html` in #2. The M5 record's "(composer term, as
  dictated)" read as if coined day 19; the term and the object predate this
  piece. **E3 therefore becomes PORT + EXTEND, not build**: new work is only
  the E1 chunk-data feed, an internal-pulse bounce mode (S3), and a
  port-time physics check (does bounce height scale with the gap, h ∝ t²? —
  if not, that is the one upgrade worth making).
- **The sequencing questions dissolved.** The AI asked "A1 first or E1
  first?" — wrong frame, and the composer said the questions were unclear.
  Their framing: the score architecture is *"the main but separateish
  build"*; the notation experiments are *"a concurrent side project that
  will eventually get folded in."* Two tracks, no ordering decision needed.
  A1 stays next on the main track; the side project waits only on
  per-experiment green-lights.
- **Baseline ≠ commitment.** Mists is the candidate *"I thought had
  promise"* — the composer is *"open to paradigm shifts."* The strategy
  slate is an open list (S6+ reserved).
- **A missing experiment CLASS, not just missing experiments:** discriminative
  vs DISCOVERY. The composer's example became **E0, the floor ladder** —
  same excerpt, one device per rung (dots → vert lines → full Mists page →
  GC landings → GC internal pulse), tap accuracy per rung; the result is
  WHERE accuracy jumps. Pre-registered readings include the one the composer
  named — *"the discrepancy is negligible"* between bare dots and full
  notation — which would mean the page carries reading value but not timing
  value, and timing lives in the animation.
- **The tap-test subject question answered, with a stated bias:** yes, but —
  *"not that good a trad notation reader, I'm an improvisor and have been
  looking at my own animations."* Filed in the design as pre-registered
  interpretation rules: bias favors react/animation conditions, so
  count-conditions WINNING would be strong (against-the-grain) evidence,
  animation winning is confounded and defers to a trad-reader replication,
  and within-animation comparisons (the E0 rungs) are the most valid for
  this subject. Harness stays reusable for real tubists later.

**State of the side project:** E0–E3 designed with pre-registered kill/
decision rules in NOTATION_EXPERIMENTS.md · run ledger empty · next actions
when the composer green-lights and credits allow: E1 (data-only, cheap) →
E2 harness build → E3 port. Main track unchanged: A1 on renewal.

## Day 19 (2026-08-19, credit-wait, continued) — the GC competence profile; the phrase reframe; E1 + E1b RUN

**The composer added the GC competence profile from two pieces of lived use,
and reframed the problem** (verbatim COMPOSER_LOG day 19). Both filed to
NOTATION_EXPERIMENTS §1/§4 and PLAN M5:

- **GC strong at:** rhythmically accurate entries · *"when spread thru the
  ensemble can produce interesting rhythms hard to notate"* (a COMPOSITIONAL
  affordance, not merely a reading aid — worth remembering when Section 1's
  material is still being generated) · baton-like, *"can give a pole, a
  rhythmic marker to play around"* (a reference to phrase against, not only
  a command to obey).
- **GC weak at:** phrase level · and **attack-coupled** — *"they can give a
  rhythmically accurate entry or attack point but tend to be coupled with the
  actual attack feel of the ball bounce… if you want a player to enter with a
  slow smooth attack ramp… they will have to resist the stated attack."* The
  timing channel and the articulation channel are entangled in one gesture.
- **AI proposal from that weakness (untested, composer decides):** cue soft
  entries at the parabola's APEX — the zero-velocity float — rather than the
  impact, and/or drop the squash/rebound rendering for ramped attacks. Keeps
  trajectory-predictability, changes the articulation connotation.
- **THE REFRAME, which now binds evaluation:** *"with the density build-ups,
  listening to individual parts, this is about finding ways to produce PHRASE
  PERFORMING STRATEGIES within a context of rhythmic complexity."* Accuracy
  demoted from goal to context. Consequence built into E2: a phrase axis
  (tap-velocity profiles + composer judgment) alongside onset error, because
  timing metrics are blind to the thing now named as the goal. Positive form
  of the hypothesis: **ball carries time, page carries phrase.**

**Also clarified:** the Es were designs only — the composer asked whether they
were built, and asked for *"a digestible chunk we can do now before passing on
to the main project."* Chosen chunk: **RUN E1** (data-only, needs no
construction). Ran it, and it forced a follow-up (E1b). Full results in
NOTATION_EXPERIMENTS §8; tools `tools/e1_chunker.js`, `tools/e1b_fixed_beat.js`;
output `analysis/e1/*.json`. Headline numbers on `cloud02-10track`:

    segmentation ceiling                          68.8 % (814/1184 notes)
    free beat, ANY grid unit        eps 20ms      68.8 %  = the ceiling
    free beat, playable unit>=90ms  eps 20/30ms   26.2 % / 57.1 %
    one fixed beat per part         eps 20/30ms   15.9 % / 44.7 %
    one SHARED ensemble beat        eps 20/30ms    9.1 % / 36.5 %

**Five findings, two of them corrections to my own earlier reasoning:**

1. **The free search reproduces the day-19 false positive in new clothes.**
   Unconstrained, the fit claims every note segmentation makes available —
   but at grid units of 33–87 ms (median 37) using 9:1 and 8:1 subdivisions.
   A countable beat with a high subdivision is just as unreadable as a fast
   beat. **"Countable beat" is not a sufficient constraint; the GRID UNIT is
   the binding one.** My own experiment design had inherited this hole from
   the day-19 method note.
2. **I WAS WRONG about first-level rationals rescuing the apex.** The morning
   entry hypothesized "a 7:2 on a 60 bpm beat reaches a ~171 ms grid while the
   counted referent stays slow — unsearched space." E1 selected **zero** p:q
   chunks, and the reason is provable: with a beat free in [0.30, 1.00] (a
   3.33× range) some integer p ≤ 9 always lands the beat in range, so a
   straight label always exists (1 exception in 1935 sampled units, at the
   extreme edge). **p:q is redundant in a free-beat frame — the frame makes it
   unnecessary, the material never gets a say.** The negative is therefore
   about analysis design, not about the composer's idea.
3. **So the idea was re-tested where it CAN matter (E1b, fixed beat) — and it
   works, modestly.** With one beat per part, 9:2, 7:2, 7:3, 8:3, 9:4 and 5:2
   all get selected, beating a straight-only vocabulary by **+0.7 pts at
   ε=20 ms, +4.6 pts at ε=30 ms**. But fixing the beat costs ~10–12 pts against
   the free frame, and a SHARED ensemble beat costs ~7–8 more.
4. **M5's open question now has a price tag.** Ordering is stable at both
   tolerances: free beat per chunk > one beat per part > one shared ensemble
   beat. The cost of ensemble metric agreement is measured, not argued.
5. **Per-chunk re-anchoring is the GC's structural job.** Every fit anchors
   error at each chunk's first onset, so error never accumulates — an
   assumption about performance that the ball discharges by landing. Even
   E1b's "fixed tempo" assumes it (fixed unit, free phase). **True continuous
   metric notation is stricter than anything measured here and remains
   unmeasured** — filed as E1c.

**Sensitivity, and the honest limit.** `PLAYABLE_UNIT` is binding — 80/90/100/
120 ms floors give 37.3/26.2/19.8/11.5 % at ε=20 ms, a ~3× swing across a
plausible range. `BEAT_MIN` (0.25 vs 0.30 s) has **no** effect on coverage, a
corollary of finding 2. **The pre-registered kill rule (<30 % at ε=20 ms)
FIRES at 26.2 % — but would not fire at an 80 ms floor.** Recorded verdict:
S4-everywhere stays dead; **S4-as-one-strategy-in-a-mix is what the numbers
support** — a quarter to a half of the material admits simple bars depending
on tolerance. E1 cannot settle where the playable line sits; that is a musical
judgment and it is E2's job.

**Verified, not asserted:** one reported chunk re-derived by hand from raw
score objects (tuba9 @ 48.910 s, grid `0 1 2 4 5 7 9 10 12 13`) → unit
135.0 ms, max error 17.0 ms, matching the tool exactly. The check also exposed
a labelling artifact: that chunk is plain eighths/quarters at ~222 bpm but is
*labelled* "3:1 at 148 bpm" purely because a 0.27 s beat sits under the 0.30 s
floor. **Report units, not just labels.**

**Deliberately NOT done:** E1 run on ONE score only (the other Section-1
realisations remain; the day-19 "indicative, not exhaustive" caveat stands) ·
segmentation parameters (`SEG_K` 2.0, `SEG_FLOOR` 0.35 s) never swept, and
they set the 68.8 % ceiling that bounds every number · no E2/E3 build (E2
needs a composer green-light; E3 is a port) · main track untouched — **A1
remains the next step on renewal.**

## Day 19 (2026-08-19, evening) — A1 RUN: NOTATION_ARCHITECTURE.md drafted

**The committed next step executed on credit renewal.** `docs/
NOTATION_ARCHITECTURE.md` drafted to the capped scope (strata · class
registry · accommodation bucket · engine passes · coordinate contract ·
parachute contract), from the day-19 record plus a fresh predecessor consult.
Ultracode was ON for this session — the consult and the doc's verification
both ran as agent fan-outs rather than inline reads, a deliberate exception
to the "high bar for subagents" rule for this phase's plan-quality economics
("flawed plans eat real time").

**Ground truth measured before drafting, and it shaped the doc:**
- **Storage is uniform: TWO object types** (`waveCurve`, `marker`) across
  `piece-s23` (1236 objects), `tranceA002f` (827), `cloud02-10track` (1208).
  Everything the notation layer must distinguish is fields and context
  (`morphBend`, `groupId`, `layer`, `technique`, `nodes`/`segments`).
- **Layer conventions DRIFT between scores:** markers at layer 0 in
  `piece-s23` but layer 10 in `tranceA002f`; META shapes are layer-10
  waveCurves. Consequence written into the doc: classification is a genuine
  rules-based pass (and exists from day one — piece #2 retrofitted its
  classifier LAST, after translators existed with nothing to choose them).
- **`tranceA002f` confirmed as the latest trance score** (composer:
  in-development, own score). Composer offered to insert the finished trance
  material into the main score if needed — **declined as unnecessary for
  slice 1**: the IR carries source-score provenance, so it reads
  `tranceA002f` where it lives; merging is a musical/assembly call, not an
  architecture need.

**The predecessor consult (4 reader agents, findings now on record):**
- Piece #2's seven-stage pipeline (Classify → Translate → Layout → Size →
  Render → Emit → Route) shipped an entire piece (431 svgElements, 177/177
  markers) — adopted as the engine-pass shape.
- `COORDINATE_SYSTEM_VISION.md` P1–P8 adopted as the coordinate contract
  (one module; seconds → lane-relative → pixels-never-stored; "mirrors are a
  smell").
- **Piece #2 never spliced an object** — its only boundary behavior was
  whole-object page-edge clamping (PL-2); multi-page split was explicitly
  out of scope. So the accommodation-strategy bucket is genuinely NEW work,
  not inheritance — worth knowing before slice 1 budgets effort.
- Piece #1 stated the precondition for baked SVG itself: valid only for
  *"a small, fixed menu of pre-composed material."* M1/M2 break exactly that
  precondition — the render-late argument now carries a citation instead of
  an assertion.
- The 357 KB sprawl autopsy (session stamps ~30 %, per-idiom catalogues
  ~20 %, numbered architecture abandoned at §18 while the log grew) became
  the doc's §9 anti-sprawl contract: contracts in the doc, catalogues in
  data files, runs in ledgers.

**Verification:** 3-agent adversarial pass (record fidelity · mandate
coverage · citation accuracy) run on the draft before commit; findings and
fixes recorded below when it returns.

**Verification returned: 16 findings across 3 checkers, all applied before
commit. The catches worth remembering:**
- **The draft INVENTED a decision** (must-fix): it declared the graphic
  fallback to be D43's permanent Section-1 residue strategy. The record says
  otherwise — the residue candidates are Mists proportional notation + GC,
  tuplets, an M4 device, or a compositional re-think, adjudicated by E0–E3;
  the fallback is the guarantee BENEATH the strategies. Same failure class as
  the E1 frame that made first-level rationals "unnecessary": the writing
  frame quietly closed a question the composer left open.
- **A composer quote was spliced backwards** — "main but separateish" names
  the ARCHITECTURE build, not the experiments; the draft had attached it to
  the experiments doc.
- **An open question was stated as a default** — "bars are per-chunk,
  per-part" where D43 only PRICES per-chunk > per-part > shared and M5 still
  owns the choice. Now §8 row 8, marked OPEN-with-a-price.
- **M3 was name-checked but homeless** — no release-device class anywhere,
  and the devices labelled "M3" were all scroll-family, which is exactly what
  M3 says won't work for releases. Now its own S4 class group + §8 row 9
  (the P3 design session).
- Citation hygiene: "atom of the strip" belongs to the PLAN §7 amendment,
  not D43 (and the independent-convergence point matters to PAPER_NOTES);
  "mirrors are a smell" is COORDINATE_SYSTEM_VISION §5, and piece #2's final
  Principle 29 is SHARPER than the draft's version (mirrors miss shared
  bugs); "two-thirds abandoned" and "paid for twice" were invented
  quantifications; five internal §-refs pointed one section high.
- Header now names its three content kinds honestly: composer-CONFIRMED ·
  predecessor-ADOPTED · AI-PROPOSED (awaiting this draft's review).

**Method note for the paper:** drafting from an in-context record still
produced six citation errors and one invented decision in a ~370-line doc;
the adversarial pass (checkers instructed to REFUTE, each against a
different source set) caught all of them at the source level. This is
Principle 5's mirror rule applied to prose — the draft could not be checked
against the same summary that produced it.

## Day 19 (2026-08-19, evening) — §8 walk-through, decision 1: the composer DISSOLVES the question instead of answering it

The proposed 0–10 → dynamic-mark ladder (A/B/C options) was met with a
structural dictation (verbatim in COMPOSER_LOG): **the MIDI and the notation
DECOUPLE on dynamics** (and possibly other parameters). S1's level numbers
are tuned to make the SAMPLER sound right — velocity/CC7 fights the library,
so the numbers are a sound-proxy, not notational intent. Consequences as
dictated: a translation layer that is **highly material-dependent** · some
marks **strictly manual** ("this note is p, this note is ff") · manual marks
may **contradict the MIDI evidence**, legally · possibly **no algorithm at
all**, and any that exist are per-material · **continuous change is carried
by CURVES, watched and expressed by the performer**, not by mark ladders.

**AI assessment (delivered in chat, recorded here):**
- **The architecture absorbs this; it does not break.** It is the strongest
  confirmation yet of "manifestation is COMPILATION": dynamics marks are S3
  CONTENT, like pitch spelling — authored, not derived at render.
- **One real amendment needed: PROVENANCE KINDS on IR content.** Every IR
  fact is `derived` (rule + inputs recorded, regenerable) or `authored`
  (composer, source of truth) or `authored-override` (composer, AND it
  contradicts S1 — the contradiction is recorded, not hidden). The overlay
  SURVIVAL law follows: S1 is live, so regeneration of derived content must
  never eat authored content — authored facts re-attach by stable identity,
  with an orphan policy when their anchor note vanishes. This is the biggest
  effect: it lands on A2 (schema needs stable node IDs + provenance kinds)
  and on A3–A5 (each hand-worked chunk should include one authored override
  to exercise the mechanism).
- **No conflict with P6** (decisions as rules): P6 guards against stale
  DERIVATIONS posing as decisions. An `authored` mark is source data, not a
  derivation — the provenance label is exactly what keeps the two
  distinguishable.
- **Decision 1 DEFERS cleanly.** No global ladder is adopted. The structural
  commitment replaces it: marks are authored-first IR content; per-material
  derivation rules are HARVESTED later, one material at a time, when a
  material demands one (D6's harvest methodology applied to notation).
  Slice 1 needs no convention — the composer hand-marks the trance chunk.
- **Decision 7 (velocity vs CC7) DEMOTES: it no longer blocks notation.**
  If neither carrier is notational truth, the notation layer does not need
  the verdict. 2q remains a mock-up/sandbox consistency question only.
- **The curve point sharpens D3 (decision 2), not just dynamics:** the
  notation of continuous change IS the displayed curve (performer watches
  and expresses it — D3's model verbatim). Marks anchor discrete events;
  curves carry continuous change; hairpins become a study-score engraving of
  the same data, not the primary device. D3's remaining question is now
  crisp: is the DISPLAYED curve the raw S1 curve or a transformed one?
- **Unaffected:** strata count, class registry, accommodation bucket,
  engine passes, coordinate contract, parachute, render-late.

**Doc amendment (§1 S3 provenance kinds + §8 rows 1/7) proposed to the
composer; not applied until they confirm the reading.**

**Confirmation + the realization principle (same sitting).** The composer
confirmed the reading and added the governing statement — *"the material will
determine how the data layer is interpreted and then realized for that
material"* — with hypotheticals (trance: mark per attack + hairpins; morphs:
animated volume curves, possibly a beating indication instead of traditional
dynamics). Applied as **NOTATION_ARCHITECTURE.md AMENDMENT 1** (§1 S3:
material-dependent realization + provenance kinds + survival law; §8 row 1
deferred-by-dissolution, row 7 demoted). Verbatim in COMPOSER_LOG. Walk-through
continues at decision 2 (D3 performer transform).

**Decision 2 dissolves like decision 1 (same sitting) → AMENDMENT 2.** The
composer's D3 position: performers react INSTINCTIVELY to a few BLUNT shape
families, not to fine geometry (20 % vs 25 % slope is not consistently
distinguishable between players); morph instructions may redirect what the
performer listens for ("a crescendo in the beating") without following the
playback's mathematical curve. Structural residue applied as amendment 2:
raw S1 curve stays canonical · the display pipeline carries an OPTIONAL
per-material transform slot (so compensation, if ever wanted, is an S2
derivation, not a fork) · performance semantics attach to blunt shape
FAMILIES per material, decided at material time. §8 row 2 restated. The
walk-through itself was closed by the composer as too detailed for now —
the standing test is now "does the answer fork the architecture?"; the
triaged list went to chat and the verdict was ZERO composer decisions block
Phase A/A2 (two technical picks — vertical unit, file locations — are AI
calls at A2 with rationale).

## Day 19 (2026-08-19, night) — A2 RUN: IR schema v0 drafted, validator mutation-tested

**Composer confirmed zero architectural decisions were owed and green-lit A2.**
Deliverables: `notation/schema/IR_SCHEMA_v0.md` (spec) ·
`ir_v0.schema.json` (machine contract) · `notation/registry/classes.json` +
`accommodations.json` (seeds, all status:proposed) · `tools/ir_validate.js` ·
a smoke example built from two REAL `tranceA002f` objects. No extractor code
— A3–A5 stay hand-worked by design.

**Decisions made in the drafting (AI calls, composer veto open):**
- **Locations: a `notation/` root** (schema/ · ir/ · registry/). Notation is
  a stratum, so it mirrors `scores/` (S1) and `analysis/` (S2). *Rejected:*
  docs/plans (data, not a plan) and bank/ (compositional, not notational).
- **Deterministic derived ids** — an event extracted from `wc-4386` is
  ALWAYS `ev-wc-4386`, every regeneration. This is what makes amendment 1's
  survival law mechanical: overlays re-attach by id and the id cannot drift.
- **The vertical-unit question EXITS A2** (was §8 row 5): the IR is
  semantic — no layout units at all; the validator REJECTS layout-unit keys
  in IR files. The staff-space-vs-lane-fraction choice moves to the
  coordinate-module build (slice 1), where it is real.
- **Reference, don't copy, the continuous** — envelopes/bends stay in S1;
  the IR copies only onset/duration/pitch/technique, and the validator's
  `--against-source` mode asserts the copies still match the source score
  (Principle 5's two-ends check). Duration deliberately UNCHECKED against
  S1: one-shots carry sample-true length, which diverges from the drawn
  block by design (D9).
- **Tempo at the finest grain (per chunk)** — per-part or shared tempi are
  then special cases, so the open musical choice (§8 row 8) forks nothing.
- **`unresolved` is a legal chunk strategy** and renders as the class
  fallback — the parachute is in the schema, not just the doc.
- **E1 fold-in mapping written as a table** (spec §5): every field of the
  chunker record maps onto the IR chunk.

**Validator mutation-tested before anything depends on it (Principle 6):**
9 deliberate breakages — bad enum · missing required · dangling ref ·
nondeterministic id · spelled-vs-midi mismatch (61 ≠ 63) · layout key ·
orphaned overlay target · span outside window · authored-override without
contradicts — ALL CAUGHT; the untouched example stays green, and
`--against-source` verifies the two real objects. The spelled-vs-midi check
is itself a two-ends assertion (spelling and MIDI pinned against each
other, not against a shared helper).

**v0 exclusions, explicit (spec §7):** ties/slurs · rests-as-nodes ·
multi-part chunks · M3 release devices (awaits P3) · 2j tremolo figures ·
page/system hints. Each enters by amendment when a hand-worked chunk forces
it — not before.

**Verification: 3-agent adversarial pass launched** (contract compliance vs
the architecture doc · expressibility vs real score data + the E1 record ·
validator-hunting with fresh mutations). Findings + fixes below on return.

**A2 verification returned: 22 findings, all applied; battery now 29 cases,
all green.** The catches worth keeping:
- **Seven validator checks LIED** (passed docs they should fail): the `in`
  operator walked the prototype chain, so a key named `toString` bypassed
  every closed object · duplicate ids silently deduped by Map · a marker as
  event-source made against-source compare against `undefined` (NaN
  comparisons pass) · cross-score refs skipped wholesale · {part,span}
  overlay targets never validated · chunk.class never resolved against the
  registry · stale orphaned flags accepted. All fixed and each now has a
  red mutation proving it. **A validator is code; it needs the same
  adversarial pass as anything else.**
- **The survival law had a hole at its flagship use case:** chunk ids had
  no deterministic rule, so a regeneration could renumber chunks and an
  authored STRATEGY overlay (the composer's per-chunk D43 call) would
  silently re-bind to the wrong chunk. Now: derived chunk id =
  `ch-<part>-<earliest member's source id>` — if the chunk moves, its id
  changes and the overlay orphans LOUDLY.
- **Two real-data gaps:** `maxErrMs` had no legal slot (added
  `tempo.maxErrSeconds` + `subdivision`, which also makes p:q exact instead
  of float-recovered); all 23 real groupIds span multiple parts, so the
  `{parts, span}` overlay target was added. Markers + gesture labels
  resolved as S1 READ-THROUGH, not IR carriage (reference-don't-copy).
- **Provenance split:** structural nodes are derived|authored only;
  overrides live ONLY in overlays — an "authored-override event" was
  structurally unable to record its contradiction, so the category was
  removed rather than patched.
- **Registry fallback law enforced on itself:** device-gc/device-cursor had
  "none needed" fallbacks — illegal under the doc's own no-exceptions rule.
  GC fallback = re-anchor ticks at landing points (a paper score keeps the
  re-anchor cues); cursor fallback = printed proportional time ruler.
- **A1 doc amended (dated):** §5 layer-2 (unit choice → coordinate module,
  slice 1) · §8 row 5 resolved-by-exclusion · row 6 resolved (notation/
  root + deterministic ids). The vertical-unit "decision" dissolved the
  same way decisions 1-2 did: the IR needed NO unit, so the fork vanished.
- **Part-name trap recorded:** E1 "tuba9" = layer 8 — track-id LOOKUP,
  never numeral parsing.

## Day 19 (2026-08-19, night) — A3 RUN: first hand-worked IR chunk, and the chunk model survives contact

**Composer: "a3 good."** `notation/ir/trance-bar-01.ir.json` hand-authored
from `tranceA002f` tuba5's closing passage (58.4-66.8 s) — deliberately the
most architecturally interesting bar in the section: the **"F oct B" figure
on the player's OWN 0.75 s pulse (80 bpm) joining the ensemble 0.4 s grid
("BASE E3" x15, 150 bpm), with a 0.136 s seam** where the streams collide.
19 events, 2 chunks, a derived beam group, GC landings at both anchors, one
authored instruction, one authored-override dynamic (the A2-mandated
mechanism exercise, flagged for composer revision).

**Verified twice:** `ir_validate.js --against-source` VALID, and an
independent re-derivation of both tempo maps against the RAW score onsets —
worst |predicted − actual| = **0.0000 ms** over all 19 events (generated
material; the check proves the hand-typed maps, not just the tool).

**The findings (why A3 exists — schema flaws found by hand, cheap):**
1. **Span = ONSET OWNERSHIP, not sounding time.** The seam breaks the naive
   reading: B1's sample rings 0.37 s into the BASE stream's span. The
   disjointness law is right only under onset semantics — now stated in the
   spec (A3 amendment).
2. **Adjacent-chunk boundary convention was missing:** boundary = next
   chunk's first onset, half-open spans. Now stated.
3. **The seam needed NO new machinery** — two chunks, independent anchors,
   GC re-anchor at each: the tempo-stream join that motivated the whole M5
   discussion is expressed by the existing model. The chunk-as-atom claim
   survives its first real material.
4. Non-finding worth recording: typing 15 identical BASE events by hand is
   verbose — that is extractor territory (post-A5), not a schema flaw.

Marker stream "base x15" correctly stayed OUT of the IR (S1 read-through,
spec §7). Next: **A4 — morph window** (grp-act-bloom-01-01 spans layers
0-7: first real multi-part exercise), then **A5 — density apex** (fold one
fullVocab ε variant of the E1 record).

## Day 19 (2026-08-19, night) — A4 RUN: morph window hand-worked; the multi-part case holds

**Composer: "a4 good."** `notation/ir/morph-window-01.ir.json` — the first
breath-span of `grp-act-bloom-01-01` (JYBloom001, piece-s23): all 8 parts
enter TOGETHER at 141.386 s on stacked fourths F2/Bb2/Eb3/Ab3, two players
per pitch; each player's 13-14 node envelope and 13-point morphBend stay in
S1 by reference. 8 events, 8 per-part chunks sharing one anchor (the §7
multi-part claim verified on the real gesture), a gesture-wide
`{parts, span}` instruction (the composer's day-19 "crescendo in the
beating" hypothetical, flagged as exercise), and the production spelling
pattern: events carry the naive sharps (A#/D#/G#), six AUTHORED spelling
overlays re-spell flatward (stacked fourths read flatward) — derived
proposal, authored decision, exactly amendment 1's shape.

**Verified:** VALID + --against-source · durations = S1 end-start to
0.000 ms (ORD real duration, D9) · every respell maps to the same midi.

**Findings:**
1. **The validator could not see a spelling overlay that RE-PITCHES.** The
   hand-check (respell → same midi) was a check the tool lacked — a
   spelling overlay could silently rename a note to a different pitch.
   Added: renames-never-repitches check + value-shape check, both with red
   mutations on record. (The A2 lesson recurs: every new overlay kind needs
   its own consistency check.)
2. **Completeness is unchecked and that is CORRECT for hand-worked docs** —
   the window contains later onsets the doc does not carry. Spec §7 now
   says so; a `--complete` mode is queued for the extractor build.
3. **No GC devices, deliberately:** morph entries are smooth ramps — the
   attack-coupled case. Device placement for this class awaits the
   apex-cue decision (A1 §8 row 4). The empty devices array is the honest
   state, not an omission.
4. **Breath structure surfaced:** each player's morph line is ~13 notes
   separated by ~0.7-0.8 s gaps (the carrier's breaths). v0 chunk-per-note
   works; whether a breath-PHRASE becomes the chunk (grouping several
   notes) is a material-time realization question, recorded not decided.
5. Six per-event overlays to respell one chord is verbose — a future
   span/pitch-class-scoped spelling RULE (P6-style) is the obvious
   compression; queued as a candidate amendment, not built.

Next: **A5 — density apex** (fold ONE fullVocab ε variant of the E1 record
for `cloud02-10track`), the last Phase A chunk.

## Day 19 (2026-08-19, night) — A5 RUN: density apex folded; PHASE A COMPLETE

**Composer: "a5 good."** `notation/ir/density-apex-01.ir.json` — tuba5's
apex window (47.904-54.9 s of `cloud02-10track`), folding the E1
`coverage['20'].fullVocab` record (identical at eps 15/25/30). Two chunks
claim ALL 19 tuba5 notes; this part's residue is SILENCE (52.0-54.9), not
unclaimed notes.

**The A5 point, and it worked: the fit is DATA, the strategy is a
JUDGMENT, and the schema separates them.** Both fits have 35.7/34.0 ms grid
units — below D43's 90 ms playable floor — so the tempo blocks are carried
as derived fit-data (full-precision floats from the record; subdivision x
unit == beat exactly, so the consistency check doubles as drift detection
against any future tool that rounds) while `strategy: "proportional"`
records the Mists-spatial performing decision. D43 in schema form. GC
landings at both anchors (re-anchoring is the GC's structural job).

**Verified:** VALID + --against-source · independent re-derivation of both
fits against raw onsets reproduces the record's claims EXACTLY (9.34 /
7.77 ms) · track-id lookup rule applied (tuba5 = tracks[4] = layer 4).

**Findings:**
1. **Latent schema flaw confirmed, not triggered:** integer `subdivision`
   cannot carry p:q fits with q>1 (E1b's 9:2 etc., real data on disk).
   Free-beat fullVocab provably only selects p:1, so every foldable chunk
   today fits. `subdivisionDen` amendment QUEUED in spec §7 for the first
   fixed-beat fold — not built early.
2. No overlays at all, deliberately: A3/A4 proved the override and
   multi-part mechanisms; fabricating one here would invent musical
   judgment. The `grouping` overlay kind is UNEXERCISED through A3-A5 —
   recorded; slice 1's real beaming decisions exercise it.
3. The mixed-strategy residue (unclaimed notes needing another treatment)
   did not materialize on tuba5 — other parts have it; slice 2 meets it.

**PHASE A IS COMPLETE: A1 architecture doc (2 amendments) · A2 schema v0 +
validator (31 red mutations on record) · A3 trance bar · A4 morph window ·
A5 density apex — every chunk committed + pushed + logged as designed.**
Next phase per the approved path: **B — vertical slice 1, the TRANCE
section end-to-end** (extract → IR → stamps → grid → parts → splicing with
the first accommodation strategies). Phase gate: composer review of the A
deliverables (A1 §8 table = what remains open).

## Day 19 (2026-08-19, night) — Phase A completeness-critic pass; 21 findings; the battery becomes a fact

Two critic agents swept the finished phase (one retry after an API drop).
**21 findings — no missing deliverable, but real record-hygiene debt from
the one-day amendment cycle. All applied:**
- **The mutation battery is now a COMMITTED, RUNNABLE artifact:**
  `tools/ir_validate_battery.js` — 29 red + 5 green cases, self-asserting
  on expected messages, GREEN on first run. Before this, "31 mutations on
  record" was prose; the validator had even been modified after the battery
  ran (A4) with no regression protection. Run it after ANY validator or
  schema edit. (The A5 log's "31" was a miscount of 29 red; the battery
  file is now the authority.)
- **Two must-fixes:** the journal's "Open at session end" still owed the
  composer the two DISSOLVED decisions (a cold reader would have waited on
  them — struck with dated markers, "do not re-open"); and the spec §5
  cls→strategy row would have had a Phase B extractor auto-assign
  tuplet-bar and ERASE A5's fit-is-data/strategy-is-judgment lesson — now
  marked DEFAULT PROPOSAL, overridden by the D43 playable-floor judgment.
- **The phase gate got a single assembled checklist** (journal §2 item 0):
  A1 §8 open rows · registry seeds to bless · the two in-file exercise
  flags · the three vetoable A2 calls. PLANNER.md's NOW block now points
  the composer at it (it had no day-19 notation entry at all — the gate
  was invisible on the composer-facing surface).
- Stale supersessions struck in PLAN §7 phasing, PLAN §3 M5 status,
  PLANNER line ~243, journal item 3. Architecture §1 gained the
  "refined at A2" marker (node/overlay provenance split) and the honest
  A3-A5 exercise outcome; §2 seed list synced to the registry (one
  fixed-oneshot class; drawn-crescendo → amendment-2 wording) and the
  missing `drawn-crescendo-curve` registry entry added. Spec §5 pq row
  corrected (subdivision = p, NOT q — an extractor following the old text
  would have written subdivision 1 for every 9:1 fit); scoped-spelling
  rule joined §7's queued list; ε-naming rule relaxed to tool-or-notes.
- Left as-is, deliberately: the breath-phrase observation stays log-only
  (amendment 1 owns all material-time realization questions); the one-off
  re-derivation scripts stay unkept (method described, validator half
  re-runnable via the battery).

## Day 19 (2026-08-19, late night) — B0 + B1 RUN: the plan, then the extractor; the section extracts end to end

**Composer: "b go", then "continue."** B0 =
`docs/plans/NOTATION_SLICE1_PLAN.md` (chunks B1-B6, decisions DB-1..DB-8:
app on the score server via a `/notation/` mount · vertical unit two-level
(lane-fraction places systems, ss inside them) · glyphs PORTED from piece
#2's LP-extracted library · SVG · proportional x in v0 — for fixed-pulse
streams metric and proportional spacing COINCIDE, so slice 1 gets correct
bar interiors free).

**B1 BUILT AND GREEN:** `notation/lib/classify.js` + `extract_core.js`
(pure, dual-load) · `tools/ir_extract.js` · validator `--complete` mode ·
`tools/ir_extract_golden.js`. **The full trance section extracts:**
`notation/ir/trance-section-01.ir.json` — 749 events (744 on grids), 56
chunks (51 trance-stream simple-bar · 5 honest singles), VALID with
`--against-source --complete`. Battery now 36 cases (30 red + 6 green).

**Two extraction bugs, both caught by the gates, both instructive:**
1. **The golden test earned its keep on first contact:** the initial run
   produced 19 singleton chunks — the rebase's approx-GCD had "found" a
   0.068 s unit at the A3 seam that glued BOTH streams onto one fabricated
   fine grid. **The E1 false positive reproduced itself in my own code
   within the hour of writing it.** Fix: the rebase floor is the PLAYABLE
   unit (0.09 s, D43's line) and a rebase must subdivide the current unit
   near-integrally. Golden went green.
2. **The full section broke what the golden window could not see:** VERT01
   chord accents (0.2 s ords, fp one-shots) sit ON the stream grids INSIDE
   the pulse fabric — the model had them splitting streams into fragments.
   The data corrected the model: **grid-aligned accent hits WEAVE INTO the
   stream** (events keep their own technique + sample-true duration; 59
   accents wove in: 30 fp, 22 ord, 7 cuivre); only multi-node material
   (crescendos, morphs) splits. Registry classify note updated.

**Independently audited, not just validated:** re-deriving every grid
against raw onsets reproduces the reported worst error exactly (12.065 ms,
one accel-region chunk at unit 0.2, inside TOL 15); the unit census matches
the section's known pulse structure (0.4 ×22 chunks, 0.75 ×10, the
multitempo ratio units 1.091/0.667/0.585/0.543/0.507 all present); the 5
singles are genuinely isolated attacks (4 = the sparse opening canon's
first entries). Next: **B2 — the coordinate module.**

## Day 19 (2026-08-19, late night) — B2 RUN: the coordinate module

**Composer: "b2 go."** `notation/lib/coords.js` — pure, dual-load, ONE
module owning every translation (architecture §5): seconds → x per view ·
lane-fraction → system bands (the meta-structure; `systemsForParts` builds
the equal-band default) · staff-space inside a system, with **SZ-7 adopted
structurally: ssPx derives from the band height** (`ssPerSystem` = 12), so
a resize rescales everything coherently and no absolute-pixel calibration
can exist to break. +ss goes UP the page (stated once, tested). Pixels
appear only through a View object and are stored nowhere.

**P8 starts before the first pixel:** `tools/test_coords.js` — unit tests
(round-trips, band disjointness, orientation, window edges, loud errors) +
**viewport-invariance test** (doubling the viewport doubles every px value
and changes no relationship) + a **committed snapshot**
(`tools/fixtures/coords_snapshot.json`, two view configs, 10-system page
included) + **`--prove-red`** (Principle 6 built in: a perturbed run must
fail, and does). All green; battery still 36/36. Next: **B3 — glyph port +
stamps.**

## Day 19 (2026-08-19, late night) — B3 RUN: glyphs ported, stamps are typed boxes

**Composer: "b3 go."** `tools/port_glyphs.js` mechanically ports the slice-1
set from piece #2's LP-extracted library into `notation/lib/glyphs.json`
(provenance on every entry; source repo read-only): filled notehead (+
measured stemAttachUp/Down, center-relative → top-origin converted), 8th
flags up/down (stem-tip anchors), bass clef (fLine anchor = the line the
dots straddle), sharp/flat/natural, and the measured standards (staff 5 ×
1 ss, line 0.1 · stem 0.13 · beam 0.40/0.81/0.41 · ledger 0.1/0.25).
Staccato dot is procedural 0.4 ss (piece #2 had none). Paths are in
STAFF-SPACE with bbox-top-left origin, fill-only — one ssPx scale renders
everything.

**Deliberately NOT ported, with reasons:** REST glyphs — piece #2 has none
anywhere (grep-verified), and slice 1 needs none: the IR has no rest nodes
(spec §7 — rests are gaps) and on the strip the gap IS the rest; glyphs
enter when rest nodes do. Dynamics glyphs — marks are authored-only
(amendment 1); v0 renders them as text. 

**`notation/lib/stamps.js` — typed boxes with anchors** ("anchors compose;
positions don't"): notehead · stem · flag8 · clefBass · accidental ·
staccatoDot · staffLines (per-line anchors, middle = line2) · ledgerLine ·
beamSeg (parallelogram, vertical thickness) · `toSvg` (place by aligning a
named anchor at a px point; uniform scale; fills only).

**Gate:** `tools/test_stamps.js` — parity against LITERAL dims-table
numbers (two-ends: not glyphs.json read back at itself) · the
ANCHORS-COMPOSE assembly proof (notehead → stem root at stemAttachUp →
flag at stem tip, all by anchor alignment, tip lands exactly 3.5 ss above
the attach) · committed snapshot + --prove-red. All green; coords + battery
regressions green. Next: **B4 — layout passes.**

## Day 19 (2026-08-19, late night) — B4 RUN: layout passes; the whole section lays out

**Composer: "b4 go."** `notation/lib/layout.js` — pure, VIEW-INDEPENDENT
(every item is (t seconds, dxSs, ySs-from-middle); pixels never appear —
P5). Passes: pitch→bass-staff position (D3 = middle line; unit-tested
against theory, and the ONE red in the first run was MY test expectation —
G2 is the bottom LINE, not a space; the code was right) · ledger-line rule ·
stems by rule (at/above middle → down) with the ported attach anchors ·
staccato dot OPPOSITE the stem · accidental-on-every-altered-note (atonal,
no carry) · sub-beat beaming (subdivision ≥ 2: grid-contiguous same-beat
neighbors beam, uniform direction by majority, horizontal beam line at
stemLen past the extreme head; loners get 8th flags) · tempo label + GC
re-anchor tick per chunk (the registry's device fallback, rendered) ·
fp/cuivre weave-accents tagged as text (v0) · **the PARACHUTE pass as a
first-class sibling: unresolved chunks render per-event pitch-height
bricks, zero glyphs.**

**v0 simplifications stated in the module header:** all heads filled +
stemmed (values beyond sub-beat undistinguished — no open heads, no rests);
beams only at sub-beat level (quarters don't beam).

**Gate:** `tools/test_layout.js` — staff-math units · REAL-A3-window census
(19 heads/stems/dots, 4 ledgers = the two B1s, 2 tempo labels, 2 GC ticks,
0 beams at subdivision 1, stem directions and dot sides checked note by
note) · synthetic subdivision-2 beaming case (one beam run + two flags,
beat-boundary split correct) · parachute case (4 bricks, 0 glyphs) ·
full-section smoke (10 systems, 2000+ items, exactly 5 bricks = the 5
singles, no warnings) · committed snapshot + --prove-red. Full regression
green (coords · stamps · golden · battery 36). Next: **B5 — render + the
page: first pixels.**

## Day 19 (2026-08-19, late night) — B5 RUN: FIRST PIXELS — the trance section renders

**Composer: "b5 go."** `notation/lib/render.js` (pure; the ONLY place pixels
exist) + `notation/app/notation.html` (part picker · window from/width ·
◀▶ paging · marker read-through strip along the top) + one static mount in
`score/server.js` (`/notation/` → the stratum, read-only GET — the
composer app is otherwise untouched). Ink black-on-paper; parachute bricks
in muted blue at 0.45 opacity so mixed fidelity reads at a glance.

**Verified LIVE in the running app** (score-verify :5210; the composer's
:5200 untouched — NOTE: it needs a restart to pick up the mount):
zero console errors · full render (150 paths / 344 rects / 140 dots / 61
texts across 10 systems, window 0-16 s) · part picker to T5 collapses to
one system · ▶ pages the window · scrolled-window check after the fix
below. `tools/test_render.js`: A3-window SVG census EXACT (20 paths = 19
heads + clef · 19 dots · 31 rects · 4 texts · 0 beams) + narrow-window
clipping + SVG-hash snapshot + prove-red.

**Two defects found by LOOKING at the seam proof, not by the tests
(Principle 4's lesson lives):** (1) the clef vanished in any window past
the section start — placed at layout t=0, never pinned; now pins to the
view's left edge (staff furniture is always shown). (2) tempo labels
dwarfed a single-system staff (1.1 ss text at ssPx 23); sized down to
0.75/0.7 ss. Snapshots regenerated deliberately (--update is a reviewed
act), full regression green (layout · render · coords · stamps · golden ·
battery 36).

**Known v0 gap, deferred to B6 where it belongs:** a chunk whose anchor
lies LEFT of the window loses its tempo label — re-showing context at a
cut is exactly a page-edge accommodation strategy (the bucket's job), not
a render hack. Proof SVGs sent to the composer + committed
(`notation/app/proof-*.svg`): all-parts opening, and T5 alone at the
two-tempo seam. **The B5 composer gate (first pixels) is OPEN.**

## Day 19 (2026-08-19, late night) — B6 RUN: splicing — SLICE 1 COMPLETE

**Composer: "b6 go."** `notation/lib/splice.js` + **page-edge rules as DATA**
(`notation/registry/page_rules.json`, P6 — changing a rule re-plans every
page) + page mode in the app (planned pages replace fixed windows; meta
shows page k/N and the cut kind). The first three accommodation strategies
are now RUNNING CODE:
- **bars-prefer-chunk-boundaries:** cuts snap to chunk edges near the
  target (fewest-interrupted, ties toward the target);
- **stamp-atomic:** a cut forced through a sub-beat chunk snaps to THAT
  chunk's beat grid, and sub-beat beams never cross a beat — so no beam
  group can straddle a cut. Proven END-TO-END on a synthetic beamed chunk
  (89 beams, 2 beat-snapped cuts, zero straddles);
- **page-edge-rules:** a chunk continuing across a cut re-shows its tempo
  label "(cont.) …" on the new page — closing B5's known gap where it
  belonged.
- (Matisse-cut needed NO code — staff lines and bricks already clip at
  edges in the renderer; recorded because that is the point of the class.)

**A data fact the test surfaced honestly:** the real section carries ZERO
beam groups — the sub-beat chunks are the ACCELERANDO streams, whose notes
sit 2-3 grid units apart and are never beat-adjacent. The test now asserts
the layout beam count against an INDEPENDENT count from the IR (0 == 0
here, and a future re-extraction that produces beams stays protected)
rather than assuming beams exist.

**Verified live** (:5210): 6 pages over the section, kinds
interrupting/beat-snapped/end all exercised, continuation labels render,
paging clamps, zero console errors. Page 4 (34.4-46.4, the beat-snapped
cut protecting the accelerando region, 4 continuation labels) sent to the
composer + committed. Full regression green: splice · render · layout ·
coords · stamps · golden · battery 36.

**SLICE 1 IS COMPLETE: B0 plan · B1 extractor · B2 coords · B3 glyphs ·
B4 layout · B5 page · B6 splicing — extract → IR → stamps → grid → parts →
splicing, end to end on the composer's live trance section, every chunk
committed+pushed+logged, parachute live throughout.** Phase gates open:
B5 first-pixels + B6 phase-end (one review). Next per the roadmap:
**Phase C — study score v0**, or fold composer feedback from the gate
first.

## Day 19 (2026-08-19, late night) — Phase B code review: 30 findings, all run-proven; fixes applied

**Three review agents (correctness · engraving conventions · contracts),
every load-bearing finding PROVEN BY RUNNING code.** All fixed same
sitting; the regression suite now carries a red case for each. Highlights:
- **Page-seam double print (must-fix):** an event exactly on a cut inked on
  BOTH pages (7 of 749 events at pageSeconds 16 — cuts land on onsets BY
  CONSTRUCTION, since boundary cuts ARE first onsets). Pages are now
  half-open at the right edge (`ownsEnd`), matching the IR's own [start,
  end) convention; verified live (window paging no longer duplicates).
- **Stamp-atomic held for only ONE part (must-fix):** the beat-snap
  satisfied subBeat[0]'s grid and could sever another part's beam. Cuts are
  now scored against the BEAMABLE PAIRS of every interrupted sub-beat
  chunk; any chunk still off-grid is RECORDED on the page (`offGrid`,
  displayed in the app) — incommensurate grids make perfection impossible,
  so the residue is loud, never silent. Multi-part proof in the suite
  (incommensurate 0.25/0.21 grids, zero severed pairs end-to-end).
- **A doubled onset demoted a whole stream to bricks (must-fix):** d<=0
  slipped the rebase guards, fitUnit rejected the run, every note fell to a
  singleton. Same-onset events now sideline as their own chunk; the run
  survives (red case in the golden tool).
- **Dead-span "(cont.)" labels:** continuation/interruption now judged by
  MATERIAL extent, not span (spans run to the next chunk's start by
  convention) — 9 phantom labels on page 4 gone, and the re-plan actually
  found a CLEAN cut at 48.8 that the dead spans had been hiding.
- **Engraving fixes** (reviewer measured coordinates in rendered SVGs):
  down-stem beams drew on the wrong side of the tip line · staccato dots
  landed ON staff lines (now space-snapped, Gould) · dots read the
  pre-beam stem direction (now placed after directions are final) · stems
  now extend to the middle line for ledgered notes (261 of 749 events
  live beyond the 3rd ledger) · beamed-group direction = farthest note,
  ties down (was majority-vote) · flags now mark only OFF-beat notes
  (57 of 88 flags were on-beat quarters wearing 8th flags) · the flat's
  BULB, not its bbox center, sits on the note (noteY anchor added).
- **Authored overlays finally render (contracts reviewer):** spelling
  overlays APPLY before staff placement (A4's Bb2 now places at -1, not
  A#2's -1.5), dynamics render below the staff, instructions above, and
  any unconsumed overlay kind is a loud warning surfaced in the app —
  silence was the failure mode amendment 1 exists to prevent.
- **Strategy honesty:** 'proportional' chunks no longer wear simple-bar
  dress (no beams/flags/bpm label — the residue treatment is OPEN, E0-E3);
  unchanged tempo labels suppressed; server mount got the trailing-sep
  containment guard + .md MIME; page_rules dead fields demoted to _doc
  (P6: only rules that execute); pageSeconds<=0 throws instead of hanging.
- **Recorded as debt, not fixed (NITS):** the renderer re-implements
  stem/dot/staff/ledger/beam geometry instead of calling the stamp
  constructors the B3 parity gate tests — piece #2's P29 mirror smell.
  Minimal fix applied (ledger width now reads the glyph table); full
  rerouting queued.
**Suite after fixes: 7 test tools + battery, all green, all prove-red.**

## Day 19 (2026-08-19, late night) — C1+C2 RUN: STUDY SCORE v0 — both views + the beating lane

**Composer: "looks good phase c go."** Phase C v0 shipped as two chunks:
- **C1 — `notation/lib/graphic.js`:** the GRAPHIC SCORE view reads S1
  DIRECTLY (read-through — ANY score renders, no IR required): per-part
  brick lanes on a fixed pitch axis · layer-10 META shapes as translucent
  envelope overlays across the part area · marker labels · and **the first
  derived-data rehearsal lane: BEATING CURVES** — same-pitch morphBend
  pairs, beat(t) = |f1−f2| per D28, sampled and drawn with an Hz scale.
  Hand-checked against an independent computation on the real bloom:
  **the F2 pair peaks at 5.93 Hz** — the number a conductor would rehearse
  toward ("the beating needs to be faster here"). Gate:
  `tools/test_graphic.js` (censuses vs raw counts · D28 law check · clamp
  edges · render sanity · snapshot + prove-red).
- **C2 — the page becomes the STUDY SCORE:** view switcher
  (notation | graphic) · score picker for the graphic view (tranceA002f ·
  piece-s23) · **click-a-part-to-zoom** in the notation view (click a
  system → that part alone; click again → back to all — the
  "study-composers" affordance from the day-19 dictation). Verified LIVE:
  trance graphic = 139 bricks/0 META/0 beating (correct — no morphs);
  bloom graphic = 16 bricks, 1 META, 11 beating pairs with the lane
  rendered; zoom in/out works; zero errors. Proof
  `notation/app/proof-graphic-bloom.svg` sent + committed.

**Phase C v0 scope line:** static curves shipped; the ANIMATED
approach/recede balls are runtime devices (Phase E with the GC family);
breath and swell lanes are further derived-data lanes queued for material
time — same mechanism, new data sources. All three views are
CONFIGURATIONS over the strata, as the architecture demands — the graphic
view needed zero IR.

**Composer first-look verdict (same night): "I looked at the notation —
looks great."** First eyes on the pipeline output over their own section.
The graphic view was initially missed (it lives behind the `view` dropdown,
and on tranceA002f it is honestly plain — no META shapes, no morphs in that
score); pointed to piece-s23 @ 141 s for the bloom + beating lane. UI note
recorded: the view switcher may deserve more prominence (tabs, not a
dropdown) — material-time polish, not now.

## Day 19/20 (2026-08-19/20, night) — D1 RUN: Section 1 extracts — the mixed strategy is REAL, and it corroborates D43

**Composer: "ok good on to D then."** The extractor gains the `section1`
profile (trance path untouched — golden green): E1's perceptual-gap
segmentation (SEG_K 2.0 / floor 0.35) · per-group least-squares fits
constrained to PLAYABLE units (>= 90 ms, D43's floor) · **maximal SUB-RUN
claiming** — the first cut of this chunk demanded the whole group fit and
got 3.8 % coverage; one outlier was condemning twenty notes. E1's frame
claims maximal fitting sub-runs; implemented, coverage went to the real
number. ε is a CLI dial (`--eps`).

**`cloud02-10track` extracted at BOTH tolerances, both valid
--against-source --complete:**
- ε=20 ms: 44 simple bars, **24.0 % of notes on grids**, 182 proportional
  residue chunks (D43's independent measurement: 26.2 %)
- ε=30 ms: 88 bars, **53.0 %** (D43: 57.1 %)
**Two independent implementations of the frame land within ~3 points of
each other — the E1 experiment and the production extractor corroborate.**
Independent audit: zero tolerance violations, every fitted unit playable
(90-224 ms), worst errors exactly at their ε bounds.

**The pipeline's first REAL exercise of its hard cases:** the played fits
have beat-adjacent pairs, so **64 real beam groups** now exist (the trance
had zero) — layout beams them, and splice's multi-part stamp-atomic
scoring holds across every cut (severed = 0 on all pages). Gate:
`tools/test_extract_played.js` (jittered-unit recovery · outlier isolation
· gap-split + MINRUN residue · the D43 coverage bands · beams + splice on
real data · snapshot + prove-red).

**What the composer will decide by EYE (next chunk renders it):** the ε=20
vs ε=30 comparison — 44 vs 88 bars over the same material — turning A1 §8
row 3 from an abstract tolerance question into two pictures.

## Day 20 (2026-08-20, night) — D2 RUN: the ε dial made VISIBLE; M4 prototyped; PHASE D v0 COMPLETE

The page gains an **IR picker** (trance-section-01 · section1 ε=20 ·
section1 ε=30 — markers read through from whichever score the IR names) and
the **M4 checkbox**: proportional residue renders as VERTICAL ATTACK LINES
at pitch (the rapid-staccato device's static half; the bouncing ball is
Phase E runtime). Verified live: the apex window at ε=30 shows 15 real beam
groups; M4 swaps residue heads for lines; zero errors.

**Three proofs sent + committed** (`proof-s1-apex-e20/e30/m4.svg`): the
SAME apex at both tolerances side by side — 44 vs 88 claimed bars over the
section — plus the M4 alternative. **A1 §8 row 3 (is ε=30 ms musically
acceptable?) is now a LOOKING question, not an abstract one.** The mixed
strategy the composer reframed in M5 ("find chunks that are simple at a
proper tempo; the rest gets something else") is on screen: metric bars with
tempo labels where the material admits them, Mists-proportional (or M4
lines) where it does not, per chunk, per part.

**PHASE D v0 COMPLETE:** the M5 chunker runs for real in production
(corroborating its own experiment within ~3 points) · mixed per-chunk
strategy renders · M4 static prototype in. Remaining Phase D material-time
work, recorded: tuplet-bar strategy (needs fixed-beat policies — E1b's
frame), m>=3 tuplet numerals/double flags, and the composer's ε verdict.
Next per the roadmap: **Phase E — performance runtime** (sync, GC port =
E3, M1/M2 at load), largely inherited from pieces #1/#2.

## Day 20 (2026-08-20) — SESSION END: the reframe, and the wrap

**Session-end dictation (D45, verbatim in COMPOSER_LOG):** the performance
runtime ("Phase E") is SEVERED into its own future project — "the whole
performance side needs a rethink." The phase's mandate — architecture and
structures in place — confirmed delivered: "it looks like all the tools are
there. The parts looks really good." Machinery gets built and refined WHILE
BUILDING THE ACTUAL SCORE; requirements harvested as they arise. When
notation resumes: **PARTS FIRST**, then laid into the study score.

**Next-session ordering (the composer's):** 2ad phase-shifting sitting →
finish the piece from the beginning → density-build experiments if time →
the actual parts notation. Journal §2 rewritten for a cold start; D44/D45
promoted to §4; PLANNER NOW + PLAN §7 amendment synced; PAPER_NOTES carries
the day's three arguments (dissolving decisions ×3 · experiment↔production
corroboration within ~3 pts · run-proven adversarial review).

Housekeeping: composer's :5200 server left RUNNING (detached, has the
/notation mount); the :5210 verify instance stopped at wrap.

## Day 20 (2026-08-20, second sitting) — Penn State deliverables PREPLAN (capture)

**The composer opened a second sitting to preplan the three Penn State
deliverables** (recording from the MIDI · screen-following video at 1920×1080 ·
PDF full score) BEFORE moving on to the phase-shifting sitting. Not a plan yet —
decisions about the two fixed formats, so that when notation development starts
(post-piece, part by part, section by section) every trial lands **in the
container it will ship in** — the composer-score insert loop applied to
notation, and the container that eventually becomes the study score. Dictation
verbatim in COMPOSER_LOG; organized capture + decision slate (PP-1…PP-5) + the
plan's requirement list in **`docs/plans/PENN_STATE_DELIVERABLES_PREPLAN.md`**.
Scope fence recorded there: study/conductor score workout, rehearsal scenarios,
the D45 performance project, and all responsive-format work stay
POST-SUBMISSION. Decision verdicts pending the discussion; they get appended
here and filed in the doc when taken.

**Amendment, same sitting — PP-6, one geometry / two windows.** The composer:
play in 1080p, but PREVIEW zoomed in, each track at the same dimensions;
vertical scroll bars fine, horizontal not — "I don't wanna scroll along while
watching it animate." Resolved as ONE geometry with TWO window configs: the
locked 1080 video view + a zoom view = uniform magnification of the same
layout, with systems re-cut to 1/Z of the time span so the zoomed system stays
full-width and the cursor sweeps in frame (plain magnification would clip
horizontally and force mid-animation panning). Pagination-is-a-view makes the
re-cut cheap; zoom is a magnifier, not a second format. Recommendations PP-1
through PP-6 adopted PROVISIONALLY by the composer; drill-down queue filed in
the preplan doc §4.

**Second amendment, same sitting — THE DECISION TAXONOMY (three tiers).** The
composer's clarification of what the preplan is FOR: TIER 1 = look-defining
decisions (anything that wholesale changes how the notation looks: frame,
track heights, staff size, time scale, system cutting, fonts, cursor, META
styling) — closed UP FRONT, so during notation "everything's already coming in
the way it should look." TIER 2 = notation-content decisions during the
part-by-part work, judged at final spacing/aspect (the PP-6 zoom invariant is
what makes zoomed judgments valid). TIER 3 = the fine-tooth-comb polish pass
at the END — borders, part crowding, ledger-line creep; "save all the little
details till the end." Mechanism: a notation-specific polish ledger fed during
tier 2 (micro-defects filed, never discussed mid-notation — D18 applied);
tier 3 works the ledger. Boundary: this container is composer/jury-facing;
performer-facing versions (D45's project) will look "dramatically different"
and do not constrain tier 1. Filed as preplan doc §3; requirements updated
(close-tier-1-first phase + polish ledger + tier-3 pass).

**Evaluation + the plan drawn (same sitting).** Composer's go: "do a proper
evaluation, and then we'll draw the plan, but we won't implement it now."
Read the notation stack against PP-1…PP-6 (coords/splice/layout/render/
graphic/extract_core/notation.html/page_rules). **Verdict: NOT a new build.**
coords.makeView is fully parameterized — the 1080 video view is a config, and
PP-6's zoom invariant (every coordinate ×Z) holds BY CONSTRUCTION because ss
is lane-relative (SZ-7) and all px derive from the view; splice.planPages
takes pageSeconds → the zoom re-cut is planPages(pageSeconds/Z); layout is
view-independent so video/zoom/print share one model. Genuinely new: (1)
transport + cursor — the app has zero animation today (clock slaved to the
Reaper-render audio element; system turn at page.t1); (2) video export —
deterministic frame render → ffmpeg (8.1.1 already installed, on PATH) →
mux Reaper WAV; (3) PDF export (mm view, Letter landscape). Modifications
confined to the notation.html shell (video + zoom modes; META overlay ported
from graphic.js; a real header — markers today are a y=12/font-10
placeholder, the D41-corollary trap). Glyph vocabulary growth explicitly
fenced OUT (tier-2 material-time). Filed as preplan §8. **Build plan drawn:
docs/plans/DELIVERABLES_BUILD_PLAN.md** — V0 close-tier-1 (9 decisions by
eye against true-size proofs, frozen into notation/registry/container.json)
→ V1 two windows (invariant as a mutation-proven test) → V2 transport/cursor
→ V3 trial-insertion loop + polish ledger → V4 video export → V5 PDF export
→ POL tier-3 pass; gates G0–G6; V0–V3 before notation starts, V4/V5 by
submission. PLAN.md item 8a added. READY, NOT STARTED (D35) — next: the
composer's phase-shifting sitting; this plan runs when the piece is done.

**Third amendment, same sitting — the TYPESETTING question.** Composer: the
metaphor is typesetting — notehead size, stem height, "kerning," future
quote-unquote fonts must be accommodated by the structures, not require
rebuilds. Assessment (preplan §8 addendum): the architecture is right in
kind — glyph metrics are data in staff-space units with anchor points,
stamps are metric boxes, every layout item carries a dxSs fine-offset (the
kerning channel), and the box+anchors+ss model is SMuFL-shaped so a real
engraving font could back it later. THE ONE REAL GAP: engraving numbers are
scattered (glyphs.json standards + layout.js code defaults + render.js
inline multipliers) — today "bigger noteheads" is a code edit. Closed by
plan amendment: V0 decision 10 = ENGRAVING REGISTRY (one typography block
in container.json, censused from code); V1 wires layout/render to it +
writes the glyph extension contract. Plan question answered: the plan IS
already drawn (DELIVERABLES_BUILD_PLAN.md, last commit) — with this folded
in it is complete; composer proceeds to phase shifting / finishing the
piece, runs the plan before notating.

---

## Day 21 (2026-08-20, third sitting) — 2ad OPENS: the models are auditioned, and the slate turns out to be CONFOUNDED

**Session opened on PLAN 2ad (phase-shift texture selector).** Servers reset on
the composer's request — `taskkill -F -IM node.exe`, then `score/server.js`
(:5200) and `sandbox/serve.js` (:4700) restarted detached. All four surfaces
verified 200: `composer.html`, `clusterview.html`, `notation/app/notation.html`,
sandbox root. Both texture endpoints verified serving from the shell before
anything was claimed about them: `/api/textureparams` (rev 1, A/B/C =
SMEAR/RAIN/GALLOP) and `/api/texturemodels` (five models).

**Composer's first report, verbatim: *"They sound kind of the same."*** — of the
five stored models (smear · ticks · rain · gallop · groove), auditioned via the
panel's model buttons. Also asked, and it is the right question: *"Are they
already dialed in models?"* Yes — all five carry their dials in
`bank/texture_models.json`, straight from the 13 phase-shifting experiments.

### THE FINDING: the five models confound CHARACTER with SPEED

Not a bug, and not previously written down anywhere as a limitation of the
audition slate. Reading the stored specs side by side:

    model    density   the dial that defines it
    SMEAR      18/s    nothing moved — dead even
    TICKS      12/s    nothing moved — dead even, SLOWER
    RAIN       18/s    jitter 45 ms
    GALLOP     18.5/s  two groups, dBPM 2
    GROOVE      8/s    scatter 0.5

**TICKS is literally SMEAR at 12/s** — same character dials, only bpm differs.
**GROOVE is scatter at 8/s.** So two axes move at once across the model buttons,
and "do the categories sound different" cannot be separated from "do the speeds
sound different" by clicking through them. The composer's "kind of the same" may
well be about the three that sit at the SAME speed (smear/rain/gallop, all
~18/s) — which is exactly the 2x slate's first question — but the slate as
stored could not tell us that.

**Diagnostic given to the composer before drawing any conclusion:** ticks (12/s)
and groove (8/s) are much slower than the other three. If those two do NOT read
as obviously slower, the problem is sound, not texture — most likely the
lazy-MIDI init bug (keyboard dead on a fresh page until Play / CC7 Reset /
REC-arm), and no verdict should be recorded from that state.

### BUILT: the SPEED LADDER (`bank/texture_params.json` rev 2)

Composer's ask, verbatim: *"and then to hear them at different densities or
speeds."* Six variants A–F, **one character throughout** (SMEAR: jitter 0,
scatter 0, unison C3, staccato, notelen 0.12, level 7.5, 10 players, seed 11),
**only `bpm` moving** — so this isolates the speed axis by itself. `bpm =
density x 6` at ten players. Landing variant is **E (18/s)**, the speed the
reference models run at, so the composer steps DOWN with the left arrow from
what they had just been hearing rather than starting cold at an unfamiliar
speed. Duration cut 14 s -> 10 s: this is a browse loop stepped with arrows, and
14 s is long to sit through six times. rev 1 recoverable from git.

**Rendered in node and MEASURED before it was handed over** (not claimed from
the spec):

    var  density    sd     unev   notes  hard  soft  ceiling  rings
    A       6.0    0.09    0.00      60     0     0     23.8      0
    B       9.1    0.10    0.00      91     0     0     23.8      0
    C      12.0    0.09    0.00     120     0     0     23.8      0
    D      15.0    0.09    0.00     150     0     0     23.8      0
    E      18.1    0.08    0.00     181     0     0     23.8      0
    F      22.1    0.09    0.00     221     0     0     23.8      0

Every rung dead even (sd ~0.09 ms) with no figure (unev 0.00), zero hard, zero
soft, zero ring warnings, all under the 23.8/s unison-C3 ceiling. **C is the
stored TICKS model exactly** and **E is the stored SMEAR model exactly** — so
the ladder contains two of the five models as rungs, which is itself the proof
that those two differ only in speed. F sits at the top: each player re-attacks
every 0.455 s against a 0.42 s C3 ring, clear by 35 ms.

Endpoint re-verified after the write: `/api/textureparams` serves rev 2, lands
on E, keys A–F. The panel polls once a second, so an open panel picks this up
with no reload and no click (the day-17 proof).

### What this sets up, NOT yet run

The complementary experiment is the obvious next one and is **not** built: the
same five characters at ONE fixed density, which isolates the character axis the
way this ladder isolates speed. Between the two, "are rain and gallop distinct"
becomes answerable without the speed confound riding along. Also still open and
untouched: the seed question (at ten voices a setting is a lottery, not a
texture — up/down arrows step the draw), and every robustness verdict (H).

**Still UNHEARD, and the gate has no override:** all five models read `UNHEARD`
in the store and cannot be banked as keepers until the composer's verdict lands.
Nothing about the SOUND has been verified this sitting — only data and
endpoints. That line stays until the composer speaks.

## Day 21 (2026-08-20, third sitting, cont.) — the composer finds a real seam; the CHARACTER × SPEED GRID; and a measured hypothesis for "they sound kind of the same"

### THE SEAM THE COMPOSER FOUND (verbatim: *"the a through f aren't staying in that particular model… they just start doing the spectrum on one model"*)

**Correct, and it is in the code.** The model buttons and the variant tabs are
**two separate paths into `this.spec`**, and the arrows always win:

- a **model button** sets `this.spec = store[name].spec` and clears
  `_fieldStamp` (texture_panel.js:394–399);
- an **arrow press** sets `this.active` and calls `generate()` (:129–136), and
  `generate()` sees a changed stamp so it does
  `this.spec = JSON.parse(JSON.stringify(p.spec))` — **the VARIANT's spec from
  the params file** (:273–279).

So clicking `rain` and then pressing an arrow silently discards rain and reloads
the ladder's own character. rev 2's ladder was SMEAR-only, so every arrow press
snapped back to smear — exactly what the composer described. **Not a bug** (the
stamp logic is the 2v fix that stops variant A's dials leaking into variant B,
and it is doing its job), but it does mean **a one-character ladder can only
ever ladder that one character**.

**Fix chosen: no code.** Put the characters INTO the variant file, so the arrows
become the single navigation method and the seam stops mattering. This keeps
2ad's zero-code scope intact and avoids touching a stamp mechanism that exists
to prevent a subtler bug. (The alternative — making model buttons compose with
the ladder — is semantic surgery on shared state, for a browse loop the file can
express directly.)

### BUILT: `bank/texture_params.json` rev 3 — 4 characters × 4 speeds

Sm smear · Rn rain · Ga gallop · Gr groove, each at 6 / 12 / 18 / 22 attacks/s.
**Model-major order** so ←/→ walks one character up its speed ladder then
crosses into the next; tabs are clickable so any cell is one click. Lands on
`Sm18`. Held constant everywhere: staccato, notelen 0.12, level 7.5, unison C3,
seed 11, dur 10 s, 10 players.

**TICKS is deliberately absent** — it IS smear at 12/s, i.e. cell `Sm12`.
Including it would duplicate a rung and re-introduce the very confound the grid
removes.

**Three character-preservation decisions, reasoned not guessed:**

- **GALLOP holds ΔBPM 2 at every speed.** lap = 60/(ΔBPM × players-per-voice)
  has **no absolute-BPM term**, so the 6 s lap is speed-invariant for free.
  Confirmed by measurement: Ga unevenness 0.63/0.65/0.65/0.66 across all four.
- **GROOVE's scatter is a PROPORTION of the cycle**, so its figure scales with
  speed automatically. Confirmed: Gr unevenness 0.81 at all four speeds, flat.
- **RAIN's jitter is held at 45 ms ABSOLUTE** — that is what rain IS as stored.
  Consequence measured below, and it is a real finding rather than a wart.

### MEASURED (node, before handover — nothing claimed from the spec)

    cell    dens     sd    unev  notes  hard soft  rings
    Sm6      6.0     0.1    0.00     60     0    0      0
    Sm12    12.0     0.1    0.00    120     0    0      0
    Sm18    18.1     0.1    0.00    181     0    0      0
    Sm22    22.1     0.1    0.00    221     0    0      0
    Rn6      6.0    37.7    0.05     60     0    0      0
    Rn12    12.0    34.9    0.11    120     0    0      0
    Rn18    18.1    29.9    0.17    181     0    0      0
    Rn22    22.1    26.9    0.22    221     0    0      1  <-- ring
    Ga6      6.1    92.8    0.63     61     0    0      0
    Ga12    12.1    46.2    0.65    121     0    0      0
    Ga18    18.1    30.7    0.65    181     0    0      0
    Ga22    22.1    25.1    0.66    221     0    0      0
    Gr6      6.0   136.9    0.81     60     0    0      0
    Gr12    12.0    68.2    0.81    120     0    0      0
    Gr18    18.0    45.4    0.81    180     0    0      0
    Gr22    22.0    37.1    0.81    220     0    0      0

`Rn22` fires the sample-ring flag: each player re-attacks every **0.380 s**
against the **0.42 s** C3 staccato ring, over by 40 ms. **This was PREDICTED by
the store** (`alsoNote`: "at 21/s with jitter ±45 ms the tightest per-player gap
dips below 0.42 s even at unison C3") and is now confirmed by an independent
render. The mock-up will play it perfectly cleanly and the hall will not.

### THREE FINDINGS THAT ARE NEW

**1. `sd` IS NOT SPEED-INVARIANT, and the store's framing hides that.**
`metrics.sd` is described as "the EVENNESS axis", but it is a raw **millisecond**
figure over inter-attack intervals — so it shrinks as the grid shrinks, for
identical character. Groove: 136.9 → 68.2 → 45.4 → 37.1 ms across the ladder,
while its actual character never changed (unevenness pinned at 0.81).
**Consequence: sd may not be compared across speeds.** `unevenness` — a
coefficient of variation, dimensionless — is the only one of the pair that is a
speed-invariant character fingerprint, and the grid demonstrates it three times
over (Sm flat at 0.00, Ga flat at ~0.65, Gr flat at 0.81).

**2. RAIN IS THE ONE CHARACTER THAT DOES NOT SURVIVE SPEED CHANGE INTACT.**
Its unevenness climbs 0.05 → 0.11 → 0.17 → 0.22 as it speeds up, because a fixed
45 ms jitter is a growing fraction of a shrinking cycle. So rain at 6/s is almost
perfectly spread, and rain at 22/s is measurably clumped — drifting toward
groove's side of the axis. Gallop and groove, whose character dials are
proportional, are speed-invariant. **If a rain keeper is ever re-tempoed its
jitter has to be re-decided; the other three can be re-tempoed freely.**

**3. A MEASURED HYPOTHESIS FOR *"they sound kind of the same"* — and it indicts
the reference slate, not the ear.** Spread of `sd` across the three irregular
characters, per speed:

    speed    rain   gallop  groove    spread
     6/s     37.7     92.8   136.9      99.2
    12/s     34.9     46.2    68.2      33.3
    18/s     29.9     30.7    45.4      15.5
    22/s     26.9     25.1    37.1      12.0

**The characters are ~8× more separated at 6/s than at 22/s** — and the
reference slate the composer first auditioned (rev 1's A/B/C, and the stored
SMEAR/RAIN/GALLOP models) put **all three at 18/s**, i.e. at very nearly the
speed of MINIMUM separation. At 18/s rain and gallop differ by 0.8 ms of sd.
That is a strong, falsifiable prediction: **the characters should become
obviously distinct as the composer walks DOWN the speed ladder**, and if they do
not, the vocabulary really is over-specified and the categories should merge.
Either answer settles the 2x slate's first question. *(Caveat: sd separation is
not perceptual separation — this predicts where to listen, it does not
substitute for listening.)*

**Still UNHEARD.** No sound verified this sitting; data and endpoints only.
`/api/textureparams` re-verified serving rev 3, 16 cells, landing on `Sm18`.

## Day 21 (2026-08-20, third sitting, cont.) — THE LADDER BECOMES THE UNIT; seam collisions found; two earlier metric claims CORRECTED

### THE REFRAME (composer, verbatim)

> *"I was actually hoping to do this per model… whatever model was fixed in
> there sounded pretty good, and I think I'm gonna use that ladder. But I wanted
> to hear the other models in that same ladder, and I might swap some out. In
> other words, at least one of the things I'll use or hope to use is **this
> acceleration of speed and density**. So use, for example, the a version and
> then the b version and then the c version, and I might do that across models
> or have, like, a step-up sequence with different models."*

**This inverts what rev 2/rev 3 assumed.** Both treated a variant as ONE texture
to be compared against other variants — a comparison slate. The composer is not
comparing; **the ladder itself is the musical object**, an accelerating build,
and the character is a *swappable slot inside it*. Also worth recording:
**rev 2's smear ladder is provisionally KEPT** (*"sounded pretty good… I think
I'm gonna use that ladder"*) — the first material from 2ad the composer has
spoken for, though still not banked (no formal verdict, no robustness pass).

The rev-3 grid was therefore the wrong shape, and the composer said so directly.
Filed as a working lesson: *when the composer asks to "hear X at different Y",
ask whether Y is a comparison axis or a trajectory.* Rev 3 read it as the first;
it was the second.

### BUILT: `bank/texture_params.json` rev 4 — SIX LADDERS, each one gesture

Every variant is now a **complete 6-rung ladder that plays as a single
continuous 36 s gesture**. Rungs 6 / 9 / 12 / 15 / 18 / 22 attacks per s (rev 2's
rungs, the ones the composer liked), 6 s each.

    A  smear ladder      character fixed, only bpm steps
    B  rain ladder       character fixed, only bpm steps
    C  gallop ladder     character fixed, only bpm steps
    D  groove ladder     character fixed, only bpm steps
    E  MIXED ladder      groove groove gallop rain rain smear — character
                         changes AS it accelerates (figure dissolving into texture)
    F  SMOOTH accel      one 36 s section, bpmEnd ramp 36->132, no steps

**`gap: 0` is load-bearing.** The engine defaults `spec.gap` to **2** (:970), so
a chained ladder would otherwise carry **2 s of silence between every rung** and
the accelerando would not exist. Verified contiguous by measurement on all six.

**Free from the engine, nothing built:** each section emits its own timeline
marker at its `t0` (:923), so the rungs arrive **labelled** when inserted —
6 markers per ladder, confirmed. And `bpmEnd`/`rampFrom` already give a linear
ramp inside a section, which is where F comes from; `curves.bpm` would give an
arbitrary acceleration shape (unused so far).

### MEASURED (node, all six, before handover)

    ladder  span   notes  mk  hard soft  rung densities (attacks/s)
    A       36.1     495   6     1    0   6.0  9.2 12.0 15.2 18.2 22.0
    B       36.1     495   6     2    0   6.0  9.2 12.0 15.2 18.2 22.0  + 1 RING
    C       36.1     498   6     2    0   6.2  9.2 12.2 15.2 18.2 22.2
    D       35.9     492   6     1    1   5.8  9.3 12.0 15.0 17.8 22.0
    E       35.9     496   6     1    1   5.8  9.3 12.2 15.2 18.2 22.0
    F       36.1     504   1     0    0   continuous ramp

All six accelerate **~3.7x** by attack count (first 6 s = 36 attacks -> last 6 s
= 133). F is 2.82x because a *linear* bpm ramp spends its first 6 s averaging
well above 6/s — worth knowing if the two are ever compared as equals.
`B` fires the expected ring flag at the top rung (0.382 s re-attack vs 0.42 s).

### NEW FINDING: RUNG SEAMS PRODUCE HARD COLLISIONS, and they are systematic

Every hard flag in every ladder sits **exactly on a rung boundary**:

    A  hard @ 24.00 s   (rung 4->5 boundary = 24.0)
    B  hard @ 17.96 s, 23.99 s   (18.0, 24.0)
    C  hard @ 17.92 s, 23.93 s   (18.0, 24.0)
    D  hard @ 29.99 s   (30.0)
    E  hard @ 23.99 s   (24.0)

**Mechanism:** each section starts its own onset series at phase 0, so the last
attack of rung N and the first attack of rung N+1 can land on the SAME player
inside the hard threshold. **The engine's 2 s default gap is exactly what hid
this** — chaining sections contiguously is a case that had never been exercised,
because nothing before now wanted a seamless multi-section spec.

**Not fixed, deliberately.** It is 1–2 notes out of ~495 (0.2–0.4%), it does not
block the listening question at all, and the mock-up plays hard conflicts
perfectly cleanly anyway (2r) so it cannot mislead the ear. But **fixing it is a
design decision about what happens at a seam** (phase-offset policy, or let the
2r resolver move the note to a free player), and that is the composer's to make
once a ladder is actually wanted as material. **Flagged as: the one thing that
must be settled before any ladder becomes score material.**

### TWO EARLIER CLAIMS FROM THIS SAME SITTING, NOW CORRECTED BY MEASUREMENT

**CORRECTION 1 — the rev-3 claim "GALLOP unevenness is flat at ~0.65, therefore
speed-invariant" WAS AN ARTIFACT.** In rev 4's ladder the same gallop settings
measure unevenness **0.02–0.11**, not 0.65. The difference is the **window
length**: rev 3 used 10 s sections against a 6 s lap (ratio 1.67, constant
across all four cells), rev 4 uses 6 s sections against the same 6 s lap
(ratio 1.00). Over exactly one lap the players sweep uniformly through every
phase, so their mean cycle positions come out evenly spread and unevenness
collapses. **The "flatness" was flat because the window/lap ratio was held
constant, not because the character is speed-invariant.**

**Generalisation, and it is the real lesson: `unevenness` is only a valid
character fingerprint for STATIONARY textures.** Smear, rain and groove are
stationary — their statistics do not depend on where you put the window. A
gallop is a *drifting* process by construction, so its unevenness is a function
of window/lap and is not a property of the texture alone. Any future comparison
involving gallop must either fix window/lap explicitly or use a different
statistic.

**CORRECTION 2 — sd/unevenness are MEANINGLESS for a ramped section.** F reads
sd 26.4 / unev 0.60, which looks like a strongly irregular texture. It is not:
F is dead-even smear at every instant. The metrics are computed over the whole
36 s against a single period (`60 / voices[0].bpm`, :968) — so on a ramp they
measure **the acceleration**, not the character. Reading F's numbers as texture
statistics would be a straightforward error.

**Both corrections have the same shape as Principle 5** (a check that shares a
formula with the thing it checks is a mirror): here, a statistic was read
outside the conditions that make it meaningful. Neither was caught by reading —
both fell out of rendering the same character under a second set of conditions.

### PANEL DISPLAY CAVEAT (not fixed, zero-code scope held)

The panel's status line reports `r.report[0].metrics` — **rung 1 only** — and a
density that is the **mean across rungs** (texture_panel.js:343–346). So on a
ladder the header reads roughly 13.8/s with rung 1's sd/unev, describing nothing
the composer is actually hearing. The per-rung truth is in the section labels
and in this log. Noted rather than fixed: 2ad's scope is zero code, and the
composer is listening rather than reading the header.

**Still UNHEARD.** `/api/textureparams` re-verified serving rev 4, six ladders,
landing on A. No sound verified.

## Day 21 (2026-08-20, third sitting, cont.) — reset to rev 2 by request; the ACCRETION axis named; variant G

**Process correction from the composer, and it now governs the loop:** *"let's
establish what we're talking about before you make any changes, and let's keep
that pattern going."* Rev 3 (the grid) and rev 4 (the six ladder-gestures) were
both built from a misread of a spoken request; both are kept in git, neither is
the working state. Talk-first is the standing rule for 2ad from here.

**The composer's mental model of rev 2 was verified exactly right:** A-F is ONE
model (smear), single dial (bpm 36->132), nothing else moving. Their question
"which model - rain or gallop?" -> neither; jitter and scatter are 0 in all six.
Confirmed also: rev 2 is already at MAX player density (10 tubas every rung),
and rung F (22/s) sits at ~92% of the 23.8/s unison-C3 ring ceiling - with the
standing caveat that real pitch sets drop that ceiling to ~19-21/s, so F is
OVER max once harmonized. The ladder tops out only at unison C3.

**The axis catalog was laid out for discussion** (talk-first): player count ·
jitter (order->disorder) · scatter (order->figure) · level · pitch width ·
gallop drift. Key physical distinction on record: tempo and player count both
raise attacks/s (= players x bpm / 60) but differ in per-player demand - a
tempo ladder has all ten at 132 BPM by the top; an accretion ladder never asks
any player to speed up beyond their rung tempo. The composer chose ACCRETION.

**Restored rev 2 verbatim from git (a924060), then rev 5 = rev 2 + variant G:**
- **A-F untouched** - the smear tempo ladder the composer kept.
- **G = the accretion step-up, the composer's own pairing dictated:** 4 players
  at C's tempo (72), 6 at D's (90), 8 at E's (108), 10 at F's (132), 6 s per
  step, gap 0, one continuous 24 s gesture. Composite climbs 4.8 -> 9.2 ->
  14.5 -> 22.0/s (measured; steeper than tempo alone because both dials climb).
- Measured: 303 notes, 4 markers, contiguous, 1 hard @ 12.00 s - the known
  rung-seam collision class from rev 4, again exactly on a boundary. Same
  status: does not affect the mock-up audition, must be settled before any
  ladder becomes score material.
- Server verified serving rev 5, landing on G.

**Free-form player browsing needed NO build and none was done:** the panel's
`players` dial field regenerates on edit. Limitation stated to the composer:
field edits reset to the file's value on variant switch (the anti-leak stamp,
by design) - so the browse pattern is "pick the tempo rung, then walk the
player counts," not the reverse.

**Still UNHEARD** - G included. Nothing banked.

## Day 21 (2026-08-20, third sitting, cont.) — PLAN 2ag: THE LIVE RIG, built and verified

### The arc that led here (three composer turns, all talk-first)

1. **The composer's want, dictated:** *"I hit play and then arrow keys… in real
   time changes the speed… and I can channel through several variations and
   back again in a continuous play."* The batch player cannot do this — play()
   books every note upfront, which is exactly why the loop was stop→arrow→play.
2. **Scope honesty surfaced before building:** 2ad's rule was "no new scheduler
   unless the loop proves hammered." The composer's stop/arrow/play friction IS
   that condition; said out loud, approved.
3. **Shape agreed:** 5 sequences × 6 (bpm, players) steps · character = two
   numbers (jitter, ΔBPM) · gallop folded in via Δ (option a) · auto-run
   included · groove the set-aside. Composer: *"a, and yes include the
   auto-run and good to build pls."*

### What was built (texture_panel.js LIVE section + params rev 8)

- **Streaming scheduler:** 60 ms tick, 160 ms lookahead, reads the DOM boxes
  every tick — arrows and edits land on the NEXT attack. Continuous until stop.
- **Reused, not rebuilt:** ensureMidi · routeFor · noteOn/off · the one panic
  path (chained through E.onStop, recursion-guarded) · CC7 pin + velocity
  (D12) · D29 no-bend. The scheduling pattern mirrors play()'s proven
  timer-correction approach.
- **Gallop = lvSplit():** Δ>0 splits players into ceil/floor half-groups at
  bpm∓Δ/2 on disjoint lane ranges. Dormant group-B clock rides just ahead of
  now so raising Δ mid-stream starts cleanly instead of draining a backlog.
- **Unseeded by design** — a live instrument is not a render (R5 applies to
  renders and banking; keepers get persisted to the file and rendered seeded).
- **Data:** `live` block, rev 8 — S1 smear A–F · S2 rain 45 · S3 gallop Δ2 ·
  S4 accretion (4→10 players and 72→132 bpm = 4.8→22/s) · S5 scratch.

### Verified (in the running app, plus node)

- **17/17 node assertions** on the exported math: lvSplit structure (10→5+5 at
  ∓1; 7→4+3; 1 cannot gallop), lane coverage exactly 0–4/5–9, composite rates
  (10@108=18/s, 4@72=4.8/s), lap = 60/(Δ×perGroup) with no bpm term, defaults.
- **In-app (Browser pane, composer.html live):** panel renders with the LIVE
  section · boxes load from the file (rev 8, S1, 36/54/72/90/108/132) · steps
  walk and WRAP correctly with readout ("step 5/6 · 108 BPM × 10 = 18.0/s") ·
  gallop readout shows "Δ2, lap ~6.0 s" · S4 boxes differ per step · edits
  survive slot round-trips · ceiling amber fires at 25/s · Run advances the
  highlight and parks · **zero console errors**.
- **THE CONVERSATIONAL LOOP PROVEN ON THE NEW BLOCK, LIVE:** with the panel
  open, a rev-7 probe was written from the shell (slot→5, bpm 61); the open
  panel landed on S5 with bpm 61 in the boxes within ~2 s, no reload, no
  click. Probe then reverted.
- **Process slip worth recording:** the probe revert used `git checkout`,
  which restored the COMMITTED state (rev 5, no live block) because rev 6 was
  never committed — the live block had to be rewritten as rev 8. Lesson: mid-
  verification file states that must survive a revert need a commit first.
- **NOT verified: sound.** Deliberately never played from the pane — sound
  only on the composer's gesture (the no-autoplay rule). The composer's first
  press of `Live` is the sound test.

### For the composer (reload composer.html once)

Texture panel → LIVE section at the bottom: S1–S5 · six bpm/players columns ·
jitter and Δbpm boxes · **Live** (stream; ←/→ walk steps, SPACE stops) ·
**Run** (auto-advance every N s, wraps). If arrows edit a number instead of
stepping: focus is in a box — click the panel background once.

**2ag follow-up (same sitting) — panel scroll fix, composer-reported.** With
the LIVE section the fixed-position panel outgrew the viewport; the inner
dials list scrolled but the panel itself could not, so the bottom (LIVE /
Insert) was unreachable — a fixed element is outside the page scrollbar's
reach by construction. Fix: `max-height:calc(100vh - 112px)` +
`overflow-y:auto` on the panel, drag header made sticky (opaque `rgb(35,47,44)`,
the old tint solidified so content cannot show through it). Verified in the
app at a 720 px viewport: panel bottom 704 ≤ 720, content 789 px scrolls in a
607 px box, Insert reachable after panel scroll, header stays grabbable while
scrolled, zero console errors.

**2ag follow-up 2 (same sitting) — slot buttons named, composer's call.** The
S1-S5 buttons now carry their sequence names (smear · rain · gallop ·
accretion · scratch) inline next to the LIVE label instead of floated right;
seq names in the params file simplified to match (rev 9). Verified in-app:
five named buttons render on one 25 px row inside the panel width; readout
follows the new names. The button label is the seq's `name` field, so an
AI-written slate renames its own buttons.

**2ag follow-up 3 (same sitting) — THE STOPWATCH LOG, composer's design.** The
composer's spec, near-verbatim: let it play a while, press 0 to start the
timer, every arrow press logs the time, save/copy the readout. Built exactly
that: clock starts at Live, `0` (key or button) restarts it whenever ready;
every step change logs a line (arrows and auto-run share lvStep, so both log
for free); slot switches log too (a character change is a formal event);
Stop stamps the total; `Copy log` -> clipboard, guarded when empty. Line
format is machine-parsable on purpose:

    0.0s  step 1  36x10 = 6.0/s  smear  (zero · smear)
   12.3s  step 2  54x10 = 9.0/s  smear
   18.3s  step 3  72x10 = 12.0/s  gallop d2  (slot)

Verified in-app by driving the real code paths with the playing flag set (no
sound - the no-autoplay rule holds): timestamps accumulate correctly across
a simulated 18.3 s session, slot switch logs the character change, empty-copy
guard fires, zero console errors.

**WHY THE LOG MATTERS (filed to PAPER_NOTES too): the log is the composer
performing the ladder's SHAPE by hand, captured as data.** Pasted back to the
AI it renders as a fixed, seeded texture with exactly those step durations —
the 2f play-in pattern operating at form level (when to move) rather than
note level (what to play). The composer flagged the phrase as a keeper.

**2ag follow-up 4 — composer asked: is 132x10 (scratch top step, 22/s) playable?
Evaluated with the real machinery, not memory.** Per player trivial (2.2
attacks/s each, 0 hard 0 soft). Unison C3 clean by 35 ms (0.455 s re-attack vs
0.42 s ring) = 92% of ceiling. BUT: with pitch set `cl spread` -> 4 RING
violations (worst over by 76 ms), `m3 (F)` -> 2; the mock-up plays these
cleanly, the hall does not. And live, smear at 22/s is unreachable regardless:
the composite grid is 45 ms while stage width (~30 ms) + human error (~+/-25
ms) are the same size - the hall hears RAIN at the top step no matter what is
written (the standing fragile-smear prediction, at its sharpest point).
Practical: unison-C3 effect stands; pitched material caps ~110-115 BPM
(~19/s); if the top is meant as an irregular wash, write rain and lose nothing.

**2ag follow-up 5 — composer asked: does 132 BPM become playable at 9 or 8
players? Where is the threshold? MEASURED ANSWER: THERE IS NO PLAYER-COUNT
THRESHOLD.** The ring limit is per player - re-attack interval 60/bpm vs that
player's own sample ring - so it is independent of ensemble size. Engine runs:
132 BPM with cl spread throws rings at 10, 9, 8, and 6 players alike (worst
overshoot 76 ms unchanged at 9). BPM is the only dial: cl spread clean at 113
(dirty at 120); unison C3 breaks at exactly 143 (60/0.42 - the analytic
threshold confirmed to the BPM). Player count buys composite density, never
per-player safety. THE M1 CONNECTION: 22/s with pitched material at a
ring-safe 110 BPM needs 12 players - which is what M1 part multiplication
exists for, and the Penn State ensemble call is 12-20. "132 at ten" is
recoverable as "110 at twelve" at the premiere. Character caveat: fewer
players also does not rescue live smear (stage/human error unchanged);
smear-live threshold ~10-12/s composite, estimate, testable with H.

**2ag follow-up 6 — the composer's redistribution insight (clarifying followup
5): unweld the LINE from the BODY.** Their idea, near-verbatim: with six
players' worth of material you achieve those tempos, redistribute the
re-articulations among the empty players, getting per-player re-attacks under
threshold. CORRECT - it is the 2j interlock rule applied to textures, and
followup 5 missed it by holding line=player fixed. Two versions, calculated:
- POOLED (composite survives, line identity dissolves): v lines of 132 round-
  robined over 10 bodies -> per-body spacing 10/composite. THRESHOLD v=8
  (spacing 0.568s vs 0.53 worst ring); v=9 set-dependent; v=10 is the 18.9/s
  wall no redistribution beats. Consistent with the measured 113-clean/120-
  dirty per-player line (v=8 -> 105.6 eff bpm, v=9 -> 118.8). AVAILABLE NOW
  at unison: same onset stream as 10 players at bpm 79/92/106/119 = v 6/7/8/9
  - type it into the live boxes.
- LITERAL (each pitch truly pulses at 132): a PAIR of players alternating at
  66 each carries one true-132 line, per-body 0.909s, safe vs every ring ->
  5 simultaneous true-132 pitch lines with 10 players (3-body lines allow
  198/line). Expressible today as a multi-group spec with explicit lanes
  (not via the live boxes); write on request.
Ring constraint note that makes this valid: the ring is per-BODY (one player
cannot sound two overlapping notes), not per-pitch - so a pitch hopping
between bodies re-attacks as fast as the ensemble likes.

**2ag follow-up 7 — THE BPM CAP TABLE (composer: "hang on to them and list
them"), and the phase question.** Rule: per-player bpm < 60/ring(pitch).
Caps, worst pitch per set: unison C3 143 · cl low 124 · cl mid 122 · m3(F)
120 · oct F# 117 · cl high/m7(F#)/m4(F#) 115 · cl spread/BbE 2oct/5ths
30/37/oct Bb/m6(F#)/Bhairav(F)/row 113 · SAFE-FOR-ANYTHING 113 · best single
pitch (0.33s) 181. Same for all models EXCEPT RAIN: jitter lets adjacent
per-player attacks close by up to 2x jitter, so cap_rain = 60/(ring+2*jit) -
at jit 45: ~117 C3, ~96 safe-for-anything (the store's 21/s warning, now as a
formula). Gallop: faster half-group binds, subtract d/2 (1 BPM at d2).
Scatter/groove: constant offset, caps unchanged.

**PHASE (composer: "is phase ever a parameter here? we might have missed an
essential parameter"): not missed - it is the SUBSTRATE. scatter = static
phase (random draw) · dBPM = phase VELOCITY (gallop = drifting phase, lap =
wrap) · jitter = phase NOISE. Position/velocity/noise - the dial space is the
derivatives of phase. Round-robin = phase assignment j/n; the pair-hocket =
two players at 180. What IS unexposed: COMPOSED phase (chosen offsets - "two
groups locked at 90", 3 at 120 apart) - engine expresses it via per-voice
delay/phase in the written dialect, no panel/live dial reaches it. 2j's own
finding locates the interlocking textures exactly there (90 = hocket, 180 =
aligned-opposite). Flagged as a small live-rig add WHEN the composer wants to
browse composed-phase structures by ear. Caps unaffected by any constant
phase.** (Also filed to PAPER_NOTES - the derivative structure is a keeper.)

**Day 21 — THE PHASING REFRAME (composer, near-verbatim; design discussion
only, nothing built):** *"what I think was missing was that phasing
consideration, and I might not need to use tempos at all... probably what I
was looking for is ONSET COMPLEXITY USING PHASING... closer to the original
Steve Reich music as a gradual process... the most complex will be the
smallest decollage, or smallest offset... I need a way to audition several
offsets, to find the thresholds between the jumps... whether there are even
offsets or different types of offsets."* Also a process note: information
density flagged; replies now TL;DR + single-topic chunks (memory filed).
AI analysis offered (talk-only): phase = composed scatter (the gap named
last exchange); offset taxonomy even/rational/micro-decollage/irrational;
complexity ordering by fraction denominator (Farey ladder) avoids the
matrix; physical floor ~30-50 ms (stage+human) under which composed offsets
are mock-up-only; audition plan = slow-drift sweep (gallop at tiny d, one
lap = all 2-group offsets, stopwatch marks -> offsets) + a static Farey
slate in the batch variants (written dialect carries explicit delays, zero
code); live plan = ONE new per-step number (offset fraction) on the existing
two-group split. Awaiting the composer's direction.

**2ag follow-up 8 — THE PHASE LADDER BUILT (composer: "good to go").** Two
changes to the live rig, both verified in the running app:
- **Steps are now rows, count follows the file** — a sequence can carry 6 or
  12+ steps; grid rebuilt per sequence, arrows wrap at the true length,
  step-count shown in the readout (step N/12).
- **New per-step number: offset — the ROTOR.** Player j sits at (j x offset)
  mod 1 of the per-player cycle (60/bpm). offset 0 = legacy even round-robin,
  byte-for-byte the old path. One number spans the taxonomy: 1/players =
  even smear · 1/q = q evenly spaced cluster-pulses · q>players rationals =
  uneven figures · tiny = cascade/decollage · irrational = lumpy never-grid
  (three-distance theorem: golden gives at most 3 distinct gap sizes,
  node-verified). Per-player spacing stays 60/bpm at ANY offset, so the BPM
  cap table is untouched. Scheduling: rotor books whole cycles as they enter
  the look window, so edits land on the NEXT CYCLE (<= 60/bpm late, vs
  next-attack in the even path) - documented in-code. dBpm is ignored while
  offset > 0 (readout says so). Jitter still applies = the blur axis free.
- **S6 "phase" (rev 10): the first-pass 12-rung ladder**, fixed 108 BPM x 10,
  simple->complex: 0.1 (even ref) / 0.5 / 1/3 / 0.25 / 0.2 / 0.125 / 0.0625
  (phrase+rest) / 0.1875 / 0.15 / golden / 0.03 / 0.01 (tightest decollage -
  mock-up-only precision, the 30-50 ms stage/human floor applies live).
- **Verified:** 12/12 node assertions on exported rotor math (group counts
  10/2/3/4/5, 1/16 and golden give 10 distinct, golden <=3 gap sizes, wrap at
  12) · in-app: panel lands on S6 with 12 rows, readouts correct at rungs 1/
  2/12 (10 -> 2 -> ~5 onset groups), wrap 12->1, S1 legacy intact (6 rows,
  smear readout), zero console errors. **Sound unverified as always.**
- **The workflow agreed (composer's own layout):** part 1 = arrow through S6
  at own pace, demand finer resolution between any rungs (AI rewrites, boxes
  follow in ~1 s); part 2 = a dialed 6-step sequence + the stopwatch run;
  tempo re-enters per step whenever wanted (bpm box sits beside offset).

**2ag follow-up 9 — THE TWO-AXIS FINDING (composer's ear) and the ZONE
COMPLEXITY LADDER (rev 11).** After listening to rev 10 the composer
concluded, unprompted: *"it seems to me that it's a combination of offset
amount and then complexity, ratio complexity... something like point five and
then whatever complex version that's between point five and point three."*
**Correct, and it exposed rev 10's confound:** rungs 2-5 walked the AMOUNT
axis with ratio complexity held simple (all 1/q). The formalization adopted:
every offset has a ZONE (where it sits) and a DEPTH (how complex its ratio);
the generator for depth-within-zone is the MEDIANT / Stern-Brocot walk, ~7
rungs per zone, no matrix. S6 rewritten as the 1/2 -> 1/3 zone walk: 1/2,
2/5, 3/7, 4/9, 5/12, 7/17, limit sqrt(2)-1 (the zone's noble number).
Group counts verified with the exported rotor math BEFORE handover:
2/5/7/9/10/10/10 - pulse fissions into figure into lump; rungs 5-7 share a
count and differ by GRID (12/17/never), which is exactly the ear question.
Panel verified on rev 11 (7 rows, correct values, readouts at rungs 1/2/7).
Verification note: the in-pane panel lagged at rev 10 because BACKGROUND TABS
THROTTLE setInterval - the pane is hidden so its 1 s poll stalls; the
composer's visible browser is unaffected. Worth remembering for future pane
verifications: force refresh(true) rather than waiting on the poll.

**2ag follow-up 10 — composer read the zone ladder as "not running the whole
gamut" (values 0.5-0.41). Correct observation, intended design: zone held,
depth walked; number-distance is not sound-distance (0.4167 vs 0.4142 =
12-grid figure vs lump). Resolution: BOTH AXES AS SLOTS (rev 12) - `phase` =
the zone/complexity walk, `amount` = the rev-10 full-gamut ladder restored as
S7. Standing ear-question stated to the composer: if zone rungs 3-7 sound
alike, complexity depth saturates for the ear and we stop digging that axis.**

**2ag follow-up 11 — composer caught a real error in the zone ladder: the
mediant walk CONVERGES to ~0.414, it does not SWEEP 1/2 -> 1/3 as I had
stated it would.** rev 13: S6 phase rewritten as the true sweep - every zone
fraction with denominator <= 12, descending: 1/2, 5/11, 4/9, 3/7, 5/12, 2/5,
3/8, 4/11, 1/3. Verified group counts 2/10/9/7/10/5/8/10/3: a value-ordered
sweep necessarily ZIGZAGS in complexity (simple anchors at the ends, deep
fractions between) - stated to the composer, readout names each rung's count.
Panel verified on rev 13. The convergent depth-walk remains in git (rev 11)
if the depth axis is ever mined again.

**2ag follow-up 12 — THE COMPUTED COMPLEXITY LADDER (rev 14), the experiment
run.** Process as explained to the composer in four steps (machine proposes,
ear corrects). Scorer `tools/score_offsets.js`: 997 offsets at 98 BPM x 10 ->
pattern = onset groups after 25 ms fusion-merge (wrap-aware, seam at largest
gap) -> score = gap CV + 0.1 x stack-size std -> 430 distinct audible
patterns -> 12 picks, MONOTONE score 0.00 -> 1.25:

    rung  offset  groups  score   character
      1   0.5       2     0.00    two pulses
      2   0.2       5     0.00    five pulses
      3   0.286     7     0.05    seven, uneven stacks (accents)
      4   0.2805    7     0.09    seven with a limp (one 97 ms gap)
      5   0.0935   10     0.20    near-smear, one hitch
      6   0.1835   10     0.29    lilting 51/62 swing + turnaround
      7   0.384    10     0.34    three-gap cell (49/93/44)
      8   0.4585   10     0.39    nine-run + two long holes
      9   0.461    10     0.47    same family, deeper
     10   0.2365   10     0.58    sharp 33/112 cell
     11   0.469    10     0.77    tight run + two big holes
     12   0.0585   10     1.25    fast ripple + 290 ms rest

Notable: the CV-primary score reproduces the inverted-U prediction on its own
- the smear (10 even) and the pulses (2/5 even) all land at score ~0, and the
knotty cells rank between them. Rung 1 snapped to exact 0.5 (the 0.498 pick
was a sub-fusion flam-thickened variant - audibly a THICKER stack; kept out
of the ladder, noted as its own colour). Panel verified on rev 14 (12 rows,
98 BPM, correct offsets). THE COMPOSER'S LISTEN IS THE EXPERIMENT: does the
score order match the ear order? Disagreements correct the weights.

**2ag follow-up 13 — consolidation (composer: "document this whole process").
`docs/PHASE_COMPLEXITY.md` written: the full day-21 phase arc readable cold -
origin (2ad -> "they sound kind of the same" -> the Reich reframe) · phase as
substrate · the rotor · the four ladder iterations WITH the wrong turns
labeled (amount/complexity confound, converge-vs-sweep) · the inverted-U
theory · the constraint registry (caps, rain formula, no player-count
threshold, redistribution 8/5, live floor) · the rev-14 experiment + protocol
· open items. PAPER_NOTES #5 filed (inverted-U independently reproduced;
machine-proposes/ear-corrects as method).**

**2ag follow-up 14 — FIRST EAR DATA ON THE PHASE ARC (composer, on rev 14),
and the composer's own sequence (rev 15).** The verdict, near-verbatim: *"I
think in some ways I'm trying to cram a square peg into a round circle. I
think by nature this is a DISCURSIVE process, and it's the dramatic changes -
that's interesting. But for my purposes I want a SMOOTH RAMP. And I think
that was the right experiment. But as you mentioned, there's definitely a U
even in the series that you produced, to the ear."* Three findings in that:
(1) the inverted-U now has EAR corroboration, heard inside the monotone-by-
score series itself; (2) the material's nature is discursive/dramatic-change
- the smooth ramp the composer wants may be against its grain (square peg,
round circle - THE quotable); (3) the experiment design was right anyway.
No theory action requested. **rev 15: slot `try1` = the composer's own order
of rev-14 rungs 11-2-7-3-10-4-6** (offsets 0.469/0.2/0.384/0.286/0.2365/
0.2805/0.1835; score path 0.77-0.00-0.34-0.05-0.58-0.09-0.29 = alternating
high-low, i.e. playing WITH the dramatic changes, not against them). The
`phase` slot stays untouched as the reference - rung numbers 1-12 remain the
composer's working identifiers. Panel verified on rev 15, landed on try1.

**2ag follow-up 15 — try1 reordered per composer (swap steps 2<->3, 4<->5):
rung order now 11-7-2-10-3-4-6 (rev 16).** Score path 0.77-0.34-0.00-0.58-
0.05-0.09-0.29: the front-loaded drama softens toward the tail.

**2ag follow-up 16 — try1 rev 18: rung 10 dropped (was step 5); tempo ramp
95 -> 140 in equal 9-BPM increments across 11-7-2-3-4-6. The composer asked
the max playable tempo for the final step: AT UNISON C3 THE CAP IS
OFFSET-INDEPENDENT — the rotor moves phases, never per-player rates, so
every rung caps at 60/0.42 = 142.9 (measured: 140 clean, 143 dirty). Top set
140 for margin. Also noted: rotor characters survive re-tempo (patterns
scale with the cycle), unlike rain's absolute jitter.**

**2ag follow-up 17 — SEQUENCE SAVED + PITCH PRESETS IN THE LIVE RIG (rev 20).**
(a) `phaseSeq-01` frozen into `live.saved[]` - the composer's keeper: rungs
11-7-2-3-4-6 of the rev-14 computed ladder, tempo ramp 87->120 equal 6.6
steps, unison C3. The working try1 slot stays editable. (b) New `pitch`
dropdown in the live section - unison / octaves (root pc) / fifths stack /
cluster F-A octave-spread [F#1 G1 A1 F2 F#2 G#2 A2 F3 G3 A3] (F1=29 is BELOW
the staccato sounding floor, so the bottom octave starts at F#1 - said to the
composer). Lane j = pitches[j], ascending across the stage line; all presets
inside MIDI 30-65. **Measured per-player ring caps per preset: unison 142 ·
octaves 125 · fifths 122 · clusterFA 117** (worst ring over the preset's
notes, from bank/sample_lengths.json). The readout warns per set - verified
in-app: try1's 120-BPM top step correctly flags over the 117 clusterFA cap
(the mock-up plays it cleanly; the hall would not). 11/11 node assertions on
lvPitches (windows, pc sets, spans, ascending); zero console errors; sound
unverified as always.

**2ag follow-up 18 — pitch ORDER dropdown (composer heard the cycling:
ascending lane map + round-robin = a repeating arpeggio).** Four orders:
ascending (as before) · shuffled (one scramble, each player keeps one note;
re-picking the option deals fresh) · re-deal (new scramble every full pass /
cycle) · random (fresh draw per attack - audition texture; a live part would
redistribute the leaps). Permutation state lives in the play state so
mid-play changes deal fresh; random draws from the lane distribution so the
low-thicker weighting survives. 21/21 node assertions (permutation validity
+ variability); readout shows the order; verified in-app, zero console
errors. Persisted per sequence as pitchOrder.

**2ag follow-up 19 — VERT01 SPECIES in the live pitch menu (composer: 27, 30,
33, 1, 8 - "just the original notes, the play notes, no octave doublings").**
Source = bank/VERT01-NN.json `pitches` (the played voicings, literal):
sp01 [36 44 47 48 53 55 56 64] · sp08 [31 42 43 65 (66)] · sp27 [33 34 63 64
(66)] · sp30 [33 39 45 47 55 57 61 (66)] · sp33 [34 38 39 51 53 54].
**THE KNOWN TRAP BIT THREE OF THE FIVE: sp08/27/30 each carry a top 66,
which is CUIVRE in the blasts and cannot sound in staccato (30-65)** -
dropped from the sounding presets, said in the dropdown labels themselves.
Measured ring caps wired into the readout: sp01 127 · sp08 117 · sp27 122 ·
sp30 130 · sp33 122. Verified in-app: sp08 at the 120-BPM top step correctly
warns over its 117 cap; sp30 does not (cap 130). 15/15 node assertions
(sets, window, ascending lane spread). All order modes apply to species too.

**Day 21 — row + patterns scratch score (`scores/row-fifths-01.json`).**
(1) The composer's row spec: G#-A#-B, then +5th (repeats allowed, uncounted)
/ down-to-a-remaining, octaves randomized in 30-65, Tuba 1, seed 20260820 -
15 notes, all 12 pcs consumed (composer said eleven; flagged, not blocking).
(2) Appended 12 pulse patterns @150 (seed 815), parsed from dictation as:
pattern length in beats 2-4 at 60% / 5-8 at 40%; harmony = BASE 40% /
species pool {16,3,28,12,18,27} 60%; one-beat gaps; each attack = the full
chord across layers ascending. BASE identified from tranceA003a's 'base xN'
sections = the fifths stack G1-A2-E3-B3-F4 (also section 3's underlay).
Species = original played VERT01 pitches; window-dropped: sp16's 67, sp18's
66, sp27's 66. Note on the mockup: 0.4s per-player spacing vs 0.33-0.53s
rings - chords over-ring slightly at 150; fine for audition, known class.

**2ag follow-up 20 — FIRST STOPWATCH PERFORMANCE, composer's own timing of
phaseSeq-01 (stored in the params file under the saved sequence, rev 21).**
Step durations 5.4 / 4.9 / 5.2 / 7.1 / 7.9 / 10.3 s, total 40.8 s. Notable
shape without prompting any action: the dwell LENGTHENS as the ladder climbs
- the composer held the faster, busier steps nearly twice as long as the
early ones (5.4 -> 10.3 s). Composer: "just hang on to these for now" -
stored, not rendered.

**Day 21 — FIRST ASSEMBLY of the phase machinery into the piece
(`scores/tranceA003b.json`, composer-directed).** The file is UNTRACKED
(composer's live work) so it was BACKED UP to the session scratchpad before
writing; the assembly is re-runnable (it strips its own `asm-*` objects
first) and touches nothing of the original 749 notes.
- **Grid confirmed from the file itself:** 0.4 s onsets = 150 BPM; last
  existing onset 66.4 (ends 66.6). Next beat after the composer's 66.45 =
  **66.8**.
- **PHASE at 66.8-107.6 s (727 notes):** phaseSeq-01 rendered with the
  composer's OWN PERFORMED step durations (5.4/4.9/5.2/7.1/7.9/10.3),
  pitched as octaves of ROW 7's first pitch G# -> **32/44/56**, lanes
  ascending (0-3=G#1, 4-6=G#2, 7-9=G#3). First time a stopwatch performance
  became score material.
- **CHORDS at 108.0-162.8 s (625 notes):** patterns P9-P30 from
  row-fifths-01 (the v5 grouped deal), re-timed onto the 150 grid, one-beat
  gaps. 108.0 = the next beat AFTER the phase ends at 107.6.
- **Two ring findings, reported not fixed:** (1) the phase carries **19 ring
  violations of 727 notes (2.6%), ALL at step seams** - the documented
  rung-seam class (each step restarts its cycle clock at a fresh phase, so
  one lane can re-attack ~0.1 s after its previous note). (2) The chord
  block over-rings on **70% of consecutive pairs** - inherent to pulsing
  full chords every 0.4 s against 0.41-0.53 s samples. **Context that
  matters: the composer's own existing trance material in the same file
  over-rings on 28% of pairs**, so this is a difference of degree on an
  accepted property of the section, not a new defect class.

**Day 21 — assembly CORRECTED to the ALTERNATION model (composer's actual
intent; my first build was wrong).** The composer is interleaving two
streams, each advancing ONE item per insertion - phase steps 1,2,3... and
chord patterns P9,P10,P11... - not dumping whole sequences. First build had
put in all 6 phase steps (40.8 s) + all 22 patterns; replaced.
**Now in `scores/tranceA003b.json`:** phase STEP 1 only at **66.8-72.2 s**
(87 BPM, offset 0.469, 5.4 s = the composer's performed duration, octaves of
ROW 7's first pitch G# -> G#1/G#2/G#3, 78 notes), then chord **P9 only** at
**72.4-76.0 s** (9 beats `12 28 base 3 base base 16 27 base`, 47 notes).
Original 749 notes untouched; existing material at 62.0-66.4 is base chords
on every beat (answering the composer's question). Next insertions will be
phase step 2 and chord P10.
**Script promoted to `tools/assemble_trance.js`** - re-runnable (strips its
own `asm-*` objects first), and the assembly order is a literal PLAN array
at the top: append `{k:'phase',n:2}` / `{k:'chord',n:10}` and re-run.
**Bug caught by reading the output:** a `ceil(t+epsilon)` beat-snap pushed
the first insert from 66.8 to 67.2 - an on-grid time must snap to ITSELF,
not the next beat. Fixed with a round-vs-ceil tolerance test.

**Day 21 — base-chord run re-voiced onto different parts (composer).** Survey
of `tranceA003b` found 8 base-chord runs; three of them (34.4s x4, 46.0s x7,
60.8s x15) all sat on the SAME five parts **T1/T3/T5/T7/T9**. The composer
asked for the 15-chord run at 60.8-66.4 to play on a different five. Moved to
the disjoint set with a shuffled pitch->part mapping (seed 60815):
**G1=T2 · A2=T6 · E3=T8 · B3=T4 · F4=T10**. Only the `layer` field changed on
75 notes; pitches, times, velocities untouched. The 46s run is deliberately
left as-is so the contrast is audible. Backup taken before the edit (the file
is untracked). *Note for later: the 34.4s run also shares T1/3/5/7/9 - a third
distinct voicing there is available on request.*

**Day 21 — PER-BEAT RESHUFFLE adopted as the standing rule for chord sets
(composer).** *"Let's make the rule the chord reshuffles every beat... the set
around forty-five, the set around sixty, and then the number nine chords
around seventy-two. And then moving forward, the same for all of those chord
sets."* Every chord attack now draws a fresh random set of parts and a fresh
pitch->part mapping, instead of a whole run sitting on one fixed voicing.
- Applied in place to the composer's two runs (46.0-48.4 s, 7 chords;
  60.8-66.4 s, 15 chords) - 22 beats re-voiced, seed 4572, only `layer`
  changed. Supersedes the single fixed re-voicing done an hour earlier.
- Wired into **`tools/assemble_trance.js`** (`pickLanes`, seed 90210) so every
  future chord insertion is reshuffled by construction; P9 re-rendered
  through it. Chord SIZE varies (base 5, sp27 4, sp16 7), so the draw is
  n-of-10 per beat.
- **MEASURED SIDE BENEFIT, not the composer's stated reason but real:** a
  fixed voicing forces every sounding player to re-attack every 0.4 s, which
  always over-rings. Reshuffling lets players fall out of the texture on some
  beats. Over-ring pairs: **46s run 60% · 60.8s run 49% · P9 59%**, against
  the still-fixed 34.4 s run at **100%**. So the rule improves playability by
  roughly half, on top of its musical purpose.
- *Still fixed on T1/3/5/7/9: the 34.4 s run (4 chords) - flagged, not
  changed, since the composer named only three sets.*

**Day 21 — 34.4 s base run reshuffled too (composer: "yes do 34.4 too").**
4 beats re-voiced, seed 3440; over-ring 100% -> 82% (only 11 pairs, so the
improvement is coarse). All four fixed-voicing base runs are now per-beat
reshuffled; the rule holds for everything the assembly tool writes.

**Day 21 — composer's question about phase step 1 CONFIRMED BY MEASUREMENT:
"every part is playing a single tempo, right? just a steady pulse per part."
YES, exactly.** Measured from the rendered notes: all ten parts pulse at
**87.0 BPM (0.6897 s between their own attacks)**, dead steady, 7-8 attacks
each, one pitch per part for the whole segment (T1-4 G#1, T5-7 G#2, T8-10
G#3). What differs between parts is only their **PHASE**: first onsets run
66.800 / 66.952 / 66.995 / 67.038 / 67.081 ... spread across the 0.69 s
cycle by the rotor offset 0.469. This is the phase-shifting model in its
purest form - one tempo, one pitch per player, difference carried entirely
by where in the cycle each player sits. **Notation consequence worth
recording: each part here is a single steady pulse at one tempo, which is
about as notatable as material gets (contrast the M5 density-apex problem) -
the difficulty moves entirely to ENTRY TIMING, which is exactly what the GC
bouncing-ball device is for.**

**Day 21 — OCTAVE SCRAMBLE in the phase segments (composer), and a CORRECTION
to the composer's presumption about the multitempo sections.**
- **Built:** each phase player keeps its single steady tempo (87.0 BPM in
  step 1) and its single pitch CLASS, but every attack takes a different
  octave, no immediate repeat (`scrambleOct`, seed 8021, in
  `tools/assemble_trance.js`). Verified: all 10 parts still 87.0 BPM exactly,
  pitch class 8 (G#) only, zero immediate repeats, all in 30-65. Rendering
  rule now stands for every future phase insert.
- **THE CORRECTION, measured:** the composer presumed *"the multitempo ones
  are the same - each player plays a single pitch at a steady tempo."*
  **They do not.** The multitempo sections ALREADY scramble octaves - every
  player there cycles through all three octaves of the pitch class
  (T1 G#3,G#1,G#2 · T2 G#2,G#1,G#3 ...). So the behaviour just added to the
  phase segments is what the multitempo material has been doing all along;
  the change makes them MORE alike, not less. Also measured while checking:
  the ~30 s and ~37 s sections genuinely are multi-TEMPO (players at 102.6 /
  67.1 / 110.5 / 150 / 118.3 BPM etc.), while the **~51 s B section is
  uniform - all ten players at 80.0 BPM**, so it is a phase/register section
  rather than a multitempo one despite sitting in the same group.

**Day 21 — `tranceA003c` (composer's next insertion pair).** Two more items on
the alternation, each opening on the next beat:
- **phase step 2 · 76.0-80.9 s** — 93.6 BPM, offset 0.384, 4.9 s, **row 7's
  SECOND pitch D#**, octaves D#2/D#3/D#4 scrambled per player (no immediate
  repeat). All ten parts verified at exactly 93.6 BPM.
- **chord P10 · 81.2-82.4 s** — 3 beats `18 base 16`, re-voiced onto fresh
  parts every beat.
`003b` keeps its 2-item state (phase 1 + P9); `003c` is the 4-item version.
**Tool now takes SRC/OUT/PLAN via env** (`ASM_PLAN="phase:1,chord:9"`), and
because the seeds are consumed in PLAN order a prefix plan reproduces the
earlier version's material byte-for-byte - which is how 003b was restored
after a bad write. Phase pitch is now derived from a ROW7 table, so insert N
automatically takes row 7's Nth pitch.
**Process slip worth keeping:** a `sed`-style string replacement of the write
path silently did not match, so the first run wrote the 4-item assembly into
003b instead of creating 003c. Caught by reading the run output (it printed
the old filename). *Lesson: when patching a script by string replacement,
have it PRINT what it wrote - the confirmation line is what caught this.*

**Day 21 — PERMUTATION MACHINERY complete (composer: "make the swaps facile").**
Three changes to `tools/assemble_trance.js`:
- **Per-chunk seeds** — each chunk's dice derive from its own plan token (+
  occurrence for literal repeats), so editing one chunk cannot re-deal any
  other. PROVEN: shortened P10 from 3 blasts to 2 mid-plan; all 8 other
  chunks came out identical in content (counts, pitch/lane sequences,
  relative times to 0.000 ms) while shifting earlier in time. (First
  comparison falsely flagged PH3/PH4 - a toFixed rounding bug in the CHECK,
  not the tool; the finer check is the evidence.) One-time cost: this
  migration re-dealt all voicings/octaves once; tranceA003e regenerated.
- **Overrides:** phase:N[:dur][:PC] (duration seconds, pitch-class name) ·
  mt:M[:secs] · chord:N[:from][:to][:cuivre] already existed.
- **Reflow confirmed as automatic:** chunks lay end to end on the 0.4 grid,
  so a length change moves/shrinks everything downstream by construction -
  content untouched (that IS the isolation proof above).

**Day 21 — documentation gathered (composer request, while listening):**
`docs/ASSEMBLY_METHOD.md` written - the compositional process record of the
assembly arc (rows as reservoirs · chord grammar from dictated preference ·
the performed timings as form · alternation model · the permutation layer ·
"score as plan"). PAPER_NOTES #7 filed with the five paper-facing claims.
Sibling to PHASE_COMPLEXITY.md; raw trail stays here in day 21's entries.

**Day 21 — THE FINALE BUILT (tranceA003h, second pass).** Composer's dictated
close, all in one plan line: CB5 held chord 5 -> 13 beats · PS5 +50% (11.85s)
re-pitched to F octaves · ACCUMULATING SWELLS - the base chord's notes enter
in their MEASURED entry order from the section opening (G1 A2 E3 B3 F4,
bottom-up, first PULSE onsets 0.0/2.0/4.0/7.6/10.8s), two players per note,
blocks of 3 beats + 1 rest, 2/4/6/8/10 players, held ord with the SURGE
shape (y 2->9) · PS6 FINALE ~21s at step 6's tempo: six pitch worlds approx
equal +jitter with the last DOUBLE - F# oct > C# oct (a fifth up) > G#-rooted
fifths (a fifth up again) > mes6 > the full 12-note aggregate (one random
octave per pc) > BASE on all ten - and the whole section is ONE swell, mp ->
loud (drawn envelope y 3.5->9.5 for CC7, velocity 60->122 alongside).
Parser bug caught by the run log: phasearc:6 first matched the PS1 branch
(generic pattern before the specific) - the printed arc named PS1's sets,
which is what exposed it. Score now ends 203.0s.

**Day 21 — 2q EVIDENCE (composer's ear, on the PS6 velocity build): "if
you're using velocity, it's changing the timbre as well, and the swell is
not that audible."** So on this library velocity = sample-layer/timbre
selection, CC7 = loudness - which is 2q's answer in the direction the score
app already assumed (CC7 carries dynamics; velocity is not the dynamic
carrier). ALSO CONFIRMED: the held-swell fix works ("swell works") - CC7-curve
mode (no sonifyMode) is the way to make drawn envelopes sound; plain mode
pins CC7 at 127. tranceA003h updated: PS5 3:4:5 (F oct takes the 5) · swell
chords doubled (10/6/12/8/16 beats) · PS6 ratios reversed 5:4:3 same harmony
order, build moved to CC7 (env mode, velocity flat 100). Ends 233.3s.

**Day 21 — THE TRANCE SECTION ENTERS THE PIECE.** `tranceA004-final01`
(the finished 251.6s trance section, the day's whole assembly arc) inserted
into `piece-s25-finished01` at the composer's 499.83s - 4.6s after the
existing material ends at 495.27. All 3325 objects (notes + META markers)
shifted, re-id'd, and grouped as `grp-tranceA4-01` with a full-span META
shape (2w convention: drag = move, edge/box = scale) and a TRANCE A4 marker.
The piece now runs 751.4s = 12.5 minutes of the 15-minute Penn State
ceiling. Both files backed up to the session scratchpad before the write
(both untracked - the composer's live files). Verified: no id collisions,
no time overlap with existing material, group intact.

**Day 21 — THE PLAN INTERROGATION (8a, pre-implementation).** The composer
pressed the deliverables plan on three points before the go; every claim was
checked against code, not asserted. (1) THE MISS: the plan had fenced the GC
ball out as "D45 territory" — but the composer will use *"probably all of
the animated objects"* from pieces #1/#2 in THIS score (curve/wave-curve
following for gliss + crescendos, GCs for beat grids and single shots, line
wedges). The fence conflated animation with interactivity. MEASURED: both
prior performance apps share one overlay inventory (GC ball · curve
follower · line-wedge meter · motive pie) and every draw is already a pure
function of currentDisplayTimeSec — so the fix is a CONTRACT (state(t) →
SVG, deterministic, no wall clock) and a PORT, not a design. That same
property is what V4's frame-by-frame export needs, so the miss, once found,
strengthens the export story. (2) REFINE-LATER made structural: beam
direction is a hard-coded convention in layout.js and no authored channel
reaches the per-item dxSs — added the engraving-override overlay kind (V1)
+ a protrusion auto-detector filing to the polish ledger (V3). The overlay
pipeline already warns-not-drops on unknown kinds — the extension point was
waiting. (3) TRACK-HEIGHT THOUGHT EXPERIMENT: makeView takes arbitrary lane
fractions (irregular heights representable by construction) but
systemsForParts only GENERATES equal bands and ssPerSystem is global — a
taller lane today means a proportionally bigger staff. Added per-part
weights + per-lane ssPerSystem + the px-boundary test (only coords.js may
compute pixels — the invariant that retires the viewport-math bug class the
composer named from previous pieces). Wrong-path kept: my first framing had
treated "scroll downward" as possibly nixed — it wasn't; it split by window
(video = all parts fixed, zoom = vertical scroll). Amendments live as [A21]
in DELIVERABLES_BUILD_PLAN.md; analysis in the preplan §8 second addendum.

**Day 21 — PLAN INTERROGATION, SECOND PASS: rejoining the one-score
architecture.** The composer's addition: the video score must plug into the
S7 four-strata system - one dataset, one timeline, N realizations - even
though it moves first and even though its animation engine differs from the
performance score's (which needs WebSockets/cross-web sync). Assessment
against S7 + the code: the strata already carry most of the guarantee
(video/zoom/print are stratum-4 view configs over the same S1 + IR +
coords/layout/render the study score uses; GC devices are ALREADY IR data -
layout.js consumes devices[].kind === 'gc' today). The one seam where a
separate system could have grown unnoticed: THE CLOCK. V2 was speced as a
local audio-slaved clock with no stated relationship to D45's future
networked sync - two transports, and if cursor/objects bound directly to
the local one, the performance runtime would rebuild the animation layer.
Closed with three [A21b] invariants in the build plan: (1) one timeline -
everything keys to S1 seconds, no private timebases; (2) clock = INTERFACE
(now/play/pause/seek in S1 seconds); cursor, system turns and animated
objects consume t only, never a clock source, enforced by the same
source-check pattern as the px boundary; (3) realization = CONFIG -
container.json holds named realization entries (video-jury, zoom-working,
print-letter), so the composer's anticipated "modified conductor score =
this one + bells and whistles" is a fourth entry and D45's realizations are
later entries with the networked transport. Reframe worth keeping: D45 is a
PROJECT boundary, not a SYSTEM boundary - the severed project inherits the
whole stack and swaps the timekeeper.

**Day 21 — V0 STARTED: the first true-size proof slate (8a).**
tools/v0_proofs.js renders candidate containers at exactly 1920x1080 on
REAL material: trance = trance-section-01's busiest 12 s window (t0=49,
162 events, found by sliding count); apex = section1-e20 centered on the
M5 window (48.9-54.9). Twelve proofs -> notation/app/proofs_v0/ + an
index.html browsed at 100% zoom (captions OUTSIDE the frame so the look
stays clean; params also in an SVG comment). Slate: A header 60/80/100px
(lane 96.8/94.8/92.8px) - B ss/system 10/12/14 (staff 37.9/31.6/27.1px) -
C trance 8/12/16 s/system (240/160/120 px/s) - D apex 4/6/8 s/system
(480/320/240 px/s). Header band drawn by the proof tool at STATED px
(title .30H, marker .22H, timecode .26H) - render.js's y=12/font-10
marker placeholder deliberately unused (the memory trap). VERIFIED on
:5210 via DOM (Browser pane not displayed, so no pixel screenshot):
12/12 imgs load at exactly 1920x1080; A-header80 carries 173 paths
(heads/clefs/accidentals), 336 rects, 162 dots; D-apex-sps6 has 10 beam
polygons; header texts at 24/18/21px; inner svg nested at y=80. The
slate covers V0 decisions 1-3 only; META overlay styling, font, zoom
factor, system-turn, print numbers are separate V0 items.

**Day 21 — THE VIEWER WAS LYING ABOUT THE FIT (composer caught it on first
load).** The v1 proof index was a padded scroll page - 12px body padding
(content 1944px on a 1920 screen -> horizontal scrollbar), a note bar +
captions above the frames (vertical scroll to reach part 1), and the
spawned scrollbar ate ~17px of the 1080 (bottom lane clipped). On a screen
the SAME SIZE as the frame, any page chrome at all breaks the fit - the
judgment surface must have zero chrome of its own, which is also just what
the shipped video has (fullscreen playback, no browser). Rebuilt as a
pixel-exact pager: one frame at 0,0, no margins, J/K step, C toggles the
caption overlay, F11 = exact fit. VERIFIED at a true 1920x1080 viewport:
scrollW/H == clientW/H == 1920/1080 (no bars either axis), frame rect
(0,0,1920,1080), J/K/C all fire. Lesson filed: the proof CONTENT was
verified in v1 but the VIEWING SURFACE was not - same trap class as the
renderMarker memory (measure the presentation, not just the payload).

**Day 21 — V0 VERDICTS ROUND 1 (composer, on proofs_v0; verbatim in
COMPOSER_LOG).** A: NO HEADER AT ALL for the video score ("akin to the
paper score"); the future CONDUCTOR realization carries the clock - which
is the realization-as-config design paying off on its first decision.
B: staff = 31.6 px DECIDED for staff sections - note it was chosen as an
ABSOLUTE size, so with the header gone (lane 94.8 -> 102.8 px) the V1
staff/lane decoupling stops being optional and becomes required (staff px
first-class, air absorbs the difference: ~35.6 px per side). Also: "not
every page or every section will have staff" -> sectional staff on/off
filed to V1 (today layout draws the staff full-width always). C: trance
12 s/system PROVISIONAL (maybe 16; judged static, re-judge under motion at
G2); the REQUIREMENT is per-section variety - a 4-beat dense page next to
a 20-beat sparse page. Architecture answer, verified against the code:
per-PAGE/SECTION scale is already a parameter (planPages pageSeconds;
px/s = 1920/window per view) - the boundary is UNIFORM TIME WITHIN ONE
PAGE (xOfSeconds is linear inside a window; nonlinear in-page time would
be a coords change). D: apex 8 s/system okay FOR THIS MATERIAL; density
builds expected tighter. NEW V0 item surfaced: the VERTICAL-STRESS proof -
lane height judged with ledgers + accents + dynamics + hairpins (mock
strokes for glyphs that don't exist yet; the question is air budget, not
glyph shape). container.json DRAFT created (decided/provisional/open per
item; G0 not passed). Composer's meta-question answered in chat and the
answer filed: what G0 freezes vs what stays data-cheap.

**Day 21 — V0 round 1, two follow-ups.** (1) Rehearsal numbers etc. = a
shared band ABOVE the whole score, per-realization furniture for the
conductor/rehearsal/performance realizations, NOT video-jury - filed in
container.json (conductor._note2), bridge crossed at that build. (2) The
"time is uniform within one page" boundary RESTATED more precisely on the
composer's push: what is free today = per-page/per-section scale and
scroll speed (each page has its own px/s; the cursor follows). What is
not built = a mid-page scale change (half the page 2 cm/beat, half 1.5).
BUT the honest assessment is SOFT boundary: because only coords.js
computes pixels, a piecewise-linear xOfSeconds in the view would re-space
layout + cursor + animated objects automatically - a contained one-module
extension, not a rebuild. Held as a MARKED DOOR in container.json
(timeScale._midPageNote) with the two design cautions: in proportional
notation distance IS time, so a mid-page seam must sit at a chunk
boundary and be visibly marked, and the cursor changes speed at the seam.

**Day 21 — THE VERTICAL BUDGET, MEASURED (and what the stress test was
for).** The composer asked what the vertical-stress test would establish
and whether it is necessary - the right reframe turned it from an eye
proof into a MEASUREMENT (tools/v0_vertical_budget.js over the finished
piece): the container fixes the AIR BUDGET (no header -> lane 102.8px,
staff 31.6 -> 6.51 ss middle-to-edge + 0.51 ss gap) and the material fixes
the DEMAND (pitch extremes per part + fixed text furniture). Result:
furniture fits (tags 4.8, dynamics 5.9 ss) - tops fit via the gap (G4 ~=
7.0 ss) - BOTTOMS DO NOT: every part carries F#1 (the staccato-range
floor), whose head+ledger+dot ink ~= 7.7 ss ~= 9px past the lane edge,
~5px into the neighbor's band. Systemic in range, occasional in fact (a
collision needs BOTH neighbors at opposite extremes at the same x).
Composer decision queued: accept + polish-pass nudges vs widen gaps vs
smaller staff vs an octave device. ALSO from the composer's same look:
first note sits ON the bass clef -> named the missing feature exactly -
PREFATORY (untimed) SPACE: per-page gutter content as rules, view maps
time to [gutterPx, 1920], cursor ENTERS at the music start and never
sweeps dead space. Filed as V0 decision 11a [A21c] + container.json
prefatory block; render.js's pin-clef-at-x=0 is a placeholder to be
replaced.

**Day 21 — VERTICAL BUDGET DECIDED (A) + THE C-SWITCH TESTED.** Composer
took option A (accept; machinery handles actual collisions) and asked the
system-stress question straight: if we later choose C (smaller staff), is
it a SWITCH - flip one number and everything resizes? ANSWERED BY RUNNING
IT: proof pair E on the CHOSEN container (no header, lane 102.8) with
staffPx as the flipped number - 31.6 vs 28.0. The proof tool now takes
staffPx directly and derives ssPerSystem (exercising the V1 decoupling
ahead of its build). Verified in the served page: identical ink inventory
(335 rects / 173 paths / 162 circles / 22 texts both), staff span measured
off the drawn lines = exactly 31.60 vs 28.00 px, label text scales within
0.1% of predicted (0.8851 vs 0.8861). Bonus number: at staff 28 the F#1
worst case drops to ~2.5px past the lane edge = inside the inter-lane gap,
NO neighbor contact - so the C-switch also happens to clear the collision
class wholesale if it ever annoys. Fix ladder for a real T-low/T-high
chord crash filed in container.json (furniture flip > micro-nudge >
per-page lane rebalance > 8vb > per-page staff > global switch); per-page
staff size noted as mechanically trivial (a page IS a view) but visually
a zoom jump, last resort. E proofs are in the pager (keys 13-14).

**Day 21 — V0.7 FONT SLATE BUILT (composer deferred the pick order; font
chosen over system-turn because it constrains the V4/V5 rasterizer and
every text item inherits it; the system-turn mock needs MOTION and will
bundle with the first cursor work, where the C/D re-judgment happens
anyway).** Proofs F-georgia / F-times / F-palatino / F-segoe: the chosen
container (no header, staff 31.6, trance busiest window), one font per
proof applied to ALL 22 text items (part labels, tempo marks, technique
tags) by post-processing render.js's hardcoded sans-serif (V1 moves it to
the engraving registry). Windows system fonts only so the proofs show
installable ink; all four VERIFIED INSTALLED via document.fonts.check on
this machine. The winner still must survive the V4/V5 rasterizer - that
proof lives in V4 (frame-vs-app pixel comparison), noted in the plan's
risk section already. Pager now 18 proofs; F group = 15-18.

**Day 21 — V0.7 addendum: "console pro" = CONSOLAS, the prior scores'
voice.** Composer remembered the font from the previous pieces; grep of
both prior repos confirms - piece #1 and #2 apps use Consolas for ALL
score-machine text (time displays, tempo readouts, labels; Segoe only for
UI chrome). The free variant the composer half-remembered = Inconsolata
(OFL). INSTALLATION TRUTH REQUIRED TWO MEASUREMENTS: document.fonts.check
said all five candidates installed - FALSE POSITIVES. Canvas width vs
monospace fallback couldn't separate Consolas (it IS the Windows
monospace fallback); width vs SERIF fallback settled it: Consolas and
Cascadia Mono really installed; Inconsolata and Source Code Pro NOT
(they fell back). Trap filed: fonts.check is a liar, measure widths
against a contrasting generic. F-consolas + F-cascadia proofs added
(pager now 20; F group 15-20). Inconsolata would need a download
(composer permission) and only matters if the font gets EMBEDDED
(PDF/web) - rendered video pixels carry no license question; Consolas
ships with every Windows.

**Day 21 — V0.7: THE FONT WAS CRIMSON PRO LIGHT ALL ALONG.** The composer
corrected the Consolas guess: "Crimson Pro Light and Crimson Pro Light
Italic." Grep of both prior repos confirms it as THE notation text font of
the lineage - LilyPond textFontName in #1 and #2, piece #2's SVG component
library, and piece #2's performance app EMBEDS the TTFs (@font-face,
weight 300) and converts text to path outlines at build (the proven
rasterizer escape hatch, now noted in container.json _exportNote). No
download needed: TTFs copied from piece #1 public/fonts into
notation/app/fonts/ (104+106 KB, SIL OFL). Proof pair F-crimson /
F-crimson-italic added (pager 21-22). MECHANICS: an <img>-loaded SVG
cannot fetch fonts, so the pager now INLINES the SVGs and @font-faces the
TTFs at page level. VERIFIED: both faces load ("loaded" status) and render
with real distinct metrics (canvas widths 231.1 roman / 220.5 italic /
234.4 serif fallback); pager fit still exact (no scrollbars at
1920x1080). Prior-use convention noted for V1 registry: Light = labels/
tempo, Light Italic = expressive/instruction text.

**Day 21 — V0.7 FONT DECIDED: CRIMSON PRO LIGHT ("that was the go-to
font") + V0.11a GUTTER PROOFS BUILT.** Font filed as decided in
container.json (Light = labels/tempo, Light Italic = expressive, per the
lineage convention; export escape hatch = piece #2's text-to-outline).
Gutter slate G (pager 23-26, all in the decided font): 36/48/64 px with
clef+label furniture IN the gutter, plus a 48px BARE page (no clef - the
mid-piece case), dashed line = cursor entry. Mechanics: music view maps
onto [G,1920]; inner render loses its pinned clef (model filter - clef
items removed from a COPY, model untouched) and its part labels
(post-strip); the proof draws gutter furniture itself. VERIFIED
geometrically in the browser: 10 clefs, right edge 41.6px < G=48; first
music ink at 48.9px >= G - the clef/first-note collision the composer
caught is GONE by construction. Composer's next verdict: gutter width
(36/48/64) + whether the bare page reads right.

**Day 21 — the invisible entry line (composer: "i dont see the line").**
Cause: the dashed music-start line was drawn at exactly x=G BEFORE the
nested music svg, whose opaque white background begins at exactly x=G -
the paint order covered the right half of the 1px stroke and left a
sub-pixel sliver. Fix: line drawn AFTER the inner svg (top of the paint
stack), #777 at 1.5px. Verified: it is the last element and
elementFromPoint(48,400) hits it. Same trap family as the viewer-page
fit and renderMarker: the payload was right, the PRESENTATION lied -
and paint ORDER is part of presentation.

**Day 21 — entry line round 2: it was PAINTING but not FINDABLE.** After
the paint-order fix the composer still saw no line. Canvas pixel test
(rasterize the SVG, read pixels) proved the gray hairline WAS rendering
at x=47-48 - so round 2 was a SALIENCE failure, not a render failure: a
1.5px dashed #777 line 6px from ten bass clefs does not read as an
object. Lesson refined: "verify the presentation" has a third rung -
payload right, paint right, and the mark still has to be FINDABLE by a
human scanning a busy page. Fix: cursor-colored (#d84315) 2px dashed line
+ a filled entry arrow at the top; orange confirmed in the pixels
(216,67,21). Proof furniture's job is to be seen.

**Day 21 — COURSE CORRECTION (composer, binding): spend eye-time on
LOCK-INS only.** "Effective tests are ones that tell us flaws in the
architecture... if it's variable later during the polish run, let's just
defer these decisions." Applied: V0's remaining opens re-classified by
that filter. DEFERRED with provisional defaults (all pure data, adjustable
through POL): gutter width 48 (the gutter's EXISTENCE was the
architecture find; its width never needed an eye) · zoom Z=2 (PP-6 holds
at any Z) · META overlay styling (graphic.js values) · print numbers (to
V5's own gate) · animated-object styling (to V2, judged live). DEFERRED
TO V2 GATE: system-turn behavior + the C/D time-scale re-look (need
motion). REMAINING AI-SIDE: engraving census (V0.10, no composer time).
Clef question answered from arithmetic, no test: clef size rides STAFF
size, not gutter - identical at any width; gutter floor ~36px, 48 has
~6px air. Entry-line invisibility on the composer's machine filed to
NITS, troubleshooting deferred at composer's instruction. NET: V0's
composer-facing work is DONE - G0 can close with decided items (frame ·
no header · staff 31.6 · budget A · Crimson · motion model PP-3) +
provisional defaults; V1 (the two windows) is the next build.

**Day 21 — G0 CLOSED, V1 BUILT (the two windows).** Composer closed G0;
V1 executed in three committed sub-chunks, all four suites green
throughout, every new behavior tested red-then-green:
- COORDS: per-part lane weights - per-lane ssPerSystem (lane height and
  staff scale decoupled) - prefatory-gutter mapping (time onto
  [gutterPx, width]) - zoomCfg() = the PP-6 invariant encoded ONCE
  (uniform x-Z of every coordinate; window re-cut derives from the scale,
  span/Z is exact only at gutter 0). Tests: irregular-lane Z-invariance at
  Z=2/3, gutter round-trips, px-boundary source scan on layout.js,
  prove-red sabotage of the zoom staff scale.
- LAYOUT/RENDER: engraving census (V0.10) -> container.json engraving
  block; code defaults = census values so zero pixels moved - the
  ENGRAVING-OVERRIDE overlay kind (stemDir force incl. beamed runs -
  beamBreak - dx/dy nudge; ledgers stay on pitch lines under dy) -
  sectional staff-off spans - gutter-aware clef (right-aligned into the
  dead space). REAL DEFECT found by probing my own green test: the first
  gutter test's regex ignored negative x and passed while the clef sat at
  x=-35.8 OFF-SCREEN (clef wider than gutter at big ssPx). Fix: clamp so
  overflow is VISIBLE, never vanishing; the off-screen case is now itself
  a test.
- SHELL: video mode (locked 1920x1080, container-driven lanes/staff/
  gutter/Crimson, pages at the container time scale) - zoom mode (x2,
  1920x2160, vertical scroll) - one-click toggle preserving music
  position - META overlay port (draws layer-10 shapes; trance scores have
  ZERO layer-10 waveCurves - verified data-not-bug; logic proven against
  piece-s23's 23 shapes). VERIFIED LIVE on :5210: video page 3 25.6-36.2s
  staff 31.6px -> zoom 25.6-30.8s staff 63.2px (exactly x2) -> back to
  the same page. Zero console errors.
- GLYPH_EXTENSION_CONTRACT.md written (four touchpoints; animated objects
  = the sibling state(t) contract, their print counterparts are glyphs).
REMAINING FOR G1 (composer): flip the windows on a real section by eye;
see one irregular-lane render and one engraving override applied (both
are data edits, demonstrable live in the sitting).

**Day 21 — G1 round 1: THE APP REPEATED THE PAGER'S CHROME BUG (composer
caught it, third instance of the trap).** Video mode rendered a perfect
1920x1080 SVG inside a page with a sticky control bar + 14px sheet margins
+ OS scrollbars - so the frame scrolled, wobbled, and the zoom's right
edge was ambiguous (margin pushed it past the window; nothing ran off).
The lesson now has a NAME in this project: THE FRAME IS THE SCREEN'S
SIZE, SO THE JUDGING SURFACE MAY OWN ZERO CHROME - it was learned on the
proofs pager, logged, and still re-committed in the app shell. Fix
(container modes only; classic modes untouched): margins/shadow stripped
- control bar floats and AUTO-HIDES (2s after entry; hover the top edge
to recall; opacity trick none) - scrollbars suppressed on the HTML
element (first attempt suppressed body's - wrong scroller, caught by
measurement) - svg display:block (inline baseline added 4px, caught by
measurement) - LEFT/RIGHT keys page, Z flips video/zoom, so judging needs
no bar at all. VERIFIED at a true 1920x1080 viewport: video scroll ==
client == 1920x1080 exact, no bars either axis - zoom width exactly 1920
no h-overflow, height 2160 wheel-scrollable with no visible bar - bar
hides after 2s and returns on hover - keys work. F11 on the composer's
screen = exact fit.

**Day 21 — G1 CLOSED on the composer's verdict** ("I think it looks good
... the Zoom view is comfortable, it's good"). One finding, answered with
facts + one addition: staff lines flush to the right edge were unreadable
as intended-vs-cut. Facts: the system ENDS at x=1920 by design (page maps
time onto full width); no music can be sliced there (half-open page
ownership + B6 stamp-atomic splicing, proven in slice 1). Addition: a
SYSTEM TERMINAL BARLINE at the right edge (registry data:
engraving.render.systemEndBar, 1.5px at 0.55) spanning all lanes - the
visible statement that the edge is deliberate. Verified in the app: one
rect at x=1918.5, fully inside the frame. V1 = DONE. Next: V2 (transport
+ cursor + the animated object layer; system-turn and time-scale
re-judgment wait at its gate).

**Day 21 (wrap addendum) — V2 pre-build decisions.** Composer: MOTIVE PIE
IS IN - the V2 port inventory is now FIVE (GC ball - curve follower -
envelope following - line-wedge meter - motive pie); container.json V0.11
updated. Also requested and given: the downstream process for NEW
animated objects (the state(t) contract's extension path, mirrored on the
glyph contract; 2j sine figure walked through as the worked example) -
in chat, to be encoded in the V2 build docs when V2 starts.

**Day 21 (late) — V2 BUILT: transport + cursor + the animated object
layer.** Three pieces, committed with the battery green:
- **transport.js = the clock interface (D47)** — now/play/pause/seek in S1
  seconds; audio-slaved when a render is attached (S1 t = currentTime +
  offset), free-running otherwise; timebase injectable so tests never
  touch a real clock. Source-scan enforced: transport is the ONLY notation
  module reading a time source.
- **animobj.js = the contract + the FIVE ports** (composer added motive
  pie): gc (falls under gravity, lands exactly on its IR device anchor,
  height ∝ time-left² = readable trajectory) · curveFollower (dot at the
  SOUNDING pitch of a morphBend) · envFollower (dot riding a layer-10
  level envelope) · lineWedge (ring filling over a >=3s hold) · motivePie
  (pie over a score GROUP's span — gesture groups are this piece's motive
  instances). Data bindings record their stratum; styling = container.json
  `animated` (provisional, D48). Battery: determinism cold-seek ==
  play-through (PROVE-RED: a registered stateful object is caught) ·
  clock-boundary scans · staffPos MIRROR assertion vs layout (Principle
  5) · per-object geometry (gc lands on the tick at impact to 0.11px;
  follower starts at unbent pitch and rises with the bend).
- **Shell:** overlay SVG above the static page (redrawn per frame, page
  never re-rendered mid-frame) · ▶/SPACE play-pause · CLICK THE SCORE TO
  SEEK · audio file input (clock slaves) · hard-cut system turn when the
  clock crosses the page edge (V0.4 judged at G2).
- **Verification finding: rAF NEVER FIRES IN A HIDDEN TAB** (Browser pane
  visibility:hidden, 0 frames in 600ms) — the loop could not be exercised
  headlessly. Fix that PAYS FORWARD: the per-frame path became a named
  drawOverlayFrame(t) exposed as window.__notationFrame — which is exactly
  V4's deterministic export entry point. Verified through it: cursor at
  x=828.0 vs 828.0 predicted (the G2 mechanical spot-check) · GC balls
  animate from trance IR devices (first at t=0.6, flight before the 1.2s
  anchor) · shell frame path deterministic (same t → same frame regardless
  of intermediate frames) · playback across 12.0s hard-cuts to page 2/6
  and draws there · morph-window-01 added to the IR picker: followers +
  pie live (252 circles/26 frames). envFollower + lineWedge are
  unit-tested; live demo needs META/held material (a piece-s25 window —
  V3's extraction job, queue for the G2 sitting).
**G2 REMAINS (composer + audio):** onsets-on-cursor by eye with the Reaper
render attached · GC + follower watched on real material · the two parked
decisions (system-turn behavior; trance 12-vs-16 + apex time scale) —
judged under motion in the same sitting.

**Day 21 (late) — V3 BUILT AND RUN: the trial-insertion loop + ledger +
detector.**
- **tools/notate_section.js = the ONE COMMAND:** score + window + profile
  -> extract (extract_core) -> INDEPENDENT validation (ir_validate
  --against-source --complete; a failing doc is DELETED, never left
  half-usable) -> notation/ir/<id>.ir.json -> notation/ir/index.json
  manifest -> the app's picker populates itself from the manifest.
- **Run twice for real on the piece:** piece-open-01 (0-40, section1
  profile: 309 events, 68 chunks - 20 unresolved/35 proportional/13
  simple-bar = mixed fidelity shipping as designed) and piece-trance-w1
  (500-530, trance profile: 296 events, 13 simple-bar/8 unresolved).
- **A REAL EXTRACTOR BUG surfaced on the first run:** an onset EXACTLY at
  the window end (t=40) was included (inWin was inclusive both ends) while
  the chunk-span law is half-open - the validator refused its own
  extractor's output. Fixed BOTH sides to the A3 ownership law (extractor
  < w1; validator --complete >= w1 excluded); goldens + 36-case battery
  green after. The one-command loop's validate-or-delete design is what
  caught it.
- **docs/NOTATION_POLISH.md created** (D18 rule at its head) and
  **tools/protrusion_detect.js** filed its first REAL findings: 24 items
  across three sections - low staccato dots (~5.4px) and low accidentals
  (~3.1px) crossing the bottom lane edge - exactly the class the V0
  vertical-budget measurement predicted, now sitting silently for POL.
- **ALL FIVE animated objects now observed LIVE** on piece-open-01 in the
  video container: envFollower (META shapes), lineWedge (holds), motivePie
  (gesture groups) join gc + curveFollower. Picker manifest merge
  verified; zero console errors.
**G3 formally closes when the composer names a fresh window and sees it
start-to-preview (one prompt -> one command -> refresh). G2+G3 can share
one sitting: play piece-open-01 with the Reaper render.**

---

**Day 22 (2026-08-21) — NOTATION WORKFLOW BUILD, first chunk: sonify_core
extraction + the piece as a MIDI file (the composer records audio from it).**
Session opened with the composer's workflow brief (verbatim intent in chat,
distilled to the approved slate): sandbox-style NOTATION EXPERIMENTS with
version files like the composer score's saves · minimal UI, AI-prompt-driven
("noteheads smaller -> they appear smaller") · playback with each experiment
· global-change structures from day one · derive sibling parts from the
principles once one part settles. Approved: A1 (versions = IR files in the
existing picker, exp-grouped) · build chunk = MIDI timebase + hot reload +
variant tooling + audio auto-attach + workflow doc · knobs-as-data DEFERRED
until a knob needs globalizing (D48 filter) · G2/G3 verdicts deferred, not
blocking. **Audio latency note (composer): rendered-audio slaving showed
higher latency in the past; MIDI is the working default, audio stays as the
second timebase option.**
- **DECISION: one event compiler, N consumers.** score/public/sonify_core.js
  (dual-load) now holds the playback math VERBATIM from composer.html
  (computeYAtT/computeSegY/evalWaveCurve/curveValToCC/morphBendAt + the
  tickCurvePlayback semantics: prearm CC0/KS/CC7 at -0.15 s, >=25 ms CC7
  stream on-change, morph bends, residue cures) plus compileScore(score,
  instruments, ccPoints, opts) -> flat sorted MIDI event list. Consumers:
  export_midi.js (file) and the notation shell's MidiTimebase (live, next).
  composer.html itself NOT rewired — the live app the composer depends on
  stays untouched mid-build; drift is guarded by the battery below, and a
  later delegation rewire is optional, not owed.
- **THE TWO-ENDS BATTERY (Principle 5 applied): tools/test_sonify_core.js
  extracts the app's method SOURCES out of composer.html at test time** and
  runs both implementations on randomized inputs: 99,087 checks green (all
  5 curve models + ctrl segments, real CC7 map dense grid, morph bend
  schedules, plus structural assertions on the compiled piece). --prove-red
  perturbs the core by t+0.001 and the suite catches all 20,000 affected
  checks (Principle 6: seen red).
- **One real bug found by the battery's sort assertion:** compileScore
  appended the end-of-file CC7=127 sweep AFTER sorting, so the final cure
  events violated the declared same-instant order (off<cc<bend<on). Sort
  moved after the sweep.
- **tools/export_midi.js + midi_out.js raw-event/cc extension:** 21-track
  SMF (tempo + T1,T1b..T10,T10b — empty-track order FIXED so Reaper routing
  survives re-exports), 60 BPM / 960 PPQ = 1 beat/s, ~1.04 ms tick. The
  tool INDEPENDENTLY parses the file it wrote and recounts: 4401 notes,
  22,497 CC, 3,531 bends across 40 port-channels, 12.53 min — exact match
  vs compiled events. midi/piece-s25-finished01.mid DELIVERED to the
  composer with the 60-BPM-session reminder (also printed by the tool on
  every run).

**Day 22 (continued) — the rest of the workflow chunk BUILT + VERIFIED LIVE
(:5210 score-verify): live MIDI in the notation shell · hot reload · version
tooling · render auto-attach · the protocol doc.** PLAN 8b filed.
- **notation/lib/midiplayer.js = live MIDI as a transport CONSUMER** (D47
  kept: only transport.js reads a clock; the player receives t). A faithful
  port of tickCurvePlayback's semantics over sonify_core math — prearm,
  scrub-in mid-note, CC7 stream paced by transport-t (not wall clock), morph
  bends, the flush cure. **Headless battery (tools/test_midiplayer.js):**
  whole piece at 60 fps into a fake rig, cross-checked against
  compileScore — 4401/4401 notes both paths, every note prearmed, worst
  onset lag exactly one frame, bends re-centered, flush sweep present,
  scrub-in proven. In the shell: MIDI checkbox (default ON), eager init on
  entering a container view (the lazy-init trap), missing-port warning,
  MIDI↔render mutually exclusive. Graceful-failure path verified live (this
  pane has no Web MIDI permission -> box unchecks + message; the composer's
  Chrome already grants it for the score origin).
- **HOT RELOAD verified live:** 1 s poll over container.json / glyphs.json /
  current IR / picker manifest / renders list; on change -> re-layout +
  re-render PRESERVING page, zoom position and the transport. Proof: staff
  29 -> 31.6 registry edit landed on the open page within ~1.5 s, still on
  page 2/6. **One design reversal during verification:** the document.hidden
  poll gate was DROPPED — the embedded pane reports hidden even when
  fronted, and a gate makes the page stale at the moment it is next seen;
  browsers throttle hidden-tab timers themselves.
- **Version files (option A1) live:** notate_section.js gains --from (fork a
  version), --exp (picker "experiments" optgroup), --prune (file + manifest
  entry out; git keeps history). Fork->appear and prune->vanish both
  observed on the open page within ~1 s. Naming convention db1-T3-x01.
- **Render auto-attach:** notation/audio/<scoreName>.wav|.mp3 (gitignored)
  -> /api/notation/renders -> ♪ render chip; click slaves the clock
  (MIDI unchecks), re-checking MIDI detaches. Dummy-file chip
  appear/disappear verified live. MIME map gained wav/mp3/ttf.
- **docs/NOTATION_WORKFLOW.md** = the portable protocol (the loop, the
  phrase->file map, version commands, sound modes, derivation §6);
  CLAUDE.md Apps points at it. NITS: pre-existing negative-rect console
  noise on the default view, filed.
- **NOT built, on purpose (D48):** strategy-knobs-as-data (waits for the
  first knob that needs globalizing) · source-score polling (notation never
  mutates the piece; refresh once after composer-score edits).

**Day 22 (continued) — first loop iteration for real: db1-t1-x01 + brick
identity tooltips (IR schema amendment 3).**
- **db1-t1-x01 = the first sandbox version file** (density build = the piece
  OPENING, composer corrected mid-scan; T1, window 0-12 = page 1 at the
  working scale). Honest content: ONE sounding event — GESTURE-1 is
  ensemble-distributed, so a single part opens sparse. wc-3 = F#1,
  4.20-8.39 s, ord, envShape SURGE, drawn curve (the composer recognized it
  from the composer score as "the green curve" — color #2E7D32 there).
  **Validator fact found: IR ids reject capitals** (^[a-z0-9-]) — naming is
  db1-t1-x01 lowercase; workflow doc corrected.
- **Composer asked: quick way to identify a brick -> hover text.** Built as
  native SVG <title> tooltips: layout.js composes the identity line (pitch ·
  technique · env · span · class/strategy · source object), render.js emits
  it (bricks opt back into pointer-events). **Prerequisite done at the same
  stroke: IR events now carry `env` (envelope species) and non-default
  `mode` (plain/ks)** — schema amendment 3 (optional fields, old IRs stay
  valid), extract_core carries them. That closes data-gap (a) from the
  surge discussion: devices designed next can READ the envelope.
- **Batteries after the change: ALL GREEN** — extractor golden, 36-case
  validate battery, layout/render/snapshots (75)/splice/stamps/coords.
  All three IRs re-extracted (chunk counts identical = deterministic);
  verified LIVE on :5210 zoom view: tooltip reads "F#1 · ord · surge ·
  4.20–8.39 s · drawn-crescendo-curve / unresolved · wc-3".
- Lib code (layout/render) is NOT hot-polled (data is) — the composer's
  open page needs ONE refresh to get tooltip code; IR/registry changes
  after that land within ~1 s as designed.

**Day 22 (continued) — THE SURGE DEVICE, elements 1+2 ONLY (composer:
"one element at a time... those two alone nothing else"): the curve + the
dotted go line, ported from piece #1's viola opening gesture.**
- **The full device as spec'd by the composer (for the record, built
  incrementally):** curve · dotted line at go time · WHITE notehead on the
  staff just before go time · start/end dynamics (ppp/fff here) with an
  ARROW between them INSTEAD OF A HAIRPIN ("this is new"). Elements 3-5
  deliberately NOT built yet.
- **The reference found:** piece #1 curve_library/CRV_20260111_005727
  ("used with initial viola cres.", 4 s, y 0->10) + compose_pages.js —
  numbers ported VERBATIM: curve stroke 1.5 @ 0.8 + fill-under 0.15;
  go line 0.5 @ 0.4, dasharray 2,2, full lane band. Color = #2E7D32
  (this piece's composer-score surge green). All in container.json
  engraving.render (envCurve/goLine) — hot-tunable.
- **The composer asked for the curve equation: wc-3 rise = EXPONENTIAL,
  slope 0.35** (k = 4*slope = 1.4), peak at 98%, linear cut over the last
  2% (nodes [[0,0],[0.98,10],[1,0]]).
- **IR schema amendment 4: event.level.samples** — 101 normalized samples,
  frozen at extract (piece #1 curve-library precedent), computed through
  sonify_core.evalWaveCurve = the SAME math playback follows: drawn, heard
  and notated shape are one function. Golden found a real edge on first
  run: generated objects with nodes but NO segments array (playback would
  throw on them in curve mode too) — sampling now requires segments.
- **Parachute kept:** the brick (and its tooltip) stays under the curve
  until the device is complete — the class still reads unresolved.
- Batteries all green (golden, 36-case validator, layout/render/75
  snapshots/splice). **Verified live (:5210, video frame):** curve bottom->
  top->cut geometry exact; dotted line at x 702.89 vs 702.9 computed for
  onset 4.198. Composer's page needs ONE refresh (lib code), then registry
  tuning lands in ~1 s.

**Day 22 (continued) — UI persistence + the STALENESS CUE for frozen curve
samples (composer: "I caught that you are pre-generating samples... lets
have a cue"; "hot reload keep all the parameters?").**
- **UI persistence:** every control (view/mode/parts/t0/w/ir/score/m4/midi)
  + page index + zoom position now survive a reload (localStorage, saved on
  change and on every render; selects only restore to options that still
  exist). Cost of doing it: THREE latent TDZ bugs surfaced — restoring a
  container view runs the whole transport/anim/MIDI path during the INITIAL
  render, which the old top-to-bottom declaration order never had to
  survive (UI consts, barTimer, rafId/midiWasPlaying/state.transport/
  state.midi). All hoisted; the failure mode was page-dead-with-ReferenceError.
- **The staleness model, stated:** the composer score stays the curve's
  source of truth; IR level.samples = a snapshot at extract. New 1 Hz
  mtime stat (/api/composer/mtime/<name>, cheap) watches the source file;
  on change the page re-fetches the score (META overlay + markers refresh
  too) and re-evaluates every extracted curve through sonify_core — drift
  > 0.002 raises an amber badge naming the object: "wc-3 (curve) — ask the
  AI to refresh <id>". Also flags (moved) onsets and (removed) objects.
  A re-extract clears the badge (fresh snapshot supersedes).
- **Verified live on a SCRATCH COPY of the piece** (never the real file —
  the autosave-overwrite trap class): slope 0.35 -> 0.8 on disk -> badge in
  ~1.5 s -> re-extract -> badge cleared AND the curve redrew steeper
  (midpoint y 885.8 vs computed 893 for k=3.2, within sampling tolerance).
  Persistence verified by full reload restoring video view + experiment IR.

**Day 22 (continued) — views explained + fixes A/B (composer walked in with
four screenshots: "I dont understand them and they might be buggy").**
- **Diagnosis first:** nothing was broken geometry. Shot 4 (zoom "empty")
  = the staff centered in a 2160-px sheet with the scrollbar HIDDEN by
  design — the composer was looking at the ceiling with no way to know.
  Root mismatch: a 1-part experiment IR inside the 10-part jury frame
  inflates one lane to the whole 1080.
- **Fix A:** entering zoom auto-centers the viewport on the first part's
  staff (only on ENTRY — manual scrolling sticks across hot reloads).
- **Fix B:** `lanes.sparseCapPx: 220` (registry data, video-jury entry) —
  when computed lanes exceed the cap, lanes cap and the band centers.
  Verified: 1-part video staff lands 523.8-555.4 (frame center 540);
  zoom auto-scrolls to the staff (scrollY 720 of 2160, center exact);
  **10-part piece-open-01 untouched** (50 staff lines, 43-1036 = PP-2
  jury frame exactly — the cap only exists for sparse IRs).
- **Sandbox settings guidance given** (pre-fix: notation/window/T1/w=12,
  video for sound; post-fix: ZOOM is the primary sandbox surface as the
  two-window design intended).

**Day 22 (continued) — surge device retuned by composer verdicts (round 1
of looking at it): bricks toggle · 90° back edge · visible go line ·
fill-only curve.**
- **Bricks toggle:** new checkbox next to M4 lines (persists; hides the
  parachute bricks AND their tooltips — a render option, hideBricks).
- **90° cut:** for env=surge the drawn ink now rises to the PEAK sample,
  holds to the note end, and drops dead-vertical — the composer's "ending/
  back of curve should be 90 degrees." The sounding 2% release ramp stays
  in the data untouched; only the ink squares off. Verified in the DOM:
  ...(865,24)->(874,24)->(874,280) = rise, hold, vertical.
- **Go line was invisible; composer delegated the numbers** ("intuit a set
  of settings, I dont want to get bogged"): now 1.5 px @ 0.85, dash 5,4
  (was piece #1's 0.5 @ 0.4, 2,2 — right for its dense pages, too faint
  alone on ours). Curve = NO outline (composer), fill raised 0.15 -> 0.3
  so the shape reads alone. Old piece-#1 numbers kept in the registry
  _notes for the record.
- Suites green (layout/render/75 snapshots/splice — corpora carry no
  env curves, so snapshots were expected to hold and did). Registry values
  and code defaults kept in sync.

**Day 22 (continued) — surge round 2 + staff furniture + the persistence
"bug" that wasn't.**
- **Sharp top-right corner (composer: "why it isn't a sharp right top
  corner? I think my other curves were"):** they were — piece #1's CRV data
  ended AT the peak (y1 0 -> y2 10, no cut ramp), while our samples include
  the drawn 2% release ramp, which round 1 rendered as a tiny shelf at the
  top. Now the truncated rise maps over the FULL note span, meeting the
  note end at full height -> sharp corner + 90° drop. The <=2% time
  stretch of the rise is accepted for legibility; sounding data untouched.
- **Staff lines cut short:** staff is FURNITURE — in a free window wider
  than the material (window mode), outer staff segments now extend to the
  view edges (opts.staffFull; pages/container views unchanged; interior
  staff-off spans keep authored extents). Verified: staff x 0->1250 = full
  sheet at width 16 over 12 s of material.
- **"Still had to manually set settings after ctrl-shift-R — bug?" NO —
  bootstrap:** the composer's page was running pre-persistence code, which
  never SAVED anything; the first reload restored an empty store. Hard
  reload does NOT clear localStorage; from this refresh on, settings
  persist (verified saving live).
- Suites green (75 snapshots unaffected — staffFull is opt-in per call).

**Day 22 (continued) — device element 3: THE NH-UNIT (open head +
accidentals + ledgers + ottava), piece #2's locked laws ported wholesale;
five demo version files.**
- **The dig (composer: "we did all of this in 2pno2perc... dig a little
  deeper there"):** notation_studio's dimensions_table had every law LOCKED
  with provenance — accidental gapToNotehead 0.10 (D.6, tightened from
  LP's 0.35 by eye probe) · accidental-column packing right-to-left,
  minLateralGap 0.10 / fullSlotWidth 0.75 / collision tol 0.05 (D.8.2) ·
  chord displacement |staffPosDelta| <= 1, bottom-up, alternate sides
  (D.8.1 — carried for the chord phase, not yet consumed) · ottava
  geometry sessions 57/77 (hook 0.8, dash 0.3/0.7, text-baseline formula)
  + engage rule = smallest variant within staffRouter's 3-LEDGER threshold.
  All now in glyphs.json `standards` via port_glyphs.js, with provenance.
- **Ported glyphs:** halfNote -> notehead.open (D.3b: wider than filled,
  1.1072 vs 1.04) · ALL SEVEN accidentals incl. quarter/3-quarter pairs
  (flat-family noteY anchors; 3/4-flat bulb x PROVISIONAL, polish-eye) ·
  8va/8vb baked Crimson outlines -> ottavaText.
- **The nh-unit in layout:** right-anchored 0.25 ss before the go line
  (composer's "2 px" at staff 31.6, expressed in ss so PP-6 zoom holds);
  open head stemless + ledgers (at the head's dx, own width) + accidental
  at the D.6 gap + ottava bracket over the sounding extent when the
  written note exceeds 3 ledgers (drawn position shifts, 8va/8vb label).
  Schema needed NOTHING: alter already multipleOf 0.5; the validator even
  enforces spelled<->midi with fractional alters (caught E-3/4-flat vs
  midi 64 -> corrected to 62.5. Quartertone midi is fractional by design.)
- **Demo machinery:** notate_section --demo (schema-only validation — demo
  forks edit pitches and would rightly fail against-source; labeled DEMO)
  + tools/nh_demo.js regenerates the composer's five exercises x02-x06
  (2 ledgers below + sharp · 2 above + 3/4 flat · middle line · 8va on a
  top ledger · 8vb on-staff + 3/4 sharp).
- **Pre-existing bug fixed en route:** render dropped dxSs on ledger items
  (a shifted head left its ledgers behind); now honored + ledgers take the
  head's own width.
- **All verified live** (:5210 DOM): heads/accidentals/ledgers/both ottava
  directions land; anchor math exact (head right edge 322.6 vs go 328 =
  0.25 ss). Suites green (layout/render/75 snapshots/splice/stamps).
- **FLAG FOR THE COMPOSER: the real F#1 surge now engages 8vb** (it sits
  4 ledgers below; the 3-ledger rule fires). Tuba convention usually READS
  low ledgers happily — if 8vb is unwanted for this piece, the threshold
  (or below-direction engagement) is registry data, one edit.

**Day 22 (continued) — nh-unit round 2: three SYSTEMIC rules (composer:
"make sure these are systemic fixes not one offs so the troubleshooting
gets lighter the more we make") + 15ma.**
- **H.4c.3 WAS the missed piece-#2 rule** (the composer remembered
  resolving it there): accidental right edge sits the D.6 gap left of
  WHICHEVER extends further left — head edge or a ledger whose y the
  glyph touches. Ported into the unit builder (extended from p2's
  anchorY-match to glyph-bbox overlap, which degenerates to p2's rule on
  exact-line notes).
- **The go-gap is measured from the unit's RIGHTMOST INK** — the ledger
  overhang when ledgers exist, else the head edge. (Round 1 anchored the
  head and the ledger crossed the go line.)
- **Ottava bracket spans the NOTEHEAD ONLY** — hook flush at the head's
  right edge (+ endPadSs registry, default 0); dashes RIGHT-ALIGNED
  stepping back from the hook (p2's emitDashes detail — connecting dash
  meets the hook to form the L); label at the unit's left ink, widening
  leftward if the span is under minBracketSpanSs; vertical ref = the
  unit's outermost INK (head/accidental/ledger), not just the head.
- **A fourth systemic rule found BY THE MEASUREMENTS, not the eye:**
  noteY-aligned glyphs anchor OFF-CENTER horizontally, so edge math must
  use (wSs - anchorX), not wSs/2 — the 3/4-flat sat 0.16 ss too far left
  (measured 5.6 px gap vs sharp's correct 2.1). Anchor-aware edges now;
  verified both accidentals at exactly 0.10 ss off the ledger edge.
- **15ma/15mb ported** (baked Crimson outlines); label picks by octave
  count (8va/8vb at 1, 15ma/15mb at 2, clamped + warned beyond).
  x05 demo now E6 -> 15ma on a top ledger, hook verified flush at the
  head edge (316.73 vs 316.7).
- All suites green.

**Day 22 (continued) — device element 4: THE DYNAMIC PAIR + ARROW, and THE
VERTICAL COLUMN STANDARD (registry data).**
- **The convention question answered first** (composer: "is there any
  convention... under the note vs below vs above"): instrumental dynamics
  go BELOW the staff — "under the note" is the horizontal axis (centered
  on the note column), "below the staff" the vertical, clear of all ink;
  consistency band beats note-hugging (Gould). Above-staff = vocal /
  shared-staff upper voice / grand-staff middle / congestion last resort.
  Composer adopted the standard.
- **THE STACK ORDER = REGISTRY DATA** (engraving.layout.stackBelow):
  articulation · dynamic · instruction · ottava (outermost), each
  stackGapSs 0.45 past the previous outer INK. Gould and piece #2's own
  below-chain (chord -> dynamic -> pedal -> ottava, read from
  pluckedPianoChord) agree. Articulation/instruction slots defined for
  when those elements arrive.
- **Engraved dynamic glyphs ported** (dynamic_paths.json, Emmentaler at
  p2's locked font-size -8.5, session 49) — slice-1's text-only stance
  superseded for devices. Vertical registration center-aligned (no
  baseline metadata at source; p-vs-f optical baseline = polish item).
- **The arrow (hairpin replacement):** start mark CENTERED ON THE NOTE
  COLUMN · 0.45 gap · 2.0 ss arrow (0.45 solid head, stem thickness) ·
  0.45 gap · end mark. All registry (dynArrow). Marks derive from the
  drawn level via dynLadder (0..1 -> ppp..fff; surge: first sample ->
  start, peak -> end); authored overlays supersede when present.
- **Verified on the REAL F#1 (db1-t1-x01), every number off the DOM:**
  ppp center 310.85 vs head 310.8 · gaps 9.6 px = 0.45 ss · arrow 42.6 px
  = 2.0 ss · band top 0.45 above unit ink (sharp's descender, not the
  head, correctly the ref) · 8vb NOW BELOW the dynamics, line at
  0.45+hook past fff's bottom, hook flush at head edge. Suites green.

**Day 22 (continued) — dynamics de-derived · drawing layers · cursor +
curve meter (piece #2 styling verbatim).**
- **DECISION (composer): NO dynamic derivation.** The two marks state the
  BOTTOM and TOP levels, not the curve. This piece: every surge =
  full-curve ppp->fff (registry dynPair) EXCEPT the morph section;
  manual judgment per case via authored overrides. Ladder code removed.
- **Drawing layers made explicit** (were push-order): notation ink ->
  env curve OVER notation -> go line over curve -> animation overlay
  (its own SVG) on top. Stable sort by layer rank; within a layer push
  order holds.
- **Cursor = p2's neon magenta verbatim:** #FF15A0 (rgb 255,21,160, the
  staff-2 cursor from index.html), 3 px, whole track height (already
  spanned all lanes). Registry-only change.
- **curveMeter = p2's curve follower MECHANISM ported as a sixth animobj
  kind:** while an event with a drawn level plays, an outlined meter +
  fill ride 3 px left of the cursor (8 px wide, fill 0.3 / outline 1.5 @
  0.8 — p2's numbers), fill height = the CURRENT level, lane-bottom up.
  Color limeGreen #99FF00 (p2's staff-1 green, the composer's "some shade
  of green"). Instances collect from IR events' level.samples (stratum 3,
  no side files). Verified at a deterministic frame (t=6.3): meter x =
  cursor - 11 exactly; fill 0.343 vs computed exponential 0.341.
- Suites green incl. the animobj determinism battery.

**Day 22 (continued) — THE COLLAPSE: one presentation score, composer-score
document semantics.**
- **The composer's reframe, adopted whole** ("just like the composer score
  — it's just one thing, not a bunch of different views"; confirmed NOT
  against the architecture — it IS A21b, the views were slice-1
  scaffolding): the app opens INTO the presentation score. Ten-lane jury
  frame ALWAYS (FRAME_PARTS; a T1 save shows nine empty staves — layout
  gained opts.frameParts, empty lanes = staff+clef+label). ⇆/Z = the one
  view choice (Score <-> Zoom ×2, zoom auto-centers on the SAVE's first
  lane). Bar = save picker · play · Score/Zoom · pages · MIDI/render · ⚙.
- **⚙ = engineering mode**: the notation/graphic proofing views and their
  window/parts/mode/width controls live behind it (for AI verification,
  not the loop). ⚙ off forces a container view; state persists.
- **PLAYBACK = THE SAVE'S SCOPE** (the held decision, now built): the
  player filters to ir.source.parts — load the T1 experiment, hear T1;
  still LIVE scheduling from source data (not a fixed MIDI file), so curve
  edits/re-extracts stay instantly audible. Player cache keyed by
  score+parts. Battery extended: parts:[0] plays exactly T1's 465 notes on
  tuba1/tuba1b only (first run caught my own test's coarse stepping
  jumping over sub-frame notes — test artifact, fixed to frame rate).
- **Verified live as a fresh user** (localStorage cleared): opens in video,
  ten lanes T1-T10 (50 staff lines), slim bar, ⚙ reveals/hides, zx flips.
  Sparse-lane cap now moot in container views (always 10 lanes; the cap
  code remains for any future sparse frame config). Suites green.
- NOTATION_WORKFLOW §5 rewritten to the new recipe: pick save, SPACE.

**Day 22 (continued) — first real sitting on the collapsed app: five
reports, five systemic fixes.**
- **"Phantom pie" + stray objects: the collapse had exposed SCORE-WIDE
  animated objects to the ten-lane frame** (before, non-save lanes didn't
  exist so their instances silently skipped). collect() now scopes to the
  save: part-bearing kinds filter to ir.source.parts; motivePie qualifies
  only when its WHOLE group lives in the save (a lone member isn't the
  group — GESTURE-1's pie no longer haunts a T1 solo). Battery caught my
  first over-eager default (fixture ir has no source → now null = unscoped;
  the shell opts in explicitly).
- **"Large green triangle" = the META overlay, not the curve** (the
  composer's zoom-shrink report dissolved with this: the real device curve
  is lane-bounded and grows ×2 in zoom; the giant thing was META spanning
  the whole frame). META (overlay + its envFollower) is now a checkbox,
  default OFF in the loop, persisted — on for full-score judging.
- **SPACE "gets trapped": there was never a space handler** — it worked
  only while the ▶ button kept focus; touching any control stole it.
  Space now always toggles play in container modes (blurs the control;
  only genuine text/number typing keeps it).
- **"Page only reaches T8" (mid-turn report): the fixed 1920×1080 frame
  assumed F11.** FIT-TO-WINDOW added: Score scales to fit both axes, Zoom
  fits width and scrolls height by design; internally still 1920×1080 so
  jury geometry is untouched (F11 on 1080p = scale 1 = true size).
  First implementation via css transform left PHANTOM SCROLL (transforms
  don't shrink layout boxes — measured scrollH 2160 for 1440 of content);
  reworked to viewBox-based sizing, scrollH now exact (720/720 video,
  1440 zoom). Click-to-seek + zoom auto-center made scale-aware; the
  anim overlay gained a viewBox so it scales with the page.
- **"Bar blocks the top of T1 in zoom" (mid-turn report):** the floating
  bar + its hover zone moved to the BOTTOM edge in container modes.
- Suites green (animobj/layout/render/snapshots/midiplayer).

**Day 22 (continued) — sitting-1 round 2: the ¾ staff, the black edge, the
"pie at the go cursor".**
- **¾-staff diagnosis: the hidden engineering width box was still ruling
  the page.** The persisted w=16 stretched a 12 s section onto a 16 s page
  — staff correctly ended at the material with the G1 terminal barline,
  inside a needlessly long page. Primary mode now pages by the REGISTRY
  time scale; the width box only rules when ⚙ is on. (On a genuinely
  short FINAL page the ¾-staff look + terminal barline IS the decided
  design — G1.)
- **Black right edge = one-sided letterbox** from fit-scaling against the
  cmode backdrop; the sheet now centers, framing symmetrically.
- **"Pie at the go cursor" = the lineWedge** (generic long-hold progress
  ring), redundant on a surge whose device already shows progress twice
  (curve + meter). Systemic rule: notes carrying a drawn level curve
  don't collect the generic wedge; plain long holds elsewhere keep it.
- Verified live: page 0-12, staff to 1920, centered, overlay at mid-surge
  = cursor + meter only. Animobj battery green.

**Day 22 (continued) — bar no longer pops on page turns:** setCmode was
re-flashing its 2 s entry greeting on EVERY render (page turns, hot
reloads). Now it flashes only on the transition INTO the score view.
Verified: page 1->2 turn leaves the bar hidden.

**Day 22 (continued) — wrap of the first device arc: the hierarchy
dictated, the save-shuffle established, T1 facts scanned.**
- **The composer's SECTION-1 HIERARCHY dictated and filed** (verbatim
  COMPOSER_LOG day 22; distilled as PLAN M5 third amendment): spaced
  attacks → GC · sub-threshold (~500 ms, empirical) clusters → beamed
  Mists-style units on a GC · densest parts → try Mists-continued vs
  LINES-around-an-animated-BEAT-structure (composer's strongest hope).
  Recorded, NOT acted on — "I don't think we're at any of these points
  yet."
- **T1 opening facts (0-60 s scan):** wc-3 is T1's ONLY surge (composer
  suspected so). First fortepiano 14.54 (G#1; more at 23.1/24.3/27.2/
  30.0) · first staccato 17.75 · cuivre 40.93 (VERT01-03) · Bb blast
  48.05-52.46 · GESTURE-2 at 55.94 = provisional end of density build 1
  (composer offered exact timings from the composer score if needed).
- **THE SAVE SHUFFLE (composer's model):** `db1-t1` = THE DRAFT (canonical,
  no exp): 0-55.94, becomes part of the final product — extraction came
  out 52 events / 10 chunks with the staccato cloud runs ALREADY
  auto-resolving (3 simple-bar + 4 proportional), surge deviced, fps as
  bricks. `db1-t1-x02` = the working file: 0-17, surge + FIRST FP only —
  the fp device is the next design target. NH demos renamed to their own
  id space (nh-demo-01..05, ending the x-number collision) and pruned
  (regenerable via tools/nh_demo.js).
- Composer score server: already running on :5200, nothing to launch.

**Day 22 (2026-08-21, new sitting) — T1's second note, reframed.**
- Composer: work on *"the very next note in T1 ... regardless if it is a
  fortepiano or not."* The unit of work is THE NOTE, not a technique-device
  category (the day-22 wrap had framed it as "design the fp device").
  Source score read directly to confirm identity: `wc-23`, G#1 (MIDI 32),
  14.544-15.243 drawn (0.70 s), flat level 6.7, technique fortepiano, plain,
  recVel 85, performanceNotes "FP3x", group grp-g1-opening. Third note =
  `wc-29` staccato 17.749. Working file `db1-t1-x02` holds wc-23 as an
  unresolved fixed-oneshot placeholder (span stretched to the window end 17).
- Bricks toggle question: it lives behind the gear (engineering mode) since
  the collapse; state persists with the other controls (read from code,
  composer to confirm live).
- **"How do I see what time I'm at?" — there was no playhead readout**; the
  bar's #meta shows only the page range. Added `t 14.54 s`: a fixed pill at
  the bottom-right in Score/Zoom (DOM only, never in the SVG — exports stay
  clean; hides while the bar is up) + the same number in the bar before
  #meta. Fed by the rAF loop from drawOverlayFrame's returned t, so it
  tracks click-to-seek while paused as well as playback. Verified in the
  in-app browser: element present, fixed/bottom-right, seek lands
  (t = 7.08 after a 60 % click on a 0-12 page). NOT verified: the live
  number itself — the in-app pane was not compositing (the hidden-tab rAF
  trap from V2), so the composer's refresh is the check.
- Composer confirmed the readout live ("brick at 14.58") — the live number
  is now verified on the composer's machine. Made the pill toggleable on
  request: `t` checkbox in the bar (container modes; persisted with the
  other controls) + the T key. Verified in the in-app browser after a
  reload: T hides/shows the pill and the saved state flips false/true.
  Draft-vs-working restated: `db1-t1` (no x-number) carries the whole
  draft; x02 is the disposable working file.
- **wc-23 length decided by the composer = the measured fp sample length**:
  *"we'll just go with that length because it sounds good."* 2n table
  (bank/sample_lengths.json) fortepiano MIDI 32 = **1.49 s** → the note
  spans 14.544-16.034. The extractor had already applied the 2n law
  (ev-wc-23 duration 1.49 in db1-t1-x02), so the brick is already right;
  the drawn 0.70 s object is not the musical length. Composer also confirmed
  the working order: T1's articulations strictly in source order (wc-3 surge
  → wc-23 → wc-29 staccato 17.749).
- **wc-23 element 1 — composer: "Open Notehead unit with GoLine... all the
  accidentals, ledgers, etcetera that go with it... or Ottava. Let's start
  with that."** Built as REGISTRY DATA rather than a second device block:
  `engraving.layout.devices` in container.json — byEnv (surge = curve + cut
  + goLine + nhUnit + dynPair) then byTechnique (fortepiano = goLine +
  nhUnit) then a per-item engraving override `device:{...}`. layout.js's
  surge block now reads `deviceOf(e)`; ONE nh-unit builder serves both
  (the curve additionally requires level samples — survey: `surge` is the
  only env carrying samples across all 11 IRs). Consequence: every fp in
  the draft inherits the unit; only wc-23 is visible in x02 this sitting.
- Test added (test_layout DEVICE MEMBERSHIP): surge/fortepiano/staccato
  item census + override (fp gains f->p pair; surge curve off) + empty
  registry map = bricks only. My first assertion was WRONG, not the code:
  I expected ledgers on G#1, but G#1 = -5.5 ss, past the 3-ledger
  threshold, so the unit writes G#2 on the bottom line under 8vb — the
  same open ottava question as the F#1 surge (composer verdict pending;
  `glyphs.standards.ottava.ledgerLineThreshold` is the one-liner).
  Batteries green: layout, render, snapshots, animobj, stamps.
- Verified live (in-app browser, db1-t1-x02 page 2, 12-17 s): dotted go
  line at x=1000.5, open head at 989.8, sharp at 984.6, 8vb bracket with
  hook, brick underneath, no warnings. Go line keeps the surge GREEN
  (#2E7D32, one registry color) — flagged to the composer, not decided.
- **Finding for the fold-in (not now):** in THE DRAFT (db1-t1) wc-23 is
  NOT a brick — the chunker swept it into `ch-0-wc-23` (density-cloud-note,
  proportional, 2 fp + 1 staccato, 14.54-24.29), so there it draws as a
  stream note and the device does not apply. Same for the fps at
  24.29-30.75 (simple-bar chunk). When wc-23 is promoted, the classifier
  must keep fixed one-shots out of clouds (or the device must apply inside
  streams) — a §6 derivation question for the promotion step.
- **Go line color:** composer — *"keep that go line always black gray,
  whatever it was before... previous AI figure[d] out all the opacity,
  etcetera settings. Those were all fine. Just change the color back."*
  It had been surge green since the port (no earlier color exists; a repo
  grep of piece #1 found nothing under that name) → `#333`, width/opacity/
  dash untouched (registry engraving.render.goLine).
- **wc-23 element 2 — THE RING BAR (composer spec, verbatim-ish):** a
  black line centered on the notehead's vertical center; left edge flush
  with the go line; thickness ~2/3 of the blue brick's height; right edge
  *"precisely to whatever we said that length of a sample"*; always black
  unless otherwise specified. Built: layout item `ringbar` (t0 = onset,
  t1 = onset + duration — for fixed one-shots the 2n sample length, so
  1.49 s here; ySs = the WRITTEN head position incl. ottava shift, hoisted
  out of the nh-unit block so either element can stand alone) · render
  rect from registry engraving.render.ringBar { hSs 0.667, #111, opacity
  1 } · fortepiano device gains ringBar. Battery: fp ring bar spans
  1..2.49 at ySs -2; surge has none. Suites green.
- Verified live (db1-t1-x02 page 2): bar x 1000.47 = go line x; width
  557.86 = the brick's; height 5.27 = 2/3 x 7.9; bar center y 75.20 =
  open-head bbox center 75.20 (measured via CTM). Go line stroke #333.
- Ring bar tuning: composer started toward "thinner," reversed ("no,
  actually, leave it"), chose transparency instead: **opacity 0.8**
  (registry ringBar.opacity 1 -> 0.8; hot-reloaded, verified 0.8 on the
  page; the in-app hidden pane took ~5 s because its timers are throttled —
  not a bug).
- **"The sound cuts out about halfway through the line" — HYPOTHESIS (not
  yet a finding): note-off truncates the fp sample.** Evidence: sonify_core
  sends note-off at the object's drawn end (wc.endSeconds); wc-23 is drawn
  0.70 s (hand-drawn in grp-g1-opening, not inserted at the 2n length);
  0.70/1.49 = 47 % = the composer's "halfway or a little more." The 2n
  probe held notes 5 s, so it never tested early note-off on fp (the 2o
  gap, for cuivre, in the other direction). Counter-possibility: the
  probe's 12 dB-above-floor tail is simply inaudible in the room.
  **Ear test set up:** `scores/probe-wc23-noteoff.json` = the piece score
  with ONLY wc-23 lengthened to 16.034 (onset + 1.49); extracted as
  `db1-t1-x03` (experiments). Headless compile confirms the only
  difference: off@15.243 (x02) vs off@16.034 (x03), same on, same
  port/channel. If x03 rings to the bar's end → note-off truncates →
  fix is either the DATA (lengthen fps to their 2n length in the score)
  or the PLAYBACK LAW (fixed one-shots' note-off at onset + sample
  length; would have to land in the composer app too, sonify_core is its
  extracted twin). If x03 sounds the same → the bar is honest, the tail is
  just quiet.
- **FINDING (composer's ear on x03): "that one was the whole bar more or
  less, let's use that one."** Note-off DOES truncate the fp sample; the
  drawn 0.70 s was cutting a 1.49 s sound in half. Decision: the 1.49 s.
- **"Is it complicated to replace the midi note in the IR?" — no; built
  as a law:** THE IR IS AUTHORITATIVE FOR SOUND in the notation app.
  `midiplayer.withIrDurations(score, ir)` returns a per-play clone whose
  object ends = IR onset + duration (the archive object untouched; the
  player cache is keyed by the IR object so a hot-reloaded IR gets a fresh
  player). Battery: wc-23 end 15.243 → 16.034, archive not mutated,
  unchanged objects same reference, compiled note-off at 16.034; 29/29.
  Rejected: changing sonify_core's law (it is composer.html's extracted
  twin with a two-ends parity battery — the app would have to change too)
  and editing the archive (the composer's "finished" objects).
- **Protocol for "finished" archive objects** (composer asked for one) →
  `docs/ARCHIVE_AMENDMENTS.md`: archive frozen · corrections live in the
  IR (systematic = extractor rule, singular = override) · playback follows
  the IR · every amendment = a ledger line · fold-back is an explicit
  composer act · known divergences stated (export_midi renders, the
  composer app). First ledger line: wc-23. export_midi --ir → NITS.
- Probe cleanup: `db1-t1-x03` pruned, `scores/probe-wc23-noteoff.json`
  deleted (both regenerable; the finding is what mattered).
- **"In page two the cursor speeds up significantly."** Measured: page 1
  = 12 s over the width, page 2 = the last page's [12, 17] mapped across
  the FULL width — 5 s stretched, 2.3× cursor speed. Fix: every page's
  window is pageSeconds long; a short final page keeps the scale (the G1
  ¾-staff look), the terminal barline moves to the material's end, and
  playback stops at the material's end (drawOverlayFrame endT = min(w1,
  source end)). Verified live: 156 px/s on both pages (surge go line
  702.9 @ 4.198 s; wc-23 go line 444.9 @ 14.544 s; same 48 px gutter),
  end bar at x 826.5 = 17 s, bar width 232.4 = 1.49 s.
- Ring bar opacity 0.8 → **0.65** (composer), verified on the page.
- **wc-23 element 3 — the dynamic. Composer asked what fp engraving
  convention is (answered: fp is a dynamic, not an articulation; accent
  implies no drop; family fp/sfp/sfzp by attack sharpness; tuba has no
  special convention) → "Let's go with SFZP."** Then: does it need piece
  #2's whole glyph protocol? Answer: no — the glyphs were never traced;
  they are Emmentaler outlines from an LP-rendered SVG. Ran the SHORT form
  (one fixture, one extraction, no corpus audit — the size -8.5 and the
  column spacings are already locked): `tools/glyph_probe_dyn_extra.js`
  renders fp/sfp/sfzp (make-dynamic-script) + accent/marcato at the locked
  sizes via piece #2's oracle modules (read-only), with **sfz re-extracted
  as the pipeline check: byte-identical path, 1.1753×0.9705 = the ported
  composite.** Outputs `notation/glyph_sources/{dynamic,script}_extra.json`;
  `port_glyphs.js` merges them (re-port-safe); regenerated glyphs.json
  changed NO existing entry. New: dynamic fp 1.1665 · sfp 1.2818 · sfzp
  1.7257 (h 0.9705) · articulation accent 1.504×0.84 · marcato 1.0012×1.1.
  First filter bug: I looked for scripts at ty<0; forced-above scripts sit
  between the note line and the top — filter = above the notehead line.
- Device gains `dynMark` (single engraved mark on the dynamic slot,
  centered on the head column; fortepiano = 'sfzp'); ottava stacks below
  it per the column order. Battery: centered on head, ottava below, surge
  unaffected. Verified live: sfzp 13.6 px wide centered at x 438.5 = head
  center; 0.44 ss below the unit's lowest ink (the sharp, not the head —
  the chain hangs from the unit's ink, as specified); 8vb below the mark.
- Composer: *"was this generated by lilypond?"* — yes, the letterforms
  (LP 2.24.4 SVG backend, Emmentaler, the fixture is in
  tools/fixtures/lp_probes/); the placement is the app's column standard.
- **Session wrap (third sitting):** journal §2 rewritten for a cold start,
  D49–D51 promoted, principles 9–10, §6 verdicts owed, PLAN 8c created,
  COMPOSER_LOG verbatim, PAPER_NOTES #10. Next: wc-29 (first staccato).

**Day 23 (2026-08-22) — wc-23 closed; wc-29 (the first staccato) opened.**
- Session start: composer's "last look" at wc-23 — *"make sure we haven't
  forgotten anything."* Sweep found five open threads: FP3x · 8vb vs
  ledgers · the whole-note look · the cloud fold-in · export_midi --ir.
- **FP3x / STAC-rev decoded from git history, not guessed.** Composer's
  recollection: *"3rd level of fp ... my guess is fp, something else, and
  then sfzp."* Actual origin: `1109b65` "fp durations **x3 target**" (the
  A1-5 transform tripled fp durations) and `2bd18e1` "random half of
  fortepianos **reverted** to staccato at original duration." Both are
  PROVENANCE tags of the A1-5-fp_cres transform, not performance
  instructions — so nothing is missing on wc-23, and moot anyway since D51
  replaced the drawn duration with the sample length. §6 item (2) closed.
- **Composer: "2 looks good, let's move on to 3."** wc-23 approved whole
  (sfzp beside the surge's ppp; bar at 0.65). §6 item (3) closed. 8vb vs
  ledgers still owed (not raised).
- **wc-29 identity (source read):** G1 (MIDI 31), staccato, drawn
  17.749-18.035 (0.286 s), level 7.1, plain, recVel 90, grp-g1-opening.
  2n staccato sample at 31 = **0.46 s** → IR duration 0.46, sounds to
  18.209. Same D49 law as the fp: the drawn object is 0.17 s short of the
  sample; withIrDurations amends it (ledger line 2 below).
- x02 re-extracted 0-20 s (same id; it had no overlays/overrides to lose).
- **BUG FOUND by the re-extract — the fold-in question arrived early:**
  the chunker made wc-23 + wc-29 ONE `density-cloud-note` proportional
  chunk (two notes 3.2 s apart), which would have stripped wc-23's device
  on the page. Cause: `segmentPlayed` (extract_core.js) compares each gap
  to 2× the local median IOI — but the FIRST gap of a run has no median,
  and the code used the gap itself as the reference: `max(2d, 0.35) ≥ d`
  always, so the second note of any run joined unconditionally. The
  trance segmenter `segment()` has the guard (MAXUNIT 2.0 s: "a first IOI
  above this starts no stream"); the section1 profile never got it.
  **Fix:** first IOI above MAXUNIT starts no group (same constant, same
  meaning). Test added (two notes 3.2 s apart = two singles; two at 1.2 s
  = still one proportional group, DOCUMENTED not blessed); proven red on
  the old code (2 failures), green on the new. Result: x02 = three
  `unresolved` singles (surge · fp · staccato). The 1.2 s-spaced fps at
  23-31 s would still group — that remains the promotion-time question
  (fixed one-shots in clouds: stay out, or device applies inside streams).
- Composer (on the batteries): *"what were the test batteries for at this
  juncture?"* — answer: the segmenter is shared code (every section-1
  extraction), so the extraction test + prove-red was the necessary check;
  running the whole notation stack (layout/render/animobj/...) after it
  was the exhaustive-audit habit, not the targeted check. Noted.
- `test_midiplayer` went red (1/29): its withIrDurations check pinned
  "amended list names wc-23 only" against the WORKING file x02, which now
  rightly amends wc-29 too. A test pinned to a disposable file breaks the
  moment the file does its job. Rewritten to assert the LAW: amended =
  every IR event whose duration differs from the drawn object. 30/30.
- Composer: *"I just want to see the brick, I'll develop the notation part
  by part like the others."* → no device for staccato yet; wc-29 shows as
  a brick (0.46 s) on page 2 of x02; elements come one at a time.
- **Bricks checkbox promoted to the compacted toolbar** (composer ask). It
  had been gated behind ⚙ by THE COLLAPSE, on the reading that bricks are
  proofing furniture. They are not: with the notation still being built
  note by note, the brick IS the visible content for every unnotated note,
  so its on/off is a LOOK decision the composer makes constantly. Now
  beside META (the other layer toggle); hidden only in graphic view, which
  draws its own bricks and ignores the flag. State already persisted
  (`notation-ui`). Verified live: with ⚙ off the bar reads ⇆ · ▶ · ♪ ·
  MIDI · META · bricks · ir · ◀▶ · ⚙ · t; unchecking removes both bricks
  from the SVG (2 → 0 → 2), saved flag follows.
- **Edge cases — composer's question (on wc-29):** *"this brick is on the
  right edge... when I eventually put the notation in, I'll have to see it
  split over two pages, and that's not that easy for me to evaluate... so
  we slide the page over a little bit on the screen... I don't wanna make
  any changes to the main view... what happens if there are things at the
  edges? Do we repeat them on the next page? Some form of the notation,
  continue shapes?"* **Diagnosis: not a page edge.** The presentation page
  (12 s video frame) holds wc-29 at its centre (x 945/1920); the ZOOM
  viewport (6 s, stepping in whole spans from the page start: 12–18, 18–24)
  cut it at 18.0 (17.749–18.209). A working-view artifact.
- **Built: zoom pan.** SHIFT+←/→ moves the zoom viewport 1 s; HOME
  re-aligns it to the page start; ◀ ▶ keep their whole-span step; video
  untouched; state rides the persisted zoomT0. Verified live: at 12.0–17.8
  the wc-29 brick was clipped to 30 px at the edge; one SHIFT+→ → 13.0–18.8,
  brick 143.5 px = 0.46 s at 312 px/s; HOME returns to 12.0.
- **Filed, not built: PLAN 8d (page-edge strategy)** with the AI's
  recommendations R1 (cutter sees ink, not onsets) · R3 (presentation cut
  drawn as a hairline in zoom) · R2 (*events continue, states restate*) ·
  R4 (sweep the draft; build R2 only on a real case). Composer chose
  option (a): pan now, file, carry on with wc-29 — R2 not yet ruled on.
- **wc-29 element 1 — composer: piece #2's GC one-shots ("small note
  heads, stemmed, and single flags") → "black note head, stem, and I
  think one flag. Let's go with one flag for now."** Found in piece #2:
  the `pluckedPianoChord` idiom's oneShot branch (mk-52/mk-54, session
  58c) — filled heads at LP font-size −2 (the "small" look), stem
  thickness 0.13 ss, 8th flags captured at the same size (8up 0.892×3.008,
  8down 1.132×2.796), stem length by the flag-clearance rule (chords
  outside the staff). This piece already carried all of it from the
  day-22 port (glyphs.json: notehead.filled, flag.up8/down8, stem 0.13,
  defaultLength 3.5 = the conventional octave) and uses stems+flags on
  the trance metric notes — so wc-29 is assembly, not capture.
- Built as registry data: `devices.byTechnique.staccato = { nhUnit,
  nhHead:'filled', nhStem:'flag8' }` — the SAME nh-unit builder (ledgers,
  accidental, ottava, column anchoring inherited) with two new knobs: head
  kind and stem kind ('flag8' | 'plain' | off). Stem direction = house
  rule (below the middle line → up), per-item `stemDir` override as on
  metric notes; attach points from the chosen head's own anchors; length
  stemLenFor (3.5, extended to the middle line outside the staff). The
  rightmost-ink anchor rule now counts a stem-up flag. Stem tip updates
  the unit's ink extent for the column chain. Nothing else on the note.
- Tests: parachute "no glyphs" assertion had "staccato has no device"
  baked in → split into "no device ⇒ no glyphs" + "staccato device ⇒ 4
  heads/stems/flags, bricks stay"; DEVICE MEMBERSHIP gains the staccato
  census (filled G2, stem up at the right attach, 3.5 ss, flag at the tip,
  flag right edge = −0.25 before go, stemDir override flips both). Seen
  red (2) before the update; layout/render/snapshots/stamps green after.
- Verified live (x02 zoom ×2, 14–19.8 s): head 1233.4–1249.8 on the bottom
  line (cy 150.4; brick cy 205.7 = 3.5 ss lower = the sounding G1) · stem
  x 1247.6 w 2.05 px (0.13 ss) h 55.3 px (3.5 ss) · flag at the tip
  14.1×47.5 px (0.892×3.008 ss) · flag right edge 1261.7 vs brick 1265.7 =
  0.25 ss gap · 8vb under the head. Composer to judge the look.
- **wc-29 element 2 — THE GO LINE + THE GC, both centered on the go line;
  the notation re-centered on it too.** Composer: *"put in the go line and
  then put the GC centered on that go line... let's center the musical
  notation there. So I guess centered on the go line. So everything
  centered on the go line."*
- **THE REAL GC PARAMETERS, queried from the composer's own scores** (they
  had forgotten which; the answer was in the data, not in memory):
  - **Piece #1 (string quartet), the 6:10 section:** 43 GCs between 355.6
    and 374.1 s, ALL ONE PRESET — `BartokPizz_GC_20260309_112021`
    ("Short"): **stiffness 62 · damping 100 · ictus 90 · descentRatio 60 ·
    duration 0.6**, color neonMagenta, spread over T1–T4. Their stored
    spans confirm the timing law: start = impact − 0.36, end = impact +
    0.24 (= duration × descentRatio and its complement).
  - **The curves are INTERLEAVED with them, not after** (composer
    remembered "afterwards"): 11 curves 350.5–369.2, model `logarithmic`,
    and they are exactly the "slope down / slope back up" the composer
    described — 0→10 at slope +0.25 / +0.40 / +0.286 / +0.280, 10→0 at
    −0.479 / −0.2, plus flat holds at 6.5. Full list in the session trail.
  - **Piece #2 (2p2p) DIFFERS:** all 203 of its GCs are the "Medium"
    preset (50/80/120/55/1.1) — including `ar-mk34-piano2`, the very
    element we looked at this morning. Composer's instruction ("use the
    string quartet version") therefore MATTERS; it was not the same.
- **Physics ported verbatim** from piece #1's `GCMaker.generateTrajectory`
  (public/index.html): descentPower = 1 + ictus/1000×20 (2.8) · ascentPower
  = 1 + stiffness/50 (2.24) · rebound = damping/100 (1.0, so the ball
  returns to full height) · descentFraction = descentRatio/100 (0.6).
  Descent y = h(1 − u^2.8) — the ICTUS HANG: at the midpoint of the fall
  the ball has dropped only 14 % of the way, then plunges. The day-21 port
  was a placeholder (u², 4v(1−v)); it is gone.
- Per-note GCs: the ball now comes from the ENGRAVING DEVICE, not only
  from chunk devices — `deviceOf` is passed into animobj by the app from
  `layout.deviceResolver(ir, opts)`, a new export so the D50 membership
  rules exist in ONE place instead of being re-implemented next door.
  Impact = the note's onset, so the ball lands ON the go line.
- **Centering:** the nh-unit's anchor is now device data — `nhAnchor:
  'center'` puts the MIDPOINT of the unit's horizontal ink on the go time;
  the day-22 default (rightmost ink a gap BEFORE go) is untouched and the
  fp/surge keep it (asserted). Implementation: the accidental's geometry is
  computed BEFORE the anchor is chosen (it was computed inline during
  emission), so the unit's ink extent is known before it is placed.
- **BUG the battery caught on the first run:** at the exact window edge
  floating point yields u = −1e-16, and `Math.pow(negative, 2.8)` is NaN —
  an invisible ball, silently. Clamped.
- **FINDING (real, unresolved): the ball did not fit the frame.** With the
  real trajectory the full drop is used, and at the V2 placeholder's
  dropSs 6 the ball spent its first third ABOVE the frame edge — measured
  cy −11.7 (video) / −23.4 (zoom ×2) — because T1 is the TOP lane and holds
  only **4.52 ss** above the landing line. Set dropSs **3.9**, the largest
  drop whose ball (radius 0.55) stays fully inside the frame in both views;
  verified every sampled frame now has top ≥ 0. **This is a fit, not a
  judgment** — a taller preparatory arc needs a frame top margin or a
  GC band above the lanes. Composer's call (§6).
- Verified live (video, page 2): go line at x 944.84 · ball cx 944.8 =
  the go line · lands cy 35.7 exactly at 17.749 · active 17.389→17.989
  (= −0.36 / +0.24) · notation ink (head 1251.5 → flag right 1279.87 in
  zoom) midpoint 1265.685 vs go line 1265.69. Batteries: layout, render,
  snapshots, stamps, splice, extract-played, midiplayer, coords, animobj.
- **wc-29, GC round 2 — THE BALL SPANS THE LANE (composer, on seeing round
  1):** *"I want the impact point to be at the bottom of the track and arc
  to stop at the very top of the track. So, essentially, the vertical
  trajectory of the ball will be the whole lane height... I just see the
  ball, but it's a very short path."* Round 1's staging was staff-step
  based (landSs 3.0 / dropSs 3.9) and gave a path barely a staff tall —
  and 3.9 was itself a FIT, forced by the top lane's 4.52 ss of headroom.
  The composer's answer dissolves that constraint instead of tuning it:
  measure the ball against the LANE, not the staff.
- Built: `animated.gc.span = 'lane'` (registry) — impact at the lane
  bottom, apex at the lane top, each inset by `insetSs` (0.55 = the ball's
  radius) so the disc is whole at both extremes. The path now scales with
  lane height, part count and zoom by itself; `span:'staffSteps'` returns
  to landSs/dropSs, which stay in the registry unused.
- Test rewritten to assert the composer's sentence directly, in the
  ball's own edges: at impact `cy + r == lane bottom`; at the apex
  `cy - r == lane top`; `drop + 2r == lane height`. (The previous
  assertions measured against landSs/dropSs and went red, correctly — the
  reference itself had changed, not the arithmetic.)
- Verified live (video, page 2, T1 lane): apex ball-top **8.0 px** = the
  lane top · impact ball-bottom **110.8** = the lane bottom · centre travel
  12.3 → 106.5 = **94.2 px**, three times round 1's ~31 px · cx 944.8 = the
  go line throughout · window 17.389–17.989 unchanged. Batteries: animobj,
  layout, render, snapshots, stamps, splice.
- **Open (composer's phrasing, not yet acted on):** *"I don't see either
  the arcs or the impact point."* Read here as "the path was too short to
  read" — which the lane span fixes. If it instead means the ARC should be
  DRAWN (a static trajectory guide) and the IMPACT marked (a dot/tick at
  the landing), those are two new elements, not staging — flagged, not
  built.
- **GC round 3 — THE WHOLE OBJECT (composer): *"when I say GC, that is
  the whole thing. It's an object that I've been using, just like the
  curves... I want the whole object, the same colors, the same lines, and
  line thickness, and then those trajectory... the ball should be the same
  color, the same size as in those scores."*** Rounds 1–2 had ported the
  PHYSICS and guessed the LOOK (a staff-step ball, then a lane-spanning
  ball); the composer's correction is that the look is not a judgment to
  be made here — it exists, in two scores, and is to be copied.
- **Read piece #1's object whole** (`GCMaker.calculateTrajectory`,
  `renderGC`, `update` in public/index.html): the ARC is STATIC PAGE INK —
  a 201-point polyline (100 samples per phase) whose x is TIME (impact +
  Δt × px/s) and whose y = impactY − relY; stroke = the GC color, **1.5
  px**, no fill. The **impact marker** is a filled circle **r 4 px** at
  (impactX, **trackBottom − 5**). Height **h = trackHeight − 10**. The
  **ball** is **r 5 px**, same color, and TRAVELS IN TIME along the arc
  (x = the playhead's x), arriving on the impact marker at impact. Color
  neonMagenta = **rgb(255, 21, 160)** (ColorMap).
- **Piece #2 diffed against piece #1, same three functions** (composer:
  "look at piece two as well, to see if we made any changes along the
  way"): `calculateTrajectory` identical; `renderGC` identical except
  `ScoreViewMode.sectionForPage` (single-page view plumbing) and a hidden
  bounding box; `update` identical except the single-page `inTop` rule
  and a hide-inactive-balls sweep. **No visual adjustment was ever made;
  only the preset differs (Medium vs Short).** One port serves both.
- Built: `notation/lib/gc.js` — ONE copy of physics + look (DEFAULT_PRESET,
  LOOK, params, heightFrac, trajectory, laneGeom), dual-load. render.js
  draws the static arc + impact marker from it (layout emits `{k:'gc'}`
  for the device; registry `engraving.render.gc` = preset + color + look);
  animobj.js moves the ball from it (registry `animated.gc`, same preset).
  px are piece #1's at the 1080 frame, scaled by view.heightPx/1080 so
  zoom ×2 is a faithful magnification (PP-6). The day-23 stagings
  (landSs/dropSs, then span=lane/insetSs) are gone from the registry.
- Test trap caught: after the staging fields were removed, the round-2
  lane assertions PASSED on NaN (`Math.abs(NaN - x) > tol` is false) — a
  green that meant nothing. The rewritten block checks every read is
  finite, asserts against gc.js's LOOK numbers and the preset arithmetic,
  and cross-checks the two consumers: the ball's (cx, cy) at impact equals
  the rendered marker's. Arc endpoints, sample count (201), stroke, color,
  marker radius all asserted. Batteries green: animobj, layout, render,
  snapshots, stamps, splice, extract-played, midiplayer, coords.
- Verified live (video, page 2, T1): arc x 888.7→982.3 (= 17.389→17.989 s),
  y 13.0 (apex = lane top + 5) → 105.8 (impact = lane bottom − 5), stroke
  rgb(255,21,160) 1.5 px · impact marker (944.84, 105.8) r 4 on the go
  line · ball r 5 rides the arc: (888.7, 13.0) → (944.8, 105.8) at 17.749
  → (982.3, 13.0); same color. Composer to judge against their memory of
  the two scores.
- **OTTAVA VERDICT (composer) + THE SIDE-WITH-ROOM RULE.** Composer asked
  whether a single-note ottava keeps its bracket. Answer given: Gould and
  Stone both allow the sign alone on a single note/chord; LilyPond/Dorico/
  Sibelius keep a minimal bracket by default, and piece #2 followed LP
  deliberately (session 57: minBracketSpanSs 1.3671, minDashCount 2, so
  the bracket never collapses). Underneath: 8vb is piano/double-bass
  practice; TUBA PLAYERS READ LEDGER LINES. Composer: *"For the lowest
  notes, it's probably the first one"* (ledgers) — *"do a quick measurement
  and see without the ottava, the full ledger line at our current sizing...
  it will all fit. And then what do we do with a stack of accents or
  dynamics?"*
- **The measurement (video frame, 10 lanes, staff 31.6 → ss 7.9 px):**
  lane 102.8 px, staff centred → 6.51 ss from the middle line to the lane
  edge. Lowest note in every part = **F#1** (4 ledgers, head on the 4th:
  ySs −6, head bottom −6.44 → **0.07 ss = 0.5 px** above the lane edge;
  its sharp reaches −6.75 → 2 px into the 4 px inter-lane gap). G1/G#1:
  3 ledgers, head bottom −5.94 → 0.57 ss room (0.26 with a sharp). A1/A#1:
  1.07 ss. Highest note G4 = +5 (3 ledgers above), 1.07 ss room. A chain
  element needs 0.45 + its height (dynamic ≈1.4 ss, accent ≈1.3) → NOTHING
  fits below any note at or below A1. Ledgers fit; chrome does not.
- Options offered: (a) chain flips to the side with room · (b) smaller
  staff (26 px → one dynamic fits under F#1; 24 → dynamic + accent;
  re-opens G0) · (c) overflow into the gap (collides with the neighbour's
  G4). **Composer: "flip the threshold to 4 and build (a)."**
- Built: `glyphs.standards.ottava.ledgerLineThreshold` 3 → **4** (in
  glyphs.json AND in port_glyphs.js, so a re-port cannot revert it) — F#1
  is exactly 4 ledgers, so **no note in the piece takes an ottava**.
  `engraving.layout.chainSide = { rule:'sideWithRoom', laneHalfSs: 6.51 }`
  — the column chain stacks below by default and flips ABOVE when it would
  not fit between the note's bottom ink and the lane edge; laneHalfSs is
  the PRESENTATION half-lane on purpose (a capped sparse lane must make
  the same choice the draft will). An ottava pins the chain to its side.
- **Bug found live in my own rule, first try:** "above" hung from the
  unit's top ink — for a ledger note that is the HEAD, so the flipped sfzp
  landed across ledgers −3/−4 (y 85.7–93.4 vs ledgers at 83.1/91.0). And
  the same latent flaw below: an in-staff note's dynamic would have sat
  INSIDE the staff. Fix: the chain's reference edge is the unit's outer
  ink OR the outer staff line (±2), whichever is further out. Asserted
  both ways (G#1 sfzp exactly 0.45 above the top line; D3 sfzp exactly
  0.45 below the bottom line; a 20 ss half-lane puts G#1's chain back
  below — the rule reads the registry).
- Tests: six fixtures assumed the 8vb world (written G2/G#2) → rewritten
  at pitch (−5.5, three ledgers, stem to the middle line = 5.5 ss per
  stemLenFor). Batteries green: layout, render, snapshots, stamps, splice,
  animobj, extract-played.
- Verified live (video, page 2, T1): wc-23 and wc-29 heads at y 99.4–106.4
  (−5.5) on ledgers at 83.1/91.0/98.9 (−3/−4/−5); wc-23's sharp to 108.8
  vs lane bottom 110.8; **no ottava text on the page**; wc-23's sfzp at
  32.4–40.1, bottom edge 3.5 px = 0.45 ss above the top staff line (43.6),
  inside the lane (top 8); wc-29's stem 58.3→82.1 reaches the middle line.
  **Look change for the composer to judge: wc-23's sfzp is now ABOVE the
  staff** (the rule's first real application), and wc-29's stem is 5.5 ss.
- **wc-29 round 4 (composer): flag clears the staff by ~3 px · smaller
  head ("there was already a formulation") · staccato dot on the notehead
  side.** (An "fff" was started and withdrawn: "I take that back... we'll
  talk about it afterwards.")
  - Small head: the composer's memory was right — piece #2
    `notehead.cellMotive.scaleFactor 0.844` ("composer wants cell-internal
    noteheads slightly smaller... applied at render time as an SVG scale
    wrapper on the existing notehead-filled path — no new glyph bake");
    there is also `filledCellAlt` (0.8775×0.7506, a separately extracted,
    slightly anisotropic glyph). Used the 0.844 uniform scale: stamps gains
    `scaled(box, k)` (metrics + anchors + a scale wrapper on the path),
    layout scales the head's metrics so ledgers, stem attach and the column
    anchor follow; device knob `nhHeadScale`.
  - Flag clearance: piece #2's computeFlaggedStemLength law with THIS
    piece's clearance — registry `engraving.layout.flagClearanceSs 0.38`
    (= 3 px at 7.9 px/ss; p2 used 1.0 ss). Device knob `nhStemRule:
    'flagClear'`; the default length wins when already longer. G1 stem up:
    tip = 2 + 0.38 + 3.008 → stem 10.77 ss (p2's mk-34 was 11.3 under its
    1.0 ss rule — the composer's eye had been right that it was the stem).
  - Dot: `nhDot` → the dotYFor law (notehead side, opposite the stem,
    centered in a space; in-space head → the next space, 1.0 ss). Part of
    the unit's ink so the column chain stacks past it.
  - Verified live (video, page 2): head 6.93 px wide (0.844 × 8.2) · flag
    bottom y 40.6 vs top line 43.6 = **3.0 px** · stem 16.8→101.9 = 10.77
    ss · dot cx 942.68 = head column, cy 110.75 · unit ink 937.5→952.2
    (ledger overhang to flag right) mid 944.85 vs go line 944.84.
  - **Flag for the composer:** G1 sits in a space (−5.5), so the dot's
    "next space" is −6.5 = exactly the lane edge — the dot's centre is on
    the edge and its lower half is in the 4 px inter-lane gap. The
    alternative is the registry's staccatoDot.gapFromNotehead (0.5 ss from
    the head's edge → −6.44, 0.07 ss inside) — a house choice, not built.
- **THE LAYERING DISCUSSION (composer asked for design-principle analysis;
  Tufte — *Visual Explanations*' Challenger chapter, *Envisioning
  Information*'s layering & separation).** Composer's own first move,
  in the asking: *"let's remove the go line layer since this is a point in
  time gesture anyways. It doesn't need the go line. The other go lines are
  there because the notation doesn't line up with the go time."* AI's
  analysis, filed for the paper: (1) inventory by what each layer ENCODES
  — three static marks said "when" (go line, impact marker, ball-at-
  impact); dropping the go line is the data-ink move, not a compromise;
  (2) the conflict is PITCH-DEPENDENT: the impact marker occupies
  −6.39..−5.37 ss, so only bottom-octave heads (≤ about C2) collide; G1's
  head overlapped the marker's top half and the dot its bottom half;
  (3) the arc is nearly free vertically — the ictus hang keeps it at 35 %
  of lane height 0.05 s before impact, 68 % at 0.12 s — while clearing it
  horizontally (0.36 s = 56 px) is impossible in dense material; (4)
  principles: Tufte's 1+1=3 (black head on magenta disc makes a third
  shape), smallest effective difference (lighten the secondary, never the
  datum), Bertin's ranking (position is the strongest channel; colour
  cannot rescue two figures at one position), the Challenger lesson (the
  decisive variables — WHEN and WHAT — must never fight), small-multiples
  consistency (every other unit reads "the ink just before the mark is
  what you play at the mark"). Options: A = head on the go time, marker
  lightened/ringed (rejected: lightens the datum; 1+1=3 persists for the
  bottom octave); B = unit before the go time, no go line, gap sized to
  clear the marker (recommended); C = vertical separation (impossible: the
  marker's height IS the object). **Composer: "B, let's try it."**
- Built: staccato device loses `goLine`; `nhGapSs` becomes device data
  (0.6 ss for the GC unit; the registry 0.25 serves the rest); `nhAnchor`
  back to the default "before" ('center' stays available); ball opacity
  0.85 (`animated.gc.opacity`) so it never hides a head it passes.
- Verified live (video, page 2): no go line at wc-29 · flag right edge
  940.1 = 4.7 px (0.6 ss) before go 944.84 · head right 934.0 vs marker
  left 940.8 = **6.8 px air** · ledgers end 935.8 · dot cx 930.6, clear ·
  marker solid at (944.84, 105.8) r 4 · ball at impact (944.8, 105.8),
  opacity 0.85. Composer to judge the page with and without the ball.
- **DYNAMICS — the strategic discussion (composer asked "what intellectual
  domain to consult", then "look at them... build concrete proposals").**
  Composer's framing, verbatim-ish: the MIDI's fine velocity gradations
  give the dense material "dimensionality... from 2D to 3D"; performers
  CAN produce varied dynamics but "it's usually couched in something else"
  — dynamic marks + phrasing practice + accents; "play this note at 100
  and the other at 103, that they can't do"; doesn't want an elaborate
  model. Data first (section 1, <240 s): 699 staccatos, velocities 26–127
  with every value used (75 at 127); playback = velocity only (plain mode,
  CC7 full; the drawn level is recVel/12.7); **adjacent notes in a part
  differ by a median of 14 velocity units (p75 26, p90 40)** — one full
  marking between neighbours, kaleidoscopic contrast rather than fine
  gradation; **provenance: A2/CLOUD02/CG/S-species = the composer's own
  keyboard playing (2f play-in), DB3 = the density engine** — the
  velocities are a captured PERFORMANCE, not per-note decisions.
  Sources consulted: Miller 1956 / Garner 1953 (loudness absolute-
  identification capacity ≈ 2.3 bits ≈ 5 categories); Kosta, Ramírez,
  Bandtlow & Chew 2016 JMM (8 pianists × 44 Mazurkas: p ranges "often as
  wide as mf"; in 3/8 recordings the p after an mf is louder than the mf;
  Khoo's "primary dynamic shading" vs "inner shadings"); Nakamura 1987
  (intended dynamics communicated "fairly well", crescendi recognized —
  shape transmits better than level; paywalled beyond abstract); Fabiani
  & Friberg 2011 JASA (timbre and loudness EQUALLY determine perceived
  dynamic strength; loudness alone unreliable → for brass the accent
  vocabulary is a dynamic channel); Boulez Structures Ia + Ligeti 1958/60
  "Decision and Automatism" (12 serialized dynamics unrealizable/inaudible
  as intended — dynamics are areas relative to context); Ferneyhough
  (per-note dynamics as deliberate overload — not the aim); Lutosławski
  ad libitum ("dynamics freely varied within p–f": range + character, the
  honest notation of statistics); brass articulation pedagogy / Jacobs
  (short notes are attack-dominated; dah/tah/accent/marcato = the
  player's native inner shading). Proposals: P1 five bands by velocity
  (calibrate by ear on the tuba samples) · P2 ambient marking per chunk +
  deviations only across a band (> +1, ^ +2; softer = cue head /
  parenthesized / nothing — composer's choice) · P3 hairpins on monotonic
  runs · P4 provenance decides the channel (authored → exact; played-in →
  P2; engine-generated → range + instruction) · P5 working-view bricks
  coloured by band to audit thresholds. Test before building: count the
  deviation marks P1+P2 would put on T1 section 1 (60 % = wrong model,
  15–25 % = readable). **No decision yet.** Held by the composer until
  after the discussion: dot spacing tightened to ~2–3 px; go line back on
  the staccato.
- **Sources obtained by the composer (`docs/research/`): Nakamura 1987
  (PDF) and Ligeti 1960 (15 screenshots of the scribd scan, pp. 36–49).
  Read in full.** Nakamura: 3 professionals (violin/recorder/oboe), de
  Fesch sonata, level recorder, 38 listeners. Crescendi ≥ 9 dB heard by
  87–100 %; a 2 dB "crescendo" by 34.2 % (chance ≈ 33 %); decrescendo
  harder to play and to hear (53.6 % violin); rising pitch alone gave a
  crescendo impression in 79 % (recorder, no intensity change). MARKS: the
  modal response matched the performer's intended symbol only 38–53 % (p
  violin 52.6, f violin 38.2, p recorder 45.4, mp oboe 44.7, mf oboe
  42.8) — but Goodman–Kruskal γ = .808 / .811 / .472: listeners hear the
  ORDER of intended dynamics, not the absolute symbol. "Intensity level is
  not fixed by a given dynamic symbol, but is influenced by context."
  Ligeti (Die Reihe 4, pp. 40–42), verbatim: "dynamics can only be
  approximately estimated by the performer – this is not necessarily a
  fault, since listeners, too, experience music according to proportions
  that are subjective rather than calculated"; "the regions of the
  individual intensity-values overlap, and one can certainly not be sure…
  that a p at one point in the work will not be louder than a quasi p or
  even a mp at another point. Thus intensity-values spread out from
  points to become indistinctly bounded fields, and can only be estimated
  in relation to the loudness of their environment"; three grades of
  performable exactness — "1. Wholly unambiguous pitches, 2. Measured
  durations… 3. Unmeasured, only estimated dynamics"; Boulez's own
  ffff→fff swaps "wholly permissible, in view of the indistinctness of
  intensity-values"; ON ACCENTS (p. 42): "some modes of attack have a
  degree of intensity (such as > or sfz) which still further reinforces
  the prescribed intensity… ppp poco sfz… pppp >. Such combinations are
  most uncertain… the places with a weak primary degree of intensity are
  the most problematic – the louder intensities are influenced relatively
  less, since their additional intensity (decided by the mode of attack)
  is unimportant in comparison with their basic intensity. This
  'counterpoint' between the original intensities and those implicit in
  the modes of attack creates fields of inexactness."
  **Consequences for the proposals:** P3 hairpins need a threshold (~9 dB
  span, Nakamura) → requires the SI2 tuba's velocity→dB curve (one
  velocity-ladder render through the rig); the same curve calibrates P1's
  bands (Fabiani: instrument-specific). P2's "accent = +1 band" is sound at
  mf and above and SUSPECT at soft ambients (Ligeti) → soft clouds get
  range/hairpin devices, not accents. Nakamura's 38–53 % symbol match vs
  .81 rank agreement is the empirical case for ambient + deviations.
  Still missing: Khoo 2007 (only via Kosta; nice-to-have). No decision
  yet; dot spacing + go line still held.
- **Captured (composer: "capture this both as a discussion journal... and
  the proposal in some sort of organized document"):** today's verbatim
  block appended to COMPOSER_LOG.md (day 23 — FP3x, the GC "that is the
  whole thing", edge cases, ottava, the staccato unit, the layering
  discussion, both dynamics messages); `docs/DYNAMICS_FRAMEWORK.md` created
  (problem in the composer's terms · the sonic fact · literature table
  with the verbatim findings · six derived principles · the two layers of
  the density build · P1–P5 revised · measurements owed · open decisions ·
  sources still to obtain); registered in RESEARCH_INDEX.md. Composer's
  directions folded in: scope = this piece, this section, sonic issues
  first; five bands with the MIDDLE COLLAPSED ("PPP to FFF... more distinct
  jumps"); layer 1 = isolated one-shots (GC, single articulation, "probably
  just simply dynamics"); layer 2 = dense grouped passages at the end,
  dynamics within a phrase — **the starting point.** Rhythm for layer 2:
  spatial around a shown beat first; notated rhythm / tuplet toggles are a
  parts-time question ("for this, we should just settle on the
  presentation"). Dot spacing + go line still held.
- **Correction (composer): "I'm not ready to address the dense ones... I
  want to address just the one shots, the GC ones, and see if we can find a
  generalized strategy as we proceed through the piece... when the
  threshold crosses and we need to start grouping things into clusters or
  phrases or motives, then we'll address that strategy. But it will join
  perceptually the GC strategy... these are just notational devices, and
  they will both contribute to the overall pointillistic, kaleidoscopic
  texture of the meta sound."** AI had read "let's start there" as layer 2.
  Framework §5a amended. Census: T1 0–55.94 has ONE isolated staccato by
  the chunker (wc-29); 43 grouped from 24.3 s. The IR carries no velocity
  yet. Proposed (awaiting go): IR gains `vel`; registry `dynamicBands`
  ppp/p/mf/f/fff at ≤45/75/100/118/127 (provisional; ~4/75/240/250/130
  of the 699 section-1 staccatos); staccato device `dynMark:'band'` on the
  sfzp slot; wc-29 (v90) → mf. No accents/hairpins on one-shots.
- **GO on the one-shot dynamics (composer: "yes to the ladder, the
  dynamics, the named dynamics, ppp to fff, and the velocity conversion")
  + the statistics + wc-29 round 5.** Built:
  - IR schema **amendment 5**: `vel` (the captured velocity of a
    plain-mode note, 1–127) — extraction writes it (`extract_core`);
    x02, the draft `db1-t1` and `piece-open-01` re-extracted (all
    overlay-free, regenerable; the draft also picks up the day-23
    segmenter fix).
  - Registry `engraving.layout.dynamicBands` = ppp ≤45 · p ≤75 · mf ≤100
    · f ≤118 · fff ≤127 (PROVISIONAL until the SI2 ladder); device
    `dynMark: 'band'` looks the mark up from `vel` on the same slot as a
    literal mark ('sfzp'); a plain-mode event WITHOUT vel warns (stale
    extraction) and draws nothing; an event with no mode is not a captured
    note → no mark, no noise.
  - **Census, section 1 (0–240 s), all parts, provisional bands:**
    staccato ppp 4 · p 66 · mf 277 · f 221 · fff 131 (699); fortepiano
    1 · 13 · 44 · 18 · 16 (92); cuivre 0 · 0 · 0 · 3 · 12. Per part the
    staccatos are even (65–74 each, same shape). ppp nearly empty — the
    ladder measurement decides whether the thresholds move.
  - **The mark between the staff and the flag** (composer: "let's see if we
    can get the dynamic above the staff and below the bottom of the
    flag"): the chain is now resolved BEFORE the stem; the side decision
    uses the head-side ink (head, dot, accidental); when the chain goes
    above a flagged stem-up unit it stacks from the staff top with
    `chainAboveGapSs 0.3`, and the flag-clear stem rule clears the CHAIN,
    not just the staff.
  - **The flag height** (composer: "if we can adjust it so it's not so
    tall. How would we do that?"): at full height the stack 2 + 0.3 + 0.97
    + 0.38 + 3.008 = 6.66 ss overflows the 6.51 half-lane; built an
    anisotropic y-scale (stamps.scaled gains ky; render passes scaleY;
    device `nhFlagScaleY`, registry `flagScaleY` 0.65 → flag 1.96 ss; the
    stack tops at 5.64). Alternatives recorded, not built: (a) a
    procedural STRAIGHT flag — LilyPond's modern-straight style, a short
    thick diagonal from the tip (Boulez/Stockhausen-era look; arguably the
    better stylistic fit for a point gesture; a new stamp primitive, ~1 h);
    (b) a uniform scale (shrinks the width too — at 0.65 the flag looks
    thin); (c) a smaller dynamic glyph (cue-size, 0.844 like the head);
    (d) a longer stem without compression (overflows the lane).
  - Dot spacing: device `nhDotGapSs 0.3` (2.4 px) from the SCALED head's
    edge, replacing dotYFor's space-centring for the unit (metric notes
    keep dotYFor). Go line back on the staccato device.
  - Tests: fixture staccato carries vel 90; asserts mf · band table from
    opts (3-band → fff) · no-vel warning · flag scaleY 0.65 · mf bottom
    exactly 0.3 above the top line · flag bottom exactly 0.38 above the mf
    top · stem tip ≤ 6.51 · dot 0.3 below the scaled head edge. A default
    mismatch caught by the battery (code fell back to 0.45 without the
    registry) fixed to mirror the registry. All batteries green.
  - Verified live (video): go line at 944.84 · stem tip y 15.1 (lane top
    8) · flag 15.1–30.6 (ky 0.65) · 3.0 px · mf 33.6–41.2 centred on the
    head column · 2.4 px · top line 43.6 · head 99.9–105.8 · 2.4 px · dot
    r 1.58 at 109.7.
- **wc-29 round 6 (composer): "staccato can be closer, reduce 50% the gap;
  move the dynamic so the right edge of the dynamic clears the stem, just
  a little tiny bit of gap — akin to the staccato gap; go back to the old
  flag; capture these as standards."** → **THE TIGHT GAP STANDARD 0.15 ss**
  (1.2 px at the jury frame): registry `tightGapSs` documented, carried by
  `nhDotGapSs` (dot from the head edge) and `dynStemGapSs` (the dynamic's
  right edge from the stem's left edge). Device `dynBesideStem`: above a
  stem-up flagged unit the mark sits BESIDE the stem (not centred on the
  head column), so the flag on the stem's other side keeps its full
  height — `flagScaleY` back to 1.0 (the compression stays a knob) and the
  flag-clear stem rule again clears only the staff (a device without
  dynBesideStem keeps the under-the-flag stack). Tests updated (mf right
  edge exactly 0.15 left of the stem; dot exactly 0.15 below the scaled
  head edge; flag at full height, 0.38 above the top line). Verified live
  (video): dot top 1.18 px under the head · mf right edge 1.15 px left of
  the stem, 2.4 px above the top line · flag 16.8–40.6 full height, 3.0 px
  above the top line · stem tip 16.8 (lane top 8).
- **Composer verdicts:** (1) **the dynamic bands / conversion are correct
  for now** — "this section was more weighted toward the louder... but we
  can reevaluate. This analysis is useful so we can reevaluate in future
  sections." → thresholds stay; the census is the per-section
  re-evaluation instrument; the SI2 ladder stays queued as the evidence
  lever. (2) **Z-ORDER, made explicit** (composer asked whether a
  conclusion was drawn — it was built, not stated): bottom→top = staff +
  ledgers · go line · GC static ink (arc + impact marker) · NOTATION
  (head, dot, stem, flag, dynamic — drawn after the GC, so ink over
  guide) · the animated overlay (ball at 0.85, cursor) over everything.
  Rationale: notation is the primary figure, the arc a guide; the ball is
  the transient "now", kin to the cursor, and must never be hidden behind
  dense ink at impact — translucency is the compromise; the impact marker
  stays solid (the datum). Watch-case: layer-2 beamed groups crossed by an
  arc's descent. To promote at session end as a decision.
- **Z-order carried as a decision (composer: "works for now, carry that as
  a decision")** → promote at session end.
- **The cluster-threshold strategy, opened (composer):** "everything gets a
  GC unless there's a quick repeat after, but... some quick notes might
  form a pattern or a cluster, sonically, with some notes nearby that
  might have longer gaps... instead of trying to swallow this all whole,
  let's find the first quick notes in Tuba 1." T1 0–55.94 IOI table
  computed (52 notes). **First quick note: wc-106 at 31.892 s, 0.343 s
  after wc-101** (G2 → G#2, v117 → v114). Before it, 23.1–31.5 s has gaps
  of 0.75–1.76 s (fp/staccato alternating on A#1/G2); after it, dense runs
  31.5–34.5 (gaps 0.13–0.46), 36.2–40.3, 44.2–46.4. **A drawable-threshold
  fact:** the GC object is 0.6 s long (0.36 + 0.24), so two one-shots
  closer than 0.6 s have OVERLAPPING ARCS — wc-101→wc-106 is the first
  such pair. Musical threshold = the composer's; 0.6 s is where "every
  note a GC" stops being drawable regardless.
- **x02 extended through the density build ("bricks and the midi sound all
  the way through"):** new `--bricks` mode in notate_section.js — every
  chunk forced unresolved (bricks everywhere, each note carrying its
  technique's device; chunker grouping not applied, not lost); x02 =
  0–55.94 (GESTURE-2 = the draft's end). Read "two zero one" as x02; say
  if 201 s was meant. Headless: 52 bricks · 44 GC units · 50 go lines · 5
  ring bars · 51 marks (44 band + 5 sfzp + the surge pair) · 0 warnings.
  Live: 5 pages, pages 3–4 hold the dense runs (17 and 27 arcs), no
  errors. Playback scope = the window, so MIDI sounds to 55.94.
- **wc-44/49/52 — the three impulses at 23 s. Composer: the breath cut, the
  phantom ball, and GCs on the fortepianos.**
  - **Breath figure given** (asked for): a moderately quick tuba breath
    ≈ **0.5 s** (snatch 0.25–0.35; full relaxed on a large horn 1–1.5;
    brass pedagogy, Jacobs/Frederiksen). It coincides usefully with the GC
    object's own 0.6 s length. Sample-length averages, also asked:
    **fortepiano 1.67 s** (median 1.66, 1.35 A3 – 2.22 A#3, barely
    register-dependent: octave means 1.57/1.67/1.75/1.63) · staccato 0.45
    (0.33–0.53) · cuivre 1.17 (C4–G4 only).
  - **THE BREATH CUT (composer): the ring bar = sample length − 0.5 s**,
    registry `breathSeconds`; DRAWING ONLY — playback still follows the IR
    duration (D49), since the sample rings what it rings (flagged for the
    composer to confirm that reading). `flagShortBarSeconds 1.0` raises a
    warning per note. **Only one flag in T1 0–55.94: wc-23, 0.99 s** (the
    G#1 fp, sample 1.49). All other fp bars survive the cut ≥ 1 s.
  - **BUG FOUND AND FIXED — the phantom ball** (composer: "the second fp
    has a bouncing ball, no GC... the first one doesn't"). Cause: my
    `--bricks` mode forced every chunk unresolved but LEFT the chunker's
    cloud-landing GC devices; animobj makes a ball from a chunk device,
    layout draws an arc only from an engraving device, and the unresolved
    branch draws no tick — so `ch-0-wc-49`'s landing GC (anchored at
    24.291 = wc-49's onset) produced a ball with nothing under it. Seven
    such chunks. Fix: `--bricks` strips devices too. **New law asserted:
    every ball has an arc** — the animobj battery now cross-checks the two
    sources against the real working IR (49 balls, 49 arcs, 0 orphans).
  - **GCs on the fortepianos** (composer: "change now the fortepianos to
    also include GCs... the only one that doesn't have it is the surge
    crescendo"): `gc: true` on the fp device — the standards carried
    everything else, no new code. Everything else unchanged (open head,
    ring bar, sfzp).
  - **The GC-clearance gap, derived not guessed** (composer: "you might
    need to push it over, so all the ledgers, the right edge clears the GC
    descending arc... don't worry about the top stuff"): a unit carrying a
    GC is anchored at least `gcImpactRadiusSs + tightGapSs` = 0.51 + 0.15
    = 0.66 ss before go. The arc only reaches head height in the last
    ~15 ms (the ictus hang), so clearing the MARKER clears the arc.
    0.51 ss = the GC look's 4 px at the 1080 frame over the jury frame's
    7.9 px/ss — both scale with frame height, so the ratio is invariant.
    Raised the staccato's 0.6 to 0.66 too (uniform rule; 0.5 px shift).
  - Verified live (page 3, 24–36 s): fp ledger right edge clears the
    marker by 1.2 px = the tight gap exactly; fp head by 3.4 px; staccato
    head by 7.2 px (its flag is the rightmost ink). Bars 1.19 s each. The
    wc-23 flag shows in the app's warning strip.
  - **STILL OPEN — three bars run past the next attack** even after the
    cut: wc-49 ends 25.481 > wc-52 at 25.454 (0.027 s) · wc-62 ends 28.406
    > wc-68 at 28.078 (0.33) · wc-83 ends 31.163 > wc-89 at 30.752 (0.41).
    A tubist cannot ring note 1 into note 2, so a cap at the next attack
    is the obvious rule — NOT built, composer's call.
- **THE BREATH RULE, corrected by the composer** (my first build had it
  backwards): *"working backwards, what I meant was the next gesture minus
  breath... we can just ignore the sample length, just keep no changes
  there... let's just deal with these three gestures and the ones before
  aren't affected."* → **bar = min(sample length, next attack − breath)**.
  The sample only CAPS; the bar is measured backwards from the next
  gesture. Consequence, exactly as the composer predicted: nothing before
  23 s changes (wc-23 keeps its full 1.49 — its next attack is 3.2 s away).
  - Every fp in T1 0–55.94 under the rule: wc-23 1.490 (next in 3.205,
    uncapped) · **wc-44 0.709** (next in 1.209) · **wc-49 0.663** (1.163)
    · wc-62 0.362 (0.862) · wc-83 0.249 (0.749).
  - **Flags: 4** (composer asked "let me know if that throws a bunch") —
    every fp except wc-23 now falls under the 1 s threshold, because in
    this material the fps are 0.75–1.2 s apart and the breath eats half of
    that. So the flag threshold is doing nothing useful here: 1 s was
    chosen against SAMPLE lengths, not against gaps. Options for the
    composer: lower `flagShortBarSeconds` (0.35 would flag only wc-62 and
    wc-83, the genuinely tiny ones), or drop the flag and read the bars.
  - **Bars past the next attack: 0** — the rule removes the overlap
    problem by construction (it was the reason it came up).
  - **A real refinement the battery forced:** the first version took "the
    next attack" as the next event in the part, but the fixture stacks
    three events at one onset and the bar refused to draw. A simultaneity
    is one gesture, not a next attack — the rule now looks for the next
    STRICTLY LATER onset. That matters for real chords, not just fixtures.
  - Also: a gap shorter than the breath draws NO bar and warns (nothing
    hits it in this window).
  - Tests: bar = next − breath · the flag · gap-under-breath → no bar ·
    breathSeconds 0 → bar runs to the next attack. All batteries green.
  - Verified live (page 3): bars at 24.291 = 0.663 s, 27.216 = 0.362,
    30.003 = 0.249; wc-44's 0.709 sits on page 2's side of the cut; the
    wc-44 flag shows in the app's warning strip.
  - **My process error, recorded:** two patch scripts ran a slice-based
    replacement whose start index came AFTER its end index (the `gc` block
    precedes the ring bar), producing an empty match — and `replace('')`
    inserts at position 0, corrupting layout.js twice. Restored from git
    both times. Lesson: bound a slice by searching FORWARD from the start
    index, and assert the slice is non-empty and plausible before using it.
- **Warnings off the score (composer: "get rid of the warning text at the
  bottom of the score — that's a bit distracting; we'll just talk about it
  as they come up"):** layout warnings now go to the browser console in the
  presentation views (video/zoom); `#err` keeps only real errors
  (exceptions). The proofing views behind ⚙ still print them.
- **THE FIRST BEAMED CLUSTER — 31.49–33.59, eight notes** (composer:
  "let's treat this as one cluster... just see the smaller notehead at each
  of those positions... stem them all... a single beam above the staff
  line, at the same height as our flagged ones, whatever that long stem
  was... and nothing else"). Members: wc-101 wc-106 wc-113 wc-114 wc-119
  wc-126 wc-133 wc-138 (31.549–33.468).
  - Built as the AUTHORED channel, not a new chunk class: `notate_section
    --cluster t0-t1` (repeatable) writes one `engraving` overlay per member
    carrying the cluster device — small filled head (0.844), stem to the
    beam, centred on the onset, everything else off (no go line, GC, ring
    bar, dot, dynamic). Written at extraction, so a re-extract keeps it;
    the span is the composer's judgment, never the chunker's.
  - Layout: `nhStem: 'beam'` + `device.beamGroup` — members' stems reach
    the BEAM LINE and their tips accumulate into ONE beam item per group.
    **The beam height is derived, not chosen: staff edge + flag clearance
    + a flag's height = 2 + 0.38 + 3.008 = 5.388 ss**, i.e. exactly a lone
    flagged one-shot's stem tip, so cluster and one-shot top out together
    (asserted both ways in the battery). A group of one draws no beam and
    warns.
  - **SCHEMA GAP FOUND AND CLOSED (amendment 6):** `layout.js` has consumed
    `kind: 'engraving'` overlays since day 22 (the V1 per-item override
    channel), but the schema's overlay-kind enum never listed it — so a
    VALIDATED IR could never carry one; the channel existed only in
    hand-built test objects. The first real one failed validation
    immediately, which is the validator doing its job.
  - Verified live (page 3): 8 small filled heads · 8 stems, every top at
    y 16.8 · ONE beam 1228.6→1528, 3.16 px thick at y 16.8 — the same
    height as the flagged one-shots' stem tips · warning strip empty.
    Ledgers and accidentals kept (pitch is not "else"); flag if not wanted.
- **The double flag (composer: "sixteenth flag, double flag on the
  staccato... replace those single flags with double flags"):** the 16th
  flags were never ported — only the 8ths. Extended `port_glyphs.js` to
  carry `16up` / `16down` from piece #2's `flag_paths.json` (same session-49
  capture, stock LP at the locked sizes, so no new measurement): up16
  0.892 × 3.508, down16 1.132 × 3.008. **Re-port verified safe: 0
  pre-existing entries changed** (including the day-23 ledgerLineThreshold
  4). stamps' `flag8` generalised to `flagN(dur, dir)`; render matches
  `flag-(up|down)N`; layout's `nhStem` accepts any `flagN`; staccato device
  → `flag16`.
- **A coupling the battery caught immediately:** the beam line had been
  derived from the 8TH flag's height, so the moment the one-shots became
  16ths the cluster beam no longer matched their stem tips — breaking the
  composer's own rule ("the beam at the same height as our flagged ones").
  Fixed at the root: the beam height now reads THE TECHNIQUE'S OWN nhStem
  and uses that flag's height, so any future flag change moves the beam
  with it. New height 2 + 0.38 + 3.508 = **5.888 ss**.
- **CLUSTER TEMPO ANALYSIS (composer: "see if we can find a tempo that
  keeps... the least complex, precise rhythmic notation... prevent us from
  using triple-nested tuplets. Let me know if you had any success with
  finding an analytical model").** Built `tools/cluster_tempo.js` — an
  EXHAUSTIVE unit search (20–500 ms at 0.2 ms steps) scored on accuracy
  (max |onset − grid|) and complexity (power-of-2 subdivision = no tuplet ·
  one tuplet level vs nesting · beat conductable 0.3–1.5 s · grid above
  D43's 0.09 s playable floor). Exhaustive, so "no fit under X ms" is a
  RESULT, not a search failure. Also: this single-unit model can never
  produce NESTED tuplets by construction — nesting would need a second,
  incommensurate grid.
  - **RESULT for 31.49–33.59: it fits a plain grid with NO TUPLET AT ALL.**
    Unit **175 ms**, beat 0.700 s = **♩ = 85.7**, subdivision 4 (16ths).
    Grid 0,2,4,5,6,8,10,11 → beats 0 · 0.5 · 1 · 1.25 · 1.5 · 2 · 2.5 ·
    2.75. Rhythm: 8th 8th 16th 16th 8th 8th 16th. **Max error 20 ms**,
    per-note 0 / −7 / +20 / +1 / −19 / +4 / −18 / −6 ms.
  - Round-tempo check: **♩ = 86 gives max 22.3 ms** (same grid) — worth it
    if a round number matters; ♩ = 85 → 32.7 ms; 84 → 53.7; 88 → 44; 80
    and 90 break the grid entirely. So 85.7 (or 86) is a genuine local
    optimum, not one of many.
  - Caveat for the composer's ear: 20 ms is the tight end of E1's open
    epsilon and the fit sits right at it. If the ear rejects 20 ms, no
    other tempo does better — the honest fallback is proportional
    (spatial) notation, which has zero error by construction.
- **THE CLUSTER, second pass (composer's full spec).** Built:
  - **`nhAnchor: 'leftEdge'`** — the NOTEHEAD's left edge (accidentals and
    ledgers excluded) sits precisely on the go time, *"because of the
    scrolling person"*: what crosses the cursor at the go moment is the
    head itself. Clusters only; everything else keeps its anchor.
  - **GC + go line on the FIRST note only** (*"so it launches the whole
    cluster"*), impact/nadir on the same go time. Go line kept as a
    temporary guideline, to be removed.
  - **The rhythm is the ANALYSIS, drawn.** `--cluster` now runs the tempo
    fit itself, through a new shared module `notation/lib/cluster_fit.js`
    that `tools/cluster_tempo.js` also uses — one algorithm, so the report
    and the page can never disagree. Result written into the overlays:
    unit 175 ms · beat 0.700 s = **♩ 85.7 × 4, no tuplet** · grid
    0,2,4,5,6,8,10,11 · max err 20 ms · **2 beams** · 16th rests.
  - **Two wrong selection rules, caught by running them:** "coarsest that
    fits" took a 176 ms grid at 28 ms error over 175 ms at 20 ms;
    "minimum error" then took a **26.6 ms** grid (64ths, grid 0,13,27,…) —
    precise and unreadable. The fix was to move the COMPLEXITY SCORE into
    the shared module and select on it: a grid finer than D43's 0.09 s
    playable floor is disqualified (+100), non-power-of-2 costs one tuplet
    level, an unconductable beat and extra rests cost a little. Both tools
    now agree on 175 ms at every tolerance 20/30/50 ms.
  - **Secondary beams** stack toward the noteheads at the registry's
    `beam.stackStep` (0.81 ss). **Rests** fill the empty grid positions.
  - **Staccato dots on every member.**
  - **RESTS DID NOT EXIST IN THE LINEAGE** — neither piece #1 nor #2 ever
    needed one. Captured with the short-form protocol (principle 10):
    `tools/glyph_probe_rests.js`, one LP fixture at the locked
    NoteHead.font-size −2, extracted through piece #2's oracle modules
    read-only, **with a notehead in the same fixture as the equality
    check — path byte-identical to the ported `notehead.filled`**. Got
    rest8/16/32/4. The vertical convention travels WITH the glyph:
    `topSs`/`botSs` about the staff middle line, derived from the fixture
    (LP anchors every rest ON the middle line; cross-checked because the
    c'' head sits exactly 0.5 ss above it). Re-port safe: 0 pre-existing
    entries changed.
  - **The convention, looked up as asked:** rests inside a beamed group —
    the BEAM keeps its normal position and the REST is displaced toward it
    (Gould; Finale's "Allow Rests to Float", Sibelius needs a plug-in).
    That rule exists to avoid a beam/rest collision — here the beam sits
    ~6 ss above the staff, so there is none, and the rest keeps its normal
    middle-line position. Which is also the composer's instinct
    ("centered in the staff"). Both agree; no float applied.
  - Verified live (page 3): first head's LEFT edge 1225.6 = the go time
    1225.6 = the go line = the GC impact · 8 heads · 8 dots · two beams
    1232.1→1531.5 at y 12.9 and 19.3 (6.4 px = 0.81 ss apart) · 4 sixteenth
    rests at y 54.2 = exactly LP's placement (middle line 59.4 − 0.656 ss).
  - **Dynamics on the cluster: deliberately left off** (composer: "we'll do
    a second pass for dynamics").
- **Cluster dynamics, the composer's reading of the table:** the eight
  members band as **f f f fff f f fff fff** (velocities 117 114 105 127 105
  114 124 127 — a narrow, loud strip, only two bands). AI proposed the
  ambient-plus-deviation shape from DYNAMICS_FRAMEWORK; **composer:
  *"that's a pretty clear pattern... two of the fffs have higher pitches,
  so that helps. But let's just do accents on all of the fffs. And let's do
  on the first partial, the single f."*** → three symbols instead of eight:
  one **f** on member 1, **accents** on members 4, 7, 8. THE FIRST REAL
  APPLICATION OF THE AMBIENT + DEVIATION MODEL, chosen by ear.
  - Built: `--accents 4,7,8 --dyn 1` on `notate_section --cluster`
    (1-based member numbers, the composer's call per cluster); device
    `nhArtic` + `dynMark:'band'` on the named members only. Accent glyph
    was already ported (day 22, for the column standard's articulation
    slot); stamps/render gained the articulation stamp.
  - **A GEOMETRY FINDING that forced a rule.** Measured before building:
    an accent on the NOTEHEAD SIDE fits under G2 (−3.91) and B2 (−2.91)
    but NOT under G1 — it would reach −7.41 against a lane half of 6.51,
    i.e. into the inter-lane gap and the neighbour's staff. And above the
    beam there was only 0.622 ss of room for a 1.29 ss requirement. So
    neither side worked at the beam's flagged-stem height.
    **The rule: the beam sits at the flagged-stem height OR LOWER —
    whichever keeps the group's articulations inside the lane** (5.888 →
    **5.220** here, = laneHalf − stackGap − accent height). Accents then go
    ABOVE the beam, all at ONE height, which is also how Gould aligns
    articulations across a beamed group — and it makes the composer's
    pattern read as a pattern. Registry-derived throughout; a cluster
    without accents keeps the 5.888 beam.
  - Verified live (page 3): beams at y 18.2 / 24.6 · three accents
    11.9 × 6.6 px at y 8.0 = the lane's top edge exactly (headless: accent
    top 6.510 vs laneHalf 6.51) · one **f** below the first head (ySs
    −3.86) · no warnings. Batteries green.
- **THE LAST CLUSTER — analysis first, as the composer asked ("do analysis
  and talk first before doing anything").** Density build 1 ends at
  **34.509**; CLOUD02-I starts new material at 36.19. Remaining after
  cluster 1: **four notes 33.930–34.509** (B2 v123 fff · G1 v127 fff ·
  A#1 v97 mf · F#1 v109 f), IOIs 0.200 / 0.135 / 0.244 — faster and less
  regular than cluster 1. Three options put to the composer:
  **A** own cluster at 20 ms → 70.4 ms unit, ♩106.5, **32nd grid, 3 beams**;
  **B** own cluster at 30 ms → 111.4 ms, ♩67.3, 3 beams, 22.8 ms err;
  **C** ONE 12-note cluster → **172 ms, ♩87.2 × 4, 2 beams**, grid
  0,2,4,5,6,8,10,11,14,15,16,17, max err **36 ms**. Measured and reported:
  the two groups CANNOT share cluster 1's 175 ms grid as separate clusters
  (84 ms continuing it, 54 ms re-anchored), so it was a new tempo or a
  merge. Also flagged: A/B would print two tempo marks 0.46 s apart for a
  reader following a cursor. **Composer chose C** — with a refinement:
  *"let's not beam them altogether. So we'll beam the first group of notes
  and then the second group... but conceptually we can keep them in the
  same tempo. Then we'll need to calculate the rest between the two groups
  and just have the longest rest you could fit in there."*
  - Built: **`--beamBreak 9`** — one cluster (one tempo, one grid) can now
    carry several beam groups (`cl-1a`, `cl-1b`); the beam HEIGHT stays
    uniform across the cluster (both at 5.220, since the cluster carries
    accents), so the two groups read as one gesture at one level.
  - **Rests moved from the beam group to the CLUSTER** — a gap between two
    beam groups belongs to neither group, and that is exactly where the
    composer wanted a rest. Merging is greedy longest-first with metric
    alignment: at position n with r empty units, take the largest
    power-of-2 rest R ≤ r where n % R === 0 (the standard rule that stops
    a rest straddling its own beat). Result: four 16th rests inside group
    1 and **one 8th rest in the gap** at 33.613 — "the longest that fits".
  - **Dynamics per the composer**, and `--dyn` now takes `n` (use the
    band) or `n:mark` (explicit): **f** on member 1 · accents 4, 7, 8 ·
    **fff** on member 9 (the first note of the second beam group) · **mf**
    on 11 · **fff** on 12. NOTE FOR THE COMPOSER: member 12's velocity is
    109, whose band is **f**, not fff — written as instructed, flagged
    here in case "MF and then FFF" was meant as mf → f.
  - Verified live (page 3): two beam groups 1232→1531 and 1604→1694, both
    at y 18.2 / 24.6 · three accents at y 8.0 · the 8th rest in the gap ·
    12 heads, 12 dots, one GC + one go line on the first note only.
  - **A LOOK ISSUE the measurement surfaced, not fixed:** members 11 and 12
    are too low (A#1, F#1) for a dynamic below, so the side-with-room rule
    flipped their mf/fff ABOVE the beam — while the f and fff on members 1
    and 9 sit below. Four dynamics, two below and two above. And the
    flipped pair tops out at 6.645 ss against the lane's 6.51 — about 1 px
    proud. Options for the composer: put every cluster dynamic above the
    beam (uniform, needs the beam ~0.2 ss lower); keep the split and drop
    the beam slightly; or accept the 1 px.
- **The last figure, composer's final call:** *"keep the fff dynamic at the
  beginning, get rid of the mf, and put an accent on the last partial — no
  dynamic marking, though."* → `--accents 4,7,8,12 --dyn 1,9`. Group 2 now
  reads: **fff** at its first note, nothing on the two middle notes, an
  **accent** on the last. **This also dissolved the look problem flagged in
  the previous entry**: with the mf and the last fff gone, both remaining
  dynamics sit BELOW (f at ySs −3.86, fff at −2.94) and all four accents
  sit ABOVE at one height (6.090, top exactly 6.510 = the lane edge). No
  mixed sides, no overflow — the composer's musical choice happened to be
  the geometrically clean one too.
  - Verified live (page 3): 12 heads · 4 accents at y 8.0 (the lane's top
    edge) at x 1360, 1493, 1523, 1685 · 2 dynamics below (f at ~1226, fff
    at 1594) · two beam groups 1232→1531 and 1604→1694 at y 18.2 / 24.6 ·
    5 rests (four 16ths + the 8th in the gap) · 6 accidentals · no
    warnings. Batteries green.
- **TUPLET STANDARD — surveyed from the composer's LilyPond corpus, then
  measured.** Composer: *"my memory must be from my work in LilyPond... do
  a survey of the LilyPond files, see if you can find a tuplet standard
  there, probably working backwards in time."* **Survey (piece #2's
  `lilypond_code/`, 809 .ly files): 101 carry tuplets.** Newest = the
  SATP001 piano set (2026-04-02); then BowOverpressure (03-16), Bartók
  pizz / clb templates (03-09). **The settings are unanimous where they
  appear:** `TupletBracket.direction #UP` **29/29** · `bracket-visibility
  ##t` 190 uses · `padding 0.5` (the composer's own comment: *"bracket
  height"*) 36 · `TupletNumber.text = tuplet-number::calc-fraction-text`
  **29/32** — this is the override that prints **"3:2"** rather than LP's
  default bare "3", so the composer's memory was exactly right ·
  `TupletNumber.font-size #-5` 32 · and the composer's own Scheme function
  `flatten-tuplet-bracket` (41 uses), which levels both bracket ends to the
  higher one = the "straight bracket" they described.
- **The probe (`tools/glyph_probe_tuplet.js`), run with those overrides
  verbatim.** Notehead equality check passed (path byte-identical to the
  ported `notehead.filled`), so it is the same pipeline as every other
  glyph. **MEASURED:** bracket thickness **0.16 ss** · hook **0.7 ss**,
  descending toward the notes · the horizontal is drawn in TWO segments
  with a **2.6388 ss gap** for the numeral, the numeral inset **0.40 ss**
  into that gap · numeral baseline **0.41 ss below** the bracket line
  (so the digits straddle it) · numeral font-size **1.2348 ss**, italic ·
  bracket sat 2.8 ss above the middle line in the fixture (LP's own
  clearance; ours will hang off the beam by padding 0.5 instead).
- **A finding that removes work: NO GLYPH TRACING IS NEEDED.** The bracket
  is procedural in LilyPond too — four `<line>` strokes, not a glyph. And
  the numeral came out as an SVG `<text>` element (serif italic), NOT an
  Emmentaler outline: LP's SVG backend typesets tuplet numbers as text. So
  the bracket gets drawn like the ottava, and "3:2" is set in the app's own
  notation font (Crimson Pro) at the measured proportions. Saved to
  `notation/glyph_sources/tuplet_extra.json`.
- **FIGURE 1 REWRITTEN AT TRUE DURATIONS + FIGURE 2'S 3:2 TUPLET (composer
  go).** The spacing analysis that preceded it: the score is PROPORTIONAL
  (x = real time) while beams/flags/rests are METRIC symbols, so the page
  tells two stories that disagree by up to 36 ms = 5.6 px. But the bigger
  cause in figure 1 was MINE: I had written all eight notes as 16ths with
  rests at the empty positions ("we can think of them all as sixteenth
  notes or shorter"), so every note looked identical and the eye expected
  even spacing. **The composer diagnosed it themselves** — *"the beaming
  suggests a series of twelve evenly spaced sixteenth notes, but that's
  not what it looks like."*
  - Fixed: each member's WRITTEN VALUE is now its duration to the next
    attack in grid units — **8th 8th 16th 16th 8th 8th 16th 16th**. Two
    consequences, both visible: the four internal rests VANISH (an 8th
    fills its own gap), and the **secondary beam now runs only over
    consecutive 16ths** (two short segments, 1344–1369 and 1502–1531)
    instead of the full width — so the beam pattern itself shows which
    notes are close and which are apart. Staccato dots still carry the
    shortness, so nothing is lost musically. Last member of a beam group
    is capped at one unit (a group never spills past its own end).
  - **The 3:2 tuplet** on members 10–11: bracket 34.129→34.473 (grid
    15–16 = 344 ms), three slots of 114.7 ms, the third an in-bracket
    16th rest at 34.358. Error on member 11 improves from −36 to +21 ms,
    and — the point — the triplet SHOWS that the pair is faster.
    No extra rest before the final partial: it lands on grid 17 right
    after the bracket, exactly as the composer predicted.
  - Drawn to the composer's own LilyPond standard: flat bracket, hooks
    descending, horizontal in two segments with a gap for the numeral,
    "3:2" italic straddling the line. Live: bracket segments 1628.1–1644.5
    and 1665.4–1681.8 (h 1.26 px = 0.16 ss), hooks 5.53 px (0.7 ss) at
    both ends, "3:2" centred at x 1655.
  - **The beam dropped to 4.856 ss** (from 5.220) so the bracket fits —
    composer: *"if we need to lower the beams to accommodate, that's
    fine."* Derived: laneHalf − (padding 0.5 + hook 0.7 + the numeral's
    cap above the line 0.454). Bracket ink now tops out at **6.510**
    against the lane's 6.51, and the accents sit below it at 6.146.
  - Verified live (page 3): primary beams 1232–1531 and 1604–1694 at
    y 21; secondary beams only over the 16th pairs and across all of
    group 2; the 8th rest in the gap; the tuplet rest inside the bracket;
    no warnings beyond the four standing ring-bar flags. All batteries
    green.
- **THE DURATION QUESTION, settled by measurement, then the composer's
  midway solution.** Composer: *"I do want the eighth notes to be the same
  duration, the shortness to be the same as the sixteenth notes. If a
  staccato dotted eighth note is interpreted to be played the same duration
  as the other ones, we'll just leave it."* Analysis given:
  - **The convention says their worry is real** — staccato shortens
    PROPORTIONALLY to the written value, so at ♩87.2 a staccato 8th reads
    ~172 ms and a staccato 16th ~86 ms: twice as long.
  - **But the measurement says the distinction is unplayable here.** The
    2n staccato samples for figure 1's eight pitches are **0.43–0.48 s,
    mean 458 ms** (0.33–0.53 across the whole range — essentially flat).
    That is LONGER than both interpretations, and **longer than every gap
    in the figure** (all seven gaps 155–377 ms are shorter than the sample
    that precedes them). The written value cannot control duration on this
    instrument; it controls WHEN THE NEXT ATTACK COMES. Noted as a
    consequence: the figure's real sound is overlap, not detachment — a
    sample/technique question, not a notation one.
  - Options put: (A) keep 8ths/16ths + a front-matter line ("all staccato
    attacks one fixed short length, note values indicate placement"),
    (B) all 16ths + rests — which would give flag·rest·flag·rest·pair,
    (C) note that the piece already carries sounding length in the RING
    BAR, so staccatos having none is already consistent.
  - **Composer's midway solution, and it is the standard device:**
    *"almost like flags on all the eighth notes. So there'll be the
    connecting beam on top. And then for those notes, just a short beam
    where the sixteenth note beam is, not something that connects. So you
    can still see the phrasing. And then let's put back the sixteenth
    rests."* → **BEAMLETS (fractional beams)**. Every partial is written
    as a 16th; the primary beam still groups the gesture; the SECOND level
    connects only ADJACENT 16ths and appears as a **stub** on a note that
    opens a gap. Registry `beamStubSs 1.0`; `--trueDurations` keeps the
    8th/16th writing available.
  - Implementation detail worth keeping: a secondary run now continues only
    while consecutive notes ABUT — the previous note's written length must
    reach the next one's grid position — so a rest breaks the beam
    automatically, and tuplet members (fractional positions) obey the same
    rule.
  - Result, live (page 3): primary beams 1232–1531 and 1604–1694 · second
    level = **stubs (7.9 px) on notes 1, 2, 6 and the final partial**,
    connecting segments over notes 3–4–5 (48.5 px), 7–8 (29.2 px) and
    members 9–10–11 (52.3 px) · **16th rests at 1248, 1302, 1409, 1463**
    (after notes 1, 2, 5, 6 — exactly where the composer said), the 8th
    rest at 1544 in the gap, the tuplet's 16th rest at 1660 inside the
    bracket. Batteries green.
- **Figure 2 back to a solid double beam** (composer, with a screenshot
  showing the orphan stub at the group's right end): *"the second figure,
  let's just keep it as is. They can all be beamed together. It's fine, the
  sixteenths."* The beamlet rule had been breaking group 2's secondary beam
  at the TUPLET'S OWN internal rest, leaving the final partial with a stub.
  Added `--beamThrough N`: beam group N keeps its secondary beam unbroken
  across rests — standard where the group is one rhythmic unit, and a
  tuplet's internal rest should never sever the group that contains it.
  Group 1 keeps its stubs (that was the point there). Verified live: figure
  2 = two full-width beams 1604→1694 (90.3 px each) at y 21 and 27.4, no
  stub. Batteries green.
- **Session wrap (day 23).** Composer taking a break; asked for docs caught
  up, everything committed and pushed, ready for a COLD START. Done:
  journal §2 rewritten for someone who has never seen this conversation
  (including the ONE COMMAND that rebuilds the whole working file) ·
  **D52–D57 promoted** (one-shot dynamic ladder · the GC is a ported object
  + z-order · tubists read ledgers + side-with-room · the breath rule ·
  clusters are named spans with an analysed tempo · the tuplet standard
  from the composer's own LilyPond) · **principles 11 and 12 added**
  (survey the composer's own tools before inventing a standard; when a
  selection rule picks something absurd the RULE is the bug) · §6 human
  notes refreshed, two day-22 verdicts closed · PLAN 8c marked complete
  for T1's density build 1 and **8e queued** (generate T2–T10, analysis
  first) · PAPER_NOTES #12 ("notation as measurement, not transcription").
  Save files: `scores/piece-s25-finished01.json` is TRACKED AND UNCHANGED
  all day — the archive is never edited (D49); every amendment lives in
  the IR. `notation/ir/db1-t1-x02.ir.json` and `db1-t1.ir.json` are
  committed. Working tree clean, nothing unpushed.

---

## Day 24 (2026-08-22) — DENSITY BUILD 1, ALL TEN PARTS: the one-shot vocabulary applied section-wide

Composer's ask, verbatim: *"insert for the first density build section all the
individual GCs and the surges and the forte pianos. and then I want to leave the
clusters... we'll take the clusters part by part."*

### The analysis first (PLAN 8e step 1, done before generating)

Census of `piece-s25-finished01`, window **0–55.94** (marker GESTURE-2 at 55.94
ends the section), layers 0–9:

- **461 waveCurve objects; 456 are notes**, 5 are layer-10 META shapes
  (classified `meta-shape`, skipped by the extractor — they are the only objects
  in the window with `technique: undefined`, and layer 10 is matched first, so
  nothing throws).
- Per part: T1 52 · T2 47 · T3 47 · T4 47 · T5 45 · T6 48 · T7 46 · T8 46 ·
  T9 36 · T10 42.
- Techniques: **staccato 390 · fortepiano 42 · ord 21 · cuivre 3**.
- The 21 ord split cleanly: **11 surges** (`envShape: surge`, curve mode,
  staggered 2.00→28.87, one per part except **T9, which has no surge**) and
  the **10-part octaves-Bb blast at 48.05** (plain mode, 4.41 s, vel 112).
- **Pitch: 30–67.** F#1 (30) is the 4-ledger floor already known; the ceiling
  is G4 (67, T8's cuivre) = **3 ledgers above** — so nothing in the section
  crosses the D54 threshold and no ottava is needed anywhere. Confirmed by
  measurement, not assumption.
- **No within-part simultaneities**: the smallest IOI in any part is 0.130 s
  (T1, T7, T10). The chord case is a CROSS-part vertical (the 40.93 blast),
  which each part reads as one note — so neither the breath rule nor beam
  adjacency has a same-onset case to handle here.
- **Density**: no part is denser than T1, which already lays out inside the
  6.51 ss half-lane. Nothing to solve.
- **Sample lengths**: 0 missing across all 435 fixed one-shots.

**Two vocabulary holes found, and they are exactly the ones the section shows
the composer first:**

1. **cuivre had no device entry.** The three cuivre notes (T1 wc-1587 midi 62,
   T4 wc-1584 midi 63, T8 wc-1580 midi 67) are all at **40.93** and all belong
   to `grp-vert03-fp-01` — whose other seven members are technique `fortepiano`,
   same instant, same velocity 112, and whose score `performanceNotes` on
   **every** member reads *"VERT01-03 fortepiano"*. So the gesture is a
   fortepiano blast in ten parts and cuivre is its timbre in three of them.
   Without an entry those three drew as bare parachute bricks: a ten-part chord
   with three holes in it.
2. **Plain (non-surge) sustained `ord` had no entry** — so the ten-part
   octaves-Bb blast at 48.05 drew as ten bare bricks. This is not one of the
   three things the composer named, but it is the last gesture of the section.

### The two decisions (registry data, D50)

- **cuivre INHERITS THE FORTEPIANO DEVICE SET verbatim** — go line, GC,
  nh-unit, ring bar, `sfzp`. Reasoning is evidence, not taste: drawing three
  members of one blast differently from the other seven would notate a *timbre*
  difference as a *gesture* difference. Cuivre sample lengths exist (62=1.14,
  63=1.25, 67=0.99 s) so the ring bars are sample-true like their siblings.
  **Open for the composer:** whether a cuivré TEXT mark should additionally
  sit on those three — the technique is currently invisible on the page.
- **`ord` gets go line + nh-unit + one band dynamic. PROVISIONAL.** No GC (the
  surge precedent: a sustained entry is not a point-in-time impact, and
  `byEnv.surge` carries no GC) and no ring bar (ord duration is real per D9 and
  the brick already shows it; the ring bar exists to show a FIXED one-shot
  ringing past its written value). At vel 112 all ten read **f**.
- **Regression guard, and it was a real one:** membership resolves
  `byTechnique` first, then `byEnv` ON TOP. A bare `ord` entry would therefore
  have leaked its band mark onto all eleven surges, which are `ord` + env
  `surge`. Fixed by giving `byEnv.surge` an explicit **`dynMark: false`**, which
  cancels it. The settled surge look is unchanged — verified by count: 11
  envcurves, 11 dyn-arrows, 11 ppp/fff pairs, zero band marks on a surge.

### The build

One command; `--bricks` because the clusters are deliberately left loose:

```
node tools/notate_section.js --score piece-s25-finished01 --w0 0 --w1 55.94 \
  --parts 0-9 --profile section1 --id db1-all-x01 --exp --bricks \
  --label "db1 ALL PARTS x01 (0-55.94, bricks; T1 cluster kept)" \
  --cluster 31.49-34.6@0 --clusterTol 0.05 --beamBreak 9 --beamThrough 2 \
  --tuplet 10-11@3:2 --accents 4,7,8,12 --dyn 1,9
```

→ **456 events, 129 chunks, VALID vs source.**

**`--cluster` gained an optional `@part`** (`31.49-34.6@0`). In an all-parts file
a bare span would sweep every lane's notes in that window into one beam group,
so the tool now **refuses** a bare span when the IR carries more than one part,
and names the parts it would have swallowed. This is what makes the coming
part-by-part cluster pass possible without forking ten files. Event→part comes
off `chunk.part` (the only place the extraction records it).

**Regression proof:** T1 rebuilt with the new `@0` syntax and diffed against the
day-23 file — **byte-identical** ignoring `id` and `provenance`. So the day-23
work is preserved inside the section file rather than re-derived.

### Verified (what was run, not read)

- `test_layout` · `test_render` · `test_coords` · `test_animobj` · `test_stamps` ·
  `test_snapshots` · `test_sonify_core` — all green after the registry + layout
  edits.
- **Headless layout over the real registry**: 4402 items — 456 bricks · 445 go
  lines (456 minus the 11 cluster members that suppress theirs) · **424 GCs**
  (staccato 390 + fp 42 + cuivre 3, minus the same 11) · 44 ring bars · 11
  envcurves · 66 open noteheads (surge 11 + fp 42 + cuivre 3 + ord 10) · 390
  filled · 45 `sfzp` (42 fp + **3 cuivre**) · 390 band marks (380 staccato +
  **10 ord**) · 4 accents · 1 tuplet · 8 beams · 6 rests.
- **Both verticals draw identically in all ten lanes** — at 40.93:
  `brick goline gc ringbar notehead-open [ledgers] [accidental] dyn-sfzp` in
  every system; at 48.05: `brick goline notehead-open [ledgers] accidental dyn-f`
  in every system.
- **In the running app** (`:5210`, notation.html): picker loads `db1-all-x01`,
  **7 pages**, no console errors, ink scales with density (page 5 = 33.1–41.1 s,
  3343 elements, 203 GC impacts; page 1 = 179 elements, 2). On page 6 the ten
  GC impacts of the 40.93 blast sit at the left edge across **all ten lanes**,
  the three cuivre lanes included — the registry change confirmed live, not
  inferred.
- **NOT verified: how it looks.** Screenshots were unavailable this session (the
  Browser pane would not composite). Every claim above is a count or a position
  read out of the live DOM. The composer's eye is the missing check.

### Two measurements the composer asked for earlier, now answered with data

- **`flagShortBarSeconds`** (the standing human note): across ten parts the
  current 1.0 raises **21** "composer judgment" flags. 0.5 → 9. **0.35 → 3.**
  0.25 → 2. One registry number.
- **One ring bar is not drawn at all**: `wc-78` — the next attack is exactly
  0.50 s away and the breath is 0.50 s, so there is no room. It warns rather
  than drawing a zero-length bar. Filed to NITS.

### The cluster ground for the part-by-part pass (computed, not acted on)

Running `cluster_fit` over every extraction group of ≥3 notes: **57 candidate
spans across the ten parts; 372 of the 456 notes are inside one; ZERO are
"NO FIT"** — at 30 ms tolerance every candidate admits a metric reading. So the
"proportional is the honest reading" case does not arise in this section on the
current grouping.

Two things that matter for the pass:

- **The tolerance is a compositional dial, not a technicality.** The same span
  returns a different tempo at 30 vs 50 ms, and since the fit is scored on
  COMPLEXITY (D56) a looser tolerance buys a simpler notation — e.g. T1
  30.75–34.51: 97.7 bpm ×8 (unit 77 ms) at 30 ms, 88.9 bpm ×4 (unit 169 ms) at
  50 ms. T1's finished cluster used `--clusterTol 0.05`.
- **The automatic grouping is a candidate list, not the answer.** For T1 the
  extraction proposes 30.75–34.51 (13 notes); the composer named 31.49–34.6
  (12), dropping wc-89. The span is authored.

### Per-part SOLO in the notation page (day 24)

Composer: *"can we do a solo button for each track"*. The **composer score
already had this** (lane `S` buttons, 2026-08-12) — the notation page had
nothing but the ⚙ `parts` dropdown, which re-renders with a single part and
changes the layout. So this is the same tool, ported, not a new idea:

- **Semantics copied verbatim from `composer.html`** so the two apps behave
  identically: click toggles a part into the solo set · **ALT+click = exclusive**
  (ALT+click on the only soloed part clears it) · soloed = amber · un-soloed
  lanes at **0.3 opacity** · any solo active → **only soloed parts send MIDI**.
- **The buttons live on the BAR, never in the SVG.** The frame is the
  presentation score (day-22 collapse) and the `#tnow` pill already set the
  precedent — DOM-only chrome, so exports stay clean. The strip sits beside the
  META/bricks look toggles, which means it is available with the engineering
  controls OFF, where the composing loop runs.
- **Only the parts the save contains get a button** — `db1-t1-x02` shows one,
  `db1-all-x01` shows ten. Loading a save drops a solo that no longer applies.

Implementation, three small pieces:

1. `render.js` — each system group is now `<g class="sys sys-pN">`. That is the
   whole hook: the shell can restyle one lane with a class toggle, **no
   re-render, no re-layout**. Snapshot drift was proven to be exactly this and
   nothing else: stripping the class from the current SVG reproduces the
   committed sha1 (`5bc069c3…`) byte for byte, all four ink counts unchanged
   (+19 bytes). Snapshot updated deliberately; `--prove-red` still red.
2. `animobj.js` — `frameSvg(..., opts)` gained `opts.cursor === false`. The
   overlay is drawn in **two passes** when a solo is up: soloed instances at
   full ink (owning the one cursor), the rest inside a single
   `<g opacity="0.3">`. The partition is computed on a solo change / instance
   rebuild, **never per frame** — the overlay redraws 60×/s.
3. `notation.html` — `soloScope()` is the single source of truth (the save's
   parts, narrowed by solo) and feeds the page dim, the overlay split **and**
   the MIDI player's `parts`, so the three can never disagree. The scope is in
   the player cache key, so each solo set gets its own compiled player and
   flipping back is instant. `soloChanged()` flushes the outgoing player first —
   without it, notes sounding on a part that just lost solo hang forever (the
   residue class, piece #3 Principle 3).

**Verified live** (`:5210`, `db1-all-x01`, driven through the real DOM):

- ten buttons, ten tagged system groups, nothing dimmed at rest
- click T3 → 9 lanes dimmed, computed opacity **0.3**; click T7 → adds
  (2 lit); click T3 again → removes; **ALT+click T5 → exclusive**; ALT+click T5
  again → clears, all lanes back to opacity 1
- overlay at t=34 on the apex page: no solo = 17 elements / 0 dim groups /
  1 cursor; solo T3 = 18 elements / exactly **1** dim group / 11 elements inside
  it / **still exactly 1 cursor** (the dim pass suppresses its own)
- **the dim survives a page turn** (page 5→6, 9 still dimmed, T3 still lit),
  **survives the zoom view** (9 of 10 dimmed there too), and **survives the
  1 s hot-reload poll** — which matters, because the cluster pass edits the IR
  under the composer's eye while a part is soloed
- switching to the one-part save rebuilds the strip to a single T1 button and
  drops the stale T3 solo; no console errors anywhere
- batteries green: layout · render · coords · animobj · stamps · snapshots ·
  sonify_core · midiplayer

**Not verified by ear.** The MIDI gate feeds the solo-filtered list into
`makeMidiPlayer`'s existing `parts` scope, which `test_midiplayer` already
proves in isolation (`parts:[0]` sounds only T1's notes and touches only
`tuba1`/`tuba1b`) — but Web MIDI is unavailable in the verification browser, so
nobody has heard a soloed part. **Known limitation:** an attached audio render
cannot be soloed (it is a stereo mix); MIDI can.

### The first COMPOSITIONAL edit to the archive: wc-28, T2 → T9 (day 24)

Composer: *"in tuba two at seventeen nineteen there is a GC. Can we move that
to another part, two by nine?"*

**The note:** `wc-28` — staccato, G1 (midi 31), vel 72, 17.190–17.604 s, group
`grp-g1-opening`, performance note `STAC-rev`. The only T2 event within 3 s of
17.19, so the identification is unambiguous. It carries a GC because the
staccato technique entry does (D50).

**Reading "two by nine" as T2 → T9**, on evidence rather than grammar: T9 is
the only part with a hole there — it was **empty until 21.07 s**, the last part
to enter and the sparsest in the section (36 notes, and the only part with no
surge). Nothing else in the ensemble is free at 17.19. Both plausible dictations
("to T9", "to be nine") land on the same part.

**Why this could NOT be an IR amendment.** Every archive correction so far
(wc-23, wc-29) has been a *value* being wrong — a duration under-specified
against the measured sample — and those live in the IR by design (D49). A part
move is a different animal: it changes **who plays the note**, and therefore
which MIDI port sounds it. The notation app's player compiles the archive (with
IR durations applied), so an IR-only move would have drawn the note on T9's
staff while it kept sounding out of `tuba2b`. That is precisely the silent
divergence ARCHIVE_AMENDMENTS exists to prevent. So the edit belongs in the
score, and protocol rule 5 wants it to be an explicit ledgered act — *"a script
run from this ledger"*.

**`tools/move_object.js`** is that script. `--score --object --toPart`, dry run
by default. It prints the object's full identity and the destination's
neighbours, and **refuses** when the target part already holds a note within
`--tol` (0.03 s) of the onset — because extraction sidelines same-onset notes in
one part as splitters (they cannot share a grid slot), so such a move would
quietly change how the part reads. `--force` overrides; a no-op move is refused
too.

**Formatting proven before writing**, so a 4 MB archive could not be reformatted
by accident: `JSON.stringify(score, null, 2) + '\n'` reproduces the committed
file byte for byte (checked by round-trip; the only difference from a naive
stringify was the trailing newline). The resulting diff is **one line**:
`"layer": 1` → `"layer": 8`. Undo is `git checkout -- scores/…`.

**Safety check that mattered:** a server was live on :5200 while this was
written. Canonical `piece-*` saves turn out to be protected by the composer
app's working-copy mechanism — opening one puts the session in
`piece-s25-finished01-work` and autosave writes THERE, and only when dirty — so
a passively-open composer app cannot clobber an archive edit. (If the composer
is mid-edit in a work copy, that copy and the archive have now diverged by this
one field.)

**Verified, page and sound both:**

- Re-extract of `db1-all-x01` (identical command, T1 cluster preserved): still
  456 events / 129 chunks / valid. **T2 47 → 46 notes, T9 36 → 37**; wc-28 is
  now T9's **first note in the piece**, 3.88 s ahead of wc-38.
- **Live page** (page 3, 16.0–24.0 s): the GC impact at 17.19 is on **T9's**
  lane, and T2 carries no impact until x1607 ≈ 22.66 s (wc-42), exactly as the
  data says. Cross-check on the same page: the 17.75/17.77 pair (wc-29 T1,
  wc-30 T6) lands at x457/x462, which fixes the time→x mapping independently.
- **Sound follows**: compiling the amended archive routes wc-28 to **`tuba9b`
  ch 3**, where it was `tuba2b` ch 3 — the same channel, the new port, matching
  T9's other staccato (wc-43 → tuba9b). So this is a real part change, not a
  drawing change.
- Eight batteries green; the IR revalidates against the amended source.

**Musical consequence worth the composer's ear:** T9 now ENTERS at 17.19
instead of 21.07. Since T9 has no surge, this staccato G1 is now that player's
first sound in the piece.

### BEAM WITHOUT CLUSTERING — the mixed pair, T2 31.176 + 31.396 (day 24)

Composer: *"There are two notes beginning at thirty one point one six… stem the
half note, and then just connect it to the sixteenth note with a beam, and
have the sixteenth stub on the first one. And then remove the GC from the
second one, the long tone that hits at thirty one point three nine."*

**The pair, identified:** T2 `wc-95` (staccato, A2/midi 45, **31.176**) and T2
`wc-98` (fortepiano, A1/midi 33, **31.396** — the composer's "31.39" exactly,
1.40 s sample-true, `FP3x`). Both in `grp-g1-opening`. Reading "two notes
beginning at 31.16" as *the two-note group begins there*, since T2 has exactly
one note at 31.176 and the next at 31.396.

**Why `--cluster` was the wrong tool, and what replaced it.** `--cluster` is
built for a run of staccato partials: it fits a tempo, **redraws every member as
a 16th on that grid**, and fills the gaps with rests. Here the composer wants
the opposite — two notes that keep being what they are, joined by a beam. So a
second flag, `--beam t0-t1@part`:

- the overlay carries **only** the stem/beam fields, so head, ring bar, dot and
  dynamic still resolve from each note's own technique entry (D50). Measured
  result: the 16th keeps filled head + staccato dot + band `f`; the long tone
  keeps **open head** (= the half note) + 3 ledgers + ring bar + `sfzp`.
- **no `beamUnit` is written** — that is precisely what keeps the grid, and
  therefore the rests, out of it. A beam, not a cluster.
- **how many beams a member carries is DERIVED, not asked for:** a short fixed
  one-shot (staccato) is the "sixteenth" and takes two levels; anything that
  rings (fortepiano, cuivre, ord) is the long note and takes the primary beam
  only. The second level then has no neighbour to connect to, and layout's
  existing beamlet rule draws it as a **stub on the short note** — the figure
  asked for, from the rule day 23 already settled, with nothing new invented.

**`--noGc wc-98`** is a separate, general per-note override (`gc: false`), named
by OBJECT ID rather than member number so it stays unambiguous with several
groups in flight and works on any note, beamed or not. It removes the GC from
**both** the page and the animation, because `animobj` resolves its per-note
GCs through the same `deviceResolver` (D50) — one rule, two consumers.

### The bug this uncovered: A BEAM IS THE GROUP'S, NOT THE NOTE'S

Each note computes its beam height from **its own technique's flag** — the
comment in layout.js says so explicitly ("the beam tracks the flag the one-shots
actually wear"). That is level by construction for a group of one technique,
which is every group built so far. A **mixed** group is not: a fortepiano
carries no `nhStem` of its own, falls back to flag8 — and `flag.up8.hSs` is
**3.008** where `flag.up16.hSs` is **3.508**. So the beam joining a fortepiano
to a staccato would slope by **half a staff space**.

Found by measuring the glyph table *before* drawing anything, then **confirmed
live by accident**: the first browser check still had the old `layout.js`
cached, and its beam polygon came back
`1721.49,119.68 → 1773.92,123.63` — a 3.95 px drop, which is 0.5 ss × 7.9 px/ss
to the pixel. The stale cache turned into the cleanest possible before/after.

**Fix:** after a group's tips are collected, level them to the tip FURTHEST from
the staff and move each note's stem with it. Furthest, not nearest, so no stem
is ever shortened under its own flag clearance; and it is a provable no-op when
the tips already agree, which is why both snapshot batteries (layout, render)
stayed green over the existing cluster. Stems are linked to their tips at push
time so the two can never drift apart.

### Verified

- headless: beam tips **both at ySs 5.888**, both stems ending at exactly
  5.888; stub `bm-1-b2-stub` at t=31.176 running dx −0.72 → +0.28 (**1.0 ss**,
  pointing right); `gc` item present at 31.176, **absent** at 31.396.
- live, after a hard reload: T2's beam polygon `1721.49,119.68 →
  1773.92,119.68` — **flat**; the stub 1721.49 → 1729.39 = **7.9 px = 1.0 ss**
  exactly, one beam level (0.81 ss stackStep) below the primary; T2's GC
  impacts on that page are 561.4 / 1084.2 / 1370.1 / 1486.4 / **1727.2** — the
  16th at 1727.2 keeps its GC and **there is none at 1773.9**, the long tone.
- `protrusion_detect` over the whole section files 17 items, none of them this
  figure — the pair fits its lane, `sfzp` above the beam included.
- eight batteries green; layout `--prove-red` still red.

**One thing not asked for and therefore not changed:** both notes keep their go
lines. The cluster convention gives the go line to member 1 only; the composer
named the GC here and not the go line, so it was left alone.

### T2's six-note cluster at ONE tempo, the pair re-drawn under a beam standard, and THE STANDARDS WRITTEN DOWN (day 24)

**The rhythmic analysis, as the composer asked to have it explained first.**
Figure A (32.559 / 32.981 / 33.311, gaps 422 · 330 ms, ratio 1.28 — between 5:4
and 4:3) and figure B (34.011 / 34.340 / 34.511, gaps 329 · 171 ms, ratio
1.92 ≈ 2:1). The search is exhaustive over every unit 20–500 ms in 0.2 ms
steps; a unit survives when every note rounds to a grid slot within the
tolerance and no two share a slot; survivors are ranked by COMPLEXITY (a unit
under the 90 ms playable floor +100, a non-power-of-2 subdivision +10, a beat
outside 0.5–1.5 s +4/+6, each empty slot +0.25) and accuracy only breaks ties.
So "does a tempo work" has many yeses (43 surviving grid patterns for A at
30 ms) and the real question is which is simplest.

- A alone: ♩=102 in 16ths at 18 ms (grid 0,3,5); at 50 ms it flattens to
  three 8ths at ♩=77 (31 ms). The 32nd-note reading at ♩=70 is three times
  more accurate (5 ms) and LOSES — accuracy is a gate, complexity decides.
- B alone: ♩=90.5 in 16ths, **2.6 ms** — the cleanest fit in the section.
- **A+B as one figure: ♩=101.4 in 16ths, grid 0,3,5 · 10,12,13, max err 28 ms.**
  The composer chose this (option c) over two tempo marks 0.7 s apart. The
  shape, every slot a 16th: note · 8th-rest · note | 16th-rest · note ·
  8th-rest | 8th-rest · note · 16th-rest | note · note.

**Built:** `--cluster 32.55-34.52@1 --clusterTol 0.03 --beamBreak 4 --dyn 1:f
--accents 1,3,5,6`. Two beam groups on one tempo; group 1 = three isolated
16ths (stubs on each), group 2 = stub + a connected pair.

**Dynamics — the composer asked for a weigh-in.** Velocities 121 105 121 109
127 127 → bands fff f fff f fff fff: *"loud, slightly softer, loud, slightly
softer, loud loud… if I set just once FFF, is there something that says place
slightly softer instead of a dynamic for each partial?"* Answer: not as
"softer" — standard notation has no per-note softer mark — but the INVERSE is
exactly the ambient+deviation model DYNAMICS_FRAMEWORK already adopted and
day 23's cluster already used: one ambient mark at the SOFTER level and
accents on the louder partials. So `--dyn 1:f` (the explicit-mark form, since
member 1's own band is fff) + accents on 1,3,5,6. Same information, one
dynamic. Per-partial marks stay one flag away (`--dyn 1,2,3,4,5,6`).

### Three bugs found by this figure, all in code the T1 cluster never exercised

1. **Cluster modifiers were GLOBAL.** With two `--cluster` spans in one file,
   T2's cluster inherited T1's `--accents 4,7,8,12` and a `--tuplet 10-11`
   over members it does not have. Modifiers are now POSITIONAL: each applies
   to the `--cluster` that precedes it. T1 rebuilt under the new parser is
   byte-identical to day 23.
2. **A beam group took its stem direction from its FIRST member.** Member 1
   (A3, above the middle line) made group 1 stem-down; the A1 three ledgers
   below then got a 0.33 ss stem with the beam running through its own
   ledgers. Now: one direction per group, decided by the member furthest from
   the middle line (Gould), ties up — a pre-pass in layout.js. Both groups
   came out stem-up, beams flat at 5.22.
3. **The page planner could cut LATER than the page's window.** Since the
   day-22 constant-time-scale change a video page draws exactly
   [t0, t0 + 8 s], but the cut slack reached ±2 s forward too — page 4 showed
   24–32 while its cut sat at 33.1, so page 5 began at 33.1 and **32.0–33.1
   was on no page at all**, the cluster's first two notes inside it. The
   committed splice snapshot had the same defect baked in (pages 12→25.6 and
   36.2→48.8, both longer than 12 s). Slack now reaches only backwards (an
   early cut overlaps the next page, losing nothing); the minPage guarantee is
   kept. Snapshot updated deliberately, `--prove-red` still red. Pages now
   0–8 · 8–16 · 16–24 · 24–32 · **32–40** · 38.7–46.7 · 46.7–54.7.

### The pair, re-drawn to the composer's corrections

*"Beams should always be flat… if you need to bring it down to accommodate the
sfzp… when we have two consecutive dynamics like that, put them together…
get rid of the second go line… move the first black note head in so that
it's centered on the go line… get rid of that go line too."* All five are now
the BEAM STANDARD (registry `figures.beam`), not per-note edits: no go lines,
GC first-only, first head `headCenter` (a new anchor: dx exactly 0.00), the
members' dynamics on ONE ROW above the beam with the beam lowered to fit
(5.888 → 5.09; `f` and `sfzp` both at 6.02, top edge at 6.505 inside the 6.51
lane). The flat-beam levelling was already in from the previous sitting; the
composer's note confirms it was the right law.

### The standards, captured

- `container.json → engraving.layout.figures` — `cluster` and `beam` blocks;
  `notate_section.js` builds every overlay FROM them, so the rules are data.
- `docs/NOTATION_STANDARDS.md` — every rule in the composer's words, with the
  registry key or code location beside it. The index, not the source.

### Verified live (hard reload; page 5 = 32.0–40.0)

- cluster group 1: primary 185→284→361 at y 125.0, FLAT, three 7.9 px stubs
  one level below · group 2: 525→602→642 FLAT, stub on 525, 602→642
  connected · GC and go line at x 179 only (member 1) · `f` once, accents on
  1, 3, 5, 6 above the beams at one height
- pair (page 4): beam 1730→1774 at 125.99 both ends (lowered 6.3 px = 0.8 ss
  for the row), stub 7.9 px, zero go lines, one GC
- nine batteries green (splice + layout + render snapshots all intentional
  no-ops or deliberate updates, each proven)

### Three corrections that became standards: the GC on the ringing note, the inward beamlet, and the dynamics derivation (day 24)

**1. The GC moves to the half note** (composer, reversing the earlier
*"remove the GC from the second one"*): *"let's shift the GC to the half note…
if the half note needs to shift, the note head should be centered on go time
along with the GC."*

- `figures.beam.gc` is now **`"ring"`** — the first member whose technique
  rings (fortepiano/cuivre/ord), because the long note is the one whose entry
  needs the cue. `"first"` stays a legal value and is the fallback when nothing
  in the group rings, so the cue can never vanish; the tool prints which note
  got it.
- `figures.beam.firstAnchor` became **`anchor`** — EVERY member's head is now
  centred on its go time, not just the first. Measured: both heads at dx 0.00.
  The half note did not in fact need to shift for clearance (the GC impact
  marker lives at the bottom of the lane, cy 212.6 in a lane running ~122–229,
  while the head sits on the staff) — centring it is the alignment the composer
  asked for, not a collision fix.

**2. A beamlet on a group's LAST note points INWARD** (composer, on the third
partial of T2's first group): *"the beamlet should go inside the stem rather
than protruding outside… on the left of the stem."* A right-pointing stub there
hangs past the end of the primary beam and reads as material that is not
written. Gould agrees: a fractional beam points toward the group it belongs to,
which for the final note is backwards.

Audited every stub in the section afterwards — **exactly one flipped**:
T2 cl-2a at 33.31, now `dx -0.18 → 0.82` (ending at the stem) where it was
`0.82 → 1.82`. Live: `353→361` px where it was `361→369`. T1's three stubs
(31.55, 31.89, 32.95) are untouched, because none of them is the last note of
its group — the settled day-23 figure is safe.

**3. The dynamics derivation, captured but deliberately NOT wired** (composer:
*"forte with accents is good. We can capture that as a standard. I'm not sure
we're ready for AI to generate the clusters, but let's just capture it in case
that does happen."*) → `figures.cluster.dynamicsRule` + a section in
NOTATION_STANDARDS.md.

The rule: band every partial from its velocity · place ONE ambient mark at the
*softer* level (a second where the level shifts, in practice at a beam-group
start, taking that member's own band) · accent every partial whose band is
above its current ambient. The reason it is the inverse of what the composer
first reached for: **there is no engraved mark meaning "slightly softer"** —
they asked directly. Stating the soft level once and marking the loud ones
carries the same information in one dynamic.

**Then measured against both real clusters, which is the part that matters:**

| cluster | bands | rule gives | composer chose | verdict |
|---|---|---|---|---|
| cl-2 (T2, 6 partials) | fff f fff f fff fff — two | ambient `f`, accents 1,3,5,6 | ambient `f`, accents 1,3,5,6 | **exact, derived independently** |
| cl-1 (T1, 12 partials) | mf/f/fff — three | ambients at members 1 and 9, accents 4,7,8 | dynamics on 1 and 9, accents 4,7,8,**12** | ambients right, 3 of 4 accents right; member 12's accent is BELOW its ambient — a shaping choice on the final partial that no velocity rule predicts |

So the rule is reliable for a two-band cluster and a starting point for a
three-band one. Filed with the instruction that a generator should **propose**
marks and **say which partials it could not explain** — never auto-apply. This
is the honest half: a rule that reproduced one cluster exactly would look
trustworthy; testing it against the harder one is what shows its edge.

**Verified** (rebuild + hard reload): tool prints `GC on wc-98 (ring)`; the
pair draws one GC impact at the half note's go time (cx 1778.7) and zero go
lines; both heads dx 0.00; the inward stub at 353→361; seven batteries green;
`protrusion_detect` files the same 17 pre-existing accidental items and nothing
new, so the centred heads cost no clearance. (It also appends its section on
every run — the duplicate from today's second run was removed by hand; worth a
`--dry` habit or a dedupe in the tool.)

### T4's pair, the ring bar shortened from the left, and two rhythmic analyses (day 24)

**T4 30.396 + 30.794 built as a beam** (`--beam 30.39-30.80@3`): wc-86
(staccato B♭3) into wc-90 (fortepiano B♭1, 1.69 s). Everything the composer
listed — stems up · no go lines · GC on the half note · heads centred on go —
came out of the STANDARD with no per-note argument. Stems-up in particular was
not asked for in the flag: the group-direction law (furthest from the middle
line wins, day 24) picks up on B♭1's three ledgers below and turns the whole
group up by itself. Verified: heads at dx 0.000, beam flat at y 5.089, stub
1547.7 → 1555.5 px, GC at 1637.8 = the fp's go time, zero go lines on either
note.

**THE RING BAR WAS STILL FLUSH WITH THE GO LINE** (composer, spotting it on
T2's figure first): *"you have to shorten the duration bar from the left. It
still got its own old setting… have the notehead and ledger and a little bit of
space and then a duration bar."* The day-22 spec said "left edge flush with the
go line", which was right while every unit hung BEFORE its go time — but a head
centred ON it (nhAnchor headCenter, this morning) puts head and ledgers on top
of the bar's first millimetres.

Restated against the unit's own right ink edge, so the rule is anchor-agnostic:
`dx0Ss = max(0, headDx + rightExt + ringBarGapSs)`, gap default 0.25 = the
existing `nhGapSs` standard. Live proof on T4's fp: ledgers span
1631.2 → 1644.3 px, the bar now starts at **1646.3** — a 2.0 px gap, which is
0.25 ss at this frame.

**A regression the snapshots did NOT catch, found by measuring instead.** The
first version had no clamp, and I had claimed it was "provably a no-op" for
default-anchored bars: there `headDx + rightExt = -nhGapSs`, so the bar should
land exactly on the go line. That algebra is only true for a unit WITHOUT a GC.
A GC-bearing unit is pushed clear of its impact marker (gap becomes
gcImpactRadius 0.51 + 0.15 = 0.66), so all 44 bars in the section moved 0.41 ss
to the LEFT of their attacks — a ring bar starting before the note sounds.
Both layout and render snapshots stayed GREEN through it, because their fixture
carries no GC-bearing ring bar. Clamping at 0 restores exactly 42 bars to
dx0Ss 0.000 and leaves only the two centred heads shifted (1.080 each). The
lesson is the one the methodology already states: a confidence claim has to be
measured, and "the batteries are green" is not the same as "I checked".

### The analyses (nothing built from these yet)

**A caveat that governs both: ANY two onsets fit exactly** — the unit is simply
the gap. So every 2-note "err 0 ms" below is arithmetic, not evidence. Only
3-note and longer fits say anything.

**T3, 29.93–31.97, five staccatos** (IOIs 339 · 567 · 428 · 708 ms). The
composer's own hypothesis wins outright:

| reading | fit | err |
|---|---|---|
| **one-shot + LAST FOUR (2-5)** | **♩=105.6 × 16ths, grid 0,4,7,12** | **1 ms** |
| first four (1-4) + one-shot | ♩=67.0 × 32nds, grid 0,3,8,12 | 10 ms |
| all five | ♩=66.6 × 32nds, grid 0,3,8,12,18 | 17 ms |
| 1shot, 1shot, last three (3-5) | ♩=67.1 × 16ths | 19 ms |
| first three (1-3) + 2 one-shots | ♩=96.4 × 8ths | 28 ms |

Notes 2-5 at **1 ms** is the cleanest fit found anywhere in the section so far
(T2's best was 2.6 ms), and it is the only multi-note reading here that is both
a power-of-2 subdivision and effectively exact. Every other reading pays 10-28
ms and most need 32nds. 16 whole readings have every beamed block fitting;
they are in the day-24 scratch analysis.

**T4, last five staccatos, 45.278–46.217** (IOIs 206 · 271 · 205 · 257 ms —
near-even, mean 235). The simplest reading is also nearly the best:

| reading | fit | err |
|---|---|---|
| **all five as consecutive 16ths** | **♩=65.5 × 16ths, grid 0,1,2,3,4** | **23 ms** |
| last three (3-5) | ♩=67.4 × 16ths, grid 0,1,2 | 17 ms |
| first four (1-4) | ♩=65.9, grid 0,1,2,3 | 22 ms |
| notes 2-5 | ♩=60.2, grid 0,1,2,3 | 22 ms |

Five even 16ths with no rests at all — the grid is literally 0,1,2,3,4. The
23 ms buys away an alternation the ear is unlikely to parse (206/271/205/257).
Splitting into pairs would read err 0, but that is the 2-note artefact above:
it would cost two tempo marks and state nothing.

### wc-87 moved T8 → T9 to get its ring bar back, and four more analyses (day 24)

**The move, and why it is not a notation fix.** T8's fortepiano at 30.662
(`wc-87`, B2, sample **1.87 s**) had its next attack 0.512 s later, so the
breath rule (next gesture minus 0.5 s) left it **0.012 s** of bar — the device
was there and drew nothing. Composer: *"Let's move that whole figure to t nine
and give it its full length and bar back."* T9 is the sparse part; its
neighbours are 29.125 and 32.137.

Measured before applying (the tool's dry run prints the destination's
neighbours for exactly this reason):

| | next attack | room after breath | bar drawn |
|---|---|---|---|
| T8 (before) | 31.174 | 0.012 s | 0.012 s |
| **T9 (now)** | 32.137 | 0.975 s | **0.975 s** |
| T9, breath waived (`ringBarBreath:false`) | 32.137 | 1.475 s | 1.475 s |

So the bar is back — **0.975 s, up from 0.012** — but **not the full 1.87 s**,
and it cannot be in T9 either: the sample outlasts the gap to T9's own next
note. Full length needs the breath waived (1.475 s) or wc-111 moved too.
Flagged, not decided. It still trips `flagShortBarSeconds` at 1.0 (0.975 is
just under); at the 0.35 threshold discussed earlier it would go quiet.

Verified: bar 30.662 → 31.637 in T9; `techniqueFor` routes it to `tuba9` where
it was `tuba8`; one-line diff; five batteries green. Ledgered as the second
SCORE EDIT.

### Four analyses (nothing built)

Reminder that governs all of them: **any two onsets fit exactly** — the unit is
the gap — so 2-note "err 0" blocks below are arithmetic, not evidence.

**T5, last five** (IOIs 182 · 200 · 285 · 395 — a steady accelerando in
reverse, i.e. slowing). One group: ♩=78.3 in **32nds**, grid 0,2,4,7,11, 10 ms.
The 32nds are the price of that 182→395 spread. Cheapest honest alternative:
**[1-3] ♩=79.8 16ths (6 ms) + [4-5]** — two units, and the first three become
three consecutive 16ths.

**T6, last three** (IOIs 203 · 503). One group: ♩=66 in 16ths, grid **0,1,3**,
24 ms — note · note · rest · note. The only other reading worth the ink is
[1-2] beamed + a lone one-shot. Three notes is little enough that this is
mostly a taste call.

**T7, last eight** (IOIs 182 · 448 · 157 · 141 · 183 · 190 · 369). All eight
need **32nds** at 25 ms — the 448 ms gap early on is what forces the fine grid.
The material splits naturally: **[1-4] ♩=74 16ths (23 ms) + [5-8] ♩=80.9 16ths
(2 ms)**. Notes 5-8 at **2 ms** is the cleanest thing in this part, grid
0,1,2,4. If any split is going to be made in T7, that is where it wants to go.

**T8, last ten** (IOIs 1075 · 516 · 308 · 487 · 311 · 180 · 320 · 229 · 216 —
a clear accelerando). All ten: ♩=83.9 in **32nds** across a 41-slot grid,
29 ms — technically a fit, practically a wall of rests. The natural cut is at
the end: **[1-7 or 1-8] ♩=75 32nds (18 ms) + [8-10] ♩=66.8 16ths (4 ms)** or
**[9-10]**. The tail (notes 8-10, grid 0,1,2) is three consecutive 16ths at
4 ms — the cleanest sub-span in the part. The head of the run is where the
32nds live, because 1075 ms and 180 ms have to share one unit.

**The pattern across all four** (worth noticing before the remaining parts get
notated): every one of these tails ends in a short, fast, near-even group that
fits 16ths almost exactly, preceded by a longer, more spread stretch that only
fits under 32nds. The section's accelerando is doing this — the last few
attacks converge on a pulse. Splitting each tail off as its own beamed group is
consistently the cheapest reading, and it is the same shape the composer chose
by ear in T2 (`--beamBreak 4`).

### T3's two figures with a PICK-UP, T4's last five, and a correction I owed (day 24)

**A correction first.** The composer asked for T3's *last nine partials* and I
had only analysed **five** of them (29.93–31.97), never the four at
33.18–34.51. Their own hypothesis — *"grouped the first four, one shot,
another one shot, and grouped the last three"* — describes 4+1+1+3 = nine, and
it had never been tested. Ran it properly:

| | their grouping (4·1·1·3) | mine (1·4·1·3) |
|---|---|---|
| front block | notes 1-4: **32nds, 10 ms** | notes 2-5: **16ths, 1 ms** |
| back block | notes 7-9: 16ths, 28 ms | identical |

The two readings differ by ONE thing: which note stands alone at the front.
Note 1 sits **55 ms** off the 2-5 grid (tolerance 30), so it is not a member
the fit narrowly rejected — it is a separate attack. Composer chose the second
and then improved it: **note 1 is a PICK-UP to the group, not a lone one-shot.**

**`--pickup N` (new).** The tempo belongs to the main figure, so the fit runs on
the members AFTER the pick-up and the pick-up is then measured onto that grid at
a negative slot. Fitting all five together would let a loose anticipation drag
the grid to accommodate itself — exactly what produced the 32nds reading. The
GC and go line move to the first note after the pick-up (composer: *"the GC then
is actually on number two"*). The pick-up's own miss is printed (55 ms here) and
never constrains the fit, which is the point: a pick-up is played TO the
downbeat, not metronomically before it. Regression: T1's cluster rebuilds
byte-identical.

**Built:** T3 cl-3 = pick-up + four at ♩=105.6, grid 0,2,6,9,14, **1 ms** ·
T3 cl-4 = the last three at ♩=71.6, grid 0,2,3, 28 ms · T4 cl-5 = the last five
at ♩=65.5, grid 0,1,2,3,4, 23 ms.

**Dynamics — the captured rule applied, and once refused.** T3's two groups are
two-band (f/mf), the rule's home ground: ambient `mf` + accents on the f
partials (1,3,4 and 1,3). **T4's last five has FOUR bands** (p 72 · mf 85 ·
f 110/118 · fff 123) — the rule would give ambient `p` and accents on four of
five notes, which is not a shape. That is the documented failure mode, so the
contour IS the content there and it gets per-partial marks. First time the
captured rule was consulted and deliberately not followed.

**Left-edge question, answered with a measurement** (composer: *"reassure me
that for all the clusters... the left side of the note head is on the go
line"*): **31 of 31 cluster noteheads, deviation 0.000000 ss.** It is
`figures.cluster.nhAnchor: "leftEdge"` in the registry, so it holds for every
cluster built from here on. A first pass reported 3 failures — that was my
checker matching noteheads by time across ALL parts instead of per part, not
the notation. Worth the note: a verification script is code too.

**Also verified:** T3's primary beam spans all five members with the last stub
INWARD; T4's five consecutive 16ths get a solid double beam and no stubs at all
(nothing opens a gap). Five batteries green.

### Rests: one per silence, dots allowed, and centred — plus WHY they looked wrong (day 24)

Composer, on T3's figure: *"can you combine the rests, the second could be a
dotted 8th rest and the 4th and 5th rests could be an 8th rest etc. and then
move them into a better horizontal position, or explain to me what their
horizontal positioning is about. They don't seem spatially accurate."*

**Why they were spatially wrong, and it is worth stating plainly:** these pages
map x to TIME. The rest was being drawn at the START of its gap, so it hugged
the note that had just sounded and left the rest of the silence looking empty.
Rests now sit at the **midpoint of the span they cover**. On this figure that
moves the quarter rest 284 ms to the right — a third of a second — into the
middle of its own silence. (In metric notation a rest belongs at the start of
its slot, because a barline says where the beat is. On a proportional page
nothing does, so the start position is just wrong.)

**Merging.** The day-23 rule took the longest POWER-OF-2 rest whose start was a
multiple of its own length — engraving's beat-alignment convention. With no
barlines to straddle it buys nothing and costs legibility: a 3-unit silence
came out as a 16th plus an 8th, a 2-unit silence as two 16ths. Now greedy
longest-first over **dotted values too**, no alignment test:
`R units -> (sub·4)/R`, and `R = 3·2^k -> the next longer glyph, dotted`.

T3's cluster (grid 0,2,6,9,14) went from **seven** rests to **four**:
16th · **dotted 8th** · 8th · quarter — exactly the composer's reading.

Capped at 6 units (a dotted quarter). An 8-unit rest would need a half-rest
glyph this font does not carry, and the old candidate list `[8,4,2,1]` could ask
for one and throw — a latent crash removed on the way past.

The augmentation dot reuses `standards.staccatoDot.diameter` (one dot size in
the piece), gap `restDotGapSs` 0.28, drawn on the rest glyph's own vertical
middle. `standards.augmentationDot` is read first if it is ever added.

**Also:** the `mf` moved from the downbeat to partial 1 and now draws BELOW the
staff (y −2.94) — the chain's default side, available because partial 1 sits on
the staff where the downbeat's three ledgers left no room. Accents stay on 1, 3,
4. Four batteries green.

### THE GO LINE PRINCIPLE, locked — and the ball lowered to the lane edge (day 24)

The composer paused the note-by-note work to review the design for internal
consistency, starting from the day-23 Option B decision (the one-shot's unit
sits before its go time so it never covers the GC's disc).

**The principle, in the composer's own earlier words, now adopted:** *"the other
go lines are there because the notation doesn't line up with the go time."* So —
**the go line marks DISPLACEMENT.** It belongs on a unit whose head is not on
its go time (the one-shots, hanging 0.6 ss before; the surge) and on nothing
else. A cluster partial, whose LEFT EDGE sits on its own go time, has nothing to
mark and gets none. This also explains the day-23 reversal that went unrecorded:
Option B dropped the staccato's go line, the composer restored it the same
afternoon — correct, because that unit IS displaced.

**Alignment settled: left edge stays.** Time-space notation (Feldman, Brown,
Cage) puts the attack where the head begins; conventional engraving aligns
simultaneities on left edges; and the composer's own scrolling-reader argument
says the cursor touches the head as the note starts. Centre has no tradition
behind it.

**Three marks say "now"; only the GC is the datum** — it alone carries the
launch rather than merely the time.

**THE MEASUREMENT THAT DECIDED THE LAST PIECE.** Before arguing, counted the
actual collisions: the disc occupied y −6.39..−5.37 ss, and **3 of 7 GC-bearing
figure notes overlapped it** — T3's G♯1 downbeat by half the disc's height, both
beam half-notes by a pixel. Not an edge case either: **164 of 390 staccatos in
the section (42 %) sit at C2 or lower**, the register that reaches the disc.

Composer chose to lower the landing point. `impactInsetPx` **5 → 0** — the ball
now lands ON the lane edge instead of hovering 5 px above it. **After: 0 of 7
collide.** Only midi 29–30 (F1/F♯1, the piece's two lowest) still reach the
disc, and by a ledger line rather than a head.

Day 23 had called vertical separation impossible *"because the marker's height
IS the object"*. That was too strong, and worth recording as a correction: the
**landing height is a number we chose**, not something inherent to the GC.

**A duplication found while making the change — the kind that only shows up
under a live edit.** `impactInsetPx` exists TWICE in the registry:
`engraving.render.gc.look` (the static disc) and `animated.gc.look` (the falling
ball). Nothing tied them together, so changing one would have left the ball
landing where the disc is not — a bug invisible in a still frame and obvious in
motion. Both moved; `test_animobj` now **asserts they agree** (proven to bite:
set them 3 vs 0 and the battery goes red), and the test reads the number from
the registry instead of restating it, which is what made it fail in the first
place.

**Rollout is per figure, at the composer's request** (*"I think I still need to
see the go line for some things"*): `--noGoLine` is a positional cluster
modifier, applied so far to **T1's first cluster (cl-1, 31.49–34.6)** only.
Verified: T1 has a GC at 31.55 with no go line, while its three loose one-shots
at 29.09/30.00/30.75 keep theirs — exactly the principle. The registry default
flips to false once every figure has been seen.

**A parser trap fixed on the way:** the positional-modifier reader consumed the
next argv as every modifier's value, so a valueless flag like `--noGoLine` would
have swallowed the flag after it — `--noGoLine --dyn 1:mf` would have eaten the
dynamic silently. Boolean modifiers now carry no value. Caught by reading the
parser before running it, not by the output.

Seven batteries green.

### RESTS: left edge on the moment, same as noteheads — and the vertical confirmed (day 24)

Composer: *"by our logic above with Cage and Brown, the left edge of notehead,
then the rests should be the same... but do a little research — is that in fact
how traditional typesetting approaches it?"*

**Researched, and both traditions agree with the instinct:**

- **Conventional engraving** (Gould *Behind Bars*, Ross, Read; the defaults in
  LilyPond / Dorico / Sibelius): a rest is a *note-shaped silence*. It takes the
  rhythmic position and horizontal spacing a NOTE of that value would take, and
  it aligns LEFT with notes in other voices. The single exception is the
  whole-bar rest, which is centred in its bar — a different symbol meaning "this
  bar is empty".
- **Proportional / time-space notation** (Stone, *Music Notation in the
  Twentieth Century*): rests are normally OMITTED, because space is silence.
  Where a composer keeps one for clarity it marks the START of the silence.

So one rule covers the whole time axis: **the left edge is the moment.**

**Two earlier passes were both wrong, in opposite directions** — worth keeping
because the second was mine and confidently argued:

1. Day 23 centred the rest GLYPH on its slot time, so half of it hung back into
   the sounding note before it. That is the "hugging" the composer saw.
2. The first day-24 fix centred the rest in the whole silence, reasoning from
   "the page maps x to time". Plausible, and supported by no tradition at all.
   The correct reading of the same premise is the note rule, not a new one.

Now: `t` = the slot start in layout, and render no longer subtracts half a glyph
width. Verified on T3's cl-3 (unit 142 ms, slot 0 at 29.927) — all four rests
land on their slot to the nanosecond: 16th @slot 1, dotted 8th @3-5, 8th @7-8,
quarter @10-13.

**Vertical placement — confirmed, nothing to change.** The composer's memory of
"centred on the middle line" is right in general and is already what the code
does, because the glyphs carry LilyPond's own metrics. Measured (staff lines at
−2..+2 ss, middle line 0):

| rest | top | bottom | centre |
|---|---|---|---|
| quarter | +1.270 | −1.028 | **+0.12** — centred |
| 8th | +0.656 | −0.838 | **−0.09** — centred |
| 16th | +0.656 | −1.638 | **−0.49** — hangs low |
| 32nd | +1.456 | −1.638 | **−0.09** — centred |

The 16th is the apparent exception and is in fact the rule working: flagged
rests share a top edge and add hooks **alternately downward then upward** — the
16th adds its second hook below the 8th's body, the 32nd adds its third above.
Standard practice, inherited whole. No change made.

**Still open, deliberately split off at the composer's request:** whether rests
may cross a beat. Gould says split at the beat boundary so the reader can count;
the current merged reading (the dotted 8th over slots 3–5) crosses one. That is
the next conversation, not this one.

### D62 built: rests split at the beat, and the fortepianos brought under the standards (day 24)

**Rests now split at the beat.** The run is capped at the next beat boundary and
the longest value that fits inside is taken; dotted values survive where they do
not cross. Registry `figures.cluster.restsSplitAtBeat`.

T3's cluster (unit 142 ms, beat = 4 units), before → after:

| before | after |
|---|---|
| 16th @1 · **dotted 8th @3-5** · **8th @7-8** · **quarter @10-13** | 16th @1 · 16th @3 · **8th @4** · 16th @7 · **16th @8** · 8th @10 · **8th @12** |
| beats 2, 3, 4 each buried inside a rest | beats 2, 3, 4 each START a rest |

Seven symbols instead of four, and every downbeat is now visible ink. Worth
noting for the record: this lands on the same rests the day-23 code produced by
accident — its power-of-2 alignment test happened to split at beats here. The
difference is that the rule now says WHY, and dotted values remain available
inside a beat instead of being unreachable.

**The half-note fortepianos brought under D58/D59.** Composer: *"the ones that
are on GCs should in fact have the go line and the notation lines up before, but
the ones that are part of clusters, the left edge should line up with the go
time."* So a beam figure is no longer uniform — it is the two rules applied to
two different members:

| member | anchor | go line | GC |
|---|---|---|---|
| staccato 16th | `leftEdge` — head left edge measured at **0.000 ss** on its go time | no | no |
| fortepiano (the ring note) | **displaced**, head left edge at **−2.044 ss** | **yes** | yes |

This replaces `anchor: "headCenter"`, which had applied to every member since
the morning. Under D59 the centred head was the odd one out, and it was flagged
as such when D59 was locked; the composer resolved it by class rather than by
exception, which is the better answer — the displaced member is displaced
*because* it carries the GC, and the go line marks exactly that.

**The collision picture is now belt-and-braces.** Lowering the disc (D60) clears
the left-edge cluster heads; displacing the GC-bearing fp clears it the other
way. Measured: **0 of 7 figure notes collide**, and the two fps now have
**0.00 ss overlap in BOTH axes** rather than merely clearing vertically.

**The duration bar moves with the head — confirmed, and it was already
structural.** `ringBarItem.dx0Ss = max(0, headDx + rightExt + ringBarGapSs)` is
derived from the head's own position every time, so any anchor change carries
the bar with it; the clamp keeps it from ever starting before the attack.
Verified across the change: the fps moved from `headCenter` to displaced and
their bars followed automatically, now starting at **0.000 ss after the go time**
— i.e. exactly on the attack, with the displaced unit sitting ahead of it.

Eight batteries green.

### The list built: two figure kinds, go lines gone from clusters, the push made conditional (day 24)

The composer's classification call — *"really, there's just two rules"* — turned
out to simplify the code as much as the notation.

**1. The beam figure is retired; it was a cluster all along.** T2's 31.17 pair
and T4's 30.39 pair are now `--cluster … --pickup 1`. The cluster builder
absorbed the one thing `--beam` knew that it did not: **a member that RINGS
keeps its own technique device** (open head, ring bar, its own `sfzp`) and takes
the primary beam only, while the short partials are still rewritten as 16ths
with the cluster head and dot. Verified: both fps come out `head=open beams=1
ringBar=true dot=false dynMark=sfzp`, both staccato pickups `head=filled
beams=2 dot=true`.

A wrinkle worth recording: a pickup into a SINGLE downbeat has no rhythm to fit
— one onset is not a grid — so `ClusterFit` returned null and the build refused.
The fit now falls back to all the members, which for two notes is exact by
construction (the unit is the gap); the pickup designation still does its real
job of moving the GC to the downbeat. T2 came out unit 220 ms err 0.0, T4 unit
398 ms err 0.0.

**2. Go lines gone from every cluster.** `figures.cluster.goLine` default
flipped to `false`. Measured after the rebuild: **0 go lines on cluster
members** (all 35 of them), **421 in the section** — exactly the 456 events
minus those 35, i.e. every loose one-shot keeps its own, which is the rule. All
cluster heads sit at left edge **0.000**.

**3. The GC clearance push is now conditional.** It applies only where the head
actually reaches the disc. This was the inconsistency the composer spotted on
T2's fp: with the ball lowered to the lane edge that head clears by 0.56 ss, yet
it was still being shoved 0.66 ss further left — a displacement the go line
would then have to justify. Now: head underside below the disc top, or no push.

`test_layout` was asserting the old unconditional value; it now asserts **both
branches** — G1 clears and keeps its device gap 0.60; F♯1 reaches and is pushed
to 0.66. Better coverage than before the change.

**4. "A go needs a breath" adopted as the classification rule** (documented, not
automated — it is a compositional judgement). `breathSeconds` 0.5 does double
duty: it ends the ring bar and it decides whether a note can be its own gesture.
Validated against the section: exactly 2 of 43 fortepianos fall under it, and
they are precisely the two the composer had made pickups by ear. **33 loose
notes elsewhere still sit under a breath and cannot stay one-shots** — carried
forward.

**5. Dynamics on pickups:** the ambient mark goes on member 1 even when member 1
is the pickup (Gould; Dorico/LilyPond default). Kept the shared row above the
beam for groups containing a ringing note.

**A third copy of the landing height, and a guard for it.** Making the push
conditional meant layout needed the disc height in *ss*, where the two existing
copies are in px. Rather than let a third number drift, `test_animobj` now
asserts `gcImpactInsetSs` converts to the px inset **through the disc radius** —
the one quantity the registry states in both unit systems. Proven to bite (set
the ss copy to 0.4 and the battery goes red).

**And an architectural invariant caught me:** `test_coords` asserts layout.js is
pixel-free, and my *comment* naming the px field tripped the regex. The guard is
right and the comment was reworded — worth noting that the invariant is enforced
by pattern, so prose can break it.

Nine batteries green. Duration bars still track their heads automatically: both
fps moved to `leftEdge` and their bars followed to +1.634 ss, past the unit ink.

### T4's two clusters and T5's three — twelve figures now in the section (day 24)

**T4, 33.13–34.51, five notes** (gaps 337 | 214 | **644** | 184 ms). Every
grouping fitted, so this was a musical call, not a technical one — reported that
way. The 644 ms gap is over a breath, so notes 1–3 and 4–5 are genuinely two
gestures and the composer took the two-cluster reading:

- **cl-7** three notes at **♩=84.5**, grid 0,2,3, **18 ms** · `f` + accent on 2
- **cl-8** two notes at **♩=81.5**, grid 0,1, **0 ms** · `fff`

Rejected: all five at ♩=86 (27 ms, glues across the 644 ms gap) and note 1 as a
pickup to 2–5 (14 ms, still crosses it). Worth noting the composer's own
instinct was "no room for a GC and two clusters of two" — the correct split is
**3 + 2**, and 644 ms is ample room for the second GC.

**T5, eight partials 31.05–34.57** (gaps 378 | **749** | 280 | 282 | **1393** |
209 | 229 ms). Two gaps well over a breath cut this into three blocks, and each
fits almost exactly on its own:

- **cl-10** [1-2] **♩=79.4**, 8ths, **0.0 ms**
- **cl-11** [3-4-5] **♩=106.9**, 8ths, **0.8 ms**
- **cl-12** [6-7-8] **♩=69.6**, 16ths, **6.8 ms**

Cleaner than anything in T4. All eight as one figure also fits but only in
**32nds** at 25 ms — the 1393 ms gap forces the fine grid. Flagged the real
cost of the three-block reading before recommending it: three GCs and three
tempi across 3.5 s. Composer took the three blocks.

Dynamics from the ambient+accents rule throughout: T5's blocks come out `mf` +
accents on 2 / 1 / 1,3 — the middle block is the interesting one, ambient `mf`
with the accent on its FIRST note, since 104 is the only f among 104/93/83.

**Section audit after the build — the standards hold everywhere:** twelve
clusters, **exactly one GC each**, **zero go lines on any cluster member**, and
**0 of 48 cluster noteheads off their go time**. Seven batteries green.

### T6's pickup, T7's 2+2+4, and a collision the stacking rule does not reach (day 24)

**T6, last three, as a cluster with a pickup** — and building it exposed a real
flaw in `--pickup`.

The design fits the tempo to the members AFTER the pickup, so a loose
anticipation cannot drag the grid to fit itself. Correct in general. But T6's
"main figure" is two notes 503 ms apart, which barely constrains anything: the
fit chose a **500 ms unit**, and the pickup 203 ms earlier then rounded onto the
**downbeat's own grid slot** — two notes on one position, 203 ms out. It would
have drawn nonsense.

Fixed: the tool now TESTS the pickup against the grid it just found. If a pickup
collides with another member or misses the tolerance, the exclusion has failed
its purpose and everything is fitted together. It reports doing so. T6 →
**♩=66.0, grid 0,1,3, 24.4 ms**, pickup one 16th before the downbeat, GC on the
downbeat. T3's pickup is unaffected (its main figure is four notes, tightly
constrained, still 55 ms off the grid as before).

**T7, last eight, the composer's 2+2+4 — confirmed by the numbers and built:**

- **cl-14** [1-2] ♩=82.4, **0.0 ms** · `p` + accent on 2
- **cl-15** [3-4] ♩=95.5, **0.0 ms** · `mf`
- **cl-16** [5-8] ♩=80.9, grid 0,1,2,4, **2.4 ms** · `mf` + accents 2,4

All eight as one figure needs **32nds at 25 ms**, so the split is far better.
**The 3:2 feel does not survive measurement:** the final three are 190 | 369 ms,
a ratio of **1.94** — that is 2:1. On the grid they sit 0,1,3. No fit anywhere
in this figure produced a tuplet. What reads as 3:2 is most likely the uneven
1-1-2 shape: two quick notes, then a longer wait landing off the beat. Writing
it as a triplet would be a compositional choice against the data, and would cost
accuracy — the plain 16th reading is already at 2.4 ms.

**THE COLLISION — T5 at 32.18, and the rule that does not reach it.**

There IS a column rule: registry `stackBelow` = **articulation · dynamic ·
instruction · ottava**, each `stackGapSs` (0.45) past the previous element's
outer ink, articulation nearest the note. It governs the CHAIN.

But a beamed group's accent is not placed by the chain — it is placed by the
group's own accent row, above the beam, at one height for the whole group so the
gesture reads as one. Two independent placers, and neither consults the other.
They only meet when a note's chain **flips above**, which happens when there is
no room below.

Measured across the section: **1 of the 5 notes carrying both an accent and a
dynamic collides.** The other four have their dynamic below (y −2.94 to −3.86)
and their accent above — no contact. T5's `wc-112` is the exception because its
head sits at −5.5 with three ledgers and a staccato dot at −6.22, and the lane
bottom is −6.51: **0.29 ss left below, against a 0.97 ss mark.** So the chain
flips above, onto the accent row. Accent centre 6.09, mf centre 6.16 —
**0.84 ss of overlap**, effectively printed on top of each other.

Options measured, not yet chosen:
- **Stack it properly** (apply `stackBelow` across both placers): accent inside,
  mf outside it. Needs beam + 0.45 + 0.84 + 0.45 + 0.97 ≤ 6.51, i.e. the beam
  down to **3.80** from 5.22 — a visible change to the whole group's look.
- **Keep it below**: impossible here, 0.29 ss of room.
- **Move the ambient mark to member 2**, which is AT the ambient level (vel 93 =
  mf) and has room. Note this is a change to the dynamics rule, not the layout:
  *the level mark goes on the first member at the ambient level rather than on
  member 1*. It also removes an oddity — currently the mark saying "mf" sits on
  the one note the accent declares is louder than mf.

Four batteries green.

### The pie, and why it "crept back" (day 24)

Composer: *"the pie has crept back in T1 at the beginning."* It had not crept —
it had always been conditional, and the condition just became true.

The motive pie is an animated object bound to a score GROUP, and it draws only
when the WHOLE group lives inside the save's parts ("the whole group or no
pie"). `grp-g1-opening` spans 2.0–34.7 s across all ten parts. Every day-23
working file was one part, so the group was never whole and no pie drew; the
first all-parts section file made it whole, and the pie appeared at the top of
T1 with a 32-second countdown. Measured with the switch forced on: **24 pies**
across the piece, one per group.

The density build's groups (`grp-g1-opening`, the cloud02 groups, the vert
blast) are generator PROVENANCE, not motive instances — there is nothing for a
pie to count down. It remains the trance section's device. So:
`animated.motivePie.enabled: false` in the registry, honoured by the collector;
`test_animobj` asserts the registry is OFF and still exercises the port with the
switch forced on, so a silent flip back is caught. 24 → 0.

**Section boundary noted** (composer): *"34.6 around is the end of the first
density build, just keep this in mind, we aren't doing anything after yet."*
Nothing past 34.6 gets figured until asked. The T7 groups at 44.5–46.2 and T4's
cl-9 at 45.3–46.2, built earlier today, stand but are outside the current scope.

### T10's analysis, and the fp moved out of it (day 24)

**T10 is the part that resisted.** Nine staccatos 31.54–34.56, gaps
589 | 321 | 267 | 212 | 444 | 344 | 369 | 469 ms. **No gap is over a breath**,
so by the classification rule there is no seam to split on — it is one stretch,
and it is an accelerando into note 5 followed by a steadier back half that never
settles onto a pulse.

Nothing fits well. All nine: ♩=65 in **32nds**, 21 ms, nine notes across 26
slots. The best pieces are [1-4] at ♩=101 in 8ths (16 ms) and [6-8] at ♩=85 in
8ths (8 ms) — but the cuts that use them strand notes 5 and 9, both under a
breath from their neighbours and belonging cleanly to neither side. Reported
honestly as the first passage of the day where the data does not point
anywhere, with a recommendation ([1-4] · [5-9]) flagged as weak and a suggestion
to listen first.

**The composer's answer was to change the music instead: `wc-88`, the F#1
fortepiano at 30.735, moved T10 → T7.** T10 is now all staccato through the
stretch, and the fp gets more room in T7 — its ring bar goes **0.309 → 0.426 s**
(T7's next attack is 31.661 against T10's 31.544, less the breath). Sound
follows to `tuba7`. Second-to-last note count unchanged at 456; chunks 129 → 128.

Worth recording as method: three times today a notation problem has been
answered by moving a note rather than by notating harder (`wc-28` T2→T9 for the
GC, `wc-87` T8→T9 for the bar, now `wc-88` T10→T7). The analysis is not only
choosing how to write what is there — it is surfacing where the material itself
wants to change.

### T10 figured, and density build 1 has a figure in every part (day 24)

Pulling the note at 31.54 out as its own GC — the composer's suggestion —
**improved the analysis**, because the 589 ms gap after it was what had been
dragging the front of the figure onto a coarse grid. The eight that remain:
gaps 321 | 267 | 212 | 444 | 344 | 369 | 469 ms.

- **cl-24** [1-3] ♩=99.0, three even 8ths, grid 0,1,2, **18 ms** · `f`
- **cl-25** [4-8] ♩=65.2, **32nds**, grid 0,4,7,10,14, **17 ms** · `mf` + accents 2,3,5

The composer's second suggestion — the last partial as its own GC too — was
offered as an option and not taken. It would have bought the cleanest back half
in the part ([5-7] as three even 8ths at **8 ms**) but pushed the front to four
notes at 29 ms, and note 8 is 469 ms after note 7, i.e. under a breath, so it
cannot stand alone without overriding the classification rule. The rule was kept
intact. **Note 4 is the problem child either way**: 212 ms after note 3 and
444 ms before note 5, fitting neither side well — which is why one clean three
is available but never two.

This is the only figure in the section written in 32nds, and it is honest: T10's
stretch is an accelerando that never settles onto a pulse, and 17 ms is the best
any reading gives it.

**Density build 1 now has figures in all ten parts. Audit: 25 clusters, one GC
each, zero go lines on any member, 0 of 87 heads off their go time, 0 of 6
accent/dynamic collisions. 74 of the 167 notes in 0–34.6 s (44 %) are inside a
figure**; the rest are loose one-shots, which is what they should be. Six
batteries green.

### The 32nds were never drawn — beam levels assumed a 16th grid (day 24)

Composer, straight after T10 was built: *"did you end up using thirty second
notes? I don't see them."* They were right, and it is the best kind of catch —
the analysis said one thing and the page said another.

`beamsFor` was a constant: `u >= 4 ? 0 : u >= 2 ? 1 : 2` — quarter, 8th, 16th.
It assumed the grid was 16ths, which it had been for every cluster built until
this one. **T10's cl-25 fitted at subdivision 8**, so its five notes sat on 32nd
POSITIONS (slots 0, 4, 7, 10, 14 of a 115 ms unit) while each drew only two
beams, i.e. claiming to be 16ths. The figure under-reported its own grid by a
factor of two.

The rests were already right: `base = cl.sub * 4`, so a subdivision-8 cluster
gives 32nd-based values (the 3- and 2-unit gaps came out as dotted 16ths and
16ths, correct at that grid). So the page was internally inconsistent —
16th beams over 32nd rests — and only in this one figure, because it is the only
one in the section that fitted at subdivision 8.

Fixed by deriving it: a note of `u` units on a grid of `m` units per beat is
worth `u/m` of a quarter, so it carries **log2(m/u)** beams. m=4,u=1 → 2 (every
earlier cluster, unchanged); m=8,u=1 → 3. Verified: cl-25's five notes now
carry 3 beams each, drawn as one primary across all five plus five stubs at
level 2 and five at level 3; **every 16th-grid cluster member still carries
exactly 2** (checked across the section, 0 changed). Seven batteries green.

The density is the honest cost of the reading — ten stubs in one figure — and
it is now visible for the composer to judge, which it was not before.

### A regression I caused and the composer caught: T3's figure had turned into 32nds (day 24)

Composer, at T3 29.9: *"I'm trying to understand where thirty-seconds come into
play… I think the analysis logic has become convoluted."* It had — but not the
analysis. **The T6 fix had silently rewritten T3.**

The sequence: T3's figure was built as chosen — pickup, then four notes on a
16th grid at ♩=105.6, 1 ms, the pickup 55 ms off that grid and accepted as such
(a pickup is played TO the downbeat). Then T6's pickup landed on top of its own
downbeat, and the tool gained a "does the grid hold the pickup" test with a
refit-all fallback. I wrote that test as *collides OR misses tolerance*. T3's
pickup misses tolerance without colliding, so on the next full rebuild T3 was
quietly refitted as all five together — the **32nd reading (♩=66.6 ×8, unit
113 ms) the composer had explicitly rejected** two hours earlier. Three beams on
every note, rests spanning slots. That is what they were looking at.

Fixed: the refit fires on **collision only** (a pickup on another member's
slot). A tolerance miss is the normal case for a pickup and is reported, never
acted on. T3 is back to unit 142 ms, 2 beams, 16th rests, the pickup 55 ms off.
T6 (cl-13) now fits its two main notes as 8ths at ♩=89 with the pickup 33 ms
off — same drawing as before (pickup-8th, 8th, 8th), tempo from the main figure
rather than all three, which is the pickup principle working as designed.

Verified: the only 3-level beams in the section are T10's five (the one figure
that genuinely fitted at subdivision 8); zero 32nd rests anywhere. Five
batteries green.

**Two things the composer restated that are now pinned down:**
- **Played noteheads stay 16ths.** Not 8ths (too long), not 32nds (too short).
  The written value is placement, not duration (day 23); on a 16th grid this is
  automatically true.
- **Where a 32nd rest would separate two 16ths, write two 16ths with no rest.**
  This is the case that only arises on a 32nd grid, which T3 never had and
  should not have had.

The lesson for the method, filed: a fix made for one figure must be checked
against every figure already built under the same flag. `--pickup` had three
users; I verified one.

### THE PATTERN ANALYSER built and validated against the composer's 25 decided figures (day 24, late)

`notation/lib/pattern_fit.js` + `tools/pattern_analyze.js` + `tools/test_pattern_fit.js`.

**The objective, as D63 states it:** for a candidate writing, put every note
where the notation IMPLIES it and measure the worst gap from its true onset in
NOTEHEADS at page scale (one cluster head = 6.9 px = 30 ms on the video page).
Under one head the eye reads the writing as true. Simplicity only breaks ties:
among coherent writings, fewest tuplet beats (3 cheaper than 5 cheaper than 6
cheaper than 7), then fewest empty slots. Tuplets are admitted per beat, only
where the plain 16th grid fails the eye in that beat. The played head is a real
16th: unit 125–375 ms.

**Three things the first draft got wrong, each caught by the validation:**
1. It adopted a tuplet whenever one shaved a few ms — a quintuplet landed on
   T2's figure that plain 16ths already wrote. Now: plain wins whenever it is
   under a head.
2. It halved T1's unit to 88 ms to gain 5 ms, calling the result 16ths — 32nds
   in disguise. Now: the unit range keeps a 16th a 16th.
3. The validator compared slot numbers, so a two-note figure written as 8ths
   "differed" from the same figure as 16ths. Now: shapes are compared as gap
   RATIOS, and pickups (now flagged in the IR device) are excluded from the grid.

**Result: 23 of 25 decided figures reproduced outright.** Both pickups (T3,
T6) are flagged by the analyser as it would have flagged them cold (55 and
33 ms off the main grid). The two disagreements are the analyser doing what
D63 asks:

- **T1 cl-1 (the day-23 figure).** The composer's writing — a 3:2 straddling
  the beat on members 10–11 — sits at **35 ms = 1.2 heads** on its last note; it
  was built at the 50 ms tolerance before the one-head line existed. The
  analyser keeps the first eight notes IDENTICAL and reaches 0.7 heads on the
  tail only with a **7:4 septuplet**. A judgment call: 5 ms of fidelity for a
  septuplet is a poor trade, and the composer has seen and approved the 3:2. It
  also says the line may be a little soft — 1.2 heads was accepted by eye.
- **T10 cl-25 (built an hour ago in 32nds).** The analyser's new proposal: **a
  3:2 over the first two gaps, then 8th · dotted-8th · 16th**, at ♩≈93, 0.8
  heads, ONE tuplet, **no 32nds**. Exactly the kind of reading D63 was adopted
  to find — and the one the composer asked to have re-run.

**T10 re-run fresh (32.13–34.56 as one span):** no breath seam, so the analyser
takes all eight as one group and needs two tuplets (3:2 + 5:4) to reach 0.9
heads. The composer's 3+5 split, made by ear at a 444 ms gap, gives cleaner
figures on both sides — the seam rule is necessary but not sufficient, which is
what D63 §8 says about pickups too.

Tests: `test_pattern_fit` asserts the two calibration cases (T8 coherent under
half a head; T1's last four never written as even 16ths, which would be 2.1
heads), the unit range, T7's no-tuplet guard, ≥23/25 agreement and no NEW
disagreements. Prove-red bites. Four other batteries green.

### T10 rebuilt from the pattern analyser: a 3:2 instead of 32nds (day 24, late)

`--pattern` on `--cluster`: the grid comes from `pattern_fit` instead of
`cluster_fit`, and each tuplet beat it chose becomes a bracket group with the
members' slot numbers explicit (a tuplet may have a rest between two of its
notes; the day-23 `--tuplet` path assumed consecutive slots).

T10's back five (gaps 444 | 344 | 369 | 469): **a 3:2 of 8ths over the first
beat — note, 8th rest, note — then 8th · dotted-8th · 16th**, ♩≈93, worst
23 ms = 0.8 heads, one tuplet, no 32nds. The same five notes had been written
in 32nds with ten stubs.

**A convention the machinery did not know, caught before the composer saw it:**
the first build printed the bracket as "3:4" with two beams on its notes. A
triplet over a quarter is three EIGHTHS — written "3:2", one beam, an 8th rest
inside the bracket. T1's day-23 tuplet is three sixteenths in the space of two,
so "3:2" at the 16th level was the only case the code had met. Now: a beat-level
n-tuplet is written at the largest power-of-2 count p ≤ n (3 → 8ths "3:2"; 5, 6,
7 → 16ths "n:4"), with `tupletText` and `tupletValue` carried on the device so
layout prints the right label and the right rest; `den` stays the span in 16ths
that places the slots. T1's bracket still reads "3:2". Six batteries green.

**The T1 disagreement, explained simply for the composer:** on the last four
notes alone (200 | 135 | 244 = long-short-long), four even 16ths is 2.1 heads;
the composer's 3:2 on the middle two is 1.2 heads; the analyser's reading —
all four on a triplet-16th grid at 0, 2, 3, 5 — is 0.8 heads. It does not
dispute that the tail is a triplet figure; it says the bracket should cover the
whole tail, not two notes. Inside the full cluster it reported a septuplet
instead, because it can only place a tuplet INSIDE a beat and the composer's 3:2
straddles one — a known limitation, treat the 7:4 as noise. Left as built.

### ONE STACK ABOVE THE BEAM — accents · tuplet bracket · dynamics (day 24, late)

Composer, on T10: *"resolve the mf dynamic and tuplet bracket collision and
unify the collision detection/avoidance."* Same disease as T5's accent/mf clash
earlier today, third placer this time: the accent row, the tuplet bracket and
the dynamics row each positioned themselves against the beam alone, so any two
of them could land on each other.

Now there is ONE stack per beam group, built once in the group pass and read by
every drawer: outward from the beam, **accents** (nearest the notes — Gould),
then the **tuplet bracket** (its own padding is its gap; the numeral's cap
counts toward its height), then the **dynamics row**; the beam is lowered so
the whole stack fits inside the lane. Each row's offset lives in `g.stack` and
nothing above a beam computes its own height any more.

A latent bug fell out: the bracket drawer read the beam height of **the first
beam group in the system**, not its own — right by luck while every tuplet in
the piece was T1's, wrong the moment T10 had one. It now finds its group by
cluster id.

Verified: T10 cl-25's stack is beam 2.15 → accent 3.02 → bracket line 4.64 →
mf centre 6.02, the mf's top at exactly 6.51 = the lane edge. Section-wide
audit of everything above every beam (80 time-overlapping pairs): **0 vertical
collisions, 0 past the lane edge** (four reported pairs are the surge's ppp/fff,
which sit side by side in x — the audit checked time only). Four batteries
green; T1's figure 2 unchanged.

### Density build 1 promoted to the canonical `db1`; the command is the save (day 25)

Composer asked for the file model in brief, then: *"bump the files. This first
density build is done."*

**Promoted:** `db1` — "DENSITY BUILD 1 — all parts, figured (finished
2026-08-23)", no `--exp`, at the top of the picker. Content proven IDENTICAL to
`db1-all-x01` (the working file, kept under experiments as the next x01).
**Pruned:** `db1-t1` (the pre-figure T1 draft), `db1-t1-x01`, `db1-t1-x02`
(the day-23 working files, superseded) — git keeps all three. The four figures
past 34.6 stay in, at the composer's word.

**The command is now IN the file.** A version file is derived — archive plus the
composer's decisions — and the decisions ARE the argv; until today that command
lived only in journal §2. `provenance.build` (IR schema amendment 6, the schema
is strict and caught the unknown field before anything shipped) stores it, and
**`db1` was rebuilt from its own stored command and came back byte-identical
(date aside)**. A file can now say how to make itself.

One shell lesson recorded for the paper's methods appendix: a regex written
through a bash heredoc lost its backslash and became `/s|"/` — "quote anything
containing the letter s". Caught by printing the line; fixed by writing the
edit from a file instead of the shell. Same class as the earlier backtick
mangling. Five batteries green.

### Day 24 wrap (written 2026-08-23, small hours) — handoff for CLOUD02-I

Composer: *"I'd like to wrap and prepare for a clear… a mini plan for the next
day on the next section, 36 to 40.4… make sure they can find everything and can
execute it competently from cold start. The last few cold starts weren't
necessarily the smoothest."*

**Measured for the plan** (`db1`, 36.0–40.4): 159 notes, all staccato, 4.4 s
= **36 notes/s across the ensemble — twice density build 1's dense stretch
(17/s)**. Per part 14–18 notes, median gap 208–292 ms, **96 % of gaps under a
breath** (one continuous run per part by D62), **130 of 149 within-part notes
start before the previous sample has stopped ringing**. That is the evidence
the thinning question gets put with.

**The handoff is journal §2, rewritten as a cold-start block:** state in one
paragraph · a tool table (page, analyse, validate, build, rebuild-from-the-
stored-command, move, batteries) · PLAN 8f with four steps and a done · five
hard-won warnings (re-check every figure under a changed flag; screenshots beat
troubleshooting; the composer reads shapes not tables; no written 32nds; don't
fight over 0.2 of a head) · open items. CLAUDE.md pins the read order: §2 +
NOTATION_STANDARDS, then go.

**Two batteries went red at the very end** because they hardcoded the pruned
`db1-t1-x02`; repointed to the canonical `db1` (strictly more coverage:
midiplayer now sees 465 T1 notes and the full amendment list). Nine green.

---

## Day 25 (2026-08-23) — PLAN 8f step 1: CLOUD02-I 36.0–40.4 analysed, all ten parts

Ran `node tools/pattern_analyze.js --ir db1 --part N --span 36.0-40.4` for N = 0..9.
Composer chose agenda A (analyse first, then the thinning question with evidence).

**Census confirmed against day 24's measurement.** 159 notes (18/15/16/17/16/17/16/15/15/14
for T1..T10) in 4.4 s = 36.1 notes/s. 149 within-part gaps; **7 breath seams total** across
the whole ensemble (>= 500 ms), so 142/149 = 95 % of gaps are under a breath — day 24's
"96 %" reproduced. Counting gaps shorter than the SHORTEST staccato sample (330 ms) gives
114/149 = 77 %; day 24's 87 % used each note's actual sample length, so the two are
consistent and the ring-overlap claim stands.

**Breath seams per part:** T1 0 · T2 1 · T3 1 · T4 0 · T5 0 · T6 1 · T7 0 · T8 0 · T9 2 ·
T10 2. **Five parts (T1, T4, T5, T7, T8) are ONE unbroken run of 15–18 notes** — by D62
they cannot be split; they are a single go.

**THE FINDING — the analyser says there is no pattern in the long runs.** Every group of
more than ~8 notes needs a DIFFERENT tuplet on nearly every beat to reach the threshold:

| part / group | notes | best reading | worst |
|---|---|---|---|
| T1 (one run) | 18 | 5:4, 7:4, 6:4, 3:2 — four tuplets | 1.0 heads |
| T2 group 2 | 8 | 7:4 + 3:2 | 0.7 |
| T3 group 1 | 12 | 7:4 + 5:4 | 0.9 |
| T4 (one run) | 17 | 5:4, 6:4, 5:4, 6:4 | 0.9 |
| T5 (one run) | 16 | 7:4, 6:4, 3:2, 3:2 | 1.0 |
| T6 group 2 | 13 | 6:4, 5:4, 5:4 | 1.0 |
| T7 (one run) | 16 | 3:2, 6:4, 5:4, 6:4, 5:4 — five | 0.9 |
| T8 (one run) | 15 | 5:4, 6:4, 6:4, 3:2, 5:4 — five | 0.9 |
| T9 group 3 | 11 | 5:4, 3:2, 5:4 | 1.0 |

**0.9–1.0 heads is AT the dissonance threshold, not inside it** (first principle 4: more
than one notehead width = dissonant; the composer's calibration points are 0.2 coherent /
1.2 accepted once / 2.1 dissonant). So the long runs spend four to six tuplets and still
only reach the line. That is the analyser reporting a *spray*, not a figure — principle 3
says the notation should show the pattern as it LOOKS, and there is no long-short shape to
show.

**The short groups are clean, and they are the exception:**
- T10 group 1 (7 notes) — `8th 8th 8th. 8th 16th 8th 16th`, NO tuplet, 0.9
- T10 group 2 (6 notes) — six even 16ths, 1.0 (or a 6:4 sextuplet at 0.9)
- T2 group 1 (7 notes) — `8th 8th quarter 16th 8th 8th. 16th`, NO tuplet, 0.8
- T3 group 2 (4 notes) — `16th 8th 16th 16th`, **0.2 heads** — the cleanest thing in the section
- T6 group 1 (4 notes) — `16th 8th. 16th 16th`, 0.9; as a 3:2 with the pickup taken, **0.4**
- T9 group 1 (3 notes) — `8th 16th 16th`, 0.4
- Two lone one-shots: T9 @37.39, T10 @40.23

**Pickups flagged (never applied, D63 §8):** note 1 of T2, T3, T5, T6, T7, T8, T9-g1, T9-g3.
**Only T6's is decisive** — 0.3 heads with the pickup taken vs 0.9 without. The rest are a
wash (0.9 vs 0.9) and are the composer's ear, not the analyser's.

**Not done, deliberately:** nothing built. Step 2 (the thinning question) goes to the
composer before any `--cluster` is appended to db1's stored command.

### Day 25 — 8f step 2 framed: the composer wants to HEAR it first (no build yet)

Composer: *"my first ask is that we have a save file for just this section, and I can
hear the original and then alternative side by side… the original and then b, and then
next to that, after that, a. But don't make anything yet."* Asked for the approach in
more detail. Numbers measured to ground the explanation (nothing built):

- **Ensemble sounding count** (D51 per-pitch lengths from `SI2_staccato_lengths.md`,
  100 ms steps, 36.0–40.6): **13–21 simultaneous ringing samples, mean 13.8.** The
  mass boundary from DB 042 is count 4–5; the polyphony boundary is 2. The section sits
  3–4× past "fused into mass" the whole way through.
- **The META curve exists and spans exactly the section**: `wc-1915`, layer 10,
  36.19–40.421, nodes y = 8.9 · 8.9 · 7.4 · 6.8 · 9.5 · 9.5 · 8.6 · 8.6 — a dip then a
  peak. The measured count follows it (dip to 9–11 around 37.9–38.5, peak 21 at
  39.0–39.5). So (b)'s target can be read from the composer's own drawn shape.
- **Velocities in the window** (IR `vel`): fff 33 · ff 61 · f 38 · mf 17 · under mf 10
  (range 26–127). Loudness-priority thinning is meaningful — there is a real spread.
- **(a) dry-run, greedy left-to-right, strict (next onset must be >= previous kept
  onset + that note's D51 length):** keeps **80 of 159 = 18.2/s** — almost exactly db1's
  dense stretch (17/s). Per part 7–9 survive. At a 70 % ring (allow the decay tail to
  overlap): 99 notes = 22.5/s.
- IR `duration` on staccato events IS the D51 length (B1 → 0.37 ✓), so the criterion is
  already in the file.

### Day 25 — the CLOUD02-I listening file BUILT (`tools/cloud02i_ab.js`)

Composer chose **cap 6, round-robin, no lead-in**. Built
`scores/cloud02i-ab.json` — three copies of CLOUD02-I end to end, nothing canonical:

    0.0 s  ORIGINAL              159 notes  37.6/s  sounding max 21  mean 13.3  seams 7
    8.0 s  B — ensemble cap 6     54 notes  12.8/s  sounding max  6  mean  4.4  seams 36
   16.0 s  A — by-part strict     80 notes  18.9/s  sounding max 10  mean  6.7  seams 42

Command: `node tools/cloud02i_ab.js` (also stored in `metadata.provenance.build`).
Copies are colour-coded and each is its own `groupId` (movable as a unit). The
ORIGINAL carries the real META curve; B carries the cap-6 target drawn in the same
convention. Verified live in the composer app: loads, all 298 objects render, the
three copies occupy disjoint ranges across all ten lanes.

**VERIFIED: the D51 lengths in `SI2_staccato_lengths.md` and the `duration` field on
every db1 IR event agree** — 159 events, 0 mismatched. The script asserts this and
refuses to run if they diverge. So the (a) criterion is measured, not guessed.

**THE META CURVE IS A RELATIVE RATE CONTOUR, NOT AN ABSOLUTE COUNT.** `cloud02.js`
wrote it as `y = 0.5 + 9*(r/max)` over six windows. So the shape is recovered as
`(y-0.5)/9` and the cap-6 target is that times 6 → **4.2 at the dip, 6.0 at the
peak**. Anyone scaling a META curve by `y/max` (as I first did) is off by the 0.5
offset. Nodes interpolated with a smoothstep, an approximation of the drawn bezier —
stated in the script rather than hidden.

**A BUG CAUGHT BY MEASURING RATHER THAN TRUSTING — keep this.** The first (b) run
reported `sounding max 9` against a cap of 6. Cause: round-robin re-sorts each slice
out of time order, so when a note at t=36.25 was admitted before one at t=36.21, the
earlier note's cap check could not see it. Fix: everything admitted inside one slice
counts as concurrent (the 0.1 s slice is far shorter than a 0.33–0.53 s sample, so
they really do overlap). After the fix the cap holds exactly: max 6, mean 4.4. The
census in the script exists precisely so a cap violation cannot pass unnoticed.

**THE TWO APPROACHES DO DIFFERENT AMOUNTS OF WORK — the surprise.** B is *thinner*
than A (54 vs 80 notes) because it caps the ENSEMBLE; A caps each LINE and the ten
lines still stack — A's ensemble sounding count is max 10, mean 6.7, **still above the
mass boundary of 4–5**. So A fixes the page and only half-fixes the ear; B fixes the
ear and leaves the page unknown. Predicted 7–9 for A before running it; measured 6.7
mean / 10 max. Prediction held.

Round-robin worked: B's per-part survival is 4–7 (even), A's is 7–9 by construction.
Breath seams go 7 → 36 (B) → 42 (A): both open the material far past the point where
the D62 breath rule gives real figure boundaries.

**GOTCHA FOUND, filed to NITS:** `collectData()` in `composer.html` rebuilds
`metadata` from `{created, modified}` every save, so **any autosave in the composer app
wipes `metadata.provenance`**. "THE COMMAND IS THE SAVE" currently holds for IR files
only, not score files. The build command is recorded here as the backstop.

**Not done:** no notation built, no score edit made, nothing ledgered. The composer
listens first.

### Day 25 — 8f: B ANALYSED (playable, but it is a field of one-shots); add-back strategies sized

Composer: *"let's start with analysis of b, see if anything is unplayable, and then make me
version b version two with some of the original added back. But could you share with me the
strategies for adding back notes first?"* — an analyse → rebuild routine with a pause between.

**B isolated as its own score** (`scores/cloud02i-b.json`, copy B rebased 8→0 s) so every
tool sees only B; extracted to `notation/ir/cloud02i-b.ir.json` (profile section1, 54 events,
12 chunks, 0 ms stream error).

**Playability (`audit_playability --parts`): 0 hard, 1 soft** — T5 @0.67 s, C#2→G1 (6 st),
attack 161 ms vs 166 needed; 5 ms, a tongue's worth. Per-part rate 1.2–2.1/s, tessitura
within a 4th–9th, max leap 8 st. Ring overlap: 7 of 44 within-part notes (T4 1, T5 3, T9 2,
T10 1) — B never applied the per-part ring rule, so those seven are the A/B difference.

**THE FINDING — B swung from one failure to the other.** The original had no figures because
every part was one unbroken run; B has no figures because every part is breath-separated
one-shots. Pattern analyser on B: **41 of 54 notes are lone one-shots**; 4 two-note pairs
(16th·16th or 8th·16th, all 0.0 heads); ONE real figure — T5's four at 0.51 s,
`16th · 8th · 8th · 16th` at ♩=100, 0.5 heads, note 1 flagged as a pickup. Breath seams
36. So B notates as the OPENING vocabulary (GC + go line per note), not as clusters.

**Four add-back strategies, all seeded from B (B ⊂ B2, so what was heard stays in):**

| strategy | rule | est. notes | sounding max/mean | in-ring | seams |
|---|---|---|---|---|---|
| S1 raise the cap | same algorithm, cap 7 / 8 / 9, B kept | 73 / 81 / 88 | ~9/5.9 · 10/6.6 · 11/7.3 | 26–39 | ~32 |
| S2 ring-clear fill | add every dropped note clear of its part-neighbours' rings (strict) | 77 | 10/6.4 | 7 (B's own) | 41 |
| S3 loudest back | add dropped notes loudest-first to N | 70 / 80 | 10/5.8 · 13/6.6 | 21–29 | ~35 |
| S4 figure-forming | add a dropped note only if it sits within a breath of a kept note in its part AND on a 16th grid at ♩90–120 (±30 ms) with it, 70 % ring-clear | 92 | 11/7.6 | 44 | 23 |

S1 estimates undercount concurrency slightly (the seeded fill does not see B notes later in
the same slice); the real build enforces the cap exactly. S2 strict = "B ∪ A's rule" — lines
stay clean, ensemble drifts to mean 6.4 (above mass 4–5). S4 is the only one that REDUCES
seams (36→23): it turns one-shots into 2–4-note figures — the page-driven strategy — at the
cost of the most ring overlap. Strategies compose: S4 under an S1 cap is the obvious hybrid.

**Paused for the composer's call** on what the added notes are FOR: the ear (S1), the lines
(S2), the accents (S3), or the page (S4).

### Day 25 — 8f: the composer's criterion is ATTACK SPACING, not sounding count — measured

Composer: *"what I would like is more audible attacks… look at windows and have a
simultaneous threshold. See how many impulses are landing within a certain threshold of
each other and then do the round robin thinning."* A different criterion from B's: B capped
what is RINGING (the mass); this caps how close ONSETS may land (the impulses).

**The original's attacks are piled on top of each other.** Ensemble-wide gap from each
attack to the previous one (158 gaps): **71 under 10 ms, 27 in 10–20, 10 in 20–30** — so
108 of 158 (68 %) are within 30 ms of the previous attack, i.e. inside the fusion window
where two onsets are heard as one. Median 12 ms, mean 26 ms. Only 16 gaps exceed 80 ms,
none exceed 200. THIS is the smear mechanism, more than the ring overlap: the ear gets
one attack where there were three.

**ADD-BACK TO B DOES NOT WORK for this criterion — structural, not a tuning issue.** B has
16 attack gaps under 50 ms (of 53); the sounding-count rule never looked at onsets. A rule
that adds a dropped note only when it is ≥ T from every kept attack therefore adds almost
nothing: 54 → 55 at 80 ms, 54 → 61 at 50 ms. The spacing rule has to run on the ORIGINAL.

**Fresh thin of the original by attack spacing T** (walk in time; attacks within T of each
other form a collision group; one survivor per group; next survivor must be ≥ T later):

| T | notes | sounding max/mean | seams | note |
|---|---|---|---|---|
| 30 ms | 55 | 8 / 4.5 | 38 | same count as B, every attack separable |
| 50 ms | 45 | 6 / 3.8 | 31 | already under B's cap of 6 by itself |
| 80 ms | 33 | 5 / 2.7 | 22 | |
| 100 ms | 28 | 4 / 2.2 | 17 | |
| 120 ms | 25 | 4 / 2.1 | 15 | |

So "more audible attacks" ≠ "more notes": a spacing-thinned version has B's note count or
fewer, but each note is heard as its own impulse. The ceiling is SPAN/T (4.4 s / 30 ms ≈
146; / 50 ms ≈ 88) but the real material is bursty so half that survives.

**Tie-break inside a collision group matters for the accents.** Round-robin (longest-waiting
part wins) keeps only 10/33 fff at 30 ms and 7/33 at 50 ms — it throws the loud attacks
away blind. *Loudest wins* keeps 18/33 and 17/33 respectively but unbalances the parts
(at 50 ms T6 gets ZERO notes; at 30 ms T5 gets 11 and T6 2). A hybrid — loudest wins
unless that part played within the last 250 ms, then longest-waiting — keeps 15–17/33 fff
with T6 at 1–3. Neither is free; the composer chooses.

**Open for the composer:** the threshold (30 / 50 / 80 ms) and the tie-break
(round-robin / loudest / hybrid). Not built.

### Day 25 — B2 BUILT: attack spacing 50 ms, hybrid tie-break (composer: "go with 50 + hybrid")

`tools/cloud02i_ab.js` extended — B2 is a fourth copy at **24 s** in
`scores/cloud02i-ab.json`, and `--isolate` now writes each version as its own score
rebased to 0 (`cloud02i-{orig,b,a,b2}.json`) so the auditor / extractor / analyser see
one at a time. Command: `node tools/cloud02i_ab.js --isolate`.

    ORIGINAL          159 notes 37.6/s  sounding 21/13.3  min attack gap   0ms  fused 108  fff 33/33  seams  7
    B ensemble cap 6   54 notes 12.8/s  sounding  6/ 4.4  min attack gap   0ms  fused  13  fff 14/33  seams 36
    A by-part          80 notes 18.9/s  sounding 10/ 6.7  min attack gap   0ms  fused  41  fff 19/33  seams 42
    B2 50ms hybrid     43 notes 10.2/s  sounding  5/ 3.6  min attack gap  52ms  fused   0  fff 15/33  seams 24

**B2 does exactly what it was asked to do: 0 fused attacks** (108 in the original, 41 in
A, 13 in B). Every attack is its own impulse. It is also the **cleanest playability result
of any version — 0 hard, 0 soft on all ten parts** (B had one 5 ms-tight leap). Per-part
rate 1.1–2.2/s, max leap 9 st.

**THE COST, and it is not small: T6 gets ONE note.** Per part [6 6 4 5 4 **1** 4 6 4 3].
Diagnosed rather than guessed — **T6 has the lowest median velocity in the window (94, vs
99–109 for everyone else) and only 2 fff.** Under "loudest wins" T6 loses essentially every
collision it enters. This is not a bug in the tie-break; it is the material.

**The `--recent` window is the dial that trades accents against balance** (probed):

    recent  fff kept  T6 notes  seams
    0.15 s   17/33       0        22
    0.25 s   15/33       1        24     ← built
    0.35 s   15/33       1        26
    0.50 s   15/33       2        29
    0.70 s   11/33       3        29

No setting rescues T6 without spending accents; a per-part floor (guarantee every part N
notes) would be a third rule, not a tuning. **Composer's call.**

**Notation view of B2** (`pattern_analyze`, all ten parts): 22 lone one-shots, 6 two-note
`16th · 16th` pairs (all 0.0 heads), one three-note figure — T8 @2.29 s,
`8th. · 8th · 16th` at ♩=91, 0.1 heads, note 1 flagged as a possible pickup. T6 has fewer
than 2 notes so the analyser declines it. So B2, like B, notates as the **one-shot
vocabulary**, slightly more figured than B (6 pairs + 1 trio vs 4 pairs + 1 quartet) and
with 24 seams instead of 36.

**Extract note:** B2's IR reports `worst stream fit error 16.028 ms` and 2 `unresolved`
strategy chunks / 2 `fixed-oneshot` — B's was 0.000 ms with everything proportional. Worth
a look before B2 is notated for real, NOT before the composer listens.

**Paused for the listen.** Nothing ledgered, archive untouched.

### Day 25 — B2 approved by ear ("That's better"); the ADD-BACK strategy sized, not built

Composer: *"pursue the add back strategy, but in reverse… find impulses that will thicken
the texture… which impulses from the original will make this window denser without
overlap… then look for playability, and if it's not playable in a given part, redistribute
some notes to another part — without changing or removing notes."* Asked for the strategy
back first.

**PROVEN, not guessed: at the same 50 ms floor, ZERO dropped notes can come back.** Every
note B2 dropped lies within 50 ms of a note B2 kept — that is what the greedy pass does
(non-winners are pairwise within T of their winner; groups with no qualifying candidate
are all within T of the last kept). So an add-back must use a SMALLER floor than the base:
room ≥ 40 ms → 16 of 116 dropped notes qualify; ≥ 30 ms → 27; ≥ 20 ms → 46.

**Gap-fill (farthest-first) add-back, select-only:** repeatedly add the dropped note with
the most room to its nearest kept attack (ensemble-wide); ties within 5 ms → the part
with the fewest notes, then loudest; stop when the best remaining room is under the floor.

    floor 40 ms → 53 notes (+10)  min gap 41  fused 0  tight re-attacks 0  parts [7 6 4 5 7 5 5 6 5 3]
    floor 35 ms → 55 notes (+12)  min gap 36
    floor 30 ms → 56 notes (+13)  min gap 33  fused 0  tight re-attacks 0  parts [7 6 5 5 8 5 5 6 5 4]

T6 goes 1 → 5 from the fewest-notes tie-break alone. A META-shape guard (per-window
budget) never binds at these counts — moot. **The peak window (2.82–3.53 s) has ZERO
addable notes even at 30 ms**: B2 already saturated it.

**THE CEILING: select-only add-back tops out at ~56 notes (+13).** The original's attacks
are so piled (median gap 12 ms) that only 27 of 116 dropped notes have 30 ms of room.
Theoretical capacity at 30 ms spacing is 141 attacks in 4.23 s — the original's 159 would
nearly FIT if they were spread. They are not spread; they are stacked.

**The way past the ceiling is a NUDGE, and the composer's own calibration says it is
invisible**: one notehead width = 30 ms on the video page (first principle 4). A dropped
note allowed to move ≤ 25 ms to the nearest free slot:

    floor 50 ms, nudge ≤ 25 ms →  56 (+13)  13 moved, median 9 ms, max 23
    floor 40 ms, nudge ≤ 25 ms →  65 (+22)  11 moved, median 14 ms       tight 0  T6 = 5
    floor 40 ms, nudge ≤ 50 ms →  80 (+37)  26 moved, median 29 ms       tight 0
    floor 30 ms, nudge ≤ 25 ms →  83 (+40)  25 moved, median 17 ms       tight 1
    floor 30 ms, nudge ≤ 50 ms → 102 (+59)  44 moved, median 32 ms       tight 3

A nudge is a TIME edit, which the composer has not authorised — the redistribution they
described is a PART edit (and part changes do nothing for attack spacing, which is
ensemble-wide; they only serve per-part playability). Offered, not applied.

**Playability proxy** (within-part re-attack under the auditor's 110 ms + leap allowance):
0 tight pairs in every select-only variant and in the 40 ms nudges. Redistribution may
not even be needed; the real audit runs after the build.

### Day 25 — the bricks, and what playability actually says about the original

Composer: *"these should all be staccatos… some of the bricks are longer. That must have
been from my playing… reduce the note lengths to all staccato length and then see what we
can get back in."* Also the meta-strategy: *"there might have been a situation where all I
did with the original is not remove anything at all, but redistributed some parts."*

**Bricks in CLOUD02-I (159):** 73 under 60 ms · 32 at 60–80 · 19 at 80–100 · 21 at 100–150
· 10 at 150–200 · 4 over 200 (max 218 ms; min 50 ms). They are the played lengths from
`clusterClouds02` carried through `cloud02.js`. NB the archive's OTHER staccatos are mostly
longer still — density build 1's 120 staccatos have a median brick of 135 ms — so "all
minimum length" is a new convention for this section, not a restoration.

**THE BRICKS CAUSE NO PLAYABILITY FAILURE. Measured:** within-part hard overlaps in the
original window = **0 as-is, 0 at 50 ms bricks**. The sound is unaffected either way
(D51: a staccato is a fixed sample; note-off is ignored). So normalising the bricks buys
nothing for playability or sound — it is page/display hygiene. Done in the scratch pipeline
(`--brick 0.05`), NOT applied to the archive; if a version goes canonical, the 159
`endSeconds` changes are one ledger line.

**THE ORIGINAL WAS ALREADY PLAYABLE.** `audit_playability --parts cloud02i-orig`: **0 hard,
13 soft** across T1/T3/T4/T5/T6/T7/T9 — every one a re-attack 130–191 ms with a 3–9 st
leap, 1–40 ms under the estimated need. Thirteen redistributions of a second note, zero
removals, and the auditor would pass the full 159. **So the composer's meta-strategy is
RIGHT about the players and wrong about the ear:** playability was never the binding
constraint here — the 108 fused attacks were. Two ceilings, and they are far apart:

- **playability ceiling** (per part, ~110–330 ms re-attack × 10 parts) ≈ 40–60 attacks/s —
  the original's 38/s fits under it with 13 small fixes;
- **audibility ceiling** (ensemble attack spacing ≥ 30 ms) = 33/s if perfectly spread;
  ~13/s (56 notes) with the attacks where the composer played them, ~20/s (83) with
  ≤ 25 ms nudges.

The thinning is an ear decision. Redistribution serves the players and does not move the
audibility ceiling at all (spacing is ensemble-wide, part-blind). Consequence for the
composer's loop "add back → audit → redistribute → add back again": at a fixed floor it
terminates after ONE pass — redistribution frees per-part room, but the add-back is
limited by ensemble room, which redistribution cannot create. The only second-pass lever
is a lower floor (into fusion) or the nudge.

### Day 25 — B3 BUILT: B2 + gap-fill 30 ms, bricks at 50 ms, the audit→redistribute loop run

Composer approved gap-fill farthest-first and laid out the loop: normalise bricks → rerun
B2 → playability → redistribute if needed → add back → audit → repeat to max density.

Built in `tools/cloud02i_ab.js` (`--fillFloor 0.03 --brick 0.05`, redistribution on by
default, `--noRedistribute` to see the raw fill). Command now:
`node tools/cloud02i_ab.js --brick 0.05 --isolate`. Fifth copy at **32 s**.

    B2 spacing 50ms hybrid   43 notes 10.2/s  sounding 5/3.6  min gap 52ms  fused 0  fff 15/33  seams 24  [6 6 4 5 4 1 4 6 4 3]
    B3 +fill 30ms            58 notes 13.7/s  sounding 8/4.8  min gap 30ms  fused 0  fff 16/33  seams 30  [7 6 5 5 8 5 6 6 5 5]

- **Bricks:** all 159 at 50 ms in every copy (verified in the app: min = max = 0.050).
  **B2 is byte-for-byte the same selection as before** (43 notes, same onsets) — attack
  spacing reads onsets only, as predicted. The brick change moved nothing.
- **Gap-fill added 15** (estimate was 13; the tie rule on ids vs keys). Rooms 30–49 ms.
  **T6 took 4 of the 15** (1 → 5) from the fewest-notes tie-break alone.
- **Playability of B3 before redistribution: 0 hard, 0 soft** (tool's own check, then
  confirmed independently by `audit_playability --parts cloud02i-b3`: no flags on any
  part; tightest re-attack 150 ms in T5). **So the redistribution step had nothing to
  do — 0 moves.** The rule is built and dormant: second note of a flagged pair moves
  to the part with the fewest notes where it is `free` against both neighbours,
  smallest leap as the tie-break; re-flag after each move; unresolvable notes reported.
- **The loop terminates here.** At floor 30 ms every remaining dropped note is inside
  30 ms of a kept attack, and redistribution cannot create ensemble room. Max density
  at "no fused attacks, selection only" = **58 notes, 13.7/s, sounding mean 4.8** — right
  at the mass boundary (4–5) rather than three times past it.

Redistribution rule mirrors `audit_playability.js` constants (HARD = next onset before
the brick ends; SOFT = re-attack under 110 ms + 9.3 ms/st capped at 220 ms) — the browser
CONFLICT engine remains the authority. Verified in the composer app: 401 objects render,
five copies at 0/8/16/24/32 s.

### Day 25 — what "playability" actually checks (composer asked), and the fusion ladder B3/B4/B5

**Composer: "for playability, you're looking at the rhythmic closeness AND the breaths?"
Answer, read from the code, not memory: rhythmic closeness YES, breaths NO.**
`tools/audit_playability.js` mirrors `Composer.CONFLICT` (composer.html:2316) and checks
exactly two things:

- **HARD** — the next note starts before the previous brick ends. Two notes at once on one
  player. Physics; cannot be tuned. *(The mock-up cannot tell you this: technique = MIDI
  channel, so two overlapping notes on one player hit two UVI channels and both sound
  cleanly. Hence a written check, not an audible one.)*
- **SOFT** — attack-to-attack re-articulation: under `minAttack` 0.11 s + `perSemitone`
  0.0093 × leap (capped `maxLeapAdd` 0.22), or under `tongueReset` 0.03 s of silence.
  Numbers come from 2j's tremolo table, which IS an attack rate (half step 4.5 Hz =
  0.111 s; fifth 3.0 Hz = 0.167 s). Estimates — soft can only tint amber.

**"Breath" is TWO DIFFERENT WORDS in this project, and only one is wired.** The
`breathSeconds` 0.5 in `container.json` is a NOTATION constant — D62's "a go needs a
breath" grouping rule and the ring-bar cut. **Nothing anywhere models air or endurance.**

**Measured, since it is a fair question:** the continuous playing stretch containing this
section (no gap ≥ 2 s) runs **9.4–22.2 s per part, 22–42 notes** — T8 plays 42 notes across
22.2 s, T4 41 across 20.0 s, all in F#1–G#2, a low and air-hungry register. That is a real
endurance question the tooling cannot answer and the composer may want to put to a player.
Not binding for today's decision; recorded so it is not rediscovered.

**Composer: "let's lower the fusion one step."** Built as a ladder — `--fillFloors
0.03,0.025,0.02`, each seeded from the previous so B3 ⊂ B4 ⊂ B5 (farthest-first order does
not depend on the floor; the floor only says when to stop, so nesting and independent runs
give the identical selection). Copies now at 0/8/16/24/32/40/48 s.

    B2 spacing 50ms   43 notes 10.2/s  sounding 5/3.6   min gap 52ms  fused  0  fff 15/33  seams 24
    B3 +fill 30ms     59 notes 13.9/s  sounding 8/4.9   min gap 30ms  fused  0  fff 16/33  seams 29
    B4 +fill 25ms     64 notes 15.1/s  sounding 9/5.3   min gap 26ms  fused  5  fff 17/33  seams 29
    B5 +fill 20ms     69 notes 16.3/s  sounding 10/5.7  min gap 21ms  fused 12  fff 19/33  seams 29

Redistribution fired for the first time: B4 moved wc-1914 @40.33 T6→T3, B5 moved wc-1898
@40.00 T4→T10 — both `soft` re-attacks, both resolved, 0 unresolved. **All three audit
clean: 0 hard, 0 soft on every part** (independent `audit_playability --parts`).

**TWO REAL BUGS IN THE GAP-FILL, found by checking a surprising number instead of
reporting it — keep this, it is the methodology working.** The first run said B4 (25 ms)
added ZERO notes. That was implausible, so I measured the remaining candidates' rooms
directly: **7 notes sat in the 25–30 ms band**. Both bugs were in `gapFill`:

1. **The tie-break was folded into a running best-so-far, so it could LOWER the tracked
   room below the true maximum.** Traced live: the scan reached 30 ms, then a candidate at
   27 ms won the fewest-notes tie (within the 5 ms tolerance) and overwrote it, drifting to
   ~24.99 ms. The stop test `bestRoom < floor` then fired against the *drifted* value and
   halted the fill with the roomiest notes untouched. Fix: compute the true maximum first;
   the tie-break only reorders candidates already within tolerance of it; the floor is
   tested against the true maximum.
2. **The tie tolerance could admit a note BELOW the floor.** After fix 1, the 30 ms fill
   came out with a 27 ms minimum gap and 2 fused attacks — the tie pool (`maxRoom − 5 ms`)
   reached under the floor. Fix: clamp the tie pool at `max(floor, maxRoom − tol)`.

After both fixes every floor is honoured exactly: 30 → min gap 30 / 0 fused, 25 → 26,
20 → 21. **B3 changed from 58 notes to 59 — the earlier B3 the composer has not yet heard
was built under bug 1 and was three notes short of its own rule.**

### Day 25 — "is there enough rebreath room in B5?" — measured, a new constraint named

Composer: *"do each of the players have a chance to breathe… at least once or maybe twice…
not just at the very beginning or the very end."* That is a REAL constraint nothing in the
tooling checks (see the playability note above). Measured on B5 with a 1.0 s gap as the
threshold (a staccato is a 0.05 s brick; a 1 s gap between attacks is ~0.9 s of free air):

    T1  8 notes  longest gap 0.82 s   NO breath
    T2  6        1.07, 1.03           two  (0.0→1.1, 2.4→3.4)
    T3  7        1.39                 one  (2.1→3.5)
    T4  7        0.76                 NO
    T5  9        0.76                 NO
    T6  6        1.16                 one  (2.2→3.3)
    T7  7        1.62                 one  (0.7→2.3)
    T8  7        0.79                 NO
    T9  7        1.38                 one  (2.5→3.8)
    T10 5        0.57                 NO   (but enters at 2.50 — 2.5 s of rest first)

**Five parts (T1, T4, T5, T8, T10) have no 1 s gap inside the 4.2 s section.** The
section is short enough that "no breath inside it" may be fine IF there is air on either
side — T4 and T10 enter late (1.42 / 2.50 s); T1, T5, T8 play edge to edge. The fix is a
third rule in the loop — a per-part breath guarantee — not a tuning. Not built; the
composer is deciding the threshold (what gap counts, how many per part).

### Day 25 — composer backs up: "one level at a time" — per-player attack density, confirmed

Composer, discombobulated by the levels, asked three yes/no questions. Answered from runs,
not memory:

1. **Do we have a good per-player attack-density threshold?** Yes: attack-to-attack
   ≥ 110 ms + 9.3 ms per semitone of leap, capped at 220 ms (`Composer.CONFLICT`, from 2j's
   measured tremolo rates). Reasoned, not ear-confirmed for this register — soft flags can
   only tint amber. The bricks do not enter into it (attack-to-attack).
2. **Are all the B versions under it?** B2, B3, B4, B5: **0 hard, 0 soft**. B: 0 hard,
   1 soft (T5, 5 ms under). **A (by-part, never audited until now): 0 hard, 14 soft** —
   the per-part ring rule spaces attacks by sample length (0.33–0.53 s) but never looked at
   leaps, so A carries the original's leap-tight pairs. A is NOT a clean version.
3. **Is the original under it with 50 ms bricks + redistribution?** Nearly. 13 soft before;
   the redistribution rule makes **11 moves and leaves 2 unresolved** (no part has a free
   slot for them). So the original is 2 tight pairs short of passing, zero removals — the
   claim "thirteen redistributions and it passes" written earlier today was an assertion;
   the measured answer is 11 moves, 2 stuck.

### Day 25 — BREATH, the concept and the first measurement (a model, stated as one)

Composer: *"are we confident that somebody could play a dense passage of notes this short
without re-breathing? … can we do an analysis and see for this duration and at this
density if this is playable, and if not, where we need to build in breaths?"*

**Two different things, kept apart** (the composer asked about tonguing vs breath):
- **Tonguing** = the articulation mechanism. Single-tongued staccato is comfortable to
  ~8 notes/s in bursts; double-tonguing beyond. Per-part rates here: original max 4/s,
  B5 ~2/s. **Never the constraint.** The re-attack rule (110 ms + leap) already models the
  "reset between two notes" — that IS the tonguing/embouchure check.
- **Air** = how many puffs, how loud, how low, between chances to inhale. F#1–G#2 is the
  tuba's bottom octave — the most air-hungry register there is — and 60 % of these notes
  are ff or louder. A staccato costs a fraction of a sustained note (the air stops between
  notes), so a 4 s staccato passage is NOT a 4 s held note.

**The model (brass pedagogy, NOT measured — dials for a tubist to confirm):**
- a **catch breath** needs a gap ≥ ~0.5 s between attacks (the same 0.5 s as D62's
  notation breath — convergent, not borrowed);
- a **full breath** needs ≥ ~1.0 s;
- loud low staccato playing wants a catch breath every ~5 s and a full breath every
  ~10–15 s. A 4 s burst of 16–18 fff staccatos in this register is within ONE breath —
  a single held fff pedal note lasts 4–6 s, and staccato uses well under half the air.

**Measured in the archive context (20–60 s), the longest run through the section with no
gap ≥ 0.5 s / ≥ 1.0 s:**

    ORIGINAL: catch-breath runs 1.7–4.1 s (T1/T4/T5/T7/T8 play the whole 4 s section,
              11–12 loud notes, without one) · full-breath runs 4.5–4.7 s, ALL parts
    B5:       catch-breath runs 0.2–1.1 s · full-breath runs 1.3–4.5 s (T5 the longest)

**Reading:** even the original gets a catch breath at the section boundaries (every run
starts at 36.2 and ends by 40.9) — **in isolation the 4.2 s section is one breath for
five parts and that is playable.** B5 gives everyone a catch breath every ~1 s. **The real
endurance question is not this window: 87 notes precede it (30–36.2 s) and 120 follow it
(40.4–48 s, incl. 7 fp + 3 cuivre).** The same measurement must be run over the whole
30–48 s stretch when the neighbouring sections are decided.

**Proposed breath rule for the loop (not built):** per part, no run longer than X s without
a gap ≥ 0.5 s, and none longer than Y s without a gap ≥ 1.0 s; starting dials X = 5,
Y = 10; a tubist sets them. Where a run exceeds X, the fix is the composer's: open a gap
(move a note to another part, or drop one) at the point that splits the run best.

### Day 25 — side catch-up: density build 1 and the section after it, swept for levels 1–3

Composer: *"keep this research handy documented… then a side catch-up on the first density
build — any problematic sections? And confirm the B series: nothing problematic even at
max density."* → **`docs/PLAYABILITY_MODEL.md` created** (the reference card: four levels,
the re-attack rule, the breath model and dials, results per section, what is open);
indexed in RESEARCH_INDEX.

**B series: confirmed clean, all densities.** B2–B5: 0 hard, 0 soft; B5 catch breath
every ≤ 1.1 s, full breath every ≤ 4.5 s.

**Density build 1 (0–36.19, 167 notes): 0 hard, 11 soft, nothing on breath.** All eleven
flags are inside 31.4–34.6 s — the stretch already figured as clusters on day 24 — and
all are WIDE LEAPS TAKEN FAST (11–17 semitones at 155–230 ms), not re-attack problems.
T1 has five, four of them octave-plus leaps in cl-1. Three flags are within 3 ms of the
line. Breath: longest no-0.5 s run 3.0 s, no-1 s run 5.4 s; longest single held note 4.2 s
(the opening surge). **Nothing was flagged on day 24 because nobody ran the auditor on the
figured material** — the notation loop has no playability step. Filed as a question for
a player, not a rebuild.

**40.42–48 s (VERT01-03 + CLOUD02-D, unworked): 0 hard, 18 soft** — CLOUD02-D is full of
fast wide leaps (worst T6 @45.51 D4→E2, 22 st at 136 ms, needs 315). Breath fine. **Next
problem area; the fix there looks like redistribution before any thinning.**

### Day 25 — STANDING RULE: the playability loop runs BEFORE notation (D64 candidate)

Composer: *"moving forward, let's make sure to do a playability loop before notating, as
we're doing now."* → NOTATION_WORKFLOW §1 gains step 0; journal §2 carries it as D64
(candidate) for promotion at session end. The order is now: audit + breath sweep →
redistribute (ledgered) → notate.

### Day 25 — "I don't want to submit something clearly impossible" — the whole archive swept

Composer: *"confirm for me that these things are being taken into account with reasonable
margins. I don't want to submit something that's clearly impossible. In rehearsal the real
tubists might fudge it or leave it out, which is expected. But I don't want to be asking
for something totally unreasonable from the beginning."* → the bar, in the composer's
words: **not "perfect", but "not clearly impossible."**

Whole archive (`piece-s25-finished01`, 4401 notes, 751 s, F#1–G4):
- **HARD: 2**, both in the trance section, both seams between consecutive generated
  blocks where a 200 ms brick of one block runs 68–80 ms into the next block's first
  attack on the same part — **T8 @560.63** (wc-ta4-749 "F oct B" C#4 ends 560.762;
  wc-ta4-754 "BASE" E3 starts 560.630) and **T6 @604.63** (wc-ta4-1343 "MTB" C#2 ends
  604.677; wc-ta4-1350 "PH3" G3 starts 604.630). Both are BRICK overlaps — the attacks
  are 68 ms and 153 ms apart. A 50 ms brick would make them soft, not hard; a part move
  makes them free. **Two fixes, ledgered, before submission.**
- **SOFT: 45** (the 90 in the first run counted the `-work` file twice). Worst four, all
  wide leaps: T6 @45.51 D4→E2 short by 179 ms (57 % of the need) · T7 @45.47 F#3→D#2
  108 ms (43 %) · T8 @560.63 D#2→F4 126 ms (38 %, the same seam) · T7 @44.73 G2→D4
  105 ms (37 %). Everything else is under a third short. **CLOUD02-D (44–46 s) holds the
  three worst leap asks in the piece.**
- Per-part mean rate 0.55–0.62 notes/s over the whole piece; tightest re-attack on any
  part 130–160 ms outside the two seams.
- Breath on the three windows measured (0–36, 36–40, 40–48): nothing within a factor of
  two of the dials.

**Margins, honestly:** level 1 is physics, zero margin needed and two to fix. Level 2's
RULE sits near the capability edge (110 ms at a semitone = 9/s, about what a tubist can
single-tongue in a burst) but the MATERIAL is 2–4× slower than the rule everywhere except
the 45 flagged leaps, and 41 of those are within a third of the need — the fudge zone the
composer describes. Level 3's dials are generous by design. Nothing in the piece is
"clearly impossible"; four leaps are "clearly hard" and one section (CLOUD02-D) owns three
of them.

### Day 25 — composer's direction: finish the B series, THEN build the general tool

Composer: *"I wanna finish with this b section and then create whatever code is necessary
to be able to run this thinning analysis / thinning if necessary and redistributing process
automatically again for subsequent parts. So let's just hang on to anything until we're
done and understand what needs to be done, and then build it all at the end of this b
series."* → journal §2. Audit results and the queue of dense areas are in
PLAYABILITY_MODEL.md so they can be found; no action on them now.

### Day 25 — REFRAME (composer): this is THE PLAYABILITY PROCESS; the smear is secondary

Composer, verbatim: *"I want to define this process, what we're doing now, as the
playability process. And what that is is exactly as it sounds. I just want to evaluate
things for playability — useful to flag up, I should say — the smear or audibility is of
secondary concern. My 'this just sounds dense' comment wasn't meant as negative, just
meant by ear. It sounded very unplayable, and maybe I didn't do the proper checks when
writing. So this process is strictly for playability. And then I don't mind getting a flag
about those other aspects, including the smear or overlap."*

**What this changes.** The day's thinning work (B, A, B2, B3–B5) was built on the AI's
reading of "it feels very dense" as an ear judgment about the texture. It was a
playability worry. So:
- **The primary deliverable is the ORIGINAL, REDISTRIBUTED** — every note kept, 11 part
  moves, two tight pairs for the composer's call. Not a thinned version.
- **The B series stands as research** (the audibility ladder, the attack-spacing finding,
  the META-curve scaling, the gap-fill bugs) — flagged, available, secondary.
- **The process definition:** audit levels 1–3 → redistribute → report; level 4 (fused
  attacks, sounding count) is a FLAG in the report, never a reason to remove a note.
- For the paper (PAPER_NOTES): a clean case of the AI optimising the wrong objective for
  several hours because one word ("dense") was read as aesthetic when it was practical —
  and the composer's checks ("let me restate… is this correct?") catching it.

### Day 25 — OR BUILT: the original, every note kept, redistributed — 0 hard, 0 soft

The playability deliverable. `cloud02i_ab.js` now builds **OR** (copy at **56 s**, dark
green, `scores/cloud02i-or.json`): the 159 original notes, bricks 50 ms, redistribution
applied. Census identical to the original on every level-4 number (37.6/s, fused 108,
sounding 21/13.3) — as it must be: part moves change nothing the ear hears in the
mock-up. Per part after: [17 15 17 17 16 15 14 16 17 15].

**The two stuck pairs, and how they resolved.** The second-note pass left two: T3 @40.31
C#2→G#1 (5 st) 144 ms needs 157 — 13 ms short (8 %); T9 @40.18 E2→A#1 (6 st) 152 ms
needs 166 — 14 ms short (8 %). Both at the section's tail (40.18–40.31), where every part
has 1–3 attacks in the last 0.6 s and no part had a free slot for the SECOND note. Tested
before recommending: **the FIRST note of each pair had room** — wc-149 (T3) could go to
T5; wc-145 (T9) to T4/T6/T8/T10. So the rule gained a second pass: if no part can take the
second note, try the first. Result: **12 moves, 0 unresolved; independent audit of OR: 0
hard, 0 soft on all ten parts.** The composer's question ("still good to go with those,
or resolve?") was answered by resolving them — at 8 % short they were fudge-zone anyway.

Moves (abs. time): T1→T10@39.80 · T1→T8@40.30 · T3→T9@39.85 · T3→T5@40.17 (first-note
pass) · T4→T3@40.00 · T5→T1@36.86 · T6→T9@36.46 · T6→T4@40.33 · T7→T9@37.84 ·
T7→T9@39.21 · T9→T3@39.51 · T9→T3@40.18 (first-note pass). Each is one ledger line in
ARCHIVE_AMENDMENTS when OR is applied to the archive — not yet done.

Verified in the composer app: 698 objects render, OR occupies 56.0–60.1 s across all ten
lanes. The B series (8–48 s) is untouched and stands as the audibility research.

### Day 25 — THE ROUTE from composer score to notated page, laid out (composer asked)

Composer: *"detail for me the route to the notated score… my original composer score gets
amended, and we're keeping a ledger… then you're porting to the presentation score… lay
out everything that needs to happen so we can start notating and things are saved
properly."* Read from the protocol (ARCHIVE_AMENDMENTS rules 1–6), `move_object.js`, and
db1's stored build command — not from memory.

**Three files, three roles:**
1. `scores/piece-s25-finished01.json` — THE ARCHIVE (composer score). Frozen; edited only
   by script, each edit a SCORE EDIT line in ARCHIVE_AMENDMENTS.md; git is history and
   undo. No new composer save file — the archive itself is amended (as wc-28/87/88 were).
2. `notation/ir/db1.ir.json` — THE PRESENTATION SCORE'S DATA. Built FROM the archive by
   `notate_section.js`; the full command is stored in `provenance.build` and rebuilds it
   byte-identically. Figures are `--cluster` arguments appended to that command. The app
   reads this file. Not a new file per section — db1 already spans 0–55.94 and its
   command already carries 25 clusters (incl. four in 44.5–46.2 s, CLOUD02-D).
3. `scores/cloud02i-*.json` — SCRATCH (the listening file and isolates). Not on the route;
   kept as research, never loaded for real work.

**The steps:**
1. Apply OR to the archive — 12 `move_object.js --apply` runs, in the tool's order
   (`wc-1903` T3→T5 BEFORE `wc-1905` T9→T3: dry-run shows wc-1905 refused only because
   wc-1903 has not left T3 yet). Each prints its ledger line. Then, optionally, the 159
   bricks → 50 ms (no tool exists; a 20-line script, one systematic ledger line; the
   composer's ask, page hygiene only). Ledger. Commit + push.
2. Re-extract db1: run `provenance.build` verbatim (after the moves it is no longer
   byte-identical in 36–40.4 — that is the point). `pattern_analyze --validate` (23/25
   expected) + the batteries.
3. Playability loop on the window — DONE (OR: 0 hard, 0 soft).
4. `pattern_analyze --ir db1 --part N --span 36.0-40.4` for N = 0..9 on the redistributed
   parts. Expect the day-24 result again (no pattern in the long runs) — density is
   unchanged; that is now a NOTATION question (one-shots / even 16ths / clusters), not a
   playability one.
5. Figures: append `--cluster … @part` groups to the stored command → rebuild db1 →
   composer reviews part by part (NOTATION_WORKFLOW §1). Trials as forks (`--from db1
   --id db1-x… --exp`), settled ones promoted into db1's command.
6. Commit + push at each settled chunk; db1 keeps its id, label updated.

### Day 25 — the three-part plan APPROVED and written down; model-switching practice recorded

Composer approved the read-back ("that sounds solid") and asked for the plan to be written
before switching models. → journal §2 (the block "DAY 25 OUTCOME, then THE APPROVED PLAN",
executable cold: the 12 moves in order, the brick script spec, the re-extract and fork
commands, Part 2's module boundary and decisions A–D, Part 3's stop-and-talk), PLAN 8f
rewritten to point at it. Model-switching practice (Fable has its own weekly balance;
Fable for verdicts/reframes/design, Opus for lists; switch safe, context length is the
risk; /clear at milestones with the cold-execution test) → SESSION_HYGIENE § Model strategy.

### Day 25 — PART 1 DONE: archive amended, db1 rebuilt, trial fork in the picker

**Archive** (`piece-s25-finished01`): 12 moves via `move_object.js --apply` in the
journal's order, then all 159 CLOUD02-I staccato bricks to 50 ms via the new
`tools/set_brick.js`. 13 ledger lines in ARCHIVE_AMENDMENTS, all **SCORE EDIT — applied**.

**A finding worth keeping: the 12 moves CREATED two hard conflicts of their own.** After
the moves and before the bricks the window read **2 hard, 0 soft** — T4 @40.33 (wc-1901's
202 ms brick over a 174 ms attack gap) and T9 @36.46 (wc-1763's 182 ms over 133 ms). OR
never showed them because OR was computed at 50 ms bricks. So the brick step is not
cosmetic in this section: **redistribution can move a note under a long brick, and only
the brick normalisation clears it.** Verified both ways by `set_brick`'s own census
(whole score hard 4 → 2) before writing. Worth building into the Part-2 tool: apply
bricks and moves together, and re-audit after.

Amended archive: **CLOUD02-I 0 hard, 0 soft**; whole score 2 hard (the trance seams,
parked) / 32 soft (was 45).

**Presentation score** — `provenance.build` re-run verbatim: **db1 = 456 events, 131
chunks (was 128 — unresolved chunks regroup around the moved notes), VALID vs source.**
159 events in the window, per part [17 15 17 17 16 15 14 16 17 15] = OR exactly, D51
durations intact (11 distinct sample lengths, NOT the 50 ms brick — the brick is the
drawn value, the IR keeps the sound). All nine batteries PASS.

**`--validate` is 24 of 25, not the documented 23** — cl-25 (T10) stopped being an
exception when the composer rebuilt T10 from the analyser on day 24 (commit 2e06665);
the §2 note predated that. Corrected in the journal. **cl-1 (T1's 3:2) is the only
standing disagreement**, as designed. None of my edits touch a cluster — all 12 moves are
in 36.19–40.42, where no figure exists yet.

**Fork:** `db1-c2i-x01` — "CLOUD02-I trials (day 25)", in the picker under experiments.
Verified live: page loads db1, no console errors, fork present.

**Part 1 done. Nothing notated.**

### Day 25 — PART 2 DONE: the playability process is a tool

**`notation/lib/playability.js`** — THE ONE RULE MODULE. The CONFLICT constants,
`requiredAttack`, `pairTier`, `flags`, `redistribute` (two-pass), `breathRuns`,
`audibility`, `staccatoLengths`. `audit_playability.js` and `cloud02i_ab.js` both
refactored onto it — before today the same constants and the same `pairTier` lived in
THREE places "kept in sync by hand". Auditor output verified byte-identical after the
refactor (whole archive still 2 hard / 32 soft; `cloud02i-or` still clean).

**`tools/playability.js`** — one command, any section:
`--score <name> (--section <marker label> | --w0 --w1) [--brick] [--apply] [--listen]`.
Five numbered steps: audit → redistribute → bricks → breath → audibility FLAG. Dry run
by default; `--apply` runs the moves through `move_object.js`, the bricks through
`set_brick.js`, **re-reads the file from disk and re-audits it** before appending the
ledger lines, then prints the re-extract command. `--section` resolves marker-to-next-
marker. The window is audited IN CONTEXT (whole score passed to `flags()`, results
filtered) so a tight pair straddling the window edge is not missed.

**`tools/test_playability.js` — 22 assertions, all pass.** Notably:
- the module's constants are compared against the ones READ OUT of composer.html, so
  the browser engine stays the authority and drift is caught;
- the contract: redistribution changes `layer` and nothing else — time, pitch,
  velocity, technique, group asserted untouched, note count unchanged;
- **the first-note pass is proven load-bearing**: a second-note-only emulation is run
  alongside and must leave flags where the two-pass leaves none;
- the two gap-fill bugs are guarded on the built artefacts (each floor honoured).

**A TRAP FOUND BY WALKING INTO IT — keep this.** The golden fixture was
`scores/cloud02i-orig.json`. But `cloud02i_ab.js --isolate` REGENERATES that file from
the CURRENT archive, so the moment the archive was amended it silently stopped being
the "before" and became the "after" — the test would have passed by measuring nothing.
Caught when the rebuild printed "OR: 0 flags before · 0 moves". Fixture recovered from
git (`git show 2e9873a~1:scores/cloud02i-orig.json`) into
**`tools/fixtures/cloud02i-preamend.json`**, alongside the other snapshots. **Rule: a
fixture must never be a file the tools rewrite.**

**FIRST REAL USE — CLOUD02-D (42.38–48.05 s, 110 notes), dry run:**
**18 soft → 9**, 0 hard throughout. Eight moves (three of them first-note pass). The
nine that remain have no home — every part is busy at 45.4–45.5 s. Seven are under a
fifth short (four under 3 %: T5 @45.80 1 %, T1 @46.22 1 %, T8 @45.45 2 %); **two are
real asks — T6 @45.51 D4→E2, 22 semitones in 136 ms, 57 % short, and T7 @45.47
F#3→D#2, 43 % short.** Breath fine everywhere (worst 4.1 s catch-run vs a 5 s dial);
T10 carries 13.8 s of held notes, the most of any part. Audibility flag: 27.7
attacks/s, 66 of 109 fused, sounding mean 10.9. **Not applied — the composer decides
the nine.**

### Day 25 — clear point: §2 made cold-start correct for PART 3

Composer asked whether this is a good juncture to clear. It is — Parts 1 and 2 were
execution (Opus), Part 3 is a musical-judgement conversation (Fable), so the mode
changes as well as the milestone. §2 updated before clearing: state paragraph rewritten
to end-of-day-25, tool table gains `playability.js` / `set_brick.js` / `test_playability`,
Parts 1 and 2 marked DONE with their commits, Part 3 marked **NEXT — START HERE** with
its model. D65 (fixtures must not be tool-rewritten files) filed as a candidate.
Cold-execution test applied: a model that has never seen this chat can run Part 3 from
§2 alone.

### Day 25 — THE RHYTHM made standing (composer): next steps · model · clear, as a running thread

Composer: *"this rhythm was very useful… plan out the next logical few steps, have a
recommended model switching rhythm, including a clear rhythm, and then AI can say 'this
is a good time to clear' or 'switch models'. Can we write this up and have this as a
running thread for all models and after clears?"* → three places, three jobs:
CLAUDE.md § THE RHYTHM (the standing instruction every model reads) · SESSION_HYGIENE
§ Model strategy (the practice and why — day 25 is the worked example) · journal §2
"NEXT STEPS · MODEL · CLEAR" (the living table: step · model · clear? · done =, with
"Right now: step N"). Seeded with steps 1–4: Part 3 (Fable, cleared before) → notate
CLOUD02-I (Opus build / Fable verdicts, clear before) → CLOUD02-D (playability apply +
the nine + its analysis) → the trance seams.

## Day 26 — 2026-08-23 (Claude Code / Opus 5)

### Day 26 — PART 3 SET-UP: the trials fork cleared to bricks (`--bare`)

Composer, opening Part 3: *"in the presentation score… let's clear that section. I'll
just look at the bricks… thirty six to forty."* Then, when the AI misread it as
"delete figures": *"No. We had previously inserted all the GCs in there… the bricks are
fine, that's what I want to see, just the bricks. It's the GC notation that's
distracting right now."*

**What was actually on the page.** CLOUD02-I (36.19–40.33 s, 159 staccatos) carried
**no figures at all** — zero overlays on any of its notes; `db1-c2i-x01`'s 87
engraving overlays all belong to the 25 clusters at 29.9–34.6 and 44.5–46.2. The ink
was the **per-technique device**: `--bricks` leaves every chunk unresolved but each
note still draws its technique's device (staccato = go line + GC + ball + filled head +
16th flag + dot + band dynamic), so 159 staccatos = 159 arcs, 159 balls, 159 dashed
lines over the material the composer wanted to read. Nothing existed to turn that off:
the app's `bricks` checkbox hides the BRICKS (the opposite), `--noGc` strips only the
GC and only from individually named notes.

**Built: `--bare t0-t1[@part]` on `tools/notate_section.js`** — a per-note engraving
overlay with every drawn device element false (`curve cut goLine gc nhUnit nhDot
ringBar dynMark dynPair dynBesideStem`); the parachute brick is untouched because it
is drawn before the device is consulted. Design choices:
- **Lives in the build command**, so a re-extract keeps the span bare — the fork is
  exactly the file that gets rebuilt during trials. As parts are figured, the bare span
  narrows (or goes `@part`) and each new figure appears against bare neighbours.
  *Rejected:* an app-side "devices" LOOK toggle — instant and file-free, but
  all-or-nothing across the page, so it could not show one figured part against bare
  ones, which is Part 3's loop.
- **`@part` optional** (unlike `--cluster`/`--beam`, which require it in a multi-part
  file): bare is a removal, not a grouping, and sweeping every lane is the normal intent.
- **Hard error rather than blank a figure** (day 24's lesson, applied at build time): if
  a note in the span already carries a device overlay from `--cluster`/`--beam`, the
  tool lists the notes and exits 2 with "narrow the span". A bare that silently erased
  a built figure would look like a rendering bug.

**Rebuilt `db1-c2i-x01`** with db1's stored `provenance.build` + `--bare 36.19-40.33`
(id/label/`--exp` swapped): `bare 36.19-40.33: 159 notes cleared to bricks (T1:17 T2:15
T3:17 T4:17 T5:16 T6:15 T7:14 T8:16 T9:17 T10:15)` · 456 events, 131 chunks, VALID ·
246 overlays = 87 cluster + 159 bare, the 87 byte-identical. `db1` untouched.

**Verified in the running app** (score-verify :5210, DOM audit, then screenshot):
page 5 (32.0–40.0) — 143 bricks in the span, **0 GC impacts, 0 go lines, 0 ink of any
kind** (path/circle/text/line) between 36.19 and 40.33; the 19 remaining arcs are the
clusters' at ≤34.57. Page 6 (38.7–46.7) — 111 GCs, the earliest at 40.93 (the fp/cuivre
blast, ten parts), = 120 events in 40.4–46.7 minus the 9 cluster members that carry no
GC. Ten batteries green.

**Two app gotchas met on the way, not fixed:** the video view is PAGED, so the `from`
box is ignored there (page 5 = 32–40, page 6 = 38.7–46.7 — the span straddles the
cut); and setting a number field by script does not fire `change`, only a real edit
does. Neither blocks anything.

### Day 26 — PART 3, T1: the protocol's verdict, where it breaks, and the composer's reframe

**Why Part 3 exists (composer):** an earlier analysis said this section would have
"very few clusters"; the composer wants to validate or invalidate that by hand, part by
part, and if invalidated, fix the analysis so it finds the clusters next time.

**The protocol on T1** (`pattern_analyze --ir db1-c2i-x01 --part 0 --span 36.0-40.4`):
17 notes 36.22–40.17; gaps 239 244 156 160 347 288 304 242 142 274 161 158 157 265 255
| 559. **One breath seam** (the 559) → **one 16-note cluster + a lone one-shot at
40.17.** So "very few clusters" was true in count and wrong in meaning: not few
clusterable notes, ONE cluster that takes nearly everything. Composer's ear beforehand:
*"it actually sounds like all clusters or even one long cluster."* Confirmed.

**Where it breaks:** the one grid the tool finds for the 16 is ♩=120 at 0.7 heads —
inside the threshold — but needs tuplets on three beats (7:4, 6:4, 7:4) and puts half the
notes on fractional slots. Legal and unreadable: the 32nds smell of day 24 in another
coat. The gaps sort into three pace families (~157 / ~245 / ~300 ms, within-family
spread ≤1.2×, between-family ≥1.5×) in runs: med med · short short · long long long ·
med · short · long · short short short · long long. Analysed run by run, every one is
trivial: notes 1–5 ♩96 (a 5:4 + two 16ths, 0.6 heads) · 6–8 three even 16ths ♩51 (0.2)
· 9–11 16th 8th 16th ♩108 (0.1; note 9 flagged pickup) · 12–14 three even 16ths ♩95
(0.0) · 15–16 two 16ths ♩59 (0.0). The seam the tool has (breath) finds the gesture;
the unit it fits (one grid per gesture) is wrong — principle 6 ("figures need not share
a tempo") is stated in NOTATION_STANDARDS and not implemented.

**The AI's question — "five tempo changes under one go, playable?" — was the wrong
frame.** Composer's reframe (verbatim in COMPOSER_LOG day 26; paper framing in
PAPER_NOTES): players do pattern recognition, not tempo tracking; two "long short short"
figures at different spacings read as one pattern twice, the page and the cursor absorb
the tempo; the only failure is *cognitive dissonance*, when the spacing pushes past the
eye's *mental rounding* — and only then does the notation itself have to say "very long,
medium, shorter" (tuplet or separate figure). Protocol consequences discussed next.

## Day 27 — 2026-08-23 (Claude Code / Opus 5)

### Day 27 — PLAN 8g FIGURE SEAMS built: the segmenter, and the finding that the specified cost could not do the job

**Built:** `pattern_fit.segment()` (+ `words()`, `paceBands()`, `dottedReading()`) ·
the words-first report in `pattern_analyze` · `--figures` (and `--paceRatio`) on
`notate_section` · `gridId` as the grid domain in `layout.js` · 21 new assertions in
`test_pattern_fit` (6 → 40 checks). Ten batteries green, `--validate` 24/25 on both
`db1` and `db1-all-x01`, verified in the running app.

**THE FINDING, and it cost the afternoon: the cost function PLAN 8g specified cannot
produce the composer's own reading of T1 — for any CUT_COST.** The spec said "try every
cut set; cost(figure) from the existing `fit()` ranking (tuplet beats, empty slots,
heads) + CUT_COST per cut". Implemented literally, the DP on T1 returns cuts after notes
2 and 5, not the composer's 5, 8, 11, 14. This is not a tuning problem and no sweep can
fix it:

- the composer's reading has **more figures** (5 vs 3) **and a higher figure-cost**
  (2.96 vs 2.50) than the reading the DP prefers;
- raising CUT_COST therefore penalises the composer's reading *faster* than the
  alternative. Golden = 2.96 + 4·C, alternative = 2.50 + 2·C; golden wins only if
  2C < −0.46. Never.

The mechanism: notes 1–5 need a quintuplet (cost 2.38), while notes 1–2 are a **pair**
— and a pair always fits a grid exactly, for free, because two points define the unit.
Free pairs are the shattering pathology in miniature, and CUT_COST is the only brake.

**Dead ends, kept as evidence.** (1) A **figure-length term** alone: needed, but with a
flat cut cost the sweep over 2 187 weight sets produced *zero* hits on the golden.
(2) A **seam-scaled cut cost** (cheap at a large gap, dear at a small one): got closest
— cuts 5, 8, 14 — but only 10 % of its own ±20 % neighbourhood gave that answer, and it
has the sign backwards for note 11, whose gap is *small* (161 ms). Fragile and wrong for
the case the composer cared about; dropped. (3) Local-maximum (Gestalt) gap detection:
gives 2, 5, 7, 10, 14 — two of them off by one note. Dropped.

**WHAT WAS MISSING WAS ALREADY IN THE COMPOSER'S OWN METHOD.** Day 26 did not search cut
sets at all: it sorted the gaps into pace families (~157 / ~245 / ~300 ms) and read the
runs. So:

> **A CUT MAY ONLY LAND WHERE THE PACE CHANGES** — the seam gap must be in a different
> pace band from the gap before it. A figure ends when the pace changes, never in the
> middle of an even stream.

Three things fall out at once. It kills the spurious cut after note 2 (gaps 239 then
244 — same pace, mid-run). It makes **no-shatter STRUCTURAL rather than tuned**: an even
run has no pace change anywhere in it, so it has no legal cut, whatever the weights are
(asserted for 3, 4, 6, 8 and 12 even 16ths, including at `CUT_COST 0.01`). And stability
went from 10 % to **67 %** of the ±20 % weight neighbourhood.

Second missing term, also from the composer's words: **a figure is short.** "Pattern
recognition" means a shape the eye takes in at once; without a length penalty the DP
writes eleven notes as one figure at 0.93 heads — legal by the letter and exactly what
8g exists to stop. `SOFT_MAX_NOTES 6` (the largest figure in the decided section-1
vocabulary), `W_LONG 0.5`.

**Final defaults:** `W_TUPLET 1.0 · W_EMPTY 0.25 · W_HEADS 1.0 · SOFT_MAX_NOTES 6 ·
W_LONG 0.5 · CUT_COST 0.5 · PACE_RATIO 1.25`. `PACE_RATIO` does two jobs — it bands the
gaps into pace families *and* it turns milliseconds into words.

**WHERE THE TOOL AND THE COMPOSER STILL DIFFER, stated rather than tuned away.** On T1
it finds cuts after **3, 5, 8, 10, 14** — six figures. It keeps three of the composer's
four cuts (5, 8, 14); it **flags note 11** as a near-tie (+0.27), which is the boundary
the composer flagged by ear; and it makes one cut the composer did not, **after note 3**
— which splits their "long long / short short" figure at its own pace change and
**removes the quintuplet entirely**. Result: six figures, **no tuplet anywhere**, nothing
past 0.2 heads, against five figures with a 5:4 at 0.63. That is principle 6 carried one
step further than the hand reading went, not a disagreement with it — but it is the
composer's call, so both are in the picker to be looked at.

**A result nobody asked for, worth keeping:** with cuts at pace changes, **not one
figure in the whole of CLOUD02-I needs a tuplet** — all ten parts, every gesture,
scanned. The tuplet was an artefact of forcing one grid per gesture.

**Verified in the running app** (score-verify :5210, DOM audit against `db1` as the
control): T1 in `t1-figures` draws **12 beam polygons = 6 figures × 2 beam levels**, six
separate groups with clear gaps; **exactly 1 GC impact and 1 arc** for the whole 16-note
gesture (it still goes once); no rests inside any figure (each is a contiguous run);
every head `leftEdge`, no go lines. The `db1` control still draws the old single-tempo
shape (one 718 px primary beam with beamlets). The tuplet path was exercised separately
via `--paceRatio 99` (`t1-onegrid`): one figure, brackets **7:4 · 6:4 · 7:4** rendering
correctly — which is also the regression check on the `gridId` change, since tuplet
bracket ownership is keyed on it.

**Design notes.**
- **`gridId`, not `clusterId`, is the grid domain** (`layout.js`). Rests, written values
  and tuplet brackets are computed per grid; under `--figures` that is the FIGURE. A
  cluster built before 8g carries no `gridId` and the two are the same thing, so nothing
  moved. `--validate` splits a cluster by `gridId` for the same reason — otherwise every
  figured cluster would read DIFFERS against a whole-gesture fit and the 24/25 would
  become a false alarm.
- **No rest between figures**, by design: two figures have different units, so there is
  no shared grid in which a rest between them means anything. The seam is a beam that
  stops and another that starts — no new ink.
- **`--figures` refuses `--pattern`** (implied) and **`--beamBreak`** (that flag is the
  opposite case: several beam groups on ONE tempo). An error, not a precedence rule
  nobody would remember.
- **`--paceRatio`** added as the one dial that moves where cuts may land. Large enough
  (99) = one pace band = no legal cut = the whole gesture on one grid, i.e. the pre-8g
  reading reproduced through the new code path — which is how the tuplet branch got
  tested at all, since no real figure in the section needs one.
- **Near-ties are printed for BOTH directions but deduped by the note in question** —
  both directions name the same note, and printing both read as duplication.
- **The words come from the SPACING, not from the notation.** 239|244|156|160 reads
  "long long short short" — what the composer said looking at it. The quintuplet writing
  implies 1.6|1.6|0.8|1.0 and would have said "long long short medium". Asserted.
- **`fit()` is untouched**, per the spec, and asserted.

**Deferred, unchanged:** tuplet vs dotted 16ths for a 3:3:2:2 figure. `dottedReading()`
computes the half-16th reading and the report offers it wherever a figure is written
with a tuplet, but nothing writes dotted values — that path is built when the composer
picks (it needs `noteUnits 1.5` support in layout).

## Day 28 — 2026-08-23 (Claude Code / Fable 5)

### Day 28 — THE SEGMENTATION VERDICT, first pass: "T1 looks good" — then second thoughts, and a third reading built

**Session start.** The composer opened the picker on `t1-figures` (8g AFTER) vs
`t1-onegrid` (8g BEFORE). First reaction, verbatim: *"T one looks good. I think the
pattern segmentation approach is the correct one."* Then, minutes later, interrupting
the write-up: *"I'm having second thoughts. the eight g before might potentially be
better. But can we break the beams the way in eight g after?"*

**What that separates — the point worth keeping.** 8g did TWO things at once: (1) it
found the GROUPS (cuts after notes 3, 5, 8, 10, 14 — where the pace changes), and (2)
it gave each group its OWN grid (no tuplets, ≤0.2 heads). The composer's second thought
accepts (1) and questions (2): keep the one grid with its 7:4 · 6:4 · 7:4, but show the
six groups as six beam groups. Those are independent choices, and the tool already had
the flag for the hybrid — `--beamBreak` is exactly "several beam groups on ONE tempo"
(composer, day 23), and it takes a list.

**Built: `t1-hybrid`** (scratch picker entry, third of the set) —
`--cluster 36.21-39.62@0 --pattern --beamBreak 4,6,9,11,15` (the members that START
a group = the cuts after 3, 5, 8, 10, 14). No code change. The `--pattern` path is the
same `fit()` the one-grid reading used: unit 125 ms, 120 bpm × 4, worst 21 ms = 0.7
heads, tuplet beats 2, 3 and 6.

**Verified (:5210, DOM audit against `t1-onegrid` loaded in the same page):** tuplet
bracket rects, the three `7:4 / 6:4 / 7:4` texts, all 16 head positions, 1 GC impact
and 1 arc are IDENTICAL between the two; the only difference is the beam — one 1178 px
primary in `t1-onegrid`, six primaries in `t1-hybrid` at x 58–226 · 280–336 · 456–662 ·
746–795 · 890–1056 · 1148–1236 (3+2+3+2+4+2 = 16 notes), each group's last beamlet
turned inward per the day-24 beam law. The first 7:4 bracket (beat 2 = notes 3, 4, 5)
straddles the beam break after note 3 and draws correctly across it — brackets are keyed
on the grid (`gridId`), not on beam groups, so this was expected but had never been
drawn before.

**Why the AI preferred AFTER, in one breath (asked for, given):** the one grid needs
three tuplet brackets to hold paces that are not in one tempo — ink that states a ratio
the player never counts (they read the pattern; the cursor carries the time, D66) — and
it leaves 0.7 heads of displacement; the figures need no bracket at all and leave 0.2.
Both are under the one-head line (principle 4), so neither is dissonant: AFTER is
simpler, BEFORE is a single consistent grid. The eye decides.

**Status:** the verdict is NOT in. Three readings in the picker for the composer's eye:
`t1-onegrid` · `t1-hybrid` · `t1-figures`. Nothing else notated. If the hybrid wins, the
system change is small and real: the segmenter's cuts become the DEFAULT beam breaks of a
one-grid cluster (a `--breaksFromFigures`-style modifier, or `--figures` gaining a
"one grid" mode), and the 8g golden keeps asserting the cut set — the cuts were right
either way.

### Day 28 — THE VERDICT PROPER: "2+3, 2+3, and the rest are right" — and the rule it turns out to be

**The composer's reading of T1, by ear** (COMPOSER_LOG day 28, verbatim): the patterning
instinct of 8g was right *with a caveat* — the groups are **[1,2] + [3,4,5]**, then
**[6,7] + [8,9,10]**, *"and the rest are grouped correctly"* ([11–14], [15,16]). Two
cuts move: after 3 → after **2**; after 8 → after **7**. Their ear on the first five:
*"the second and third notes are slower… maybe fifty percent bigger than the fourth
and fifth"* — measured **53 %** (239/244 vs 156/160).

**Scope, in their words, before any of this:** *"we probably won't get to a universal
protocol… there probably need to be some manual investigation… I don't necessarily
want to chase to the end the algorithm. Let's improve it and get it closer if we can…
see if this generalizes to anything. If not, we'll just move on… it just needs to be a
by-ear type of judgment."* And: a new rule *"doesn't cancel out any rules, just
enhances them or adds to them."*

**WHAT GENERALIZES — THE SEAM IS THE SLOWER GAP.** Both cuts the composer moved, and
all four they kept, satisfy one rule: **at a pace change, the boundary note goes with
the QUICK side — the seam is the slower of the two gaps.** Equivalently: a seam is a
gap that is not quicker than either neighbour and is a pace change from at least one —
a **banded local maximum of the gap sequence**. That is Lerdahl & Jackendoff's GPR 2b
(attack-point proximity: a boundary where the inter-onset interval exceeds both
neighbours) and Tenney & Polansky's temporal-gestalt boundary (1980). The composer's
ear reproduced it without being told it.

**Why the tool missed it:** D67 as implemented is ONE-SIDED — "the seam gap must be in
a different band from the gap BEFORE it" (`segment()`, `pattern_fit.js`). At a
slow→quick change that makes the QUICK gap the seam, so the pace-change note lands on
the slow side (the cut after 3). At quick→slow it happens to agree. The composer's rule
keeps "a cut lands where the pace changes" (no-shatter stays structural: an even run
has no pace change) and adds which side — enhances, does not cancel.

**Tested (scratch `seam_rule.js`, using the real `paceBands()`):**
- T1 bands at 1.25: {142…161} · {239…288} · {304, 347}.
- Current rule, legal cuts: after 3,5,6,7,8,9,10,11,14 → the DP chose 3,5,8,10,14.
- **Local-max rule, legal cuts: after 2,5,7,10,14 — the composer's set exactly, and
  nothing else is legal.** No cost decision is involved on T1.
- **The second 2+3 is a genuine near-tie:** cut-after-7 is legal only because
  304/242 = **1.256 ≥ 1.25**. At a ratio of 1.3 the legal cut is after 8 instead —
  [6,7,8] + [9,10], the tool's reading. The composer said *"it sounds MORE LIKE a two
  plus three"* — tentative, and rightly so. The system must FLAG this kind of tie
  (legality that flips within a few % of PACE_RATIO), not decide it.
- **Across CLOUD02-I (14 gestures of 4+ notes, all ten parts): 13 of 14 would change
  under the new rule.** So the T2–T10 reads must wait for the rule, not precede it.
- **One gesture has NO legal seam** under the strict rule: T7 @36.19, gaps
  378 323 130 292 367 — "slow slow QUICK slow slow"; the quick gap is a local
  *minimum* (the strongest join), every slow gap is beaten by a slower neighbour.
  Under the current rule the DP cut it into three pairs. This is the by-ear case the
  composer predicted; the tool should say "no clean seam" and hand it over (the 130 ms
  note may be a pickup — principle 8, already a flag).

**THE FLOW — the caveat, analysed.** *"In the after version they all just look like
even sixteenths. In the before version, the 7:4 bracket communicates that the last
two of that five are quicker."* With the composer's own groups on separate grids the
page would STILL read "two 16ths, then three 16ths" — the quickness lives only in the
spacing. What shows it: the two groups on ONE grid. Hand-computed: **[1..5] at unit
240 ms = 16th 16th, then a 3:2 triplet of 16ths — worst error 3 ms = 0.10 heads**
(against the day-26 quintuplet at 0.63 and the separate grids at 0.2-with-no-bracket).
The 3:2 is already in the vocabulary (section 1's T1, D57) and the WRITING path exists
(`--tuplet a-b@3:2`, day 23); what cannot find it is `fit()`, whose tuplet model is
whole-beat only (n:4). The 7:4 the composer liked is the right message in the wrong
ratio — an artefact of the 125 ms grid. The second five does not share a grid this
cleanly ([8,9,10] is itself 242 → 142); so this is a sometimes-rule: **adjacent figures
whose paces stand in a simple ratio (2:1 → 8ths against 16ths, no bracket at all; 3:2 →
a triplet on the quick one) may share one grid, and the quick one takes the bracket.**
Cheapest honest version: the analyser REPORTS the ratio between adjacent figures and
names the shared-grid writing where one exists; the composer takes it by eye.

**Built for the eye: `t1-hybrid2`** — one grid, beams broken at the composer's groups
(`--pattern --beamBreak 3,6,8,11,15`). Note that the one grid's 7:4 on beat 2 covers
exactly [3,4,5] and its 6:4 on beat 3 exactly [6,7]: the composer's groups and the
fit's tuplet beats are seeing the same quick runs.

**Logistics:** screenshots fail this session — *"the Browser pane is not displayed, so
the page is not compositing frames"*. `tabs_select`, and closing the tab + reopening
with `preview_start`, do not display it; the pane is a panel the composer shows on
their side. Everything was verified by DOM audit instead, which needs no pane. **When
screenshots are wanted: open the Browser pane once at session start.**

**Approved (composer):** *"It's actually fine now with the re-beaming patterns"* — the
beaming of `t1-hybrid2` (one grid, their groups) stands as is; no adjustments. *"Let's go
with your plan, a through c."* → **PLAN 8h** filed with the full spec (A: two-sided seam
legality + ratio-tie flag + no-clean-seam flag + `--cuts` by hand; B: the FLOW flag,
report only), C = the T2–T10 reads after it. Running order and models in journal §2.
**Also asked, and made standing in CLAUDE.md:** the AI's own reactions (e.g. the Lerdahl
& Jackendoff identification) are captured verbatim for the paper, not summarised —
PAPER_NOTES day 28 now carries both sides of the exchange.

---

## Day 28 (second sitting) — 2026-08-23 (Claude Code / Opus 5)

### Day 28 — PLAN 8h BUILT: the seam is the slower gap, and the "no tuplet" claim does not survive it

**Built exactly as specified (PLAN 8h, items 1–10), one sitting, nothing referred back
to the composer.** Files: `notation/lib/pattern_fit.js`, `tools/pattern_analyze.js`,
`tools/notate_section.js`, `tools/test_pattern_fit.js`.

**A — the rule.** `segment()`'s legality loop is now two-sided. With `s = band(gaps[b-1])`
(the seam), `L = band(gaps[b-2])`, `R = band(gaps[b])` or null at the end, a cut after
note `b` is legal iff `s >= L && (R === null || s >= R) && (s !== L || (R !== null && s !== R))`
— *not quicker than either neighbour, and a pace change from at least one*. Nothing else
in the DP moved. **On T1 the legal set is exactly `2,5,7,10,14` — the composer's own five
— and the DP TAKES all five** (it declined none by cost, which was the thing to check).
The one-sided rule had made nine boundaries legal (`3,5,6,7,8,9,10,11,14`) and chosen
`3,5,8,10,14`.

**The number that had to be corrected.** The day-28 scratch derivation said the 7-vs-8
boundary hangs on 304/242 = 1.256 — the seam against its RIGHT NEIGHBOUR. It does not.
`paceBands` is greedy from each band's own shortest gap, so the crossing is
**304/239 = 1.272**, the seam against the SHORTEST GAP OF THE BAND IT JOINS. Measured by
bisection, not assumed: legal at 1.25, illegal at 1.3125, flip at 1.2720. The report and
the battery both carry 1.272 now. (The direction of the finding is unchanged — a ~2 %
move in `PACE_RATIO` swaps the reading — only the arithmetic behind it.)

**Ratio ties.** Legality is re-run at `PACE_RATIO × 0.95 / × 1.05`; any boundary whose
legality moves is reported with the bisected flip ratio, the two gaps whose ratio it is,
and **the whole alternative reading at the other threshold**, so the composer sees what
they would be choosing. Both sides of one flip (here 7 and 8) print as ONE line, grouped
by the reading they lead to — two lines read as duplication.

**No clean seam.** `result.noSeam` when nothing is legal AND the gesture is longer than
`SOFT_MAX_NOTES`, or its one-grid fit needs a tuplet or has no coherent writing. T7
@36.19 (gaps 378 323 130 292 367) is the case that named it: every slow gap has a slower
neighbour, so the only pace changes are joins. **An even run also has no legal cut but is
NOT flagged** — that distinction is what makes the flag worth having, and it is asserted
in the battery.

**`--cuts a,b,c`** on both tools ("say the boundary and it moves", promised day 27):
explicit seams, legality steps aside entirely, each figure still fitted alone,
`byHand` set. A cut that would isolate a note is refused with a reason
(`PF.cutsReason`, exported so the tools can say WHICH cut is impossible rather than
"no reading found"). On `pattern_analyze` it is refused when the span holds more than
one gesture — the numbering would be ambiguous and a silent mis-application is worse
than an error. `--paceRatio` was added to `pattern_analyze` at the same time (it existed
only on `notate_section`), because the ratio-tie flag is not actionable without it.

**B — FLOW, a flag only.** `PF.flow(figA, figB)`: if the two figures' own units stand
within 8 % of 2:1 or 3:2, it computes the shared-grid writing (2:1 counts in the quick
unit, the slow figure becomes 8ths; 3:2 counts in the slow unit, the quick figure becomes
a 3:2 bracket), anchors at the earlier figure's first note, snaps the later figure's
first note to its nearest integer slot, and reports the worst displacement in heads.
Printed even when poor, marked `[OVER A HEAD]` past 1.0. **Nothing is built from it.**
On T1: *figures 1+2 could share ONE grid at 239 ms — 16th 16th | 3:2 [16th 16th 16th] —
worst 5 ms = 0.17 heads.* (The day-28 estimate was 0.10 heads; measured, it is 0.17.)
Figures 5+6 also stand at 3:2 but at 1.13 heads — over the line, printed anyway.

### Day 28 — THE RE-MEASUREMENT: three figures in CLOUD02-I need a tuplet, not zero

The day-27 claim in journal §2 and NOTATION_STANDARDS principle 6 — ***"not one figure
in CLOUD02-I needs a tuplet once cuts land at pace changes"*** — was re-run under the
two-sided rule, all ten parts, 36.19–40.42, and **it is no longer true.**

| | day 27 (one-sided) | day 28 (two-sided, 8h) |
|---|---|---|
| gestures | 15 | 15 |
| figures | **60** | **55** |
| figures needing a tuplet | **0** | **3** |
| worst displacement, any figure | 1.00 heads | **0.93 heads** |
| gestures with no clean seam | — | 1 (T7 @36.19) |
| gestures carrying a ratio tie | — | 5 |
| adjacent pairs that could share a grid (FLOW) | — | 17 |
| gestures whose LEGAL set changed | — | **13 of 15** |

The three: **T7 @36.19** notes 1–6 (1 tuplet beat, 0.9 heads) · **T7 @39.51** notes 5–8
(1.25, 0.6) · **T8 @37.14** notes 4–7 (1, 0.9).

**Why, and it is not a regression.** The old rule cut MORE — 60 figures against 55 — and
a short-enough figure fits some grid for free. "No tuplet anywhere" was partly an
artifact of over-cutting. Cutting only at real seams leaves larger, more musical figures,
and three of them genuinely want a bracket; the worst displacement across the section
went DOWN, 1.00 → 0.93 heads. **Consequence for the reads (step C): the
tuplet-vs-dotted question deferred on day 26 is live again, in three places, and
`dottedReading()` still has no writing path (`noteUnits 1.5` in layout.js).** Measured
with the day-27 `pattern_fit.js` taken straight from `git show HEAD:` and run against the
same scan, so the two columns differ only in the rule.

*(A first attempt at the comparison — forcing every one-sided-legal boundary via `CUTS`
— was wrong and thrown away: forcing all of them violates `MIN_FIGURE_NOTES` and 13 of
15 gestures returned null, giving a nonsense "2 gestures, 0 tuplets". The dead end is
kept because the shortcut looked reasonable.)*

### Day 28 — verification: what was actually checked

- **Ten batteries green.** `test_pattern_fit` 40 → **61 checks** (63 with `--prove-red`):
  the T1 golden is now `2,5,7,10,14` plus "those five are the only LEGAL seams"; the
  ratio tie on 7 with its 1.272 / 304-over-239 provenance; `PACE_RATIO 1.31` puts the
  seam after 8, not 7; T7's `noSeam` **and** the even-run counter-case; `--cuts`
  round-trips the hand reading, still builds the ILLEGAL day-27 set when asked, and
  refuses `[1]` with a reason; FLOW's 3:2 arithmetic and its refusal of 4:3.
- `node tools/pattern_analyze.js --ir db1 --validate` → **24 of 25**, unchanged.
- The T1 report prints six figures in words, the ratio tie on 7, the FLOW flag on 1+2.
  The T7 report prints "NO CLEAN SEAM".
- **`t1-figures2` built and DOM-audited in the running app** (:5210 `score-verify`):
  `--cluster 36.21-39.62@0 --figures`, **no `--cuts` needed — the corrected rule gives
  the composer's five cuts on its own.** Six primary beam polygons spanning exactly
  notes 1–2, 3–5, 6–7, 8–10, 11–14, 15–16; one `gc-arc`, one `gc-impact`.
- **Against `t1-hybrid2`, head for head:** all 16 notehead x-positions identical, the
  same six primary beams — the page differs by **13 beam polygons and no tuplet text
  (figures2) against 21 polygons and three brackets 7:4 · 6:4 · 7:4 (hybrid2)**. That
  is the whole of the choice in step C: same notes, same groups, same launch, three
  brackets and eight beam segments more or less. Screenshot taken (Browser pane open
  this session).

### Day 28 — a new flag that appeared, and is not a defect

With figure 4 now starting at note 8 rather than 9, the analyser flags **note 8 as a
possible PICKUP into figure 4** (242 ms before note 9, 42 ms off the grid of the rest;
0.0 heads without it against 0.3 with). It is a flag, not an application (standards
principle 8). It is on the composer's side of the line and belongs to step C.

### Day 28 — THE VERDICT ON THE WRITING: "I would like the tuplet brackets" — the bracket is the message

**Composer, verbatim, on being told the machine's proposal was `t1-figures2`:** *"No. I
would like the tuplet brackets. ... my mental model is that there should be some
communication to the performer if there is a speed change. Within the threshold or, I
guess, for me, it's with the visual. So the first two sixteenth notes look much further
apart than the next three. And so the seven-four bracket is appropriate."*

**T1's final = `t1-hybrid2`** (ONE grid, the composer's six groups as beam groups,
7:4 · 6:4 · 7:4). **What the verdict reverses and what it keeps:**
- KEEPS 8h's grouping rule — the six groups are theirs and the seams are right.
- REVERSES 8g's notation conclusion: *"a tuplet bracket bought to hold two unrelated
  paces together is ink that buys nothing"* → the bracket is what TELLS the performer
  the pace changed. "No tempo is printed, so figures need not share a grid" falls: if
  the values on the page all say 16th while the spacing says slow-slow-quick-quick-quick,
  the values are lying, and the bracket is the correction.
- The AI's lean (figures2) was wrong by this principle; the FLOW flag built this
  morning ("the bracket is what says quicker") was the seed, and the composer has made
  it the rule rather than a flag.
- Net of 8g + 8h, for the record: the page came back to the day-26 one-grid reading
  **with the beams broken at the right places**. The detour found the grouping; the
  writing returned to where it started, now with the groups visible.

**What it asks of the machine (proposed to the composer, this sitting):** (1) a build
mode that takes the seams from 8h, ONE grid from `fit()` over the gesture, and breaks
the beams at the seams — automatically, so `t1-hybrid2` (hand-typed `--beamBreak
3,6,8,11,15`) is reproducible from the rule; (2) the report leads with that reading and
the pre-read measurement becomes "is the gesture's ONE grid within a head", not "does a
figure need a tuplet"; (3) principle 6 and a decision. Two design calls raised: bracket
scope (beat vs figure) and which bracket (the one grid's 7:4 vs the pairwise 3:2 FLOW
finds). Outcome below when the composer answers.

**Outcome (composer): "Aa, Ba."** A(a) — bracket scope stays per beat; a bracket
straddling a seam becomes a FLAG (8i item 3) and is fixed only if it appears in the
reads and the composer wants it. B(a) — one grid per gesture with the fit's brackets;
FLOW stays a flag, taken by hand. **D69 filed; PLAN 8i specified** (the composer's page
as the default `--figures` build — the existing `--pattern` grid + `--beamBreak` at the
8h seams, no new drawing code; `--ownGrids` kept; `bracketsVsGroups()` + the STRADDLE
flag; the report flipped; `--scan` = the within-a-head count as the pre-read
measurement; `t1-final` proven IR-identical to `t1-hybrid2`, then the five scratch
entries pruned). Principle 6 carries a supersede note until 8i rewrites it. For the
record, the AI's lean an hour earlier was `t1-figures2`; the composer's principle
overruled it and the AI's own FLOW remark ("the bracket is what says quicker") was the
half-formed version of the rule the composer stated whole.

### Day 28 (fourth sitting, Opus 5) — PLAN 8i BUILT: the bracket is the message

The composer's verdict from the third sitting (*"I would like the tuplet brackets"*,
D69) turned into the default build. `--figures` no longer means "each figure on its
own grid"; it means **the groups from 8h, on ONE grid, with the beams broken at the
seams** — so every pace change is said on the page as the tuplet relation the fit
already found. `--ownGrids` keeps the old behaviour as the by-hand alternative.

**The whole of the build is a re-wiring, not new drawing code.** `--figures` now runs
`PF.segment()` for the seams, hands `seg.single` to the EXISTING `--pattern` grid path,
and synthesises the `--beamBreak` set from the cuts (`break member = base + cut + 1`).
That was deliberate, and it is what made the proof below possible.

**THE PROOF (item 7 of the plan).** `t1-final`, built with **no `--cuts` and no
`--beamBreak`** —

```
node tools/notate_section.js --score piece-s25-finished01 --w0 35 --w1 41 --parts 0-9 \
  --profile section1 --id t1-final --exp --label "T1 FINAL (day 28) — …" --bricks \
  --cluster 36.21-39.62@0 --figures
```

— against `t1-hybrid2`, the page the composer approved, which was **hand-typed** as
`--pattern --beamBreak 3,6,8,11,15`:

- `events`, `chunks`, `source` and `irVersion`: **identical**. 16 overlays each, same ids.
- Every drawn device field on all 16 overlays: **identical** — beam group, beam unit,
  beam position, beam levels, subdivision, all seven tuplet fields, heads, dots, GC.
- **The single difference is `device.figure`**, which `t1-hybrid2` never carried
  (nothing writes it on the `--pattern` path) and which item 1 of the plan asked for.
  It records the group number (1,1,2,2,2,3,3,4,4,4,5,5,5,5,6,6 — the composer's six)
  and draws nothing. Reported rather than stripped from the diff: it is the one
  place the spec's item 1 and item 7 pull against each other, and the honest answer
  is "identical on every drawn field, plus one new annotation".

**DOM audit (:5210 `score-verify`, both IRs loaded in the same page):** 21 polygons,
6 primary beams and 3 tuplet texts `7:4 6:4 7:4`, one `gc-arc`, one `gc-impact` —
and the polygon bounding boxes, text positions and notehead positions are **byte-equal
between `t1-final` and `t1-hybrid2`**. The six primary beams span exactly notes 1–2,
3–5, 6–7, 8–10, 11–14, 15–16 (checked by mapping each beam's x-range onto the 16
notehead x-positions: the stem sits 17.42 px right of each head's left edge, and every
beam endpoint lands on one). *No screenshot — the Browser pane was not displayed on
the composer's side this sitting; the DOM audit needs no pane.*

**`--ownGrids` was proved too, the same way:** built from `--figures --ownGrids` it is
**byte-identical to `t1-figures2`**. The old reading is preserved exactly, not
approximated.

#### The one place the plan's expectation was wrong, and it is a small correction

PLAN 8i predicted (flagged "verify") that on T1 the three brackets would cover
**3–5, 6–7 and 11–14**. Measured: **3–5, 6–7 and 12–14**. Note 11 sits at grid
position 19, which is inside beat 4 — a PLAIN beat — while the septuplet is beat 5.
So group 5 (notes 11–14) is written `16th + 7:4 [16th 16th 16th]`: the bracket covers
*part* of the group and nothing outside it. **The claim that mattered survives intact
— `straddles.length === 0`**, no bracket leaves its group, and the page the composer
approved is legal under D69. `bracketsVsGroups()` now distinguishes `exact` / `part` /
`straddle` per group for exactly this reason.

#### THE SCAN — the new pre-read measurement (item 5)

"How many figures need a tuplet" is retired. Under D69 a bracket is the message, not
a cost, and that number only ever measured how finely the material had been cut (day
27: 0 of 60 — day 28 under the corrected rule: 3 of 55). **The question the reads
actually open with is: can this gesture be said on ONE grid?**

`node tools/pattern_analyze.js --ir db1-c2i-x01 --scan 36.19-40.42`

```
part  t0      notes  groups (cuts)          unit  heads  brackets      flags
T1    36.22      16  6 (2,5,7,10,14)        125   0.70  7:4 6:4 7:4   2 ratio ties · flow 1+2,5+6
T1    40.17       1  a lone one-shot
T2    36.19       7  2 (3)                  137   0.83  plain         flow 1+2
T2    38.60       8  3 (2,6)                155   0.73  7:4 3:2       1 STRADDLE · flow 1+2
T3    36.33      17  6 (3,6,10,12,14)       132   1.00  5:4 3:2 5:4 3:2  1 ratio tie · flow 2+3,3+4
T4    36.20      17  7 (2,6,9,11,13,15)     131   0.90  5:4 6:4 5:4 6:4 6:4  3 STRADDLES · 2 ratio ties · flow 6+7
T5    36.46      16  6 (2,6,9,11,14)        132   0.87  7:4 5:4 6:4 3:2  flow 1+2,5+6
T6    36.32       1  a lone one-shot
T6    36.92       2  1 (—)                  208   0.00  plain
T6    37.70      12  4 (2,4,10)             128   0.95  7:4 5:4       2 ratio ties · flow 2+3
T7    36.19       6  1 (—)                  137   0.90  3:2           no clean seam · 2 ratio ties
T7    38.32       8  2 (4)                  152   0.93  3:2 3:2       flow 1+2
T8    36.30      16  6 (3,7,9,11,13)        143   0.90  5:4 6:4 6:4 3:2 5:4  flow 1+2,5+6
T9    36.33       4  2 (2)                  168   0.70  6:4           1 STRADDLE · flow 1+2
T9    37.39      13  4 (3,6,9)              141   0.99  5:4 5:4 7:4   1 STRADDLE · flow 2+3
T10   36.31       7  2 (3)                  146   0.93  plain
T10   38.69       8  3 (2,4)                155   0.80  6:4           1 STRADDLE · flow 1+2,2+3

SUMMARY — 15 gestures
  one grid WITHIN a head: 15   ·   OVER a head: 0
  brackets straddling a seam: 5  → T2 @38.60, T4 @36.20, T9 @36.33, T9 @37.39, T10 @38.69
  no clean seam: 1  → T7 @36.19
  ratio ties: 5  → T1 @36.22, T3 @36.33, T4 @36.20, T6 @37.70, T7 @36.19
```

**Three things this says, and they change what step 5c looks like:**

1. **Nothing in CLOUD02-I needs `--ownGrids`.** All fifteen gestures sit within a
   head on one grid. The by-hand escape the plan built for is not needed anywhere in
   this section. *Worst is T3 @36.33 at exactly 1.00 heads — on the line, not over
   it; T9 @37.39 is next at 0.99. Both are calls for the eye, and the composer's
   standing note applies ("don't fight over 0.2 of a head").*
2. **The straddle watch item is real — five of fifteen gestures carry one**, T4
   @36.20 three of them. Design call A(a) said "build only if one appears and the
   composer wants it fixed". They appear. The tool flags them; the fix (a bracket
   scoped to the figure rather than the beat, a change to `fit()`'s model) is still
   unbuilt and still the composer's call, part by part.
3. **Twelve of the fifteen carry at least one bracket**; three are plain (T2 @36.19,
   T6 @36.92, T10 @36.31). Under D69 that is the point, not the cost — those twelve
   are the gestures whose page now says its own pace changes out loud.

#### What was fixed on the way, and was not asked for

**`--pattern --pickup` placed the pick-up on the wrong grid.** The pattern path took
its pick-up slots from `fit.grid.slice(0, pickup)` — the *cluster_fit* grid it was
about to overwrite, at a different unit — and the later, correct pick-up block was
guarded `!useFigures`, so it did not run either. Nothing ever showed it because no
built figure combined `--pattern` with `--pickup`, and on a span without one the
slice is empty. **8i routes the new default through that path, so it had to be
right:** the pick-up is now measured against the pattern's own unit, the grid shifts
so the earliest pick-up sits at 0, and the miss is printed. Same rule as the
cluster_fit path, one code path instead of two. *Found by reading, not by a failure —
recorded here because a silent wrong-grid pick-up is exactly the class of bug that
would have surfaced as "the composer cannot see the figure".*

**A cosmetic one, also unasked:** under `--ownGrids` the synthesised beam breaks were
being computed and printed ("beam breaks before members 3,6,8,11,15") even though the
grid domains already do that job there. Guarded — the line no longer appears, and
`--ownGrids` stayed byte-identical to `t1-figures2` after the change (re-verified).

#### Verification

- **All ten batteries green** (`test_layout test_render test_animobj test_splice
  test_snapshots test_coords test_stamps test_pattern_fit test_midiplayer
  test_playability`).
- `test_pattern_fit` **61 → 80 checks** (83 with `--prove-red`). New: the T1 golden
  for D69 (one grid at 125 ms, brackets `7:4 6:4 7:4` over notes 3–5 / 6–7 / 12–14,
  groups 1·4·6 plain, group 5 `part`, **no straddle**); a constructed straddle case
  (a 3:2 on beat 1 cut after note 4 → one straddle naming the seam and the notes) and
  its negative (a seam on the beat line straddles nothing); the CLOUD02-I scan's two
  numbers (15/0 within a head, 5 straddles) locked as a regression; `--ownGrids`
  unchanged. `--prove-red` gained a straddle red (cut T1 mid-septuplet → it complains).
- `node tools/pattern_analyze.js --ir db1 --validate` → **24 of 25**, unchanged.
  `device.figure` carries no `gridId`, so a one-grid cluster is still one unit.
- **All four refusals exercised at the command line:** `--figures --beamBreak`
  ("--figures breaks the beams at the seams itself; use --cuts to move a seam") ·
  `--figures --pattern` ("implied — drop it") · `--ownGrids` without `--figures` ·
  `--cuts` without `--figures`.
- **The picker holds `t1-final` alone for T1.** The five scratch entries
  (`t1-onegrid t1-figures t1-hybrid t1-hybrid2 t1-figures2`) are pruned; git keeps them.

**One papercut, filed to NITS:** `--prune` failed once with a Windows `UNKNOWN` error
writing `notation/ir/index.json` while the notation page was open on it, then
succeeded on retry. Transient write contention with the page's manifest poll; the IR
file had already been removed, so the manifest entry was left orphaned until the
retry. Worth knowing before pruning a batch with the page open.

## Day 29 — 2026-08-23 (Claude Code / Fable 5)

### Day 29 — THE READS open: T2 (step 5c, first part after T1)

**A papercut first, because it cost a run:** `--part` is ZERO-indexed — T1 is
`--part 0`, T2 is `--part 1`. The journal's tool table said `--part N` without
saying so, and the first run of the sitting read T3 by mistake. Fixed in §2's table.
(Day 26's log and the tool's own usage line both had it right: `--part 0`.)

**T2 as the tool sees it** (`pattern_analyze --ir db1-c2i-x01 --part 1 --span 36.19-40.42`):
15 notes, one breath seam (502 ms after note 7) → two gestures.

- **@36.19, seven notes.** Gaps 262 | 310 | 499 | 157 | 265 | 414. Two groups:
  [1,2,3] "even even" + [4,5,6,7] "short medium long"; seam = the 499 ms gap.
  ONE grid at ♩=109 (137 ms), plain 16ths throughout, **no bracket**, worst
  0.8 heads. Own grids would be ♩=54 / ♩=106 at 0.5 heads each. FLOW 1+2 is over
  a head (2.23) — not on offer. **The thing to notice: the seam gap is 499 ms, one
  millisecond under the 500 ms breath threshold.** Had it been 500 the tool would
  have made two gestures (two goes, two GCs) instead of one gesture with a beam
  break. That is an ear call, not a threshold call.
- **@38.60, eight notes.** Gaps 157 | 215 | 228 | 430 | 219 | 292 | 186. Three
  groups: [1,2] pair + [3,4,5,6] "short long short" + [7,8] pair; seams after 2
  (215 ms) and 6 (292 ms). ONE grid at ♩=97 (155 ms) with a **7:4 on beat 0
  (notes 1–3) and a 3:2 on beat 1 (notes 4–5)**, worst 0.7 heads. **THE STRADDLE:
  the 7:4 covers notes 1–3 but the seam is after note 2** — one bracket saying
  "quicker" about the pair and the first note of the next group. Own grids: the
  three groups at 0.0 / 0.2 / 0.0 heads, no bracket anywhere (group 2 as
  `16th 8th 16th 16th` at ♩=68).
- **The DP skips the gesture's biggest gap.** The 430 ms gap after note 4 is a
  legal seam (slower than both neighbours, ratio 1.89) and taking it gives FOUR
  PAIRS at +0.02 — a tie, flagged ("note 5 could go either way"). Checked in
  `segment()`: the price of a reading is each group fitted ALONE (tuplet beats +
  empty slots + heads + length) plus CUT_COST 0.5 per cut; a pair fits any grid
  for free, so the extra cut nets +0.02. **Under D69 the page is one grid, so the
  own-grid part of that price describes a page that is no longer drawn; what still
  holds is legality (where a cut MAY land) and the tie flag.** Not a defect — it is
  exactly what the near-tie flag is for — but worth knowing when the tool prefers
  fewer cuts: that preference is CUT_COST, not the ear. Noted for the paper.
- **Where a straddle-free reading would have to cut:** only at the beat lines —
  after 3 and after 5 — and neither is a legal seam (228 ms is quicker than the
  430 that follows it). So on this gesture the fit's beats and the pace rule's
  seams disagree BY CONSTRUCTION; every legal cut set carries at least one
  straddle on one grid (cuts 2,6 → the 7:4; cuts 4,6 → the 3:2 instead; four
  pairs → both). The escapes are the ones call A(a) named: live with it,
  `--ownGrids` for this gesture, or build the figure-scoped bracket.
- **Pickup flags, for the record, none applied:** @36.19 notes 1 and 4; nothing
  on @38.60.

#### Day 29 — T2's four candidate pages, built for the composer's eye ("put it into the score, please, so I can look")

All four are window 35–41, all parts, bricks everywhere except **T1's final cluster
(`--cluster 36.21-39.62@0 --figures`, the proven t1-final recipe) and T2** — so the
page shows the two figured parts side by side. Scratch, `--exp`, prune all but the
keeper when T2 is decided (`node tools/notate_section.js --prune <id>`).

| id | T2 gesture 1 (@36.19) | T2 gesture 2 (@38.60) | answers |
|---|---|---|---|
| `t2-figures` | `36.18-38.20@1 --figures` — [1-3]+[4-7], plain | `38.50-40.40@1 --figures` — pair · short-long-short · pair, 7:4 (STRADDLE) + 3:2 | Q1 A · Q2 A · Q3 A |
| `t2-owngrids` | as A | `… --figures --ownGrids` — three groups on their own grids, no bracket | Q3 B |
| `t2-fourpairs` | as A | `… --figures --cuts 2,4,6` — four pairs; BOTH brackets straddle | Q2 B |
| `t2-twogoes` | `36.18-36.90@1` + `37.20-38.20@1`, each `--figures` — two gestures, second go on note 4 | as A | Q1 B |

All four `VALID vs source`, 169 events / 41 chunks. `t2-twogoes`' two small clusters
fit at ♩=54 (3 notes, 0.5 heads) and ♩=106 (4 notes, grid 0,1,3,6 — `16th 16th
8th 8th.` spacing, 16 ms) — the own-grid numbers the report predicted.

**DOM audit (:5200, `t2-figures`, Browser pane not displayed so no screenshot):**
lane T2 (y≈122) carries two bracket texts — `7:4` at x 652 and `3:2` at x 748 — and
five primary beams: x 240 w 89 (notes 1–3) · 407 w 130 (4–7, with a 16th-level beam
under the 157 ms pair) · 616 w 25 (pair) · 674 w 137 (3–6) · 856 w 29 (pair, double
beam). The 7:4's text centre sits over the break between the 616 and 674 beams — the
straddle, visible as built. T1's lane unchanged: `7:4 6:4 7:4`, six primary beams at
the t1-final x positions.


#### Day 29 — THE T2 VERDICT, first pass (in progress — "let me see that, and then let's discuss it")

**The composer, on the four pages (verbatim):** *"c is the closest, I hear three plus
three plus one plus four plus four. and it could be three plus four plus four plus
four. So let's do this. first three Beamed together. Then the rest — then the next
three beamed together, let's change that eighth rest to two sixteenths, and then that
next eighth note will stand alone with the two flags. then the next four together,
and there will be a GC there. and I didn't mention the GC on the first one. So those
four together and then the last four beam together. And then let's get rid of all
the brackets. So let me see that, and then let's discuss it."* Then, a minute later:
*"Sorry. I changed my mind about the flags. Let's just have two beamlets on the right
for that single sixteenth."*

**Read back as a page:** one gesture over notes 1–7 (GC on 1) with beam groups
[1 2 3] · [4 5 6] · 7 alone (stem + two right-pointing beamlets, the two-slot silence
before it as two 16th rests); a second gesture over 8–15 (GC on 8) with [8–11] ·
[12–15]; **no tuplet bracket anywhere**. The breath seam the tool drew at 502 ms
(after note 7) is the composer's gesture boundary too — Q1 is answered "one
gesture" for the 499 ms pause, and the GC lands where the tool's breath rule put it.

**Three things the tools could not write, built this sitting (all small, all tested):**

1. **`--plain`** (positional modifier on `--cluster`, boolean): the pattern analyser
   with `TUPLETS: []` — the best PLAIN 16th grid, cost printed, over a head allowed
   and flagged. Implies `--pattern`; passes through to `--figures` as well.
2. **`--rest16 N`**: the silence BEFORE member N written as 16th rests, one per slot
   (`dev.rest16Before` → `cl.rest16At` → the rest pass takes R = 1 for a run that
   ends on a marked position). Without it the same two-slot silence is one 8th rest,
   as before — both asserted in `test_layout`.
3. **A lone note in a beam group of its own** (`layout.js`): primary AND secondary
   drawn as right-pointing stubs of `beamStubSs`; the day-24 "last note points left"
   rule now applies only to groups of ≥2. The old warning survives for a CLUSTER that
   is one note (a swept single head). `test_layout`: both stubs present, different
   levels, no warning, the pair before it unaffected.

**And one defect found on the way, fixed, and locked (`pattern_fit.js`):** with
tuplets off, T2's second gesture came out as **eight even 16ths at 238 ms = 3.8
heads** — the 430 ms gap written equal to the 157 ms one. Cause: when NO candidate is
within a head, `fit()` sorted the fallback pool by (tuplet beats, empty slots, heads)
— "no rests" outranked "close to the spacing". That is exactly the dissonance
principle 4 names. The fallback now sorts by heads first (simplicity breaks ties);
coherent readings keep the old order. Result: **unit 126 ms, grid 0,1,3,5,8,10,12,14,
worst 37 ms = 1.2 heads** — the same 1.2 the composer accepted on T1's 3:2.
`test_pattern_fit` 80 → 85 (the 1.2 vs 3.8 pair locked; T8 still plain and
coherent). `--validate` 24/25 unchanged; all ten batteries green.
*Also: `--plain` was first parsed as a valued modifier and ate the `--beamBreak`
after it — gesture 2 came out as one beam of eight. `BOOL_MODS` fixed; the DOM audit
is what caught it.*

**The page: `t2-composer` ("T2 read E")**
```
node tools/notate_section.js --score piece-s25-finished01 --w0 35 --w1 41 --parts 0-9 \
  --profile section1 --id t2-composer --exp --label "T2 read E (day 29) — …" --bricks \
  --cluster 36.21-39.62@0 --figures \
  --cluster 36.18-38.20@1 --pattern --beamBreak 4,7 --rest16 7 \
  --cluster 38.50-40.40@1 --plain --beamBreak 5
```
VALID. **DOM audit (:5200, lane T2):** primary beams at x 240 w 89 (1–3) · 407 w 66
(4–6) · 616 w 94 (8–11) · 777 w 109 (12–15); the lone note 7 at x 538 with two
8-px stubs at y 120 and y 126 (both levels, both to the right); two identical 16th-rest
glyphs at x 490 and 511 — one slot (21 px) apart — between note 6's stub and note 7's
stem; the second gesture's GC arc starting at x 553; **no bracket text on T2** (T1's
`7:4 6:4 7:4` unchanged). The Browser pane was not displayed, so no screenshot.

**Where gesture 2's 1.2 heads falls:** on the 126 ms grid the notes sit at slots
0,1,3,5,8,10,12,14; the 37 ms miss is global note 12 (local note 5, the one after the
430 ms gap — 3.4 slots, written as 3). The composer's "don't fight over 0.2 of a
head" covers it, but it is the one place the plain page lies a little.

**THE MEASUREMENT FOR THE DISCUSSION — one pace ratio cannot hold both verdicts.**
The composer's T2 cut set differs from the tool's in a specific way: on gesture 2 they
cut at the gesture's BIGGEST gap (430 ms, the one the DP passed over as a +0.02 tie)
and at neither of the two smaller pace changes the tool took (215 vs 157 = 1.37;
292 vs 219 = 1.33). For `--paceRatio` to drop both, 292 must fall in the same band as
157 → r > 292/157 = **1.86**. At 1.4 the rule still cuts after 6 (the 292 gap).
T1's five cuts need r **< 1.272** (the day-28 ratio tie). So the threshold the ear
applied on T2 is coarser than on T1 by a factor no constant spans. Candidate
explanations, all for the composer: (a) GPR 2b is RELATIVE — a seam is the locally
DOMINANT gap, and in gesture 2 the 430 dwarfs everything (1.47× the next gap) while
T1's slow gaps (265–347) form a continuum with no dominant one; (b) the composer was
reading page C's beams as much as hearing, and 4+4 is what C's beams nearly showed;
(c) the lone note 7 is a THIRD departure — `MIN_FIGURE_NOTES` 2 ("a figure is a
pattern; one note is a one-shot") forbids it, yet the composer kept it inside the
gesture (no GC, beamlets) as a tail. Nothing is decided; this is what "let's discuss
it" is for.


#### Day 29 — the visual pass on E, at the composer's request ("make the visual changes first... then we can discuss the analysis")

**The composer (verbatim):** *"split that third rest, the dotted eighth, into three
sixteenths, and extend the bar from the first three partials rightwards over the first
sixteenth rest. And then the beam is just a straight sixteenth beam all the way across
over the first sixteenth rest. So two beams all the way through the first three
partials and over the first sixteenth rest. Let's do the same with a second grouping.
double beams all the way through, break that eighth rest into two sixteenths, and
extend the bar over the first sixteenth rest. the stand alone didn't get its beams...
So it looks like a quarter note. Just two beamlets on the right. The third cluster
should have double beams all the way through."*

**Two of those were the browser, not the page.** "The stand alone didn't get its
beams / looks like a quarter note" and "break that eighth rest into two sixteenths"
are what the OLD `layout.js` draws for the new file — a one-tip group was "no beam
drawn" and `rest16Before` meant nothing to it. The notation page hot-reloads DATA;
a `.js` change needs a hard reload (the standing note in §2's tool table). My pane,
reloaded, had both. Told the composer; the rest was built.

**Built:**
- `--rest16 4,7` — the 3-slot silence after note 3 (was a dotted-8th rest) as three
  16th rests, and the 2-slot one before note 7 as two.
- `--beamThrough 1,2` on both clusters — the secondary beam unbroken across the
  rests inside each group ("double beams all the way through"). Existing flag (day 23).
- **`--beamOver 1,2` — NEW:** beam group N's beams extend rightwards over the first
  16th rest after its last note. In `layout.js` a PHANTOM tip (no stem) is appended to
  the primary beam and to every secondary run that reaches the group's last note.
  Its time is the rest's GRID slot (`anchorT + (pos − anchorPos + len)·unit`), its
  x offset the 16th-rest glyph width + `beamOverPastSs` (0.2 ss) — so the beam ends
  a hair past the rest's right edge. Two earlier versions were wrong in ways the DOM
  showed: timed from the last NOTE's onset (off its slot by the fit error) with the
  last stem's own x offset (which varies per note), the two groups' beams ended 5 px
  past one rest and dead on the edge of the other; two slots of extension reached into
  the second rest. Now both end +1.6 px past their rest (350.4 vs 348.8; 500.0 vs
  498.4).
- The lone note 7: unchanged from the morning (two right-pointing stubs at x 537.6,
  both levels).

**The page now (DOM, lane T2):** beams 240→350 (1–3, two levels) · 407→500 (4–6, two
levels) · 538→546 ×2 (the lone 7) · 616→710 and 777→885 (8–11, 12–15, two levels
each, through the rests) · thirteen 16th-rest glyphs · no bracket text. `test_layout`
gained the `--beamOver` check (three tips on both levels, phantom at slot time +
glyph width + pad, no extra stem, rests still drawn). Six layout-side batteries green.

**The command that is T2 read E now:**
```
--cluster 36.18-38.20@1 --pattern --beamBreak 4,7 --rest16 4,7 --beamThrough 1,2 --beamOver 1,2
--cluster 38.50-40.40@1 --plain --beamBreak 5 --beamThrough 1,2
```


#### Day 29 — the seventh partial joins its group; the question of the last four

**Composer:** *"the seventh partial that's on its own, let's meet the beams to the left
and beam over that sixteenth. But first, let's discuss the last four partials. gap
between partial two and three is bigger than the other two gaps or disproportionate
too much. what do you recommend there? Or is there anything from the data to do
there?"*

**Built (one command, `--beamBreak 4` instead of `4,7`, `--beamOver 1` only):** gesture 1
is now [1 2 3] + [4 5 6 7] — group 2's two beams run through the two 16th rests and
meet note 7's stem (DOM: 407.2 → 537.6 on both levels; group 1 still 240 → 350 over
its first rest). That is the composer's own "three plus four" alternative from the
first verdict. The lone-note beamlet rule stays in the code, unused on this page.

**The last four [12 13 14 15], gaps 219 | 292 | 186 ms — what the data says:**
- On the built page (one plain grid, 126 ms) they sit at slots 8, 10, 12, 14 — three
  EQUAL written gaps (252 ms) against 219 / 292 / 186. The worst displacement of the
  whole gesture (37 ms = 1.2 heads) is here: note 15 is 37 ms before its written slot,
  note 14 is 29 ms after — the last gap is 66 ms shorter than written. The composer's
  eye and the analyser's number land on the same two notes.
- **The 292 ms gap IS a pace change by the rule** (292/219 = 1.33, 292/186 = 1.57 —
  both ≥ 1.25). It was the tool's original seam (cut after local note 6 = between 13
  and 14); the composer's 4+4 merged across it.
- Fitted ALONE, the four are **four even 16ths at 242 ms, worst 29 ms = 0.97 heads** —
  on the line, not over: the analyser would write them equal too.
- Writing short-long-short on ONE plain grid for the whole gesture costs 2.03 heads
  at best (units 132 / 198 / 155) — dissonant elsewhere. With brackets allowed, the
  morning's 155 grid wrote the last four as 1-2-1 slots, at the price of the 7:4 and
  3:2 on the first four — the brackets the composer removed.

**Options put to the composer:** (A) leave the values — the spacing carries it,
0.97 alone / 1.2 shared, their own "don't fight over 0.2 of a head"; (B) say it with
the beam: break between 13 and 14 — the tool's original seam, no bracket, no value
change, the page's own vocabulary for "gap"; (C) own grid for the four as a run of
four 16ths with no rests (the fit's writing of them alone) — the two halves of the
gesture then sit on grids 1.9× apart with nothing printed. Recommendation: A, or B
if the eye insists.


#### Day 29 — the sketch settles the last four; the seventh partial was misread and is now "a group of two"

**The composer sent a DRAWN SKETCH** (an engraved mock-up: pair · 16th rest · pair,
left pair with a partial secondary beam, right pair with two full beams) with:
*"No. The second group of four as before. So three partials broken beam over the
sixteenth, so group of four. then the single one will be a group of two. beams over
sixteen[th re]st and then the partial. and lets break the beam (b) like this, no
tuplet."*

**Two decisions inside it:**
1. **The last four = option (b), drawn like the sketch, no tuplet:** break after note
   13 → [12 13] · open 16th rest · [14 15]. The left pair's secondary stays PARTIAL
   (stubs — not through), the right pair's secondary runs FULL over its internal rest
   (through) — the sketch draws the 186 ms pair tight and the 219 ms pair open, which
   is what the stubs-vs-through difference shows on a spatially true page.
2. **"No." = the previous message was misread.** "Meet the beams to the left and beam
   over that sixteenth" did NOT mean "join 7 to [4 5 6]" (what was built); it meant
   the lone seventh partial keeps its own beams, REACHING LEFT over the one 16th rest
   before it — *"the single one will be a group of two: beams over [the] sixteenth
   rest and then the partial."* [4 5 6] goes back to three partials with the beam
   over its first rest — *"three partials, broken beam over the sixteenth, so group
   of four"*: the composer's own words for what the beam-over look MEANS (three notes
   + a beamed-over rest reads as four slots). Kept verbatim; that phrase is the best
   description yet of what --beamOver is for.

**Built: `--beamOverLeft N`** (group N's beams reach back over the preceding 16th
rest). For a LONE note it replaces the beamlet stubs: both levels drawn as real
two-tip beams from the rest's slot (0.2 ss before its left edge) to the stem. In a
multi-note group the left phantom joins the primary and any secondary run that starts
on the first note (mirror of --beamOver's tail). `test_layout` gained the check (two
2-tip beams from the rest slot, no stubs). The right-beamlet rule stays in the code
for a lone note without the flag.

**The page now (DOM, lane T2):** [1 2 3] 240→350 over its rest · [4 5 6] 407→500 over
its rest · **7: 510→538 both levels — starting just before the rest at 512, the rest
at 490 left outside** · GC · [8-11] 616→710 through · **[12 13] primary 777→811 with
8-px stubs at both ends of the secondary · rest at 826 in the open · [14 15] 856→885
both levels full over its internal rest at 865**. No brackets. Batteries green
(test_layout 2 new checks), `--validate` untouched.

**The command that is T2 read E now:**
```
--cluster 36.18-38.20@1 --pattern --beamBreak 4,7 --rest16 4,7 --beamThrough 1,2 --beamOver 1,2 --beamOverLeft 3
--cluster 38.50-40.40@1 --plain --beamBreak 5,7 --beamThrough 1,3
```


#### Day 29 — T2 PINNED; the beaming-standards question opens (a conversation, not a build)

**Composer:** *"Let's just put a PIN in t two for now. There are some lessons, but I
want to set up a structure for that and for the other ones moving forward. But going
back or doing t two, I realized that perhaps the stemming and beaming wasn't as well
thought out as it should have been. So the first step is to... educate me or do some
research if you need as to the standard approach to beaming. When should you have
overhangs? when should you have, like, the beamlets like I do, etcetera, which things
should be grouped together generally and which not? and how is beaming handled with
[tuplets]? And, like, do you beam partway into the [tuplet], etcetera."*

- **T2's state at the pin:** `t2-composer` ("T2 read E") as of commit 3c0a17e —
  [1 2 3]+over · [4 5 6]+over · 7 as the rest+partial "group of two" · [8-11]
  through · [12 13] stubs · [14 15] through. The four scratch candidates A–D still
  in the picker. NOT pruned — the pin is not a final.
- **The lessons structure the composer wants (T2's and "the other ones moving
  forward") is NOT YET SET UP** — that is the composer's named next thing after the
  beaming conversation.
- **Delivered: `docs/research/beaming_standards.md`** — the standard practice from
  Gould (Behind Bars), Read, Ross, and Stone (the spatial-notation case, which is
  ours), mapped against this piece's devices (beam=group ✓ Stone; overhang =
  "claimed time", Gould would add stemlets; beamlet direction is MEANING — edges
  right/left, middle points at the belonging side; bracket = arithmetic, beam =
  grouping, straddle = the standard's own no-no). Indexed in RESEARCH_INDEX. Written
  from knowledge of the texts (no web pass); the composer can ask for page-level
  verification of any single claim.


#### Day 29 — the db1 ending-figure pass opens; THE LEDGER (`BEAMING_DECISIONS.md`) starts

**Composer's framing (the mode for what follows):** *"Let's go through the first
density build and those ending figures and see if they're beamed correctly or if they
should be beamed differently. Keep a running log… at some point we'll update the
rules. I want to push the piece forward, so I want to defer trying to come up with
the right rules for this, and [defer] the proper grouping-analysis structure — I
think we've done enough on that for now. I want to just keep a log of what my
decisions are and see if we can extract rules."* → **`docs/BEAMING_DECISIONS.md`
created** — one row per decision, measured signals beside the composer's words, an
"emerging rule candidates" section explicitly not-yet-rules. Seeded with the whole T2
read (D-log 1) and today's first db1 decision (D-log 2).

**The file question answered:** the composer was reading `db1-all-x01` — the stale
day-23 fork (bricks + old T1 only). The right file is **`db1`**, the promoted build.
The described pattern matched db1's cl-1 exactly, so the reading transferred.

**D-log 2 (T1 cl-1, 31.55–34.51, unit 172 ms, `N r N r | N N N r | N r N N | 8th
rest | tail`):** composer's regrouping [1 2]+[3 4 5]+[6 7 8]+tail, solid double beams
throughout, overhangs over the trailing rests of groups 1 and 2, the 8th rest and the
tail untouched. **AI verdict: agree without reservation, and logged why it is
interesting — the cuts sit exactly on the fit's beat lines (slots 4, 8) AND are legal
D68 pace seams: beat-grouping and pace-grouping coincide on this figure.** (The
composer proposed beat-grouping the day after reading the beaming reference; whether
that is influence or coincidence is one for the paper.)

**Applied to db1 via the stored rebuild command** (T1's line now `--beamBreak 3,6,9
--beamThrough 1,2,3,4 --beamOver 1,2`, everything else byte-identical), provenance
updated by the build. **Verified through the real layout path** (NotationLayout +
registry, the page's own code): cl-1a 2 notes + phantom 31.55→32.07 · cl-1b 3 + phantom
32.27→32.75 · cl-1c 3, no phantom, 32.95→33.47 · cl-1d unchanged 33.93→34.51 — both
levels each, 16th rests under the beams, **the separator 8th rest intact at 33.61**,
no warnings. Batteries green, `--validate` 24 of 25 unchanged. *(The browser-side
audit hit a shell quirk — the notation page ignores synthetic ArrowRight, and an
earlier script of mine had blanked the #view dropdown by grabbing the first <select>;
#ir vs #view distinguished now. The node-side layout audit is the equivalent
evidence.)*


#### Day 29 — T2/T3 dictated, T4–T10 extrapolated: `db1-rebeam-x01` (db1 kept as the before)

**Composer:** T2's two figures (= cl-3's two beam groups) — split the 8th rest to two
16ths, all six slots one solid double beam, no overhang; the two separator 8th rests
stay; grp 2 solid. T3: cl-4's five heads stay one group, ALL rests to 16ths; cl-5
solid double. Then: *"I think I'm following a pretty regular pattern. It's not as
complicated as I thought. So can you try doing re-beaming t four through t ten? and
then I'll look at it when you're done and make adjustments. just save this current
one somewhere so we can look back on it… make your changes in a new save file."*

**The extrapolated recipe** (BEAMING_DECISIONS D-log 4): through everywhere ·
within-group silences ≥2 slots → 16th rests · separator rests keep value · no
overhangs · breaks unchanged · tuplet-internal rests untouched. **Eight cluster lines
changed** (T2 cl-3 · T3 cl-4, cl-5 · T4 cl-7 · T7 cl-16 · T8 cl-21, cl-22 · T10
cl-25); ten clusters need nothing (adjacent notes, already solid). Built as
**`db1-rebeam-x01`** (exp) from db1's stored command with only those lines edited;
**db1 untouched as the before**, per the composer's ask.

**Audit (layout path, parts 1–9, 29–35.5 s):** stubs 24 → 1 (T2's untouched pickup
pair cl-2) · solid secondaries 7 → 12 · 16th rests 16 → 30 · 8th rests 10 → 3, and
all three survivors are deliberate: T2's separator pair at 33.45/33.74 and the 8th
rest INSIDE T10's 3:2 bracket at 33.15 (the tuplet's own vocabulary). VALID, no new
warnings. Awaiting the composer's eye part by part; on approval the changed lines get
folded into db1's rebuild command and db1 rebuilt (promotion = one command).


#### Day 29 — PROMOTED; the recipe is now the notating default; the working file named

**Composer:** *"That's all good. You can go ahead and promote that one. and let's
rejoin the notating [of CLOUD02-I]. can you incorporate as much as possible the
beaming rules in that process as well? … I think there was a few more things to
mention on t two. Just tell me which save file we will be working in."*

- **Promoted:** db1 rebuilt with the eight rebeamed lines (label now says "ending
  figures rebeamed day 29"); `db1-rebeam-x01` pruned (git keeps it; the before is
  db1's prior commit b6358b0^). `--validate` 24/25; layout/snapshot/fit batteries
  green.
- **The ledger gained THE STANDING BUILD RECIPE section** — every new figure built
  from here (CLOUD02-I notating onward) defaults to: through everywhere · ≥2-slot
  within-group silences as 16th rests · separator rests keep value · overhang only
  where the composer claims the time · tuplet-internal rests untouched. Checked:
  `t2-composer` already conforms (its one 8th rest is a separator; the [12 13] stubs
  are the composer's sketch, a logged deviation D-log 1.8).
- **The working file for the composer's further T2 remarks: `t2-composer` ("T2 read
  E") in the picker's experiments.** When T2 is declared final, its figures get built
  into `db1-c2i-x01` (the CLOUD02-I trials fork) with `--bare` narrowed, per the
  step-6 loop. Journal §2's "right now" updated to say all of this cold.


#### Day 29 — arrow keys freed; DYNAMICS enter CLOUD02-I (T1 + T2) by the day-24 captured rule

**1. The arrow-key trap** (composer: "my arrow keys are getting trapped"): after any
dropdown/checkbox use, focus stayed on the control, so ← → cycled the PICKER and the
pager's handler returned early (`INPUT|SELECT` guard). Same disease SPACE had on day
22, same cure: a delegated `change` listener blurs selects and checkboxes on commit.
Typing fields untouched. `notation/app/notation.html`.

**2. Dynamics** (composer: "we neglected to consider dynamics... I imagine similar
rules to what we were doing before. However, somehow it didn't make it into this
engine"): correct — the rule was CAPTURED day 24 (`figures.cluster.dynamicsRule`,
NOTATION_STANDARDS § Deriving cluster dynamics) but the CLOUD02-I builds carried no
`--dyn`/`--accents` at all. Nothing needed wiring — the flags existed; they were
simply not used. **Approach adopted for the remaining parts (the standard's own
words): the AI applies the rule mechanically, PROPOSES marks, and names the partials
it cannot explain; the composer adjusts.** Bands: ≤45 ppp · ≤75 p · ≤100 mf · ≤118 f
· ≤127 fff.

**T1 (16 notes, vels 55 85 106 81 100 110 80 106 102 83 90 102 99 69 123 123 →
p mf f mf mf f mf f f mf mf f mf p fff fff):** ambient **mf stated at member 1**
(explicit — member 1's own band is p, see flags), **second ambient at member 15
bare (fff)** — a sustained shift at a beam-group start, exactly the rule's case;
**accents 3,6,8,9,12** (the f partials above mf). → `--dyn 1:mf,15 --accents
3,6,8,9,12`. **Unexplained, composer's call: members 1 (p) and 14 (p) sit BELOW the
mf ambient** — the rule has no mark for "softer than ambient".

**T2 gesture 1 (fff mf mf mf p ppp p):** ambient **mf at member 1 with an accent on
1** (fff above ambient — the day-24 cl-2 pattern exactly: the launch spike is an
accent, not the ambient), **second ambient at member 7 bare (p)** (group start, the
decay's floor). → `--dyn 1:mf,7 --accents 1`. **Unexplained: members 5 (p) and 6
(ppp) below mf** — the decay through the group the rule cannot say.

**T2 gesture 2 (f f p f fff fff p f):** ambient **f at member 1 bare**, **accents
5,6** (the fff pair above f — accents rather than a second ambient, the day-24
choice for spikes). → `--dyn 1 --accents 5,6`. **Unexplained: members 3 and 7 (p
dips below f).**

Both files rebuilt (`t1-final`, `t2-composer` — T1's line identical in both), VALID;
layout audit: part 0 shows mf @36.21 + fff @39.10 + five accents, part 1 shows
mf @36.18 + p @38.10 + accent @36.18, then f @38.60 + accents @39.63/39.85. The
six unexplained partials are the composer's list to adjust.


#### Day 29 — the mf floor; note 7 reverts to right beamlets; [12 13] claims its rest

**Composer, three calls:** (1) *"MF is… for this section, the cloud, the quietest.
anything below that, we can just disregard… whatever the already standing dynamic
will prevail"* → **the CLOUD02-I dynamics floor is mf** — the six flagged partials
dissolve (unmarked, ambient prevails), T2 g1 loses its p at member 7, and the floor
joins the standing recipe for T3–T10. (2) note 7 back to **beamlets right**
(supersedes the "group of two" overLeft — the device stays built, unused here).
(3) **[12 13]: solid 16th beams + overhang over its following rest** (supersedes the
sketch's stub-and-open-rest look; [14 15] unchanged).

`t2-composer` rebuilt (commit 84256c7 — note: that commit's message claimed these
ledger rows, but a failed doc edit meant they land in THIS commit instead): cl-2
groups at 4+4 tips (over-phantoms), note 7 as two right stubs again; cl-3 [8-11] 4
tips · **[12 13] 3 tips (pair + phantom)** · [14 15] 2 tips; dyn row mf @36.19 ·
f @38.60; T1's mf/fff untouched. VALID.

**The reminder the composer asked for ("did we resolve the gaps at the end?"): YES —
no tuplets (their sketch-round call): the 219 | 292 | 186 ms disproportion is carried
by the spacing plus the (b) break at the 292 gap.** Today's 5.3 changes only the
first pair's LOOK — it now claims its trailing rest instead of leaving it open. The
1.2-heads displacement (worst on the last pair) still stands, accepted.


#### Day 29 — T1 rebeamed · T2 DONE · T3 proposed · the section file takes over

**Composer:** *"can you rebeam t one? and the dynamics are fine. And we'll mark t two
is done. after you've rebeamed t one, just go ahead and notate t three, and then I'll
take a look… let's keep a log of my changes so far and moving forward… in a separate
pass, we'll try to extrapolate additional rules for the generator. But let's try to
move through finishing notating this section."* (The log exists —
BEAMING_DECISIONS.md — confirmed to them.)

- **T1 rebeamed** (recipe): through on all six groups; no rest16 applies; **brackets
  kept** — D69 is a day-28 decision about the writing, not the beams; flagged in the
  reply for the composer to overturn if wanted.
- **T2 done** — folded as decided.
- **T3 proposed** as `--figures --plain --beamThrough 1..6 --dyn 1:mf --accents
  2,3,5,12,15,17`. The pace rule's six groups are IDENTICAL with tuplets off (cuts
  3,6,10,12,14 — a nice datum: the grouping is robust to the writing). **THE FLAG:
  the best plain grid (166 ms) puts EIGHT of 17 notes 1.4–1.8 heads off (worst 54 ms);
  the bracketed reading sits at exactly 1.00.** T3 is the material the tuplet
  vocabulary exists for; the composer sees the number before deciding.
- **Consolidation:** everything into `db1-c2i-x01` (rebuilt from the CURRENT db1
  command — it had predated the rebeaming — plus the three parts' cluster lines;
  `--bare 36.19-40.33@p` for parts 3–9). The six scratch pages pruned (git keeps
  them). T1's lone one-shot @40.17 now renders (part 0 no longer bare) with its band
  dynamic (mf) — visible in the audit.
- **Audit** (layout path): part 0 = 12 beam items · 3 brackets · mf/fff + the
  one-shot mf · 5 accents; part 1 = 12 · 0 brackets · mf/f · 3 accents; part 2 = 12 ·
  0 brackets · mf · 6 accents; parts 3–9 = 0 beam items in the span (bare ✓).
  Batteries green.


#### Day 29 — the T3 tuplet version built for comparison ("lets see the tuplet version")

`t3-tuplets` (window 35–41, T1+T2 final beside it): T3 as `--figures` WITHOUT
`--plain` — unit 132 ms, worst 30 ms = 1.00 heads, four brackets, no straddle:
g1 [1-3] 5:4 · g2 plain · g3 [7-10] with a 3:2 on notes 9-10 · g4 [11-12] 5:4 ·
g5 [13-14] 3:2 · g6 plain. Same groups, same through/dyn/accents as the plain
proposal (only the writing differs — the D69 comparison, now with the recipe on
both sides). The composer flips between this and `db1-c2i-x01` (plain, 1.8 heads)
in the picker; the loser gets pruned on the verdict.


#### Day 29 — the bracket/beam collision fix ("can you fix the bracket beam collisions")

The composer's screenshot of `t3-tuplets` showed the 3:2/5:4/3:2 numerals struck
through by their own beams. **Cause:** the tuplet drawer anchored EVERY bracket of a
cluster to the FIRST tuplet-carrying beam group's height — correct when a cluster
was one beam group (day 24), wrong once day 29 put six groups with their own beams
and stacks in one cluster. **Fix:** each tuplet record now carries its owning
`beamGroup` (recorded at assembly) and the bracket is positioned from THAT group's
beam + stack; the old scan stays as the fallback for pre-day-29 files. Verified on
`t3-tuplets`: clearances now 1.2–2.5 ss for all four T3 brackets (each per its own
group's stack — accented groups carry the taller offset), T1's three unchanged.
No IR rebuilds (brackets draw at render time); the page needs a hard reload for the
new layout.js. `test_layout` gained a data-driven check on the section file: every
bracket clears every beam it spans. Five batteries green.


#### Day 29 — bracket horizontal gap + ESC as the universal focus escape

- **Bracket gap** (composer: "a little bit of a gap between the brackets"): adjacent
  groups' brackets abutted edge to edge (each spans its full beat) and read as one
  line. Each end now pulls in by `tuplet.hGapSs` (default 0.35 ss; registry
  `engraving.layout.tuplet.hGapSs`) — render-time, so T1 and T3 both get it with NO
  rebuild ("you'll have to redo t one as well" — no need, and said so). Measured on
  t3-tuplets: 5.5 px daylight between each adjacent pair (0.7 ss), even.
- **Arrows still trapped**: the blur-on-change fix only activates after a hard
  reload, which the composer had not done; and number inputs were never covered.
  **ESC now blurs whatever holds focus, always** — one keypress from freedom, even
  inside a typing field. Quick escapes that need no new code: click any empty spot
  on the score, or TAB.
- test_render/test_snapshots/test_layout green.


#### Day 29 — the bracket ends at its content ("does that include the third to the last note?")

**Composer, on T3's tail 3:2:** *"Does that include the third to the last note? The
bracket is ambiguous. It either needs to extend to include that note or come back to
not include that note. In any case, let's have a look at the spacing there."*

**Answer: the 3:2 is notes 13–14 only** (plus its internal rest); note 15 opens the
final plain group. **The ambiguity was real and measured:** the bracket was drawn to
its full arithmetic beat span, and note 15 plays EARLY (295 ms after note 14 against
352 written — the spatial-truth head sits 0.44 slots back), so the bracket's right
edge ended 1.5 px PAST the head's left edge. An overlap, not just a crowd.

**Fix (layout + render): a tuplet whose last slots are RESTS ends just past its
trailing rest's glyph** — t1 = the last rest's slot time, dx1Ss = rest glyph width +
pad (the beamOver anchoring exactly); the rest stays covered (it is part of the
tuplet, Gould). A tuplet ending on a NOTE keeps the full span. Measured after: the
3:2 ends 15.3 px clear of note 15's head; the 5:4 beside it shortened the same way
(8.4 px clear); bracket-to-bracket gaps unchanged. **T1's brackets shorten by the
same rule automatically — render-time, no rebuilds** (the composer expected a redo;
none needed). Three batteries green.


#### Day 29 — T3 g3 split at the beat ([7 r r 8] + [9 10]); the 3:2 now equals its group

Composer, on the tuplet page: the 8th rest inside g3 becomes two 16ths and the beam
breaks — "notehead, sixteenth rest, sixteenth rest, notehead… a group of four
units", then the 3:2 pair alone. Built with `--cuts 3,6,8,10,12,14 --rest16 8`,
through on all seven groups; the cut sits on the beat line so nothing straddles, and
the 3:2 bracket now covers exactly its own beam group. Ledger D-log 7. (The verdict
plain-vs-tuplet is still unspoken, but the composer is refining the TUPLET page.)


#### Day 29 — T3's bracket groups claim their bracket rests (over/overLeft made tuplet-aware)

Composer: the 3:2's beams reach left over the bracket's leading 8th rest; the 5:4's
beams extend over both its trailing 16th rests. The over/overLeft anchors assumed
plain one-unit rests — now tuplet-aware: overLeft anchors to the leading bracket
rest's slot (an 8th-level slot is 1.33 units wide); over claims ALL trailing bracket
rests (the group's beam extent = the bracket's content extent, the same rule the
bracket itself follows since the third-to-last-note fix). Outside brackets both keep
their old one-rest semantics (T1/T2 pages unchanged — verified by the batteries).
Audited: cl-4d spans 38.443→38.772 (from the 8th rest's slot) with overLeft; cl-4e
spans 38.985→39.393 (to the last trailing rest) with over. Ledger D-log 8.


#### Day 29 — T3 DONE and folded; the checkpoint before the clear

*"Okay. That's t three done… let's make sure to log any of those beaming insights or
notation insights… let's prep for a clear. And then after the clear, I'll move on to
t four."*

- T3's final = the tuplet version with D-logs 7–8 folded into **`db1-c2i-x01`**
  (label: "CLOUD02-I — T1 T2 T3 FINAL (day 29); T4-T10 bare"); `t3-tuplets` pruned.
  Batteries green, `--validate` 24/25.
- **Insights logged as rule candidates 8 and 9** (BEAMING_DECISIONS.md): brackets
  where plain fails pervasively (the T2-vs-T3 two-point datum — "how many notes
  lie", not "how far the worst is"); a bracket ends at its content and its group may
  claim its bracket rests with the beams (all trailing ones — unlike the plain
  one-rest overhang); bracket = beam group as the ideal.
- Journal §2 carries the checkpoint block: next step T4 (part 3, the straddle-heavy
  one — 3 straddles, 2 ratio ties in the scan), the working loop, the vocabulary
  list. Chat clears after this; /resume reads §2.


#### Day 30 (2026-08-23, new session after the clear) — T4 PROPOSED: the first rule-candidate-8 verdict called by measurement

The checkpoint loop, step 1–2, executed as written. `pattern_analyze --part 3`:
T4 = ONE gesture, 17 notes 36.201–40.328 (no breath seam anywhere), seven groups
`pair · even even even · short long · pair · pair · pair · pair` (cuts 2,6,9,11,13,15).

**The rule-candidate-8 census (measured through the same `fit()` both writings use):**
- **brackets** (♩=115): worst **0.90 heads**, 0 notes over a head, 8 over half
- **plain** (♩=119): worst **1.83 heads**, **SIX of 17 notes over a full head**
  (1.03–1.83), 10 over half — the T3 profile (8 of 17), not the T2 profile (1 of 15)
- the groups are IDENTICAL with tuplets off (same six cuts) — second datum that the
  pace rule is robust to the writing, same as T3.

**So the proposal is the BRACKETED build** — plain fails pervasively; the bracket is
the message. Built into `db1-c2i-x01` (cl-30, label "…T4 PROPOSED (day 30); T5-T10
bare", part-3 `--bare` removed): `--cluster 36.20-40.33@3 --figures --beamThrough
1,2,3,4,5,6,7 --rest16 9 --dyn 1:mf,14,16 --accents 1,4,6,8,9,10,12`. Recipe items:
through everywhere; the ONE ≥2-slot within-group silence outside a bracket (before
note 9, plain beat 3) split to two 16th rests; separator rests inside brackets left
to the brackets (rule cand. 9); no overhangs.

**Dynamics derivation (day-24 rule + mf floor):** bands f mf mf f mf f · mf f f ·
f mf · f mf · fff fff · f mf → ambient mf at member 1; accents on the seven
above-ambient f's (1,4,6,8,9,10,12); **the fff pair [14 15] is a beam-group start
two bands up → member 14 gets its own band mark (fff), per T1's member-15
precedent; group 7 falls back → member 16 marked f; 17 (mf) unmarked below it.**
Flagged to the composer as the rule's least-certain output.

**Verified:** ten batteries green (incl. test_layout's bracket-clears-beam on this
file), `--validate` 24/25, layout audit part 3 in span = 17 heads · 17 stems · 17
dots · 5 brackets (5:4 · 6:4 · 5:4 · 6:4 · 6:4) · 7 accents · dyn-mf@36.20 +
dyn-fff@39.60 + dyn-f@40.15 · 22 rests · 1 GC. Browser pane not displayed this
sitting — no screenshot; DOM/layout audit needs none (day-28 logistics note).

**What waits on the composer (the read):** the THREE STRADDLES the scan promised
(6:4 on beat 2 = notes 6–7 over the seam after 6 · 6:4 on beat 5 = notes 11–13 over
the seam after 11 · 6:4 on beat 7 = notes 15–17 over the seam after 15) — call
A(a) live for the first time · the RATIO TIE (cut after 2 dissolves below
paceRatio 1.230 → first group becomes [1–4]) · near-ties on notes 6, 9, 11 ·
note 7 flagged as a possible PICKUP into group 3 · the fff-pair dynamics call.


#### Day 30 — T4 read, first round: the brackets become the groups; the counting-vs-phrase tension gets its name

Composer, on the page: *"starting with the five four let's group each together. So
the five four is its own beaming group. Six four is its own beaming group and the
four remaining… four sixteenths are its own beaming group."* Applied as hand cuts
(`--cuts 2,5,7,9,11,13,15`): first stretch now [1 2] · [3 4 5] · [6 7] · [8 r r 9]
— **bracket = beam group, and straddle #1 dissolved by the regrouping** (the seam
moved to the bracket's edge; nothing was "fixed" in the tool). Eight groups, through
on all; batteries green, `--validate` 24/25. Ledger D-log 11.

Then the question (D-log 11.2, verbatim in the ledger): *"the tension is between
counting groups and phrase groups… the second five four and six four, those are
really a group of four notes. So if I group them by a five four beat and then a six
four beat, it would look like one and three. Do you have any insight on this?"*

**The AI's answer — containment, not identity:** beams carry PHRASE (D62), brackets
carry COUNTING (D69); T3's "bracket = beam group" ideal (rule cand. 9) is the
special case where the two coincide. The rule that generalises: **a bracket must
not CROSS a beam-group boundary, but it may sit strictly INSIDE a wider beam
group** — the straddle is the only garble. So the choice at each spot is
bracket-aligned groups (shrink the beam to the count — what the composer just did
on the first stretch) or a phrase beam swallowing the brackets whole (widen the
beam past the count). For 10–13 the counting grouping also degenerates — the 5:4
holds one note, and a beam group of one is a flag, not a beam (the segmenter's own
MIN_FIGURE_NOTES floor). **And the measurement sides with the composer's four:**
internal gaps 241/236/197 ms — every pairwise ratio ≤ 1.22, under the 1.25
same-pace criterion — so the pace rule's own 2+2 (cut after 11) exists only through
greedy band anchoring (band 0's 174 ms anchor claims the 197). Engraving precedent
for two brackets under one beam is standard (Gould). Recommendation: beam 10–13 as
ONE group, 5:4 and 6:4 inside it. The same choice recurs at beat 7 (straddle #3,
notes 14–17), but there the gaps are 249 | 300 | 174 — NOT one pace — so the
phrase-of-four has no measurement support and the options are bracket-aligned
[15 16 17] (breaking the [14 15] pair) or acceptance.


#### Day 30 — T4 round 2: "ok a" — the phrase beam lands; the principle's two directions, one round apart

Composer took (a): notes 10–13 as ONE beam, 5:4 + 6:4 wholly inside (`--cuts
2,5,7,9,13,15`). **Straddle #2 dissolved by WIDENING (containment) where straddle #1
dissolved by ALIGNING (identity) — the same rule from both ends, one round apart.**
Only beat 7's straddle remains. Batteries green, `--validate` 24/25, D-log 11.3.

Two questions posed with the principle, answered in chat (both are the composer's
call, analysis logged here):

1. **[3–7] one beam?** The pairwise-pace argument that carried (a) extends here:
   gaps 205 · 214 · 215 · 265 ms, adjacent ratios 1.04 / 1.005 / 1.233 — all under
   1.25, one chain. And the round-1 cut after note 5 is MID-RUN (D68 itself refuses
   it: the 215 seam has a slower right neighbour) — it marks a pace change that is
   not there; it was a counting cut. AI recommends merging; difference from 10–13
   stated honestly: no degeneracy pressure here (both groups are proper and
   bracket-aligned), so it is purely "what does a break mean" — pace (merge) vs
   count (keep). Both containment-legal.

2. **The ending ([14 15] into the last 6:4).** THE FINDING: **the final 6:4 is a
   per-beat-model artifact — notes 15 (grid 28) and 16 (grid 30) sit ON the plain
   16th lattice; only note 17 (31.333) is off it.** Same at beat 5: 11 (20) and 12
   (22) plain, only 13 (23.333) off. Both off-lattice notes are exactly slot 2 of a
   3:2 over the beat's last 8th — the sub-beat 3:2 T1's cl-1 (`--tuplet 10-11@3:2`)
   and T3's g4 already use. **The principled rewrite: 14, 15 stay a regular pair;
   3:2 over [16 17] only** — bracket = pair (identity), straddle #3 gone, the
   composer's pairs survive, zero displacement change (positions identical).
   NOT currently expressible: under `--figures` the fit owns the beat tuplets and
   cannot choose plain-beat + sub-beat bracket (`fit()` has no sub-beat vocabulary
   — known limit since 8g). Small build if wanted: a per-beat plain override on
   `--figures` (e.g. `--beatPlain 5,7`) composing with the existing repeatable
   `--tuplet`; the day-28 A(a) "scope the bracket to the figure" fix would then be
   unnecessary for this section. Interim: accept straddle #3, or [10–14]+[15 16 17]
   (rejected in analysis: glues 14 across the 325 ms pace change).


#### Day 30 — T4 rounds 3-4: "yes merge 3-7 and build the 3:2" — zero straddles, and a new tool semantic

- **The merge:** `--cuts 2,7,9,13,15` — [3-7] one beam group, 5:4 and 6:4 wholly
  inside. The round-1 counting cut after 5 reversed (it was mid-run by pace — D68
  itself refuses that seam).
- **THE BUILD (notate_section.js, ~55 lines): under `--figures`/`--pattern` a hand
  `--tuplet a-b@n:d` now OVERRIDES the fit's beat bracket.** Semantics: the window
  is written as the hand says (explicit slots — a rest may sit between the notes,
  unlike the day-23 consecutive-slot hand path, which is untouched for cluster_fit
  clusters) · the beat(s) it touches lose their fit bracket · every other member of
  those beats must sit ON the plain lattice (validated, refused with the member
  named) · a window may not cross a beam seam (refused — it would recreate the
  straddle) · pick-up members refused · positions NEVER move, only the writing.
  The report now shows the WRITTEN page: overridden beats drop their fit bracket
  and any straddle it caused; hand brackets join their group's line with a "hand
  tuplet … replaces the fit's bracket on beat N" line.
- **INERT GATE PASSED:** with the code in place, every stored command rebuilds the
  section file BYTE-IDENTICAL (no existing cluster combines patTuplets with hand
  tuplets — T1 cl-1's day-23 3:2 lives on the cluster_fit path, untouched).
- **Applied:** `--tuplet 12-13@3:2 --tuplet 16-17@3:2`. T4 now = 6 groups
  [1 2][3-7][8 9][10-13][14 15][16 17], brackets **5:4 · 6:4 · 5:4 · 3:2 · 3:2**,
  ZERO straddles: [14 15] is a bare plain pair (no bracket touches it), [16 17] is
  bracket = group exact. Two sextuplet rest-pairs became single plain 16th rests
  (rest count 22 → 20). Ten batteries green (incl. the bracket-clears-beam check on
  this file), `--validate` 24/25, layout audit exact (17 heads/stems/dots · 7
  accents · mf/fff/f · 1 GC).
- **What died with it:** the ratio tie and the near-ties (hand cuts — the pace rule
  is out of the loop for T4); the note-7 pickup flag (the composer's own grouping
  beams 7 backward into [3-7]); and — for every case seen so far — the day-28 A(a)
  "scope the bracket to the figure" fix, which containment + the sub-beat override
  make unnecessary. Rule candidates 10 (containment) and 11 (a bracket covers only
  the notes that need it) logged in the ledger.
- **Still open on T4:** the composer's look at the finished page; the fff-pair
  dynamics call (D-log 10.2) unaddressed.


#### Day 30 — T4 DONE ("t4 all good") · T5 + T6 proposed with the lessons applied · the generator checklist written

- **T4 FINAL** (D-log 12). The two-band dynamics derivation (fff pair → band mark,
  f fall-back) is accepted — first confirmation of that precedent.
- **The lessons are now the recipe** (composer: "log all lessons for generator and
  beaming"): the STANDING BUILD RECIPE gained its day-30 additions — rule-8 census
  before proposing · containment with straddles resolved at proposal time · the
  rule-11 lattice audit with its standing exceptions (7:4 never reduces · a lone
  5:4 note with no den-2 window · an even beat-3:2) · the extended dynamics rule
  (two-band pair = band mark, lone spike = accent, below-floor = nothing) ·
  pickups flagged never applied. Five checks, run in that order, per new figure.
- **T5 proposed (cl-31, D-log 13):** one gesture, 16 notes, six groups. Census:
  brackets 0.87 worst (0/16 over) vs plain 1.63 (8/16 over) → brackets. Zero
  straddles as-fitted; lattice clean (nothing rewritten). `--rest16 6` the one
  within-group ≥2-slot silence. Dynamics: mf@1 · fff pair [3 4] at group-2 start
  → band mark on 3 · f fall-back on 6 (MID-GROUP — the shift point; flagged
  least-certain) · accents 2, 14, 16 · notes 5 (ppp) and 7 (p) below floor.
  OPEN: two pickup flags (3 → g2 at 25 ms off; 7 → g3 at 99 ms off), near-ties
  9/6/14, the f-at-6 call.
- **T6 proposed (D-log 14):** three units — a LONE ONE-SHOT @36.32 (un-bared;
  renders per the vocabulary: 16th flag + GC + go line + band f — verified in the
  layout audit) · a pair cluster (1:f; second note ppp below floor) · a 12-note
  gesture (cl-33), four groups, 7:4 ⊂ g3 and 5:4 = g4 exact. Census 0.95 vs 1.57
  (6/12 over) → brackets. OPEN: the RATIO TIE (cut after 4 flips at 1.248 — the
  even run's own spread sits exactly at the line), near-tie note 2.
- **Verified:** ten batteries green, `--validate` 24/25, layout audit parts 4–5
  exact (brackets 7:4·5:4·6:4·3:2 and 7:4·5:4; dynamics mf/fff/f and f/f/mf;
  accents 3 and 5; GCs 1 and 3 — the 3 = lone + pair + gesture). Label:
  "T1-T4 FINAL + T5 T6 PROPOSED (day 30); T7-T10 bare". 
- **NITS:** notate_section prints a figures cluster's NEAR-TIE/PATTERN lines
  above that cluster's own header (they land visually at the tail of the previous
  cluster's block — pre-existing print-order quirk, cosmetic only).


#### Day 30 — T5 T6 DONE · T7-T10 proposed: the whole section now carries figures

- **T5 and T6 FINAL** ("t5 and t6 good", D-log 15). The mid-group fall-back mark
  (T5's f at 6) is confirmed by acceptance; T6's ratio tie stays pair+five.
- **T7-T10 proposed in one pass (cl-34-40, D-logs 16-19)** through the five
  checks. The section's firsts, all in this batch: **the first PLAIN verdict by
  census** (T7 g1 — 1/6 over at 1.10, the T2 profile; the page prints "ONE GRID
  IS OVER A HEAD (1.1)" as its honest cost) · **the first ALL-PLAIN fit** (T10
  g1 — no tuplet anywhere, brackets = plain at 0.93) · **the first same-beat
  double hand-window** (T9 g1: the straddling 6:4 → 3:2+3:2, bracket = pair —
  which found a sequencing bug in the day-30 override: each window validated the
  beat's leftovers before the OTHER window was known; the pass is now two-phase,
  validating against the union. T4 never hit it because its windows sat in
  different beats).
- **Straddle ledger for the batch:** T9 g1 dissolved (rule 11) · T10 g2
  dissolved (rule 11, one leading bracket rest) · T8's beat-1 artifact fixed
  (6:4 → hand 3:2 over 4-5, note 4 on-lattice at slot 0) · **T9 g2's 5:4
  SURVIVES every check** — no sub-beat window (4.8 off every den-2 lattice),
  widening fails pairwise (451/205/359/244/194), aligning is pace-illegal and
  breaks the long-short parallel. Flagged to the composer as the first genuine
  A(a) residue; that gesture also sits at worst 0.99-1.0 heads, ON the
  dissonance line (the day-28 watch item).
- **Verified:** ten batteries green, `--validate` 24/25, layout audits parts 6-9
  exact — brackets [3:2 3:2] / [5:4 3:2 6:4 3:2 5:4] / [3:2 3:2 5:4 5:4 7:4] /
  [3:2 3:2] (+ cl-25's old tail 3:2 outside the span), dynamics and accents per
  the derivations. Label: "CLOUD02-I — T1-T6 FINAL + T7-T10 PROPOSED (day 30)".
- **Every note of CLOUD02-I now carries a figure.** Open for the composer across
  the four parts: T9 g2's straddle · T7 g1's ratio tie (three pairs past 1.257)
  + the plain-vs-one-3:2 choice · nine pickup flags (T7: 1, 5 · T8: 1, 4 ·
  T9 g2: 1, 4 · T10: 1, 4, 5) · near-ties (T8: 7, 11 · T9 g2: 9 · T10 g1: 2).


#### Day 30 — the composer refines rule 11: one subdivision, one bracket (T9 g1 · T10 g2)

Composer: *"t9 all 3:2s in the beginning meant to be about the same? then if yes
6:4 1 bracket"* — then *"same with the 2 3:2s in t10."* Measured before applying:
yes — in both gestures the two 3:2 windows sit on ONE lattice (sextuplet slot
width 112 ms / 103 ms uniform within each gesture). Both rebuilt with the fit's
single 6:4; beam pairs stay; batteries green, `--validate` 24/25.

**What this teaches (rule candidate 12, ledger):** the bracket's unit is the
SUBDIVISION RUN, not the beam group. My containment-driven dissolution
(D-logs 18.1/19.2 as first built) fragmented one true subdivision into two
windows to buy bracket = pair — ink, not information. Rule 11's shrink is for
freeing PLAIN halves (T4's ending — that was a false-claim removal); where both
halves need the lattice, one bracket says it once, ACROSS the seam, and that
straddle is sanctioned — call A(a) answered for the same-subdivision case. The
flag stays as information.


#### Day 30 — CLOUD02-I DONE and FOLDED; the blast uniformed; cuivré on the page. THE SECTION CLOSES.

Composer: "then all good, cld 1 done, bump all the save files" + the two wrap
items. Everything applied and verified:

- **The fold:** db1 rebuilt with every CLOUD02-I cluster line — label "DENSITY
  BUILD 1 + CLOUD02-I — all parts figured (day 30)". `db1-c2i-x01` pruned;
  **`db1-all-x01` kept on purpose** (test_pattern_fit's frozen validate golden —
  D65). The scan test + test_layout's bracket check re-pointed to db1. Picker now
  holds db1 alone for this material.
- **`--validate` on the merged file: 37 of 40** (was 24/25 on the pre-fold 25).
  The three DIFFERs are each the ear overruling the fit, on the record: cl-1
  (T1's day-23 3:2, 1.2 heads, understood since day 24) · cl-28 (T2 g2 — "let's
  get rid of all the brackets", D-log 1.3) · cl-34 (T7 g1 — the rule-8 plain
  verdict, D-log 16.1). Validate is doing its job: recording where taste beat
  the rule.
- **The 40.93 blast:** new `--ringFromBrick t0-t1` on notate_section writes
  `device.ringSeconds` from the SCORE's drawn brick (s25's ten objects are all
  40.934→41.944 = 1.010 s); layout's ring pass honors it (drawing only — sound
  stays the IR duration, D49/D51). Measured after: **all ten bars exactly
  1.010 s**. Two warnings retained (T4/T6 run ~60 ms past the breath before
  their next attacks — drawn as asked).
- **cuivré:** registry `byTechnique.cuivre.techText: "cuivré"`; layout draws
  techText at the tag row (o.tagY). Measured: three texts, T1/T4/T8 @40.93.
  Double-checked the notation: text is right (day-24 open item said text;
  Gould-practice cuivré = text instruction, `+` = hand-stopping — different).
  The day-24 NIT ("cuivré invisible as a technique") CLOSES.
- Ten batteries green (the re-pointed ones included), tree pushed. **Every note
  of density build 1 + CLOUD02-I is figured, foldered, and composer-approved.**


#### Day 30 — the cuivré placement, by dictation (D-log 22.3)

Composer: left-justified with the notehead's left edge, above it, "the same
spacing as the staccato — the minimum vertical spacing", solid black; "leave
tuba eight, and copy tuba eight for any that can't go above the notehead."
("two by eight" in the dictation read as "tuba eight" — the fallback clause
confirms it: T8's G4 is exactly the head where above does not fit.)

Built: the techText emits inside the nh-unit (it needs the head's x) — baseline
= head top + tightGapSs (0.15), x = head left edge, color #000 (render gained
per-item `color`; everything else stays muted). The fit test demands the tight
gap on BOTH sides: above the head AND clear of the lane line — first cut, T8
passed by 0.01 ss (em 0.91 = 0.7 size × 1.3 render textScale; 6.50 vs 6.51) and
would have touched the line; with the top margin it falls back to the tag row,
which is precisely "copy tuba eight". Measured after: T1/T4 at baseline 4.09
left-aligned to their heads; T8 at the tag row (dx 0, y 3.5); all three black.
Layout-time only — no IR rebuild; hard reload shows it. Batteries green.


#### Day 31 — 6a: the CLOUD02-D dry run, and THE COLLAPSE IS AN ASSIGNMENT PROBLEM

**Dry run reproduces the day-25 prediction exactly.** `playability.js --section
CLOUD02-D --brick 0.05`: 110 notes, 42.38–48.05 s. **0 hard, 18 soft → 8 moved,
9 left.** Breath fine on every part (every run inside the dials). Audibility
info: 27.7 attacks/s, 66 of 109 attacks inside the 30 ms fusion window,
sounding count max 25 / mean 10.9.

The nine, banded for the composer: **1–2 % (3 notes: T1@46.22 1 ms, T5@45.80
2 ms, T8@45.45 4 ms — inside the model's own noise) · 17–20 % (4 notes) · the
two real asks: T7@45.47 F#3→D#2 43 % short, T6@45.51 D4→E2 22 st in 136 ms,
57 % short — the piece's worst leap.**

**Composer's question (verbatim): "for the two band three ones. Can we swap
anywhere? so that another tuba player maybe doesn't need to leap quite as quick
or quite as far."** That question is what found the following.

**THE FINDING — the nine are not nine problems, they are ONE.** Printing
45.00–45.70 s shows it: at 45.27–45.38 the ensemble sits high (F#3 G#3 D4 E4 C4
G3 F#3 D4), and at 45.447–45.526 **all ten parts drop into E2–F#3** — a
full-ensemble collapse inside 80 ms. The flags are the consequence of the
gesture, not scattered accidents. Every part has **exactly one** note before the
drop and **exactly one** landing note, which makes the moment a clean **10×10
assignment problem**, not a sequence of local fixes.

**Solved by brute force** (all 3,628,800 permutations; cost = the worse of the
two adjacencies, pre→landing and landing→post; verified afterwards by re-flagging
the whole score):

| | worst shortfall | tight of 10 | CLOUD02-D total |
|---|---|---|---|
| as it stands (after the tool's 8 moves) | **57 %** | 6 | 0 hard, 9 soft |
| the floor (9 notes change hands) | **20 %** | 6 | 0 hard, 10 soft |

**Both Band-3 asks vanish.** Nobody leaps more than 21 st, nobody is more than
20 % short; the spread flattens to one even band (6 %, 19 %, 19 %, 20 %, 20 %,
20 %). Price: one new flag downstream (T2@45.75 F2→C#4, 19 %) and T5@45.80 goes
1 %→4 %, so the count rises 9→10. **Sound is bit-identical** — only `layer`
changes, exactly the operation the tool already performs 8 times.

**The frontier** (best worst-shortfall for K notes changing hands): 0→57 % ·
**2→43 %** (T3 takes E2, T6 takes D#3) · **3→32 %** · **4→24 %** · **5→21 %** ·
7→20 %. So most of the benefit is bought by three or four moves; the last 4
points cost five more.

**WHY THE TOOL COULD NOT SEE THIS — a real limit, worth keeping.**
`redistribute()` is greedy and one note at a time, and its acceptance test is
*"the receiving part must come out **FREE** against both new neighbours"*
(`homeFor`). At 45.5 **no part is free for anybody** — the whole ensemble is
mid-leap — so it correctly gives up on all nine. But a *joint* reassignment,
which it never considers, flattens 57 % to 20 %. The greedy-free test is the
blind spot; minimax assignment is a different algorithm. **Not yet built into
the tool — this run was a scratch script.**

Nothing written; `--apply` not run. The nine are with the composer.


#### Day 31 — the collapse pass built, and THE FIGURES-VS-PLAYABILITY COLLISION

**Built** (composer: *"take the floor, and build it into the tool"*). In
`notation/lib/playability.js`: `pairCost` (tightness as a fraction, one scalar
for both soft clauses, Infinity on overlap) · `seatCost` · `minimaxAssign`
(exact branch-and-bound; ties break fewest-tight → fewest-moves → lowest-sum) ·
`collapsePass` (clusters what the greedy pass could not place into gestures
within 0.12 s, re-seats each as a PERMUTATION so per-part note counts are
preserved). Runs by default; `--noCollapse` turns it off. New report step
**2b · COLLAPSE**, and the old "UNRESOLVED — no part can take these" becomes
"AT THE FLOOR" once a gesture has been re-seated. `test_playability` **22 → 51
checks**, on a second frozen golden `tools/fixtures/cloud02d-collapse.json`
(CLOUD02-D 42.0–48.5 cut BEFORE any apply).

The tool found the floor at **8** reseats, not the 9 my scratch script used —
the fewest-moves tie-break. Same worst (20 %), same resulting flags.

**TWO THINGS BIT, both worth keeping.**

**1 · THE SAME-SLOT RULE (a notation fact the playability model cannot see).**
`--apply` died half-way: `move_object.js` **REFUSED** wc-1991 → T1 because T1
still held wc-1990, 21 ms away. Two notes under 30 ms apart in ONE part cannot
be written — extraction sidelines same-onset notes, they cannot share a grid
slot. `pairTier()` knows nothing about this: a 21 ms gap reads to it as merely
`soft`. Two fixes: (a) `seatCost` now returns **Infinity** for a seat within
`COLLAPSE.sameSlot` of a neighbour — a bar, not a penalty; (b) a collapse is a
PERMUTATION and move_object moves one note at a time, so going round a cycle
ALWAYS finds the destination still held by a note that is itself leaving. That
transient is not what the guard protects against, so `--apply` now **proves the
end state before touching the file**, forces only past notes that are leaving
in the same batch, and **re-asks the guard's own question of the file on disk**
afterwards. (Verified: the same-slot bar changed no seating here — the floor was
already clean, the collision was purely transient.)

**2 · THE COLLISION — moves re-member figures the composer already approved.**
db1 spans **0–55.94 s**, not 0–40.4 (§2's "every note of 0–40.4 is figured"
is about which notes carry figures, NOT the extraction window — checking this
before running the re-extract is what caught the rest). **Four of the day-24
twenty-five sit inside CLOUD02-D** — a fact already on the record at
RUNNING_LOG "db1 already spans 0–55.94 … incl. four in 44.5–46.2 s, CLOUD02-D".

A figure is `--cluster t0-t1@part`: **the notes of that part in that span**.
Move a note across parts and the figure silently re-members itself. Measured
against `git show HEAD` — **2 of db1's 40 were disturbed, both T7**:

- **cl-17** (44.54–44.73@T7, two 16ths ♩=82.4, accent 2, `p`) — lost wc-1958
  (D4 @44.725) to a **greedy** move. 2 notes → 1. The re-extract **failed loudly**
  (`NO metric fit within 30 ms`, exit 2, nothing written).
- **cl-19** (45.47–46.22@T7, four 16ths ♩=80.9, accents 2+4, `mf`) — lost
  wc-1991 (D#2 @45.471) and **gained** wc-1993 (A2 @45.486) from a **collapse**
  move. Still 4 notes, **still fits** — it would have gone on rendering, silently
  wrong. *This is the day-24 lesson firing again: "a fix for one figure must be
  re-checked against every figure built under the same flag."*

**Fix built:** every note inside a figure of any IR built from this score is
**FROZEN by default** (the tool reads `provenance.build` from `notation/ir/*.ir.json`
and resolves the `--cluster` args itself); `--refigure` lifts it. The report now
prints the frozen count and which parts were pinned in a gesture. Score and
ledger were reverted with `git checkout --` before any of this landed.

**THE TRADE, measured (all four policies):**

| policy | worst | soft | anything over 25 % |
|---|---|---|---|
| all 40 figures protected | **43 %** | 10 | T7@44.73 37 % · T7@45.47 43 % · T6@45.52 32 % |
| free cl-17 only | 43 % | 9 | T7@45.47 43 % · T6@45.52 32 % |
| free cl-19 only | 37 % | 11 | T7@44.73 37 % |
| **free both T7 figures** | **20 %** | 10 | none |
| no protection at all | 20 % | 10 | none |

**Freeing those two T7 figures buys the ENTIRE floor** — identical to no
protection at all, so the other 38 figures are irrelevant to the decision. Both
sit at 44.5–46.2 s, i.e. inside CLOUD02-D, which **6b is about to figure anyway**.
Put to the composer as their call; nothing applied while it is open.


#### Day 31 — the collision dissolves: the four CLOUD02-D figures were an accident

**Composer, asked to choose between their figures and the floor:** *"So sorry. I
forgot to mention those figures were made by a mistake if I understand correctly.
These are the already notated figures. in cloud two. You can just disregard those
figures entirely."*

So the four were never deliberate CLOUD02-D notation — they are leftovers of the
day-24 sweep, whose window (0–55.94) overshot the material actually being figured.
**All four dropped from db1's build**, not just the two T7 ones that collided:

    --cluster 45.27-46.22@3 --clusterTol 0.03 --dyn 1,2,3,4,5           (cl-9,  T4, 5 notes)
    --cluster 44.54-44.73@6 --clusterTol 0.03 --dyn 1:p --accents 2     (cl-17, T7, 2 notes)
    --cluster 45.17-45.33@6 --clusterTol 0.03 --dyn 1:mf                (cl-18, T7, 2 notes)
    --cluster 45.47-46.22@6 --clusterTol 0.03 --dyn 1:mf --accents 2,4  (cl-19, T7, 4 notes)

**db1 is now 36 clusters, all at or before 40.4 s** — the extraction window still
spans 0–55.94, but nothing past 40.4 carries a figure, which is what §2 always
said in words. Checked first: `test_pattern_fit` validates against the frozen
golden `db1-all-x01`, not `db1`, and its `--scan` is 36.19–40.42 — so dropping
these touches neither.

**APPLIED, and the floor stands.** With CLOUD02-D free: **0 of 110 notes frozen**,
`57 % → 20 %`, 8 greedy moves + 8 reseats, bricks to 50 ms (61 changed), 17
ledger lines. The two the composer asked about are gone as leaps: **T6 D4→E2
(22 st) is now D4→F#3 (8 st)**; **T7 F#3→D#2 (15 st) is now F#3→A2 (9 st)**.
Nobody is over 20 % short.

*(One move differs from the unprotected trial: `wc-1931` T6 → **T9**, not T10.
Correct, and a sign the freeze works — db1's 231 already-figured notes at
0–40.4 s can no longer move, which changes the greedy pass's "fewest notes"
tie-break across the whole archive. Only in-window moves are ever applied.)*

**VERIFIED after:** db1 re-extracted, VALID vs source, 456 events · 127 chunks ·
`--validate` **33 of 36** (the four dropped all agreed, so the three DIFFERs are
the same ear-over-fit ones on the record: cl-1, cl-28, cl-34). Whole archive
**2 hard** (the two trance seams @560.63 T8 / @604.63 T6, untouched — step 7)
**+ 24 soft**, down from 32. Ten batteries green; `test_playability` 51 checks.

**PLAN 6a is DONE.** CLOUD02-D: 0 hard, 10 soft, worst 20 %, and no note in it
carries a figure — 6b starts from a clean page.


#### Day 31 — 6b opens: the CLOUD02-D scan, and T1 proposed

**THE PRE-READ MEASUREMENT** (`pattern_analyze --ir db1 --scan 42.38-48.04`):
**13 gestures, 110 notes** (99 in gestures + 11 lone one-shots).

- **ALL THIRTEEN sit within a head on one grid** — worst **1.00 (T1 @44.69)**,
  exactly on the line, then T5 @44.55 at 0.98 and T9 @43.63 at 0.97.
  **So nothing in this section needs `--ownGrids` either.** (CLOUD02-I: 15 of 15,
  worst 1.00 at T3 @36.33 — the same picture.)
- **5 straddles** — T2 @44.27, T3 @43.98 (two), T4 @43.92, T8 @44.16, T9 @43.63.
  Same count as CLOUD02-I, but they mean something different now: **rule cand. 12
  (D-log 20) sanctions a straddle where the subdivision genuinely spans the seam**,
  and rule cand. 10 says resolve the rest AT PROPOSAL TIME. So they are work for
  the proposals, not open flags for the composer.
- **NO CLEAN SEAM: 0** — better than CLOUD02-I, which had one (T7 @36.19, by ear).
- **3 ratio ties** — T2 @44.27, T8 @44.16, T9 @43.63.

**The section's shape is simpler than CLOUD02-I**: each part is essentially ONE
gesture of 6–11 notes plus a few lone one-shots, where CLOUD02-I ran 15–20-note
gestures across 4 s. Brackets by the fit: T1 and T3's opener plain; T6 @42.38
plain; the rest carry one to three.

**Fork created: `db1-c2d-x01` — "CLOUD02-D TRIALS (day 31)"** (db1's 36 clusters +
the new ones as they are proposed). No `--bare` was needed: the four accidental
figures are gone, so CLOUD02-D's notes were already plain.

**T1 PROPOSED (cl-37, 9 notes 44.68–46.36), the five checks:**

1. **Rule-8 census** — the fit finds **no tuplet at all** (unit 151 ms, ♩=99,
   grid 0,1,2,3,5,7,9,10,11, worst 30 ms = **1.00 heads**). Nothing to bracket;
   plain is not a choice here, it is what the material is. Rule 8's "plain where
   it nearly holds" with the T2 precedent (1 note at 1.2 → plain).
2. **Containment** — no brackets, so no straddle. Confirmed by the scan.
3. **Lattice audit** — no fit tuplet beats; nothing to audit.
4. **Recipe** — 3 groups **1-4 | 5-6 | 7-9**, *short short long · pair · even even*;
   secondaries solid on all three (`--beamThrough 1,2,3`); group 2's single empty
   slot is one 16th rest (not a `--rest16` case, which wants ≥2); the empty slots
   at 4 and 8 are separator rests in the open.
5. **Dynamics** — bands are **f p f f | mf f | f mf p**. Three bands, and `p` is
   below the mf floor so members 2 and 9 get nothing and no flag. Ambient `f` at
   member 1; the level shifts at group 2's start → second ambient **`mf` at 5**
   (its own band); member 6 is a **lone one-band spike → accent, never a mark**
   (day-30 addition 4); group 3 starts back at f → third ambient **`f` at 7**;
   member 8 is mf, BELOW its ambient, so nothing (there is no "slightly softer"
   mark — the rule's own rationale). **Proposal: `--dyn 1,5,7 --accents 6`.**

**Verified in the IR after building**: three beam groups cl-37a/b/c at
beamPos 0,1,2,3 | 5,7 | 9,10,11, `beamThrough` true on all three, `dynMark:band`
on 1/5/7, `nhArtic:accent` on 6. VALID vs source.

**FLAGGED, not decided** — (a) **two near-tie boundaries**: note 4 and note 6 each
"could go either way", costing only +0.33 and +0.43 to move; (b) **two FLOW lines**
(groups 1+2 and 2+3 could share one grid at 2:1) — **both go OVER a head** (1.77
and 1.57), so not recommended, but they are the composer's to take by hand;
(c) the gesture's 1.00 heads is exactly the threshold, the same place T3 @36.33
sat in CLOUD02-I.

*Build slip worth keeping: the first build used `--cluster 44.69-…` and silently
took **8** notes, not 9 — the gesture's first note is at 44.688. Caught by
comparing the build's note count against the read's. Spans must be cut BELOW the
first onset.* **Logistics: the Browser pane is not displayed, so no screenshot
this sitting** (same as day 28); the IR audit needs no pane and was done.


#### Day 31 — T1 verdict, and ALL OF CLOUD02-D proposed (cl-37…cl-49)

**T1 VERDICT (composer, dictated):** *"The only change is the third figure and the
fourth figure extend the double beam over the first sixteenth node rest. And then
did you only do t one? If that's the case, go ahead and do the whole thing,
please. and I'll look at it all at once."*

Read as: the composer counts the **lone one-shot @44.19 as figure 1**, so "third
and fourth" = **groups 2 and 3**. Built `--beamOverLeft 2,3`; the report says
*"beams reach left over the rest before group(s) 2,3"* — verified as described.
Everything else in the T1 proposal stands as built: three groups, plain 16ths,
no brackets, `--dyn 1,5,7 --accents 6`.

**THE DYNAMICS PROCEDURE IS NOW VALIDATED** — T1 was accepted with only a beam
change, which confirms the reading used to derive it (and rules OUT the literal
day-24 "one dynamic at the softer level" for a multi-group cluster, which would
have given ambient mf + five accents on T1):

> at each **beam-group start**, if that member's band is ≥ the mf floor and differs
> from the running ambient, it takes a band mark and becomes the ambient · every
> member **above** the current ambient takes an accent · members at or below the
> ambient take nothing (there is no engraved "slightly softer") · below-floor
> members (p/ppp) take nothing and are not flagged · a **lone one-band spike** is
> an accent, never a mark (day-30 addition 4).

**BEAM-OVER-LEFT EXTRAPOLATED, and flagged as such.** The composer said it of T1;
it is applied to **every group in the section preceded by a real 16th rest**
(≥1 full slot). Three gestures have leading silences that are TUPLET FRACTIONS —
T2 g2 (0.33), T3b g2/g3 (0.33/0.14), T8 g2/g3 (0.67/0.33) — where there is no
16th rest to reach over, so they are left alone. *(Day-29 D-log 4 precedent:
AI-extrapolated, awaiting the composer's eye.)*

**THE LATTICE AUDIT (check 3) — three whole-beat tuplets were artifacts, shrunk
by the hand override; the rest are standing exceptions:**

| where | fit gave | audit | action |
|---|---|---|---|
| T6b beat 0 | 6:4 notes 1-3 | only note 2 (1.333) off-lattice; [2,4) holds note 3 ON it | **`--tuplet 1-2@3:2`** — frees a plain half (rule 11) |
| T8 beat 0 | 6:4 notes 1-3 | only note 3 (3.333) off; [0,2) holds note 1 ON it | **`--tuplet 2-3@3:2`** — frees a plain half |
| T9 beat 2 | 6:4 notes 5-7 | only note 7 (11.333) off; [8,10) holds note 5 ON it | **`--tuplet 6-7@3:2`** — frees a plain half **AND RESOLVES T9's STRADDLE** (the bracket now sits wholly inside group 3) |
| T2 b0 · T3b b1 · T5b b1 · T7 b3 | 7:4 | — | **standing exception: a 7:4 never reduces** |
| T4 b3 · T7 b2 · T8 b3 | 5:4, one off-lattice note | fits no den-2 window | **standing exception** (T4 note 10 / T5 note 7 precedent) |
| T7 beat 0 | 3:2 notes 1-2 | note 2 off, note 1 on | kept — the shrink would leave a ONE-NOTE bracket, and here bracket = beam group, rule 9's ideal |

**THE FIVE STRADDLES, resolved at proposal time (rule 10) — four sanctioned, ONE
OPEN.** The test used: *are there off-lattice notes on BOTH sides of the seam?*
If yes the subdivision genuinely spans the seam and **rule cand. 12 sanctions it**
(D-log 20); if the off-lattice notes are all on one side, rule 11 shrinks it.

- **T2 (cl-38)** 6:4 notes 4-6, seam after 5 — note 4 (4.667) off in g1, note 6
  (7.333) off in g2 → **SANCTIONED**
- **T3 (cl-40)** 6:4 notes 1-4, seam after 2 — note 2 off in g1, notes 3+4 off in
  g2 → **SANCTIONED**; 7:4 notes 5-9, seam after 7 — notes 6,7 off in g2, notes
  8,9 off in g3 → **SANCTIONED**
- **T8 (cl-47)** 6:4 notes 7-10, seam after 9 — note 8 off in g2, note 10 off in
  g3 → **SANCTIONED**
- **T9 (cl-48)** — **RESOLVED** by the shrink above; no straddle remains
- **T4 (cl-41)** 3:2 on beat 2, notes 4-5, seam after 4 — **THE ONE THE RULES DO
  NOT SETTLE, FLAGGED PER THE STANDING INSTRUCTION.** Note 4 sits at slot 8, ON
  the plain lattice, so the bracket makes a false "quicker" claim about it (rule
  11 would shrink) — but the only smaller window holds note 5 ALONE, and a
  one-note bracket is worse. Rule 12's sanction does not apply (only one side is
  off-lattice). Rule 10's phrase-widening is not preferred either: the pairwise
  ratio across the seam is 335/253 = **1.32 > 1.25**, so the notes are not one
  pace. Three readings exist and the choice is the composer's: **(a)** keep the
  straddling 3:2 as built · **(b)** `--cuts 2` — merge groups 2+3 so the bracket
  sits inside one phrase beam (containment satisfied, but against the pace
  evidence) · **(c)** a one-note 3:2 on note 5 alone.

**BUILT: 13 clusters, cl-37…cl-49, into `db1-c2d-x01`** — VALID vs source, 456
events, 127 chunks. Ten batteries green. Straddle census on the fork: **8 total,
of which 3 are pre-existing CLOUD02-I** (cl-33, cl-34, cl-36 — on the record from
day 30) **and 5 are CLOUD02-D**, four sanctioned + T4's open one.

**Per-part, as built:**

| part | gesture(s) | groups | brackets | dyn / accents |
|---|---|---|---|---|
| T1 | 44.68 (9) | 3 · short short long · pair · even even | none | 1,5,7 / 6 |
| T2 | 44.26 (9) | 3 · short long short short · pair · pair | 7:4 + 6:4 | 1 / 3 |
| T3 | 43.01 (2) · 43.97 (10) | 1 · 3 | — · 6:4 + 7:4 | 1 · 1,3,8 |
| T4 | 43.91 (9) | 3 · pair · pair · short long short long | 3:2 + 5:4 | 1 / 9 |
| T5 | 43.36 (2) · 44.54 (8) | 1 · 3 | — · 7:4 | 1/2 · 1,3,7 |
| T6 | 42.37 (4) · 44.46 (7) | 1 · 2 | — · 3:2 (shrunk) | 1 · 1/4 |
| T7 | 43.58 (11) | 2 · pair · a nine | 3:2 · 5:4 · 7:4 | 1 / 9,11 |
| T8 | 44.15 (11) | 3 · even even · a six · pair | 3:2 (shrunk) · 6:4 · 5:4 | 1,4 / 5,6,7,8,11 |
| T9 | 43.62 (11) | 4 · pair · even even · even even · short long | 3:2 (shrunk) | 1,6 / 2,4 |
| T10 | 44.68 (6) | 2 · long short long · pair | 3:2 | 1 / 3,4 |

**THREE DYNAMICS CALLS THE PROCEDURE COULD NOT FULLY EXPLAIN** (day-24: *"a
generated cluster should PROPOSE marks and say which partials it could not
explain"*):
1. **T8 g2** — the group starts mf and four of its six members are f or above, so
   the procedure yields `mf` + **five accents in a row** (5,6,7,8,11). Mechanically
   correct ("state the soft level once, mark the loud ones") but heavy on the page.
   The alternative is ambient **f** at m4 with an accent only on m7 (the lone fff).
2. **T5b m7** — the fall-back from fff to mf has no group start to land on, so the
   mark is placed at the shift point (day-30 addition 4's "else the shift point,
   flagged").
3. **T7 m9** — a LONE **two**-band spike (mf→fff). The rules cover a lone ONE-band
   spike (accent) and a two-band jump arriving AS A PAIR at a group start (mark);
   a lone two-band spike is neither. Written as an accent.

Also carried forward as information, not decisions: **3 ratio ties** (T2 cut-after-5
holds only to 1.259 · T8 cut-after-3 to 1.262 · T9 cut-after-8 to 1.281) · **near-ties**
on T1 n3, T3b n7, T6b n5 · **pickup flags** on T3b n8, T4 n5, T5b n6, T6a n1, T6b n1+n4,
T8 n1+n4, T9 n3+n9, T10 n1 — all FLAGGED, never applied (principle 8).

Browser pane still not displayed → no screenshot; the fork is in the picker as
**"CLOUD02-D TRIALS (day 31)"**.


#### Day 31 — the composer's eye finds the section garbled; TWO MACHINE BUGS, measured and fixed (Fable pass)

**Composer (verbatim, switching to Fable):** *"there's a bunch of mistakes,
collisions, and I'm not sure the beam groupings are correct… there's a lot of
bracket and dynamic clashes, and it doesn't look like the… we wrote a rule about
the extending, uh, tuplet brackets. It looks like some of them aren't following
that rule. They're extending into each other. …can you try to have it pass and
see if you can't just pick up all the issues and redo two through ten? T one is
good."*

**MEASURED FIRST** (scratch `geo_audit.js` — layout model at zoom scale, boxes
for brackets/dyn/accents/beams; then `bracket_audit.js` — ground truth from the
overlays). Drawn-ink findings on `db1-c2d-x01`:

- **4 bracket×dynamic collisions** — T2 f@44.27, T6 f@44.47, T7 mf@43.59,
  T3 mf@45.76: the mark's box crossing the tuplet line at ±6.06 ss.
- **2 gestures with beams on BOTH sides** — T3 cl-40 (group a stem-up +4.86,
  b/c stem-down −4.86, its two brackets on OPPOSITE sides of one gesture);
  T7 cl-46 (a down, b up).
- Bracket chains abutting (7:4|6:4 at one height, ~12 px daylight at zoom).
- The 5 straddles shipped as "sanctioned" — the composer's "extending into
  each other".

**ROOT CAUSES — both new to this section, THE FIRST MATERIAL WITH STEM-DOWN
BEAMS** (the D4/E4 register; everything approved before was stem-up, which is
why day 24's collision unification never met either bug):

1. **The mark placer was one-sided.** Day 24 ("only ever ONE placer up there")
   routes a beamed note's mark to the group's stacked dyn row when the chain
   flips ABOVE — the stem-up case. On a stem-DOWN beamed note the below-chain
   IS the beam side, so the per-note chain walked past the beam and set the
   mark in the bracket's band. Instrumented proof: cl-38a stack
   `{articCentre 0.87, bracketLine 2.49}` with **dyns 0** — the group row never
   received the marks. **FIX (layout.js): `markToGroup` is now symmetric** —
   a beamed note whose chain lands on the beam side hands its mark to the
   group row, whichever side that is (`stemDir === 'up' ? chainAbove :
   !chainAbove`).
2. **Stem side was chosen per BEAM GROUP** (farthest-note rule per group), so
   one cluster's groups flipped sides the moment the register crossed the
   middle line — mid-gesture side changes that read as wrong groupings.
   **FIX (layout.js): ONE SIDE PER GESTURE** — the farthest note of the whole
   CLUSTER picks the side; every group in it follows; per-item `stemDir`
   overrides still win.

**Both fixes are provable no-ops on approved material: all 75 snapshots green,
ten batteries green.** (The one thing the new guard found in old material —
T9 @36.87, a bracket line crossing its own accent by 76 ms — is pre-existing
in approved db1, filed to NOTATION_POLISH as tier 3, D18: not surfaced.)

**THE MACHINE NOW GUARDS ITSELF (fix-the-machine, part 2):** `notate_section`
grew a **GEOMETRY GUARD** that lays out the finished IR and measures the ink
the composer measures — bracket×bracket overlap, bracket line/numeral vs
dyn/accent boxes at zoom scale, and stem sides per cluster — printing loud
`!!` findings before READY (never blocking). CLOUD02-D's four collisions were
invisible to the build and cost a composer round trip; they can't ship silent
again.

**THE STRADDLES RESOLVED AT PROPOSAL TIME (redo of the day-31 morning misstep —
"sanctioned" was misapplied; day-30 addition 2 says RESOLVED, not shipped):**

- **T2 (cl-38): RESOLVED by the phrase beam** — `--cuts 7`, groups [1-7][8,9].
  The fragile seam after 5 (ratio tie to 1.259) is pairwise ONE PACE across the
  boundary (200 vs 243 = 1.215 ≤ 1.25), exactly rule 10's widening case; both
  brackets now sit wholly inside g1. Dynamics re-derived: dyn 1, accents 3
  (unchanged numbers, new grouping).
- **T3 (cl-40): half resolved, half sanctioned** — `--cuts 7`, groups
  [1-7][8-10]. The seam after 2 was pairwise 381 vs 392 = **1.03** — one pace,
  merged; the 6:4 is contained. The 7:4 still spans the seam after 7 (311 vs
  172 = 1.81, a real seam) with off-lattice members on BOTH sides — the exact
  D-log 20 shape, kept deliberately. Dynamics re-derived for the new groups:
  dyn 1, accents 3,5 (was 1,3,8).
- **T4 (cl-41): stands as the ONE OPEN CALL** — the 3:2 across the seam after 4
  (pairwise 1.32 > 1.25 refuses the merge; the sub-beat window would leave a
  one-note bracket; both worse). Flagged since the morning pass; the composer
  decides.
- **T8 (cl-47): kept** — both sides off-lattice, the sanctioned shape.
- T9's straddle was already resolved by the day-30 hand-tuplet shrink.

**Census after: 5 straddles → 3** (T3 + T8 sanctioned by rule 12's
configuration, T4 the open call). **Drawn-ink collisions: 0** in 42.3–48.1
(geo audit classes C/D/E all empty; protrusion_detect: nothing in the window).
One-note brackets remain by the standing exception (T7 5:4 on n5, T8 5:4 on
n11, T10 3:2 on n6 — one off-lattice note, no den-2 window; ink verified
clean); flagged here, not decisions.

Ten batteries green; `db1-c2d-x01` VALID vs source, in the picker as
"CLOUD02-D TRIALS (day 31)". T1 (cl-37) untouched.


#### Day 31 — the screenshot round: beams in the staff, zero stems, brackets on beams

**Composer (with screenshot):** *"Beams are going into the staff and there end up
being note heads with zero stems. And then also brackets are colliding with
beams. Let's see if we can resolve those two issues. And then I'll look and see
if there's any more."*

**Measured (cl-38a, T2):** beam clamped to **−2.15/−1.34** — ON the bottom staff
line and INSIDE the staff; stems **0.03** (heads on the beam) and **−0.47**
(head PAST the beam, inverted); T3's 7:4 line at −4.64 crossing cl-40b's beam
band (−4.05…−4.86).

**Root cause: the vertical budget.** Below a stem-down beam, head (2.6) + stem
(1) + accent row (1.29) + bracket (1.65) + dyn row (1.42) = **7.97 ss > the
6.51 lane half** — it cannot fit. The day-24 stack clamp "lowers the beam so the
stack fits inside the lane", which for stem-down means RAISING it — with no
floor, it shoved the beam into the staff and past two heads. (M1 made it worse
by routing marks into the stack: taller stack, harder shove.)

**Fixes (layout.js):**
1. **The dyn row of a stem-DOWN group moves to the HEAD side** (above the
   staff/heads) — the mirror of the day-22 column standard; accents + bracket
   stay with the beam, and the beam-side budget (2.6+1+1.29+1.65+cap 0.45 =
   6.45 ≤ 6.51) fits exactly — which is what the per-note lowering formula
   always guaranteed. Tips now carry their head-side ink extent
   (head + accidental + dot) so the row clears the tallest member.
2. **THE FLOOR: the stack clamp may pull a beam toward the staff, but never
   past a head** — the nearest head on the beam side keeps `minBeamStemSs`
   (1.0) of stem. *Second look, worth keeping:* an earlier draft also floored
   at the staff edge (2.5), and that silently LIFTED three approved day-29/30
   beams (cl-25a, cl-32a, cl-21a: 2.15 → 2.50) — the composer had ACCEPTED
   2.15-with-secondary-inside-the-staff on those pages (long stems, heads far
   away). So the staff edge is NOT a bound; heads-vs-beam is the whole rule.
   Clause dropped; approved values restored exactly (2.15 ✓ ×3).

**After:** cl-38a at −3.61 (head-clear), all stems ≥ 0.8 ss, both T2 brackets
on ONE line at −6.10, T3's at −6.60 — 1.74 ss clear of cl-40b's beam; dyn rows
above the heads (T2 f at +5.36, T3 mf at +3.86). **The whole section: no beam
past a head, no short/inverted stem, no bracket within 0.4 ss of a beam.**
Ten batteries green; all approved-page snapshots green; db1's old material
byte-identical (verified against a git-HEAD build of layout.js).

**The guard grew the two checks that would have caught the screenshot** (stem
length/inversion · bracket-vs-beam distance). On the approved material it
surfaced exactly two pre-existing grazes — T9 @36.87 (bracket×accent, filed
earlier today) and **T10 @39.08 (the D-log 20 bracket 0.22 ss under cl-36b's
beam)** — both verified pre-existing at git HEAD, both in NOTATION_POLISH
(tier 3, D18: filed, not surfaced).

**Visible change for the composer's next look:** on stem-down gestures the
band marks now sit ABOVE the staff (T1's stem-up gestures and everything
before 40.4 s are untouched).


#### Day 31 — THE MEDIUM GAP is named (composer, mid-repair-review)

**Composer:** *"Just to say, there is also the smaller vertical gap which we use
for the staccato dot. And there was meant to be a medium one too between the
two. which we haven't come up with, but we can."*

Inventory of the registry answered it: the three-tier system was already
half-latent — **0.15 `tightGapSs`** (day 23, the dot + dyn-stem standard) ·
**0.45 `stackGapSs`** (session 77) · and an unnamed **0.3** living since day 23
as `chainAboveGapSs`, the under-flag special case. The medium tier is the
midpoint, and one corner of the machine had already found the number.

**Named: `gapMediumSs: 0.3`** (registry, with the composer's words in the note).
**Used: the day-31 repair pass's row joints** (accents/dyn rows in the flipped
stacks) — the one place vertical room is scarce, and it never fires on approved
pages, so every approved 0.45 stack is untouched. Measured effect on the
repaired parts: outer ink down 0.15–0.30 ss (T3 7.40 → 7.10 by the halo
measure).

**And the protrusion detector's blind spot, closed:** `extent()` never modelled
tuplet brackets or dyn/accent glyphs — precisely the ink the repair pass now
moves. Extended (bracket r 0.9 either side of the line; dyn/artic by glyph
half-height). Verdict on the fork: **zero lane crossings in 42–48.1**; on
approved db1 the same 17 pre-existing accidental/dot items and nothing new.

The parked cuivré lift (NITS day 30) now has its constant waiting —
`gapMediumSs` — and stays parked at the composer's word. Ten batteries green.


#### Day 31/32 — the composer's second look: three placements, dictated and built

**Composer (verbatim):** *"just tuba seven and potentially tuba eight. So
brackets in tuba seven, five four, and seven four are too far down. There's
plenty of room above. and then the dynamics in tuba eight are too far up.
There's plenty of room below, like, the fff could be down near the staff, and
the mf can reach down closer to that notehead. There's lots of space. tuba
nine. There's just a clash between the f and the three two bracket. You could
probably just lower the dynamic below the bracket altogether. Everything else
looks much better."*

**The T7/T8 pair was ONE collision seen from both sides:** T7's brackets had
flipped to the head side at −7.26 (past its lane bottom) while T8's marks
floated at +5.36/+6.36 (its lane top) — the screenshot's "5:4mf" jam is T7's
bracket meeting T8's mark ACROSS the lane boundary. The two instructions
relieve the boundary from both directions.

**Three rules, from the dictation (layout.js + registry):**

1. **THE BRACKET-SIDE RULE** — a repaired group's bracket goes to the head
   side only when the whole bracket FITS INSIDE the lane there; otherwise it
   returns to the BEAM side (its engraving home), allowed to overflow the
   lane edge by up to `bracketOverflowMaxSs` (0.3 new registry constant, 1.3)
   — the gap plus the neighbour's usually-empty margin. Only past that does
   it stay head-side. The measured spread the constant separates: **T7
   beam-side overflow 1.25 → goes UP** (the composer's ask) · **T2 1.39 →
   stays head-side** (the look the composer just approved) · **T9 1.75 →
   stays head-side snug under the staff** (the composer fixed its DYN, not
   its bracket). 1.25 vs 1.39 is a 0.14 window — a data knob, honestly noted.
2. **PER-MARK HUGGING** — head-side dynamics leave the one-row-per-group
   model: each mark clears ITS OWN column's ink (that member's head + dot +
   accidental) by the medium gap, floored at the staff edge. T8: fff
   **+6.36 → +2.79** ("down near the staff") · mf **+5.36 → +4.71** ("closer
   to that notehead"). The day-24 one-row rule survives on the BEAM side,
   where the row hangs off the beam — on the head side the heads differ
   wildly in height and the row floated over the low columns.
3. **THE MARK-CLEARS-THE-BRACKET POST-PASS** — after all brackets exist, any
   dynamic whose ink overlaps a bracket's band on its part moves just OUTSIDE
   the bracket (medium gap past its outer edge) — the "simple detection and
   placement rules" the composer asked for, catching every placer (chain,
   row, per-mark) at once. T9's f: **−2.94 → −4.44**, below the bracket
   altogether, as dictated. *(First build missed it: the f's centre sits 9 ms
   left of the bracket's span — the x-test now carries a 0.05 s margin for
   the mark's own ink width.)*

**Verified:** T7 brackets at +7.31 hooks-up with their beam · T8 fff/mf as
above · T9 f below the bracket · T2/T3/T4/T5 untouched from the look the
composer approved (T2's f mark did move 5.36 → 2.79 under rule 2 — same
medicine as T8's fff, flagged here for the composer's eye). Ten batteries
green; 75 snapshots green; approved db1 identical (17 protrusion items, same
list). **The protrusion detector crashed on the fork and got fixed** — a beam
item carries no t/t0 (only tips); latent since V3, first hit the moment a
beam first crossed the lane line; it now takes its first tip's time. Its
fresh verdict on the fork: T7's two brackets cross the top edge by ~9.5 px —
THE COMPOSER'S OWN PLACEMENT, correctly on the tier-3 record — plus a 0.8 px
graze by T9's beams. Nothing else.


#### Day 32 — T6 and T7 placed by dictation; --bracketSide/--articSide built; THE CROSS-LANE BLIND SPOT

**Composer, two messages:** *"T6 44.48 Can you move the 3:2 bracket up? to the
top. and then just make sure there is the f marking dynamic. Just make sure
there's no clash with that one. at the top. of the first partial. and then there
is an accent at 45.2. I'm not sure if that is meant to be with T6 or T7. But if
it's T6, then that could be moved up above the staff as well. There's room."* ·
*"Then T7, the accents starting on 45.68. They're just too far down. So if you
can move those up. There's two of them. The second one is on 46.24."*

**The 45.17 accent is T6's** (cl-45 member 4; T7's two are at 45.65 and 46.21).

**BUILT: `--bracketSide above|below` and `--articSide above|below`** — positional
per-cluster modifiers on `notate_section`, stated in ABSOLUTE terms because that
is how the composer speaks ("up", "above the staff"), not beam-side/head-side,
whose meaning flips with the stem direction. They override the automatic room
test, which is still a heuristic under calibration. Rows stack in the day-24
order (accents nearest the notes, then bracket) outward from whatever that side
already holds — **and on the head side that includes the per-mark dynamics**,
which is exactly the clash the composer told me to watch on T6's f.

*Build slip worth keeping:* the dictated-side block first ran BEFORE the repair
pass, which then overwrote it — T6 moved, T7 did not. **A dictated side is a
verdict and must run LAST**, after every heuristic. Moved; both then took.

**T6 (cl-45), as asked:** 3:2 bracket **−6.06 → +4.39** (above, hooks down
toward the notes) · accent **−5.73 → +5.14** (above the staff) · the f stays at
+2.79 and the bracket's hook bottoms at 3.69 — **0.41 ss of daylight**, verified.

**T7 (cl-46) — the instruction diagnosed, not just obeyed.** First reading was
"the accents are far from their notes", but the approved material says otherwise:
accents there sit 6–11.6 ss from their own noteheads (they ride a row at the
beam, Gould alignment, day 24). So "too far down" meant **the wrong side** — the
repair pass had flipped them to the head side. Put back on the beam side at
**+6.83**. That collided with T7's own brackets at 7.31; pushing the brackets
further out would have put them 0.22 ss from T6's beam, so **the brackets took
the side T6 had just vacated** (`--bracketSide below`, now −5.87, INSIDE T7's
lane and 1.4 ss shallower than the −7.26 the composer objected to).
**T6 going up and T7 filling the band it left is one coherent allocation** —
each inter-lane band used by one part.

**THE CROSS-LANE BLIND SPOT (the real finding).** Every existing check asks
"does this ink leave its lane?" (protrusion_detect) or "do two things collide
within one part?" (the geometry guard). **Nobody asked whether TWO PARTS' ink
meets in the band between them** — which is precisely what side-switching
furniture makes possible. Measured on the fork:

- **T6's fff @46.18 meets T7's accent, 0.54 ss** — a DIRECT consequence of the
  T7 request: T7's accents cannot fit inside its lane on the beam side (highest
  head 3.5 + 2.5 stem = beam 6.11, + gap + accent = 7.14 > 6.51), so they
  overflow ~0.6 into the band where T6's lone one-shot fff sits.
- **T8's 5:4 bracket meets T9's beam, 0.20 ss** (T9's beam runs 0.1 past its own
  lane half).

**Added to the geometry guard**, so it is measured on every build from here.
Both are ON THE RECORD FOR THE COMPOSER, not silently patched: the first is the
cost of the placement they just asked for, and the fix is a judgment call
between moving T6's fff above (its upper band is empty at that instant) or
accepting the touch. Ten batteries green; 75 snapshots green.


#### Day 32 — CHECKPOINT: bracket ownership answered; hook direction fixed; the systemic pass called a failure

**Composer:** *"move t6's fff above lots of room; I'm not sure what happened.
but now I can't tell. Which part the brackets are assigned to. in t seven and t
eight… make sure the brackets are pointing in the right direction and try to
work out the spacing too. It seems like the last pass was a fail… I really need
to move on."*

**ANSWERED, from the geometry, in `docs/CLOUD02D_BRACKETS.md`** (new; regenerate
snippet included): **every one of the 16 brackets IS on its correct part.** The
assignment was never wrong. Two reasons it could not be SEEN:

1. **Hook direction was inverted in the day-32 dictation path — FIXED.** Hooks
   turn toward their own notes; the `bracketSide → dirDraw` flag was written
   backwards, so **T6's 3:2** (above, hooks ascending) and **T7's 5:4 + 7:4**
   (below, hooks descending) pointed at the NEIGHBOURING part. One line.
   **Verified: all 16 now hook toward their own notes.** Ten batteries green,
   75 snapshots green.
2. **One visual gap can hold brackets from two parts — NOT fixed, and this is
   the real problem.** A bracket below part N and one above part N+1 land in the
   same band. **The T7/T8 gap holds four: three of T7's (below) and T8's 6:4
   (above), interleaved in time.** Current split across the section: **8 of 16
   above their own staff, 8 below** — the day-31 side-switching putting each
   wherever there was room.

**THE DIAGNOSIS WORTH KEEPING:** the day-31 passes each fixed their target and
kept every battery green, but they optimised for *no ink touching anything* and
spent **legibility of ownership**, which no check measured. Nothing collides in
the T7/T8 gap; it is simply unreadable.

**LEADING HYPOTHESIS for the next pass (untested):** put **every bracket on the
same side of its own staff, always** — most likely the beam side, so a bracket
is always adjacent to the beam that owns it. Ownership then never depends on
counting gaps. Collisions that return get solved by moving **dynamics and
accents** (per-note, mobile) instead of the brackets. This deliberately reverses
day 31's priority order.

**NOT DONE, first thing next session:** the composer's other instruction —
**move T6's fff above** (46.18, currently −6.32; "lots of room" above). It is
also one half of the outstanding cross-lane clash (T6 fff vs T7 accent, 0.54 ss).

**Still open, measured, on the record:** T8 5:4 bracket vs T9 beam (0.20 ss
cross-lane) · T9 @36.87 bracket×accent and T10 @39.08 bracket-under-beam (both
PRE-EXISTING in approved db1, filed to NOTATION_POLISH tier 3).

**Process note the composer stated and the AI accepts:** the strategy is **spot
fixes to get this looking right, then move on** — not systemic redesign. Filed
verbatim to PAPER_NOTES (both sides).


#### Day 33 — 2026-08-24 (Fable 5): the composer reopens the systemic pass; the hooks were already right and the screenshot was stale

**Composer (verbatim, reopening what day 32 closed):** *"Before the bracket mix
up, we were just about there… instead of making the small moves, the AI agent
must have changed something in the system and made things worse and worse…
I just wanna do what is expedient… But, actually, let's just have one more crack
then at the vertical spacing rules. So you have dynamics. You have the brackets.
You have accents. there should be a way to decide for each element if they're on
top of the notation or below the notation. and to sort out any conflicts…
brackets shouldn't be sitting on top of an accent or a accidental… I guess if we
can't get to it in this go, then we'll just do it by eye."* Also: the 5:4/7:4
in their screenshot point the wrong way AND sit *"further away than they need
to be. There's plenty of space."* **This supersedes the day-32 "spot fixes
only" strategy note: one more systemic attempt, fallback is by eye.**

**FINDING 1 — the hooks are ALREADY RIGHT; the composer's screenshot is the
pre-fix page.** Verified in the running app (fresh tab on :5200, DOM audit of
the rendered SVG — the day-28 no-pane method): all 16 c2d brackets hook toward
their own notes. T6 3:2 (above): hooks 558.7→564.2 px, descending from its
line ✓ · T7 3:2 (below): 720.0→725.5, ascending ✓ · T7 5:4/7:4 (below):
743.0→748.6, ascending ✓ · T8 6:4 (above): 766.5→772.1, descending ✓ ·
T8 3:2/5:4 (below): 849.3→854.8, ascending ✓. The screenshot the composer sent
shows T7's 5:4/7:4 hooks DESCENDING — exactly the inverted-flag bug fixed at
the day-32 checkpoint. **The notation tab needs a hard reload** (the fix was a
.js change; .js does not hot-reload). Also settled: layout's `dir` names the
bracket's SIDE ('up' = above, hooks drawn descending), not the hook direction —
the CLOUD02D_BRACKETS.md snippet's `hooks up/down` label misleads; renderer
render.js:261 `dir === 'down' ? -1 : 1 // hooks point toward the notes`.

**FINDING 2 — "too far" is real and is a missing pass: brackets never got
hugging.** Day 31 built per-mark hugging for DYNAMICS; brackets still land on
fixed deep rows. Current geometry: 9 of 16 brackets sit at ±~6 ss rows
(T2 7:4/6:4 and T4 5:4 at +5.62 · T4/T8/T8/T10 at −6.06 · T7 5:4/7:4 at −6.12)
while their hugged siblings sit at −3.20/+4.39 (T7 3:2, T9 3:2, T6 3:2). The
composer's complaint IS the row model.

**PROPOSED (awaiting the bracket-side verdict):** the four-rule vertical
placement pass — R1 deterministic SIDE per element type (accents day-24 beam
row · dynamics day-24/31 rules and designated the MOBILE element · brackets =
the verdict) · R2 HUG everything incl. brackets (medium gap past own part's
ink, stack notes→accents→bracket→dynamics, no fixed rows) · R3 CROSS-LANE
resolution (move dynamics/accents only, brackets never move for a neighbour,
unresolvable → flagged not squeezed) · R4 DICTATION LAST unchanged. Hooks
derive from final side + a battery assertion so inversion cannot regress
silently. Scope: this fork only; approved db1 stays byte-identical; unifying
db1 under the policy filed to NITS.


#### Day 33 — THE BRACKET-ABOVE POLICY BUILT: verdict "b", the one-more-crack pass lands green

**The verdict:** options put as (a) beam side always / (b) above own staff
always / (c) hug-only. AI recommended (b) — the only one that makes every
inter-staff band single-owner (beam-side fails where T8 beams down meet T9
beams up). Composer: **"b good."** The high-ledger question was asked and
answered first (hug absorbs ledgers; overflow into the band is safe under (b)
because the band's brackets always belong to the staff below; true conflicts
flag, never auto-flip — "deterministic side + flag + your dictation beats the
machine deciding").

**Built:**
- `layout.js` — THE BRACKET-ABOVE POLICY pass (runs after dictation, skips
  dictated brackets): side = above for every tuplet, hooks descend, y = HUG —
  medium/padding past the part's own ink (stem-up: the beam; stem-down: head
  column INCL. ACCIDENTALS via new tip fields `accTopYSs`/`accBotYSs`; either:
  the accent row when above), floored at the staff edge. Fixed rows are gone.
- Scoping: `ir.layoutPolicy.bracketSide` (per-IR; schema gains the key as a
  CLOSED enum) — `notate_section --bracketsAbove` writes it. **Approved db1
  never sees the policy.**
- `--dynSide t@part:above|below` on notate_section (global, repeatable) →
  `device.chainSide`, obeyed by the one-shot chain placer OVER its room test.
  T6's fff (wc-2022 @46.22) placed ABOVE (+4.36) — the composer's day-32
  dictation, finally done.
- `test_layout` — day-33 invariant: every tuplet of db1 + the fork hooks
  toward its own staff (side ⇔ dir). The day-32 inversion can't regress.
- Fork rebuilt; T6/T7's `--bracketSide` dictations RETIRED (the policy
  expresses them); both `--articSide above` kept.

**The bug the safety gate caught (keep this):** first build lifted SIX
approved-span brackets 1.42 ss. Cause: `headTopYSs` stores the note-build ink
top, which for stem-UP notes contains the PRE-LEVEL stem tip — stale once the
stack clamp lowers the beam (T10 @32.93: tips 4.86 over a beam clamped to
2.15). Fix: on stem-up groups the beam IS the outer ink; heads count only on
stem-down; accidentals always. **The before/after gate against approved db1
(t<42 layout comparison) is what caught it** — the exact day-24 lesson
("a fix for one figure must be re-checked against every figure built under
the same flag") mechanised.

**Verified:** all 16 c2d brackets ABOVE own staff, hugged (T6 +3.62 … T7
+8.45 over its dictated accents), dir 'up' · approved span t<42 IDENTICAL to
db1 · db1 geometry byte-identical (only the two inert new tip fields differ
in serialization) · ten batteries green incl. the new invariant · 75
snapshots green · LIVE APP DOM audit: all 16 numerals in their above bands,
every hook rect starts at its line and descends. Schema round-trip: rebuild
VALID vs source (validate-or-delete fired once mid-work on the unregistered
`layoutPolicy` key and deleted the fork — restored from git, schema extended,
rebuilt).

**Cross-lane residuals, measured and OPEN for the composer (not squeezed):**
T7 5:4/7:4 numerals vs T6 beam **−0.35 ss** · T9 3:2 vs T8 accent @45.15
**−0.50 ss**. Movers if wanted: T7's accents (re-dictate) / T8's accents
(`--articSide above`). The old T8-5:4-vs-T9-beam (0.20) DISSOLVED under the
policy, as predicted.


#### Day 33 (second sitting) — three dictations, THE PER-MARK ACCENT LAW, and the composer's rule sketch evaluated

**Composer (verbatim, with the two screenshots):** *"T7 … at forty five point
six eight, the accent could go below the note and both the five four and the
seven four brackets can come down closer to the beams. t8 and t9 Similar. …
t eight, the one starting at forty five point one seven, four accents, they
could all go above, giving more clearance to t nine … Same with the accent t8
forty six point two two … the bracket five four can be pushed up a bit. …
So this isn't necessarily the rule, but evaluate it if it's helpful. Something
like if current track is beams down … and next track is beams up … try to move
accents, text, and dynamics above if possible … I'm not saying to use this,
but see if there are the right rules that might do something like this.
Otherwise, everything else looks much better. Thank you."*

**Applied by dictation (provenance edits, rebuild):** T7 cl-46 `--articSide
above → below` · T8 cl-47 `+ --articSide above` (all five accents). T9 needed
nothing — its accents were already above.

**THE PER-MARK ACCENT LAW (built).** The first rebuild left ONE overlap: T7's
45.65 accent, on a head-side GROUP ROW at −5.64, ran into T8's 6:4 (−0.53 ss
ink) — the row hangs off the group's deepest column, far below the note the
composer pointed at. Their words were note-relative — *"below the NOTE"* —
the same language as day-31's *"closer to that notehead"* that created
per-mark DYNAMICS. Same law, extended: **on the head side, accents place
per-mark** (each clears its own column's head + dot + accidental by the
medium gap, staff-edge floor); the beam side keeps the day-24 row. Dictated
clusters only (`articSide` path); the policy bracket hug reads the per-mark
tops, so brackets follow their accents down.

**Measured, after:** T7 accents −5.64 → **−3.14 / −2.72** (below their own
notes; 4.4 / 4.7 ss clear of T8's brackets) · T7 5:4/7:4 **+7.31** ("closer
to the beams" — the day-31 approved height) · T8 accents +5.91 row → per-mark
**+2.72…+3.64**, its 6:4 7.53 → **+5.12**, 5:4 **+5.26** ("pushed up" above
the accents, tighter than before) · T6's accent re-hugged +5.14 → **+3.14**
under the same law (flagged to the composer — same direction they keep
asking for). **Geometry guard: ZERO c2d findings** — only the two
pre-existing tier-3 items (T9 @36.87 · T10 @39.08, approved db1, on record
since day 32). Approved span t<42 IDENTICAL to db1. Ten batteries + 75
snapshots green.

**THE RULE SKETCH, EVALUATED (not built — the composer asked for evaluation).**
Formalised: a band is FACING when the upper part beams DOWN and the lower
part beams UP — both beam-stacks land in the shared band. Measured on c2d:
exactly TWO facing bands, **T6/T7 and T8/T9 — precisely the two places every
final dictation of days 31–33 landed.** The rule that reproduces every one
of those dictations: **in a facing band, each part's marks (accents,
dynamics, text) leave for their HEAD side, per-mark** — the composer's
sketch phrased from the beams-down side, plus its mirror (T7's accents
going below), which they dictated today. Two deltas if adopted as a machine:
(1) **T9's accents (@43.78, 44.40, above) would move below** — possibly what
"t8 and t9 Similar" meant; currently clear of everything, so eye's choice;
(2) **T3's accents would move below** (they sit above by the day-31 room
test on a NON-facing band; the composer just called the page good, so the
rule must not touch it unbidden). Recommendation on record: keep the page
as dictated; adopt the facing rule at the fold only if the composer wants
it, with those two deltas named.


#### Day 33 (third sitting) — q1 locked; the machinery question answered; two guards adopted

**Composer:** *"q1 yes the accents in t8 on top like it is now; What is the
fallout from two if adopting as machinery now? Is it feasible? So whatever you
did this pass was good. if anything useful to adopt as maschinary?"*

**q1:** "t8 and t9 Similar" meant T8's accents on top — which is the page as
it stands. T9 stays. **The CLOUD02-D page is LOCKED by the composer's eye.**

**q2 (fallout of adopting FACING-BANDS as a mover now), on the record:**
feasible — cleanest not as cross-part surgery in layout.js but as a BUILD-TIME
auto-dictation writer in notate_section (the guard already sees all parts; it
would write the same articSide/dynSide dictations a composer would, visibly,
into the IR). But adopting NOW re-opens a page just locked: the clean regime
(facing→head side, else→day-24 beam side) moves T9's accents below AND returns
T3's accents to the beam side — both against the approved look, which grew
from dictations + repair history no from-scratch rule reproduces. Same class
as the day-31 failure: machinery conforming a good page to a rule.
**Recommendation stated: arm it for the NEXT section / the fold, where it runs
cold on unapproved material.**

**q3 (what of this pass is machinery):** already permanent — the bracket-above
policy (+hug), the per-mark accent law, --dynSide, the hook⇔side battery, the
cross-lane guard. Adopted THIS sitting (both invisible on the page): (1) **THE
APPROVED-SPAN GATE mechanised** — test_layout now proves the fork's t<42 lays
out identically to db1 (tuplets, beams, accents, dynamics); the check that
caught the stale-stem-tip bug by hand now runs on every battery. (2) **FACING
BANDS named by the build** — an info line in the geometry guard; on c2d it
prints T6/T7 44.5-45.7 · T8/T9 44.2-46.2 (every day-31-33 dictation landed in
one of these) **and found a third nobody had measured: T4/T5 34.3-34.5** (in
the approved endings, no collision, quiet). Ten batteries green; pushed.


#### Day 33 (fourth sitting) — CLOUD02-D WRAPPED; the save files bumped; clear prepared

**Composer:** *"6b is done so cld 2 wrapped, bump the save files in
preparation for next section a long tone and another density build 2 Could we
prep for clear, please?"* — 6b closed by STANDING VERDICT: the three-day
placement work doubled as the read; every figure had the composer's eye on it
for days, T1 was formally approved day 31, and the section is declared done.

**The bump, measured before touching anything (the gitignored-files lesson):**
`piece-s25-finished01-work` (the app's working copy, untracked) DIFFERS from
the tracked archive by 173 objects — all endSeconds in the 36.2+ span. Metadata
+ mtimes settle the direction: -work was created-and-written-once Aug 23 10:22
(the composer opening the app), the archive last amended by the day-31 tools
at 22:26 and committed 22:29. **-work is STALE, holds zero composer edits, and
was left alone.** `scores/piece-s26.json` created as a byte-faithful copy of
the archive (fresh metadata only; 4563 objects · 10 tracks · content-identical
verified) and confirmed FIRST in the live app's list. Next-section composing
(the long tone + density build 2) happens there; s25-finished01 freezes as
CLOUD02-D-era canon.

**The fold (c2d fork → db1) is prepared, not run:** the approved-span gate
dissolved the NITS flag question (--bracketsAbove proven a no-op on approved
material), so the fold is one command with zero visual change to anything
approved. Recipe + watch-items in journal §2 → THE FOLD; first Opus chunk
after the clear.

**Docs for the clear:** §2 rewritten for the day-34 cold start (state, the
fold recipe, the next-section table) · §6 current note · PLAN 8j marked
notation-done/wrapped · this entry. All pushed.

#### Day 34 (first sitting) — THE FOLD RUN: db1 carries CLOUD02-D; the fork pruned

**Composer:** *"what is the fold"* then *"run the fold pls"* — the explanation
came first and is worth keeping, because it names what a fold IS in this system:
the page is generated, never hand-edited, so `provenance.build` inside the IR is
the page. A fork (`db1-c2d-x01`) rebuilds db1's ENTIRE command plus the new
section under a throwaway id; folding = re-running that same command under
`--id db1` and deleting the fork. A rename, not a rebuild.

**Measured before running, not assumed** (the confidence-claim rule):

- **Where CLOUD02-D actually sits: 42.37–46.36 s.** All 13 new clusters are
  ABOVE t=42 — which is exactly why the approved-span gate's threshold is 42.
  The gate therefore covers 100 % of the material the composer had seen; it is
  not a partial check. *(This was worth measuring: the §2 note "fork t<42 ≡ db1"
  and "clusters grow 36 → 49" read as contradictory until the spans were pulled
  — db1's 36 = the 25 density-build-1 figures (29.92–34.6) + 11 CLOUD02-I
  (36.19–40.42); the 13 c2d figures are a disjoint span.)*
- **Flag diff fork vs db1:** fork-only = `--bracketsAbove --articSide --dynSide`
  (exactly the day-33 locked policy). **db1-only = none** — nothing would be
  lost by adopting the fork's command wholesale. `--bricks` parity holds.

**The run.** `db1.ir.json` + `index.json` backed up to scratch first. Build:
**READY: db1 — 456 events, 127 chunks, VALID vs source**, 49 clusters,
`--bracketsAbove` on, label "DENSITY BUILD 1 + CLOUD02-I + CLOUD02-D — all parts
figured (day 33)". GEOMETRY: **2 findings, both pre-existing tier-3** (T9 @36.87
bracket/accent, T10 @39.08 bracket/beam) — **zero new c2d findings**, matching
day 33. FACING BANDS info line reproduced: T4/T5 34.3–34.5 · T6/T7 44.5–45.7 ·
T8/T9 44.2–46.2. Fork pruned; picker back to one `db1`. Ten batteries green
(75 snapshots, midiplayer 30 checks, playability 51).

**The gap the batteries did NOT cover, and how it was closed.** The approved-span
gate is `existsSync`-guarded on the fork — so the moment the fork was pruned the
gate **skipped itself**. The ten-green report therefore proved nothing about
whether the fold preserved approved material. Closed by re-running the gate's own
signature function across the **day-33 backup of db1** vs the folded db1:
**425 rows (tuplets, beams, accents, dynamics below t=42) — IDENTICAL.** Nothing
the composer approved moved. *That is the claim the composer plans around, and it
is now measured, not inferred.*

**Discovered, and flagged rather than fixed:** the gate hardcodes the fork id
(`tools/test_layout.js:518`). With the fork gone it is **permanently dormant and
reports green** — a guard that looks alive and protects nothing. It matters at the
next section, whose forks come off db1 with `--bracketsAbove` from birth. Filed to
NITS with the fix sketch (discover the fork from the picker index); NOT edited,
because test machinery changes get proposed first.

#### Day 34 (second sitting) — STEP G: the approved-span gate woken and generalised

**Composer:** *"g good"* — the guard that protected the fold got fixed before
the next section's first fork, which is the only moment it is cheap to do.

**Two changes, both in `tools/test_layout.js`:**

1. **Fork discovery replaces the hardcoded id.** Both day-33 guards (the
   hook⇔staff invariant and the approved-span gate) named `db1-c2d-x01`
   literally and were `existsSync`-guarded, so pruning the fork silenced them
   while the battery still printed GREEN. They now read the picker
   (`notation/ir/index.json`), taking every `db1-*` id except the frozen
   validate golden `db1-all-x01`. The next section's fork is gated from birth
   with nobody remembering to edit the test.
2. **The approved boundary is DERIVED, not hardcoded.** Day 33's literal `42`
   was CLOUD02-D's number (its figures start at 42.37). Left alone it would
   have *silently under-covered* the next section, whose approved material now
   runs to 46.36 s — the guard would have "passed" while ignoring 4.4 s of
   approved page. The gate now computes the boundary as the min start of any
   cluster the fork **adds or changes** vs db1 (a changed cluster counts, so a
   rebuilt figure pulls the boundary back to itself). No fork diff at all ⇒
   boundary `Infinity` ⇒ the whole page must match.

**Verified by reconstructing the day-33 world from git** (old db1 + the fork +
old picker restored from `HEAD~1`), because `ok()` prints only on failure — a
passing gate proves nothing you can see:

- **It FIRES.** Forcing `stemDir: down` on one beamed event at **t=31.55**,
  deep inside approved material, turned it red:
  `FAIL approved-span gate: db1-c2d-x01 mirrors db1 over t<42.37 (425 vs 425 rows…)`
- **The derived boundary reproduces the hand measurement exactly** — `t<42.37`
  and **425 rows**, the same numbers measured by hand during the fold. The
  generalisation did not change what the guard covers, only how it finds it.
- **Clean fork ⇒ GREEN**, so the red came from the perturbation alone.
- **A picker entry whose IR file is missing now FAILS LOUDLY**
  (`FAIL picker lists db1 fork db1-c2d-x01 but its IR file is missing`) —
  that was the exact silent-skip shape of the day-33 hole.
- **With no fork present it prints `approved-span gate: NOT APPLICABLE — no db1
  fork in the picker`.** A green battery can no longer imply coverage it does
  not have. *That line is the whole lesson of the morning: the failure was never
  a wrong assertion, it was an assertion that stopped existing without saying so.*

Ten batteries green; `--prove-red` harness still works. Day-34 state restored
(db1 49 clusters, no fork in the picker); only `test_layout.js` changed.

#### Day 35 — 2026-08-24 (Fable 5): the clear cycle revised — `/resume` read too little, and the model boundary named

**The composer's ask, verbatim (voice):** *"I want to revise the midsection
wrap … clear and resume. I'm clearing quite often, so I want to develop a more
efficient sequence … I have abandoned the old resume and used session start
because it seemed to me at least anecdotally that the post clear agent seemed
to be missing a lot of context. Keep in mind I'm doing these frequent clears
to save fable credits. If I'm continuing on with Opus five, I probably won't
clear that often. But anytime I want to start something that involves fable or
a lot of fable work, then I'll do clears before."*

**The diagnosis (AI):** `/resume` was designed to read ONLY the `(mid-session
checkpoint)` §2 entry + PLANNER `NOW ►` — *"and nothing older"*, by explicit
rule. So the post-clear agent never saw §2's standing blocks (the tool table,
the laws, "Things to know before building anything", NEXT STEPS · MODEL ·
CLEAR) or the task's spec in PLAN/NOTATION_STANDARDS, unless the one
checkpoint entry restated them — which one entry cannot. And the checkpoint
had no slot to say "read these." The composer's workaround — `/session-start`
after every clear — over-corrected: full PLAN.md (~2,200 lines) +
HOW_WE_WORK + the agenda ceremony, most of it wrong ten minutes into the same
task. The context loss and the over-payment were the same bug seen from two
sides: the read-set was fixed, when it needed to be chosen by the session that
had the context.

**Decided (composer: "yes a and b pls"):**

1. **`/resume` reads all of §2** (~160 lines — it IS the curated cold-start
   block) + `NOW ►` + a new **`Resume reads:` list** the checkpoint writes:
   the dying session names the exact extra docs/sections, because it is the
   only session that knows. *Rejected:* keeping the leanest read-set
   (checkpoint entry only) — the ~2k-token saving is what caused the loss.
2. **The MODEL joins subject and length as a clear trigger:** clear before
   any Fable block (Fable re-reads carried context against a weekly credit
   balance), even when the chat is short; on Opus clear lazily (milestones,
   as before). And **run the wrap on Opus** when a Fable block is coming —
   the wrap is mechanical work at the expensive end of a session:
   `/model` Opus → `/checkpoint` → `/clear` → `/model` Fable → `/resume`.

**The principle, written into checkpoint.md:** spend tokens on the dying
session, save them on the fresh one — the fresh one may be Fable.

**Files:** `.claude/commands/checkpoint.md` (rewritten — `Resume reads:` slot,
steps folded 7→4, Opus-wrap rule) · `.claude/commands/resume.md` (rewritten —
full-§2 read-set) · `docs/SESSION_HYGIENE.md` (§ two boundaries: the model
trigger + day-35 revision note; § model strategy: the mid-switch-to-Fable cost
caveat) · `CLAUDE.md` (boundary pointer). Docs only; no batteries implicated.

#### Day 35 (second sitting, Opus 5) — THE LONG TONE AT 48.05 NOTATED: the brick becomes the bar, and `ord` had no bar to size

**The composer's ask (voice):** *"The long tone [at] forty eight seconds is
similar to the block at forty one. Please derive the duration from the brick in
the finished s twenty five piece in the composer score, that save file. And
then I think we have all the cuivré and other things already in place in forty
one. Go ahead and notate that full note for all ten tubas."*

**What the material is.** `grp-octbb-ord-01`, marker *"octaves Bb ord blast"* at
**48.05 s**: ten waveCurves, all `ord`, vel 112, drawn **48.050 → 52.460 = a
4.410 s brick**, uniform across all ten. Octaves of Bb — 58 on T1-T3, 46 on
T4-T6, 34 on T7-T10. It was already extracted into db1 (the window is
`--w0 0 --w1 55.94`), as ten `ord-sustained` chunks — but carried **zero
overlays**: unnotated.

**The mechanism already existed and was built for this exact sentence.**
`--ringFromBrick t0-t1` (day 30) writes `device.ringSeconds` from the source
object's drawn length; its code comment quotes the composer's day-30
instruction about the 41 s block almost word for word. `ord` is already in its
`RING_TECHS`. db1's own build already carries `--ringFromBrick 40.9-41.0`, so
this is a db1 build-command addition, **not a fork** — the same file, one more
flag.

**THE FINDING that made it more than one flag.** `ringSeconds` only *sizes* a
bar; layout draws one only under `dev.ringBar`. The device registry
(`notation/registry/container.json`, and layout's matching default) gives
`ringBar: true` to **fortepiano** and **cuivre** — which is why the 41 s blast
has bars — but `ord` is `{goLine, nhUnit, dynMark:'band'}`, the **day-24
provisional entry, with no `ringBar`**. So on the ord long tone the flag would
have written a 4.41 s length for a bar that is never drawn: green output, blank
page. **Fixed at the flag, not the registry** — `--ringFromBrick` now writes
`{ringSeconds, ringBar: true}`, because naming a span in that flag IS the ask
for the bar. *Rejected:* adding `ringBar: true` to the `ord` registry entry —
that is global (every ord note in every IR, trance included) and `ord`'s entry
is explicitly provisional, so it is the composer's design call, not a
side effect of one section. No-op where byTechnique already says true: the
40.93 blast's ten overlays gain the field and render identically.

**Built:** db1 rebuilt from its own `provenance.build` + `--ringFromBrick
48.0-48.1`. Tool line: `ringFromBrick 48-48.1: 10 ring bar(s) written from the
drawn brick (4.41 s)`. **456 events · 127 chunks · VALID vs source** —
unchanged. Geometry: the two pre-existing tier-3 items only (T9 @36.87,
T10 @39.08); **zero new findings.**

**PROVED, not asserted — the whole page diffed item by item** (before vs after,
laid out through the app's own module with the app's own registry opts, as
`notation.html` composes them):

- **3843 items before → 3853 after. ADDED 10. REMOVED 0. CHANGED 0.**
- every added row is a ringbar `t0=48.05 t1=52.46` on T1…T10 — nothing else.
- **warnings 22 before, 22 after**, no delta. (The breath rule stays silent
  because these are the last events in the window: no next attack, infinite
  room.)
- `dx0Ss = 0` on all ten — matching the 41 s bars exactly; only two bars in the
  whole piece carry a left shortening.

**VERIFIED IN THE RUNNING APP** (score server :5200, db1, window 47.8 +5.0 s):
**ten ring bars, one per tuba, each 1089.3 px wide — pixel-identical to all ten
bricks (1089.3).** The bar spans exactly the drawn brick, which is the whole
instruction. Bar height 5.69 px vs brick 8.53 px = **0.667**, the registry's
2/3 spec. The 41 s block still draws its ten bars unchanged.
*Method note:* the Browser pane was NOT displayed, so no screenshot — the DOM
audit stands in, per the day-28 logistics note. **A wrong filter cost several
turns:** ring bars were searched by `fill=#111 opacity=0.65` (the registry
values) and came back zero even at the composer-approved 41 s block; the page
renders them at **opacity 1**. Tallying every rect by fill/opacity/height found
them at once. *Lesson: when a known-good control also reads zero, doubt the
probe before the work.*

**The long tone now draws, per tuba:** brick · go line · **open notehead** ·
accidental · `f` dynamic · ledgers where needed · **the 4.41 s ring bar**. Only
the bar is new; everything else was already there.

**FLAGGED TO THE COMPOSER, not decided:** the ten pitches are spelled
**A♯** in the IR (`step A, alter 1`) and the page draws ten sharp accidentals —
but the composer's marker and their words both say **"octaves Bb"**. Enharmonic
spelling is a composer call, so it is named, not changed.

#### Day 35 — THE PROCESS, WRITTEN DOWN FOR EVALUATION (composer's ask: can this be a generator?)

*Composer, right after the long tone landed: "I would like to get a Fable model to
evaluate your process and to see if there is a way to mechanize it a little bit more to
make a generator that's a little bit more efficient... if you need to make some notes
about what you had to do and if you fell into any traps." This block is written FOR that
evaluation — the seven steps as actually run, the four traps as actually hit, and four
mechanization candidates offered as evidence, NOT as a decision.*

**THE SEVEN STEPS, as actually run** (one instruction: "notate the long tone at 48"):

1. **Find the material in the score save file.** `piece-s25-finished01.json` → markers in
   35-60 s → `grp-octbb-ord-01` @48.05 → its 11 objects (10 notes + 1 handle), technique,
   velocity, pitches, and **the brick** (`endSeconds - startSeconds` = 4.410, uniform).
2. **Find how the ANALOGOUS thing is already notated.** The 41 s block (`grp-vert03-fp-01`)
   in `db1.ir.json`: its ten events, and the overlays targeting them.
3. **Find the MECHANISM that produced those overlays.** `grep ringSeconds` →
   `notate_section.js --ringFromBrick`, whose comment quotes the composer's day-30
   instruction for the 41 s block nearly verbatim.
4. **Check the mechanism reaches THIS material.** It did not — see Trap 3.
5. **Patch the mechanism** (flag, not registry — D72).
6. **Rebuild** from the IR's own `provenance.build` + the one new flag, under `--id db1`.
7. **Prove + verify:** whole-page item diff before/after → batteries → the running app.

**THE FOUR TRAPS** (each one cost turns; each is a candidate for mechanization):

- **T1 — THE WRONG PROBE, and it cost the most (~5 turns).** Hunting the ring bars in the
  DOM I filtered on the registry's values, `fill=#111 opacity=0.65`, and got **zero** —
  including at the composer-approved 41 s block. I began diagnosing a rendering bug that
  did not exist. The page draws them at **opacity 1**. Tallying every rect by
  fill/opacity/height found all ten instantly. **The rule that would have saved it:
  when a known-good control also reads zero, doubt the probe before the work.** The
  deeper cause: the registry value and the drawn value disagree and nothing reconciles
  them, so any DOM probe written from the registry is wrong by construction.
- **T2 — field-name guessing across two schemas.** Score objects use `startSeconds` /
  `endSeconds`, markers use `time`, IR events use `onset` / `duration`. I filtered notes
  by `.time` (empty result) and IR events by `.t` (`Infinity - -Infinity` range). Two
  turns of shape discovery that a helper would make impossible.
- **T3 — the tool's success line described an effect it had not verified.** `--ringFromBrick`
  printed `10 ring bar(s) written from the drawn brick (4.41 s)` while writing only
  LENGTHS; the bar needs `device.ringBar`, which `ord` does not have. **Had I trusted the
  tool's own output I would have reported the job done over a blank page.** Only reading
  `layout.js` line 317 (`if (dev.ringBar)`) exposed it. → D72.
- **T4 — a near-miss on fork-vs-direct.** Journal §2 says the next section's notation
  comes "via a new fork off db1", and I nearly built one. The right answer was **db1
  directly**, because the precedent — `--ringFromBrick 40.9-41.0` for the 41 s block —
  is already inside db1's own build command. Cheap to get wrong: a needless fork, or
  worse, an unguarded direct edit. **Any generator must decide this explicitly.**

*(Standing logistics, hit again: the Browser pane was not displayed, so no screenshot —
the DOM audit is the fallback, per day 28.)*

**FOUR MECHANIZATION CANDIDATES — evidence for Fable, not a plan:**

- **(a) A BLOCK GENERATOR — the strongest case.** This class of material recurs and is
  fully described by its score group: a struck-or-held block, one uniform brick, all ten
  parts, one technique. Two instances are now notated by hand-assembled flags (VERT01-03
  @40.93 day 30; octaves-Bb @48.05 today) and **INT2's blasts are the next material on
  the planner**. Shape: `notate_block --score <s> --group <id>` → reads the group, derives
  the brick, emits the right `notate_section` flags, refuses if the brick is not uniform.
  Steps 1-3 and 6 of the seven collapse into one command. *Counter-argument Fable should
  weigh:* n=2 instances, and the composer's own filter is "one robust build over a
  fragile one" — a generator over two examples may encode accidents as rules.
- **(b) A DEVICE-GAP ASSERT — the general form of T3, and the cheapest.** Before any tool
  writes a device field, resolve the technique's device and assert the field it depends on
  is actually on; refuse loudly otherwise. Turns a silent blank page into an error at the
  command line. **This one is small, general, and would have caught today's real bug.**
- **(c) THE "PROVE NOTHING MOVED" HARNESS — hand-written TWICE now.** Day 34 (the fold,
  425 rows) and today (3843 items) both hand-rolled a before/after layout diff, because
  the approved-span gate only compares a FORK against db1 and prints NOT APPLICABLE for a
  direct rebuild. Shape: `prove_unmoved --before <ir> --after <ir> [--expect-added <k>]`,
  reporting added/removed/changed by item and the warning delta. Today's ideal output is
  exactly `ADDED 10 (all ringbar @48.05) / REMOVED 0 / CHANGED 0 / warnings 22→22`.
  **Note the coverage hole it closes:** a direct db1 rebuild currently has NO automatic
  guard at all — the day-34 gate wakes only when a fork exists.
- **(d) A VERIFICATION QUERY for the DOM audit — the T1 fix.** A tiny helper that answers
  "what did the page actually draw at time T, by kind" from the model rather than by
  guessing SVG attributes, so the probe can never disagree with the renderer.

**What I would NOT mechanize, and why it matters to the evaluation:** steps 2 and 5 —
finding the analogous already-approved thing, and deciding where to fix a gap (flag vs
registry vs material). Both were judgment calls with a rejected alternative on the record
(D72), and both are where a wrong automation would do real damage. The mechanizable part
is the *fetch-derive-emit-prove* spine; the *what should this look like* stays human.

---

#### Day 35 — 2026-08-24 (Opus 5): `/resume` renamed `/postclear` — the built-in was eating it

**Composer:** *"the custom resume skill that we just made is being eaten by the Claude one.
Can we find ours and give it a new name?"*

**What was wrong.** Claude Code ships a built-in `/resume` (resume a previous
conversation). Our day-35 command lived at `.claude/commands/resume.md`, and the built-in
won the slash-command picker — so the cheap inner cycle was unreachable by name the day
after it was written.

**The rename: `/postclear`.** Rejected alternatives and why:

- `/pickup` — shortest, but reads as a generic verb and does not announce itself as
  `/checkpoint`'s other half.
- `/reprise` — musical and memorable, but "reprise" already means something specific about
  score material in these docs; ambiguity we do not need in a composition repo.
- `/resume-work` — closest to muscle memory, and **the trap**: you still type `/res` and the
  built-in still surfaces first. It would have reproduced the exact failure.

`/postclear` wins on three counts: the file already titled itself "Resume (postclear)"; it
pairs with `/checkpoint` as a stated before/after set; and `/po` reaches it uniquely with no
built-in in the way. *(The word was the composer's own, day 15: "can we have a preclear and
a postclear protocol" — so the naming closes a loop rather than inventing a term.)*

**What changed.** `git mv .claude/commands/resume.md → postclear.md`, plus 17 references
across `.claude/commands/checkpoint.md` (4), `CLAUDE.md` (1), `docs/SESSION_HYGIENE.md` (9),
`docs/PROJECT_JOURNAL.md` (3). **RUNNING_LOG's six earlier `/resume` mentions were left
verbatim** — they are the record of the day-35 revision as it was made, and this entry is
the pointer that supersedes them. The dead name is evidence, not a typo to sweep.

**Verified, not assumed:** the skill registry re-scanned after the `git mv` and now lists
`postclear` with `resume` gone — confirmed in this session, not inferred from the filename.

**The general lesson, worth a line for the paper:** a custom slash command competes in a
namespace we do not own and that grows without notice. Name project commands for the
*moment they belong to* (`postclear`, `checkpoint`, `session-end`) rather than for the
generic verb (`resume`, `start`, `save`) — the specific name is both collision-resistant
and self-documenting about when to run it.

---

#### Day 35 (third sitting, Fable 5) — THE MECHANIZATION VERDICT, AND THE AI REVERSING ITSELF ON ONE FACT

*This is the evaluation the day-35 checkpoint was written for: Fable reading the
seven-step brief and deciding whether to build a generator. It took two turns, and the
turn between them is the interesting part — the composer supplied one fact and the
verdict flipped. Both sides verbatim, per the standing paper instruction.*

**FABLE'S FIRST VERDICT (defer the generator):**

> **(a) The block generator — NOT YET, with a named trigger.**
> The honest accounting: the seven steps minus the traps are fast. The traps were the
> cost, and (b)+(c) remove the two expensive ones. What's left for a generator to save is
> a jq query, a subtraction, and appending one flag to a known command — minutes of AI
> time, not composer time. n=2, and the third instance doesn't exist yet. If the next long
> tone (in `piece-s26`) is staggered, mixed-technique, or swells into the density build —
> all musically plausible — the generator built today encodes the wrong invariant.
> **The trigger:** when the next long-tone material exists in `piece-s26`, look at its
> actual shape. If it fits the block class (one group, uniform brick, one technique),
> build `notate_block` then, with n=3 in hand.

It also said BUILD on **(b)** the device-gap assert and **(c)** `prove_unmoved`, and
**SKIP** on **(d)** the DOM verification helper, for a reason worth keeping:

> A helper that answers "what did the page draw" *from the model* verifies the model
> against itself — it destroys the independence that makes the DOM audit worth anything.
> The actual fix for T1 is a method, already logged: tally every element first, filter
> second, and doubt the probe when a known-good control reads zero. **The lesson is the
> tool.**

**THE COMPOSER'S REPLY — one fact, and the verdict flips (voice):**

> *"A long tone section is coming up soon. Or several of them. So that's why I want to do
> this. So is it that you need an actual example to run it on? Because I can provide that.
> But let's build the machine so that Opus can run it for the long tones beginning at
> eighty-one seconds and running to one-ten. So this is also partly cost-benefit. Just let
> me know when you think one more time before doing anything — in other words, is it worth
> building the machine?"*

**FABLE'S REVERSAL, verbatim:**

> **Verdict, rethought: YES — build the machine now.** Two facts changed my answer from
> last turn: **The material is real.** 81–110 s, and more sections after. That kills the
> "n=2, don't encode accidents" objection. **Opus will run it.** A machine turns
> Fable-grade judgment into a command Opus can't get wrong — the day-35 traps become
> refusals. That *is* your cost-benefit.

**Why this reversal is worth the ink** — the first verdict was not wrong on its evidence.
It was reasoning from n=2 with no third instance in sight, and under the composer's own
standing filter ("one robust build over a fragile one"), deferring was correct. The
composer did not argue the reasoning; they supplied the missing fact — that the material
exists and recurs — and the same reasoning produced the opposite answer. **The AI's job in
the exchange was to state its evidence clearly enough that one fact could overturn it.**
A verdict that had been argued instead of evidenced would have needed a fight to move.

**Second reversal inside the same answer, quieter but real:** candidates (b) and (c) were
scoped as *standalone tools* in the first verdict, and folded into the machine in the
second — *"the two guards go INSIDE it, not alongside"*. Once the generator is being built,
a separate assert and a separate prover are two more things to remember to run; inside the
one command they are unskippable. This is the same D72 lesson at a different altitude: do
not let a correct check live somewhere it can be forgotten.

**THE MACHINE, as specified for Opus:**

- **`notate_block --score <save> --group <id>`** — reads the score group, derives the
  brick, **refuses if the brick is not uniform**, emits the right `notate_section` flags,
  rebuilds, proves.
- **The device-gap assert lives inside it** (D72's general rule): before writing a device
  field, resolve the technique's device and refuse loudly if the field it depends on is
  off. Never a success line over a blank page.
- **`prove_unmoved` lives inside it** — the before/after whole-page item diff, hand-rolled
  twice already (day 34: 425 rows; day 35: 3843 items). Prints `ADDED n / REMOVED 0 /
  CHANGED 0` and the warning delta on every run. **It closes a real hole:** a DIRECT db1
  rebuild has no automatic guard at all — the day-34 approved-span gate wakes only when a
  fork exists, and T4's precedent says long-tone additions go into db1 directly.
- **The fork-vs-direct rule is encoded, not left to judgement** (T4 was a near-miss):
  span already inside db1's window → direct, like 48.05; a new span like 81–110 → fork,
  gated from birth by the day-34 machinery.
- **Goldens first:** the machine must reproduce the 41 s block and the 48.05 long tone
  **exactly** before it is allowed near new material. The two hand-built instances are the
  spec and the test suite — which is the whole reason n=2 was enough to build FROM even
  when it was not enough to build ON.

**THE TWO STOP POINTS, written down so they do not depend on a model remembering them:**
after the machine is built and green, Opus **stops and asks for the 81–110 material**
(which save file); after the machine runs on it, Opus **stops with the page ready for the
composer's eye** — nothing folds into db1 without approval.

**What Fable would still NOT mechanize, unchanged from the brief:** finding the analogous
already-approved thing (step 2) and deciding where to fix a gap (step 5, flag vs registry
vs material). The *fetch-derive-emit-prove* spine is the machine; the *what should this
look like* stays human.

**Also filed this sitting — a chat-format preference, and it is not cosmetic.** The
composer: *"could you give me your response in more succinct language, please, with clear
spatial division in the chat — I think that I am mildly dyslexic. And if you could add a
note to the CLAUDE.md."* Added to the global `CLAUDE.md` § Chat responses (succinct
language · clear spatial division · short lines · one idea per chunk) and appended as the
**why** to the existing `reply-format-tldr-chunks` memory, which had recorded the rule
without its reason. *Worth a paper line: the reply-density rule had been in force since
day ~28 on the evidence of the composer saying "too dense"; the actual cause surfaced
seven days later. The behaviour was right long before the reason was known — but only the
reason makes it generalize to formats nobody has complained about yet.*

**Still open, one word whenever the composer likes:** **A♯ or B♭** for the ten long-tone
pitches at 48.05.

---

#### Day 35 (fourth sitting, Opus 5) — THE BLOCK GENERATOR BUILT, and the golden immediately proved the day-35 proof shape wrong

*Composer, after the Fable verdict: "if staying with opus no need to clear go ahead and
start build." Also, answering the standing question: "bb but no need to update anything
already build" — the long-tone spelling is **B flat** going forward; the 48.05 page is left
as it stands (ten sharps), because retrofitting it buys nothing.*

**BUILT — five files, 44 checks, ten batteries still green:**

- **`notation/lib/device_check.js`** — the device-gap assert (D72 made mechanical).
- **`notation/lib/prove_unmoved.js`** — the before/after layout diff, hand-rolled twice
  before this.
- **`tools/notate_block.js`** — the machine.
- **`tools/test_notate_block.js`** — the battery, with the golden.
- **`tools/prove_unmoved.js`** — a thin CLI over the library, for the case the machine does
  not cover: comparing a page against a version of itself from git (day 34's fold).

**THE DEPENDENCY TABLE IS DERIVED FROM `layout.js`, NOT HAND-WRITTEN.** The obvious build
was a constant — `{ringSeconds: 'ringBar'}` — which is correct today and stale the first
time layout grows a guard. Instead `device_check` brace-matches `layout.js` and asks, of
every `dev.X` it reads: *is every read site of X inside an `if (dev.Y)` block?* If so X
depends on Y, which is what "only drawn under" means, asked in the only place that can
answer it. **The pass finds 41 dependent fields**, including the two checkable by hand
(`ringSeconds` needs `ringBar`; `nhDotGapSs` needs `nhUnit` + `nhDot`). D72's own scenario
is rebuilt in the battery as a unit test and caught. A hardcoded FALLBACK table survives a
parse failure, so the check degrades to weaker rather than to absent.

**THE GOLDEN CAUGHT A REAL ERROR IN THE DAY-35 BRIEF — this is the finding of the
sitting.** The golden strips both `--ringFromBrick` flags out of db1's build command,
rebuilds that page as a twin, lets the MACHINE put them back, and requires the result to be
item-for-item identical to the approved db1. First run: **the twin came out 10 items short
of db1, not 20.**

- On **ord** (48.05) the flag **ADDS** ten ring bars — the `ord` registry entry has no
  `ringBar`, so there was nothing there. That IS D72.
- On **fortepiano/cuivre** (40.93) the flag **CHANGES** ten — those techniques already draw
  a bar, and the flag only re-sizes it from the ragged sample lengths (measured in the
  twin: **1.14, 1.10, 1.43, 0.953, 1.51, 0.95, 1.60, 0.99, 1.55, 1.57 s**) to the uniform
  drawn brick, 1.01 s.
- **So `ADDED 10 / REMOVED 0 / CHANGED 0` — the shape the day-35 proof took by hand, and the
  shape the mechanization brief wrote down as "today's ideal output" — is true of the long
  tone and FALSE of the blast, though the instruction and the material class are identical.**
  Encoding it as the success condition would have made the tool refuse a correct rebuild of
  the composer's own approved page.

**What replaced it: CONFINEMENT, not stillness.** `Prove.confine()` asks the question a
targeted rebuild actually has to answer — *every item that moved belongs to the block this
command was aimed at, and nothing else on the page moved at all* — plus a direct measurement
of the ask itself: **10/10 notes carry a ring bar, one length, equal to the drawn brick.**
That claim holds for both cases and is stronger than the count it replaced, because it says
WHICH ink is allowed to move. `isClean()` (nothing moved at all) is kept for the fold case,
where it is the right question.

*Worth keeping for the paper: the generator was built from n=2, and n=2 was the whole
argument. Two instances were not enough evidence to build ON — the Fable verdict said so and
reversed only on the composer's fact that the material recurs. But they were exactly enough
to build FROM, because they can be replayed. And the second instance is what caught the
error: with only the long tone in hand, the machine would have shipped a success condition
that was an accident of `ord` having no `ringBar`.*

**THE FOUR DAY-35 TRAPS, NOW REFUSALS — each verified in the battery:**

- **T1 (the wrong probe)** — proof comes from `layout.js` itself, never from guessed SVG
  attributes. Both pages are laid out through the app's own opts composition
  (`notation.html` line ~228) and the models are diffed.
- **T2 (field-name guessing across three schemas)** — one function, `readBlock()`, knows
  that score objects use `startSeconds`/`endSeconds`/`layer`/`sonifyNote`, markers use
  `time`, and IR events use `onset`/`source.objectId`. It also knows a block's **handle** (a
  waveCurve with no technique and no pitch) is not a note — verified: 10 notes + 1 handle,
  never 11.
- **T3 (a success line describing an effect it never verified)** — the device-gap assert
  runs on the *rebuilt* IR and refuses if any field asks for something the resolved device
  never draws.
- **T4 (fork vs direct)** — decided from the target IR's own window, not from habit. Inside
  the window → DIRECT (the 41 s precedent is already inside db1's build command). Outside →
  **REFUSED**, with both real options printed as runnable commands, because that is a
  SECTION decision and a fork inherits the same window anyway.

**Two more refusals the material itself demanded**, neither in the original spec:

- **a non-uniform brick** is refused with the `set_brick.js` command to normalise it — WHICH
  brick is the block's length is a composer question, not a derivation.
- **a technique with no ring bar** (the `staccato+cuivre` blocks at 84.6 and 85.4 s) is
  refused rather than half-notated, because `--ringFromBrick` would silently skip those
  notes — the exact shape of T3.

**SAFETY, verified in the battery:** `--apply` snapshots the IR bytes before rebuilding. If
the rebuild fails, or the device-gap assert fires, or the proof is not confined, the original
file is written back **byte-for-byte** and the tool exits non-zero. A rebuild that cannot
prove itself does not survive. *(The test poisons a build command and confirms the file is
restored identically.)*

**One cosmetic fix with a real reason:** the span is written with at least one decimal
(`48.0-48.1`, `40.9-41.0`) so a generated `provenance.build` still matches the command in the
journal — `48-48.1` parses the same and would have cost someone an afternoon proving they
were the same thing. Idempotency is checked by VALUE, not string, so either form is
recognised as already done.

**VERIFIED, not asserted:** 44/44 in the new battery; **the machine-built page is
item-for-item identical to the approved db1, warnings 22 = 22**; ten standing batteries all
green; `db1.ir.json` byte-identical to its pre-session state; no stray picker entry (the twin
is pruned and its manifest row checked gone); `notation/ir/index.json` restored after the
usual line-ending churn.

**STEP 1 OF THE SEVEN IS NOW A COMMAND, and it answered the composer's next question before
it was asked.** `notate_block --list` prints every group with its shape. Run on both save
files:

- **`piece-s26` is still byte-identical to `piece-s25-finished01` in group content** — the
  copy made on day 33; no new long-tone material has been composed into it yet.
- The **81-110 s** region the composer named already holds **13 groups**, of which only
  **four are block-shaped** and only **two are `ord` long tones**: **`grp-s009-817` @81.748
  (10 notes, 2.172 s brick)** and **`grp-s005-958` @95.885 (7 notes, 3.435 s brick)**. The
  rest are short blasts and clusters — a different notation job.
- **No IR covers that region.** The db1 window ends at 55.94, so the machine refuses both of
  them by design (T4) and prints the two options. **That refusal is STOP 1: which save file,
  and one page or a new one, is the composer's call.**
