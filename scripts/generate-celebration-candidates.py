"""Original synthesized applause and mascot-like cheers for audition only."""
from pathlib import Path
import math
import wave
import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'Asset/audio/celebration-candidates'
OUT.mkdir(parents=True, exist_ok=True)
RATE = 44100

def generate(name, seconds, people, voices, pitch, flourish=False, waa=False, soft_claps=False, single_cheer=False):
    rng = np.random.default_rng(104 + people)
    mix = np.zeros((int(seconds * RATE), 2))

    def add(signal, onset, gain, pan):
        start = int(onset * RATE)
        length = min(len(signal), len(mix) - start)
        if length <= 0:
            return
        mix[start:start+length, 0] += signal[:length] * gain * math.sqrt((1-pan)/2)
        mix[start:start+length, 1] += signal[:length] * gain * math.sqrt((1+pan)/2)

    # Independent performers, each with a loosely repeating clap rhythm.
    for _ in range(people):
        onset = rng.uniform(0, .3)
        pan = rng.uniform(-.85, .85)
        interval = rng.uniform(.22, .38)
        if soft_claps:
            interval = rng.uniform(.34, .44)
        while onset < seconds - .4:
            t = np.arange(int(.12 * RATE)) / RATE
            noise = rng.normal(0, 1, len(t))
            noise = np.convolve(noise, [1, .4, -.25, -.15], mode='same')
            envelope = (1 - np.exp(-t*2500)) * np.exp(-t*rng.uniform(45, 70))
            clap = noise * envelope + .35*np.sin(2*np.pi*900*t)*np.exp(-t*95)
            gain = rng.uniform(.12, .22)*min(1, (seconds-onset)/.8)
            if soft_claps:
                # Short, separated palm impacts: remove broadband hiss and long tails.
                kernel = np.hanning(25)
                kernel /= kernel.sum()
                palm = np.convolve(noise, kernel, mode='same')
                envelope = (1-np.exp(-t*1800))*np.exp(-t*120)
                clap = (palm*.7 + .18*np.sin(2*np.pi*680*t))*envelope
                gain = rng.uniform(.10, .14)*min(1, (seconds-onset)/.8)
            add(clap, onset, gain, pan)
            onset += interval + rng.uniform(-.025, .025)

    # Harmonic voices shaped by vowel formants: bright 'yaa' and rounded 'woo'.
    for v in range(voices):
        duration = rng.uniform(.65, 1.25)
        onset = rng.uniform(.08, seconds - duration - .35)
        if waa:
            onset = .12 + (v % 2)*1.25 + rng.uniform(0, .16)
            if single_cheer:
                onset = .12 + rng.uniform(0, .045)
        t = np.arange(int(duration * RATE)) / RATE
        base = pitch * rng.uniform(.8, 1.22)
        f0 = base*(1+.19*np.sin(np.pi*t/duration)) + 3*np.sin(2*np.pi*5.3*t)
        phase = 2*np.pi*np.cumsum(f0)/RATE
        woo = v % 3 == 0
        formants = [(380, 130), (850, 190), (2300, 300)] if woo else [(820, 180), (1350, 240), (2850, 350)]
        if waa:
            # Open from rounded /w/ into a bright sustained /a/.
            opening = np.clip(t/.11, 0, 1)
            formants = [(400+700*opening, 250), (850+850*opening, 320), (3400, 450)]
        signal = np.zeros(len(t))
        for harmonic in range(1, 31):
            frequency = harmonic*f0
            amplitude = sum(np.exp(-.5*((frequency-center)/width)**2) for center,width in formants)
            amplitude = (amplitude+.06)/harmonic**.65
            signal += amplitude*np.sin(harmonic*phase)
        signal /= max(np.max(np.abs(signal)), .001)
        envelope = np.minimum(1,t/.07)*np.minimum(1,(duration-t)/.25)
        envelope *= .8 + .2*np.sin(np.pi*t/duration)
        add(signal*envelope, onset, rng.uniform(.36, .48) if waa else rng.uniform(.21, .32), rng.uniform(-.7,.7))

    if flourish:
        for j, freq in enumerate([523.25,659.25,783.99,1046.5]):
            t = np.arange(int(.6*RATE))/RATE
            note = (np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*freq*2*t))*np.exp(-t*7)*np.minimum(1,t/.008)
            add(note, .02+j*.09, .16, (j-1.5)/3)

    # Very short room reflection and soft ending, without clipping.
    delay = int(.065*RATE)
    mix[delay:] += (.04 if soft_claps else .13)*mix[:-delay, ::-1].copy()
    fade = int(.22*RATE)
    mix[-fade:] *= np.linspace(1,0,fade)[:,None]
    mix *= .085 / np.max(np.abs(mix))
    with wave.open(str(OUT/(name+'.wav')), 'wb') as out:
        out.setparams((2,2,RATE,0,'NONE','not compressed'))
        out.writeframes(np.round(mix*32767).astype('<i2').tobytes())
    print(name, seconds, 'seconds')

generate('01-friends', 3.2, 9, 7, 350)
generate('02-party', 4.0, 24, 16, 260)
generate('03-fanfare', 3.6, 16, 10, 320, True)
generate('04-high-waa', 3.2, 9, 8, 540, waa=True)
generate('05-tiny-waa', 3.2, 9, 8, 680, waa=True)
generate('04-high-waa-once', 3.2, 3, 8, 540, waa=True, soft_claps=True, single_cheer=True)
generate('05-tiny-waa-once', 3.2, 3, 8, 680, waa=True, soft_claps=True, single_cheer=True)
