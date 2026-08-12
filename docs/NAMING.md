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
