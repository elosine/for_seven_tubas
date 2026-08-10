# ceiling_probe.ps1 - gain-staging ceiling stimulus (GAIN_STAGING.md).
# Sustained mid note, velocity 127 + CC7 127: the loudest normal playing state.
param(
    [string]$Port = 'tuba1',
    [int]$Channel = 1,
    [int]$Pitch = 45,
    [int]$HoldMs = 4000,
    [int]$LeadInMs = 2000
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
$idx = [MidiOut]::Find($Port)
if ($idx -lt 0) { Write-Error "port '$Port' not found"; exit 1 }
$h = [IntPtr]::Zero
if ([MidiOut]::midiOutOpen([ref]$h, [uint32]$idx, [IntPtr]::Zero, [IntPtr]::Zero, 0) -ne 0) { Write-Error 'open failed'; exit 1 }
$ch0 = $Channel - 1
Write-Host ("Ceiling stimulus on {0} ch{1}: pitch {2}, vel 127, CC7 127, {3}s (after {4}s lead-in)" -f $Port, $Channel, $Pitch, ($HoldMs/1000.0), ($LeadInMs/1000.0))
Start-Sleep -Milliseconds $LeadInMs
[MidiOut]::midiOutShortMsg($h, [uint32](0xB0 -bor $ch0 -bor (7 -shl 8) -bor (127 -shl 16))) | Out-Null
Start-Sleep -Milliseconds 150
[MidiOut]::midiOutShortMsg($h, [uint32](0x90 -bor $ch0 -bor ($Pitch -shl 8) -bor (127 -shl 16))) | Out-Null
Start-Sleep -Milliseconds $HoldMs
[MidiOut]::midiOutShortMsg($h, [uint32](0x80 -bor $ch0 -bor ($Pitch -shl 8))) | Out-Null
Start-Sleep -Milliseconds 800
[MidiOut]::midiOutClose($h) | Out-Null
Write-Host 'Done. Stop recording, then: python probes/measure_rms.py <wav>'
