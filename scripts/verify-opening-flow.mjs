import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [route,width,height] of [['complete',844,390],['skip',568,320],['escape',390,844]]){
  const p=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5180/?analytics=off');await expect(p.locator('#opening-screen')).toBeVisible();
  await expect(p.locator('#opening-skip')).toHaveText('スキップ');await expect(p.locator('#opening-skip')).toBeInViewport({ratio:1});
  assert.equal(await p.locator('#opening-skip').evaluate(el=>el.classList.contains('back-button')),false);
  await p.waitForFunction(()=>document.querySelector('video').readyState>=2);
  if(route==='complete'){await p.locator('video').click();await p.locator('video').evaluate(async v=>{v.currentTime=v.duration-.2;await v.play();});await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#pause').click();await p.locator('#quit').click();}
  else if(route==='skip')await p.locator('#opening-skip').click();else await p.keyboard.press('Escape');
  await expect(p.locator('#title')).toBeVisible();await p.locator('.face-transition').waitFor({state:'hidden'});
  // Replay from the title: full cut, no back button in the corner, one tap anywhere returns to the title.
  await p.locator('#intro-preview').click();await expect(p.locator('#opening-screen')).toBeVisible();assert.match(await p.locator('#opening-screen video').getAttribute('src'),/Cosmii_Rescue_Opening\.mp4$/);assert.equal(await p.locator('#opening-skip').count(),0);assert.equal(await p.locator('#opening-screen .back-button').count(),0);await expect(p.locator('.opening-quick-hint')).toHaveText('タップでスキップ');await p.waitForFunction(()=>{const v=document.querySelector('#opening-screen video');return v&&!v.paused&&v.currentTime>.3;});await p.locator('#opening-screen video').click();await expect(p.locator('#opening-screen')).toBeHidden();await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#practice-guide')).toBeHidden();
  await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#opening-screen')).toBeVisible();assert.match(await p.locator('video').getAttribute('src'),/Cosmii_Rescue_Short\.mp4$/);await expect(p.locator('.opening-quick-hint')).toBeVisible();assert.equal(await p.locator('#opening-skip').count(),0);await p.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>.3;});await p.locator('video').click();await expect(p.locator('#opening-screen')).toBeHidden();await expect(p.locator('#title')).toBeVisible();await expect(p.locator('#practice-guide')).toBeHidden();
  assert.deepEqual(errors,[]);console.log('PASS first-launch video, completion/skip, replay and short returning cut',route,width,height);await p.close();
 }
}finally{await browser.close();}
