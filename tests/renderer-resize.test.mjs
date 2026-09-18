import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/renderer.js';
import {VIEW_W} from '../src/engine.js';

test('title artwork keeps its proportions when rotation layout settles after resize',()=>{
  const originalDensity=globalThis.devicePixelRatio;
  globalThis.devicePixelRatio=3;
  try{
    let transform, resets=0;
    const draws=[];
    const ctx=new Proxy({
      setTransform(a,b,c,d){transform={a,d};resets++;},
      drawImage(image,x,y,w,h){draws.push({image,w,h});},
    },{get:(target,key)=>target[key]??(()=>{})});
    const canvas={clientWidth:390,clientHeight:844,width:0,height:0};
    const guest={width:180,height:240};
    const renderer=Object.assign(Object.create(Renderer.prototype),{
      canvas,ctx,width:VIEW_W,zoom:.9,camera:{x:0,y:0},clock:0,
      reduced:true,assets:{hero:guest,friends:[guest],collaborationImages:Array(7).fill(guest)},
      scenery(){},star(){},
    });
    const game={collaboration:{enabled:true}};
    renderer.resize();
    // No further resize event: viewport units finish updating asynchronously.
    canvas.clientWidth=844;canvas.clientHeight=390;
    renderer.draw(game,0,true,true);
    assert.equal(game.view.h,VIEW_W*390/844/.9);
    assert.ok(draws.length>=5);
    for(const {image,w,h} of draws){
      const displayedWidth=w*transform.a*canvas.clientWidth/canvas.width;
      const displayedHeight=h*transform.d*canvas.clientHeight/canvas.height;
      assert.ok(Math.abs(displayedWidth/displayedHeight-image.width/image.height)<1e-10);
    }
    const settledResets=resets;
    renderer.draw(game,0,true,true);
    assert.equal(resets,settledResets,'unchanged frames must not reset the canvas');
  }finally{
    if(originalDensity===undefined)delete globalThis.devicePixelRatio;
    else globalThis.devicePixelRatio=originalDensity;
  }
});
