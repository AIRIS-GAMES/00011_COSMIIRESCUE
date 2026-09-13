import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
 await p.locator('#mode-hard').tap();assert.equal(await p.locator('#mode-hard').getAttribute('aria-pressed'),'true');await p.screenshot({path:'test-results/hard-menu.png'});
 await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').tap();await p.waitForTimeout(450);
 assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.mode),'hard');assert.equal(await p.locator('#hearts').innerText(),'HARD');assert.equal(await p.locator('#direction-pad small').isVisible(),false);
 await p.evaluate(async()=>{const {game:g}=await import('/src/main.js');g.carry=[];g.cooldown=0;g.hitstop=0;g.hit();});await p.locator('#result').waitFor({state:'visible'});assert.match(await p.locator('#result-eyebrow').innerText(),/HARD/);
 await p.locator('#retry').tap();await p.locator('.face-transition').waitFor({state:'hidden'});assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.mode),'hard');
 await p.setViewportSize({width:667,height:320});await p.locator('#flap').tap();await p.waitForTimeout(450);await p.locator('#pause').tap();await p.locator('#quit').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.screenshot({path:'test-results/hard-menu-small.png'});const box=await p.locator('#mode-hard').boundingBox();assert.ok(box.y>=0&&box.y+box.height<320);await p.locator('#mode-normal').tap();assert.equal(await p.locator('#mode-normal').getAttribute('aria-pressed'),'true');assert.deepEqual(errors,[]);console.log('PASS: mode selection, hard death, retry, HUD and short landscape menu.');
}finally{await browser.close();}
