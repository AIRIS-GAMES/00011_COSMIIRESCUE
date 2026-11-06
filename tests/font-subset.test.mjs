import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
// The shipped font is a subset (scripts/subset-font.py). Every character the game writes must be in it.
test('font subset covers every character used in the game text',()=>{
 const cmap=new Set(JSON.parse(execFileSync('python3',['-c',"import json,sys;from fontTools.ttLib import TTFont;print(json.dumps(list(TTFont(sys.argv[1]).getBestCmap())))",new URL('../Asset/fonts/MochiyPopOne-Subset.woff2',import.meta.url).pathname],{encoding:'utf8'})));
 const full=new Set(JSON.parse(execFileSync('python3',['-c',"import json,sys;from fontTools.ttLib import TTFont;print(json.dumps(list(TTFont(sys.argv[1]).getBestCmap())))",new URL('../Asset/fonts/MochiyPopOne-Regular.woff2',import.meta.url).pathname],{encoding:'utf8'})));
 const files=[...readdirSync(new URL('../src/',import.meta.url)).filter(f=>/\.(js|css)$/.test(f)).map(f=>'../src/'+f),'../index.html'];
 const missing=new Set();
 for(const f of files)for(const ch of readFileSync(new URL(f,import.meta.url),'utf8')){const c=ch.codePointAt(0);if(c>=0x20&&full.has(c)&&!cmap.has(c))missing.add(ch);}
 assert.deepEqual([...missing],[],'run: python3 scripts/subset-font.py');
});
