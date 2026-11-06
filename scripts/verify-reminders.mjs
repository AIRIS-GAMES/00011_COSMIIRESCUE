import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[568,320],[390,844]]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.reminderCalls=[];window.reminderState={enabled:false,permission:'prompt'};window.reminderTaps=[];
   window.webkit={messageHandlers:{bridge:{}}};
   window.Capacitor={getPlatform:()=> 'ios',isNativePlatform:()=>true,PluginHeaders:[{name:'CosmiiReminders',methods:['status','enable','disable','played','consumeTaps','openSettings'].map(name=>({name,rtype:'promise'}))}],nativePromise:async(plugin,method,options)=>{
    reminderCalls.push({method,options});
    if(method==='status')return {...reminderState};
    if(method==='enable'){reminderState={enabled:true,permission:'granted'};return {granted:true};}
    if(method==='disable'){reminderState.enabled=false;return {};}
    if(method==='consumeTaps'){const taps=reminderTaps;reminderTaps=[];return {taps};}
    return {};
   }};
  });
  await page.goto('http://localhost:5180/?opening=off&goal=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.evaluate(async()=>{window.events=[];(await import('/src/analytics.js')).analytics.send=(...args)=>events.push(args);});
  await expect(page.locator('#reminder-settings')).toBeInViewport({ratio:1});
  // The bell sits in the corner beside the settings gear, without touching it.
  {const bell=await page.locator('#reminder-settings').boundingBox(),gear=await page.locator('#home-settings').boundingBox(),c=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
   const overlap=!(bell.x+bell.width<=gear.x||gear.x+gear.width<=bell.x||bell.y+bell.height<=gear.y||gear.y+gear.height<=bell.y);
   assert.ok(!overlap,'bell does not overlap the gear');
   const best=await page.locator('.best-pill').boundingBox();assert.ok(bell.x+bell.width<=best.x||best.x+best.width<=bell.x||bell.y+bell.height<=best.y||best.y+best.height<=bell.y,'bell does not overlap the best pill');assert.ok(Math.hypot(c(bell).x-c(gear).x,c(bell).y-c(gear).y)<80,'bell is next to the gear');
   await page.screenshot({path:`test-results/reminders-title-${width}.png`});}
  assert.equal(await page.evaluate(()=>reminderCalls.some(c=>c.method==='enable')),false);
  await page.locator('#reminder-settings').click();await expect(page.locator('.reminder-status')).toContainText('OFF');await page.locator('.reminder-toggle').click();await expect(page.locator('.reminder-status')).toContainText('ON');
  await page.screenshot({path:`test-results/reminders-${width}.png`});
  await page.locator('.reminder-close').click();await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});await page.locator('#pause').click();
  assert.ok(await page.evaluate(()=>reminderCalls.some(c=>c.method==='played'&&c.options.active===true)));assert.ok(await page.evaluate(()=>reminderCalls.some(c=>c.method==='played'&&c.options.active===false)));
  await page.locator('#quit').click();await page.locator('#result').waitFor({state:'visible'});await page.locator('#home').click();await page.locator('.face-transition').waitFor({state:'hidden'});
  await page.locator('#reminder-settings').click();await page.locator('.reminder-toggle').click();await expect(page.locator('.reminder-status')).toContainText('OFF');await page.locator('.reminder-close').click();
  await page.evaluate(()=>{reminderState.permission='denied';reminderTaps=[{kind:'d1'}];document.dispatchEvent(new Event('cosmiiReminderOpened'));});
  // D1 announces today's missions: tapping it opens the mission list, then the player returns to the title.
  await expect(page.locator('#community-screen[data-mode="missions"]')).toBeVisible();await page.locator('#community-screen .community-back').click();await expect(page.locator('#title')).toBeVisible();
  await page.locator('#reminder-settings').click();await expect(page.locator('.reminder-ios')).toBeVisible();await expect(page.locator('.reminder-toggle')).toBeHidden();await page.locator('.reminder-ios').click();
  assert.equal(await page.evaluate(()=>events.filter(e=>e[1]==='Reminder:v1:opened:d1').length),1);
  assert.deepEqual(errors,[]);await page.close();console.log('PASS reminder settings and mocked native lifecycle',width,height);
 }
 const web=await browser.newPage({locale:'ja-JP'});await web.goto('http://localhost:5180/?opening=off&goal=off&analytics=off');await web.locator('#boot-screen').waitFor({state:'hidden'});await expect(web.locator('#reminder-settings')).toHaveCount(0);
}finally{await browser.close();}
