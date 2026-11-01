#!/usr/bin/env python
"""cursor_crisp.py — does the cursor line's pixel profile change from frame to
frame? Reads the shots that `node tools/stand_check.js --parts 1 --crisp [--q snap=0]`
wrote (testkit/results/stand_shots/crisp_<tag>_<i>.png, eight sub-pixel phases of
the same motion) and, for each shot, finds the cursor's columns (its magenta,
#FF15A0) and reports the line's width in device pixels and the brightness of its
columns. A snapped line reads the same in every shot; an unsnapped one walks
through a blur cycle — the "pulse" seen on the iPad (day 46).

    python tools/cursor_crisp.py            both tags present in the folder
    python tools/cursor_crisp.py snap=0     one tag
"""
import glob
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SHOTS = os.path.join(ROOT, 'testkit', 'results', 'stand_shots')


def profile(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    # magenta-ness: 1 at the cursor's own #FF15A0, 0 at white (the drawn
    # curve bands are pale salmon — far from both, they stay near 0)
    d = np.sqrt((r - 255) ** 2 + (g - 21) ** 2 + (b - 160) ** 2)
    m = np.clip(1 - d / 252.5, 0, 1)
    col = m.max(axis=0)                     # the strongest magenta in each column
    core = np.where(col > 0.9)[0]           # the cursor's own columns (nothing else is this hue)
    if core.size == 0:
        return None
    x0, x1 = int(core.min()), int(core.max())
    # the line with two columns of margin each side: a snapped line has crisp
    # edges (margins ~0), a fractional one bleeds into a margin that changes
    # with the phase
    lo, hi = max(0, x0 - 2), min(col.size - 1, x1 + 2)
    seg = col[lo:hi + 1]
    return {'x0': x0, 'width': x1 - x0 + 1,
            'cols': [round(float(v), 2) for v in seg], 'peak': round(float(seg.max()), 2),
            'partial': int(((seg > 0.05) & (seg < 0.9)).sum())}


def main():
    tags = sys.argv[1:] or ['snap', 'snap=0']
    for tag in tags:
        files = sorted(glob.glob(os.path.join(SHOTS, 'crisp_' + tag.replace('=', '=') + '_*.png')),
                       key=lambda p: int(p.rsplit('_', 1)[1].split('.')[0]))
        if not files:
            print(tag, ': no shots'); continue
        print('==', tag, len(files), 'shots')
        widths, partials = [], []
        for f in files:
            p = profile(f)
            if not p:
                print('  ', os.path.basename(f), 'no cursor found'); continue
            widths.append(p['width']); partials.append(p['partial'])
            print('   %-18s x=%4d width %d px  partial-brightness columns %d  profile %s' %
                  (os.path.basename(f), p['x0'], p['width'], p['partial'], p['cols']))
        if widths:
            print('   width min/max %d/%d · partial columns min/max %d/%d' %
                  (min(widths), max(widths), min(partials), max(partials)))


if __name__ == '__main__':
    main()
