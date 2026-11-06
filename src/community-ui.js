import {otherGames} from './other-games.js';
import {RoomCelebration} from './room-celebration.js';
import {FriendRoom} from './friend-room.js';
import {hero,friends} from './characters.js';
import {characterNames} from './character-profiles.js';
import {socialLinks} from './community-config.js';
import {characterProfiles} from './character-profiles.js';
import {characterCollection,collectibleItems,CollectionVisit} from './collection.js';
import {TREAT,TRUST_BONUS} from './missions.js';
import {icon,iconEl} from './icons.js';
import {t as _t} from './i18n.js';

const cast=[hero,...friends];
// Preview cards only: never added to collectibleItems, spawning or saved progress.
const itemTeasers=['banana','pancakes','drink','ufo','rocket','blocks'];
const el=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text)node.textContent=text;return node;};
const portrait=(character,cls='')=>{const img=el('img',cls);img.src=character.src;img.alt=characterNames[character.id]+_t('コスミー');return img;};
export class CommunityUI {
 constructor(show,options={}){
  this.options=options;this.show=show;this.selected='green';
  this.root=el('section','overlay modal-screen community-screen');this.root.id='community-screen';this.root.hidden=true;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-labelledby','community-heading');
  document.getElementById('game').append(this.root);
  const nav=el('nav','community-entry');nav.setAttribute('aria-label',_t('ホームメニュー'));
  for(const [label,mode] of [[_t('ミッション'),'missions'],[_t('ふれあい'),'room'],[_t('ずかん'),'characters'],['SNS','social'],[_t('ほかのゲーム'),'games']]){
   const b=el('button','');b.type='button';b.id=`open-${mode}`;const image=el('img','menu-icon');image.src='./Asset/ui/menu/'+mode+'.png';image.alt='';b.append(image,el('span','menu-label',label));b.setAttribute('aria-label',mode==='characters'?_t('コレクションずかん'):mode==='social'?_t('SNS・LINEスタンプ'):label);b.onclick=()=>this.open(mode,b);if(mode==='missions'){const badge=el('span','mission-badge');badge.hidden=true;badge.setAttribute('aria-hidden','true');b.append(badge);this.missionButton=b;}nav.append(b);
  }
  const title=document.getElementById('title');title.append(nav);
  const group=el('div','title-cast');group.setAttribute('aria-hidden','true');cast.forEach(c=>group.append(portrait(c)));title.append(group);
  title.querySelector('.title-kicker').textContent='BETTER TOGETHER!';
  title.querySelector('.title-footer').remove();
  this.root.addEventListener('keydown',event=>{
   if(event.code==='Escape'){event.preventDefault();event.stopPropagation();this.close();}
   if(event.key==='Tab'){
    const items=[...this.root.querySelectorAll('button:not(:disabled),a[href]')].filter(el=>!el.closest('[inert]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'),first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  });
 }
 close(){this.returnCelebration?.destroy();this.returnCelebration=null;this.friendRoom?.destroy();document.querySelector('.hud').inert=false;if(this.returnTo)this.returnTo();else this.show('title');if(this.opener?.isConnected)this.opener.focus();}
 measure(name,data={}){this.options.measure?.(name,{source:this.source,...data});}
 open(mode,opener,options={}){
  this.returnCelebration?.destroy();this.returnCelebration=null;this.friendRoom?.destroy();this.friendRoom=null;
  this.visit=new CollectionVisit((name,data)=>this.measure(name,data));this.opener=opener;this.returnTo=options.returnTo;this.source=options.source||'title';if(options.character&&cast.some(c=>c.id===options.character))this.selected=options.character;if(!['room','returns'].includes(mode))this.measure(mode==='games'?'games_open':mode==='characters'?'encyclopedia_open':mode==='missions'?'missions_open':'social_open');this.root.replaceChildren();this.root.dataset.mode=mode;
  const header=el('header','community-header'),heading=el('h2','',mode==='missions'?_t('きょうのミッション'):mode==='games'?_t('ほかのゲーム'):mode==='returns'?_t('累計帰還'):mode==='room'?_t('ふれあい'):mode==='characters'?_t('キャラクターずかん'):_t('SNS・LINEスタンプ'));heading.id='community-heading';
  const close=el('button','community-back back-button');close.innerHTML=_t('<small>もどる</small>');close.type='button';close.setAttribute('aria-label',this.returnTo?_t('前の画面へ戻る'):_t('タイトルへ戻る'));close.onclick=()=>this.close();header.append(heading);
  const body=el('div','community-body');this.root.append(header,body,close);
  if(mode==='returns'){
   this.measure('returns_open');
   this.options.progress?.load();header.hidden=true;body.hidden=true;this.returnCelebration=new RoomCelebration(this.root,this.options.progress?.totalReturned||0,this.options.progress?.data.counts,()=>this.close());this.returnCelebration.root.querySelector('.return-close').setAttribute('aria-label',_t('ホームにもどる'));
  }else if(mode==='characters'){
   const tabs=el('nav','collection-tabs');tabs.setAttribute('aria-label',_t('図鑑の種類'));
   const render=tab=>{body.replaceChildren();body.className='community-body';for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));heading.textContent=tab==='characters'?_t('キャラクターずかん'):_t('アイテムずかん');if(tab==='characters')this.characters(body);else this.items(body);};
   for(const [tab,label] of [['characters',_t('キャラクター')],['items',_t('アイテム')]]){const button=el('button','',label);button.type='button';button.dataset.tab=tab;button.onclick=()=>render(tab);tabs.append(button);}
   header.after(tabs);render('characters');
  }else if(mode==='missions')this.missions(body);else if(mode==='room')this.friendRoom=new FriendRoom(body,this.options.progress,(name,data)=>this.measure(name,data));else if(mode==='games')this.games(body);else this.social(body);
  this.root.append(el('footer','community-footer','✧　COSMII RESCUE!　✧'));this.show('community-screen');document.querySelector('.hud').inert=true;(this.returnCelebration?.root.querySelector('.return-close')||close).focus();
 }
 // Title badge: rewards waiting (number) or today's missions not yet done (dot).
 updateMissionBadge(){const m=this.options.missions,badge=this.missionButton?.querySelector('.mission-badge');if(!m||!badge)return;const ready=m.claimable,left=m.list().filter(x=>!x.done).length;badge.hidden=!ready&&!left;badge.textContent=ready?String(ready):'';badge.dataset.kind=ready?'ready':'new';this.missionButton.setAttribute('aria-label',ready?_t('ミッション（ごほうび{0}こ受け取れる）',[ready]):_t('ミッション（のこり{0}こ）',[left]));}
 missions(body){
  const store=this.options.missions;body.classList.add('missions-body');if(!store)return;
  const render=(message='')=>{
   store.load();const list=store.list(),total=this.options.progress?.totalReturned||0;body.replaceChildren();
   const now=store.now(),midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1),left=Math.max(0,midnight-now),h=Math.floor(left/36e5),mi=Math.floor(left%36e5/6e4);
   const lead=el('p','missions-lead');lead.append(el('span','',_t('毎日3つ。クリアしてごほうびをもらおう！')),el('small','',_t('新しいミッションまで {0}時間{1}分',[h,mi])));body.append(lead);
   const ol=el('ol','mission-list');
   list.forEach((m,i)=>{
    const li=el('li','mission-card');li.dataset.state=m.claimed?'claimed':m.done?'done':'todo';
    const icon=el('img','mission-icon');icon.src=m.icon;icon.alt='';
    const text=el('strong','mission-text',m.text);
    const bar=el('div','mission-progress');bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(m.target));bar.setAttribute('aria-valuenow',String(Math.min(m.progress,m.target)));bar.setAttribute('aria-label',m.text);const fill=el('i');fill.style.width=Math.min(100,m.progress/m.target*100)+'%';bar.append(fill,el('span','',`${Math.min(m.progress,m.target)}/${m.target}`));
    const reward=el('div','mission-reward');const rimg=el('img');rimg.alt='';rimg.src=m.reward.type==='treat'?TREAT.src:'./Asset/ui/trust/badge.png';reward.append(rimg,el('span','',m.reward.label));
    const button=el('button','mission-claim',m.claimed?_t('✓ 受け取った'):m.done?_t('受け取る'):_t('チャレンジ中'));button.type='button';button.disabled=!m.done||m.claimed;
    button.onclick=()=>{const got=store.claim(i,{progress:this.options.progress});if(!got)return;this.measure('mission_claim',{mission:m.id,reward:got.type});render(got.type==='treat'?_t('{0}をもらった！ふれあいの部屋であげられるよ',[TREAT.name]):_t('部屋のみんなの信頼度が+{0}！',[TRUST_BONUS]));};
    li.append(icon,text,bar,reward,button);ol.append(li);
   });
   body.append(ol);
   const bonus=el('div','mission-bonus'),prop=store.nextBonusProp(total),claimedAll=list.every(m=>m.claimed);
   bonus.dataset.state=store.data.bonusClaimed?'claimed':store.bonusReady?'done':'todo';
   const pimg=el('img');pimg.alt='';pimg.src=prop?.src||TREAT.src;
   const label=el('span','',store.data.bonusClaimed?_t('今日のボーナスは受け取ったよ。また明日！'):prop?_t('3つ全部でボーナス：家具「{0}」を今すぐ開放',[prop.name]):_t('3つ全部でボーナス：{0} ×2',[TREAT.name]));
   const claim=el('button','mission-claim',store.data.bonusClaimed?_t('✓ 受け取った'):claimedAll?_t('受け取る'):`${list.filter(m=>m.claimed).length}/3`);claim.type='button';claim.disabled=!store.bonusReady;
   claim.onclick=()=>{const got=store.claimBonus(total);if(!got)return;this.measure('mission_bonus',{reward:got.type,streak:store.data.streak});render(got.type==='furniture'?_t('家具「{0}」を開放！ふれあいの「もようがえ」で置けるよ',[got.prop.name]):_t('{0}を2こもらった！',[TREAT.name]));};
   bonus.append(pimg,label,claim);body.append(bonus);
   const status=el('p','missions-status',message);status.setAttribute('role','status');const treats=el('span','missions-treats');treats.innerHTML=`<img src="${TREAT.src}" alt=""> ${TREAT.name} ×${store.data.treats}`;status.prepend(treats);body.append(status);
   this.updateMissionBadge();
  };
  render();
 }
 characters(body){
  body.classList.add('encyclopedia');
  const profile=el('article','character-profile');profile.setAttribute('aria-live','polite');
  const title=el('h3','character-name'),art=el('div','character-art'),description=el('p','character-description');const details=el('div','character-details');profile.append(title,art,description,details);
  const side=el('aside','character-selector'),grid=el('div','character-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label',_t('紹介するキャラクター'));side.append(grid,el('p','roster-caption',_t('✦ コスミーとなかまたち ✦')));body.append(profile,side);
  const select=(id,trigger='initial')=>{
   const collection=characterCollection(id,this.options.progress?.data),info=characterProfiles[id];
   this.visit.show(id,collection,trigger);profile.classList.toggle('locked-profile',!collection.unlocked);
   this.selected=id;title.textContent=characterNames[id]+_t('コスミー');description.textContent=collection.unlocked?info.summary:_t('仲間と帰還して、プロフィールを開放しよう。');
   art.replaceChildren(portrait(cast.find(c=>c.id===id),collection.unlocked?'character-main':'character-main locked-portrait'));
   for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.character===id));
   details.replaceChildren();
   const goal=id==='green'?_t('最初から見られる仲間'):collection.achieved?_t('★ {0}の仲間と{1}体帰還・プロフィール開放',[characterNames[id],collection.required]):_t('プロフィール開放まであと{0}体（{1} / {2}）',[Math.max(0,collection.required-collection.count),collection.count,collection.required]);
   details.append(el('p','collection-progress',goal));
   if(!collection.unlocked){details.append(el('p','basic-condition',_t('同じ色の仲間を累計{0}体HOMEへ届けると、プロフィールを見られます。',[collection.required])));profile.scrollTop=0;return;}
   for(const [label,text] of [[_t('性格'),info.personality],[_t('身体の特徴'),info.ability],[_t('仲間との関係'),info.relation]])details.append(el('h4','',label),el('p','',text));
   const outer={returnTo:this.returnTo,source:this.source,character:id},opener=this.opener;
   const sns=el('button','community-detail-button',_t('SNS・LINEスタンプを見る'));sns.type='button';sns.onclick=()=>this.open('social',null,{source:'encyclopedia',character:id,returnTo:()=>this.open('characters',opener,outer)});details.append(sns);
   const item=socialLinks.find(l=>l.id==='line');let direct;try{direct=new URL(item?.characterUrls?.[id]);if(direct.protocol!=='https:')direct=null;}catch{}
   if(direct){const a=el('a','character-sticker',_t('この子のスタンプを見る '));a.append(iconEl('link'));a.href=direct.href;a.target='_blank';a.rel='noopener noreferrer';a.onclick=()=>this.measure('external_click',{source:'encyclopedia',destination:'line',characterType:id});details.append(a);}
   profile.scrollTop=0;
  };
  cast.forEach(c=>{const collection=characterCollection(c.id,this.options.progress?.data),b=el('button','character-card');b.type='button';b.dataset.character=c.id;b.dataset.locked=String(!collection.unlocked);b.setAttribute('aria-label',characterNames[c.id]+_t('コスミー')+(collection.unlocked?'':_t('（紹介）')));b.append(portrait(c),el('span','',characterNames[c.id]+(collection.achieved&&c.id!=='green'?' ★':'')));b.onclick=()=>select(c.id,'select');grid.append(b);});
  select(this.selected);
 }
 items(body){
  body.classList.add('item-collection');
  const grid=el('div','item-grid');body.append(grid);
  for(const item of collectibleItems){
   const count=this.options.progress?.data.items?.[item.id]||0,card=el('article','item-card');card.dataset.item=item.id;card.dataset.collected=String(count>0);
   const image=el('img',count?'':'locked-portrait');image.src=item.src;image.alt=count?item.name:_t('未入手のアイテム');
   card.append(image,el('h3','',count?item.name:_t('？？？')),el('p','item-count',count?_t('集めた数：{0}個',[count]):_t('まだ見つけていません')),el('p','',count?item.description:_t('飛行中の「ひろう」マークを探してみよう。')));grid.append(card);
  }
  for(const id of itemTeasers){
   const card=el('article','item-card item-teaser');card.dataset.preview=id;
   const image=el('img','locked-portrait');image.src=`./Asset/objects/${id}.png`;image.alt=_t('未公開アイテムのシルエット');
   card.append(image,el('h3','',_t('？？？')),el('p','item-count',_t('これからのお楽しみ')),el('p','item-teaser-note','COMING SOON'));grid.append(card);
  }
 }
 games(body){
  body.classList.add('other-games-body');
  const grid=el('div','other-games-grid');
  for(const game of otherGames){
   const link=el('a','other-game-card');link.href=game.url;link.target='_blank';link.rel='noopener noreferrer';link.dataset.gameId=game.id;
   link.setAttribute('aria-label',game.name+_t('（App Storeで開く）'));
   const image=el('img');image.src=game.iconSrc;image.alt='';image.width=64;image.height=64;
   const details=el('span','other-game-info');const action=el('span','other-game-action',_t('App Storeで見る '));action.append(iconEl('link'));details.append(el('strong','',game.name),action);
   link.append(image,details);link.onclick=()=>this.measure('game_store_click',{gameId:game.id});grid.append(link);
  }
  body.append(grid,el('p','other-games-note',_t('App Storeが開きます')));
 }
 social(body){
  body.classList.add('social-body');body.append(el('p','community-intro',_t('ゲームの外でも、コスミーといっしょに。')));
  const panels=el('div','social-panels'),sns=el('section','social-panel'),line=el('section','social-panel');sns.append(el('h3','',_t('公式SNS')));line.append(el('h3','',_t('LINEスタンプ')));panels.append(sns,line);body.append(panels);
  sns.classList.add('social-accounts');
  const links=el('div','social-links');sns.append(links);
  const addLink=(parent,id,label,icon)=>{
   const item=socialLinks.find(l=>l.id===id);let url;try{url=new URL(item?.url);if(url.protocol!=='https:')url=null;}catch{}
   const link=el(url?'a':'button','social-link '+id);if(url){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',label+_t('（外部サイトを開く）'));link.onclick=()=>this.measure('external_click',{destination:id,characterType:this.source==='encyclopedia'?this.selected:'group'});}else{link.type='button';link.disabled=true;}
   const mark=el('span','social-icon',item?.iconSrc?'':icon);mark.setAttribute('aria-hidden','true');
   if(item?.iconSrc){mark.classList.add('social-logo');const img=el('img');img.src=item.iconSrc;img.alt='';mark.append(img);}
   const status=el('span','social-status',url?'':_t('準備中'));if(url)status.append(iconEl('link'));link.append(mark,el('span','social-label',label),status);parent.append(link);
  };
  addLink(links,'tiktok',_t('TikTokをチェック'),'♪');addLink(links,'instagram',_t('Instagramをチェック'),'◎');addLink(links,'x',_t('Xをチェック'),'𝕏');
  const previews=el('div','sticker-previews'),preview=el('img','sticker-sheet');preview.src=socialLinks.find(link=>link.id==='line').previewSrc;preview.alt=_t('コスミーのLINEスタンプ：ありがとう、すき、了解！');previews.append(preview);line.append(previews,el('small','sticker-caption',_t('スタンプのイメージ')));
  const store=el('div','social-links');line.append(store);addLink(store,'line',_t('LINE STOREで見る'),'LINE');
  body.append(el('p','external-note',_t('リンクは外部サイトで開きます。準備中のリンクは公開後にご案内します。')));
 }
}
