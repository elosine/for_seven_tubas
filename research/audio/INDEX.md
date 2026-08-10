# Research audio index

*WAVs are kept OUT of git for now (size; see .gitignore) but live in this stable
folder, safe from Reaper media cleanup. Long-term archival choice (git-LFS / FLAC
commits / external) pending — composer: "when we get to it, we'll hold on to the
audio files as well." Every file is referenced from the experiment logs by name.*

| File | Date | Experiment | Contents | Original Reaper file |
|---|---|---|---|---|
| `2026-08-10_cresc-sample-lengths_F0-E3.wav` | 2026-08-10 | 1c (sample-length probe) | 36 chromatic notes F0–E3, Cresc&Decr KS C#0-tail, 15 s holds → docs/SI2_tuba_sample_lengths.md | 03-REC-260810_1033.wav |
| `2026-08-10_cc7-calibration-33steps.wav` | 2026-08-10 | S0 / E0 | 33 retriggered Ordinario notes, CC7 0→127 → probes/cc7_map.json | 03-REC-260810_1134.wav |
| `2026-08-10_ceiling-precal.wav` | 2026-08-10 | Gain staging | ceiling stimulus BEFORE calibration (−10.75 dBFS RMS, clipping) | 03-REC-260810_1200.wav |
| `2026-08-10_ceiling-postcal.wav` | 2026-08-10 | Gain staging | ceiling stimulus AFTER calibration (−17.83 dBFS RMS, clean) | 03-REC-260810_1204.wav |

**Not yet recorded:** S1a shape line-up and S1c spectrum auditions were monitored live,
no take kept. If paper-bound, re-record from the saved score (curves are versioned in
`scores/7tubas.json` — any past state reproducible from git history).
