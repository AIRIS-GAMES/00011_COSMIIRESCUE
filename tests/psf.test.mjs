import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,horizontalSpeed} from '../src/engine.js';
import {stage} from '../src/stage.js';
import {PsfProgress,psfMeasure} from '../src/psf.js';
import {RescueStorage} from '../src/storage.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};};
const game=(mode='normal')=>{const g=new RescueGame(stage);g.start(mode);g.psfRules=true;g.firstReturnProtection=true;g.time=40;return g;};
const add=(g,kind)=>g.rescue(g.spawnFriend({x:0,y:0,kind}));
test('PSF flags persist independently and survive blocked/corrupt storage',()=>{
 const s=memory(),p=new PsfProgress(s);p.mark('intro');assert.equal(new PsfProgress(s).data.practice,false);assert.equal(new PsfProgress(s).data.intro,true);
 const blocked=new PsfProgress({getItem(){throw Error();},setItem(){throw Error();}});blocked.mark('practice');assert.equal(blocked.data.practice,true);
 s.setItem('cosmii-psf-v1','oops');assert.equal(new PsfProgress(s).data.returned,false);
});
test('return commits are idempotent across reload and animation; guest identities excluded',()=>{
 const s=memory(),p=new PsfProgress(s),g=game();add(g,1);add(g,1);g.carry.push({kind:1,collaborationKind:0,value:100,combo:1});g.beginReturn();const e=g.drain().find(e=>e.type==='return');assert.deepEqual(e.delivered,[0,2,0,0]);assert.equal(p.commit('run',e.sequence,e.delivered),true);assert.equal(new PsfProgress(s).commit('run',e.sequence,e.delivered),false);while(g.bankQueue.length)g.bankOne();assert.deepEqual(new PsfProgress(s).data.counts,[0,2,0,0]);assert.deepEqual(new PsfProgress(s).data.trips,[0,1,0,0]);
});
test('no protection before the first delivery: hits cost friends and hearts right away',()=>{
 const g=game();add(g,1);add(g,1);assert.equal(g.protectedReturn,false);assert.ok(g.beforeFirstReturn);g.hit(3,g.player);assert.equal(g.carry.length,0);assert.equal(g.hearts,2);g.cooldown=0;g.hit(1,g.player);assert.equal(g.hearts,1);
 add(g,1);g.beginReturn();assert.equal(g.beforeFirstReturn,false);
});
test('HARD and practice never get PSF protection',()=>{
 for(const mode of ['hard','normal']){const g=game(mode);g.isTraining=mode==='normal';add(g,1);g.hit(3,g.player);assert.equal(g.carry.length,0);if(mode==='hard')assert.equal(g.state,'ending');}
});
test('normal steering is continuous around zero and preserves endpoints',()=>{assert.equal(horizontalSpeed(0),190);assert.equal(horizontalSpeed(-1),-225);assert.equal(horizontalSpeed(1),310);assert.ok(Math.abs(horizontalSpeed(-.00001)-horizontalSpeed(.00001))<.01);});
test('PSF score namespace preserves legacy and HARD scores',()=>{const s=memory(),old=new RescueStorage(s),psf=new RescueStorage(s,'psf');old.record({score:999,rescued:2});psf.record({score:123,rescued:1});assert.equal(new RescueStorage(s).data.best,999);assert.equal(new RescueStorage(s,'psf').data.best,123);assert.equal(new RescueStorage(s,'hard').data.best,0);});
test('PSF metrics bound event names and variants and tolerate send failure',()=>{const sent=[],a={call:(...args)=>sent.push(args)};psfMeasure(a,'first_rescue',5,'private-id');psfMeasure(a,'private-id',5);assert.deepEqual(sent,[['addDesignEvent','PSF:v2:first_rescue:normal',5]]);assert.doesNotThrow(()=>psfMeasure({call(){throw Error();}},'blue_defense'));});

test('losing the last friend emits a real loss event',()=>{const g=game();add(g,0);g.drain();g.hit(3,g.player);assert.equal(g.carry.length,0);assert.equal(g.drain().filter(e=>e.type==='lost').length,1);});

test('cumulative returns derive from preserved counts, survive reload, and do not double count',()=>{
 const s=memory();s.setItem('cosmii-psf-v1',JSON.stringify({counts:[10,5,20,30],items:{apple:2},intro:true}));
 const p=new PsfProgress(s);assert.equal(p.totalReturned,65);p.commit('a',1,[1,2,0,0]);assert.equal(p.totalReturned,68);
 const loaded=new PsfProgress(s);assert.equal(loaded.totalReturned,68);assert.equal(loaded.commit('a',1,[1,2,0,0]),false);assert.equal(loaded.totalReturned,68);assert.equal(loaded.data.items.apple,2);assert.equal(loaded.data.intro,true);
 loaded.commit('b',1,[0,0,1,0]);assert.equal(new PsfProgress(s).totalReturned,69);
});
