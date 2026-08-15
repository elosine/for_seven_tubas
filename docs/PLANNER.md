# PROJECT PLANNER — for seven tubas

> **What this is** (composer, 2026-08-14): the working view of the piece. It
> answers *what am I working on now, what do I need to figure out to do it,
> what's next, what's left to figure out*. The form is a set of **containers to
> fill in**; materials live in their own section; raw thoughts get appended at
> the bottom and folded upward. Engineering detail stays in PLAN.md (IDs
> referenced, never duplicated). Add to-dos/thoughts to any part at any time.

---

## ► NOW — Section 1 · INTERMITTENT 2 (the second choppy section)

**What it is:** blasts + a **crescendo that morphs harmonically** + subset
textures, kept intermittent / pointillistic.

- the morphing crescendo: a smooth shift **in harmonic timbre as well as
  volume** — via **glissandos to quarter-tones, or legato note changes**
  (or both). First one probably runs **simple → complex timbre**, a gradient
  over time.
- **blasts with smaller parts of the ensemble** — a couple of different
  textures overlapped, but the section stays intermittent/pointillistic.

**To figure out / to do:**
- [ ] **Quartertones patch mapping test** (the 2-minute A/B — PLAN 2l's first
      step; everything quarter-tone depends on it)
- [ ] Gliss vehicle: `gliss_menu` patch (ch 12, range 48–77) vs legato ord
      re-fingerings — which carries the morph?
- [ ] Choose the morph's endpoints: which simple harmony → which complex one
      (palette candidates: octave/fifth stacks → chromatic or spectral cluster)
- [ ] Subset-blast design: which subsets (sizes, seating) and which
      articulations per subset
- [ ] Assemble → piece-s09

**Ingredients ready:** blast entities (3 articulations) · CLOUD02 clusters ·
harmony palette · cuivre per-note palette (C key). **Missing:** quarter-tone
mapping, morph vehicle.

---

## ► NEXT — Section 1 · DENSITY BUILDUP 3

Probably a **longer version of DB1** (the opening). Two decisions:

- [ ] **Harmony** — not chosen yet.
- [ ] **The elongation method** (PLAN 2m). Requirements as dictated: sounds
      **smooth**, keeps the **same density feel**, over a longer span;
      "essentially similar note-to-note — a frame-by-frame recreation, but
      longer"; **open to adding material** to keep the density profile smooth —
      e.g. **drawing in some extra long grains**; the fp-vs-staccato random
      distribution is already solved; what remains is *what to add, how to add
      it — or whether anything needs adding at all*.

---

## ► THEN

- **Close Section 1** — form question left open: **3 or 4 density buildups?**
- **Conceive Section 2.** Research FIRST, then try things:
  - [ ] tremolo material (PLAN 2j — first tests exist: trem01/trem02)
  - [ ] gestures usable in it
  - [ ] the **morphing chords**
  - [ ] **develop the crescendo chains** (beyond cressand-family)
  - then sketch — "maybe by then I'll have a clear idea how it should sound"

---

## THE FORM — Section 1 (containers, with status)

*The section = long DENSITY BUILDUPS alternating with shorter, choppier
INTERMITTENT sections.*

| # | Container | Content | Status |
|---|---|---|---|
| 1 | **DB1** | GESTURE-1 opening (oct-displace) | **done** — piece-s08 2.0–34.7 |
| 2 | **INT1** | fp blast (VERT01-03) modified with cuivre notes + density clusters CLOUD02-I/D + octaves-Bb ord blast | **done** — 36.2–52.5 |
| 3 | **DB2** | GESTURE-2 ×0.75, Messiaen m6 on F | **done** — 55.9–80.1 |
| 4 | **INT2** | blasts + morphing crescendo + subset textures | **← NOW** |
| 5 | **DB3** | longer DB1; harmony TBD | next |
| 6 | INT3 / **DB4?** | — | form open (3 vs 4 DBs) |
| — | **SECTION 2** | conceive after Section 1; research list above | later |

---

## MATERIALS

*Palette menu in the app mirrors the highlights (score/palette.json). Bank =
`bank/*.json`. Articulation colors run through everything: **staccato ·
fortepiano (×3 duration rule) · ordinario blast** (+ cuivre, + surge/G-convert).*

- **DENSITY BUILDUPS** *(the name — composer 2026-08-14)*: GESTURE-1 (opening),
  GESTURE-2 (A2 lineage) · compression ×0.75/×0.5 built; **stretching = the DB3
  question** (PLAN 2m).
- **Crescendo-pulse chains**: `cressand-family` (7 chains, margin-solved,
  26.5 dB clarity law) + `cressand-pitches` (7 pitch strategies). *Section-2
  to-do: develop further.*
- **Tremolos** (PLAN 2j): `trem01-single`, `trem02-phase`; sine-figure notation
  planned; speed ceiling = the slur rule (est. 4.5 Hz half-step / 3 Hz fifth).
- **Ostinatos**: piece-#2 timing tables ported; `ost01-variety` (8 formations)
  — **unheard, queued**.
- **Pointillistic clusters**: CLUST01-A…T + carves · CLUST02-A + scrambles ·
  CLOUD02-A…L (21–43/s, max-retention).
- **Chords / harmonies**: VERT01-01…33 (shortlist 03/04/06/07/11/12/16/23/28/33)
  · fifths + octave stacks · Bb–E 2-oct cluster · four 7-note chromatic
  clusters · Messiaen m6(F) kept, m7/m4 picked · tone row · Bhairav ·
  **pinned pairings** B2×BbE, M×5ths-30, L2×spread. *Coming: spectral chords +
  quarter-tones (PLAN 2l).*
- **PITCH-AND-CATCH** *(new concept, 2026-08-14)*: **swell → gap → attack.**
  - the **gap** varies in length — that's a primary dial
  - the **swell** can be anything from the swell family: a single crescendo, a
    crescendo train/chain, a density buildup
  - the **attack** ("the catch") likewise: a short cluster burst, a fortepiano
    chord, a blast, …
  - status: **concept — to build** (first tests would combinatorially cross a
    few swells × gap lengths × catches).

---

## RAW NOTES (append; fold upward when absorbed)

- **2026-08-14 (the workflow dictation that created this file):** Section-1
  state DB1/INT1/DB2 done, INT2 in progress; DB3 = longer DB1 (smooth,
  same-density, frame-by-frame-but-longer, maybe extra long grains); INT2 =
  blasts + harmonically morphing crescendo (gliss→quarter-tones or legato,
  simple→complex timbre) + subset blasts, intermittent; Section 2 after
  research (tremolo, gestures, morphing chords, crescendo chains);
  pitch-and-catch material defined; "density buildup" adopted as the name.
