"""TRANCE GENERATOR - hand-run per docs/plans/TRANCE_GENERATOR.md
5 units x 4 generations x 20s, one audition score."""
import json, io
from math import gcd
from functools import reduce

SEG = 20.0          # seconds per generation
GAP = 1.6           # silence between generations
GENS = 4            # generations per unit
HARM_BPM = 150.0    # layer 2 grid (independent of the unit tempo)
HOLDS = [1, 2, 3, 4]
CUIVRE_PER_SEG = 4
FLOOR = 0.45        # layer 4 minimum rest per player
NOTELEN = 0.2
PLAYERS = 10
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
nm = lambda m: NAMES[m % 12] + str(m // 12 - 1)

UNITS = [('U17', '13:12:11:10:9:8',    150),
         ('U18', '19:17:16:15:14:13',  130),
         ('U19', '31:29:27:25:23:21',  150),
         ('U20', '38:37:36:35:34:33',  120),
         ('U23', '64:61:59:53:47:43',  140)]

LIST = 'more chords'          # which custom list the species come from


def load_species():
    """every species in LIST that has BOTH a plain and a cuivre staccato entry"""
    tax = json.load(io.open('bank/blast_taxonomy.json', encoding='utf-8'))
    son, out = tax['sonorities'], {}
    for i in tax['customLists'][LIST]:
        s = son[i]
        if set(s.get('artic', {}).values()) != {'staccato'}:
            continue
        cv = s.get('cuivreConverted', []) + s.get('cuivreAdded', [])
        e = out.setdefault(s['chord'], {})
        if cv:
            e['cv'], e['cvn'] = s['pitches'], sorted(cv)
        else:
            e['plain'] = s['pitches']
    return {k: v for k, v in out.items() if 'plain' in v and 'cvn' in v}


SP = load_species()
SPECIES = sorted(SP)


def mulberry32(a):
    s = {'a': a & 0xFFFFFFFF}
    def r():
        s['a'] = (s['a'] + 0x6D2B79F5) & 0xFFFFFFFF
        t = s['a']; t = (t ^ (t >> 15)) * (1 | t) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r


class Bag:
    """shuffled bag - exhaust the whole set before anything repeats (tone-row-like)"""
    def __init__(self, items, rnd):
        self.items, self.rnd, self.pool = list(items), rnd, []
    def draw(self):
        if not self.pool:
            self.pool = self.items[:]
            for i in range(len(self.pool) - 1, 0, -1):
                j = int(self.rnd() * (i + 1))
                self.pool[i], self.pool[j] = self.pool[j], self.pool[i]
        return self.pool.pop()


objects, log = [], []
nid = [0]
def oid(p):
    nid[0] += 1
    return '%s-%d' % (p, nid[0])

t0 = 0.0
IDX = [0]                # running segment index, what the composer refers to
for ui, (uname, ratios, bpm) in enumerate(UNITS):
    terms = [int(x) for x in ratios.split(':')]
    T = 60.0 / bpm
    g = reduce(gcd, terms)
    C = T * terms[0] / g
    for gen in range(GENS):
        IDX[0] += 1
        idx = IDX[0]
        rnd = mulberry32(1000 * (ui + 1) + gen)
        segStart = t0

        # --- layer 1: onsets, entering the loop at a random index -------------
        offset = rnd() * C
        onsets = []
        for term in terms:
            step = T * terms[0] / term
            k = 0
            while True:
                t = k * step - (offset % step)
                if t >= SEG: break
                if t >= 0: onsets.append(t)
                k += 1
        onsets.sort()

        # --- layer 2: harmony on its own 150bpm grid --------------------------
        beat = 60.0 / HARM_BPM
        spBag = Bag(SPECIES, rnd)
        plan, t, = [], 0.0
        while t < SEG:
            hold = HOLDS[int(rnd() * len(HOLDS))]
            sp = spBag.draw()
            plan.append((t, min(t + hold * beat, SEG), sp))
            t += hold * beat
        def spAt(x):
            for a, b, s in plan:
                if a <= x < b: return s
            return plan[-1][2]

        # --- layer 3: cuivre - a COUNT per segment ----------------------------
        cuIdx = set()
        while len(cuIdx) < min(CUIVRE_PER_SEG, len(onsets)):
            cuIdx.add(int(rnd() * len(onsets)))

        # --- pitch bags, one per species occurrence ---------------------------
        bags = {}
        # --- layer 4: minimum-rest player assignment --------------------------
        last = [-99.0] * PLAYERS
        fallbacks = 0
        for i, ot in enumerate(onsets):
            sp = spAt(ot)
            if sp not in bags: bags[sp] = Bag(SP[sp]['plain'], rnd)
            if i in cuIdx:
                cvn = SP[sp]['cvn']
                pitch, tech = cvn[int(rnd() * len(cvn))], 'cuivre'
            else:
                pitch, tech = bags[sp].draw(), 'staccato'
            order = sorted(range(PLAYERS), key=lambda L: last[L])
            pick = next((L for L in order if ot - last[L] >= FLOOR), None)
            if pick is None:
                pick = order[0]; fallbacks += 1
            last[pick] = ot
            objects.append({
                'id': oid('wc'), 'type': 'waveCurve', 'layer': pick,
                'startSeconds': round(segStart + ot, 4),
                'endSeconds': round(segStart + ot + NOTELEN, 4),
                'nodes': [{'pos': 0, 'y': 8.8, 'smooth': 0.25}, {'pos': 1, 'y': 8.8, 'smooth': 0.25}],
                'segments': [{'model': 'power', 'slope': 0}],
                'color': '#8D6E63' if tech == 'cuivre' else '#607D8B',
                'fillMode': 'bottom', 'opacity': 0.55,
                'performanceNotes': '%s g%d %s %s' % (uname, gen + 1, sp, nm(pitch)),
                'properties': {'gen': 'trance', 'idx': idx, 'unit': uname, 'ratios': ratios,
                               'bpm': bpm, 'seed': 1000 * (ui + 1) + gen, 'species': sp},
                'sonifyNote': pitch, 'technique': tech,
                'sonifyMode': 'plain', 'recVel': 112})

        # segment header marker + one marker per harmony change
        objects.append({'id': oid('mk'), 'type': 'marker', 'layer': 10,
                        'time': round(segStart, 4),
                        'label': '[%02d]  %s g%d  %s @%d  cyc %.1fs' % (idx, uname, gen + 1, ratios, bpm, C),
                        'color': '#C62828', 'performanceNotes': '', 'properties': {'gen': 'trance'}})
        for a, b, sp in plan:
            objects.append({'id': oid('mk'), 'type': 'marker', 'layer': 10,
                            'time': round(segStart + a, 4), 'label': sp.replace('VERT01-', 'ch'),
                            'color': '#00695C', 'performanceNotes': '',
                            'properties': {'gen': 'trance'}})
        log.append((idx, uname, gen + 1, ratios, bpm, C, len(onsets),
                    [s for _, _, s in plan], fallbacks, segStart))
        t0 += SEG + GAP

score = {'version': 1, 'layoutVersion': 2,
         'tracks': [{'id': 'tuba%d' % i, 'label': 'Tuba %d' % i, 'instKey': 'tuba%d' % i}
                    for i in range(1, 11)],
         'assets': {},
         'metadata': {'created': '2026-08-18T20:00:00.000Z', 'modified': '2026-08-18T20:00:00.000Z'},
         'objects': objects}
json.dump(score, io.open('scores/gen-aud-01.json', 'w'), separators=(',', ':'))

print('total %.1f s  ·  %d notes  ·  %d markers' % (t0, len([o for o in objects if o['type'] == 'waveCurve']),
                                                    len([o for o in objects if o['type'] == 'marker'])))
print()
print('%-4s %-5s %-3s %-22s %4s %7s %5s  %s' % ('idx', 'unit', 'g', 'ratios', 'bpm', 'cycle', 'at', 'species in order'))
print('-' * 118)
for idx, u, g, r, b, C, n, sps, fb, st in log:
    seen = []
    for s in sps:
        if not seen or seen[-1] != s: seen.append(s)
    print('[%02d] %-5s g%-2d %-22s %4d %6.1fs %4.0fs  %s%s' %
          (idx, u, g, r, b, C, st, ' '.join(x.replace('VERT01-', '') for x in seen),
           '   FALLBACKS %d' % fb if fb else ''))
