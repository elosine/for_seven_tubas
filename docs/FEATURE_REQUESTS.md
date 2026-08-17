# FEATURE REQUESTS — the batch spec

> **What this is** (composer, 2026-08-17, day 13): a collected list of feature
> requests, spec'd briefly, **to be handed to another AI to implement all at
> once**. Nothing here is built. The composer lists and specs first, then one
> implementation pass.
>
> **Working rule set the same day → D35:** the AI does **not** implement
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

### Composer's rulings while spec'ing (2026-08-17)

- **The curve (`bias`) MIRRORS.** The sweep back is the mirror of the sweep out —
  symmetric, no new parameter. *"We'll just have to address that very simply by
  saying it just does the mirror for now. Eventually that might become a more
  specific parameter."* → **implement as symmetric; do NOT invent a
  cycle-asymmetry dial.**
- **Distance, direction and depth need no change** — pure magnitudes, already
  orthogonal, unaffected by cycling.
- **Aimable pair phase is DEFERRED, not forgotten.** Under cycling, stagger
  becomes cycle phase, and phase is what decides whether a pair pulses or holds
  steady — but it is assigned by a seeded shuffle, so the most audible new dial
  is **unaimable**; you can only reroll the seed. Composer: *"let's just defer
  the rest… I just wanna stick to getting this model right."* Revisit with the
  pairs-vs-voices work.

### Gates

- [ ] Legacy params → byte-identical (twelve G0 fixtures, six stock models).
- [ ] Gliss length and total length independently settable; changing total does
      **not** change the gliss rate.
- [ ] The return sweep is the **exact mirror** of the outward sweep.
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

## FR-4 — CLIP AND REJOIN: a bespoke attack in front of the generated body

**Status:** `spec'd` · **Raised:** 2026-08-17 · **Depends on FR-3**

### The concept

Generate the bloom, **clip it at the point where all voices are in**, design the
attack by hand, and let each player rejoin the body at their own next breath.
The attack is authored, not parameterised — which is D31 applied structurally,
and it sidesteps the generic-preset approach the composer already rejected.

### The ADSR here

- **A** — the bespoke attack.
- **S** — a sustain that extends to the player's **next scheduled breath**.
- **R** — **none.** There is no release; the body simply takes over.
- So "S" is not a designed value: it is *whatever gap remains* between the end of
  the attack and that player's next entry in the generated schedule.

### What the attack is made of (composer's sketch, in performer terms)

Per player, freely different — this is the point of doing it by hand:

- one plays **cuivre**, then sustains
- one plays a **staccato** attack, then swells into a long tone
- one plays a **fortepiano**
- …then all resolve into long tones and rejoin the body

*Framed deliberately as what real performers do. Sample reproduction and any
hacks needed to imitate it are a **separate second stream**, to be solved after.*

### DECISIONS LOCKED BY THE COMPOSER

- **The attack contains NO glissando and no pitch change.** It happens on the
  body's initial pitches, whatever they are. *This is the stake in the ground
  that makes the whole thing tractable.*
- **The attack's sustain extends to that player's next scheduled sound** — the
  next breath in the generated schedule. That is where they enter the cycle.
- **No release section.**

### What the machine must do

1. **Clip the body at the moment all voices are in.**
2. For each part, **create bespoke notes** covering the attack through to that
   part's next entry.
3. The sustain **extends to the end of that truncated first note** of the bloom.
4. **Report what was left over** — per part: how long the remaining tone is, at
   what pitch, and roughly what the volume and gliss are doing — **bluntly.**
   Precision is explicitly not wanted (see below).

### THE FLAG (the only new mechanism requested)

If a long attack, or a long wait to the next breath, produces a tone longer than
a player can hold, the composer wants **a flag** — just awareness — so a breath
can be added by hand in the notation.

> *"If I made a long attack or they have a long time to get to the next breath,
> I'll have to manually put in a breath. But that's the more rare circumstance."*

**Explicitly low priority.** If it is hard programmatically, the composer will
eye it at notation time. *"It's not a major consideration."*

### EXPLICITLY NOT WANTED

- **No fine gradations.** *"If it was electronic music we'd be going from 197 Hz
  to 199 Hz over 0.15 seconds… I don't need that reflected in the notation, or to
  try to achieve that."* The rejoin should be **blunt and universally
  expedient**, not exact.

### SIMPLIFIED MODEL — the composer's expedient version (2026-08-17, supersedes the above where they differ)

The composer backed out of the clip-and-rejoin complexity to something much
smaller, and it needs **no new machinery**:

- **Everyone enters TOGETHER**, overriding the striated entry. This is an option
  the composer wants, not the default.
- **The attack is A and D only. The S is the morph body itself.** There is no R.
- **A is the composer's** — onset length, from ~0 ms to any length ("if I want a
  three second ramp, I could").
- **D is optional and calculated, not composed.**

**The rule that makes it consistent:** the attack must end at the level the body
starts on.

- **no overshoot** → the ramp simply rises to that level; **D is zero.** *(The
  composer's own preference: "just no D, just zero D, and it's a slope attack
  over one second… and then it just immediately joins the body.")*
- **overshoot** → the ramp goes above the body's level and **D exists only to
  bring it back down.**

**The join level is EIGHT numbers, not one** — each player's body starts at a
different level because the swells are staggered. Hence calculated per player,
not dialled. In notation this is a hairpin per part, each landing on a slightly
different dynamic; the composer is content to fudge that.

**This already exists** as 2z's `attack` / `decay` blocks plus
`attack.entry: 'together'`. **What failed on day 12 was the preset NUMBERS, not
the mechanism** — and they were auditioned through two bugs since fixed. So the
work here is the D31 bespoke loop (set two numbers by ear), not a build.

### Performance attacks within the attack window (composer, 2026-08-17)

> *"I want to add as an option for the attack part adding some different types of
> performance attacks. So the players can also play a cuivre or a fortepiano,
> etcetera. But it's all part of the same attack timing."*

- Mechanism exists — 2z's `attack.transient` (hit THEN tone) and `attack.noise`
  (simultaneous, on spare players).
- **The composer's proposed sample hack is probably unnecessary.** They imagined
  needing an auxiliary track to fake one player doing attack-then-sustain. But
  **technique = MIDI channel** (2r), so one player's fortepiano and ordinario
  already land on two channels of the same UVI instance and sound cleanly
  together. It is a **timing choice, not a routing problem**: start the ord note
  under or after the fp one-shot's decay (fp is a fixed 1.35–2.22 s one-shot,
  D9).
- **⚠ FLAG THE IMPLEMENTER WILL HIT:** the playability checker will read the
  overlapping fp and ord on one player as a **HARD conflict** — and it is a
  **false positive**. A real player performing attack-into-sustain is one
  continuous action, not two simultaneous notes. Without an exemption for
  attack-transient pairs on the same player, every shaped attack will light up
  the badge and the checker will start crying wolf, which is worse than not
  having it. *This is the mirror of 2r's usual trap: normally the mock-up hides
  real conflicts; here the checker invents one.*

### Deferred to notation time — and NOT unique to this problem

Because the pitch and loudness cycles are **not coordinated with the breaths**,
every note in the piece starts at some arbitrary point on both curves — *"start
this note at C♯ plus 75 cents."* The composer will need a blunt or graphic way to
notate that **throughout the cycle**, so it is a general notation problem, not an
attack problem, and is not to be solved here.

---

## FR-5 — Choose the pitch set and the number of pairs from the panel

**Status:** `raised, not yet confirmed` · **Raised:** 2026-08-17

- The source is just a list of MIDI numbers; changing it is trivial, but today it
  means the AI editing the store rather than the composer choosing in the panel.
- **Constraint: pitches must stay in PAIRS.** BLOOM's mechanism is duplicated
  notes splitting apart; breaking the pairing breaks the model. Thinning must
  remove **whole pairs** — the existing dropout machinery already does this.
- **Minimum one pair (2 players); room for five pairs (10).** Currently four
  pairs, F2 · A♯2 · D♯3 · G♯3.
- *Musical note recorded at the time:* register changes the character, not just
  the pitch — the same 50 ¢ gap **beats twice as fast an octave up** (D28). And
  at one or two pairs the beat rates read as **individual pulses** rather than
  blending into a field.

---

## FR-6 — THE RELEASE: one last unanimous diminuendo, then let them finish ★ PINNED

**Status:** `spec'd, PINNED by the composer 2026-08-17` · **Depends on FR-3**

### Why a release is needed at all — the finding that produced this

The composer noticed the panel's current ending *"sounds like a natural
release"* and asked why. **There is no release mechanism.** What they are
hearing is the loudness arch closing.

**The mechanism, precisely:** the arch is slaved to the gliss's progress, and
progress ends at 1 for every voice. So at the end **every voice is necessarily
past its peak and descending** — but at very different points along the descent
(measured on BLOOM's settings: the earliest voice reaches its trough and ends
near-silent, ~0.8 of 10; the latest is only about two-thirds down and is cut at
roughly mid-volume, ~5.0 of 10). Nothing waits; the span ends and everyone is
truncated where they stand.

**So what makes it read as a release is not the levels — it is the UNANIMITY OF
DIRECTION.** Everyone descending at once reads as an ensemble breathing out,
even though several are cut off partway.

**And cycling destroys exactly that.** Free-running cycles put voices at random
phases, so some are crescendoing while others diminuendo. The natural release
the composer likes is **an accident of the one-way form** and does not survive
FR-3.

### THE PINNED SPEC

At the end of the gesture:

1. **Cycling stops.**
2. **Every voice runs down to its trough** — one last diminuendo, unanimous,
   restoring the property that makes the current ending work.
3. **Players finish their current breath** rather than being cut. Breaths run
   5.6–10.4 s, so the ensemble also **thins out by subtraction** over that
   window.

The two combine: a unanimous descent *and* a thinning texture.

### What this avoids

- **The hard simultaneous chop** — everyone stopping at once at whatever volume
  they were at. Sounds like an edit, not an ending.
- **Runt notes** — a player starting a note just before the cut and getting a
  fraction of a second of sound. An artifact, and awkward to play.
- **An uncontrolled exposed ending** — with a plain "let them finish" and no
  fade, drop-out order is random, so the last player standing could be
  mid-crescendo and the piece would end on a lone rising tone that just stops.

### Vocabulary note worth carrying

A tone that rises and then stops is the **surge** — the crescendo-cut named in
the Roads catalog work (PLAN 4e), and the piece's core envelope species. A plain
"let them finish" ending is therefore *a scattering of surges*. That is a
coherent gesture in its own right and may be worth keeping as an ALTERNATIVE
release — but it is **not** what is pinned here.

### Open details, NOT decided (flagged, not asked)

- **Does the pitch cycle also stop, or keep sweeping through the run-down?**
  Loudness stopping is what is pinned; pitch is unspecified. Parking the pitch
  would freeze the beating rate during the fade; letting it run keeps the
  beating alive as it dies away. *Probably wants the composer's ear, later.*
- **How long the run-down takes** — the natural value is half a loudness cycle,
  which falls out for free. Whether it should be independently settable is
  unknown.

### Gates

- [ ] At the release, **every voice is descending** — verified by measurement,
      not by ear.
- [ ] No note is truncated; every player finishes their breath.
- [ ] No runt notes at the tail.
- [ ] **Heard by the composer** against the current panel ending, which is the
      reference this is trying to reproduce.

---

## FR-7 — Carry per-note FLAGS into placed score objects

**Status:** `spec'd, deferred to the notation pass by the composer` · **Area:**
morph engine (`toScoreObjects`) + ACTUALs place path · **Raised:** 2026-08-17

### What the composer asked

Not a feature request in their words — it surfaced from the **notation data
walk** they asked for (day 14). Presented as options (a) do nothing now /
(b) build it now / (c) both in sequence; **the composer chose (c):** place from
the ACTUALs tab now, build this when the notation pass actually starts. Nothing
reads flags today, so building it now would be speculative.

### The gap

`Morph.toScoreObjects` drops each note's `flags` array. The placed
score therefore shows three visually identical joins that mean different things
in notation:

| flag | meaning | notation consequence |
|---|---|---|
| `BREATH` | engine split the segment — player is out of air (register/dynamic BREATH_TABLE) | a real breath mark |
| *(none)* | carrier segmentation (`segLen` ± `segVar`) | rearticulation, no breath |
| `SEAM` | two DIFFERENT voices attack within `CROSS_ONSET_MIN` 0.08 s | conductor's score only — nothing in the part |

**Measured 2026-08-17:** the three are indistinguishable by timing — gap means
0.744 / 0.751 / 0.746 s (n = 86 / 6 / 6). So they cannot be re-derived from the
placed score; the flag is the only carrier of the distinction.

**Why it is not urgent.** The flags are frozen in the ACTUAL, and the join back
is verified: placed group ids are slugged from the entity
(`ACT-BLOOM-02` → `grp-act-bloom-02-01`), and `notes[i] ↔ objects[i]` matched
**106/106** on ACT-BLOOM-02 (also joinable by `(voice, tStart − offset)`).
Whole-group drags and scales preserve the join.

**The one case that breaks it — the trigger to build this:** hand-editing
INDIVIDUAL notes inside a placed morph (add / delete / re-time), which can break
both the index join and the time join. If the composer starts doing that, FR-7
moves up immediately.

**Proposed build.** `toScoreObjects` copies `flags` into the object's
`properties.flags` (an existing empty field, so no schema change); the ACTUALs
place path carries it verbatim as it already does everything else. Renderers
ignore unknown properties, so nothing else changes.

**Gates**

- [ ] A placed group's objects carry the same flags as the source ACTUAL's notes,
      1:1, verified by comparison rather than inspection.
- [ ] Byte-identity of existing renders preserved (fixtures never regenerated).
- [ ] `model_bank.js --validate` still VALID. **Checked 2026-08-17 rather than
      assumed: this is SAFE.** INTEGRITY 1 compares a whitelist —
      `{layer, startSeconds, endSeconds, sonifyNote, technique, morphBend, nodes}`
      — so `properties` is invisible to it, and stored actuals will not go stale
      when `toScoreObjects` starts emitting a new property. INTEGRITY 2 compares
      `notes`, which this does not touch. *(Re-run it anyway; the point of the
      gate is evidence, not the prediction.)*

---

## FR-8 — DOUBLE PARTS IN MORPHS so all ten players have something to play

**Status:** `raised, needs the composer to choose between three readings` ·
**Area:** morph engine + model store · **Raised:** 2026-08-17 (day 14) ·
**Interacts with FR-5** (number of pairs) and `docs/plans/MORPH_SECTION.md`

### What the composer asked

> *"find a way to double parts in morphs so that everyone has something to
> play."*

Said as part of the final-section dictation; full context in COMPOSER_LOG day 14.

### Research already done — MEASURED 2026-08-17

**The measured situation.** All six models specify **8 pitches → 8 voices**, and
`ACT-BLOOM-02` renders **8 parts of the available 10** — so **two players sit
silent through a 113.9 s morph.** (`maxVoices` is already 10; the cap is not the
limit — the source pitch list is.)

**The thing to understand before designing this: the eight are already four
DOUBLED pitches.** BLOOM's source is `[41,41,46,46,51,51,56,56]` — four pitches,
each taken by two players, who then detune against each other. **That IS the
beating mechanism** (D28), and `MORPH_SECTION.md` §"ten players" makes it
structural: borrowing must take **whole pairs**, because half a pair is *"a lone
detuned tone with nothing to beat against"*, and **each borrow silences one
beating rate**. So "doubling" in this engine already means something specific,
and the request has to be read against it.

**Three readings, materially different — the composer's call:**

- **(a) A FIFTH PAIR** — add a pitch, 10 bed players, every player busy. Cheapest
  mechanically, but it **changes the harmony**, and per MORPH_SECTION's table it
  leaves **0 free for impacts**, so the morph section could carry no impact
  without borrowing. FR-5 (choose the number of pairs) is the same dial.
- **(b) TRUE DOUBLING — two players on ONE voice line**, same pitch centre and
  trajectory, **staggered breathing.** This does not change the harmony or the
  beating design at all. Its real prize is elsewhere: every voice currently
  breathes in audible **0.64–0.86 s gaps** (measured on ACT-BLOOM-02), and a
  staggered double makes the line **continuous** — one player sustains while the
  other breathes. *This is the reading that most literally gives everyone
  something to play without spending the harmony.*
- **(c) DOUBLE AT THE OCTAVE / IN THE PARTIAL SERIES** — a colour and register
  change, not a fix for idle players; listed so it is not confused with (b).

**A property of (b) worth naming, because it interacts with the section plan:**
a doubled bed is **robust to borrowing** — an impact can take one player off a
doubled voice and the voice survives (thinner, still beating), where today the
same borrow kills a whole rate. If both (b) and the impact section happen, they
are not independent decisions.

**Unknown, not to be guessed:** whether two MIDI players on an identical line
are audibly different from one louder player in the SAMPLER (real players never
are — they beat and blend). If (b) is chosen, the render must decide whether the
double is exactly identical (probably wrong) or minutely varied. **That question
belongs to the ear, not to me.**

### Gates

- [ ] Composer picks (a) / (b) / (c) — they are not variants of one build.
- [ ] Every one of the ten players is used, verified by counting rendered voices.
- [ ] If (b): the doubled voice's breaths are staggered so the line never gaps —
      verified by measuring gaps per PITCH, not per player.
- [ ] Beating rates unchanged from the blessed render, unless the choice is (a).

---

## FR-9 — DRIVE THE PHASE-SHIFTING MACHINE AT A GIVEN TEMPO

**Status:** `raised — and largely already built; needs an interface decision` ·
**Area:** texture engine (`score/public/texture_engine.js`) + panel ·
**Raised:** 2026-08-17 (day 14) · **Serves:** the pulsed final section

### What the composer asked

> *"I have to figure out how to use the phase shifting machine to develop these
> sections at the given tempo."*

For the Ghost-Trance-like final section (PLANNER day 14): a continuous pulse
with multi-tempo bursts and phase-shifting sections cross-cut into it.

### Research already done — read from the source, NOT run

**Finding: the engine already does this, and the interface is the gap.**
`texture_engine.js` carries, today:
- **`rate(t)` in attacks/s, integrated by phase**, with the explicit note that
  *"a ramping tempo is exact rather than stepwise"* — so a given tempo is
  `bpm / 60`, and an accelerating pulse is already exact rather than quantised.
- **`phase0` per voice, 0..1, as a fraction of that voice's own attack period** —
  which is precisely "phase shifting at a tempo".
- **a strict grid SWEEP mode** with displacement expressed **in beats**.
- a warning already recorded in the source against solving for a `bpmEnd` to
  reach a scattered target, *"a tempo detour that worked but coupled scatter to
  tempo"* — i.e. the trap on this exact path is already documented.

**So the work is probably not new machinery** but: name the tempo as the input
(bpm, not attacks/s), decide how the multi-tempo cross-cuts are expressed, and
confirm against D27 — **articulation decides whether phase is a device at all**;
this section is pulsed and articulated, which is the family where phase reads as
rhythm (smear · ticks · rain · gallop · groove). **A sustained pulse would not
work**, and that is settled, not open.

**Stated as a confidence claim, per AI_METHODOLOGY:** this is read from the
source, **not run**. The engine has the parameters; whether they compose into
the composer's cross-cut form is unverified.

### Gates

- [ ] A tempo in bpm produces a pulse at that tempo, verified by measuring onsets.
- [ ] Two tempi can run at once (the cross-cut requires it) — or the reason they
      cannot is recorded.
- [ ] Phase-shift sections derive from the same tempo rather than a second clock.
