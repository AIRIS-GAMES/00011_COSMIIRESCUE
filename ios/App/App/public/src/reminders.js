export class Reminders {
 constructor(measure=()=>{}){this.measure=measure;}
 initialize(load=async()=>{const {registerPlugin}=await import('./vendor/capacitor-core-7.6.9.js');return {plugin:registerPlugin('CosmiiReminders')};}){
  if(this.loading)return this.loading;
  this.loading=(async()=>{try{this.plugin=(await load()).plugin;return true;}catch{return false;}})();return this.loading;
 }
 async played(active){try{await this.loading;if(this.plugin)await this.plugin.played({active});}catch{/* Reminders cannot interrupt a game. */}}
 async consume(){try{await this.loading;const result=await this.plugin?.consumeTaps();for(const tap of result?.taps||[])if(['d1','d7'].includes(tap.kind))this.measure('opened',tap.kind);}catch{}}
}
export function installReminders(measure){
 const reminders=new Reminders(measure);
 if(globalThis.Capacitor?.getPlatform?.()!=='ios')return reminders;
 const button=document.createElement('button');button.id='reminder-settings';button.type='button';button.hidden=true;button.textContent='🔔';button.setAttribute('aria-label','お知らせの設定');
 document.getElementById('title').append(button);
 const dialog=document.createElement('dialog');dialog.className='reminder-dialog';
 dialog.setAttribute('aria-labelledby','reminder-heading');
 dialog.innerHTML='<h2 id="reminder-heading">コスミーからお知らせ</h2><p>最後に遊んでから1日後・7日後に<br>お知らせします。</p><p class="reminder-status" role="status"></p><div><button type="button" class="reminder-toggle"></button><button type="button" class="reminder-ios" hidden>iPhoneの設定を開く</button><button type="button" class="reminder-close">とじる</button></div>';
 document.body.append(dialog);
 const status=dialog.querySelector('.reminder-status'),toggle=dialog.querySelector('.reminder-toggle'),settings=dialog.querySelector('.reminder-ios');
 let state={};
 const refresh=async()=>{
  try{state=await reminders.plugin.status();status.textContent=state.permission==='denied'?'iPhoneの設定で通知を許可してください':state.enabled&&state.permission==='granted'?'お知らせ：ON':'お知らせ：OFF';toggle.textContent=state.enabled?'お知らせをOFFにする':'お知らせを受け取る';toggle.hidden=state.permission==='denied'&&!state.enabled;settings.hidden=state.permission!=='denied';}
  catch{status.textContent='設定を読み込めませんでした';}
 };
 button.onclick=async()=>{dialog.showModal();await refresh();};
 dialog.querySelector('.reminder-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>button.focus());dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('keyup',e=>e.stopPropagation());
 toggle.onclick=async()=>{
  toggle.disabled=true;
  try{
   if(state.enabled){await reminders.plugin.disable();measure('disabled');}
   else{measure('permission_request');const result=await reminders.plugin.enable();measure(result.granted?'permission_granted':'permission_denied');}
   await refresh();
  }catch{status.textContent='設定を変更できませんでした。もう一度お試しください';}finally{toggle.disabled=false;}
 };
 settings.onclick=()=>reminders.plugin.openSettings().catch(()=>{status.textContent='設定を開けませんでした';});
 const resume=()=>{if(!document.hidden){reminders.consume();if(dialog.open)refresh();}};
 document.addEventListener('visibilitychange',resume);document.addEventListener('resume',resume);window.addEventListener('focus',resume);
  document.addEventListener('cosmiiReminderOpened',()=>reminders.consume());
 reminders.initialize().then(ready=>{button.hidden=!ready;if(ready)reminders.consume();});
 return reminders;
}
