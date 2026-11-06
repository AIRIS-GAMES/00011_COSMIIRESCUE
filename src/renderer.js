import {SKILL_COLORS} from './skills.js';
import {COLLECTIBLE_RADIUS} from './collection.js';
import {biomes,drawBiome} from './biomes.js';
import {EFFECTS,activeEffects} from './effects.js';
import {WIND_KINDS,WIND_WARN,WIND_BLOW} from './wind.js';
import {canvasResolution,smoothImages} from './canvas-resolution.js';
import {eyeBeams,RAINBOW_TARGET} from './rainbow.js';
import {VIEW_W,clamp,distance} from './engine.js';
import {friends as characterInfo} from './characters.js';
import {RescueReactions} from './rescue-reactions.js';
import {presentationFlags} from './presentation-config.js';
import {t as _t} from './i18n.js';
export class Renderer {
  constructor(canvas,assets,stage){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;this.stage=stage;this.width=VIEW_W;this.height=768;this.zoom=.9;this.camera={x:-35,y:200};this.clock=0;this.particles=[];this.popups=[];this.deliveries=[];this.bursts=[];this.fragments=[];this.shake=0;this.flash=0;this.homePulse=0;this.reactions=new RescueReactions(presentationFlags().reactions);this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();}
  resize(){
    const width=this.canvas.clientWidth,height=this.canvas.clientHeight,density=devicePixelRatio||1;
    if(!width||!height)return;
    if(width===this.viewportWidth&&height===this.viewportHeight&&density===this.pixelRatio)return;
    this.viewportWidth=width;this.viewportHeight=height;this.pixelRatio=density;
    this.height=VIEW_W*height/width;
    const pixels=canvasResolution(width,height,density);
    this.canvas.width=pixels.width;this.canvas.height=pixels.height;
    this.ctx.setTransform(pixels.width/VIEW_W,0,0,pixels.height/this.height,0,0);smoothImages(this.ctx);
  }
  screenToWorld(x,y){return {x:x/this.zoom+this.camera.x,y:y/this.zoom+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.zoom,y:(y-this.camera.y)*this.zoom};}
  snap(game){this.milestoneFx=null;this.lastRescueEffect=-Infinity;this.reactions?.reset();this.followCamera(game,1,true);this.particles=[];this.popups=[];this.deliveries=[];this.bursts=[];this.fragments=[];}
  followCamera(game,dt,snap=false){const x=game.player.x-this.width*.43/this.zoom,y=game.player.y-this.height*.5/this.zoom,t=snap?1:1-Math.exp(-9*dt);this.camera.x+=(x-this.camera.x)*t;this.camera.y+=(y-this.camera.y)*t;}


  round(x,y,w,h,r,fill,stroke=null,width=1.5){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  circle(x,y,r,fill,stroke=null,width=1.5){const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  star(x,y,r,fill,angle=0){const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.33:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.restore();}
  image(img,x,y,w,h=w){if(!img)return;const scale=Math.min(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale;this.ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
  text(text,x,y,size=14,color='#335343',align='center',outline=false){const c=this.ctx;c.font=`400 ${size}px 'Mochiy Pop One', sans-serif`;c.textAlign=align;c.textBaseline='middle';if(outline){c.lineWidth=4;c.strokeStyle='#fffbea';c.strokeText(text,x,y);}c.fillStyle=color;c.fillText(text,x,y);}
  burst(x,y,count,colors=['#fff2c5','#b9e4a1','#ffaec7'],force=130){for(let i=0;i<(this.reduced?Math.ceil(count/3):count);i++){const a=Math.random()*6.28,s=force*(.2+Math.random());this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.6,size:2+Math.random()*5,color:colors[i%colors.length],star:i%3===0});}if(this.particles.length>220)this.particles.splice(0,this.particles.length-220);}
  popup(text,x,y,color='#3c6448',size=19){this.popups.push({text,x,y,color,size,life:1.2});}
  event(e,game){
    this.reactions?.event(e,game);
    if(e.type==='itemCollected')this.popup('GET!',e.x,e.y-29,'#bb6d73',21);
    if(e.type==='character_skill_trigger')this.bursts.push({x:e.x,y:e.y,color:e.characterType==='blue'?'#71cdff':'#c18aff',life:.5,r:75});
    if(e.type==='collaborationStart')this.shake=3;
    if(e.type==='rainbowStart'){this.burst(e.x,e.y,65,['#ff75c7','#ffe45e','#8dffbc','#85dcff'],250);this.popup(_t('レインボーモード！'),e.x,e.y-65,'#bc32a0',27);this.shake=5;}
    if(e.type==='blood'&&!this.collaborationEnabled){
      const count=this.reduced?3:8+Math.min(3,e.damage||1);
      for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=55+Math.random()*100;this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,life:.3+Math.random()*.2,size:3+Math.random()*2,color:i%2?'#d9364d':'#a81f36',star:false,blood:true});}
    }
    if(e.type==='flap')this.burst(e.x,e.y+16,6,['#faffdd','#bbdd88'],40);
    if(e.type==='turn'){this.burst(e.x,e.y,10,['#fff4cf','#c4edaa'],95);this.popup(_t('ヒュン！'),e.x,e.y-37,'#749060',12);}
    if(e.type==='rescue'&&(game.time-(this.lastRescueEffect??-Infinity)>=.12)){this.lastRescueEffect=game.time;this.bursts.push({x:e.x,y:e.y,color:characterInfo[e.kind].color,life:.32,r:55});this.burst(e.x,e.y,10,[characterInfo[e.kind].color,'#fff4c8','#b8df9a'],150);if(!Number.isInteger(e.collaborationKind))this.popup(_t('ポン！'),e.x,e.y-29,'#bb6d73',21);}
    if(e.type==='return'){this.bursts.push({x:e.x,y:e.y,color:'#ff5f82',life:.65,r:155});this.homePulse=1.5;this.burst(e.x,e.y,Math.min(70,e.count*10),['#fff4c3','#ffc4db','#a8dfa7'],210);this.popup(_t('{0}匹！',[e.count]),e.x,e.y-90,'#538d4a',27);}
    if(e.type==='bank'){this.deliveries.push({x:e.x,y:e.y,startX:e.x,startY:e.y,homeX:e.homeX,homeY:e.homeY,kind:e.kind,collaborationKind:e.collaborationKind,life:.5});this.popup(`+${e.points}`,e.homeX+45,e.homeY-30,'#b98431',20);}
    if(e.type==='lost'){this.burst(e.x,e.y,14,['#ffb2bc','#fff2e0'],160);this.popup(`−${e.count||1}`,e.x,e.y-35,'#b26d76',15);this.shake=5;}
    if(e.type==='hinder'){const fx=EFFECTS[e.effect];this.burst(e.x,e.y,14,['#c3f4ff','#fff7db'],90);if(fx)this.popup(fx.name,e.x,e.y-42,fx.color,20);this.effectFlash={id:e.effect,life:.5};}
    if(e.type==='rim'){this.burst(e.x,e.y,10,['#fff4cf','#ffaacb'],110);this.shake=2;if(e.bounce)this.popup(_t('ポヨン！'),e.x,e.y-34,'#e8613a',16);}
    if(e.type==='bump')this.popup('SHIELD',e.x,e.y-35,'#60885e',15);
    if(e.type==='hit'){this.shake=7;this.flash=.2;this.burst(e.x,e.y,20,['#ffb4bd','#ffecd7']);}
    if(e.type==='near'){this.burst(e.x,e.y,8,['#fff9d2','#d4f2af'],70);this.popup('NICE!',e.x,e.y-35,'#719455',15);}
    if(e.type==='break'){
      this.burst(e.x,e.y,e.rainbow?60:25,['#fff5a5','#ff79c5','#7eeeff','#ffffff'],e.rainbow?380:180);
      this.shake=Math.max(this.shake,e.rainbow?9:4);
      this.bursts.push({x:e.x,y:e.y,color:'#fff9d1',life:.48,r:Math.min(210,(e.size||180)*.65)});
      this.bursts.push({x:e.x,y:e.y,color:'#ff4fa8',life:.3,r:Math.min(260,(e.size||180)*.8)});
      const img=this.assets[e.asset];
      if(img){const size=e.size||180,scale=size/Math.max(img.width,img.height),angle=e.angle||0;
        for(let i=0;i<(this.reduced?4:9);i++){const col=i%3,row=Math.floor(i/3),a=angle+Math.atan2(row-1,col-1),speed=170+Math.random()*220;
          this.fragments.push({img,sx:col*img.width/3,sy:row*img.height/3,sw:img.width/3,sh:img.height/3,w:img.width*scale/3,h:img.height*scale/3,x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-80,angle,spin:(Math.random()-.5)*9,life:.7});}
      }
      if(this.fragments.length>90)this.fragments.splice(0,this.fragments.length-90);
    }
    if(e.type==='best')this.burst(this.stage.home.x,this.stage.home.y-180,65,['#ffe27e','#ffbaca','#bddd93'],250);
  }
  prop(p,factor=1){const c=this.ctx;c.save();c.globalAlpha=p.opacity??1;c.filter='saturate(1.55) contrast(1.12)';const x=(p.x-this.camera.x*factor)*this.zoom,y=(p.y-this.camera.y*factor)*this.zoom;this.image(this.assets[p.asset],x-p.w*this.zoom/2,y-p.h*this.zoom,p.w*this.zoom,p.h*this.zoom);c.restore();}
  scenery(game,title){
    const c=this.ctx,w=this.width,h=this.height;
    const theme=title?biomes[0]:(game.biome||biomes[0]);
    if(this.theme?.id!==theme.id){this.previousTheme=this.theme||theme;this.theme=theme;this.themeStart=this.clock;}
    const fade=this.reduced?1:clamp((this.clock-this.themeStart)/1.2,0,1);
    if(fade<1&&this.previousTheme.id!==theme.id){
      drawBiome(this,this.previousTheme);c.save();c.globalAlpha=fade;drawBiome(this,theme);c.restore();
    }else drawBiome(this,theme);
    for(const p of this.stage.props.filter(p=>p.layer==='far'))this.prop(p,.32);
    for(const p of this.stage.props.filter(p=>p.layer==='mid'))this.prop(p,.6);
    // High-contrast world signage and fast, low-opacity motion marks.
    c.save();c.globalAlpha=.35;
    c.restore();
    if(!title&&game.powered){c.save();const rainbow=c.createLinearGradient(0,0,w,h);['#ff80c5','#ffb968','#fff47a','#8cf6b8','#75dfff','#b49bff','#ff87d3'].forEach((color,i)=>rainbow.addColorStop(i/6,color));c.globalAlpha=.8;c.fillStyle=rainbow;c.fillRect(0,0,w,h);c.globalAlpha=.22;c.strokeStyle='#fff';c.lineWidth=24;for(let i=0;i<6;i++){c.beginPath();c.arc(w*.45,h*.5,((this.clock*(this.reduced?0:55)+i*130)%780),0,Math.PI*2);c.stroke();}c.restore();}
    if(!title){c.save();c.globalAlpha=.3;c.strokeStyle='#fffde4';c.lineWidth=2;for(let i=0;i<13;i++){const x=((i*83-this.clock*(150+Math.abs(game.player.vx)*.45))%600+600)%600-90,y=180+(i*61)%(h-330);c.beginPath();c.moveTo(x,y);c.lineTo(x+18+(i%3)*12,y);c.stroke();}c.restore();}
  }

  home(game,h,front=false){const c=this.ctx,s=this.worldToScreen(h.x,h.y),w=340*this.zoom,ih=w*this.assets.home.height/this.assets.home.width;
    c.save();if(front){c.beginPath();c.rect(s.x+22*this.zoom,s.y-180*this.zoom,220*this.zoom,360*this.zoom);c.clip();}
    this.image(this.assets.home,s.x-w*.5,s.y-ih*.5,w,ih);c.restore();
    if(front)for(const f of h.attached||[]){if(game.time<f.showAt)continue;const size=43*this.zoom;c.save();c.translate(s.x+f.x*this.zoom,s.y+f.y*this.zoom);if(!Number.isInteger(f.collaborationKind))this.reactions?.applyReturn(c,f.kind,game.time-f.showAt,this.reduced);this.image(this.friendImage(f),-size/2,-size/2,size,size);c.restore();}
    if(!front){if(this.homePulse>0){c.save();c.globalAlpha=this.homePulse*.3;this.star(s.x,s.y,65*this.zoom,'#fff3a6');c.restore();}}
  }

  friendImage(f){return this.collaborationEnabled&&Number.isInteger(f.collaborationKind)?this.assets.collaborationImages[f.collaborationKind]:this.assets.friends[f.kind];}
  friend(f,carried=false,index=0){
    // Keep a generous border for bobbing, rare effects and camera shake.
    // Only drawing is skipped; offscreen friends still update in the engine.
    const margin=64;
    if(f.x<this.camera.x-margin||f.x>this.camera.x+this.width/this.zoom+margin||f.y<this.camera.y-margin||f.y>this.camera.y+this.height/this.zoom+margin)return;
    const c=this.ctx;c.save();c.translate(f.x,f.y+(this.reduced?0:Math.sin(this.clock*3.2+f.phase)*3));
    if(this.collaborationEnabled&&Number.isInteger(f.collaborationKind)){this.image(this.friendImage(f),-28,-28,56,56);c.restore();return;}
    if(f.cooldown>0)c.globalAlpha=.38;
    if(f.rare){c.save();c.globalAlpha=.25+Math.sin(this.clock*3)*.08;this.circle(0,0,32,'#ffe383');c.restore();this.star(20,-20,7,'#fff6b5',this.clock*.3);}
    if(f.reaction>0&&!this.reduced){const wave=Math.sin(f.reaction*12);c.translate(0,-Math.abs(wave)*(f.characterType==='purple'?15:7));c.rotate(wave*(f.characterType==='pink'?.16:.08));}
    if(carried)this.reactions?.applyBuddy(c,f.id,this.reduced);
    c.rotate(Math.sin(this.clock*4+f.phase)*.075);this.image(this.assets.friends[f.kind],-28,-28,56,56);
    if(f.support)this.text(_t('応援'),0,34,10,'#42665b');
    c.restore();
  }
  world(game,dt,paused){const c=this.ctx;
    for(const zone of game.activeZones){const s=this.worldToScreen(zone.x,zone.y);c.save();c.globalAlpha=.16;this.round(s.x,s.y,zone.w*this.zoom,zone.h*this.zoom,20,'#fff4c6');c.restore();for(const side of [-1,1]){const ax=s.x+zone.w*this.zoom/2+side*58,ay=s.y+20;c.save();c.fillStyle='#e7b45c';c.beginPath();c.moveTo(ax-6,ay-6);c.lineTo(ax+6,ay);c.lineTo(ax-6,ay+6);c.closePath();c.fill();c.restore();}}
    for(const h of game.homes)this.home(game,h);
    for(const p of this.stage.props.filter(p=>p.layer==='world'&&!p.id.startsWith('home-')))this.prop(p);
    c.save();c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    for(const ring of this.reactions?.rings||[]){const t=(this.reactions.time-ring.start)/1.1;c.save();c.globalAlpha=(1-t)*.5;this.circle(ring.x,ring.y,65+t*30,'#d6ffec22','#d6ffec',3);c.restore();}
    for(const o of game.obstacles){if(!o.asset)continue;c.save();if(o.disabled)c.globalAlpha=.17;
      // Effect hazards (no damage) wear a soft dashed halo so they read differently from damaging ones.
      if(o.effect&&o.r&&!o.disabled){c.save();c.globalAlpha=.55;c.setLineDash([8,7]);c.lineDashOffset=-this.clock*20;this.circle(o.x,o.y,(o.size||(o.r+12)*2)*.42,'#ffffff40','#ffffff',3);c.restore();}
      if(o.motion){c.save();c.globalAlpha=.15;c.strokeStyle='#c07768';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(o.baseX-o.motion.x,o.baseY-o.motion.y);c.lineTo(o.baseX+o.motion.x,o.baseY+o.motion.y);c.stroke();c.restore();}
      if(o.r){const size=o.size||(o.r+12)*2;c.translate(o.x,o.y);c.rotate(o.angle||0);if(o.flip)c.scale(-1,1);this.image(this.assets[o.asset],-size/2,-size/2,size,size);}else c.drawImage(this.assets[o.asset],o.x,o.y,o.w,o.h);c.restore();}
    
    for(const item of game.items||[]){
      const x=item.x,y=item.y,r=COLLECTIBLE_RADIUS;
      this.circle(x,y,r,'#f7ffffee','#34535c',3);
      this.image(this.assets[item.id],x-17,y-21,34,34);
      this.round(x-21,y+9,42,12,5,'#aee9dd','#34535c',2);
      this.round(x-5,y+7,10,7,2,'#fffcea','#34535c',2);
      c.save();c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.arc(x,y,r-5,Math.PI,Math.PI*1.4);c.stroke();c.restore();
    }
    for(const f of game.friends)this.friend(f);
    if(game.target&&distance(game.target,game.player)>45){c.save();c.globalAlpha=.45;c.strokeStyle='#fafbd7';c.lineWidth=2;c.beginPath();c.arc(game.target.x,game.target.y,12+Math.sin(this.clock*5)*2,0,6.28);c.stroke();c.restore();}

    for(let i=game.carry.length-1;i>=0;i--)this.friend(game.carry[i],true,i);
    const p=game.player;
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);this.reactions?.applyHero(c,this.reduced,game.powered);this.skillAura(game);if(game.cooldown>0&&Math.sin(this.clock*25)<0)c.globalAlpha=.45;
    if(p.tap>0){const v=Math.sin(p.tap/.28*Math.PI)*.07;c.scale(1+v,1-v);}const frame=!game.powered&&p.tap>0&&this.assets.flapFrames?this.assets.flapFrames[Math.min(3,Math.floor((.28-p.tap)/.07))]:this.assets.hero;for(const [kind,left] of (game.skillLeft||[]).entries()){if(left<=0)continue;c.save();c.globalAlpha*=Math.min(.8,left/.3);c.shadowColor=SKILL_COLORS[kind];c.shadowBlur=18;c.drawImage(frame,-38,-38,76,76);c.restore();}this.image(frame,-38,-38,76,76);c.restore();
    if(game.powered){
      c.save();c.lineCap='round';
      for(const beam of eyeBeams(game)){const endX=beam.x+beam.dx*beam.length,endY=beam.y+beam.dy*beam.length;
        for(const [width,color] of [[22,'#fa56bd88'],[12,'#72eaff'],[5,'#fffbea']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(beam.x,beam.y);c.lineTo(endX,endY);c.stroke();}
        this.star(beam.x,beam.y,8,'#fff8aa',this.clock*2);
      }c.restore();
    }
    this.heroEffects(game);
    if(Math.hypot(p.vx,p.vy)>60&&!paused&&Math.random()<.45)this.burst(p.x-p.vx*.1,p.y-p.vy*.1,1,['#fffadc','#cceaa9'],15);
    for(const d of this.deliveries){if(!paused)d.life-=dt;const t=clamp(1-d.life/.5,0,1),ease=1-(1-t)**3;d.x=d.startX+(d.homeX-d.startX)*ease;d.y=d.startY+(d.homeY-d.startY)*ease;c.globalAlpha=this.collaborationEnabled&&Number.isInteger(d.collaborationKind)?1:1-t*.5;const size=50*(1-t*.14);c.save();c.translate(d.x,d.y);if(!Number.isInteger(d.collaborationKind))this.reactions?.applyReturn(c,d.kind,t*.5,this.reduced);this.image(this.friendImage(d),-size/2,-size/2,size,size);c.restore();}c.globalAlpha=1;this.deliveries=this.deliveries.filter(d=>d.life>0);
    for(const b of this.bursts){if(!paused)b.life-=dt;c.save();c.globalAlpha=clamp(b.life*3,0,1);c.translate(b.x,b.y);const radius=b.r*(1.25-b.life*.6);c.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?radius*.65:radius;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.lineWidth=4;c.strokeStyle=b.color;c.stroke();c.restore();}this.bursts=this.bursts.filter(b=>b.life>0);
    for(const f of this.fragments){if(!paused){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=320*dt;f.angle+=f.spin*dt;}c.save();c.globalAlpha=clamp(f.life*3,0,1);c.translate(f.x,f.y);c.rotate(f.angle);c.drawImage(f.img,f.sx,f.sy,f.sw,f.sh,-f.w/2,-f.h/2,f.w,f.h);c.restore();}this.fragments=this.fragments.filter(f=>f.life>0);
    for(const part of this.particles){if(!paused){part.life-=dt;part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=90*dt;}c.globalAlpha=clamp(part.life*2,0,1);if(part.star)this.star(part.x,part.y,part.size,part.color,part.life*2);else this.circle(part.x,part.y,part.size*.65,part.color);}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.popups){if(!paused){p.life-=dt;p.y-=22*dt;}c.globalAlpha=clamp(p.life*2,0,1);this.text(p.text,p.x,p.y,p.size,p.color,'center',true);}c.globalAlpha=1;this.popups=this.popups.filter(p=>p.life>0);c.restore();
    for(const p of this.stage.props.filter(p=>p.layer==='foreground'))this.prop(p,1.12);
  }
  checkpointHint(game){const h=game.stage.home;if(distance(game.player,h)>900&&!game.carry.length)return;const s=this.worldToScreen(h.x,h.y),c=this.ctx;
    if(s.x>90&&s.x<this.width-90&&s.y>100&&s.y<this.height-100)return;
    const x=clamp(s.x,90,this.width-90),y=clamp(s.y,100,this.height-105),angle=Math.atan2(s.y-y,s.x-x);
    c.save();c.translate(x,y);const pulse=1+Math.sin(this.clock*5)*.07;c.scale(pulse,pulse);this.image(this.assets.home,-27,-27,54,54);c.rotate(angle);c.beginPath();c.moveTo(37,-10);c.lineTo(51,0);c.lineTo(37,10);c.strokeStyle='#fff4a5';c.lineWidth=5;c.lineJoin='round';c.stroke();c.restore();
  }

  skillAura(game){
    const c=this.ctx,active=(game.skillLeft||[]).map((left,kind)=>({left,kind})).filter(s=>s.left>0);
    for(const [layer,{left,kind}] of active.entries()){
      const color=SKILL_COLORS[kind],pulse=this.reduced?0:Math.sin(this.clock*4+kind)*2,r=47+layer*7+pulse;
      c.save();c.globalAlpha=Math.min(1,left/.3);const glow=c.createRadialGradient(0,0,22,0,0,r+20);glow.addColorStop(0,color+'12');glow.addColorStop(.65,color+'50');glow.addColorStop(1,color+'00');c.fillStyle=glow;c.beginPath();c.arc(0,0,r+20,0,Math.PI*2);c.fill();
      c.shadowColor=color;c.shadowBlur=20;c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.ellipse(0,0,r,r*.85,0,0,Math.PI*2);c.stroke();c.lineWidth=1.4;c.strokeStyle='#fff5ff';c.stroke();
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5+(this.reduced?kind:this.clock*(kind%2?-.9:.9));this.circle(Math.cos(a)*r,Math.sin(a)*r*.85,2.5,color);}
      c.restore();
    }
  }
  title(){const c=this.ctx,h=this.height;
const center=this.width*.51,scale=Math.min(.88,h/390);const positions=[[0,0],[-48,-56],[49,-58],[63,18],[40,85],[-44,80],[-65,15]].map(([x,y])=>({x:center+x*scale,y:h*.55+y*scale}));
    c.save();c.strokeStyle='#fff5d590';c.lineWidth=3;c.setLineDash([4,7]);c.beginPath();for(const [i,p] of positions.entries()){if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.stroke();c.restore();
    positions.forEach((p,i)=>{const size=(i===0?97:67)*scale,y=p.y+(this.reduced?0:Math.sin(this.clock*2.5-i*.7)*7*scale);c.save();c.translate(p.x,y);c.rotate(Math.sin(this.clock*1.5-i)*.07);this.image(i?this.assets.friends[(i-1)%4]:this.assets.hero,-size/2,-size/2,size,size);c.restore();});
    if(this.collaborationEnabled){
      // Keep the guests clear of the logo, campaign banner and PLAY menu.
      const guests=[[.15,.85,0,1],[.32,.86,2,.9],[.40,.32,3,.85],[.61,.43,5,.9],[.60,.83,6,1]];
      guests.forEach(([x,y,kind,scale],i)=>{
        const size=Math.min(76,h*.18)*scale,phase=i*1.7;
        const dx=this.reduced?0:Math.sin(this.clock*.7+phase)*5;
        const dy=this.reduced?0:Math.sin(this.clock*1.3+phase)*Math.min(10,h*.025);
        this.image(this.assets.collaborationImages[kind],this.width*x+dx-size/2,h*y+dy-size/2,size,size);
      });
    }
    this.star(44,h*.465,9,'#fff2bd',this.clock*.2);this.star(354,h*.565,7,'#fff2bd');
  }
  collaborationHud(game){
    const mode=game.collaboration,x=this.width/2-146,carried=game.carry.filter(f=>Number.isInteger(f.collaborationKind)).length;
    this.round(x,12,292,51,12,mode.active?'#fff0a5':'#fffdf4','#654d35',2);
    this.image(this.assets.collaborationImages[0],x+6,16,43,43);
    this.text(mode.active?_t('フィーバー 残り {0} 秒',[Math.ceil(mode.left)]):_t('おっ！サンをHOMEへ'),x+166,28,13,'#573b23');
    this.text(`${carried}/${mode.target}`,x+166,47,14,'#573b23');
    if(mode.active&&mode.elapsed<1.5){
      const w=280,h=106,cx=this.width/2,cy=this.height*.30;
      this.round(cx-w/2,cy,w,h,14,'#fffdf4','#997335',2);
      this.image(this.assets.collaborationImages[5],cx-w/2+8,cy+8,90,90);
      this.text(_t('おっ！サン'),cx+48,cy+37,17,'#573b23');
      this.text(_t('フィーバータイム'),cx+48,cy+65,15,'#573b23');
    }
  }
  // Left column under the HUD rows: wind first, then effects; each banner takes the next slot.
  bannerRect(h=40){const hud=this.hudBox(),w=Math.min(184,this.width*.3),y=Math.max(118,this.height*.3,hud.bottom+10)+this.bannerSlot*(h+6);this.bannerSlot++;return {x:Math.max(12,hud.left),y,w,h};}
  // Bottom of the DOM HUD (score + HOME row) in canvas units, measured from layout offsets so it also works
  // when the whole game is rotated for portrait. Re-measured at most twice a second.
  hudBottom(){return this.hudBox().bottom;}
  // 50 / 100 / 150 … celebration: big outlined number, sun-burst rays and confetti (gold and longer on multiples of 100).
  milestone(value){const big=value%100===0,colors=['#ff6fae','#ffe45e','#7ee08a','#6cc8ff','#b78cff','#ffb347'];
   const confetti=this.reduced?[]:Array.from({length:big?110:70},(_,i)=>({x:Math.random()*this.width,y:-20-Math.random()*this.height*.5,vx:(Math.random()-.5)*90,vy:160+Math.random()*190,r:Math.random()*6,spin:(Math.random()-.5)*10,w:7+Math.random()*7,h:4+Math.random()*4,color:colors[i%colors.length]}));
   this.milestoneFx={value,big,age:0,life:big?2.6:1.9,confetti};}
  milestoneLayer(dt,paused){
   const m=this.milestoneFx;if(!m)return;if(!paused)m.age+=dt;if(m.age>=m.life){this.milestoneFx=null;return;}
   const c=this.ctx,cx=this.width/2,cy=this.height*.34,t=m.age,out=clamp((m.life-t)/.45,0,1),inn=clamp(t/.12,0,1);
   const pop=t<.5?1+Math.sin(Math.min(1,t/.5)*Math.PI)*.35*(1-t/.5)+(1-Math.min(1,t/.18))*-.6:1;
   c.save();
   // rays
   c.save();c.globalAlpha=.42*inn*out;c.translate(cx,cy);c.rotate(this.reduced?0:t*.6);const R=(m.big?260:210)*Math.min(1,t/.25+.2);
   for(let i=0;i<16;i++){c.fillStyle=i%2?'#fff3b0':'#ffd2e8';c.beginPath();c.moveTo(0,0);c.arc(0,0,R,i*Math.PI/8,(i+.55)*Math.PI/8);c.closePath();c.fill();}
   c.restore();
   // confetti (screen space)
   for(const p of m.confetti){if(!paused){p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.spin*dt;}c.save();c.globalAlpha=out;c.translate(p.x,p.y);c.rotate(p.r);c.fillStyle=p.color;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();}
   // number
   const size=m.big?118:96,label=String(m.value);c.globalAlpha=out;c.translate(cx,cy);c.scale(pop,pop);
   c.font=`400 ${size}px 'Mochiy Pop One', sans-serif`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   c.lineWidth=16;c.strokeStyle='#422c35';c.strokeText(label,0,6);c.strokeText(label,0,0);
   const g=c.createLinearGradient(0,-size/2,0,size/2);if(m.big){g.addColorStop(0,'#fff6a8');g.addColorStop(.5,'#ffd23f');g.addColorStop(1,'#ff9f43');}else{g.addColorStop(0,'#ffffff');g.addColorStop(1,'#ffe1f0');}
   c.fillStyle=g;c.fillText(label,0,0);
   // pill under the number
   c.font="400 20px 'Mochiy Pop One', sans-serif";const txt=_t('達成！'),w=c.measureText(txt).width+34;
   this.round(-w/2,size*.5+4,w,36,18,'#ff6fae','#422c35',3);this.text(txt,0,size*.5+23,20,'#ffffff');
   c.restore();
  }
  // Small rainbow arc used instead of the word "レインボー" on the gauge.
  rainbowIcon(x,y,r){const c=this.ctx;c.save();c.lineWidth=2.6;c.lineCap='round';['#ff6fae','#ffb347','#ffe45e','#7ee08a','#6cc8ff','#b78cff'].forEach((col,i)=>{c.strokeStyle=col;c.beginPath();c.arc(x,y,r-i*2.2,Math.PI,0);c.stroke();});c.restore();}
  // Top-centre of a DOM element in canvas units (layout offsets, so portrait rotation works too).
  elementAnchor(el){
   try{const root=this.canvas.offsetParent;if(!el||!root||!el.offsetParent)return null;let e=el,x=0,y=0;while(e&&e!==root){x+=e.offsetLeft;y+=e.offsetTop;
     // offsets ignore CSS translate (e.g. the centred skill bar); add it, but never the rotation applied above `root`.
     for(let t=e;t&&t!==e.offsetParent;t=t.parentElement){const m=getComputedStyle(t).transform;if(m&&m!=='none'){const d=new DOMMatrixReadOnly(m);x+=d.m41;y+=d.m42;}}
     e=e.offsetParent;}if(e!==root)return null;
    const kx=this.width/(this.canvas.clientWidth||1),ky=this.height/(this.canvas.clientHeight||1),cx=(x+el.offsetWidth/2-this.canvas.offsetLeft)*kx,top=(y-this.canvas.offsetTop)*ky;
    return {x:cx,y:top,cx,cy:top+el.offsetHeight*ky/2,r:Math.max(el.offsetWidth*kx,el.offsetHeight*ky)/2};}catch{return null;}
  }
  // Learn-by-playing hint (play-hints.js): a dashed pulse around the thing, and a sticker bubble pointing at it.
  hintLayer(hint){
   if(!hint)return;const c=this.ctx,tg=hint.target;let pt,r=0;
   if(tg.world){pt=this.worldToScreen(tg.world.x,tg.world.y);r=(tg.radius||26)*this.zoom;}else pt=typeof tg.screen==='function'?tg.screen():tg.screen;
   if(!pt)return;const a=clamp(Math.min(hint.age/.18,hint.left/.35),0,1),pop=hint.age<.25?.85+.15*Math.sin(hint.age/.25*Math.PI/2)+.08*Math.sin(hint.age/.25*Math.PI):1;
   c.save();c.globalAlpha=a;
   const ring=tg.world?{x:pt.x,y:pt.y,r:r+12}:pt.r?{x:pt.cx,y:pt.cy,r:pt.r+6}:null;
   if(ring){c.lineWidth=4;c.strokeStyle='#ffe278';c.setLineDash([12,9]);c.lineDashOffset=-this.clock*40;c.beginPath();c.arc(ring.x,ring.y,ring.r+Math.sin(this.clock*6)*3,0,Math.PI*2);c.stroke();c.setLineDash([]);}
   c.font="400 17px 'Mochiy Pop One', sans-serif";const w=c.measureText(hint.text).width+34,h=40,gap=14,top=Math.max(60,tg.world?this.hudBottom()+8:0);
   let below=!!tg.below,by=below?pt.y+gap:pt.y-r-(tg.lift||0)-gap-h-10;if(!below&&by<top){below=true;by=pt.y+r+gap+10;}if(tg.world&&!below)by=Math.max(top,by);
   by=Math.min(by,this.height-h-110);const bx=clamp(pt.x-w/2,14,this.width-w-14),tx=clamp(pt.x,bx+22,bx+w-22);
   c.translate(tx,below?by:by+h);c.scale(pop,pop);c.translate(-tx,-(below?by:by+h));
   c.shadowColor='#42293540';c.shadowOffsetY=4;c.shadowBlur=0;
   c.beginPath();c.roundRect(bx,by,w,h,h/2);
   if(below){c.moveTo(tx-9,by+1);c.lineTo(tx,by-11);c.lineTo(tx+9,by+1);}else{c.moveTo(tx-9,by+h-1);c.lineTo(tx,by+h+11);c.lineTo(tx+9,by+h-1);}
   c.fillStyle='#fffaf1';c.fill();c.shadowColor='transparent';c.lineWidth=3;c.strokeStyle='#422c35';c.stroke();
   c.beginPath();c.roundRect(bx+2,by+2,w-4,h-4,h/2);c.fillStyle='#fffaf1';c.fill();
   if(below){c.beginPath();c.moveTo(tx-7.5,by+3);c.lineTo(tx,by-7);c.lineTo(tx+7.5,by+3);c.fill();}else{c.beginPath();c.moveTo(tx-7.5,by+h-3);c.lineTo(tx,by+h+7);c.lineTo(tx+7.5,by+h-3);c.fill();}
   this.text(hint.text,bx+w/2,by+h/2+1,17,'#422c35');c.restore();
  }
  // Left edge of the score and bottom of the HOME row, so banners line up with the HUD and stay
  // clear of the status bar / Dynamic Island in portrait rotation.
  hudBox(){
    const now=this.clock;if(this.hudCache&&now-this.hudCache.at<.5)return this.hudCache;let bottom=0,left=0;
    try{const nav=document.querySelector('.hud .nav-row'),score=document.querySelector('.hud .score'),root=this.canvas.offsetParent,k=this.height/(this.canvas.clientHeight||1);
      const offset=(el,axis)=>{let e=el,v=0;while(e&&e!==root){v+=axis==='y'?e.offsetTop:e.offsetLeft;e=e.offsetParent;}return e===root?v:null;};
      if(nav&&root){const y=offset(nav,'y');if(y!==null)bottom=(y+nav.offsetHeight-this.canvas.offsetTop)*k;}
      if(score&&root){const x=offset(score,'x');if(x!==null)left=(x-this.canvas.offsetLeft)*this.width/(this.canvas.clientWidth||1);}}catch{}
    this.hudCache={at:now,bottom,left};return this.hudCache;
  }
  // Wind: arrows pulse during the warning, then streaks sweep across the screen while it blows.
  windLayer(game,paused){
    const w=game.wind;if(!w||w.state==='calm'||!w.kind)return;const c=this.ctx,kind=WIND_KINDS[w.kind],dir=kind.sign,head=w.kind==='head';
    const color=head?'#5b7fd6':'#ff8a3d',t=this.clock;c.save();
    if(w.state==='blow'){const strength=Math.min(1,Math.abs(w.force)/Math.max(1,w.strength));c.lineCap='round';
      for(let i=0;i<30;i++){const speed=560+(i%5)*90,len=70+(i%4)*34,y=((i*97.3)%1)*this.height*.9+this.height*.05+Math.sin(t*2+i)*8;let x=((t*speed*dir+i*233)%(this.width+len*2)+(this.width+len*2))%(this.width+len*2)-len;
        c.globalAlpha=.25+.4*strength;c.strokeStyle=i%3?'#ffffff':color;c.lineWidth=i%3?2.5:3.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dir*len*.5,y-6,x+dir*len,y);c.stroke();}}
    // banner (left side, under the score) with an arrow and a bar for the remaining time
    const warn=w.state==='warn',ratio=warn?w.left/WIND_WARN:w.left/WIND_BLOW,{x:bx,y:by,w:bw,h:bh}=this.bannerRect(34);
    c.globalAlpha=warn?.75+.25*Math.sin(t*12):1;this.round(bx,by,bw,bh,14,head?'#e8efffee':'#fff0e2ee',color,2.5);
    c.save();c.translate(bx+24,by+bh/2);c.scale(dir,1);c.fillStyle=color;c.beginPath();c.moveTo(-12,-6);c.lineTo(2,-6);c.lineTo(2,-13);c.lineTo(14,0);c.lineTo(2,13);c.lineTo(2,6);c.lineTo(-12,6);c.closePath();c.fill();c.restore();
    this.text(kind.name,bx+44,by+bh/2+1,14,color,'left',true);
    this.round(bx+bw-52,by+bh/2-4.5,42,9,4.5,'#ffffff','#00000022',1);this.round(bx+bw-52,by+bh/2-4.5,Math.max(4,42*ratio),9,4.5,color);
    c.restore();
  }
  // Active effect banners: icon, name, what it does, and a draining bar (top centre, under the rainbow gauge).
  effectBanners(game,dt,paused){
    const list=activeEffects(game);if(this.effectFlash&&!paused)this.effectFlash.life-=dt;
    list.forEach(fx=>{const {x,y,w,h}=this.bannerRect(34);
      const pop=this.effectFlash?.id===fx.id&&this.effectFlash.life>0?1+this.effectFlash.life*.3:1;const c=this.ctx;c.save();c.translate(x,y+h/2);c.scale(pop,pop);c.translate(-x,-(y+h/2));
      this.round(x,y,w,h,14,fx.fill+'f2',fx.color,2.5);this.image(this.assets[fx.icon],x+5,y+3,28,28);
      this.text(fx.short,x+40,y+h/2+1,14,fx.color,'left',true);
      this.round(x+w-58,y+h/2-4.5,48,9,4.5,'#ffffff','#00000022',1);this.round(x+w-58,y+h/2-4.5,Math.max(4,48*fx.ratio),9,4.5,fx.color);
      c.restore();});
  }
  // On the hero: a bubble for slow, sliding streaks for slip, a little cloud for fog.
  heroEffects(game){
    const c=this.ctx,p=game.player,t=this.clock;
    if(game.effects.slow>0){const r=36+Math.sin(t*6)*2.5;c.save();const g=c.createRadialGradient(p.x-10,p.y-12,4,p.x,p.y,r);g.addColorStop(0,'#ffffff55');g.addColorStop(.75,'#bfe9ff30');g.addColorStop(1,'#9fd8ff88');this.circle(p.x,p.y,r,g,'#ffffffcc',2.5);c.strokeStyle='#ffffffdd';c.lineWidth=4;c.lineCap='round';c.beginPath();c.arc(p.x,p.y,r-7,Math.PI*1.1,Math.PI*1.45);c.stroke();c.restore();}
    if(game.effects.slip>0){c.save();c.strokeStyle='#f2b84b';c.lineWidth=3;c.lineCap='round';const dir=p.vx>=0?-1:1;for(let i=0;i<3;i++){const off=(t*90+i*14)%42;c.globalAlpha=.9-off/50;c.beginPath();c.moveTo(p.x+dir*(20+off),p.y+16+i*5);c.lineTo(p.x+dir*(34+off),p.y+16+i*5);c.stroke();}c.globalAlpha=1;this.text(_t('ツルッ'),p.x,p.y+40,11,'#b9781e','center',true);c.restore();}
    if(game.effects.fog>0){c.save();c.globalAlpha=.9;const y=p.y-44+Math.sin(t*3)*2;this.circle(p.x-10,y,11,'#f4f6ff','#8a93c9',2);this.circle(p.x+4,y-5,13,'#f4f6ff','#8a93c9',2);this.circle(p.x+16,y+1,10,'#f4f6ff','#8a93c9',2);c.restore();}
  }
  draw(game,dt,title=false,paused=false){
    // Mobile rotation can finish layout after the window resize event.
    // Synchronize before painting so CSS never squeezes a stale canvas buffer.
    this.resize();
    this.reactions?.advance(dt,paused||title);
    this.collaborationEnabled=game.collaboration.enabled;game.view={x:this.camera.x,y:this.camera.y,w:this.width/this.zoom,h:this.height/this.zoom};this.stage=game.stage;if(!paused)this.clock+=dt;if(!title&&!paused)this.followCamera(game,dt);const c=this.ctx;c.save();this.scenery(game,title);if(!this.reduced&&this.shake>0&&!paused)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
    if(title)this.title();else{this.world(game,dt,paused);for(const h of game.homes)this.home(game,h,true);this.checkpointHint(game);
      if(game.effects.fog>0){c.save();c.globalAlpha=Math.min(.62,game.effects.fog*.7);for(let i=0;i<9;i++)this.circle(this.width*(i/8),this.height*(.35+(i%3)*.14),this.height*.3,'#f2f6ff');c.restore();}
      if(game.effects.paper>0){c.save();c.globalAlpha=Math.min(1,game.effects.paper*3);c.translate(this.width*.62,this.height*.43);c.rotate(-.22);this.image(this.assets.flyer,-90,-100,180,200);c.restore();}
      this.bannerSlot=0;this.windLayer(game,paused);this.effectBanners(game,dt,paused);}
    if(!title&&game.collaboration.enabled)this.collaborationHud(game);
    if(!title&&!game.collaboration.enabled&&(!game.isTraining||game.practiceStep>=6)){const active=game.powered,x=this.width/2-66,progress=Math.min(1,game.carry.length/RAINBOW_TARGET);this.round(x,12,132,37,13,active||progress===1?'#fff1ab':'#fff9e6e6','#704167',2);this.rainbowIcon(this.width/2-34,31,12);this.text(active?_t('{0}秒',[Math.ceil(game.rainbow.left)]):progress===1?'HOME!':`${game.carry.length}/${RAINBOW_TARGET}`,this.width/2-16,25,15,'#8d377c','left');this.round(x+12,39,108*(active?Math.min(1,game.rainbow.left/12):progress),4,2,'#ef64b7');}
    if(!title)this.hintLayer(this.hint);
    if(!title)this.milestoneLayer(dt,paused);
    if(this.flash>0&&!this.reduced){c.fillStyle=`rgba(255,246,207,${this.flash})`;c.fillRect(0,0,this.width,this.height);}if(!paused){this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-dt*20);this.homePulse=Math.max(0,this.homePulse-dt);}c.restore();
  }
}
