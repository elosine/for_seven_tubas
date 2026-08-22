\version "2.24.0"
\paper {
  indent = 0
  ragged-right = ##t
  paper-width = 200\mm
  paper-height = 40\mm
  top-margin = 4\mm
  bottom-margin = 2\mm
  left-margin = 2\mm
  right-margin = 2\mm
  tagline = ##f
  print-page-number = ##f
  page-breaking = #ly:one-line-breaking
}
% the composer's own function, verbatim from lilypond_code/SATP001_pno.ly
#(define (flatten-tuplet-bracket grob)
   (let* ((pos (ly:grob-property grob 'positions))
          (max-pos (max (car pos) (cdr pos))))
     (ly:grob-set-property! grob 'positions (cons max-pos max-pos))))
\score {
  \new Staff \with {
    \remove "Time_signature_engraver"
    \remove "Clef_engraver"
    \override StaffSymbol.thickness = #1
  } {
    \override NoteHead.font-size = #-2
    \override Rest.font-size = #-2
    \override Stem.thickness = #1.3
    % --- the composer's tuplet standard ---
    \override TupletBracket.bracket-visibility = ##t
    \override TupletBracket.direction = #UP
    \override TupletBracket.after-line-breaking = #flatten-tuplet-bracket
    \override TupletBracket.padding = #0.5
    \override TupletNumber.text = #tuplet-number::calc-fraction-text
    \override TupletNumber.font-size = #-5
    c''4 s4
    \tuplet 3/2 { c''16 c''16 r16 } s4
    \bar ""
  }
  \layout { }
}
