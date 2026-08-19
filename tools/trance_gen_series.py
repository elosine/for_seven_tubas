"""TRANCE GENERATOR - SERIES variant (per docs/plans/TRANCE_GENERATOR.md).

MODEL-MAJOR. One rhythmic model at a time, running a five-snippet series so the
same rhythm is heard through five different pitch worlds back to back:

    1 UNISON    one literal pitch (middle octave of its pitch class)
    2 OCTAVES   the SAME pitch class, every octave in range
    3 FIFTHS    a spread stack of five fifths, a different transposition
    4 MESSIAEN  a different mode (3-7; 1 = whole tone and 2 = octatonic excluded)
    5 CLUSTER   a closed chromatic cluster in the middle of the range,
                GROWING one note per model: 4 notes, then 5, ... up to 10

Nothing ascends in order - pitch classes, fifths transpositions and modes are
each drawn from a shuffled bag, so the sweep covers the material without
sounding like a scale exercise. The cluster is the one deliberate progression.

Layer 2's source is a fixed pitch collection per snippet (shuffled-bag draw per
attack), not the taxonomy. Layer 4 is fixed-tempo-per-player throughout.

Run from the repo root; load OUT in the score app.
"""
import json, io
from math import gcd
from functools import reduce

OUT = 'scores/gen-aud-05.json'
BPM = 150.0
SEG = 20.0
GAP = 1.6
FLOOR = 0.45
NOTELEN = 0.2
PLAYERS = 10
LO, HI = 30, 65          # staccato technique range. Outside it a note is SILENT.
MID = 47                 # centre of the range, where the clusters sit
PPS = 50.0
VEL = 112
SEED = 4242
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
nm = lambda m: NAMES[m % 12] + str(m // 12 - 1)

MODELS = [('A', '6:5:4:3:2:1'), ('B', '7:6:5:4:3:2'), ('C', '8:7:6:5:4:3'),
          ('D', '11:10:9:8:7:6'), ('E', '13:12:11:10:9:8'),
          ('F', '16:15:14:13:12:11'), ('G', '19:17:16:15:14:13')]

MESSIAEN = {3: [0, 2, 3, 4, 6, 7, 8, 10, 11], 4: [0, 1, 2, 5, 6, 7, 8, 11],
            5: [0, 1, 5, 6, 7, 11], 6: [0, 2, 4, 5, 6, 8, 10, 11],
            7: [0, 1, 2, 3, 5, 6, 7, 8, 9, 11]}


def mulberry32(a):
    s = {'a': a & 0xFFFFFFFF}
    def r():
        s['a'] = (s['a'] + 0x6D2B79F5) & 0xFFFFFFFF
        t = s['a']; t = (t ^ (t >> 15)) * (1 | t) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r


RND = mulberry32(SEED)


def shuffled(xs):
    xs = list(xs)
    for i in range(len(xs) - 1, 0, -1):
        j = int(RND() * (i + 1))
        xs[i], xs[j] = xs[j], xs[i]
    return xs


class Bag:
    def __init__(self, items, rnd):
        self.items, self.rnd, self.pool = list(items), rnd, []
    def draw(self):
        if not self.pool:
            self.pool = self.items[:]
            for i in range(len(self.pool) - 1, 0, -1):
                j = int(self.rnd() * (i + 1))
                self.pool[i], self.pool[j] = self.pool[j], self.pool[i]
        return self.pool.pop()


# --- the shuffled plans, one entry per model -------------------------------
PCS = shuffled(range(12))[:len(MODELS)]                  # unison + octaves share these
FIFTHS_T = shuffled(range(8))[:len(MODELS)]              # 5 fifths from 30+t fit for t<=7
MODE_SEQ = (shuffled([3, 4, 5, 6, 7]) + shuffled([3, 4, 5, 6, 7]))[:len(MODELS)]
MODE_T = shuffled(range(12))[:len(MODELS)]

octaves = lambda pc: [m for m in range(LO, HI + 1) if m % 12 == pc]
def middle_octave(pc):
    o = octaves(pc)
    return o[len(o) // 2]
def cluster(n):
    start = MID - (n - 1) // 2
    return list(range(start, start + n))


def series_for(mi):
    """the five snippets for model mi, in order"""
    pc = PCS[mi]
    return [
        ('uni', nm(middle_octave(pc)), [middle_octave(pc)]),
        ('oct', NAMES[pc], octaves(pc)),
        ('5th', 'T%d' % FIFTHS_T[mi], [30 + FIFTHS_T[mi] + 7 * k for k in range(5)]),
        ('mes%d' % MODE_SEQ[mi], 'T%d' % MODE_T[mi],
         [m for m in range(LO, HI + 1)
          if m % 12 in {(p + MODE_T[mi]) % 12 for p in MESSIAEN[MODE_SEQ[mi]]}]),
        ('clus', '%dn' % (4 + mi), cluster(4 + mi)),
    ]


objects, log, placed = [], [], []
nid = [0]
def oid(p):
    nid[0] += 1
    return '%s-%d' % (p, nid[0])

def put(t, text, color):
    x, w = t * PPS + 4, len(text) * 6.2
    if not all(x + w + 3 < q[0] or x > q[0] + q[1] + 3 for q in placed):
        return False
    placed.append((x, w))
    objects.append({'id': oid('mk'), 'type': 'marker', 'layer': 10, 'time': round(t, 4),
                    'label': text, 'color': color, 'performanceNotes': '',
                    'properties': {'gen': 'trance'}})
    return True


T = 60.0 / BPM
COLORS = ['#607D8B', '#5E8C7A', '#8D6E63', '#7E6BA8', '#B0803A']
t0, idx = 0.0, 0
for mi, (mname, ratios) in enumerate(MODELS):
    terms = [int(x) for x in ratios.split(':')]
    C = T * terms[0] / reduce(gcd, terms)
    for ti, (tag, sub, pitches) in enumerate(series_for(mi)):
        idx += 1
        rnd = mulberry32(9000 + 10 * mi + ti)
        segStart = t0

        onsets = []
        for si, term in enumerate(terms):
            step = T * terms[0] / term
            k, off = 0, rnd() * C
            while True:
                t = k * step - (off % step)
                if t >= SEG: break
                if t >= 0: onsets.append((t, si))
                k += 1
        onsets.sort()

        natural = [(i, i + 5) for i in range(5)]
        order = natural[:]
        for i in range(len(order) - 1, 0, -1):
            j = int(rnd() * (i + 1))
            order[i], order[j] = order[j], order[i]
        solo = order[0]
        slots = [list(pr) for pr in order[1:]] + [[solo[0]], [solo[1]]]
        for i in range(len(slots) - 1, 0, -1):
            j = int(rnd() * (i + 1))
            slots[i], slots[j] = slots[j], slots[i]
        streamPlayers = {si: slots[si] for si in range(len(terms))}

        bag = Bag(pitches, rnd)
        last = [-99.0] * PLAYERS
        for ot, si in onsets:
            pitch = bag.draw()
            cand = streamPlayers[si]
            pick = cand[0] if len(cand) == 1 else cand[int(rnd() * len(cand))]
            if ot - last[pick] < FLOOR:
                alt = [L for L in cand if ot - last[L] >= FLOOR]
                if alt: pick = alt[0]
            last[pick] = ot
            objects.append({
                'id': oid('wc'), 'type': 'waveCurve', 'layer': pick,
                'startSeconds': round(segStart + ot, 4),
                'endSeconds': round(segStart + ot + NOTELEN, 4),
                'nodes': [{'pos': 0, 'y': 8.8, 'smooth': 0.25}, {'pos': 1, 'y': 8.8, 'smooth': 0.25}],
                'segments': [{'model': 'power', 'slope': 0}],
                'color': COLORS[ti], 'fillMode': 'bottom', 'opacity': 0.55,
                'performanceNotes': '%s %s %s s%d %s' % (mname, tag, sub, si + 1, nm(pitch)),
                'properties': {'gen': 'trance', 'idx': idx, 'model': mname, 'ratios': ratios,
                               'bpm': BPM, 'treatment': tag, 'sub': sub, 'stream': si},
                'sonifyNote': pitch, 'technique': 'staccato',
                'sonifyMode': 'plain', 'recVel': VEL})

        put(segStart, '%02d %s %s' % (idx, tag, sub), '#C62828' if ti == 0 else '#00695C')
        log.append((idx, mname, ratios, C, tag, sub, len(pitches),
                    min(pitches), max(pitches), segStart))
        t0 += SEG + GAP

score = {'version': 1, 'layoutVersion': 2,
         'tracks': [{'id': 'tuba%d' % i, 'label': 'Tuba %d' % i, 'instKey': 'tuba%d' % i}
                    for i in range(1, 11)],
         'assets': {},
         'metadata': {'created': '2026-08-19T02:00:00.000Z', 'modified': '2026-08-19T02:00:00.000Z'},
         'objects': objects}
json.dump(score, io.open(OUT, 'w'), separators=(',', ':'))

wc = [o for o in objects if o['type'] == 'waveCurve']
bad = [o for o in wc if not (LO <= o['sonifyNote'] <= HI)]
print('%s  ·  %.1f s (%.1f min)  ·  %d notes  ·  out of range %d'
      % (OUT, t0, t0 / 60, len(wc), len(bad)))
print()
last_m = None
for i, m, r, C, tag, sub, n, lo, hi, st in log:
    if m != last_m:
        print('--- model %s   %s   cycle %.1fs ---' % (m, r, C))
        last_m = m
    print('   [%02d] %-6s %-5s %2d pitches  %-4s-%-4s   @%.0fs'
          % (i, tag, sub, n, nm(lo), nm(hi), st))
