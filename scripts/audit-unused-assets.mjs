import {readdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {stage} from '../src/stage.js';
import {hero,friends} from '../src/characters.js';
import {BGM_SRC,RAINBOW_BGM_SRC} from '../src/audio.js';
const root=process.cwd();
const used=new Set(['./Asset/AIRISGAMES.PNG',BGM_SRC,RAINBOW_BGM_SRC,hero.src,...hero.frames,...friends.map(f=>f.src),...Object.values(stage.art)].map(p=>path.resolve(root,p).toLowerCase()));
const unused=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(!used.has(full.toLowerCase()))unused.push({path:path.relative(root,full),bytes:(await stat(full)).size});}}
for(const file of used)await stat(file);
await walk(path.join(root,'Asset'));
await writeFile('cleanup-source-removed.json',JSON.stringify(unused,null,2));
console.log(`${used.size} required assets; ${unused.length} unused files, ${unused.reduce((n,f)=>n+f.bytes,0)} bytes`);
