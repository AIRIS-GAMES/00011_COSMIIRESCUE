import {hero,friends} from './characters.js';
import {characterNames} from './character-profiles.js';
import {socialLinks} from './community-config.js';
import {characterProfiles} from './character-profiles.js';
import {characterCollection,collectibleItems,CollectionVisit} from './collection.js';

const cast=[hero,...friends];
// Preview cards only: never added to collectibleItems, spawning or saved progress.
const itemTeasers=['banana','pancakes','drink','ufo','rocket','blocks'];
const el=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text)node.textContent=text;return node;};
const portrait=(character,cls='')=>{const img=el('img',cls);img.src=character.src;img.alt=characterNames[character.id]+'コスミー';return img;};
export class CommunityUI {
 constructor(show,options={}){
  this.options=options;this.show=show;this.selected='green';
  this.root=el('section','overlay modal-screen community-screen');this.root.id='community-screen';this.root.hidden=true;
  this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-labelledby','community-heading');
  document.getElementById('game').append(this.root);
  const nav=el('nav','community-entry');nav.setAttribute('aria-label','キャラクターとSNS');
  for(const [label,mode,icon] of [['コレクションずかん','characters','▤'],['SNS・LINEスタンプ','social','♡']]){
   const b=el('button','');b.type='button';b.id=`open-${mode}`;b.append(el('span','entry-icon',icon),el('span','',label),el('span','entry-arrow','›'));b.onclick=()=>this.open(mode,b);nav.append(b);
  }
  const title=document.getElementById('title');title.append(nav);
  const group=el('div','title-cast');group.setAttribute('aria-hidden','true');cast.forEach(c=>group.append(portrait(c)));title.append(group);
  title.querySelector('.title-kicker').textContent='BETTER TOGETHER!';
  title.querySelector('.title-footer').remove();
  this.root.addEventListener('keydown',event=>{
   if(event.code==='Escape'){event.preventDefault();event.stopPropagation();this.close();}
   if(event.key==='Tab'){
    const items=[...this.root.querySelectorAll('button:not(:disabled),a[href]')],first=items[0],last=items.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  });
 }
 close(){document.querySelector('.hud').inert=false;if(this.returnTo)this.returnTo();else this.show('title');if(this.opener?.isConnected)this.opener.focus();}
 measure(name,data={}){this.options.measure?.(name,{source:this.source,...data});}
 open(mode,opener,options={}){
  this.visit=new CollectionVisit((name,data)=>this.measure(name,data));this.opener=opener;this.returnTo=options.returnTo;this.source=options.source||'title';if(options.character&&cast.some(c=>c.id===options.character))this.selected=options.character;this.measure(mode==='characters'?'encyclopedia_open':'social_open');this.root.replaceChildren();this.root.dataset.mode=mode;
  const header=el('header','community-header'),heading=el('h2','',mode==='characters'?'キャラクターずかん':'SNS・LINEスタンプ');heading.id='community-heading';
  const close=el('button','community-back','×');close.type='button';close.setAttribute('aria-label',this.returnTo?'前の画面へ戻る':'タイトルへ戻る');close.onclick=()=>this.close();header.append(heading,close);
  const body=el('div','community-body');this.root.append(header,body);
  if(mode==='characters'){
   const tabs=el('nav','collection-tabs');tabs.setAttribute('aria-label','図鑑の種類');
   const render=tab=>{body.replaceChildren();body.className='community-body';for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));heading.textContent=tab==='characters'?'キャラクターずかん':'アイテムずかん';if(tab==='characters')this.characters(body);else this.items(body);};
   for(const [tab,label] of [['characters','キャラクター'],['items','アイテム']]){const button=el('button','',label);button.type='button';button.dataset.tab=tab;button.onclick=()=>render(tab);tabs.append(button);}
   header.after(tabs);render('characters');
  }else this.social(body);
  this.root.append(el('footer','community-footer','✧　COSMII RESCUE!　✧'));this.show('community-screen');document.querySelector('.hud').inert=true;close.focus();
 }
 characters(body){
  body.classList.add('encyclopedia');
  const profile=el('article','character-profile');profile.setAttribute('aria-live','polite');
  const title=el('h3','character-name'),art=el('div','character-art'),description=el('p','character-description');const details=el('div','character-details');profile.append(title,art,description,details);
  const side=el('aside','character-selector'),grid=el('div','character-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','紹介するキャラクター');side.append(grid,el('p','roster-caption','✦ コスミーとなかまたち ✦'));body.append(profile,side);
  const select=(id,trigger='initial')=>{
   const collection=characterCollection(id,this.options.progress?.data),info=characterProfiles[id];
   this.visit.show(id,collection,trigger);profile.classList.toggle('locked-profile',!collection.unlocked);
   this.selected=id;title.textContent=characterNames[id]+'コスミー';description.textContent=collection.unlocked?info.summary:'仲間と帰還して、プロフィールを開放しよう。';
   art.replaceChildren(portrait(cast.find(c=>c.id===id),collection.unlocked?'character-main':'character-main locked-portrait'));
   for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.character===id));
   details.replaceChildren();
   const goal=id==='green'?'最初から見られる仲間':collection.achieved?`★ ${characterNames[id]}の仲間と${collection.required}体帰還・プロフィール開放`:`プロフィール開放まであと${Math.max(0,collection.required-collection.count)}体（${collection.count} / ${collection.required}）`;
   details.append(el('p','collection-progress',goal));
   if(!collection.unlocked){details.append(el('p','basic-condition',`同じ色の仲間を累計${collection.required}体HOMEへ届けると、プロフィールを見られます。`));profile.scrollTop=0;return;}
   for(const [label,text] of [['性格',info.personality],['身体の特徴',info.ability],['仲間との関係',info.relation]])details.append(el('h4','',label),el('p','',text));
   const outer={returnTo:this.returnTo,source:this.source,character:id},opener=this.opener;
   const sns=el('button','community-detail-button','SNS・LINEスタンプを見る');sns.type='button';sns.onclick=()=>this.open('social',null,{source:'encyclopedia',character:id,returnTo:()=>this.open('characters',opener,outer)});details.append(sns);
   const item=socialLinks.find(l=>l.id==='line');let direct;try{direct=new URL(item?.characterUrls?.[id]);if(direct.protocol!=='https:')direct=null;}catch{}
   if(direct){const a=el('a','character-sticker','この子のスタンプを見る ↗');a.href=direct.href;a.target='_blank';a.rel='noopener noreferrer';a.onclick=()=>this.measure('external_click',{source:'encyclopedia',destination:'line',characterType:id});details.append(a);}
   profile.scrollTop=0;
  };
  cast.forEach(c=>{const collection=characterCollection(c.id,this.options.progress?.data),b=el('button','character-card');b.type='button';b.dataset.character=c.id;b.dataset.locked=String(!collection.unlocked);b.setAttribute('aria-label',characterNames[c.id]+'コスミー'+(collection.unlocked?'':'（紹介）'));b.append(portrait(c),el('span','',characterNames[c.id]+(collection.achieved&&c.id!=='green'?' ★':'')));b.onclick=()=>select(c.id,'select');grid.append(b);});
  select(this.selected);
 }
 items(body){
  body.classList.add('item-collection');
  const grid=el('div','item-grid');body.append(grid);
  for(const item of collectibleItems){
   const count=this.options.progress?.data.items?.[item.id]||0,card=el('article','item-card');card.dataset.item=item.id;card.dataset.collected=String(count>0);
   const image=el('img',count?'':'locked-portrait');image.src=item.src;image.alt=count?item.name:'未入手のアイテム';
   card.append(image,el('h3','',count?item.name:'？？？'),el('p','item-count',count?`集めた数：${count}個`:'まだ見つけていません'),el('p','',count?item.description:'飛行中の「ひろう」マークを探してみよう。'));grid.append(card);
  }
  for(const id of itemTeasers){
   const card=el('article','item-card item-teaser');card.dataset.preview=id;
   const image=el('img','locked-portrait');image.src=`./Asset/objects/${id}.png`;image.alt='未公開アイテムのシルエット';
   card.append(image,el('h3','','？？？'),el('p','item-count','これからのお楽しみ'),el('p','item-teaser-note','COMING SOON'));grid.append(card);
  }
 }
 social(body){
  body.classList.add('social-body');body.append(el('p','community-intro','ゲームの外でも、コスミーといっしょに。'));
  const panels=el('div','social-panels'),sns=el('section','social-panel'),line=el('section','social-panel');sns.append(el('h3','','公式SNS'));line.append(el('h3','','LINEスタンプ'));panels.append(sns,line);body.append(panels);
  const group=el('div','social-cast');cast.forEach(c=>group.append(portrait(c)));sns.append(group);
  const links=el('div','social-links');sns.append(links);
  const addLink=(parent,id,label,icon)=>{
   const item=socialLinks.find(l=>l.id===id);let url;try{url=new URL(item?.url);if(url.protocol!=='https:')url=null;}catch{}
   const link=el(url?'a':'button','social-link '+id);if(url){link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',label+'（外部サイトを開く）');link.onclick=()=>this.measure('external_click',{destination:id,characterType:this.source==='encyclopedia'?this.selected:'group'});}else{link.type='button';link.disabled=true;}
   const mark=el('span','social-icon',item?.iconSrc?'':icon);mark.setAttribute('aria-hidden','true');
   if(item?.iconSrc){mark.classList.add('social-logo');const img=el('img');img.src=item.iconSrc;img.alt='';mark.append(img);}
   link.append(mark,el('span','social-label',label),el('span','social-status',url?'↗':'準備中'));parent.append(link);
  };
  addLink(links,'tiktok','TikTokをチェック','♪');addLink(links,'instagram','Instagramをチェック','◎');addLink(links,'x','Xをチェック','𝕏');
  const previews=el('div','sticker-previews'),preview=el('img','sticker-sheet');preview.src=socialLinks.find(link=>link.id==='line').previewSrc;preview.alt='コスミーのLINEスタンプ：ありがとう、すき、了解！';previews.append(preview);line.append(previews,el('small','sticker-caption','スタンプのイメージ'));
  const store=el('div','social-links');line.append(store);addLink(store,'line','LINE STOREで見る','LINE');
  body.append(el('p','external-note','リンクは外部サイトで開きます。準備中のリンクは公開後にご案内します。'));
 }
}
