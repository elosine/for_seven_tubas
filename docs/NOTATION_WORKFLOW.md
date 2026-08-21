# NOTATION WORKFLOW — the experiment loop (tier-2 part-by-part work)

> Created day 22 (2026-08-21) from the composer's workflow brief. This is the
> portable protocol: an AI session reads this once and can run the loop cold.
> The machinery it names was built and verified that day — sonify_core /
> midiplayer / hot reload / variant tooling. Composer-side setup: §5.

## §1 The loop, one iteration

1. **Composer names material + an approach.** *"DB1, Tuba 3, 114–136, try
   simple bars at ε=30"* — section names resolve via `docs/PLANNER.md` /
   the piece markers; approaches per PLAN M5 (mixed strategy is the norm).
2. **AI makes a version file** (extract or fork — §3) → it appears in the
   picker (under **experiments**) within ~1 s, no reload.
3. **Composer works in the zoom window** (`/notation/app/notation.html`,
   view = zoom; SPACE plays, click seeks, Z flips video↔zoom). **MIDI is the
   default sound** — the loopMIDI/Reaper rig, same latency behavior as the
   composer score. A render, when one exists, is one click (§4).
4. **Composer asks for changes in plain language.** AI edits DATA (§2), the
   open page updates within ~1 s, playhead and page preserved. New
   glyphs/devices are a code step (GLYPH_EXTENSION_CONTRACT.md /
   animobj's state(t)→SVG contract) — minutes, then their numbers are
   registry data like everything else.
5. **"Keep that as x02"** → fork; **"back to x01"** → pick it in the dropdown.
6. **Settled** → promote: re-extract under the canonical id (no `--exp`),
   fold the working choices into the section profile, regenerate all parts,
   `--prune` the dead experiments. Decisions → RUNNING_LOG as they happen;
   look-nits → `docs/NOTATION_POLISH.md`, filed not debated.

## §2 Phrase → file (the global-change map)

Every look/behavior number is data. Edit the file; the page hot-reloads it.

| The composer says | Edit |
|---|---|
| noteheads / stems / line weights (glyph family) | `notation/lib/glyphs.json` → `standards` |
| staff size | `notation/registry/container.json` → `staff.staffHeightPx` (the C-switch) |
| text sizes, stem length, dynamics/tempo/tag positions | `container.json` → `engraving.layout` |
| colors, part labels, attack lines, ticks, brick opacity | `container.json` → `engraving.render` |
| cursor / GC ball / followers / wedge / pie styling | `container.json` → `animated` |
| page seconds, time scale per section | `container.json` → `timeScale` (+ the `w` box live) |
| gutter width / prefatory content | `container.json` → `prefatory` |
| META overlay opacity | `container.json` → `metaOverlay` |
| one item nudged, one label respelled | per-item overrides IN the version's `.ir.json` (the V1 override channel) |
| chunk strategy, bar grouping, tempo of a chunk | the version's `.ir.json` → `chunks` |
| page-turn / splice behavior | `notation/registry/page_rules.json` |

**Hover any brick** → native tooltip with its identity: pitch · technique ·
envelope species · span · class/strategy · source object id (day 22; the
IR carries `env`/`mode` since schema amendment 3).

Polled every second: `container.json` · `glyphs.json` · the current IR ·
the picker manifest · the renders folder · **the source score's mtime**.
When the composer score changes, the page re-fetches it (META overlay +
markers refresh) and re-checks every extracted curve snapshot against the
live shape — drift raises an amber badge naming the object ("wc-3 (curve) —
ask the AI to refresh <id>"); a re-extract clears it. The curve's source of
truth is ALWAYS the composer score; `level.samples` is a snapshot at
extract time. Controls + page/zoom position survive reloads (localStorage).

## §3 Version files (the composer-score save model, option A1)

- **A version = one IR file** in `notation/ir/`, one picker entry. Naming:
  `<section>-<part>-xNN`, **all lowercase** (e.g. `db1-t3-x01` — the IR id
  pattern rejects capitals, found day 22).
- Make / fork / prune (Git Bash-compatible):

```bash
node tools/notate_section.js --score piece-s25-finished01 --w0 114 --w1 136 --parts 2 --profile section1 --id db1-t3-x01 --exp
```

```bash
node tools/notate_section.js --from db1-t3-x01 --id db1-t3-x02 --exp
```

```bash
node tools/notate_section.js --prune db1-t3-x01
```

- `--exp` groups the entry under **experiments** in the picker; canonical
  section IRs omit it. Pruned files stay in git history.
- Versions capture CONTENT + strategy + per-item overrides. The global look
  (registry) is deliberately shared and live across versions — that is the
  global-change channel. If an experiment is *about* a look, snapshot the
  relevant registry values into the ledger note before moving on.

## §4 Sound

- **MIDI (default).** The notation page plays the piece live through the
  same rig as the composer score — `notation/lib/midiplayer.js` over
  `score/public/sonify_core.js`, the SAME computation `tools/export_midi.js`
  serializes (equivalence: `tools/test_sonify_core.js`,
  `tools/test_midiplayer.js`). Needs loopMIDI ports up + Reaper monitoring
  ON (piece #3 Principle 1). Pause/stop always sweeps CC7=127 (the residue
  cure) — quiet tracks afterwards are NOT expected; if heard, Principle 3.
- **Render (optional).** Drop `<scoreName>.wav|.mp3` into `notation/audio/`
  → a **♪ render** chip appears; clicking slaves the clock to it (MIDI
  unchecks; re-checking MIDI detaches). Renders are gitignored.
- **Making the render:** `node tools/export_midi.js --score <name>` →
  `midi/<name>.mid`, 21 tracks (tempo + T1,T1b…T10,T10b). **Reaper session
  tempo MUST be 60 BPM** (or accept the file's embedded tempo map) — the
  tool prints this every run.

## §5 Composer-side setup (once per sitting)

1. loopMIDI ports up (`tuba1`…`tuba10b`), Reaper rack with input
   monitoring ON.
2. `node score/server.js` → http://localhost:5200/notation/app/notation.html
3. View = **zoom** (or video), pick the version, SPACE.

## §6 Derivation (settle one part → all parts)

The extraction PROFILE is the principle-carrier: what the experiments settle
(ε, chunking choices, device usage) is folded into the profile
(`notation/lib/classify.js` + registry), then one extract regenerates every
part of the section from the same rules; hand-deviations live as per-item
overrides in the canonical IR. When a profile knob turns out to need
piece-wide variation (the log-vs-exp class), it moves into a registry file
at THAT moment (deferred per D48, deliberately).
