# THE PORT TO TEMPUS — chunk 9t (plan A, D103, day 46)

**Read this whole file first. Then the files it names. Nothing else.**

## The goal

Tempus (the septet, repo `C:\Users\jwloy\GitHub\septet_2026`, piece "Scattered
Substance", 7 parts) gets the stand and the server that the tubas have today, and
its own server on the box. **Done =** the composer scans a QR on the PC screen and a
Tempus part opens on the iPad, full screen from the home-screen icon, served over
HTTPS from `https://scattered-substance.justinwenloyang.com`, the rows cycling and the
cursor playing, drawn with TEMPUS'S OWN notation rules. Exactly what Tuba 1 does today
(RUNNING_LOG 104), for Tempus.

From this chunk on, the performance system is BUILT ON TEMPUS (D103: 9h-2, 9i … 9n
happen in `septet_2026`). The tubas get the finished system ported back in 9q.

## Where the session runs, and where the record goes

- The session runs in `for_seven_tubas` with `septet_2026` added as a working
  directory. Writes go into `septet_2026`; commits there stage EXPLICIT PATHS ONLY —
  the septet tree has 21 uncommitted files of the composer's (a modified
  `scores/piece-septet.json`, score versions, passages, the application PDF). Never
  sweep them. Never touch `scores/`, `print/`, `bank/`.
- **The performance system's record stays here:** `for_seven_tubas/docs` —
  PLAN §9, DESIGN, REQUIREMENTS, RUNNING_LOG, the organizer, the journal. The septet's
  own `docs/PROJECT_JOURNAL.md` §2 gets ONE pointer line per sitting ("the stand port:
  see for_seven_tubas RUNNING_LOG N"). One destination, no duplication.
- **Write the recipe as you go:** `for_seven_tubas/docs/PORTING.md` — every file
  copied, every line changed, every decision, in order. This is the first run of the
  porting procedure the composer wants at the end (9q makes it standard). The recipe
  is a deliverable of this chunk, not an afterthought.

## The facts (checked day 46, do not re-derive)

- Tempus's score is already in the stand's format: `septet_2026/notation/ir/piece-septet.ir.json`
  (irVersion · source.parts = 7 · events · chunks · overlays · animated). The
  renderer's registry is there too: `septet_2026/notation/registry/`.
- **Two forks of the notation library.** `septet_2026/notation/lib` is the LARGER
  fork (layout.js 2913 lines vs the tubas' 1989; render.js 700 vs 505; glyphs.json
  1021 vs 550; extract_core 657 vs 452; plus `beam_choice.js`, `chord_column.js`,
  `ensemble_dyn.js` that the tubas do not have; morph_overlays 293 vs 125). It carries
  Tempus's print-score rules (its D59, page edges) and its journal says: **the
  approved film never moved — re-dump the seven video pages before touching
  render.js** (septet journal §2, 2026-09-17). The tubas' fork has what the STAND
  needs: `animlive.js` (only in the tubas), the stand's additions in render.js
  (`curveInWin` and the row/window drawing, RUNNING_LOG 99), transport.js (64 vs 55
  lines), and the figures registry rules in `container.json` (NOTATION_STANDARDS).
- **The stand's files (the tubas):** `notation/app/stand.html` · `stand.manifest.json`
  · `stand-icon.png` · `notation/lib/animlive.js` · the server: `server/` (whole) ·
  `tools/admin.js` · `tools/test_server.js` · `tools/chaos_test.js` ·
  `tools/stand_check.js` · `testkit/js/syncclock.js` (served by the server) ·
  `package.json` (deps `socket.io`, devDep `socket.io-client`; `@resvg/resvg-js` is
  already in the septet's). stand.html loads, in order: coords · stamps · layout · gc ·
  render · splice · transport · animobj · animlive, and fetches `/api/composer/load/`,
  `/notation/ir/`, `/notation/lib/glyphs.json`, `/notation/registry/container.json`,
  `/notation/registry/page_rules.json`.
- The box: `server/README.md` § The box. Tempus's own server (D102): address
  `scattered-substance.justinwenloyang.com`, folder `/home/deploy/ss`, PM2 `ss-server`,
  **port 5301**, nginx site `ss`, piece id `ss`. The five lines with those names, the
  composer runs them (the AI never touches the box).

## The order of work

1. **The renderer question first — on Fable, before any copying.** The stand must
   draw Tempus with Tempus's renderer, not the tubas'. Diff the two render.js (and
   transport.js, animobj.js, coords.js) and list what the STAND needs that the septet's
   fork lacks (`curveInWin`, the window/row API, `__standRows`, whatever stand.html and
   animlive.js call). Decide the smallest change to the septet's lib that gives the
   stand its API without changing what the print score and the film draw — and prove
   it with the septet's own dump check (re-dump the seven pages, sha256 unchanged).
   Write the decision in PORTING.md. **If this looks like more than one sitting, stop
   and tell the composer: that is plan B's trigger.**
2. **Copy the stand in** (Opus can do this from the recipe): stand.html + manifest +
   icon + animlive.js into `septet_2026/notation/app` and `lib`; the part count and
   names from the IR; the title "Scattered Substance"; the page title and home-screen
   name — Tempus's, not "Tuba part" (the public face, RUNNING_LOG 102).
3. **Copy the server in**: `server/`, the three tools, syncclock.js, package.json deps;
   `ecosystem.config.js` → `ss-server`, port 5301; `deploy.sh` → `ss-server`;
   README § The box → the Tempus names. `npm install`. The battery and the chaos test
   green in the septet repo.
4. **PC check**: `node server/server.js` in the septet (the composer starts it) → the
   stand page for part 1 and part 7 through the server; `stand_check --seams` on
   Tempus's rows; screenshots of the seams looked at by the AI first.
5. **The box**: give the composer the five lines (README shape, RUNNING_LOG 101–104
   are the proven run). DNS → clone to `/home/deploy/ss` → nginx + certbot → health →
   `register ss "Scattered Substance" piece-septet` → `create "Home test" ss` → the
   Tuba… the Part 1 QR → the iPad → Add to Home Screen (the walk-through in
   RUNNING_LOG 104; one path, every button by its look and place).
6. **The record**: RUNNING_LOG entry here; PLAN 9t status; the organizer; the septet
   journal's one pointer line; PORTING.md complete for this run.

## The composer's standing rules that bind this chunk

- The composer starts and stops servers; the AI gives the exact lines.
- Tests only when make-or-break; one verification per claim, the real thing.
- The composer's part findings are NOT collected as they come — they are raised in
  the design sitting (9i) unless blocking (composer, day 46).
- Simple language, every button by its look and place, one path.

## Plan B (named by the composer, day 46)

If this port, or any Tempus chunk after it, runs long against the Tempus date: cut to
the port + 9h-2 + a minimal leader page (9n) + the instructions (9o) → the handout.
The rest, and the porting structure (9q), after. The AI says so the moment it sees it.
