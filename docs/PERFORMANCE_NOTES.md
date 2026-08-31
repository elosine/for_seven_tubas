# PERFORMANCE NOTES — working doc (running-order step 4, day 40 →)

> The front matter for **Bloom — Convergence — Balance**. Built by dictation:
> the composer goes through the score and dictates; AI logs **as it is said**
> (the chat is never the record), drafts prose only where asked, and marks
> every item's status. Source material from String Quartet No. 1 is below —
> the composer picks what carries over.

---

## POSITION — read this first on any pickup

- **Step 4 ACTIVE (day 40). THE MOCK PAGE EXISTS:**
  `docs/notation_instructions/index.html` (+ the SQ stylesheet, copied) —
  served at http://localhost:5200/docs/notation_instructions/index.html.
  **Images are generated, not screenshotted:** `tools/capture_lane.js`
  renders one part's lane at one instant as a standalone SVG through the
  REAL modules (renderSection + frameSvg, drawnOf wired) — regeneration
  commands live as comments next to each <img> in the HTML.
- **C1 landed (Curve-Based Crescendo).** Dictation continues — composer goes
  through the score; log each item the moment it is said.

---

## THE LOOP (same rhythm as the proofread ledger)

1. Composer dictates a note (or names an SQ section to reuse/adapt).
2. AI logs it verbatim-first (*said:*), then drafts the player-facing prose
   (*draft:*) — status `DRAFTED`.
3. Composer verdicts: GOOD ✓ / RETRY ↻ (with words). Recorded as said.
4. At the end: assemble into the front-matter document + capture images.

---

# PART A — SOURCE: String Quartet No. 1 Performance Instructions

*(verbatim text; `[IMG]` = the SQ page's illustration, in the SQ repo under
`docs/notation_instructions/images/`. Marked with a first-guess relevance to
this piece — the composer's call wins.)*

## A1 · Curve-Based Crescendo — REUSE CANDIDATE (this piece is full of them)

Play the crescendo from dynamic 1 to dynamic 2. The bottom of the curve
corresponds to the starting dynamic, the top to the ending dynamic. The
contour of the curve determines how the crescendo grows over time.

A **curve follower** gives your real-time position in the curve. An
**animated dial** counts down for the duration of the curve.

**Curve-Based Crescendos with Glissandos:** The curve describes the
crescendo. The glissando should be made over the duration of the curve. You
can choose to glissando with the curve (or inverse), or you can do a linear
glissando over the duration of the curve.

*[IMG: viola_cres_0_playing.svg · vln1_cresGliss_6.svg]*
*(Piece #4 note: our follower is the TUBE — fill = current level, top of the
tube = max loudness (composer ruling, day 40). The morph sections pair a
gliss meter (top half) with a cresc meter (bottom half).)*

## A2 · Like-Walking-on-a-Carpet-of-Twigs — strings-specific; devices inside it carry

- **Motive Cell:** Play any of these motives during the designated duration.
  All are open pitch. Quarter-tone or greater resolution is encouraged. The
  pizzicato motive is a two-handed pizzicato played like a grace-note figure
  in "one attack." …The rest of the notation is self-explanatory.
- **Line Wedge:** Play for the duration of the line. The thickness of the
  line represents density. The thickest line (maximum density) takes up
  about the top third of the track.
- **Ensemble Texture Indicator ("flocking"):** Play immediately after
  another player, or you can try to anticipate and play immediately before
  another player. This leads to a clustering of motives throughout the
  ensemble.
- **Gravitational Conductors (bouncing ball):** If these appear, play one of
  the motives as conducted using the ictus suggested by the animation.

*[IMG: vln1_gc_twigs_lineWedge_4 · twigs_motive · lineWedge ·
flocking_badge · gc]*

## A3 · Conducted Articulation — REUSE CANDIDATE (this piece uses GC + articulation)

Play the indicated articulation using the ictus suggested by the
gravitational conductor animation. If no pitch is indicated, you can use
open pitch. Quarter-tone resolution or greater is encouraged.

*[IMG: gc_clbat_9 · bp_cl_9]*

## A4 · Harmonic Flutter — strings-specific

A rapid, fluttering sound with continuously changing harmonics.
**Left hand:** Move continuously on the fingerboard in the range indicated
by the notated pitches. Try to find the highest harmonics you can sustain.
Hold briefly, then continue the search. **Right hand:** Use a combination of
jeté, bow pressure, and bow speed to create and sustain as rapid a flutter
as possible. **Harmonic Tremolo:** Use the same left-hand technique as above
and play an unmeasured tremolo.

## A5 · Accelerando / Decelerando — REUSE CANDIDATE (the trance accelerando)

The curve determines the rate and shape of acceleration or deceleration
over time.

*(Piece #4 note: our accelerando is tempo-marked — ♩ = 75 → 120 over the
trance — with per-part tempo marks and balls, not a drawn curve. The prose
will differ; the concept carries.)*

## A6 · Pizzicato Storm — strings-specific

Left hand moves chaotically across the fingerboard and all strings. Use as
many fingers from both hands to pluck a dense mass of pizzicato, like a
hailstorm.

## A7 · Acoustic Beating — partial carry (glissando-curve prose)

In this section, the ensemble plays a variety of glissandos and long tones
to generate acoustic beating. **Anchor tone:** The viola plays the anchor
tone, which is a long, slow glissando. The scroll bar has a pitch tracking
system that will display the approximate pitch you are at with quarter-tone
resolution. Small, static pitches can be found throughout the curve which
indicate when you've reached that pitch. **Gliss curve:** the curve
describes the glissando — the rate and shape of pitch change over time.
**Dynamics:** Adjust the dynamics throughout this section so that the
acoustic beating effect is as rich as possible.

*(Piece #4 note: the morph sections' gliss meter + onset heads with
quarter-tone approximations are cousins of this.)*

## A8 · Vibrato Speed — strings-specific

The curve describes vibrato speed.

## A9 · Notation Fragments — REUSE CANDIDATE (the abandon rule is gold)

Play the fragment as written at your own tempo. The gravitational conductor
indicates when to begin the fragment. **If you have not finished playing the
entire fragment by the time another event comes, abandon the fragment and
play the next event on time.**

## A10 · Unmeasured Pizzicato Tremolo — strings-specific; the GC begin/end grammar carries

The gray line wedge indicates intensity and speed of the tremolo. The
gravitational conductor indicates a begin attack or an end attack. If the
notation and line wedge is before the gravitational conductor, begin the
tremolo at the beginning of the line wedge and end abruptly at the impact of
the gravitational conductor… If the gravitational conductor is at the
beginning, begin the tremolo in a manner suggested by the gravitational
conductor.

## A11 · Quiet Two-Hand Pizzicato Cluster — strings-specific

(Left hand mutes and strums; right hand behind the bridge; irregular
cluster; the line wedge indicates density of articulation, but the motive
should remain quiet throughout.)

---

# PART B — THIS PIECE'S DEVICES (dictation targets, from the record)

*(Stubs in score order-of-appearance, to walk through. Status: `—` =
undictated · `DRAFTED` · `GOOD ✓`.)*

| # | device | status |
|---|---|---|
| B1 | the scrolling score, cursor / go line, local play on stands | — |
| B2 | noteheads, ledgers, written pitch (baked transpositions, D81) | — |
| B3 | ring bars / drawn duration bars (fp · sfzp · cuivré · ord) | — |
| B4 | self-drawing staccato bricks | — |
| B5 | beamed figures, tuplet brackets (bracket = speed change, D69) | — |
| B6 | breath seams / figure boundaries | — |
| B7 | dynamics system (ambient dynamic + marked exceptions; majority rule) | — |
| B8 | accents | — |
| B9 | cuivré | — |
| B10 | the GC ball (per-note ictus + the trance per-beat balls) | — |
| B11 | the TUBE curve follower (fill = now, top = max loudness) | — |
| B12 | crescendo curves / surges (peak-cut) / the final crescendo | — |
| B13 | the morph sections: gliss meter + cresc meter + onset heads | — |
| B14 | tempo marks, multitempo, phase-shift passages | — |
| B15 | the trance accelerando (♩ = 75 → 120, eight arrivals) | — |
| B16 | section marks (BLOOM · CONVERGENCE · BALANCE · trance) | — |
| B17 | print-score specifics: time ruler, facing bands, 11.41 s/page | — |
| B18 | general: setup, MIDI ports, click/audio, what "in time" means here | — |

---

# PART C — THE DICTATED NOTES

## C1 · Curve-Based Crescendo · DRAFTED (day 40) — on the mock page
- said: keep the SQ section; new image from THIS score at **691.19, T2**;
  keep the text **minus the last sentence** ("An animated dial…" — this
  piece has no dial).
- checked first (composer asked): *"bottom = starting dynamic, top = ending
  dynamic — is this true in this score?"* **Measured census, day 40: all 97
  drawn curves start at the lane bottom (≤5%); every rising curve (57
  per-event + 10 final-cresc) ends AT its own top; none peak below 80% of
  the lane; exactly 67 ppp marks = one per rising curve.** So the sentence
  is true here as written — the absolute lane scale (top = max loudness,
  the tube ruling) and the SQ's relative reading coincide because the
  curves all span bottom-to-top. The 30 morph arcs rise-and-fall (end ≠
  top) — they get their own prose in the morph section, not this one.
- done: `docs/notation_instructions/index.html` section 1 — text as
  dictated; image `images/curve_cresc_691_T2.svg` generated from
  `ev-wc-ta4-2452` (T2, 689.43–691.83 swell on G1), window 688.8–692.0,
  cursor + tube at 691.19. Regen command in the HTML comment.
- **OPEN:** the SQ sub-block "Curve-Based Crescendos with Glissandos" is
  HELD BACK (its image is SQ notation; this piece's gliss+cresc pairing
  lives in the morph sections) — composer to call: fold into the morph
  section's note, adapt here with a this-score image, or drop.
- verdict: *(pending — composer looks at the mock page)*

## C2 · INTRO + Animated Conduction Tools · DRAFTED (day 40) — on the page, above C1
- said (verbatim, cleaned only for punctuation): *"intro paragraph at top:
  The score for Bloom Convergence balance is a computer animated score that
  is served from the cloud and plays in a web browser, like an online video
  game. — Animated Conduction Tools (heading for first section, place this
  above curve-based). There are a number of animated conduction tools that
  are intuitive to follow and aid performers in realizing the score. A
  scrolling cursor runs throughout the piece at a consistent speed and
  indicates when things are to be played (named things in bold like A curve
  follower). Notation is spatially proportionate with time (is there a
  better way to state this). Bouncing ball conductors aid with rhythmic
  precision. The dotted vertical line marks the go-time. In the first
  example you will play the notated staccato A when the scrolling cursor
  reaches the go line and the ball bounces. In the second example, begin
  the G at go-time and hold until the cursor reaches the end of the line.
  E1 and 2 side by side. E1: t4 7.33 with cursor in the shot. E2 6.94."*
  *(An earlier interrupted fragment named "t4 5.76 · 7.33 · around 5.93,
  precisely at go time" — 5.93 is the G's true onset; kept as the trail.)*
- read as / resolved against the data: **E1 = ev-wc-14, T4 staccato A1,
  onset 7.515** — captured at the composer's t=7.33: cursor visibly
  approaching the go line, ball descending into impact. **E2 = ev-wc-13,
  T4 fortepiano G1, onset 5.93, dur 1.57 (ends 7.50)** — captured at the
  composer's t=6.94: cursor mid-hold along the ring bar, which is the
  "hold until the end of the line" moment. The composer's timecodes were
  scrubber positions, not onsets — resolved, not corrected.
- done: intro paragraph + the new section on the page ABOVE Curve-Based
  Crescendo; named things bolded (scrolling cursor · bouncing-ball
  conductors · dotted vertical line · go-time); the two captures generated
  by capture_lane.js side by side (new .pair CSS in our styles copy) with
  captions; regen commands in the HTML comment.
- **OPEN (composer asked for a better phrasing):** "notation is spatially
  proportionate with time." Drafted onto the page meanwhile: *"The notation
  is proportional: horizontal space corresponds directly to time."*
  Alternatives offered in chat. Composer picks.
- note: E2's window shows the staccato A entering at the right edge (the
  G's bar ends 7.50, the A hits 7.515 — same lane, adjacent by the piece's
  own design). Trimming the window would clip the bar's end and break the
  "hold until the END of the line" reading, so the neighbour stays.
- verdict: *(pending)*
