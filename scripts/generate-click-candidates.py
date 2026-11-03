"""Generate original, review-only UI sound candidates. Does not alter game audio."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / 'Asset/audio/click-candidates'
OUT.mkdir(parents=True, exist_ok=True)

def make(name, duration, voice):
    rng = random.Random(12)
    samples = [voice(i / RATE, rng) * min(1, i / 100) * min(1, (duration - i / RATE) / .015) for i in range(int(duration * RATE))]
    scale = .085 / max(abs(s) for s in samples)
    with wave.open(str(OUT / (name + '.wav')), 'wb') as f:
        f.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        f.writeframes(b''.join(struct.pack('<h', round(s * scale * 32767)) for s in samples))

def drop(t, start, end, speed):
    return 2 * math.pi * (end * t + (start-end) * (1-math.exp(-speed*t)) / speed)

make('01-pote', .17, lambda t,r: math.sin(drop(t,330,160,45))*math.exp(-t*32))
make('02-puni', .24, lambda t,r: math.sin(drop(t,680,290,23))*math.exp(-t*22))
make('03-koron', .26, lambda t,r: (math.sin(2*math.pi*780*t)+.3*math.sin(2*math.pi*1568*t))*math.exp(-t*25))
make('04-poko', .20, lambda t,r: (math.sin(2*math.pi*440*t)+.42*math.sin(2*math.pi*703*t))*math.exp(-t*38))
make('05-kira', .30, lambda t,r: (math.sin(2*math.pi*1175*t)+.45*math.sin(2*math.pi*1760*t))*math.exp(-t*23))
make('06-fuwa', .22, lambda t,r: (math.sin(2*math.pi*392*t)+.4*math.sin(2*math.pi*494*t)+.22*math.sin(2*math.pi*587*t))*(1-math.exp(-t*160))*math.exp(-t*25))
print('Created six review-only WAV files:', OUT)
