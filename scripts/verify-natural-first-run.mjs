import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true}),reports=[];
try{for(const probe of ['return','rim']){
 const p=await b.newPage({viewport:{width:844,height:390}});await p.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
 await p.goto('http://localhost:5180/index.html?opening=off&analytics=off');await p.locator('#boot-screen').waitFor({state:'hidden'});await p.locator('#start').click();await p.locator('.face-transition').waitFor({state:'hidden'});
 // Observer only: retain every original event, no changes to world, RNG, contacts or physics.
 await p.evaluate(async()=>{const g=(await import('/src/main.js')).game,drain=g.drain.bind(g);window.observed=[];g.drain=()=>{const events=drain();window.observed.push(...events.map(e=>({type:e.type,time:g.time,kind:e.kind,count:e.count})));return events;};});
 let key=null,firstRescue=null,closest=Infinity,rim=false,homeVisible=false,last,approach=false;
 for(let i=0;i<500;i++){
  const s=await p.evaluate(async()=>{const g=(await import('/src/main.js')).game;return {time:g.time,state:g.state,p:{...g.player},carry:g.carry.length,rescued:g.rescued,home:{...g.stage.home},friends:g.friends.filter(f=>!f.cooldown).map(f=>({x:f.x,y:f.y,kind:f.kind})),rim:window.observed.some(e=>e.type==='rim'),events:window.observed,homeVisible:!document.getElementById('home-direction').hidden};});last=s;
  if(s.rescued||s.state!=='playing')break;
  let target;
  if(s.carry){if(firstRescue===null)firstRescue=s.time;closest=Math.min(closest,Math.hypot(s.p.x-s.home.x,s.p.y-s.home.y));homeVisible ||= s.homeVisible;rim ||= s.rim;if(probe==='rim'&&rim&&Math.abs(s.p.y-s.home.y)>55)approach=true;if(approach&&Math.abs(s.p.x-s.home.x)>145&&Math.abs(s.p.y-s.home.y)<45)approach=false;target=approach?{x:s.home.x+(s.p.x<s.home.x?-190:190),y:s.home.y}:{x:s.home.x,y:s.home.y+(probe==='rim'&&!rim?-105:0)};}
  else target=s.friends.reduce((a,f)=>!a||Math.hypot(f.x-s.p.x,f.y-s.p.y)<Math.hypot(a.x-s.p.x,a.y-s.p.y)?f:a,null);
  if(!target)break;
  const next=target.x>s.p.x?'ArrowRight':'ArrowLeft';if(next!==key){if(key)await p.keyboard.up(key);await p.keyboard.down(next);key=next;}
  if(s.p.y+s.p.vy*.12>target.y-10&&s.p.vy>=0){const box=await p.locator('#flap').boundingBox();await p.mouse.click(box.x+box.width/2,box.y+box.height/2);}
  await p.waitForTimeout(40);
 }
 if(key)await p.keyboard.up(key);
 const report={probe,firstRescue,closest,homeVisible,rimObserved:last?.rim||rim,returned:last?.rescued||0,seconds:last?.time,state:last?.state,events:last?.events};reports.push(report);await p.screenshot({path:`test-results/natural-${probe}.png`});console.log(JSON.stringify(report));await p.close();
}}finally{await fs.writeFile('test-results/natural-play.json',JSON.stringify(reports,null,2));await b.close();}
