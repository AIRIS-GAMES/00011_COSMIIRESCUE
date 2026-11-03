import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[568,320],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5180/?opening=off&analytics=off');
  await page.locator('#boot-screen').waitFor({state:'hidden'});
  async function back(selector){
   const b=page.locator(selector);await expect(b).toBeInViewport({ratio:1});
   await expect(b.locator('small')).toHaveText('もどる');
   assert.equal(await b.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true);
   const pos=await b.evaluate(el=>{const r=el.getBoundingClientRect(),g=document.querySelector('#game').getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');return rotated?{left:r.top-g.top,bottom:r.left-g.left}:{left:r.left-g.left,bottom:g.bottom-r.bottom};});
   assert.ok(pos.left<30&&pos.bottom<30,JSON.stringify(pos));await b.click();
  }
  for(const id of ['open-social','open-characters','open-room']){
   await page.locator('#'+id).click();
   if(id==='open-social')for(const link of await page.locator('.social-accounts .social-link').all())await expect(link).toBeInViewport({ratio:1});
   if(id==='open-room'){
    await page.locator('.room-resident').first().focus();await page.locator('.room-resident').first().click();await page.locator('.room-interact').click();
    await expect(page.locator('.community-back')).toBeHidden();await back('.room-focus-back');
    await page.locator('.room-return-total').click();await expect(page.locator('.community-back')).toBeHidden();await back('.return-close');
   }
   await page.screenshot({path:`test-results/navigation-${id}-${width}.png`});
   await back('.community-back');await expect(page.locator('#title')).toBeVisible();
  }
  await page.locator('#mode-rule').click();await back('.mode-rules-close');
  await page.locator('#records').click();await back('#close-records');
  await page.locator('#practice-start').click();await expect(page.locator('#practice-guide')).toHaveAttribute('data-step','0');await page.locator('.face-transition').waitFor({state:'hidden'});
  const a=await page.locator('#tutorial-title').boundingBox(),b=await page.locator('#direction-pad').boundingBox();
  assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'Back must not overlap movement');
  await page.screenshot({path:`test-results/navigation-practice-${width}.png`});await back('#tutorial-title');await expect(page.locator('#title')).toBeVisible();
  assert.deepEqual(errors,[]);console.log('PASS navigation, nested returns, SNS visibility and joystick separation',width,height);await page.close();
 }
}finally{await browser.close();}
