# RESTART PROMPT — paste this into a fresh chat

> Written 2026-08-17 (day 13) at the composer's request, for use after clearing
> the chat window. Keep it updated at each session end; it is meant to be pasted
> whole.

---

## Paste from here

I'm the composer of **for seven tubas** (piece #4). We're mid-project. Before
anything else, read in this order:

1. `docs/AI_METHODOLOGY.md` — **governing.** Especially rule 4 (a confidence
   claim must be verified in the running app) and rule 5 (no clear evidence, no
   diagnosis).
2. `docs/PROJECT_JOURNAL.md` §2 **Resume Here** — day 13 is the top block.
3. `docs/FEATURE_REQUESTS.md` — the open spec ledger, FR-1…FR-6.
4. `docs/NITS.md` — the last entry, the undiagnosed blip.

**Two standing rules that govern how you work with me:**

- **D35 — do not implement anything without an explicit go from me.** Proposals,
  specs, measurements: yes, freely. Code edits: only when I say so.
- **D34 — take notes as we go**, unprompted, for two readers: the next cold
  session, and the paper. Filing contract is in `AI_METHODOLOGY.md`
  ("Capture as you go"). I clear the chat often, so nothing lives in it.

**How I want to be talked to:** short, bulleted, spatially separated. Lead with
the answer. I get lost when we drop into code — keep the conversation at the
conceptual level and consult the code yourself. If I say something is too much
analysis, it is.

---

## Where the piece is

- **Section: the morph section.** Form is in `docs/plans/MORPH_SECTION.md` — a
  morph bed with played impacts punched through it, then a coda.
- **Penn State: 15 minutes maximum**, deadline **4 Sept 2026**. I plan 3–5 morph
  objects, so their lengths have to be decided against the whole piece.
- **Body of the first morph is DECIDED**: model **BLOOM**, with `slower / longer`
  = 0.76 and `more dramatic` = 0.55, seed 11, plus a duration and a release.
- The morph engine now separates **pace** (`carrier.span`, the one-way gliss)
  from **length** (`carrier.duration`), and the trajectory **cycles out and
  back** rather than arriving and stopping. `carrier.release` closes the bloom
  back to unison as it fades.

## What I want to do next, in order

1. **Hear the attack.** Three shape presets exist and are **UNHEARD**:
   `fade-in-3s`, `hit-and-settle`, `brassy-hit`. I want a smooth full-ensemble
   fade-in, to try several **lengths**, and to check whether there is a **seam**
   where the attack joins the body.
   - **Blocked:** see the blip below. The standing recommendation — *not built* —
     is to render several fade lengths **end to end into one `.mid`** using
     `tools/midi_out.js` and audition it in Reaper, which bypasses the live-MIDI
     path entirely.
2. **Audit the saved JSON for the notation phase.** Walk `ACT-BLOOM-01.json` and
   a placed score and confirm everything the notation pass will need is actually
   stored — I'm planning to drive notation from animated curves describing pitch
   and volume across the whole shape, which are not in the individual MIDI notes.
3. Then build the remaining 3–5 morph objects for the section.

## What is broken, and what NOT to do about it

**A short attack ("blip") at the start of the fade-in and at the release.**

- **It is NOT diagnosed.** Three real engine causes were found and fixed on day
  13 (the level floor — opening CC7 went 24 → 0; CC7 had no lead at t=0;
  velocity now scales inside an attack window). **The blip persists, quieter.**
- **My counter-evidence:** playing four or eight ordinario notes from a keyboard
  produces **no attack at all**. None of the above explains that.
- **Do not re-run those three fixes, and do not offer the velocity/sample-onset
  explanation again** — it was already given and it did not hold up.
- I think it lives between the generated MIDI and the way Reaper or the UVI
  instance handles it, not in the engine. **The one control nobody has run:**
  play a generated `.mid` in Reaper against the same notes played live from the
  keyboard. That separates the chain from the engine in a single test.
- For the demo I will fix it manually in Reaper. Don't spend a session on it
  unless I ask.

## Housekeeping you should know about

- **`ACT-BLOOM-01` is stale** — saved moments before the fix that makes
  `Save as ACTUAL` store hand-typed fields, so it kept the sliders but not the
  duration, release or attack. Re-save as `-02` and delete it; `bank/morph_models.json`
  references it in BLOOM's `actuals` list.
- Checks: `node tools/test_morph.js` (expect **354 passed, 0 failed**, and the
  fixtures must **never** be regenerated) and `node tools/model_bank.js --validate`.
- Server: `node score/server.js` → http://localhost:5200/composer.html

## Stop here
