import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180/?analytics=off');await p.locator('#opening-skip').waitFor();const saved=await p.evaluate(()=>['cosmii-endless-v1','cosmii-endless-v1-hard','cosmii-story-v1'].map(k=>localStorage.getItem(k)));
 await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});await expect(p.locator('#practice-guide')).toBeVisible();
 await p.locator('#pause').click();const time=await p.evaluate(async()=>(await import('/src/main.js')).game.time);await p.waitForTimeout(150);assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).game.time),time);await p.locator('#resume').click();
 let key=null,seen=new Set();
 for(let i=0;i<300;i++){
  const s=await p.evaluate(async()=>{const g=(await import('/src/main.js')).game;return {step:g.practiceStep,left:g.leftDone,x:g.player.x,y:g.player.y,vy:g.player.vy,target:g.practiceStep===2?g.friends[0]:g.stage.home};});
  if(!seen.has(s.step)){seen.add(s.step);await p.screenshot({path:`test-results/practice-step-${s.step}.png`});}
  if(s.step===4)break;
  const next=s.step===0?(s.left?'ArrowRight':'ArrowLeft'):s.step===1?null:s.target.x>s.x?'ArrowRight':'ArrowLeft';
  if(next!==key){if(key)await p.keyboard.up(key);if(next)await p.keyboard.down(next);key=next;}
  if(s.step===1||(s.step>=2&&s.y>s.target.y-10&&s.vy>=0)){const box=await p.locator('#flap').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);}
  await p.waitForTimeout(40);
 }
 if(key)await p.keyboard.up(key);assert.ok(seen.has(4),'actual browser inputs should finish practice');await expect(p.locator('#tutorial-start')).toBeVisible();
 assert.deepEqual(await p.evaluate(()=>['cosmii-endless-v1','cosmii-endless-v1-hard','cosmii-story-v1'].map(k=>localStorage.getItem(k))),saved);
 await p.locator('#tutorial-start').click();await p.locator('.face-transition').waitFor({state:'hidden'});assert.equal(await p.evaluate(async()=>!!(await import('/src/main.js')).game.isTraining),false);await expect(p.locator('#practice-guide')).toBeHidden();
 for(const [width,height] of [[568,320],[390,844]]){await p.setViewportSize({width,height});await p.reload();await p.locator('#opening-skip').click();await p.locator('.face-transition').waitFor({state:'hidden'});await p.screenshot({path:`test-results/practice-${width}.png`});await p.locator('#tutorial-title').click();await p.locator('#title').waitFor({state:'visible'});}
 assert.deepEqual(errors,[]);console.log('PASS: actual keyboard and flap inputs complete all four steps, real rescue/return, no saved scores, pause, main game, mobile layouts, exit.');
}finally{await b.close();}
