# SI2 tuba — measured technique ranges (composer dictation 2026-08-13)

*Dictated in the composer's Reaper octave convention (middle C / MIDI 60 shows
as **C3**; conversion MIDI = (reaperOct + 2)·12 + pitch-class). Convention
self-verified twice: cresc KS switches C0/C#0/D0 = 24/25/26 ✓ and cresc range
F0–E3 = 29–64 ✓ both match prior measurements. Applied as per-technique
`rangeLow/rangeHigh` overrides on all 10 tubas in `sandbox/instruments.js`.*

| Slot | Technique | Dictated (Reaper) | MIDI | Notes |
|---|---|---|---|---|
| A1 | Ordinario | F#0–F3 | 30–65 | matches prior measurement ✓ |
| A2 | Bisbigliando | F#0–E3 | 30–64 | |
| A3 | Chromatic Scale | C1–C4 | 36–72 | |
| A4 | Cresc & Decr KS | F0–E3, KS C0/C#0/D0 | 29–64, KS 24/25/26 | ✓ prior data |
| A5 | Cuivre | C3–G3 | 60–67 | narrow, high |
| A6 | FX Menu | C2–Bb3 | 48–70 | menu patch (CC0 sub-select — I2) |
| A7 | Filtered by Voice | C0–B0 | 24–35 | **G0 (31) shows PURPLE** — unknown legend color, verify what it does |
| A8 | Finger Modes KS | B1–F3, KS C0/C#0 | 47–65, KS 24/25 | KS meanings TBD |
| A9 | Flz & Voice Unison | F#0–E3 | 30–64 | |
| A10 | Flatterzunge | F#0–F3 | 30–65 | |
| A11 | Fortepiano | F#0–F3 | 30–65 | |
| A12 | Glissando Menu | C2–F4 | 48–77 | menu patch |
| A13 | High Register Ord | (all brown) rec. F#3–Bb3 | 66–70 | ALL Expand-Range/synthetic (D7 tag); range = composer's recommended zone |
| A14 | Mute Ordinario | G#-1–Bb3 | 20–70 | widest of all |
| A15 | Ord & Flz KS | F0–F#3, KS C0/C#0 | 29–66, KS 24/25 | |
| A16 | Pedal Tone | Ab0–F1 | 32–41 | the only true sub-low resource is MUTE (20) not pedal |
| b1 | Play & Sing KS* | F#0–F3 | 30–65 | |
| b2 | Quartertones | F#0–E3 | 30–64 | |
| b3 | Single Tonguing | F#0–F3 | 30–65 | |
| b4 | Staccato | F#0–F3 | 30–65 | |
| b5 | Trills KS | F#0–F3, KS C0/C#0 | 30–65, KS 24/25 | |

\* **Open naming question:** the dictation called b-slot 1 "tuba staccato," but the
roster (from the original UVI screenshots) has Play & Sing at b1 and Staccato at
b4 — and captured-take playback through b4 sounds as staccato, supporting the
roster. Ranges were recorded per SLOT; if the b-instance slot order actually
differs, say so and the keys get remapped.

**Engine consequences:** pitch fields and per-technique renders now clamp to
these ranges automatically (the sandbox keyboard already follows them). Cuivre
(60–67) and High-Reg (66–70) are the upper-register colors; Mute Ord reaches
MIDI 20 — the deepest sound in the rack.
