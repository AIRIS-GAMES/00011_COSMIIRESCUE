// Run after: npm run build -- --without-collaboration && npx cap sync ios
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
for(const root of ['dist','ios/App/App/public']){
  await assert.rejects(access(`${root}/Asset/collaborations`),{code:'ENOENT'});
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const p=await browser.newPage({viewport:{width:844,height:390}}),requests=[],errors=[];
  p.on('request',r=>{if(r.url().includes('/Asset/collaborations/'))requests.push(r.url());});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5180/dist/index.html');await p.locator('#loading').waitFor({state:'hidden'});
  assert.equal(await p.locator('.collaboration-title').count(),0);
  assert.equal(await p.locator('.collaboration-credit').count(),0);
  await p.screenshot({path:'test-results/collaboration-off.png'});
  await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').click();
  await p.evaluate(async()=>{
    const {game:g}=await import('/dist/src/main.js');window.g=g;g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];g.friends=[];g.carry=[];
    for(let i=0;i<20;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4}));g.beginReturn();
  });
  assert.equal(await p.evaluate(()=>g.collaboration.enabled),false);assert.equal(await p.evaluate(()=>g.rainbow.left),12);
  await p.waitForFunction(async()=>{const {audio}=await import('/dist/src/main.js');return !audio.bgm.paused&&audio.bgm.currentSrc.includes('rainbow-24s');});
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  console.log('PASS: OFF build/sync contain no campaign assets, request no artwork, show original title and restore twenty-friend rainbow.');
}finally{await browser.close();}
