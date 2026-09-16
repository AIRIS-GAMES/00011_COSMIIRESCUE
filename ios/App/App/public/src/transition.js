// Full supplied sprites, overlapping without cropping or changing proportions.
import {canvasResolution,smoothImages} from './canvas-resolution.js';
export class FaceTransition {
  constructor(){this.busy=false;this.canvas=document.createElement('canvas');this.canvas.className='face-transition';this.canvas.hidden=true;this.canvas.setAttribute('aria-hidden','true');document.querySelector('.arcade').append(this.canvas);}
  async run(images,change){
    if(this.busy)return;this.busy=true;const canvas=this.canvas;canvas.hidden=false;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration=reduced?160:1080,start=performance.now();let switched=false;
    try{await new Promise(resolve=>{
      const frame=now=>{
        const w=canvas.clientWidth,h=canvas.clientHeight,pixels=canvasResolution(w,h,devicePixelRatio||1);
        if(canvas.width!==pixels.width||canvas.height!==pixels.height){canvas.width=pixels.width;canvas.height=pixels.height;}
        const c=canvas.getContext('2d');c.setTransform(pixels.width/w,0,0,pixels.height/h,0,0);c.clearRect(0,0,w,h);smoothImages(c);
        let t=Math.min(1,(now-start)/duration);if(!switched&&t>=.48)t=.5;
        const cover=t<.48?t/.48:t<.62?1:1-(t-.62)/.38;
        canvas.dataset.phase=t<.48?'cover':t<.62?'covered':'reveal';
        if(cover===1){c.fillStyle='#fff4cf';c.fillRect(0,0,w,h);}
        const size=Math.max(105,Math.min(165,h*.36)),step=size*.78;
        for(let row=-1;row<=Math.ceil(h/step);row++)for(let col=-1;col<=Math.ceil(w/step);col++){
          const index=(row+2)*31+col+2,edge=index%4,delay=(index%5)*.025;
          const f=Math.max(0,Math.min(1,(cover-delay)/(1-delay))),ease=1-(1-f)**3;
          const tx=col*step+(row%2)*step*.5,ty=row*step;
          const sx=edge===0?-size:edge===1?w+size:tx,sy=edge===2?-size:edge===3?h+size:ty;
          if(f<=0)continue;
          c.save();c.translate(sx+(tx-sx)*ease,sy+(ty-sy)*ease);c.rotate(Math.sin(index)*.12);
          const img=images[index%images.length],scale=size*1.4/Math.max(img.width,img.height);
          const iw=img.width*scale,ih=img.height*scale;
          c.drawImage(img,-iw/2,-ih/2,iw,ih);c.restore();
        }
        if(t>=.48&&!switched){switched=true;change();}
        if(t<1)requestAnimationFrame(frame);else resolve();
      };requestAnimationFrame(frame);
    });}finally{canvas.hidden=true;this.busy=false;canvas.dataset.phase='idle';}
  }
}
