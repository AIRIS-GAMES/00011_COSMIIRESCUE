import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[390,844],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',r=>r.abort());
  await page.goto('http://localhost:5180/?opening=off&analytics=off');
  await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.locator('#home-settings').click();
  const dialog=page.locator('.ranking-name-dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(()=>dialog.evaluate(e=>e.style.transform)).toBe(width<height?'rotate(90deg)':'none');
  assert.ok(await page.locator('#home-settings img').evaluate(e=>e.complete&&e.naturalWidth>0));
  for(const selector of ['#settings-bgm-toggle','#ranking-editor-input','.ranking-name-cancel','.ranking-name-card button[type=submit]'])await expect(page.locator(selector)).toBeInViewport({ratio:1});
  await page.locator('#settings-bgm-toggle').click();
  await expect(page.locator('#settings-bgm-toggle')).toHaveAttribute('aria-pressed','false');
  await page.locator('#ranking-editor-input').fill('Cosmii');
  await expect.poll(()=>dialog.evaluate(e=>e.style.transform)).toBe('none');
  await page.locator('.ranking-name-card button[type=submit]').click();
  await expect(dialog).not.toBeVisible();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-auto-ranking:cosmii-rescue-v1')).name),undefined);
  await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.locator('#home-settings').click();
  await expect.poll(()=>dialog.evaluate(e=>e.style.transform)).toBe(width<height?'rotate(90deg)':'none');
  await expect(page.locator('#settings-bgm-toggle')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#ranking-editor-input')).toHaveValue('Cosmii');
  await page.screenshot({path:`test-results/home-settings-${width}.png`});
  await page.locator('#settings-bgm-toggle').click();
  await expect(page.locator('#settings-bgm-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.ranking-name-cancel').click();
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS home settings: three mobile sizes, BGM persistence, nickname persistence without ranking consent');
}finally{await browser.close();}
