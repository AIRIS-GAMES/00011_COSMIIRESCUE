import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueAnalytics} from '../src/analytics.js';
const game={mode:'hard',score:600,rescued:3,maxCarry:5,bestReturn:600,time:40,travel:100};
test('analytics records checkpoint at commitment, not per animation; death is recorded once',()=>{
 const calls=[],a=new RescueAnalytics((...args)=>calls.push(args));a.start(game);a.event({type:'return',count:3,total:600},game);
 for(let i=0;i<2;i++)a.event({type:'bank',points:200},game);
 assert.equal(calls.filter(c=>c[1]==='Checkpoint:Count:hard').length,1);
 a.event({type:'bank',points:200},game);a.event({type:'bank',points:200},game);
 assert.equal(calls.filter(c=>c[1]==='Checkpoint:Count:hard').length,1);
 assert.ok(calls.some(c=>c[1]==='Checkpoint:Points:hard'&&c[2]===600));
 a.event({type:'finish',reason:'hit'},game);a.end(game,'quit');a.event({type:'gameOver'},game);
 assert.equal(calls.filter(c=>c[0]==='addProgressionEvent'&&c[1]==='Fail').length,1);
 assert.ok(calls.some(c=>c[1]==='Run:Score:hard'&&c[2]===600));
});
test('SDK load queues events after initialization and configures bounded dimensions',async()=>{
 const calls=[],a=new RescueAnalytics();a.start({...game,mode:'normal'});await a.initialize('development',async()=>({default:(...args)=>calls.push(args)}));
 assert.ok(calls.findIndex(c=>c[0]==='initialize')<calls.findIndex(c=>c[0]==='addProgressionEvent'));
 assert.ok(calls.some(c=>c[0]==='setCustomDimension01'&&c[1]==='normal'));
 a.end(game,'quit');assert.equal(calls.filter(c=>c[0]==='addProgressionEvent').length,1);
});
test('blocked analytics stays bounded and never throws into gameplay',async()=>{
 const a=new RescueAnalytics();for(let i=0;i<200;i++)a.call('addDesignEvent','test');assert.equal(a.queue.length,128);
 await a.initialize('development',async()=>{throw Error('blocked');});assert.equal(a.queue.length,0);a.start(game);a.end(game,'death');
 const b=new RescueAnalytics(()=>{throw Error('unavailable');});assert.doesNotThrow(()=>{b.start(game);b.end(game,'death');});
});
