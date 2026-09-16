import {COLLABORATION_IMAGES,collaborationAssetsNeeded} from './collaboration.js';

// DOM is created only for a configured campaign. No artwork edits or character speech.
export class CollaborationUI {
  constructor(game){this.game=game;this.loaded=false;}
  async loadImages(loadImage){
    if(!collaborationAssetsNeeded(this.game.collaborationConfig,this.game.now()))return [];
    const images=await Promise.all(COLLABORATION_IMAGES.map(loadImage));
    const title=document.createElement('button');title.type='button';title.className='collaboration-title';title.hidden=true;
    title.innerHTML='<span>期間限定コラボ</span><strong>おっ！サン × COSMII RESCUE!</strong><small>コラボ内容を見る ↗</small>';
    const titleImage=document.createElement('img');titleImage.src=COLLABORATION_IMAGES[0];titleImage.alt='';titleImage.setAttribute('aria-hidden','true');title.prepend(titleImage);
    title.setAttribute('aria-haspopup','dialog');title.setAttribute('aria-controls','collaboration-details');
    document.getElementById('title').append(title);this.title=title;
    const modal=document.createElement('div');modal.id='collaboration-details';modal.className='overlay modal-screen collaboration-details';modal.hidden=true;
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','collaboration-details-heading');
    modal.innerHTML='<section class="panel"><h2 id="collaboration-details-heading">おっ！サン コラボ</h2><p class="collaboration-lead">おっ！サンを集めてフィーバー！</p><div class="collaboration-description"><img alt="おっ！サン"><ol><li>おっ！サンに触れて、HOMEへ届けよう！</li><li class="collaboration-rule"></li><li>無敵＆ビームで障害物をこわそう！<br>おっ！サンもたくさん登場！</li></ol></div><small class="collaboration-modal-credit">© SUN-TV</small><button type="button" class="primary collaboration-close">わかった！</button></section>';
    modal.querySelector('img').src=COLLABORATION_IMAGES[0];
    modal.querySelector('.collaboration-rule').textContent=`合計${this.game.collaboration.target}体届けると、${this.game.collaboration.seconds}秒間フィーバー！`;
    document.getElementById('game').append(modal);this.modal=modal;
    const close=modal.querySelector('.collaboration-close');
    title.onclick=()=>{modal.hidden=false;close.focus();};close.onclick=()=>this.close();
    modal.addEventListener('click',e=>{if(e.target===modal)this.close();});
    document.addEventListener('keydown',e=>{
      if(modal.hidden)return;
      // Keep title shortcuts from starting a run behind the explanation.
      e.stopImmediatePropagation();
      if(e.key==='Escape'){e.preventDefault();this.close();}
      if(e.key==='Tab'){e.preventDefault();close.focus();}
    },true);
    const result=document.createElement('div');result.className='collaboration-result';result.hidden=true;
    const img=document.createElement('img');img.src=COLLABORATION_IMAGES[6];img.alt='おっ！サン';
    const label=document.createElement('span');result.append(img,label);
    document.querySelector('#result .panel').prepend(result);this.result=result;this.resultLabel=label;
    const credit=document.createElement('span');credit.className='collaboration-credit';credit.textContent='© SUN-TV';credit.hidden=true;
    document.getElementById('game').append(credit);this.credit=credit;this.loaded=true;
    this.labels=[
      [document.querySelector('#result .rescued-head span'),'FRIENDS<br>RESCUED'],
      [document.querySelector('#result .result-stats>div:nth-child(2)>span'),'RESCUED FRIENDS'],
    ].filter(([node])=>node).map(([node,value])=>({node,value,original:node.innerHTML}));
    return images;
  }
  close(){if(!this.modal||this.modal.hidden)return;this.modal.hidden=true;if(!this.title.hidden)this.title.focus();}
  show(screen){if(screen!=='title')this.close();this.update(screen);}
  update(screen){
    if(screen==='title'||screen==='records-screen')this.game.collaboration.refresh();
    if(!this.loaded)return;
    const active=this.game.collaboration.enabled;
    if(this.lastActive!==active){
      this.title.hidden=!active;this.result.hidden=!active;this.credit.hidden=!active;
      if(!active)this.close();
      document.getElementById('game').classList.toggle('collaboration-on',active);
      for(const {node,value,original} of this.labels)node.innerHTML=active?value:original;
      this.lastActive=active;
    }
    if(screen==='result'&&this.lastDelivered!==this.game.collaboration.delivered){
      this.lastDelivered=this.game.collaboration.delivered;
      this.resultLabel.textContent=`おっ！サン救出数 ${this.lastDelivered}体`;
    }
  }
}
