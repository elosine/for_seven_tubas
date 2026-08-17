# THE MORPH SECTION — form, workflow, and what it needs

> Composer's dictation, 2026-08-17 (day 13), captured at the moment. This is the
> **form plan** for the section built out of morphing chords; the engine work is
> `docs/plans/MORPH_CYCLING_PLAN.md` (FR-3/FR-6, built) and the requests ledger
> is `docs/FEATURE_REQUESTS.md`.

---

## 1 · The shape of the section, in the composer's order

1. **A SEQUENCE of morphing chords** — *"a little bit more harmonic, followed by
   something a little bit more crunchy, back to more spectral, etcetera."* The
   morphs are the bed; the section's harmonic argument is the succession of them.
2. **A very long humanised BUILD across the whole section**, over the morph
   chords — an acceleration.
3. **PLAYED IN, not calculated.** *"I'll do playback and just play for rhythm,
   like where I want impacts to be."* The composer performs the accelerando
   against the sounding morphs.
4. **OPTION, held open and possibly never used:** the played version
   *"overtaken by a calculated acceleration"* — a fitted, idealised curve
   replacing the performed one. Explicitly *"maybe not."*
5. Those taps become **onsets / IMPACTS**.
6. **Per impact, choose a chord or sonority.**
7. **A playability pass on each chord** — a mechanism to either **thin the
   chord** or **thin that part of the morph texture**, per instance.
8. **An attack profile per impact** — change the articulation of given players,
   *"kind of like I do for the blasts"*; or **add cuivre notes if nobody in the
   chord is playing them**.
9. **CODA:** morphing shapes reduced to *"just the attack with release tail"*,
   plus **density builds in reverse**.

---

## 2 · THE GOVERNING CONSTRAINT — the player budget, and it decides the form

**The morph bed and the impacts share the same ten players.**

BLOOM uses **eight**. That leaves **two free**. So all but the smallest impacts
have to **borrow players out of the bed**, and this is not a detail — it sets the
maximum density of the whole section.

**Borrowing has to take WHOLE PAIRS.** The model's mechanism is duplicated notes
splitting apart; take one half and the survivor is a lone detuned tone with
nothing to beat against. So the borrowing granularity is **2 players**, and
**each borrow silences one beating rate**.

**Treat that as the material, not as damage.** Every impact makes the bed thin
and lose one of its rates for the duration; the bed breathes around the impacts.
That is a better gesture than protecting the bed would be — but it should be
*designed*, because it will happen whether or not it is noticed.

**Consequence that changes a decision already on the table:** **FR-5 (choose the
number of pairs) is load-bearing, not cosmetic.** It is the dial that buys impact
headroom:

| pairs | bed players | free for impacts | character |
|---|---|---|---|
| 4 (today) | 8 | 2 | dense field, every impact borrows |
| 3 | 6 | 4 | comfortable |
| 2 | 4 | 6 | impacts dominate; beat rates read as individual pulses |

*The section's density of impacts and the bed's thickness are the same decision.*

---

## 3 · What already exists, step by step

| step | state |
|---|---|
| **1 · sequence of morphs** | **Exists.** Morph panel → `Insert @ cursor`, each a draggable group with a META shape. Pitch sets currently edited by the AI in the store → **FR-5**. |
| **2–3 · play in the accelerando** | **THE ONE REAL GAP — see §4.** |
| **4 · calculated acceleration** | **Mostly exists.** `tools/analyze_take.js` already fits an accelerando model out of a performance (2f), and the accelerando scheduler + one-dial curve came out of the density arc (DB 044). Swapping a fitted curve in for the played one is a tools job, not a new capability. |
| **5 · onsets → impacts** | Trivial once recorded. |
| **6 · a chord per impact** | **Exists.** The Insertion strip, the VERT01 palette and the blast taxonomy (D11). |
| **7 · playability pass** | **Partly.** 2r has the occupancy model, HARD/SOFT tiers and the resolver (move / drop / nudge / auto), and D15 already says a voicing keeps its identity while a cloud yields. **What is new is borrowing from a SUSTAINED bed and giving the players back** — see §5. |
| **8 · attack profile** | **Exists in substance.** Per-note articulation is how the blasts already work, and cuivre is chord-level articulation by D11. Adding cuivre notes for players not in the chord is the same idea as 2z's noise layer on spare lanes. |
| **9 · coda** | **Achievable now.** "Attack with release tail" = a short `duration` with a long `release` — exactly the new FR-3/FR-6 parameters. "Density builds in reverse" needs a reversal pass over a packed take; the cluster sandbox already has a `reverse` transform as precedent. |

---

## 4 · THE GAP — recording taps against the playing score

The composer's method depends on **performing the rhythm while the morphs
sound**. Per `PLAN.md`, **per-track recording in the composer score is still
unbuilt**; the in-app recording with live thru lives in the **cluster sandbox**
(2p), not in the score. *This should be confirmed in the app before anyone plans
around it.*

So the chain needs one of:

- **(a)** a tap-record mode in the composer score — play the score, capture
  keystrokes/MIDI as bare onsets, no pitch. **Smallest thing that unblocks the
  method**, and onsets-only means it does not need the sandbox's editor.
- **(b)** record in the cluster sandbox against a bounced morph and import the
  onsets. Uses what exists; costs a round trip and loses the live feel of playing
  *against* the actual bed.

**(a) is recommended** — it is the composer's stated working method, it is the
only step in the whole chain with nothing behind it, and onsets-without-pitch is
a much smaller thing than the sandbox recorder.

---

## 5 · THE NEW MECHANISM — borrow and return

Per impact, the machine must:

1. Decide how many players the chord needs.
2. **Borrow whole pairs** from the bed for the impact's duration, preferring
   pairs whose loss costs least — *candidate rule, to be decided by ear:* the
   pair currently nearest its unison (its beating is slowest and least present).
3. **Give them back** afterwards, re-entering on the trajectory where it now
   stands — the same "rejoin at the next breath" logic as the attack (FR-4).
4. **Alternative on the same footing: thin the CHORD instead**, when the bed
   matters more than the impact's full voicing at that moment. Per instance, the
   composer's call — this is the same asymmetry D15 already settled for
   blast-vs-cluster, now between impact and bed.

**Open, and only the composer can answer:** at an impact, does the bed **duck**
(the borrowed pair drops out and the rest continue), or does the whole bed
**thin toward the impact** as a gesture? The first is bookkeeping; the second is
composition.

---

## 6 · Flags worth carrying into the build

- **Every impact perturbs the harmony of the bed**, because pairs are pitch
  classes as well as beat rates. A long section of impacts will progressively
  reveal and re-hide parts of the chord. Foreseeable, and probably desirable.
- **The accelerando will collide with the borrow budget at its climax.** As
  impacts get closer together, borrowed pairs will not have returned before the
  next impact needs them. **The build's ceiling is the pair count, not the
  players' articulation rate** — a different ceiling from the density builds
  (2t), and it should be measured rather than assumed.
- **The played accelerando is human, so it will not be monotonic.** That is the
  point (*"humanized"*), but the borrow logic must not assume impacts get
  steadily closer.
- **Nobody has heard a cycling morph yet**, let alone one with holes punched in
  it. Everything above is architecture, not evidence.
