import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
const make=()=>{const g=new RescueGame(stage,seededRandom(7));g.manualSkills=true;g.start();g.friends=[];g.homes=[];g.obstacles=[];g.world.extend=()=>{};g.incoming.update=()=>{};return g;};
const add=(g,kind,n=3)=>{for(let i=0;i<n;i++)g.rescue(g.spawnFriend({x:g.player.x+60,y:g.player.y,kind}));};
const cast=(g,kind)=>{assert.equal(g.activateSkill(kind),true);for(let i=0;i<73;i++)g.update(1/120);};
test('charges by color, caps at three, never charges a lost individual twice, resets each run',()=>{
 const g=make();add(g,0,4);add(g,2,1);assert.deepEqual(g.skillCharge,[3,0,1,0]);assert.equal(g.score,0);
 g.skillCharge[0]=0;g.hit(3);for(const f of [...g.friends]){f.cooldown=0;g.rescue(f);}assert.equal(g.skillCharge[0],0);
 g.start();assert.deepEqual(g.skillCharge,[0,0,0,0]);assert.equal(g.activateSkill(2),false);
});
test('cutin freezes simulation, rejects repeat activation and flaps, then starts five-second phase',()=>{
 const g=make();add(g,0);const {x,y,vy}=g.player,time=g.time;assert.ok(g.activateSkill(0));assert.equal(g.activateSkill(0),false);g.flap();
 for(let i=0;i<60;i++)g.update(1/120);
 assert.equal(g.time,time);assert.equal(g.player.x,x);assert.equal(g.player.y,y);assert.equal(g.player.vy,vy);
 while(g.skillCutin)g.update(1/120);assert.equal(g.phaseLeft,5);assert.equal(g.carry.length,3);
 g.cooldown=0;g.hit(3,g.player);assert.equal(g.carry.length,3);for(let i=0;i<601;i++)g.update(1/120);assert.equal(g.phaseLeft,0);
});
test('phase passes through obstacle collisions and nuisance effects without deflection',()=>{
 const g=make();g.skillLeft[0]=3;g.phaseLeft=3;const p=g.player;g.obstacles=[{x:p.x,y:p.y,baseX:p.x,baseY:p.y,r:90,damage:3,phase:0,disabled:0},{x:p.x,y:p.y,baseX:p.x,baseY:p.y,r:90,effect:'fog',duration:2,phase:0,disabled:0}];
 g.update(1/120);assert.equal(g.effects.fog,0);assert.ok(p.vx>0);assert.equal(g.hearts,3);
});
test('manual guard blocks repeated fatal hard hits for five seconds with its own event',()=>{
 const g=make();g.start('hard');add(g,1);cast(g,1);g.drain();g.cooldown=0;g.hit(3,g.player);assert.deepEqual(g.drain().map(e=>e.type),['guardBlock']);assert.equal(g.state,'playing');assert.equal(g.carry.length,3);assert.equal(g.skillGuard,true);
 g.cooldown=0;g.hit(3,g.player);assert.equal(g.state,'playing');for(let i=0;i<601;i++)g.update(1/120);assert.equal(g.skillGuard,false);g.cooldown=0;g.hit(3,g.player);assert.equal(g.state,'ending');
});
test('red clears only nearby obstacles without score or companion loss',()=>{
 const g=make();add(g,2);g.obstacles=[{x:g.player.x+100,y:g.player.y,asset:'rocket'},{x:g.player.x+900,y:g.player.y,asset:'apple'}];cast(g,2);assert.equal(g.obstacles.length,1);assert.equal(g.obstacles[0].asset,'apple');assert.equal(g.score,0);assert.equal(g.carry.length,3);
});
test('purple collects at most three nearest friends without charging skills or banking points',()=>{
 const g=make();add(g,3);for(let i=0;i<5;i++)g.spawnFriend({x:g.player.x+100+i*20,y:g.player.y,kind:3});cast(g,3);assert.equal(g.carry.length,6);assert.equal(g.friends.length,2);assert.equal(g.skillCharge[3],0);assert.equal(g.score,0);g.beginReturn();assert.equal(g.score,6);
});
test('training and inactive games cannot activate, ready guards cannot stack',()=>{
 const g=make();add(g,1);g.isTraining=true;assert.equal(g.activateSkill(1),false);g.isTraining=false;cast(g,1);add(g,1);assert.equal(g.activateSkill(1),false);g.finish();assert.equal(g.activateSkill(1),false);
});

test('red and purple keep affecting new targets, then expire',()=>{
 for(const kind of [2,3]){
  const g=make();add(g,kind);cast(g,kind);
  const target=()=>{if(kind===2)g.obstacles.push({x:g.player.x+200,y:g.player.y,baseX:g.player.x+200,baseY:g.player.y,r:20,phase:0,disabled:0});else g.spawnFriend({x:g.player.x+200,y:g.player.y,kind:0});};
  target();const carried=g.carry.length;
  for(let i=0;i<125;i++){g.player.vy=-820/120;g.update(1/120);}
  if(kind===2)assert.equal(g.obstacles.length,0);else assert.ok(g.carry.length>carried);
  while(g.skillLeft[kind]>0)g.update(1/120);
  target();const count=kind===2?g.obstacles.length:g.carry.length;
  g.update(1/120);assert.equal(kind===2?g.obstacles.length:g.carry.length,count);
 }
});
test('active skill time freezes during another cutin and reset clears every duration',()=>{
 const g=make();add(g,0);cast(g,0);add(g,2);g.activateSkill(2);const left=g.skillLeft[0];
 for(let i=0;i<30;i++)g.update(1/120);assert.equal(g.skillLeft[0],left);
 g.start();assert.deepEqual(g.skillLeft,[0,0,0,0]);assert.equal(g.skillGuard,false);
});
