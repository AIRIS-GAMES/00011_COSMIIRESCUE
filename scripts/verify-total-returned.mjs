import {chromium,expect} from '@playwright/test';import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});
try{for(const base of ['','/dist']){
 const p=await b.newPage({viewport:{width:568,height:320}});await p.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await p.addInitScript(()=>{if(!localStorage.getItem('cosmii-psf-v1'))localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,counts:[10,5,20,30]}));});
 await p.goto(`http://localhost:5180${base}/index.html?analytics=off`);await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#title-total-returned')).toContainText('65');
 for(const mode of ['normal','hard']){
 await p.locator('#mode-'+mode).click();await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 await p.evaluate(async base=>{const {game:g}=await import(base+'/src/main.js');g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.friends=[];g.homes=[];g.carry=[];for(let i=0;i<3;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:1}));g.beginReturn();g.finish('quit');},base);
 await p.locator('.result-social-close').click();await expect(p.locator('#result-rescued-stat')).toContainText('68');await expect(p.locator('#result-rescued')).toHaveText('3');await p.locator('#home').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 }
 await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#title-total-returned')).toContainText('68');await p.screenshot({path:`test-results/total-returned${base?'-dist':''}.png`});
 await p.setViewportSize({width:390,height:844});await expect(p.locator('#title-total-returned')).toBeVisible();assert.equal(await p.evaluate(async base=>(await import(base+'/src/main.js')).progress.totalReturned,base),68);
 console.log('PASS preserved total, normal increment, HARD excluded, reload:',base||'development');await p.close();
}}finally{await b.close();}
