import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}});
 await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
 await p.locator('#sound').click();await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 // Isolated browser context: the user's records are never modified.
 await p.evaluate(async()=>{const g=(await import('/src/main.js')).game;g.score=1234;g.rescued=7;g.maxCarry=9;g.finish('hit');});
 await p.locator('#result').waitFor({state:'visible'});assert.equal(await p.locator('#result-best').textContent(),'1,234');
 await p.reload();await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#title-best').textContent(),'1,234');
 assert.equal(await p.locator('#sound').getAttribute('aria-label'),'音をオンにする');await p.locator('#records').click();assert.match(await p.locator('#record-list').textContent(),/1,234.*7 RESCUED/);
 console.log('PASS: game-over score, rescue record and mute setting survive page reload.');
}finally{await browser.close();}
