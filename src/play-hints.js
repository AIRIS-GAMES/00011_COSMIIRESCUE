import {t as _t} from './i18n.js';
import {skillRequirement} from './skills.js';
import {RAINBOW_TARGET} from './rainbow.js';
// Learn-by-playing: the first time something matters, a small bubble points at it once (never again on this device).
// One hint at a time, no pause, a short gap between hints. The renderer draws `current` next to its target.
export const HINT_KEY='cosmii-hints-v1',HINT_SECONDS=3.2,HINT_GAP=2.5;
const onScreen=(o,v,pad=0)=>!!v&&o.x>v.x+pad&&o.x<v.x+v.w-pad&&o.y>v.y+pad&&o.y<v.y+v.h-pad;
// Kept to three: the goal slide already covers friends + ring, and soft hazards explain themselves with a banner.
export const HINT_IDS=Object.freeze(['damage','skill','rainbow']);
export class PlayHints {
 constructor({storage}={}){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}this.storage=storage;
  try{const saved=JSON.parse(storage?.getItem(HINT_KEY)||'[]');this.seen=new Set(Array.isArray(saved)?saved.filter(id=>HINT_IDS.includes(id)):[]);}catch{this.seen=new Set();}
  this.reset();
 }
 reset(){this.current=null;this.gap=.6;}
 get done(){return HINT_IDS.every(id=>this.seen.has(id));}
 show(id,text,target){this.seen.add(id);try{this.storage?.setItem(HINT_KEY,JSON.stringify([...this.seen]));}catch{}this.current={id,text,target,left:HINT_SECONDS,age:0};}
 // `screen` gives screen-space anchors for DOM controls (skill bar, rainbow meter), in canvas units.
 update(game,dt,screen={}){
  if(dt<=0)return this.current;
  if(this.current){this.current.age+=dt;this.current.left-=dt;
   const t=this.current.target;if(this.current.left<=0||(t.world&&(t.world.rescued||!game.obstacles.includes(t.world)&&!game.friends.includes(t.world)&&!game.homes.includes(t.world)&&t.world!==game.player))){this.current=null;this.gap=HINT_GAP;}
   return this.current;}
  if(this.gap>0){this.gap-=dt;if(this.gap>0)return null;}
  if(game.isTraining||game.state!=='playing'||this.done)return null;
  const v=game.view,p=game.player,want=id=>!this.seen.has(id);
  const ahead=o=>!o.disabled&&onScreen(o,v,30)&&o.x>p.x-40;
  if(want('damage')){const o=game.obstacles.find(o=>!o.effect&&ahead(o));if(o){this.show('damage',game.mode==='hard'?_t('ぶつかると、すぐおわり！'):_t('ぶつかると、ライフ−1'),{world:o,radius:o.r});return this.current;}}
  if(want('skill')&&screen.skill){const kind=[0,1,2,3].find(k=>game.skillCharge?.[k]===skillRequirement(game,k)&&!(game.skillLeft?.[k]>0));if(kind!==undefined&&screen.skill(kind)){this.show('skill',_t('顔をタップで、技が使える！'),{screen:()=>screen.skill(kind),lift:58});return this.current;}}
  if(want('rainbow')&&screen.rainbow&&game.carry.length>=Math.min(8,RAINBOW_TARGET)&&!game.powered){this.show('rainbow',_t('{0}匹いっしょに帰ると、レインボー！',[RAINBOW_TARGET]),{screen:screen.rainbow,below:true});return this.current;}
  return null;
 }
}
