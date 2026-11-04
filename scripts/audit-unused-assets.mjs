import {readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {runtimeAssets} from './runtime-assets.mjs';
import {SFX_WAV_SOURCES} from '../src/audio.js';
const root=process.cwd();
// Windows paths are case-insensitive; macOS/Linux checks must keep the real case.
const key=p=>process.platform==='win32'?p.toLowerCase():p;
const used=new Set([...runtimeAssets(true)].map(p=>key(path.resolve(root,p))));
const unused=[];
// Originals are inputs to prepare-bgm.py, not unused runtime assets. SVG art in */source/ is the editable master of a PNG.
const originals=new Set(['Asset/Hypnoticcuping in the Wind.mp3','Asset/audio/rainbow-24s.mp3','Asset/audio/source/celebration-05.wav',...Object.values(SFX_WAV_SOURCES)].map(p=>key(path.resolve(root,p))));
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(!['.gitkeep','README.md','PROMPT.txt'].includes(entry.name)&&!(path.basename(dir)==='source'&&entry.name.endsWith('.svg'))&&!used.has(key(full))&&!originals.has(key(full)))unused.push({path:path.relative(root,full),bytes:(await stat(full)).size});}}
for(const file of [...runtimeAssets(true)].map(p=>path.resolve(root,p)))await stat(file);
await walk(path.join(root,'Asset'));
await mkdir('test-results',{recursive:true});
await writeFile('test-results/unused-assets.json',JSON.stringify(unused,null,2));
console.log(`${used.size} required assets; ${unused.length} unused files, ${unused.reduce((n,f)=>n+f.bytes,0)} bytes`);
