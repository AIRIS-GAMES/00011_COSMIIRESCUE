import {biomes,drawBiome} from './biomes.js';
import {canvasResolution,smoothImages} from './canvas-resolution.js';
import {eyeBeams,RAINBOW_TARGET} from './rainbow.js';
import {VIEW_W,clamp,distance} from './engine.js';
import {friends as characterInfo} from './characters.js';
export class Renderer {
  constructor(canvas,assets,stage){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;this.stage=stage;this.width=VIEW_W;this.height=768;this.zoom=.9;this.camera={x:-35,y:200};this.clock=0;this.particles=[];this.popups=[];this.deliveries=[];this.bursts=[];this.fragments=[];this.shake=0;this.flash=0;this.homePulse=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.resize();}
  resize(){const width=this.canvas.clientWidth,height=this.canvas.clientHeight;if(!width||!height)return;this.height=VIEW_W*height/width;const pixels=canvasResolution(width,height,devicePixelRatio||1);this.canvas.width=pixels.width;this.canvas.height=pixels.height;this.ctx.setTransform(pixels.width/VIEW_W,0,0,pixels.height/this.height,0,0);smoothImages(this.ctx);}
  screenToWorld(x,y){return {x:x/this.zoom+this.camera.x,y:y/this.zoom+this.camera.y};}
  worldToScreen(x,y){return {x:(x-this.camera.x)*this.zoom,y:(y-this.camera.y)*this.zoom};}
  snap(game){this.followCamera(game,1,true);this.particles=[];this.popups=[];this.deliveries=[];this.bursts=[];this.fragments=[];}
  followCamera(game,dt,snap=false){const x=game.player.x-this.width*.43/this.zoom,y=game.player.y-this.height*.5/this.zoom,t=snap?1:1-Math.exp(-9*dt);this.camera.x+=(x-this.camera.x)*t;this.camera.y+=(y-this.camera.y)*t;}


  round(x,y,w,h,r,fill,stroke=null,width=1.5){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/2,h/2));c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  circle(x,y,r,fill,stroke=null,width=1.5){const c=this.ctx;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  star(x,y,r,fill,angle=0){const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.33:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.restore();}
  image(img,x,y,w,h=w){if(!img)return;const scale=Math.min(w/img.width,h/img.height),iw=img.width*scale,ih=img.height*scale;this.ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
  text(text,x,y,size=14,color='#335343',align='center',outline=false){const c=this.ctx;c.font=`800 ${size}px Outfit, 'Noto Sans JP', sans-serif`;c.textAlign=align;c.textBaseline='middle';if(outline){c.lineWidth=4;c.strokeStyle='#fffbea';c.strokeText(text,x,y);}c.fillStyle=color;c.fillText(text,x,y);}
  burst(x,y,count,colors=['#fff2c5','#b9e4a1','#ffaec7'],force=130){for(let i=0;i<(this.reduced?Math.ceil(count/3):count);i++){const a=Math.random()*6.28,s=force*(.2+Math.random());this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+Math.random()*.6,size:2+Math.random()*5,color:colors[i%colors.length],star:i%3===0});}if(this.particles.length>220)this.particles.splice(0,this.particles.length-220);}
  popup(text,x,y,color='#3c6448',size=19){this.popups.push({text,x,y,color,size,life:1.2});}
  event(e){
    if(e.type==='collaborationStart')this.shake=3;
    if(e.type==='rainbowStart'){this.burst(e.x,e.y,65,['#ff75c7','#ffe45e','#8dffbc','#85dcff'],250);this.popup('RAINBOW MODE!',e.x,e.y-65,'#bc32a0',27);this.shake=5;}
    if(e.type==='blood'&&!this.collaborationEnabled){
      const count=this.reduced?3:8+Math.min(3,e.damage||1);
      for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=55+Math.random()*100;this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,life:.3+Math.random()*.2,size:3+Math.random()*2,color:i%2?'#d9364d':'#a81f36',star:false,blood:true});}
    }
    if(e.type==='flap')this.burst(e.x,e.y+16,6,['#faffdd','#bbdd88'],40);
    if(e.type==='turn'){this.burst(e.x,e.y,10,['#fff4cf','#c4edaa'],95);this.popup('SWOOSH!',e.x,e.y-37,'#749060',12);}
    if(e.type==='rescue'){this.bursts.push({x:e.x,y:e.y,color:characterInfo[e.kind].color,life:.32,r:55});this.burst(e.x,e.y,22,[characterInfo[e.kind].color,'#fff4c8','#b8df9a'],150);if(!Number.isInteger(e.collaborationKind))this.popup('POP!',e.x,e.y-29,'#bb6d73',21);}
    if(e.type==='return'){this.bursts.push({x:e.x,y:e.y,color:'#ff5f82',life:.65,r:155});this.homePulse=1.5;this.burst(e.x,e.y,Math.min(70,e.count*10),['#fff4c3','#ffc4db','#a8dfa7'],210);this.popup(`${e.count} ${this.collaborationEnabled?'RESCUED':'COSMII!'}`,e.x,e.y-90,'#538d4a',27);}
    if(e.type==='bank'){this.deliveries.push({x:e.x,y:e.y,startX:e.x,startY:e.y,homeX:e.homeX,homeY:e.homeY,kind:e.kind,collaborationKind:e.collaborationKind,life:.5});this.popup(`+${e.points}`,e.homeX+45,e.homeY-30,'#b98431',20);}
    if(e.type==='lost'){this.burst(e.x,e.y,14,['#ffb2bc','#fff2e0'],160);this.popup(`−${e.count||1}`,e.x,e.y-35,'#b26d76',15);this.shake=5;}
    if(e.type==='hinder'){this.burst(e.x,e.y,12,['#c3f4ff','#fff7db'],90);this.popup({fog:'CLOUD',slow:'SLOW',paper:'!',slip:'SLIP'}[e.effect],e.x,e.y-35,'#747bbe',14);}
    if(e.type==='rim'){this.burst(e.x,e.y,8,['#fff4cf','#ffaacb'],80);this.shake=2;}
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
    if(front)for(const f of h.attached||[]){if(game.time<f.showAt)continue;const size=43*this.zoom;this.image(this.friendImage(f),s.x+f.x*this.zoom-size/2,s.y+f.y*this.zoom-size/2,size,size);}
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
    c.rotate(Math.sin(this.clock*4+f.phase)*.075);this.image(this.assets.friends[f.kind],-28,-28,56,56);
    c.restore();
  }
  world(game,dt,paused){const c=this.ctx;
    for(const zone of game.activeZones){const s=this.worldToScreen(zone.x,zone.y);c.save();c.globalAlpha=.16;this.round(s.x,s.y,zone.w*this.zoom,zone.h*this.zoom,20,'#fff4c6');c.restore();this.text('↗ SPEED LANE ↗',s.x+zone.w*this.zoom/2,s.y+20,12,'#b48e4c');}
    for(const h of game.homes)this.home(game,h);
    for(const p of this.stage.props.filter(p=>p.layer==='world'&&!p.id.startsWith('home-')))this.prop(p);
    c.save();c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    for(const o of game.obstacles){if(!o.asset)continue;c.save();if(o.disabled)c.globalAlpha=.17;
      if(o.motion){c.save();c.globalAlpha=.15;c.strokeStyle='#c07768';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(o.baseX-o.motion.x,o.baseY-o.motion.y);c.lineTo(o.baseX+o.motion.x,o.baseY+o.motion.y);c.stroke();c.restore();}
      if(o.r){const size=o.size||(o.r+12)*2;c.translate(o.x,o.y);c.rotate(o.angle||0);this.image(this.assets[o.asset],-size/2,-size/2,size,size);}else c.drawImage(this.assets[o.asset],o.x,o.y,o.w,o.h);c.restore();}
    
    for(const f of game.friends)this.friend(f);
    if(game.target&&distance(game.target,game.player)>45){c.save();c.globalAlpha=.45;c.strokeStyle='#fafbd7';c.lineWidth=2;c.beginPath();c.arc(game.target.x,game.target.y,12+Math.sin(this.clock*5)*2,0,6.28);c.stroke();c.restore();}

    for(let i=game.carry.length-1;i>=0;i--)this.friend(game.carry[i],true,i);
    const p=game.player;
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);if(game.cooldown>0&&Math.sin(this.clock*25)<0)c.globalAlpha=.45;
    if(p.tap>0){const v=Math.sin(p.tap/.28*Math.PI)*.07;c.scale(1+v,1-v);}const frame=!game.powered&&p.tap>0&&this.assets.flapFrames?this.assets.flapFrames[Math.min(3,Math.floor((.28-p.tap)/.07))]:this.assets.hero;this.image(frame,-38,-38,76,76);c.restore();
    if(game.powered){
      c.save();c.lineCap='round';
      for(const beam of eyeBeams(game)){const endX=beam.x+beam.dx*beam.length,endY=beam.y+beam.dy*beam.length;
        for(const [width,color] of [[22,'#fa56bd88'],[12,'#72eaff'],[5,'#fffbea']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(beam.x,beam.y);c.lineTo(endX,endY);c.stroke();}
        this.star(beam.x,beam.y,8,'#fff8aa',this.clock*2);
      }c.restore();
    }
    if(Math.hypot(p.vx,p.vy)>60&&!paused&&Math.random()<.45)this.burst(p.x-p.vx*.1,p.y-p.vy*.1,1,['#fffadc','#cceaa9'],15);
    for(const d of this.deliveries){if(!paused)d.life-=dt;const t=clamp(1-d.life/.5,0,1),ease=1-(1-t)**3;d.x=d.startX+(d.homeX-d.startX)*ease;d.y=d.startY+(d.homeY-d.startY)*ease;c.globalAlpha=this.collaborationEnabled&&Number.isInteger(d.collaborationKind)?1:1-t*.5;const size=50*(1-t*.14);this.image(this.friendImage(d),d.x-size/2,d.y-size/2,size,size);}c.globalAlpha=1;this.deliveries=this.deliveries.filter(d=>d.life>0);
    for(const b of this.bursts){if(!paused)b.life-=dt;c.save();c.globalAlpha=clamp(b.life*3,0,1);c.translate(b.x,b.y);const radius=b.r*(1.25-b.life*.6);c.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?radius*.65:radius;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.lineWidth=4;c.strokeStyle=b.color;c.stroke();c.restore();}this.bursts=this.bursts.filter(b=>b.life>0);
    for(const f of this.fragments){if(!paused){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=320*dt;f.angle+=f.spin*dt;}c.save();c.globalAlpha=clamp(f.life*3,0,1);c.translate(f.x,f.y);c.rotate(f.angle);c.drawImage(f.img,f.sx,f.sy,f.sw,f.sh,-f.w/2,-f.h/2,f.w,f.h);c.restore();}this.fragments=this.fragments.filter(f=>f.life>0);
    for(const part of this.particles){if(!paused){part.life-=dt;part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=90*dt;}c.globalAlpha=clamp(part.life*2,0,1);if(part.star)this.star(part.x,part.y,part.size,part.color,part.life*2);else this.circle(part.x,part.y,part.size*.65,part.color);}c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.popups){if(!paused){p.life-=dt;p.y-=22*dt;}c.globalAlpha=clamp(p.life*2,0,1);this.text(p.text,p.x,p.y,p.size,p.color,'center',true);}c.globalAlpha=1;this.popups=this.popups.filter(p=>p.life>0);c.restore();
    for(const p of this.stage.props.filter(p=>p.layer==='foreground'))this.prop(p,1.12);
  }
  checkpointHint(game){const h=game.stage.home;if(distance(game.player,h)>900)return;const s=this.worldToScreen(h.x,h.y),c=this.ctx;
    if(s.x>90&&s.x<this.width-90&&s.y>100&&s.y<this.height-100)return;
    const x=clamp(s.x,90,this.width-90),y=clamp(s.y,100,this.height-105),angle=Math.atan2(s.y-y,s.x-x);
    c.save();c.translate(x,y);const pulse=1+Math.sin(this.clock*5)*.07;c.scale(pulse,pulse);this.image(this.assets.home,-27,-27,54,54);c.rotate(angle);c.beginPath();c.moveTo(37,-10);c.lineTo(51,0);c.lineTo(37,10);c.strokeStyle='#fff4a5';c.lineWidth=5;c.lineJoin='round';c.stroke();c.restore();
  }

  title(){const c=this.ctx,h=this.height;
const center=this.width*.51,scale=Math.min(.88,h/390);const positions=[[0,0],[-48,-56],[49,-58],[63,18],[40,85],[-44,80],[-65,15]].map(([x,y])=>({x:center+x*scale,y:h*.55+y*scale}));
    c.save();c.strokeStyle='#fff5d590';c.lineWidth=3;c.setLineDash([4,7]);c.beginPath();for(const [i,p] of positions.entries()){if(!i)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);}c.stroke();c.restore();
    positions.forEach((p,i)=>{const size=(i===0?97:67)*scale,y=p.y+(this.reduced?0:Math.sin(this.clock*2.5-i*.7)*7*scale);c.save();c.translate(p.x,y);c.rotate(Math.sin(this.clock*1.5-i)*.07);this.image(i?this.assets.friends[(i-1)%4]:this.assets.hero,-size/2,-size/2,size,size);c.restore();});
    if(this.collaborationEnabled){const size=Math.min(76,h*.19);this.image(this.assets.collaborationImages[0],this.width*.60-size/2,h*.82-size/2,size,size);}
    this.star(44,h*.465,9,'#fff2bd',this.clock*.2);this.star(354,h*.565,7,'#fff2bd');
  }
  collaborationHud(game){
    const mode=game.collaboration,x=this.width/2-146,carried=game.carry.filter(f=>Number.isInteger(f.collaborationKind)).length;
    this.round(x,12,292,51,12,mode.active?'#fff0a5':'#fffdf4','#654d35',2);
    this.image(this.assets.collaborationImages[0],x+6,16,43,43);
    this.text(mode.active?`フィーバー 残り ${Math.ceil(mode.left)} 秒`:'おっ！サンをHOMEへ',x+166,28,13,'#573b23');
    this.text(`${carried}/${mode.target}`,x+166,47,14,'#573b23');
    if(mode.active&&mode.elapsed<1.5){
      const w=280,h=106,cx=this.width/2,cy=this.height*.30;
      this.round(cx-w/2,cy,w,h,14,'#fffdf4','#997335',2);
      this.image(this.assets.collaborationImages[5],cx-w/2+8,cy+8,90,90);
      this.text('おっ！サン',cx+48,cy+37,17,'#573b23');
      this.text('フィーバータイム',cx+48,cy+65,15,'#573b23');
    }
  }
  draw(game,dt,title=false,paused=false){this.collaborationEnabled=game.collaboration.enabled;game.view={x:this.camera.x,y:this.camera.y,w:this.width/this.zoom,h:this.height/this.zoom};this.stage=game.stage;if(!paused)this.clock+=dt;if(!title&&!paused)this.followCamera(game,dt);const c=this.ctx;c.save();this.scenery(game,title);if(!this.reduced&&this.shake>0&&!paused)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
    if(title)this.title();else{this.world(game,dt,paused);for(const h of game.homes)this.home(game,h,true);this.checkpointHint(game);
      if(game.effects.fog>0){c.save();c.globalAlpha=Math.min(.62,game.effects.fog*.7);for(let i=0;i<9;i++)this.circle(this.width*(i/8),this.height*(.35+(i%3)*.14),this.height*.3,'#f2f6ff');c.restore();}
      if(game.effects.paper>0){c.save();c.globalAlpha=Math.min(1,game.effects.paper*3);c.translate(this.width*.62,this.height*.43);c.rotate(-.22);this.image(this.assets.flyer,-90,-100,180,200);c.restore();}
      if(game.effects.slow>0)this.text('SLOW',this.width*.5,75,15,'#758ac6','center',true);
      if(game.effects.slip>0)this.text('SLIP',this.width*.5,95,15,'#b98967','center',true);}
    if(!title&&game.collaboration.enabled)this.collaborationHud(game);
    if(!title&&!game.collaboration.enabled){const active=game.powered,x=this.width/2-92,progress=Math.min(1,game.carry.length/RAINBOW_TARGET);this.round(x,12,184,37,13,active||progress===1?'#fff1ab':'#fff9e6e6','#704167',2);this.text(active?`RAINBOW ${Math.ceil(game.rainbow.left)}s`:progress===1?'HOME → RAINBOW':`RAINBOW ${game.carry.length}/${RAINBOW_TARGET}`,this.width/2,26,12,'#8d377c');this.round(x+12,39,160*(active?Math.min(1,game.rainbow.left/12):progress),4,2,'#ef64b7');}
    if(this.flash>0&&!this.reduced){c.fillStyle=`rgba(255,246,207,${this.flash})`;c.fillRect(0,0,this.width,this.height);}if(!paused){this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-dt*20);this.homePulse=Math.max(0,this.homePulse-dt);}c.restore();
  }
}
