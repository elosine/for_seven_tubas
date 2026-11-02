# PORTING — the recipe for bringing the performance system to a piece

Written as it is done (9t, day 46, 2026-11-02). First run: piece #4 (the tubas) →
Tempus (`septet_2026`, "Scattered Substance"). 9q makes this standard after the
second run (the port back to the tubas). Every step below was actually run; the
numbers are what came out.

## 0 · The shape of a port, in one paragraph

A piece's repo already has the notation library (`notation/lib`), its score in the
stand's format (`notation/ir/<piece>.ir.json` + `scores/<piece>.json`) and its registry
(`notation/registry`). The port brings in **the stand** (one page + one overlay file),
**the server** (one folder + three tools + one clock file) and **three small library
changes**, then gives the piece its own server on the box. The piece's own drawing
rules are never overwritten; a stand change that would move the piece's frozen
output goes behind an option the stand alone switches on.

## 1 · Find the common base (5 minutes)

The two libraries forked from one copy. Find the commit in the SOURCE repo whose
`notation/lib` is byte-identical to the TARGET's at its port commit — compare git blob
ids across the repos (`git ls-tree <commit> notation/lib/`); blob ids are content
hashes, so they compare across repositories:

```
diff <(git -C TARGET ls-tree <target-port-commit> notation/lib/ | awk '{print $3,$4}' | sort -k2) \
     <(git -C SOURCE ls-tree <candidate> notation/lib/ | awk '{print $3,$4}' | sort -k2)
```

First run: the septet's port commit `6789d4c` (2026-09-03) == the tubas' `752b886`
(2026-09-04). **LIB IDENTICAL.** Then list what each side changed since:

```
git -C SOURCE log --since=<base date> --name-only -- notation/lib notation/registry notation/app/stand.html
git -C TARGET log --since=<base date> --name-only -- notation/lib notation/registry
```

First run — the SOURCE (tubas) changed only `render.js` (curveInWin), `gc.js` (the
GC scale follows the staff), `transport.js` (nowAt), and added `animlive.js`,
`stand.html`, `stand.manifest.json`, `stand-icon.png`. The TARGET (septet) changed
fourteen files for its print score and morph section, `gc.js` (added `systemOf`) and
`render.js` (page edges, `opts.owned`, `inkEnd`) among them.

## 2 · Freeze the target's frozen output BEFORE touching anything

Whatever the piece has approved (a film, a print score) gets dumped and hashed first.
First run: the septet's seven film pages
(`node tools/export_video.js --ir piece-septet --dumpPage N --dumpTo <file>` for
N = 0 9 20 30 43 49 53; 0.3 s each) → sha256 prefixes `65e4e10d 1ae2a06a ccdbc3f5
68913256 ef8c055f 5ffc7104 c6d1b4c5`, equal to the ones in the septet's journal. This
is the check every library change below must pass unchanged.

## 3 · The library — three files, three different cases

| file | source changed | target changed | what to do |
|---|---|---|---|
| `transport.js` | yes (nowAt) | no | copy the source's file whole |
| `animlive.js` | new | — | copy |
| `gc.js` | yes (scale rule) | yes (`systemOf`) | **keep the target's file, apply the source's patch:** `git -C SOURCE diff <base> HEAD -- notation/lib/gc.js \| git -C TARGET apply` (applied cleanly first run) |
| `render.js` | yes (curveInWin) | yes (print edges) | **keep the target's file, add the stand's behaviour BEHIND an option** (`opts.flushCurves`, set by the stand page only); the old loop stays as `sampledInWin`, byte-identical output when the option is off; the right edge is the target's `wInk`, not `w1` |

The first attempt copied `gc.js` whole and the film dump crashed (`GC.systemOf is not
a function`) — the target's addition was gone. Rule: **a file both sides changed is
never copied; it is the target's file plus the source's patch.** Then re-dump (§2):
first run, all seven pages byte-identical after the three changes.

## 4 · The stand page — copy, then four edits

Copy `notation/app/stand.html`, `stand.manifest.json`, `stand-icon.png`. Edit:
the page title and `apple-mobile-web-app-title` (the piece's title — the public
face, never "Tuba part"); the `PART` clamp (the piece's part count); the `IR` default
(the piece's IR name); add `flushCurves: true` to the `renderSection` options. The
manifest's `name` / `short_name` / `description`. (9h-2 will make the title and part
come from the server; until then they are edited here.)

**The piece's instruments.** The stand page, as the tubas wrote it, draws one bass
staff per part under a "T<n>" label. A piece with an instrument registry
(`notation/registry/ensemble.json`: clefs · staves · short names · lane weights, and
`techniques.json`) needs the page to read it the way the piece's own notation page
does: fetch both with the registries (optional, null when absent) · pass `ensemble`
and `techniques` to `layoutSection` · build the row's system through
`Coords.withStaves([sys], stavesOf, grandStaffOpts())` with `ssPerSystem` on the
system · the lane height × the part's weight · `ensemble` in the `renderSection`
options (the short name becomes the label). First run: without this, every septet
part drew in bass clef (the seam shots caught it); with it, Fl treble · Pno grand
staff with brace · Va alto. (9q folds this into the page itself, registry-or-not.)

## 5 · The server — copy, then rename

Copy `server/` whole, `tools/admin.js`, `tools/test_server.js`, `tools/chaos_test.js`,
`tools/stand_check.js`, `testkit/js/syncclock.js`. Merge `package.json`
(`socket.io` ^4.8.4; dev `socket.io-client` ^4.8.4; scripts `start` ·
`test:server` · `chaos`). `.gitignore` += `server/data/`, `testkit/results/`.
`npm install`.

Rename, one piece = one running server (D102): `server.js` default port (5301 for the
septet; the next piece 5302), `ecosystem.config.js` name + PORT, `deploy.sh` name +
folder + port, `server/README.md` § The box (address, folder, PM2 name, nginx site,
piece id, the admin lines), `tools/admin.js` examples + default port.

**Part names:** `registry.js` `registerPiece` reads them from the score file the IR
points at (`scores/<source.score>.json` → `tracks[i].name`), falling back to
"Part N". First run: Flute · Bass Cl. · Piano · Violin 1 · Violin 2 · Viola · Cello.
(Carried back to the tubas in 9q.)

**The tests are piece-specific in their expectations** — the piece id, the IR name,
the part count, the first three part names, the score file served read-only, the
stand check's part list and busy minute. Edit them (first run: `tubas/db1/10/Tuba N`
→ `ss/piece-septet/7/Flute…`; the check's `--t 141.5` → `300`). The chaos test's
doubling rows assumed ten parts (`partIndex % 10`) — now `% P`, the piece's count;
the symptom was a crash on an undefined ensemble, not a clear message.

Also `server/nginx.conf.example`: the `proxy_pass` port.

## 6 · Prove it in the target

- the film dump unchanged (§2);
- `node tools/test_server.js` → first run **75 ok, 0 failed**;
- `node tools/chaos_test.js` → first run **OK** (10 stands, spread 0.03–0.06 ms,
  rejoin 31 ms, the server restarted and every stand back in 0.6–0.9 s);
- `node tools/stand_check.js --seams` → every part opens, draws, plays; the seam
  shots AND one shot per instrument type looked at by the AI (first run: parts 1, 3,
  6 — treble, grand staff, alto). **This is where the clef bug showed.** First run:
  ALL OK, 7/7.

**First run, wall clock:** about two hours on Fable, the renderer question included.
The recipe's steps 1–6, second time, should be under an hour on Opus.

## 7 · The box — the five lines, the composer's hands

`server/README.md` § The box, with the piece's names. DNS A record (proxy OFF) → clone
to its folder → PM2 start → nginx + certbot → `/health` through the domain →
`register <id> "<title>" <ir>` → `create "Home test" <id>` → the part 1 QR → the iPad
(the walk-through in RUNNING_LOG 104). The address convention: the title's words,
lowercase, hyphens, in front of the composer's domain (D102).

## 8 · The record

RUNNING_LOG entry in `for_seven_tubas` (the arc's record); the piece's own journal
gets one pointer line; PLAN 9t status; this file updated with anything the run taught.
