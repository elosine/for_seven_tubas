# analyze_filmcheck.py — read a slow-motion phone film of the FILM CHECK clip
# (make_filmcheck.js) and count what the screen REALLY showed.
#
#   python testkit/analyze_filmcheck.py <film.mp4> <result.json>
#
# The fast bar steps one place per video frame across 60 places; on film each
# displayed frame is a run of camera frames at one position. So:
#   distinct runs per second = frames the screen actually showed
#   a step of 2 places       = a video frame that never reached the screen
#   fewer runs than refreshes = frames held on screen longer than one refresh
# The camera's rate is calibrated from the slow bar (one step per second of
# video), so a phone's slow-motion retiming does not matter.
import subprocess, sys, json
import numpy as np

src, out_json = sys.argv[1], sys.argv[2]

def decode(vf, w, h):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w)

# ---- pass 1: find the two bars' strips from how often each pixel flickers
LW, LH = 192, 108
F = decode('scale=%d:%d' % (LW, LH), LW, LH).astype(np.float32)
n = F.shape[0]
lo, hi = np.percentile(F, 5, axis=0), np.percentile(F, 99.5, axis=0)
lit = F > (lo + hi) / 2
contrast = (hi - lo) > 40
edges = np.logical_and(~lit[:-1], lit[1:]).sum(axis=0) * contrast
fast = edges >= max(8, np.percentile(edges[edges > 0], 75) * 0.5) if (edges > 0).any() else edges > 0
slow = (edges >= 1) & (edges <= 4) & contrast & ~fast

def box(mask, pad=1):
    ys, xs = np.nonzero(mask)
    if len(xs) < 4:
        return None
    return max(0, ys.min() - pad), min(LH, ys.max() + 1 + pad), max(0, xs.min() - pad), min(LW, xs.max() + 1 + pad)

fb, sb = box(fast), box(slow)
if fb is None:
    sys.exit('could not find the fast bar — is the whole picture in the film?')

# ---- pass 2: the bar's position in every camera frame (column profile of its strip)
def profile(b, width=960):
    sy, ey, sx, ex = b
    # full-resolution crop of the strip, averaged down to one row
    vf = "crop=iw*%f:ih*%f:iw*%f:ih*%f,scale=%d:1:flags=area" % ((ex - sx) / LW, (ey - sy) / LH, sx / LW, sy / LH, width)
    return decode(vf, width, 1)[:, 0, :].astype(np.float32)

def positions(P):
    # subtract each column's typical brightness over time: anything static (the
    # picture's white border beside the bar's first place, glare) vanishes and
    # only the moving bar is left — the border captured the tracker in v1
    P = P - np.median(P, axis=0)[None, :]
    x = np.full(P.shape[0], np.nan)
    for i, p in enumerate(P):
        j = int(np.argmax(p))
        if p[j] < 30:
            continue
        a, b = max(0, j - 12), min(len(p), j + 13)
        w = np.clip(p[a:b] - p[j] / 2, 0, None)
        if w.sum() > 0:
            x[i] = (np.arange(a, b) * w).sum() / w.sum()
    return x

def to_index(x, places=60):
    v = np.sort(x[~np.isnan(x)])
    gaps = np.diff(v)
    if len(v) < places * 3:
        return None, 'too few bar sightings'
    # cluster the sightings into the bar's places: split at the 59 widest gaps
    cut = np.sort(np.argsort(gaps)[-(places - 1):])
    centres = np.array([seg.mean() for seg in np.split(v, cut + 1)])
    idx = np.full(len(x), -1)
    ok = ~np.isnan(x)
    idx[ok] = np.abs(x[ok][:, None] - centres[None, :]).argmin(axis=1)
    return idx, 'clustered'

xf = positions(profile(fb))
idx, how = to_index(xf)
if idx is None:
    sys.exit('fast bar: ' + how)
# the film may be mirrored: then the bar steps backwards
d_raw = np.diff(idx[idx >= 0])
d_raw = d_raw[d_raw != 0] % 60
if np.median(d_raw) > 30:
    idx = np.where(idx >= 0, 59 - idx, -1)

# the camera's rate: camera frames per step of the slow bar (one step per video second)
cam_fps = None
if sb is not None:
    xs = positions(profile(sb, 480))
    k = np.nonzero(~np.isnan(xs))[0]
    if len(k) > 10:
        stepf = k[1:][np.abs(np.diff(xs[k])) > 3]          # frames where the slow bar moved
        if len(stepf) >= 3:
            cam_fps = float(np.median(np.diff(stepf)))
if cam_fps is None:
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format_tags=com.android.capture.fps:stream=avg_frame_rate',
                            '-of', 'default=nw=1:nk=1', src], capture_output=True, text=True).stdout.split()
    try:
        cam_fps = float([p for p in probe if '/' not in p][0])
    except Exception:
        num, den = probe[0].split('/'); cam_fps = float(num) / float(den)

# ---- the count: runs of one position = one displayed frame
good = np.nonzero(idx >= 0)[0]
lo_i, hi_i = good[0] + int(cam_fps), good[-1] - int(cam_fps)       # drop a second at each end
seq = idx[lo_i:hi_i]
runs, lengths = [], []
for v in seq:
    if v < 0:
        continue
    if runs and runs[-1] == v:
        lengths[-1] += 1
    else:
        runs.append(int(v)); lengths.append(1)
steps = (np.diff(runs) % 60)
glitch = int(((steps == 0) | (steps > 10)).sum())
steps = steps[(steps > 0) & (steps <= 10)]
seconds = (hi_i - lo_i) / cam_fps
refreshes = seconds * 60
res = {
    'film': src, 'cameraFramesPerRealSecond': round(cam_fps, 2), 'secondsCounted': round(seconds, 2),
    'framesShownPerSecond': round(len(runs) / seconds, 2),
    'videoFramesAdvancedPerSecond': round(float(steps.sum()) / seconds, 2),
    'skippedPerSecond': round(float(np.clip(steps - 1, 0, None).sum()) / seconds, 2),
    'skippedTotal': int(np.clip(steps - 1, 0, None).sum()),
    'heldPerSecond': round(max(0.0, refreshes - len(runs)) / seconds, 2),
    'glitches': glitch, 'mapping': how,
    'meaning': 'a 60 Hz screen showing every frame reads 60 shown, 60 advanced, 0 skipped, 0 held',
}
print(json.dumps(res, indent=1))
json.dump(res, open(out_json, 'w'), indent=1)
