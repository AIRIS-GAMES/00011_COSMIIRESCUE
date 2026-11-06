import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[568,320],[844,390],[390,844]]){
  const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];
  let reports=0,started=false,deleted=false,failDelete=true,signups=0;
  const id='11111111-1111-4111-8111-111111111111';
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',async route=>{
   const url=route.request().url(),body=route.request().postDataJSON()||{};
   if(url.includes('/auth/')){signups++;return route.fulfill({json:{access_token:'test',refresh_token:'refresh',expires_in:3600,user:{id:'22222222-2222-4222-8222-222222222222'}}});}
   if(url.includes('cosmii_player_top_scores_v2'))return route.fulfill({json:deleted||body.p_hidden_ids.includes(id)?[]:[{rank:1,player_name:'青コスミー',score:20,rescued:20,public_id:id}]});
   if(url.includes('cosmii_report_player')){reports++;return route.fulfill({json:{accepted:true}});}
   if(url.includes('cosmii_request_account_deletion')){started=true;return route.fulfill({json:{accepted:true}});}
   if(url.includes('/functions/')){
    if(!started)return route.fulfill({status:404,json:{error:'REQUEST_NOT_FOUND'}});
    if(failDelete)return route.fulfill({status:503,json:{error:'RETRY_LATER'}});
    deleted=true;return route.fulfill({json:{deleted:true}});
   }
   return route.fulfill({json:[]});
  });
  await page.goto('http://localhost:5180/?opening=off&goal=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  await page.locator('#records').click();await page.locator('.ranking-row-menu').click();await page.locator('.safety-report').click();await page.locator('.safety-reason').first().click();
  await expect(page.locator('#ranking-safety-title')).toHaveText('通報を受け付けました');assert.equal(reports,1);assert.equal(signups,1);
  await page.locator('.safety-close').click();await page.locator('.ranking-row-menu').click();await page.locator('.safety-hide').click();
  await expect(page.locator('#ranking-safety-title')).toHaveText('非表示にしました');await page.locator('.safety-close').click();await expect(page.locator('.ranking-row-menu')).toHaveCount(0);
  await page.locator('#close-records').click();await page.locator('#home-settings').click();await page.locator('.settings-support').click();
  await expect(page.locator('.ranking-safety-dialog a[href="mailto:contact@airis-games.com"]')).toBeVisible();
  await page.locator('.safety-hidden-list').click();await page.locator('.safety-content button').click();
  await expect(page.locator('.safety-content')).toContainText('いません');await page.locator('.safety-close').click();
  await page.locator('.settings-support').click();await page.locator('.safety-delete-menu').click();
  await expect(page.locator('.safety-delete-confirm')).toBeInViewport({ratio:1});
  await page.screenshot({path:`test-results/ranking-delete-${width}.png`});
  await page.locator('.safety-delete-confirm').click();await expect(page.locator('.safety-status')).toContainText('再試行');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-auto-ranking:cosmii-rescue-v1')));assert.equal(saved.deleting,true);assert.equal(saved.pending,undefined);
  failDelete=false;await page.locator('.safety-delete-confirm').click();await expect(page.locator('#ranking-safety-title')).toHaveText('削除しました');
  assert.equal(await page.evaluate(()=>localStorage.getItem('cosmii-ranking-auth:https://dtokebihzpnkkrzrttus.supabase.co')),'null');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-auto-ranking:cosmii-rescue-v1'))),{deleted:true});
  await page.reload();await page.locator('#boot-screen').waitFor({state:'hidden'});assert.equal(signups,1);assert.deepEqual(errors,[]);
  await page.close();console.log('PASS report/hide/unhide/support/delete failure+retry/no auto-rejoin',width,height);
 }
}finally{await browser.close();}
