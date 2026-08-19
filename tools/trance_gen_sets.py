"""TRANCE GENERATOR - PITCH-SET variant (per docs/plans/TRANCE_GENERATOR.md).

Same four layers, but layer 2's source is swapped: instead of drawing a SPECIES
from the taxonomy every 1-4 beats, each segment holds ONE fixed pitch collection
for its whole duration and every attack draws from it (shuffled bag, so the
whole collection is used before anything repeats).

Four treatments, each swept across all seven rhythmic models:
  1 UNISON    one literal pitch, chromatic from F#2
  2 OCTAVES   every octave of one pitch class in range
  3 FIFTHS    a spread stack of fifths, next transposition each model
  4 MESSIAEN  modes 3-7 (1 = whole tone and 2 = octatonic excluded)

Run from the repo root; load OUT in the score app.
"""
import json, io
from math import gcd
from functools import reduce

OUT = 'scores/gen-aud-04.json'
BPM = 150.0          # composer's choice for this run
SEG = 20.0
GAP = 1.6
FLOOR = 0.45         # layer 4 floor (structural here - see below)
NOTELEN = 0.2
PLAYERS = 10
LO, HI = 30, 65      # staccato technique range. Outside it a note is SILENT.
PPS = 50.0
VEL = 112
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
nm = lambda m: NAMES[m % 12] + str(m // 12 - 1)

MODELS = [('A', '6:5:4:3:2:1'), ('B', '7:6:5:4:3:2'), ('C', '8:7:6:5:4:3'),
          ('D', '11:10:9:8:7:6'), ('E', '13:12:11:10:9:8'),
          ('F', '16:15:14:13:12:11'), ('G', '19:17:16:15:14:13')]

MESSIAEN = {3: [0, 2, 3, 4, 6, 7, 8, 10, 11], 4: [0, 1, 2, 5, 6, 7, 8, 11],
            5: [0, 1, 5, 6, 7, 11], 6: [0, 2, 4, 5, 6, 8, 10, 11],
            7: [0, 1, 2, 3, 5, 6, 7, 8, 9, 11]}
MES_SEQ = [(3, 0), (4, 1), (5, 2), (6, 3), (7, 4), (3, 5), (4, 6)]

pcs_in_range = lambda pcs: [m for m in range(LO, HI + 1) if m % 12 in pcs]


def treatments(i):
    """the four pitch collections for rhythmic model i (0-6)"""
    mo, tr = MES_SEQ[i]
    return [
        ('uni',  nm(42 + i),            [42 + i]),
        ('oct',  NAMES[(6 + i) % 12],   pcs_in_range({(6 + i) % 12})),
        # FIVE fifths, not six: six span 35 semitones and the range IS 35, so
        # only the untransposed stack fits and every other one folded its top
        # note into the middle, destroying the even spread. Five fit at every
        # transposition used here.
        ('5th',  'T%d' % i,             [30 + i + 7 * k for k in range(5)]),
        ('mes%d' % mo, 'T%d' % tr,      pcs_in_range({(p + tr) % 12 for p in MESSIAEN[mo]})),
    ]


def mulberry32(a):
    s = {'a': a & 0xFFFFFFFF}
    def r():
        s['a'] = (s['a'] + 0x6D2B79F5) & 0xFFFFFFFF
        t = s['a']; t = (t ^ (t >> 15)) * (1 | t) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r


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
t0, idx = 0.0, 0
for ti in range(4):                               # treatment-major: hear one idea swept
    for mi, (mname, ratios) in enumerate(MODELS):
        idx += 1
        tag, sub, pitches = treatments(mi)[ti]
        terms = [int(x) for x in ratios.split(':')]
        g = reduce(gcd, terms)
        C = T * terms[0] / g
        rnd = mulberry32(7000 + 100 * ti + mi)
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

        # layer 4: fixed tempo per player - 4 streams paired, 2 solo, partners
        # 5 tubas apart. FLOOR is structural here: every stream period >= T.
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
                'color': ['#607D8B', '#5E8C7A', '#8D6E63', '#7E6BA8'][ti],
                'fillMode': 'bottom', 'opacity': 0.55,
                'performanceNotes': '%s %s %s s%d %s' % (mname, tag, sub, si + 1, nm(pitch)),
                'properties': {'gen': 'trance', 'idx': idx, 'model': mname, 'ratios': ratios,
                               'bpm': BPM, 'treatment': tag, 'sub': sub, 'stream': si},
                'sonifyNote': pitch, 'technique': 'staccato',
                'sonifyMode': 'plain', 'recVel': VEL})

        put(segStart, '%02d %s %s' % (idx, tag, sub), '#C62828')
        log.append((idx, mname, ratios, C, tag, sub, len(pitches),
                    min(pitches), max(pitches), segStart, streamPlayers))
        t0 += SEG + GAP

score = {'version': 1, 'layoutVersion': 2,
         'tracks': [{'id': 'tuba%d' % i, 'label': 'Tuba %d' % i, 'instKey': 'tuba%d' % i}
                    for i in range(1, 11)],
         'assets': {},
         'metadata': {'created': '2026-08-19T01:00:00.000Z', 'modified': '2026-08-19T01:00:00.000Z'},
         'objects': objects}
json.dump(score, io.open(OUT, 'w'), separators=(',', ':'))

wc = [o for o in objects if o['type'] == 'waveCurve']
bad = [o for o in wc if not (LO <= o['sonifyNote'] <= HI)]
print('%s  ·  %.1f s  ·  %d notes  ·  %d markers  ·  out of range %d'
      % (OUT, t0, len(wc), len(objects) - len(wc), len(bad)))
print('all at %d bpm — every model steps %.0f ms at its fastest, against a 450 ms sample'
      % (BPM, T * 1000))
print()
print('%-4s %-3s %-20s %6s  %-6s %-5s %4s  %s' %
      ('idx', 'mdl', 'ratios', 'cycle', 'treat', 'sub', 'pcs', 'span'))
print('-' * 84)
for i, m, r, C, tag, sub, n, lo, hi, st, spl in log:
    print('[%02d] %-3s %-20s %5.1fs  %-6s %-5s %4d  %s-%s   @%.0fs'
          % (i, m, r, C, tag, sub, n, nm(lo), nm(hi), st))
