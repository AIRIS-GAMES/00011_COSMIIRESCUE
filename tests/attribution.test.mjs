import test from 'node:test';
import assert from 'node:assert/strict';
import {Attribution,attributionEvent} from '../src/attribution.js';
import {RescueAnalytics} from '../src/analytics.js';

test('advertising funnel only forwards approved milestones, not taps or arbitrary data',()=>{
 assert.deepEqual(attributionEvent('PSF:v2:first_return:normal',12.5),{name:'cosmii_first_return',values:{seconds:12.5}});
 assert.deepEqual(attributionEvent('PSF:v2:practice_complete:onboarding'),{name:'af_tutorial_completion',values:{af_success:true,source:'onboarding'}});
 assert.equal(attributionEvent('Engagement:v1:focus_touches:room:green',200),null);
 assert.equal(attributionEvent('Interest:external_click:title:private:group'),null);
 assert.equal(attributionEvent('Engagement:v1:focus_start:room:private'),null);
 assert.deepEqual(attributionEvent('Engagement:v1:trust_gain:room:pink',50).values,{color:'pink',amount:10});
});
test('web and automation never initialize SDK or keep pending data',async()=>{
 for(const options of [{native:false},{native:true,disabled:true}]){
  const a=new Attribution();a.track('PSF:v2:first_return:normal');await a.initialize({...options,load(){throw Error('must not load');}});
  assert.equal(a.state,'disabled');assert.equal(a.queue.length,0);
 }
});
test('pending consent queues at most 64 milestones, initializes once, flushes once',async()=>{
 let resolveInit,loads=0;const sent=[],a=new Attribution();
 const load=async()=>{loads++;return {plugin:{initialize:()=>new Promise(resolve=>resolveInit=resolve),track:e=>{sent.push(e);return Promise.resolve();}}};};
 const ready=a.initialize({native:true,load});a.initialize({native:true,load});
 for(let i=0;i<80;i++)a.track('PSF:v2:retry:normal');assert.equal(a.queue.length,64);
 await Promise.resolve();resolveInit({enabled:true});await ready;
 assert.equal(loads,1);assert.equal(sent.length,64);assert.equal(a.queue.length,0);
 a.track('Engagement:v1:focus_start:room:green');assert.equal(sent.length,65);
});
test('native load or delivery failure never affects gameplay',async()=>{
 const a=new Attribution();await a.initialize({native:true,load:async()=>{throw Error();}});assert.equal(a.state,'failed');
 const b=new Attribution();await b.initialize({native:true,load:async()=>({plugin:{initialize:async()=>({enabled:true}),track:async()=>{throw Error();}}})});
 assert.doesNotThrow(()=>b.track('PSF:v2:first_return:normal'));await Promise.resolve();
});
test('GameAnalytics readiness never duplicates forwarded AppsFlyer events',async()=>{
 const observed=[],a=new RescueAnalytics(null,(...args)=>observed.push(args));
 a.call('addDesignEvent','PSF:v2:first_return:normal',10);
 await a.initialize('development',async()=>({default:()=>{}}));
 assert.equal(observed.filter(e=>e[1]==='PSF:v2:first_return:normal').length,1);
});
