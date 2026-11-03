import {readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {runtimeAssets} from './runtime-assets.mjs';
import {SFX_WAV_SOURCES} from '../src/audio.js';
const root=process.cwd();
const used=new Set([...runtimeAssets(true)].map(p=>path.resolve(root,p).toLowerCase()));
const unused=[];
// Originals are inputs to prepare-bgm.py, not unused runtime assets.
const originals=new Set(['Asset/Hypnoticcuping in the Wind.mp3','Asset/audio/rainbow-24s.mp3','Asset/audio/source/celebration-05.wav',...Object.values(SFX_WAV_SOURCES)].map(p=>path.resolve(root,p).toLowerCase()));
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(!['.gitkeep','README.md','PROMPT.txt'].includes(entry.name)&&!used.has(full.toLowerCase())&&!originals.has(full.toLowerCase()))unused.push({path:path.relative(root,full),bytes:(await stat(full)).size});}}
for(const file of used)await stat(file);
await walk(path.join(root,'Asset'));
await mkdir('test-results',{recursive:true});
await writeFile('test-results/unused-assets.json',JSON.stringify(unused,null,2));
console.log(`${used.size} required assets; ${unused.length} unused files, ${unused.reduce((n,f)=>n+f.bytes,0)} bytes`);
