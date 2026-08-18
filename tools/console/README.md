# Console scripts — the trance-section workflow (day 18, 2026-08-18)

The composer drives the final (Ghost-Trance) section by pasting console scripts
into the composer app, **not** by building panels. Panel-building was tried and
judged too labour-intensive for the return (composer, day 18). Scripts are handed
over **in chat as fenced code blocks** so they can be copied with one click —
not as files.

`trance_accretion.js` here is a working reference, not the delivery mechanism.

## The rules these scripts follow

**1. FULL CLEAR, never tag-filtered.** Use `Composer.objects=[]`. An earlier
version filtered on `properties.gen === TAG`; because different scripts carried
different tags (`burstPat`, `accBase`, `accFifths`), pasting one after another
left the previous script's notes behind and the score silently accumulated. The
scratch score is disposable — clear it all.

**2. Guard against clearing real work.**

```js
const PROTECTED=/^(tranceSB|piece-s|A1-|A2-|dens|clust|sl0|sc4|7tubas|tranceA001$)/i;
if(PROTECTED.test(Composer.sessionName)){console.error('...');return;}
```

Scripts do NOT rename the session. The composer loads one scratch score (`aud`),
and every paste overwrites it. Keepers are made with **CTRL+S**, which already
writes a timestamped copy into `scores/versions/` (rolling 20, gitignored) — so
there is no need to increment file names.

**3. Column labels must be placed by a collision test, never by "every Nth".**
`renderMarker` HARDCODES `font-size:10`, `y=24`, and draws text at `x+4`. You
cannot shrink, stagger or reposition per marker. At 150 bpm a column is only
`0.4 * pixelsPerSecond` px — 20 px at the default zoom, 9 px at zoom 22.5, while
a two-digit label measures ~11.7 px. Labelling every column overlapped in 39 of
48 pairs. Place labels in priority order against an explicit occupancy list:

```js
const put=(p,text,color)=>{const x=p*colPx+4,w=text.length*6.2;
  if(!placed.every(q=>x+w+3<q.x||x>q.x+q.w+3))return false; placed.push({x,w}); /* ...push marker... */ };
```

Verified zero overlaps at zoom 15 / 22.5 / 50 / 100 / 200 by reading `getBBox()`
of every rendered `<text>`.

**4. Labels go on META (layer 10), and the script must OPEN it.**
`#laneMeta` is `display:none` until it carries class `.open`, and it overlays
lanes 3-5. Anything drawn there is invisible by default:
`document.getElementById('laneMeta').classList.add('open')`.
Never put label text in a voice lane — notes fill ~88% of the lane height, so
the text lands on top of noteheads.

## Standing musical defaults

- **150 bpm always** unless told otherwise → pulse 0.4 s, staccato note 0.2 s.
- **Staccato range MIDI 30-65 = F#1-F4.** Every pitch class has exactly 3
  octaves in it (F# = 30/42/54; F#4 = 66 is out of range).
- **Lanes = 10 players.** `instruments.js` defines `tuba1`-`tuba10`.
- Redistribution across players is dealt from a shuffled deck, so a player
  cannot reappear until the others have been used — that is what makes "five
  single notes played by five different players" actually hold.

## Known non-issue, deliberately not fixed

Staccato sounds 0.45 s (`FIXED_TECHS`) but the pulse is 0.4 s, so a note can
still be ringing when the next begins. Measured on `tranceA001b`: 55 overlaps
are the same player on *different* pitches (harmless — the sampler is
polyphonic) and only 10 are the same player on the *same* pitch, where the tail
is cut ~50 ms early under a fresh attack. Nothing is dropped. The composer's
call: leave it. Lengthening the blocks to 0.45 s would make every column overlap
the next visually and start the conflict engine flagging same-player repeats.
