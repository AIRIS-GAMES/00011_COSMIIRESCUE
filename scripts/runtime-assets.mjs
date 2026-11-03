import {otherGames} from '../src/other-games.js';
import {roomAssets} from '../src/room-data.js';
import {stage} from '../src/stage.js';
import {openingVideos} from '../src/opening-videos.js';
import {socialLinks} from '../src/community-config.js';
import {hero,friends} from '../src/characters.js';
import {BGM_SRC,RAINBOW_BGM_SRC,SFX_SOURCES} from '../src/audio.js';
import {COLLABORATION_IMAGES} from '../src/collaboration.js';

// Both packaging and cleanup auditing must use the same dynamic asset list.
export function runtimeAssets(includeCampaign=false){
 const assets=new Set(['./Asset/ui/life/full.png','./Asset/ui/life/empty.png',
  ...['room','characters','returns','social','prologue','practice','games','settings'].map(id=>'./Asset/ui/menu/'+id+'.png'),
  ...otherGames.map(game=>game.iconSrc),...roomAssets,'./Asset/AIRISGAMES.PNG',BGM_SRC,RAINBOW_BGM_SRC,...Object.values(SFX_SOURCES),
  hero.src,...hero.frames,...friends.map(f=>f.src),...Object.values(stage.art),
  ...openingVideos.map(v=>v.src),'./Asset/fonts/MochiyPopOne-Regular.woff2','./Asset/fonts/MochiyPopOne-OFL.txt']);
 if(includeCampaign)for(const src of COLLABORATION_IMAGES)assets.add(src);
 for(const link of socialLinks)for(const src of [link.iconSrc,link.previewSrc])if(src)assets.add(src);
 return assets;
}
