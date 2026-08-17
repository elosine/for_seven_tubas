# FEATURE REQUESTS — the batch spec

> **What this is** (composer, 2026-08-17, day 13): a collected list of feature
> requests, spec'd briefly, **to be handed to another AI to implement all at
> once**. Nothing here is built. The composer lists and specs first, then one
> implementation pass.
>
> **Working rule set the same day → D34:** the AI does **not** implement
> anything without being asked explicitly. Proposals and specs, yes; edits, only
> on an explicit go. *(This restores `HOW_WE_WORK.md`'s "conceptual proposal
> before any code edit", which had been eroding into fix-it-as-you-see-it.)*
>
> **Written to be read cold**, per this repo's convention: each entry carries
> what was asked in the composer's own words, why it matters musically, the
> research already done (so the implementer does not repeat it), a proposed
> spec, and the gates it has to pass. Findings tagged **MEASURED** were run;
> everything else is inferred and says so.

## How to use this file

- One `## FR-n` section per request. IDs are stable, never renumbered.
- **Status** is one of: `spec'd` · `approved` · `building` · `done`.
- The implementer should read `docs/AI_METHODOLOGY.md` first — it governs, and
  its rule 4 (a confidence claim must be verified in the running app) is the
  standard every gate below is written to.
- Related standing decisions live in `PROJECT_JOURNAL.md` §4.

---

## FR-1 — Separate the morph's PACE from its LENGTH (a steady-state hold)

**Status:** `spec'd` · **Area:** morph engine (`score/public/morph.js`) + panel
· **Raised:** 2026-08-17

### What the composer asked

> *"The 'slower / longer' only goes up to one, and it kind of describes the pace
> of the process. Is there any way to dial in a pace, but then extend the length
> of the middle part? So in other words, there are parts coming in, swelling,
> beating, etcetera, just to find a steady state and maintain that for a certain
> amount of time… So I don't know what it is now — I'm working with a BLOOM.
> Maybe it's a minute and a half or something like that, but I can have something
> that lasts, say, five minutes if I wanted to. And that's just extending that
> steady state. And what I mean by steady state is **not sonically steady state,
> but just the process repeats itself.**"*

### The problem, stated precisely

`carrier.span` is **one parameter doing two jobs**: how fast the morph travels
from source to target, AND how long the gesture lasts. They cannot currently be
set independently. The `slower / longer` recipe runs span 10 → 60 s, so **60 s
is the hard ceiling** on a morph today, and lengthening it necessarily slows the
process down.

The composer wants: **reach the target at a chosen pace, then let the process
keep churning at the endpoint for an arbitrary duration** (their example: a
BLOOM that currently runs ~40 s extended to ~5 minutes without slowing).

### Research already done — 2026-08-17, by reading the engine (NOT run)

**This is the part that makes it cheap, and it should be verified before being
relied on.**

- **`voiceProgress()` already clamps progress at 1.0** — `const u = span > 0 ?
  clamp(t / span, 0, 1) : 1` (morph.js:236). So a segment generated *after* the
  travel completes already resolves to the endpoint state. **The "hold at the
  target" behaviour needs no new interpolation logic at all.**
- **Inside `render()`, the local `span` already means "the whole timeline"
  everywhere except one line.** Release anchoring (`rStart = span - rLen`),
  the `stateAt` lookahead clamps, shape normalisation and the meta block all
  want the TOTAL. **`voiceProgress` is the only caller that means TRAVEL**, and
  it is called exactly once (morph.js:1273).
- **Touch points counted: six.** `DEFAULTS.carrier` (:122) · `buildCarrier`'s
  `span` (:345) · `normaliseShape` call (:745) · the patchable type map (:808) ·
  `meta.span` (:1052) · `const span = P.carrier.span` (:1117) plus the
  `voiceProgress` argument (:1273).
- **The one thing that is NOT free — the dynamics layer.**
  `dynLevel(dyn, vi, nVoices, p)` is driven by the **morph progress `p`**, not by
  time (morph.js:210, called :1282). During a hold, `p` is pinned — so **the
  swells would freeze**, which is the opposite of "the process repeats itself".
  This needs its own treatment; see the spec.

### Proposed spec

**1 · `carrier.hold` — new, optional, seconds, default `0`.**
`span` keeps its exact present meaning (the travel). Total timeline =
`span + hold`. With `hold` absent or `0`, **every existing render must be
byte-identical** — that is the gate, and the twelve 2z G0 fixtures already exist
to prove it.

**2 · Route the two meanings explicitly** rather than leaving one variable with
two jobs — that ambiguity is what produced this request:

```
const travel = P.carrier.span;
const hold   = Math.max(0, P.carrier.hold || 0);
const span   = travel + hold;        // the timeline, as every other use means
voiceProgress(vi, nVoices, t, travel, ...)   // the ONLY consumer of travel
```

**3 · The dynamics must keep breathing through the hold.** Drive `dynLevel` with
a phase `q` that equals `p` during travel and then keeps advancing at the same
rate, wrapping at 1 — so the swell/rotate cycle **repeats once per `travel`
seconds** for as long as the hold lasts. With `hold = 0`, `q === p` exactly, so
byte-identity is preserved.

- *Checked on paper, worth confirming by ear:* `swell` wraps seamlessly (both
  ends of `sin(πq)·2−1` are the trough) and `rotate` wraps seamlessly at integer
  `turns` (the default is 1). **`rise` and `fall` will sawtooth at the wrap** —
  arguably the honest reading of "repeat", but it is a discontinuity and should
  be heard before it is blessed.

**4 · Expose it.**
- Panel: one number field, `hold (s)`, next to `span (s)`.
- Models: a recipe — *"hold the steady state"* — waypoints `carrier.hold` 0 →
  240 s. **Default `0`, and OFF until turned** (D32).

**5 · Playability.** A 5-minute render at ~8 s segments is roughly 7× the note
count of a 40 s one. The conflict badge and `tools/audit_playability.js` should
be run on a long hold before it is trusted — *unverified: nobody has rendered a
morph anywhere near this length.*

### Gates

- [ ] `hold` absent/0 → **byte-identical** output on all twelve G0 fixtures and
      the six stock models.
- [ ] `hold = 120` on BLOOM → total length is `span + 120`, and the morph state
      at every `t > span` equals the state at `t = span`.
- [ ] Dynamics measurably still cycling during the hold (not frozen), at the
      travel's rate.
- [ ] Conflict counts reported for a long hold; no silent explosion.
- [ ] **Heard by the composer** — does a 5-minute BLOOM hold actually stay alive,
      or does it become wallpaper? This is the real test and only they can run it.

### Open question for the composer

During the hold the morph state is **pinned dead still at the endpoint** (only
re-articulation and breathing continue). That matches the description given.
Whether it eventually wants a slow wobble or drift around the endpoint is a
separate, later question — flagged, not assumed.

---

## FR-2 — A SEGMENTED TIMELINE: entry · development · hold · release, each in seconds

**Status:** `spec'd` · **Area:** morph engine (`score/public/morph.js`) + panel
· **Raised:** 2026-08-17 · **Supersedes FR-1**, which is its middle third

### What the composer asked

> *"I have this little part in the beginning, which is the voices entering until
> they're fully entered… then there's a shaping part where various permutations,
> these beating pairs develop and rise. And then there's a release section
> where they slow down or they drop out… So there's that segmented model. And my
> feel is all the rest of the dials — more dramatic, smoother, louder swells,
> more beating — just describes those internal mechanisms, if they could operate
> still within these various segments. So I would dial in how fast I want the
> process to change and decay, and then all the other ones describe the internal
> sound, get it right. And then I could establish the length of that middle
> steady state."*

### THE ASSESSMENT — what is already true, and what fights it

**Read from the engine on 2026-08-17. NOT run. Every claim below is an
inference from code and must be confirmed before it is relied on.**

**The engine already has TWO independent timelines, both stretched across the
same `carrier.span`:**

- **Timeline A — the GAIN envelope** (2z's `shape` block). It is *already
  literally* attack / decay / **body** / release — see the ASCII diagram at
  `morph.js:462-468`. **The composer's model exists here.**
- **Timeline B — the MORPH TRAVEL** (`voiceProgress`). It runs 0 → 1 across the
  **entire span** and **knows nothing about Timeline A's boundaries.**

**So the four-part model exists at the AMPLITUDE level and does not exist at the
PROCESS level.** The bloom does not reach full realisation and then hold — it is
still travelling during what the gain envelope calls the release, and it began
travelling during what the gain envelope calls the attack. *This is the single
finding that explains why the request keeps arising.*

**Segment by segment:**

| Segment | Status | Detail |
|---|---|---|
| **Entry** | **exists twice, uncoordinated** | `shape.attack.entry` sets when a voice's first note SOUNDS (`startT`); `dials.spread` sets when its morph starts TRAVELLING — `start = k · spread·0.8`, so at BLOOM's spread 0.35 the last voice does not begin blooming until **28 % into the whole span**. A voice can be sounding but not yet blooming. **The entry cannot be "clipped off" because it is not a segment — it is smeared across the first 28 % of the process.** |
| **Development** | exists, unbounded | The travel. No concept of "the process has completed a cycle" — its only end is the span's end. |
| **Steady state** | **absent** | = FR-1. |
| **Release** | **half exists** | Dropout ✅ (cluster-safe, thins by whole pairs) · gain taper ✅ · motion disperse/converge ✅ · **"they slow down" ❌ — there is no rate deceleration anywhere.** The process does not decelerate; it stops at p = 1 and a gain envelope closes over it. |

### The orthogonality assumption — where it breaks

The composer's proposed workflow (set pace → set internal character → set hold
length → shape the attack separately) **requires the dials to be independent.**
Checked against the code, three of them are not:

| Dial | Orthogonal? | Why |
|---|---|---|
| `smoother / choppier` (`carrier.segLen`) | ✅ | A re-articulation rate in **seconds**. Changing span does not change it. |
| `more beating` (`target.cents`) | ✅ | Pure endpoint magnitude. |
| `louder swells` (`dyn.amount`) | ⚠️ **half** | The magnitude is orthogonal, but the **rate is not** — `dynLevel` is driven by progress `p`, so a longer span makes every swell proportionally slower. Stretch to 5 minutes and you get **one five-minute breath**, not breathing. |
| `more dramatic` (`dials.depth` + `dials.bias`) | ❌ | `applyBias(p, bias) = p^(3^bias)` is a **global time-warp of the entire travel**, and `depth` scales the destination. It changes *when* everything happens and *how far* it gets. **It is a pace-and-destination dial wearing an intensity label.** |
| `slower / longer` (`carrier.span`) | ❌ | Not a pace dial. Because `spread` and `dyn` are **fractions of span**, changing it drags entry timing and swell rate with it. It is a **master time-scale**. |

**Verdict: the composer's workflow is right; the parameterisation fights it in
exactly three places** — spread-as-a-fraction, dyn-driven-by-progress, and
bias-as-a-global-warp.

### Proposed spec

**Four named durations, all in SECONDS, all independent:**

```
entry (s)  |  develop (s)  |  hold (s)  |  release (s)
```

1. **The travel runs 0 → 1 across `develop` ONLY** — not across the whole
   timeline. This is the change that makes everything else work.
2. **`entry`** — all voices arrive and are sounding, morph progress pinned at 0.
   Voice stagger happens **inside this window**, so it is a real segment with a
   real length instead of a percentage of everything.
3. **`hold`** — progress pinned at 1, re-articulation and breathing continue
   (FR-1's spec applies verbatim).
4. **`release`** — the existing taper / dropout / motion, **plus the missing
   rate deceleration** so "they slow down" becomes true: `segLen` eases longer
   across the release window.
5. **`dials.spread` is re-scoped** to mean only *how fanned out the voices are
   within the development* — which is what the composer already believes it
   means.
6. **`dyn` gets a period in SECONDS** (a rate), replacing its dependence on
   progress. Then swells breathe at the same rate whether the gesture is 40 s or
   5 minutes.
7. **`bias` should be documented as what it is** — a warp of the development
   curve — and confined to the development segment. Renaming the recipe away
   from "more dramatic" is worth considering, since that label is the reason the
   composer expected it to be an internal dial.

**Backwards compatibility.** `carrier.span` must keep working: absent the new
fields, `develop = span` and `entry = hold = release = 0`, and **every existing
render stays byte-identical**. The twelve 2z G0 fixtures are the gate.

### Gates

- [ ] Legacy params (no segment fields) → **byte-identical** on all twelve G0
      fixtures and the six stock models.
- [ ] Each of the four durations changes **only** its own segment's length —
      verified by measuring segment boundaries, not by listening.
- [ ] With `develop` fixed, sweeping `hold` 0 → 240 s leaves the development's
      note timings **unchanged**.
- [ ] With span doubled, `segLen` and the swell period are **unchanged** (the
      orthogonality that does not hold today).
- [ ] Release deceleration measurable: mean segment length rises across the
      release window.
- [ ] Conflict audit on a long render.
- [ ] **Heard by the composer** — the only test that matters.

### Relationship to FR-1

FR-1 is **a strict subset** (the `hold` segment alone). Building FR-1 first is
not wasted work, but on its own it leaves the dials non-orthogonal, so the
composer will hit the same wall from the other side — a 5-minute hold whose
swells have frozen, or whose entry occupies 28 % of a much longer span.

### Open question for the composer

**"Full realisation" is not yet defined.** The composer said the development
runs *"until the processes have run through at least one cycle or whatever,
several cycles."* A bloom's travel has no cycles — it goes from unison to
±25 cents and stops. What repeats is the **breathing and the re-articulation**.
So: is "one cycle" a number of swells? A number of re-articulations? Or simply
"when it has arrived"? This changes whether `develop` is set in seconds or in
cycles, and only the composer can answer it.

---

## FR-3 — ARRIVE, THEN CYCLE: the trajectory loops instead of stopping ★ PINNED

**Status:** `spec'd, PINNED by the composer 2026-08-17` · **Area:** morph engine,
one function · **Reshapes FR-1 and FR-2** — see "Relationship" below

### What the composer asked

> *"For each player to reach their destination pitch and then continue a cycle
> where they sweep down to their starting pitch and then back up, etcetera,
> etcetera. That'll be the continuous portion of this model."*

And on the consequence, before being told it:

> *"Clearly, it becomes a different texture, but I think that's okay. I think
> that'll be interesting for now. And in a later iteration, we can explore how
> to make, essentially, a repeat of the bloom over and over again."*

### The whole idea, conceptually

**Today there is exactly ONE time value.** The glissandos are stretched to fill
it, so "how long the gliss takes" and "how long the gesture lasts" are the same
number. *That single conflation is the root of every difficulty in FR-1 and
FR-2.*

**The change: split it into two.**

1. **How long the glissando takes** (the pace — what `slower / longer` should
   really mean)
2. **How long the whole thing lasts** (free, and may be indefinite)

**And after arrival, the trajectory reverses instead of stopping** — a triangle
sweep back to the starting pitch and out again, forever.

- **Triangle, NOT sawtooth.** A saw has to jump back to the start pitch, which
  is a pitch discontinuity in the middle of a held note. Out-and-back has no
  jump. *(A saw is not impossible — it would need the jump hidden under a
  re-articulation — but it buys nothing.)*
- Default cycle period = twice the gliss length (out and back at the same rate).

### Why it is a small change — the finding that makes it cheap

**Every model is a pure function of progress.** M1 is literally
`cents = start + direction × amount × p`. So if `p` oscillates instead of
ramping-and-clamping, the pitch sweeps out and back **with no change to any
model**. All six inherit it: SPECTRAL drifts in and out of focus, CONVERGE
closes and reopens, SPACING breathes open and shut.

**The change is confined to the progress function.** *(Read from the code
2026-08-17, NOT run.)*

### THE TEXTURE CONSEQUENCE — predicted, and it should be checked by ear first

The composer already accepted that it "becomes a different texture." Being
specific about *how*, because it is not obvious and it is the interesting part:

- **During the bloom**, each pair's gap opens 0 → 50 ¢ and the beating
  accelerates 0 → 2.6 Hz (F2 pair; faster per octave, D28).
- **Once cycling**, each player sweeps its own ±25 ¢ **on its own stagger
  offset**. The two halves of a pair are therefore cycling at a phase difference
  — and **the phase relationship inside a pair decides what that pair does**:

| phase within the pair | the gap | what you hear |
|---|---|---|
| **in phase** (both at their extreme together) | swings **0 ↔ 50 ¢** | beating **pulses** — nothing → 2.6 Hz → nothing |
| **anti-phase** | parks near **25 ¢** | beating **holds steady** at ~1.3 Hz |
| anything between | wanders | drifting, irregular beating |

**Consequence worth carrying: no pair ever goes silent.** The gap only reaches
zero at instants, and only in the in-phase case. *This was checked on paper and
is the opposite of the first guess — the intuition that pairs might cancel and
stop beating is wrong.*

**And it hands over a new dial for free:** the within-pair phase offset is a
control over *pulsing vs steady* beating, per pair. Nothing like it exists today.

### Deferred by the composer, deliberately

> *"In a later iteration, we can explore how to make essentially a repeat of the
> bloom over and over again."*

I.e. cycling the **pair's gap** as a unit (a true repeated bloom) rather than
cycling **each player independently** (this entry). That needs the pair to be a
scheduled unit — see the pairs-vs-voices finding below — and is **not** in scope
now.

### The pairs-vs-voices finding (context, not a request)

Established 2026-08-17: **the engine has no concept of a pair.** It has eight
players and staggers them individually with a seeded shuffle; it never asks who
a player's partner is. So a pair's two halves are on separate timetables and the
gap — the thing actually heard — is whatever falls out.

**For FR-3 this is fine, arguably good** (it is what produces the phase variety
above). **For the deferred "repeat the bloom" idea it is the blocker.**

### Gates

- [ ] Legacy params → byte-identical (twelve G0 fixtures, six stock models).
- [ ] Gliss length and total length independently settable; changing total does
      **not** change the gliss rate.
- [ ] Pitch is continuous at every cycle turnaround — **no discontinuity**,
      measured, not assumed.
- [ ] Beat rate measurably sweeps and does not park at zero for any pair.
- [ ] Conflict audit on a long render (note count scales with total length).
- [ ] **Heard by the composer** — is the cycling texture actually interesting,
      and does the bloom→cycle transition read as one gesture or as two?

### Relationship to FR-1 and FR-2

- **FR-1** (a static hold) is **superseded**. The composer chose a *moving*
  continuation over a frozen one.
- **FR-2**'s four-segment model is **reduced**: with a cyclic process, total
  length is free and "entry / development / steady state" stop needing separate
  durations. What survives of FR-2 is the **release** (the unwind), and the
  **orthogonality analysis** — which FR-3 largely resolves, since with cycling
  the character dials become genuinely internal and period becomes the only pace
  dial.

**Build order recommendation: FR-3 first, alone.** It is the smallest change and
it makes the other two mostly unnecessary.

---

*(FR-4 onward: to be added as the composer lists them.)*
