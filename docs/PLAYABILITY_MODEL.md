# PLAYABILITY MODEL — what the tooling checks, what it does not, and the breath research

> Created day 25 (2026-08-23) at the composer's request: *"let's keep this research
> handy documented, please, so we can refer to it later."* The running log carries the
> sequence (RUNNING_LOG.md, day 25); this file is the reference card. When a number
> here changes, change `Composer.CONFLICT` / the tool first, then this line.

## The levels, kept apart

The composer's framing (day 25): *"I'm discombobulated on the different level. So first,
let's break them up."* Four constraints act on a dense passage. They answer different
questions, live in different places, and only the first two are wired.

| level | question | lives in | status |
|---|---|---|---|
| **1 · HARD overlap** | two notes at once on one player? | `Composer.CONFLICT` (composer.html) · `tools/audit_playability.js` · `tools/cloud02i_ab.js` | wired; physics, cannot be tuned |
| **2 · SOFT re-attack** (tonguing / embouchure) | can the player reset between two attacks? | same | wired; estimates — tints amber, never blocks |
| **3 · BREATH** (air) | can the player inhale often enough? | nothing — measured by script only | **model stated below; not wired** |
| **4 · AUDIBILITY** (ensemble) | does the ear hear separate attacks? | `cloud02i_ab.js` (attack spacing, sounding count) | wired for CLOUD02-I; a composing decision, not a playability one |

Level 4 is included because the day-25 work kept colliding with it: **playability was
never the binding constraint on CLOUD02-I — audibility was.** The original 159 notes
pass levels 1–3 with eleven part-moves; they fail level 4 by a factor of three.

## Level 1 + 2 — the re-attack rule (wired)

```
HARD  : next.start < prev.end                       (the bricks overlap)
SOFT  : next.start − prev.end < tongueReset 0.03 s   (no silence to re-tongue)
     or next.start − prev.start < minAttack 0.11 s + min(maxLeapAdd 0.22, |leap st| × perSemitone 0.0093)
FREE  : otherwise
```

- Measured **attack-to-attack**, which is what a player feels. (End-to-start was tried and
  was wrong: a fixed one-shot's length includes decay the player is not articulating
  through — it flagged 167 comfortable spots in piece-s11.)
- Numbers come from 2j's measured tremolo table, which IS an attack rate: half step
  4.5 Hz = 0.111 s; fifth 3.0 Hz = 0.167 s; slope (0.167−0.111)/6 st.
- **Brick length does not enter the SOFT rule.** Shortening every CLOUD02-I brick to 50 ms
  changed nothing (0 hard before and after) — it is page hygiene.
- **Why a written check:** technique = MIDI channel, so two overlapping notes on one player
  hit two UVI channels and both sound cleanly. The mock-up cannot tell you this.
- Tonguing rate itself is never the constraint here: single-tongued staccato is
  comfortable to ~8 notes/s in bursts; per-part rates are 1–4/s.
- **Redistribution** (day 25, `cloud02i_ab.js`): the second note of a flagged pair moves
  to the part with the fewest notes where it is FREE against both neighbours; smallest
  leap breaks ties; re-flag after every move; unresolvable notes are reported, never
  forced. Time and pitch never change. Part changes do nothing for level 4.

## Level 3 — BREATH (the model; NOT measured; dials for a tubist)

Composer's question: *"are we confident that somebody could play a dense passage of notes
this short without re-breathing? … where we need to build in breaths or some more space
so the individual players can recapture their technique or recover."*

**Tonguing and air are different things.** Tonguing is the articulation mechanism (level
2). Air is how many puffs, how loud, how low, between chances to inhale:
- F#1–G#2 is the tuba's bottom octave — the most air-hungry register there is — and in
  CLOUD02-I 60 % of notes are ff or louder.
- A staccato costs a fraction of a held note: the air stops between attacks. A 4 s
  staccato passage is NOT a 4 s held note. A single held fff pedal note lasts a player
  roughly 4–6 s; 16–18 staccatos in 4 s use well under half that air.

**The model** (brass pedagogy, stated as assumptions):

| dial | value | meaning |
|---|---|---|
| catch breath | gap ≥ **0.5 s** between attacks | a quick top-up. Same number as D62's notation breath (`breathSeconds`) — convergent, not borrowed |
| full breath | gap ≥ **1.0 s** | a real inhale |
| X | **5 s** | longest run of loud low staccato playing without a catch breath |
| Y | **10–15 s** | longest run without a full breath |

**Proposed rule for the build loop (not built):** per part, no run longer than X s without
a gap ≥ 0.5 s, none longer than Y s without a gap ≥ 1.0 s. Where a run exceeds X, the fix
is the composer's: open a gap — move a note to another part, or drop one — at the point
that splits the run best. A tubist sets X and Y.

**Held notes count differently.** Fortepianos, ord and surges are sustained (ring bar):
their written length is air spent continuously. The sweep below reports them separately
(`held`).

**How to measure** (the script is in RUNNING_LOG day 25, "side catch-up"; it will become
a tool when the rule is wired): per part, in a time window, the longest run of attacks
with no gap ≥ 0.5 s and ≥ 1.0 s; the count and the loud count inside it; held seconds.

## Results to date

### CLOUD02-I, 36.19–40.42 s (day 25)

| version | notes | hard | soft | longest no-0.5 s-gap run | longest no-1 s-gap run |
|---|---|---|---|---|---|
| ORIGINAL | 159 | 0 | 13 (11 fixable by redistribution, 2 stuck) | 1.7–4.1 s (T1/T4/T5/T7/T8 play the whole section without one) | 4.5–4.7 s, all parts |
| A by-part | 80 | 0 | 14 (the ring rule ignores leaps) | — | — |
| B cap 6 | 54 | 0 | 1 (5 ms) | — | — |
| B2 50 ms | 43 | 0 | 0 | — | — |
| B3 fill 30 | 59 | 0 | 0 | — | — |
| B4 fill 25 | 64 | 0 | 0 (1 moved) | — | — |
| **B5 fill 20** | 69 | 0 | 0 (1 moved) | **0.2–1.1 s** | **1.3–4.5 s** |

**Verdict:** the section in isolation is one breath for five parts even unthinned, and
every run starts at 36.2 and ends by 40.9 — players get a catch breath going in and
coming out. **The whole B series is clean on levels 1–3 at every density.**

### DENSITY BUILD 1, 0–36.19 s (the notated material; day-25 side catch-up)

167 notes (121 staccato · 35 fp · 11 ord). **0 hard, 11 soft — every one inside
31.4–34.6 s, the dense stretch already figured as clusters**, and every one a wide leap
taken fast, not a re-attack problem:

| part | flag | the pair | attack | needs |
|---|---|---|---|---|
| T1 | soft @32.42 | G#1→G2 (11 st) | 0.156 | 0.212 |
| T1 | soft @32.58 | G2→F#1 (13 st) | 0.155 | 0.231 |
| T1 | soft @33.47 | G1→B2 (16 st) | 0.187 | 0.259 |
| T1 | soft @34.13 | B2→G1 (16 st) | 0.200 | 0.259 |
| T1 | soft @34.27 | G1→A#1 (3 st) | 0.135 | 0.138 |
| T2 | soft @31.40 | A2→A1 (12 st) | 0.220 | 0.222 |
| T4 | soft @34.51 | G#2→B3 (15 st) | 0.184 | 0.249 |
| T5 | soft @34.34 | A2→F#1 (15 st) | 0.209 | 0.249 |
| T5 | soft @34.57 | F#1→B2 (17 st) | 0.229 | 0.268 |
| T8 | soft @34.60 | G#2→D3 (6 st) | 0.157 | 0.166 |
| T10 | soft @32.93 | A#2→A#1 (12 st) | 0.212 | 0.222 |

Three are within 3 ms of the line (T1 @34.27, T2, T10); **T1's four octave-plus leaps
at 155–200 ms (cl-1, the first cluster) are the ones to put to a player.** Breath: longest
no-0.5 s run 3.0 s (T1 @31.5, 12 notes); longest no-1 s run 5.4 s (T1 @29.1); held notes
total 1.0–9.1 s per part, longest single hold 4.2 s (T1's opening surge). Nothing
problematic on level 3.

### AFTER the section, 40.42–48 s (VERT01-03 + CLOUD02-D; not yet worked)

120 notes. **0 hard, 18 soft** — CLOUD02-D (42.38–46 s) is full of fast wide leaps:
the worst is T6 @45.51 **D4→E2 (22 st) at 136 ms, needs 315**. T10 has four, T2 and
T5 three each. Breath is fine (longest no-0.5 s run 2.6 s). **This is the next
problem area**, and the fix there is probably redistribution before thinning — the
flags are leap-driven, not density-driven.

### THE WHOLE ARCHIVE, `piece-s25-finished01` (4401 notes, 751 s, F#1–G4; day 25)

Composer's bar: *"I don't want to submit something that's clearly impossible… the real
tubists might fudge it or leave it out, which is expected."*

- **HARD: 2** — both trance-section block seams where a 200 ms brick runs into the next
  block's first note on the same part; the attacks themselves are 68 / 153 ms apart.
  **T8 @560.63** (wc-ta4-749 → wc-ta4-754) · **T6 @604.63** (wc-ta4-1343 → wc-ta4-1350).
  Fix = one part move each, ledgered. **Before submission.**
- **SOFT: 45.** Four are more than a third short of the need (all fast wide leaps):
  T6 @45.51 D4→E2 **−179 ms (57 %)** · T7 @45.47 F#3→D#2 −108 (43 %) · T8 @560.63
  D#2→F4 −126 (38 %, the same seam) · T7 @44.73 G2→D4 −105 (37 %). The other 41 are
  under a third short — the fudge zone.
- **Breath:** nothing near the dials in any window measured.

**The dense areas to proceed through, in order of trouble** (composer: "no action now"):
1. **CLOUD02-D, 42.4–46 s** — 18 soft, three of the piece's four worst leaps. Redistribute
   before anything else.
2. **Trance seams @560.63 and @604.63** — the two hard overlaps.
3. **Density build 1, 31.4–34.6 s** — 11 soft, all leaps in the already-figured clusters;
   T1's cl-1 is the question for a tubist.
4. **CLOUD02-I** — done: the B series is clean at every density.

**Finding the audit again:** `node tools/audit_playability.js --parts <score-name>` (whole
file, per part, lists every flag with the pair and the shortfall). Isolate a section first
with `tools/cloud02i_ab.js --isolate` (pattern) if you want one window.

## Open

- Tubist confirmation of: the re-attack slope (2j's tremolo numbers applied to staccato),
  the breath dials X/Y, and whether an octave-plus leap at 155–200 ms in the bottom
  octave is tight or impossible.
- Wire level 3 as a rule in the build loop, then as an auditor column.
- Run the breath measurement across the whole 30–48 s stretch once CLOUD02-I and
  CLOUD02-D are decided — 87 notes precede the section and 120 follow it; endurance is
  a question about the stretch, not the window.
