import {friends} from './characters.js';
import {skillNames,SKILL_SECONDS,SKILL_REQUIREMENTS,skillRequirement} from './skills.js';
export class SkillUI {
 constructor(activate){
  this.bar=document.createElement('div');this.bar.id='skill-bar';this.bar.hidden=true;this.bar.setAttribute('role','group');this.bar.setAttribute('aria-label','仲間の技：ピンク3匹、水色4匹、赤5匹、紫6匹で発動');
  this.buttons=friends.map((friend,kind)=>{
   const button=document.createElement('button');button.type='button';button.dataset.kind=kind;
   button.innerHTML=`<img src="${friend.src}" alt=""><span>0/${SKILL_REQUIREMENTS[kind]}</span><small></small><i class="skill-time" aria-hidden="true"></i>`;button.title=skillNames[kind];
   button.onclick=()=>activate(kind);this.bar.append(button);return button;
  });
  this.cutin=document.createElement('div');this.cutin.id='skill-cutin';this.cutin.hidden=true;this.cutin.setAttribute('aria-hidden','true');
  this.cutin.innerHTML='<div class="skill-wave"></div><img alt=""><strong></strong>';
  document.getElementById('game').append(this.bar,this.cutin);
 }
 update(game,visible){
  const show=visible&&(!game.isTraining||game.practiceStep>=2);this.bar.hidden=!show;
  document.getElementById('game').classList.toggle('has-skills',show);
  this.buttons.forEach((button,kind)=>{
   const active=game.skillLeft[kind]>0;
   const need=skillRequirement(game,kind),ready=game.skillCharge[kind]===need&&!active;
   button.disabled=!show||(game.isTraining&&game.practiceStep!==4)||game.state!=='playing'||!ready||!!game.skillCutin;
   const label=active?`${game.skillLeft[kind].toFixed(1)}秒`:ready?'発動':`${game.skillCharge[kind]}/${need}`;
   button.querySelector('span').textContent=label;button.querySelector('small').textContent=active?'発動中':'';button.style.setProperty('--remaining',`${game.skillLeft[kind]/SKILL_SECONDS*100}%`);button.dataset.ready=String(ready);button.dataset.active=String(!!active);
   button.setAttribute('aria-label',`${skillNames[kind]}：${active?'発動中・残り':''}${label}`);
   button.style.setProperty('--charge',`${game.skillCharge[kind]/need*100}%`);
  });
  this.cutin.hidden=!visible||!game.skillCutin;
  if(game.skillCutin){
   const {kind,left}=game.skillCutin,t=1-left/.6;
   this.cutin.dataset.kind=kind;this.cutin.style.setProperty('--burst',String(t));
   const img=this.cutin.querySelector('img');if(img.getAttribute('src')!==friends[kind].src)img.src=friends[kind].src;
   const scale=.7+Math.sin(t*Math.PI)*.4;
   img.style.transform=kind===0?`translateX(${(t-.5)*100}%) scale(${scale*1.2},${scale*.7})`:kind===1?`scale(${scale*1.3})`:kind===2?`translateY(${-Math.sin(t*Math.PI)*35}px) rotate(${t*25-12}deg) scale(${scale})`:`rotate(${Math.sin(t*Math.PI)*15}deg) scale(${scale})`;
   this.cutin.querySelector('strong').textContent=skillNames[kind]+'！';
  }
 }
}
