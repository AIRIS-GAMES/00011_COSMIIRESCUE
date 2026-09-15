import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('test-results',{recursive:true});
try{
  const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
    window.artworkChecks=[];window.titleCast=new Set();window.carriedLabel='';
    const fillText=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/^\d+\/5$/.test(String(text)))window.carriedLabel=text;return fillText.call(this,text,...args);};
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(img,...args){
      if(img.src?.includes('/Asset/cast/'))window.titleCast.add(img.src.split('/').pop());
      if(img.src?.includes('/collaborations/')){
        const m=this.getTransform();window.artworkChecks.push({args:args.length,alpha:this.globalAlpha,filter:this.filter,rotation:Math.abs(m.b)+Math.abs(m.c),ratio:args[2]/args[3]-img.naturalWidth/img.naturalHeight});
        if(window.artworkChecks.length>300)window.artworkChecks.shift();
      }
      return draw.call(this,img,...args);
    };
  });
  await p.goto(process.env.GAME_URL||'http://localhost:5180/dist/index.html');await p.locator('#loading').waitFor({state:'hidden'});
  assert.equal(await p.locator('.collaboration-title').isVisible(),true);
  assert.deepEqual(await p.evaluate(()=>[...titleCast].sort()),['blue.png','green.png','pink.png','purple.png','red.png']);
  await p.screenshot({path:'test-results/collaboration-title.png'});
  // Background, logo and cast must never start a run; only PLAY activates it.
  for(const [x,y] of [[15,350],[175,220],[430,220]])await p.mouse.click(x,y);
  await p.locator('#canvas').evaluate(el=>{el.tabIndex=-1;el.focus();});
  for(const key of ['Space','ArrowUp','w'])await p.keyboard.press(key);
  assert.equal(await p.evaluate(async()=>(await import(new URL('./src/main.js',location.href))).game.state),'ready');
  assert.equal(await p.locator('#title').isVisible(),true);
  await p.locator('.collaboration-title').tap();await p.locator('#collaboration-details').waitFor({state:'visible'});
  assert.match(await p.locator('#collaboration-details').innerText(),/合計5体/);
  assert.equal(await p.evaluate(async()=>(await import(new URL('./src/main.js',location.href))).game.state),'ready');
  await p.screenshot({path:'test-results/collaboration-details.png'});
  await p.keyboard.press('Tab');assert.equal(await p.locator('.collaboration-close').evaluate(el=>el===document.activeElement),true);
  await p.locator('.collaboration-close').tap();assert.equal(await p.locator('#collaboration-details').isVisible(),false);
  await p.locator('.collaboration-title').tap();await p.keyboard.press('Escape');assert.equal(await p.locator('#collaboration-details').isVisible(),false);
  await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').tap();await p.waitForTimeout(400);
  await p.evaluate(async()=>{
    const {game:g,audio}=await import(new URL('./src/main.js',location.href));window.g=g;window.a=audio;
    g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];g.friends=[];g.carry=[];
    window.deliver=n=>{g.returnLock=0;for(let i=0;i<n;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4,collaborationKind:i%7}));g.beginReturn();while(g.bankQueue.length)g.bankOne();};
    for(const kind of [0,1,null])g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:0,collaborationKind:kind}));
  });
  await p.waitForFunction(()=>carriedLabel==='2/5');
  await p.evaluate(()=>g.carry.shift());await p.waitForFunction(()=>carriedLabel==='1/5');
  await p.evaluate(()=>{g.carry=[];deliver(3);});await p.waitForFunction(()=>carriedLabel==='0/5');
  assert.equal(await p.evaluate(()=>g.collaboration.progress),3);
  await p.evaluate(()=>deliver(2));
  await p.waitForFunction(()=>g.collaboration.active&&!a.bgm.paused&&a.bgm.currentSrc.includes('rainbow-24s'));
  await p.screenshot({path:'test-results/collaboration-fever.png'});
  await p.locator('#pause').tap();const left=await p.evaluate(()=>g.collaboration.left);await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>g.collaboration.left),left);assert.equal(await p.evaluate(()=>a.bgm.paused),true);
  await p.locator('#resume').tap();await p.waitForFunction(()=>!a.bgm.paused);
  await p.evaluate(()=>document.dispatchEvent(new Event('pause')));assert.equal(await p.evaluate(()=>a.bgm.paused),true);
  await p.locator('#resume').tap();
  await p.evaluate(()=>{g.collaboration.left=.001;});await p.waitForFunction(()=>!g.powered&&!a.bgm.paused&&a.bgm.currentSrc.includes('Hypnoticcuping'));
  await p.evaluate(()=>g.finish());await p.locator('#result').waitFor({state:'visible'});
  assert.match(await p.locator('.collaboration-result').innerText(),/5体/);
  await p.screenshot({path:'test-results/collaboration-result.png'});
  assert.equal(await p.evaluate(()=>artworkChecks.length>0&&artworkChecks.every(c=>c.args===4&&c.alpha===1&&c.filter==='none'&&c.rotation<.00001&&Math.abs(c.ratio)<.00001)),true);
  await p.locator('#home').tap();await p.locator('.face-transition').waitFor({state:'hidden'});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);await p.screenshot({path:'test-results/collaboration-portrait.png'});
  // The next title refresh ends a campaign without requiring a page reload.
  await p.evaluate(()=>{g.collaboration.config.endsAt='2000-01-01T00:00:00+09:00';});
  await p.waitForFunction(()=>!g.collaboration.enabled);assert.equal(await p.locator('.collaboration-title').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: 3+2 delivered guests, ten-second fever/music, pause/native background/resume, result count, expiry, and full opaque unrotated artwork.');
}finally{await browser.close();}
