# cc7_calibration_probe.ps1 - E0: measure UVI CC#7 -> dB transfer (Ordinario, tuba1 ch1).
# 33 steps CC7 0..127; each step: set CC7, settle, retrigger a short note (fresh sample
# each time so natural decay never contaminates the level reading).
param(
    [int]$Pitch = 45,          # UVI display A0-ish mid-low; well inside F0-E3
    [int]$Velocity = 100,
    [int]$NoteMs = 700,
    [int]$SettleMs = 200,
    [int]$GapMs = 400,
    [int]$LeadInMs = 3000
)
$Port = 'tuba1'
$Channel = 1

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
if ($idx -lt 0) { Write-Error "loopMIDI port '$Port' not found"; exit 1 }
$h = [IntPtr]::Zero
if ([MidiOut]::midiOutOpen([ref]$h, [uint32]$idx, [IntPtr]::Zero, [IntPtr]::Zero, 0) -ne 0) { Write-Error 'midiOutOpen failed'; exit 1 }
Write-Host "Opened port: $Port (device $idx)"

$ccValues = @()
for ($v = 0; $v -le 124; $v += 4) { $ccValues += $v }
$ccValues += 127

$stepMs = $SettleMs + $NoteMs + $GapMs
$schedule = @()
$t = 1000
$i = 0
foreach ($cc in $ccValues) {
    $schedule += @{ idx = $i; tech = 'CC7 calibration (Ordinario)'; port = $Port; channel = $Channel
                    pitch = $Pitch; velocity = $Velocity; cc7 = $cc
                    onMs = $t + $SettleMs; offMs = $t + $SettleMs + $NoteMs }
    $i++
    $t += $stepMs
}
$meta = @{ created = (Get-Date).ToString('o'); holdMs = $NoteMs; gapMs = $GapMs
           pitches = @($Pitch); velocity = $Velocity; kind = 'cc7_calibration'
           totalSec = [math]::Round(($t + 1000) / 1000.0, 1); events = $schedule }
$schedPath = Join-Path $PSScriptRoot 'last_schedule.json'
$meta | ConvertTo-Json -Depth 5 | Out-File -Encoding utf8 $schedPath
Write-Host ("Schedule: {0} steps, {1:n1} s total. Written to {2}" -f $schedule.Count, (($t + 1000) / 1000.0), $schedPath)

$ch0 = $Channel - 1
$msgs = @()
foreach ($ev in $schedule) {
    $ccMsg = 0xB0 -bor $ch0 -bor (7 -shl 8) -bor ($ev.cc7 -shl 16)
    $on  = 0x90 -bor $ch0 -bor ($ev.pitch -shl 8) -bor ($ev.velocity -shl 16)
    $off = 0x80 -bor $ch0 -bor ($ev.pitch -shl 8)
    $msgs += @{ t = $ev.onMs - $SettleMs; msg = $ccMsg; label = ("CC7 = {0}" -f $ev.cc7) }
    $msgs += @{ t = $ev.onMs;  msg = $on;  label = '' }
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
    if ($m.label) { Write-Host ("{0,7:n1}s  {1}" -f ($sw.ElapsedMilliseconds / 1000.0), $m.label) }
}
# restore CC7 to full
[MidiOut]::midiOutShortMsg($h, [uint32](0xB0 -bor $ch0 -bor (7 -shl 8) -bor (127 -shl 16))) | Out-Null
Start-Sleep -Milliseconds 500
[MidiOut]::midiOutClose($h) | Out-Null
Write-Host 'Done. Stop the Reaper recording, then say analyze.'
