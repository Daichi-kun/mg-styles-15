# АЛА-ТОО — score + sound design, locked to window.CUES (exported to out/timing.json by dump_timing.mjs).
# D dorian, slow (66 bpm). Felt piano + strings bed; a komuz-like plucked ostinato (Karplus-Strong, open fifths) enters
# with the old man; pen-on-paper whisper follows the tip speed; the hero fill lands on a warm Dm9 with a celesta chime.
import sys, json, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib', 'audio'))
import mgaudio as mg
from mgaudio import sfx, synth, fm, samples, filters, pluck

HERE = os.path.dirname(os.path.abspath(__file__))
tim = json.load(open(os.path.join(HERE, 'out/timing.json')))
C = tim['cues']
SR, DUR = 48000, 14.0
FILL, WM, TAG = C['fill'], C['wordmark'], C['tagline']
SIP = C['sip']
DRAW = {k[1]: k[0] for k in C['draw']}
T_RIDGE_END, T_YURT, T_TUNDUK, T_MAN, T_KESE, T_FACE, T_KALPAK = DRAW['ridge>'], DRAW['ground1>'], DRAW['tunduk>'], DRAW['ground2>'], DRAW['forearm>'], DRAW['upperarm>'], DRAW['face>']

EQ_WARM = lambda a: filters.eq(a, [('pk', 300, -3, 1.0)])
EQ_AIR = lambda a: filters.eq(a, [('hs', 6000, 3)])
def air(s): return mg.Sound(np.asarray(EQ_AIR(np.asarray(s, dtype=np.float32)), dtype=np.float32))

m = mg.Mix(duration=DUR, bpm=66)
m.group('music').level = -20

CH = [  # (start, end, voicing) — Dm(add9) → Bbmaj7 → Gm9 → Asus4 → Dm9 on the fill
    (0.0, T_YURT, [50, 57, 62, 64, 69]),
    (T_YURT, T_MAN, [46, 53, 57, 62, 65]),
    (T_MAN, T_FACE, [43, 50, 57, 58, 65]),
    (T_FACE, FILL, [45, 52, 57, 62, 64]),
    (FILL, DUR, [38, 50, 57, 60, 64, 65, 69]),
]

# ---- felt piano: one note per summit (the pen "plays" the ridge), then the yurt, the kese and the resolve
piano = samples.inst('piano')
pn = m.track('piano', level=-20, sends={'hall': -8}, hp=70, lp=5200, fx=[EQ_WARM])
def P_(t, note, vel=0.4, dur=2.5): pn.add(piano.play(note, dur=dur, vel=vel, release=0.8), t)
P_(0.0, 38, 0.46, 2.0); P_(0.0, 50, 0.32, 2.0)
for t, n in zip([0.55, 1.15, 1.75, 2.35, 2.9], [69, 72, 74, 77, 74]): P_(t, n, 0.32)
P_(T_YURT, 46, 0.36, 3.0); P_(T_YURT + 0.02, 65, 0.3, 2.4)
P_(T_TUNDUK, 81, 0.34, 2.0)                                   # the crown of the yurt closes
P_(T_MAN, 43, 0.36, 3.0)
P_(T_KESE, 76, 0.34, 2.0)                                     # the kese appears
P_(T_FACE, 45, 0.36, 3.0); P_(T_FACE + 0.2, 69, 0.26, 2.0)
for n, v in [(26, 0.5), (38, 0.5), (57, 0.36), (60, 0.34), (64, 0.36), (69, 0.34), (76, 0.32)]: P_(FILL - 0.01, n, v, 3.2)
P_(WM + 0.05, 81, 0.3, 2.0); P_(TAG, 77, 0.22, 1.8)
P_(SIP[1], 74, 0.24, 2.4)                                      # the sip
P_(SIP[3] - 0.05, 62, 0.22, 2.0); P_(SIP[3] - 0.05, 69, 0.18, 2.0)

# ---- strings + air bed
st = m.track('strings', level=-23, sends={'hall': -6}, hp=150, fx=[EQ_WARM])
for a, b, v in CH: st.add(synth.pad([n + 12 for n in v[1:4]] + [v[0]], (b - a) + 0.6, 0.7, 'strings', attack=0.6, release=0.9, seed=int(a * 10)), a)
st.automate('gain', [(0, -24), (1.0, -16), (T_YURT, -11), (T_MAN, -8), (T_FACE, -4), (FILL - 0.2, 0), (FILL + 0.8, -2), (12.5, -5), (DUR, -14)])
st.automate('lpf', [(0, 1400), (T_MAN, 3000), (FILL, 8000), (DUR, 4500)])
ai = m.track('air', level=-28, sends={'hall': -4}, fx=[EQ_WARM])
for a, b, v in CH: ai.add(synth.pad(v, (b - a) + 0.8, 0.6, 'air', attack=0.7, release=1.0, seed=7 + int(a)), max(0.0, a - 0.05))
ai.automate('gain', [(0, -40), (0.3, -28), (1.2, 0), (DUR, 0)])
m.track('sub', level=-26).add(synth.bass('D1', 2.4, 0.7, 'sub'), FILL)

# ---- komuz: plucked open-fifth ostinato (D–A–D) in a 3-against-2 folk lilt, from the old man to the end
kz = m.track('komuz', level=-21, sends={'hall': -10}, pan=-0.15, hp=90)
beat = 60 / 132
pat = [(0, 50, 0.7), (1, 57, 0.45), (2, 62, 0.5), (3, 57, 0.4), (4, 50, 0.55), (5, 62, 0.45)]
t = T_MAN; k = 0
while t < DUR - 0.6:
    for off, n, v in pat:
        tt = t + off * beat
        if tt >= DUR - 0.6: break
        if FILL - 0.45 < tt < FILL: continue                 # a breath before the hero
        root = 45 - 50 if T_FACE <= tt < FILL else 0          # move with the harmony (A under the Asus4)
        kz.add(pluck.ks(n + root, 0.9, vel=v * (0.85 + 0.15 * (k % 2)), decay=1.6, bright=0.55, pos=0.22, seed=k), tt); k += 1
    t += 6 * beat
kz.automate('gain', [(T_MAN, -10), (T_MAN + 1.0, 0), (FILL - 0.5, 0), (FILL - 0.4, -30), (FILL, 0), (12.8, 0), (DUR, -12)])

m.group('music').automate('gain', [(0, 0), (FILL - 0.5, 0), (FILL - 0.25, -10), (FILL - 0.02, 0), (13.2, 0), (DUR, -10)])

# ---- pen-on-paper whisper, loudness follows tip speed
n = int(DUR * SR); tt = np.arange(n) / SR
spd = np.interp(tt, np.arange(len(tim['speed'])) / 120.0, np.array(tim['speed']))
env = np.clip(spd / 1400.0, 0, 1) ** 0.6 * (tt < DRAW['ground3>'] + 0.02)
env = filters.lpf(env.astype(np.float32), 30.0)
gm = filters.lpf(np.random.default_rng(5).standard_normal(n).astype(np.float32), 70.0); gm = 1 + 0.9 * gm / (np.abs(gm).max() + 1e-9)
band = lambda s: filters.lpf(filters.hpf(np.random.default_rng(s).standard_normal(n).astype(np.float32), 1600.0), 7500.0)
pen = mg.Sound(np.stack([band(1) * env * gm, band(2) * env * gm]).astype(np.float32)).loud(-18)
m.track('pen', level=-24, group='sfx').add(pen, 0.0)

# ---- sound design at the cues
m.sfx(sfx.pen('pen', 0.24, strokes=[(0.0, 0.2)], seed=11), at=0.0, gain=-8, pan=-0.3)          # nib touches down
m.sfx(sfx.whoosh(0.6, 'air', direction=1, peak=0.5, seed=3), at=T_RIDGE_END + 0.2, gain=-12, pan=0.5)   # the line dives to the valley
m.sfx(sfx.click('wood'), at=T_TUNDUK - 0.01, gain=-16, verb=-10)
m.sfx(air(fm.bell('A5', 1.4, 0.4, 'celesta')), at=T_KESE - 0.01, gain=-12, pan=0.2, verb=-8)
m.sfx(sfx.reverse_cymbal(1.1, seed=2), at=FILL, gain=-17)
m.sfx(sfx.impact('soft', size=1.0, seed=4), at=FILL - 0.008, gain=-1, verb=-8)
m.sfx(air(sfx.chime(('D6', 'F6', 'A6', 'E7'), step=0.05, kind='celesta')), at=FILL, gain=-3, verb=-8)
m.sfx(air(sfx.shimmer_hit('A5')), at=FILL + 0.03, gain=-8, verb=-6)
m.sfx(air(sfx.sparkle(1.0, density=14, key='D', mode='minor_pentatonic', seed=6)), at=FILL + 0.15, gain=-12, verb=-8)   # snow catches the light
m.sfx(sfx.whoosh(1.1, 'air', direction=-1, peak=0.5, seed=9), at=C['poster'][0] + 0.6, gain=-13)
m.sfx(sfx.drip(0.8, seed=3), at=SIP[1] - 0.05, gain=-18, verb=-10)                              # a quiet sip of kymyz
m.sfx(air(sfx.sparkle(0.6, density=8, key='D', mode='minor_pentatonic', seed=17)), at=11.65, gain=-18, verb=-8)   # light breathes along the line
m.group('sfx').automate('gain', [(0, 0), (13.2, 0), (DUR, -12)])

m.master_kw.update(air=2.0)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
res = m.export(os.path.join(HERE, 'out/audio.wav'), lufs=-14, tp=-1)
print({k: res[k] for k in ('duration', 'lufs', 'true_peak', 'stereo_corr', 'longest_gap') if k in res})
print('warnings', res.get('warnings'))
