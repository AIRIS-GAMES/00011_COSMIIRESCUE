import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[568,320],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[1,1,1,1]})));
  await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.evaluate(async()=>{window.metrics=[];(await import('/src/analytics.js')).analytics.send=(...args)=>window.metrics.push(args);});
  await page.locator('#open-room').click();await page.locator('[data-resident^="green-"]').click();await page.locator('.room-interact').click();
  for(const snack of ['apple','cherry','cake']){
   await page.locator('.room-snack-toggle').click();await expect(page.locator(`[data-snack="${snack}"]`)).toBeInViewport({ratio:1});await page.locator(`[data-snack="${snack}"]`).click();
   await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','eating');await expect(page.locator('.room-snack-toggle')).toBeDisabled();
   await page.locator(`[data-snack="${snack}"]`).evaluate(el=>el.click());
   if(snack==='apple')await page.screenshot({path:`test-results/snack-${width}.png`});
   await expect(page.locator('.room-snack-toggle')).toBeEnabled({timeout:5000});
  }
  await page.locator('.room-focus-back').click();await expect(page.locator('.room-trust-track')).toHaveAttribute('aria-valuenow','6');
  const events=await page.evaluate(()=>window.metrics);assert.equal(events.filter(e=>e[1]?.startsWith('Engagement:v1:snack_given')).length,3);
  assert.equal(events.find(e=>e[1]==='Engagement:v1:focus_touches:room:green')[2],0);
  await page.locator('.room-interact').click();await page.locator('.room-snack-toggle').click();await page.locator('[data-snack="apple"]').click();await page.locator('.room-focus-back').click();
  await expect(page.locator('.room-trust-track')).toHaveAttribute('aria-valuenow','8');
  await page.locator('.room-interact').click();await expect(page.locator('.room-snack-toggle')).toBeEnabled();await expect(page.locator('.room-snack-effect img')).toHaveCount(0);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS three snacks, mobile fit, reaction, duplicate guard, trust, analytics and early back cleanup');
}finally{await browser.close();}
