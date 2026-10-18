# test_filmcheck.py — prove analyze_filmcheck.py before a real film exists.
#
#   python testkit/test_filmcheck.py
#
# Synthesizes the phone's view: a 60 Hz screen showing the film-check picture
# (optionally DROPPING every 9th frame — what Safari's counters claimed), filmed
# by a 120 fps camera off-centre, smaller, slightly blurred and noisy. The
# analyser must read back what was simulated.
import subprocess, sys, json, os, tempfile
import numpy as np

W, H, STEP, BAR = 480, 270, 8, 6
FAST, SLOW = (round(H * 0.28), round(H * 0.62)), (round(H * 0.72), round(H * 0.88))

def picture(nv):
    b = np.zeros((H, W), np.uint8)
    x0 = 1 + (nv % 60) * STEP; b[FAST[0]:FAST[1], x0:x0 + BAR] = 255
    x1 = 1 + ((nv // 60) % 60) * STEP; b[SLOW[0]:SLOW[1], x1:x1 + BAR] = 255
    b[0, :] = b[-1, :] = b[:, 0] = b[:, -1] = 255
    return b

def film(path, drop_every, seconds=20, cam=120, phase=0.37, seed=1):
    rng = np.random.default_rng(seed)
    CW, CH = 640, 360
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', '%dx%d' % (CW, CH), '-r', str(cam),
                           '-i', 'pipe:0', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    ys = (np.arange(int(H * 1.05)) / 1.05).astype(int).clip(0, H - 1)          # the screen, 1.05x, off-centre
    xs = (np.arange(int(W * 1.05)) / 1.05).astype(int).clip(0, W - 1)
    oy, ox = 70, 60
    for k in range(seconds * cam):
        t = k / cam
        v = int(np.floor(t * 60 + phase))            # the refresh this camera frame sees
        shown = v
        if drop_every and v % drop_every == drop_every - 1:
            shown = v - 1                            # the screen held the previous frame
        pic = picture(shown)[np.ix_(ys, xs)].astype(np.float32)
        pic = (pic + np.roll(pic, 1, 1) + np.roll(pic, -1, 1)) / 3       # a little optical blur
        img = np.full((CH, CW), 18, np.float32)
        img[oy:oy + pic.shape[0], ox:ox + pic.shape[1]] = 18 + pic * 0.8
        img += rng.normal(0, 4, img.shape)
        ff.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    ff.stdin.close(); ff.wait()

here = os.path.dirname(os.path.abspath(__file__))
fails = 0
for drop, expect_shown, expect_skip in ((0, 60.0, 0.0), (9, 60 * 8 / 9, 60 / 9)):
    with tempfile.TemporaryDirectory() as d:
        f, j = os.path.join(d, 'film.mp4'), os.path.join(d, 'r.json')
        film(f, drop)
        subprocess.run([sys.executable, os.path.join(here, 'analyze_filmcheck.py'), f, j], check=True, capture_output=True)
        r = json.load(open(j))
    ok = abs(r['framesShownPerSecond'] - expect_shown) <= 1.0 and abs(r['skippedPerSecond'] - expect_skip) <= 0.7 and abs(r['cameraFramesPerRealSecond'] - 120) <= 3
    fails += not ok
    print(('PASS' if ok else 'FAIL') + ' drop every %s: shown %.2f/s (expect %.2f) · skipped %.2f/s (expect %.2f) · camera %.1f fps · glitches %d'
          % (drop or 'none', r['framesShownPerSecond'], expect_shown, r['skippedPerSecond'], expect_skip, r['cameraFramesPerRealSecond'], r['glitches']))
sys.exit(1 if fails else 0)
