import test from 'node:test';
import assert from 'node:assert/strict';
import {Wind,windPlan,WIND_WARN,WIND_BLOW} from '../src/wind.js';
import {AREAS} from '../src/areas.js';
import {activeEffects,EFFECTS} from '../src/effects.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {TrainingGame} from '../src/training-game.js';
import {hazardTypes} from '../src/hazards.js';
import {stage} from '../src/stage.js';

const quiet=(mode='normal')=>{const g=new RescueGame(stage,seededRandom(8));g.start(mode);g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];g.obstacles=[];g.friends=[];g.cooldown=999;return g;};

test('no wind in the NORMAL sky; later areas gust more often and harder; HARD adds wind everywhere',()=>{
  assert.equal(windPlan('normal',AREAS[0]),null);assert.ok(windPlan('hard',AREAS[0]));
  const plans=AREAS.slice(1).map(a=>windPlan('normal',a));
  for(let i=1;i<plans.length;i++){assert.ok(plans[i].push>plans[i-1].push);assert.ok(plans[i].every[1]<plans[i-1].every[1]);}
  const hard=windPlan('hard',AREAS[2]),normal=windPlan('normal',AREAS[2]);assert.ok(hard.push>normal.push&&hard.every[0]<normal.every[0]);
});

test('a gust is announced, blows, then calms; events fire once each and the push eases in',()=>{
  const g=quiet();g.setArea(2,false);g.wind.left=.01;const seen=[];let force=[];
  for(let i=0;i<Math.ceil((WIND_WARN+WIND_BLOW+.5)*60);i++){g.wind.update(g,1/60);force.push(g.wind.force);for(const e of g.drain())if(e.type.startsWith('wind'))seen.push(e.type+':'+e.kind);}
  const kind=seen[0].split(':')[1];assert.deepEqual(seen,['windWarn','windStart','windEnd'].map(t=>t+':'+kind));
  const blowing=force.filter(f=>f!==0),peak=Math.max(...blowing.map(Math.abs));
  assert.ok(Math.abs(blowing[0])<peak*.2);assert.ok(Math.abs(blowing.at(-1))<peak*.2);assert.equal(Math.sign(blowing[5]),kind==='head'?-1:1);
  assert.equal(g.wind.state,'calm');assert.ok(g.wind.left>=12);
});

test('a headwind slows forward flight and a tailwind speeds it up',()=>{
  const fly=kind=>{const g=quiet();g.setArea(3,false);g.setDirection(1);if(kind){g.wind.state='blow';g.wind.kind=kind;g.wind.strength=135;g.wind.left=WIND_BLOW/2;}for(let i=0;i<90;i++){g.wind.left=WIND_BLOW/2;g.update(1/60);}return g.player.vx;};
  const calm=fly(null),head=fly('head'),tail=fly('tail');assert.ok(head<calm-100,`${head} vs ${calm}`);assert.ok(tail>calm+100,`${tail} vs ${calm}`);
});

test('practice and the NORMAL sky never get wind',()=>{
  const t=new TrainingGame();t.startPractice();t.setArea(3,false);for(let i=0;i<60*40;i++)t.wind.update(t,1/60);assert.equal(t.wind.state,'calm');
  const g=quiet();for(let i=0;i<60*40;i++)g.wind.update(g,1/60);assert.equal(g.wind.state,'calm');assert.equal(g.drain().filter(e=>e.type.startsWith('wind')).length,0);
});

test('effect hazards never hurt; they show which item caused them and how long is left',()=>{
  for(const id of ['cloud','bubble','flyer','drink','banana']){
    const g=quiet();g.cooldown=0;const t=hazardTypes[id],p=g.player;g.obstacles=[{...t,asset:id,id:'x',x:p.x,y:p.y,baseX:p.x,baseY:p.y,r:40,size:130,vx:0,vy:0,incoming:true,life:5,disabled:0,phase:0}];
    g.rescue(g.spawnFriend({x:p.x,y:p.y,kind:0}));g.update(1/120);
    assert.equal(g.hearts,3,id);assert.equal(g.carry.length,1,id);
    const [fx]=activeEffects(g);assert.equal(fx.id,t.effect,id);assert.equal(fx.icon,id);assert.ok(fx.ratio>.95&&fx.ratio<=1,id);assert.equal(fx.name,EFFECTS[t.effect].name);
    for(let i=0;i<60;i++)g.update(1/60);assert.ok(activeEffects(g).every(f=>f.ratio<1),id);
  }
  const g=quiet();assert.deepEqual(activeEffects(g),[]);
});

test('slip makes stopping noticeably harder than normal steering',()=>{
  const stop=slip=>{const g=quiet();g.player.vx=310;if(slip){g.effects.slip=3;g.effectMax.slip=3;}g.setDirection(-1);for(let i=0;i<12;i++)g.update(1/60);return g.player.vx;};
  assert.ok(stop(true)>stop(false)+150);
});
