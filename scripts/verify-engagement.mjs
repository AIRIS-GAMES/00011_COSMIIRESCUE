import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://*.gameanalytics.com/**',route=>route.abort());
 await page.addInitScript(()=>localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[10,10,10,10]})));
 await page.goto('http://localhost:5180/?analytics=off&opening=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
 await page.evaluate(async()=>{window.metrics=[];const {analytics}=await import('/src/analytics.js');analytics.send=(...args)=>window.metrics.push(args);});
 await page.locator('#open-room').click();
 await page.locator('[data-resident^="pink-"]').click();await page.locator('.room-interact').click();
 await page.locator('.room-pet-target').click();await page.locator('.room-focus-back').click();
 await page.locator('.room-decor-toggle').click();await page.locator('[data-prop="plant"]').click();await page.locator('[data-prop="plant"]').click();await page.locator('.room-decor-done').click();
 await page.locator('.room-return-total').click();await page.locator('.return-close').click();
 await page.locator('.community-back').click();await page.locator('#open-room').click();
 await page.locator('.room-interact').click();
 await page.evaluate(async()=>{const {communityUI}=await import('/src/main.js');communityUI.close();communityUI.close();});
 const events=await page.evaluate(()=>window.metrics);
 const count=id=>events.filter(e=>e[1]===id).length;
 for(const id of ['room_open:room:first','room_open:room:revisit','room_select:room:pink','focus_end:room:pink','focus_abandon:room:pink','decor_open:room:group','decor_change:room:plant','returns_open:room:group'])assert.equal(count('Engagement:v1:'+id),1,id);
 assert.equal(events.find(e=>e[1]==='Engagement:v1:trust_gain:room:pink')[2],1);
 assert.deepEqual(errors,[]);console.log('PASS room intent, trust, decor, celebration, revisit, abandon and duplicate guards; no GA traffic');
}finally{await browser.close();}
