# PHASE SHIFTING — research, dials, and the recipe hunt

> Opened 2026-08-16 (PLAN 2j lineage). Purpose, in the composer's words: *isolate
> sound categories, isolate the dials that produce them, and learn the range of
> each dial* — "rapid fluttering happens when you're at this BPM, phase shifting
> over this much time, at this rate."
>
> Tool: `tools/phase_shift.js`. Scores: `phase01-*`, `phase02-*` in the Scores menu.

---

## 1 · The governing dial is DRIFT PER ATTACK, not shift duration

"Shift over 20 seconds" is not portable — it means something different at every
tempo and every target offset. The number that stays meaningful is:

- **drift** = **ms of offset gained per beat** (per attack, for a one-note-per-beat pulse)
- **attacks per lap** = how many attacks elapse while the offset traverses a *full* beat

They are the same fact stated two ways, and both are tempo-invariant. Every
recipe here is written in them; seconds are a consequence.

```
drift (ms/beat) = target_offset_ms / (shift_seconds / beat_seconds)
attacks per lap = beat_ms / drift
```

**Corollary that explains a lot: attacks per lap is the RESOLUTION of the
process** — how many discrete frames the ear is given between unison and
interlock. This is why a bare quarter-note pulse feels faster than Reich at the
same drift: his patterns are streams of 12 semiquavers, so hundreds of attacks
sample the journey. One attack per 600 ms gives you very few frames, and each
one lands as a visible step. **Pulse density is therefore a second dial**, not
yet tested — see §6.

---

## 2 · Reference points from the literature

| source | figure | status |
|---|---|---|
| Reich, *Drumming* | the moving player reaches **one full position ahead in ~20–30 s** | sourced |
| Reich, *Piano Phase* | shift completed over **4–16 repeats** of the figure; players hold each new relationship 4–8 repeats before the next shift | sourced |
| Frontiers 2023 phasing study | tempi **80–140 BPM**; **successful** trials averaged **21.2 taps per phasing lap**, failed ones **8.8** | sourced |
| Reich, *Music as a Gradual Process* (1968) | the process should be so gradual that hearing it is "like watching a minute hand" | the aesthetic target |

**Converted to drift** (assuming the study's 80–140 BPM band, i.e. a 600 ms beat
at 100 BPM — *this conversion is ours, not the sources'*):

- Reich's Drumming rate ≈ **12–18 ms/beat** ≈ **33–50 attacks per lap**
- The study's *executable floor* ≈ **21 attacks per lap** — that is how fast a
  trained player can still control the drift, **not** an aesthetic target
- `phase01-8th` (the first attempt: 85 BPM, 353 ms over 20 s) = **12.5 ms/beat,
  57 attacks per lap** — i.e. already at Reich's rate, and the composer's verdict
  was **"far too quick."**

**So the working conclusion is: for a bare pulse, we want to be several times
slower than Reich.** That is what `phase02-*` tests.

---

## 3 · The score set

Everything below: two tubas, **C3 (MIDI 48, Reaper C2)**, staccato, one attack
per beat, **100 BPM** (beat = 600 ms), target offset **300 ms = one eighth**,
**10 s held** at the target, 4 s unison at each end. The *only* variable is the
shift duration.

| score | shift each way | drift | attacks per lap | vs Reich | total |
|---|---|---|---|---|---|
| `phase02-s30` | 30 s | **6.0 ms/beat** | 100 | 2× slower | 80 s |
| `phase02-m60` | 60 s | **3.0 ms/beat** | 200 | 4× slower | 140 s |
| `phase02-l120` | 120 s | **1.5 ms/beat** | 400 | 8× slower | 260 s |
| *(`phase01-8th`)* | *20 s @ 85 BPM* | *12.5 ms/beat* | *57* | *same* | *60 s* |

A 2× ladder — wide enough that any real difference is unmissable.

**Note length: 0.12 s written.** The block is now a visual, not the sounding
length (§5).

---

## 4 · The listening ladder — categories to name

One slow shift traverses the whole perceptual range once, so **a single playthrough
IS the taxonomy, played as a continuum.** Each score carries grey markers where the
offset crosses each value, so the composer can name the category and read the
number straight off the timeline.

The boundaries below are **PREDICTED from general auditory grouping — they are
the thing the experiment replaces.** Overwrite them with what is actually heard.

| offset | predicted category | what it should sound like |
|---|---|---|
| 0–10 ms | **fused** | one attack, reinforced; thicker, not doubled |
| 10–30 ms | **thickened / comb** | still one attack, but the colour changes |
| 30–50 ms | **smear** | onset gets fuzzy; two-ness is ambiguous |
| 50–80 ms | **flam** | clearly ornamented single event (grace note) |
| 80–120 ms | **slapback** | two attacks, still grouped as one gesture |
| 120–200 ms | **doublet** | two separate events in an uneven rhythm |
| 200–280 ms | **lopsided / swung** | a limping two-beat, nearly even |
| 300 ms (½ beat) | **interlocked** | fuses into ONE even stream at double rate |

### Dwell time — the compositional dial

How long the music *sits inside* a category. This is what a recipe actually
specifies. `dwell = window_width_ms ÷ (drift ÷ beat_seconds)`.

| category window | s30 (10 ms/s) | m60 (5 ms/s) | l120 (2.5 ms/s) |
|---|---|---|---|
| fused (10 ms) | 1 s | 2 s | 4 s |
| thickened (20 ms) | 2 s | 4 s | 8 s |
| smear (20 ms) | 2 s | 4 s | 8 s |
| flam (30 ms) | 3 s | 6 s | 12 s |
| slapback (40 ms) | 4 s | 8 s | 16 s |
| doublet (80 ms) | 8 s | 16 s | 32 s |
| lopsided (80 ms) | 8 s | 16 s | 32 s |

*Read it backwards to compose:* want 15 seconds of flam? The flam window is
~30 ms wide, so drift must be 2 ms/s — `--out` = target_ms / 2.

---

## 5 · Note length: what is written vs what sounds

**Written block = 0.12 s** (`--notelen`), chosen so the score reads cleanly and
can run at rapid tempos. **The staccato sample rings ~0.42 s at C3** and 2n
established it is a fixed one-shot that ends itself — but *whether note-off
truncates it was never tested* (the same open question 2o raises for cuivre).

**This set doubles as that probe, at no cost:**
- if the short blocks sound the same as `phase01-8th` did → note-off does **not**
  truncate; the block is a harmless visual convenience
- if they sound clipped → note-off **does** truncate, which is a new dial
  (variable-length staccato) and D9 needs an amendment

**The one thing to watch:** the tool prints a `*** SAMPLE OVERLAP ***` warning
when the pulse gets tighter than the ring time. At 100 BPM the gap is 594 ms
against a 420 ms ring, so we are clear — but past ~140 BPM on a quarter-note
pulse, one player is physically double-sounding while the score still looks
clean. That is the `HARD occupancy uses sample length` question already in
`docs/NITS.md`.

---

## 6 · Open — the next dials, in order

1. **Pulse density** (§1's corollary). Same drift, but 2, 3 or 4 attacks per beat
   — i.e. an actual Reich figure rather than a bare pulse. Prediction: more
   attacks per lap = smoother process at the same drift, and the *pattern*
   becomes the thing that phases rather than a single flam.
2. **Rapid fluttering** — the composer's named target. Probably lives at high
   pulse density with a small target offset, not at a slow pulse. Blocked on
   §5's note-off question, because at those rates the sample length decides
   whether it is even renderable.
3. **Non-linear drift** — Reich's players do not drift linearly; they push and
   settle. `--ease` is not built yet.
4. **More than two players** — three at different drift rates, which is where
   phasing stops being an effect and becomes texture.

## 7 · Verdicts (fill in by ear)

| score | verdict | where the categories actually changed | keep? |
|---|---|---|---|
| `phase02-s30` | | | |
| `phase02-m60` | | | |
| `phase02-l120` | | | |

**Sources:** [Reich — Piano Phase](https://stevereich.com/composition/piano-phase/) ·
[Frontiers 2023, phasing performance study](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1207646/full) ·
[Piano Phase (Wikipedia)](https://en.wikipedia.org/wiki/Piano_Phase)
