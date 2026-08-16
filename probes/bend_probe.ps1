# bend_probe.ps1 — PLAN 2v Phase 0. The pitch-bend probe suite for SI2 tuba.
#
# Follows the established probe pattern (sample_length_probe.ps1): winmm MIDI out
# to the loopMIDI ports, a schedule written to JSON as analyzer ground truth, a
# lead-in so the composer can arm Reaper, and a stopwatch-locked sender so there
# is no cumulative drift.
#
#   powershell -ExecutionPolicy Bypass -File probes\bend_probe.ps1 -Probe 0
#   powershell -ExecutionPolicy Bypass -File probes\bend_probe.ps1 -Probe all
#   python probes\analyze_bend_probe.py <recording.wav>
#
# PROBES (docs/plans/MORPHING_CHORDS.md §8):
#   0  bend HYGIENE   -> BEND_PREARM_S, RESET_GAP_S, verified stop sequence
#   1  bend RESPONSE  -> BEND_RANGE_ST, does the patch honour RPN 0
#   2  QUARTERTONES   -> how the quartertones patch maps vs ord
#   3  bend QUALITY   -> composer listens for resampling artifacts on ramps
#
# THE SCHEDULE HAS TWO PARTS, and that is the whole design:
#   actions = every MIDI message with an absolute time. The sender is one loop
#             over these and knows nothing about which probe it is running.
#   slots   = the windows the ANALYZER should measure, each carrying what we
#             expect. Adding a probe = adding actions + slots, never sender code.

param(
    [ValidateSet('0', '1', '2', '3', 'all')]
    [string]$Probe = 'all',
    [int]$LeadInMs = 5000,
    [int]$Velocity = 100,
    [int]$Pitch = 46,              # A#2 — mid-range, strong fundamental, well inside every patch
    [switch]$DryRun                # build + write the schedule, send nothing
)

$PortA = 'tuba1'      # ord = channel 1
$PortB = 'tuba1b'     # quartertones = channel 2
$ORD_CH = 1
$QT_CH = 2
$SETTLE = 2000        # silence between slots so the analyzer can segment cleanly
$NOTE_MS = 2000       # standard sounding length for a measured slot
$BEND_RANGE_ASSUMED = 2.0   # semitones. Probe 1 MEASURES this; everything else
                            # is expressed in raw 14-bit values so a wrong
                            # assumption here cannot corrupt the measurement.

# ---------- MIDI out (winmm), same P/Invoke as the other probes ----------
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MidiOutBend {
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

$names = @('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B')
function NoteName([int]$m) { return $names[$m % 12] + [string]([math]::Floor($m / 12) - 1) }

# cents -> 14-bit bend value, at an ASSUMED range. Probe 1 exists to replace the
# assumption with a measurement; see the analyzer's derived range.
function BendValue([double]$cents, [double]$rangeSt) {
    $v = [math]::Round(8192 + ($cents / (100.0 * $rangeSt)) * 8192)
    if ($v -lt 0) { $v = 0 }
    if ($v -gt 16383) { $v = 16383 }
    return [int]$v
}

# ---------- schedule builders ----------
$actions = @()
$slots = @()
$t = 1000
$slotIdx = 0

function Add-Action([int]$tMs, [string]$type, [string]$port, [int]$channel, [int]$d1, [int]$d2) {
    $script:actions += @{ tMs = $tMs; type = $type; port = $port; channel = $channel; d1 = $d1; d2 = $d2 }
}
function Add-Bend([int]$tMs, [string]$port, [int]$channel, [int]$value) {
    Add-Action $tMs 'bend' $port $channel ($value -band 0x7F) (($value -shr 7) -band 0x7F)
}
# One measured slot: optional pre-arm bend, note on, optional mid-note bend, note off.
# Returns the time the slot ends (before SETTLE).
function Add-Slot {
    param(
        [string]$probe, [string]$step, [string]$label,
        [string]$port, [int]$channel, [int]$pitch,
        [int]$durMs = $NOTE_MS,
        [System.Nullable[int]]$preBendValue = $null, [int]$preBendLeadMs = 150,
        [System.Nullable[int]]$midBendValue = $null, [int]$midBendAtMs = 1000,
        [System.Nullable[int]]$postBendValue = $null, [int]$postBendAfterMs = 0,
        [string]$expect = '', [double]$expectCents = [double]::NaN,
        [double]$bendFraction = [double]::NaN
    )
    $on = $script:t
    if ($null -ne $preBendValue) { Add-Bend ($on - $preBendLeadMs) $port $channel $preBendValue }
    Add-Action $on 'note_on' $port $channel $pitch $script:Velocity
    if ($null -ne $midBendValue) { Add-Bend ($on + $midBendAtMs) $port $channel $midBendValue }
    $off = $on + $durMs
    Add-Action $off 'note_off' $port $channel $pitch 0
    if ($null -ne $postBendValue) { Add-Bend ($off + $postBendAfterMs) $port $channel $postBendValue }

    $script:slots += @{
        idx = $script:slotIdx; probe = $probe; step = $step; label = $label
        port = $port; channel = $channel; pitch = $pitch
        onMs = $on; offMs = $off
        preBendValue = $preBendValue; preBendLeadMs = $preBendLeadMs
        midBendValue = $midBendValue; midBendAtMs = $midBendAtMs
        postBendValue = $postBendValue; postBendAfterMs = $postBendAfterMs
        expect = $expect; expectCents = $expectCents; bendFraction = $bendFraction
    }
    $script:slotIdx++
    $script:t = $off + $SETTLE
    return $off
}
function Say([string]$msg) { Write-Host $msg -ForegroundColor DarkGray }

$CENTER = 8192
$runAll = ($Probe -eq 'all')

# =====================================================================
# PROBE 0 — BEND HYGIENE. Order matters: reproduce the trap, then kill it.
# =====================================================================
if ($runAll -or $Probe -eq '0') {
    # 0.1 reference — the unbent baseline every other cents figure is measured against
    Add-Bend ($t - 300) $PortA $ORD_CH $CENTER
    [void](Add-Slot -probe '0' -step '0.1' -label 'REFERENCE unbent' -port $PortA -channel $ORD_CH -pitch $Pitch `
        -expect 'baseline' -expectCents 0)

    # 0.2 RESIDUE DEMO — bend up, sound it, note off, DO NOT RESET, then a fresh
    # note. If the second note comes out sharp, the trap is real and quantified.
    $v50 = BendValue 50 $BEND_RANGE_ASSUMED
    [void](Add-Slot -probe '0' -step '0.2a' -label 'residue: bent note (+50c nominal)' -port $PortA -channel $ORD_CH -pitch $Pitch `
        -preBendValue $v50 -preBendLeadMs 250 -expect 'bent' -expectCents 50 -bendFraction (($v50 - $CENTER) / 8192.0))
    [void](Add-Slot -probe '0' -step '0.2b' -label 'residue: NEXT note, no reset' -port $PortA -channel $ORD_CH -pitch $Pitch `
        -expect 'residue-if-sharp' -expectCents 50 -bendFraction (($v50 - $CENTER) / 8192.0))
    Add-Bend ($t - 500) $PortA $ORD_CH $CENTER      # clean up before the ladder

    # 0.3 PRE-ARM LADDER — how far ahead must the bend land for the note to START
    # at pitch rather than scooping? Smallest reliable lead becomes BEND_PREARM_S.
    foreach ($lead in 50, 100, 150, 250) {
        Add-Bend ($t - 600) $PortA $ORD_CH $CENTER  # always start from centre
        [void](Add-Slot -probe '0' -step ("0.3-" + $lead) -label ("pre-arm lead " + $lead + " ms") `
            -port $PortA -channel $ORD_CH -pitch $Pitch -preBendValue $v50 -preBendLeadMs $lead `
            -expect 'onset-at-target' -expectCents 50 -bendFraction (($v50 - $CENTER) / 8192.0))
    }
    Add-Bend ($t - 500) $PortA $ORD_CH $CENTER

    # 0.4a mid-sustain bend — the audible sweep. This is the MECHANISM M1-M3 use,
    # so it is expected to be heard; the slot exists to confirm it tracks.
    [void](Add-Slot -probe '0' -step '0.4a' -label 'sweep during sustain (centre -> +50c)' `
        -port $PortA -channel $ORD_CH -pitch $Pitch -durMs 3000 `
        -midBendValue $v50 -midBendAtMs 1500 -expect 'sweep' -expectCents 50 -bendFraction (($v50 - $CENTER) / 8192.0))

    # 0.4b LEAK LADDER — how soon after note-off can the bend be reset without the
    # reset itself being audible in the ringing tail? Shortest clean gap = RESET_GAP_S.
    foreach ($gap in 0, 50, 150, 300) {
        Add-Bend ($t - 600) $PortA $ORD_CH $v50
        [void](Add-Slot -probe '0' -step ("0.4b-" + $gap) -label ("reset " + $gap + " ms after note-off") `
            -port $PortA -channel $ORD_CH -pitch $Pitch -preBendValue $v50 -preBendLeadMs 250 `
            -postBendValue $CENTER -postBendAfterMs $gap `
            -expect 'tail-clean' -expectCents 50 -bendFraction (($v50 - $CENTER) / 8192.0))
    }

    # 0.5 ALL-NOTES-OFF BATTERY — a chord across both ports, then the full stop
    # sequence. History says CC123 alone is not trustworthy, so the sequence is
    # explicit note-offs FIRST, from a registry of what was actually started.
    $chordOn = $t
    $chordPitches = @(34, 38, 41, 45, 46, 50, 53, 57)
    foreach ($p in $chordPitches) { Add-Action $chordOn 'note_on' $PortA $ORD_CH $p $Velocity }
    Add-Action $chordOn 'note_on' $PortB $QT_CH 41 $Velocity
    Add-Action $chordOn 'note_on' $PortB $QT_CH 48 $Velocity
    Add-Bend ($chordOn + 500) $PortA $ORD_CH $v50            # leave bend dirty on purpose
    $panicAt = $chordOn + 2500
    foreach ($p in $chordPitches) { Add-Action $panicAt 'note_off' $PortA $ORD_CH $p 0 }
    Add-Action $panicAt 'note_off' $PortB $QT_CH 41 0
    Add-Action $panicAt 'note_off' $PortB $QT_CH 48 0
    Add-Action ($panicAt + 20) 'cc' $PortA $ORD_CH 123 0
    Add-Action ($panicAt + 20) 'cc' $PortB $QT_CH 123 0
    Add-Bend ($panicAt + 400) $PortA $ORD_CH $CENTER          # reset AFTER the gap
    Add-Bend ($panicAt + 400) $PortB $QT_CH $CENTER
    $slots += @{ idx = $slotIdx; probe = '0'; step = '0.5'; label = 'panic: 10-note chord then full stop'
        port = $PortA; channel = $ORD_CH; pitch = 0; onMs = $chordOn; offMs = $panicAt
        preBendValue = $null; midBendValue = $null; postBendValue = $null
        expect = 'silence-after-panic'; expectCents = [double]::NaN; bendFraction = [double]::NaN }
    $slotIdx++
    $t = $panicAt + 3000

    # 0.6 CLEAN-STATE CHECK — one plain note per port. If either is off pitch or
    # off level, the stop sequence did not leave the rig clean.
    [void](Add-Slot -probe '0' -step '0.6a' -label 'clean state, ord after panic' -port $PortA -channel $ORD_CH -pitch $Pitch `
        -expect 'baseline' -expectCents 0)
    [void](Add-Slot -probe '0' -step '0.6b' -label 'clean state, quartertones after panic' -port $PortB -channel $QT_CH -pitch $Pitch `
        -expect 'baseline-qt' -expectCents ([double]::NaN))
}

# =====================================================================
# PROBE 1 — BEND RESPONSE & RANGE.
# Sent as RAW 14-bit fractions of full bend. The analyzer derives the true range
# from measured cents / fraction, so a wrong assumption above cannot mislead it.
# =====================================================================
if ($runAll -or $Probe -eq '1') {
    Add-Bend ($t - 600) $PortA $ORD_CH $CENTER
    $fracs = @(
        @{ f = 0.25; lbl = '+25% of full up' }, @{ f = -0.25; lbl = '-25% of full down' },
        @{ f = 0.50; lbl = '+50% of full up' }, @{ f = 1.00; lbl = '+100% full up' }
    )
    foreach ($fr in $fracs) {
        $v = [int][math]::Round($CENTER + $fr.f * 8191)
        if ($v -lt 0) { $v = 0 }
        if ($v -gt 16383) { $v = 16383 }
        [void](Add-Slot -probe '1' -step ('1-' + $fr.f) -label ('bend ' + $fr.lbl) `
            -port $PortA -channel $ORD_CH -pitch $Pitch -preBendValue $v -preBendLeadMs 250 `
            -expect 'derive-range' -expectCents ($fr.f * 100.0 * $BEND_RANGE_ASSUMED) -bendFraction $fr.f)
        Add-Bend ($t - 500) $PortA $ORD_CH $CENTER
    }
    # RPN 0 = pitch-bend sensitivity. Ask for 12 semitones, then re-measure at
    # full bend. If the patch honours it, the same raw value now reads much wider.
    Add-Action ($t - 800) 'cc' $PortA $ORD_CH 101 0
    Add-Action ($t - 780) 'cc' $PortA $ORD_CH 100 0
    Add-Action ($t - 760) 'cc' $PortA $ORD_CH 6 12
    Add-Action ($t - 740) 'cc' $PortA $ORD_CH 38 0
    [void](Add-Slot -probe '1' -step '1-rpn12' -label 'after RPN 0 widen to 12 st: +100% full up' `
        -port $PortA -channel $ORD_CH -pitch $Pitch -preBendValue 16383 -preBendLeadMs 250 `
        -expect 'rpn-honoured-if-wider' -expectCents 1200 -bendFraction 1.0)
    # put sensitivity back so nothing downstream inherits a 12-semitone range
    Add-Action ($t - 800) 'cc' $PortA $ORD_CH 101 0
    Add-Action ($t - 780) 'cc' $PortA $ORD_CH 100 0
    Add-Action ($t - 760) 'cc' $PortA $ORD_CH 6 2
    Add-Action ($t - 740) 'cc' $PortA $ORD_CH 38 0
    Add-Bend ($t - 600) $PortA $ORD_CH $CENTER
    [void](Add-Slot -probe '1' -step '1-restore' -label 'sensitivity restored: unbent reference' `
        -port $PortA -channel $ORD_CH -pitch $Pitch -expect 'baseline' -expectCents 0)
}

# =====================================================================
# PROBE 2 — QUARTERTONES MAPPING. Same written key on ord vs quartertones,
# across the range. Expected: a 50-cent-shifted duplicate set. MEASURE it.
# =====================================================================
if ($runAll -or $Probe -eq '2') {
    Add-Bend ($t - 500) $PortA $ORD_CH $CENTER
    Add-Bend ($t - 500) $PortB $QT_CH $CENTER
    foreach ($p in 34, 41, 46, 53, 60) {
        [void](Add-Slot -probe '2' -step ('2-ord-' + $p) -label ('ord ' + (NoteName $p) + ' (' + $p + ')') `
            -port $PortA -channel $ORD_CH -pitch $p -durMs 1800 -expect 'qt-reference' -expectCents 0)
        [void](Add-Slot -probe '2' -step ('2-qt-' + $p) -label ('quartertones ' + (NoteName $p) + ' (' + $p + ')') `
            -port $PortB -channel $QT_CH -pitch $p -durMs 1800 -expect 'qt-offset' -expectCents ([double]::NaN))
    }
}

# =====================================================================
# PROBE 3 — BENT-SAMPLE QUALITY. Long notes with ramps; the composer listens for
# resampling artifacts while the analyzer confirms the trajectory was tracked.
# Ramps are stepped at 25 ms — the same ~30-40 Hz the renderer will emit at.
# =====================================================================
if ($runAll -or $Probe -eq '3') {
    Add-Bend ($t - 500) $PortA $ORD_CH $CENTER
    foreach ($c in 50, -50, 100, -100, 200) {
        $on = $t
        $dur = 4000
        $rampStart = 800
        $rampLen = 2000
        Add-Bend ($on - 250) $PortA $ORD_CH $CENTER
        Add-Action $on 'note_on' $PortA $ORD_CH $Pitch $Velocity
        $steps = [int]($rampLen / 25)
        for ($i = 1; $i -le $steps; $i++) {
            $frac = $i / [double]$steps
            Add-Bend ($on + $rampStart + $i * 25) $PortA $ORD_CH (BendValue ($c * $frac) $BEND_RANGE_ASSUMED)
        }
        $off = $on + $dur
        Add-Action $off 'note_off' $PortA $ORD_CH $Pitch 0
        Add-Bend ($off + 400) $PortA $ORD_CH $CENTER
        $slots += @{ idx = $slotIdx; probe = '3'; step = ('3-' + $c); label = ('ramp to ' + $c + 'c over 2 s (nominal)')
            port = $PortA; channel = $ORD_CH; pitch = $Pitch; onMs = $on; offMs = $off
            preBendValue = $CENTER; midBendValue = $null; postBendValue = $CENTER
            rampStartMs = $rampStart; rampLenMs = $rampLen
            expect = 'ramp'; expectCents = $c; bendFraction = ((BendValue $c $BEND_RANGE_ASSUMED) - $CENTER) / 8192.0 }
        $slotIdx++
        $t = $off + $SETTLE
    }
}

# ---------- write the schedule (analyzer ground truth) ----------
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sorted = @($actions | Sort-Object tMs)
$meta = @{
    created = (Get-Date).ToString('o'); probe = $Probe; pitch = $Pitch; velocity = $Velocity
    portA = $PortA; portB = $PortB; ordChannel = $ORD_CH; qtChannel = $QT_CH
    bendRangeAssumedSt = $BEND_RANGE_ASSUMED; settleMs = $SETTLE
    outName = 'MORPH_bend_probe'; totalMs = $t
    slots = $slots; actions = $sorted
}
$meta | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $dir 'last_bend_schedule.json') -Encoding utf8

Write-Host ''
Write-Host '================ BEND PROBE SUITE (PLAN 2v Phase 0) ================' -ForegroundColor Yellow
Write-Host ("Probe(s): {0}    slots: {1}    MIDI actions: {2}" -f $Probe, $slots.Count, $sorted.Count)
Write-Host ("Test pitch {0} (MIDI {1}) unless a slot says otherwise" -f (NoteName $Pitch), $Pitch)
Write-Host ("Total run: about {0:N1} minutes" -f ($t / 60000))
Write-Host "Schedule -> probes\last_bend_schedule.json"
if ($DryRun) { Write-Host 'DRY RUN - nothing sent.' -ForegroundColor Cyan; exit 0 }

# ---------- open ports ----------
function Open-Port([string]$name) {
    $devId = [MidiOutBend]::Find($name)
    if ($devId -lt 0) { Write-Host "PORT NOT FOUND: $name" -ForegroundColor Red; return [IntPtr]::Zero }
    $hh = [IntPtr]::Zero
    [void][MidiOutBend]::midiOutOpen([ref]$hh, [uint32]$devId, [IntPtr]::Zero, [IntPtr]::Zero, 0)
    return $hh
}
$hA = Open-Port $PortA
$hB = Open-Port $PortB
if ($hA -eq [IntPtr]::Zero -or $hB -eq [IntPtr]::Zero) {
    Write-Host 'Need both tuba1 and tuba1b open in loopMIDI.' -ForegroundColor Red
    exit 1
}
function Send([IntPtr]$hh, [int]$status, [int]$d1, [int]$d2) {
    $msg = [uint32]($status -bor ($d1 -shl 8) -bor ($d2 -shl 16))
    [void][MidiOutBend]::midiOutShortMsg($hh, $msg)
}
# known-clean start: CC7 full, all notes off, bend centred, on every channel
foreach ($ch in 0..15) {
    Send $hA (0xB0 -bor $ch) 7 127; Send $hA (0xB0 -bor $ch) 123 0
    Send $hA (0xE0 -bor $ch) 0 64
    Send $hB (0xB0 -bor $ch) 7 127; Send $hB (0xB0 -bor $ch) 123 0
    Send $hB (0xE0 -bor $ch) 0 64
}

Write-Host ''
Write-Host 'ARM + RECORD in Reaper now (the tuba1 track, and tuba1b if running probe 2).' -ForegroundColor Green
Write-Host ("Starting in {0} s ..." -f ($LeadInMs / 1000))
Start-Sleep -Milliseconds $LeadInMs

# Sleep granularity on Windows is ~15 ms, which is too coarse for the 50 ms
# pre-arm rung. Sleep for the bulk, then spin the last 20 ms.
function WaitUntil($sw, [int]$tMs) {
    $gross = $tMs - $sw.ElapsedMilliseconds - 20
    if ($gross -gt 0) { Start-Sleep -Milliseconds $gross }
    while ($sw.ElapsedMilliseconds -lt $tMs) { }
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$slotByOn = @{}
foreach ($s in $slots) { $slotByOn[[string]$s.onMs] = $s }
foreach ($a in $sorted) {
    WaitUntil $sw $a.tMs
    $hh = $hA
    if ($a.port -eq $PortB) { $hh = $hB }
    $chz = $a.channel - 1
    switch ($a.type) {
        'note_on'  { Send $hh (0x90 -bor $chz) $a.d1 $a.d2 }
        'note_off' { Send $hh (0x80 -bor $chz) $a.d1 0 }
        'bend'     { Send $hh (0xE0 -bor $chz) $a.d1 $a.d2 }
        'cc'       { Send $hh (0xB0 -bor $chz) $a.d1 $a.d2 }
    }
    if ($a.type -eq 'note_on') {
        $s = $slotByOn[[string]$a.tMs]
        if ($null -ne $s) {
            Write-Host ("  [{0}] {1,-9} {2,-46} sched {3,7:N2}s  actual {4,7:N2}s" -f `
                $s.probe, $s.step, $s.label, ($a.tMs / 1000), ($sw.ElapsedMilliseconds / 1000)) -ForegroundColor Cyan
        }
    }
}

Start-Sleep -Milliseconds 1500
foreach ($ch in 0..15) {
    Send $hA (0xB0 -bor $ch) 123 0; Send $hA (0xE0 -bor $ch) 0 64
    Send $hB (0xB0 -bor $ch) 123 0; Send $hB (0xE0 -bor $ch) 0 64
}
[void][MidiOutBend]::midiOutClose($hA)
[void][MidiOutBend]::midiOutClose($hB)
Write-Host ''
Write-Host 'DONE - stop the recording.' -ForegroundColor Green
Write-Host 'Then: python probes\analyze_bend_probe.py <recording.wav>' -ForegroundColor Green
