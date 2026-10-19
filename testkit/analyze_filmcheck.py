# analyze_filmcheck.py — read a slow-motion phone film of the FILM CHECK clip
# (make_filmcheck.js) and count what the screen REALLY showed.
#
#   python testkit/analyze_filmcheck.py <film.mp4> <result.json>
#
# The fast bar steps one place per video frame across 60 places; on film each
# displayed frame is a run of camera frames at one place. So:
#   distinct runs per second = frames the screen actually showed
#   a step of 2 places       = a video frame that never reached the screen
#   fewer runs than refreshes = frames held on screen longer than one refresh
# The bar wraps once per video second, so the camera frames between wraps give
# the camera's own rate — a phone's slow-motion retiming does not matter.
#
# v3 (the first real film, iPad 2026-10-18). A hand-held phone DRIFTS — the
# picture slides and zooms over 40 s — and the dark picture REFLECTS the room.
# v1 fixed the bar's places once for the whole film and broke on both; v2 worked
# a second at a time but mistook the drifting BORDER for the bar beside it
# (false "pauses" at places 0 and 59, beginning on second boundaries) and
# sometimes found the iPad's edge instead of the border. v3:
#   · the border is found per second as the strongest THIN bright line on each
#     side, and accepted only if the picture it outlines has the clip's 16:9
#     shape; a second that fails borrows its border from its neighbours
#   · that second's static picture is subtracted, then a filter the WIDTH OF THE
#     BAR finds the bar — the border line is a sixth of that width and a drifting
#     line leaves a thin +/− pair, which the bar-wide filter all but ignores
#   · only true wraps (late place → early place) time the camera and bound the
#     counted stretch, which is whole video seconds from one wrap to another
# v4 (the eye check of the same film): in a dim room the phone exposes each
# frame for most of its 1/120 s, so about half the camera frames catch TWO video
# frames — the bar at n and at n+1, both at full brightness. v3 took whichever
# stood out a hair more, a coin toss, and every wrong toss read as a held frame
# plus a skipped one (2.1/s on the iPad film, none of them real). And a phone
# held landscape reads its sensor ACROSS the picture, so at a wrap one camera
# frame can hold place 59 on the right and place 0 on the left at once. So each
# camera frame reads the NEXT bar ahead of the last reading — the nearest one
# that is ahead, not the furthest — and each frame the screen showed is counted
# once; a frame never shown still reads as a jump of two places.
# v6: the border is re-measured in every camera frame (hand tremor), and each
# of the 60 places is looked at where it must be — readings are whole places.
# The counted stretch ends where the film stops showing the bar (the picture
# closing, the camera stopping) — a second with no readings is not "0 shown".
import subprocess, sys, json
import numpy as np

src, out_json = sys.argv[1], sys.argv[2]
DW, DH = 960, 540                      # decode size
CHUNK = 120                            # camera frames examined together ("a second" at 120 fps)
CW, CH_ = 480, 270                     # the clip's own drawing size (make_filmcheck.js)
ASPECT = (CW - 1) / (CH_ - 1)          # border-centre to border-centre
FAST_V = (0.36, 0.54)                  # the middle of the fast bar's rows, as a share of the picture's height

def chunks():
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'scale=%d:%d' % (DW, DH), '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         stdout=subprocess.PIPE)
    n = DW * DH
    while True:
        b = p.stdout.read(n * CHUNK)
        if not b:
            break
        k = len(b) // n
        if k:
            yield np.frombuffer(b[:k * n], np.uint8).reshape(k, DH, DW).astype(np.float32)
    p.wait()

def thin_line(p):
    """how much each point stands above BOTH its sides — high for a thin bright line, ~0 for an edge"""
    q = np.pad(p, 8, mode='edge')
    left = np.array([q[i + 1:i + 5].mean() for i in range(len(p))])
    right = np.array([q[i + 12:i + 16].mean() for i in range(len(p))])
    return p - np.maximum(left, right)

def peak(r, a, b):
    j = a + int(np.argmax(r[a:b]))
    if 0 < j < len(r) - 1:
        y0, y1, y2 = r[j - 1], r[j], r[j + 1]
        d = y0 - 2 * y1 + y2
        return j + (0.5 * (y0 - y2) / d if d != 0 else 0.0), float(r[j])
    return float(j), float(r[j])

def find_border(M):
    rows = M[:, int(DW * 0.4):int(DW * 0.6)].mean(axis=1)
    lr = thin_line(rows)
    yT, sT = peak(lr, 0, DH // 2)
    yB, sB = peak(lr, DH // 2, DH)
    h = yB - yT
    if h < DH * 0.3:
        return None
    band = M[int(yT + FAST_V[0] * h):int(yT + FAST_V[1] * h), :].mean(axis=0)
    lc = thin_line(band)
    xL, sL = peak(lc, 0, DW // 2)
    xR, sR = peak(lc, DW // 2, DW)
    if min(sT, sB, sL, sR) < 15:
        return None
    if abs((xR - xL) / h / ASPECT - 1) > 0.06:
        return None
    return np.array([yT, yB, xL, xR])

# ---- pass 1: each second's static picture, and its border
Ms, B = [], []
for F in chunks():
    M = np.median(F, axis=0)
    Ms.append(M.astype(np.uint8))
    B.append(find_border(M))
n_chunks = len(B)
ok = np.array([b is not None for b in B])
if ok.sum() < 3:
    sys.exit('could not find the picture\'s white border — is the whole picture, border included, in the film?')
arr = np.array([b if b is not None else [np.nan] * 4 for b in B])
# a border far from its neighbours' is a mistake too
for i in np.nonzero(ok)[0]:
    nb = [j for j in range(max(0, i - 2), min(n_chunks, i + 3)) if j != i and ok[j]]
    if len(nb) >= 2 and np.abs(arr[i] - np.median(arr[nb], axis=0)).max() > 0.03 * DW:
        ok[i] = False
idx_ok = np.nonzero(ok)[0]
border = np.array([[np.interp(c, idx_ok, arr[idx_ok, q]) for q in range(4)] for c in range(n_chunks)])

# ---- pass 2: every camera frame — which of the 60 places hold a bar (place, strength)
# The frame's own border is measured again in EVERY camera frame (a hand shakes
# within a second), from the border line's OUTER edge — the side away from the
# picture, where no bar ever sits; the outer edges ARE the clip's own edges
# (x = 0 and x = 480), so the 60 places are mapped straight from them, and the
# per-second border only says where to look. (Mapping from the line's centre
# plus an offset carried a 5-px border error into place 0, whose bar touches the
# border line, and lost it at every wrap.) Each place is then looked at where it
# must be: a reading is a whole place by construction, so two bars side by side
# can never read as one bar half-way between them.
def outer_edge(p, x0, side):
    """sub-pixel position where the border line rises, seen from outside the picture"""
    a, b = max(1, int(x0) - 12), min(len(p) - 1, int(x0) + 13)
    w = p[a:b]
    out = w[:6].min() if side == 'left' else w[-6:].min()
    thr = (out + w.max()) / 2
    rng = range(a, b) if side == 'left' else range(b - 1, a - 1, -1)
    prev = None
    for i in rng:
        if p[i] >= thr:
            if prev is None:
                return None
            return prev + (thr - p[prev]) / (p[i] - p[prev]) * (i - prev)
        prev = i
    return None

cands, strength = [], []
K = np.arange(60)
for c, F in enumerate(chunks()):
    yT, yB, xL, xR = border[c]
    h = yB - yT
    r0, r1 = int(yT + FAST_V[0] * h), int(yT + FAST_V[1] * h)
    step = (xR - xL) / (CW - 1) * 8                        # one place, in decoded pixels
    wb = max(3, int(round(step * 0.6)))                    # the filter: most of a bar's width (a bar is 3/4 of a place)
    box = np.ones(wb) / wb
    PM = Ms[c][r0:r1, :].astype(np.float32).mean(axis=0)
    half_line = 0.5 * (xR - xL) / (CW - 1)
    eLm, eRm = outer_edge(PM, xL, 'left'), outer_edge(PM, xR, 'right')
    if eLm is None: eLm = xL - half_line
    if eRm is None: eRm = xR + half_line
    P = F[:, r0:r1, :].mean(axis=1)
    cols = np.arange(DW)
    for p in P:
        eL, eR = outer_edge(p, xL, 'left'), outer_edge(p, xR, 'right')
        if eL is None or abs(eL - eLm) > 10: eL = eLm
        if eR is None or abs(eR - eRm) > 10: eR = eRm
        sh = (eL - eLm + eR - eRm) / 2                     # this frame's shift against the second's still picture
        D = p - np.interp(cols - sh, cols, PM)             # the still picture, moved with the frame, taken away
        r = np.convolve(D, box, mode='same')
        xk = eL + (8 * K + 4) / CW * (eR - eL)             # place k's bar centre (clip x = 8k + 4 of 0..480) in THIS frame
        s = np.interp(xk, cols, r)
        top = float(s.max())
        cands.append([(int(k), float(s[k])) for k in K[s >= 0.45 * top]])      # bright (>= 0.75 top) and dim ones
        strength.append(top)
strength = np.array(strength)
# "a bar is there" = it stands out at least 40 % as much as the bar typically does while playing
typical = np.percentile(strength, 75)
present = strength >= 0.4 * typical

def read(cands, mirrored):
    """one place per camera frame: the NEXT bright bar ahead of the last reading (within 10 places),
    or a dimmer one between them — a frame caught as its neighbour is still rising (at a wrap the
    two ends of the picture are caught a few ms apart) — else stay. Ghosts only ever trail BEHIND."""
    out, prev = np.full(len(cands), np.nan), None
    for i, ks_all in enumerate(cands):
        if not present[i] or not ks_all:
            continue
        ks_all = [(59 - k if mirrored else k, v) for k, v in ks_all]
        ks = [(k, v) for k, v in ks_all if v >= 0.75 * strength[i]]
        if prev is None:
            k = max(ks, key=lambda kv: kv[1])[0]
        else:
            ahead = [(((k - prev + 0.5) % 60) - 0.5, k) for k, _ in ks]
            fwd = [a for a in ahead if 0.5 < a[0] <= 10.5]
            here = [a for a in ahead if a[0] <= 0.5 and a[0] >= -0.5]
            if fwd:
                a_next, k = min(fwd)
                between = [(((kk - prev + 0.5) % 60) - 0.5, kk) for kk, _ in ks_all]
                between = [b for b in between if 0.5 < b[0] < a_next]
                if between:
                    k = min(between)[1]
            elif here:
                k = here[0][1]
            else:
                k = max(ks, key=lambda kv: kv[1])[0]
        out[i] = k
        prev = k
    return out

places = read(cands, False)

def runs_of(pl):
    runs, lens, starts = [], [], []
    for i, k in enumerate(pl):
        if np.isnan(k):
            continue
        if runs and abs(k - runs[-1]) < 0.5:
            lens[-1] += 1
        else:
            runs.append(k); lens.append(1); starts.append(i)
    return np.array(runs), np.array(lens), np.array(starts)

runs, lens, starts = runs_of(places)
if len(runs) < 120:
    sys.exit('the fast bar was found in too few frames (%d runs) — is the whole picture, border included, in the film?' % len(runs))
# the film may be mirrored: then the bar steps backwards (judged from the brightest bar alone)
naive = np.array([max(ks, key=lambda kv: kv[1])[0] if (present[i] and ks) else np.nan for i, ks in enumerate(cands)])
nr, _, _ = runs_of(naive)
mirrored = len(nr) > 2 and np.median(np.round(np.diff(nr)) % 60) > 30
if mirrored:
    places = read(cands, True)
    runs, lens, starts = runs_of(places)

# true wraps: a late place followed by an early one
d = np.diff(runs)
wrap_i = np.nonzero((d < -30) & (runs[:-1] > 40) & (runs[1:] < 20))[0] + 1
wraps = starts[wrap_i]
gaps = np.diff(wraps)
if len(gaps) < 5:
    sys.exit('too few wraps of the fast bar (%d) to time the camera' % len(wraps))
cam = float(np.median(gaps))
# the counted stretch: whole video seconds between wraps that come about a second apart,
# with the bar read in nearly every camera frame between them
seen = ~np.isnan(places)
cover = np.array([seen[wraps[i]:wraps[i + 1]].mean() for i in range(len(gaps))])
good = (np.abs(gaps / cam - 1) < 0.2) & (cover > 0.9)
first = int(np.argmax(good))
last = first
while last < len(good) and good[last]:                    # the first unbroken run of good seconds
    last += 1
w0, w1 = wraps[first], wraps[last]
probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format_tags=com.android.capture.fps', '-of', 'default=nw=1:nk=1', src],
                       capture_output=True, text=True).stdout.strip()

sel = np.nonzero((starts >= w0) & (starts < w1))[0]
seconds = (w1 - w0) / cam
shown = len(sel)
st = np.round(runs[sel[1:]] - runs[sel[:-1]]).astype(int) % 60 if len(sel) > 1 else np.array([], int)
# steps: 1 normal · 2–10 skips · 11–49 a JUMP (a stall caught up) · 50–59 a back-step (the camera caught two frames mid-change)
normal = int((st == 1).sum())
skip_st = st[(st >= 2) & (st <= 10)]
jump_st = st[(st >= 11) & (st <= 49)]
back = int((st >= 50).sum() + (st == 0).sum())
skipped = int((skip_st - 1).sum() + (jump_st - 1).sum())
skip_at = starts[sel[1:]][(st >= 2) & (st <= 49)]
per_sec = np.bincount(((starts[sel] - w0) / cam).astype(int))[:int(round(seconds))]
L = lens[sel]
res = {
    'film': src, 'method': 'v6 — border checked against 16:9 per second and re-measured every camera frame; the still picture subtracted; each of the 60 places looked at where it must be; the NEXT bar ahead; timed by true wraps; unbroken seconds only',
    'mirrored': bool(mirrored),
    'cameraFramesSeeingTwoFrames': round(float(np.mean([sum(v >= 0.75 * strength[i] for _, v in ks) >= 2 for i, ks in enumerate(cands) if present[i]])), 3),
    'cameraFramesPerVideoSecond': round(cam, 2), 'phoneSaysCaptureFps': probe or None,
    'secondsCounted': round(seconds, 2), 'secondsInFilm': n_chunks, 'bordersFoundDirectly': int(sum(b is not None for b in B)), 'bordersTrusted': int(ok.sum()),
    'framesShownPerSecond': round(shown / seconds, 2),
    'skippedPerSecond': round(skipped / seconds, 2), 'skippedTotal': skipped,
    'heldPerSecond': round(max(0.0, seconds * 60 - shown) / seconds, 2),
    'steps': {'normal': normal, 'skips': int(len(skip_st)), 'jumps': int(len(jump_st)), 'backSteps': back},
    'shownEachSecond': {'min': int(per_sec.min()), 'median': float(np.median(per_sec)), 'max': int(per_sec.max())} if len(per_sec) else None,
    'runLengthCameraFrames': {str(int(k)): int(v) for k, v in zip(*np.unique(L, return_counts=True))},
    'skipSpacingVideoFrames': (round(float(np.median(np.diff(skip_at)) / cam * 60), 1) if len(skip_at) > 2 else None),
    'meaning': 'a 60 Hz screen showing every frame reads 60 shown, 0 skipped, 0 held; '
               'runs cluster at cameraFps/60 camera frames per shown frame (2 at 120 fps; 1+3 pairs are the camera\'s phase, not the screen)',
}
print(json.dumps(res, indent=1))
json.dump(res, open(out_json, 'w'), indent=1)
