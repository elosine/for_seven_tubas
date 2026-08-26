# TRANCE A4 REVISION — plan v2 (day 36, planned on Fable; composer's answers folded in)

> Composer's ask, day 36: bring TRANCE A4 back toward `trance-section-01`'s
> look, PER-PART tempo apparatus, 40.92-style long-tone columns, swell-curve
> fix, final-crescendo apparatus. "Last time the agent tried this, they missed
> a lot of things" — implement ONLY from this file.
> v1's Q-A…Q-G are ANSWERED (day 36, composer) and folded in below.
> Residual questions RQ-1..RQ-2 at the bottom.

## The composer's decisions (day 36 — govern everything below)

- **A · Tempo is PER PART.** Each part is marked with the tempo it is playing
  IN, even when it does not play every beat (opening: every part marked 150
  though each plays every other beat). Bar line + tempo mark at every point
  where THAT part starts a new tempo. Ball bounces each part's tempo.
- **Every in-tempo note = black notehead + stem + staccato dot** (quarter-note
  look), regardless of technique. Long tones excepted.
- **B · Column ring bars: run to the next attack minus breath** (0.5 s), for
  ALL columns. Model: "play a long tone and then on the next downbeat they
  continue with the pulse." (See RQ-1 for the per-member wrinkle.)
- **D · All five CB columns** (647.43…656.23) get the 40.92 treatment.
- **E · Dynamics per part:** the opening **f** on each part's first note;
  PH6's **ppp→fff** pair on each part at its PH6 entry.
- **F · Ball per part lane** (ten balls, each at its part's own tempo/phase).
  OFF during the long-tone columns and the swells (windows below).
- **G · cuivré text KEPT.** The day-35 "no text" rule is REDACTED — it meant
  only the commentary text in the trance-section-01 draft score.
  `hideMarkers:true` stays (markers are that commentary).

## The page

- id `trance-a4`, label `TRANCE A4 — 500-751 s`, source `piece-s28`,
  window [499, 753], `hideMarkers:true` — all kept.
- Rebuild via the existing command (provenance.build):
  `node tools/notate_section.js --score piece-s28 --w0 499 --w1 753 --parts 0-9
   --profile section1 --id trance-a4 --bricks --trance grp-tranceA4-01 --label "TRANCE A4 — 500-751 s"`
- NOT folded into MAIN DRAFT; MAIN DRAFT + morph pages proven untouched.

## THE PER-PART TEMPO MAP (measured day 36 against piece-s28; the build re-derives and MUST match)

Segments by structural marker; a part's tempo changes at its first onset in a
new segment. Sources: assembly record `docs/ASSEMBLY_METHOD.md` (chord stream
at 150 · phase ramp = the performed 6-step ladder · MT lifted verbatim from
the audition battery); generator spec `docs/plans/TRANCE_GENERATOR.md`
(stream rate = B·ri/r1).

| span | segment | per-part tempo (bpm) |
|---|---|---|
| 499.83–517.83 | PULSE (two teams of 5 alternating on the 0.4 s grid) | **150 every part** (each plays every other beat) |
| 517.83–529.03 | VERT long-tone columns punched into the pulse | no change (150 carries); BALL OFF |
| 529.03–534.23 | seg "32 oct G#" — MULTITEMPO | steady parts measured: T5 150 · T10 118.4 · T2/T7 67.1; T1/T3/T4/T8/T9 VARIED → lattice-fit at build (see method) |
| 534.23–535.83 | base x4 (chord stream) | 150 all sounding parts |
| 535.83–545.83 | seg "17" (3 pitch worlds) — MULTITEMPO | measured lattice ≈ 20:18:15:11 @ B=100 → T1 100 · T10 90 · T4/T5/T6 75 · T2/T3/T7/T9 55 · T8 VARIED → fit |
| 545.83–548.63 | base x7 | 150 |
| 548.63–560.63 | seg "27" (3 pitch worlds) | **80 all parts** (the NITS note confirmed: measures uniform) |
| 560.63–566.63 | base x15 | 150 |
| 566.63–578.63 | PS1 (3 worlds) | 87 all parts, phase-spread |
| 578.63–582.23 | P9 chord bursts | 150 |
| 582.23–593.43 | PS2 | 93.8 all |
| 593.43–594.63 | P10 bursts | 150 |
| 594.63–604.63 | MT B — MULTITEMPO | lattice = 150·ri/14: T6 128.6 (r12) · T1 85.7 (r8) · T3/T8 75 (r7) · T5 42.9 (r4) · T4 32.1 (r3); T2/T7/T9/T10 VARIED → fit |
| 604.63–617.43 | PS3 | 100 all |
| 617.43–620.63 | P12 bursts | 150 |
| 620.63–647.43 | PS4 (4 worlds) | 107.1 all |
| 647.43–664.63 | CB long-tone columns (only long tones — no pulse) | no tempo; BALL OFF; no bar |
| 664.63–685.03 | PS5 (3 worlds) | 113.2 all |
| 685.03–709.43 | SW swells (only swells) | no tempo; BALL OFF; no bar |
| 709.43–751.42 | PS6 / PH6 — the final crescendo pulse | 120 all parts, phase-spread |

**Lattice-fit method for VARIED parts (MT segments).** Steady parts confirm the
unit lattice (all IOIs sd=0.000). A VARIED part is fitted as ONE lattice stream
WITH RESTS: find the stream step T·r1/ri (terms ≤ 64) such that every onset of
the part sits on that stream's grid (tolerance 0.02 s); its tempo = that
stream's rate. If no stream fits, mark the part's modal rate and FLAG it in the
build log for the composer's eye pass — never silently invent. The build prints
the full fitted map as a table; **the composer sees it before the page is
called done.**

**Intra-segment sub-markers** ("PS1 5ths A", "17→B oct", chord-burst
boundaries…) are pitch-world changes, NOT tempo changes — no bar, no mark.

## The long-tone columns (Q-B/D applied)

Columns (onset · parts · techniques): 517.83·10·ord/cuivre — 519.43·6·ord/cuivre —
521.03·10·fp — 522.63·10·fp — 525.43·10·fp — 526.23·7·ord — 527.43·6·ord/cuivre —
CB: 647.43·5·ord — 650.23·5·ord — 651.83·5·ord — 655.03·5·ord — 656.23·7·ord.

Each member note: its technique's one-shot device PLUS overlay —
- `gc:true` · `goLine:true` · open stemless head (fp/ord/cuivre standard)
- `ringBar:true` · **`ringSeconds` = (that member's next attack − onset) − 0.5 breath**
  (pending RQ-1: per-member vs uniform-at-column-min; and the two members whose
  next attack is 0.4 s away — negative room)
- articulations as the technique carries: **sfzp** on fp · **cuivré text** on
  cuivre (kept, per G) · ord = nothing
- `dynMark:false` — no band dynamics
- Measured next-attack gaps per column (per-member min→max): 517.83: 0.4–1.2 ·
  519.43: 0.4–1.2 · 521.03: 0.8–1.6 · 522.63: 0.8–1.6 · 525.43: 0.8–4.27 ·
  526.23: 1.2–3.17 · 527.43: 1.6–5.34 · CB1: 2.8–8.8 · CB2: 1.6–6.0 ·
  CB3: 3.2–13.25 · CB4: 1.2–10.11 · CB5: 8.46–8.76.

## Steps

**0 · Baseline.** Copy current `notation/ir/trance-a4.ir.json` to scratchpad.
Hash MAIN DRAFT + morph pages.

**1 · In-tempo notes (every non-column, non-swell event — all families).**
Per-note overlay device:
- filled black head · `nhStem:'plain'` · **staccato dot on every one**
  (regardless of technique) · `brick:false`
- **`nhAnchor:'leftEdge'`** — head left edge ON its go time
- **`gc:false`**, **`goLine:false`** — no discs, no arcs, no go lines
- no band dynamics (`dynMark:false`)

**2 · Columns** as specified above.

**3 · Dynamics.** Per part: **f** at the part's first onset (499.83 team /
500.23 team). Then nothing until the swells' own pairs and PH6's
**ppp→arrow→fff** at each part's PH6 entry (surge-pair style). Strip every
other mark.

**4 · Bar lines + tempo marks — PER PART.**
- A bar line + ♩=N in a part's lane at every tempo CHANGE for that part
  (the map above): bar sits **one standard gap (0.45 ss = stackGapSs — the
  dynamics/accents stack gap) left of that part's first onset** in the new
  segment; the ♩=N mark above it. One decimal where needed (93.8, 128.6…).
- First mark per part: **150** at its first note. No bars/marks at CB or SW
  (no tempo there); re-entering PS5/PS6 after them IS a change → bar + mark.
- Layout: the barline/tempotext emit (layout.js ~300) becomes per-part with
  per-part times; gap token from the registry (stackGapSs), not a literal.
- Tempo values = AUTHORED table in `trance_overlays.js` (from the map above,
  completed by the lattice fit) with the measured re-derivation as a CHECK
  that warns on mismatch.

**5 · The ball — per part, at the part's own tempo.**
- Per part per segment: chunk `{kind:'gc', at:<tick>}` devices on the part's
  own grid — anchor = the part's first onset in the segment, period = the
  part's step (0.4 s at 150 for BOTH pulse teams — the ball shows the 150
  grid; the noteheads show your subset). Phase-shift segments: anchor = the
  part's own (spread) entry. MT segments: each part's own lattice step.
- **preset `{duration:<step>}`** so consecutive bounces tile — one ball per
  lane, always in flight, landing exactly on that part's beats.
  `animobj.js` collect(): pass the chunk device's preset through (one line).
- **BALL OFF windows:** [517.83, 529.03) · [647.43, 664.63) · [685.03, 709.43).
  Runs everywhere else, through chord bursts and PH6 to each part's last onset.
- Chunk gc devices also draw the small tick at tickY (existing behavior) — keep.

**6 · Swells (685.03–709.43).** Keep everything; ONLY re-map each drawn curve
to start at 0: `v → (v−min)·max/(max−min)` (start 0, peak keeps height).
Drawing only, behind a device flag (`curveZero:true`) so morph pages and MAIN
DRAFT surges are untouched.

**7 · PH6 apparatus (709.43–751.42).** On top of §1:
- Long crescendo curve PER PART: overlay kind `cresc` {target:{part,span:
  [709.43, 751.42]}, value:{samples}} — samples from the per-note level ramp
  (y 2.2→9.5), remapped to start at 0, ramp to max at the `PS6 hold ff`
  marker (746.29, verify knee from data), flat after. Renders as the
  limeGreen bottom-half crescCurve + crescMeter follower (morph machinery —
  verify against MORPH_NOTATION.md at build).
- **ppp→arrow→fff** per part at its entry (§3).

**8 · Rebuild + verify** (in the RUNNING app, not asserted):
- Grep the IR: zero `gc:true`/`goLine:true` on in-tempo notes; every in-tempo
  note has the dot; column overlays complete; tempo overlays = the fitted map;
  swell first drawn sample = 0; cresc overlays per part.
- Print the per-part tempo map + lattice fits + any VARIED-part flags.
- App screenshots: opening (f, 150 marks, balls both teams) · 517–529
  (columns + ball gap) · seg 32 & MT B (per-part marks at different rates) ·
  548.63 (ALL-80 bars) · 647–665 (CB) · 685 (swell from 0) · 709.43
  (pairs + curve) · 746–751 (hold).
- Live ball: watch 499.83 (both teams' balls on the 150 grid) · 594.63 (T4 at
  32.1 vs T6 at 128.6) · 709.43 (ten balls at 120, spread phases). Tiling —
  no double ball, no gap.
- MAIN DRAFT + morph pages byte/tile-identical. Tests: test_layout,
  test_animobj, test_notate_block (+ preset-passthrough check).
- SAVE_FILES.md TRANCE A4 paragraph updated; RUNNING_LOG entry; NITS item on
  the "27 oct B" segment closed (it is now notated at its measured 80).

## Code touchpoints

| file | change |
|---|---|
| `notation/lib/trance_overlays.js` | rewrite build(): §1 devices, §2 columns, §3 per-part dynamics, §4 authored per-part tempo map + lattice fit + check, §5 per-part beat-gc devices, §7 cresc + pairs |
| `notation/lib/animobj.js` | chunk-device preset passthrough |
| `notation/lib/layout.js` | per-part barline/tempotext at part times, stackGapSs gap; `curveZero` remap; nothing else |
| `tools/notate_section.js` | plumbing only if needed |
| docs | SAVE_FILES.md · RUNNING_LOG · NITS ("27" note) · redact the "no text" phrasing where recorded (scope: commentary only) |

Guardrails: byTechnique defaults, GC physics, morph overlays, MAIN DRAFT
paths — untouched.

## RESIDUAL QUESTIONS

- **RQ-1 (columns).** "Next attack minus breath" per MEMBER makes bars differ
  within a column (real deltas differ everywhere — e.g. col 521.03 spans
  0.8–1.6 s; col 527.43 spans 1.6–5.34 s). (a) per-member bars — each player
  sees their own hold; (b) uniform per column at the column's minimum.
  And the two members (cols 517.83/519.43) whose next attack is 0.4 s away
  (breath rule gives negative): (i) bar to just before the next attack
  (gap − tight 0.15) with a build warning, or (ii) no bar on those two.
- **RQ-2 (MT varied parts).** Proceeding policy stated in the map: lattice-fit
  with rests; no fit → modal + FLAG at the eye pass. Confirm or redirect.
