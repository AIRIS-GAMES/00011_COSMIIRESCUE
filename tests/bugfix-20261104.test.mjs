import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionHazards,hazardTypes} from '../src/hazards.js';
import {RescueGame,seededRandom,distance} from '../src/engine.js';
import {TrainingGame} from '../src/training-game.js';
import {stage} from '../src/stage.js';

test('hazards above or left of the start area always have art and stats',()=>{
  for(const row of [-7,-3,-2,-1,0,2])for(const col of [-4,-1,0,1,5]){
    for(const o of sectionHazards(col,row,true)){assert.ok(hazardTypes[o.asset],`${col}:${row} ${o.id}`);}
  }
});

test('timed friends loaded with a chunk are not spawned a second time on top of themselves',()=>{
  const g=new RescueGame(stage,seededRandom(7));g.start();const spawn=g.spawnFriend.bind(g);let stacked=0;
  g.spawnFriend=s=>{if(s.after&&g.friends.some(f=>distance(f,s)<5))stacked++;return spawn(s);};
  for(let t=0;t<90*60;t++){g.direction=1;if(t%20===0)g.flap();g.hearts=99;g.update(1/60);}
  assert.equal(stacked,0);
});

test('practice obstacles never cost lives or carried friends',()=>{
  const g=new TrainingGame();g.startPractice();const hearts=g.hearts;
  for(let i=0;i<5;i++){g.cooldown=0;g.phaseLeft=0;g.rescued=1;g.time=120;g.hit(3,g.player);}
  assert.equal(g.hearts,hearts);assert.equal(g.state,'playing');
});
