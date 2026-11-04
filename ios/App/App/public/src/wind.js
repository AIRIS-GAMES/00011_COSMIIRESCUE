// Gusts that change from area to area: a headwind makes forward progress hard, a tailwind speeds you up.
// Each gust is announced first (warn), then blows for a few seconds, then calms down.
export const WIND_WARN=1.6,WIND_BLOW=5;
export const WIND_KINDS=Object.freeze({
 head:{name:'向かい風',hint:'前に進みにくい',sign:-1},
 tail:{name:'追い風',hint:'スピードアップ！',sign:1},
});
// Per mode and area: seconds between gusts and push strength (px/s added to the target speed).
export function windPlan(mode,area){
 const base=area?.wind;if(!base&&mode!=='hard')return null;
 const plan=base||{every:[18,26],push:90,head:.5};
 return mode==='hard'?{every:plan.every.map(s=>s*.75),push:plan.push*1.25,head:Math.min(.8,plan.head+.1)}:plan;
}
export class Wind {
 constructor(){this.reset();}
 reset(){this.state='calm';this.left=8;this.kind=null;this.push=0;this.strength=0;}
 // Horizontal push for the hero right now (eases in and out so it never jerks).
 get force(){if(this.state!=='blow'||!this.kind)return 0;const t=1-this.left/WIND_BLOW,ease=Math.min(1,t/.15,(1-t)/.15);return WIND_KINDS[this.kind].sign*this.strength*Math.max(0,ease);}
 update(g,dt){
  const plan=g.isTraining?null:windPlan(g.mode,g.area);
  if(!plan){if(this.state!=='calm'){if(this.state==='blow')g.emit('windEnd',{kind:this.kind});this.reset();}return;}
  this.left-=dt;if(this.left>0)return;
  if(this.state==='calm'){this.kind=g.random()<plan.head?'head':'tail';this.strength=plan.push;this.state='warn';this.left=WIND_WARN;g.emit('windWarn',{kind:this.kind});return;}
  if(this.state==='warn'){this.state='blow';this.left=WIND_BLOW;g.emit('windStart',{kind:this.kind});return;}
  g.emit('windEnd',{kind:this.kind});this.state='calm';this.kind=null;const [lo,hi]=plan.every;this.left=lo+g.random()*(hi-lo);
 }
}
