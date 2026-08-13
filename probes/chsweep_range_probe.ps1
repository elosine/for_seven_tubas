# chsweep_range_probe.ps1 - pitch ladder on selected tuba1 slots: which pitches speak?
# Slots 5,6,7,8,12 x pitches 24,36,48,60 (covers UVI-display C0/C1/C2/C3 and
# Reaper-display C1/C2/C3/C4 conventions in one pass).
param(
    [int[]]$Slots = @(5, 6, 7, 8, 12),
    [int[]]$Pitches = @(24, 36, 48, 60),
    [int]$Velocity = 100,
    [int]$NoteMs = 900,
    [int]$GapMs = 400,
    [int]$SlotGapMs = 1200,
    [int]$LeadInMs = 3000
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MidiOut2 {
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
            if (c.szPname == name) return (int)i;
        }
        return -1;
    }
}
'@

$labels = @{ 5 = 'Cuivre'; 6 = 'FX Menu'; 7 = 'Filtered by Voice'; 8 = 'Finger Modes KS'; 12 = 'Glissando Menu' }

$id = [MidiOut2]::Find('tuba1')
if ($id -lt 0) { Write-Host 'PORT NOT FOUND: tuba1'; exit 1 }
$h = [IntPtr]::Zero
[void][MidiOut2]::midiOutOpen([ref]$h, [uint32]$id, [IntPtr]::Zero, [IntPtr]::Zero, 0)

function Send-Msg([int]$status, [int]$d1, [int]$d2) {
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOut2]::midiOutShortMsg($h, $msg)
}

Write-Host ("Range ladder starts in {0} s - per slot: pitches {1}" -f ($LeadInMs / 1000), ($Pitches -join ', '))
Start-Sleep -Milliseconds $LeadInMs

foreach ($slot in $Slots) {
    $ch = $slot - 1
    $name = $labels[$slot]
    if (-not $name) { $name = 'slot ' + $slot }
    Write-Host ("=== A{0}: {1} ===" -f $slot, $name)
    Send-Msg (0xB0 -bor $ch) 7 127
    foreach ($p in $Pitches) {
        Write-Host ("    pitch {0}" -f $p)
        Send-Msg (0x90 -bor $ch) $p $Velocity
        Start-Sleep -Milliseconds $NoteMs
        Send-Msg (0x80 -bor $ch) $p 0
        Start-Sleep -Milliseconds $GapMs
    }
    Start-Sleep -Milliseconds $SlotGapMs
}
[void][MidiOut2]::midiOutClose($h)
Write-Host 'Ladder done.'
