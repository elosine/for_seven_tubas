# cresc_length_probe.ps1 - crescendo sample-length probe (Tuba Cresc & Decrescendo KS).
# ONE patch only: port tuba1, channel 4 (slot A4). Before EVERY note a short silent
# keyswitch tap on UVI-display C#0 (MIDI 25) selects "cresc with tail". Then a
# chromatic walk: every semitone FromPitch..ToPitch held HoldMs at Velocity.
# Schedule written to last_schedule.json (analyzer ground truth).
param(
    [int]$FromPitch = 29,      # UVI display F0 (composer-dictated range)
    [int]$ToPitch = 64,        # UVI display E3
    [int]$HoldMs = 15000,
    [int]$GapMs = 3000,        # tail needs room to ring out
    [int]$KsPitch = 25,        # UVI display C#0 = "cresc with tail"
    [int]$LeadInMs = 3000,
    [int]$Velocity = 100
)
$Port = 'tuba1'
$Channel = 4
$Tech = 'Cresc & Decrescendo KS (C#0 tail)'

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
if ($idx -lt 0) { Write-Error "loopMIDI port '$Port' not found - is loopMIDI running?"; exit 1 }
$h = [IntPtr]::Zero
$rc = [MidiOut]::midiOutOpen([ref]$h, [uint32]$idx, [IntPtr]::Zero, [IntPtr]::Zero, 0)
if ($rc -ne 0) { Write-Error "midiOutOpen failed (rc=$rc)"; exit 1 }
Write-Host "Opened port: $Port (device $idx)"

# Schedule: first test note at t=1000ms (KS tap precedes each note by 700ms)
$schedule = @()
$t = 1000
$i = 0
for ($p = $FromPitch; $p -le $ToPitch; $p++) {
    $schedule += @{ idx = $i; tech = $Tech; port = $Port; channel = $Channel
                    pitch = $p; velocity = $Velocity; onMs = $t; offMs = $t + $HoldMs }
    $i++
    $t = $t + $HoldMs + $GapMs
}
$meta = @{ created = (Get-Date).ToString('o'); holdMs = $HoldMs; gapMs = $GapMs
           pitches = @($FromPitch, $ToPitch); velocity = $Velocity
           ksPitch = $KsPitch; totalSec = [math]::Round($t / 1000.0, 1); events = $schedule }
$schedPath = Join-Path $PSScriptRoot 'last_schedule.json'
$meta | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $schedPath
Write-Host ("Schedule: {0} notes ({1}..{2}), {3:n1} min. Written to {4}" -f $schedule.Count, $FromPitch, $ToPitch, ($t / 60000.0), $schedPath)

$ch0 = $Channel - 1
$msgs = @()
foreach ($ev in $schedule) {
    $ksOn  = 0x90 -bor $ch0 -bor ($KsPitch -shl 8) -bor (100 -shl 16)
    $ksOff = 0x80 -bor $ch0 -bor ($KsPitch -shl 8)
    $on    = 0x90 -bor $ch0 -bor ($ev.pitch -shl 8) -bor ($ev.velocity -shl 16)
    $off   = 0x80 -bor $ch0 -bor ($ev.pitch -shl 8)
    $msgs += @{ t = $ev.onMs - 700; msg = $ksOn;  label = '' }
    $msgs += @{ t = $ev.onMs - 500; msg = $ksOff; label = '' }
    $msgs += @{ t = $ev.onMs;  msg = $on;  label = ("ON  pitch {0}" -f $ev.pitch) }
    $msgs += @{ t = $ev.offMs; msg = $off; label = '' }
}
$msgs = $msgs | Sort-Object { $_.t }

Write-Host ("Lead-in {0}s ..." -f ($LeadInMs / 1000.0))
Start-Sleep -Milliseconds $LeadInMs
$sw = [System.Diagnostics.Stopwatch]::StartNew()
foreach ($m in $msgs) {
    $wait = $m.t - $sw.ElapsedMilliseconds
    if ($wait -gt 0) { Start-Sleep -Milliseconds $wait }
    [MidiOut]::midiOutShortMsg($h, [uint32]$m.msg) | Out-Null
    if ($m.label) { Write-Host ("{0,8:n1}s  {1}" -f ($sw.ElapsedMilliseconds / 1000.0), $m.label) }
}
Start-Sleep -Milliseconds 1000
[MidiOut]::midiOutClose($h) | Out-Null
Write-Host 'Done. Stop the Reaper recording, then say analyze.'
