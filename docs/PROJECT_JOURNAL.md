# PROJECT JOURNAL — for seven tubas

## §1 Quick-Start

Piece #4 in the lineage; started 2026-08-10 as a detour from piece #3 (which resumes
later). Stack inherited wholesale from #3: composer score (7 instrument-keyed tracks,
`:5200`), sandbox (`:4700`), shared motive library, D8 saving, D9 linked motive blocks.
Deep reference material (sampler quirks, survey playbooks, protocol rationale) lives in
piece #3's `docs/` — registered as an additional working directory.

## §2 Resume Here

**DAY 28 COLD START (fourth clear → Fable does THE READS) — read this block, then
`docs/NOTATION_STANDARDS.md` principle 6 (rewritten under D69 — it is the writing rule
now), then go. The next step is a CONVERSATION, not a build. (Days 23–24 are compressed
below.)**

### State in one paragraph

**Day 28, fourth sitting: PLAN 8i IS BUILT, VERIFIED AND PUSHED — the composer's page
is now what the tool writes by default.** `--figures` means the groups from 8h on ONE
grid with the beams broken at the seams (D69, *the bracket is the message*);
`--ownGrids` is the old per-figure reading, kept as the by-hand alternative and proved
byte-identical to `t1-figures2`. **`t1-final` — built with no `--cuts` and no
`--beamBreak` — is IR-identical to the hand-typed `t1-hybrid2` on every drawn field**
(the one difference is the new `device.figure` annotation, which draws nothing), and
the DOM audit at :5210 shows the same 21 polygons, six primary beams over 1–2, 3–5,
6–7, 8–10, 11–14, 15–16, and the three texts `7:4 6:4 7:4`. The five scratch entries
are pruned; **`t1-final` is alone in the picker for T1.** Ten batteries green
(`test_pattern_fit` 61 → 80 checks), `--validate` still 24/25. **THE TWO FINDINGS THAT
CHANGE WHAT 5c LOOKS LIKE, both from the new `--scan`: (1) all fifteen gestures of
CLOUD02-I fit ONE grid inside a head — nothing in this section needs `--ownGrids`;
(2) FIVE of them carry a bracket that STRADDLES a seam** (T2 @38.60, T4 @36.20 with
three, T9 @36.33, T9 @37.39, T10 @38.69), so design call A(a)'s watch item is real in a
third of the section and comes to the composer part by part. *(Below: the third
sitting's picture of the verdict, still the reason for all of this.)*

**Day 28, third sitting: THE VERDICT ON THE WRITING — "I would like the tuplet
brackets." T1's final is `t1-hybrid2`** (ONE grid, the composer's six groups as beam
groups, 7:4 · 6:4 · 7:4), NOT `t1-figures2`. **D69**: a pace change must be SAID on the
page; the bracket on the quick group is the message, and own grids with plain 16ths
make the values lie against the spacing. 8h's grouping stands; 8g's writing falls.
Design calls answered: **A(a)** bracket scope stays per beat, straddles get a flag ·
**B(a)** one grid per gesture, FLOW stays a flag.

**Day 28, second sitting: PLAN 8h IS BUILT, VERIFIED AND PUSHED.** The seam test in
`pattern_fit.segment()` is now TWO-SIDED (D68 — *the seam is the slower gap; the
boundary note goes with the quick side*), and on T1 the legal set is exactly the
composer's five cuts `2,5,7,10,14`, all five taken. With it came the **RATIO TIE**
flag (T1's 7-vs-8 flips at pace ratio 1.272), the **NO CLEAN SEAM** flag (T7 @36.19),
**`--cuts a,b,c`** on both tools, and the **FLOW** flag (adjacent figures at 2:1 / 3:2
could share one grid — report only). Ten batteries green (`test_pattern_fit` 40 → 61),
`--validate` still 24/25, **`t1-figures2` built and DOM-audited** — same heads and the
same six primary beams as `t1-hybrid2`, differing only by three tuplet brackets.
**THE ONE FINDING THAT CHANGES SOMETHING: the day-27 claim "not one figure in CLOUD02-I
needs a tuplet" is FALSE under the corrected rule — three figures need one** (T7 @36.19
notes 1–6 · T7 @39.51 notes 5–8 · T8 @37.14 notes 4–7). The old rule cut more (60
figures against 55) and short figures fit for free; worst displacement nonetheless
improved 1.00 → 0.93 heads. **So the tuplet-vs-dotted question is live again in three
places, and it belongs to the reads.** *(The paragraph below is day 27's picture of 8g,
still accurate as a description of what exists.)*

**Day 27 ended with PLAN 8g (FIGURE SEAMS) BUILT, VERIFIED AND PUSHED.**
The analyser now cuts a gesture into FIGURES and fits each one alone
(`pattern_fit.segment()`), reports them **in words first**, and `notate_section`
can build them (`--cluster … --figures`). On T1 it finds SIX figures with **no
tuplet anywhere** and nothing past 0.2 heads, against the one-grid reading's three
tuplet beats at 0.7 heads. **It keeps three of the composer's four day-26 cuts (5,
8, 14), flags note 11 as a near-tie exactly as the composer did, and makes one cut
they did not — after note 3 — which removes the quintuplet from their figure 1.**
The day's finding (D67): the cost model PLAN 8g specified provably CANNOT reproduce
the composer's reading for any CUT_COST; what was missing was the composer's own
day-26 method — **a cut may only land where the pace changes** — plus a
figure-length term. That rule also makes no-shatter structural instead of tuned.
Ten batteries green (`test_pattern_fit` 6 → 40 checks), `--validate` still 24/25,
verified in the running app.

**The standing picture, unchanged this session.** Density build 1 (0–34.6 s) is
finished and promoted (`notation/ir/db1.ir.json`, 25 clusters, top of the picker; its
`provenance.build` rebuilds it). CLOUD02-I (36.19–40.42 s) has been through the
playability process — 12 redistribution part-moves, 159 staccato bricks at 50 ms, 13
ledger lines, 0 hard / 0 soft, no note removed and no time or pitch changed — and db1
was re-extracted from the amended archive (456 events, 131 chunks, VALID). The trials
fork **`db1-c2i-x01`** sits under experiments with its CLOUD02-I span **BARE**
(`--bare 36.19-40.33`): bricks only, so the material can be read. **CLOUD02-I is still
not notated.** Whole archive still shows 2 hard (the trance seams @560.63 T8 /
@604.63 T6) and 32 soft, all parked. All pushed; working tree clean.

### NEXT STEPS · MODEL · CLEAR — the running thread (keep current; CLAUDE.md § THE RHYTHM)

| # | step | model | clear? | done = |
|---|---|---|---|---|
| ~~1~~ | ~~PART 3 — analysis of CLOUD02-I in shapes, then STOP AND TALK~~ **T1 DONE day 26** | — | — | — |
| ~~2~~ | ~~8g — FIGURE SEAMS: build the segmenter~~ **DONE day 27** — built, verified in the app, pushed; the finding is D67 | — | — | — |
| ~~3~~ | ~~THE COMPOSER'S EYE ON THE SEGMENTATION~~ **DONE day 28** — verdict: grouping instinct right, two cuts one note off (after 2 not 3, after 7 not 8), both from the same one-sided rule; beaming of `t1-hybrid2` approved as is. *(old row kept for the record:)* THE COMPOSER'S EYE ON THE SEGMENTATION — 15 minutes, before any more parts. Open the picker: **`t1-figures`** (8g AFTER — six figures, no tuplet) against **`t1-onegrid`** (8g BEFORE — one grid, 7:4·6:4·7:4). Three questions: (a) is six figures right, or is the cut after **note 3** one too many — the tool's one disagreement with your day-26 five? (b) **note 11** is flagged as a near-tie, as you called it — which side does it belong on? (c) do three 2-note "pair" figures read as fragmented on the page? | **Fable** | **YES — clear before it** (execution → conversation) | a verdict on the cut set; if the cuts want to move, the dial is `--paceRatio` (or say the boundary and it moves) |
| ~~4 = A+B~~ | ~~PLAN 8h — THE SEAM IS THE SLOWER GAP~~ **DONE day 28 (second sitting)** — all ten spec items built and verified, pushed; the decision is D68, the trail is RUNNING_LOG day 28. Two things to carry forward: the tuplet re-measurement came back **3, not 0**, and a new PICKUP flag appeared on T1's note 8. | — | — | — |
| ~~5a~~ | ~~T1's final, by eye~~ **DONE day 28 (third sitting): `t1-hybrid2` — the brackets. D69.** | — | — | — |
| ~~5b~~ | ~~PLAN 8i — THE BRACKET IS THE MESSAGE~~ **DONE day 28 (fourth sitting)** — all nine items built and verified in the app, pushed. `t1-final` IR-identical to `t1-hybrid2`, alone in the picker; `--ownGrids` byte-identical to `t1-figures2`; batteries green, `--validate` 24/25. The scan table is in RUNNING_LOG. | — | — | — |
| **5c = C — RIGHT NOW** | **THE READS: T2–T10 by hand against the 8i report, one part per sitting.** For each part: `node tools/pattern_analyze.js --ir db1-c2i-x01 --part N --span 36.19-40.42` — the writing on ONE grid comes FIRST now, group by group with its brackets; own grids print last as the alternative. Composer validates the "one cluster per part, several groups" expectation and says whether the brackets are the ones they want. **The scan has already narrowed what to watch:** a gesture over a head — **none in this section, all 15 fit** · a **STRADDLING bracket — five, named** (T2 @38.60, T4 @36.20 ×3, T9 @36.33, T9 @37.39, T10 @38.69): call A(a) is now live, and the fix (bracket scoped to the figure, a change to `fit()`) is built only if the composer wants it · **FLOW** lines they want taken (by hand, `--tuplet a-b@3:2`) · **ratio ties** on five gestures. The dotted-16th question is not urgent — brackets are welcome. | **Fable** | **YES — clear before it** (execution → conversation) | every part has its read; the tool changes it shows a need for are listed |
| 6 | NOTATE CLOUD02-I — `--cluster t0-t1@part --figures [--cuts …]` per the reads, in `db1-c2i-x01`, narrowing `--bare` as parts get figured; composer reviews part by part | **Opus** to build · **Fable** for each page verdict | clear before it; `/checkpoint · /clear · /resume` mid-way | every part 36–40.4 carries a figure the composer has looked at; section audit clean; db1 rebuilt, `--validate` 24/25, pushed |
| 6 | CLOUD02-D — `playability.js --section CLOUD02-D --brick 0.05` is dry-run (18 soft → 9; two real asks T6 @45.51, T7 @45.47); composer decides the nine → `--apply` → re-extract → its analysis | Opus run/apply · Fable for the nine and the talk | clear before it (milestone) | ledgered, re-extracted, 0 hard; the nine decided |
| 7 | The two trance seams (@560.63 T8, @604.63 T6) — `playability.js --w0 --w1` on each, apply | Opus | no (small) | whole archive 0 hard |
| — | Further out: PLAN 8 (Penn State deliverables, exports V4/V5), the tubist questions (PLAYABILITY_MODEL § Open), the breath rule as an auditor column, the paper's first pass (PAPER_NOTES "THE PAPER'S STRUCTURE") | — | — | — |

**Right now (updated late day 29): THE SECTION FILE IS `db1-c2i-x01`** — T1 + T2
FINAL (T2 declared done; T1 rebeamed per the recipe, brackets kept), **T3 proposed
and awaiting the composer's look** (plain per the standing direction, but EIGHT of 17
notes sit 1.4–1.8 heads off vs 1.00 bracketed — the flag is D-log 6.3), T4–T10 bare
per part. All t1-*/t2-* scratch pages pruned (git keeps them). The ledger
(BEAMING_DECISIONS.md) has D-logs 1–6; rules extraction still deferred. Next: the
composer's T3 verdict → then T4…T10 one at a time, notated straight into the section
file per the standing recipe + mf-floor dynamics. *(The paragraph below is the
mid-day picture, kept for the trail.)*

**Right now (updated mid-day 29):** the reads changed shape. T2's read produced
`t2-composer` ("T2 read E") through five verdict rounds — **the composer has more T2
remarks coming; that file is where they land.** A BEAMING-DECISIONS LEDGER now runs
(`docs/BEAMING_DECISIONS.md` — rule extraction deferred, log everything); its D-log 4
recipe (through · rest16 inside groups · separator rests keep value) was applied to
db1's ending figures T1–T10 and **PROMOTED into db1** (day 29). The standing build
recipe section of the ledger governs every new figure built from here. After T2's
remaining remarks: T3's read, then onward per part; step 6 (notating into
`db1-c2i-x01`) applies the recipe. `docs/research/beaming_standards.md` is the
engraving reference behind it all.

### Day 28 — THE WRITING, settled (third sitting — read before touching `--figures`)

- **T1's final = `t1-hybrid2`. "No. I would like the tuplet brackets."** The composer's
  principle: *there should be some communication to the performer if there is a speed
  change* — two 16ths far apart then three close together must not all read as plain
  16ths; the 7:4 on the quick three is appropriate. **D69.** 8h's groups stand; 8g's
  own-grids writing falls. `t1-figures2` (the AI's lean) is rejected.
- **Two design calls answered:** **A(a)** — bracket scope stays PER BEAT (fit()'s model);
  on T1 the tuplet beats and the groups coincide; a bracket straddling a seam gets a
  FLAG (8i builds it) and is fixed only if it appears in the reads and the composer
  wants it. **B(a)** — ONE grid per gesture with the fit's brackets; FLOW stays a flag
  (the cleaner pairwise 3:2 for figures 1+2 is on offer, by hand, not the default).
- **The measurement changes:** "figures needing a tuplet" is no longer a score (it
  measured how finely the material was cut). 8i's `--scan` counts **gestures whose ONE
  grid is within a head** — the ones over are the by-hand cases for the reads.
- **The picker after 8i:** `t1-final` alone (built from the rule, proven IR-identical
  to hybrid2); the five scratch entries pruned.

### Day 28 — THE SEAM RULE, settled and built (second sitting — read before touching the segmenter)

- **T1 verdict (composer, by ear): groups are [1,2]+[3,4,5] · [6,7]+[8,9,10] · [11–14] ·
  [15,16]** — cuts after 2,5,7,10,14 (the day-27 tool had 3,5,8,10,14). Second 2+3 said
  tentatively ("sounds more like"). **The corrected rule now produces exactly this set
  on its own** — `t1-figures2` needed no `--cuts`.
- **THE RULE, now in the code (D68):** *the seam is the slower gap; the boundary note
  goes with the quick side.* A seam is a gap not quicker than either neighbour and a
  pace change from at least one (banded local max; Lerdahl & Jackendoff GPR 2b). D67's
  one-sided test was the whole defect.
- **One number was corrected in the build.** The 7-vs-8 flip is **304/239 = 1.272**
  (the seam against the shortest gap of the band it joins), not 304/242 = 1.256 (the
  seam against its right neighbour) — `paceBands` is greedy from each band's own
  shortest. Measured by bisection. Same conclusion, right arithmetic.
- **The tuplet claim died.** "Not one figure in CLOUD02-I needs a tuplet" was true of
  the OLD rule only. Under D68: **3 figures need one** — T7 @36.19 (notes 1–6, 0.9
  heads), T7 @39.51 (notes 5–8, 0.6), T8 @37.14 (notes 4–7, 0.9). 55 figures now
  against 60 before; worst displacement 1.00 → 0.93 heads. The dotted-vs-tuplet
  deferral from day 26 comes due in those three places.
- **Flow, now a printed flag (report only, nothing built):** T1 figures 1+2 could share
  ONE grid at 239 ms — `16th 16th | 3:2 [16th 16th 16th]`, worst 5 ms = **0.17 heads**
  (the day-28 estimate was 0.10). Figures 5+6 also stand at 3:2 but at 1.13 heads. The
  writing path for a chosen case is still `--tuplet a-b@3:2` by hand; `fit()` cannot
  find sub-beat tuplets and was not touched.
- **New flag on T1, for the composer not the tool:** with figure 4 starting at note 8,
  note 8 is flagged as a possible PICKUP into it (242 ms before note 9, 42 ms off the
  grid of the rest). Flagged, never applied.
- **Scope (composer):** no universal protocol; improve and get closer; what does not
  generalize is by ear. `--cuts a,b,c` is now the "by ear" escape on both tools.
- **Picker holds** `t1-onegrid · t1-hybrid · t1-hybrid2 (composer's groups, ONE grid —
  BEAMING APPROVED as is) · t1-figures (day-27 cuts) · t1-figures2 (8h — composer's
  groups, each on its own grid)`. All scratch; **prune all but the chosen one** when
  T1's final is picked in step 5: `node tools/notate_section.js --prune <id>`.
- **Logistics:** screenshots need the Browser pane open on the composer's side (it was
  open this sitting and they work); DOM audit works without it.

### The tools you will use (all verified day 24)

| to… | run |
|---|---|
| see the page | `node score/server.js` → http://localhost:5200/notation/app/notation.html → pick `db1` (hard-reload after any `.js` change; data files hot-reload) |
| **read a part (8i — this is the report the reads use)** | `node tools/pattern_analyze.js --ir db1-c2i-x01 --part N --span t0-t1` (**N is ZERO-indexed: T1 = `--part 0`, T2 = `--part 1` …** — day 29 tripped on this) — breath seams, then per gesture: the pace families and the groups in words ("even even · pair · short long"), then **THE WRITING, ONE GRID** (the fit, then one line per group with its bracket — `7:4 [16th 16th 16th]` or plain), then **FLAGS** (STRADDLES first, then ratio tie / no clean seam / cuts by hand / near-ties / pickups), then **FLOW**, then cut alternatives, and **each group on its OWN grid LAST** as the by-hand alternative, with the dotted reading where a group carries its own tuplet |
| **scan a whole section (8i — the pre-read measurement)** | `node tools/pattern_analyze.js --ir db1-c2i-x01 --scan 36.19-40.42` — one row per gesture, every part: groups, one-grid unit and heads, its brackets, and the flags that need a hand. **Answers "can this gesture be said on ONE grid?"** — which replaced "how many figures need a tuplet" (that only measured how finely the material had been cut). *Measured on CLOUD02-I: 15 of 15 within a head, 5 straddles, 1 no-clean-seam, 5 ratio ties* |
| move a figure boundary | `--paceRatio <r>` (default 1.25) — how far apart two gaps must be to count as different PACES, which is what decides where a cut may land. `99` = one pace, no legal cut, the whole gesture as one group. Now on **both** tools (positional after `--cluster … --figures` on `notate_section`; plain flag on `pattern_analyze`) |
| **name the boundaries by hand (8h)** | `--cuts 2,5,7,10,14` — "cut after note 2, after note 5, …", numbered from 1 inside the gesture. The pace rule steps aside entirely. Positional after `--cluster … --figures` on `notate_section` (refused without `--figures`); a plain flag on `pattern_analyze` (refused when the span holds more than one gesture, and refused with `--scan`). A cut that would leave a one-note figure is refused with the reason |
| check the analyser still reproduces the composer's 25 figures | `node tools/pattern_analyze.js --ir db1 --validate` (**24/25** — cl-1 only; cl-25 stopped being an exception when T10 was rebuilt from the analyser on day 24, commit 2e06665) |
| build a figure | `--cluster t0-t1@part` on `tools/notate_section.js`, modifiers POSITIONAL after it: **`--figures` (8i: the groups from the pace rule on ONE grid, beams broken at the seams, brackets from the fit — the default and what the composer chose)** · **`--ownGrids`** (with `--figures`: the 8g/8h reading, each group on its own grid, no relation printed) · `--cuts a,b,c` · `--paceRatio r` · `--pattern` (one grid, no seams — implied by `--figures`, refused with it) · `--pickup N` · `--dyn 1:mf` · `--accents 1,3` · `--beamBreak n` (several groups on ONE tempo — refused with `--figures`, which makes its own breaks) · `--noGoLine` |
| see T1 on the page | the picker's experiments hold **`t1-final`** alone — the composer's six groups on ONE grid, 7:4 · 6:4 · 7:4, built from the rule with no `--cuts` and no `--beamBreak`, and proved IR-identical to the hand-typed `t1-hybrid2`. The five scratch entries were pruned day 28; git keeps them (`t1-onegrid t1-figures t1-hybrid t1-hybrid2 t1-figures2`). Prune with `node tools/notate_section.js --prune <id>` |
| **clear a span to bricks** (day 26) | `--bare t0-t1[@part]` on `notate_section.js` — every drawn device element off, brick stays; `@part` optional; errors if a note in the span already carries a figure. The trials fork carries `--bare 36.19-40.33`; **narrow it (or add `@part`) as each part gets figured** |
| rebuild the whole file | copy `provenance.build` out of `db1.ir.json` and run it; append new `--cluster …` groups to the end |
| **run the playability process on a section** | `node tools/playability.js --score piece-s25-finished01 --section <MARKER LABEL> --brick 0.05` (dry run; `--apply` makes the moves, normalises bricks, appends the ledger lines and prints the re-extract command; `--listen` writes a before/after score) |
| normalise one-shot written lengths | `node tools/set_brick.js --score <name> --group <id> --brick 0.05 [--apply]` |
| move ONE note by hand | `node tools/move_object.js --score piece-s25-finished01 --object wc-N --toPart P [--apply]`, then ledger it |
| batteries | `test_layout test_render test_animobj test_splice test_snapshots test_coords test_stamps test_pattern_fit test_midiplayer test_playability` — all green at close |

### PLAN 8f — where it stands (detail in PLAN.md 8f/8g; trails in RUNNING_LOG days 25–27)

**Day 25's THE PLAYABILITY PROCESS** (`docs/PLAYABILITY_MODEL.md`) governs: "it feels
very dense" meant UNPLAYABLE, not too-much — evaluate for playability, fix by
redistribution, report audibility as a flag only. Thinning stayed research.
Parts 1 (archive amended + ledgered), 2 (`playability.js`, 22 assertions, D64/D65),
**8g** (the segmenter, D67), **8h** (the two-sided seam rule, D68) and **8i** (the
composer's page as the default build, D69) are all DONE. **Part 3 (the per-part reads)
is done for T1 — final `t1-final`, built from the rule; T2–T10 are step 5c and are the
next thing that happens.**

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

### Open after 8i (day 28) — in-flight, none blocking

- **THE STRADDLE FIX IS UNBUILT, and the reads will meet it five times.** Design call
  A(a) kept the bracket scope PER BEAT and said "flag it; fix only if one appears and
  the composer wants it". The scan says it appears in **T2 @38.60 · T4 @36.20 (three) ·
  T9 @36.33 · T9 @37.39 · T10 @38.69**. The fix would be a bracket scoped to the FIGURE
  rather than the beat — a change to `fit()`'s per-beat tuplet model, which nothing has
  touched since D63. Not started, deliberately: it is the composer's call, part by part.
  The by-hand escapes that exist today are moving the seam (`--cuts`) or `--ownGrids`.
- **The dotted-16th writing path is STILL NOT BUILT.** Under D69 it is less urgent —
  brackets are welcome now, so a tuplet is not a thing to be avoided — but it is still
  the only reading `dottedReading()` can offer and not write. Needs `noteUnits 1.5` in
  `layout.js`. Small build, not started, deliberately not guessed at.
- **FLOW is a flag with no builder** (composer's call B(a)). Where the composer takes
  one, the page is written by hand with `--tuplet a-b@3:2` on a shared grid; `fit()`
  cannot find sub-beat tuplets and was left untouched by 8g/8h/8i. On CLOUD02-I the
  report offers a FLOW pair on twelve of the fifteen gestures.
- **Five gestures hang on the pace threshold** (RATIO TIE: T1 @36.22, T3 @36.33,
  T4 @36.20, T6 @37.70, T7 @36.19). The report prints the exact flip ratio and the whole
  alternative reading for each; the composer's verdict settles them, not more tuning.
- **T3 @36.33 sits at exactly 1.00 heads on one grid** — on the dissonance line, not
  over it, so nothing flags it. Worth the composer's eye when T3 is read. (T9 @37.39 is
  next at 0.99.)

### Open, not blocking

- `flagShortBarSeconds` 1.0 → 0.35? (21 flags vs 3); cuivré text mark on the
  three cuivre notes at 40.93; the `analyzer`'s per-beat tuplet model cannot
  place a tuplet across a beat line (T1's 3:2 straddles one — left as built).
- `export_midi --ir` still un-built (NITS); G2/G3 formally unclosed on paper.

---

- **Day 28, fourth sitting (Opus 5):** **PLAN 8i BUILT** — `--figures` is now the
  groups on ONE grid with the beams broken at the seams (D69), `--ownGrids` the
  alternative; `bracketsVsGroups()` + the STRADDLE flag; the report flipped (one-grid
  writing first, own grids last); **`--scan`** as the pre-read measurement. **`t1-final`
  is IR-identical to the hand-typed `t1-hybrid2` on every drawn field and alone in the
  picker; `--ownGrids` is byte-identical to `t1-figures2`.** Ten batteries green
  (`test_pattern_fit` 61 → 80), `--validate` 24/25, DOM-audited at :5210. **The scan
  found what the reads have to deal with: 15 of 15 gestures fit one grid inside a head
  (nothing needs `--ownGrids`), and FIVE carry a straddling bracket** — call A(a)'s
  watch item is real. Fixed on the way, unasked: `--pattern --pickup` had been placing
  the pick-up on the grid it was about to overwrite.
- **Day 28, third sitting (Fable 5):** THE VERDICT ON THE WRITING — *"I would like the
  tuplet brackets"*: T1's final is `t1-hybrid2`, not `t1-figures2`; **D69** (a pace
  change must be said on the page — the bracket is the message); 8h's grouping stands,
  8g's own-grids writing falls; A(a)/B(a) answered; **PLAN 8i** specified for Opus.
- **Day 28 (2026-08-23, Claude Code / Fable 5 then Opus 5):** THE T1 VERDICT (by ear:
  cuts after 2,5,7,10,14) exposed the day-27 seam test as ONE-SIDED, and **PLAN 8h was
  specified and built the same day** — two-sided legality (**D68**, *the seam is the
  slower gap*), the RATIO TIE and NO CLEAN SEAM flags, `--cuts` by hand on both tools,
  and the FLOW flag (report only). T1's legal set is now exactly the composer's five,
  all taken. `test_pattern_fit` 40 → 61 checks, `--validate` 24/25, `t1-figures2`
  DOM-audited against `t1-hybrid2` (identical heads and beams; the difference is three
  brackets). **The day-27 claim "no figure in CLOUD02-I needs a tuplet" did not survive
  the re-measurement — three do**, because the old rule over-cut (60 figures against
  55) and short figures fit for free.
- **Day 27 (2026-08-23, Claude Code / Opus 5):** PLAN 8g FIGURE SEAMS BUILT —
  `pattern_fit.segment()` (a gesture cut into figures, each fitted alone) · the
  words-first report · `--figures` + `--paceRatio` on `notate_section` · `gridId` as
  the grid domain in layout · `test_pattern_fit` 6 → 40 checks. **D67:** the cost
  model the plan specified provably could not reproduce the composer's reading; the
  rule that works came from their own day-26 method — a cut lands where the PACE
  CHANGES — which also makes no-shatter structural. T1 = six figures, NO tuplet
  anywhere; **not one figure in CLOUD02-I needs a tuplet** once cuts land at pace
  changes. Verified in the app; `t1-figures` / `t1-onegrid` left in the picker for
  the composer's eye.
- **Day 26:** `--bare` (a span cleared to bricks, figures guarded) · Part 3 on T1 — one
  cluster + one one-shot, the single grid's failure, the composer's reframe (D66) · PLAN
  8g approved · paper structure stored.
- **Day 25:** THE PLAYABILITY PROCESS — CLOUD02-I passes with 12 part moves and no
  removals, applied to the archive and ledgered (13 lines), bricks 50 ms, db1
  re-extracted; the process made a tool (`playability.js`, D64, D65); THE RHYTHM made
  standing.
- **Day 24 (2026-08-22, one long day, Claude Code / Opus 5 + Fable 5):** density
  build 1 figured for all ten parts, 25 clusters · the standards written down
  (NOTATION_STANDARDS.md) and made registry data · five design principles
  locked after a consistency review (D58–D62: go line = displacement · left edge
  = the moment · GC lands on the lane edge · rests left-edge + split at the
  beat · clusters are "go, then count") · D63 PATTERN BEFORE GRID, the pattern
  analyser built and validated 23/25 · three SCORE EDITS (part moves) · per-part
  solo on the notation page · the beam figure retired into the cluster · the
  T10 32nds replaced by a 3:2 · db1 promoted, the command stored in the file.
- **Day 23:** T1 figured note by note (D52–D57): the one-shot vocabulary, the
  first cluster, beamlets, the 3:2 tuplet to the composer's LilyPond standard.

- **Day 22 (three sittings):** 8b machinery (sonify_core → export_midi +
  live MIDI, hot reload, NOTATION_WORKFLOW.md) · THE COLLAPSE (the app IS
  the presentation score) · THE SURGE DEVICE on the real F#1 · wc-23
  designed element by element (go line, nh-unit, ring bar, sfzp) · **D49
  the IR is authoritative for sound** + ARCHIVE_AMENDMENTS · D50 device
  membership is registry data · D51 a fixed one-shot's length is its
  sample length.
- **Day 21:** plan interrogation (D46–D48) · V0/G0 + V1/G1 closed · V2
  (transport, animobj, the five ports) · V3 (notate_section loop) — the
  pre-notation critical path code-complete · trance section finished.
- **Days 19-20:** notation architecture A–D built end to end (D44, D45);
  Penn State deliverables preplanned (PLAN 8a).
- **Days 18-19:** trance section via console scripts (D41); 2ae/2af; E1+E1b
  (D43); notation architecture confirmed (four strata).
- **Days 12-17:** morphs (2v, D24-26) · texture sandbox (2x, D33) · cluster
  sandbox (2p) · density pipeline (2t, D19-23) · collision avoidance (2r,
  D17) · 2ab panel snapshots + 2ac multitempo rig · piece assembly.

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

## §4 Decisions

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

- *(2026-08-23, day 28 fourth sitting — CURRENT)* **8i is built; the reads are yours,
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
