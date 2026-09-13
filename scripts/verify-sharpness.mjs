import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [name,width,height,dpr] of [['desktop',1920,1080,1],['phone',844,390,3]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
  const state=await p.locator('#canvas').evaluate(c=>({w:c.width,h:c.height,quality:c.getContext('2d').imageSmoothingQuality}));assert.equal(state.w,width*dpr);assert.equal(state.h,height*dpr);assert.equal(state.quality,'high');await p.screenshot({path:`test-results/sharpness-${name}.png`});
  await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').click();await p.waitForTimeout(450);
  await p.setViewportSize({width:height,height:width});await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.equal(await p.locator('#canvas').evaluate(c=>c.width),width*dpr);assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS: native 1920px desktop and 3x phone resolution, smoothing, transition, play and orientation resize.');
}finally{await browser.close();}
