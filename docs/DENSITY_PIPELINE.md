# DENSITY PIPELINE — played take → playable ten-part orchestration

> How a density buildup gets from "hands on the keyboard" to ten parts a real
> ensemble can play. Written 2026-08-16 during **DB3**; the worked example at the
> bottom is that session's actual numbers.
>
> Read this before recording the next density build. It is the reusable version
> of a process that was previously re-derived each time.

---

## The problem in one paragraph

A density buildup played by one person at one keyboard demands far more than ten
tubas can articulate. The composer's own DB3 take asks for **54.5 attacks/s** at
its apex. Ten players each holding a ~0.45 s staccato one-shot top out at about
**22 attacks/s** — and that ceiling is physics, not an estimate, because a fixed
one-shot rings for its full sample length whether or not you want it to (**D9,
ORD is the only real duration**).

The mock-up cannot reveal this. Technique = MIDI channel, so two overlapping
notes on one player hit two UVI channels and both sound cleanly (**PLAN 2r**).
You cannot audition your way out of it; it has to be computed.

---

## The stages

### 0. Record the take

In the composer score, one lane, one technique. See `docs/PROJECT_JOURNAL.md`
§2 and the Rec controls right of the `META` button (target part · capture
technique · `⏺ Rec`, which arms *and* rolls the transport).

- **Start a side score first**: `Clear All` prompts for a new save name, and the
  session switches to it. Any name without a `piece-` prefix lands in the
  `-- Scores --` menu. Never record into a piece working copy.
- The take is **one stream**. Player assignment happens later, on purpose — the
  cluster material never assigns players either (PLAN 2r).
- Notes land at the scrolling playhead with driver timestamps, no quantize,
  velocity stored as `recVel`, `sonifyMode:'plain'`.

### 1. Read the density

```bash
node tools/pack_take.js scores/<take>.json
```

The report leads with the ceiling arithmetic and a played-vs-packed rate profile
per 2 s. Run it before deciding anything — it tells you *where* the take exceeds
what ten players can do, which is usually a much smaller region than it feels
like while playing.

### 2. Pack to the ceiling

Same command. For each note, in time order:

1. **A player free right now?** → place it where it was played.
2. **No?** → **nudge** later to the earliest opening, within `--budget`.
3. **Budget exceeded?** → accept a tight-but-legal spot (soft).
4. **Nothing fits?** → **delete**.

Deletion is the last resort by construction, so density automatically rides the
ceiling and never exceeds it. **No thinning amount has to be guessed**, and there
is no iterate-and-check loop — one convergent pass.

**Knobs:**

| flag | default | what it costs you |
|---|---|---|
| `--budget` | `0.06` (60 ms) | see below — bigger is *not* better |
| `--pick` | `spread` | which note in a clump dies |
| `--seed` | `20260816` | only used by `--pick random` |
| `--out` | `scores/<name>-packed.json` | |
| `--compare` | off | also write an A/B/C score (below) |
| `--gap` | `3` | seconds between A/B/C sections |

Output is a **ten-part score you can load and hear immediately** from the
`-- Scores --` menu. The source take is never modified.

**Patch range is checked and reported, never silently passed.** A note outside a
technique's range (staccato is 30–65) simply does not sound, and nothing else in
the chain would tell you. DB3's take had 3 such notes (66, 67); they happened to
be among the deleted, so the packed score is clean — by luck, which is exactly
why the check now exists.

#### `--compare` — hearing what the thinning cost

Writes `scores/<name>-AB.json`, one score holding three versions back to back so
the cost is an ear judgement instead of a number:

| | | |
|---|---|---|
| **A** | as played, one part | what your hands did |
| **B** | every note distributed over ten parts, **unpacked** | complete, but unplayable — the "before" |
| **C** | packed | the "after" |

B is the one that matters: it is the full gesture with nothing removed, spread
across the ensemble. A/B tells you what ten players sound like; **B/C tells you
what the deleted notes were contributing.**

Expect the conflict badge to be loud on this score — sections A and B are
supposed to be full of conflicts. On DB3: A 238 hard, B 151 hard, **C zero**
(the app's own engine, partitioned by section).

#### Why the budget is small

Nudging is **not** how density is retained. At true saturation, shifting a note
later just walks it into the next collision — the composer predicted this, and
the measurement agrees: raising the budget from 60 ms to 400 ms buys **8 notes**.

What the small budget *does* buy is **cleanliness**:

| budget | kept | nudged | deleted | soft |
|---|---|---|---|---|
| 0 ms | 160 | 0 | 91 | **37** |
| **60 ms** | **160** | 51 | 91 | **0** |
| 150 ms | 164 | 65 | 87 | 0 |
| 400 ms | 168 | 71 | 83 | 0 |

51 notes move by an average of 35 ms — inaudible as displacement at this density
— and every soft flag disappears. That is the whole soft problem solved before
any resolution step.

#### Which note dies — `--pick spread`

Within a simultaneity clump (0.05 s window), survival is ordered:

1. **top**, 2. **bottom**, 3. then whichever remaining note is **farthest from
everything already kept** (max-min pitch spacing).

One rule, two properties: the extremes go first so the band keeps its registral
**width** when its thickness has to drop — which is what you actually hear in a
cluster mass — and the max-min fill then stops the middle **hollowing out** over
many consecutive clumps.

`--pick random` (seeded, for variants) and `--pick arrival` (raw MIDI order) are
built in but unused so far.

> **Why clumps are treated as accidents, not chords.** The composer's own
> account: *"in the densest areas, I'm just hitting all my hands on all the
> keys… some of those attacks are mistaken chords rather than just a flurry of
> attacks."* So spreading a clump across the next few tens of milliseconds
> *recovers* the flurry that was intended. The packer does this without needing
> to know whether any given clump was meant as a chord.

### 3. Assign the players

This happens **at insert**, in the app — `Composer.assignCluster` in
`score/public/composer.html`. It is the single authority for player assignment;
`pack_take.js` mirrors it (same constants, same tie-breaks) so the two agree.

**Leap-aware since 2026-08-16.** The lane score is
`tier ×1e6 + LRU ×1000 + leap ×120 + laneIndex`. The leap term competes with
least-recently-used and **can never outrank the tier**, so a wide-open player
still beats a close-pitched busy one — it only ever chooses *between equally
legal lanes*.

Why it exists: the tie-break used to be pitch-blind, so one player could be
handed a 26-semitone jump in 0.35 s while another sat in the same register, and
every part sprawled across the whole range with no tessitura. Measured on DB3's
take (251 notes):

| | before | after |
|---|---|---|
| mean leap between consecutive notes on one player | 7.9 st | **3.1 st** |
| leaps of an octave or more | 58 | **11** |
| mean pitch span per part | 29 st | **23 st** |
| hard conflicts | 154 | **135** |

Hard conflicts *drop* because pitch-clustered lanes pack better. This is also the
only real fix for a soft **rate** flag — nudging in time cannot help, because the
line is still as fast; the jump has to move **between** players instead of being
asked of one (PLAN 2r, "move to another player").

### 4. Assess part by part

```bash
node tools/audit_playability.js --parts <score-substring>
```

Per part: note count · tessitura · mean leap · max leap with its timestamp ·
tightest attack pair · rate · hard/soft counts, then every flag listed with its
pitches, its actual attack interval and the interval it needed.

This is the report that answers *who* is being asked for too much and *why* —
the question you have to answer before choosing between moving a note to another
player and deleting it. Leap columns are here because the soft rule is
leap-dependent: a fast re-attack a semitone away is easy and the same rate across
two octaves is not, so a part with a large mean leap carries a burden the raw
conflict count does not show.

The corpus-wide audit (no `--parts`) still answers the other question, "is any
saved score unplayable".

### 4b. Articulation — the fortepiano crossfade

```bash
node tools/artic_pass.js scores/<name>-packed.json --fp-until 12 --stac-from 18
```

The shape, in the composer's words: *"the densest area staccato, and then just
before that a crossfade area where the fortepianos were becoming less frequent
and turning into mostly staccatos, and then before that it was just
fortepianos."*

- before `--fp-until`: **all fortepiano** · in the zone: P(staccato) ramps 0→1
  linearly · after `--stac-from`: **all staccato**
- defaults are 55 % and 78 % of the take's span if you do not pass them

**What changed since `tools/transform_fp.js` (2026-08-13).** That tool scaled
fortepiano durations ×3 (≥×2 when squeezed) and used a 25–30 s zone. **The ×3 is
now wrong**: D9 (measured 2026-08-15) established fortepiano as a **fixed
one-shot, 1.35–2.22 s**, which ends itself and never scales. So conversion does
not stretch a note — it replaces a 0.45 s staccato with a note 3–5× longer.

That means the crossfade cannot be purely probabilistic; a coin-flip saying
"fortepiano" mid-build would double-book the player. **The roll proposes, physics
disposes:** room on this player? → else a player with room (leap-aware)? → else
it stays staccato, and the denial is reported. Zero new conflicts by
construction, and the crossfade **emerges from density** as well as being biased
by the ramp — the same principle as `make_playable.js`'s surge/staccato threshold.

On DB3 this mattered more than the ramp did: 15 of 36 fortepiano rolls were
denied, **all between 11.4 s and 16.0 s**. The tool drew the crossfade where the
music already had one.

### 4c. Grains by hand — staccato → long tone

**Three keys do this work. The panel is on demand, not on selection** (composer's
own call, 2026-08-13 — it used to pop up while placing and dragging).

| key | what it does | scope |
|---|---|---|
| **G** | selected notes → **surge crescendos**, peak-anchored | whole selection |
| **C** | selected notes → **cuivre**, via the pitch palette | whole selection |
| **P** | open the property panel for the selected note | one note |

**G is the primary path.** The played onset becomes the **apex**, and the swell
back-fills as far as that player's lane allows (capped at 2.5 s). So the same
keystroke gives long swells where the texture is sparse and short ones at the
apex — density shapes the result, no dial. Notes turn green (`#2E7D32`), become
`ord` + `envShape: surge`, drop `sonifyMode: 'plain'`, and one CTRL+Z undoes the
whole batch.

*If a note has no room to swell backwards, the swell happens inside its own
footprint instead* — same start, same end, peak at the release. The status bar
says how many were treated that way. (Before 2026-08-16 a 0.15 s minimum beat the
availability check and forced an overlap, always at the apex, which is exactly
where these conversions get made. Converting all 160 notes of a packed build now
adds zero conflicts.)

**P** is for fine work on one note: `Technique`, `Grain env` (all eight Roads
shapes), start/end, colour, track. Applying a **Grain env** here also converts the
note to ORD and drops `plain` — an envelope is a statement that the note has a
shape, and only ORD can carry one, since fp/staccato/cuivre are fixed one-shots
that end themselves (D9) and `plain` pins the level flat. Without the conversion
the score would draw a crescendo over a note that still goes *tuk*. The swap is
"as-if-generated": peak time and level carry over, so the moment stays put and the
shape changes around it. The note is then **variable-length** — drag the right
edge for a real long tone, drag the body to move it.

### 5. Per-part surgery

Whatever survives step 4. Global packing is blunt but musical — it respects the
clump/line structure. Per-part is surgical and only makes sense once you can see
who is actually overloaded. **Global to get near, per-part to finish.**

In the app, the resolver (`⚠` badge, top right) offers per conflict: `→ T7` move
to the named best free player · drop either side · nudge · auto.

---

## The tools

| tool | what it does |
|---|---|
| `tools/pack_take.js` | pack a played take to the ceiling; writes a ten-part score |
| `tools/artic_pass.js` | fortepiano → staccato crossfade over a packed score |
| `tools/build_versions.js` | lay several versions end to end in one save file |
| `tools/extract_section.js` | pull one section (esp. the composer's edited one) back out of a version-arc score |
| `tools/tonality_variants.js` | the same gesture in N harmonies, end to end, labelled |
| `tools/audit_playability.js --parts <name>` | part-by-part playability profile |
| `tools/audit_playability.js` | corpus audit over all `scores/*.json` |
| `score/public/composer.html` → `assignCluster` | the assignment authority (leap-aware) |

**Rule constants live in two places and must stay identical:** `Composer.CONFLICT`
in `composer.html` (the authority) and the constants at the top of both tools.
They are kept in sync by hand and cross-checked against the running app — see
the verification note below. Constants come from **D17**: `tongueReset 0.03` ·
`minAttack 0.11` · `perSemitone 0.0093` · `maxLeapAdd 0.22`, all derived from
2j's tremolo table, which is itself an attack rate.

---

## 6. Getting the finished build INTO the piece

> Read this before reaching for the Insertion strip. **The strip cannot carry a
> density build, and the reason is not obvious.**

### Why not the Insertion strip

The strip has two sources and neither fits:

| source | stored as | insert does |
|---|---|---|
| **Blasts** | `bank/blast_taxonomy.json` — pitch set + per-note articulation | `assignBlast`: every note its own player |
| **Clusters** | `bank/cluster_bank.json` — `{t, p, v, d, tech}` event streams | `assignCluster`: distributes across players |

A finished density build is **already orchestrated** — it has lanes, per-note
articulations, and hand-shaped grain envelopes. The cluster event format has **no
field for `layer`, `envShape`, `nodes` or `segments`**, so a round trip through it
silently flattens every surge back into a block. Lane re-derivation would be fine
(arguably right — it should route around whatever is already in the piece); losing
the composer's envelope work is not.

### The way in: a placement script

This is how DB1 and DB2 got in, and it is still correct. GESTURE-2 lives as a full
object array in `bank/GESTURE-2.json` and was placed by `tools/piece_s08.js` —
copy that file's shape.

**Why a script rather than UI:** you insert a density build *once*. Per the
sandbox design principle (PLANNER, 2026-08-14) UI is for loops you hammer;
one-offs are prompts. If several builds ever need placing and re-placing, that is
when a third strip source ("Gestures", carrying whole orchestrated objects) earns
its build — not before.

**The artefacts, in order** (DB3 as the example):

| file | what it is |
|---|---|
| `scores/densBld03-take1.json` | the raw played take, one part |
| `scores/densBld03-take1-unpacked.json` | all notes over ten, unpacked — reference only |
| `scores/densBld03-take1-packed.json` | thinned to the ceiling, 0 conflicts |
| `scores/densBld03-take1-fp.json` | + the articulation arc |
| `scores/densBld03-arc-v2.json` | all five stages end to end, for listening |
| `scores/densBld03-arc-v2b.json` | **the composer's edited copy** — same five stages, section E hand-grained |
| `scores/densBld03-take1-surge.json` | section E extracted standalone — **the live insert source** |
| `scores/densBld03-tonalities.json` | nine harmonies off the *fp* version (superseded) |
| `scores/densBld03-tonalities-surge.json` | nine harmonies off the *surge* version — the one to choose from |

> **The composer's edited section is the live version, not the tool output that
> seeded it.** `build_versions.js` writes several stages into one file, tagging
> each note with its section in `performanceNotes`; the composer then edits one
> of them by hand (grain envelopes, `G`). Everything downstream must run on
> *that* section, so pull it back out first:
>
> ```bash
> node tools/extract_section.js scores/densBld03-arc-v2b.json --section E --out scores/densBld03-take1-surge.json
> ```
>
> It copies notes wholesale (`envShape`, `nodes`, `segments`, technique,
> `sonifyNote`, `recVel`, colour) and rebases to t=0. Verify the env count in its
> report before using the result — that number is the whole point of the step.
> *(DB3, 2026-08-16: section E = the fp version + 5 surge conversions and nothing
> else; the diff is worth running, because a hand-edited section can also contain
> moves and deletions.)*

**What the script must do:**

1. Read the piece (`scores/piece-sNN.json`) and the build's `-fp.json`.
2. Offset every note by `AT - t0` where `AT` is the placement time.
3. **Copy the note objects wholesale** — `layer`, `technique`, `sonifyNote`,
   `recVel`, `sonifyMode`, `color`, and any `envShape` / `nodes` / `segments`.
   Only `id`, `groupId`, `startSeconds`, `endSeconds` are rewritten.
4. Give the whole build one `groupId` (e.g. `grp-db3-01`) so it moves as a unit
   under the D9 group-scaling rules, and add its **META shape** on layer 10 with
   the same `groupId` — see `insertClusterAtCursor` in `composer.html` for the
   shape object, or copy an existing `grp-*` META curve from the piece.
5. Write `piece-sNN+1.json`, then **check it**:
   `node tools/audit_playability.js piece-sNN+1` and
   `node tools/audit_playability.js --parts piece-sNN+1`.

**What will bite:** fixed-articulation notes must keep their true sample lengths
(D9) — never rescale them to fit a target duration; only `ord` stretches. And the
build arrives conflict-free *in isolation*, so the only new conflicts can come
from what it lands on top of. The live wash catches those the moment the file is
loaded.

---

## How hard is the packed result to play?

**On DB3's packed version, the demand per player is low.** Peak 2.0–2.5
attacks/s; the tightest consecutive attack pair anywhere in the score is
**0.43 s** (2.3 attacks/s); median gap 0.61 s.

That is **2–4× more relaxed than the model's own estimated limit** (D17's
`minAttack` 0.11 s = 9.1 attacks/s at a half step). The margin matters more than
the number: the soft thresholds are estimates pending a player's ear, but we are
so far clear of them that the estimate would have to be wrong by more than 2×
before anything here became marginal.

**The remaining question is leaps, not speed.** DB3's packed version has 21 leaps
of an octave or more, 15 of them inside 0.6 s — widest 29 semitones in 0.80 s
(T10) and 27 semitones in 0.49 s (T8). The conflict model prices a leap only as
*added time needed* (`0.0093 s/semitone`, capped at 0.22 s); it does **not** model
whether a two-octave staccato jump is reliably *accurate*. That is a modelling
gap, not a bug, and it is the one thing here worth putting to an actual player.

### The ceiling is the SAMPLE, not the player — and by how much

Worth understanding before trusting any thinning amount. The 0.33–0.53 s figure
comes from `docs/SI2_staccato_lengths.md`, whose column is literally **"Sounded
(s)"** — how long the sample rang, decay and room included. A player who has
tongued a staccato has stopped blowing; they are free to attack again as fast as
they can tongue. **D17 already made exactly this correction for SOFT** ("a fixed
one-shot's length includes decay the player is not articulating through"), but
HARD still treats the full sample length as occupancy.

So the pipeline is **conservative by construction**. If a fixed one-shot occupied
the player only attack-to-attack, DB3's take would score:

| assumed tonguing floor | = attacks/s | HARD |
|---|---|---|
| 0.11 s (D17's own optimistic figure) | 9.1 | 44 |
| 0.13 s | 7.7 | 66 |
| 0.15 s | 6.7 | 84 |
| 0.22 s | 4.5 | 124 |
| **current model (sample occupancy)** | ~2.2 | **154** |

**The conclusion survives either way — the apex genuinely exceeds ten players
even at the most permissive floor.** What changes is how much gets deleted:
somewhere between roughly 30 and 91 notes rather than definitely 91. Do not
present the packed density as "the maximum a real ensemble can play"; it is the
maximum *this mock-up* can render truthfully.

---

## What is still the composer's decision

The pipeline is deliberately silent on these — it can only tell you what they cost.

- **The apex treatment.** Getting to zero hard conflicts costs notes, all of them
  at the apex (DB3: 91 of 251, entirely between 20.0 s and 23.1 s). The
  alternatives to thinning are **more players** (mandate M1 — 45 attacks/s needs
  ~20 tubas, and the Penn State ensemble is 12–20) or **changing what the apex is
  made of** — converting staccato jabs to sustained/overlapping material, so that
  overlap stops being a conflict and becomes the point. The build's own logic
  arguably wants the second one.
- **Whether the packed version is musically the same gesture.** Only listening
  answers that.

---

## Worked example — DB3, 2026-08-16

**Source:** `scores/densBld03-take1.json` — 251 notes, 21.9 s, all staccato, one
lane, pitches G1–G4. Exponential build: 1.5/s at the start, 7.5/s at 15 s,
14.5/s at 17 s, **54.5/s at the apex**.

The apex is far more chord-like than it sounds: in 20–24 s, **108 notes fall in
only 25 attack moments** (clump sizes up to 9).

**Command:**

```bash
node tools/pack_take.js scores/densBld03-take1.json
```

**Result** → `scores/densBld03-take1-packed.json`

- **160 of 251 notes kept (64 %)** · 51 nudged (mean 35 ms, max 60 ms) · 91
  deleted, all between 20.0 s and 23.1 s
- **HARD 0 · soft 0**, re-derived from the written lanes and then confirmed
  independently in the running app (conflict badge `⚠ 0`)
- Everything before 18 s is **bit-identical in rate** to what was played
- The apex now **plateaus at the ceiling** (20.0/s then 18.5/s) instead of
  spiking to 54.5/s
- Parts evenly loaded: 15–17 notes each; mean leap 4.2–10.4 st per part

For comparison, the approach this replaced — prune clumps to 3, then require a
0.16 s gap between attack moments — kept only **127 notes** and still left 1 hard
and 1 soft. Pack-to-ceiling is strictly better: 33 more notes and cleaner.

---

## Verification note

Every number in this document was produced by running the tools, and the
assignment claim was checked **in the running app**, not by reading code
(`AI_METHODOLOGY.md` rule 4).

The cross-check: the app's own `Composer.assignCluster` was run on the DB3 take
in the browser and returned **hard 135 · soft 10 · mean leap 3.13 st · 11
octave-plus leaps · mean part span 22.9 st**, against the tool's simulation of
**135 · 10 · 3.1 · 11 · 23**. Exact agreement. Then
`densBld03-take1-packed.json` was loaded in the app and its conflict badge read
`⚠ 0` with all 160 notes present across ten parts.

**Residual risk:** the constants are duplicated in three files. If
`Composer.CONFLICT` is ever edited without editing the two tools, the tools will
silently disagree with the app. The symptom would be conflict marks appearing at
insert that the tool said were clear — visible immediately, not silent.
