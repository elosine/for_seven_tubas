# sample_length_probe.ps1 - TRUE sample lengths for the one-shot articulations,
# same method as the 2026-08-10 cresc probe: hold long, let the sample end
# itself, then analyze the recording against the emitted schedule.
#
# ONE port (tuba1), one Reaper track, one recording:
#   FORTEPIANO  ch 11, MIDI 30-65 (36 notes)
#   CUIVRE      ch  5, MIDI 60-67 ( 8 notes)
# Every note is held for HoldMs then given GapMs of silence, so the analyzer can
# see where the sample dies on its own. No cue tones: the analyzer aligns from
# probes/last_schedule.json, and extra audio would corrupt that alignment.
#
# Run:   powershell -ExecutionPolicy Bypass -File probes\sample_length_probe.ps1
# Then:  python probes\analyze_sample_lengths.py <recording.wav>
#
# Total run: about 5 minutes (44 notes x 7 s).

param(
    [int]$HoldMs = 5000,       # generous: fp/cuivre are expected to die well inside this
    [int]$GapMs = 2000,        # tail room before the next note
    [int]$Velocity = 110,
    [int]$LeadInMs = 5000
)
$Port = 'tuba1'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MidiOutSL {
    [DllImport("winmm.dll")] public static extern uint midiOutGetNumDevs();
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public struct MIDIOUTCAPS {
        public ushort wMid; public ushort wPid; public uint vDriverVersion;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string szPname;
        public ushort wTechnology; public ushort wVoices; public ushort wNotes;
        public ushort wChannelMask; public uint dwSupport;
    }
    [DllImport("winmm.dll", CharSet = CharSet.Ansi)]
    public static extern uint midiOutGetDevCaps(uint uDeviceID, out MIDIOUTCAPS caps, uint cbCaps);
    [DllImport("winmm.dll")] public static extern uint midiOutOpen(out IntPtr handle, uint id, IntPtr cb, IntPtr inst, uint flags);
    [DllImport("winmm.dll")] public static extern uint midiOutShortMsg(IntPtr handle, uint msg);
    [DllImport("winmm.dll")] public static extern uint midiOutClose(IntPtr handle);
    public static int Find(string name) {
        uint n = midiOutGetNumDevs();
        for (uint i = 0; i < n; i++) {
            MIDIOUTCAPS c;
            midiOutGetDevCaps(i, out c, (uint)Marshal.SizeOf(typeof(MIDIOUTCAPS)));
            if (c.szPname == name) { return (int)i; }
        }
        return -1;
    }
}
'@

$names = @('C','C#','D','D#','E','F','F#','G','G#','A','A#','B')
function NoteName([int]$m) { return $names[$m % 12] + [string]([math]::Floor($m / 12) - 1) }

$id = [MidiOutSL]::Find($Port)
if ($id -lt 0) { Write-Host "PORT NOT FOUND: $Port" -ForegroundColor Red; exit 1 }
$h = [IntPtr]::Zero
[void][MidiOutSL]::midiOutOpen([ref]$h, [uint32]$id, [IntPtr]::Zero, [IntPtr]::Zero, 0)
function Send([int]$status, [int]$d1, [int]$d2) {
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOutSL]::midiOutShortMsg($h, $msg)
}

# CC7 full + all-notes-off on every channel (residue guard)
foreach ($ch in 0..15) { Send (0xB0 -bor $ch) 7 127; Send (0xB0 -bor $ch) 123 0 }

# ---- build the schedule (analyzer ground truth) ----
$sections = @(
    @{ tech = 'Fortepiano'; channel = 11; lo = 30; hi = 65 },
    @{ tech = 'Cuivre';     channel = 5;  lo = 60; hi = 67 }
)
$schedule = @()
$t = 1000
$i = 0
foreach ($sec in $sections) {
    for ($p = $sec.lo; $p -le $sec.hi; $p++) {
        $schedule += @{ idx = $i; tech = $sec.tech; port = $Port; channel = $sec.channel
                        pitch = $p; velocity = $Velocity; onMs = $t; offMs = $t + $HoldMs }
        $i++
        $t = $t + $HoldMs + $GapMs
    }
}
$pitchDesc = 'fp 30-65 + cuivre 60-67'
$meta = @{ created = (Get-Date).ToString('o'); holdMs = $HoldMs; gapMs = $GapMs
           pitches = $pitchDesc; velocity = $Velocity; port = $Port; outName = 'SI2_oneshot_lengths'
           events = $schedule }
$schedPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'last_schedule.json'
$meta | ConvertTo-Json -Depth 5 | Set-Content -Path $schedPath -Encoding utf8
Write-Host "Schedule written: $schedPath  ($($schedule.Count) events)" -ForegroundColor DarkGray

Write-Host ''
Write-Host '================ SAMPLE-LENGTH SURVEY ================' -ForegroundColor Yellow
Write-Host "Port $Port : FORTEPIANO ch 11 (MIDI 30-65) then CUIVRE ch 5 (MIDI 60-67)"
Write-Host ("Hold {0} ms, gap {1} ms - about {2:N1} minutes total." -f $HoldMs, $GapMs, (($schedule.Count * ($HoldMs + $GapMs) + 1000) / 60000))
Write-Host 'Arm + RECORD the tuba1 track in Reaper now.'
Write-Host ("Starting in {0} s ..." -f ($LeadInMs / 1000))
Start-Sleep -Milliseconds $LeadInMs

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$lastTech = ''
foreach ($ev in $schedule) {
    if ($ev.tech -ne $lastTech) {
        Write-Host ''
        Write-Host ("=== {0}  (ch {1}) ===" -f $ev.tech, $ev.channel) -ForegroundColor Cyan
        $lastTech = $ev.tech
    }
    # keep the sender locked to the schedule clock (no cumulative drift)
    $wait = $ev.onMs - $sw.ElapsedMilliseconds
    if ($wait -gt 0) { Start-Sleep -Milliseconds $wait }
    $chz = $ev.channel - 1
    Write-Host ("  {0,-5} MIDI {1,3}   sched {2,7:N2}s   actual {3,7:N2}s" -f `
        (NoteName $ev.pitch), $ev.pitch, ($ev.onMs / 1000), ($sw.ElapsedMilliseconds / 1000))
    Send (0x90 -bor $chz) $ev.pitch $Velocity
    $offWait = $ev.offMs - $sw.ElapsedMilliseconds
    if ($offWait -gt 0) { Start-Sleep -Milliseconds $offWait }
    Send (0x80 -bor $chz) $ev.pitch 0
}

Start-Sleep -Milliseconds $GapMs
foreach ($ch in 0..15) { Send (0xB0 -bor $ch) 123 0 }
[void][MidiOutSL]::midiOutClose($h)
Write-Host ''
Write-Host 'DONE - stop the recording.' -ForegroundColor Green
Write-Host 'Then: python probes\analyze_sample_lengths.py <recording.wav>'
