"""Offline PCM export of the original tone scores. No synthesis runs in the game.

Run: python scripts/generate-sfx.py
44.1 kHz mono / signed 16-bit, band-limited harmonics and click-free endings.
Keep original gains except flight/rescue boosts; reject any asset over 0.10 FS.
"""
import math
import struct
import wave
from pathlib import Path

RATE = 44100
# Bake the adjustment into PCM so it also works when media volume is ignored.
PEAK_TARGETS = {'flap': .095, 'rescue': .095}
# frequency, seconds, waveform, gain, delay, final frequency
SCORES = {
    'rainbowStart': [(f,.28,'triangle',.05,i*.06,None) for i,f in enumerate([523,784,1047,1568])],
    'rainbowEnd': [(784,.25,'sine',.04,0,392)],
    'rescue': [(760,.1,'sine',.06,0,1350),(1520,.16,'triangle',.03,.05,None)],
    'bank': [(1047,.17,'triangle',.055,0,None),(1568,.2,'sine',.025,.06,None)],
    'return': [(f,.24,'triangle',.06,i*.09,None) for i,f in enumerate([523,659,784,1047])],
    'lost': [(490,.22,'triangle',.05,0,220)],
    'bump': [(280,.12,'sine',.045,0,430)],
    'turn': [(420,.11,'sine',.025,0,640)],
    'flap': [(440,.085,'sine',.045,0,790)],
    'coin': [(1320,.07,'sine',.035,0,None)],
    'pass': [(660,.13,'triangle',.04,0,None)],
    'near': [(f,.14,'triangle',.055,i*.05,None) for i,f in enumerate([880,1109,1320])],
    'break': [(130,.18,'sawtooth',.075,0,35),(720,.11,'square',.025,0,None)],
    'hit': [(180,.3,'sawtooth',.08,0,40)],
    'best': [(f,.35,'triangle',.065,i*.13,None) for i,f in enumerate([659,784,1047,1319])],
}

def render(notes,peak_target=None):
    samples = [0.] * math.ceil((max(n[1]+n[4] for n in notes)+.02)*RATE)
    for freq,duration,kind,gain,delay,end in notes:
        # Fixed harmonic limit avoids aliasing throughout exponential pitch sweeps.
        limit = min(96,int((RATE/2-100)/max(freq,end or freq)))
        harmonics = range(1,limit+1,2 if kind in ('triangle','square') else 1)
        for i in range(math.ceil(duration*RATE)):
            t=i/RATE
            k=math.log(end/freq)/duration if end else 0
            phase=2*math.pi*(freq*math.expm1(k*t)/k if k else freq*t)
            if kind=='sine': value=math.sin(phase)
            elif kind=='triangle': value=8/math.pi**2*sum((-1)**((h-1)//2)*math.sin(h*phase)/h**2 for h in harmonics)
            elif kind=='square': value=4/math.pi*sum(math.sin(h*phase)/h for h in harmonics)
            else: value=2/math.pi*sum((-1)**(h+1)*math.sin(h*phase)/h for h in harmonics)
            envelope=gain*t/.008 if t<.008 else gain*(.0001/gain)**((t-.008)/(duration-.008))
            envelope*=min(1,max(0,(duration-t)/.005))
            samples[round(delay*RATE)+i]+=value*envelope
    if peak_target is not None:
        scale=peak_target/max(map(abs,samples))
        samples=[v*scale for v in samples]
    assert max(map(abs,samples)) <= .10
    return b''.join(struct.pack('<h',round(v*32767)) for v in samples)

if __name__=='__main__':
    target=Path(__file__).resolve().parents[1]/'Asset/audio/sfx'
    target.mkdir(parents=True,exist_ok=True)
    for name,notes in SCORES.items():
        with wave.open(str(target/f'{name}.wav'),'wb') as output:
            output.setparams((1,2,RATE,0,'NONE','not compressed'))
            output.writeframes(render(notes,PEAK_TARGETS.get(name)))
    print(f'Exported {len(SCORES)} WAV files to {target}')
