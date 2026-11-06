import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
// Start-of-run goal slide: the run waits behind it, the dismissing tap does not flap, and it stops after a few runs once HOME was reached.
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[390,844]]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',r=>r.abort());
  await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  const run=()=>page.evaluate(async()=>{const {game}=await import('/src/main.js');return {time:game.time??game.elapsed??0,y:game.player?.y,vy:game.player?.vy,state:game.state};});
  await page.locator('#start').click();
  const card=page.locator('#goal-card');await expect(card).toBeVisible();
  await expect(card.locator('h2')).toHaveText('なかまを集めて、HOMEへとどけよう！');
  await page.waitForTimeout(600);await expect(card.locator('.goal-title')).toBeInViewport({ratio:.95});await expect(card.locator('.goal-caps')).toBeInViewport({ratio:.95});
  const before=await run();await page.waitForTimeout(800);const during=await run();
  assert.deepEqual(during,before,'the run must not advance while the goal slide is up');
  await page.locator('#goal-card').click({position:{x:20,y:20}});await expect(card).toBeHidden();
  const after=await run();assert.ok(!(after.vy<-1),'dismissing tap must not flap');
  await page.waitForTimeout(400);assert.notDeepEqual(await run(),after,'the run resumes after the slide');
  // Pretend HOME was reached before: the slide stops after the first three runs.
  await page.evaluate(()=>localStorage.setItem('cosmii-goal-v1',JSON.stringify({shows:3})));
  await page.evaluate(async()=>{(await import('/src/main.js')).progress.data.returned=true;});
  await page.locator('#pause').click();await page.locator('#quit').click();await expect(page.locator('#result')).toBeVisible();
  await page.locator('#retry').click();await expect(page.locator('#game')).toHaveAttribute('data-screen','playing');
  await page.waitForTimeout(500);await expect(card).toBeHidden();
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS goal card: run waits, tap dismisses without flapping, two orientations');
}finally{await browser.close();}
