# TRANCE A4 REVISION — plan v3 FINAL (day 36, planned on Fable; all questions resolved)

> Composer's ask, day 36: TRANCE A4 toward `trance-section-01`'s look with a
> PER-PART tempo apparatus, 40.92-style long-tone columns, swell-curve fix,
> final-crescendo apparatus. "Last time the agent tried this, they missed a
> lot of things" — implement ONLY from this file. v1 Q-A..G and v2 RQ-1..2
> are all ANSWERED and folded in. **No open questions remain.**

## The composer's decisions (day 36)

- **Tempo is PER PART.** Each part marked with the tempo it plays IN, even
  when not sounding every beat. Bar line + ♩=N wherever THAT part starts a
  new tempo. Ball bounces each part's tempo.
- **Every in-tempo note = black notehead + stem + staccato dot**, any technique.
- **Columns: ring = (column's minimum next-attack gap) − 0.5 breath, uniform
  within the column** (RQ-1 = b).
- **517.83 & 519.43 are NOT columns** — regular in-tempo pulsed notes:
  quarter + dot + ball; add cuivré/sfzp only as the technique carries it;
  no dynamic marks. (Composer, RQ-1 follow-up.)
- **All five CB columns** (647.43…656.23) get the 40.92 treatment.
- **Dynamics per part:** **f** on each part's first note; then nothing until
  the swells' own pairs; **ppp→fff** per part at its PH6 entry.
- **Ball per part lane**, off during columns and swells (windows below).
- **cuivré text KEPT**; the day-35 "no text" rule is REDACTED (it meant the
  draft score's commentary only). `hideMarkers:true` stays.
- **RQ-2 resolved by measurement** (below): every part plays exactly ONE
  steady tempo per segment — the "varied" parts are single streams WITH
  RESTS (all IOIs integer multiples of one step). So bar+mark at the segment
  entry fully says which tempo every following pulse belongs to; no
  mid-segment switches exist. **Room verified:** trance scale is 12 s/system
  at 1920 px → 160 px/s; the tightest adjacent changes (P10→MTB) are 1.2 s
  ≈ 190 px apart; a ♩=N mark is ~35 px. Never crowded.

## The page

- id `trance-a4`, label `TRANCE A4 — 500-751 s`, source `piece-s28`,
  window [499, 753], `hideMarkers:true` — all kept.
- Rebuild via the existing command (provenance.build):
  `node tools/notate_section.js --score piece-s28 --w0 499 --w1 753 --parts 0-9
   --profile section1 --id trance-a4 --bricks --trance grp-tranceA4-01 --label "TRANCE A4 — 500-751 s"`
- NOT folded into MAIN DRAFT; MAIN DRAFT + morph pages proven untouched.

## THE PER-PART TEMPO MAP (measured day 36 against piece-s28 — CANONICAL; the build re-derives as a check and warns on mismatch)

A part's tempo changes at its first onset in a new segment. Sub-markers
inside a segment (pitch worlds, chord-burst boundaries) are NOT tempo
changes. A part with fewer than 2 notes in a segment gets no mark/ball
there (flagged in the build log; T6 in seg 32 is the known case).

| span | segment | per-part tempo (bpm) |
|---|---|---|
| 499.83–521.03 | PULSE two teams alternating on the 0.4 s grid (incl. the in-tempo attacks at 517.83, 519.43) | **150 every part** |
| 521.03–529.03 | VERT long-tone columns (5) | no change; BALL OFF |
| 529.03–534.23 | seg "32" — MT, lattice 150·ri/38, terms {38,32,30,28,26,17} | T1 102.6 · T2 67.1 · T3 110.5 · T4 126.3 · T5 150 · T6 (1 note — flag) · T7 67.1 · T8 110.5 · T9 126.3 · T10 118.4 |
| 534.23–535.83 | base x4 (chord stream) | 150 all sounding parts |
| 535.83–545.83 | seg "17" — MT | T1 100 · T2 55 · T3 55 · T4 75 · T5 75 · T6 75 · T7 55 · T8 45.8 (standalone stream — flag) · T9 55 · T10 90 |
| 545.83–548.63 | base x7 | 150 |
| 548.63–560.63 | seg "27" | **80 all parts** |
| 560.63–566.63 | base x15 | 150 |
| 566.63–578.63 | PS1 | 87 all |
| 578.63–582.23 | P9 bursts | 150 |
| 582.23–593.43 | PS2 | 93.8 all |
| 593.43–594.63 | P10 bursts | 150 |
| 594.63–604.63 | MT B — lattice 150·ri/14, terms {12,10,8,7,6,4,3} | T1 85.7 · T2 107.1 · T3 75 · T4 32.1 · T5 42.9 · T6 128.6 · T7 107.1 · T8 75 · T9 64.3 · T10 42.9 |
| 604.63–617.43 | PS3 | 100 all |
| 617.43–620.63 | P12 bursts | 150 |
| 620.63–647.43 | PS4 | 107.1 all |
| 647.43–664.63 | CB columns only | no tempo; BALL OFF; no bar |
| 664.63–685.03 | PS5 | 113.2 all |
| 685.03–709.43 | SW swells only | no tempo; BALL OFF; no bar |
| 709.43–751.42 | PS6/PH6 final crescendo pulse | 120 all |

Verification behind the map: every stream sd=0.000 or rest-multiple exact
(e.g. MTB T2 IOIs 0.56/1.12/1.68 = 1×/2×/3× of 0.56). Sources corroborate:
ASSEMBLY_METHOD (chords at 150; the performed phase ladder; MT lifted
verbatim), TRANCE_GENERATOR (rate = B·ri/r1).

## The long-tone columns (10 total) — uniform ring per column

ring = (min next-attack gap among members) − 0.5 breath:

| onset | parts | techniques | ring (s) |
|---|---|---|---|
| 521.03 | 10 | fp (sfzp) | 0.30 |
| 522.63 | 10 | fp (sfzp) | 0.30 |
| 525.43 | 10 | fp (sfzp) | 0.30 |
| 526.23 | 7 | ord | 0.70 |
| 527.43 | 6 | ord + cuivre | 1.10 |
| 647.43 CB1 | 5 | ord | 2.30 |
| 650.23 CB2 | 5 | ord | 1.10 |
| 651.83 CB3 | 5 | ord | 2.70 |
| 655.03 CB4 | 5 | ord | 0.70 |
| 656.23 CB5 | 7 | ord | 7.96 |

Each member: its technique's one-shot device PLUS overlay —
`gc:true` · `goLine:true` · open stemless head · `ringBar:true` ·
`ringSeconds:` per the table · sfzp on fp · cuivré text on cuivre ·
ord nothing · `dynMark:false`. (ord needs gc/ringBar ADDED — its default
device has neither.)

## Steps

**0 · Baseline.** Current `trance-a4.ir.json` copied to scratchpad; hash
MAIN DRAFT + morph pages.

**1 · In-tempo notes (everything except the 10 columns and the swells —
including 517.83/519.43).** Per-note overlay device: filled black head ·
`nhStem:'plain'` · **staccato dot on every one** · `brick:false` ·
**`nhAnchor:'leftEdge'`** · **`gc:false`** · **`goLine:false`** ·
`dynMark:false` · cuivré text where the note is cuivre, sfzp where fp
(517.83/519.43 members are ord/cuivre → cuivré text only).

**2 · Columns** per the table above.

**3 · Dynamics.** Per part: **f** at the part's first onset. Nothing else
until the swells' own pairs and PH6's **ppp→arrow→fff** at each part's PH6
entry (surge-pair style). Strip every other mark.

**4 · Bar lines + tempo marks — PER PART.**
- Bar + ♩=N in the part's lane at each map row where its tempo changes; bar
  one standard gap (**0.45 ss = stackGapSs**) left of the part's first onset
  in the segment; mark above. One decimal where fractional.
- ~18 per part over 251 s; tightest spacing 1.2 s ≈ 190 px — verified fits.
- Layout: per-part barline/tempotext emit (layout.js ~300) at per-part times,
  gap from the registry token.
- The map is AUTHORED data in `trance_overlays.js`; the measured re-derivation
  runs as a check and warns on mismatch, flags listed above printed.

**5 · The ball — per part, at its own tempo.**
- Per part per segment: chunk `{kind:'gc', at:<tick>, preset:{duration:<step>}}`
  devices on the part's own grid — anchor = the part's first onset in the
  segment, period = its step (0.4 at 150 for both pulse teams — the ball
  shows the 150 grid, the noteheads show your subset; phase-spread segments
  anchor at the part's own entry; MT parts at their own lattice step).
- Tiling: duration = step → one ball per lane, always in flight, landing on
  every beat. `animobj.js` collect(): pass chunk-device preset through.
- **BALL OFF:** [521.03, 529.03) · [647.43, 664.63) · [685.03, 709.43).
  Ball runs per segment from the part's first onset to its last onset there.
- Chunk gc devices keep drawing the small tick at tickY.

**6 · Swells (685.03–709.43).** Keep; ONLY re-map drawn curves to start at 0:
`v → (v−min)·max/(max−min)`, behind a device flag (`curveZero:true`) so morph
pages and MAIN DRAFT surges are untouched. Drawing only.

**7 · PH6 apparatus (709.43–751.42).** On top of §1: long crescendo curve PER
PART — overlay kind `cresc`, span [709.43, 751.42], samples from the per-note
level ramp (y 2.2→9.5) remapped to start 0, max at the `PS6 hold ff` marker
746.29 (verify knee from data), flat after → limeGreen bottom-half crescCurve
+ crescMeter follower (morph machinery; check MORPH_NOTATION.md at build).
Plus the per-part **ppp→arrow→fff** at entry (§3).

**8 · Rebuild + verify** (in the RUNNING app):
- IR greps: zero gc/goLine on in-tempo notes; dot on every in-tempo note;
  column overlays = the table; tempo overlays = the map; swell first drawn
  sample 0; cresc per part.
- Build log prints the per-part map + the two flags (seg32 T6 lone note;
  seg17 T8 standalone 45.8).
- Screenshots: opening (f, 150s, both teams' balls) · 517–529 (two in-tempo
  attacks then 5 columns, ball gap) · seg32 + MTB (different ♩=N per lane) ·
  548.63 (all-80 bars) · 647–665 (CB) · 685 (swell from 0) · 709.43 (pairs +
  curve start) · 746–751 (hold).
- Live ball: 499.83 (both teams on the 150 grid) · 594.63 (T4 at 32.1 vs T6
  at 128.6) · 709.43 (ten at 120, spread phases). No double ball, no gap.
- MAIN DRAFT + morph pages identical; tests: test_layout, test_animobj,
  test_notate_block (+ preset passthrough).
- Docs: SAVE_FILES.md TRANCE A4 paragraph; RUNNING_LOG; NITS "27 oct B" item
  closed (notated at its measured 80); redact "no text" phrasing where
  recorded (scope: commentary only).

## Code touchpoints

| file | change |
|---|---|
| `notation/lib/trance_overlays.js` | rewrite build(): §1 devices, §2 columns, §3 per-part dynamics, §4 authored map + check, §5 per-part beat-gc devices, §7 cresc + pairs |
| `notation/lib/animobj.js` | chunk-device preset passthrough |
| `notation/lib/layout.js` | per-part barline/tempotext; stackGapSs gap; `curveZero` remap; nothing else |
| `tools/notate_section.js` | plumbing only if needed |
| docs | SAVE_FILES · RUNNING_LOG · NITS · "no text" redaction |

Guardrails: byTechnique defaults, GC physics, morph overlays, MAIN DRAFT
paths — untouched.
