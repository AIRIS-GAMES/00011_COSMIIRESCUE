import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const liveInit=process.argv.includes('--live-init');
 const page=await browser.newPage({viewport:{width:844,height:390}}),events=[],errors=[],initStatuses=[];
 page.on('response',response=>{if(response.url().includes('gameanalytics.com/remote_configs/')&&response.request().method()==='POST')initStatuses.push(response.status());});
 page.on('pageerror',e=>errors.push(e.message));
 // Exercise the real SDK, intercepting traffic so synthetic gameplay never reaches GA.
 await page.route('https://*.gameanalytics.com/**',async route=>{
   if(liveInit&&route.request().url().includes('/init'))return route.continue();
   const req=route.request();if(req.url().includes('/events'))events.push(...JSON.parse(req.postData()||'[]'));
   await route.fulfill({status:200,contentType:'application/json',body:req.url().includes('/init')?JSON.stringify({server_ts:Math.floor(Date.now()/1000),configs:[],configs_hash:'',ab_id:'',ab_variant_id:''}):'{}'});
 });
 await page.goto('http://localhost:5180');await page.locator('#loading').waitFor({state:'hidden'});
 await page.evaluate(async()=>{const {analytics}=await import('/src/analytics.js');analytics.failed=false;await analytics.initialize('development');});
 await page.locator('#mode-hard').click();await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});await page.locator('#flap').click();await page.waitForTimeout(500);
 await page.evaluate(async()=>{const {game:g}=await import('/src/main.js');g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];g.carry=[];for(const f of g.friends.slice(0,3))g.rescue(f);g.friends=[];g.beginReturn();});
 await page.waitForTimeout(600);
 await page.evaluate(async()=>{const {game:g}=await import('/src/main.js');g.cooldown=0;g.hitstop=0;g.hit();});await page.locator('#result').waitFor({state:'visible'});
 await page.waitForTimeout(9000);
 assert.ok(events.some(e=>e.category==='user'),'automatic session');
 assert.equal(events.filter(e=>e.event_id==='Start:Endless:hard').length,1);
 assert.equal(events.filter(e=>e.event_id==='Fail:Endless:hard').length,1);
 assert.equal(events.filter(e=>e.event_id==='Checkpoint:Count:hard').length,1);
 const checkpoint=events.find(e=>e.event_id==='Checkpoint:Rescued:hard');assert.equal(checkpoint.value,3);assert.equal(checkpoint.custom_01,'hard');assert.equal(checkpoint.custom_02,'development');assert.deepEqual(errors,[]);
 if(liveInit){assert.ok(initStatuses.some(s=>s===200||s===201),'real initialization accepted');console.log('PASS: real GameAnalytics initialization accepted; gameplay events intercepted.');}
 else console.log('PASS: real SDK serializes session, mode, checkpoint and death without duplicates; requests intercepted.');
}finally{await browser.close();}
