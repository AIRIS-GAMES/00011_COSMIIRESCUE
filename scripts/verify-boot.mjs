import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180');await p.locator('#boot-logo').evaluate(img=>img.decode());
 assert.ok(await p.locator('#boot-screen').isVisible());await p.screenshot({path:'test-results/boot-portrait.png'});
 await p.locator('#boot-screen').waitFor({state:'hidden'});assert.ok(await p.locator('#rotate-screen').isVisible());
 assert.ok(await p.locator('.arcade').evaluate(el=>el.inert));
 await p.setViewportSize({width:844,height:390});await p.locator('#rotate-screen').waitFor({state:'hidden'});
 await p.locator('#start').click();await p.locator('#pause').waitFor({state:'visible'});
 await p.setViewportSize({width:390,height:844});await p.locator('#rotate-screen').waitFor({state:'visible'});
 await p.setViewportSize({width:844,height:390});await p.locator('#resume').click();await p.locator('#pause').click();await p.locator('#quit').click();
 assert.ok(await p.locator('#boot-screen').isHidden());await p.screenshot({path:'test-results/boot-landscape-menu.png'});
 assert.deepEqual(errors,[]);console.log('PASS: logo splash, portrait rotation gate, landscape menu, rotation pause, no splash on return.');
}finally{await browser.close();}
