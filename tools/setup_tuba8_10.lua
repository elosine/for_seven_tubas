-- setup_tuba8_10.lua — PROPOSAL (composer approves before running; see docs/AUTOMATION_EVAL.md)
-- One-shot ReaScript: creates Reaper tracks for tubas 8-10 (primary + b instance each),
-- cloning the full UVI instance STATE from tuba7's tracks (loaded SI2 tuba, channel
-- slots, instance master volume) via TrackFX_CopyToTrack — no UVI UI interaction.
-- Prereq: loopMIDI ports tuba8/tuba8b..tuba10/tuba10b exist (lowercase).
-- Run from Reaper: Actions > Show action list > New action > Load ReaScript > Run.

local SRC_PRIMARY = "tuba7"    -- source track names (case-insensitive exact match);
local SRC_B       = "tuba7b"   -- adjust if the project uses different track names

local function findTrackByName(name)
  for i = 0, reaper.CountTracks(0) - 1 do
    local tr = reaper.GetTrack(0, i)
    local _, tn = reaper.GetSetMediaTrackInfo_String(tr, "P_NAME", "", false)
    if tn:lower() == name:lower() then return tr end
  end
end

local function midiInputByName(name)
  for dev = 0, reaper.GetNumMIDIInputs() - 1 do
    local ok, dn = reaper.GetMIDIInputName(dev, "")
    if ok and dn:lower() == name:lower() then return dev end
  end
end

local function log(msg) reaper.ShowConsoleMsg(msg .. "\n") end

reaper.Undo_BeginBlock()
local made, skipped = 0, 0
for n = 8, 10 do
  for _, suf in ipairs({ "", "b" }) do
    local srcName = (suf == "" and SRC_PRIMARY or SRC_B)
    local newName = "tuba" .. n .. suf
    local src = findTrackByName(srcName)
    local dev = midiInputByName(newName)
    if not src then
      log("SKIP " .. newName .. ": source track '" .. srcName .. "' not found — tell AI the real track name")
      skipped = skipped + 1
    elseif not dev then
      log("SKIP " .. newName .. ": MIDI input '" .. newName .. "' not found — create the loopMIDI port first")
      skipped = skipped + 1
    elseif findTrackByName(newName) then
      log("SKIP " .. newName .. ": track already exists")
      skipped = skipped + 1
    else
      local idx = reaper.CountTracks(0)
      reaper.InsertTrackAtIndex(idx, true)
      local tr = reaper.GetTrack(0, idx)
      reaper.GetSetMediaTrackInfo_String(tr, "P_NAME", newName, true)
      reaper.TrackFX_CopyToTrack(src, 0, tr, 0, false)          -- UVI instance + full state
      reaper.SetMediaTrackInfo_Value(tr, "I_RECINPUT", 4096 + dev * 32)  -- MIDI dev, ALL channels
      reaper.SetMediaTrackInfo_Value(tr, "I_RECMON", 1)          -- input monitoring ON (Principle 1)
      reaper.SetMediaTrackInfo_Value(tr, "I_RECARM", 1)
      log("OK   " .. newName .. " <- clone of '" .. srcName .. "', input dev " .. dev)
      made = made + 1
    end
  end
end
reaper.Undo_EndBlock("Setup tuba8-10 tracks (clone UVI from tuba7)", -1)
log(string.format("Done: %d created, %d skipped. Spot-check one track from the score before trusting all.", made, skipped))
