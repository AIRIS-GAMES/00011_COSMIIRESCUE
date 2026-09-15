import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:844,height:390}});
  await page.goto('http://localhost:5180/dist/index.html');
  await page.locator('#loading').waitFor({state:'hidden'});
  const result=await page.evaluate(async()=>{
    const {renderer}=await import('/dist/src/main.js');
    const {biomes,drawBiome}=await import('/dist/src/biomes.js');
    const r=Object.create(renderer),canvas=document.createElement('canvas');
    canvas.width=r.width;canvas.height=r.height;r.ctx=canvas.getContext('2d');
    r.stage={props:[]};r.clock=10;r.theme=biomes[0];r.previousTheme=biomes[0];r.themeStart=0;
    let backgrounds=0;const fill=r.ctx.fillRect.bind(r.ctx);
    r.ctx.fillRect=(...args)=>{backgrounds++;fill(...args);};
    drawBiome(r,biomes[0]);drawBiome(r,biomes[0]);
    const before=canvas.toDataURL(),oldBackgrounds=backgrounds;backgrounds=0;
    r.scenery({},true);
    const identical=before===canvas.toDataURL();
    let images=0;r.image=()=>images++;
    const f={x:r.camera.x+100,y:r.camera.y+100,kind:0,phase:0};
    r.friend(f);const visible=images;
    for(let i=0;i<200;i++)r.friend({...f,x:r.camera.x-1000-i});
    const offscreen=images-visible;
    r.friend({...f,x:r.camera.x-20});
    return {oldBackgrounds,backgrounds,identical,visible,offscreen,edge:images-visible-offscreen};
  });
  assert.deepEqual(result,{oldBackgrounds:2,backgrounds:1,identical:true,visible:1,offscreen:0,edge:1});
  console.log('PASS:',JSON.stringify(result));
}finally{await browser.close();}
