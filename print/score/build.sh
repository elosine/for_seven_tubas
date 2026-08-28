#!/usr/bin/env bash
# THE PRINT SCORE, END TO END — the answer to "how do I re-render after I change
# the score?" (composer, day 37).
#
# THE CHAIN, and the step that is easy to miss:
#
#     scores/<save>.json  --(notate_section)-->  notation/ir/db1.ir.json  --(export_print)-->  PDF
#                                                        ^^^^^^^^^^^^^^^
#     The print score is drawn from the IR, NOT from the save file. Edit the
#     score, re-run export_print alone, and you render the OLD notation with no
#     error of any kind. That is why --rebuild-ir exists.
#
#   bash print/score/build.sh                 # render the PDF from the IR as it stands
#   bash print/score/build.sh --rebuild-ir    # rebuild the IR from the score FIRST, then render
#
# The IR rebuild uses the IR's OWN recorded build command (`provenance.build`),
# which is the method the journal's tool table specifies — so it cannot drift
# from how the page was actually made.
#
# Density, margins, colour: pass through, e.g.
#   bash print/score/build.sh --sec 15
#   bash print/score/build.sh --margin 0.4
set -e
cd "$(dirname "$0")/../.."
OUT=print/score/BCB-score-DRAFT.pdf
IR=db1

REBUILD=0
PASS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --rebuild-ir) REBUILD=1; shift;;
    *) PASS+=("$1"); shift;;
  esac
done

if [ "$REBUILD" = "1" ]; then
  echo "=== REBUILDING $IR FROM ITS OWN provenance.build ==="
  # snapshot first: the IR schema is a GATE and a rejected build DELETES the page
  # (PROJECT_JOURNAL, "THE TRAPS THIS DAY FOUND" #1).
  cp "notation/ir/$IR.ir.json" "notation/ir/$IR.ir.json.bak"
  echo "  snapshot: notation/ir/$IR.ir.json.bak"
  CMD=$(node -e "process.stdout.write(require('./notation/ir/$IR.ir.json').provenance.build)")
  echo "  $ ${CMD:0:120}..."
  eval "$CMD"
  echo "=== IR rebuilt ==="
fi

echo "=== RENDERING THE PRINT SCORE ==="
node tools/export_print.js --ir "$IR" --cover on --out "$OUT" "${PASS[@]}"
echo "=== DONE ==="
ls -la "$OUT"
