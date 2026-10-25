const instructions=[
 ['左右に動かしてみよう','左のスティック／← →キーで、左と右へ動こう。ここでは高さをキープするよ。'],
 ['タップして上へ飛ぼう','右の↑ボタン／Spaceキーを押して、上昇してみよう。'],
 ['ピンクの仲間を助けよう','右にいる仲間にふれよう。タップをくり返して高さを合わせてね。'],
 ['仲間をリングへ届けよう','右のリングの真ん中を通ろう。仲間はそのままついてくるよ。'],
 ['レスキュー成功！','準備はOK。今度は空にいるたくさんの仲間を助けに行こう！']
];
export class RescueTutorial {
 constructor({start,title}){
  this.root=document.createElement('section');this.root.id='practice-guide';this.root.hidden=true;this.root.className='practice-guide';
  this.root.innerHTML='<div class="practice-copy" aria-live="polite"><small id="practice-progress"></small><h2 id="practice-title"></h2><p id="practice-text"></p><span id="practice-help"></span></div><div class="practice-actions"><button id="tutorial-title" type="button">練習をやめる</button><button id="tutorial-start" type="button" hidden>本番スタート ▶</button></div>';
  document.getElementById('game').append(this.root);this.root.querySelector('#tutorial-title').onclick=title;this.root.querySelector('#tutorial-start').onclick=start;this.lastStep=-1;
 }
 update(game,screen){
  const visible=game.isTraining&&screen==='playing';this.root.hidden=!visible;if(!visible)return;
  const step=game.practiceStep,done=step===4;this.root.classList.toggle('practice-complete',done);
  if(this.lastStep!==step){this.lastStep=step;this.root.querySelector('#practice-progress').textContent=done?'PRACTICE COMPLETE':`練習 ${step+1} / 4 · スコアは記録されません`;this.root.querySelector('#practice-title').textContent=instructions[step][0];this.root.querySelector('#practice-text').textContent=instructions[step][1];this.root.querySelector('#tutorial-start').hidden=!done;if(done)this.root.querySelector('#tutorial-start').focus();}
  this.root.querySelector('#practice-help').textContent=step===0?`左 ${game.leftDone?'✓':'←'}　右 ${game.rightDone?'✓':'→'}`:done?'':game.recoveries?'遠くへ行っても、練習位置に戻って何度でも試せるよ。':'失敗しても大丈夫。ゆっくり練習しよう。';
 }
}
