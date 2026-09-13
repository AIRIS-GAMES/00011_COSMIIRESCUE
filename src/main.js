import {GameSettings} from './settings.js';
import {analytics,initializeAnalytics} from './analytics.js';
import {FaceTransition} from './transition.js';
import {RescueGame,returnValue,distance,VIEW_W} from './engine.js';
import {stage} from './stage.js';
import {hero,friends} from './characters.js';
import {Renderer} from './renderer.js';
import {GameAudio} from './audio.js';
import {RescueStorage} from './storage.js';
const $=id=>document.getElementById(id),audio=new GameAudio(),settings=new GameSettings();
const modeStores={normal:new RescueStorage(),hard:new RescueStorage(undefined,'hard')};
let selectedMode='normal',storage=modeStores.normal;
function selectMode(mode){selectedMode=mode;storage=modeStores[mode];for(const name of ['normal','hard'])$('mode-'+name).setAttribute('aria-pressed',String(name===mode));$('mode-rule').textContent=mode==='hard'?'0 FRIENDS / HEAVY HIT = END':'3 LIVES';$('title-best').textContent=storage.data.best.toLocaleString();}
export const game=new RescueGame(stage);
game.onCheckpoint=()=>storage.record(game);
export let renderer;
export {audio};
const transition=new FaceTransition();
let controlIntro=0,dockLeft=0;
function beginControls(){controlIntro=4;dockLeft=0;$('game').classList.add('controls-intro');}
function finishControls(){if(!controlIntro)return;controlIntro=0;dockLeft=.35;$('game').classList.remove('controls-intro');}
async function changeScene(action){if(transition.busy||!ready||!bootComplete)return;audio.unlock();clearInput();audio.music(false);await transition.run([renderer.assets.hero,...renderer.assets.friends],action);accumulator=0;last=0;if(document.hidden){if(!paused&&game.state==='playing')pause();}orientationUI();}
function start(){return changeScene(startNow);}
function resume(){if(paused&&!transition.busy)pause();}
function home(){return changeScene(homeNow);}
let bootComplete=false;
const bootStarted=performance.now();
function orientationUI(){document.documentElement.classList.toggle('landscape-auto',bootComplete&&innerHeight>innerWidth);document.querySelector('.arcade').inert=!bootComplete;if(ready)clearInput();renderer?.resize();}
let screen='title',ready=false,paused=false,last=0,accumulator=0,toastLeft=0,tutorialLeft=0,pointer=null;
const pressed=new Set();audio.enabled=!settings.muted;
document.querySelector('.arcade').inert=true;
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(`Failed to load ${src}`));img.src=src;});}
function show(name){screen=name;for(const id of ['title','result','pause-screen','records-screen'])$(id).hidden=name!==id;const playing=name==='playing';$('nav-row').hidden=!playing;$('carry-bar').hidden=!playing;$('pause').hidden=!playing;$('flight-controls').hidden=!playing;$('title-best').textContent=storage.data.best.toLocaleString();}
function toast(text,duration=2.5){$('toast').textContent=text;$('toast').hidden=false;toastLeft=duration;}
function clearInput(){pointer=null;pressed.clear();resetStick();}
function startNow(){if(!ready||!bootComplete)return;audio.unlock();clearInput();paused=false;audio.resume();game.start(selectedMode);storage.beginRun();analytics.start(game);audio.restart();renderer.snap(game);accumulator=0;toastLeft=0;tutorialLeft=0;$('tutorial').hidden=true;$('toast').hidden=true;show('playing');beginControls();if(document.hidden)background();$('live').textContent='救出開始。左手で左右の向き、右手タップで上昇。仲間を道中のHOMEへ。';}
function homeNow(){analytics.end(game,'quit');controlIntro=0;dockLeft=0;$('game').classList.remove('controls-intro');audio.music(false);clearInput();paused=false;game.reset();renderer.snap(game);show('title');$('tutorial').hidden=true;$('toast').hidden=true;}
function pause(){if(game.state!=='playing'&&game.state!=='ending')return;paused=!paused;clearInput();show(paused?'pause-screen':'playing');accumulator=0;if(!paused){if(document.hidden){paused=true;show('pause-screen');return;}audio.resume();}audio.music(!paused);}
function processEvents(){for(const e of game.drain()){
  renderer.event(e);audio.effect(e.type);analytics.event(e,game);
  if(e.type==='rescue'){$('carry-bar').classList.remove('pulse');void $('carry-bar').offsetWidth;$('carry-bar').classList.add('pulse');}
  if(e.type==='return')$('live').textContent=`RESCUED ${e.count}. SCORE +${e.total}`;

  if(e.type==='finish'){$('tutorial').hidden=true;}
  if(e.type==='gameOver'){
    const best=storage.record(game);show('result');$('toast').hidden=true;$('result-rescued').textContent=game.rescued;$('result-rescued-stat').textContent=`${game.rescued}`;
    $('result-score').textContent=game.score.toLocaleString();$('result-best').textContent=storage.data.best.toLocaleString();$('result-carry').textContent=`${game.maxCarry}`;
    $('result-return').textContent=`${game.bestReturn.toLocaleString()} pt`;$('new-best').hidden=!best;
    $('result-eyebrow').textContent=(game.mode==='hard'?'HARD · ':'')+(best?'NEW BEST!':'WELCOME HOME!');$('unbanked').textContent=game.carry.length?`UNBANKED ${game.carry.length}`:'';
    $('live').textContent=`${game.rescued}匹を救出。スコア${game.score}。`;if(best){audio.effect('best');renderer.event({type:'best'});}
  }
}}
function hud(){
  $('score').textContent=String(game.score).padStart(5,'0');$('timer').textContent=`${Math.floor(game.travel)} m`;
  const p=game.player,h=game.stage.home,d=distance(p,h),angle=Math.atan2(h.y-p.y,h.x-p.x),arrows=['→','↘','↓','↙','←','↖','↑','↗'],index=(Math.round(angle/(Math.PI/4))+8)%8;
  $('home-direction').hidden=d>900;$('home-direction').textContent=d<h.radius?'⌂ HOME ✓':`${arrows[index]} HOME · ${Math.round(d/10)} m`;
  $('hearts').textContent=game.time<30?`♥ ♥ ♥ ⛨`:'♥ '.repeat(game.hearts)+'♡ '.repeat(3-game.hearts);$('hearts').setAttribute('aria-label',`ライフ${game.hearts}${game.time<30?'、練習シールド中':''}`);
  if(game.mode==='hard'){$('hearts').textContent='HARD';$('hearts').setAttribute('aria-label','HARD: 仲間が0、または強い障害物が主人公に直撃すると終了');}
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
  if(screen==='title'){event.preventDefault();start();return;}
  if(screen!=='playing'||paused)return;
  event.preventDefault();const axis=horizontalInput(event,$('game'));
  if(axis.position<axis.width*.5){if(leftPointer!==null)return;leftPointer=event.pointerId;directionAt(event);}
  else{if(controlIntro)finishControls();else if(!dockLeft)game.flap();$('flap').classList.remove('tap');void $('flap').offsetWidth;$('flap').classList.add('tap');}
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
  if(['Space','ArrowUp','KeyW'].includes(e.code)&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(e.repeat)return;if(screen==='title')start();else if(screen==='playing'&&!paused){if(controlIntro)finishControls();else if(!dockLeft)game.flap();}}
});
document.addEventListener('keyup',e=>{pressed.delete(e.code);if(leftPointer===null)updateDirection();});
// Click supports accessibility activation; physical pointer taps already flap on down.
$('flap').onclick=e=>{if(!transition.busy&&e.detail===0&&screen==='playing'&&!paused){if(controlIntro)finishControls();else if(!dockLeft)game.flap();}};
function background(){audio.suspend();if(!paused&&(game.state==='playing'||game.state==='ending'))pause();clearInput();if(ready)processEvents();last=0;accumulator=0;}
window.addEventListener('blur',background);
$('mode-normal').onclick=()=>selectMode('normal');$('mode-hard').onclick=()=>selectMode('hard');$('start').onclick=start;$('retry').onclick=start;$('home').onclick=home;$('quit').onclick=home;$('pause').onclick=pause;$('resume').onclick=resume;
function soundLabel(){$('sound').textContent=audio.enabled?'♪':'♪̸';$('sound').setAttribute('aria-label',audio.enabled?'音をオフにする':'音をオンにする');}
$('sound').onclick=()=>{audio.unlock();audio.enabled=!audio.enabled;settings.muted=!audio.enabled;settings.save();audio.music(screen==='playing'&&!paused);soundLabel();};
$('records').onclick=()=>{show('records-screen');$('record-list').replaceChildren();if(!storage.data.runs.length){const li=document.createElement('li');li.textContent='NO RUNS YET';$('record-list').append(li);}storage.data.runs.forEach((run,i)=>{const li=document.createElement('li'),a=document.createElement('b'),b=document.createElement('span');a.textContent=`${String(i+1).padStart(2,'0')} / ${run.score.toLocaleString()}`;b.textContent=`${run.rescued} RESCUED`;li.append(a,b);$('record-list').append(li);});};$('close-records').onclick=home;
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();last=0;accumulator=0;});
window.addEventListener('resize',orientationUI);
window.addEventListener('pagehide',event=>{background();analytics.pageHide(game,event.persisted);});
window.addEventListener('pageshow',event=>{if(event.persisted){last=0;accumulator=0;orientationUI();}});
$('boot-retry').onclick=()=>location.reload();
initializeAnalytics();
function frame(now){const dt=Math.min(.06,(now-(last||now))/1000);last=now;
  if(!document.hidden&&!audio.suspended&&!paused&&!transition.busy&&controlIntro){controlIntro=Math.max(.001,controlIntro-dt);if(controlIntro<=.001)finishControls();}
  if(!document.hidden&&!audio.suspended&&!paused&&!transition.busy&&dockLeft){dockLeft=Math.max(0,dockLeft-dt);if(!dockLeft){game.flap();accumulator=0;}}
  if(!document.hidden&&!audio.suspended&&!paused&&!transition.busy&&!controlIntro&&!dockLeft){accumulator+=dt;while(accumulator>=1/120){game.update(1/120);accumulator-=1/120;}processEvents();if(tutorialLeft>0){tutorialLeft-=dt;if(tutorialLeft<=0)$('tutorial').hidden=true;}if(toastLeft>0){toastLeft-=dt;if(toastLeft<=0)$('toast').hidden=true;}}
  hud();audio.setRainbow(game.state==='playing'&&game.rainbow.active);audio.music(game.state==='playing'&&!paused&&!transition.busy);renderer.draw(game,dt,screen==='title'||screen==='records-screen',paused||transition.busy||controlIntro>0||dockLeft>0);requestAnimationFrame(frame);
}
try{const [heroImage,friendImages,art,flapFrames]=await Promise.all([loadImage(hero.src),Promise.all(friends.map(f=>loadImage(f.src))),Promise.all(Object.entries(stage.art).map(async([key,src])=>[key,await loadImage(src)])),Promise.all(hero.frames.map(loadImage))]);renderer=new Renderer($('canvas'),{hero:heroImage,flapFrames,friends:friendImages,...Object.fromEntries(art)},stage);ready=true;renderer.snap(game);show('title');soundLabel();requestAnimationFrame(frame);await Promise.all([$('boot-logo').decode(),new Promise(resolve=>setTimeout(resolve,Math.max(0,1800-(performance.now()-bootStarted))))]);bootComplete=true;$('boot-screen').hidden=true;$('loading').hidden=true;orientationUI();}catch(error){audio.suspend();ready=false;bootComplete=false;$('boot-screen').hidden=false;$('boot-status').textContent='LOAD FAILED';$('boot-retry').hidden=false;console.error(error);}
