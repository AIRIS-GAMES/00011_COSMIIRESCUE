import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const p=await browser.newPage({viewport:{width:844,height:390}});await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
for(let i=0;i<2;i++){await p.evaluate(async()=>{const g=(await import('/src/main.js')).game;g.returnLock=0;g.rescue(g.friends[0]);g.beginReturn();while(g.bankQueue.length)g.bankOne();});await p.waitForTimeout(80);}
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-endless-v1')));assert.equal(saved.runs.length,1);assert.equal(saved.runs[0].rescued,2);assert.ok(saved.best>0);
await p.reload();await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#title-best').textContent(),saved.best.toLocaleString());await p.locator('#records').click();assert.equal(await p.locator('#record-list li').count(),1);console.log('PASS: checkpoint-only autosave survives reload without game over and without duplicate records.');
}finally{await browser.close();}
