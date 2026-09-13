import {mkdir,cp,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {stage} from '../src/stage.js';
import {hero,friends} from '../src/characters.js';
import {BGM_SRC,RAINBOW_BGM_SRC} from '../src/audio.js';
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Unsafe build directory');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await copyFile('index.html',path.join(dist,'index.html'));await cp('src',path.join(dist,'src'),{recursive:true});
const assets=new Set(['./Asset/AIRISGAMES.PNG',BGM_SRC,RAINBOW_BGM_SRC,hero.src,...hero.frames,...friends.map(f=>f.src),...Object.values(stage.art)]);
for(const asset of assets){const target=path.join(dist,asset);await mkdir(path.dirname(target),{recursive:true});await copyFile(asset,target);}
console.log(`COSMII RESCUE built: ${assets.size} runtime assets; source art and test artifacts excluded.`);
