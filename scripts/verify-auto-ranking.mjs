import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[568,320],[844,390],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];let signups=0,submits=0,best=0,offline=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',async route=>{
   const url=route.request().url();
   if(url.includes('/auth/')){signups++;return route.fulfill({json:{access_token:'test-user-token',refresh_token:'test-refresh',expires_in:3600,user:{id:'11111111-1111-4111-8111-111111111111'}}});}
   if(url.includes('cosmii_player_submit_score')){
    submits++;assert.equal(route.request().headers().authorization,'Bearer test-user-token');
    if(offline)return route.abort();
    best=Math.max(best,route.request().postDataJSON().p_score);return route.fulfill({json:{rank:1,score:best}});
   }
   return route.fulfill({json:[]});
  });
  await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  const finish=async score=>{
   await page.evaluate(async score=>{const {game:g}=await import('/src/main.js');g.rescued=score;g.score=score;g.delivered=[1,1,1,1];g.finish('quit');},score);
   await page.locator('.result-social-back').click();await expect(page.locator('#result')).toBeVisible();
  };
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});await finish(24);
  await expect(page.locator('#return-memory button')).toHaveCount(4);
  assert.equal(await page.locator('.result-panel').evaluate(e=>e.scrollHeight>e.clientHeight+1),false);
  for(const id of ['retry','home'])await expect(page.locator('#'+id)).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/compact-result-${width}.png`});
  await page.locator('#return-memory button').first().click();await expect(page.locator('#community-screen')).toBeVisible();await page.locator('.community-back').click();
  await page.locator('.ranking-entry button').click();await page.locator('#ranking-editor-input').fill('コスミー');
  await page.locator('.ranking-name-card button[type=submit]').click();await expect(page.locator('.ranking-entry-status')).toContainText('24匹');assert.equal(signups,1);
  await page.locator('#retry').click();await page.locator('.face-transition').waitFor({state:'hidden'});await finish(12);await expect(page.locator('.ranking-entry-status')).toContainText('登録済み');assert.equal(submits,1);
  offline=true;await page.locator('#retry').click();await page.locator('.face-transition').waitFor({state:'hidden'});await finish(30);await expect(page.locator('.ranking-entry-status')).toContainText('未送信');
  offline=false;await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});await expect.poll(()=>best).toBe(30);assert.equal(signups,1);
  await page.locator('#mode-hard').click();await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});const before=submits;await finish(40);await expect(page.locator('.ranking-entry')).toBeHidden();assert.equal(submits,before);
  assert.deepEqual(errors,[]);await page.close();console.log('PASS compact result, character links, opt-in, auto best, offline/reload retry, HARD exclusion',width,height);
 }
}finally{await browser.close();}
