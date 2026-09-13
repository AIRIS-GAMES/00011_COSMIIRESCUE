import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueStorage} from '../src/storage.js';
const memory=()=>{let value=null;return {getItem:()=>value,setItem:(_,v)=>{value=v;}};};
test('checkpoint snapshots persist and the same run is updated without duplicates',()=>{const disk=memory(),s=new RescueStorage(disk);s.beginRun();s.record({score:100,rescued:1,maxCarry:3});s.record({score:600,rescued:3,maxCarry:5});const loaded=new RescueStorage(disk);assert.equal(loaded.data.best,600);assert.equal(loaded.data.runs.length,1);assert.equal(loaded.data.runs[0].rescued,3);assert.equal(s.record({score:600,rescued:3,maxCarry:5}),true);assert.equal(s.data.runs.length,1);});
test('retry adds a new run, retains older records and caps the list at five',()=>{const disk=memory(),s=new RescueStorage(disk);for(let i=1;i<=7;i++){s.beginRun();s.record({score:i*100,rescued:i,maxCarry:i});}assert.equal(s.data.runs.length,5);assert.equal(new Set(s.data.runs.map(r=>r.id)).size,5);assert.equal(s.data.best,700);s.beginRun();assert.equal(s.record({score:100,rescued:1,maxCarry:1}),false);assert.equal(s.data.best,700);});
