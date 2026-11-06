import {t as _t} from './i18n.js';
// Gusts that change from area to area: a headwind makes forward progress hard, a tailwind speeds you up.
// Each gust is announced first (warn), then blows for a few seconds, then calms down.
export const WIND_WARN=1.6,WIND_BLOW=5;
export const WIND_KINDS=Object.freeze({
 head:{name:_t('向かい風'),hint:_t('前に進みにくい'),sign:-1},
 tail:{name:_t('追い風'),hint:_t('スピードアップ！'),sign:1},
});
// Per mode and area: seconds between gusts and push strength (px/s added to the target speed).
// NORMAL sky: calm at first, then a gentle breeze from the 2nd return so wind is introduced softly.
export const SKY_BREEZE=Object.freeze({from:2,every:[20,28],push:55,head:.4});
export function windPlan(mode,area,returns=0){
 let base=area?.wind;if(!base&&area?.id==='sky'&&returns>=SKY_BREEZE.from)base=SKY_BREEZE;if(!base&&mode!=='hard')return null;
 const plan=base||{every:[18,26],push:90,head:.5};
 return mode==='hard'?{every:plan.every.map(s=>s*.75),push:plan.push*1.25,head:Math.min(.8,plan.head+.1)}:plan;
}
export class Wind {
 constructor(){this.reset();}
 reset(){this.state='calm';this.left=8;this.kind=null;this.push=0;this.strength=0;}
 // Horizontal push for the hero right now (eases in and out so it never jerks).
 get force(){if(this.state!=='blow'||!this.kind)return 0;const t=1-this.left/WIND_BLOW,ease=Math.min(1,t/.15,(1-t)/.15);return WIND_KINDS[this.kind].sign*this.strength*Math.max(0,ease);}
 update(g,dt){
  const plan=g.isTraining?null:windPlan(g.mode,g.area,g.returnSequence||0);
  if(!plan){if(this.state!=='calm'){if(this.state==='blow')g.emit('windEnd',{kind:this.kind});this.reset();}return;}
  this.left-=dt;if(this.left>0)return;
  if(this.state==='calm'){this.kind=g.random()<plan.head?'head':'tail';this.strength=plan.push;this.state='warn';this.left=WIND_WARN;g.emit('windWarn',{kind:this.kind});return;}
  if(this.state==='warn'){this.state='blow';this.left=WIND_BLOW;g.emit('windStart',{kind:this.kind});return;}
  g.emit('windEnd',{kind:this.kind});this.state='calm';this.kind=null;const [lo,hi]=plan.every;this.left=lo+g.random()*(hi-lo);
 }
}
