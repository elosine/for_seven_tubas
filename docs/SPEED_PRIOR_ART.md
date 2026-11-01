# The cursor's speed — prior art, one page (PLAN 9s step 5 · day 46, 2026-11-01)

**The question.** How many seconds of music belong in one row of the stand, at a fixed
7.5 mm staff. Our units: px/s on the iPad (1,180 CSS px wide, 5.2 CSS px per mm, so
**52 px = 1 cm**); a row of *s* seconds runs at (1,180 − 59) / *s* px/s.

| Row | px/s | cm/s | staff spaces / s |
|---|---|---|---|
| 6 s (today) | 187 | **3.6** | 19.2 |
| 8 s | 142 | 2.7 | 14.6 |
| 10 s | 110 | 2.1 | 11.3 |
| 12 s | 96 | 1.85 | 9.8 |

## 1 · Scrolling-score research (Vickery, ICMC 2014) — a stated speed with its reason

Vickery, *Exploring a Visual/Sonic Representational Continuum*, Proc. ICMC|SMC 2014,
pp. 177–184. The one source found that states speeds AND why.

- **The "notional scroll-rate" of traditional scores** = the score's printed length ÷ its
  duration (Table 1): Beethoven *Tempest* 2.41 / 0.48 cm/s (its two tempi) · Chopin
  *Minute Waltz* 3.89 · Ravel *Pavane* 1.35 · Debussy *Voiles* 1.61. Hope's scrolling
  scores 0.46–0.59, Vickery's 1.52–1.53. *"These rates give an indication of what is an
  acceptable and perhaps even conventional speed to read musical notation."* → **the
  conventional band ≈ 1.3–2.4 cm/s**, the Minute Waltz the fast outlier.
- **The maximal rate, with the reason:** Picking (1997) — *"a semi-quaver at 120 beats
  per minute would remain still for 125 milliseconds ± approximately half the duration
  of a typical eye fixation"* → a maximal scroll rate of about **2 cm/s**; Gilman &
  Underwood (2003), sight-reading eye-tracking → about **3 cm/s**. *"The maximal bound
  for reading of scrolling notation may be between 2 and 3 cm/s."* Vickery's own
  *unhörbares wird hörbar* runs at 2.35 cm/s, *"toward the maximal limit."*
- **Density lowers the bound:** more complex notation needs more fixations (Goolsby;
  Waters et al.), so *"maximal scroll rate might be impacted by the increase in eye
  fixations necessary for scores with greater information density."*
- **The eye's numbers (footnote):** saccades of just over 1.5 cm; the eye–hand span
  (fixation to execution) 1.5–1.9 cm.
- **Does it transfer?** Partly. Those scores MOVE past a fixed playhead, so the notation
  itself must be read while moving; ours is a STATIC page with a moving cursor, which
  is why the composer judged the reading fine and only the cursor's smear wrong. The
  density band (cm of page per second of music) transfers directly; the maximal bound
  is a conservative upper reference for us, not a wall.

**Read against our rows:** today's 6 s (3.6 cm/s) is faster than every score in the
table but the Minute Waltz, and above the 2–3 cm/s bound. **8 s (2.7) sits inside the
bound; 10 s (2.1) at its lower edge and at the top of the conventional band; 12 s (1.85)
inside the conventional band.**

## 2 · Printed parts — the system in seconds, and the spacing table

- A printed part's line is about 17–18 cm wide (A4/B4 less margins). At the conventional
  1.35–2.4 cm/s that is **7–13 s of music per line** — the oldest answer to "how much per
  row". Our row is 22.7 cm, so the same density gives 9.5–17 s.
- **The engraving spacing table** (Gould, *Behind Bars*; Ross, *The Art of Music
  Engraving* — the two agree here): quarter note 3.5 staff spaces, eighth 2.5, sixteenth
  2 (secondary source, a 2021 engraver's comparison). At ♩ = 120 that is 7 ss per second
  of quarters and **16 ss/s for sixteenths**; at ♩ = 60, 3.5 ss/s. Our rows run 9.8–19.2
  ss/s (table above): a 6 s row spaces like printed sixteenths at 120, a 10 s row like
  printed eighths — consistent with step 2's floor, where the cluster pairs (0.12–0.14 s
  apart) are the piece's sixteenths.
- **Staff size, the primary MOLA text** (*Music Preparation Guidelines for Orchestral
  Music*, Publication Committee, undated PDF): *"The most readable staff size for all
  instruments is 8.5 mm … 8.0 mm is readable for winds … Wind players can read music
  from staves that measure 7.5 mm, but this is very problematic for string players.
  Anything smaller than 7.0 mm is unacceptable … Anything larger than 8.5 mm should be
  avoided."* (The current edition, per secondary quotes, names 7.5 mm most readable.)
  Tubas are winds with their own stands: **7.5 mm stands; 8.0 mm is a candidate for the
  eye test** (ss 10.4).

## 3 · Rhythm games and scrolling text — the trade-off, not a number

- **Rhythm games** (note highway, since GuitarFreaks 1998): notes move toward a fixed
  hit line; the player sets "scroll speed"; about 1–2 s of look-ahead is typical. The
  stated trade-off is ours exactly: *low scroll speed makes the next note easy to see
  but harder to time; high scroll speed gives more exact timing but makes the next
  note harder to see.* Transfers as a principle only: our rows give 30 s of look-ahead
  regardless, and the composer has ruled the cursor's timing need moderate (the GC
  carries the fine attacks).
- **Scrolling text** (Kang & Muter 1989; Chen & Chien 2007): smooth scrolling reads as
  well as any paced display at 100–300 words/min and is preferred; ~250–300 wpm is
  comfortable. Teleprompter speech runs 125–150 wpm. Not transferable in numbers; it
  says smooth, steady motion is readable at speed, which the stand already has.

## 4 · What transfers, in one line each

1. **A speed band with reasons exists: 2–3 cm/s is the ceiling for reading moving
   notation; 1.3–2.4 cm/s is what printed scores do.** On this iPad that is rows of
   **8–11 s** (ceiling) and **9.5–17 s** (convention).
2. **Today's 6 s row is outside both.** The composer's "too fast" has a literature.
3. **Density sets the floor from below** (step 2: clusters → ≥ 7.3 s; 10 s needs the
   cluster rule to pack). **The overlap is 8–10 s a row.** The eye test (step 7) picks
   inside it, at 6 · 8 · 10 s on the 34–45 s clusters and on a GC passage.
4. **Staff 7.5 mm holds; try 8.0 by eye.**

Sources: Vickery 2014 (ICMC|SMC proceedings PDF, read in full) · MOLA guidelines PDF
(NJ Symphony copy, read) · Steinberg forum threads and Scoring Notes for the current
MOLA wording and the Gould/Ross table (secondary) · Kang & Muter / Chen & Chien via
search summaries · rhythm-game developer docs and forum posts (secondary).
