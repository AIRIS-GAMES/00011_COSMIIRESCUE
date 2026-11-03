import test from 'node:test';
import assert from 'node:assert/strict';
import {PadInput} from '../src/gamepad.js';
const pad=()=>({index:0,id:'test',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))});
test('standard mapping, deadzone, stick and D-pad',()=>{
 const input=new PadInput(),p=pad();assert.equal(input.poll([null,p],'play',0).connected,true);
 p.axes[0]=.1;assert.equal(input.poll([p],'play',1).axis,0);
 p.axes[0]=1;assert.equal(input.poll([p],'play',2).axis,1);
 p.buttons[14].pressed=true;assert.equal(input.poll([p],'play',3).axis,-1);
 p.mapping='';assert.equal(input.poll([p],'play',4).connected,false);
});
test('held buttons do not repeat or carry into a new screen or reconnection',()=>{
 const input=new PadInput(),p=pad();p.buttons[0].pressed=true;
 assert.equal(input.poll([p],'title',0).edges[0],false);
 p.buttons[0].pressed=false;input.poll([p],'title',1);p.buttons[0].pressed=true;
 assert.equal(input.poll([p],'title',2).edges[0],true);
 assert.equal(input.poll([p],'title',3).edges[0],false);
 assert.equal(input.poll([p],'play',4).edges[0],false);
 assert.equal(input.poll([],'play',5).disconnected,true);
 assert.equal(input.poll([],'play',6).disconnected,false);
 assert.equal(input.poll([p],'play',7).edges[0],false);
});
test('menu navigation repeats after delay and suspending primes buttons',()=>{
 const input=new PadInput(),p=pad();input.poll([p],'menu',0);p.buttons[13].pressed=true;
 assert.equal(input.poll([p],'menu',10).navigate,1);
 assert.equal(input.poll([p],'menu',100).navigate,0);
 assert.equal(input.poll([p],'menu',410).navigate,1);
 p.buttons[0].pressed=true;assert.equal(input.poll([p],'inactive',411).edges[0],false);
 assert.equal(input.poll([p],'menu',412).edges[0],false);
});
