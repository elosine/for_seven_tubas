# Automation eval — loopMIDI ports, Reaper config, UVI access

*Composer ask 2026-08-11. PROPOSAL ONLY — composer reviews before any implementation
(their instruction). Builds on PLAN P1 (tiers T0–T2).*

## TL;DR

| Surface | Benefit | Cost/risk | Verdict |
|---|---|---|---|
| loopMIDI port creation | Low (once per piece, ~2 min by hand) | GUI automation OK; registry hack brittle | **Manual** (AI-supervised clicks on request) |
| Reaper: tracks + VSTi + inputs + monitoring | **High** — fiddliest recurring setup | Low: one ReaScript, run once from Actions | **Automate now** — script written, awaiting approval |
| UVI direct access | None so far except instance volume | High (no real API; GUI-only) | **Not needed for tubas 8–10 → defer until it bites** |

## 1. loopMIDI ports (tuba8/tuba8b … tuba10/tuba10b)

- **Manual:** 6 ports = type name + click "+" six times. ~2 minutes. Once per piece.
- **AI options:** (a) computer-use GUI automation with you watching — works, but saves
  nothing on a 2-minute task; (b) writing the port list to loopMIDI's registry config
  + app restart — undocumented, version-dependent layout, silly risk for the payoff.
- **Verdict: do it manually.** Automation here is cost without benefit at this
  frequency. (If we ever need dozens of ports, revisit via the teVirtualMIDI SDK.)
- ⚠ Port names lowercase `tuba8`…`tuba10b` (instruments.js ground truth, matches
  the D2 convention). Ports must exist BEFORE the Reaper script runs.

## 2. Reaper: create tracks, add VSTi, config inputs, monitoring — YES, automate

**Key insight that changes the whole eval:** `TrackFX_CopyToTrack` clones a plugin
instance **with its full internal state** — the loaded SI2 tuba, all 16/5 channel
slots, AND the instance master volume (−7.3 calibration). So cloning tuba7's two
tracks gives ready-to-play tuba8–10 instances **without ever opening UVI**.

- **Proposal artifact:** [`tools/setup_tuba8_10.lua`](../tools/setup_tuba8_10.lua) —
  one-shot ReaScript. For each of tuba8–10 × {primary, b}:
  1. find source track (tuba7 / tuba7b) by name;
  2. insert new track, name it;
  3. `TrackFX_CopyToTrack` (UVI instance + state);
  4. `I_RECINPUT` = the matching loopMIDI port, resolved **by device name**
     (`GetMIDIInputName` loop — no fragile device indices), all channels
     (channel-per-technique needs all);
  5. `I_RECMON = 1` (input monitoring ON — piece #3 Principle 1), `I_RECARM = 1`.
  It aborts loudly per-track if a source track or port is missing, and touches
  nothing else.
- **How you run it (after approving):** create the 6 loopMIDI ports → Reaper:
  Actions → Show action list → New action → Load ReaScript → pick the file → Run.
  Then spot-check one track (play a note from the score).
- **Caveats:** the script matches source tracks named `tuba7`/`tuba7b`
  (case-insensitive) — if your track names differ, tell me the real names and I'll
  adjust; new tracks route to master by default (matches current gain staging —
  tutti master at −6 already assumed 7+ sources; 10 parts pushes the ceiling
  math, see GAIN_STAGING.md, may need master trim re-check at first 10-part tutti).
- **Beyond this one-shot** (future, from P1): T1 command-file daemon for live AI
  control ("set every instance to −7.3") or T2 community Reaper-MCP. Defer both
  until a live-control need actually recurs — the one-shot covers current needs.

## 3. UVI direct access — cost/benefit first

- **Historical need:** exactly ONE knob so far — instance master volume, set once
  during gain calibration. Everything else lives in Reaper or the score stack.
- **For the tuba 8–10 setup: NO direct UVI access is necessary.** The FX-state
  clone carries loaded instruments + volume. Nothing to click inside UVI.
- **Verdict: defer until it bites** (your framing — agreed).
- **If/when it bites, ranked solves:**
  1. **Utility-gain FX as the calibration knob** (piece #3 P1 caveat): insert a
     ReaGain/JS volume FX after each UVI instance; THAT is fully scriptable
     (ReaScript/.rpp/MCP). Sidesteps UVI entirely for the one knob we've needed.
  2. **Reaper-MCP** (community servers exist): gives AI live track/FX control;
     still can't reach inside UVI's UI, but covers everything around it.
  3. **Claude co-work / computer-use GUI**: AI drives the UVI window with you
     watching. Works for rare batch edits (e.g., re-slotting 21 techniques);
     too slow/fragile as a routine tool.
  4. UVI host-param exposure: UVI Workstation exposes few automatable params;
     not a real surface. (This is why #1 exists.)
