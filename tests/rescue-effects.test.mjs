import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/renderer.js';
test('mass rescue keeps every character reaction but bounds expensive POP decoration',()=>{
 let reactions=0;const particles=[],labels=[];
 const renderer={bursts:[],reactions:{event(){reactions++;}},burst:(x,y,n)=>particles.push(n),popup:t=>labels.push(t)};
 const event={type:'rescue',x:100,y:100,kind:0};
 for(let i=0;i<50;i++)Renderer.prototype.event.call(renderer,event,{time:1});
 assert.equal(reactions,50);assert.equal(renderer.bursts.length,1);assert.deepEqual(particles,[10]);assert.deepEqual(labels,['ポン！']);
 Renderer.prototype.event.call(renderer,event,{time:1.05});assert.equal(renderer.bursts.length,1);
 Renderer.prototype.event.call(renderer,event,{time:1.13});assert.equal(renderer.bursts.length,2);
});
