import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueStorage} from '../src/storage.js';
const memory=()=>{let value=null;return {getItem:()=>value,setItem:(_,v)=>{value=v;}};};
test('rescue count records are isolated from legacy points and retain reference distance',()=>{
  const legacy=JSON.stringify({best:9000,runs:[]}),data=new Map([['cosmii-endless-v1',legacy],['cosmii-endless-psf-v1',legacy],['cosmii-endless-v1-hard',legacy]]);
  const disk={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  for(const mode of ['normal','psf','hard']){
    const s=new RescueStorage(disk,mode);assert.equal(s.data.best,0);
    s.record({score:3,rescued:3,maxCarry:4,travel:1234.5});
    const loaded=new RescueStorage(disk,mode);assert.equal(loaded.data.best,3);assert.equal(loaded.data.runs[0].distance,1234);
  }
  assert.equal(data.get('cosmii-endless-psf-v1'),legacy);
});
test('checkpoint snapshots persist and the same run is updated without duplicates',()=>{const disk=memory(),s=new RescueStorage(disk);s.beginRun();s.record({score:100,rescued:1,maxCarry:3});s.record({score:600,rescued:3,maxCarry:5});const loaded=new RescueStorage(disk);assert.equal(loaded.data.best,600);assert.equal(loaded.data.runs.length,1);assert.equal(loaded.data.runs[0].rescued,3);assert.equal(s.record({score:600,rescued:3,maxCarry:5}),true);assert.equal(s.data.runs.length,1);});
test('retry adds a new run, retains older records and caps the list at five',()=>{const disk=memory(),s=new RescueStorage(disk);for(let i=1;i<=7;i++){s.beginRun();s.record({score:i*100,rescued:i,maxCarry:i});}assert.equal(s.data.runs.length,5);assert.equal(new Set(s.data.runs.map(r=>r.id)).size,5);assert.equal(s.data.best,700);s.beginRun();assert.equal(s.record({score:100,rescued:1,maxCarry:1}),false);assert.equal(s.data.best,700);});

test('two tabs merge scores and progress instead of overwriting each other',async()=>{
 const {PsfProgress}=await import('../src/psf.js');
 const m=new Map(),s={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 const a=new RescueStorage(s,'psf'),b=new RescueStorage(s,'psf');a.beginRun();b.beginRun();a.record({score:9,rescued:9});b.record({score:3,rescued:3});
 const saved=new RescueStorage(s,'psf').data;assert.equal(saved.best,9);assert.equal(saved.runs.length,2);
 const pa=new PsfProgress(s),pb=new PsfProgress(s);pa.commit('a',1,[2,0,0,0]);pb.commit('b',1,[0,3,0,0]);pb.mark('practice');
 const p=new PsfProgress(s).data;assert.deepEqual(p.counts,[2,3,0,0]);assert.equal(p.practice,true);assert.equal(p.returned,true);
});
