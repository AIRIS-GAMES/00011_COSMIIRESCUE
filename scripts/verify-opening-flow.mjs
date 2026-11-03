import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [route,width,height] of [['complete',844,390],['skip',568,320],['escape',390,844]]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5180/?analytics=off');await expect(p.locator('#opening-screen')).toBeVisible();
  await expect(p.locator('#opening-skip')).toHaveText('SKIP');await expect(p.locator('#opening-skip')).toBeInViewport({ratio:1});
  assert.equal(await p.locator('#opening-skip').evaluate(el=>el.classList.contains('back-button')),false);
  await p.waitForFunction(()=>document.querySelector('video').readyState>=2);
  if(route==='complete'){await p.locator('video').click();await p.locator('video').evaluate(async v=>{v.currentTime=v.duration-.2;await v.play();});await expect(p.locator('#practice-guide')).toBeVisible();await p.locator('#tutorial-title').click();}
  else if(route==='skip')await p.locator('#opening-skip').click();else await p.keyboard.press('Escape');
  await expect(p.locator('#title')).toBeVisible();await p.locator('.face-transition').waitFor({state:'hidden'});
  await p.locator('#intro-preview').click();await expect(p.locator('#opening-skip')).toHaveClass(/back-button/);await expect(p.locator('#opening-skip small')).toHaveText('もどる');await p.locator('#opening-skip').click();await expect(p.locator('#title')).toBeVisible();
  await p.reload();await p.locator('#boot-screen').waitFor({state:'hidden'});await expect(p.locator('#opening-screen')).toBeHidden();await expect(p.locator('#title')).toBeVisible();
  assert.deepEqual(errors,[]);console.log('PASS first-launch video, completion/skip, replay and seen state',route,width,height);await p.close();
 }
}finally{await browser.close();}
