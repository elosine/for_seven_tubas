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
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override Rest.font-size = #-2
    c''4 s4
    r8  s4
    r16 s4
    r32 s4
    r4  s4
    \bar ""
  }
  \layout { }
}
