import test from 'node:test';
import assert from 'node:assert/strict';
import {MOTIONS,moveIncoming} from '../src/motions.js';
import {hazardTypes} from '../src/hazards.js';
import {AREAS} from '../src/areas.js';
import {windPlan,SKY_BREEZE} from '../src/wind.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {IncomingHazards} from '../src/incoming.js';
import {stage} from '../src/stage.js';

test('hitting the ring bounces the hero away with a short shield instead of trapping them',()=>{
  const g=new RescueGame(stage,seededRandom(2));g.start();g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.friends=[];
  const h=g.homes[0];g.player.x=h.x;g.player.y=h.y-150;g.player.vx=0;g.player.vy=200;   // falling onto the top of the ring
  let rim=false;for(let i=0;i<30&&!rim;i++){g.update(1/60);rim=g.drain().some(e=>e.type==='rim');}
  assert.ok(rim,'touched the ring');assert.ok(g.player.vy<-150,'bounced upward '+g.player.vy);assert.ok(g.cooldown>.4,'shielded');
  const hearts=g.hearts;g.hit(1,g.player);assert.equal(g.hearts,hearts,'shield blocks a hazard right after the bounce');
  for(let i=0;i<20;i++)g.update(1/60);assert.ok(g.player.y<h.y-150,'cleared the ring');
});

test('every damaging and fluffy hazard has its own readable movement; the base path stays straight',()=>{
  const moving=Object.entries(hazardTypes).filter(([,t])=>t.move);assert.ok(moving.length>=15);
  for(const [id,t] of moving){
    assert.ok(MOTIONS[t.move],id);const o={...t,asset:id,x:0,y:0,vx:-200,vy:0,size:150,angle:0};const path=[];
    for(let i=0;i<120;i++){moveIncoming(o,1/60,null);path.push([o.x,o.y,o.angle]);}
    const straight=path.every(([x,y,a],i)=>Math.abs(y)<.01&&Math.abs(a)<.01&&Math.abs(x+200*(i+1)/60)<.5);
    assert.ok(!straight,`${id} (${t.move}) should not fly perfectly straight`);
    assert.ok(o.bx<-120,`${id} still travels forward (${o.bx})`);
  }
});

test('the neon pinball star bounces off the screen edges three times, then leaves',()=>{
  const view={x:0,y:0,w:1000,h:500},o={...hazardTypes.star,asset:'star',x:500,y:250,vx:400,vy:300,size:150,angle:0,life:10};
  for(let i=0;i<60*12;i++){moveIncoming(o,1/60,view);o.life-=1/60;}
  assert.equal(o.bounced,3);assert.ok(o.x<-100||o.x>1100||o.y<-100||o.y>600,'flew away after its bounces');
  assert.equal(AREAS.find(a=>a.exclusive==='star').id,'neon');
  const g=new RescueGame(stage,seededRandom(5));g.start();g.time=120;g.incoming=new IncomingHazards();const seen=new Set();
  for(const index of [0,1,3]){g.setArea(index,false);for(let i=0;i<300;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);seen.add(g.obstacles[0].asset);}}
  assert.equal(seen.has('star'),false);g.setArea(2,false);let star=false;for(let i=0;i<400&&!star;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);star=g.obstacles[0].asset==='star';}assert.ok(star);
});

test('wind arrives gradually: calm sky, a gentle breeze from the 2nd return, stronger later',()=>{
  assert.equal(windPlan('normal',AREAS[0],0),null);assert.equal(windPlan('normal',AREAS[0],1),null);
  const breeze=windPlan('normal',AREAS[0],SKY_BREEZE.from);assert.ok(breeze&&breeze.push<AREAS[1].wind.push);
  assert.ok(AREAS[1].wind.push<AREAS[2].wind.push&&AREAS[2].wind.push<AREAS[3].wind.push);
});

test('spinning stays calm: most hazards only rock, a few turn slowly, nothing whirls',async()=>{
  const {SPIN_CHANCE,SPIN_MAX}=await import('../src/motions.js');
  for(const [id,t] of Object.entries(hazardTypes).filter(([,t])=>t.move)){
    for(const spinning of [false,true]){
      const o={...t,asset:id,x:0,y:0,vx:-200,vy:0,size:150,angle:0,spinning,seed:1};let prev=0,maxRate=0,maxAngle=0;
      for(let i=0;i<180;i++){moveIncoming(o,1/60,null);if(!o.directed){maxRate=Math.max(maxRate,Math.abs(o.angle-prev)*60);maxAngle=Math.max(maxAngle,Math.abs(o.angle));prev=o.angle;}}
      assert.ok(maxRate<=SPIN_MAX+.6,`${id} turns at ${maxRate.toFixed(2)} rad/s`);
      if(!spinning&&!MOTIONS[t.move].always)assert.ok(maxAngle<=.55,`${id} only rocks (max ${maxAngle.toFixed(2)})`);
    }
  }
  assert.ok(SPIN_CHANCE<=.25);
  const g=new RescueGame(stage,seededRandom(9));g.start();g.time=120;g.incoming=new IncomingHazards();let spin=0,n=0;
  for(let i=0;i<400;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);const o=g.obstacles[0];if(MOTIONS[o.move]?.spin&&!MOTIONS[o.move].always){n++;if(o.spinning)spin++;}}
  assert.ok(n>50&&spin/n<.3,`${spin}/${n} spinners turn`);
});

test('lightning glides smoothly (no jumps between frames)',()=>{
  const o={...hazardTypes.lightning,asset:'lightning',x:0,y:0,vx:-200,vy:0,size:150,angle:0};let py=0,jump=0;
  for(let i=0;i<240;i++){moveIncoming(o,1/60,null);jump=Math.max(jump,Math.abs(o.y-py));py=o.y;}
  assert.ok(jump<2,`max per-frame sideways step ${jump.toFixed(2)}px`);
});

test('arrival speed is random: about a quarter come in slowly, the rest vary a little',async()=>{
  const {SLOW_CHANCE}=await import('../src/incoming.js');
  const g=new RescueGame(stage,seededRandom(13));g.start();g.time=120;g.incoming=new IncomingHazards();const paces=[];
  for(let i=0;i<600;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);paces.push(g.obstacles[0].pace);}
  const slow=paces.filter(p=>p<.8).length/paces.length;
  assert.ok(Math.abs(slow-SLOW_CHANCE)<.07,`slow share ${slow}`);assert.ok(Math.min(...paces)>=.55&&Math.max(...paces)<=1.1);
  assert.ok(paces.filter(p=>p>=.9).length>paces.length*.6);
});
