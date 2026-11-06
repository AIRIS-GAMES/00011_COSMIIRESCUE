import {icon} from './icons.js';
import {roomArt,roomCast,walkFrames} from './room-data.js';
import {returnCounts,rainFrame,RAIN_SECONDS} from './return-rain.js';
import {t as _t} from './i18n.js';

// Arrivals match saved returns; overlapping hidden sprites never need DOM nodes.
export class RoomCelebration {
 constructor(host,total,counts,onClose){
  this.onClose=onClose;
  this.root=document.createElement('section');this.root.className='room-celebration';
  this.root.setAttribute('aria-label',_t('累計帰還'));
  this.root.innerHTML=`<div class="return-cabinet"><img class="return-background" src="${roomArt}" alt=""><div class="return-crowd" aria-hidden="true"></div></div><div class="return-rays" aria-hidden="true"></div><div class="return-confetti" aria-hidden="true"></div><span class="return-popper left" aria-hidden="true">${icon('popper')}</span><span class="return-popper right" aria-hidden="true">${icon('popper')}</span><div class="return-result" role="status"><span>${_t('累計帰還')}</span><strong>${total.toLocaleString('ja-JP')}<small>${_t('体！！')}</small></strong>${total===0?_t('<p>最初の仲間を迎えにいこう！</p>'):''}</div><button type="button" class="return-close back-button" aria-label="${_t('お部屋にもどる')}"><small>${_t('もどる')}</small></button>`;
  this.root.style.setProperty('--digits',Math.max(4,total.toLocaleString('ja-JP').length));
  const crowd=this.root.querySelector('.return-crowd');
  this.counts=returnCounts(total,counts);this.canvas=document.createElement('canvas');this.canvas.className='return-rain';crowd.append(this.canvas);
  if(total<=108){const order=this.counts.flatMap((n,color)=>Array.from({length:n},(_,index)=>({color,index,time:(index+1)/n}))).sort((a,b)=>a.time-b.time||a.color-b.color);this.positions=new Map(order.map((item,i)=>[item.color+':'+item.index,i]));}
  this.images=roomCast.slice(1).map(c=>{const image=new Image();image.src=walkFrames(c.id)[3];image.onload=()=>{if(!this.dead)this.paintRain(this.seconds||0);};return image;});
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.resizeObserver=new ResizeObserver(()=>{if(!this.dead)this.paintRain(this.seconds||0);});this.resizeObserver.observe(crowd);
  const confetti=this.root.querySelector('.return-confetti'),colors=['#ff6eaa','#ffe351','#74e7fc','#b4ff75','#c195ff'];
  for(let i=0;i<100;i++){
   const bit=document.createElement('i'),left=i%2===0;
   bit.style.cssText=`left:${left?-3:103}%;top:${48+Math.random()*35}%;--dx:${(left?1:-1)*(20+Math.random()*80)}cqw;--dy:${-15-Math.random()*35}cqh;--spin:${(Math.random()-.5)*1400}deg;--delay:${1.3+Math.random()*.7}s;--color:${colors[i%colors.length]};--duration:${1.6+Math.random()*1.5}s;`;
   confetti.append(bit);
  }
  host.append(this.root);this.root.dispatchEvent(new CustomEvent('cosmii-celebration-sound',{bubbles:true,detail:'start'}));
  this.root.querySelector('.return-close').onclick=()=>onClose();
  this.root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}});
  this.root.querySelector('.return-close').focus();
  const start=performance.now();const tick=now=>{if(this.dead)return;this.seconds=this.reduced?RAIN_SECONDS:Math.min(RAIN_SECONDS,(now-start)/1000);this.paintRain(this.seconds);if(this.seconds<RAIN_SECONDS)this.raf=requestAnimationFrame(tick);};this.raf=requestAnimationFrame(tick);
 }
 paintRain(seconds){
  const canvas=this.canvas,w=canvas.parentElement.clientWidth,h=canvas.parentElement.clientHeight;if(!w||!h)return;
  const scale=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(w*scale)||canvas.height!==Math.round(h*scale)){canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);}
  const ctx=canvas.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,w,h);
  const frame=rainFrame(this.counts,seconds);this.root.dataset.arrived=frame.landed.reduce((a,b)=>a+b,0);this.root.dataset.arrivedColors=frame.landed.join(',');this.root.dataset.rainComplete=String(frame.done);
  const size=Math.min(w*.14,h*.29);
  const draw=(item,x,y,tilt)=>{const img=this.images[item.color];if(!img.complete||!img.naturalWidth)return;ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.drawImage(img,-size/2,-size,size,size);ctx.restore();};
  const cols=Math.min(12,this.counts.reduce((a,b)=>a+b,0));
  const position=i=>({x:w/2+(i%12-(cols-1)/2)*w*.081+(Math.floor(i/12)%2?w*.02:0),y:h-Math.floor(i/12)*h*.095,tilt:Math.sin(i*13)*.24});
  frame.pile.forEach((item,i)=>{const p=position(this.positions?.get(item.color+':'+item.index)??i);draw(item,p.x,p.y,p.tilt);});
  frame.falling.forEach(item=>{const seed=item.index*17+item.color*31;const slot=this.positions?.get(item.color+':'+item.index);const p=slot===undefined?{x:w*(.08+((seed*37)%97)/97*.84),y:h*(1-Math.min(8,Math.floor(frame.pile.length/12))*.095),tilt:0}:position(slot);const y=-size+(p.y+size)*item.progress**1.7;draw(item,p.x,y,p.tilt+Math.sin(seed)*.4*(1-item.progress));});
 }
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();for(const image of this.images)image.onload=null;this.root.dispatchEvent(new CustomEvent('cosmii-celebration-sound',{bubbles:true,detail:'stop'}));this.root.remove();}
}
