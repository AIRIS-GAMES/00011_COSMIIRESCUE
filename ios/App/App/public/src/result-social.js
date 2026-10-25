import {socialLinks} from './community-config.js';
import {hero} from './characters.js';

export class ResultSocialPopup {
 constructor(measure){
  this.measure=measure;this.root=document.createElement('section');this.root.id='result-social-popup';this.root.className='overlay modal-screen result-social-popup';this.root.hidden=true;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-labelledby','result-social-heading');
  this.root.innerHTML='<div class="result-social-card"><button type="button" class="result-social-close" aria-label="閉じて結果を見る">×</button><header><img alt=""/><div><h2 id="result-social-heading">ゲームの外でも、コスミーと。</h2><p>公式SNSとLINEスタンプをチェック！</p></div></header><nav aria-label="公式SNSとLINEスタンプ"></nav><p class="result-social-note">リンクは外部サイトで開きます。</p><button type="button" class="result-social-back">結果を見る</button></div>';
  this.root.querySelector('header img').src=hero.src;
  const nav=this.root.querySelector('nav');
  for(const id of ['x','instagram','tiktok','line']){
   const item=socialLinks.find(link=>link.id===id);let url;try{url=new URL(item?.url);if(url.protocol!=='https:')url=null;}catch{}
   const link=document.createElement(url?'a':'button');link.className='result-social-link';
   if(url){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',item.label+'（外部サイトを開く）');link.onclick=()=>this.measure('external_click',{source:'result_popup',destination:id});}
   else{link.type='button';link.disabled=true;}
   if(item?.previewSrc){link.classList.add('has-preview');const img=document.createElement('img');img.src=item.previewSrc;img.alt='ありがとう、すき、了解！のスタンプ見本';link.append(img);}
   else if(item?.iconSrc){const img=document.createElement('img');img.src=item.iconSrc;img.alt='';link.append(img);}
   else{const icon=document.createElement('span');icon.className='result-social-line';icon.textContent='LINE';icon.setAttribute('aria-hidden','true');link.append(icon);}
   const label=document.createElement('span');label.textContent=item?.label||id;const status=document.createElement('small');status.textContent=url?'↗':'準備中';link.append(label,status);nav.append(link);
  }
  this.closeButton=this.root.querySelector('.result-social-close');this.closeButton.onclick=()=>this.close();this.root.querySelector('.result-social-back').onclick=()=>this.close();
  this.root.addEventListener('keydown',e=>{
   e.stopPropagation();if(e.key==='Escape'){e.preventDefault();this.close();}
   if(e.key==='Tab'){const controls=[...this.root.querySelectorAll('button:not(:disabled),a[href]')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  document.getElementById('game').append(this.root);
 }
 open(){if(!this.root.hidden)return;this.root.hidden=false;document.getElementById('result').inert=true;document.querySelector('.hud').inert=true;this.closeButton.focus();this.measure('social_popup_view',{source:'result_popup'});}
 close(){if(this.root.hidden)return;this.root.hidden=true;document.getElementById('result').inert=false;document.querySelector('.hud').inert=false;document.getElementById('retry').focus();this.measure('social_popup_close',{source:'result_popup'});}
}
