# Score-file naming system (adopted 2026-08-12, the container era)

Three species of file in the Load dropdown:

| Pattern | What it is | Examples |
|---|---|---|
| `cont-<family>-<nnn>` | **A single shape/container** — one gesture, the shape library. Families grow as needed: `build`, `hold`, `fade`, `morph`, … | `cont-build-001` |
| `piece-<snn>` | **A piece-section score** — containers assembled on one timeline; the piece itself. | `piece-s01` |
| everything else (`sc*`, `dh*`, `dens*`, `oc*`, `w*`, `t*`, `env-catalog`, …) | **Research archive** — frozen experiment renders; never overwritten. | `dens10-levelsurge` |

- Canonical working score stays `7tubas` (D8: committed canonical + capped
  gitignored versions + autosave).
- A container file holds ONE shaped container (plus its fill, once filled) —
  the unit that gets refined later. Sections reference/duplicate container
  content; the container file remains the master of its shape.
- Numbering: three digits, never reused; a refined container keeps its number
  (the file IS the container's identity; D8 versioning tracks its history).

## The save system (composer 2026-08-14)

- **Piece menu** = `piece-*` saves only, natural-sorted (s08 · s07c · s07b · s07 …).
  Everything else — experiments, sandboxes, takes — lives in the **Scores** menu.
  Same folder; the prefix does the filtering.
- **Working copies protect the piece.** Opening `piece-sNN` from the Piece menu
  diverts the session to `piece-sNN-work`; autosave writes THERE, so the
  canonical save is never mutated. A bad stretch of edits is one reload away
  from clean.
- **"Save as next"** promotes the working copy to the next number
  (`piece-s08-work` → `piece-s09`) and discards the work file.
- **"Variant"** saves a lettered sibling of the current piece save
  (`piece-s09` → `piece-s09a`, `-s09b` …) and keeps you editing where you were —
  for try-this / try-that comparisons.
- **"Restore"** lists the timestamped snapshots taken at every explicit Save
  (`scores/versions/`, 20 per score, gitignored) and loads one back.
- `-work` files are hidden from both menus.
