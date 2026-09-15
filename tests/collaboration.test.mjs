import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueGame,seededRandom} from '../src/engine.js';
import {collaboration} from '../src/collaboration-config.js';
import {collaborationAvailable,collaborationAssetsNeeded} from '../src/collaboration.js';
import {stage} from '../src/stage.js';
import {IncomingHazards} from '../src/incoming.js';
const config={...collaboration,enabled:true,startsAt:null,endsAt:null};
function make(settings=config,now=Date.now){
  const g=new RescueGame(stage,seededRandom(9),settings,now);g.start();g.world.extend=()=>{};g.incoming.update=()=>{};
  g.homes=[];g.friends=[];g.obstacles=[];return g;
}
function carry(g,n,kind=0){for(let i=0;i<n;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4,collaborationKind:kind}));}
function deliver(g,n,kind=0){g.returnLock=0;carry(g,n,kind);g.beginReturn();while(g.bankQueue.length)g.bankOne();}

test('only delivered guests count; 3 + 2 HOME returns start ten-second fever',()=>{
  const g=make();deliver(g,3);assert.equal(g.collaboration.progress,3);assert.equal(g.powered,false);
  carry(g,2);assert.equal(g.collaboration.delivered,3);g.returnLock=0;g.beginReturn();
  assert.equal(g.collaboration.delivered,5);assert.equal(g.collaboration.progress,0);assert.equal(g.collaboration.left,10);assert.ok(g.powered);
  assert.equal(g.drain().filter(e=>e.type==='collaborationStart').length,1);
  assert.equal(g.rainbow.active,false);
});
test('normal friends do not trigger guest fever and a large delivery keeps remainder',()=>{
  const g=make();deliver(g,20,null);assert.equal(g.powered,false);assert.equal(g.collaboration.delivered,0);
  deliver(g,12);assert.equal(g.collaboration.progress,2);assert.equal(g.collaboration.activations,2);assert.equal(g.collaboration.left,10);
  assert.equal(g.rescued,32);assert.ok(g.score>0);
});
test('guest identity survives collision, re-rescue, animated delivery and HOME placement',()=>{
  const g=make();g.time=40;carry(g,3,6);g.hit(1,g.player);
  const lost=g.friends.filter(f=>f.collaborationKind===6);assert.equal(lost.length,2);
  assert.equal(g.collaboration.delivered,0);lost.forEach(f=>{f.cooldown=0;g.rescue(f);});
  g.beginReturn();while(g.bankQueue.length)g.bankOne();
  assert.equal(g.collaboration.delivered,3);assert.ok(g.returnCheckpoint.attached.every(f=>f.collaborationKind===6));
  assert.ok(g.drain().filter(e=>e.type==='bank').every(e=>e.collaborationKind===6));
});
test('fever protects, destroys obstacles, spawns bounded guests, then expires and can restart',()=>{
  const g=make({...config,feverSpawnRate:1});deliver(g,5);g.drain();const p=g.player;
  g.obstacles=[{asset:'knife',x:p.x+160,y:p.y,baseX:p.x+160,baseY:p.y,r:30,damage:2,phase:0,disabled:0}];
  g.update(1/120);assert.equal(g.obstacles.length,0);g.hit(3,p);assert.equal(g.state,'playing');
  for(let i=0;i<11;i++)g.collaboration.update(g,.8);
  assert.equal(g.friends.filter(f=>f.feverSpawn).length,8);assert.ok(g.friends.every(f=>Number.isInteger(f.collaborationKind)));
  g.collaboration.left=.001;g.update(1/120);assert.equal(g.powered,false);assert.ok(g.cooldown>0);
  deliver(g,5);assert.equal(g.collaboration.left,10);assert.equal(g.collaboration.delivered,10);
  g.start();assert.equal(g.collaboration.progress,0);assert.equal(g.collaboration.delivered,0);assert.equal(g.powered,false);
});
test('OFF restores the original twenty-at-once rainbow and consumes no extra randomness',()=>{
  const legacy=make(null),off=make({...config,enabled:false});
  assert.deepEqual(off.player,legacy.player);assert.equal(off.random(),legacy.random());
  deliver(off,10,null);deliver(off,10,null);assert.equal(off.powered,false);deliver(off,20,null);
  assert.equal(off.rainbow.left,12);assert.equal(off.collaboration.enabled,false);assert.ok(off.friends.every(f=>f.collaborationKind===null));
});
test('date boundaries fail closed; future assets are included and expired ones excluded',()=>{
  const c={...config,startsAt:'2026-10-01T00:00:00+09:00',endsAt:'2026-11-01T00:00:00+09:00'},start=Date.parse(c.startsAt),end=Date.parse(c.endsAt);
  assert.equal(collaborationAvailable(c,start-1),false);assert.equal(collaborationAvailable(c,start),true);
  assert.equal(collaborationAvailable(c,end-1),true);assert.equal(collaborationAvailable(c,end),false);
  assert.equal(collaborationAssetsNeeded(c,start-1),true);assert.equal(collaborationAssetsNeeded(c,end),false);
  for(const bad of ['invalid','2026-10-01T00:00:00'])assert.equal(collaborationAvailable({...c,endsAt:bad},start),false);
});
test('expiry applies at next title/start and never interrupts an ongoing run',()=>{
  let now=Date.parse('2026-10-01T00:00:00+09:00');const g=make({...config,endsAt:'2026-10-01T00:00:01+09:00'},()=>now);
  deliver(g,5);now+=2000;g.collaboration.update(g,.1);assert.ok(g.collaboration.active);
  g.reset();assert.equal(g.collaboration.enabled,false);deliver(g,20,null);assert.equal(g.rainbow.active,true);
});

test('campaign excludes blood-covered knife/fork in normal, hard and fever; OFF restores both',()=>{
  for(const enabled of [true,false])for(const mode of ['normal','hard'])for(const fever of [false,true]){
    const g=make({...config,enabled}),seen=new Set();g.mode=mode;g.time=90;g.incoming=new IncomingHazards();
    if(fever){if(enabled)g.collaboration.left=10;else g.rainbow.left=12;}
    for(let i=0;i<600;i++){
      g.player.x=500+(i%12)*1320;g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);
      assert.equal(g.obstacles.length,1);seen.add(g.obstacles[0].asset);
    }
    assert.equal(seen.has('knife'),!enabled);assert.equal(seen.has('fork'),!enabled);
    assert.ok(seen.has('rocket'));assert.ok(seen.has('apple'));
  }
});
test('campaign suppresses blood on player and friend hits while damage stays unchanged',()=>{
  for(const buddy of [false,true])for(const enabled of [true,false]){
    const g=make({...config,enabled});g.time=40;carry(g,3);g.drain();
    g.hit(1,buddy?g.carry[0]:g.player);
    assert.equal(g.carry.length,1);assert.equal(g.hearts,buddy?3:2);
    assert.equal(g.drain().filter(e=>e.type==='blood').length,enabled?0:1);
  }
});
