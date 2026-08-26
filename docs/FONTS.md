# FONTS — the cover face, and why no font file is in this repo

## The cover face is **EngraversGothic BT** (Bitstream)

Used for the title and composer name on the printed covers — the look is
large caps + small caps, monoline sans, wide tracking:

> Trɪᴏ ғᴏʀ Tᴡᴏ Kᴏᴛᴏs ᴀɴᴅ Bᴀss Kᴏᴛᴏ

**You type it in ordinary mixed case.** The font holds SMALL CAPS in the
lowercase slots (a caps-and-small-caps design, like Copperplate Gothic), so
"Trio for Two Kotos and Bass Koto" typed normally produces the cover exactly.
Do not type it in all caps.

### How it was identified (day 36) — the method, for next time

Not by eye. `scores/Litany.pdf` (the 2003 Kotos score) embeds its fonts, and a
PDF names them in plain text:

```bash
node -e "const s=require('fs').readFileSync('scores/Litany.pdf','latin1');console.log([...new Set(s.match(/\/BaseFont\s*\/[A-Za-z0-9+#,._-]+/g))].join('\n'))"
```

That gives `LYZKPS+EngraversGothicBT-Regular` (the `LYZKPS+` prefix is a subset
tag the PDF producer added; the real name is `EngraversGothicBT-Regular`).

**Definitive because page 1's resource dictionary lists exactly one font** —
follow the page object to its `/Resources` → `/Font` and there is a single
entry. The rest of the file uses Petrucci (the old Finale music font), Centaur,
Times and Helvetica.

*That PDF was made in PowerPoint on Mac OS X 10.2.6 and PDF'd by Quartz.*

### It is NOT these two, which are easy to reach for and wrong

| | |
|---|---|
| **Copperplate Gothic** (ships with Windows) | the same caps/small-caps structure but with small flared **serifs** |
| **Engravers MT** (ships with Office) | a full **serif** face |

Engravers Gothic is the serifless one.

## Where to get it

**[Engravers' Gothic BT Std Regular](https://www.myfonts.com/products/engravers-gothic-engravers-gothic-434681)** — MyFonts, about **$29.99** desktop licence.
One-style family; there is no weight to choose. Bitstream's library is sold
through Monotype now, so fonts.com carries it too.

## Why no font file is in this repo

`fonts/` is **gitignored**. This repo is public, and a font is licensed
*software*: committing one republishes it. **No desktop licence permits that** —
not even a purchased one, which covers installing on N machines, not
redistribution.

**The printed score is unaffected.** Typeset output contains no font, and in the
US typeface *designs* are not copyrightable at all (37 CFR 202.1(e)) — only the
font software is. Ink on paper raises no question.

**To set this up on another machine:** keep your licensed copy somewhere private
(OneDrive, Dropbox, a private repo) and install from there.

## Installing (Windows)

Right-click the `.ttf` → **Install for all users**. Or scripted, per-user, no
admin:

```bash
cp "EngraversGothic BT Regular.ttf" "$LOCALAPPDATA/Microsoft/Windows/Fonts/"
```

then add a `String` value under
`HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts` named
`EngraversGothic BT Regular (TrueType)` whose data is that full path.
Restart any app that needs to see it.

Apps then list it as **`EngraversGothic BT`**.

## One caveat if you export PDFs — check the embedding

This font's `OS/2` embedding flag is **`fsType = 0x000E`**, which sets three
*mutually exclusive* bits at once (restricted + preview/print + editable). It is
malformed, and tools disagree about it: lenient readers take the least
restrictive reading and embed; strict ones see the restricted bit and refuse.

**Empirically it does embed** — `Litany.pdf` carries a working subset of it.
But verify on any new toolchain rather than assuming, because a font that
silently fails to embed is discovered by the printer, not by you:

```bash
node -e "const s=require('fs').readFileSync('YOURFILE.pdf','latin1');console.log(/EngraversGothic/.test(s)?'EMBEDDED':'NOT EMBEDDED - the printer will substitute');"
```
