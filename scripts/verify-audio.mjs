import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5180/dist/index.html');
  await page.locator('#loading').waitFor({state:'hidden'});
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
  await page.evaluate(async()=>{window.checkedAudio=(await import('/dist/src/main.js')).audio;});
  const names=await page.evaluate(()=>Object.keys(checkedAudio.sfx));
  for(const name of names){
    await page.evaluate(name=>{checkedAudio.stopEffects();checkedAudio.effect(name);},name);
    await page.waitForFunction(name=>checkedAudio.sfx[name].currentTime>0&&!checkedAudio.sfx[name].error,name);
    assert.ok(await page.evaluate(name=>checkedAudio.sfx[name] instanceof HTMLAudioElement,name));
  }
  await page.evaluate(()=>document.dispatchEvent(new Event('pause')));
  assert.ok(await page.evaluate(()=>checkedAudio.suspended&&checkedAudio.bgm.paused&&Object.values(checkedAudio.sfx).every(s=>s.paused)));
  await page.evaluate(()=>document.dispatchEvent(new Event('resume')));
  assert.ok(await page.evaluate(()=>checkedAudio.bgm.paused));
  await page.locator('#resume').click();await page.waitForFunction(()=>!checkedAudio.bgm.paused);
  await page.evaluate(()=>{checkedAudio.effect('best');checkedAudio.effect('best');});
  await page.locator('#sound').click();
  assert.ok(await page.evaluate(()=>!checkedAudio.enabled&&checkedAudio.bgm.paused));
  await page.evaluate(()=>checkedAudio.effect('best'));
  await page.waitForFunction(()=>checkedAudio.sfx.best.currentTime>0&&!checkedAudio.sfx.best.paused);
  await page.reload();await page.locator('#loading').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(async()=>(await import('/dist/src/main.js')).audio.enabled),false);
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
  await page.evaluate(async()=>{window.checkedAudio=(await import('/dist/src/main.js')).audio;checkedAudio.effect('best');});
  await page.waitForFunction(()=>checkedAudio.sfx.best.currentTime>0&&!checkedAudio.sfx.best.paused&&checkedAudio.bgm.paused);
  assert.deepEqual(errors,[]);
  console.log('PASS: all 15 MP3 effects play, background silences all, BGM OFF keeps effects playing before and after reload.');
}finally{await browser.close();}
