import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,areaIndexFor} from '../src/areas.js';
import {pressure} from '../src/difficulty.js';
import {RescueGame,seededRandom} from '../src/engine.js';
import {TrainingGame} from '../src/training-game.js';
import {IncomingHazards} from '../src/incoming.js';
import {hazardTypes} from '../src/hazards.js';
import {skillRequirement,SKILL_REQUIREMENTS} from '../src/skills.js';
import {RescueStorage} from '../src/storage.js';
import {stage} from '../src/stage.js';

const quiet=(mode='normal',seed=5)=>{const g=new RescueGame(stage,seededRandom(seed));g.start(mode);g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];g.obstacles=[];g.friends=[];return g;};
const carry=(g,n,kind=0)=>{for(let i=0;i<n;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind}));};
const returnOnce=g=>{carry(g,1);g.returnLock=0;g.bankQueue=[];g.beginReturn();};

test('areas advance every three HOME returns: sky, sunset, neon, space',()=>{
  assert.deepEqual([0,2,3,5,6,8,9,40].map(areaIndexFor),[0,0,1,1,2,2,3,3]);
  assert.deepEqual(AREAS.map(a=>a.id),['sky','sunset','neon','space']);
  const g=quiet();assert.equal(g.biome.id,'sky');const seen=[];
  for(let i=0;i<10;i++){returnOnce(g);for(const e of g.drain())if(e.type==='area')seen.push(e.id);}
  assert.deepEqual(seen,['sunset','neon','space']);assert.equal(g.biome.id,'space');assert.equal(g.bestArea,3);
  g.start();assert.equal(g.areaIndex,0);assert.equal(g.biome.id,'sky');
});

test('space has lighter gravity than the other areas',()=>{
  const fall=index=>{const g=quiet();g.setArea(index,false);g.player.vy=0;for(let i=0;i<30;i++)g.update(1/120);return g.player.vy;};
  assert.ok(fall(3)<fall(0)*.9);assert.equal(fall(1),fall(0));
});

test('pressure rises with area and with friends in tow; sky stays soft and food when travelling light',()=>{
  const sky=pressure('normal',{time:120,area:AREAS[0]}),crowd=pressure('normal',{time:120,area:AREAS[0],carry:20}),space=pressure('normal',{time:120,area:AREAS[3]});
  assert.equal(sky.heavy,0);assert.ok(crowd.heavy>0&&crowd.heavy<.2);
  assert.ok(crowd.interval<sky.interval&&crowd.speed>sky.speed&&crowd.normal>sky.normal);
  const heavy=AREAS.map(area=>pressure('normal',{time:120,area}).heavy);for(let i=1;i<heavy.length;i++)assert.ok(heavy[i]>heavy[i-1]);
  assert.ok(space.interval<sky.interval&&space.speed>sky.speed);
  assert.ok(pressure('hard',{time:120,area:AREAS[0]}).heavy>0);
  assert.ok(pressure('normal',{time:120,area:AREAS[2],carry:10}).heavy>pressure('normal',{time:120,area:AREAS[2]}).heavy);
});

test('area exclusives only arrive in their own area; sky sends no heavy hazards to a light flyer',()=>{
  for(const [index,area] of AREAS.entries()){
    const g=new RescueGame(stage,seededRandom(11+index));g.start();g.setArea(index,false);g.time=120;g.incoming=new IncomingHazards();const seen=new Set();
    for(let i=0;i<500;i++){g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);seen.add(g.obstacles[0].asset);}
    assert.equal(seen.has('bird'),area.exclusive==='bird',area.id);assert.equal(seen.has('meteor'),area.exclusive==='meteor',area.id);
    if(index===0)assert.ok([...seen].every(id=>(hazardTypes[id].damage||0)<=1),[...seen].join());
    else assert.ok([...seen].some(id=>hazardTypes[id].damage>1),area.id);
  }
});

test('birds face their flight direction and bob; meteors aim at the player with a round body',()=>{
  const g=new RescueGame(stage,seededRandom(3));g.start();g.time=120;g.incoming=new IncomingHazards();let bird,meteor;
  for(const index of [1,3])for(let i=0;i<400&&!(index===1?bird:meteor);i++){g.setArea(index,false);g.obstacles=[];g.incoming.wait=0;g.incoming.update(g,1/120);const o=g.obstacles[0];if(o.asset==='bird')bird=o;if(o.asset==='meteor')meteor=o;}
  assert.ok(bird&&meteor);assert.equal(bird.flip,bird.vx<0);assert.ok(bird.wave);assert.equal(meteor.ry,undefined);
  assert.ok((g.player.x-meteor.x)*meteor.vx+(g.player.y-meteor.y)*meteor.vy>0);
  const h=quiet();h.obstacles=[{...bird,x:h.player.x+900,y:h.player.y,baseY:h.player.y,phase:0}];const y0=h.obstacles[0].y;let moved=0;
  for(let i=0;i<40;i++){h.update(1/60);moved=Math.max(moved,Math.abs(h.obstacles[0].y-y0-h.obstacles[0].vy*(i+1)/60));}
  assert.ok(moved>5);
});

test('each skill use in a run raises that color by one, capped at +3; practice and new runs reset',()=>{
  const g=quiet();g.manualSkills=true;const need=[];
  for(let n=0;n<5;n++){const k=skillRequirement(g,0);need.push(k);carry(g,k,0);assert.equal(g.activateSkill(0),true);for(let i=0;i<420;i++)g.update(1/60);g.carry=[];}
  assert.deepEqual(need,[3,4,5,6,6]);assert.equal(skillRequirement(g,1),SKILL_REQUIREMENTS[1]);
  g.start();assert.equal(skillRequirement(g,0),3);
  const t=new TrainingGame();t.startPractice();t.skillUses=[5,5,5,5];assert.equal(skillRequirement(t,0),3);
});

test('the furthest area is kept per mode and reported as new only when beaten',()=>{
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  const a=new RescueStorage(storage,'psf');a.beginRun();a.record({score:2,rescued:2,maxCarry:2,travel:0,bestArea:1});a.record({score:3,rescued:3,maxCarry:3,travel:0,bestArea:2});assert.equal(a.newArea,true);assert.equal(a.data.bestArea,2);
  const b=new RescueStorage(storage,'psf');assert.equal(b.data.bestArea,2);b.beginRun();b.record({score:1,rescued:1,maxCarry:1,travel:0,bestArea:1});assert.equal(b.newArea,false);assert.equal(b.data.bestArea,2);
  assert.equal(b.data.runs.find(r=>r.score===1).area,1);
});

test('HARD: any damaging hazard that hits the hero ends the run; hitting friends behind only scatters them',()=>{
  for(const tier of [1,2,3]){
    const g=quiet('hard');carry(g,5);g.hit(tier,g.player);assert.equal(g.state,'ending',`tier ${tier} on hero`);
    const h=quiet('hard');carry(h,5);h.hit(tier,h.carry[2]);assert.equal(h.state,'playing',`tier ${tier} on friend`);assert.ok(h.carry.length<5);
  }
  const n=quiet('normal');carry(n,5);n.hit(1,n.player);assert.equal(n.state,'playing');assert.equal(n.hearts,2);
});

test('warm-up: the opening is sparse, slow and mostly fluffy, and eases off by 45 s or the first return',async()=>{
  const {warmUp}=await import('../src/difficulty.js');
  const start=pressure('normal',{time:0,area:AREAS[0]}),later=pressure('normal',{time:60,area:AREAS[0]}),afterReturn=pressure('normal',{time:5,area:AREAS[0],returns:1});
  assert.ok(start.interval>later.interval*1.7);assert.ok(start.speed<later.speed);assert.ok(start.normal<later.normal*.6);assert.equal(start.heavy,0);
  assert.equal(warmUp('normal',45),0);assert.equal(warmUp('normal',5,1),0);assert.ok(afterReturn.interval<start.interval);
  assert.ok(warmUp('hard',0)<=.5);assert.equal(warmUp('hard',20),0);
  const r0=pressure('normal',{time:120,area:AREAS[0],returns:0}),r2=pressure('normal',{time:120,area:AREAS[0],returns:2});assert.ok(r2.interval<r0.interval);
});
