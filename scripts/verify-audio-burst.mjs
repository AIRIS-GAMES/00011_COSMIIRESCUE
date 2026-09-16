import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}});
  await page.goto('http://localhost:5180/dist/index.html');await page.locator('#loading').waitFor({state:'hidden'});
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});await page.locator('#flap').click();await page.waitForTimeout(450);
  await page.evaluate(async()=>{
    const {game,audio}=await import('/dist/src/main.js');game.world.extend=()=>{};game.incoming.update=()=>{};game.friends=[];game.obstacles=[];game.homes=[];game.drain();audio.stopEffects();
    window.burstCounts={requests:0,starts:0,layouts:0};
    const effect=audio.effect.bind(audio);audio.effect=type=>{if(type==='rescue')burstCounts.requests++;effect(type);};
    const media=audio.sfx.rescue,play=media.play.bind(media);media.play=()=>{burstCounts.starts++;return play();};
    const width=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetWidth');
    Object.defineProperty(HTMLElement.prototype,'offsetWidth',{...width,get(){if(this.id==='carry-bar')burstCounts.layouts++;return width.get.call(this);}});
    for(let i=0;i<20;i++)game.emit('rescue',{x:game.player.x,y:game.player.y,kind:i%4,count:i+1});
  });
  await page.waitForFunction(()=>burstCounts.requests>0);
  assert.deepEqual(await page.evaluate(()=>burstCounts),{requests:1,starts:1,layouts:1});
  await page.evaluate(async()=>{
    const {game,audio}=await import('/dist/src/main.js');
    window.feverStarts=0;
    for(const media of Object.values(audio.sfx)){const play=media.play.bind(media);media.play=()=>{feverStarts++;return play();};}
    game.rainbow.left=12;
    for(const type of ['rainbowStart','rescue','bank','return','break'])game.emit(type,{x:game.player.x,y:game.player.y,kind:0,count:1,total:10});
  });
  await page.waitForFunction(async()=>{const {audio}=await import('/dist/src/main.js');return audio.rainbow&&!audio.bgm.paused;});
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>feverStarts),0);
  assert.ok(await page.evaluate(async()=>Object.values((await import('/dist/src/main.js')).audio.sfx).every(s=>s.paused)));
  await page.evaluate(async()=>{const {game}=await import('/dist/src/main.js');game.rainbow.left=0;game.emit('rescue',{x:game.player.x,y:game.player.y,kind:0,count:1});});
  await page.waitForFunction(()=>feverStarts>0);
  console.log('PASS: 20 simultaneous rescue events cause one media start and one HUD layout read.');
  console.log('PASS: fever entry and active fever play BGM only; effects resume afterwards.');
}finally{await browser.close();}
