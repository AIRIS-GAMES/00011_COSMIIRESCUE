"""Create quiet runtime MP3s without modifying the supplied originals.

Run with ffmpeg on PATH, or install imageio-ffmpeg: python scripts/prepare-bgm.py
Decoded output must peak below 0.40 FS even if a device ignores media volume.
"""
from array import array
from pathlib import Path
import shutil
import subprocess
import sys

ffmpeg=shutil.which('ffmpeg')
if not ffmpeg:
    from imageio_ffmpeg import get_ffmpeg_exe
    ffmpeg=get_ffmpeg_exe()
root=Path(__file__).resolve().parents[1]
target=root/'Asset/audio/bgm'
target.mkdir(parents=True,exist_ok=True)

def peak(path):
    raw=subprocess.run([ffmpeg,'-v','error','-i',str(path),'-f','f32le','-'],check=True,capture_output=True).stdout
    samples=array('f',raw)
    if sys.byteorder!='little': samples.byteswap()
    return max(map(abs,samples))

for source in [root/'Asset/Hypnoticcuping in the Wind.mp3',root/'Asset/audio/rainbow-24s.mp3']:
    output=target/source.name
    gain=min(1,.35/peak(source))
    subprocess.run([ffmpeg,'-v','error','-y','-i',str(source),'-map_metadata','-1','-af',f'volume={gain}',
                    '-c:a','libmp3lame','-b:a','128k',str(output)],check=True)
    measured=peak(output)
    assert measured<=.40,(output,measured)
    print(f'{output.name}: gain={gain:.4f}, decoded peak={measured:.4f}')
