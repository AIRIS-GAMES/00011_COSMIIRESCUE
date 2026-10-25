import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[1280,720],[844,390],[390,844],[568,320]]){
  await page.setViewportSize({width,height});await page.goto('http://localhost:5180/?analytics=off&opening=off');await page.locator('#loading').waitFor({state:'hidden'});
  await page.screenshot({path:`test-results/community-title-${width}.png`});
  await page.locator('#open-characters').click();assert.equal(await page.locator('.character-card').count(),5);
  assert.match(await page.locator('.character-description').innerText(),/フライ検定3級。/);
  for(const id of ['pink','blue','red','purple','green']){
   await page.locator(`[data-character=${id}]`).click();assert.equal(await page.locator(`[data-character=${id}]`).getAttribute('aria-pressed'),'true');assert.match(await page.locator('.character-main').getAttribute('src'),new RegExp(id));
  }
  assert.equal(await page.locator('.character-card img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
  await page.screenshot({path:`test-results/community-characters-${width}.png`});
  await page.keyboard.press('Escape');await page.locator('#title').waitFor({state:'visible'});assert.equal(await page.locator('#open-characters').evaluate(e=>e===document.activeElement),true);
  await page.locator('#open-social').click();assert.equal(await page.locator('.social-link:disabled').count(),3);
  await page.screenshot({path:`test-results/community-social-${width}.png`});await page.locator('.community-back').click();
 }
 await page.route('**/src/community-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const socialLinks=[{id:'x',url:'https://example.com/account'},{id:'instagram',url:'javascript:alert(1)'},{id:'line',url:'https://example.com/stickers',characterUrls:{green:'https://example.com/green'}}];"}));
 await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#open-social').click();
 assert.equal(await page.locator('.social-links a').count(),2);assert.equal(await page.locator('.instagram').isDisabled(),true);
 await page.evaluate(async()=>{const {analytics}=await import('/src/analytics.js');window.measured=[];analytics.send=(...args)=>window.measured.push(args);});
 const link=page.locator('a.line');assert.equal(await link.getAttribute('target'),'_blank');assert.match(await link.getAttribute('rel'),/noopener/);
 await page.route('https://example.com/**',route=>route.fulfill({body:'Fixture destination'}));
 const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),'https://example.com/stickers');await popup.close();
 assert.ok(await page.evaluate(()=>window.measured.some(c=>c[1]==='Interest:external_click:title:line:group')));
 await page.locator('.community-back').focus();await page.keyboard.press('Shift+Tab');assert.equal(await link.evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.locator('.community-back').evaluate(e=>e===document.activeElement),true);
 await page.locator('.community-back').click();await page.locator('#open-characters').click();await page.locator('[data-character=green]').click();
 const directPromise=page.waitForEvent('popup');await page.locator('.character-sticker').click();const direct=await directPromise;await direct.waitForLoadState();assert.equal(direct.url(),'https://example.com/green');await direct.close();
 assert.ok(await page.evaluate(()=>window.measured.some(c=>c[1]==='Interest:external_click:encyclopedia:line:green')));
 await page.locator('.community-back').click();await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});await page.locator('#pause').click();await page.locator('#resume').click();
 assert.deepEqual(errors,[]);console.log('PASS: four screen sizes, five character selections, approved copy, disabled/configured links, external navigation, focus trap, play/pause.');
}finally{await browser.close();}
