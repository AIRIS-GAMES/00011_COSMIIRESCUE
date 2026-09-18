import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';

// Check the rendered image axes, including the CSS-rotated portrait layout.
for(const [name,type,options] of [['chrome',chromium,{channel:'chrome'}],['webkit',webkit,{}]]){
  const browser=await type.launch({headless:true,...options});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.TEST_URL||'http://localhost:5180');
    await page.locator('#loading').waitFor({state:'hidden'});
    await page.evaluate(()=>{
      const original=CanvasRenderingContext2D.prototype.drawImage;
      window.titleImageRatios=[];
      CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
        if(this.canvas.id==='canvas'&&args.length===4){
          const m=this.getTransform(),sx=this.canvas.clientWidth/this.canvas.width,sy=this.canvas.clientHeight/this.canvas.height;
          const width=args[2]*Math.hypot(m.a*sx,m.b*sy),height=args[3]*Math.hypot(m.c*sx,m.d*sy);
          window.titleImageRatios.push({src:image.src,error:Math.abs(width/height-image.naturalWidth/image.naturalHeight)});
        }
        return original.call(this,image,...args);
      };
    });
    for(const [width,height] of [[844,390],[390,844],[844,390],[667,320],[320,667]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>{window.titleImageRatios=[];});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const ratios=await page.evaluate(()=>window.titleImageRatios);
      assert.ok(ratios.length>0,`${name}: menu must draw images`);
      assert.ok(ratios.every(result=>result.error<.001),`${name} ${width}x${height}: ${JSON.stringify(ratios.filter(result=>result.error>=.001))}`);
      assert.ok(await page.locator('#title').isVisible());
    }
    await page.screenshot({path:`test-results/title-rotation-${name}.png`});
    assert.deepEqual(errors,[]);
    console.log(`PASS: ${name} menu image proportions across repeated portrait/landscape rotations.`);
  }finally{await browser.close();}
}
