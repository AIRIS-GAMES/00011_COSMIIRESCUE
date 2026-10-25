import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const base of ['','/dist']){
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(new URL(r.url()).hostname==='localhost'&&r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto('http://localhost:5180'+base+'/index.html?analytics=off');
 await p.evaluate(()=>localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,practice:true,counts:[0,0,0,0]})));await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});
 await p.locator('#open-characters').click();await expect(p.locator('[data-character=green]')).toHaveAttribute('data-locked','false');await p.locator('[data-character=blue]').click();await expect(p.locator('[data-character=blue]')).toHaveAttribute('data-locked','true');await expect(p.locator('.character-details h4')).toHaveCount(0);
 await p.screenshot({path:'test-results/collection-locked'+(base?'-dist':'')+'.png'});
 await p.locator('[data-tab=items]').click();await expect(p.locator('.item-card[data-collected=false]')).toHaveCount(3);await p.locator('.community-back').click();await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 await p.evaluate(async(base)=>{const {game:g}=await import(base+'/src/main.js');g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.friends=[];g.stage.spawns=[];g.stage.zones=[];g.items=[{id:'apple',x:g.player.x,y:g.player.y}];g.spawnFriend({x:g.player.x,y:g.player.y,kind:1});g.homes=[{x:g.player.x+18,y:g.player.y,radius:65}];g.stage.home=g.homes[0];},base);
 await p.waitForFunction(async(base)=>{const {progress}=await import(base+'/src/main.js');return progress.data.counts[1]===1&&progress.data.items.apple===1;},base);
 await p.locator('#pause').click();await p.locator('#quit').click();await p.locator('#result').waitFor({state:'visible'});await p.locator('#return-memory button').click();await expect(p.locator('[data-character=blue]')).toHaveAttribute('data-locked','false');assert.equal(await p.locator('.character-details h4').count(),3);
 await p.screenshot({path:'test-results/collection-open'+(base?'-dist':'')+'.png'});
 await p.locator('[data-tab=items]').click();await expect(p.locator('[data-item=apple]')).toHaveAttribute('data-collected','true');await expect(p.locator('[data-item=apple] .item-count')).toContainText('1');
 for(const size of [{width:568,height:320},{width:390,height:844}]){await p.setViewportSize(size);await p.screenshot({path:`test-results/collection-items-${size.width}${base?'-dist':''}.png`});}
 await p.locator('.community-back').click();await expect(p.locator('#result')).toBeVisible();await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await p.locator('#open-characters').click();await expect(p.locator('[data-character=blue]')).toHaveAttribute('data-locked','false');await p.locator('[data-tab=items]').click();await expect(p.locator('[data-item=apple] .item-count')).toContainText('1');
 assert.deepEqual(errors,[]);console.log('PASS collection browser',base||'development');await p.close();
}}finally{await browser.close();}
