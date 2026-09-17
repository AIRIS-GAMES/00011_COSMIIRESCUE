import test from 'node:test';
import assert from 'node:assert/strict';
import {checkpointRimContact} from '../src/checkpoint.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
test('opening flight with regular taps gets past the first ring without repeated catches',()=>{
  const g=new RescueGame(stage,seededRandom(4));g.start();
  g.incoming.update=()=>{};
  let rimContacts=0;
  for(let i=0;i<600;i++){
    if(i%96===0)g.flap();
    g.update(1/120);
    rimContacts+=g.drain().filter(e=>e.type==='rim').length;
  }
  assert.ok(rimContacts<=1);
  assert.ok(g.player.x>g.homes[0].x+160);
});
test('ring rim is solid while the central flight opening stays clear',()=>{const h={x:500,y:500};assert.ok(checkpointRimContact({x:500,y:370,r:17},h));assert.ok(checkpointRimContact({x:580,y:600,r:17},h));assert.equal(checkpointRimContact({x:500,y:500,r:17},h),false);assert.equal(checkpointRimContact({x:900,y:500,r:17},h),false);});
test('banked friends attach to the checkpoint that received them',()=>{const g=new RescueGame(stage,seededRandom(4));g.start();const h=g.stage.home;for(const f of g.friends.slice(0,8))g.rescue(f);g.beginReturn();g.stage.home={x:8000,y:5000};while(g.bankQueue.length)g.bankOne();assert.equal(h.attached.length,8);assert.equal(g.rescued,8);assert.ok(h.attached.every(f=>Math.hypot(f.x,f.y)>100));});
