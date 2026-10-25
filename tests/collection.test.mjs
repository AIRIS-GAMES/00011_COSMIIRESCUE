import test from 'node:test';
import assert from 'node:assert/strict';
import {characterCollection,CHARACTER_UNLOCK_COUNTS} from '../src/collection.js';
import {PsfProgress} from '../src/psf.js';
import {RescueGame} from '../src/engine.js';
import {stage} from '../src/stage.js';
test('green starts open; each collection memorial completes exactly at its delivered threshold',()=>{
 assert.equal(characterCollection('green').unlocked,true);
 for(const [i,id] of ['pink','blue','red','purple'].entries()){const counts=[0,0,0,0];counts[i]=CHARACTER_UNLOCK_COUNTS[id]-1;assert.equal(characterCollection(id,{counts}).achieved,false);assert.equal(characterCollection(id,{counts}).unlocked,false);counts[i]++;assert.equal(characterCollection(id,{counts}).achieved,true);assert.equal(characterCollection(id,{counts}).unlocked,true);}
});
test('old progress retains character counts and new item pickups persist exactly once',()=>{
 const m=new Map([['cosmii-psf-v1',JSON.stringify({counts:[10,5,20,30]})]]),s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)},p=new PsfProgress(s);
 assert.equal(characterCollection('blue',p.data).unlocked,true);assert.equal(p.collect('run',1,'apple'),true);assert.equal(new PsfProgress(s).collect('run',1,'apple'),false);assert.equal(new PsfProgress(s).data.items.apple,1);assert.equal(p.collect('run',2,'unknown'),false);
});
test('normal items spawn, collect on actual contact once, without points or life changes',()=>{
 const g=new RescueGame(stage);g.start();g.psfRules=true;g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.homes=[];g.friends=[];g.itemClock=12;g.update(.01);assert.equal(g.items.length,1);const item=g.items[0];g.player.x=item.x;g.player.y=item.y;g.update(.01);g.update(.01);assert.equal(g.drain().filter(e=>e.type==='itemCollected').length,1);assert.equal(g.score,0);assert.equal(g.hearts,3);
});
test('HARD and practice do not spawn collection items; blocked saves still collect',()=>{
 for(const mode of ['hard','normal']){const g=new RescueGame(stage);g.start(mode);g.psfRules=true;g.isTraining=mode==='normal';g.itemClock=12;g.update(.01);assert.equal(g.items.length,0);}
 const p=new PsfProgress({getItem(){throw Error();},setItem(){throw Error();}});assert.equal(p.collect('run',1,'cake'),true);assert.equal(p.data.items.cake,1);
});
