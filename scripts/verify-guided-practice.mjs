import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [width,height] of [[844,390],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5180/index.html?opening=off&analytics=off');await page.locator('#boot-screen').waitFor({state:'hidden'});
  const counts=await page.evaluate(()=>(JSON.parse(localStorage.getItem('cosmii-psf-v1')||'{}').counts||[0,0,0,0]));
  await page.locator('#practice-start').click();await expect(page.locator('#practice-guide')).toHaveAttribute('data-step','0');await page.locator('.face-transition').waitFor({state:'hidden'});
  const state=()=>page.evaluate(async()=>{const {game:g}=await import('/src/main.js');const t=g.practiceStep===2?g.friends[0]:g.stage.home;return {step:g.practiceStep,left:g.leftDone,x:g.player.x,y:g.player.y,vy:g.player.vy,target:t?{x:t.x,y:t.y}:null};});
  await page.screenshot({path:`test-results/practice-move-${width}.png`});
  // Operate the real stick (including the portrait-rotated coordinate system).
  const pad=await page.locator('#direction-pad').boundingBox();const rotated=await page.evaluate(()=>document.documentElement.classList.contains('landscape-auto'));
  const px=pad.x+pad.width/2,py=pad.y+pad.height/2;
  await page.mouse.move(rotated?px:px-pad.width*.4,rotated?py-pad.height*.4:py);await page.mouse.down();await expect.poll(async()=>(await state()).left).toBe(true);await page.mouse.up();
  await page.mouse.move(rotated?px:px+pad.width*.4,rotated?py+pad.height*.4:py);await page.mouse.down();await expect.poll(async()=>(await state()).step).toBe(1);await page.mouse.up();
  await page.locator('#flap').click();await expect.poll(async()=>(await state()).step).toBe(2);
  await page.screenshot({path:`test-results/practice-rescue-${width}.png`});
  let direction='';const steps=new Set();
  for(let i=0;i<500;i++){
   const s=await state();steps.add(s.step);if(s.step>=4)break;
   const next=s.target.x>s.x?'ArrowRight':'ArrowLeft';if(next!==direction){if(direction)await page.keyboard.up(direction);await page.keyboard.down(next);direction=next;}
   if(s.y>s.target.y-10&&s.vy>=0)await page.locator('#flap').click();
   if(s.step===3&&!steps.has('ring')){await page.screenshot({path:`test-results/practice-ring-${width}.png`});steps.add('ring');}
   await page.waitForTimeout(70);
  }
  if(direction)await page.keyboard.up(direction);
  await expect(page.locator('#practice-guide')).toHaveAttribute('data-step','4');await expect(page.locator('#skill-bar button[data-kind="0"]')).toBeEnabled();
  await page.screenshot({path:`test-results/practice-skill-${width}.png`});await page.locator('#skill-bar button[data-kind="0"]').click();await expect(page.locator('#practice-guide')).toHaveAttribute('data-step','5');
  await expect(page.locator('#skill-bar button[data-kind="0"]')).toHaveAttribute('data-active','true');
  await page.keyboard.down('ArrowRight');
  for(let i=0;i<80;i++){const s=await state();if(s.step===6)break;if(s.step===4)throw Error('Missed practice obstacle');if(s.y>640&&s.vy>=0)await page.locator('#flap').click();if(i===8)await page.screenshot({path:'test-results/practice-phase-'+width+'.png'});await page.waitForTimeout(60);}
  await page.keyboard.up('ArrowRight');await expect(page.locator('#practice-guide')).toHaveAttribute('data-step','6');
  await page.screenshot({path:`test-results/practice-twenty-${width}.png`});await expect(page.locator('#tutorial-start')).toBeInViewport({ratio:1});
  assert.deepEqual(await page.evaluate(()=>(JSON.parse(localStorage.getItem('cosmii-psf-v1')||'{}').counts||[0,0,0,0])),counts);
  await page.locator('#tutorial-title').click();await expect(page.locator('#title')).toBeVisible();assert.deepEqual(errors,[]);console.log('PASS actual controls, rescue, ring, skill and teaser',width,height);await page.close();
 }
}finally{await browser.close();}
