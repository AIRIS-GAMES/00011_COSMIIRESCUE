import {RankingSafety,support,reportReasons} from './ranking-safety.js';
import {t as _t} from './i18n.js';
export class RankingSafetyUI {
 constructor(ui){
  this.ui=ui;this.safety=new RankingSafety(ui.api,ui.auto);
  this.dialog=document.createElement('dialog');this.dialog.className='ranking-safety-dialog';this.dialog.setAttribute('aria-labelledby','ranking-safety-title');
  this.dialog.innerHTML=_t('<section><h2 id="ranking-safety-title"></h2><div class="safety-content"></div><p class="safety-status" role="status"></p><button type="button" class="safety-close">とじる</button></section>');
  document.body.append(this.dialog);this.content=this.dialog.querySelector('.safety-content');this.status=this.dialog.querySelector('.safety-status');
  this.dialog.querySelector('.safety-close').onclick=()=>this.dialog.close();
  this.dialog.addEventListener('cancel',event=>{if(this.busy)event.preventDefault();});
  this.dialog.addEventListener('close',()=>{if(this.fromSettings)this.ui.openEditor(true);else this.ui.refresh.focus({preventScroll:true});});
  for(const type of ['keydown','keyup'])this.dialog.addEventListener(type,e=>e.stopPropagation());
  const fit=()=>{if(!this.dialog.open)return;const v=visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight,r=document.documentElement.classList.contains('landscape-auto');Object.assign(this.dialog.style,{left:`${(v?.offsetLeft||0)+(r?w:0)}px`,top:`${v?.offsetTop||0}px`,width:`${r?h:w}px`,height:`${r?w:h}px`,transform:r?'rotate(90deg)':'none',transformOrigin:'0 0'});};
  this.fit=fit;window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);window.visualViewport?.addEventListener('scroll',fit);
  new MutationObserver(fit).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 }
 text(value){const p=document.createElement('p');p.textContent=value;this.content.append(p);return p;}
 button(label,action,className=''){const button=document.createElement('button');button.type='button';button.textContent=label;button.className=className;button.onclick=action;this.content.append(button);return button;}
 link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';this.content.append(a);}
 show(title,fromSettings=this.fromSettings){
  this.fromSettings=!!fromSettings;this.content.replaceChildren();this.status.textContent='';this.dialog.querySelector('h2').textContent=title;
  if(!this.dialog.open)this.dialog.showModal();this.fit();
 }
 async action(work){
  if(this.busy)return;this.busy=true;this.status.textContent=_t('処理中…');this.dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{await work();}catch(error){this.status.textContent=error.message||_t('通信できませんでした。再試行してください。');}
  finally{this.busy=false;this.dialog.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
 row(row){
  this.show(_t('ランキングのメニュー'),false);this.text(row.player_name);
  this.button(_t('通報する'),()=>this.report(row),'safety-report');
  this.button(_t('このユーザーを非表示'),()=>this.action(async()=>{this.safety.hide(row);await this.ui.openOnline();this.show(_t('非表示にしました'),false);this.text(_t('名前が変わっても非表示になります。設定から解除できます。'));}),'safety-hide');
 }
 report(row){
  this.show(_t('通報理由を選ぶ'),false);this.text(_t('通報のため匿名IDを作成・使用します。名前は公開されません。運営が内容を確認します。'));
  for(const [reason,label] of Object.entries(reportReasons))this.button(label,()=>this.action(async()=>{
   const state=this.ui.auto.read();if(state.deleting)throw Error(_t('データの削除処理中です。'));
   const result=await this.ui.api.report(row.public_id,reason);
   this.show(_t('通報を受け付けました'),false);this.text(result.duplicate?_t('同じユーザーへの通報は受け付け済みです。'):_t('ご協力ありがとうございます。'));
  }),'safety-reason');
  this.link(_t('プライバシーポリシー'),support.privacy);
 }
 settings(){
  this.ui.editor.close();this.show(_t('ランキング・サポート'),true);
  this.button(_t('非表示にしたユーザー'),()=>this.hidden(),'safety-hidden-list');
  this.button(_t('ランキング参加・データ削除'),()=>this.confirmDelete(),'safety-delete-menu');
  this.link(_t('お問い合わせ'),`mailto:${support.email}`);this.text(support.email);
  this.link(_t('プライバシーポリシー'),support.privacy);
 }
 hidden(){
  this.show(_t('非表示にしたユーザー'),true);
  try{const rows=this.safety.hidden();if(!rows.length)this.text(_t('非表示にしているユーザーはいません。'));
   for(const row of rows)this.button(_t('{0}：解除',[row.name]),()=>this.action(async()=>{this.safety.unhide(row.id);this.hidden();}));
  }catch{this.status.textContent=_t('端末の設定を読み込めませんでした。');}
 }
 confirmDelete(){
  this.show(_t('ランキングのデータ削除'),true);
  this.text(_t('ランキングの名前・記録、匿名アカウント、通報履歴を削除します。元に戻せません。'));
  this.text(_t('部屋・図鑑・端末内の自己ベストは残ります。削除後は自動で再参加しません。'));
  this.button(_t('削除する'),()=>this.action(async()=>{
   clearTimeout(this.ui.retryTimer);await this.safety.removeAccount();this.ui.name.value='';this.ui.message.textContent='';
   this.ui.submit.hidden=false;this.ui.submit.textContent=_t('ランキングに参加');
   this.show(_t('削除しました'),true);this.text(_t('ランキングへの参加を終了しました。'));
  }),'safety-delete-confirm');
  this.text(_t('途中で通信が切れた場合は、ここから再試行できます。削除開始後の自動送信は停止します。'));
 }
}
