import {mkdir,cp,copyFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {stage} from '../src/stage.js';
import {hero,friends} from '../src/characters.js';
import {BGM_SRC,RAINBOW_BGM_SRC,SFX_SOURCES} from '../src/audio.js';
import {collaboration} from '../src/collaboration-config.js';
import {COLLABORATION_IMAGES,collaborationAssetsNeeded} from '../src/collaboration.js';
const campaign={...collaboration,enabled:collaboration.enabled&&!process.argv.includes('--without-collaboration')};
const includeCampaign=collaborationAssetsNeeded(campaign);
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Unsafe build directory');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await copyFile('index.html',path.join(dist,'index.html'));await cp('src',path.join(dist,'src'),{recursive:true});
// Expired/OFF builds cannot request removed artwork, even if the device clock changes.
await writeFile(path.join(dist,'src/collaboration-config.js'),`export const collaboration=${JSON.stringify({...campaign,enabled:includeCampaign},null,2)};\n`);
const assets=new Set(['./Asset/AIRISGAMES.PNG',BGM_SRC,RAINBOW_BGM_SRC,...Object.values(SFX_SOURCES),hero.src,...hero.frames,...friends.map(f=>f.src),...Object.values(stage.art)]);
if(includeCampaign)for(const src of COLLABORATION_IMAGES)assets.add(src);
for(const asset of assets){const target=path.join(dist,asset);await mkdir(path.dirname(target),{recursive:true});await copyFile(asset,target);}
console.log(`COSMII RESCUE built: ${assets.size} runtime assets; source art and test artifacts excluded.`);
