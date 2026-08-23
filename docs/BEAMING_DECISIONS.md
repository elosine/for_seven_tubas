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
