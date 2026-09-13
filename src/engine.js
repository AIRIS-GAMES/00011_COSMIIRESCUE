import {checkpointRimContact,attachedSlot} from './checkpoint.js';
import {IncomingHazards} from './incoming.js';
import {difficulty,impact} from './difficulty.js';
import {RainbowMode,eyeBeams,beamHits,beamTargetVisible} from './rainbow.js';
import {pushOutEllipse} from './collision.js';
// Core rescue simulation.
import {EndlessWorld} from './endless.js';
export const VIEW_W=960;
export const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function seededRandom(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function overlap(a,b){if(b.ry){const dx=a.x-b.x,dy=a.y-b.y,c=Math.cos(b.angle||0),s=Math.sin(b.angle||0);return ((dx*c+dy*s)/(b.r+a.r))**2+((-dx*s+dy*c)/(b.ry+a.r))**2<1;}if(b.r)return distance(a,b)<a.r+b.r;return Math.hypot(a.x-clamp(a.x,b.x,b.x+b.w),a.y-clamp(a.y,b.y,b.y+b.h))<a.r;}
export function returnValue(friends,multiplier=1){const group=1+Math.min(2,Math.max(0,friends.length-1)*.2);return friends.map(f=>Math.round(f.value*f.combo*group*multiplier));}
export class RescueGame {
  constructor(stage,random=Math.random){this.template=stage;this.random=random;this.reset();}
  reset(){
    this.stage={...this.template,props:[],spawns:[],home:{...this.template.home}};
    const h=this.stage.home;this.state='ready';this.time=0;this.scrollX=0;this.travel=0;this.direction=0;this.homes=[];
    this.score=0;this.rescued=0;this.maxCarry=0;this.bestReturn=0;this.bestReturnCount=0;
    this.combo=0;this.maxCombo=0;this.comboLeft=0;this.hearts=3;
    this.player={x:h.x,y:h.y-125,vx:190,vy:0,r:17,tap:0,angle:0};
    this.target=null;this.keys=null;this.carry=[];this.friends=[];this.events=[];
    this.rimCooldown=0;this.effects={fog:0,slow:0,paper:0,slip:0};this.stun=0;this.cooldown=0;this.hitstop=0;this.endDelay=0;this.bankQueue=[];this.bankClock=0;
    this.returnLock=0;this.spawnClock=0;this.nearClock=0;this.nextId=1;
    this.obstacles=[];this.incoming=new IncomingHazards();this.view=null;
    this.rainbow=new RainbowMode();
    this.activeZones=[];
    this.world=new EndlessWorld(this.template,this.random);this.world.extend(this);
    this.unlocked=new Set();
  }
  emit(type,data={}){this.events.push({type,...data});}
  drain(){const e=this.events;this.events=[];return e;}
  start(mode=this.mode||'normal'){this.mode=mode==='hard'?'hard':'normal';this.reset();this.state='playing';this.emit('start');}
  setDirection(value){const next=clamp(value,-1,1);if(next*this.direction<0)this.emit('turn',{x:this.player.x,y:this.player.y});this.direction=next;}
  flap(){if(this.state!=='playing'||this.stun>0)return;this.player.vy=-330;this.player.tap=.28;this.emit('flap',{x:this.player.x,y:this.player.y});}
  spawnFriend(s){const f={id:this.nextId++,x:s.x,y:s.y,baseX:s.x,baseY:s.y,kind:s.kind??Math.floor(this.random()*4),value:s.rare?250:100,rare:!!s.rare,combo:1,cooldown:s.cooldown||0,phase:this.random()*6.28};this.friends.push(f);return f;}
  rescue(f){
    if(f.cooldown>0||this.carry.some(c=>c.id===f.id))return;
    this.friends=this.friends.filter(c=>c!==f);this.combo=this.comboLeft>0?Math.min(4,this.combo+1):1;this.comboLeft=4.5;
    this.maxCombo=Math.max(this.maxCombo,this.combo);f.combo=1+(this.combo-1)*.25;
    this.carry.push({...f});this.maxCarry=Math.max(this.maxCarry,this.carry.length);
    this.emit('rescue',{x:f.x,y:f.y,kind:f.kind,combo:this.combo,count:this.carry.length});
  }
  beginReturn(){
    if(!this.carry.length||this.bankQueue.length||this.returnLock>0)return;
    const friends=this.carry.splice(0),amounts=returnValue(friends),total=amounts.reduce((a,b)=>a+b,0);
    this.returnHome={...this.stage.home};this.returnCheckpoint=this.stage.home;this.returnCheckpoint.attached??=[];this.bestReturn=Math.max(total,this.bestReturn);this.bestReturnCount=Math.max(this.bestReturnCount,friends.length);
    this.hearts=Math.min(3,this.hearts+1);this.returnLock=1.2;this.bankQueue=friends.map((f,i)=>({...f,points:amounts[i],bankIndex:this.rescued+i+1}));this.bankClock=0;
    this.score+=total;this.rescued+=friends.length;
    this.onCheckpoint?.(this);
    this.emit('return',{x:this.stage.home.x,y:this.stage.home.y,count:friends.length,total});
    this.rainbow.returnGroup(this,friends.length);
  }
  bankOne(){const f=this.bankQueue.shift();if(!f)return;const h=this.returnCheckpoint||this.returnHome;h.attached??=[];const slot=attachedSlot(h.attached.length);h.attached.push({kind:f.kind,...slot,showAt:this.time+.5});this.emit('bank',{x:f.x,y:f.y,homeX:h.x+slot.x,homeY:h.y+slot.y,kind:f.kind,points:f.points,index:f.bankIndex});}
  hit(damage=1,contact=null){
    if(this.cooldown>0||this.rainbow.active)return;
    this.cooldown=difficulty(this.mode,this.time).cooldown;this.hitstop=.055;
    if(this.mode!=='hard'&&this.time<30&&!this.carry.length){this.emit('bump',{x:this.player.x,y:this.player.y});return;}
    const hadFriends=this.carry.length>0,rules=impact(this.mode,damage,this.carry.length,contact===this.player);
    this.stun=Math.max(this.stun,rules.stun);
    if(this.carry.length){const count=rules.loss;for(let i=0;i<count;i++){const lost=this.carry.pop();this.spawnFriend({x:lost.x-90-i*18,y:lost.y+60+i*12,kind:lost.kind,rare:lost.rare,cooldown:6});}this.emit('lost',{x:contact?.x??this.player.x,y:contact?.y??this.player.y,kind:0,count});}
    else{this.hearts--;this.emit('hit',{x:this.player.x,y:this.player.y});if(this.hearts<=0)this.finish('hit');}
    if(contact)this.emit('blood',{x:contact.x,y:contact.y,damage});
    if(hadFriends&&rules.life&&this.time>=30){this.hearts--;this.emit('hit',{x:this.player.x,y:this.player.y});}
    if(rules.fatal||this.hearts<=0||this.mode==='hard'&&!this.carry.length){this.hearts=0;this.finish('hit');}
    this.combo=0;this.comboLeft=0;
  }
  finish(reason='time'){if(this.state!=='playing')return;while(this.bankQueue.length)this.bankOne();this.state='ending';this.endDelay=reason==='hit'?.85:.4;this.reason=reason;this.target=null;this.emit('finish',{reason,unbanked:this.carry.length});}
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);
    if(this.state==='ending'){this.endDelay-=dt;if(this.endDelay<=0){this.state='over';this.emit('gameOver');}return;}
    if(this.state!=='playing')return;if(this.hitstop>0){this.hitstop-=dt;return;}
    for(const key of Object.keys(this.effects))this.effects[key]=Math.max(0,this.effects[key]-dt);
    this.stun=Math.max(0,this.stun-dt);
    this.rainbow.update(this,dt);
    this.time+=dt;this.scrollX=Math.max(this.scrollX+110*(this.effects.slow>0?.5:1)*dt,this.player.x-310);this.travel=Math.max(this.travel,(this.player.x-this.template.home.x)/10);this.world.extend(this);this.incoming.update(this,dt);
    this.cooldown=Math.max(0,this.cooldown-dt);this.returnLock=Math.max(0,this.returnLock-dt);this.comboLeft=Math.max(0,this.comboLeft-dt);if(!this.comboLeft)this.combo=0;
    if(this.time>=30&&!this.unlocked.has('difficulty-30')){this.unlocked.add('difficulty-30');this.emit('difficulty',{level:1});}
    if(this.time>=45&&!this.unlocked.has('difficulty-45')){this.unlocked.add('difficulty-45');this.emit('difficulty',{level:2});}
    if(this.time>=60&&!this.unlocked.has('difficulty-60')){this.unlocked.add('difficulty-60');this.emit('difficulty',{level:3});}
    for(const s of this.stage.spawns)if(s.after&&this.time>=s.after&&!this.unlocked.has(s.id)){this.unlocked.add(s.id);this.spawnFriend(s);}
    this.activeZones=this.stage.zones.filter(z=>this.time>=z.after);this.spawnClock+=dt;
    if(this.spawnClock>5&&this.friends.length<23){this.spawnClock=0;const spots=this.stage.spawns.filter(s=>(!s.after||s.after<=this.time)&&!this.friends.some(f=>distance(f,s)<65)&&distance(this.player,s)>125);if(spots.length)this.spawnFriend(spots[Math.floor(this.random()*spots.length)]);}
    const p=this.player,previous={x:this.player.x,y:this.player.y};p.tap=Math.max(0,p.tap-dt);
    const turbo=this.activeZones.some(z=>p.x>z.x&&p.x<z.x+z.w&&p.y>z.y&&p.y<z.y+z.h);
    const speed=(turbo?1.3:1)*(this.effects.slow>0?.5:1),tx=(this.direction<0?this.direction*225:this.direction>0?this.direction*310:190)*speed;
    if(this.stun<=0)p.vx+=(tx-p.vx)*(1-Math.exp(-(this.effects.slip>0?2:12)*dt));p.vy=Math.min(475,p.vy+820*dt);
    p.x=Math.max(p.r+8,p.x+p.vx*dt);p.y+=p.vy*dt;
    if(p.y<60){p.y=60;p.vy=Math.max(40,p.vy);}
    p.angle+=(clamp(p.vx/900,-.23,.23)-p.angle)*dt*9;
    for(let i=0;i<this.carry.length;i++){
      const f=this.carry[i],ring=Math.floor(i/8),slot=i%8,count=Math.min(8,this.carry.length-ring*8);
      const angle=-Math.PI/2+slot*Math.PI*2/count+ring*.38,radius=36+ring*27;
      const x=p.x+Math.cos(angle)*radius-p.vx*.009,y=p.y+Math.sin(angle)*radius+Math.sin(this.time*3+f.phase)*2;
      const follow=1-Math.exp(-24*dt);f.x+=(x-f.x)*follow;f.y+=(y-f.y)*follow;
    }
    const beams=this.rainbow.active?eyeBeams(this):[];
    for(const o of this.obstacles){
      o.disabled=Math.max(0,o.disabled-dt);
      if(o.incoming){o.x+=o.vx*dt;o.y+=o.vy*dt;}else{
      const m=o.motion||{x:12,y:16,speed:.85},phase=o.asset?o.phase:0;
      const strength=o.motion&&this.time<30?.45:1;
      o.x=o.baseX+(Math.sin(this.time*m.speed+phase)-Math.sin(phase))*m.x*strength;
      o.y=o.baseY+(Math.cos(this.time*m.speed+phase)-Math.cos(phase))*m.y*strength;
      }
      if(this.rainbow.active){if(beamTargetVisible(this,o)&&beams.some(b=>beamHits(b,o))){o.destroyed=true;this.emit('break',{x:o.x,y:o.y,asset:o.asset,size:o.size,angle:o.angle,rainbow:true});}continue;}
      if(o.disabled)continue;
      const collision=overlap(p,o);
      if(o.effect){if(collision){this.effects[o.effect]=Math.max(this.effects[o.effect],o.duration);o.disabled=o.duration+1;this.emit('hinder',{x:p.x,y:p.y,effect:o.effect});}continue;}
      if(collision){
        {
          this.hit(o.damage||1,p);
          if(o.ry)pushOutEllipse(p,o);
          else if(o.r){const d=Math.max(.1,distance(p,o));let nx=(p.x-o.x)/d,ny=(p.y-o.y)/d;if(!nx&&!ny)nx=1;p.x=o.x+nx*(o.r+p.r+1);p.y=o.y+ny*(o.r+p.r+1);}
          else{const l=Math.abs(p.x-o.x),r=Math.abs(p.x-o.x-o.w),t=Math.abs(p.y-o.y),b=Math.abs(p.y-o.y-o.h),m=Math.min(l,r,t,b);if(m===l)p.x=o.x-p.r-1;else if(m===r)p.x=o.x+o.w+p.r+1;else if(m===t)p.y=o.y-p.r-1;else p.y=o.y+o.h+p.r+1;}
          p.vx*=-.3;p.vy*=-.3;this.target=null;
        }
      }else{const buddy=this.carry.find(f=>overlap({...f,r:11},o));if(buddy)this.hit(o.damage||1,buddy);}
      if(this.state!=='playing')return;
      const close=!collision&&overlap({...p,r:31},o);
      if(close&&!o.near&&Math.hypot(p.vx,p.vy)>90&&this.time-this.nearClock>1){this.nearClock=this.time;this.emit('near',{x:p.x,y:p.y});}o.near=close;
    }
    for(const f of this.friends){f.x=f.baseX+(Math.sin(this.time*1.2+f.phase)-Math.sin(f.phase))*22;f.y=f.baseY+(Math.cos(this.time*.95+f.phase)-Math.cos(f.phase))*18;}
    for(const obj of [...this.homes,...this.stage.props]){obj.previousX=obj.x;obj.previousY=obj.y;
      obj.baseX??=obj.x;obj.baseY??=obj.y;
      obj.x=obj.baseX+Math.sin(this.time*.85)*12;obj.y=obj.baseY+(Math.cos(this.time*.85)-1)*16;
    }
    this.obstacles=this.obstacles.filter(o=>!o.destroyed);
    for(const f of [...this.friends]){f.cooldown=Math.max(0,f.cooldown-dt);if(distance(p,f)<48)this.rescue(f);}
    const rim=this.homes.find(h=>checkpointRimContact(p,h));
    if(rim){p.x=previous.x;p.y=previous.y;p.vx*=-.35;p.vy*=-.35;if(!this.rimCooldown){this.rimCooldown=.35;this.emit('rim',{x:p.x,y:p.y});}}
    this.rimCooldown=Math.max(0,(this.rimCooldown||0)-dt);
    const arrived=!rim&&this.homes.find(h=>{
      const ax=previous.x-(h.previousX??h.x),ay=previous.y-(h.previousY??h.y),bx=p.x-h.x,by=p.y-h.y;
      if(ax*bx<=0&&Math.abs(bx-ax)>.001){const t=-ax/(bx-ax);if(Math.abs(ay+(by-ay)*t)<64)return true;}
      if(ay*by<=0&&Math.abs(by-ay)>.001){const t=-ay/(by-ay);if(Math.abs(ax+(bx-ax)*t)<53)return true;}
      return false;
    });if(arrived){this.stage.home=arrived;this.beginReturn();}
    if(this.bankQueue.length){this.bankClock-=dt;if(this.bankClock<=0){this.bankClock=.13;this.bankOne();}}
  }
}
