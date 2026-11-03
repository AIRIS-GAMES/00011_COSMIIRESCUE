import test from 'node:test';
import assert from 'node:assert/strict';
import {returnCounts,rainFrame,RAIN_SECONDS} from '../src/return-rain.js';
test('rain counts every returned color exactly, including zero and large piles',()=>{
 for(const counts of [[0,0,0,0],[1,0,0,0],[3,4,5,18],[3000,4000,5000,18000],[1000000,2,0,7]]){
  const total=counts.reduce((a,b)=>a+b,0);assert.deepEqual(returnCounts(total,counts),counts);
  let previous=[0,0,0,0];
  for(let time=0;time<RAIN_SECONDS;time+=.013){const frame=rainFrame(counts,time);assert.ok(frame.pile.length<=108&&frame.falling.length<=72);for(let c=0;c<4;c++){assert.ok(frame.landed[c]>=previous[c]&&frame.landed[c]<=frame.emitted[c]&&frame.emitted[c]<=counts[c]);}previous=frame.landed;}
  const last=rainFrame(counts,RAIN_SECONDS);assert.deepEqual(last.landed,counts);assert.deepEqual(last.emitted,counts);assert.equal(last.pile.length,Math.min(108,total));assert.equal(last.falling.length,0);assert.ok(last.done);
  if(total<=108)assert.deepEqual([0,1,2,3].map(c=>last.pile.filter(i=>i.color===c).length),counts);
 }
});
test('legacy missing or inconsistent counts still preserve the displayed total',()=>{
 assert.deepEqual(returnCounts(3,undefined),[3,0,0,0]);
 const counts=returnCounts(11,[1,2,0,0]);assert.equal(counts.reduce((a,b)=>a+b,0),11);assert.equal(counts[2],0);assert.equal(counts[3],0);
});
test('a small mixed-color group enters one at a time',()=>{
 assert.deepEqual(rainFrame([1,1,1,1],.19).emitted,[1,0,0,0]);
 assert.deepEqual(rainFrame([1,1,1,1],.37).emitted,[1,1,0,0]);
});
