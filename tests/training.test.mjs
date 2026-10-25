import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingGame} from '../src/training-game.js';
test('practice advances through real movement, flap, contact rescue and ring crossing',()=>{
 const g=new TrainingGame();g.startPractice();const visited=new Set(),events=[];
 for(let i=0;i<2400&&g.practiceStep<4;i++){
  visited.add(g.practiceStep);
  if(g.practiceStep===0)g.setDirection(g.leftDone?1:-1);
  else if(g.practiceStep===1)g.flap();
  else{const target=g.practiceStep===2?g.friends[0]:g.stage.home;g.setDirection(target.x>g.player.x?1:-1);if(g.player.y>target.y-10&&g.player.vy>=0)g.flap();}
  g.update(1/120);events.push(...g.drain());
 }
 assert.deepEqual([...visited],[0,1,2,3]);assert.equal(g.practiceStep,4);assert.equal(g.rescued,1);assert.equal(events.filter(e=>e.type==='return').length,1);assert.equal(g.onCheckpoint,undefined);assert.equal(g.collaboration.enabled,false);
 const time=g.time;g.update(1);assert.equal(g.time,time);g.startPractice();assert.equal(g.practiceStep,0);assert.equal(g.score,0);assert.equal(g.leftTravel,0);
});
test('practice requires input and safely recovers without losing a rescued buddy',()=>{
 const g=new TrainingGame();g.startPractice();for(let i=0;i<600;i++)g.update(1/120);assert.equal(g.practiceStep,0);assert.equal(g.player.y,650);
 g.enterStep(1);for(let i=0;i<600;i++)g.update(1/120);assert.equal(g.practiceStep,1);assert.ok(g.recoveries>0);assert.equal(g.hearts,3);
 g.enterStep(2);g.rescue(g.friends[0]);g.player.y=1000;g.update(1/120);assert.equal(g.carry.length,1);assert.equal(g.practiceStep,3);assert.equal(g.player.y,650);assert.equal(g.obstacles.length,0);
});
