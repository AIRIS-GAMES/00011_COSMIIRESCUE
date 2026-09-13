import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
  await p.screenshot({path:'test-results/endless-title-mobile.png'});await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
  await p.evaluate(async()=>{window.g=(await import('/src/main.js')).game;});
  await p.evaluate(()=>{g.obstacles=[];g.homes=[];g.world.extend=()=>{};g.player.y=650;});const session=await p.context().newCDPSession(p);
  const left={x:145,y:330,id:1},right={x:780,y:330,id:2};
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
  await p.waitForTimeout(90);assert.ok(await p.evaluate(()=>g.direction>.5));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});
  await p.waitForTimeout(70);assert.ok(await p.evaluate(()=>g.player.vy<0&&g.direction>.5));
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});
  assert.ok(await p.evaluate(()=>g.direction>.5));
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  assert.equal(await p.evaluate(()=>g.direction),0);
  await p.waitForTimeout(650);assert.ok(await p.evaluate(()=>g.player.vy>0));
  await p.locator('#pause').click();const time=await p.evaluate(()=>g.time);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>g.time),time);await p.locator('#resume').click();await p.locator('.face-transition').waitFor({state:'hidden'});
  await p.screenshot({path:'test-results/endless-play-mobile.png'});
  // Visual coverage beyond the original room, without waiting several minutes.
  await p.evaluate(()=>{g.world.extend=Object.getPrototypeOf(g.world).extend;g.player.x=4700;g.player.y=500;g.scrollX=4400;g.time=145;g.world.extend(g);});await p.waitForTimeout(120);
  assert.ok(await p.evaluate(()=>g.state==='playing'&&g.world.next>=5));
  await p.screenshot({path:'test-results/endless-area-mobile.png'});
  await p.setViewportSize({width:1440,height:1000});await p.locator('#pause').click();await p.locator('#quit').click();await p.locator('.face-transition').waitFor({state:'hidden'});
  const rect=await p.locator('#game').boundingBox();assert.equal(rect.height,1000);assert.equal(rect.width,1440);assert.equal(await p.locator('.left-wing').isVisible(),false);
  assert.equal(await p.locator('.machine').evaluate(el=>getComputedStyle(el).borderWidth),'0px');
  await p.screenshot({path:'test-results/endless-desktop.png'});assert.deepEqual(errors,[]);
  console.log('PASS: borderless landscape, independent two-finger control, gravity, pause, endless area, no runtime errors.');
}finally{await browser.close();}
