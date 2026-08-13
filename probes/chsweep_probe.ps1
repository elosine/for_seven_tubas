# chsweep_probe.ps1 - channel-slot verification sweep (composer watches UVI light up).
# Plays one note per technique slot in roster order: tuba1 ch 1-16, then tuba1b ch 1-5.
# CC7=127 before each note; 1.4 s note, 0.8 s gap.
param(
    [int]$Pitch = 40,
    [int]$Velocity = 100,
    [int]$NoteMs = 1400,
    [int]$GapMs = 800,
    [int]$LeadInMs = 3000
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

function Open-Port([string]$name) {
    $id = [MidiOut]::Find($name)
    if ($id -lt 0) { Write-Host "PORT NOT FOUND: $name"; return [IntPtr]::Zero }
    $h = [IntPtr]::Zero
    [void][MidiOut]::midiOutOpen([ref]$h, [uint32]$id, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    return $h
}
function Send-Msg([IntPtr]$h, [int]$status, [int]$d1, [int]$d2) {
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOut]::midiOutShortMsg($h, $msg)
}

$h1 = Open-Port 'tuba1'
$h2 = Open-Port 'tuba1b'
if ($h1 -eq [IntPtr]::Zero -or $h2 -eq [IntPtr]::Zero) { exit 1 }

$slots = @(
    @{ port = 'a'; ch = 1;  label = 'Ordinario' },
    @{ port = 'a'; ch = 2;  label = 'Bisbigliando' },
    @{ port = 'a'; ch = 3;  label = 'Chromatic Scale' },
    @{ port = 'a'; ch = 4;  label = 'Cresc-Decr KS' },
    @{ port = 'a'; ch = 5;  label = 'Cuivre' },
    @{ port = 'a'; ch = 6;  label = 'FX Menu' },
    @{ port = 'a'; ch = 7;  label = 'Filtered by Voice' },
    @{ port = 'a'; ch = 8;  label = 'Finger Modes KS' },
    @{ port = 'a'; ch = 9;  label = 'Flz Voice Unison' },
    @{ port = 'a'; ch = 10; label = 'Flatterzunge' },
    @{ port = 'a'; ch = 11; label = 'Fortepiano' },
    @{ port = 'a'; ch = 12; label = 'Glissando Menu' },
    @{ port = 'a'; ch = 13; label = 'High Register Ord' },
    @{ port = 'a'; ch = 14; label = 'Mute Ordinario' },
    @{ port = 'a'; ch = 15; label = 'Ord-Flz KS' },
    @{ port = 'a'; ch = 16; label = 'Pedal Tone' },
    @{ port = 'b'; ch = 1;  label = 'Play-Sing KS (b)' },
    @{ port = 'b'; ch = 2;  label = 'Quartertones (b)' },
    @{ port = 'b'; ch = 3;  label = 'Single Tonguing (b)' },
    @{ port = 'b'; ch = 4;  label = 'Staccato (b)' },
    @{ port = 'b'; ch = 5;  label = 'Trills KS (b)' }
)

Write-Host ("Sweep starts in {0} s - watch Tuba1 slots 1-16, then Tuba1b slots 1-5..." -f ($LeadInMs / 1000))
Start-Sleep -Milliseconds $LeadInMs

$i = 0
foreach ($s in $slots) {
    $i++
    $h = if ($s.port -eq 'a') { $h1 } else { $h2 }
    $chBits = $s.ch - 1
    Write-Host ("slot {0,2}: {1}" -f $i, $s.label)
    Send-Msg $h (0xB0 -bor $chBits) 7 127
    Send-Msg $h (0x90 -bor $chBits) $Pitch $Velocity
    Start-Sleep -Milliseconds $NoteMs
    Send-Msg $h (0x80 -bor $chBits) $Pitch 0
    Start-Sleep -Milliseconds $GapMs
}

[void][MidiOut]::midiOutClose($h1)
[void][MidiOut]::midiOutClose($h2)
Write-Host 'Sweep done.'
