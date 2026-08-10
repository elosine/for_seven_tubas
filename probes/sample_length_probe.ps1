# sample_length_probe.ps1 - SI2 tuba sample-length probe (piece #4).
# Deterministic schedule: for each of the 21 techniques (tuba1 + tuba1b instances),
# hold a note far longer than any plausible sample, and let the recording show where
# the audio actually dies. The schedule is written to last_schedule.json - the
# analyzer's ground truth (schedule-vs-audio cross-check, piece #3 RR-parade lesson).
#
# Usage:  powershell -File probes\sample_length_probe.ps1
# Knobs:  -HoldMs 15000 -GapMs 2500 -Pitches 29,46 -Velocity 100
# Patches identical across tubas -> probe the tuba1 pair only; results apply to all 7.
param(
    [int]$HoldMs = 15000,
    [int]$GapMs = 2500,
    [int[]]$Pitches = @(36, 50),
    [int]$LeadInMs = 3000,
    [int]$Velocity = 100
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MidiOut {
    [DllImport("winmm.dll")] public static extern uint midiOutGetNumDevs();
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct MIDIOUTCAPS {
        public ushort wMid; public ushort wPid; public uint vDriverVersion;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string szPname;
        public ushort wTechnology; public ushort wVoices; public ushort wNotes;
        public ushort wChannelMask; public uint dwSupport;
    }
    [DllImport("winmm.dll", CharSet = CharSet.Ansi)]
    public static extern uint midiOutGetDevCaps(UIntPtr uDeviceID, out MIDIOUTCAPS caps, uint cbCaps);
    [DllImport("winmm.dll")] public static extern uint midiOutOpen(out IntPtr handle, uint id, IntPtr cb, IntPtr inst, uint flags);
    [DllImport("winmm.dll")] public static extern uint midiOutShortMsg(IntPtr handle, uint msg);
    [DllImport("winmm.dll")] public static extern uint midiOutClose(IntPtr handle);
    public static int Find(string name) {
        uint n = midiOutGetNumDevs();
        for (uint i = 0; i < n; i++) {
            MIDIOUTCAPS c;
            midiOutGetDevCaps((UIntPtr)i, out c, (uint)Marshal.SizeOf(typeof(MIDIOUTCAPS)));
            if (c.szPname == name) return (int)i;
        }
        return -1;
    }
}
'@

# Technique table - mirrors sandbox/instruments.js tuba1 (slot order = UVI build ground truth)
$techs = @(
    @{ tech = 'Ordinario';                   port = 'tuba1';  ch = 1  },
    @{ tech = 'Bisbigliando';                port = 'tuba1';  ch = 2  },
    @{ tech = 'Chromatic Scale';             port = 'tuba1';  ch = 3  },
    @{ tech = 'Cresc & Decrescendo KS';      port = 'tuba1';  ch = 4  },
    @{ tech = 'Cuivre';                      port = 'tuba1';  ch = 5  },
    @{ tech = 'FX Menu';                     port = 'tuba1';  ch = 6  },
    @{ tech = 'Filtered by Voice';           port = 'tuba1';  ch = 7  },
    @{ tech = 'Finger Modes KS';             port = 'tuba1';  ch = 8  },
    @{ tech = 'Flatterzunge & Voice Unison'; port = 'tuba1';  ch = 9  },
    @{ tech = 'Flatterzunge';                port = 'tuba1';  ch = 10 },
    @{ tech = 'Fortepiano';                  port = 'tuba1';  ch = 11 },
    @{ tech = 'Glissando Menu';              port = 'tuba1';  ch = 12 },
    @{ tech = 'High Register Ordinario';     port = 'tuba1';  ch = 13 },
    @{ tech = 'Mute Ordinario';              port = 'tuba1';  ch = 14 },
    @{ tech = 'Ord & Flatterzunge KS';       port = 'tuba1';  ch = 15 },
    @{ tech = 'Pedal Tone';                  port = 'tuba1';  ch = 16 },
    @{ tech = 'Play & Sing KS';              port = 'tuba1b'; ch = 1  },
    @{ tech = 'Quartertones Ordinario';      port = 'tuba1b'; ch = 2  },
    @{ tech = 'Single Tonguing';             port = 'tuba1b'; ch = 3  },
    @{ tech = 'Staccato';                    port = 'tuba1b'; ch = 4  },
    @{ tech = 'Trills KS';                   port = 'tuba1b'; ch = 5  }
)

# Open one handle per unique port
$handles = @{}
foreach ($p in ($techs | ForEach-Object { $_.port } | Sort-Object -Unique)) {
    $idx = [MidiOut]::Find($p)
    if ($idx -lt 0) { Write-Error "loopMIDI port '$p' not found - is loopMIDI running?"; exit 1 }
    $h = [IntPtr]::Zero
    $rc = [MidiOut]::midiOutOpen([ref]$h, [uint32]$idx, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    if ($rc -ne 0) { Write-Error "midiOutOpen failed for '$p' (rc=$rc)"; exit 1 }
    $handles[$p] = $h
    Write-Host "Opened port: $p (device $idx)"
}

# Build the schedule: t=0 at the FIRST noteOn (analyzer aligns to first audio onset)
$schedule = @()
$t = 0
$eventIdx = 0
foreach ($tq in $techs) {
    foreach ($pitch in $Pitches) {
        $schedule += @{ idx = $eventIdx; tech = $tq.tech; port = $tq.port; channel = $tq.ch
                        pitch = $pitch; velocity = $Velocity; onMs = $t; offMs = $t + $HoldMs }
        $eventIdx++
        $t = $t + $HoldMs + $GapMs
    }
}
$meta = @{ created = (Get-Date).ToString('o'); holdMs = $HoldMs; gapMs = $GapMs
           pitches = $Pitches; velocity = $Velocity; totalSec = [math]::Round($t / 1000.0, 1)
           events = $schedule }
$schedPath = Join-Path $PSScriptRoot 'last_schedule.json'
$meta | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $schedPath
Write-Host ("Schedule: {0} events, {1:n1} min. Written to {2}" -f $schedule.Count, ($t / 60000.0), $schedPath)

# Flatten to timed messages and play with drift-free absolute timing
$msgs = @()
foreach ($ev in $schedule) {
    $on  = 0x90 -bor ($ev.channel - 1) -bor ($ev.pitch -shl 8) -bor ($ev.velocity -shl 16)
    $off = 0x80 -bor ($ev.channel - 1) -bor ($ev.pitch -shl 8)
    $msgs += @{ t = $ev.onMs;  port = $ev.port; msg = $on;  label = ("ON  {0}  p{1}" -f $ev.tech, $ev.pitch) }
    $msgs += @{ t = $ev.offMs; port = $ev.port; msg = $off; label = '' }
}
$msgs = $msgs | Sort-Object { $_.t }

Write-Host ("Lead-in {0}s ..." -f ($LeadInMs / 1000.0))
Start-Sleep -Milliseconds $LeadInMs
$sw = [System.Diagnostics.Stopwatch]::StartNew()
foreach ($m in $msgs) {
    $wait = $m.t - $sw.ElapsedMilliseconds
    if ($wait -gt 0) { Start-Sleep -Milliseconds $wait }
    [MidiOut]::midiOutShortMsg($handles[$m.port], [uint32]$m.msg) | Out-Null
    if ($m.label) { Write-Host ("{0,8:n1}s  {1}" -f ($sw.ElapsedMilliseconds / 1000.0), $m.label) }
}
Start-Sleep -Milliseconds 1000
foreach ($h in $handles.Values) { [MidiOut]::midiOutClose($h) | Out-Null }
Write-Host 'Done. Stop the Reaper recording, then run: python probes/analyze_sample_lengths.py <path-to-wav>'
