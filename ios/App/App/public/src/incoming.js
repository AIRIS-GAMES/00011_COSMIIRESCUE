import {pickHazard,hazardTypes} from './hazards.js';
import {pressure} from './difficulty.js';
import {SPIN_CHANCE} from './motions.js';
export const SLOW_CHANCE=.25;
export class IncomingHazards {
  constructor(){this.wait=.7;this.serial=0;}
  update(g,dt){
    for(const o of g.obstacles)if(o.incoming){o.life-=dt;}
    g.obstacles=g.obstacles.filter(o=>!o.incoming||o.life>0);
    if(g.powered)this.wait=Math.min(this.wait,.42);
    this.wait-=dt;if(this.wait>0)return;
    const area=g.area,settings=pressure(g.mode,{time:g.time,area,carry:g.carry?.length||0,returns:g.returnSequence||0});this.wait=settings.interval;
    if(g.powered)this.wait=.42;
    if(g.obstacles.length>=14)return;
    const p=g.player,view=g.view||{x:p.x-460,y:p.y-240,w:1067,h:480};
    let dx=g.forward??(g.direction<-.15?-1:1),dy=0;
    if(!g.powered&&Math.abs(p.vy)>Math.abs(p.vx)*1.3){dx=0;dy=Math.sign(p.vy);}
    const asset=pickHazard(g.random,{heavy:settings.heavy,normal:settings.normal,exclusive:area?.exclusive,exclude:g.collaboration?.enabled?['knife','fork']:[]});
    const entry={asset,...hazardTypes[asset]};entry.size=((entry.damage>1?190:150)+g.random()*120)*(asset==='knife'?1.5:1);entry.r=entry.size*(entry.round?.27:.31);if(entry.directed&&!entry.round)entry.ry=entry.size*.13;
    const margin=entry.size/2+90,offset=(g.random()-.5)*Math.min(300,dx?view.h*.65:view.w*.6);
    const x=dx>0?view.x+view.w+margin:dx<0?view.x-margin:Math.max(view.x+margin,Math.min(view.x+view.w-margin,p.x+offset));
    const y=dy>0?view.y+view.h+margin:dy<0?view.y-margin:Math.max(view.y+margin,Math.min(view.y+view.h-margin,p.y+offset));
    // Commit to a straight path. Changing direction never makes old hazards home in.
    // Random pace per arrival: about 1 in 4 drifts in slowly (55–75%), the rest vary a little (90–110%).
    const pace=g.random()<SLOW_CHANCE?.55+g.random()*.2:.9+g.random()*.2;
    const speed=(entry.damage>1?180:135)*settings.speed*(entry.fast||1)*pace*(g.powered?1.5:1);
    const aim=entry.directed?Math.atan2(p.y-y,p.x-x):Math.atan2(-dy,-dx);
    g.obstacles.push({...entry,angle:entry.directed?aim:0,pace,flip:entry.faces&&Math.cos(aim)<0,spinning:g.random()<SPIN_CHANCE,seed:g.random()*6,id:`incoming-${this.serial++}`,x,y,baseX:x,baseY:y,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,incoming:true,life:10,disabled:0,near:false,phase:0});
  }
}
