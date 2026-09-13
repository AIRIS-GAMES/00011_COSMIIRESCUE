import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,seededRandom} from '../src/engine.js';
import {stage} from '../src/stage.js';
import {hazardTypes} from '../src/hazards.js';
const contact=(id,count=5)=>{const g=new RescueGame(stage,seededRandom(4));g.start();g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];for(const f of g.friends.slice(0,count))g.rescue(f);g.friends=[];const p=g.player;g.obstacles=[{...hazardTypes[id],asset:id,x:p.x,y:p.y,baseX:p.x,baseY:p.y,r:28,phase:0,disabled:0}];g.update(1/120);return g;};
test('nuisance collisions apply distinct effects without losing friends or lives',()=>{for(const id of ['cloud','bubble','flyer','drink','banana']){const g=contact(id);assert.equal(g.carry.length,5,id);assert.equal(g.hearts,3,id);assert.ok(g.effects[hazardTypes[id].effect]>0,id);for(let i=0;i<400;i++)g.update(1/120);assert.equal(g.effects[hazardTypes[id].effect],0,id);}});
test('normal collision loses two; strong collision loses three or four',()=>{for(const [id,n] of [['apple',2],['crate',2],['fork',3],['rocket',4],['lightning',4]]){const g=contact(id);assert.equal(g.carry.length,5-n,id);assert.equal(g.hearts,3);g.hit(3);assert.equal(g.carry.length,5-n);}});
test('strong damage cannot remove more friends than carried or also take life',()=>{const g=contact('rocket',1);assert.equal(g.carry.length,0);assert.equal(g.hearts,3);g.start();assert.deepEqual(g.effects,{fog:0,slow:0,paper:0,slip:0});});
test('blood appears only on damaging contact, once per damage cooldown',()=>{
  for(const id of ['knife','fork','apple']){
    const g=contact(id);const drops=g.drain().filter(e=>e.type==='blood');assert.equal(drops.length,1,id);assert.ok(Number.isFinite(drops[0].x));
    g.hit(2,g.player);assert.equal(g.drain().filter(e=>e.type==='blood').length,0);
  }
  for(const id of ['cloud','bubble','flyer','drink','banana'])assert.equal(contact(id).drain().filter(e=>e.type==='blood').length,0,id);
  assert.equal(contact('knife',0).drain().filter(e=>e.type==='blood').length,0,'initial shield');
});
