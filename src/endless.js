import {biomeAt} from './biomes.js';
// Rare friends follow the run's current area; speed lanes keep their fixed map pattern.
const chunkBiome=(g,col,row)=>g.area?.biome||biomeAt(col,row);
// A bounded two-dimensional neighborhood, with no floor or ceiling.
export class EndlessWorld {
 constructor(template,random){this.template=template;this.random=random;this.next=0;this.loaded=new Set();this.chunks=[];}
 extend(g){
 const t=this.template,cx=Math.floor(g.player.x/t.width),cy=Math.floor(g.player.y/1000),wanted=new Set();
 for(let row=cy-1;row<=cy+1;row++)for(let col=Math.max(0,cx-1);col<=cx+2;col++){
 const key=`${col}:${row}`;wanted.add(key);if(this.loaded.has(key))continue;this.next=Math.max(this.next,col+1);
 const biome=chunkBiome(g,col,row);
 const shift=col===0&&row===0?0:(this.random()-.5)*120;
 const point=p=>({...p,x:p.x+col*t.width,y:p.y+row*1000+shift,id:`${key}-${p.id||''}`,chunk:key});
 const spawns=t.spawns.filter(s=>!s.after||g.time>=s.after).map(point);
 // In the sunset area every new section carries two rare friends (legacy position mode: four).
 if(biome.id==='sunset')for(const x of g.area?[470,850]:[370,560,750,940]){const p=point({x,y:620,kind:Math.floor(x)%4,rare:true});spawns.push(p);}
 // Timed spawns placed here must not be spawned again by the engine's unlock loop.
 for(const s of spawns){if(s.after)g.unlocked?.add(s.id);const f=g.spawnFriend(s);f.chunk=key;}
 // Give the player more room to take off before reaching the first ring.
 const homeX=col===0&&row===0?660:500;
 g.stage.spawns.push(...spawns);if(col%3===0&&row%2===0)g.homes.push({x:col*t.width+homeX,y:row*1000+790+shift,radius:65,chunk:key});
 g.stage.props.push(...t.props.filter(p=>p.id!=='home').map(point));
 // Speed lanes repeat with sky chunks instead of staying at the start room.
 if(biomeAt(col,row).id==='sky')g.stage.zones.push(...(t.zones||[]).map(point));
 }
 if(!g.area)g.biome=biomeAt(cx,cy);
 const keep=o=>o.chunk?wanted.has(o.chunk):Math.abs(o.x-g.player.x)<2700&&Math.abs(o.y-g.player.y)<1800;
 for(const k of ['friends','homes'])g[k]=g[k].filter(keep);
 for(const k of ['props','spawns','zones'])g.stage[k]=g.stage[k].filter(keep);
 this.loaded=wanted;this.chunks=[...wanted];
 g.stage.home=g.homes.reduce((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)<Math.hypot(b.x-g.player.x,b.y-g.player.y)?a:b);
 }
}
