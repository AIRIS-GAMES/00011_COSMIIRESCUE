import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const base of ['','/dist']){
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://localhost:5180${base}/index.html?analytics=off`);
 await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#practice-guide')).toBeVisible();
 // Exit before completion: neither PLAY nor reload should force practice again.
 await p.locator('#tutorial-title').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 assert.equal(await p.evaluate(async(base)=>(await import(base+'/src/main.js')).progress.data.practice,base),false);
 await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 assert.equal(await p.evaluate(async(base)=>!!(await import(base+'/src/main.js')).game.isTraining,base),false);
 await expect(p.locator('#practice-guide')).toBeHidden();
 await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#opening-screen')).toBeHidden();await expect(p.locator('#practice-guide')).toBeHidden();
 await expect(p.locator('#practice-start')).toHaveText('遊び方');await p.locator('#practice-start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#practice-guide')).toBeVisible();
 await p.locator('#tutorial-title').click();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#intro-preview').click();await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#practice-guide')).toBeHidden();
 assert.deepEqual(errors,[]);console.log('PASS tutorial entry',base||'development');await p.close();
}}finally{await browser.close();}
