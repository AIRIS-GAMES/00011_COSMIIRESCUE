import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height,base] of [[568,320,''],[844,390,'/dist'],[390,844,'']]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
  await page.addInitScript(()=>{if(!localStorage.getItem('cosmii-psf-v1'))localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[3,4,5,18]}));});
  await page.goto(`http://localhost:5180${base}/index.html?opening=off&goal=off&analytics=off`);await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();
  await expect(page.locator('.room-resident')).toHaveCount(5);
  const first=page.locator('.room-resident').first(),start=await first.getAttribute('style');await expect.poll(()=>first.getAttribute('style')).not.toBe(start);
  await page.screenshot({path:`test-results/cabinet-room-${width}.png`});
  for(const id of ['green','pink','blue','red','purple'])await expect(page.locator(`.room-resident[data-resident^="${id}-"]`)).toHaveCount(1);
  const walkImg=first.locator('img'),walkStart=await walkImg.getAttribute('src');await expect.poll(()=>walkImg.getAttribute('src')).not.toBe(walkStart);
  await expect(walkImg).toHaveAttribute('src',/Asset\/room\/walk\/green/);
  const progressBefore=await page.evaluate(()=>localStorage.getItem('cosmii-psf-v1'));
  for(const id of ['green','pink','blue','red','purple']){
   const actor=page.locator(`.room-resident[data-resident^="${id}-"]`).first();await actor.focus();await actor.click();await page.locator('.room-interact').click();await expect(page.locator('.room-focus')).toBeVisible();
   const target=page.locator('.room-pet-target'),img=target.locator('img');await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);const idle=await img.getAttribute('src');await target.click();await expect.poll(()=>img.getAttribute('src')).not.toBe(idle);
   if(id==='pink')await page.screenshot({path:`test-results/cabinet-touch-${width}.png`});
   await page.locator('.room-focus-back').click();await expect(page.locator('.cabinet-room')).toBeVisible();
  }
  await page.locator('.room-decor-toggle').click();
  for(const [slot,prop] of [[0,'cushion'],[1,'plant'],[2,'chest'],[3,'lamp']]){await page.locator(`[data-slot="${slot}"]`).click();await page.locator(`[data-prop="${prop}"]`).click();await expect(page.locator(`[data-prop="${prop}"]`)).toHaveAttribute('aria-pressed','true');}
  await page.screenshot({path:`test-results/cabinet-decor-${width}.png`});await page.keyboard.press('Escape');await expect(page.locator('.room-decor')).toBeHidden();await expect(page.locator('.cabinet-prop')).toHaveCount(4);
  await page.screenshot({path:`test-results/cabinet-furnished-${width}.png`});
  assert.equal(await page.evaluate(()=>localStorage.getItem('cosmii-psf-v1')),progressBefore);
  await page.locator('.community-back').click();await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();await expect(page.locator('.cabinet-prop')).toHaveCount(4);
  for(const img of await page.locator('.cabinet-room img').all())await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  for(const selector of ['.room-interact','.room-decor-toggle','.community-back'])await expect(page.locator(selector)).toBeInViewport({ratio:1});
  assert.deepEqual(errors,[]);console.log('PASS walking, all faces, decoration, persistence:',width,height,base);await page.close();
 }
 const page=await browser.newPage({locale:'ja-JP',viewport:{width:568,height:320}});await page.goto('http://localhost:5180/index.html?opening=off&goal=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();await expect(page.locator('.room-resident')).toHaveCount(1);await page.locator('.room-decor-toggle').click();await page.locator('[data-prop="lamp"]').click({force:true});await expect(page.locator('[data-prop="lamp"]')).toHaveAttribute('aria-disabled','true');await expect(page.locator('.room-decor-message')).toContainText('30');await expect(page.locator('.cabinet-prop')).toHaveCount(1);console.log('PASS locked furnishings, empty collection');await page.close();
}finally{await browser.close();}
