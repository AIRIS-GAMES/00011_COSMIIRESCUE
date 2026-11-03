import {runtimeAssets} from './runtime-assets.mjs';
import {mkdir,cp,copyFile,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {collaboration} from '../src/collaboration-config.js';
import {collaborationAssetsNeeded} from '../src/collaboration.js';
const campaign={...collaboration,enabled:collaboration.enabled&&!process.argv.includes('--without-collaboration')};
const includeCampaign=collaborationAssetsNeeded(campaign);
const root=process.cwd(),dist=path.resolve(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw Error('Unsafe build directory');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await copyFile('index.html',path.join(dist,'index.html'));await cp('src',path.join(dist,'src'),{recursive:true});
// Expired/OFF builds cannot request removed artwork, even if the device clock changes.
await writeFile(path.join(dist,'src/collaboration-config.js'),`export const collaboration=${JSON.stringify({...campaign,enabled:includeCampaign},null,2)};\n`);
const assets=runtimeAssets(includeCampaign);
for(const asset of assets){const target=path.join(dist,asset);await mkdir(path.dirname(target),{recursive:true});await copyFile(asset,target);}
console.log(`COSMII RESCUE built: ${assets.size} runtime assets; source art and test artifacts excluded.`);
