#!/usr/bin/env python3
"""Make the shipped Mochiy Pop One subset: every character used in src/, index.html and
the English text, plus all kana, ASCII and common full-width punctuation.
Run after adding new Japanese text:  python3 scripts/subset-font.py
(tests/font-subset.test.mjs fails if a used character is missing from the subset)."""
import glob, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
chars = set()
for f in [*glob.glob(str(root / 'src/*.js')), *glob.glob(str(root / 'src/*.css')), str(root / 'index.html')]:
    chars |= set(pathlib.Path(f).read_text(encoding='utf-8'))
ranges = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x206F), (0x2190, 0x21FF), (0x2460, 0x24FF), (0x25A0, 0x26FF),
          (0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF), (0xFF01, 0xFF9F)]
for a, b in ranges:
    chars |= {chr(c) for c in range(a, b + 1)}
text = ''.join(sorted(c for c in chars if c >= ' '))
src = root / 'Asset/fonts/MochiyPopOne-Regular.woff2'
out = root / 'Asset/fonts/MochiyPopOne-Subset.woff2'
subprocess.run([sys.executable, '-m', 'fontTools.subset', str(src), '--text=' + text, '--flavor=woff2',
                '--layout-features=*', '--output-file=' + str(out)], check=True)
print(out.name, out.stat().st_size // 1024, 'KB')
