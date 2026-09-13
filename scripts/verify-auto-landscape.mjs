import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:2});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180');assert.ok(await p.locator('#boot-screen').isVisible());await p.locator('#loading').waitFor({state:'hidden'});
 assert.equal(await p.locator('#rotate-screen').count(),0);assert.ok(await p.locator('#title').isVisible());
 const size=await p.locator('#canvas').evaluate(c=>({w:c.clientWidth,h:c.clientHeight,pixels:c.width}));assert.deepEqual(size,{w:844,h:390,pixels:1688});await p.screenshot({path:'test-results/auto-landscape-menu.png'});
 await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').tap();await p.waitForTimeout(450);
 await p.evaluate(async()=>{const {game:g}=await import('/src/main.js');g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];});
 const pad=await p.locator('#direction-pad').boundingBox();await p.mouse.move(pad.x+pad.width/2,pad.y+pad.height*.9);await p.mouse.down();assert.ok(await p.evaluate(async()=>(await import('/src/main.js')).game.direction)>.5);await p.mouse.up();
 await p.locator('#flap').tap();assert.ok(await p.evaluate(async()=>(await import('/src/main.js')).game.player.vy)<0);await p.screenshot({path:'test-results/auto-landscape-play.png'});
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(150);assert.equal(await p.locator('html').evaluate(e=>e.classList.contains('landscape-auto')),false);assert.equal(await p.locator('#pause-screen').isVisible(),false);await p.locator('#flap').tap();
 await p.setViewportSize({width:320,height:667});await p.waitForTimeout(100);await p.locator('#pause').tap();await p.locator('#quit').tap();await p.locator('.face-transition').waitFor({state:'hidden'});assert.ok(await p.locator('#start').isVisible());await p.screenshot({path:'test-results/auto-landscape-small.png'});assert.deepEqual(errors,[]);
 console.log('PASS: upright boot to landscape menu without prompt; rotated steering, flap, transition, physical rotation and small viewport.');
}finally{await b.close();}
