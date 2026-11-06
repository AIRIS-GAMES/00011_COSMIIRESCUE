import {BrowserController} from './gamepad.js';
import {installReminders} from './reminders.js';
import {SkillUI} from './skill-ui.js';
import {GameNotices} from './game-notices.js';
import {setupModeRules} from './mode-rules.js';
import {ResultSocialPopup} from './result-social.js';
import {collaboration} from './collaboration-config.js';
import {CommunityUI} from './community-ui.js';
import {OpeningUI} from './opening-ui.js';
import {RescueTutorial} from './rescue-tutorial.js';
import {TrainingGame} from './training-game.js';
import {presentationFlags} from './presentation-config.js';
import {CollaborationUI} from './collaboration-ui.js';
import {GameSettings} from './settings.js';
import {analytics,initializeAnalytics} from './analytics.js';
import {FaceTransition} from './transition.js';
import {RescueGame,distance,VIEW_W} from './engine.js';
import {stage} from './stage.js';
import {hero,friends} from './characters.js';
import {Renderer} from './renderer.js';
import {GameAudio} from './audio.js';
import {RescueStorage} from './storage.js';
import {LeaderboardUI} from './leaderboard-ui.js';
import {characterCollection,collectionStatus} from './collection.js';
import {PsfProgress,psfMeasure,kinds} from './psf.js';
import {characterNames} from './character-profiles.js';
import {AREAS} from './areas.js';
import {icon,iconEl} from './icons.js';
import {DailyMissions} from './missions.js';
import {t as _t,LANG,translateStatic} from './i18n.js';
import {GoalCard} from './goal-card.js';
import {PlayHints} from './play-hints.js';
import {milestoneCrossed,isBigMilestone} from './milestones.js';
// i18n before any UI is built: static HTML switches language first.
document.documentElement.lang=LANG;translateStatic(document.body);
export const progress=new PsfProgress();
const measure=(name,value=1,variant='normal',kind='group')=>psfMeasure(analytics,name,value,variant,kind);
const $=id=>document.getElementById(id),audio=new GameAudio(),settings=new GameSettings();
const goalCard=new GoalCard({parent:$('game')}),hints=new PlayHints();
// Leaving the app suspends audio; outside a run, the next gesture may wake menu sounds.
// During a run, only RESUME/PLAY lift the suspension so gameplay stays paused.
function wakeMenuAudio(){if(audio.suspended&&!document.hidden&&game.state!=='playing'&&game.state!=='ending')audio.resume();else audio.unlock();}
// One delegated click handler covers menu buttons, keyboard activation and links.
document.addEventListener('click',event=>{
 const button=event.target.closest?.('button,a[href],[role="button"]');
 if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||button.closest('[inert]'))return;
 wakeMenuAudio();audio.effect('uiPlop');
});
document.addEventListener('cosmii-celebration-sound',event=>{
 if(event.detail==='start'){wakeMenuAudio();audio.effect('applause');}else audio.stopEffect('applause');
});
$('carry-bar').addEventListener('animationend',()=> $('carry-bar').classList.remove('pulse'));
// The D1 reminder announces today's missions; tapping it opens the mission list once the title is ready.
let pendingMissionOpen=false;
const reminders=installReminders((name,kind)=>analytics.notification(name,kind),kind=>{if(kind!=='d1')return;pendingMissionOpen=true;openPendingMissions();});
function openPendingMissions(){try{if(!pendingMissionOpen||screen!=='title'||!bootComplete||openingUI.active||transition.busy)return;}catch{return;}pendingMissionOpen=false;communityUI.open('missions',$('open-missions'),{source:'notification'});}
const notices=new GameNotices($('toast'));
const resultSocial=new ResultSocialPopup((name,data)=>analytics.community(name,data));
// The SNS card no longer pops over the result on its own (no stacked windows); a small button next to the
// ranking link opens it, and only then is the result set aside.
function resultLinks(){if($('result-sns'))return;const row=document.createElement('div');row.className='result-links';const sns=document.createElement('button');sns.type='button';sns.id='result-sns';sns.className='result-sns';sns.textContent=_t('SNS・スタンプ');sns.onclick=()=>resultSocial.open();
 const form=document.querySelector('#result .ranking-entry');$('unbanked').after(row);if(form)row.append(form);row.append(sns);}
const modeStores={normal:new RescueStorage(undefined,'psf'),hard:new RescueStorage(undefined,'hard')};
let selectedMode='normal',storage=modeStores.normal;
function selectMode(mode){selectedMode=mode;storage=modeStores[mode];for(const name of ['normal','hard'])$('mode-'+name).setAttribute('aria-pressed',String(name===mode));$('mode-rule').textContent=_t('ルール ⓘ');$('mode-rule').setAttribute('aria-label',mode==='hard'?_t('ハードのルールを見る'):_t('ノーマルのルールを見る'));$('title-best').textContent=storage.data.best.toLocaleString();}
setupModeRules(()=>selectedMode);
const endlessGame=new RescueGame(stage,Math.random,collaboration),trainingGame=new TrainingGame();
export let game=endlessGame;
const skillUI=new SkillUI(kind=>{if(screen==='playing'&&!paused&&!transition.busy&&game.activateSkill(kind)){clearInput();$('live').textContent=_t('{0}発動',[[_t('するり抜け'),_t('ふわふわガード'),_t('はね飛ばし'),_t('おたすけキャッチ')][kind]]);}});
const collaborationUI=new CollaborationUI(endlessGame);
const leaderboardUI=new LeaderboardUI({getBgm:()=>audio.enabled,setBgm:enabled=>{audio.unlock();audio.enabled=enabled;settings.muted=!enabled;settings.save();audio.music(screen==='playing'&&!paused);soundLabel();}});
export const missions=new DailyMissions();
export const communityUI=new CommunityUI(show,{progress,missions,measure:(name,data)=>{analytics.community(name,data);analytics.engagement(name,data);
 // Room actions feed today's room mission.
 if(name==='snack_given')missions.track('snack');if(name==='trust_gain'&&data?.source!=='treat')missions.track('touch');}});
missions.subscribe(done=>{for(const m of done)if(screen==='playing')toast(_t('ミッション達成！「{0}」',[m.text]),3,80);communityUI.updateMissionBadge();});
communityUI.updateMissionBadge();
const titleTotal=document.createElement('button');titleTotal.type='button';titleTotal.onclick=()=>communityUI.open('returns',titleTotal);titleTotal.id='title-total-returned';titleTotal.innerHTML=_t('<img class="menu-icon" src="./Asset/ui/menu/returns.png" alt=""><span class="menu-label">累計帰還</span><span class="total-value"><b>0</b>体</span>');$('open-social').before(titleTotal);
const resultTotal=$('result-rescued-stat');resultTotal.previousElementSibling.textContent=_t('累計帰還');resultTotal.title=_t('ノーマルでHOMEへ届けた仲間の累計。今回までの保存済み帰還数。');
function updateTotalReturned(){const total=progress.totalReturned.toLocaleString();titleTotal.querySelector('b').textContent=total;titleTotal.setAttribute('aria-label',_t('累計帰還を見る {0}体（ノーマル）',[total]));titleTotal.title=_t('HOMEへ届けた仲間の累計。練習・ハードは含みません。');resultTotal.textContent=total+_t('体');}
updateTotalReturned();
export const presentation=presentationFlags();
export const rescueTutorial=new RescueTutorial({start:()=>changeScene(()=>startNow(),true),title:()=>changeScene(homeNow)});
export const openingUI=new OpeningUI({enabled:presentation.opening,show:()=>show('opening-screen'),close:(source,skipped)=>{if(source==='replay'||source==='return'||skipped){if(source!=='replay')progress.mark('intro');changeScene(()=>show('title'));return;}progress.mark('intro');changeScene(()=>startTraining('onboarding'),true);},measure:(name,data)=>analytics.presentation(name,data)});
const openingReplay=document.createElement('button');openingReplay.id='intro-preview';openingReplay.type='button';openingReplay.innerHTML=_t('<img class="menu-icon" src="./Asset/ui/menu/prologue.png" alt=""><span class="menu-label">プロローグ</span>');openingReplay.setAttribute('aria-label',_t('プロローグを見る'));openingReplay.hidden=!presentation.opening;openingReplay.onclick=()=>openingUI.open('replay',openingReplay);$('title').querySelector('.community-entry').append(openingReplay);
const practiceButton=document.createElement('button');practiceButton.id='practice-start';practiceButton.innerHTML=_t('<img class="menu-icon" src="./Asset/ui/menu/practice.png" alt=""><span class="menu-label">あそび方</span>');practiceButton.setAttribute('aria-label',_t('あそび方'));practiceButton.onclick=()=>changeScene(()=>startTraining('optional'),true);$('title').querySelector('.community-entry').append(practiceButton);$('title').querySelector('.community-entry').append($('open-games'));
const memory=document.createElement('div');memory.id='return-memory';$('unbanked').after(memory);
function resultMemory(){
 memory.replaceChildren();if(game.mode!=='normal')return;
 game.delivered.forEach((count,i)=>{if(!count)return;
  const row=document.createElement('div'),img=document.createElement('img'),button=document.createElement('button');
  img.src=friends[i].src;img.alt=characterNames[kinds[i]]+_t('の仲間');
  button.textContent=_t('この子を知る');button.onclick=()=>{analytics.interest('result_detail',{source:'result',characterType:kinds[i],status:collectionStatus(characterCollection(kinds[i],progress.data))});communityUI.open('characters',button,{source:'result',character:kinds[i],returnTo:()=>show('result')});};
  button.prepend(img);row.append(button);memory.append(row);
 });
}
let practiceSource='optional',practiceStep=-1,practiceActive=false;
function exitPractice(){if(practiceActive){measure('practice_exit',Math.max(0,practiceStep),practiceSource);practiceActive=false;}}

game.onCheckpoint=()=>storage.record(game);
export let renderer;
export {audio};
const transition=new FaceTransition();
async function changeScene(action,fade=false){if(transition.busy||!ready||!bootComplete)return;audio.unlock();clearInput();audio.music(false);audio.stopEffects();await transition.run([renderer.assets.hero,...renderer.assets.friends],action,fade);accumulator=0;last=0;if(document.hidden){if(!paused&&game.state==='playing')pause();}orientationUI();}
function start(){
  if(transition.busy||!ready||!bootComplete||openingUI.active)return;
  return changeScene(()=>startNow());
}
function resume(){if(paused&&!transition.busy)pause();}
function home(){return changeScene(homeNow);}
function endRun(){
  if(game.isTraining){home();return;}
  if(transition.busy||!['playing','ending'].includes(game.state))return;
  clearInput();
  paused=false;accumulator=0;audio.resume();audio.stopEffects();audio.music(false);
  game.finish('quit');show('playing');processEvents();
}
let bootComplete=false;
const bootStarted=performance.now();
function orientationUI(event){if(event?.type==='resize'&&document.querySelector('.ranking-name-dialog[open]'))return;document.documentElement.classList.toggle('landscape-auto',bootComplete&&innerHeight>innerWidth);document.querySelector('.arcade').inert=!bootComplete;if(ready)clearInput();renderer?.resize();}
let screen='title',ready=false,paused=false,last=0,accumulator=0,tutorialLeft=0,pointer=null;
const pressed=new Set();audio.enabled=!settings.muted;
// Run synchronously in trusted input, before transitions or animation-frame events.
for(const type of ['touchend','click','keydown'])document.addEventListener(type,event=>{if(event.isTrusted)audio.unlock();},{capture:true,passive:true});
document.querySelector('.arcade').inert=true;
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`Failed to load ${src}`));img.src=src;});}
function show(name){screen=name;if(name==='title'){communityUI?.updateMissionBadge();queueMicrotask(openPendingMissions);}$('game').dataset.screen=name;collaborationUI.show(name);for(const id of ['title','result','pause-screen','records-screen','community-screen','opening-screen'])$(id).hidden=name!==id;const playing=name==='playing';$('nav-row').hidden=!playing;$('carry-bar').hidden=!playing;$('pause').hidden=!playing;$('flight-controls').hidden=!playing;$('title-best').textContent=storage.data.best.toLocaleString();$('game').classList.toggle('training',!!game.isTraining);}
function toast(text,duration=2.5,priority=10){notices.push(text,{duration,priority});}
// Current area in the HUD; the chip pulses when the run moves on.
function clearInput(){pointer=null;pressed.clear();resetStick();}
function startTraining(source='optional'){
  exitPractice();practiceSource=source;practiceStep=-1;practiceActive=true;measure('practice_start',1,source);
  analytics.end(game,'quit');game=trainingGame;game.startPractice();reminders.played(true);paused=false;clearInput();audio.resume();audio.restart();renderer.snap(game);accumulator=0;tutorialLeft=0;notices.reset();hints.reset();$('tutorial').hidden=true;$('toast').hidden=true;rescueTutorial.lastStep=-1;show('playing');$('flap').focus();
}
function startNow(){if(!ready||!bootComplete)return;audio.unlock();clearInput();paused=false;audio.resume();analytics.end(game,'retry');
  exitPractice();
  game=endlessGame;game.manualSkills=true;game.start(selectedMode);reminders.played(true);storage.beginRun();analytics.start(game);
  game.psfRules=selectedMode==='normal';game.firstReturnProtection=game.psfRules&&!progress.data.returned;
  if(game.psfRules){game.normalAttempt=progress.beginNormal();measure('normal_attempt',1,game.normalAttempt);if(progress.mark('started'))measure('first_start');}
  analytics.community('play',{mode:selectedMode});
  leaderboardUI.beginRun();audio.restart();renderer.snap(game);accumulator=0;tutorialLeft=0;notices.reset();hints.reset();$('tutorial').hidden=true;$('toast').hidden=true;show('playing');showGoal();if(document.hidden)background();$('live').textContent=_t('救出開始。左手で左右の向き、右手タップで上昇。仲間を道中のHOMEへ。');}
// Before the first runs (and until the first HOME return) the run waits behind a one-glance goal slide.
// It opens once the scene transition has finished, so its entrance animation is actually seen.
let goalPending=false;
const hintAnchors={skill:kind=>{const b=document.querySelector(`#skill-bar button[data-kind="${kind}"]`);return b&&!b.closest('[hidden]')?renderer.elementAnchor(b):null;},rainbow:()=>({x:renderer.width/2,y:54})};
function celebrateScore(big){const s=document.querySelector('.hud .score');if(!s)return;s.classList.remove('milestone','big');void s.offsetWidth;s.classList.add('milestone');s.classList.toggle('big',big);}
function showGoal(){if(!presentation.goal||!goalCard.wanted(!!progress.data.returned))return;paused=true;goalPending=true;}
function openGoal(){goalPending=false;goalCard.show(()=>{paused=false;clearInput();accumulator=0;last=0;if(audio.suspended&&!document.hidden)audio.resume();});}
function homeNow(){goalPending=false;if(goalCard.open){goalCard.onClose=null;goalCard.close();}if(game.state==='playing')reminders.played(false);notices.reset();hints.reset();exitPractice();analytics.end(game,'quit');audio.music(false);audio.stopEffects();clearInput();paused=false;game=endlessGame;game.reset();renderer.snap(game);show('title');$('tutorial').hidden=true;$('toast').hidden=true;}
function pause(){if(goalPending)return;if(goalCard.open){goalCard.close();return;}if(game.state!=='playing'&&game.state!=='ending')return;$('quit').textContent=game.isTraining?_t('練習をやめる'):_t('終了してスコアを見る');paused=!paused;reminders.played(!paused);clearInput();show(paused?'pause-screen':'playing');accumulator=0;if(!paused){if(document.hidden){paused=true;show('pause-screen');return;}audio.resume();}if(paused)audio.stopEffects();audio.music(!paused);}
function processEvents(){audio.setRainbow(game.state==='playing'&&game.powered);const sounds=new Set();let rescued=false;for(const e of game.drain()){
  renderer.event(e,game);sounds.add(e.type==='collaborationStart'?'rainbowStart':e.type==='collaborationEnd'?'rainbowEnd':e.type);if(!game.isTraining)analytics.event(e,game);
  if(e.type==='rescue')rescued=true;
  if(!game.isTraining&&game.mode==='normal'){
    if(e.type==='rim'&&game.beforeFirstReturn&&!game.rimGuideShown){game.rimGuideShown=true;toast(_t('リングの横へ回って、中央を通ろう'),3,60);}
    if(e.type==='rescue'&&progress.mark('rescued'))measure('first_rescue',game.time);
    if(e.type==='itemCollected')progress.collect(storage.runId,e.sequence,e.item);
    if(e.type==='return'){
      const first=!progress.data.returned,before=kinds.map(id=>characterCollection(id,progress.data));
      if(progress.commit(storage.runId,e.sequence,e.delivered)){
        updateTotalReturned();
        if(first){measure('first_return',game.time);measure('first_return_attempt',game.time,game.normalAttempt);}
        kinds.forEach((id,i)=>{const after=characterCollection(id,progress.data),data={source:'return',characterType:id,status:collectionStatus(after)};
          if(!before[i].unlocked&&after.unlocked)analytics.interest('profile_unlock',data);
          if(!before[i].achieved&&after.achieved)analytics.interest('goal_complete',data);
        });
      }
    }
  }
  if(!game.isTraining){
   // Daily missions count NORMAL and HARD runs, never practice.
   if(e.type==='rescue'&&!Number.isInteger(e.collaborationKind))missions.track('rescue',1,{kind:e.kind});
   if(e.type==='return'){missions.track('bigReturn',e.count);missions.track('delivered',e.count);}
   if(e.type==='area')missions.track('area',e.index);
   if(e.type==='skillStart')missions.track('skill');
   if(e.type==='gameOver')missions.track('run');
  }
  if(e.type==='return')$('live').textContent=_t('{0}匹救出。得点 +{1}',[e.count,e.total]);
  if(e.type==='return'&&!game.isTraining){const reached=milestoneCrossed(game.score-e.total,game.score);if(reached){renderer.milestone(reached);celebrateScore(isBigMilestone(reached));audio.effect('best');if(isBigMilestone(reached)){const fx=renderer.milestoneFx;setTimeout(()=>{if(renderer.milestoneFx===fx&&screen==='playing'&&!paused)audio.effect('applause');},350);}$('live').textContent=_t('{0}点達成！',[reached]);}}
  if(e.type==='windWarn')$('live').textContent=e.kind==='head'?_t('向かい風がくる'):_t('追い風がくる');
  if(e.type==='area'&&!game.isTraining){notices.push(_t('エリア{0}「{1}」へ！',[e.index+1,e.name]),{duration:2.8,priority:85,kind:'area'});$('live').textContent=_t('エリア{0} {1}に到着',[e.index+1,e.name]);}

  if(e.type==='finish'){reminders.played(false);$('tutorial').hidden=true;}
  if(e.type==='gameOver'&&game.isTraining){home();break;}
  if(e.type==='gameOver'){
    leaderboardUI.result(game);
    const best=storage.record(game);show('result');$('toast').hidden=true;$('result-rescued').textContent=game.rescued;updateTotalReturned();
    $('result-score').textContent=game.score.toLocaleString();$('result-best').textContent=storage.data.best.toLocaleString();$('result-carry').textContent=`${game.maxCarry}`;
    $('result-return').textContent=_t('{0}匹',[game.bestReturnCount]);$('result-distance').textContent=`${Math.floor(game.travel).toLocaleString()} m`;const reached=AREAS[game.bestArea||0].name,bestReached=AREAS[storage.data.bestArea||0].name;$('result-area').textContent=storage.newArea?_t('{0} 更新！',[reached]):reached;$('result-area').title=_t('これまでの最高：{0}',[bestReached]);$('new-best').hidden=!best;
    $('result-eyebrow').textContent=(game.mode==='hard'?_t('ハード · '):'')+(best?_t('✦ 自己ベスト！'):_t('おかえり！'));$('unbanked').textContent='';
    $('live').textContent=_t('{0}匹を救出。スコア{1}。',[game.rescued,game.score]);if(best){sounds.add('best');renderer.event({type:'best'});}
    notices.reset();hints.reset();resultMemory();resultLinks();measure('result_shown',1,game.mode);
  }
}
  // Only POP, power-up end, and new-record events play sound effects.
  for(const type of sounds)if(['rescue','rainbowEnd','best'].includes(type))audio.effect(type);
  if(rescued)$('carry-bar').classList.add('pulse');
}
function hud(){
  document.querySelector('.score label').textContent=_t('スコア');document.querySelector('.timer').hidden=true;
  $('score').textContent=String(game.score).padStart(5,'0');$('timer').textContent=`${Math.floor(game.travel)} m`;
  const p=game.player,h=game.stage.home,d=distance(p,h),angle=Math.atan2(h.y-p.y,h.x-p.x),index=(Math.round(angle/(Math.PI/4))+8)%8;
  $('home-direction').hidden=d>900&&!game.carry.length;homeDirection(angle,_t('HOME {0} m',[Math.round(d/10)]));
  const lives=Math.max(0,Math.min(3,game.hearts)),protectedLife=false,lifeKey=game.mode+':'+lives+':'+protectedLife;
  if($('hearts').dataset.state!==lifeKey){
   $('hearts').dataset.state=lifeKey;$('hearts').dataset.mode=game.mode;
   $('hearts').innerHTML=game.mode==='hard'?_t('<span class="life-hard">ハード</span>'):'<span class="life-images" aria-hidden="true">'+[0,1,2].map(i=>'<img src="./Asset/ui/life/'+(i<lives?'full':'empty')+'.png" alt="">').join('')+'</span>'+(protectedLife?_t('<span class="life-protection">保護中</span>'):'');
   $('hearts').setAttribute('aria-label',game.mode==='hard'?_t('ハード：主人公に障害物が当たると終了'):_t('ライフ')+lives+' / 3'+(protectedLife?_t('、ライフ保護中'):''));
  }
  $('carry-count').textContent=game.carry.length;
}
let leftPointer=null,controllerAxis=0;
function updateDirection(){game.setDirection((Number(pressed.has('ArrowRight')||pressed.has('KeyD'))-Number(pressed.has('ArrowLeft')||pressed.has('KeyA')))||controllerAxis);}
function horizontalInput(event,element){const r=element.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');return rotated?{position:event.clientY-r.top,width:r.height}:{position:event.clientX-r.left,width:r.width};}
function resetStick(){leftPointer=null;game.setDirection(0);const pad=$('direction-pad');pad.dataset.direction='neutral';pad.classList.remove('active');pad.style.setProperty('--stick-x','0px');pad.style.setProperty('--stick-y','0px');}
function directionAt(event){
  const pad=$('direction-pad'),r=pad.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');
  const width=rotated?r.height:r.width,height=rotated?r.width:r.height;
  let x=(rotated?event.clientY-r.top:event.clientX-r.left)-width/2;
  let y=(rotated?r.right-event.clientX:event.clientY-r.top)-height/2;
  const radius=width*.29,length=Math.hypot(x,y),scale=length>radius?radius/length:1;x*=scale;y*=scale;
  const axis=x/radius,dead=.12;game.setDirection(Math.abs(axis)<=dead?0:Math.sign(axis)*(Math.abs(axis)-dead)/(1-dead));
  pad.style.setProperty('--stick-x',`${x}px`);pad.style.setProperty('--stick-y',`${y}px`);pad.classList.add('active');
  pad.dataset.direction=game.direction<-.15?'left':game.direction>.15?'right':'neutral';
}
$('game').addEventListener('pointerdown',event=>{
  if(transition.busy||!ready||event.target.closest('.modal-screen'))return;
  if(event.target.closest('button')&&!event.target.closest('#flap'))return;
  if(screen!=='playing'||paused||game.skillCutin||game.isTraining&&(game.practiceStep===4||game.practiceStep===6))return;
  event.preventDefault();const axis=horizontalInput(event,$('game'));
  if(axis.position<axis.width*.5){if(leftPointer!==null)return;leftPointer=event.pointerId;directionAt(event);}
  else{game.flap();$('flap').classList.remove('tap');void $('flap').offsetWidth;$('flap').classList.add('tap');}
  $('game').setPointerCapture(event.pointerId);
});
$('game').addEventListener('pointermove',event=>{if(event.pointerId===leftPointer)directionAt(event);});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('game').addEventListener(name,event=>{if(event.pointerId===leftPointer)resetStick();});
// Flight is handled on pointerdown. Cancel Safari's double-tap gesture without
// suppressing the click used by PLAY, PAUSE, RESUME and other menu buttons.
$('game').addEventListener('touchend',event=>{
  const target=event.target;
  if(screen==='playing'&&!paused&&!target.closest('.modal-screen')&&(!target.closest('button')||target.closest('#flap'))&&event.cancelable)event.preventDefault();
},{passive:false});
document.addEventListener('dblclick',event=>{if(event.cancelable)event.preventDefault();},{passive:false});
document.addEventListener('keydown',e=>{
  if(transition.busy){e.preventDefault();return;}
  if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)pause();return;}
  if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();if(screen==='playing'&&!paused){pressed.add(e.code);updateDirection();}}
  if(['Space','ArrowUp','KeyW'].includes(e.code)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(e.repeat)return;if(screen==='playing'&&!paused){game.flap();}}
});
document.addEventListener('keyup',e=>{pressed.delete(e.code);if(leftPointer===null)updateDirection();});
// Click supports accessibility activation; physical pointer taps already flap on down.
$('flap').onclick=e=>{if(!transition.busy&&e.detail===0&&screen==='playing'&&!paused){game.flap();}};
let blurred=false;window.addEventListener('focus',()=>{blurred=false;});
function background(){blurred=true;audio.suspend();if(!paused&&(game.state==='playing'||game.state==='ending'))pause();clearInput();if(ready)processEvents();last=0;accumulator=0;}
window.addEventListener('blur',background);
// Capacitor's built-in scene lifecycle event; keep the existing tap-to-resume flow.
document.addEventListener('pause',background);
$('mode-normal').onclick=()=>selectMode('normal');$('mode-hard').onclick=()=>selectMode('hard');$('start').onclick=start;$('home').onclick=home;$('quit').onclick=endRun;$('pause').onclick=pause;$('resume').onclick=resume;
$('retry').onclick=()=>{if(transition.busy)return;measure('retry',1,selectedMode);start();};
// HOME pointer: a drawn arrow rotated toward the ring (8 steps), text updated only when it changes.
function homeDirection(angle,text){const box=$('home-direction');if(!box.arrow){box.textContent='';box.arrow=iconEl('arrow','dir-arrow');box.label=document.createElement('span');box.append(box.arrow,box.label);}const step=Math.round(angle/(Math.PI/4))*45;if(box.step!==step){box.step=step;box.arrow.style.transform=`rotate(${step}deg)`;}if(box.label.textContent!==text)box.label.textContent=text;}
function soundLabel(){$('sound').innerHTML=icon(audio.enabled?'sound-on':'sound-off');$('sound').setAttribute('aria-label',audio.enabled?_t('BGMをオフにする（効果音はON）'):_t('BGMをオンにする（効果音はON）'));}
$('sound').onclick=()=>{audio.unlock();audio.enabled=!audio.enabled;settings.muted=!audio.enabled;settings.save();audio.music(screen==='playing'&&!paused);soundLabel();};
$('records').onclick=()=>{show('records-screen');leaderboardUI.open(storage);};$('close-records').onclick=()=>show('title');
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();last=0;accumulator=0;});
window.addEventListener('resize',orientationUI);
window.screen.orientation?.addEventListener('change',()=>requestAnimationFrame(()=>orientationUI()));
// Another tab saved progress or scores: refresh the shown totals.
window.addEventListener('storage',()=>{progress.load();for(const store of Object.values(modeStores))store.load();updateTotalReturned();$('title-best').textContent=storage.data.best.toLocaleString();});
window.addEventListener('pagehide',event=>{if(!event.persisted)exitPractice();background();analytics.pageHide(game,event.persisted);});
window.addEventListener('pageshow',event=>{if(event.persisted){last=0;accumulator=0;orientationUI();}});
$('boot-retry').onclick=()=>location.reload();
initializeAnalytics();
analytics.presentation('variant',presentation);
const controller=new BrowserController({
 state:()=>({screen,trainingDone:game.isTraining&&game.practiceStep===6,active:ready&&bootComplete&&!transition.busy}),
 direction:axis=>{if(controllerAxis!==axis||axis!==0){controllerAxis=axis;if(leftPointer===null)updateDirection();}},
 flap:()=>{if(!game.skillCutin)game.flap();},
 pause:()=>pause(),
 disconnected:()=>{controllerAxis=0;if(screen==='playing'&&!paused)pause();clearInput();$('live').textContent=_t('コントローラーの接続が切れました。');}
});
function frame(now){const dt=Math.min(.06,(now-(last||now))/1000);last=now;
  controller.update(now);
  if(game.isTraining&&practiceActive&&game.practiceStep!==practiceStep){practiceStep=game.practiceStep;measure('practice_step',practiceStep,practiceSource);if(practiceStep===6){progress.mark('practice');measure('practice_complete',1,practiceSource);practiceActive=false;}}
  if(!document.hidden&&!audio.suspended&&!paused&&!transition.busy){accumulator+=dt;while(accumulator>=1/120){game.update(1/120);accumulator-=1/120;}processEvents();if(tutorialLeft>0){tutorialLeft-=dt;if(tutorialLeft<=0)$('tutorial').hidden=true;}}
  if(goalPending&&!transition.busy&&screen==='playing')openGoal();
  // One message at a time: a hint never starts while a notice or a 50/100 celebration is up, and hides under the celebration.
  {const busy=!!renderer.milestoneFx||!!notices.current,live=!document.hidden&&!paused&&!transition.busy&&game.state==='playing';
   const h=screen==='playing'&&!game.isTraining&&!goalCard.open?hints.update(game,live&&(hints.current||!busy)?dt:0,hintAnchors):null;renderer.hint=renderer.milestoneFx?null:h;}
  if(!document.hidden&&!blurred&&!transition.busy)goalCard.update(dt);
  notices.update(!document.hidden&&!audio.suspended&&!paused&&!transition.busy?dt:0,screen==='playing'&&!renderer.milestoneFx);
  skillUI.update(game,screen==='playing'&&!paused);collaborationUI.update(screen);rescueTutorial.update(game,screen,renderer);hud();audio.setRainbow(game.state==='playing'&&game.powered);audio.music(game.state==='playing'&&!paused&&!transition.busy);renderer.draw(game,dt,screen==='title'||screen==='records-screen'||screen==='community-screen'||screen==='opening-screen',paused||transition.busy);requestAnimationFrame(frame);
}
try{const [heroImage,friendImages,art,flapFrames,collaborationImages]=await Promise.all([loadImage(hero.src),Promise.all(friends.map(f=>loadImage(f.src))),Promise.all(Object.entries(stage.art).map(async([key,src])=>[key,await loadImage(src)])),Promise.all(hero.frames.map(loadImage)),collaborationUI.loadImages(loadImage),document.fonts.load('16px "Mochiy Pop One"')]);renderer=new Renderer($('canvas'),{hero:heroImage,flapFrames,collaborationImages,friends:friendImages,...Object.fromEntries(art)},stage);ready=true;renderer.snap(game);show('title');soundLabel();requestAnimationFrame(frame);await Promise.all([$('boot-logo').decode(),new Promise(resolve=>setTimeout(resolve,Math.max(0,1800-(performance.now()-bootStarted))))]);bootComplete=true;$('boot-screen').hidden=true;$('loading').hidden=true;orientationUI();if(presentation.opening)openingUI.open(progress.data.intro?'return':'startup');openPendingMissions();}catch(error){audio.suspend();ready=false;bootComplete=false;$('boot-screen').hidden=false;$('boot-status').textContent=_t('よみこみに失敗しました');$('boot-retry').hidden=false;console.error(error);}
