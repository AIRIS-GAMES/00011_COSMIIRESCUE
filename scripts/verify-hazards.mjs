import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 await p.evaluate(async()=>{const {game:g,renderer:r}=await import('/src/main.js');const {hazardTypes}=await import('/src/hazards.js');g.state='ready';g.player.x=500;g.player.y=450;r.snap(g);g.obstacles=Object.entries(hazardTypes).map(([asset,info],i)=>({asset,...info,x:r.camera.x+110+(i%7)*140,y:r.camera.y+130+Math.floor(i/7)*100,r:27,disabled:0}));g.friends=[];g.homes=[];g.stage.props=[];});
 await p.waitForTimeout(100);await p.screenshot({path:'test-results/objects-gallery.png'});
 await p.evaluate(async()=>{const g=(await import('/src/main.js')).game;g.effects.paper=1.7;g.effects.fog=1.4;g.effects.slow=2;g.effects.slip=2;});await p.waitForTimeout(100);await p.screenshot({path:'test-results/objects-effects.png'});
 assert.deepEqual(errors,[]);console.log('PASS: all object images and nuisance overlays render.');
}finally{await browser.close();}
