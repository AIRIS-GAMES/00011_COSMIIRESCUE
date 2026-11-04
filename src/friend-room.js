import {collectibleItems} from './collection.js';
import {RoomCelebration} from './room-celebration.js';
import {characterNames} from './character-profiles.js';
import {ROOM_KEY,roomArt,roomProps,roomLayout,roomCast,roomResidents,validRoomState,propUnlocked,expressionFrames,walkFrames,walkTarget,walkable} from './room-data.js';
import {bonusPropsFrom,TREAT,DailyMissions} from './missions.js';
const neonColors={green:'#a5ff53',pink:'#ff86bf',blue:'#65dfff',red:'#ff626b',purple:'#cf8aff'};
export class FriendRoom {
 constructor(body,progress,measure=()=>{}){
  this.measure=(name,data={})=>{try{measure(name,{source:'room',...data});}catch{}};
  let revisit=false;try{revisit=localStorage.getItem('cosmii-room-visited-v1')==='1';localStorage.setItem('cosmii-room-visited-v1','1');}catch{}
  this.measure('room_open',{revisit});
  this.body=body;this.progress=progress;progress?.load();this.total=progress?.totalReturned||0;this.residents=roomResidents(progress?.data.counts);this.selected=null;this.slot=0;this.mode='room';this.elapsed=0;this.last=0;this.dead=false;
  let data;try{data=JSON.parse(localStorage.getItem(ROOM_KEY)||localStorage.getItem('cosmii-friend-room-v1'));}catch{}this.bonus=bonusPropsFrom();this.state=validRoomState(data,this.total,this.bonus);
  body.classList.add('friend-room-body');
  body.innerHTML=`<div class="room-summary"><button type="button" class="room-return-total">✦ 累計帰還を見る</button><span class="room-instruction">歩いているコスミーを選ぼう</span></div>
   <div class="cabinet-room"><img class="cabinet-base" src="${roomArt}" alt="星のかざりがあるクレーンゲーム風のお部屋"><div class="cabinet-props"></div><div class="cabinet-residents"></div>
    <p class="room-empty-note" ${this.total?'hidden':''}>仲間をHOMEへ届けると、この部屋にやってくるよ</p>
    <section class="room-decor" id="room-decor" aria-label="もようがえ" hidden><header><strong>もようがえ</strong><button class="room-decor-done" type="button">完了 ✓</button></header><p class="room-decor-progress"></p><div class="room-slots" role="group" aria-label="置く場所">${roomLayout.slots.map((s,i)=>`<button type="button" data-slot="${i}">${s.name}</button>`).join('')}</div><div class="room-decor-options"></div><p class="room-decor-message" role="status"></p></section>
   </div>
   <div class="room-toolbar"><div class="room-selected-info"><span class="room-selected-label">コスミーを選択</span></div><button class="room-interact" type="button" disabled>♡ ふれあう</button><button class="room-decor-toggle" type="button" aria-expanded="false" aria-controls="room-decor">▧ もようがえ</button></div>
   <section class="room-focus" aria-label="コスミーとふれあう" hidden><button type="button" class="room-pet-target"><img alt=""></button><div class="room-tap-effects" aria-hidden="true"></div><div class="room-snack-effect" aria-hidden="true"></div><div class="room-snacks"><div class="room-snack-options" hidden></div><button class="room-snack-toggle" type="button" aria-expanded="false"><img src="./Asset/objects/apple.png" alt=""><span>おやつ</span></button></div><button type="button" class="room-focus-back back-button" aria-label="お部屋にもどる"><small>もどる</small></button></section>`;
  this.scene=body.querySelector('.cabinet-room');this.layer=body.querySelector('.cabinet-residents');this.propsLayer=body.querySelector('.cabinet-props');this.drawer=body.querySelector('.room-decor');this.focus=body.querySelector('.room-focus');this.toolbar=body.querySelector('.room-toolbar');this.target=body.querySelector('.room-pet-target');this.focusImage=this.target.querySelector('img');this.effects=body.querySelector('.room-tap-effects');this.shell=body.closest('.community-screen');
  this.scene.insertAdjacentHTML('beforeend',`<div class="room-trust" hidden><div class="room-trust-medal" aria-hidden="true"><img src="./Asset/ui/trust/badge.png" alt=""><strong class="room-trust-value">0</strong><span class="room-trust-title">信頼度</span></div><div class="room-trust-track" role="progressbar" aria-label="信頼度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><span class="room-trust-fraction" aria-hidden="true">0/100</span></div></div>`);
  this.actors=this.residents.map((c,index)=>{const point=walkTarget(this.state.slots),button=document.createElement('button');button.type='button';button.className='room-resident';button.dataset.resident=c.residentId;button.setAttribute('aria-label',characterNames[c.id]+'コスミー '+(index+1)+'を選ぶ');button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="resident-shadow"></span><img src="${walkFrames(c.id)[3]}" alt=""><span class="resident-selected">✓</span>`;button.onclick=()=>this.select(index);this.layer.append(button);return {...c,...point,target:walkTarget(this.state.slots),wait:index*.13,phase:index*1.7,walkTime:0,facing:1,walkFrame:3,walkImages:walkFrames(c.id),button};});
  for(const actor of this.actors){actor.button.onpointerenter=()=>{actor.wait=1.5;};actor.button.onfocus=()=>{actor.wait=2;actor.button.style.zIndex='150';};}
  body.querySelector('.room-interact').onclick=()=>this.openFocus();body.querySelector('.room-decor-toggle').onclick=()=>this.setDecor(true);body.querySelector('.room-decor-done').onclick=()=>this.setDecor(false);body.querySelector('.room-focus-back').onclick=()=>this.closeFocus();
  this.snackEffect=body.querySelector('.room-snack-effect');this.snackToggle=body.querySelector('.room-snack-toggle');this.snackOptions=body.querySelector('.room-snack-options');
  this.snackToggle.onclick=()=>{this.snackOptions.hidden=!this.snackOptions.hidden;this.snackToggle.setAttribute('aria-expanded',String(!this.snackOptions.hidden));};
  for(const item of collectibleItems){const button=document.createElement('button');button.type='button';button.dataset.snack=item.id;button.setAttribute('aria-label',item.name+'をあげる');const img=document.createElement('img');img.src=item.src;img.alt='';const label=document.createElement('span');label.textContent=item.name;button.append(img,label);button.onclick=()=>this.feed(item.id);this.snackOptions.append(button);}
  // Daily-mission reward: a limited star cookie that adds a trust bonus right away.
  this.missions=new DailyMissions();this.treatButton=document.createElement('button');this.treatButton.type='button';this.treatButton.dataset.snack=TREAT.id;this.treatButton.className='room-treat';this.treatButton.innerHTML=`<img src="${TREAT.src}" alt=""><span>${TREAT.name}</span><b class="room-treat-count"></b>`;this.treatButton.onclick=()=>this.feed(TREAT.id);this.snackOptions.append(this.treatButton);this.renderTreat();
  body.querySelector('.room-return-total').onclick=()=>this.openCelebration();
  for(const button of body.querySelectorAll('[data-slot]'))button.onclick=()=>{this.slot=Number(button.dataset.slot);this.renderDecor();};
  this.target.addEventListener('pointerdown',event=>{event.preventDefault();this.pointer=event.pointerId;this.lastPoint={x:event.clientX,y:event.clientY};this.target.setPointerCapture(event.pointerId);this.tap(event);});
  this.target.addEventListener('pointermove',event=>{if(this.pointer!==event.pointerId)return;const d=Math.hypot(event.clientX-this.lastPoint.x,event.clientY-this.lastPoint.y);if(d>8){this.lastPoint={x:event.clientX,y:event.clientY};this.tap(event);}});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])this.target.addEventListener(name,()=>{this.pointer=null;});
  this.target.onclick=event=>{if(event.detail===0)this.tap();};
  this.onKey=event=>{if(event.key==='Escape'&&(this.mode!=='room')){event.preventDefault();event.stopPropagation();if(this.mode==='focus')this.closeFocus();else this.setDecor(false);}};body.addEventListener('keydown',this.onKey);
  this.onVisibility=()=>{this.last=0;};document.addEventListener('visibilitychange',this.onVisibility);
  this.walkPreloads=this.actors.flatMap(a=>a.walkImages.map(src=>{const img=new Image();img.src=src;return img;}));this.renderProps();this.renderDecor();this.paintActors();if(data?.character){const saved=this.actors.findIndex(a=>a.id===data.character);if(saved>=0)this.select(saved,false);}this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 openCelebration(){if(this.mode!=='room')return;this.measure('returns_open');this.progress?.load();this.total=this.progress?.totalReturned||0;this.mode='celebration';this.body.inert=true;const header=this.shell?.querySelector('.community-header');if(header)header.inert=true;this.celebration=new RoomCelebration(this.shell||this.body.parentElement,this.total,this.progress?.data.counts,()=>this.closeCelebration());}
 closeCelebration(){if(!this.celebration)return;this.celebration.destroy();this.celebration=null;this.mode='room';this.body.inert=false;const header=this.shell?.querySelector('.community-header');if(header)header.inert=false;if(!this.dead)this.body.querySelector('.room-return-total').focus();}
 save(change={}){
  // Refresh unlocks as well as room data before validating another tab's furniture.
  this.progress?.load();if(this.progress)this.total=this.progress.totalReturned;
  const copy=state=>JSON.parse(JSON.stringify(state));
  this.savedState??=copy(this.state);
  const pending=this.pendingSave??={trust:{},slots:{}};
  let latest=copy(this.savedState),readable=true;
  try{const raw=localStorage.getItem(ROOM_KEY);if(raw)latest=validRoomState(JSON.parse(raw),this.total,this.bonus);}catch{readable=false;}
  // Replay only unsaved changes against the latest persisted data, never our preview.
  for(const [id,gain] of Object.entries(pending.trust))latest.trust[id]=Math.min(100,latest.trust[id]+gain);
  for(const [slot,prop] of Object.entries(pending.slots))latest.slots[slot]=prop;
  if(pending.character)latest.character=pending.character;
  let gained=0;
  if(change.character){latest.character=change.character;pending.character=change.character;}
  if(Number.isInteger(change.slot)){latest.slots[change.slot]=change.prop;pending.slots[change.slot]=change.prop;}
  if(change.id){const before=latest.trust[change.id];latest.trust[change.id]=Math.min(100,before+change.gain);gained=latest.trust[change.id]-before;pending.trust[change.id]=(pending.trust[change.id]||0)+gained;}
  this.state=latest;
  if(readable)try{localStorage.setItem(ROOM_KEY,JSON.stringify(latest));this.savedState=copy(latest);this.pendingSave=null;}catch{}
  return gained;
 }

 select(index,explicit=true){if(this.mode!=='room')return;this.selected=index;const actor=this.actors[index];if(explicit)this.measure('room_select',{characterType:actor.id});actor.wait=1;this.save({character:actor.id});for(const a of this.actors)a.button.setAttribute('aria-pressed',String(a===actor));this.body.querySelector('.room-selected-label').textContent=characterNames[actor.id]+'コスミー';this.body.querySelector('.room-interact').disabled=false;this.body.querySelector('.room-instruction').textContent='「ふれあう」でアップに';this.renderTrust();}
 renderProps(){this.propsLayer.replaceChildren();roomLayout.slots.forEach((slot,i)=>{const prop=roomProps.find(p=>p.id===this.state.slots[i]);if(!prop)return;const img=document.createElement('img');img.src=prop.src;img.alt=prop.name;img.className='cabinet-prop';img.style.cssText=`left:${slot.x*100}%;top:${slot.y*100}%;width:${slot.width*100}%;z-index:${Math.round(slot.y*100)};`;this.propsLayer.append(img);});}
 setDecor(open){if(open&&this.mode!=='decor')this.measure('decor_open');this.mode=open?'decor':'room';this.drawer.hidden=!open;this.layer.inert=open;this.body.querySelector('.room-decor-toggle').setAttribute('aria-expanded',String(open));this.scene.classList.toggle('decorating',open);this.body.querySelector('.room-interact').disabled=open||this.selected===null;if(open){this.progress?.load();this.total=this.progress?.totalReturned||0;this.renderDecor();this.body.querySelector('.room-decor-done').focus();}else this.body.querySelector('.room-decor-toggle').focus();}
 renderDecor(){
  this.bonus=bonusPropsFrom();const unlocked=roomProps.filter(p=>propUnlocked(p,this.total,this.bonus)).length,next=roomProps.find(p=>!propUnlocked(p,this.total,this.bonus));
  this.body.querySelector('.room-decor-progress').textContent='累計 '+this.total+'匹 ・ '+unlocked+'/'+roomProps.length+' 解放'+(next?' ・ 次は'+next.required+'匹':' ・ 全部そろった！');
  for(const button of this.body.querySelectorAll('[data-slot]'))button.setAttribute('aria-pressed',String(Number(button.dataset.slot)===this.slot));
  const root=this.body.querySelector('.room-decor-options');root.replaceChildren();
  for(const prop of [{id:null,name:'置かない',required:0},...roomProps]){const unlocked=propUnlocked(prop,this.total,this.bonus),bonusProp=this.bonus.includes(prop.id)&&prop.required>this.total,button=document.createElement('button');button.type='button';button.dataset.prop=prop.id||'none';button.setAttribute('aria-pressed',String(this.state.slots[this.slot]===prop.id));button.setAttribute('aria-disabled',String(!unlocked));button.innerHTML=`${prop.src?`<img src="${prop.src}" alt="">`:'<span class="room-remove-icon">−</span>'}<span>${prop.name}</span><small>${unlocked?(prop.id?(bonusProp?'ミッションで解放':'使える'):''):`${prop.required}匹で解放`}</small>`;button.onclick=()=>{this.progress?.load();this.total=this.progress?.totalReturned||0;if(!propUnlocked(prop,this.total,this.bonus)){this.body.querySelector('.room-decor-message').textContent=`HOMEへあと${prop.required-this.total}匹届けると使えるよ`;return;}if(this.state.slots[this.slot]!==prop.id)this.measure('decor_change',{prop:prop.id||'none'});this.save({slot:this.slot,prop:prop.id});this.renderProps();for(const b of root.children)b.setAttribute('aria-pressed',String(b.dataset.prop===(prop.id||'none')));this.body.querySelector('.room-decor-message').textContent=prop.id?`${roomLayout.slots[this.slot].name}に${prop.name}を置いたよ`:'インテリアを外したよ';for(const actor of this.actors)if(!walkable(actor,this.state.slots)){Object.assign(actor,walkTarget(this.state.slots));actor.target=walkTarget(this.state.slots);}this.paintActors();};root.append(button);}
 }
 renderTrust(){
  const id=this.actors[this.selected]?.id;if(!id)return;
  const root=this.body.querySelector('.room-trust'),track=root.querySelector('.room-trust-track');root.hidden=false;
  root.querySelector('.room-trust-value').textContent=this.state.trust[id];root.querySelector('.room-trust-fraction').textContent=this.state.trust[id]+'/100';root.dataset.full=String(this.state.trust[id]===100);
  track.setAttribute('aria-label',characterNames[id]+'コスミーの信頼度');track.setAttribute('aria-valuenow',this.state.trust[id]);track.querySelector('i').style.width=this.state.trust[id]+'%';
 }
 openFocus(){if(this.selected===null||this.mode!=='room')return;const actor=this.actors[this.selected];this.mode='focus';this.focusStarted=this.elapsed;this.measure('focus_start',{characterType:actor.id});this.focus.hidden=false;this.scene.hidden=true;this.toolbar.hidden=true;this.body.querySelector('.room-summary').hidden=true;this.shell?.classList.add('room-closeup');this.target.setAttribute('aria-label',characterNames[actor.id]+'コスミーをなでる');this.frames=expressionFrames(actor.id);this.frame=0;this.focusImage.src=this.frames[0];this.focusImage.alt=characterNames[actor.id]+'コスミー';this.focus.dataset.reaction='idle';this.reactionLeft=0;this.sessionTouches=0;this.sessionSnacks=0;this.feedingLeft=0;this.resetSnack();this.lastTouch=-10;this.moodIndex=0;this.preloads=this.frames.map(src=>{const img=new Image();img.src=src;return img;});this.target.focus();}
 finishFocusMeasurement(abandoned=false){
  const characterType=this.actors[this.selected].id;
  this.measure(abandoned?'focus_abandon':'focus_end',{characterType});
  this.measure('focus_touches',{characterType,value:this.sessionTouches});
  this.measure('focus_seconds',{characterType,value:Math.max(0,this.elapsed-this.focusStarted)});
 }
 closeFocus(){if(this.mode!=='focus')return;this.finishFocusMeasurement();this.mode='room';this.focus.hidden=true;this.scene.hidden=false;this.toolbar.hidden=false;this.body.querySelector('.room-summary').hidden=false;this.shell?.classList.remove('room-closeup');this.reactionLeft=0;this.pointer=null;this.effects.replaceChildren();this.resetSnack();
  const id=this.actors[this.selected].id,gain=this.save({id,gain:Math.min(10,this.sessionTouches+this.sessionSnacks*2)});this.sessionTouches=0;
  if(gain>0)this.measure('trust_gain',{characterType:id,value:gain});
  this.trustRaf=requestAnimationFrame(()=>{this.trustRaf=requestAnimationFrame(()=>{if(!this.dead)this.renderTrust();});});
  this.body.querySelector('.room-interact').focus();
 }
 resetSnack(){
  this.feedingLeft=0;this.snackEffect.replaceChildren();this.snackOptions.hidden=true;this.snackToggle.disabled=false;this.snackToggle.setAttribute('aria-expanded','false');this.target.removeAttribute('aria-busy');
  for(const button of this.snackOptions.children)button.disabled=false;
 }
 renderTreat(){const count=this.missions.load().data.treats;this.treatButton.hidden=count<=0;this.treatButton.querySelector('.room-treat-count').textContent='×'+count;this.treatButton.setAttribute('aria-label',`${TREAT.name}をあげる（のこり${count}こ・信頼度+${TREAT.trust}）`);}
 feed(id){
  const special=id===TREAT.id,item=special?TREAT:collectibleItems.find(item=>item.id===id);
  if(!item||this.mode!=='focus'||this.feedingLeft>0)return;
  if(special){if(!this.missions.useTreat()){this.renderTreat();return;}const who=this.actors[this.selected].id,gain=this.save({id:who,gain:TREAT.trust});if(gain>0)this.measure('trust_gain',{characterType:who,value:gain,source:'treat'});}
  this.sessionSnacks++;this.feedingLeft=2.2;this.reactionLeft=0;this.pointer=null;
  this.snackOptions.hidden=true;this.snackToggle.setAttribute('aria-expanded','false');this.snackToggle.disabled=true;
  for(const button of this.snackOptions.children)button.disabled=true;
  this.target.setAttribute('aria-busy','true');this.focus.dataset.reaction='eating';this.setFrame(1);
  const image=document.createElement('img');image.src=item.src;image.alt='';this.snackEffect.replaceChildren(image);
  this.measure('snack_given',{characterType:this.actors[this.selected].id,snack:id});
  if(special)this.renderTreat();
  this.snackToggle.focus();
 }
 tap(event){if(this.mode!=='focus'||this.feedingLeft>0)return;
  const rect=this.focus.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');let x=.5,y=.5;
  if(event){x=rotated?(event.clientY-rect.top)/rect.height:(event.clientX-rect.left)/rect.width;y=rotated?(rect.right-event.clientX)/rect.width:(event.clientY-rect.top)/rect.height;}
  const id=this.actors[this.selected].id,fx=document.createElement('span');fx.className='room-tap-neon';fx.dataset.character=id;
  fx.style.left=Math.max(0,Math.min(1,x))*100+'%';fx.style.top=Math.max(0,Math.min(1,y))*100+'%';fx.style.setProperty('--neon',neonColors[id]);fx.style.setProperty('--silhouette','url("'+new URL(walkFrames(id)[3],document.baseURI).href+'")');
  this.effects.append(fx);while(this.effects.children.length>12)this.effects.firstChild.remove();fx.addEventListener('animationend',()=>fx.remove(),{once:true});this.react();
 }
 react(){if(this.mode!=='focus'||this.elapsed-this.lastTouch<.35)return;
  const rapid=this.elapsed-this.lastTouch<.8;this.lastTouch=this.elapsed;this.sessionTouches++;
  const mood=rapid?'annoyed':['happy','confused','happy','annoyed'][this.moodIndex++%4];
  this.reactionFrames=mood==='happy'?[1,2]:mood==='confused'?[4,5]:[6,7];
  this.reactionLeft=1.4;this.focus.dataset.reaction=mood;this.setFrame(this.reactionFrames[0]);
 }
 setFrame(index){if(this.frame===index)return;this.frame=index;this.focusImage.src=this.frames[index];this.focusImage.dataset.expression=index;}
 tick(now){if(this.dead)return;const dt=document.hidden?0:Math.min(.05,(now-(this.last||now))/1000);this.last=now;this.elapsed+=dt;
  if(this.mode==='room'&&dt){for(const actor of this.actors){actor.wait=Math.max(0,actor.wait-dt);if(actor.wait>0)continue;const dx=actor.target.x-actor.x,dy=actor.target.y-actor.y,d=Math.hypot(dx,dy);if(d<.008){actor.target=walkTarget(this.state.slots);actor.wait=.5+Math.random()*1.2;continue;}const speed=actor.id==='red'?.055:actor.id==='green'?.025:.038,step=Math.min(d,speed*dt),next={x:actor.x+dx/d*step,y:actor.y+dy/d*step};if(walkable(next,this.state.slots)){actor.x=next.x;actor.y=next.y;actor.walkTime+=dt;if(Math.abs(dx)>.002)actor.facing=dx<0?-1:1;}else{actor.target=walkTarget(this.state.slots);actor.wait=.2;}}this.paintActors();}
  if(this.mode==='focus'&&this.feedingLeft>0&&dt){
   this.feedingLeft=Math.max(0,this.feedingLeft-dt);this.setFrame(this.feedingLeft>0?(Math.floor(this.feedingLeft*5)%2?1:2):2);
   if(this.feedingLeft===0){this.resetSnack();this.focus.dataset.reaction='happy';this.reactionFrames=[1,2];this.reactionLeft=1.4;this.snackToggle.focus();}
  }
  if(this.mode==='focus'&&this.reactionLeft>0&&dt){this.reactionLeft=Math.max(0,this.reactionLeft-dt);if(this.reactionLeft===0){this.setFrame(0);this.focus.dataset.reaction='idle';}else if(this.reactionLeft<.8)this.setFrame(this.reactionFrames[1]);}
  this.raf=requestAnimationFrame(this.tick);
 }
 paintActors(){for(const actor of this.actors){
  actor.button.style.left=actor.x*100+'%';actor.button.style.top=actor.y*100+'%';actor.button.style.zIndex=document.activeElement===actor.button?150:Math.round(actor.y*100);
  const moving=actor.wait<=0&&this.mode==='room',img=actor.button.querySelector('img');
  const frame=moving?Math.floor(actor.walkTime*(actor.id==='red'?7:5))%4:3;
  if(frame!==actor.walkFrame){actor.walkFrame=frame;img.src=actor.walkImages[frame];}
  img.dataset.walkFrame=frame;img.style.transform=`scaleX(${actor.facing})`;
  actor.button.dataset.facing=actor.facing<0?'left':'right';actor.button.dataset.walking=String(moving);
 }}
 destroy(){if(this.dead)return;if(this.mode==='focus')this.finishFocusMeasurement(true);this.dead=true;this.closeCelebration();cancelAnimationFrame(this.raf);cancelAnimationFrame(this.trustRaf);this.shell?.classList.remove('room-closeup');this.pointer=null;this.body.removeEventListener('keydown',this.onKey);document.removeEventListener('visibilitychange',this.onVisibility);}
}
