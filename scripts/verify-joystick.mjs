import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const viewport of [{width:844,height:390},{width:390,height:844}]){
  const p=await browser.newPage({viewport,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').tap();await p.waitForTimeout(500);
  await p.evaluate(async()=>{window.testGame=(await import('/src/main.js')).game;const g=window.testGame;g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];});
  const pad=await p.locator('#direction-pad').boundingBox(),flap=await p.locator('#flap').boundingBox(),rotated=viewport.height>viewport.width;
  assert.ok(Math.abs(pad.width-pad.height)<1);
  const point=(x,y)=>({x:pad.x+pad.width/2+(rotated?-y:x),y:pad.y+pad.height/2+(rotated?x:y),id:1});
  const cdp=await p.context().newCDPSession(p),touch=touchPoints=>cdp.send('Input.dispatchTouchEvent',{type:touchPoints.length?'touchMove':'touchEnd',touchPoints});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(0,0)]});assert.equal(await p.evaluate(()=>testGame.direction),0);
  const held=point(pad.width*.35,-pad.height*.2);await touch([held]);assert.ok(await p.evaluate(()=>testGame.direction)>.6);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[held,{x:flap.x+flap.width/2,y:flap.y+flap.height/2,id:2}]});
  assert.ok(await p.evaluate(()=>testGame.player.vy)<0);assert.ok(await p.evaluate(()=>testGame.direction)>.6);
  await p.screenshot({path:`test-results/joystick-${rotated?'rotated':'landscape'}.png`});
  await touch([]);assert.equal(await p.evaluate(()=>testGame.direction),0);assert.equal(await p.locator('#direction-pad').evaluate(e=>e.style.getPropertyValue('--stick-x')),'0px');
  const scale=await p.evaluate(()=>visualViewport.scale);
  for(let i=0;i<4;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:flap.x+flap.width/2,y:flap.y+flap.height/2,id:1}]});await touch([]);await p.waitForTimeout(65);}
  await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>visualViewport.scale),scale);
  await p.locator('#pause').tap();assert.ok(await p.locator('#resume').isVisible());await p.locator('#resume').tap();assert.equal(await p.locator('#pause-screen').isVisible(),false);
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS: circular stick, two-finger flap, release reset, rapid taps without zoom, pause/resume in landscape and rotated portrait.');
}finally{await browser.close();}
