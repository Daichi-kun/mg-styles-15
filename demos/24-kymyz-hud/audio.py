"""АЛА-ТОО // ЖАЙЛОО-СКАН — darksynth pulse (120 bpm, D phrygian, bar 0 = LOCK) + HUD sound design locked to cues.json.
A komuz-like plucked open fifth answers the lock: the machine finds an old man drinking kymyz."""
import sys, json, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'lib', 'audio'))
import mgaudio as mg
from mgaudio import recipes, sfx, synth, fm, pluck

HERE = os.path.dirname(os.path.abspath(__file__))
K = json.load(open(os.path.join(HERE, 'cues.json')))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
DUR, LOCK = K['duration'], K['lock']

m = recipes.darksynth(duration=DUR, bpm=120, key='D', drop=LOCK, build=K['brackets_in'], outro=K['end_hold'])
m.group('music').automate('gain', [(0, -3), (2.0, -2), (K['brackets_in'], -1), (LOCK - 0.27, -1), (LOCK - 0.22, -10), (LOCK - 0.01, -10), (LOCK, 1.5), (K['sip'][0], 0), (K['sip'][1], -3), (DUR - 0.6, -3), (DUR, -14)])

def motif(t0, notes, gain, step=0.07, pan=0.0):
    for i, n in enumerate(notes):
        m.sfx(fm.bell(n, 0.9 if i == len(notes) - 1 else 0.35, 0.8, 'glock').loud(-18), at=t0 + i * step, gain=gain - (0 if i == len(notes) - 1 else 2), pan=pan)

# --- hook: CRT power-on, frame snaps, reticle + rings (one beep per layer)
m.sfx(sfx.crt_on(), at=0.0, gain=-2)
m.sfx(sfx.boom(0.9, 42), at=0.02, gain=-8)
m.sfx(sfx.hud_open(), at=0.05, gain=-5)
motif(0.1, [74, 77, 81], -9)
for i, t in enumerate(K['boot']['rings']): m.sfx(sfx.hud_beep(note=74 + [0, 3, 7][i] + 12), at=t, gain=-8)
for t, pan in [(K['boot']['panel_left'], -0.6), (K['boot']['panel_right'], 0.6)]: m.sfx(sfx.hud_beep(note=86), at=t, gain=-9, pan=pan)
m.sfx(sfx.hud_ping(note=86), at=K['boot']['radar'], gain=-8, pan=-0.6)
for t in K['log'][:4]: m.sfx(sfx.typing(14, 40, 'soft'), at=t, gain=-13, pan=-0.5)
for i, t in enumerate(K['data_rolls']): m.sfx(sfx.data_chirp(4 + i % 3), at=t, gain=-14, pan=0.5)

# --- terrain scan + pans
m.sfx(sfx.hud_scan(K['ridge_draw'][1] - K['ridge_draw'][0], 1), at=K['ridge_draw'][0] + 0.9, gain=-9)
m.sfx(sfx.hud_data(1.2), at=K['contours'] + 0.6, gain=-14)
m.sfx(sfx.whoosh(0.8, 'sci', direction=1, seed=3), at=sum(K['pan_yurt']) / 2, gain=-12, pan=0.4)
m.sfx(sfx.hud_scan(0.8, -1), at=K['yurt_draw'][0] + 0.4, gain=-12, pan=0.4)
m.sfx(sfx.hud_ping(note=81), at=K['yurt_tag'], gain=-7, pan=0.4)
m.sfx(sfx.typing(12, 40, 'soft'), at=K['yurt_tag'] + 0.1, gain=-13, pan=0.4)
m.sfx(sfx.whoosh(0.8, 'sci', direction=-1, seed=4), at=sum(K['pan_man']) / 2, gain=-12, pan=-0.2)
m.sfx(sfx.hud_scan(K['man_draw'][1] - K['man_draw'][0], 1), at=K['man_draw'][0] + 1.0, gain=-11)
m.sfx(sfx.typing(14, 40, 'soft'), at=K['log'][4], gain=-13, pan=-0.5)

# --- acquire: brackets fly in and hunt, ticks accelerate, rising lock tone
m.sfx(sfx.glitch(0.14, 'digital'), at=K['brackets_in'], gain=-8)
for i, (dt, pan) in enumerate([(0.10, -0.85), (0.117, 0.85), (0.133, -0.45), (0.15, 0.45)]):
    m.sfx(sfx.whoosh(0.34, 'sci', direction=1 if pan < 0 else -1, seed=11 + i), at=K['brackets_in'] + dt, gain=-13, pan=pan)
bi, sn = K['brackets_in'] + 0.3, K['snap']
for k in range(1, 10): m.sfx(sfx.tick('hi'), at=bi + (sn - bi) * (k / 12) ** 0.5, gain=-19 + 0.6 * k, pan=0.25 * (-1) ** k)
m.sfx(sfx.lock_on(LOCK - K['brackets_in'], note='D6'), at=LOCK, gain=-6)
m.sfx(sfx.riser(LOCK - K['brackets_in'], 'hybrid'), at=LOCK, gain=-9)
m.sfx(sfx.swish(0.14), at=K['snap'] - 0.02, gain=-6)

# --- HERO: lock impact + alarm, orange flip
m.sfx(sfx.impact('cinematic', size=1.1), at=LOCK - 0.02, gain=0, verb=-12)
m.sfx(sfx.boom(1.4, 38), at=LOCK, gain=-5)
m.sfx(sfx.glitch(0.12, 'crunch'), at=LOCK + 1 / 30, gain=-12)
m.sfx(sfx.hud_alert(), at=LOCK, gain=-6)
m.sfx(fm.bell(86, 1.4, 0.8, 'tubular').loud(-18), at=LOCK, gain=-13)
m.sfx(sfx.typing(16, 40, 'soft'), at=LOCK + 0.05, gain=-12, pan=0.3)
for t in K['alert_pulses']: m.sfx(sfx.hud_ping(note=86), at=t, gain=-13)
for i, t in enumerate(K['kymyz_rolls']): m.sfx(sfx.data_chirp(5), at=t, gain=-14, pan=0.5)
m.sfx(sfx.downlifter(1.1), at=K['pull_out'][0] + 0.2, gain=-15)
# the komuz answers the machine: open fifths D–A–D, plucked, over the drop
kz = m.track('komuz', level=-19, sends={'hall': -10}, pan=-0.2, hp=90)
beat = 0.25
for j, (dt, n, v) in enumerate([(0, 50, 0.8), (1, 57, 0.5), (2, 62, 0.6), (4, 50, 0.7), (5, 57, 0.5), (6, 62, 0.6), (7, 57, 0.45)] * 3):
    tt = LOCK + 0.5 + (j // 7) * 8 * beat + dt * beat
    if tt < DUR - 0.5: kz.add(pluck.ks(n, 0.9, vel=v, decay=1.6, bright=0.55, pos=0.22, seed=j), tt)

# --- the sip + end
m.sfx(sfx.drip(0.8, seed=3), at=K['sip'][1] - 0.05, gain=-12, verb=-10)
m.sfx(sfx.ui('confirm'), at=K['sip_readout'], gain=-10, pan=0.5)
m.sfx(sfx.data_chirp(4), at=K['sip_readout'] + 0.05, gain=-14, pan=0.5)
m.sfx(sfx.typing(10, 18, 'soft'), at=K['title'], gain=-11)
motif(K['end_hold'], [81, 77, 74], -9, step=0.09)

res = m.export(os.path.join(HERE, 'out/audio.wav'), lufs=-14, tp=-1.5)
print({k: res[k] for k in ('duration', 'lufs', 'true_peak', 'stereo_corr', 'warnings') if k in res})
