import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[390,844],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',r=>r.abort());
  await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
  await page.evaluate(async()=>{(await import('/src/main.js')).game.finish('quit');});await page.locator('.result-social-back').click();await page.locator('.ranking-entry button').click();
  const dialog=page.locator('.ranking-name-dialog');await expect(dialog).toBeVisible();
  const rotated=width<height;
  assert.equal(await dialog.evaluate(e=>e.style.transform),'none');
  await page.locator('#ranking-editor-input').fill('コスミー');
  for(const selector of ['#ranking-editor-input','.ranking-name-cancel','.ranking-name-card button[type=submit]'])await expect(page.locator(selector)).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/ranking-orientation-${width}.png`});
  // Model the visual viewport shrinking for a software keyboard, without changing device orientation.
  await page.evaluate(h=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:h});visualViewport.dispatchEvent(new Event('resize'));},rotated?470:160);
  assert.equal(await dialog.evaluate(e=>e.style.transform),'none');
  assert.ok(await dialog.evaluate(e=>e.scrollHeight<=e.clientHeight+1));
  await page.locator('.ranking-name-cancel').click();await expect(dialog).not.toBeVisible();await expect(page.locator('#result')).toBeVisible();
  assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('landscape-auto')),rotated);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS ranking input follows native keyboard orientation, keyboard viewport fit, Japanese input and cancel');
}finally{await browser.close();}
