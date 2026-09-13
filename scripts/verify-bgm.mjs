import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:844,height:390}});
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(src){super(src);if(src?.endsWith('.mp3'))window.musicTrack=this;}};});
 await page.goto('http://localhost:5180');await page.locator('#loading').waitFor({state:'hidden'});
 assert.ok(await page.evaluate(()=>musicTrack.paused));
 await page.locator('#start').click();await page.waitForFunction(()=>musicTrack.currentTime>.2&&!musicTrack.paused);
 assert.ok(await page.evaluate(()=>musicTrack.loop&&musicTrack.duration>0&&!musicTrack.error));
 await page.locator('#pause').click();assert.ok(await page.evaluate(()=>musicTrack.paused));
 await page.locator('#resume').click();await page.waitForFunction(()=>!musicTrack.paused);
 await page.locator('#sound').click();assert.ok(await page.evaluate(()=>musicTrack.paused));
 await page.locator('#sound').click();await page.waitForFunction(()=>!musicTrack.paused);
 await page.locator('#pause').click();await page.locator('#quit').click();assert.ok(await page.evaluate(()=>musicTrack.paused));
 console.log('PASS: supplied MP3 decodes and plays, loops, pauses, resumes, mutes and stops on title.');
}finally{await browser.close();}
