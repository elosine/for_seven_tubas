# Beaming standards — the reference (day 29)

> Written for the composer's question after the T2 read: *"the standard approach to
> beaming. When should you have overhangs? when should you have the beamlets like I
> do? which things should be grouped together generally and which not? and how is
> beaming handled with tuplets — do you beam partway into the tuplet?"*
>
> Sources: Elaine Gould, **Behind Bars** (Faber, 2011) — the modern authority, cited
> by page area; Gardner Read, **Music Notation** (2nd ed.); Ted Ross, **The Art of
> Music Engraving**; Kurt Stone, **Music Notation in the Twentieth Century** (the one
> that covers OUR case — spatial/proportional notation). LilyPond and Dorico defaults
> are treated as codified consensus. Written from knowledge of these texts, not from
> a fresh page-by-page pass; page refs are areas, not exact numbers.

---

## 0. The one principle everything follows from

**In metered music a beam's first job is to show the BEAT.** The reader parses
rhythm beat by beat; the beam is the container that says "this much is one beat (or
one clean division of it)". Every rule below — grouping, breaks, rests under beams,
fractional-beam direction — is that principle applied to a case.

**In unmetered / spatial notation there is no beat to show, so the beam changes
job: it becomes a pure grouping device** (Stone). The beam says "these notes are one
gesture / played as one unit". That is our world — D69's "the groups are BEAM
GROUPS" is Stone's practice, arrived at independently. The consequence: many of the
metered rules don't bind us, but their *logic* (the beam claims a span of time; its
breaks are the boundaries the reader trusts) carries over exactly.

## 1. What groups together (metered practice, then ours)

- **Simple meters:** beam within the beat. In 4/4, 16ths beam in fours per quarter;
  8ths may join two beats (1+2, 3+4) but never obscure the bar's midpoint. In 2/4
  and 3/4, by the quarter.
- **Compound meters:** by the dotted beat — 6/8 is 3+3, never 2+2+2 (that writes
  3/4).
- **Beaming against the meter is legal and MEANINGFUL** — it is how syncopation and
  cross-rhythm phrasing are marked. Because the default carries the meter, a
  contradiction of the default is loud. (Same logic as D69: the marked form says the
  message.)
- **Vocal music, old style:** beam per syllable; modern practice beams by beat and
  lets the underlay show syllables.
- **Spatial (ours):** the group is by ear/gesture — the pace rule, the composer's
  cuts. There is no "wrong" group against a meter; the only wrongness is a beam
  that groups what is not heard together. Which is why the seam/grouping argument
  (D67/D68) is the real content and the beams just draw its answer.

## 2. Primary vs secondary beams — the hierarchy

- **The primary beam runs the whole group; you do not break it inside its own
  group.** A primary break IS a group boundary, full stop.
- **Secondary beams break to show subdivision.** Six 16ths under one primary may
  carry secondaries as 3+3 or 2+2+2 — the secondary pattern is where the internal
  rhythm is displayed. (Our pages already work this way: the second beam level
  connects adjacent 16ths and stubs the isolated ones — the beam pattern shows the
  rhythm, day 23.)
- Gould: break secondaries at the beat's own subdivision points; when in doubt,
  the larger subdivision.

## 3. Beams over rests — when an "overhang" is right

- **Rests INSIDE a beamed group are fully standard** (Gould, "beams over rests"
  area, ~pp. 164–167; also Read). Since the mid-20th c. this is the *preferred*
  way to keep a beat's worth of figuration legible: the beam holds the unit
  together, the rests sit under it. The old restriction ("a beam group must begin
  and end with a note") is explicitly relaxed in modern practice.
- **A group may BEGIN or END with a rest under the beam** — the overhang. Gould
  admits it where the rest belongs to the group's rhythmic unit, and recommends
  **stemlets** (short stems dropping from the beam toward the rest) as the
  clarifying refinement; LilyPond (`stemlet-length`) and Dorico both implement
  this. Bartók and much post-1950 music use the naked overhang without stemlets.
- **The decision rule:** does the silence BELONG to the group (completing its
  unit), or does it SEPARATE two groups? Owned time → beam over it. Boundary →
  break the beam and leave the rest in the open. **The beam's extent is the time
  the group claims.** The composer's day-29 formulation is exactly this: "three
  partials, broken beam over the sixteenth, so group of four" — the overhang
  makes the group's claimed span visible.
- Do not overhang past MORE than the group's own unit — a beam sailing over a
  boundary rest reads as annexation of the next group's time.

## 4. Beamlets (fractional beams) — when, and which way they point

- **Metered use:** a fractional beam appears when a note needs more beam levels
  than its neighbour — dotted-8th + 16th: the 16th carries a second-level stub.
- **Direction is MEANING, not decoration** (Gould, fractional-beams area ~p. 159;
  Read agrees): at the **start** of a group it points **right**; at the **end** it
  points **left**; **mid-group it points toward the notes it subdivides with** —
  the stub says "I belong with THAT side."
- **Our practice measured against this:** the day-24 end-note rule (stub inward)
  is Gould's edge rule, already right. Mid-group stubs currently default to the
  right; the standard would choose per side. On a spatial page the natural
  translation is: **the stub points toward its nearer neighbour in time** —
  cheap to adopt if wanted, and it makes the sketch's "partial secondary" carry
  information instead of habit.
- **A lone 16th amid rests inside a group** has no metered-practice equivalent
  (it would be flagged, not beamed). On a spatial page, keeping it under the
  group's beam apparatus (stubs, or the day-29 reach-over-the-rest) is a
  legitimate extension of beam-as-group — Stone's logic, not Gould's letter.

## 5. Tuplets and beams

- **If one beam spans exactly the tuplet, the bracket may be omitted** — the
  numeral alone sits at the beam (Gould, tuplet area ~pp. 194–202). The classic
  beamed triplet with a bare "3" is this rule.
- **The bracket is required whenever a beam does not show the tuplet's scope:**
  unbeamed values, a tuplet inside a LONGER beamed group, or any scope that
  crosses a beam break. **The bracket is arithmetic, not grouping** — it declares
  which notes the ratio applies to, nothing else. The beams do the grouping.
- **Beaming partway into a tuplet / across its edge is permitted** — a tuplet may
  sit inside a longer beam, and secondary breaks inside a tuplet are fine — but
  the bracket must still embrace exactly the tuplet's notes. What good practice
  avoids is the visual we flagged as a STRADDLE: a bracket whose span crosses a
  primary-beam break. It is legal arithmetic and bad rhetoric — the engraver's
  fix is to choose beam groups and tuplet scopes that coincide (or re-scope the
  tuplet), which is precisely design call A(a)'s unbuilt "bracket scoped to the
  figure".
- **Rests inside a tuplet, under the bracket: standard.** (Our `--tuplet` slots
  already do this.)
- **Nested tuplets:** bracket every level; the beam may run the whole figure
  (Ferneyhough as the extreme of normal).

## 6. Stems, briefly (the question said "stemming and beaming")

- Direction: farthest-from-the-middle-line note decides; in mixed beamed groups
  the majority/farthest rule (Gould). On a one-lane system like ours a per-part
  constant direction is normal and preferred for consistency.
- A beamed group's beam is FLAT in modern practice unless the line contour
  clearly runs one way; we already level beams (day 24).

## 7. What our pages do, measured against the standard

| ours | standard's verdict |
|---|---|
| beam = gesture group (D69) | Stone's spatial practice, exactly |
| secondary-beam pattern shows the rhythm; stubs on isolated 16ths | the metered subdivision logic, transplanted — sound |
| 16th rests under beams inside groups | standard (Gould) |
| `--beamOver` trailing-rest overhang | recognized; Gould would offer stemlets as the refinement |
| `--beamOverLeft` (group starts with a beamed-over rest) | recognized (group may begin with a rest); stemlet again the refinement |
| mid-group stubs default right | standard says point toward the belonging side; adoptable as "toward the nearer neighbour" |
| bracket per beat from the fit, beams per group | the one real friction: standard wants tuplet scope ⊆ one visual group — the STRADDLE flag marks exactly the violations |
| all played heads 16ths, one flag/beam count (principle 7) | a deliberate spatial simplification; standard has no objection because duration is carried by spacing, not values |

## 8. The short-rules card

- **Group what is heard together; the beam is the group.** (Spatial music: no
  meter to serve.)
- **Never break a primary inside its group; break secondaries to show the
  internal rhythm.**
- **Beam over a rest the group OWNS; break at a rest that SEPARATES.** Overhang =
  claimed time. Consider stemlets if an overhang ever reads as floating.
- **A beamlet points at the side it belongs to.** Edges: right at the start, left
  at the end.
- **Bracket = arithmetic, beam = grouping.** Omit the bracket when the beam spans
  exactly the tuplet; otherwise the bracket must embrace the tuplet exactly and
  should not cross a primary break (that's the straddle).
