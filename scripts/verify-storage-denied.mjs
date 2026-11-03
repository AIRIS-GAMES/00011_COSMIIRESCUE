import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://*.supabase.co/**',r=>r.abort());
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Storage denied','SecurityError');}}));
 await page.goto('http://localhost:5180/?opening=off&analytics=off');
 await expect(page.locator('#boot-screen')).toBeHidden({timeout:15000});
 await page.locator('#home-settings').click();await expect(page.locator('.ranking-name-dialog')).toBeVisible();
 await page.locator('.ranking-name-cancel').click();
 await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
 await page.evaluate(async()=>{(await import('/src/main.js')).game.finish('quit');});
 await page.locator('.result-social-back').click();
 await expect(page.locator('#result')).toBeVisible();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS storage denied: boot, settings, gameplay and result remain usable');
}finally{await browser.close();}
