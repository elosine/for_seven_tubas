# sample_length_probe.ps1 - measure TRUE sample lengths for the one-shot
# articulations, the way the 2026-08-10 cresc probe did (hold long, let the
# sample end itself, read the lengths off the recording).
#
# Sections, each preceded by a 3-note CUE burst so they are findable in the
# waveform:
#   1. FORTEPIANO  ch 11, port tuba1, MIDI 30-65 (36 notes), 6.0 s slots
#   2. CUIVRE      ch  5, port tuba1, MIDI 60-67 ( 8 notes), 6.0 s slots
#   3. STACCATO    ch  4, port tuba1b, MIDI 30-65 (36 notes), 1.5 s slots
#
# Each note is held for (slot - 0.2 s) so our note-off never cuts the sample.
# Total ~5.5 min. Reaper: record tuba1 + tuba1b, then read each note's decay.
#
# Usage:  powershell -ExecutionPolicy Bypass -File probes\sample_length_probe.ps1
#         (optional: -LeadInMs 5000 to give yourself longer to hit record)

param(
    [int]$Velocity = 110,
    [int]$LeadInMs = 5000,
    [double]$FpSlot = 6.0,
    [double]$CuivreSlot = 6.0,
    [double]$StacSlot = 1.5
)

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

function Open-Port([string]$name) {
    $id = [MidiOutSL]::Find($name)
    if ($id -lt 0) { Write-Host "PORT NOT FOUND: $name" -ForegroundColor Red; return [IntPtr]::Zero }
    $h = [IntPtr]::Zero
    [void][MidiOutSL]::midiOutOpen([ref]$h, [uint32]$id, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    return $h
}
function Send([IntPtr]$h, [int]$status, [int]$d1, [int]$d2) {
    if ($h -eq [IntPtr]::Zero) { return }
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOutSL]::midiOutShortMsg($h, $msg)
}
$names = @('C','C#','D','D#','E','F','F#','G','G#','A','A#','B')
function NoteName([int]$m) { return $names[$m % 12] + [string]([math]::Floor($m / 12) - 1) }

$hA = Open-Port 'tuba1'
$hB = Open-Port 'tuba1b'
if ($hA -eq [IntPtr]::Zero) { Write-Host 'tuba1 missing - aborting.' -ForegroundColor Red; exit 1 }

# CC7 full + all-notes-off so nothing residual colours the measurement
foreach ($ch in 0..15) {
    Send $hA (0xB0 -bor $ch) 7 127
    Send $hA (0xB0 -bor $ch) 123 0
    if ($hB -ne [IntPtr]::Zero) { Send $hB (0xB0 -bor $ch) 7 127; Send $hB (0xB0 -bor $ch) 123 0 }
}

function Cue([IntPtr]$h, [int]$ch) {
    # 3 short ticks = section boundary marker in the recording
    for ($i = 0; $i -lt 3; $i++) {
        Send $h (0x90 -bor $ch) 60 100
        Start-Sleep -Milliseconds 120
        Send $h (0x80 -bor $ch) 60 0
        Start-Sleep -Milliseconds 180
    }
    Start-Sleep -Milliseconds 700
}

function Run-Section([string]$label, [IntPtr]$h, [int]$ch1, [int]$lo, [int]$hi, [double]$slot) {
    $chz = $ch1 - 1
    Write-Host ''
    Write-Host "=== $label  (ch $ch1, MIDI $lo-$hi, $slot s slots) ===" -ForegroundColor Cyan
    Cue $h $chz
    $t0 = Get-Date
    for ($m = $lo; $m -le $hi; $m++) {
        $elapsed = ((Get-Date) - $t0).TotalSeconds
        Write-Host ("  {0,-5} MIDI {1,3}   at +{2,7:N2}s" -f (NoteName $m), $m, $elapsed)
        Send $h (0x90 -bor $chz) $m $Velocity
        Start-Sleep -Milliseconds ([int](($slot - 0.2) * 1000))
        Send $h (0x80 -bor $chz) $m 0
        Start-Sleep -Milliseconds 200
    }
}

Write-Host ''
Write-Host '================ SAMPLE-LENGTH SURVEY ================' -ForegroundColor Yellow
Write-Host 'Arm + RECORD tuba1 and tuba1b in Reaper now.'
Write-Host ("Starting in {0} seconds. Each section opens with 3 short ticks." -f ($LeadInMs / 1000))
Write-Host 'Total run: about 5.5 minutes. Stop recording when it says DONE.'
Start-Sleep -Milliseconds $LeadInMs

Run-Section 'FORTEPIANO' $hA 11 30 65 $FpSlot
Run-Section 'CUIVRE'     $hA  5 60 67 $CuivreSlot
if ($hB -ne [IntPtr]::Zero) {
    Run-Section 'STACCATO' $hB 4 30 65 $StacSlot
} else {
    Write-Host 'tuba1b not found - staccato section skipped.' -ForegroundColor Yellow
}

foreach ($ch in 0..15) {
    Send $hA (0xB0 -bor $ch) 123 0
    if ($hB -ne [IntPtr]::Zero) { Send $hB (0xB0 -bor $ch) 123 0 }
}
[void][MidiOutSL]::midiOutClose($hA)
if ($hB -ne [IntPtr]::Zero) { [void][MidiOutSL]::midiOutClose($hB) }
Write-Host ''
Write-Host 'DONE - stop the recording.' -ForegroundColor Green
Write-Host 'Each section: 3 ticks, then one note per slot at the printed offsets.'
