const instructions=[
 ['左で、左右に動こう','左のスティックを左右へ動かしてね。',1],
 ['右をタップして飛ぼう','右の↑をタップ！ くり返すと高く飛べるよ。',2],
 ['仲間にふれて集めよう','ピンクのコスミーを3匹つれていこう！',3],
 ['わっかを通ると救出成功！','右へ飛び続けて、わっかの真ん中を通ろう。',3],
 ['顔ボタンを押してみよう','ピンクは3匹で技が使えるよ。顔をタップ！',4],
 ['鉄球をすりぬけよう！','5秒以内に、右へ飛んで鉄球の中を通ろう！',4],
 ['20匹あつめると…？','20匹いっしょにわっかへ届けよう。続きは本番で！',5]
];
export class RescueTutorial {
 constructor({start,title}){
  this.root=document.createElement('section');this.root.id='practice-guide';this.root.hidden=true;this.root.className='practice-guide';
  this.root.innerHTML='<div class="practice-spot" aria-hidden="true"><span class="practice-finger">👆</span></div><div class="practice-copy" aria-live="polite"><small id="practice-progress"></small><h2 id="practice-title"></h2><p id="practice-text"></p><span id="practice-help"></span></div><button id="tutorial-title" class="back-button" type="button" aria-label="練習を終了してホームにもどる"><span aria-hidden="true">↩</span><small>もどる</small></button><div class="practice-actions"><button id="tutorial-start" type="button" hidden>本番であそぶ ▶</button></div>';
  document.getElementById('game').append(this.root);this.root.querySelector('#tutorial-title').onclick=title;this.root.querySelector('#tutorial-start').onclick=start;this.lastStep=-1;this.spot=this.root.querySelector('.practice-spot');
 }
 pointElement(selector){
  const node=document.querySelector(selector);if(!node||node.hidden)return null;
  const r=node.getBoundingClientRect(),base=this.root.getBoundingClientRect(),rotated=document.documentElement.classList.contains('landscape-auto');
  return rotated?{x:(r.top+r.height/2-base.top)/base.height*this.root.clientWidth,y:(base.right-r.left-r.width/2)/base.width*this.root.clientHeight,w:r.height/base.height*this.root.clientWidth,h:r.width/base.width*this.root.clientHeight}:{x:(r.left+r.width/2-base.left)/base.width*this.root.clientWidth,y:(r.top+r.height/2-base.top)/base.height*this.root.clientHeight,w:r.width/base.width*this.root.clientWidth,h:r.height/base.height*this.root.clientHeight};
 }
 update(game,screen,renderer){
  const visible=game.isTraining&&screen==='playing';this.root.hidden=!visible;if(!visible)return;
  const step=game.practiceStep,done=step===6;this.root.dataset.step=step;this.root.classList.toggle('practice-complete',done);
  const pad=document.documentElement.classList.contains('controller-connected');
  if(this.lastStep!==step||this.lastPad!==pad){this.lastStep=step;this.lastPad=pad;const copy=pad&&step===0?['左右に動こう','左スティックか十字キーを左右へ。']:pad&&step===1?['Aボタンで飛ぼう','Aをくり返し押すと高く飛べるよ。']:pad&&step===4?['Xボタンで技を使おう','LB/RBでピンクを選んで、Xで発動！']:instructions[step];this.root.querySelector('#practice-progress').textContent='練習 '+instructions[step][2]+' / 5';this.root.querySelector('#practice-title').textContent=copy[0];this.root.querySelector('#practice-text').textContent=copy[1];this.root.querySelector('#tutorial-start').hidden=!done;if(done)this.root.querySelector('#tutorial-start').focus();}
  this.root.querySelector('#practice-help').textContent=step===0?'左 '+(game.leftDone?'✓':'←')+'　右 '+(game.rightDone?'✓':'→'):step===2?game.carry.length+' / 3匹':step===4?(game.skillRetries?'もう一度！ 技を押してから右へ飛ぼう':'次は、目の前の鉄球を通り抜けるよ'):'';
  let point;if(step===0)point=this.pointElement('#direction-pad');else if(step===1)point=this.pointElement('#flap');else if(step===4)point=this.pointElement('#skill-bar button[data-kind="0"]');
  else if(renderer){const target=step===2?game.friends[0]:step===5?game.obstacles[0]:game.stage.home;const p=step===6?{x:renderer.width/2,y:30}:target?renderer.worldToScreen(target.x,target.y):null;if(p)point={x:p.x/renderer.width*this.root.clientWidth,y:p.y/renderer.height*this.root.clientHeight,w:step===6?184/renderer.width*this.root.clientWidth:(step===3||step===5)?130*renderer.zoom/renderer.width*this.root.clientWidth:58,h:step===6?42/renderer.height*this.root.clientHeight:(step===3||step===5)?130*renderer.zoom/renderer.height*this.root.clientHeight:58};}
  this.spot.hidden=!point||!!game.skillCutin;if(point){point.x=Math.max(point.w/2+10,Math.min(this.root.clientWidth-point.w/2-10,point.x));point.y=Math.max(point.h/2+10,Math.min(this.root.clientHeight-point.h/2-10,point.y));this.spot.style.left=point.x+'px';this.spot.style.top=point.y+'px';this.spot.style.width=point.w+12+'px';this.spot.style.height=point.h+12+'px';}
 }
}
