#!/usr/bin/env python3
"""RMS meter for gain staging: reports the loudest 2-second RMS window in dBFS
(and sample peak). Usage: python probes/measure_rms.py <wav>"""
import sys
import numpy as np
import soundfile as sf

x, sr = sf.read(sys.argv[1], always_2d=True)
x = x.mean(axis=1)
win, hop = int(sr * 2.0), int(sr * 0.1)
n = max(1, 1 + (len(x) - win) // hop)
best = max(np.sqrt(np.mean(x[i*hop:i*hop+win]**2) + 1e-12) for i in range(n))
peak = np.max(np.abs(x))
print(f"loudest 2s RMS: {20*np.log10(best):.2f} dBFS")
print(f"sample peak:    {20*np.log10(peak + 1e-12):.2f} dBFS{'  (CLIPPING!)' if peak >= 0.9995 else ''}")
target = -18.0
print(f"adjust instance master by: {target - 20*np.log10(best):+.1f} dB  (target {target} dBFS RMS)")
