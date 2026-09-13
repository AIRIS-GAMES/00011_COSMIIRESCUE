import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').click();
 for(const [col,id] of ['sky','sunset','neon','space'].entries()){
  await p.evaluate(async(col)=>{const {game:g,renderer:r}=await import('/src/main.js');g.player.x=col*1320+380;g.player.y=450;g.scrollX=g.player.x-310;g.world.extend(g);g.state='ready';r.snap(g);},col);
  await p.waitForTimeout(1350);
  assert.equal(await p.evaluate(async()=>(await import('/src/main.js')).renderer.theme.id),id);
  await p.screenshot({path:`test-results/biome-${id}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: all four biome transitions render without browser errors.');
}finally{await browser.close();}
