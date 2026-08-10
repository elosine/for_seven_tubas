# Risset recipes — crescendo & accelerando patterns for seven tubas

*Research pass 2026-08-10 (sources at bottom). Written for this piece: N = 7 voices.*

## 0 · The one scheme under all Risset illusions

Every Risset/Shepard illusion is the same machine pointed at a different axis:

1. Pick an **axis** with a repeating ladder: log-pitch (octaves), log-tempo (doublings),
   or — our extension — dynamics.
2. Run **N voices** climbing the axis at the same rate, **evenly spaced** along it
   (spacing = ladder-interval / N in phase terms).
3. Gate each voice's loudness with a **fixed bell window over axis position** (raised
   cosine or Gaussian, computed in the axis's log space) — voices are inaudible at the
   ladder's edges, loudest in the middle.
4. When a voice exits the top of the window it **wraps** to the bottom — silently,
   because the window is at zero there.
5. **Cycle time T** = time to climb one ladder interval. The aggregate is statistically
   constant; every local cue says "still rising."

The join is inaudible because the brain can't track which voice is which through the
window nulls (Shepard/Risset pitch; Madison showed the same for tempo).

## 1 · Accelerando Risset (the rhythm one — TENET, The Odyssey "Troy")

**Axis:** log-tempo. Pattern repeats at tempo f(t) = f₀ · 2^(t/T); streams sit octaves
apart in tempo.

**Studio construction (Stowell 2011, the canonical recipe):**
- ~**5 streams** of the same loop at tempo ratios …¼×, ½×, 1×, 2×, 4×, all
  accelerating together; per-stream playback rate and amplitude from Stowell's
  formulas (2)/(3) — amplitude is a bell over log₂(tempo), so the fastest and
  slowest streams live near silence. Ghisi later published a correction to the
  amplitude formula (the PD-risset implementation carries it).
- **Metabar** = T, the loopable unit: when the ladder has shifted one octave every
  stream occupies its neighbor's former position and all phases realign.
- Tuning note from practice: the barberpole reads most convincingly when the
  amplitude bandwidth ≈ 4× the metabar factor (PD-risset).
- **Minimal version (Turczan):** just 2 crossfading layers an octave apart —
  out-going layer velocity 127→1 while incoming runs 1→127 — and it already works.
  Ratios other than 2:1 work too (3:2, 5:4…): the ladder interval becomes that ratio.

**Live-ensemble construction (Madison 2009 — notatable, this is ours):**
- Everyone plays the **same cell at different metric levels** (level k = every 2^k-th
  pulse). Madison used 9 levels; 7 players ≈ 7 levels, one per tuba.
- Global tempo climbs ×2 over T (write as one long accel. or stepwise metric
  modulations), then the **level assignments rotate down one** and it repeats —
  the performers' version of the wrap.
- **Dynamics do all the masking**: each part's hairpins follow the bell — a part
  entering at its slowest level starts *niente*, peaks mid-ladder (around the
  ensemble's mean pulse rate), and fades to *niente* as it becomes fastest, then
  re-enters slow. Madison used a sigmoid-of-level weighting; raised cosine is fine.
- "How far up the ladder before restarting": one full traversal of the audible
  window — with 7 levels that's ~2.5–3 tempo octaves from entry to exit.

**The Odyssey "Troy" observations** (community/lesson analysis; no official technical
interview found): built on a 3:2 hemiola cell, ~3 concurrent layers (all-pulses /
alternate-pulses / every-third), tempo doubling 150→300→600 with subdivision
**dropout** ("fade every 2nd note") acting as the wrap — i.e. a coarse, muscular
version of the same bell-window idea. VI-Control speculation: recorded one rhythm at
several speeds and morphed between them.

## 2 · Crescendo Risset (the loudness one — derived, not found in literature)

Searched for an established "eternal crescendo" construction: **nothing published**
beyond the pitch/tempo variants. Loudness has no octave-equivalence, so a strict
infinite-loudness illusion is perceptually weaker than Shepard — what works is the
**perpetual-build texture**: every audible cue is a swell, aggregate never exhausts.
Recipe by direct analogy:

- **Each tuba**: swell *niente* → peak over **L** seconds, then leave (instant release
  or fast decresc.) and re-enter at *niente*. The swell IS the window; the re-entry
  IS the wrap.
- **Stagger = L / 7** (even phase spacing). At any instant ~6 voices sound, at every
  point of the swell curve. Raised-cosine swell + even stagger ⇒ near-constant
  aggregate power.
- **Masking the reset** (the whole game):
  - a voice resets only while ≥2 others are at/near peak (automatic with even stagger);
  - no attack transient on re-entry (senza-attack onset, or re-enter on a different
    chord tone so the new entry reads as "new voice," not "that voice starting over");
  - keep pitch content static or slowly rotating — pitch movement at reset points
    gives the trick away.
- **Aggregate drift knob**: add a slow master rise (say +3 dB over a minute) on top —
  the texture then genuinely grows while the surface promises far more than it
  delivers. Ravel's Boléro is this with N=1 and no wrap; ours wraps.
- **Hybrids**: couple the ladder to pitch (each re-entry a semitone higher → Shepard
  staircase with crescendo skin) or to tempo (each re-entry subdivides — merges into
  Recipe 1).

**With our measured material** (docs/SI2_tuba_sample_lengths.md):
- The **Cresc & Decrescendo KS (C#0 tail)** samples are fixed at **3.4–5.9 s by
  pitch** — usable directly: same-pitch 7-voice canon at stagger = L/7 ≈ **0.5–0.85 s**.
  Short-cycle, churning character. Mixed-pitch versions must respect per-note lengths
  (the database exists for exactly this).
- For **arbitrary L** (14 s swells, 30 s swells): drive a sustaining patch with CC
  dynamics curves (piece #3's proven CC1 recipe) — free choice of L, N stays 7,
  stagger = L/7. This is the score's G3 span-curve territory and the natural first
  customer for it.

## 3 · Cheat sheet (N = 7)

| Parameter | Accelerando (live) | Crescendo |
|---|---|---|
| Axis ladder | tempo octave (or 3:2 …) | full dynamic range |
| Cycle T | one doubling; try 20–40 s | L = one swell; sample 3.4–5.9 s or CC-driven |
| Voice spacing | one metric level apart | L/7 onset stagger |
| Window | bell over log-tempo (sigmoid ok) | the swell shape itself (raised cosine) |
| Wrap | rotate level map down 1 | drop + re-enter at niente |
| Masking | dynamics bell + subdivision dropout | reset under peaks; no attack; static pitch |
| Give-away to avoid | phase misalignment at metabar | audible re-entries; pitch motion at resets |

## Sources

- Stowell, *Scheduling and composing with Risset eternal accelerando rhythms* (ICMC 2011): https://quod.lib.umich.edu/i/icmc/bbp2372.2011.096
- PD-risset (Stowell impl. + Ghisi correction, 5 streams, 4τ=b note): https://github.com/devstermarts/PD-risset
- Turczan, MIDI Risset generator (2-layer minimal, arbitrary ratios): https://github.com/nathanturczan/risset
- Madison, *An Auditory Illusion of Infinite Tempo Change* (PLOS ONE 2009 — 9 levels, sigmoid weighting): https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0008151
- The Odyssey "Troy" Risset breakdown: https://signalsmusic.studio/lessons/odyssey-risset-rhythm
- Shepard/Risset glissando construction: https://www.nicolastiteux.com/en/blog/shepard-and-risset-audio-illusions/
- Orchestrating endless-rise textures: https://flypaper.soundfly.com/write/how-to-orchestrate-an-endless-rising-tone-effect/
- Odyssey score context (no orchestra; period instruments): https://www.classicfm.com/discover-music/periods-genres/film-tv/ludwig-goransson-score-odyssey/
