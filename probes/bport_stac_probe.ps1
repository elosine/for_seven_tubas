# bport_stac_probe.ps1 - one staccato note (ch 4) on each b port, tuba1b..tuba10b.
param(
    [int]$Pitch = 45,
    [int]$Velocity = 110,
    [int]$NoteMs = 500,
    [int]$GapMs = 700,
    [int]$LeadInMs = 2500
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MidiOut3 {
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

Write-Host ("Staccato b-port probe in {0} s: tuba1b..tuba10b, ch 4, one note each" -f ($LeadInMs / 1000))
Start-Sleep -Milliseconds $LeadInMs

for ($n = 1; $n -le 10; $n++) {
    $port = "tuba{0}b" -f $n
    $id = [MidiOut3]::Find($port)
    if ($id -lt 0) { Write-Host ("{0}: PORT NOT FOUND" -f $port); continue }
    $h = [IntPtr]::Zero
    [void][MidiOut3]::midiOutOpen([ref]$h, [uint32]$id, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    Write-Host ("{0}: note" -f $port)
    $ch = 3
    [void][MidiOut3]::midiOutShortMsg($h, [uint32](0xB0 -bor $ch -bor (7 -shl 8) -bor (127 -shl 16)))
    [void][MidiOut3]::midiOutShortMsg($h, [uint32](0x90 -bor $ch -bor ($Pitch -shl 8) -bor ($Velocity -shl 16)))
    Start-Sleep -Milliseconds $NoteMs
    [void][MidiOut3]::midiOutShortMsg($h, [uint32](0x80 -bor $ch -bor ($Pitch -shl 8)))
    [void][MidiOut3]::midiOutClose($h)
    Start-Sleep -Milliseconds $GapMs
}
Write-Host 'B-port probe done.'
