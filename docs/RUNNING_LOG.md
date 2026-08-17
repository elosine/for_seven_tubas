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

### Standing instruction adopted — D33 (documentation is continuous)

The composer restated, as a standing instruction, that notes are taken **as the
work happens** — both because the chat window is cleared often and, more
specifically, **because the paper is being written FROM this process**. Filed as
**D33** with a filing contract (one destination per kind of note), and written
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
HALF (D33).** While fixing the status line I declared `const sel` inside
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

**Working rule changed mid-session → D34: the AI does not implement anything
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

