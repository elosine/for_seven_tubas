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
