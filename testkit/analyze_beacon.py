# the beacon video: two screens flash white at every whole second of the shared
# room clock. Find the two screens, find each flash onset (sub-frame, by the
# brightness crossing), check the camera rate from one screen's own flash
# interval (1 s apart by construction), and measure the offset between screens.
import subprocess, sys, json
import numpy as np

# usage: python testkit/analyze_beacon.py <video> <result.json>
src = sys.argv[1]
W, H = 96, 54
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'scale=%d:%d,format=gray' % (W, H), '-f', 'rawvideo', '-'],
                     capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = F.shape[0]
print('frames', n)

# cells that flash: big spread between their typical and their brightest level
med = np.median(F, axis=0)
hi = np.percentile(F, 99.5, axis=0)
amp = hi - med
flash_cells = amp > max(40, 0.5 * amp.max())
ys, xs = np.nonzero(flash_cells)
print('flashing cells', len(xs), 'of', W * H, '· amp max %.0f' % amp.max())

# two screens: split the flashing cells at the widest gap in x (fallback: median)
ux = np.unique(xs)
gaps = np.diff(ux)
if len(gaps) and gaps.max() > 2:
    cut = ux[np.argmax(gaps)] + gaps.max() / 2
else:
    cut = np.median(xs)
groups = {'left': xs < cut, 'right': xs >= cut}
series = {}
for name, m in groups.items():
    gy, gx = ys[m], xs[m]
    s = F[:, gy, gx].mean(axis=1)
    series[name] = s
    print(name, 'screen: %d cells, x %d-%d, y %d-%d, base %.0f flash %.0f' % (m.sum(), gx.min(), gx.max(), gy.min(), gy.max(), np.median(s), np.percentile(s, 99.5)))

def onsets(s):
    base, top = np.median(s), np.percentile(s, 99.5)
    th = base + 0.5 * (top - base)
    out = []
    i = 1
    while i < len(s):
        if s[i - 1] < th <= s[i]:
            # sub-frame crossing by linear interpolation
            out.append(i - 1 + (th - s[i - 1]) / (s[i] - s[i - 1]))
            i += 20          # skip the rest of this flash
        else:
            i += 1
    return np.array(out)

on = {k: onsets(v) for k, v in series.items()}
for k, v in on.items():
    d = np.diff(v)
    print(k, 'flashes', len(v), '· interval median %.2f frames (mean %.2f, sd %.2f)' % (np.median(d), d.mean(), d.std()))

# camera rate from each screen's own 1-s flash interval
fpb = float(np.median(np.concatenate([np.diff(v) for v in on.values()])))
ms_per_frame = 1000.0 / fpb
print('frames per real second (from the flashes): %.2f -> %.3f ms per frame' % (fpb, ms_per_frame))

# pair each left onset with the nearest right onset (within half a second)
L, R = on['left'], on['right']
pairs = []
for t in L:
    j = np.argmin(np.abs(R - t))
    if abs(R[j] - t) < fpb / 2:
        pairs.append((R[j] - t) * ms_per_frame)
p = np.array(pairs)
print('paired flashes', len(p))
print('RIGHT minus LEFT (ms): mean %.1f · median %.1f · sd %.1f · min %.1f · max %.1f' % (p.mean(), np.median(p), p.std(), p.min(), p.max()))
print('per flash:', ' '.join('%.0f' % x for x in p))
json.dump({'framesPerSecond': float(fpb), 'msPerFrame': ms_per_frame, 'pairs': len(p), 'rightMinusLeftMs': {'mean': float(p.mean()), 'median': float(np.median(p)), 'sd': float(p.std()), 'min': float(p.min()), 'max': float(p.max())},
           'perFlashMs': [round(float(x), 1) for x in p]}, open(sys.argv[2], 'w'), indent=1)
