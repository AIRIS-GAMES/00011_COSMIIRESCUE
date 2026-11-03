import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {RescueAnalytics} from '../src/analytics.js';
import {FriendRoom} from '../src/friend-room.js';
import {validRoomState} from '../src/room-data.js';

test('real Capacitor proxy reaches native initialization without then assimilation',()=>{
 const result=execFileSync(process.execPath,['--input-type=module','-e',`
 globalThis.webkit={messageHandlers:{bridge:{}}};
 const calls=[];
 globalThis.Capacitor={getPlatform:()=> 'ios',PluginHeaders:[{name:'CosmiiAttribution',methods:[{name:'initialize',rtype:'promise'},{name:'track',rtype:'promise'}]}],nativePromise:async(p,m)=>{calls.push(m);return {enabled:true};}};
 globalThis.location={hostname:'localhost',protocol:'capacitor:',search:''};
 const {attribution,initializeAttribution}=await import('./src/attribution.js');
 await initializeAttribution();
 const {analytics,initializeAnalytics}=await import('./src/analytics.js');
 let environment;analytics.initialize=async env=>environment=env;
 await initializeAnalytics();
 console.log(JSON.stringify({state:attribution.state,calls,environment}));
 `],{encoding:'utf8'});
 assert.deepEqual(JSON.parse(result),{state:'ready',calls:['initialize'],environment:'production'});
});

test('slow analytics initialization retains events and flushes once after recovery',async()=>{
 const sent=[],observed=[],a=new RescueAnalytics(null,(...args)=>observed.push(args));
 let checks=0,waits=0;
 a.design('BeforeReady');
 await a.initialize('production',async()=>({default:(...args)=>sent.push(args),gameanalytics:{GameAnalytics:{isRemoteConfigsReady:()=>++checks>105}}}),async()=>{waits++;if(waits===102)a.design('DuringOutage');});
 a.design('AfterRecovery');
 assert.equal(waits,105);assert.equal(a.failed,false);assert.equal(a.queue.length,0);
 for(const id of ['BeforeReady:normal','DuringOutage:normal','AfterRecovery:normal']){
  assert.equal(sent.filter(e=>e[1]===id).length,1);assert.equal(observed.filter(e=>e[1]===id).length,1);
 }
 assert.equal(sent.filter(e=>e[0]==='initialize').length,1);
});

test('stale room edits preserve trust and other slots; gains use latest cap',()=>{
 const previous=globalThis.localStorage;let raw;
 globalThis.localStorage={getItem:()=>raw??null,setItem:(k,v)=>raw=v};
 try{
  const a={state:validRoomState(null,500),total:500},b={state:validRoomState(null,500),total:500};
  const save=(room,change)=>FriendRoom.prototype.save.call(room,change);
  save(a,{id:'pink',gain:4});save(a,{slot:0,prop:'moon'});
  save(b,{character:'green'});assert.equal(b.state.trust.pink,4);assert.equal(b.state.slots[0],'moon');
  save(b,{id:'pink',gain:6});assert.equal(b.state.trust.pink,10);
  save(a,{id:'pink',gain:88});assert.equal(a.state.trust.pink,98);
  assert.equal(save(b,{id:'pink',gain:10}),2);assert.equal(b.state.trust.pink,100);
  save(a,{slot:0,prop:null});assert.equal(a.state.trust.pink,100);assert.equal(a.state.slots[0],null);
 }finally{globalThis.localStorage=previous;}
});

test('red skill destruction does not count as rainbow destruction',()=>{
 const sent=[],a=new RescueAnalytics((...args)=>sent.push(args));a.start({mode:'normal'});
 a.event({type:'break',rainbow:true,cause:'redSkill'},{});
 assert.equal(sent.filter(e=>e[1]==='Rainbow:Destroyed:normal').length,0);
 a.event({type:'break',rainbow:true},{});
 assert.equal(sent.filter(e=>e[1]==='Rainbow:Destroyed:normal').length,1);
});


test('stale room refreshes return count before validating newly unlocked furniture',()=>{
 const previous=globalThis.localStorage;
 let raw=JSON.stringify({...validRoomState(null,500),slots:['trophy',null,null,null]});
 globalThis.localStorage={getItem:()=>raw,setItem:(k,v)=>raw=v};
 try{
  const progress={totalReturned:499,load(){this.totalReturned=500;}};
  const room={state:validRoomState(null,499),total:499,progress};
  FriendRoom.prototype.save.call(room,{character:'green'});
  assert.equal(room.total,500);assert.equal(JSON.parse(raw).slots[0],'trophy');
 }finally{globalThis.localStorage=previous;}
});

test('failed room writes retain gains and furniture, merge other tabs, and retry once',()=>{
 const previous=globalThis.localStorage;let raw=JSON.stringify(validRoomState(null,500)),fail=true,readFails=false;
 globalThis.localStorage={getItem:()=>{if(readFails)throw Error('unavailable');return raw;},setItem:(k,v)=>{if(fail)throw Error('quota');raw=v;}};
 try{
  const room={state:validRoomState(null,500),total:500},save=change=>FriendRoom.prototype.save.call(room,change);
  assert.equal(save({id:'pink',gain:4}),4);
  save({slot:0,prop:'trophy'});save({character:'pink'});
  assert.equal(room.state.trust.pink,4);assert.equal(JSON.parse(raw).trust.pink,0);
  assert.equal(save({id:'pink',gain:2}),2);assert.equal(room.state.trust.pink,6);
  const other=JSON.parse(raw);other.trust.pink=3;other.slots[1]='moon';raw=JSON.stringify(other);
  readFails=true;fail=false;save({character:'green'});
  assert.equal(JSON.parse(raw).trust.pink,3); // Failed reads must not overwrite another tab.
  readFails=false;save({character:'pink'});
  assert.equal(room.state.trust.pink,9);assert.deepEqual(room.state.slots,['trophy','moon',null,null]);
  assert.equal(JSON.parse(raw).trust.pink,9);assert.equal(room.pendingSave,null);
  save({character:'green'});assert.equal(JSON.parse(raw).trust.pink,9);
  fail=true;assert.equal(save({id:'pink',gain:100}),91);
  save({character:'pink'});assert.equal(room.state.trust.pink,100);
  fail=false;save({character:'green'});assert.equal(JSON.parse(raw).trust.pink,100);
 }finally{globalThis.localStorage=previous;}
});
