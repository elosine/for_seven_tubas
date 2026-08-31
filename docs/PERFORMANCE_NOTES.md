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
- **phrasing RESOLVED — composer picked (b), day 40:** *"Notation is spaced
  proportionally in time — distance on the page equals duration."* On the
  page.
- note: E2's window shows the staccato A entering at the right edge — the
  composer's own reference screenshot includes it too; it stays.
- **IMAGES RETRY → v2 (day 40):** the first captures were wrong (thin pale
  arcs, missing impact discs, bricks showing) — v1 capture_lane.js had
  invented its own single-lane geometry. Composer: *"images are problematic…
  have a go first… I'll do a correct one or two more passes, and then lets
  move on"* — and offered manual Inkscape clipping as the fallback. **v2
  renders THE JURY FRAME itself** (static_page.js — the same shared module
  the video and print draw through, D4 bricks off — + the exporter's exact
  lane recipe) **and crops to the lane via the viewBox** — nothing is
  re-scaled by hand, so the image cannot differ from the app. All images
  regenerated through v2. Also per composer, day 40: **no captions on
  images** (figcaptions removed; standing rule for the page).
- verdict: *(pending — composer looks at the v2 images)*

## C3 · Notated Clusters · DRAFTED (day 40) — on the page, after Curve-Based Crescendo
- said: *"Notated clusters. These clusters of notation are written out in
  spatially proportionate notation. The bouncing ball gives the onset of the
  cluster. The notated rhythmic values are approximate and meant to give a
  sense of phrasing. The tuplets are not necessarily precise but inform the
  rhythmic flow of the phrase in conjunction with the scrolling cursor.
  t9 at 37.23 include from ~36.05 to ~40.56."*
- done: section on the page, text as dictated (commas only); image
  `clusters_37_T9.svg` — T9 (part 8), span 36.05–40.56, cursor at 37.23 —
  the CLOUD02-I figured region, beams + tuplet brackets under the cursor.
  Section PLACEMENT (after Curve-Based Crescendo) was AI's ordering call —
  composer may reorder.
- verdict: *(pending)*


## C4 · Acoustic Beating (the middle movement) · DRAFTED (day 40) — on the page
- said (dictation, day 40): the movement intro (*"The middle movement of this
  piece uses acoustic beating as the central musical material… pairs…
  micro-glissandos… beating glissandos… guitar tuning method… one goes up
  while another goes down, and then back together"*), a CHART request
  (*"timeline… the labels on the y, the left [= the pairs]… the sequence:
  starting beating in Hertz, approximately, to the peak beating amount, and
  then back down, for all three sections, and I'll have a note about the
  last one having no glissando"*), the demo-recordings paragraph (*"I have
  created demo examples… (we'll have to create these)"*), and the Notation
  block (*"two curves, green bottom = dynamic level, orange top = beating
  level in this movement; dotted vertical go-lines are rearticulation
  points — breathe before, rearticulate at the line; pitches at section
  starts are approximate, calibrate using beating speed/timbre; final
  section = held chord, crescendos, no glissando"*).
- **THE CHART IS MEASURED, NOT TYPED** — `tools/gen_beating_chart.js` reads
  the save's morphBend curves and draws the beat-rate trajectory per pair
  (|f1−f2| in Hz). What the data says:
  - **BLOOM:** five unison pairs (T1+T2 F2 · T3+T4 Bb2 · T5+T6 Eb3 ·
    T7+T8 Ab3 · T9+T10 C#4) bloom apart and return — 0 → **2.0 / 2.6 /
    3.3 / 4.3 / 5.4 Hz** (higher pairs faster, max split ~35–40 cents) → 0.
  - **CONVERGENCE:** the INVERSE, with waves — pairs start ~200 cents apart
    (**9 / 13 / 18 / 27 / 36 Hz**), fuse to near-unison (~**0.2–1.9 Hz**)
    around 291–299 s, re-open, approach again, and END APART. *(Measured,
    not assumed; the composer's "and then back together" narrative fits
    BLOOM — CONVERGENCE re-opens at its end. FLAGGED for the composer's
    eye on the chart.)*
  - **BALANCE:** one note per part (a ten-note chord), no glissando —
    drawn as a held dashed line + the note, no fake beat values.
- done: the section on the page after Notated Clusters — intro + chart +
  demos placeholder (*recordings to be added*) + the Notation block, all
  go-lines hyphenated. ALSO C2's example sentences amended per mid-turn
  dictation ("you would play… / you would begin the G at the go-line and
  hold it…").
- **OPEN:** demo recordings to produce and link (the composer's Reaper
  session `Bloom-Convergence-Balance_demoRecording.rpp` is presumably
  this) · a notation-block illustration pending a composer timecode pick ·
  the CONVERGENCE ends-apart flag above.
- verdict: *(pending)*
