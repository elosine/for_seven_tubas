# NITS — deferred small stuff

> Things worth fixing that are **not** blocking the piece. Opened 2026-08-16 on the
> composer's working rule: *fix what blocks the work or what will break; record the
> rest here rather than spending decision time on it.*
>
> Format: one bullet, what it is, why it's deferred. Delete when fixed.
> Nothing here should ever need a decision from the composer to be recorded — only
> to be scheduled.

## Open

- **The blocked-Web-MIDI message names port 5200 even when you are on another
  port.** `morph_emit.js` hardcodes *"this browser has BLOCKED Web MIDI for
  localhost:5200"*; served from the `score-verify` instance on 5210 the message
  is off by a port number. Cosmetic — the instruction it gives (open the score in
  a window where MIDI is allowed) is still correct. One template string.
  *(Found 2026-08-17 verifying PLAN 2aa on 5210.)*

- **The Pulse panel reports lane PRESSURE, not 2r conflicts.** It shows the
  tightest same-player attack gap, which is enough to see that a 3-note entry at
  130 BPM asks nothing hard of anyone. It does **not** run the HARD/SOFT
  occupancy model, so a grid that double-books a player would play perfectly
  cleanly in the mock-up (2r) and say nothing. Deliberate for v1 — the pulse
  strip writes nothing to the score, and lane assignment is explicitly
  orchestration's job (2aa v4, where the badge belongs). *Becomes real the moment
  v2's write-to-score exists.*

- **The Fade ladder cuts every rung 4 s after its attack, so the rungs are not
  compared at equal loudness.** `LADDER_HOLD_S` is a constant (4 s), but a
  morph's own `dyn` curve keeps climbing long past the attack — on
  `ACT-BLOOM-01` the mean opening level at 1 s runs 0.71 (1 s fade) down to
  0.11 (8 s fade), and the 8 s rung is therefore cut while still much softer
  than the 1 s rung was. That is arguably right — you are auditioning the
  *attack*, not the body — but it means a long rung sounds quieter as well as
  slower, and the two are easy to confuse by ear. *If it bothers the composer:*
  scale the hold with the rung (`hold = k · len`), or expose hold/gap next to
  the lengths input. One constant, no engine work. **Do not shorten `GAP_S`
  below 0.69 s** — the gap is what makes rungs 2..N open cold (`test_ladder.js`
  pins this).

- **META shape overhangs its parts on `grp-s018-1056` — CAUSE NOT ESTABLISHED.**
  In `piece-s12` / `piece-s12-work`: shape 105.63–113.43, parts 105.63–110.62
  (8 notes, ord 4.99 s + cuivre 1.25/1.12 s) — **2.81 s of shape with no sound
  under it.** The only mismatched group out of 19; `piece-s09/s10/s11` have none.
  - *Checked:* all three group-scaling paths (property panel `scaleGroupTo`,
    edge-node drag, box resize) map non-fixed members affinely and preserve fixed
    one-shot lengths. None of them can open a gap on their own.
  - *AI's guess (UNCONFIRMED, composer disagrees):* the ord notes were shortened
    individually afterwards, which does not shrink the shape.
  - *Composer's observation, which fits better:* they were only ever changing the
    META shape — and when they change it now, **the parts do follow, but the
    overhang is preserved.** That is what affine mapping does: an existing gap
    scales with everything else and never closes. So the question is not why the
    parts stopped following, it is **where the gap originally came from.**
  - *Deferred 2026-08-16 by the composer* — "leave it until it becomes a problem
    again." No auto-fit was added, deliberately: stretching an all-fixed gesture
    (staccato/fp/cuivre) is *supposed* to make the shape wider than the parts,
    because those samples only translate and never stretch (D9). An automatic
    "fit shape to parts" would silently undo that.
  - *If it recurs:* capture the gesture BEFORE and AFTER a single shape change and
    diff the member times — that pins the origin in one step.

- **Cuivre is fixed-length in the score but variable-length in the sandbox.**
  `Composer.FIXED_TECHS` lists cuivre at 1.17 s, so `isFixedLen()` makes it immune to
  group scaling; the cluster strip's `CG_VARIABLE` treats it as a drawn duration at
  insert. Net effect is coherent (the sandbox's length is preserved, then frozen),
  but the two halves disagree in principle. **Blocked on PLAN 2o** — the 60-second
  probe of whether note-off truncates a cuivre sample. Settle that first.

- **`durFor()` falls back to `son.ordLen || 1` for ord blasts.** S005 inserts at
  2.5 s per note. Fine, but it means a blast's ord length comes from the sonority
  record rather than anything measured, and long ord blasts collide with everything
  nearby by construction. Worth revisiting when ord blasts get used in anger.

- **Blast audition is still ideal-order, not placed-order.** `auditionSon()` plays
  the pitch-ordered mapping; the insert may route notes elsewhere to avoid
  conflicts. Inaudible today (every port carries the same instrument), so it only
  matters once parts are spatialized for real.

- **`piece-s08-work` 404 on page load.** The session bootstrap asks for a working
  copy that no longer exists; harmless, one console error per load.

- **The conflict badge does not recompute when you switch scores from a menu.**
  Observed 2026-08-16: with `piece-s16-work` open (badge `⚠ 42 soft`), loading
  `phase01-8th` from the Scores dropdown swapped the whole score — lanes 1–2
  drawn, 3–10 empty, markers rendered — but the badge still read `⚠ 42 soft`.
  A page reload on the same score showed the truth, `⚠ 0` (hidden). So the badge
  survives a load and reports the PREVIOUS score's count.
  - *Why it matters more than it looks:* it is wrong in both directions. A clean
    audition score inherits an alarming count, and — the dangerous one — a score
    with real conflicts loaded after a clean one reads `⚠ 0`. The wash on the
    lanes is the same computation, so it is presumably stale too.
  - *Why deferred:* it never lies once you touch anything (the check runs on every
    mutation, D16 corollary) or reload, and it did not block the phase-shift
    audition. The fix is to call the conflict recompute at the end of the
    score-load path in `composer.html`, next to `renderAll()`.
  - *Not touched* because a second agent was working in `composer.html` at the
    time.

## Fixed

- ~~Cluster insert didn't open the floating META window~~ (blast insert did) — fixed
  2026-08-16.
- ~~Cluster marker read `CG003 (cluster)`~~ — it looked up `provenance.cluster`,
  which these gestures don't carry; now reads `CG003 (REC-02)` via `cgOrigin()`.
  Fixed 2026-08-16.
- ~~Cluster audition and cluster insert disagreed about which player was which~~ —
  audition used port `tuba(k+1)` while the insert wrote `layer 9-k` (= Tuba 10-k),
  so what you heard was not the assignment you got. Both now go through
  `Composer.assignCluster` with `layer L = Tuba L+1`. Fixed 2026-08-16.

## HARD occupancy for fixed one-shots uses SAMPLE length, not articulation rate
*(opened 2026-08-16, DB3 / PLAN 2t)*

**What it is.** `Composer.CONFLICT`'s HARD tier = "the intervals overlap", where a
staccato note's interval is its full measured sample length (0.33–0.53 s). That
is what forced 154 hard conflicts on `densBld03-take1` and cost 91 notes at the
apex.

**Observation for changing it.** `docs/SI2_staccato_lengths.md` measures
**"Sounded (s)"** — how long the sample rang, decay and room included. A player
who has tongued a staccato has stopped blowing; the decay is horn and room, not
the player. **D17 already made this exact correction for SOFT** ("a fixed
one-shot's length includes decay the player is not articulating through") but
left HARD on sample occupancy.

**Observation against changing it.** On one instrument two notes cannot sound at
once, and the score/notation has to represent something. Sample occupancy is the
conservative reading and it is the only one the mock-up can render truthfully —
two overlapping notes on one player go out on two UVI channels and both sound
cleanly, which is the whole reason 2r exists.

**Why deferred.** It does not block: the conclusion is the same either way — DB3's
apex exceeds ten players even at a 0.11 s floor (44 hard). Only the *amount* of
thinning moves, from ~91 notes deleted to somewhere around 30–60. Settling it
needs a real player's articulation rate, which is the same evidence 2j and 2q are
waiting on. Until then the pipeline is conservative on purpose and
`docs/DENSITY_PIPELINE.md` says so.

**If it recurs:** the symptom will be the composer hearing the packed version as
thinner than intended at an apex. The one-line change is `pairTier`'s HARD test
for techniques in `FIXED_TECHS`; the tables to regenerate are in
`docs/DENSITY_PIPELINE.md`.

---

## `phase01-8th` / `phase02-*` cannot be regenerated by the current sweep CLI
*(found 2026-08-16 during PLAN 2x Phase 0; deferred)*

**What it is.** Four committed research scores — `phase01-8th`, `phase02-l120`,
`phase02-m60`, `phase02-s30` — no longer reproduce from `tools/phase_shift.js`.
Every note's `performanceNotes` reads `phase/unison`, `phase/shifting apart`
etc. (one tag per SWEEP STAGE), while the CLI now writes `phase/s0` — one tag
for the whole section. `phase01-8th` differs further: its marker labels use an
older format ("target 0.5 beat = 353 ms" vs today's "out 20s to 353 ms · DRIFT
…") and its note length is 0.42 s rather than the current 0.12 s default.

**What was observed, both sides.**
- The sweep CLI was clearly refactored at some point from one-section-per-stage
  to a single section carrying a `stages` array. Nothing recorded when.
- **Verified pre-existing, not caused by the 2x extraction:** checking out
  `tools/phase_shift.js` at HEAD (before the extraction) and running
  `--model sweep --name phase02-m60 --bpm 100 --out 60 --back 60` produces the
  *same* `phase/s0` divergence against the committed file.
- The extracted engine and the pre-extraction code agree **byte-for-byte** on
  this same command (and on `phase01-8th`'s defaults), so the extraction is
  faithful — it inherited the drift, it did not create it.
- The nine BEAT-model scores (`phase03`–`phase11`) all regenerate byte-identical
  and are the regression corpus.

**Why deferred.** It blocks nothing. `performanceNotes` is a provenance tag, not
sound — the audio, timings and pitches are unaffected, and the composer's
verdicts on phase01/phase02 were reached on the committed files, which are
untouched. The sweep model is also the *research* instrument (one slow pass to
find the categories), not the texture generator 2x is building on; the beat
model is what the sandbox uses.

**If it recurs:** the symptom would be wanting to re-render a phase01/phase02
variant and finding the stage boundaries no longer legible in the part tags. The
fix is to have the sweep path emit `sec.tag` per stage again — i.e. give
`buildScore` a stage-aware tag, or go back to one section per stage — and then
regenerate all four. Do not "repair" the committed scores in place; they are the
heard artefacts.

---

## The bend-envelope convention was written down in four places, one of them wrong

*(Found 2026-08-16 during 2z G4. FIXED — recorded here because the failure mode
is the interesting part, not the bug.)*

**What it was.** A morph note's `bend` array is relative to the **played key**
(`n.midi * 100`) — the render loop subtracts the key when it builds `subBend`.
But `toScoreObjects` and `morph_emit.js` both added the residual
(`cents - key*100`) a **second** time, so any note whose onset sits off its key
sounded sharp or flat by exactly its own residual. **Measured worst case on a
stock M2 spectral render: 40.2 cents.** Audition and insert were both affected.

**Why nobody caught it.** `tools/morph_probe.js` computed its *expected* pitch
with the same double-add, and so did the unit test. The day-10 measurement
("spectral targets within 0.4 ¢, fan waypoints within 1.0 ¢") was therefore a
true statement about the **MIDI-to-audio** chain that could say nothing about the
**engine-to-MIDI** step — it agreed with the error instead of testing it.

**The generalisation worth keeping.** A measurement is only evidence about the
step it actually crosses. If the expectation and the implementation are computed
from the same formula, the test is a mirror. Where a convention is expressed in
more than one place, assert the two ends against each other — which is what
`test_morph.js` now does: sounding cents `=== midi*100 + bend`, in the engine, in
the score object and in the emitted MIDI.

**Consequence still open:** 2v material with off-key onsets (M2 spectral, M1/M3
detunes, anything re-keyed) now plays differently from what the composer heard on
day 10 — correctly, but differently. The blessed verdicts on those variants were
formed on slightly wrong pitches.

---

## Two test helpers still measure absolute pitch loosely

*(2026-08-16, 2z G4. Cosmetic — the assertions pass and are about ratios.)*

`test_morph.js`'s `travel` and `arrive` helpers were corrected to
`midi*100 + bend` along with everything else, but they were written to compare
*relative* travel, so they would have passed either way. If a future change makes
either of them load-bearing, they should be re-derived rather than trusted.

---

## The Morph panel ignores `active` when the AI writes a new rev
*(found 2026-08-16 during PLAN 2x Phase 1; deferred — it is 2v/2z's file)*

**What it is.** `score/public/morph_panel.js`'s `refresh()` only adopts the
params file's `active` field when the currently-selected variant has become
invalid:

```js
if (keys.indexOf(this.active) < 0) this.active = j.active ... : keys[0];
```

So when the AI writes a new `rev` and sets `"active": "B"` — meaning *"here is
the new slate, and B is the one I want you to hear"* — the panel stays on
whatever tab the composer was on. The composer then reads A's label and A's
dials while the AI's message is about B.

**What was observed.** Reproduced directly in the Texture panel, which copied
this logic: writing `rev: 2, active: "B"` left the panel on A (latency was fine
— 888 ms — it was only the tab that did not move). Fixed in
`texture_panel.js` by adopting `active` **only on a rev change**, so a
deliberate AI write lands where it says, while an ordinary poll never yanks the
composer's tab out from under them.

**Why deferred.** Not fixed in `morph_panel.js` because a second agent was
actively working in that file at the time (2z had just committed G5 and moved
on to 2y), and a concurrent edit to someone else's in-flight file is exactly
what the explicit-path staging rule exists to prevent. It is also not blocking:
the composer can click the tab.

**If it recurs:** the symptom is the composer auditioning the wrong variant
after an AI write and the numbers not matching the description. The fix is four
lines, and the working version is in `texture_panel.js`'s `refresh()` — copy it
across, including the `pinned = null` reset (a new slate invalidates the old
A/B reference).

## The fade-in / release BLIP — RESOLVED day 14 *(opened day 13)*

**RESOLVED 2026-08-17 (day 14): composer verdict "Blip gone."** The day-14
update at the end of this entry was the real mechanism — CC7 timing, both ends.
Kept below as the record of how it was found; details in `MORPH_FINDINGS.md`
("The CC7 timing law") and RUNNING_LOG day 14.

**What is observed.** A short attack at the start of a shaped fade-in, and at the
release. The composer: *"still an attack but a little quieter"* after three fixes,
and *"there are blips on the attack and the release still."*

**What was found and fixed (all real, none of them the whole story):**
- the engine's **0.4 level floor** meant a fade "from silence" opened every voice
  at **CC7 = 24** — the measured CC7 map is very steep at the bottom (level 0 →
  CC0, but 0.2 → CC23). Floor now drops to 0 inside an attack window only.
- a note at `tStart 0` scheduled its **CC7 in the same millisecond as its
  note-on**, so it had no lead; and `stop()` leaves CC7 at **127**. Opening CC7 is
  now sent synchronously before any timer.
- **note-on velocity** now scales down inside an attack window (floored at 1).

**Measured result: the eight opening voices went `CC24/vel96` → `CC0/vel1`.
The blip persists.**

**THE COMPOSER'S COUNTER-EVIDENCE, which the AI's diagnosis does not explain:**
playing four or eight ordinario notes from a keyboard or virtual keyboard gives
**no attack at all**. If the sample had an onset transient, it would be audible
there too. **So the velocity/sample-onset story is at best incomplete, and the
AI's confidence in it was not warranted.**

**Why it is deferred, not solved.** No clear evidence for a cause (rule 5), and
the composer's read is that it belongs to the chain rather than the engine:
*"there's just something I'm missing between the AI generated MIDI file and the
way Reaper handles everything or the way the sample instrument handles
everything… these are sticky problems that happen all the time."* They will fix
it manually in Reaper for the demo.

**Where to look next — NOT in the engine.** The three engine causes above are
already fixed; re-running them will waste a session. Candidates: message ordering
or coalescing between the browser's Web MIDI and loopMIDI · Reaper's handling of
a CC7 that arrives in the same millisecond as a note-on · whether UVI's amp
envelope re-triggers on CC7 movement · **and the obvious control the AI did not
run: compare a generated `.mid` played in Reaper against the same notes played
live from the keyboard**, which isolates the chain from the engine in one test.

**DAY 14 UPDATE — a fourth mechanism found, timing not values, PENDING THE EAR.**
On the composer's explicit ask ("one more crack"), the day-14 read found what the
three fixes had not tested: **CC7 moving while sound is present**, at both ends.
The opening CC7's *real* lead was ~2–5 ms (the "synchronous" arm fires at
play-press, the note-on on the very next timer tick) — and the score app's own
curve playback had already met and killed this exact artifact with
`PREARM_S = 0.15` (*"kills the entry bite"*). At the end, `panic()` restored
CC7=127 in the same instant as the note-offs, yanking the ~0.69 s release tail
up to full — and it fired on every replay press too. **This explains the
keyboard counter-evidence instead of fighting it:** a keyboard note has no CC7
movement near its note-on. Fix shipped in `morph_emit.js` (`CC_LEAD_MS 250`
schedule shift + cold-entry CC7 lead · CC7 restore delayed `TAIL_MS 2000`,
per-channel, cancelled on re-arm). **Message timing verified in the running app
with capture stubs; the SOUND claim awaits the composer.** If the blip survives
250 ms of settle, this story is wrong too — then run the `.mid`-vs-live control
above. Fallback shipped regardless: the panel's **Fade ladder** plays N attack
lengths in ONE play session, so a press-edge artifact can hit at most rung 1.

- **2026-08-19 (Phase B review): render.js re-implements procedural stamp
  geometry.** stems/dots/staff lines/ledgers/beams are inline math in the
  renderer while stamps.js's constructors for the same shapes are exercised
  only by tools/test_stamps.js — the B3 parity gate tests a mirror of
  geometry production never runs (piece #2 Principle 29). Minimal fix done
  (ledger width reads glyphs.json); full fix = route the inline shapes
  through the stamp constructors. Not now: v0 shapes are trivial and the
  render snapshot pins them; becomes real when shapes gain complexity
  (beam slants, double beams) at material time.

## OPEN — the "27 oct B" section is not multitempo in the file (day 21, deferred)

**Composer: "That section definitely sounds like a multitempo... let's put it
as a thing to investigate."** The section at ~48.8-60.8 s in `tranceA003*`
(marker `27 oct B`) measures as **all ten players at 0.75 s = 80 BPM, one
uniform rate**. But gen-aud-05 segment 27 (model F `16:15:14:13:12:11` at 150)
should be **six streams at 150 / 140.5 / 131.3 / 121.9 / 112.5 / 103.1 BPM,
cycle 6.4 s**, with pair-splitting. The uniform 80 BPM is already baked into
`scores/aud-9.json` (property `gen:"aud9"`), so it happened at that build
step, not at insertion.
**Why it matters (composer's own point): downstream notation.** A part written
from this will read as a plain 80 BPM pulse; if the material is actually
multitempo the notation will be wrong. Also `notation/ir/trance-bar-01.ir.json`
(the day-19 hand-worked IR chunk) is built on the "F oct B figure on the
player's OWN 0.75 s pulse (80 bpm)" reading — so that chunk inherits whatever
this turns out to be.
**To investigate:** find the console script / step that produced `aud-9` and
determine whether the uniform pulse was a deliberate simplification or a lost
tempo map. NOT urgent; the composer likes how it sounds.

## Entry-line invisible on the composer's machine (day 21, deferred)

The G-proof cursor-entry marker (orange 2px dashed + arrow at x=gutter)
is pixel-verified rendering in the verify browser (canvas rasterize +
getImageData: color 216,67,21 present), but the composer does not see it
after hard reloads and a Chrome restart. Unresolved viewer-side mystery -
composer explicitly deferred troubleshooting ("rather not do this kind of
troubleshooting now"). Only matters to proof furniture; the REAL cursor
entry behavior is V2 code with its own gate. Revisit only if V1/V2
visuals also diverge on the composer's machine (then it is a real
rendering-environment difference worth understanding).
