import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[568,320],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});let renames=0;
 await page.route('https://*.supabase.co/**',async r=>{
  if(r.request().url().includes('cosmii_player_rename')){
   renames++;return r.fulfill({status:400,json:{message:'NAME_NOT_ALLOWED'}});
  }
  return r.abort();
 });
 await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
 await page.locator('#home-settings').click();
 await page.locator('#ranking-editor-input').fill('ＦＵＣＫ');
 await page.locator('.ranking-name-card button[type=submit]').click();
 await expect(page.locator('.ranking-name-error')).toContainText('この名前は使用できません');
 await expect(page.locator('.ranking-name-dialog')).toBeVisible();
 assert.equal(renames,0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('cosmii-auto-ranking:cosmii-rescue-v1')),null);
 await page.locator('#ranking-editor-input').fill('Cosmii');
 await page.locator('.ranking-name-card button[type=submit]').click();
 await expect(page.locator('.ranking-name-dialog')).toBeHidden();
 await page.evaluate(()=>{
 localStorage.setItem('cosmii-auto-ranking:cosmii-rescue-v1',JSON.stringify({name:'Original',best:20}));
 localStorage.setItem('cosmii-ranking-auth:https://dtokebihzpnkkrzrttus.supabase.co',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Date.now()/1000+3600,user:{id:'test'}}));
 });
 await page.locator('#home-settings').click();
 await page.locator('#ranking-editor-input').fill('ServerRule');
 await page.locator('.ranking-name-card button[type=submit]').click();
 await expect(page.locator('.ranking-name-error')).toContainText('この名前は使用できません');
 await expect(page.locator('.ranking-name-dialog')).toBeVisible();assert.equal(renames,1);
 await page.close();
 }
 console.log('PASS settings name rejection: local-only and server rules remain visible in the editor');
}finally{await browser.close();}
