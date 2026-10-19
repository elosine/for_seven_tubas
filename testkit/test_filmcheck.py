# test_filmcheck.py — prove analyze_filmcheck.py before (and since) a real film.
#
#   python testkit/test_filmcheck.py
#
# Synthesizes the phone's view: a 60 Hz screen showing the film-check picture
# (optionally DROPPING every 9th frame — what Safari's counters claimed), filmed
# by a 120 fps camera off-centre, smaller, slightly blurred and noisy. The
# analyser must read back what was simulated.
# The HARD films add what the first real film had (iPad, 2026-10-18): a
# hand-held camera that drifts and zooms, a reflection on the dark picture,
# the LCD's ghost of the previous frame, the paused picture during the
# countdown and after the end, and a long exposure (a dim room) that often
# spans a refresh, so a camera frame holds two video frames at full brightness.
import subprocess, sys, json, os, tempfile
import numpy as np

W, H, STEP, BAR = 480, 270, 8, 6
FAST, SLOW = (round(H * 0.28), round(H * 0.62)), (round(H * 0.72), round(H * 0.88))

def picture(nv):
    b = np.zeros((H, W), np.float32)
    x0 = 1 + (nv % 60) * STEP; b[FAST[0]:FAST[1], x0:x0 + BAR] = 255
    x1 = 1 + ((nv // 60) % 60) * STEP; b[SLOW[0]:SLOW[1], x1:x1 + BAR] = 255
    return b

def edges():
    b = np.zeros((H, W), np.float32)
    b[0, :] = b[-1, :] = b[:, 0] = b[:, -1] = 255
    return b

def film(path, drop_every, seconds=20, cam=120, phase=0.37, seed=1, hard=False):
    rng = np.random.default_rng(seed)
    CW, CH = 640, 360
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', '%dx%d' % (CW, CH), '-r', str(cam),
                           '-i', 'pipe:0', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    head, tail = (2.0, 1.0) if hard else (0.0, 0.0)
    total = head + seconds + tail
    Y, X = np.mgrid[0:CH, 0:CW]
    last_shown = 0
    for k in range(int(total * cam)):
        t = k / cam
        tp = t - head                                 # the clip's own time
        if tp < 0:
            shown, prev = 0, 0                        # the countdown: paused on the first frame
        elif tp >= seconds:
            shown, prev = last_shown, last_shown      # after the end: paused on the last
        else:
            v = int(np.floor(tp * 60 + phase))        # the refresh this camera frame sees
            shown = v - 1 if drop_every and v % drop_every == drop_every - 1 else v   # the screen held the previous frame
            pv = v - 1
            prev = pv - 1 if drop_every and pv % drop_every == drop_every - 1 else pv
            last_shown = shown
        scr = picture(shown) + edges()
        if hard and 0 <= tp < seconds:
            ve = int(np.floor((tp + 0.9 / cam) * 60 + phase))   # the refresh at the END of this exposure
            if ve != v:
                nxt = ve - 1 if drop_every and ve % drop_every == drop_every - 1 else ve
                scr = np.maximum(scr, picture(nxt))
        if hard and prev != shown:
            scr = np.maximum(scr, 0.35 * picture(prev))                 # the LCD's ghost of the frame before
        s = 1.05 * (1 + (0.02 + 0.02 * np.sin(t / 7.0) if hard else 0))  # zoom drift
        hh, ww = int(H * s), int(W * s)
        ys = np.round(np.arange(hh) * (H - 1) / (hh - 1)).astype(int)
        xs = np.round(np.arange(ww) * (W - 1) / (ww - 1)).astype(int)
        pic = scr[np.ix_(ys, xs)]
        pic = (pic + np.roll(pic, 1, 1) + np.roll(pic, -1, 1)) / 3       # a little optical blur
        oy, ox = (40 + int(round(10 * np.sin(t / 3.1))), 50 + int(round(12 * np.sin(t / 4.3 + 1)))) if hard else (40, 60)
        img = np.full((CH, CW), 18, np.float32)
        img[oy:oy + hh, ox:ox + ww] = 18 + pic * 0.8
        if hard:                                       # a reflection drifting across the dark picture
            cx, cy = 320 + 150 * np.sin(t / 5.0), 180 + 60 * np.cos(t / 6.0)
            img += 30 * np.exp(-((X - cx) ** 2 + (Y - cy) ** 2) / (2 * 70.0 ** 2))
        img += rng.normal(0, 4, img.shape)
        ff.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close(); ff.wait()

here = os.path.dirname(os.path.abspath(__file__))
fails = 0
for hard in (False, True):
    for drop, expect_shown, expect_skip in ((0, 60.0, 0.0), (9, 60 * 8 / 9, 60 / 9)):
        with tempfile.TemporaryDirectory() as d:
            f, j = os.path.join(d, 'film.mp4'), os.path.join(d, 'r.json')
            film(f, drop, hard=hard)
            p = subprocess.run([sys.executable, os.path.join(here, 'analyze_filmcheck.py'), f, j], capture_output=True, text=True)
            if p.returncode != 0:
                print('FAIL %s drop every %s: the analyser stopped — %s' % ('hard' if hard else 'plain', drop or 'none', (p.stderr or p.stdout).strip()[-300:]))
                fails += 1
                continue
            r = json.load(open(j))
        ok = (abs(r['framesShownPerSecond'] - expect_shown) <= 1.0 and abs(r['skippedPerSecond'] - expect_skip) <= 0.7
              and abs(r['cameraFramesPerVideoSecond'] - 120) <= 3 and r['steps']['jumps'] == 0 and r['steps']['backSteps'] <= 2)
        fails += not ok
        print(('PASS' if ok else 'FAIL') + ' %s drop every %s: shown %.2f/s (expect %.2f) · skipped %.2f/s (expect %.2f) · camera %.1f · steps %s'
              % ('hard ' if hard else 'plain', drop or 'none', r['framesShownPerSecond'], expect_shown, r['skippedPerSecond'], expect_skip,
                 r['cameraFramesPerVideoSecond'], r['steps']))
sys.exit(1 if fails else 0)
