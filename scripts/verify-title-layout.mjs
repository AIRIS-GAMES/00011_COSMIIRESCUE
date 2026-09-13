import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const viewport of [{width:390,height:640},{width:844,height:390},{width:667,height:320}]){
  const p=await browser.newPage({viewport,hasTouch:true});await p.goto('http://localhost:5180');await p.locator('#loading').waitFor({state:'hidden'});
  const layout=await p.evaluate(()=>{const title=document.querySelector('#title'),logo=title.querySelector('h1'),menu=title.querySelector('.start-area');return {w:title.clientWidth,h:title.clientHeight,logoRight:logo.offsetLeft+logo.offsetWidth,menuLeft:menu.offsetLeft,menuBottom:menu.offsetTop+menu.offsetHeight};});
  assert.ok(layout.logoRight<layout.w*.4);assert.ok(layout.menuLeft>layout.w*.62);assert.ok(layout.menuBottom<=layout.h-8,JSON.stringify(layout));
  await p.screenshot({path:`test-results/title-layout-${viewport.width}.png`});await p.locator('#start').tap();await p.locator('.face-transition').waitFor({state:'hidden'});assert.equal(await p.locator('#title').isVisible(),false);await p.close();
 }
 console.log('PASS: separate logo/cast/menu columns, menu fits short Safari-like and landscape viewports, PLAY works.');
}finally{await browser.close();}
