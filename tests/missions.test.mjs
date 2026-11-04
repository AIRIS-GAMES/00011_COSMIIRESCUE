import test from 'node:test';
import assert from 'node:assert/strict';
import {DailyMissions,missionsFor,MISSION_TEMPLATES,MISSION_KEY,TRUST_BONUS,localDay} from '../src/missions.js';
import {ROOM_KEY,roomProps,validRoomState} from '../src/room-data.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),map:m};};
const at=(y,mo,d,h=12)=>()=>new Date(y,mo-1,d,h);
const template=id=>MISSION_TEMPLATES.find(t=>t.id===id);
// Find a day whose set contains a given template id (missions are seeded by local date).
const dayWith=id=>{for(let d=1;d<400;d++){const date=new Date(2026,10,d);if(missionsFor(localDay(date)).some(m=>m.id===id))return ()=>new Date(date.getTime()+12*36e5);}throw Error('no day for '+id);};

test('three missions per local day: two different flight goals and one room goal, stable for the day',()=>{
  for(let d=1;d<=60;d++){
    const day=localDay(new Date(2026,10,d)),set=missionsFor(day);
    assert.equal(set.length,3);assert.deepEqual(set,missionsFor(day));
    const [a,b,c]=set.map(m=>template(m.id));
    assert.notEqual(a.type,b.type);assert.ok(!['snack','touch'].includes(a.type)&&!['snack','touch'].includes(b.type));assert.ok(['snack','touch'].includes(c.type));
  }
  const kinds=new Set();for(let d=1;d<=120;d++)for(const m of missionsFor(localDay(new Date(2026,0,d))))kinds.add(m.id);
  assert.ok(kinds.size>=10);
});

test('progress counts only matching events, keeps the best single return, and survives a reload',()=>{
  const storage=memory(),now=dayWith('rescue-pink'),m=new DailyMissions({storage,now});
  const index=m.data.missions.findIndex(x=>x.id==='rescue-pink');
  m.track('rescue',1,{kind:1});assert.equal(m.data.missions[index].progress,0);
  for(let i=0;i<9;i++)m.track('rescue',1,{kind:0});assert.equal(new DailyMissions({storage,now}).data.missions[index].progress,9);
  const done=m.track('rescue',1,{kind:0});assert.equal(done.length,1);assert.equal(done[0].id,'rescue-pink');
  assert.equal(m.track('rescue',1,{kind:0}).length,0);assert.equal(m.data.missions[index].progress,10);

  const big=new DailyMissions({storage:memory(),now:dayWith('big-return')}),bi=big.data.missions.findIndex(x=>x.id==='big-return');
  big.track('bigReturn',5);big.track('bigReturn',3);assert.equal(big.data.missions[bi].progress,5);assert.equal(big.track('bigReturn',9).length,1);assert.equal(big.data.missions[bi].progress,8);

  const area=new DailyMissions({storage:memory(),now:dayWith('reach-neon')}),ai=area.data.missions.findIndex(x=>x.id==='reach-neon');
  area.track('area',1);assert.equal(area.data.missions[ai].progress,0);area.track('area',3);assert.equal(area.data.missions[ai].progress,1);
});

test('a new local day brings new missions but keeps cookies and early furniture',()=>{
  const storage=memory();let now=new Date(2026,10,4,23,50);const m=new DailyMissions({storage,now:()=>now});
  m.data.treats=2;m.data.bonusProps=['plant'];for(const x of m.data.missions)x.progress=99;m.save();
  now=new Date(2026,10,5,0,5);const next=new DailyMissions({storage,now:()=>now});
  assert.equal(next.data.day,'2026-11-05');assert.ok(next.list().every(x=>x.progress===0&&!x.claimed));
  assert.equal(next.data.treats,2);assert.deepEqual(next.data.bonusProps,['plant']);
});

test('claiming: cookie, trust bonus for room residents only, then the all-clear furniture bonus',()=>{
  const storage=memory(),m=new DailyMissions({storage,now:at(2026,11,4)});
  const progress={totalReturned:6,data:{counts:[2,1,0,0]}};
  assert.equal(m.claim(0,{progress}),null);
  for(const x of m.data.missions)x.progress=template(x.id).target;m.save();
  assert.equal(m.claimable,3);
  assert.equal(m.claim(0,{progress}).type,'treat');assert.equal(m.data.treats,1);assert.equal(m.claim(0,{progress}),null);
  assert.equal(m.claim(1,{progress}).type,'trust');
  const trust=JSON.parse(storage.getItem(ROOM_KEY)).trust;assert.equal(trust.green,TRUST_BONUS);assert.equal(trust.pink,TRUST_BONUS);assert.equal(trust.blue,TRUST_BONUS);assert.equal(trust.red,0);
  assert.equal(m.bonusReady,false);assert.equal(m.claimBonus(6),null);
  m.claim(2,{progress});assert.equal(m.data.treats,2);assert.equal(m.bonusReady,true);
  const bonus=m.claimBonus(6);assert.equal(bonus.type,'furniture');assert.equal(bonus.prop.id,'chest');assert.equal(m.data.streak,1);
  assert.equal(m.claimBonus(6),null);assert.equal(m.claimable,0);
  // The early piece is usable in the room even though 6 returns < 15 required.
  const state=validRoomState({slots:['chest','chest',null,null]},6,m.data.bonusProps);assert.deepEqual(state.slots,['chest','chest',null,null]);
  assert.deepEqual(validRoomState({slots:['chest',null,null,null]},6).slots,[null,null,null,null]);
});

test('the all-clear bonus becomes two cookies once every piece is open; streak follows consecutive days',()=>{
  const storage=memory();let now=new Date(2026,10,4,12);const m=new DailyMissions({storage,now:()=>now});
  const clear=()=>{for(const x of m.data.missions)x.progress=template(x.id).target;m.save();for(let i=0;i<3;i++)m.claim(i,{progress:{totalReturned:999,data:{counts:[1,1,1,1]}}});return m.claimBonus(999);};
  const before=m.data.treats;assert.deepEqual(clear(),{type:'treat',count:2});assert.equal(m.data.treats,before+2+2);assert.equal(m.data.streak,1);
  now=new Date(2026,10,5,9);m.load();clear();assert.equal(m.data.streak,2);
  now=new Date(2026,10,7,9);m.load();clear();assert.equal(m.data.streak,1);
  assert.equal(roomProps.at(-1).required<=999,true);
});

test('cookies are spent one at a time and never go negative',()=>{
  const storage=memory(),m=new DailyMissions({storage,now:at(2026,11,4)});m.data.treats=1;m.save();
  assert.equal(new DailyMissions({storage,now:at(2026,11,4)}).useTreat(),true);assert.equal(m.useTreat(),false);
  assert.equal(JSON.parse(storage.getItem(MISSION_KEY)).treats,0);
});

test('tapping the D1 reminder asks the app to open today\'s missions; D7 only measures',async()=>{
  const {Reminders}=await import('../src/reminders.js');const opened=[],measured=[];
  const r=new Reminders((name,kind)=>measured.push(kind),kind=>opened.push(kind));
  await r.initialize(async()=>({plugin:{consumeTaps:async()=>({taps:[{kind:'d1'},{kind:'d7'},{kind:'other'}]})}}));
  await r.consume();assert.deepEqual(measured,['d1','d7']);assert.deepEqual(opened,['d1','d7']);
});

test('every mission image ships in the build',async()=>{
  const {runtimeAssets}=await import('../scripts/runtime-assets.mjs');const {TREAT}=await import('../src/missions.js');const assets=runtimeAssets();
  for(const src of [TREAT.src,'./Asset/ui/menu/missions.png',...MISSION_TEMPLATES.map(m=>m.icon)])assert.ok(assets.has(src),src);
});
