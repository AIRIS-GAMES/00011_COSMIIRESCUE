import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5180');
  await page.locator('#loading').waitFor({state:'hidden'});
  await page.locator('#start').click();await page.locator('.face-transition').waitFor({state:'hidden'});
  await page.locator('#flap').tap();await page.waitForTimeout(450);
  const result=await page.evaluate(async()=>{
    const {game:g,renderer:r}=await import('/src/main.js');
    const {hazardTypes}=await import('/src/hazards.js');
    g.world.extend=()=>{};g.incoming.update=()=>{};g.homes=[];
    g.carry=[];for(const f of g.friends.slice(0,5))g.rescue(f);g.friends=[];g.drain();
    const p=g.player;g.obstacles=[{...hazardTypes.knife,asset:'knife',x:p.x+20,y:p.y,baseX:p.x+20,baseY:p.y,r:28,size:230,phase:0,disabled:0,angle:Math.PI}];
    g.cooldown=0;g.hitstop=0;g.update(1/120);
    const events=g.drain();for(const e of events)r.event(e);
    const drops=r.particles.filter(p=>p.blood);g.state='ready';
    // Freeze the effect briefly to inspect sprite transparency and small droplets.
    for(const p of drops){p.x+=p.vx*.12;p.y+=p.vy*.12;p.vx=0;p.vy=0;p.life=1;}
    return {bloodEvents:events.filter(e=>e.type==='blood').length,drops:drops.length,carry:g.carry.length};
  });
  assert.equal(result.bloodEvents,1);assert.equal(result.carry,2);assert.ok(result.drops>=8&&result.drops<=11);
  await page.screenshot({path:'test-results/blood-impact.png'});
  await page.waitForTimeout(1250);
  assert.equal(await page.evaluate(async()=>(await import('/src/main.js')).renderer.particles.filter(p=>p.blood).length),0);
  assert.deepEqual(errors,[]);console.log('PASS: knife impact, small blood burst, friend loss, particle expiry and browser runtime.');
}finally{await browser.close();}
