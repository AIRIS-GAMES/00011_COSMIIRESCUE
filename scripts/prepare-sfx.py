"""Encode runtime MP3 effects from offline WAV masters.

Run after generate-sfx.py. Requires ffmpeg or Python imageio-ffmpeg.
Validate decoded peaks, including MP3 encoder overshoot, below 0.10 FS.
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
target=root/'Asset/audio/sfx-mp3'
target.mkdir(parents=True,exist_ok=True)
for source in sorted((root/'Asset/audio/sfx').glob('*.wav')):
    output=target/(source.stem+'.mp3')
    subprocess.run([ffmpeg,'-v','error','-y','-i',str(source),'-map_metadata','-1',
                    '-codec:a','libmp3lame','-b:a','128k',str(output)],check=True)
    decoded=subprocess.run([ffmpeg,'-v','error','-i',str(output),'-f','f32le','-'],check=True,capture_output=True).stdout
    samples=array('f',decoded)
    if sys.byteorder!='little':samples.byteswap()
    peak=max(map(abs,samples))
    assert 0<peak<=.10,(source.name,peak)
    print(f'{output.name}: decoded peak {peak:.4f}')
