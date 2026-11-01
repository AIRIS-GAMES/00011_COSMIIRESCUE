// Keep the explanation inside the game surface so portrait rotation also applies.
export function setupModeRules(getMode){
 const trigger=document.getElementById('mode-rule');
 const panel=document.createElement('section');
 panel.id='mode-rules';panel.hidden=true;panel.className='mode-rules-overlay modal-screen';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mode-rules-title');
 panel.innerHTML=`<div class="mode-rules-card"><header><h2 id="mode-rules-title">モード別ルール</h2><button type="button" class="mode-rules-close" aria-label="ルール説明を閉じる">閉じる ×</button></header>
 <div class="mode-rules-body" tabindex="0">
 <div class="mode-rules-common"><div class="rules-delivery" aria-hidden="true"><img src="./Asset/cast/pink.png" alt=""><span>→</span><img src="./Asset/stage/checkpoint-cosmii.png" alt=""></div><strong>HOMEへ届けて1匹＝1点<small class="rules-skill-hint">同じ色3匹 → 顔ボタンで技発動！</small></strong></div>
 <div class="mode-rules-columns">
 <article data-mode="normal"><h3>NORMAL <small>はじめてならこちら</small></h3>
 <div class="rules-hearts" aria-label="ライフ3つ">♥ ♥ ♥</div>
 <p>ライフが<strong>0で終了</strong></p>
 </article>
 <article data-mode="hard"><h3>HARD <small>スリルを楽しむ</small></h3>
 <p class="rules-danger">仲間0で<strong>ぶつかると終了</strong></p>
 <div class="rules-hazards">${[['fork','フォーク'],['knife','ナイフ'],['lightning','雷'],['ironball','鉄球'],['spikeball','トゲ球'],['rocket','ロケット']].map(([id,name])=>`<img src="./Asset/objects/${id}.png" alt="${name}" title="${name}">`).join('')}</div>
 <small class="rules-note">この6種類は<strong>主人公に直撃で終了</strong><br>すり抜け・ガード中は防げる！</small>
 </article></div>
 </div></div>`;
 document.getElementById('game').append(panel);
 const close=panel.querySelector('.mode-rules-close');
 let inertNodes=[];
 const dismiss=()=>{panel.hidden=true;for(const [el,wasInert] of inertNodes)el.inert=wasInert;trigger.focus();};
 trigger.onclick=()=>{
  for(const article of panel.querySelectorAll('[data-mode]'))article.classList.toggle('selected',article.dataset.mode===getMode());
  inertNodes=[...panel.parentElement.children].filter(el=>el!==panel).map(el=>[el,el.inert]);
  for(const [el] of inertNodes)el.inert=true;
  panel.hidden=false;panel.querySelector('.mode-rules-body').scrollTop=0;close.focus();
 };
 close.onclick=dismiss;
 panel.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Escape'){e.preventDefault();dismiss();}
  if(e.key==='Tab'){
   const body=panel.querySelector('.mode-rules-body');
   e.preventDefault();(document.activeElement===close?body:close).focus();
  }
 });
}
