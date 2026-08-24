# PROJECT PLANNER — for seven tubas

> **What this is** (composer, 2026-08-14): the working view of the piece as a
> **collapsible outline / sieve**. Tiers: SECTION → container (DB/INT) →
> gesture/task → decisions. Every tier carries its own to-dos, so you can read
> one layer, go up a layer to see what needs to be done overall, or drill in.
> Raw thoughts append at the bottom and get folded into their tier.
> Engineering detail stays in PLAN.md (IDs referenced).
> **View it collapsible: http://localhost:5200/planner.html** (score server).

**NOW ► (2026-08-24, day 35) THE PIECE IS IN NOTATION; CLOUD02-D IS FOLDED AND
THE 48 s LONG TONE IS WRITTEN.** `db1` now also carries the **octaves-Bb long
tone at 48.05-52.46** — ring bars on all ten tubas, sized from the 4.410 s brick
in the composer score (day 35; nothing else on the page moved, measured). One
open call on it: the ten pitches are spelled **A♯** while the marker says
**"octaves Bb"** — the composer's to decide. **Immediately next: a Fable session
evaluates the day-35 notation process and decides whether to build a generator
for this class of material** (the brief is the last day-35 RUNNING_LOG entry).
Then: the NEXT SECTION — a long tone + density build 2 — composed by the
composer in the app on `piece-s26`. Standing after that: the two trance seams
(@560.63 T8, @604.63 T6); then PLAN 8 Penn State deliverables and the paper.

**Previously (2026-08-24, day 34) ► THE PIECE IS IN NOTATION, AND SECTION CLOUD02-D
IS FINISHED AND FOLDED.** `db1` is the single notation page — 49 figure
clusters over 0-46.36 s, every part figured, under the bracket-above policy
(journal §2 carries the tool table and the laws). Density build 1 + CLOUD02-I
+ CLOUD02-D are all on it. **Immediately next: the NEXT SECTION — a long tone
+ density build 2 — composed by you in the app on the save file `piece-s26`**
(bumped day 33 from the frozen `piece-s25-finished01` archive). AI runs the
density pipeline and measurements on request; notation comes later via a new
fork off db1, built with `--bracketsAbove` from birth and gated automatically
(day-34 step G). Standing after that: the two trance seams (@560.63 T8,
@604.63 T6) through `playability.js`; then PLAN 8 Penn State deliverables
(exports V4/V5) and the paper's first pass.

**Previously (2026-08-20) ►** NOTATION ARCHITECTURE COMPLETE (phases A-D in one
sitting) — the plan returned to the PIECE; the performance runtime became a
SEPARATE FUTURE PROJECT (D45). *(Superseded: its ordering put "the actual
notation" fourth and in the future; notation has been the whole job since
day 21.)*

**Previously (2026-08-19) ►** NOTATION PHASE A complete — gate items now in journal §2.**
Architecture doc + IR schema v0 + validator + three hand-worked chunks from
your real material (a trance seam, the bloom entry, the density apex), all
committed. The review checklist is PROJECT_JOURNAL §2 item 0 (registry seeds
to bless, two in-file flags, three vetoable AI calls, the A1 §8 open rows).
Phase B = the trance section end-to-end, on your go. *The day-14 "owed"
decisions (dynamics ladder, D3) DISSOLVED — dynamics decouple from MIDI,
realization is material-dependent (your dictations, filed as amendments).*

**Previously ►** Section 1 ▸ **THE PULSE SEQUENCER STRIP IS BUILT (2aa v1) — IT NEEDS THE COMPOSER'S EAR** ▸ *Open the score app, press **Pulse** (next to Morph/Texture), click a column → pick a sonority → SPACE → it loops. 29 sonorities in the menu: FIFTHS · CLUST10 · all 12 pitch classes (every octave) · the composer's 14 blast sonorities (staccato + staccato-cuivre of species 3 · 4 · 11 · 12 · 13 · 16 · 28) · a silent `—`. **Audition only — it writes nothing.** Verified in the app except the sound; `tools/test_pulse.js` 103/103. **To add a sonority, just ask** — the AI appends to `bank/pulse_palette.json` and ↻ refetches. Behind it: **three morphs are in the piece, `piece-s23` runs 8:16 — 55% of the 15-minute Penn State ceiling**, so the length of anything further is a formal decision. Also owed to the ear: the Fade-ladder audition (built day 14, verified day 15, never heard) · the BALANCE 5 s close (unheard). Unbuilt: 2aa v2 write-to-score · v3 shift matrix · v4 orchestration/doubling · the lazy-MIDI-init fix (keyboard dead on a fresh page until Play/CC7-Reset/REC — diagnosed, not fixed) · FR-8 part doubling · FR-9 phase-shifting at a tempo. The **notation pass** (FR-7, D3, dynamic marks) queues behind the trance work. `piece-s21…s24`, `tranceSB01*` and the actuals are UNTRACKED by choice — the composer's live work. **Day 17: the two audition machines are APPROVED and spec'd for handoff — PLAN 2ab (panel snapshots / the save mechanism, pulse panel included) · 2ac (multitempo audition rig — ratio streams over one BPM) · 2ad (phase-shift texture selector — a workflow over the existing Texture machinery; its first sitting doubles as the owed 2x listening slate). Build order 2ab→2ac→2ad; specs in PLAN.md, written for a cold implementer. **2ab and 2ac are now BUILT and verified in the running app** — the pulse panel has `Save`/`Load` (snapshots survive a reload, and the AI can write you a take that appears on the next Load), and the new **`MT` button beside `Pulse` is the multitempo rig**: type `3:4:5`, choose UNISON / REGISTER / REGISTER-split-harmony, SPACE, and the tempi loop together with the shared onsets highlighted. **Both need your ear — the sound is the one thing that cannot be verified here.** **2ad is READY and needed zero code** — the Texture panel already polls for AI edits (verified live), A/B/C are already the SMEAR/RAIN/GALLOP references, and the banking CLI was tested and reverted. **All three now wait on the same thing: your ear.***

---

<details open><summary><b>SECTION 1 — density buildups ⇄ intermittent sections</b> · <i>doing</i></summary>

Section-level to-dos (the whole-form layer):

- [ ] **Decide: 3 or 4 density buildups** in Section 1
- [ ] Per container, after its gestures exist: **assemble the chosen materials**
      into the piece save (the up-one-level task every container ends with)
- [ ] Watch overall proportions as containers land (DB long ⇄ INT short)

<details><summary><b>DB1 — opening density buildup</b> · <i>done</i> (piece-s08 2.0–34.7)</summary>

- GESTURE-1, oct-displace pitch set. Reference for DB3's stretch.
</details>

<details><summary><b>INT1 — first intermittent</b> · <i>done</i> (36.2–52.5)</summary>

- fp blast (VERT01-03) modified with cuivre notes · density clusters
  CLOUD02-I/D · octaves-Bb ord blast.
</details>

<details><summary><b>DB2 — second density buildup</b> · <i>done</i> (55.9–80.1)</summary>

- GESTURE-2 ×0.75, Messiaen m6 on F (composer-placed 55.94).
</details>

<details open><summary><b>INT2 — second intermittent</b> · <i>◄ NOW</i></summary>

Container-level to-dos:

- [ ] **Decide what materials to use** *(in progress — menu + choices below)*
- [ ] Explore materials / build the gestures (blasts first — below)
- [ ] Then: **assemble the chosen gestures** → piece-s09

*Materials menu (everything available):*

- blasts (stac / fp / ord, any harmony; cuivre-modifiable)
- pointillistic clusters (CLUST01 / CLUST02 / CLOUD02)
- crescendo-pulse chains (cressand-family, any pitch strategy)
- single long crescendos on a harmony
- **morphing chords (BUILT — PLAN 2v; `Morph` button, recipes banked)**
- tremolos (trem01/02 material; to develop)
- ostinato formations (ost01-variety; unheard)
- density-buildup excerpts (scrambles, carves)
- pitch-and-catch (concept; to build)

*Choices so far (locked 2026-08-14):*

- [x] **blasts** — definitely in *(harmony working set: `int2-harmonies` —
      VERT01 03·04·11·12·13·16·28; 28 has V1–V4 filed)*
- [x] **morphing chords** — in (the harmonically morphing crescendo branch)
- [x] **pointillistic clusters** — in
- **Texture arc for the section:** starts as **spaced articulations** →
  grows into **overlapping counterpoint** over its course.
- [ ] …rest of the menu: not used this section

<details open><summary><b>Blasts</b> · <i>◄ NOW — the current drill-in</i></summary>

*Strategy (composer): same harmony · redistribute the notes · vary articulation
type and length. Workflow contract: composer listens/asks/chooses — AI files
everything automatically into `docs/TAXONOMY.md` tiers (voicings per chord ·
reusable articulation sets · realizations · INT2 keepers).*

- [x] **Audition, craft, choose keepers** — done in the Blast Sandbox;
      custom list **"INT2 blasts"** is final (composer 2026-08-14)
- [ ] Choose **which instruments** play each blast
- [ ] Choose **durations** (how long each blast rings)
- [ ] Choose **articulation type** per blast (stac / fp / ord / cuivre-modified)
- [ ] Choose **how many players** per blast (subset blasts — a couple of
      textures overlapped, but keep the section intermittent / pointillistic)
- [ ] Keepers → the INT2 section palette (app palette menu on request)
- [x] **Insertion into the composer score** — Blasts strip built; blasts land
      at the playhead with measured one-shot lengths (fixed articulations are
      immune to stretching). **First four placed in piece-s09.**
- [ ] Continue placing INT2 material (blasts + pointillistic clusters), then
      shape the texture arc: spaced articulations → overlapping counterpoint
- [ ] *(superseded detail)* sonority
      strip in the composer app — flip/audition/insert-at-cursor; blasts arrive
      as 10-part groups with META shapes built at insert time; ord length stays
      draggable (group scaling). **Reorchestration = AI prompts** on the
      inserted shape (redistribute among free players; split notes when dense
      — sophistication added as need arises).
</details>

<details><summary><b>Morphing crescendo</b> · <i>BUILT — PLAN 2v</i></summary>

A smooth shift in **harmonic timbre as well as volume**. Delivered as the
morphing-chords system: `Morph` button in the composer score.

- [x] **Quartertones patch mapping test** — done by measurement. It is **NOT** a
      uniform quarter tone (+23 ¢ at F2 → +57 ¢ at C4), so quarter-tone chords
      must be voiced from the per-key table.
- [x] **Vehicle decided: PITCH BEND**, not the gliss patch and not the
      quartertones patch. Measured ±1.99 st, linear, no artifacts, and wide
      moves re-key mid-note with no audible seam (D26).
- [x] **Volume rides every model** (D24), so "timbre as well as volume" is the
      default rather than a combination the composer has to build.
- [ ] Choose endpoints for the actual INT2 gesture — now a compositional choice,
      not a technical one. Keepers to start from: `bank/morph_recipes.json`.
</details>

</details>

<details open><summary><b>DB3 — third density buildup</b> · <i>◄ IN THE PIECE</i> (piece-s16/s17, 113.5–135.8 s)</summary>

- [x] **Length** — settled by playing it: 22.2 s as recorded/packed
      (`densBld03-take1-fp.json`, 160 notes, HARD 0 / soft 0)
- [x] **Placed** — `tools/place_gesture.js` from `bank/DB3-m3F.json`; zero new
      conflicts (badge unchanged at 42 soft, all pre-existing)
- [x] **Harmony decided 2026-08-16: MESSIAEN MODE 3 ON F** (the composer's
      pick from `densBld03-tonalities-surge`). 26 distinct pitches G1–F4 over
      the 9 classes F G G# A B C C# D# E; HARD 0 / soft 0, one of only two
      flag-free variants. Banked `bank/DB3-m3F.json`; in the piece as
      `grp-db3-m3f-01` at **113.54 → 135.77 s** (piece-s16).
- [ ] **The apex decision** — zero hard conflicts cost 91 notes, all at 20–23 s
      of the build. Alternatives: more players (M1) or converting the apex to
      sustained material. See DENSITY_PIPELINE "What is still the composer's
      decision".
- [ ] **Add long tones by hand** where it needs filling (`G` = surge convert on
      a selection — the grain pass, still undone)
</details>

<details><summary><b>INT3 / DB4?</b> · <i>form-dependent</i></summary>

- Exists or not per the 3-vs-4 decision at the section layer.
</details>

</details>

---

<details><summary><b>SECTION 2</b> · <i>conceive after Section 1</i> — research first, then try things</summary>

- [ ] **Tremolo material** (PLAN 2j — trem01/trem02 built, unheard)
- [ ] Gestures usable in it
- [ ] The **morphing chords**
- [ ] **Develop the crescendo chains** (beyond cressand-family)
- then sketch — "maybe by then I'll have a clear idea how it should sound"
</details>

---

<details><summary><b>MATERIALS</b> — the inventory (palette menu mirrors highlights)</summary>

*Articulation colors through everything: **staccato · fortepiano (×3 duration
rule) · ordinario blast** (+ cuivre via C key, + surge/G-convert).*

- **DENSITY BUILDUPS**: GESTURE-1 (opening) · GESTURE-2 (A2 lineage) ·
  compression ×0.75/×0.5 built · **stretching = the DB3 question** (PLAN 2m)
- **Crescendo-pulse chains**: `cressand-family` (7 margin-solved chains,
  26.5 dB clarity law) · `cressand-pitches` (7 pitch strategies)
- **Tremolos** (PLAN 2j): `trem01-single` · `trem02-phase`; sine-figure
  notation planned; ceiling = the slur rule (est. 4.5 Hz half-step / 3 Hz fifth)
- **Ostinatos**: piece-#2 timing tables ported · `ost01-variety`
  (8 formations) — **unheard, queued**
- **Pointillistic clusters**: CLUST01-A…T + carves · CLUST02-A + scrambles ·
  CLOUD02-A…L (21–43/s, max-retention)
- **Chords / harmonies**: VERT01-01…33 (shortlist 03/04/06/07/11/12/16/23/28/33)
  · fifths + octave stacks · Bb–E 2-oct cluster · four 7-note chromatic
  clusters · Messiaen m6(F) kept, m7/m4 picked · tone row · Bhairav ·
  **pinned pairings** B2×BbE · M×5ths-30 · L2×spread · *coming:* spectral
  chords + quarter-tones (PLAN 2l)
- **PITCH-AND-CATCH** *(concept, to build)*: **swell → gap → attack**; the gap
  length is a primary dial; swell ∈ {crescendo, crescendo train, density
  buildup}; the catch ∈ {short cluster burst, fp chord, blast, …}
</details>

---

<details><summary><b>RAW NOTES</b> (append; fold upward when absorbed)</summary>

- **2026-08-14 (workflow dictation):** Section-1 state DB1/INT1/DB2 done, INT2
  in progress; DB3 = longer DB1 (smooth, same-density, frame-by-frame-but-longer,
  maybe extra long grains); INT2 = blasts + harmonically morphing crescendo
  (gliss→quarter-tones or legato, simple→complex timbre) + subset blasts;
  Section 2 after research; pitch-and-catch defined; "density buildup" adopted.
- **2026-08-16 — CLUSTER SANDBOX shipped** (`/clusterview.html`, PLAN 2p):
  42 played clusters + recording, piano-roll editing, non-destructive transforms
  (stretch / tonality-remap / reverse / octave / thin / velocity), lists+items
  preset model, feeding the composer strip's **Clusters** source. **Open:**
  velocity-vs-CC7 (PLAN 2q) — settle with a listening test before trusting
  sandbox dynamics downstream.
- **2026-08-15 — MEASURED one-shot lengths** (probe): fp 1.35-2.22s, cuivre
  0.99-1.35s, staccato 0.33-0.53s, all FIXED with the multisample sawtooth;
  wired into insert + playback; fixed-length notes are now immune to group
  scaling (only ord stretches). bank/sample_lengths.json
- **2026-08-14 — noted cursor times: 81.73, 86.57 (S010 ch03 V2 re-inserted @ 86.58)** (piece-s08, during INT2 blast
  insertion — composer landmark).
- **2026-08-14 (SANDBOX DESIGN PRINCIPLE — for the morphing-chords sandbox and
  all future ones):** straddle the UI-vs-AI-prompting line deliberately.
  **UI objects only where interaction speed compounds** (browse/audition loops:
  arrow-through-and-listen, click-to-collect — the strip proved this class).
  **AI prompts for one-off operations** ("give me chords 1, 7, 9, 10; drop 4")
  where building UI would be a rabbit hole of unused contingencies.
  **Lean to piece-specific over universal**: build just enough to get what this
  piece needs; universalize later only if needed. The goal: fluidly throw
  together custom objects, hear variations, decide, then insert final static
  objects into the score.
- **2026-08-14 (sieve dictation):** tier examples captured into the outline
  above — section-layer form decision (3 vs 4 DBs), DB3 decisions (length,
  profile-over-longer-span, add long tones by hand), INT2 drill-in (materials →
  blasts → harmonies/instruments/durations/articulation/player-count), and the
  up-one-level assembly task per container.
</details>

- **2026-08-17 (day 13) — MORPH CYCLING BUILT.** One time value became two:
  `carrier.span` is the one-way gliss (pace), `carrier.duration` is the body, and
  the trajectory now cycles out-and-back instead of arriving and stopping.
  `carrier.release` closes the bloom back to unison as it fades. Loudness came
  free (it rides the same progress). Spec ledger for the remaining requests:
  **`docs/FEATURE_REQUESTS.md`** (FR-1…FR-6). Section form:
  **`docs/plans/MORPH_SECTION.md`** — a morph bed with played impacts punched
  through it; the governing constraint is that bed and impacts share ten players,
  so impacts borrow WHOLE PAIRS and each one silences a beating rate.
  **PENN STATE = 15 MINUTES MAX**, so one 5-minute morph is a third of the piece.
  **Open:** the fade-in/release blip is NOT diagnosed (NITS) and blocks
  auditioning the attack; the composer will fix it in Reaper for the demo.

- **2026-08-17 (day 14) — BLIP GONE (CC7 timing, morph panel fixed); ACT-BLOOM-02
  saved ("BEATING BLOOM, 108 s 001"); NOTATION DATA WALK CLEAN.** The saved
  ACTUAL + placement chain hold everything the part scores and the conductor's
  graphic layer need (pitch+level curves per player, BREATH/SEAM flags, pair
  structure for the beating graphic, full provenance) — findings in RUNNING_LOG
  day 14, composer's graphic-layer dictation verbatim in COMPOSER_LOG. **Place
  morphs from the ACTUALs tab** (it logs placements; scratch Insert doesn't).
  **New idea (composer, to evaluate at full-score time): a GRAPHIC LAYER in the
  full score** describing beating increase/acceleration, layers of beating, and
  which players beat against which — for the conductor to rehearse with. Part
  scores: pitch/crescendo curve + playing/breathing/rearticulation graphics +
  spot dynamics. ~~**Open before notation: D3's performer-transform decision, and
  the 0–10 → dynamic-mark convention.**~~ *(Dissolved 2026-08-19 —
  NOTATION_ARCHITECTURE.md amendments 1–2.)* Next: insert the morph into the score.

- **2026-08-17 (day 14) — FINAL SECTION conceived: a PULSED field, Ghost-Trance-like**
  (composer, verbatim in COMPOSER_LOG day 14). The elements, as dictated:
  - **A continuous pulse** as the ground — notated, *and* carried as **colour**
    in the graphic layer (ties directly to the full-score graphic idea filed the
    same day: the graphic says what the parts cannot).
  - **Pitch material ranges over single pitches → pitch sets → tone rows** —
    i.e. the same pulse read at different harmonic densities. *(A tone row is
    already in MATERIALS.)*
  - **Bursts, cross-cut:** multi-tempo sections cut in, and selected
    **phase-shifting** sections cut in. Cross-cutting is the operative word —
    interruption, not transition.
  - **Two open engineering questions, both filed as FRs:** how to drive the
    **phase-shifting machine (2j/2x) at a GIVEN TEMPO** so it can develop these
    sections (FR-9), and how to **double parts inside a morph so all ten players
    have something to play** (FR-8) — ACT-BLOOM-02 uses 8 of 10.
  - *Placement:* this is the FINAL section, so it sits after Section 2 in the
    form; against the **15-minute Penn State ceiling** it competes for time with
    the morph section, and neither has a length yet.

- **2026-08-17 (day 14, end) — THE FIRST MORPH IS IN THE PIECE.** `piece-s20`:
  `grp-act-bloom-01-01`, 108 objects, **141.39 → 255.31 s**, from the composer's
  own actual **`ACT-BLOOM-01` "JYBloom001"** (span 47.5, attack 8 s, dials
  0.75/0.55, seed 11, `fade-in-3s`). `piece-s19` is the intermediate step.
  **The piece now runs to 4:15**, from 2:16. Against the 15-minute ceiling one
  morph is ~14 % of the piece — so the length of the remaining 3–5 is now a
  live formal question, not a hypothetical one.

- **2026-08-17 (day 15) — pulsed section, pitch device (composer):** *"close 10
  note cluster that opens out to spread chords on beat."* A ten-note cluster —
  one pitch per player, so all ten are employed — opening outward into spread
  voicings, **on the beat**, pulse by pulse. Registrally this is M5 SPACING
  MIGRATION's motion, but quantised to the pulse rather than glissed, so it is a
  voicing-series question, not a morph. Also worth noting it sidesteps FR-8 for
  this section: ten distinct pitches means nobody is idle.

- **2026-08-17 (day 15) — how the last morph should end (composer, "if I have
  time"):** *"come back to the last morph and try to release on the consonant
  clear chord."* The release lands on a named consonant sonority instead of
  dissolving. **Partly built:** `shape.release.motion.type = 'to-unison'`
  already unwinds the model's deviation back to each voice's starting pitch.
  **Not built:** a release motion that travels to an ARBITRARY target voicing.
  Same evening's work made the level side of a release reliable regardless of
  dynamics shape (MORPH_FINDINGS "The ending law"), so this is now a pitch-target
  question only.

- **2026-08-17 (day 15) — the floating time readout regression, fixed.** The
  hover-for-px/s handler (2026-08-14) assigned `floatingTime.textContent`, which
  deleted the two spans the m:ss line added on 08-17 — and `el._time` had saved
  their concatenation, so leaving the element restored `"142.072:22"` as one flat
  18 px node and every later update wrote into detached spans (the readout froze
  until reload). Reproduced and fixed in a standalone browser harness. The px/s
  overlay is now its own span, shown by hiding the other two.

- **2026-08-20 (day 20) — Penn State deliverables preplan (composer):** three
  deliverables (MIDI recording · 1920×1080 screen-following video · PDF full
  score); the two fixed formats get decided up front so notation trials preview
  in the shipping container ("insert into the video score… see it the way it
  will eventually look"); everything responsive / rehearsal / performance-side
  deferred post-submission (D45). Capture + decision slate:
  `docs/plans/PENN_STATE_DELIVERABLES_PREPLAN.md`. Phase-shifting sitting is
  next; this work waits until the piece is done.
