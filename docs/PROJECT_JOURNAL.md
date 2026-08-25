# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

### WHERE IT STANDS — day 35 CLOSE (Claude Code / Opus)

**THE PIECE HAS A TITLE: "Bloom — Convergence — Balance", for Tuba Ensemble.**
The three morph sections are the title.

**THE MORPH SECTIONS ARE NOTATED, TEN PARTS EACH, AND FOLDED INTO MAIN DRAFT.**
Picker: `MORPH 1 — BLOOM (all ten)` · `MORPH 2 — CONVERGENCE (all ten)` ·
`MORPH 3 — BALANCE (all ten)`, plus MAIN DRAFT carrying all three.
**READ `docs/MORPH_NOTATION.md` BEFORE ANY MORPH WORK** — the settled vocabulary and
why each number is what it is. Tools: `tools/notate_morph.js` (standalone pages) and
`notate_section.js --morph <groupId>` (the fold); they share
`notation/lib/morph_overlays.js` so they cannot drift.

**THE TRANCE SECTION IS BEGUN.** Page: **`TRANCE A4 — 500-751 s`** (`trance-a4`),
3209 events, VALID, geometry clean. Built by `notate_section.js --trance
grp-tranceA4-01` + `notation/lib/trance_overlays.js`. On it: **3109 quarter notes
(0 flag glyphs)** · 53 held tones untouched (they ARE the fortepianos) · **47 end
crescendos as surges** (ppp→arrow→fff) · **8 tempo bar lines** · **all text gone**
(new `hideMarkers` flag — the app draws markers from the SCORE, not the page) ·
3130 bouncing balls. **Full account: RUNNING_LOG, day 35 nineteenth sitting.**

**THE SECTION IS ONE LONG ACCELERANDO** — that is what gives the bar lines:
**♩ = 75 → 80 → 87 → 93.8 → 100 → 107.1 → 113.2 → 120** at 499.83 · 548.63 · 566.63 ·
582.23 · 604.63 · 620.63 · 664.63 · 709.43, with multitempo and phase-shift passages
between each arrival.

**THE TWO TRANCE OVERLAPS ARE FIXED** — they were the two the plan already named
(old step 7): T8 @560.63 and T6 @604.63, both pruned by the composer's rule (remove
the PRECEDING section's last partial). **0 overlaps in 3212 notes.** Two 5-6 ms gaps
deliberately LEFT as clean seams.

**SAVE FILE: `piece-s28` is CURRENT** (s27 frozen; object-for-object copy, db1 proven
0/0/0 across the bump). **`test_notate_block` hardcodes the score name — bump it with
the save file** or it goes red.

**WAITING ON THE COMPOSER:** the whole day's output is unreviewed — they said *"I'll
review when I get back to my desktop."* Nothing is blocked on us.

### THE TRAPS THIS DAY FOUND (read before building notation)

1. **The IR SCHEMA is a GATE ON THE FILE, not a description of the renderer.** A new
   overlay kind must be added to `notation/schema/ir_v0.schema.json` IN THE SAME
   COMMIT, or the page is **rejected and DELETED on write**. It happened twice today
   (`header`/`gliss`/`cresc`, then `tempo`) and once on day 23 (`engraving`).
   **Snapshot the IR before any build that adds a kind.**
2. **`tools/notate_morph.js` writes WITHOUT validating** — which is why three morph
   pages existed having passed nothing while the first validated fold failed. NITS.
3. **The live notation view does not pass the registry to the renderer**
   (`notation.html` line 386 omits `engraving`; line 462 passes it). Change a look
   number in `engraving.render` and the live page will not move. Mirror it into
   render.js's code defaults. NITS.
4. **`prove_unmoved --expect-added N` counts PAGE ITEMS, not events.** NITS.

---

### THE TITLE (composer, day 35)

# **Bloom — Convergence — Balance**
## *for Tuba Ensemble*

**The three morph sections ARE the title.** `ACT-BLOOM-01` · `ACT-CONVERGE-01` ·
`ACT-BALANCE-01`, 141–496 s. Whatever else the piece contains, its name says the
morphs are the argument — worth remembering when weighing how much of the 15-minute
Penn State ceiling they get.

---

### The morph-notation record (day 35, superseded above where they differ)

**Three things shipped today, all pushed.** (1) **DB3 NOTATED** — MAIN DRAFT reads
**0-136 s**, 23 clusters with their dynamics in one build. (2) **THE MORPHS GO TO TEN
PARTS** — all three beds re-rendered and placed, MAIN DRAFT extended to **0-496 s**
with the morphs as bricks. (3) **THE MORPH NOTATION VOCABULARY** — designed live with
the composer, piece by piece, and handed off as a tool + a doc.

**READ `docs/MORPH_NOTATION.md` BEFORE ANY MORPH WORK.** It is the settled vocabulary,
why each number is what it is, and where the template stops. The tool is
**`tools/notate_morph.js`** (`--group <id> --part <0-9> --id <ir> [--apply]`; dry-run
by default). Run over BLOOM part 0 it **reproduces the composer-approved page exactly**.

**THE REFERENCE PAGE IS `morph-x01`** in the picker — BLOOM T1. It carries: normal
staff + bass clef · a header (two small black heads **F2 · gliss line · F¼♯**, and
below on the house `dynY` row a **drawn niente circle · arrow · fff**) · **13 go
lines**, one per breath, **no onset noteheads** · **two interpolated curves**,
brightOrange gliss in the TOP half and limeGreen crescendo in the BOTTOM, filled, no
borders, each normalised to fill its half · **two meters, no dots**.

**THE FINDING THAT CHANGES THE PLAN — the template only fits BLOOM.** Measured over
all ten parts of all three morphs:

| morph | gliss range | direction reversals | verdict |
|---|---|---|---|
| **BLOOM** | 20 c every part | **0** | one clean arc — **fits** |
| **CONVERGE** | 182-366 c | 12-38 | **an OSCILLATION — the tool REFUSES** |
| **BALANCE** | **0 c every part** | 0 | **no glissando at all** |

CONVERGE swings up to 3.5 semitones reversing up to 38 times; the best single smooth
curve has a **237-cent** worst case, so the tool refuses above 25 c (half a quarter
tone — past that the drawn line puts the player in the *wrong quarter tone*).
**BALANCE has no pitch bend anywhere: its top half would be empty.** Both need a
composer decision before anything is drawn.

**A CORRECTION ON THE RECORD:** an earlier note said "CONVERGE reaches ±67 cents".
That was a per-tone peak, **not** the section range, which is ±180 c. The table in
`MORPH_NOTATION.md` is the one to trust.

**THE BEATING DATA IS JOURNALLED** at the composer's ask (RUNNING_LOG, "THE BEATING
DATA"): each pair is a mirror, max spread **40.9 cents**, beating **2.06 Hz (T1/T2)
→ 6.55 Hz (T9/T10)**. The composer wants a beating indicator in the PARTS eventually
— filed in PLANNER, with their own doubt that the two players can hear each other.

**Deliberately uncommitted: nothing.** Working tree clean at close.

---

### The sixteenth-sitting record — DB3 NOTATED (still current for MAIN DRAFT)

**MAIN DRAFT NOW READS 0–136 s.** The final density build is figured. The page is
**"MAIN DRAFT — all notation so far (0-136 s)"** (internal id `db1`, source
`piece-s27`) — **866 events · 277 chunks · VALID vs source · geometry zero new**
(still only the two pre-existing tier-3 items, T9 @36.87 · T10 @39.08).

**23 clusters `cl-62`–`cl-84`, built WITH their dynamics in ONE build** — not
figures-then-marks-later as DB2 did, because the fourteenth sitting's lesson (D-log
23) is that an established rule living only in prose gets skipped. 23 marks · 18
accents · 6 below-floor members unmarked.

**THE SCAN WAS THE CLEANEST ANY SECTION HAS RETURNED:** 23 gestures, **all on one
grid within a head · 0 straddles · 0 no-clean-seam · 0 ratio ties · 0 brackets.**
**DB3 needs no tuplet vocabulary at all.** Every fit `[no tuplet]`, max err 0–18 ms,
every written value a 16th.

**THE SECTION'S FORM, found by measuring:** 160 notes = **~97 lone one-shots + 63
notes in 23 gestures.** Ten parts enter staggered (T1@113.0 → T10@120.1) and play
one-shots only for ~17 s; **every one of the 23 gestures sits in the last six
seconds (129.83–135.29)**, and their units cluster at **215–245 ms across all ten
parts.** Ten independent voices converge on a common pace at the end. *The density
is ACROSS the parts, not inside any one — DB2's shape at twice the scale.*

**The scoped-global design paid out one section later, as forecast:**
`--beamsThrough 55.9- --rests16 55.9-` are open-ended, so **DB3 inherited the
day-35 beam/rest rule with NO new flags.**

**All 17 ringing members (10 fp + 7 ord/surge) live in 113.0–128.3; every gesture is
pure staccato.** The named surge-inside-a-figure FIRST **did not occur — again.**
Measured with duration, not onset: the last ringing note (`ev-wc-2405`, T8) ENDS at
129.711, the first gesture begins at 129.830 — **119 ms** (DB2's was 168).

**PROVEN, not assumed: nothing on [0,111) moved.** 1263 added layout rows, **every
one at/after 112.9** · **0 removed** · 10 changed, all ten the `staff t1` window
bound. `--validate` **81/84** — the three DIFFERS proven to pre-date the sitting.
**Eleven batteries green.** Verified in the running app at 131.5–135.7 and
112.8–121.8. Full account: RUNNING_LOG day 35, sixteenth sitting.

**WAITING ON THE COMPOSER — DB3-EYE** (see the NEXT STEPS row): five 3-band clusters
are proposals; **the member-2 mark is an AI reading of two rules colliding**, new in
DB3; a new facing band T7/T8 133.1–133.5.

---

### The thirteenth-sitting record — ONE PAGE: MAIN DRAFT (still current; the page now reads 0-136 s)

**THE PICKER IS ONE PAGE NOW — the composer's mandate, verbatim: *"just keep one in
the main section… all the notation we've built so far and just keeps accumulating
it. The sort of main draft."*** The three tiles are MERGED: **"MAIN DRAFT — all
notation so far (0-111 s)"** (internal id `db1`, source `piece-s27`, 706 events =
456+129+121 exactly). One build command carries all three sections' provenance
verbatim; the era boundary is expressed as **scoped globals `--beamsThrough 55.9-
--rests16 55.9-`** (open-ended — future sections inherit the day-35 rule; db1's
approved beamlet-era tiles untouched). **Proven tile-by-tile: 3833 + 1033 + 1043
layout rows identical to the three pre-merge pages, zero extra, zero missing**
(window furniture excluded as definitionally window-shaped). Eleven batteries green
(test_notate_block 65/65 — SCORE now piece-s27, golden strips only the two replayed
flags, window-refusal on a synthesized clipped twin, ragged fixture reads the frozen
archive). `db2` and `int2b1` PRUNED; the picker is fully manifest-driven (the four
day-1 hardcoded entries are manifest experiments now); **main section = MAIN DRAFT
alone, everything else under "experiments"**. Verified in the live app at 78.2 and
84. **In chat the page is always called MAIN DRAFT.** Full account: RUNNING_LOG
day 35, thirteenth sitting.

**DB2-FIX round 2 (fourteenth sitting): THE DYNAMICS ARE APPLIED** — the composer:
*"I thought we already established some guidelines for dynamics."* We had (day 24
rule + day-29 mf floor + day-30 refinements; process = rule proposes onto the page,
eye refines). All twelve clusters marked from the recorded velocities: 12 marks +
23 accents, windowed-diff proven (+35 glyphs in the mid tile exactly, outer tiles
0/0, geometry zero new). **cl-52's lone `p` is below the mf floor → unmarked by
rule.** For the composer's ear: **cl-50 (T1 @78.48) and cl-52 (T2 @77.38)** — both
3-band starting points. Remaining small flags in the eleventh-sitting block below.

---

### The eleventh-sitting record (round 1 — still current except "the page" is now MAIN DRAFT)

**DB2-FIX ROUND 1 IS ON THE PAGE (eleventh sitting, Fable).** The composer's first
verdict on `db2`, dictated and applied: **(1) full double beams across every beam
group** (beamlet stubs 25 → 0) and **(2) every rest a 16th, one per slot** (free
8th rests → 0; the two left are cl-6's 3:2 bracket slots, the bracket's own
arithmetic) — both generalized as GLOBAL BUILD FLAGS `--beamsThrough --rests16`
on `notate_section` (default OFF; db1's provenance reproduces its approved
beamlet-era writing — the golden proves it), with the composer's forecast
exceptions `--beamlets N` / `--restFit N` built. **The day-29 STANDING BUILD
RECIPE already said this in prose and the tenth-sitting build skipped it — the
rule now lives on the command line** (D-log 23). **(3) cl-3 rewritten by
dictation:** the fp `wc-1704` DETACHED (no beam, no stem; open head + sfzp + GC +
go line — the registry one-shot), cluster = the five heads from 77.383 as ONE
group (`--pattern`, `--noGc wc-1710`; worst displacement 0.9 heads, was 1.0;
ratio-tie flag mooted). Diff proven CONFINED to the dictation; eleven batteries
green; db1/int2b1 md5-identical; verified in the app (screenshots + DOM audit).
Full account: RUNNING_LOG day 35 eleventh sitting.

**REMAINING FLAGS: #1 cluster dynamics (proposal table stands, NO verdict yet) ·
#2 cl-1 straddle · #3 cl-6 no-clean-seam · #5 cl-1 near-tie · #7 nine short fp
bars · #8 T1/T2 facing band (info) · new/small: cl-6's two bracket-internal 8th
rests (slot-value by rule — say the word for 16ths).**

---

### The tenth-sitting record (superseded where the above says so)

**`db2` IS BUILT AND FIGURED.** "DENSITY BUILD (GESTURE-2 x0.75) — 56-81 s", source
`piece-s27`, window 55.9-81, all ten parts, `--bricks --bracketsAbove`. **129 events · 45
chunks · VALID vs source · GEOMETRY clean · 12 clusters.** Eleven batteries green; `db1`
and `int2b1` md5-identical to HEAD. Full account + the flags table: RUNNING_LOG, day 35
tenth sitting.

**THE SECTION IS NOT WHAT THE PLAN ASSUMED.** The scan found **12 gestures and 91 lone
one-shots** — only 38 of 129 notes are in a multi-note gesture, and all twelve gestures sit
in the last six seconds (73.2-80.1). Before 73 s every part is one-shots. *The density is
ACROSS the ten parts, not inside any one of them.* All 12 fit within a head on ONE grid, so
no `--ownGrids`, no `--cuts`, no `--paceRatio` — pace-rule defaults took the whole section.
Two brackets exist in total (cl-1 5:4, cl-6 3:2); every written value is a 16th.

**THE NAMED FIRST DID NOT OCCUR** — no surge is inside a figure and no surge curve reaches
one; closest is `wc-1702` T6 with **168 ms clearance**, verified on the rendered page. The
risk stays open for a future section.

**TWO CORRECTIONS TO THE NINTH SITTING'S BRIEF, both measured:** (1) there are **9 surges,
not 8 + 1 plain ord** — `wc-1624` carries `env: surge`, and this section has NO plain-ord
note; (2) **the "129/129 go line" assert cannot survive figures and should not** —
`figures.cluster.goLine` is `false` in the registry, so it reads 91/129. The assert was
restated to measure the LAW (go line on non-cluster notes 91/91 · on partials 0/0 · GC on
each cluster first partial 12/12 · on non-first 0/0 · notehead 129/129 · brick 129/129 —
all PASS). **A count-based assert would have reported a regression here.**

**`--w0 55.9` PROVED NECESSARY:** `wc-1624`'s brick sits at x=56.25 but its **notehead at
x=27.3** (the surge unit hangs before its go time). `--w0 56` would have clipped the head
off the page while still counting the event.

**~~WAITING ON THE COMPOSER~~ — the eye arrived; round 1 applied (see the block
above).** Still open from this list: the dynamics. **All 12 clusters have NO
dynamics** (`dynMark: false` by design; `--dyn`/`--accents` stay the composer's, and
db1 does the same — 264 of its 330 partials suppress the mark). The registry rule was
run to PROPOSE, not apply. **The proposal table is in the running log (tenth
sitting)**, classified by the standards' own calibration (band count): **10 of 12 are
inside it** (1-2 bands) and can be applied from the rule; **cl-1 (3 bands) and cl-3
(4 bands) are not** — and cl-3 is now FIVE members (its fp detached, day 35 round 1),
so its row wants re-deriving before any apply.

**Deliberately uncommitted: nothing.** Gitignored and pre-existing, left alone:
`scores/gen-aud-0[1-5].json` · `scores/piece-s25-finished01-work.json` (never a source,
D75) · `scores/versions/`. `piece-s27-work.json` still does not exist.

**THE SAVE-FILE MAP (day 35, twelfth sitting; superseded on the notation side by
the thirteenth): `docs/SAVE_FILES.md`.** Current save = **`piece-s27`**; the one
notation page is **MAIN DRAFT** (see the block above). **Keep the map current at
every bump/new section; name files by exact filename or picker label in chat**
(also in CLAUDE.md now; its stale `7tubas.json` line fixed).

**Chat format, standing:** succinct, chunked, short lines; answer the question that was
asked (global CLAUDE.md § Chat responses; `reply-format-tldr-chunks` memory).
---

**DAY 35 COLD START — read this block, then go. CLOUD02-D IS WRAPPED (day 33)
AND FOLDED (day 34): `db1` is now the single page and carries all 49 clusters,
0–46.36 s, under the bracket-above policy; nothing mechanical is outstanding.
**Next work is the composer's: THE NEXT SECTION — a LONG TONE + DENSITY BUILD 2
— composed in the app on the save file `piece-s26`. Open with Fable; the AI's
job is density-pipeline runs and measurements on request, not building.**

### State in one paragraph

**Day 34 (one session, Claude Code / Opus) — two mechanical chunks, both
verified, both pushed.** THE FOLD ran: `db1` is the single page again (49
clusters, 0-46.36 s, `--bracketsAbove`, 456 events, VALID vs source), the
`db1-c2d-x01` fork pruned, geometry unchanged (the two known tier-3 items, zero
new). **425 approved layout rows proven identical before and after** — the claim
the composer plans around, measured against a git-restored day-33 db1 because
the batteries could not say it (the gate had `existsSync`-skipped itself). Then
STEP G woke that gate: both day-33 guards now discover `db1-*` forks from the
picker instead of naming one, and the approved boundary is DERIVED (min start of
any cluster the fork adds or changes) instead of the hardcoded `42` — which was
CLOUD02-D's number and would have silently under-covered the next section by
4.4 s. Verified by rebuilding the day-33 world from git: fires red on a forced
stem at t=31.55, re-derives `t<42.37` over the same 425 rows, fails loudly on a
missing fork file, prints NOT APPLICABLE when there is no fork. D70; principle
11. Ten batteries green.

**Day 33 wrapped CLOUD02-D.** The reads never ran as ceremony — the composer
lived with every figure through the three-day placement work and closed 6b by
standing verdict. The page is LOCKED under: **THE BRACKET-ABOVE POLICY**
(every bracket above its own staff, hugged, per-IR `--bracketsAbove`; a
bracket belongs to the staff below it) · **THE PER-MARK ACCENT LAW** (head-side
accents hug their own note — day-31 dyn law extended) · `--dynSide` dictation ·
the hook⇔side battery invariant · **THE APPROVED-SPAN GATE** (caught the
stale-stem-tip bug day 33; proved the fold moved nothing day 34; **day 34 it
discovers its fork from the picker and derives its own boundary**, so the next
section's fork is gated from birth) · **FACING BANDS named by every
build** (info line: T6/T7 · T8/T9 · quiet T4/T5 @34.3 — every day-31-33
dictation landed in a facing band). Geometry guard: ZERO c2d findings; only
the two pre-existing tier-3 items (T9 @36.87 · T10 @39.08, approved db1).
**The facing-bands MOVER is deliberately NOT machinery** — adopt at a future
section build if wanted; its two deltas (T9 accents below, T3 accents to beam
side) must be named to the composer first. Ten batteries + 75 snapshots green;
everything pushed.

**The save-file bump (day 33):** `scores/piece-s26.json` = byte-faithful copy
of `piece-s25-finished01` (fresh metadata; 4563 objects, 10 tracks; verified
in the live app list). `piece-s25-finished01-work` is a STALE app working copy
(12 h older than the archive; zero composer edits) — left alone; the app makes
`piece-s26-work` on first open. **Compose the next section in `piece-s26`;
the s25 archive is frozen as CLOUD02-D-era canon.**

### THE FOLD — DONE (day 34, one sitting)

`db1` rebuilt from the fork's own command under `--id db1`; fork pruned. **456
events · 127 chunks · VALID vs source · 49 clusters · `--bracketsAbove` on.**
Geometry: the two pre-existing tier-3 items only (T9 @36.87 · T10 @39.08) —
**zero new c2d findings.** Ten batteries green.

- **Where CLOUD02-D sits: 42.37–46.36 s** — all 13 new clusters above t=42,
  which is why the gate's threshold is 42 and why it covered 100 % of approved
  material. db1's earlier 36 = 25 density-build-1 (29.92–34.6) + 11 CLOUD02-I
  (36.19–40.42).
- **The claim, measured not inferred:** 425 approved layout rows (tuplets,
  beams, accents, dynamics below t=42) **IDENTICAL** between the day-33 db1 and
  the folded db1. Nothing the composer approved moved. *(The batteries could not
  say this — the gate `existsSync`-skipped itself once the fork was gone.)*
- **CARRIED FORWARD → NITS (day 34):** that gate now hardcodes a pruned fork id
  and therefore **reports green while asserting nothing**. Fix it before the next
  section's fork, or the next `--bracketsAbove` build has no guard at all.

### NEXT STEPS · MODEL · CLEAR — the running thread (keep current; CLAUDE.md § THE RHYTHM)

| # | step | model | clear? | done = |
|---|---|---|---|---|
| ~~5c/6~~ | ~~CLOUD02-I: the reads, the notation, the fold~~ **DONE day 30** (D-logs 10–22; validate 37/40; pushed) | — | — | — |
| ~~6a~~ | ~~CLOUD02-D playability~~ **DONE day 31** — 18 soft → 10, worst 57 % → 20 %, 0 hard; 16 moves + bricks, 17 ledger lines; PLAN 8j; the collapse pass, the same-slot bar and frozen figures built | — | — | — |
| ~~6b~~ | ~~CLOUD02-D notation~~ **DONE day 33** — placement locked by eye (bracket-above policy + per-mark laws + dictations); figures approved by the composer's standing verdict; guard zero findings | — | — | — |
| ~~F~~ | ~~THE FOLD~~ **DONE day 34** — db1 carries all 49 clusters (0–46.36 s, policy on); fork pruned; 425 approved rows proven unmoved; batteries green; pushed | — | — | — |
| ~~G~~ | ~~Wake the approved-span gate~~ **DONE day 34** — both guards discover `db1-*` forks from the picker; boundary derived (re-derived 42.37 / 425 rows on the reconstructed day-33 world); fires red on real drift; missing fork file fails loudly; prints NOT APPLICABLE when there is no fork | — | — | — |
| ~~M~~ | ~~BUILD the block generator~~ **DONE day 35** — `tools/notate_block.js` + `notation/lib/{device_check,prove_unmoved}.js` + `tools/prove_unmoved.js` (CLI) + `tools/test_notate_block.js`. **GOLDEN PASSES: the machine-built page is item-for-item identical to the approved db1** (warnings 22 = 22); 44/44 new checks; ten batteries green; db1 byte-identical. The golden caught a real error in the day-35 brief → **D73** (the proof is CONFINEMENT, not stillness). All four traps are refusals | — | — | — |
| ~~STOP 1~~ | ~~which save file, new IR vs extended window~~ **ANSWERED day 35** — source is **`piece-s26`** (NOT `-work`, which is behind by the whole playability pass — D75); option **(a) a NEW IR** for 81–110, db1 left approved and untouched | — | — | — |
| ~~fifth sitting~~ | ~~THE BLAST-COLUMN EVALUATION~~ **DONE day 35 (Fable)** — 11 dictated columns measured in `piece-s26`; every named exception already true in the grouping; verdict = YES, one narrowing of one refusal. Full table + spec: running log, fifth sitting | — | — | — |
| ~~M2~~ | ~~AMEND `notate_block` for mixed/all-staccato blocks~~ **DONE day 35 (Opus)** — ring vs self-drawing partition; `spanFor` wanted-set = ring only; all-staccato → VERIFY not build; ask-assertion split; unknown technique still refused. **Battery 64/64** (was 44), golden still identical to db1. Also caught a regression the spec did not foresee: **"a block is one instant" was never asserted** — the 159-note cloud (uniform brick, 153 onsets over 4.1 s) had only ever been refused for its technique. Threshold now derived from the material. `set_brick --technique any` + `--why` + the sound line MEASURED (false for the ord family, D9) | — | — | — |
| ~~P~~ | ~~BUILD THE 81–111 PAGE~~ **DONE day 35 (Opus)** — **`int2b1` "INT2 BLASTS — 81-111 s"**; 7× `set_brick` to the dictated shortest rule then **11 notate_block runs: 8 built (47 ring bars), 3 verified-not-built**. Every dictated exception held with no code for it. Verified in the running app (14 bars at 84.3+2.5; 8 bars @4.995 reaching 110.621). Eleven batteries green; db1 byte-identical | — | — | — |
| ~~STOP 2~~ | ~~the composer's eye on `int2b1`~~ **ANSWERED day 35, all three** — (1) the id/label `int2b1` / "INT2 BLASTS — 81-111 s" **stands**; (2) the T1 breath: *"shorten just the t1 long tone leave the others"* — applied, T1 now 3.075 s ending 98.960, proved and seen in the app; (3) the two spread clusters **stand as drawn** (free/spatial reading — the composer's own criterion was "a GC and a notehead", and 121/121 have one). **THE SECTION IS CLOSED** | — | — | — |
| ~~DB2~~ | ~~THE DENSITY BUILD identified + cleared~~ **DONE day 35 (Fable, ninth sitting)** — it is the EXISTING GESTURE-2 x0.75 material (marker @55.94, `grp-gest2-75-01`, 129 notes 55.94-80.12, identical s26=s27, zero composer edits). Analysis + playability run + apply: 0 hard 0 soft, 92 bricks → 50 ms, ledgered. Two catches: wc-1624 sits AT 55.940 (build uses `--w0 55.9`); surge-inside-figure is a FIRST (visual verify point). Surge/fp handling confirmed from the registry + db1 precedent | — | — | — |
| ~~DB2-N~~ | ~~THE OPUS NOTATION RUN~~ **DONE day 35 (Opus, tenth sitting)** — `db2` built and figured: 129 events, 12 clusters, VALID, geometry clean, brackets-above from birth. The scan reframed the section (**12 gestures, 91 lone one-shots**; density is ACROSS parts). Pace-rule defaults took all twelve — no `--cuts`, no `--ownGrids`. **The named FIRST did not occur** (no surge inside a figure; 168 ms closest). Two brief corrections measured (9 surges not 8+1; the go-line assert restated to the LAW). Eleven batteries green; db1/int2b1 md5-identical | — | — | — |
| ~~DB2-FIX~~ | **PARKED AT THE POLISH (day 35, fifteenth sitting — composer: "we'll fix later at the polish").** Rounds 1-2 applied (beams/rests/cl-3 rewrite; dynamics from the established stack — 12 marks + 23 accents, proven confined). Parked for the polish pass: **vertical object placement (NITS, objects unspecified — ask)** · cl-50/cl-52 dynamics by ear · cl-50 STRADDLE · cl-55 no-clean-seam · T1 near-tie · nine short fp bars · T1/T2 facing band · cl-55's bracket-internal 8ths | — | — | polish pass opens |
| **DB3 — OPEN (playability DONE)** | **The final density build: marker @113.54 "DB3-m3F — density-build", `grp-db3-m3f-01`, 160 notes 113.00-135.77, all ten parts staggered T1→T10** (143 stacc + 10 fp + 7 ord). Playability applied: **0 hard 0 soft (clean from the start, no moves); 143 bricks → 50 ms; breath inside dials; audibility info 7.2 att/s, max 10 sounding.** `wc-2361` sits at 113.000, BEFORE the 113.54 marker → windows must use `--w0 112.9` (the wc-1624 lesson again). MAIN DRAFT proven untouched (golden 65/65 after the score edit) | — | — | — |
| ~~DB3-N~~ | ~~The Opus notation run~~ **DONE day 35 (Opus, sixteenth sitting)** — MAIN DRAFT is **"all notation so far (0-136 s)"**: window widened, **23 clusters `cl-62`–`cl-84` built WITH their dynamics in one build**. **866 events · VALID · geometry zero new.** The scan was the cleanest yet (**23 gestures, all one grid within a head; 0 straddles, 0 ties, 0 brackets — DB3 needs no tuplet**). `--validate` **81/84**, the three DIFFERS proven pre-existing. Tile-proof: **1263 added rows all ≥112.9, 0 removed, only the staff window bound changed.** Eleven batteries green; verified in the app | — | — | — |
| **DB3-EYE — NEXT (composer)** | **The eye on DB3.** Five 3-band clusters are PROPOSALS per the registry's own confidence note (**g3 T1 @134.14 · g6 T2 @134.14 · g7 T3 @131.97 · g8 T4 @131.70 · g9 T4 @133.15**); **the member-2 mark** (g4 T2 @131.60, g18 T8 @133.13) is an AI reading where "dynamic on the first sounding note" met "below-floor members get nothing" — **a new rule-collision DB2 never hit**; new facing band **T7/T8 133.1–133.5**. Full list: RUNNING_LOG sixteenth sitting | Fable | yes — clear before it | composer's verdicts applied |
| ~~MORPHS-10~~ | ~~The morphs to ten parts~~ **DONE day 35** — all three beds re-rendered and placed in `piece-s27` (BLOOM 106→133, CONVERGE 108→167, BALANCE 110→137 tones), MAIN DRAFT extended to **0-496 s** with them as bricks, MIDI verified on T9/T10. **BLOOM was a clean addition (106 of 106 survived); CONVERGE and BALANCE re-rendered** — the pair's insertion point renumbers the voices | — | — | — |
| ~~MORPH-NOTATION~~ | ~~The morph notation vocabulary~~ **DONE day 35** — designed live, piece by piece; **`tools/notate_morph.js` + `docs/MORPH_NOTATION.md`**; reference page `morph-x01` (BLOOM T1) reproduces from the tool exactly | — | — | — |


| ~~F2~~ | ~~The fold of `int2b1`/`db2` into one page~~ **DONE day 35 (thirteenth sitting) — the composer mandated it** (*"just keep one in the main section… keeps accumulating"*): **MAIN DRAFT — all notation so far (0-111 s)**, tile-proven identical (3833+1033+1043 rows), scoped-global era boundary, both pages pruned, picker manifest-driven | — | — | — || N | NEXT SECTION opens: the LONG TONE + DENSITY BUILD 2 on `piece-s26` — composer composes in the app; AI runs the density pipeline / measurements on request; notation later via new forks off db1 (`--bracketsAbove` from birth; facing-bands line tells the composer where clutter risk is BEFORE dictation) | Fable for design/verdicts · Opus for pipeline runs | clear before it (section boundary) | section material exists in `piece-s26` |
| ~~7~~ | ~~The two trance seams~~ **DONE day 35** — both pruned by the composer's rule; 0 overlaps in 3212 notes |
| **TRANCE-EYE — NEXT (composer)** | **Review `TRANCE A4 — 500-751 s`.** Quarter notes, 8 tempo bar lines, surges on the end crescendos, no text. The composer has not seen any of day 35's output yet | Fable | yes | verdicts |
| **TRANCE-FOLD** | Fold `--trance grp-tranceA4-01` into MAIN DRAFT once the eye approves, the same way the morphs went in | Opus | no | MAIN DRAFT 0-751 s |
| **MORPH-PARTS** | The composer's beating-frequency indicator + the ten pair recordings (PLANNER carries the table) | Fable | yes | design |
| — | Further out: PLAN 8 (Penn State deliverables, exports V4/V5), the tubist questions (PLAYABILITY_MODEL § Open), the breath rule as an auditor column, the paper's first pass (PAPER_NOTES "THE PAPER'S STRUCTURE") | — | — | — |

### The tools you will use (all verified day 24; **day 30: the c2i fork is FOLDED into `db1` and pruned — these rows now read `--ir db1`**)

| to… | run |
|---|---|
| see the page | `node score/server.js` → http://localhost:5200/notation/app/notation.html → pick **MAIN DRAFT — all notation so far** (internal id `db1` — every `--ir db1` below still applies; hard-reload after any `.js` change; data files hot-reload) |
| **read a part (8i — this is the report the reads use)** | `node tools/pattern_analyze.js --ir db1 --part N --span t0-t1` (**N is ZERO-indexed: T1 = `--part 0`, T2 = `--part 1` …** — day 29 tripped on this) — breath seams, then per gesture: the pace families and the groups in words ("even even · pair · short long"), then **THE WRITING, ONE GRID** (the fit, then one line per group with its bracket — `7:4 [16th 16th 16th]` or plain), then **FLAGS** (STRADDLES first, then ratio tie / no clean seam / cuts by hand / near-ties / pickups), then **FLOW**, then cut alternatives, and **each group on its OWN grid LAST** as the by-hand alternative, with the dotted reading where a group carries its own tuplet |
| **scan a whole section (8i — the pre-read measurement)** | `node tools/pattern_analyze.js --ir db1 --scan 36.19-40.42` — one row per gesture, every part: groups, one-grid unit and heads, its brackets, and the flags that need a hand. **Answers "can this gesture be said on ONE grid?"** — which replaced "how many figures need a tuplet" (that only measured how finely the material had been cut). *Measured on CLOUD02-I: 15 of 15 within a head, 5 straddles, 1 no-clean-seam, 5 ratio ties* |
| move a figure boundary | `--paceRatio <r>` (default 1.25) — how far apart two gaps must be to count as different PACES, which is what decides where a cut may land. `99` = one pace, no legal cut, the whole gesture as one group. Now on **both** tools (positional after `--cluster … --figures` on `notate_section`; plain flag on `pattern_analyze`) |
| **name the boundaries by hand (8h)** | `--cuts 2,5,7,10,14` — "cut after note 2, after note 5, …", numbered from 1 inside the gesture. The pace rule steps aside entirely. Positional after `--cluster … --figures` on `notate_section` (refused without `--figures`); a plain flag on `pattern_analyze` (refused when the span holds more than one gesture, and refused with `--scan`). A cut that would leave a one-note figure is refused with the reason |
| check the analyser still reproduces the composer's figures | `node tools/pattern_analyze.js --ir db1 --validate` (**81/84 as of day 35 sixteenth sitting** — three DIFFERS, all long-standing: `cl-1` T1 @31.55 · `cl-24` T2 @38.60 · `cl-30` T7 @36.19. **All 23 DB3 clusters agree.** *The old "24/25 — cl-1 only" was day 24's number at 25 clusters; cl-24/cl-30 arrived later.* To prove a DIFFERS pre-dates your change, copy the before-IR to `notation/ir/zzcheck.ir.json`, validate that, and delete it — do NOT name it `db1-*`, which the approved-span gate would discover as a fork) |
| build a figure | `--cluster t0-t1@part` on `tools/notate_section.js`, modifiers POSITIONAL after it: **`--figures` (8i: the groups from the pace rule on ONE grid, beams broken at the seams, brackets from the fit — the default and what the composer chose)** · **`--ownGrids`** (with `--figures`: the 8g/8h reading, each group on its own grid, no relation printed) · `--cuts a,b,c` · `--paceRatio r` · `--pattern` (one grid, no seams — implied by `--figures`, refused with it) · `--pickup N` · `--dyn 1:mf` · `--accents 1,3` · `--beamBreak n` (several groups on ONE tempo — refused with `--figures`, which makes its own breaks) · `--noGoLine` |
| **clear a span to bricks** (day 26) | `--bare t0-t1[@part]` on `notate_section.js` — every drawn device element off, brick stays; `@part` optional; errors if a note in the span already carries a figure. The trials fork carries `--bare 36.19-40.33`; **narrow it (or add `@part`) as each part gets figured** |
| rebuild the whole file | copy `provenance.build` out of `db1.ir.json` and run it; append new `--cluster …` groups to the end |
| **run the playability process on a section** | `node tools/playability.js --score piece-s25-finished01 --section <MARKER LABEL> --brick 0.05` (dry run; `--apply` makes the moves, normalises bricks, appends the ledger lines and prints the re-extract command; `--listen` writes a before/after score). **Day 31:** step **2b · COLLAPSE** re-seats a whole gesture when nobody is free (`--noCollapse` off); notes inside any IR's `--cluster` are **FROZEN** and the report says how many (`--refigure` lifts it, and the figures then need rebuilding); "UNRESOLVED" reads **"AT THE FLOOR"** once a gesture has been re-seated |
| **notate a BLOCK (day 35 — the generator)** | `node tools/notate_block.js --score <save> --group <id> [--ir db1] [--apply]` — a block = ONE INSTANT and ONE uniform drawn brick (a struck blast or a held long tone). **Day 35 fifth/sixth sitting:** a block may be MIXED — RING members (fp/cuivre/ord) take the written bar, SELF-DRAWING members (staccato) are left alone because the registry already draws them whole; an unknown technique still REFUSES. A block with no ring members is **VERIFIED, not built** (heads present, zero bars, nothing written). **"One instant" is now asserted**: attacks spread wider than the notes are long are refused as a gesture, with a pointer to `pattern_analyze`. Reads the group, derives the brick, decides **fork-vs-direct from the target IR window** (refuses with both commands printed when the block is outside it), emits `--ringFromBrick`, rebuilds from the IR own `provenance.build`, then **asserts and proves**: the device-gap assert (D72) + confinement (D73 — everything that moved belongs to this block, nothing else on the page did) + the bars measured against the brick. **Snapshots the IR and byte-restores it if any of that fails.** Idempotent |
| **normalise a whole COLUMN's written lengths** | `node tools/set_brick.js --score <save> --group <id> --brick <s> --technique any --why "<reason>" [--apply]` — **`--technique any`** (or `a,b`) is day 35: the composer's blast columns are MIXED, and their instruction is about the column, not a technique. `--why` puts the real reason in the ARCHIVE_AMENDMENTS line. **The "sound is unaffected" line is MEASURED, not recited** — true for a fixed one-shot (D51, sample length), FALSE for the ORD family, whose IR duration IS the drawn length (D9) |
| **find the blocks in a score** | `node tools/notate_block.js --score <save> --list` — every group with its shape; the ones marked `BLOCK` are what the generator handles. This is step 1 of the old seven-step hand process |
| **prove a page did not move** | `node tools/prove_unmoved.js --before <path> --after <ir-id\|path> [--expect-added N]` — the day-34 fold case: compare a page against a version of itself from git or an archive. `notate_block` calls the same library internally, so a generated rebuild proves itself without anyone remembering this |
| normalise one-shot written lengths | `node tools/set_brick.js --score <name> --group <id> --brick 0.05 [--apply]` |
| move ONE note by hand | `node tools/move_object.js --score piece-s25-finished01 --object wc-N --toPart P [--apply]`, then ledger it |
| batteries | `test_layout test_render test_animobj test_splice test_snapshots test_coords test_stamps test_pattern_fit test_midiplayer test_playability test_notate_block` — all green at close (**11 since day 35**) |

### Things to know before building anything (hard-won, day 24)

- **A fix for one figure must be re-checked against every figure built under
  the same flag.** The T6 pickup fix silently rewrote T3 into 32nds the composer
  had rejected; the composer caught it. `--validate` now exists for exactly this.
- **Screenshots beat troubleshooting.** Twice the composer "could not see" a
  figure because the AI had built it on the wrong notes (T6, T7 tails instead of
  the 33 s figures). Ask for / read the screenshot first.
- **The composer reads shapes, not tables.** When an analysis was too dense
  they said so; the plain form ("three even 8ths at 1 ms; the pickup 55 ms off")
  worked.
- **32nds are never wanted as written values.** Played heads stay 16ths. If the
  analyser's best reading needs 32nds, the grouping is probably wrong.
- **The one-notehead threshold** (30 ms on the video page) has the composer's
  eye on both sides of it; 1.2 heads was accepted once (T1's 3:2). Don't fight
  over 0.2 of a head.

### Open, not blocking

- the dotted-16th writing path is still unbuilt (less urgent under D69 — brackets are
  welcome; `dottedReading()` can offer it, nothing can write it; needs `noteUnits 1.5`
  in layout.js) · FLOW is a flag with no builder (take one by hand: `--tuplet a-b@3:2`)
- `flagShortBarSeconds` 1.0 → 0.35? (21 flags vs 3) · the cuivré MEDIUM vertical gap
  (NITS day 30 — composer deferred: a midway constant between tight 0.15 and the
  standard, then raise the marks; T8's fallback survives)
- `export_midi --ir` unbuilt (NITS) · G2/G3 formally unclosed on paper · notate_section
  prints a figures cluster's NEAR-TIE/PATTERN lines above its own header (NITS, cosmetic)

---

- **Day 30 (2026-08-23, Claude Code / Fable 5, one session):** THE CLOUD02-I MILESTONE —
  T4–T10 proposed by the five-check recipe and finalized through dictation rounds
  (T4 four rounds; T5–T10 accepted with refinements); the COUNTING-VS-PHRASE axis named
  by the composer and answered with CONTAINMENT (rules 10–12, A(a) closed); the hand-
  tuplet override built (sub-beat brackets); the section FOLDED into db1, fork pruned
  (validate golden kept); blast bars uniformed from the drawn brick; cuivré placed by
  dictation. Ten batteries green throughout; D-logs 10–22; PAPER_NOTES carries both
  sides verbatim.
- **Day 29:** T2 read (five verdict rounds) · T3 read (the tuplet version wins by
  engagement) · the BEAMING-DECISIONS ledger started (D-logs 1–9, rule candidates 1–9) ·
  beam vocabulary completed (through/rest16/over/overLeft tuplet-aware · bracket ends
  at content · hGapSs · ESC) · db1 rebeam promoted.
- **Day 28 (four sittings):** the T1 verdict → D68 two-sided seam rule (8h) → D69 the
  bracket is the message (8i built; t1-final IR-identical to the composer's page;
  --scan; five straddles forewarned).
- **Day 27:** PLAN 8g figure seams built; D67 (a cut lands where the pace changes).
- **Day 26:** --bare · Part 3 on T1 · D66 (players read patterns) · 8g approved.
- **Day 25:** THE PLAYABILITY PROCESS (D64, D65) — CLOUD02-I passes with 12 part moves.
- **Day 24:** density build 1 figured (25 clusters) · NOTATION_STANDARDS.md · D58–D63.
- **Day 23:** T1 figured note by note (D52–D57).
- **Day 22 (three sittings):** 8b machinery · THE COLLAPSE · the surge device · D49–D51.
- **Day 21:** V0–V3 closed — the pre-notation critical path; trance section finished.
- **Days 19-20:** notation architecture A–D (D44, D45); Penn State deliverables (8a).
- **Days 18-19:** trance section via console scripts (D41); E1+E1b (D43).
- **Days 12-17:** morphs (2v) · texture sandbox (2x) · cluster sandbox (2p) · density
  pipeline (2t) · collision avoidance (2r) · piece assembly.

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

8. **THE FRAME IS THE SCREEN'S SIZE — A JUDGING SURFACE MAY OWN ZERO
   CHROME. And presentation has THREE rungs, each of which failed once in
   one day:** (1) *payload right* — the 1920×1080 proofs were correct while
   the padded viewer page forced scrollbars that clipped the bottom lane;
   (2) *paint right* — the cursor-entry line was drawn UNDER the music
   panel's opaque background (paint ORDER is part of presentation); (3)
   *findable* — repainted correctly, the gray hairline still could not be
   FOUND beside ten bass clefs (pixel-verified present; salience, not
   rendering). The chrome trap then recurred a third time in the notation
   app (control bar + margins + scrollbars) despite being logged the same
   day. **Rules: any surface showing a full-frame render gets margins 0,
   suppressed scrollbars, auto-hiding controls, and a mechanical
   scrollW==clientW check at true viewport size; proof furniture's job is
   to be SEEN — color it.** *(2026-08-20, day 21, three instances; full
   trail in RUNNING_LOG.)*

9. **Before measuring the sample, check who sends the note-off.** (day 22,
   wc-23) A "sample sounds shorter than its table says" report had two
   candidate causes: the probe's tail is inaudible, or playback cuts it.
   One compiled number (note-off at the drawn 0.70 s = 47 % of the 1.49 s
   bar = "about halfway") pointed at the second; a one-variable probe
   (same note, note-off moved) and the composer's ear confirmed it in one
   listen. The 2n probe held every note 5 s — a one-shot table measured
   under a long hold says nothing about early note-offs.
11. **A "STANDARD" MAY ALREADY EXIST IN THE COMPOSER'S OWN TOOLS — SURVEY
   BEFORE INVENTING.** (day 23) Twice in one session the right answer was
   already on disk and merely unlocated: the tuplet bracket (101 of piece
   #2's 809 `.ly` files, settings unanimous — and the composer's memory of
   "3:2" was exactly the `calc-fraction-text` override they had chosen 29
   times) and the small notehead (piece #2's `cellMotive.scaleFactor
   0.844`, which the composer half-remembered as "there was already a
   formulation"). Rests, by contrast, genuinely did not exist anywhere in
   the lineage. **The order is: survey the corpus → if found, port and
   measure → only then capture.** A census (how many files, how many
   agree) is what turns "I think I did this once" into a standard.
12. **WHEN A SELECTION RULE PICKS SOMETHING ABSURD, THE RULE IS THE BUG.**
   (day 23, cluster tempo) "Coarsest grid that fits" chose 176 ms at 28 ms
   error over 175 ms at 20 ms. "Minimum error" then chose a 26.6 ms grid —
   64th notes, mathematically perfect, unreadable. Neither was a coding
   error; both were honest implementations of a wrong criterion. The fix
   was to score COMPLEXITY explicitly (playable floor, power-of-2
   subdivision, conductable beat, rests to read) and put that scoring in
   ONE module both the analysis tool and the page consume. **Running a
   rule on real material is how you find out what it actually optimises.**

10. **Glyph capture, short form, with the equality check.** (day 22) A new
   Emmentaler glyph = one LP fixture at the locked size + one extraction
   through piece #2's oracle modules (read-only) — NOT the 10-step
   protocol, whose other steps discovered numbers that are now locked.
   Always re-extract one already-ported glyph in the same run: a
   byte-identical path is the proof the pipeline is the same one.

11. **A GUARD MUST ANNOUNCE WHEN IT IS NOT RUNNING, AND MUST DERIVE ITS OWN
   SCOPE.** (day 34) The approved-span gate named its target file literally
   (`db1-c2d-x01`) and was `existsSync`-guarded, so folding-and-pruning the fork
   silenced it **while the battery kept printing GREEN** — the failure was never a
   wrong assertion, it was an assertion that stopped existing without saying so.
   Its span was hardcoded too (`t < 42`), which was one section's number: woken
   as-was it would have "passed" while ignoring 4.4 s of approved page. Both
   halves generalise: a guard **discovers** what to check (here, from the picker
   index) and **derives** how much to check (the min start of any figure the fork
   adds or changes), and prints `NOT APPLICABLE` when there is nothing to check.
   *Corollary for verification: `ok()` prints only on failure, so a passing guard
   is invisible — the only proof a guard works is making it go red on purpose.*

## §4 Decisions

- **D75** *(2026-08-24, day 35)* — **THE SAVE FILE IS IDENTIFIED BY ITS CONTENT, NEVER BY
  ITS TIMESTAMP — AND `-work` IS NOT THE PIECE.** Asked which save file the new page should
  come from, the composer named `piece-s25-finished01-work`. Measured, it is **behind** the
  archive by the whole playability pass: 173 objects differ — **157 brick lengths** and
  **28 part assignments** — and the direction is settled by content, not by date
  (`grp-cloud02-i-01` has ONE brick length in the archive, 0.05 s, and **65** in `-work`).
  **The trap is that `-work` looks newer:** its `savedAt` is three days ahead, because the
  playability fixes were applied by TOOLS (`playability.js --apply`, `set_brick.js
  --apply`), which rewrite a score without touching the app's stamp. **So the freshest
  timestamp marked the file missing the work.** Two structural reasons it was reachable at
  all: `score/server.js listScores()` filters on nothing but `.json`, so `-work` copies sit
  in the picker beside real saves; and `scores/*-work.json` is gitignored, so git never
  showed it either — **invisible to git, prominent in the UI, which is the exact profile of
  a file chosen by mistake.** *The rule:* before extracting an IR or running any --apply
  against a named score, diff it object-by-object against the canonical one and say what
  differs; a timestamp is not evidence of currency. *Not deleted:* `-work` holds zero
  objects the others lack, so it is harmless where it sits and the app remakes it on the
  next open — but it is never a source. **The canonical pair stays: `piece-s25-finished01`
  frozen as the CLOUD02-D-era canon db1 refers to, and `piece-s26` as where new
  composition grows.**

- **D74** *(2026-08-24, day 35)* — **THE LONG TONE IS SPELLED B FLAT, AND THE PAGE ALREADY
  DRAWN IS LEFT ALONE.** The ten pitches of the octaves-Bb long tone at 48.05 are spelled
  A♯ in the IR (`step A, alter 1`) and the page draws ten sharps, while the composer's
  marker and their words both say "octaves Bb". Asked twice; the composer: *"bb but no need
  to update anything already build"*. **So: B flat is the spelling for this material going
  forward; the 48.05 page keeps its sharps.** *Why the second half matters as much as the
  first:* a retrofit would rebuild an approved page, spend a proof, and change nothing a
  player reads differently at sight — the composer priced the correction against the work
  and declined it. **The general form: a decision about future material does not
  automatically reach backwards.** Enharmonic spelling stays a composer call either way
  (the extractor derives it from MIDI, and nothing in the pipeline should be inferring it).

- **D73** *(2026-08-24, day 35)* — **THE PROOF OF A TARGETED REBUILD IS CONFINEMENT, NOT
  STILLNESS.** Day 34's fold and day 35's long tone both hand-rolled a before/after layout
  diff, and both reported the same shape: **ADDED n / REMOVED 0 / CHANGED 0**. The block
  generator's golden showed that shape is not general. Writing `--ringFromBrick` onto the
  **ord** long tone at 48.05 **adds** ten ring bars, because the `ord` registry entry has no
  `ringBar` and there was nothing there (that is D72). Writing the **same flag** onto the
  **fortepiano/cuivre** blast at 40.93 **changes** ten, because those techniques already
  draw a bar and the flag only re-sizes it from the ragged sample lengths (1.14 … 1.60 s)
  to the uniform drawn brick (1.01 s). Same instruction, same material class, two different
  diffs — so `CHANGED 0` as a success condition would have made the tool **refuse a correct
  rebuild of the composer's own approved page.** **What is asserted instead:** every item
  added, removed or changed belongs to an event this command was aimed at, **and nothing
  else on the page moved at all** — plus the ask measured directly (*10/10 notes carry a
  ring bar, one length, equal to the drawn brick*). *What it rejects:* counting the diff.
  A count is a proxy for the claim; naming WHICH ink may move is the claim. `isClean()`
  (nothing moved at all) is kept, because it is still the right question for a **fold**,
  where by definition nothing should move. *How it was found:* only by replaying BOTH
  hand-notated instances. With one, the machine would have shipped a success condition that
  was an accident of one registry entry.

- **D72** *(2026-08-24, day 35)* — **A DEVICE FLAG MUST TURN ITS DEVICE ON, NOT ONLY
  SIZE IT.** `--ringFromBrick` wrote `device.ringSeconds` only; layout draws a ring bar
  solely under `device.ringBar`, which the registry grants **fortepiano** and **cuivre**
  but not **ord** (its day-24 provisional entry). So on the composer's ord long tone at
  48.05 the flag would have written a 4.41 s length for a bar that is never drawn — and
  the tool would have printed `10 ring bar(s) written from the drawn brick` over a blank
  page. **Fixed at the FLAG** (it now writes `{ringSeconds, ringBar:true}`), because
  naming a span in that flag IS the request for the bar. *Rejected:* adding `ringBar` to
  the `ord` registry entry — global to every ord note in every IR (trance included), and
  that entry is explicitly provisional, so it is a composer design call, not a side
  effect of notating one section. **The general rule:** before writing a device field,
  check that the technique's resolved device actually draws the thing — and never let a
  success line describe an effect it did not verify.

- **D71** *(2026-08-24, day 35)* — **THE MODEL IS A CLEAR TRIGGER, AND THE DYING SESSION
  DOES THE REMEMBERING.** `/postclear` read only the checkpoint entry — *"and nothing
  older"*, by explicit rule — so the post-clear session never saw §2's standing blocks
  (tool table, laws, NEXT STEPS) and kept coming back missing context; the composer had
  fallen back to `/session-start` after every clear, paying full orientation each time.
  **Now:** `/postclear` reads ALL of §2 + `NOW ►` + a **`Resume reads:`** list the checkpoint
  writes (the dying session is the only one that knows what else matters). And the
  **MODEL joins subject and length as a reason to clear**: clear before any Fable block
  however short the chat (Fable re-reads carried context against its own weekly credits);
  clear lazily on Opus; **run either wrap on Opus** — it is mechanical work at the
  expensive end of a session. *Rejected:* the leanest read-set (checkpoint entry only) —
  the ~2k tokens it saved are what caused the loss.

- **D70** *(2026-08-24, day 34)* — **A SECTION FOLDS INTO db1 *WITH* THE POLICY IT WAS
  BUILT UNDER, AND THE FOLD MUST BE PROVEN, NOT ARGUED.** CLOUD02-D was figured on a
  fork carrying `--bracketsAbove --articSide --dynSide`; db1 carried none of them. Day 33
  left the choice open in NITS: fold WITH the policy (feared to flip db1's below-brackets
  everywhere, forcing a re-look at approved pages) or keep db1 as-approved and let the
  policy stay per-section. **Folded WITH it.** *Why:* the feared re-look does not exist,
  and that is a measurement, not a judgement — **425 approved layout rows (tuplets, beams,
  accents, dynamics below the fork's first new figure) are IDENTICAL before and after.**
  The policy is a no-op on classic stem-up stacks; the composer's page did not move.
  *What it rejects:* per-section policy flags — one page under two engraving regimes would
  make "which section is this bracket obeying?" a question the composer has to ask, which
  is the same confusion the bracket-above policy was adopted to end. *The general form:*
  a fold is a rename, not a rebuild — the fork already IS db1 plus the new section, so the
  only question a fold can raise is whether the rebuild disturbed approved material, and
  that question has a number.

- **D69** *(2026-08-23, day 28, third sitting)* — **THE BRACKET IS THE MESSAGE: A PACE
  CHANGE MUST BE SAID ON THE PAGE.** The composer's groups (8h) are the unit of
  grouping; they are NOT each put on their own grid. The gesture stays on ONE grid, the
  groups become beam groups, and the tuplet bracket the fit places on a quicker group is
  the communication of the pace change to the performer. *Composer, verbatim:* "my mental
  model is that there should be some communication to the performer if there is a speed
  change... the first two sixteenth notes look much further apart than the next three.
  And so the seven-four bracket is appropriate." *Why:* two 16ths far apart followed by
  three close together, all written as plain 16ths, is a page whose VALUES say "same"
  while its SPACING says "different" — the values lie, and the bracket is the correction.
  *What it reverses:* 8g's notation conclusion (D66's "a tuplet bracket bought to hold two
  unrelated paces together is ink that buys nothing", and principle 6's "figures need not
  share a tempo; no tempo is printed") — the bracket buys the message. *What it keeps:*
  D66's grouping insight (the figure is the unit the player recognises) and D67/D68's
  seam rule (where the groups are). T1's final is `t1-hybrid2`: ONE grid, six beam
  groups, 7:4 · 6:4 · 7:4 — the day-26 one-grid page with the beams broken at the right
  places; the 8g–8h detour found the grouping and the writing came back to where it
  started with the groups visible. *Rejected:* (a) own grids, no bracket (`t1-figures2`,
  the AI's lean) — the values lie; (b) pairwise shared grids at the clean ratio (figure
  2 against figure 1 is 1.51 ≈ 3:2, and on figure 1's grid the first five are `16th 16th
  | 3:2` at 0.17 heads against the 7:4 at 0.7) — deferred, the composer's call B(a):
  FLOW stays a flag, taken by hand where wanted; (c) bracket scope = figure instead of
  beat — deferred, call A(a): on T1 the fit's tuplet beats and the groups coincide
  (seams ARE pace changes); a bracket straddling a seam is flagged and watched for in
  the reads, fixed only if it appears and the composer wants it. *Consequence for the
  measurements:* "figures needing a tuplet" (0 on day 27, 3 on day 28) stops being a
  score — it measured how finely the material had been cut; the number that matters is
  **how many gestures' ONE grid is within a head**, because where it is not, the page
  cannot say the relation and that gesture is by hand. Build: PLAN 8i, **BUILT day 28
  (fourth sitting)** — `t1-final`, built from the rule with no `--cuts` and no
  `--beamBreak`, is IR-identical to the hand-typed `t1-hybrid2` on every drawn field.
  *Two things the build measured, both of which bear on the deferrals above:* the new
  `--scan` says **all 15 gestures of CLOUD02-I sit within a head on one grid** (so (a)
  is never forced anywhere in this section), and **five carry a bracket that STRADDLES a
  seam** (T2 @38.60, T4 @36.20 ×3, T9 @36.33, T9 @37.39, T10 @38.69) — so deferral (c),
  call A(a), is live in a third of the section and comes to the composer part by part.
  On T1 itself the three brackets cover notes **3–5, 6–7 and 12–14** (not 11–14 as the
  plan predicted — note 11 sits in the plain beat before the septuplet), and no bracket
  leaves its group. Trail: RUNNING_LOG day 28 third + fourth entries, COMPOSER_LOG day
  28, PAPER_NOTES day 28.

- **D68** *(2026-08-23, day 28)* — **THE SEAM IS THE SLOWER GAP: THE BOUNDARY NOTE GOES
  WITH THE QUICK SIDE.** D67 says a cut lands where the pace changes; it did not say
  which of the two notes at that change belongs to which figure, and the day-27 code
  answered by comparing the seam gap with the gap BEFORE it only. At a slow→quick
  change that one-sided test makes the QUICK gap the seam, so the pace-change note
  lands on the slow side. On T1 it produced cuts after 3 and 8 where the composer's
  ear said 2 and 7 — **two boundaries, each one note late, each in the same
  direction**, which is what a systematic defect looks like and not what taste looks
  like. **The rule: a seam is a gap that is NOT QUICKER THAN EITHER NEIGHBOUR and is a
  pace change from at least one of them** — a banded local maximum. In code, with
  bands ascending (0 = quickest): `s >= L && (R === null || s >= R) && (s !== L || (R
  !== null && s !== R))`. *Provenance:* this is Lerdahl & Jackendoff's GPR 2b (a group
  boundary falls at the greater inter-onset interval), banded so that "greater" means
  "a different pace to the eye" rather than "larger by any amount". *Measured:* on T1
  the legal set becomes exactly the composer's five (2, 5, 7, 10, 14) and the search
  takes all five; 13 of the 15 gestures in CLOUD02-I read differently under it.
  *Rejected:* (a) leaving the rule one-sided and moving the boundaries by hand per
  case — it would have been five hand corrections in T1 alone and no rule for T2–T10;
  (b) a cost-weighted soft preference for the slower side — rejected as the direct
  lesson of D67, because a tuned weight is not a structural answer and the next
  gesture would re-open it. *Standing consequences:* two boundaries the rule cannot
  settle are now SAID rather than silently chosen — a **RATIO TIE** where the reading
  hangs on `PACE_RATIO` itself (T1's 7-vs-8 flips at 1.272, where the 304 ms gap joins
  the 239 ms band), and **NO CLEAN SEAM** where nothing is legal and the one grid
  cannot write the gesture plainly (T7 @36.19 — by ear). `--cuts a,b,c` on both tools
  lets the composer name the seams outright; each figure is still fitted alone.
  *And the claim it killed:* the day-27 finding "not one figure in CLOUD02-I needs a
  tuplet" is **false** under the corrected rule — three figures do (T7 ×2, T8 ×1).
  The old rule cut MORE (60 figures against 55) and short figures fit for free, so
  "no tuplet anywhere" was partly an artifact of over-cutting; the worst displacement
  across the section nonetheless improved, 1.00 → 0.93 heads. Trail: RUNNING_LOG day 28.

- **D67** *(2026-08-23, day 27)* — **A CUT LANDS WHERE THE PACE CHANGES; THE FIT
  COST ALONE CANNOT FIND THE FIGURES.** PLAN 8g specified the segmenter as "every
  cut set, cost from the `fit()` ranking + CUT_COST per cut". **That model provably
  cannot reproduce the composer's own day-26 reading of T1, for any CUT_COST** — the
  hand reading has BOTH more figures and a higher figure-cost than the reading the DP
  prefers (2.96 + 4·C vs 2.50 + 2·C), because notes 1–5 need a quintuplet while notes
  1–2 are a *pair*, and a pair always fits exactly, for free. So the rule was taken
  from the composer's own method instead of from the cost: day 26 sorted the gaps into
  pace families (~157 / ~245 / ~300 ms) and read the runs, so **the seam gap must be
  in a different pace band from the gap before it — a figure ends when the pace
  changes, never in the middle of an even stream.** Plus a second term from the same
  source ("players do pattern recognition"): **a figure is short** — `SOFT_MAX_NOTES 6`,
  the largest figure in the decided section-1 vocabulary. *Why it matters beyond T1:*
  the pace rule makes NO-SHATTER STRUCTURAL rather than tuned — an even run has no pace
  change in it, so it has no legal cut whatever the weights are — and stability went
  from 10 % to 67 % of the ±20 % weight neighbourhood. *Rejected, with evidence:* a
  figure-length term alone (0 hits on the golden across 2 187 weight sets) · a
  seam-scaled cut cost (closest — 3 of 4 cuts — but 10 % robust, and it has the sign
  backwards for note 11, whose gap is small) · local-maximum gap detection (two cuts
  off by one note). *Standing consequence:* the tool proposes and flags; **the ear
  disposes.** It keeps 3 of the composer's 4 cuts, flags note 11 as they did, and makes
  one cut they did not (after note 3) that removes the quintuplet — offered, not taken.
  Trail: RUNNING_LOG day 27.

- **D66** *(2026-08-23, day 26)* — **THE FIGURE IS THE UNIT: PLAYERS READ
  PATTERNS, NOT TEMPOS.** The notation sits between Ferneyhough (strict metric) and
  Stone / Xenakis's *Mists* (time-space). A player in real time does pattern
  recognition: two "long short short" figures at different spacings are one pattern
  twice, and the page's spacing plus the scrolling cursor absorb the tempo difference —
  no tempo change is perceived, none is cued. So figures INSIDE one gesture take their
  own fit (principle 6, now implemented as PLAN 8g); one GC and go per gesture; the only
  failure is *cognitive dissonance*, when visibly-unequal spacing pushes past the eye's
  "mental rounding" — the one-notehead threshold of D63, now with its psychology — and
  only then must the notation itself say "very long, medium, shorter" (a tuplet, or a
  separate figure). Verbatim: COMPOSER_LOG day 26. *Why:* T1 of CLOUD02-I — one breath
  seam, one 16-note cluster; the one grid for it needs 7:4 · 6:4 · 7:4; cut at the pace
  changes, five figures all under 0.6 heads. *Rejected:* treating each figure's tempo
  as a cue event (the AI's question "five tempo changes under one go?" — the wrong
  frame) · one grid per gesture (legal at 0.7 heads and unreadable).

- **D65** *(2026-08-23, day 25)* — **A FIXTURE MUST NEVER BE A FILE THE TOOLS
  REWRITE.** The golden for `test_playability` was `scores/cloud02i-orig.json`, which
  `cloud02i_ab.js --isolate` regenerates from the CURRENT archive — so the moment the
  archive was amended it silently became the "after", and the test would have passed
  while measuring nothing. Recovered from git into
  `tools/fixtures/cloud02i-preamend.json`. *Rejected:* keeping it in `scores/` with a
  do-not-overwrite comment.

- **D64** *(2026-08-23, day 25)* — **PLAYABILITY LOOP BEFORE NOTATION.** Composer:
  *"moving forward, let's make sure to do a playability loop before notating, as we're
  doing now."* Audit (hard/soft re-attack) + breath sweep on the material,
  redistribution fixes ledgered, THEN figures. NOTATION_WORKFLOW §1 step 0; model and
  results in `docs/PLAYABILITY_MODEL.md`; the tool is `tools/playability.js`. *Why:*
  day 24 figured cl-1 with four octave-plus leaps at 155–200 ms nobody had checked.
  *Rejected:* auditing after notation — the figures would have to be rebuilt.

- **D63** *(2026-08-23, day 24 late)* — **PATTERN BEFORE GRID.** The
  cluster notation exists to show the figure's long-short PATTERN so it is
  played as one unit from one go; the proportional page already guarantees
  the timing. The analysis therefore optimises pattern fidelity AS SEEN — the
  worst displacement, in noteheads at page scale (one head = 6.9 px = 30 ms on
  the video page), between where the notation implies a note and where it
  truly is — with simplicity only as a tie-break, and tuplets (3, 5, 7:5)
  admitted when they win. Group by gaps first; figures need not share a tempo.
  **Rejected:** the day-23 objective (smallest ms error within a tolerance,
  tuplets penalised) — accurate to 20 ms and categorically wrong is possible
  under it (four equal 16ths over medium-short-long spacing). **Kept:** the
  ms guard, inverted — no tuplet over spacing that does not show one (T7's
  24 ms tell). Pickups stay subjective: AI proposes and flags, the composer
  confirms. Theory: Desain & Honing 2003, rhythm categorisation. *Nothing on
  the page changed; the analyser is the next build, validated against the 25
  decided figures first.*
- **D62** *(2026-08-22, day 24)* — **CLUSTERS ARE "GO, THEN COUNT"; ONE-SHOTS
  ARE "GO". Rests are INCLUDED in clusters and SPLIT AT THE BEAT, with no
  tempo marking on the page.** Composer: *"if one-shots are just a go, then the
  clusters are a go, then count... it more or less describes a single tempo
  even though I'm not marking the tempo... the groupings by beaming suggest the
  pattern or phrasing... rests separated for counting are appropriate here...
  the whole cluster figure is mediated by the scrolling bar."* Each element has
  one job: GC = launch · beams = phrase · rests = beat · scroll bar = correction.
  **Rejected:** (a) Stone's time-space reading (no rests, uniform heads,
  distance = duration) — the partials are written as beamed 16ths, i.e. metric
  VALUES, and a system that writes values but omits rests belongs to neither
  tradition; (b) the Xenakis-*Mists* reading the composer named (beams as
  clumping, no rests, rely wholly on the bar) — coherent only with its own
  conventions (no value-bearing beam levels), which would also make the D56
  tempo fit largely pointless; (c) a printed tempo mark — the composer
  disagreed; the tempo is implied by the figure and set by the player from
  the first intervals. *Status: the split-at-beat rest rule is decided in
  principle; the build awaits the composer's word after the AI's input.*
- **D61** *(2026-08-22, day 24)* — **RESTS ALIGN LIKE NOTEHEADS: LEFT EDGE ON
  THE MOMENT THE SILENCE BEGINS.** Researched at the composer's request.
  Conventional engraving (Gould, Ross, Read; LilyPond/Dorico/Sibelius
  defaults) gives a rest the position and spacing a note of its value would
  take and aligns it left with other voices; the whole-bar rest is the one
  floating exception and is a different symbol. Stone reports the same for
  proportional notation (rests usually omitted; when kept, they mark the
  start). **Rejected, both measured wrong:** the day-23 drawing (glyph
  CENTRED on its slot — half of it hanging into the previous note, the
  "hugging" the composer saw) and the AI's first day-24 fix (centred in the
  whole silence — plausible from "x is time", supported by no tradition).
  Vertical placement confirmed as LilyPond's own per-glyph metrics and left
  untouched (the 16th hangs 0.49 ss low by the alternating-hook rule).
- **D60** *(2026-08-22, day 24)* — **THE GC BALL LANDS ON THE LANE EDGE**
  (`impactInsetPx` 5 → 0, in both registry copies; `test_animobj` asserts
  they agree). Why: the disc occupied y −6.39..−5.37 ss while 42 % of the
  section's staccatos sit at C2 or lower; measured, 3 of 7 GC-bearing figure
  notes collided with it. After: 0 of 7; only midi 29–30 still touch, by a
  ledger line. **Corrects day 23's** *"vertical separation is impossible
  because the marker's height IS the object"* — the landing height is a chosen
  number, not a property of the GC. **Rejected:** accepting the overlap
  (1+1=3 at the datum); displacing cluster downbeats like one-shots (the one
  head not on its time would be the downbeat); lightening the disc (rejected
  day 23, still wrong). Composer's ear on the landing in motion still owed.
- **D59** *(2026-08-22, day 24)* — **ALIGNMENT: THE NOTEHEAD'S LEFT EDGE IS
  THE MOMENT.** Confirmed for clusters (`figures.cluster.nhAnchor: leftEdge`,
  31 of 31 heads measured at 0.000 ss deviation) and adopted as the piece's
  general principle. Time-space notation (Feldman, Brown, Cage) puts the attack
  where the head begins; conventional engraving aligns simultaneities on left
  edges; the composer's scrolling-reader argument says the cursor touches the
  head as the note starts. **Rejected:** centre alignment — no tradition
  behind it (whole notes are the only debated case). *Open consequence:* the
  beam figures still use `headCenter` at the composer's earlier instruction;
  under D59 that is now the inconsistent one, to be revisited when those
  figures are reviewed.
- **D58** *(2026-08-22, day 24)* — **THE GO LINE MARKS DISPLACEMENT.** A go
  line belongs on a unit whose head is NOT on its go time (one-shots hang
  0.6 ss before, to clear the GC disc; the surge) and on nothing else; a
  cluster partial with its left edge on its go time gets none. In the
  composer's own earlier words: *"the other go lines are there because the
  notation doesn't line up with the go time."* This also explains the
  unrecorded day-23 reversal (Option B dropped the staccato's go line; the
  composer restored it hours later — correct, that unit IS displaced).
  **Rolled out per figure** at the composer's request (`--noGoLine`, T1's
  cl-1 first) so each is seen before the registry default flips.
  **Rejected:** go lines everywhere (a third "when" mark at the one place
  that must not be ambiguous); go lines nowhere (the displaced one-shot unit
  then floats without its time).
- **D57** *(2026-08-22, day 23)* — **THE TUPLET STANDARD IS THE COMPOSER'S
  OWN LILYPOND PRACTICE, surveyed then measured.** 101 of piece #2's 809
  `.ly` files carry tuplets; the settings never vary where they appear:
  `TupletBracket.direction #UP` (29/29), `bracket-visibility ##t`,
  `padding 0.5`, `TupletNumber.text = tuplet-number::calc-fraction-text`
  (29/32 — the override that prints **"3:2"** instead of a bare "3"),
  `font-size #-5`, plus the composer's own `flatten-tuplet-bracket` scheme
  function, which levels both ends = the straight bracket they remembered.
  Measured by probe: thickness 0.16 ss, hook 0.7, horizontal in two
  segments with a 2.6388 ss numeral gap inset 0.40, numeral baseline 0.41
  BELOW the line, size 1.2348 italic. **No glyph tracing needed** — LP
  draws the bracket as strokes and typesets the numeral as text, so this
  app does the same in its own font. *Rejected:* inventing a house
  bracket; capturing digit glyphs.
- **D56** *(2026-08-22, day 23)* — **A CLUSTER IS A COMPOSER-NAMED SPAN,
  AND ITS RHYTHM IS AN ANALYSIS, NOT A GUESS.** `--cluster t0-t1` writes
  authored `engraving` overlays; `notation/lib/cluster_fit.js` runs an
  exhaustive unit search (20–500 ms) scored on COMPLEXITY — a grid finer
  than D43's 0.09 s playable floor is disqualified, non-power-of-2 costs a
  tuplet level, an unconductable beat and extra rests cost a little — and
  the same module feeds both the analysis tool and the page, so they
  cannot disagree. A single-unit grid can never produce NESTED tuplets by
  construction, which answers the composer's original worry. *Two wrong
  selection rules were caught by running them:* "coarsest that fits" took
  176 ms at 28 ms error over 175 at 20; "minimum error" took a 26.6 ms
  grid (64ths) — precise and unreadable.
- **D55** *(2026-08-22, day 23)* — **A RING BAR ENDS A BREATH BEFORE THE
  NEXT GESTURE.** bar = min(sample length, next attack − `breathSeconds`
  0.5). The sample only CAPS it, so a note with room keeps its full ring
  and nothing earlier in the piece is affected. Drawing only: playback
  still follows the IR duration (D49), because the sample rings what it
  rings. A moderately quick tuba breath ≈ 0.5 s (snatch 0.25–0.35; full
  1–1.5). Simultaneities are not a "next attack". *Rejected:* subtracting
  the breath from the sample length (the composer corrected this within
  the hour — it must be measured backwards from the next gesture).
- **D54** *(2026-08-22, day 23)* — **TUBISTS READ LEDGER LINES: NO OTTAVA
  IN THIS PIECE** (`ledgerLineThreshold` 3 → 4; F#1, the lowest note, is
  exactly 4 ledgers). Piece #2's 3 was piano-derived. Consequence,
  measured: the lowest notes then reach the lane edge and NOTHING fits
  below them, so **the column chain flips to the side with room**
  (`chainSide.sideWithRoom`), referenced against the outer ink OR the
  outer staff line, whichever is further out. *Rejected:* a smaller staff
  (re-opens G0); letting chrome overflow into the neighbour's lane.
- **D53** *(2026-08-22, day 23)* — **"GC" MEANS THE WHOLE OBJECT, AND IT
  IS PORTED, NOT DESIGNED.** Composer: *"when I say GC, that is the whole
  thing... the same colors, the same lines, and line thickness, and then
  those trajectory... and the ball should be the same color, the same size
  as in those scores."* `notation/lib/gc.js` carries piece #1's
  `calculateTrajectory`/`renderGC`/`update` verbatim: static arc (201-pt
  polyline across TIME, 1.5 px, neonMagenta rgb(255,21,160)) + impact
  marker (r 4 px at laneBottom − 5) + ball (r 5 px) — one module for both
  consumers, so the drawn arc and the moving ball cannot drift. Preset =
  piece #1's "Short" (62/100/90/60/0.6), the one all 43 GCs of its 6:10
  section carry; piece #2's 203 GCs are all "Medium" — **they differ**.
  **Z-order** (composer: "carry that as a decision"): staff · go line · GC
  static ink · NOTATION · the animated overlay (ball 0.85, cursor) on top.
  *Rejected:* two rounds of AI-designed staging (staff-step ball, then a
  lane-spanning one) — the look existed already and was to be copied.
- **D52** *(2026-08-22, day 23)* — **A ONE-SHOT'S DYNAMIC IS ONE MARK FROM
  FIVE WIDE BANDS, LOOKED UP FROM THE CAPTURED VELOCITY.** IR schema
  amendment 5 (`vel`); registry `dynamicBands` ppp ≤45 · p ≤75 · mf ≤100 ·
  f ≤118 · fff ≤127 (PROVISIONAL until the SI2 velocity→dB ladder);
  device `dynMark: 'band'`. Composer: *"go from ppp to fff and collapse
  some of the middle range — five categories is fine, but more distinct
  jumps."* Grounded in `docs/DYNAMICS_FRAMEWORK.md`: ~5 loudness
  categories are identifiable (Miller), markings are relative not absolute
  (Kosta et al.; Ligeti), shape transmits better than level (Nakamura),
  and timbre is half of perceived dynamic on brass (Fabiani & Friberg).
  For a GROUP, the ambient-plus-deviation form: one mark plus accents on
  the departures — first applied on the day-23 cluster. *Rejected:*
  per-note values (unplayable and inaudible — the Structures Ia lesson).
- **D51** *(2026-08-21, day 22 — wc-23)* — **A FIXED ONE-SHOT'S NOTATED
  LENGTH IS ITS MEASURED SAMPLE LENGTH, and the page shows it as THE RING
  BAR.** Composer: *"we'll just go with that length because it sounds
  good"* (2n table: G#1 fp = 1.49 s). The bar runs from the go line to
  onset + sounding length, centered on the written head, ⅔ brick height,
  black at 0.65. The dynamic is a single engraved mark on the column's
  dynamic slot (**sfzp** for fortepiano — composer's choice after the
  fp/sfp/sfzp briefing). *Rejected:* the drawn object length (0.70 s — it
  was a hand-drawn approximation, and it was cutting the sample); a
  derived dynamic (marks state levels, never derive — the day-22 rule).
- **D50** *(2026-08-21, day 22 — wc-23)* — **DEVICE MEMBERSHIP IS REGISTRY
  DATA, and the unit of notation work is THE NOTE in source order.**
  `engraving.layout.devices`: byEnv (surge) → byTechnique (fortepiano) →
  per-item `device:{}` override; one builder per element (nh-unit, go line,
  ring bar, dyn pair, dyn mark, ottava). A settled note's device reaches its
  siblings through the technique entry (§6 derivation). Composer's reframe:
  *"I want to work on next note regardless if it is a fortepiano or not"*
  — design the note, let the registry generalize. *Rejected:* a second
  code block per technique (branches are where the bugs live); designing
  "the fp device" as a category up front.
- **D49** *(2026-08-21, day 22 — wc-23)* — **THE ARCHIVE IS FROZEN; THE IR
  IS AUTHORITATIVE FOR SOUND; AMENDMENTS ARE A LEDGER.** When notation
  finds a "finished" archive object wrong (wc-23's note-off cut its 1.49 s
  sample at 0.70 s — composer's ear, x03 probe), the correction lives in
  the IR (systematic → extractor rule; singular → override), the notation
  app plays the IR (`midiplayer.withIrDurations`, a per-play clone), every
  amendment gets a line in `docs/ARCHIVE_AMENDMENTS.md`, and folding back
  into the archive is an explicit composer act. *Rejected:* editing the
  archive score as a side effect; changing sonify_core's note-off law (it
  is composer.html's extracted twin with a parity battery — the app would
  have had to change too). Known divergence: export_midi renders (NITS).
- **D48** *(2026-08-20, day 21 — deliverables sitting)* — **THE
  DECIDE-VS-DEFER FILTER: composer eye-time goes to LOCK-INS only.**
  *"Effective tests are ones that tell us flaws in the architecture… if
  it's variable later during the polish run, let's just defer these
  decisions."* Anything data-variable gets a provisional default and
  waits for POL; only structure-affecting choices are decided up front.
  Applied to close V0/G0 same day: decided = frame 1920×1080 · no header
  (video) · staff 31.6 px · budget policy A · Crimson Pro Light · PP-3;
  deferred-as-data = gutter width 48 · zoom Z=2 · META styling · print
  numbers · animated styling; deferred-to-motion = system turn + C/D time
  scales (V2 gate). *Rejected:* closing every tier-1 number by eye before
  building — the original G0 framing.
- **D47** *(2026-08-20, day 21)* — **THE VIDEO SCORE REJOINS THE ONE-SPINE
  ARCHITECTURE: realization = config, clock = interface, one timeline.**
  Composer: one score *"lives in the data"* with *"various realizations…
  all synced to the same timeline"* — this build must plug in, not sit
  beside. Three binding invariants ([A21b] in the build plan):
  (1) every realization keys to S1 seconds, no private timebases;
  (2) transports implement one interface (now/play/pause/seek in S1
  seconds) — cursor and animated objects consume `t` only, enforced by
  source check; local audio-slaved here, D45's networked transport later,
  same interface; (3) `container.json` holds NAMED realization entries —
  the future "conductor score = this one + bells and whistles" is a new
  entry, never a fork. **D45 is thereby a PROJECT boundary, not a system
  boundary.**
- **D46** *(2026-08-20, day 21)* — **ANIMATION ≠ INTERACTIVITY: the
  animated graphic objects of pieces #1/#2 ARE in the video score.**
  Composer: *"I will be using probably all of the animated objects"* —
  wave-curve/curve following (gliss, crescendos), GCs (beat grids,
  single-shot events), line wedges. The original V2 fence ("no GC ball —
  D45 territory") cut at the wrong joint. Re-cut: animated objects on the
  shared fixed timeline are IN (V2's pure `state(t) → SVG` contract —
  both prior apps' overlays are already t-parameterized, so it is a
  port); what stays severed is interactivity (leader/follower, per-player
  views, networked sync, rehearsal controls). *Why it was cheap to be
  wrong about:* the deliverable video is itself an animated score — the
  cursor was already conceded, the rest rides the same clock.
- **D45** *(2026-08-20, day 20 — session-end dictation, verbatim in
  COMPOSER_LOG)* — **The performance runtime ("Phase E") is SEVERED from
  this workstream into ITS OWN PROJECT; the performance side "needs a
  rethink."** Do not build E here; it gets talked through first.
  Corollaries, binding: (a) this phase's mandate — architecture and
  structures — is CONFIRMED DELIVERED ("it looks like all the tools are
  there"); (b) the machinery is built and refined **while building the
  actual score**, requirements harvested as they arise (D6's stance applied
  to notation); (c) **when notation resumes, PARTS COME FIRST** — the
  players' notation — then its layout into the study score. *Why recorded
  as a decision:* it reorders the §7 amendment's phasing (C→D→E) and
  re-scopes E out of PLAN §7 entirely.
- **D44** *(2026-08-19, day 19 — the A1-review dictations; full text =
  NOTATION_ARCHITECTURE.md amendments 1-2)* — **Realization is
  MATERIAL-DEPENDENT and notational content DECOUPLES from the MIDI.**
  "The material will determine how the data layer is interpreted and then
  realized for that material." Dynamics: no global level→mark law — marks
  are authored-first IR content with provenance kinds
  (derived / authored / authored-override; overrides live ONLY in
  overlays; derived marks are regenerated, never stored). D3's performer
  transform DISSOLVED: performers react to a few BLUNT SHAPE FAMILIES
  (20 % vs 25 % slope is not consistently distinguishable); the raw curve
  stays canonical with an optional per-material transform slot. *Killed by
  these dissolutions:* the day-14 "owed" decisions (dynamics ladder, D3) —
  do not re-owe them.
- **D43** *(2026-08-19, day 19 — PLAN M5; evidence `docs/NOTATION_EXPERIMENTS.md`
  §8)* — **A metric-fit analysis must constrain the GRID UNIT, not just the
  beat; and Section 1 gets a MIXED strategy, not notated tuplets throughout.**
  Two runs settled this. (a) With the grid unit free, the chunker claimed *every*
  segmentable note at 20 ms tolerance — but using 9:1 and 8:1 subdivisions at
  33-87 ms units. **That is the day-19 "20 ms beat" false positive one level up:
  the constraint had been put on the beat when it belonged on the subdivision.**
  A countable beat with a huge subdivision is exactly as unreadable as a fast
  beat. Constrained to playable units (>=90 ms), honest coverage is **26.2 % at
  ε=20 ms, 57.1 % at ε=30 ms**, against a **68.8 % segmentation ceiling**.
  (b) The pre-registered kill rule (<30 % at ε=20 ms) **FIRED**, so
  S4-everywhere stays dead — but it is threshold-sensitive (37.3 % at an 80 ms
  floor would not fire), so the recorded verdict is **mixed strategy**, which is
  the composer's own reframe now carrying numbers. **Rejected along the way:**
  the AI's own morning hypothesis that first-level rationals (9:2, 7:3) would
  rescue the apex — the chunker chose **zero** of them, and the reason is
  provable, not empirical: with a countable beat free in a 3.33x range some
  integer subdivision always lands in range, so a straight label always exists
  and p:q can never be *needed*. **The frame made the composer's idea
  unnecessary before the material could be consulted.** Re-run with the beat
  FIXED (E1b), 9:2 / 7:2 / 7:3 / 8:3 / 9:4 / 5:2 were all selected, worth
  **+0.7 pts at ε=20 ms and +4.6 pts at ε=30 ms** over a straight-only
  vocabulary — so the idea is sound in the frame where it can matter.
  **Consequences:** (i) M5's open "per-part tempo or shared bar?" now has a
  price — free beat per chunk (26.2 %) > one beat per part (15.9 %) > one shared
  ensemble beat (9.1 %), stable at both tolerances, so **ensemble metric
  agreement is the expensive option**; (ii) **per-chunk re-anchoring is the GC's
  structural job** — every fit re-zeroes error at each chunk's first onset, so
  the bouncing ball is load-bearing in the analysis, not decoration; (iii)
  report **units, not just labels** — a verified chunk is plain eighths at
  ~222 bpm but gets labelled "3:1 at 148 bpm" purely because a 0.27 s beat sits
  under the 0.30 s floor.
- **D42** *(2026-08-19, day 19)* — **Notation is approached as EXPERIMENTAL
  DESIGN, run as a concurrent side project with pre-registered kill rules.**
  Composer's framing: the score architecture is *"the main but separateish
  build"*, the experiments are *"a concurrent side project that will eventually
  get folded in"* — so neither blocks the other, and the experiments need only
  per-experiment green-lights. Two experiment CLASSES, the second added by the
  composer: **discriminative** (prove/disprove named strategies, *"eliminate
  ones that don't work with reasons for fail"*) and **discovery** (designed to
  allow surprise — the composer's own example became E0, an ablation ladder from
  bare dots + cursor up to the full apparatus, welcoming the outcome that *"the
  discrepancy is negligible"*). **Failed strategies are deliverables, kept with
  their failure reasons.** The composer serves as the n=1 tap subject and named
  their own confound — *"not that good a trad notation reader, I'm an improvisor
  and have been looking at my own animations"* — so interpretation is
  pre-registered ASYMMETRICALLY: a count/glyph condition winning *despite* the
  bias is strong evidence; an animation condition winning is confounded and
  defers to a trad-trained replication; within-animation comparisons are the
  valid ones for this subject. **Why it matters:** it converts notation from a
  formatting stage applied to finished material into an empirical question about
  the material — and it makes the composer's own apparatus falsifiable.
- **D41** *(2026-08-18, day 18)* — **The trance section is written with AI prompts
  and pasted console scripts; panels are not built for it.** Composer's call after
  2aa-2ac: "my attempts to build tools like panels have turned out to be very
  labor intensive and aren't lending the results." Consequences, all binding:
  (a) scripts are delivered **in chat as fenced code blocks**, not as files —
  the copy button is the delivery mechanism; (b) **one scratch score** (`aud`),
  overwritten by every paste, never incremented — CTRL+S already banks a
  timestamped keeper into `scores/versions/`, so a trail of files buys nothing;
  (c) scripts **FULL-clear** (`Composer.objects=[]`) and never tag-filter — the
  tag-scoped version was a real bug, since different scripts carried different
  tags and material silently accumulated across pastes; (d) scripts carry a
  `PROTECTED` regex and refuse to clear a real score. *Why:* the composer's
  constraint is their own time at the keyboard, not code volume. *Rejected:*
  more panel work; per-take file numbering.
  **Corollary on effort, stated by the composer and worth obeying:** object
  insertion/mutation is trusted and should NOT be re-verified; **label and
  overlay presentation must be measured before delivery**, because every
  presentation slip costs a fresh script and a paste cycle. The column-numbering
  work the same day proved the split — the note-building was right first time,
  the labels were wrong three ways.


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

- **D37** *(2026-08-17, day 16 — PLAN 2aa)* — **A RECALLED SONORITY CARRIES ITS
  ARTICULATION, NOT JUST ITS PITCHES.** Any path that resolves a banked sonority
  by reference resolves it with the per-note technique rule the blast inserter
  already uses: a pitch in `cuivreConverted ∪ cuivreAdded` → `cuivre`, otherwise
  its `artic` entry. *Why:* **five of the composer's seven staccato /
  staccato-cuivre pairs have IDENTICAL pitch sets** — S020/S023, S026/S029,
  S032/S035, S038/S041, S044/S047 — so a pitches-only recall makes half of a
  menu into byte-identical duplicates, and the mock-up plays them without a
  clue that anything is wrong. *Rejected:* 2aa v1's own instruction ("technique
  `staccato`", one technique for the whole pass), which is what exposed this.
  *Measured in the running app:* S044 → six notes on ch 4 (`tubaNb`, staccato);
  S047, the same six pitches → three on ch 4 and **C4/C#4/D4 on ch 5** (cuivre).
  Generalises past 2aa: the same trap waits in any future recall path (v2's
  write-to-score, a notation export) that treats a sonority as a pitch list.

- **D38** *(2026-08-17, day 16 — PLAN 2aa)* — **A LOOPED AUDITION SCHEDULES THE
  NEXT CYCLE AHEAD; `MorphEmit.play` IS FOR ONE-SHOT RENDERS.** `E.play` shifts
  its whole schedule by `CC_LEAD_MS` (250 ms) and calls `panic()` on entry, both
  of which are right for a single morph render and fatal for a loop: re-invoking
  it per cycle opens a **250 ms hole at every seam — more than half a beat at
  130 BPM**. *Rejected:* (a) re-invoke at span, the hole; (b) re-invoke at
  span − 250 ms, which closes the hole but panics over the last column's still
  ringing one-shot — and whether a note-off truncates a fixed sample is exactly
  PLAN 2o's open question, so it would have been a fix built on an unknown;
  (c) batch N cycles per call, which only makes the stumble rarer. *Adopted:*
  cycles laid down `LOOKAHEAD_MS` (400) ahead against one absolute time base,
  nothing stopped and restarted — the `texture_panel.js` precedent for this
  material class. **`panic()` stays the single stop path**: every timer is
  pushed into `E._timers`, and fired cycles are pruned so the array cannot grow
  without bound. *Measured over 4.5 cycles at a nominal 250 ms step:
  240/250/260 ms throughout, the seam indistinguishable from any other step.*

- **D39** *(2026-08-17, day 17 — PLAN 2ab)* — **A PANEL SNAPSHOT'S `state` IS
  OPAQUE TO THE SERVER, AND ALL PANELS SHARE ONE FILE.**
  `bank/panel_snapshots.json` stores, per panel, whatever that panel's own
  `save()` writes to localStorage — byte for byte, never validated, never
  interpreted. An unknown panel key is CREATED on first save rather than
  rejected. *Why it is a decision and not a detail:* it is what made 2ac cost
  **zero** server lines, and it means a panel can change its state shape without
  touching the server or the file's contract. *Corollary that is also load-
  bearing:* the state is **deep-copied** on the way in, because the caller is a
  live browser object that keeps mutating. *Rejected:* a per-panel schema (a
  new panel would need a server edit, and every shape change becomes a
  migration) · storing snapshots under `scores/` (sandbox state is not score
  objects, and the 5 s autosave has clobbered a loaded score before — D8).
  *Second corollary, proven in the running app:* the same file is the **AI-dial
  channel** — a snapshot the AI writes while a panel is open appears on the next
  `Load` with no page reload.

- **D40** *(2026-08-17, day 17 — PLAN 2ac)* — **IN A MULTITEMPO TEXTURE, LANE =
  STREAM. AND THE ONLY THING THAT CATCHES THE ALTERNATIVE IS A TEST.**
  Each tempo stream belongs to one player for the whole cycle; the pulse strip's
  per-NOTE round-robin cursor (`pulse_seq.js` `buildGrid`) is correct there and
  wrong here. *Why it earns a decision:* copying the cursor produces a texture
  that is **completely plausible by ear** — a wrong-but-regular pulse still
  sounds like a pulse — so neither listening nor reading finds it. It was caught
  because the plan's own traps block named it the day before and a mutation test
  was written for it. **Generalisation for the remaining builds: when a rule's
  violation would still sound musical, it needs an assertion, not an audition.**
  *(Same family as Principle 5 — a check that shares a formula with the thing it
  checks is a mirror; here, a check that shares an EAR with it is too.)*

## §5 Done

- **2026-08-23 (day 30) — THE CLOUD02-I MILESTONE (PLAN 8f done):** all ten parts read
  with the composer, finalized, and folded into `db1` — every note of 0–40.4 s carries
  a composer-approved figure. With it: rule candidates 8–12 + the five-check generator
  recipe (BEAMING_DECISIONS D-logs 10–22), the hand-tuplet override (sub-beat
  brackets), `--ringFromBrick` (the blast's ten bars uniform at the drawn 1.010 s),
  and the cuivré mark placed by dictation. Validate 37/40, the three DIFFERs
  ear-over-fit on the record.
- 2026-08-23 (day 26) — `--bare` on notate_section; CLOUD02-I trials fork reads as bricks; Part 3 opened on T1; D66; PLAN 8g approved.
- 2026-08-23 (day 27) — PLAN 8g FIGURE SEAMS built and verified: `segment()`, the words-first report, `--figures`/`--paceRatio`, `gridId` as the grid domain; D67 (a cut lands where the pace changes); T1 reads as six figures with no tuplet.
- 2026-08-23 (day 25) — THE PLAYABILITY PROCESS run on CLOUD02-I and made a tool (PLAN 8f parts 1–2).
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
- 2026-08-17 — **PLAN 2aa v1 PULSE SEQUENCER STRIP shipped** (the trance
  section's sandbox): `Pulse` panel in the composer score, a 29-entry sonority
  menu in `bank/pulse_palette.json` resolved live against the taxonomy, a pure
  grid→notes engine (`pulse_seq.js`, 103 assertions, mutation-tested) and a
  seamless real-time loop. **Audition only — it writes nothing to the score.**
  Two rulings came out of building it: **D37** (a recalled sonority carries its
  articulation) and **D38** (a looped audition schedules ahead). *The sound is
  unheard — the composer's audition is the open half.*

- 2026-08-17 — **PLAN 2ab PANEL SNAPSHOTS shipped**: named panel states in
  `bank/panel_snapshots.json` via `GET/POST /api/snapshots`, a pure merge module
  (`score/snapshots.js`, 75 assertions, mutation-tested), `Save`/`Load` on the
  pulse panel. **Verified across a wiped localStorage plus a browser reload**, so
  the state provably came back from the server file. → **D39**. It is also the
  AI-dial channel the other two panels use.
- 2026-08-17 — **PLAN 2ac MULTITEMPO AUDITION RIG shipped**: the `MT` panel —
  several tempi at once from one BPM and a reduced integer ratio set, with
  UNISON / REGISTER / HARMONY separation modes and the shared onsets highlighted.
  Pure engine `multitempo.js` (90 assertions, four mutation tests). **Measured
  live: C = 1.2 s at 150/3:4:5, the streams realign on C, 2C and 3C, and the loop
  seam is indistinguishable from an ordinary step.** → **D40**. *The sound is
  unheard — the composer's audition is the open half.*
- 2026-08-17 — **PLAN 2ad PHASE-SHIFT SELECTOR readied with ZERO code**: its one
  conditional item proved unnecessary (the Texture panel already polls every
  second and honours `active` on a rev bump — verified live), the A/B/C slate is
  already SMEAR/RAIN/GALLOP, and the banking CLI was run end to end and reverted.
  **Waits only on the composer's ear.**
- 2026-08-20/21 — **PLAN 8a V0–V3: THE DELIVERABLES CONTAINER, CODE-COMPLETE
  IN ONE SITTING** — G0 + G1 closed by the composer; the two windows, the
  clock interface, all five animated objects, the one-command
  trial-insertion loop, the polish ledger + protrusion detector. The
  pre-notation critical path is done; G2/G3 = one ~20-min composer
  sitting; V4/V5 exports trail until submission.

## §6 Human Notes

- *(2026-08-24, day 35 — CURRENT)* **The long tone at 48 is written, and one small
  call is yours.** All ten tubas now carry a ring bar over 48.05-52.46, its length
  taken from the 4.410 s brick in the composer score exactly as you asked — the same
  device as the 41 s blast. Nothing else on the page moved (measured: 10 items added,
  0 removed, 0 changed). **The call:** the ten pitches are spelled **A♯**, so the page
  draws ten sharp accidentals — but your marker and your words both say **"octaves
  Bb"**. Say the word and they respell to B♭. *One thing you may want to know for the
  Fable sitting:* the job needed a real fix, not just a flag — `ord` notes had no ring
  bar in the device registry at all, so the tool would have reported success over a
  blank page (D72). That near-miss is the strongest argument in the mechanization brief.
  *(Standing small calls, unchanged: `flagShortBarSeconds` 1.0 → 0.35? · the cuivré
  MEDIUM gap lift · the GC-ball landing ear check in motion. The facing-bands rule
  stays a diagnostic at your word.)*

- *(2026-08-24, day 34 — CURRENT)* **The fold is RUN and nothing is owed.**
  `db1` is now your single notation page: 49 clusters, 0-46.36 s, every part
  figured, under the bracket-above policy — density build 1 + CLOUD02-I +
  CLOUD02-D all on it, the trials fork gone from the picker. Nothing you
  approved moved (425 layout rows measured identical), so there is no re-look
  owed on any earlier page. **Your next composing is the new section — a long
  tone + density build 2 — in the app on `piece-s26`.** Open it and go; ask
  for density/measurement runs whenever you want them, and notation comes
  later off a fresh fork.
  *Two small things you may want to look at when convenient, neither blocking:*
  the folded `db1` page itself (nothing should look different below 42 s — that
  is the claim), and the two long-standing tier-3 geometry items that survive on
  it (T9 @36.87 bracket/accent, T10 @39.08 bracket/beam), which you approved
  under db1 previously.
  *(Standing small calls, unchanged: `flagShortBarSeconds` 1.0 → 0.35? · the
  cuivré MEDIUM gap lift · the GC-ball landing ear check in motion. The
  facing-bands rule stays a diagnostic at your word — adopting it as a mover is
  a future-section decision with two named deltas, T9 and T3 accents.)*

- *(2026-08-24, day 33)* **CLOUD02-D is wrapped and nothing is owed.** The
  page is locked by your eye; ~~the fold into db1 is one prepared command and
  is the first chunk of the next session~~ *(RUN day 34 — see the note above)*. Your next composing happens in **`piece-s26`** (bumped from the
  finished archive; open it in the app and it makes its own -work copy). The
  facing-bands rule stays a diagnostic at your word — adopting it as a mover
  is a future-section decision with two named deltas (T9, T3 accents).
  *(Standing small calls, unchanged: `flagShortBarSeconds` 1.0 → 0.35? · the
  cuivré MEDIUM gap · the GC-ball landing ear check in motion.)*
- *(2026-08-23, day 30 — CURRENT)* **Nothing is owed; CLOUD02-I is yours and done.**
  Next sitting is CLOUD02-D with **Opus** (your call, confirmed): 6a = the nine soft
  decisions (presented to you, then applied), 6b = its notation by the recipe — Opus
  is instructed to flag anything rules 1–12 don't cover rather than invent. **One
  deferred item of yours on file (NITS):** the cuivré marks want a MEDIUM vertical
  gap (between the 0.15 minimum and the standard) and a lift to it — parked at your
  word. *(Standing from day 24: `flagShortBarSeconds` 1.0 → 0.35? and the GC-ball
  landing ear check in motion — both still open.)*
- *(2026-08-23, day 28 fourth sitting)* **8i is built; the reads are yours,
  and the scan has already done the looking-for-you.** `t1-final` is alone in the picker
  and is the page you approved, rebuilt from the rule. For T2–T10, one part per sitting:
  `node tools/pattern_analyze.js --ir db1-c2i-x01 --part N --span 36.19-40.42` — the
  ONE-GRID writing comes first now, group by group with its bracket. **Three things to
  know before you start, all measured:** (1) **nothing in this section needs own grids**
  — all fifteen gestures sit within a head on one grid, so the writing is always
  available; (2) **five gestures have a bracket that straddles a seam** — T2 @38.60,
  **T4 @36.20 (three of them)**, T9 @36.33, T9 @37.39, T10 @38.69. That is your call
  A(a) coming due: the bracket says "quicker" about half of one group and half of the
  next. The tool flags each one; the fix (scope the bracket to the figure instead of the
  beat) is unbuilt and waits on you. (3) **T3 @36.33 sits at exactly 1.00 heads** — on
  the line, not over it, so nothing flags it; worth your eye when you get to T3.
  *(Standing from day 24: `flagShortBarSeconds`, the cuivré mark, the GC-ball ear
  check.)* **Logistics:** the Browser pane was NOT displayed this sitting so no
  screenshot was taken; the DOM audit needs no pane and was done.
- *(2026-08-23, day 28 third sitting)* **Nothing owed while Opus builds 8i.**
  T1 is decided (`t1-hybrid2`, the brackets — D69), and A(a)/B(a) are in the spec. When
  8i is built, the reads open (5c): T2–T10, one part per sitting, against a report whose
  first writing is the one you chose. Three things to keep an eye on per part, all
  printed by the tool: a bracket straddling a seam (A(a): say if you want it fixed) · a
  gesture whose one grid is over a head (by hand — own grids, or split it) · a FLOW line
  you want taken (by hand, `--tuplet`). *(Standing from day 24: `flagShortBarSeconds`,
  the cuivré mark, the GC-ball ear check.)* **Logistics:** the Browser pane was open this
  sitting and screenshots work; DOM audits work without it.
- *(2026-08-23, day 28 second sitting)* ~~**8h is built; ONE call is owed and it opens
  step 5: T1's final.**~~ *(ANSWERED third sitting: `t1-hybrid2` — "I would like the
  tuplet brackets" → D69, PLAN 8i.)*
- *(2026-08-23, day 28)* ~~**Nothing owed while Opus builds 8h.**~~ *(SUPERSEDED — 8h is
  built; see the entry above.)*
- *(2026-08-23, day 27)* ~~**One thing is genuinely owed, and it gates the
  next build: the segmentation verdict.**~~ *(ANSWERED day 28 — see the entry above; the
  verdict moved two cuts and exposed the one-sided seam rule → PLAN 8h.)* Open the picker and compare
  **`t1-figures`** (8g AFTER — six figures, no tuplet, nothing past 0.2 heads)
  against **`t1-onegrid`** (8g BEFORE — one grid, 7:4 · 6:4 · 7:4 at 0.7 heads).
  Three questions: (a) **is six figures right, or is the cut after note 3 one too
  many?** That is the tool's single disagreement with your day-26 five — it splits
  your "long long / short short" figure at its pace change, which is what removes
  the quintuplet. (b) **Note 11** is flagged as a near-tie, as you called it —
  which side does it belong on? (c) Do **three 2-note "pair" figures** read as
  fragmented on the page, or is that fine? Nothing else gets notated until this
  has your eye. *(Everything else from the day-24 list below still stands:
  `flagShortBarSeconds`, the cuivré mark, and the GC-ball ear check.)*
- *(2026-08-23, day 24 wrap)* **Nothing blocking. Three small calls
  whenever convenient:** (1) `flagShortBarSeconds` 1.0 → 0.35 (21 judgment flags
  vs 3 across the section); (2) a `cuivré` text mark on the three cuivre notes
  at 40.93, currently invisible as a technique; (3) whether T1's last figure
  stays as your 3:2 (1.2 heads, approved by eye) — the analyser would write the
  whole tail as one sextuplet at 0.8. **And one ear check owed:** the GC ball
  now lands ON the lane edge (5 px lower) — look at it in motion once.
- *(2026-08-23, day 24 wrap)* ~~**The next section is twice as dense as the one
  just finished** (36 notes/s vs 17; 87 % of notes start inside the previous
  sample's ring). The plan puts the thinning question to you with those numbers
  FIRST, before any notation.~~ *(ANSWERED day 25: "it feels very dense" meant
  UNPLAYABLE, not too-much. CLOUD02-I passes playability with 12 part moves and
  no removals; the thinning ladder stayed research. PLAYABILITY_MODEL.md.)*
- *(2026-08-22, day 23)* ~~**Nothing blocking; four things await
  your eye or your call.** (1) **You have not seen the last two changes** —
  figure 1's beamlets (stubs on the notes that open a gap) and figure 2's
  solid double beam. First thing on return. (2) **`flagShortBarSeconds`**
  is 1.0, which flags almost every fortepiano in this material (four in
  T1); **0.35** would flag only the genuinely tiny bars (wc-62 0.36,
  wc-83 0.25). One registry number. (3) **The last partial's dynamic**:
  you asked for fff on member 12, whose velocity band is f — written as
  you said, flagged in case it was a slip. (4) **The dynamic-band
  thresholds are provisional** until the SI2 velocity→dB ladder is
  measured; the section-1 census under them is in the day-23 running log.~~
  *(superseded by the day-24 wrap note above; items 1 and 3 resolved day 24, 2 and 4 carried forward)*
- *(2026-08-22, day 23)* **A sound question, not a notation one:** every
  staccato sample (0.43–0.48 s here) OUTLASTS every gap in the cluster
  (155–377 ms). So the figure sounds overlapped, not detached, whatever the
  page says. If you want audible detachment that is a sample/technique
  decision.
- *(2026-08-21, day 22 third sitting)* ~~**Three verdicts owed**~~ —
  (1) 8vb vs low ledgers **CLOSED day 23: ledgers, D54**; (2) "FP3x"
  **CLOSED day 23: it is provenance from the A1-5 transform, not a
  performance instruction**; (3) the ARCHIVE AMENDMENTS protocol —
  still un-vetoed, in force, two ledger lines now (wc-23, wc-29).

- *(2026-08-21, day 22 third sitting — CURRENT)* **Three verdicts owed, none
  blocking:** (1) **8vb vs low ledgers** — both the F#1 surge and the G#1
  fp write an octave up under 8vb by the 3-ledger rule; tubists read low
  ledgers. One registry number (`glyphs.standards.ottava.ledgerLineThreshold`,
  now 3) flips every low note at once. (2) **"FP3x"** — the performance
  note on wc-23 in the archive; if it means something performative, it is
  a separate element on the note. (3) **The ARCHIVE AMENDMENTS protocol**
  (`docs/ARCHIVE_AMENDMENTS.md`) was written to your ask — accept or amend
  it; the first ledger line (wc-23) is in. Also: look at wc-23 whole
  (sfzp next to the surge's ppp; the bar at 0.65) before wc-29 starts.
- *(2026-08-21, day 21)* ~~**THE G2+G3 SITTING (~20 min) is the only thing
  between here and notating**~~ *(effectively dissolved day 22: the loop
  is running on db1-t1-x02 with live MIDI; close on paper when convenient —
  the hard-cut turn and the animated objects have now been seen live.)*
- *(2026-08-21, day 21)* **THE G2+G3 SITTING (~20 min)** — see the strike-through above; details kept: play `piece-open-01` in video mode with
  the Reaper render (onsets-on-cursor by eye) · name one fresh window
  ("notate X–Y of piece-s25") · verdicts under motion: hard-cut page turn ·
  trance 12-vs-16 / apex time scale · first look at all five animated
  objects (styling reactions welcome, filed not debated). Item 4 below
  (GC apex-vs-impact cue) belongs to this sitting too.
- *(2026-08-19, day 19, notation)* **FOUR THINGS THE NOTATION WORK NEEDS FROM
  YOU** — ~~the first two~~ *(1–2 DISSOLVED by D44, day 19 — do not re-owe:
  dynamics are authored-first with provenance; D3 became blunt shape
  families)*:
  1. ~~The 0-10 → dynamic-mark convention~~ *(dissolved)*
  2. ~~D3's performer-transform decision.~~ *(dissolved)*
  3. **Is ε = 30 ms acceptable to your ear?** This is the highest-leverage
     answer available: at 20 ms only ~26 % of Section 1 admits simple bars, at
     30 ms it is ~57 %. The whole strategy mix moves on it. *(Related knob, same
     judgment: where the "readable subdivision" floor sits — 80 vs 120 ms swings
     the number ~3×. E1 cannot settle either; your ear or a tap test can.)*
  4. **Should the GC cue smooth entries at the bounce's APEX** (the
     zero-velocity float at the top) rather than at the impact? This is the AI's
     proposed fix for the attack-coupling you identified — it keeps the ball
     predictive while dropping the percussive connotation, so a ramped entry no
     longer has to *"resist the stated attack."* Untested; your call whether it
     goes into the GC port at all.
- *(2026-08-19, day 19)* ~~**NEXT SESSION STARTS HERE — the phase-shifting
  machine.**~~ *(DONE day 21 first sitting — 2ag built, phaseSeq-01 performed,
  trance section finished and in the piece.)* The composer named it explicitly at session end. It needs no code:
  `Texture` button, A/B/C are SMEAR / RAIN / GALLOP, the panel polls every second
  so an AI edit lands with no reload. **Answer one question by ear: are they
  distinct?** The measured prediction on record — RAIN and GALLOP have nearly the
  same jitter (sd 30.7 vs 32.3 ms) but very different unevenness (0.14 vs 0.68);
  if they sound alike they are one category with two labels. Then say what you
  want more or less of and the AI edits the slate.
- *(2026-08-19, day 19)* **Two things owed to your ear on the trance section:**
  whether a PAIRED stream reads as one line split between two players or as two
  players who coincide (the whole notation scheme rests on this), and whether the
  15 identical chords closing `aud-11` are too static.
- *(2026-08-19, day 19)* **A trap worth knowing while you bank chords:** the
  staccato patch sounds only MIDI 30-65, and seven of your `more chords` species
  contain a 66 or 68 that renders silently. The generator folds them into range;
  **the Insertion strip does not.** A range warning at bank time is un-built.


- *(2026-08-17, day 17)* **THE PHASE-SHIFT SITTING IS SET UP AND WAITING — it is
  the day-12 texture slate, now with the path around it verified.** `Texture`
  button; A / B / C are already the SMEAR / RAIN / GALLOP references. Play the
  three and answer one question: **are they distinct by ear?** Then say what you
  want more or less of — the AI edits the slate and the panel lands on it within
  a second, no reload (verified). Bank a keeper with
  `node tools/texture_bank.js --bank <NAME> --from <variant> --survives yes|no
  --note "<plain ASCII — the shell mangles em-dashes>"`.
  **The measured prediction to test first:** RAIN and GALLOP have nearly the
  same jitter (sd 30.7 vs 32.3 ms) but very different unevenness (0.14 vs 0.68).
  If they sound alike, they are one category with two labels and the models
  should merge. Either answer is a result. *(This supersedes the day-12 slate
  note below as the entry point; that note still holds for items 3-5.)*

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
