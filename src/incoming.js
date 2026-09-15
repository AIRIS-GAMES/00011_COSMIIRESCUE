import {sectionHazards} from './hazards.js';
import {difficulty} from './difficulty.js';
export class IncomingHazards {
  constructor(){this.wait=.7;this.serial=0;}
  update(g,dt){
    for(const o of g.obstacles)if(o.incoming){o.life-=dt;}
    g.obstacles=g.obstacles.filter(o=>!o.incoming||o.life>0);
    if(g.powered)this.wait=Math.min(this.wait,.42);
    this.wait-=dt;if(this.wait>0)return;
    const danger=g.biome?.id==='neon',settings=difficulty(g.mode,g.time,danger);this.wait=settings.interval;
    if(g.powered)this.wait=.42;
    if(g.obstacles.length>=14)return;
    const p=g.player,view=g.view||{x:p.x-460,y:p.y-240,w:1067,h:480};
    let dx=g.direction<-.15?-1:1,dy=0;
    if(!g.powered&&Math.abs(p.vy)>Math.abs(p.vx)*1.3){dx=0;dy=Math.sign(p.vy);}
    const pool=sectionHazards(Math.floor(p.x/1320),Math.floor(p.y/1000),danger||settings.heavy).filter(o=>
      (!g.collaboration?.enabled||!['knife','fork'].includes(o.asset))&&
      (settings.heavy||!o.directed&&o.damage!==3));
    const entry={...pool[Math.floor(g.random()*pool.length)]};entry.size=((entry.damage>1?190:150)+g.random()*120)*(entry.asset==='knife'?1.5:1);entry.r=entry.size*.31;if(entry.directed)entry.ry=entry.size*.13;
    const margin=entry.size/2+90,offset=(g.random()-.5)*Math.min(300,dx?view.h*.65:view.w*.6);
    const x=dx>0?view.x+view.w+margin:dx<0?view.x-margin:Math.max(view.x+margin,Math.min(view.x+view.w-margin,p.x+offset));
    const y=dy>0?view.y+view.h+margin:dy<0?view.y-margin:Math.max(view.y+margin,Math.min(view.y+view.h-margin,p.y+offset));
    // Commit to a straight path. Changing direction never makes old hazards home in.
    const speed=((entry.damage>1?180:135)+(danger?35:0))*settings.speed*(g.powered?1.5:1);
    const aim=entry.directed?Math.atan2(p.y-y,p.x-x):Math.atan2(-dy,-dx);
    g.obstacles.push({...entry,angle:entry.directed?aim:0,id:`incoming-${this.serial++}`,x,y,baseX:x,baseY:y,vx:Math.cos(aim)*speed,vy:Math.sin(aim)*speed,incoming:true,life:10,disabled:0,near:false,phase:0});
  }
}
