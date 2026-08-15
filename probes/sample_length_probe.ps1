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
    [int]$StacHoldMs = 1200,
    [int]$StacGapMs = 900,
    [int]$Velocity = 110,
    [int]$LeadInMs = 5000,
    [switch]$StaccatoOnly
)
$PortA = 'tuba1'
$PortB = 'tuba1b'

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

function Open-Port([string]$name) {
    $devId = [MidiOutSL]::Find($name)
    if ($devId -lt 0) { Write-Host "PORT NOT FOUND: $name" -ForegroundColor Red; return [IntPtr]::Zero }
    $hh = [IntPtr]::Zero
    [void][MidiOutSL]::midiOutOpen([ref]$hh, [uint32]$devId, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    return $hh
}
$hA = Open-Port $PortA
$hB = Open-Port $PortB
if ($hA -eq [IntPtr]::Zero -or $hB -eq [IntPtr]::Zero) { Write-Host 'need both tuba1 and tuba1b' -ForegroundColor Red; exit 1 }
function Send([IntPtr]$hh, [int]$status, [int]$d1, [int]$d2) {
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOutSL]::midiOutShortMsg($hh, $msg)
}
foreach ($ch in 0..15) {
    Send $hA (0xB0 -bor $ch) 7 127; Send $hA (0xB0 -bor $ch) 123 0
    Send $hB (0xB0 -bor $ch) 7 127; Send $hB (0xB0 -bor $ch) 123 0
}

# ---- build the schedule (analyzer ground truth) ----
$sections = @(
    @{ tech = 'Fortepiano'; port = $PortA; channel = 11; lo = 30; hi = 65; hold = $HoldMs;     gap = $GapMs },
    @{ tech = 'Cuivre';     port = $PortA; channel = 5;  lo = 60; hi = 67; hold = $HoldMs;     gap = $GapMs },
    @{ tech = 'Staccato';   port = $PortB; channel = 4;  lo = 30; hi = 65; hold = $StacHoldMs; gap = $StacGapMs }
)
$schedule = @()
$t = 1000
$i = 0
foreach ($sec in $sections) {
    for ($p = $sec.lo; $p -le $sec.hi; $p++) {
        $schedule += @{ idx = $i; tech = $sec.tech; port = $sec.port; channel = $sec.channel
                        pitch = $p; velocity = $Velocity; onMs = $t; offMs = $t + $sec.hold }
        $i++
        $t = $t + $sec.hold + $sec.gap
    }
}
if ($StaccatoOnly) {
    $schedule = @($schedule | Where-Object { $_.tech -eq 'Staccato' })
    $base = $schedule[0].onMs - 1000
    foreach ($e in $schedule) { $e.onMs = $e.onMs - $base; $e.offMs = $e.offMs - $base }
}
$pitchDesc = 'fp 30-65 + cuivre 60-67'
$meta = @{ created = (Get-Date).ToString('o'); holdMs = $HoldMs; gapMs = $GapMs
           pitches = $pitchDesc; velocity = $Velocity; port = $Port; outName = 'SI2_oneshot_lengths'
           events = $schedule }
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$evA = @($schedule | Where-Object { $_.port -eq $PortA })
$evB = @($schedule | Where-Object { $_.port -eq $PortB })
if ($evA.Count) {
    @{ created = (Get-Date).ToString('o'); holdMs = $HoldMs; gapMs = $GapMs
       pitches = 'fp 30-65 + cuivre 60-67'; velocity = $Velocity; port = $PortA
       outName = 'SI2_oneshot_lengths'; events = $evA } |
      ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $dir 'last_schedule.json') -Encoding utf8
}
if ($evB.Count) {
    @{ created = (Get-Date).ToString('o'); holdMs = $StacHoldMs; gapMs = $StacGapMs
       pitches = 'staccato 30-65'; velocity = $Velocity; port = $PortB
       outName = 'SI2_staccato_lengths'; events = $evB } |
      ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $dir 'last_schedule_stac.json') -Encoding utf8
}
Write-Host "Schedules: $($evA.Count) tuba1 events, $($evB.Count) tuba1b events" -ForegroundColor DarkGray

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
    $hh = if ($ev.port -eq $PortB) { $hB } else { $hA }
    Write-Host ("  {0,-5} MIDI {1,3}   sched {2,7:N2}s   actual {3,7:N2}s" -f `
        (NoteName $ev.pitch), $ev.pitch, ($ev.onMs / 1000), ($sw.ElapsedMilliseconds / 1000))
    Send $hh (0x90 -bor $chz) $ev.pitch $Velocity
    $offWait = $ev.offMs - $sw.ElapsedMilliseconds
    if ($offWait -gt 0) { Start-Sleep -Milliseconds $offWait }
    Send $hh (0x80 -bor $chz) $ev.pitch 0
}

Start-Sleep -Milliseconds $GapMs
foreach ($ch in 0..15) { Send $hA (0xB0 -bor $ch) 123 0; Send $hB (0xB0 -bor $ch) 123 0 }
[void][MidiOutSL]::midiOutClose($hA)
[void][MidiOutSL]::midiOutClose($hB)
Write-Host ''
Write-Host 'DONE - stop the recording.' -ForegroundColor Green
Write-Host 'Then: analyze tuba1 wav vs last_schedule.json, tuba1b wav vs last_schedule_stac.json'
