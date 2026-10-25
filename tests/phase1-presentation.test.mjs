import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueReactions,MAX_RESCUE_REACTIONS} from '../src/rescue-reactions.js';
import {presentationFlags} from '../src/presentation-config.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
import {RescueAnalytics} from '../src/analytics.js';
test('presentation flags default on and support explicit off',()=>{assert.deepEqual(presentationFlags('?opening=off&reactions=on'),{opening:false,reactions:true});assert.deepEqual(presentationFlags(''),{opening:true,reactions:true});});
test('presentation events are read-only: full simulation is identical with reactions on and off',()=>{
 const make=()=>{const g=new RescueGame(stage,seededRandom(17),{enabled:false});g.start();return g;},a=make(),b=make(),r=new RescueReactions();
 for(let tick=0;tick<600;tick++){
  for(const g of [a,b]){
   if(tick%45===0)g.flap();if(tick===60)g.setDirection(-1);if(tick===90)g.setDirection(1);
   if(tick===120)for(let i=0;i<21;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4}));
   if(tick===150)g.hit(1,g.carry[0]);
   if(tick===200){for(let i=0;i<20;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4}));g.beginReturn();}
   g.update(1/120);
  }
  const eventsA=a.drain(),eventsB=b.drain();assert.deepEqual(eventsA,eventsB);for(const e of eventsA)r.event(e,a);r.advance(1/120);
  assert.equal(JSON.stringify(a),JSON.stringify(b));
 }
 assert.ok(a.rescued>=20);assert.ok(a.rainbow.activations>=1);
});
test('reaction state is capped, pauses, expires, excludes guest artwork and resets',()=>{
 const g={isStory:false,player:{x:0},carry:[]},r=new RescueReactions();for(let i=0;i<300;i++){g.carry.push({id:i,kind:i%4,x:i,y:0});r.event({type:'rescue',kind:i%4,count:i+1,x:i,y:0},g);}assert.equal(r.buddies.size,MAX_RESCUE_REACTIONS);
 for(let i=0;i<20;i++)r.event({type:'return',x:i,y:0},g);assert.equal(r.rings.length,3);r.advance(.1,true);assert.equal(r.time,0);
 for(let i=0;i<20;i++)r.advance(.1);assert.equal(r.buddies.size,0);assert.equal(r.hero,null);assert.equal(r.rings.length,0);
 r.event({type:'rescue',kind:0,count:1,x:0,y:0,collaborationKind:0},g);assert.equal(r.buddies.size,0);r.event({type:'lost',x:0,y:0},g);r.reset();assert.equal(r.hero,null);
});
test('disabled and reduced motion poses add no transforms; powered eyes remain aligned with beams',()=>{
 const g={player:{x:0},carry:[{id:1,kind:2,x:0,y:0}]},r=new RescueReactions(),calls=[],c={translate:(...x)=>calls.push(x),rotate:(...x)=>calls.push(x),scale:(...x)=>calls.push(x)};r.event({type:'rescue',kind:2,count:1,x:0,y:0},g);r.advance(.1);r.applyBuddy(c,1,true);r.applyHero(c,false,true);assert.equal(calls.length,0);r.applyBuddy(c,1,false);assert.ok(calls.length>0);
 const off=new RescueReactions(false);off.event({type:'rescue',kind:2,count:1,x:0,y:0},g);off.advance(.1);assert.equal(off.buddies.size,0);assert.equal(off.hero,null);
});
test('opening and rescue metrics are bounded; return reuses the checkpoint event',()=>{
 const calls=[],a=new RescueAnalytics((...v)=>calls.push(v));a.presentation('story_open',{source:'private'});a.presentation('story_skip',{source:'replay'});a.presentation('anything',{});assert.equal(calls.length,2);assert.equal(calls[0][1],'Presentation:story_open:replay');
 const g={mode:'normal',score:0};a.start(g);calls.length=0;a.event({type:'rescue'},g);a.event({type:'return',count:20,total:6000},g);
 assert.equal(calls.filter(c=>c[1]==='Rescue:Success:normal').length,1);assert.equal(calls.filter(c=>c[1]==='Checkpoint:Count:normal').length,1);assert.ok(!calls.some(c=>String(c[1]).includes('return_success')));
});
test('community analytics excludes private names and URLs and bounds unknown modes',()=>{
 const calls=[],a=new RescueAnalytics((...v)=>calls.push(v));
 a.community('play',{mode:'private-mode'});a.community('external_click',{source:'encyclopedia',destination:'line',characterType:'green',url:'private-url'});a.community('character_select',{source:'private-source',characterType:'private-name'});a.community('made-up',{});
 assert.equal(calls.length,3);assert.equal(calls[0][1],'Interest:play:normal');assert.equal(calls[1][1],'Interest:external_click:encyclopedia:line:green');assert.ok(!JSON.stringify(calls).includes('private-'));
});
