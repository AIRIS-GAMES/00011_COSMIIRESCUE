import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
// Room friendship: level chip + hearts, a greeting line, play (3 catches) and brush (fill the meter) each give trust once a day, level-up card.
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[390,844]]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('cosmii-psf-v1')){localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[3,4,5,18]}));localStorage.setItem('cosmii-friend-room-v2',JSON.stringify({character:'pink',slots:['cushion',null,null,null],trust:{green:0,pink:36,blue:0,red:0,purple:0}}));}});
  await page.route('https://*.supabase.co/**',r=>r.abort());
  await page.goto('http://localhost:5180/?opening=off&goal=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  const trust=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-friend-room-v2')).trust.pink);
  await page.locator('#open-room').click();await expect(page.locator('.room-trust-value')).toHaveText('2');
  await page.locator('.room-interact').click();
  await expect(page.locator('.room-friend-level')).toHaveText('Lv2 ちょっとなかよし');await expect(page.locator('.room-friend-hearts img[src*="full"]')).toHaveCount(2);
  await expect(page.locator('.room-speech')).toHaveText('あ、また来たの。');
  for(const sel of ['.room-friend-chip','.room-activity[data-activity="play"]','.room-activity[data-activity="brush"]','.room-snack-toggle'])await expect(page.locator(sel)).toBeInViewport({ratio:1});
  // あそぶ
  await page.locator('.room-activity[data-activity="play"]').click();await expect(page.locator('.room-ball')).toBeVisible();
  for(let i=0;i<3;i++){await page.locator('.room-ball').click({force:true});await page.waitForTimeout(1400);}
  await expect.poll(trust).toBe(39);await expect(page.locator('.room-activity[data-activity="play"]')).toHaveAttribute('data-done','true');
  // おせわ → level 3
  await page.waitForTimeout(400);await page.locator('.room-activity[data-activity="brush"]').click();await expect(page.locator('.room-brush-meter')).toBeVisible();
  const t=await page.locator('.room-pet-target').boundingBox();await page.mouse.move(t.x+t.width*.3,t.y+t.height*.4);await page.mouse.down();
  for(let i=0;i<16&&await page.locator('.room-brush-meter').isVisible();i++)await page.mouse.move(t.x+t.width*(i%2?.3:.7),t.y+t.height*(.35+(i%3)*.08),{steps:6});
  await page.mouse.up();await expect.poll(trust).toBe(42);
  await expect(page.locator('.room-levelup')).toContainText('Lv3 なかよし');await expect(page.locator('.room-friend-level')).toHaveText('Lv3 なかよし');
  // Once a day: playing again adds nothing.
  await page.waitForTimeout(3000);await page.locator('.room-activity[data-activity="play"]').click();
  for(let i=0;i<3;i++){await page.locator('.room-ball').click({force:true});await page.waitForTimeout(1400);}
  await expect(page.locator('.room-ball')).toBeHidden();assert.equal(await trust(),42);
  await page.screenshot({path:`test-results/friendship-${width}.png`});
  await page.locator('.room-focus-back').click();await expect(page.locator('.room-trust-value')).toHaveText('3');
  // Leaving in the middle of a throw must not leave the Cosmii moved or mirrored on the next visit.
  await page.locator('.room-interact').click();await page.locator('.room-activity[data-activity="play"]').click();await page.locator('.room-ball').click({force:true});await page.waitForTimeout(200);
  await page.locator('.room-focus-back').click();await page.locator('.room-interact').click();await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(()=>{const t=document.querySelector('.room-pet-target');return [t.getAnimations().length,getComputedStyle(t).translate,document.querySelector('.room-pet-target img').style.transform];}),[0,'none','']);
  await page.locator('.room-focus-back').click();
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS friendship levels, lines, play/brush once a day, level-up');
}finally{await browser.close();}
