"""TRANCE GENERATOR - hand-run per docs/plans/TRANCE_GENERATOR.md
Edit the CONFIG block, run from the repo root, load OUT in the score app."""
import json, io
from math import gcd
from functools import reduce

OUT = 'scores/gen-aud-03.json'
ASSIGN = 'fixed-tempo'   # 'fixed-tempo' = one tempo per player, for real score
                         # material (easier to notate and play). 'min-rest' =
                         # the free scheme: any player may take any stream's
                         # note, subject to FLOOR. Both kept on purpose.
SEG = 20.0          # seconds per generation
GAP = 1.6           # silence between generations
GENS = 3            # generations per unit
HARM_BPM = 150.0    # layer 2 grid (independent of the unit tempo)
HOLDS = [1, 2, 3, 4]
CUIVRE_PER_SEG = 0  # layer 3 OFF for this run - the composer found it distracting.
                    # Kept in the engine; set a count to switch it back on.
PPS = 50.0          # assumed zoom when spacing labels (the composer's default)
FLOOR = 0.45        # layer 4 minimum rest per player
NOTELEN = 0.2
PLAYERS = 10
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
nm = lambda m: NAMES[m % 12] + str(m // 12 - 1)

UNITS = [('A', '6:5:4:3:2:1',        100),
         ('B', '7:6:5:4:3:2',        100),
         ('C', '8:7:6:5:4:3',        100),
         ('D', '11:10:9:8:7:6',      100),
         ('E', '13:12:11:10:9:8',    100),
         ('F', '16:15:14:13:12:11',  100),
         ('G', '19:17:16:15:14:13',  100)]

LIST = 'more chords'          # which custom list the species come from
LO, HI = 30, 65               # staccato technique range (F#1-F4). Outside it a note is SILENT.
FOLDED = []


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
    out = {k: v for k, v in out.items() if 'plain' in v and 'cvn' in v}
    # RANGE FIX. The staccato technique sounds only MIDI 30-65 (F#1-F4); a pitch
    # outside it is drawn in the score and simply never speaks. Seven of the
    # banked species carry a 66 or 68 (they come from the played-in VERT01
    # voicings, and the blast sandbox will let you keep them), which silently
    # killed 8.8% of the notes in the first gen-aud-03. Octave-fold into range -
    # the house move, same as the CLOUD02 max-retention cleaning - so the pitch
    # class survives instead of the note vanishing. Dedupe after folding.
    global FOLDED
    FOLDED = []
    for name, e in out.items():
        for key in ('plain', 'cv'):
            fixed, moved = [], []
            for m in e[key]:
                o = m
                while m > HI: m -= 12
                while m < LO: m += 12
                if m != o: moved.append((o, m))
                if m not in fixed: fixed.append(m)
            e[key] = sorted(fixed)
            if key == 'plain' and moved: FOLDED.append((name, moved, len(e[key])))
        e['cvn'] = sorted({m for m in e['cvn'] if LO <= m <= HI} |
                          {m for m in (x - 12 for x in e['cvn'] if x > HI) if LO <= m <= HI})
        if not e['cvn']: e['cvn'] = [e['cv'][-1]]
    return out


SP = load_species()
SPECIES = sorted(SP)
if FOLDED:
    print('octave-folded into the staccato range 30-65:')
    for name, moved, n in FOLDED:
        print('   %-12s %s   -> %d pitches' %
              (name, ' '.join('%d->%d' % m for m in moved), n))
    print()


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


objects, log, placed = [], [], []
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
        for si, term in enumerate(terms):
            step = T * terms[0] / term
            k = 0
            while True:
                t = k * step - (offset % step)
                if t >= SEG: break
                if t >= 0: onsets.append((t, si))
                k += 1
        onsets.sort()

        # --- layer 4a: FIXED TEMPO PER PLAYER ---------------------------------
        # Each stream owns its players for the whole segment, so a part is a
        # steady pulse at ONE tempo and can be notated and counted. 6 streams
        # over 10 players: four streams take a PAIR, two take a SOLO. A pair
        # splits its stream's onsets, so neither plays every beat - that is
        # where the variety comes from, and the orchestration then lives in the
        # PITCHES, which are drawn per attack anyway.
        # Partners are always 5 tubas apart (1+6, 2+7, ...) so a pair is never
        # adjacent; which pair is split into the two solos, and which stream
        # gets which, are both random.
        natural = [(i, i + 5) for i in range(5)]
        order = natural[:]
        for i in range(len(order) - 1, 0, -1):
            j = int(rnd() * (i + 1))
            order[i], order[j] = order[j], order[i]
        soloPair = order[0]
        slots = [list(pr) for pr in order[1:]] + [[soloPair[0]], [soloPair[1]]]
        for i in range(len(slots) - 1, 0, -1):
            j = int(rnd() * (i + 1))
            slots[i], slots[j] = slots[j], slots[i]
        streamPlayers = {si: slots[si] for si in range(len(terms))}

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
        for i, (ot, si) in enumerate(onsets):
            sp = spAt(ot)
            if sp not in bags: bags[sp] = Bag(SP[sp]['plain'], rnd)
            if i in cuIdx:
                cvn = SP[sp]['cvn']
                pitch, tech = cvn[int(rnd() * len(cvn))], 'cuivre'
            else:
                pitch, tech = bags[sp].draw(), 'staccato'
            if ASSIGN == 'fixed-tempo':
                cand = streamPlayers[si]
                pick = cand[0] if len(cand) == 1 else cand[int(rnd() * len(cand))]
                if ot - last[pick] < FLOOR:
                    alt = [L for L in cand if ot - last[L] >= FLOOR]
                    if alt: pick = alt[0]
                    else: fallbacks += 1
            else:
                cand = sorted(range(PLAYERS), key=lambda L: last[L])
                pick = next((L for L in cand if ot - last[L] >= FLOOR), None)
                if pick is None:
                    pick = cand[0]; fallbacks += 1
            last[pick] = ot
            objects.append({
                'id': oid('wc'), 'type': 'waveCurve', 'layer': pick,
                'startSeconds': round(segStart + ot, 4),
                'endSeconds': round(segStart + ot + NOTELEN, 4),
                'nodes': [{'pos': 0, 'y': 8.8, 'smooth': 0.25}, {'pos': 1, 'y': 8.8, 'smooth': 0.25}],
                'segments': [{'model': 'power', 'slope': 0}],
                'color': '#8D6E63' if tech == 'cuivre' else '#607D8B',
                'fillMode': 'bottom', 'opacity': 0.55,
                'performanceNotes': '%s g%d s%d %s %s' % (uname, gen + 1, si + 1, sp, nm(pitch)),
                'properties': {'gen': 'trance', 'idx': idx, 'unit': uname, 'ratios': ratios,
                               'bpm': bpm, 'seed': 1000 * (ui + 1) + gen, 'species': sp,
                               'stream': si, 'assign': ASSIGN},
                'sonifyNote': pitch, 'technique': tech,
                'sonifyMode': 'plain', 'recVel': 112})

        # LABELS. renderMarker hardcodes font-size 10, y=24 and x+4, so two
        # markers near the same time overprint and BOTH become unreadable - which
        # is what happened in gen-aud-01, where the long header sat on top of the
        # first few species marks. Fix: every label short, and placed by an
        # explicit collision test with the index winning its space first.
        def put(t, text, color):
            x, w = t * PPS + 4, len(text) * 6.2
            if not all(x + w + 3 < q[0] or x > q[0] + q[1] + 3 for q in placed):
                return False
            placed.append((x, w))
            objects.append({'id': oid('mk'), 'type': 'marker', 'layer': 10,
                            'time': round(t, 4), 'label': text, 'color': color,
                            'performanceNotes': '', 'properties': {'gen': 'trance'}})
            return True

        # the first harmony starts at the same instant as the index, so it can
        # never win a slot of its own - carry it IN the index label instead.
        put(segStart, '%02d %s' % (idx, plan[0][2].replace('VERT01-', '')), '#C62828')
        dropped = 0
        for a, b, sp in plan[1:]:                        # priority 2: the harmony
            if not put(segStart + a, sp.replace('VERT01-', ''), '#00695C'):
                dropped += 1
        log.append((idx, uname, gen + 1, ratios, bpm, C, streamPlayers,
                    [s for _, _, s in plan], fallbacks, segStart))
        t0 += SEG + GAP

score = {'version': 1, 'layoutVersion': 2,
         'tracks': [{'id': 'tuba%d' % i, 'label': 'Tuba %d' % i, 'instKey': 'tuba%d' % i}
                    for i in range(1, 11)],
         'assets': {},
         'metadata': {'created': '2026-08-18T20:00:00.000Z', 'modified': '2026-08-18T20:00:00.000Z'},
         'objects': objects}
json.dump(score, io.open(OUT, 'w'), separators=(',', ':'))

print('total %.1f s  ·  %d notes  ·  %d markers' % (t0, len([o for o in objects if o['type'] == 'waveCurve']),
                                                    len([o for o in objects if o['type'] == 'marker'])))
print()
print('%-4s %-3s %-3s %-20s %5s %4s  %s' % ('idx','unit','g','ratios','cycle','at','stream -> players (pairs are 5 tubas apart)'))
print('-' * 118)
for idx, u, g, r, b, C, spl, sps, fb, st in log:
    seen = []
    for s in sps:
        if not seen or seen[-1] != s: seen.append(s)
    layout = ' '.join('s%d:%s' % (k + 1, '+'.join('T%d' % (q + 1) for q in v))
                      for k, v in sorted(spl.items()))
    print('[%02d] %-3s g%-2d %-20s %5.1fs %4.0fs  %s%s' %
          (idx, u, g, r, C, st, layout, '   FALLBACKS %d' % fb if fb else ''))
