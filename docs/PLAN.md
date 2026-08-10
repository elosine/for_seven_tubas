# PLAN — for seven tubas

> **Rules:** IDs are stable — never renumber, only append. Status: `todo` / `doing` /
> `done` / `deferred`. Position = order. Same conventions as piece #3's PLAN.

## 0. Setup — `doing`

- **0a — Repo + stack seed** — `done 2026-08-10` — piece #3's score app (7 tracks,
  :5200) + sandbox (:4700) + instruments skeleton copied and adapted. Saving = #3's D8;
  motive blocks = #3's D9.
- **0b — loopMIDI + rack** — `doing` (composer) — 7 ports `tuba1`…`tuba7` (lowercase); Reaper rack,
  one track per port, **input monitoring ON per track** (piece #3 Principle 1 — the
  silent-killer).
- **0c — Tuba sample library chosen** — `done 2026-08-10` — **IRCAM Solo Instruments 2 (tuba)**, same library family as piece #3's harp/accordion: UVI channel-per-technique switching, all of #3's UVI quirks apply (SAMPLER_QUIRKS.md there).

## 1. Instrument survey — `doing`

- **1a — Technique roster** — `done 2026-08-10` — 21 SI2 tuba techniques transcribed
  from the composer's UVI build (slot order = ground truth); dual-port model = D2.
- **1b — Probe & characterize** — `skipped → per-need` *(composer 2026-08-10: "no need
  for probe")* — technique behaviors (KS internals, menu patches, quartertone mapping,
  true ranges) learned while composing; AI surfaces piece #3-style probes only when a
  musical question demands one.

## 2. Compose — `todo`

Incremental MO carried over from piece #3: composing drives tool-building; the score is
the combining surface; sandbox available for exploration. Per-track recording in the
score is still unbuilt (was piece #3's next slice — build here when needed).

## Parking lot

- **P1 — Reaper scriptability / AI bridge** *(composer, 2026-08-10: "full access and
  scriptability to AI of Reaper" — e.g. "set every UVI instance to −7.3" as one
  command)*. Tiers: T0 offline .rpp batch-edits + FX-chunk cloning (available now) ·
  T1 ReaScript command-file daemon (~1 day) · T2 MCP tool surface (evaluate community
  Reaper-MCP first). Caveat: plugin-internal knobs need UVI Param exposure or a
  utility-gain FX as the scriptable calibration knob. Build when the pain recurs.
