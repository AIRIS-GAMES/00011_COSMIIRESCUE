import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const route of ['complete','skip','escape']){
  await p.goto('http://localhost:5180/?analytics=off');await p.locator('#opening-screen').waitFor({state:'visible'});
  await expect(p.locator('#opening-skip')).toHaveText('SKIP');
  const positions=await p.evaluate(()=>{const a=document.querySelector('#opening-screen').getBoundingClientRect(),b=document.querySelector('#opening-skip').getBoundingClientRect();return {right:a.right-b.right,bottom:a.bottom-b.bottom};});assert.ok(positions.right>=0&&positions.right<25);assert.ok(positions.bottom>=0&&positions.bottom<25);
  assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.state),'ready');
  if(route==='complete'){await p.waitForFunction(()=>document.querySelector('video').readyState>=2);await p.locator('video').click();await p.locator('video').evaluate(async v=>{v.currentTime=v.duration-.2;await v.play();});}
  else if(route==='skip')await p.locator('#opening-skip').click();else await p.keyboard.press('Escape');
  await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('#tutorial-title').click();await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#opening-screen')).toBeHidden();
  await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#opening-screen')).toBeHidden();
 }
 for(const [width,height] of [[568,320],[390,844]]){await p.setViewportSize({width,height});await p.reload();await p.locator('#opening-skip').waitFor();await p.screenshot({path:`test-results/startup-skip-${width}.png`});await p.locator('#opening-skip').click();await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('#tutorial-title').click();await expect(p.locator('#title')).toBeVisible();await p.locator('#intro-preview').click();await p.locator('#opening-skip').click();await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('#tutorial-title').click();await expect(p.locator('#title')).toBeVisible();}
 assert.deepEqual(errors,[]);console.log('PASS: prologue on every load including seen saves, complete/skip/Escape to title, PLAY without second video, bottom-right SKIP, phone layouts, replay.');
}finally{await browser.close();}
