import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});
try{for(const base of ['','/dist']){
 const p=await b.newPage({viewport:{width:568,height:320}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await p.goto(`http://localhost:5180${base}/index.html?opening=off&analytics=off`);await p.locator('#boot-screen').waitFor({state:'hidden'});
 await p.evaluate(async base=>{window.events=[];(await import(base+'/src/analytics.js')).analytics.send=(...a)=>window.events.push(a);},base);
 await p.locator('#practice-start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#tutorial-title').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#result-social-popup')).toBeHidden();
 for(const mode of ['normal','hard']){
  await p.locator('#mode-'+mode).click();await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
  await p.evaluate(async base=>{const {game:g}=await import(base+'/src/main.js');g.world={extend(){}};g.incoming={update(){}};g.obstacles=[];g.friends=[];g.homes=[];g.carry=[];g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:1}));g.beginReturn();g.finish('quit');},base);
  const popup=p.locator('#result-social-popup');await expect(popup).toBeVisible();await expect(popup.locator('a')).toHaveCount(3);await expect(popup.locator('button:disabled')).toHaveCount(1);
  await p.waitForFunction(()=>[...document.querySelectorAll('#result-social-popup img')].every(i=>i.complete&&i.naturalWidth));
  for(const size of [{width:568,height:320},{width:390,height:844}]){await p.setViewportSize(size);await p.waitForTimeout(100);assert.ok(await p.locator('.result-social-back').isVisible());const fits=await p.locator('.result-social-card').evaluate(e=>e.scrollHeight<=e.clientHeight+1);assert.ok(fits,'popup fits small landscape / rotated portrait');}
  if(mode==='normal')await p.screenshot({path:`test-results/result-social${base?'-dist':''}.png`});
  await p.locator('.result-social-close').focus();await p.keyboard.press('Shift+Tab');await expect(p.locator('.result-social-back')).toBeFocused();await p.keyboard.press('Escape');await expect(popup).toBeHidden();assert.equal(await p.locator('#result').evaluate(e=>e.inert),false);
  if(mode==='normal'){await p.locator('#return-memory button').click();await p.locator('.community-back').click();await expect(popup).toBeHidden();}
  await p.locator('#home').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 }
 assert.equal(await p.evaluate(()=>window.events.filter(e=>e[1]==='Interest:social_popup_view:result_popup').length),2);
 assert.equal(await p.evaluate(()=>window.events.filter(e=>e[1]==='Interest:social_popup_close:result_popup').length),2);
 assert.equal(await p.evaluate(()=>window.events.filter(e=>e[1]==='Interest:social_open:result_popup').length),0);
 assert.deepEqual(errors,[]);console.log('PASS result social popup:',base||'development');await p.close();
}}finally{await b.close();}
