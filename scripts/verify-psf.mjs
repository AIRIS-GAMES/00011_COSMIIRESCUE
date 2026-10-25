import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});
try{for(const base of ['','/dist']){
 const p=await b.newPage({viewport:{width:844,height:390}}),errors=[];
 await p.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(new URL(r.url()).hostname==='localhost'&&r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto('http://localhost:5180'+base+'/index.html?analytics=off');
 await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 await expect(p.locator('#practice-guide')).toBeVisible();
 let key=null,seen=new Set();
 for(let i=0;i<300;i++){
  const s=await p.evaluate(async(base)=>{const g=(await import(base+'/src/main.js')).game;return {step:g.practiceStep,left:g.leftDone,x:g.player.x,y:g.player.y,vy:g.player.vy,target:g.practiceStep===2?g.friends[0]:g.stage.home};},base);
  if(!seen.has(s.step)){seen.add(s.step);await p.screenshot({path:`test-results/practice-step-${s.step}.png`});}
  if(s.step===4)break;
  const next=s.step===0?(s.left?'ArrowRight':'ArrowLeft'):s.step===1?null:s.target.x>s.x?'ArrowRight':'ArrowLeft';
  if(next!==key){if(key)await p.keyboard.up(key);if(next)await p.keyboard.down(next);key=next;}
  if(s.step===1||(s.step>=2&&s.y>s.target.y-10&&s.vy>=0)){const box=await p.locator('#flap').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);}
  await p.waitForTimeout(40);
 }
 if(key)await p.keyboard.up(key);assert.ok(seen.has(4),'actual browser inputs should finish practice');await expect(p.locator('#tutorial-start')).toBeVisible();

 await p.locator('#tutorial-start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 // Deterministic encounter fixture: actual contact/collision/crossing in the running normal engine.
 await p.evaluate(async(base)=>{const {game:g}=await import(base+'/src/main.js');g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.friends=[];g.stage.spawns=[];g.stage.zones=[];g.player.x=600;g.player.y=650;g.player.vx=0;g.player.vy=0;g.spawnFriend({x:600,y:650,kind:1});g.homes=[{x:820,y:650,radius:65}];g.stage.home=g.homes[0];},base);
 await p.waitForTimeout(100);
 await p.evaluate(async(base)=>{const {game:g}=await import(base+'/src/main.js');g.obstacles=[{x:g.player.x,y:g.player.y,baseX:g.player.x,baseY:g.player.y,r:20,damage:2,disabled:0,motion:{x:0,y:0,speed:0}}];},base);
 await p.waitForTimeout(100);
 assert.equal(await p.evaluate(async(base)=>(await import(base+'/src/main.js')).game.blueUsed,base),true);
 await p.screenshot({path:'test-results/psf-defense'+(base?'-dist':'')+'.png'});
 await p.evaluate(async(base)=>{(await import(base+'/src/main.js')).game.obstacles=[];},base);
 for(let i=0;i<200;i++){
  const s=await p.evaluate(async(base)=>{const g=(await import(base+'/src/main.js')).game;return {returned:g.rescued,x:g.player.x,y:g.player.y,vy:g.player.vy,h:g.stage.home};},base);
  if(s.returned)break;
  const next=s.h.x>s.x?'ArrowRight':'ArrowLeft';if(next!==key){if(key)await p.keyboard.up(key);await p.keyboard.down(next);key=next;}
  if(s.y>s.h.y-10&&s.vy>=0){const box=await p.locator('#flap').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);}
  await p.waitForTimeout(40);
 }
 if(key)await p.keyboard.up(key);
 assert.equal(await p.evaluate(async(base)=>(await import(base+'/src/main.js')).game.rescued,base),1);
 await p.locator('#pause').click();await p.locator('#quit').click();await p.locator('#result').waitFor({state:'visible'});await p.locator('.result-social-close').click();
 await expect(p.locator('#return-memory img')).toHaveCount(1);await expect(p.locator('.ranking-entry')).toBeHidden();
 await p.locator('#return-memory button').click();await expect(p.locator('[data-character="blue"]')).toHaveAttribute('aria-pressed','true');await p.locator('.community-back').click();await expect(p.locator('#result')).toBeVisible();
 await p.screenshot({path:'test-results/psf-result'+(base?'-dist':'')+'.png'});

 await p.locator('#retry').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 assert.equal(await p.evaluate(async(base)=>(await import(base+'/src/main.js')).game.firstReturnProtection,base),false);
 const saved=await p.evaluate(()=>localStorage.getItem('cosmii-psf-v1'));
 await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#opening-screen')).toBeHidden();await expect(p.locator('#practice-guide')).toBeHidden();assert.equal(await p.evaluate(()=>localStorage.getItem('cosmii-psf-v1')),saved);
 await p.locator('#intro-preview').click();await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#title')).toBeVisible();
 await p.locator('#intro-preview').click();await p.waitForFunction(()=>Number.isFinite(document.querySelector('#opening-screen video')?.duration));await p.locator('#opening-screen video').evaluate(v=>{v.currentTime=Math.max(0,v.duration-.05);v.play().catch(()=>{});});await p.locator('#opening-screen').waitFor({state:'hidden'});await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#title')).toBeVisible();
 for(const [width,height] of [[568,320],[390,844]]){await p.setViewportSize({width,height});await p.screenshot({path:`test-results/psf-title-${width}${base?'-dist':''}.png`});await p.locator('#practice-start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('#tutorial-title').click();await p.locator('.face-transition').waitFor({state:'hidden'});}
 assert.deepEqual(errors,[]);console.log('PASS PSF browser',base||'development');await p.close();
}}finally{await b.close();}
