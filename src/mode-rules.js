import {SKILL_REQUIREMENTS} from './skills.js';
// Keep the explanation inside the game surface so portrait rotation also applies.
export function setupModeRules(getMode){
 const trigger=document.getElementById('mode-rule');
 const panel=document.createElement('section');
 panel.id='mode-rules';panel.hidden=true;panel.className='mode-rules-overlay modal-screen';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mode-rules-title');
 panel.innerHTML=`<div class="mode-rules-card"><header><h2 id="mode-rules-title">モード別ルール</h2></header>
 <div class="mode-rules-body" tabindex="0">
 <div class="mode-rules-common"><div class="rules-delivery" aria-hidden="true"><img src="./Asset/cast/pink.png" alt=""><span>→</span><img src="./Asset/stage/checkpoint-cosmii.png" alt=""></div><strong>HOMEへ届けて1匹＝1点<small class="rules-skill-hint">技：ピンク${SKILL_REQUIREMENTS[0]}・水色${SKILL_REQUIREMENTS[1]}・赤${SKILL_REQUIREMENTS[2]}・紫${SKILL_REQUIREMENTS[3]}匹で発動！使うたびに+1匹</small><small class="rules-area-hint">HOMEへ3回帰るごとにエリアが進む：そら→ゆうやけ→ネオン→うちゅう</small></strong></div>
 <div class="mode-rules-columns">
 <article data-mode="normal"><h3>NORMAL <span class="rules-hearts" role="img" aria-label="ライフ3つ"><img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt=""><img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt=""><img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt=""></span></h3>
 <div class="rules-normal-hit"><img src="./Asset/cast/green.png" alt="主人公"><span>が障害物にぶつかる → <strong><img class="ui-icon rules-heart" src="./Asset/ui/life/full.png" alt="ライフ">−1</strong></span></div>
 <p>仲間だけに当たる → 仲間が離れる<br>ライフが<strong>0で終了</strong></p>
 <small class="rules-note rules-protection">バナナ・紙・シャボン玉・雲・ジュースはダメージなし<br>すり抜け・ガード・フィーバー中は安全</small>
 </article>
 <article data-mode="hard"><h3>HARD <small>スリルを楽しむ</small></h3>
 <p class="rules-danger">仲間0で<strong>ぶつかると終了</strong></p>
 <div class="rules-hazards">${[['fork','フォーク'],['knife','ナイフ'],['lightning','雷'],['ironball','鉄球'],['spikeball','トゲ球'],['rocket','ロケット']].map(([id,name])=>`<img src="./Asset/objects/${id}.png" alt="${name}" title="${name}">`).join('')}</div>
 <small class="rules-note">この6種類は<strong>主人公に直撃で終了</strong><br>すり抜け・ガード中は防げる！</small>
 </article></div>
 </div></div><button type="button" class="mode-rules-close back-button" aria-label="ホームにもどる"><small>もどる</small></button>`;
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
