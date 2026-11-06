import {t as _t} from './i18n.js';
// A short "what am I doing?" slide shown before a run starts: gather friends → fly through the HOME ring → points.
// Shown for the first few runs, and keeps appearing until the player has brought friends HOME once.
export const GOAL_KEY='cosmii-goal-v1',GOAL_MIN_SHOWS=3,GOAL_MAX_SHOWS=10,GOAL_AUTO_CLOSE=8.5;
export function shouldShowGoal(shows,returnedBefore){return shows<GOAL_MIN_SHOWS||(!returnedBefore&&shows<GOAL_MAX_SHOWS);}
export class GoalCard {
 constructor({parent,storage}={}){
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}this.storage=storage;this.open=false;this.onClose=null;
  const root=this.root=document.createElement('div');root.id='goal-card';root.className='goal-card';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','goal-title');
  // A tiny looping scene instead of a text box: the hero picks up three friends, the line flies through the ring, +3.
  const friend=(i,color)=>`<span class="goal-mover goal-f${i}"><img src="./Asset/cast/${color}.png" alt=""></span><span class="goal-pop goal-pop${i}" style="left:${[24,38,52][i]}%"></span>`;
  root.innerHTML=`<div class="goal-stage"><h2 id="goal-title" class="goal-title">${_t('なかまを集めて、HOMEへとどけよう！')}</h2>
   <div class="goal-ribbon"><div class="goal-lane" aria-hidden="true"><img class="goal-ring" src="./Asset/stage/checkpoint-cosmii.png" alt="">
    ${friend(0,'pink')}${friend(1,'blue')}${friend(2,'red')}<span class="goal-mover goal-hero"><img src="./Asset/cast/green.png" alt=""></span><span class="goal-points">+3</span></div>
    <ol class="goal-caps"><li>${_t('ふれて集める')}</li><li>${_t('わっかを通る')}</li><li>${_t('1匹＝1点')}</li></ol></div>
   <p class="goal-tap">${_t('タップでスタート')}</p></div>`;
  const close=event=>{if(!this.open)return;event.preventDefault();event.stopPropagation();this.close();};
  // Capture so the dismissing tap/key never also flaps, steers or pauses.
  root.addEventListener('pointerdown',close);root.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  document.addEventListener('keydown',e=>{if(this.open&&!e.repeat)close(e);},{capture:true});
  (parent||document.body).append(root);
 }
 get shows(){try{return Math.max(0,Number(JSON.parse(this.storage?.getItem(GOAL_KEY)||'{}').shows)||0);}catch{return 0;}}
 wanted(returnedBefore){return shouldShowGoal(this.shows,returnedBefore);}
 show(onClose){
  try{this.storage?.setItem(GOAL_KEY,JSON.stringify({shows:this.shows+1}));}catch{}
  this.onClose=onClose;this.open=true;this.left=GOAL_AUTO_CLOSE;this.root.hidden=false;
  
 }
 update(dt){if(this.open&&(this.left-=dt)<=0)this.close();}
 close(){if(!this.open)return;this.open=false;this.root.hidden=true;const done=this.onClose;this.onClose=null;done?.();}
}
