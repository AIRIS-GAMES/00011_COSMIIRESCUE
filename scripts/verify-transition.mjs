import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
 await p.locator('#start').click();await p.waitForTimeout(200);
 assert.ok(await p.locator('#title').isVisible());await p.screenshot({path:'test-results/transition-enter.png'});
 await p.waitForFunction(()=>document.querySelector('.face-transition').dataset.phase==='covered');
 assert.ok(await p.locator('#title').isHidden());
 assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.time),0);
 await p.screenshot({path:'test-results/transition-covered.png'});
 await p.locator('.face-transition').waitFor({state:'hidden'});await p.waitForTimeout(100);
 await p.locator('#pause').click();const time=await p.evaluate(async()=>(await import('/src/main.js')).game.time);
 await p.locator('#resume').click();assert.ok(await p.locator('.face-transition').isHidden());
 await p.locator('.face-transition').waitFor({state:'hidden'});await p.waitForTimeout(100);
 assert.ok(await p.evaluate(async()=>(await import('/src/main.js')).game.time)>time);
 assert.deepEqual(errors,[]);console.log('PASS: PLAY face wipe and instant RESUME, covered scene switch, frozen simulation and resumed input.');
}finally{await browser.close();}
