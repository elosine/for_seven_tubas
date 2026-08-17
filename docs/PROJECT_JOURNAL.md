# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**CHECKPOINT (2026-08-17, day 15 evening — THE TRANCE SECTION HAS ITS PLAN:
2aa PULSE SEQUENCER STRIP. Claude Code / Opus 5 → composer switching models) —
(mid-session checkpoint).** The composer is clearing chat and changing models
before implementation; **PLAN 2aa (Pulse sequencer strip) is the complete,
self-contained build spec — implement from it, not from chat memory.**

- **The evening went to the trance section** (the pulsed Ghost-Trance final
  section, filed day 14). The composer sketched 7 pitches by keyboard into
  `scores/tranceSB01.json` (a fifths chain G1 D4 A2 E3 B3 F2 C2); an accretive
  pulse was generated from it twice — `tools/pulse_build.js` (file-based,
  committed with this checkpoint) wrote `scores/tranceSB01-2.json` @120 BPM,
  then a console script rebuilt it in-app @130 BPM with ten pitches (adding
  F#3 C#3 G#3, continuing the fifths chain) and 2–6-repeat entries.
- **THE ENSEMBLE IS TEN TUBAS** — composer, explicitly: "10 parts tracks one to
  ten." Not seven-plus-doubling. (The repo name stays historical.)
- **Then a REALIGNMENT (read this, it supersedes the sketches):** what the
  composer wants for this section is a **click-a-column sequencer sandbox** —
  steady pulse, dozens of columns, click any column → assign a sonority from a
  menu → hear the grid loop in real time. Audition only; nothing written to
  the score in v1. Orchestration/doubling, the per-part shift matrix, and
  score-writing are explicitly LATER passes (they are listed as v2–v4 in 2aa).
  Option (b) — minimal panel in the composer app — was chosen over console
  scripts (too slow per change) after explicit discussion.
- **Everything needed is named in 2aa:** palette file `bank/pulse_palette.json`
  (FIFTHS · CLUST10 · 12 pitch-class-octave entries · 16 staccato/cuivre bank
  refs — the S-ids are enumerated), server route, panel on the morph_panel
  chassis, **playback via `MorphEmit.play` (no new scheduler — this was the
  risky part and it exists, blip-hardened)**, and the extensibility contract:
  the composer ADDS sonorities BY ASKING THE AI, which appends to the palette
  JSON (three source shapes documented in 2aa).
- **Also this session, before the trance work** (already committed/pushed):
  Fade ladder verified end-to-end + extracted to `M.buildLadder` + pinned by
  `tools/test_ladder.js` (54/54) — the checkpoint note that it was "unstarted"
  was stale, it shipped day 14. **The lazy-MIDI bug is REAL and still open:**
  the score only initialises Web MIDI on Play / CC7 Reset / REC-arm — on a
  fresh page the keyboard is dead until one of those runs
  (`initZoneMidi`, composer.html ~12246). Diagnosed live with the composer;
  fix (init on load) NOT built; belongs next to ISSUES I3.

**Next concrete step: BUILD 2aa v1** — palette JSON → server route → panel →
MorphEmit glue → verify live per the Done-when. Then the composer auditions.

**Open at this checkpoint:**
- **Deliberately uncommitted:** `scores/tranceSB01.json`, `tranceSB01-2.json`,
  `piece-s21…s24.json`, `reaper/7_tubas_rack.rpp` — composer's live work.
- **Pending the composer:** 2aa's three open questions (11-vs-12 pitch
  classes, cluster centre, loop default) · BALANCE 5 s close (unheard) ·
  Fade-ladder audition (unheard) · sonority naming pass.
- **For the next AI:** the composer works clicking-and-listening; keep the
  panel ruthlessly v1. Do not build the deferred passes unprompted.

---

**DAY 15 CONTINUED — THE FADE LADDER WAS ALREADY BUILT; IT IS NOW VERIFIED AND
TESTED. Claude Code / Opus 5.** 1 commit. `test_morph.js` 354/354 and
`test_ladder.js` 54/54 (new); `model_bank --validate` VALID.

- **The checkpoint's "nothing is started" was wrong, and the error is worth
  naming because the cycle is supposed to prevent exactly this.** The ladder was
  built on **day 14**, commit `1457b79`. Day 14 listed it under *"Next up"* and
  then built it in that same session without amending the line; day 15's
  checkpoint copied the stale line forward, and `PLANNER.md`'s `NOW ►` inherited
  it. **`/checkpoint` step 2 refreshes `NOW ►`, but nothing refreshes "Next up"
  against what the session actually shipped** — so a completed item can survive
  as the next task indefinitely. Cheap guard: before writing "Next up", check it
  against `git log` for the session.
- **What was genuinely missing was verification, and it is now done.** Day 14
  shipped the ladder as a blip fallback and never claimed an in-app check —
  which under AI_METHODOLOGY means the composer could not plan around it.
  - **Assembly math, headless:** rungs are laid at `len + hold + gap`, each
    clipped to its own window, none overlapping; every rung after the first
    opens **cold** on every voice by emit's own cold/warm test. The gap (2.5 s)
    outlives both the 0.69 s ord tail and the 250 ms CC7 lead — *that* is what
    makes rungs 2..N a clean-attack condition, so it is load-bearing, not
    cosmetic.
  - **In the running app, through the real button handler:** the ladder builds
    59 notes / 51.5 s with rungs at 0 / 7.5 / 16 / 25.5 / 37 s, reaches
    `E.play`, and fails **only** at MIDI. The no-attack guard and the junk-input
    guard both refuse cleanly, leaving zero timers and the Play button restored.
  - **NOT verified: the sound.** This browser blocks Web MIDI for
    `localhost:5200`, so nothing was ever emitted. **The audition is the
    composer's, in their MIDI-enabled window** — and that was always the point
    of the ladder.
- **A false alarm, recorded so it is not re-run:** the first metric said every
  rung peaked at 7.37 s, which reads as "the ladder plays five identical rungs".
  It does not. The *global* peak belongs to the morph's own `dyn` curve and
  barely moves with the attack; what the attack governs is the **ramp**. Mean
  opening level at 1 s: **0.71 / 0.40 / 0.27 / 0.16 / 0.11** for 1/2/3/5/8 s.
  The test now asserts the ramp, never the peak.
- **The assembly moved into the engine as `M.buildLadder` (pure), behaviour
  unchanged.** It was in a browser-only IIFE, so a test could only *replicate*
  it and would drift from it silently. The panel now calls it and
  `tools/test_ladder.js` pins it — one implementation, and what is tested is
  what plays. The test reads any banked ACTUAL carrying `resolvedParams` rather
  than hard-coding `ACT-BLOOM-01`, and SKIPs (not fails) if the composer deletes
  them all.
- **Filed to NITS:** the 4 s hold is fixed, so a long rung is cut while still
  much quieter than a short one was — arguably correct, easy to confuse by ear,
  one constant to change if it bothers the composer.

**Next up — unchanged, and now genuinely next:**
1. **THE COMPOSER AUDITIONS THE LADDER** in a window where MIDI is allowed:
   open the Morph panel, pick a shape preset, press **Fade ladder**. Nothing is
   blocking this.
2. Then the **notation pass** — FR-7, D3's performer transform and the 0–10 →
   dynamic-mark convention all come due there.

---

**CHECKPOINT (2026-08-17, day 15 — THREE MORPHS IN THE PIECE (8:16); TWO EAR-BUGS
FIXED; THE CLEAR CYCLE SPLIT IN TWO. Claude Code / Opus 5) — (mid-session
checkpoint).** 3 commits, all pushed. `test_morph.js` 354/354, fixtures never
regenerated; `model_bank --validate` VALID.

- **THE COMPOSER PLACED TWO MORE MORPHS, and the piece is now 8:16.**
  `piece-s23` (1236 objects, **496.6 s**) carries all three of their own
  actuals: `ACT-BLOOM-01` "JYBloom001", `ACT-CONVERGE-01` "JYConverge001" and
  `ACT-BALANCE-01` "jyBalance001" (110 notes). `piece-s24` exists and was not
  inspected. **That is 55 % of the 15-minute Penn State ceiling** — the length
  of anything further is now a formal decision, and the final pulsed section and
  the remaining morphs compete for the same ~6:45.
- **"THE BALANCE MORPH SEEMS TO END MORE ABRUPTLY THAN THE OTHERS" — true, and
  it was never a bug in code.** Measured: BALANCE cut at **97 % of its own peak**
  (mean voice level 7.5/10, all 8 sounding) against **29–59 %** for the other
  five. Every legacy render chops all voices at the span; only the LEVEL at the
  chop differs, and that is `dynLevel`'s shape. `swell` is an arch whose ends ARE
  its trough; `rotate` is a full turn that returns to exactly where it began
  (p=0 and p=1 give identical levels). BALANCE is the only model on `rotate` —
  that IS M6's identity. **Control, symmetric:** BALANCE on `swell` → 49 %,
  BLOOM on `rotate` → 100 %. **Same root as the day-13 release bug, on the path
  day 13 did not cover** (`relFade` only guards inside a release; a stock model
  has none). **Fixed in DATA:** `BALANCE.baseParams.carrier.release: 5` + a
  `close it` recipe (0 → 12 s, OFF until turned). Dial 0 restores the old hard
  stop exactly. **`carrier.duration` must never be patched by that recipe** —
  pinning it makes `slower / longer` switch cycling ON below span 30 (span 10
  → 42.9 s instead of 18.7 s). Full record: `MORPH_FINDINGS.md` "The ending law".
  *Not heard yet — whether 5 s is the right close is the composer's call.*
- **THE TIME READOUT REGRESSION, and it was not styling.** The hover-for-px/s
  handler (2026-08-14) assigns `floatingTime.textContent`, which DELETES the two
  spans the m:ss line added on 08-17. `el._time` had saved their concatenation
  (`"142.072:22"`), so mouseleave restored one flat 18 px node — and `_ftSec` /
  `_ftMMSS` still pointed at detached spans, so **the readout froze until
  reload**. Day 14 verified eight times but never hovered. Fixed: the px/s
  overlay is its own `.ftZoom` span, shown by hiding the other two;
  `updateTimeDisplay` now rebuilds if its spans were detached. Verified in a
  standalone browser harness (old froze at `158.322:38`; new advanced
  158.32 → 166.51 with all three spans intact).
- **THE CLEAR CYCLE IS NOW TWO CYCLES** — composer's question, *"can we have a
  preclear and a postclear protocol?"* Subject changed → `/session-end` ·
  `/clear` · `/session-start`. Same task, long chat → **`/checkpoint` · `/clear`
  · `/resume`** (new, in this repo's `.claude/commands/`; the rationale is
  `SESSION_HYGIENE.md` § The two boundaries). The commands are canonical for
  their own steps. **Note the split:** `session-start` / `session-end` still live
  in piece #2's repo, which is reference-only — the composer may want all four
  moved to `~/.claude/commands/`, undecided.
- **`PLANNER.md`'s `NOW ►` was six days and two morphs stale** (still "piece-s17,
  135.8 s, next: scope 2z and 2y"). Refreshed. `/checkpoint` step 2 now exists
  specifically to stop that recurring, because `/resume` reads that line.

**Next up — the composer's stated order, unchanged:**
1. **BUILD THE FADE LADDER.** A new row in the Morph panel that renders N attack
   lengths **back-to-back in ONE play session**, so a press-edge artifact can hit
   at most the first rung. This is the concrete next step; nothing is started.
2. Then the **notation pass** — FR-7, D3's performer transform and the 0–10 →
   dynamic-mark convention all come due there.

**Open at session end (day 15):**
- **DELIBERATELY UNCOMMITTED, do not "clean up":** `scores/piece-s21.json`,
  `s22`, `s23`, `s24` and `reaper/7_tubas_rack.rpp` are the composer's live work,
  saved from the app while this session ran. `bank/actuals/ACT-BALANCE-01.json`
  and `ACT-CONVERGE-01.json` WERE committed, only because
  `bank/morph_models.json` already referenced them and committing the store
  without them would leave dangling actuals.
- **Pending the composer:** whether 5 s is the right stock close for BALANCE
  (unheard) · **FR-8's three readings** of part doubling · whether to move the
  session commands to `~/.claude/commands/` so all four live together.
- **Filed but not started:** the pulsed section's *"close 10 note cluster that
  opens out to spread chords on beat"*, and *"come back to the last morph and try
  to release on the consonant clear chord"* — the latter is a release-TARGET
  question; `shape.release.motion` has `to-unison` but no arbitrary-target
  voicing. Both in COMPOSER_LOG day 15 + PLANNER.

---

**CHECKPOINT (2026-08-17, day 14 — THE BLIP IS GONE; THE MORPH IS READY TO
PLACE; Claude Code / Opus 5 + Fable 5).** Mid-session checkpoint before a chat
clear. 5 commits, all pushed. `test_morph.js` 354/354, fixtures untouched;
`model_bank.js --validate` VALID.

- **THE BLIP IS SOLVED, AND IT WAS TIMING, NOT VALUES.** Composer: *"Blip
  gone."* Day 13 fixed the CC7 *values* (24 → 0) and velocity; what was never
  tested was **CC7 moving while sound is present**. The opening CC7 had ~2–5 ms
  of real lead (the "synchronous" arm fires at play-press, the note-on on the
  next timer tick), so a sampler smoothing CC7 still had the channel near the
  stop-restored 127 when the note spoke — and `panic()` restored CC7=127 *in the
  same instant* as the note-offs, yanking the 0.69 s tail. **The composer's
  keyboard counter-evidence was the discriminator all along:** a keyboard note
  involves no CC7 movement near its note-on, so it has no bite. Fix:
  `CC_LEAD_MS 250` schedule shift with a cold-vs-warm entry test, and the CC7
  restore delayed `TAIL_MS 2000`, per-channel, cancelled on re-arm. Law recorded
  in `MORPH_FINDINGS.md`; **D36's velocity inference is consequently unsupported
  again** (see its addendum) — 2q's listening test is undecided, not settled.
- **`ACT-BLOOM-02` SAVED AND BANKED** — *"BEATING BLOOM, 108 s 001"*, the first
  post-save-fix, post-blip-fix actual. 106 notes / 8 voices / 113.9 s, BLOOM seed
  11, dials slower-longer 0.76 + more dramatic 0.55, preset `fade-in-3s` with
  attack 9 s, carrier {span 48, duration 90, release 18}. Stale `ACT-BLOOM-01`
  deleted by the composer and de-referenced.
- **A BUG THAT HAD BEEN THERE SINCE 2v: EVERY MORPH INSERT LANDED AT t=0.** All
  three panels read `C.playheadTime` / `C.currentTime`, **neither of which has
  ever existed on `Composer`** (confirmed undefined live), so the expression fell
  to 0 always. The composer placed at ~142 s, saw nothing, placed again, and only
  the conflict badge moved — both groups were sitting on DB1. Fixed to
  `getTimeAtPlayhead()` in both morph paths and (latent) the texture panel.
  **Verified in the running app: placed at 142.0 s → `firstStart 142.000`, and
  108/108 objects present in the DOM after render.**
- **THE NOTATION DATA WALK IS DONE AND CLEAN** (the composer's ask, done against
  their graphic-layer dictation). Everything the part scores and the conductor's
  graphic need is present or derivable — full findings in RUNNING_LOG day 14.
  **Two things to carry:** place morphs from the **ACTUALs tab** (it logs
  placements and the group id names the ACTUAL; scratch Insert is anonymous), and
  **notation reads the ACTUAL + placement offset**, not the score objects alone
  (per-note BREATH/SEAM flags do not survive into objects — FR-7).
- **THE COMPOSER'S TWO BIG NOTES, both filed verbatim in COMPOSER_LOG day 14:**
  (1) **a GRAPHIC LAYER in the full score** — beating acceleration, how many
  layers of beating, *which players beat against which* — so a conductor can
  rehearse and shape what the part notation cannot show; part scores get a
  pitch/crescendo curve, colour for playing/breathing/rearticulating, and spot
  dynamics. (2) **the FINAL SECTION: a pulsed, Ghost-Trance-like field** —
  continuous pulse notated *and* coloured, pitch material single pitches → pitch
  sets → tone rows, with multi-tempo bursts and phase-shifting sections
  **cross-cut** in.
- **FR-7 / FR-8 / FR-9 spec'd, none built** (D35). FR-7 flags-into-objects
  (composer chose: build at the notation pass). **FR-8 part doubling** — measured:
  all six models use 8 pitches, so 2 of 10 players are idle; **but the 8 are
  already 4 doubled pitches and that pairing IS the beating mechanism**, so three
  materially different readings are on the table and the composer picks.
  **FR-9 phase-shifting at a tempo** — read from the source, the texture engine
  already has rate(t) by phase integration, per-voice `phase0` and a beat-displaced
  grid, so the gap is likely the interface, not machinery.
- **Time readout:** seconds unchanged (18 px, 2 dp) with **m:ss added beneath at
  9 px**, floored so 119.99 reads 1:59.

**THE MORPH IS IN THE PIECE — done by the composer at the end of this session.**
- **`piece-s20`** carries **`grp-act-bloom-01-01`, 108 objects, 141.39 → 255.31 s**
  — the full 113.9 s morph. `piece-s19` is the step before it (a 30 s scratch
  morph at 141.41–171.41 s). `piece-s18` was restored clean first (906 objects,
  ends 135.77 s).
- **The composer made their own actual, `ACT-BLOOM-01` "JYBloom001"** — their
  dial-in, distinct from the AI-saved `-02`: carrier span 47.5, attack len 8,
  dials 0.75 / 0.55, seed 11, `fade-in-3s`. It reused the id freed by deleting
  the stale `-01`. **Its self-logged placement (`piece-s18-work` @ 141.386 s) is
  the t=0 insert bug confirmed fixed in real use**, not just in the AI's test.
- **The piece now ends at 255.3 s (4:15)** — up from 135.8 s. Against the
  **15-minute Penn State ceiling**, one morph is ~14 % of the piece; 3–5 of them
  was the plan, and that arithmetic is now real rather than hypothetical.

**Next up:** the composer's stated order — audition attack lengths with the
**Fade ladder** (new panel row: renders N attack lengths back-to-back in ONE
play session, so a press-edge artifact can hit at most the first rung), then the
remaining morph objects for the section. **Then the notation pass**, where FR-7,
D3's performer transform and the 0–10 → dynamic-mark convention all come due.

**Open at session end (day 14):**
- **`piece-s18-work.json` may still hold two junk groups** (`grp-morph-01/02`, 36
  objects each at 0–30 s, on top of DB1) from the t=0 bug — harmless now that
  `piece-s18/19/20` are all saved and committed, but it will offer them back if
  that working copy is ever resumed. **`piece-s18.json` itself is clean.**
  The trap, worth knowing: at the working-copy prompt **Cancel = discard,
  OK = resume the junk**, and choosing "fresh" does not itself overwrite the
  stale work file, so a reload offers it again unless CTRL+S follows.
- **PROPOSED, NOT BUILT, NO GO GIVEN:** (1) make "start fresh" write the clean
  working copy at once — the actual defect, since the choice does not persist;
  (2) replace the OK/Cancel `confirm()` with a dialog whose buttons say
  *Resume edits* / *Discard and start fresh*.
- The AI told the composer to click a **"place"** button that did not exist (both
  buttons read `insert @ cursor`), which is what sent the clicks down the scratch
  path. Relabelled `place @ cursor`.

---

**SESSION END (2026-08-17, day 13 — MORPH CYCLING BUILT; SPEC LEDGER OPENED;
Claude Code / Opus 5).** 17 commits, all pushed. `node tools/test_morph.js` =
**354 passed, 0 failed, fixtures NEVER regenerated** — every pre-existing render
is byte-identical.

- **THE ROOT FINDING, and everything else follows from it:** the morph engine had
  **exactly one time value**, and the glissandos were stretched to fill it — so
  "how long the gliss takes" and "how long the gesture lasts" were the same
  number. Split into `carrier.span` (the ONE-WAY gliss = pace) and
  `carrier.duration` (the body). **Cycling is on exactly when duration > span**;
  no separate switch. `voiceProgress` folds with a triangle instead of clamping,
  so the trajectory runs **out and back** forever instead of arriving and
  stopping. **Loudness needed no code at all** — it already rides the same
  progress, so it cycles for free.
- **`carrier.release`** = a forced run-down. Because loudness rides progress,
  driving progress to 0 returns pitch to unison *and* level to the floor in one
  motion: **the bloom closes as it fades.** Measured: final detune 0.00 c and
  final level 0.8 on every voice, stops staggered. Negative control run (no
  release → voices end at 7.9–9.2, non-unanimous).
- **THREE BUGS FOUND BY THE COMPOSER'S EAR, all real, all in the engine.**
  (1) A release used to switch the *body* into cycling. (2) The dynamics layer is
  **not monotonic in progress** — `swell` is an arch, loudest at p = 0.5 — so
  running progress down walked back **through the peak** (measured 9.20 of 10
  inside the release). (3) The re-entry "sneak-in" dip-and-rise, which hides
  seams in a body, is a **crescendo on every re-attack** inside a fade.
  *Pattern, three times in one day: a mechanism correct for the body, reused
  where its assumptions do not hold.*
- **TWO PRE-EXISTING PANEL BUGS**, both found by testing rather than reading:
  `readFields` threw on **every** call in MODELS mode (recipe checkboxes/sliders
  and the preset picker carry no `dataset.path`), so **nudging any dial there had
  silently done nothing since MA3**; and `Save as ACTUAL` **dropped every
  hand-typed field**, re-deriving from the model — so a dialled 300 s bloom saved
  as the stock 40 s one. Both fixed; the save now stores the exact params
  rendered.
- **Panel made usable** — it was an uncapped block, so MODELS mode grew past the
  screen taking every button with it. Now a height-capped flex column with one
  scrolling middle, a resize grip, and a clamp that cannot strand it.
- **SPEC LEDGER OPENED: `docs/FEATURE_REQUESTS.md`** (FR-1…FR-6, composer's
  words + research + gates), plus `docs/plans/MORPH_CYCLING_PLAN.md` (the build)
  and **`docs/plans/MORPH_SECTION.md`** (the section's form: morph bed + played
  impacts; the governing constraint is that the bed and the impacts share ten
  players, so impacts must borrow **whole pairs**).
- **PENN STATE: 15 MINUTES MAX** (composer, from the call PDFs now in `docs/`).
  Recorded in `PENN_STATE_RESEARCH.md`. **This binds the morph section** — one
  5-minute cycling morph would be a third of the piece.

**Next up, in the composer's order:**
1. **Hear the attack.** The body (BLOOM + duration + release) is decided; three
   shape presets exist (`fade-in-3s`, `hit-and-settle`, `brassy-hit`) and are
   **UNHEARD**. The composer needs to audition fade lengths and check the seam
   where the attack joins the body — **blocked by the blip, see below.**
2. **Audit the saved JSON for the notation phase** — walk `ACT-BLOOM-01.json` and
   a placed score and confirm every field the notation pass will need is present.
   *(The AI's assessment, unverified: the score JSON and the actual's provenance
   already hold more than MIDI ever could — bend and level breakpoint curves per
   note, `groupId`, the META shape. MIDI is a render, not the source of truth.)*
3. Then: 3–5 of these morph objects for the section.

**Open at session end (day 13):**
- **THE BLIP IS NOT DIAGNOSED, AND THE AI'S DIAGNOSIS WAS DISPUTED.** The
  composer hears a short attack at the start of the fade-in and at the release.
  Three engine causes were found and fixed (level floor → opening CC7 went 24 → 0;
  CC7 had zero lead at t=0; velocity now scales inside an attack window). **The
  blip persists, quieter.** The composer's counter-evidence: playing four or
  eight ordinario notes from a keyboard gives **no attack at all** — which none
  of the above explains. **Do not re-run the same three fixes.** The next place
  to look is the generated-MIDI → Reaper → UVI chain, not the engine. Composer's
  stated position: *"it's fine for now, I'll fix it manually in Reaper for the
  demo."*
- **The composer cannot currently hear the attack because of it**, and asked for
  a way to audition fade lengths **outside the live-MIDI path**. **Recommended
  and NOT built:** render N attack variants end-to-end into one `.mid` via the
  existing `tools/midi_out.js` (SMF writer with bend, from 2j) and play it in
  Reaper — which is where the composer is fixing things anyway. This was the
  live question when the session ended.
- **`ACT-BLOOM-01` IS STALE** — saved before the reload that carried the save fix,
  so it kept the sliders (`slower / longer 0.76`, `more dramatic 0.55`, seed 11,
  pace 48) but **not** duration, release or the attack. Its label says "108 s"
  because that *was* the real length. Re-save as `-02` and delete it.
- `bank/morph_models.json` rev 2 — BLOOM now lists `ACT-BLOOM-01`; that reference
  must be cleaned up with the file.
- Two Penn State call PDFs and `scores/MorphPallette01.json` (the composer's empty
  scratch score) are in the tree.

**Blockers:** none for composing; the blip blocks *auditioning the attack* only.

---

- **Day 12 (08-16/17), two concurrent sessions in one tree.** **2x TEXTURE
  SANDBOX built end to end** (317 assertions; `Texture` button; detail in
  `docs/plans/TEXTURE_SANDBOX_PLAN.md` §13). Its finding that reaches past the
  sandbox, MEASURED: **the 23/s density ceiling is C3-SPECIFIC** — any real pitch
  set drops it to 18.9–20.8/s, so a texture calibrated by ear at unison C3 is
  ~18 % too dense once it has pitches; the engine now computes the ceiling per
  render. Four defects found by RUNNING it, none by reading (dead seed stepping
  → **Principle 6**; `active` ignored on rev bump; shared `E.onStop`; the
  conflict badge is structurally ring-blind). → **D33** (parallel texture actuals
  store). **2z GESTURE SHAPING built** (331 assertions) and **2y MA0–MA3 built**
  (model store, validator, recipe engine, ACTUALs panel → **D32**). The
  composer's verdict on 2z's generic shapes — *"correct as an engine"* but not as
  sound models — set **D31: bespoke, one morph at a time**. Two pre-existing 2v
  bugs fixed by measurement: **pitch out by up to 40.2 ¢** on off-key onsets
  (→ **Principle 5**) and the panel carrying the previous variant's dials across
  a switch, which made every day-10 cross-variant comparison invalid.
  **Still open, and all of it is in §6 Human Notes:** the entire 2x listening
  slate (nothing has been heard by anyone), MA4 (rename the six placeholder model
  ids before actuals reference them; bless the recipe slates), and re-hearing the
  six models now that both bugs are fixed.

---

- **Day 11 (08-16):** planning only — 2z and 2y drafted, design-reviewed with the
  composer and approved; build order 2z→2y, never concurrent; 2x ID collision
  resolved. Both plans hardened for a cold implementer.
- **Day 10 (08-16), two concurrent sessions:** **2v MORPHING CHORDS complete**
  (D24–D26; six models, 101 tests; bend works ±1.99 st; *"we are already there —
  spoiled by riches"*) and the **2j PHASE-SHIFTING arc complete** (D27–D29; the
  two-family model; pitch beating verified predictive; the register law).
- **Day 9 (08-16):** DB3 orchestrated; **PLAN 2t DENSITY PIPELINE** shipped
  (D19–D23) — 251 → 160 notes at 0 hard / 0 soft, placed as **piece-s16**; 2w
  gesture bank + recall; labels-never-render bug fixed (Principle 4).
- **Day 8 (08-16):** collision avoidance end to end (**2r**), HARD/SOFT tiers
  (D17), back-audit of all 164 scores clean (**2s**); `AI_METHODOLOGY.md`
  adopted as governing (D18); `NITS.md` opened.
- **Day 7 (08-16):** the CLUSTER SANDBOX (**2p**) — 42 takes, piano-roll editor,
  lists + items (D14), velocity-not-CC7 (D12), `SESSION_HYGIENE.md`.
- **Day 6 (08-15):** the blast pipeline — piece-s09, Blast Sandbox + three-tier
  taxonomy (D11), the SAMPLE-LENGTH SURVEY → **D9**, the save system (D10).
- **Days 4–5 (08-13/14):** piece assembly began (s01→s07c); harmony palette;
  GESTURE-2 banked; cressand research; ostinato engine; `NAMING.md`.
- **Day 3 (08-12):** CRD remote listening; species {sine, expodec, surge}; the
  density arc → DB 044; containers begun (DB 045).
- **Days 1–2 (08-10/11):** stack seeded from piece #3; SI2 roster + dual-port
  (D2); CC7 law and gain staging; laws L1–L3, Xenakis X1–X8; **Penn State
  research — deadline Sept 4 2026**; LAW L4 + RECIPE MAXDENSE-1 (DB 035).

**Orientation for a cold session:** `docs/AI_METHODOLOGY.md` (governing — read
before proposing anything) → `docs/PLANNER.md` (what now) → this §2 →
`docs/SHAPE_LESSONS.md` if the work is gesture shaping →
`docs/DENSITY_PIPELINE.md` if it is a density build. Morph/model work:
`docs/plans/GESTURE_SHAPING.md` §15 and `docs/plans/MODEL_AND_ACTUAL_PLAN.md`
§13 record what was actually built vs planned; texture work:
`docs/plans/TEXTURE_SANDBOX_PLAN.md` §13. Server: `node score/server.js`
(:5200). Checks: `node tools/test_morph.js` · `node tools/test_texture.js` ·
`node tools/model_bank.js --validate` · `node tools/texture_bank.js --validate`.
**Two agents share this tree — see Principle 7 before committing a shared file.**

## §3 Principles

*(Inherited from piece #3 — full text in its journal §3; they carry verbatim.)*

1. **Check Reaper input monitoring before blaming the instrument.**
2. **When a working reference exists, diff the files — don't iterate guesses.**
3. **Quiet tracks → suspect CC7 residue FIRST** (ISSUES.md I1): click CC7 Reset
   before touching gain staging. Wrong-sounding menu techniques → stale CC0 (I2),
   same button.

*(Added here, piece #4:)*

4. **Markers/labels belong in `objects`, never in the `markers` array.**
   `composer.html` loads `data.markers` into `Composer.markers` and saves it
   back, but `renderAll()` only iterates `this.objects` — so a label written to
   `markers` round-trips through save/load intact and is **never drawn**. The
   failure is silent in both directions: the file looks right, the tool report
   looks right, and only a human staring at the timeline notices. Five scores
   shipped this way (2026-08-16, all the DB3 arc + tonality files) and the
   composer found it, not a test. **Generalisation: any output whose only
   consumer is the composer's eye needs one check in the running app that the
   thing is actually on screen** — `AI_METHODOLOGY` rule 4 covers this, and this
   is what skipping it looks like.

5. **A check that shares a formula with the thing it checks is a MIRROR, not
   a test.** A morph note's `bend` is relative to its played key; both
   `toScoreObjects` and `morph_emit.js` added the residual a second time, so any
   note whose onset sat off its key sounded out by exactly that residual —
   **measured at 40.2 cents** on a stock M2 spectral render. It survived a whole
   day of work because `tools/morph_probe.js` computed its *expected* pitch with
   the same double-add, and so did the unit test. The day-10 result *"spectral
   targets land within 0.4 ¢"* was true — about the MIDI→audio chain — and could
   say nothing about the engine→MIDI step it appeared to bless.
   **Generalisation: where a convention is expressed in more than one place,
   assert the two ends AGAINST EACH OTHER, never each against a shared helper.**
   `test_morph.js` now pins `sounding cents === midi*100 + bend` in the engine,
   in the score object and in the emitted MIDI. *(2026-08-16, day 12; full
   write-up in `docs/NITS.md`.)*

6. **A GREEN SUITE IS EVIDENCE ONLY ONCE YOU HAVE SEEN IT GO RED.** 2x's texture
   engine passed **150 assertions on the first run** — and seed stepping was
   completely dead: the jitter PRNG used a hardcoded constant, so a RAIN texture
   rendered bit-identically at every seed, and R5's central identity-vs-draw
   question silently answered itself "same every time". No assertion covered it
   because none had been written to fail. **The fix is mutation testing: break
   the thing deliberately and confirm the suite notices.** Eight deliberate
   breakages (rounding, clamp headroom, D17 constants, lane blocks, seed stride,
   hocket order) were all caught; the two that were NOT caught were the useful
   ones — one was a genuine coverage gap (every corpus note sits at `level 7.5`,
   where several velocity scalings round to the same byte) and one was a **no-op
   mutation** (`toFixed(4)→(5)` on a grid whose values are already exact at 4 dp,
   proven over 200,000 values). **Generalisation: distinguishing "test gap" from
   "harmless mutation" requires measuring, not reasoning** — and a suite that has
   never failed is an untested test suite. *(2026-08-16, day 12, PLAN 2x.)*

7. **EXPLICIT-PATH STAGING PROTECTS OTHER FILES, NOT A SHARED ONE.**
   `git commit -- <path>` commits the **working-tree** content of that path, so a
   file two agents are editing in the same minute carries *both* edits into
   whoever commits first. Observed twice on `score/server.js` on day 12: 2y's
   `/api/actuals`, `/api/morphmodels` and `/api/actualplacement` routes landed
   inside 2x's Phase-1 commit (`4c1958e`), which had verified only that no
   *unexpected file* was staged. **Harmless here** — both halves were complete
   and everything worked — but two things follow. (a) A per-file "only my files"
   check is not sufficient; when a shared file is in play, read its diff before
   committing. (b) `git blame` on shared plumbing will attribute lines to the
   wrong plan, so trust the code and the plan docs over the commit that carries
   it. *(2026-08-16, day 12; noted from both sides.)*

## §4 Decisions

- **D1** *(2026-08-10)* — **Inherit piece #3's stack and protocols unchanged.** Score
  app + sandbox copied; #3's **D8** (saving: canonical committed score, explicit-save
  versions capped 20 gitignored, 5 s autosave) and **D9** (motive blocks = linked
  references into `sandbox/motives/`; unlink = fork; fixed per-instrument pitch axis;
  direct on-score editing) apply as written. *Why:* the protocols were designed
  piece-agnostic (engine vs. palette); seven tracks is palette data. Divergences get
  their own D-entries here.
- **D2** *(2026-08-10)* — **21 techniques > 16 channels → each tuba spans TWO UVI
  instances/ports** (`tubaN` = techniques 1–16 on A1–A16 · `tubaNb` = 17–21 on A1–A5;
  composer's build, session 1). Schema extension: a technique's optional `port`
  overrides the instrument port — senders resolve `tech.port || inst.port` (sandbox
  binding + score playback both patched). *Rejected:* UVI port-B via Reaper MIDI bus 2 —
  breaks the clean loopMIDI-port-per-instance wiring. *Slot order = composer's UVI
  screenshots 2026-08-10; keep it identical across all 7 tuba pairs.*
- **D3** *(2026-08-10)* — **Experiment MIDI renders the inferred PERFORMANCE of an
  animated curve, never the curve itself.** The curve is notation (D7 lineage);
  performers track it visually, so renders pass through a performer model (lag,
  smoothing, ~7-level dynamic resolution, eased onsets, anticipation, breath caps,
  per-player jitter — v0 parameters in CRESCENDO_EXPERIMENTS.md, tuned by ear).
  *Why:* curve-literal MIDI would optimize textures no ensemble can play; assessments
  must be of playable renderings. Curve-literal renders remain available as an A/B
  reference only. **Application timing (composer, 2026-08-10): the experiment phase
  runs STRAIGHT curve→sound (curve-literal) to build models first; the performer
  transform gets applied/tested at NOTATION time — "we'll see if the performance
  score curves need to be changed to produce the same sound effect." AI duty: resurface
  this before any performance-score notation is derived from experiment curves.**

- **D3** *(2026-08-10)* — **The mass-texture laws and species live in the research
  docs, with force of decision:** L1 scatter floors / L2 quota trends / L3 keeper
  anchor (CURVE_DATABASE.md) · Xenakis rules X1–X8 (XENAKIS_MASS_RULES.md) · the
  swell-cloud species with peak-cut-as-attack. Engines enforce L1/L2 by default;
  uniform stimuli require explicit override. *(Note: an earlier D3 re performer-model
  rendering also stands — see the experiments doc; renumber on next journal pass.)*

- **D4** *(2026-08-11)* — **Pass-2 outputs carry force of decision:** LAW L4
  (perceptual scale/bluntness, ×2.75 spacing) · RECIPE MAXDENSE-1 (DB 035) is THE
  starting point for max-density passages · keeper-excerpt practice ({score, seed,
  time-range, note}). Fine-tuning happens in-piece against a named target texture,
  not by reopening calibration. *Why:* five listen-cycles converged; the composer
  declared the two parameters well explored.

- **D5** *(2026-08-12)* — **Wrap-protocol divergence (piece #4 only):** at
  Session End, DO NOT ask "any lessons/gotchas to capture?" — the composer
  explicitly volunteers wrap additions; absence of them in the wrap directive
  means "no further input." (Supersedes SESSION_PROTOCOL.md step 2 for this
  piece; the protocol file itself lives read-only in piece #3.)

- **D6** *(2026-08-12, composer wrap addendum)* — **The reverse-engineering
  approach governs the piece phase:** do NOT pursue globally-well-behaved
  generators top-down. Construct the piece shape by shape, adapting the
  machinery PER SHAPE until each sounds as intended; the accumulated per-shape
  adaptations inform the machine ("more and more capable of reproducing a
  variety of sonic shapes"). AI duty: after each shape is approved, extract the
  GENERALIZABLE lesson (new dial? new mechanism? recipe variant?) into the
  docs — generalization is harvested from the shapes, not imposed on them.
  *(Extends P4's generate→tweak→reverse-analyze loop to the whole piece;
  the containers (2e) are the vehicle.)*

- **D9** *(2026-08-15)* — **ORD is the only real duration; the other articulations
  are fixed one-shots.** Measured probe over 80 notes: fortepiano (1.35–2.22 s),
  cuivre (0.99–1.35 s) and staccato (0.33–0.53 s) all end themselves, with the
  multisample sawtooth (length shrinks as transposition rises within a group, then
  jumps). Therefore an inserted note of those techniques takes its **true sample
  length** from `bank/sample_lengths.json`, and is **immune to group scaling** — it
  translates with the gesture but never stretches. *Why:* blocks were being drawn
  at 3.0 s while the sound died at ~1.7 s, so the notation was lying about the
  sound; and proportional scaling was shrinking cuivre for no acoustic reason.
  *Rejected:* one constant per articulation (the sawtooth is audible at the
  register extremes), and estimating instead of measuring (a 5-minute probe settled
  what an afternoon of guessing would not).
- **D10** *(2026-08-15)* — **The piece file is opened through a WORKING COPY.**
  Selecting a `piece-*` save diverts the session to `piece-sNN-work`; autosave
  writes there and the canonical file is never mutated. "Save as next" promotes to
  the next number; "Variant" saves lettered siblings. *Why:* the composer's actual
  workflow is "load the latest, work, save as new", but autosave was silently
  rewriting the file that was loaded — a mistake had no floor beneath it.
  *Rejected:* disabling autosave (loses work), and snapshot-on-load alone (safety
  would depend on remembering to act).
- **D11** *(2026-08-15)* — **The blast taxonomy's three tiers are fixed:** chord →
  **voicing** (pitch set ONLY) → **sonority** (voicing + per-note articulation +
  cuivre + length + dyn), with named custom lists as the section-level selection.
  **Cuivre is chord-level ARTICULATION** (brass colour), never a voicing change,
  and never records as a pitch-content edit. *Why:* the composer's model — "you
  hear the brassiness more than anything" — and it keeps voicings comparable
  across articulations. Manual thinning (to respect the 10-player limit) is stored
  as that voicing's cuivre *arrangement*, not as a new voicing.
- **D12** *(2026-08-16)* — **In the CLUSTER sandbox, loudness is carried by NOTE
  VELOCITY; CC7 is pinned full once per port and never touched.** *Why:* the
  composer's instrument — velocity is what the meter shows and what the keyboard
  sends, so the number being edited must be the number that sounds. *Rejected:*
  driving CC7 from velocity through the calibrated map (tried; it is what the
  composer score does, and it works there because the score pre-arms CC7 150 ms
  before the attack — but it made the sandbox's own dial an indirection the
  composer could not reason about). **CONTRADICTION LEFT OPEN:** the composer
  score still sonifies via CC7. If SI2 proves velocity-insensitive, sandbox
  dynamics will not carry into the score — settle with a one-pitch listening test
  (velocity 30 / 70 / 127) before relying on either.
- **D13** *(2026-08-16)* — **A transform never disables an interaction.**
  Transforms are a PREVIEW layer drawn over the stored notes, which stay grey,
  selectable and editable underneath. *Why:* two sessions were lost to "I can't
  select notes" — first a velocity change gating editing, then a live transform
  doing it; a modal rule that silently removes an affordance is worse than the
  confusion it was meant to prevent. *Rejected:* keeping the block but making the
  warning louder.
- **D14** *(2026-08-16)* — **One editable concept: LISTS + ITEMS.** An item is a
  stored gesture living in a list; load it, edit it (it autosaves back),
  duplicate for a variant, delete to remove — the standard preset model. *Why:*
  the composer's verdict on the snippet/gesture split was that it "just doesn't
  make sense"; two tiers with different persistence rules and a save-over /
  save-as-new pair needed explaining, and anything needing explaining is wrong
  here. *Rejected:* keeping snippets as a scratch tier (migrated into an
  `unsorted` list instead, losing nothing).

- **D15** *(2026-08-16)* — **A voicing is an IDENTITY; a cluster is a STATISTIC —
  so the cluster yields.** When an inserted blast and an existing cluster cannot
  both be played, the blast keeps its full pitch set (D11: the pitch set IS the
  sonority) and the cluster sheds notes (it is a cloud; losing 1 of 14 does not
  change what it is — the `thin` transform already does this on purpose). *Why:*
  the two materials are not symmetric, so a symmetric rule would damage whichever
  one it touched. *Applied only by the resolver's `auto` button — never
  automatically.* **Rejected:** dropping by recency (destroys voicings for no
  musical reason), and refusing the insert (the composer must be able to place
  what they hear and decide afterwards).
- **D16** *(2026-08-16)* — **Insert never refuses and never silently drops.**
  Every note lands, conflicts are marked on the lanes, and removal is a separate
  explicit act. *Why:* one code path instead of a "does it fit?" branch — the
  bug surface is what costs hours, not the code volume; and the composer always
  sees the complete sonority before choosing what dies. **Corollary:** the check
  runs on EVERY mutation, not at insert time — dragging a gesture would otherwise
  re-create conflicts that an insert-time-only check could never see.
- **D17** *(2026-08-16, corrected same day)* — **Playability conflicts are split
  HARD vs SOFT, and the split is load-bearing.** HARD = the intervals overlap:
  physics, cannot be wrong, cannot be tuned away. SOFT = the player is being asked
  to re-attack faster than they can: an ESTIMATE. *Why the split:* an estimate
  that turns out wrong can then only mis-tint something amber — it can never block
  work or force a decision.
  **SOFT is measured ATTACK-TO-ATTACK.** The first version measured the END-to-start
  gap, which was wrong: a fixed one-shot's length includes decay the player is not
  articulating through, so it demanded a rest after the sample had already finished.
  It flagged 167 spots in piece-s11 and 78 in dens8 that are entirely comfortable.
  Corrected constants come straight from **2j's tremolo table, which IS an attack
  rate** — half step 4.5 Hz = 0.111 s, fifth 3.0 Hz = 0.167 s — giving
  `minAttack 0.11 + 0.0093/semitone (cap 0.22)`, plus a 0.03 s tongue reset.
  Result: dens builds 78/86 → **0**; piece-s11 167 → **42**, all of them real.
  *Still estimates pending the composer's ear, same status as 2j itself.*

- **D18** *(2026-08-16)* — **`docs/AI_METHODOLOGY.md` is the governing working
  instruction, and it outranks the inherited preference docs.** Fix what blocks
  the piece, flag the rest to `docs/NITS.md` · never put minutiae to the composer
  (surface a decision only when it changes the musical result AND only they can
  answer it) · prefer one large robust build over a small fragile one, because
  **code volume is not the constraint — broken code and composer attention are** ·
  **a confidence claim must be verified in the running app, because the composer
  plans around it** · no clear evidence means no diagnosis, flag it instead.
  *Why:* the previous session lost hours to small bugs, and this one lost composer
  time to a four-option design menu about things that did not matter. *Rejected:*
  time estimates of any kind — they have been wrong in both directions, so
  confidence and residual risk are reported instead.

- **D19** *(2026-08-16)* — **A played take is packed to the PLAYABLE CEILING, not
  thinned by a guessed amount.** For each note in time order: free player → place
  it · none → nudge to the earliest opening within a small budget · budget blown
  → accept a tight-but-legal spot · nothing fits → delete. **Deletion is the last
  resort by construction**, so density automatically rides the ceiling (10 players
  ÷ 0.45 s one-shot ≈ 22 attacks/s) and never exceeds it. *Why:* the composer's
  model — *"nudge first, maintain max density, and then delete"* — and it is one
  convergent pass instead of an iterate-and-check loop. *Rejected:* the
  prune-simultaneities-then-space-attacks pair I proposed first; measured on DB3
  it kept 127 notes and still left 1 hard + 1 soft, against pack-to-ceiling's 160
  notes and 0/0. **Corollary the measurement settled:** nudging does NOT retain
  density (60 ms → 400 ms of budget buys 8 notes — at saturation a shifted note
  walks into the next collision, exactly as the composer predicted). What the
  small budget buys is **cleanliness: 37 soft flags → 0** for a mean 35 ms move.
  Playbook: `docs/DENSITY_PIPELINE.md`; PLAN 2t.
- **D20** *(2026-08-16)* — **Player assignment is LEAP-AWARE; the jump moves
  between players rather than being asked of one.** `assignCluster`'s tie-break
  was pitch-blind (tier → least-recently-used → lane index), so a single player
  could be handed a 26-semitone jump in 0.35 s while another sat in the same
  register, and no part had a tessitura. The leap term competes with LRU and
  **can never outrank the tier**, so a wide-open player still beats a
  close-pitched busy one — it only chooses between equally legal lanes. Measured
  on DB3's 251-note take: mean leap 7.9 → 3.1 st · octave-plus leaps 58 → 11 ·
  part span 29 → 23 st · **hard conflicts 154 → 135** (pitch-clustered lanes pack
  better). *Why it matters beyond tidiness:* it is the only real fix for a soft
  RATE flag — nudging in time cannot help because the line is still as fast
  (2r's "move to another player", now applied at assignment so there is nothing
  left to resolve). *Verified in the running app*, matching the tool exactly.
- **D21** *(2026-08-16)* — **A simultaneity clump in a played take is an ACCIDENT
  of hand-slapping, not a chord — so it is spread and thinned by registral
  spread, not by voice-leading.** Composer: *"in the densest areas, I'm just
  hitting all my hands on all the keys… some of those attacks are mistaken chords
  rather than just a flurry of attacks."* Survival order within a clump
  (`--pick spread`): top, bottom, then farthest-from-everything-kept. *Why:* the
  extremes preserve the band's registral WIDTH as its thickness drops — what you
  actually hear in a cluster mass — and the max-min fill stops the middle
  hollowing out over consecutive clumps. *Rejected as defaults but kept as flags:*
  seeded `random` and raw-MIDI `arrival`; the composer explicitly declined to
  audition variants for now.

- **D22** *(2026-08-16)* — **Articulation is an ARC, not a ramp.** Fortepiano is a
  swell of its own that peaks *just before* the density takes off and is gone by
  the apex. Measured off the two density builds already in the piece: DB1 and DB2
  both land at **~21 % fp overall**, with 14–33 % / 0–25 % early, a **peak of
  55–70 % at 12–20 s**, then thinning to 0 at the apex. *(This is also where the
  composer's remembered "seventy, thirty" comes from — DB2 hits 70 % at 12–16 s.
  Never a global ratio, the top of this arc.)* *Why:* the first version ramped
  P(staccato) 0→1 from an all-fortepiano opening, which put every fp in the
  sparsest bars where it reads as an isolated event rather than a colour in a
  mix — composer: *"it felt like I didn't hear it."* **The roll only proposes and
  physics disposes:** fp is a FIXED 1.35–2.22 s one-shot (D9), so conversion
  replaces a 0.45 s staccato with a note 3–5× longer; room here → room elsewhere
  (leap-aware) → it stays staccato, reported. Zero new conflicts by construction.
  *Consequence worth carrying:* **DB3 cannot reach 21 %** — its sparse region is
  ~11 s of a 23.5 s build, so the physics ceiling is 18 notes (11 %).
  `tools/artic_pass.js`, superseding the D9-obsolete `tools/transform_fp.js`.
- **D23** *(2026-08-16)* — **A finished density build enters the piece by
  PLACEMENT SCRIPT, not through the Insertion strip.** The strip's two sources
  store a pitch set (blasts) or a `{t,p,v,d,tech}` event stream (clusters);
  **neither has a field for `layer`, `envShape`, `nodes` or `segments`**, so a
  round trip flattens every hand-shaped surge back into a block. Copy
  `tools/piece_s08.js`: offset the notes, copy the objects wholesale, one
  `groupId` plus its META shape, then re-audit. *Why not build UI:* you insert a
  density build once, and the sandbox principle is UI for hammered loops, prompts
  for one-offs. A third strip source ("Gestures", carrying whole orchestrated
  objects) earns its build when several builds need placing and re-placing —
  not before. Full write-up: `docs/DENSITY_PIPELINE.md` §6.

- **D24** *(2026-08-16)* — **LOUDNESS IS A LAYER ON EVERY MORPH MODEL, not one
  model of six.** Composer: *"centre volume changes more prominently — we
  undersold that earlier."* Every render carries a per-voice dynamic contour
  (`dyn {base, shape, amount, turns, spread}`, shape ∈ swell/rise/fall/rotate/
  flat), so a pitch morph also swells unless `flat` turns it off. **M6 is
  therefore the volume-ONLY model** — it holds pitch and technique and defaults
  the layer to `rotate`. *Why it matters beyond the feature:* morph dynamics now
  take the identical calibrated path as every hand-drawn crescendo in the piece,
  so a hairpin inside a morph sounds like a hairpin in the piece. *Rejected:*
  leaving volume as one selectable model (the composer's whole point was that it
  is not one option among six but a dimension of all of them).
- **D25** *(2026-08-16)* — **A morph note is an ORDINARY score `waveCurve` plus
  one new field, `morphBend`** — not a new object type and not a new `env`
  structure, which is what the plan's schema specified. Level envelopes already
  exist in this app as `nodes`/`segments`, and the engine emits level in the
  score's own 0–10 unit rather than absolute CC7 because the CC7 law is a
  MEASURED map loaded at runtime (`probes/cc7_map.json`) — emitting the law's
  INPUT keeps that calibration in exactly one place. *Consequence:* existing code
  already draws, plays, drags and group-scales morph notes, so "envelopes survive
  a drag" came free from debugged machinery instead of new code. Verified in
  Phase 4. *Rejected:* the plan's `env: {bend, cc7}` — it would have forked the
  CC7 calibration, which the same plan forbids, and it contradicted the engine's
  own purity rule (a pure engine cannot fetch the map).
- **D26** *(2026-08-16)* — **The patch's ±2 semitone bend limit is an
  implementation detail, not a musical constraint.** A wider move is SPLIT into
  consecutive re-keyed notes (bend to the edge, re-key, continue, contiguous so
  the player slurs across a fingering change). Measured: fan waypoints land within
  1.0 ¢ *including both seams*, and the composer reports **no audible seam** on a
  continuous re-keyed glissando. *So a fan may be as wide as the music wants.*
  *Caveat kept:* one leg, one register, one rate — a very fast or very low re-key
  is unprobed. *Rejected:* flagging wide fans as unplayable (correct but useless),
  and hiding the seam under a dynamic dip (unnecessary — nothing to hide).

- **D27** *(2026-08-16, PLAN 2j)* — **ARTICULATION DECIDES WHETHER PHASE IS A
  DEVICE AT ALL.** Two families, and they do not behave alike. **Articulated
  (staccato):** phase relationships between attacks read as RHYTHM — the axis is
  regular↔irregular and the composer's names for it are **smear · ticks · rain ·
  gallop · groove**. **Smeared (ord, flz, fp-under-overlap):** ten voices blur
  into a wash and **timing-phase does nothing at any rate or spread**, because
  each attack is masked by nine tones already sounding — composer: *"everything
  sounds continuous, no swells at all."* *Why it is a decision and not a note:*
  it closes a whole search direction. Do not re-litigate timing-based swelling in
  a sustained texture. *Evidence:* `phase08`–`phase11`; the negative was
  predicted by measurement (sounding-note count never left 8–10) before it was
  heard. *Corollaries kept:* **ord masks staccato** at equal dynamic, so "attacks
  on a bed" needs dynamic or registral separation; and **fortepiano under overlap
  loses its piano tail**, reading as attack-only — a usable colour, found not
  designed.

- **D28** *(2026-08-16, PLAN 2j)* — **MODULATION IN A SUSTAINED TEXTURE COMES
  FROM PITCH, AND IT IS CALCULABLE.** `beat rate (Hz) = |f1 − f2|`;
  `cents = 1200·log₂(1 + beat/f)`. Verified by ear: asked 1 beat/sec, heard
  *"beats ~1hz"*. **Below ~1 Hz it reads as FLANGER** — correct acoustics, since
  partial *n* beats at *n·Δf*, so the fundamental crawls while the upper partials
  shimmer — **and above ~1 Hz as BEATING**; one bend ramp morphs between them.
  **THE REGISTER LAW (measured by decoding the MIDI): a fixed cents detuning
  doubles its beat rate per octave** — 13.19 ¢ gives 0.50 / 1.00 / 2.00 Hz at
  C2 / C3 / C4. *Consequence:* detuning a chord by a constant amount
  **stratifies** it (top shimmers, bottom crawls); a uniform beat rate needs
  different cents per register. *Why it matters beyond this arc:* it is also the
  **performability answer** — a player cannot hit "+13 ¢", but beating is
  **self-correcting by ear**, so *"beat about twice a second"* is a real
  instruction. Pitch beating is MORE performable than the timing version.

- **D29** *(2026-08-16, PLAN 2j — **CONFIRMED by the composer day 11**)* —
  **SCOPE SPLIT:
  2v OWNS EVERYTHING BEND-BASED; THE TEXTURE SANDBOX OWNS ATTACK FIELDS.** 2v
  already has sustained rendering, bend, pitch sets, dynamics contours, the
  params-file loop and an insert path — and its **M1 "detune bloom" is exactly
  the pitch beating above**, while **M3 "fan"** is `phase13`'s fanned detuning.
  So the new sandbox should own **density · scatter · jitter · spread · voices ·
  articulation** and *layer with* 2v rather than duplicate it; pitch beating
  enters as a requirement ON 2v (beat rate in Hz as the dial, plus the register
  law). *Why:* otherwise the same engine gets built twice, in two places, with
  two sets of bugs — and the deadline is Sept 4. **CONFIRMED by the composer
  2026-08-16 (day 11), so it is now binding on both projects:** the 2x plan
  builds attack fields with **no bend anywhere**, and pitch beating enters 2v
  as a requirement on M1/M3 (beat rate in **Hz** as the dial rather than raw
  cents, plus the register law — a fixed cents detuning doubles its beat rate
  per octave). *Nothing musical is given up: the two outputs layer freely in
  the score — attack fields over a beating bed.* *Rejected:* letting the
  sandbox own beating too (duplicates 2v's debugged bend/emit machinery, and
  app playback cannot carry bend, so that audition loop would degrade to
  MIDI-only).

- **D30** *(2026-08-16)* — **PUSH IS AUTOMATIC AFTER EACH COMMIT.** Supersedes
  "never push without asking" for this project. Each agent stages **explicit
  paths only** (never `git add -A`, which would sweep the other's half-finished
  work) and pushes its own commit; a push carries both agents' commits, which is
  harmless as long as every commit is complete. *Why:* with two agents in one
  working tree the composer was left tracking who owed a push; the rule removes
  that bookkeeping without adding risk. *Recorded in `CLAUDE.md` and in
  `docs/RUNNING_LOG.md`'s working rules.*

- **D31** *(2026-08-16, day 12 — composer)* — **GESTURE SHAPES ARE BUILT
  BESPOKE, ONE MORPH AT A TIME; the engine is not fixed now.** After hearing
  2z's generic shape battery: *"Those aren't really working as auditory models,
  as sound models, but that's okay… So it's correct as an engine."* The
  mechanisms are individually correct and tested; what failed is the mapping
  from a mechanism to a sound — the dials are right, the preset SETTINGS were
  guesses. So: pick a morph, build a shape for it by ear until that gesture
  sounds right, save it, use it in the score, and **harvest the lesson**
  (`docs/SHAPE_LESSONS.md`, one section per shape, the "what was wrong" line
  being the valuable one). When enough lessons accumulate, the engine gets
  revisited — from evidence, with time, not now. *Why:* the composer needs
  morphs in the score against a Sept 4 deadline, and a top-down preset is the
  wrong UNIT — the unit is a specific gesture tuned by ear. *This is D6's
  reverse-engineering principle applied to shaping.* **Deliberately NOT
  diagnosed** (AI_METHODOLOGY rule 5): we do not yet know *which* aspect failed
  — timing, gain range against the D24 layer already swelling underneath, window
  lengths, or mechanisms that simply do not carry at ensemble scale. The bespoke
  builds ARE the evidence-gathering.

- **D32** *(2026-08-16, day 12 — PLAN 2y)* — **A RECIPE DIAL IS OFF UNTIL IT IS
  TURNED.** A recipe absent from `settings` is not applied; `resolveParams`
  returns the base params untouched, and the panel's sliders carry an explicit
  on/off. *Why it is load-bearing and not a preference:* 2y's own worked example
  has *"more dramatic"* defaulting to 0.35 over a base whose `depth` is 1, so a
  panel that applied defaults on open would have silently rewritten material the
  composer had blessed **the moment they looked at a model**. It also makes
  `recipeSettings` in an actual's provenance mean exactly "what was turned",
  which is what makes an actual re-derivable. *Rejected:* seeding each dial's
  default to the value that reproduces the base (only works for single-path
  recipes, and hides the question instead of answering it).
  **Corollary — an ACTUAL is a render the composer DECIDED**, so the shelf ships
  empty: seeding it with renders nobody listened to is the same failure the MA1
  boundary gate exists to prevent.
- **D33** *(2026-08-16, day 12 — PLAN 2x)* — **TEXTURE ACTUALS LIVE IN A PARALLEL
  STORE, `bank/texture_actuals/`, not in 2y's `bank/actuals/`.** The 2x plan
  (§12, §15.9) expected to share that directory under distinct `ACT-` prefixes.
  *Why that turned out to be unsafe:* 2y's `tools/model_bank.js --validate` walks
  **every** file in `bank/actuals/` and requires each one to (a) name a model
  present in `bank/morph_models.json` and (b) satisfy
  `Morph.toScoreObjects(notes) === objects`. Both are morph-shaped **by design** —
  that integrity check is the whole point of their store. A texture actual
  satisfies neither, so filing one there would have turned a shipped, currently
  `VALID` tool red over a file it was never written to describe. Parallel stores
  are also exactly what §15.9 already requires for the model stores themselves
  (`texture_models.json` vs `morph_models.json`), so this is the same rule applied
  one level down. The schema mirrors 2y's key-for-key wherever a key means the
  same thing, so the two can be merged later by whoever decides they should be.
  *Rejected:* (1) teaching 2y's validator to skip foreign actuals — it is their
  file and it was being actively edited; (2) giving texture actuals a fake
  morph-shaped `notes` array to satisfy the integrity check — that check would
  then be asserting nothing, which is worse than not running it.
  **Corollary:** `notes` is deliberately ABSENT from the texture ACTUAL schema. A
  morph actual stores it because audition plays envelopes the score objects do not
  carry; a texture note **is** the score note (D29 — no bend, no envelope), so a
  second array could only ever drift from the first. Reasoning is recorded in
  `bank/texture_actuals/README.md`, a test asserts 2x never writes a 2y path, and
  2y's validator was re-run after every write and stayed `VALID`.

- **D34** *(2026-08-17, day 13 — composer)* — **NOTES ARE WRITTEN AS THE WORK
  HAPPENS, FOR TWO READERS: the next cold session, and the paper.** Composer:
  *"I am clearing the chat window often… but also, more specifically, for a
  paper. So collecting journal and experimental notes — so when we sit down to
  write the paper, we have the process documented."* This is a **standing
  instruction, never re-asked**: the AI files at the moment of the verdict or
  the measurement, not at a wrap, and captures quotable composer verdicts
  **verbatim before starting the next render**. *Why it is a decision and not a
  preference:* an unrecorded listening verdict cannot be re-run — the ear that
  produced it has moved on — so the loss is permanent, not deferred. **Filing
  contract (one destination each, no double-drafting):** RUNNING_LOG = the raw
  chronological trail · COMPOSER_LOG = verbatim words · SHAPE_LESSONS = one
  bespoke shape end to end · PAPER_NOTES = the distilled argument, entered only
  once a finding supports a claim · MORPH_FINDINGS = measured morph facts ·
  §4 here = decisions · NITS = real-but-not-now. Written into
  `docs/AI_METHODOLOGY.md` ("Capture as you go") with a fifth item added to its
  self-check. *(Filed as D33 first; renumbered to D34 at session end — the
  concurrent 2x session had already taken D33 for the texture actuals store.)* *Rejected:* a single combined notes file (the raw trail and the
  argument have different readers and different lifetimes — merging them makes
  the trail unciteable and the argument unreadable).

- **D35** *(2026-08-17, day 13 — composer)* — **THE AI DOES NOT IMPLEMENT
  ANYTHING WITHOUT AN EXPLICIT GO.** Composer: *"please check in with me before
  implementing anything or wait for me to ask you explicitly to implement."*
  Proposals, specs and measurements: yes, freely. Edits to code: only on a
  direct instruction. *Why it was needed:* this is a **restoration**, not a new
  rule — `HOW_WE_WORK.md` already said "conceptual proposal before any code
  edit", and over one morning it had eroded into fix-it-as-you-see-it, which is
  how a session about composing became a session about the panel. The companion
  practice is `docs/FEATURE_REQUESTS.md`: requests are collected and spec'd for a
  batch pass rather than built as they arise.

- **D36** *(2026-08-17, day 13 — PLAN 2q, PARTIALLY SETTLED, see the caveat)* —
  **CC7 ALONE DOES NOT GOVERN LOUDNESS ON SI2: NOTE-ON VELOCITY CONTRIBUTES.**
  Evidence: with the engine made to open a fade at level 0 → **CC7 = 0**, the
  composer still heard an attack. If CC7 alone governed loudness, CC7 = 0 would
  be silence. Consistent with **D12**, which chose velocity in the cluster
  sandbox because *"velocity is what the meter shows"*. Consequence wired in: a
  note opening below the engine's 0.4 level floor — which happens only inside an
  attack window — takes a proportionally softer velocity, floored at 1.
  **⚠ THE CAVEAT IS LOAD-BEARING AND THE COMPOSER DISPUTES THE DIAGNOSIS:** they
  report that playing four or eight ordinario notes from a keyboard produces **no
  attack at all**, which the velocity story does not explain. **So the blip is
  NOT diagnosed** (AI_METHODOLOGY rule 5) — what is established is only the
  negative, that CC7 = 0 is not silence. The positive cause is open, most likely
  somewhere in the generated-MIDI → Reaper → UVI chain rather than in the engine.
  See §6 and `docs/NITS.md`.
  **ADDENDUM (2026-08-17, day 14 — blip RESOLVED, and it dissolves this
  decision's evidence.** The blip was CC7 **timing**: the opening CC7 = 0 had
  only ~2–5 ms of real lead, so a sampler that smooths CC7 still had the channel
  near the stop()-restored 127 when the note spoke. Fix (250 ms cold-attack
  lead + CC7 restore delayed 2 s past the tail) → composer: *"Blip gone."*
  Consequence for D36: "an attack at CC7 = 0" is explained **without** velocity
  governing loudness — the channel was not actually at 0 yet — so the inference
  "velocity contributes on SI2" is **unsupported again**, not disproven. D12's
  cluster-sandbox evidence stands separately; **PLAN 2q's one-pitch listening
  test (velocity 30/70/127) is still the decider.** The emit layer's velocity
  scaling inside attack windows stays — harmless either way. See
  `MORPH_FINDINGS.md` "The CC7 timing law".)*

## §5 Done

- 2026-08-10 — 0a stack seed.
- 2026-08-10 — Gain staging calibrated; CC7 law measured; cresc lengths DB.
- 2026-08-10 — Crescendo research arc: laws, Xenakis rules, swell-cloud species;
  **SC4 dense hold approved (provisional)**.
- 2026-08-11 — 10-part expansion + UI batch + Roads catalog + engine framework.
- 2026-08-11 — **Pass 2 complete**: L4 carved, MAXDENSE-1 recipe adopted (DB 035),
  finding 14; five live calibration cycles (OC, DH1–DH5).
- 2026-08-16 — **PLAN 2r playability/collision avoidance shipped**: occupancy
  model, HARD/SOFT tiers, conflict-aware insertion for blasts and clusters, live
  lane wash, and the resolver (move to another player / drop / nudge / auto).
- 2026-08-16 — **PLAN 2s back-audit**: all 164 scores checked; every piece file and
  density build clean of hard conflicts. `tools/audit_playability.js`.
- 2026-08-16 — **`docs/AI_METHODOLOGY.md`** adopted as the governing working
  instruction (D18).
- 2026-08-16/17 — **PLAN 2x TEXTURE SANDBOX shipped, phases 0–4.** Pure engine
  extracted from the 2j generator with a **byte-identity gate on nine committed
  research scores** · `Texture` panel (five category MODELS, seeds, PIN/A-B,
  humanize, live badge, insert) · pitch layer with `tonality.js` extracted from
  clusterview (**400/400 randomised equivalence**) · breakpoint curves and
  category morphs whose endpoints match the static models within 1 % · parametric
  and literal pockets · `texture_bank.js` + `place_texture.js` with
  mutation-tested provenance integrity and a robustness gate that has no
  `--force`. **317 assertions.** Measured finding: the 23/s density ceiling is
  C3-specific and falls to ~19–21/s under any real pitch set.
  **Unheard — the listening slate in §6 is the remaining scope.**
- 2026-08-16 — **PLAN 2t DENSITY PIPELINE shipped** (D19–D23): pack-to-ceiling
  (`tools/pack_take.js`), leap-aware `assignCluster`, the fortepiano arc
  (`tools/artic_pass.js`), version arcs (`tools/build_versions.js`), tonality
  variants (`tools/tonality_variants.js`), part-by-part report
  (`audit_playability.js --parts`), playbook `docs/DENSITY_PIPELINE.md`.
  DB3: 251 → 160 notes, **HARD 0 / soft 0**, verified in the app.
- 2026-08-16 — **`docs/PAPER_NOTES.md` DB3 case study** — one gesture end to end
  with the measurement that forced each stage; the paper's worked example.
- 2026-08-16 — **PLAN 2u spec'd** (tonality sub-menu) — not built; the remap
  engine already exists in the cluster sandbox.
- 2026-08-16 — **PLAN 2w GESTURE BANK + RECALL** — `bank_gesture.js` /
  `place_gesture.js`: capture a finished orchestrated gesture by name, recall it
  into any score. The second insertion path, for material the strip cannot carry.
  DB3 placed into the piece as **piece-s16** (Messiaen mode 3 on F).
- 2026-08-16 — **PLAN 2v MORPHING CHORDS COMPLETE** (D24–D26). Probes (bend
  works ±1.99 st, residue trap real, quartertones patch not a uniform quarter
  tone) · pure engine `score/public/morph.js` with six models, breath/striation
  carrier, universal dynamics layer, and **101 unit tests** · emit layer with
  registry-driven panic · the **Morph panel** (generates, auditions, inserts,
  never edits) · segmented re-key for wide glissandi · recipes banked with their
  dial boundaries. **Measured: spectral targets within 0.4 ¢, fan waypoints
  within 1.0 ¢ including seams.** Five of six models produced material the
  composer called interesting or better; three are keepers.

- 2026-08-16 — **PLANS 2z + 2y drafted and APPROVED** (day 11): GESTURE
  SHAPING v2 (`docs/plans/GESTURE_SHAPING.md` — gesture-level ADSR, multilayer
  attack, release-as-subset, motion) and MODEL ↔ ACTUAL
  (`docs/plans/MODEL_AND_ACTUAL_PLAN.md` — model store, one-dial recipes,
  actuals with provenance + placements, shape presets). Order: 2z then 2y,
  never concurrent. 2x ID collision resolved (gesture shaping → 2z).

- 2026-08-16 (day 11) — **PLAN 2x TEXTURE SANDBOX plan approved** —
  `docs/plans/TEXTURE_SANDBOX_PLAN.md` v3, handoff-hardened, kickoff prompt in
  §16. **D29 confirmed** (attack fields only, no bend). Qualitative/recipe
  interface · Texture panel in the composer score · no editor · panel loop +
  long-render pockets · 2y-aligned MODEL/ACTUAL stores · seeds + PIN/A-B +
  humanize, with a robustness verdict required before banking.
- 2026-08-16 — **PLAN 2j PHASE-SHIFTING RESEARCH ARC complete** (D27–D29):
  13 experiments `phase01`…`phase13`; the two-family model; the dials
  (density · scatter · jitter · spread) with measured ranges; the density and
  stage-width ceilings; **pitch beating verified predictive** and the register
  law measured. Write-up `docs/PHASE_SHIFTING.md`, hand-off
  `docs/plans/PHASE_SANDBOX_REQUIREMENTS.md`, generators `tools/phase_shift.js`
  + `tools/pitch_beat.js` + `tools/midi_out.js` (SMF writer with pitch bend).

- 2026-08-16 — **PLAN 2z GESTURE SHAPING COMPLETE** (day 12, gates G0–G5).
  Gesture-level ADSR gain over the D24 layer · entry/exit scheduling with
  cluster-safe dropout (beating thins by whole pairs) · edge technique,
  transient (hit-THEN-tone by D9 physics) and noise layer on spare lanes ·
  motion with **zero at each window's inner edge by construction** · Shape panel
  group. **331 assertions** (from 101); twelve G0 fixtures keep the blessed
  material byte-identical. App round-trip verified on shaped material.
  `docs/plans/GESTURE_SHAPING.md` §15 records where the code corrected the plan.
- 2026-08-16 — **A MEASURED 40.2-CENT PITCH ERROR IN THE MORPH OUTPUT, FIXED**
  in all four places that carried the wrong formula (engine conversion, emit
  layer, probe, unit test). Pre-existing since 2v. See Principle 5.
- 2026-08-16 — **PLAN 2y MODEL ↔ ACTUAL: MA0–MA3 COMPLETE** (D32). Model store
  seeded from the frozen day-10 audit record · `tools/model_bank.js` validator
  written FIRST and negative-tested against eight defects · recipe engine
  (endpoints + interpolation, only numbers lerp) · one shared save path for the
  CLI and the panel · `/api/actuals` routes · panel with MODELS / scratch /
  ACTUALs, bounded recipe sliders, seed stepper, Save as ACTUAL and a browser.
  Full loop verified in the running app. **MA4 (the composer's naming/blessing
  session) is the only gate outstanding.**

## §6 Human Notes

- *(2026-08-12)* **Try PLAYING some of the shapes** — as another way to collect
  data models (performed shapes = ground truth for D6's harvest; ties to D3's
  performer-model question; the Stereo-Mix capture path from the probes could
  record it).  **DONE 2026-08-13/14** — A1-5, A2-hp-whole,
  cluster_samples_01, clusterClouds02 and vertical_shapes_01 were all played in
  and banked; the play-in pipeline (2f) runs on them.
- *(2026-08-15)* **Composer break taken mid-session** — piece-s09 is the live
  state; nothing is half-written.  **CLOSED 2026-08-16** — piece-s09 untouched
  since; the day went to the cluster sandbox.
- *(2026-08-16)* **Budget:** Max 5× plan; extra credits bill near API rates, so
  topping up buys far less than the subscription per dollar. The lever is session
  hygiene, not spend — see `docs/SESSION_HYGIENE.md`.
- *(2026-08-16)* **One listening test owed** (PLAN 2q): does SI2 tuba respond to
  note velocity, to CC7, or both? Everything downstream of dynamics depends on
  the answer. **Narrowed 2026-08-16:** it does NOT block insertion — inserted
  blast/cluster notes already play at the recorded velocity with CC7 pinned full
  (`sonifyMode:'plain'`), matching D12. It still matters for the drawn crescendo
  material, which follows CC7.
- *(2026-08-16)* **Methodology set by the composer** → `docs/AI_METHODOLOGY.md`
  (D18). The composer will append their own prompt text to that file.
- *(2026-08-16)* **Deferred by the composer, not to be raised again unprompted:**
  the META shape overhang (NITS) and the amber soft flags in the piece — both
  wait until they actually get in the way.
- *(2026-08-16, day 9)* **Listening owed on DB3 — the whole session is unheard.**
  `densBld03-arc-v2` (5 stages, 122.8 s) and `densBld03-tonalities` (9 harmonies,
  224 s). Then the grain pass in section E, then the apex decision. **This is the
  first thing next session.**
- *(2026-08-16, day 9)* **The apex question, restated because it recurs:** the
  packed build is limited by the SAMPLE's ring time, not by tuba technique — the
  probe measured "Sounded (s)", decay and room included, and D17 already made
  that correction for SOFT but not for HARD. The apex exceeds ten players under
  any assumption (44 hard even at a 0.11 s floor), but the thinning amount is
  model-dependent, ~30 to 91 notes. In NITS; needs a real player's articulation
  rate, same evidence 2j and 2q are waiting on.

- *(2026-08-16, day 10 — 2j; updated day 11)* **Two calls owed** → resolved as:
  (1) `phase13-beatfield` listen **DEFERRED by the composer (day 11) — not
  blocking 2x**; hear whenever; the verdicts (upper beating boundary, register
  law by ear) feed 2v's dial boundaries / MORPH_FINDINGS, so it is not to be
  raised again unprompted. (2) **D29 (2j/2v scope split): CONFIRMED by the
  composer day 11 and held throughout the 2x build** — 2v owns everything
  bend-based including pitch beating; 2x is attack fields only, and a test
  asserts no bend field appears anywhere in its output. **Closed.**
- *(2026-08-16, day 10 — 2j)* **Push policy changed (D30):** either agent pushes
  automatically after its own commit, staging explicit paths only. You should no
  longer have to track who owes a push. **Day-12 note on how that actually
  played out:** the other agent staged `score/server.js` while a 2y edit of mine
  was in flight, so my `/api/actuals` routes landed inside *their* commit
  (`4c1958e`). Harmless — the commit is complete and everything works — but
  explicit-path staging does not protect a file two agents are editing at the
  same minute. Nothing to fix; worth knowing when reading git blame.

- *(2026-08-16/17, day 12 — PLAN 2x)* **THE TEXTURE LISTENING SLATE IS YOURS, and
  it is the entire remaining scope of 2x.** Nothing in this build has been heard
  by anyone — Web MIDI is denied in the preview pane, so every claim in the plan
  doc is a *data* claim. `node score/server.js` → `Texture` button, beside Morph.
  In the order I would do it:
  1. **SMEAR vs RAIN vs GALLOP** — are the three distinct by ear? Quick, and it
     validates the whole vocabulary the recipes are built on.
  2. **`H` on SMEAR, then `H` on RAIN** — the humanize A/B. This is the
     fragile/robust prediction's **first real data point** in the whole arc
     (stage ±15 ms fixed + human ±25 ms per attack, both ESTIMATES). Prediction on
     record: rain survives, smear converts into rain for free.
  3. **Pitch** — which set is the keeper, and does pitch dissolve the accent
     artefacts (E5's expectation)? Note the measured surprise first: the ceiling
     you calibrated at unison C3 drops ~18 % under any real set.
  4. **`node tools/phase_shift.js --process dissolve`** — does `rain → stutter`
     still SNAP? phase06 heard it; a metric can show a discontinuity but not
     whether the ear jumps.
  5. **`--process crossover`** — where does a groove stop being parseable and
     become texture? §5's open question; the answer goes back into
     `bank/texture_models.json` as data and updates TICKS/GROOVE.
  Each verdict has a slot waiting for it — `tools/texture_bank.js --bank <NAME>
  --from <variant> --survives yes|no --note "..."`. **Until then all five models
  read `UNHEARD` and refuse to be banked as keepers.** Nothing needs rebuilding
  to record one.
- *(2026-08-16, day 12)* **MA4 is yours, and it is the only gate left on 2y.**
  (1) Rename the six placeholder model ids — cheap now, expensive once actuals
  reference them. (2) Bless or edit the recipe slates and their boundaries.
  (3) Make the first real actuals and place them. `node tools/model_bank.js
  --list` shows the store; the panel's MODELS tab is the loop.
- *(2026-08-16, day 12)* **Re-hear the six models before you name them.** They
  were auditioned on day 10 through two bugs since fixed — pitch out by up to
  40.2 ¢ on off-key onsets, and the panel feeding one variant's dials to
  another. The material is good and you liked it; what was unreliable was any
  **comparison between them**. Each model carries this note in its `notes` field.
- *(2026-08-16, day 12)* **The ACTUALs "hear" button has never made a sound.**
  Its data path is verified — the emit layer gets the stored notes
  byte-identical, every note resolves to a lane, envelopes intact — but Web MIDI
  is denied in the preview pane, so it needs one press in your own browser.
- *(2026-08-17, day 13)* **THE BLIP IS YOURS TO CALL, and it is not diagnosed.**
  Three real engine causes were found and fixed (opening CC7 went 24 → 0, CC7 now
  has lead at t=0, velocity scales inside an attack). It persists, quieter. Your
  counter-evidence — a keyboard-played chord has **no** attack — is not explained
  by any of them, and my diagnosis was not reliable enough to act on. Full
  write-up and the next places to look are in `docs/NITS.md`; **the one control
  nobody has run is a generated `.mid` played in Reaper against the same notes
  played live**, which separates the chain from the engine in a single test.
- *(2026-08-17, day 13)* **To hear the attack without the blip:** the
  recommendation on the table when the session ended was to render several fade
  lengths **end to end into one `.mid`** (via the existing `tools/midi_out.js`)
  and audition them in Reaper. Not built — say the word.
- *(2026-08-17, day 13)* **`ACT-BLOOM-01` is stale.** It was saved a moment before
  the reload that carried the save fix, so it kept your sliders
  (`slower / longer 0.76`, `more dramatic 0.55`, seed 11, pace 48) but not the
  duration, the release or the attack. Re-save as `-02` and delete it; the model
  file's `actuals` list references it too.
- *(2026-08-17, day 13)* **Penn State is 15 minutes maximum** — recorded from your
  reading of the call. With 3–5 morph objects planned, a 5-minute one is a third
  of the piece; worth deciding their lengths against the whole before building
  more.
- *(2026-08-16, day 12)* **The bespoke-shaping loop starts whenever you want it**
  (D31): pick a morph, describe the shape in your words, AI writes the `shape`
  block, you listen, we correct, AI files the lesson to
  `docs/SHAPE_LESSONS.md`. The "what was wrong" line is the one that matters —
  a shape that works first time teaches nothing.
