import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height,counts,base,reduced] of [[844,390,[3,4,5,18],'',false],[390,844,[3000,4000,5000,18000],'/dist',false],[568,320,[0,0,0,0],'',true]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(counts=>localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts})),counts);
  await page.goto(`http://localhost:5180${base}/index.html?opening=off&analytics=off`);await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#title-total-returned').click();
  await expect(page.locator('.room-celebration')).toBeVisible();await expect(page.locator('.return-close')).toBeFocused();
  await expect(page.locator('.return-result strong')).toHaveText(counts.reduce((a,b)=>a+b,0).toLocaleString('ja-JP')+'体！！');
  await page.waitForTimeout(reduced?100:2200);await page.screenshot({path:'test-results/home-returns-'+width+'.png'});
  assert.equal(await page.locator('.return-result strong').evaluate(el=>getComputedStyle(el).webkitTextStrokeColor),'rgb(24, 18, 28)');
  await page.locator('.return-close').click();await expect(page.locator('#title')).toBeVisible();await expect(page.locator('#title-total-returned')).toBeFocused();await expect(page.locator('.room-celebration')).toHaveCount(0);
  await page.locator('#open-room').click();
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.locator('.room-return-total').click();await expect(page.locator('.room-celebration')).toBeVisible();
  const total=counts.reduce((a,b)=>a+b,0);await expect(page.locator('.return-result strong')).toHaveText(total.toLocaleString('ja-JP')+'体！！');await expect(page.locator('.return-rain')).toHaveCount(1);await expect(page.locator('.room-celebration')).toHaveAttribute('data-rain-complete','true');await expect(page.locator('.room-celebration')).toHaveAttribute('data-arrived',String(total));await expect(page.locator('.room-celebration')).toHaveAttribute('data-arrived-colors',counts.join(','));
  await expect(page.locator('.return-close')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('.return-close')).toBeFocused();
  await page.waitForTimeout(reduced?100:2100);await page.screenshot({path:`test-results/return-celebration-${width}.png`});
  await expect(page.locator('.return-result strong')).toBeInViewport({ratio:1});await expect(page.locator('.return-close')).toBeInViewport({ratio:1});
  await page.keyboard.press('Escape');await expect(page.locator('.room-celebration')).toHaveCount(0);await expect(page.locator('.room-return-total')).toBeFocused();
  await page.locator('.room-return-total').click();await page.locator('.return-close').click();await expect(page.locator('.room-celebration')).toHaveCount(0);assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
  await page.locator('.room-decor-toggle').click();await expect(page.locator('.room-decor')).toBeVisible();assert.deepEqual(errors,[]);console.log('PASS celebration, count, replay, focus and unchanged saves',width,height,total);await page.close();
 }
}finally{await browser.close();}
