import test from 'node:test';
import assert from 'node:assert/strict';
import {RescueAnalytics} from '../src/analytics.js';
import {psfMeasure} from '../src/psf.js';
test('all seven tutorial stages remain distinct',()=>{
 const events=[],a=new RescueAnalytics((...args)=>events.push(args));
 for(let step=0;step<=6;step++)psfMeasure(a,'practice_step',step,'onboarding');
 assert.equal(new Set(events.map(e=>e[1])).size,7);
 assert.equal(events[6][1],'PSF:v2:practice_step:onboarding:step_6');
});
test('engagement bounds paths and rejects invalid values',()=>{
 const events=[],a=new RescueAnalytics((...args)=>events.push(args));
 a.engagement('room_open',{source:'room',revisit:true});
 a.engagement('trust_gain',{source:'room',characterType:'pink',value:2});
 a.engagement('private-name');a.engagement('focus_seconds',{value:NaN});
 a.engagement('decor_change',{source:'private',prop:'private'});
 assert.deepEqual(events.map(e=>e.slice(1)),[
 ['Engagement:v1:room_open:room:revisit',1],['Engagement:v1:trust_gain:room:pink',2],['Engagement:v1:decor_change:title:none',1]]);
 assert.doesNotThrow(()=>new RescueAnalytics(()=>{throw Error();}).engagement('room_open'));
});
test('skill activation counts successful simulation events, excludes practice and invalid kinds',()=>{
 const events=[],a=new RescueAnalytics((...args)=>events.push(args)),g={mode:'normal'};a.start(g);
 a.event({type:'skillStart',kind:1},g);a.event({type:'skillEnd',kind:1},g);
 a.event({type:'skillStart',kind:0},{...g,isTraining:true});a.event({type:'skillStart',kind:9},g);
 assert.deepEqual(events.filter(e=>e[1]?.startsWith('Skill:')), [['addDesignEvent','Skill:Activate:blue:normal',1]]);
});
