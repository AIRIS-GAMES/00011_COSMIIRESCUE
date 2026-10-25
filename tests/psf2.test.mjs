import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame} from '../src/engine.js';
import {stage} from '../src/stage.js';
import {damagePlan} from '../src/difficulty.js';
import {PsfProgress} from '../src/psf.js';
import {characterCollection,CollectionVisit} from '../src/collection.js';
import {RescueAnalytics} from '../src/analytics.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};};
const game=()=>{const g=new RescueGame(stage);g.start();g.psfRules=true;g.firstReturnProtection=true;g.rescue(g.spawnFriend({x:0,y:0,kind:1}));g.drain();return g;};
test('first delivery stays locked; saved counts remain unchanged',()=>{
 const s=memory(),p=new PsfProgress(s);assert.equal(characterCollection('blue',p.data).unlocked,false);p.commit('a',1,[0,1,0,0]);const loaded=new PsfProgress(s);assert.equal(characterCollection('blue',loaded.data).unlocked,false);assert.equal(characterCollection('blue',loaded.data).achieved,false);assert.equal(loaded.commit('a',1,[0,1,0,0]),false);assert.equal(loaded.data.counts[1],1);
});
test('old saves expose earned basic profiles and memorials, without artificial unlock events',()=>{
 const s=memory();s.setItem('cosmii-psf-v1',JSON.stringify({started:true,counts:[1,5,20,30],trips:[1,2,2,3]}));const p=new PsfProgress(s);assert.equal(characterCollection('pink',p.data).unlocked,false);assert.equal(characterCollection('pink',p.data).achieved,false);assert.equal(characterCollection('blue',p.data).achieved,true);assert.deepEqual(p.data.trips,[1,2,2,3]);assert.equal(p.beginNormal(),'legacy');
});
test('interest tracks unmet selections but never counts automatic redraws as choices',()=>{
 const sent=[],v=new CollectionVisit((name,data)=>sent.push({name,...data})),preview=characterCollection('blue');
 v.show('blue',preview,'initial');v.show('blue',preview,'initial');v.show('blue',preview,'select');v.show('blue',preview,'initial');
 assert.equal(sent.filter(e=>e.name==='character_initial').length,1);assert.equal(sent.filter(e=>e.name==='character_select').length,1);assert.equal(sent.filter(e=>e.name==='goal_display').length,1);assert.equal(sent.filter(e=>e.name==='profile_display').length,0);
 const basic=characterCollection('blue',{counts:[0,5,0,0]});v.show('blue',basic,'select');v.show('blue',basic,'initial');assert.equal(sent.filter(e=>e.name==='profile_display').length,1);
});
test('interest events bound every name segment and survive blocked measurement',()=>{
 const sent=[],a=new RescueAnalytics((...args)=>sent.push(args));a.interest('character_select',{source:'secret',characterType:'private',status:'url'});a.interest('private',{});assert.deepEqual(sent,[['addDesignEvent','InterestV2:character_select:title:group:preview',1]]);assert.doesNotThrow(()=>new RescueAnalytics(()=>{throw Error();}).interest('profile_display',{}));
});
test('harmless protected hit does not consume blue or emit defense, blood, lost or hit',()=>{
 for(const time of [1,40]){const g=game();g.time=time;g.hit(1,g.player);assert.equal(g.blueUsed,false);assert.equal(g.carry.length,1);assert.equal(g.hearts,3);assert.equal(g.stun,0);assert.deepEqual(g.drain().map(e=>e.type),['bump']);}
});
test('strong hit that adds stun is defended; pure plan has no mutation',()=>{
 const input={mode:'normal',time:1,count:1,direct:true,protectedReturn:true,stun:0},copy={...input};const plan=damagePlan(input,2);assert.deepEqual(input,copy);assert.equal(plan.loss,0);assert.equal(plan.life,0);assert.ok(plan.stunAdded>0);
 const g=game();g.hit(2,g.player);const events=g.drain();assert.equal(g.blueUsed,true);assert.equal(g.stun,0);assert.deepEqual(events.map(e=>e.type),['blueDefense']);assert.equal(events[0].preventedStun,plan.stunAdded);
});
test('existing stronger stun is not claimed as prevented; real losses spend one shared charge',()=>{
 const g=game();g.stun=.5;g.hit(2,g.player);assert.equal(g.blueUsed,false);g.cooldown=0;g.rescue(g.spawnFriend({x:1,y:1,kind:1}));g.drain();g.hit(1,g.player);assert.equal(g.blueUsed,true);assert.equal(g.carry.length,2);assert.equal(g.drain()[0].preventedFriends,1);g.cooldown=0;g.hit(1,g.player);assert.equal(g.carry.length,1);
});
test('attempt attribution survives reload; migrated starts are not mislabeled first',()=>{
 const s=memory(),p=new PsfProgress(s);assert.equal(p.beginNormal(),'first');p.mark('started');assert.equal(new PsfProgress(s).beginNormal(),'retry');const old=memory();old.setItem('cosmii-psf-v1',JSON.stringify({started:true}));assert.equal(new PsfProgress(old).beginNormal(),'legacy');
});
test('retired interest events cannot double count the new intent events',()=>{
 const sent=[],a=new RescueAnalytics((...v)=>sent.push(v));a.community('character_view',{trigger:'select'});assert.equal(sent.length,0);a.community('character_select',{characterType:'blue'});assert.equal(sent.length,1);assert.doesNotThrow(()=>new CollectionVisit(()=>{throw Error();}).show('blue',characterCollection('blue'),'select'));
});
test('collection capsule collision matches its 25 radius plus the hero radius',()=>{
 const g=game();g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.friends=[];g.homes=[];g.stage.spawns=[];g.player.vx=0;g.player.vy=0;g.items=[{id:'apple',x:g.player.x+44,y:g.player.y}];g.update(.001);assert.equal(g.items.length,1);g.items[0].x=g.player.x+40;g.update(.001);assert.equal(g.items.length,0);
});
