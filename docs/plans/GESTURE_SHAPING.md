# GESTURE SHAPING (PLAN 2z) — implementation plan

> **Status: DRAFT 2026-08-16, awaiting composer review.** Written to be
> implemented cold by a separate session. Read `docs/AI_METHODOLOGY.md` first —
> it governs everything here — then `docs/RUNNING_LOG.md` COLD START (the six
> traps) and this file.
>
> **Plan ID note:** this item was listed as `2x` in PLAN.md, colliding with the
> texture sandbox (two concurrent day-10 sessions both appended `2x`). It is now
> **2z**; the texture sandbox keeps 2x.
>
> Sibling plan: `docs/plans/MODEL_AND_ACTUAL_PLAN.md` (PLAN 2y). **Boundary:**
> this plan adds the *capability and dials* (a gesture-level envelope); 2y
> packages dials into named recipes and stores results. Recommended build order:
> **2z first, then 2y** — so the stock models get seeded once, with shape dials
> already in existence. (2y's storage phases do not strictly depend on this
> plan; the order is convenience, not dependency.)
>
> **Do NOT run 2z and 2y as two concurrent agents.** Both touch `morph.js`,
> `morph_panel.js`, `bank/morph_params.json` and `tools/test_morph.js`. The
> day-10 two-agent split worked because the file sets were disjoint; these are
> not. Sequence them.

---

## 1 · What this is (composer's words, 2026-08-16)

> *"The electronic music model makes a lot of sense… the META SHAPE IS REALLY
> THE SOUND ITSELF. These morphs might have some sort of attack that can be
> designed and built into the gesture, and then some internal change over time,
> and some kind of release. In other words, we can craft a gesture on its own
> terms and then just fill in the tuba parts to make that gesture. For example,
> in C and D there's a striated entry — I'm imagining being able to have an
> ATTACK instead, and add some cuivre, and then that proceeds into the morph,
> and then maybe decide some sort of release."*

And from the planning conversation (2026-08-16): treat the overall sound as its
own object and mold it like electronic music — a designed **attack** (ramp, or
whatever), the **morphing body** (what 2v already does, with the recipes), a
crafted **release** — *"each part of the envelope being quite dynamic."*

**This inverts the current order.** Today the carrier derives entry and exit
from breath logic alone and the overall shape is emergent. The proposal: shape
first, parts second — the same relation the META layer already has to the
density builds. The current striated entry (the Grisey-like entry of partials
the composer heard in C and D) stays available as one attack mode among
several; it stops being the only possibility.

**Not in scope:** new morph models, new pitch machinery, the recipe/one-dial
layer (2y), performance notation for releases (P3 — the release *vocabulary
naming session* with the composer stays queued there; this plan builds the
minimal mechanical set it will name).

---

## 2 · Where it attaches (verified against the code, 2026-08-16)

All in `score/public/morph.js` — the engine stays PURE (no DOM/MIDI/fetch), all
behaviour testable in node via `tools/test_morph.js` (101 assertions currently;
run before and after every change).

| seam | today | with shape |
|---|---|---|
| **entry** | `buildCarrier`: first entry at `t = striationPhase(...) * segLen * 0.5` | entries distributed across `[0, attack.len]` per `attack.entry` mode; the legacy formula IS the default (see §4.2) |
| **exit** | voices run to `span`; last segment truncated by `span - start` | per-voice end times distributed across `[span − release.len, span]` per `release.exit` mode |
| **level** | `dynLevel()` (the D24 layer) → per-note breakpoints | a gesture-level gain `g(t)` multiplies `dynLevel`'s output inside `stateAt` — every model inherits it, one multiplication, no fork |
| **technique** | `stateAt` returns model/base technique | inside the attack/release windows an edge-technique override applies **in `stateAt` itself**, so `buildCarrier`'s breath/fixed-length callback and the render loop see the same answer (one code path) |
| **output** | note-relative `level` + `bend` breakpoints | unchanged — shaping is baked into the same note-relative breakpoints at render time, so drag / group-scale / save-reload safety is inherited, not re-earned |

`toScoreObjects`, `morph_emit.js`, and the insert path are untouched. The
panel's META contour is already sampled from the notes' mean level, so the
drawn META shape will automatically show the designed envelope — the shape the
composer crafts is the shape they see.

---

## 3 · Schema — the `shape` block

One new optional top-level params key. Absent `shape` ⇒ **byte-identical
output to today** (this is a hard gate, §7 G0).

```json
"shape": {
  "attack": {
    "len": 4.0,             // seconds, measured from gesture start
    "entry": "striated",    // striated | together | ramp   (§4.2)
    "curve": "linear",      // linear | expo | sudden       (gain curve, §4.1)
    "from": 0.15,           // starting gain 0..1 (1 = no dynamic attack)
    "technique": null       // e.g. "cuivre", "fortepiano" — first segment per voice (§4.3)
  },
  "release": {
    "len": 6.0,             // seconds, measured back from gesture end
    "exit": "striated",     // striated | together          (§4.2)
    "curve": "expo",        // linear | expo | sudden       ("sudden" ≈ tongue-stop cut)
    "to": 0.0,              // ending gain 0..1
    "technique": null
  }
}
```

- Either half may be omitted (attack-only, release-only).
- `attack.len + release.len` is clamped to ≤ `carrier.span` (body may be zero);
  clamping is **reported in warnings**, never silent.
- `shape` joins `KNOWN_KEYS`. **Fix in passing (G0):** `lanes` and `voices` are
  read by `normaliseParams` (morph.js `normaliseParams`, the `p.lanes` /
  `p.voices` lines) but missing from `KNOWN_KEYS`, so today they trigger a
  spurious `PARAM: unrecognised key` warning. Add both.
- v2 extension points, deliberately NOT built now: multi-stage attacks,
  per-part striation patterns, level-targeted body handoff. The schema leaves
  room (each part is its own object); do not pre-build.

---

## 4 · The three levers

### 4.1 Gesture envelope — gain `g(t)`

- `g(t)` = attack curve from `from`→1 over `[0, attack.len]`; 1 through the
  body; release curve 1→`to` over `[span − release.len, span]`. No shape ⇒
  `g ≡ 1`.
- Curves: `linear`; `expo` (perceptual, `x²`-ish — exact exponent is an
  implementation choice, test-pinned); `sudden` (holds ≈1 until the last ~10 %
  of the window, then drops — the tongue-stop / rexpodec cut of P3's
  vocabulary, and the `surge` right-edge of the Roads catalog lineage).
- Applied as `level = dynLevel(...) * g(t)` **before** the existing clamp.
  **Known floor:** the engine clamps level to ≥ 0.4 (of 10), so `to: 0` lands
  at 0.4, which the measured CC7 map renders very quiet but not silent. That is
  the same floor every hand-drawn decrescendo already has. Do not "fix" the
  clamp — state it in the panel help text instead.
- The existing per-segment re-entry "sneak in" dip composes with `g(t)` by
  multiplication; no interaction code needed.

### 4.2 Entry / exit scheduling

Entry modes (`attack.entry`), all one code path — the mode only changes the
per-voice offset:

- **`striated`** (default) — today's behaviour, scaled to the window:
  `t0(vi) = striationPhase(pattern, vi, …) * W` where `W = attack.len` if
  shape.attack is present, else `segLen * 0.5` (the legacy constant). With no
  shape block this reproduces the current formula **exactly** — that identity
  is what makes G0's byte-identical gate achievable with one code path.
- **`together`** — all voices at `t = 0`. The block/chord attack.
- **`ramp`** — evenly spaced by `staggerOrder` across the window:
  `t0 = (order[vi] / (n−1)) * attack.len`. The "electronic-music fade-in":
  orderly accumulation, vs `striated`'s seeded irregularity.

Exit modes (`release.exit`):

- **`striated`** — voices stop at staggered times across
  `[span − len, span]`, **first-in-first-out** (reuse `staggerOrder`; the voice
  that entered first leaves first). Implemented as a per-voice `endT` bound in
  `buildCarrier`'s loop; the final segment truncates to `endT` instead of
  `span`.
- **`together`** — all run to `span` (default; legacy behaviour). Combined
  with `curve: "sudden"` this is the ensemble tongue-stop.

Breath machinery is untouched: the body between the windows still segments by
`maxBreath`, splits instead of truncating, flags `BREATH`. A release window
longer than a breath simply contains a breath re-entry under a falling `g(t)` —
which is musically correct (a long taper IS re-attacked quieter).

### 4.3 Edge technique

`attack.technique` / `release.technique`: inside the window, `stateAt`
overrides the technique for each voice's **first** (resp. **last**) segment.
Because the override lives in `stateAt`, the breath callback, the fixed-length
lookup, the SWITCH check and the emitted note all agree by construction.

Hard-won facts this must respect (all already enforced by existing machinery —
the plan's job is to *route through* it, not duplicate it):

- **D9 (ORD is the only real duration).** `cuivre`, `fortepiano`, `staccato`
  are fixed one-shots: an attack segment in one of them takes its **sample
  length** (`fixedLength()` + `bank/sample_lengths.json`), not `attack.len`.
  If the sample outlasts the window it rings into the body — **flag
  (`EDGE_RING`, soft), never shorten**, the audit's philosophy throughout.
- **Cuivre's range is MIDI 60–67** (`TECHNIQUES.cuivre`, transcribed from the
  composer's UVI build). Most chord voices sit below it. Out-of-range voices go
  through the existing `feasibleTechnique()` — which, verified against the
  code, resolves a low cuivre ask to **fortepiano** (nearest range at distance
  0, same `fixed` durClass) — and carry the existing `RANGE` flag. Musically
  that degradation is right: fp is the brassy accent available across 30–65.
  The panel must show the substitution count (it already renders flags);
  the plan's listening battery includes hearing it.
- **`SWITCH_PREP`** already checks technique-change prep gaps at segment
  boundaries; the attack→body switch will only flag for `play_sing_ks` (1.0 s
  needed vs the ≥ 0.75 s breath gap). No new rule.
- **M4 (colour morph) + edge technique** both drive technique. The window
  override wins inside the window; a render with both gets one
  `SHAPE_OVER_M4` warning so the interaction is visible, not silent.

### 4.4 Flags & checks — keep them meaningful

- **`together` entry must not drown in SEAM flags.** The cross-onset SEAM
  check (soft) currently exempts `striation === 'aligned'`; extend the
  exemption to notes whose onset falls inside an attack window with
  `entry: "together"` — aligned onsets are *the point* of that mode. All other
  windows keep the check. A designed attack that produces 10 SEAM flags every
  render would teach the composer to ignore flags, which is worse than no
  check (D17's lesson: an estimate may only mis-tint, never train you to look
  away).
- Per-voice OVERLAP (hard) and RATE (soft) checks are untouched and must stay
  green in every test fixture.
- New soft flags: `EDGE_RING` (one-shot outlasts its window), `SHAPE_CLAMP`
  (attack+release clamped to span). Both counted in `summary.soft`.

---

## 5 · Panel + conversational layer

- **Panel** (`morph_panel.js`): one new "Shape" row group — attack `len /
  entry / curve / from / technique`, release `len / exit / curve / to /
  technique`, defaulting to "off" (absent block). Same read-and-nudge fields as
  the existing dials; regenerate on change. `preflight()` untouched (no new
  host seams — the panel talks to the engine only).
- **Params file** (`bank/morph_params.json`): `shape` in any variant; add to
  `_vocabulary`:
  - *"give it an attack / harder attack"* → `shape.attack {len down, from down,
    curve expo→sudden}`
  - *"cuivre attack"* → `shape.attack.technique: "cuivre"` (knowing the fp
    substitution below MIDI 60)
  - *"striated entry"* (the Grisey entry) → `entry: "striated"`, len up
  - *"longer tail / let it die away"* → `shape.release {len up, to 0, curve expo}`
  - *"cut it off / tongue-stop"* → `release {exit together, curve sudden}`
- The primary interface stays speech → AI writes params → composer listens
  (composer, day 10: *"I can describe what I want more or less of and then AI
  could dial those in"*). The panel fields are the read-and-nudge display.

---

## 6 · What already exists that this must NOT duplicate

- The dynamics layer (D24) — shaping *multiplies* it, never replaces it.
- Striation patterns — attack modes reuse `striationPhase` / `staggerOrder`.
- Breath, fixed lengths, feasibility, SWITCH — all routed through, §4.3.
- The Roads envelope catalog (4e) — the curve names deliberately echo it;
  do not port the full 8-shape catalog until a musical need appears (NITS if
  tempting).
- The insert/drag/scale/save-reload machinery — inherited via note-relative
  envelopes; re-verified once in G4, not re-implemented.

---

## 7 · Build order & phase gates

**G0 — contracts + regression floor** *(no behaviour change)*
- Snapshot fixtures: render all six recipes from `bank/morph_recipes.json` and
  all `morph_params.json` variants; store note-array hashes in the test file.
- Add `shape`/`lanes`/`voices` to `KNOWN_KEYS`; schema-validate `shape`
  (unknown sub-keys reported, same policy as top level).
- **Gate:** 101 existing assertions green; fixtures byte-identical with and
  without the (absent) shape key.

**G1 — gesture gain `g(t)`**
- Envelope math + curves; applied in `stateAt`.
- **Gate (measured):** unit tests pin curve values at window edges and
  midpoints; `shape` with `from:1, to:1` ≡ no shape (byte-identical); all
  fixtures unchanged.

**G2 — entry/exit scheduling**
- Window-scaled entries, per-voice `endT`, SEAM exemption.
- **Gate (measured):** onset distributions match each mode (together: all
  t=0; ramp: even spacing; striated-no-shape: legacy formula exactly); exit
  times land in `[span−len, span]` FIFO-ordered; zero spurious SEAM flags on
  `together`; fixtures unchanged.

**G3 — edge technique**
- `stateAt` window override; `EDGE_RING`; `SHAPE_OVER_M4` warning.
- **Gate (measured):** cuivre@45 → fortepiano + RANGE (asserting the actual
  fallback, not just "some flag"); fixed one-shot first segments take sample
  lengths under a shape; fixtures unchanged.

**G4 — panel + app verification + LISTENING CHECK-IN** *(the musical gate)*
- Panel row, `_vocabulary`, then verify in the running app (AI_METHODOLOGY
  rule 4: claims come from the running app, not the code):
  1. insert a shaped morph; drag; group-scale ×0.75; save-reload —
     `morphBend` + levels byte-identical through the round trip (repeat of
     2v's Phase 4 gate, on shaped material, in a scratch session — never a
     `piece-*` file).
  2. **Listening battery** (panel variants A–F slots, the established loop):
     - C (BEATING BLOOM) as-is **vs** C + fp/cuivre attack + sudden release —
       the composer's own example, striated entry vs designed attack.
     - A ± a long expo release.
     - one chord × release curves (linear / expo / sudden).
     - **B re-heard** — the ramp-INTO-technique fix from day 10 has never been
       re-auditioned; the edge-technique mechanism leans on the same "lean
       into the effect" instinct, so this validates both at once.
- **Gate:** composer verdicts recorded (RUNNING_LOG + `_auditionNotes`);
  keepers filed per 2y's store once it exists.

---

## 8 · Failure modes → mitigations

| # | failure | mitigation |
|---|---|---|
| 1 | Shaping silently changes existing morphs (the recipes the composer already blessed) | G0 fixtures; `shape` absent ⇒ byte-identical is a standing assertion, not a one-off |
| 2 | Cuivre attack "doesn't work" (voices below 60) | Known fallback to fp + RANGE flag, §4.3; panel shows counts; battery hears it before the composer meets it in anger |
| 3 | One-shot attack rings past the window | `EDGE_RING` soft flag; never shortened (D9 — the sample decides) |
| 4 | Designed attack drowns in SEAM flags → flags get ignored | exemption for `together` windows, §4.4 |
| 5 | Release taper fights breath (window > maxBreath) | body machinery splits as always; re-entry under falling `g(t)` is the correct sound |
| 6 | Drag/scale detaches the shape | envelopes stay note-relative (nothing absolute is added); G4 app round-trip proves it |
| 7 | `to:0` "doesn't reach silence" | the 0.4 level floor, documented in panel help; same floor as every drawn decrescendo |
| 8 | M4 + edge technique fight | window wins + `SHAPE_OVER_M4` warning |
| 9 | Two agents edit the same files | sequencing rule in the header; if two agents ever run, re-declare file ownership FIRST |

**Residual risk, stated plainly (rule 4):** the one genuinely open musical
question is whether a designed attack reads as *the gesture's attack* or as
"some players did something at the start." No test can answer it; that is what
G4's battery is for. Everything mechanical above is testable and tested.
Second risk, cosmetic: `curve: "expo"`'s exact exponent is taste — cheap to
retune by ear, pinned by test either way. Third: cuivre note-off behaviour is
still the 2o open question; if cuivre is used at a release edge and rings past
a `sudden` cut, that is 2o's probe finally earning its 60 seconds — flag, run
the probe then, not now.

---

## 9 · Implementer rules

1. Run `node tools/test_morph.js` before touching anything and after every
   change. The fixtures are the contract with the composer's already-blessed
   material.
2. One code path per lever. If you find yourself writing
   `if (shape) { …new scheduler… } else { …old scheduler… }`, stop — the
   default must BE the legacy values flowing through the new code (§4.2).
3. Never shorten, never refuse, never silently drop — flag (D16 lineage).
4. The engine stays pure. Anything needing the DOM, MIDI, or a fetch belongs
   in emit/panel, and nothing in this plan needs any of those beyond the
   existing panel row.
5. Verify claims in the running app before reporting them (AI_METHODOLOGY
   rule 4). Test in a scratch session, never a `piece-*` file; CTRL+S before
   experimenting on any non-piece score (COLD START trap 5).
6. Stage explicit paths only; push after each commit (D30).
