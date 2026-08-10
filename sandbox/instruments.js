// Proto rendering-recipe config — for seven tubas (inherits the piece #3 model:
// INSTRUMENT (one rack track / sampler instance / loopMIDI port) → TECHNIQUES.
// Routing is a BACKEND concern: the UI shows labels only.
//
// SKELETON: one placeholder technique per tuba until the sample library is chosen
// and surveyed. Techniques grow from the survey; switching mechanism (channels /
// keyswitches / CC#0) declared per instrument when known (see piece #3 recipes).
const INSTRUMENTS = {
  tuba1: {
    label: "Tuba 1",
    port: "tuba1",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba2: {
    label: "Tuba 2",
    port: "tuba2",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba3: {
    label: "Tuba 3",
    port: "tuba3",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba4: {
    label: "Tuba 4",
    port: "tuba4",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba5: {
    label: "Tuba 5",
    port: "tuba5",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba6: {
    label: "Tuba 6",
    port: "tuba6",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },

  tuba7: {
    label: "Tuba 7",
    port: "tuba7",       // loopMIDI port, exact name (case-sensitive)
    rangeLow: 22,        // provisional: pedal B♭0; tighten after library survey
    rangeHigh: 65,       // provisional: F4
    techniques: [
      { key: "ord", label: "Ordinario", channel: 1 },
    ],
  },
};

// Hardware capture input. Keystation 88 MK3 exposes "Keystation 88 MK3" (keys) and
// "MIDIIN2 (Keystation 88 MK3)" (DAW control — never bind).
const INPUT_MATCH = /keystation/i;
const INPUT_EXCLUDE = /^MIDIIN\d+/i;
