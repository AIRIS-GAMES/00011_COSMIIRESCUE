import {readdir,stat,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {openingVideos} from '../src/opening-videos.js';
import {socialLinks} from '../src/community-config.js';
import {stage} from '../src/stage.js';
import {hero,friends} from '../src/characters.js';
import {BGM_SRC,RAINBOW_BGM_SRC,SFX_SOURCES,SFX_WAV_SOURCES} from '../src/audio.js';
import {COLLABORATION_IMAGES} from '../src/collaboration.js';
const root=process.cwd();
const used=new Set(['./Asset/AIRISGAMES.PNG',...openingVideos.map(v=>v.src),BGM_SRC,RAINBOW_BGM_SRC,...Object.values(SFX_SOURCES),hero.src,...hero.frames,...friends.map(f=>f.src),...Object.values(stage.art)].map(p=>path.resolve(root,p).toLowerCase()));
const unused=[];
for(const src of ['./Asset/fonts/MochiyPopOne-menu.ttf','./Asset/fonts/MochiyPopOne-OFL.txt'])used.add(path.resolve(root,src).toLowerCase());
for(const link of socialLinks)if(link.iconSrc)used.add(path.resolve(root,link.iconSrc).toLowerCase());
for(const link of socialLinks)if(link.previewSrc)used.add(path.resolve(root,link.previewSrc).toLowerCase());
for(const src of COLLABORATION_IMAGES)used.add(path.resolve(root,src).toLowerCase());
// Originals are inputs to prepare-bgm.py, not unused runtime assets.
const originals=new Set(['Asset/Hypnoticcuping in the Wind.mp3','Asset/audio/rainbow-24s.mp3',...Object.values(SFX_WAV_SOURCES)].map(p=>path.resolve(root,p).toLowerCase()));
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else if(!['.gitkeep','README.md'].includes(entry.name)&&!used.has(full.toLowerCase())&&!originals.has(full.toLowerCase()))unused.push({path:path.relative(root,full),bytes:(await stat(full)).size});}}
for(const file of used)await stat(file);
await walk(path.join(root,'Asset'));
await mkdir('test-results',{recursive:true});
await writeFile('test-results/unused-assets.json',JSON.stringify(unused,null,2));
console.log(`${used.size} required assets; ${unused.length} unused files, ${unused.reduce((n,f)=>n+f.bytes,0)} bytes`);
