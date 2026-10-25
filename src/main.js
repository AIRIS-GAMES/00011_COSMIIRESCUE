import {GameNotices} from './game-notices.js';
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
import {RescueGame,returnValue,distance,VIEW_W} from './engine.js';
import {stage} from './stage.js';
import {hero,friends} from './characters.js';
import {Renderer} from './renderer.js';
import {GameAudio} from './audio.js';
import {RescueStorage} from './storage.js';
import {LeaderboardUI} from './leaderboard-ui.js';
import {characterCollection,collectionStatus,returnReactions} from './collection.js';
import {PsfProgress,psfMeasure,kinds} from './psf.js';
import {characterNames} from './character-profiles.js';
export const progress=new PsfProgress();
const measure=(name,value=1,variant='normal',kind='group')=>psfMeasure(analytics,name,value,variant,kind);
const $=id=>document.getElementById(id),audio=new GameAudio(),settings=new GameSettings();
const notices=new GameNotices($('toast'));
const resultSocial=new ResultSocialPopup((name,data)=>analytics.community(name,data));
const shieldStatus=document.createElement('span');shieldStatus.id='blue-status';$('carry-bar').append(shieldStatus);
const modeStores={normal:new RescueStorage(undefined,'psf'),hard:new RescueStorage(undefined,'hard')};
let selectedMode='normal',storage=modeStores.normal;
function selectMode(mode){selectedMode=mode;storage=modeStores[mode];for(const name of ['normal','hard'])$('mode-'+name).setAttribute('aria-pressed',String(name===mode));$('mode-rule').textContent=mode==='hard'?'0 FRIENDS / HEAVY HIT = END':'3 LIVES';$('title-best').textContent=storage.data.best.toLocaleString();}
const endlessGame=new RescueGame(stage,Math.random,collaboration),trainingGame=new TrainingGame();
export let game=endlessGame;
const collaborationUI=new CollaborationUI(endlessGame);
const leaderboardUI=new LeaderboardUI();
export const communityUI=new CommunityUI(show,{progress,measure:(name,data)=>analytics.community(name,data)});
const titleTotal=document.createElement('strong');titleTotal.id='title-total-returned';titleTotal.innerHTML='<span class="total-label">累計帰還<small>NORMAL</small></span><span class="total-value"><b>0</b>体</span>';$('start').after(titleTotal);
const resultTotal=$('result-rescued-stat');resultTotal.previousElementSibling.textContent='累計帰還（NORMAL）';resultTotal.title='NORMALでHOMEへ届けた仲間の累計。今回までの保存済み帰還数。';
function updateTotalReturned(){const total=progress.totalReturned.toLocaleString();titleTotal.querySelector('b').textContent=total;titleTotal.setAttribute('aria-label',`累計帰還 ${total}体（NORMAL）`);titleTotal.title='HOMEへ届けた仲間の累計。練習・HARDは含みません。';resultTotal.textContent=total+'体';}
updateTotalReturned();
export const presentation=presentationFlags();
export const rescueTutorial=new RescueTutorial({start:()=>changeScene(()=>startNow(),true),title:()=>changeScene(homeNow)});
export const openingUI=new OpeningUI({enabled:presentation.opening,show:()=>show('opening-screen'),close:source=>{if(source==='replay'){changeScene(()=>show('title'));return;}progress.mark('intro');changeScene(()=>startTraining('onboarding'),true);},measure:(name,data)=>analytics.presentation(name,data)});
const openingReplay=document.createElement('button');openingReplay.id='intro-preview';openingReplay.type='button';openingReplay.textContent='▶ プロローグを見る';openingReplay.hidden=!presentation.opening;openingReplay.onclick=()=>openingUI.open('replay',openingReplay);$('title').append(openingReplay);
const practiceButton=document.createElement('button');practiceButton.id='practice-start';practiceButton.textContent='遊び方';practiceButton.onclick=()=>changeScene(()=>startTraining('optional'),true);$('title').append(practiceButton);
const memory=document.createElement('div');memory.id='return-memory';$('unbanked').after(memory);
function resultMemory(){
 memory.replaceChildren();if(game.mode!=='normal')return;
 game.delivered.forEach((count,i)=>{if(!count)return;
  const row=document.createElement('div'),img=document.createElement('img'),text=document.createElement('span'),button=document.createElement('button');
  img.src=friends[i].src;img.alt=characterNames[kinds[i]]+'の仲間';
  text.textContent=`${characterNames[kinds[i]]}の仲間：${returnReactions[kinds[i]]}${i===1&&game.blueUsed?' 今回、クッションで守ってくれた。':''}${characterCollection(kinds[i],progress.data).achieved?' ★収集記念達成':''}`;
  button.textContent='この子を知る';button.onclick=()=>{analytics.interest('result_detail',{source:'result',characterType:kinds[i],status:collectionStatus(characterCollection(kinds[i],progress.data))});communityUI.open('characters',button,{source:'result',character:kinds[i],returnTo:()=>show('result')});};
  row.append(img,text,button);memory.append(row);
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
function orientationUI(){document.documentElement.classList.toggle('landscape-auto',bootComplete&&innerHeight>innerWidth);document.querySelector('.arcade').inert=!bootComplete;if(ready)clearInput();renderer?.resize();}
let screen='title',ready=false,paused=false,last=0,accumulator=0,tutorialLeft=0,pointer=null;
const pressed=new Set();audio.enabled=!settings.muted;
// Run synchronously in trusted input, before transitions or animation-frame events.
for(const type of ['touchend','click','keydown'])document.addEventListener(type,event=>{if(event.isTrusted)audio.unlock();},{capture:true,passive:true});
document.querySelector('.arcade').inert=true;
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`Failed to load ${src}`));img.src=src;});}
function show(name){screen=name;$('game').dataset.screen=name;collaborationUI.show(name);for(const id of ['title','result','pause-screen','records-screen','community-screen','opening-screen'])$(id).hidden=name!==id;const playing=name==='playing';$('nav-row').hidden=!playing;$('carry-bar').hidden=!playing;$('pause').hidden=!playing;$('flight-controls').hidden=!playing;$('title-best').textContent=storage.data.best.toLocaleString();$('game').classList.toggle('training',!!game.isTraining);}
function toast(text,duration=2.5,priority=10){notices.push(text,{duration,priority});}
function clearInput(){pointer=null;pressed.clear();resetStick();}
function startTraining(source='optional'){
  exitPractice();practiceSource=source;practiceStep=-1;practiceActive=true;measure('practice_start',1,source);
  analytics.end(game,'quit');game=trainingGame;game.startPractice();paused=false;clearInput();audio.resume();audio.restart();renderer.snap(game);accumulator=0;tutorialLeft=0;notices.reset();$('tutorial').hidden=true;$('toast').hidden=true;rescueTutorial.lastStep=-1;show('playing');$('flap').focus();
}
function startNow(){if(!ready||!bootComplete)return;audio.unlock();clearInput();paused=false;audio.resume();analytics.end(game,'retry');
  exitPractice();
  game=endlessGame;game.start(selectedMode);storage.beginRun();analytics.start(game);
  game.psfRules=selectedMode==='normal';game.firstReturnProtection=game.psfRules&&!progress.data.returned;
  if(game.psfRules){game.normalAttempt=progress.beginNormal();measure('normal_attempt',1,game.normalAttempt);if(progress.mark('started'))measure('first_start');}
  analytics.community('play',{mode:selectedMode});
  leaderboardUI.beginRun();audio.restart();renderer.snap(game);accumulator=0;tutorialLeft=0;notices.reset();$('tutorial').hidden=true;$('toast').hidden=true;show('playing');if(document.hidden)background();$('live').textContent='救出開始。左手で左右の向き、右手タップで上昇。仲間を道中のHOMEへ。';}
function homeNow(){notices.reset();exitPractice();analytics.end(game,'quit');audio.music(false);audio.stopEffects();clearInput();paused=false;game=endlessGame;game.reset();renderer.snap(game);show('title');$('tutorial').hidden=true;$('toast').hidden=true;}
function pause(){if(game.state!=='playing'&&game.state!=='ending')return;paused=!paused;clearInput();show(paused?'pause-screen':'playing');accumulator=0;if(!paused){if(document.hidden){paused=true;show('pause-screen');return;}audio.resume();}if(paused)audio.stopEffects();audio.music(!paused);}
function processEvents(){audio.setRainbow(game.state==='playing'&&game.powered);const sounds=new Set();let rescued=false;for(const e of game.drain()){
  renderer.event(e,game);sounds.add(e.type==='collaborationStart'?'rainbowStart':e.type==='collaborationEnd'?'rainbowEnd':e.type);if(!game.isTraining)analytics.event(e,game);
  if(e.type==='rescue')rescued=true;
  if(!game.isTraining&&game.mode==='normal'){
    if(e.type==='rim'&&game.protectedReturn&&!game.rimGuideShown){game.rimGuideShown=true;toast('リングの横へ回って、中央を通ろう',3,60);}
    if(e.type==='rescue'&&progress.mark('rescued'))measure('first_rescue',game.time);
    if(e.type==='itemCollected')progress.collect(storage.runId,e.sequence,e.item);
    if(e.type==='blueDefense'){measure('blue_defense');toast('水色の仲間がクッションで守ってくれた！',2,80);}
    if(e.type==='return'){
      const first=!progress.data.returned,before=kinds.map(id=>characterCollection(id,progress.data));
      if(progress.commit(storage.runId,e.sequence,e.delivered)){
        updateTotalReturned();
        if(first){measure('first_return',game.time);measure('first_return_attempt',game.time,game.normalAttempt);}
        kinds.forEach((id,i)=>{const after=characterCollection(id,progress.data),data={source:'return',characterType:id,status:collectionStatus(after)};
          if(!before[i].unlocked&&after.unlocked)analytics.interest('profile_unlock',data);
          if(!before[i].achieved&&after.achieved)analytics.interest('goal_complete',data);
        });
        const kind=game.blueUsed&&e.delivered[1]>0?1:e.delivered.findIndex(n=>n>0);
        if(kind>=0){game.lastReturnKind=kind;notices.push(returnReactions[kinds[kind]],{duration:1.8,priority:100,portrait:friends[kind].src,kind:kinds[kind]});}
      }
    }
  }
  if(e.type==='return')$('live').textContent=`RESCUED ${e.count}. SCORE +${e.total}`;

  if(e.type==='finish'){$('tutorial').hidden=true;}
  if(e.type==='gameOver'){
    leaderboardUI.result(game);
    const best=storage.record(game);show('result');$('toast').hidden=true;$('result-rescued').textContent=game.rescued;updateTotalReturned();
    $('result-score').textContent=game.score.toLocaleString();$('result-best').textContent=storage.data.best.toLocaleString();$('result-carry').textContent=`${game.maxCarry}`;
    $('result-return').textContent=`${game.bestReturn.toLocaleString()} pt`;$('new-best').hidden=!best;
    $('result-eyebrow').textContent=(game.mode==='hard'?'HARD · ':'')+(best?'NEW BEST!':'WELCOME HOME!');$('unbanked').textContent=game.carry.length?`UNBANKED ${game.carry.length}`:'';
    $('live').textContent=`${game.rescued}匹を救出。スコア${game.score}。`;if(best){sounds.add('best');renderer.event({type:'best'});}
    notices.reset();resultMemory();measure('result_shown',1,game.mode);resultSocial.open();
  }
}
  // Only POP, power-up end, and new-record events play sound effects.
  for(const type of sounds)if(['rescue','rainbowEnd','best'].includes(type))audio.effect(type);
  if(rescued){$('carry-bar').classList.remove('pulse');void $('carry-bar').offsetWidth;$('carry-bar').classList.add('pulse');}
}
function hud(){
  document.querySelector('.score label').textContent='SCORE';document.querySelector('.timer label').textContent='DISTANCE';document.querySelector('.return-preview>span').textContent='HOME BONUS';
  $('score').textContent=String(game.score).padStart(5,'0');$('timer').textContent=`${Math.floor(game.travel)} m`;
  const p=game.player,h=game.stage.home,d=distance(p,h),angle=Math.atan2(h.y-p.y,h.x-p.x),arrows=['→','↘','↓','↙','←','↖','↑','↗'],index=(Math.round(angle/(Math.PI/4))+8)%8;
  $('home-direction').hidden=d>900&&!game.carry.length;$('home-direction').textContent=`${arrows[index]} HOME · ${Math.round(d/10)} m · リング中央を通過`;
  $('hearts').textContent=game.time<30?`♥ ♥ ♥ ⛨`:'♥ '.repeat(game.hearts)+'♡ '.repeat(3-game.hearts);$('hearts').setAttribute('aria-label',`ライフ${game.hearts}${game.time<30?'、練習シールド中':''}`);
  if(game.mode==='hard'){$('hearts').textContent='HARD';$('hearts').setAttribute('aria-label','HARD: 仲間が0、または強い障害物が主人公に直撃すると終了');}
  if(game.protectedReturn){$('hearts').textContent='⛨ 仲間1体を保護中';$('hearts').setAttribute('aria-label','初回帰還まで仲間1体とライフを保護');}
  shieldStatus.hidden=game.mode!=='normal'||game.isTraining||!game.blueUsed&&!game.carry.some(f=>f.kind===1&&!Number.isInteger(f.collaborationKind));shieldStatus.textContent=game.blueUsed?'水色クッション：使用済み':'水色クッション：あと1回';
  $('carry-count').textContent=game.carry.length;$('return-value').textContent=`+${returnValue(game.carry).reduce((a,b)=>a+b,0).toLocaleString()}`;
}
let leftPointer=null;
function updateDirection(){game.setDirection(Number(pressed.has('ArrowRight')||pressed.has('KeyD'))-Number(pressed.has('ArrowLeft')||pressed.has('KeyA')));}
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
  if(screen!=='playing'||paused||game.isTraining&&game.practiceStep===4)return;
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
function background(){audio.suspend();if(!paused&&(game.state==='playing'||game.state==='ending'))pause();clearInput();if(ready)processEvents();last=0;accumulator=0;}
window.addEventListener('blur',background);
// Capacitor's built-in scene lifecycle event; keep the existing tap-to-resume flow.
document.addEventListener('pause',background);
$('mode-normal').onclick=()=>selectMode('normal');$('mode-hard').onclick=()=>selectMode('hard');$('start').onclick=start;$('retry').onclick=start;$('home').onclick=home;$('quit').onclick=endRun;$('pause').onclick=pause;$('resume').onclick=resume;
$('retry').onclick=()=>{if(transition.busy)return;measure('retry',1,selectedMode);start();};
function soundLabel(){$('sound').textContent=audio.enabled?'♪':'♪̸';$('sound').setAttribute('aria-label',audio.enabled?'BGMをオフにする（効果音はON）':'BGMをオンにする（効果音はON）');}
$('sound').onclick=()=>{audio.unlock();audio.enabled=!audio.enabled;settings.muted=!audio.enabled;settings.save();audio.music(screen==='playing'&&!paused);soundLabel();};
$('records').onclick=()=>{show('records-screen');leaderboardUI.open(storage);};$('close-records').onclick=()=>show('title');
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();last=0;accumulator=0;});
window.addEventListener('resize',orientationUI);
window.addEventListener('pagehide',event=>{if(!event.persisted)exitPractice();background();analytics.pageHide(game,event.persisted);});
window.addEventListener('pageshow',event=>{if(event.persisted){last=0;accumulator=0;orientationUI();}});
$('boot-retry').onclick=()=>location.reload();
initializeAnalytics();
analytics.presentation('variant',presentation);
function frame(now){const dt=Math.min(.06,(now-(last||now))/1000);last=now;
  if(game.isTraining&&practiceActive&&game.practiceStep!==practiceStep){practiceStep=game.practiceStep;measure('practice_step',practiceStep,practiceSource);if(practiceStep===4){progress.mark('practice');measure('practice_complete',1,practiceSource);practiceActive=false;}}
  if(!document.hidden&&!audio.suspended&&!paused&&!transition.busy){accumulator+=dt;while(accumulator>=1/120){game.update(1/120);accumulator-=1/120;}processEvents();if(tutorialLeft>0){tutorialLeft-=dt;if(tutorialLeft<=0)$('tutorial').hidden=true;}}
  notices.update(!document.hidden&&!audio.suspended&&!paused&&!transition.busy?dt:0,screen==='playing');
  collaborationUI.update(screen);rescueTutorial.update(game,screen);hud();audio.setRainbow(game.state==='playing'&&game.powered);audio.music(game.state==='playing'&&!paused&&!transition.busy);renderer.draw(game,dt,screen==='title'||screen==='records-screen'||screen==='community-screen'||screen==='opening-screen',paused||transition.busy);requestAnimationFrame(frame);
}
try{const [heroImage,friendImages,art,flapFrames,collaborationImages]=await Promise.all([loadImage(hero.src),Promise.all(friends.map(f=>loadImage(f.src))),Promise.all(Object.entries(stage.art).map(async([key,src])=>[key,await loadImage(src)])),Promise.all(hero.frames.map(loadImage)),collaborationUI.loadImages(loadImage)]);renderer=new Renderer($('canvas'),{hero:heroImage,flapFrames,collaborationImages,friends:friendImages,...Object.fromEntries(art)},stage);ready=true;renderer.snap(game);show('title');soundLabel();requestAnimationFrame(frame);await Promise.all([$('boot-logo').decode(),new Promise(resolve=>setTimeout(resolve,Math.max(0,1800-(performance.now()-bootStarted))))]);bootComplete=true;$('boot-screen').hidden=true;$('loading').hidden=true;orientationUI();if(!progress.data.intro&&presentation.opening)openingUI.open('startup');}catch(error){audio.suspend();ready=false;bootComplete=false;$('boot-screen').hidden=false;$('boot-status').textContent='LOAD FAILED';$('boot-retry').hidden=false;console.error(error);}
