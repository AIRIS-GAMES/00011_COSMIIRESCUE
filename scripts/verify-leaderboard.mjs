import {chromium} from '@playwright/test';
import {PGlite} from '@electric-sql/pglite';
import {readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {newRunId} from '../src/leaderboard.js';
const base=process.env.TEST_URL||'http://localhost:5180';
const db=await PGlite.create(),browser=await chromium.launch({headless:true});
try{
  await db.exec('create role anon; create role authenticated;');
  await db.exec(await readFile(new URL('../supabase/migrations/202609300001_event_leaderboard.sql',import.meta.url),'utf8'));
  await db.exec('set role anon');
  for(let i=0;i<22;i++)await db.query('select public.cosmii_submit_score($1,$2,$3,$4,$5,$6)',['cosmii-event-01',newRunId(),`COSMII ${i+1}`,6000-i*100,10,200]);
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/leaderboard-config.js',route=>route.fulfill({contentType:'text/javascript',body:"export const leaderboardConfig={url:'https://ranking-test.supabase.co',publishableKey:'sb_publishable_test',eventId:'cosmii-event-01'};"}));
  let failAfterCommit=true;const sent=[];
  await page.route('https://ranking-test.supabase.co/rest/v1/rpc/*',async route=>{
    if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey,content-type'}});
    const name=route.request().url().split('/').pop(),p=route.request().postDataJSON();
    let data;
    if(name==='cosmii_top_scores')data=(await db.query('select * from public.cosmii_top_scores($1)',[p.p_event_id])).rows;
    else{
      sent.push(p);
      data=(await db.query('select public.cosmii_submit_score($1,$2,$3,$4,$5,$6) as data',[p.p_event_id,p.p_run_id,p.p_name,p.p_score,p.p_rescued,p.p_seconds])).rows[0].data;
      if(failAfterCommit){failAfterCommit=false;return route.abort('failed');}
    }
    await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)});
  });
  await page.goto(base+'/?analytics=off');await page.waitForSelector('#boot-screen',{state:'hidden'});
  await page.tap('#records');await page.waitForFunction(()=>document.querySelectorAll('#record-list li').length===20);
  assert.match(await page.locator('#record-list li').first().innerText(),/6,000/);
  await page.tap('#ranking-local');assert.match(await page.locator('#ranking-status').innerText(),/まだ記録/);
  await page.tap('#ranking-online');await page.waitForFunction(()=>document.querySelectorAll('#record-list li').length===20);
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/ranking-mobile.png'});
  await page.tap('#close-records');assert.equal(await page.locator('.face-transition').isVisible(),false);
  await page.tap('#start');await page.waitForSelector('.face-transition',{state:'hidden'});
  await page.evaluate(async()=>{const {game}=await import('/src/main.js');game.score=5000;game.rescued=20;});
  await page.tap('#pause');await page.tap('#quit');await page.waitForSelector('#result',{state:'visible'});
  assert.equal(await page.locator('.ranking-entry').isVisible(),true);
  await page.locator('#ranking-name').tap();
  assert.equal(await page.locator('.ranking-name-dialog').evaluate(el=>el.parentElement===document.body&&getComputedStyle(el).transform==='none'),true);
  await page.locator('#ranking-editor-input').fill('コスミー🐱');
  await page.screenshot({path:'test-results/ranking-name-portrait.png'});
  // Simulate the reduced visible area occupied by a phone keyboard.
  await page.setViewportSize({width:390,height:320});
  const done=page.locator('.ranking-name-card button[type="submit"]');
  const box=await done.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=320);
  await done.tap();await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#ranking-name').inputValue(),'コスミー🐱');
  await page.screenshot({path:'test-results/ranking-result-mobile.png'});
  await page.locator('.ranking-entry button').tap();
  await page.waitForFunction(()=>document.querySelector('.ranking-entry button').textContent==='再試行');
  assert.equal(await page.locator('#ranking-name').isDisabled(),true);
  await page.locator('.ranking-entry button').tap();
  await page.waitForFunction(()=>document.querySelector('.ranking-entry button').textContent==='登録済み');
  assert.equal(sent.length,2);assert.deepEqual(sent[0],sent[1]);
  assert.match(await page.locator('.ranking-entry-status').innerText(),/12 位/);
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:'test-results/ranking-result-landscape.png'});
  await page.tap('#home');await page.waitForSelector('.face-transition',{state:'hidden'});
  await page.tap('#records');await page.waitForFunction(()=>document.querySelectorAll('#record-list li').length===20);
  assert.equal(await page.locator('#record-list li').filter({hasText:'コスミー🐱'}).count(),1);
  await page.tap('#close-records');await page.tap('#mode-hard');await page.tap('#start');await page.waitForSelector('.face-transition',{state:'hidden'});
  await page.tap('#pause');await page.tap('#quit');await page.waitForSelector('#result',{state:'visible'});
  assert.equal(await page.locator('.ranking-entry').isVisible(),false);assert.deepEqual(errors,[]);
  console.log('PASS: top 20, local tabs, NORMAL manual end, Japanese name, failed-response retry without duplicates, HARD exclusion, portrait and landscape.');
}finally{await browser.close();await db.close();}
