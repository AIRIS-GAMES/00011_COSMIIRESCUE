import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {otherGames} from '../src/other-games.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[568,320],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.context().route('https://apps.apple.com/**',r=>r.fulfill({status:200,body:'Test store destination'}));
  await page.addInitScript(()=>localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true})));
  await page.goto('http://localhost:5180/?analytics=off');
  await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.evaluate(async()=>{const {analytics}=await import('/src/analytics.js');window.captured=[];analytics.send=(...args)=>window.captured.push(args);});
  const menu=page.locator('#open-games');await expect(menu).toBeInViewport({ratio:1});
  await expect(page.locator('.community-entry button:visible')).toHaveCount(7);
  for(const button of await page.locator('.community-entry button:visible').all())await expect(button).toBeInViewport({ratio:1});
  await expect.poll(()=>menu.locator('img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  await page.screenshot({path:`test-results/other-games-menu-${width}.png`});
  await menu.click();await expect(page.locator('#community-heading')).toHaveText('ほかのゲーム');
  await expect(page.locator('.other-game-card')).toHaveCount(5);
  for(const game of otherGames){
   const card=page.locator(`[data-game-id="${game.id}"]`);
   await expect(card).toHaveAttribute('href',game.url);await expect(card).toBeInViewport({ratio:1});
   await expect.poll(()=>card.locator('img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
   const popupPromise=page.waitForEvent('popup');await card.click();const popup=await popupPromise;await popup.close();
  }
  const counts=await page.evaluate(()=>window.captured.filter(e=>e[0]==='addDesignEvent'&&e[1].startsWith('CrossPromo:')));
  assert.equal(counts.filter(e=>e[1]==='CrossPromo:v1:open:title').length,1);
  for(const game of otherGames)assert.equal(counts.filter(e=>e[1]===`CrossPromo:v1:store_click:${game.id}`).length,1);
  const overflow=await page.locator('.other-games-body').evaluate(e=>e.scrollHeight>e.clientHeight+1);assert.equal(overflow,false);
  await page.screenshot({path:`test-results/other-games-${width}.png`});
  await page.locator('#community-screen>.community-back').click();await expect(page.locator('#title')).toBeVisible();await expect(menu).toBeFocused();
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS seven-menu layout, five official links, images, click analytics, popup and back at three phone sizes');
}finally{await browser.close();}
