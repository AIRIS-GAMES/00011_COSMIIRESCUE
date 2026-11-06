import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height,total] of [[844,390,499],[390,844,500]]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(total=>{if(!localStorage.getItem('cosmii-psf-v1'))localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[total,0,0,0]}));},total);
  await page.goto('http://localhost:5180/?opening=off&goal=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.locator('#open-room').click();await page.locator('.room-decor-toggle').click();
  assert.equal(await page.locator('[data-prop]').count(),14);
  for(const img of await page.locator('.room-decor-options img').all())await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  const trophy=page.locator('[data-prop="trophy"]');await trophy.scrollIntoViewIfNeeded();
  await expect(page.locator('.room-decor-done')).toBeInViewport({ratio:1});
  await trophy.click({force:total===499});
  if(total===499){await expect(trophy).toHaveAttribute('aria-disabled','true');await expect(page.locator('.room-decor-message')).toContainText('あと1匹');}
  else{
   await expect(trophy).toHaveAttribute('aria-pressed','true');
   await page.locator('.room-decor-done').click();await page.screenshot({path:'test-results/decor-500-room.png'});
   await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();
   assert.equal(await page.locator('.cabinet-prop[src$="trophy.png"]').count(),1);
   await page.locator('.room-decor-toggle').click();await page.locator('[data-prop="trophy"]').scrollIntoViewIfNeeded();
  }
  await page.screenshot({path:`test-results/decor-${width}.png`});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS decor assets, mobile scroll, 499/500 unlock and placement persistence');
}finally{await browser.close();}
