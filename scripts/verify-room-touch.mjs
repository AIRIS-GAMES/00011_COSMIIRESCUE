import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:true});
  await page.addInitScript(()=>{if(!localStorage.getItem('cosmii-psf-v1'))localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[1,1,1,1]}));});
  await page.goto('http://localhost:5180/index.html?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();
  for(const id of ['green','pink','blue','red','purple']){
   const actor=page.locator(`[data-resident^="${id}-"]`);await actor.focus();await actor.click();await page.locator('.room-interact').click();
   await expect(page.locator('.community-header')).toBeHidden();await expect(page.locator('.room-focus-back')).toBeInViewport({ratio:1});
   assert.equal(await page.locator('.room-focus-back').innerText(),'もどる');
   const target=page.locator('.room-pet-target');await expect.poll(()=>target.locator('img').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
   // Freeze only the tap effect for inspecting its origin and silhouette.
   await page.addStyleTag({content:'.room-tap-neon{animation-play-state:paused!important}'});
   const box=await target.boundingBox(),x=box.x+box.width*.63,y=box.y+box.height*.45;
   await page.touchscreen.tap(x,y);
   const fx=page.locator('.room-tap-neon').last();await expect(fx).toHaveAttribute('data-character',id);
   const point=await fx.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,mask:getComputedStyle(el,'::before').maskImage};});
   assert.ok(Math.abs(point.x-x)<4&&Math.abs(point.y-y)<4,JSON.stringify({point,x,y}));assert.ok(point.mask.includes('/Asset/room/walk/'+id+'/3.png'));
   await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','happy');
   if(id==='pink')await page.screenshot({path:`test-results/neon-touch-${width}.png`});
   await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','idle');await target.click();await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','confused');
   await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','idle');await target.click();
   await page.waitForTimeout(450);await target.click();await expect(page.locator('.room-focus')).toHaveAttribute('data-reaction','annoyed');
   assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('cosmii-friend-room-v2')).trust[id],id),0);
   await page.locator('.room-focus-back').click();await expect(page.locator('.room-trust-track')).toHaveAttribute('aria-valuenow','4');
   await page.locator('.room-interact').click();await page.locator('.room-focus-back').click();await expect(page.locator('.room-trust-track')).toHaveAttribute('aria-valuenow','4');
  }
  await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});await page.locator('#open-room').click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-friend-room-v2')).trust),{green:4,pink:4,blue:4,red:4,purple:4});
  console.log('PASS neon position, all moods, per-color trust and persistence',width,height);await page.close();
 }
}finally{await browser.close();}
