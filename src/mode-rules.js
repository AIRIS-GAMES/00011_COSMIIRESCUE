import {rulesHtml} from './rules-content.js';
// Keep the explanation inside the game surface so portrait rotation also applies.
export function setupModeRules(getMode){
 const trigger=document.getElementById('mode-rule');
 const panel=document.createElement('section');
 panel.id='mode-rules';panel.hidden=true;panel.className='mode-rules-overlay modal-screen';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mode-rules-title');
 panel.innerHTML=`<div class="mode-rules-card"><header><h2 id="mode-rules-title">ルール</h2></header>
 <div class="mode-rules-body" tabindex="0">${rulesHtml()}</div></div><button type="button" class="mode-rules-close back-button" aria-label="ホームにもどる"><small>もどる</small></button>`;
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
