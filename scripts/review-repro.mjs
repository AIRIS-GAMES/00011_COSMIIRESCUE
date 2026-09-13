// Read-only review scenarios: isolated browser storage; no live analytics or game edits.
import {chromium} from '@playwright/test';
import {RescueGame,seededRandom,overlap} from '../src/engine.js';
import {stage} from '../src/stage.js';
const results={};
const sim=()=>{const g=new RescueGame(stage,seededRandom(4));g.start();g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];g.friends=[];return g;};
const g=sim();g.setDirection(-1);const x=g.player.x;for(let i=0;i<1200;i++)g.update(1/120);results.leftInput={seconds:10,startX:x,endX:g.player.x,velocity:g.player.vx,scrollX:g.scrollX};
const k=sim();k.time=40;k.player.x=500;k.player.y=576;k.player.vx=0;k.player.vy=0;k.scrollX=0;k.obstacles=[{asset:'knife',x:500,y:500,baseX:500,baseY:500,r:144,ry:60,size:465,angle:0,phase:0,disabled:0,motion:{x:0,y:0,speed:0},damage:2}];const before={x:k.player.x,y:k.player.y};k.update(1/120);results.knifeDisplacement={before,after:{x:k.player.x,y:k.player.y},displacement:Math.hypot(k.player.x-before.x,k.player.y-before.y)};
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});await p.locator('#flap').tap();await p.waitForTimeout(450);
 const returnInfo=await p.evaluate(async()=>{const {game:g}=await import('/src/main.js');g.world.extend=()=>{};g.incoming.update=()=>{};g.obstacles=[];g.homes=[];g.friends=[];g.carry=[];for(let i=0;i<20;i++)g.rescue(g.spawnFriend({x:g.player.x,y:g.player.y,kind:i%4}));g.beginReturn();return {total:g.bestReturn,delivered:20};});
 await p.waitForTimeout(180);await p.locator('#pause').tap();const pending=await p.evaluate(async()=>{const {game:g}=await import('/src/main.js');return {score:g.score,remaining:g.bankQueue.length};});await p.locator('#quit').tap();await p.locator('.face-transition').waitFor({state:'hidden'});results.returnThenQuit={...returnInfo,...pending,saved:await p.evaluate(()=>JSON.parse(localStorage.getItem('cosmii-endless-v1')))};
 await p.locator('#mode-hard').tap();await p.locator('#sound').tap();results.hardMute={beforeReload:await p.evaluate(async()=>(await import('/src/main.js')).audio.enabled)};await p.reload();await p.locator('#loading').waitFor({state:'hidden'});results.hardMute.afterReload=await p.evaluate(async()=>(await import('/src/main.js')).audio.enabled);
 // Simulate the browser's persisted pagehide/pageshow lifecycle without sending events.
 results.restoredAnalytics=await p.evaluate(async()=>{const {analytics}=await import('/src/analytics.js'),{game}=await import('/src/main.js');analytics.start(game);const before=analytics.active;window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));return {before,after:analytics.active};});
 const broken=await browser.newPage({viewport:{width:844,height:390}});await broken.route('**/Asset/cast/green.png',r=>r.abort());await broken.goto('http://localhost:5180');await broken.waitForTimeout(2200);results.assetFailure={bootVisible:await broken.locator('#boot-screen').isVisible(),bootText:await broken.locator('#boot-status').innerText(),underlyingMessage:await broken.locator('#loading span').innerText()};await broken.screenshot({path:'test-results/review-asset-failure.png'});
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
