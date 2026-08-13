// Rendering-recipe config — for seven tubas (IRCAM SI2 tuba, UVI channel-per-technique).
// SI2 tuba = 21 techniques > 16 channels, so each tuba spans TWO UVI instances/ports:
//   "tubaN"  (slots A1-A16, techniques 1-16)  ·  "tubaNb" (slots A1-A5, techniques 17-21)
// Schema note: a technique's optional `port` overrides the instrument-level port —
// the minimal switching abstraction extension (senders resolve tech.port || inst.port).
// Slot order transcribed from composer's UVI screenshots 2026-08-10 (ground truth).
// KS zone (UVI display: middle C / MIDI 60 = C3): Cresc&Decr KS switches at C0/C#0/D0
// = MIDI 24/25/26 (cut-end / tail / decresc). PROBE-FLOOR RULE: playable notes >= 28.
const INSTRUMENTS = {
  tuba1: {
    label: "Tuba 1",
    port: "tuba1",     // primary instance "Tuba1 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba1b SI2" (port tuba1b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba1b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba1b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba1b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba1b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba1b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba2: {
    label: "Tuba 2",
    port: "tuba2",     // primary instance "Tuba2 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba2b SI2" (port tuba2b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba2b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba2b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba2b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba2b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba2b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba3: {
    label: "Tuba 3",
    port: "tuba3",     // primary instance "Tuba3 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba3b SI2" (port tuba3b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba3b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba3b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba3b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba3b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba3b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba4: {
    label: "Tuba 4",
    port: "tuba4",     // primary instance "Tuba4 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba4b SI2" (port tuba4b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba4b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba4b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba4b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba4b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba4b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba5: {
    label: "Tuba 5",
    port: "tuba5",     // primary instance "Tuba5 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba5b SI2" (port tuba5b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba5b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba5b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba5b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba5b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba5b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba6: {
    label: "Tuba 6",
    port: "tuba6",     // primary instance "Tuba6 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba6b SI2" (port tuba6b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba6b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba6b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba6b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba6b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba6b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba7: {
    label: "Tuba 7",
    port: "tuba7",     // primary instance "Tuba7 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba7b SI2" (port tuba7b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba7b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba7b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba7b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba7b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba7b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba8: {
    label: "Tuba 8",
    port: "tuba8",     // primary instance "Tuba8 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba8b SI2" (port tuba8b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba8b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba8b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba8b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba8b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba8b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba9: {
    label: "Tuba 9",
    port: "tuba9",     // primary instance "Tuba9 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba9b SI2" (port tuba9b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba9b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba9b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba9b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba9b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba9b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },

  tuba10: {
    label: "Tuba 10",
    port: "tuba10",     // primary instance "Tuba10 SI2": techniques on channels A1-A16
    rangeLow: 29,        // composer-dictated (Cresc&Decr KS): display F0; KS zone below at MIDI 24–26
    rangeHigh: 64,       // composer-dictated (Cresc&Decr KS): display E3; other patches assumed same until checked
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1, rangeLow: 30, rangeHigh: 65 },   // measured by composer 2026-08-13: F#1-F4 (sci)
      { key: "bisb", label: "Bisbigliando", channel: 2, rangeLow: 30, rangeHigh: 64 },
      { key: "chrom_scale", label: "Chromatic Scale", channel: 3, rangeLow: 36, rangeHigh: 72 },
      { key: "cresc_decr_ks", label: "Cresc & Decrescendo KS", channel: 4, rangeLow: 29, rangeHigh: 64, ks: { 24: "cresc, cut at end", 25: "cresc with tail (composer's pick)", 26: "decrescendo" } },
      { key: "cuivre", label: "Cuivre", channel: 5, rangeLow: 60, rangeHigh: 67 },
      { key: "fx_menu", label: "FX Menu", channel: 6, rangeLow: 48, rangeHigh: 70 },
      { key: "filt_voice", label: "Filtered by Voice", channel: 7, rangeLow: 24, rangeHigh: 35 },  // G0(31) shows PURPLE - anomaly, verify
      { key: "finger_modes_ks", label: "Finger Modes KS", channel: 8, rangeLow: 47, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "flz_voice_unison", label: "Flatterzunge & Voice Unison", channel: 9, rangeLow: 30, rangeHigh: 64 },
      { key: "flz", label: "Flatterzunge", channel: 10, rangeLow: 30, rangeHigh: 65 },
      { key: "fortepiano", label: "Fortepiano", channel: 11, rangeLow: 30, rangeHigh: 65 },
      { key: "gliss_menu", label: "Glissando Menu", channel: 12, rangeLow: 48, rangeHigh: 77 },
      { key: "high_reg_ord", label: "High Register Ordinario", channel: 13, rangeLow: 66, rangeHigh: 70 },  // ALL brown/Expand-Range (synthetic); 66-70 = composer recommended zone
      { key: "mute_ord", label: "Mute Ordinario", channel: 14, rangeLow: 20, rangeHigh: 70 },
      { key: "ord_flz_ks", label: "Ord & Flatterzunge KS", channel: 15, rangeLow: 29, rangeHigh: 66, ks: { 24: "mode 1", 25: "mode 2" } },
      { key: "pedal_tone", label: "Pedal Tone", channel: 16, rangeLow: 32, rangeHigh: 41 },
      // overflow instance "Tuba10b SI2" (port tuba10b): slots restart at A1
      { key: "play_sing_ks", label: "Play & Sing KS", channel: 1, port: "tuba10b", rangeLow: 30, rangeHigh: 65 },
      { key: "quartertones", label: "Quartertones Ordinario", channel: 2, port: "tuba10b", rangeLow: 30, rangeHigh: 64 },
      { key: "single_tonguing", label: "Single Tonguing", channel: 3, port: "tuba10b", rangeLow: 30, rangeHigh: 65 },
      { key: "staccato", label: "Staccato", channel: 4, port: "tuba10b", rangeLow: 30, rangeHigh: 65 },
      { key: "trills_ks", label: "Trills KS", channel: 5, port: "tuba10b", rangeLow: 30, rangeHigh: 65, ks: { 24: "mode 1", 25: "mode 2" } },
    ],
  },
};

// Hardware capture input. Keystation 88 MK3 exposes "Keystation 88 MK3" (keys) and
// "MIDIIN2 (Keystation 88 MK3)" (DAW control — never bind).
const INPUT_MATCH = /keystation/i;
const INPUT_EXCLUDE = /^MIDIIN\d+/i;
