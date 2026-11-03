import test from 'node:test';
import assert from 'node:assert/strict';
import {Reminders,installReminders} from '../src/reminders.js';
import {RescueAnalytics} from '../src/analytics.js';
test('reminders are inert on the web and native failures never interrupt play',async()=>{
 const r=installReminders(()=>{});assert.equal(r.loading,undefined);await r.played(true);await r.consume();
 const failed=new Reminders();assert.equal(await failed.initialize(async()=>{throw Error();}),false);await failed.played(false);
});
test('play lifecycle waits for native load and D1/D7 taps feed only fixed analytics',async()=>{
 const calls=[],events=[],r=new Reminders((...a)=>events.push(a));let resolve;
 const pending=r.initialize(()=>new Promise(done=>resolve=done));const play=r.played(true);
 let taps=[{kind:'d1'},{kind:'d7'},{kind:'unknown'}];
 resolve({plugin:{played:async data=>calls.push(data),consumeTaps:async()=>{const result={taps};taps=[];return result;}}});await pending;await play;
 await r.played(false);await r.consume();await r.consume();assert.deepEqual(calls,[{active:true},{active:false}]);assert.deepEqual(events,[['opened','d1'],['opened','d7']]);
 const sent=[],a=new RescueAnalytics((...args)=>sent.push(args));a.notification('opened','d1');a.notification('opened','d7');a.notification('opened','unknown');a.notification('permission_granted');
 assert.deepEqual(sent.map(c=>c[1]),['Reminder:v1:opened:d1','Reminder:v1:opened:d7','Reminder:v1:permission_granted']);
});
