# Beaming decisions — the ledger (started day 29)

> **Purpose (composer, day 29):** *"I want to just keep a log of what my decisions
> are and see if we can extract rules for that."* Rule-making is DEFERRED, as is the
> grouping-analysis structure — this file only records what was decided, where, in
> whose words, with the measured signals next to it. When enough rows exist, the
> rules get extracted here and promoted to `NOTATION_STANDARDS.md`.
>
> Reference for the standard practice these decisions play against:
> `research/beaming_standards.md` (Gould/Read/Ross/Stone, day 29).
> One row per decision. BEFORE → AFTER in beam-vocabulary
> (`break · through · over · overLeft · rest16 · plain`), composer's words shortened
> but verbatim where the wording carries meaning.

---

## D-log 1 · T2, CLOUD02-I (36.19–40.33) — the whole part, five sittings of verdicts

*File `t2-composer` ("T2 read E"), pinned day 29 at commit 3c0a17e. Part 1 (T2), two
gestures: 7 notes @36.19 (breath seam 502 ms) + 8 notes @38.60.*

| # | place | decision | composer's words | measured signals |
|---|---|---|---|---|
| 1.1 | the 499 ms pause after note 3 | ONE gesture, seam not breath (beam break only; no second go) — then superseded by 1.2's regrouping | (chose page A over D by implication) | 499 ms = 1 ms under the 500 ms breath threshold |
| 1.2 | gesture 1 grouping | [1 2 3] + [4 5 6] + 7, NOT the tool's [1-3]+[4-7] | "I hear three plus three plus one" | cut after 6 (414 ms gap) is a legal seam the tool refuses only because it leaves a one-note figure (MIN_FIGURE_NOTES 2) |
| 1.3 | all brackets | REMOVED — plain grid even though no plain grid is within a head (1.2 heads) | "let's get rid of all the brackets", "no tuplet" | the fit's coherent reading needed 7:4 + 3:2; plain best = 1.2 heads, the same 1.2 accepted on T1's 3:2 day 23 |
| 1.4 | rests before notes 4 and 7 | 8th/dotted-8th rests SPLIT into 16th rests (`--rest16 4,7`) | "change that eighth rest to two sixteenths" / "split that third rest, the dotted eighth, into three sixteenths" | the split rests are INSIDE the gesture, feeding the next figure — contrast D-log 2.4 |
| 1.5 | groups [1 2 3] and [4 5 6] | beams EXTEND over the first trailing 16th rest (`--beamOver`), secondaries SOLID (`--beamThrough`) | "extend the bar rightwards over the first sixteenth rest… two beams all the way through… so group of four" | overhang = the group's claimed time; "three partials + beamed-over rest reads as four slots" |
| 1.6 | note 7 (the lone tail) | first "two beamlets on the right"; FINAL: "a group of two" — beams reach LEFT over the one 16th rest before it (`--beamOverLeft`) | "the single one will be a group of two. beams over [the] sixteenth rest and then the partial" | a gesture may end with a one-note tail; the tail's beam claims the rest before it; the OTHER 16th rest (slot 12) stays outside |
| 1.7 | gesture 2 grouping | [8 9 10 11] + [12 13] + [14 15] — the cut at the DOMINANT gap (430 ms), then the (b) break at 292 | "I hear… four plus four" then, on the 219\|292\|186 disproportion, the sketch: "lets break the beam (b) like this, no tuplet" | 430 is 1.47× the next-largest gap; the 292 cut is the tool's original seam; NO single paceRatio spans T1's verdicts (<1.272) and T2's (>1.86) — the day-29 finding |
| 1.8 | the two last pairs | [12 13] secondary PARTIAL (stubs, not through); [14 15] secondary SOLID (through) | (the sketch: left pair open with partial beam, right pair tight with full double) | 219 ms pair drawn open, 186 ms pair drawn tight — stub-vs-through carries the width difference on a spatially true page |

## D-log 2 · T1, density build 1 ending figure (cl-1, 31.55–34.51) — day 29

*File `db1` (the promoted build — NOT `db1-all-x01`, which is the stale day-23 fork).
12 notes, unit 172 ms, pattern `N r N r | N N N r | N r N N | (8th rest) | tail`.
BEFORE: one beam over notes 1–8 (`--beamBreak 9 --beamThrough 2`). Applied via the
stored rebuild command; batteries green, `--validate` still 24/25.*

| # | place | decision | composer's words | measured signals |
|---|---|---|---|---|
| 2.1 | notes 1–8 | THREE groups of four slots: [1 2] + [3 4 5] + [6 7 8] (`--beamBreak 3,6,9`) | "the first four partials… beamed together… same thing for the next four… then the last four in that group" | the cuts sit EXACTLY on the fit's beat lines (slots 4, 8) AND are legal pace seams under D68 — beat-grouping and pace-grouping coincide here |
| 2.2 | all three groups + tail | secondaries SOLID (`--beamThrough 1,2,3,4`) | "solid double beams all the way through" | consistent with D-log 1.5 |
| 2.3 | groups [1 2] and [3 4 5] | overhang over the trailing 16th rest (`--beamOver 1,2`); group [6 7 8] ends on a note → NO overhang | "with the overhang over… the fourth spot, the last sixteenth rest" | claimed-time to the beat line; a group ending on a note claims nothing further |
| 2.4 | the 8th rest (slots 12–13) and the tail | UNTOUCHED | "eighth rest is fine, and the last figure is fine" | the 8th rest SEPARATES figures — kept whole, unlike D-log 1.4's split rests, which were INSIDE a gesture |

## D-log 3 · T2 + T3 ending figures (db1) — day 29, dictated

*Applied in `db1-rebeam-x01` (db1 kept untouched as the before, composer's ask).*

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 3.1 | T2 cl-3 grp 1 (32.56, `N r r N r N`) | 8th rest → two 16ths (`--rest16 2`); all six slots one solid double beam (`--beamThrough`); NO overhang | "split the eighth rest into two sixteenths… beam all six spots… all double beams. No over[hang]" | ends on a note — nothing to claim |
| 3.2 | T2 cl-3, between the groups | the two 8th rests STAY | "Then two eighth rests" | separator rests keep value (rule cand. 3 again) |
| 3.3 | T2 cl-3 grp 2 (`N r N N`) | solid double beam | "double beam that whole group" | |
| 3.4 | T3 cl-4 (29.93, 5 notes, silences 1·3·2·4 units) | keep ONE group; ALL rests 16ths (`--rest16 3,4,5`); solid double | "keep all of those five note heads beamed together… make all the rests sixteenth rests" | the 4-unit silence = four 16th rests — inside a group, the pulse shows |
| 3.5 | T3 cl-5 (`N r N N`) | solid double | "beam all those together double beams" | |
| — | T2 cl-2 (31.18, pickup pair) | untouched — not mentioned | "T two has two figures" (cl-2 not counted) | the composer counts beam groups of the ending gesture as "figures" |

## D-log 4 · T4–T10 (parts 3–9) — day 29, AI-extrapolated, AWAITING THE COMPOSER'S EYE

*Composer: "I think I'm following a pretty regular pattern… can you try doing
re-beaming t four through t ten? and then I'll look at it when you're done."*

**The recipe extrapolated from D-logs 1–3:** every group's secondary beam SOLID
(`--beamThrough`) · every within-group silence of ≥2 slots written as 16th rests
(`--rest16`) · between-figure rests keep their value · no overhangs added · existing
beam breaks unchanged · tuplet-internal rests belong to the bracket, untouched.

| cluster | change |
|---|---|
| T4 cl-7 33.13 (`N r N N`) | through |
| T7 cl-16 33.58 (`N r r N r N r N`) | through + rest16 2 |
| T8 cl-21 31.77 (`N r N r r N r r N`) | through + rest16 3,4 |
| T8 cl-22 33.89 (`N r N N N`) | through |
| T10 cl-25 32.93 (3:2 tail + `N r N r r N`) | through + rest16 5 (the 8th rest INSIDE the 3:2 bracket untouched — it is the tuplet's own vocabulary) |
| T4 cl-6/cl-8 · T5 cl-10/11/12 · T6 cl-13 · T7 cl-14/15 · T8 cl-20 · T9 cl-23 · T10 cl-24 | NO CHANGE — adjacent notes only; already solid doubles |

**Audit (real layout path, parts 1–9, 29–35.5 s):** secondary stubs 24 → 1 (the
untouched T2 pickup pair), solid secondaries 7 → 12, 16th rests 16 → 30, 8th rests
10 → 3 (T2's separator pair + T10's in-bracket one). No new warnings.

## D-log 5 · T2 read E, second round + THE DYNAMICS FLOOR — day 29

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 5.1 | CLOUD02-I dynamics | **mf is the section's floor**: partials banded below mf get NO mark and NO flag; the standing ambient prevails | "MF is… for this section, the cloud, the quietest. anything below that, we can just disregard… whatever the already standing dynamic will prevail" | kills all six day-29 flags; T2 g1's p-at-member-7 removed (`--dyn 1:mf`); applies to T3–T10's derivations too |
| 5.2 | T2 note 7 (the freestanding 16th) | back to **two beamlets to the right** — `--beamOverLeft` dropped | "let me change my mind on that freestanding sixteenth. let's go back to the beamlets to the right" | SUPERSEDES 1.6; the overLeft device stays in the tool, unused here |
| 5.3 | T2 [12 13] (second-to-last pair) | secondary **solid across** + **overhang over the 16th rest after it** (`--beamThrough 2 --beamOver 2` on cl-3) | "sixteenth beams all the way across and overhang that sixteenth rest" | SUPERSEDES 1.8's stub look and the sketch's open rest — the pair now claims its rest; [14 15] unchanged |

## D-log 6 · T1 rebeamed; T2 DONE; T3 proposed — day 29, the section file takes over

*Everything now lives in **`db1-c2i-x01`** ("CLOUD02-I — T1 T2 FINAL + T3 proposed");
the six scratch pages (t1-final, t2-figures/owngrids/fourpairs/twogoes/composer) are
pruned — git keeps them. T4–T10 stay bare per part.*

| # | place | decision | notes |
|---|---|---|---|
| 6.1 | T1 CLOUD02-I | rebeamed per the recipe: `--beamThrough 1..6` (solid doubles); no rest16 needed (no ≥2-slot within-group silences outside brackets); **brackets KEPT** (7:4 · 6:4 · 7:4 — D69 day 28, not a beam matter; composer to flag if they should go) | composer: "can you rebeam t one? and the dynamics are fine" |
| 6.2 | T2 CLOUD02-I | **DONE** — composer's word; folded into the section file as decided (D-logs 1, 5) | "we'll mark t two is done" |
| 6.3 | T3 CLOUD02-I | **AI-PROPOSED, awaiting the look**: `--figures --plain` — the pace rule's six groups ([1-3][4-6][7-10][11 12][13 14][15-17]) survive tuplets-off unchanged; through 1..6; dyn 1:mf, accents 2,3,5,12,15,17 (mf floor); no rest16 (the one 2-slot silence is a separator) | **THE FLAG: plain costs 1.80 heads with EIGHT of 17 notes at 1.4–1.8** vs exactly 1.00 with brackets (5:4 · 3:2 · 5:4 · 3:2). T3 is the part that needs the tuplet vocabulary; the bracketed build is one command if wanted |

## D-log 7 · T3 refinements on the tuplet page — day 29

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 7.1 | T3 g3 [7-10] | SPLIT at the beat: **[7 r r 8] + [9 10]** (`--cuts 3,6,8,10,12,14`), the 8th rest before note 8 as two 16ths (`--rest16 8`) | "make that eighth rest two sixteenths… notehead, sixteenth rest, sixteenth rest, notehead. And let's break the beam. So that's a group of four units" | the break lands on the beat line; the 3:2 now covers exactly its own beam group [9 10] — bracket = group, the standard's ideal |
| 7.2 | (context) | the refinement was made ON `t3-tuplets` — the composer is working the tuplet version | | plain-vs-tuplet verdict still unstated in words; the engagement says tuplets |

## D-log 8 · T3: the bracket groups claim their bracket rests — day 29

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 8.1 | T3 g4 [9 10], the 3:2 | beams reach **LEFT over the leading 8th rest** of the bracket (`--beamOverLeft 4`) | "Extend the three two beam to the left over the eighth rest" | the anchors became TUPLET-AWARE: an 8th-level bracket slot is wider than one unit |
| 8.2 | T3 g5 [11 12], the 5:4 | beams extend **RIGHT over BOTH trailing 16th rests** (`--beamOver 5`) | "extend the five four beams over the two sixteenth rests" | over now claims ALL trailing bracket rests (matching the bracket's own content-extent rule); outside a bracket it still claims the first rest only |

## D-log 9 · T3 DONE — the tuplet version is T3 — day 29

Composer: *"Okay. That's t three done."* The verdict fell by engagement, not
proclamation: every refinement (D-logs 7, 8) was made on the TUPLET page, and it is
the one folded into the section file. **So: T2 carries no brackets; T3 carries four.
The reconciling insight, now with two data points: the bracket earns its place where
the plain writing fails PERVASIVELY** (T3 plain: eight of 17 notes at 1.4–1.8 heads)
**and is noise where plain nearly holds** (T2 plain: one note at 1.2). The section
file is `db1-c2i-x01` = T1 T2 T3 FINAL; `t3-tuplets` pruned (git keeps it).

## D-log 10 · T4 AI-PROPOSED, awaiting the look — day 30

*Built into `db1-c2i-x01` (cl-30) per the standing recipe. The first part where rule
candidate 8 was applied BY MEASUREMENT before proposing: plain puts SIX of 17 notes
over a full head (1.03–1.83, worst 1.83) vs brackets' 0.90 worst with none over —
the T3 profile, so the proposal is the BRACKETED build (5:4 · 6:4 · 5:4 · 6:4 · 6:4
at ♩=115). Groups identical with tuplets off (cuts 2,6,9,11,13,15 both ways).*

| # | place | decision | notes |
|---|---|---|---|
| 10.1 | T4 CLOUD02-I | proposed `--figures --beamThrough 1..7 --rest16 9 --dyn 1:mf,14,16 --accents 1,4,6,8,9,10,12` | recipe: through everywhere; the one ≥2-slot within-group silence outside a bracket (before note 9) split; bracket-internal rests untouched (rule cand. 9); no overhangs |
| 10.2 | dynamics | ambient mf; accents on the seven above-ambient f's; **fff pair [14 15]** = beam-group start two bands up → member 14 marked fff (T1 member-15 precedent), member 16 marked f on the fall-back, 17 unmarked | the rule's least-certain output — flagged |
| 10.3 | OPEN for the read | **three straddles** (6:4 over 6–7, 11–13, 15–17 — call A(a) live) · ratio tie (cut after 2 vs after 4, flips at 1.230) · near-ties notes 6, 9, 11 · note 7 possible pickup into g3 | composer's verdicts become rows here |

## D-log 11 · T4 read, first round — day 30: bracket-aligned groups on the first stretch; THE COUNTING-VS-PHRASE QUESTION named

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 11.1 | T4 first stretch (notes 3–9) | regrouped to the BRACKETS: [3 4 5] = the 5:4's own beam group · [6 7] = the 6:4's own · [8 r r 9] = the four 16th slots as their own (`--cuts 2,5,7,9,…`) | "starting with the five four let's group each together. So the five four is its own beaming group. Six four is its own beaming group and the four remaining… four sixteenths are its own beaming group" | bracket = beam group (rule cand. 9's ideal) chosen by the composer unprompted; **straddle #1 dissolved by the regrouping** — the seam moved to the bracket edge. The old pace-rule cuts 6 and 9 → 5, 7, 9 |
| 11.3 | notes 10–13 | **DECIDED: one phrase beam over all four, 5:4 and 6:4 wholly inside it** (`--cuts 2,5,7,9,13,15` — the cut after 11 dropped) | "ok a" | straddle #2 dissolved by containment (widening), where straddle #1 dissolved by identity (aligning) — the two directions of the same rule, one round apart. Only beat 7's straddle remains |
| 11.2 | notes 10–13 (the second 5:4 + 6:4) | ~~OPEN — the question, not yet decided~~ *(→ 11.3)* | "the tension is between counting groups and phrase groups. …the second five four and six four, those are really a group of four notes. So if I group them by a five four beat and then a six four beat, it would look like one and three" | counting grouping here degenerates: the 5:4 holds ONE note (a beam group of one = flag, no beam). AI's offered resolution: **containment** — a bracket may sit strictly INSIDE a wider phrase beam; only the crossing garbles. Measured support for "four": internal gaps 241/236/197 ms, every pairwise ratio ≤ 1.22 < 1.25 — one pace pairwise; the 2+2 cut after 11 exists only through greedy band anchoring (band 0 anchored at 174 claims 197) |

## D-log 11 (continued) · T4 rounds 3–4 — day 30: the merge and the sub-beat 3:2

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 11.4 | notes 3–7 (first 5:4 + 6:4) | **merged into ONE beam group**, both brackets wholly inside (`--cuts 2,7,9,13,15`) | "yes merge 3-7" | the round-1 cut after 5 (a counting cut, mid-run by pace — D68 itself refuses it) reversed once the principle was named; the pairwise chain 205·214·215·265 (adjacent ratios ≤ 1.23) reads as one phrase |
| 11.5 | beats 5 and 7 (the two 6:4s) | **REWRITTEN as plain 16ths + a sub-beat 3:2** on the off-lattice note's 8th: `--tuplet 12-13@3:2 --tuplet 16-17@3:2`. Built this day: under `--figures`/`--pattern` a hand `--tuplet` now OVERRIDES the fit's beat bracket (window written as the hand says · the beat's other members must sit ON the plain lattice, written plain · a window may not cross a beam seam · positions never move, only the writing) | "build the 3:2" | **the 6:4s were per-beat-model artifacts** — notes 11/12 and 15/16 sit ON the plain lattice; only 13 and 17 are off it, each exactly slot 2 of a 3:2 over its beat's last 8th. After: **zero straddles in T4**, [14 15] a bare plain pair, [16 17] = bracket exact. Inert gate: unchanged commands rebuild byte-identical. **Rule candidate 10: a bracket covers only the notes that need it — where a beat's off-lattice notes fit a sub-beat window, the small bracket beats the whole-beat one** (this also retires the day-28 A(a) "scope the bracket to the figure" fix for every case seen so far) |

## D-log 12 · T4 DONE — day 30

Composer: *"t4 all good."* T4 is FINAL in `db1-c2i-x01` (cl-30) as built through
rounds 1–4: 6 groups [1 2][3-7][8 r r 9][10-13][14 15][16 17], brackets
5:4 · 6:4 · 5:4 · 3:2 · 3:2, zero straddles, dynamics as proposed — **the D-log
10.2 dynamics derivation (fff pair → band mark at 14, f fall-back at 16) is
ACCEPTED, first confirmation of the two-band precedent.**

## D-log 13 · T5 AI-PROPOSED (cl-31), awaiting the look — day 30

*The first part proposed with ALL day-30 lessons applied at build time (see the
recipe's day-30 additions below). One gesture, 16 notes, six groups
`pair · short short long · long short · pair · even even · pair`.*

| # | check | result |
|---|---|---|
| 13.1 | rule-8 census | brackets worst 0.87 (0/16 over a head) vs plain worst 1.63 (**8/16 over**) → BRACKETS, the pervasive-failure profile |
| 13.2 | containment (rule 10) | zero straddles as-fitted: 7:4 ⊂ g2 · 5:4+6:4 ⊂ g3 · 3:2 = g5 exact |
| 13.3 | lattice (rule 11) | no artifacts — every bracketed note off-lattice (7:4: all three · 5:4: lone note 7, no sub-beat form exists · 6:4: both · beat-3:2: even triplet of 8ths, honest); nothing rewritten |
| 13.4 | recipe | through 1..6 · `--rest16 6` (the one ≥2-slot within-group silence outside brackets, before note 6) · separator rests keep value |
| 13.5 | dynamics (day-24 + mf floor + T4 precedent) | ambient mf@1 · **fff pair [3 4] at group-2 start → band mark on 3** · f fall-back marked on 6 (**mid-group — the shift point; flagged as least-certain**) · accents 2, 14, 16 (above-ambient) · notes 5 (ppp) and 7 (p) below floor, unmarked |
| 13.6 | OPEN for the composer | **two PICKUP flags** (note 3 → group 2, 25 ms off the rest's grid; note 7 → group 3, 99 ms off) — flagged, not applied · near-ties notes 9, 6, 14 · the f-at-6 dynamics call |

## D-log 14 · T6 AI-PROPOSED (cl-32/cl-33 + a lone one-shot), awaiting the look — day 30

*Three units: a lone one-shot @36.32 (un-bared — renders per the one-shot
vocabulary, GC + go line + band f) · a pair cluster @36.92 (`--dyn 1:f`, second
note ppp = below floor, unmarked) · a 12-note gesture @37.70, four groups
`pair · pair · even ×5 · pair`.*

| # | check | result |
|---|---|---|
| 14.1 | rule-8 census (12-note gesture) | brackets worst 0.95 (0/12 over) vs plain 1.57 (**6/12 over**) → BRACKETS |
| 14.2 | containment | zero straddles: 7:4 ⊂ g3 · 5:4 = g4 exact |
| 14.3 | lattice | no artifacts (7:4: all three off · 5:4: both off, neither reduces to a sub-beat window) |
| 14.4 | recipe | through 1..4 · no rest16 (the one ≥2-slot silence is a separator, keeps its 8th) |
| 14.5 | dynamics | ambient mf@1 · accents 2, 7, 8, 9, 11 · note 5 (p) below floor · no two-band jumps |
| 14.6 | OPEN for the composer | **RATIO TIE: the cut after 4 flips at pace ratio 1.248** — under it the seam moves to after 5 ([3 4 5] + [6-10]); the even run's own spread is 166/133 = 1.248, exactly at the line · near-tie note 2 |

## D-log 15 · T5 and T6 DONE — day 30

Composer: *"t5 and t6 good."* Both FINAL as proposed (cl-31, cl-32/33 + the lone
one-shot). Settled by the acceptance: T5's two pickup flags stay unapplied · the
f fall-back marked MID-GROUP at the shift point (T5 note 6) is accepted — second
confirmation after T4, the mid-group placement now confirmed too · T6's ratio
tie stays as built (pair + five evens, not triple + four).

## D-logs 16–19 · T7–T10 AI-PROPOSED (cl-34–40) — day 30, the five checks on the last four parts

| log | part / gesture | census (rule 8) | containment + lattice | dynamics | OPEN for the composer |
|---|---|---|---|---|---|
| 16.1 | **T7 g1** (cl-34, 6n, the NO-CLEAN-SEAM gesture) | brackets 0.90 vs plain 1.10 with **1/6 over → PLAIN** — **the first plain verdict by census** (T2's profile); the page prints its honest cost ("ONE GRID IS OVER A HEAD (1.1)") | one group (no legal seam); the fit's 3:2 dropped with the plain verdict | 1:f · mf fall-back on 4 (mid-group shift point, T4/T5 precedent) · notes 3, 6 below floor | RATIO TIE: past paceRatio 1.257 three pairs appear ([1,2][3,4][5,6]) · PICKUP flag note 1 (0.7 without vs 0.9 with) · the bracketed alternative (0.90, one 3:2) is one word away |
| 16.2 | **T7 g2** (cl-35, 8n) | 0.93 vs 1.53 (**4/8 over**) → brackets | two even beat-3:2s (honest-triplet exception), both ⊂ their groups; the parallel shape `short short long ×2` preserved | 1:mf · accents 1,4,6,7,8 (the three fff's are LONE spikes → accents, not marks) | PICKUP flag note 5 |
| 17 | **T8** (cl-36, 16n, one gesture, six groups) | 0.90 vs 1.57 (**8/16 over**) → brackets | **one rule-11 artifact fixed: beat 1's 6:4 → hand 3:2 over notes 4-5** (note 4 sits ON the lattice at slot 0); beat 2's 6:4 kept (both notes off, two windows would be more ink — T4-beat-2 exception); 5:4/3:2/5:4 kept (no windows) · zero straddles | 1:mf · accents 1,2,5,9,11,12,13,14,15,16 (ten — the material is f-heavy) · note 8 (vel 26!) below floor | near-ties notes 7, 11 · PICKUP flags notes 1, 4 |
| 18.1 | **T9 g1** (cl-37, 4n) | 0.70 vs 1.20 (**2/4 over**) → brackets | **the straddling whole-beat 6:4 DISSOLVED into two sub-beat 3:2s (bracket = pair, twice)** — T4's ending pattern; first same-beat double window (found and fixed a sequencing bug in the override: validation now runs against the UNION of hand windows) | 1:mf (members 1, 3 below floor) · accent 4 | — |
| 18.2 | **T9 g2** (cl-38, 13n) | 0.99 vs 1.60 (**6/13 over**) → brackets — worst sits AT the 1.0 line (the day-28 watch item) | **THE ONE SURVIVING STRADDLE: beat 1's 5:4 covers notes 3-4 across the seam after 3.** Checklist exhausted: no sub-beat window (4.8 is on no den-2 lattice) · widening [1-6] fails pairwise (gaps 451/205/359/244/194) · aligning (cut after 4) is illegal under the pace rule and breaks the `long short · long short` parallel | 1:mf (member 1 below floor) · accents 8,9,11,13 · rest16 2 | **the straddle — genuinely yours**: accept, or name a cut, or --ownGrids · PICKUP flags notes 1, 4 · near-tie note 9 |
| 19.1 | **T10 g1** (cl-39, 7n) | brackets = plain 0.93 (identical — **the section's first ALL-PLAIN fit**, no tuplet anywhere) | two groups, plain 16ths throughout | 1:mf · accents 1,3,6 | PICKUP flags notes 1, 4 · near-tie note 2 |
| 19.2 | **T10 g2** (cl-40, 8n) | 0.80 vs 1.40 (2/8 over — exactly the bracketed notes) → brackets | **straddling 6:4 DISSOLVED into two sub-beat 3:2s** (bracket = pair; the second window carries a leading bracket rest) | 1:mf · **f run [3-6] = sustained one-band shift → band mark at 3 (group start)** · mf fall-back at 7 (mid-group shift point) · members 1, 2 below floor · rest16 8 | PICKUP flag note 5 |

## D-log 20 · T9 g1 + T10 g2: ONE SUBDIVISION, ONE BRACKET — day 30

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 20.1 | T9 g1 (cl-37), the four-note opener | the two sub-beat 3:2s **replaced by the fit's single 6:4 over the beat** | "t9 all 3:2s in the beginning meant to be about the same? then if yes 6:4 1 bracket" | verified before applying: both windows sit on the SAME lattice (sextuplet of ♩=89, slot width 112 ms in each) — the answer to the question is yes, so the composer's rule fires. Beam pairs [1 2][3 4] stay; the bracket now spans the seam — SANCTIONED (see the A(a) note below) |
| 20.2 | T10 g2 (cl-40), notes 1–4 | same — one 6:4 | "same with the 2 3:2s in t10" | identical configuration (two 3:2-of-8th windows, one lattice, ♩=97) |

**Rule candidate 12 — the unit of the bracket is the SUBDIVISION RUN, not the beam
group.** Where adjacent groups genuinely share one tuplet lattice, ONE bracket over
the run beats per-group fragments — fragmenting one subdivision into two windows
to satisfy bracket = group is ink, not information. This REFINES rule 11: the
sub-beat shrink applies where it FREES A PLAIN HALF (T4's beat 7: [28,30) held no
off-lattice note, so [14 15] became a bare pair — that shrink removed a false
sextuplet claim); it does NOT apply where both halves need the lattice (T9 g1,
T10 g2: an off-lattice note in each half — the whole beat is genuinely sextuplet,
and one bracket says it once). **And it answers call A(a) for the same-subdivision
case: a bracket across a beam seam is sanctioned when the subdivision truly spans
the seam** — the STRADDLE flag stays as information, not as a defect. (20.1, 20.2;
contrast 11.5 and 18.1-as-first-built.)

## D-log 21 · CLOUD02-I DONE; the fold — day 30

Composer: *"then all good, cld 1 done, bump all the save files… otherwise, the way
it's notated is pretty close just with the changes I listed above."* **The section
is FINAL.** Settled by the acceptance: T9 g2's 5:4 straddle stays (the one A(a)
residue — accepted as built) · T7 g1 stays plain (its ratio tie and the one-3:2
alternative decline) · all nine pickup flags stay unapplied · all near-ties stay
as chosen.

**The fold ("bump all the save files"):** everything rebuilt into **`db1`**
("DENSITY BUILD 1 + CLOUD02-I — all parts figured (day 30)"); `db1-c2i-x01`
PRUNED (git keeps it); **`db1-all-x01` deliberately KEPT** — it is
`test_pattern_fit`'s frozen validate golden, and D65 says a fixture is never a
file the tools rewrite. The scan test and `test_layout`'s bracket-clears-beam
check re-pointed to `db1`. `--validate` on the merged file: **37 of 40** — the
three DIFFERs are all the ear overruling the fit, each on the record (cl-1 T1's
day-23 3:2 at 1.2 heads · cl-28 T2's "get rid of all the brackets" · cl-34 T7's
rule-8 plain verdict).

## D-log 22 · The two closing marks: uniform blast bars · cuivré — day 30

| # | place | decision | composer's words | notes |
|---|---|---|---|---|
| 22.1 | the 40.93 blast (ten parts) | **all ten ring bars written at the DRAWN BRICK's length — 1.010 s uniform** (`--ringFromBrick 40.9-41.0`, new; layout honors `device.ringSeconds`, drawing only) | "the long tone at forty one, just make sure they're all the same length. Take the length from the brick in the composer score. The s twenty five finished" | D51 had each bar at its own sample length (0.99–1.60 s) — ten lengths for one chord struck together. The flag reads `endSeconds−startSeconds` from the score object, so a redrawn brick flows through on rebuild. Two honest warnings (T4/T6's bars run ~60 ms past the breath before their next attacks — drawn as asked; uniformity is the instruction) |
| 22.2 | the three cuivre notes (T1 T4 T8 @40.93) | **`cuivré` text above each** (registry `byTechnique.cuivre.techText`; layout draws it at the tag row) | "the only thing to add is the quivere… I think it's just with text, but let's double check that" | double-checked: yes, text — the day-24 open item said "text mark", and engraving practice agrees (cuivré/brassy is a text instruction; the `+` sign is hand-stopping, a different device). The registry field is general: any technique can carry a text |

## THE STANDING BUILD RECIPE (day 29, composer: "incorporate as much as possible the beaming rules in that [notating] process")

Until rules are extracted, every NEW figure built (CLOUD02-I notating and onward)
applies D-log 4's recipe by default: **secondaries solid (`--beamThrough` every
group) · within-group silences of ≥2 slots as 16th rests (`--rest16`) · separator
rests keep their value · overhang only where the composer says the group claims the
time · tuplet-internal rests belong to the bracket.** Deviations happen only at the
composer's word, and each one gets a ledger row. *(D-log 4 was promoted into `db1`
on day 29 — composer: "That's all good. You can go ahead and promote that one.")*
**Dynamics (added later on day 29):** the day-24 dynamicsRule proposes marks per
cluster, **with mf as CLOUD02-I's floor** — below-mf bands are unmarked and
unflagged (D-log 5.1); accents mark above-ambient partials; the AI names anything
else it cannot explain.

### Day-30 additions (from the T4 read — build-time checks for every new figure, and the generator's checklist)

1. **Rule-8 census BEFORE proposing.** Measure the one-grid writing both ways,
   per note: brackets where plain fails pervasively (many notes over a head),
   plain where it nearly holds. The datum so far: T2 1/15 over → plain; T3 8/17,
   T4 6/17, T5 8/16, T6 6/12 over → brackets. The statistic is "how many notes
   lie", not "how far the worst one is".
2. **Containment (rule cand. 10).** A bracket must never cross a beam-group
   boundary; it may sit wholly inside a wider phrase beam. Straddles are
   RESOLVED at proposal time, not shipped as open flags — by aligning the group
   to the bracket (counting), widening the beam over the whole bracket (phrase —
   prefer this where the notes are one pace by PAIRWISE ratio, ≤1.25 adjacent),
   or shrinking the bracket (check 3). The build refuses a hand tuplet that
   crosses a seam.
3. **Lattice audit (rule cand. 11).** For every fit tuplet beat, list the
   members actually off the plain lattice. Where the off-lattice notes fit a
   sub-beat window, the whole-beat tuplet is an artifact — write plain 16ths +
   the small bracket via the hand-tuplet override (`--tuplet a-b@3:2`, day 30:
   overrides the fit's beat, validates the beat's other members onto the plain
   lattice, never moves positions). Standing exceptions: a 7:4 (never reduces) ·
   a 5:4 holding one off-lattice note that fits no den-2 window (T4 note 10, T5
   note 7 — 32nd-class windows are out of the vocabulary) · a beat-3:2 over
   three genuinely even notes (T5 g5 — the even triplet IS the honest writing,
   even with its first note on the lattice).
4. **Dynamics, extended (T4 accepted, D-log 12).** Day-24 rule + mf floor, plus:
   a TWO-band jump (fff) arriving as a pair at a beam-group start takes a band
   mark on its first member (no accent on marked members); the fall-back level
   gets its own mark at the return (group start where one exists, else the shift
   point, flagged); a LONE one-band spike is an accent, never a mark. Below-floor
   members get nothing and no flag.
5. **Pickups stay flagged, never applied** (unchanged, day 24) — and a
   composer grouping that beams the candidate backward settles its pickup
   question by implication (T4 note 7).

## Emerging rule candidates (NOT rules yet — extraction deferred by the composer)

1. **The beam's extent is the time the group claims.** Overhang over a trailing rest
   the group owns; no overhang when the group ends on a note; a separator rest stays
   in the open. (1.5, 1.6, 2.3, 2.4)
2. **Solid double beams within a group; the secondary tells pair-width** — through =
   tight, stubs = open. (1.5, 1.8, 2.2)
3. **A rest inside a gesture is written in the pulse that continues** (16ths); a rest
   between gestures keeps its largest value. (1.4 vs 2.4)
4. **Brackets are out; breaks and spacing say the pace** — at least in this material.
   D69's writing clause needs a rewrite when rules are extracted: the bracket is the
   message only when a pace change falls INSIDE a beam group. (1.3, 1.7)
5. **Group at the dominant gap; a one-note tail is allowed** — the pace threshold is
   not one number (T1 <1.272 vs T2 >1.86); the segmenter's MIN_FIGURE_NOTES and
   fixed ratio both disagree with the ear somewhere. (1.2, 1.6, 1.7)
6. **Where a beat exists, group by it** — cl-1's groups are the fit's beats; on T2's
   gestures (no clean beat) the groups came by ear. (2.1)
7. **A figure = a beam group, and the composer counts figures BY beam group** (T2's
   cl-3 = "two figures"). Tuplet-internal rests are the bracket's, not the figure's.
   (3.1–3.5, D-log 4 T10)
8. **Brackets where plain fails pervasively; plain where it nearly holds.** T2: one
   note at 1.2 heads → no brackets. T3: eight of 17 at 1.4–1.8 → four brackets. The
   threshold is not a number yet; two points suggest "how MANY notes lie", not "how
   far the worst one is". (1.3, 6.3, 9)
9. **A bracket ends at its CONTENT, and a bracket group may claim its bracket
   rests with its beams** — leading (the 3:2's 8th rest, overLeft) and trailing (the
   5:4's two 16ths, over — ALL of them, unlike the plain one-rest overhang). Bracket
   = beam group is the ideal (the g3 split made the 3:2 exact). (7.1, 8.1, 8.2, and
   the third-to-last-note fix)
10. **CONTAINMENT, not identity: a bracket must never cross a beam-group boundary,
   but may sit wholly inside a wider phrase beam.** The two legal shapes are
   bracket = group (identity, T3's ideal) and bracket ⊂ group (the phrase beam);
   the straddle is the only garble. Named on T4, where the composer named the
   axis: *"the tension is between counting groups and phrase groups."*
   (11.1, 11.3, 11.4)
11. **A bracket covers only the notes that NEED it.** Where a beat's off-lattice
   notes fit a sub-beat window, the small bracket (plain 16ths + 3:2 on one 8th)
   beats the whole-beat tuplet — the whole-beat 6:4 was a per-beat-model
   artifact, ink claiming "quicker" about notes that sit on the plain lattice.
   (11.5; enforced by the day-30 hand-tuplet override, which demands the beat's
   other members BE on the plain lattice)
