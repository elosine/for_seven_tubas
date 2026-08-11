# The engine-development framework

*Composer's conceptual start, 2026-08-11 (COMPOSER_LOG); built out by AI same day.
This is the P4 methodology: how the grain generative engine gets developed
systematically instead of by wandering.*

## 0. What the engines actually use today (the composer's first question)

Both live engines scatter events by the same two-layer mechanism:

1. **The trend layer (L2):** the drawn/parametric rate trajectory r(t) is integrated
   over small windows (0.25 s) with a fractional accumulator → each window gets an
   integer **quota**. The trend is guaranteed, never statistical.
2. **The scatter layer (L1):** inside each window, the quota'd events are placed
   **uniform-random** (max randomness given the quota). Then per-event parameters
   are drawn independently: duration (SC: log-normal with feasibility coupling;
   OC: the two-category short-grain model), release (uniform in range), surge ratio
   (log-uniform), level (flat + gaussian jitter).
3. **Assignment:** SC = round-robin with busy-skip in start order; OC = causal
   random among feasible parts (respecting the re-articulation law).

What differs between SC and OC is only **which moment gets scheduled**: SC scatters
the APEXES (peak-cut = attack; onsets back-calculated), OC scatters the ONSETS
(durations follow, capped by the part's next onset).

**Since 2026-08-11 every render is seeded** (`spec.seed`, auto-seed echoed in the
manifest): any realization can be reproduced exactly.

## 1. The development loop (the composer's model, formalized)

```
0. TARGET      name the sound-image in words + the listening questions (before generating)
1. GENERATE    engine render + manifest (the numbers) + seed
2. LISTEN      verdict per dimension, against the named target
3. BRANCH      pass → freeze as anchor | fail-magnitude → TWEAK | fail-structure → NEW ENGINE
4a. TWEAK      ladder battery (one dial, same seed) → bisect → re-listen
4b. NEW ENGINE candidates with ONE structural claim each → matched A/B vs incumbent
5. HAND LOOP   generate → composer hand-tweaks → analyzer diffs → lesson → adjust → regenerate
6. CODIFY      passed settings = named recipe (DB entry); lessons update the laws
```

## 2. The branch decision: tweak vs new engine

The question underneath: is the failure a *value* problem (right model, wrong
number) or a *structure* problem (no value can produce the target)?

**The span test** — before abandoning a model, render the suspect dial at its
plausible extremes (same seed):
- Extremes **bracket** the target (one over-shoots, one under-shoots) → **TWEAK**;
  bisection finds the value in ~3 listens.
- Extremes sound **the same** in the relevant dimension → the dial is perceptually
  inert there → **NEW MODEL** (this is finding 13: no fade parameter could carry
  onset density).
- Fixing dimension A **breaks B at every setting** → coupled failure → **NEW
  MODEL** (this is the pass-2 sweep: density × dur-diversity impossible in one
  stream at any maxDur → longStream superposition, a mechanism, not a value).

| Evidence | Points to |
|---|---|
| Complaint names a magnitude ("too short", "too many") | tweak |
| Extremes bracket the target | tweak |
| Hand-edits are uniform or proportional (analyzer §5) | tweak (it tells you how much) |
| Dial swept end-to-end, percept doesn't move | new model |
| Two dimensions can't be satisfied at any setting | new model |
| You hear a structure the model doesn't have ("two layers") | new model |
| Hand-edits are conditional/structural (analyzer §5) | new model (it names the missing mechanism) |

## 3. Informed A/B: perceptual step sizes (the 5 ms vs 100 ms question)

Ground rule: **step multiplicatively, not additively.** Duration/tempo perception
follows Weber's law — the just-noticeable difference is a *fraction* (~5–10% for
durations in our 0.5–4 s range), not a fixed ms amount. So:

- **5 ms on a 1 s grain is inaudible** (0.5%, far below JND). 100 ms on a 1 s grain
  is ~2 JND — a reliable A/B difference. The same 100 ms on a 3 s grain is barely
  1 JND.
- **One A/B step = ×1.15–1.25** (comfortably audible, not a category jump).
  **A category jump = ×2** (an octave of the parameter).
- **Range expansion: by octaves (×2), not by fixed increments** — expanding maxDur
  1.6→2.1 is one step of hearing; 1.6→3.2 is a new category.

Per-dial step table (one A/B step | category jump):

| Dial | one step | category | notes |
|---|---|---|---|
| onset/apex rate | ×1.25 | ×2 | sweep showed 6→8→10/s are distinct percepts |
| duration band edges | ×1.25 | ×2 | short-grain band edges included |
| release | ×1.5 | ×2–3 | 20–80 ms straddles a TIMBRE boundary (tongue-stop vs taper) — small absolute changes matter here, steps are coarser multiplicatively |
| surge ratio | ×1.5 | ×3 | log-perceived |
| pShort / mix weights | ±0.15 abs | ±0.3 | probabilities: linear steps |
| scatter sigmas / CV floors | ±0.15 abs | ±0.3 | already log-domain |

**Battery shapes:**
- **Ladder** (find the knee): ONE dial, 3–5 multiplicative steps, SAME seed —
  differences are the dial's alone, realization noise is frozen out.
- **Pair** (confirm): A/B at the chosen value vs incumbent, same seed.
- Never change two dials in one battery; never compare across different seeds
  when the dial change is < ~2 JND (realization noise swamps it).

## 4. New-engine candidate evaluation

1. Every candidate states **one structural claim** ("duration diversity at density
   requires a superposed reserved stream") — no claim, no candidate.
2. Candidates render to the **same spec targets** as the incumbent (same
   trajectory, same apex, same seed policy) so mechanism is the only variable.
3. The battery isolates the claim: incumbent vs candidate, listening question =
   the claimed dimension only.
4. **Law compliance is a regression gate, not a verdict**: manifests must pass the
   L1/L2 floors (gap CV, quota satisfaction, part balance) before anything is
   auditioned — law-violating stimuli can't calibrate (meta-law).
5. Keep it cheap: max 2–3 candidates per round, one round before re-scoping.
6. **Anchors as regression suite:** every passed render (L3 keeper, SC4, future
   passes) is re-rendered when an engine changes; anchors must stay achievable.

## 5. The hand-tweak feedback loop (generate → tweak → analyze → lesson)

The grain-editing suite (apex dots, duration/amplitude/release handles, env
toggle, go-time box) is the instrumentation; the composer's hand-edits are DATA.

**Protocol:** generate (seeded, archived) → composer edits a COPY under a new
session name → `node tools/analyze_tweaks.js scores/<orig>.json scores/<tweaked>.json`.

The analyzer matches grains by id and classifies each delta family (onset,
duration, release, level) + structural edits:

| Delta pattern | Lesson | Action |
|---|---|---|
| **UNIFORM SHIFT** (consistent ±, tight spread) | dial off by the mean | move the dial by the reported amount |
| **PROPORTIONAL RESCALE** (delta ∝ original value) | range/distribution scale off | multiply the range by the reported factor |
| **COUPLING SIGNAL** (delta tracks time / local rate) | model lacks that coupling | NEW-MODEL evidence — the covariate names the missing mechanism |
| **CONDITIONAL EDIT** (only covariate-selected grains touched) | same as above, selection form | NEW-MODEL evidence |
| **POLISH/NOISE** (zero-mean scatter) | model fine | no action, or scatter-sigma taste |
| **deletions clustered** | trajectory over-shoots there | reshape trajectory leg |
| **deletions spread** | global density high | rate dial down |
| **additions** (hand-placed grains) | missing component | candidate mechanism (cf. how longStream would have appeared) |
| **env swaps ≥3** | envelope taste | envelopeMix dial or new default |

*Validated 2026-08-11 against synthetic edits of all four classes — each
classified correctly with correct magnitude and direction.*

**Confirmation rule (closes the loop):** apply the extracted lesson, regenerate
with the SAME seed, re-diff against the composer's tweaked version — the residual
must shrink. If it doesn't, the lesson was mis-read or it's model-level after all.

## 6. Tool inventory

| Tool | Status |
|---|---|
| Quota-window engines (SC endings-first, OC onsets-first) | live |
| Manifests as evaluation instruments (truncation, occupancy, gap CVs) | live |
| Seeded reproducible renders (`spec.seed`, auto-seed echoed) | live 2026-08-11 |
| Headless feasibility sweeps (node, stubbed score) | live (pass-2 sweep) |
| Grain-editing suite (the hand-tweak instrumentation) | live |
| `tools/analyze_tweaks.js` (delta classifier) | live, validated |
| Ladder-battery generator (one dial × k steps × same seed, auto-saved scores) | next build, on demand |
| Law linter (auto L1/L2 floor checks on every manifest) | next build |
| Residual-shrink auto-check (lesson → regenerate → re-diff) | manual for now |
