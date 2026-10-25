import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180/?analytics=off');await p.locator('#loading').waitFor({state:'hidden'});
 await p.locator('.opening-video').waitFor();await p.waitForTimeout(300);if(await p.locator('video').evaluate(v=>v.paused))await p.locator('video').click();
 for(let i=1;i<=1;i++){
  await expect(p.locator('.opening-video')).toBeVisible();
  await p.waitForFunction(()=>{const v=document.querySelector('.opening-video');return v?.readyState>=2&&v.currentTime>0&&!v.paused;});
  const data=await p.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,src:v.currentSrc}));assert.ok(data.src.endsWith('Cosmii_Rescue_Opening.mp4'));console.log(i,data);assert.equal(await p.locator('video').evaluate(v=>v.muted),false);
  assert.equal(await p.locator('#opening-screen button').count(),1);assert.equal(await p.locator('video').evaluate(v=>v.controls),false);assert.equal(await p.locator('.opening-header').count(),0);await p.screenshot({path:'test-results/opening-video.png'});
  // Seek near the end and let the real ended event advance the playlist.
  await p.locator('video').evaluate(v=>{v.currentTime=v.duration-.15;});
 }
 await p.locator('#practice-guide').waitFor({state:'visible'});await p.locator('#tutorial-title').click();await p.locator('#title').waitFor({state:'visible'});assert.equal(await p.locator('video').count(),1);assert.equal(await p.locator('video').getAttribute('src'),null);
 await p.reload();await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#opening-screen').isVisible(),true);await p.locator('#opening-skip').click();await p.locator('#tutorial-title').click();
 await p.locator('#intro-preview').click();await expect(p.locator('.opening-video')).toBeVisible();await p.locator('#opening-skip').click();await p.locator('#tutorial-title').click();
 await p.route('**/Asset/movie/Cosmii_Rescue_Opening.mp4',r=>r.abort());await p.locator('#intro-preview').click();await expect(p.locator('.opening-video-status')).toContainText('読み込めません');await p.locator('#opening-skip').click();await p.locator('#tutorial-title').click();
 assert.deepEqual(errors,[]);
 const response=await p.request.get('http://localhost:5180/Asset/movie/Cosmii_Rescue_Opening.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(response.status(),206);assert.equal((await response.body()).length,100);assert.equal(response.headers()['content-type'],'video/mp4');
 console.log('PASS: combined video decodes and returns to title on ended; video-only overlay, sound enabled, completion, persistence, replay, skip, error recovery, HTTP range.');
}finally{await browser.close();}
