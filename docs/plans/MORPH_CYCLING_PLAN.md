# MORPH CYCLING — implementation plan (FR-3 · FR-6 · FR-4)

> **Written 2026-08-17 (day 13) to be implemented cold.** Requirements and the
> composer's verbatim reasoning are in `docs/FEATURE_REQUESTS.md`; this file is
> the build.
>
> **Governing:** `docs/AI_METHODOLOGY.md`. Rule 4 in particular — every claim in
> the gates below must be *run*, not read.
>
> **Baseline established 2026-08-17:** `node tools/test_morph.js` → **331 passed,
> 0 failed**. The byte-identity fixture harness is real, covers "every blessed
> recipe and live variant", stores two hashes per fixture (notes, and
> summary+meta), and can be regenerated with `--print-fixtures`. **It should not
> need regenerating for this work — if it does, something is wrong.**

---

## 1 · What this changes, in one sentence

**Today there is exactly one time value**, and the glissandos are stretched to
fill it, so "how long the gliss takes" and "how long the gesture lasts" are the
same number. **This plan splits that into two**, and makes the trajectory cycle
out-and-back instead of arriving and stopping.

---

## 2 · New parameters

| param | meaning | default | legacy behaviour |
|---|---|---|---|
| `carrier.span` | **unchanged** — the ONE-WAY gliss length (the pace dial) | 30 | unchanged |
| `carrier.duration` | total length of the **body** | `null` → equals `span` | identical to today |
| `carrier.release` | forced run-down length, seconds | `null` → no release stage | identical to today |

**Cycling is ON exactly when `duration > span`.** No separate switch — the
composer sets a duration longer than one journey and it cycles. One code path.

---

## 3 · THE CORE CHANGE — `voiceProgress`

Today (morph.js:235) the progress ramps and **clamps**:

```
u = clamp(t / span, 0, 1)
x = clamp((u - start) / run, 0, 1)
p = applyBias(x, bias) * depth
```

New: let `u` advance unclamped and **fold** it with a triangle.

```
u  = t / span                          // no clamp
x  = (u - start) / run                 // 0 at this voice's start, 1 at arrival
x  = x < 0 ? 0 : fold(x)               // before its start, hold at the origin
p  = applyBias(x, bias) * depth

fold(x):  m = x % 2;  return m <= 1 ? m : 2 - m      // 0→1→0→1…
```

**Byte-identity argument:** when `duration <= span`, `x` never exceeds 1 within
the rendered window, so `fold(x) === clamp(x,0,1)` and every legacy render is
bit-for-bit unchanged. *Assert this, do not assume it.*

**Why `bias` mirrors for free (the composer's ruling):** `fold` is symmetric, so
`applyBias(fold(x))` warps the outward and return sweeps identically. **Do NOT
add a cycle-asymmetry parameter** — it was explicitly declined.

---

## 4 · THE RELEASE (FR-6)

At `t = duration` every voice sits at some fold value. Over the next
`carrier.release` seconds, drive each voice **linearly down to a trough**:

```
xRel = foldValueAt(duration) * (1 - (t - duration) / release)
```

- Every voice descends **for the same duration, at its own rate**. Voices near a
  trough move slowly; voices at a peak move fast. That raggedness is wanted — a
  uniform fade sounds mechanical.
- **Composer's decision, recorded:** the bloom **CLOSES**. Because loudness is
  driven by the same `p`, running `p` to 0 returns the pitch to unison *and* the
  loudness to its floor in one motion — pairs converging, beating slowing to
  nothing, fading as it closes. **This is free; it is the cycle finishing its
  downward half.** Decoupling them (bloom stays open, only volume fades) was
  considered and **declined as a second code path**.
- `release` is **forced, not inherited from the cycle length**. This is
  deliberate: the natural run-down would take up to half a cycle, which would
  couple release length to pace — the same conflation this whole plan exists to
  remove. Forced-N is a **strict superset**: set it to the natural length and you
  get the natural behaviour back, so nothing is foreclosed.
- *Risk, stated:* the jarring risk is entirely in the ratio of `release` to the
  body's breathing rate. Near-natural is indistinguishable; very short reads as
  an imposed cutoff. That is a dial from *dissolve* to *cutoff*, which is a
  musical choice, not a defect.

---

## 5 · LET THEM FINISH (no truncation, no runts)

In `buildCarrier` (morph.js:388):

```
let dur = Math.min(want, limit - start);     // REMOVE the limit clamp
```

- Stop **starting** new segments once `t >= duration + release`.
- Let the final segment run its **natural length**. It extends past the end, but
  `p` has reached 0 there so it is inaudible — and for a real player it is simply
  finishing the note.
- This removes the hard simultaneous chop and the runt notes in one move.
- Total rendered length becomes `max(segment end)` across voices, which is
  **unpredictable by design** — see §8.

---

## 6 · LOUDNESS — no code change

`dynLevel` is already driven by `p`. Once `p` cycles, loudness cycles with it.
**This is the whole payoff of the composer's "loudness parallels pitch"
decision** — the coupling that was a problem under *stretching* is the thing that
makes it work under *repeating*.

- **Settings change only:** `dyn.shape` should be **`rise`** for the cycling
  form. `rise` gives quiet→loud outward and loud→quiet back — one peak per full
  cycle. `swell` (BLOOM's current setting) would give **two** peaks per cycle,
  since the arch is symmetric in `p`.
- Expose `dyn.shape` in the panel if it is not already a control.

---

## 7 · THE ATTACK (FR-4) — smaller than spec'd

**Finding while planning: the join already works by construction.** `shapeGain`
is **multiplicative** over the dyn layer, so when the attack's gain reaches 1 the
level *is* whatever the body says. **There is nothing to calculate.** FR-4's
"calculate the decay and the join" is already solved by the existing design.

So what remains is only:

- `shape.attack.entry: 'together'` — **already exists.**
- `attack.len` (A) and `decay.len` (D) — **already exist**, as panel fields.
- **The rule:** no overshoot → the ramp rises to gain 1, `decay` = 0. Overshoot
  → `attack.peak > 1`, and `decay` exists solely to bring it back to 1.
- **No glissando in the attack** (composer's locked decision) — the attack sits
  on the body's initial pitches.
- Per-player articulations (cuivre / fortepiano / staccato) → `attack.transient`
  and `attack.noise`, **already exist**. Assigned by conversation, not UI, per
  the composer's own sandbox principle (UI for hammered loops, chat for
  one-offs).

**⚠ THE ONE REAL TRAP, and it will fire immediately:** the playability checker
will read an overlapping fortepiano and ordinario **on the same player** as a
**HARD conflict**. It is a **false positive** — a real player performing
attack-into-sustain is one continuous action. Without an exemption for
attack-transient pairs on the same player, every shaped attack lights the badge
and the checker starts crying wolf, which is worse than not having it. *This is
the mirror of 2r's usual trap: normally the mock-up hides real conflicts; here
the checker invents one.*

---

## 8 · PANEL

Two number fields via the existing `row()` helper, plus one selector:

- `duration (s)` → `carrier.duration`
- `release (s)` → `carrier.release`
- `dyn.shape` selector, if not already present

**Report the final length.** With "let them finish", the total is unpredictable
by up to ~10 s. The composer needs the actual number to place the gesture in the
score, so the status line must show it.

**No other UI.** The composer was explicit about not wanting UI work; everything
else is conversational through `bank/morph_params.json`, which the panel already
polls once a second.

---

## 9 · TOUCH POINTS

Confirmed by reading `morph.js` on 2026-08-17. Inside `render()`, the local
`span` **already means "the whole timeline" everywhere except one line** —
`voiceProgress` is the only consumer that means *travel*, and it is called
exactly once.

| line | what | change |
|---|---|---|
| 122 | `DEFAULTS.carrier` | add `duration: null, release: null` |
| 235 | `voiceProgress` | the fold (§3) + the release ramp (§4) |
| 345 | `buildCarrier` span | build to `duration + release` |
| 388 | `dur = Math.min(want, limit - start)` | remove the clamp (§5) |
| 745 | `normaliseShape(…, carrier.span)` | pass the total |
| 808 | patchable type map | add the two paths |
| 1052, 1611 | `meta` | see the warning below |
| 1117 | `const span = P.carrier.span` | becomes the total |
| 1273 | `voiceProgress(…, span, …)` | pass the **travel** |
| 1315/1336/1346/1516/1538 | `Math.min(span, …)` lookahead clamps | total — already correct |

**⚠ META HASH WARNING.** `meta` is inside the fixture hash
(`hash([res.summary, res.meta])`). **Adding fields unconditionally will break
every legacy fixture.** Add `duration` / `release` / `totalLength` to `meta`
**only when they are non-default**, so legacy meta stays byte-identical.

---

## 10 · ALSO WORTH FIXING WHILE HERE (small)

`buildCarrier` caps at **512 segments per voice and exits silently**
(morph.js:370). At ~8 s breaths that is ~70 minutes, so it will not bite at five
minutes — but a silent truncation violates this project's own "never silently
discard" rule. **Add a flag when the cap is hit.**

---

## 11 · GATES — every one must be RUN

- [ ] `node tools/test_morph.js` → **331 passed, 0 failed**, fixtures
      **unregenerated**. If a fixture hash moves, stop and find out why.
- [ ] `duration` absent → output byte-identical to today on all fixtures.
- [ ] `duration = 300, span = 30` → the body is 300 s; **the note timings of the
      first 30 s are unchanged** from a 30 s render at the same seed.
- [ ] Pitch **triangles**: measure that each voice returns to its start pitch and
      out again, and that pitch is **continuous at every turnaround** — no jump.
- [ ] Loudness cycles rather than freezing; with `rise`, **one** peak per cycle.
- [ ] At the release, **every voice is descending** and reaches its floor at
      `duration + release`. Measured, not heard.
- [ ] The bloom **closes**: pitch returns to unison during the release.
- [ ] **No truncated notes and no runts** at the tail.
- [ ] `tools/audit_playability.js` on a 5-minute render — report the counts; do
      not assume they are fine.
- [ ] The panel reports the **actual final length**.
- [ ] **HEARD BY THE COMPOSER.** Everything above is machine-checkable and none
      of it answers the only question that matters: does a five-minute cycling
      bloom stay alive, or become wallpaper?

---

## 12 · CONFIDENCE AND RESIDUAL RISK

**Confidence: high on the mechanism, and the reasons are concrete** — the fold is
one function, `voiceProgress` has exactly one caller, loudness needs no code
change at all, the attack join is already correct by construction, and a
331-assertion byte-identity harness exists to catch any legacy drift the moment
it happens.

**Where this is most likely to bite, in order:**

1. **The meta hash** (§9). Easiest mistake to make, and it will look like a
   real regression when it is not.
2. **The attack's false-positive conflicts** (§7). Will fire on the first shaped
   attack and will look like a genuine playability problem.
3. **`spread` under cycling.** It becomes the cycle phase offset, which is what
   decides whether a pair *pulses* or *holds steady* — and it is assigned by a
   seeded shuffle, so it is **unaimable**. Deferred by the composer, but at
   five-minute durations an unlucky draw means one pair sits nearly inert for the
   whole gesture. **Expect this to come back.**
4. **The musical result.** Every prediction in `FEATURE_REQUESTS.md` about the
   cycling texture — the pulsing-vs-steady table, "no pair goes silent" — was
   worked out on paper and **has never been heard**.
