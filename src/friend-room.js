import {collectibleItems} from './collection.js';
import {RoomCelebration} from './room-celebration.js';
import {characterNames} from './character-profiles.js';
import {ROOM_KEY,roomArt,roomProps,roomLayout,roomCast,roomResidents,validRoomState,propUnlocked,expressionFrames,walkFrames,walkTarget,walkable} from './room-data.js';
import {bonusPropsFrom,TREAT,DailyMissions} from './missions.js';
import {t as _t,LANG} from './i18n.js';
import {icon} from './icons.js';
import {LEVELS,MAX_LEVEL,levelOf,levelProgress,DAILY_TRUST,dailyDone,markDaily} from './friendship.js';
import {friendLine} from './friend-lines.js';
const neonColors={green:'#a5ff53',pink:'#ff86bf',blue:'#65dfff',red:'#ff626b',purple:'#cf8aff'};
export class FriendRoom {
 constructor(body,progress,measure=()=>{}){
  this.measure=(name,data={})=>{try{measure(name,{source:'room',...data});}catch{}};
  let revisit=false;try{revisit=localStorage.getItem('cosmii-room-visited-v1')==='1';localStorage.setItem('cosmii-room-visited-v1','1');}catch{}
  this.measure('room_open',{revisit});
  this.body=body;this.progress=progress;progress?.load();this.total=progress?.totalReturned||0;this.residents=roomResidents(progress?.data.counts);this.selected=null;this.slot=0;this.mode='room';this.elapsed=0;this.last=0;this.dead=false;
  let data;try{data=JSON.parse(localStorage.getItem(ROOM_KEY)||localStorage.getItem('cosmii-friend-room-v1'));}catch{}this.bonus=bonusPropsFrom();this.state=validRoomState(data,this.total,this.bonus);
  body.classList.add('friend-room-body');
  body.innerHTML=`<div class="room-summary"><button type="button" class="room-return-total">${_t('✦ 累計帰還を見る')}</button><span class="room-instruction">${_t('歩いているコスミーを選ぼう')}</span></div>
   <div class="cabinet-room"><img class="cabinet-base" src="${roomArt}" alt="${_t('星のかざりがあるクレーンゲーム風のお部屋')}"><div class="cabinet-props"></div><div class="cabinet-residents"></div>
    <p class="room-empty-note" ${this.total?'hidden':''}>${_t('仲間をHOMEへ届けると、この部屋にやってくるよ')}</p>
    <section class="room-decor" id="room-decor" aria-label="${_t('もようがえ')}" hidden><header><strong>${_t('もようがえ')}</strong><button class="room-decor-done" type="button">${_t('完了 ✓')}</button></header><p class="room-decor-progress"></p><div class="room-slots" role="group" aria-label="${_t('置く場所')}">${roomLayout.slots.map((s,i)=>`<button type="button" data-slot="${i}">${s.name}</button>`).join('')}</div><div class="room-decor-options"></div><p class="room-decor-message" role="status"></p></section>
   </div>
   <div class="room-toolbar"><div class="room-selected-info"><span class="room-selected-label">${_t('コスミーを選択')}</span></div><button class="room-interact" type="button" disabled>${_t('♡ ふれあう')}</button><button class="room-decor-toggle" type="button" aria-expanded="false" aria-controls="room-decor">${_t('▧ もようがえ')}</button></div>
   <section class="room-focus" aria-label="${_t('コスミーとふれあう')}" hidden><div class="room-friend-chip"><b class="room-friend-name"></b><span class="room-friend-hearts" role="img"></span><small class="room-friend-level"></small></div><p class="room-speech" role="status" hidden></p><button type="button" class="room-pet-target"><img alt=""></button><div class="room-tap-effects" aria-hidden="true"></div><div class="room-snack-effect" aria-hidden="true"></div><button type="button" class="room-ball" aria-label="${_t('ボールを投げる')}" hidden>${icon('ball')}</button><div class="room-brush-meter" aria-hidden="true" hidden><i></i></div><div class="room-snacks"><button class="room-activity" type="button" data-activity="play">${icon('ball')}<span>${_t('あそぶ')}</span></button><button class="room-activity" type="button" data-activity="brush">${icon('brush')}<span>${_t('おせわ')}</span></button><div class="room-snack-options" hidden></div><button class="room-snack-toggle" type="button" aria-expanded="false"><img src="./Asset/objects/apple.png" alt=""><span>${_t('おやつ')}</span></button></div><button type="button" class="room-focus-back back-button" aria-label="${_t('お部屋にもどる')}"><small>${_t('もどる')}</small></button></section>`;
  this.scene=body.querySelector('.cabinet-room');this.layer=body.querySelector('.cabinet-residents');this.propsLayer=body.querySelector('.cabinet-props');this.drawer=body.querySelector('.room-decor');this.focus=body.querySelector('.room-focus');this.toolbar=body.querySelector('.room-toolbar');this.target=body.querySelector('.room-pet-target');this.focusImage=this.target.querySelector('img');this.effects=body.querySelector('.room-tap-effects');this.shell=body.closest('.community-screen');
  this.scene.insertAdjacentHTML('beforeend',`<div class="room-trust" hidden><div class="room-trust-medal" aria-hidden="true"><img src="./Asset/ui/trust/badge.png" alt=""><strong class="room-trust-value">0</strong><span class="room-trust-title">${_t('レベル')}</span></div><div class="room-trust-track" role="progressbar" aria-label="${_t('信頼度')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><span class="room-trust-fraction" aria-hidden="true">0/100</span></div></div>`);
  this.actors=this.residents.map((c,index)=>{const point=walkTarget(this.state.slots),button=document.createElement('button');button.type='button';button.className='room-resident';button.dataset.resident=c.residentId;button.setAttribute('aria-label',characterNames[c.id]+_t('コスミー ')+(index+1)+_t('を選ぶ'));button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="resident-shadow"></span><img src="${walkFrames(c.id)[3]}" alt=""><span class="resident-selected">✓</span>`;button.onclick=()=>this.select(index);this.layer.append(button);return {...c,...point,target:walkTarget(this.state.slots),wait:index*.13,phase:index*1.7,walkTime:0,facing:1,walkFrame:3,walkImages:walkFrames(c.id),button};});
  for(const actor of this.actors){actor.button.onpointerenter=()=>{actor.wait=1.5;};actor.button.onfocus=()=>{actor.wait=2;actor.button.style.zIndex='150';};}
  body.querySelector('.room-interact').onclick=()=>this.openFocus();body.querySelector('.room-decor-toggle').onclick=()=>this.setDecor(true);body.querySelector('.room-decor-done').onclick=()=>this.setDecor(false);body.querySelector('.room-focus-back').onclick=()=>this.closeFocus();
  this.snackEffect=body.querySelector('.room-snack-effect');this.snackToggle=body.querySelector('.room-snack-toggle');this.snackOptions=body.querySelector('.room-snack-options');
  for(const b of body.querySelectorAll('.room-activity'))b.onclick=()=>b.dataset.activity==='play'?this.startPlay():this.startBrush();
  this.speech=body.querySelector('.room-speech');this.ball=body.querySelector('.room-ball');this.brushMeter=body.querySelector('.room-brush-meter');this.ball.onclick=()=>this.throwBall();
  this.snackToggle.onclick=()=>{this.snackOptions.hidden=!this.snackOptions.hidden;this.snackToggle.setAttribute('aria-expanded',String(!this.snackOptions.hidden));};
  for(const item of collectibleItems){const button=document.createElement('button');button.type='button';button.dataset.snack=item.id;button.setAttribute('aria-label',_t('{0}をあげる',[item.name]));const img=document.createElement('img');img.src=item.src;img.alt='';const label=document.createElement('span');label.textContent=item.name;button.append(img,label);button.onclick=()=>this.feed(item.id);this.snackOptions.append(button);}
  // Daily-mission reward: a limited star cookie that adds a trust bonus right away.
  this.missions=new DailyMissions();this.treatButton=document.createElement('button');this.treatButton.type='button';this.treatButton.dataset.snack=TREAT.id;this.treatButton.className='room-treat';this.treatButton.innerHTML=`<img src="${TREAT.src}" alt=""><span>${TREAT.name}</span><b class="room-treat-count"></b>`;this.treatButton.onclick=()=>this.feed(TREAT.id);this.snackOptions.append(this.treatButton);this.renderTreat();
  body.querySelector('.room-return-total').onclick=()=>this.openCelebration();
  for(const button of body.querySelectorAll('[data-slot]'))button.onclick=()=>{this.slot=Number(button.dataset.slot);this.renderDecor();};
  this.target.addEventListener('pointerdown',event=>{event.preventDefault();if(this.activity==='play'){this.throwBall();return;}this.pointer=event.pointerId;this.lastPoint={x:event.clientX,y:event.clientY};this.target.setPointerCapture(event.pointerId);if(this.activity==='brush')this.brushAt(event,0);else this.tap(event);});
  this.target.addEventListener('pointermove',event=>{if(this.pointer!==event.pointerId)return;const d=Math.hypot(event.clientX-this.lastPoint.x,event.clientY-this.lastPoint.y);if(d>8){this.lastPoint={x:event.clientX,y:event.clientY};if(this.activity==='brush')this.brushAt(event,d);else this.tap(event);}});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])this.target.addEventListener(name,()=>{this.pointer=null;});
  this.target.onclick=event=>{if(event.detail!==0)return;if(this.activity==='brush')this.brushAt(null,260);else if(this.activity==='play')this.throwBall();else this.tap();};
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

 select(index,explicit=true){if(this.mode!=='room')return;this.selected=index;const actor=this.actors[index];if(explicit)this.measure('room_select',{characterType:actor.id});actor.wait=1;this.save({character:actor.id});for(const a of this.actors)a.button.setAttribute('aria-pressed',String(a===actor));this.body.querySelector('.room-selected-label').textContent=characterNames[actor.id]+_t('コスミー');this.body.querySelector('.room-interact').disabled=false;this.body.querySelector('.room-instruction').textContent=_t('「ふれあう」でアップに');this.renderTrust();}
 renderProps(){this.propsLayer.replaceChildren();roomLayout.slots.forEach((slot,i)=>{const prop=roomProps.find(p=>p.id===this.state.slots[i]);if(!prop)return;const img=document.createElement('img');img.src=prop.src;img.alt=prop.name;img.className='cabinet-prop';img.style.cssText=`left:${slot.x*100}%;top:${slot.y*100}%;width:${slot.width*100}%;z-index:${Math.round(slot.y*100)};`;this.propsLayer.append(img);});}
 setDecor(open){if(open&&this.mode!=='decor')this.measure('decor_open');this.mode=open?'decor':'room';this.drawer.hidden=!open;this.layer.inert=open;this.body.querySelector('.room-decor-toggle').setAttribute('aria-expanded',String(open));this.scene.classList.toggle('decorating',open);this.body.querySelector('.room-interact').disabled=open||this.selected===null;if(open){this.progress?.load();this.total=this.progress?.totalReturned||0;this.renderDecor();this.body.querySelector('.room-decor-done').focus();}else this.body.querySelector('.room-decor-toggle').focus();}
 renderDecor(){
  this.bonus=bonusPropsFrom();const unlocked=roomProps.filter(p=>propUnlocked(p,this.total,this.bonus)).length,next=roomProps.find(p=>!propUnlocked(p,this.total,this.bonus));
  this.body.querySelector('.room-decor-progress').textContent=_t('累計 ')+this.total+_t('匹 ・ ')+unlocked+'/'+roomProps.length+_t(' 解放')+(next?_t(' ・ 次は')+next.required+_t('匹'):_t(' ・ 全部そろった！'));
  for(const button of this.body.querySelectorAll('[data-slot]'))button.setAttribute('aria-pressed',String(Number(button.dataset.slot)===this.slot));
  const root=this.body.querySelector('.room-decor-options');root.replaceChildren();
  for(const prop of [{id:null,name:_t('置かない'),required:0},...roomProps]){const unlocked=propUnlocked(prop,this.total,this.bonus),bonusProp=this.bonus.includes(prop.id)&&prop.required>this.total,button=document.createElement('button');button.type='button';button.dataset.prop=prop.id||'none';button.setAttribute('aria-pressed',String(this.state.slots[this.slot]===prop.id));button.setAttribute('aria-disabled',String(!unlocked));button.innerHTML=`${prop.src?`<img src="${prop.src}" alt="">`:'<span class="room-remove-icon">−</span>'}<span>${prop.name}</span><small>${unlocked?(prop.id?(bonusProp?_t('ミッションで解放'):_t('使える')):''):_t('{0}匹で解放',[prop.required])}</small>`;button.onclick=()=>{this.progress?.load();this.total=this.progress?.totalReturned||0;if(!propUnlocked(prop,this.total,this.bonus)){this.body.querySelector('.room-decor-message').textContent=_t('HOMEへあと{0}匹届けると使えるよ',[prop.required-this.total]);return;}if(this.state.slots[this.slot]!==prop.id)this.measure('decor_change',{prop:prop.id||'none'});this.save({slot:this.slot,prop:prop.id});this.renderProps();for(const b of root.children)b.setAttribute('aria-pressed',String(b.dataset.prop===(prop.id||'none')));this.body.querySelector('.room-decor-message').textContent=prop.id?_t('{0}に{1}を置いたよ',[roomLayout.slots[this.slot].name,prop.name]):_t('インテリアを外したよ');for(const actor of this.actors)if(!walkable(actor,this.state.slots)){Object.assign(actor,walkTarget(this.state.slots));actor.target=walkTarget(this.state.slots);}this.paintActors();};root.append(button);}
 }
 renderTrust(){
  const id=this.actors[this.selected]?.id;if(!id)return;
  const root=this.body.querySelector('.room-trust'),track=root.querySelector('.room-trust-track');root.hidden=false;
  const trust=this.state.trust[id],level=levelOf(trust);
  root.querySelector('.room-trust-value').textContent=level;root.querySelector('.room-trust-fraction').textContent=LEVELS[level-1].name;root.dataset.full=String(trust===100);root.dataset.level=level;
  track.setAttribute('aria-label',_t('{0}コスミーのなかよしレベル{1}「{2}」（信頼度{3}）',[characterNames[id],level,LEVELS[level-1].name,trust]));track.setAttribute('aria-valuenow',trust);track.querySelector('i').style.width=levelProgress(trust)*100+'%';
 }
 openFocus(){if(this.selected===null||this.mode!=='room')return;const actor=this.actors[this.selected];this.mode='focus';this.focusStarted=this.elapsed;this.measure('focus_start',{characterType:actor.id});this.focus.hidden=false;this.scene.hidden=true;this.toolbar.hidden=true;this.body.querySelector('.room-summary').hidden=true;this.shell?.classList.add('room-closeup');this.target.setAttribute('aria-label',_t('{0}コスミーをなでる',[characterNames[actor.id]]));this.frames=expressionFrames(actor.id);this.frame=0;this.focusImage.src=this.frames[0];this.focusImage.alt=characterNames[actor.id]+_t('コスミー');this.focus.dataset.reaction='idle';this.reactionLeft=0;this.sessionTouches=0;this.sessionSnacks=0;this.feedingLeft=0;this.resetSnack();this.lastTouch=-10;this.moodIndex=0;this.preloads=this.frames.map(src=>{const img=new Image();img.src=src;return img;});this.endActivity();this.renderChip();this.renderActivities();this.say('hello',.35);this.target.focus();}
 finishFocusMeasurement(abandoned=false){
  const characterType=this.actors[this.selected].id;
  this.measure(abandoned?'focus_abandon':'focus_end',{characterType});
  this.measure('focus_touches',{characterType,value:this.sessionTouches});
  this.measure('focus_seconds',{characterType,value:Math.max(0,this.elapsed-this.focusStarted)});
 }
 closeFocus(){if(this.mode!=='focus')return;this.finishFocusMeasurement();this.mode='room';this.focus.hidden=true;this.scene.hidden=false;this.toolbar.hidden=false;this.body.querySelector('.room-summary').hidden=false;this.shell?.classList.remove('room-closeup');this.reactionLeft=0;this.pointer=null;this.effects.replaceChildren();this.resetSnack();
  this.endActivity();this.hideSpeech();this.levelupEl?.remove();
  const id=this.actors[this.selected].id,gain=this.gainTrust(id,Math.min(10,this.sessionTouches+this.sessionSnacks*2));this.sessionTouches=0;
  if(gain>0)this.measure('trust_gain',{characterType:id,value:gain});
  this.trustRaf=requestAnimationFrame(()=>{this.trustRaf=requestAnimationFrame(()=>{if(!this.dead)this.renderTrust();});});
  this.body.querySelector('.room-interact').focus();
 }
 resetSnack(){
  this.feedingLeft=0;this.snackEffect.replaceChildren();this.snackOptions.hidden=true;this.snackToggle.disabled=false;this.snackToggle.setAttribute('aria-expanded','false');this.target.removeAttribute('aria-busy');
  for(const button of this.snackOptions.children)button.disabled=false;
  if(this.activity)this.snackToggle.disabled=true;if(this.speech)this.renderActivities();
 }
 renderTreat(){const count=this.missions.load().data.treats;this.treatButton.hidden=count<=0;this.treatButton.querySelector('.room-treat-count').textContent='×'+count;this.treatButton.setAttribute('aria-label',_t('{0}をあげる（のこり{1}こ・信頼度+{2}）',[TREAT.name,count,TREAT.trust]));}
 feed(id){
  const special=id===TREAT.id,item=special?TREAT:collectibleItems.find(item=>item.id===id);
  if(!item||this.mode!=='focus'||this.feedingLeft>0)return;
  if(this.activity)return;if(special){if(!this.missions.useTreat()){this.renderTreat();return;}const who=this.actors[this.selected].id,gain=this.gainTrust(who,TREAT.trust);if(gain>0)this.measure('trust_gain',{characterType:who,value:gain});}
  this.sessionSnacks++;this.feedingLeft=2.2;this.reactionLeft=0;this.pointer=null;
  this.snackOptions.hidden=true;this.snackToggle.setAttribute('aria-expanded','false');this.snackToggle.disabled=true;
  for(const button of this.snackOptions.children)button.disabled=true;
  this.target.setAttribute('aria-busy','true');this.focus.dataset.reaction='eating';this.setFrame(1);
  const image=document.createElement('img');image.src=item.src;image.alt='';this.snackEffect.replaceChildren(image);
  this.measure('snack_given',{characterType:this.actors[this.selected].id,snack:id});this.renderActivities();
  if(special)this.renderTreat();
  this.snackToggle.focus();
 }
 tap(event){if(this.mode!=='focus'||this.feedingLeft>0||this.activity)return;
  const rect=this.focus.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');let x=.5,y=.5;
  if(event){x=rotated?(event.clientY-rect.top)/rect.height:(event.clientX-rect.left)/rect.width;y=rotated?(rect.right-event.clientX)/rect.width:(event.clientY-rect.top)/rect.height;}
  const id=this.actors[this.selected].id,fx=document.createElement('span');fx.className='room-tap-neon';fx.dataset.character=id;
  fx.style.left=Math.max(0,Math.min(1,x))*100+'%';fx.style.top=Math.max(0,Math.min(1,y))*100+'%';fx.style.setProperty('--neon',neonColors[id]);fx.style.setProperty('--silhouette','url("'+new URL(walkFrames(id)[3],document.baseURI).href+'")');
  this.effects.append(fx);while(this.effects.children.length>12)this.effects.firstChild.remove();fx.addEventListener('animationend',()=>fx.remove(),{once:true});this.react();
 }
 react(){if(this.mode!=='focus'||this.elapsed-this.lastTouch<.35)return;
  const rapid=this.elapsed-this.lastTouch<.8;this.lastTouch=this.elapsed;this.sessionTouches++;
  const mood=rapid?'annoyed':['happy','confused','happy','annoyed'][this.moodIndex++%4];
  if(rapid&&this.sessionTouches>4)this.say('tooMuch');else if(!rapid&&this.sessionTouches%3===1)this.say('pet');
  this.reactionFrames=mood==='happy'?[1,2]:mood==='confused'?[4,5]:[6,7];
  this.reactionLeft=1.4;this.focus.dataset.reaction=mood;this.setFrame(this.reactionFrames[0]);
 }
 setFrame(index){if(this.frame===index)return;this.frame=index;this.focusImage.src=this.frames[index];this.focusImage.dataset.expression=index;}
 tick(now){if(this.dead)return;const dt=document.hidden?0:Math.min(.05,(now-(this.last||now))/1000);this.last=now;this.elapsed+=dt;
  if(this.mode==='room'&&dt){for(const actor of this.actors){actor.wait=Math.max(0,actor.wait-dt);if(actor.wait>0)continue;const dx=actor.target.x-actor.x,dy=actor.target.y-actor.y,d=Math.hypot(dx,dy);if(d<.008){actor.target=walkTarget(this.state.slots);actor.wait=.5+Math.random()*1.2;continue;}const speed=actor.id==='red'?.055:actor.id==='green'?.025:.038,step=Math.min(d,speed*dt),next={x:actor.x+dx/d*step,y:actor.y+dy/d*step};if(walkable(next,this.state.slots)){actor.x=next.x;actor.y=next.y;actor.walkTime+=dt;if(Math.abs(dx)>.002)actor.facing=dx<0?-1:1;}else{actor.target=walkTarget(this.state.slots);actor.wait=.2;}}this.paintActors();}
  if(this.mode==='focus'&&this.feedingLeft>0&&dt){
   this.feedingLeft=Math.max(0,this.feedingLeft-dt);this.setFrame(this.feedingLeft>0?(Math.floor(this.feedingLeft*5)%2?1:2):2);
   if(this.feedingLeft===0){this.resetSnack();this.focus.dataset.reaction='happy';this.reactionFrames=[1,2];this.reactionLeft=1.4;this.say('snack');this.snackToggle.focus();}
  }
  if(this.speechLeft>0&&dt){this.speechLeft-=dt;if(this.speechLeft<=0)this.hideSpeech();}
  if(this.mode==='focus'&&this.activity==='play'&&dt)this.updatePlay(dt);
  if(this.mode==='focus'&&this.reactionLeft>0&&dt&&this.activity!=='brush'){this.reactionLeft=Math.max(0,this.reactionLeft-dt);if(this.reactionLeft===0){this.setFrame(0);this.focus.dataset.reaction='idle';}else if(this.reactionLeft<.8)this.setFrame(this.reactionFrames[1]);}
  this.raf=requestAnimationFrame(this.tick);
 }
 // ── friendship: level chip, lines, level-up, and the two daily activities (play / brush) ──
 currentId(){return this.actors[this.selected]?.id;}
 renderChip(){const id=this.currentId();if(!id)return;const trust=this.state.trust[id],level=levelOf(trust),chip=this.focus.querySelector('.room-friend-chip');
  chip.querySelector('.room-friend-name').textContent=characterNames[id]+_t('コスミー');chip.querySelector('.room-friend-level').textContent=_t('Lv{0} {1}',[level,LEVELS[level-1].name]);
  const hearts=chip.querySelector('.room-friend-hearts');hearts.setAttribute('aria-label',_t('なかよしレベル {0} / {1}',[level,MAX_LEVEL]));hearts.innerHTML=Array.from({length:MAX_LEVEL},(_,i)=>`<img src="./Asset/ui/life/${i<level?'full':'empty'}.png" alt="">`).join('');chip.dataset.level=level;}
 renderActivities(){const id=this.currentId();for(const b of this.focus.querySelectorAll('.room-activity')){const done=!!id&&dailyDone(id,b.dataset.activity);b.dataset.done=String(done);b.disabled=!!this.activity||this.feedingLeft>0;b.setAttribute('aria-label',(b.dataset.activity==='play'?_t('あそぶ'):_t('おせわ'))+(done?_t('（今日のなかよしアップは済み）'):_t('（今日はなかよし+{0}）',[DAILY_TRUST[b.dataset.activity]])));}}
 say(situation,delay=0){const id=this.currentId();if(!id||this.mode!=='focus')return;const text=friendLine(id,situation,levelOf(this.state.trust[id]),LANG);if(!text)return;
  const show=()=>{if(this.mode!=='focus'||this.dead)return;this.speech.textContent=text;this.speech.hidden=false;this.speech.classList.remove('pop');void this.speech.offsetWidth;this.speech.classList.add('pop');this.speechLeft=2.8;};
  clearTimeout(this.speechTimer);if(delay)this.speechTimer=setTimeout(show,delay*1000);else show();}
 hideSpeech(){clearTimeout(this.speechTimer);this.speechLeft=0;if(this.speech)this.speech.hidden=true;}
 // Every trust change goes through here so a new level is celebrated wherever it happens.
 gainTrust(id,amount){const before=levelOf(this.state.trust[id]),gain=this.save({id,gain:amount}),after=levelOf(this.state.trust[id]);if(after>before)this.levelUp(id,after);if(this.mode==='focus')this.renderChip();return gain;}
 levelUp(id,level){this.measure('friend_level',{characterType:id,value:level});const root=document.createElement('div');root.className='room-levelup';root.setAttribute('role','status');
  root.innerHTML=`<div class="room-levelup-card"><span class="room-levelup-hearts" aria-hidden="true">${'<img src="./Asset/ui/life/full.png" alt="">'.repeat(level)}</span><strong>${_t('なかよしレベルUP！')}</strong><b>${_t('Lv{0} {1}',[level,LEVELS[level-1].name])}</b></div>`;
  this.levelupEl?.remove();this.levelupEl=root;(this.shell||this.body).append(root);setTimeout(()=>root.remove(),2900);
  if(this.mode==='focus'&&this.currentId()===id)this.say('levelup',.9);}
 startActivity(kind){if(this.mode!=='focus'||this.activity||this.feedingLeft>0)return false;this.activity=kind;this.focus.dataset.activity=kind;this.snackOptions.hidden=true;this.snackToggle.disabled=true;this.renderActivities();this.hideSpeech();this.measure(kind+'_start',{characterType:this.currentId()});return true;}
 endActivity(){this.activity=null;if(!this.focus)return;delete this.focus.dataset.activity;for(const el of [this.ball,this.target])el.getAnimations().forEach(a=>a.cancel());this.focusImage.style.transform='';this.ball.style.left='50%';this.ball.style.top='84%';this.ball.hidden=true;this.ball.classList.remove('flying');this.brushMeter.hidden=true;this.target.style.translate='';this.play=null;if(this.feedingLeft<=0)this.snackToggle.disabled=false;this.renderActivities();}
 finishActivity(kind){if(this.pointer!==null){try{this.target.releasePointerCapture(this.pointer);}catch{}this.pointer=null;}const id=this.currentId(),first=markDaily(id,kind),before=levelOf(this.state.trust[id]);let gain=0;if(first)gain=this.gainTrust(id,DAILY_TRUST[kind]);const leveled=levelOf(this.state.trust[id])>before;if(gain>0)this.measure('trust_gain',{characterType:id,value:gain});
  this.measure(kind+'_done',{characterType:id});this.endActivity();this.focus.dataset.reaction='happy';this.reactionFrames=[1,2];this.reactionLeft=1.6;this.setFrame(2);if(!leveled)this.say(kind,.15);this.sparkle(.5,.45,10);this.target.focus();}
 // あそぶ: throw the star ball three times; the Cosmii hops over and catches it.
 startPlay(){if(!this.startActivity('play'))return;this.play={catches:0,busy:0};this.ball.hidden=false;this.ball.style.left='50%';this.ball.style.top='84%';this.ball.focus();}
 throwBall(){const p=this.play;if(this.activity!=='play'||!p||p.busy>0)return;const x=.18+Math.random()*.64,dir=x<.5?-1:1;p.busy=1.25;p.target=x;
  this.ball.classList.add('flying');this.ball.animate([{left:'50%',top:'84%',transform:'translate(-50%,-50%) rotate(0)'},{left:`${(50+x*100)/2}%`,top:'18%',transform:'translate(-50%,-50%) rotate(260deg)',offset:.5},{left:`${x*100}%`,top:'46%',transform:'translate(-50%,-50%) rotate(520deg)'}],{duration:700,easing:'ease-out',fill:'forwards'});
  this.target.animate([{translate:'0 0'},{translate:`${(x-.5)*100}cqw -6%`,offset:.6},{translate:`${(x-.5)*100}cqw 0`}],{duration:700,easing:'ease-in-out',fill:'forwards'});
  this.focusImage.style.transform=`scaleX(${dir})`;this.setFrame(4);}
 updatePlay(dt){const p=this.play;if(!p||p.busy<=0)return;const before=p.busy;p.busy=Math.max(0,p.busy-dt);
  if(before>.55&&p.busy<=.55){p.catches++;if(document.activeElement===this.ball)this.target.focus();this.ball.classList.remove('flying');this.ball.getAnimations().forEach(a=>a.cancel());this.ball.hidden=true;this.setFrame(2);this.sparkle(p.target,.45,6);this.focus.dataset.reaction='happy';}
  if(p.busy===0){this.target.getAnimations().forEach(a=>a.cancel());this.focusImage.style.transform='';this.setFrame(0);if(p.catches>=3){this.finishActivity('play');return;}this.ball.hidden=false;this.ball.style.left='50%';this.ball.style.top='84%';this.ball.focus();}}
 // おせわ: brush by stroking the Cosmii; sparkles follow the finger and a small meter fills up.
 startBrush(){if(!this.startActivity('brush'))return;this.brushed=0;this.brushMeter.hidden=false;this.brushMeter.querySelector('i').style.width='0%';this.setFrame(0);this.target.focus();}
 brushAt(event,distance){if(this.activity!=='brush')return;const rect=this.focus.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');let x=.5,y=.5;
  if(event){x=rotated?(event.clientY-rect.top)/rect.height:(event.clientX-rect.left)/rect.width;y=rotated?(rect.right-event.clientX)/rect.width:(event.clientY-rect.top)/rect.height;}
  this.brushed+=distance;if(distance>0||!event)this.sparkle(x,y,1);this.setFrame(this.brushed%400<200?1:2);this.focus.dataset.reaction='happy';
  const need=1100,ratio=Math.min(1,this.brushed/need);this.brushMeter.querySelector('i').style.width=ratio*100+'%';if(ratio>=1)this.finishActivity('brush');}
 sparkle(x,y,count){for(let i=0;i<count;i++){const s=document.createElement('span');s.className='room-sparkle';s.style.left=Math.max(0,Math.min(1,x))*100+'%';s.style.top=Math.max(0,Math.min(1,y))*100+'%';s.style.setProperty('--dx',(Math.random()-.5)*120+'px');s.style.setProperty('--dy',(Math.random()-.8)*90+'px');s.style.setProperty('--hue',Math.floor(Math.random()*360));this.effects.append(s);s.addEventListener('animationend',()=>s.remove(),{once:true});}while(this.effects.children.length>40)this.effects.firstChild.remove();}
 paintActors(){for(const actor of this.actors){
  actor.button.style.left=actor.x*100+'%';actor.button.style.top=actor.y*100+'%';actor.button.style.zIndex=document.activeElement===actor.button?150:Math.round(actor.y*100);
  const moving=actor.wait<=0&&this.mode==='room',img=actor.button.querySelector('img');
  const frame=moving?Math.floor(actor.walkTime*(actor.id==='red'?7:5))%4:3;
  if(frame!==actor.walkFrame){actor.walkFrame=frame;img.src=actor.walkImages[frame];}
  img.dataset.walkFrame=frame;img.style.transform=`scaleX(${actor.facing})`;
  actor.button.dataset.facing=actor.facing<0?'left':'right';actor.button.dataset.walking=String(moving);
 }}
 destroy(){if(this.dead)return;this.endActivity?.();if(this.mode==='focus')this.finishFocusMeasurement(true);this.dead=true;this.closeCelebration();cancelAnimationFrame(this.raf);cancelAnimationFrame(this.trustRaf);this.shell?.classList.remove('room-closeup');this.pointer=null;this.body.removeEventListener('keydown',this.onKey);document.removeEventListener('visibilitychange',this.onVisibility);}
}
