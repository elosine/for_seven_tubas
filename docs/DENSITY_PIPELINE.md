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

Output is a **ten-part score you can load and hear immediately** from the
`-- Scores --` menu. The source take is never modified.

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
