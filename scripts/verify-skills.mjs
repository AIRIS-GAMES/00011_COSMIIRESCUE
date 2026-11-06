import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{for(const [width,height,base] of [[568,320,''],[844,390,'/dist'],[390,844,'']]){
 const page=await browser.newPage({locale:'ja-JP',viewport:{width,height}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`http://localhost:5180${base}/index.html?opening=off&goal=off&analytics=off`);
 await page.locator('#boot-screen').waitFor({state:'hidden'});
 await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
 for(let kind=0;kind<4;kind++){
  await page.evaluate(async({base,kind})=>{
   const {game:g}=await import(base+'/src/main.js');g.start('normal');g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];g.friends=[];g.obstacles=[];g.cooldown=999;
   const {SKILL_REQUIREMENTS}=await import(base+'/src/skills.js');
   for(let i=0;i<SKILL_REQUIREMENTS[kind];i++)g.rescue(g.spawnFriend({x:g.player.x+80,y:g.player.y,kind}));
  },{base,kind});
  const button=page.locator(`#skill-bar button[data-kind="${kind}"]`);await expect(button).toBeEnabled();await expect(button).toBeInViewport({ratio:1});
  if(kind===0){
   assert.ok(await page.locator('#skill-bar').evaluate(el=>{const a=el.getBoundingClientRect(),l=document.getElementById('direction-pad').getBoundingClientRect(),r=document.getElementById('flap').getBoundingClientRect();return [l,r].every(b=>a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom);}));
   await page.screenshot({path:`test-results/skills-buttons-${width}.png`});
  }
  await button.click();await expect(page.locator('#skill-cutin')).toBeVisible();
  await expect(button).toBeDisabled();
  if(kind===0)await page.screenshot({path:`test-results/skills-cutin-${width}.png`});
  await expect(page.locator('#skill-cutin')).toBeHidden();
  await expect(button).toHaveAttribute('data-active','true');
  await expect(button.locator('small')).toHaveText('発動中');
  await expect(button.locator('span')).toContainText('秒');
  await expect(button.locator('.skill-time')).toBeVisible();
  if(kind===0)await page.screenshot({path:`test-results/skills-active-${width}.png`});
  assert.equal(await page.evaluate(async base=>(await import(base+'/src/main.js')).game.skillCharge.reduce((a,b)=>a+b,0),base),0);
 }
 await page.locator('#pause').click();await expect(page.locator('#skill-bar')).toBeHidden();
 const remaining=await page.evaluate(async base=>(await import(base+'/src/main.js')).game.skillLeft[3],base);
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(async base=>(await import(base+'/src/main.js')).game.skillLeft[3],base),remaining);
 await page.locator('#resume').click();await expect(page.locator('#skill-bar')).toBeVisible();
 await expect(page.locator('#skill-bar button[data-kind="3"]')).toHaveAttribute('data-active','false',{timeout:7000});
  // Each use raises that color's requirement by one for the rest of the run (purple 6 → 7).
  await expect(page.locator('#skill-bar button[data-kind="3"] span')).toHaveText('0/7');
 assert.deepEqual(errors,[]);console.log('PASS skill buttons, four activations, cutin, pause:',width,height,base);await page.close();
}}finally{await browser.close();}
