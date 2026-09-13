import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5180');await page.locator('#loading').waitFor({state:'hidden'});await page.screenshot({path:'test-results/landscape-title.png'});await page.locator('#start').click();
  await page.evaluate(async()=>{window.g=(await import('/src/main.js')).game;});
  // Controlled visual scenario: do not present as a naturally played score.
  await page.evaluate(()=>{for(const f of g.friends.slice(0,8))g.rescue(f);g.player.y=500;});
  for(let i=0;i<3;i++){await page.keyboard.press('Space');await page.waitForTimeout(420);}
  await page.evaluate(()=>{document.getElementById('tutorial').hidden=true;});await page.screenshot({path:'test-results/landscape-carry.png'});
  assert.equal(await page.evaluate(async()=>(await import('/src/main.js')).renderer.assets.flapFrames.length),4);
  await page.evaluate(()=>{g.player.y=15000;g.world.extend(g);});await page.waitForTimeout(500);assert.ok(await page.evaluate(async()=>{const r=(await import('/src/main.js')).renderer;return r.camera.y>14000&&g.player.y>15000;}));await page.screenshot({path:'test-results/landscape-depth.png'});assert.deepEqual(errors,[]);
  console.log('PASS: new cast and four motion frames load; carry renders without errors.');
}finally{await browser.close();}
