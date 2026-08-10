# Composer Log — for seven tubas

> **Standing practice (inherited from piece #3):** the composer's substantive prompts
> get captured here as dated journal notes — lightly cleaned from speech-to-text,
> content untouched. AI appends automatically.

## 2026-08-10 — Simplification: the causal chain is visual shape → performer → sound

"I want to simplify as much as possible. The cause-effect I'm looking for is visual
shape → sound, with the performer in between, which we will infer. First: establish
what categories of crescendo SOUND there are — two, three, four, how many — and how
we distinguish them. They should be distinct, and it's those particular sounds we're
targeting. Then for each category, find the visual curve shape (and speed of
following, etc.) that will address that category — making assumptions about how the
animation will actually be played, so the MIDI is that interpreted version, not a
mathematical trace of the curve.

Let's start with the categories, and jump into the composer score for this: I'll
have you draw the verbatim curve and play it for me — MIDI follows the curve
precisely — to find whether there's any actual distinction. It could be there's just
one type of crescendo shape I want to use. Then we'll try those at different lengths,
maybe different volume changes. Then we'll solve whether the visual curve has to
change to produce that sound, given the performer won't follow it like a computer."

*(→ Sound-first taxonomy: categories of crescendo percept, discovered by ear via
curve-literal renders IN THE SCORE; drawn curves later inverse-filtered through the
performer model (D3) to hit the surviving categories.)*

## 2026-08-10 — Crescendo experiment notes (dictated)

"I want to try crescendos where the overlapping increases, and one where it starts
with unison and then moves towards no overlap. Ones where maybe the percentage
overlap is the same or there's no overlap, but the length of the crescendos increases
or decreases. I want to build a set of pitches or chords that we try these at —
unison all the way up to seven-note chords, and in different ranges. And I want to
see what gradually changing the shape of the curve over time sounds like —
interpolating one shape into another over a series of repeated crescendos.

Responding to the research: take into account the performer reactions. These are
animated curves — they're meant to be following the curves visually and playing
them. We'll have to infer or guess to a certain extent what they'll actually be
played like, and make the MIDI file more like what a performer would do looking at
a particular curve, rather than the MIDI crescendo following the curve precisely."

*(→ Battery S0–S7 in CRESCENDO_EXPERIMENTS.md; performer-model rendering = D3.)*

## 2026-08-10 — The detour begins

"I'm going to take a detour now, and I want to come back to the bass clarinet piece.
But I now want to start a piece for seven tubas. Set up the composer with seven tracks,
Tuba 1 through Tuba 7, and set up the instrument library. I'll make the loopMIDI
routing and instrument rack now."

*(→ Repo seeded from piece #3's stack: 7-track composer on :5200, sandbox on :4700,
instruments skeleton with ports `Tuba1`…`Tuba7`. Sample library TBD → survey next.)*
