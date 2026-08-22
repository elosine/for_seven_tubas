# DYNAMICS FRAMEWORK — research-informed framing for the density build

> Created day 23 (2026-08-22) at the composer's request: *"capture the
> proposal... as a conceptual framing or philosophy type of approach of
> research-informed research."* Status: **framing + proposals, no decision
> taken.** Scope per the composer: *"for this piece and for this section,
> address the particular sonic issues. And then if that backfills into
> building a more universal dynamics back end, that's fine."*
> Primary sources: `COMPOSER_LOG.md` (day 23, verbatim) · `RUNNING_LOG.md`
> (day 23 entries) · `research/nakamura 1987.pdf` · `research/Ligeti 1960/`.

---

## 1. The problem, in the composer's terms

The MIDI of the density build carries a variety of velocities that *"gives
the phrasing feel of the piece along with pitch changes... it provides a
dimensionality... from two-D to three-D."* Performers **can** produce varied
dynamics, *"however, it's usually couched in something else"* — dynamic
marks + habitual phrasing + articulation devices. What they cannot do:
*"play this note at one hundred and then play the other note at one zero
three."* Constraint: *"I don't want to create too elaborate a model."*

## 2. The sonic fact (measured day 23, section 1 < 240 s)

- **699 staccato one-shots**, velocities 26–127 with *every* value used
  (75 at the 127 ceiling); 92 fortepianos, same spread.
- Playback is velocity only (`sonifyMode: plain`, CC7 pinned full); the
  drawn level is recVel / 12.7.
- **Adjacent notes in one part differ by a median of 14 velocity units**
  (p75 = 26, p90 = 40, max 77) — about one full dynamic marking between
  neighbours. This is *kaleidoscopic contrast*, not fine gradation.
- **Provenance:** A2 / CLOUD02 / CG / S-species velocities are the
  composer's own keyboard playing (the 2f play-in pipeline); DB3's are the
  density engine's scalings. The velocities are a **captured performance
  and a statistical texture**, not per-note compositional decisions.

The question therefore is not "how to notate 100 vs 103" but **"how to
transmit a performance's dynamic profile — and a texture's statistics — to
another performer."**

## 3. What the literature says (read, not summarized from memory)

| Source | Finding | Bearing |
|---|---|---|
| Miller 1956 / Garner 1953 | Absolute identification of loudness ≈ 2.3 bits ≈ **5 categories** | Why pp–ff has ~5 useful steps; per-note values beyond that are not a performable or audible instruction |
| **Nakamura 1987** (read in full) | Crescendi ≥ 9 dB heard by 87–100 % of 38 listeners; a 2 dB "crescendo" by 34 % (chance). Decrescendo harder to play and to hear. Rising pitch alone gives a crescendo impression (79 %). Listeners' modal response matched the performer's intended *symbol* only **38–53 %**, but rank agreement γ = **.81 / .81 / .47** | **Shape transmits; absolute level does not.** A hairpin needs ~9 dB to exist for the listener. "Intensity level is not fixed by a given dynamic symbol, but is influenced by context." |
| **Kosta, Ramírez, Bandtlow & Chew 2016** (read in full) | 8 pianists × 44 Mazurkas: loudness ranges for *p* "often as wide as that for the mf"; in 3/8 recordings the *p* after an *mf* is louder than the *mf*. Adopts Khoo's **primary dynamic shading (absolute) vs inner shadings (relative)** | Markings are relative; the usable model is an ambient level plus local deviations |
| **Fabiani & Friberg 2011** | Timbre and loudness have *equally large* effects on perceived dynamic strength; loudness alone is unreliable | For brass, attack/brightness **is** dynamic; the accent vocabulary is a dynamic channel; the velocity→dynamic map is instrument-specific (calibrate on the tuba samples) |
| **Ligeti 1960** (scans, pp. 40–42, read in full) | *"intensity-values spread out from points to become indistinctly bounded fields, and can only be estimated in relation to the loudness of their environment."* Three grades of performable exactness: unambiguous pitches · measured durations · *"unmeasured, only estimated dynamics."* On accents: *"the places with a weak primary degree of intensity are the most problematic – the louder intensities are influenced relatively less, since their additional intensity (decided by the mode of attack) is unimportant in comparison with their basic intensity. This 'counterpoint' between the original intensities and those implicit in the modes of attack creates fields of inexactness."* | The cautionary precedent (Structures Ia's twelve dynamics). **Accent-as-dynamic works at mf and above; at soft ambients it is "most uncertain."** |
| Lutosławski, ad libitum practice | "dynamics freely varied within p–f" — range + character, not values | The honest notation of a statistical texture |
| Ferneyhough | Per-note dynamics as deliberate overload | What this piece is *not* doing |
| Brass pedagogy (Jacobs; articulation syllables) | Short notes are attack-dominated; dah/tah/accent/marcato on a steady air stream is the player's native inner shading | Players already do inner shading by habit; they need the ambient and the exceptions |

## 4. Principles derived

1. **Categories, not values.** Five bands at most (Miller). The composer:
   *"I would go from PPP to FFF and then maybe collapse some of the middle
   range ones. So five categories is fine, but just more distinct jumps
   between them."* → candidate set **ppp · p · mf · f · fff** (or
   ppp · pp · mf · ff · fff) — the set is an open decision; the principle
   is *wide, distinct jumps*.
2. **Ambient + deviation** (Khoo/Kosta). A chunk or gesture carries one
   primary marking; a note is marked only when it leaves the band.
3. **Shape over level** (Nakamura). Tendencies are notated as hairpins,
   with a perceptual threshold (~9 dB) below which no hairpin is written.
4. **Attack is dynamic** (Fabiani; Ligeti). Accents are a legitimate
   +1/+2 channel — **at mf and above**; soft ambients use range or hairpin
   devices instead.
5. **Provenance decides the channel.** Authored levels (drawn curves) →
   exact marks. Played-in material → ambient + deviations (keeps the
   composer's peaks). Engine-generated jitter → a range + character
   instruction (Lutosławski).
6. **Calibrate on the instrument** (Fabiani). The velocity→dB curve of the
   SI2 tuba, measured once, sets the band thresholds and the hairpin
   threshold. Not a software default table.

## 5. The two layers of the density build (composer, day 23)

The section as a whole is *"kaleidoscopic, pointillistic — but that's
achieved by the ensemble."* Within a part:

**Layer 1 — isolated one-shots.** Staccato-sample notes rhythmically
isolated enough to carry the GC device: *"one shot, one go"*, single
articulation, *"probably just simply dynamics."* Goal: *"a range of
perceived dynamic... able to contribute meaningfully to this overall
pointillistic kaleidoscope."* Framework: one marking per note from the
five-band set (principle 1), with the column chain / side-with-room rule
placing it; no deviation apparatus needed because there is no phrase.

**Layer 2 — dense passages, grouped.** Same staccato notes, at the end of
the section, grouped *"at least by beaming or otherwise... phrases or
motives."* Rhythm: spatial first (heads organized around a shown beat),
notated rhythm / tuplets possibly later, maybe per-performer toggles — *"for
this, we should just settle on the presentation."* Framework: **ambient +
deviation + hairpin per phrase** (principles 2–4): the phrase's median band
is its marking; notes ≥ 1 band above get `>` (≥ 2: `^`); monotonic runs
over the perceptual threshold get a hairpin; softer deviations —
composer's choice among cue-size head / parenthesized mark / nothing.
**The composer's starting point: this layer** (*"achieving a variety of
dynamic within a phrase. So let's start there."*).

## 6. Proposals (P1–P5, as revised by the composer's directions)

- **P1 — Five wide bands** by velocity, thresholds from the measured
  tuba curve; middle collapsed per the composer.
- **P2 — Ambient + deviation** per phrase (layer 2) — `>` +1, `^` +2 at
  mf and above; softer deviations per composer's pick; suppressed at soft
  ambients (Ligeti).
- **P3 — Hairpins on monotonic runs** ≥ 4–5 notes spanning ≥ ~9 dB.
- **P4 — Provenance routing**: authored / played-in / generated → exact /
  ambient+deviation / range+instruction.
- **P5 — Working-view audit**: bricks coloured by band so thresholds can
  be judged before any mark reaches the page.

## 7. Measurements before building

1. **SI2 tuba velocity→dB ladder** (one render through the rig; same
   capture path as the 2n probes). Sets band thresholds and the hairpin
   threshold in real dB.
2. **Deviation census on T1 section 1** under P1+P2: the fraction of notes
   that would carry a mark. ~60 % means the model is wrong; 15–25 % means
   it reads.
3. **One dense phrase dry-run on paper** (layer 2): pick a run from the
   end of the build, show ambient + deviations + hairpins as text, judge
   by eye and ear before any notation code.

## 8. Open decisions (composer)

- The five-band set and its thresholds (after measurement 1).
- The softer-deviation device (cue head / parenthesized / none).
- Whether layer 1 one-shots ever carry accents or only the marking.
- The phrase unit for layer 2 (beamed group = chunker run? or composer-
  drawn groups?).

## 9. Still to obtain

- Khoo 2007 (the primary/inner-shading source) — only via Kosta.
- Gould, *Behind Bars*; Stone, *Music Notation in the Twentieth Century* —
  for the accent/dynamic placement rules cited from memory.
