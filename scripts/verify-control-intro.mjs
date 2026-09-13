import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
assert.ok(await p.locator('#game').evaluate(el=>el.classList.contains('controls-intro')));const before=await p.locator('#flap').boundingBox();assert.ok(before.x<650&&before.y<260);const time=await p.evaluate(async()=>(await import('/src/main.js')).game.time);await p.waitForTimeout(200);assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.time),time);await p.screenshot({path:'test-results/controls-center.png'});
await p.locator('#flap').tap();await p.waitForTimeout(500);assert.equal(await p.locator('#game').evaluate(el=>el.classList.contains('controls-intro')),false);const after=await p.locator('#flap').boundingBox();assert.ok(after.x>700);assert.ok(await p.evaluate(async()=>(await import('/src/main.js')).game.time)>time);await p.screenshot({path:'test-results/controls-docked.png'});console.log('PASS: central spotlight, frozen start, tap-to-dock, immediate lift and gameplay.');
}finally{await browser.close();}
