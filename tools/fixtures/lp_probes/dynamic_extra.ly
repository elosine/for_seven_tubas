\version "2.24.0"
\paper {
  indent = 0
  ragged-right = ##t
  paper-width = 200\mm
  paper-height = 30\mm
  top-margin = 2\mm
  bottom-margin = 2\mm
  left-margin = 2\mm
  right-margin = 2\mm
  tagline = ##f
  print-page-number = ##f
  page-breaking = #ly:one-line-breaking
}
sfp = #(make-dynamic-script "sfp")
sfzp = #(make-dynamic-script "sfzp")
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override DynamicText.font-size = #-8.5
    c''4\sfz  s4
    c''4\fp   s4
    c''4\sfp  s4
    c''4\sfzp s4
    c''4^\accent  s4
    c''4^\marcato s4
    \bar ""
  }
  \layout { }
}
