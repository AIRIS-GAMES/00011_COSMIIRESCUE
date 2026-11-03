"""Original soft UI plop and a small crowd's applause, exported offline."""
import math, struct, wave, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RATE=44100
def export(name,samples):
    peak=max(map(abs,samples)) or 1
    samples=[s*.085/peak for s in samples]
    path=ROOT/'Asset/audio/sfx'/f'{name}.wav'
    with wave.open(str(path),'wb') as out:
        out.setparams((1,2,RATE,0,'NONE','not compressed'))
        out.writeframes(b''.join(struct.pack('<h',round(s*32767)) for s in samples))
    encode(name,path)

def encode(name,path):
    encoder=shutil.which('ffmpeg')
    if not encoder:
        from imageio_ffmpeg import get_ffmpeg_exe
        encoder=get_ffmpeg_exe()
    subprocess.run([encoder,'-v','error','-y','-i',str(path),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','128k',str(ROOT/'Asset/audio/sfx-mp3'/f'{name}.mp3')],check=True)
# Selected candidate 02: a soft, springy "puni" sound.
plop=[]
for i in range(int(.24*RATE)):
    t=i/RATE
    phase=2*math.pi*(290*t+(680-290)*(1-math.exp(-23*t))/23)
    env=math.exp(-t*22)*min(1,i/100)*min(1,(.24-t)/.015)
    plop.append(math.sin(phase)*env)
export('uiPlop',plop)
# The silent lead-in starts playback inside the tap gesture on iOS, while
# applause arrives with the number reveal at 1.45 seconds (no delayed play()).
# Selected candidate 05: one high cheer, followed by quiet applause.
selected=ROOT/'Asset/audio/source/celebration-05.wav'
with wave.open(str(selected),'rb') as source:
    params=source.getparams()
    frames=source.readframes(source.getnframes())
    silence=bytes(int(1.43*params.framerate)*params.nchannels*params.sampwidth)
path=ROOT/'Asset/audio/sfx/applause.wav'
with wave.open(str(path),'wb') as out:
    out.setparams(params)
    out.writeframes(silence+frames)
encode('applause',path)
print('Created uiPlop (candidate 02) and applause (candidate 05, 4.63s including reveal lead-in).')
