import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('cosmii-psf-v1',JSON.stringify({intro:true,practice:true}));
  window.pad={index:0,id:'Xbox test',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
  window.pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.pads});
 });
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await page.goto('http://localhost:5180/?opening=off&analytics=off');await page.locator('#loading').waitFor({state:'hidden'});
 await page.mouse.click(10,10);await page.evaluate(()=>{window.pads=[window.pad];});
 const frames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const press=async index=>{await page.evaluate(i=>window.pad.buttons[i].pressed=true,index);await frames();await page.evaluate(i=>window.pad.buttons[i].pressed=false,index);await frames();};
 await frames();assert.equal(await page.locator('#start').evaluate(n=>n===document.activeElement),true);
 await press(0);await page.locator('.face-transition').waitFor({state:'hidden'});await frames();
 assert.equal(await page.locator('#game').getAttribute('data-screen'),'playing');
 await page.evaluate(async()=>{window.g=(await import('/src/main.js')).game;g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];window.pad.axes[0]=1;});
 await frames();assert.equal(await page.evaluate(()=>g.direction),1);
 await press(0);assert.ok(await page.evaluate(()=>g.player.vy)<0);
 await press(5);assert.equal(await page.locator('#skill-bar .controller-selected').getAttribute('data-kind'),'1');
 await page.evaluate(async()=>{g.skillCharge[1]=(await import('/src/skills.js')).SKILL_REQUIREMENTS[1];});
 await frames();await press(2);assert.ok(await page.evaluate(()=>g.skillLeft[1]>0||g.skillCutin?.kind===1));
 await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>g.direction),1);
 await page.screenshot({path:'test-results/gamepad-playing.png'});
 // A second flap and pause must remain independent of the held stick.
 await press(9);assert.equal(await page.locator('#game').getAttribute('data-screen'),'pause-screen');
 await frames();await press(9);assert.equal(await page.locator('#game').getAttribute('data-screen'),'playing');
 await page.evaluate(()=>window.pads=[]);await frames();assert.equal(await page.locator('#game').getAttribute('data-screen'),'pause-screen');
 await page.evaluate(()=>window.pads=[window.pad]);await frames();assert.equal(await page.locator('#game').getAttribute('data-screen'),'pause-screen');
 await press(0);assert.equal(await page.locator('#game').getAttribute('data-screen'),'playing');
 await page.evaluate(()=>{g.finish('quit');});await page.locator('#result-social-popup').waitFor({state:'visible',timeout:15000});
 await frames();await press(1);await page.locator('#result-social-popup').waitFor({state:'hidden'});
 await frames();await press(1);await page.locator('.face-transition').waitFor({state:'hidden'});
 assert.equal(await page.locator('#game').getAttribute('data-screen'),'title');
 await page.locator('#home-settings').click();await frames();await press(1);assert.equal(await page.locator('dialog[open]').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: controller start, movement, flap, skill selection, pause, disconnect/reconnect, result and dialog back.');
}finally{await browser.close();}
